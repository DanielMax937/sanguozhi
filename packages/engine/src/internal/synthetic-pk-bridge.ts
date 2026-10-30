/** Private owner-neutral PK research/cultivation leaves. No standalone clock or balances. */
import { PK_ABILITY_LIFECYCLE_CATALOG_V1 as catalogData, PK_ABILITY_LIFECYCLE_CATALOG_DIGEST_V1, PK_ABILITY_POLICY_REGISTRY_V1 } from '../pk-ability-lifecycle.ts';
import { qualifyPkStatTraining, completePkStatTraining } from '../pk-stat-training.ts';
import type { PkStatTrainingCompletion, PkStatTrainingInput } from '../pk-stat-training.ts';
import { detachBoundedCityData } from './bounded-city-json.ts';
type Frozen<T> = T extends object ? { readonly [K in keyof T]: Frozen<T[K]> } : T;
type Stat = 'leadership' | 'war' | 'intelligence' | 'politics' | 'charisma';
type Aptitude = 'spear' | 'halberd' | 'crossbow' | 'cavalry' | 'siege' | 'navy';
type Grade = 'C' | 'B' | 'A' | 'S';
type Category = 'stat' | 'aptitude' | 'skill';
type DateV1 = { year: number; month: number; day: 1 | 11 | 21 };
type Policy = { id: string; version: 1; parameters: Record<string, string | number | boolean | (number | string)[]> };
type Policies = Record<'catalog' | 'hidden' | 'researchFees' | 'researchActor' | 'researchCapacity' | 'researchClock' | 'cultivationFees' | 'cultivationClock' | 'cultivationCapacity' | 'qualification' | 'uses' | 'stats' | 'aptitude' | 'skill' | 'completion' | 'apRecovery' | 'persistence' | 'presentation', Policy>;
type PrimitiveOfficer = { id: string; forceId: string; baseId: string; available: boolean; actedTurn: number | null; stats: Record<Stat, { talent: number; xp: number }>; aptitudes: Record<Aptitude, Grade>; skillKey: string | null };
type Officer = PrimitiveOfficer & { reservationJobId: string | null };
type Scenario = { profile: 'standalone-pk-ability-guide-compat-v1'; date: DateV1; turn: number; scope: { forceId: string; baseId: string; corpsId: string; baseKind: 'city' | 'gate' | 'port' }; resources: { gold: number; actionPoints: number; techniquePoints: number }; hiddenSelections: { slotId: string; candidateId: string }[]; officers: PrimitiveOfficer[]; policies: Policies };
type Target = { category: 'stat'; attribute: Stat; target: 70 | 80 | 95 } | { category: 'aptitude'; aptitude: Aptitude; target: 'B' | 'A' } | { category: 'skill'; skillKey: string };
type Node = { id: string; name: string; months: number; costGold: number; costAP: number; trainingCategory: Category; useLimit: number; prerequisites: { allOf: string[] }; evidence: string[]; target: Target };
type Catalog = typeof catalogData;
type Command = { type: 'StartAbilityResearch'; baseId: string; nodeId: string } | { type: 'StartOfficerCultivation'; baseId: string; nodeId: string; officerId: string } | { type: 'AdvanceAbilityTurn' };
type Envelope = { id: string; expectedRevision: number; command: Command };
type Write = { before: number; requestedDelta: number; actualDelta: number; after: number; cap: number; discarded: number; policyId: string };
type Fees = { gold: Write; actionPoints: Write; techniquePoints: Write };
type Timing = { durationTurns: number; dueTurn: number; dueDate: DateV1; policyId: string };
type UseCount = { limit: number; spent: number; reserved: number; available: number };
type UseWrite = { nodeId: string; before: UseCount; after: UseCount; policyId: string };
type Effect = { category: 'stat'; attribute: Stat; result: Extract<PkStatTrainingCompletion, { supported: true }> } | { category: 'aptitude'; aptitude: Aptitude; before: Grade; after: 'B' | 'A'; policyId: string } | { category: 'skill'; before: string | null; after: string; policyId: string };
type Qualification = { eligible: true; detail: unknown; anticipatedEffect: Effect } | { eligible: false; reason: string };
type Snapshot = { turn: number; date: DateV1; scope: Scenario['scope']; resources: Scenario['resources']; node: Node; catalogDigest: string; policies: Policies; officer: Officer | null; qualification: unknown; anticipatedEffect: Effect | null };
type Completion = { jobId: string; kind: 'research' | 'cultivation'; nodeId: string; catalogCandidateId: string; category: Category; turn: number; date: DateV1; unlockedBefore: string[] | null; unlockedAfter: string[] | null; officerId: string | null; effect: Effect | null; uses: UseWrite | null; releasedReservation: string | null; actedTurn: number | null; sourceLevel: 'documented-guide'; lifecycleLevel: 'provisional-engine-rule'; policyId: string };
type Job = { id: string; kind: 'research' | 'cultivation'; status: 'active' | 'completed'; nodeId: string; category: Category; officerId: string | null; startTurn: number; startDate: DateV1; durationTurns: number; remainingTurns: number; dueTurn: number; dueDate: DateV1; startSnapshot: Snapshot; fees: Fees; completedTurn: number | null; completion: Completion | null };

