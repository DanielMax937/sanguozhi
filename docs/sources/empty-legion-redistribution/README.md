# P0-65: bounded empty-legion redistribution evidence

Source profile: `source-idb-S1-S2-empty-legion-redistribution-v1`.
Baseline: `116c6dd44d7fc1d102b3dab6f9716a8dde3a4abe`.

The manifest pins two MOD-associated IDBs and records 155 independently read intervals (26,651 total bytes): 77 same-shape pairs plus one S2-only hook. Each code interval is a complete IDB function; data ranges have explicit bounds. Every byte was checked independently against the ID1 low-byte-at-four-byte-stride representation. EXEs and target machine code were never executed. Recorded EXE hashes are IDB metadata, not independently verified originals.

## Reproduction

Run `python scripts/check_empty_legion_source.py` for 22 source-only tests. The checker uses only the Python standard library and imports no behavior model, IDB parser or disassembler.

Optional source-file verification:

    python scripts/check_empty_legion_source.py --idb-s1 /path/to/S1.idb --idb-s2 /path/to/S2.idb

This verifies the complete IDB SHA256 and each selected range through a separate raw ID1 reader. Function extents originate in the fingerprinted IDBs; the raw reader independently verifies byte contents, not IDA's function classification.

## Recovered behavior

- `004BE2A0` first requires a valid legion and signed force ID 0..41. The force-presence test remains distinct from the legion-presence test. `004B9550` requires BOTH a valid matching city and a valid matching officer, in that order, with no officer status mask. Missing either enters the empty-legion branch
- Nonprimary legions merge into their force's first valid ordinal-1 legion. `00481240` scans canonical legion IDs 0..46 ascending, accepts requested ordinal 1..8, and uses pointer-to-force-ID conversion without reading force validity
- Primary legions gather same-force valid cities in ascending canonical city ID order, exclude their own legion, then choose the nearest candidate by directed territorial-city distance. Equal minima remain in collection order. The selected city's legion merges into the primary
- The fallback calls ordinal lookup for 2..8 but discards its return value, then uses each ordinal itself as a global legion ID. That exact register behavior is preserved. There is no presence-based early exit inside this fallback loop
- `004BD3B0(source,destination)` demotes a valid source leader when status <=1, conditionally clears the source leader through the separately guarded setter, refreshes the saved leader's live home, snapshots the source roster twice before sequential reassignment, scans facilities 0..16383 for matching live legion ownership, checks snapshot members' home-legion mismatches against the destination leader's home, and finally resets the source
- The merge has no source/destination validity, same-pointer or same-force guard of its own. Its source must be readable. A null destination skips redistribution but still reaches reset
- Constructor `0047EB18` proves vtable `0079BFB0`; slot +20 points to `0047E470`, not the neighboring type getter. Reset writes zero to dwords +08/+24/+28 and byte +2C, -1 to +04/+0C/+10/+14/+18/+1C/+20, configures +28 to 0x7ff with +20=-1, and clears the +30 roster. Padding +2D..+2F is untouched

Canonical cities use fixed vtable `0079BF58`: allocation forwards to validity, validity compares virtual +24 to type6, and +24 is the constant-six getter `0047B110`. Thus both predicates are true for all 42 canonical city slots under successful readability probes and the unmodified-vtable domain. Missing allegiance is `legionId=-1`; it is not `city.valid=false`. A bounded native frame must not omit canonical cities as presumed invalid slots.

Canonical gate and port vtables `0079C170` and `0079C7D0` likewise forward allocation to validity, then compare their constant type getters to7/8. Complete constructor stores, getters and constants prove that all87 canonical subtype slots are valid and allocated in the declared domain. These subtype predicates are distinct from the corresponding generic building object.

Generic building constructor `004880A8` stores `0079C718`. Its +24 type getter `00573470` returns5; +08 validity getter `00486400` then accepts exactly signed raw building kind0..63. Allocation forwards to that validity getter. Accordingly, generic `kind=-1` represents an invalid slot; `kind=0, valid=false` is contradictory in this domain. Fixed subtype slots remain valid even when their corresponding generic slot is invalid.

## Source differences and RNG

Four paired ranges differ: `00472150` (4 bytes), `004C0C30` (11), `0079B830` directed-distance table (1,084), and `0079C2B0` territory mapping (32). The property-5 branch of `004C0C30` is identical and resolves city +38 legion ID; the other differences do not justify whole-function equivalence.

Nearest selection calls `00472150` even for one tie, but count <2 returns zero without advancing RNG state. S1 uses the saved RNG state directly. S2 calls complete helper `008EB010..008EB02D` before the same LCG:

1. Read uint32 from 7FFE0320, then 7FFE0008, then 7FFE0014
2. Sum with uint32 wrap, take low16, add the live RNG seed with wrap
3. Return this seed operand; the caller performs the LCG, store and modulo

These are three independently sampled Windows shared-page reads. No field names or simultaneous snapshot are inferred. Exact source/stage-bound observed values are required when reached; missing values cannot default to zero. The hook itself makes no calls or writes.

## Explicit implementation boundaries

Full top-level bodies for `004AD550` base redistribution and `004A8270` personnel relocation are present. Their nested ownership, event, ruler, governor, mission, movement and UI effects are not collectively proven or implemented by including these bytes. The bounded composition must consume exact stage-bound mutable observations or reject atomically. Existing role, sort and return behavior is chained to its prior evidence; hooks are not assumed pure.

Force-extinction entry `004B80A0..004B8521` is fully recovered, with a complete call ledger and IDB boundaries for its direct callees. This establishes the separate force-extinction transaction boundary, not its transitive closure. Unit effects, force-wide state, event15, personnel transfer/release, legion resets, ruler postprocessing and final force refresh remain wider work. The implementation defers force extinction atomically.

No evidence here verifies clean stock originals, PS2/Wii behavior, global callback purity, complete game execution or original-save equivalence. PK use is a compatibility reconstruction; Vanilla use is a separate compatibility assumption.
