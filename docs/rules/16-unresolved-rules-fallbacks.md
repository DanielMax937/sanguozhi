# 15 项未决规则：逐项证据核对与引擎 Fallback

> 2026-09-29 第五轮证据审计。
>
> 目的：对 `13-open-exactness.md` 的 15 项逐条检索。找到可靠原作公式时直接升级；找不到时给出可运行、可替换、可做回归测试的 `provisional-engine-rule`。
>
> **原则：fallback 不是原作事实。** 后续若通过反汇编、存档批测或更可靠资料取得精确式，只替换 fallback，不改变 Command / Event 接口。

---

## 1. 征兵精确数量 / 治安下降

### 结论：PC-PK 已由反汇编锁定

`[PC-PK1.1][reverse-engineered]`

本项不再使用 fallback。311MemoryResearch 对 `San11PK.exe` 的两个原函数做了逐指令标注：

- `005C3610`：计算征兵数量
- `005C3A50`：执行征兵

定义：

- `O` = 征兵前城市治安
- `C` = 最多 3 名执行武将的魅力之和
- `F` = 名声倍率：任一执行武将有“名声”则 1.5，否则 1.0
- `B` = 兵舍等级倍率：Lv1=1.0、Lv2=1.2、Lv3=1.5

核心数量：

```ts
base = 1000 + floor((O + 20) * C / 20)
withFame = floor(base * F)
recruits = floor(withFame * B)

if (difficulty === "super" && owner === "AI") {
  recruits *= 2
}

if (underEnemyPressure) {
  recruits = floor(recruits / 2)
}

actualAdded = min(recruits, troopCap - currentTroops)
```

因此旧 fallback 中两点已被推翻：

1. **治安直接进入征兵数量公式**，不是只通过后续风险间接作用。
2. **兵临城下是直接减半**，不是旧 fallback 的 ×0.8。

### 征兵导致的治安下降

`[PC-PK1.1][reverse-engineered]`

执行函数直接给出：

```ts
orderLoss = floor(actualAdded / (C + 100))
publicOrder -= orderLoss
```

注意分子是**考虑城市兵力上限后实际加入的兵力**，不是未裁剪的理论征兵量。

“名声使治安下降约增加 50%”不是另有一条独立的 `×1.5` 治安惩罚；实际是名声先令征兵量 ×1.5，随后治安损失按实际征兵量计算，所以在整数取整边界外通常表现为约 1.5 倍。

### 可复算锚点

治安100、魅力100×3、Lv3、无名声：

```
C = 300
base = 1000 + floor(120 * 300 / 20) = 2800
recruits = floor(2800 * 1.5) = 4200
orderLoss = floor(4200 / 400) = 10
```

与日文攻略 Wiki/旧玩家实测“魅力100三人、Lv3一次 4200”吻合。

同条件任一人有名声：

```
recruits = 6300
orderLoss = floor(6300 / 400) = 15
```

这也解释了社区长期记录的“名声征兵量 +50%，治安下降也约 +50%”。

### 兵临城下范围：只剩一个边界口径需要回归测试

减半本身已由汇编确认。范围口径存在资料表述差异：

- 官方 PK 说明书明确写“都市周围 **2 格** 有敌部队时征兵量下降”；
- 311MemoryResearch 对被调用通用判定函数的注释写作“城市 3 格、港关 2 格”。

由于征兵只发生在都市，且官方说明书的玩家口径更直接，引擎暂采用“**城市周围 2 格**”；同时保留一个边界 golden test，后续直接用距离 2/3 的敌军存档验证。不要把逆向文件里的“3格”注释直接升级成已确认的游戏口径。

### 其他同函数副作用

- 300 金、20 行动力、最多 3 人。
- 每名执行武将：魅力经验 +2、功绩 +50。
- 新征士兵气力 = `floor(征兵前治安 / 2)`。
- 新旧士兵气力按人数混合，最终城市气力最低为 20。
- 超级难度 AI 征兵量 ×2。

### Vanilla 版本边界

`[VANILLA][empirical-high / compatibility-assumption]`

目前取得的是 PC-PK 可执行文件反汇编，不是 Vanilla EXE。2006 年无印时期资料已经确认魅力、治安、名声、300金、20行动力、最多3人等同一套机制；无印也不存在 Lv2/Lv3 兵舍。

