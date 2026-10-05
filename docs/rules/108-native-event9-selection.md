# Native event9 live troop selection

Status: bounded source-local reconstruction, additive version only. The two
pinned sources are MOD-associated IDBs, not verified clean-stock executables.
No recovered machine code or original executable is executed. Event9 reaction,
whole capture/surrender/extinction and full gameplay certification remain open.

## API and frame

`project_native_event9_selection` and `replay_native_event9_selection` live in
`scripts/native_event9_selection_profile.py`. Profile and frame IDs are
`source-idb-S1-S2-native-event9-selection-v1` and
`source-idb-S1-S2-native-event9-selection-frame-v1`.

All 21 inherited live-position entries remain available. The additional direct
`event9-selection` entry accepts the existing event object: `id`, `subjectType`,
`subjectId`, `argument`. It runs only the tail selection function; the existing
`event` entry composes listeners, this selection and the observer in native
order. Its native return is void (`nativeResult: null`). Events8/10/14 are tail
no-ops; unrelated native events16/18 are outside the public domain.

New policy fields are `event9SelectionDomain: canonical-live-event9-selection-v1`
and `event9NodeLimit` (1..100000 visits). All inherited policies remain required.
The limit and the inherited call/depth limits are engine safeguards, never
asserted native game rules. The inherited copied-roster list assumption does
not turn the newly represented live event9 list into an immutable roster.

The explicit frame adds these fields to every readable troop slot:

- `raw44`: signed dword at+44; only its range0..46 is used before the suffix
- `rawOrder2C`: signed dword at+2C, captured once before the target switch
- `rawTarget30`: signed16 word at+30
- `rawTargetType34`: signed dword at+34, read after reached troop revalidation
- `targetPosition38`: signed16 `positionX` and `positionY`, representing the
  single packed DWORD read at+38; distinct from the troop's actual+3C position

`troopListHead` is null or a nonzero uint32 node identity. `troopListNodes` holds
unique node rows `{id, nextNodeId, troopId, readable, writable}`. The payload is null or a
canonical troop-slot pointer; arbitrary node payload pointers are not modeled.
Unlike fixed manager slot inventories, heap-node inventories can be added,
removed, reused, reordered and relinked by a bound whole-frame observation.
Neither a default head nor any IDB snapshot becomes runtime state.

## Pinned order and local values

For event9, `004BA1D0` initializes its two saved force IDs to-1 and casts the
subject to the canonical building type, without validating that building. It
reads the live list head once at`004BA285`.

`004922C0` probes 12 readable and writable bytes of the current node, loads node+0 into the caller's saved cursor,
then releases its lock and returns node+8. The caller reads the troop pointer.
Thus the next-node identity is saved before troop validation or any reaction.
After the observed suffix, `004BA46C` reloads that saved cursor. It does not
reload the list head or the just-processed node's next link. The next node's
contents and next link are read live when its own visit begins. Duplicate
payload IDs and revisited node identities are not deduplicated.

A failed node probe returns list+1C without advancing the cursor in the native
body. This fallback memory/platform path is not represented and explicitly
rejects with `unsupported-event9-list-node-probe`; it is never a null/skip/end
shortcut. Missing reached node or manager storage is an input evidence error.
Deleted current nodes need not survive a suffix; a saved next node is required
only when reached. External concurrent mutation between lock release and
payload load, unrepresented stack writes and platform faults remain outside
the supported native-platform domain.

Each troop first receives canonical validity or an exact mutable unknown
virtual query. Valid troops capture raw+44 and must pass signed0..46. The
complete`00495CE0` target dispatch captures+2C, applies wrapped32 INC and an
unsigned table bound, then follows source-pinned jump tables. Non-null branches
revalidate the troop before reading target kind/ID/packed position. Pointer
getters construct identities without treating missing storage as invalidity.
Map targets use`200*x+y` without coordinate bounds checks, the live terrain
DWORD, mask127 and the source-specific signed territory table with negative
entries accepted. A guard restricts reads to the represented map allocation.

After target casting, invalid targets or identity equality with the saved
subject reach the suffix. Otherwise the function calls target virtual+40 in
source order, including its second live call on the first-call-not--1 branch.
Only the exact native force comparisons may select the troop. The troop's
canonical+40 body revalidates it, rereads its leader and derives the leader's
force through the current legion. Raw+44, subject, target and saved cursor are
native locals and are not recomputed after callbacks.

## Explicit unknowns and remaining suffix

