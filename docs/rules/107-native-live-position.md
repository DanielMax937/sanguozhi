# P0-72: native live position and mutable fallback

This explicitly versioned source profile closes canonical00489610 position-pointer resolution and0047A950 packed-position/map evaluation. It preserves every old API/frame/trace and all18 inherited entry points. New direct entries are `position-pointer`, `position` and `movement-origin`; the new frame/version are `source-idb-S1-S2-native-live-position-frame-v1` and `source-idb-S1-S2-native-live-position-v1`.

## Native order and storage identity

00489610 reads signed person+9C once, tries canonical base0..86 through00490D00 and0047A630, then canonical troop87..1086 through00490E70 and0047A630. It uses the saved location even if a virtual observation mutates the person. A valid base returns symbolic base+1E storage; a valid troop returns troop+3C; otherwise it returns mutable06EE794C storage. Getter construction adds no row read. Missing reached rows are insufficient model evidence, never implicit native invalidity.

Troop validity uses the live leader raw17C/status predicate plus both signed deputy values<1100. Negative deputy sentinels pass without deputy-person reads. Position does not require the officer to be a member of that troop. Unknown virtual continuations need an exact source/stack/full-frame/RNG mutable observation or atomic rejection.

The pointer helper returns storage identity without loading coordinates.0047A950 then performs one packed DWORD read at0047A956, sign-extends its two16-bit halves as X/Y, bounds both to0..199 before reading live map data, and uses the source-selected signed base table. Opaque returned pointers require a separate explicit read observation. Callback replacements never authorize cached row coordinates.

004A6340 first validates the actor; a live base location0..86 is returned directly, bypassing base validity, position and map reads. Only the other branch invokes0047A950.

## Explicit mutable frame; no fallback default

The caller supplies every represented troop's signed16 X/Y and the signed16 pair `fallbackPosition06EE794C`. No default or implicit migration exists. S1's06EE794C snapshot is00000000 and S2's isFFFFFFFF; neither is a runtime initialization promise. Explicit observations may mutate the entire current frame, including fallback storage; old frames are never silently upgraded.

0073BE10..0073BE1B reads0079C1D0, stores06EE794C and returns. In S1 it is a bounded straight-line store/RET block without an ID0 function; in S2 it is a complete ID0 function. These bytes do not establish initializer scheduling, reachability, actual execution or reset timing, and the model never uses the source snapshots as defaults.

## Formal integration and verification

Baseline: PR #29 merged main `8a47624d5923b447597c9fab18dc1e84fa1eade4`. The reviewed74-file implementation is reused with production, all31 behavioral model-test groups, raw code/data and historical reports byte-identical. The model checker has one explicit metadata-only exception: test32's strict inherited source-checker SHA256 is updated to the recursively proved actual P0-71 metadata version. No behavioral assertion or expected result changes. The new manifest/source-checker baseline, two prior metadata pins and separately strict historical-extraction assertion are reconciled, together with the source README documentation. P0-71 → P0-70 → P0-69 → P0-68 → P0-67 are recursively proved metadata/baseline-only against actual source, including the historical-report assertion split. This guide is one additional formal-integration file; six main indexes are reconciled, so the candidate contains1422 tracked files.

The latest-main114-command set passed after targeted recovery. The initial frozen run passed112/114. First, npm check failed because copying local dependencies dereferenced the tsc symlink; restoring both original symlinks passed TypeScript and85 Node tests, with product argv unchanged. Second, model test32 rejected its old predecessor-source-checker SHA. The authorized single strict metadata-pin change was independently reviewed; all31 behavioral test groups remain byte-identical and the assertion is not skipped. The corrected candidate passed32 model groups,21 source groups with17/12/13 nested groups, both whole-IDB hashes/all1263 raw intervals, and17 historical independent probes. The other113 commands reuse successful evidence only under an explicit import/read-dependency proof. This is not a fresh single all-green run or one unchanged tree: initial and corrected1422-file/index freezes were checked separately. The completed set covers111 Python checker commands, TypeScript/85 Node tests and2 demos. All121 log hashes, including three retained failed attempts, and per-command wait/start/exit/release records with the shared lock inode were verified. Every command used the same persistent fcntl lock; npm/node inherited NODE_OPTIONS=--max-old-space-size=512 --test-reporter=tap. Historical lifecycle/default-reporter anomalies remain unexplained; the diagnosed dependency-copy error does not resolve them. Integration-delta and model-pin exception reviews found no blocker. Only five documentation-result texts were updated afterward for separate review. Capstone5.0.7 historical reports were hash-checked, not re-decoded. These are local source/synthetic-model checks, not original-code execution, remote CI or stock certification.

Focused evidence contains64 intervals:58 exact inherited reuses,6 new unique,52 code/12 data,3356 selected interval bytes,674 instructions,40 calls,102 relative branches and30 newly recovered machine-code bytes.51 code intervals have complete ID0 function boundaries and one is the bounded S1 store/RET block. The inherited/new closure has1263 selected raw intervals:625 S1/74088 bytes and638 S2/74470 bytes, with overlapping selected byte counts. This is not a unique-byte coverage claim.

Run the source checker and separate32-group model checker from the repository:

    PYTHONDONTWRITEBYTECODE=1 python scripts/check_native_live_position_source.py
    PYTHONDONTWRITEBYTECODE=1 python scripts/check_native_live_position_profile.py

The source checker has21 new groups and retains nested17/12/13 inherited groups. Optional `--idb-s1`, `--idb-s2` and external `--report` paths repeat full-IDB fingerprints and every selected raw-ID1 interval. The historical independently authored17-group adversarial suite is also rerun on the formal candidate.

## Remaining evidence debt

Canonical capture/surrender/captive policy and force extinction; recursive-return ruler ownership; positive refunds/resources; other cancellation and presentation bodies; event9 troop reaction; S2 extra effects/observers; custom vtables and full S2 troop-vtable extent/virtual+68 caller/business; fallback reset scheduling; unrepresented memory/platform/concurrency; global RNG and runtime/clean-stock/Vanilla/console certification remain open. The26-slot common dispatch block is not proof of the S2 vtable's complete extent. MOD-associated S1/S2 IDBs and matching selected bytes do not certify stock PK or Vanilla. No original executable or recovered machine code is executed. This is a bounded versioned closure, not complete capture or whole gameplay.

See [source evidence](../sources/native_live_position/README.md), [manifest](../sources/native_live_position.json), [open exactness](13-open-exactness.md) and [fallback debt](16-unresolved-rules-fallbacks.md).
