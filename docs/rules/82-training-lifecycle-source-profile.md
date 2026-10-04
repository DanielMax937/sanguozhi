# P0-47 / PK training lifecycle: source-bound static evidence

Research date: 2026-10-04 UTC. Read-only research for the implementation based on `DanielMax937/sanguozhi` main `56f1aa4ad9cf2bff5612b1777e16dc54be0cdefb`. No original EXE was run, no remote repository was modified, and no user computer was used.

## Actionable conclusions

1. **Do not permit full-morale training.** The recovered training gate explicitly rejects current morale >= maximum. Ordinary training cannot be a limitless XP generator in a sandbox with no morale expenditure. Use a near-threshold initial fixture to demonstrate growth, not invented training permission or invented automatic morale decay.
2. **Attribute XP is cumulative, bounded at 3000 in the sjn source.** It is not a 0..99 remainder that is subtracted from storage whenever a stat grows. A derived getter adds floor(totalXP/100) to the age-adjusted talent, then clamps the ordinary result to 1..100.
3. **XP may accumulate while visible ability is already 100.** Neither the XP writer nor training caller rejects at visible-stat cap; at cumulative 3000 the actual XP award clips to zero, while training's other rewards still occur if the training itself is eligible.
4. **Ordinary XP and PK ability research share that same cumulative XP field.** Do not invent a separate research allowance plus a separate +30 ordinary allowance.
5. **The reset xref is now recovered for this source.** Its global building/person loops are broader than a single-corps engine adapter. The reset is not a call to the training setter with argument zero: it uses direct whole-word clears through two noncontiguous function tails.
6. **No clean stock binary was verified.** A second prioritized IDB is explicitly another MOD dump and demonstrably changes XP caps, stat caps, AP helpers, and action-setting routing. Agreement of isolated functions cannot certify the game version.

## Source identities and evidence grading

### S1: primary static source used for the numerical reconstruction

