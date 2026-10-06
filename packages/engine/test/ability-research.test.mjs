import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { PK_ABILITY_RESEARCH, RULESET, createSession, dispatch, syntheticScenario, canonical } from '../src/index.ts';
const source = new URL('../../../docs/sources/pk-ability-research/', import.meta.url);
const schema = JSON.parse(fs.readFileSync(new URL('schema.json', source)));
const copy = value => JSON.parse(JSON.stringify(value));
const nodes = PK_ABILITY_RESEARCH.baseNodes;
const slots = PK_ABILITY_RESEARCH.hiddenSlots;
const byId = new Map(nodes.map(n => [n.id, n]));

// Dependency-free validator for exactly the JSON Schema keywords used in this file.
// Unknown keywords fail closed, so expanding the schema cannot silently skip checks.
function validateSchema(value, spec = schema, path = '$') {
  const known = new Set(['$schema','$id','$defs','title','$ref','type','const','enum','properties','required','additionalProperties','items','minItems','maxItems','minimum','maximum','minLength']);
  for (const key of Object.keys(spec)) assert.ok(known.has(key), `${path}: unsupported schema keyword ${key}`);
  if (spec.$ref) {
    assert.ok(spec.$ref.startsWith('#/$defs/'));
    return validateSchema(value, schema.$defs[spec.$ref.slice(8)], path);
  }
  if (Object.hasOwn(spec, 'const')) assert.deepEqual(value, spec.const, `${path}: const`);
  if (spec.enum) assert.ok(spec.enum.some(v => JSON.stringify(v) === JSON.stringify(value)), `${path}: enum`);
  if (spec.type) {
    const matches = type => ({object:value !== null && typeof value === 'object' && !Array.isArray(value),array:Array.isArray(value),string:typeof value === 'string',integer:Number.isInteger(value)})[type];
    assert.ok((Array.isArray(spec.type) ? spec.type : [spec.type]).some(matches), `${path}: type`);
  }
  if (typeof value === 'number') {
    if (spec.minimum !== undefined) assert.ok(value >= spec.minimum, `${path}: minimum`);
    if (spec.maximum !== undefined) assert.ok(value <= spec.maximum, `${path}: maximum`);
  }
  if (typeof value === 'string' && spec.minLength !== undefined) assert.ok(value.length >= spec.minLength, `${path}: minLength`);
  if (Array.isArray(value)) {
    if (spec.minItems !== undefined) assert.ok(value.length >= spec.minItems, `${path}: minItems`);
    if (spec.maxItems !== undefined) assert.ok(value.length <= spec.maxItems, `${path}: maxItems`);
    if (spec.items) value.forEach((v, i) => validateSchema(v, spec.items, `${path}[${i}]`));
  }
  if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
    for (const key of spec.required || []) assert.ok(Object.hasOwn(value, key), `${path}: missing ${key}`);
    for (const [key, val] of Object.entries(value)) {
      if (spec.properties?.[key]) validateSchema(val, spec.properties[key], `${path}.${key}`);
      else if (spec.additionalProperties === false) assert.fail(`${path}: unknown ${key}`);
    }
  }
}
function unique(values) { assert.equal(new Set(values).size, values.length); }
function semantics(data) {
  const ids = new Set(data.baseNodes.map(n => n.id));
  unique(data.baseNodes.map(n => n.id)); unique(data.hiddenSlots.map(s => s.id));
  unique(data.hiddenSlots.flatMap(s => s.alternatives.map(a => a.id)));
  const sources = new Set(data.sources.map(s => s.id)); unique([...data.sources.map(s => s.id)]);
  const conflicts = new Set(data.conflicts.map(c => c.id)); unique(data.conflicts.map(c => c.id));
  for (const c of data.conflicts) for (const v of c.values) assert.ok(sources.has(v.source), 'unknown conflict source');
  for (const n of [...data.baseNodes, ...data.hiddenSlots.flatMap(s => s.alternatives)]) {
    unique(n.prerequisites.allOf); unique(n.evidence);
    for (const id of n.prerequisites.allOf) assert.ok(ids.has(id) && id !== n.id, `${n.id}: bad prerequisite ${id}`);
    for (const id of n.evidence) assert.ok(sources.has(id));
    for (const id of n.conflicts || []) assert.ok(conflicts.has(id), 'unknown conflict ID');
  }
  const visited = new Set(), active = new Set(), map = new Map(data.baseNodes.map(n => [n.id,n]));
  function visit(id) { assert.ok(!active.has(id), 'cycle'); if (visited.has(id)) return; active.add(id); for (const p of map.get(id).prerequisites.allOf) visit(p); active.delete(id); visited.add(id); }
  for (const n of data.baseNodes) visit(n.id);
  assert.deepEqual([...ids].filter(id => !map.get(id).prerequisites.allOf.length).sort(), [...data.imageCoverage.startTargets].sort());
  assert.equal(data.baseNodes.reduce((n,x) => n+x.prerequisites.allOf.length,0),52);
  assert.equal(data.hiddenSlots.reduce((n,x) => n+x.imageIncoming.length,0),29);
  for (const slot of data.hiddenSlots) {
    unique(slot.imageIncoming); slot.imageIncoming.forEach(id => assert.ok(ids.has(id)));
    assert.deepEqual(slot.alternatives.map(a => a.tableColumn),[1,2,3,4,5]);
    for (const a of slot.alternatives) assert.ok(a.id.startsWith(slot.id+'.option-'));
  }
  assert.equal(visited.size,48);
}

