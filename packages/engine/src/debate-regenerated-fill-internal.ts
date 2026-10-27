/**
 * Trusted internal vacancy fill for a bounded regenerated round. Not a public
 * admission point and not the current-deck-v1 hand-fill contract. The enclosing
 * transaction must detach/validate every input and discard all work on failure.
 * No session state, caller callback or RNG; generation, repair and sorting are
 * delegated to their unchanged kernels rather than duplicated here.
 */
import {
  evaluateDebateDeckGenerate,
  DEBATE_DECK_GENERATE_POLICY_V1,
  type DebateDeckGenerateCardCodeV1,
  type DebateDeckGenerateRhetoricCardCodeV1,
  type DebateDeckGenerateRawDrawV1,
  type DebateDeckGenerateReceiptV1,
  type DebateDeckGenerateFailureV1,
} from './debate-deck-generate.ts';
import {
  completeDebateHandFill,
  type DebateFillCompletionRawDraw,
  type DebateFillCompletionResult,
  type DebateFillCompletionSlot,
} from './debate-hand-fill-completion.ts';

type Card = DebateDeckGenerateCardCodeV1;
type RhetoricCard = DebateDeckGenerateRhetoricCardCodeV1;
type RepairDraw = DebateFillCompletionRawDraw;

export type RegeneratedDebateFillInput = {
  readonly playableSlots: readonly (Card | null)[];
  readonly cardTape: readonly Card[];
  readonly deckCursor: number;
  readonly rhetoricCards: readonly RhetoricCard[];
  /** Null means no generation packet. An empty packet is not absence. */
  readonly generationRawDraws: readonly DebateDeckGenerateRawDrawV1[] | null;
  readonly rawDraws: readonly RepairDraw[];
};
export type RegeneratedDebateFillSlot = DebateFillCompletionSlot & {
  origin: 'reserved-rethink' | 'retained' | 'tape';
  /** Relative to this fill: current includes a prior stage's generated deck. */
  deckSource: 'current' | 'generated' | null;
  tapeIndex: number | null;
};
export type RegeneratedDebateFillGeneration = {
  triggerPreSortSlot: number;
  before: { cardTape: Card[]; deckCursor: 18; rhetoricCards: RhetoricCard[] };
  after: { cardTape: Card[]; deckCursor: 0; rhetoricCards: RhetoricCard[] };
  /** Unchanged complete generator audit; generation itself never resets index. */
  generation: DebateDeckGenerateReceiptV1;
  cursorReset: { before: 18; after: 0; afterGenerationSuccess: true };
};
export type RegeneratedDebateFillReceipt = DebateFillCompletionResult<RegeneratedDebateFillSlot> & {
  kind: 'bounded-regenerated-fill-internal';
  before: { playableSlots: (Card | null)[]; cardTape: Card[]; deckCursor: number; rhetoricCards: RhetoricCard[] };
  after: { hand: [0, ...Card[]]; cardTape: Card[]; deckCursor: number; rhetoricCards: RhetoricCard[] };
  reservedSlot: { preSortSlot: 0; card: 0 };
  filled: { preSortSlot: number; deckSource: 'current' | 'generated'; tapeIndex: number; card: Card }[];
  generation: RegeneratedDebateFillGeneration | null;
  generationPacketProvided: boolean;
  generationDrawCount: number;
  /** Complete generation draws, then at most one repair; no events discarded. */
  randomEvents: (
    | { index: number; phase: 'deck-generation'; localIndex: number; draw: DebateDeckGenerateRawDrawV1 }
    | { index: number; phase: 'fill-topic-repair'; localIndex: 0; draw: RepairDraw }
  )[];
  externalRngConsumed: 0;
};
export type RegeneratedDebateFillSuccess = {
  ok: true;
  hand: [0, ...Card[]];
  deckCursor: number;
  cardTape: Card[];
  rhetoricCards: RhetoricCard[];
  receipt: RegeneratedDebateFillReceipt;
};
export type RegeneratedDebateFillFailure =
  | { ok: false; reason: 'deck-generation-failure'; dependencyFailure: DebateDeckGenerateFailureV1 }
  | { ok: false; reason: 'missing-generation-packet' | 'unused-generation-packet' | 'generation-limit'
      | 'missing-raw-draw' | 'unexpected-raw-draw' | 'invalid-raw-draw' };
export type RegeneratedDebateFillResult = RegeneratedDebateFillSuccess | RegeneratedDebateFillFailure;

class FillFailure extends Error {
  readonly failure: RegeneratedDebateFillFailure;
  constructor(failure: RegeneratedDebateFillFailure) { super(failure.reason); this.failure = failure; }
}
function abort(failure: RegeneratedDebateFillFailure): never { throw new FillFailure(failure); }

/**
 * Typed inputs are trusted detached data, never raw user objects. Semantic
 * demand remains local: packet consumption occurs only at a vacant slot with
 * index 18, and topic completion occurs once after every vacancy is filled.
 * Result is internal mutable data; the owning transaction freezes publication.
 */
