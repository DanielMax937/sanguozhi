# P0-58: stable legion/governor reconciliation

`../legion-role-reconciliation.json` pins separate S1/S2 source identities, exact bounded ranges, prior evidence hashes, and source-specific capacity deltas. The adjacent text files contain new byte ranges; prior ranges are reused through hash-pinned manifests.

- 85 functions and 13 data ranges per source, plus 3 S2-specific capacity excerpts
- 199 ranges: 88 new and 111 referenced; 21,881 selected bytes
- 94 of 98 common range pairs match; four capacity/query helpers differ
- Every range matched an independent direct ID1 low-byte read at extraction time

The source paths are MOD-associated. Recorded EXE hashes are IDB metadata. No EXE or native code was executed, no original-game runtime or save parity was checked, and byte matches do not imply transitive behavior equality. PC-PK1.1 remains compatibility reconstruction; Vanilla is a separate compatibility assumption; console versions remain open.

The bounded role projection covers `004BE2A0` after force/corps presence gates and `004BCA30(refreshFlag=0)`. It preserves transient status/governor operations, last-in-roster leader selection, distinct capacity/office/ability comparators, and events before scalar writes. Capacity and route resolver outputs are source-bound observations; mission listeners/UI and allocator internals are explicit boundaries. Force extinction, empty-corps redistribution, refresh!=0, native callback execution, and full capture/return composition remain deferred.

Run the standard-library-only committed-corpus check:

`python scripts/check_legion_role_source.py`

This checks contiguous byte columns, hashes, relative calls, vtables, branch/store ordering, switch tables, source differences, and the bounded adoption contract. It does not execute the game model, IDBs, machine code, or callbacks.
