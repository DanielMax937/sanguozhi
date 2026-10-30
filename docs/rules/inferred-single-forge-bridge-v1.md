# Private single-forge construction bridge

Base source main f132870bb58505acd0572c23e3ba91592eefa849. This helper alone does not integrate construction into the world. Old defaults/services are unchanged. No candidate execution/tests/build/typecheck performed.

## API and ownership

`planSyntheticForgeStart(context,{jobId,officerIds})` and `advanceSyntheticForge(context,job)` accept only detached bounded data, return `{ok,job,patch,receipt}`. The exact context is exported SyntheticForgeContext: cityId, forceId, turn, gold, actionPoints, techniquePoints, remainingTickCapacity, enemyWithinTwoCells; one fixed `{id,kind:'forge',level:1,complete,reservationJobId}` facility; 1..32 officers with id/forceId/cityId/available/role/politics/politicsXp/merit/actedTurn/reservationJobId. This is a view of the owner's SINGLE current ledger, never independent spendable balances. Role comes from current dynamic roster; missing-template officers are resident only according to owner-authorized configuration. Enemy flag is derived from the same current geometry, not caller-controlled command data.

Scope is one configured unfinished level1 forge slot, once only. No arbitrary new lot, second construction mode, absorption, repair, upgrade, demolition or troop finalizer. Start rejects complete/busy facility, hostile radius2, duplicate/absent/deployed/acted/busy actors and insufficient AP/gold/horizon. 1..3 available same-city same-force actors are reserved with acted current turn. Result patch contains exact gold/AP/TP, facility reservation/completion and selected actor records. Caller must only copy whitelisted mutable fields, never accept arbitrary replacement identities from outside this private helper.

Existing catalog gives forge gold300, AP20, requiredwork800, type34, completionTP30. Existing default quarter-floor initial work gives200; calculateConstructionDevelopment supplies politics-based rate and finite duration. Source default completion gives each selected politicsXP+3 and merit+100, TP+30 with existing saturating writer (XP/merit cap1e9, TP10000), releases reservations and marks completion-turn acted. These are the existing documented compatibility policies, not newly asserted native constants. A later Train command can explicitly reject merit above60000; no automatic merit truncation to force Train compatibility.

Tick helper receives the **already incremented owner turn**. It requires lastTurn+1, reconstructs initial work/rate/currentwork/remaining/due from start snapshot, validates original selected politics and live reservation/role, then reuses advanceConstructionWork and completeConstructionPhase. It never advances date, recovers AP or changes unrelated balances. Date progression is exclusively the owner's same xun clock. A completed job is retained as a consumed/tombstone record; repeated advance rejects. Owner must retain used job/facility identity history, never regenerate an unfinished slot on load.

## Mandatory outer integration (real compatibility gates)

1. Existing bounded currentInvariant currently recognizes officer/facility reservations only for active production jobs. Add an internal typed construction-reservation context (empty by default preserving old standalone behavior) and thread it through invariant and private transition. Do NOT hide a second lock elsewhere, clear forge locks to make old validation pass, or admit arbitrary unknown lock IDs.
2. Genesis facility facts are immutable. Add an owner-controlled current facility completion overlay, derived from this job history, and use it in the actual production eligibility projection. Completing this forge must make the SAME facility selectable by subsequent quantity production; incomplete forge must still reject. Do NOT edit genesis.complete and restart replay or claim completion is integrated if only display metadata changes.
3. Before start/tick, owner supplies sole current AP/gold/TP and actor progress. Check that actors and facility aren't locked by any other production/research/deployment path. Apply all returned effects and journal append atomically; any downstream invariant/history/budget error discards the whole candidate.
4. Owner reserves future completion tick capacity (including outer history limits) on start; remainingTickCapacity is supplied by owner, not external actions. Whole root genesis+commands replay reconstructs jobs, locks and receipts. Helper's job validation alone is not historical authorization.
5. No separate public AdvanceForge: one WorldTick calls this phase once. Later phases cannot clear completion-turn acted locks. Existing wages/natural/field/production failure must rollback this phase and vice versa.

## Evidence

Fixed sources copied under `sources/`: facility-construction catalog and policies; internal/facility-construction-leaves.ts and types.ts; domestic-construction-rate.ts. Existing internal/facility-construction-phases.ts was read at the same commit (archived in sibling contract sources). The helper imports those kernels rather than reproducing rate/progress/completion formulas.

Native gaps remain: original full scheduler, initial work writer, reward writer, actual stock tables are not certified; source catalog itself says community tables, rate says stable public listing. The single preconfigured forge slot/one shared clock bridge is explicit engineering inference. It touches ordinary synthetic construction rewards, not Closing; no P078, real-person allegiance, injury, health or zero terminal processing.

Forge job IDs use `^job:synthetic-[a-z0-9-]{1,48}$`, e.g. `job:synthetic-forge-3`, matching the existing ledger job-ID namespace. Entity IDs remain synthetic-*; the exact job ID is the single shared reservation, never an alias.
