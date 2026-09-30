# 战斗、伤害、战法、攻城、火焰、异常与伤亡

## 1. 部队面板

`[COMMON][confirmed]`

- 攻击：武力 × 兵种攻击系数 × 适性 × 技巧。
- 防御：统率 × 兵种防御系数 × 适性 × 技巧。
- 适性：S 1.0 / A 0.9 / B 0.8 / C 0.7。
- 兵科面板系数与战法表沿用 repo 已核对数据。

来源：https://w.atwiki.jp/sangokushi11/pages/91.html

## 2. 普攻、反击与一齐攻击

- 近战普攻通常触发反击。
- 间接攻击通常不受反击。

- 技巧“应射”是这个规则的例外：应射弩兵遭受合法的箭类攻击时可自动反击，包括火矢等弩战法。它仍受正常射程、地形、异常状态和攻击类型限制；支援攻击不触发应射。完整边界见 `25-response-fire.md`。
- 兵器不能普通攻击/反击。
- 一齐攻击由多支相邻己军参与；发起者承担反击。
- 一齐攻击精确伤害拆分仍需专项验证。

## 3. 战法与克制

- 枪克骑、骑克戟、戟克枪；弩无三角克制。
- 克制作用于对应战法，不应简单乘进所有普通攻击。
- 战法适性门槛、气力、地形与成功率按兵科表执行。

来源：https://w.atwiki.jp/sangokushi11/pages/91.html

### 3.1 战法成功率中的高低差

`[PC-PK中心][empirical-high; original function located]`

SIRE 已定位原函数 `005AF850 TacticSuccessRate`。当前稳定结论：

- 突刺、二段突、突击、突破、突进：攻击者相对目标地势越高越有利；
- 熊手：方向相反，攻击者相对目标越低越有利；
- 螺旋突、横扫、旋风、贯射、乱射等没有这层 elevation 修正；
- 受异常状态时“战法100%成功”等更高优先级规则另行处理。

常见基础成功率：

```text
突刺 70
螺旋突 70
二段突 60
熊手 70
横扫 70
旋风 65
弩火矢 75（另受目标地形类型修正）
贯射 70
乱射 65
突击 70
突破 65
突进 60
猛撞 70
```

适性常见追加：

```text
B +0
A +5
S +10
```

但 elevation 的**完整离散映射仍不能压缩成“每级固定±5”**：

- 一级有利高差常见 +5；
- 二级常见 +10；
- 二段突/突进存在二级高差 +15 的稳定实测；
- 枪/骑不利方向会扣减；
- 熊手的负向下限与细分档仍待 `005AF850` 逐指令恢复。

另一个关键实现点：高度判定使用部队**本次行动开始时的格子**，不是移动后发动战法的格子。详见 `01-map.md#6-高度与高低差`。

来源：
- https://dl.3dmgame.com/patch/26091.html
- https://w.atwiki.jp/sangokushi11/pages/91.html
- https://vincecarter0315.pixnet.net/blog/posts/14217116027

## 4. 最终战斗伤害：逆向公式

旧 repo 的

`max(0,攻击-防御) × sqrt(兵力/1000)`

属于人为闭环公式，现已删除。

目前找到一套经过多年实测逆向、可复算测试样本的完整公式：

`[PC-PK][empirical-high]`

```
damage = INT(
  (
    (
      sqrt(damageCoef * 64)
      + MAX(0, INT((atk^2 - MAX(40, def)^2) / 300))
      + MAX(0, INT((atkTroops - defTroops) / 2000))
      + 50
    ) * 10
    * (
      TRUNC(
        ((INT(atkTroops*0.01)+300) * (atk+50)^2 * 0.01 * 100)
        /
        ((INT(atkTroops*0.01)+300) * (atk+50)^2 * 0.01
         +(INT(defTroops*0.01)+300) * (def+50)^2 * 0.01)
        - 50
      ) + 50
    )
    * MIN(sqrt(INT(atkTroops/4)), 40)
    * 0.000476190455
    * drum
    + INT(atkTroops/200)
  )
  * critical * counter * tech * difficulty
)
```

### 伤害系数

- 近程普攻 10；远程普攻 0
- 枪战法 25 / 30 / 35
- 戟战法 25 / 30 / 33
- 弩战法 10 / 20 / 25
- 骑战法 30 / 35 / 40
- 木兽放射 20
- 井阑火矢 15
- 投石 35
- 水军战法 15 / 25 / 35

