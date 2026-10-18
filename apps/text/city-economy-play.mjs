import { open } from 'node:fs/promises';
import { constants } from 'node:fs';
import { stdin, stdout } from 'node:process';
import {
  createBoundedCityEconomyV1, inspectBoundedCityEconomyV1,
  previewBoundedCityEconomyV1, executeBoundedCityEconomyV1,
  listBoundedCityActionsV1, saveBoundedCityEconomyV1,
  loadBoundedCityEconomyV1, replayBoundedCityEconomyV1,
} from '../../packages/engine/src/bounded-city-economy.ts';
import { decodeBoundedCityJson, boundedCityJsonFits } from '../../packages/engine/src/internal/bounded-city-json.ts';

// This optional CLI is a fixed-city, fixed-turn episode, not a world scheduler.
const FILE_LIMIT = 8 * 1024 * 1024;
const LINE_LIMIT = 8 * 1024;
const fileVerbs = new Set(['create', 'load', 'replay', 'preview', 'execute', 'legal', 'save']);
const plainVerbs = new Set(['help', 'quit', 'inspect', 'trace']);
const cliError = reason => ({ ok: false, kind: 'city-economy-cli', reason });
const HELP = {
  scope: 'bounded-shared-city-episode',
  commands: ['help', 'quit', 'inspect', 'trace', 'create "scenario.json"', 'load "save.json"', 'replay "trace.json"', 'preview "command.json"', 'execute "command.json"', 'legal "request.json"', 'save "new-save.json"'],
  notes: ['Paths are literal JSON strings; no shell expansion or URL fetch.', 'Create/load/replay replace the in-memory session only on full success.', 'Execute commits only in memory. Save exclusively creates a new file; quit never saves.', 'No time advance, imported legacy state, shared world, or complete game legality.', 'Examples are synthetic; source-backed calculations and provisional policies remain distinct.'],
};
let session = null;
let quit = false;
let outputFailed = false;
stdout.on('error', () => { outputFailed = true; stdin.destroy(); });

async function emit(value) {
  if (outputFailed) return false;
  try {
    const line = JSON.stringify(value) + '\n';
    await new Promise((resolve, reject) => stdout.write(line, error => error ? reject(error) : resolve()));
    return true;
  } catch {
    // A completed in-memory action is never re-executed or rolled back on IO failure.
    outputFailed = true;
    stdin.destroy();
    return false;
  }
}