因此在拿到 Vanilla 二进制反证之前：

```ts
vanillaFormula = sameCoreFormula
B = 1.0
```

但证据标签保持 `empirical-high`，不把 PK 反汇编跨版本冒充 Vanilla 源码事实。

来源：
- 311MemoryResearch：`内存资料/整理/Func-内政01-计算征兵数量.txt`
  https://github.com/sjn4048/311MemoryResearch/blob/master/内存资料/整理/Func-内政01-计算征兵数量.txt
- 311MemoryResearch：`内存资料/整理/Func-内政02-执行征兵.txt`
  https://github.com/sjn4048/311MemoryResearch/blob/master/内存资料/整理/Func-内政02-执行征兵.txt
- 官方 PK 说明书：
  https://cdn.akamai.steamstatic.com/steam/apps/628070/manuals/32sangokushi11wpk_manual.pdf
- 日文 Wiki：名声 +50%
  https://w.atwiki.jp/sangokushi11/pages/13.html
- 日文 Wiki/旧 2ch 实测：魅力100×3、Lv3=4200
  https://w.atwiki.jp/sangokushi11/pages/1937.html
- SIRE v1.26/1.27 参数说明：兵营征兵倍率、兵临城下征兵数量正常等开关
  https://dl.3dmgame.com/patch/26091.html

---

## 2. 普通登用概率

### 结论：硬门槛与最终判定链已反汇编；仅内部连续概率函数仍缺函数体

`[PC-PK1.1][reverse-engineered-partial]`

311MemoryResearch 已定位并逐指令整理原版 PK 的登用调用链：

- `004AFD60`：计算登用是否成功
- `004AF7D0`：先处理“必成功 / 必失败”关系门槛
- `005C4F80`：`GetHiringSuccessRate`，计算 0–100 的连续成功概率
- `005BA4C0`：正常登用最终使用的确定性比较值生成器

后续 SIRE 开发资料也把 `005C4F80` 命名为 `GetHiringSuccessRate`，确认它就是原游戏的登用成功率函数。

### 1. 硬门槛优先于概率

`[COMMON mechanism / PC-PK reverse + empirical-high]`

反汇编显示 `004AFD60` **一定先调用 `004AF7D0`**；只有既非必成也非必败时才进入连续概率函数。日文攻略 Wiki / 旧 2ch 长期整理给出的判定顺序为：

1. 目标配偶属于第三方势力，且目标原势力仍有支配都市 → 失败
2. 目标配偶是执行者或执行势力君主 → 成功
3. 目标嫌恶执行者或执行势力君主 → 失败
4. 执行者或执行势力君主是目标义兄弟 → 成功
5. 目标 `忠诚 + 义理 > 96` → 普通登用失败
6. 目标义兄弟的长兄已在执行势力 → 成功
7. 目标配偶已在执行势力 → 成功
8. 目标亲爱当前君主 → 失败
9. 目标同时亲爱执行势力君主与执行者 → 成功

亲爱/嫌恶专题还能交叉确认：
- 亲爱某君主时对该君主存在强制成功关系；
- 同时通常拒绝其他君主；
- 配偶/义兄弟可覆盖部分普通关系限制；
- 未发现登用失败、逃亡、下野等还存在“禁止仕官期”。

因此这些关系**不应该折算成 +20%、-30% 之类分数**，而应作为概率计算之前的硬分支。

### 2. 正常玩家登用不是每次重新 Math.random()

`[PC-PK1.1][reverse-engineered]`

正常“人才→登用”调用 `004AFD60` 时第三参数固定为 0，并传入：

```ts
dateKey = day * 7 + month * 5 + year * 3
```

如果是异地登用，发出命令时的 `dateKey` 会写入任务，抵达后继续用同一个值判定。

在硬门槛未命中、`GetHiringSuccessRate` 返回 `p` 后，程序读取：

- 目标武将 ID
- 执行武将 ID
- 目标忠诚
- 执行武将魅力
- 执行者 ↔ 目标的相性差
- 上述 `dateKey`

并送入 `005BA4C0` 产生确定性比较值；汇编最终逻辑是：

```ts
success = deterministicValue < p
```

所以**同一组状态、同一执行者、同一目标、同一 dateKey 反复读档，结果应保持稳定**。改变日期、执行者、忠诚、魅力或相性差，都可能改变该确定值。

