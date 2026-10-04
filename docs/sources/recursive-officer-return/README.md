# P0-62: recursive officer return, rosters, roles and events

`../recursive-officer-return.json` pins a new source profile, with the complete
P0-57 officer-return, P0-58 role and P0-61 event-composition evidence union. It
adds **no machine-byte range** and does not change those previous profiles.

## Verification and scope

- 611 distinct `(source, start, endExclusive)` intervals, 53,266 selected bytes
- S1: 303 intervals; S2: 308 intervals
- 302 same-width source pairs: 296 equal, 6 different
- 7 unpaired interval shapes, including differently sized functions and S2
  extensions; these are not all source-exclusive functions
- 121 duplicate interval references removed; overlapping ranges retain their
  own widths and are checked for byte consistency
- Both complete IDB hashes were independently verified on 2026-10-04, and
  every selected interval matched a direct raw ID1 low-byte read
- Five unchanged shared Python primitive/adapter dependencies are hash-pinned
  as source text, without importing or executing them in the source checker

The identities are the separate MOD-associated S1 and S2 IDBs. Their recorded
EXE hashes are metadata, not independently authenticated binaries. No game
EXE, machine code, capacity hook, native allocator or callback was executed.
Local equality does not establish transitive behavior or real-save equality.
PC-PK1.1 remains compatibility reconstruction; Vanilla remains an independent
compatibility assumption; consoles and clean stock verification remain open.

Run the standard-library-only committed-corpus check:

```sh
python scripts/check_recursive_officer_return_source.py
```

Optionally verify locally available source IDBs as well:

```sh
python scripts/check_recursive_officer_return_source.py \
  --idb-s1 /path/to/S1.idb --idb-s2 /path/to/S2.idb
```

The independent reader checks each whole-file SHA256, verifies the known
uncompressed IDAv6 ID1 layout, and reads byte values at four-byte flag stride.
It neither imports IDAPython nor trusts rendered instruction names. Tests read
contiguous byte columns and verify exact calls, branches, scalar stores,
complete call ledgers, overlapping ranges, and the dependency/adoption bounds.

## Saved caller values and live continuations

`004BF6F0` saves target ID, old status, old-home pointer and old-legion pointer
before notice. Its target-governor lookup/person resolution is present even
though its result is unused. After notice it resolves a saved force pointer,
then checks live ruler status and live force comparison before ownership.

Home changes and roster sorting precede actual troop membership. A location
write precedes its UI callback. Only after that callback does the caller read
person force for the signed range gate, read it again for comparison, and read
target force. The comparison's person-force value survives a mutable target
query as a caller local.

The target legion is read before the setter and again after its sort. The new
legion pointer from the second read is saved across the old-legion role call.
Changes made during that call do not cause the new-legion pointer to be
resolved again. After both role calls, target and saved old-home legions are
read from current state for the final governor-reconciliation gate.

Building force is a separate query: `00487EB0` can use facility metadata,
building `+0C`, or territorial-city ownership before its subtype fallback.
It cannot generally be replaced by “force of building's legion.”

## Person validity depends on raw state

Person pointers use the fixed canonical type10 vtable. Its +04 getter is
004883F0 and +08 getter is00488430, verified separately in both sources.
rawDword17C is preserved as an unsigned raw dword without guessing its meaning.
A nonzero value makes both allocated and valid true. With rawDword17C zero,
allocated is true exactly for signed status0..8; valid additionally excludes
status6 and8. Both are computed getter results, not independent storage flags.

The expanded frame validates these derived caches on input and every observed
before/after. Native status writes recompute both BEFORE recording the step.
This is necessary after mutable rank effects: promoting status6,8 or an
out-of-range readable saved person to1 changes subsequent role and event gates
immediately, even without another callback. Stale caches are rejected rather
than silently normalized as input. Other object-validity booleans remain explicitly observed getter results, not
claimed independent raw bits; this version does not natively write their raw
validity dependencies. Schema-valid observations are not certified native
reachable states. Previous versioned APIs are unchanged.

## Logical list domain and sorting boundary

Remove searches from the head and erases the **first** matching pointer only.
Append never deduplicates. Same-home and same-legion setters still remove and
append; invalid requested legion IDs are rejected only after old-roster removal.
The logical implementation requires readable acyclic lists and successful
allocation. Native pointer corruption, failures and pointer reuse are outside
that representation domain.

`0047CD50` with entry count below two returns success immediately. It does not
filter invalid entries, allocate, compute keys, rebuild, or call callbacks.
For two or more entries it is an explicit whole mutable effect boundary:

1. Allocate temporary key/pointer entries
2. Walk source nodes and invoke person virtual `+14` per allocated occurrence
3. For caller arguments `(1,0,0,0)`, select comparator `004A6960` through
   `0047C6A0`; other flags follow different paths
4. Clear the original list only after temporary sorting
5. Recheck allocation while appending sorted pointers back

A rank mapping or ordinary language-library sort cannot reproduce arbitrary
callback ordering, filtering, allocation failures or transient mutations.
The observed whole-call boundary is deliberate. The roster receiver is saved
across the call, rather than re-resolved from changed person fields.

## Role recursion details

`004BE2A0` saves old leader before candidate collection and selected leader
after sorting. If clearing the old home governor dispatches recursive events,
the outer caller still writes status 3 to its saved old leader on return.
`004898F0` has a numeric status gate, without an object-validity gate.
Selected ruler status is subsequently read live. Its home is read after the
route query. A selected-governor event can recurse, yet the outer caller then
writes the saved selected person's ID to the legion leader. The final loop
visits bases 0 through 86 and reads each current legion after earlier events.

`004BCA30(refresh=0)` copies home-roster order and duplicates into a local
candidate list. Its filter saves base legion once before route queries, checks
person legion before each query, and does not repeat that comparison after
callback mutations. `00489730` rereads person home after its route predicate.
Selection keeps the last surviving status <= 1 candidate; other ranking stays
behind the whole `004AA200` observed effect/query. Old governor is resolved
after selection. An empty result calls the governor setter and then emits
event 14 unconditionally, even after nested event 8 work.

`004B3A20` validates base and requested person on entry, then emits event 8 for
a valid different old governor **before writing**. On return it rereads the
governor, discards that read, converts the saved requested pointer to its ID,
and calls the live subtype setter. It does not revalidate the requested
person. The outer write can overwrite a nested governor change. Same governor
suppresses the event only, not the setter.

## Explicit exclusions

Ownership/capture `004B40C0`, force extinction `004B80A0`, and empty-legion
merge/redistribution `004BE348..004BE4D7` are rejected atomically by the bounded
composition. General sorts, route queries, presentation and UI callbacks need
explicit frame/stage-bound observations. Unknown work is never silently
assumed noninterfering, and previous preplanned transactions are not replayed
as native recursive calls. Engine depth/budget guards are software safety
limits, not recovered game termination rules.
