/** Closed contracts for this root only. Numeric and cross-field domains are checked by its owner. */
import type { CONSTRUCTION_POLICY, CONSTRUCTION_CATALOG } from './bounded-forge-development-production-registry.ts';
export type DeepReadonly<T> = T extends object ? { readonly [K in keyof T]: DeepReadonly<T[K]> } : T;
type Mutable<T> = T extends object ? { -readonly [K in keyof T]: Mutable<T[K]> } : T;
export type ConstructionPolicy = Mutable<typeof CONSTRUCTION_POLICY>;
export type ConstructionCatalog = Mutable<typeof CONSTRUCTION_CATALOG>;

export type Id = string; export type JobId = string; export type Digest = string;
export type Marker = number | null;
export type Equipment = 1 | 2 | 3 | 4;
export type ProduceEquipment = 1 | 2 | 3;
export type DateV1 = {year:number; month:number; day:1|11|21};
export type Position = {q:number; r:number};
export type Clock = {date:DateV1; turn:number; advancedCount:number};
export type Progress = {
  leadershipXp:number; charmXp:number; intelligenceXp:number;
  politicsXp:number; warXp:number; merit:number; actedTurn:Marker;
};
export type OfficerFacts = {
  id:Id; forceId:Id; cityId:Id; available:boolean;
  leadership:number; charm:number; intelligence:number; politics:number;
  skillIds:(79|80|81)[]; initial:Progress;
};
export type Lot = {id:Id; cityId:Id; position:Position};
export type ExistingForge = {
  id:Id; lotId:Id; cityId:Id; kind:'forge'; level:1; complete:true;
  initialUsedTurn:Marker;
};
export type Unit = {id:Id; forceId:Id; position:Position};
export type ProductionCatalog = {
  id:Id; version:1;
  entries:{1:{basePriceWord:number};2:{basePriceWord:number};
           3:{basePriceWord:number};4:{basePriceWord:number}};
};
export type Scenario = {
  schemaVersion:1; profile:'bounded-forge-development-production-v1'; episodeId:Id;
  clock:{date:DateV1;turn:number}; advanceLimit:number; activeForceId:Id;
  force:{id:Id; initialTechniquePoints:number};
  corps:{id:Id;forceId:Id;initialActionPoints:number};
  city:{id:Id;kind:'city';ownerForceId:Id;position:Position;
    goldCapacity:1000000000;troopCapacity:number;moraleCap:number;
    initial:{gold:number;security:number;troops:number;morale:number;patrolUsedTurn:Marker};
    inventory:{1:{quantity:number;capacity:number};2:{quantity:number;capacity:number};
               3:{quantity:number;capacity:number};4:{quantity:number;capacity:number}}};
  officers:OfficerFacts[]; lots:Lot[]; facilities:ExistingForge[];
  domestic:{pressureActive:boolean;difficulty:'normal'|'super';controller:'player'|'ai';
    unlockedEquipmentTypes:Equipment[];specialtyEquipmentTypes:Equipment[]};
  constructionEnvironment:{completeFieldUnits:true;hostileForceIds:Id[];fieldUnits:Unit[]};
  productionCatalog:ProductionCatalog; constructionCatalog:ConstructionCatalog;
  policy:Policy;
};

export type Policy = {
 id:'bounded-forge-development-production-v1';version:1;
 clock:'root-xun-ap-then-forge-completion-v1';
 ownership:'fixed-supplied-city-corps-force-v1';
 transaction:'one-command-all-or-nothing-v1';
 reservation:'root-bidirectional-forge-lock-v1';
 externalFacts:'fixed-for-entire-bounded-episode-v1';
 pressureBinding:'independent-supplied-domestic-helper-v1';
 techniquePointScope:'genesis-plus-construction-completion-only';
 ordinaryTechniquePoints:'not-modeled';
 construction:ConstructionPolicy; domestic:DomesticPolicies;
 budgets:{acceptedCommands:64;traceAttempts:512;maxJobs:1;maxAdvances:12;
  maxOfficers:8;maxLots:2;maxFacilities:2;maxFieldUnits:16;maxHostileForces:16;
  maxUtf8Bytes:8388608;maxNodes:250000;maxDepth:48;maxArray:4096;maxObjectKeys:128};
};
export type DomesticPolicies = {
 attributes:{id:'stable-effective-attributes-v1';version:1;parameters:{snapshot:'command-start';xpChangesEffectiveAbility:false}};
 facilityMultiplier:{id:'guide-levels-f32-v1';version:1;parameters:{levelBits:['3F800000','3F99999A','3FC00000']}};
 writer:{id:'clip-and-return-actual-v1';version:1;parameters:{overflow:'clip';returned:'actual-delta'}};
 morale:{id:'weighted-floor-presecurity-min20-v1';version:1;parameters:{rounding:'floor';security:'before-write';minimum:20}};
 productionAp:{id:'production-request20-effective20-v1';version:1;parameters:{quantity:20;piece:20}};
 rewards:{id:'source-reward-compat-intelligence-v1';version:1;parameters:{patrol:'leadership';recruit:'charm';quantity:'intelligence';piece:'intelligence';instantXp:2;instantMerit:50;completionXp:4;completionMerit:100;cap:1000000000}};
 zeroYield:{id:'pay-zero-yield-instant-v1';version:1;parameters:{zero:'pay-and-reward'}};
 presentation:{id:'no-presentation-rng-no-tp-v1';version:1;parameters:{rngDraws:0;techniquePoints:'not-modeled'}};
};