其他系数：

- 太鼓台：1.1
- 会心：1.15
- 克制：有利 1.15 / 不利 0.85；个别特殊克制 0.8
- 对应兵科“锻炼”：伤害 ×1.10；对应“精锐”升级为 ×1.15，并覆盖1.10。熟练兵只负责气力上限100→120
- 超级难度玩家方除火伤外：0.75

来源（逆向研究）：https://game.ali213.net/thread-5983352-1-1.html

### 证据级别说明

这套公式比旧临时式可靠得多，但它来自高质量玩家逆向而非官方源码，因此标记 `empirical-high` 而不是 `confirmed`。**无印与不同平台是否完全同式仍需版本回归测试。**

## 5. 会心

- 战斗逆向式中的会心倍率为 1.15。
- 螺旋突会心可必混乱。
- 火计/火罠的火伤会心规则不同，见下节。

## 6. 火焰伤害

`[PC/PK中心][empirical-high]`

- 普通火计基础伤害约 **400±100**。
- 与兵科、士兵数、适性、部队攻防无关。
- 火计会心约 ×1.2。
- 爆药炼成会使所有受到的火伤 +300，同时己方火罠造成伤害 +300。
- 若目标有踏破，来自爆药炼成的 +300 对火罠只按 +30。
- 火伤处理顺序实测为：**踏破 → 会心 → 爆药炼成 → 火神 = 藤甲**。

来源：https://w.atwiki.jp/sangokushi11/pages/92.html
交叉核对：https://w.atwiki.jp/sangokushi11/pages/91.html

火焰持续的完整内部 RNG 仍未取得，但持续规则已经能再收紧两步：

- `[empirical-high]` 火计会心使同一次点火的持续时间**增加 1 回合**，而不是“固定变成 3 回合”。专项实测的三组普通火为 1/3/3 回合，对应强制会心后为 2/4/4。
- `[negative-evidence-high]` 没有可靠原作证据支持“已着火格每旬按风向/地形自动点燃邻格”。原作所谓连烧来自火种/火球作用范围、落雷范围和火罠连锁触发。

因此 fidelity 模式：

```ts
naturalAdjacentSpread = false
criticalBonusTurns = 1
```

基础持续时间仍为 fallback。初版可用可配置的 `1回合70% / 2回合30%` 作为内部基准，再在会心时 +1；该权重来自现代 San11 重制项目的工程参考，不冒充原版常量。不同点火来源必须保留独立 `fireLifetimeProfile`，详见 `16-unresolved-rules-fallbacks.md`。

持续时间来源：
- https://w.atwiki.jp/sangokushi11/pages/85.html
- https://w.atwiki.jp/sangokushi11/pages/2166.html
- https://www.bilibili.com/opus/374609164980707553

原版连锁火攻来源：
- https://www.gamersky.com/handbook/200603/21652.shtml
- https://w.atwiki.jp/sangokushi11/pages/2166.html

SIRE/逆向交叉：
- https://github.com/sjn4048/311MemoryResearch/blob/master/内存资料/函数[火陷阱炸伤炸死].txt
- https://github.com/sjn4048/311MemoryResearch/blob/master/内存资料/修改记录by%20sjn4048.txt

## 7. 攻城与陷落

`[COMMON][confirmed mechanism]` 据点有驻兵和耐久；任一归零都可导致陷落。

### 7.1 城兵伤害：与野战共用核心伤害函数

`[PC-PK1.1][reverse-engineered]`

311MemoryResearch 的 `函数[部队攻击].txt` 显示，对城市/港/关的**守兵伤害**并不是另一套独立 lookup：

1. 先读取据点太守相关防御能力与实际可指挥守兵；
2. 调用与野战相同的核心伤害函数 `005ADC30`；
3. 再根据攻击兵器、据点类型、科技、会心、难度等做倍率修正。

因此本文件第 4 节的战斗伤害核心式同样是攻城守兵伤害的底层。

特殊分支包括：

- 井阑：对据点守兵有专用伤害倍率；
- 投石：对据点守兵有专用伤害倍率；
- 普通兵种攻击城市/港/关分别应用据点类型倍率；
- 超级难度下玩家造成的非火伤仍 ×0.75。

太守统率影响守兵损失，但**不影响耐久损失**，与日文 Wiki 的实测完全一致。

