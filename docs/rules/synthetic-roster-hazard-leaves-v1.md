# Private same-roster hazard leaves: non-fire entry, rockfall, false-report

Additive internal helper only: `internal/synthetic-roster-hazard-leaves.ts`. It imports actual `terrain-hazard-lifecycle` and `inferred-multi-rockfall`; no persistent field world, genesis journal, actor identity, resource inventory or independent clock is created. Each returns `proposalOnly:true/nativeWorldVerified:false`. No sealed movement/train files are changed. Parent world must atomically commit the proposal into its unique roster and full command journal, preserve all unaffected fields, reject stale/duplicate actions, and retain original RNG inputs and cumulative event counts.

## Shared strict input

Every function takes `map`, `roster`, `activeFireCellIds`, plus exact fields listed below. Map uses the mobile map DTO `{id,cells:[{id,terrainInfoU32,adjacent,blocked,unsupportedContext,facilityPresent}]}`, 1..16 unique cells with known directed edges. Roster1..8 currently deployed units is exactly `{id,cellId,troops,energy,acted,status,remaining}`. IDs and positions unique; troops1..1000000, energy0..100, remaining0..3; normal iff remaining0, otherwise status confused or false-report. Occupied cells must be supported, unblocked and without facilities. Fire IDs must be unique known cells.

This DTO is a **temporary projection of one canonical condition**; it does not add a second status ledger beside confusedTurns. Future owner should use a condition union, with any compatibility confusedTurns output derived only. Current mobile roster does not yet support false-report; these leaves alone do not change that fact. Old status/remaining DTO is passed into and returned from the actual kernel without disguising confusion as false-report.

Inputs are bounded plain descriptor data (10000 nodes/depth12/100000 string characters; arrays<=256), detached before reads; malformed/extra keys, accessors, symbols, cycles and invalid enums reject. No runtime candidate/testing/typecheck/build was performed. No permission/identity/stock provenance is inferred from helper success.

## projectRosterTerrainEntry

Additional exact fields: `{actorId,traits:{traverse,antidote,difficultMarch},path,draws}`. Path1..16 IDs; draws are sequential integers0..199, <=16. Actor must be normal/unacted. Other deployed units block the whole path. Any current or entered active-fire cell rejects with `unsupported-fire-entry`; fire is never removed to evade the old kernel's unsupported-fire gate. Facilities project as blocked. Directed adjacency, terrain exposure, immunity, positive troops and the full route are checked by actual `enterCells`.

Existing kernel semantics: terrain11 requests100+draw, terrain4 requests200+draw, draw bound200; traverse/difficultMarch immunize11, antidote immunizes4. Every consumed draw follows actual path order, including repeated qualifying visits. Too few draws fail in the kernel; unused extra draws reject in this adapter. Every intermediate troop value must remain positive, otherwise whole path fails. Energy remains unchanged.

Success patch is `{id,cellId,troops,energy,acted:true}` plus full old receipt. The old entry kernel itself does not set acted; the new adapter explicitly consumes it once. The enclosing Move must run movement-cost and terrain proposals from the same pre-action roster, verify their final position agrees, then combine troop/energy/position/acted with the returned movement budget only if **both** succeed. No movement budget is invented here; no double movement/acted consumption or stale source projection is permitted.

Fire-entry damage is not implemented: actual old kernel explicitly rejects it. Standing-fire Tick damage must not be passed off as entry damage. A future fire-entry policy needs its own named inference and review.

## projectRosterRockfall

Additional fields `{footprint,traits,draws,eventsUsed}`. Footprint1..16 unique supported nonfacility map cells is fixed scenario hazard coverage; traits must cover every current roster ID exactly as `{actorId,pathbreaker}`. Both come from immutable outer configuration, not event-user eligibility claims.

