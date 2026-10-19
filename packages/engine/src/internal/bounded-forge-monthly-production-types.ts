/** Closed monthly-owner contracts. Shared leaves retain their original domains. */
import type { Scenario as BaseScenario, Policy as BasePolicy, ReceiptCommon as BaseReceiptCommon } from './bounded-forge-development-production-types.ts';
import type { DeepReadonly, ConstructionPolicy, ConstructionCatalog, Id, JobId, Digest, Marker, Equipment, ProduceEquipment, DateV1, Position, Clock, Progress, OfficerFacts, Lot, ExistingForge, Unit, ProductionCatalog, DomesticPolicies, RateInput, RateEvidence, RateReceipt, ConstructionWrite, ConstructionWritePolicyId, DomesticWrite, OfficerRow, FacilityRow, Ledger, ConstructionReward, Completion, StartSnapshot, ConstructionFees, Work, Job, Current, PriceInput, PriceOutput, QuantitySlot, QuantityInput, QuantityOutput, Kernels, ProductionCalculation, DomesticFees, DomesticReward, ProductionAudit, StartCommand, ProduceCommand, AdvanceCommand, Command, Envelope, UnitCheck, StartReservations, StartDetail, ProgressAudit, Stage, Reason, Failure } from './bounded-forge-development-production-types.ts';
export type { DeepReadonly, ConstructionPolicy, ConstructionCatalog, Id, JobId, Digest, Marker, Equipment, ProduceEquipment, DateV1, Position, Clock, Progress, OfficerFacts, Lot, ExistingForge, Unit, ProductionCatalog, DomesticPolicies, RateInput, RateEvidence, RateReceipt, ConstructionWrite, ConstructionWritePolicyId, DomesticWrite, OfficerRow, FacilityRow, Ledger, ConstructionReward, Completion, StartSnapshot, ConstructionFees, Work, Job, Current, PriceInput, PriceOutput, QuantitySlot, QuantityInput, QuantityOutput, Kernels, ProductionCalculation, DomesticFees, DomesticReward, ProductionAudit, StartCommand, ProduceCommand, AdvanceCommand, Command, Envelope, UnitCheck, StartReservations, StartDetail, ProgressAudit, Stage, Reason, Failure } from './bounded-forge-development-production-types.ts';

export type Thirty<T> = [T,T,T,T,T,T,T,T,T,T, T,T,T,T,T,T,T,T,T,T, T,T,T,T,T,T,T,T,T,T];
export type MonthlyFacts = {governorOfficerId:Id|null;facilityLotSlots:Thirty<Id|null>};
export type Scenario = Omit<BaseScenario,'profile'|'policy'> & {
  profile:'bounded-forge-monthly-production-v1';
  policy:Policy;
  monthlySpecialty:MonthlyFacts;
};

export type Policy = {
  id:'bounded-forge-monthly-production-v1';version:1;
  base:BasePolicy;
  monthly:MonthlyPolicy;
  budgets:{acceptedCommands:64;traceAttempts:128;maxJobs:1;maxAdvances:12;
    maxOfficers:8;maxLots:2;maxFacilities:2;maxFieldUnits:16;maxHostileForces:16;
    maxUtf8Bytes:8388608;maxNodes:250000;maxDepth:48;maxArray:4096;maxObjectKeys:128};
};
export type MonthlyPolicy = {
  id:'dynamic-forge-monthly-v1';
  clock:'after-core-completion-at-month-start-v1';
  slots:'explicit-lot-slots-from-current-v1';
  governor:'fixed-officer-current-politics-0-to-100-v1';
  initialDate:'no-create-catchup-v1';payroll:'not-modeled';
  order:[1,2,3];
  specialty:{id:'documented-matching-complete-facilities-v1';order:[1,2,3,4];
    matchingKinds:{1:'forge';2:'forge';3:'forge';4:'stable'};
    completedFacilityWeight:1;governorRequired:true;
    arithmeticProfile:'comment-f32-rne-trunc-v1';kernelRequestCap:1500;
    nativeMatchingHelperRecovered:false};
  arithmetic:{id:'comment-f32-rne-trunc-v1';
    constantBitsU32:{half:1056964608;one:1065353216;quarter:1048576000;
      two:1073741824;tenth:1036831949;three:1077936128};
    factorTiers:['count=1:1','2..3:1+(count-1)*half','4..7:2+(count-3)*quarter','8..30:3+(count-7)*tenth'];
    factorStore:'one-binary32-round-to-nearest-even';politicsTerm:'floor(politics/2)+60';
    scaledValue:'politicsTerm*storedFactor*three';converter:'truncate-toward-zero';
    requestCap:1500;evidence:'provisional-comment-constants-and-converter'};
  credit:{id:'saturating-positive-credit-v1';accepted:'min(requested,capacity-before)';
    discarded:'requested-accepted';bonusBasis:'requested-base';caps:'explicit-scenario-not-native'};
};