逆向来源：
- https://github.com/sjn4048/311MemoryResearch/blob/master/内存资料/函数[部队攻击].txt

交叉验证：
- https://w.atwiki.jp/sangokushi11/pages/92.html

### 7.2 耐久伤害：统一调用链已确认

`[PC-PK1.1][reverse-engineered-partial]`

原程序不是“每种攻城方式一张伤害表”，而是统一走耐久伤害分支：

- 普通兵种、井阑、投石等 → `005ADDC0`
- 冲车、木兽 → 专用 `005ADE20`
- 然后再统一叠加目标类型、会心、云梯、难度等修正

反汇编还确认：

- 无战法/远程普通攻击的基础耐久威力参数先取 **5**；
- 相邻普通攻击会改成 **15**；
- 有战法时从战法数据 `+0x2f` 读取其耐久威力参数；
- 会心对建筑耐久 ×**1.15**；
- 技巧“云梯”：
  - 剑/枪/戟/弩/骑等普通陆军对设施伤害 ×**1.4**
  - 兵器等后续兵科 ×**1.2**
- 超级难度玩家方耐久伤害 ×**0.75**。

普通目标类型的耐久倍率也能从跳转表直接还原：

| 目标 | 耐久倍率 |
|---|---:|
| 城市 | 0.7 |
| 关所 | 0.6 |
| 港 | 0.8 |
| 阵 | 0.8 |
| 砦 | 0.7 |
| 城塞 | 0.6 |
| 土垒 | 0.9 |
| 石壁 | 0.7 |
| 内政设施 | 1.1 |
| 火种/火球等火罠 | 1.6 |
| 堤防 | 0.7 |

其中冲车/木兽对城市、关所、港等普通据点会跳过普通兵种的这层据点耐久衰减，这也是它们耐久破坏极高的重要原因。

公开的现代复刻项目 `tankyc/sango_infinity` 根据相同逆向资料，把普通耐久伤害还原为以下形式：

```ts
ordinaryDurability =
  floor(
    sqrt(attackerTroops)
    * attackerAttack
    * sqrt(1 / 1500)
    * (1 + durabilityPower / 25)
    * targetTypeMultiplier
    * troopDurabilityMultiplier
    * extraModifiers
  )
```

这个结构能直接复算两个很强的原作锚点（10000兵、攻击80、城市）：

- 相邻普通攻击：`durabilityPower=15` → **231**
- 弩远程普通攻击：`durabilityPower=5` → **173**

与日文 Wiki 实测完全一致。

不过，公开文本版 311MemoryResearch **没有展开 `005ADDC0` / `005ADE20` 两个函数体本身**；IDA 数据库里有完整函数，但当前没有可直接引用的文本反编译。因此：

- “统一调用链、参数、外层倍率”可标 `reverse-engineered`；
- 普通耐久闭式可标 `empirical-high/reconstructed`；
- 冲车/木兽的内部基础式仍保留一个很小的 exactness 缺口。

不得再把旧的“按武器 lookup table 直接给伤害”当作主引擎规则；golden table 改为回归测试。

逆向来源：
- https://github.com/sjn4048/311MemoryResearch/blob/master/内存资料/函数[部队攻击].txt
- https://github.com/sjn4048/311MemoryResearch/tree/master/IDA%20Related

公开复刻交叉验证：
- https://github.com/tankyc/sango_infinity/blob/master/Project/Assets/Sango/Scripts/Game/Object/Troop/Troop.cs

研究公式：
- https://game.ali213.net/thread-5983352-1-1.html

### 7.3 攻陷后物资保留：反汇编精确公式

`[PC-PK1.1][reverse-engineered]`

这一项已经不需要 empirical fallback。

原函数 `004B329B`（311MemoryResearch 标注为“破城保留资源”）先设置默认保留率 **5%**，再读取陷城部队主将魅力：

```ts
retainPct = max(5, floor(commanderCharisma / 10))
```

然后对资源逐项做整数除法：

```ts
newMoney  = floor(oldMoney  * retainPct / 100)
newFood   = floor(oldFood   * retainPct / 100)
newTroops = floor(oldTroops * retainPct / 100)

for (const equipment of all12EquipmentSlots) {
  equipment.amount =
    floor(equipment.oldAmount * retainPct / 100)
}
```

也就是说，**金、粮、兵、12类兵装全部使用同一个保留百分比**。

