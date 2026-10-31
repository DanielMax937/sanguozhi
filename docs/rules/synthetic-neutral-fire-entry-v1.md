# Explicit neutral fire-entry inference, private proposal v1

## Evidence versus choice

Actual repository rule `39-fire-lifetime-spread-exactness.md` records address005AE540 as Fire God passing through a burning cell without troop loss, and separates fire damage from lifetime/spread. Actual source read of the [Wiki damage experiments](https://w.atwiki.jp/sangokushi11/pages/92.html), fire section lines374–390, describes ordinary fire damage around400±100 and modifiers. This is empirical material, not a complete original movement caller disassembly.

It does **not** establish every entered-cell invocation, repeated-visit behavior, exact201-valued uniform RNG, or simultaneous terrain/fire order. Existing `projectInferredStandingFire` names its scope standing fire. Existing `terrain-hazard-lifecycle.enterCells` explicitly rejects fire. Neither is relabeled or changed here.

New `inferred-neutral-fire-entry-per-visit-v1` makes the following **explicit engineering choices**: one exposure per entered active-fire cell visit; repeated visits count repeatedly; no initial-cell entry event; each consumes supplied integer0..200 and requests300+draw; no modifiers. These choices permit bounded synthetic integration but do not close original caller evidence. No sampled randomness is invented by the helper: all draw values are caller-supplied journal inputs whose exact order is checked. No spreading, chain reactions, critical duration or reignition is added.

## API and restrictions

`projectNeutralFireEntry({map,roster,fires,actorId,path,draws,eventsUsed,modifiers})` in `internal/synthetic-neutral-fire-entry.ts`.

Map and roster match the private hazard leaves: mobile-map cells, current deployed units `{id,cellId,troops,energy,acted,status,remaining}`. One canonical status is projected; no second condition balance. All IDs/positions unique, units positive, known supported nonfacility cells. Actor must be normal and unacted. Path1..16 known directed entries. Destination blocking, unsupported/facility context and another deployed actor occupancy reject the entire path. Its starting cell and **every** path cell must have terrainInfoU32 exactly0: this minimal neutral leaf rejects mixed poison/plank or other terrain rather than silently dropping non-fire exposure or inventing its precedence. Normal movement-cost projection remains a separate mandatory atomic partner.

Current fires are full `{id,cellId,remainingTicks}` records, <=16, unique known cells/IDs, counter1..3. They must come from the actual owner fire history, not a command-generated bitmap. The helper creates no fire state and returns `fireWrites:[]`; IDs, original ignition/duration samples and remaining counters remain untouched. There is no lifetime reroll or decrement during Move.

`modifiers` must have exactly `{fireGod:false,rattan:false,explosives:false,critical:false}`. A true or nonboolean declaration is rejected, not ignored. These flags must come from fixed neutral actor/scenario configuration. Fire God immunity is deliberately not claimed implemented by this neutral profile despite the source evidence. Adding modifiers later requires a separate reviewed policy.

`draws` is exactly all fire visits in path order as `{pathIndex,cellId,fireId,draw}`. Missing/extra/out-of-order/mismatched visit or fire ID rejects. A repeated cell appears with its distinct pathIndex. A unit starting on fire does not consume an entry draw unless it later re-enters that cell. Every intermediate troop value must remain>0; a lethal later step rejects the entire proposal, including earlier damage and movement.

`eventsUsed` is the outer shared hazard-event count0..256, not a new saved counter. Adding every entered-fire exposure must fit<=256; return updated eventsUsed. The owner must read/write this count from its complete journal, not reset it by creating projections. No-fire paths require empty draws and add0 events. Success returns only `{id,cellId,troops,energy,acted:true}`, effects and count; energy unchanged, no unit deletion/reward/injury.

## Central atomic integration required

The world must run movement-cost and this fire-entry proposal from the same current roster/fire snapshot, check equal final actor cell, and combine troop loss with the returned movement budget and a single acted write only after both succeed. Do not invoke this after committing Move, reset acted to obtain eligibility, or ignore a failed positive check. Any sibling failure discards the whole action.

Standing-fire Tick is still a separate later event, using the same actual fire lifetime and current occupant roster. Entry does not replace or pre-consume that Tick. Charging both an entry event and a later standing event is an explicit chosen temporal policy, not asserted original equivalence. Only the enclosing WorldTick advances fire lifetime. Existing kernel fire rejection remains intact.

Strict descriptors/bounds match private leaves (10000 nodes, depth12,100000 string chars, arrays<=256), no extra fields or derived snapshot authority. Helper is proposal-only, no persistent world, history, ownership proof, or duplicate-ID protection; the outer journal supplies those. `nativeCallerVerified:false` is always returned. Current mixed-hazard limitation is explicit and must not be represented as full original entry support. No candidate/test/build/typecheck execution, remote writes, P078, Closing, real-person migration or zero terminal writer occurred.
