/** Neutral personnel metadata proposals; no real ownership or native rumor writer. */
import { createOfficeAssignmentState, planOfficeAssignments, applyOfficeAssignmentPlan } from '../office-assignment.ts';
import { resolveFinancePayroll } from './finance-money-payroll-leaves.ts';
import { createRumorScalarStateV1, executeRumorScalarV1, RUMOR_SCALAR_DEFAULT_POLICY_V1 } from '../rumor-scalar-lifecycle.ts';
const fail = (reason: string) => Object.freeze({ ok: false as const, reason });
const uint = (v: unknown, max: number): v is number => typeof v === 'number' && Number.isSafeInteger(v) && !Object.is(v, -0) && v >= 0 && v <= max;
const record = (v: unknown): v is Record<string, unknown> => v !== null && typeof v === 'object' && !Array.isArray(v);
const keys = (v: Record<string, unknown>, expected: readonly string[]) => Object.keys(v).length === expected.length && expected.every(k => Object.hasOwn(v, k));
const id = (v: unknown): v is string => typeof v === 'string' && /^synthetic-[a-z0-9-]{1,48}$/.test(v);
function frozen<T>(value: T): Readonly<T> {
  if (value !== null && typeof value === 'object') { for (const item of Object.values(value)) frozen(item); Object.freeze(value); }
  return value;
}
const runtime = globalThis as { process?: { getBuiltinModule?: (id: string) => { types: { isProxy(v: unknown): boolean } } } };
const isProxy = typeof runtime.process?.getBuiltinModule === 'function' ? runtime.process.getBuiltinModule('node:util').types.isProxy : (() => false);
function detach(input: unknown): unknown {
  let nodes = 0, chars = 0; const active = new Set<object>();
  const invalid = (): never => { throw new Error('invalid-data'); };
  function visit(value: unknown, depth: number): unknown {
    if (++nodes > 10000 || depth > 12) return invalid();
    if (value === null || typeof value === 'boolean') return value;
    if (typeof value === 'number') return uint(value, Number.MAX_SAFE_INTEGER) ? value : invalid();
    if (typeof value === 'string') { chars += value.length; return chars <= 100000 ? value : invalid(); }
    if (typeof value !== 'object' || isProxy(value) || active.has(value)) return invalid();
    const array = Array.isArray(value), proto = Object.getPrototypeOf(value);
    if (proto !== (array ? Array.prototype : Object.prototype) && !(proto === null && !array)) return invalid();
    const descriptors = Object.getOwnPropertyDescriptors(value), names = Reflect.ownKeys(descriptors);
    if (names.some(name => typeof name !== 'string' || !Object.hasOwn(descriptors[name]!, 'value')
      || (!descriptors[name]!.enumerable && !(array && name === 'length')))) return invalid();
    active.add(value);
    try {
      if (array) {
        const length = descriptors.length!.value as number;
        if (!uint(length, 256) || names.length !== length + 1) return invalid();
        const result: unknown[] = [];
        for (let i = 0; i < length; i++) { const descriptor = descriptors[String(i)]; if (!descriptor) return invalid(); result.push(visit(descriptor.value, depth + 1)); }
        return result;
      }
      if (names.length > 16) return invalid();
      const result: Record<string, unknown> = {};
      for (const name of names as string[]) Object.defineProperty(result, name, { value: visit(descriptors[name]!.value, depth + 1), enumerable: true });
      return result;
    } finally { active.delete(value); }
  }
  return visit(input, 0);
}






