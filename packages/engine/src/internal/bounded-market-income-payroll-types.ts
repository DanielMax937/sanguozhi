/** Closed market owner DTOs. No caller-controlled audit bags or nested service state. */
import type { CONSTRUCTION_CATALOG, OFFICES_CATALOG, ROOT_POLICY } from './bounded-market-income-payroll-data.ts';
export type ConstructionCatalog = typeof CONSTRUCTION_CATALOG;
export type OfficesCatalog = typeof OFFICES_CATALOG;
export type ConstructionPolicy = typeof ROOT_POLICY.construction;
export type DeepReadonly<T> = T extends object ? {readonly [K in keyof T]:DeepReadonly<T[K]>}:T;
export type Id=string; export type JobId=string; export type Digest=string; export type Blob=string;
export type Marker=number|null;
export type Thirty<T>=[T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T,T];
export type DateV1={year:number;month:number;day:1|11|21};
export type Position={q:number;r:number};
export type Clock={date:DateV1;turn:number;advancedCount:number};
export type Progress={leadershipXp:number;charmXp:number;intelligenceXp:number;
 politicsXp:number;warXp:number;merit:number;actedTurn:Marker};
export type OfficerFacts={id:Id;forceId:Id;cityId:Id;role:'ordinary-officer';
 officeId:number;politics:number;available:boolean;incomeSkills:[];initial:Progress};
export type Lot={id:Id;cityId:Id;position:Position};
export type ExistingMarket={id:Id;lotId:Id;cityId:Id;kind:'market';level:1;complete:true};
export type Unit={id:Id;forceId:Id;position:Position};
export type SourceBinding={path:string;gitBlobSha1:Blob;sha256:Digest};
export type SourceBindings={constructionPolicy:SourceBinding;constructionCatalog:SourceBinding;
 offices:SourceBinding;financePolicy:SourceBinding;financeFacilities:SourceBinding;
 moneySource:SourceBinding;rateSource:SourceBinding};
export type SourceBoundary={level:'source-kernels-with-provisional-owner';
 adapterObservationKind:'derived-adapter-observations';
 ownership:'provisional-engine-rule';scheduling:'provisional-engine-rule';
 writers:'provisional-engine-rule';reserve:'provisional-engine-rule';
 nativeExecution:false;stockVerified:false;nativeFullFinance:false;
 nativePayrollConsequences:false;nativeScheduler:false;nativeHp:false};
export type Scenario={schemaVersion:1;profile:'bounded-market-income-payroll-v1';episodeId:Id;
 clock:{date:DateV1;turn:number};advanceLimit:number;activeForceId:Id;
 force:{id:Id;initialTechniquePoints:number};
 corps:{id:Id;forceId:Id;initialActionPoints:number};
 city:{id:Id;kind:'city';ownerForceId:Id;position:Position;
 goldCapacity:number;initialGold:number;security:number};
 completeResidentRoster:true;prisonerCount:0;officers:OfficerFacts[];
 lots:Lot[];facilities:ExistingMarket[];facilityLotSlots:Thirty<Id|null>;
 baseMoneyWord:number;difficulty:'normal';controller:'player'|'ai';
 constructionEnvironment:{completeFieldUnits:true;hostileForceIds:Id[];fieldUnits:Unit[]};
 constructionCatalog:ConstructionCatalog;officesCatalog:OfficesCatalog;
 policy:Policy;sourceBindings:SourceBindings};

export type FinancePolicies=typeof ROOT_POLICY.finance;
export type ReservePolicy={id:'remaining-window-salary-reserve-v1';
 count:'floor((dayOffset+remainingAdvances)/3)';
 requirement:'gold>=monthStarts*monthlySalary';
 start:'gold-200>=required';borrowFutureIncome:false;
 prepaid:false;separateWallet:false;nativeRuleVerified:false};
export type Policy={id:'bounded-market-income-payroll-v1';version:1;
 clock:'root-completion-income-payroll-v1';
 ownership:'fixed-supplied-city-corps-force-v1';
 transaction:'one-command-all-or-nothing-v1';
 reservation:'root-bidirectional-market-lock-v1';
 externalFacts:'fixed-for-entire-bounded-episode-v1';
 security:'fixed-no-seasonal-loss-v1';incomeSkills:'none';food:'not-modeled';
 payrollIdentity:'complete-fixed-ordinary-roster-v1';
 reserve:ReservePolicy;construction:ConstructionPolicy;finance:FinancePolicies;
 budgets:{acceptedCommands:13;traceAttempts:32;maxJobs:1;maxAdvances:12;
 maxOfficers:8;maxLots:2;maxFacilities:2;maxFieldUnits:16;maxHostileForces:16;
 maxUtf8Bytes:8388608;maxNodes:250000;maxDepth:48;maxArray:4096;maxObjectKeys:128}};

