/** One due job's inventory/reward plan. Clock, queue and lock release stay outside. */
import { freezeOwned, planRewards, writeDomestic } from './city-domestic-leaves.ts';
import type { DeepRO } from './city-service-types.ts';
import type { PieceCompletionAction, PieceCompletionContext, PieceCompletionFrame, PieceCompletionResult } from './city-piece-types.ts';

/** The owner supplies current stock and ordered current XP/merit for this job. */
export function planPieceCompletion(context: DeepRO<PieceCompletionContext>, frame: DeepRO<PieceCompletionFrame>, action: DeepRO<PieceCompletionAction>): DeepRO<PieceCompletionResult> {
  const written = writeDomestic(frame.stock.quantity, action.reservedQuantity, frame.stock.capacity, frame.policies.writer); if (!written.ok) return written;
  const inventoryWrite = written.value;
  if (inventoryWrite.actualDelta !== action.reservedQuantity) return { ok: false, reason: 'completion-reservation-mismatch' };
  const reward = planRewards(frame.people, 'piece', frame.policies.rewards); if (!reward.ok) return reward;
  return freezeOwned<PieceCompletionResult>({ ok: true, value: {
    stockAfter: { quantity: inventoryWrite.after, reserved: frame.stock.reserved - action.reservedQuantity },
    progress: reward.value.progress, completion: { jobId: action.jobId, turn: context.turn, inventoryWrite, rewards: reward.value.rewards },
  } });
}
