/** Private projection only: no actor creation, owner reassignment or persistent balance. */
import { createFieldCombatStateV1, executeFieldCombatV1, projectFieldCombatSingleSupportV1, FIELD_COMBAT_DEFAULT_POLICY_V1 } from '../field-combat-lifecycle.ts';
const fail = (reason: string) => Object.freeze({ ok: false as const, reason });
const uint = (v: unknown, max: number): v is number => typeof v === 'number' && Number.isSafeInteger(v) && !Object.is(v, -0) && v >= 0 && v <= max;
const record = (v: unknown): v is Record<string, unknown> => v !== null && typeof v === 'object' && !Array.isArray(v);
const keys = (v: Record<string, unknown>, expected: readonly string[]) => Object.keys(v).length === expected.length && expected.every(k => Object.hasOwn(v, k));
const id = (v: unknown): v is string => typeof v === 'string' && /^synthetic-[a-z0-9-]{1,48}$/.test(v);
function frozen<T>(value: T): Readonly<T> {
  if (value !== null && typeof value === 'object') { for (const item of Object.values(value)) frozen(item); Object.freeze(value); }
  return value;
}
const runtime = globalThis as { process?: { getBuiltinModule?: (id: string) => { types: { isProxy(v: unknown): boolean } } } };
const isProxy = typeof runtime.process?.getBuiltinModule === 'function' ? runtime.process.getBuiltinModule('node:util').types.isProxy : (() => false);
function detach(input: unknown): unknown {
  let nodes = 0, chars = 0; const active = new Set<object>();
  const invalid = (): never => { throw new Error('invalid-data'); };
  function visit(value: unknown, depth: number): unknown {
    if (++nodes > 10000 || depth > 12) return invalid();
    if (value === null || typeof value === 'boolean') return value;
    if (typeof value === 'number') return uint(value, Number.MAX_SAFE_INTEGER) ? value : invalid();
    if (typeof value === 'string') { chars += value.length; return chars <= 100000 ? value : invalid(); }
    if (typeof value !== 'object' || isProxy(value) || active.has(value)) return invalid();
    const array = Array.isArray(value), proto = Object.getPrototypeOf(value);
    if (proto !== (array ? Array.prototype : Object.prototype) && !(proto === null && !array)) return invalid();
    const descriptors = Object.getOwnPropertyDescriptors(value), names = Reflect.ownKeys(descriptors);
    if (names.some(name => typeof name !== 'string' || !Object.hasOwn(descriptors[name]!, 'value')
      || (!descriptors[name]!.enumerable && !(array && name === 'length')))) return invalid();
    active.add(value);
    try {
      if (array) {
        const length = descriptors.length!.value as number;
        if (!uint(length, 256) || names.length !== length + 1) return invalid();
        const result: unknown[] = [];
        for (let i = 0; i < length; i++) { const descriptor = descriptors[String(i)]; if (!descriptor) return invalid(); result.push(visit(descriptor.value, depth + 1)); }
        return result;
      }
      if (names.length > 16) return invalid();
      const result: Record<string, unknown> = {};
      for (const name of names as string[]) Object.defineProperty(result, name, { value: visit(descriptors[name]!.value, depth + 1), enumerable: true });
      return result;
    } finally { active.delete(value); }
  }
  return visit(input, 0);
}






