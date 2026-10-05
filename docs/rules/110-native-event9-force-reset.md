# Native event9 saved-force reset

Status: bounded source-local reconstruction. S1/S2 are MOD-associated IDBs,
not certified clean-stock executables. No recovered machine code is executed.
This version adds004BA432..004BA442 and the complete direct reset helpers;
actual reaction442..46C, full capture and surrender policy remain open.

## Explicit version and raw storage

`scripts/native_event9_force_reset_profile.py` exports
`project_native_event9_force_reset` and `replay_native_event9_force_reset`.
The profile and frame IDs end in `native-event9-force-reset-v1` and
`native-event9-force-reset-frame-v1`. The new `event9-force-reset` entry takes
the same event object as the inherited event9 entries. All23 inherited entries
remain available; their executions in this new version use the new frame and
bounded reset. Existing production APIs, frames and traces are intact. Formal
integration retains the already approved P0-72 strict test32 metadata-pin
correction without changing its 31 behavioral groups or any oracle assertion.

Every force row requires `rawDword94` in unsigned32 and `rawByte98` in unsigned8.
The DWORD is a bit pattern, so the native signed-1 store is represented as
4294967295. Existing field values are not restricted to the general setter's
accepted input range. No captive, surrender, alliance or other game meaning is
assigned to these fields. No value is defaulted from an IDB or guessed.

Policy requires `event9ForceResetDomain: canonical-live-event9-force-reset-v1`
as well as all inherited domains, including immutable command-event memory.
That event domain excludes callback corruption of the event argument and saved
control-flow locals, while the constructor's known temporary writes stay inside
the combined presentation effect. It is not a claim that native event memory is
immutable or the caller-stack presentation object is destroyed at004BA432.

## Saved identity, live validity and direct stores

The force pointer saved in EBX at004BA354 was derived from the earlier captured
troop raw44.004BA432 reloads the saved manager into EDI; the caller pushes0,
-1 and the saved force, then004BA43B copies EDI into ECX before the004BA43D call. The helper does not
read the incoming manager ECX. It saves its first argument in ESI and calls
0047A630 on that force at004B5026.

Canonical force validity reads current rulerId and accepts0..1099. A noncanonical
force vtable uses the inherited exact unknown08 full-frame/RNG effect-query.
The force pointer is saved across that callback; a false result skips both
stores, retaining any callback changes. A true result performs, in order:

1.00481590(-1): DWORD store of0xFFFFFFFF to the same force identity's raw+94
2.004815B0(0): byte store of0 to the same force identity's raw+98

Both writes resolve the current frame. They do not recompute the troop's force,
revalidate a changed ruler, or dispatch through a changed vtable. Missing reached
storage is an explicit error. The first write's trace frame still contains the
old byte98; the second frame contains both writes. No unrepresented adjacent
bytes or inferred field meanings are introduced.

The complete source bodies also prove that00481590 generally admits exactly-1
or signed0..46 and otherwise skips its store, while004815B0 stores its argument's
low8 bits without validation. This version exposes only the fixed event9 call;
it does not publish a generalized force-setter API.

## Continuation, observation and rollback

Each direct setter returns with RET4.004B5020 returns with RET0x0C, consuming
the caller's three arguments, and004BA442 begins with the original parameter
stack depth. The original manager and saved force/troop/target/subject identities,
captured raw44, old/new force scalars and next-node cursor remain saved.

Presentation411..432 remains a single `004BA411/event9-presentation` observation
covering stack message construction, formatting, consumer and nested effects.
No stable temporary pointer, lifetime, destruction or absence of asynchronous
retention is inferred. S2's patched presentation subcall stays opaque.

The remaining reaction is a new full-frame/RNG effect,
`004BA442/event9-reaction-remainder`, ending at004BA46C before the saved cursor
reload. It binds the saved caller context after reset.004AD2B0, live home lookup
and004AD220 remain inside that effect. Callbacks may replace the represented
frame and RNG, and suffix replay must supply exact ordered, current bindings.
The next cursor is the original saved identity rather than a mutated node link.

