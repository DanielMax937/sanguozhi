# TODO — SAN11 Rules Exactness Cleanup

> Working policy: one fresh theme branch from the latest GitHub `main`
> Current theme branch: `rules-engine-pk-training`
> History: PR #2 was merged into main at `5c5611bb067c0dfe13cea1126ad69a12dade697c`
> Publication: open a new draft PR for each theme; no automatic merge
> Primary target: PC-PK1.1
> Updated: 2026-10-03 (UTC)

## 1. Current progress

### Bounded implementation: PK training kernel

- Added a main-only `pk-training-slice-v1` TypeScript kernel and short synthetic text sandbox
- Implemented Train, bounded EndTurn, preview/inspect, serializable state/evidence, save and deterministic replay
- New normalized constants preserve fixed-main provenance; open gates, scheduler and omitted presentation RNG stay explicit
- Vanilla is unsupported in this slice; XP-to-stat growth is rejected at the boundary
- Guide: `docs/engine/pk-training-slice.md`; run `npm run check` and `npm run demo`
- This is an implementation slice, not a complete game or a closure of P0-46
- Follow-on prerequisites: recover/adapter-test gate bodies, full scheduler and XP growth before extending simulation length or commands

Main audit is complete:

- A1–A5
- B1–B9
- C1–C11
- D1–D10
- E1–E20

Total: 55 main audit points.

P0 exactness cleanup has currently reached:

- P0-45 complete
- Next: P0-46

Current source of truth:

- `docs/rules/STATUS.md`
- `docs/rules/13-open-exactness.md`
- `docs/rules/16-unresolved-rules-fallbacks.md`

---

## 2. Immediate next items

### P0-46
City / harbor / gate capture:
domestic-facility destruction caller / selector xref boundary.

Targets:

- identify capture-time destruction caller;
- separate city capture from ordinary single-facility destruction;
- locate retained/destroyed facility candidate list;
- locate selector / RNG / ordering xref if public;
- determine whether city / harbor / gate share one path;
- preserve exact open state when body/xref is unavailable.

### After P0-46

Continue from the latest unresolved exactness gaps in `STATUS.md`.
Do not invent a fixed P0 endpoint.

Likely remaining families include:

- capture / takeover reset and domestic-facility selection;
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

Primary public PC-PK1.1 reverse-engineering corpus used throughout this project.

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

## 7. Working procedure for each new theme / P0 item

Before editing, verify the latest GitHub `main` commit and create a fresh theme branch from it. Read `TODO.md`, `STATUS.md`, the rule index, `13-open-exactness.md` and `16-unresolved-rules-fallbacks.md`. Do not use another unmerged PR as the baseline. Keep implementation slices separate from unresolved research closure.

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
   - the new theme PR body, including test results, evidence boundaries and any parallel-PR index conflicts.
9. Open a new draft PR for this theme. PR #2 is merged history, not the current work target.
10. Do not merge or enable auto-merge on any PR without explicit user authorization.

---

## 8. Current principle

The goal is not to make every rule look complete.

The goal is to make every rule honest about what is:

- exact;
- strongly observed;
- reconstructed;
- still unknown.

A smaller exact core is preferable to a larger invented ruleset.
