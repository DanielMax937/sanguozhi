# TODO — SAN11 Rules Exactness Cleanup

> Branch: `rules-audit-capture-selector-p0-46`
> PR: new follow-up PR from current main; #2 is merged history
> Base main: `5c5611bb067c0dfe13cea1126ad69a12dade697c`
> Primary target: PC-PK1.1
> Updated: 2026-10-03 UTC

## 1. Current progress

Main audit is complete:

- A1–A5
- B1–B9
- C1–C11
- D1–D10
- E1–E20

Total: 55 main audit points.

P0 exactness cleanup has currently reached:

- P0-46 audit complete: source-bound capture caller/selector recovered
- Stock PC-PK1.1 equivalence, full capture finalizer and cross-version validation remain open

Current source of truth:

- `docs/rules/STATUS.md`
- `docs/rules/13-open-exactness.md`
- `docs/rules/16-unresolved-rules-fallbacks.md`

---

## 2. Immediate next items

### P0-46 completed audit: source-bound capture selector

Current record: `docs/rules/81-capture-selector-source-profile.md` and
`docs/sources/capture-selector-source-profile.json`.

- Recovered `004B2CA0` containing body, three direct callers, city-only
  domestic branch, ordered candidate construction, count, RNG and destruction
- `004B329B` is an interior resource block, not an independent selector
- Source IDB records an input under `血色5.0公测`; opcode-exact claims are
  restricted to its fingerprint. Stock PC-PK1.1 remains unverified
- Reference planner and replay checks exist in `scripts/capture_selector_profile.py`
  and `scripts/check_capture_selector_profile.py`; they accept prequalified
  ordered candidates and do not implement the full capture transaction
- PK reuse is `compatibility-reconstruction`; Vanilla reuse is a separate
  `compatibility-assumption`. PS2/Wii are separate open targets

### Immediate next research

- Obtain an independently verified clean PC-PK1.1 build/hash and compare the
  recovered bytes, without treating a MOD-associated input path as stock proof
- Finish caller argument/cause coverage and capture finalizer side effects;
  the newly found late durability floor is not a full pre-to-post capture formula
- Validate source RNG initialization/global consumption and capture savegame cases
- Keep Vanilla patch-specific candidate/selector behavior separately open

### Independent baseline validation debt

`python scripts/check_techniques.py` fails on current main at line 55 with a
literal `\n` in source causing `SyntaxError`. Baseline: 62 of 63 `check_*.py`
scripts pass. This pre-existing technique issue is outside P0-46 and remains
unfixed; track it separately rather than hiding it behind the new selector test.

### After P0-46

Continue from the latest unresolved exactness gaps in `STATUS.md`.
Do not invent a fixed P0 endpoint.

Likely remaining families include:

- clean-build capture equivalence, complete takeover reset/finalizer, and versioned domestic-facility selection;
- hiring inner probability body;
- diplomacy per-build constants;
- siege durability inner helper bodies;
- fire lifetime setter / RNG / reignition;
- natural death / marked-for-death exact RNG;
- reward / salary-shortfall / rumor inner formulas;
- captive forced-release comparator/finalizer details;
- auto-office scheduler / remaining classifier and qualification bodies;
- sortie / transport commit and return finalizers;
- deputy blood/spouse/sworn remaining PC opcodes;
- training reset caller / top scheduler;
- starvation field-troop handler and formula;
- supply / transport finalizer and morale non-divisible rounding;
- technique research full calculator / difficulty matrix;
- technique-research completion merit writer / participant distribution;
- food-raid helper body / RNG / clamps;
- response-fire caller / recursion termination;
- Vanilla / PS2 / Wii / patch-version equivalence for all above.

---

## 3. Reverse-engineering / disassembly repositories we depend on

### 3.1 sjn4048/311MemoryResearch

Repository:

`https://github.com/sjn4048/311MemoryResearch`

Role:

Primary public PK-oriented reverse-engineering corpus used throughout this project.
Each executable/IDB artifact still needs its own provenance check; P0-46 found
a MOD-directory input path in the archived IDB, so its new byte claims are
source-profile exact, not verified stock PC-PK1.1.

High-value material includes:

- `内存资料/地址资料.txt`
- `内存资料/修改记录by sjn4048.txt`
- `内存资料/整理/*.txt`
- `内存资料/AI专题/*.txt`
- `内存资料/函数[部队攻击].txt`
- `内存资料/函数[破坏内政设施和破城获取资源].txt`
- `内存资料/函数[火陷阱炸伤炸死].txt`

Used for:

- battle / siege caller bodies;
- food raid;
- fire damage;
- training;
- recruitment;
- monthly / seasonal schedulers;
- AI sortie logic;
- capture-resource retention;
- loyalty / captive handling;
- technique addresses;
- many exact constants and opcodes.

Evidence level:

