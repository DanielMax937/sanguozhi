# Native event9 saved-troop raw44 reset

Status: bounded source-local reconstruction. S1/S2 are MOD-associated IDBs,
not certified clean-stock executables. No recovered machine code is executed.
This version closes004BA442..004BA44C and the two complete direct reset helpers;
actual home/reaction44C..46C, full capture and surrender policy remain open.

## Explicit version and existing signed raw storage

`scripts/native_event9_troop_reset_profile.py` exports
`project_native_event9_troop_reset` and `replay_native_event9_troop_reset`.
The profile and frame IDs end in `native-event9-troop-reset-v1` and
`native-event9-troop-reset-frame-v1`. Its new `event9-troop-reset` entry takes
the same event object as the inherited event9 entries. All24 inherited entries
remain available; executions in this version use the new protocol and bounded
reset. Existing production APIs, frames and traces remain intact. Formal
integration retains the already approved P0-72 strict test32 metadata-pin
correction without changing its 31 behavioral groups or any oracle assertion.

The existing troop `raw44` is signed32, accepting every signed32 bit pattern.
Its DWORD all-ones store is represented as-1. This differs only in representation
from unsigned force `rawDword94=4294967295`; the fields belong to different objects
and have no inferred shared game meaning. Existing raw44 values are not restricted
to the general setter's accepted argument range. Values outside0..46 merely fail
the earlier event9 selection gate, and a callback may replace current raw44 with
any signed32 value before the direct store. No schema defaults or coercions are
added; bool, float, out-of-range and unsigned0xFFFFFFFF inputs remain invalid.

Policy additionally requires
`event9TroopResetDomain: canonical-live-event9-troop-reset-v1`, with the new frame
profile and every inherited domain. Immutable command-event memory is a model
protocol, not a claim about native event memory. Constructor temporary writes
remain inside the combined presentation observation.

## Saved identities, live validity and direct DWORD store

At004BA442 the caller pushes-1, then saved troop ESI at444.445 copies saved
manager EDI into ECX;447 directly calls004AD2B0. The helper does not read that
incoming manager ECX. It copies its first argument into its own saved ESI and
calls0047A630 once at004AD2B6.

Canonical troop validity uses the existing fully recovered00496040 chain:
current leader pointer and person validity, then signed deputy upper bounds.
Unknown troop virtual08 remains an exact ordered full-frame/RNG effect-query.
A false result skips the direct store and retains callback changes. A true result
uses the original saved troop pointer in current storage and writes raw44=-1
through00495A20, whose00495A32 instruction stores precisely four bytes at+44.

There is no second validity check, leader recheck, type cast, setter vtable
lookup or owner lookup after the callback. A callback may replace the complete
frame, invalidate the current leader, change vtable, change raw44 or alter current
ownership; the true result still reaches the direct store on the same saved troop
identity. Missing reached storage is an evidence gap, not a false native result.

The complete00495A20 body proves its general argument predicate is exactly-1
or signed0..46, with all other arguments leaving memory alone. The event9 caller
supplies the fixed-1. This version does not expose a general setter API.

The earlier force pointer in caller EBX was captured from troop raw44 before
presentation. Neither helper changes EBX or EDI. Resetting current troop raw44
does not change or recompute that saved force identity, including when current
ownership or current raw44 was already changed by a callback. The earlier force
raw94/raw98 stores precede the troop raw44 store in the same atomic command.

## Balanced continuation and explicit remainder

The direct setter RET4 consumes its argument.004AD2B0 RET8 consumes the caller's
two arguments.004BA44C resumes at the original parameter stack depth with the
saved manager, force, troop, target, subject, captured raw44, old/new force scalars
and next-node cursor still bound. Call scopes, before/after frames, exact write
width and both signed and unsigned representations are recorded.

Presentation411..432 stays one `004BA411/event9-presentation` effect, covering
message construction, formatting, consumer and nested effects. No stable temporary
pointer, lifetime, destruction or absence of asynchronous retention is inferred.
S2 patched presentation remains inside that observation.

The remaining effect is `004BA44C/event9-reaction-remainder`, covering live home
lookup00495520, building lookup00490D00 and004AD220 through004BA46C. It is a single
ordered full-frame/RNG observation or atomic rejection. Its original caller args
and saved call-stack locals are not recomputed from the newly reset field. The
next node cursor is the saved identity, independent of observed link mutation.

Missing, stale, reordered or misbound observations fail. Explicit unknown-effect
rejection or engine guards roll back the entire command, including earlier force
and troop stores, while consumed effects remain diagnostic evidence. Exact replay
checks input/trace agreement and RNG propagation, not observation authenticity or
global RNG. The native reset itself consumes no RNG.

