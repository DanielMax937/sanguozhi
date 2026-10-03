# P0-21 非自然忠诚：褒赏忠诚增量 caller / RNG 边界

更新：2026-10-03。主目标版本：PC-PK1.1。

## 1. 本轮结论

P0-21 继续追踪现金褒赏的忠诚增量路径。

当前公开逆向可以稳定确认三层：

```text
005B5D60
  褒赏命令执行 containing function
  function range ≈ 005B5D60..005B5F9F

0048A770 SetLoyalty
  直接设置真实忠诚，范围0..255

004A6CF0 ModifyPersonLoyalty
  按 delta 增减武将真实忠诚
```

以及：

```text
struct_person +0xAC = Loyalty byte
UI显示上限 = 100
底层真实值可 >100
```

因此状态：

```text
P0-21-audit-complete
true-loyalty-byte-layer-exact
set-loyalty-primitive-exact
modify-loyalty-primitive-exact
reward-command-containing-function-exact
reward-delta-formula-open
reward-rng-open
reward-charm-giri-path-open
```

## 2. 褒赏执行函数边界

`311resource` 的函数表确认：

```text
005B5D60 sub_5b5d60
005B5FA0 next function
```

所以 `005B5D60` 大约覆盖 0x240 bytes。

311MemoryResearch 的运行时调用栈进一步确认：

```text
004A1820
-> 005B9340 DeductCorpActionPoints
-> 005B5F87 (inside 005B5D60)
   褒赏扣行动力、扣钱
-> 005B9630
```

因此 `005B5D60` 是现金褒赏命令的执行 containing function，而不仅仅是 UI gate。

但公开资料尚未展开其完整逐指令 body，所以不能断言忠诚 delta 就在 `005B5F87` 附近计算。

## 3. 忠诚底层 primitive 已恢复

SIRE 地址表明确：

```text
0048A770 SetLoyalty
  设置忠诚度 0..255

004A6CF0 ModifyPersonLoyalty
  push 忠诚变化量
  push 武将指针
  ecx = 0799895c
```

这意味着引擎里应该把“算增量”和“写回忠诚”分开：

```ts
delta = rewardGainFormula(...)
ModifyPersonLoyalty(person, delta)
```

而不是：

```ts
displayLoyalty = min(100, displayLoyalty + delta)
```

## 4. 隐藏忠诚 >100 现在有结构级支撑

`struct_person +0xAC` 是 byte Loyalty；`SetLoyalty` 明确接受 0..255。

所以：

```text
真实忠诚范围 0..255
UI显示 cap 100
```

不只是玩家观测，而有原结构/helper 支撑。

典型行为：

```text
true 99 -> reward -> true 108
display = 100
```

因此后续流言、欠薪等非自然忠诚变化必须继续作用于 true loyalty。

## 5. 不能从 primitive 反推出褒赏公式

当前没有公开 xref / body 能证明 `005B5D60`：

- 直接调用 `004A6CF0`；
- 先算某个固定 delta 再调用；
- 调 `0048A770` 写绝对值；
- 是否显式读取君主魅力；
- 是否读取目标义理；
- RNG 使用 `00472150` 还是其他随机 helper。

因此下面仍然全部 open：

```text
rewardGain = ?
rulerCharm contribution = ?
targetGiri contribution = ?
RNG range/distribution = ?
```

## 6. 现有实测只负责约束结果空间

原作观测已有：

```text
+5
+8
+9
```

并且 S/L 可改变结果、君主魅力会影响上升量。

所以可以继续排除：

```text
固定 +10
固定 +11
现代复刻“保底11再加随机”
```

但不能据此拟合一个看似漂亮的闭式。

## 7. 建议实现接口

```ts
interface RewardLoyaltyProfile {
  rollDelta(ctx: {
    ruler: Person
    target: Person
    rng: RNG
    version: RulesetVersion
  }): number
}

function applyCashReward(target, delta) {
  modifyTrueLoyalty(target, delta)
}
```

`modifyTrueLoyalty` 应复刻 0..255 层，而不是 UI 0..100 层。

## 8. 本轮关闭 / 仍 open

### 已关闭 / 收紧

- `005B5D60` 为褒赏执行 containing function；
- `005B5F87` 位于其中且属于褒赏 AP/金钱扣除路径；
- `0048A770 SetLoyalty` 是 0..255 真实忠诚 setter；
- `004A6CF0 ModifyPersonLoyalty` 是忠诚 delta primitive；
- `+0xAC` 为底层 Loyalty byte；
- UI 100 不等于底层写回上限。

### 仍 open

1. `005B5D60` 完整 body；
2. 褒赏 loyalty primitive 的 exact xref；
3. delta 计算函数；
4. RNG helper / 分布；
5. 君主魅力进入方式；
6. 目标义理/关系是否参与；
7. delta clamp / overflow 的 exact 顺序；
8. Vanilla / PS2 / Wii 差异。

## 9. 来源

- sjn4048/311MemoryResearch `内存资料/修改记录by sjn4048.txt`
- sean2077/311SireCustomizedPackageDev `material/内存地址汇总.md`
- sean2077/311SireCustomizedPackageDev `material/结构体汇总.md`
- fudanglp/311resource `san11pk_dump.exe_functions.csv`
- 关联：`41-nonnatural-loyalty-exactness.md`
