/** Private technique lifecycle leaves extracted from the existing compatibility service. */
import { TECHNIQUE_RESEARCH_CATALOG_V1, TECHNIQUE_RESEARCH_POLICY_REGISTRY_V1 } from '../technique-research-lifecycle.ts';
import { detachBoundedCityData } from './bounded-city-json.ts';
type Stat = 'leadership' | 'war' | 'intelligence' | 'politics';
type DateV1 = { year: number; month: number; day: 1 | 11 | 21 };
type Policy = { id: string; version: 1; parameters: Record<string, string | number | boolean | number[]> };
type Policies = Record<'participants' | 'eligibility' | 'parallelism' | 'fees' | 'attributes' | 'time' | 'talentOffice' | 'merit' | 'allocation' | 'experience' | 'writer' | 'turn' | 'apRecovery' | 'presentation', Policy>;
type PrimitiveOfficer = { id: string; forceId: string; cityId: string; available: boolean; effectiveAttributes: Record<Stat, number>; skillKeys: 'guidance'[]; xp: Record<Stat, number>; merit: number; actedTurn: number | null };
type Officer = PrimitiveOfficer & { reservationJobId: string | null };
type Scenario = {
  profile: 'standalone-technique-research-pk11-compat-v1'; date: DateV1; turn: number;
  force: { id: string; techniquePoints: number; completedTechniqueIds: number[] };
  corps: { id: string; actionPoints: number };
  city: { id: string; gold: number; talentOffice: 'none' | 'building' | 'complete'; enemyWithinTwoCells: boolean };
  officers: PrimitiveOfficer[]; difficulty: 'beginner' | 'advanced' | 'super'; policies: Policies;
};
type CatalogRow = { id: number; branchId: number; branchKey: string; branchName: string; level: number; name: string; relatedAbility: Stat; techniquePointCost: number; goldCost: number; pkOnly: boolean; prerequisiteId: number | null; timeFamily: 'military-training' | 'invention-defense-fire-domestic'; originalTechniqueRowEvidence: string };
type Catalog = { id: string; version: 1; entries: CatalogRow[] };
type Command = { type: 'StartTechniqueResearch'; cityId: string; techniqueId: number; officerIds: string[] } | { type: 'AdvanceResearchTurn' };
type Envelope = { id: string; expectedRevision: number; command: Command };
type Write = { before: number; requested: number; actualDelta: number; after: number; cap: number; discarded: number; policyId: string };
type Credit = Write & { credited: number };
type Fees = { gold: Write; actionPoints: Write; techniquePoints: Write; guidanceParticipantIds: string[]; discountApplied: boolean };
type Timing = { relatedAbility: Stat; relatedAbilitySum: number; difficulty: Scenario['difficulty']; abilityDependentTimingModeled: boolean; difficultyDependentTimingModeled: false; timeFamily: CatalogRow['timeFamily']; baseTurns: number; talentOfficeApplied: boolean; talentOfficeReduction: number; durationTurns: number; dueTurn: number; dueDate: DateV1; policyId: string; evidence: 'compatibility-guide-fallback' | 'explicit-inference-not-native' };
type Reward = { officerId: string; attribute: Stat; xp: Credit; merit: Credit; xpPolicyId: string; meritPolicyId: string; allocationPolicyId: string };
type Completion = { jobId: string; techniqueId: number; turn: number; date: DateV1; unlockedBefore: number[]; unlockedAfter: number[]; rewards: Reward[]; releasedOfficerIds: string[]; actedTurn: number; turnPolicyId: string };
type Snapshot = { turn: number; date: DateV1; city: Scenario['city']; difficulty: Scenario['difficulty']; officers: Officer[]; catalogRow: CatalogRow; policies: Policies };
type Job = { id: string; status: 'active' | 'completed'; techniqueId: number; cityId: string; officerIds: string[]; startTurn: number; durationTurns: number; remainingTurns: number; dueTurn: number; startSnapshot: Snapshot; timing: Timing; fees: Fees; completedTurn: number | null; completion: Completion | null };

