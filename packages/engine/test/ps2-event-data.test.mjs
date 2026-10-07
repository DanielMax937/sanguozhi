import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// Static guide QA only: no engine import, trigger evaluation, event scheduler,
// native-ID claim or game-state mutation. Existing corpora remain byte-identical.
test('independent PS2 source corpus and adversarial static validation', () => {
  const cwd = fileURLToPath(new URL('../../../', import.meta.url));
  const result = spawnSync('python', ['-B', 'scripts/test_ps2_events.py'], {
    cwd, encoding: 'utf8', maxBuffer: 1024 * 1024,
    env: { ...process.env, PYTHONDONTWRITEBYTECODE: '1' },
  });
  assert.ifError(result.error);
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  assert.match(result.stderr, /Ran \d+ tests/);
  assert.match(result.stderr, /\bOK\b/);
});
