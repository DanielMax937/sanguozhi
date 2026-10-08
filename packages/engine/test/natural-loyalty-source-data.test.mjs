import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// Static caller evidence only: no engine import, person predicate, RNG or writer.
test('natural-loyalty source boundary and counterexample validation', () => {
  const cwd = fileURLToPath(new URL('../../../', import.meta.url));
  const result = spawnSync('python', ['-B', 'scripts/test_natural_loyalty_candidate_boundary.py'], {
    cwd, encoding: 'utf8', maxBuffer: 1024 * 1024,
    env: { ...process.env, PYTHONDONTWRITEBYTECODE: '1' },
  });
  assert.ifError(result.error);
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  assert.match(result.stderr, /Ran 25 tests/);
  assert.match(result.stderr, /\bOK\b/);
});
