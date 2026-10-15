# 单挑（一骑讨）

> E14现为固定现代 `translated-source-reference`；已纠正dodge/独立无敌斗志分支，原生PC-PK/PK1.1全链及stock/patch身份仍未证、原43组不减。固定身份与回归边界见 `29-duel-continuous-formulas.md`。

## 1. 胜负与回合

`[COMMON][empirical-high]`

- 双方以体力为核心。
- 体力归零败北；成功撤退也结束单挑。
- 50 合未决出则平局。

## 2. 单挑公式：现代来源自述的 C++ 转录参考

`[modern-reference][translated-source-reference]`

`sango_infinity` 的 `Duel.cs` 自述由 `s11_sys_duel.h + s11_sys_duel.cpp` 翻译，保留命名、数据地址与代码区间注释。这不是独立核实的原始C++来源链；以下仅为固定现代参考，damage hook按恒等基线讨论，不将现代人物行为视为原版规则。

来源：
- https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Duel/Duel.cs
- https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Duel/DuelEnum.cs

### 2.1 四方针底层系数

来源注释标作 `8b1750 StanceCoef` 的表（未认证原表字节）：

| 方针 | speed | hit | attack | block | attackSub | spiritGain |
|---|---:|---:|---:|---:|---:|---:|
| 攻击重视 | 42 | 71 | 16 | 12 | 3 | 4 |
| 防御重视 | 10 | 200 | 14 | 90 | 2 | 8 |
| 斗志重视 | 15 | 125 | 14 | 55 | 3 | 10 |
| 一击重视 | 5 | 71 | 16 | 22 | 3 | 7 |

另两个未命名字段暂不赋予语义。

### 2.2 武力 → actionRatio

所有运算按该来源 C# 整数截断。

```ts
function duelScore(selfStr, otherStr) {
  const hi = max(selfStr, otherStr)
  const lo = min(selfStr, otherStr)

  const curve =
    trunc(max(hi - 5, 0) ** 2 / 1500)

  const decadeGap =
    max(trunc(hi / 10) - trunc(lo / 10), 1)

  const x = selfStr - lo

  const c =
    max(x + decadeGap - curve - 1, 0)
    * decadeGap

  const y = min(x, curve)
  const z = y + decadeGap - curve

  const d =
      y * (curve - y)
    + trunc(y * (y + 1) / 2)
    + trunc(max(z, 0) * max(z - 1, 0) / 2)

  return 180 + c + d
}

a = duelScore(atkMartial, defMartial) ** 2
d = duelScore(defMartial, atkMartial) ** 2

if (a >= d)
  actionRatio = min(trunc(a * 100 / (a + d)), 99)
else
  actionRatio = 100 - min(trunc(d * 100 / (a + d)), 99)
```

锚点：

- 1/1 → 50
- 100/100 → 50
- 100/95 → 55
- 80/75 → 52
- 100/80 → 62
- 80/60 → 60

所以“同武力差不一定同伤害”与“武力差0时绝对值不影响基础伤害”可以同时成立。

实测交叉：
- https://w.atwiki.jp/sangokushi11/pages/30.html
- https://w.atwiki.jp/sangokushi11/pages/2484.html

### 2.3 SIRE 原地址交叉验证

311MemoryResearch 的 SIRE 地址资料直接记录：

```text
005097C3: 6B C0 64 99 F7 F9
005097EB: 6B C0 64 99 F7 F9
```

原字节可解码为：

```asm
imul eax,eax,100
cdq
idiv ecx
```

也就是正值情况下的：

```text
trunc(100 * numerator / denominator)
```

社区补丁把这里替换成使用更宽中间值的乘除实现，是为了修正极端参数时的计算异常；数学语义仍然是“分数 ×100 / 总量”。这与上面的 `score² / (双方score²之和)` 末端完全吻合。

E14的完整链来自现代转录参考；末端PC地址片段和有限Wiki数值只交叉支持局部算术，不能升级为整条原生公式、方针原表或版本身份认证。

## 3. 普攻：命中 / 格挡 / 闪避 / 伤害

### 3.1 基础伤害

```ts
n = stance.attack
n = trunc(n * actionRatio / 50)
n = trunc(n * stance.attackSub * 7 / 27)
damage = max(n, 3)
```

同武力 `actionRatio=50`：

- 攻击重视：12
- 防御重视：7
- 斗志重视：10
- 一击重视：12

与旧实测表完全一致。

### 3.2 命中结果

```ts
pHit = atkStance.hit
pHit = trunc(pHit * (100 - defStance.block) / 80)
pHit = trunc(pHit * actionRatio / 50)
pHit += randInt(0, 9)
pHit = clamp(pHit, 10, 99)

if (chance(pHit)) {
  result = HIT
} else if (chance(calcDodgeChance(defender))) {
  result = DODGE
} else {
  result = BLOCK
}
```