export type TickDetail = {
  apRecovery:ConstructionWrite;progress:ProgressAudit[];completions:Completion[];
  monthlySpecialty:MonthlyReceipt;
};
export type ReceiptCommon = Omit<BaseReceiptCommon,'scope'> & {
  scope:'bounded-shared-forge-monthly-production';
};
export type Receipt = ReceiptCommon & (
  {kind:'forge-start';detail:StartDetail} |
  {kind:'production';detail:{audit:ProductionAudit}} |
  {kind:'tick';detail:TickDetail}
);
export type State = {
  tag:'san11-bounded-forge-monthly-production-state-v1';schemaVersion:1;
  profile:'bounded-forge-monthly-production-v1';genesis:Scenario;revision:number;
  current:Current;acceptedCommands:{envelope:Envelope;receipt:Receipt}[];
};
export type CreateOrLoadResult = Failure|{ok:true;state:State};
export type InspectResult = Failure|{ok:true;revision:number;current:Current;
  remainingHistorySlots:number;remainingAdvances:number;reservedCompletionSlots:number;
  scope:'bounded-shared-forge-monthly-production'};
export type ExecuteResult = Failure|{ok:true;committed:boolean;duplicate:boolean;state:State;receipt:Receipt};
export type PreviewResult = Failure|{ok:true;committed:false;duplicate:boolean;baseRevision:number;
  projectedCurrent:Current;receipt:Receipt};
export type SaveEnvelope = {tag:'san11-bounded-forge-monthly-production-save-v1';state:State};
export type SaveResult = Failure|{ok:true;serialized:string};
export type ReplayOutcome = Failure|{ok:true;duplicate:boolean;receipt:Receipt};
export type Trace = {tag:'san11-bounded-forge-monthly-production-trace-v1';scenario:Scenario;
  attempts:{envelope:Envelope;expected:ReplayOutcome|null}[];expectedFinalState:State|null};
export type ReplayResult = {ok:true;state:State;outcomes:ReplayOutcome[]}
  |(Failure&{index:number|null;state:null});

export type MonthlySlots = Thirty<
  {validityEaxU32:0;correspondingCompletedEaxU32?:never} |
  {validityEaxU32:1;correspondingCompletedEaxU32:0|1}
