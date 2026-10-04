# P0-44 据点陷落 durability=0 / troops=0 takeover reset 边界

> 历史审计记录：当前结论以 [P0-46来源限定审计](81-capture-selector-source-profile.md) 为准。公开IDB已恢复 containing body、city-only selector/RNG与晚期耐久下限，但输入路径含MOD目录，stock PC-PK1.1等价性仍open。以下保留当轮证据状态，不作为当前“body尚未找到”的进度指针。

更新：2026-10-04。主目标版本：PC-PK1.1。

## 1. 本轮结论

当前可以继续保留的行为事实：

```text
据点耐久归零 -> 可陷落
据点守兵归零 -> 可陷落
```

但旧规则：

```text
守兵归零时：占领方继承剩余耐久
耐久归零时：守兵清空，耐久重置为最大耐久10%
```

仍没有 PC-PK1.1 takeover writer / setter xref 支持，不能升级为 fidelity exact。

本轮新锁定：

```text
00487E20..00487E4F
  = SetFacilityDurability
```

资源保留则由另一路 `004B329B` 闭合：

```text
retainPct = max(5, floor(commanderCharisma/10))
```

作用于金/粮/兵/12类兵装。

因此 takeover 至少必须分成：

```text
A. capture/ownership transition
B. durability/troop reset
C. resource retention
D. domestic-facility retention/destruction
```

其中 B 仍 open，C 已 exact。

状态：

```text
P0-44-audit-complete
fall-by-zero-durability-behavior-confirmed
fall-by-zero-troops-behavior-confirmed
facility-durability-setter-boundary-exact
resource-retention-formula-exact
takeover-reset-writer-open
ten-percent-durability-reset-unverified
```

## 2. `00487E20` 只证明有耐久 setter

IDB 函数表：

```text
00487E20 SetFacilityDurability
00487E50 next function
```

所以 setter 自身长度约 `0x30`。

但当前公开资料没有：

```text
takeover/capture caller -> 00487E20
```

的 xref。

因此不能仅凭 setter 存在就证明占领时写入什么耐久值。

## 3. 资源保留与 durability reset 是两条不同证据链

`004B329B` 已完整解决的是：

```text
newMoney
newFood
newTroops
equipment[0..11]
```

的占领后保留量。

它不能单独推出：

- 新占领方耐久值；
- 是否清空守兵后再应用资源保留；
- ownership write 的先后；
- 城/港/关是否同一 reset profile。

所以不能把“资源保留 exact”误写成“takeover reset 全部 exact”。

## 4. 两种陷落入口是否汇入同一 finalizer 仍 open

从行为层：

```text
durability <= 0
or
troops <= 0
=> fall
```

但当前还没有恢复：

```text
if durabilityZero -> X
if troopsZero -> Y
-> common takeover finalizer?
```

因此以下仍不能断言：

- 两种入口共享同一 finalizer；
- durability reset 只发生在耐久归零入口；
- troop reset 只发生在守兵归零入口；
- ownership/resource/facility destruction 的统一顺序。

## 5. 旧“10%最大耐久”必须继续保持 provisional

当前没有找到：

- `maxDurability / 10` opcode；
- `SetFacilityDurability(max/10)` caller；
- takeover finalizer body；
- PC-PK1.1 可重复内存样本。

因此：

```text
durabilityZeroCaptureReset = 10% max durability
```

只能继续作为 legacy/provisional observation，不能进入 strict fidelity。

## 6. 旧“守兵归零保留剩余耐久”也未源码闭合

这个行为看起来合理，也符合玩家经验，但当前同样缺：

```text
troopsZero branch skips durability setter
```

的原指令证据。

所以证据等级只能是：

```text
documented/empirical candidate
```

而不是 reverse-exact。

## 7. 当前安全 architecture

```ts
resolveFacilityFall(reason) {
  transferOwnership(...)
  applyTakeoverReset(reason, ruleset)       // still profile-driven
  applyCapturedResourceRetention(...)       // exact
  resolveDomesticFacilityRetention(...)     // selector partly open
}
```

其中：

```text
resource retention:
  exact

takeover reset:
  unresolved-original
```

## 8. 本轮关闭 / 仍 open

### 已关闭 / 收紧

- 两种归零都可导致陷落的行为边界；
- `00487E20..00487E4F` 耐久 setter 边界；
- 资源保留与 durability reset 必须分层；
- `004B329B` 不能证明占领耐久重置；
- 旧“10%最大耐久”继续不能标 original exact。

### 仍 open

1. durability=0 takeover caller；
2. troops=0 takeover caller；
3. 两入口是否汇入同一 finalizer；
4. durability reset exact value；
5. troops reset exact value；
6. ownership / reset / resource retention / facility destruction 的执行顺序；
7. city / harbor / gate 差异；
8. Vanilla / PS2 / Wii 差异。

## 9. 来源

- fudanglp/311resource `san11pk_dump.exe_functions.csv`
- sjn4048/311MemoryResearch `函数[破坏内政设施和破城获取资源].txt`
- 关联：`05-combat.md`、`13-open-exactness.md`、`16-unresolved-rules-fallbacks.md`
