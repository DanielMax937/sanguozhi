# Native zero-refund tail distance: bounded source evidence

Baseline: PR #27 merged main `8b21e340d577810ca664e829d1d9cb35b1046fc4`.
The two immediate inherited pins change only for the formally integrated P0-69 metadata/checker baseline and its recursively proven P0-68/P0-67 metadata pins. Production, model tests, assembly/data and raw/disassembly reports remain byte-for-byte identical to the reviewed isolated implementation. The raw report retains its historical extraction baseline `803d6aa6ea8b9af38f96cda892e4cd4278a4d290`; its checker asserts that exact historical identity separately from the current integration baseline.
Profile: `source-idb-S1-S2-native-tail-distance-v1`.

## What changed

The additive profile replaces only the inherited live `query / 0049E4D0` boundary
inside `005B8400`. It invokes the already recovered
`OfficerRelocationPrimitives.movement_distance(current, home)` in the same frame.
The preceding generic-facility, live-zero-refund, officer-relocation and older
APIs, byte evidence and replay contracts remain frozen.

The 46 focused source intervals are all inherited/reused intervals: 40 code
intervals and six data intervals, 6,078 bytes across both sources, 780 instructions,
80 call sites and 72 branch sites. There are **zero new unique raw intervals and
zero newly recovered machine-code bytes**. Their complete byte columns are copied
for focused review, compared to the original pinned artifacts, and during the isolated extraction
matched to the fingerprinted IDB ID1 bytes and independently re-decoded with Capstone 5.0.7
(x86-32). This is source verification, not execution of native code.

Historical extraction checked both whole-file IDB SHA-256 values below. Formal integration repeats the whole-IDB/raw-ID1 checks; the inherited Capstone 5.0.7 report is hash-checked, not newly re-decoded in this integration:

- S1: `c591cb40ce6d6be9246148002532dedc042463f36cd39c5ed300b7c449feefab`
- S2: `aa7f2c983b266633d6e23c494d4f8e1b03e5251632505cae103e176ae850dfd8`

The optional raw check also covers all 1,236 unique inherited selected intervals
(612 S1, 624 S2; overlapping intervals remain separately selected). The source
checker imports only stdlib and frozen source checkers. It does not import the
production planner. Its separate AST checks bind the small interceptor's native
argument order, saved-distance placement and MRO without executing that model.

## Exact native data flow

1. `005B8405` reads the **live** actor's raw location. Signed comparisons at
   `005B840E..005B8415` normalize any value outside 0..86 to -1.
   `005B8418` snapshots the **raw** home ID into EDI. Equality at `005B841E` compares
   normalized location with raw home; home is not normalized first. There is no
   actor-valid gate at the `005B8400` entry.
2. The away path uses `00490D00` twice to construct current and home generic
   building pointers. Signed IDs 0..16383 produce fixed-array identities; others
   produce null. The getter does not inspect building validity, kind or fields.
   The model retains the earlier conservative requirement that any in-range
   current/home slot be represented, even though the native getter only constructs
   an address. This is a declared model domain, not an extra source branch.
3. `005B843B` pushes home, `005B843C` pushes current, and `005B8442` calls
   `0049E4D0(current, home)`. The distance helper first calls
   `0049E450(current)`, saves that scalar in EDI at `0049E4E5`, then calls
   `0049E450(home)`. It pushes second then first for
   `0047B480(firstTerritory, secondTerritory)`. The second lookup is still
   performed when the first returned -1.
4. `005B844F` stores the returned signed distance in **the tail's** EDI. This is
   distinct from the distance helper's first-territory EDI lifetime. The model
   saves `savedOriginTerritoryId` inside the `0049E4D0` scope and `savedDistance`
   only after that scope has popped, in the enclosing `005B8400` scope.
5. The tail calls `004A73A0(person, cancelFlag=0, mission=37, refund, 0, 0, 0, 0)`.
   The supported call uses refund=0. The mission writer reads live actor validity;
   its direct acted writer and observer effects precede its live active-list
   validity/read. There is no S2 skill267 gate on this away-path direct writer.
6. `005B8465` pushes the **saved** distance for `004A5660`. Its actor-valid gate is
   fresh, after possible observer frame replacement. If valid it calls
   `0048A8B0`, which loads AL and writes actor+0x158. Callback mutations of home,
   location, coordinates, map cells or existing duration do not recompute distance.
   Callback invalidation can suppress the final duration write.

