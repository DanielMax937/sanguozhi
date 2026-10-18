# Standalone city commands, profile v1

This service combines existing scalar APIs with explicitly named, replaceable service policies. It supports selecting officers and a facility, side-effect-free preview, atomic patrol/recruitment/quantity production, piece-production reservations across turns, and canonical save/load/replay. It does not extend the training engine's `GameState`, `Command`, save format or `EndTurn`.

## Internal reducer maintenance

Patrol, Recruit and quantity Produce (equipment 1–4) now delegate their detached candidate calculation to package-private reducers. This is an internal compatibility refactor: the rules, policy variants, rejection order, receipt fields, production reservations, turn advancement and public save/replay interfaces below remain applicable. Piece production and its completion stay with the existing lifecycle owner.

The reducers are not public entrypoints and do not create trusted states, a shared resource ledger, a new scenario/profile or cross-service turns. See [internal instant-command engineering contract](../engine/instant-command-reducers.md) for the input views, permitted write-back fields and maintenance boundaries. This change has only been inspected as text; no test, typecheck, compilation, build, runtime, example, checker or validator has been run for it.

## Validation status

This revision is prepared by static review and has not been retested. An earlier default aggregate run failed at the food-supply test file; that failure remains unresolved. A later instrumented diagnostic passed, but it does not replace a successful default aggregate run. No complete validation or original-game equivalence is claimed.

## Example

Run `node apps/text/city-command-demo.mjs`. Its complete primitive scenario is `data/scenarios/city-command-example-v1.json`. The sample's prices, capacities, membership, abilities, facilities and policies are supplied example data, not a recovered stock table.

The scenario starts on 226-12-21 with gold 10000, AP 200, security 80, troops 1000 and morale 80. Twelve officers have resolved leadership/charm/intelligence 100. Three patrol, another three recruit at the selected level-3 barracks, another three produce spears at the selected level-3 forge, and the remaining three start a piece at a workshop. After a save/load and two boundaries, the independently specified expected result is:

- Date 227-01-11, turn 2, revision 6
- Gold 7900 and AP 160
- Troops 5020, security 82, morale 52
- Quantity stock 4500 and piece stock 1
- One completed job, no active reservation
- The job's three participants each have intelligence XP 4 and merit 100

These are reference expectations, not a statement that the original executable has been run.

## Public API

Import from `packages/engine/src/index.ts`:

```ts
createCityCommandState(scenario: CityScenarioV1): CityStateV1 | CityCommandFailure
previewCityCommand(state: CityStateV1, envelope: CityCommandEnvelopeV1): CityCommandPreviewV1
executeCityCommand(state: CityStateV1, envelope: CityCommandEnvelopeV1): CityCommandResultV1
saveCityCommandState(state: CityStateV1): CityCommandSaveResultV1
loadCityCommandState(serialized: string): CityStateV1 | CityCommandFailure
replayCityCommands(trace: CityCommandTraceV1): CityCommandReplayResultV1
```

Creation/loading return a frozen state, or `{ok:false,reason}`. Execution returns `{ok:true,state,receipt,duplicate}`, or a rejection with no partial state. Preview returns the same planned receipt, `duplicate`, and `baseRevision`; it never commits the candidate state. Saving returns `{ok:true,serialized}`. Replay returns the rebuilt state and per-step outcomes, or the first mismatch's index and preceding state.

An envelope has exactly `id`, `expectedRevision`, and `command`. Commands are:

```json
{"type":"Patrol","cityId":"cityA","officerIds":["o1","o2","o3"]}
{"type":"Recruit","cityId":"cityA","officerIds":["o4"],"facilityId":"b1"}
{"type":"Produce","cityId":"cityA","officerIds":["o7"],"facilityId":"f1","equipmentType":1}
{"type":"AdvanceCityTurn"}
```

No command accepts a final quantity, reward, price, security change, duration or completion turn. Duplicate identical envelopes return their immutable original receipt before checking the old expected revision. Reusing an ID with different contents rejects. Records are retained up to 4096 accepted commands/jobs; there is no silent eviction. IDs are 1–128 ASCII letters, digits, periods, underscores, colons or hyphens, beginning with a letter/digit.

One to three distinct officers must exist, belong to `activeForceId`, be present in the fixed city, be available, be unreserved and not have acted this turn. All selected officers are checked. Scenario membership/presence is fixed data; there are no transfer or ownership-changing commands. A selected complete, unreserved, unused facility supplies one opportunity: barracks for recruitment, forge for equipment 1–3, stable for 4, workshop for 5–8, shipyard for 10–11. Sword 0 and boat 9 are not producible here. An explicit supplied whitelist controls unlocks.

