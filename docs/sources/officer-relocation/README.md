# Officer relocation source evidence

This separately versioned P0-67 theme is based on merged P0-66 main
`5215348ebd12cd4bc7b221008775052411fb92bb` (PR #24), whose tree
`5abaed889e2d2329040c7f55f1a9b3cd90ef408d` matches the independently reviewed
P0-66 snapshot. Earlier APIs, frames and traces remain unchanged.

## Provenance and limits

- S1 IDB SHA256: `c591cb40ce6d6be9246148002532dedc042463f36cd39c5ed300b7c449feefab`
- S2 IDB SHA256: `aa7f2c983b266633d6e23c494d4f8e1b03e5251632505cae103e176ae850dfd8`
- Both IDBs are MOD-associated. Public pinned URLs, recorded input paths and
  recorded EXE hash metadata are in [the manifest](../officer-relocation.json)
- No EXE was independently fingerprinted or executed. Equal selected bytes do
  not prove clean-stock, Vanilla, console, runtime-vtable or global-RNG behavior
- `recovery-evidence.json` and `recovery-verification.json` preserve the earlier
  byte recovery and verification records unchanged. They are evidence of that
  static recovery, not a claim that each later checkout ran the raw-ID1 check

## Corpus and independent verification

The local corpus has 92 regions, 14,930 selected bytes across both sources,
44 paired starts, 40 equal pairs and four differing pairs. Differences occur at
`004890F0`, `004A5600`, `0072F930` and mutable storage `06EE794C`. Four S2-only
regions (`00489116`, `0072FC90`, `0090CBA0`, `009142F8`) retain split function
regions, cleanup and source-specific hooks. In particular, `00489116` is a
separate region even though the research summary called out only three extra
starts. The manifest and function-region inventory are authoritative here.

The independent stdlib checker verifies byte columns, continuity, file and raw
interval hashes, all 718 local direct/indirect callsite records, source-specific
function tails, and critical native operands/branches. Calls are recognized at
the recovered row boundaries; this is not a fresh independent x86 disassembly.
Direct relative targets are independently decoded from their five bytes.

The inherited closure pins 17 source manifests, recursively following their
`priorEvidence` links; 622 physical source files; and 23 local Python modules
reachable by static imports from the P0-66 planner. It parses 1,852 inherited
range records, resolves referenced intervals, checks overlapping bytes agree,
and verifies inherited recorded call bytes and relative targets. The optional
raw check covers 1,232 unique interval keys (147,773 selected bytes, including
partially overlapping intervals) across new and inherited evidence. This is a
bounded evidence/API dependency closure, not all-game machine-code closure.

Run from the repository root:

    python scripts/check_officer_relocation_source.py
    python scripts/check_officer_relocation_source.py --idb-s1 /path/to/S1.idb --idb-s2 /path/to/S2.idb

The optional check fingerprints each entire IDB, parses its uncompressed ID1
section with a separate stdlib reader, and compares every selected byte using
the low byte of each four-byte ID1 word. It does not run target code.

## Contracts deliberately kept open

- Whole `004B40C0` ruler transfer/capture is an exact full-frame/RNG effect-query
  or atomic rejection, including its ignored-by-caller signed return
- Cancellation is native for mission37 and recovered stubs, and directly
  composes live mission23/24 primitives. All other reached handlers retain
  exact-call observations or rejection
- `004891C0` actual valid troop membership remains a read-only query when the
  raw location is in troop range. Location range alone does not imply membership
- Non-base `00489610/virtual+3C` coordinates remain a source/actor/location/stack/
  full-before-frame-bound read-only query. `06EE794C` is mutable storage:
  S1's zero and S2's -1/-1 snapshots are never runtime defaults
- The signed 128-dword base table `0079C358` is separate from the inherited
  unsigned-byte city table. Fixed lookup memory is a declared profile assumption
- Existing opaque S2 hooks, observers, presentation, troop-event9 reaction,
  force extinction, recursive-return ruler ownership, allocation and memory
  domain limits remain unchanged
