/** Explicit D opt-in: current effective-politics fire-food contribution; no persistent state. */
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
type Actor = {id:string;ownerId:string;role:'resident'|'deployed';cellId:string|null;troops:number;politics:number};
type Allocation = {actorId:string;food:number;foodCapacity:number};
type Cargo = {id:string;ownerId:string;cellId:string|null;food:number;foodCapacity:number};
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

type Rational = readonly [bigint,bigint];
function rational(n:bigint,d=1n):Rational {let a=n,b=d;while(b){const r=a%b;a=b;b=r;}return [n/a,d/a];}
function mul(a:Rational,b:Rational):Rational{return rational(a[0]*b[0],a[1]*b[1]);}
function add(a:Rational,b:Rational):Rational{return rational(a[0]*b[1]+b[0]*a[1],a[1]*b[1]);}
function bits(v:number):Rational {const s=BigInt((v&0x7fffff)|0x800000),e=((v>>>23)&255)-150;return e>=0?rational(s<<BigInt(e)):rational(s,1n<<BigInt(-e));}
const SCALE=bits(0x3d4ccccd), NONE=bits(0x40000000);
const raw=(v:Rational)=>`${v[0]}/${v[1]}`;
/** Full current-state shape validation, not provenance authentication. The owner must bind it to replay. */
export function planSyntheticEffectivePoliticsFieldFoodTick(rawContext:unknown,rawAction:unknown,rawPolicy:unknown){
 try{
  const c=detach(rawContext),a=detach(rawAction),policy=detach(rawPolicy);
  if(!record(policy)||!exact(policy,['profile'])||policy.profile!=='nonnegative-fire-food-contribution-v2')return fail('explicit-effective-politics-food-policy-required');
  if(!record(a)||a.kind!=='FieldTick')return fail('effective-politics-food-tick-only');
  if(!record(c)||!exact(c,['city','allocations','actors','transports','cells','fires','eligibleAttack'])||!record(a))return fail('invalid-field-food-input');
  const city=c.city;
  if(!record(city)||!exact(city,['id','ownerId','food','foodCapacity'])||!id(city.id)||!id(city.ownerId)||city.id===city.ownerId
    ||!uint(city.foodCapacity,1000000000)||!uint(city.food,city.foodCapacity))return fail('invalid-city-food');
  if(!Array.isArray(c.cells)||c.cells.length<1||c.cells.length>256)return fail('invalid-food-map');
  const cells=new Map<string,string[]>();
  for(const cell of c.cells){
   if(!record(cell)||!exact(cell,['id','adjacent'])||!id(cell.id)||cells.has(cell.id)||!Array.isArray(cell.adjacent)
    ||cell.adjacent.length>6||!cell.adjacent.every(id)||new Set(cell.adjacent).size!==cell.adjacent.length||cell.adjacent.includes(cell.id))return fail('invalid-food-map-cell');
   cells.set(cell.id,[...cell.adjacent]);
  }
  for(const [name,neighbors] of cells)if(neighbors.some(n=>!cells.has(n)||!cells.get(n)!.includes(name)))return fail('unbound-food-adjacency');
  if(!Array.isArray(c.actors)||c.actors.length<1||c.actors.length>64||!Array.isArray(c.allocations)||c.allocations.length!==c.actors.length)return fail('invalid-food-roster');
  const occupied=new Set<string>();
  const actors=new Map<string,Actor>(),allocations=new Map<string,Allocation>(),entities=new Set([city.id,city.ownerId,...cells.keys()]);
  for(const row of c.actors){
   if(!record(row)||!exact(row,['id','ownerId','role','cellId','troops','politics'])||!id(row.id)||entities.has(row.id)||!id(row.ownerId)
    ||row.id===row.ownerId||(row.role!=='resident'&&row.role!=='deployed')||!uint(row.troops,60000)||!uint(row.politics,255)
    ||(row.role==='resident'?(row.troops!==0||row.cellId!==null):(row.troops===0||!id(row.cellId)||!cells.has(row.cellId))))return fail('invalid-food-actor');
   if(row.role==='deployed'){if(occupied.has(row.cellId as string))return fail('duplicate-food-actor-position');occupied.add(row.cellId as string);}
   actors.set(row.id,row as unknown as Actor);entities.add(row.id);
  }
  for(const row of c.allocations){
   if(!record(row)||!exact(row,['actorId','food','foodCapacity'])||!id(row.actorId)||!actors.has(row.actorId)||allocations.has(row.actorId)
    ||row.foodCapacity!==50000||!uint(row.food,row.foodCapacity)||(actors.get(row.actorId)!.role==='resident'&&row.food!==0))return fail('invalid-field-food-allocation');
   allocations.set(row.actorId,{actorId:row.actorId,food:row.food,foodCapacity:row.foodCapacity});
  }
  if(!Array.isArray(c.transports)||c.transports.length>8)return fail('invalid-food-cargo');
  const cargo=new Map<string,Cargo>();
  for(const row of c.transports){
   if(!record(row)||!exact(row,['id','ownerId','cellId','food','foodCapacity'])||!id(row.id)||entities.has(row.id)||!id(row.ownerId)||row.id===row.ownerId
    ||(row.cellId!==null&&(!id(row.cellId)||!cells.has(row.cellId)))||row.foodCapacity!==500000||!uint(row.food,row.foodCapacity))return fail('invalid-food-transport');
   cargo.set(row.id,row as unknown as Cargo);entities.add(row.id);
  }
  for(const ownerId of [...actors.values(),...cargo.values()].map(row=>row.ownerId))if(ownerId!==city.ownerId&&entities.has(ownerId))return fail('food-owner-entity-collision');
  if(!Array.isArray(c.fires)||c.fires.length>256)return fail('invalid-food-fire-view');
  const fires=new Set<string>();
  for(const fire of c.fires){if(!record(fire)||!exact(fire,['cellId'])||!id(fire.cellId)||!cells.has(fire.cellId)||fires.has(fire.cellId))return fail('invalid-food-fire');fires.add(fire.cellId);}
  const patches:{kind:'city'|'field'|'transport';id:string;foodBefore:number;foodAfter:number}[]=[];
  const patchField=(actorId:string,after:number)=>{const v=allocations.get(actorId)!;patches.push({kind:'field',id:actorId,foodBefore:v.food,foodAfter:after});};
  let detail:unknown;
  {
   if(!exact(a,['kind','turn','date'])||!uint(a.turn,0x7fffffff)||!record(a.date)||!exact(a.date,['year','month','day'])
    ||!uint(a.date.year,9999)||a.date.year<1||!uint(a.date.month,12)||a.date.month<1||![1,11,21].includes(a.date.day as number))return fail('invalid-food-tick');
   const consumption=[];
   for(const actor of actors.values()){
    if(actor.role!=='deployed')continue;
    const v=allocations.get(actor.id)!,onFire=fires.has(actor.cellId!);
    if(v.food===0){patchField(actor.id,0);consumption.push({actorId:actor.id,status:'already-empty-skipped',onFire,requestCost:null,debited:0,shortfall:null,foodBefore:0,foodAfter:0});continue;}
    const normal=mul(mul(rational(BigInt(actor.troops)),NONE),SCALE);
    const fireCoefficient=Math.max(0,600-5*actor.politics);
    const fire=onFire?rational(BigInt(v.food)*BigInt(fireCoefficient),10000n):rational(0n);
    const combined=add(normal,fire),truncated=combined[0]/combined[1],cost=Number(truncated<1n?1n:truncated),debit=Math.min(v.food,cost);
    patchField(actor.id,v.food-debit);
    consumption.push({actorId:actor.id,status:cost>debit?'insufficient':'consumed',onFire,politics:actor.politics,fireCoefficient,normalRaw:raw(normal),fireRaw:raw(fire),combinedRaw:raw(combined),requestCost:cost,debited:debit,shortfall:cost-debit,foodBefore:v.food,foodAfter:v.food-debit});
   }
   detail={policy:'nonnegative-fire-food-contribution-v2',politicsSource:'caller-live-effective-politics',turn:a.turn,date:a.date,consumption,coverage:'explicit-no-supply-facility-coverage-v1',shortage:'report-only-no-troop-loss-v1'};
  }
  if(c.eligibleAttack!==null)return fail('unexpected-food-raid-event');
  const totalDelta=patches.reduce((sum,p)=>sum+p.foodAfter-p.foodBefore,0);
  if(totalDelta>0)return fail('food-conservation-mismatch');
  if(new Set(patches.map(p=>p.id)).size!==patches.length)return fail('duplicate-food-patch');
  return freeze({ok:true as const,foodPatches:patches,receipt:{action:a.kind,detail,totalDelta,foodConsumed:-totalDelta,roleOrTroopsWritten:false as const,actionBudgetWritten:false as const,healthOrFinalizerCalled:false as const,
   currentAuthority:'caller-unique-live-food-owner' as const}});
 }catch{return fail('invalid-field-food-data');}
}