Same-home behavior remains inherited: reset mission, duration0, acted wrapper,
then live status check and possible return finalizer. The saved raw home survives
acted effects. `004A5600` itself still differs by source: S1 calls `00489B40`, S2
calls `0090CBA0`. Equal tail bytes never erase that distinction.

## Territory and exact integer behavior

`0049E450` first calls `0047A630` (null/probe/virtual-validity). In the fixed generic
building vtable at `0079C718`, slot08 is `00486400`, slot24 is `00573470` (constant5)
and slot3C is `00487DC0` (`return this+0x1e`). Canonical generic validity requires
kind0..63; the frame enforces that relationship. Territory performs **no additional
base-only ID, category, city/gate/port subtype or owner gate**. Valid generic
facility IDs87..16383 and kinds3..63 use the same coordinate route. Category data
is irrelevant to this helper.

The packed position is read as signed16 x and signed16 y (`MOVSX AX`, `SAR 16`).
Each must satisfy 0 <= coordinate < 200. Invalid coordinates return signed -1 and
do not read map memory. With these guards, `200*x+y` is 0..39999, so its x86 signed
multiply/add and subsequent 20-byte cell-stride arithmetic cannot overflow.
The read address is `0x06FB0E6C + 20*(200*x+y)`; its unsigned dword is shifted
right5 and masked127. The 7-bit index reads `0079C2B0[index]` using `MOVZX`.
All128 readable bytes are preserved, including adjacent entries255. No sign
conversion, clamping, alternate territorial-base map or guessed geography applies.

`0047B480` signed-checks both city IDs in0..41. On failure its result is -1;
otherwise it reads the unsigned byte at `0079B830 + origin*42 + target`. It does
not add one, subtract one, multiply distance, saturate or consume RNG. Invalid
territory255 therefore becomes distance-1. Duration truncation is modulo256:
-1 becomes255, 0 stays0, and a byte distance remains unchanged. The apparent
branches in `0048A8B0` still implement this same low-byte result; they do not clamp
a signed input to zero.

## Source-specific data, without a false asymmetry claim

The two128-byte territory mappings differ at32 indices; for example index42
returns5 on S1 and19 on S2. The two42x42 distance tables differ at1,084 bytes.
Their row-major native indexing is directed (origin first, target second), and
the model preserves this argument order. **Both actual captured distance tables
are symmetric**. There is no authentic asymmetric table cell in this evidence.
A synthetic asymmetric test can establish plumbing/order only, never native
source asymmetry.

## Boundaries and proof limits

- The distance closure has no application writes or RNG calls under the pinned
  fixed-vtable, successful-probe and readable canonical-slot/map domain. Its
  getters operate on the current shared frame; this is not a new snapshot frame.
- The raw live runtime grid was not captured. Supplied `mapCells` are explicit
  model input, not certified game memory. Missing reached map/slot evidence is
  rejected, with no guessed zero/default/neighbor route.
- Custom vtables, injected hooks, arbitrary/misaligned machine pointers,
  operating-system probe behavior, faults and concurrent memory mutation are
  outside this model. Canonical reads have no modeled opaque callback.
- Presentation, observer, query267 and other remaining effects retain exact
  ordered source/argument/call-stack/frame binding or atomic rejection. Removing
  this one scalar distance observation grants no authority to ignore or reorder
  any remaining observation, and proves no global RNG count.
- Canonical capture/extinction, ruler policy, troop membership, non-base position,
  unimplemented cancellation bodies, broad return/event tails, full transactions,
  scheduler behavior and machine execution remain open as inherited.
- Both IDBs have recorded MOD-associated source provenance. These hashes and
  disassemblies do not establish clean-stock PK, Vanilla or console equivalence.
  PK1.1 remains compatibility reconstruction; Vanilla is a compatibility
  assumption; PS2/Wii remain open. Recorded original-EXE hashes were not
  independently verified and original EXEs were not executed.

Run focused source checks with:

```sh
python scripts/check_native_tail_distance_source.py
python scripts/check_native_tail_distance_source.py --idb-s1 /path/to/S1.idb --idb-s2 /path/to/S2.idb --report /path/to/result.json
```

The committed verification reports contain hashes and verification outcomes only.
Raw input files and external raw-verification logs are not added to the repository.
