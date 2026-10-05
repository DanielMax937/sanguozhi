# Native event9 presentation decision: dual-IDB evidence

This additive profile closes the post-selection decision starting at `004BA345`
for the explicitly immutable event9 command-memory domain. It separates two
ordered whole-frame/RNG observations: presentation `004BA411..004BA432`, then
reaction `004BA432..004BA46C`. It does not execute either effect body, close
capture policy, or certify stock/runtime behavior.

Formal integration baseline: PR #31 merged main
`f9c55c48c95fa84c1594bd9fb5ddcaf5849dcbe1`. The 183 reviewed additions are reused;
the existing formal guide107 is retained, giving 1,766 tracked files. Production,
the entire 42-group model checker, raw assembly/data and historical reports are
byte-identical to the reviewed final isolated increment. This manifest/source
checker changes only its formal baseline and two proved P0-73 metadata pins.
P0-73 through P0-67 source metadata and historical extraction assertions are
recursively proved. The inherited P0-72 strict test32 checker retains its
already approved single metadata-pin correction; its 31 behavioral groups are
unchanged. No new model-checker exception is needed. Six main indexes and this
guide/source README are reconciled without dropping remaining evidence debt.

Source metadata, public source URLs and exact complete-function ranges are in
[the manifest](../native_event9_presentation.json). See [the formal guide](../../rules/109-native-event9-presentation.md)
and [current status](../../rules/STATUS.md) for formal-candidate verification.

## Historical source identity and fresh raw verification

The historical recovery freshly SHA256-verified both MOD-associated IDB files:

- S1: `c591cb40ce6d6be9246148002532dedc042463f36cd39c5ed300b7c449feefab`
- S2: `aa7f2c983b266633d6e23c494d4f8e1b03e5251632505cae103e176ae850dfd8`

Historical raw ID1 low-byte mapping agreed with every inherited/new selected
interval. That recovery separately used python-idb ID0 complete-function
boundaries, source-owned extra chunks, IDAPython byte reads and complete
Capstone x86-32 decoding. Formal integration rechecks both whole-IDB fingerprints
and all 1,317 selected raw intervals; historical Capstone 5.0.7 reports are only
hash-checked, not re-decoded. Recorded original executable names/hashes remain
metadata, not freshly verified original executables. No original executable or
recovered machine code is executed or emulated.

An initial recovery process exited137 after full-IDB hashing while python-idb
was parsing. Its log is retained outside the repository. The bounded retry
avoided only unused zero preallocation for v_bytes fields larger than1MiB, which
are immediately replaced by the library's original read-only memoryview parser.
The library files, section interpretation, original IDBs and all predecessors
were unchanged. This is not evidence about another process's failure.

The focused corpus has172 intervals:152 exact inherited reuses and20 new unique
intervals. There are140 complete-function code intervals and32 data intervals;
11,370 selected bytes,3,116 instructions,292 calls and339 relative branches.
Newly recovered code contributes1,946 distinct bytes across both sources.
The full selected inherited/new corpus contains1,317 intervals. All overlaps
agree; overlapping evidence is counted as intervals, not unique image bytes.

## Saved requested force and live troop ownership are different

Selection already captured signed troop`+44` in EBX at `004BA2B8`, admitted only
in0..46. At345, that saved scalar is passed to getter `00490AA0`; at354 the
resulting pointer replaces EBX. Getter domain is0..46, stride`0x12C`, offset
`0x7AF8` from the passed global manager. It constructs an identity without a
force validity or row-data read.

The saved force pointer survives the troop48 call, every unknown effect-query,
presentation and reaction. It must never be recomputed from a changed troop44
or changed current ownership. Later fallback force validity/player calls use
this pointer with current contents. Reaction also receives this exact pointer.

At `004BA356`, troop's current virtual48 is called without an added entry
validity gate. Canonical troop vtable`0079CC18` slot48 is `0047A690`:

1. Call the troop's current virtual40 at `0047A693`
2. Resolve the returned current force ID with `00490AA0`
3. Save that resulting force pointer, require nonnull and successful4-byte
   readable/writable pointer probe, then call current force virtual08
4. On false return0; on true reread that same force's vtable and tailcall48

This inner current-force pointer is independent of the caller's saved EBX force.
Canonical troop40 and inherited live troop/person/legion validity and ownership
semantics remain unchanged. Unknown40,08 or48 are full-frame/RNG effect queries.
After frame replacement, later vtable/field reads use current storage while
saved scalar and pointer identities remain fixed. Missing reached storage is a
model gap, never native invalid/null. Pointer-probe success is a stated platform
domain, not runtime process validation.

## Canonical force validity and player predicate

Force vtable prefix`0079C0E8` is pinned in both sources:

-08=`00480FF0`: call current type2C(1); if true read signed live ruler`+04` and
  accept0..1099
-2C=`00480FD0`: accept type1 or26
-48=`00480FA0`: directly read signed live player`+60` and accept0..7

Force48 does not itself validate the force. It has no call instructions. Values
-1 and8 are false;0 and7 are true. The inherited frame invariant
`valid == (0 <= rulerId <= 1099)` can represent canonical force08 because the
canonical type predicate always accepts1. An unknown force vtable cannot be
folded into that invariant: its08/48 calls require effect-query evidence. This
new force-table support does not broaden older canonical-only force helpers.

## Exact decision and event memory

If troop48 is true, skip fallback saved-force validity and48. Otherwise validate
saved EBX force via `0047A630` at35E, then reload its current vtable and call48
at372 only if valid. Either false fallback branch goes straight to432.

