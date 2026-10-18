# Source event query v1

Status: static implementation only. No tests, build, typecheck, compiler, schema validator, checker, example execution or runtime verification was run for this batch.

Module: `packages/engine/src/source-event-query.ts`; the three functions and seven public types are re-exported by `packages/engine/src/index.ts`. See the [API index](README.md) and [complete rules](../rules/source-event-query.md).

Implementation integration base: PR87 main `021097bdb63ed882bb7b1e1d11f6bdeaf8af017b`, tree `077cb16ad83c8a3a32a6f60a26b3a00cee1b0a93`. The fixed source evidence remains pinned to PR85 `7cf050fdf57cd40641bf5f139b2c34c548aae820`, tree `c515fd47bdec5a1f8b9502da58130dad91372a09`: all five corpus Git blobs are unchanged in the integration tree. This version distinction does not establish original-game provenance or runtime compatibility.

## API

- `getSourceEventQueryProfileV1()` returns `{ok:true,profile}` with an immutable copy of the complete fixed catalog: source identities, literal thresholds, reviewed grouping, source clauses, clause hashes, binding requirements and limitations
- `listSourceEventObservationsV1()` returns `{ok:true,observations}` with an immutable list of independent observation references. It does not merge shared event IDs, names or versions
- `querySourceEventV1(input)` accepts the closed DTO in `data/schemas/source-event-query-v1.schema.json` and returns an immutable result or `{ok:false,reason,inputJSONPointer,pointerStatus}`

All three APIs can return the same small failure object. The output shape is documented in `data/schemas/source-event-query-response-v1.schema.json`. No lifecycle API is appropriate here. There is no create/execute/save/load/replay command, mutable session, RNG, clock, receipt history, effect writer or world-state import. A caller may retain the input and returned fixed profile for its own documents, but that is not a game save or replay.

Public types: `SourceEventQueryInputV1`, `SourceEventQueryResultV1`, `SourceEventQueryProfileV1`, `SourceEventQueryProfileResultV1`, `SourceEventObservationListResultV1`, `SourceEventObservationSummaryV1` and `SourceEventTruthV1`.

## Exact input

`schemaVersion:1`, `queryProfile:"source-event-query-v1"`, `observationRef`, `targetVersion`, `facts` and `bindings` are all required. No additional keys are accepted at any depth. In particular, `conditionTruth`, `eligible`, `onceOnlyResolved`, caller predicates, final outcomes or reward deltas cannot be supplied.

The reference requires an exact family, source path, Git blob SHA, SHA-256 and observation ID. A syntactically valid but unknown/mismatched reference gives a resolved-query result whose `resolution` and condition status are `unknown`; it never silently falls back by event name. Malformed DTOs are rejected.

Facts have mandatory `cities` and `persons` arrays, each of length 0–64. Every record has an ASCII ID of length 1–96. IDs must be unique across both arrays. An entity may omit primitive facts; omission means unknown, not false or zero.

- city: optional `security` integer 0–100, `gold` integer 0–9007199254740991, `current` with optional boolean `plague` and `locust`
- person: optional `cityId` ASCII ID. There is no name matching, availability inference, relationship parser or native identity assertion
- bindings: 0–3 entries with unique `symbol`, `entityKind` and `entityId`. Symbols are exactly `search-city`, `searching-person`, `yu-ji`; kind is `city` or `person`. A missing entity or mismatched kind is an unknown query context
- target version: explicit nullable `edition` (`PK`/`Vanilla`), `platform` (`PC`/`PS2`/`Wii`) and nonempty `patch` string of at most 64 characters

Non-Proxy DTOs in an unpolluted JavaScript runtime are the supported object boundary. Plain objects with Object/null prototype and ordinary dense arrays are allowed. Own accessors, hidden object fields, symbol keys, custom prototypes, extra array properties, sparse arrays, cycles, unsupported values, negative zero, nonfinite/fractional/unsafe numbers and duplicate entity IDs/binding symbols are rejected. Own getters are inspected by descriptor and never invoked. Reflection can invoke Proxy traps; this API does not claim hostile-Proxy detection or a polluted-runtime security sandbox.

Input limits: 1 MiB canonical UTF-8, 16384 visited nodes, depth 24, arrays at most 256 before the tighter semantic limits. JSON Schema documents the serialized shape only; it cannot enforce JavaScript object descriptors, Proxy exclusions, `-0` or cross-record ID uniqueness. No text parser or serialized-input API is exposed; a caller's JSON parser behavior is outside this DTO boundary.

Response limits are independent: canonical UTF-8 ≤4 MiB, ≤65536 visited values, depth ≤48. Every successful query/profile/list response is budgeted before freezing/returning. Overflow returns a fixed small `output-budget` failure with a null path. Other failure paths longer than 1024 UTF-8 bytes become null with `pointerStatus:"omitted-too-long"`; they are never silently truncated. Only fixed internal error codes are returned, not arbitrary exception text. These constructed failures remain under 8 KiB even after JSON escaping, so reporting an over-budget result does not repeat the oversized payload. The budget counts values, with the root at depth zero; it includes original observations, repeated parent/child clause views, evidence, reasons and wrappers. No response budgeting was executed in this static-only batch.

