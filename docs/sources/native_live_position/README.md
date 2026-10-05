# Native live position: independent dual-IDB source evidence

This separately versioned source profile closes canonical `00489610`
position-pointer resolution plus the `0047A950` packed-position/map read, using
explicit live troop coordinates and explicit mutable fallback storage. It adds
no runtime constant inferred from an IDB data snapshot. Formal integration baseline:
PR #29 merged main `8a47624d5923b447597c9fab18dc1e84fa1eade4`.

The reviewed 74-file isolated increment is reused. Production, all 31 behavioral
model-test groups, assembly/data and historical reports remain byte-for-byte
unchanged. The model checker is not byte-identical: only test32's strict inherited
source-checker SHA256 is updated to the recursively proved integrated P0-71
metadata version; no behavioral assertion or expected result changes. This
manifest/source-checker baseline, its two inherited P0-71 metadata pins and the
strict historical-extraction assertion are also reconciled. P0-71 → P0-70 → P0-69 →
P0-68 → P0-67 metadata are proved recursively against actual files, including
the P0-70/P0-71 historical-report assertions. The raw report retains its original
extraction baseline `8a0860b29e3cfac6266adcbdd9d6cc6505744c83`, asserted as a
separate fixed literal. [The guide](../../rules/107-native-live-position.md) and
six main indexes document this formal integration.

Latest-main 114-command regression, dual-IDB/raw recheck and independent
integration review are recorded in the formal guide and current status.
Historical isolated results do not replace that verification.

## Identity, provenance, and bounded claim

- S1 IDB SHA256: `c591cb40ce6d6be9246148002532dedc042463f36cd39c5ed300b7c449feefab`
- S2 IDB SHA256: `aa7f2c983b266633d6e23c494d4f8e1b03e5251632505cae103e176ae850dfd8`
- Both are MOD-associated sources, not clean-stock certification. Their pinned
  public provenance, recorded input paths and recorded EXE hash metadata remain
  in [the manifest](../native_live_position.json). No original EXE was
  independently fingerprinted, executed, or emulated
- Historical recovery full-file fingerprinted each source. Read-only
  `python-idb` metadata and byte reads were reconciled with separate raw ID1
  low-byte reads. Capstone 5.0.7 x86-32 decoded every selected code byte without
  gaps. Formal integration rechecks whole-IDB/raw-ID1; these historical Capstone
  reports are hash-checked only, not re-decoded
- The stdlib checker does not import the production model or execute target
  code. It verifies pinned byte columns, all direct/indirect call sites, relative
  branch targets, exact region hashes, inherited sources and retained API files
- This is a fixed canonical readable-pointer, unmodified-vtable/IAT domain.
  Missing reached in-range rows are missing model data, never native null or
  invalid rows. Platform pointer probes and arbitrary process memory remain open

## Complete path and exact read order

`0079C780+3C` points to `00489610`; the canonical person constructor and the
entire method through `00489689 RET` are pinned. The method does not validate the
person itself. It saves signed raw person `+9C` in ESI exactly once.

1. For saved location `0..86`, pass that ID to `00490D00`; otherwise pass `-1`.
   The getter constructs a canonical base pointer and does not read the base
2. Pass that pointer to `0047A630`. Null is invalid. For canonical readable
   base objects, `0079C718+08 -> 00486400` requires native type 5 and signed raw
   base `+08` kind in `0..63`. These are the inherited derived base-validity
   semantics, not a caller-supplied validity boolean
3. If valid, reload the base's current vtable and tail-jump virtual `+3C`
4. Otherwise, use the original saved location, without rereading the person:
   `87..1086` maps to troop `location-87`, all others pass `-1` to `00490E70`
5. Validate that pointer through `0047A630`. Canonical troop validity reuses
   the complete native leader/deputy proof from the frozen membership profile:
   type 11, native-valid leader, and exactly two signed deputy values `<1100`.
   Negative deputy sentinels pass; deputy person rows are not read. Position
   does not test whether this officer is actually a member of the troop
6. If valid, reload the troop's current vtable and tail-jump virtual `+3C`.
   Otherwise return the address `06EE794C`

The complete base/troop virtual implementations are four bytes each:

- `0079C718+3C -> 00487DC0`: `LEA EAX,[ECX+1E]; RET`
- `0079CC18+3C -> 00496030`: `LEA EAX,[ECX+3C]; RET`

