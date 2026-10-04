# P0-11 训练资格 / 已训练重置 / 野外气力恢复 exactness

> 2026-10-04来源更新：本页保留旧轮次边界记录。S1 source gate、真实全局reset及野外气力tail-xref已由[82号审计](82-training-lifecycle-source-profile.md)恢复；以下旧“caller/body open”不能再解读为该S1来源仍未恢复。S1/S2均关联MOD，clean stock等价及完整scheduler仍open。


更新：2026-10-03。

## 1. 本轮结论

P0-11 把 E4 剩余问题拆成三层：

```text
A. 训练命令据点级 eligibility gate
B. “每回合只能训练一次”的状态与重置语义
C. 野外部队每回合气力恢复函数
```

本轮可以收紧到：

```text
training-gate-function-boundary-resolved
training-gate-inner-conditions-partial
training-once-per-turn-official
training-reset-cadence-resolved-behaviorally
training-reset-caller-open
wild-morale-local-function-resolved
music-platform-priority-resolved-high
wild-morale-top-scheduler-xref-open
```

---

## 2. 005C4100：训练的据点级 gate，而不是效果公式

`005C4220 执行训练` 的入口：

```asm
005C4230 mov eax,[ebx]     ; building/SP ptr
005C4234 push eax
005C4235 call 005C4100
005C423A add esp,04
005C423D test eax,eax
005C423F je   fail

005C4241 mov ecx,ebx
005C4243 call 005B8320
005C4248 test eax,eax
005C424A je   fail
```

因此可以确定：

- `005C4100` 只接收城/港/关指针；
- 它负责**据点级**训练可执行性；
- 它不可能直接读取本次选中的1～3名执行武将数组，因为调用时只传了据点；
- 随后的 `005B8320` 才处理包含执行武将在内的命令参数结构。

IDB 函数边界：

```text
005C4100 sub_5c4100
005C4220 sub_5c4220 (执行训练)
```

所以 `005C4100` 大小约 `0x120` bytes。

当前仍不能把它内部条件伪造为完整列表。已知至少与训练的据点状态有关，但以下条件是否全部直接位于 `005C4100` 仍 open：

- 已训练 flag；
- 当前气力是否已到上限；
- 据点是否有兵；
- 所属/控制权校验；
- 其他特殊场景 gate。

来源：
- 311MemoryResearch `Func-内政04-执行训练.txt`
- 311resource IDB functions.csv

---

## 3. “每回合一次”是官方规则，不再只是结构推断

KOEI PK 官方手册对训练明确写：

```text
1ターンに1回のみ実行できます
```

并同时确认：

- 行动力20；
- 最多3名执行武将；
- 执行武将武力合计越高，气力增加越大。

所以训练的“每回合一次”可以标：

```text
official-confirmed
```

这与原结构完全吻合：

城市：

```text
struct_city +0xA4 CityActions
bit4 = 已训练
```

港/关：

```text
+0x68 TrainingCompleted
```

执行训练时：

```asm
005C43BB mov eax,[ebx]  ; SP
005C43BD push 01
005C43BF push eax
005C43C5 call 004AD080 ; SetSPTrainingStatus(SP,1)
```

所以训练完成后确实把当前据点置为“本回合已训练”。

来源：
- KOEI《三國志11 with パワーアップキット》说明书
- 311MemoryResearch `Func-内政04-执行训练.txt`
- 311SireCustomizedPackageDev `struct_city / struct_building`

---

## 4. 重置 cadence 已能闭合，reset caller 仍 open

因为：

1. 官方明确“一回合一次”；
2. 执行时把据点训练状态写成1；
3. 下一回合必须能够再次训练；

所以状态必然在**下一回合/旬的可操作阶段之前**重新变为0。

当前 fidelity 语义可以固定：

```ts
onNewTurnForStrategicPoint(sp) {
  sp.trainingCompleted = false
}
```

但这只是**行为语义**，不是说已经找到了原 EXE reset xref。

已知 setter：

```text
004AD080 SetSPTrainingStatus(SP,0/1)
0047B710 SetCityTrainingStatus(city,0/1)
```

当前公开 TXT / 轻量 IDB 导出还没有给出：

- 哪个 turn-begin caller 用0调用它；
- 城市是否直接走 `0047B710`，港/关走 `004AD080`；
- 是否存在一次性批量清理 CityActions 的更高层 helper。

因此状态：

```text
reset cadence: resolved
reset implementation caller: open
```

另外，`00599CF0` 可以明确排除为已训练 reset：它清理的是城市 `+1E8..+244` 临时区、设施 `+30/+34` 临时区，并处理研究计数器/武将移动；公开函数体没有清 `CityActions +A4` 或港关 `+68`。

---

## 5. 0059A230：军乐台 / 奏乐 / 诗想的本地恢复函数已定位

此前 E4 只有孤立地址：

```text
0059A2B1 奏乐(75)
0059A2BE 诗想(76)
0059A325 +10
0059A3C5 +10
0059A40D +5
```

P0-11 用 IDB 函数边界确认：

```text
0059A230 sub_59a230
...
0059A4B0 next function
```

也就是上述所有地址都位于同一个约 `0x280` byte 的函数中。

因此可以把：

```text
0059A230
```

升级为：

```text
PC-PK1.1 野外部队气力恢复 local handler
```

而不再只是“某几处地址可能属于不同路径”。

完整函数签名以及谁在每旬主循环里调用它，仍未公开。

---

## 6. 军乐台 / 奏乐 / 诗想优先级

