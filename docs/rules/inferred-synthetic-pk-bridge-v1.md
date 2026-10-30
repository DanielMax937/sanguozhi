# Private PK research/cultivation owner leaves

Actual old kernel: pk-ability-lifecycle.ts at main f132870bb58505acd0572c23e3ba91592eefa849, copied under sources. This helper extracts its fixed base-target mapping, node selection, policy/scenario validation, fee/qualification/use/effect/completion logic. It imports the actual catalog/digest/registry and qualifyPkStatTraining/completePkStatTraining. It does not change the standalone service or any defaults. No execution/test/build/typecheck performed.

## APIs / sole owner

- `createSyntheticPkMetadata(context,{hiddenSelections,policies})` creates empty research unlocks, zero usesSpent, empty job histories. Exactly5 valid fixed hidden choices are required, sorted deterministically by old validation. The caller may obtain them from an already authorized seeded genesis loader, but must preserve them in root genesis; helper draws no RNG and never reselects hidden nodes.
- `planSyntheticPkStart(context,metadata,{kind:'Research',jobId,nodeId})`, or kind Cultivate with officerId.
- `advanceSyntheticPk(context,metadata)` after the owner has advanced its turn/date exactly once.

Context fields are exact: turn/date/forceId/cityId/corpsId/gold/actionPoints/techniquePoints/remainingTickCapacity/officers. Officer schema is old PK `{id,forceId,baseId,available,actedTurn,stats,aptitudes,skillKey,reservationJobId}` plus current resident/deployed role. stats has leadership/war/intelligence/politics/charisma each `{talent,xp}`; aptitudes spear/halberd/crossbow/cavalry/siege/navy each C/B/A/S. All person/owner/city/corps IDs are bound synthetic identities, same city/force, with distinct IDs and maximum32 officers. Job IDs are exactly job:synthetic-* and share the existing typed reservation namespace.

Metadata stores only scope binding, fixed roster IDs, hiddenSelections/policies, unlock IDs, usesSpent, complete research/cultivation job histories and last clock marker. It holds NO current resource or officer progress balance. Frozen metadata carries an internal WeakSet brand. Start/advance reject unbranded, deserialized, copied or caller-forged metadata. This is an internal optimization boundary, NOT a replacement for full root genesis+accepted-command replay. Owner rebuilds metadata at genesis on every root read, threads returned object references directly through the fold, and only then exposes a detached readonly result; never accept metadata from save as authority. This exact internal reference contract was agreed with the integration owner.

## Retained actual semantics

Research: node present in fixed tree, prerequisites completed, not already researched, one active research, no officer assignment,300gold/20AP/0TP, months*3 boundaries. Research may overlap cultivation. No synthetic fake officer gets reserved for a research job.

Cultivation: node unlocked, uses available, one active per stat/aptitude/skill category, distinct unreserved same-city resident unacted available person;20AP/0gold/0TP under existing explicit provisional policy;3 boundaries. Node use is reserved at start, spent at completion. Repeated use and same-person cross-category work are blocked by shared reservation. Stats call the actual ordinary-no-age qualification/completion kernel; aptitude remains adjacent C→B or B→A; skill replaces one skill rather than stacking or inventing numeric IDs. All anticipated effects and original reserved officer stats/aptitudes/skill remain in startSnapshot.

Tick preserves old order: research completions, then stat, aptitude, skill. It verifies current owner clock equals prior marker plus one xun; no private AP recovery/date advancement occurs. At completion actual source logic validates timing, fixed node/catalog/policy and reservation; cultivation requires original stats/aptitudes/skill unchanged, applies exact anticipated effect, spends use, releases actor and marks acted in the completion turn. All finished jobs and their confirmations remain in metadata; no history rewrite.

Due-date calculation uses the old nextDate solely for projection/verification. Start horizon check preserves maximum remaining tail among existing active jobs and new duration, against owner-provided remainingTickCapacity. All resources are from current context and all effects returned in a typed finite patch. Source policies may include their standalone AP recovery description, but this owner-neutral profile never invokes that phase; root alone owns recovery.

## Required integration and real limitations

1. Shared WAR XP is not a parallel PK balance. Map owner warBase/warXp to PK talent/xp; map other stats and charisma↔existing charm by an explicit documented naming policy. Old PK validates talent0..100 and XP0..3000 for all supplied officers. Existing wider domestic XP must reject incompatible profiles, not be clipped or reset. Preserve earned XP across Train, research and cultivation writers.
2. All typed actor locks must cover production, forge, technique, cultivation, deployment, city actions and other progress writers. Never let a pending cultivation's reserved stats change invisibly, then discard the old effect. Completion writes back only mutable stats/aptitude/skill/acted/reservation fields; does not change identity or ownership. Merit is not a PK effect and remains untouched.
3. Owner must publish new effective attributes into actual consumers after cultivation (including field intelligence), not just display metadata. Skill keys and aptitude values do not automatically imply all native passive/strategy effects are implemented. Do not guess unknown skill mappings to guidance or numeric domestic skills.
4. Maximum research18旬; research→cultivation21旬 if eligible. The explicit bounded horizon profile is authorized technical work, not a permission prohibition. It does not waive prerequisites or allow inventing initial unlocks. Existing empty-tree genesis remains empty, so a full prerequisite tree can require longer than a single episode.
5. All output patches, metadata and receipts are bounded-data checked before return; owner additionally checks whole-root JSON/history/field budgets, applies every phase atomically and retains complete root replay. Failure in any phase discards this candidate; no standalone partial commit. Start and advance have zero RNG.

This is a private candidate, not yet claimed unified-world integration. No health/age/season, actual person, P078, Closing, injury or zero terminal effects. Ordinary synthetic capability research and its effects are within scope.
