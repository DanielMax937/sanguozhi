# Cultivated mobile field v4 — optional single-owner bridge

Additive opt-in internal field module; v3 defaults remain unchanged. The existing unified world selects this module only when its explicit PK capability is enabled. No new parallel persistent world or second troop balance is introduced. This is not native PK world equivalence.

## Sources and actual consumption
`pk-stat-training.ts` and `docs/sources/pk-stat-training-s1.json` expose the S1 MOD-associated, stock-unverified ordinary-no-age getter: talent 0..100, XP 0..3000, growth 1..100. `resolveSyntheticCultivationFacts({actorId,stats,aptitudes,skillKey})` reads each raw stat `{talent,xp}` through actual `qualifyPkStatTraining` and uses growthBefore. A false numeric qualification does not invalidate that current growth. Other domains reject; no age/special-person getter is guessed, no talent-only shadow stat or new clamp formula is used.

Both FireCast and Cast caster intelligence and selected target intelligence use currentFacts. Previously executed casts replay with their then-current facts. XP gained through ordinary city work/techniques therefore must be synchronized as well as cultivation; the owner derives effective facts after every outer command, not only after a cultivation job.

Actual `internal/synthetic-pk-bridge.ts` cultivation completion changes XP, aptitude or skill, releases reservation and marks the current turn acted. Only its successful receipts authorize completionJobs in this field bridge. The field does not rerun or authenticate PK jobs.

## Fixed API
`createInferredCultivatedMobileField(cells,templates,movementMap,movementProfiles,cultivationBaseline)` retains v3 arguments and adds facts in template order:
`{actorId,stats:{leadership,war,intelligence,politics,charisma},aptitudes:{spear,halberd,crossbow,cavalry,siege,navy},skillKey}`.
Effective stats 1..100; aptitude C/B/A/S; skill null or bounded identifier. Owner generates baseline from actual PK officers. Template intelligence remains immutable legacy configuration, not effective-stat authority under this explicit capability; no requirement that talent-only legacy value equals effective growth.

Internal `executeInferredCultivatedMobileFieldOuterStep(state,{id,expectedRevision,action:{kind:'OuterStep',sourceOuterCommandId,fieldAction,factsUpdates,completionJobs}})`:
- sourceOuterCommandId must equal envelope id, bound by owner to actual outer command ID.
- fieldAction is one normal v3 action or null; never nested OuterStep.
- factsUpdates is 0..8 `{before,after}` complete facts pairs, unique actor IDs; prior facts must exactly match. Stats/aptitudes cannot decrease. Only an accompanying completion job permits skill/aptitude changes.
- completionJobs is 0..8 `{jobId,actorId}` with unique source job IDs and actors. Job IDs use `job:synthetic-…`. Each actor must be resident before and after the field action. Every source job can be used once across all history. No-op capped completion is allowed.

Named synthetic order: **execute field action (including FieldTick) using prior committed facts → synchronize owner-derived effective facts → lock completed resident actors acted=true**. The enclosing owner currently advances city/forge/techniques/PK then income/payroll/food before field; this order is an explicit composition choice, not recovered original ordering. Facts earned during this outer Tick are synchronized after its field action and used by subsequent commands; earlier outer-command XP was already synchronized. PK completion lock is applied after Tick so it survives the same turn's reset. No additional clock advance happens for facts or jobs. City-only commands use null fieldAction. Thus each outer command consumes exactly one field journal entry, not Tick plus additional completion entries; both histories remain bounded to 32. Reserve enough outer Tick capacity before starting jobs; capacity failure rejects the entire outer command.

## Authority and replay
Ordinary `executeInferredCultivatedMobileField` rejects OuterStep. The internal function is not a cryptographic/provenance boundary: standalone callers can construct field proposals, just as Deploy can propose troop transfers. World must never expose OuterStep through a public Field route or accept caller-supplied currentfacts/field snapshots. Its sole outer genesis and typed history must regenerate every before/after and completion from real owner results, including matching source officer, turn, job and reservation release. Field read/save/load validates full field-history consistency but cannot prove outer PK provenance. The world must replay from its genesis to establish that proof.

Within replay, malformed or failed facts/action/completion rejects the entire proposal; no partial state escapes. No resetting initial state around completion, replacing histories, reseeding RNG, rebuilding fires or discarding movement budgets. All fire IDs, duration samples, role changes, troop/energy writes and positions remain in the same history. Existing 256 fire-event, 8-actor, 16-cell, descriptor/proxy, and 100000-character save limits remain.

## Honest remaining mechanics
Returned currentFacts carries all five effective stats, aptitudes and skill. In this field only intelligence is consumed by actual kernels. Leadership, war, politics and charisma-specific gameplay, skill mapping to immune/guaranteed/beauty/available flags, and aptitude mapping to attack/range/eligibility remain **metadata only** here. Completion receipts say so. Fixed strategy/equipment/flags do not silently acquire effects from a skill name. Owning city consumers must separately use its unique current metadata; this module alone does not prove every city or cultivation effect is integrated.

No real-person migration, terminal zero troops, Closing reward/injury, P078 dependency, hidden enemy or global-world write. Static review only: no code execution, tests, build or typecheck.
