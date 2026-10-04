# P0-57 officer return finalizer: bounded source evidence

This corpus supports a separately versioned scalar projection of `004BF6F0`:
home, actual location, raw legion and person flag bit9, with an ordered ledger of
unexecuted list, notification, ownership, UI and role boundaries. It does not
complete a return transaction, role reconciliation or capture composition.

## Provenance and verification

On 2026-10-04, both MOD-associated IDBs were directly reread with the previously
used trusted `python-idb`/`lowmem_idb` static parser. Their full SHA-256 fingerprints
were rechecked. All 108 selected ranges (54 per source:48 functions and6 data
ranges) matched a separate raw ID1 low-byte-at-four-byte-stride read, independently
of `IDAPython.ida_bytes` and Capstone rendering. No EXE or machine code was run.
Recorded EXE hashes are IDB metadata, not independently verified binary hashes.

The new corpus contains only3744 raw bytes, plus54 hash-pinned references to prior
committed ranges, for9560 selected bytes across both sources. Each source has its
own new textual container. All54 range comparisons match, including vtables and
getters; this establishes local byte equality only. Source URLs, IDs, exact ranges,
line spans, container/range hashes and prior-manifest hashes are in the JSON.

Run `python scripts/check_officer_return_source.py` from the repository root. The
standard-library checker parses byte columns without trusting mnemonic labels,
checks continuity, all hashes, vtable entries, relative call destinations, exact
branch/store opcodes, and completeness of the six function call ledgers. It runs
no game model, IDB parser, native code or callbacks.

PC-PK1.1 remains compatibility reconstruction. Vanilla remains a separately
labelled compatibility assumption. Clean stock, console and whole-save runtime
behavior remain open. Nothing here changes earlier versioned contracts. The separate scalar API is
`project_officer_return`; its evidence flags `fullReturnExecuted`,
`callbacksExecuted`, `rostersExecuted`, `roleReconciliationExecuted` all remain
false. The model uses flags124 with acted checked against bit0, and sets only bit9.
Observations are source/provenance, noticeEligible, actualTroopMember,
oldLegionRosterContains and targetForceId; required reached observations are
preflighted. The explicit policies are noninterference-v1 and array-slots-v1.

## Caller order and scalar scope

1. `0047A630` checks person and target validity. Save target ID, old person status,
   old home pointer and old legion pointer before notices. The target governor
   getter and person lookup occur, although their result is unused.
2. If requested, `0047A6D0(person)` succeeds and person is not captive status5,
   format notice `004B93D0(messageId0x175d,person,target,noticeVariant)`
   then display `004F55E0(formattedText,target,1,-1)`. Formatter RET0x10
   consumes four arguments; caller cleans the four display arguments. Both remain boundaries.
3. Save current force object. Live ruler status0, equal person/target force, valid
   saved force object and force+0x128==0 reach `004B40C0(target,personLegion,0)`
   before any home write. Ownership/capture is never silently omitted.
4. `004A31E0`: remove old home roster entry conditionally, write home dword, append
   and sort new roster conditionally. Unchanged home still takes these calls.
5. `004891C0` requires both valid troop and person leader/deputy membership. Only
   when false, get canonical base with `00486680` and write actual-location dword
   via `004A0CB0`, followed by UI/cache callback `004B9480`.
6. Reread person force after earlier effects. Its numeric0..46 range and then
   equality to target force gate the affiliation/role tail. The caller does not
   test the target force object's validity. It invokes the person getter twice.
7. `004A32F0`: attempt old-legion roster removal before checking requested ID;
   write raw legion for-1 or0..46; set bit9 only for0..46; append/sort valid new
   legion roster. Neither unchanged legion nor requested-1 clears bit9.
8. Reread target legion after the setter. Saved old status<=1, currently valid
   old legion and different old/new pointers reach old-legion `004BE2A0`. New-legion
   `004BE2A0` is always called after the force gate, even for null new pointer.
   Finally, currently valid saved old home and live differing target/home legion
   IDs reach `004BCA30(oldHome,0)`. All role work remains deferred.

After PUSH EBP in the caller, stack+0x10 is saved old status,+0x14 old legion,
+0x18 target ID,+0x1c old home pointer,+0x20 saved force. Confusing target ID with
old-home pointer produces an incorrect old-home role gate.

The caller does not itself reset mission, five mission args, duration, acted bit0,
status, captive or forbidden-service metadata. These belong to separate callers
or deferred effects. The new bit9 write must not be mistaken for acted bit0.

## Pointer, roster and getter domains

`00490D00` returns a fixed building slot pointer for any ID0..16383, independent of
allocation/validity. The home setter tests pointer nonnull and reads kind; it does
not require the old building to pass `0047A630`. Kind0 maps ID0..41 to city roster
+0xb4, kind1 maps42..51 to gate roster+0x70, kind2 maps52..86 to port roster+0x70.
The mapped subtype has its own validity gate. Other kinds, wrong kind/ID pairings
and invalid subtype skip list calls, but the home scalar is still written.

Home remove helper `004A2CB0` invokes find `00482AF0(person,0)` and erases with
`00482FC0` only if find returns nonzero. Legion removal uses that find/conditional
erase sequence directly at legion+0x30. Appending `0047C1B0` precedes sorting
`0047CD50(1,0,0,0)` for both roster types. Reached calls do not prove successful
allocation, actual erasure or sorted contents. The ledger preserves boundaries,
not list mutations. Full list allocator/free/sort callback closure is deferred.

Actual location87..1086 by itself is not troop membership. `004891C0` checks the
resolved troop's validity and person ID against leader+0x0c and exactly two deputy
slots+0x10/+0x14. `00486680` requires matching kind/canonical base range and returns
that same base ID, otherwise-1. It does not check subtype validity or convert to
territorial city. `004A0CB0` independently checks allocated person and accepts-1
or0..1086 before writing location and invoking `004B9480`.

Person vtable0079C780+44 is `004883B0`, raw dword person+0x94, without status or
bit9 normalization. Person+40 is `0047B2B0`: resolve that legion, require validity,
then tail-call legion+40; otherwise-1. Legion vtable0079BFB0+40 is `0065D6C0`, raw
legion+4 force ID. Legion validity requires class2 and force ID0..46, not a valid
force object. Home scalar alone does not alter these normal person getters.

Building vtable0079C718+44 is `004867D0`: require matching canonical subtype and
subtype validity, then subtype+44; otherwise-1. City+44 (`0047C320`) reads raw+0x38;
gate/port+44 (`00483810`) read raw+0x20. Those raw getters do not normalize even
out-of-range values. Therefore invalid requested legion can still follow an old
roster removal attempt before scalar writes are skipped.

Building+40 is `00487EB0`, which has facility-category and territorial-city cases
in addition to canonical subtype lookup. Its general output stays a source-bound
runtime observation. Do not substitute building.legion.force for every target.

## Explicitly deferred effects

`004BE2A0` includes force extinction, empty-corps merge/redistribution, status and
leader writes and transitive governor work. `004BCA30` includes candidate
collection, governor/status changes and events. Neither is completed by recording
its call or updating one leader/governor scalar. `004B40C0` ownership/capture,
notice/UI effects, actual list mutations and sorting also remain unexecuted.

Continuing scalar writes after any omitted boundary requires explicit recorded
boundary/noninterference policy. A strict rejection mode must preflight dependencies and reject before
committing scalar state. Source-bound stage observations are essential when a
callback could alter a value reread later. Local absence of direct RNG calls says
nothing about the deferred transitive functions or whole scheduler RNG state.
