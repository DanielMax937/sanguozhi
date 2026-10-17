# E14 单挑连续公式

> 2026-10-17另增[O09a普通单挑独立session](duel-ordinary-session-v1.md)：三方针普通子集，全部人物hook关闭，加入条件随机、先攻、双计数、低HPrequested增益、实际writer与终局保存重放。该新增代码/纸面场景仅静态编写，未运行；本页旧Python raw0..13、HP100专项不覆盖新低HP/writer/session，也不被称为本轮通过。非全部单挑，E14原生全链和原43组不关闭。

更新：2026-10-15。范围：固定现代转录来源参考（`translated-source-reference`）；原生 PC-PK/PK1.1 等价未证。

## 1. 本轮结论

此前 open 项：

> “武力绝对值 + 武力差 → 命中 / 格挡 / 实际伤害”的完整连续公式

当前得到可复算的**现代转录参考**，不能关闭原生通用核心；原43组未决证据主题不变。

来源与有限交叉线索分层如下：

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

参考公式与这些有限锚点一致；来源自述、末端指令片段和少量 Wiki 数值不能证明完整链是原生公式。

## 2. 证据边界

### 2.1 可作为 translated-source-reference 的内容

- 武力 → `actionRatio`；
- 四方针底层系数；
- 普攻基础伤害；
- Hit / Dodge / Block 三态；
- 格挡伤害；
- 攻击重视会心连击；
- 通用必杀伤害；
- 气合 / 坚守倍率；
- 斗志增长通用公式。

### 2.2 仍未核实的原生边界

- 整条公式链与原生 PC-PK/PK1.1 的等价性、原始 C++ 来源链及 stock/patch 身份；
- 吕布、关羽、张飞、赵云、马超、许褚、黄忠等人物硬编码例外；
- Vanilla EXE 与 PC-PK 是否逐指令完全一致；
- PS2 / Wii 特殊差异。

现代开源项目已把部分人物特例重构成数据驱动 hook。以下公式属于该固定来源；本次派生回归显式令 damage hook 为恒等映射，不认证完整原生行为。

## 3. 四方针静态表

来源表标注：`8B1750 StanceCoef`，固定来源行276–279；地址注释不是原表字节认证。

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

在这一末端算术步骤上吻合；不能由此认证上游 `duelScore`、方针表、完整单挑链或原生版本身份。

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

## 7. 来源中的普通 Hit / Dodge / Block 流程

来源 `CalcActionResult:2719–2720` 对无敌先返回 Blocked，早于随机命中/闪避；这不等于普通格挡伤害。以下仅为无敌早返之后的普通结果选择，checker 不覆盖完整随机判定。

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

先有结果分支前伤害 `n`。无敌在普通结果之前独立返回零 HP 伤害，斗志输入见 §12.1；以下仅列非无敌结果。

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

固定现代来源按顺序：

```ts
damage = baseDamage

// 来源 Difficulty.Easy
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
→ 来源 Difficulty.Easy
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

输入 `value` 是 `CalcDamage` 的 raw spirit 输出，不是最终 HP 伤害。以下 `receivingSide` 表示守方调用 `attack=false`，即使 dodge/无敌也成立，不表示实际命中。返回值是 requested gain，未应用斗志上限或 writer。

```ts
if (value <= 0)
  return 0

n = value
minimum = 3

if (
  receivingSide
  && (stance === DEFENSE
      || stance === SPIRIT)
)
  minimum = 5

n = max(n, minimum)

n = trunc(
  n * stance.spiritGain / 7
)

if (receivingSide)
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

仅在该转录来源中，“剑提高斗志”的系数可写为：

```text
剑：最终斗志增长 ×3/2
```

### 12.1 普通结果与独立无敌分支的 raw spirit

固定来源 `CalcDamage:2630–2676` 先令攻守 raw spirit 均为结果分支前的 `n`，再按下表处理。所有除法逐步向0截断，不合并乘除。

| 分支 | HP伤害 | 攻方raw spirit | 守方raw spirit |
|---|---:|---:|---:|
| Hit（所有方针） | n | n | n |
| 普通 Block，守方 Defense | max(trunc(n×3/10),1) | trunc(n×3/4) | max(trunc(n/2),1) |
| 普通 Block，其他方针 | trunc(n/2) | trunc(n×3/4) | max(trunc(n/2),1) |
| Dodge，守方 Defense | 0 | 0 | n |
| Dodge，守方 Spirit | 0 | 0 | max(trunc(n/2),1) |
| Dodge，守方 Attack/Fury | 0 | 0 | 0 |
| 无敌，守方 Defense/Spirit | 0 | 0 | max(trunc(n/2),1) |
| 无敌，守方 Attack/Fury | 0 | 0 | 0 |

无敌分支2630行初始化后在2645–2652提前返回，优先于普通 Hit/Block/Dodge。Defense dodge 在2667–2668直接返回，保留完整守方 `n`；Spirit 才在2670折半且最低1。不能将 Defense dodge、Spirit dodge 和无敌合并为同一分支。

