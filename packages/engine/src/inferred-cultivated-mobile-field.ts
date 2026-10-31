import { projectSyntheticSiteAttack } from './internal/synthetic-site-strike.ts';
import { projectSyntheticStarvationBoundary } from './internal/synthetic-starvation-boundary.ts';
import { projectNeutralFieldAction, projectNeutralFieldActionWithResearchedEnergy, projectNeutralFieldActionWithEffectiveAttributes } from './internal/synthetic-neutral-field-action.ts';
import { projectRosterTerrainEntry, projectRosterRockfall, projectRosterTerrainEntryWithEnergyCaps, projectRosterRockfallWithEnergyCaps } from './internal/synthetic-roster-hazard-leaves.ts';
import { projectNeutralFireEntry, projectNeutralFireEntryWithEnergyCaps } from './internal/synthetic-neutral-fire-entry.ts';
import { projectRosterRecoveryAfterFire, projectRosterRecoveryAfterFireWithEnergyCaps, projectRosterRecoveryAfterFireAndStarvation } from './internal/synthetic-roster-recovery-after-fire.ts';
/** Opt-in cultivated roster. Full history replay; owner-only PK completion proposals. */
import { qualifyPkStatTraining } from './pk-stat-training.ts';
import { createInferredFireLifecycle, executeInferredFireLifecycle } from './inferred-fire-lifecycle.ts';
import { createInferredStrategyEffects, executeInferredStrategyEffects } from './inferred-strategy-effects.ts';
import { moveOnSuppliedMap, GUIDE_REFERENCE_MOVEMENT_POLICY } from './supplied-map-movement.ts';
import { decideInferredStrategyHit, decideInferredStrategyHitEffective255 } from './inferred-combat-requests.ts';
type Strategy = 'fire' | 'ambush' | 'discord' | 'sorcery';
type Template = Readonly<{ id: string; entryCellId: string; intelligence: number; strategies: readonly Strategy[];
  available: boolean; immune: boolean; guaranteed: boolean; beautyBonus: boolean }>;
type Condition = {kind:'normal';remaining:0} | {kind:'confused'|'false-report';remaining:number};
type Unit = { id: string; cellId: string; troops: number; energy: number; acted: boolean; condition:Condition; movementBudget: number };
type Role = ({ role: 'deployed' } & Unit) | { role: 'resident'; id: string; acted: boolean };
type Fire = Readonly<{ id: string; cellId: string; remainingTicks: number }>;
type MovementCell = Readonly<{ id: string; terrainInfoU32: number; adjacent: readonly string[]; blocked: boolean; unsupportedContext: boolean; facilityPresent: boolean }>;
type MovementMap = Readonly<{ id: string; cells: readonly MovementCell[] }>;
type MovementProfile = Readonly<{ actorId: string; landEquipmentId: number; navalEquipmentId: number; turnBudget: number }>;
type Stat = 'leadership' | 'war' | 'intelligence' | 'politics' | 'charisma';
type Aptitude = 'spear' | 'halberd' | 'crossbow' | 'cavalry' | 'siege' | 'navy';
type Grade = 'C' | 'B' | 'A' | 'S';
type Facts = Readonly<{ actorId: string; stats: Readonly<Record<Stat, number>>; aptitudes: Readonly<Record<Aptitude, Grade>>; skillKey: string | null }>;
type CombatPanel = Readonly<{attack:number;defense:number}>;
type CombatActor = Readonly<{id:string;ownerId:string;weapon:'sword'|'spear'|'halberd'|'crossbow'|'cavalry';panels:{normal:CombatPanel;confused:CombatPanel}}>;
type CombatMap = Readonly<{qMin:number;qMax:number;rMin:number;rMax:number;cells:readonly {id:string;q:number;r:number;terrain:'plain'|'grass'|'sand'|'forest'|'wasteland'|'wetland'|'road';height:number;blocked:boolean}[]}>;
type Enemy = Readonly<{template:Template;movementProfile:MovementProfile;facts:Facts;troops:number;energy:number}>;
type Encounter = Readonly<{id:string;homeOwnerId:string;enemyOwnerId:string;enemyTroopBudget:number;enemyActors:readonly Enemy[];combatMap:CombatMap;combatActors:readonly CombatActor[];foodRaidMode?:'external-positive-proposal-v1';enemyTechniqueIds?:readonly number[]}>;
type HazardConfig = Readonly<{rockfalls:readonly {id:string;footprint:readonly string[]}[]}>;
type StageDraw = {stage:string;bound:100;value:number};
type FireVisitDraw = {pathIndex:number;cellId:string;fireId:string;draw:number};
type NormalAction = Readonly<{kind:'FalseReport';actorId:string;targetId:string;draws:readonly StageDraw[]}> | Readonly<{kind:'Rockfall';hazardId:string;draws:readonly {targetId:string;draw:number}[]}> | Readonly<{kind:'Attack';actorId:string;targetId:string;attackKind:'normal-melee'|'normal-arrow';draws?:readonly StageDraw[]}> | Readonly<{ kind: 'FieldTick'; draws: readonly { targetId: string; draw: number }[] }>
  | Readonly<{ kind: 'Move'; actorId: string; path: readonly string[]; terrainDraws?:readonly number[]; fireDraws?:readonly FireVisitDraw[] }>
  | Readonly<{ kind: 'Deploy'; actorId: string; troops: number; energy: number }>
  | Readonly<{ kind: 'Return'; actorId: string }>
  | Readonly<{ kind: 'Cast'; casterId: string; strategy: Exclude<Strategy, 'fire'>; targets: readonly string[]; roll: number }>
  | Readonly<{ kind: 'FireCast'; casterId: string; cellId: string; fireId: string; roll: number; durationDraw: number }>;
type StarvationProfile=Readonly<{profile:'inferred-whole-zero-food-tick-retain76-positive-v1';homeOwnerId:string;enemyOwnerId:string|null}>;
type StarvationBoundary=Readonly<{turnBefore:number;eligibleActorIds:readonly string[];foodAllocations:readonly {actorId:string;food:number}[]}>;
type EffectiveFacts = Readonly<{actorId:string;stats:Readonly<Record<Stat,number>>}>;
type EffectiveProfile = Readonly<{profile:'live-equipment-effective255-v1';effectiveBaseline:readonly EffectiveFacts[]}>;
type EnergyProfile = Readonly<{profile:'researched-morale120-v1';homeOwnerId:string;homeTechniqueIds:readonly number[];enemyTechniqueIds:readonly number[]}>;
type SiteStrike=Readonly<{actorId:string;siteId:string;context:Readonly<Record<string,unknown>>}>;
type OwnerStep = Readonly<{ kind: 'OuterStep'; sourceOuterCommandId: string; fieldAction: NormalAction | null; factsUpdates: readonly { before: Facts; after: Facts }[]; completionJobs: readonly { jobId: string; actorId: string }[];siteStrike?:SiteStrike;starvationBoundary?:StarvationBoundary;effectiveFactsUpdates?:readonly {before:EffectiveFacts;after:EffectiveFacts}[];energyHomeTechniquesAfter?:readonly number[];combatTechniquesByOwner?:readonly {ownerId:string;techniques:readonly number[]}[] }>;
type Action = NormalAction | OwnerStep;
type Command = Readonly<{ id: string; expectedRevision: number; action: Action }>;
type State = Readonly<{ schema: 'inferred-cultivated-mobile-field-v4'; cells: readonly string[]; templates: readonly Template[]; movementMap: MovementMap; movementProfiles: readonly MovementProfile[]; cultivationBaseline: readonly Facts[]; encounterConfig?: Encounter | null; hazardConfig?:HazardConfig|null; energyProfile?:EnergyProfile; effectiveProfile?:EffectiveProfile; starvationProfile?:StarvationProfile; commands: readonly Command[] }>;
const COST = Object.freeze({ fire: 10, ambush: 10, discord: 20, sorcery: 30 });
const fail = (reason: string) => Object.freeze({ ok: false as const, reason });
const uint = (v: unknown, max: number): v is number => typeof v === 'number' && Number.isSafeInteger(v) && !Object.is(v, -0) && v >= 0 && v <= max;
const record = (v: unknown): v is Record<string, unknown> => v !== null && typeof v === 'object' && !Array.isArray(v);
const keys = (v: Record<string, unknown>, expected: readonly string[]) => Object.keys(v).length === expected.length && expected.every(k => Object.hasOwn(v, k));
const id = (v: unknown): v is string => typeof v === 'string' && /^synthetic-[a-z0-9-]{1,48}$/.test(v);
const strategy = (v: unknown): v is Strategy => v === 'fire' || v === 'ambush' || v === 'discord' || v === 'sorcery';
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