原地址：

```text
军乐台(设施12)：
  范围2
  0059A325 +10

奏乐(特技75)：
  0059A2B1
  0059A40D +5

诗想(特技76)：
  0059A2BE
  0059A3C5 +10
```

日文 Wiki 明确记录：

- 奏乐每回合+5；
- 奏乐与军乐台恢复**不同时发动**；
- 诗想把军乐台恢复翻倍；
- 因此诗想+军乐台 = 20。

所以 fidelity 规则可以固定为：

```ts
function getTurnMoraleRecovery(troop) {
  if (isInFriendlyMusicPlatformRange(troop)) {
    return troop.hasPoetry ? 20 : 10
  }

  if (troop.hasMusic) {
    return 5
  }

  return 0
}
```

如果同一部队通过不同武将同时拥有“奏乐”和“诗想”：

- 在军乐台范围内走诗想的20；
- 不在军乐台范围内，诗想本身不提供恢复，奏乐提供5。

这比“+10 +5 +10 全部叠加成25”更符合原作。

证据等级：

```text
constants/addresses: PC reverse
priority semantics: reverse-address + wiki high
```

---

## 7. 气力上限仍由统一 setter/adjuster裁剪

部队气力上限：

```text
普通：100
熟练兵：120
```

恢复不能突破该上限。

所以：

```ts
newMorale =
  min(
    moraleCap,
    currentMorale + recovery
  )
```

不要因为诗想给20就允许超过120。

---

## 8. “每旬/每回合恢复”与完整 scheduler 要分开

官方/攻略长期行为把军乐台、奏乐、诗想写成每回合恢复。

现在又已经锁定 local handler：

```text
0059A230
```

因此“每回合调用一次恢复逻辑”可以作为 fidelity 行为。

但公开资料尚未恢复：

```text
MainLoop
  -> ?
  -> 0059A230
```

的完整 xref。

所以不要写：

```text
00599CF0 -> 0059A230
```

或按地址大小猜调用顺序。

正确边界：

```text
local handler exact address: resolved
top-level per-turn scheduler caller: open
```

---

## 9. 当前建议运行时接口

```ts
interface TrainingRules {
  canTrainAtSP(sp): boolean
  calculateGain(sp, persons): number
  executeTraining(sp, persons): void
  resetTrainingStatusAtTurnBoundary(sp): void
}

interface MoraleRecoveryRules {
  recoverTroopMoralePerTurn(troop): number
}
```

其中：

- `calculateGain` 已由 E4 闭合；
- `executeTraining` 大部分副作用已闭合；
- `canTrainAtSP` 应把 `005C4100` 作为可替换 fidelity callback；
- reset cadence 可直接实现；
- `0059A230` 恢复结果可直接实现；
- 原 reset xref / global scheduler xref 暂时不影响行为复现，但继续保留 exactness gap。

---

## 10. 当前剩余 exactness gap

### 已闭合 / 收紧

- `005C4100` 是独立的据点级训练资格 gate；
- `005C4100` 与执行武将参数验证分层；
- 官方确认训练每回合最多一次；
- 城市 bit4 / 港关 +68 的“已训练”状态与执行时置位；
- reset 的**行为 cadence**：下回合可再次训练；
- `00599CF0` 排除为已训练 reset caller；
- `0059A230` 锁定为军乐台/奏乐/诗想所在的气力恢复 local handler；
- 军乐台+10、奏乐+5、诗想军乐台额外+10；
- 奏乐不与军乐台叠加，诗想使军乐台合计20；
- 气力仍按100/120上限裁剪。

### 仍 open

1. `005C4100` 完整逐指令 body；
2. `005C4100` 内部是否直接检查当前气力cap/兵力等条件；
3. `005B8320` 在训练路径中的完整参数验证语义；
4. 已训练状态置0的 exact caller / xref；
5. 城市与港关 reset 是否走同一 helper；
6. `0059A230` 完整逐指令 body / 函数签名；
7. `0059A230` 的 top-level 每旬 scheduler xref；
8. 同一位置存在多个军乐台时是否仅按存在性处理（现有行为高置信为是，原 comparator/body仍open）；
9. Vanilla / PS2 / Wii 差异。

状态：

```text
P0-11-audit-complete
training-gate-boundary-resolved
training-once-per-turn-official
training-reset-cadence-resolved
training-reset-xref-open
morale-recovery-function-59A230-resolved
music-poetry-platform-priority-resolved-high
morale-top-scheduler-xref-open
```

## 11. 来源

逆向：
- https://github.com/sjn4048/311MemoryResearch/blob/master/内存资料/整理/Func-内政04-执行训练.txt
- https://github.com/sjn4048/311MemoryResearch/blob/master/内存资料/整理/Func-自动02-计数器处理【未】.txt
- https://github.com/sjn4048/311MemoryResearch/blob/master/内存资料/地址资料.txt
- https://github.com/sean2077/311SireCustomizedPackageDev/blob/dev/material/结构体汇总.md
- https://github.com/sean2077/311SireCustomizedPackageDev/blob/dev/material/内存地址汇总.md
- https://github.com/fudanglp/311resource/blob/master/extractor/ida/data/python_idb/san11pk_dump.exe_functions.csv

官方 / 行为：
- KOEI《三國志11 with パワーアップキット》说明书
- https://w.atwiki.jp/sangokushi11/pages/13.html
- https://w.atwiki.jp/sangokushi11/pages/85.html

旧内存研究镜像：
- https://game.ali213.net/thread-2168294-1-1.html