## Descriptive child-node traversal

Each `clauses[]` entry has a `nodeShape` label for source structure only. It never grants predicate eligibility. Known historical nodes traverse all/any.items, if.condition/consequence, branch.condition/orderedResults, choice.options and option.orderedResults. Fact.value's explicit accelerated-date/possible-groupings wrappers and their nested predicates receive separate pointers and unknown reasons. Branch conditions use the conditions role; nested effects use orderedResults. The old source's all/any and alternatives remain unreviewed.

Generic claims and PS2 line clauses remain their original flat records. Quantities, precise locators, prerequisite delay and ordinary effect.values remain complete payloads on their parents, not invented logical nodes. Unknown node shapes receive `source-node-shape-unrecognized`; nested structured data is browsed without interpreting its meaning. The whole original observation is also retained.

## Three distinct truths

1. `comparison.comparisonStatus`: a strict three-valued comparison of the reviewed source fragment and explicit primitive facts. It is useful even when the guide's runtime version is unknown
2. `clauses[].status`: the complete clause's status. Partial coverage or an unresolved/conflicting source/target version keeps this unknown. A local comparison never removes these reasons
3. `documentedConditionsStatus`: the whole observation's documented-condition status. The current registry certifies no complete observation grouping, so this remains unknown for every current observation

Do not present a comparison as “event eligible” or “will happen.” `boundary.executionEligibility` is always `disabled-source-corpus`; `executionEnabled` is false, event occurrence is not evaluated, effects are not executed, and repeatability is `unknown-repeatability`. `onceOnly` is shown exactly as described, never converted into a repeatable event or an invented flag.

`versionResolution` reports source/target match, unknown or conflict. None of the current sources fully resolve edition, platform and patch. A target `PC/PK/1.1` does not give an unspecified Wiki guide that provenance. Date, prerequisite, relationship and effect nodes are readable unknown even when the old descriptive data uses `eq`, `all` or `any` labels.

## Reviewed fragments

Guan Lu (`generic.atwiki88.12`, `/observations/11/conditions/2`): only the expressly city-scoped security ≥90 fragment is compared. The same clause's disaster scope is unresolved, so full clause status remains unknown. This query needs only a `search-city` binding and that city's security fact.

Yu Ji (`generic.atwiki88.15`, `/observations/14/conditions/1`): same city has plague=false, locust=false, security≥90 and gold≥2001. This one source clause explicitly supports a local `all`. The query requires distinct explicit `searching-person` and `yu-ji` person bindings, each with a cityId matching the explicit `search-city`. Missing/incoherent bindings leave comparisons unknown; they do not transfer anyone or infer a city. Binding coherence does not prove the separate “executing exploration” condition.

The complete predicate registry has two entries, five atomic comparisons and one local `all`. The other full clauses remain readable unknown. No local `any` source group has been certified. Other generic, historical and PS2 descriptions are not opportunistically parsed.

## Example, not executed

The full input in `data/scenarios/source-event-query-example-v1.json` supplies one city with security=90, gold=2001, plague=false, locust=false; two distinct same-city persons; all three bindings; and target PK/PC/1.1.

Authored expectations from reading the code, not observed outputs:

- Yu Ji's four atomic comparison statuses and local `all` should be `met`
- The clause status and whole documented condition status should still be `unknown`, because the source version and whole-event context are unresolved
- Known result clauses, including offered gold/TP quantities, should remain readable with `effects-never-executed`; there should be no gold/TP/health/flag change
- Changing gold to 2000 should make the gold comparison and local `all` `not-met`, without changing the disabled execution boundary
- Removing plague while keeping every other reviewed fact met should make plague and local `all` `unknown`
- With gold=2000 and plague omitted, local `all` should be `not-met` under three-valued conjunction
- An absent Yu Ji binding or unknown cityId should leave the local comparisons unknown and point to the missing binding/fact
- A heading-only reference with empty facts/bindings should remain unknown, never vacuously true
- A caller-added `eligible` key, negative zero, security=101 or duplicate entity ID should be rejected as malformed input

These are review examples, not tests, and have not been run.

## Provenance and trust

`docs/sources/source-event-query.json` and the fixed profile retain full original file hashes, byte lengths, commit/tree, source URLs, JSON pointers and original clause objects. Complete registered clause equality is checked before comparing it. The source-clause SHA-256 is an authored evidence identifier, not a substitute for full content comparison.

The module owns immutable detached copies of imported source data; it does not mutate the old JSON modules. The deployed repository files are trusted code/data. The module is not a file-integrity verifier and does not recompute imported files' byte hashes at runtime. Deploying a different source revision requires a new reviewed profile, rather than relabeling changed content with old hashes.

All source observations are returned independently: generic 33, historical 105, PS2 64. This is browsing scope, not 202 implemented rules. The current source comparisons do not reduce old corpus limitations or the original 43 topics/45 snapshots, and do not complete O14 or O15.
