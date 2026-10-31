# Final finite T32/T05 owner consumers

This local candidate layers on the fixed D/A/T03/T33/FHG chain; it is not evidence that those candidates are published. Both capabilities are opt-in on the existing mobile-resource-world-v3, with original genesis plus one outer journal and the same WorldTick. No separate new world or automatic enemy AI is introduced.

## T32 fixed home-cell gate/port durability

Optional exact `repairConfig`:
```
{profile:'inferred-fixed-home-gate-port-repair-v1', homeCellId,
 sites:[{id,kind:'gate'|'port',ownerId,cellId,capacity,durability,governorActorId}]}
```
Sites are explicit already-completed synthetic scalar facts,1..8, positive durability≤capacity, immutable identity/owner/kind/location/capacity/governor binding. All site IDs are distinct and disjoint from home/target city personnel, forces/corps/episode, ordinary/economic facilities, items, cargo, travelers, both field sides, maps/cells and hazards. Owner must be home; cellId must equal the fixed supplied homeCellId. These are not a claim of native gate/port layout or new map collision/entry/capture mechanics. The current sites list is the only durability owner; genesis values are historical inputs, not reusable repair credits.

On each WorldTick, after city/forge/research/PK completions and before season/income, the owner calls `projectSyntheticGatePortRepairs` once. Governor facts come from the actual current home roster: resident/deployed, availability, travel-away and permanent PK politics0..100 (not equipment255). Resident and available at this home proxy is a named inference, not proof of original physical garrison. Reservations/action marks are not cleared or charged. Multiple fixed records may share a governor under the declared proxy and do not create additional persons/actions/resources.

The existing inferred repair request computes its bounded repair; full sites or absent governors skip rather than blocking Tick. Every patch checks current durability before writing; no fee, reward, TP, new construction, damage, capacity increase, deletion or capture finalizer is invented. Any later Tick failure discards all durability changes. Source formula and original uncertainty are in `synthetic-gate-port-repair-v1.md`.

## T05 complete zero-food boundary, not a caller eligibility switch

Optional `starvationConfig:{profile:'inferred-whole-zero-food-tick-retain76-positive-v1'}` requires the existing unique field-food and PK owners. The outer root derives one metadata row per field actor with `deployedTurn` and `zeroFoodBoundaryTurn`; these are evidence/eligibility markers, not food or troop balances. They are never accepted as uploaded current state or public command inputs.

The explicit time interpretation is:
- Independently initialized enemy actors are already deployed at initial boundary turn0. If their explicit initial food is0, that is a zero-food turn0 boundary and the first following Tick can be eligible.
- A home actor newly deployed during turnT—even with food0—did not exist in the deployed roster at the preceding settled boundary. Deploy records deployedTurn=T but clears the zero-food boundary. Its first Tick does not receive a full-period starvation charge. If still deployed/food0 at that Tick's end, the new boundary is recorded for the following interval.
- Any successful field-food patch giving positive food clears the boundary evidence immediately. Losing the food again later in the same turn does not revive the older marker; a new settled zero-food boundary is needed. Return clears deployment/boundary evidence entirely; redeployment starts anew.
- Immediately before field Tick, eligible IDs are derived from the prior settled boundary matching field.turn, the same current deployment, current deployed role and current food0. Food consumed from a positive stock to0 in this Tick has no matching zero boundary and is not charged until a later complete interval.

The private field OuterStep receives only that derived finite boundary proposal plus the current complete allocation list. Public Field cannot supply eligibility or troop deltas. Field applies the actual stationed-fire phase once, then the strict positive starvation proposal to that post-fire current roster, then the existing status recovery/action restoration phase. Thus no troop amount from an independent old snapshot overwrites fire damage. Each eligible actor consumes `projectInferredStarvation(currentTroops,1)` once; retained floor76% is a **named inference** because the original starvation handler/caller remains unresolved. It is not a newly recovered original rule or a reuse of an unrelated native handler address.

All eligible targets are considered in deterministic order. If any proposed troop value is0, the whole Tick rejects—no clamping to1, skipping the dangerous actor, partial death or terminal event. Only after the field Tick succeeds does the owner record the new boundary for currently deployed food0 actors. Historical boundary receipts are copied, not mutated by later supply/deployment.

## One transaction and bounded truth

Sites, food, troops, actions, RNG, jobs and dates commit under one outer result. Failed repair/food/fire/starvation/recovery, date/horizon or output budget leaves every prior accepted state unchanged. There is no extra Advance, no repeat charge for a duplicate command and no standalone arbitrary-damage route. Saved roots replay the original complete history to reconstruct markers and current resources. Existing finite command/byte budgets still apply, including the additional internal evidence; early budget rejection is not a successful partial Tick.

The capabilities close only these explicitly inferred positive-value consumers. They do not implement starvation injury/death, zero durability/capture, real ownership changes, map-native ports, P078, Closing, or unspecified global campaign finalizers. Static implementation only: no tests, typecheck, build or candidate execution.
