/** Locust/harvest-only safe subset. No whole-season import, health branch or income writer. */
type Frozen<T> = T extends object ? { readonly [K in keyof T]: Frozen<T[K]> } : T;
const fail=(reason:string)=>Object.freeze({ok:false as const,reason});
const uint=(v:unknown,max:number):v is number=>typeof v==='number'&&Number.isSafeInteger(v)&&!Object.is(v,-0)&&v>=0&&v<=max;
const record=(v:unknown):v is Record<string,unknown>=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const exact=(v:Record<string,unknown>,names:readonly string[])=>Object.keys(v).length===names.length&&names.every(k=>Object.hasOwn(v,k));
const id=(v:unknown):v is string=>typeof v==='string'&&/^synthetic-[a-z0-9-]{1,48}$/.test(v);
function freeze<T>(v:T):Frozen<T>{if(v!==null&&typeof v==='object'&&!Object.isFrozen(v)){for(const x of Object.values(v))freeze(x);Object.freeze(v);}return v as Frozen<T>;}
type DateV={year:number;month:number;day:1|11|21};
type Kind='locust'|'harvest';
type Pending={activationYear:number;activationMonth:number;durationMonths:number};
type Facility={id:string;kind:string;level:number;complete:boolean};
type Metadata={phase:'settled'|'awaiting-income';pendingSkills:{fengshui:boolean;prayer:boolean}|null;schema:'synthetic-safe-season-v1';lastDate:DateV;advancedMonths:number;monthLimit:number;current:Record<Kind,number>;scheduled:Record<Kind,Pending|null>;
 rng:{word:number;cursor:number};removedFarms:{slot:number;facilityId:string}[];slotIds:(string|null)[];officerIds:string[]};
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

