/** Private Train-only projection. The replay owner supplies the sole current ledger. */
import { DEFAULT_ADAPTERS, executeCommand } from '../engine.ts';
import { moraleCap } from '../calculations.ts';
import { validateState } from '../state.ts';
import type { GameState } from '../types.ts';
import { detachBoundedCityData } from './bounded-city-json.ts';

export type SyntheticTrainingBindings = Readonly<{
  cityId: string; forceId: string; turn: number; trainingUsedTurn: number | null;
  officers: readonly Readonly<{ id: string; role: 'resident' | 'deployed'; reservationJobId: string | null; actedTurn: number | null }>[];
}>;
export type SyntheticTrainingAction = Readonly<{ kind: 'Train'; officerIds: readonly string[] }>;
const fail = (reason: string) => Object.freeze({ ok: false as const, reason });
const record = (v: unknown): v is Record<string, unknown> => v !== null && typeof v === 'object' && !Array.isArray(v);
const exact = (v: Record<string, unknown>, keys: readonly string[]) => Object.keys(v).length === keys.length && keys.every(k => Object.hasOwn(v, k));
const synthetic = (v: unknown): v is string => typeof v === 'string' && /^synthetic-[a-z0-9-]{1,48}$/.test(v);
const uint = (v: unknown): v is number => typeof v === 'number' && Number.isSafeInteger(v) && !Object.is(v, -0) && v >= 0;
const marker = (v: unknown, turn: number) => v === null || (uint(v) && v <= turn);
function freeze<T>(value: T): Readonly<T> {
  if (value !== null && typeof value === 'object') { for (const child of Object.values(value)) freeze(child); Object.freeze(value); }
  return value;
}
function plan(rawState: unknown, rawBindings: unknown, rawAction: unknown, expanded = false) {
  if (validateState(rawState, DEFAULT_ADAPTERS).length) return fail('invalid-training-projection');
  const state = rawState as GameState;
  if (state.bases.length !== 1 || state.officers.length > 32 || state.bases[0]!.kind !== 'city'
    || ![state.force.id, state.corps.id, state.bases[0]!.id, ...state.officers.map(o => o.id)].every(synthetic)) return fail('unsupported-training-scope');
  const identities = [state.force.id, state.corps.id, state.bases[0]!.id, ...state.officers.map(o => o.id)];
  if (new Set(identities).size !== identities.length) return fail('training-identity-collision');
  const base = state.bases[0]!;
  // Deliberately reject incompatible domains; never clamp an existing balance or silently drop a technique.
  if (base.morale > (expanded ? moraleCap(state) : 100) || moraleCap(state) > (expanded ? 120 : 100) || state.officers.some(o => o.merit > 60000)) return fail('incompatible-training-domain');
  if (!record(rawBindings) || !exact(rawBindings, ['cityId', 'forceId', 'turn', 'trainingUsedTurn', 'officers'])
    || rawBindings.cityId !== base.id || rawBindings.forceId !== state.force.id || rawBindings.turn !== state.turn
    || !marker(rawBindings.trainingUsedTurn, state.turn) || !Array.isArray(rawBindings.officers)
    || rawBindings.officers.length !== state.officers.length
    || base.trainingCompleted !== (rawBindings.trainingUsedTurn === state.turn)) return fail('training-owner-binding-mismatch');
  const rows = new Map<string, { role: 'resident' | 'deployed'; reservationJobId: string | null; actedTurn: number | null }>();
  for (const row of rawBindings.officers) {
    if (!record(row) || !exact(row, ['id', 'role', 'reservationJobId', 'actedTurn']) || !synthetic(row.id)
      || rows.has(row.id) || (row.role !== 'resident' && row.role !== 'deployed')
      || !(row.reservationJobId === null || (typeof row.reservationJobId === 'string' && /^[a-zA-Z0-9:_-]{1,128}$/.test(row.reservationJobId))) || !marker(row.actedTurn, state.turn)) return fail('invalid-training-officer-binding');
    const officer = state.officers.find(o => o.id === row.id);
    if (!officer || officer.baseId !== base.id || officer.forceId !== state.force.id
      || officer.acted !== (row.actedTurn === state.turn)
      || (row.role === 'deployed' ? officer.location !== 'unit' : officer.location === 'unit')) return fail('training-officer-projection-mismatch');
    rows.set(row.id, { role: row.role, reservationJobId: row.reservationJobId as string | null, actedTurn: row.actedTurn as number | null });
  }
  if (!record(rawAction) || !exact(rawAction, ['kind', 'officerIds']) || rawAction.kind !== 'Train'
    || !Array.isArray(rawAction.officerIds) || rawAction.officerIds.length < 1 || rawAction.officerIds.length > 3
    || !rawAction.officerIds.every(synthetic) || new Set(rawAction.officerIds).size !== rawAction.officerIds.length) return fail('invalid-training-action');
  const officerIds = rawAction.officerIds as string[];
  for (const id of officerIds) {
    const binding = rows.get(id);
    if (!binding || binding.role !== 'resident' || binding.reservationJobId !== null || binding.actedTurn === state.turn) return fail('training-actor-unavailable');
  }
  const result = executeCommand(state, { type: 'Train', baseId: base.id, officerIds }, DEFAULT_ADAPTERS);
  if (!result.ok) return freeze({ ok: false as const, reason: 'training-command-rejected', reasons: result.reasons });
  const next = result.state;
  return freeze({ ok: true as const, policyId: expanded ? 'synthetic-owner-train-tech16-domain120-v1' as const : 'synthetic-owner-train-domain100-v1' as const,
    patch: { morale: next.bases[0]!.morale, actionPoints: next.corps.actionPoints, techniquePoints: next.force.techniquePoints,
      trainingUsedTurn: state.turn,
      officers: officerIds.map(id => { const officer = next.officers.find(o => o.id === id)!;
        return { id, warXp: officer.warXp, war: officer.war, merit: officer.merit, actedTurn: state.turn }; }) },
    receipt: { calculation: result.calculation, evidence: result.evidence, rngDraws: result.rngDraws } });
}
/** No independent state, no arbitrary patches, no EndTurn, no external callbacks. */
export function planSyntheticTrainingBridge(rawGameState: unknown, rawBindings: unknown, rawAction: unknown) {
  try {
    const detached = detachBoundedCityData([rawGameState, rawBindings, rawAction]);
    if (!detached.ok || !Array.isArray(detached.value)) return fail('invalid-training-data');
    return plan(detached.value[0], detached.value[1], detached.value[2]);
  } catch { return fail('invalid-training-data'); }
}


/** Private owner projection; actual GameState technique16 determines 100/120. No cap credit. */
export function planSyntheticTrainingBridge120(rawGameState: unknown, rawBindings: unknown, rawAction: unknown) {
  try {
    const detached = detachBoundedCityData([rawGameState, rawBindings, rawAction]);
    if (!detached.ok || !Array.isArray(detached.value)) return fail('invalid-training-data');
    return plan(detached.value[0], detached.value[1], detached.value[2], true);
  } catch { return fail('invalid-training-data'); }
}
