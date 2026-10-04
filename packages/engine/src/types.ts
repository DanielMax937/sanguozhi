export type EvidenceLevel =
  | 'opcode-exact' | 'address-level' | 'reverse-engineered-partial'
  | 'empirical-high' | 'documented-guide' | 'compatibility-assumption'
  | 'compatibility-reconstruction' | 'provisional-engine-rule' | 'open';
export interface RuleEvidence {
  id: string;
  level: EvidenceLevel;
  target: string;
  originalEvidence: string;
  source: { repository: string; commit: string | null; path: string; section: string;
    url: string | null; originalUrls: string[]; introducedWith?: string };
  note: string;
  value: unknown;
}
export interface RuleUse { evidence: RuleEvidence; detail: string }
export interface Ruleset {
  id: 'pk-training-lifecycle-v2';
  rulesetVersion: 'pk';
  patchVersion: '1.1';
  fixProfile: 'original';
  gateProfile: string;
  apProfile: 'single-first-corps-c9-v1';
  turnProfile: string;
  turnPhases: TurnPhase[];
  progressionProfile: string;
  progressionConfig: GrowthConfig;
  presentationProfile: 'omit-training-presentation-v1';
}
export interface GameDate { year: number; month: number; day: 1 | 11 | 21 }
export interface RngState { algorithm: string; seed: number; draws: number }
export interface RandomSource {
  id: string;
  next(state: Readonly<RngState>): { value: number; state: RngState };
}
export interface Officer {
  id: string; name: string; forceId: string; baseId: string;
  war: number; leadership: number; charisma: number; intelligence: number;
  /** Synthetic unmodified talent; WAR is the checked derived value. */
  warBase: number;
  /** Cumulative experience, not the UI remainder. Never subtract 100 on growth. */
  warXp: number; merit: number; acted: boolean;
  /** Independent dimensions, not a single fabricated lifecycle enum. */
  identity: 0 | 1 | 2 | 3 | 5;
  location: 'base' | 'away' | 'unit';
  onMission: boolean;
}
export interface Base {
  id: string; name: string; kind: 'city' | 'port' | 'gate';
  ownerForceId: string | null; corpsId: string | null; parentCityId: string | null;
  troops: number; morale: number; gold: number; trainingCompleted: boolean;
  facilities: { drillGround: 'none' | 'building' | 'complete';
    militaryOffice: 'none' | 'building' | 'complete'; completedTalismanPlatforms: number };
}
export interface GameState {
  schemaVersion: 2;
  scope: 'synthetic-training-sandbox';
  originProfile: 'native-v2' | 'legacy-v1-state';
  ruleset: Ruleset;
  date: GameDate;
  turn: number;
  revision: number;
  force: { id: string; rulerId: string; adviserId: string | null; techniqueIds: number[]; techniquePoints: number };
  corps: { id: string; forceId: string; isFirst: true; actionPoints: number };
  bases: Base[];
  officers: Officer[];
  rng: RngState;
}
export type Command = { type: 'Train'; baseId: string; officerIds: string[] } | { type: 'EndTurn' };
export interface TrainingCalculation {
  denominator: number; warSum: number; warMax: number; baseGain: number;
  drillApplied: boolean; gainBeforeCap: number; moraleCap: number;
  actualGain: number; techniquePointsBeforeCap: number; apCost: number;
}
export interface ApCalculation {
  leaderParam: number; cityParam: number; officerParam: number; adviserPercent: number;
  countedBases: { baseId: string; count: number }[];
  coreRecovery: number; talismanBonus: number; recovery: number; actualRecovery: number;
}
export interface Calculation {
  training?: TrainingCalculation;
  ap?: ApCalculation;
  calendar?: { next: GameDate; monthBoundary: boolean; seasonBoundary: boolean; yearBoundary: boolean };
  progression?: GrowthCalculation[];
  turn?: { phases: TurnPhase[]; resetBaseIds: string[]; resetOfficerIds: string[] };
}
export interface Preview {
  ok: boolean; reasons: string[]; calculation: Calculation; evidence: RuleUse[];
  rngDraws: 0;
}
export interface CommandResult extends Preview { state: GameState }
export interface TraceEntry extends Preview {
  command: Command;
  before: GameState;
  after: GameState;
}
export interface Session {
  saveVersion: 2;
  engineVersion: 'training-kernel-v2';
  initialState: GameState;
  state: GameState;
  trace: TraceEntry[];
}
export interface TrainingGate {
  id: string;
  evidence: RuleEvidence;
  evaluate(state: Readonly<GameState>, base: Readonly<Base>, officers: readonly Readonly<Officer>[]): string[];
}
export interface GrowthConfig {
  experiencePerPoint: number; experienceCap: number; statMin: number; statMax: number;
}
export interface GrowthCalculation {
  officerId: string; xpBefore: number; requestedXp: number; creditedXp: number; xpAfter: number;
  remainderBefore: number; remainderAfter: number; displayProgressBefore: number; displayProgressAfter: number; earnedPointsBefore: number; earnedPointsAfter: number;
  warBefore: number; warAfter: number; actualStatGain: number; xpAtCap: boolean; statAtCap: boolean;
}
export type TurnPhase = 'advance-date' | 'recover-ap' | 'reset-base-training' | 'reset-officer-actions';
export interface GrowthPolicy { id: string; evidence: RuleEvidence; config: GrowthConfig }
export interface TurnPolicy { id: string; evidence: RuleEvidence; phases: TurnPhase[] }
export interface EngineAdapters { gate: TrainingGate; random: RandomSource; growth: GrowthPolicy; turn: TurnPolicy }