type Panel = { attack: number; defense: number };
type Actor = { id: string; ownerId: string; weapon: 'sword' | 'spear' | 'halberd' | 'crossbow' | 'cavalry'; panels: { normal: Panel; confused: Panel } };
type Current = { id: string; ownerId: string; cellId: string; troops: number; energy: number; acted: boolean; status: 'normal' | 'confused' | 'false-report'; remaining: number; intelligence: number; charisma: number };
function panel(value: unknown): value is Panel {
  return record(value) && keys(value, ['attack', 'defense']) && uint(value.attack, 255) && uint(value.defense, 255);
}
type SingleSupport={profile:'inferred-single-support-reaction-core-v1';supporterId:string;relationCase:'spouse'|'sworn'|'supporter-likes-attacker'|'parent-child'|'siblings'};
function project(input: unknown, researchedEnergy = false, effectiveAttributes = false, support?:SingleSupport) {
  if (!record(input) || !keys(input, ['encounter', 'roster', 'round', 'command', 'draws', 'ownerTechniques', 'foodRaidMode']) || !record(input.encounter)
    || !keys(input.encounter, ['id', 'ownerIds', 'map', 'actors']) || !id(input.encounter.id)
    || !Array.isArray(input.encounter.ownerIds) || input.encounter.ownerIds.length !== 2 || !input.encounter.ownerIds.every(id)
    || new Set(input.encounter.ownerIds).size !== 2 || !Array.isArray(input.encounter.actors)
    || input.encounter.actors.length < 2 || input.encounter.actors.length > 8
    || !Array.isArray(input.roster) || input.roster.length < 2 || input.roster.length > 8
    || !uint(input.round, 1000000) || !record(input.command)
    || !keys(input.command, ['id', 'actorId', 'targetId', 'kind']) || !id(input.command.id) || !id(input.command.actorId)
    || !id(input.command.targetId) || (input.command.kind !== 'normal-melee' && input.command.kind !== 'normal-arrow' && input.command.kind !== 'false-report-status')) return fail('invalid-neutral-combat-request');
  if(!Array.isArray(input.draws)||input.draws.length>8)return fail('invalid-stage-tape');
  for(const d of input.draws)if(!record(d)||!keys(d,['stage','bound','value'])||(typeof d.stage!=='string'||!/^(strategy\.(hit|critical|duration)|attack\.[0-7]\.(shield|critical)|reaction\.(shield|critical|avoid)|support\.0\.(relation|shield|critical))$/.test(d.stage))||d.bound!==100||!uint(d.value,99))return fail('invalid-stage-tape');
  if(!support && input.draws.some(d=>(d as {stage:string}).stage.startsWith('support.')))return fail('support-proof-required');
  if(!(input.foodRaidMode===null||input.foodRaidMode==='external-positive-proposal-v1')||!Array.isArray(input.ownerTechniques)||input.ownerTechniques.length!==2)return fail('invalid-technique-profile');
  const ownerTechniques:{ownerId:string;techniques:number[]}[]=[];
  for(const row of input.ownerTechniques){if(!record(row)||!keys(row,['ownerId','techniques'])||!id(row.ownerId)||ownerTechniques.some(t=>t.ownerId===row.ownerId)
    ||!Array.isArray(row.techniques)||row.techniques.length>36||!row.techniques.every(t=>uint(t,35))||new Set(row.techniques).size!==row.techniques.length)return fail('invalid-actual-techniques');
    ownerTechniques.push({ownerId:row.ownerId,techniques:[...row.techniques] as number[]});}
  const encounter = input.encounter, ownerIds = encounter.ownerIds as string[], actors: Actor[] = [], roster: Current[] = [];
  if(ownerTechniques.some(t=>!ownerIds.includes(t.ownerId)))return fail('technique-owner-mismatch');
  for (const raw of encounter.actors as unknown[]) {
    if (!record(raw) || !keys(raw, ['id', 'ownerId', 'weapon', 'panels']) || !id(raw.id) || actors.some(a => a.id === raw.id)
      || !id(raw.ownerId) || !ownerIds.includes(raw.ownerId) || ownerIds.includes(raw.id)
      || !['sword', 'spear', 'halberd', 'crossbow', 'cavalry'].includes(raw.weapon as string)
      || !record(raw.panels) || !keys(raw.panels, ['normal', 'confused']) || !panel(raw.panels.normal) || !panel(raw.panels.confused)) return fail('invalid-neutral-actor-config');
    actors.push({ id: raw.id, ownerId: raw.ownerId, weapon: raw.weapon as Actor['weapon'],
      panels: { normal: { ...raw.panels.normal }, confused: { ...raw.panels.confused } } });
  }
  if (ownerIds.some(owner => !actors.some(a => a.ownerId === owner))) return fail('missing-owner-config');
  for (const raw of input.roster) {
    if (!record(raw) || !keys(raw, ['id', 'ownerId', 'cellId', 'troops', 'energy', 'acted', 'status', 'remaining', 'intelligence', 'charisma'])
      || !id(raw.id) || !id(raw.cellId) || !id(raw.ownerId) || roster.some(u => u.id === raw.id || u.cellId === raw.cellId)
      || !uint(raw.troops, 1000000) || raw.troops === 0 || !uint(raw.energy, researchedEnergy && ownerTechniques.find(t=>t.ownerId===raw.ownerId)?.techniques.includes(16) ? 120 : 100) || typeof raw.acted !== 'boolean'
      || !['normal','confused','false-report'].includes(raw.status as string) || !uint(raw.remaining,3) || ((raw.status==='normal') !== (raw.remaining===0)) || !uint(raw.intelligence, effectiveAttributes?255:100) || !uint(raw.charisma,effectiveAttributes?255:100)) return fail('invalid-current-combat-roster');
    const config = actors.find(a => a.id === raw.id);
    if (!config || config.ownerId !== raw.ownerId) return fail('combat-owner-mismatch');
    roster.push({ id: raw.id, ownerId: raw.ownerId, cellId: raw.cellId, troops: raw.troops, energy: raw.energy,
      acted: raw.acted, status: raw.status as Current['status'], remaining: raw.remaining, intelligence: raw.intelligence, charisma:raw.charisma });
  }
  const cmd = input.command, actor = roster.find(u => u.id === cmd.actorId), target = roster.find(u => u.id === cmd.targetId);
  if (!actor || !target || actor.id === target.id || actor.ownerId === target.ownerId) return fail('not-explicit-opposing-owners');
  const m = encounter.map;
  if (!record(m) || !keys(m, ['qMin', 'qMax', 'rMin', 'rMax', 'cells']) || !uint(m.qMin, 15) || !uint(m.qMax, 15)
    || !uint(m.rMin, 15) || !uint(m.rMax, 15) || m.qMax < m.qMin || m.rMax < m.rMin
    || !Array.isArray(m.cells) || m.cells.length < 1 || m.cells.length > 16
    || (m.qMax - m.qMin + 1) * (m.rMax - m.rMin + 1) !== m.cells.length) return fail('invalid-combat-map');
  // The legacy constructor validates coordinates, terrain names, unique cells and complete rectangle.
  for (const c of m.cells) {
    if (!record(c) || !keys(c, ['id', 'q', 'r', 'terrain', 'height', 'blocked']) || !id(c.id)
      || ownerIds.includes(c.id) || actors.some(a => a.id === c.id)) return fail('invalid-combat-cell-identity');
  }
  const created = createFieldCombatStateV1({ schemaVersion: 1, profile: 'o14-detached-positive-field-action-v1', episodeId: encounter.id,
    round: input.round, context: { kind: 'detached-ground-only', allMembersAndSkillsComplete: true, allTechniquesComplete: true,
      crossUnitRelations: [], unsupportedEntities: [],...(input.foodRaidMode?{foodRaidMode:input.foodRaidMode}:{}),...(effectiveAttributes?{intelligenceProfile:'same-formula-intelligence255-v1' as const}:{}) }, map: m,
    units: roster.map(u => { const config = actors.find(a => a.id === u.id)!;
      return { id: u.id, cellId: u.cellId, troops: u.troops, energy: u.energy, acted: u.acted,
        status: u.status, remaining: u.remaining,
        side: u.ownerId, weapon: config.weapon, aptitude: 'C', energyCap: researchedEnergy && ownerTechniques.find(t=>t.ownerId===u.ownerId)!.techniques.includes(16) ? 120 : 100, difficulty: 'normal',
        intelligence: u.intelligence, charm: u.charisma, martial: 0, temperament: 'calm',
        panels: { kind: 'resolved-state-panels-v1', techAndStatusIncluded: true, ...config.panels },
        members: [{ id: u.id, intelligence: u.intelligence, sex: 'male', skills: [], relationshipToLeader: 'leader' }], techniques: ownerTechniques.find(t=>t.ownerId===u.ownerId)!.techniques };
    }), rng: { kind: 'stage-bounded-tape-v1', tape: input.draws }, policy: FIELD_COMBAT_DEFAULT_POLICY_V1 });
  if (!created.ok) return fail(`combat-genesis:${created.reason}`);
  // Current acted/status is carried unchanged; a fresh projection does not reset action eligibility.
  const command = { commandId: cmd.id, expectedRevision: 0, actorId: cmd.actorId, targetId: cmd.targetId, action: cmd.kind };
  const proposed = support ? projectFieldCombatSingleSupportV1(created.state.genesis.scenario, command, support) : undefined;
  if(proposed && !proposed.ok)return fail(`combat-support:${proposed.reason}`);
  const ordinary = support ? undefined : executeFieldCombatV1(created.state, command);
  if(ordinary && !ordinary.ok)return fail(`combat-step:${ordinary.reason}`);
  if(ordinary && ordinary.ok && (ordinary.duplicate || !ordinary.committed))return fail('unexpected-neutral-combat-outcome');
  const resolved = proposed?.ok ? {snapshot:proposed.projectedSnapshot,receipt:proposed.receipt} : ordinary?.ok ? {snapshot:ordinary.state.snapshot,receipt:ordinary.receipt} : undefined;
  if(!resolved || resolved.receipt.draws.length!==input.draws.length)return fail('unexpected-neutral-combat-outcome');
  const patches: { id: string; troops: number; energy: number; acted: boolean; status:Current['status'];remaining:number }[] = [];
  for (const current of roster) {
    const next = resolved.snapshot.units.find(u => u.id === current.id);
    if (!next || next.cellId !== current.cellId || next.troops <= 0 || next.troops > current.troops
      || next.acted !== (current.id === cmd.actorId || current.id === support?.supporterId ? true : current.acted)) return fail('unexpected-combat-write-set');
    if(cmd.kind==='false-report-status'){
      if(next.troops!==current.troops||next.energy!==(current.id===cmd.actorId?current.energy-15:current.energy)
        ||(current.id!==cmd.targetId&&(next.status!==current.status||next.remaining!==current.remaining))
        ||(current.id===cmd.targetId&&next.status!=='normal'&&next.status!=='false-report')||next.remaining>3)return fail('unexpected-status-write-set');
    }else if(next.energy!==current.energy||next.status!==current.status||next.remaining!==current.remaining
      ||(current.id!==cmd.actorId&&current.id!==cmd.targetId&&next.troops!==current.troops))return fail('unexpected-combat-write-set');
    patches.push({ id: next.id, troops: next.troops, energy: next.energy, acted: next.acted, status:next.status,remaining:next.remaining });
  }
  return frozen({ ok: true as const, patches, receipt: resolved.receipt, proposalOnly: true as const,
    sourcePolicy: 'neutral-two-owner-positive-combat-projection-v1' as const, nativeWorldVerified: false as const });
}
/** Internal pure helper: callers must bind immutable encounter and current authoritative roster in their full journal. */
export function projectNeutralFieldAction(input: unknown) {
  try { return project(detach(input)); } catch { return fail('invalid-data-input'); }
}