An enabled gate reloads the original handler event-argument pointer from caller
stack`[ESP+0xB98]` at37D and rereads its first DWORD at384. Native9 selects404,
16 selects3CD,18 selects399, and other values skip presentation to432. This is
not evidence that native event memory is immutable.

The declared `immutable-command-event-v1` domain holds the original event
argument identity and event9 word fixed and excludes callback corruption of
that event argument, the control stack and saved control-flow locals. This
restriction applies across callbacks, including eligibility before345; it does
not prohibit the constructor's known writes to the temporary message object
inside the combined411..432 observation. Other unrepresented temporary state
remains opaque. This is a compatibility protocol choice. Mutable-event16/18
branches are unimplemented; they must not silently become event9, null, or a
successful no-op.

Event9 at404 revalidates the already-saved target pointer through `0047A630`.
It does not resolve a new target or recapture the event subject. False skips
presentation only; true reaches411. Every supported path still reaches432.

## Combined presentation boundary and temporary lifetime

Presentation observation starts before411 and resumes before432. It covers
`005C1A40`, `004F55E0` and all their subcalls/effects within the supported frame/RNG
domain. It is not a pure-string, read-only-UI, or proven no-op callback.

Here `entryESP` means ESP immediately before004BA411, not function entry.
At411 the caller pushes six DWORDs in this order:
`-1, 1, saved troop, saved target, saved troop, 0x209C`.
The LEA at41D uses the stack after those six pushes, so this is the caller's
local address `entryESP+0x7C4`. Constructor `005C1A40` takes messageId0x209C,
troop pointer and target pointer, calls49CB60 then49CB80 twice, returns the same
local address, and returns with RET0x0C. The three other arguments remain.
At429 the local-result address is pushed for004F55E0. Its other raw arguments
are the saved display troop pointer, rawFlag1 and rawArgument-1. These raw
parameter labels do not claim a speaker, mode, queue policy, or UI meaning.
At42F ADD ESP,0x10 restores the entry stack pointer.

49CB60 writes messageId at local+0. Complete49C430 clears local+4 through+0x3CC;
the caller-local object spans0x3D0 bytes and ends at entryESP+0xB94, just before
the caller return address. 49CB80 invokes an argument object's current virtual24
and uses the pinned type-switch tables. Thus object-type callbacks can have
side effects before the direct consumer runs.

The consumer first calls49B390, which uses global formatter0767CAB8 through
49AE90. The latter includes a critical section plus49C5A0/498A90. For a nonnull
display troop, rawArgument-1 invokes47A770, which derives a current force and
reads its+44 after validation. Then consumer invokes troop virtual3C, reads
its returned position DWORD, normalizes rawFlag to a Boolean and calls63ADD0.
None of this is represented as a stable temporary string.

Important source-specific dependency:63ADD0 at63ADE7 calls00482480 in S1 but
008ECE20 in S2, then calls00639F90 in both. This difference remains inside the
source-specific presentation observation. Those callees, formatter output,
allocation, aliasing and S2 patch behavior are not closed by this stage.

Stack cleanup is not destruction. The0x3D0 local remains in the handler's stack
frame; no proof establishes its destruction, absence of retention, or absence
of asynchronous/aliased use. No temporary address is exposed in the new API.
Unrepresented temporary, formatter, allocation and external state remain an
explicit domain boundary. Later native operations depending on such state are
unsupported; a frame/RNG observation does not certify hidden external state or
native asynchronous lifetime. Splitting at424 or429 would require further proof.

## Reaction and loop continuation remain separate

At432 the caller reloads its saved manager into EDI. It calls004B5020 with
saved EBX force pointer,-1,0; then004AD2B0; then00495520 and00490D00; then004AD220.
This entire mutating sequence remains a separate observation through before46C.
It does not become native capture, surrender, captive policy, or extinction.

Presentation and reaction can each replace the represented frame/RNG in order.
Their saved context includes original event identity/value, manager, troop,
target, saved force, raw44 provenance, EBP and saved old/new=-1, saved subject,
and next-node cursor. At46C the caller reloads the cursor captured by the
inherited iterator before the callbacks. Changes to a current node or global
head do not rewrite that saved cursor; later node contents are read live.

## Independent verification

The stdlib source checker never imports the production model or executes x86.
It verifies26 new groups, invokes the frozen21-group selection checker and its
nested21/17/12/13 suites, pins complete bytes/boundaries and call/branch ledgers,
and can freshly hash/read both complete IDBs plus all1,317 selected intervals.
Independent model/oracle tests are separate from these source checks.

    PYTHONDONTWRITEBYTECODE=1 python scripts/check_native_event9_presentation_source.py
    PYTHONDONTWRITEBYTECODE=1 python scripts/check_native_event9_presentation_source.py --idb-s1 /path/to/S1.idb --idb-s2 /path/to/S2.idb --report /path/to/report.json

The three paired focused differences are63ADD0's presentation subcall, the
inherited4922C0 SEH chunk extent at72EE10 and the inherited unsigned city-byte
table79C2B0. Import-slot IDAPython/raw snapshot discrepancies remain explicitly
recorded metadata; IAT slots are not selected runtime-byte intervals. No selected
byte mismatch is waived.

## Remaining scope

Presentation body execution/output/retention, reaction432..46C, mutable event
memory and event16/18, unknown virtual bodies, failed probes, unrepresented
memory, platform/SEH/concurrency, full S2 vtable/patch behavior, capture/surrender/
captive/extinction and recursive ruler ownership, positive refunds/resources,
unrelated cancellations, fallback reset scheduling, global RNG and clean-stock,
Vanilla, console, original-save or runtime certification all remain open.