const STATS: Stat[] = ['leadership', 'war', 'intelligence', 'politics', 'charisma'];
const APTITUDES: Aptitude[] = ['spear', 'halberd', 'crossbow', 'cavalry', 'siege', 'navy'];
const GRADES: Grade[] = ['C', 'B', 'A', 'S'];
function factsFrom(v: unknown): Facts | undefined {
  if (!record(v) || !keys(v, ['actorId', 'stats', 'aptitudes', 'skillKey']) || !id(v.actorId)
    || !record(v.stats) || !record(v.aptitudes)
    || !(v.skillKey === null || typeof v.skillKey === 'string' && /^[a-zA-Z0-9_-]{1,64}$/.test(v.skillKey))) return undefined;
  const stats = v.stats, aptitudes = v.aptitudes;
  if (!keys(stats, STATS) || !STATS.every(k => uint(stats[k], 100) && (stats[k] as number) >= 1)
    || !keys(aptitudes, APTITUDES) || !APTITUDES.every(k => GRADES.includes(aptitudes[k] as Grade))) return undefined;
  return { actorId: v.actorId, stats: Object.fromEntries(STATS.map(k => [k, stats[k]])) as Record<Stat, number>,
    aptitudes: Object.fromEntries(APTITUDES.map(k => [k, aptitudes[k]])) as Record<Aptitude, Grade>, skillKey: v.skillKey };
}
function effectiveFactsFrom(value:unknown):EffectiveFacts|undefined {
  if(!record(value)||!keys(value,['actorId','stats'])||!id(value.actorId)||!record(value.stats)||!keys(value.stats,STATS))return undefined;
  const stats=value.stats;
  if(!STATS.every(k=>uint(stats[k],255)))return undefined;
  return {actorId:value.actorId,stats:Object.fromEntries(STATS.map(k=>[k,stats[k]])) as Record<Stat,number>};
}
function sameEffective(a:EffectiveFacts,b:EffectiveFacts){return a.actorId===b.actorId&&STATS.every(k=>a.stats[k]===b.stats[k]);}
function techniqueIds(value:unknown):number[]|undefined {
  return Array.isArray(value)&&value.length<=36&&value.every(t=>uint(t,35))&&new Set(value).size===value.length ? [...value] : undefined;
}
function sameTechniques(a:readonly number[],b:readonly number[]) {return a.length===b.length&&a.every(t=>b.includes(t));}
function energyProfileFrom(value:unknown):EnergyProfile|undefined {
  if(!record(value)||!keys(value,['profile','homeOwnerId','homeTechniqueIds','enemyTechniqueIds'])||value.profile!=='researched-morale120-v1'||!id(value.homeOwnerId))return undefined;
  const homeTechniqueIds=techniqueIds(value.homeTechniqueIds),enemyTechniqueIds=techniqueIds(value.enemyTechniqueIds);
  return homeTechniqueIds&&enemyTechniqueIds?{profile:value.profile,homeOwnerId:value.homeOwnerId,homeTechniqueIds,enemyTechniqueIds}:undefined;
}
function encounterFrom(input: unknown, cells: readonly string[], home: readonly Template[], profiles: readonly MovementProfile[], map: MovementMap, enemyEnergyCap:100|120=100): Encounter | null | undefined {
  if (input === null) return null;
  if (!record(input) || !(keys(input,['id','homeOwnerId','enemyOwnerId','enemyTroopBudget','enemyActors','combatMap','combatActors'])||keys(input,['id','homeOwnerId','enemyOwnerId','enemyTroopBudget','enemyActors','combatMap','combatActors','foodRaidMode','enemyTechniqueIds']))
    || !id(input.id) || !id(input.homeOwnerId) || !id(input.enemyOwnerId) || input.homeOwnerId===input.enemyOwnerId
    || !uint(input.enemyTroopBudget,8000000) || input.enemyTroopBudget===0 || !Array.isArray(input.enemyActors)
    || input.enemyActors.length<1 || home.length+input.enemyActors.length>8 || !Array.isArray(input.combatActors)) return undefined;
  if(Object.hasOwn(input,'foodRaidMode')&&(input.foodRaidMode!=='external-positive-proposal-v1'||!Array.isArray(input.enemyTechniqueIds)||input.enemyTechniqueIds.length>36||!input.enemyTechniqueIds.every(t=>uint(t,35))||new Set(input.enemyTechniqueIds).size!==input.enemyTechniqueIds.length))return undefined;
  const owners=[input.homeOwnerId,input.enemyOwnerId], enemyActors:Enemy[]=[], allIds=home.map(t=>t.id), positions=new Set<string>();
  if (owners.some(o=>cells.includes(o)||allIds.includes(o)) || owners.includes(input.id)) return undefined;
  for (const raw of input.enemyActors) {
    if (!record(raw)||!keys(raw,['template','movementProfile','facts','troops','energy'])||!record(raw.template)||!record(raw.movementProfile)
      ||!uint(raw.troops,1000000)||raw.troops===0||!uint(raw.energy,enemyEnergyCap)) return undefined;
    const t=raw.template,p=raw.movementProfile,f=factsFrom(raw.facts);
    if (!keys(t,['id','entryCellId','intelligence','strategies','available','immune','guaranteed','beautyBonus'])||!id(t.id)||allIds.includes(t.id)
      ||owners.includes(t.id)||cells.includes(t.id)||!id(t.entryCellId)||positions.has(t.entryCellId)||!uint(t.intelligence,100)
      ||!Array.isArray(t.strategies)||t.strategies.length>4||!t.strategies.every(strategy)||new Set(t.strategies).size!==t.strategies.length
      ||typeof t.available!=='boolean'||typeof t.immune!=='boolean'||typeof t.guaranteed!=='boolean'||typeof t.beautyBonus!=='boolean'
      ||!f||f.actorId!==t.id||!keys(p,['actorId','landEquipmentId','navalEquipmentId','turnBudget'])||p.actorId!==t.id
      ||!uint(p.landEquipmentId,8)||!uint(p.navalEquipmentId,11)||p.navalEquipmentId<9||!uint(p.turnBudget,255)||p.turnBudget===0) return undefined;
    const entry=map.cells.find(c=>c.id===t.entryCellId);
    if (!entry||entry.blocked||entry.unsupportedContext||entry.facilityPresent) return undefined;
    allIds.push(t.id);positions.add(t.entryCellId);
    enemyActors.push({template:{id:t.id,entryCellId:t.entryCellId,intelligence:t.intelligence,strategies:[...t.strategies] as Strategy[],
      available:t.available,immune:t.immune,guaranteed:t.guaranteed,beautyBonus:t.beautyBonus},
      movementProfile:{actorId:t.id,landEquipmentId:p.landEquipmentId,navalEquipmentId:p.navalEquipmentId,turnBudget:p.turnBudget},facts:f,troops:raw.troops,energy:raw.energy});
  }
  if (enemyActors.reduce((n,e)=>n+e.troops,0)!==input.enemyTroopBudget) return undefined;
  const m=input.combatMap;
  if(!record(m)||!keys(m,['qMin','qMax','rMin','rMax','cells'])||!uint(m.qMin,15)||!uint(m.qMax,15)||m.qMax<m.qMin
    ||!uint(m.rMin,15)||!uint(m.rMax,15)||m.rMax<m.rMin||!Array.isArray(m.cells)||m.cells.length!==cells.length
    ||(m.qMax-m.qMin+1)*(m.rMax-m.rMin+1)!==cells.length) return undefined;
  const combatCells:CombatMap['cells'][number][]=[],coords=new Set<string>();
  for(const raw of m.cells){
    if(!record(raw)||!keys(raw,['id','q','r','terrain','height','blocked'])||!id(raw.id)||!cells.includes(raw.id)||allIds.includes(raw.id)
      ||combatCells.some(c=>c.id===raw.id)||!uint(raw.q,m.qMax)||raw.q<m.qMin||!uint(raw.r,m.rMax)||raw.r<m.rMin
      ||coords.has(`${raw.q},${raw.r}`)||!['plain','grass','sand','forest','wasteland','wetland','road'].includes(raw.terrain as string)
      ||!uint(raw.height,255)||typeof raw.blocked!=='boolean'||raw.blocked!==map.cells.find(c=>c.id===raw.id)!.blocked) return undefined;
    coords.add(`${raw.q},${raw.r}`);combatCells.push({id:raw.id,q:raw.q,r:raw.r,terrain:raw.terrain as CombatMap['cells'][number]['terrain'],height:raw.height,blocked:raw.blocked});
  }
  // Explicit neutral-ground bridge: one cell identity and geometry across movement and attack.
  if(map.cells.some(c=>c.terrainInfoU32!==0||c.unsupportedContext||c.facilityPresent)||combatCells.some(c=>c.terrain!=='plain'))return undefined;
  for(const c of map.cells){
    const from=combatCells.find(x=>x.id===c.id)!;
    for(const next of c.adjacent){const to=combatCells.find(x=>x.id===next)!;const q=from.q-to.q,r=from.r-to.r;
      if(Math.max(Math.abs(q),Math.abs(r),Math.abs(q+r))!==1)return undefined;}
  }
  const combatActors:CombatActor[]=[];
  for(const raw of input.combatActors){
    if(!record(raw)||!keys(raw,['id','ownerId','weapon','panels'])||!id(raw.id)||!allIds.includes(raw.id)||combatActors.some(a=>a.id===raw.id)
      ||raw.ownerId!==(home.some(t=>t.id===raw.id)?input.homeOwnerId:input.enemyOwnerId)
      ||!['sword','spear','halberd','crossbow','cavalry'].includes(raw.weapon as string)||!record(raw.panels)||!keys(raw.panels,['normal','confused'])) return undefined;
    const normal=raw.panels.normal,confused=raw.panels.confused;
    if(!record(normal)||!keys(normal,['attack','defense'])||!uint(normal.attack,255)||!uint(normal.defense,255)
      ||!record(confused)||!keys(confused,['attack','defense'])||!uint(confused.attack,255)||!uint(confused.defense,255))return undefined;
    const movement=profiles.find(p=>p.actorId===raw.id) ?? enemyActors.find(e=>e.template.id===raw.id)?.movementProfile;
    if(!movement || ['sword','spear','halberd','crossbow','cavalry'][movement.landEquipmentId]!==raw.weapon)return undefined;
    combatActors.push({id:raw.id,ownerId:raw.ownerId as string,weapon:raw.weapon as CombatActor['weapon'],
      panels:{normal:{attack:normal.attack,defense:normal.defense},confused:{attack:confused.attack,defense:confused.defense}}});
  }
  if(combatActors.length!==allIds.length)return undefined;
  return {id:input.id,homeOwnerId:input.homeOwnerId,enemyOwnerId:input.enemyOwnerId,enemyTroopBudget:input.enemyTroopBudget,enemyActors,
    combatMap:{qMin:m.qMin,qMax:m.qMax,rMin:m.rMin,rMax:m.rMax,cells:combatCells},combatActors,...(Object.hasOwn(input,'foodRaidMode')?{foodRaidMode:'external-positive-proposal-v1' as const,enemyTechniqueIds:[...(input.enemyTechniqueIds as number[])]}:{})};
}
const sameFacts = (a: Facts, b: Facts) => JSON.stringify(a) === JSON.stringify(b);
/** Uses the existing ordinary-no-age getter domain, not talent alone or a new growth formula. */
export function resolveSyntheticCultivationFacts(input: unknown) {
  let v: unknown; try { v = detach(input); } catch { return fail('invalid-cultivation-input'); }
  if (!record(v) || !keys(v, ['actorId', 'stats', 'aptitudes', 'skillKey']) || !record(v.stats) || !keys(v.stats, STATS)) return fail('invalid-cultivation-input');
  const stats = {} as Record<Stat, number>;
  for (const attribute of STATS) {
    const value = v.stats[attribute];
    if (!record(value) || !keys(value, ['talent', 'xp']) || !uint(value.talent, 100) || !uint(value.xp, 3000)) return fail('invalid-cultivation-stat');
    const qualified = qualifyPkStatTraining({ profile: 's1-pk-stat-training-v1', attribute, xp: value.xp,
      target: 100, growth: { kind: 'ordinary-no-age', talent: value.talent } });
    if (!qualified.supported) return fail(`cultivation-stat:${qualified.reason}`);
    stats[attribute] = qualified.growthBefore;
  }
  const facts = factsFrom({ actorId: v.actorId, stats, aptitudes: v.aptitudes, skillKey: v.skillKey });
  return facts ? frozen({ ok: true as const, facts }) : fail('invalid-cultivation-facts');
}