const KINDS:Kind[]=['locust','harvest'];
function date(v:unknown):DateV|undefined{if(!record(v)||!exact(v,['year','month','day'])||!uint(v.year,9999)||v.year<1||!uint(v.month,12)||v.month<1||![1,11,21].includes(v.day as number))return;return {year:v.year,month:v.month,day:v.day as 1|11|21};}
function nextMonth(d:DateV):DateV{return d.month===12?{year:d.year+1,month:1,day:1}:{year:d.year,month:d.month+1,day:1};}
function nextDate(d:DateV):DateV{return d.day===1?{...d,day:11}:d.day===11?{...d,day:21}:nextMonth(d);}
function sameDate(a:DateV,b:DateV){return a.year===b.year&&a.month===b.month&&a.day===b.day;}
function facts(raw:unknown):(Facility|null)[]|undefined{
 if(!Array.isArray(raw)||raw.length!==30)return;const seen=new Set<string>(),out:(Facility|null)[]=[];
 for(const f of raw){if(f===null){out.push(null);continue;}if(!record(f)||!exact(f,['id','kind','level','complete'])||!id(f.id)||seen.has(f.id)||typeof f.kind!=='string'
  ||!['market','farm','mint','granary','large-market','fish-market','black-market','military-farm','forge','stable','barracks','workshop'].includes(f.kind)
  ||!uint(f.level,3)||f.level===0||typeof f.complete!=='boolean'||(f.kind==='farm'&&(!f.complete||(f.level!==1&&f.level!==3))))return;
  seen.add(f.id);out.push({id:f.id,kind:f.kind,level:f.level,complete:f.complete});}return out;
}
function events(raw:unknown,d:DateV):{current:Record<Kind,number>;scheduled:Record<Kind,Pending|null>}|undefined{
 if(!record(raw)||!exact(raw,['current','scheduled'])||!record(raw.current)||!exact(raw.current,KINDS)||!record(raw.scheduled)||!exact(raw.scheduled,KINDS))return;
 const current={locust:0,harvest:0},scheduled:Record<Kind,Pending|null>={locust:null,harvest:null},next=nextMonth(d);
 for(const k of KINDS){const n=raw.current[k],p=raw.scheduled[k];if(!uint(n,2))return;current[k]=n;
  if(p!==null){if(n!==0||!record(p)||!exact(p,['activationYear','activationMonth','durationMonths'])||p.activationYear!==next.year||p.activationMonth!==next.month||!uint(p.durationMonths,2)||p.durationMonths<1||next.year>9999)return;
   scheduled[k]={activationYear:next.year,activationMonth:next.month,durationMonths:p.durationMonths};}}
 return {current,scheduled};
}
function metadata(raw:unknown):Metadata|undefined{
 if(!record(raw)||!exact(raw,['phase','pendingSkills','schema','lastDate','advancedMonths','monthLimit','current','scheduled','rng','removedFarms','slotIds','officerIds'])||raw.schema!=='synthetic-safe-season-v1'||(raw.phase!=='settled'&&raw.phase!=='awaiting-income'))return;
 const d=date(raw.lastDate),ss=Array.isArray(raw.officerIds)&&raw.officerIds.length>0&&raw.officerIds.length<=64&&raw.officerIds.every(id)&&new Set(raw.officerIds).size===raw.officerIds.length?[...raw.officerIds] as string[]:undefined;if(!d||!ss||!uint(raw.monthLimit,36)||raw.monthLimit<1||!uint(raw.advancedMonths,raw.monthLimit))return;
 const e=events({current:raw.current,scheduled:raw.scheduled},d);if(!e||!record(raw.rng)||!exact(raw.rng,['word','cursor'])||!uint(raw.rng.word,0xffffffff)||raw.rng.word===0||!uint(raw.rng.cursor,4096))return;
 if(!Array.isArray(raw.slotIds)||raw.slotIds.length!==30||!raw.slotIds.every(v=>v===null||id(v))||new Set(raw.slotIds.filter(v=>v!==null)).size!==raw.slotIds.filter(v=>v!==null).length||!Array.isArray(raw.removedFarms)||raw.removedFarms.length>30)return;
 const removed:{slot:number;facilityId:string}[]=[],seen=new Set<number>();for(const r of raw.removedFarms){if(!record(r)||!exact(r,['slot','facilityId'])||!uint(r.slot,29)||!id(r.facilityId)||raw.slotIds[r.slot]!==r.facilityId||seen.has(r.slot))return;seen.add(r.slot);removed.push({slot:r.slot,facilityId:r.facilityId});}
 if(raw.phase==='settled'&&raw.pendingSkills!==null)return;
 if(raw.phase==='awaiting-income'&&(!record(raw.pendingSkills)||!exact(raw.pendingSkills,['fengshui','prayer'])||typeof raw.pendingSkills.fengshui!=='boolean'||typeof raw.pendingSkills.prayer!=='boolean'))return;
 if(raw.phase==='awaiting-income'&&(d.day!==1||e.scheduled.locust!==null||e.scheduled.harvest!==null))return;
 return {phase:raw.phase,pendingSkills:raw.pendingSkills as Metadata['pendingSkills'],schema:'synthetic-safe-season-v1',lastDate:d,monthLimit:raw.monthLimit,advancedMonths:raw.advancedMonths,...e,rng:{word:raw.rng.word,cursor:raw.rng.cursor},removedFarms:removed,slotIds:[...raw.slotIds] as (string|null)[],officerIds:ss};
}
/** Configuration is immutable outer genesis; facilities/officer IDs bind existing owners, never create them. */
export function createSyntheticSafeSeason(rawConfig:unknown,rawContext:unknown){try{
 const g=detach(rawConfig),c=detach(rawContext);
 if(!record(g)||!exact(g,['profile','initialMonthAlreadySettled','monthLimit','seed','current','scheduled'])||g.profile!=='synthetic-locust-harvest-subset-v1'||g.initialMonthAlreadySettled!==true
  ||!uint(g.monthLimit,36)||g.monthLimit<1||!uint(g.seed,0xffffffff)||g.seed===0||!record(c)||!exact(c,['date','officerIds','facilities']))return fail('invalid-safe-season-genesis');
 const d=date(c.date),fs=facts(c.facilities),ss=Array.isArray(c.officerIds)&&c.officerIds.length>0&&c.officerIds.length<=64&&c.officerIds.every(id)&&new Set(c.officerIds).size===c.officerIds.length?[...c.officerIds] as string[]:undefined;if(!d||!fs||!ss)return fail('safe-season-owner-binding');
 if(fs.some(f=>f!==null&&ss.includes(f.id)))return fail('safe-season-entity-collision');
 let horizon=d;for(let i=0;i<g.monthLimit+1;i++)horizon=nextMonth(horizon);if(horizon.year>9999)return fail('safe-season-horizon');
 const e=events({current:g.current,scheduled:g.scheduled},d);if(!e)return fail('invalid-safe-season-events');
 return freeze({ok:true as const,metadata:{phase:'settled' as const,pendingSkills:null,schema:'synthetic-safe-season-v1' as const,lastDate:d,advancedMonths:0,monthLimit:g.monthLimit,...e,rng:{word:g.seed,cursor:0},removedFarms:[],slotIds:fs.map(f=>f?.id??null),officerIds:ss}});
 }catch{return fail('invalid-safe-season-data');}}