魅力档位实际为：

| 主将魅力 | 保留率 |
|---:|---:|
| 0–59 | 5% |
| 60–69 | 6% |
| 70–79 | 7% |
| 80–89 | 8% |
| 90–99 | 9% |
| 100–109 | 10% |

函数本身没有看到“10%封顶”；若能力 getter 允许魅力超过109，则该式会继续上升。

如果无法取得有效的陷城部队/主将指针，则保留率维持默认 **5%**。

这修正了旧攻略式：

`攻陷前物资 / 100 × floor(主将魅力/10)`

旧式在低魅力时漏掉了原程序的 **最低5%保护**。

逆向来源：
- https://github.com/sjn4048/311MemoryResearch/blob/master/内存资料/函数[破坏内政设施和破城获取资源].txt

早期玩家实测（高魅力区间与逆向式一致）：
- https://www.gamersky.com/handbook/200703/57518.shtml
- https://3g.ali213.net/gl/html/6354.html

### 7.4 内政设施保留数

`[COMMON][empirical-high]`

攻陷部队主将魅力决定陷落后最多保留的内政设施数量：

- 魅力 ≥100：5
- 80–99：4
- 60–79：3
- 40–59：2
- ≤39：1

日文 Wiki 明确给出这五档；旧 2ch 讨论也确认魅力100时上限为5，而且玩家不能选择具体保留哪座。

当前**尚未找到“从现有设施集合中具体抽哪几座”的原版 RNG/排序函数**。

引擎 fallback：

```ts
keepCount = min(existingFacilities.length,
  charisma >= 100 ? 5 :
  charisma >= 80  ? 4 :
  charisma >= 60  ? 3 :
  charisma >= 40  ? 2 : 1
)

retainedFacilities =
  seededSampleWithoutReplacement(existingFacilities, keepCount)
```

这里必须用可回放 seed；以后若逆出原作选择算法，只替换 `seededSampleWithoutReplacement()`。

来源：
- https://w.atwiki.jp/sangokushi11/pages/1598.html
- https://w.atwiki.jp/sangokushi11/pages/2469.html

### 7.5 攻城 golden tests

`[PC-PK][empirical-high]`

测试条件：目标城无太守，攻击部队攻击力 80。

| 攻击 | 耐久损失 | 城兵损失 | 额外火耐久 |
|---|---:|---:|---:|
| 直接攻击 | 231 | 708 | - |
| 弩普通 | 173 | 708 | - |
| 火矢 | 231 | 708 | 138 |
| 贯矢（隔1格） | 231 | 708 | - |
| 贯矢（贴城） | 462 | 1416 | - |
| 乱射命中中心 | 369 | 1128 | - |
| 乱射命中边缘 | 300 | 918 | - |
| 冲车 | 1012 | 708 | - |
| 井阑 | 260 | 2431 | 128 |
| 木兽 | 1094 | 708 | - |
| 投石 | 665 | 1621 | - |
| 霹雳投石命中中心 | 1061 | 2593 | - |
| 火球 | 455 | 0 | - |
| 火神火球 | 669 | 0 | - |
| 业火球 | 689 | 0 | - |
| 火神业火球 | 1302 | 0 | - |

这张表现在作为**公式回归测试**，不再作为主运行时 lookup。

来源：https://w.atwiki.jp/sangokushi11/pages/92.html

### 7.6 捕缚在攻城中的 Vanilla / PK 差异

`[VANILLA][confirmed]` 捕缚持有部队即便用投石、弩等间接攻击或火球令据点陷落，也可触发捕缚。

`[PK][confirmed]` 捕缚持有部队必须**与据点相邻**时，陷落才应用捕缚；攻击手段本身可为间接攻击。

来源：https://w.atwiki.jp/sangokushi11/pages/85.html

## 8. 异常状态

### 混乱 / 伪报的运行时恢复：反汇编确认

`[PC-PK1.1][reverse-engineered]`

部队异常状态有独立的“剩余回合计数”。

每旬 `00599B90` 按以下顺序处理：

```ts
if (status === CONFUSED && !unit.hasActed) {
  unit.hasActed = true
}

if (status === FALSE_REPORT && !unit.hasActed) {
  moveTowardHomeBase(unit)
  unit.hasActed = true
}

let recoverySpeed = 1

if (
  ruleset === "pk" &&
  insideFriendlyDefensiveFacilityAura(unit)
) {
  recoverySpeed = 2
}

statusTurnCount =
  max(0, statusTurnCount - recoverySpeed)

if (statusTurnCount === 0) {
  clearAbnormalStatus(unit)
}
```

