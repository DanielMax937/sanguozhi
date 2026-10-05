# P0-71: native troop membership in one live frame

Status: bounded source-local compatibility reconstruction, new version only.
This does not certify clean-stock PC-PK1.1, executable behavior, or a complete
capture/return/game transaction. Older API, frame and trace contracts remain frozen. Formal integration
reconciles documentation and indexes while retaining prior version boundaries.

## Formal integration and verification

Baseline: PR #28 merged main `c190abfd43985251eee4936fdccb5d3910d4fed7`. The 62-file audited implementation is reused with production, model tests, assembly/data and historical verification reports byte-for-byte unchanged. Only this theme's manifest/checker baseline, two inherited metadata pins, a separately fixed historical-extraction baseline assertion, documentation and six main indexes are reconciled. P0-70 → P0-69 → P0-68 → P0-67 differences are recursively proven metadata/baseline-only, including the already-reviewed P0-70 historical-report assertion.

Fresh latest-main112/112 commands passed: TypeScript,85 Node tests,109 Python checker commands and2 demos. Every command used the same persistent fcntl lock; npm/node inherited NODE_OPTIONS=--max-old-space-size=512 --test-reporter=tap. Product argv stayed unchanged and wait/start/exit/release records include the common lock inode. The17 new plus12/13 inherited source groups,31 model groups and8 historical reviewer probe groups passed. Both whole-IDB hashes and all1257 selected raw-ID1 intervals were freshly rechecked (S1:622 intervals/74,069 interval bytes; S2:635/74,451; overlapping intervals are counted separately). All1347 tracked files and the Git index were identical before and after validation, and all112 log hashes were verified. Independent integration-delta review found no blocker; its scope is distinct from the historical implementation review. Only five documentation-result texts were updated afterward for separate review. Historical Capstone5.0.7 reports for598 focused instructions were hash-checked, not re-decoded. These are local source/synthetic-model checks, not original-game execution, remote CI or stock certification.

## API and explicit frame

- `scripts/native_troop_membership_profile.py`
- `project_native_troop_membership(state, command, observations, policy)`
- `replay_native_troop_membership(trace)`
- Profile: `source-idb-S1-S2-native-troop-membership-v1`
- Frame: `source-idb-S1-S2-native-troop-membership-frame-v1`
- Additional policy: `troopMembershipDomain: canonical-native-troop-membership-v1`
- All 17 native-tail-distance entries remain available; new `troop-member`
  accepts exactly `{personId}` and returns the native membership boolean
- All inherited tail-distance, facility, cancellation, relocation, route,
  allocator/platform, and guard policies remain mandatory

The versioned frame adds `troops`, an explicit list of readable manager-array
slots. Each row contains exactly:

| Field | Meaning/domain |
| --- | --- |
| `id` | Canonical F4-stride slot index, 0..999 |
| `vtableAddress` | Raw unsigned dword; canonical vtable is `0079CC18` |
| `leaderId` | Signed dword at troop+0C |
| `deputyIds` | Exactly two signed dwords at troop+10 and troop+14 |

There is no freely supplied `troop.valid` flag or inferred membership list.
Coordinates and the mutable fallback-position global are deliberately absent.
No old frame is automatically upgraded. Diagnostic snapshots strip `troops`
only for inherited validation; actual execution and all callback bindings retain
the complete new frame. A callback may change values, including the vtable,
leader and deputy fields, but cannot add/remove readable slots. This restriction
is a declared observation-memory domain, not a game rule.

## Pinned native order

1. `004891C0` reads live officer+9C. Outside signed 87..1086 it returns false
   before reading any troop. This helper itself does not validate the actor
2. `00490E70(location-87)` constructs a troop pointer in the manager's 1000-slot,
   F4-stride array. The getter does not read leader or deputy fields
3. `0047A630` checks that pointer then calls virtual+08. Under the canonical
   `0079CC18` vtable this reaches `00496040`
4. `00496040` first calls virtual+24, `00468E60`, which returns native type11
5. It reads the live leader+0C and calls `00490B00`, which constructs a person
   pointer only for signed IDs0..1099. Other IDs produce null and fail validity