引擎因此绝不能为正常登用简单使用无种子的 `Math.random()`。

### 3. 义理的另一条反汇编分支

`004AFD60` 在第三参数非 0 的调用路径中，还会对 `GetHiringSuccessRate` 的结果做：

```ts
factor10 = min(10, 15 - 2 * giriInternal)
p2 = min(100, floor(p * factor10 / 10))
```

若内部义理为 0..4，则倍率分别约为：

```
1.0, 1.0, 1.0, 0.9, 0.7
```

但**正常玩家登用第三参数就是 0**，所以不能把这条外层倍率直接套到普通登用上；普通登用中义理是否、以及如何再次进入 `005C4F80`，仍需函数体才能完全确定。

### 4. 目前唯一仍缺失的东西

没有找到可公开检索、可交叉验证的 `005C4F80 GetHiringSuccessRate` 完整函数体。

可以确认它返回整数型 0–100 概率，而且目标/执行者完整指针都传入，因此它可以读取忠诚、义理、相性、魅力等数据；但在没有函数体的情况下，**不能把网上流传的“政治/魅力各加 X%”写成原版公式**。

现代 SIRE 的“新忠诚/登用意愿系统”提供了另一套可配置评分，但它明确是 MOD 新系统，不是原作 `005C4F80`，因此只可作为工程校准参考。

### 5. provisional-engine-rule：仅替代 GetHiringSuccessRate

硬门槛完全照上面执行；只有进入普通连续概率时才调用 fallback：

```ts
function fallbackHiringRate(target, executor, ruler) {
  const giri = clamp(target.giriInternal, 0, 4)

  // 在野/亡国无所属者没有可直接复刻的原版连续忠诚口径；
  // 60 仅为可配置的 engine baseline，不冒充原作常量。
  const effectiveLoyalty = target.hasForce
    ? target.loyalty
    : rules.hiring.unaffiliatedLoyaltyBaseline // default 60

  const loyaltyRoom = clamp(
    (96 - effectiveLoyalty - giri) / 60,
    0,
    1
  )

  const rulerAffinity = 1 -
    circularAffinityDistance(target.affinity, ruler.affinity) / 75

  const charismaFactor = 0.75 + executor.charisma / 200

  let p = loyaltyRoom
    * (0.5 + 0.5 * rulerAffinity)
    * charismaFactor

  // 只有硬关系才能得到真正 100%。
  p = clamp(p, 0, 0.95)

  return Math.floor(p * 100)
}
```

最终判定不使用运行时随机流，而模仿原版调用形状：

```ts
const p = fallbackHiringRate(target, executor, ruler)

const executorTargetAffinity =
  circularAffinityDistance(executor.affinity, target.affinity)

const roll = stablePercentHash(
  dateKey,
  target.id,
  executor.id,
  target.loyalty,
  executor.charisma,
  executorTargetAffinity
)

success = roll < p
```

这样至少满足目前所有可靠边界：

- `忠诚+义理>96` 在前置门槛直接失败；
- 忠诚越低，长期期望成功率越高；
- 君主相性越近，长期期望成功率越高；
- 执行者魅力提高长期期望成功率；
- 只有配偶/义兄弟/亲爱等硬关系产生真正必成；
- 相同状态下反复 S/L 结果固定；
- 换旬、换执行者或改变忠诚/魅力/相性后结果可变化。

这比旧 fallback 最大的改进不是某个系数，而是**恢复了原作“概率阈值 + 确定性伪随机比较值”的两层结构**。今后若取得 `005C4F80` 函数体，只需替换 `fallbackHiringRate()`，不改最终判定接口。

### Vanilla 边界

`[VANILLA][empirical-high / compatibility-assumption]`

当前逐指令证据来自 PC-PK。2006 年 Vanilla 游民星空实验已经确认忠诚、亲爱、婚姻、义兄弟等核心关系对登用存在同类行为，但尚未取得 Vanilla EXE 的 `GetHiringSuccessRate` 二进制回归。

因此 Vanilla 暂复用同一硬门槛、fallback 与 deterministic-roll 结构，并标记版本兼容假设。

来源：
- 311MemoryResearch：`Func-人才01-计算登用是否成功.txt`
  https://github.com/sjn4048/311MemoryResearch/blob/master/内存资料/整理/Func-人才01-计算登用是否成功.txt