所以原作没有“每旬50%自然恢复”这一层随机数。

PK 的阵/砦/城塞恢复加速在官方说明书里描述为“恢复概率提高”，但反汇编实现是**倒计时速度从1变2**。该效果是 PK 新增；Vanilla 仍按每旬 -1。

来源：
- https://github.com/sjn4048/311MemoryResearch/blob/master/内存资料/整理/Func-自动03-部队异常状态处理.txt
- https://cdn.akamai.steamstatic.com/steam/apps/628070/manuals/32sangokushi11wpk_manual.pdf

SIRE 地址表：
- `004AEA70 SetTroopStatus`
- `00496350 SetTroopTurnCount`
- https://github.com/sean2077/311SireCustomizedPackageDev/blob/dev/material/内存地址汇总.md

### 初始持续回合

`[reverse-engineered-partial / empirical-high]`

已经定位：

- `005917D0`：伪报实际处理；
- `00591A20`：扰乱实际处理。

但公开 TXT 没有展开这两个函数体，所以初始 count 的精确分布仍 open。

可靠边界：

- 普通伪报/扰乱主要持续 1～2 回合；
- 会心后至少 2 回合；
- 性格和智力影响**会心率**，不是异常后的恢复速度。

反汇编还给出施法方性格对会心的修正：

| 性格 | 伪报会心修正 | 扰乱会心修正 |
|---|---:|---:|
| 胆小 | +10 | -5 |
| 冷静 | +5 | 0 |
| 刚胆 | 0 | +5 |
| 莽撞 | -5 | +10 |

来源：
- https://github.com/sjn4048/311MemoryResearch/blob/master/内存资料/函数[计策爆击率].txt
- https://w.atwiki.jp/sangokushi11/pages/85.html

引擎 fallback 暂采用可配置的：

```ts
base = weightedChoice({1: 0.70, 2: 0.30})
initialCount = base + (critical ? 1 : 0)
```

即普通 1/2、会心 2/3。70/30 来自现代重制项目的工程参考，不标为原作事实。

旧的“重复施放再 +1，最多5回合”没有依据，已删除；重复施放的 exact setter 行为继续列 open。

### 镇静

成功后直接解除目标异常；会心时连带目标邻接友军。

来源：https://w.atwiki.jp/sangokushi11/pages/85.html


### 兵力过低导致的自动混乱

`[COMMON][empirical-high]`

回合结束时，满足以下全部条件才判定：

- 小部队兵力 `Y < 1000`
- 3 格内存在正常状态敌部队，兵力 `X >= 500`
- `Y / X < 0.05`
- 双方均不是混乱/伪报状态

设 `Z = Y/X`：

`混乱率 = (0.05 - Z) * 12 + 0.05`

若范围内有多支敌军，只使用产生**最高混乱率**的一组，不重复掷骰。

当 Y 极小时上限约 65%；Y 接近 X 的 5% 时接近 5%。

来源（游民星空实测）：https://www.gamersky.com/handbook/200609/39104.shtml

## 9. 据点防守中的太守能力

`[PC-PK][empirical-high]`

实测表明确：

- 太守统率 **66 以上**开始降低守城兵受到的伤害；统率越高减伤越强。
- 太守统率**不影响据点耐久被打掉的数值**。
- 太守武力 **66 以上**开始提高据点反击伤害。
- 只有太守能力生效，城内其他武将能力不参与这两项。
- 据点兵力越高，攻防越强，但超过太守当前**指挥兵力上限**的那部分兵不会继续贡献据点攻防。

来源：https://w.atwiki.jp/sangokushi11/pages/92.html

## 10. 击破后的武将：俘虏率

`[PC-PK中心][empirical-high]`

在先处理血路、强运、名马等“不能被俘/可脱出”条件后，普通野战击破的捕获率可按逆向公式：

```
A = (120 - max(targetMartial, targetIntelligence)) / 3
B = surroundingEnemyUnits              // 1..6
if targetHasIronWall: B = 1
C = 2 if difficulty == SUPER else 1
D = 1.5 if terrain in {湿地, 毒泉} else 1
E = 100 if attackerHasCaptureSkill else 0
F = 30 if finishingHitIsHalberdTactic else 0

captureRate = A * (B / C) * D + E + F
```