function offices(input: unknown) {
  if (!record(input) || !keys(input, ['ownerId', 'rulerId', 'titleKey', 'officers', 'mode']) || !id(input.ownerId) || !id(input.rulerId) || input.rulerId === input.ownerId
    || typeof input.titleKey !== 'string' || !Array.isArray(input.officers) || input.officers.length < 1 || input.officers.length > 8
    || (input.mode !== 'weighted-threshold' && input.mode !== 'role-affinity')) return fail('invalid-office-proposal');
  const current: { id: string; personId: number; salary: number; officeId: number | null }[] = [], projected = [], assignments = [];
  for (const o of input.officers) {
    if (!record(o) || !keys(o, ['id', 'personId', 'ownerId', 'role', 'eligible', 'merit', 'trueLoyalty', 'selectorStats', 'salary', 'officeId'])
      || (o.role !== 'ruler' && o.role !== 'ordinary-officer') || ((o.id === input.rulerId) !== (o.role === 'ruler'))
      || !id(o.id) || o.id === input.ownerId || o.ownerId !== input.ownerId || !uint(o.personId, 65535)
      || current.some(p => p.id === o.id || p.personId === o.personId) || typeof o.eligible !== 'boolean'
      || !uint(o.merit, 60000) || !uint(o.trueLoyalty, 255) || o.trueLoyalty === 0 || !uint(o.salary, 1000000)
      || !(o.officeId === null || uint(o.officeId, 79)) || !record(o.selectorStats)
      || !keys(o.selectorStats, ['leadership', 'war', 'intelligence', 'politics'])
      || Object.values(o.selectorStats).some(n => !uint(n, 100) || n === 0)) return fail('invalid-current-office-officer');
    current.push({ id: o.id, personId: o.personId, salary: o.salary, officeId: o.officeId });
    projected.push({ personId: o.personId, role: o.role, appointmentStatus: o.eligible ? 'ready' : 'unavailable',
      merit: o.merit, trueLoyalty: o.trueLoyalty, selectorStats: { ...o.selectorStats } });
    if (o.officeId !== null) assignments.push({ personId: o.personId, officeId: o.officeId });
  }
  const made = createOfficeAssignmentState({ titleKey: input.titleKey, officers: projected, assignments }); if (!made.ok) return made;
  const planned = planOfficeAssignments(made.state, { mode: input.mode, incumbentPolicy: 'fill-vacancies-v1' }); if (!planned.ok) return planned;
  const applied = applyOfficeAssignmentPlan(made.state, planned.plan); if (!applied.ok) return applied;
  if (applied.receipt.changes.removed.length !== 0) return fail('unexpected-office-removal');
  const newAssignments = applied.receipt.changes.added.map(a => {
    const who = current.find(o => o.personId === a.personId)!;
    return { id: who.id, officeId: a.officeId };
  }).sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
  const payroll = resolveFinancePayroll(newAssignments); if (!payroll.ok) return payroll;
  const patches = current.map(o => {
    const assignment = applied.state.assignments.find(a => a.personId === o.personId);
    const paid = payroll.payroll.items.find(p => p.officerId === o.id);
    return { id: o.id, officeId: assignment?.officeId ?? null, salary: paid ? paid.catalogSalary : o.salary };
  });
  return frozen({ ok: true as const, patches, receipt: applied.receipt, payroll: payroll.payroll,
    proposalOnly: true as const, nativeOwnershipWritten: false as const, discountApplied: false as const });
}
function rumor(input: unknown) {
  if (!record(input) || !keys(input, ['scenario', 'rngDrawOffset', 'commandId', 'actorId']) || !id(input.commandId) || !id(input.actorId)
    || !uint(input.rngDrawOffset, 1000000) || !record(input.scenario)) return fail('invalid-rumor-proposal');
  const s = input.scenario;
  if (!keys(s, ['date', 'attackingForce', 'targetForce', 'originCity', 'targetCity', 'actors', 'targetOfficers', 'relations', 'rng'])
    || !record(s.attackingForce) || !keys(s.attackingForce, ['id']) || !id(s.attackingForce.id)
    || !record(s.targetForce) || !keys(s.targetForce, ['id', 'rulerId']) || !id(s.targetForce.id) || !id(s.targetForce.rulerId)
    || s.attackingForce.id === s.targetForce.id || !record(s.originCity) || !record(s.targetCity)
    || !id(s.originCity.id) || !id(s.targetCity.id) || s.originCity.id === s.targetCity.id
    || !Array.isArray(s.actors) || s.actors.length < 1 || s.actors.length > 8
    || !Array.isArray(s.targetOfficers) || s.targetOfficers.length < 1 || s.targetOfficers.length > 8
    || !record(s.targetCity.defense) || !id(s.targetCity.defense.governorId) || !id(s.targetCity.defense.strategistId)
    || !record(s.rng) || !keys(s.rng, ['kind', 'seed']) || s.rng.kind !== 'xorshift32-nonzero-rejection-v1'
    || !uint(s.rng.seed, 0xffffffff) || s.rng.seed === 0) return fail('invalid-current-rumor-scenario');
  const entityIds: string[] = [s.attackingForce.id, s.targetForce.id, s.targetForce.rulerId, s.originCity.id, s.targetCity.id,
    s.targetCity.defense.governorId, s.targetCity.defense.strategistId];
  for (const a of s.actors) { if (!record(a) || !id(a.id)) return fail('invalid-rumor-actor'); entityIds.push(a.id); }
  for (const o of s.targetOfficers) {
    if (!record(o) || !id(o.id) || !uint(o.trueLoyalty, 255) || o.trueLoyalty === 0) return fail('invalid-positive-target-loyalty');
    entityIds.push(o.id);
  }
  if (new Set(entityIds).size !== entityIds.length) return fail('rumor-identity-collision');
  // seed is the current outer RNG state, not the original scenario's seed.
  const made = createRumorScalarStateV1({ ...s, schemaVersion: 1, profile: 'standalone-rumor-scalar-v1',
    scope: 'two-fixed-cities-ordinary-scalar-only', advanceLimit: 1, relation: 'hostile', policy: RUMOR_SCALAR_DEFAULT_POLICY_V1 });
  if (!made.ok) return made;
  const result = executeRumorScalarV1(made.state, { id: input.commandId, expectedRevision: 0,
    command: { type: 'AttemptRumorScalar', actorId: input.actorId, targetCityId: s.targetCity.id } });
  if (!result.ok) return result;
  const next = result.state.snapshot;
  if (result.duplicate || !result.committed || next.targetOfficers.some(o => o.trueLoyalty === 0)
    || input.rngDrawOffset + next.rng.drawCount > 1000000) return fail('unsupported-terminal-loyalty-or-rng-budget');
  return frozen({ ok: true as const, originPatch: { gold: next.gold, actionPoints: next.actionPoints, actorId: input.actorId, acted: true },
    targetPatch: { cityId: s.targetCity.id, security: next.security, officers: next.targetOfficers },
    rng: { state: next.rng.state, drawCount: input.rngDrawOffset + next.rng.drawCount },
    draws: result.receipt.draws.map(d => ({ ...d, drawIndex: input.rngDrawOffset as number + d.drawIndex })),
    receipt: result.receipt, proposalOnly: true as const, nativeWorldRumorEquivalent: false as const });
}
export function projectSyntheticOfficeVacancies(input: unknown) { try { return offices(detach(input)); } catch { return fail('invalid-data-input'); } }
export function projectSyntheticRumorScalar(input: unknown) { try { return rumor(detach(input)); } catch { return fail('invalid-data-input'); } }
