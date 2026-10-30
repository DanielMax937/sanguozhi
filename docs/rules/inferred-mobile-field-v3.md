# Synthetic mobile field v3: one actor, location, action and movement budget

## Evidence and scope

Additive opt-in `inferred-mobile-field.ts`; old dynamic field v2 and unified field v1 stay unchanged. The basis was read from main `f132870bb58505acd0572c23e3ba91592eefa849`: `packages/engine/src/supplied-map-movement.ts` Git blob `e338cdcdfffb1086f3bb66fe7abc9a8ca06d92f7`, and dynamic field blob `9e8a17416ca9f236d9e3ba96c1eeba5119e35645`. This adapter imports **the existing** `moveOnSuppliedMap` and `GUIDE_REFERENCE_MOVEMENT_POLICY`; it does not copy a new movement-cost algorithm or claim a native map.

The reused kernel consumes supplied directed adjacency; unknown/null terrain costs reject. It chooses land/naval rows by terrain 7/8; fire mask multiplies the captured base AL byte by four with existing low-byte semantics. Guide policy rows are explicitly reference rows, not claimed binary dumps. Per-actor turn budgets, equipment choices, map topology, consuming a whole action for one nonempty path, and fixed entry deployment are explicit synthetic engineering choices. No pathfinding is introduced.

## Fixed input contract

`createInferredMobileField(cells, templates, movementMap, movementProfiles)` with corresponding `read/execute/save/loadInferredMobileField` functions.

Exact state `{schema:'inferred-mobile-field-v3',cells,templates,movementMap,movementProfiles,commands}`. Templates are unchanged from v2: `{id,entryCellId,intelligence,strategies,available,immune,guaranteed,beautyBonus}`. All start resident, unacted and without resource balances.

`movementMap={id,cells:[{id,terrainInfoU32,adjacent,blocked,unsupportedContext,facilityPresent}]}`. Its cells have exactly the same IDs in the same order as field cells (1..16); terrainInfo is uint32; adjacency contains unique known cell IDs, <=16, no self-edge. Map metadata are fixed at genesis. No caller-supplied occupied/flags/fire bitmap is accepted. Entry cells must not be blocked, unsupported, or facilities. Other cells may carry those exclusion markers, but cannot be entered by Move. The map is replaceable supplied data, never original geography evidence.

`movementProfiles=[{actorId,landEquipmentId,navalEquipmentId,turnBudget}]` match the 1..8 templates one-to-one in the same order. Land equipment 0..8, naval equipment 9..11, budget 1..255. These are fixed movement resolution selectors, not a new equipment inventory or equipment-production claim. Tactical actors always pass `transport:false`; no transport/capture/finalizer semantics are added. Custom policy/cost tables are not accepted.

## Typed Move and canonical owner

New action `{kind:'Move',actorId,path}` in the existing `{id,expectedRevision,action}` envelope. Path must have 1..16 synthetic cell IDs; no empty action. Caster/actor must be deployed, not acted, and not confused. Starting cell and every requested destination must exist and must not be a facility or unsupported context. The reused kernel then validates directed edges, blocked cells, current occupancy, known cost and sufficient budget for the **entire** route. Invalid routes return no committed change.

Occupancy is derived on each command from other currently deployed actors' authoritative roster positions. Residents do not occupy cells; the moving actor's own prior location is not an obstacle. Fixed map cannot override occupancy. Fire flags are derived from current active fires (`0x00800000` or zero), never supplied separately. The receipt includes the reused movement request, steps and spending so all costs/flags are auditable.

The deployed role now owns one `movementBudget` alongside its existing single `cellId/troops/energy/acted/confusedTurns`. Successful Move writes only its returned location/budget and acted=true. No duplicate mobile account or independent balance is persisted. Cast/FireCast retain location and movementBudget through projections, and use the same acted flag; therefore Move then Cast, Cast then Move, and repeated Move in one turn reject. Deploy initializes the fixed profile budget but already consumes acted, so cannot be used for immediate movement. Return still requires the fixed entry cell, unacted and normal status; it does not teleport a distant unit home. A successful Move back to entry consumes acted, so Return awaits a later WorldTick.

FieldTick retains the previous atomic standing-fire loss/lifetime and confusion/acted recovery and restores each deployed unit's movementBudget to its fixed profile turnBudget. Resident has no movement balance. Empty-deployed Tick still requires empty draws and advances existing fires without fake targets. No energy or troops regenerate. Fire position and all used fire IDs/duration samples remain in complete history when an actor moves or returns.

The supplied movement kernel is movement-cost-only. This adapter does **not** infer immediate entry/exit fire damage or native cell-entry event writers: movement through active fire affects costs; standing-fire damage occurs on the subsequent authoritative FieldTick if still occupying fire. It does not move fires, extinguish them, generate RNG, trigger capture, enter a city, end/destroy units, or mutate real officer ownership. These limitations must not be reported as native event integration.

## Replay and world boundary

Same bounded descriptor validation/full genesis+command replay as v2: <=32 commands, unique command IDs and exact revisions, save <=100000 characters, 10000 descriptor nodes, depth12, string budget100000, arrays<=256. All role/movement transitions count against the same 32 commands. Cumulative fire damage events remain <=256 and never reset by Move/Deploy/Return. Every damage result must leave positive troops, otherwise the whole command/Tick fails. Frozen derived outputs are not accepted as authoritative input. Standard JSON.parse duplicate-key behavior and browser Proxy detection limitations are unchanged; this is not an anti-cheat boundary.

Field service retains `proposalOnly:true` and `cityConservationVerified:false`. Central world must continue the reviewed city inventory debit/return, reservation checks, same actor action locks, inherited city morale and weighted return morale, and one shared WorldTick. It must accept typed Move, not arbitrary nested commands or standalone FieldTick bypass. The world should replay the same four genesis arguments, never recreate field state from current snapshots. No P078, Closing, real person or zero-troop finalizer path is invoked.

Static acceptance targets: directed nonedge/blocked/occupied/facility/unsupported/null cost/overbudget reject atomically; active fire changes reused movement cost; moving changes subsequent fire occupancy and strategy cell queries; same-turn double actions reject; Tick restores only movement budget and action/status as specified; all Cast projections preserve budget; Return requires entry; malformed map/profile and descriptor inputs reject; old v2 state is not silently migrated. Candidate/tests/typecheck/build were not executed.
