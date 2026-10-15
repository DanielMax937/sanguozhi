# Ordinary recruitment provisional decision API

`decideOrdinaryRecruitment(input)` answers whether a supplied ordinary recruitment snapshot succeeds under three explicitly versioned software policies. It computes actual gates, probability and deterministic outcome, with an immutable complete replay receipt. It never enacts recruitment.

This is a synthetic provisional decision policy, not original PC-PK, Vanilla, PS2 or Wii certification. Original43 evidence groups remain unchanged. No personnel relocation, ownership change, costs/AP, capture, force extinction, return, mission finalizer, P078 or dependency is implemented or called. There is no commit operation, callback, game-state extension, save migration or global RNG consumption.

## Public use

Import the function, `ORDINARY_RECRUITMENT_POLICY` manifest, and `OrdinaryRecruitmentInput` / `OrdinaryRecruitmentResult` types from `packages/engine/src/index.ts`. Node 24 supports the repository's TypeScript source imports.

```ts
import { decideOrdinaryRecruitment } from './packages/engine/src/index.ts';
const result = decideOrdinaryRecruitment({
  profile: 'ordinary-recruitment-provisional-v1', scope: 'ordinary-decision-only', dateKey: 612,
  target: {id: 2, status: 'officer', forceId: 20, currentRulerId: 4,
    forceControlledCityCount: 1, loyalty: 60, giriInternal: 0, affinity: 0,
    spouse: null, swornSiblingIds: [], swornSenior: null, likesIds: [], dislikesIds: [],
    forbiddenLordId: null, forbiddenMonths: 0},
  executor: {id: 1, forceId: 10, charisma: 50, affinity: 0},
  ruler: {id: 3, forceId: 10, affinity: 0}
});
// supported:true, continuous, rate60, roll62, success:false
if (result.supported) {
  const replay = decideOrdinaryRecruitment(JSON.parse(JSON.stringify(result.observations)));
  console.assert(JSON.stringify(result) === JSON.stringify(replay));
}
```

Check `supported` before reading decision fields. Re-evaluate the receipt's `observations`, not the receipt itself. Inputs are caller-supplied facts, not certification of a complete original world graph.

## Input schema

Every field below is required. Objects are closed; additional fields and legacy aliases are rejected. All numeric values are integers. Person and force IDs are synthetic IDs in 0..65535, not native ID-table mappings.

Root:
- `profile`: exactly `ordinary-recruitment-provisional-v1`
- `scope`: exactly `ordinary-decision-only`
- `dateKey`: 0..2147483647, supplied stable decision/order key, never the current clock automatically
- `target`: the target record below
- `executor`: `{id, forceId, charisma, affinity}`; nonnull force ID, charisma 0..100, affinity 0..149
- `ruler`: `{id, forceId, affinity}`; nonnull force ID, affinity 0..149

Target:
- `id`: person ID
- `status`: `officer` or `wild`
- `forceId`, `currentRulerId`: ID or null
- `forceControlledCityCount`: 0..42
- `loyalty`: 0..255, including for wild targets
- `giriInternal`: 0..4, the explicit policy interpretation of internal codes
- `affinity`: 0..149
- `spouse`: null or `{personId, forceId}` with nullable force ID
- `swornSiblingIds`: dense unique array of at most two person IDs
- `swornSenior`: null or `{personId, forceId}` with nullable force ID
- `likesIds`, `dislikesIds`: dense unique arrays of at most five person IDs each
- `forbiddenLordId`: person ID or null
- `forbiddenMonths`: 0..255

These finite domains, relation counts and status representations are software policy choices. They do not narrow the separate existing raw-u8 affinity API.

### Consistency and strict data validation

Executor and ruler must share a force. Target differs from both. Executor may equal ruler only with matching affinity; the shared identity satisfies G9 through one like membership.

An officer requires a different nonnull force and nonnull current ruler; that current ruler differs from target, executor and requesting ruler. A wild target requires null force/current ruler and zero cities. No former-force or force-extinction inference is performed.

