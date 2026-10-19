/** Private three-command business logic; the owner retains all parsing, folding and publication. */
import { calculateConstructionDevelopment, calculateConstructionWrite } from './facility-construction-leaves.ts';
import { advanceConstructionWork, completeConstructionPhase } from './facility-construction-phases.ts';
import { reduceDomesticInstant } from './city-instant-reducer.ts';
import { stop } from './bounded-forge-core-errors.ts';
import { clone, same, digest, object, integer, literal, choice, jobId, array, advanceDate } from './bounded-forge-core-data.ts';
import type { DomesticInstantFrame, DomesticReason } from './city-service-types.ts';
import type { ForgeCoreFacts, ForgeCoreStartContext } from './bounded-forge-core-types.ts';
import type { Id, Clock, Lot, OfficerRow, Current, Ledger, ProduceCommand, StartCommand, Envelope, RateEvidence, RateReceipt, ConstructionWrite, DomesticWrite, PriceInput, PriceOutput, QuantitySlot, QuantityInput, QuantityOutput, ProductionCalculation, DomesticFees, DomesticReward, ProductionAudit, Reason, StartSnapshot, StartDetail, UnitCheck, StartReservations, FacilityRow, Job, Completion, ConstructionReward, TickDetail, ProgressAudit } from './bounded-forge-development-production-types.ts';