/** No income is credited. The returned harvest boolean is an input to the existing single income writer. */
export function planSyntheticSafeSeasonPreIncome(rawMetadata:unknown,rawContext:unknown){const draws:unknown[]=[];try{
 const m=metadata(detach(rawMetadata)),c=detach(rawContext);if(!m||m.phase!=='settled'||!record(c)||!exact(c,['date','turn','food','techniquePoints','facilities','residentOfficerIds','skillHolders']))return fail('invalid-safe-season-context');
 const d=date(c.date),fs=facts(c.facilities);
 if(!d||!sameDate(d,nextDate(m.lastDate))||!uint(c.turn,0x7fffffff)||!uint(c.food,1000000000)||!uint(c.techniquePoints,10000)||!fs||!Array.isArray(c.residentOfficerIds)||!c.residentOfficerIds.every(id)
  ||new Set(c.residentOfficerIds).size!==c.residentOfficerIds.length||!c.residentOfficerIds.every(n=>m.officerIds.includes(n)))return fail('safe-season-current-input');
 const removedSlots=new Set(m.removedFarms.map(r=>r.slot));
 if(fs.some((f,i)=>removedSlots.has(i)?f!==null:(f?.id??null)!==m.slotIds[i]))return fail('safe-season-tombstone-or-slot-mismatch');
 const resident=new Set(c.residentOfficerIds);
 if(!record(c.skillHolders)||!exact(c.skillHolders,['fengshui','prayer']))return fail('invalid-current-season-skills');
 for(const name of ['fengshui','prayer']){const list=c.skillHolders[name];if(!Array.isArray(list)||list.length>64||!list.every(v=>id(v)&&resident.has(v))||new Set(list).size!==list.length)return fail('nonresident-season-skill-holder');}
 const fengshui=[...(c.skillHolders.fengshui as string[])].sort(),prayer=[...(c.skillHolders.prayer as string[])].sort();
 if(d.day!==1)return freeze({ok:true as const,metadata:{...m,lastDate:d},foodPatch:{before:c.food,after:c.food},techniquePointsPatch:{before:c.techniquePoints,after:c.techniquePoints},removals:[],harvestActive:m.current.harvest>0,receipt:{status:'not-month-start',date:d,turn:c.turn,draws:[]}});
 if(m.advancedMonths>=m.monthLimit)return fail('safe-season-month-limit');
 const x:Metadata={...m,phase:'awaiting-income',pendingSkills:{fengshui:fengshui.length>0,prayer:prayer.length>0},lastDate:d,advancedMonths:m.advancedMonths+1,current:{...m.current},scheduled:{...m.scheduled},rng:{...m.rng},removedFarms:[...m.removedFarms]};
 const roll=(bound:number,label:string)=>{const before={...x.rng},words=[];const limit=Math.floor(4294967295/bound)*bound;
  while(true){if(x.rng.cursor>=4096){draws.push({label,bound,words,cursorBefore:before.cursor,cursorAfter:x.rng.cursor,status:'incomplete-budget'});throw new Error('rng-budget');}const seedBefore=x.rng.word,cursorBefore=x.rng.cursor;let word=seedBefore;
   word=(word^(word<<13))>>>0;word=(word^(word>>>17))>>>0;word=(word^(word<<5))>>>0;if(word===0)throw new Error('rng-zero');x.rng.word=word;x.rng.cursor++;
   const sample=word-1,rejected=sample>=limit;words.push({seedBefore,seedAfter:word,cursorBefore,cursorAfter:x.rng.cursor,raw:word,sample,limit,rejected});
   if(!rejected){const value=sample%bound;draws.push({label,bound,words,value,cursorBefore:before.cursor,cursorAfter:x.rng.cursor,seedBefore:before.word,seedAfter:x.rng.word,policyId:'safe-subset-xorshift32-nonzero-rejection-v1'});return value;}}
 };
 const migrations=[];for(const k of KINDS){const old=x.current[k],p=x.scheduled[k];x.current[k]=Math.max(0,old-1);let outcome='no-pending';
  if(p!==null){if(p.activationYear!==d.year||p.activationMonth!==d.month||x.current[k]!==0)return fail('invalid-pending-month');if(k==='locust'&&fengshui.length)outcome='prevented-fengshui';else{x.current[k]=p.durationMonths;outcome='activated';}}
  x.scheduled[k]=null;migrations.push({kind:k,before:old,after:x.current[k],pending:p,outcome});}
 let food=c.food,tp=c.techniquePoints;const removals:{slot:number;facilityId:string}[]=[];let locust:unknown={status:'inactive'};
 if(x.current.locust>0){const rate=200+roll(501,'locust:food-loss-rate'),loss=Math.floor(food*rate/10000);food-=loss;
  const eligible=fs.map((f,slot)=>({f,slot})).filter(v=>v.f!==null&&v.f.kind==='farm'&&v.f.level===1).sort((a,b)=>a.f!.id<b.f!.id?-1:a.f!.id>b.f!.id?1:0);
  for(const {f,slot} of eligible)if(roll(3,`locust:farm:${f!.id}`)===0){
   const selected={slot,facilityId:f!.id};
   if(tp<30)return freeze({ok:false as const,reason:'insufficient-technique-points',attempt:{date:d,draws,migrations,foodBefore:c.food,foodAfter:food,selected,priorRemovals:removals,committed:false as const}});
   tp-=30;removals.push(selected);
  }
  locust={status:c.food===0?'zero-food-no-loss':'applied',rateBasisPoints:rate,loss,foodBefore:c.food,foodAfter:food,requiredTechniquePoints:removals.length*30};
  x.removedFarms.push(...removals);
 }
 return freeze({ok:true as const,metadata:x,foodPatch:{before:c.food,after:food},techniquePointsPatch:{before:c.techniquePoints,after:tp},removals,harvestActive:x.current.harvest>0,
  receipt:{status:'month-applied',date:d,turn:c.turn,skills:{fengshuiHolders:fengshui,prayerHolders:prayer},migrations,locust,draws,
   order:'safe-decay-activate-locust-before-owner-income-v1',incomeCredited:false as const,plagueBranchPresent:false as const,nativeEquivalent:false as const}});
 }catch(e){return freeze({ok:false as const,reason:e instanceof Error&&e.message==='rng-budget'?'safe-season-rng-budget':'invalid-safe-season-data',attempt:{draws,committed:false as const}});}}

