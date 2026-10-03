# P0-39 火焰寿命 base RNG / setter 候选边界

更新：2026-10-03。主目标版本：PC-PK1.1。

## 1. 本轮结论

本轮继续追火焰寿命 setter / base RNG，没有找到公开的 `SetFireLifetime`、`RefreshFireLifetime` 或等价命名函数。

但 fire-state query 的函数边界进一步锁定：

```text
00486320 IsFacilityOnFire
004863C0 next function
length ≈ 0xA0

00495CA0 IsTroopOnFire
00495CE0 next function
length ≈ 0x40
```

这两个函数都很短，更符合“读状态/判断”角色，不支持把它们当寿命生成或刷新函数。

同时，公开火系地址仍集中在：

```text
005AECxx 火计成功/判定
005B12xx 火计/火矢点火后的火伤链
005B16xx~005B17xx 火陷阱伤害链
```

但当前没有足够反汇编把其中某个地址升级成寿命 setter。

状态：

```text
P0-39-audit-complete
fire-query-boundaries-exact
query-not-setter-high-confidence
setter-candidate-family-narrowed
base-lifetime-rng-open
reignite-semantics-open
critical-plus1-opcode-open
```

## 2. fire-state query 继续与 lifetime setter 分层

`00486320` / `00495CA0` 当前只证明：

```text
building/facility burning?
troop burning?
```

不能证明：

- 它们生成 lifetime；
- 它们递减 lifetime；
- 它们刷新 lifetime；
- lifetime 存在 troop/building 普通字段里。

## 3. setter 候选应从 ignition execution path 反查

公开火系逆向锚点：

```text
005AEBAF / 005AEC19
  火计成功/火神相关判定

005B1263
  火计/火矢点火后的火伤与火神分支

005B1686 / 005B178B
  火陷阱伤害与火神分支
```

因此真正的 lifetime setter 更可能位于：

```text
successful ignition execution
-> write burning state/counter
```

这一族调用链，而不是 fire-state query。

但当前公开资料只给了局部地址语义，没有完整 caller/body。

## 4. base lifetime RNG 继续不能从现代复刻反推

现代复刻中的70/30：

```text
1 turn: 70%
2 turns: 30%
critical +1
```

仍只能是 compatibility candidate。

当前没有 PC 原版：

- RNG helper xref；
- 常量70/30；
- lifetime table；
- setter write。

所以：

```text
baseLifetimeDistribution = open
```

## 5. 重复点火语义继续 open

仍无法确认：

```text
already burning + new ignition
```

究竟：

- overwrite；
- max(old,new)；
- reroll；
- add；
- ignore；
- conditional extend。

没有 setter body 前，任何一种都不能标 original。

## 6. 会心 +1 仍只有行为层

原作实测仍支持：

```text
critical visible duration
= base visible duration + 1
```

但当前没有 PC opcode 证明：

```text
roll base
then increment
then store
```

所以 exact opcode ordering 继续 open。

## 7. 本轮关闭 / 仍 open

### 已关闭 / 收紧

- `00486320..004863BF` facility fire query 边界；
- `00495CA0..00495CDF` troop fire query 边界；
- query 与 lifetime setter 继续严格分层；
- setter 搜索范围进一步限定到 ignition execution family；
- 不能用 query 函数或 `00599CF0` 冒充 lifetime ticker/setter。

### 仍 open

1. PC-PK1.1 fire lifetime setter 地址/body；
2. base lifetime RNG distribution；
3. RNG helper / constants；
4. lifetime decrement / extinguish caller；
5. reignite overwrite/max/add/ignore 语义；
6. source-specific setter differences；
7. critical +1 exact opcode order；
8. visible-turn vs internal-counter phase mapping；
9. Vanilla / PS2 / Wii differences。

## 8. 来源

- sean2077/311SireCustomizedPackageDev `material/内存地址汇总.md`
- fudanglp/311resource `san11pk_dump.exe_functions.csv`
- sjn4048/311MemoryResearch 火系地址与修改记录
- 关联：`39-fire-lifetime-spread-exactness.md`、`53-fire-lifetime-setter-boundary.md`