## Complete scenario inputs

`CityScenarioV1` is a single-city, single-corps service scenario. All listed fields are required; there are no implicit stock tables, default policy lookups or optional omitted fields. See the [complete primitive example](../../data/scenarios/city-command-example-v1.json) and [exported schema](../../packages/engine/src/city-command-lifecycle.ts).

| Field group | Required values and bounds |
|---|---|
| Identity/time | `profile: "city-command-lifecycle-v1"`; `activeForceId`; `turn` is a nonnegative safe integer; `date` has year 1–9999, month 1–12 and day 1, 11 or 21 |
| Corps | `corps.id`; `actionPoints` 0–255 |
| City | `id`, `kind: "city"`; `gold` 0–1e9; `security` 0–100; `troops` 0–`troopCapacity`, with capacity 0–1e6; `morale` 0–`moraleCap`, with cap 20–255; `patrolUsedTurn`; boolean `drillGroundComplete` |
| Inventory | All ten equipment keys 1–8, 10 and 11; each has `quantity` 0–`capacity` and capacity 0–1e6. Initial input does not contain `reserved`; the service derives it |
| Officers | At most 256 records, unique IDs; each supplies `id`, `forceId`, `cityId`, boolean `available`, resolved `leadership`/`charm`/`intelligence` 0–255, at most256 unique `skillIds` in0–255, all five XP fields, `merit`, `actedTurn` and `reservationJobId` |
| XP/merit | `xp` has `leadership`, `charm`, `intelligence`, `politics` and `war`, each 0–1e9; `merit` 0–1e9. These balances do not recompute the three resolved abilities |
| Facilities | At most 30 records, unique IDs; `id`, `cityId`, `kind` from barracks/forge/stable/workshop/shipyard, level 1–3, boolean `complete`, `usedTurn`, `reservationJobId` |
| Initial markers | `patrolUsedTurn`, `actedTurn` and `usedTurn` are `null` or an integer from 0 through the supplied turn; initial officer/facility `reservationJobId` must be `null` |
| Catalog | `id`, `version: 1`, all ten `entries`, each with `basePriceWord` 0–65535. Zero is a supported supplied price |
| Equipment facts | Explicit, unique `unlockedEquipmentTypes` and `specialtyEquipmentTypes` lists containing only the ten supported equipment types; either list may be empty |
| Other facts | Boolean `pressureActive`; `difficulty` is `normal` or `super`; `controller` is `player` or `ai` |
| Policies | All twelve complete registered policy objects: `attributes`, `facilityMultiplier`, `writer`, `morale`, `time`, `productionAp`, `rewards`, `zeroYield`, `reservations`, `turn`, `apRecovery`, `presentation`, including exact version and parameter values |

Membership/presence fields on nonselected records are retained as supplied. Each selected officer and facility is checked when a command uses it. `activeForceId` is a service eligibility input, not a recovered city-ownership transaction. There is no API to mutate the scenario facts or replace a policy midway through a session; an alternative policy begins a distinct initial scenario.

## Command rules and resource lifecycle

| Command | Charge on acceptance | State change and service reward |
|---|---|---|
| Patrol | 100 gold, 20 AP | Kernel security delta through the selected writer; city patrol marker used; each participant receives requested leadership XP 2 and merit 50 |
| Recruit | 300 gold, 20 AP | Kernel troops, security argument and explicit morale policy; selected barracks used; each participant receives requested charm XP 2 and merit 50 |
| Produce, types 1–4 | Kernel catalog price, policy quantity AP | Immediate inventory write; selected forge/stable used; each participant receives requested XP 2 and merit 50, with the XP attribute chosen by the named compatibility policy |
| Produce, types 5–8/10–11 | Kernel catalog price, policy piece AP, once at start | One piece capacity reserved, selected facility and all participants locked; no start XP/merit. Completion requests one piece and intelligence XP 4/merit 100 per participant |
| AdvanceCityTurn | No command fee | One calendar boundary, policy AP recovery and one decrement for every active job; all due completions commit atomically |

Charges and rewards above are service behavior with the source limits below. All rewards use saturating service accumulators; requests need not equal actual gain at a cap. The zero-yield policy applies only to instantaneous patrol/recruitment/quantity commands, using actual security/troop/inventory delta respectively. It never substitutes an immediate piece-production completion. A zero catalog price is permitted; production still requires its effective AP cost.

