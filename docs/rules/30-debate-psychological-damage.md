# E15 舌战普通牌心理伤害

更新：2026-10-01。主目标：PC-PK 导向通用舌战核心。

## 1. 本轮结论

E15 关闭：

> “普通数字牌与话术的精确心理伤害函数未知”

中的**普通话题牌通用伤害核心**，并把话术牌的伤害/非伤害边界分离。

关键纠错：

```text
牌力 power 只决定本回合谁赢
心理伤害 hpDamage 不使用双方 power 差
```

所以：

```text
当前话题大牌 power=13
击败非当前小牌 power=1
```

并不会因为“领先12点”而额外加伤害。

心理伤害另由：

```text
出牌者智力形成的 attack
× 愤激系数
× 牌等级系数
× 当前话题系数
× 微小随机扰动
```

计算。

## 2. 证据链

### 2.1 C++ 逆向翻译

`tankyc/sango_infinity` 的 `Debate.cs` 文件头明确：

```text
舌战(Debate)系统主体
由 s11_sys_debate.h + s11_sys_debate.cpp 翻译而来
```

并保留：

- 原 C++ 数据结构和枚举；
- 原地址/数据注释；
- `8b3380`：话题牌等级伤害系数；
- `8b338c`：话题牌怒气伤害系数；
- `5201c0`：舌战初始化入口注释。

现代项目后来加入了 `DebatePersonBehaviours` 数据驱动人物 hook。本轮只提取 hook 之前的**通用核心**。

### 2.2 同期官方/攻略交叉

2006 年 4Gamer 的官方发布资料确认：

- 话题为故事 / 道理 / 时势；
- 当前话题牌优先；
- 同类大 > 中 > 小；
- 无视 > 大喝 > 诡辩 > 话题牌 > 镇静 > 逆上；
- 赢方造成伤害或特殊效果；
- 败方增加怒气；
- 心理槽归零失败；
- 再考在足场崩坏后恢复；
- 四性格存在不同愤激效果。

同期游民星空攻略也独立给出相同优先级和话术作用。

这些资料不提供内部连续伤害常量，但与逆向翻译的结构完全一致。

## 3. 心理槽与怒气槽

原通用常量：

```text
MaxHP     = 1000
MinHP     = -100
MaxStress = 100
```

足场崩坏：

```ts
crumbledLevel =
  clamp(
    trunc((1000 - hp) / 250),
    0,
    3
  )
```

所以每累计掉约 250 心理值，足场下降一级。

## 4. 智力先生成固定 attack

进入舌战时，对每一方分别计算：

```ts
attack =
  100
  + trunc(
      40 * (myINT - opponentINT)
      / (131 - myINT)
    )
```

所有整数除法按 C/C# 向 0 截断。

### 4.1 性质

- 同智力时永远 `attack=100`；
- 同样智力差，绝对智力不同，attack 可以不同；
- 高智力区优势是非线性的。

锚点：

| 我方智力 | 对方智力 | attack |
|---:|---:|---:|
| 30 | 30 | 100 |
| 80 | 80 | 100 |
| 100 | 100 | 100 |
| 100 | 80 | 125 |
| 80 | 100 | 85 |

普通牌伤害直接读取这个运行时 attack。

## 5. 牌力：只决定胜负

### 5.1 普通话题牌

```ts
power = 1 + cardLevel
```

其中：

```text
小=0
中=1
大=2
```

若牌话题等于当前话题：

```ts
power += 10
```

得到：

| 牌 | 非当前话题 | 当前话题 |
|---|---:|---:|
| 小 | 1 | 11 |
| 中 | 2 | 12 |
| 大 | 3 | 13 |

因此：

```text
当前话题小(11)
>
非当前话题大(3)
```

### 5.2 话术牌 power

```text
无视 = 120
大喝 = 110
诡辩 = 20
镇静 = 0
激昂 = 0
```

这精确实现官方描述的优先级。

## 6. 普通话题牌心理伤害

牌等级伤害系数：

```ts
levelCoef = {
  small:  10,
  medium: 15,
  large:  20
}
```

数据注释：

```text
8b3380
```

普通、未愤激：

```ts
topicCoef =
  cardTopic === currentTopic
    ? 10
    : 6

angerCoef = 10
```

每次伤害还有：

```text
RandInt(5) = 0..4
```

最终：

```ts
hpDamage =
  trunc(
    (attack + RandInt(5))
    * angerCoef
    * levelCoef
    * topicCoef
    / 1000
  )
```

### 6.1 同智力 golden table

同智力时：

```text
attack=100
roll=0..4
```

| 普通牌 | 当前话题 | 非当前话题 |
|---|---:|---:|
| 小 | 100～104 | 60～62 |
| 中 | 150～156 | 90～93 |
| 大 | 200～208 | 120～124 |

非常重要：

> 当前话题小牌虽然可以在胜负判定中压过非当前大牌，但它的心理伤害约100；非当前大牌若在其他回合获胜，伤害约120。

因此“牌的比较强度”和“伤害强度”不能复用同一个数值。

## 7. 普通牌造成的怒气

话题牌胜利后，败方怒气增加：

```ts
stressDamage = {
  small:  10,
  medium: 15,
  large:  20
}
```

数据注释：

```text
8b338c
```

平局：

```text
双方各 +15
```

心理伤害与怒气伤害是两个独立字段。

## 8. 大喝

