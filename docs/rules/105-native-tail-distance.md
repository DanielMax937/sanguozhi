# P0-70: native zero-refund tail distance in the live frame

Status: bounded source-local compatibility reconstruction. New API/profile only;
no old API or trace is modified. Formal integration reconciles documentation
and indexes while preserving prior version boundaries. This is not complete-game,
canonical capture, runtime or clean-stock certification.

## Formal integration and verification

Baseline: PR #27 merged main `8b21e340d577810ca664e829d1d9cb35b1046fc4`. The 55-file audited implementation is reused with production, model tests, raw assembly/data and verification reports byte-for-byte unchanged. Only this theme's manifest/checker baseline, two inherited metadata pins, one strictly preserved historical-extraction baseline assertion, documentation and six main indexes are reconciled. P0-69 → P0-68 → P0-67 pin differences are recursively proven metadata/baseline-only.

Fresh latest-main110/110 commands passed: TypeScript,85 Node tests,107 Python checker commands and2 demos. Every npm/node command used the shared fcntl lock and NODE_OPTIONS=--max-old-space-size=512; product argv stayed unchanged and wait/start/exit/release records are retained. The12 new plus13 inherited source groups,29 model groups and8 historical reviewer probe groups passed. Both whole-IDB hashes and all1236 selected raw-ID1 intervals were freshly rechecked (S1:612 intervals/73,783 interval bytes; S2:624/74,140; overlapping intervals are counted separately). All1285 tracked files and the Git index were identical before and after validation, and all110 log hashes were verified. Independent integration-delta review found no blocker; its scope is distinct from the historical implementation review. Only five documentation-result texts were updated afterward for separate review. The inherited Capstone5.0.7 report for780 instructions was hash-checked, not re-decoded. These are local source/synthetic-model checks, not original-game execution, remote CI or stock certification.

## API and scope

- `scripts/native_tail_distance_profile.py`
- `project_native_tail_distance(state, command, observations, policy)`
- `replay_native_tail_distance(trace)`
- Profile: `source-idb-S1-S2-native-tail-distance-v1`
- Additional policy: `tailDistanceDomain: canonical-native-tail-distance-v1`
- Frame: unchanged `source-idb-S1-S2-base-ownership-frame-v1`
- All 17 generic-facility command entries remain available in the new version
- Inherited facility, zero-refund, relocation, route, platform and engine-guard
  policies remain mandatory

Only the reached `005B8400` zero-refund `0049E4D0` query is replaced. It now calls
`movement_distance` in the same frame, consumes no observation record and does
not alter RNG. All later opaque effects retain their full before/after frame,
call-stack binding and explicit RNG accounting. One outer command commits one
revision, even across native recursion. Missing/stale observations and engine
limits retain atomic rejection; they are not original gameplay rules.

The new planner composes the inherited generic-facility planner through a small
boundary mixin. It does not call an older projector, replay function or separate
transaction. It does not migrate an old trace or change an old replay contract.

## Exact read and saved-value order

1. The live tail reads the actor's current location, normalizes it to `0..86`
   or `-1`, and saves the raw home ID. These are read after any notification
   presentation effect, so presentation changes are live inputs
2. Equality of normalized current and raw home suppresses the distance call;
   the inherited same-home reset/acted/native-return path remains intact
3. For unequal identities, current and home getter identities are passed to
   `0049E4D0(current, home)`. Out-of-range raw home becomes the null sentinel `-1`
4. `0049E450` resolves the current building, checks its canonical validity,
   reads its packed signed16 coordinates, checks each is in `0..199`, then reads
   map dword `(200*x+y)` and extracts `(raw >> 5) & 127`
5. `004839F0` uses the selected source's unsigned-byte territory-to-city table
6. The first territory result is saved in the temporary `0049E4D0` scope while
   the same procedure evaluates home. The second evaluation occurs even when
   the first territory is invalid
7. `0047B480` returns `-1` if either city is outside `0..41`; otherwise it reads
   the source's unsigned byte at `originCity*42 + targetCity`
8. After the temporary helper scope exits, the result is saved as
   `savedDistance` in the enclosing `005B8400` scope. The native EDI lifetime
   survives subsequent mission37/acted-observer/active-list callbacks
9. The duration wrapper checks live actor validity after callbacks. If valid,
   it stores the saved result's low byte. It never recomputes distance from
   callback-modified location/home/building/map fields

These selected valid-domain operations have no signed multiplication overflow:
coordinates have already been bounded, so the largest map index is39,999;
city bounds make the largest distance index1,763. Territory and distance table
loads are unsigned bytes. The sentinel result `-1` becomes duration255. There
is no fabricated saturation, absolute value, minimum duration or symmetric
index normalization.

Both pinned distance matrices happen to be symmetric. Directed indexing is
established by the source argument/read order and source-derived oracle. Any
injected asymmetric matrix in a test is a synthetic index-plumbing probe,
not a claim of an asymmetric runtime/source capture.

## Validity and memory-domain boundaries

Canonical building validity is derived from kind `0..63`, under the inherited
fixed-vtable and successful-probe domain. Territory adds no base-ID, category,
city/gate/port-kind or subtype-validity filter. Represented valid generic
buildings IDs87..16383 and kinds3..63 may supply a home territory. Invalid
represented rows return `-1` before coordinate/map reads; they are not absent
rows.

The inherited tail eagerly requires readable rows for both in-range getter
identities before entering `0049E4D0`. Native pointer construction itself adds
no validity gate and need not read those rows. This inherited requirement is
retained as a conservative representable-input domain, not claimed as an x86
read or a proof of arbitrary-memory equivalence. Missing in-range building or
actually reached map slots remain errors; no invalid row or map value is
invented. Arbitrary/misaligned pointers, unsupported vtables, memory faults,
failed probes and unrepresented memory remain outside the declared domain.

The source-specific territory map tables remain distinct. Selected matching
instructions and tables do not establish equivalence of MOD-associatedS1/S2
to clean-stock PC-PK1.1, Vanilla, console or actual gameplay.

## Verification and remaining boundaries

The focused46 intervals are inherited/reused: zero new unique intervals and
zero newly recovered machine-code bytes. During isolated extraction both whole-IDB hashes and all1,236
inherited intervals were checked; the40 focused code intervals have a pinned
historical Capstone5.0.7 report for780 independently re-decoded instruction boundaries. See the source
manifest/checker, independent oracle and local handoff for final complete
regression and separate review evidence.
Synthetic callbacks validate model composition, not authenticity of runtime
observations. Neither the game executable nor original machine code is run.

Full canonical `004B415D` capture/surrender/extinction, recursive ruler-return
ownership, positive refunds/resources, remaining cancellation bodies,
presentation internals, event9 troop reaction, actual troop membership and
non-base positions, remaining S2 effects, global RNG and platform/runtime/stock
certification stay open. Old standalone tail APIs still require the distance
observation by design; this closure applies only to the new composed version.

This formal integration uses the verified merged predecessor main. Local
regression and independent review remain required before publication. No remote
action or uncertain-publication retry is part of this local stage.
