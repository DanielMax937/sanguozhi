/** Read-only effective WAR affects the real Train formula, never the persistent base/XP facts. */
import { planSyntheticTrainingBridge, planSyntheticTrainingBridge120 } from './synthetic-training-bridge.ts';
import { detachBoundedCityData } from './bounded-city-json.ts';
import { calculateTraining } from '../calculations.ts';
import { RULES } from '../rules.ts';
import type { GameState } from '../types.ts';
const fail=(reason:string)=>Object.freeze({ok:false as const,reason});
const record=(v:unknown):v is Record<string,unknown>=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const exact=(v:Record<string,unknown>,keys:readonly string[])=>Object.keys(v).length===keys.length&&keys.every(k=>Object.hasOwn(v,k));
function freeze<T>(v:T):Readonly<T>{if(v!==null&&typeof v==='object'&&!Object.isFrozen(v)){for(const c of Object.values(v))freeze(c);Object.freeze(v);}return v;}
export function planSyntheticEffectiveTraining(rawState:unknown,rawBindings:unknown,rawAction:unknown,rawReadView:unknown){try{
 const detached=detachBoundedCityData([rawState,rawBindings,rawAction,rawReadView]);if(!detached.ok||!Array.isArray(detached.value))return fail('invalid-effective-training-data');
 const [stateData,bindings,action,view]=detached.value;
 if(!record(view)||!exact(view,['profile','energyDomain','warByOfficer'])||view.profile!=='live-equipment-training-war255-v1'
  ||(view.energyDomain!=='legacy100'&&view.energyDomain!=='researched120')||!Array.isArray(view.warByOfficer))return fail('invalid-effective-training-view');
 // This real, unmodified state proposal provides every source eligibility and persistent reward check.
 const basePlan=view.energyDomain==='researched120'?planSyntheticTrainingBridge120(stateData,bindings,action):planSyntheticTrainingBridge(stateData,bindings,action);
 if(!basePlan.ok)return basePlan;
 const state=stateData as GameState,base=state.bases[0]!,ids=(action as {officerIds:string[]}).officerIds;
 if(view.warByOfficer.length!==state.officers.length)return fail('effective-training-roster-mismatch');
 const values=new Map<string,number>();
 for(const row of view.warByOfficer){if(!record(row)||!exact(row,['officerId','war'])||typeof row.officerId!=='string'||values.has(row.officerId)
   ||typeof row.war!=='number'||!Number.isSafeInteger(row.war)||Object.is(row.war,-0)||row.war<0||row.war>255)return fail('invalid-effective-training-war');
  const actual=state.officers.find(o=>o.id===row.officerId);if(!actual||row.war<actual.war)return fail('effective-training-base-mismatch');values.set(row.officerId,row.war);}
 // A calculation-only read view. It is never submitted to state validation/execution or persisted as Officer.war.
 const selected=ids.map(id=>{const actual=state.officers.find(o=>o.id===id)!;return{...actual,war:values.get(id)!};});
 const training=calculateTraining(state,base,selected);
 if(!Object.values(training).every(v=>typeof v==='boolean'||(typeof v==='number'&&Number.isSafeInteger(v)&&v>=0))
  ||training.apCost!==state.corps.actionPoints-basePlan.patch.actionPoints||state.corps.actionPoints<training.apCost
  ||training.moraleCap>(view.energyDomain==='researched120'?120:100))return fail('effective-training-formula-domain');
 const techniquePoints=Math.min(RULES['resource.tpCap'].value,state.force.techniquePoints+training.techniquePointsBeforeCap);
 return freeze({ok:true as const,policyId:'synthetic-owner-effective-training-war255-v1' as const,
  patch:{...basePlan.patch,morale:base.morale+training.actualGain,actionPoints:state.corps.actionPoints-training.apCost,techniquePoints},
  receipt:{calculation:{...basePlan.receipt.calculation,training},qualificationEvidence:basePlan.receipt.evidence,rngDraws:basePlan.receipt.rngDraws,actualFormulaSource:'calculateTraining' as const,
   readView:{profile:view.profile,energyDomain:view.energyDomain,selected:ids.map(id=>({officerId:id,baseWar:state.officers.find(o=>o.id===id)!.war,effectiveWar:values.get(id)!}))},
   qualificationProposal:basePlan.receipt,qualificationProposalCommitted:false as const,
   policy:'existing-train-formula-effective-war255-read-view-v1' as const,nativeEquipmentCallerCertified:false as const}});
 }catch{return fail('invalid-effective-training-data');}}