Targets are **all** current deployed occupants in the footprint, sorted ascending by ID. No caller-chosen subset. At least one target. Draw records must be exactly that order/set as `{targetId,draw}` with draw0..999. `eventsUsed`0..256 plus all target count must remain<=256 before any calculation. Actual `createInferredMultiRockfall` + one `executeInferredMultiRockfall` calculate the entire batch; old positive single-target kernels reject any zero terminal result, so no prefix can commit. No buildings or displacement.

Output patches only `{id,troops}` for the full roster, old batch receipts, and updated eventsUsed. No energy/status/position/action changes. Outer owner must adopt eventsUsed from its full replay and bind the event once; a fresh transient projection does not permit resetting the cumulative target-event budget. Source eligibility and pathbreaker are not authenticated by this pure function.

## projectRosterFalseReportApply

Additional fields `{targetId,draw,critical}`, draw0..99, strict boolean. Target cannot currently occupy active fire. Actual old `applyStatus(false-report)` consumes the single duration sample, applies 70/30 base1/2 plus critical1, max-refresh and incompatible-status rejection. Return only `{id,status,remaining}` and full receipt. The enclosing lawful strategy/event must separately derive hit/critical, enforce caster eligibility, consume cost/acted, and commit jointly. This leaf does not create a free world strategy command or assert a cast succeeded.

## projectRosterRetreatTick

Additional fields `{goals,turn}`. Goals exactly cover current roster as unique `{actorId,cellId}` and must refer to supported nonfacility plain (terrainInfoU32 exactly0) cells. Turn is actual outer turn0..1000000, not a saved second clock. Any current occupied active fire rejects: this neutral leaf does not bypass standing-fire exposure. Fires elsewhere remain solely outer-owned and are excluded from retreat routes.

Process actor IDs in lexical order using a local proposed roster for occupancy. An unacted false-report unit must start on plain terrain; BFS explores lexical neighbors and excludes nonplain/blocked/unsupported/facility/fire cells and other units' current proposed positions. No route rejects the entire roster Tick. Move at most one step toward fixed goal (already there stays), set acted=true, then use actual old resolveTurn/beginTurn. Already-acted false-report units skip movement but count down. Normal/confused units also use the same status resolver. Neutral traits, defenseTier3 and no auras mean the real old recovery step is1, not claimed qualified-building recovery2. No unit is deleted or returned to a city at arrival.

The original single-unit safe-retreat adapter used lexicographic BFS with one step. This multi-unit stable-ID collision scheduling and exclusion of unavailable cells are explicit new engineering policies, not original game pathfinding. It is not a rerun of the standalone normal-genesis retreat ledger. It projects the **current** unit status/remaining/acted into the old status resolver, so existing duration is not rerolled/reset. No samples are consumed during Tick.

Output gives the full same-ID roster, actual proposed turn+1 and per-unit route/old-kernel receipts. Only position, acted, status and remaining change; troops/energy are retained. Outer WorldTick must call status/retreat recovery only once, not also run an independent confusion countdown; reset movement budgets once according to the central profile. If another world child fails, discard all local proposed positions/countdowns. Residents are not included and remain managed by the city/world owner.

## Integration limits and evidence

Actual source reads establish the old terrain gate, status duration/countdown, positive rockfall batch and single-unit retreat route policy. They do not establish native multi-unit sequencing, map geography, hazard placement or skill ownership. All fixed scenario choices must stay explicitly synthetic. These helpers are implementation leaves, not a claim that the presently merged world already invokes them. P078, Closing rewards, injuries, real officer ownership changes, zero-troop finalizers and city entry remain excluded.

### Static review correction: map-order adapter

The actual legacy hazard constructor requires strictly ascending cell IDs, whereas mobile maps may preserve any unique input order. The temporary hazard projection now sorts a copy of cells by ID before calling it. Original map order, adjacency, requested path and RNG visit order remain unchanged. This is schema adaptation, not path sorting. The pre-fix manifest is retained separately; fixed candidates require fresh independent review.
