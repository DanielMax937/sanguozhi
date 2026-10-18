/** Private merchant DTOs. All imports are erased; the legacy wrapper owns runtime JSON snapshots. */
import type policyData from '../../../../data/catalogs/city-merchant-policies-v1.json';
import type catalogData from '../../../../data/catalogs/city-merchant-politics-v1.json';

export type DeepRO<T> = T extends object ? { readonly [K in keyof T]: DeepRO<T[K]> } : T;
export type InstantContext = { commandId: string; turn: number };
export type Position = { q: number; r: number };
export type UiPrice = 3 | 4 | 5 | 6 | 7;
export type Corps = { id: string; forceId: string; actionPoints: number };
export type City = { id: string; kind: 'city'; ownerForceId: string; position: Position; gold: number; goldCapacity: number; food: number; foodCapacity: number; merchantPresent: boolean; uiTradePrice: UiPrice; merchantUsedTurn: number | null };
export type Officer = { id: string; forceId: string; cityId: string; available: boolean; politics: number; politicsXp: number; actedTurn: number | null };
export type FieldUnit = { id: string; forceId: string; position: Position };
export type Policies = typeof policyData.common & { apRecovery: typeof policyData.apRecoveryPolicies[number] };
export type Catalog = typeof catalogData;
export type Fraction = { numerator: string; denominator: string };
export type Write = { resource: 'gold' | 'food'; before: number; requested: number; actualDelta: number; after: number; cap: number; discarded: 0; policyId: string };
export type UnitCheck = { unitId: string; forceId: string; position: Position; hostile: boolean; distance: number; blocks: boolean };
export type Effect = { politics: number; lowerPolitics: number; upperPolitics: number; lowerEffectMillionths: number; upperEffectMillionths: number; fraction: Fraction; interpolationPolicyId: string };
export type TradeDetail = {
  officerId: string; direction: 'buy' | 'sell'; priceScale: 'ui-food-per-gold'; uiTradePrice: UiPrice;
  foodRequested: number; foodTransferred: number; politicsEffect: Effect; sellFactor: Fraction;
  exactGold: Fraction; rounding: 'ceil' | 'floor'; divisionRemainder: string; roundingDifference: Fraction; settledGold: number;
  eligibility: { merchantPresent: true; cityUsedBefore: number | null; actorActedBefore: number | null; actorAvailable: true; completeSuppliedFieldUnits: true; unitChecks: UnitCheck[] };
  merchantUsedTurnAfter: number; actorActedTurnAfter: number; writes: Write[];
  merchantCounterparty: { goldDelta: number; foodDelta: number; balanceMode: 'external-untracked' };
  politicsXp: { before: number; requested: 5; actualDelta: number; after: number; cap: 1000000000; discarded: number; politicsBefore: number; politicsAfter: number };
};

export type MerchantCommonPolicies = Pick<Policies,
  'ownership' | 'eligibility' | 'hostility' | 'pricing' | 'zeroSale' | 'capacity' | 'rewards'>;
export type MerchantTradeFrame = {
  activeForceId: string; hostileForceIds: string[];
  corps: Corps; city: City; officers: Officer[];
  completeFieldUnits: true; fieldUnits: FieldUnit[];
  policies: MerchantCommonPolicies; catalog: Catalog;
};
export type MerchantTradeAction = { type: 'BuyFood' | 'SellFood'; cityId: string; officerId: string; foodAmount: number };
export type MerchantTradeAudit = {
  ownerSnapshot: { activeForceId: string; ownerForceId: string; corpsId: string; corpsForceId: string };
  actionPoints: { before: number; requestedDelta: number; actualDelta: number; after: number; cap: 255; policyId: string };
  fixedGoldFee: 0; meritDelta: 0; techniquePointsDelta: 0; loyaltyDelta: 0; rngDraws: 0;
  trade: TradeDetail;
};
export type MerchantReason = 'city-mismatch' | 'unsupported-city-kind' | 'owner-corps-mismatch' |
  'merchant-absent' | 'city-merchant-already-used' | 'officer-not-found' |
  'officer-city-force-mismatch' | 'officer-unavailable' | 'officer-already-acted' |
  'invalid-number' | 'unsupported-politics' | 'invalid-rational' | 'insufficient-action-points' |
  'zero-value-sale' | 'gold-amount-out-of-range' | 'insufficient-gold' |
  'food-capacity-exceeded' | 'insufficient-food' | 'gold-capacity-exceeded';
export type MerchantReject =
  | { ok: false; reason: MerchantReason; blockingUnitId: null }
  | { ok: false; reason: 'hostile-within-two'; blockingUnitId: string };
export type MerchantResult = MerchantReject | { ok: true; candidate: MerchantTradeFrame; audit: MerchantTradeAudit };