闪避：

```ts
pDodge =
  10 + trunc((defMartial - atkMartial) / 3)

pDodge = clamp(pDodge, 5, 30)

if (defStance === DEFENSE)
  pDodge += 25
```

### 3.3 格挡伤害

```ts
HIT:
  damage = n

BLOCK:
  if (defStance === DEFENSE)
    damage = max(trunc(n * 3 / 10), 1)
  else
    damage = trunc(n / 2)

DODGE:
  damage = 0
```

同武力攻击重视：

- 完整命中 12
- 普通格挡 6
- 对手防御重视格挡 3

### 3.4 气合、坚守与武器

通用核心：

```ts
if (attackerHasAttackBuff)
  damage = trunc(damage * 5 / 4)

if (defenderHasDefenseBuff)
  damage = trunc(damage * 3 / 4)

if (hasCrescentHalberd)
  damage = trunc(damage * 9 / 8)
else if (hasLongWeapon)
  damage = trunc(damage * 10 / 9)
```

来源Easy还存在玩家/COM的11/10与4/5单挑伤害修正；来源Normal/Hard的普通攻击伤害在这段函数中没有统一倍率。

### 3.5 难度修正

`[modern-reference][translated-source-reference]`

现代来源的Difficulty枚举不是一个“单挑总倍率”，而是分散在多个子系统；下表仅指来源Easy/Normal/Hard，不认证原生难度映射：

| 子系统 | 来源Easy | 来源Normal | 来源Hard |
|---|---:|---:|---:|
| 玩家普通伤害 vs AI | ×1.1 | ×1 | ×1 |
| AI普通伤害 vs 玩家 | ×0.8 | ×1 | ×1 |
| 玩家斗志增长 | ×1.2 | ×1 | ×0.8 |
| AI斗志增长 | ×1 | ×1 | ×1.2 |
| AI对玩家一击必杀基础概率 | ×1 | ×4/3 | ×3/2 |
| 玩家对AI一击必杀基础概率 | ×1 | ×4/5 | ×1/2 |
| AI面对手动玩家的部分必杀尝试 | 基准 | ×1.2 | ×1.5 |

该参考的Hard修正分散于斗志与必杀分支，不是统一伤害倍率；不据此推定原生超级难度。

对应代码区间见 `Duel.cs` 的 `CalcDuelFtkTeam`、普通伤害、斗志增长和必杀尝试相关函数。

### 3.6 斗志增长连续公式

E14记录该来源的requested斗志增长，未应用cap/writer。`receivingSide`表示守方attack=false（dodge/无敌也成立），不表示实际命中：

```ts
if (value <= 0) return 0

n = value
minimum = 3

if (
  receivingSide &&
  (stance === DEFENSE || stance === SPIRIT)
)
  minimum = 5

n = max(n, minimum)
n = trunc(n * stance.spiritGain / 7)

if (receivingSide)
  n = trunc(n * 5 / 4)

if (hp < 30)
  n = n * 2
else if (hp < 50)
  n = trunc(n * 3 / 2)

if (difficulty === EASY && player)
  n = trunc(n * 6 / 5)

if (difficulty === HARD) {
  if (player) n = trunc(n * 4 / 5)
  else n = trunc(n * 6 / 5)
}

if (hasSword)
  n = trunc(n * 3 / 2)

return max(n, 1)
```

仅在该固定来源中，**剑使该次requested斗志增长 ×3/2**；原生等价仍待证。

方针 `spiritGain` 为：

```text
攻击重视 4
防御重视 8
斗志重视 10
一击重视 7
```

`value`来自raw spirit而非HP伤害：Defense dodge保留完整n；Spirit dodge取max(trunc(n/2),1)；Attack/Fury dodge为0。无敌独立优先返回HP0/攻方raw0，守方Defense/Spirit取半值最低1，其余0。HP100/来源Normal/无剑、n12时Defense dodge、Spirit dodge、Defense无敌分别请求16/10/7斗志；完整tuple及逐步取整见E14 §12.1。

## 4. 会心连击与必杀

### 4.1 攻击重视会心

```ts
actionCount =
  action === ATTACK_CRITICAL
    ? 3 + randInt(0, 1)
    : 1
```

会心为 3 或 4 连击，但**每一下独立重新判 Hit / Dodge / Block**。

每一下先：

```ts
damage = trunc(normalDamage * 3 / 4)
```

再按该下的 Hit/Block/Dodge 结果结算。

所以同武力攻击重视无其他修正时：

