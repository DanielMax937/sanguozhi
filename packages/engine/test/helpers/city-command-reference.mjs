/** Independent policy oracle: integer/rational arithmetic and a small ledger; no product imports. */
export const clone = x => JSON.parse(JSON.stringify(x));
export const canonical = x => x === null || typeof x !== 'object' ? JSON.stringify(x) : Array.isArray(x) ? '[' + x.map(canonical).join(',') + ']' : '{' + Object.keys(x).sort().map(k => JSON.stringify(k) + ':' + canonical(x[k])).join(',') + '}';
const reject = reason => { throw new Error(reason); };
const divide = (a, b) => Number(BigInt(a) / BigInt(b));
const scaled = (a, bits) => bits === '3F99999A' ? divide(BigInt(a) * 5033165n, 4194304n) : bits === '3FC00000' ? divide(BigInt(a) * 3n, 2n) : a;
function writer(before, delta, cap, p) {
  const after = Math.min(cap, Math.max(0, before + delta));
  if (p.parameters.overflow === 'reject' && after !== before + delta && delta !== 0) reject('writer-cap-overflow');
  return { after, actual: after - before, returned: p.parameters.returned === 'requested' ? delta : after - before };
}
export function project(s) {
  return { revision: s.revision, turn: s.turn, date: clone(s.date), city: clone(s.city), corps: clone(s.corps), officers: clone(s.officers), facilities: clone(s.facilities), jobs: s.productionJobs.map(j => ({ id: j.id, status: j.status, cityId: j.cityId, facilityId: j.facilityId, officerIds: clone(j.officerIds), equipmentType: j.equipmentType, startTurn: j.startTurn, remainingTurns: j.remainingTurns, dueTurn: j.dueTurn, durationTurns: j.durationTurns, reservedQuantity: j.reservedQuantity, completedTurn: j.completedTurn })) };
}
export function createReference(scenario) {
  const s = clone(scenario); s.revision = 0; s.productionJobs = []; s.seen = [];
  for (const row of Object.values(s.city.inventory)) row.reserved = 0;
  return s;
}
function rewards(people, p, kind) {
  const attribute = p.parameters[kind], n = p.parameters[kind === 'piece' ? 'completionXp' : 'instantXp'], merit = p.parameters[kind === 'piece' ? 'completionMerit' : 'instantMerit'];
  for (const person of people) { person.xp[attribute] = Math.min(p.parameters.cap, person.xp[attribute] + n); person.merit = Math.min(p.parameters.cap, person.merit + merit); }
}
export function runReference(state, envelope) {
  try {
    const seen = state.seen.find(x => x.id === envelope.id);
    if (seen) { if (canonical(seen) !== canonical(envelope)) reject('command-id-conflict'); return { ok: true, state, duplicate: true }; }
    if (envelope.expectedRevision !== state.revision) reject('stale-revision');
    const s = clone(state), c = envelope.command, p = s.policies, city = s.city;
    if (c.type === 'AdvanceCityTurn') {
      if (s.date.day === 21) { s.date.day = 1; if (s.date.month === 12) { if (s.date.year === 9999) reject('calendar-overflow'); s.date.year++; s.date.month = 1; } else s.date.month++; } else s.date.day += 10;
      s.turn++; s.corps.actionPoints = Math.min(255, s.corps.actionPoints + p.apRecovery.parameters.increment);
      for (const j of [...s.productionJobs].sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0)) {
        if (j.status === 'completed') continue; j.remainingTurns--;
        if (j.remainingTurns === 0) {
          city.inventory[j.equipmentType].quantity++; city.inventory[j.equipmentType].reserved--;
          const people = j.officerIds.map(id => s.officers.find(o => o.id === id)); rewards(people, p.rewards, 'piece');
          for (const o of people) { o.reservationJobId = null; o.actedTurn = s.turn; }
          s.facilities.find(f => f.id === j.facilityId).reservationJobId = null; j.status = 'completed'; j.completedTurn = s.turn;
        }
      }
    } else {
      if (c.cityId !== city.id) reject('unknown-city');
      if (c.type === 'Patrol' && city.patrolUsedTurn === s.turn) reject('patrol-already-used');
      if (!c.officerIds.length || c.officerIds.length > 3) reject('invalid-officer-count');
      if (new Set(c.officerIds).size !== c.officerIds.length) reject('duplicate-officer');
      const people = c.officerIds.map(id => {
        const o = s.officers.find(x => x.id === id); if (!o) reject('unknown-officer'); if (o.forceId !== s.activeForceId) reject('officer-not-member'); if (o.cityId !== city.id) reject('officer-not-present'); if (!o.available) reject('officer-unavailable'); if (o.reservationJobId !== null) reject('officer-production-reserved'); if (o.actedTurn === s.turn) reject('officer-already-acted'); return o;
      });
      const t = c.equipmentType; let f = null;
      if (c.type !== 'Patrol') {
        f = s.facilities.find(x => x.id === c.facilityId); if (!f) reject('unknown-facility'); if (f.cityId !== city.id) reject('facility-not-present'); if (!f.complete) reject('facility-incomplete');
        if (f.kind !== (c.type === 'Recruit' ? 'barracks' : t <= 3 ? 'forge' : t === 4 ? 'stable' : t <= 8 ? 'workshop' : 'shipyard')) reject('wrong-facility-kind');
        if (f.reservationJobId !== null) reject('facility-production-reserved'); if (f.usedTurn === s.turn) reject('facility-used-this-turn');
      }
      const sum = key => people.reduce((a, o) => a + o[key], 0), has = n => people.some(o => o.skillIds.includes(n));
      const factor = f ? p.facilityMultiplier.parameters.levelBits[f.level - 1] : null;
      let cost = 0, ap = 20, yieldActual = 0, piece = false;
      if (c.type === 'Patrol') {
        let gain = 2 + divide(sum('leadership'), 28); if (s.pressureActive) gain = divide(gain, 2); gain = Math.min(100 - city.security, gain);
        city.security += gain; city.patrolUsedTurn = s.turn; yieldActual = gain; cost = 100; rewards(people, p.rewards, 'patrol');
      } else if (c.type === 'Recruit') {
        const charm = sum('charm'), oldSecurity = city.security, oldTroops = city.troops;
        let q = 1000 + divide((oldSecurity + 20) * charm, 20); q = divide(q * (has(79) ? 15 : 10), 10); q = scaled(q, factor);
        if (s.difficulty === 'super' && s.controller === 'ai') q *= 2; if (s.pressureActive) q = divide(q, 2); q = Math.min(q, city.troopCapacity - oldTroops);
        const w = writer(oldTroops, q, city.troopCapacity, p.writer), securityRequest = -divide(w.returned, charm + 100), sec = writer(oldSecurity, securityRequest, 100, p.writer);
        const total = oldTroops + w.actual, numerator = oldTroops * city.morale + w.actual * divide(oldSecurity, 2);
        const mixed = total === 0 ? city.morale : p.morale.parameters.rounding === 'ceil' ? divide(numerator + total - 1, total) : divide(numerator, total);
        city.troops = w.after; city.security = sec.after; city.morale = Math.max(20, Math.min(city.moraleCap, mixed)); yieldActual = w.actual; cost = 300; rewards(people, p.rewards, 'recruit');
      } else if (c.type === 'Produce') {
        if (!s.unlockedEquipmentTypes.includes(t)) reject('equipment-locked');
        cost = s.catalog.entries[t].basePriceWord; if (s.specialtyEquipmentTypes.includes(t)) cost = divide(cost * 8, 10);
        piece = t >= 5; ap = p.productionAp.parameters[piece ? 'piece' : 'quantity'];
        if (!piece) {
          let q = (sum('intelligence') + Math.max(...people.map(o => o.intelligence)) + 200) * 5;
          if (has(t === 4 ? 81 : 80)) q *= 2; q = scaled(q, factor); if (s.difficulty === 'super' && s.controller === 'ai') q *= 2;
          const stock = city.inventory[t], w = writer(stock.quantity, q, stock.capacity - stock.reserved, p.writer); stock.quantity = w.after; yieldActual = w.actual; rewards(people, p.rewards, 'quantity');
        } else {
          const q = divide(Math.max(24, sum('intelligence') + Math.max(...people.map(o => o.intelligence)) - 200), 24);
          let duration = t >= 10 && city.drillGroundComplete ? Math.max(2, 8 - q) : 10 - q; if (has(t <= 8 ? 82 : 83)) duration = divide(duration, 2);
          if (duration <= 0 && p.time.parameters.nonpositive === 'reject') reject('unsupported-nonpositive-production-time'); duration = Math.max(1, duration);
          const stock = city.inventory[t]; if (stock.quantity + stock.reserved >= stock.capacity) reject('piece-capacity-unavailable');
          const jobId = 'job:' + envelope.id; stock.reserved++; f.reservationJobId = jobId; for (const o of people) o.reservationJobId = jobId;
          s.productionJobs.push({ id: jobId, status: 'active', cityId: city.id, facilityId: f.id, officerIds: clone(c.officerIds), equipmentType: t, startTurn: s.turn, remainingTurns: duration, dueTurn: s.turn + duration, durationTurns: duration, reservedQuantity: 1, completedTurn: null });
        }
      }
      if (!piece && yieldActual === 0 && p.zeroYield.parameters.zero === 'reject') reject('zero-yield');
      if (city.gold < cost) reject('insufficient-gold'); if (s.corps.actionPoints < ap) reject('insufficient-ap'); city.gold -= cost; s.corps.actionPoints -= ap;
      for (const o of people) o.actedTurn = s.turn; if (f) f.usedTurn = s.turn;
    }
    s.revision++; s.seen.push(clone(envelope)); return { ok: true, state: s, duplicate: false };
  } catch (e) { return { ok: false, reason: e.message }; }
}
export function projectReference(s) { const { seen, policies, catalog, activeForceId, profile, unlockedEquipmentTypes, specialtyEquipmentTypes, pressureActive, difficulty, controller, ...rest } = s; const { productionJobs, ...r } = rest; return { ...r, jobs: clone(productionJobs) }; }