function parseLine(bytes) {
  if (bytes.length > LINE_LIMIT) return cliError('budget-exceeded');
  let line;
  try {
    if (bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) return cliError('invalid-cli-input');
    line = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch { return cliError('invalid-cli-input'); }
  if (line.endsWith('\r')) line = line.slice(0, -1);
  const match = /^([a-z]+)(?:[ \t]+([\s\S]*))?$/.exec(line);
  if (!match || match[0].length !== line.length) return cliError('invalid-cli-input');
  const verb = match[1], tail = (match[2] ?? '').replace(/[ \t]+$/, '');
  if (plainVerbs.has(verb)) return tail === '' ? { ok: true, verb } : cliError('invalid-cli-input');
  if (!fileVerbs.has(verb) || tail === '') return cliError('invalid-cli-input');
  const token = /^"(?:[^"\\\u0000-\u001f]|\\(?:["\\/bfnrt]|u[0-9a-fA-F]{4}))*"/.exec(tail);
  if (!token || token[0].length !== tail.length) return cliError('invalid-cli-input');
  const parsed = decodeBoundedCityJson(tail);
  if (!parsed.ok || typeof parsed.value !== 'string' || parsed.value.length === 0 || parsed.value.includes('\0')) return cliError('invalid-cli-input');
  return { ok: true, verb, path: parsed.value };
}

async function readBounded(path) {
  let handle;
  try {
    // Nonblocking open prevents a FIFO substituted before fstat from hanging input.
    handle = await open(path, constants.O_RDONLY | constants.O_NONBLOCK);
    const stat = await handle.stat();
    if (!stat.isFile()) return cliError('not-regular-file');
    if (stat.size > FILE_LIMIT) return cliError('budget-exceeded');
    const chunks = [];
    let total = 0;
    while (true) {
      const buffer = Buffer.alloc(Math.min(65536, FILE_LIMIT + 1 - total));
      const { bytesRead } = await handle.read(buffer, 0, buffer.length, null);
      if (bytesRead === 0) break;
      total += bytesRead;
      if (total > FILE_LIMIT) return cliError('budget-exceeded');
      chunks.push(buffer.subarray(0, bytesRead));
    }
    const bytes = Buffer.concat(chunks, total);
    if (bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) return cliError('invalid-cli-input');
    let text;
    try { text = new TextDecoder('utf-8', { fatal: true }).decode(bytes); }
    catch { return cliError('invalid-cli-input'); }
    const decoded = decodeBoundedCityJson(text);
    if (!decoded.ok) return cliError(decoded.reason === 'budget-exceeded' ? 'budget-exceeded' : 'invalid-cli-input');
    return { ok: true, text, value: decoded.value };
  } catch { return cliError('io-error'); }
  finally { if (handle) await handle.close().catch(() => {}); }
}

async function handleLine(bytes) {
  const parsed = parseLine(bytes);
  if (!parsed.ok) return emit(parsed);
  const { verb, path } = parsed;
  if (verb === 'quit') { quit = true; return true; }
  if (verb === 'help') return emit(HELP);
  if (session === null && !['create', 'load', 'replay'].includes(verb)) return emit(cliError('no-session'));
  if (verb === 'inspect') return emit(inspectBoundedCityEconomyV1(session));
  if (verb === 'trace') {
    const trace = { tag: 'san11-bounded-city-economy-trace-v1', scenario: session.genesis,
      attempts: session.acceptedCommands.map(({ envelope, receipt }) => ({ envelope, expected: { ok: true, duplicate: false, receipt } })),
      expectedFinalState: session };
    return emit(boundedCityJsonFits(trace) ? trace : cliError('budget-exceeded'));
  }
  if (verb === 'save') {
    const result = saveBoundedCityEconomyV1(session);
    if (!result.ok) return emit(result);
    let handle;
    try {
      handle = await open(path, 'wx');
      await handle.writeFile(result.serialized, 'utf8');
      await handle.close(); handle = null;
      return emit({ ok: true, kind: 'city-economy-cli', saved: true, memoryCommitted: false });
    } catch {
      // A partial newly-created file may remain. Never delete, overwrite, retry or execute again.
      return emit({ ...cliError('io-error'), partialNewFileMayRemain: true });
    } finally { if (handle) await handle.close().catch(() => {}); }
  }
  const input = await readBounded(path);
  if (!input.ok) return emit(input);
  let result;
  if (verb === 'create') result = createBoundedCityEconomyV1(input.value);
  else if (verb === 'load') result = loadBoundedCityEconomyV1(input.text);
  else if (verb === 'replay') result = replayBoundedCityEconomyV1(input.value);
  else if (verb === 'preview') result = previewBoundedCityEconomyV1(session, input.value);
  else if (verb === 'execute') result = executeBoundedCityEconomyV1(session, input.value);
  else result = listBoundedCityActionsV1(session, input.value);
  if (result.ok && ['create', 'load', 'replay', 'execute'].includes(verb)) session = result.state;
  return emit(result);
}

await emit(HELP);
// Bounded byte accumulation before decoding: oversized lines are discarded through newline.
let parts = [], size = 0, oversized = false;
try {
  if (!outputFailed) for await (const chunk of stdin) {
    const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    let offset = 0;
    while (offset < bytes.length && !quit && !outputFailed) {
      const newline = bytes.indexOf(10, offset);
      const end = newline < 0 ? bytes.length : newline;
      const length = end - offset;
      if (!oversized) {
        if (size + length > LINE_LIMIT) { oversized = true; parts = []; size = 0; }
        else { parts.push(Buffer.from(bytes.subarray(offset, end))); size += length; }
      }
      if (newline < 0) break;
      if (oversized) await emit(cliError('budget-exceeded'));
      else await handleLine(Buffer.concat(parts, size));
      parts = []; size = 0; oversized = false; offset = newline + 1;
    }
    if (quit || outputFailed) break;
  }
  if (!quit && !outputFailed) {
    if (oversized) await emit(cliError('budget-exceeded'));
    else if (size > 0) await handleLine(Buffer.concat(parts, size));
  }
} catch { if (!outputFailed) await emit(cliError('io-error')); }