Spouse and all like/dislike/sworn-sibling entries cannot equal target. Likes and dislikes may overlap; gate order decides their effect. Nonempty siblings require an explicit senior who is target or one of those siblings; empty siblings require null senior. Senior equal to target must have target's force. Every supplied repeated person identity must have consistent force wherever force is supplied or implied, including current ruler's target force. Null means known unaffiliated, not missing evidence.

Zero forbidden months requires null forbidden lord. Positive months requires a nonnull lord and always returns `unsupported-service-prohibition`, regardless of recipient or potential forced success. All other fields are validated before this unsupported result or any gate.

Only ordinary plain records or null-prototype records and ordinary dense arrays are accepted. Properties must be own enumerable data properties. Symbols, accessors, custom prototypes, inherited required fields, functions, cycles, sparse arrays, extra array properties, coercion, NaN, infinity, fractions and out-of-domain numbers are rejected. Getters are not invoked. Negative zero is canonicalized to positive zero. Proxies are outside the plain-data contract; structural inspection failures are rejected without promising proxy detection.

## Ordered gates

Policy `empirical-nine-gates-internal-giri-v1`. First match wins; later predicates and arithmetic are not evaluated.

1. G1 failure: spouse has a nonnull force different from requesting force, and target's force has at least one city
2. G2 success: spouse is executor or requesting ruler
3. G3 failure: target dislikes executor or requesting ruler
4. G4 success: executor or requesting ruler is one of target's sworn siblings
5. G5 failure: raw target loyalty + internal giri >96
6. G6 success: explicit sworn senior belongs to requesting force
7. G7 success: spouse belongs to requesting force
8. G8 failure: target likes their nonnull current ruler
9. G9 success: target likes both executor and requesting ruler

The ordered relationship table is empirical-high, not a recovered native hard-gate body. G1 deliberately interprets “third-party force” as any non-requesting force, including target's incumbent force. Internal giri0..4 and raw wild loyalty in G5 are explicit policy mappings, not new native findings. Senior is supplied, never guessed from ID, age or array order. Likes/dislikes are target-directed.

## Exact-rational fallback rate

Policy `documented-hiring-fallback-rational-v1` applies only when all nine gates miss:

```text
effectiveLoyalty = target.forceId != null ? target.loyalty : 60
R = min(60, max(0, 96 - effectiveLoyalty - giriInternal))
D = min(abs(target.affinity - ruler.affinity), 150 - abs(...))
C = executor.charisma
numerator = R * (150-D) * (150+C)
rate = min(95, floor(numerator / 18000))
```

This evaluates the documented provisional real-valued fallback with exact integer numerator and rational flooring. Numerator is at most 2,250,000. It is not native x87 rounding or a claim about incidental JavaScript float-expression order. DateKey remains in complete input context but this rate policy ignores it. There is no nonzero-mode giri0.9/0.7 multiplier, political attribute, service-year coefficient or random draw. Wild baseline60 applies only to rate, not G5 or hash. This older fallback is unrelated to the rejected modern SIRE new-loyalty formula.

Hand-checkable affiliated `(loyalty,giri,D,C) → rate` examples:
- `(60,0,0,50) → 60`; `(60,0,0,100) → 75`; `(60,4,0,100) → 66`
- `(90,0,0,50) → 10`; `(90,0,75,50) → 5`; `(96,0,0,50) → 0`
- `(0,0,0,100) → 95` after cap; `(0,0,75,100) → 62` from 62.5
- `(60,2,0,80) → 65`; `(46,0,0,0) → 62`

## New deterministic replacement roll

Policy `fnv1a32-seven-u32le-mod100-v1` is a newly specified replacement, not the recovered `005BA4C0` algorithm.

```text
words = [dateKey, target.id, executor.id, target.loyalty,
         executor.charisma, executorTargetDistance, 0]
h = 2166136261
for every word, encode exactly four unsigned little-endian bytes:
    for every byte b: h = low32((h XOR b) * 16777619)
roll = h % 100
success = roll < rate
```

