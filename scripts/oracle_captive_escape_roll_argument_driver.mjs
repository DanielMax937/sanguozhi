// Public-API driver only: no formula, oracle table, fixture or source mnemonic.
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {calculateCaptiveEscapeRollArgument as calculate, CAPTIVE_ESCAPE_ROLL_ARGUMENT as source} from '../packages/engine/src/index.ts';
const profile = 'captive-escape-roll-argument-u8-v1';
const fields = ['selectedMaximumByte', 'effectiveStat', 'effectiveMonthFactor', 'numerator', 'rollArgument'];
function run(bl, al, month, buffer, offset) {
  const input = {profile, savedBlU8: bl, currentAlU8: al, lateCaptiveMonthsU8: month};
  const result = calculate(input);
  if (result.supported !== true || result.profile !== profile || result.evidence !== source.evidence
      || !Object.isFrozen(result) || !Object.isFrozen(result.evidence)) throw Error('public receipt contract');
  for (const [key, value] of Object.entries(input)) if (result[key] !== value) throw Error('input echo mismatch');
  if (Object.keys(result).sort().join(',') !== [...Object.keys(input), 'supported', 'evidence', ...fields].sort().join(',')) throw Error('receipt fields changed');
  fields.forEach((key, i) => {
    const value = result[key];
    if (!Number.isSafeInteger(value) || value < 0 || value > 0xFFFFFFFF || Object.is(value, -0)) throw Error('non-canonical integer');
    buffer.writeUInt32LE(value, offset + i * 4);
  });
}
if (process.argv.length === 3 && process.argv[2] === '--exhaustive') {
  const hash = createHash('sha256'); const block = Buffer.alloc(256 * 256 * 20); let comparisons = 0;
  for (let bl = 0; bl < 256; bl++) {
    let offset = 0;
    for (let al = 0; al < 256; al++) for (let month = 0; month < 256; month++) {
      run(bl, al, month, block, offset); offset += 20; comparisons++;
    }
    hash.update(block);
  }
  process.stdout.write(JSON.stringify({comparisons, sha256: hash.digest('hex')}));
} else if (process.argv.length === 2) {
  const input = fs.readFileSync(0); if (input.length % 3) throw Error('malformed input triples');
  const output = Buffer.alloc(input.length / 3 * 20);
  for (let i = 0; i < input.length; i += 3) run(input[i], input[i + 1], input[i + 2], output, i / 3 * 20);
  process.stdout.write(output);
} else throw Error('unsupported arguments');