const STATS:Stat[]=['leadership','war','intelligence','politics','charisma'];
const APTITUDES:Aptitude[]=['spear','halberd','crossbow','cavalry','siege','navy'];
const CATEGORIES:Category[]=['stat','aptitude','skill'];
const MAX_VALUE=1000000000;
const SCENARIO_KEYS=['profile','date','turn','scope','resources','hiddenSelections','officers','policies'];
const CATALOG=catalogData, CATALOG_DIGEST=PK_ABILITY_LIFECYCLE_CATALOG_DIGEST_V1, REGISTRY=PK_ABILITY_POLICY_REGISTRY_V1;
function fail(reason='invalid-input'):never{throw Error(reason);}
function freeze<T>(v:T):Frozen<T>{if(v!==null&&typeof v==='object'){for(const x of Object.values(v))freeze(x);Object.freeze(v);}return v as Frozen<T>;}
const copy=<T>(v:T):T=>JSON.parse(JSON.stringify(v)) as T;
function canonical(v:unknown):string{if(v===null||typeof v!=='object')return JSON.stringify(v);if(Array.isArray(v))return '['+v.map(canonical).join(',')+']';const r=v as Record<string,unknown>;return '{'+Object.keys(r).sort().map(k=>JSON.stringify(k)+':'+canonical(r[k])).join(',')+'}';}
const same=(a:unknown,b:unknown)=>canonical(a)===canonical(b);
const sid=(v:unknown):v is string=>typeof v==='string'&&/^synthetic-[a-z0-9-]{1,48}$/.test(v);
const jid=(v:unknown):v is string=>typeof v==='string'&&/^job:synthetic-[a-z0-9-]{1,48}$/.test(v);
type State=Omit<Scenario,'officers'> & {officers:Officer[];catalogDigest:string;completedNodeIds:string[];usesSpent:Record<string,number>;researchJobs:Job[];cultivationJobs:Job[];remainingTickCapacity:number};
export type SyntheticPkContext={turn:number;date:DateV1;forceId:string;cityId:string;corpsId:string;gold:number;actionPoints:number;techniquePoints:number;remainingTickCapacity:number;officers:(Officer&{role:'resident'|'deployed'})[]};
type Metadata={scope:Scenario['scope'];officerIds:string[];hiddenSelections:Scenario['hiddenSelections'];policies:Policies;completedNodeIds:string[];usesSpent:Record<string,number>;researchJobs:Job[];cultivationJobs:Job[];lastTurn:number;lastDate:DateV1};
export type SyntheticPkMetadata=Frozen<Metadata>;
const trusted=new WeakSet<object>();
function obj(v: unknown, keys: readonly string[], reason = 'invalid-input'): Record<string, unknown> { if (!v || typeof v !== 'object' || Array.isArray(v)) fail(reason); const r = v as Record<string, unknown>; if (Object.keys(r).some(k => !keys.includes(k))) fail(reason === 'invalid-input' ? 'unexpected-field' : reason); if (keys.some(k => !Object.hasOwn(r, k))) fail(reason); return r; }
function uint(v: unknown, max = Number.MAX_SAFE_INTEGER, min = 0): number { if (typeof v !== 'number' || !Number.isSafeInteger(v) || Object.is(v, -0) || v < min || v > max) fail('invalid-state'); return v; }
function id(v: unknown): string { if (typeof v !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(v)) fail(); return v; }
function bool(v: unknown): boolean { if (typeof v !== 'boolean') fail('invalid-state'); return v; }
function choice<T extends string>(v: unknown, values: readonly T[]): T { if (!values.includes(v as T)) fail('invalid-state'); return v as T; }
function arr(v: unknown, max: number): unknown[] { if (!Array.isArray(v) || v.length > max) fail('invalid-state'); return v; }
function marker(v: unknown, turn: number): void { if (v !== null) uint(v, turn); }
function unique<T>(a: T[], reason: string): void { if (new Set(a).size !== a.length) fail(reason); }


