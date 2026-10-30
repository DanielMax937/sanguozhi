# Unified PK research/cultivation: current facts and actual consumers

Base is the bound-travel owner at main `3efde99f153e59f434c9c070675113e73f5d5834`. This adds a new explicit optional capability to stable mobile-resource-world-v3; it does not replace old defaults, migrate old snapshots, claim native scenario facts or execute restricted finalizers. Verification is static only; no tests, typecheck, build or candidate execution.

## Explicit genesis and unique progress

`pkConfig` follows travelBindingConfig in both creators:

```
{profile:'unified-pk-current-owner-v1',hiddenSelections,policies,
 officers:[{id,aptitudes:{spear,halberd,crossbow,cavalry,siege,navy},skillKey}]}
```

Officers bind exactly, in the existing city order; aptitude grades and skill strings are validated by the actual PK helper. Hidden selections are the exact five catalog choices fixed at genesis, not redrawn on load. All nodes start locked, use counts zero, job histories empty. Progress and the explicit research21 capability are required. Old numeric `skillIds` must be empty in this supported scene; this prevents a PK skill replacement from leaving an unrelated old numeric skill active. The old explicit research guidance-ID list must also be empty: guidance is derived from the CURRENT `skillKey==='guidance'`, without guessing mappings for other keys.

The explicit mapping policy treats genesis leadership/intelligence/politics/charm as ordinary-person talents, maps charm↔charisma, and uses the same current city XP rows. WAR talent/XP remain the ONE progress warBase/warXp used by Train. Every current visible attribute is read through actual `qualifyPkStatTraining` with ordinary-no-age and target100, taking supported `growthBefore` regardless of its eligibility flag. This is a named compatibility mapping; it is not a claim that old domestic fixed-attribute semantics secretly used this growth model. Old non-PK roots retain their fixed-attribute behavior.

Actual PK talents must be0..100 and XP0..3000. No old wider value is clipped or reset. The default Train growth contract is also100 XP/point, XPcap3000, stat1..100, using the same talent+floor(XP/100) visible value. PK aptitude/skill rows contain no second XP, merit, loyalty, gold, AP or TP balance. The helper never changes identity/ownership or talent, and the owner verifies unchanged talents before applying its finite patches.

## Research, cultivation and locks actually execute

`PkResearch {nodeId}` and `PkCultivate {nodeId,officerId}` call the actual extracted PK lifecycle leaves with current resources and roles. Research uses the catalog's officer-free start; cultivation requires current resident/available/unreserved/unacted qualification and a researched node with an available use. Jobs use the same `job:synthetic-*` namespace. Cultivation reservations join production/forge/technique locks in both directions: every held lock has one live job, every participant holds the exact lock, no overlap or job-ID collision.

A successful start pays the actual fee once and records full snapshots, timing, use reservation and policy. WorldTick advances PK metadata after city/forge/technique and before income/payroll/food. The PK helper preserves research-completion→stat→aptitude→skill order, consumes uses, credits the actual stat XP or replaces the actual aptitude/skill, releases the actor and marks completion-turn acted. Merit is not rewritten by PK. Failed phases return no partial owner state.

Metadata carries an internal WeakSet brand only as an internal helper check. Each root read creates it afresh from validated immutable genesis, then threads each returned frozen object directly through full replay. It is not JSON-cloned between helper calls and is never loaded from a derived saved metadata object. Each helper operation copies its working frame; failure cannot mutate prior metadata. The world save contains only genesis plus typed outer commands; brand possession is not external authorization or a substitute for replay.

## Current city facts versus historical job facts

The private city transition reads a typed current-facts overlay for leadership/charm/intelligence/politics. Thus Patrol/Recruit/quantity production/merchant calculations use current PK-grown facts. Forge starts use current politics; research timing uses current T28 projection over the same current grown attributes; Train receives current non-WAR attributes and the original unique WAR talent/XP. T28 effective view is recomputed from live holders, not cached. These are real consumers, not UI-only changes.

Piece-production start captures the actual current intelligence. Its already-admitted job is later recalculated from its preserved startSnapshot, NEVER from a later grown intelligence value. The full outer replay proves the snapshot's origin; old private job invariant still checks exact fees, timing, captures, receipt and identity. The typed historical projection only substitutes that recorded intelligence for the job calculation; it does not alter mutable current facts, genesis, flags, skill82, facility, catalog or policies. Old public legacy reads never receive this context and keep their original validation.

Known completion rewards are checked before admitting a job into the PK XP domain: piece intelligence+4, forge politics+3, and technique XP from the actual fee/divisor must remain≤3000. Instant actions that exceed the new supported domain reject as a whole. Existing reservations prevent a different writer from modifying a reserved cultivation's snapshot during its three turns.

## Field v4 consumes current intelligence without re-creating history

Only the explicit PK profile selects cultivated-mobile-field-v4. Old mobile-field-v3 remains unchanged for old roots. V4 retains immutable original templates/map, all prior commands, roster positions, positive troops, energy, fires, movement budget and statuses; current facts are derived through its ordered history.

Every outer owner command produces EXACTLY ONE internal OuterStep, even a City/Train/research command whose fieldAction is null. The record contains before/after current-fact updates and actual completed cultivation job IDs. Public World `Field` still admits only Cast/FireCast; it cannot route OuterStep or arbitrary progress deltas. Whole-world replay re-derives these records; a standalone v4 snapshot is not trusted as PK completion evidence.

The owner derives completion IDs only by comparing previously active PK cultivation jobs with newly completed jobs on the current turn. Completion actor must be resident. Every before-fact matches the prior field value; skills/aptitudes may change only with a genuine completion in that step. Every subsequent caster/target intelligence query uses field currentFacts rather than stale template intelligence. The initial current facts are actual owner-derived values and need not equal the immutable template baseline.

Named phase policy: the field action (including Tick hazard progression) runs first using the entering field facts, then this outer command's new facts synchronize, then completed resident action locks apply. Consequently a completion's lock cannot be cleared by the same Tick, and its new intelligence is available to all later commands. This ordering is a synthetic compatibility choice, not recovered native caller order. Skills and aptitudes are genuinely cultivated/stored, but no unknown passive or combat mapping is invented; not every native skill effect is claimed implemented. Field currentFacts here use PK ordinary growth, not a claim that all T28 equipment bonuses already affect field combat.

## Budget and scope

Existing outer32, field32, city64,21-xun absolute horizon, JSON bounds and fire-event bounds remain. One field entry per outer command avoids an extra progress-event budget; dense fact receipts may still hit the existing10k-node/100k-character field budget before32, in which case the entire event rejects rather than truncating history. Outstanding production, forge, technique, PK research/cultivation and bound-travel tails all reserve the maximum shared Tick tail, plus travel's required future Start commands.

Research starts at an empty tree;21 is not a promise that the whole prerequisite tree finishes within one episode. The update excludes real-person writes, age/health/season dispatch, P078, Closing, injuries and troop-zero termination. Full original map/scenario and all passive effects remain separate evidence/integration gaps.

## Trace identifier clarification

The internal field envelope ID and its `sourceOuterCommandId` both use `synthetic-owner-field-<accepted timeline index>`. This is a deterministic index mapping reconstructed by complete root replay; it is NOT the original user envelope ID, a cryptographic provenance proof, or standalone authentication. The root/timeline receipts retain their own command IDs, and replay proves the mapping and effects.
