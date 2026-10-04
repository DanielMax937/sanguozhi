# P0-34 训练 reset / top scheduler xref 边界

> 2026-10-04来源更新：本页保留旧轮次边界记录。S1 source gate、真实全局reset及野外气力tail-xref已由[82号审计](82-training-lifecycle-source-profile.md)恢复；以下旧“caller/body open”不能再解读为该S1来源仍未恢复。S1/S2均关联MOD，clean stock等价及完整scheduler仍open。


更新：2026-10-03。主目标版本：PC-PK1.1。

## 1. 本轮结论

训练“每回合一次”的行为语义已经闭合，但本轮继续追 reset caller 与野外气力恢复 top scheduler 时，公开资料仍没有恢复具体 xref。

当前可以精确分层：

```text
训练执行置位：
  005C43C5 -> 004AD080 SetSPTrainingStatus(SP,1)

训练状态 setter：
  004AD080 SetSPTrainingStatus
  0047B710 SetCityTrainingStatus

野外气力恢复 local handler：
  0059A230..0059A4AF

top-level reset/scheduler caller：
  open
```

状态：

```text
P0-34-audit-complete
training-reset-behavior-resolved
training-reset-xref-open
morale-local-handler-boundary-exact
morale-top-scheduler-xref-open
address-adjacency-inference-rejected
```

## 2. setter 边界已确认，但 caller 仍缺

`311resource` 函数表：

```text
004AD080 SetSPTrainingStatus
004AD160 next function

0047B710 SetCityTrainingStatus
0047B730 next function
```

因此 setter 自身是真实独立函数。

但公开资料没有给出：

```text
call 004AD080
push 0
```

或：

```text
call 0047B710
push 0
```

对应的 turn-begin / force-turn-begin caller。

所以：

```text
reset semantics = exact behavior
reset implementation xref = open
```

## 3. 00599CF0 继续可排除为训练 reset

已公开的 `00599CF0` body 没有清：

```text
struct_city +0xA4 CityActions.trainingCompleted
port/gate +0x68 TrainingCompleted
```

所以不能因为它处于旬/自动处理区域，就把它当作训练 reset caller。

这条 negative evidence 继续保留。

## 4. 0059A230 local handler 边界 exact

`311resource`：

```text
0059A230 sub_59A230
0059A4B0 next function
```

所以：

```text
0059A230..0059A4AF
length ≈ 0x280
```

军乐台、奏乐、诗想的相关地址全部落在这一函数内，因此 local morale-recovery handler 的地址边界可以视为 exact。

## 5. 但 top scheduler 不能按邻近地址猜

`0059A230` 前面附近还有：

```text
00599CF0
0059A0E0
```

后面还有：

```text
0059A4B0
0059A8B0
...
```

但 functions.csv 只有函数起始地址，没有 xref。

因此不能写：

```text
00599CF0 -> 0059A230
```

或：

```text
0059A0E0 -> 0059A230
```

仅凭地址相邻就建立调用链。

## 6. fidelity 实现仍可固定行为 cadence

因为官方规则明确训练每回合一次，而且执行时会置 trainingCompleted=1：

```ts
onStrategicTurnBoundary(sp) {
  sp.trainingCompleted = false
}
```

可以作为 fidelity 行为语义。

同样，军乐台/奏乐/诗想每回合恢复可以按已闭合结果执行。

但这些是行为层，不是原 EXE 顶层函数地址的逐指令复刻。

## 7. 当前安全架构

```ts
resetTrainingStatusAtTurnBoundary(sp)
recoverTroopMoralePerTurn(troop)
```

其中：

```text
behavior:
  fidelity-ready

exact top scheduler/xref:
  open
```

这样未来找到真正 caller 时，无需改规则结果，只补执行路径证据。

## 8. 本轮关闭 / 仍 open

### 已关闭 / 收紧

- `004AD080` / `0047B710` setter 函数边界；
- 训练执行时置位路径；
- reset 行为 cadence；
- `00599CF0` 不是已训练 reset caller；
- `0059A230..0059A4AF` morale local handler 边界；
- 地址邻近不能作为 top scheduler xref 证据。

### 仍 open

1. 城市训练 flag 置0 exact caller；
2. 港/关训练 flag 置0 exact caller；
3. 城市与港关是否共用同一 top-level reset loop；
4. `0059A230` exact caller/xref；
5. morale recovery 在每旬主循环中的精确位置；
6. multiple music-platform selector body；
7. Vanilla / PS2 / Wii 差异。

## 9. 来源

- sjn4048/311MemoryResearch 训练执行与自动计数器资料
- sean2077/311SireCustomizedPackageDev `material/内存地址汇总.md` / `结构体汇总.md`
- fudanglp/311resource `san11pk_dump.exe_functions.csv`
- 关联：`46-training-morale-exactness.md`、`19-training-morale.md`
