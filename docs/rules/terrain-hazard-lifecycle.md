# Detached terrain, status and empty-cell fire lifecycle

This API runs a finite, supplied-map episode. It calculates terrain entry losses, applies successful ordinary status effects, counts status and vacant-cell fire lifetimes, and produces replayable transactions. It does not execute the original game or modify the training sandbox's `GameState`.

Import from `packages/engine/src/index.ts` on the repository's Node.js 24 runtime. No network, wall clock, global random generator, native identifiers or external state is used. The service receives intentions, not caller-computed damage or final state.

## Quick start

This complete example runs from the repository root with Node.js 24. All numbers below are literal expected results.

```js
import assert from 'node:assert/strict';
import {
  DETACHED_HAZARD_POLICY, createHazardState, previewHazardCommand,
  executeHazardCommand, saveHazardState, loadHazardState, replayHazardTrace,
} from './packages/engine/src/index.ts';

const created = createHazardState({
  schema: 'san11-detached-hazard-state-v1', revision: 0, turn: 0, phase: 'orders',
  map: {id: 'example', cells: [
    {id: 'A', terrainInfoU32: 0, adjacent: ['F', 'P'], blocked: false, unsupportedContext: false},
    {id: 'F', terrainInfoU32: 0, adjacent: ['A'], blocked: false, unsupportedContext: false},
    {id: 'P', terrainInfoU32: 11, adjacent: ['A'], blocked: false, unsupportedContext: false},
  ]},
  unit: {id: 'U', cellId: 'A', troops: 2000, energy: 80, acted: false, status: 'normal', remaining: 0},
  traits: {traverse: false, antidote: false, difficultMarch: false},
  defenseTier: 3, auras: [], fires: [],
  rng: {kind: 'bounded-tape-v1', draws: [
    {bound: 200, value: 0}, {bound: 100, value: 70}, {bound: 100, value: 69},
  ], cursor: 0},
  policy: DETACHED_HAZARD_POLICY,
});
assert.equal(created.ok, true);
const initial = created.state;
let current = initial;
const commands = [], receipts = [];
for (const intent of [
  {type: 'enterCells', path: ['P']},
  {type: 'applyStatus', kind: 'confused', critical: true},
  {type: 'igniteCell', cellId: 'F', source: 'strategy', critical: true},
  {type: 'resolveTurn'},
  {type: 'beginTurn'},
  {type: 'calm', critical: false},
]) {
  const command = {...intent, expectedRevision: current.revision};
  const result = executeHazardCommand(current, command);
  assert.deepEqual(previewHazardCommand(current, command), result);
  assert.equal(result.ok, true);
  commands.push(command); receipts.push(result); current = result.after;
}
assert.equal(current.unit.troops, 1900);
assert.equal(current.unit.energy, 80);
assert.equal(current.unit.status, 'normal');
assert.equal(current.turn, 1);
assert.equal(current.fires[0].remaining, 1);
assert.equal(current.rng.cursor, 3);
const saved = saveHazardState(current);
assert.equal(saved.ok, true);
assert.deepEqual(loadHazardState(saved.json), {ok: true, state: current});
const trace = {schema: 'san11-detached-hazard-trace-v1', initial,
  policySnapshot: initial.policy, commands, receipts, finalState: current};
assert.deepEqual(replayHazardTrace(JSON.parse(JSON.stringify(trace))),
  {ok: true, state: current, receipts});
```

## State and validation

`HazardState` is a complete immutable snapshot. `createHazardState(input)` returns `{ok:true,state}` after validating and detaching it. There are no defaults or implicit imports from older saves.

