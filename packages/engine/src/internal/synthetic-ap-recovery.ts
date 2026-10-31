/** Private one-city first-corps read-only adapter; no AP, clock or person writer. */
import { calculateApRecovery } from '../calculations.ts';
import { DEFAULT_ADAPTERS } from '../engine.ts';
import { RULESET } from '../rules.ts';
import { validateState } from '../state.ts';
import type { GameState } from '../types.ts';
import { detachBoundedCityData } from './bounded-city-json.ts';

type Person = {id:string;ownerId:string;cityId:string;role:'resident'|'deployed';away:boolean;available:boolean;leadership:number;charisma:number;intelligence:number};
export type SyntheticApRecoveryContext = {ownerId:string;corpsId:string;cityId:string;rulerId:string;adviserId:string|null;actionPoints:number;officers:Person[]};
const fail=(reason:string)=>Object.freeze({ok:false as const,reason});
const record=(v:unknown):v is Record<string,unknown>=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const exact=(v:Record<string,unknown>,keys:string[])=>Object.keys(v).length===keys.length&&keys.every(k=>Object.hasOwn(v,k));
const sid=(v:unknown):v is string=>typeof v==='string'&&/^synthetic-[a-z0-9-]{1,48}$/.test(v);
const uint=(v:unknown,max:number):v is number=>typeof v==='number'&&Number.isSafeInteger(v)&&!Object.is(v,-0)&&v>=0&&v<=max;
function freeze<T>(v:T):Readonly<T>{if(v!==null&&typeof v==='object'){for(const x of Object.values(v))freeze(x);Object.freeze(v);}return v;}
/** Caller proves these current facts from one full genesis+journal; no caller-supplied count. */
export function projectSyntheticApRecovery(raw:unknown){
  try{
    const detached=detachBoundedCityData(raw);if(!detached.ok)return fail('invalid-ap-context-data');const v=detached.value;
    if(!record(v)||!exact(v,['ownerId','corpsId','cityId','rulerId','adviserId','actionPoints','officers'])
      ||![v.ownerId,v.corpsId,v.cityId,v.rulerId].every(sid)||!(v.adviserId===null||sid(v.adviserId))
      ||!uint(v.actionPoints,255)||!Array.isArray(v.officers)||v.officers.length<1||v.officers.length>32)return fail('invalid-ap-context');
    const people:Person[]=[];
    for(const p of v.officers){
      if(!record(p)||!exact(p,['id','ownerId','cityId','role','away','available','leadership','charisma','intelligence'])
        ||!sid(p.id)||p.ownerId!==v.ownerId||p.cityId!==v.cityId||(p.role!=='resident'&&p.role!=='deployed')
        ||typeof p.away!=='boolean'||typeof p.available!=='boolean'||!uint(p.leadership,100)||!uint(p.charisma,100)||!uint(p.intelligence,100))return fail('invalid-ap-officer');
      people.push(p as Person);
    }
    const ids=[v.ownerId,v.corpsId,v.cityId,...people.map(p=>p.id)];if(new Set(ids).size!==ids.length)return fail('ap-identity-collision');
    if(!people.some(p=>p.id===v.rulerId)||(v.adviserId!==null&&!people.some(p=>p.id===v.adviserId)))return fail('missing-ap-role');
    const inCity=(p:Person)=>p.role==='resident'&&!p.away&&p.available;
    const designated=people.find(p=>p.id===v.adviserId),adviser=designated&&inCity(designated)?designated:null;
    if(adviser&&adviser.intelligence<70)return fail('unsupported-present-adviser-intelligence');
    // These neutral fields are not read by calculateApRecovery. They are neither a saved
    // world nor a replacement balance; the projection is discarded after this one pure call.
    const state:GameState={schemaVersion:2,scope:'synthetic-training-sandbox',originProfile:'native-v2',
      ruleset:JSON.parse(JSON.stringify(RULESET)),date:{year:1,month:1,day:1},turn:0,revision:0,
      force:{id:v.ownerId as string,rulerId:v.rulerId as string,adviserId:adviser?.id??null,techniqueIds:[],techniquePoints:0},
      corps:{id:v.corpsId as string,forceId:v.ownerId as string,isFirst:true,actionPoints:v.actionPoints},
      bases:[{id:v.cityId as string,name:v.cityId as string,kind:'city',ownerForceId:v.ownerId as string,corpsId:v.corpsId as string,parentCityId:null,
        troops:0,morale:0,gold:0,trainingCompleted:false,facilities:{drillGround:'none',militaryOffice:'none',completedTalismanPlatforms:0}}],
      officers:people.map(p=>({id:p.id,name:p.id,forceId:p.ownerId,baseId:p.cityId,leadership:p.leadership,charisma:p.charisma,intelligence:p.intelligence,
        war:1,warBase:1,warXp:0,merit:0,acted:false,identity:p.id===v.rulerId?0 as const:3 as const,
        location:p.role==='deployed'?'unit' as const:inCity(p)?'base' as const:'away' as const,onMission:false})),
      rng:{algorithm:DEFAULT_ADAPTERS.random.id,seed:1,draws:0}};
    if(validateState(state,DEFAULT_ADAPTERS).length)return fail('invalid-ap-kernel-projection');
    const calculation=calculateApRecovery(state);
    return freeze({ok:true as const,requestedGain:calculation.recovery,receipt:{profile:'single-city-first-corps-source-ap-v1' as const,
      actualKernel:'calculateApRecovery' as const,ownerId:v.ownerId,corpsId:v.corpsId,cityId:v.cityId,
      actionPointsBefore:v.actionPoints,calculation,rulerId:v.rulerId,designatedAdviserId:v.adviserId,effectiveAdviserId:adviser?.id??null,
      adviserFallback:v.adviserId===null?'not-designated' as const:adviser?'none' as const:'not-currently-resident-available' as const,
      currentOfficerFacts:people,eligibleOfficerIds:people.filter(inCity).map(p=>p.id).sort(),cityCount:1 as const,talismanPlatforms:0 as const,
      attributePolicy:'current-base-pk-0-to100' as const,presencePolicy:'available-home-resident-not-away-no-acted-or-lock-filter' as const,
      nativeCallerVerified:false as const,worldWritten:false as const,rngDraws:0 as const}});
  }catch{return fail('invalid-ap-context-data');}
}
