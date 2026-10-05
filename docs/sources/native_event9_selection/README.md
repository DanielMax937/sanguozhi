# Native event9 live troop selection: dual-IDB evidence

This additive source profile closes the event9 eligibility/iteration prelude of
`004BA1D0` through entry `004BA345`. The reaction suffix remains an exact
whole-frame/RNG observation through the continuation at `004BA46C`.
It does not claim full event9 reaction, stock behavior, or runtime execution.
Formal integration baseline: PR #30 merged main
`82432a2c5b85ba8b9e443217b8da1b925441b10c`. The reviewed 161-file increment is
reused; the existing formal P0-72 guide is retained, yielding 1,583 tracked
files. Production, all 39 behavioral model groups, raw assembly/data and
historical verification reports remain byte-for-byte unchanged. Only this
manifest/checker baseline and three proved P0-72 metadata pins are reconciled.
The inherited P0-72 model checker has its already approved single strict test32
predecessor-checker pin correction; its 31 behavioral groups are unchanged.
P0-72 → P0-71 → P0-70 → P0-69 → P0-68 → P0-67 source metadata and historical
extraction assertions are recursively proved against actual files. This
profile keeps the historical raw report and its fixed hash unchanged.

See [the formal guide](../../rules/108-native-event9-selection.md) and
[current status](../../rules/STATUS.md) for integration verification results.

## Provenance and complete boundaries

The historical recovery freshly fingerprinted both MOD-associated IDBs:

- S1: `c591cb40ce6d6be9246148002532dedc042463f36cd39c5ed300b7c449feefab`
- S2: `aa7f2c983b266633d6e23c494d4f8e1b03e5251632505cae103e176ae850dfd8`

Public source URLs, recorded input paths, and recorded executable hash metadata
are retained in [the manifest](../native_event9_selection.json). Recorded EXE
hashes are not independently verified original executable identities. No original
EXE or recovered machine code was executed or emulated.

Historical recovery used read-only, memory-mapped `python-idb` ID0 function boundaries,
IDAPython byte reads, independent raw ID1 low-byte mapping, and complete Capstone
x86-32 decode. Formal integration rechecks both complete IDB hashes and every
selected raw-ID1 interval. Historical Capstone 5.0.7 reports are hash-checked,
not re-decoded. Complete functions include `004BA1D0..004BA485`,
`00495CE0..00495E24` and `004922C0..00492348`. The list function also owns an ID0
SEH chunk at `0072EE10`: S1 ends at `0072EE18`, while S2 ends at `0072EE22`.
The extra S2 bytes are an exception-handler stub. SEH execution remains outside
the successful platform domain; the differing complete boundaries are preserved.

The four target switch-data intervals are separate from code. The common troop
vtable prefix is explicitly a 26-slot block, not proof of the complete S2 extent.
Complete force/type/validity/pointer methods and base, person, troop, force,
legion, city, gate and port vtable prefixes are pinned. Existing native
membership, live-position and route/target-force contracts remain frozen.

## Exact iterator lifetime and mutation

`004BA285` reads the global head at `073FB4D0` once into the caller's local cursor.
Each visit calls `004922C0(list=073FB4CC, &cursor)`:

1. Enter critical section `06EE7868` through import slot `0074E360`
2. Read the current node identity from the saved cursor
3. Call `00472070(node,12,1)`. This requires both readable and writable 12-byte
   node storage under the fixed successful platform-probe domain
4. At `0049230A/0C`, read `node+0` and store it into the caller's cursor
5. Leave the critical section through import slot `0074E35C`
6. Return the address `node+8`. The caller reads its troop pointer at `004BA2A5`

The next pointer is captured before any eligibility or suffix callback. Changes
to the current node's next link or global head afterward do not change that
saved pointer. Current-node removal is safe for this loop if later work does not
need its storage; the already-saved next node is still visited. Changes to that
next node's payload or next link are read live when the next visit occurs.
Duplicate payloads are processed repeatedly, and node order is not sorted or
deduplicated. Replacing this with an immutable troop-ID snapshot is incorrect.

The invalid node-probe branch returns `list+1C` without advancing the cursor.
It is not native null, skip, or termination. This profile rejects unsupported
unreadable/unwritable/missing nodes explicitly. A node model's finite/cyclic
protection is atomic rejection, not a native guard: no visited set or finite
iteration cap exists in the source. External concurrent mutation between unlock
and the caller's payload load is outside the adopted domain.

Import names are independently recorded as ID0 metadata. S1 IDAPython reports
zero bytes for these IAT slots while raw ID1 low bytes contain nonzero snapshots;
S2 also retains its exact metadata. These slots are deliberately not selected
byte intervals or represented runtime IAT values. No selected interval has a
waived mismatch: every selected interval agrees with both byte recovery routes.

## Target helper and live fields

Each valid list troop captures signed DWORD `+44`, admitted only in `0..46`.
This is a saved scalar, not the troop's subsequently derived force. Then
`00495CE0` captures DWORD order `+2C` once. The increment wraps at 32 bits, and
unsigned `(order+1)>12` returns null. The source switch is:

- Orders `-1,0,11` or outside that interval: null without another validity read
- Orders `1,3,5,6,10`: revalidate the same troop, then read live kind DWORD `+34`
- Order `2`: revalidate, then use packed target-position DWORD `+38`
- Orders `4,7,8,9`: revalidate, then resolve a base using signed WORD `+30`

Kind values `0,1,2,3` select base, troop, map, person respectively; all other
unsigned values return null. The signed target ID is read only after validity.
Getters construct pointer identities without reading target rows. Bases admit
IDs `0..16383`, troops `0..999`, persons `0..1099`.

Map mode captures one packed DWORD from `+38`, splits signed16 X/Y and computes
`200*X+Y`. It contains no coordinate bounds check. `0047A5B0` reads map DWORD
`06FB0E6C+20*index`, extracts bits 5..11, and calls `00483B00` with
`acceptNegative=1` over source-specific signed DWORD table `0079C358`.
Negative entries use signed x86 NEG, including INT_MIN behavior. The result goes
straight to `00490D00`, whose range is `0..16383`; there is no `0..86` cap here.
An unrepresented map address is missing evidence, never native null. The
source-selected unsigned city-byte table `0079C2B0` used by base-force lookup
remains a distinct table; its S1/S2 bytes differ.

The returned target is cast through its current virtual `+2C(type5)`, then
validated. Canonical base accepts type5. Canonical troop and person reject it.
A missing reached row is an explicit gap, not an invalid object.

## Event9 eligibility and exact suffix boundary

Event9 initializes saved old/new force IDs and EBP to `-1`. The event subject is
type-cast to base without a validity check and its pointer is saved once.
An invalid target or a target pointer equal to the saved subject reaches `345`.
Otherwise:

1. Call target `+40` at `004BA307`
2. If equal to saved old force, compare captured `+44` with saved new force;
   on inequality call troop `+40` at `004BA318` and require saved new force
3. If the first target result differs, call target `+40` again at `004BA323`;
   require saved new force, compare captured `+44` with saved old force, then
   on inequality call troop `+40` at `004BA338` and require saved old force

The direct captured `+44 == -1` bypasses are impossible for admitted event9
values, but both separate target-force calls and their live reads remain
visible. Unknown virtual callbacks can replace the entire frame between calls.
They cannot be simplified into one cached result or treated as pure predicates.

Canonical troop force `+40=004955A0` first calls the troop's current virtual
validity directly, then reloads its leader, resolves and validates the person,
and tail-dispatches the person's current `+40`. Canonical person force uses
live raw legion `+94`, legion validity, then legion force `+04`. It does not
validate the resulting force object. Base force retains the inherited full
category/direct-owner/territory/subtype algorithm of `00487EB0`.

`004BA345` is the defensible complete eligibility boundary. EBX is still the
saved raw `+44`; `004BA34B` converts it to a force pointer. Virtual `+48` gates
presentation only: both paths still reach the effects at `004BA432`.
The suffix observation must preserve the event argument identity and supported
event data, manager identity, troop ESI, cast target EDI, EBX raw44, EBP,
saved old/new force scalars, saved subject pointer and saved next cursor.
It observes the entire suffix and resumes just before `004BA46C`, where the
saved cursor is loaded. Pointer identities must survive frame replacement;
no cached Python row or recomputed raw44 can replace native saved locals.

The complete `+48=0047A690`/force `+48=00480FA0` bodies are retained as next-stage
evidence, not a claim that this profile executes them natively. Event10 is a
source-proven no-op tail. Event16/18 behavior remains excluded.

## Corpus and verification

The focused corpus contains 150 intervals: 116 exact inherited reuses and 34 new
unique intervals, 122 complete-function code intervals and 28 data intervals.
Complete-function intervals include two SEH chunks as well as main regions.
Totals: 9,102 selected interval bytes, 2,328 instructions, 212 call sites,
319 relative branch sites, and 1,280 genuinely new code bytes. Only paired
source differences are the SEH chunk extent and unsigned city-byte table.

The inherited/new raw-ID1 verification scope is 1,297 selected intervals: S1 642 intervals /
75,192 bytes; S2 655 / 75,584 bytes. Overlapping intervals are intentionally
counted and are checked for consistency. The independent stdlib checker has 21
new groups and invokes the frozen 21-group predecessor, whose nested suites
retain 17, 12 and 13 groups. It never imports production code or executes x86.
Independent production/oracle tests are a separate deliverable.

Run from the repository:

    PYTHONDONTWRITEBYTECODE=1 python scripts/check_native_event9_selection_source.py
    PYTHONDONTWRITEBYTECODE=1 python scripts/check_native_event9_selection_source.py --idb-s1 /path/to/S1.idb --idb-s2 /path/to/S2.idb --report /path/to/report.json

## Remaining boundaries

Reaction/presentation effects after `345`; event16/18; unknown vtable bodies;
unrepresented memory, failed probes, concurrency and SEH; S2 vtable extent and
patch behavior; capture/surrender/extinction and recursive ruler ownership;
positive refunds/resources and unrelated cancellation; global RNG and stock,
Vanilla, console, runtime or original-save equivalence all remain open.
The six main indexes and this guide are reconciled for formal integration.
No original IDB or remote is changed by this local integration stage.