type State = { turn:number; date:DateV1; force:Scenario['force']; corps:Scenario['corps']; city:Scenario['city']; officers:Officer[]; difficulty:Scenario['difficulty']; policies:Policies };
export type SyntheticTechniqueContext = { cityId:string; forceId:string; corpsId:string; turn:number; date:DateV1;
 gold:number; actionPoints:number; techniquePoints:number; completedTechniqueIds:number[]; remainingTickCapacity:number;
 enemyWithinTwoCells:boolean; talentOffice:'none'|'building'|'complete'; difficulty:Scenario['difficulty'];
 officers:(Officer & {role:'resident'|'deployed'})[]; activeResearchJobId:string|null; policies:Policies };
export type SyntheticTechniqueOwnerJob = { source:Job; lastTurn:number };
const CATALOG = TECHNIQUE_RESEARCH_CATALOG_V1;
const REGISTRY = TECHNIQUE_RESEARCH_POLICY_REGISTRY_V1;
const MAX_VALUE=1000000000;
const copy=<T>(v:T):T=>JSON.parse(JSON.stringify(v)) as T;
const fail=(reason:string):never=>{throw Error(reason);};
const record=(v:unknown):v is Record<string,unknown>=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const exact=(v:Record<string,unknown>,ks:readonly string[])=>Object.keys(v).length===ks.length&&ks.every(k=>Object.hasOwn(v,k));
const uint=(v:unknown,max=MAX_VALUE):v is number=>typeof v==='number'&&Number.isSafeInteger(v)&&!Object.is(v,-0)&&v>=0&&v<=max;
const sid=(v:unknown):v is string=>typeof v==='string'&&/^synthetic-[a-z0-9-]{1,48}$/.test(v);
const jid=(v:unknown):v is string=>typeof v==='string'&&/^job:synthetic-[a-z0-9-]{1,48}$/.test(v);
const lock=(v:unknown)=>v===null||(typeof v==='string'&&/^job:[A-Za-z0-9][A-Za-z0-9_.:-]{0,63}$/.test(v));
const marker=(v:unknown,t:number)=>v===null||uint(v,t);
const STATS=['leadership','war','intelligence','politics'] as const;
function same(a:unknown,b:unknown):boolean{if(a===b)return true;if(Array.isArray(a)&&Array.isArray(b))return a.length===b.length&&a.every((v,i)=>same(v,b[i]));if(record(a)&&record(b)){const ks=Object.keys(a);return ks.length===Object.keys(b).length&&ks.every(k=>Object.hasOwn(b,k)&&same(a[k],b[k]));}return false;}
function freeze<T>(v:T):Readonly<T>{if(v!==null&&typeof v==='object'){for(const x of Object.values(v))freeze(x);Object.freeze(v);}return v;}
function nextDate(d: DateV1): DateV1 {
  if (d.day === 1) return { ...d, day: 11 }; if (d.day === 11) return { ...d, day: 21 };
  if (d.month < 12) return { year: d.year, month: d.month + 1, day: 1 };
  if (d.year === 9999) fail('calendar-overflow'); return { year: d.year + 1, month: 1, day: 1 };
}
function debit(before: number, cost: number, cap: number, policyId: string): Write { return { before, requested: -cost, actualDelta: -cost, after: before - cost, cap, discarded: 0, policyId }; }
function credit(before: number, requested: number, cap: number, policyId: string): Credit { const credited = Math.min(requested, cap - before); return { before, requested, actualDelta: credited, credited, after: before + credited, cap, discarded: requested - credited, policyId }; }
function timing(s: State, row: CatalogRow, people: Officer[]): Timing {
  const params = s.policies.time.parameters, turns = params[row.timeFamily === 'military-training' ? 'militaryTrainingTurns' : 'otherTurns'] as number[];
  const relatedAbilitySum = people.reduce((n, o) => n + o.effectiveAttributes[row.relatedAbility], 0);
  const inferred = s.policies.time.id === 'inferred-two-family-seventy-point-bands-v1';
  // Explicitly opted-in engineering interpolation, not a recovered PC/PK matrix.
  // Preserve the original fixed-table policy and receipts byte-for-byte in its branch.
  const band = inferred ? Math.min(params.maximumBand as number, Math.floor(relatedAbilitySum / (params.bandWidth as number))) : 0;
  const baseTurns = inferred
    ? Math.max(params.minimumBaseTurns as number, turns[row.level - 1]! + (params.anchorBand as number) - band)
    : turns[row.level - 1]!;
  const applied = s.city.talentOffice === 'complete';
  const durationTurns = Math.max(s.policies.talentOffice.parameters.minimum as number, baseTurns - (applied ? s.policies.talentOffice.parameters.reduction as number : 0));
  if (!Number.isSafeInteger(s.turn + durationTurns)) fail('turn-overflow');
  let dueDate = copy(s.date); for (let i = 0; i < durationTurns; i++) dueDate = nextDate(dueDate);
  return { relatedAbility: row.relatedAbility, relatedAbilitySum, difficulty: s.difficulty,
    abilityDependentTimingModeled: inferred, difficultyDependentTimingModeled: false, timeFamily: row.timeFamily, baseTurns, talentOfficeApplied: applied, talentOfficeReduction: baseTurns - durationTurns,
    durationTurns, dueTurn: s.turn + durationTurns, dueDate, policyId: s.policies.time.id, evidence: inferred ? 'explicit-inference-not-native' : 'compatibility-guide-fallback' };
}
function complete(s: State, job: Job): Completion {
  const people = job.officerIds.map(officerId => { const o = s.officers.find(x => x.id === officerId); if (!o || o.reservationJobId !== job.id) fail('reservation-mismatch'); return o; });
  if (s.force.completedTechniqueIds.includes(job.techniqueId)) fail('completion-already-unlocked');
  const before = [...s.force.completedTechniqueIds], row = job.startSnapshot.catalogRow, p = job.startSnapshot.policies;
  const xpRequest = -job.fees.techniquePoints.actualDelta / (p.experience.parameters.divisor as number), meritRequest = (p.merit.parameters.byLevel as number[])[row.level - 1]!;
  s.force.completedTechniqueIds.push(job.techniqueId); s.force.completedTechniqueIds.sort((a, b) => a - b);
  const rewards = people.map(o => {
    const xp = credit(o.xp[row.relatedAbility], xpRequest, p.writer.parameters.rewardCap as number, p.writer.id), merit = credit(o.merit, meritRequest, p.writer.parameters.rewardCap as number, p.writer.id);
    o.xp[row.relatedAbility] = xp.after; o.merit = merit.after;
    return { officerId: o.id, attribute: row.relatedAbility, xp, merit, xpPolicyId: p.experience.id, meritPolicyId: p.merit.id, allocationPolicyId: p.allocation.id };
  });
  for (const o of people) { o.reservationJobId = null; o.actedTurn = s.turn; }
  const result: Completion = { jobId: job.id, techniqueId: job.techniqueId, turn: s.turn, date: copy(s.date), unlockedBefore: before, unlockedAfter: [...s.force.completedTechniqueIds], rewards, releasedOfficerIds: people.map(o => o.id), actedTurn: s.turn, turnPolicyId: p.turn.id };
  job.status = 'completed'; job.completedTurn = s.turn; job.completion = result; return result;
}
function checkedContext(v:unknown):SyntheticTechniqueContext{
 if(!record(v)||!exact(v,['cityId','forceId','corpsId','turn','date','gold','actionPoints','techniquePoints','completedTechniqueIds','remainingTickCapacity','enemyWithinTwoCells','talentOffice','difficulty','officers','activeResearchJobId','policies'])
 ||!sid(v.cityId)||!sid(v.forceId)||!sid(v.corpsId)||new Set([v.cityId,v.forceId,v.corpsId]).size!==3
 ||!uint(v.turn)||!uint(v.gold)||!uint(v.actionPoints,255)||!uint(v.techniquePoints,10000)||!uint(v.remainingTickCapacity,360)
 ||typeof v.enemyWithinTwoCells!=='boolean'||!['none','building','complete'].includes(v.talentOffice as string)
 ||!['beginner','advanced','super'].includes(v.difficulty as string)||!(v.activeResearchJobId===null||jid(v.activeResearchJobId)))fail('invalid-technique-context');
 if(!record(v.date)||!exact(v.date,['year','month','day'])||!uint(v.date.year,9999)||v.date.year===0||!uint(v.date.month,12)||v.date.month===0||![1,11,21].includes(v.date.day as number))fail('invalid-technique-date');
 if(!Array.isArray(v.completedTechniqueIds)||v.completedTechniqueIds.length>36||!v.completedTechniqueIds.every(n=>uint(n,35))||new Set(v.completedTechniqueIds).size!==v.completedTechniqueIds.length)fail('invalid-technique-unlocks');
 const completed=v.completedTechniqueIds as number[];
 for(const n of completed){const prerequisite=CATALOG.entries[n]!.prerequisiteId;if(prerequisite!==null&&!completed.includes(prerequisite))fail('missing-initial-prerequisite');}
 if(!record(v.policies)||!exact(v.policies,Object.keys(REGISTRY)))fail('unsupported-policy');
 const rawPolicies=v.policies as Record<string,unknown>;
 for(const key of Object.keys(REGISTRY) as (keyof Policies)[])if(!REGISTRY[key].some(p=>same(p,rawPolicies[key])))fail('unsupported-policy');
 if(!Array.isArray(v.officers)||v.officers.length<1||v.officers.length>32)fail('invalid-technique-roster');
 const ids=new Set([v.cityId,v.forceId,v.corpsId]);
 for(const o of v.officers){if(!record(o)||!exact(o,['id','forceId','cityId','available','role','effectiveAttributes','skillKeys','xp','merit','actedTurn','reservationJobId'])
 ||!sid(o.id)||ids.has(o.id)||o.forceId!==v.forceId||o.cityId!==v.cityId||typeof o.available!=='boolean'||!['resident','deployed'].includes(o.role as string)
 ||!marker(o.actedTurn,v.turn as number)||!lock(o.reservationJobId)||!uint(o.merit)||!record(o.effectiveAttributes)||!exact(o.effectiveAttributes,STATS)||!record(o.xp)||!exact(o.xp,STATS)
 ||!Array.isArray(o.skillKeys)||o.skillKeys.length>1||o.skillKeys.some(s=>s!=='guidance'))fail('invalid-technique-officer');
 for(const stat of STATS)if(!uint(o.effectiveAttributes[stat],255)||!uint(o.xp[stat]))fail('invalid-technique-attribute');ids.add(o.id);}
 return v as unknown as SyntheticTechniqueContext;
}
function frame(c:SyntheticTechniqueContext):State{return {turn:c.turn,date:copy(c.date),force:{id:c.forceId,techniquePoints:c.techniquePoints,completedTechniqueIds:[...c.completedTechniqueIds].sort((a,b)=>a-b)},corps:{id:c.corpsId,actionPoints:c.actionPoints},
 city:{id:c.cityId,gold:c.gold,talentOffice:c.talentOffice,enemyWithinTwoCells:c.enemyWithinTwoCells},officers:c.officers.map(({role,...o})=>copy(o)),difficulty:c.difficulty,policies:copy(c.policies)};}
