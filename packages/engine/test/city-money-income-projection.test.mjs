import test from 'node:test';
import assert from 'node:assert/strict';
import {calculateCityMoneyIncomeProjection as calculate, CITY_MONEY_INCOME_PROJECTION as source} from '../src/index.ts';
const profile = 'city-money-income-stable-resolved-i32-safe-v1';
const input = (extra = {}) => ({profile, baseMoneyWord: 0, slots: Array(30).fill(null), resolvedTypeRows: {}, difficultyWord: 1, securityByte: 100, ...extra});
const slot = (type, construction = 1, mint) => ({facilityTypeWord: type, constructionWord: construction, ...(mint === undefined ? {} : {adjacentMint: mint})});
const one = (s, rows, extra = {}) => input({slots: [s, ...Array(29).fill(null)], resolvedTypeRows: rows, ...extra});
const row = y => ({valid: true, moneyYieldWord: y});
function good(i, expected) { const r = calculate(i); assert.equal(r.supported, true); assert.equal(r.returnedIncome, expected); assert.equal(r.evidence, source.evidence); assert.ok(Object.isFrozen(r)); assert.ok(Object.isFrozen(r.slots)); assert.ok(Object.isFrozen(r.intermediates)); for (const x of r.slots) assert.ok(Object.isFrozen(x)); return r; }
function bad(i, reason) { assert.deepEqual(calculate(i), {supported: false, reason, evidence: source.evidence}); }

