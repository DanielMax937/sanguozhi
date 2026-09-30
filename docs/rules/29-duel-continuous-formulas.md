# E14 单挑连续公式

更新：2026-09-30。主目标：PC-PK 导向通用单挑核心。

## 1. 本轮结论

此前 open 项：

> “武力绝对值 + 武力差 → 命中 / 格挡 / 实际伤害”的完整连续公式

现在可以关闭**通用核心**。

证据来自三层互证：

1. `tankyc/sango_infinity` 的 `Duel.cs` 明确标注由 `s11_sys_duel.h + s11_sys_duel.cpp` 翻译，并保留原地址区间与静态表；
2. SIRE / 311MemoryResearch 直接暴露单挑对比参数末端地址：
   ```text
   005097C3
   005097EB
   ```
   原字节 `6B C0 64 99 F7 F9` 解码为：
   ```text
   imul eax,eax,100
   cdq
   idiv ecx
   ```
   即正数语义下 `floor(100 * A / B)`；
3. 日文 Wiki 实测：
   - 武力相同基准伤害：攻击/防御/斗志重视 = 12 / 7 / 10；
   - 同样武力差5，100/95 与 80/75 的伤害不同，因此旧“只按武力差”表被撤回。

完整公式恰好同时解释这些现象。

## 2. 证据边界

### 2.1 可以升级为高置信 reverse-engineered / reverse-transcribed

- 武力 → `actionRatio`；
- 四方针底层系数；
- 普攻基础伤害；
- Hit / Dodge / Block 三态；
- 格挡伤害；
- 攻击重视会心连击；
- 通用必杀伤害；
- 气合 / 坚守倍率；
- 斗志增长通用公式。

### 2.2 不在本轮冒充通用公式的部分

- 吕布、关羽、张飞、赵云、马超、许褚、黄忠等人物硬编码例外；
- Vanilla EXE 与 PC-PK 是否逐指令完全一致；
- PS2 / Wii 特殊差异。

现代开源项目已经把部分人物特例重构成数据驱动 hook，所以本轮只提取 hook 之外的通用核心。

## 3. 四方针静态表

原表标注：`8B1750 StanceCoef`。

| 方针 | speed | hit | attack | block | attackSub | spiritGain |
|---|---:|---:|---:|---:|---:|---:|
| 攻击重视 | 42 | 71 | 16 | 12 | 3 | 4 |
| 防御重视 | 10 | 200 | 14 | 90 | 2 | 8 |
| 斗志重视 | 15 | 125 | 14 | 55 | 3 | 10 |
| 一击重视 | 5 | 71 | 16 | 22 | 3 | 7 |

静态结构还有两个未命名字段，当前不强行赋予业务语义。

## 4. 武力 → actionRatio

输入武力使用伤病修正后的单挑武力；人物隐藏修正属于额外例外层。

所有除法均按 C/C# 整数除法截断。

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

atkScore = duelScore(atkStr, defStr) ** 2
defScore = duelScore(defStr, atkStr) ** 2
sum = atkScore + defScore

