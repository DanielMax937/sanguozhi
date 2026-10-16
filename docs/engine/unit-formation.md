# Detached unit formation and capability panels

This API calculates a specification from complete member facts, equipment, techniques, named policies and inventory snapshots. It is a pure calculation: a successful preview neither creates a runtime unit nor debits resources or moves officers.

## Public API

Import from `packages/engine/src/index.ts`:

- `UNIT_FORMATION_REFERENCE_PROFILE`: deeply frozen, complete reference profile
- `calculateUnitCapabilities(input: unknown)`: five combined attributes, six aptitudes and attack/defense/construction panels
- `previewUnitFormation(input: unknown)`: capabilities plus inventory requirements, all shortages and a detached `UnitSpecification` when feasible
- `saveUnitFormationReceipt(result: unknown)`: verifies an entire successful result by recalculation, then returns canonical `serialized` JSON
- `replayUnitFormationReceipt(serialized: unknown)`: recomputes and compares every result field; returns `{ok:true, verified:true, result}` only when the record matches

The exported `UnitCapabilityRequest`, `UnitFormationRequest`, `UnitFormationProfile`, `UnitCapabilityCalculation`, `UnitCapabilityReceipt`, `UnitFormationReceipt`, `UnitSpecification` and result unions describe the full readonly contract. The runtime APIs validate unknown data rather than trusting TypeScript annotations.

Malformed inputs return `{ok:false, reason:'invalid-input'|'unsupported-profile'|'unsupported-schema', receipt:null}`. A valid but infeasible formation returns `ok:true`, `canForm:false`, all shortfalls, full capability calculations and `unitspec:null`. Zero requested troops is a valid infeasible preview with a `below-minimum` shortfall; it never creates a zero-troop specification.

## Complete example

Run from the repository root with Node 24. The imports below also work from the corresponding TypeScript-emitted public barrel.

```js
import assert from 'node:assert/strict';
import {
  UNIT_FORMATION_REFERENCE_PROFILE,
  calculateUnitCapabilities,
  previewUnitFormation,
  saveUnitFormationReceipt,
  replayUnitFormationReceipt,
} from './packages/engine/src/index.ts';

const attributes = { leadership:100, war:100, intelligence:60, politics:75, charisma:70 };
const context = {
  members:[{
    id:'M', basic:{...attributes}, actual:{...attributes},
    aptitude:{spear:3,halberd:3,crossbow:3,cavalry:3,siege:3,navy:3},
    commandClassId:'standard',
  }],
  attributeBasis:'actual',
  relations:{spousePairs:[],swornPairs:[],bloodPairs:[],likes:[],hates:[]},
  unitType:'battle',status:'normal',panelEquipmentId:1,techniqueIds:[3],
};
const capabilities = calculateUnitCapabilities({
  schemaVersion:1,scope:'detached-unit-capabilities',context,
  profile:UNIT_FORMATION_REFERENCE_PROFILE,
});
assert.equal(capabilities.ok,true);
assert.deepEqual(capabilities.receipt.calculation.panels,{attack:105,defense:105,construction:100});

const request = {
  schemaVersion:1,scope:'detached-unit-formation',unitId:'example',context,
  loadout:{landEquipmentId:1,navalEquipmentId:10},
  requested:{troops:5000,gold:1000,food:20000,cargo:Array(12).fill(0)},
  available:{troops:6000,gold:2000,food:30000,equipment:[0,5000,0,0,0,0,0,0,0,0,1,0]},
  profile:UNIT_FORMATION_REFERENCE_PROFILE,
};
const before = JSON.stringify(request);
const preview = previewUnitFormation(request);
assert.equal(preview.ok,true);
assert.equal(preview.canForm,true);
assert.equal(preview.receipt.unitspec.capacity.troops,10000);
assert.equal(preview.receipt.limits.troops,5000);
assert.deepEqual(preview.receipt.requiredEquipment,[0,5000,0,0,0,0,0,0,0,0,1,0]);
assert.equal(JSON.stringify(request),before);
const saved = saveUnitFormationReceipt(preview);
assert.equal(saved.ok,true);
const replayed = replayUnitFormationReceipt(saved.serialized);
assert.equal(replayed.ok,true);
assert.equal(replayed.verified,true);
assert.deepEqual(replayed.result,preview);
assert.equal(saveUnitFormationReceipt(replayed.result).serialized,saved.serialized);
```

