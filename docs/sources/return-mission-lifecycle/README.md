# P0-56 mission37 lifecycle: static source corpus

This corpus is limited to source-local mission37 completion and a single eligible
routed active-person advance. It does not complete the active-list scheduler,
return-home/role reconciliation, or a whole capture transaction.

## Provenance and reproduction

On 2026-10-04, both previously fingerprinted IDB files were read directly using the
existing trusted `python-idb`/`lowmem_idb` static parser. Full IDB SHA-256 values
were rechecked, all 106 ranges were reread, and contiguous code bytes were rendered
with Capstone. Matching previously committed ranges were checked against their
existing hashes. A second readback directly took each low byte from the raw ID1
section at four-byte stride, independently of IDAPython/Capstone; all106 committed
ranges matched. No EXE was launched. The recorded EXE hashes are IDB metadata,
not independently verified binary hashes. Both input paths are MOD-associated.

The JSON manifest contains source URLs/identities, separate range and container
hashes, exact line spans, and 53 S1/S2 comparisons. Each source has its own code
and data text files. The `0048D820..0048D859` tail chunk is explicitly bounded;
using its IDA parent function's earlier end address would incorrectly omit it.
The original IDBs are not redistributed here.

Run `python scripts/check_return_mission_source.py` from the repository root.
The checker is standard-library only. It parses byte columns independently of
mnemonics, verifies continuity and hashes, decodes relative call targets and switch
tables, and checks the exact branch, write-width and ordering opcodes. It does not
execute machine code, a game model, or callbacks.

## Source-local results

- Cancellation `005B9B40` explicitly skips mission37. Completion table
  `005BA2E8[37-2]=15` and `005BA298[15]=005BA1E6` instead dispatch to `005B9B90`.
  This handler returns1, while `005B9E10` returns0 for that arm: its return register
  is not copied into the dispatcher's zero-initialized EDI. Dispatcher actor scratch
  at manager+4 is cleared on exit; the caller ignores the return and rereads mission.
- `005B9B90` checks person validity, resolves home, calls actor/home virtual+44
  without comparing the results, refunds positive signed args[0], then clears
  mission/five args and duration. Refund occurs before reset. There is no home-valid
  check before dereferencing it, no same-location requirement, no acted/location
  write, and no `004BF6F0` call. Safe canonical valid home is a projection boundary.
- The caller's active list starts at manager+0x188 (`00482AE0`), not an ID scan.
  `0047BED0` reads current node, writes node.next to the cursor before returning
  payload address node+8. `00482F20` then reads current person validity, mission0..43,
  and acted bit0=false. These are live per-visit reads, not a snapshot of all people.
  `00599CF0` checks global stop `096A59F8` before each getter invocation and rechecks
  the returned person's validity. Safe readable list nodes/unchanged links are not
  established by a single-member scalar projection.
- Movement table `005BA3F0[37-9]=3`, `005BA3DC[3]=005BA393` selects actor.home.
  `005BA320` accepts its numeric0..16383 range and optionally returns both building
  ID and observed territorial city. The routed branch has no duration==0 gate.
- `00598D60` returns target immediately when current==target. Otherwise it requires
  current-city validity, reads exactly six runtime neighbor slots (`city+0x1c`),
  accepts numeric0..41 neighbors, and minimizes `0047B480(neighbor,target)` strictly.
  First equal-score slot wins. Neighbor-object validity, ownership, random choice,
  city-ID sorting and improvement over current distance are not tested. Invalid
  target-city distance returns-1; restricting geography is a model boundary.
- En route: guarded move, direct acted1, distance read, duration low byte. Arrival:
  guarded move to actual target building, duration0, save mission, completion,
  reread mission, valid actual-base gate, optional `004BF6F0`, direct acted0, then
  direct duration0. Invalid next city performs only mission/five-args reset.
- `0048A8B0` is the duration byte setter at person+0x158, also called by `004A5660`.
  It is not a second action flag. `00489B40` writes only bit0 of person+0x124 and
  calls cache/UI helpers. The arrival caller invokes it directly; the different
  S2 query267 `004A5600` cancellation wrapper is not used here.
- `004A0CF0` requires allocated person, false actual troop membership and numeric
  target0..16383. The membership predicate also requires a valid troop and person
  membership; a troop-range location alone is insufficient. `00488350` preserves
  only canonical0..86 base IDs, otherwise-1. `004A0CB0` writes location dword and
  calls `004B9480` under its own allocated/ID guards.
- `004AE2A0` uses signed32 wrapping addition and clamp, with separate building and
  subtype validity checks. S1 city money cap100000; port/gate10000 or40000 with
  valid-force query33. S2 city200000; port/gate50000 or100000 with query38. Getter
  and writer caps are both separately retained. Invalid subtype is not silently
  treated as a successful valid-resource write by the bounded model.

## Equality and limits

The person-pass subrange `00599DF8..0059A019` is byte-identical and separately
hashed. Seven full ranges differ: city money writer `0047BCF0`, port/gate writer
`00483660`, cap helpers `00486D30`/`0048D820`, cancellation acted wrapper `004A5600`,
whole caller `00599CF0`, and distance table `0079B830` (1084 of1764 bytes differ).
The caller's difference is its later `0059A06B` building update: S1 CALL005CAFD0,
S2 JMP008EAA30, outside the equal person pass.

`004BF6F0` body is included as evidence for a deferred boundary. Its notifications,
ownership/capture, home/legion lists, actual-location writes, role reconciliation
and force consequences are not executed here. Continuing scalar writes after that
call requires explicit noninterference/record policy. No local direct RNG call in
these mission37 arms proves nothing about omitted transitive callbacks or global
RNG. Clean stock PC-PK1.1, independent Vanilla, consoles and original-save runtime
behavior remain open.
