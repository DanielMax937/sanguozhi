/** Opt-in synthetic all-or-nothing payroll; no original person/world finalizer. */
import { projectInferredSalaryShortfallV2 } from './inferred-salary-request.ts';

type Officer = Readonly<{ id: string; salary: number; loyalty: number }>;
type Command = Readonly<{ id: string; expectedRevision: number; period: number; payrollEligibilityConfirmed: true }>;
type State = Readonly<{ schema: 'inferred-synthetic-salary-ledger-v1'; initialGold: number;
  initialOfficers: readonly Officer[]; commands: readonly Command[] }>;
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

function commandFrom(input: unknown): Command | undefined {
  if (!record(input) || !keys(input, ['id', 'expectedRevision', 'period', 'payrollEligibilityConfirmed'])
    || !id(input.id) || !uint(input.expectedRevision, 127) || !uint(input.period, 1000000) || input.period === 0
    || input.payrollEligibilityConfirmed !== true) return undefined;
  return { id: input.id, expectedRevision: input.expectedRevision, period: input.period, payrollEligibilityConfirmed: true };
}
function replay(input: unknown) {
  if (!record(input) || !keys(input, ['schema', 'initialGold', 'initialOfficers', 'commands'])
    || input.schema !== 'inferred-synthetic-salary-ledger-v1' || !uint(input.initialGold, 1000000000)
    || !Array.isArray(input.initialOfficers) || input.initialOfficers.length < 1 || input.initialOfficers.length > 64
    || !Array.isArray(input.commands) || input.commands.length > 128) return fail('invalid-ledger');
  const initialOfficers: Officer[] = [], names = new Set<string>();
  for (const officer of input.initialOfficers) {
    if (!record(officer) || !keys(officer, ['id', 'salary', 'loyalty']) || !id(officer.id) || names.has(officer.id)
      || !uint(officer.salary, 1000000) || !uint(officer.loyalty, 255) || officer.loyalty === 0) return fail('invalid-synthetic-officer');
    names.add(officer.id); initialOfficers.push({ id: officer.id, salary: officer.salary, loyalty: officer.loyalty });
  }
  const facilitySalary = initialOfficers.reduce((sum, officer) => sum + officer.salary, 0);
  let gold = input.initialGold, period = 0, officers = initialOfficers.map(officer => ({ ...officer }));
  const commands: Command[] = [], receipts = [], commandIds = new Set<string>();
  for (const entry of input.commands) {
    const command = commandFrom(entry);
    if (!command || command.expectedRevision !== commands.length || commandIds.has(command.id) || command.period <= period) return fail('invalid-or-repeated-period');
    const facility = projectInferredSalaryShortfallV2(facilitySalary, gold, 0);
    if (!facility.ok) return facility;
    const writes = [];
    for (const officer of officers) {
      const plan = projectInferredSalaryShortfallV2(facilitySalary, gold, officer.salary);
      if (!plan.ok) return plan;
      if (officer.loyalty <= plan.loyaltyLossRequest) return fail('zero-loyalty-or-allegiance-result-excluded');
      writes.push({ id: officer.id, salary: officer.salary, paid: plan.officerPaidRequest,
        loyaltyBefore: officer.loyalty, loyaltyAfter: officer.loyalty - plan.loyaltyLossRequest, loss: plan.loyaltyLossRequest });
    }
    receipts.push({ commandId: command.id, period: command.period, facilitySalary, goldBefore: gold,
      facilityPaid: facility.facilityPaidRequest, goldAfter: facility.remainingGoldRequest, writes });
    // Commit facility money ONCE, after every officer proposal has passed the positive-value gate.
    gold = facility.remainingGoldRequest;
    officers = officers.map((officer, index) => ({ ...officer, loyalty: writes[index]!.loyaltyAfter }));
    period = command.period; commands.push(command); commandIds.add(command.id);
  }
  const state: State = { schema: 'inferred-synthetic-salary-ledger-v1', initialGold: input.initialGold, initialOfficers, commands };
  return frozen({ ok: true as const, state, gold, officers, period, revision: commands.length, receipts,
    campaignWorldWritten: false as const, originalPersonnelModified: false as const, nativeLoyaltyLossVerified: false as const });
}
export function readInferredSalaryLedger(input: unknown) {
  try { return replay(detach(input)); } catch { return fail('invalid-data-input'); }
}
export function createInferredSalaryLedger(initialGold: unknown, initialOfficers: unknown) {
  return readInferredSalaryLedger({ schema: 'inferred-synthetic-salary-ledger-v1', initialGold, initialOfficers, commands: [] });
}
export function executeInferredSalaryPeriod(input: unknown, rawCommand: unknown) {
  const current = readInferredSalaryLedger(input);
  if (!current.ok) return current;
  let detached: unknown;
  try { detached = detach(rawCommand); } catch { return fail('invalid-data-command'); }
  const command = commandFrom(detached);
  if (!command || command.expectedRevision !== current.revision || current.revision >= 128) return fail('invalid-command-or-capacity');
  if (current.state.commands.some(entry => entry.id === command.id)) return fail('duplicate-command');
  return readInferredSalaryLedger({ ...current.state, commands: [...current.state.commands, command] });
}
export function saveInferredSalaryLedger(input: unknown) {
  const validated = readInferredSalaryLedger(input);
  return validated.ok ? Object.freeze({ ok: true as const, json: JSON.stringify(validated.state) }) : validated;
}
export function loadInferredSalaryLedger(json: unknown) {
  if (typeof json !== 'string' || json.length > 100000) return fail('invalid-save');
  try { return readInferredSalaryLedger(JSON.parse(json)); } catch { return fail('invalid-save'); }
}