按概率意义截到 0–100%。

关键结论：

- 包围数最多计 6。
- 铁壁使包围数按 1 计算。
- 超级难度把包围贡献减半。
- 湿地/毒泉 ×1.5。
- 捕缚直接 +100。
- **任意戟兵战法**作为最后一击均 +30；熊手并不比横扫/旋风更容易抓。
- 战法是否会心**不影响**俘虏率。

例：上级、六队包围诸葛亮（武/智最高100）并以戟战法击破：
`(120-100)/3 × 6 + 30 = 70%`。

来源（逆向公式镜像）：
https://www.ptt.cc/man/Koei/D802/D96B/D4AA/M.1371726847.A.536.html

> 该公式来自底层逆向资料，可靠度远高于旧“30%/40%/70%”粗估；但 Vanilla/主机版是否完全一致仍需版本回归，因此标 `empirical-high` 而非全平台 confirmed。

## 11. 战法会心率

`[PC-PK中心][empirical-high]`

若有对应必会心特技则 100%；否则：

`criticalRate = martialBonus + aptitudeBonus + relationshipBonus`

武力：
- ≤60：0%
- 61–79：+1%
- ≥80：+2%

适性：
- C 0%
- B +1%
- A +2%
- S +3%

每名副将分别计算关系：
- 亲爱主将 +2%
- 义兄弟/配偶 +4%
- 嫌恶主将 -5%

两个副将效果相加。

来源：https://www.ptt.cc/man/Koei/D802/D96B/D4AA/M.1371726847.A.536.html
交叉核对：日文 Wiki 明确会心率受适性与同队人际关系影响
https://w.atwiki.jp/sangokushi11/pages/85.html

## 12. 螺旋突混乱

`[PC-PK中心][empirical-high]`

- 非会心且战法成功：实际约 **15%** 造成 1 旬混乱。
- 会心：**100%** 混乱；持续 1 或 2 旬，各约一半。

逆向说明：普通成功先以约30%进入眩晕判定，其中一半实际持续0旬，因此最终有效约15%。

来源：https://www.ptt.cc/man/Koei/D802/D96B/D4AA/M.1371726847.A.536.html

## 13. 骑兵战法战死率

`[PC-PK中心][empirical-high]`

只有突击/突进可在战法中直接“突死”武将；突破不会。

```
deathRate = A + B + C + D + E
```

- A：突击 0，突进 +2
- B：高战死设定 +2，普通 0；无战死设定直接禁止
- C：会心 +2，否则 0
- D：目标性格 小心 -1 / 冷静0 / 刚胆0 / 莽撞 +1
- E：比较攻击方部队 `max(统率,武力)` 与目标武将 `max(统率,武力)`
  - 高 ≥12：+1
  - 高 7–11：0
  - 高 1–6：-1
  - 不高于目标：-3

强运、护卫等保护先行判定。结果按概率下限 0 处理。

来源：https://www.ptt.cc/man/Koei/D802/D96B/D4AA/M.1371726847.A.536.html

这使“战死率 2–5%”的旧粗略区间失效；后续应按具体死亡来源分别建模。

## 14. 非骑兵来源的武将负伤 / 战死（E16）

`[PC-PK1.1][reverse-engineered]`

E16 的核心纠错是：**不存在已知的“所有普通攻击/战法在击破后统一再掷一次武将负伤/战死”的原版规则。**

武将 casualty 必须按来源分流。

| 来源 | 武将结果 |
|---|---|
| 普攻/一般战法/设施攻击导致部队壊灭 | 不额外添加通用 casualty roll |
| 弩、井阑、舰船火矢；贯射；乱射 | 弩系狙伤 |
| 猛者+成功位移战法 | 50%负伤 |
| 业火种/业火球 | 专用战死+独立负伤 |
| 骑兵突击/突进 | 第13节专用战死 |
| 单挑 | 单挑专用结算 |

完整证据矩阵见 `31-non-cavalry-casualty-sources.md`。

### 14.1 共用候选：005971F0

`005971F0 DesignateInjuredPersonnel` 从目标部队指定一名合法武将，并处理护卫/强运等保护。

