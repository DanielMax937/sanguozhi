# E9 兵粮袭击

更新：2026-09-30。主目标版本：PC-PK1.1。

## 1. 技巧与原函数入口

兵粮袭击是枪兵系 Lv2，技术 ID = 1。

PC-PK1.1 已知入口：

```text
005ADB55  techId = 1
005ADB20  兵粮袭击判定 / 数量 helper
```

主攻击函数 `005AFC70` 在“被攻击对象是部队”的附加效果阶段调用：

```text
005B03F5  target troop
005B03F7  attacker troop
005B03F9  call 005ADB20
005B03FE  result -> attack-result +18
005B0401  result -> attack-result +2C
```

因此 E9 的第一层事实已经从攻略描述升级为 PC 原攻击链确认。

## 2. 只对部队目标，不对设施目标

`005ADB20` 调用位于：

```text
被攻击对象是部队
-> 防御类判定
-> 扫讨
-> 威风
-> 兵粮袭击
```

设施目标走另一条耐久 / 据点士兵伤害分支，不经过这次兵粮袭击调用。

所以：

```text
target = troop    -> 可进入兵粮袭击
target = facility -> 不进入这条兵粮袭击
```

## 3. 普通攻击和战法共用同一 helper

`005AFC70` 同时处理：

- 普通攻击；
- 战法 ID 0..31。

两者在完成各自战法成功 / 攻击力 / 伤害计算后，都会汇入同一“目标是部队”的附加效果段，再调用 `005ADB20`。

旧攻略也明确记录“普通攻击和战法攻击通用”。

因此当前规则：

```text
枪兵普通攻击 -> 可触发
枪兵战法     -> 可触发
```

但 `005ADB20` 本体尚未公开，所以“战法失败但主攻击函数仍走到该位置时是否最终转移粮食”不从 caller 强行推断，继续 open。

## 4. 反击明确不触发

PC 原函数在反伤 / 反击支路直接跳过：

```text
金刚 / 不屈 / 矢盾 / 大盾
扫讨 / 威风
袭击兵粮
```

逆向注释明确写：

> 反伤不进行……袭击兵粮的判定

所以：

```text
主动普通攻击：可
主动战法攻击：可
普通反击/战法反伤：不可
```

这一点已经是 PC-PK1.1 逐指令级。

## 5. 抢粮数量：高置信主公式

2006～2008 的技术详解反复记录：

```text
抢粮量 = 部队攻击力 × R
R ∈ [1, 2]

同时：
每 2 名己方士兵最多抢 1 粮
```

也就是：

```ts
rawRaid = attackPanel * R
troopCap = floor(attackerTroops / 2)

raid = min(rawRaid, troopCap)
```

这里的“攻击力”应理解为当前部队面板 Attack，而不是本次实际造成的兵损。

交叉理由：

- E3 已确认 runtime troop 单独保存 Attack；
- 旧技术详解用“攻击力105、R=2 => 210粮”的例子；
- 现代实测用攻击84的部队，多次普通攻击和战法都落在84～168范围；
- 200兵时无论攻击再高，上限固定100。

因此：

```text
攻击力控制大部队的收益
自身兵力/2控制小部队的收益上限
```

## 6. RNG 精确粒度仍未从原 EXE 闭合

当前公开逆向资料只保留：

```text
005ADB20 helper入口
005ADB55 techId=1
```

没有 `005ADB20` 的逐指令函数体。

所以目前只能确认：

```text
R最小约1
R最大约2
```

不能仅凭攻略文字宣称原 EXE 是：

- 连续均匀浮点 [1,2]；
- 0.1 一档；
- 0.01 一档；
- 或某个隐藏离散表。

### 6.1 兼容 fallback

独立复刻项目 `sango_infinity` 实现为：

```cs
k = UniformInteger(10, 20) // 10..20 inclusive
raid = min(
  attackerTroops / 2,
  attackerAttack * k / 10
)
```

这是一个很合理的闭环实现，也符合现有所有 [1,2] 实测范围。

因此在本项目“原 helper 未恢复”期间，推荐兼容 profile：

```ts
k = randomIntInclusive(10, 20)
raw = floor(attacker.attack * k / 10)
raid = min(floor(attacker.troops / 2), raw)
```

证据标签必须写：

```text
compatibility-reconstruction
```

而不是 `reverse-engineered`。

## 7. 敌方扣粮与己方加粮

长期攻略明确表述为：

```text
敌方减少 N
己方增加 N
```

所以正常资源足够、己方未满粮时：