export type RateInput={profile:'domestic-construction-rate-stable-v1';politics:number[];facilityDurability:500};
export type RateEvidence={slotsAndStablePolitics:['005BB1E0..005BB213'];
 politicsHalfAndAdd:['005BB23E..005BB247'];
 stableFacilityReads:['005BB223','005BB22A','005BB237','005BB249','005BB26C','005BB279','005BB27E'];
 durabilityMinimum:['005BB249..005BB266','005BB26C..005BB29E'];
 selectAndReturn:['005BB268..005BB2AA'];excludedMod:['*005BB263..*008A9DFD']};
export type RateReceipt={supported:true;profile:'domestic-construction-rate-stable-v1';
 politics:[number|null,number|null,number|null];facilityDurability:500;
 politicsSum:number;maxPolitics:number;halfPoliticsSum:number;politicsRate:number;
 durabilityQuarter:125;durabilityRemainder:375;durabilityMinimum:41;
 rate:number;selectedBranch:'politics'|'durability-minimum';evidence:RateEvidence};
export type ConstructionWritePolicyId='facility-exact-debit-saturating-reward-v1'
 |'facility-community-rewards-v1'|'facility-ap20-cap255-v1';
export type ConstructionWrite={before:number;requestedDelta:number;actualDelta:number;
 after:number;cap:number;discarded:number;policyId:ConstructionWritePolicyId};
export type OfficerRow=Progress & {id:Id;politics:number;reservationJobId:JobId|null};
export type FacilityRow={id:Id;lotId:Id;cityId:Id;kind:'market';targetLevel:1;typeId:31;
 status:'developing'|'complete';effectiveLevel:0|1;jobId:JobId|null};
export type Ledger={gold:number;goldCapacity:number;actionPoints:number;security:number;
 force:{techniquePoints:number};officers:OfficerRow[];facilities:FacilityRow[]};
export type ConstructionReward={officerId:Id;politicsXp:ConstructionWrite;merit:ConstructionWrite;
 politicsBefore:number;politicsAfter:number};
export type Completion={jobId:JobId;facilityId:Id;typeId:31;level:1;effectiveLevel:1;
 techniquePoints:ConstructionWrite;rewards:ConstructionReward[];releasedOfficerIds:Id[];
 policyId:'next-boundary-capped-work-v1'};
export type StartSnapshot={clock:{date:DateV1;turn:number};activeForceId:Id;corpsId:Id;cityId:Id;
 lot:Lot;officers:{id:Id;politics:number}[];policyDigest:Digest;constructionCatalogDigest:Digest};
export type ConstructionFees={actionPoints:ConstructionWrite;gold:ConstructionWrite};
export type Work={initial:125;current:number;required:500;perAdvance:number;rate:RateReceipt};
export type Job={id:JobId;kind:'development';facilityKind:'market';cityId:Id;lotId:Id;facilityId:Id;
 fromLevel:0;targetLevel:1;officerIds:Id[];politics:number[];startTurn:number;startDate:DateV1;
 dueTurn:number;dueDate:DateV1;durationTurns:number;remainingTurns:number;work:Work;
 startSnapshot:StartSnapshot;rateInput:RateInput;fees:ConstructionFees;
 completedTurn:Marker;completion:Completion|null};
export type Current={clock:Clock;ledger:Ledger;jobs:Job[]};
export type Reserve={monthlySalary:number;remainingAdvances:number;monthStarts:number;
 required:number;gold:number;spendableGold:number};

export type MoneySlot=null|{facilityTypeWord:31;constructionWord:0}
 |{facilityTypeWord:31;constructionWord:1;adjacentMint:false};
export type MoneyTypeRows={31:{valid:true;moneyYieldWord:100};50:{valid:true;moneyYieldWord:120};
 51:{valid:true;moneyYieldWord:150};46:{valid:true;moneyYieldWord:300};
 47:{valid:true;moneyYieldWord:200};48:{valid:true;moneyYieldWord:80}};
export type MoneyInput={profile:'city-money-income-stable-resolved-i32-safe-v1';
 baseMoneyWord:number;slots:Thirty<MoneySlot>;resolvedTypeRows:MoneyTypeRows;
 difficultyWord:1;securityByte:number};