export type RateInput = {profile:'domestic-construction-rate-stable-v1';politics:number[];facilityDurability:800};
export type RateEvidence = {
 slotsAndStablePolitics:['005BB1E0..005BB213'];
 politicsHalfAndAdd:['005BB23E..005BB247'];
 stableFacilityReads:['005BB223','005BB22A','005BB237','005BB249','005BB26C','005BB279','005BB27E'];
 durabilityMinimum:['005BB249..005BB266','005BB26C..005BB29E'];
 selectAndReturn:['005BB268..005BB2AA'];
 excludedMod:['*005BB263..*008A9DFD'];
};
export type RateReceipt = {
 supported:true;profile:'domestic-construction-rate-stable-v1';
 politics:[number|null,number|null,number|null];facilityDurability:800;
 politicsSum:number;maxPolitics:number;halfPoliticsSum:number;politicsRate:number;
 durabilityQuarter:200;durabilityRemainder:600;durabilityMinimum:66;
 rate:number;selectedBranch:'politics'|'durability-minimum';evidence:RateEvidence;
};

export type ConstructionWrite = {
 before:number;requestedDelta:number;actualDelta:number;after:number;
 cap:number;discarded:number;policyId:ConstructionWritePolicyId;
};
export type ConstructionWritePolicyId = 'facility-exact-debit-saturating-reward-v1'
 |'facility-community-rewards-v1'|'facility-ap20-cap255-v1';
export type DomesticWrite = {
 before:number;requested:number;returned:number;actualDelta:number;after:number;
 cap:number;discarded:number;policyId:'clip-and-return-actual-v1'
 |'saturating-accumulator-v1'|'exact-affordable-debit-v1';
};
export type OfficerRow = Progress & {id:Id;politics:number;reservationJobId:JobId|null};
export type FacilityRow = {
 id:Id;lotId:Id;cityId:Id;kind:'forge';targetLevel:1;typeId:34;
 status:'developing'|'complete';effectiveLevel:0|1;jobId:JobId|null;usedTurn:Marker;
};
export type Ledger = {
 gold:number;actionPoints:number;security:number;troops:number;morale:number;patrolUsedTurn:Marker;
 force:{techniquePoints:number};
 inventory:{1:{quantity:number;reserved:0};2:{quantity:number;reserved:0};
            3:{quantity:number;reserved:0};4:{quantity:number;reserved:0}};
 officers:OfficerRow[];facilities:FacilityRow[];
};
export type ConstructionReward = {
 officerId:Id;politicsXp:ConstructionWrite;merit:ConstructionWrite;
 politicsBefore:number;politicsAfter:number;
};
export type Completion = {
 jobId:JobId;facilityId:Id;typeId:34;level:1;effectiveLevel:1;
 techniquePoints:ConstructionWrite;rewards:ConstructionReward[];
 releasedOfficerIds:Id[];policyId:'next-boundary-capped-work-v1';
};
export type StartSnapshot = {
 clock:{date:DateV1;turn:number};activeForceId:Id;corpsId:Id;cityId:Id;
 lot:Lot;officers:{id:Id;politics:number}[];
 policyDigest:Digest;constructionCatalogDigest:Digest;
};
export type ConstructionFees = {actionPoints:ConstructionWrite;gold:ConstructionWrite};
export type Work = {initial:200;current:number;required:800;perAdvance:number;rate:RateReceipt};
export type Job = {
 id:JobId;kind:'development';facilityKind:'forge';cityId:Id;lotId:Id;facilityId:Id;
 fromLevel:0;targetLevel:1;officerIds:Id[];politics:number[];
 startTurn:number;startDate:DateV1;dueTurn:number;dueDate:DateV1;
 durationTurns:number;remainingTurns:number;work:Work;startSnapshot:StartSnapshot;
 rateInput:RateInput;fees:ConstructionFees;completedTurn:Marker;completion:Completion|null;
};
export type Current = {clock:Clock;ledger:Ledger;jobs:Job[]};

