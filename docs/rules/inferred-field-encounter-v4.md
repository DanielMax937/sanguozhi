# Optional explicit two-owner encounter on cultivated field v4

This finite synthetic extension is not native enemy generation, real ownership transfer or automatic AI. It composes the existing positive-only combat kernel into the same authoritative field roster. Existing PK v4 candidate remains frozen; this is a later opt-in extension of that module, not a separate persistent battlefield or new default game mode.

## Genesis and stock provenance
The six-argument create call adds optional `encounterConfig`, default null. Old v4 saves without the field are canonically interpreted as null; existing behavior remains, except the field additionally rejects deployment onto a currently occupied or burning entry (the outer owner already requires this safety gate).

Exact configuration:
```
{id,homeOwnerId,enemyOwnerId,enemyTroopBudget,
 enemyActors:[{template,movementProfile,facts,troops,energy}],
 combatMap:{qMin,qMax,rMin,rMax,cells:[{id,q,r,terrain,height,blocked}]},
 combatActors:[{id,ownerId,weapon,panels:{normal:{attack,defense},confused:{attack,defense}}}]}
```
Enemy template/profile/facts reuse the existing fixed synthetic shapes. The top-level templates/profiles/cultivationBaseline remain **home only** for city/PK binding. Enemy genesis is separately declared, with a distinct owner ID and positive per-actor troop counts summing exactly to enemyTroopBudget (<=8,000,000; each <=1,000,000). Home+enemy total <=8. No enemy ID may equal a home actor, owner or cell. Enemy entries are distinct, supported and unblocked. Home entries may initially be occupied by enemy, but home deployment then rejects until cleared.

Enemy troops start already deployed from this explicit independent genesis, not the home city's inventory. There is no spawn/reinforce/reset command. Enemy morale is an initial 0..100 intensity, not an additive resource pool. No enemy food stock is invented; an eventual food capability must explicitly specify its own provenance. Enemy initial facts never accept home PK updates/completion events. Enemy Deploy/Return always reject; normal Move/Cast/Attack/Tick uses the same troop/energy/acted/status/position/budget owners as home. The owner must also reject enemy IDs from all home city commands, Train, Grant, Forge, office/research and traveler bindings. No implicit transfer or real-person affiliation changes occur.

`homeActorIds`, `enemyActorIds`, `enemyInitialTroopBudget` are explicit outputs for outer invariants. Outer world must check its city mapping against homeActorIds, and separately validate declared enemy genesis; it must not silently skip missing city actors from the combined roster. This field alone remains a proposal, not evidence that external home-city gates have been integrated.

## Fixed geometry, panels and attack
`Attack{actorId,targetId,attackKind:'normal-melee'|'normal-arrow'}` works as a normal field action, including in the owner-only OuterStep. The encounter must be enabled and both actual units deployed. The actual `projectNeutralFieldCombat` helper reuses `createFieldCombatStateV1` and `executeFieldCombatV1`; it rejects same-owner targets, preserves acted/status, checks actual melee/arrow range/LOS/equipment qualification, and rejects terminal zero troops and unsupported consequences. Positive melee counterattack is preserved. No reward/injury/ownership/finalizer is called. No RNG is fabricated: this neutral old-kernel profile expects no draws.

Attack takes current cellId/troops/energy/acted/confusion and currentFacts intelligence from the unique roster; the caller cannot provide a second mutable combat snapshot. Returned patches update only those actual actors' troops/energy/acted, leaving position, movement budget, status, fire history and identities unchanged. Fixed normal/confused panels and weapon are explicit synthetic initial facts, not reconstructed stats or inherited city equipment stock. All fixed combatActors must cover exactly the combined actors with matching configured owner.

The supplied combat coordinate rectangle is complete, <=16 cells, with exactly the same IDs and blocked flags as the movement map. This first neutral-ground bridge deliberately requires terrainInfoU32==0, plain combat terrain, no unsupported/facility cells, and every directed movement edge to be axial-hex adjacent using the actual combat distance. It does not invent missing reciprocal edges. Named interface mapping links movement landEquipmentId 0..4 respectively to sword/spear/halberd/crossbow/cavalry; other equipment profiles reject in this encounter. Navy equipment remains irrelevant on this plain-ground bridge. No city entry/capture is supported.

## Atomicity, replay and remaining H work
Enemy genesis, full home history, PK facts updates, attacks, movement and fires replay together. No fake per-hit acted reset or supplied derived snapshots are accepted. Every action consumes one shared 32-entry field/outer command slot. The ordinary getter and owner-only PK OuterStep phase remain unchanged. A failed combat kernel, positive-only gate or enclosing transaction yields no committed state. The outer world must derive action authority from its typed command and preserve one owner ledger.

This F batch closes only explicit enemy roster and normal attack inside the field; it does not claim world-route integration until owner consumes it. Unified false-report condition/retreat, multi-rockfall actions, terrain damage and fire-entry composition are still a separately reviewed H extension. It does not create a second confusion/false-report timer. Existing confusion is unchanged in F. No new AI, global campaign, P078, Closing, real people, terminal destroy or test execution.

Dependencies actually read: frozen PK field source SHA256 66613ea9d54ba044da1b6667bc423a3dcff7d2cea71042d275eaaeea6d0d7ae7; `internal/synthetic-neutral-combat-bridge.ts` SHA256 38411bb0605db2a28c4949ad6e7341f5649c64089a187ba88e3b64d9310a151c; actual `field-combat-lifecycle.ts` geometry/qualification; existing supplied-map movement interface. Source/native claims remain those of the reused kernels, not proof of original whole-game equivalence. Static-only candidate: no run/tests/typecheck/build or remote writes.