- 311MemoryResearch：`Func-人才03-执行登用.txt`
  https://github.com/sjn4048/311MemoryResearch/blob/master/内存资料/整理/Func-人才03-执行登用.txt
- 311MemoryResearch：`Func-人才04-执行登用完成.txt`
  https://github.com/sjn4048/311MemoryResearch/blob/master/内存资料/整理/Func-人才04-执行登用完成.txt
- 311MemoryResearch：`Func-人才08-探索发现人才并登用.txt`
  https://github.com/sjn4048/311MemoryResearch/blob/master/内存资料/整理/Func-人才08-探索发现人才并登用.txt
- SIRE 开发地址表：`005C4F80 = GetHiringSuccessRate`
  https://github.com/sean2077/311SireCustomizedPackageDev/blob/dev/material/内存地址汇总.md
- 日文 Wiki / 旧 2ch 硬门槛：
  https://w.atwiki.jp/sangokushi11/pages/1886.html
- 日文 Wiki 亲爱/嫌恶：
  https://w.atwiki.jp/sangokushi11/pages/95.html
- Vanilla 时代 100 忠诚挖人实验：
  https://www.gamersky.com/handbook/200603/21923.shtml

---

## 3. 外交公式的 Vanilla / PK 版本边界

### 已确认

后期 PC / PK 社区存在可完整计算的亲善、同盟、停战、交换俘虏、劝降逆向公式，当前已写入 `07-diplomacy.md`。

### 没找到

没有找到足够证据证明 **Vanilla 1.0 与后续补丁/PK 的所有常量完全相同**。

### provisional-engine-rule

不另造第二套公式。使用：

```ts
diplomacyProfile = "pc-late-empirical"
```

- Vanilla 1.0 暂时复用同一公式；
- 标记 `compatibilityAssumption=true`；
- 日后只要找到 Vanilla 1.0 存档反例，就新增 profile，不改旧 profile。

这是比凭空制造“Vanilla 公式”更稳妥的做法。

---

## 4. 攻城统一公式与陷落资源

### 已确认 / 新升级

日文 Wiki 已有大量攻城 golden tests（攻击 80、无太守条件）：普通、弩、火矢、贯矢、乱射、冲车、井阑、木兽、投石、霹雳等的耐久/城兵伤害均可直接做回归测试。

来源：https://w.atwiki.jp/sangokushi11/pages/92.html

**攻陷后物资保留找到了明确实战公式：**

```text
保留物资 = 攻陷前物资 / 100 × floor(攻陷部队主将魅力 / 10)
```

即主将魅力 100 时约保留 10%，魅力 90–99 时约 9%。

来源：
- https://www.gamersky.com/handbook/200703/57518.shtml
- https://3g.ali213.net/gl/html/6354.html

设施保留数量仍按现有实测魅力档位。

### 仍没找到

未找到一个能统一复算全部攻城方式的底层闭式。

### provisional-engine-rule

**不要强行拟合一个统一公式。** 第一版引擎使用版本化 attack-profile / lookup table：

```ts
siegeDamage = goldenTable[weaponOrTactic]
              * attackPanelCorrection
              * techModifier
              * difficultyModifier
              * governorDefenseModifier
```

先以 Wiki golden table 为 80 攻击面板锚点，通过少量回归再拟合 `attackPanelCorrection`。这比编一个错误的统一公式更忠于原作数据。

---

## 5. 火焰持续与“自然蔓延”

### 已确认

- 官方说明书描述的是主动火计、火罠、落雷点火以及消火。
- 火计会心会延长燃烧回合。
- 社区实测常见：普通燃烧 1–2 旬，会心明显更长，常见 3 旬。
- 火伤约 400±100、会心约 ×1.2 等已有独立伤害实测。

来源：
- 官方说明书
- https://w.atwiki.jp/sangokushi11/pages/92.html
- https://forum.gamer.com.tw/Co.php?bsn=60001&sn=380559

### 重要结论

没有找到原版《三国志11》存在“火会像有风向系统一样随机向相邻格自然扩散”的可靠证据。原作的“连烧”主要来自火种/火球等陷阱的**作用范围和链式点燃**。

因此不应凭空增加 natural fire spread。

### provisional-engine-rule