export type PriceInput = {profile:'production-price-resolved-v1';savedBasePriceWord:number;specialtyHelperEax:0|1};
export type PriceOutput = {supported:true;profile:'production-price-resolved-v1';savedBasePriceWord:number;
 specialtyHelperEax:0|1;specialtyResultAl:0|1;discountApplied:boolean;returnedPrice:number};
export type QuantitySlot = {intelligenceGetterEax:number;skillHelperEax:0|1}|null;
export type QuantityInput = {
 profile:'production-quantity-resolved-f32-v1';nativeEquipmentType:ProduceEquipment;
 slots:[QuantitySlot,QuantitySlot,QuantitySlot];resolvedFacilityFactorBits:'3F800000';
} & ({difficultyWord:0}|{difficultyWord:2;cityVirtualEax:0|1});
export type QuantityOutput = {
 supported:true;profile:'production-quantity-resolved-f32-v1';nativeEquipmentType:ProduceEquipment;
 reason:'resolved-quantity';resolvedInputsObserved:true;
 slots:[{intelligenceGetterEax:number;intelligenceAl:number;skillHelperEax:0|1}|null,
        {intelligenceGetterEax:number;intelligenceAl:number;skillHelperEax:0|1}|null,
        {intelligenceGetterEax:number;intelligenceAl:number;skillHelperEax:0|1}|null];
 validSlotCount:number;intelligenceSum:number;intelligenceMax:number;skillQueryId:80;
 skillApplied:boolean;baseQuantity:number;skillAdjustedQuantity:number;
 resolvedFacilityFactorBits:'3F800000';convertedQuantity:number;difficultyWord:0|2;
 cityVirtualObserved:boolean;cityVirtualEax:0|1|null;superApplied:boolean;returnedQuantity:number;
};
export type Kernels = [
 {api:'calculateProductionPrice';input:PriceInput;output:PriceOutput},
 {api:'calculateProductionQuantity';input:QuantityInput;output:QuantityOutput}
];
export type ProductionCalculation = {
 observationKind:'derived-adapter-observations';selectedOfficerIds:Id[];
 securityKernelReturn:null;quantityKernelReturn:number;quantityPreCapacity:number;
 priceKernelReturn:number;timeKernelReturn:null;facilityApplied:false;
 earlyCharmSum:null;moraleSecuritySnapshot:null;newRecruitMorale:null;
 securityWrite:null;troopWrite:null;inventoryWrite:DomesticWrite;moraleWrite:null;kernels:Kernels;
};
export type DomesticFees = {gold:DomesticWrite;actionPoints:DomesticWrite;sourceApRequest:20;effectiveApCost:20};
export type DomesticReward = {officerId:Id;attribute:'intelligence';xp:DomesticWrite;merit:DomesticWrite};
export type ProductionAudit = {
 calculation:ProductionCalculation;fees:DomesticFees;rewards:DomesticReward[];
 events:[{type:'command-committed';subjectId:Id}];
 sideEffectsNotModeled:['technique-points','native-stat-growth','native-writer-semantics',
 'native-personnel-tasks','native-corps-effects','presentation-rng'];rngDraws:0;
};

export type StartCommand = {type:'StartForgeDevelopment';cityId:Id;lotId:Id;facilityId:Id;officerIds:Id[]};
export type ProduceCommand = {type:'Produce';cityId:Id;facilityId:Id;officerIds:Id[];equipmentType:ProduceEquipment};
export type AdvanceCommand = {type:'AdvanceSharedFacilityTurn'};
export type Command = StartCommand|ProduceCommand|AdvanceCommand;
export type Envelope = {id:Id;expectedRevision:number;command:Command};
export type UnitCheck = {unitId:Id;forceId:Id;position:Position;hostile:boolean;distance:number;blocks:boolean};
export type StartReservations = {
 officers:{officerId:Id;jobBefore:null;jobAfter:JobId;actedBefore:Marker;actedAfter:number}[];
 facility:{facilityId:Id;jobBefore:null;jobAfter:JobId};
 lot:{lotId:Id;occupantBefore:null;occupantAfter:Id};
};
export type StartDetail = {job:Job;createdFacility:FacilityRow;unitChecks:UnitCheck[];reservations:StartReservations};
export type ProgressAudit = {jobId:JobId;remainingBefore:number;remainingAfter:number;workBefore:number;workAfter:number};
export type TickDetail = {apRecovery:ConstructionWrite;progress:ProgressAudit[];completions:Completion[]};
export type ReceiptCommon = {
 envelope:Envelope;revisionBefore:number;revisionAfter:number;policyDigest:Digest;
 catalogDigests:{production:Digest;construction:Digest};clockBefore:Clock;clockAfter:Clock;
 currentDigestBefore:Digest;currentDigestAfter:Digest;
 ownerSnapshot:{activeForceId:Id;ownerForceId:Id;corpsId:Id;corpsForceId:Id};
 scope:'bounded-shared-forge-development-production';rngDraws:0;
 techniquePointScope:'genesis-plus-construction-completion-only';
 ordinaryTechniquePoints:'not-modeled';nativeIntegration:false;
};
export type Receipt = ReceiptCommon & (
 {kind:'forge-start';detail:StartDetail} |
 {kind:'production';detail:{audit:ProductionAudit}} |
 {kind:'tick';detail:TickDetail}
);
export type State = {
 tag:'san11-bounded-forge-development-production-state-v1';schemaVersion:1;
 profile:'bounded-forge-development-production-v1';genesis:Scenario;revision:number;
 current:Current;acceptedCommands:{envelope:Envelope;receipt:Receipt}[];
};
export type Stage = 'input'|'rebuild'|'deduplication'|'revision'|'domain'|'construction'
 |'domestic'|'reservation'|'tick'|'invariant'|'budget'|'comparison';
