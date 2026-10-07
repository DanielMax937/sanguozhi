import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
// Static-source QA only: no engine import, event evaluation, scheduler or effects.
test('independent generic source corpus and adversarial validation', () => {
  const cwd = fileURLToPath(new URL('../../../', import.meta.url));
  const result = spawnSync('python', ['-B', 'scripts/test_generic_events.py'], {
    cwd, encoding: 'utf8', maxBuffer: 1024 * 1024,
    env: { ...process.env, PYTHONDONTWRITEBYTECODE: '1' },
  });
  assert.ifError(result.error);
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  assert.match(result.stderr, /Ran \d+ tests/);
  assert.match(result.stderr, /\bOK\b/);
});
