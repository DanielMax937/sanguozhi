import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseInput } from '../../../apps/text/parse-input.mjs';
import { createSession, dispatch, loadGame, saveGame, syntheticScenario } from '../src/index.ts';

const program = fileURLToPath(new URL('../../../apps/text/play.mjs', import.meta.url));
const train = {type:'Train', baseId:'city1', officerIds:['o1','o2','o3']};
const initial = createSession(syntheticScenario());
const trained = dispatch(initial, train).session;
const ended = dispatch(initial, {type:'EndTurn'}).session;
const serialized = session => saveGame(session) + '\n';
async function fixture(body) {
  const directory = await mkdtemp(join(tmpdir(), 'san11-text-cli-'));
  function run(input, args = []) {
    const result = spawnSync(process.execPath, [program, ...args], {cwd:directory, input, encoding:'utf8', timeout:30000});
    assert.ifError(result.error);
    assert.equal(result.signal, null);
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stderr, '');
    return result.stdout;
  }
  try { await body(directory, run); }
  finally { await rm(directory, {recursive:true, force:true}); }
}

for (const [line, expected] of [
  ['', null], [' \t\r ', null],
  ['  train\to1,o2,o3  city1 ', {verb:'train', args:['o1,o2,o3','city1']}],
  ['save "存档目录/训练 存档.json"', {verb:'save', args:['存档目录/训练 存档.json']}],
  ["load 'save with spaces.json'", {verb:'load', args:['save with spaces.json']}],
  ['save "O\'Brien save.json"', {verb:'save', args:["O'Brien save.json"]}],
  ['save O\'Brien.json', {verb:'save', args:["O'Brien.json"]}],
  [String.raw`save "C:\games\my save.json"`, {verb:'save', args:[String.raw`C:\games\my save.json`]}],
  [String.raw`save \\server\save.json`, {verb:'save', args:[String.raw`\\server\save.json`]}],
  ['save "$HOME/~literal.json"', {verb:'save', args:['$HOME/~literal.json']}],
  ['constructor', {verb:'constructor', args:[]}],
]) test(`text command tokenization: ${JSON.stringify(line)}`, () => assert.deepEqual(parseInput(line), expected));

for (const verb of ['end','inspect','trace','replay','help','quit','exit']) {
  test(`text ${verb} rejects any argument`, () => {
    assert.deepEqual(parseInput(verb), {verb, args:[]});
    assert.throws(() => parseInput(`${verb} extra`), /用法/);
    assert.throws(() => parseInput(`${verb} ""`), /用法/);
  });
}
for (const verb of ['save','load']) {
  test(`text ${verb} accepts at most one nonempty path`, () => {
    assert.deepEqual(parseInput(verb), {verb, args:[]});
    assert.deepEqual(parseInput(`${verb} one.json`), {verb, args:['one.json']});
    for (const tail of ['one.json two.json', 'one.json two.json three.json', '""', "''"]) {
      assert.throws(() => parseInput(`${verb} ${tail}`), /用法/);
    }
  });
}
for (const verb of ['train','preview']) {
  test(`text ${verb} requires officers with only an optional base`, () => {
    assert.deepEqual(parseInput(`${verb} o1`), {verb, args:['o1']});
    assert.deepEqual(parseInput(`${verb} "o1,o2" 'city1'`), {verb, args:['o1,o2','city1']});
    for (const tail of ['', '""', 'o1 ""', 'o1 city1 extra']) assert.throws(() => parseInput(`${verb} ${tail}`), /用法/);
  });
}
for (const line of ['save "unfinished', "load 'unfinished", 'save "file.json"extra', "save 'file.json'\"extra\"", 'save "file.json";']) {
  test(`text malformed quoting is rejected: ${line}`, () => assert.throws(() => parseInput(line), /引号/));
}

test('CLI saves and loads a complete quoted path, preserving non-ASCII and the opposite quote', async () => fixture(async (dir, run) => {
  await mkdir(join(dir, '存档 目录'));
  const name = "存档 目录/O'Brien 训练.json";
  const output = run(`train o1,o2,o3\nsave "${name}"\nend\nload "${name}"\nsave 'round trip.json'\nreplay\nquit\n`);
  assert.doesNotMatch(output, /操作未完成/);
  assert.match(output, /重放一致：1条命令/);
  assert.equal(await readFile(join(dir, name), 'utf8'), serialized(trained));
  assert.equal(await readFile(join(dir, 'round trip.json'), 'utf8'), serialized(trained));
  assert.deepEqual((await readdir(dir)).sort(), ['round trip.json', '存档 目录'].sort());
}));

