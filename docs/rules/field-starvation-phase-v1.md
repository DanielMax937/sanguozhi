# T05: one field Tick, fire → positive starvation → recovery

This cumulative additive module is based on D field `f378ab24ed363bfd6d509a068ca49b16af5832fc9a822f8a0a02c24a44559210`. D/A default/profile behavior stays intact. The tenth optional creator parameter is:

`starvationProfile:{profile:'inferred-whole-zero-food-tick-retain76-positive-v1',homeOwnerId,enemyOwnerId:null|string}`.

Owners must match existing encounter and energy profile, when present; no encounter requires enemyOwnerId=null. No new actor/food pool is created. This profile additionally requires enemy genesis troops<=60000 and home Deploy troops<=60000, matching the actual T05/G leaf domain. Unsupported values reject rather than clamp. Without profile old domain/default stays unchanged.

Every enabled command remains an internal OuterStep. Only FieldTick must contain exactly one `starvationBoundary:{turnBefore,eligibleActorIds,foodAllocations:[{actorId,food}]}`. turnBefore equals actual current field turn; other actions cannot carry this marker. User public Field actions cannot inject eligibility, an arbitrary troop delta or wholeHungryTurns. The outer root alone derives eligibility from genuine zeroFoodBoundaryTurn/deployedTurn and current unique food history: new home Deploy zero skips first Tick; separately declared genesis enemy zero may startT0; any positive food gain clears evidence even if later depleted in the same turn; only a completed zero boundary qualifies. The marker and complete food allocation view are not independent proof of those facts. Whole-world replay and public routing must be independently reviewed.

## Ordered single-roster consumer

FieldTick resolves the existing actual fire lifecycle on its current positive troop roster first. Fire failure returns no state. The post-fire troop values then enter `projectSyntheticStarvationBoundary` from the independently reviewed pure leaf (source SHA2565afea996…): complete fixed current roster includes resident troops0 and deployed actual post-fire troops; exact food coverage includes resident0. Only the configured fixed owner mapping is supplied. The leaf computes actual existing `projectInferredStarvation(currentTroops,1)` (BigInt floor76%) for all eligible actors in sorted ID order. This is legacy named inference, not established native0.76 evidence.

Any projected zero rejects the whole Tick, including fire damage/lifetime, food, all other targets, RNG, recovery, date and AP proposed by the enclosing owner. No partial target list, clamp1, death/finalizer, health/person write or reward. Successful patches update only the same deployed roster troop field. Each starvation target also consumes one event in the existing shared256 hazardEvents budget; fire targets already count once before starvation. There is no new budget or independent clock. Empty deployment still validates the boundary through a no-op full resident roster; it does not invent a dummy target.

Then the existing status recovery/movement-budget reset phase runs once. With no hazard capability the existing strategy-recovery service consumes the post-starvation roster. With hazard capability the additive internal recovery entry below preserves true phase evidence. Finally the same action clock advances once and the normal PK/effective/energy after-sync occurs. There is no separately saved starvation ledger.

## Honest recovery evidence, not a relabelled fire result

Old `projectRosterRecoveryAfterFire` and its energy-cap entry require settledFirePhase.actorTroops to equal their incoming roster, and remain unchanged by default. Passing post-starvation values as though they were original fire output would be false.

The new private `projectRosterRecoveryAfterFireAndStarvation(input,derivedEnergyCaps?)` therefore requires both:
- settledFirePhase with **actual fire-result troop values**, actual remaining fire cells and actual actor IDs;
- settledStarvationPhase `{turn,troopPatches:[{actorId,troopsBefore,troopsAfter}]}` from the immediately preceding leaf result.

It verifies unique known target IDs, positive before/after<=60000, exact BigInt floor76% relation and after==incoming current troop value. Reversing those exact patches must reproduce the real settledFirePhase actorTroops vector. Unchanged actors must match their fire results exactly. Turn/IDs/current remaining fire cells still match. This marker is only internal phase consistency, not authentication of food eligibility; sole root replay remains the authority. No status countdown or second fire damage is executed during this proof. Afterwards the original status-only recovery/BFS avoids actual remaining fires, and original A cap projection applies without another energy balance.

No ordinary-mode save shape changes; profile and typed markers are included in full original journal replay/save/load. Duplicate IDs/revisions, missing or extra markers, wrong owner, incomplete food view, positive-food eligible actor, zero, shared budget exhaustion or later recovery failure all reject atomically. Whole-world integration must still verify its unique food owner/boundary metadata and commit only all-phase success.

Source dependencies: D full6-module candidate, A existing derived-cap/hazard helpers, frozen independently reviewed T05 pure leaf and its existing inferred-rule-requests projector. Only field plus this recovery entry are changed here. No candidate execution, tests, typecheck, build, remote writes, real-person effects, P078, Closing or zero termination. Module review cannot substitute for final sole world-owner review.