- `revision` and `turn`: unsigned 32-bit integers; phase is `orders` or `resolved`
- `map`: ASCII id and 1–256 cells, strictly ascending unique cell IDs. Each cell has exactly `id`, `terrainInfoU32`, `adjacent`, `blocked`, `unsupportedContext`. Directed adjacency is supplied explicitly; no reverse edge or self-edge is inferred
- `unit`: id, current cell ID, troops 1–1,000,000, energy 0–255, acted boolean, status `normal|confused|false-report`, remaining 0–255. Normal means remaining is zero, and vice versa. Current cell must exist and be usable
- `traits`: exactly three explicit booleans, `traverse`, `antidote`, `difficultMarch`
- `defenseTier`: 3, 4 or 5, already selected by the caller. Each of at most 256 unique aura records has `id`, `facilityTier`, `eligible`, `coveredCells`. Coverage IDs are unique and must exist. Qualification and coverage are supplied facts; ownership and geometry are not inferred
- `fires`: at most 256 unique records, strictly ascending by `cellId`, with source and remaining 1–255. Cells must exist and be usable. A fire on the unit's current cell is rejected as `unsupported-fire-damage`
- `rng`: `kind:'bounded-tape-v1'`, dense `draws:[{bound,value},…]` and cursor. Bounds are 2, 100 or 200, with integer `0 <= value < bound`. Cursor cannot exceed the tape length. Every future draw is structurally validated; the requested bound is checked when consumed
- `policy`: the entire validated policy snapshot, including per-source tables

IDs use `[A-Za-z0-9][A-Za-z0-9._:-]{0,127}`. All object keys are exact. Arrays are dense. Unknown keys, accessors, symbols, functions, cycles, nonfinite numbers, negative zero, unexpected prototypes, duplicate records and dangling references are rejected. Plain and null-prototype records are accepted. Own-property descriptors are inspected without invoking accessors. The Node 24 proxy intrinsic rejects proxies, including revoked proxies, without invoking their traps. In other JavaScript hosts, proxies are outside the supported plain-data contract; their traps cannot generally be detected without reflection. Boundary exceptions return safe errors without including the input.

The entire input has a 1 MiB UTF-8 compact-JSON limit and a nesting limit of 64. The two-argument command API applies that limit to the pair `[state,command]`. Paths, tapes, trace command lists and receipt lists each have at most 4096 elements, subject also to the combined byte limit. Per-cell adjacency and per-aura coverage have at most 256 unique IDs. No unbounded callback or registry is accepted.

## Commands

Every command includes `expectedRevision`. A successful command increments revision exactly once, including a zero-delta calm. Stale revisions fail. Revision and turn overflow fail without wrapping.

1. `enterCells {path}`: orders phase only, normal unacted unit. The nonempty path is an ordered sequence of entries, excluding the starting position. Every entry must follow the directed edge from the current position. Repeated entry charges again. The service updates location and troops; it does not set acted or charge AP, movement budget or resources
2. `applyStatus {kind,critical}`: orders phase, kind `confused` or `false-report`. This explicitly means an already-successful ordinary effect. It draws a duration, applies critical +1, and takes max with the old same-kind duration. Changing between abnormal kinds is `unsupported-status-replacement`. It does not calculate strategy success or cost
3. `calm {critical}`: orders phase. Ordinary calm clears either abnormal kind, preserves acted and consumes no random draw. A normal target succeeds with an explicit unchanged `calmed` effect. Critical calm rejects as `unsupported-calm-area`
4. `igniteCell {cellId,source,critical}`: orders phase, one usable vacant cell. Source is `strategy|fire-arrow|fire-trap|lightning|scripted-event`. This is a standalone ignition intent, not an attack. Reignition uses max remaining, records the latest source even when the old counter wins, and reports old/new provenance
5. `resolveTurn`: orders phase. Reject an unacted false-report unit before any effects. Otherwise consume an unacted confused unit's action, count status down, then count fire records down in ASCII cell order. Remove zero counters and set phase to resolved. No random draws or spreading occur
6. `beginTurn`: resolved phase. Increment turn, reset acted to false, set phase to orders. Status and fire counters do not change

A confused unit with remaining 1 still loses its action before becoming normal. An already-acted false-report unit can count down, or ordinary calm can clear it. An unacted false-report unit requires unsupported retreat behavior; `resolveTurn` rejects the entire command as `unsupported-retreat`, preserving status, fires, acted, phase, location and RNG cursor.