export type Reason =
 'invalid-data'|'invalid-json'|'duplicate-json-key'|'invalid-fields'|'invalid-number'
 |'invalid-id'|'invalid-date'|'invalid-array'|'invalid-prototype'|'duplicate-entity-id'
 |'unsupported-schema'|'unsupported-profile'|'unsupported-policy'|'unsupported-catalog'
 |'unsupported-command'|'unsupported-city-kind'|'unsupported-equipment'|'unsupported-skill'
 |'unsupported-external-state'|'owner-corps-mismatch'|'officer-city-force-mismatch'
 |'facility-not-present'|'incomplete-field-unit-snapshot'|'owner-marked-hostile'
 |'invalid-marker'|'invalid-officer-count'|'invalid-lot-layout'
 |'command-id-conflict'|'stale-revision'|'history-limit'
 |'unknown-city'|'unknown-officer'|'unknown-facility'|'unknown-lot'|'occupied-lot'
 |'facility-id-reused'|'officer-unavailable'|'officer-already-acted'
 |'officer-reserved-by-job'|'facility-reserved-by-job'|'facility-incomplete'
 |'wrong-facility-kind'|'facility-used-this-turn'|'equipment-locked'
 |'insufficient-gold'|'insufficient-action-points'|'hostile-within-two'
 |'kernel-rejected'|'writer-cap-overflow'|'zero-yield'|'insufficient-balance'
 |'unsupported-construction-rate'|'nonpositive-construction-rate'|'invalid-duration'
 |'job-history-limit'|'completion-horizon-exceeded'|'completion-history-slots'
 |'advance-limit-reached'|'facility-reservation-mismatch'|'officer-reservation-mismatch'
 |'completion-timing-mismatch'|'incomplete-work'
 |'state-recomputation-mismatch'|'history-recomputation-mismatch'
 |'receipt-recomputation-mismatch'|'duplicate-accepted-entry'|'unexpected-reducer-effect'
 |'invariant-mismatch'|'budget-exceeded'|'trace-outcome-mismatch'|'trace-final-mismatch';
export type Failure = {ok:false;committed:false;stage:Stage;reason:Reason;
 blockingUnitId:Id|null;officerId:Id|null;facilityId:Id|null;jobId:JobId|null};
export type CreateOrLoadResult = Failure|{ok:true;state:State};
export type InspectResult = Failure|{ok:true;revision:number;current:Current;
 remainingHistorySlots:number;remainingAdvances:number;reservedCompletionSlots:number;
 scope:'bounded-shared-forge-development-production'};
export type ExecuteResult = Failure|{ok:true;committed:boolean;duplicate:boolean;state:State;receipt:Receipt};
export type PreviewResult = Failure|{ok:true;committed:false;duplicate:boolean;baseRevision:number;
 projectedCurrent:Current;receipt:Receipt};
export type SaveEnvelope = {tag:'san11-bounded-forge-development-production-save-v1';state:State};
export type SaveResult = Failure|{ok:true;serialized:string};
export type ReplayOutcome = Failure|{ok:true;duplicate:boolean;receipt:Receipt};
export type Trace = {tag:'san11-bounded-forge-development-production-trace-v1';scenario:Scenario;
 attempts:{envelope:Envelope;expected:ReplayOutcome|null}[];expectedFinalState:State|null};
export type ReplayResult = {ok:true;state:State;outcomes:ReplayOutcome[]}
 |(Failure&{index:number|null;state:null});
