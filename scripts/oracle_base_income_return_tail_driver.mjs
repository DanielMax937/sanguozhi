// Only public product exports are imported. No oracle, expected formula, or byte pins.
import readline from 'node:readline';
import {calculateBaseIncomeReturnTail as calculate, BASE_INCOME_RETURN_TAIL as source} from '../packages/engine/src/index.ts';
const frozen=x=>x===null||typeof x!=='object'||Object.isFrozen(x)&&Object.values(x).every(frozen);
function canonical(x,path=[]){
 if(typeof x==='number'&&(!Number.isSafeInteger(x)||Object.is(x,-0))){const error=Error('noncanonical-receipt-number');error.path=path;error.negativeZero=Object.is(x,-0);error.numberClass=Object.is(x,-0)?'negative-zero':!Number.isFinite(x)?'non-finite':'not-safe-integer';throw error;}
 if(x&&typeof x==='object')for(const [key,v] of Object.entries(x))canonical(v,[...path,key]);
}
for await(const line of readline.createInterface({input:process.stdin,crlfDelay:Infinity})){
 if(!line)continue;const input=JSON.parse(line);const before=JSON.stringify(input);const result=calculate(input);
 try {
  if(JSON.stringify(input)!==before)throw Error('input-mutated');if(!frozen(result))throw Error('mutable-receipt');canonical(result);
  if(JSON.stringify(result.evidence)!==JSON.stringify(source.evidence))throw Error('evidence-changed');
 } catch(error) {
  process.stderr.write('BASE_TAIL_INVARIANT '+JSON.stringify({kind:error.message,input,result,path:error.path??null,negativeZero:error.negativeZero??false,numberClass:error.numberClass??null})+'\n');
  process.exit(20);
 }
 if(!process.stdout.write(JSON.stringify(result)+'\n'))await new Promise(resolve=>process.stdout.once('drain',resolve));
}