if (atkScore >= defScore) {
  actionRatio =
    min(trunc(atkScore * 100 / sum), 99)
} else {
  actionRatio =
    100
    - min(trunc(defScore * 100 / sum), 99)
}
```

范围：

```text
1 .. 99
```

同武力严格为：

```text
50
```

### 4.1 可复算锚点

| 武力 | actionRatio |
|---|---:|
| 1 vs 1 | 50 |
| 80 vs 80 | 50 |
| 100 vs 100 | 50 |
| 100 vs 95 | 55 |
| 80 vs 75 | 52 |
| 100 vs 80 | 62 |
| 80 vs 60 | 60 |

所以两个看似矛盾的旧实测其实同时成立：

- 武力差0：绝对武力不改变基准 ratio；
- 同样差5：高武力区与中武力区 ratio 不同。

这就是 Wiki 删除“仅按武力差查伤害表”的原因。

## 5. SIRE 地址如何对应 ratio

SIRE 记录：

```text
005097C3: 6B C0 64 99 F7 F9
005097EB: 6B C0 64 99 F7 F9
```

解码：

```asm
imul eax,eax,100
cdq
idiv ecx
```

其社区修补版把中间乘法改成更安全的扩宽计算，目的是避免参数计算异常，而**没有改变最终“100×分子/分母”的数学语义**。

这与 `CalcActionRatio()` 最后：

```text
score² × 100 / (双方score²之和)
```

完全吻合，是对开源翻译公式的重要原地址交叉验证。

## 6. 普攻基础伤害

```ts
n = stance.attack
n = trunc(n * actionRatio / 50)
n = trunc(n * stance.attackSub * 7 / 27)
baseDamage = max(n, 3)
```

同武力 ratio=50：

```text
攻击重视：12
防御重视：7
斗志重视：10
```

一击重视虽然静态表可算出12，但正常行动逻辑不按普通攻击方式持续出手，不能把这个12理解成“一击重视常规每回合攻击”。

### 6.1 同武力差5的直接解释

攻击重视：

```text
100 vs 95:
ratio = 55
damage = 13

80 vs 75:
ratio = 52
damage = 12
```

这正好复现 Wiki 当年发现的反例。

## 7. Hit / Dodge / Block 完整流程

普通攻击先计算命中阈值：

```ts
pHit = atkStance.hit
pHit = trunc(
  pHit * (100 - defStance.block) / 80
)
pHit = trunc(
  pHit * actionRatio / 50
)
pHit += RandInt(10)  // 0..9
pHit = clamp(pHit, 10, 99)
```

然后：

```ts
if (Chance(pHit)) {
  result = HIT
} else if (Chance(calcDodgeChance(defender))) {
  result = DODGE
} else {
  result = BLOCK
}
```

所以“block”不是独立先掷一次，而是：

```text
没命中
且没闪避
=> 格挡
```

### 7.1 闪避概率

```ts
pDodge =
  10 + trunc(
    (defenderStr - attackerStr) / 3
  )

pDodge = clamp(pDodge, 5, 30)

if (defenderStance === DEFENSE)
  pDodge += 25
```

注意：

- 负数除法按 C/C# 向0截断；
- 防御重视的 +25 在 `5..30` clamp **之后**追加；
- 因此防御重视最终闪避概率范围可到 `30..55`。

## 8. 格挡 / 闪避后的伤害

先有完整命中伤害 `n`。

```ts
HIT:
  damage = n

BLOCK:
  if (defenderStance === DEFENSE)
    damage = max(trunc(n * 3 / 10), 1)
  else
    damage = trunc(n / 2)

DODGE:
  damage = 0
```

同武力攻击重视：

```text
完整命中：12
普通格挡：6
防御重视格挡：3
```

与 Wiki 表一致。

## 9. 普攻后续倍率

原通用核心按顺序：

```ts
damage = baseDamage

// 初级
if (playerAttacksAI)
  damage = trunc(damage * 11 / 10)

if (aiAttacksPlayer)
  damage = trunc(damage * 4 / 5)

// 武器
if (hasCrescentHalberd)
  damage = trunc(damage * 9 / 8)
else if (hasLongWeapon)
  damage = trunc(damage * 10 / 9)

// 人物例外 hook：通用基线 ×1

// 气合
if (attackerHasAttackBuff)
  damage = trunc(damage * 5 / 4)

// 坚守
if (defenderHasDefenseBuff)
  damage = trunc(damage * 3 / 4)

// 攻击重视会心的每一击
if (action === ATTACK_CRITICAL)
  damage = trunc(damage * 3 / 4)
```

不能随意交换顺序，因为整数截断会产生1点级差异。

## 10. 攻击重视会心

```ts
actionCount = 1

if (action === ATTACK_CRITICAL)
  actionCount = 3 + RandInt(2)