## Inputs and identities

Every record must have exactly the declared fields. Numbers are finite integers; negative zero, fractions, coercion, missing fields and surplus final-answer fields are rejected. Resource quantities are unsigned 32-bit integers. IDs match `[A-Za-z0-9][A-Za-z0-9._:-]{0,127}`.

A context supplies one to three distinct members. Position zero is the main commander; other positions are deputies. Each member supplies all five `basic` and all five `actual` attributes (1–100), all six aptitudes (0=C, 1=B, 2=A, 3=S), and a command class present in the complete profile table. `attributeBasis` selects one attribute set consistently; the sets are never added together. No officer database, rank modifier, treasure or injury is inferred.

Relationships are complete team-local facts. Spouse, sworn and blood pairs have distinct endpoints in lexicographic order. Likes and hates are directed edges. Self-edges, outsiders and duplicates are rejected. Empty arrays mean no declared relationship. Relation categories may overlap; their priority is explicit. Technique IDs are distinct integers 0–35.

Equipment rows include every ID 0–11 exactly once, a nonempty name and attack, defense and base mobility in 1–255. Aptitude identity is fixed: sword 0 has no aptitude; IDs 1–4 use spear/halberd/crossbow/cavalry; 5–8 siege; 9–11 navy. Equipment table and command rows are preserved in the profile. The command table has unique class IDs and capacities 0–65535.

A formation specifies land equipment 0–8 and naval equipment 9–11. Its panel equipment must be one of those selections. Transport uses loadout 0/9 and explicitly chooses panel caller 0 or 9. The separate capabilities interface permits all twelve equipment IDs for either type; that mathematical domain does not prove the native transport caller uses every equipment ID.

`available` supplies detached troops, gold, food and twelve equipment inventory values. `requested` supplies troops, gold, food and twelve cargo values. Index 0 and 9 inventory/cargo are always zero because sword and basic boat are implicit. Battle cargo is all zero. Native base, force, owner and pointer fields are not accepted.

## Relationships and panels

Any single directed hate edge between any two members overrides all five combined attributes with the main commander's values. Aptitudes still take the team maximum. The receipt records every matching directed edge; no other relationship bypasses this override.

Otherwise each deputy independently uses spouse → sworn → love → blood → ordinary, with divisors 1, 1, 2, 3, 4. For leadership and war:

`candidate = main + floor(max(deputy-main,0)/divisor)`

The highest candidate or main value wins. Deputy bonuses are never added. Intelligence, politics and charisma take their direct maxima. Every aptitude takes its direct maximum. Tied source IDs are all included, sorted by UTF-16 code units; member roles retain their original order. The full receipt records differences, bonuses, candidates, selected member attributes, sources, equipment and each arithmetic stage.

Let Q be C/B/A/S = 7/10, 8/10, 9/10, 1. Sword always uses 3/5; transport basic boat also uses 3/5, while battle basic boat reads navy aptitude. Elite technique 3/7/11/15 only applies to current equipment 1/2/3/4 respectively and adds 10 to base attack and defense before scaling. It does not add to final panels, construction or base movement.

- Attack: war × adjusted base attack × Q × 1/100 × attack-type × status
- Defense: leadership × adjusted base defense × Q × 1/100 × defense-type × status
- Construction: (politics × 2/3 + 50) × defense-type × status
- Battle type multipliers: 1 and 1; transport: 2/5 and 1/3
- Confused status: 4/5; normal and false-report: 1
- Final conversion: truncate toward zero after applying a minimum of 1

Reference intermediates are reduced BigInt rational fractions, serialized as decimal numerator/positive-denominator strings. The selectable experimental `stage-grid-trunc` policy truncates each listed multiplication or addition to 1/grid, grid denominator 1–1,000,000. It retains the same final conversion and does not change relationship integer division. Neither policy claims to reproduce x87 intermediates. Panels may exceed 100; no byte wrapping or upper cap is applied. No troops, morale, target, damage or terrain multiplier is silently added. `baseMobility` copies the selected table rows; it is not a movement budget or terrain path calculation.

## Capacity, inventory and shortages

`unitspec.capacity` is intrinsic. `receipt.limits` is the current minimum of intrinsic capacity and source availability. A source with only one troop can form a one-troop specification whose future troop capacity remains 10,000. Specification resources are the selected load, not a source debit.

