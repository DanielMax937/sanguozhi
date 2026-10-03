# P0-4 火焰持续与自然蔓延 exactness

更新：2026-10-01。

## 1. 本轮结论

P0-4 需要把三个经常被混为一谈的机制拆开：

```text
A. 点火后，这一格火焰持续多久
B. 火种 / 火球 / 落雷等一次攻击覆盖哪些格、会不会引爆其他火罠
C. 已经着火的普通地格，之后会不会自己向相邻格扩散
```

当前证据能把边界收紧到：

```text
火计会心对持续时间：
高置信 = 基础结果 +1 回合

基础持续时间原始 RNG：
仍未取得 PC-PK1.1 的原函数
70/30 只能作为工程 fallback

普通着火格的自然邻格蔓延：
原作 fidelity = 关闭 / 0

火罠、火球、落雷的范围与连锁：
属于攻击/陷阱系统，不属于“自然蔓延”
```

因此本项属于：

```text
behavioral-boundary-resolved
critical-duration-transform-resolved
base-lifetime-rng-still-open
ambient-spread-disabled-in-fidelity
```

## 2. 火伤本身不是本轮缺口

日文 Wiki 的原作实测已经给出稳定边界：

- 普通火计约 **400±100**；
- 与兵科、兵力、适性、攻防无关；
- 火计会心的即时火伤约 **×1.2**；
- 踏破、会心、爆药炼成、火神、藤甲有明确的处理顺序。

因此 P0-4 不重开火伤公式，只处理“持续时间”和“是否自动扩散”。

来源：
- https://w.atwiki.jp/sangokushi11/pages/92.html
- https://w.atwiki.jp/sangokushi11/pages/91.html

## 3. 会心持续时间：不是固定值，而是基础结果 +1

旧资料和专项实测共同支持：

```ts
criticalDuration = baseDuration + 1
```

而不是：

```ts
criticalDuration = 3
```

专项实测给出的成对观察是：

```text
普通：1 / 3 / 3 回合后熄灭
会心：2 / 4 / 4 回合后熄灭
```

三组都严格 +1。

这与早期攻略中“火计会心会延长燃烧”的描述一致。

证据等级：

```text
empirical-high
```

原因是我们拿到了稳定行为关系，但尚未拿到原 EXE 负责写入火焰寿命的函数体。

来源：
- https://forum.gamer.com.tw/Co.php?bsn=60001&sn=380559
- https://www.bilibili.com/opus/374609164980707553
- https://w.atwiki.jp/sangokushi11/pages/85.html
- https://w.atwiki.jp/sangokushi11/pages/2166.html

## 4. 基础寿命：70/30 只能作为 fallback

现代开源复刻 `tankyc/sango_infinity` 的技能数据把多种直接点火效果写成：

```text
非会心：
values  = [1, 2]
weights = [70, 30]

会心：
values  = [2, 3]
weights = [70, 30]
```

其 `SetFire.cs` 先按权重抽取 `finalCount`，再写入 `fire.counter`。

这给了我们一个很适合工程闭环的候选模型：

```ts
const defaultTacticalFireLifetime = {
  1: 0.70,
  2: 0.30,
}

const base = weightedChoice(defaultTacticalFireLifetime)

const storedLifetime =
  base + (critical ? 1 : 0)
```

但是必须明确：

1. 这是**二级重建证据**，不是原版反汇编常量；
2. 玩家看到的“几回合后熄灭”不一定等于内部 counter 数值；
3. 点火发生阶段、立即结算火伤、回合开始/结束递减，都可能改变肉眼统计口径；
4. 专项实测出现过普通火 3 回合、会心 4 回合，因此不能把“原版可见寿命最大2/3回合”写死。

因此引擎必须保留：

```ts
fireLifetimeProfile[source]
```

而不是在核心代码里硬编码 70/30。

建议至少分：

```ts
type FireSource =
  | "strategy"
  | "fire-arrow"
  | "fire-trap"
  | "lightning"
  | "scripted-event"
```

工程参考：
- https://github.com/tankyc/sango_infinity/blob/main/Project/Assets/Sango/Scripts/Game/Object/Skill/Effect/SetFire.cs
- https://github.com/tankyc/sango_infinity/blob/main/Build/Content/Data/Common/Skills.json

## 5. 为什么不能把“每旬计数器处理”当作火焰寿命函数

检查 311MemoryResearch 的：

```text
整理/Func-自动02-计数器处理【未】.txt
```

该函数主要处理：

- 城市/设施临时数据清零；
- 技术研究计数；
- 能力研究计数；
- 留守类计数等。

公开文本中没有地面火寿命的递减/熄灭逻辑。

因此不能因为它名为“计数器处理”，就把火焰寿命错误挂到 `00599CF0` 这条路径。

## 6. SIRE / 逆向资料能确认的火状态边界

SIRE 地址表已经给出：

```text
00486320 IsBuildingOnFire
00495CA0 IsTroopOnFire
```

311MemoryResearch 还定位了多处原版火系逻辑：

```text
005AEBAF 火神：火计免疫相关
005AEC19 火神：对低智目标火计必中
005B1263 火计/火矢/着火格火伤与火神
005B1686 火罠伤害与火神
005B178B 火罠受击与火神
005AE540 火神通过着火格不减兵
00583008 火神船只着火不减兵
```

以及独立的：