test('CLI rejects missing, empty, extra and malformed arguments before any effect and continues', async () => fixture(async (dir, run) => {
  await writeFile(join(dir, 'other.json'), serialized(ended));
  const invalid = [
    'train', 'preview', 'train ""', 'train o1 ""', 'preview ""',
    'train o1,o2,o3 city1 extra', 'preview o1 city1 extra',
    'end extra', 'inspect extra', 'trace extra', 'replay extra', 'help extra',
    'save wrong.json extra', 'load other.json extra', 'save ""', "load ''",
    'save "unfinished', "load 'unfinished", 'save "wrong.json"suffix',
    'quit extra', 'exit extra',
  ];
  const output = run([...invalid, 'save state.json', 'quit'].join('\n') + '\n');
  assert.equal(output.match(/操作未完成：/g)?.length, invalid.length);
  assert.equal(await readFile(join(dir, 'state.json'), 'utf8'), serialized(initial));
  assert.deepEqual((await readdir(dir)).sort(), ['other.json','state.json']);
}));

test('CLI blank lines are silent no-ops; unknown verbs do not change the session', async () => fixture(async (dir, run) => {
  const output = run('\n \t \ntrain o1,o2,o3\n\nunknown\nconstructor\nsave state.json\nquit\n');
  assert.equal(output.match(/输入help查看命令/g)?.length, 2);
  assert.equal(await readFile(join(dir, 'state.json'), 'utf8'), serialized(trained));
}));

test('CLI failed load preserves the entire accepted state and trace across JSON, schema and replay failures', async () => fixture(async (dir, run) => {
  const tampered = JSON.parse(serialized(ended)); tampered.state.turn++;
  for (const [name, text] of [['broken.json','{broken'],['empty.json',''],['schema.json','{}'],['tampered.json',JSON.stringify(tampered)]]) {
    await writeFile(join(dir, name), text);
  }
  const output = run('train o1,o2,o3\nload broken.json\nload empty.json\nload schema.json\nload tampered.json\nload missing.json\nsave state.json\nreplay\nquit\n');
  assert.equal(output.match(/操作未完成：/g)?.length, 5);
  assert.match(output, /重放一致：1条命令/);
  assert.equal(await readFile(join(dir, 'state.json'), 'utf8'), serialized(trained));
}));

test('CLI existing-file collisions preserve bytes and session, including quoted paths and default save', async () => fixture(async (dir, run) => {
  await writeFile(join(dir, 'existing save.json'), 'external bytes\n');
  const output = run('save\ntrain o1,o2,o3\nsave\nsave "existing save.json"\nsave state.json\nquit\n');
  assert.equal(output.match(/EEXIST/g)?.length, 2);
  assert.equal(await readFile(join(dir, 'existing save.json'), 'utf8'), 'external bytes\n');
  assert.equal(await readFile(join(dir, 'training-save.json'), 'utf8'), serialized(initial));
  assert.equal(await readFile(join(dir, 'state.json'), 'utf8'), serialized(trained));
}));

test('CLI failed save in a missing directory preserves the session and continues', async () => fixture(async (dir, run) => {
  const output = run('train o1,o2,o3\nsave "missing directory/state.json"\nsave state.json\nquit\n');
  assert.match(output, /ENOENT/);
  assert.equal(await readFile(join(dir, 'state.json'), 'utf8'), serialized(trained));
}));

test('CLI EOF drains queued save/load commands and waits for a final save with no newline', async () => fixture(async (dir, run) => {
  const output = run('save\nend\nload\ntrain o1,o2,o3\nsave "EOF save.json"');
  assert.doesNotMatch(output, /操作未完成/);
  assert.match(output, /已校验并载入/);
  assert.equal(await readFile(join(dir, 'training-save.json'), 'utf8'), serialized(initial));
  assert.equal(await readFile(join(dir, 'EOF save.json'), 'utf8'), serialized(trained));
}));

test('CLI empty EOF and malformed final input terminate cleanly without writes', async () => fixture(async (dir, run) => {
  assert.doesNotMatch(run(''), /操作未完成/);
  assert.match(run('save "unfinished'), /操作未完成：引号未闭合/);
  assert.deepEqual(await readdir(dir), []);
}));

test('CLI quit and exit ignore subsequent queued input', async () => fixture(async (dir, run) => {
  for (const verb of ['quit','exit']) run(`${verb}\nsave ${verb}.json\n`);
  assert.deepEqual(await readdir(dir), []);
}));

test('CLI preview remains read-only and growth fixture uses the unchanged save schema', async () => fixture(async (dir, run) => {
  const output = run('preview o1,o2,o3\nsave state.json\nquit\n', ['--growth-fixture']);
  assert.match(output, /预览有效，未改变状态/);
  const session = loadGame(await readFile(join(dir, 'state.json'), 'utf8'));
  assert.equal(session.saveVersion, 2);
  assert.equal(session.engineVersion, 'training-kernel-v2');
  assert.equal(session.trace.length, 0);
  assert.ok(session.state.officers.every(person => person.warXp === 98));
}));