6. A nonnull leader is checked through `0047A630` and canonical person virtual
   validity. With inherited fixed person vtable/type and successful-probe
   assumptions, the predicate is `rawDword17C != 0` or `status in 0..8` excluding
   6 and 8. These fields already exist in the inherited frame; allocated/valid
   aliases must agree with them. The new troop path derives the predicate from
   raw fields, rather than trusting an independent cached flag
7. Only after leader validity succeeds are deputy+10 then deputy+14 checked.
   Each must be signed less than1100. There is no lower bound: all negative
   sentinels pass. Neither deputy's person slot nor validity is read
8. After the complete troop-validity check succeeds, `00491310` recovers the
   actor's manager index from its canonical aligned person pointer, under the
   inherited equal/successful native thread-probe domain
9. `00495390` compares the actor ID with the live leader. On a miss, `00495340`
   compares exactly two live deputy fields in order, returning on the first hit

Even a matching leader cannot bypass an invalid deputy field in step7. An
invalid actor can still be a matching deputy of a valid troop because the
helper has no actor-validity gate. Deputy IDs below zero or at1099 require no
person row merely to validate a troop. These details differ from a location-only
shortcut, a roster membership list, or a generic all-members-valid rule.

A missing reached in-range troop or leader-person row is insufficient evidence
and raises a validation/runtime input error. An explicitly represented invalid
leader returns false. Out-of-range leader IDs produce native null and need no
row. Unreached rows are not demanded. No invalid object is fabricated to fill a
missing read.

## Unknown dispatch and live composition

Only canonical troop vtable `0079CC18` enters the native path. Any other raw
vtable retains a read-only `004891C0` observation bound to its exact source,
arguments, call stack, and full live frame. Its returned value must be a real
boolean. An unknown vtable never implies false, a guessed type, or guessed
membership. Missing/stale or extra observations remain errors. Arbitrary
virtual implementations and memory faults are not executed.

Both the reached officer-relocation check and recursive-return check now use
this helper. An enclosing observer, cancellation, presentation or nested event
can replace the live frame before the call; membership resolves the updated
location, troop vtable and members, and leader raw person fields. The supported
canonical helper chain itself has no mutable callbacks. Subsequent parent logic
retains its own native saved values and read order.

The planner composes inherited primitives directly in one frame. It does not
call an older projector or create hidden intermediate transactions. Successful
outer commands increment exactly one revision. Guard exhaustion and unresolved
effects remain atomic model rejection; these guards are not original rules.
Direct membership is a command in this transactional API and therefore also
commits one revision on success. It performs no gameplay writes or RNG calls.

## Evidence and scope still open

The focused manifest and source checker pin raw bytes, complete control-flow
bodies, the constructor/base initialization and common26-slot troop dispatch block in
both MOD-associated S1/S2 IDBs. Adjacent source-specific extensions must be
reported separately; matching selected dispatch slots do not prove entire
vtable or source equivalence. The separate model checker transcribes native
semantics independently. Synthetic callback frames prove model composition,
not the authenticity of actual gameplay observations. Whole-IDB fingerprint
checks and raw ID1 comparisons do not execute the original machine code.
The focused budget is 51 intervals/1,951 selected bytes: 30 exact inherited
intervals and 21 new unique boundaries, including 45 code intervals/598 decoded
instructions, 35 calls, 99 branches and 365 newly recovered machine-code bytes.
The full inherited/new closure has 1,257 selected raw intervals; selected
interval byte totals can overlap and do not claim unique-byte coverage. These
are historical extraction counts, not stock proof or original-code execution.

Non-base position virtual+3C and mutable fallback global `06EE794C` remain
explicit observations. A later version must add live coordinates and explicit
fallback storage rather than initialize that global from an incidental IDB data
snapshot. Native membership does not close event9 troop reaction.

Canonical `004B415D` capture/surrender/extinction, recursive ruler ownership,
positive refunds/resources, remaining cancellation bodies, presentation,
remaining S2 effects, unrepresented memory/platform/RNG and clean-stock/runtime
certification remain open. Old APIs intentionally retain their observations.

This formal integration uses the verified merged predecessor main. Local
regression and independent review remain required before publication. No remote
write or uncertain-publication retry belongs to this local stage.
