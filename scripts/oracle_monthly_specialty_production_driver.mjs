import readline from 'node:readline';
import assert from 'node:assert/strict';
import {calculateMonthlySpecialtyProduction as calculate} from '../packages/engine/src/monthly-specialty-production.ts';
function check(value){if(value!==null&&typeof value==='object'){assert.ok(Object.isFrozen(value),'mutable receipt');for(const child of Object.values(value))check(child);}else if(typeof value==='number'){assert.ok(Number.isFinite(value)&&!Object.is(value,-0),'noncanonical receipt number');}}
for await(const line of readline.createInterface({input:process.stdin,crlfDelay:Infinity})){
 const value=JSON.parse(line);const before=JSON.stringify(value);const result=calculate(value);check(result);assert.equal(JSON.stringify(value),before,'mutated input');process.stdout.write(JSON.stringify(result)+'\n');
}