/** Private caller must supply actual owner techniques from root replay. */
export function projectNeutralFieldActionWithResearchedEnergy(input: unknown) { try { return project(detach(input), true); } catch { return fail('invalid-data-input'); } }

/** Private owner-derived live effective attributes, not a public equipment delta. */
export function projectNeutralFieldActionWithEffectiveAttributes(input:unknown, researchedEnergy=false) { try { if(typeof researchedEnergy!=='boolean')return fail('invalid-energy-profile'); return project(detach(input),researchedEnergy,true); } catch { return fail('invalid-data-input'); } }

/** Owner-only support proof; fixed relation is certified by the complete world journal. */
export function projectNeutralFieldSingleSupport(input:unknown,rawSupport:unknown,researchedEnergy=false,effectiveAttributes=false){
 try{const support=detach(rawSupport);if(typeof researchedEnergy!=='boolean'||typeof effectiveAttributes!=='boolean'||!record(support)||!keys(support,['profile','supporterId','relationCase'])||support.profile!=='inferred-single-support-reaction-core-v1'||!id(support.supporterId)||!['spouse','sworn','supporter-likes-attacker','parent-child','siblings'].includes(support.relationCase as string))return fail('invalid-single-support-proof');
 return project(detach(input),researchedEnergy,effectiveAttributes,support as SingleSupport);
 }catch{return fail('invalid-data-input');}
}