Unknown troop virtual+08, +2C or+40 calls require ordered `effect-query`
observations. Each binds source, callsite, virtual slot, pointer, full call
stack and before-frame; it may replace the complete frame and RNG state. No
unknown virtual call is assumed pure or false. After a replacement, subsequent
reads and virtual resolution use the new frame. Predicate results must be
booleans; force results must be signed32.

The exact observation boundary is`004BA345/event9-reaction-suffix`, covering
`004BA345` through the return from the call at`004BA467`. It preserves troop
pointer ESI, cast target EDI, captured raw44 EBX, EBP/new-force=-1, old-force=-1,
saved subject, symbolic entry ECX manager and saved next cursor. The suffix
contains force-pointer conversion, virtual+48 display gating, presentation,
`004B5020`, `004AD2B0`, live home lookup and`004AD220`. Those operations remain
observed, not natively executed. Virtual+48 changes only the presentation route;
both routes still reach the mutating reaction at`004BA432`.

Successful commands commit one revision. Missing/misbound observations fail;
unknown-effect rejection and exhausted guards roll back the whole frame.
Earlier recorded effects remain diagnostic evidence of the rejected attempt.
Replay binds exact inputs and explicit observations; it does not authenticate
an observation as an actual game capture or establish global RNG consumption.

Older production APIs, frames, traces and behavioral tests remain byte-identical.
The inherited P0-72 test32 integrity guard retains its already approved strict
metadata-pin correction; no behavior assertion or oracle is changed.

## Formal integration and verification

Baseline: PR #30 merged main `82432a2c5b85ba8b9e443217b8da1b925441b10c`.
The 161 reviewed additions include this guide. The formal P0-72 guide107 is
preserved, so 1,422 baseline files plus161 additions produce1,583 tracked files.
Only this manifest/checker baseline and three P0-72 metadata pins change among
source verification inputs. The pins cover its manifest, source checker and
the approved model-checker metadata correction. P0-72 → P0-71 → P0-70 → P0-69 →
P0-68 → P0-67 source metadata and separate historical-extraction assertions are
recursively proved against actual files. Production, all39 model groups, raw
assembly/data and reports are byte-identical to the reviewed isolated increment.
Six main indexes and this guide/source README are reconciled for integration.

Fresh latest-main116/116 commands passed in one frozen run: TypeScript,85 Node
tests,113 Python checker commands and2 demos. The39 model groups,21 new source
plus21 inherited and nested17/12/13 groups passed; both whole-IDB fingerprints
and all1,297 raw-ID1 intervals were rechecked, and the18 historical independently
authored probe groups passed on the formal candidate. All119 command logs were
hash-checked. Every command used the same fixed-inode per-command fcntl lock;
npm/node inherited NODE_OPTIONS=--max-old-space-size=512 --test-reporter=tap,
with product argv unchanged. Independent integration-delta review passed.
All1,583 tracked file hashes and the real Git index stayed identical across the
full and supplemental checks; only5 result documents were then updated for
separate review. No test failed or was waived in this formal-candidate run.
Capstone5.0.7 historical reports were hash-checked, not re-decoded. This is local
verification, not remote CI or runtime/clean-stock certification.

The focused corpus has150 intervals:116 inherited reuses and34 new unique
intervals,122 complete-function code intervals and28 data intervals;9,102
selected interval bytes,2,328 instructions,212 calls,319 relative branches and
1,280 new code bytes. The full inherited/new closure has1,297 selected raw
intervals: S1 642/75,192 bytes and S2 655/75,584 bytes. Overlapping selected
bytes are counted, not claimed as unique-byte coverage.

Run the independent checks from the repository:

    PYTHONDONTWRITEBYTECODE=1 python scripts/check_native_event9_selection_profile.py
    PYTHONDONTWRITEBYTECODE=1 python scripts/check_native_event9_selection_source.py

The source checker has21 new groups plus21 inherited and nested17/12/13 groups.
Optional --idb-s1, --idb-s2 and external --report arguments repeat whole-IDB and
selected raw-ID1 verification. No original executable or recovered machine code
is executed. MOD-associated S1/S2 evidence does not certify clean-stock PK,
Vanilla, console/runtime/original-save equivalence or global RNG.

Presentation/reaction after004BA345 remains observed through004BA46C. Event16/18,
canonical capture/surrender/captive policy, force extinction, recursive ruler
ownership, positive refunds/resources, other cancellation, S2 effects/full
vtable extent, fallback reset scheduling and unrepresented memory/platform/
concurrency remain open. This is bounded event9 live selection, not completion
of event9 or capture.

See [source evidence](../sources/native_event9_selection/README.md),
[open exactness](13-open-exactness.md) and [fallback debt](16-unresolved-rules-fallbacks.md).
