/** One outer journal coordinates synthetic grants, confiscations and ordinary natural turns. */
import treasureCatalog from '../../../docs/sources/treasures.json' with { type: 'json' };
import { readInferredTreasureTurnSession, createInferredTreasureTurnSession } from './inferred-treasure-turn-projection.ts';
import { createInferredTreasureLedger, executeInferredTreasureGrant } from './inferred-treasure-ledger.ts';
import { createInferredConfiscationLedger, executeInferredConfiscation } from './inferred-confiscation-ledger.ts';
import { createPersonnelLoyaltyState, executePersonnelLoyaltyCommand } from './personnel-loyalty-lifecycle.ts';

const STATS = ['leadership', 'war', 'intelligence', 'politics', 'charisma'] as const;
type Stat = typeof STATS[number];
type Stats = Record<Stat, number>;
type Command = { id: string; expectedRevision: number; type: 'Advance' }
  | { id: string; expectedRevision: number; type: 'Grant'; itemId: string; officerId: string; eligibilityConfirmed: true }
  | { id: string; expectedRevision: number; type: 'Confiscate'; itemId: string; eligibilityConfirmed: true };
type Frozen<T> = T extends object ? { readonly [K in keyof T]: Frozen<T[K]> } : T;
function freeze<T>(value: T): Frozen<T> {
  if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const item of Object.values(value)) freeze(item);
    Object.freeze(value);
  }
  return value as Frozen<T>;
}
const fail = (reason: string) => freeze({ ok: false as const, reason });
const uint = (v: unknown, max: number): v is number => typeof v === 'number' && Number.isSafeInteger(v) && !Object.is(v, -0) && v >= 0 && v <= max;
const record = (v: unknown): v is Record<string, unknown> => v !== null && typeof v === 'object' && !Array.isArray(v);
const keys = (v: Record<string, unknown>, names: readonly string[]) => Object.keys(v).length === names.length && names.every(name => Object.hasOwn(v, name));
const id = (v: unknown): v is string => typeof v === 'string' && /^synthetic-[a-z0-9-]{1,48}$/.test(v);
const runtime = globalThis as { process?: { getBuiltinModule?: (id: string) => { types: { isProxy(v: unknown): boolean } } } };
const isProxy = typeof runtime.process?.getBuiltinModule === 'function' ? runtime.process.getBuiltinModule('node:util').types.isProxy : (() => false);
function detach(input: unknown): unknown {
  let nodes = 0, chars = 0; const active = new Set<object>();
  const invalid = (): never => { throw new Error('invalid-data'); };
  function visit(value: unknown, depth: number): unknown {
    if (++nodes > 100000 || depth > 32) return invalid();
    if (value === null || typeof value === 'boolean') return value;
    if (typeof value === 'number') return uint(value, Number.MAX_SAFE_INTEGER) ? value : invalid();
    if (typeof value === 'string') { chars += value.length; return chars <= 2000000 ? value : invalid(); }
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
        if (!uint(length, 512) || names.length !== length + 1) return invalid();
        const result: unknown[] = [];
        for (let i = 0; i < length; i++) { const descriptor = descriptors[String(i)]; if (!descriptor) return invalid(); result.push(visit(descriptor.value, depth + 1)); }
        return result;
      }
      if (names.length > 128) return invalid();
      const result: Record<string, unknown> = {};
      for (const name of names as string[]) Object.defineProperty(result, name, { value: visit(descriptors[name]!.value, depth + 1), enumerable: true });
      return result;
    } finally { active.delete(value); }
  }
  return visit(input, 0);
}