- 会心单次完整命中：9
- 普通格挡：4
- 对手防御重视格挡：2

### 4.2 必杀动作

通用基础：

```ts
n = trunc(actionRatio * 20 / 55)
```

动作倍率：

| 动作 | 斗志消耗 | 倍率/效果 | 同武力基础伤害 |
|---|---:|---|---:|
| 必杀技 | 100 | ×6/5 | 21 |
| 急所 | 200 | ×1 | 18 |
| 无双 | 300 | ×3 | 54 |
| 暗器 | 0 | ×6/5 | 21 |
| 假退却 | 0 | ×3/2 | 27 |
| 气合 | 100 | 伤害0，赋攻击 buff | 0 |
| 坚守 | 100 | 伤害0，赋防御 buff | 0 |

实际整数运算顺序必须保留：

```text
actionRatio×20/55
→ 气合 / 坚守
→ 武器
→ 人物特殊修正（通用基线×1）
→ 必杀类型倍率
→ 来源 Difficulty.Easy
→ 对手防御重视×3/4
→ cap 80
```

多次整数截断意味着交换顺序可能产生 1 点级差异。

其中开源 C++ 移植还区分：
- 方天画戟：×9/8；
- 其他长武器：×10/9。

旧 Wiki 在常用测试点观察到青龙偃月刀、蛇矛、方天画戟伤害相同，并不必然与该式冲突：例如同武力必杀时，18×9/8 和 18×10/9 整数截断后都先得到 20，最终同为24。这个宝物差异应保留为后续更多 ratio 点的 golden test，而不是仅凭一个整数伤害样本否定。

急所、无双、假退却的负伤率属于另一条函数，不和本节普通命中公式混合。

实测来源：https://w.atwiki.jp/sangokushi11/pages/2481.html


## 5. 援助/换人

- 同队其他武将可加入或替换。
- 嫌恶不会互相援助。
- 配偶/义兄弟/亲爱提升援助关系。

## 6. 单挑后的部队结果

`[PC-PK][empirical-high]`

- 败方武将体力归零时可能被俘；PCPK 下并非绝对捕获。
- 若败方**没有可接任副将**，该部队直接溃灭。
- 若有副将可接任：
  1. 新主将接管；
  2. 超过新主将指挥兵力上限的兵先被裁掉；
  3. 剩余兵力再 **-30%**；
  4. 部队气力 **-15**。
- 名马提高/保证撤退；捕缚、强运等另行作用。

来源：https://w.atwiki.jp/sangokushi11/pages/2481.html

功绩方面，单挑胜利通常 +100，拒绝挑战为 0；武力经验胜/平/负 = +10/+3/+1。

来源：
- https://w.atwiki.jp/sangokushi11/pages/113.html
- https://w.atwiki.jp/sangokushi11/pages/79.html

## 7. 骑兵战法触发强制单挑

`[PC-PK中心][empirical-high]`

骑兵战法成功后会先从部队中选择一个发起武将（通常偏向武力最高者），再判断能否强制进入单挑。

### 禁止触发条件

以下任一满足则不触发：

1. 发起武将为最谨慎/胆小性格；
2. 发起者体力不高于性格阈值：
   - 小心 80
   - 冷静 70
   - 刚胆 60
   - 莽撞 50
3. 己方兵力 > 敌方 2 倍；
4. 即使未超过2倍，但己方绝对兵力比敌方多 >2500；
5. 己方部队“单挑综合分”比敌方低 30 以上。

### 触发率

```
A = (发起武将体力 + 200) * 武力² * 0.00005
B = 宝物加成
C = 0 if 发起者是君主 or 武力>95 else 1
D = 性格修正：小心0 / 冷静0 / 刚胆1 / 莽撞3

forcedDuelRate = (A + B) * 0.05 - C + D
```

宝物按类型取该类型最大值，不同类型可叠加；方天画戟的示例加成为 10。

- 突击、突破、突进触发率相同。
- 战法是否会心不改变强制单挑率。

来源：
https://www.ptt.cc/man/Koei/D802/D96B/D4AA/M.1371726847.A.536.html

## 8. 剩余未确认

E14仅提供上述链的固定现代转录参考，原生PC-PK/PK1.1全链等价、原始C++来源链和stock/patch身份仍open；原43组不减。

剩余主要是：

- 吕布、关羽、张飞、黄忠等**特定人物例外**在原 C++ 中的完整硬编码；当前开源移植已将其重构为数据驱动配置，需要单独逐人核回原作。
- 各性格对接受玩家主动挑战的准确概率。
- 单挑结束后的所有平台一致俘虏概率。
- Vanilla EXE及PS2/Wii与该现代参考的逐版本等价均未证。