大喝不是“小/中/大”话题牌。

固定：

```text
levelCoef = 15
topicCoef = 12
```

普通状态 `angerCoef=10`。

所以：

```ts
shoutDamage =
  trunc(
    (attack + RandInt(5))
    * 10
    * 15
    * 12
    / 1000
  )
```

同智力：

```text
180..187
```

怒气：

```text
+15
```

攻略说“大喝攻击力固定”，准确解释应是：

> 大喝的牌等级/话题系数固定，不读取普通牌的小/中/大；但最终心理伤害仍读取出牌者 attack 和 0..4 随机值。

## 9. 诡辩的心理伤害语义

`Attack()` 中，若胜者使用诡辩：

1. 读取**对方刚出的牌**；
2. 若对方是普通话题牌；
3. 用诡辩使用者自己的 `attack`；
4. 但把对方话题牌的 level/topic 作为伤害输入；
5. 伤害反弹给原话题牌使用者。

因此：

```text
诡辩本身没有一个固定 hpDamage
```

它是“拿对方话题牌作为伤害模板，使用诡辩者的 attack 进行反弹”。

如果对手不是普通话题牌，这条普通话题伤害反弹不发生。

## 10. 无视 / 镇静 / 激昂：不是普通心理伤害牌

### 无视

赢回合，但：

```text
hpDamage = 0
对方 stress += 30
```

所以“无视 power=120”绝不能被当成120心理伤害。

### 镇静

它属于附加效果：

```ts
stressDamage =
  -max(opponentStress / 2, 30)
```

默认作用于对方怒气；遇诡辩时存在反射语义。

### 激昂

```text
stress += 40
```

同样存在与诡辩交互的反射语义。

因此 E15 应在实现层明确区分：

```text
cardPower
hpDamage
stressDamage
effect
```

四个概念。

## 11. 愤激对普通心理伤害的影响

### 小心 / 刚胆

愤激中：

```text
topicCoef = 10
angerCoef = 10
```

即不再承受“非当前话题 ×0.6”的伤害惩罚。

刚胆还会把自己的**牌力**强制为100：

```text
普通牌 / 诡辩大多被压过
但仍低于大喝110、无视120
```

注意这是胜负 power 层，不是直接把 hpDamage 设为100。

小心则把手中普通话题牌连续打出，每张仍调用同一个 `CalcHpDamage()`。

### 冷静

愤激中：

```text
angerCoef = 15
topicCoef = 6
```

伤害函数照常运行。

同时冷静每回合恢复再考；重抽后还有40%概率额外拿到当前话题“大”牌。

### 猪突

不是普通牌倍率。

进入愤激时直接：

```ts
hpDamage = 200 + martial
stressDamage = trunc(hpDamage / 15)
```

## 12. 牌数内部口径

```ts
maxCardCount =
  INT < 70 ? 4 :
  INT < 80 ? 5 :
  INT < 90 ? 6 :
             7
```

但 `card[0]` 固定为“再考”。

所以玩家实际可出的牌：

```text
INT <70   : 3
70..79    : 4
80..89    : 5
>=90      : 6
```

这也修正了早期“>90才6张”的错误边界：**智力90已经是6张可出牌**。

## 13. 原 fallback 删除

旧工程近似：

```ts
ordinaryBase =
  10 + 2*max(cardAdvantage,0)

intRatio =
  (attackerINT+50)/(defenderINT+50)

psychDamage =
  round(ordinaryBase*intRatio)
```

全部删除。

正确结构：

```ts
const attack =
  calcDebateAttack(myINT, opponentINT)

const winner =
  compareCardPower(
    currentTopic,
    myCard,
    opponentCard
  )

if (winner) {
  resolveCardEffect({
    attack,
    card,
    currentTopic,
    angerState,
    rng
  })
}
```

## 14. 版本边界

当前公式来自 PC-PK 导向的 C++ 逆向翻译：

```text
pcPkDebateCore:
  reverse-transcribed-cross-validated
```

同期 2006 Vanilla 官方/攻略资料确认机制层高度一致：

- 话题优先；
- 大/中/小；
- 五种话术；
- 心理槽；
- 怒气；
- 四性格愤激。

但在 Vanilla EXE 未逐指令回归前：

```text
Vanilla 的 131 / 40 / 10 / 15 / 20 / 6 / 10 等连续常量
= compatibility-assumption
```

主机版仍 open。

## 15. E15 关闭与保留的边界

### 已关闭

- 普通话题牌心理伤害；
- 普通牌怒气增加；
- 大喝通用伤害；
- 牌力与伤害的分离；
- 诡辩普通话题牌反弹伤害语义；
- 无视/镇静/激昂与 hpDamage 的边界。

### 仍 open

- 特定人物 `DebatePersonBehaviours` 是否逐项对应原版隐藏硬编码；
- Vanilla EXE 连续常量；
- PS2/Wii 差异；
- 追击 / 留情等结束结算的跨平台精确差异。

## 16. 来源

- C++逆向翻译：
  - https://github.com/tankyc/sango_infinity/blob/main/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs
- 官方同期介绍：
  - https://www.4gamer.net/games/024/G002453/20060210150000/
- 同期中文攻略：
  - https://www.gamersky.com/handbook/200604/22092.shtml
- 日文攻略 Wiki：
  - https://w.atwiki.jp/sangokushi11/pages/141.html