export type MoneyEvidence={level:'source-listing-reconstruction';
 profile:'city-money-income-stable-resolved-i32-safe-v1';
 source:'docs/sources/city-money-income-projection.json';
 originalRange:'0049E590 <= PC < 0049E745';fullCallerBytesVerified:true;
 entryGatesIntegrated:false;stableResolvedInputsRequired:true;stockOriginalVerified:false;
 originalExecutableExecuted:false;nativeHelpersReconstructed:false;abiVerified:false;
 realTraceReachabilityVerified:false;typeTableStockVerified:false;adjacencyHelperRecovered:false;
 rngRecovered:false;monthlySchedulerIntegrated:false;incomeWriterIntegrated:false;
 commandIntegrated:false;modBehaviorIncluded:false};
export type MoneySlotReceipt={index:number;facilityTypeWord:31|null;effectiveType:31|null;
 status:'invalid-slot'|'unfinished'|'yield';moneyYieldWord:100|null;
 mintApplied:false;contribution:0|100};
export type MoneyIntermediates={scaledRaw:number;difficultyProduct:null;difficultyAdjusted:number;
 securityProduct:number;securityAdjusted:number};
export type MoneyResult={supported:true;profile:'city-money-income-stable-resolved-i32-safe-v1';
 baseMoneyWord:number;difficultyWord:1;securityByte:number;slots:Thirty<MoneySlotReceipt>;
 rawMoney:number;difficultyPercent:100;effectiveSecurity:number;
 intermediates:MoneyIntermediates;returnedIncome:number;evidence:MoneyEvidence};
export type MoneyKernelCall={status:'called';api:'calculateCityMoneyIncomeProjection';
 profile:'city-money-income-stable-resolved-i32-safe-v1';
 adapterObservationKind:'derived-adapter-observations';input:MoneyInput;result:MoneyResult};
export type MoneyKernelNotDue={status:'not-due';reason:'nonmonthly-without-taxation'};
export type GoldWrite={resource:'gold';reason:'money-base'|'salary';before:number;requested:number;
 accepted:number;actualDelta:number;after:number;cap:number;discarded:number;
 writerPolicyId:'saturating-positive-credit-v1'|'exact-affordable-salary-debit-v1'};
export type SalaryItem={officerId:Id;officeId:number;officeName:string;catalogSalary:number};
export type Salary={items:SalaryItem[];sum:number;shortfall:0;
 payerPolicyId:'complete-named-office-payroll-v1'} & (
 {status:'paid';availableBeforeSalary:number;paid:number} |
 {status:'not-due';availableBeforeSalary:null;paid:0});
export type MonthlyReceipt={securityBeforeIncome:number;payerCityId:Id;
 payrollOfficerIds:Id[];incomeEffects:{taxation:false;wealthy:false}} & (
 {status:'not-due';settlement:null;facilityIds:null;moneyKernel:MoneyKernelNotDue;
 writes:[];salary:Salary & {status:'not-due'}} |
 {status:'settled';settlement:{cityId:Id;year:number;month:number};
 facilityIds:Thirty<Id|null>;moneyKernel:MoneyKernelCall;
 writes:[GoldWrite,GoldWrite];salary:Salary & {status:'paid'}});
export type StartCommand={type:'StartMarketDevelopment';cityId:Id;lotId:Id;facilityId:Id;officerIds:Id[]};
export type AdvanceCommand={type:'AdvanceSharedMarketTurn'};
export type Command=StartCommand|AdvanceCommand;
export type Envelope={id:Id;expectedRevision:number;command:Command};
export type UnitCheck={unitId:Id;forceId:Id;position:Position;hostile:boolean;distance:number;blocks:boolean};
export type StartReservations={officers:{officerId:Id;jobBefore:null;jobAfter:JobId;
 actedBefore:Marker;actedAfter:number}[];facility:{facilityId:Id;jobBefore:null;jobAfter:JobId};
 lot:{lotId:Id;occupantBefore:null;occupantAfter:Id}};
export type StartDetail={job:Job;createdFacility:FacilityRow;unitChecks:UnitCheck[];reservations:StartReservations};
export type ProgressAudit={jobId:JobId;remainingBefore:number;remainingAfter:number;workBefore:number;workAfter:number};
export type TickDetail={apRecovery:ConstructionWrite;progress:ProgressAudit[];
 completions:Completion[];monthly:MonthlyReceipt};
export type CatalogDigests={construction:Digest;offices:Digest};
export type ReceiptCommon={envelope:Envelope;revisionBefore:number;revisionAfter:number;
 policyDigest:Digest;catalogDigests:CatalogDigests;sourceDigest:Digest;
 sourceBoundary:SourceBoundary;clockBefore:Clock;clockAfter:Clock;
 currentDigestBefore:Digest;currentDigestAfter:Digest;
 ownerSnapshot:{activeForceId:Id;ownerForceId:Id;corpsId:Id;corpsForceId:Id};
 reserveBefore:Reserve;reserveAfter:Reserve;
 scope:'bounded-shared-market-income-payroll';rngDraws:0;nativeIntegration:false};
