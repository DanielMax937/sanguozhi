/** Private single configured forge development bridge; no standalone balance or clock. */
import policyData from '../../../../data/catalogs/facility-construction-policies-v1.json' with { type: 'json' };
import catalogData from '../../../../data/catalogs/facility-construction-catalog-v1.json' with { type: 'json' };
import { calculateConstructionDevelopment, calculateConstructionWrite } from './facility-construction-leaves.ts';
import { advanceConstructionWork, completeConstructionPhase } from './facility-construction-phases.ts';
import type { ConstructionWork } from './facility-construction-types.ts';
import { detachBoundedCityData } from './bounded-city-json.ts';

type Actor = { id: string; forceId: string; cityId: string; available: boolean; role: 'resident' | 'deployed'; politics: number; politicsXp: number; merit: number; actedTurn: number | null; reservationJobId: string | null };
export type SyntheticForgeContext = {
  cityId: string; forceId: string; turn: number; gold: number; actionPoints: number; techniquePoints: number;
  remainingTickCapacity: number; enemyWithinTwoCells: boolean;
  facility: { id: string; kind: 'forge'; level: 1; complete: boolean; reservationJobId: string | null };
  officers: Actor[];
};
export type SyntheticForgeJob = {
  id: string; kind: 'development'; facilityId: string; facilityKind: 'forge'; targetLevel: 1;
  officerIds: string[]; politics: number[]; startTurn: number; lastTurn: number; dueTurn: number;
  durationTurns: number; remainingTurns: number; work: ConstructionWork; completedTurn: number | null;
};
const policies = { ...policyData.common, initialWork: policyData.initialWorkPolicies[0]!, rewards: policyData.rewardPolicies[0]!, completionActors: policyData.completionActorPolicies[0]! };
const row = catalogData.entries.find(r => r.kind === 'forge')!;
const level = row.levels.find(r => r.level === 1)!;
const fail = (reason: string) => ({ ok: false as const, reason });
const record = (v: unknown): v is Record<string, unknown> => v !== null && typeof v === 'object' && !Array.isArray(v);
const exact = (v: Record<string, unknown>, keys: readonly string[]) => Object.keys(v).length === keys.length && keys.every(k => Object.hasOwn(v,k));
const uint = (v: unknown, max = 1000000000): v is number => typeof v === 'number' && Number.isSafeInteger(v) && !Object.is(v,-0) && v >= 0 && v <= max;
const sid = (v: unknown): v is string => typeof v === 'string' && /^synthetic-[a-z0-9-]{1,48}$/.test(v);
const forgeJobId = (v: unknown): v is string => typeof v === 'string' && /^job:synthetic-[a-z0-9-]{1,48}$/.test(v);
const jobId = (v: unknown) => v === null || (typeof v === 'string' && /^[a-zA-Z0-9:_-]{1,128}$/.test(v));
const marker = (v: unknown,t: number) => v === null || uint(v,t);
function freeze<T>(v:T):Readonly<T> { if(v !== null && typeof v === 'object'){for(const x of Object.values(v))freeze(x);Object.freeze(v);}return v; }
function context(v:unknown):SyntheticForgeContext|undefined {
  if(!record(v)||!exact(v,['cityId','forceId','turn','gold','actionPoints','techniquePoints','remainingTickCapacity','enemyWithinTwoCells','facility','officers'])
    ||!sid(v.cityId)||!sid(v.forceId)||v.cityId===v.forceId||!uint(v.turn)||!uint(v.gold)||!uint(v.actionPoints,255)
    ||!uint(v.techniquePoints,10000)||!uint(v.remainingTickCapacity,360)||typeof v.enemyWithinTwoCells!=='boolean'
    ||!record(v.facility)||!exact(v.facility,['id','kind','level','complete','reservationJobId'])||!sid(v.facility.id)
    ||v.facility.kind!=='forge'||v.facility.level!==1||typeof v.facility.complete!=='boolean'||!jobId(v.facility.reservationJobId)
    ||!Array.isArray(v.officers)||v.officers.length<1||v.officers.length>32)return undefined;
  const ids=new Set([v.cityId,v.forceId,v.facility.id]);if(ids.size!==3)return undefined;
  for(const o of v.officers){
    if(!record(o)||!exact(o,['id','forceId','cityId','available','role','politics','politicsXp','merit','actedTurn','reservationJobId'])
      ||!sid(o.id)||ids.has(o.id)||o.forceId!==v.forceId||o.cityId!==v.cityId||typeof o.available!=='boolean'
      ||(o.role!=='resident'&&o.role!=='deployed')||!uint(o.politics,255)||!uint(o.politicsXp)||!uint(o.merit)
      ||!marker(o.actedTurn,v.turn)||!jobId(o.reservationJobId))return undefined;
    ids.add(o.id);
  }
  return v as unknown as SyntheticForgeContext;
}
function write(before:number,delta:number,cap:number,policyId:string){const r=calculateConstructionWrite(before,delta,cap,policyId);if(!r.ok)throw Error(r.reason);return r.write;}
function start(c:SyntheticForgeContext,a:unknown){
  if(!record(a)||!exact(a,['jobId','officerIds'])||!forgeJobId(a.jobId)||!Array.isArray(a.officerIds)||a.officerIds.length<1||a.officerIds.length>3
    ||!a.officerIds.every(sid)||new Set(a.officerIds).size!==a.officerIds.length)return fail('invalid-forge-start');
  if([c.cityId,c.forceId,c.facility.id,...c.officers.map(o=>o.id)].includes(a.jobId))return fail('forge-job-identity-collision');
  if(c.facility.complete||c.facility.reservationJobId!==null)return fail('forge-unavailable');
  if(c.enemyWithinTwoCells)return fail('hostile-within-two');
  const people:Actor[]=[];
  for(const id of a.officerIds){const o=c.officers.find(o=>o.id===id);if(!o||!o.available||o.role!=='resident'||o.reservationJobId!==null||o.actedTurn===c.turn)return fail('forge-actor-unavailable');people.push(o);}
  if(c.gold<row.goldCost||c.actionPoints<policies.development.actionPoints)return fail('insufficient-forge-resources');
  const calculation=calculateConstructionDevelopment({required:level.maxDurability,politics:people.map(o=>o.politics),initialWork:policies.initialWork});
  if(!calculation.ok)return fail(calculation.reason);
  if(calculation.durationTurns>c.remainingTickCapacity||!uint(c.turn+calculation.durationTurns))return fail('forge-completion-outside-horizon');
  const job:SyntheticForgeJob={id:a.jobId,kind:'development',facilityId:c.facility.id,facilityKind:'forge',targetLevel:1,
    officerIds:people.map(o=>o.id),politics:people.map(o=>o.politics),startTurn:c.turn,lastTurn:c.turn,dueTurn:c.turn+calculation.durationTurns,
    durationTurns:calculation.durationTurns,remainingTurns:calculation.durationTurns,
    work:{initial:calculation.initial,current:calculation.initial,required:calculation.required,perAdvance:calculation.rate.rate,rate:calculation.rate},completedTurn:null};
  const gold=write(c.gold,-row.goldCost,1000000000,policies.writer.id),ap=write(c.actionPoints,-policies.development.actionPoints,255,policies.writer.id);
  return freeze({ok:true as const,job,patch:{gold:gold.after,actionPoints:ap.after,techniquePoints:c.techniquePoints,
    facility:{...c.facility,reservationJobId:job.id},officers:people.map(o=>({...o,actedTurn:c.turn,reservationJobId:job.id}))},
    receipt:{kind:'forge-start' as const,gold,actionPoints:ap,calculation,policyId:'synthetic-single-forge-owner-v1',rngDraws:0}});
}
function advance(c:SyntheticForgeContext,v:unknown){
  if(!record(v)||!exact(v,['id','kind','facilityId','facilityKind','targetLevel','officerIds','politics','startTurn','lastTurn','dueTurn','durationTurns','remainingTurns','work','completedTurn'])
    ||!forgeJobId(v.id)||v.kind!=='development'||v.facilityId!==c.facility.id||v.facilityKind!=='forge'||v.targetLevel!==1||v.completedTurn!==null
    ||!uint(v.startTurn)||!uint(v.lastTurn)||!uint(v.dueTurn)||!uint(v.durationTurns,360)||v.durationTurns===0||!uint(v.remainingTurns,360)||v.remainingTurns===0
    ||v.lastTurn<v.startTurn||v.lastTurn+1!==c.turn||v.dueTurn!==v.startTurn+v.durationTurns||v.remainingTurns!==v.dueTurn-v.lastTurn
    ||!Array.isArray(v.officerIds)||v.officerIds.length<1||v.officerIds.length>3||!v.officerIds.every(sid)||new Set(v.officerIds).size!==v.officerIds.length
    ||!Array.isArray(v.politics)||v.politics.length!==v.officerIds.length||!v.politics.every(p=>uint(p,255))
    ||c.facility.complete||c.facility.reservationJobId!==v.id)return fail('invalid-forge-job');
  const calc=calculateConstructionDevelopment({required:level.maxDurability,politics:v.politics as number[],initialWork:policies.initialWork});
  if(!calc.ok||calc.durationTurns!==v.durationTurns)return fail('forge-work-mismatch');
  const expectedWork={initial:calc.initial,current:Math.min(calc.required,calc.initial+(v.lastTurn-v.startTurn)*calc.rate.rate),required:calc.required,perAdvance:calc.rate.rate,rate:calc.rate};
  // Full bounded data canonical comparison, including the underlying rate evidence.
  if(!same(v.work,expectedWork))return fail('forge-work-mismatch');
  const people:Actor[]=[], selectedIds=v.officerIds as string[], selectedPolitics=v.politics as number[];
  for(let i=0;i<selectedIds.length;i++){const o=c.officers.find(o=>o.id===selectedIds[i]);
    if(!o||o.reservationJobId!==v.id||o.role!=='resident'||!o.available||o.politics!==selectedPolitics[i])return fail('forge-reservation-mismatch');people.push(o);}
  const job=v as unknown as SyntheticForgeJob,progress=advanceConstructionWork(job);job.lastTurn=c.turn;
  let completion:ReturnType<typeof completeConstructionPhase>|null=null;
  const force={techniquePoints:c.techniquePoints};
  const facility={id:c.facility.id,typeId:level.typeId,status:'developing' as 'developing'|'complete',effectiveLevel:0 as 0|1|2|3,jobId:job.id as string|null};
  if(job.remainingTurns===0){
    if(job.dueTurn!==c.turn||job.work.current!==job.work.required)return fail('forge-completion-mismatch');
    completion=completeConstructionPhase({job,facility,force,currentTurn:c.turn,requestedTechniquePoints:row.completionTechniquePoints,policies},{write,
      requireReservedOfficer(id){const o=people.find(o=>o.id===id);if(!o||o.reservationJobId!==job.id)throw Error('forge-reservation-mismatch');return o;}});
  }
  return freeze({ok:true as const,job,patch:{gold:c.gold,actionPoints:c.actionPoints,techniquePoints:force.techniquePoints,
    facility:{...c.facility,complete:facility.status==='complete',reservationJobId:facility.jobId},officers:people},
    receipt:{kind:'forge-advance' as const,progress,completion,policyId:'synthetic-single-forge-owner-v1',rngDraws:0}});
}
function same(a:unknown,b:unknown):boolean {if(a===b)return true;if(Array.isArray(a)&&Array.isArray(b))return a.length===b.length&&a.every((v,i)=>same(v,b[i]));if(record(a)&&record(b)){const keys=Object.keys(a);return keys.length===Object.keys(b).length&&keys.every(k=>Object.hasOwn(b,k)&&same(a[k],b[k]));}return false;}
export function planSyntheticForgeStart(rawContext:unknown,rawAction:unknown){try{const d=detachBoundedCityData([rawContext,rawAction]);if(!d.ok||!Array.isArray(d.value))return fail('invalid-forge-data');const c=context(d.value[0]);return c?start(c,d.value[1]):fail('invalid-forge-context');}catch{return fail('invalid-forge-data');}}
export function advanceSyntheticForge(rawContext:unknown,rawJob:unknown){try{const d=detachBoundedCityData([rawContext,rawJob]);if(!d.ok||!Array.isArray(d.value))return fail('invalid-forge-data');const c=context(d.value[0]);return c?advance(c,d.value[1]):fail('invalid-forge-context');}catch{return fail('invalid-forge-data');}}
