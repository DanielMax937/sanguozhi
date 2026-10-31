# T03 fixed enemy-city scalar rumor in the single resource owner

Dependency: the frozen safe-season candidate layered on the reviewed F/H/G and office owner chain; reconcile the actual predecessor main and final hashes before publication. This optional capability adds no second home ledger or additional clock. Existing roots without it preserve their exact shape and behavior.

## Explicit target, not the home city renamed enemy

Optional `rumorConfig` has exactly:
```
{profile:'unified-fixed-enemy-city-rumor-v1',
 targetForce:{id,rulerId},
 targetCity:{id,security,defense:{governorId,strategistId,
   governorIntelligence,rulerIntelligence,strategistIntelligence}},
 targetOfficers:[{id,trueLoyalty,giriInternal}],
 relations:{likes:[{from,to}],spouses:[[id,id]],swornSiblings:[[id,id]]},seed}
```
Requires current progress/PK and an explicit encounter. Target force ID must equal that encounter's enemy owner; the target city is a separate immutable synthetic location. Target city/ruler/governor/strategist/ordinary target officers have distinct synthetic IDs and cannot alias any home city/force/corps/episode/person/facility, field enemy actor, map/cell, item, transport, bound traveler, economic facility, hazard or encounter ID. Their relationship facts are limited to this fixed target personnel set and validated by the actual rumor service. They are not declared to be the same people as battlefield enemies; no invented actor mapping or ownership writer is installed.

The initial target security0..100, positive true loyalty1..255, giri0..4, defense intelligence0..100, relationships and nonzero seed are explicit synthetic scenario facts, not native scenario recovery. The new metadata has one current target security and each target loyalty, plus the continuous RNG state/count. Original values remain only in genesis for replay. There is no enemy city gold, troops, payroll or AI created by this scalar capability.

## Actual typed AttemptRumor and unique home costs

The only new action is `AttemptRumor{actorId}`. The actor must be a real configured **ordinary (non-ruler)** home officer, available, resident (not deployed/traveling/away), unreserved and not already acted this turn. Neither target balances, success probability, random sample, actor intelligence nor caller eligibility are accepted in the action.

The proposal uses current unique home gold/AP, actual date, current actor effective intelligence from the T28/PK getter and the real acted marker. The actual metadata rulerId is explicitly excluded from both the creation probe and AttemptRumor; a configuration with no ordinary actors is rejected, never relabeled to pass the old service. All initial ordinary home actor intelligence values must satisfy the original rumor kernel's0..100 domain; later out-of-domain effective values reject the attempt rather than clip or pretend the item is absent. The finite origin profile has no strategy-office facility, so hasStrategyOffice is fixed false, not a free caller-provided boost. Only the selected qualified actor is put into the temporary ordinary-resident projection. No other deployed officer is falsely labeled eligible.

`projectSyntheticRumorScalar` invokes the existing registered scalar service. Actual probability success **or failure** consumes its gold200/AP30 and actor action, advances the same dedicated RNG and records actual security/loyalty effects. A target true loyalty reaching0 rejects the whole event; capture, departure, allegiance changes, diplomacy, health, XP/merit/TP and bandit consequences remain excluded. Security0 alone is a scalar value, not automatic conquest or another world event. The source policy's probability, susceptibility and selection rules are explicitly synthetic; official cost/direction evidence does not establish original success formulas.

The returned home patch writes the sole city ledger and the same officer actedTurn. Target patch writes only that target's current scalars. RNG starts each proposal at the previous current word, and cumulative drawCount/global-indexed draw evidence is retained—never reseeded from the original seed per attempt. The local service projection has revision/turn0; the outer receipt records the actual world date/turn and full deterministic outer history, so local indices are not misrepresented as global chronology. Parent command IDs/revisions and finite history prevent replay-spending.

## Tick, atomicity and persistence

No AdvanceRumorTurn or target-turn command is exposed. Existing WorldTick clears the home action lock through the existing city owner; target scalars/RNG remain unchanged unless an actual rumor attempt commits. The internal field facts-only step remains part of each outer command, so its journal and clocks stay coordinated without changing field balances. Ordinary completion/travel tail reservations and32-command/byte limits still apply.

The outer root stores explicit genesis plus all original commands and regenerates every proposal from them. It never trusts uploaded target snapshots, private helper brands, receipts, a second home account or arbitrary deltas. If helper validation, costs, positive loyalty, source domain, sibling field step, reserved capacity or final serialization fails, no origin cost/action, target scalar or random draw commits. Probability failure is distinct from transaction rejection and is correctly charged.

The linked `synthetic-personnel-scalar-bridges-v1.md` records actual source API and source boundaries. This is a finite safe scalar integration, not the original global Rumor command, real-person modification or full two-city simulation. P078, Closing, casualties and zero-loyalty ownership finalizers are not called. Static work only; no tests, typecheck, build or candidate execution.
