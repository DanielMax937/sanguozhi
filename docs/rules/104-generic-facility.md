# 004B40C0 generic-facility entry and early return

## Formal integration and verification

Baseline: PR #26 merged main `094f94b41795169df73fe708f9bbd29083949ea1`. The 31-file audited implementation is reused with production, model tests, raw assembly and verification reports byte-for-byte unchanged. Only this theme's manifest/checker baseline and two inherited metadata pins, the documentation, and six main indexes are reconciled. The pin changes are recursively proven metadata-only through P0-68 and P0-67; older APIs and trace contracts remain frozen.

The latest-main108-command set passed after retry. The original run passed107/108: TypeScript,85 Node tests,105 Python checker commands and the short demo succeeded; only npm run demo:lifecycle exited137/Killed. Its original log is retained. The same command then passed under the same shared Node lock with NODE_OPTIONS=--max-old-space-size=512, on Node24.19.0/npm11.9.0. The cause of137 remains unconfirmed. This is a complete command set with one retried result, not a fresh single all-green108-command run. No product, test or command-argument changes were made for the retry.

The integrated tree passed13 new plus13 inherited source groups,28 independent-model groups and9 historical independent-review probe groups. Both whole-IDB fingerprints and raw-ID1 closure checks were repeated: S1 612 intervals/73,783 interval bytes and S2 624/74,140, counting overlaps. The inherited Capstone5.0.7/2,222-instruction report was hash-checked; this integration did not repeat that decode.

Independent integration-delta review found no blocking issue. All27 production/model/raw/report files are byte-identical to the audited implementation. The complete1,230 tracked files and Git index were frozen unchanged across the original run and retry; all108 original log hashes plus the retry log hash were checked. Only validation-result wording in5 documents was added afterward; no production, test or raw-evidence bytes changed. These are local static-source and synthetic-model results, not executed SAN11 gameplay, authenticated callback records, hosted CI or stock equivalence.

## Scope and API

`source-idb-S1-S2-generic-facility-v1` is an additive, source-local Python transaction profile in `scripts/generic_facility_profile.py`. `project_generic_facility` and `replay_generic_facility` use the unchanged `source-idb-S1-S2-base-ownership-frame-v1`. The new required policy field is `facilityDomain: canonical-generic-facility-v1`; all live-zero-refund policy fields remain mandatory. Earlier projectors and their replay schemas are unchanged.

Every previously supported live-zero-refund command remains available. The new `ruler-transfer` command takes:

- `buildingId`: signed 32-bit ID; outside 0..16383 denotes the null result of the canonical getter
- `requestedLegionId`: null or a canonical fixed-array pointer identity 0..46, not a validity flag or a raw address
- `nativeArgument`: original signed 32-bit third argument, untouched by the entry and generic branch

The enclosing ruler relocation continues to pass its requested-legion pointer and native third argument 0. Its former whole-call `004B40C0` boundary now enters the new primitive on the same mutable frame. There is one ordered observation stream, one command digest and one final revision. No legacy transaction is projected and then copied back.

## Native control and pointer contract

1. The entry's building validity gate is `0047A630` at 004B40FB. Failure retains EAX=0 through the common normal epilogue and returns without ownership stores or requested-legion reads.
2. A valid building's virtual+44 scalar is converted by `00490AD0` into a canonical legion pointer, saved at stack+10. The getter constructs an address for 0..46 without reading that row or its validity, and returns null otherwise. Trace `entryOldRawLegionId` is diagnostic entry provenance; it is not a retained native scalar local.
3. `00491770` converts the canonical building pointer to its ID. The signed comparisons at 004B412C/004B4131 select exactly 87..16383 for the generic branch, irrespective of facility kind.
4. Generic flow converts the requested pointer using `004912C0`. Null becomes -1; aligned canonical pointers retain their identities even if the legion is invalid. This conversion does not read target fields or add a validity gate.
5. `004AD550` executes the existing live ownership primitive with the same entry manager, building pointer and converted legion ID. Generic owner-force stores, real event9/10 predicates, live zero-refund cancellation, and all inherited callbacks run on that frame. The subsequent MOV EAX,1 is unconditional, including after an ownership early return or callback invalidation of the original building.
6. The common normal epilogue restores the handler and caller registers and returns with 12 argument bytes removed. The verified matching-cookie return preserves EAX. Stack-probe faults, cookie mismatch, structured exceptions and arbitrary memory effects are not executed by this model.

The original manager pointer is captured from entry ECX into EBP and remains the receiver of `004AD550`. Its symbolic identity is `entry-gameplay-manager`. This does not claim that it equals the separate literal 07999808 used later inside canonical capture, or that its physical address/state is represented.

## Canonical continuation observation

Canonical flow remains an explicit `effect-query` boundary named `004B415D..004B4988`, beginning before PUSH EDI and ending at common epilogue entry. Its bound arguments are:

- `buildingId` and `entryBuildingId`: original canonical building pointer/converted ID
- `requestedLegionId`: untouched original pointer, including null
- `nativeArgument`: untouched original third argument
- `savedOldLegionId`: saved pointer identity from entry, independent of later live fields
- `managerIdentity`: the same symbolic entry manager

At the boundary ESI is the building pointer, EBP and stack+14 hold the entry manager, EAX is the converted building ID, and stack+10 holds the old-legion pointer. The requested pointer has not been validated or converted. Original arguments remain at stack+1944, +1948 and +194C. The record additionally binds source, ordered index, complete modeled call stack, before frame, after frame, RNG consumption and observed normal EAX (integer0 or1; booleans are rejected). `unknownEffects: reject` rejects atomically instead of inventing an identity callback. The only normal canonical exits are requested-pointer-invalid0 at004B4170 and completed1 via004B4981. The observed result must satisfy that range, but the capture logic deciding it is not independently executed.

The frame has a fixed represented ID domain. A missing canonical row at a native field read is an unreadable-domain error, not a fabricated invalid object. Pointer construction itself does not require a target row. The new-version relocation coordinator changes only its requested-legion getter to address construction, so a canonical continuation can receive a readable identity even when that target row is outside the represented domain. A generic branch still requires the row when004AD550 actually checks it. Earlier relocation APIs retain their frozen behavior; other inherited entry paths retain their previous conservative represented-slot requirements.

## Evidence limits and outstanding work

The two IDBs are MOD-associated S1/S2. Equal selected bytes do not establish clean-stock PC-PK1.1, Vanilla, console or runtime equivalence. The profile reports stockVerified=false and machineCodeExecuted=false. Tests and callback records are source/synthetic model evidence, not authenticated SAN11 gameplay observations.

Arbitrary or misaligned pointers are excluded: native `004912C0` performs signed quotient arithmetic and does not generally classify every noncanonical address as null. Physical stack, manager memory, unrepresented fields, faulty allocation/probing and cookie failure stay outside the normal domain. Full ruler capture and transfer, surrender/captive policy, force extinction, recursive-return ruler ownership, event9 troop reaction, actual troop membership/non-base positions, S2 effects/observers, positive refunds/resources, presentation internals, tail-distance observation, global RNG and platform/runtime certification remain open. Existing TODO and debt records are not removed.