function patch(s:State,people:string[],activeResearchJobId:string|null){return {gold:s.city.gold,actionPoints:s.corps.actionPoints,techniquePoints:s.force.techniquePoints,completedTechniqueIds:s.force.completedTechniqueIds,
 activeResearchJobId,officers:people.map(id=>{const o=s.officers.find(o=>o.id===id)!;return {id:o.id,xp:o.xp,merit:o.merit,actedTurn:o.actedTurn,reservationJobId:o.reservationJobId};})};}
function start(c:SyntheticTechniqueContext,a:unknown){
 if(!record(a)||!exact(a,['jobId','techniqueId','officerIds'])||!jid(a.jobId)||!uint(a.techniqueId,35)||!Array.isArray(a.officerIds)||a.officerIds.length<1||a.officerIds.length>3||!a.officerIds.every(sid)||new Set(a.officerIds).size!==a.officerIds.length)fail('invalid-technique-start');
 if(c.activeResearchJobId!==null)fail('research-already-active');
 const s=frame(c),row=copy(CATALOG.entries[a.techniqueId]!) as CatalogRow;
 if(s.force.completedTechniqueIds.includes(row.id))fail('technique-already-completed');
 if(row.prerequisiteId!==null&&!s.force.completedTechniqueIds.includes(row.prerequisiteId))fail('missing-prerequisite');
 const selected=a.officerIds as string[],people=selected.map(id=>{const o=s.officers.find(o=>o.id===id),live=c.officers.find(o=>o.id===id);
 if(!o||!live||!o.available||live.role!=='resident'||o.reservationJobId!==null||o.actedTurn===s.turn)fail('technique-actor-unavailable');return o;});
 if(s.city.enemyWithinTwoCells)fail('enemy-within-two-cells');
 const guidance=people.filter(o=>o.skillKeys.includes('guidance')).map(o=>o.id),discount=guidance.length>0;
 const gold=row.goldCost/(discount?s.policies.fees.parameters.guidanceGoldDivisor as number:1),ap=s.policies.fees.parameters.actionPoints as number,tp=row.techniquePointCost;
 const duration=timing(s,row,people);
 if(duration.durationTurns>c.remainingTickCapacity)fail('completion-history-capacity-unavailable');
 if(s.city.gold<gold)fail('insufficient-gold');if(s.corps.actionPoints<ap)fail('insufficient-ap');if(s.force.techniquePoints<tp)fail('insufficient-technique-points');
 const fees:Fees={gold:debit(s.city.gold,gold,MAX_VALUE,s.policies.writer.id),actionPoints:debit(s.corps.actionPoints,ap,255,s.policies.writer.id),techniquePoints:debit(s.force.techniquePoints,tp,10000,s.policies.writer.id),guidanceParticipantIds:guidance,discountApplied:discount};
 const source:Job={id:a.jobId,status:'active',techniqueId:row.id,cityId:s.city.id,officerIds:[...selected],startTurn:s.turn,durationTurns:duration.durationTurns,remainingTurns:duration.durationTurns,dueTurn:duration.dueTurn,
 startSnapshot:{turn:s.turn,date:copy(s.date),city:copy(s.city),difficulty:s.difficulty,officers:copy(people),catalogRow:copy(row),policies:copy(s.policies)},timing:duration,fees,completedTurn:null,completion:null};
 s.city.gold=fees.gold.after;s.corps.actionPoints=fees.actionPoints.after;s.force.techniquePoints=fees.techniquePoints.after;
 for(const o of people){o.actedTurn=s.turn;o.reservationJobId=source.id;}
 return {ok:true as const,job:{source,lastTurn:c.turn},patch:patch(s,selected,source.id),receipt:{kind:'technique-start' as const,timing:duration,fees,rngDraws:0}};
}
function advance(c:SyntheticTechniqueContext,v:unknown){
 if(!record(v)||!exact(v,['source','lastTurn'])||!uint(v.lastTurn)||v.lastTurn+1!==c.turn||!record(v.source))fail('invalid-technique-job');
 const source=v.source;
 if(!jid(source.id)||c.activeResearchJobId!==source.id||source.status!=='active'||!uint(source.startTurn)||!uint(source.durationTurns,360)||!uint(source.remainingTurns,360)||source.remainingTurns===0
 ||source.startTurn>v.lastTurn||source.remainingTurns!==source.startTurn+source.durationTurns-v.lastTurn||!record(source.startSnapshot)||!record(source.fees))fail('invalid-technique-job');
 const snap=source.startSnapshot,fees=source.fees;
 if(!record(snap.city)||!Array.isArray(snap.officers)||!record(fees.gold)||!record(fees.actionPoints)||!record(fees.techniquePoints))fail('invalid-technique-snapshot');
 const initial=checkedContext({cityId:c.cityId,forceId:c.forceId,corpsId:c.corpsId,turn:snap.turn,date:snap.date,gold:fees.gold.before,actionPoints:fees.actionPoints.before,techniquePoints:fees.techniquePoints.before,
 completedTechniqueIds:c.completedTechniqueIds,remainingTickCapacity:source.durationTurns,enemyWithinTwoCells:snap.city.enemyWithinTwoCells,talentOffice:snap.city.talentOffice,difficulty:snap.difficulty,
 officers:snap.officers.map(o=>{if(!record(o))fail('invalid-technique-snapshot');return {...o,role:'resident'};}),activeResearchJobId:null,policies:snap.policies});
 const rebuilt=start(initial,{jobId:source.id,techniqueId:source.techniqueId,officerIds:source.officerIds});
 rebuilt.job.source.remainingTurns=source.remainingTurns;
 if(!same(source,rebuilt.job.source)||!same(c.policies,initial.policies))fail('technique-snapshot-mismatch');
 let expectedDate=copy(initial.date);for(let n=initial.turn;n<c.turn;n++)expectedDate=nextDate(expectedDate);
 if(!same(expectedDate,c.date))fail('technique-clock-mismatch');
 const job=source as unknown as Job,s=frame(c);
 for(const id of job.officerIds){const live=c.officers.find(o=>o.id===id);if(!live||live.role!=='resident'||!live.available||live.reservationJobId!==job.id)fail('technique-reservation-mismatch');}
 const remainingBefore=job.remainingTurns;job.remainingTurns--;
 let completion:Completion|null=null;
 if(job.remainingTurns===0){if(job.dueTurn!==c.turn||!same(job.timing.dueDate,c.date))fail('technique-due-mismatch');completion=complete(s,job);}
 return {ok:true as const,job:{source:job,lastTurn:c.turn},patch:patch(s,job.officerIds,job.status==='completed'?null:job.id),receipt:{kind:'technique-advance' as const,remainingBefore,remainingAfter:job.remainingTurns,completion,rngDraws:0}};
}
function run(rawContext:unknown,arg:unknown,kind:'start'|'advance'){
 try{const d=detachBoundedCityData([rawContext,arg]);if(!d.ok||!Array.isArray(d.value))return freeze({ok:false as const,reason:'invalid-technique-data'});
 const c=checkedContext(d.value[0]);return freeze(kind==='start'?start(c,d.value[1]):advance(c,d.value[1]));}
 catch(e){return freeze({ok:false as const,reason:e instanceof Error?e.message:'invalid-technique-data'});}
}
export const planSyntheticTechniqueStart=(context:unknown,action:unknown)=>run(context,action,'start');
export const advanceSyntheticTechnique=(context:unknown,job:unknown)=>run(context,job,'advance');
/** Genesis validation only: no fake research command, debit or state creation. */
export function validateSyntheticTechniqueContext(raw:unknown){
 try{const d=detachBoundedCityData(raw);if(!d.ok)return freeze({ok:false as const,reason:'invalid-technique-data'});checkedContext(d.value);return freeze({ok:true as const});}
 catch(e){return freeze({ok:false as const,reason:e instanceof Error?e.message:'invalid-technique-data'});}
}
