# Supplied-map movement

`moveOnSuppliedMap` applies a selected path to a detached unit state on a caller-supplied finite map. It returns the new position, remaining movement budget, and one cost receipt per step. This is a usable synthetic movement reducer, not native SAN11 pathfinding or a native map reconstruction.

## Example

Import from `packages/engine/src/index.ts` (Node 24 supports the TypeScript source):

```ts
import { moveOnSuppliedMap, GUIDE_REFERENCE_MOVEMENT_POLICY } from './packages/engine/src/index.ts';
const result = moveOnSuppliedMap({
  version: 1,
  map: { id: 'tutorial', cells: [
    { id: 'start', terrainInfoU32: 0, flagsU32: 0, adjacent: ['forest'],
      blocked: false, occupied: false, unsupportedContext: false, facilityPresent: false },
    { id: 'forest', terrainInfoU32: 5, flagsU32: 0, adjacent: ['start'],
      blocked: false, occupied: false, unsupportedContext: false, facilityPresent: true },
  ] },
  state: { unitId: 'unit-1', cellId: 'start', budget: 20,
    landEquipmentId: 4, navalEquipmentId: 9, transport: false },
  path: ['forest'],
  policy: GUIDE_REFERENCE_MOVEMENT_POLICY,
});
// result.ok === true; result.state.cellId === 'forest'; result.state.budget === 10
```

Paths contain destinations, not the initial position. Adjacency is explicit and directed: no hex coordinate, reverse edge, or pathfinder is inferred. Repeated cells and self-steps are allowed only when the relevant edge is supplied; each visit costs movement again. A valid empty path is a no-op. The origin's blocked/occupied flags do not prevent departure, but its unsupported-context flag rejects even an empty path. Occupancy describes external entry restrictions, not a mutable occupancy ledger for this unit.

## Cost capture and replaceable policies

`projectSuppliedTerrainCost` separately accepts `profile: 'captured-terrain-al-v1'`, `terrainInfoU32`, `flagsU32`, `resolvedEquipmentId`, and a `row: { equipmentId, bytes }` with exactly 32 raw bytes. It returns terrain ID (low five bits), land/naval helper selection, table index, base byte, fire flag, and returned AL cost. Only terrain 7/8 selects naval. Fire is any set bit in `0x03800000`. AL multiplication wraps: `(byte * 4) & 255`. The equipment ID is explicit caller data (0..65535), and must match the supplied row. This supported equipment range is an API boundary, not evidence of the native equipment count.

The reducer policy is strict serializable data:

- `id`: caller-selected stable identifier; `version: 1`
- `cost: 'captured-terrain-al-v1'`
- `adjacency: 'supplied-directed-v1'`
- `helper: 'supplied-equipment-transport-comment-v1'`: land/naval IDs are supplied, except transport selects sword 0 / boat 9 from source comments. The native helper bodies have not been independently decoded here
- `hazards: 'reject-unsupported-v1'`: reject any traversed cell explicitly marked `unsupportedContext`, including the origin
- `effects: 'movement-cost-only-v1'`: explicit acknowledgement that fire/poison/plank-road damage and all nonmovement effects are not simulated
- `rows`: unique equipment IDs with exactly 32 `costs` entries, each a byte or `null`. Null means unavailable or unknown under this policy; it is not a native cost byte

The caller is responsible for declaring contextual restrictions. Fire cost alone does not authorize or simulate hazard damage; set `unsupportedContext: true` where an unsimulated contextual rule must prevent use. Facilities do not change underlying terrain cost; `facilityPresent` is retained in receipts. `blocked` and `occupied` reject destination entry. ZOC and facility ownership are not inferred.

`GUIDE_REFERENCE_MOVEMENT_POLICY` is a replaceable guide-derived reference, not a binary table dump. Equipment 0 is sword, 1..3 infantry, 4 cavalry, 5..8 siege, 9..11 ships. Unknown terrain 20..31 is null. Stream/bank/cliff and category-inapplicable cells are null. Naval movement uses the unit's naval equipment even for a land unit. Supply custom rows with a distinct policy ID when experimenting. All rows and all cells are validated even when unvisited.

## Atomicity, replay, and data safety

Results are detached and deeply frozen. Inputs are never modified. A late path rejection returns the original state with `spent: 0`, empty committed `steps`, and `failedStep`; no successful prefix is committed. The full validated request is retained for replay. An invalid input returns only `{ ok: false, reason: 'invalid-input' }`, because no trustworthy state exists to return. Budget is an unsigned 32-bit integer. Cost bytes may be zero, including wrapped fire costs.

Replay by serializing `result.request` to JSON, parsing it, and calling `moveOnSuppliedMap` again. This reproduces the full result; there is no hidden RNG, clock, external lookup, or global mutable state. Split a successful path into successive calls using the first returned state to obtain the same final state and total cost (step indices restart per request).

Only plain own-property JSON data is supported (null-prototype records are also accepted). Unknown keys, symbols, getters/setters, nonenumerable properties, inherited/custom prototypes, sparse arrays, extra array properties, cycles, undefined, negative zero, nonfinite numbers, and malformed fields reject. Accessor descriptors are rejected without calling their getters. JavaScript proxies are not a supported serialization boundary; use parsed JSON for untrusted callers. Map/unit/policy IDs are 1..128 ASCII characters, starting alphanumeric and then using letters, digits, `.`, `_`, `:`, or `-`. Map cells are unique and adjacency must reference existing cells with no duplicate edges. Paths referencing missing cells produce atomic `missing-cell` rejection.

## Evidence and limits

Source identities are in [supplied-map-movement.json](../sources/supplied-map-movement.json). The terrain arithmetic is supported by a captured mnemonic listing; this is not executable-byte/native-runtime validation. Equipment table layout is a separate structure reference. The standard values come from [the map guide](01-map.md#3-地形移动成本).

This module has no integration with ownership, force extinction, capture/return, mission finalizers, combat, personnel, commands, turn scheduling, or P078-dependent modules. It does not close the existing 43 native evidence groups. It adds a separately named supplied-map operational capability.

## Verification

Run `npm run check` for the complete repository typecheck and test suite, or `node --test packages/engine/test/supplied-map-movement.test.mjs` for this feature. The tests independently check all 256 cost bytes and terrain/mask combinations, table categories, strict validation, actual transitions, atomic rejection, replay, composition, and independent finite-map walks.