const BASE_TARGETS: Record<string, Target> = {
  "aptitude.spear.a": {
    "category": "aptitude",
    "aptitude": "spear",
    "target": "A"
  },
  "aptitude.crossbow.a": {
    "category": "aptitude",
    "aptitude": "crossbow",
    "target": "A"
  },
  "stat.war.medium": {
    "category": "stat",
    "attribute": "war",
    "target": 80
  },
  "aptitude.halberd.a": {
    "category": "aptitude",
    "aptitude": "halberd",
    "target": "A"
  },
  "aptitude.navy.a": {
    "category": "aptitude",
    "aptitude": "navy",
    "target": "A"
  },
  "skill.support": {
    "category": "skill",
    "skillKey": "support"
  },
  "skill.overlord": {
    "category": "skill",
    "skillKey": "overlord"
  },
  "skill.chain-attack": {
    "category": "skill",
    "skillKey": "chain-attack"
  },
  "aptitude.spear.b": {
    "category": "aptitude",
    "aptitude": "spear",
    "target": "B"
  },
  "aptitude.navy.b": {
    "category": "aptitude",
    "aptitude": "navy",
    "target": "B"
  },
  "aptitude.halberd.b": {
    "category": "aptitude",
    "aptitude": "halberd",
    "target": "B"
  },
  "skill.diamond": {
    "category": "skill",
    "skillKey": "diamond"
  },
  "stat.leadership.medium": {
    "category": "stat",
    "attribute": "leadership",
    "target": 80
  },
  "stat.leadership.high": {
    "category": "stat",
    "attribute": "leadership",
    "target": 95
  },
  "stat.war.high": {
    "category": "stat",
    "attribute": "war",
    "target": 95
  },
  "aptitude.crossbow.b": {
    "category": "aptitude",
    "aptitude": "crossbow",
    "target": "B"
  },
  "stat.war.low": {
    "category": "stat",
    "attribute": "war",
    "target": 70
  },
  "stat.leadership.low": {
    "category": "stat",
    "attribute": "leadership",
    "target": 70
  },
  "skill.indomitable": {
    "category": "skill",
    "skillKey": "indomitable"
  },
  "skill.fame": {
    "category": "skill",
    "skillKey": "fame"
  },
  "skill.capture": {
    "category": "skill",
    "skillKey": "capture"
  },
  "aptitude.cavalry.a": {
    "category": "aptitude",
    "aptitude": "cavalry",
    "target": "A"
  },
  "skill.range": {
    "category": "skill",
    "skillKey": "range"
  },
  "aptitude.cavalry.b": {
    "category": "aptitude",
    "aptitude": "cavalry",
    "target": "B"
  },
  "aptitude.siege.b": {
    "category": "aptitude",
    "aptitude": "siege",
    "target": "B"
  },
  "skill.iron-wall": {
    "category": "skill",
    "skillKey": "iron-wall"
  },
  "skill.efficient-official": {
    "category": "skill",
    "skillKey": "efficient-official"
  },
  "skill.debater": {
    "category": "skill",
    "skillKey": "debater"
  },
  "aptitude.siege.a": {
    "category": "aptitude",
    "aptitude": "siege",
    "target": "A"
  },
  "skill.sweep": {
    "category": "skill",
    "skillKey": "sweep"
  },
  "skill.ambush": {
    "category": "skill",
    "skillKey": "ambush"
  },
  "stat.intelligence.low": {
    "category": "stat",
    "attribute": "intelligence",
    "target": 70
  },
  "stat.politics.low": {
    "category": "stat",
    "attribute": "politics",
    "target": 70
  },
  "skill.fortification": {
    "category": "skill",
    "skillKey": "fortification"
  },
  "skill.breeding": {
    "category": "skill",
    "skillKey": "breeding"
  },
  "stat.politics.high": {
    "category": "stat",
    "attribute": "politics",
    "target": 95
  },
  "stat.intelligence.high": {
    "category": "stat",
    "attribute": "intelligence",
    "target": 95
  },
  "stat.intelligence.medium": {
    "category": "stat",
    "attribute": "intelligence",
    "target": 80
  },
  "stat.charisma.low": {
    "category": "stat",
    "attribute": "charisma",
    "target": 70
  },
  "stat.charisma.high": {
    "category": "stat",
    "attribute": "charisma",
    "target": 95
  },
  "skill.transport": {
    "category": "skill",
    "skillKey": "transport"
  },
  "skill.invention": {
    "category": "skill",
    "skillKey": "invention"
  },
  "skill.deep-plan": {
    "category": "skill",
    "skillKey": "deep-plan"
  },
  "skill.clear-mirror": {
    "category": "skill",
    "skillKey": "clear-mirror"
  },
  "skill.intimidation": {
    "category": "skill",
    "skillKey": "intimidation"
  },
  "stat.charisma.medium": {
    "category": "stat",
    "attribute": "charisma",
    "target": 80
  },
  "stat.politics.medium": {
    "category": "stat",
    "attribute": "politics",
    "target": 80
  },
  "skill.shipbuilding": {
    "category": "skill",
    "skillKey": "shipbuilding"
  }
};
freeze(BASE_TARGETS);
function validatePolicies(v: unknown): Policies {
  const p = obj(v, Object.keys(REGISTRY), 'unsupported-policy');
  for (const name of Object.keys(REGISTRY) as (keyof Policies)[]) {
    const q = obj(p[name], ['id', 'version', 'parameters'], 'unsupported-policy');
    const registered = REGISTRY[name].find(r => r.id === q.id);
    if (!registered || !same(q, registered)) fail('unsupported-policy');
  }
  return p as unknown as Policies;
}
function validateScenario(v: unknown): Scenario {
  const s = obj(v, SCENARIO_KEYS, 'invalid-state');
  if (s.profile !== 'standalone-pk-ability-guide-compat-v1') fail('unsupported-profile');
  const turn = uint(s.turn), d = obj(s.date, ['year', 'month', 'day'], 'invalid-state');
  uint(d.year, 9999, 1); uint(d.month, 12, 1); if (![1, 11, 21].includes(d.day as number)) fail('invalid-state');
  const scope = obj(s.scope, ['forceId', 'baseId', 'corpsId', 'baseKind'], 'invalid-state');
  id(scope.forceId); id(scope.baseId); id(scope.corpsId); choice(scope.baseKind, ['city', 'gate', 'port']);
  const resources = obj(s.resources, ['gold', 'actionPoints', 'techniquePoints'], 'invalid-state');
  uint(resources.gold, MAX_VALUE); uint(resources.actionPoints, 255); uint(resources.techniquePoints, 10000);
  const selections = arr(s.hiddenSelections, 5); if (selections.length !== 5) fail('invalid-hidden-selection-count');
  for (const item of selections) {
    const selection = obj(item, ['slotId', 'candidateId'], 'invalid-hidden-selection'); id(selection.slotId); id(selection.candidateId);
    const slot = CATALOG.hiddenSlots.find(x => x.id === selection.slotId);
    if (!slot || !slot.alternatives.some(x => x.id === selection.candidateId)) fail('invalid-hidden-selection');
  }
  unique(selections.map(x => (x as Scenario['hiddenSelections'][number]).slotId), 'duplicate-hidden-slot');
  unique(selections.map(x => (x as Scenario['hiddenSelections'][number]).candidateId), 'duplicate-hidden-candidate');
  const people = arr(s.officers, 256);
  for (const item of people) {
    const o = obj(item, ['id', 'forceId', 'baseId', 'available', 'actedTurn', 'stats', 'aptitudes', 'skillKey'], 'invalid-state');
    id(o.id); id(o.forceId); id(o.baseId); bool(o.available); marker(o.actedTurn, turn);
    if (o.skillKey !== null) id(o.skillKey);
    const stats = obj(o.stats, STATS, 'invalid-state'), aptitudes = obj(o.aptitudes, APTITUDES, 'invalid-state');
    for (const stat of STATS) { const n = obj(stats[stat], ['talent', 'xp'], 'invalid-state'); uint(n.talent, 100); uint(n.xp, 3000); }
    for (const aptitude of APTITUDES) choice(aptitudes[aptitude], ['C', 'B', 'A', 'S']);
  }
  unique(people.map(x => (x as PrimitiveOfficer).id), 'duplicate-officer'); validatePolicies(s.policies);
  const result = copy(s as unknown as Scenario); result.hiddenSelections.sort((a, b) => a.slotId < b.slotId ? -1 : a.slotId > b.slotId ? 1 : 0); return result;
}
function nodes(s: Pick<Scenario, 'hiddenSelections'>): Node[] {
  const base: Node[] = CATALOG.baseNodes.map(n => ({ id: n.id, name: n.name, months: n.months, costGold: n.costGold, costAP: n.costAP, trainingCategory: n.trainingCategory as Category, useLimit: n.useLimit, prerequisites: { allOf: [...n.prerequisites.allOf] }, evidence: [...n.evidence], target: copy(BASE_TARGETS[n.id]!) }));
  const hidden: Node[] = s.hiddenSelections.map(selection => {
    const n = CATALOG.hiddenSlots.find(x => x.id === selection.slotId)!.alternatives.find(x => x.id === selection.candidateId)!;
    return { id: n.id, name: n.name, months: n.months, costGold: n.costGold, costAP: n.costAP, trainingCategory: 'skill', useLimit: n.useLimit, prerequisites: { allOf: [...n.prerequisites.allOf] }, evidence: [...n.evidence], target: { category: 'skill', skillKey: n.skillKey } };
  });
  return [...base, ...hidden].sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
}
function nextDate(d: DateV1): DateV1 {
  if (d.day === 1) return { ...d, day: 11 }; if (d.day === 11) return { ...d, day: 21 };
  if (d.month < 12) return { year: d.year, month: d.month + 1, day: 1 };
  if (d.year === 9999) fail('calendar-overflow'); return { year: d.year + 1, month: 1, day: 1 };
}
function activeJobs(s: State): Job[] {
  return [...s.researchJobs.filter(j => j.status === 'active'), ...CATEGORIES.flatMap(category => s.cultivationJobs.filter(j => j.status === 'active' && j.category === category))];
}
function timing(s: State, durationTurns: number, policyId: string): Timing {
  if (!Number.isSafeInteger(s.turn + durationTurns)) fail('turn-overflow');
  let dueDate = copy(s.date); for (let i = 0; i < durationTurns; i++) dueDate = nextDate(dueDate);
  // Every Start, including a short cultivation, must preserve the longest existing job's tail.
  const maximumRemaining = Math.max(durationTurns, ...activeJobs(s).map(j => j.remainingTurns));
  if (maximumRemaining > s.remainingTickCapacity) fail('completion-history-capacity-unavailable');
  return { durationTurns, dueTurn: s.turn + durationTurns, dueDate, policyId };
}
function debit(before: number, cost: number, cap: number, policyId: string): Write { return { before, requestedDelta: -cost || 0, actualDelta: -cost || 0, after: before - cost, cap, discarded: 0, policyId }; }
function credit(before: number, requested: number, cap: number, policyId: string): Write { const actualDelta = Math.min(requested, cap - before); return { before, requestedDelta: requested, actualDelta, after: before + actualDelta, cap, discarded: requested - actualDelta, policyId }; }
function fees(s: State, p: Policy): Fees {
  const gold = p.parameters.gold as number, actionPoints = p.parameters.actionPoints as number, techniquePoints = p.parameters.techniquePoints as number;
  if (s.resources.gold < gold) fail('insufficient-gold'); if (s.resources.actionPoints < actionPoints) fail('insufficient-ap'); if (s.resources.techniquePoints < techniquePoints) fail('insufficient-technique-points');
  return { gold: debit(s.resources.gold, gold, MAX_VALUE, p.id), actionPoints: debit(s.resources.actionPoints, actionPoints, 255, p.id), techniquePoints: debit(s.resources.techniquePoints, techniquePoints, 10000, p.id) };
}
function applyFees(s: State, f: Fees): void { s.resources.gold = f.gold.after; s.resources.actionPoints = f.actionPoints.after; s.resources.techniquePoints = f.techniquePoints.after; }
function useCount(s: State, n: Node): UseCount {
  const spent = s.usesSpent[n.id]!, reserved = s.cultivationJobs.filter(j => j.nodeId === n.id && j.status === 'active').length;
  const available = n.useLimit - spent - reserved; if (!Number.isSafeInteger(spent) || spent < 0 || available < 0) fail('use-account-mismatch');
  return { limit: n.useLimit, spent, reserved, available };
}
function statInput(o: Officer, target: Extract<Target, { category: 'stat' }>): PkStatTrainingInput {
  return { profile: 's1-pk-stat-training-v1', attribute: target.attribute, xp: o.stats[target.attribute].xp, target: target.target, growth: { kind: 'ordinary-no-age', talent: o.stats[target.attribute].talent } };
}
function effect(o: Officer, target: Target, policies: Policies): Effect {
  if (target.category === 'stat') {
    const result = completePkStatTraining(statInput(o, target)); if (!result.supported) fail(result.reason);
    if (result.growthAfter === null || result.actualGrowth === null) fail('unsupported-growth-domain');
    return { category: 'stat', attribute: target.attribute, result };
  }
  if (target.category === 'aptitude') return { category: 'aptitude', aptitude: target.aptitude, before: o.aptitudes[target.aptitude], after: target.target, policyId: policies.aptitude.id };
  return { category: 'skill', before: o.skillKey, after: target.skillKey, policyId: policies.skill.id };
}
function qualification(o: Officer, target: Target, policies: Policies): Qualification {
  if (target.category === 'stat') {
    const detail = qualifyPkStatTraining(statInput(o, target));
    if (!detail.supported || !detail.eligible) return { eligible: false, reason: detail.reason };
    return { eligible: true, detail, anticipatedEffect: effect(o, target, policies) };
  }
  if (target.category === 'aptitude') {
    const before = o.aptitudes[target.aptitude], required = target.target === 'B' ? 'C' : 'B';
    if (before !== required) return { eligible: false, reason: 'aptitude-not-adjacent' };
    return { eligible: true, detail: { before, required, target: target.target, policyId: policies.aptitude.id }, anticipatedEffect: effect(o, target, policies) };
  }
  if (o.skillKey === target.skillKey) return { eligible: false, reason: 'skill-already-known' };
  return { eligible: true, detail: { before: o.skillKey, target: target.skillKey, policyId: policies.skill.id }, anticipatedEffect: effect(o, target, policies) };
}
function officerBlock(s: State, o: Officer): string | null {
  if (o.forceId !== s.scope.forceId) return 'officer-wrong-force'; if (o.baseId !== s.scope.baseId) return 'officer-not-present';
  if (!o.available) return 'officer-unavailable'; if (o.actedTurn === s.turn) return 'officer-acted-this-turn'; if (o.reservationJobId !== null) return 'officer-reserved'; return null;
}
function makeJob(s: State, e: Envelope, n: Node, t: Timing, f: Fees, officer: Officer | null, q: Qualification | null): Job {
  const kind = officer ? 'cultivation' : 'research';
  return { id: e.id, kind, status: 'active', nodeId: n.id, category: n.trainingCategory, officerId: officer?.id ?? null, startTurn: s.turn, startDate: copy(s.date), durationTurns: t.durationTurns, remainingTurns: t.durationTurns, dueTurn: t.dueTurn, dueDate: copy(t.dueDate),
    startSnapshot: { turn: s.turn, date: copy(s.date), scope: copy(s.scope), resources: copy(s.resources), node: copy(n), catalogDigest: s.catalogDigest, policies: copy(s.policies), officer: officer ? copy(officer) : null, qualification: q ? copy(q) : null, anticipatedEffect: q?.eligible ? copy(q.anticipatedEffect) : null }, fees: f, completedTurn: null, completion: null };
}
function complete(s: State, job: Job): Completion {
  if (job.remainingTurns !== 0 || job.dueTurn !== s.turn || !same(job.dueDate, s.date)) fail('completion-time-mismatch');
  const n = nodes(s).find(x => x.id === job.nodeId);
  if (!n || !same(n, job.startSnapshot.node) || !same(s.policies, job.startSnapshot.policies) || job.startSnapshot.catalogDigest !== s.catalogDigest) fail('completion-snapshot-mismatch');
  const result: Completion = { jobId: job.id, kind: job.kind, nodeId: n.id, catalogCandidateId: n.id, category: n.trainingCategory, turn: s.turn, date: copy(s.date), unlockedBefore: null, unlockedAfter: null, officerId: job.officerId, effect: null, uses: null, releasedReservation: null, actedTurn: null, sourceLevel: 'documented-guide', lifecycleLevel: 'provisional-engine-rule', policyId: s.policies.completion.id };
  if (job.kind === 'research') {
    if (s.completedNodeIds.includes(n.id) || n.prerequisites.allOf.some(p => !s.completedNodeIds.includes(p))) fail('completion-unlock-mismatch');
    result.unlockedBefore = [...s.completedNodeIds]; s.completedNodeIds.push(n.id); s.completedNodeIds.sort(); result.unlockedAfter = [...s.completedNodeIds];
  } else {
    const o = s.officers.find(x => x.id === job.officerId), initial = job.startSnapshot.officer;
    if (!o || !initial || o.reservationJobId !== job.id || initial.id !== o.id || !s.completedNodeIds.includes(n.id)) fail('reservation-mismatch');
    if (!same(o.stats, initial.stats) || !same(o.aptitudes, initial.aptitudes) || o.skillKey !== initial.skillKey) fail('reserved-officer-changed');
    // Already-started completion calls the numeric completion kernel, never its start predicate.
    const applied = effect(o, n.target, job.startSnapshot.policies);
    if (!same(applied, job.startSnapshot.anticipatedEffect)) fail('reserved-effect-mismatch');
    const before = useCount(s, n); if (before.reserved !== 1 || before.spent >= before.limit) fail('use-account-mismatch');
    if (applied.category === 'stat') o.stats[applied.attribute].xp = applied.result.xpAfter;
    else if (applied.category === 'aptitude') o.aptitudes[applied.aptitude] = applied.after;
    else o.skillKey = applied.after;
    s.usesSpent[n.id] = before.spent + 1; job.status = 'completed';
    result.effect = applied; result.uses = { nodeId: n.id, before, after: useCount(s, n), policyId: s.policies.uses.id };
    o.reservationJobId = null; o.actedTurn = s.turn; result.releasedReservation = job.id; result.actedTurn = s.turn;
  }
  job.status = 'completed'; job.completedTurn = s.turn; job.completion = result; return result;
}
function view(raw:unknown,hiddenSelections:unknown,policies:unknown):{c:SyntheticPkContext;s:State}{
 const r=obj(raw,['turn','date','forceId','cityId','corpsId','gold','actionPoints','techniquePoints','remainingTickCapacity','officers']);
 if(!sid(r.forceId)||!sid(r.cityId)||!sid(r.corpsId)||new Set([r.forceId,r.cityId,r.corpsId]).size!==3)fail('invalid-pk-owner');
 uint(r.remainingTickCapacity,360);const rows=arr(r.officers,32);if(rows.length===0)fail('invalid-pk-roster');
 const ids=new Set([r.forceId,r.cityId,r.corpsId]);
 const plain=rows.map(v=>{const o=obj(v,['id','forceId','baseId','available','actedTurn','stats','aptitudes','skillKey','reservationJobId','role']);
 if(!sid(o.id)||ids.has(o.id)||o.forceId!==r.forceId||o.baseId!==r.cityId)fail('invalid-pk-officer');ids.add(o.id);
 choice(o.role,['resident','deployed']);if(!(o.reservationJobId===null||(typeof o.reservationJobId==='string'&&/^job:[A-Za-z0-9][A-Za-z0-9_.:-]{0,63}$/.test(o.reservationJobId))))fail('invalid-pk-lock');
 const {role,reservationJobId,...rest}=o;return rest;});
 const scenario=validateScenario({profile:'standalone-pk-ability-guide-compat-v1',turn:r.turn,date:r.date,
 scope:{forceId:r.forceId,baseId:r.cityId,corpsId:r.corpsId,baseKind:'city'},resources:{gold:r.gold,actionPoints:r.actionPoints,techniquePoints:r.techniquePoints},
 hiddenSelections,officers:plain,policies});
 const c=r as unknown as SyntheticPkContext;
 return {c,s:{...scenario,officers:scenario.officers.map(o=>({...o,reservationJobId:c.officers.find(p=>p.id===o.id)!.reservationJobId})),catalogDigest:CATALOG_DIGEST,
 completedNodeIds:[],usesSpent:{},researchJobs:[],cultivationJobs:[],remainingTickCapacity:c.remainingTickCapacity}};
}
function branded(raw:unknown):Metadata{if(raw===null||typeof raw!=='object'||!trusted.has(raw))fail('untrusted-pk-metadata-rebuild-root');return copy(raw as Metadata);}
function state(raw:unknown,metadata:Metadata,advance:boolean){
 const {c,s}=view(raw,metadata.hiddenSelections,metadata.policies);
 if(!same(s.scope,metadata.scope)||!same([...c.officers.map(o=>o.id)].sort(),metadata.officerIds))fail('pk-owner-binding-mismatch');
 if(advance?(c.turn!==metadata.lastTurn+1||!same(c.date,nextDate(metadata.lastDate))):(c.turn!==metadata.lastTurn||!same(c.date,metadata.lastDate)))fail('pk-clock-mismatch');
 s.completedNodeIds=metadata.completedNodeIds;s.usesSpent=metadata.usesSpent;s.researchJobs=metadata.researchJobs;s.cultivationJobs=metadata.cultivationJobs;
 for(const job of activeJobs(s)){
  if(job.remainingTurns!==job.dueTurn-metadata.lastTurn||job.remainingTurns<1)fail('pk-job-timing-mismatch');
  if(job.kind==='cultivation'){const o=c.officers.find(o=>o.id===job.officerId);if(!o||!o.available||o.role!=='resident'||o.reservationJobId!==job.id)fail('pk-reservation-mismatch');}
 }
 return {c,s};
}
function finish(s:State,receipt:unknown){
 const metadata:Metadata={scope:copy(s.scope),officerIds:s.officers.map(o=>o.id).sort(),hiddenSelections:copy(s.hiddenSelections),policies:copy(s.policies),
 completedNodeIds:s.completedNodeIds,usesSpent:s.usesSpent,researchJobs:s.researchJobs,cultivationJobs:s.cultivationJobs,lastTurn:s.turn,lastDate:copy(s.date)};
 const patch={gold:s.resources.gold,actionPoints:s.resources.actionPoints,techniquePoints:s.resources.techniquePoints,
 officers:s.officers.map(o=>({id:o.id,stats:o.stats,aptitudes:o.aptitudes,skillKey:o.skillKey,actedTurn:o.actedTurn,reservationJobId:o.reservationJobId}))};
 if(!detachBoundedCityData({metadata,patch,receipt}).ok)fail('pk-result-budget');
 const fixed=freeze(metadata);trusted.add(fixed);return freeze({ok:true as const,metadata:fixed,patch,receipt});
}
function detachedPair(raw:unknown,arg:unknown){const d=detachBoundedCityData([raw,arg]);if(!d.ok||!Array.isArray(d.value))fail('invalid-pk-data');return d.value;}
function caught(e:unknown){return freeze({ok:false as const,reason:e instanceof Error?e.message:'invalid-pk-data'});}
export function createSyntheticPkMetadata(rawContext:unknown,rawConfig:unknown){
 try{const [raw,config]=detachedPair(rawContext,rawConfig),cfg=obj(config,['hiddenSelections','policies']);
 const {s}=view(raw,cfg.hiddenSelections,cfg.policies);s.usesSpent=Object.fromEntries(nodes(s).map(n=>[n.id,0]));
 return finish(s,{kind:'pk-initial',catalogDigest:CATALOG_DIGEST,rngDraws:0});}catch(e){return caught(e);}
}
export function planSyntheticPkStart(rawContext:unknown,rawMetadata:unknown,rawAction:unknown){
 try{const metadata=branded(rawMetadata),[raw,a]=detachedPair(rawContext,rawAction),{c,s}=state(raw,metadata,false);
 if(!a||typeof a!=='object'||Array.isArray(a))fail('invalid-pk-action');const kind=(a as Record<string,unknown>).kind;
 if(kind!=='Research'&&kind!=='Cultivate')fail('invalid-pk-action');
 const action=obj(a,kind==='Research'?['kind','jobId','nodeId']:['kind','jobId','nodeId','officerId']);
 if(!jid(action.jobId))fail('invalid-pk-job-id');id(action.nodeId);
 if([...s.researchJobs,...s.cultivationJobs].some(j=>j.id===action.jobId))fail('pk-job-id-reused');
 const available=nodes(s),n=available.find(n=>n.id===action.nodeId);if(!n)fail('inactive-or-unknown-node');
 const e:Envelope={id:action.jobId,expectedRevision:0,command:kind==='Research'?{type:'StartAbilityResearch',baseId:c.cityId,nodeId:n.id}:{type:'StartOfficerCultivation',baseId:c.cityId,nodeId:n.id,officerId:id(action.officerId)}};
 let job:Job,uses:UseWrite|null=null;
 if(kind==='Research'){
  if(s.completedNodeIds.includes(n.id))fail('node-already-researched');if(s.researchJobs.some(j=>j.status==='active'))fail('research-already-active');
  if(n.prerequisites.allOf.some(p=>!s.completedNodeIds.includes(p)))fail('missing-prerequisite');
  if(s.researchJobs.length>=available.length)fail('research-history-full');
  const t=timing(s,n.months*3,s.policies.researchClock.id),f=fees(s,s.policies.researchFees);
  job=makeJob(s,e,n,t,f,null,null);s.researchJobs.push(job);applyFees(s,f);
 }else{
  if(!s.completedNodeIds.includes(n.id))fail('node-not-researched');if(s.cultivationJobs.some(j=>j.status==='active'&&j.category===n.trainingCategory))fail('cultivation-category-active');
  const o=s.officers.find(o=>o.id===action.officerId),live=c.officers.find(o=>o.id===action.officerId);if(!o||!live||live.role!=='resident')fail('unknown-or-deployed-officer');
  const blocked=officerBlock(s,o);if(blocked)fail(blocked);
  const usesBefore=useCount(s,n);if(usesBefore.available<1)fail('node-uses-exhausted');const q=qualification(o,n.target,s.policies);if(!q.eligible)fail(q.reason);
  if(s.cultivationJobs.length>=available.reduce((sum,row)=>sum+row.useLimit,0))fail('cultivation-history-full');
  const t=timing(s,3,s.policies.cultivationClock.id),f=fees(s,s.policies.cultivationFees);
  job=makeJob(s,e,n,t,f,o,q);s.cultivationJobs.push(job);applyFees(s,f);o.reservationJobId=job.id;o.actedTurn=s.turn;
  uses={nodeId:n.id,before:usesBefore,after:useCount(s,n),policyId:s.policies.uses.id};
 }
 return finish(s,{kind:kind==='Research'?'pk-research-start':'pk-cultivation-start',job:copy(job),fees:job.fees,uses,rngDraws:0});
 }catch(e){return caught(e);}
}
export function advanceSyntheticPk(rawContext:unknown,rawMetadata:unknown){
 try{const metadata=branded(rawMetadata),[raw]=detachedPair(rawContext,null),{s}=state(raw,metadata,true),active=activeJobs(s);
 const progress=active.map(job=>({jobId:job.id,remainingBefore:job.remainingTurns,remainingAfter:job.remainingTurns-1})),completions:Completion[]=[];
 for(const job of active){job.remainingTurns--;if(job.remainingTurns===0)completions.push(complete(s,job));}
 return finish(s,{kind:'pk-advance',progress,completions,rngDraws:0});}catch(e){return caught(e);}
}