function commandFrom(value: unknown): Command | undefined {
  if (!record(value) || !id(value.id) || !uint(value.expectedRevision, 127)) return undefined;
  if (value.type === 'Advance' && keys(value, ['id', 'expectedRevision', 'type'])) return { id: value.id, expectedRevision: value.expectedRevision, type: value.type };
  if (value.type === 'Grant' && keys(value, ['id', 'expectedRevision', 'type', 'itemId', 'officerId', 'eligibilityConfirmed'])
    && id(value.itemId) && id(value.officerId) && value.eligibilityConfirmed === true)
    return { id: value.id, expectedRevision: value.expectedRevision, type: value.type, itemId: value.itemId, officerId: value.officerId, eligibilityConfirmed: true };
  if (value.type === 'Confiscate' && keys(value, ['id', 'expectedRevision', 'type', 'itemId', 'eligibilityConfirmed'])
    && id(value.itemId) && value.eligibilityConfirmed === true)
    return { id: value.id, expectedRevision: value.expectedRevision, type: value.type, itemId: value.itemId, eligibilityConfirmed: true };
  return undefined;
}
function replay(input: unknown) {
  if (!record(input) || !keys(input, ['schema', 'initialSession', 'commands']) || input.schema !== 'inferred-treasure-unified-session-v2'
    || !Array.isArray(input.commands) || input.commands.length > 128) return fail('invalid-unified-session');
  const initial = readInferredTreasureTurnSession(input.initialSession);
  if (!initial.ok) return initial;
  if (initial.state.commands.length !== 0) return fail('initial-session-must-have-no-natural-history');
  const facts = initial.state.personnelScenario;
  let officers = initial.personnelState.snapshot.officers.map(officer => ({ id: officer.id, loyalty: officer.trueLoyalty }));
  let items = initial.holdings.map(item => ({ ...item })), actionPoints = initial.actionPoints;
  let date = { ...initial.date }, rngState = initial.personnelState.snapshot.rng.state, rngDrawCount = 0, advanceCount = 0;
  const commands: Command[] = [], commandIds = new Set<string>();
  const receipts: { id: string; revision: number; type: Command['type']; dateBefore: typeof date; dateAfter: typeof date;
    rngDrawCountBefore: number; rngDrawCountAfter: number; internalReceipt: unknown }[] = [];
  for (const entry of input.commands) {
    const command = commandFrom(entry);
    if (!command || command.expectedRevision !== commands.length || commandIds.has(command.id)) return fail('invalid-command-history');
    const dateBefore = { ...date }, countBefore = rngDrawCount;
    let internalReceipt: unknown;
    if (command.type === 'Advance') {
      if (advanceCount >= facts.advanceLimit) return fail('natural-advance-limit');
      // This is a new INTERNAL one-turn transaction, not a rewrite of an old history.
      // The outer genesis/journal always remains intact and re-derives this boundary.
      const segment = createPersonnelLoyaltyState({ ...facts, date, advanceLimit: 1,
        city: { ...facts.city, gold: 0, actionPoints },
        officers: facts.officers.map(fact => ({ ...fact,
          trueLoyalty: officers.find(officer => officer.id === fact.id)!.loyalty,
          praisedThisTurn: advanceCount === 0 ? fact.praisedThisTurn : false })),
        rng: { ...facts.rng, seed: rngState } });
      if (!segment.ok) return fail(`natural-segment:${segment.reason}`);
      const advanced = executePersonnelLoyaltyCommand(segment.state, { id: command.id, expectedRevision: 0, command: { type: 'AdvancePersonnelTurn' } });
      if (!advanced.ok) return fail(`natural-advance:${advanced.reason}`);
      if (advanced.state.snapshot.officers.some(officer => officer.trueLoyalty === 0)) return fail('zero-loyalty-result-excluded');
      if (advanced.state.snapshot.gold !== 0 || advanced.state.snapshot.actionPoints !== actionPoints) return fail('unexpected-natural-resource-write');
      officers = advanced.state.snapshot.officers.map(officer => ({ id: officer.id, loyalty: officer.trueLoyalty }));
      date = { ...advanced.state.snapshot.date }; rngState = advanced.state.snapshot.rng.state;
      rngDrawCount += advanced.receipt.draws.length; advanceCount++;
      internalReceipt = { segment: advanced.receipt, globalDraws: advanced.receipt.draws.map(draw => ({ ...draw, drawIndex: countBefore + draw.drawIndex })) };
    } else {
      const treasury = createInferredTreasureLedger(actionPoints, officers, items);
      if (!treasury.ok) return fail(`treasury-segment:${treasury.reason}`);
      if (command.type === 'Grant') {
        const granted = executeInferredTreasureGrant(treasury.state, { id: command.id, expectedRevision: 0,
          itemId: command.itemId, officerId: command.officerId, eligibilityConfirmed: true });
        if (!granted.ok) return fail(`grant:${granted.reason}`);
        officers = granted.officers.map(officer => ({ ...officer })); items = granted.items.map(item => ({ ...item }));
        actionPoints = granted.actionPoints; internalReceipt = granted.receipts[0]!;
      } else {
        const continuation = createInferredConfiscationLedger(treasury.state);
        if (!continuation.ok) return fail(`confiscation-segment:${continuation.reason}`);
        const confiscated = executeInferredConfiscation(continuation.state, { id: command.id, expectedRevision: 0,
          itemId: command.itemId, eligibilityConfirmed: true });
        if (!confiscated.ok) return fail(`confiscate:${confiscated.reason}`);
        officers = confiscated.officers.map(officer => ({ ...officer })); items = confiscated.items.map(item => ({ ...item }));
        actionPoints = confiscated.actionPoints; internalReceipt = confiscated.receipts[0]!;
      }
    }
    receipts.push({ id: command.id, revision: commands.length + 1, type: command.type,
      dateBefore, dateAfter: { ...date }, rngDrawCountBefore: countBefore, rngDrawCountAfter: rngDrawCount, internalReceipt });
    commands.push(command); commandIds.add(command.id);
  }
  const projections = initial.state.baseStats.map(base => {
    const bonuses: Stats = { leadership: 0, war: 0, intelligence: 0, politics: 0, charisma: 0 };
    const sourceEffects = items.filter(item => item.holder === base.officerId).map(item => {
      const binding = initial.state.equipment.find(row => row.itemId === item.id)!;
      for (const stat of STATS) bonuses[stat] = Math.max(bonuses[stat], binding.inferredBonuses[stat]);
      const row = binding.sourceIndex === null ? null : treasureCatalog.treasures[binding.sourceIndex]!;
      return { itemId: item.id, sourceIndex: binding.sourceIndex, sourceName: row?.name ?? null,
        documentedEffect: row?.effect ?? null, effectExecuted: false as const };
    });
    const effective: Stats = { ...base.stats };
    for (const stat of STATS) effective[stat] = Math.min(255, base.stats[stat] + bonuses[stat]);
    return { officerId: base.officerId, trueLoyalty: officers.find(officer => officer.id === base.officerId)!.loyalty,
      base: base.stats, inferredBonuses: bonuses, effective, sourceEffects };
  });
  return freeze({ ok: true as const, state: { schema: 'inferred-treasure-unified-session-v2' as const, initialSession: initial.state, commands },
    revision: commands.length, date, advanceCount, rng: { state: rngState, drawCount: rngDrawCount },
    officers, items, actionPoints, projections, receipts,
    equipmentPolicy: 'explicit-max-per-stat-cap255-view-v1' as const, currentStateAuthority: 'outer-journal-derived-only' as const,
    permanentAttributesModified: false as const, oldHistoryRewritten: false as const, campaignWorldWritten: false as const });
}
export function readInferredUnifiedTreasureSession(input: unknown) {
  try { return replay(detach(input)); } catch { return fail('invalid-data-input'); }
}
export function createInferredUnifiedTreasureSession(initialConfiscation: unknown, personnelScenario: unknown, baseStats: unknown, equipment: unknown) {
  const initial = createInferredTreasureTurnSession(initialConfiscation, personnelScenario, baseStats, equipment);
  if (!initial.ok) return initial;
  return readInferredUnifiedTreasureSession({ schema: 'inferred-treasure-unified-session-v2', initialSession: initial.state, commands: [] });
}
export function executeInferredUnifiedTreasureCommand(input: unknown, rawCommand: unknown) {
  const current = readInferredUnifiedTreasureSession(input);
  if (!current.ok) return current;
  let clean: unknown; try { clean = detach(rawCommand); } catch { return fail('invalid-command-data'); }
  const command = commandFrom(clean);
  if (!command || command.expectedRevision !== current.revision || current.revision >= 128) return fail('invalid-command-or-capacity');
  return readInferredUnifiedTreasureSession({ ...current.state, commands: [...current.state.commands, command] });
}
export function saveInferredUnifiedTreasureSession(input: unknown) {
  const result = readInferredUnifiedTreasureSession(input);
  if (!result.ok) return result;
  const json = JSON.stringify(result.state);
  return json.length <= 2000000 ? freeze({ ok: true as const, json }) : fail('save-capacity');
}
export function loadInferredUnifiedTreasureSession(json: unknown) {
  if (typeof json !== 'string' || json.length > 2000000) return fail('invalid-save');
  try { return readInferredUnifiedTreasureSession(JSON.parse(json)); } catch { return fail('invalid-save'); }
}
