import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const api = await import(process.env.UNIT_FORMATION_ENGINE_URL ?? '../src/index.ts');
const fixtures = JSON.parse(readFileSync(new URL('./fixtures/unit-formation-vectors.json', import.meta.url), 'utf8'));
const copy = x => JSON.parse(JSON.stringify(x));
const success = r => { assert.equal(r.ok, true, JSON.stringify(r)); return r; };
const normal = () => copy(fixtures.normalScenario.fullRequest);
const capability = () => ({schemaVersion:1,scope:'detached-unit-capabilities',context:normal().context,profile:normal().profile});
const dispatch = q => q.scope === 'detached-unit-capabilities' ? api.calculateUnitCapabilities(q) : api.previewUnitFormation(q);
const saved = r => success(api.saveUnitFormationReceipt(r)).serialized;
const canon = v => v === null || typeof v !== 'object' ? JSON.stringify(v) : Array.isArray(v) ? '[' + v.map(canon).join(',') + ']' : '{' + Object.keys(v).sort().map(k => JSON.stringify(k)+':'+canon(v[k])).join(',') + '}';
function deepFrozen(v) { if(v && typeof v === 'object') { assert.ok(Object.isFrozen(v)); for(const x of Object.values(v)) deepFrozen(x); } }
function project(c) { return {attributes:c.attributes,aptitudes:c.aptitudes,hateOverride:c.relationships.hateOverride,deputyRelationships:c.relationships.deputies.map(d=>({deputyId:d.deputyId,relation:d.relation,divisor:d.divisor,candidate:{leadership:d.leadership.candidate,war:d.war.candidate}})),eliteApplied:c.elite.applied,panels:c.panels,raw:c.raw,selectedBaseMobility:c.equipmentRow.baseMobility}; }
function roundtrip(r) { const a=saved(r), replay=success(api.replayUnitFormationReceipt(a)); assert.equal(replay.verified,true); assert.deepEqual(replay.result,r); assert.equal(saved(replay.result),a); deepFrozen(replay); }
for(const c of fixtures.capabilityCases) test(`capability:${c.id}`,()=>{
  const q={...copy(c.input),profile:copy(fixtures.profiles[c.profileFixtureId])}, before=copy(q), r=success(api.calculateUnitCapabilities(q));
  assert.deepEqual(project(r.receipt.calculation),c.expected); assert.deepEqual(q,before); deepFrozen(r); roundtrip(r);
});
for(const c of fixtures.formationCases) test(`formation:${c.id}`,()=>{
  const q={...copy(c.input),profile:copy(fixtures.profiles[c.profileFixtureId])}, before=copy(q), r=success(api.previewUnitFormation(q)), x=r.receipt, e=c.expected;
  assert.equal(r.canForm,e.canForm); assert.equal(x.canForm,e.canForm); assert.deepEqual(x.limits,e.limits); assert.deepEqual(x.requiredEquipment,e.requiredEquipment); assert.deepEqual(x.shortfalls,e.shortfalls); assert.equal(x.unitspec!==null,e.unitSpecificationPresent);
  assert.deepEqual(project(x.calculation),e.capabilities); assert.deepEqual(x.capacityTrace.intrinsic,e.intrinsicCapacity);
  if(x.unitspec) { assert.deepEqual(x.unitspec.baseMobility,e.baseMobility); assert.deepEqual(x.unitspec.capacity,e.intrinsicCapacity); assert.deepEqual(x.unitspec.resources,{troops:q.requested.troops,gold:q.requested.gold,food:q.requested.food}); }
  assert.equal(x.sourceMutation,false); assert.equal(x.rngDraws,0); assert.deepEqual(q,before); deepFrozen(r); roundtrip(r);
});
for(const c of fixtures.invalidCases) test(`invalid:${c.id}`,()=>{ const q={...copy(c.input),profile:copy(fixtures.profiles[c.profileFixtureId])}; assert.deepEqual(dispatch(q),c.expected); });
test('normal: complete detached specification matches literal contract',()=>{const r=success(api.previewUnitFormation(normal()));assert.deepEqual(r.receipt.unitspec,fixtures.normalScenario.expectedUnitSpecification);});
test('receipt: exact arithmetic stages, source ties, relation terms and table traces',()=>{
  const q=normal(),r=success(api.previewUnitFormation(q)).receipt,c=r.calculation;
  assert.deepEqual(c.selectedAttributes,q.context.members.map(m=>({memberId:m.id,values:m.actual})));
  assert.deepEqual(c.relationships.deputies[1],{deputyId:'S2',relation:'blood',divisor:3,leadership:{positiveDiff:40,bonus:13,candidate:73},war:{positiveDiff:50,bonus:16,candidate:66}});
  assert.deepEqual(c.attributeSources,{leadership:['S2'],war:['S2'],intelligence:['S2'],politics:['S2'],charisma:['S2']});
  assert.deepEqual(c.aptitudeSources,{spear:['S1'],halberd:['S2'],crossbow:['S1'],cavalry:['S2'],siege:['S2'],navy:['S1']});
  assert.deepEqual(c.stages.attack,[{operation:'multiply',operand:{numerator:'105',denominator:'1'},result:{numerator:'6930',denominator:'1'}},{operation:'multiply',operand:{numerator:'9',denominator:'10'},result:{numerator:'6237',denominator:'1'}},{operation:'multiply',operand:{numerator:'1',denominator:'100'},result:{numerator:'6237',denominator:'100'}},{operation:'multiply',operand:{numerator:'1',denominator:'1'},result:{numerator:'6237',denominator:'100'}},{operation:'multiply',operand:{numerator:'1',denominator:'1'},result:{numerator:'6237',denominator:'100'}}]);
  assert.deepEqual(c.stages.construction.map(s=>[s.operation,s.result.numerator,s.result.denominator]),[['multiply','50','1'],['add','100','1'],['multiply','100','1'],['multiply','100','1']]);
  assert.deepEqual(r.capacityTrace.commandRow,{classId:'standard',capacity:10000});assert.deepEqual(r.capacityTrace.available,q.available);assert.equal(r.capacityTrace.cargoRows.length,12);
  for(const m of q.context.members) {m.actual=copy(q.context.members[0].actual);m.aptitude=copy(q.context.members[0].aptitude);}q.context.members[0].id='Z';q.context.members[1].id='a';q.context.members[2].id='A';q.context.relations.bloodPairs=[];
  const tied=success(api.previewUnitFormation(q)).receipt.calculation;for(const ids of [...Object.values(tied.attributeSources),...Object.values(tied.aptitudeSources)])assert.deepEqual(ids,['A','Z','a']);
});
test('receipt: every directed hate is retained sorted; all five sources reduce to main and aptitudes still share',()=>{
  const q=normal();q.context.relations.hates=[{from:'S2',to:'S1'},{from:'M',to:'S1'},{from:'S1',to:'M'}]; const c=success(api.previewUnitFormation(q)).receipt.calculation;
  assert.deepEqual(c.relationships,{hateOverride:true,hateEdges:[{from:'M',to:'S1'},{from:'S1',to:'M'},{from:'S2',to:'S1'}],deputies:[]});for(const ids of Object.values(c.attributeSources))assert.deepEqual(ids,['M']);assert.deepEqual(c.aptitudeSources.navy,['S1']);
});
test('immutability: no input alias or frozen source at any depth',()=>{
  const q=normal(),r=success(api.previewUnitFormation(q)),snapshot=copy(r);deepFrozen(r);
  q.context.members[0].actual.war=1;q.profile.equipmentTable.rows[1].baseAttack=1;q.available.troops=0;q.requested.troops=0;q.requested.cargo[1]=10;
  assert.deepEqual(r,snapshot);assert.equal(Object.isFrozen(q),false);assert.equal(Object.isFrozen(q.profile.equipmentTable.rows[1]),false);
  assert.throws(()=>{r.receipt.unitspec.resources.troops=1},TypeError);assert.throws(()=>{r.receipt.request.profile.equipmentTable.rows[1].baseAttack=1},TypeError);assert.deepEqual(r,snapshot);
});
const rejection = q => {const r=dispatch(q);assert.deepEqual(r,{ok:false,reason:'invalid-input',receipt:null});deepFrozen(r);};
test('safety: getters, nonenumerable and symbol keys, toJSON are never invoked',()=>{
  let calls=0;for(const key of ['context','profile']) {const q=normal();Object.defineProperty(q,key,{enumerable:true,get(){calls++;throw new Error('getter')}});assert.deepEqual(api.previewUnitFormation(q),{ok:false,reason:'invalid-input',receipt:null});}
  let q=normal();q.context.members[0].actual={get leadership(){calls++;return 60},war:50,intelligence:40,politics:45,charisma:30};rejection(q);
  q=normal();q.profile[Symbol('x')]=1;rejection(q);q=normal();Object.defineProperty(q,'hidden',{value:1});rejection(q);q=normal();q.toJSON=()=>{calls++;return normal()};rejection(q);assert.equal(calls,0);
});
test('safety: proxies rejected before all traps, including revoked and nested proxies',()=>{
  let calls=0;const traps={get(){calls++;throw 1},getPrototypeOf(){calls++;throw 1},ownKeys(){calls++;throw 1},getOwnPropertyDescriptor(){calls++;throw 1}};
  assert.deepEqual(api.previewUnitFormation(new Proxy(normal(),traps)),{ok:false,reason:'invalid-input',receipt:null});
  const q=normal();q.profile=new Proxy(q.profile,traps);rejection(q);const x=Proxy.revocable({},{});x.revoke();assert.equal(api.calculateUnitCapabilities(x.proxy).ok,false);assert.equal(calls,0);
});
test('safety: sparse or extra-property arrays, cycles, nonplain types, bad numbers rejected',()=>{
  const changes=[q=>{delete q.requested.cargo[11]},q=>{q.context.members.extra=1},q=>{q.context.members[0]=new Date()},q=>{q.profile=new Map()},q=>{q.profile=new Set()},q=>{q.profile=q},q=>{q.requested.gold=NaN},q=>{q.requested.gold=Infinity},q=>{q.requested.gold=-0},q=>{q.requested.gold=1.1},q=>{q.requested.gold=4294967296},q=>{q.context.members[0].id=()=>1},q=>{q.requested.gold=1n},q=>{q.requested.gold=undefined},q=>{q.requested.gold=-1}];for(const change of changes){const q=normal();change(q);rejection(q);}
});
test('safety: bounded depth, bytes and individual arrays before calculation',()=>{
  let nested={};for(let i=0;i<65;i++)nested={child:nested};let q=normal();q.extra=nested;rejection(q);q=normal();q.profile.equipmentTable.rows[0].name='x'.repeat(1024*1024);rejection(q);q=normal();q.profile.commandCapacityTable.rows=Array.from({length:4097},(_,i)=>({classId:'x'+i,capacity:1}));rejection(q);
  assert.deepEqual(api.replayUnitFormationReceipt(' '.repeat(1024*1024+1)),{ok:false,reason:'invalid-record'});
});
test('schema: exact fields and complete tables; invalid IDs, relations and kind mappings rejected',()=>{
  const changes=[q=>{q.profile.equipmentTable.rows.pop()},q=>{q.profile.equipmentTable.rows[1].id=0},q=>{q.profile.equipmentTable.rows[1].aptitudeKey='navy'},q=>{q.profile.equipmentTable.rows[1].baseAttack=0},q=>{q.profile.equipmentTable.rows[1].baseDefense=256},q=>{q.profile.commandCapacityTable.rows=[]},q=>{q.profile.commandCapacityTable.rows[0].capacity=65536},q=>{q.profile.commandCapacityTable.rows[1].classId='junior'},q=>{q.profile.capacityPolicy.pieceAndQuantityCaps.pop()},q=>{q.profile.capacityPolicy.pieceAndQuantityCaps[1].kind='piece'},q=>{q.profile.capacityPolicy.pieceAndQuantityCaps[0].cap=1},q=>{q.context.relations.bloodPairs=[['S2','M']]},q=>{q.context.relations.bloodPairs=[['M','S2'],['M','S2']]},q=>{q.context.relations.likes=[{from:'M',to:'S1'},{from:'M',to:'S1'}]},q=>{q.context.members[0].id=' M'},q=>{q.profile.id='-'},q=>{q.context.techniqueIds=[36]},q=>{q.available.equipment[9]=1},q=>{q.sourceBaseId=1},q=>{q.context.members[0].actual.finalPanel=10}];for(const change of changes){const q=normal();change(q);rejection(q);}
});
test('profiles: arbitrary complete custom ID works; reference ID locks complete content',()=>{
  const q=normal();q.profile.id='user.Custom:all-policies-2026';q.profile.evidenceLabel='synthetic-fixture';q.profile.equipmentTable.rows[1].baseAttack=255;q.profile.equipmentTable.rows[1].baseMobility=255;q.profile.commandCapacityTable.rows[1].capacity=6000;q.profile.relationPolicy.loveDirection='either-direction';q.profile.panelPrecision={id:'custom.grid',mode:'stage-grid-trunc',gridDenominator:1000000};q.profile.capacityPolicy.pieceAndQuantityCaps[5].cap=17;
  const r=success(api.previewUnitFormation(q));assert.equal(r.canForm,true);assert.equal(r.receipt.unitspec.capacity.troops,6000);assert.equal(r.receipt.unitspec.baseMobility.land,255);assert.equal(r.receipt.calculation.equipmentRow.baseAttack,255);assert.equal(r.receipt.evidence.table,'caller-supplied-fixture');roundtrip(r);
  assert.equal(r.receipt.profileFingerprint,createHash('sha256').update(canon(q.profile),'utf8').digest('hex'));
  q.profile.id=api.UNIT_FORMATION_REFERENCE_PROFILE.id;assert.equal(api.previewUnitFormation(q).reason,'unsupported-profile');
});
test('profiles: semantic modes and grid bounds reject; custom quantity and zero command caps are real',()=>{
  for(const precision of [{id:'x',mode:'rational-exact',gridDenominator:1},{id:'x',mode:'stage-grid-trunc',gridDenominator:null},{id:'x',mode:'stage-grid-trunc',gridDenominator:0},{id:'x',mode:'stage-grid-trunc',gridDenominator:1000001},{id:'x',mode:'float',gridDenominator:null}]){const q=normal();q.profile.id='custom';q.profile.evidenceLabel='synthetic-fixture';q.profile.panelPrecision=precision;assert.equal(api.previewUnitFormation(q).reason,'unsupported-profile');}
  let q=normal();q.profile.id='zero.command';q.profile.evidenceLabel='synthetic-fixture';q.profile.commandCapacityTable.rows[1].capacity=0;const r=success(api.previewUnitFormation(q));assert.equal(r.canForm,false);assert.equal(r.receipt.capacityTrace.intrinsic.troops,0);
  q=copy(fixtures.formationCases.find(c=>c.id==='transport_all_endpoints').input);q.profile=copy(fixtures.profiles.reference);q.profile.id='quantity.cap.1';q.profile.evidenceLabel='synthetic-fixture';q.profile.capacityPolicy.pieceAndQuantityCaps[1].cap=1;const t=success(api.previewUnitFormation(q));assert.equal(t.canForm,false);assert.equal(t.receipt.limits.cargo[1],1);
});
test('profiles: evidence checks content, never trusting the table label',()=>{const q=capability();q.profile.id='spoof.label';q.profile.evidenceLabel='synthetic-fixture';q.profile.equipmentTable.rows[1].baseAttack++;const r=success(api.calculateUnitCapabilities(q));assert.equal(r.receipt.evidence.table,'caller-supplied-fixture');q.profile.equipmentTable.rows[1].baseAttack--;assert.equal(success(api.calculateUnitCapabilities(q)).receipt.evidence.table,'documented-crosschecked');});
test('formation: all simultaneous shortages are retained in stable order',()=>{
  const q=normal();q.available.troops=0;q.available.gold=0;q.available.food=0;q.available.equipment[1]=0;q.available.equipment[10]=0;const r=success(api.previewUnitFormation(q));assert.equal(r.canForm,false);assert.equal(r.receipt.unitspec,null);assert.deepEqual(r.receipt.shortfalls.map(s=>s.resource),['troops','gold','food','equipment:1','equipment:10']);roundtrip(r);
});
test('formation: quantities at u32 maximum stay exact; late invalid cargo produces no partial receipt',()=>{
  const q=normal();q.requested.troops=4294967295;q.requested.gold=4294967295;q.requested.food=4294967295;const r=success(api.previewUnitFormation(q));assert.equal(r.canForm,false);assert.equal(r.receipt.requiredEquipment[1],4294967295);q.requested.cargo[11]=-1;rejection(q);
});
test('canonical: object insertion and set order do not alter bytes; deputy role order does',()=>{
  const q=normal();q.context.techniqueIds=[15,3,7];q.context.relations.likes=[{from:'S2',to:'M'},{from:'S1',to:'M'}];
  const reverse=x=>x&&typeof x==='object'?Array.isArray(x)?x.map(reverse):Object.fromEntries(Object.entries(x).reverse().map(([k,v])=>[k,reverse(v)])):x;
  const other=reverse(q);other.context.techniqueIds.reverse();other.context.relations.likes.reverse();assert.equal(saved(success(dispatch(q))),saved(success(dispatch(other))));
  const q2=normal();[q2.context.members[1],q2.context.members[2]]=[q2.context.members[2],q2.context.members[1]];const a=success(dispatch(normal())),b=success(dispatch(q2));assert.deepEqual(a.receipt.calculation.panels,b.receipt.calculation.panels);assert.notEqual(saved(a),saved(b));
});
test('save: forged and malformed results cannot supply a final answer',()=>{
  const result=success(dispatch(normal()));for(const change of [r=>{r.receipt.calculation.panels.attack++},r=>{r.canForm=false},r=>{r.receipt.unitspec.capacity.troops=1},r=>{delete r.receipt.request.profile.equipmentTable},r=>{r.receipt.profileFingerprint='0'.repeat(64)},r=>{r.extra=1}]){const r=copy(result);change(r);assert.equal(api.saveUnitFormationReceipt(r).ok,false);}
  for(const r of [null,[],{},()=>1,api.previewUnitFormation({})])assert.equal(api.saveUnitFormationReceipt(r).ok,false);
});
test('replay: every independently forged derived layer is rejected by fresh calculation',()=>{
  const base=JSON.parse(saved(success(dispatch(normal()))));const changes=[r=>{r.result.receipt.calculation.attributes.war++},r=>{r.result.receipt.calculation.panels.attack++},r=>{r.result.receipt.calculation.raw.attack.numerator='06237'},r=>{r.result.receipt.calculation.raw.attack.denominator='0'},r=>{r.result.receipt.calculation.stages.attack[0].result.numerator='1'},r=>{r.result.receipt.calculation.attributeSources.war=['M']},r=>{r.result.receipt.calculation.relationships.deputies[0].divisor=1},r=>{r.result.receipt.requiredEquipment[10]=0},r=>{r.result.receipt.limits.troops++},r=>{r.result.receipt.capacityTrace.intrinsic.troops++},r=>{r.result.receipt.unitspec.members.reverse()},r=>{r.result.receipt.unitspec.evidence.stockOriginalVerified=true},r=>{r.result.receipt.sourceMutation=true},r=>{r.result.receipt.rngDraws=1},r=>{r.request.profile.id='tampered'},r=>{r.request.profile.equipmentTable.rows[1].baseAttack++},r=>{delete r.request.profile.equipmentTable},r=>{r.result.receipt.evidence.table='stock'},r=>{r.result.receipt.profileFingerprint='0'.repeat(64)},r=>{r.result.receipt.request.profile.id='tampered'}];
  for(const change of changes){const r=copy(base);change(r);assert.equal(api.replayUnitFormationReceipt(JSON.stringify(r)).ok,false);}
});
test('replay: malformed JSON, duplicate/escaped keys, extra fields, unknown schemas reject',()=>{
  const s=saved(success(dispatch(normal())));
  for(const x of [null,{},'','[1,]','{"x":NaN}',s.replace('"schemaVersion":1','"schemaVersion":1,"schemaVersion":1'),s.replace('"schemaVersion":1','"schemaVersion":1,"schemaVersi\\u006fn":1'),s.replace('"troops":5000','"troops":null'),s.replace('"rngDraws":0','"rngDraws":-0')])assert.equal(api.replayUnitFormationReceipt(x).ok,false);
  const r=JSON.parse(s);r.extra=1;assert.equal(api.replayUnitFormationReceipt(JSON.stringify(r)).ok,false);delete r.extra;r.schemaVersion=2;assert.deepEqual(api.replayUnitFormationReceipt(JSON.stringify(r)),{ok:false,reason:'unsupported-schema'});
});
test('safety: inherited descriptor value cannot disguise an accessor as plain JSON',()=>{
  let calls=0;const q=normal();Object.defineProperty(q.context.members[0].actual,'leadership',{enumerable:true,configurable:true,get(){calls++;return 60}});
  let result;try {Object.defineProperty(Object.prototype,'value',{value:60,configurable:true});result=api.previewUnitFormation(q);}finally{delete Object.prototype.value;}
  assert.deepEqual(result,{ok:false,reason:'invalid-input',receipt:null});assert.equal(calls,0);
});
test('panels: battle basic boat uses deputy maximum navy, transport basic boat stays fixed',()=>{
  const q=capability();q.context.panelEquipmentId=9;q.context.techniqueIds=[];const battle=success(api.calculateUnitCapabilities(q)).receipt.calculation;
  assert.equal(q.context.members[0].aptitude.navy,1);assert.equal(battle.aptitude.rank,2);assert.deepEqual(battle.panels,{attack:44,defense:49,construction:100});assert.deepEqual(battle.aptitudeSources.navy,['S1']);
  q.context.unitType='transport';const transport=success(api.calculateUnitCapabilities(q)).receipt.calculation;assert.equal(transport.aptitude.rank,null);assert.deepEqual(transport.aptitude.multiplier,{numerator:'3',denominator:'5'});assert.deepEqual(transport.panels,{attack:11,defense:10,construction:33});
});