Availability compares each used/acted marker to the current turn; a boundary does not need to erase older markers. Calendar progression is day 1 → 11 → 21 → next month's day 1, including December/year rollover. Year 9999 overflow rejects the whole boundary. AP recovery is part of that same atomic boundary. This calendar is a service convention, not proof of native production-time units.

Reserved inventory is not usable stock. A piece start requires `quantity + reserved + 1 <= capacity`; completion converts only that job's reservation into actual quantity. Active and completed jobs remain in the history. Officers remain locked across boundaries until their job completes. Completion clears that job's facility/participant locks and marks those participants acted in the new turn. The facility may be reused by another eligible group then; the completed participants cannot act again until a later turn.

## Rejection and duplicate behavior

The service first validates its state and the complete envelope. For an existing command ID, the entire envelope must match, including `expectedRevision` and ordered participants. An identical retry returns the original receipt with `duplicate: true`, without another debit, reward, history entry, revision increment or boundary tick. A different envelope with that ID returns `command-id-conflict`, even if its revision is stale. For new IDs, revision matching precedes history capacity and command-specific eligibility.

Representative rejection reasons include `stale-revision`, `command-history-full`, `unknown-officer`, `officer-already-acted`, `officer-production-reserved`, `wrong-facility-kind`, `facility-used-this-turn`, `facility-production-reserved`, `equipment-locked`, `piece-capacity-unavailable`, `zero-yield`, `insufficient-gold`, `insufficient-ap` and `writer-cap-overflow`. Reasons identify the first reached check, not a list of all invalid fields. A rejection never commits staged fees, rewards, stock changes, turn advancement or reservations, including when the rejection occurs after arithmetic or during a later completion in the same boundary.

## Arithmetic and accounting

Patrol uses `calculatePatrolSecurityGain`. Recruitment uses `calculateRecruitmentQuantityProjection`, then feeds the service troop writer's **returned value** to `calculateRecruitmentSecurityArgument`. Production uses `calculateProductionPrice`, `calculateProductionQuantity` and `calculateProductionTimeProjection`. The generated observations are labeled `derived-adapter-observations`, not native captures.

`quantityKernelReturn`, writer `requested`, writer `returned`, and writer `actualDelta` are separate. Every write includes before/after/cap/discarded/policy ID. `actualDelta = after − before`; equality with `returned` is a selected writer policy, not a recovered native guarantee. Fees cannot clamp an unaffordable debit. XP/merit accumulation saturates at 1e9 and does not change effective abilities. The selected facility's level multiplier applies to recruitment and quantity production, never facility count or the city's highest level. Piece-production time uses the separate time kernel, selected officer facts and the applicable `drillGroundComplete` branch; it does not multiply duration by facility level.

For recruitment, new-recruit morale is first `floor(oldSecurity / 2)`. Using the actual received troop delta `a`, the mixed value is `(oldTroops * oldMorale + a * newRecruitMorale) / (oldTroops + a)` when that denominator is positive, otherwise old morale. The selected floor/ceiling policy applies to this mixed value, after which the result is clamped to `[20, moraleCap]`. The security snapshot is from before the recruitment security write; the two rounding operations are distinct.

Patrol is once per city per service turn and charges 100 gold/20 AP. Recruitment charges 300 gold/20 AP and consumes the selected barracks opportunity. Quantity production is immediate and charges the computed catalog price and effective production AP. Piece production charges only at start, locks all participants and the chosen facility, and reserves one inventory space. Start gives no completion reward. Each boundary decrements existing active jobs once in lexicographic job-ID order. A due job writes one piece, gives each participant intelligence XP 4/merit 100 under the service accumulator, releases its own reservation, and marks the participants acted in the new turn. The facility is available after completion, but those participants must wait another turn. Completed records remain and cannot complete again. Multiple completions are one atomic boundary transaction.

### Scalar rules used by this service

These formulas describe this service's bounded, stable inputs to the existing kernels. They do not widen those kernels' native-input contracts. The implementation calls the kernels and retains their input/output observations rather than accepting these final results from a command.

**Patrol.** Let `L` be the sum of selected resolved leadership and `O` the current security. Compute `B = floor(L / 28) + 2`; if `pressureActive`, use `H = floor(B / 2)`, otherwise `H = B`. The requested security delta is `min(H, 100 - O)` in this service's security domain 0–100. Pressure applies before the upper-cap branch. See [the patrol kernel](patrol-security-gain.md) for its wider byte domain and why a native negative return outside this service domain must not be silently clamped.

