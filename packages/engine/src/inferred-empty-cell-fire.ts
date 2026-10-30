/** Narrow hit-to-existing-hazard adapter, not a complete strategy command. */
import { decideInferredStrategyHit } from './inferred-combat-requests.ts';
import { createHazardState, executeHazardCommand } from './terrain-hazard-lifecycle.ts';
const fail = (reason: string) => Object.freeze({ ok: false as const, reason });

export function executeInferredEmptyCellFire(input: unknown, expectedRevision: number, cellId: string,
  intelligence: number, targetIntelligence: number, roll100: number, eligibilityConfirmed: boolean,
  immune: boolean, guaranteed: boolean, beautyBonus: boolean) {
  const decision = decideInferredStrategyHit('fire', intelligence, targetIntelligence, roll100, eligibilityConfirmed, immune, guaranteed, beautyBonus);
  if (!decision.ok) return decision;
  if (!Number.isSafeInteger(expectedRevision) || Object.is(expectedRevision, -0) || expectedRevision < 0 || expectedRevision >= 0xffffffff
    || typeof cellId !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(cellId)) return fail('invalid-revision-or-cell');
  const validated = createHazardState(input);
  if (!validated.ok) return validated;
  const state = validated.state;
  if (state.revision !== expectedRevision) return fail('stale-revision');
  if (state.phase !== 'orders') return fail('out-of-phase');
  const cell = state.map.cells.find(candidate => candidate.id === cellId);
  if (!cell || cell.blocked || cell.unsupportedContext || state.unit.cellId === cellId) return fail('target-must-be-supported-empty-cell');
  if (!decision.hit) return Object.freeze({ ok: true as const, decision, state, hazardReceipt: null,
    effectApplied: false as const, campaignWorldWritten: false as const, casterCostsApplied: false as const });
  const receipt = executeHazardCommand(state, { type: 'igniteCell', expectedRevision, cellId, source: 'strategy', critical: false });
  if (!receipt.ok) return receipt;
  return Object.freeze({ ok: true as const, decision, state: receipt.after, hazardReceipt: receipt,
    effectApplied: true as const, campaignWorldWritten: false as const, casterCostsApplied: false as const });
}