```

即：

```text
3或4连击
```

每一击都重新走：

```text
Hit -> Dodge -> Block
```

不是3～4下必中。

同武力无其他修正：

```text
普通完整命中 12
会心单击完整命中 9
会心普通格挡 4
会心防御重视格挡 2
```

## 11. 必杀伤害

共同基础：

```ts
n = trunc(actionRatio * 20 / 55)
```

之后：

```text
气合/坚守
→ 武器
→ 人物例外
→ 必杀类型
→ 初级难度
→ 对手防御重视
→ 上限80
```

类型：

| 必杀 | 通用倍率 | ratio=50 基础伤害 |
|---|---:|---:|
| 必杀技 | ×6/5 | 21 |
| 急所 | ×1 | 18 |
| 无双 | ×3 | 54 |
| 暗器 | ×6/5 | 21 |
| 假退却 | ×3/2 | 27 |
| 气合 | 伤害0 | 0 |
| 坚守 | 伤害0 | 0 |

Wiki 等武力实测与该表一致。

## 12. 斗志增长连续公式

输入 `value` 来自该次攻击伤害链的斗志基础值。

```ts
if (value <= 0)
  return 0

n = value
minimum = 3

if (
  receivingHit
  && (stance === DEFENSE
      || stance === SPIRIT)
)
  minimum = 5

n = max(n, minimum)

n = trunc(
  n * stance.spiritGain / 7
)

if (receivingHit)
  n = trunc(n * 5 / 4)

if (hp < 30)
  n = n * 2
else if (hp < 50)
  n = trunc(n * 3 / 2)

// 难度
if (difficulty === EASY && player)
  n = trunc(n * 6 / 5)

if (difficulty === HARD) {
  if (player)
    n = trunc(n * 4 / 5)
  else
    n = trunc(n * 6 / 5)
}

// 剑
if (hasSword)
  n = trunc(n * 3 / 2)

return max(n, 1)
```

方针 `spiritGain`：

```text
攻击重视 4
防御重视 8
斗志重视 10
一击重视 7
```

因此旧“剑提高斗志，但系数未知”可以升级为：

```text
剑：最终斗志增长 ×3/2
```

### 12.1 Block / Dodge 对斗志输入的影响

通用伤害函数在结果分支还会调整斗志输入：

- 普通格挡：
  - 攻方输入 ×3/4；
  - 守方输入约 ×1/2；
- Dodge：
  - 攻方输入 = 0；
  - 守方只有在防御/斗志重视时保留约一半输入，否则0。

所以“伤害相同就一定涨同样斗志”也不成立。

## 13. 难度边界

普通伤害部分：

```text
初级：
玩家打AI ×11/10
AI打玩家 ×4/5

上级/超级：
该伤害函数无统一倍率
```

斗志部分：

```text
初级玩家 ×6/5

超级玩家 ×4/5
超级AI ×6/5
```

因此“超级单挑难”主要体现在斗志、一击必杀和其他 AI 分支，不是把全部普通伤害简单乘一个超级倍率。

## 14. E14 关闭的旧 open 项

以下旧表述撤回：

```text
单挑的攻防、斗志和命中公式仍未知
剑提高斗志的系数未知
只按武力差决定伤害
```

通用 PC-PK 导向核心现已可实现。

## 15. 仍 open

1. 特定人物隐藏补正的原 C++ 硬编码逐人还原；
2. Vanilla EXE 与 PC-PK 通用核心是否逐指令完全一致；
3. PS2 / Wii 的公式差异；
4. 某些人物/宝物例外在不同平台是否同值。

## 16. 来源

- `tankyc/sango_infinity`：
  - `Project/Assets/Sango/Scripts/Game/Duel/Duel.cs`
  - https://github.com/tankyc/sango_infinity/blob/main/Project/Assets/Sango/Scripts/Game/Duel/Duel.cs
- `sjn4048/311MemoryResearch`：
  - `内存资料/地址资料.txt`
  - https://github.com/sjn4048/311MemoryResearch/blob/master/内存资料/地址资料.txt
- 日文《三國志11攻略wiki》：
  - 一騎討ち：https://w.atwiki.jp/sangokushi11/pages/2481.html
  - 検証：https://w.atwiki.jp/sangokushi11/pages/30.html
  - 一騎討ちコメントログ：https://w.atwiki.jp/sangokushi11/pages/2484.html
