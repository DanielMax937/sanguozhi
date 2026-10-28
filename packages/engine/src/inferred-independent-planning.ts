/** Opt-in pure planning. No world, finalizer, clock, random source, or resource writer. */
const nat = (v: unknown, max = 2147483647): v is number => typeof v === 'number' && Number.isInteger(v) && !Object.is(v, -0) && v >= 0 && v <= max;
const bad = () => Object.freeze({ ok: false as const, reason: 'invalid-input-or-eligibility' });

export function projectInferredTreasureLoyalty(trueLoyalty: number, itemValue: number, eligibleOrdinaryGrant: boolean) {
  if (!nat(trueLoyalty, 255) || !nat(itemValue, 255) || eligibleOrdinaryGrant !== true) return bad();
  const requestedGain = itemValue, projectedTrueLoyalty = Math.min(255, trueLoyalty + requestedGain);
  return Object.freeze({ ok: true as const, policyId: 'empirical-value-treasure-loyalty-request-v1',
    evidence: 'empirical-candidate-not-opcode-exact', requestedGain, appliedProjection: projectedTrueLoyalty - trueLoyalty,
    projectedTrueLoyalty, projectedDisplayLoyalty: Math.min(100, projectedTrueLoyalty), actionPointsRequest: 10,
    goldRequest: 0, worldEffectsApplied: false as const });
}

export function projectDamRecoveryRequest(facilityType: number, constructionState: number, maximumDurability: number) {
  if (!nat(facilityType, 255) || !nat(constructionState, 1) || !nat(maximumDurability, 65535)) return bad();
  const eligible = facilityType === 0x18 && constructionState === 0;
  return Object.freeze({ ok: true as const, policyId: 'listed-dam-max-tenth-request-v1', evidence: 'public-listing-scalar',
    eligible, requestedRecovery: eligible ? Math.floor(maximumDurability / 10) : 0,
    actualRecovery: null, completionOrOwnershipChangeApplied: false as const, worldEffectsApplied: false as const });
}

const AP = Object.freeze({
  train: [20, 'military', 'known'], search: [20, 'talent', 'known'], recruitOfficer: [20, 'talent', 'known'],
  recruitTroops: [20, 'none', 'known'], produce: [20, 'none', 'known'], praise: [5, 'none', 'known'],
  grantTreasure: [10, 'none', 'known'], moveOfficer: [20, 'none', 'known'], summonOfficer: [20, 'none', 'known'],
  patrol: [20, 'none', 'existing-service'], trade: [20, 'none', 'existing-service'], mergeFacility: [10, 'none', 'known'],
  deploy: [20, 'military', 'inferred-base'], transport: [20, 'military', 'inferred-base'],
  confiscateTreasure: [10, 'none', 'inferred-base'], otherDomestic: [20, 'none', 'inferred-base'],
  otherDiplomacy: [20, 'diplomacy', 'inferred-base'], otherCityStrategy: [20, 'strategy', 'inferred-base'],
  rumor: [30, 'strategy', 'known']
} as const);
export function projectInferredCommandAP(command: string, hasRelevantOffice: boolean, targetCount = 1) {
  if (typeof command !== 'string' || !Object.hasOwn(AP, command) || typeof hasRelevantOffice !== 'boolean' || !nat(targetCount, 4096) || targetCount === 0) return bad();
  const [base, office, evidence] = AP[command as keyof typeof AP];
  if (command !== 'praise' && targetCount !== 1) return bad();
  const multiplier = command === 'praise' ? targetCount : 1;
  const reductionApplied = office !== 'none' && hasRelevantOffice;
  return Object.freeze({ ok: true as const, policyId: 'explicit-city-command-ap-planning-v1', command, evidence,
    office, reductionApplied, basePerCommandOrPerson: base, targetCount,
    requestedAP: (reductionApplied ? Math.floor(base / 2) : base) * multiplier,
    affordabilityChecked: false as const, commandEnabled: false as const, worldEffectsApplied: false as const });
}

type SupplySource = { id: string; troops: number; money: number; food: number; equipment: readonly number[] };
type SupplyTarget = { id: string; foodTurnsRemaining: number; troopsDeficit: number; moneyDeficit: number; foodDeficit: number; equipmentId: number; eligibleSameOwnerAdjacentCombat: boolean };
const id = (v: unknown): v is string => typeof v === 'string' && v !== 'food-consumed-sink' && /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(v);
/** Trusted plain-data input; deficits already include target capacity and equipment capacity. */
export function planInferredAutomaticSupply(source: SupplySource, targets: readonly SupplyTarget[]) {
  if (!source || typeof source !== 'object' || !id(source.id) || !nat(source.troops, 60000) || !nat(source.money, 100000) || !nat(source.food, 500000) || !Array.isArray(source.equipment) || source.equipment.length !== 12 || !source.equipment.every(v => nat(v)) || !Array.isArray(targets) || targets.length > 4096) return bad();
  for (let i = 0; i < 12; i++) if (!nat(source.equipment[i])) return bad();
  const seen = new Set<string>();
  for (const t of targets) {
    if (!t || typeof t !== 'object' || !id(t.id) || t.id === source.id || seen.has(t.id) || !nat(t.foodTurnsRemaining, 360) || !nat(t.troopsDeficit, 60000) || !nat(t.moneyDeficit, 10000) || !nat(t.foodDeficit, 50000) || !nat(t.equipmentId, 11) || t.eligibleSameOwnerAdjacentCombat !== true) return bad();
    seen.add(t.id);
  }
  // Lowest supplied food horizon first; ASCII IDs break ties without ambient locale.
  const sorted = [...targets].sort((a, b) => (a.foodDeficit === 0 ? 361 : a.foodTurnsRemaining) - (b.foodDeficit === 0 ? 361 : b.foodTurnsRemaining) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  let troops = source.troops, money = source.money, food = source.food;
  const equipment = [...source.equipment];
  const plans = sorted.map(t => {
    const matched = t.equipmentId >= 1 && t.equipmentId <= 4;
    const acceptedTroops = Math.min(t.troopsDeficit, troops, matched ? equipment[t.equipmentId]! : troops);
    const acceptedMoney = Math.min(t.moneyDeficit, money), acceptedFood = Math.min(t.foodDeficit, food);
    troops -= acceptedTroops; money -= acceptedMoney; food -= acceptedFood;
    if (matched) equipment[t.equipmentId] = equipment[t.equipmentId]! - acceptedTroops;
    return Object.freeze({ sourceId: source.id, targetId: t.id,
      relation: Object.freeze({ kind: 'supplied-adjacent' as const, sourceId: source.id, targetId: t.id }),
      requested: Object.freeze({ troops: acceptedTroops, money: acceptedMoney, food: acceptedFood }) });
  });
  return Object.freeze({ ok: true as const, policyId: 'inferred-food-horizon-priority-supply-plan-v1', evidence: 'explicit-design-inference',
    plans: Object.freeze(plans), sourceRemainingProjection: Object.freeze({ troops, money, food, equipment: Object.freeze(equipment) }),
    needsFreshConsumerValidation: true as const, sessionCommandsExecuted: false as const, worldEffectsApplied: false as const });
}