Missing/stale observations reject; an explicit unknown-effect rejection or
engine guard rolls back the complete command. Consumed effects remain diagnostic
evidence. Replay checks trace/input agreement, not game-capture authenticity or
global RNG accounting. No native reset RNG calls are added.

## Still open and publication requirements

Open: actual presentation/reaction, mutable event arguments and event16/18,
canonical capture/surrender/captive policy and force extinction, recursive ruler
ownership, positive refunds/resources and other cancellation handlers, S2 extra
effects/full vtable tail, fallback reset scheduling, unrepresented temporary,
formatter and external memory, platform/concurrency/global RNG, and clean-stock,
Vanilla, console or runtime certification.

## Formal integration and verification

Baseline: PR #32 merged main `bbaaf647b62fa0814c8333eb1a1dc07f407649d7`.
The 188 reviewed additions include this guide; the existing formal guide107 is
retained, so 1,766 baseline files plus 188 additions give 1,954 tracked files.
Of these additions, 185 production/model/raw/report files are byte-identical to
the final reviewed isolated increment. Only this guide and the new manifest/
source checker are reconciled. The source checker changes only its formal
baseline and two proved P0-74 metadata pins. The entire new 34-group model
checker is unchanged. Recursive metadata proof covers P0-74 through P0-67,
including separate historical extraction baselines for P0-70/71/72 and the
inherited P0-72 approved single strict metadata-pin correction. No new model
exception is required; all historical raw reports retain their exact bytes.
The six main indexes preserve previous version contracts and remaining debt.

The complete latest-main 120/120 command run passed on one frozen tree:
TypeScript, 85 Node tests, 117 Python checker commands and two demos. The exact
34-group independent model ran once in that full set: 312 accepted semantic
cases, 905 atomic rejections and 32 killed production mutations. The 17 source
groups plus 26 inherited and nested21/21/17/12/13 passed. Both complete IDB
fingerprints and all1,323 selected raw intervals were freshly verified (S1 655,
S2 668). Ten historical independently authored probe groups passed18 accepted
and40 rejected cases; only their import/input root and output path were relocated.

All122 full/supplemental command logs were individually hash-verified, with
complete waiting/start/exit/released records on the same fixed-inode flock.
Every command used NODE_OPTIONS=--max-old-space-size=512 --test-reporter=tap
--max-semi-space-size=16, a dedicated repository-external npm cache and no Python bytecode
writes; original product argv stayed unchanged. All1,954 tracked file hashes
and the real Git index remained identical across full/supplemental checks.
Independent integration-delta review passed. Only five result documents were
subsequently updated for separate review; production, model, raw, report and
source-checker bytes remain those validated. The clean-baseline candidate patch
restoration also matched every file hash.

Historical Capstone5.0.7 reports were hash-checked only, with no new decoding,
recovered machine-code execution or emulation. Local checks do not establish
hosted CI, clean-stock equivalence, runtime authenticity or global RNG
certification. Historical P0-74 npm SIGKILL/recovery records remain preserved
in that theme's entry; the new120-command result is specific to this frozen
P0-75 tree and its recorded heap512/TAP/semi16 environment.

The focused corpus has 178 intervals: 172 exact inherited reuses and six new
complete-function intervals; 146 complete code regions and 32 data intervals;
11,542 selected bytes, 3,174 instructions, 298 calls, 347 relative branches and
26 indirect jumps. There are 172 new machine-code bytes and no new
source-specific difference. The inherited/new raw closure has 1,323 intervals:
S1 655 and S2 668. Overlapping selected bytes are not unique-image coverage.
The IAT source-specific IDAPython/raw-ID1 views remain explicitly uncertified.

Run the independent checks from the repository:

    PYTHONDONTWRITEBYTECODE=1 python scripts/check_native_event9_force_reset_profile.py
    PYTHONDONTWRITEBYTECODE=1 python scripts/check_native_event9_force_reset_source.py

Optional --idb-s1, --idb-s2 and external --report arguments repeat whole-IDB and
selected raw-ID1 verification. Recovered machine code is not run. See the
[source manifest](../sources/native_event9_force_reset.json),
[current status](STATUS.md), [open exactness](13-open-exactness.md) and
[fallback debt](16-unresolved-rules-fallbacks.md).