These methods return addresses; they do not load X or Y. Constructors and
canonical vtable links are pinned. The common 26-slot troop block is sufficient
for the reached slots. It is not a claim that the S2 vtable ends after 26 slots;
its source-specific virtual `+68` possibility remains a frozen open question.

`0047A950` calls the actor's virtual `+3C`, then reads **one DWORD** at the
returned pointer, at `0047A956`. It sign-extends low 16 bits as X and high 16 bits
as Y. Both must be `0..199` before a map read. It computes `index=200*X+Y`, loads
raw territory DWORD at `06FB0E6C+20*index`, then extracts `(raw>>5)&127`.

`00483B00` reads the source-selected signed DWORD table at `0079C358`, with
`acceptNegative=1`. Negative values receive signed x86 NEG, including its
`INT_MIN` behavior. `0047A950` returns the result only in `0..86`, otherwise `-1`.
Both sources' signed base-table bytes currently match. This does not authorize
substituting the distinct, differing unsigned city-byte table `0079C2B0` or
inferring runtime immutability.

`004A6340` has a separate fast path: after validating the actor, a live location
in `0..86` is returned directly. No base validity, position, or map read is made
on that fast path. Other locations call `0047A950`.

## Mutable fallback and pointer lifetime

The four bytes at `06EE794C` are mutable process storage. The recovered snapshots
are S1 `00 00 00 00` and S2 `FF FF FF FF`; neither is a runtime default. The new
frame requires its `fallbackPosition06EE794C` pair explicitly, as signed16 X/Y.
Troops likewise require explicit signed16 coordinates. There is no migration
that silently fills these from a source snapshot.

Additional bytes `0073BE10..0073BE1B` load a DWORD from `0079C1D0`, store it at
`06EE794C`, and return. This is a complete ID0 function in S2. S1 has no ID0
function there, so its evidence is deliberately labeled a bounded straight-line
store/return block, not an invented complete function. These bytes demonstrate
a store to the fallback address; no initializer scheduling, reachability,
execution, or reset value is assumed. Even though both source snapshots at
`0079C1D0` are `FFFFFFFF`, the model never executes that block or uses it as a
default.

A returned symbolic storage identity is distinct from its later packed DWORD
read. Callback replacement must not leave cached row objects or coordinates.
Canonical pointer helpers have no represented callbacks between pointer return
and immediate caller dereference. Unknown troop virtual dispatch is not
native-invalid and cannot be assumed noninterfering: its unresolved continuation
is an exact full-frame-bound effect-query observation or atomic rejection.
Opaque pointer dereference requires a separate explicit read observation.

## Corpus and checks

The focused corpus has 64 intervals: 58 exact inherited reuses and 6 new unique
intervals, 3,356 selected interval bytes, 52 code intervals and 12 data intervals.
Of the code intervals, 51 have complete ID0 function boundaries and one is the
explicit S1 store/return block. There are 674 decoded instructions, 40 call
sites, 102 relative branch sites and 30 newly recovered machine-code bytes.
All focused paired code bytes match; the only focused byte difference is the
fallback snapshot. The initializer's source metadata differs as described above.

Complete-hash/raw-ID1 check scope covers all 1,263 selected inherited/new
intervals: S1 625 intervals / 74,088 selected bytes and S2 638 / 74,470. Byte totals
include deliberately overlapping intervals. All overlaps agree.

Run from this repository:

    PYTHONDONTWRITEBYTECODE=1 python scripts/check_native_live_position_source.py
    PYTHONDONTWRITEBYTECODE=1 python scripts/check_native_live_position_source.py --idb-s1 /path/to/S1.idb --idb-s2 /path/to/S2.idb --report /path/to/report.json

The checker has 21 new source groups and invokes the frozen 17-group membership
source suite, which retains its 12-group and 13-group nested predecessors. Its
final structural test parses production syntax without importing it: explicit
signed16 schema, no fallback default, saved-location read, effectful unknown
virtual dispatch, pointer-before-live-dereference and source-selected map use.
Independent behavioral model tests are a separate deliverable.

## Remaining boundaries

Canonical capture/surrender/extinction and recursive ruler ownership; positive
refund/resource effects; remaining cancellation bodies; presentation and S2
patch effects; event9 troop reaction; unknown vtables and unrepresented memory;
platform faults; concurrent mutation outside explicit callbacks; global RNG;
stock/runtime/console certification all remain open. This stage does not change
any frozen predecessor API or IDB. The six main indexes are reconciled for
this integration; no remote write is performed by this local stage.