## Verification and integration boundaries

Source evidence: `../sources/native_event9_troop_reset.json`, complete assembly
in `../sources/native_event9_troop_reset/`, and
`scripts/check_native_event9_troop_reset_source.py`. The independent model is
`scripts/check_native_event9_troop_reset_profile.py`; it transcribes expected
state transitions independently of production primitives and validators.

Baseline: PR #33 merged main `9a487b75b4ebd3dab0326ed0ffc81a7a3b2e5e06`.
The 192 reviewed additions include this guide; the existing formal guide107 is
retained, so 1,954 baseline files plus 192 additions give 2,146 tracked files.
Of the additions, 189 production/model/raw/report files are byte-identical to
the final reviewed isolated increment. Only this guide and the new manifest/
source checker are reconciled. The source checker changes its formal baseline,
two proved P0-75 metadata pins and a separate strict historical-extraction
baseline for the unchanged raw report. That report remains pinned to the isolated
extraction baseline `4991806f0caf8cd395afcd64ecd6bde8200ac7e5`; no historical
report or expected native byte is rewritten. The new 34-group model checker is
unchanged. Recursive metadata proof covers P0-75 through P0-67, including the
separate historical extraction baselines for P0-70/71/72 and the inherited
P0-72 approved single strict metadata-pin correction. No new model exception is
required. The six main indexes preserve previous contracts and remaining debt.

The complete latest-main 122/122 command run passed on one frozen tree:
TypeScript, 85 Node tests, 119 Python checker commands and two demos. The exact
34-group independent model ran once in that full set: 374 accepted semantic
cases, 889 atomic rejections and 38 killed production mutations. The 20 source
groups plus 17 inherited and nested26/21/21/17/12/13 passed. Both complete IDB
fingerprints and all1,327 selected raw intervals were freshly verified (S1 657,
S2 670). Six historical independently authored probe groups passed38 accepted
and32 rejected cases; only their import/input root and output path were relocated.

All124 full/supplemental raw command logs were individually hash-verified, with
complete waiting/start/exit/released records on the same fixed-inode flock.
Every command used NODE_OPTIONS=--max-old-space-size=512 --test-reporter=tap
--max-semi-space-size=16, a dedicated repository-external npm cache and no Python
bytecode writes; original product argv stayed unchanged. TAP_DISABLE_COVERAGE
and TAP_RCFILE were unset in this formal run. The isolated run additionally set
both, so identical environments are not claimed and no product coverage setting
was silently disabled here. All2,146 tracked file hashes and the real Git index
remained identical across full/supplemental checks. Independent integration-delta
review passed. Only five result documents were subsequently updated for separate
review; production, model, raw, report and source-checker bytes remain validated.
The clean-baseline candidate patch restoration matched every file hash.

Historical Capstone5.0.7 reports were hash-checked only, with no new decoding,
recovered machine-code execution or emulation. Local checks do not establish
hosted CI, clean-stock equivalence, runtime authenticity or global RNG proof.
Historical P0-74 npm SIGKILL/recovery records remain preserved in that theme's
entry; the new122-command result is specific to this frozen P0-76 tree and its
recorded heap512/TAP/semi16 environment.

The focused corpus has 182 intervals: 178 exact inherited reuses and four new
complete-function intervals; 150 complete code regions and 32 data intervals;
11,658 selected bytes, 3,218 instructions, 302 calls, 355 relative branches and
26 indirect jumps. There are 116 new machine-code bytes and no new
source-specific difference. The inherited/new raw closure has 1,327 intervals:
S1 657 and S2 670. Overlapping selected bytes are not unique-image coverage.
The IAT source-specific IDAPython/raw-ID1 views remain explicitly uncertified.

Run the independent checks from the repository:

    PYTHONDONTWRITEBYTECODE=1 python scripts/check_native_event9_troop_reset_profile.py
    PYTHONDONTWRITEBYTECODE=1 python scripts/check_native_event9_troop_reset_source.py

Optional --idb-s1, --idb-s2 and external --report arguments repeat whole-IDB and
selected raw-ID1 verification. Recovered machine code is not run. See the
[source manifest](../sources/native_event9_troop_reset.json),
[current status](STATUS.md), [open exactness](13-open-exactness.md) and
[fallback debt](16-unresolved-rules-fallbacks.md).

Open: actual presentation/home/reaction, mutable event arguments and event16/18,
canonical capture/surrender/captive policy and force extinction, recursive ruler
ownership, positive refunds/resources and other cancellation handlers, S2 extra
effects/full vtable tail, fallback reset scheduling, unrepresented temporary,
formatter and external memory, platform/concurrency/global RNG, and clean-stock,
Vanilla, console or runtime certification. The game as a whole is not complete.
