/**
 * Internal post-fill completion shared by the current-deck kernel and the
 * regenerated session. This is not a separately admitted public profile.
 *
 * Callers own strict input validation, all vacancy drawing, deck generation,
 * cursor/provenance tracking and atomic persistence. Call only after EVERY
 * playable source slot has been filled, including across any deck boundary.
 * The supplied slots are detached caller-owned working data, ordered by their
 * original source slot, with reserved zero at index zero. Callback functions
 * are trusted internal closures, never caller-supplied executable input.
 */
type CardCode = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14;
type TopicCardCode = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
type SourceCardCode = 0 | CardCode;
type Hand = [0, ...CardCode[]];

export type DebateFillCompletionSlot = {
  preSortSlot: number;
  originalCard: SourceCardCode;
  card: SourceCardCode;
  topicRepairApplied: boolean;
};
export type DebateFillCompletionRawDraw = {
  role: 'debate-fill-topic-repair';
  bound: 9;
  value: number;
};
export type DebateFillCompletionRepair =
  | {
      status: 'applied';
      preSortSlot: number;
      beforeCard: CardCode;
      afterCard: TopicCardCode;
      /** Local completion draw index, never an enclosing stream index. */
      drawIndex: 0;
      rawValue: number;
    }
  | { status: 'skipped'; reason: 'topic-present' | 'no-new-slot' };
export type DebateFillCompletionResult<S extends DebateFillCompletionSlot> = {
  hand: Hand;
  postFillHand: Hand;
  preSortHand: Hand;
  topicCardCountAfterFill: number;
  lastNewSlot: number | null;
  repair: DebateFillCompletionRepair;
  consumedDraws: DebateFillCompletionRawDraw[];
  drawCount: 0 | 1;
  sortedProvenance: (S & { sortedIndex: number })[];
};

/**
 * Perform one final topic repair and numeric sort for one complete source fill.
 * Repair mutates only the target's face and repair flag, preserving all generic
 * occurrence metadata. Original source order breaks equal-code audit ties; it
 * does not assert the source Array.Sort's object-identity ordering.
 *
 * The old public kernel's skipRepair rejects unused standalone repair draws
 * before sorting. A session's skipRepair is a no-op because later source phases
 * can legitimately consume the remaining operation stream.
 */
export function completeDebateHandFill<S extends DebateFillCompletionSlot>(
  slots: S[],
  lastNewSlot: number | null,
  callbacks: {
    consumeRepairDraw: () => DebateFillCompletionRawDraw;
    skipRepair: () => void;
  },
): DebateFillCompletionResult<S> {
  const postFillHand = slots.map(slot => slot.card) as Hand;
  const topicCardCountAfterFill = slots.slice(1).filter(slot => slot.card >= 1 && slot.card <= 9).length;
  const consumedDraws: DebateFillCompletionRawDraw[] = [];
  let repair: DebateFillCompletionRepair;
  if (topicCardCountAfterFill === 0 && lastNewSlot !== null) {
    const draw = callbacks.consumeRepairDraw();
    const target = slots[lastNewSlot]!;
    const beforeCard = target.card as CardCode;
    const afterCard = (1 + draw.value) as TopicCardCode;
    target.card = afterCard;
    target.topicRepairApplied = true;
    consumedDraws.push(draw);
    repair = { status: 'applied', preSortSlot: lastNewSlot, beforeCard, afterCard, drawIndex: 0, rawValue: draw.value };
  } else {
    callbacks.skipRepair();
    repair = { status: 'skipped', reason: topicCardCountAfterFill > 0 ? 'topic-present' : 'no-new-slot' };
  }

  const preSortHand = slots.map(slot => slot.card) as Hand;
  const sortedProvenance: (S & { sortedIndex: number })[] = slots
    .slice()
    .sort((left, right) => left.card - right.card || left.preSortSlot - right.preSortSlot)
    .map((slot, sortedIndex) => ({ sortedIndex, ...slot }));
  const hand = sortedProvenance.map(slot => slot.card) as Hand;
  return {
    hand,
    postFillHand,
    preSortHand,
    topicCardCountAfterFill,
    lastNewSlot,
    repair,
    consumedDraws,
    drawCount: repair.status === 'applied' ? 1 : 0,
    sortedProvenance,
  };
}