## Arithmetic and replacement policies

`DETACHED_HAZARD_POLICY` has id `o01-detached-pk-reference-policy-v1`, version 1. It is mixed-source reference behavior plus explicit engineering policy, not a native-fidelity certification.

Terrain is `terrainInfoU32 & 31`. Each nonimmune plank entry (11) requests `100 + draw(200)` troops; traverse or difficultMarch gives zero and consumes no draw. Poison (4) requests `200 + draw(200)`; antidote gives zero. Other terrain does not consume RNG. Poison never adds an energy penalty. If any entry would leave zero or fewer troops, the whole command fails as `unsupported-lethal-damage`; no death, retreat or casualty finalizer runs.

Status initialization draws once from bound 100: values 0–69 produce base 1, values 70–99 base 2. Critical adds exactly 1. Refresh is max, never old+new or max+1. An existing count 255 remains 255. Recovery is step 2 if any eligible aura of the selected tier covers the current cell, otherwise 1; overlapping auras do not stack. The receipt records the sorted qualifying aura IDs.

Each of strategy, fire-arrow, fire-trap and lightning owns a separate weighted profile `[{turns:1,weight:70},{turns:2,weight:30}]`, drawBound 100, criticalBonus 1. Scripted-event owns a fixed base 2 and criticalBonus 1 and uses no draw. Its label does not execute a historical event. Weighted reignition consumes a draw even when max retains the old counter.

A counter represents remaining resolution opportunities in this API. Counter 1 set in orders disappears at that turn's resolution; counter 2 survives one resolution. This phase convention does not establish the original game's visible-turn mapping.

To replace policy, create a new state with a new policy ID and a complete snapshot. The mode/version and hard safety boundaries are fixed in v1. Weighted source tables may contain ascending unique turns 1–254 with positive integer weights summing to 100; scripted fixed duration is 1–254. CriticalBonus remains 1. The status threshold can be 1–99. Source kinds cannot be swapped. Baseline ID with modified payload is invalid. Policy snapshots cannot be swapped during replay, even under the same custom ID.

This replacement example runs independently from the repository root:

```js
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {executeHazardCommand} from './packages/engine/src/index.ts';
const fixture = JSON.parse(readFileSync('./packages/engine/test/fixtures/terrain-hazard-v1.json', 'utf8'));
const state = fixture.baseState;
state.policy.id = 'three-turn-strategy-v1';
state.policy.lifetimeBySource.strategy.weights = [{turns: 3, weight: 100}];
state.rng.draws = [{bound: 100, value: 69}];
const critical = executeHazardCommand(state, {type:'igniteCell', expectedRevision:0,
  cellId:'F', source:'strategy', critical:true});
assert.equal(critical.ok, true);
assert.equal(critical.after.fires[0].remaining, 4);
const ordinary = executeHazardCommand(state, {type:'igniteCell', expectedRevision:0,
  cellId:'F', source:'strategy', critical:false});
assert.equal(ordinary.after.fires[0].remaining, 3);
const other = executeHazardCommand(state, {type:'igniteCell', expectedRevision:0,
  cellId:'F', source:'fire-arrow', critical:true});
assert.equal(other.after.fires[0].remaining, 2);
```

## Receipts, persistence and replay

`executeHazardCommand(state,command)` and `previewHazardCommand(state,command)` run the identical pure reducer. They do not mutate or freeze caller objects. On success, adopt the returned `after` snapshot yourself; preview has no separate global commit.

A successful receipt contains `ok:true`, `before`, `after`, `command`, `policySnapshot`, `rngBefore`, `rngAfter`, `effects`, `revisionBefore`, `revisionAfter`. RNG before/after fields are cursor integers; full tapes are in the state snapshots. All returned objects and nested arrays are detached from caller inputs and deeply frozen.

Effects are concrete ordered facts, discriminated by `type`: entry; statusApplied; actionConsumed; statusCounted; statusCleared; calmed; fireIgnited/fireRefreshed; fireCounted/fireExtinguished; turnOpened. Entries include requested/actual damage, troop and energy before/after, terrain, immunity and draw index. Status application records old/new kind and remaining, rolled base, critical bonus and draw index. Fire application records old/new complete fire records, base, bonus and draw index. No effect represents a partially committed failed command.

