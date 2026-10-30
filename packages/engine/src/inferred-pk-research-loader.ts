/** Materialize a named synthetic hidden-tree choice in a NEW existing PK state.
 * Never rewrites a running state/save or the native world's random generator.
 */
import { selectInferredHiddenResearch } from './inferred-rule-requests.ts';
import { createPkAbilityLifecycle } from './pk-ability-lifecycle.ts';
import type { PkAbilityScenarioV1 } from './pk-ability-lifecycle.ts';

/** The baseline must itself be a valid explicit scenario; its hidden list is
 * deliberately replaced only in this opt-in fresh-state factory.
 */
export function createInferredSeededPkAbilityLifecycle(baseline: PkAbilityScenarioV1, seed: number) {
  const selection = selectInferredHiddenResearch(seed);
  if (!selection.ok) return Object.freeze({ ok: false as const, reason: selection.reason });
  const validated = createPkAbilityLifecycle(baseline);
  if ('ok' in validated) return Object.freeze({ ok: false as const, reason: `invalid-baseline:${validated.reason}` });
  // Work only from the consumer's detached, validated, frozen initial scenario.
  const scenario: PkAbilityScenarioV1 = { ...validated.initialScenario, hiddenSelections: selection.hiddenSelections };
  const state = createPkAbilityLifecycle(scenario);
  if ('ok' in state) return Object.freeze({ ok: false as const, reason: `generated-scenario:${state.reason}` });
  return Object.freeze({ ok: true as const, policyId: 'inferred-seeded-pk-new-state-v1' as const,
    evidence: 'explicit-design-inference' as const, state, selection,
    replacedBaselineSelections: validated.initialScenario.hiddenSelections,
    oldStateOrSaveModified: false as const, nativeRngReconstructed: false as const,
    globalWorldRngAdvanced: false as const, consumer: 'executePkAbilityCommand' as const });
}