```ts
naturalSpreadProbability = 0

normalFireDuration = 1 + Bernoulli(0.25) // 1~2旬
criticalFireDuration = 3
```

火罠/火球命中的每个格子分别建立自己的燃烧状态；链式触发是陷阱规则，不是自然蔓延。

---

## 6. 自然死亡精确 RNG

### 已确认

- “自然死”：到没年后开始多病，多数当年死亡，最长常见再延 2–3 年。
- “不自然死”：到没年会病倒后恢复，再延寿；越年轻延寿越长，资料称最大约 15 年。
- 历史死亡事件可覆盖普通死亡。

来源：https://w.atwiki.jp/sangokushi11/pages/983.html

### 没找到

未找到每旬死亡概率和“不自然死 +a 年”的精确抽样函数。

### provisional-engine-rule

不要每旬独立乱掷；开局时按 seed 预先决定死亡时间，利于回放：

```ts
if (deathCause === "natural") {
  extraYear = weightedChoice({0:0.65, 1:0.25, 2:0.08, 3:0.02})
}

if (deathCause === "unnatural") {
  ageAtRecordedDeath = deathYear - birthYear
  extraMax = clamp(15 - floor(max(ageAtRecordedDeath - 30, 0) / 10), 10, 15)
  extraYear = uniformInt(10, extraMax)
}

deathDekad = uniformInt(1, 36)
```

历史事件满足条件时，事件日期优先。

---

## 7. 混乱 / 伪报持续与恢复

### 已确认

- 普通扰乱/伪报一般 1–2 旬。
- 会心会延长；多个长期攻略将会心状态描述为约 3 旬。
- 螺旋突会心必混乱；已有专项实测。
- 镇静可以直接解除。
- 武将性格会影响中扰乱/伪报倾向：猪突/刚胆更容易中扰乱，小心更容易中伪报。

来源：
- https://www.bilibili.com/read/cv19100194
- https://forum.gamer.com.tw/Co.php?bsn=60001&sn=380559
- https://w.atwiki.jp/sangokushi11/pages/983.html

### 没找到

没有找到普通扰乱/伪报持续 1 还是 2 旬的精确概率函数，也没有可靠证据支持旧“每旬固定50%清醒”的写法。

### provisional-engine-rule

```ts
normalDuration = 1 + Bernoulli(0.25) // 75% 1旬，25% 2旬
criticalDuration = 3

if (targetAlreadyAbnormal) {
  duration = min(5, max(oldDuration, newDuration) + 1)
}
```

以后如找到智力差影响持续时间的可靠数据，再把 25% 改成函数。

---

## 8. 单挑连续伤害公式

### 已确认

方针、50 合、斗志、必杀、气合、坚守、假退却、暗器、援助等离散机制已经很完整。

日文 Wiki 曾尝试“只按武力差”建伤害表，但后来撤回，因为相同武力差（例如 100/95 与 80/75）并不产生相同结果。

来源：https://w.atwiki.jp/sangokushi11/pages/2484.html

### 没找到

没找到武力绝对值、武力差、命中、格挡到伤害的完整连续公式。

### provisional-engine-rule

为了符合“相同武力差但绝对值不同，结果不同”这一负证据：

```ts
ratio = ((attackerMartial + 50) / (defenderMartial + 50)) ** 2
ratio = clamp(sqrt(ratio), 0.65, 1.35)

damage = round(
  actionBaseDamage
  * ratio
  * stanceModifier
  * injuryModifier
  * weaponModifier
  * buffModifier
)
```

`actionBaseDamage` 直接用 `10-duel.md` 已实测的动作基准值。命中/格挡另做 seeded roll。

---

## 9. 舌战普通牌心理伤害

### 已确认

手牌数、先后手、话题、再考、足场、话术以及四性格愤激机制已经确认。

来源：https://w.atwiki.jp/sangokushi11/pages/141.html

### 没找到

没有找到普通数字牌与话术的精确心理伤害闭式。

### provisional-engine-rule

```ts
intRatio = clamp((attackerINT + 50) / (defenderINT + 50), 0.70, 1.40)

ordinaryBase = 10 + 2 * max(cardAdvantage, 0)
psychDamage = round(ordinaryBase * intRatio)
```