/** Must be invoked by the outer owner after its existing income proposal succeeds; no income runs here. */
export function planSyntheticSafeSeasonPostIncome(rawMetadata:unknown){const draws:unknown[]=[];try{
 const m=metadata(detach(rawMetadata));if(!m||m.phase!=='awaiting-income')return fail('safe-season-post-phase-mismatch');
 const x:Metadata={...m,phase:'settled',rng:{...m.rng},scheduled:{...m.scheduled}},d=x.lastDate;
 const roll=(bound:number,label:string)=>{const before={...x.rng},words=[];const limit=Math.floor(4294967295/bound)*bound;
  while(true){if(x.rng.cursor>=4096){draws.push({label,bound,words,cursorBefore:before.cursor,cursorAfter:x.rng.cursor,status:'incomplete-budget'});throw new Error('rng-budget');}const seedBefore=x.rng.word,cursorBefore=x.rng.cursor;let word=seedBefore;
   word=(word^(word<<13))>>>0;word=(word^(word>>>17))>>>0;word=(word^(word<<5))>>>0;if(word===0)throw new Error('rng-zero');x.rng.word=word;x.rng.cursor++;
   const sample=word-1,rejected=sample>=limit;words.push({seedBefore,seedAfter:word,cursorBefore,cursorAfter:x.rng.cursor,raw:word,sample,limit,rejected});
   if(!rejected){const value=sample%bound;draws.push({label,bound,words,value,cursorBefore:before.cursor,cursorAfter:x.rng.cursor,seedBefore:before.word,seedAfter:x.rng.word,policyId:'safe-subset-xorshift32-nonzero-rejection-v1'});return value;}}
 };
 const fengshui=m.pendingSkills!.fengshui?[true]:[],prayer=m.pendingSkills!.prayer?[true]:[];
 const next=nextMonth(d);if(next.year>9999)return fail('safe-season-lookahead');const generations=[];
 for(const k of KINDS){const threshold=k==='locust'?13:prayer.length?42:21;let outcome:string;
  if(x.current[k]>0||x.scheduled[k]!==null)outcome='active-or-pending';else if(k==='locust'&&fengshui.length)outcome='prevented-fengshui';
  else if(roll(1000,`generate:${k}:occurrence`)>=threshold)outcome='not-selected';else{x.scheduled[k]={activationYear:next.year,activationMonth:next.month,durationMonths:1+roll(2,`generate:${k}:duration`)};outcome='scheduled';}
  generations.push({kind:k,threshold,denominator:1000,outcome,pending:x.scheduled[k]});}
 x.pendingSkills=null;
 return freeze({ok:true as const,metadata:x,receipt:{date:d,generations,draws,order:'safe-generate-after-owner-income-v1',incomeCredited:false as const,plagueBranchPresent:false as const}});
 }catch(e){return freeze({ok:false as const,reason:e instanceof Error&&e.message==='rng-budget'?'safe-season-rng-budget':'invalid-safe-season-post-data',attempt:{draws,committed:false as const}});}}