- strongest when a full instruction listing is present;
- address-only entries remain address-level evidence;
- comments are not automatically treated as exact unless verified by instructions.

---

### 3.2 sean2077/311SireCustomizedPackageDev

Repository:

`https://github.com/sean2077/311SireCustomizedPackageDev`

Role:

SIRE reverse-documentation / structure / function-address reference.

High-value material includes:

- `material/内存地址汇总.md`
- `material/结构体汇总.md`
- `material/数据汇总.md`

Used for:

- function names and signatures;
- object / struct layouts;
- offsets for force / troop / facility / scenario;
- setter / getter identification;
- skill / technique IDs;
- cross-checking address semantics;
- reverse-history comments from SIRE development.

Important rule:

SIRE configurable / community-patched behavior must not be backfilled as original SAN11 behavior unless separately proven.

Modern SIRE / mod formulas must be tagged as:

`SIRE-modern-mod-system`

when they are not original executable behavior.

---

### 3.3 fudanglp/311resource

Repository:

`https://github.com/fudanglp/311resource`

Role:

IDA-derived resource dump and function-boundary source.

High-value material includes:

- `extractor/ida/data/python_idb/san11pk_dump.exe_functions.csv`
- `extractor/ida/data/python_idb/san11pk_dump.exe_struct_members.csv`
- `extractor/ida/data/resource_hints/*.csv`
- `extractor/ida/data/resource_hints/*.json`

Used for:

- exact function start addresses;
- next-function boundaries;
- recovered symbol names;
- struct member names / offsets;
- locating containing functions for known interior addresses.

Typical use:

`address X`
→ find previous function start
→ find next function start
→ establish exact containing-function boundary.

Important rule:

Function size / location alone must never be used to invent body semantics.

---

## 4. Secondary implementation / reconstruction references

### 4.1 tankyc/sango_infinity

Repository:

`https://github.com/tankyc/sango_infinity`

Role:

Modern open-source SAN11-like reconstruction used only as an engineering comparison / compatibility fallback source.

Used for examples such as:

- fire lifetime weighted choices;
- fire spread extension architecture;
- food-raid 10..20 compatibility RNG;
- resource transaction organization;
- some reconstructed battle formulas.

Evidence label:

`compatibility-reconstruction`

or

`engineering-reference`

Never:

`reverse-engineered-original`

unless independently verified against original executable evidence.

---

## 5. Supporting external source classes

These are not code repositories, but are regularly used for cross-checking:

### Official / manual

- KOEI / Steam SAN11 and PK manuals
- official patch / version changelogs

Use for:

- user-visible rules;
- version boundaries;
- Vanilla vs PK feature additions;
- patch chronology.

### Japanese Wiki

`https://w.atwiki.jp/sangokushi11/`

Use for:

- controlled empirical tests;
- battle / technique behavior;
- support attack / response-fire interactions;
- capture / facility-retention observations;
- difficulty-specific tests.

Evidence labels:

- `empirical-high`
- `documented-community`

Never silently upgrade to opcode-exact.

### Gamersky / Ali213 / old Chinese guides

Used for:

- early-version documentation;
- 2006-era Vanilla behavior;
- numeric examples;
- version-history cross-checks.

Important:

Old guide values may conflict with later Wiki values; preserve the conflict rather than forcing one table.

---

## 6. Evidence policy

Every rule should be classified as one of:

- `reverse-engineered / opcode-exact`
- `reverse-engineered / address-level`
- `empirical-high`
- `documented-guide`
- `compatibility-reconstruction`
- `provisional-engine-rule`
- `open`

Do not invent formulas.

Do not infer a caller from neighboring addresses.

Do not infer semantics from function size.

Do not infer original behavior from SIRE/community fixes.

Do not infer uniform RNG just because the player cannot choose the outcome.

Do not merge platform/version behavior without evidence.

---

## 7. Working procedure for each new P0 item

1. Read live `docs/rules/STATUS.md`.
2. Read the existing related rule/evidence files.
3. Search:
   - `311MemoryResearch`
   - `311SireCustomizedPackageDev`
   - `311resource`
4. Use function-table boundaries when only an interior address is known.
5. Separate:
   - caller;
   - helper;
   - finalizer;
   - UI/draft;
   - runtime mutation;
   - return/reset path.
6. Preserve unresolved behavior explicitly.
7. Add:
   - one Markdown audit file;
   - one structured JSON evidence file;
   - one validation script.
8. Update:
   - `docs/rules/STATUS.md`
   - `docs/rules/README.md`
   - the new follow-up PR body.
9. Start new work from current main in a new branch. PR #2 and its old branch
   are historical; do not resume or push to them.
10. Do not merge the new PR unless explicitly requested.

---

## 8. Current principle

The goal is not to make every rule look complete.

The goal is to make every rule honest about what is:

- exact;
- strongly observed;
- reconstructed;
- still unknown.

A smaller exact core is preferable to a larger invented ruleset.