test('PK ability catalog satisfies its closed schema and reference/acyclic invariants', () => {
  validateSchema(PK_ABILITY_RESEARCH); semantics(PK_ABILITY_RESEARCH);
  assert.deepEqual(Object.fromEntries(['stat','aptitude','skill'].map(k => [k,nodes.filter(n=>n.trainingCategory===k).length])),{stat:15,aptitude:12,skill:21});
  assert.equal(slots.flatMap(s=>s.alternatives).length,50);
});

test('complete independent visual audit matches every base node and black/orange arrow', () => {
  const audit = JSON.parse(fs.readFileSync(new URL('image-transcription-audit.json',source)));
  assert.equal(PK_ABILITY_RESEARCH.provenance.image.sha256,audit.imageSha256);
  const sorted = a => [...a].sort();
  assert.deepEqual(sorted(nodes.map(n => `${n.sourceLabel}|${n.months}|${n.useLimit}`)),sorted(audit.baseNodes.map(n => `${n.label}|${n.months}|${n.useLimit}`)));
  const labels = new Map(nodes.map(n => [n.id,n.sourceLabel]));
  assert.deepEqual(sorted(nodes.flatMap(n=>n.prerequisites.allOf.map(p=>`${labels.get(p)}>${n.sourceLabel}`))),sorted(audit.baseEdges.map(e=>e.join('>'))));
  assert.deepEqual(sorted(PK_ABILITY_RESEARCH.imageCoverage.startTargets.map(id=>labels.get(id))),sorted(audit.startTargets));
  assert.deepEqual(sorted(slots.flatMap(s=>s.imageIncoming.map(p=>`${labels.get(p)}>${s.sourceLabel}`))),sorted(audit.hiddenEdges.map(e=>e.join('>'))));
  for (const slot of slots) {
    const expected=audit.hiddenSlots.find(s=>s.label===slot.sourceLabel);
    assert.ok(expected); assert.equal(slot.imageMonths,expected.months);
    for (const option of slot.alternatives) {
      const row=expected.alternatives[option.tableColumn-1];
      assert.equal(option.sourceLabel,row.skill);
      assert.equal(option.months,expected.months);
      assert.deepEqual(sorted(option.prerequisites.allOf.map(id=>labels.get(id))),sorted(row.requiresAll));
      assert.equal(option.useLimit,row.useLimit);
    }
  }
});

