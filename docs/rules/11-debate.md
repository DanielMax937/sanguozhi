# 舌战（论战）

## 1. 基本流程

`[COMMON][empirical-high]`

- 双方以心理槽为 HP。
- 当前话题为道理/时节/故事之一。
- 每回合比较所出牌；失败方损失心理值并增加愤怒槽。
- 第一回合由挑战者先手；之后由上一回合胜者先手。
- 心理槽先归零者失败。

来源：https://w.atwiki.jp/sangokushi11/pages/141.html

## 2. 手牌数 —— 纠错

正确区间：

- 智力 <70：3 张
- 70–79：4 张
- 80–89：5 张
- ≥90：6 张

因此：
- 70 = 4
- 80 = 5
- 90 = 6

反编译 C++ 里内部 `maxCardCount` 实际是 4/5/6/7，因为第 0 格固定给“再考”；扣掉这格后，玩家看到的可出牌数量正好仍是 3/4/5/6。

旧文档“>90 / >80 / >70”的边界是错误的，已删除。

PCPK 1.1 有特殊场景诸葛亮 7 张的报告；PS2PK 也可能存在平台差异。

## 3. 再考 —— 纠错

- 足场共 4 段。
- 心理槽每减少约 1/4，足场崩一段。
- **每次足场崩塌后，再考按钮恢复**。
- 正常整场约可使用 4 次再考。

旧文档“先手一局一次、后手约每两回合一次”的规则没有足够依据，已移除。

## 4. 话术牌

### 无视
完全无效化对方本回合牌效，但会显著增加愤怒。

### 大喝
除无视/大喝等对应克制外压制多数牌，并造成较大心理伤害。

### 诡辩
可压制多数普通牌并造成话题/反伤类效果；具体匹配表应数据化。

### 镇静
降低对方愤怒，资料常见约降至一半附近。

### 愤怒
愤怒槽满后进入性格相关的憤激状态。

## 5. 性格与憤激

`[PC-PK-oriented][reverse-engineered]`

内部 `angerTimer`：

- 小心：1
- 猪突：1
- 冷静：4
- 刚胆：4

触发回合末也会递减，因此攻略中“冷静/刚胆约持续3回合”的观察与内部 timer=4 不矛盾。

效果：

- **小心**：进入连续攻击，把手中所有普通话题牌逐张打出；每张使用正常心理伤害公式，但愤激时 `topicCoef=10`。
- **刚胆**：愤激期间自己的牌力强制为100；普通牌伤害 `topicCoef=10`。无视120、大喝110仍可压过。
- **冷静**：`angerCoef=15`，并每回合恢复再考；再考后 40% 概率额外获得当前话题“大”牌。
- **猪突**：进入愤激时立刻造成：
  ```ts
  hpDamage = 200 + martial
  stressDamage = trunc(hpDamage / 15)
  ```

来源：
- https://github.com/tankyc/sango_infinity/blob/master/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs
- https://w.atwiki.jp/sangokushi11/pages/141.html

## 6. 智力差与舌战一击决胜

### 舌战攻击力

`[PC-PK-oriented][reverse-engineered]`

```ts
attack =
  100
  + trunc(
      40 * (myINT - opponentINT)
      / (131 - myINT)
    )
```

双方同智力时 `attack=100`；智力差相同但绝对智力不同，结果可不同。

### 开场一击决胜

原代码条件：

```ts
if (
  myINT > 80 &&
  myINT > opponentINT + 10 &&
  attack + randInt(0,199) >= 270
) {
  instantWin()
}
```

因此在前两个硬门槛成立时：

```ts
pInstantWin =
  clamp((attack - 70) / 200, 0, 1)
```

例如 `attack=100` 时约15%；attack越高概率越大。

所以旧文档“约15智力差、概率未知”已删除。

来源：
- https://github.com/tankyc/sango_infinity/blob/master/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs

## 7. 普通话题牌心理伤害：精确公式

`[PC-PK-oriented][reverse-engineered]`

心理槽内部上限为1000。

话题牌等级系数：

```ts
small  = 10
medium = 15
large  = 20
```

未愤激时：

```ts
topicCoef =
  cardTopic === currentTopic
    ? 10
    : 6

angerCoef = 10
```

伤害：

```ts
hpDamage =
  trunc(
    (attack + randInt(0,4))
    * angerCoef
    * levelCoef
    * topicCoef
    / 1000
  )
```

同智力（`attack=100`）时：

| 牌 | 当前话题 | 非当前话题 |
|---|---:|---:|
| 小 | 100～104 | 60～62 |
| 中 | 150～156 | 90～93 |
| 大 | 200～208 | 120～124 |

牌力只决定胜负，不把“牌力差”加进心理伤害。

普通话题牌同时增加败方愤怒：

```text
小 +10
中 +15
大 +20
```

平局双方各 +15。

大喝使用固定 `levelCoef=15`、`topicCoef=12`；同智力时约180～187心理伤害，仍受 attack 与 0～4 随机扰动，不是所有武将绝对固定扣同一个数。

来源：
- https://github.com/tankyc/sango_infinity/blob/master/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs
- https://www.4gamer.net/games/024/G002453/20060210150000/
- https://www.gamersky.com/handbook/200604/22092.shtml

### 版本边界

上述连续常量来自 PC-PK 导向的 C++ 移植。Vanilla 同期资料确认机制高度一致，但在无印 EXE 回归前，Vanilla 仍标 `compatibility-assumption`。