function commandFrom(v: unknown): Command | undefined {
  if (!record(v) || !keys(v, ['id', 'expectedRevision', 'action']) || !id(v.id) || !uint(v.expectedRevision, 31) || !record(v.action)) return undefined;
  const a = v.action; let action: Action;
  if (a.kind === 'OuterStep' && keys(a, ['kind','sourceOuterCommandId','fieldAction','factsUpdates','completionJobs',...(Object.hasOwn(a,'combatTechniquesByOwner')?['combatTechniquesByOwner']:[]),...(Object.hasOwn(a,'energyHomeTechniquesAfter')?['energyHomeTechniquesAfter']:[]),...(Object.hasOwn(a,'effectiveFactsUpdates')?['effectiveFactsUpdates']:[]),...(Object.hasOwn(a,'starvationBoundary')?['starvationBoundary']:[]),...(Object.hasOwn(a,'siteStrike')?['siteStrike']:[])])
    && a.sourceOuterCommandId === v.id && Array.isArray(a.factsUpdates) && a.factsUpdates.length <= 8
    && Array.isArray(a.completionJobs) && a.completionJobs.length <= 8) {
    let fieldAction: NormalAction | null = null;
    if (a.fieldAction !== null) {
      if (!record(a.fieldAction) || a.fieldAction.kind === 'OuterStep') return undefined;
      const nested = commandFrom({ id: v.id, expectedRevision: 0, action: a.fieldAction });
      if (!nested || nested.action.kind === 'OuterStep') return undefined;
      fieldAction = nested.action;
    }
    const factsUpdates: { before: Facts; after: Facts }[] = [], completionJobs: {jobId: string; actorId: string}[] = [];
    for (const raw of a.factsUpdates) {
      if (!record(raw) || !keys(raw, ['before', 'after'])) return undefined;
      const before = factsFrom(raw.before), after = factsFrom(raw.after);
      if (!before || !after || before.actorId !== after.actorId || factsUpdates.some(x => x.before.actorId === before.actorId)
        || STATS.some(k => after.stats[k] < before.stats[k])
        || APTITUDES.some(k => GRADES.indexOf(after.aptitudes[k]) < GRADES.indexOf(before.aptitudes[k]))) return undefined;
      factsUpdates.push({before, after});
    }
    for (const raw of a.completionJobs) {
      if (!record(raw) || !keys(raw, ['jobId', 'actorId']) || !id(raw.actorId) || typeof raw.jobId !== 'string'
        || !/^job:synthetic-[a-z0-9-]{1,48}$/.test(raw.jobId)
        || completionJobs.some(x => x.jobId === raw.jobId || x.actorId === raw.actorId)) return undefined;
      completionJobs.push({jobId: raw.jobId, actorId: raw.actorId});
    }
    const combatTechniquesByOwner:{ownerId:string;techniques:number[]}[]=[];
    if(Object.hasOwn(a,'combatTechniquesByOwner')){
      if(!Array.isArray(a.combatTechniquesByOwner)||a.combatTechniquesByOwner.length!==2)return undefined;
      for(const t of a.combatTechniquesByOwner){if(!record(t)||!keys(t,['ownerId','techniques'])||!id(t.ownerId)||combatTechniquesByOwner.some(x=>x.ownerId===t.ownerId)
        ||!Array.isArray(t.techniques)||t.techniques.length>36||!t.techniques.every(x=>uint(x,35))||new Set(t.techniques).size!==t.techniques.length)return undefined;
        combatTechniquesByOwner.push({ownerId:t.ownerId,techniques:[...t.techniques] as number[]});}
    }
    let siteStrike:SiteStrike|undefined;
    if(Object.hasOwn(a,'siteStrike')){
      const strike=a.siteStrike;
      if(fieldAction!==null||!record(strike)||!keys(strike,['actorId','siteId','context'])||!id(strike.actorId)||!id(strike.siteId)
        ||!record(strike.context)||!keys(strike.context,['homeOwnerId','homeCellId','site','governor','response'])
        ||!record(strike.context.site)||strike.context.site.id!==strike.siteId)return undefined;
      siteStrike={actorId:strike.actorId,siteId:strike.siteId,context:strike.context};
    }
    let starvationBoundary:StarvationBoundary|undefined;
    if(Object.hasOwn(a,'starvationBoundary')){
      const b=a.starvationBoundary;
      if(!record(b)||!keys(b,['turnBefore','eligibleActorIds','foodAllocations'])||!uint(b.turnBefore,32)
        ||!Array.isArray(b.eligibleActorIds)||b.eligibleActorIds.length>8||!b.eligibleActorIds.every(id)||new Set(b.eligibleActorIds).size!==b.eligibleActorIds.length
        ||!Array.isArray(b.foodAllocations)||b.foodAllocations.length>8)return undefined;
      const foodAllocations:{actorId:string;food:number}[]=[];
      for(const f of b.foodAllocations){if(!record(f)||!keys(f,['actorId','food'])||!id(f.actorId)||!uint(f.food,50000)||foodAllocations.some(x=>x.actorId===f.actorId))return undefined;foodAllocations.push({actorId:f.actorId,food:f.food});}
      starvationBoundary={turnBefore:b.turnBefore,eligibleActorIds:[...b.eligibleActorIds] as string[],foodAllocations};
    }
    const effectiveFactsUpdates:{before:EffectiveFacts;after:EffectiveFacts}[]=[];
    if(Object.hasOwn(a,'effectiveFactsUpdates')){
      if(!Array.isArray(a.effectiveFactsUpdates)||a.effectiveFactsUpdates.length>8)return undefined;
      for(const row of a.effectiveFactsUpdates){
        if(!record(row)||!keys(row,['before','after']))return undefined;
        const before=effectiveFactsFrom(row.before),after=effectiveFactsFrom(row.after);
        if(!before||!after||before.actorId!==after.actorId||effectiveFactsUpdates.some(x=>x.before.actorId===before.actorId))return undefined;
        effectiveFactsUpdates.push({before,after});
      }
    }
    const energyHomeTechniquesAfter=Object.hasOwn(a,'energyHomeTechniquesAfter')?techniqueIds(a.energyHomeTechniquesAfter):undefined;
    if(Object.hasOwn(a,'energyHomeTechniquesAfter')&&!energyHomeTechniquesAfter)return undefined;
    action = {kind: a.kind, ...(siteStrike?{siteStrike}:{}), ...(starvationBoundary?{starvationBoundary}:{}), ...(Object.hasOwn(a,'effectiveFactsUpdates')?{effectiveFactsUpdates}:{}), ...(energyHomeTechniquesAfter?{energyHomeTechniquesAfter}:{}), ...(Object.hasOwn(a,'combatTechniquesByOwner')?{combatTechniquesByOwner}:{}), sourceOuterCommandId: a.sourceOuterCommandId as string, fieldAction, factsUpdates, completionJobs};
  } else if (a.kind === 'FalseReport' && keys(a,['kind','actorId','targetId','draws']) && id(a.actorId)&&id(a.targetId)&&a.actorId!==a.targetId
    && Array.isArray(a.draws)&&a.draws.length<=3) {
    const draws:StageDraw[]=[];
    for(const d of a.draws){if(!record(d)||!keys(d,['stage','bound','value'])||!['strategy.hit','strategy.critical','strategy.duration'].includes(d.stage as string)||d.bound!==100||!uint(d.value,99))return undefined;draws.push({stage:d.stage as string,bound:100,value:d.value});}
    action={kind:a.kind,actorId:a.actorId,targetId:a.targetId,draws};
  } else if (a.kind === 'Rockfall' && keys(a,['kind','hazardId','draws'])&&id(a.hazardId)&&Array.isArray(a.draws)&&a.draws.length<=8){
    const draws:{targetId:string;draw:number}[]=[];
    for(const d of a.draws){if(!record(d)||!keys(d,['targetId','draw'])||!id(d.targetId)||!uint(d.draw,999))return undefined;draws.push({targetId:d.targetId,draw:d.draw});}
    action={kind:a.kind,hazardId:a.hazardId,draws};
  } else if (a.kind === 'Attack' && (keys(a, ['kind','actorId','targetId','attackKind'])||keys(a,['kind','actorId','targetId','attackKind','draws'])) && id(a.actorId) && id(a.targetId)
    && a.actorId !== a.targetId && (a.attackKind === 'normal-melee' || a.attackKind === 'normal-arrow')) {
    const draws:StageDraw[]=[];
    if(Object.hasOwn(a,'draws')){if(!Array.isArray(a.draws)||a.draws.length>8)return undefined;
      for(const d of a.draws){if(!record(d)||!keys(d,['stage','bound','value'])||typeof d.stage!=='string'||!/^(attack\.[0-7]\.(shield|critical)|reaction\.(shield|critical|avoid))$/.test(d.stage)||d.bound!==100||!uint(d.value,99))return undefined;draws.push({stage:d.stage,bound:100,value:d.value});}}
    action = {kind:a.kind,actorId:a.actorId,targetId:a.targetId,attackKind:a.attackKind,...(Object.hasOwn(a,'draws')?{draws}:{})};
  } else if (a.kind === 'FieldTick' && keys(a, ['kind', 'draws']) && Array.isArray(a.draws) && a.draws.length <= 8) {
    const draws: { targetId: string; draw: number }[] = [];
    for (const d of a.draws) { if (!record(d) || !keys(d, ['targetId', 'draw']) || !id(d.targetId) || !uint(d.draw, 200)) return undefined; draws.push({ targetId: d.targetId, draw: d.draw }); }
    action = { kind: a.kind, draws };
  } else if (a.kind === 'Cast' && keys(a, ['kind', 'casterId', 'strategy', 'targets', 'roll']) && id(a.casterId)
    && strategy(a.strategy) && a.strategy !== 'fire' && Array.isArray(a.targets) && a.targets.length > 0 && a.targets.length <= 3
    && a.targets.every(id) && new Set(a.targets).size === a.targets.length && !a.targets.includes(a.casterId) && uint(a.roll, 99)
    && (a.strategy !== 'ambush' || a.targets.length === 1) && (a.strategy !== 'discord' || a.targets.length === 2)) {
    action = { kind: a.kind, casterId: a.casterId, strategy: a.strategy, targets: [...a.targets], roll: a.roll };
  } else if (a.kind === 'FireCast' && keys(a, ['kind', 'casterId', 'cellId', 'fireId', 'roll', 'durationDraw'])
    && id(a.casterId) && id(a.cellId) && id(a.fireId) && uint(a.roll, 99) && uint(a.durationDraw, 99)) {
    action = { kind: a.kind, casterId: a.casterId, cellId: a.cellId, fireId: a.fireId, roll: a.roll, durationDraw: a.durationDraw };
  } else if (a.kind === 'Move' && (keys(a, ['kind', 'actorId', 'path']) || keys(a,['kind','actorId','path','terrainDraws','fireDraws'])) && id(a.actorId)
    && Array.isArray(a.path) && a.path.length > 0 && a.path.length <= 16 && a.path.every(id)) {
    const terrainDraws=a.terrainDraws??[],fireDraws=a.fireDraws??[];
    if(!Array.isArray(terrainDraws)||terrainDraws.length>16||!terrainDraws.every(v=>uint(v,199))||!Array.isArray(fireDraws)||fireDraws.length>16)return undefined;
    const parsed:FireVisitDraw[]=[];
    for(const d of fireDraws){if(!record(d)||!keys(d,['pathIndex','cellId','fireId','draw'])||!uint(d.pathIndex,15)||!id(d.cellId)||!id(d.fireId)||!uint(d.draw,200))return undefined;parsed.push({pathIndex:d.pathIndex,cellId:d.cellId,fireId:d.fireId,draw:d.draw});}
    action = { kind: a.kind, actorId: a.actorId, path: [...a.path], ...(Object.hasOwn(a,'terrainDraws')?{terrainDraws:[...terrainDraws],fireDraws:parsed}:{}) };
  } else if (a.kind === 'Deploy' && keys(a, ['kind', 'actorId', 'troops', 'energy']) && id(a.actorId)
    && uint(a.troops, 1000000) && a.troops > 0 && uint(a.energy, 120)) {
    action = { kind: a.kind, actorId: a.actorId, troops: a.troops, energy: a.energy };
  } else if (a.kind === 'Return' && keys(a, ['kind', 'actorId']) && id(a.actorId)) {
    action = { kind: a.kind, actorId: a.actorId };
  } else return undefined;
  return { id: v.id, expectedRevision: v.expectedRevision, action };
}
/** Transient projections contain no independent history accepted from callers. */
function fireProjection(cells: readonly string[], roster: readonly Unit[], fires: readonly Fire[]) {
  const created = createInferredFireLifecycle(cells, roster.map(u => ({ id: u.id, cellId: u.cellId, value: u.troops })));
  if (!created.ok) return created;
  let session = created;
  for (let i = 0; i < fires.length; i++) {
    const f = fires[i]!;
    if (!uint(f.remainingTicks, 3) || f.remainingTicks === 0) return fail('unsupported-fire-projection-duration');
    const seeded = executeInferredFireLifecycle(session.state, { id: `synthetic-seed-${i}`, expectedRevision: session.revision,
      action: { kind: 'Ignite', fireId: f.id, cellId: f.cellId, durationDraw: f.remainingTicks === 1 ? 0 : 99, critical: f.remainingTicks === 3 } });
    if (!seeded.ok) return seeded;
    if (seeded.fires.find(fire => fire.id === f.id)?.remainingTicks !== f.remainingTicks) return fail('fire-duration-policy-not-projectable');
    session = seeded;
  }
  return session;
}
function effectProjection(roster: readonly Unit[], effectiveAttributes=false) {
  return createInferredStrategyEffects(roster.map(u => ({ id: u.id, troops: u.troops, acted: u.acted, confusedTurns: u.condition.kind==='confused'?u.condition.remaining:0 })), effectiveAttributes?'same-formula-intelligence255-v1':undefined);
}
function hazardRoster(roster:readonly Unit[]) {return roster.map(u=>({id:u.id,cellId:u.cellId,troops:u.troops,energy:u.energy,acted:u.acted,status:u.condition.kind,remaining:u.condition.remaining}));}
function condition(status:'normal'|'confused'|'false-report',remaining:number):Condition{return status==='normal'?{kind:'normal',remaining:0}:{kind:status,remaining};}
/** Proposal replay only: city inventory/actor eligibility is a mandatory outer-world check. */
function replay(input: unknown) {
  const hasStarvation=record(input)&&Object.hasOwn(input,'starvationProfile');
  const hasEffective=record(input)&&Object.hasOwn(input,'effectiveProfile');
  const hasEnergy=record(input)&&Object.hasOwn(input,'energyProfile');
  const energyProfile=hasEnergy&&record(input)?energyProfileFrom(input.energyProfile):undefined;
  if(hasEnergy&&!energyProfile)return fail('invalid-energy-profile');
  const hadEncounter=record(input)&&Object.hasOwn(input,'encounterConfig'),hadHazard=record(input)&&Object.hasOwn(input,'hazardConfig');
  if (record(input) && !Object.hasOwn(input, 'encounterConfig')) input = {...input, encounterConfig:null};
  if (record(input) && !Object.hasOwn(input, 'hazardConfig')) input = {...input,hazardConfig:null};
  if (!record(input) || !keys(input, ['schema', 'cells', 'templates', 'movementMap', 'movementProfiles', 'cultivationBaseline', 'encounterConfig', 'hazardConfig', 'commands',...(hasEnergy?['energyProfile']:[]),...(hasEffective?['effectiveProfile']:[]),...(hasStarvation?['starvationProfile']:[])]) || input.schema !== 'inferred-cultivated-mobile-field-v4'
    || !Array.isArray(input.cells) || input.cells.length < 1 || input.cells.length > 16 || !input.cells.every(id) || new Set(input.cells).size !== input.cells.length
    || !Array.isArray(input.templates) || input.templates.length < 1 || input.templates.length > 8 || !Array.isArray(input.commands) || input.commands.length > 32) return fail('invalid-field');
  const cells: string[] = [...input.cells], templates: Template[] = [], ids = new Set<string>();
  for (const a of input.templates) {
    if (!record(a) || !keys(a, ['id', 'entryCellId', 'intelligence', 'strategies', 'available', 'immune', 'guaranteed', 'beautyBonus'])
      || !id(a.id) || ids.has(a.id) || !id(a.entryCellId) || !cells.includes(a.entryCellId) || !uint(a.intelligence, 100)
      || !Array.isArray(a.strategies) || a.strategies.length > 4 || !a.strategies.every(strategy) || new Set(a.strategies).size !== a.strategies.length
      || typeof a.available !== 'boolean' || typeof a.immune !== 'boolean' || typeof a.guaranteed !== 'boolean' || typeof a.beautyBonus !== 'boolean') return fail('invalid-field-template');
    ids.add(a.id); templates.push({ id: a.id, entryCellId: a.entryCellId, intelligence: a.intelligence, strategies: [...a.strategies],
      available: a.available, immune: a.immune, guaranteed: a.guaranteed, beautyBonus: a.beautyBonus });
  }
  if (!Array.isArray(input.cultivationBaseline) || input.cultivationBaseline.length !== templates.length) return fail('invalid-cultivation-baseline');
  const cultivationBaseline: Facts[] = [];
  for (let i = 0; i < templates.length; i++) {
    const facts = factsFrom(input.cultivationBaseline[i]);
    if (!facts || facts.actorId !== templates[i]!.id) return fail('invalid-cultivation-baseline');
    cultivationBaseline.push(facts);
  }
  const currentFacts = [...cultivationBaseline], usedCultivationJobs = new Set<string>();
  // A supplied finite map, not a native map: no mutable occupancy or fire flags accepted.
  if (!record(input.movementMap) || !keys(input.movementMap, ['id', 'cells']) || !id(input.movementMap.id)
    || !Array.isArray(input.movementMap.cells) || input.movementMap.cells.length !== cells.length
    || !Array.isArray(input.movementProfiles) || input.movementProfiles.length !== templates.length) return fail('invalid-movement-genesis');
  const mapCells: MovementCell[] = [], movementProfiles: MovementProfile[] = [];
  for (let i = 0; i < cells.length; i++) {
    const c = input.movementMap.cells[i];
    if (!record(c) || !keys(c, ['id', 'terrainInfoU32', 'adjacent', 'blocked', 'unsupportedContext', 'facilityPresent'])
      || c.id !== cells[i] || !uint(c.terrainInfoU32, 0xffffffff) || !Array.isArray(c.adjacent)
      || c.adjacent.length > 16 || !c.adjacent.every(v => id(v) && cells.includes(v)) || new Set(c.adjacent).size !== c.adjacent.length
      || c.adjacent.includes(c.id) || typeof c.blocked !== 'boolean' || typeof c.unsupportedContext !== 'boolean'
      || typeof c.facilityPresent !== 'boolean') return fail('invalid-movement-cell');
    mapCells.push({ id: c.id as string, terrainInfoU32: c.terrainInfoU32, adjacent: [...c.adjacent] as string[],
      blocked: c.blocked, unsupportedContext: c.unsupportedContext, facilityPresent: c.facilityPresent });
  }
  for (let i = 0; i < templates.length; i++) {
    const p = input.movementProfiles[i], t = templates[i]!, entry = mapCells.find(c => c.id === t.entryCellId)!;
    if (!record(p) || !keys(p, ['actorId', 'landEquipmentId', 'navalEquipmentId', 'turnBudget']) || p.actorId !== t.id
      || !uint(p.landEquipmentId, 8) || !uint(p.navalEquipmentId, 11) || p.navalEquipmentId < 9
      || !uint(p.turnBudget, 255) || p.turnBudget === 0 || entry.blocked || entry.unsupportedContext || entry.facilityPresent) return fail('invalid-movement-profile-or-entry');
    movementProfiles.push({ actorId: t.id, landEquipmentId: p.landEquipmentId, navalEquipmentId: p.navalEquipmentId, turnBudget: p.turnBudget });
  }
  const movementMap: MovementMap = { id: input.movementMap.id, cells: mapCells };
  const homeTemplates = [...templates], homeProfiles = [...movementProfiles], homeFacts = [...cultivationBaseline];
  const encounterConfig = encounterFrom(input.encounterConfig, cells, templates, movementProfiles, movementMap,energyProfile?.enemyTechniqueIds.includes(16)?120:100);
  if (encounterConfig === undefined) return fail('invalid-encounter-config');
  if(energyProfile && (cells.includes(energyProfile.homeOwnerId)||templates.some(t=>t.id===energyProfile.homeOwnerId)
    || (encounterConfig ? energyProfile.homeOwnerId!==encounterConfig.homeOwnerId
      || !sameTechniques(energyProfile.enemyTechniqueIds,encounterConfig.enemyTechniqueIds??[]) : energyProfile.enemyTechniqueIds.length!==0)))return fail('energy-owner-or-enemy-genesis-mismatch');
  let starvationProfile:StarvationProfile|undefined;
  if(hasStarvation){
    const sp=input.starvationProfile;
    if(!record(sp)||!keys(sp,['profile','homeOwnerId','enemyOwnerId'])||sp.profile!=='inferred-whole-zero-food-tick-retain76-positive-v1'||!id(sp.homeOwnerId)
      ||(sp.enemyOwnerId!==null&&!id(sp.enemyOwnerId))||cells.includes(sp.homeOwnerId)||templates.some(t=>t.id===sp.homeOwnerId)
      ||(encounterConfig?(sp.homeOwnerId!==encounterConfig.homeOwnerId||sp.enemyOwnerId!==encounterConfig.enemyOwnerId||encounterConfig.enemyActors.some(e=>e.troops>60000)):sp.enemyOwnerId!==null)
      ||(energyProfile&&sp.homeOwnerId!==energyProfile.homeOwnerId))return fail('invalid-starvation-profile-or-roster-domain');
    starvationProfile={profile:sp.profile,homeOwnerId:sp.homeOwnerId,enemyOwnerId:sp.enemyOwnerId};
  }
  let effectiveProfile:EffectiveProfile|undefined;
  if(hasEffective){
    const ep=input.effectiveProfile;
    if(!record(ep)||!keys(ep,['profile','effectiveBaseline'])||ep.profile!=='live-equipment-effective255-v1'||!Array.isArray(ep.effectiveBaseline)||ep.effectiveBaseline.length!==homeTemplates.length)return fail('invalid-effective-profile');
    const baseline:EffectiveFacts[]=[];
    for(let i=0;i<ep.effectiveBaseline.length;i++){
      const fact=effectiveFactsFrom(ep.effectiveBaseline[i]);
      if(!fact||fact.actorId!==homeTemplates[i]!.id)return fail('invalid-effective-baseline');
      baseline.push(fact);
    }
    effectiveProfile={profile:ep.profile,effectiveBaseline:baseline};
  }
  let homeEnergyTechniques=[...(energyProfile?.homeTechniqueIds??[])];

  let hazardConfig:HazardConfig|null=null;
  if(input.hazardConfig!==null){
    if(!record(input.hazardConfig)||!keys(input.hazardConfig,['rockfalls'])||!Array.isArray(input.hazardConfig.rockfalls)||input.hazardConfig.rockfalls.length>16)return fail('invalid-hazard-config');
    const rockfalls:{id:string;footprint:string[]}[]=[];
    for(const h of input.hazardConfig.rockfalls){if(!record(h)||!keys(h,['id','footprint'])||!id(h.id)||rockfalls.some(x=>x.id===h.id)
      ||!Array.isArray(h.footprint)||h.footprint.length<1||h.footprint.length>16||!h.footprint.every(v=>id(v)&&mapCells.some(c=>c.id===v&&!c.blocked&&!c.unsupportedContext&&!c.facilityPresent))||new Set(h.footprint).size!==h.footprint.length)return fail('invalid-rockfall-genesis');
      rockfalls.push({id:h.id,footprint:[...h.footprint] as string[]});}
    hazardConfig={rockfalls};
  }
  const usedRockfalls=new Set<string>();
  const homeIds = new Set(homeTemplates.map(t => t.id));
  if (encounterConfig) {
    for (const enemy of encounterConfig.enemyActors) {
      templates.push(enemy.template); movementProfiles.push(enemy.movementProfile); currentFacts.push(enemy.facts);
    }
  }
  let currentEffectiveFacts:EffectiveFacts[]=effectiveProfile
    ? [...effectiveProfile.effectiveBaseline,...(encounterConfig?.enemyActors.map(e=>({actorId:e.template.id,stats:{...e.facts.stats}}))??[])]
    : currentFacts.map(f=>({actorId:f.actorId,stats:{...f.stats}}));
  const readStats=(actorId:string)=>effectiveProfile?currentEffectiveFacts.find(f=>f.actorId===actorId)!.stats:currentFacts.find(f=>f.actorId===actorId)!.stats;
  if(hazardConfig && templates.some(t=>mapCells.find(c=>c.id===t.entryCellId)!.terrainInfoU32!==0))return fail('hazard-recovery-requires-plain-entry');
  // Residents have no troop or energy balance. Stable identities survive all role changes.
  let roles: Role[] = templates.map(a => {
    const enemy = encounterConfig?.enemyActors.find(e => e.template.id === a.id);
    return enemy ? {role:'deployed',id:a.id,cellId:a.entryCellId,troops:enemy.troops,energy:enemy.energy,acted:false,condition:{kind:'normal',remaining:0},
      movementBudget:enemy.movementProfile.turnBudget} : {role:'resident',id:a.id,acted:false};
  });
  const capFor=(actorId:string):100|120=>energyProfile && (homeIds.has(actorId)?homeEnergyTechniques:energyProfile.enemyTechniqueIds).includes(16)?120:100;
  const energyCaps=()=>roles.filter(u=>u.role==='deployed').map(u=>({actorId:u.id,cap:capFor(u.id)}));
  const terrainWithCaps=(v:unknown)=>energyProfile?projectRosterTerrainEntryWithEnergyCaps(v,energyCaps()):projectRosterTerrainEntry(v);
  const rockfallWithCaps=(v:unknown)=>energyProfile?projectRosterRockfallWithEnergyCaps(v,energyCaps()):projectRosterRockfall(v);
  const fireEntryWithCaps=(v:unknown)=>energyProfile?projectNeutralFireEntryWithEnergyCaps(v,energyCaps()):projectNeutralFireEntry(v);
  const recoveryWithCaps=(v:unknown)=>starvationProfile?projectRosterRecoveryAfterFireAndStarvation(v,energyProfile?energyCaps():undefined):energyProfile?projectRosterRecoveryAfterFireWithEnergyCaps(v,energyCaps()):projectRosterRecoveryAfterFire(v);
  const combatWithCaps=(v:unknown)=>effectiveProfile?projectNeutralFieldActionWithEffectiveAttributes(v,Boolean(energyProfile)):energyProfile?projectNeutralFieldActionWithResearchedEnergy(v):projectNeutralFieldAction(v);
  let fires: Fire[] = [], turn = 0, fireDamageEvents = 0;
  const commands: Command[] = [], usedCommands = new Set<string>(), usedFires = new Set<string>(), receipts = [];
  for (const raw of input.commands) {
    const command = commandFrom(raw);
    if (!command || command.expectedRevision !== commands.length || usedCommands.has(command.id)) return fail('invalid-command-history');
    const step = command.action.kind === 'OuterStep' ? command.action : null;
    if(starvationProfile){
      if(!step)return fail('starvation-requires-owner-step');
      if(step.fieldAction?.kind==='FieldTick'){
        if(!step.starvationBoundary||step.starvationBoundary.turnBefore!==turn)return fail('starvation-boundary-required');
      }else if(step.starvationBoundary)return fail('starvation-boundary-only-on-tick');
    }else if(step?.starvationBoundary)return fail('starvation-profile-not-enabled');
    if(effectiveProfile){
      if(!step?.effectiveFactsUpdates)return fail('effective-owner-step-required');
      for(const update of step.effectiveFactsUpdates){
        const prior=currentEffectiveFacts.find(f=>f.actorId===update.before.actorId);
        if(!homeIds.has(update.before.actorId)||!prior||!sameEffective(prior,update.before))return fail('effective-before-mismatch');
      }
    }else if(step?.effectiveFactsUpdates)return fail('effective-profile-not-enabled');
    if(energyProfile){
      if(!step?.energyHomeTechniquesAfter || homeEnergyTechniques.some(t=>!step.energyHomeTechniquesAfter!.includes(t)))return fail('actual-monotonic-energy-techniques-required');
    }else if(step?.energyHomeTechniquesAfter)return fail('energy-profile-not-enabled');
    if(roles.some(u=>u.role==='deployed'&&!uint(u.energy,capFor(u.id))))return fail('energy-exceeds-current-researched-cap');
    const a = step ? step.fieldAction : command.action as NormalAction, before = roles.map(u => ({ ...u })), firesBefore = fires, turnBefore = turn;
    // Owner-defined order: field action/tick, effective facts, completion action lock.
    const factsBefore = [...currentFacts], effectiveBefore = [...currentEffectiveFacts];
    if (step) {
      for (const job of step.completionJobs) {
        if (!homeIds.has(job.actorId) || usedCultivationJobs.has(job.jobId) || roles.find(r => r.id === job.actorId)?.role !== 'resident') return fail('cultivation-completion-mismatch');
      }
      for (const update of step.factsUpdates) {
        const index = currentFacts.findIndex(f => f.actorId === update.before.actorId);
        if (!homeIds.has(update.before.actorId) || index < 0 || !sameFacts(currentFacts[index]!, update.before)) return fail('owner-facts-before-mismatch');
        const metadataChanged = update.before.skillKey !== update.after.skillKey
          || APTITUDES.some(k => update.before.aptitudes[k] !== update.after.aptitudes[k]);
        if (metadataChanged && !step.completionJobs.some(j => j.actorId === update.before.actorId)) return fail('metadata-requires-completion');

      }
    }
    let roster: Unit[] = roles.filter((u): u is Role & Unit => u.role === 'deployed').map(u =>
      ({ id: u.id, cellId: u.cellId, troops: u.troops, energy: u.energy, acted: u.acted, condition:{...u.condition}, movementBudget: u.movementBudget }));
    if(step?.siteStrike){
      const strike=step.siteStrike,context=strike.context;
      if(!encounterConfig||context.homeOwnerId!==encounterConfig.homeOwnerId)return fail('site-strike-needs-fixed-encounter-owner');
      const current=roster.find(u=>u.id===strike.actorId),template=templates.find(t=>t.id===strike.actorId),combatActor=encounterConfig.combatActors.find(u=>u.id===strike.actorId);
      if(!current||!template||!combatActor||homeIds.has(current.id)||combatActor.ownerId!==encounterConfig.enemyOwnerId)return fail('invalid-enemy-site-attacker');
      const lists=step.combatTechniquesByOwner;
      if(!lists||lists.length!==2||!lists.some(x=>x.ownerId===encounterConfig.homeOwnerId)||!lists.some(x=>x.ownerId===encounterConfig.enemyOwnerId))return fail('site-strike-actual-techniques-required');
      const enemyTechniques=lists.find(x=>x.ownerId===encounterConfig.enemyOwnerId)!.techniques;
      if(!sameTechniques(enemyTechniques,encounterConfig.enemyTechniqueIds??[]))return fail('site-strike-enemy-techniques-mismatch');
      if(energyProfile&&!sameTechniques(lists.find(x=>x.ownerId===encounterConfig.homeOwnerId)!.techniques,homeEnergyTechniques))return fail('site-strike-home-techniques-mismatch');
      const governor=context.governor;
      if(context.response!==null && (!record(governor)||!id(governor.id)||!homeIds.has(governor.id)||governor.role!==roles.find(u=>u.id===governor.id)!.role
        ||governor.war!==currentFacts.find(f=>f.actorId===governor.id)!.stats.war))return fail('site-strike-governor-current-facts-mismatch');
      const fact=currentFacts.find(f=>f.actorId===current.id)!;
      const result=projectSyntheticSiteAttack({profile:'inferred-fixed-home-site-positive-strike-v1',turn,
        homeOwnerId:context.homeOwnerId,homeCellId:context.homeCellId,
        map:{cells:encounterConfig.combatMap.cells.map(c=>({id:c.id,q:c.q,r:c.r,blocked:c.blocked}))},
        actor:{id:current.id,ownerId:combatActor.ownerId,cellId:current.cellId,role:'deployed',troops:current.troops,energy:current.energy,acted:current.acted,
          status:current.condition.kind,available:template.available,weapon:combatActor.weapon,attackPanel:combatActor.panels.normal.attack,
          techniqueIds:enemyTechniques,skillKeys:fact.skillKey===null?[]:[fact.skillKey],difficulty:'normal'},
        site:context.site,governor,response:context.response});
      if(!result.ok)return result;
      if(result.sitePatch.id!==strike.siteId||result.actorPatch.id!==current.id||result.actorPatch.troopsBefore!==current.troops)return fail('site-strike-proposal-mismatch');
      roles=roles.map(u=>u.id===current.id&&u.role==='deployed'?{...u,troops:result.actorPatch.troopsAfter,acted:result.actorPatch.actedAfter}:u);
      receipts.push({commandId:command.id,kind:'AttackSite',turn,sitePatch:result.sitePatch,actorPatch:result.actorPatch,siteAttackReceipt:result.receipt,
        requiresExternalSiteSettlement:true as const,before,after:roles.map(u=>({...u}))});
    } else if (a === null) {
      receipts.push({commandId: command.id, kind: 'OwnerFactsOnly', turn});
    } else if (a.kind === 'Deploy' || a.kind === 'Return') {
      const index = templates.findIndex(t => t.id === a.actorId), config = templates[index], current = roles[index];
      if (!homeIds.has(a.actorId) || !config || !current || current.acted) return fail('role-change-not-eligible');
      if (a.kind === 'Deploy') {
        if(starvationProfile&&a.troops>60000)return fail('starvation-positive-troop-domain');
        if(!uint(a.energy,capFor(a.actorId)))return fail('deploy-energy-exceeds-current-cap');
        if (current.role !== 'resident' || !config.available || roster.some(u => u.cellId === config.entryCellId) || fires.some(f => f.cellId === config.entryCellId)) return fail('actor-not-deployable');
        roles[index] = { role: 'deployed', id: current.id, cellId: config.entryCellId, troops: a.troops,
          energy: a.energy, acted: true, condition:{kind:'normal',remaining:0}, movementBudget: movementProfiles[index]!.turnBudget };
        receipts.push({ commandId: command.id, kind: a.kind, turn, actorId: current.id,
          transferProposal: { direction: 'city-to-field', troops: a.troops, morale: a.energy }, before, after: roles.map(u => ({ ...u })) });
      } else {
        if (current.role !== 'deployed' || current.condition.kind !== 'normal' || current.cellId !== config.entryCellId) return fail('actor-not-returnable');
        roles[index] = { role: 'resident', id: current.id, acted: true };
        receipts.push({ commandId: command.id, kind: a.kind, turn, actorId: current.id,
          transferProposal: { direction: 'field-to-city', troops: current.troops, morale: current.energy }, before, after: roles.map(u => ({ ...u })) });
      }
  } else if (a.kind === 'Attack' || a.kind === 'FalseReport') {
      if (!encounterConfig || !templates.find(t=>t.id===a.actorId)?.available || (a.kind==='FalseReport'&&!hazardConfig)) return fail('encounter-or-hazard-not-enabled');
      // The complete neutral projection cannot erase learned or cross-unit supporting skills.
      if(roster.some(u=>currentFacts.find(f=>f.actorId===u.id)!.skillKey!==null))return fail('unsupported-neutral-skill-context');
      if(a.kind==='FalseReport'&&[a.actorId,a.targetId].some(actorId=>{const t=templates.find(t=>t.id===actorId)!;return t.immune||t.guaranteed||t.beautyBonus;}))return fail('unsupported-neutral-strategy-flags');
      const ownerTechniques=encounterConfig.foodRaidMode?step?.combatTechniquesByOwner:
        [{ownerId:encounterConfig.homeOwnerId,techniques:[]},{ownerId:encounterConfig.enemyOwnerId,techniques:[]}];
      if(!ownerTechniques||ownerTechniques.length!==2||!ownerTechniques.some(t=>t.ownerId===encounterConfig.homeOwnerId)
        ||!ownerTechniques.some(t=>t.ownerId===encounterConfig.enemyOwnerId))return fail('actual-owner-techniques-required');
      if(encounterConfig.foodRaidMode&&JSON.stringify([...(ownerTechniques.find(t=>t.ownerId===encounterConfig.enemyOwnerId)!.techniques)].sort((a,b)=>a-b))!==JSON.stringify([...(encounterConfig.enemyTechniqueIds!)].sort((a,b)=>a-b)))return fail('enemy-techniques-not-fixed-genesis');
      if(!encounterConfig.foodRaidMode&&step?.combatTechniquesByOwner?.some(t=>t.techniques.length))return fail('actual-techniques-require-explicit-profile');
      if(energyProfile && (!sameTechniques(ownerTechniques.find(t=>t.ownerId===encounterConfig.homeOwnerId)!.techniques,homeEnergyTechniques)
        ||!sameTechniques(ownerTechniques.find(t=>t.ownerId===encounterConfig.enemyOwnerId)!.techniques,energyProfile.enemyTechniqueIds)))return fail('combat-energy-techniques-mismatch');
      const projected = combatWithCaps({ encounter: {id:encounterConfig.id,
        ownerIds:[encounterConfig.homeOwnerId,encounterConfig.enemyOwnerId],map:encounterConfig.combatMap,actors:encounterConfig.combatActors},
        roster:roster.map(u=>({id:u.id,cellId:u.cellId,troops:u.troops,energy:u.energy,acted:u.acted,status:u.condition.kind,remaining:u.condition.remaining,
          ownerId:homeIds.has(u.id)?encounterConfig.homeOwnerId:encounterConfig.enemyOwnerId,
          intelligence:readStats(u.id).intelligence,charisma:readStats(u.id).charisma})),
        round:turn,command:{id:command.id,actorId:a.actorId,targetId:a.targetId,kind:a.kind==='Attack'?a.attackKind:'false-report-status'},draws:a.kind==='Attack'?(a.draws??[]):a.draws,ownerTechniques,foodRaidMode:encounterConfig.foodRaidMode??null });
      if (!projected.ok) return projected;
      roles = roles.map(u=>{if(u.role==='resident')return u;const patch=projected.patches.find(p=>p.id===u.id)!;return {...u,troops:patch.troops,energy:patch.energy,acted:patch.acted,condition:condition(patch.status,patch.remaining)};});
      receipts.push({commandId:command.id,kind:a.kind,turn,before,after:roles.map(u=>({...u})),combatReceipt:projected.receipt,...(projected.receipt.foodRaidRequest?{pendingFoodRaidRequest:projected.receipt.foodRaidRequest,requiresExternalFoodSettlement:true as const}:{})});
    } else if (a.kind === 'Rockfall') {
      const h=hazardConfig?.rockfalls.find(h=>h.id===a.hazardId);
      if(!h||usedRockfalls.has(h.id))return fail('rockfall-not-enabled-or-consumed');
      const hit=rockfallWithCaps({map:movementMap,roster:hazardRoster(roster),activeFireCellIds:fires.map(f=>f.cellId),footprint:h.footprint,
        traits:roster.map(u=>({actorId:u.id,pathbreaker:false})),draws:a.draws,eventsUsed:fireDamageEvents});
      if(!hit.ok)return hit;
      roles=roles.map(u=>u.role==='resident'?u:{...u,troops:hit.patches.find(p=>p.id===u.id)!.troops});
      fireDamageEvents=hit.eventsUsed;usedRockfalls.add(h.id);
      receipts.push({commandId:command.id,kind:a.kind,turn,hazardId:h.id,footprint:h.footprint,damageReceipts:hit.receipts,before,after:roles.map(u=>({...u}))});
    } else if (a.kind === 'Move') {
      const terrainDraws=a.terrainDraws??[],fireDraws=a.fireDraws??[];
      const current = roster.find(u => u.id === a.actorId), profile = movementProfiles.find(p => p.actorId === a.actorId);
      if (!current || !profile || current.acted || current.condition.kind !== 'normal') return fail('mover-not-eligible');
      const visited = [current.cellId, ...a.path];
      if (visited.some(cellId => { const cell = mapCells.find(c => c.id === cellId);
        return !cell || cell.facilityPresent || cell.unsupportedContext; })) return fail('movement-context-excluded');
      const moved = moveOnSuppliedMap({ version: 1, map: { id: movementMap.id, cells: mapCells.map(c => ({ ...c,
        flagsU32: fires.some(f => f.cellId === c.id) ? 0x00800000 : 0,
        occupied: roster.some(u => u.id !== current.id && u.cellId === c.id) })) },
        state: { unitId: current.id, cellId: current.cellId, budget: current.movementBudget,
          landEquipmentId: profile.landEquipmentId, navalEquipmentId: profile.navalEquipmentId, transport: false },
        path: a.path, policy: GUIDE_REFERENCE_MOVEMENT_POLICY });
      if (!moved.ok) return fail(`movement:${moved.reason}`);
      let entryPatch={troops:current.troops,energy:current.energy};let entryReceipt:unknown=null;
      if(hazardConfig){
        const hasFire=[current.cellId,...a.path].some(c=>fires.some(f=>f.cellId===c));
        if(hasFire){
          if(terrainDraws.length)return fail('mixed-fire-terrain-not-supported');
          const entry=fireEntryWithCaps({map:movementMap,roster:hazardRoster(roster),fires,actorId:current.id,path:a.path,draws:fireDraws,
            eventsUsed:fireDamageEvents,modifiers:{fireGod:false,rattan:false,explosives:false,critical:false}});
          if(!entry.ok)return entry;entryPatch={troops:entry.patch.troops,energy:entry.patch.energy};fireDamageEvents=entry.eventsUsed;entryReceipt=entry;
        }else{
          if(fireDraws.length)return fail('extra-fire-draws');
          const entry=terrainWithCaps({map:movementMap,roster:hazardRoster(roster),activeFireCellIds:[],actorId:current.id,
            traits:{traverse:false,antidote:false,difficultMarch:false},path:a.path,draws:terrainDraws});
          if(!entry.ok)return entry;
          if(fireDamageEvents+terrainDraws.length>256)return fail('cumulative-hazard-budget');
          entryPatch={troops:entry.patch.troops,energy:entry.patch.energy};fireDamageEvents+=terrainDraws.length;entryReceipt=entry;
        }
      }else if(terrainDraws.length||fireDraws.length)return fail('hazard-not-enabled');
      roles = roles.map(u => u.id === current.id ? { role: 'deployed', ...current,...entryPatch, cellId: moved.state.cellId,
        movementBudget: moved.state.budget, acted: true } : u);
      receipts.push({ commandId: command.id, kind: a.kind, turn, before, after: roles.map(u => ({ ...u })),
        movementReceipt: moved, entryReceipt, firesBefore, firesAfter: fires });
    } else if (a.kind === 'FieldTick') {
      let settledStarvationPatches:{actorId:string;troopsBefore:number;troopsAfter:number}[]=[];
      const settleStarvation=(proposed:Unit[])=>{
        if(!starvationProfile||!step?.starvationBoundary)return {ok:true as const,roster:proposed};
        const boundary=step.starvationBoundary;
        if(fireDamageEvents+boundary.eligibleActorIds.length>256)return fail('cumulative-hazard-budget');
        const projected=projectSyntheticStarvationBoundary({turn,eligibleActorIds:boundary.eligibleActorIds,
          currentRoster:roles.map(r=>({id:r.id,ownerId:homeIds.has(r.id)?starvationProfile.homeOwnerId:starvationProfile.enemyOwnerId!,role:r.role,
            troops:r.role==='resident'?0:proposed.find(u=>u.id===r.id)!.troops})),foodAllocations:boundary.foodAllocations},
          {profile:starvationProfile.profile});
        if(!projected.ok)return projected;
        const next=proposed.map(u=>{const patch=projected.troopPatches.find(p=>p.actorId===u.id);return patch?{...u,troops:patch.troopsAfter}:u;});
        settledStarvationPatches=projected.troopPatches.map(p=>({actorId:p.actorId,troopsBefore:p.troopsBefore,troopsAfter:p.troopsAfter}));
        fireDamageEvents+=projected.troopPatches.length;
        receipts.push({commandId:command.id,kind:'StarvationBoundary',turn,starvation:projected});
        return {ok:true as const,roster:next};
      }
      if (roster.length === 0) {
        if (a.draws.length !== 0) return fail('empty-field-requires-empty-draws');
        // No fake target and no new duration draw: exact remaining-life transition only.
        fires = fires.filter(f => f.remainingTicks > 1).map(f => ({ ...f, remainingTicks: f.remainingTicks - 1 }));
        const starvation=settleStarvation(roster);if(!starvation.ok)return starvation;roster=starvation.roster;
      } else {
        const session = fireProjection(cells, roster, fires); if (!session.ok) return session;
        const affected = roster.filter(u => fires.some(f => f.cellId === u.cellId)).length;
        if (fireDamageEvents + affected > 256) return fail('cumulative-fire-damage-budget');
        const burned = executeInferredFireLifecycle(session.state, { id: 'synthetic-field-tick', expectedRevision: session.revision,
          action: { kind: 'Tick', draws: a.draws } });
        if (!burned.ok) return burned;
        let proposed = roster.map(u => ({ ...u, troops: burned.targets.find(t => t.id === u.id)!.value }));
        fireDamageEvents+=affected;
        const starvation=settleStarvation(proposed);if(!starvation.ok)return starvation;proposed=starvation.roster;
        if(hazardConfig){
          const recovery=recoveryWithCaps({map:movementMap,roster:hazardRoster(proposed),activeFireCellIds:burned.fires.map(f=>f.cellId),
            goals:proposed.map(u=>({actorId:u.id,cellId:templates.find(t=>t.id===u.id)!.entryCellId})),turn,
            settledFirePhase:{turn,actorIds:proposed.map(u=>u.id),actorTroops:roster.map(u=>({id:u.id,troops:burned.targets.find(t=>t.id===u.id)!.value})),remainingFireCellIds:burned.fires.map(f=>f.cellId)},
            ...(starvationProfile?{settledStarvationPhase:{turn,troopPatches:settledStarvationPatches}}:{})});
          if(!recovery.ok)return recovery;
          roster=proposed.map(u=>{const v=recovery.roster.find(v=>v.id===u.id)!;return {...u,cellId:v.cellId,acted:v.acted,condition:condition(v.status,v.remaining),movementBudget:movementProfiles.find(p=>p.actorId===u.id)!.turnBudget};});
          receipts.push({commandId:command.id,kind:'AfterFireRecovery',turn,recovery});
        }else{
          const effects = effectProjection(proposed,Boolean(effectiveProfile)); if (!effects.ok) return effects;
          const advanced = executeInferredStrategyEffects(effects.state, { kind: 'advance', id: 'synthetic-field-recovery', expectedRevision: 0 });
          if (!advanced.ok) return advanced;
          roster = proposed.map(u => { const v = advanced.units.find(t => t.id === u.id)!;
            return { ...u, troops: v.troops, acted: v.acted, condition:condition(v.confusedTurns>0?'confused':'normal',v.confusedTurns), movementBudget: movementProfiles.find(p => p.actorId === u.id)!.turnBudget }; });
        }
        fires = burned.fires;
      }
      roles = roles.map(u => { if (u.role === 'resident') return { ...u, acted: false };
        return { role: 'deployed', ...roster.find(t => t.id === u.id)! }; });
      turn++;
      receipts.push({ commandId: command.id, kind: a.kind, turnBefore, turnAfter: turn, before, after: roles.map(u => ({ ...u })), firesBefore, firesAfter: fires });
    } else {
      const casterIndex = roster.findIndex(x => x.id === a.casterId), config = templates.find(t => t.id === a.casterId), caster = roster[casterIndex];
      const selectedStrategy = a.kind === 'FireCast' ? 'fire' : a.strategy;
      if (!config || !caster || !config.available || !config.strategies.includes(selectedStrategy) || caster.acted || caster.condition.kind !== 'normal') return fail('caster-not-eligible');
      const cost = COST[selectedStrategy]; if (caster.energy < cost) return fail('insufficient-energy');
      const targetIds = a.kind === 'FireCast' ? roster.filter(u => u.cellId === a.cellId).map(u => u.id) : a.targets;
      if (targetIds.some(target => !roster.some(u => u.id === target) || (a.kind==='Cast' && roster.find(u=>u.id===target)!.condition.kind==='false-report'))) return fail('target-not-deployed');
      if (a.kind === 'FireCast' && (!cells.includes(a.cellId) || a.cellId === caster.cellId || usedFires.has(a.fireId) || fires.some(f => f.cellId === a.cellId))) return fail('invalid-fire-target-or-id');
      const targets = targetIds.map(target => templates.find(t => t.id === target)!);
      const targetIntelligence = targets.length ? Math.max(...targets.map(t => readStats(t.id).intelligence)) : 0, immune = targets.some(t => t.immune);
      let proposed = roster.map(u => ({ ...u })), proposedFires = fires;
      if (a.kind === 'FireCast') {
        const decision = (effectiveProfile?decideInferredStrategyHitEffective255:decideInferredStrategyHit)('fire', readStats(config.id).intelligence, targetIntelligence, a.roll, true, immune, config.guaranteed, config.beautyBonus);
        if (!decision.ok) return decision;
        if (decision.hit) {
          const session = fireProjection(cells, roster, fires); if (!session.ok) return session;
          const ignited = executeInferredFireLifecycle(session.state, { id: 'synthetic-field-ignite', expectedRevision: session.revision,
            action: { kind: 'Ignite', fireId: a.fireId, cellId: a.cellId, durationDraw: a.durationDraw, critical: false } });
          if (!ignited.ok) return ignited;
          proposedFires = ignited.fires;
        }
        proposed[casterIndex] = { ...caster, energy: caster.energy - cost, acted: true };
        roster = proposed; fires = proposedFires; if (decision.hit) usedFires.add(a.fireId);
        roles = roles.map(u => u.role === 'resident' ? u : ({ role: 'deployed', ...roster.find(t => t.id === u.id)! }));
        receipts.push({ commandId: command.id, kind: a.kind, turn, decision, cost, before, after: roles.map(u => ({ ...u })), firesBefore, firesAfter: fires });
      } else {
        const effects = effectProjection(roster,Boolean(effectiveProfile)); if (!effects.ok) return effects;
        const cast = executeInferredStrategyEffects(effects.state, { kind: 'cast', id: 'synthetic-field-cast', expectedRevision: 0, strategy: a.strategy,
          targets: a.targets, intelligence: readStats(config.id).intelligence, targetIntelligence, roll: a.roll, immune, guaranteed: config.guaranteed,
          beautyBonus: config.beautyBonus, eligibilityConfirmed: true });
        if (!cast.ok) return cast;
        const acted = executeInferredStrategyEffects(cast.state, { kind: 'act', id: 'synthetic-field-act', expectedRevision: cast.revision, targetId: caster.id });
        if (!acted.ok) return acted;
        proposed = roster.map(u => { const v = acted.units.find(t => t.id === u.id)!;
          return { ...u, troops: v.troops, acted: v.acted, condition:v.confusedTurns>0?{kind:'confused' as const,remaining:v.confusedTurns}:u.condition }; });
        proposed[casterIndex] = { ...proposed[casterIndex]!, energy: caster.energy - cost }; roster = proposed;
        roles = roles.map(u => u.role === 'resident' ? u : ({ role: 'deployed', ...roster.find(t => t.id === u.id)! }));
        receipts.push({ commandId: command.id, kind: a.kind, turn, cost, before, after: roles.map(u => ({ ...u })), firesBefore, firesAfter: fires, effectReceipt: cast.receipts[0] });
      }
    }
    if (step) {
      for (const update of step.factsUpdates) {
        const index = currentFacts.findIndex(f => f.actorId === update.before.actorId);
        currentFacts[index] = update.after;
      }
      for (const job of step.completionJobs) {
        const index = roles.findIndex(r => r.id === job.actorId), role = roles[index];
        if (!role || role.role !== 'resident') return fail('completion-cannot-deploy-or-return');
        roles[index] = {...role, acted: true}; usedCultivationJobs.add(job.jobId);
      }
      if(effectiveProfile)for(const update of step.effectiveFactsUpdates!){
        const index=currentEffectiveFacts.findIndex(f=>f.actorId===update.after.actorId);currentEffectiveFacts[index]=update.after;
      }
      receipts.push({commandId: command.id, kind: 'OuterStep', sourceOuterCommandId: step.sourceOuterCommandId,
        factsBefore, factsAfter: [...currentFacts], ...(effectiveProfile?{effectiveBefore,effectiveAfter:[...currentEffectiveFacts]}:{}), completionJobs: step.completionJobs,
        consumedAttributes: step.siteStrike && step.siteStrike.context.response!==null ? ['intelligence','charisma','war'] : encounterConfig ? ['intelligence', 'charisma'] : ['intelligence'],
        metadataOnlyAttributes: step.siteStrike && step.siteStrike.context.response!==null ? ['leadership','politics','aptitudes','skillKey'] : encounterConfig ? ['leadership', 'war', 'politics', 'aptitudes', 'skillKey'] : ['leadership', 'war', 'politics', 'charisma', 'aptitudes', 'skillKey'],
        ...(step.siteStrike && step.siteStrike.context.response!==null ? {warAttributeView:'permanent-base-pk' as const} : {}),
        after: roles.map(r => ({...r}))});
    }
    if(energyProfile && step)homeEnergyTechniques=[...step.energyHomeTechniquesAfter!];
    if(roles.some(u=>u.role==='deployed'&&!uint(u.energy,capFor(u.id))))return fail('result-energy-exceeds-researched-cap');
    commands.push(command); usedCommands.add(command.id);
  }
  const state: State = { schema: 'inferred-cultivated-mobile-field-v4', cells, templates:homeTemplates, movementMap, movementProfiles:homeProfiles, cultivationBaseline:homeFacts, ...(hadEncounter?{encounterConfig}:{}), ...(hadHazard?{hazardConfig}:{}), ...(energyProfile?{energyProfile}:{}), ...(effectiveProfile?{effectiveProfile}:{}), ...(starvationProfile?{starvationProfile}:{}), commands };
  if (JSON.stringify(state).length > 100000) return fail('save-budget');
  return frozen({ ok: true as const, state, revision: commands.length, turn, roster: roles.map(u=>u.role==='resident'?u:{...u,confusedTurns:u.condition.kind==='confused'?u.condition.remaining:0}), currentFacts, ...(effectiveProfile?{currentEffectiveFacts}:{}), homeActorIds:[...homeIds], enemyActorIds:encounterConfig?.enemyActors.map(e=>e.template.id) ?? [], enemyInitialTroopBudget:encounterConfig?.enemyTroopBudget ?? 0, fires, fireDamageEvents, hazardEvents:fireDamageEvents, consumedRockfallIds:[...usedRockfalls], receipts, ...(energyProfile?{currentEnergyTechniquesByOwner:[{ownerId:energyProfile.homeOwnerId,techniques:[...homeEnergyTechniques]},...(encounterConfig?[{ownerId:encounterConfig.enemyOwnerId,techniques:[...energyProfile.enemyTechniqueIds]}]:[])],energyCapsByActor:templates.map(t=>({actorId:t.id,cap:capFor(t.id)}))}:{}),
    policyId: 'inferred-cultivated-mobile-field-proposal-v4' as const, proposalOnly: true as const,
    cityConservationVerified: false as const, campaignWorldWritten: false as const, nativeWorldVerified: false as const });
}
export function readInferredCultivatedMobileField(input: unknown) { try { return replay(detach(input)); } catch { return fail('invalid-data-input'); } }
export function createInferredCultivatedMobileField(cells: unknown, templates: unknown, movementMap: unknown, movementProfiles: unknown, cultivationBaseline: unknown, encounterConfig?: unknown, hazardConfig?:unknown, energyProfile?:unknown, effectiveProfile?:unknown, starvationProfile?:unknown) { return readInferredCultivatedMobileField({ schema: 'inferred-cultivated-mobile-field-v4', cells, templates, movementMap, movementProfiles, cultivationBaseline, ...(encounterConfig===undefined?{}:{encounterConfig}), ...(hazardConfig===undefined?{}:{hazardConfig}), ...(energyProfile===undefined?{}:{energyProfile}), ...(effectiveProfile===undefined?{}:{effectiveProfile}), ...(starvationProfile===undefined?{}:{starvationProfile}), commands: [] }); }
export function executeInferredCultivatedMobileField(input: unknown, rawCommand: unknown) {
  const current = readInferredCultivatedMobileField(input); if (!current.ok) return current;
  let clean: unknown; try { clean = detach(rawCommand); } catch { return fail('invalid-data-command'); }
  const command = commandFrom(clean);
  if (!command || command.action.kind === 'OuterStep' || command.expectedRevision !== current.revision || current.revision >= 32) return fail('invalid-command-or-capacity');
  if (current.state.commands.some(entry => entry.id === command.id)) return fail('duplicate-command');
  return readInferredCultivatedMobileField({ ...current.state, commands: [...current.state.commands, command] });
}
export function saveInferredCultivatedMobileField(input: unknown) { const result = readInferredCultivatedMobileField(input); return result.ok ? Object.freeze({ ok: true as const, json: JSON.stringify(result.state) }) : result; }
export function loadInferredCultivatedMobileField(json: unknown) { if (typeof json !== 'string' || json.length > 100000) return fail('invalid-save'); try { return readInferredCultivatedMobileField(JSON.parse(json)); } catch { return fail('invalid-save'); } }



/** INTERNAL OWNER BRIDGE. Only invoke for owner-derived facts and actual PK completions during outer replay.
 * This proposal does not authenticate PK provenance; the outer world must derive, never route, it.
 */
export function executeInferredCultivatedMobileFieldOuterStep(input: unknown, rawCommand: unknown) {
  const current = readInferredCultivatedMobileField(input); if (!current.ok) return current;
  let clean: unknown; try { clean = detach(rawCommand); } catch { return fail('invalid-data-command'); }
  const command = commandFrom(clean);
  if (!command || command.action.kind !== 'OuterStep' || command.expectedRevision !== current.revision || current.revision >= 32) return fail('invalid-owner-step-or-capacity');
  if (current.state.commands.some(entry => entry.id === command.id)) return fail('duplicate-command');
  return readInferredCultivatedMobileField({ ...current.state, commands: [...current.state.commands, command] });
}
