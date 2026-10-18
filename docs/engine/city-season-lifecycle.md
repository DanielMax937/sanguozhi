# City season lifecycle: bounded standalone API

Status: static implementation candidate, 2026-10-18. No product/example/test/typecheck/compile/build/runtime/checker/diagnostic/schema-validation run has been performed.

Profile: `single-city-season-simulation-v1`. New module: `packages/engine/src/city-season-lifecycle.ts`. It imports only three registered JSON data artifacts and the two existing food pure kernels. It does not import the finance lifecycle, a status lifecycle, or a native executor.

The public entry point is [packages/engine/src/index.ts](../../packages/engine/src/index.ts). Its integration baseline is PR89 main `0c5ad00667d40960e72f2d8b14c9c20f7eec30fc`, tree `a88a940c92a37c85ac8a827f1f8988ae18401aea`. The source manifest retains the historical PR86 capture identity; the two food kernels, their two source JSON dependencies and the facility catalog have the same Git blobs at both fixed baselines. This integration identity does not certify new native evidence or global scheduler/finance integration.

## Public API

Six named functions are defined in the module:

All six functions and the three constants below are re-exported by the public entry point. Its 11 type exports are `CitySeasonScenarioV1`, `CitySeasonStateV1`, `CitySeasonEnvelopeV1`, `CitySeasonSnapshotV1`, `CitySeasonReceiptV1`, `CitySeasonResultV1`, `CitySeasonFailureV1`, `CitySeasonPreviewV1`, `CitySeasonSaveResultV1`, `CitySeasonTraceV1` and `CitySeasonReplayResultV1`. The schema fragment name `stateResult` is not an additional exported TypeScript type.

`CITY_SEASON_POLICY_V1`, `CITY_SEASON_FOOD_CATALOG_V1` and `CITY_SEASON_SOURCES_V1` expose the same deeply frozen independent snapshots used internally. They do not retain the shared mutable raw JSON imports. Mutation through another ordinary JSON importer after module initialization cannot alter the registered contract; trusted initial module/resource loading remains a host prerequisite.

| Function | Input | Result |
|---|---|---|
| createCitySeasonState | complete CitySeasonScenarioV1 | `{ok:true,state}` or Failure |
| previewCitySeasonCommand | validated state, complete envelope | `{ok:true,committed:false,duplicate,projectedState,receipt}` or Failure |
| executeCitySeasonCommand | validated state, complete envelope | `{ok:true,committed,duplicate,state,receipt}` or Failure |
| saveCitySeasonState | validated state | `{ok:true,serialized}` or Failure |
| loadCitySeasonState | serialized save string | `{ok:true,state}` or Failure |
| replayCitySeasonTrace | complete scenario, ordered attempts, optional comparisons | `{ok:true,state,attempts}` or Failure |

### Schema entry points for API results

The companion schema's root `oneOf` covers only scenario, envelope, state, save record and trace inputs. API return objects use the corresponding result fragment below; they are not accepted by that root entry point.

