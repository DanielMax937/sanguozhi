# Native event9 post-selection presentation decision

Status: bounded source-local reconstruction, additive version only. S1/S2 are
MOD-associated IDBs, not verified clean-stock executables. No recovered machine
code is executed. Actual presentation, mutating reaction, full event9,
capture/surrender/captive policy and force extinction remain open.

## Versioned API and represented state

`scripts/native_event9_presentation_profile.py` exports
`project_native_event9_presentation` and `replay_native_event9_presentation`.
The profile/frame IDs end in `native-event9-presentation-v1` and
`native-event9-presentation-frame-v1`. All 22 inherited entries remain; the new
`event9-presentation` entry accepts the event9-selection event object and runs
the same complete selection-plus-decision tail. The inherited `event` entry
composes listeners, this tail, and the observer in one frame and one revision.
Predecessor production APIs, frames, traces and behavioral tests are unchanged.
The inherited P0-72 strict test32 integrity pin keeps its already approved
metadata-only correction; no behavioral assertion or oracle is changed.

Every force row explicitly adds unsigned32 `vtableAddress`. Canonical force
vtable is `0079C0E8`; inherited `playerIndex` is signed32 raw+60 and `rulerId`
is signed32 raw+04. Inherited `valid` must still equal the canonical ruler-range
diagnostic; it never supplies an unknown virtual08 result. Unknown vtables
reached outside the newly implemented decision reject explicitly rather than
broadening older canonical-force primitives. Unreached storage is not eagerly
read or rejected merely because its vtable is unknown.

Policies additionally require:

- `event9PresentationDomain: canonical-live-event9-presentation-v1`
- `event9EventMemoryDomain: immutable-command-event-v1`

The latter is an explicit supported domain, not a claim that native event
memory is immutable. Native `004BA37D/384` rereads the original event argument's
first DWORD. This protocol excludes callback corruption of that event argument,
the control stack and saved control-flow locals. It does not exclude the
constructor's known writes to the caller-stack temporary message object inside
the combined411..432 observation. Whole-frame observations can replace all
represented data and RNG, but cannot silently mutate the event argument. Mutable event arguments and the resulting event16/18 routes remain open.
All inherited native-platform/probe/manager-domain assumptions remain in force.

## Saved and live values

`004BA34B` converts the earlier captured troop raw44 into a force-slot pointer;
`004BA354` saves it in EBX. Pointer construction does not read force storage.
That saved force is intentionally distinct from the troop's current owner.

The current troop virtual48 is dispatched at `004BA356`. Canonical `0047A690`
calls troop virtual40 to derive its current force, converts it to a pointer,
validates that force, and then rereads its current vtable before force virtual48.
Canonical force08 (`00480FF0`) calls type(1), which the canonical force type
method answers true, then reads live rulerId and accepts signed0..1099.
Canonical force48 (`00480FA0`) only reads live playerIndex and accepts signed0..7;
it does not independently validate the force.

If troop48 is false, `004BA35E` validates the saved EBX force, and `004BA372`
resolves that force's current virtual48. If neither gate succeeds, execution goes
directly to the mutating reaction at `004BA432`. No target validity call or
presentation observation is consumed on this path.

If either gate succeeds, the event word is reread. In the supported immutable
event9 domain, execution reaches `004BA405` and revalidates the previously saved
target pointer. A false result skips presentation but still reaches reaction.
No new target is computed after any callback.

Unknown troop/force virtual48 and force08 are full-frame/RNG `effect-query`
observations, using the inherited exact source/site/slot/pointer/call-stack
binding. Unknown predicate results must be booleans. Every subsequent read
resolves the replacement frame; pointer identities and saved locals survive.
The inherited selection retains its mutable unknown08/2C/40 observations.

## Separate remaining effects

The presentation effect is `004BA411/event9-presentation`, covering the argument
pushes, constructor `005C1A40`, consumer `004F55E0`, all their nested effects,
and caller cleanup through the next instruction `004BA432`.

The constructor initializes a caller-stack message object, including a message
ID and two object parameters. Its returned pointer is consumed inside this same
boundary. Formatting, object virtual calls, globals/locks and native display
operations are not modeled as pure operations. The native temporary pointer is
never assigned an invented persistent identity, exposed as a model result, or
split at `004BA429`. Text contents, allocation, scheduling and any later pointer
retention remain unproved. The observation is explicitly conditional on the
represented frame/native-platform domain; it is not proof that external state
or temporary retention cannot exist.

The presentation binding includes messageId `0x209C`, the saved troop and target
pointers, the display troop pointer, and raw arguments1/-1. These field names
record call inputs, not inferred game semantics.