- 无视/诡辩/镇静优先按机制改变本回合，而不是都当成“伤害牌”。
- 大喝等特殊牌的 base 值单独配置，不埋进代码。
- 猪突愤激可额外加入武力项，但仍标 fallback。

---

## 10. 非骑战法来源的负伤 / 战死概率

### 已确认

- 特技“猛者”：能推动敌部队的战法成功后，**50%** 概率使敌将负伤。
- 强运：避免战死/被俘/负伤。
- 护卫：同部队武将避免战死/负伤。
- 骑兵突击/突进的直接战死率已有独立逆向式。

来源：
- https://www.gamersky.com/handbook/200603/21610.shtml
- https://w.atwiki.jp/sangokushi11/pages/593.html

### 没找到

普通攻击、普通战法、火焰、设施攻击在“击破瞬间”造成负伤/战死的全局通用概率仍没有一致资料。

### provisional-engine-rule

只在**部队被击破**时做通用伤亡 roll，避免每次攻击都额外掷死：

```ts
deathChance =
  deathSetting === "none" ? 0 :
  deathSetting === "normal" ? 0.02 :
  0.04

injuryChance = 0.12
```

然后先应用强运/护卫/名马等保护，再应用明确的特殊来源（猛者50%、骑兵战死式、单挑结果），特殊来源不与通用 roll 重复叠加。

---

## 11. 毒泉 / 栈道 / 落石伤害

### 已确认

- 难所行军：栈道通行无伤。
- 解毒：毒泉无伤。
- 踏破：降低落石/火罠伤害；PK 下火罠减伤关系更明确。

来源：
- https://w.atwiki.jp/sangokushi11/pages/90.html
- https://w.atwiki.jp/sangokushi11/pages/13.html

### 没找到

没有找到能稳定交叉验证的原版精确兵损随机函数。

### provisional-engine-rule

保留目前社区常用量级，但明确改名为 fallback：

```ts
poisonSpring:
  troops -= 1000
  energy -= 5
  if hasAntidote: damage = 0

plankPath:
  troops -= uniformInt(300, 500)
  if hasDifficultMarch: damage = 0

rockfall:
  troops -= uniformInt(1000, 2000)
  confusionChance = 0.30
  if hasTraverse: damage *= 0.5
```

所有数字放版本配置，不写死在 engine。

---

## 12. 普通君主继承

### 已确认

历史事件有自己的明确优先级：
- 曹操：曹昂 > 曹丕 > 曹植 > 曹冲 > 曹彰。
- 刘备：刘禅 > 刘封。
- 连环计等事件甚至会让玩家在候选后继势力之间做选择。

来源：
- https://www.gamersky.com/handbook/200809/124174_9.shtml
- https://w.atwiki.jp/sangokushi11/pages/942.html
- https://w.atwiki.jp/sangokushi11/pages/100.html

### 没找到

COM 在**非历史普通死亡**时的完整自动后继排序没有可靠公式。

### provisional-engine-rule

- 玩家势力：非事件死亡时，向玩家显示所有合法在职武将作为候选，**由玩家选择**；不替玩家制造一个“历史正确”后继。
- COM：
  1. 事件指定候选优先；
  2. 直系/养子血缘 +10000；
  3. 同族 +5000；
  4. 当前官职指挥兵力 ×10；
  5. 功绩；
  6. 魅力 ×20 + 统率 ×10；
  7. officerId 作为稳定 tie-break。

这只用于 AI fallback。

---

## 13. 评定完整提案池

### 已确认

游戏文本明确存在两阶段：

1. 方针提案：**内政 / 出阵 / 外交・计略**
2. 选定方针后提出具体案并采决。

评定本身可获得技巧 P（现有表 +10）。

来源：
- https://w.atwiki.jp/sangokushi11/pages/202.html
- https://w.atwiki.jp/sangokushi11/pages/639.html

### 没找到

没有发现官方“所有具体案 + 触发条件”的完整表，老玩家讨论也承认武将的提案倾向不透明。

### provisional-engine-rule

评定不新增魔法效果，而是**从合法 Command 中产生候选**：

- 内政：开发、巡查、征兵、训练、生产、技巧研究
- 人材：搜索、登用、褒赏
- 出阵：出征、输送、野外建设
- 外交・计略：亲善、同盟、停战、流言、二虎竞食、驱虎吞狼

流程：

