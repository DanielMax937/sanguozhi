# Synthetic dynamic field proposal v2

## Status and evidence

Opt-in additive `inferred-dynamic-field.ts`; old unified field v1/defaults are unchanged. This is a **proposal-only** field service, not a standalone deployment resource owner. Output always says `proposalOnly:true`, `cityConservationVerified:false`, `campaignWorldWritten:false`, `nativeWorldVerified:false`. A successful Deploy replay proves field-side eligibility only, **not** that any city supplied troops. It must not be presented as a completed global-world integration before the centralized world bridge is reviewed.

Existing `docs/rules/06-strategy.md` describes fire/ambush costs 10 and discord 20 as 气力. Existing `docs/engine/food-supply-lifecycle.md` specifies source morale unchanged, destination troop-weighted morale, and explicitly says morale is not a conserved stock. `energy` here is the field spelling of troop morale, not an invented bank. The old food/supply policy's floor rounding is an explicit compatibility choice, not proof of original deployment/return rounding. Sorcery cost 30, ambush 300 and discord 150 losses, one-turn sorcery confusion, synthetic immunity/availability and fixed cells remain named engineering inferences from the existing field/strategy adapters. No native map, real deployment, troop death, officer movement, P078 or Closing finalizer is implemented.

## Public API and replay

`createInferredDynamicField(cells, templates)`, `readInferredDynamicField(state)`, `executeInferredDynamicField(state, command)`, `saveInferredDynamicField(state)`, `loadInferredDynamicField(json)`.

State has exactly `{schema:'inferred-dynamic-field-v2',cells,templates,commands}`. Templates have exactly `{id,entryCellId,intelligence,strategies,available,immune,guaranteed,beautyBonus}`. IDs are synthetic IDs, cells 1..16 unique, templates 1..8 unique; every entry cell exists. Intelligence 0..100; strategies unique subset of fire/ambush/discord/sorcery; flags strict booleans. Identity/entry/skills never change. All actors start resident, unacted, without troop/energy balances. No supplied runtime snapshot is accepted.

Every command is `{id,expectedRevision,action}`; IDs unique across all kinds, revision equals full history length. Maximum 32 commands, persisted text 100000 characters, descriptor clone 10000 nodes/depth12/100000 string characters, arrays <=256. Full genesis+history replay on read/execute/save/load; failure returns no partially committed state. Plain dense descriptor data only, no accessors/symbols/custom prototypes/cycles. Proxy rejection where Node runtime detector exists; browser Proxy limitations remain. Standard JSON duplicate keys use JSON.parse last-key behavior; this is not an anti-cheat/trusted-authority boundary. Returned data is recursively frozen.

## Role change proposals

- `Deploy {kind:'Deploy',actorId,troops,energy}` requires resident/unacted/available; troops 1..1000000, energy 0..100. Location is **only** fixed `entryCellId`; callers cannot choose spawn cells. Actor becomes deployed, acted=true, confusion=0.
- `Return {kind:'Return',actorId}` requires deployed/unacted/not confused, at fixed entry. It returns **all** current positive troops and remaining energy, then changes actor to resident/acted=true. The resident has no cellId/troops/energy/confusion fields. This is not setting troops to zero, destruction, real officer reassignment or return finalization.
- Transfer receipts contain `{direction:'city-to-field'|'field-to-city',troops,morale}`. They are untrusted proposals unless derived inside the centralized world replay. Return energy may be zero after legal costs; this is not a zero-troop terminal event.

### Mandatory centralized-world contract (not implemented by this module)

World Deploy takes actorId and positive troop quantity, **no caller-supplied energy**. It verifies city membership, resident role, unacted officer, no production reservation, and sufficient city troops with a positive remainder; copies current city morale into proposal energy, debits those troops once, and marks city officer acted for the current turn. World Return obtains proposal quantities from its current replay, verifies destination capacity, unreserved officer and role, credits troops once and computes new city morale using the already established weighted-floor policy and BigInt. It marks the city actor acted. City morale is not debited on Deploy and is not summed on Return. Do not invent an energyReserve.

All city actions reject deployed IDs through an exhaustive actor whitelist; resident city actions retain city eligibility checks, including the acted marker set on Return. Field action eligibility is exclusively the deployed actor's acted/energy/status. Deploy marks field acted so no immediate same-turn cast; Return marks resident acted so no immediate redeploy. The outer city marker prevents Return followed by a city action. Only WorldTick invokes both city advance and field FieldTick atomically. Reject the entire outer operation if either side fails, if a reservation exists, or if any nested budget/capacity fails. Never rebase city/field initial state or accept an externally derived transfer receipt as authorization. These required checks are not implied by field proposal success.

## Strategy and fire behavior

Cast/FireCast retain v1 exact fields, costs, hit decision and positive-loss kernels. All casters and explicit targets must currently be deployed. Residents never participate as fire targets, immunity contributors, intelligence targets, or strategy victims. Fire on an empty cell remains allowed as in v1. Positions are fixed; there is no Move/teleport interface. Multiple deployed actors may share an entry cell; all are exposed to standing fire.

`FieldTick {kind:'FieldTick',draws:[{targetId,draw}]}` advances a single turn. With deployed actors, old fire Tick validates complete standing-fire draws in stable template-filtered order, applies positive troop losses and reduces fire lifetime; then old strategy advance reduces confusion and resets acted. Residents' acted flags reset too. With no deployed actors, draws must be exactly empty; existing fire counters decrease by one and expired fires are removed. No fake target is created. No troop/energy resource is reset or regenerated by Tick.

Fire state, successful-used fire IDs (including expired fires), original durationDraw and roll samples, all role transitions and all receipts derive from the complete outer journal. Return/Deploy never erase or reroll fires or reset budgets. Transient old fire projection seeds restore remaining counters (1/2/3) only; they are not actual new Ignite events. Successful fire IDs cannot be reused after expiry or all actors return. Misses still pay cost and consume acted; failed proposals do not.

Cumulative standing-fire damage events <=256, templates<=8, cells<=16, command history<=32. Transient projections use <=16 fire seeds plus one operation; their local lifecycle budgets are not persisted or used to bypass cumulative outer limits. Every positive troop loss must leave >0; any lethal/invalid draw rejects the whole Tick/command. A city-world capacity failure must likewise discard this proposed field result.

## Static acceptance checklist

Inspect: repeat Deploy rejected; same-turn Return/redeploy rejected; resident cannot cast/be targeted; no arbitrary spawn; deployment onto existing fire retains its original remaining duration; Return does not clear fire; empty roster Tick expires fire without samples; redeploy never resets successful fire IDs/history; return amount equals current post-damage troops; consumed energy returns as current morale; misses pay once; save replays identical role/turn/budget; corrupted descriptor/revision/history rejected. Validate world-side supply/weighted-morale/production-reservation checks separately before claiming integrated deployment. No candidate code/tests/typecheck/build were executed for this batch.