const MAX = 1_000_000_000;
const RATE_EVIDENCE: RateEvidence = {
  slotsAndStablePolitics: ['005BB1E0..005BB213'], politicsHalfAndAdd: ['005BB23E..005BB247'],
  stableFacilityReads: ['005BB223', '005BB22A', '005BB237', '005BB249', '005BB26C', '005BB279', '005BB27E'],
  durabilityMinimum: ['005BB249..005BB266', '005BB26C..005BB29E'], selectAndReturn: ['005BB268..005BB2AA'], excludedMod: ['*005BB263..*008A9DFD']
};
export function rateReceipt(value: unknown, politics: number[]): RateReceipt {
  const r = object(value, ['supported', 'profile', 'politics', 'facilityDurability', 'politicsSum', 'maxPolitics', 'halfPoliticsSum', 'politicsRate', 'durabilityQuarter', 'durabilityRemainder', 'durabilityMinimum', 'rate', 'selectedBranch', 'evidence']);
  literal(r.supported, true); literal(r.profile, 'domestic-construction-rate-stable-v1');
  const slots = array(r.politics, 3, 3); for (const slot of slots) if (slot !== null) integer(slot, 255);
  if (!same(slots, [politics[0] ?? null, politics[1] ?? null, politics[2] ?? null]) || !same(r.evidence, RATE_EVIDENCE)) stop('unexpected-reducer-effect');
  literal(r.facilityDurability, 800); integer(r.politicsSum, 765); integer(r.maxPolitics, 255); integer(r.halfPoliticsSum, 382); integer(r.politicsRate, 637);
  literal(r.durabilityQuarter, 200); literal(r.durabilityRemainder, 600); literal(r.durabilityMinimum, 66); integer(r.rate, 637, 66); choice(r.selectedBranch, ['politics', 'durability-minimum']);
  return clone(r) as unknown as RateReceipt;
}
export function constructionWrite(value: unknown): ConstructionWrite {
  const w = object(value, ['before', 'requestedDelta', 'actualDelta', 'after', 'cap', 'discarded', 'policyId']);
  const before = integer(w.before, MAX), requestedDelta = integer(w.requestedDelta, MAX, -MAX), actualDelta = integer(w.actualDelta, MAX, -MAX),
    after = integer(w.after, MAX), cap = integer(w.cap, MAX), discarded = integer(w.discarded, MAX),
    policyId = choice(w.policyId, ['facility-exact-debit-saturating-reward-v1', 'facility-community-rewards-v1', 'facility-ap20-cap255-v1'] as const);
  if (before > cap || after > cap || after !== before + actualDelta || discarded !== requestedDelta - actualDelta ||
    actualDelta !== (requestedDelta < 0 ? requestedDelta : Math.min(requestedDelta, cap - before))) stop('unexpected-reducer-effect');
  return { before, requestedDelta, actualDelta, after, cap, discarded, policyId };
}
function writeConstruction(before: number, delta: number, cap: number, policyId: string): ConstructionWrite {
  const result = calculateConstructionWrite(before, delta, cap, policyId); if (!result.ok) stop('insufficient-balance');
  const written = constructionWrite(result.write);
  if (written.before !== before || written.requestedDelta !== delta || written.cap !== cap || written.policyId !== policyId) stop('unexpected-reducer-effect');
  return written;
}
function domesticWrite(value: unknown): DomesticWrite {
  const w = object(value, ['before', 'requested', 'returned', 'actualDelta', 'after', 'cap', 'discarded', 'policyId']);
  const before = integer(w.before, MAX), requested = integer(w.requested, MAX, -MAX), returned = integer(w.returned, MAX, -MAX),
    actualDelta = integer(w.actualDelta, MAX, -MAX), after = integer(w.after, MAX), cap = integer(w.cap, MAX), discarded = integer(w.discarded, MAX, -MAX),
    policyId = choice(w.policyId, ['clip-and-return-actual-v1', 'saturating-accumulator-v1', 'exact-affordable-debit-v1'] as const);
  if (before > cap || after > cap || after !== before + actualDelta || returned !== actualDelta || discarded !== requested - actualDelta ||
    after !== Math.max(0, Math.min(cap, before + requested)) || (policyId === 'exact-affordable-debit-v1' && actualDelta !== requested)) stop('unexpected-reducer-effect');
  return { before, requested, returned, actualDelta, after, cap, discarded, policyId };
}
function expectDomesticWrite(value: unknown, before: number, requested: number, cap: number, policyId: DomesticWrite['policyId']): DomesticWrite {
  const w = domesticWrite(value); if (w.before !== before || w.requested !== requested || w.cap !== cap || w.policyId !== policyId) stop('unexpected-reducer-effect'); return w;
}
function productionAudit(value: unknown, s: ForgeCoreFacts, c: Current, action: ProduceCommand, commandId: Id): ProductionAudit {
  const a = object(value, ['calculation', 'fees', 'rewards', 'events', 'sideEffectsNotModeled', 'rngDraws']);
  const calc = object(a.calculation, ['observationKind', 'selectedOfficerIds', 'securityKernelReturn', 'quantityKernelReturn', 'quantityPreCapacity', 'priceKernelReturn', 'timeKernelReturn', 'facilityApplied', 'earlyCharmSum', 'moraleSecuritySnapshot', 'newRecruitMorale', 'securityWrite', 'troopWrite', 'inventoryWrite', 'moraleWrite', 'kernels']);
  literal(calc.observationKind, 'derived-adapter-observations'); if (!same(calc.selectedOfficerIds, action.officerIds)) stop('unexpected-reducer-effect');
  for (const key of ['securityKernelReturn', 'timeKernelReturn', 'earlyCharmSum', 'moraleSecuritySnapshot', 'newRecruitMorale', 'securityWrite', 'troopWrite', 'moraleWrite']) literal(calc[key], null);
  literal(calc.facilityApplied, false);
  const kernels = array(calc.kernels, 2, 2), priceKernel = object(kernels[0], ['api', 'input', 'output']), quantityKernel = object(kernels[1], ['api', 'input', 'output']);
  literal(priceKernel.api, 'calculateProductionPrice'); literal(quantityKernel.api, 'calculateProductionQuantity');
  const base = s.productionCatalog.entries[action.equipmentType].basePriceWord, specialty: 0 | 1 = s.domestic.specialtyEquipmentTypes.includes(action.equipmentType) ? 1 : 0;
  const priceInput: PriceInput = { profile: 'production-price-resolved-v1', savedBasePriceWord: base, specialtyHelperEax: specialty };
  if (!same(priceKernel.input, priceInput)) stop('unexpected-reducer-effect');
  const po = object(priceKernel.output, ['supported', 'profile', 'savedBasePriceWord', 'specialtyHelperEax', 'specialtyResultAl', 'discountApplied', 'returnedPrice']);
  const priceOutput: PriceOutput = { supported: literal(po.supported, true), profile: literal(po.profile, 'production-price-resolved-v1'),
    savedBasePriceWord: literal(po.savedBasePriceWord, base), specialtyHelperEax: literal(po.specialtyHelperEax, specialty), specialtyResultAl: literal(po.specialtyResultAl, specialty),
    discountApplied: literal(po.discountApplied, specialty === 1), returnedPrice: integer(po.returnedPrice, 65535) };
  const people = action.officerIds.map(oid => { const person = s.officers.find(o => o.id === oid); if (!person) stop('unexpected-reducer-effect'); return person; });
  const slotAt = (index: number): QuantitySlot => { const o = people[index]; return o ? { intelligenceGetterEax: o.intelligence, skillHelperEax: o.skillIds.includes(80) ? 1 : 0 } : null; };
  const slots: [QuantitySlot, QuantitySlot, QuantitySlot] = [slotAt(0), slotAt(1), slotAt(2)];
  const inputCommon = { profile: 'production-quantity-resolved-f32-v1' as const, nativeEquipmentType: action.equipmentType, slots, resolvedFacilityFactorBits: '3F800000' as const };
  const quantityInput: QuantityInput = s.domestic.difficulty === 'normal' ? { ...inputCommon, difficultyWord: 0 }
    : { ...inputCommon, difficultyWord: 2, cityVirtualEax: s.domestic.controller === 'player' ? 1 : 0 };
  if (!same(quantityKernel.input, quantityInput)) stop('unexpected-reducer-effect');
  const qo = object(quantityKernel.output, ['supported', 'profile', 'nativeEquipmentType', 'reason', 'resolvedInputsObserved', 'slots', 'validSlotCount', 'intelligenceSum', 'intelligenceMax', 'skillQueryId', 'skillApplied', 'baseQuantity', 'skillAdjustedQuantity', 'resolvedFacilityFactorBits', 'convertedQuantity', 'difficultyWord', 'cityVirtualObserved', 'cityVirtualEax', 'superApplied', 'returnedQuantity']);
  const outSlots = array(qo.slots, 3, 3); for (let i = 0; i < 3; i++) {
    const slot = slots[i];
    if (slot === null) literal(outSlots[i], null);
    else { const q = object(outSlots[i], ['intelligenceGetterEax', 'intelligenceAl', 'skillHelperEax']); literal(q.intelligenceGetterEax, slot!.intelligenceGetterEax); literal(q.intelligenceAl, slot!.intelligenceGetterEax); literal(q.skillHelperEax, slot!.skillHelperEax); }
  }
  literal(qo.supported, true); literal(qo.profile, 'production-quantity-resolved-f32-v1'); literal(qo.nativeEquipmentType, action.equipmentType);
  literal(qo.reason, 'resolved-quantity'); literal(qo.resolvedInputsObserved, true); literal(qo.validSlotCount, people.length);
  integer(qo.intelligenceSum, 765); integer(qo.intelligenceMax, 255); literal(qo.skillQueryId, 80); literal(qo.skillApplied, people.some(o => o.skillIds.includes(80)));
  integer(qo.baseQuantity, 6100, 1000); integer(qo.skillAdjustedQuantity, 12200, 1000); literal(qo.resolvedFacilityFactorBits, '3F800000'); integer(qo.convertedQuantity, 12200, 1000);
  literal(qo.difficultyWord, quantityInput.difficultyWord); literal(qo.cityVirtualObserved, quantityInput.difficultyWord === 2);
  literal(qo.cityVirtualEax, quantityInput.difficultyWord === 2 ? quantityInput.cityVirtualEax : null);
  literal(qo.superApplied, s.domestic.difficulty === 'super' && s.domestic.controller === 'ai'); const quantity = integer(qo.returnedQuantity, 24400, 1000);
  const quantityOutput = clone(qo) as unknown as QuantityOutput;
  literal(calc.quantityKernelReturn, quantity); literal(calc.quantityPreCapacity, quantity); literal(calc.priceKernelReturn, priceOutput.returnedPrice);
  const l = c.ledger, stock = l.inventory[action.equipmentType];
  const inventoryWrite = expectDomesticWrite(calc.inventoryWrite, stock.quantity, quantity, s.city.inventory[action.equipmentType].capacity, 'clip-and-return-actual-v1');
  const f = object(a.fees, ['gold', 'actionPoints', 'sourceApRequest', 'effectiveApCost']);
  const fees: DomesticFees = { gold: expectDomesticWrite(f.gold, l.gold, -priceOutput.returnedPrice || 0, MAX, 'exact-affordable-debit-v1'),
    actionPoints: expectDomesticWrite(f.actionPoints, l.actionPoints, -20, 255, 'exact-affordable-debit-v1'), sourceApRequest: literal(f.sourceApRequest, 20), effectiveApCost: literal(f.effectiveApCost, 20) };
  const rewards = array(a.rewards, people.length, people.length).map((value, i): DomesticReward => {
    const r = object(value, ['officerId', 'attribute', 'xp', 'merit']), o = l.officers.find(o => o.id === people[i]!.id); if (!o) stop('unexpected-reducer-effect');
    return { officerId: literal(r.officerId, o.id), attribute: literal(r.attribute, 'intelligence'),
      xp: expectDomesticWrite(r.xp, o.intelligenceXp, 2, MAX, 'saturating-accumulator-v1'), merit: expectDomesticWrite(r.merit, o.merit, 50, MAX, 'saturating-accumulator-v1') };
  });
  if (!same(a.events, [{ type: 'command-committed', subjectId: commandId }]) || !same(a.sideEffectsNotModeled, ['technique-points', 'native-stat-growth', 'native-writer-semantics', 'native-personnel-tasks', 'native-corps-effects', 'presentation-rng'])) stop('unexpected-reducer-effect'); literal(a.rngDraws, 0);
  const calculation: ProductionCalculation = { observationKind: 'derived-adapter-observations', selectedOfficerIds: [...action.officerIds], securityKernelReturn: null,
    quantityKernelReturn: quantity, quantityPreCapacity: quantity, priceKernelReturn: priceOutput.returnedPrice, timeKernelReturn: null, facilityApplied: false,
    earlyCharmSum: null, moraleSecuritySnapshot: null, newRecruitMorale: null, securityWrite: null, troopWrite: null, inventoryWrite, moraleWrite: null,
    kernels: [{ api: 'calculateProductionPrice', input: priceInput, output: priceOutput }, { api: 'calculateProductionQuantity', input: quantityInput, output: quantityOutput }] };
  return { calculation, fees, rewards, events: [{ type: 'command-committed', subjectId: commandId }],
    sideEffectsNotModeled: ['technique-points', 'native-stat-growth', 'native-writer-semantics', 'native-personnel-tasks', 'native-corps-effects', 'presentation-rng'], rngDraws: 0 };
}
function domesticFrame(s: ForgeCoreFacts, l: Ledger): DomesticInstantFrame {
  return { activeForceId: s.activeForceId, corps: { actionPoints: l.actionPoints }, city: { id: s.city.id, gold: l.gold, security: l.security, troops: l.troops,
    troopCapacity: s.city.troopCapacity, morale: l.morale, moraleCap: s.city.moraleCap, patrolUsedTurn: l.patrolUsedTurn,
    inventory: { 1: { ...l.inventory[1], capacity: s.city.inventory[1].capacity }, 2: { ...l.inventory[2], capacity: s.city.inventory[2].capacity },
      3: { ...l.inventory[3], capacity: s.city.inventory[3].capacity }, 4: { ...l.inventory[4], capacity: s.city.inventory[4].capacity } } },
    officers: s.officers.map((facts, i) => { const o = l.officers[i]!; return { id: o.id, forceId: facts.forceId, cityId: facts.cityId, available: facts.available,
      leadership: facts.leadership, charm: facts.charm, intelligence: facts.intelligence, skillIds: [...facts.skillIds],
      xp: { leadership: o.leadershipXp, charm: o.charmXp, intelligence: o.intelligenceXp, politics: o.politicsXp, war: o.warXp }, merit: o.merit, actedTurn: o.actedTurn, reservationJobId: o.reservationJobId }; }),
    facilities: l.facilities.map(f => ({ id: f.id, cityId: f.cityId, kind: f.kind, level: f.targetLevel, complete: f.status === 'complete', usedTurn: f.usedTurn, reservationJobId: f.jobId })),
    pressureActive: s.domestic.pressureActive, difficulty: s.domestic.difficulty, controller: s.domestic.controller,
    unlockedEquipmentTypes: [...s.domestic.unlockedEquipmentTypes], specialtyEquipmentTypes: [...s.domestic.specialtyEquipmentTypes], productionPrices: clone(s.productionCatalog.entries), policies: clone(s.policy.domestic) };
}
function domesticReason(reason: DomesticReason): Reason {
  switch (reason) {
    case 'officer-not-member': case 'officer-not-present': return 'officer-city-force-mismatch';
    case 'officer-production-reserved': return 'officer-reserved-by-job';
    case 'facility-production-reserved': return 'facility-reserved-by-job';
    case 'insufficient-ap': return 'insufficient-action-points';
    case 'patrol-already-used': return 'unexpected-reducer-effect';
    default: return reason;
  }
}
export function produce(s: ForgeCoreFacts, c: Current, action: ProduceCommand, commandId: Id): { audit: ProductionAudit } {
  const before = domesticFrame(s, c.ledger), result = reduceDomesticInstant({ commandId, turn: c.clock.turn }, before, action);
  if (!result.ok) stop(domesticReason(result.reason), 'domestic');
  const audit = productionAudit(result.audit, s, c, action, commandId), expected = clone(before);
  expected.city.gold = audit.fees.gold.after; expected.corps.actionPoints = audit.fees.actionPoints.after;
  expected.city.inventory[action.equipmentType].quantity = audit.calculation.inventoryWrite.after;
  for (const reward of audit.rewards) { const o = expected.officers.find(o => o.id === reward.officerId); if (!o) stop('unexpected-reducer-effect'); o.xp.intelligence = reward.xp.after; o.merit = reward.merit.after; o.actedTurn = c.clock.turn; }
  const f = expected.facilities.find(f => f.id === action.facilityId); if (!f) stop('unexpected-reducer-effect'); f.usedTurn = c.clock.turn;
  // Full-frame equality rejects any effect outside the explicit allowlist, including politics XP and locks.
  if (!same(result.candidate, expected)) stop('unexpected-reducer-effect');
  c.ledger.gold = expected.city.gold; c.ledger.actionPoints = expected.corps.actionPoints;
  c.ledger.inventory[action.equipmentType].quantity = expected.city.inventory[action.equipmentType].quantity;
  for (const reward of audit.rewards) { const o = c.ledger.officers.find(o => o.id === reward.officerId); if (!o) stop('unexpected-reducer-effect'); o.intelligenceXp = reward.xp.after; o.merit = reward.merit.after; o.actedTurn = c.clock.turn; }
  const facility = c.ledger.facilities.find(f => f.id === action.facilityId); if (!facility) stop('unexpected-reducer-effect'); facility.usedTurn = c.clock.turn;
  return { audit };
}
function forgeCatalog(s: ForgeCoreFacts): { goldCost: 300; techniquePoints: 30; durability: 800; typeId: 34 } {
  const entry = s.constructionCatalog.entries.find(entry => entry.kind === 'forge'); if (!entry) stop('unsupported-catalog');
  const level = entry.levels.find(level => level.level === 1); if (!level) stop('unsupported-catalog');
  return { goldCost: literal(entry.goldCost, 300), techniquePoints: literal(entry.completionTechniquePoints, 30), durability: literal(level.maxDurability, 800), typeId: literal(level.typeId, 34) };
}
export function startSnapshot(s: ForgeCoreFacts, clock: Clock, lot: Lot, people: OfficerRow[]): StartSnapshot {
  return { clock: { date: clone(clock.date), turn: clock.turn }, activeForceId: s.activeForceId, corpsId: s.corps.id, cityId: s.city.id,
    lot: clone(lot), officers: people.map(o => ({ id: o.id, politics: o.politics })), policyDigest: digest(s.policy), constructionCatalogDigest: digest(s.constructionCatalog) };
}
export function startForge(state: ForgeCoreStartContext, c: Current, e: Envelope, action: StartCommand): StartDetail {
  const s = state.genesis, l = c.ledger;
  if (action.cityId !== s.city.id) stop('unknown-city');
  if (s.activeForceId !== s.force.id || s.activeForceId !== s.city.ownerForceId || s.activeForceId !== s.corps.forceId) stop('owner-corps-mismatch');
  if (c.jobs.length >= 1) stop('job-history-limit');
  const unitChecks: UnitCheck[] = s.constructionEnvironment.fieldUnits.map(unit => {
    const dq = unit.position.q - s.city.position.q, dr = unit.position.r - s.city.position.r;
    const distance = Math.max(Math.abs(dq), Math.abs(dr), Math.abs(dq + dr)), hostile = s.constructionEnvironment.hostileForceIds.includes(unit.forceId);
    return { unitId: unit.id, forceId: unit.forceId, position: clone(unit.position), hostile, distance, blocks: hostile && distance <= 2 };
  });
  const blocking = unitChecks.find(unit => unit.blocks); if (blocking) stop('hostile-within-two', 'construction', { blockingUnitId: blocking.unitId });
  const people: OfficerRow[] = [];
  for (const oid of action.officerIds) {
    const o = l.officers.find(o => o.id === oid), facts = s.officers.find(o => o.id === oid), context = { officerId: oid };
    if (!o || !facts) stop('unknown-officer', 'construction', context);
    if (facts.forceId !== s.activeForceId || facts.cityId !== s.city.id) stop('officer-city-force-mismatch', 'construction', context);
    if (!facts.available) stop('officer-unavailable', 'construction', context);
    if (o.reservationJobId !== null) stop('officer-reserved-by-job', 'construction', { ...context, jobId: o.reservationJobId });
    if (o.actedTurn === c.clock.turn) stop('officer-already-acted', 'construction', context); people.push(o);
  }
  if (l.actionPoints < 20) stop('insufficient-action-points'); if (l.gold < 300) stop('insufficient-gold');
  const lot = s.lots.find(lot => lot.id === action.lotId); if (!lot) stop('unknown-lot');
  if (l.facilities.some(f => f.lotId === action.lotId)) stop('occupied-lot');
  if (l.facilities.some(f => f.id === action.facilityId)) stop('facility-id-reused', 'construction', { facilityId: action.facilityId });
  const catalog = forgeCatalog(s), politics = people.map(o => o.politics);
  const development = calculateConstructionDevelopment({ required: catalog.durability, politics, initialWork: s.policy.construction.initialWork });
  if (!development.ok) stop(development.reason); if (!development.rate.supported) stop('unsupported-construction-rate'); if (development.rate.rate <= 0) stop('nonpositive-construction-rate');
  const rate = rateReceipt(development.rate, politics), duration = integer(development.durationTurns, 10, 1, 'invalid-duration');
  if (development.required !== 800 || development.initial !== 200 || duration !== Math.ceil((800 - 200) / rate.rate)) stop('unexpected-reducer-effect');
  if (c.clock.advancedCount + duration > s.advanceLimit) stop('completion-horizon-exceeded');
  const dueTurn = integer(c.clock.turn + duration), dueDate = advanceDate(c.clock.date, duration);
  if (64 - (state.revision + 1) < duration) stop('completion-history-slots');
  const jid = jobId('job:' + e.id), snapshot = startSnapshot(s, c.clock, lot, people);
  const reservations: StartReservations = { officers: people.map(o => ({ officerId: o.id, jobBefore: null, jobAfter: jid, actedBefore: o.actedTurn, actedAfter: c.clock.turn })),
    facility: { facilityId: action.facilityId, jobBefore: null, jobAfter: jid }, lot: { lotId: lot.id, occupantBefore: null, occupantAfter: action.facilityId } };
  const facility: FacilityRow = { id: action.facilityId, lotId: lot.id, cityId: s.city.id, kind: 'forge', targetLevel: 1, typeId: catalog.typeId,
    status: 'developing', effectiveLevel: 0, jobId: jid, usedTurn: null };
  l.facilities.push(facility);
  const actionPoints = writeConstruction(l.actionPoints, -20, 255, s.policy.construction.writer.id); l.actionPoints = actionPoints.after;
  const gold = writeConstruction(l.gold, -catalog.goldCost, MAX, s.policy.construction.writer.id); l.gold = gold.after;
  const job: Job = { id: jid, kind: 'development', facilityKind: 'forge', cityId: s.city.id, lotId: lot.id, facilityId: facility.id,
    fromLevel: 0, targetLevel: 1, officerIds: [...action.officerIds], politics, startTurn: c.clock.turn, startDate: clone(c.clock.date), dueTurn, dueDate,
    durationTurns: duration, remainingTurns: duration, work: { initial: 200, current: 200, required: 800, perAdvance: rate.rate, rate }, startSnapshot: snapshot,
    rateInput: { profile: 'domestic-construction-rate-stable-v1', politics: [...politics], facilityDurability: 800 }, fees: { actionPoints, gold }, completedTurn: null, completion: null };
  for (const o of people) { o.reservationJobId = jid; o.actedTurn = c.clock.turn; } c.jobs.push(job);
  return { job: clone(job), createdFacility: clone(facility), unitChecks, reservations };
}
function completionReceipt(value: unknown, before: Current, job: Job): Completion {
  const completion = object(value, ['jobId', 'facilityId', 'typeId', 'level', 'effectiveLevel', 'techniquePoints', 'rewards', 'releasedOfficerIds', 'policyId']);
  literal(completion.jobId, job.id); literal(completion.facilityId, job.facilityId); literal(completion.typeId, 34); literal(completion.level, 1); literal(completion.effectiveLevel, 1);
  const tp = constructionWrite(completion.techniquePoints);
  if (tp.before !== before.ledger.force.techniquePoints || tp.requestedDelta !== 30 || tp.cap !== 10000 || tp.policyId !== 'facility-exact-debit-saturating-reward-v1') stop('unexpected-reducer-effect');
  const rewards = array(completion.rewards, job.officerIds.length, job.officerIds.length).map((value, index): ConstructionReward => {
    const reward = object(value, ['officerId', 'politicsXp', 'merit', 'politicsBefore', 'politicsAfter']), oid = job.officerIds[index]!;
    const person = before.ledger.officers.find(o => o.id === oid); if (!person) stop('unexpected-reducer-effect');
    literal(reward.officerId, oid); const politicsXp = constructionWrite(reward.politicsXp), merit = constructionWrite(reward.merit);
    if (politicsXp.before !== person.politicsXp || politicsXp.requestedDelta !== 3 || politicsXp.cap !== MAX || politicsXp.policyId !== 'facility-community-rewards-v1' ||
      merit.before !== person.merit || merit.requestedDelta !== 100 || merit.cap !== MAX || merit.policyId !== 'facility-community-rewards-v1') stop('unexpected-reducer-effect');
    return { officerId: oid, politicsXp, merit, politicsBefore: literal(reward.politicsBefore, person.politics), politicsAfter: literal(reward.politicsAfter, person.politics) };
  });
  if (!same(completion.releasedOfficerIds, job.officerIds)) stop('unexpected-reducer-effect'); literal(completion.policyId, 'next-boundary-capped-work-v1');
  return { jobId: job.id, facilityId: job.facilityId, typeId: 34, level: 1, effectiveLevel: 1, techniquePoints: tp, rewards,
    releasedOfficerIds: [...job.officerIds], policyId: 'next-boundary-capped-work-v1' };
}
function completeForge(s: ForgeCoreFacts, c: Current, job: Job): Completion {
  const facility = c.ledger.facilities.find(f => f.id === job.facilityId);
  if (!facility || facility.jobId !== job.id || facility.status === 'complete') stop('facility-reservation-mismatch', 'tick', { facilityId: job.facilityId, jobId: job.id });
  if (job.remainingTurns !== 0 || c.clock.turn !== job.dueTurn || !same(c.clock.date, job.dueDate)) stop('completion-timing-mismatch', 'tick', { jobId: job.id });
  if (job.work.current !== job.work.required) stop('incomplete-work', 'tick', { jobId: job.id });
  const catalog = forgeCatalog(s), before = clone(c), p = s.policy.construction;
  // These are the actual candidate references. Resolver checks stay at each original phase write point.
  const raw = completeConstructionPhase({ job, facility, force: c.ledger.force, currentTurn: c.clock.turn, requestedTechniquePoints: catalog.techniquePoints,
    policies: { writer: p.writer, rewards: p.rewards, completionActors: p.completionActors, scheduler: p.scheduler } }, {
    write: writeConstruction,
    requireReservedOfficer(oid) {
      const person = c.ledger.officers.find(o => o.id === oid);
      if (!person || person.reservationJobId !== job.id) stop('officer-reservation-mismatch', 'tick', { officerId: oid, jobId: job.id }); return person;
    }
  });
  const completion = completionReceipt(raw, before, job), expected = clone(before);
  expected.ledger.force.techniquePoints = completion.techniquePoints.after;
  for (const reward of completion.rewards) {
    const person = expected.ledger.officers.find(o => o.id === reward.officerId); if (!person) stop('unexpected-reducer-effect');
    person.politicsXp = reward.politicsXp.after; person.merit = reward.merit.after; person.reservationJobId = null; person.actedTurn = c.clock.turn;
  }
  const expectedFacility = expected.ledger.facilities.find(f => f.id === job.facilityId), expectedJob = expected.jobs.find(j => j.id === job.id);
  if (!expectedFacility || !expectedJob) stop('unexpected-reducer-effect');
  expectedFacility.status = 'complete'; expectedFacility.effectiveLevel = 1; expectedFacility.jobId = null; expectedJob.completedTurn = c.clock.turn;
  if (!same(c, expected)) stop('unexpected-reducer-effect');
  job.completion = clone(completion); return clone(completion);
}
export function advanceShared(s: ForgeCoreFacts, c: Current): TickDetail {
  if (c.clock.advancedCount >= s.advanceLimit) stop('advance-limit-reached');
  c.clock = { date: advanceDate(c.clock.date, 1), turn: integer(c.clock.turn + 1), advancedCount: c.clock.advancedCount + 1 };
  const p = s.policy.construction, apRecovery = writeConstruction(c.ledger.actionPoints, p.apRecovery.perAdvance, p.apRecovery.cap, p.apRecovery.id); c.ledger.actionPoints = apRecovery.after;
  const progress: ProgressAudit[] = [], completions: Completion[] = [], job = c.jobs[0];
  if (job && job.completedTurn === null) {
    const oldRemaining = job.remainingTurns, oldWork = job.work.current, raw = advanceConstructionWork(job);
    object(raw, ['jobId', 'remainingBefore', 'remainingAfter', 'workBefore', 'workAfter']);
    if (raw.jobId !== job.id || raw.remainingBefore !== oldRemaining || raw.remainingAfter !== oldRemaining - 1 || raw.workBefore !== oldWork ||
      raw.workAfter !== Math.min(800, oldWork + job.work.perAdvance) || job.remainingTurns !== raw.remainingAfter || job.work.current !== raw.workAfter) stop('unexpected-reducer-effect');
    progress.push({ jobId: job.id, remainingBefore: oldRemaining, remainingAfter: job.remainingTurns, workBefore: oldWork, workAfter: job.work.current });
    if (job.remainingTurns === 0) completions.push(completeForge(s, c, job));
  }
  return { apRecovery, progress, completions };
}