The reaction effect is `004BA432/event9-reaction`, ending at `004BA46C` before
saved-cursor reload. It still covers ordered `004B5020`, `004AD2B0`, live home
lookup and `004AD220`; none is claimed natively executed by this version.
Both effects preserve saved force/troop/target/subject identities, symbolic
entry-ECX manager, captured raw44 diagnostic and old/new force locals. The next
heap-node identity remains the caller's saved cursor, not a reread of a mutated
current-node link. Both effects may replace the complete frame and RNG state.

Missing or misbound observations are errors. Unknown-effect rejection or an
engine guard rolls the entire command back; consumed effects remain diagnostic
evidence of the rejected attempt. Replay verifies exact input/binding/trace
consistency, not authenticity of a game capture or global RNG accounting.

## Remaining work and integration

Open: actual presentation and reaction, mutable event arguments, event16/18,
canonical capture/surrender/captive policy and force extinction, recursive ruler
ownership, positive refunds/resources and other cancellation bodies, S2 extra
effects/full vtable tail, fallback reset scheduling, unrepresented memory,
platform/concurrency/global RNG, and clean-stock/Vanilla/console/runtime proof.

## Formal integration and verification

Baseline: PR #31 merged main `f9c55c48c95fa84c1594bd9fb5ddcaf5849dcbe1`.
The 183 reviewed additions include this guide. The formal guide107 is preserved,
so 1,583 baseline files plus 183 additions give 1,766 tracked files. Of the new
files, 179 production/model/raw/report files remain byte-identical to the final
reviewed isolated increment. Only this guide/source README and manifest/source
checker are reconciled; the checker changes its baseline and two proved P0-73
metadata pins. P0-73 through P0-67 source metadata and separate historical
extraction assertions are recursively proved, including the inherited P0-72
single strict model-checker pin correction. No new model exception is required.
The six main indexes retain every unresolved boundary and prior version.

All 118 required command types have successful evidence on this frozen product
tree: TypeScript, 85 Node tests, 115 Python checkers and two demos. The initial
run passed 117/118. Its npm check and the unchanged-environment retry both ended
with lifecycle child SIGKILL (58/59). A direct Node 85/85 run was diagnostic only.
The original npm run check argv then passed with the sole supported environment
addition --max-semi-space-size=16 to --max-old-space-size=512 --test-reporter=tap.
Neither the signal cause nor OOM was established. This is a recovered command
set, not a single-green-run result. All 122 command-attempt logs, including both
failed attempts, were retained and hash-checked. The shared fixed-inode flock
serialized each command; product argv, production and test bytes stayed fixed.

The 42 model groups ran in the full set without redundant repetition. The
26 source groups plus 21 inherited/nested21/17/12/13 passed; both complete IDB
fingerprints and all1,317 raw intervals were rechecked, and17 historical
independently authored probes passed. Independent delta review also verified
the relocated test16 production-disable selector hits47 modules/367 patches;
its clean oracle made no production calls, while an injected call was rejected.
All1,766 tracked file hashes and the real Git index stayed identical across
full, recovery and supplemental checks. Only five result documents changed
subsequently for separate review. Historical Capstone5.0.7 reports were only
hash-checked, not re-decoded. No original executable or recovered machine code
was executed. Local checks do not establish hosted CI or clean-stock/runtime
proof.

The focused corpus has 172 intervals: 152 exact inherited reuses and 20 new
unique intervals, 140 complete-function code intervals and 32 data intervals;
11,370 selected bytes, 3,116 instructions, 292 calls, 339 relative branches and
1,946 new code bytes. The full inherited/new closure has 1,317 intervals:
S1 652 and S2 665. Overlapping selected bytes are not unique-image coverage.

Run independent checks from the repository:

    PYTHONDONTWRITEBYTECODE=1 python scripts/check_native_event9_presentation_profile.py
    PYTHONDONTWRITEBYTECODE=1 python scripts/check_native_event9_presentation_source.py

Optional --idb-s1, --idb-s2 and external --report arguments repeat whole-IDB and
selected raw-ID1 verification. No original executable or recovered machine code
is run. MOD-associated S1/S2 do not certify clean-stock PK, Vanilla, console,
original saves, runtime equivalence or global RNG. The immutable event-memory
support domain and caller-stack temporary boundary above remain explicit.

See [source evidence](../sources/native_event9_presentation/README.md),
[open exactness](13-open-exactness.md) and [fallback debt](16-unresolved-rules-fallbacks.md).