**Recruitment quantity.** Let `C` be selected charm sum, `O` the saved pre-command security, and `K` be 15 if any selected officer has skill ID79, otherwise10. Compute `A = 1000 + floor((O + 20) * C / 20)`, then `N = floor(A * K / 10)`, then `R = trunc(N * F)` using the selected registered binary32 factor `F`. Double `R` for `difficulty: "super"` with `controller: "ai"`; then, if pressure is active, halve toward zero. The service supplies stable troop/capacity observations in the nonnegative, no-overflow domain, so the kernel's capacity branch is equivalent here to limiting `R` to remaining troop capacity. This simplification is not the general native signed32/wrapping rule. The service writer processes that kernel return separately. See [recruitment quantity](recruitment-quantity.md).

**Recruitment security.** The troop writer's `returned` field, not the pre-cap quantity or automatically its actual delta, is supplied to [the security-argument kernel](recruitment-security-argument.md). For this service's nonnegative returns, requested security change is `-floor(returned / (C + 100))`. That request then passes through the selected security writer. The earlier charm sum and security snapshot remain unchanged by these writes. Morale uses the actual troop delta and the two-rounding formula above.

**Price.** Read the selected equipment entry's supplied `basePriceWord`. If the equipment appears in `specialtyEquipmentTypes`, the service supplies a nonzero specialty observation and the price is `floor(basePriceWord * 8 / 10)`; otherwise it is the base price. There is no minimum1 or hidden 700/800 gold table. This uses [the price kernel](production-price.md); membership in the supplied list is a service input, not recovered stock lookup data.

**Quantity production, types1–4.** Let `I` be selected intelligence sum and `M` its maximum. Base quantity is `(M + I + 200) * 5`. Double it if any selected officer has skill ID80 for types1–3 or ID81 for type4; multiple matching officers do not stack. Multiply this skill-adjusted quantity by `F` and truncate toward zero. Only after this conversion, double for super/AI. Specialty changes price here, not this quantity formula. There is no kernel9000 cap or1010 minimum; actual stock still uses capacity minus reservations and the selected writer. See [quantity production](production-quantity.md).

For the default facility policy, level1/2/3 uses `F = 1`, `5033165/4194304`, `3/2`, corresponding to exact binary32 bits `3F800000`, `3F99999A`, `3FC00000`. The middle value is not an arbitrary JavaScript1.2 constant or recovered stock-table proof. The flat alternative supplies1 at every level. Skill adjustment precedes factor conversion in both quantity kernels; super/AI multiplication follows conversion.

**Piece time, types5–8/10–11.** Using intelligence `I` and `M`, let `q = trunc(max(24, M + I - 200) / 24)`. The ordinary raw result before the skill step is `10 - q`. For ships10–11 only, the service's successful facility observations and `drillGroundComplete: true` select `max(2, 8 - q)` instead. If any selected officer has skill ID82 for5–8 or ID83 for10–11, halve that result toward zero last. The raw result may be zero or negative; the default time policy schedules `max(1, raw)` service turns, whereas the positive-time alternative rejects a nonpositive raw result. Facility level does not multiply time, and super/AI/pressure do not enter this time kernel. See [production time](production-time.md). The quantity kernel independently returns one piece for the supported piece types.

### Writer and boundary ordering

For a resource write, let `raw = before + requested`. The clipping policies compute `after = min(cap, max(0, raw))`, `actualDelta = after - before`, and `discarded = requested - actualDelta`; their returned field is either actual delta or the requested value as named by the policy. The rejecting policy rejects a nonzero request whose raw result is outside0..cap. Charges use a separate exact-affordable debit writer; XP/merit use their separate saturating accumulator, so the resource writer choice does not remove their cap.

Each successful new envelope increments revision once and appends its complete envelope, digest and receipt once. On a boundary, calendar/turn advancement and AP recovery are staged first; active jobs are considered in lexicographic job-ID order. Every active job decrements once. Each due job stages its inventory write, rewards, reservation release and completed record, then the boundary records its turn-advanced event. Any rejection discards the entire staged boundary. No new piece fee or completion reward is repeated on later boundaries.

## Policies are complete versioned inputs

`CITY_COMMAND_DEFAULT_POLICIES` is a frozen complete snapshot. `CITY_COMMAND_POLICY_REGISTRY` lists registered alternatives. Pass each complete `{id,version,parameters}` object; ID-only, unknown IDs, missing parameters or mismatched parameters reject. Saved parameters are checked against that version, not replaced by current defaults.