```text
函数[火陷阱炸伤炸死].txt
```

这些资料证明“着火状态”在原程序中有独立查询和伤害处理，但公开文本仍没有给出：

- 点火时寿命值如何生成；
- 哪个函数在何阶段递减寿命；
- 寿命归零时具体在哪条路径清火。

所以 base lifetime RNG 继续标 open 是必要的。

来源：
- https://github.com/sean2077/311SireCustomizedPackageDev/blob/dev/material/内存地址汇总.md
- https://github.com/sjn4048/311MemoryResearch/blob/master/内存资料/修改记录by%20sjn4048.txt
- https://github.com/sjn4048/311MemoryResearch/blob/master/内存资料/函数[火陷阱炸伤炸死].txt
- https://github.com/sjn4048/311MemoryResearch/blob/master/内存资料/整理/Func-自动02-计数器处理【未】.txt

## 7. 自然邻格蔓延：原作 fidelity 关闭

本轮继续检索原版时期攻略、日文 Wiki、SIRE 与 311MemoryResearch，仍没有找到可靠证据支持：

```text
一格已经着火
→ 之后每旬根据风向/地形随机
→ 自动点燃普通相邻格
```

相反，原作资料中的“连烧/延烧”可以由明确的主动机制解释：

- 火种 / 火焰种 / 业火种的爆炸范围；
- 火球 / 火焰球 / 业火球的滚动与范围；
- 落雷的范围点火；
- 火计、火矢对目标格点火；
- 火罠之间的连锁引爆。

因此 fidelity profile 固定：

```ts
naturalAdjacentSpread = {
  enabled: false,
  probability: 0,
}
```

同时必须保留：

```ts
igniteByAttackArea()
triggerFireTrapChain()
```

这两者不是自然蔓延。

来源：
- https://www.gamersky.com/handbook/200603/21652.shtml
- https://w.atwiki.jp/sangokushi11/pages/79.html
- https://w.atwiki.jp/sangokushi11/pages/2166.html

## 8. 现代复刻的 SpreadFire 不能反证原作

`tankyc/sango_infinity` 当前存在完整 `Fire.SpreadFire()`：

- 每回合检查相邻格；
- 按地形可燃性计算概率；
- 有最大蔓延概率；
- 有单回合最大扩散格数；
- 有扩散代数与代际衰减；
- 有 `fireSpreadEnabled` 剧本开关。

但这些参数是该项目后加的可配置系统；更新记录也把“火焰蔓延开关”作为剧本参数功能。

所以：

```text
现代复刻有 SpreadFire
!=
原版 San11 有自然 SpreadFire
```

如果本项目以后要提供扩展玩法，可以放在：

```ts
ruleset.extensions.naturalFireSpread
```

默认 Vanilla / PK fidelity 必须关闭。

## 9. 建议运行时接口

```ts
interface FireLifetimeProfile {
  // provisional / profile-specific
  baseWeights: Record<number, number>

  // high-confidence original behavior
  criticalBonusTurns: 1
}

interface FireRules {
  lifetimeBySource: Record<FireSource, FireLifetimeProfile>

  fidelity: {
    naturalAdjacentSpread: false
  }

  extensions?: {
    naturalFireSpread?: {
      enabled: boolean
      // non-original extension parameters live here
    }
  }
}
```

关键原则：

```text
critical +1
可以写进 fidelity rule

70/30
只能写进 default profile

自然蔓延
不能在 fidelity 中偷偷开启
```

## 10. 当前剩余 exactness gap

### 已收紧

- 火计即时火伤量级与主要 modifier；
- 火计会心持续时间 = 基础结果 +1；
- 火罠/火球范围连锁与自然蔓延分离；
- Vanilla/PK fidelity 下自然邻格蔓延关闭；
- 70/30 fallback 的来源和证据等级明确；
- `00599CF0` 排除为已知地面火寿命计数路径。

### 仍 open

1. PC-PK1.1 点火寿命 setter 原函数；
2. 原版基础寿命完整概率分布；
3. 内部 counter 与玩家可见“第几回合熄灭”的精确 phase 映射；
4. 重复对已着火格点火时，是覆盖、取最大、重抽还是其他 setter 语义；
5. 不同点火来源是否共享完全相同的 lifetime RNG；
6. Vanilla / PS2 / Wii 的等价性。

状态：

```text
P0-4-audit-complete
critical-duration-transform-resolved
base-lifetime-rng-open
natural-adjacent-spread-disabled
```

## 11. 来源

原作实测 / 攻略：
- https://w.atwiki.jp/sangokushi11/pages/92.html
- https://w.atwiki.jp/sangokushi11/pages/85.html
- https://w.atwiki.jp/sangokushi11/pages/2166.html
- https://forum.gamer.com.tw/Co.php?bsn=60001&sn=380559
- https://www.bilibili.com/opus/374609164980707553
- https://www.gamersky.com/handbook/200603/21652.shtml

逆向：
- https://github.com/sjn4048/311MemoryResearch
- https://github.com/sean2077/311SireCustomizedPackageDev/blob/dev/material/内存地址汇总.md

二级工程重建：
- https://github.com/tankyc/sango_infinity/blob/main/Project/Assets/Sango/Scripts/Game/Object/Skill/Effect/SetFire.cs
- https://github.com/tankyc/sango_infinity/blob/main/Build/Content/Data/Common/Skills.json
