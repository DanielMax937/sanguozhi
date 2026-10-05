# Native event9 live troop home getter

Status: bounded source-local reconstruction from MOD-associated S1/S2 IDBs.
This version closes004BA44C..004BA45E through the complete00495520 getter and
00490D00 numeric building resolver. Actual reaction45E..46C, presentation and
full capture/surrender policy remain open. No recovered machine code is executed.

## Version and represented storage

`scripts/native_event9_home_getter_profile.py` exports
`project_native_event9_home_getter` and `replay_native_event9_home_getter`.
The profile is `source-idb-S1-S2-native-event9-home-getter-v1`, with frame
`source-idb-S1-S2-native-event9-home-getter-frame-v1`. The new `event9-home-getter`
entry takes the inherited event object, alongside all25 predecessor entries.
Executions through this version use the new bounded continuation. Older modules,
production APIs, frame versions, raw evidence and trace contracts remain unchanged.
Formal integration retains the already approved P0-72 strict test32 metadata-pin
correction without changing its 31 behavioral groups or any oracle assertion.

Policy requires `event9HomeGetterDomain: canonical-live-event9-home-getter-v1`,
the new frame profile and every inherited domain. The new frame delegates to the
previous exact schema; it adds no stored field or coercion. The existing person
`homeBaseId` accepts every signed32 bit pattern. Complete004A31E0 identifies it as
the person's DWORD+98: the helper saves its person argument, reads the old value
at004A3209, and writes the supplied home scalar at004A3272 amid home-roster moves.
That identity is established by object and operation, not offset similarity with
the force's separate byte+98.

Canonical persons retain their existing status/rawDword17C-derived allocation and
validity. Arbitrary person vtables and person08 callbacks are outside this frame
version. A virtual native wrapper does not alone authorize inventing that domain.

## Saved troop, direct live validity, saved person

004BA44C copies saved ESI to ECX and44E calls00495520. The getter preserves caller
ESI, saves that same troop pointer, reads its live vtable and directly calls slot08
at00495525. It does not first call0047A630 or add a null/probe gate. Earlier raw44
reset to-1 is not a condition that suppresses this getter.

For canonical troop vtable0079CC18, the already recovered00496040 validity chain
uses the current leader/person predicate and signed deputy upper bounds. For an
unknown troop vtable, slot08 is an exact ordered full-frame/RNG effect-query at
site00495525. Its false result retains every callback change and returns scalar-1.
A true result reaches0049552C and reads the leader from current storage of the
same saved troop. Vtable, leader, ownership, home values and all other mutable
frame fields changed by the callback are visible at their actual later reads.

00490B00 creates a canonical person pointer only for signed0..1099.0049553A saves
that pointer,0049553D checks it through0047A630 once, and00495549 reads DWORD+98
from that same saved person when valid. Null or invalid returns-1. The canonical
person validity path is native and callback-free within the inherited domain;
no second troop validity check or leader recomputation is inserted. A reached
missing troop/person row is an explicit evidence error, not native invalidity.

## Purely numeric home-building pointer

004BA453 pushes the returned signed home scalar,454 sets ECX to fixed object
manager07201958, and459 calls00490D00. Its complete body accepts signed0..16383,
computes manager+0x89730+id*0x38, and otherwise returns null. It neither dereferences
a building row nor invokes virtual08. In this canonical frame it is represented
by the building storage/id identity, separately bound to the fixed manager.

A missing or invalid building at an in-range home ID therefore still produces
its pointer identity. Such a row becomes required only if later executed behavior
actually reads it. The model does not replace this resolver with a convenience
lookup that accidentally validates or reads storage. Home values such as-1,
INT32_MIN,16384 and INT32_MAX remain valid stored scalars and resolve to null;
0 and16383 are in-range endpoints.

## Balanced continuation and remaining effect

00495520 RET has no explicit argument to pop;00490D00 RET4 consumes the pushed
home scalar.004BA45E is the next instruction, before the reaction's first PUSH.
The caller stack is balanced. Original event, manager, saved force/troop/target/
subject, captured raw44, old/new force scalars and saved next-node cursor survive.
The exact returned `homeBaseId`, resolved `homeBuildingPointer` and fixed
`homeResolverManagerIdentity` are additionally bound into the suffix observation.
They cannot be substituted or recomputed from later frame changes. The bound
`reactionCall` also records helper004AD220/site004BA467, incoming ECX0799895C,
positional arguments `[saved troop, 4, resolved building]` and native PUSH order
`[resolved building, 4, saved troop]`. These identify the opaque suffix invocation;
they do not execute its instructions or claim that the callee uses incoming ECX.

`004BA45E/event9-reaction-remainder` remains one whole-frame/RNG effect or atomic
rejection. It includes all three PUSHes at45E/45F/461, fixed ECX0799895C at462,
and004AD220 at467 through the46C continuation. Complete004AD220 is effectful:
it validates arguments, obtains default/virtual positions, and calls005A8D20.
Its size and apparent presentation purpose do not establish purity. No temporary
retention, lifetime, UI-only, RNG-free or ignored-manager claim is inferred for it.