export function fillRegeneratedDebateHandInternal(input: RegeneratedDebateFillInput): RegeneratedDebateFillResult {
  try {
    let cardTape = input.cardTape.slice();
    let rhetoricCards = input.rhetoricCards.slice();
    let deckCursor = input.deckCursor;
    let generation: RegeneratedDebateFillGeneration | null = null;
    let lastNewSlot: number | null = null;
    const filled: RegeneratedDebateFillReceipt['filled'] = [];
    const slots: RegeneratedDebateFillSlot[] = [{
      preSortSlot: 0, origin: 'reserved-rethink', deckSource: null, tapeIndex: null,
      originalCard: 0, card: 0, topicRepairApplied: false,
    }];

    for (let inputIndex = 0; inputIndex < input.playableSlots.length; inputIndex++) {
      const preSortSlot = inputIndex + 1;
      const retained = input.playableSlots[inputIndex]!;
      if (retained !== null) {
        slots.push({ preSortSlot, origin: 'retained', deckSource: null, tapeIndex: null,
          originalCard: retained, card: retained, topicRepairApplied: false });
        continue;
      }
      if (deckCursor === 18) {
        if (generation !== null) abort({ ok: false, reason: 'generation-limit' });
        if (input.generationRawDraws === null) abort({ ok: false, reason: 'missing-generation-packet' });
        const oldDeck = cardTape.slice();
        const oldPool = rhetoricCards.slice();
        const generated = evaluateDebateDeckGenerate({
          schemaVersion: 1, profile: 'debate-deck-generate-reference-v1',
          policies: DEBATE_DECK_GENERATE_POLICY_V1,
          rhetoricCards,
          rawDraws: input.generationRawDraws,
        });
        if (!generated.ok) abort({ ok: false, reason: 'deck-generation-failure', dependencyFailure: generated });
        // Source Generate mutates the actual deck and active rhetoric order.
        // Reset belongs to this successful exhaustion branch, never Generate.
        cardTape = generated.deck.slice();
        rhetoricCards = generated.rhetoricCards.slice();
        deckCursor = 0;
        generation = {
          triggerPreSortSlot: preSortSlot,
          before: { cardTape: oldDeck, deckCursor: 18, rhetoricCards: oldPool },
          after: { cardTape: cardTape.slice(), deckCursor: 0, rhetoricCards: rhetoricCards.slice() },
          generation: generated.receipt,
          cursorReset: { before: 18, after: 0, afterGenerationSuccess: true },
        };
      }
      const tapeIndex = deckCursor;
      const card = cardTape[tapeIndex]!;
      const deckSource = generation === null ? 'current' as const : 'generated' as const;
      deckCursor++;
      slots.push({ preSortSlot, origin: 'tape', deckSource, tapeIndex,
        originalCard: card, card, topicRepairApplied: false });
      filled.push({ preSortSlot, deckSource, tapeIndex, card });
      lastNewSlot = preSortSlot;
    }
    if (generation === null && input.generationRawDraws !== null) abort({ ok: false, reason: 'unused-generation-packet' });

    // No repair or sorting before the complete source fill, including boundary.
    const completion = completeDebateHandFill(slots, lastNewSlot, {
      consumeRepairDraw: () => {
        if (input.rawDraws.length === 0) abort({ ok: false, reason: 'missing-raw-draw' });
        if (input.rawDraws.length !== 1) abort({ ok: false, reason: 'unexpected-raw-draw' });
        const draw = input.rawDraws[0]!;
        if (draw.role !== 'debate-fill-topic-repair' || draw.bound !== 9 || !Number.isInteger(draw.value)
          || draw.value < 0 || draw.value > 8 || Object.is(draw.value, -0)) abort({ ok: false, reason: 'invalid-raw-draw' });
        return { role: draw.role, bound: draw.bound, value: draw.value };
      },
      skipRepair: () => {
        if (input.rawDraws.length !== 0) abort({ ok: false, reason: 'unexpected-raw-draw' });
      },
    });
    const randomEvents: RegeneratedDebateFillReceipt['randomEvents'] = [];
    if (generation !== null) {
      for (const [localIndex, draw] of generation.generation.consumedDraws.entries()) {
        randomEvents.push({ index: randomEvents.length, phase: 'deck-generation', localIndex, draw });
      }
    }
    for (const draw of completion.consumedDraws) {
      randomEvents.push({ index: randomEvents.length, phase: 'fill-topic-repair', localIndex: 0, draw });
    }
    const receipt: RegeneratedDebateFillReceipt = {
      ...completion,
      kind: 'bounded-regenerated-fill-internal',
      before: { playableSlots: input.playableSlots.slice(), cardTape: input.cardTape.slice(),
        deckCursor: input.deckCursor, rhetoricCards: input.rhetoricCards.slice() },
      after: { hand: [...completion.hand], cardTape: cardTape.slice(), deckCursor, rhetoricCards: rhetoricCards.slice() },
      reservedSlot: { preSortSlot: 0, card: 0 }, filled, generation,
      generationPacketProvided: input.generationRawDraws !== null,
      generationDrawCount: generation?.generation.drawCounts.total ?? 0,
      randomEvents, externalRngConsumed: 0,
    };
    return { ok: true, hand: [...completion.hand], deckCursor, cardTape, rhetoricCards, receipt };
  } catch (error) {
    if (error instanceof FillFailure) return error.failure;
    // Unexpected internal errors are not relabelled as a successful fill.
    throw error;
  }
}