| Family | Default behavior | Registered alternative |
|---|---|---|
| Attributes | Stable command-start resolved abilities/skills | None |
| Facility factor | Levels 1/2/3 use binary32 bits 3F800000/3F99999A/3FC00000 | Flat 1 |
| Resource writer | Clip, return actual delta | Reject overflow; or clip and return requested |
| Morale | Weighted floor using old security/2 and actual received troops, then minimum 20 | Weighted ceiling |
| Piece time | `max(1, rawKernelReturn)` service turns | Reject nonpositive raw times |
| Production AP | Effective 20 at start | Quantity 25, piece 30 |
| Quantity XP attribute | Intelligence compatibility interpretation | Politics literal listed-byte interpretation |
| Zero instantaneous yield | Pay, consume opportunity and reward | Reject |
| Reservation | One piece space and every participant/facility locked | None |
| Boundary | One service turn, completed actors acted | None |
| AP recovery | +20, cap 255 | +0 or +40 |
| Presentation | No RNG/TP | None |

The morale formula, snapshot consistency, eligibility, facility selection/multipliers, resource caps/writer semantics, XP accumulation, zero-yield legality, AP recovery, scheduling and time-unit mapping are service policies. “One service turn” is a synthetic ten-day calendar boundary; raw native production-time units and native phase scheduling have not been certified. Difficulty/controller/pressure/drill-ground facts are explicit scenario inputs, not a map-distance or native controller implementation.

## Persistence, input safety and testing

Independent state schema 1 uses scope `standalone-city-command-lifecycle`. Save and trace tags are `san11-city-command-save-v1` and `san11-city-command-trace-v1`. Saves retain the complete primitive initial scenario, current data, catalogs/policies and their SHA-256 canonical digests, accepted envelopes and receipts, start snapshots, reservations, and completion records. Loading recomputes every accepted command from the saved primitive scenario and compares the entire state, including all job derivations. A checksum alone never validates a saved final answer. This is consistency checking, not signing or authentication against an attacker who rewrites an entire consistent scenario/history.

Trace steps contain `envelope` and either a complete expected outcome or `null`. `expectedFinalDigest` is a canonical-state SHA-256 digest or `null`. Failed attempts may be replayed; they leave the state unchanged. Expected results only check recomputation and never drive it. Replay stops at the first mismatch.

The supported proxy-rejection path requires a Node runtime exposing `process.getBuiltinModule("node:util").types.isProxy`; an environment without that hook does not provide equivalent proxy detection. Public inputs require closed plain data objects and dense arrays; accessors, proxies in the supported Node runtime, symbols, extra/nonenumerable fields, cycles, undefined, noninteger/nonfinite numbers, negative zero, coercible strings and duplicate JSON keys reject. Frozen inputs are supported without mutation. Serialization is bounded to 64 Mi JavaScript string code units, depth 64, and 4096 array entries; data snapshot traversal is additionally bounded to 2,000,000 nodes and 64 Mi string-value code units; JSON objects may have reordered keys. Original scenario arrays and selected participant order remain preserved.

The added tests use fixed source-literal vectors, explicit policy expectations, an independent BigInt/rational ledger, lifecycle chains, malformed inputs, canonical continuation/replay and reservation invariants. Tests do not supply caller-computed final results to the service.

## Source limits and attribution

Source identities and hashes: [source manifest](../sources/city-command-lifecycle.json). Public listings are pinned to [`sjn4048/311MemoryResearch` at 66e167e](https://github.com/sjn4048/311MemoryResearch/tree/66e167e40c3440929ec016f3872aefc3486434c1), Apache-2.0; the unmodified caller snapshots and [license](../sources/city-command-lifecycle-LICENSE.txt) retain the original bytes/mnemonic/comment contradictions after reversible UTF-8 transcoding.

Quantity production at 005C66AE lists bytes `6A 03` but mnemonic `push 02`, with an intelligence comment and politics MOD annotation. This conflict is deliberately unresolved; the two named reward policies expose the choice. Piece completion XP4/intelligence2/merit100/output1 are **caller requests**, not proof of writer behavior. Both production start callers request 20 AP; effective debits still use the named service policy. The existing manual summary was not independently reacquired for this service.

Still unverified: clean-stock executable identity/bytes, native helper/validator/getter/ABI behavior, prices/caps/float selection tables, native reward growth/writers, mixed-morale internals, pressure-distance checks, time units/phases and cross-version behavior. No original executable was run. The original 43 evidence gaps and their denominator remain unchanged.

Excluded: P078 and its dependencies; capture, death, force extinction, ownership, return, mission and native finalizer transactions; native task set/clear/cancel; real personnel migration and native travel/deployment/return chains. The new `ProductionJob` is only this service's resource reservation. No cancellation or force-complete interface exists, and rejected/corrupt saves are never repaired by running a native task chain.