```text
transfer = N
attacker.food += N
target.food -= N
```

但原 `005ADB20` 本体缺失，因此两个边界尚未闭合：

1. 目标只剩少于 N 的粮；
2. 攻击方已经接近 / 达到部队 50000 粮上限。

原作究竟是：

- 先按双方各自 setter 独立 clamp；
- 先缩小到可守恒转移量；
- 还是存在可“凭空增加/消失”的旧游戏边界 BUG；

目前没有足够证据。

### 7.1 引擎保守 fallback

为了不凭空制造粮食，非 fidelity fallback 建议：

```ts
actual = min(
  raid,
  target.food,
  attacker.foodLimit - attacker.food
)

target.food -= actual
attacker.food += actual
```

并明确标记：

```text
engine-safety-fallback
```

当未来恢复 `005ADB20` 时用原作行为替换。

## 8. 防御技能把伤害变0时的边界

调用顺序非常值得注意：

```text
大盾/矢盾/金刚/不屈
-> 可能把 damage 置0
-> 扫讨/威风
-> 005ADB20 兵粮袭击
```

也就是说 caller 本身没有在 `005ADB20` 前再次写出：

```text
if damage == 0 skip raid
```

但 helper 本体缺失，不能因此直接断言“被大盾挡掉伤害仍一定被抢粮”。

当前标记：

```text
shielded-zero-damage raid behavior = open
```

## 9. 连击

现代可复现实测显示：

```text
连击触发两次攻击
=> 可以发生两次兵粮袭击
```

这符合“每次攻击一次 helper”的模型。

证据等级：

```text
empirical-high
```

不是本轮逐指令确认，因为尚未恢复连击 caller 与 `005ADB20` 的完整调用次数关系。

## 10. 支援攻击与水战边界

当前仍不强推：

### 支援攻击

主攻击函数的 food-raid 段已恢复，但当前公开逆向没有把“支援攻击 caller 是否同样调用该段”完整标出来。

因此：

```text
support attack food raid = open
```

### 水战

“兵粮袭击”描述为枪兵攻击，但部队入水时 active equipment/profile 会切为舰船。

原 helper 是否看：

- 原陆上枪兵兵装；
- 当前 active unit type；
- 或某个 force tech + troop land equipment 条件；

函数体缺失。

因此：

```text
spear-on-water food raid = open
```

不要使用 SIRE 的“远程有效”开关反推官方行为。

## 11. 可复算参考

### 攻击84、10000兵

```text
R范围 1..2
兵力上限 = 5000

=> 抢粮主范围约 84..168
```

### 攻击105、10000兵

```text
=> 最大 210
```

这正是2008技术详解的经典例子。

### 攻击100、只有200兵

```text
兵力/2 = 100

=> 无论R多高，最多100
```

现代实测也得到这一边界。

## 12. E9 当前证据分级

### reverse-engineered

- 技巧 ID1；
- 原 helper 为 `005ADB20`；
- 仅部队目标进入；
- 普通攻击/战法汇入同一 food-raid 调用段；
- 反击明确跳过兵粮袭击；
- food raid 与 damage 是攻击结果中的不同字段。

### documented / empirical-high

- 数量核心 = Attack × R；
- R 范围1～2；
- 自身兵力/2封顶；
- 正常情况下敌减与己增同量；
- 连击可触发两次。

### compatibility-reconstruction

- `k∈{10..20}` 等概率；
- `floor(Attack*k/10)`；
- 再取兵力/2上限。

### open

- 原 RNG 粒度/分布；
- `005ADB20` 完整逐指令；
- 目标缺粮时的精确转移；
- 攻方粮满时的精确处理；
- 防御技能使伤害0时是否仍抢；
- 支援攻击；
- 水上枪兵；
- Vanilla / 主机版 helper 是否完全一致。

## 13. 来源

- 311MemoryResearch `函数[部队攻击].txt`：`005B03F5 -> 005ADB20` 调用与反击跳过。
- 311MemoryResearch `地址资料.txt`：`005ADB55 techId=1`。
- 《三国志11 技术详解》（2008）：Attack×R，R=1～2，兵力/2封顶。
- 日文攻略Wiki《技巧研究》：每次枪兵攻击减少敌军兵粮。
- 2021后现代实测文章：攻击84落在对应范围、200兵封顶100、连击可两次。
- `tankyc/sango_infinity`：独立复刻使用10～20整数档作为R×10，仅作兼容 reconstruction，不作为原EXE证据。