test('city money: zero is supported and distinct from rejection', () => {
  const r = good(input(), 0); assert.equal(r.slots.length, 30); assert.equal(r.rawMoney, 0);
  assert.ok(r.slots.every(x => x.status === 'invalid-slot' && x.contribution === 0));
  assert.deepEqual(r.intermediates, {scaledRaw: 0, difficultyProduct: null, difficultyAdjusted: 0, securityProduct: 0, securityAdjusted: 0});
});
test('city money: all six type dispatches, upgrade fallback and nonzero DWORD construction', () => {
  const rows = {31: row(101), 46: row(202), 47: row(303), 48: row(404), 50: row(505), 51: row(606)};
  for (const t of [31, 46, 47, 48, 50, 51]) {
    const m = [31, 50, 51].includes(t);
    for (const c of [1, 2, 255, 0x80000000, 0xFFFFFFFF]) {
      const r = good(one(slot(t, c, m ? false : undefined), rows), rows[t].moneyYieldWord);
      assert.equal(r.slots[0].effectiveType, t);
    }
    const r = good(one(slot(t, 0, t >= 50 ? false : undefined), rows), t === 50 ? 101 : t === 51 ? 505 : 0);
    assert.equal(r.slots[0].effectiveType, t === 50 ? 31 : t === 51 ? 50 : null);
  }
});
test('city money: actual jump-table non-income types do not require a type row', () => {
  for (const t of [0, 1, 30, ...Array.from({length: 21}, (_, i) => 31+i).filter(x => ![31,46,47,48,50,51].includes(x)), 52, 255, 0x7FFFFFFF, 0x80000000, 0xFFFFFFFF]) {
    const r = good(one(slot(t), {}), 0); assert.equal(r.slots[0].status, 'ignored-type');
  }
});
test('city money: mint applies only to a valid effective ordinary market and floors odd yields', () => {
  for (const t of [31, 50, 51]) for (const y of [0, 1, 2, 3, 99, 65535]) {
    good(one(slot(t, 1, true), {[t]: row(y)}), Math.floor(3*y/2));
    good(one(slot(t, 1, false), {[t]: row(y)}), y);
  }
  for (const t of [46,47,48]) {
    good(one(slot(t), {[t]: row(101)}), 101);
    bad(one(slot(t, 1, true), {[t]: row(101)}), 'unexpected-field');
  }
  good(one(slot(50, 0, true), {31: row(3), 50: row(999)}), 4);
  good(one(slot(51, 0, true), {50: row(3), 51: row(999)}), 4);
});
test('city money: missing data never silently becomes invalid or zero', () => {
  bad(one(slot(31,1,false), {}), 'missing-type-row');
  bad(one(slot(50,0,false), {50: row(10)}), 'missing-type-row');
  bad(one(slot(51,0,false), {51: row(10)}), 'missing-type-row');
  bad(one(slot(31), {31: row(0)}), 'missing-adjacent-mint');
  good(one(slot(31), {31: {valid:false}}), 0);
  bad(one(slot(31,1,false), {31: {valid:false}}), 'unexpected-field');
  bad(one(slot(31,0,false), {}), 'unexpected-field');
  bad(one(slot(32,1,false), {}), 'unexpected-field');
});
test('city money: difficulty paths and late U8 security use the original sequential integer order', () => {
  for (const [difficultyWord, player, percent] of [[0,undefined,125],[1,undefined,100],[2,true,75],[2,false,125],[3,undefined,100],[0x80000000,undefined,100],[0xFFFFFFFF,undefined,100]]) {
    for (const s of [0,1,49,50,51,99,100,101,254,255]) {
      const r=good(input({baseMoneyWord: 123, difficultyWord, ...(player === undefined ? {} : {cityPlayerPredicate:player}), securityByte:s}), Math.floor(123*percent*Math.max(50,s)/10000));
      assert.equal(r.difficultyPercent,percent); assert.equal(r.effectiveSecurity,Math.max(50,s));
      assert.equal(r.intermediates.scaledRaw,12300);
      assert.equal(r.intermediates.difficultyProduct,percent===100?null:12300*percent);
    }
  }
  good(input({baseMoneyWord:65535,securityByte:255}),167114);
  bad(input({difficultyWord:2}),'invalid-input');
  bad(input({difficultyWord:2,cityPlayerPredicate:1}),'invalid-input');
  bad(input({cityPlayerPredicate:false}),'unexpected-field');
  bad(input({difficultyWord:0,cityPlayerPredicate:true}),'unexpected-field');
});
test('city money: all thirty slots and the stable effective-type table are consumed', () => {
  const r=good(input({baseMoneyWord:7,slots:Array.from({length:30},()=>slot(46)),resolvedTypeRows:{46:row(3)}}),97);
  assert.equal(r.rawMoney,97); assert.equal(r.slots[29].contribution,3);
  const shared=slot(51,0,true); const i=input({slots:Array(30).fill(shared),resolvedTypeRows:{50:row(3)}});
  const before=structuredClone(i); good(i,120); assert.deepEqual(i,before);
});
const rawInput = (raw, difficultyWord = 1, securityByte = 100, cityPlayerPredicate) => {
  const slots=Array(30).fill(null); let remaining=raw;
  const baseMoneyWord=Math.min(remaining,65535); remaining-=baseMoneyWord;
  const rows={46:row(65535),47:row(remaining%65535)}; let index=0;
  while(remaining>=65535) { slots[index++]=slot(46); remaining-=65535; }
  if(remaining) slots[index]=slot(47);
  return input({baseMoneyWord,slots,resolvedTypeRows:rows,difficultyWord,securityByte,...(cityPlayerPredicate===undefined?{}:{cityPlayerPredicate})});
};
test('city money: path-specific signed32 overflow rejection, including intermediate-only overflow', () => {
  good(rawInput(67372,0,255),214748);
  bad(rawInput(67373,0,255),'unsupported-arithmetic-domain');
  good(rawInput(171798,0,50),107373);
  bad(rawInput(171799,0,50),'unsupported-arithmetic-domain');
  good(rawInput(286331,2,50,true),107374);
  bad(rawInput(286332,2,50,true),'unsupported-arithmetic-domain');
  bad(rawInput(300000,2,50,true),'unsupported-arithmetic-domain');
  good(rawInput(84215,1,255),214748);
  bad(rawInput(84216,1,255),'unsupported-arithmetic-domain');
  good(rawInput(429496,1,50),214748);
  bad(rawInput(429497,1,50),'unsupported-arithmetic-domain');
  bad(rawInput(200000,0,100),'unsupported-arithmetic-domain');
  good(rawInput(200000,1,50),100000); // Must not invent a normal-difficulty multiply by 100.
  bad(input({baseMoneyWord:65535,slots:Array.from({length:30},()=>slot(31,1,true)),resolvedTypeRows:{31:row(65535)}}),'unsupported-arithmetic-domain');
});
test('city money: strict finite field widths and explicit profiles', () => {
  for (const [key,max] of [['baseMoneyWord',65535],['difficultyWord',0xFFFFFFFF],['securityByte',255]]) {
    for (const value of [-1,max+1,1.5,NaN,Infinity,'1',true,null,undefined]) bad(input({[key]:value}),'invalid-input');
  }
  for(const key of ['facilityTypeWord','constructionWord']) for(const value of [-1,0x100000000,1.5,NaN,Infinity,'1',true,null,undefined])
    bad(one({...slot(46),[key]:value},{46:row(1)}),'invalid-input');
  for(const y of [-1,65536,0.5,NaN,Infinity,true,'2',null,undefined]) bad(one(slot(46),{46:row(y)}),'invalid-input');
  for(const x of [null,undefined,0,'',[],new Date()]) bad(x,'invalid-input');
  bad(input({profile:'other'}),'unsupported-profile');
  bad(input({helperIncome:5}),'unexpected-field');
  bad(input({resolvedTypeRows:{32:row(1)}}),'unexpected-field');
  bad(input({resolvedTypeRows:{31:{valid:false,moneyYieldWord:0}}}),'unexpected-field');
  bad(input({resolvedTypeRows:{31:{valid:1}}}),'invalid-input');
  bad(one({...slot(46),unknown:1},{46:row(1)}),'unexpected-field');
  bad(one(slot(31,1,1),{31:row(1)}),'invalid-input');
});
test('city money: closed descriptors, dense arrays and detached deeply frozen receipts', () => {
  for(const count of [0,29,31]) bad(input({slots:Array(count).fill(null)}),'invalid-input');
  bad(input({slots:Array(30)}),'invalid-input');
  const extra=Array(30).fill(null); extra.extra=0; bad(input({slots:extra}),'unexpected-field');
  const symbol=input(); symbol[Symbol('x')]=1; bad(symbol,'unexpected-field');
  const inherited=Object.create(input()); bad(inherited,'invalid-input');
  const protoSlots=Array(30).fill(null); Object.setPrototypeOf(protoSlots,null); bad(input({slots:protoSlots}),'invalid-input');
  let invoked=0; const accessor=input(); Object.defineProperty(accessor,'baseMoneyWord',{get(){invoked++;return 1;}}); bad(accessor,'invalid-input');
  const slotAccessor=slot(46);Object.defineProperty(slotAccessor,'constructionWord',{get(){invoked++;return 1;}});bad(one(slotAccessor,{46:row(1)}),'invalid-input');
  const arrayAccessor=Array(30).fill(null);Object.defineProperty(arrayAccessor,'0',{get(){invoked++;return null;}});bad(input({slots:arrayAccessor}),'invalid-input');
  const rowAccessor=row(1);Object.defineProperty(rowAccessor,'moneyYieldWord',{get(){invoked++;return 1;}});bad(input({resolvedTypeRows:{31:rowAccessor}}),'invalid-input');
  assert.equal(invoked,0);
  const i=one(slot(46),{46:row(7)});const r=good(i,7);i.slots[0].facilityTypeWord=31;i.resolvedTypeRows[46].moneyYieldWord=99;assert.equal(r.slots[0].contribution,7);
  const n=input({baseMoneyWord:-0,difficultyWord:-0,securityByte:-0});const z=good(n,0);for(const k of ['baseMoneyWord','difficultyWord','securityByte','rawMoney','returnedIncome'])assert.ok(!Object.is(z[k],-0));
  const nullProto=Object.assign(Object.create(null),input());good(nullProto,0);
  assert.ok(Object.isFrozen(source.evidence));
});
test('city money: all nested structures are closed, required and data-only', () => {
  for (const key of ['profile','baseMoneyWord','slots','resolvedTypeRows','difficultyWord','securityByte']) {
    const i=input(); delete i[key]; bad(i,'invalid-input');
  }
  for (const value of [null,[],1,'rows',new Date()]) bad(input({resolvedTypeRows:value}),'invalid-input');
  for (const value of [null,[],1,'row',new Date(),{}]) bad(input({resolvedTypeRows:{31:value}}),'invalid-input');
  for (const value of [undefined,1,[],new Date(),{}]) bad(one(value,{}),'invalid-input');
  for (const key of ['facilityTypeWord','constructionWord']) {const s=slot(46);delete s[key];bad(one(s,{46:row(1)}),'invalid-input');}
  const extra=row(1);extra.other=2;bad(input({resolvedTypeRows:{31:extra}}),'unexpected-field');
  const symbolRow=row(1);symbolRow[Symbol('field')]=1;bad(input({resolvedTypeRows:{31:symbolRow}}),'unexpected-field');
  const symbolSlot=slot(46);symbolSlot[Symbol('field')]=1;bad(one(symbolSlot,{46:row(1)}),'unexpected-field');
  const symbolRows={};symbolRows[Symbol('type')]=row(1);bad(input({resolvedTypeRows:symbolRows}),'unexpected-field');
  const getterRows={};Object.defineProperty(getterRows,'31',{get(){throw Error('must not invoke type-row getter');}});bad(input({resolvedTypeRows:getterRows}),'invalid-input');
  const nullRows=Object.assign(Object.create(null),{'46':Object.assign(Object.create(null),row(1))});
  good(one(Object.assign(Object.create(null),slot(46)),nullRows),1);
  for(const s of [undefined,null,'true',0]) bad(one({...slot(31),adjacentMint:s},{31:row(1)}),'invalid-input');
});
