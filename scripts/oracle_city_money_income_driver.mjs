// Public entrypoint probe only; no formula, source decoder or oracle data.
import fs from 'node:fs';
import {calculateCityMoneyIncomeProjection as calculate, CITY_MONEY_INCOME_PROJECTION as source} from '../packages/engine/src/index.ts';
const profile = 'city-money-income-stable-resolved-i32-safe-v1';
for (const line of fs.readFileSync(0, 'utf8').split('\n')) {
  if (!line) continue;
  const input = JSON.parse(line);
  const before = JSON.stringify(input);
  const result = calculate(input);
  if (JSON.stringify(input) !== before) throw Error('public API mutated caller input');
  if (result.supported) {
    if (result.profile !== profile || result.evidence !== source.evidence || !Object.isFrozen(result)) throw Error('receipt contract');
    for (const field of ['baseMoneyWord', 'difficultyWord', 'securityByte']) if (result[field] !== input[field]) throw Error('input observation echo mismatch');
    const frozen = value => value === null || typeof value !== 'object' || Object.isFrozen(value) && Object.values(value).every(frozen);
    if (!frozen(result)) throw Error('nested receipt container is mutable');
    for (const field of ['returnedIncome', 'rawMoney', 'difficultyPercent', 'effectiveSecurity']) {
      if (!Number.isSafeInteger(result[field]) || result[field] < 0 || Object.is(result[field], -0)) throw Error('noncanonical numeric receipt');
    }
  }
  process.stdout.write(JSON.stringify(result) + '\n');
}
