// The public entrypoint is the only product import. No oracle/expected formula here.
import fs from 'node:fs';
import {calculateCityFoodIncomeProjection as calculate, CITY_FOOD_INCOME_PROJECTION as source} from '../packages/engine/src/index.ts';
const frozen = x => x === null || typeof x !== 'object' || Object.isFrozen(x) && Object.values(x).every(frozen);
const canonicalNumbers = x => {
  if (typeof x === 'number' && (!Number.isSafeInteger(x) || Object.is(x, -0))) throw Error('noncanonical receipt number');
  if (x && typeof x === 'object') for (const value of Object.values(x)) canonicalNumbers(value);
};
for (const line of fs.readFileSync(0, 'utf8').split('\n')) {
  if (!line) continue;
  const input = JSON.parse(line);
  const before = JSON.stringify(input);
  const result = calculate(input);
  if (JSON.stringify(input) !== before) throw Error('public API mutated caller input');
  if (!frozen(result)) throw Error('receipt container is mutable');
  if (JSON.stringify(result.evidence) !== JSON.stringify(source.evidence)) throw Error('evidence receipt mismatch');
  canonicalNumbers(result);
  process.stdout.write(JSON.stringify(result) + '\n');
}