test('all 50 hidden editor screenshot rows independently corroborate duration, uses and AND prerequisites', () => {
  const audit=JSON.parse(fs.readFileSync(new URL('hidden-editor-transcription-audit.json',source)));
  assert.equal(audit.imageSha256,PK_ABILITY_RESEARCH.provenance.hiddenEditorImage.sha256);
  assert.equal(audit.rows.length,50);
  assert.deepEqual(audit.rows.map(r=>r.editorRow).sort((a,b)=>a-b),Array.from({length:50},(_,i)=>48+i));
  unique(audit.rows.map(r=>`${r.tableRow}:${r.tableColumn}`));
  const labels=new Map(nodes.map(n=>[n.id,n.sourceLabel]));
  for(const slot of slots) for(const option of slot.alternatives) {
    const row=audit.rows.find(r=>r.tableRow===slot.tableRow&&r.tableColumn===option.tableColumn);
    assert.ok(row);assert.equal(option.sourceLabel,row.label);
    assert.equal(option.months,row.months);assert.equal(option.useLimit,row.useLimit);
    assert.deepEqual(option.prerequisites.allOf.map(id=>labels.get(id)).sort(),[...row.requiresAll].sort());
  }
});

test('five stats’ three tiers, six aptitudes and every base skill have guide-backed limits', () => {
  for (const n of nodes) {
    if(n.trainingCategory==='stat') {
      const tier=n.id.split('.').at(-1); assert.equal(n.months,{low:3,medium:4,high:6}[tier]); assert.equal(n.useLimit,tier==='high'?3:5);
    } else if(n.trainingCategory==='aptitude') { assert.equal(n.months,n.id.endsWith('.b')?4:5); assert.equal(n.useLimit,5); }
    else assert.equal(n.useLimit,['skill.overlord','skill.debater','skill.capture','skill.deep-plan'].includes(n.id)?1:3);
  }
});

test('multiple incoming base arrows are AND gates, including cross-branch joins', () => {
  const expected={
    'stat.war.medium':['aptitude.spear.b','aptitude.navy.b'],
    'stat.war.high':['skill.chain-attack','aptitude.cavalry.a'],
    'stat.charisma.low':['stat.intelligence.low','stat.politics.low'],
    'skill.iron-wall':['stat.leadership.low','skill.fortification'],
    'skill.clear-mirror':['stat.intelligence.medium','skill.intimidation'],
    'skill.overlord':['skill.support','stat.leadership.medium'],
    'skill.fame':['stat.leadership.medium','skill.efficient-official'],
    'skill.debater':['skill.capture','skill.efficient-official'],
  };
  assert.deepEqual(nodes.filter(n=>n.prerequisites.allOf.length>1).map(n=>n.id).sort(),Object.keys(expected).sort());
  for(const [id,required] of Object.entries(expected)) assert.deepEqual(byId.get(id).prerequisites.allOf,required);
});

test('income and auxiliary duplicate skills preserve five distinct AND variants, not flattened OR', () => {
  for(const [slotId,expected] of [
    ['hidden.politics-ro',[['rice',['skill.invention']],['rice',['stat.politics.high']],['collection',['skill.invention']],['collection',['stat.politics.high']],['collection',['stat.politics.high','skill.invention']]]],
    ['hidden.politics-ha',[['farming',['skill.shipbuilding','skill.invention']],['farming',['skill.shipbuilding']],['farming',['skill.invention']],['benevolence',['skill.shipbuilding']],['benevolence',['skill.invention']]]],
  ]) assert.deepEqual(slots.find(s=>s.id===slotId).alternatives.map(a=>[a.skillKey,a.prerequisites.allOf]),expected);
  const slot=slots.find(s=>s.id==='hidden.intelligence-ro');
  for (const key of ['perception','chain-plan']) assert.deepEqual(slot.alternatives.find(a=>a.skillKey===key).prerequisites.allOf,['stat.charisma.low','skill.ambush']);
  assert.ok(!slot.imageIncoming.includes('stat.charisma.low'));
});