export type Receipt=ReceiptCommon & ({kind:'market-start';detail:StartDetail}|{kind:'tick';detail:TickDetail});
export type State={tag:'san11-bounded-market-income-payroll-state-v1';schemaVersion:1;
 profile:'bounded-market-income-payroll-v1';genesis:Scenario;revision:number;
 current:Current;acceptedCommands:{envelope:Envelope;receipt:Receipt}[]};
export type Proposal={required:number;available:number;shortfall:number};
export type MoneyKernelReason='invalid-input'|'unexpected-field'|'unsupported-profile'
 |'missing-type-row'|'missing-adjacent-mint'|'unsupported-arithmetic-domain';
export type Stage='input'|'rebuild'|'deduplication'|'revision'|'domain'|'construction'
 |'reservation'|'tick'|'money'|'payroll'|'invariant'|'budget'|'comparison';
export type Reason='invalid-data'|'invalid-json'|'duplicate-json-key'|'invalid-fields'|'invalid-number'
 |'invalid-id'|'invalid-date'|'invalid-array'|'invalid-prototype'|'duplicate-entity-id'
 |'unsupported-schema'|'unsupported-profile'|'unsupported-policy'|'unsupported-catalog'
 |'unsupported-source'|'unsupported-command'|'unsupported-city-kind'|'unsupported-difficulty'
 |'unsupported-controller'|'unsupported-income-skill'|'unsupported-prisoners'
 |'incomplete-payroll-roster'|'unsupported-payroll-identity'|'duplicate-office'
 |'owner-corps-mismatch'|'officer-city-force-mismatch'|'incomplete-field-unit-snapshot'
 |'owner-marked-hostile'|'invalid-marker'|'invalid-officer-count'|'invalid-lot-layout'
 |'invalid-facility-slots'|'calendar-overflow'|'turn-overflow'|'salary-reserve-shortfall'
 |'command-id-conflict'|'stale-revision'|'history-limit'|'unknown-city'|'unknown-officer'
 |'unknown-facility'|'unknown-lot'|'occupied-lot'|'facility-id-reused'|'officer-unavailable'
 |'officer-already-acted'|'officer-reserved-by-job'|'insufficient-gold'
 |'insufficient-action-points'|'hostile-within-two'|'unsupported-facility'
 |'unsupported-construction-rate'|'nonpositive-construction-rate'|'invalid-duration'
 |'job-history-limit'|'completion-horizon-exceeded'|'completion-history-slots'
 |'advance-limit-reached'|'facility-reservation-mismatch'|'officer-reservation-mismatch'
 |'completion-timing-mismatch'|'incomplete-work'|'insufficient-balance'
 |'money-kernel-rejected'|'unsupported-kernel-return'|'invalid-resource-boundary'
 |'unsupported-salary-shortfall'|'state-recomputation-mismatch'|'history-recomputation-mismatch'
 |'receipt-recomputation-mismatch'|'duplicate-accepted-entry'|'unexpected-phase-effect'
 |'invariant-mismatch'|'budget-exceeded'|'trace-outcome-mismatch'|'trace-final-mismatch';
export type Failure={ok:false;committed:false;stage:Stage;reason:Reason;
 blockingUnitId:Id|null;officerId:Id|null;facilityId:Id|null;jobId:JobId|null;
 proposal:Proposal|null;kernelReason:MoneyKernelReason|null;index:number|null};
export type CreateOrLoadResult=Failure|{ok:true;state:State};
export type InspectResult=Failure|{ok:true;revision:number;current:Current;reserve:Reserve;
 remainingHistorySlots:number;remainingAdvances:number;reservedCompletionSlots:number;
 scope:'bounded-shared-market-income-payroll'};
export type ExecuteResult=Failure|{ok:true;committed:boolean;duplicate:boolean;state:State;receipt:Receipt};
export type PreviewResult=Failure|{ok:true;committed:false;duplicate:boolean;baseRevision:number;
 projectedCurrent:Current;receipt:Receipt};
export type SaveEnvelope={tag:'san11-bounded-market-income-payroll-save-v1';state:State};
export type SaveResult=Failure|{ok:true;serialized:string};
export type ReplayOutcome=Failure|{ok:true;duplicate:boolean;receipt:Receipt};
export type Trace={tag:'san11-bounded-market-income-payroll-trace-v1';scenario:Scenario;
 attempts:{envelope:Envelope;expected:ReplayOutcome|null}[];expectedFinalState:State|null};
export type ReplayResult={ok:true;state:State;outcomes:ReplayOutcome[]}|(Failure & {state:null});