A validated semantic failure returns `ok:false`, reason, failedIndex (path index or null), unchanged before/after, empty effects, and unchanged RNG/revision fields. Reasons include stale-revision, out-of-phase, empty-path, unit-unavailable, missing-cell, nonadjacent, blocked, unsupported-context, unsupported-fire-damage, unsupported-lethal-damage, unsupported-status-replacement, unsupported-retreat, unsupported-calm-area, rng-exhausted, rng-bound-mismatch, revision-overflow and turn-overflow. Malformed input returns only `{ok:false,reason:'invalid-input'}`. An otherwise structurally valid initial occupied-fire snapshot returns only `{ok:false,reason:'unsupported-fire-damage'}`.

A failure on a later path entry rolls back all earlier tentative entries and draws from that same command. Successful path segmentation preserves domain state and RNG, but adds revisions and resets receipt-local entry indices. A previously committed separate command is not undone by failure of a later command.

`saveHazardState` returns `{ok:true,json}` containing canonical JSON of the complete state. `loadHazardState` validates that JSON and returns `{ok:true,state}`. Legacy training saves and implicit migrations are unsupported.

`HazardTrace` contains schema `san11-detached-hazard-trace-v1`, initial state, exact policySnapshot, successful commands, their complete receipts, and finalState. `replayHazardTrace` independently recomputes every transition and compares full receipts and final state. It returns `{ok:true,state,receipts}` or `{ok:false,reason:'replay-mismatch',failedIndex}`. A null index denotes envelope/final mismatch. Malformed input uses the input-error response above. Failed commands belong outside the successful trace; applications may retain their failure receipts separately, and repeat them against the unchanged state. This API does not authenticate a trace's origin or sign saved data.

## Evidence and explicit limits

The [source manifest](../sources/terrain-hazard-lifecycle.json) separates evidence grades:

- Plank/poison ranges, immunities and abnormal countdown ordering: local reverse-source reference evidence, with addresses documented in the existing terrain/status references
- Poison's lack of an additional energy penalty: negative-evidence-high, not a recovered zero constant
- Ordinary initial 70/30 durations and status max refresh: provisional reconstruction policy
- Critical fire duration +1: empirical-high; applying the fixed bonus to every admitted ignition source is part of this API policy
- Empty-cell-only scope, bounded tape, detached writes, scripted-event lifetime, fire max/latest-source refresh and resolution phase: explicit engineering choices

The original fire setter, base RNG, decrement/extinguish caller, visible/internal phase mapping, reignition semantics and source-specific differences remain unresolved. Local tests cannot promote fallback policy to original executable evidence. Vanilla and console equivalence are not claimed. The original43 evidence denominator is unchanged.

Unsupported: occupied-cell fire damage, entering burning cells, fire attacks and hit rolls, fire-trap chains, rockfall, low-troop automatic confusion, false-report retreat, movement costs/pathfinding/action completion, resource costs, starvation, officer changes, ownership transfer, capture, death, force extinction, native returns/finalizers, P078 and its dependencies. No replacement policy can enable these domains. This is a usable finite lifecycle, not full combat or full false-report parity.

There is no adapter from supplied-map movement flags or native fire bits. Existing movement APIs and training saves remain separate. A later adapter would need explicit conflict and scope validation.

## Tests

Run `npm run check` for type checks and all engine tests, or `node --test packages/engine/test/terrain-hazard-lifecycle.test.mjs` for this subsystem. The fixture contains literal terrain/status/fire vectors and a nine-command episode. Tests exercise preview/execute equality, command atomicity, finite tape exhaustion/bound mismatch, source-specific replacement, current-cell aura qualification, zero and maximum counters, immutable receipts, hostile data, JSON save/load, replay tampering, phase/revision boundaries and segmented paths. The two JavaScript examples above are executable consumers of the public exports.