test('conflicting sources remain explicit with guide values corroborated by the editor screenshot', () => {
  const alternatives=slots.flatMap(s=>s.alternatives);
  assert.equal(alternatives.find(a=>a.skillKey==='heart-attack').months,3);
  assert.equal(alternatives.find(a=>a.skillKey==='prayer').useLimit,5);
  assert.ok(alternatives.every(a=>a.months!==null&&a.useLimit!==null));
  for (const id of ['heart-attack-months','prayer-use-limit']) assert.ok(PK_ABILITY_RESEARCH.conflicts.find(c=>c.id===id).values.some(v=>v.source==='atwiki-editor-hidden'));
  assert.deepEqual(PK_ABILITY_RESEARCH.conflicts.map(c=>c.id).sort(),['hidden-intelligence-image-arrow','heart-attack-months','prayer-use-limit','hidden-selection-count','halberd-b-predecessor','collection-invention-only'].sort());
  assert.deepEqual(byId.get('aptitude.halberd.b').prerequisites.allOf,['stat.war.low']);
  assert.equal(PK_ABILITY_RESEARCH.semantics.hiddenSelection.algorithm,'open');
  assert.equal(PK_ABILITY_RESEARCH.semantics.hiddenSelection.rng,'open');
  assert.equal(PK_ABILITY_RESEARCH.provenance.level,'documented-guide');
  assert.equal(PK_ABILITY_RESEARCH.provenance.nativeIds,false);
});

test('schema and graph mutation controls reject missing, extra, invalid, unknown and cyclic data', () => {
  for(const change of [d=>delete d.baseNodes[0].months,d=>d.baseNodes[0].guessed=true,d=>d.baseNodes[0].months=2,d=>d.baseNodes[0].version='vanilla',d=>d.baseNodes.pop(),d=>d.hiddenSlots[0].alternatives.pop(),d=>d.baseNodes[0].useLimit=null,d=>d.hiddenSlots[0].alternatives[0].months=null]) {
    const d=copy(PK_ABILITY_RESEARCH);change(d);assert.throws(()=>validateSchema(d));
  }
  for(const change of [d=>d.baseNodes[0].prerequisites.allOf=['unknown'],d=>d.baseNodes[0].id=d.baseNodes[1].id,d=>d.baseNodes[0].prerequisites.allOf.push(d.baseNodes[0].id),d=>d.baseNodes.find(n=>n.id==='stat.war.low').prerequisites.allOf=['aptitude.spear.a'],d=>d.baseNodes[0].evidence=['absent'],d=>d.hiddenSlots[0].alternatives[0].conflicts=['absent'],d=>d.conflicts[0].values[0].source='absent']) {
    const d=copy(PK_ABILITY_RESEARCH);change(d);assert.throws(()=>semantics(d));
  }
});

test('read-only static export preserves training rules, save/replay version and unsupported commands', () => {
  function frozen(value) { if(value!==null&&typeof value==='object') {assert.ok(Object.isFrozen(value));Object.values(value).forEach(frozen);} }
  frozen(PK_ABILITY_RESEARCH);
  assert.throws(()=>nodes[0].prerequisites.allOf.push('unknown'),TypeError);
  assert.equal(RULESET.id,'pk-training-lifecycle-v2');
  const session=createSession(syntheticScenario()),before=canonical(session);
  assert.equal(session.saveVersion,2); assert.equal(session.engineVersion,'training-kernel-v2');
  for(const type of ['AbilityResearch','TrainOfficer']) {
    const out=dispatch(session,{type});assert.equal(out.result.ok,false);assert.equal(canonical(session),before);
    assert.strictEqual(out.session,session);assert.equal(canonical(out.session),before);
  }
});