| API return object | Schema fragment |
|---|---|
| createCitySeasonState / loadCitySeasonState | [#/$defs/stateResult](../sources/city-season-lifecycle.schema.json#/$defs/stateResult) |
| executeCitySeasonCommand | [#/$defs/executeResult](../sources/city-season-lifecycle.schema.json#/$defs/executeResult) |
| previewCitySeasonCommand | [#/$defs/previewResult](../sources/city-season-lifecycle.schema.json#/$defs/previewResult) |
| saveCitySeasonState | [#/$defs/saveResult](../sources/city-season-lifecycle.schema.json#/$defs/saveResult) |
| replayCitySeasonTrace | [#/$defs/replayResult](../sources/city-season-lifecycle.schema.json#/$defs/replayResult) |

Select the fragment within the complete schema document so its internal `#/$defs/...` references retain their resolution context. Each result fragment includes Failure. Do not combine all result fragments into one `oneOf`: their shared Failure alternatives overlap. `saveResult` describes the outer `{ok:true,serialized}` response; `save` describes the JSON record encoded inside its serialized string. These are schema usage instructions, not a claim that any validator has been run.

Failure is always `{ok:false,committed:false,reason,commandId,effects:[]}`. A malformed envelope or invalid state may leave commandId=null. No partial candidate is exposed. Public types are deep-readonly and successful values are recursively frozen. Read the returned snapshot directly; current booleans are `remainingMonths>0`.

The only command is `AdvanceSeasonMonth`. The envelope is closed `{id,expectedRevision,command:{type:"AdvanceSeasonMonth"}}`. All computations and RNG outcomes are endogenous. Caller-supplied final results, loss rates, next dates, facilities-to-destroy or selection flags are not accepted command fields.

## Complete registered input

The [example trace](../../data/scenarios/city-season-example-v1.json) embeds a full scenario with exactly 30 facility slots, complete roster assertions, positive troops/food, health primitives, current/scheduled records, seed, and complete copies of:

- [policy](../../data/catalogs/city-season-policy-v1.json)
- [restricted food catalog](../../data/catalogs/city-season-food-facilities-v1.json)
- [source binding](../sources/city-season-lifecycle.json)

Its first attempt advances one month; its second repeats the same envelope. Both expected fields and expectedFinalState are null. The file is unrun input, not a fixture containing invented receipts or a success claim. If the chosen seed reaches an unsupported effect or budget limit, the specified result is rejection, not a fallback.

The initial month is already settled. Creation produces no damage or income. Dates must be month starts. The finite 1..36-month horizon and one additional month for pending lookahead are checked at creation. No reset, resume extension or caller-selected date API exists.

## Pure-kernel integration

On quarterly months, the adapter derives a 30-slot `CityFoodIncomeProjectionInput` from the remaining facilities and post-plague troop count. Completed farm Lv1/Lv3 map to 32/53; granary 39 supplies the distance-one boolean; military-farm 49 gets the true current troop count. Unsupported/unfinished facilities are rejected before execution.

It then calls `calculateCityFoodIncomeProjection(request)` and checks supported, nonnegative safe return and consistent signed/U32/intermediate views. Its actual complete F is passed to `calculateMonthlyCityFoodBaseArgument` with the newly derived harvest flag and an explicit late levy 0. The resulting request J is capped only when posting to the local food balance.

Both full requests and both full pure-kernel receipts, including original evidence metadata, are retained in the monthly receipt. An old leaf's evidence flags continue describing that leaf; they are not rewritten to claim native writers or schedulers became verified. This wrapper labels derived observations and its own bounded posting separately.

## Transition and audit shape

Each receipt stores envelope, before/after date and revision, current skill holder IDs, migrations, scalar writes, removed facilities, income, generation decisions, all raw RNG transitions, snapshotAfter and unchanged evidence boundary.

Scalar writes preserve before, signed requested delta, after, actualDelta and discarded quantity. Farm removal includes its old full facility object, slot occupancy write and 30 TP write. Health no-op and floor-to-zero resource loss stay zero. Pending transitions retain before/after and prevented/activated outcomes; no hidden flags drive the implementation.

Order is fixed: current decay/activation; plague troop loss and ID-sorted health rolls; locust food loss and ID-sorted Lv1 removals; quarterly food; plague/locust/harvest generation. Fengshui prevents new generation and pending activation only. Prayer switches only the harvest threshold. All these timing details are explicit simulation policy, not original scheduling evidence.

## State, idempotency and transaction boundary

The state contains full genesis, snapshot and accepted `{envelope,receipt}` history. Each operation reconstitutes the state from genesis. Snapshot identity, sources, policy, catalog, intermediate receipts and retained history must match exactly; object-key order is canonicalized while array order is preserved.

An exact duplicate ID/envelope returns its historical receipt even when its expectedRevision is older than the current revision. It returns the current validated state and does not reapply effects. Conflicting content under an accepted ID fails. New IDs must match current revision.

Step clones the validated state, completes all effects and receipts, then checks every budget before returning a committed result. Death boundary, nonpositive troops/food, insufficient TP, unsupported kernel result, calendar/horizon or serialization/RNG failure discards the entire candidate. The caller's state object is untouched. Preview uses the same step/budgets and discards its candidate unless the caller separately executes the same command against unchanged state.

## Serialization and replay

Save is canonical JSON for `{tag:"san11-city-season-save-v1",state}`. Load's bounded text parser rejects duplicate decoded keys before overwrite, including Unicode-escaped aliases. It rejects malformed JSON, unsafe numbers, negative zero, excessive nesting/nodes/bytes, and then reconstructs every accepted month and complete receipt from the initial seed.

Each reconstructed step rechecks the same return budgets. Save budget includes the raw record and the escaped SaveResult string, not merely the raw state. Every historical receipt is paired with the current state in both duplicate-execute and duplicate-preview envelopes at commit time, so an older large receipt remains returnable after newer smaller receipts.

Trace attempts must contain structurally valid envelopes; logical failure attempts can be compared and retained without changing the trace state. `expected` and `expectedFinalState` are comparison-only. They never select RNG, effects, state, or kernel outcomes. Trace output itself is bounded before return. A trace-comparison failure exposes no partial state.

Closed DTO checks reject non-data descriptors without reading getters. The supported boundary explicitly excludes Proxy objects and polluted intrinsics; JavaScript reflection is not a general side-effect sandbox. Runtime validation and complete replay enforce cross-field relationships not encoded by the companion shape schema.

In particular, the `cityFoodRequest` fragment leaves `cityTroopsWord` and `cityPlayerPredicate` optional without their conditional presence rules. The adapter supplies `cityTroopsWord` exactly when a military farm is present, and supplies `cityPlayerPredicate` exactly when `difficultyWord` is 2 (super); both are absent otherwise. The fixed food kernel checks these conditions. State loading also reconstructs the adapter request and compares the complete receipt, so a shape-schema match alone is not evidence that such a request is a valid adapter output or replay-consistent state. This conditional relationship remains enforced by the module and kernel; the schema has not been tightened or validated here.

## Bounds

Accepted history 256, month horizon 36, trace attempts 256, raw transitions 4096, depth 32, nodes 250000, canonical UTF-8 bytes 16 MiB, array length 4096, object keys 256. The complete registered JSON data and kernel evidence are counted. No history truncation or lossy receipt compaction exists.

RNG uses `xorshift32-nonzero-domain-rejection-v1`: raw 1..4294967295; sample=raw-1; M=4294967295; limit=floor(M/B)*B; reject sample>=limit; otherwise sample%B. Every raw counts, including rejections, and B=1 consumes one. Equal preimage counts are limited to the accepted raw domain; `strictlyUnbiased:false` and `independentDrawsCertified:false` are deliberate.

## Evidence and remaining work

[Detailed rules](../rules/city-season-lifecycle.md) distinguish documented behavior, source-listing pure projections, adapter assumptions, new policy and exclusions. [Schema](../sources/city-season-lifecycle.schema.json) covers scenario, command, snapshot, receipts, state, save, trace and API results; it was authored but not run through a validator.

This candidate makes no test/compile acceptance claim. Native disaster probabilities, original writers, scheduling, stock/patch identity, original 43 groups/45 snapshots remain open. Cross-service ledgers and clocks have not been integrated.