```text
每位参评武将根据 起用/战略倾向/五维 + 当前局势
→ 提 1 个方针
→ 君主/玩家选方针
→ 该方针下枚举 1~3 个合法具体命令
→ 选中后仍走普通 Command 校验和正常成本
→ 评定事件 +10 技巧P
```

---

## 14. 委任 AI 权重

### 已确认

- 委任 COM 会强行追求每城至少市场×3、农场×3；缺地时会拆别的设施。
- 实战建议通常先准备“3市3田1兵舍1锻冶”。
- 委任军团会赏赐武将，常把忠诚补到 96 以上。
- 多城军团会向前线输送资源。
- 超级难度 AI 本身并没有大幅变聪明，主要是资源倍率不同。

来源：
- https://www.gamersky.com/handbook/200706/66728.shtml
- https://w.atwiki.jp/sangokushi11/pages/8.html
- https://w.atwiki.jp/sangokushi11/pages/1878.html

### 没找到

没有公开的原版 AI utility 权重表。

### provisional-engine-rule

用可解释 deterministic utility：

```text
治安 <85                 → 巡查 100
前线防御不足              → 征兵/训练/生产 95
缺“3市3田”基础设施        → 建设 90
粮食可支撑月数 <6          → 农业/输送 90
兵力 <30000               → 征兵 75
各基础兵装 <15000          → 生产 65
后方 surplus 可输前线       → 输送 70
搜索/登用人才              → 45
普通经济扩建                → 50
```

出征阈值按军团方针：
- 防守：我方可投入/目标守军 ≥1.5
- 标准：≥1.2
- 攻击重视：≥1.0

所有行为仍由同一个 `enumerateCommands()` 生成，AI 不得绕过规则。

---

## 15. 太守魅力 → 换季治安下降概率分布

### 已确认

这正回答“是不是魅力越低，概率越大”：**是。**

- 换季自然下降原始上限是 5。
- 太守魅力越高，治安越不容易掉。
- 太守魅力 100：实测下降范围约 **0–2**。
- 无太守：实测**固定 -5**。
- SIRE 反汇编级参数明确暴露了“换季治安下降上限”和“有政令整备时本季不下降的概率”两个独立参数。
- PK“政令整备”不是绝对免疫；高质量社区整理与 SIRE 参数一致地指向**约 50% 概率跳过本季自然下降**。

来源：
- https://w.atwiki.jp/sangokushi11/pages/1152.html
- https://w.atwiki.jp/sangokushi11/pages/79.html
- https://dl.3dmgame.com/patch/26091.html
- https://www.sohu.com/a/411270684_120015190

### 没找到

没有找到“魅力 0~100 → P(掉0),P(掉1)…P(掉5)”的原版完整概率表。

### provisional-engine-rule

采用一个满足全部锚点、并且对魅力单调的平滑分布：

```ts
if (!governor) return 5

C = clamp(governor.charisma, 0, 100)

// 低魅力的下降上限接近5；魅力100时下降上限=2
effectiveCap = 2 + 3 * (100 - C) / 100
lo = floor(effectiveCap)
hi = ceil(effectiveCap)

// 在相邻两个上限之间随机插值，避免能力只在几个断点生效
cap = Bernoulli(effectiveCap - lo) ? hi : lo

loss = uniformInt(0, cap)

if (ruleset === "pk" && hasAdministrativeReform && Bernoulli(0.50)) {
  loss = 0
}

return loss
```

性质：
- 魅力100 → 均匀 0/1/2，完全吻合已知范围；
- 魅力0 → 均匀 0~5；
- 魅力越低，`effectiveCap` 单调提高，**期望治安损失单调变大**；
- 无太守直接 -5；
- PK 政令整备再独立提供 50% 免降机会。

这是目前比“魅力越低随便多掉几点”更可测、更容易以后替换的方案。

---

## 落地原则

所有 fallback 都必须：

```ts
type RuleEvidence = {
  status: "confirmed" | "empirical-high" | "reverse-engineered" | "provisional-engine-rule"
  ruleset: "vanilla" | "pk" | "shared"
  sourceUrls: string[]
  rationale: string
}
```

并且 simulation report 应输出本局实际触发过多少次 `provisional-engine-rule`。这样 Agent 对局可以运行，但研究者能明确知道哪些结果依赖我们的工程假设。