因此下文的“6%”“2～7%”等，都是**候选已经被指定之后的 conditional chance**；三人部队中某一名武将的最终 unconditional chance 还依赖尚未恢复的多候选 selector。

### 14.2 弩兵狙伤：005974C0

可触发：

```text
弩火矢 / 井阑火矢 / 舰船火矢
贯射
乱射
```

原函数：

```text
0059750D  005971F0 指定候选
0059752A  00596480 统武比较档
00597538  test critical
0059753A  0F 95 C1 = SETNE CL
00597541  合成最终概率
00597546  ProbabilityCheck
005975A7  005963E0 负伤处理
```

公式：

```ts
sniperChance =
  tacticBase
  + statComparisonTier
  + personality
  + criticalBonus
  - 1
```

其中：

```text
tacticBase：
三种火矢0 / 贯射1 / 乱射2

statComparisonTier：
-2 / -1 / 0 / +1

personality：
小心0 / 冷静1 / 刚胆2 / 莽撞3

criticalBonus：
普通0 / 会心1
```

`00596480` 比较攻击主将与候选目标各自 `max(统率,武力)`。原 SIRE 帖只锁定四个返回档；现代复核一致给阈值为：

```text
差 <=0 -> -2
1～6   -> -1
7～12  -> 0
>12    -> +1
```

阈值当前标 `secondary-corroborated`，等待 `00596480` 原函数体恢复。

理论峰值：

```text
乱射2 + 优势1 + 莽撞3 + 会心1 -1 = 6%
```

这条路径**只负伤，不战死**。

特别纠错：旧文档说“火矢不进入业火 casualty”是对的，但不能推成“火矢绝不伤将”。箭类火矢不会调用 `00597350`，却会调用这条弩系狙伤路径。

### 14.3 业火种 / 业火球：00597350

只有：

```text
ID16 业火种
ID15 业火球
```

进入 `00597350`。

能力保护：

```ts
M = max(统率,武力,智力)

abilityProtection =
  M <= 70 ? 0 :
  M <= 80 ? 1 :
  M <= 90 ? 2 : 3
```

性格：

```text
小心0 / 冷静1 / 刚胆2 / 莽撞3
```

战死：

```ts
if (deathMode !== "none") {
  base = deathMode === "high" ? 4 : 2
  deathChance =
    max(0, base + personality - abilityProtection)
}
```

负伤会重新调用 `005971F0`，独立计算：

```ts
injuryChance =
  max(0, 2 + personality - abilityProtection)
```

无战死只跳过 death 阶段，**不会关闭业火负伤**。

高统/武/智是保护项，因为原汇编明确是：

```asm
call 00596380
sub  esi,eax
```

不是网上转载的加号。

具体伤病等级由 `005963E0` 处理，仍 open。

### 14.4 猛者

原地址：

```text
0059781A 猛者(51)
00597725 概率50
```

稳定规则：

```ts
if (
  hasMightyWarrior
  && tacticSuccessfullyMovedTarget
  && Chance(50)
) {
  injureEnemyOfficer()
}
```

候选和伤病等级原 caller 尚未完整展开。

### 14.5 普通火焰与火陷阱边界

```text
普通火计 / 着火格：
  兵力火伤
  无通用武将 casualty

普通火种/火焰种/火球/火焰球：
  兵力/耐久伤害
  无 00597350

火船：
  火伤 + 25%混乱
  无 00597350

业火种：
  火伤 + 50%混乱 + 00597350

业火球：
  火伤 + 00597350
```

弩/井阑/舰船火矢的箭击本身另可触发狙伤，不要把“箭击狙伤”与“点燃后的火焰伤害”合并。

### 14.6 普通击破不添加自拟统一伤亡

公开 PC-PK 逆向中，已知伤亡入口都是专门来源；没有发现普通攻击、一般战法、设施伤害或部队兵力归零后共用的 casualty finalizer。

因此：

```ts
resolveOrdinaryTroopDestruction() {
  resolveCaptureOrEscape()
  // no generic injury/death roll
}
```

旧“普通击破约15%负伤、2～5%战死”不再作为 engine fallback。

### 14.7 剩余 exactness

- `005971F0` 多名合法候选的精确选择；
- `005963E0` 轻伤/重伤/濒危的具体分布；
- `00596480` 四档阈值的原指令确认；
- 猛者目标选择与伤病等级；
- Vanilla / PS2 / Wii 逐项等价性。