For battle, intrinsic troop capacity is the main commander's class only; gold is 10,000, food 50,000 and cargo zero. Quantity land equipment 1–4 requires one item per requested troop and also limits the current troop preview. Siege equipment 5–8 requires exactly one item, regardless of troop count. Naval equipment 10/11 separately requires exactly one ship; selecting a ship never erases the land requirement. Missing equipment uses the formal `exceeds-equipment-limit` shortfall reason.

For transport, intrinsic capacities are 60,000 troops, 100,000 gold and 500,000 food. They do not use the command class or cargo quantity to limit troops. Cargo is independent per equipment: `min(profile cap, source inventory)`; requested cargo is the requirement. Reference quantity caps are 100,000 per equipment and piece caps are an explicit detached policy of 100. Alternate complete profiles can replace quantity or piece caps; implicit 0/9 remains zero. Cargo never becomes the panel equipment.

No request is silently clipped. All shortages are listed in stable order: troop minimum/capacity, gold, food, then equipment 0–11. Quantity shortage may appear both in troop limits and equipment requirements. Below-minimum and over-capacity are valid previews, with a null specification and no source mutation.

## Profiles, receipts and replay

`o03-detached-reference-v1` reserves the complete published reference content. Altering any of that content under the reserved ID is rejected. New valid IDs with complete tables and `synthetic-fixture` labels are accepted without a fixture allowlist. Policy IDs are retained in the full profile; labels alone never choose hidden tables. The evidence table label is derived by comparing actual equipment rows to the documented reference, not by trusting a caller's name.

The reference command classes junior=5,000, standard=10,000 and senior=15,000 are illustrative supplied categories. The reference love direction is deputy-to-main; `either-direction` is a named replaceable alternative. Undirected family facts do not claim to recover the native relation helper. Profile content, including equipment, command, relation direction, precision and all cargo caps, is saved with every request and hashed as canonical UTF-8 JSON using SHA-256. A consumer receiving a specification must also have its complete receipt or the matching full profile fingerprint.

All successful and rejected results are deeply frozen detached values. Caller inputs remain mutable and unchanged. Node proxies, accessors, symbols, functions, cycles, sparse/extra-property arrays and non-plain objects are rejected before values are read. Objects with the ordinary or null prototype are accepted if otherwise valid. On runtimes without Node proxy detection, the contract is plain JSON only; it does not promise harmless inspection of undetectable proxies.

Inputs and records are bounded at 1 MiB of canonical UTF-8 JSON, depth 64 and 4,096 entries per individual array. A saved record is `{schemaVersion:1,kind:'o03-calculation-record',request,result}`. Object keys are sorted by UTF-16 code units. Technique and relation sets are normalized, role order and profile arrays preserved. Duplicate JSON keys, including equivalent escaped keys, are rejected. Save verifies the full result before serializing; replay validates the request and recomputes all fields, including intermediate fractions, sources, shortages, specification and fingerprint. Forged results, missing tables and unknown schemas cannot fall back to defaults. Infeasible previews also round-trip. Older training save/trace/command schemas retain their existing meanings.

## Evidence and boundary

The [source inventory](../sources/unit-formation-v1.json) distinguishes documented facts, provisional cross-platform reference behavior and new policies. [Unit panels](../rules/18-unit-panels.md) and [deputy rounding](../rules/45-deputy-rounding-exactness.md) identify the final `_ftol2` toward-zero conversion. Older unit-panel JSON/header wording that called that final conversion unresolved is superseded on that point only. [The blood-third PC boundary](../rules/68-deputy-blood-third-pc-opcode-boundary.md) still leaves the complete PC `/3` body open.

Blood `/3` is retained as PS2 empirical-exact / cross-platform-high reference behavior, not PC opcode proof. Full relationship PC branches/direction, x87 intermediate precision, clean-stock equipment bytes, native command/rank/technology mapping, transport panel caller and original piece-cargo paths remain unverified. These limitations are not hidden behind a total software-test count.

This module neither closes nor renumbers the original 43 gaps and does not certify stock/original or platform equivalence. It excludes P078 and dependencies, capture/death/extinction/ownership/return/mission/native finalization, personnel migration, real resource accounting and sortie transactions. No renamed synthetic transaction substitutes for those excluded operations.