- Repository [sjn4048/311MemoryResearch](https://github.com/sjn4048/311MemoryResearch/tree/66e167e40c3440929ec016f3872aefc3486434c1)
- Commit `66e167e40c3440929ec016f3872aefc3486434c1`
- [Archive `IDA Related/san11pk.zip`](https://github.com/sjn4048/311MemoryResearch/blob/66e167e40c3440929ec016f3872aefc3486434c1/IDA%20Related/san11pk.zip), member `san11pk.idb`
- Archive SHA256 `47beee4ac990869694a5e6f7577947cd6b34a41aefe60bace3af3350c682ce5a`
- IDB SHA256 `c591cb40ce6d6be9246148002532dedc042463f36cd39c5ed300b7c449feefab`
- IDB input metadata: `D:\Games\三国志11\血色5.0公测\san11pk.exe`
- Recorded input EXE SHA256 `30d33b44876b84a8e87570873a86de88c65d2491c7e1cdeeb5883dc4b12feefb`
- Recorded input MD5 `5183312eb33a7556fb5d8de8ca2fae91`
- Grade: `idb-stored-byte-exact / mod-associated-stock-unverified`. Reuse for stock-target engine: `compatibility-reconstruction`, corroborated by published address notes and behavioral material. IDB metadata does not prove that stored bytes equal an unmodified input EXE.

### S2: independent archive inspected, deliberately not mixed into S1 rules

- Repository [sean2077/311SireCustomizedPackageDev](https://github.com/sean2077/311SireCustomizedPackageDev/tree/43afe4efe273cf3b6ab7833b9b6f5822bd331fd4)
- Commit `43afe4efe273cf3b6ab7833b9b6f5822bd331fd4`
- [Archive `ida-db/san11pk_dump.exe.idb.7z`](https://github.com/sean2077/311SireCustomizedPackageDev/blob/43afe4efe273cf3b6ab7833b9b6f5822bd331fd4/ida-db/san11pk_dump.exe.idb.7z)
- Archive SHA256 `fcf31f2b0aa34bb623e0cb8c91bf5f67154b742b9bc004a415228b0ad7483e4c`
- IDB SHA256 `aa7f2c983b266633d6e23c494d4f8e1b03e5251632505cae103e176ae850dfd8`
- IDB input metadata: `C:\Games\san11\血色衣冠6.0sp5(整合包240612)\San11Pk\san11pk_dump.exe`
- Recorded input EXE SHA256 `b1e9467e9612c23af83f6feda8414bc9ee99eb62c6862a84f7f4c5a8822b9da9`
- Recorded input MD5 `b7f219b9c22aee7fa4597c4b8600aa76`

The two IDBs have byte-identical `005C4100`, `005B8320`, `005B80F0`, `004AD080`, and some simple getters/setters. However, S2 sets XP cap immediates at `004A7155/715C` and `0048A83A/83F` to **0**, changes the growth cap from 100 to **120**, changes the special-person range, rewrites `005C4080`, patches the training AP path, and reroutes `004A5600` into an added address. These are concrete negative evidence against using an anonymous `san11pk` filename as stock provenance. `source_comparison.json` records lengths, hashes, and every differing overlapping byte for the comparison set.

### Supporting source scope

- [Published training caller](https://github.com/sjn4048/311MemoryResearch/blob/66e167e40c3440929ec016f3872aefc3486434c1/内存资料/整理/Func-内政04-执行训练.txt)
- [Published original-limit address notes](https://github.com/sjn4048/311MemoryResearch/blob/66e167e40c3440929ec016f3872aefc3486434c1/内存资料/地址资料.txt): explicitly says original XP limit 3000; research qualification limit 2000; growth ability cap 100
- [Published information getter](https://github.com/sjn4048/311MemoryResearch/blob/66e167e40c3440929ec016f3872aefc3486434c1/内存资料/整理/Func-情报03-获取武将信息【未】.txt#L499-L517): cumulative XP display modulo 100, except cap display 100
- [SIRE address definitions](https://github.com/sean2077/311SireCustomizedPackageDev/blob/43afe4efe273cf3b6ab7833b9b6f5822bd331fd4/material/内存地址汇总.md) and [structures](https://github.com/sean2077/311SireCustomizedPackageDev/blob/43afe4efe273cf3b6ab7833b9b6f5822bd331fd4/material/结构体汇总.md): useful semantic labels, not proof every associated IDB opcode is stock
- [fudanglp/311resource function export](https://github.com/fudanglp/311resource/blob/16efa1241dc8637dd33446abb4a9732a37f0a2b9/extractor/ida/data/python_idb/san11pk_dump.exe_functions.csv): starts/names only; not xrefs, function bodies, or an independent stock executable. This repository excludes game assets/binaries from version control.
- [Official Steam-distributed Japanese manual](https://cdn.akamai.steamstatic.com/steam/apps/628070/manuals/32sangokushi11wpk_manual.pdf): local previously retrieved copy states training once per turn, maximum 3 officers, ordinary AP20, and rewards WAR/merit/TP. The current web tool could not reopen the PDF; the local copy was read. This Japanese manual is behavioral documentation, not Chinese PC-PK1.1 byte certification.

## 1. Training qualification and parameter validation

### Gate `005C4100..005C4219` (end-exclusive `005C421A`)

The IDB body is 282 bytes. The older function-list boundary of `..421F` includes padding before the next function, not six more decoded instructions.

- `005C410E..412B`: get owner-force ID via building virtual `+0x40`, obtain force pointer, reject invalid pointer.
- `005C4131..414C`: call common gate `005B85F0(commandID=6, sp, GetTrainingActionPointCost(sp), goldCost=0, minimumQualifyingOfficers=1)`; nonzero result rejects.
- `005B8641..866F` checks valid corps and AP byte at corps `+0x2C` >= AP cost.
- `005B8677..8683` checks `GetSPMoney` >= gold cost, which training passed as zero.
- `005B8714..8720` builds/counts qualified people at the target and requires at least one.
- `005C4158` calls `0049CE60`, then rejects if nonzero. **Despite the material label `SetTrainingStatusForSP`, the actual instructions are a getter**: city -> `0047B440` reads bit4 of city+0xA4; port/gate -> reads dword+0x68.
- `005C4179` gets SP troop strength through virtual `+0x50`; zero rejects.
- `005C4197` obtains morale limit (`00487010`); `005C41A2` gets current morale through virtual `+0x54`; `cmp eax,edi` and `jl 005C41E1` mean only current<cap can reach success. Current>=cap rejects, regardless of whether notification code runs.
- `005B8180` branches choose feedback presentation; they do **not** bypass a failed gate. All failed branches end at `005C41D7 xor eax,eax`.

### Parameter helper `005B8320..005B837D`

- `ecx` points at `{sp, officerPtr0, officerPtr1, officerPtr2}`.
- SP pointer must be legal; `00486680` must return a nonnegative SP ID rather than -1.
- Iterate exactly three slots; null slots skipped; every nonnull slot passes `005B80F0`; require nonnull count>0.
- There is no duplicate-pointer comparison, explicit same-force comparison, or selected-officer same-SP comparison in this helper body. Those stronger engine rules are valid defensive domain contracts but cannot be attributed to this helper alone.

### Officer helper `005B80F0..005B8139`

- Legal pointer
- Identity matched against bitmask0x0F through `00489FE0→00488B30`; the table maps identities0..3 to bits1,2,4,8
- `004891C0` (actual in-troop membership) must be false
- `00489120` acted must be false
- `person+0x158` mission duration must be zero

The SP candidate count additionally builds a list for target location (`004CF8A0→004CF2F0` with status mask0x0F), and filters through `004CEF50`: not acted, mission duration zero, and `004896C0`. The latter compares service/location and checks mission state through `005BA320`; a complete interpretation of every mission state remains out of scope. Same-base/same-force engine checks should remain explicit safety/domain conditions.

## 2. Training rewards, XP, caps, and potential

### Caller order

`005C4220` calls the SP gate before `005B8320`. After those and legal force/ruler checks, training gain is calculated and applied. For each of the 3 nonnull valid slots:

- `005C4365..4371`: `IncreasePersonAttrExperience(person, attr=1/WAR, gain=2, update=1)`
- `005C4376..437E`: merit+50
- `005C4383..438B`: acted=1 via `004A5600→00489B40`
- Later TP is floor(actual morale gain/2)+5; SP trained flag is set by `005C43C5→004AD080`; AP is deducted

XP at cap does not short-circuit the remaining awards. Normal eligible training has positive morale gain because the gate prevents full morale. Calling the effect helper in isolation to obtain actualGain0/TP5 is not proof that the command can legally run at full morale.

### Cumulative storage

`00489180` reads unsigned-use word `person+0x12A+2*attrID`.

`004A70D0` reads old XP (zero-extends AX), adds requested gain at `004A7143`, optionally doubles that **award** at `004A7151`, clamps sum to 3000 at `004A7153..715F`, and sends the cumulative value to `0048A810`. Its return path at `004A7237..7246` is new stored XP minus old stored XP. No subtraction of 100 occurs.

`0048A810` validates attrID0..4, handles zero, compares AX against3000, and writes a word to the same field. This reconstruction is restricted to sane nonnegative cumulative values0..3000; its raw 16-bit input behavior is not a generic signed clamp API.

### Growth getter and ordinary cap

`0048A390`:

1. Read talent byte at `person+0xC8+attrID`
2. Person IDs700..799 jump over both age scaling and XP addition (source-specific special-person range)
3. Normal person: call `0048A030` for coefficient; if enabled, `floor(talent*coefficient/100)` via multiply-high `0x51EB851F`, sar5 and sign correction
4. Read cumulative XP word and add floor(XP/100) via the same division arithmetic
5. Clamp result to1..100 (`0048A427..0048A44C`)

For an ordinary no-age-modifier engine profile:

`war = max(1,min(100,warBase+floor(warXp/100)))`, with `warXp∈[0,3000]`.

This is a derived value; do not mutate `warBase` on each threshold and also include XP/100, which would double count growth. A separate growth-potential random variable or per-person learned-attribute cap is not read in this chain. Derived remaining cumulative capacity is `3000-warXp`; visible headroom is independently limited by100. With no age scaling, base3 reaches33, base80 reaches100 before the XP cap, and base100 can still gain XP without visible stat growth.

### XP doubling is other-member guidance in a troop

`004A54A0` requires location in0x57..0x43E, converts to troop ID by subtracting0x57, verifies troop pointer, then scans3 member slots. It explicitly excludes the receiving person (`004A5512 cmp esi,ebp; je skip`) and requires another member's skill0x54=84 (Guidance). This supports double action XP only when in a valid troop with a different guiding member. The city training gate excludes troop membership; no doubling should be applied to this training slice.

### PK ability research shares XP

`0049DC60` research qualification compares current attribute XP with2000 (`0049DCAE..DCB2` rejects >=2000) and current growth ability with research target cap.

`005D91A0`, particularly `005D9283..92C5`, computes `increment=min(5, researchTargetCap-currentGrowth)`, reads cumulative XP, adds `increment*100`, clamps to3000, and invokes `004A55A0`. That wrapper delegates to the same `0048A810` storage setter. This directly explains the common ordinary-XP/research allowance. Research command availability, use counts, costs, and all unusual negative/invalid input cases remain outside this training-only implementation.

### XP display

The published information disassembly at `004C8AB3..8AD7` reads cumulative XP. Below3000 it returns `XP%100`; at or above3000 it jumps to a return100 block. Thus mathematical remainder0 at cap is distinct from the source UI's full/100 indicator. That display claim is pinned published-disassembly evidence; this report's direct byte checks concern the XP writer/growth getter.

### Legacy slice migration

The old slice rejected any command crossing100 and accepted initial warXp only0..99. For a **validated old-slice save**, preserve warXp unchanged as cumulative XP and set warBase=old war, because no stored full XP hundreds or prior growth were representable. Do not infer unrecorded growth history. Keep an explicit migration/profile boundary; old trace provenance and old replay rules must not silently be overwritten by the new interpretation. Old synthetic WAR0 is a special compatibility issue: the recovered normal growth getter floors at1; reject or explicitly migrate/label that state rather than claiming exact preservation and source fidelity simultaneously.

## 3. Reset and scheduler: actual xrefs, function tails, and limits

### Training flags and acted flags

- `0059C423→00598630`
- `00598634..00598659`: iterate building IDs0..86 inclusive; for legal object call `00487860`
- `00487860` obtains SP type/ID and tail-jumps:
  - City: `00487911 jmp0047B730`; tail `0047B730..B73A` writes **entire dword** `[city+0xA4]=0`
  - Port/gate: `004878AF/004878E3 jmp0048DA10`; tail `0048DA10..DA17` writes `[sp+0x68]=0`
- `00598660..00598693`: iterate person IDs0..1099 inclusive; for every legal object, `push0→00489B40` clears acted, then `push0→00489B70` clears praised

There is no current-force/current-corps filter in these loops. These are **noncontiguous IDA tails owned by00487860**. The `get_func(0047B730)` owner is00487860; blindly dumping only owner.start..owner.end misses both setters. `chunks_manifest.json` records all three chunks.

The raw city reset clears all city-action bits in that dword, not just training bit4. A training-only engine must model only its supported flag and disclose omitted systems.

`004AD080` has only the training execute caller in S1 xrefs. Other direct `0047B710(...,0)` callers at004AD629 and004B76B5 are ownership/reorganization-related paths, not the recurring reset loop. Do not relabel them as scheduler reset merely because the argument is0.

### Recoverable order and retained unknowns

`00580100` normal tail phase calls `004A1180` at0058051E (increments global turn counter), then `00590C30` monthly processing at005805A8, then `0059C330` at005805D0. The dispatcher has cancellation/game-over branches and many interleaved calls, so this is a local control-flow order, not a claim all EndTurn effects are recovered.

Within the no-terminal-winner branch of0059C330:

- 0059C423: reset buildings/person flags
- 0059C42A:00599600
- 0059C431:00598400
- 0059C438:0059A4B0
- 0059C43F:00599CF0 counters/mission work
- Later 0059C508:0059C2A0
- 0059C2A0 clears troop-action flags, calls0059BF40 and00598930, then **tail-jumps** at0059C2EF to0059A230 field-morale recovery

The formerly open field-morale caller xref is therefore recovered source-bound: `0059C330→0059C2A0→0059A230`. It is a tail jump, not an ordinary call.

Important:00599CF0 can set some moving/mission officers acted=1 at00599EC2 after the global clear, and clears others at00599F87. A final state invariant that every person is unacted after EndTurn is wrong outside the limited present/idle slice. Training reset cadence does not make busy officers available.

### Calendar arithmetic

`004A1180` increments the global integer counter at `0x072019B4` (context+0x5C); `004828E0` is the setter. Current year/month/day getters004824B0/004824F0/00482530 use:

`D = ((startYear-1)*12 + startMonth-1)*30 + startDay-1 + 10*elapsedTurns`

`year=floor(D/360)+1; month=floor((D%360)/30)+1; day=D%30+1`.

For valid scenario day1/11/21, this is exactly three turns per30-day game month, twelve months per360-day game year. It does not use Gregorian February/leap-year rules. The engine's bounded integer date implementation may remain its own representation/overflow contract rather than copying the executable's extreme integer-overflow behavior.

## 4. Recommended tests and evidence levels

Source-bound reconstruction tests:

- Morale cap100/current99 permits; current100 rejects. Cap120/current119 permits; current120 rejects. Rejection is atomic before XP/AP/merit/flags/log/RNG writes.
- No troops, already-trained, no qualified officer, insufficient AP reject; ports/gates share morale gate but cannot inherit city-only facilities.
- 0,1,2,3 nonnull command slots;4 slots rejected by engine contract. Already-acted, in-troop, nonzero missionDuration reject. Duplicate and foreign/wrong-SP protections must be labeled domain constraints, not fabricated005B8320 checks.
- base80 XP98 +2 -> cumulative100, visible81, remainder0; XP99 +2 ->101,81,remainder1
- base3 XP2999 +2 ->3000, actualXP1, visible33; XP3000 +2 ->3000, actualXP0, still allow legal train rewards
- base100 XP98 +2 ->100XP, ability100 (XP persists at visible cap)
- Same result for one large award versus separated awards in the supported deterministic positive domain, respecting3000 clip
- Source-display XP at cap is100/full while mathematical remainder is0
- No extra age-growth or guidance effect in the restricted no-age/idle-city profile; special source IDs excluded
- Reset city/port/gate training flags at boundary. If testing only one-corps state, evidence must state projection of the source global loop
- Dates2/21→3/1,12/21→nextYear1/1; no leap-day rule; event ordering and omitted modules remain explicit
- Legacy0..99 migration does not manufacture prior growth; old save replay/provenance preserved or explicitly rejected
- S1 and S2 profiles never share anonymous constants; Vanilla is unsupported/unknown, not silently aliased to PK

`scripts/check_training_lifecycle_source_profile.py` verifies the packaged fingerprints/disassembly, source comparisons and11 hard-coded opcode-sequence assertions,5 named growth boundary vectors, and24,008 restricted-domain model invariants. `validation.json` records results. This verifies extraction and reference-model arithmetic; it is **not** execution/regression of the original game.

## 5. Remaining unknowns and safe implementation boundary

- Independent, legally obtained clean stock Chinese PC-PK1.1 EXE/provenance/hash and byte comparison: not found among the three prioritized sources inspected
- Vanilla-specific gate, cumulative-XP limits, research absence/differences, age behavior, scheduler: independently unknown
- Full scheduler, AP recovery placement, economic/event/AI order, shared RNG consumption, game-over/cancel/interrupt behavior: not reconstructed end to end
- Full age-coefficient tables, health/treasure/office composition, special-ID semantics, all mission-state predicates: beyond this slice (some helpers are now dumped, but not certified as a complete attribute pipeline)
- Full command input construction and all callers: selected-officer safeguards must remain explicit engine constraints
- Stock screen/UI capture or controlled stock-save experiments: not performed

Useful fallback: versioned ordinary-person/no-age/no-equipment cumulative-XP profile, strict full-morale rejection, explicit simple reset/AP/calendar adapter, source-bound receipts and replay profile, and fresh near-threshold synthetic fixtures. Do not require the still-missing clean binary to block this clearly labeled implementation.

## Artifact map

- [Structured source identities, bytes, hashes, rules and source comparisons](../sources/training-lifecycle-source-profile.json)
- [26 compact function/chunk disassemblies](../sources/training-lifecycle-source-profile/)
- [Portable static-byte/reference checker](../../scripts/check_training_lifecycle_source_profile.py)
- [Runtime lifecycle guide](../engine/pk-training-lifecycle.md)

The checked-in package contains small static function bytes/disassemblies, not an executable or the large IDBs. Every function fingerprint binds to S1; S2 bytes are retained only for independent negative comparisons. No source-repository script or executable was executed. IDB extraction used a read-only memory-mapped ID1 reader and Capstone; the raw input IDs are identified above, and hashes plus byte snippets can be independently checked without running game code. The date/getter and partial scheduler claims remain source-bound, with full stock equivalence explicitly open.
