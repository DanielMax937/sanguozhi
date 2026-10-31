/** Owner-bound temporary T05 proposal; no persistent troop ledger or clock. */
import { projectInferredStarvation } from '../inferred-rule-requests.ts';
type Frozen<T> = T extends object ? { readonly [K in keyof T]: Frozen<T[K]> } : T;
const fail = (reason: string) => Object.freeze({ ok: false as const, reason });
const uint = (v: unknown, max: number): v is number => typeof v === 'number' && Number.isSafeInteger(v) && !Object.is(v, -0) && v >= 0 && v <= max;
const record = (v: unknown): v is Record<string, unknown> => v !== null && typeof v === 'object' && !Array.isArray(v);
const exact = (v: Record<string, unknown>, names: readonly string[]) => Object.keys(v).length === names.length && names.every(name => Object.hasOwn(v, name));
const id = (v: unknown): v is string => typeof v === 'string' && /^synthetic-[a-z0-9-]{1,48}$/.test(v);
function freeze<T>(value: T): Frozen<T> {
  if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) { for (const child of Object.values(value)) freeze(child); Object.freeze(value); }
  return value as Frozen<T>;
}
const runtime = globalThis as { process?: { getBuiltinModule?: (id: string) => { types: { isProxy(v: unknown): boolean } } } };
const isProxy = typeof runtime.process?.getBuiltinModule === 'function' ? runtime.process.getBuiltinModule('node:util').types.isProxy : (() => false);
function detach(input: unknown): unknown {
  let nodes = 0, chars = 0; const active = new Set<object>();
  const invalid = (): never => { throw new Error('invalid-data'); };
  function visit(value: unknown, depth: number): unknown {
    if (++nodes > 100000 || depth > 32) return invalid();
    if (value === null || typeof value === 'boolean') return value;
    if (typeof value === 'number') return uint(value, Number.MAX_SAFE_INTEGER) ? value : invalid();
    if (typeof value === 'string') { chars += value.length; return chars <= 2000000 ? value : invalid(); }
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
        if (!uint(length, 512) || names.length !== length + 1) return invalid();
        const result: unknown[] = [];
        for (let i = 0; i < length; i++) { const descriptor = descriptors[String(i)]; if (!descriptor) return invalid(); result.push(visit(descriptor.value, depth + 1)); }
        return result;
      }
      if (names.length > 128) return invalid();
      const result: Record<string, unknown> = {};
      for (const name of names as string[]) Object.defineProperty(result, name, { value: visit(descriptors[name]!.value, depth + 1), enumerable: true });
      return result;
    } finally { active.delete(value); }
  }
  return visit(input, 0);
}

export type SyntheticStarvationBoundaryContext = Readonly<{
 turn:number;
 eligibleActorIds:readonly string[];
 currentRoster:readonly Readonly<{id:string;ownerId:string;role:'resident'|'deployed';troops:number}>[];
 foodAllocations:readonly Readonly<{actorId:string;food:number}>[];
}>;
export type SyntheticStarvationBoundaryPolicy = Readonly<{
 profile:'inferred-whole-zero-food-tick-retain76-positive-v1';
}>;
/** Eligibility history is authenticated by the outer replay, never by this shape check. */
export function projectSyntheticStarvationBoundary(rawContext:unknown,rawPolicy:unknown){
 try{
  const c=detach(rawContext),policy=detach(rawPolicy);
  if(!record(policy)||!exact(policy,['profile'])||policy.profile!=='inferred-whole-zero-food-tick-retain76-positive-v1')return fail('explicit-starvation-boundary-policy-required');
  if(!record(c)||!exact(c,['turn','eligibleActorIds','currentRoster','foodAllocations'])||!uint(c.turn,0x7fffffff)
    ||!Array.isArray(c.currentRoster)||c.currentRoster.length<1||c.currentRoster.length>64
    ||!Array.isArray(c.foodAllocations)||c.foodAllocations.length!==c.currentRoster.length
    ||!Array.isArray(c.eligibleActorIds)||c.eligibleActorIds.length>c.currentRoster.length)return fail('invalid-starvation-boundary');
  const roster=new Map<string,{id:string;ownerId:string;role:'resident'|'deployed';troops:number}>();
  for(const row of c.currentRoster){
   if(!record(row)||!exact(row,['id','ownerId','role','troops'])||!id(row.id)||!id(row.ownerId)||row.id===row.ownerId||roster.has(row.id)
     ||(row.role!=='resident'&&row.role!=='deployed')||!uint(row.troops,60000)
     ||(row.role==='resident'?row.troops!==0:row.troops===0))return fail('invalid-starvation-roster');
   roster.set(row.id,{id:row.id,ownerId:row.ownerId,role:row.role,troops:row.troops});
  }
  for(const row of roster.values())if(roster.has(row.ownerId))return fail('starvation-owner-actor-collision');
  const food=new Map<string,number>();
  for(const row of c.foodAllocations){
   if(!record(row)||!exact(row,['actorId','food'])||!id(row.actorId)||!roster.has(row.actorId)||food.has(row.actorId)||!uint(row.food,50000)
     ||(roster.get(row.actorId)!.role==='resident'&&row.food!==0))return fail('invalid-starvation-food-view');
   food.set(row.actorId,row.food);
  }
  const eligible:string[]=[];
  for(const actorId of c.eligibleActorIds){
   if(!id(actorId)||eligible.includes(actorId)||!roster.has(actorId)||roster.get(actorId)!.role!=='deployed'||food.get(actorId)!==0)return fail('invalid-starvation-eligibility');
   eligible.push(actorId);
  }
  eligible.sort((a,b)=>a<b?-1:a>b?1:0);
  const troopPatches:{actorId:string;ownerId:string;troopsBefore:number;troopsAfter:number;loss:number}[]=[];
  const receipts=[];
  for(const actorId of eligible){
   const actor=roster.get(actorId)!;
   const request=projectInferredStarvation(actor.troops,1);
   if(!request.ok)return fail('starvation-projector-rejected');
   if(request.projectedRemaining===0)return freeze({ok:false as const,reason:'zero-or-terminal-result-excluded',actorId,committed:false as const});
   if(!uint(request.projectedRemaining,actor.troops)||request.projectedRemaining>=actor.troops||request.requestedLoss!==actor.troops-request.projectedRemaining)return fail('invalid-starvation-projector-result');
   troopPatches.push({actorId,ownerId:actor.ownerId,troopsBefore:actor.troops,troopsAfter:request.projectedRemaining,loss:request.requestedLoss});
   receipts.push({actorId,request});
  }
  return freeze({ok:true as const,troopPatches,receipt:{profile:policy.profile,turn:c.turn,eligibleActorIds:eligible,wholeHungryTurns:1 as const,receipts,
    totalTroopLoss:troopPatches.reduce((sum,p)=>sum+p.loss,0),eligibilityAuthority:'outer-whole-zero-food-boundary-replay' as const,
    phase:'after-food-and-fire-before-recovery' as const,foodWritten:false as const,healthOrPersonWritten:false as const,actionBudgetWritten:false as const,clockAdvanced:false as const}});
 }catch{return fail('invalid-starvation-boundary-data');}
}