Presentation411..432 remains combined. Every unknown callback and remainder
retains exact ordered input/output frames, caller scopes and RNG evidence. Local
getter/pointer construction adds no RNG calls. Explicit rejection or engine guards
roll back the entire command, including earlier force/troop stores; consumed
effects remain diagnostic only. Replay proves transcript consistency, not external
observation authenticity or global RNG consumption.

## Verification and open scope

Source evidence is `../sources/native_event9_home_getter.json` and the sibling
`native_event9_home_getter/` assembly directory. Checkers are
`scripts/check_native_event9_home_getter_source.py` and
`scripts/check_native_event9_home_getter_profile.py`; the model oracle derives
expected transitions independently from raw source and never executes production
planners, primitives or validators to produce expected frames.

Baseline: PR #34 merged main `d811288e5e9110036678719af23b597a2450650c`.
The 38 reviewed additions include this guide; the existing formal guide107 is
retained, so 2,146 baseline files plus 38 additions give 2,184 tracked files.
Of the additions, 35 production/model/raw/report files are byte-identical to
the final reviewed isolated increment. Only this guide and the new manifest/
source checker are reconciled. The source checker changes its formal baseline,
two proved P0-76 metadata pins and a separate strict historical-extraction
baseline for the unchanged raw report. That report remains pinned to the isolated
extraction baseline `b5390990c74d25ec23fc4e59f42619b91279b5c6`; no historical
report or expected native byte is rewritten. The new 28-group model checker is
unchanged. Recursive Git-blob metadata proof covers P0-76 through P0-67, including
the separate historical extraction baselines for P0-70/71/72/76 and the inherited
P0-72 approved single strict metadata-pin correction. Original P0-67/68 draft
integrationStatus values are preserved in the proof. No new model exception is
required. The six main indexes preserve previous contracts and remaining debt.

The complete latest-main 124/124 command run passed on one frozen tree:
TypeScript, 85 Node tests, 121 Python checker commands and two demos. The exact
28-group independent model ran once in that full set: 474 accepted semantic
cases, 1,003 atomic rejections and 84 killed source-specific production mutations;
each mutant's unchanged control runs first. The 25 source groups plus 20 inherited
and nested17/26/21/21/17/12/13 passed, with 34 clean-controlled source mutations.
Both complete IDB fingerprints and all1,329 selected raw intervals were freshly
verified (S1 658, S2 671). Eight historical independently authored probe groups
passed60 accepted and42 rejected cases; only their import/input root and output
path were relocated. The nonempty production selectors and all assertions remain.

All126 full/supplemental raw command logs were individually hash-verified, with
504 complete waiting/start/exit/released events on the same fixed-inode flock.
Every command used NODE_OPTIONS=--max-old-space-size=512 --test-reporter=tap
--max-semi-space-size=16, a dedicated repository-external npm cache and no Python
bytecode writes; original product argv stayed unchanged. TAP_DISABLE_COVERAGE
and TAP_RCFILE were unset in this formal run. The isolated run additionally set
both, so identical environments are not claimed and no product coverage setting
was silently disabled here. All2,184 tracked file hashes, the real Git index and
dependencies remained identical across full/supplemental checks. Independent
integration-delta and terminal review passed. Only five result documents were
subsequently updated for separate review; production, model, raw, report and
source-checker bytes remain validated. The clean-baseline candidate patch
restoration matched every file hash.

Historical Capstone5.0.7 reports were hash-checked only, with no new decoding,
recovered machine-code execution or emulation. Local checks do not establish
hosted CI, clean-stock equivalence, runtime authenticity or global RNG proof.
Historical P0-74 npm SIGKILL/recovery records remain preserved in that theme's
entry; the new124-command result is specific to this frozen P0-77 tree and its
recorded heap512/TAP/semi16 environment.

The focused corpus has 28 intervals: 26 exact inherited reuses and two new
complete-function intervals; 24 complete code regions and four data intervals;
3,150 selected bytes, 1,010 instructions, 126 calls and 160 relative branches.
There are 108 new machine-code bytes and no new source-specific difference.
The inherited/new raw closure has 1,329 intervals: S1 658 and S2 671.
Overlapping selected bytes are not unique-image coverage. The IAT source-specific
IDAPython/raw-ID1 views remain explicitly uncertified.

Run the independent checks from the repository:

    PYTHONDONTWRITEBYTECODE=1 python scripts/check_native_event9_home_getter_profile.py
    PYTHONDONTWRITEBYTECODE=1 python scripts/check_native_event9_home_getter_source.py

Optional --idb-s1, --idb-s2 and external --report arguments repeat whole-IDB and
selected raw-ID1 verification. Recovered machine code is not run. See the
[source manifest](../sources/native_event9_home_getter.json),
[current status](STATUS.md), [open exactness](13-open-exactness.md) and
[fallback debt](16-unresolved-rules-fallbacks.md).

Open: actual presentation/reaction, mutable event arguments and event16/18,
capture/surrender/captive policy, force extinction, recursive ruler ownership,
positive refunds/resources and other cancellations, S2 extra effects/full vtable
tail, fallback reset scheduling, unrepresented temporary/formatter/external memory,
platform/concurrency/global RNG, and clean-stock/Vanilla/console/runtime
certification. This prefix does not complete the game as a whole.