`ActionAnim:2790–2801` 将两项 raw spirit 分别传给 `CalcSpiritGain`，攻方 `attack=true`、守方 `attack=false`。限定双方已解析武力100、攻方 Attack、普通攻击、双方HP100、来源 Difficulty.Normal、无物品/增益、damage hook 恒等时，`actionRatio=50`、`n=12`：

| 情况 | (HP伤害, 攻方raw, 守方raw) | (攻方requested gain, 守方requested gain) |
|---|---|---|
| Defense dodge | (0, 0, 12) | (0, 16) |
| Spirit dodge | (0, 0, 6) | (0, 10) |
| Attack/Fury dodge | (0, 0, 0) | (0, 0) |
| Defense 无敌 | (0, 0, 6) | (0, 7) |
| Spirit 无敌 | (0, 0, 6) | (0, 10) |
| Attack/Fury 无敌 | (0, 0, 0) | (0, 0) |
| Defense 普通 Block | (3, 9, 6) | (5, 7) |
| Spirit 普通 Block | (6, 9, 6) | (5, 10) |
| Defense Hit | (12, 12, 12) | (6, 16) |

Defense dodge：12 → trunc(12×8/7)=13 → trunc(13×5/4)=16，不能融合为17；Spirit dodge：raw6 → 8 → 10；Defense无敌：raw6 → 6 → 7。

checker 的两个纯参考helper仅接受整数n/raw value的0..13回归域；它们不构成engine API。checker 在四方针上检查普通 hit/block/dodge 与无敌优先级，并保留奇数 `n=13` 的 Defense raw13 / Spirit raw6。synthetic `n=1` 检查 Spirit dodge 和 Defense/Spirit 无敌 raw1 的最低值；它只是分支算术边界，不声称所有普通战斗前提下可达。gain(value=0) 必须先返回0，正value1守方 Defense/Spirit 经minimum5分别请求6/8。

这些是现代参考的派生断言，不是原生实机 fixture；requested gain 不是经过cap300或writer后的实际斗志增量。

## 13. 来源 Difficulty 枚举边界

以下仅指现代来源的 `Easy / Normal / Hard` 标签，不默认对应原生各版本难度。普通伤害部分：

```text
Easy：
玩家打AI ×11/10
AI打玩家 ×4/5

Normal/Hard：
该伤害函数无统一倍率
```

斗志部分：

```text
Easy玩家 ×6/5

Hard玩家 ×4/5
Hard AI ×6/5
```

这些来源分支不能推定原生“超级单挑”的完整难度行为。

## 14. E14 参考层可复算，原生 exactness 仍 open

以下笼统表述在现代转录参考层已可细化：

```text
单挑的攻防、斗志和命中公式仍未知
剑提高斗志的系数未知
只按武力差决定伤害
```

参考算术可复算；本次只修来源分级、dodge/无敌斗志分支和小范围回归，不新增 engine API，不证明完整游戏实现。原43组未决证据主题不减。

## 15. 仍 open

1. 原生 PC-PK/PK1.1 全链等价、原始 C++ 来源链和 stock/patch 身份；
2. 特定人物隐藏补正的原 C++ 硬编码逐人还原；
3. Vanilla EXE 与 PC-PK 通用核心是否逐指令完全一致；
4. PS2 / Wii 的公式差异；
5. 某些人物/宝物例外在不同平台是否同值。

## 16. 固定来源与验证边界

现代来源 commit `a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef`；Duel.cs Git blob `d0e825097067c58c95c37e067d1c2a2688a74898`；保存的完整 connector content 原样 UTF-8/LF 共142829 bytes，SHA-256 `4c72e962a9b5dc07ae6bb26285c1e165a511c8c66d5b669520fd1d5b78e3ef07`。不归一化空白或换行。

行号：StanceCoef 276–279；CalcAttackDamage 1794–1805；CalcSpiritGain 2271–2323；CalcDamage 2573–2677（raw初始化2630–2631、无敌2645–2652、Block2657–2664、Dodge2665–2673）；CalcActionResult无敌早返2719–2720；raw→requested调用2790–2801。

`docs/sources/duel-continuous-core.json` 保存固定身份与行归属；checker 只核对这些字面pin并检查参考算术，不联网读取或重算上游hash，不是独立原生oracle，也不验证完整命中判定或引擎集成。

- `tankyc/sango_infinity`：
  - `Project/Assets/Sango/Scripts/Game/Duel/Duel.cs`
  - https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Duel/Duel.cs
- `sjn4048/311MemoryResearch`：
  - `内存资料/地址资料.txt`
  - https://github.com/sjn4048/311MemoryResearch/blob/master/内存资料/地址资料.txt
- 日文《三國志11攻略wiki》：
  - 一騎討ち：https://w.atwiki.jp/sangokushi11/pages/2481.html
  - 検証：https://w.atwiki.jp/sangokushi11/pages/30.html
  - 一騎討ちコメントログ：https://w.atwiki.jp/sangokushi11/pages/2484.html