>;
export type MonthlyInput = {
  profile:'monthly-specialty-production-observed-v1';
  arithmeticProfile:'comment-f32-rne-trunc-v1';equipmentType:ProduceEquipment;
} & (
  {specialtyEaxU32:0;slots?:never;governorPoliticsEaxU32?:never} |
  {specialtyEaxU32:1;slots:MonthlySlots;governorPoliticsEaxU32?:never} |
  {specialtyEaxU32:1;slots:MonthlySlots;governorPoliticsEaxU32:number}
);
export type MonthlyCapture = (
  {kind:'specialty';callAddress:'00590A7E';target:'0047B3A0';slotIndex:null;
   eaxU32:0|1;consumedWidthBits:8;consumedValue:0|1} |
  {kind:'validity';callAddress:'00590AB3';target:'0047A630';slotIndex:number;
   eaxU32:0|1;consumedWidthBits:32;consumedValue:0|1} |
  {kind:'corresponding-completed';callAddress:'00590AC6';target:'0049CFB0';slotIndex:number;
   eaxU32:0|1;consumedWidthBits:32;consumedValue:0|1} |
  {kind:'governor-politics';callAddress:'00590B4E';target:'004890A0';slotIndex:null;
   eaxU32:number;consumedWidthBits:8;consumedValue:number}
);
export type MonthlyArithmetic = {
  factorTier:'one'|'two-to-three';factorBitsU32:1065353216|1069547520;
  factorValue:1|1.5;politicsAL:number;politicsTerm:number;
  scaledValue:number;convertedSigned32:number;capApplied:false;
};
export type MonthlyQuantityRequest = {
  pushAddress:'00590B82';continuationAddress:'00590B83';
  quantityU32:number;quantitySigned32:number;
};
export type MonthlyEvidence = {
  level:'source-listing-control-flow-with-provisional-arithmetic';
  controlFlow:'source-listing-reconstruction';
  arithmetic:'documented-replaceable-assumptions';
  profile:'monthly-specialty-production-observed-v1';
  arithmeticProfile:'comment-f32-rne-trunc-v1';
  source:'docs/sources/monthly-specialty-production.json';
  projectTarget:'PC-PK1.1';sourceEditionClaim:'PK';
  exactSourceVersionVerified:false;runtimeSourceRehashPerformed:false;
  nativeExecutableExecuted:false;nativeHelpersReconstructed:false;
  converterBodyKnown:false;memoryConstantBytesRecovered:false;
  stockOriginalVerified:false;vanillaVerified:false;abiVerified:false;
  fullCallerExecuted:false;stateWriterIntegrated:false;ownerForceIntegrated:false;
  schedulerIntegrated:false;rngIntegrated:false;
};
export type MonthlyKernelResult = {
  supported:true;profile:'monthly-specialty-production-observed-v1';
  arithmeticProfile:'comment-f32-rne-trunc-v1';equipmentType:ProduceEquipment;
  observations:MonthlyInput;capturedReturns:MonthlyCapture[];evidence:MonthlyEvidence;
} & (
  {path:'not-specialty';completedFacilityCount:null;arithmetic:null;quantityRequest:null} |
  {path:'no-completed-facilities';completedFacilityCount:0;arithmetic:null;quantityRequest:null} |
  {path:'production';completedFacilityCount:1|2;arithmetic:MonthlyArithmetic;quantityRequest:MonthlyQuantityRequest}
);
export type MonthlyKernelCall = {
  status:'called';api:'calculateMonthlySpecialtyProduction';
  profile:'monthly-specialty-production-observed-v1';
  adapterObservationKind:'derived-adapter-observations';
  input:MonthlyInput;result:MonthlyKernelResult;
};
export type MonthlyWrite = {
  resource:'equipment-1'|'equipment-2'|'equipment-3';reason:'specialty';
  before:number;requested:number;accepted:number;actualDelta:number;
  after:number;cap:number;discarded:number;
  writerPolicyId:'saturating-positive-credit-v1';
};
export type MonthlyItem = {equipmentType:ProduceEquipment;arithmeticProfile:'comment-f32-rne-trunc-v1'} & (
  {eligibility:'not-due';count:null;kernelQuantityRequest:null;
    kernel:{status:'not-due';reason:'not-month-start'};write:null} |
  {eligibility:'no-governor';count:null;kernelQuantityRequest:null;
    kernel:{status:'not-due';reason:'no-governor'};write:null} |
  {eligibility:'not-specialty';count:null;kernelQuantityRequest:null;kernel:MonthlyKernelCall;write:null} |
  {eligibility:'no-completed-facilities';count:0;kernelQuantityRequest:null;kernel:MonthlyKernelCall;write:null} |
  {eligibility:'production';count:1|2;kernelQuantityRequest:number;kernel:MonthlyKernelCall;write:MonthlyWrite}
);
export type MonthlyReceipt = {
  status:'not-due'|'no-governor'|'settled';
  settlement:{cityId:Id;year:number;month:number}|null;
  governor:{officerId:Id;politics:number}|null;
  facilityIds:Thirty<Id|null>|null;
  items:[MonthlyItem,MonthlyItem,MonthlyItem];
};
