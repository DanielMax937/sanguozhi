# Unified mobile world: optional income owner

Status: inferred synthetic integration; not a native map, historical scenario, or complete campaign. Existing v3 saves without `incomeConfig` retain their exact root shape and behavior. Base: `a52cb127ce0572511283750a7c671ce4e75bbb52`.

## One owner, explicit new-game capability

`createInferredMobileResourceWorld` and its bounded private timeline accept optional `incomeConfig` after `foodConfig`. This is immutable genesis data, never a current balance import or an old-save migration. Exact shape:

- `profile: 'unified-income-owner-v1'`.
- `economicFacilities`: distinct synthetic `{id,kind,level,complete}` facts. Kinds are market, farm, mint, granary, large-market, fish-market, black-market, military-farm; actual kind/level combinations must exist in the existing finance catalog. These are explicit initial facts, with no construction/upgrade command added here.
- `layout`: exactly 30 slots, each null or `{facilityId,position:{q,r}}`. Each declared economic facility and every existing bounded forge/stable appears exactly once, with distinct positions. Layout/placement is a named supplied-layout inference, not recovered native coordinates.
- `excludedBoundFacilityIds`: exactly the existing barracks/workshop IDs, since the finance catalog has no such kinds. They are explicitly excluded, not renamed as forge. No existing forge/stable may be omitted.
- `parameters`: the exact `synthetic-income-only-leaves-v1` configuration documented in `synthetic-safe-income-leaves-v1.md`: base words, difficulty/controller, income-skill flags and fixed harvest inputs.

Economic IDs cannot collide with city, force, corps, episode, officers, bounded facilities, field cells/map, items, transports or the bound ruler. They own no duplicate gold, food, capacity or resource account. Existing forge/stable facts are referenced by ID; the effective private forge completion overlay supplies their CURRENT completion state each tick. The new fixed economic facts remain single immutable facts; no parallel mutable facility snapshot is accepted.

All 30 slots are required, including explicit nulls. Initial probe validates the helper's full catalog/numeric domain without crediting income. Harvest inputs must cover every month-start from genesis through the admitted city advance horizon, including genesis if applicable; missing future facts reject creation rather than strand an admitted production job. Duplicate harvest rows are rejected by the helper. City troops must stay in the helper's positive, at-most-150000 domain; later commands exceeding that domain reject atomically, not clamp.

## Actual dispatch and atomic order

Every successful outer WorldTick performs exactly one private income proposal using the new current turn/date and current city gold, food, security, troops and facility view:

1. Existing city clock/AP and production completion.
2. Optional forge work/completion and ordinary rewards.
3. Optional income-only money/food leaves.
4. Existing monthly salary and natural loyalty bridge, once.
5. Optional neutral city/transport food consumption, once.
6. Field tick and the outer travel tick.

The cross-service ordering above is an explicit compatibility inference; it is not asserted to be the native caller order. In particular newly completed forge facts can be read by income on that tick, income can fund that tick's wage payment, and food consumption follows credits. The helper uses the actual existing money phase, food projection and monthly-food base calculation; it does not invoke whole finance/season, salary, health, or AP writers.

Both `goldBefore` and `foodBefore` must equal the unique current ledger before applying the finite after-values. The ledger is used immediately by subsequent wage/merchant/production actions. The income receipt records phases, requested/accepted capped credits and underlying evidence; there is no second spendable income balance. Formula details and evidence versus inference are in the helper rule document.

Any invalid phase, wage/natural zero-loyalty exclusion, capacity/domain failure, field/travel failure or output-budget failure rejects the entire outer command. No mutated partial state escapes. All prior active jobs, reservations, fees, remaining turns, snapshots and receipt history remain intact; no genesis rebase or legacy-load bypass is used.

## Replay and boundaries

Only full genesis plus typed commands is saved. Income is not an independently callable world command; replay deterministically recomputes the income proposal at each accepted WorldTick, with ordinary duplicate/stale command rejection. No extra turn is advanced by this helper. Root/derived-result JSON budgets and outstanding-completion-slot reservation remain enforced. The actual runtime is unverified: this batch was statically inspected only, with no tests, build, typecheck or candidate execution.

This batch does not add native map evidence, original scenario facts, field food supply, economic construction/upgrade, health/season dispatch, real-person ownership or casualties, zero-troop finalizers, P078, or Closing. Skill flags, base words, harvest interpretation and the supplied 30-slot initial layout are explicit inputs; they are not asserted to have been discovered from the original map.