The full stream has 28 bytes, including all leading zeros and seventh zero word. Executor-target distance uses the same 150-circle formula, independently of ruler-target rate distance. The implementation uses integer low32 multiplication, never floating multiplication. Roll is 0..99. FNV constants, byte encoding, modulo bias and range are software policy only. This is not cryptographic and does not promise exact rate% over finite dates. Changes can collide and charisma can change both rate and roll; pointwise success monotonicity is not promised.

Literal examples:
- Words `[612,2,1,60,50,0,0]` → hash2048297862 → roll62
- Words `[613,2,1,60,50,0,0]` → hash1923934667 → roll67
- Words `[612,2,1,60,100,0,0]` → hash3665223984 → roll84

With affiliated loyalty46, giri0, charisma0, target2/executor1/ruler3, all affinities0 and no relations, rate is62:
- date19 → hash3254478763 → roll63 → failure
- date22 → hash1763120062 → roll62 → failure
- date121 → hash3936307361 → roll61 → success

## Result and replay

Rejected input returns exactly `{supported:false, reason}` with no success field. Reasons are `invalid-input`, `unexpected-field`, `unsupported-profile`, `unsupported-scope`, `out-of-domain`, `inconsistent-snapshot`, and `unsupported-service-prohibition`.

Supported receipts contain `supported`, `profile`, `scope`, `policyIds`, canonical detached complete `observations`, `path`, `reason`, `success`, `gateTrace`, `rateDetails`, `rollDetails`, and `evidence`.

- Forced paths are `forced-success` or `forced-failure`, reason G1..G9, and null rate/roll details
- Continuous path reasons are `roll-below-rate` or `roll-not-below-rate`
- Gate trace is ordered `{id, matched}` entries through first hit or all nine misses
- Rate details expose effective loyalty, loyalty-room numerator, ruler distance, charisma, numerator, denominator18000 and rate
- Roll details expose all seven words, unsigned hash and roll

The result type discriminates unsupported, forced and continuous paths. All results and the exported manifest are recursively frozen detached JSON data. Relation sets are numerically sorted; object field construction is canonical. Caller mutation cannot change a receipt. JSON-roundtripped observations reproduce the complete receipt. There are no bigint values or methods in output.

Evidence separates source-backed outer shape, empirical order, new gate interpretations, rational fallback and synthetic hash. `stockOriginalVerified`, `originalExecutableExecuted`, `nativePersonnelMutation` and `original43Closed` are all false.

## Sources and remaining uncertainty

The pinned [evidence manifest](../sources/ordinary-recruitment-policy.json) records source hashes and policy interpretations. Relevant repository audits are [personnel §§5.2–5.6](03-personnel.md), [fallback §2](16-unresolved-rules-fallbacks.md), [hiring exactness](36-hiring-probability-exactness.md), [rate signature](../sources/hiring-success-rate-signature-boundary.json), and [generator boundary](../sources/hiring-deterministic-generator-boundary.json).

The native outer shape establishes gates before probability, ordinary mode0, dateKey context and strict comparison. It does not establish these replacement predicates, formula or hash. The older source-only fallback restriction remains a native-fidelity boundary; this API instead openly names a whole synthetic policy. `005C4F80` receives target/executor/mode/dateKey; the seven scalar words belong to `005BA4C0`. Native nominal outer clamp<=100 is documented, but full internal output range is not recovered.

Public source references:
- [311MemoryResearch ordinary recruitment listing](https://github.com/sjn4048/311MemoryResearch/blob/master/内存资料/整理/Func-人才01-计算登用是否成功.txt)
- [SIRE address reference](https://github.com/sean2077/311SireCustomizedPackageDev/blob/dev/material/内存地址汇总.md)
- [Empirical ordered gate reference](https://w.atwiki.jp/sangokushi11/pages/1886.html)
- [Relationship context](https://w.atwiki.jp/sangokushi11/pages/95.html)

Unrecovered `004AF7D0`, `005C4F80`, `005BA410`, `005BA4C0`, native encoding/rounding, stock build bytes and cross-version equivalence remain open. Nonzero-mode recruitment, ruler targets, exploration/debate, hidden refusal timers and all personnel/state transitions remain outside this API.
