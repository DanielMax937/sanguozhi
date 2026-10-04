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

## 2. 普通登用概率（P0-1 外层源码级收窄，内部仍open）


P0-1 专项证据：`36-hiring-probability-exactness.md`；结构化数据：`../sources/hiring-probability-exactness.json`。

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

### 3.1 普通第三参数=0；非0路径不要混进普通登用

`004AFD60` 的外层已经进一步锁定：

```text
第三参数 = 0
→ factor10 固定10
→ 正常 deterministic compare

第三参数 != 0
→ factor10=min(10,15-2*Ideals)
→ p=floor(p*factor10/10)
→ 004721D0 运行时随机判定
```

因此旧资料里若把高义理 0.9 / 0.7 外层倍率直接套给普通“人才→登用”，是错误的。当前普通本地登用和异地登用完成路径都明确传0。

非0 caller 的完整业务语义尚未全部命名，继续 open。

### 3.2 探索发现人才后当场登用的失败分支

`005D5220` 探索登用 wrapper 先计算 `p` 并做 deterministic compare；若第一次失败，还会计算：

```ts
debateScore = executorCharm
  - compatibilityDifference(executor, executorLord)
  + p

if (debateScore > 80) enterDebate()
```

这是探索发现人才后的特殊分支，不属于普通人才菜单登用。


### 4. 目前唯一仍缺失的东西

没有找到可公开检索、可交叉验证的 `005C4F80 GetHiringSuccessRate` 完整函数体。

可以确认它返回整数型 0–100 概率，而且目标/执行者完整指针都传入，因此它可以读取忠诚、义理、相性、魅力等数据；但在没有函数体的情况下，**不能把网上流传的“政治/魅力各加 X%”写成原版公式**。

现代 SIRE 的“新忠诚/登用意愿系统”明确是可配置的 MOD 新系统，不是原作 `005C4F80`。其基准60、忠诚-100%、相性差-50%、魅力+20%、仕官第一年-20、浮动值6等常量全部禁止回填进原版 fidelity；也不再把它作为原版系数的“校准参考”。

### 5. provisional-engine-rule：仅替代 GetHiringSuccessRate

硬门槛按上面的长期稳定顺序执行；PC-PK1.1 已确认 hard-gate 函数一定先执行，但 `004AF7D0` 函数体尚未公开，因此 9 条顺序继续标 `empirical-high`。只有进入普通连续概率时才调用 fallback：

```ts
function fallbackHiringRate(target, executor, ruler, dateKey) {
  const giri = clamp(target.giriInternal, 0, 4)

  // 原版 005C4F80 同时接收 dateKey；当前闭式未恢复，fallback 暂不使用它，
  // 但接口必须保留，未来替换函数体时不改调用层。

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
const p = fallbackHiringRate(target, executor, ruler, dateKey)

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

## 3. 外交公式版本边界（P0-2 边界已解决，常量仍open）

P0-2 专项证据：`37-diplomacy-version-boundaries.md`；结构化数据：`../sources/diplomacy-version-boundaries.json`。

### 结论：不要再使用“Vanilla晚期≈PK”作为默认事实

官方硬边界：

```text
Vanilla 1.0
↓
1.1：友好增减调整
↓
1.2：友好增减再次调整 + 外交成功率调整
↓
1.3～1.3.3：无公开外交专项条目
```

现有完整外交公式含“超级=0.7”，而超级是 PK 新增，所以完整公式族默认绑定：

```text
pk-pc-formula-corpus
```

exact PK build 仍 open。

### 版本 resolver

```ts
function resolveDiplomacyProfile(version) {
  if (version === "vanilla-1.0") {
    return {
      profile: "vanilla-pc-1.0",
      exactConstants: false,
      fallback: "pk-pc-formula-corpus",
      compatibilityAssumption: true,
    }
  }

  if (version === "vanilla-1.1") {
    return {
      profile: "vanilla-pc-1.1",
      exactConstants: false,
      fallback: "pk-pc-formula-corpus",
      compatibilityAssumption: true,
    }
  }

  if (
    version === "vanilla-1.2"
    || version.startsWith("vanilla-1.3")
  ) {
    return {
      profile: "vanilla-pc-1.2-plus",
      exactConstants: false,
      fallback: "pk-pc-formula-corpus",
      compatibilityAssumption: true,
      note: "post-1.2 public changelog stable; binary identity unproven",
    }
  }

  if (version.startsWith("pk-pc")) {
    return {
      profile: "pk-pc-formula-corpus",
      exactConstants: false,
      exactBuild: "open",
    }
  }

  return {
    profile: "console-separate-open",
    exactConstants: false,
  }
}
```

### 不允许的实现

```text
Vanilla = PK公式
只是没有超级
```

不能标 original/fidelity。

### PK 外交府

只确认：

```text
AP ×0.5
亲善金 ×0.5
外交成功率：无额外bonus证据
```

外交府 success multiplier 若实现字段，保持1.0只是“没有加成”的模型表达，不冒充显式原指令。

### 仍 open

- Vanilla 1.0/1.1/1.2 exact constants；
- 1.2～1.3.3 binary diff；
- PK formula corpus exact build；
- late Vanilla/PK overlap；
- console constants；
- 原EXE外交公式函数体。


## 4. 攻城统一公式与陷落资源


P0-3 专项证据：`38-siege-capture-exactness.md`；结构化数据：`../sources/siege-capture-exactness.json`。

### 结论

本项从“几乎全靠 fallback”缩小为三个不同证据等级的问题：

1. **破城资源保留：已反汇编精确解决。**
2. **攻城伤害：统一调用链和绝大部分倍率已反汇编，耐久基础式只剩两个子函数未公开文本展开。**
3. **内政设施：P0-46已恢复固定IDB的候选/selector/RNG；stock原性、完整事务与跨版本仍open。**

---

### 4A. 破城资源保留：resolved

`[PC-PK1.1][reverse-engineered]`

311MemoryResearch 的 `函数[破坏内政设施和破城获取资源].txt` 整理了 `004B329B` 资源段。P0-46确认它是 `004B2CA0` 内部块，不是独立函数；新IDB证据的stock原性限定见 [81-capture-selector-source-profile.md](81-capture-selector-source-profile.md)。

精确规则：

```ts
retainPct = max(5, floor(commanderCharisma / 10))

money  = floor(oldMoney  * retainPct / 100)
food   = floor(oldFood   * retainPct / 100)
troops = floor(oldTroops * retainPct / 100)

for (i = 0; i < 12; i++) {
  equipment[i] =
    floor(oldEquipment[i] * retainPct / 100)
}
```

最低保留率为 **5%**；这是旧攻略公式遗漏的边界。

因此：
- 魅力 0–59 → 5%
- 60–69 → 6%
- 70–79 → 7%
- 80–89 → 8%
- 90–99 → 9%
- 100–109 → 10%

原函数未看到 10% 上限。

若无法取得合法陷城部队/主将，默认仍保留 5%。

来源：
- https://github.com/sjn4048/311MemoryResearch/blob/master/内存资料/函数[破坏内政设施和破城获取资源].txt
- https://www.gamersky.com/handbook/200703/57518.shtml

---

### 4B. 城兵伤害：统一公式已确认

`[PC-PK1.1][reverse-engineered]`

攻打据点守兵仍调用战斗核心 `005ADC30`，不是单独 lookup。

流程：

```text
攻击部队
→ 取得太守防守能力 / 实际可指挥守兵
→ 005ADC30 基础伤害
→ 井阑 / 投石 / 据点类型倍率
→ 会心 / 科技 / 难度
→ 城兵损失
```

太守统率影响城兵损失，但不影响耐久，和 Wiki golden tests 一致。

因此 engine 应复用 `calculateCombatCoreDamage()`，不要维护第二套“城兵伤害公式”。

---

### 4C. 耐久伤害：只剩 base 子函数 exactness

`[PC-PK1.1][reverse-engineered-partial]`

已确认调用结构：

```text
普通兵种/井阑/投石 → 005ADDC0
冲车/木兽          → 005ADE20
                    ↓
目标设施倍率
                    ↓
会心 1.15
                    ↓
云梯 1.4 / 1.2
                    ↓
超级玩家 0.75
```

基础耐久威力参数：

- 远程/默认普通攻击：5
- 相邻普通攻击：15
- 战法：读取战法数据 `+0x2f`

已逆出的外层倍率：

```ts
critical = 1.15
ladderNormalArmy = 1.40
ladderSiegeOrLater = 1.20
superPlayer = 0.75
```

普通目标：

```ts
city       = 0.70
gate       = 0.60
port       = 0.80
formation  = 0.80
fort       = 0.70
fortress   = 0.60
earthWall  = 0.90
stoneWall  = 0.70
domestic   = 1.10
fireTrap   = 1.60
dike       = 0.70
```

冲车/木兽会绕过城市、港、关等普通据点的常规耐久衰减分支。

### ordinary durability：高置信 reconstructed

公开复刻项目根据这套逆向资料实现：

```ts
base =
  sqrt(attackerTroops)
  * attackerAttack
  * sqrt(1 / 1500)
  * (1 + durabilityPower / 25)

damage =
  floor(
    base
    * targetTypeMultiplier
    * troopDurabilityMultiplier
    * techModifier
    * criticalModifier
    * difficultyModifier
  )
```

它不是官方源码，但两个独立 golden test 可直接反算：

```text
T=10000, A=80, 城市倍率=.7

相邻普攻 P=15:
sqrt(10000)*80*sqrt(1/1500)*1.6*.7
≈ 231

弩远程 P=5:
sqrt(10000)*80*sqrt(1/1500)*1.2*.7
≈ 173
```

与原作实测一字不差。

因此 ordinary durability 可以标 `empirical-high/reconstructed`，不必继续使用武器 lookup。

### ram / wooden-beast fallback

公开文本逆向只显示它们调用 `005ADE20`，没有展开函数体。

第一版引擎采用公开复刻项目的候选结构，但明确标 `provisional-engine-rule`：

```ts
specialBase =
    attackerTroops / 25
  + sqrt(attackerTroops)
  + min(sqrt(attackerTroops), 40)
    * attackerAttack
    * sqrt(1 / 1500)
    * (1 + durabilityPower / 25)
    * specialMultipliers
```

最终参数必须用下面的原作 golden tests 校准，尤其：

- 冲车：1012
- 木兽：1094

一旦以后把 IDA 中 `005ADE20` 转成文本伪代码，只替换 `specialBase()`。

逆向来源：
- https://github.com/sjn4048/311MemoryResearch/blob/master/内存资料/函数[部队攻击].txt

公开复刻候选：
- https://github.com/tankyc/sango_infinity/blob/main/Project/Assets/Sango/Scripts/Game/Object/Troop/Troop.cs

高质量公式研究：
- https://game.ali213.net/thread-5983352-1-1.html

---

### 4D. 内政设施保留：来源算法已恢复，stock equivalence open

当前专项：[81-capture-selector-source-profile.md](81-capture-selector-source-profile.md)；结构化证据：`../sources/capture-selector-source-profile.json`。

`[source-idb-30d33b44-capture-selector-v1][opcode-exact within source profile]`

IDB输入路径含“血色5.0公测”；该标签只证明固定来源字节语义，`stockOriginalVerified=false`。stock PC-PK1.1复用为 `compatibility-reconstruction`；Vanilla独立 `compatibility-assumption`；PS2/Wii仍open。

来源city-only分支按全局建筑链表序，取同城、已完成、非type30的内政候选，最多30个。内政分支没有owner gate；城市归属由坐标/地图地域映射。未完成另先销毁，完成铜雀台绕过且不占quota，不能把总残存数封为5。P0-46局部模型只消费预资格ID；P0-48新增完整world collector，不再将这些世界筛选步骤留给外部预资格名单。

```text
effectiveCharm = validCommander ? max(20, charmByte) : 20
if n > 1:
    for i in 0..n-1:
        swap(candidate[i], candidate[GetRandomX(n)])
keep = min(n, floor(effectiveCharm / 20))
destroy = n - keep
if capturingForceId not in 0..41:
    destroy = n
return destroyedPrefix(destroy), retainedSuffix(keep unless overridden)
```

这不是Fisher–Yates，n>=2始终消耗n次draw，即使全保留或force override全毁。没有硬性5上限，120魅力在此byte-domain内对应6；旧Wiki100+→5只是未标build的城市攻略分档观察。无主将默认20不得替换为君主魅力。

来源RNG为32位 `state=state*0x6C078965+0x3039`、取高16位再 `%n`（本selector域n<=30）。初始seed与全局调用顺序仍open。参考模型接受记录draw、显式来源state，或单独标 `provisional-engine-rule` 的工程SHA-256 seed适配器；不得把工程seed称为原游戏RNG。

可替换入口：`scripts/capture_selector_profile.py`。trace/replay绑定来源指纹、profile、输入顺序/资格来源、魅力、forceId、全部draw与结果；不重抽，不按ID偷偷排序。验证：`python scripts/check_capture_selector_profile.py`，仅为局部模型与证据检查，非原EXE回归/完整捕获引擎。

旧 `seededSampleWithoutReplacement` 仅是历史 `provisional-engine-rule`，不再作为这个来源profile的实现。原始经验来源仍保留：[魅力分档](https://w.atwiki.jp/sangokushi11/pages/1598.html)、[2011讨论](https://w.atwiki.jp/sangokushi11/pages/2469.html)。

---

### 4D.1 P0-48有界事务与明确fallback

[83-capture-transaction-source-profile.md](83-capture-transaction-source-profile.md) / `scripts/capture_transaction_profile.py`新增完整有序世界资格、3 caller cause/mode、关系排除、资源→normal/neutral ownership→普通入城→耐久顺序及全输入重放。

- neutral finalizer会再次清0中间保留资源；normal ownership改变max时先向下cap耐久，再最终半max floor
- ordinary entry使用完整incoming兵数作气力权重，随后金粮兵和12 cargo slot分别cap；S1非负有界building merge用整数floor
- `unknownEffects=record-only|reject`；entry可选source-scalar-projection/skip/reject，必须命名profile并保留provenance
- record-only显式列出人物/俘虏、force调整/灭亡、销毁计数器/引用、太守排名、事件/AI/显示队列等尚未实现效果；原因是工程范围有界，不是断言原机无副作用
- 原子copy-on-write、去重/revision、命令/世界顺序/policy/draw/结果全trace、JSON与零RNG replay可测；PK是reconstruction，Vanilla独立assumption
- old/normal/neutral动态容量和入城range需显式输入来源，不拿S2 MOD常量冒充S1或stock

这个fallback让独立事务投影可运行，不关闭clean stock、完整战斗/人物/事件或真实存档证据债。先前P0-36对舍入的unknown只继续约束stock和未审troop-to-troop路径，不能再说S1 `004B9840`完全没有body。

### 4D.2 P0-49人员分组与可替换处分

[84-capture-personnel-source-profile.md](84-capture-personnel-source-profile.md)新增S1特产城兵容量适配、post-release人物表资格/顺序、末城/宝物/skill分支、binary32概率和完整随机消费trace。S2有实际hook与常量差异，不能复用来认证S1/stock。

独立模型`capture_personnel_profile.py`采用`hold-captive-v1|observed-codes|reject`；hold只写status5、formerForceId、office80。`partial-person-fields-v1`显式记录旧俘虏前置释放、缺席roster、位置/军团/任务、排序/非hold处分、force/事件未投影。保留输入字段不是推断这些字段在原机不变。没有接入P0-48或训练战斗引擎，stock/完整游戏债不关闭。


### 4D.3 P0-50前置释放与人员迁移

[85-capture-relocation-source-profile.md](85-capture-relocation-source-profile.md) / `capture_relocation_profile.py`实现独立旧俘虏pass和escape有界人物投影。目的地优先链、最近territorial-city表、同分RNG、任务期间低byte、base escape保留实际位置及稳定身份rank排序均绑定S1。PC-PK1.1 reconstruction；Vanilla另assumption。S2距离表1084格不同，不能混用。

`record-person-callbacks-v1`只投影已声明标量，保留人员/军团列表、任务取消资源、太守/force/事件副作用ledger。`defer-unresolved-person-v1`整人跳过004BBB00/004BA520或无效返回上下文；`unresolvedPerson=reject`在任何投影/draw前拒绝整批，`unknownEffects=reject`拒绝所有部分模型。保留字段不等于原作不变；新任务参数只覆盖+140..+150五个dword，不称整个任务状态清空。三个capture参考模块尚未组成完整战斗事务。

源码随机模式是已给定入口seed的纯本地LCG；replay可重算以核验记录，不使用外部随机服务、不推进共享RNG。全局RNG/真实存档与stock对应继续open。维护费俘虏forced-release排序不属于本组建筑处分排序。

### 4E. Golden tests

日文 Wiki 的攻城表继续保留，但角色从“运行时规则”改为“回归测试”。

核心样本（攻击80、无太守）：

```text
直接攻击  耐久231  城兵708
弩普通    耐久173  城兵708
冲车      耐久1012 城兵708
井阑      耐久260  城兵2431
木兽      耐久1094 城兵708
投石      耐久665  城兵1621
```

来源：https://w.atwiki.jp/sangokushi11/pages/92.html

---

### 剩余 exactness

第4项仍需区分：

1. `005ADE20` 等攻城耐久内部函数的完整闭式；
2. P0-46/P0-48来源与clean stock PC-PK1.1的等价性、未覆盖人员/force/事件finalizer及全局RNG回放；
3. Vanilla各补丁及PS2/Wii自身候选、selector、伤害/资源代码；
4. 完整游戏战斗/人物/事件系统集成与真实存档验证；P0-48已补有序world资格和有界事务。

可以按显式版本/profile运行兼容重建，但测试通过不得升级原性等级。

## 5. 火焰持续与“自然蔓延”

> P0-4 专项证据矩阵与当前 exactness 状态见 [39-fire-lifetime-spread-exactness.md](39-fire-lifetime-spread-exactness.md)。本节保留工程 fallback；任何 70/30 权重都不得升级成原版常量。

### 结论：会心“+1回合”高置信；自然邻格扩散应为 0

这一项需要把三个容易混在一起的机制拆开：

1. **点火后该格火焰持续多久**
2. **火罠/火球一次攻击覆盖多少格，以及是否引爆其他火罠**
3. **已经着火的地格是否会在之后的回合自行向相邻格扩散**

目前证据只支持 1 和 2；没有可靠原作证据支持第 3 项。

---

### 5A. 会心对持续时间：+1 回合

`[COMMON][empirical-high]`

日文攻略 Wiki 对火计的说明明确写：

> 火计会心会增加火焰的持续回合数。

五丈原决战制霸攻略也明确建议用深谋点火，因为火计会心能让火持续更久。

更重要的是，一组专门的火计实测给出了成对数据：

```text
无深谋：1 / 3 / 3 回合后熄灭
有深谋：2 / 4 / 4 回合后熄灭
```

即同样的三组火，强制会心后全部**严格 +1 回合**。

因此旧 fallback：

```ts
criticalFireDuration = 3
```

是错误建模，应改为：

```ts
criticalDuration = baseDuration + 1
```

注意：这并没有解决 `baseDuration` 自身的精确随机函数。实测中的 1/3/3 也说明不能把“所有普通火都固定限制在内部 1~2 计数”冒充源码事实；显示回合与内部计数的结算时点、点火来源都可能影响玩家看到的持续长度。

来源：
- https://w.atwiki.jp/sangokushi11/pages/85.html
- https://w.atwiki.jp/sangokushi11/pages/2166.html
- https://www.bilibili.com/opus/374609164980707553
- https://game.ali213.net/thread-1568503-1-1.html

---

### 5B. 基础持续时间 RNG：仍未 exact

`[COMMON][open-exactness]`

目前没有在公开的 311MemoryResearch/SIRE 文本资料里找到“点火时如何生成剩余燃烧回合”的原函数。

已检查的逆向资料能定位：

- 火计/火矢点火后的火伤处理；
- 火神对着火格、火计、火罠的免疫/增伤；
- 火种、火球、业火种、业火球的爆炸伤害；
- 火船/业火种造成眩晕、负伤、战死的概率；

但没有暴露一个可直接引用的“燃烧持续回合参数”。

因此基础持续时间仍必须保持可替换 profile。

### provisional-engine-rule

作为**工程 fallback，而不是原作事实**，采用现代 San11 重制项目的保守权重：

```ts
const defaultTacticalFireLifetime = {
  1: 0.70,
  2: 0.30
}

baseDuration = weightedChoice(defaultTacticalFireLifetime)

duration =
  baseDuration
  + (isCriticalIgnition ? 1 : 0)
```

理由：

- 社区长期描述普通火以 1~2 回合作为常见长度；
- 会心后的常见描述是 2~3 回合；
- 公开重制项目 `sango_infinity` 对火计、火矢、木兽放射、落雷统一使用普通 `[1,2]`、权重 `70/30`，会心 `[2,3]`、同样 `70/30`；
- 这正好满足“会心只把基础结果 +1”这一实测约束。

但这组 70/30 **不是原版反汇编常量**，且不能完全解释所有玩家观察到的 3/4 回合显示值，所以必须：

```ts
fireLifetimeProfile[source]
```

按点火来源可配置，而不是把 70/30 写死在 engine。

建议至少区分：

```ts
type FireSource =
  | "strategy"
  | "fire-arrow"
  | "fire-trap"
  | "lightning"
  | "scripted-event"
```

初版前四类可共享同一 fallback；历史事件火焰由事件脚本显式指定。

工程参考：
- https://github.com/tankyc/sango_infinity/blob/main/Project/Assets/Sango/Scripts/Game/Object/Skill/Effect/SetFire.cs
- https://github.com/tankyc/sango_infinity/blob/main/Build/Content/Data/Common/Skills.json

---

### 5C. “自然蔓延”：原作 fidelity 模式设为 0

`[COMMON][negative-evidence-high]`

经过原版时期攻略、日文 Wiki、SIRE/311MemoryResearch 交叉检索，没有找到《三国志11》存在下面这种机制的可靠证据：

```text
一格已经着火
→ 每旬根据风向/地形概率
→ 自动点燃相邻格
```

相反，原作资料对“火势扩展”的描述都落在**攻击范围和连锁触发**：

- 火种/火炎种/业火种有固定爆炸范围；
- 火球/业火球沿线路滚动并点燃经过区域；
- 落雷点燃目标及周围格；
- 多个火罠可以被火计或火球**连锁引爆**；
- 五丈原攻略直接称为“火球からの連鎖”。

因此“连烧”应建模为：

```ts
igniteByAttackArea()
triggerAdjacentFireTrapChain()
```

而不是：

```ts
spreadFireEveryTurn()
```

原作 fidelity profile：

```ts
naturalAdjacentSpread.enabled = false
naturalAdjacentSpread.probability = 0
```

来源：
- https://www.gamersky.com/handbook/200603/21652.shtml
- https://w.atwiki.jp/sangokushi11/pages/2166.html
- https://w.atwiki.jp/sangokushi11/pages/79.html

### 不要被现代重制项目的 SpreadFire() 混淆

`sango_infinity` 当前确实实现了：

- 每回合向相邻格扩散；
- 按地形可燃性计算概率；
- 扩散代数衰减；
- 可配置最大蔓延概率和寿命；
- `fireSpreadEnabled` 开关。

但这属于该重制项目自己的可配置扩展。其代码/更新记录本身把“火焰蔓延开关”作为新增剧本参数。因此这个模块**不能反向证明 San11 原作有自然蔓延**。

如果我们的项目未来想提供 MOD 模式，可以单独保留：

```ts
ruleset.extensions.naturalFireSpread
```

但 Vanilla/PK fidelity 模式必须关闭。

---

### 5D. SIRE/逆向侧目前能确认什么

311MemoryResearch 已经明确定位很多火系原程序入口，例如：

- `005AEBAF`：火神对火计免疫相关；
- `005AEC19`：火神对低智目标火计必中；
- `005B1263`：火计/火矢点火、着火格对部队/据点火伤；
- `005B1686`：火罠伤害与火神；
- `005B178B`：火罠对火神相关处理；
- `005AE540`：火神通过着火格不减兵；
- `00583008`：火神船只着火不减兵。

以及 `函数[火陷阱炸伤炸死].txt` 中的业火种、火船眩晕/负伤/战死逻辑。

但公开文本研究没有出现“自然扩散”调用链，也没有找到燃烧寿命的原始随机函数。这进一步支持：

- **自然扩散不要添加**；
- **持续时间继续保留一个很小的可替换 fallback**。

逆向来源：
- https://github.com/sjn4048/311MemoryResearch/blob/master/内存资料/函数[火陷阱炸伤炸死].txt
- https://github.com/sjn4048/311MemoryResearch/blob/master/内存资料/修改记录by%20sjn4048.txt

---

### 剩余 exactness

第 5 项现在只剩一个真正未解决的问题：

> 原版在不同点火来源下，`baseDuration` 的内部 RNG / 计数时点到底是什么。

其余两点可以锁定：

```ts
criticalBonusTurns = 1          // empirical-high
naturalAdjacentSpread = false  // negative-evidence-high
```


## 6. 登场 / 自然死亡精确 RNG（P0-5）

> 专项证据矩阵与当前 exactness 状态见 [40-debut-death-exactness.md](40-debut-death-exactness.md)。本节只保留工程 fallback；`+20`、`99岁`、`65/25/8/2` 等均不得升级为原版 EXE exact 常量。

### 结论：dispatcher 已锁定到月初，内部死亡函数仍 open

PC-PK1.1 原公开逆向已确认：

```text
00590C30 MonthlyAction
→ 00482680 月初判定
→ 0058BB30 俘虏/禁仕月份
→ 005833D0 年龄/死亡相关处理
```

因此第一版生命周期接口改成：

```ts
function onMonthStart(state, rng) {
  for (const person of state.persons) {
    updateDebutLifecycle(person, state, rng)
    updateNaturalDeathLifecycle(person, state, rng)
  }
}
```

不能再把 fallback 描述成一个与原 dispatcher 无关的独立“年初死亡任务”。

### 6A. 登场 profile

```ts
function getFallbackDebutGateYear(person, scenario) {
  if (scenario.ignoreAge) return -Infinity

  if (scenario.comeOnStage === "fictional") {
    return person.yearOfBirth + 15
  }

  return person.yearOfDebut
}
```

证据边界：

- 史实：`YearOfDebut` 是时间 gate，不是 Identity；
- 假想：位置随机，登场年提前到成人年；15岁为 empirical-high 成人口径；
- `NOT_INTRODUCED -> NOT_DISCOVERED / NORMAL` 的原 setter、具体月份与 `ScheduledLord` 分支仍 open；
- `IgnoreAge` 至少用于无视普通时间登场/寿命的特殊场景，其他年龄系统不自动推广。

### 6B. Lifetime profile

```ts
function getFallbackLifetimeThreshold(person, scenario) {
  if (scenario.ignoreAge) return Infinity

  const historical =
    getHistoricalCauseAdjustedFallback(person)

  switch (scenario.lifetime) {
    case "historical":
      return historical

    case "longevity":
      return historical + 20
      // empirical compatibility fallback

    case "fictional":
      return person.yearOfBirth + 99
      // documented compatibility threshold
  }
}
```

注意：

- `historical +20` 是否与不自然死修正先后叠加，原作顺序 open；
- Fictional 的99岁是 threshold 还是实际 hard date，open；
- `0048A000 GetDeathYear` 未展开，以上不能标 source-confirmed。

### 6C. Historical cause fallback

自然死：

```ts
threshold = person.yearOfDeath
```

不自然死继续使用可替换工程曲线：

```ts
ageAtBaseDeath =
  person.yearOfDeath - person.yearOfBirth

extra = clamp(
  floor((100 - ageAtBaseDeath) / 3),
  0,
  15
)

threshold = person.yearOfDeath + extra
```

这里的 `15` **只是 fallback 中间阈值上限，不是实际最终死亡 hard cap**。孙策实测存在基础没年之后约16～17年才进入于吉事件的样本；普通没年200的实测也在216年前后。

### 6D. 运行时死亡 gate：保留经验分布，但挂在月初链内

原函数尚未恢复前，若引擎需要闭环，可保留经验年份分布：

```text
effective threshold year   65%
+1 year                    25%
+2 years                    8%
+3 years                    2%
```

实现时它只是：

```text
provisional-engine-rule
inside 005833D0-shaped month-start lifecycle service
```

例如只有在**某年的第一次月初生命周期调用**时执行年度 gate：

```ts
function maybeMarkForDeathAtMonthStart(person, date, rng) {
  if (!isFirstMonthOfYear(date)) return
  if (person.dead || person.markedForDeath) return

  const threshold = getFallbackLifetimeThreshold(person, state.scenario)
  if (date.year < threshold) return

  const overdue = min(date.year - threshold, 3)
  const conditional = [
    0.65,
    0.7142857,
    0.80,
    1.00,
  ][overdue]

  if (rng.chance(conditional)) {
    person.markedForDeath = true
  }
}
```

**这里“只在1月 roll”仍是 fallback 设计，不是 `005833D0` 原指令事实。** 原函数可能每月检查并在内部按日期 gate；以后拿到函数体必须替换。

不再在 flag 立起时预抽“本年度死亡旬”。因为当前已确认的是月初 dispatcher，而 flag 后真正死亡是否可发生旬中、月中或只在月初，仍未恢复。

### 6E. HealthLevel 与死亡 flag 分开

```text
markedForDeath
!=
HealthLevel
!=
Identity=DEAD
```

fallback 可让死亡 flag 影响病弱表现，但不能再额外叠一套独立“健康 RNG 导致死亡”，否则会重复计算寿命风险。

健康自然恢复/恶化的 exact 公式继续 open。

### 6F. RNG / 历史事件

- 死亡判定使用模拟器正常 PRNG；不使用 `hash(personId,year)` 固定未来。
- 同一完整存档保存 PRNG state 后仍应可回放；改变此前 RNG 消耗后，未来死亡允许变化。
- 历史事件可直接死亡、延寿或拦截普通寿命流程。孙策于吉事件胜利的 +20 年继续作为明确事件效果。

### 剩余 exactness

1. `005833D0` 完整函数体；
2. `0048A000 GetDeathYear` 完整函数体；
3. raw `ComeOnStage / Lifetime / IgnoreAge` enum；
4. 史实 `ScheduledLord` 登场分支；
5. 普通登场 setter / 月份；
6. Longgevity 与死因修正顺序；
7. Fictional 99岁 phase；
8. `markedForDeath` 原概率和时点；
9. flag 后病情 / 真正死亡时序；
10. Vanilla / 主机版差异。

## 7. 混乱 / 伪报持续与恢复

### 结论：自然恢复已由 PC-PK1.1 原函数闭合；只剩初始计数与重复施放语义

这一项必须拆成：

1. 施加异常时写入多少剩余计数；
2. 每旬状态行为；
3. 每旬怎样减少计数；
4. 什么时候恢复正常；
5. 重复施放如何刷新已有异常。

当前第2～4项已由 `00599B90` 完整恢复；第1项对“少兵自动混乱”也已恢复，但普通伪报/扰乱仍缺效果函数体。

---

### 7A. 原作不是“每旬掷骰决定是否醒来”

`[PC-PK1.1][reverse-engineered]`

311MemoryResearch 的 `Func-自动03-部队异常状态处理.txt` 给出每旬处理函数：

```text
00599B90
```

部队结构明确分开保存：

```text
+0x24 status
+0x28 statusTurnCount
```

自然恢复是：

```ts
remaining = Math.max(0, remaining - recoveryStep)

if (remaining === 0) {
  clearAbnormalStatus(unit)
}
```

不存在：

```ts
if (random() < recoveryChance) recover()
```

因此旧 fallback“每旬50%清醒”等概率模型全部删除。

---

### 7B. 本旬状态行为发生在倒计时之前

`[PC-PK1.1][reverse-engineered]`

混乱：

```text
若本旬尚未行动
-> 直接设置为已行动
```

伪报：

```text
若本旬尚未行动
-> 取得所属据点
-> 执行朝所属据点退却的移动处理
-> 设置为已行动
```

然后才进入统一的 `statusTurnCount` 减少。

所以结算顺序必须是：

```text
异常行为
→ 已行动
→ 倒计时
→ 0时恢复正常
```

---

### 7C. PC-PK1.1 阵/砦/城塞：每旬 -2，不是“恢复概率提高”

`00599C25` 先把恢复步长设为1。

随后原函数根据势力已研究技巧选择当前阵系设施：

```text
默认：阵 ID3
技巧25 强化设施：砦 ID4
技巧26 强化城墙：城塞 ID5
```

再读取对应设施最大有效范围，检查部队是否位于同势力合资格设施范围内。

命中时：

```text
00599CAB recoveryStep = 2
```

所以：

```text
普通位置：每旬 -1
PK合资格阵系范围：每旬 -2
```

例如剩余3：

```text
普通：3 -> 2 -> 1 -> 0
设施：3 -> 1 -> 0
```

日文 Wiki 对玩家只描述为“状态异常恢复率增加”；原 EXE 把它具体实现成双倍倒计时步长。日文 Wiki 还明确记录 PC 无印的阵系没有这一异常恢复加速，因此不能把 PK 的 `-2` 静默套给 PC Vanilla。

---

### 7D. setter 与结构字段

SIRE 地址表：

```text
004AEA70 SetTroopStatus
00496350 SetTroopTurnCount
00472150 GetRandomX(X) => 0..X-1
```

这再次确认状态类型和持续计数是独立数据。

---

### 7E. 少兵自动混乱的初始计数已经精确

`函数[自动眩晕].txt` 的原代码：

```text
0059A1F5 push 02
0059A1F7 call 00472150
0059A1FF inc al
...
0059A207 push 01
0059A20B call 004AEA70
```

因此：

```text
duration = GetRandomX(2) + 1
         = 1 或 2
```

这条只属于“少兵自动混乱”来源，不能反推出普通计略的伪报/扰乱也使用同一分布。

---

### 7F. 普通伪报 / 扰乱的初始计数仍缺 exact

普通计略效果入口已定位：

```text
005917D0  伪报
00591A20  扰乱
00591C70  镇静
```

但公开逆向记录没有展开前两个函数体内“初始 duration 怎样生成”的逐指令。

目前可靠边界：

- 日文 Wiki 只写普通伪报/扰乱持续“数回合”；
- 会心伪报/扰乱至少持续2回合；
- 2007旧讨论里有“会心3回合”的玩家记忆，只作为历史经验，不升级为精确常量。

所以不能源码级填：

```text
普通1/2的概率
会心2/3的概率
```

---

### 7G. 性格 / 智力影响会心，不进入后续恢复函数

计策爆击率逆向显示，性格和双方智力参与伪报/扰乱的会心判定。

但 `00599B90` 的后续倒计时不读取这些属性。

正确分层是：

```text
属性/性格
-> 是否成功/是否会心
-> 初始 duration（此处部分open）
-> 每旬固定倒计时（已exact）
```

而不是：

```text
智力高 -> 每旬更容易随机恢复
```

---

### 7H. provisional-engine-rule：只替代初始 duration

开源复刻项目 `tankyc/sango_infinity` 的公开 `Skills.json` 对 ID24伪报、ID25扰乱采用：

```text
普通：1回合70%，2回合30%
会心：2回合70%，3回合30%
```

来源：

- https://github.com/tankyc/sango_infinity/blob/main/Build/Content/Data/Common/Skills.json

这不是原作证据，只能作为工程 fallback：

```ts
function fallbackInitialDuration(critical) {
  const base = weightedChoice({1: 0.70, 2: 0.30})
  return critical ? base + 1 : base
}
```

随后必须回到 exact 倒计时。

---

### 7I. 重复施放

旧 fallback：

```text
min(5, max(old,new)+1)
```

没有原作证据，删除。

在 `005917D0 / 00591A20 / 004AEA70` 覆盖语义完全恢复前，工程上可暂用：

```text
remaining = max(currentRemaining, newlyRolledDuration)
```

但必须标 `provisional-engine-rule`。

---

### 7J. 镇静

镇静是主动清除混乱/伪报，不走自然倒计时。

日文 Wiki 记录会心镇静会扩展到目标邻接友军。该行为与自然恢复系统分开实现。

---

### 第7项剩余 exactness

现在真正剩下：

1. `005917D0` 普通伪报初始 duration 原函数；
2. `00591A20` 普通扰乱初始 duration 原函数；
3. `004AEA70` 对已有异常的精确刷新/覆盖语义；
4. 原版螺旋突刺混乱 duration 的逐指令链；
5. Vanilla/主机版逐指令差异。

**自然恢复本身已经解决，不再是概率问题。**

详细专项见 `28-status-duration-recovery.md`。

## 6.99 野外补给 / 输送抵达（P0-13）

> 专项： [48-supply-transport-finalizer-exactness.md](48-supply-transport-finalizer-exactness.md)。

野外补给 fallback：

```ts
accepted = min(requested, targetRemainingCapacity, supplierAvailable)
supplier -= accepted
target += accepted
```

枪/戟/弩/马补兵还需：

```text
acceptedTroops <= supplierMatchingEquipment
```

未转移资源继续留在 supplier；不要套用“据点抵达 overflow 丢弃”。

气力兼容取整：

```ts
mixedMorale = floor(
  (oldTroops*oldMorale + addTroops*incomingMorale)
  / (oldTroops+addTroops)
)
```

这里 floor 只是 compatibility-rounding，原 troop→troop helper 未恢复。

输送抵达据点：

```text
按据点容量接收
overflow -> discard + warning
+200 merit
transport completion
```

overflow discard 是PC empirical-high；逐字段 opcode/order仍open。

---

## 6.9 技巧研究时间（P0-14）

> 专项： [49-technique-research-time-exactness.md](49-technique-research-time-exactness.md)。

时间 calculator containing function：

```text
005D7DD0 .. 005D7EFF
```

人才府末端修正 exact：

```ts
if (hasTalentOffice)
  turns -= 2

turns = max(1, turns)
```

基础矩阵未恢复前，兼容 fallback 继续：

```text
枪戟弩骑练兵：3/4/6/9旬
发明防卫火攻内政：4/5/7/10旬
```

然后 exact 应用人才府 -2旬、最低1旬。

超级70/140/210/280仅作为 empirical-high profile；不要复制给初级/上级。

---

## 7.0 训练生命周期（P0-11 / P0-47）

当前来源：[82号审计](82-training-lifecycle-source-profile.md)；运行实现：[v2指南](../engine/pk-training-lifecycle.md)。

S1来源gate已确认拒绝零兵力、已训练和满气力；执行者helper过滤identity0..3、非部队、未行动、missionDuration0。S1仍为MOD关联profile，stock等价未核；same-force/same-base/去重复是明示引擎安全约束，不能反说这些全在`005B8320`本体。

本项目默认compatibility-reconstruction采用：

```ts
warXp = min(3000, warXp + 2) // 累计，不扣100
war = max(1,min(100,warBase+floor(warXp/100)))
```

配置和profile写入存档并接受重放；覆盖100/3000与能力cap边界。默认保守gate不允许满气力刷经验，EndTurn可连续运行。旧XP到100拒绝的临时限制已移除。

S1 reset的真实全局loop及field-morale tail-xref已恢复；单势力训练内核只按显式phase plan推进日历、回AP、重置所表示的据点/武将flags。任务/位置不改变，月季边界不执行未实现系统。该scope和APheadcount过滤是provisional-engine-rule，不是完整原scheduler。

既有野外恢复行为仍可复用（平台10/诗想20，无平台奏乐5，气力100/120cap），但本切片没有野外部队。完整原scheduler/AP时序/任务与属性合成、clean stock、全局RNG和跨版本继续open；不会因fallback可运行便清除证据债。

## 7.0.1 阵系耗粮重叠 / 粮尽逃兵（P0-12）

> 专项： [47-food-overlap-starvation-exactness.md](47-food-overlap-starvation-exactness.md)。

### 防御设施 multiplier

原版只选择一个设施 type；禁止倍率相乘。

兼容 selector：

```ts
selectedType =
  highestTier(overlappingFriendlyDefenseFacilities)
```

即城塞 > 砦 > 阵，但只标：

```text
provisional-engine-rule
```

倍率必须使用原 float32 bit pattern，不能替换成5/3、4/3。

### starvation

严格 fidelity：

```text
starvationProfile = unresolved-original
```

旧兼容模式若必须保持历史模拟：

```text
retentionPerTurn = 0.76
```

但标签必须：

```text
legacy-compatibility-only
provenance-unresolved
```

不要再标 empirical-high。

---

## 7.1 部队主副将关系 / 浮点取整（P0-10）

> 专项： [45-deputy-rounding-exactness.md](45-deputy-rounding-exactness.md)。

### 不再需要 rounding fallback

`00707A74` 已识别为 MSVC `_ftol2`：

~~~text
san11FloatToInt(x) = trunc toward zero
~~~

正常正值：

~~~text
= floor(x)
~~~

所以不要再提供可切换的 `round/floor/trunc` profile。

### 关系 helper

可直接实现：

~~~text
普通：main + floor(max(sub-main,0)/4)
亲爱：main + floor(max(sub-main,0)/2)
夫妻/义兄弟：max(main,sub)
血缘：main + floor(max(sub-main,0)/3)
~~~

其中血缘/3仍标 cross-platform-high，而非 PC opcode exact。

两副将：

~~~text
max(combine(main,sub1), combine(main,sub2))
~~~

不能相加。

### 仍需 profile 化的只剩

- 血缘PC opcode；
- 夫妻/义兄弟PC exact branch；
- 单向亲爱/结义关系检查方向；
- Vanilla/主机版；
- x87中间精度极端边界。

---

## 7.2 部队出征 / 回城资源事务（P0-9）

> 专项： [44-troop-resource-transaction-exactness.md](44-troop-resource-transaction-exactness.md)。

### 可以固定的容量与资源语义

~~~text
battle:
  money <= 10000
  food  <= 50000

transport:
  troops <= 60000
  money <= 100000
  food <= 500000
  ordinary equipment quantity <= 100000
~~~

战斗兵装成本 fallback：

~~~text
ID0      0
ID1..4   selectedTroops
ID5..8   1
ID9      0
ID10..11 1
~~~

其中 1..4 等量为 official/gameplay-high；件数型=1 为 documented/empirical-high。

### finalizer 未恢复前的工程事务

~~~text
1. commit 时重新校验 source inventory
2. 原子扣除据点资源
3. 写入 runtime troop
4. 任一步失败则工程层 rollback
~~~

这四步是 engineering safety profile，不能标成原 EXE 顺序。

### 回城 overflow fallback

~~~text
accepted = min(incoming, remainingCapacity)
overflow = incoming - accepted
overflow -> discard + warning
~~~

“超过容量会损失”有原作实测支持；逐资源处理顺序仍 open。

### 禁止事项

不能：

- 把 sub_647250 / sub_647AC0 / sub_615790 当 finalizer；
- 把现代 sango_infinity 的 Cost/Remove/EnterCity 顺序当原版；
- 把 woundedTroops 的现代返还策略反推为 San11；
- 把 transport 件数型舰船/攻具无条件套普通100000 quantity语义。

---

## 7.3 官职自动分配 selector（P0-8）

> 专项： [43-auto-office-selector-exactness.md](43-auto-office-selector-exactness.md)。

### 不再 fallback 的核心

单个官职的 `005FAF00` scoring/tie 已恢复，不再自拟“按功绩排序”。

实现：

```ts
best = null
bestScore = INT_MIN

for (person of callerCandidates) {
  if (!qualification005FA4D0(person, office))
    continue

  if (person.trueLoyalty < 90)
    continue

  score =
    mode === "weighted-threshold"
      ? originalWeightedScore(person, office)
      : originalAffinityScore(person, office)

  if (score == null)
    continue

  if (score > bestScore) {
    best = person
    bestScore = score
  }
}
```

相同 score 不替换。

### 仍需 fallback 的只有 caller 层

未知：

```text
candidate list 的原始顺序
arg3 的业务映射
多个 office 的遍历顺序
已分配武将何时移出后续候选
```

若引擎必须先闭环：

```ts
callerCandidateOrder =
  stablePersonIdAscending

officeTraversal =
  officeIdAscending

removeSelectedImmediately =
  true
```

全部标：

```text
provisional-caller-scheduler
```

不要把这些 fallback 混入已经闭合的 `005FAF00` selector。

模式字段必须写：

```text
weighted-threshold
role-affinity
```

在 caller xref 恢复前不要改名成 `AI/player`。

---

## 7.4 俘虏资金不足释放 / 主动释放（P0-7）

> 专项： [42-captive-release-exactness.md](42-captive-release-exactness.md)。

### 资金不足：人数 exact，排序 profile 化

```ts
paidCount =
  min(prisonerCount, floor(gold / 50))

releaseCount =
  prisonerCount - paidCount
```

原作已经确认存在：

```text
0058C320 comparator
→ 004AA200
→ 004A8E10 裁剪到 releaseCount
→ 0058D1D0
→ 月末段 0058D430 finalizer
```

但 comparator 字段/方向未恢复。

因此 fallback 只允许：

```ts
maintenanceReleaseSelector =
  stablePersonIdOrder
```

并必须标：

```text
provisional-engine-rule
```

不能自拟“低能力先放 / 高能力先放 / 低忠先放”。

### 主动释放技巧P

官方只确认正向增加技巧P，未给点数。

兼容 fallback：

```ts
manualReleaseTechniquePointGain = 3
```

证据等级仅：

```text
empirical-compatibility
```

### Forbidden 按 cause 分离

不要写：

```ts
releaseCaptive() {
  forbiddenMonths = 3
}
```

建议至少：

```ts
type CaptiveExitCause =
  | "natural-escape"
  | "maintenance-shortfall"
  | "manual-exile-command"
  | "immediate-after-capture"
  | "force-destruction"
  | "diplomatic-exchange"
```

兼容 profile 可暂用：

```ts
{
  "natural-escape": 3,
  "manual-exile-command": 3, // disputed candidate
  "maintenance-shortfall": null,
  "immediate-after-capture": null,
  "force-destruction": 0,
}
```

`null` 表示 exact open，不等于0。

资金不足自动释放默认**不要发主动命令的技巧P奖励**，除非后续恢复 `0058D430` 证明它会走相同奖励函数。

---

## 7.5 褒赏 / 欠薪 / 流言非自然忠诚（P0-6）

> P0-6 专项见 [41-nonnatural-loyalty-exactness.md](41-nonnatural-loyalty-exactness.md)。

### 结论

当前不再允许以下三个旧式 fallback：

```text
褒赏 = 固定 +3..10
欠薪 = 剩余资金部分支付后统一 -10..30
流言 = 成功后全城所有武将统一 -N
```

### 金钱褒赏

命令层固定：

```ts
costGold = 100 * count
costAP   = 5 * count
```

忠诚增量必须 profile 化：

```ts
gain = cashRewardProfile.roll({
  rulerCharm,
  target,
  rng,
})
```

当前没有精确原函数。已有 +5/+8/+9 原作实测，因此不要采用现代复刻“保底11”的规则。

### 月俸事务

PC-PK1.1 外层精确：

```ts
function settleSalary(postCaptiveGold, salarySum) {
  if (salarySum <= postCaptiveGold) {
    return {
      gold: postCaptiveGold - salarySum,
      shortfall: false,
    }
  }

  return {
    gold: postCaptiveGold, // 不扣部分工资
    shortfall: true,
  }
}
```

欠薪时：

```text
0058D5E0
→ 累计待处理武将
→ 所有据点扫描完
→ 0058C190
```

受罚 selector 与 loss 值仍 open，不能自拟为“全员固定掉忠”。

### 流言

第一版只能把接口写对：

```ts
const targets =
  rumorProfile.selectTargets(city, rng)

for (const person of targets) {
  changeLoyalty(
    person,
    -rumorProfile.rollLoss(person, rng)
  )
}

rumorProfile.applySecurity(city, rng)
```

不能写：

```ts
for (const person of city.officers) {
  person.loyalty -= random(8, 15)
}
```

百人都市在300+成功流言后仍只有少数武将明显掉忠，已足以否定 blanket-all-officer 模型。

现代复刻中的“全员8..15+义理加权”继续标 `mod/reconstruction-only`。

### 剩余 exactness

- 褒赏原 RNG/魅力/义理公式；
- 宝物授予/没收 exact value mapping；
- `0058D5E0 / 0058C190`；
- `005D05B0 / 005D05F0`；
- 流言 target selector / loyalty loss / security loss。

---

## 8. 单挑连续命中 / 伤害函数（E14 已闭合通用核心）

### 结论：核心连续公式已找到，不再需要自拟 ratio fallback

`[PC-PK-oriented][reverse-engineered]`

公开项目 `tankyc/sango_infinity` 的单挑子系统不是按攻略重新猜参数。其 `Duel.cs` 文件头明确写明：

```text
单挑(Duel)系统主体
由 s11_sys_duel.h + s11_sys_duel.cpp 翻译而来
```

并且：

- 枚举/常量保留原始 C++ 命名；
- 代码区按原地址区间标注，例如“伤害 / 登场 / 行动（508cc0 - 50c490）”；
- 方针静态表直接标出原数据地址 `8b1750 StanceCoef`；
- 必杀斗志表标出 `837398 SpecialSpiritCost`。

项目的数据导出脚本也直接以 `San11pk` 目录为输入。因此这套连续核心可作为 PC-PK 原作逆向实现的高置信来源。

注意：该项目后来把吕布、关羽、张飞等**特定武将例外**改成了 `DuelPersonBehaviours` 数据驱动 hook。以下公式只抽取 hook 之前/之外的**通用原作核心**，不把该项目新增 MOD 配置反向当成原版事实。

来源：
- https://github.com/tankyc/sango_infinity/blob/main/Project/Assets/Sango/Scripts/Game/Duel/Duel.cs
- https://github.com/tankyc/sango_infinity/blob/main/Project/Assets/Sango/Scripts/Game/Duel/DuelEnum.cs
- https://github.com/tankyc/sango_infinity/blob/main/Data/事件系统-项目变更影响评估.md
- https://github.com/tankyc/sango_infinity/blob/main/Data/Export/export311Scenario.bat

---

### 8A. 武力不是简单“相减”或“相除”，而是先生成 actionRatio

设：

```ts
SA = attackerMartialAfterInjury
SD = defenderMartialAfterInjury
```

所有除法均为 C/C# 整数除法（向 0 截断）。

原函数可整理成：

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

a = duelScore(SA, SD) ** 2
d = duelScore(SD, SA) ** 2
sum = a + d

if (a >= d) {
  actionRatio =
    min(trunc(a * 100 / sum), 99)
} else {
  actionRatio =
    100 - min(trunc(d * 100 / sum), 99)
}
```

`actionRatio` 最终范围 1～99；两边武力完全相同时严格为 **50**。

可复算锚点：

| 武力 | 攻方 actionRatio |
|---|---:|
| 1 vs 1 | 50 |
| 100 vs 100 | 50 |
| 100 vs 95 | 55 |
| 80 vs 75 | 52 |
| 100 vs 80 | 62 |
| 80 vs 60 | 60 |

这恰好解释了日文 Wiki 旧实测里看似矛盾的两条记录：

- 武力差 0 时，1/1 与 100/100 的普通伤害相同；
- 但同样差 5，100/95 与 80/75 的伤害并不相同。

原因就是原公式不是只看 `SA-SD`，而是通过上面的非线性 score 同时使用绝对武力和档位差。

实测交叉：
- https://w.atwiki.jp/sangokushi11/pages/30.html
- https://w.atwiki.jp/sangokushi11/pages/2484.html

---

### 8B. 四种方针的底层系数表

`8b1750 StanceCoef`：

| 方针 | speed | hit | attack | block | attackSub | spiritGain |
|---|---:|---:|---:|---:|---:|---:|
| 攻击重视 | 42 | 71 | 16 | 12 | 3 | 4 |
| 防御重视 | 10 | 200 | 14 | 90 | 2 | 8 |
| 斗志重视 | 15 | 125 | 14 | 55 | 3 | 10 |
| 一击重视 | 5 | 71 | 16 | 22 | 3 | 7 |

另有两个尚未命名的字段 `_10/_14`，不应为了“完整”擅自赋予语义。

---

### 8C. 普通攻击伤害：闭式解决

通用原函数：

```ts
n = stance.attack
n = trunc(n * actionRatio / 50)
n = trunc(n * stance.attackSub * 7 / 27)

baseDamage = max(n, 3)
```

因此同武力 `actionRatio=50` 时：

```text
攻击重视：16 * 50/50 * 3*7/27 = 12
防御重视：14 * 50/50 * 2*7/27 = 7
斗志重视：14 * 50/50 * 3*7/27 = 10
一击重视：16 * 50/50 * 3*7/27 = 12
```

这与日文 Wiki 实测的 12 / 7 / 10 完全吻合。

### 后续通用倍率

原核心继续按整数顺序应用：

```ts
damage = baseDamage

// 初级难度才有这组单挑伤害修正
if (difficulty === "easy") {
  if (playerAttacksAI) damage = trunc(damage * 11 / 10)
  if (aiAttacksPlayer) damage = trunc(damage * 4 / 5)
}

// 宝物
if (hasCrescentHalberd)
  damage = trunc(damage * 9 / 8)
else if (hasLongWeapon)
  damage = trunc(damage * 10 / 9)

// 气合
if (attackerHasAttackBuff)
  damage = trunc(damage * 5 / 4)

// 坚守
if (defenderHasDefenseBuff)
  damage = trunc(damage * 3 / 4)

// 攻击重视会心连击的每一击
if (action === ATTACK_CRITICAL)
  damage = trunc(damage * 3 / 4)
```

所以旧文档的：

- “气合约 +20%”应改为**核心代码 ×5/4**；
- “坚守约 -25%”可以升级为**×3/4**。

特定武将的额外伤害修正不并入此通用式，另列人物 exception data。

---

### 8D. 命中 / 格挡 / 闪避：完整流程

普通攻击并不是一个简单“命中率”。

先计算命中阈值：

```ts
ratio = actionRatio
hit = attackerStance.hit
block = defenderStance.block

pHit = hit
pHit = trunc(pHit * (100 - block) / 80)
pHit = trunc(pHit * ratio / 50)

// 每次攻击额外加一个 0..9 的随机整数
pHit += randInt(0, 9)

pHit = clamp(pHit, 10, 99)
```

随后：

```ts
if (chance(pHit)) {
  result = HIT
} else if (chance(calcDodgeChance(defender))) {
  result = DODGE
} else {
  result = BLOCK
}
```

也就是说“未命中”还要再拆成**闪避**和**格挡**。

闪避率：

```ts
pDodge =
  10 + trunc((defenderMartial - attackerMartial) / 3)

pDodge = clamp(pDodge, 5, 30)

if (defenderStance === DEFENSE) {
  pDodge += 25
}
```

注意防御重视的 +25 是在 5～30 clamp **之后**加，所以最终防御重视闪避率可到 30～55%。

---

### 8E. 格挡不是 0 伤害

命中后：

```ts
damage = n
```

普通格挡：

```ts
damage = trunc(n / 2)
```

若**防守方当前方针就是防御重视**：

```ts
damage = max(trunc(n * 3 / 10), 1)
```

闪避：

```ts
damage = 0
```

这直接复算 Wiki 同武力测试：

```text
攻击重视：
命中12
普通格挡6
防御重视格挡3

斗志重视：
命中10
普通格挡5
防御重视格挡3

防御重视攻击：
命中7
普通格挡3
防御重视格挡2
```

---

### 8F. “攻击重视会心 3～4 连击”每一下都独立判定

原 `UpdateAction()`：

```ts
actionCount = 1

if (action === ATTACK_CRITICAL) {
  actionCount = 3 + randInt(0, 1)
}

for (i = 0; i < actionCount; i++) {
  result[i] =
    calcActionResult(attacker, defender)
}
```

所以“3～4 连击”**不是 3～4 下必中**：

- 连击数先随机为 3 或 4；
- 每一下重新计算/抽取 Hit / Dodge / Block；
- 每一下的攻击重视会心伤害再 ×3/4。

例如同武力攻击重视、无其他修正：

```text
普通完整命中：12
会心连击单次完整命中：9
普通格挡：4
防御重视格挡：2
```

这正是旧 Wiki 实测里“攻击方针会心单击约 9、格挡约 4”的来源。

---

### 8G. 必杀伤害也由同一个 actionRatio 驱动

通用基础：

```ts
n = trunc(actionRatio * 20 / 55)
```

原函数的整数运算顺序是：

```ts
n = trunc(actionRatio * 20 / 55)

// 先处理持续 buff
if (attackerHasAttackBuff)
  n = trunc(n * 5 / 4)
if (defenderHasDefenseBuff)
  n = trunc(n * 3 / 4)

// 再处理武器
if (hasCrescentHalberd)         // 方天画戟
  n = trunc(n * 9 / 8)
else if (hasLongWeapon)
  n = trunc(n * 10 / 9)

// 特定人物 hook 在这里；通用基线为 ×1

// 然后处理必杀类型
switch (special) {
  case DEADLY_MOVE:   n = trunc(n * 6 / 5); break
  case WEAK_POINT:    n = n;                 break
  case PEERLESS:      n = n * 3;             break
  case HIDDEN_WEAPON: n = trunc(n * 6 / 5); break
  case FEINT_RETREAT: n = trunc(n * 3 / 2); break
  case FIGHTING_SPIRIT:
  case STEADFAST:     n = 0;                 break
}

// 初级难度修正
if (difficulty === "easy") {
  if (playerAttacksAI) n = trunc(n * 11 / 10)
  if (aiAttacksPlayer) n = trunc(n * 4 / 5)
}

// 对手当前选择防御重视
if (defenderStance === DEFENSE)
  n = trunc(n * 3 / 4)

n = min(n, 80)
```

必须保留这个顺序，因为多次整数截断会让“先乘谁”影响最终 1 点级结果。

同武力 `actionRatio=50`：

```text
base = trunc(50 * 20 / 55) = 18

必杀技 = 21
急所   = 18
无双   = 54
暗器   = 21
假退却 = 27
```

恰好与原作实测表全部一致。

---

### 8H. 斗志增长也已闭合

E14 还恢复：

```ts
n = max(value, minimum)
n = trunc(n * stance.spiritGain / 7)

if (receivingHit)
  n = trunc(n * 5 / 4)

if (hp < 30)
  n = n * 2
else if (hp < 50)
  n = trunc(n * 3 / 2)

if (hasSword)
  n = trunc(n * 3 / 2)
```

难度另有：

```text
初级玩家 ×6/5
超级玩家 ×4/5
超级AI ×6/5
```

其中 `minimum` 通常为3；被击且处于防御/斗志重视时为5。

因此“剑提高斗志的系数”也不再 open，精确为最终增长 `×3/2`。

---

### 8I. 原 fallback 删除

旧：

```ts
ratio = sqrt(
  ((attackerMartial + 50)
  / (defenderMartial + 50)) ** 2
)
```

属于为了闭环自拟的近似，现在没有继续保留的必要。

单挑核心接口改为：

```ts
actionRatio =
  calcOriginalDuelActionRatio(atkMartial, defMartial)

actionResult =
  calcOriginalDuelActionResult(
    actionRatio,
    atkStance,
    defStance,
    rng
  )

damage =
  calcOriginalDuelDamage(
    actionRatio,
    actionResult,
    atkStance,
    defStance,
    buffs,
    items,
    difficulty
  )
```

---

### 8J. 版本边界与剩余 exactness

当前可以升级为高置信 reverse-engineered 的是：

- 通用 `actionRatio`；
- 四方针系数表；
- 普攻基础伤害；
- Hit / Dodge / Block；
- 格挡减伤；
- 攻击重视会心 3/4 连击；
- 通用必杀伤害；
- 气合/坚守倍率。

仍需单独审计：

1. 吕布、关羽、张飞、黄忠等人物特例在原 C++ 中的硬编码原貌；当前开源项目已重构成数据文件；
2. Vanilla EXE 是否与该 PC-PK 导向 C++ 版本完全逐字一致；
3. 各主机版是否同式。

因此：

```ts
pcPkGenericDuelCore.status = "reverse-engineered"
vanillaGenericDuelCore.status =
  "compatibility-assumption"
```

但第 8 项原本真正关心的“连续命中 / 普通伤害连续公式”已经解决。

---


## 9. 舌战普通牌心理伤害（E15 已闭合通用核心）

### 结论：普通话题牌心理伤害公式已恢复，不再需要 provisional fallback

`[PC-PK-oriented][reverse-engineered]`

公开项目 `tankyc/sango_infinity` 的 `Debate.cs` 文件头明确写明：

```text
舌战(Debate)系统主体
由 s11_sys_debate.h + s11_sys_debate.cpp 翻译而来
```

并保留原 C++ 数据结构、枚举语义和原数据地址注释，例如：

- `8b3380`：话题牌等级伤害系数；
- `8b338c`：话题牌愤怒伤害系数；
- `5201c0`：舌战初始化入口标注。

和单挑一样，该项目后续加入了 `DebatePersonBehaviours` 数据驱动人物 hook。下面只取 hook 之前的**通用核心**，不把后来新增的人物 MOD 修正冒充原作。

来源：
- https://github.com/tankyc/sango_infinity/blob/main/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs
- https://github.com/tankyc/sango_infinity/blob/main/Project/Assets/Sango/Scripts/Game/Debate/DebateEnum.cs

---

### 9A. 心理槽内部值是 1000

通用常量：

```ts
MaxHP = 1000
MinHP = -100
MaxStress = 100
```

所以画面中的“心理槽”不是按 0～100 的整数伤害结算；普通一张大话题牌造成 150～300 左右的内部伤害是正常量级。

当心理值每累计减少约 250，足场崩坏一级：

```ts
crumbledLevel =
  clamp(trunc((1000 - hp) / 250), 0, 3)
```

这也解释了“心理槽每掉约1/4，足场崩一次”的攻略观察。

---

### 9B. 双方智力先生成各自固定的舌战 attack

设：

- `I` = 自己智力
- `J` = 对手智力

进入舌战时：

```ts
attack =
  100
  + trunc(
      40 * (I - J)
      / (131 - I)
    )
```

原代码注释范围约为 70～227。

几个重要性质：

1. **双方同智力时，不论是 30/30 还是 100/100，attack 都是 100。**
2. 智力差相同但绝对智力不同，attack 不一定相同，因为分母是 `131-I`。
3. 高智力方的优势是非线性的。

示例：

```text
I=80, J=80  → attack=100
I=100,J=100 → attack=100
I=100,J=80  → attack=125
I=80, J=100 → attack=85
```

注意 `attack` 是在舌战初始化时基于双方智力算出的运行时字段，普通牌伤害直接读取它。

---

### 9C. 牌力只决定“谁赢”，牌差不进入伤害

普通话题牌的比较 power：

```ts
power =
  1 + cardLevel // 小/中/大 => 1/2/3

if (cardTopic === currentTopic)
  power += 10
```

所以：

```text
非当前话题：小1 / 中2 / 大3
当前话题：  小11 / 中12 / 大13
```

因此任何当前话题的小牌都压过任何非当前话题的大牌。

特殊牌 power：

```text
无视   120
大喝   110
诡辩    20
普通牌 1～13
镇静/激昂等 0
```

这与官方/同期攻略长期总结的优先级：

`无视 > 大喝 > 诡辩 > 话题牌 > 镇静/激昂`

一致。

关键点：

> **赢了多少并不会额外增加心理伤害。**

例如当前话题“大”13 打败非当前话题“小”1，并不会因为“差12点”再加伤害。伤害只看胜者自己的 attack、自己的牌等级、自己的话题匹配和愤激状态。

所以旧 fallback 中的：

```ts
ordinaryBase =
  10 + 2 * max(cardAdvantage, 0)
```

应删除。

机制交叉：
- https://www.4gamer.net/games/024/G002453/20060210150000/
- https://www.gamersky.com/handbook/200604/22092.shtml
- https://w.atwiki.jp/sangokushi11/pages/141.html

---

### 9D. 普通话题牌的精确心理伤害

先定义牌等级系数：

```ts
levelCoef = {
  small:  10,
  medium: 15,
  large:  20
}
```

原数据地址注释：`8b3380`。

普通、未愤激状态下的话题系数：

```ts
topicCoef =
  cardTopic === currentTopic
    ? 10
    : 6
```

正常 `angerCoef = 10`。

每次实际攻击还有一个很小的独立随机扰动：

```ts
roll = randInt(0, 4)
```

最终：

```ts
hpDamage =
  trunc(
    (attack + roll)
    * angerCoef
    * levelCoef
    * topicCoef
    / 1000
  )
```

因此非愤激的普通牌可简写为：

```ts
hpDamage =
  trunc(
    (attack + randInt(0,4))
    * 10
    * levelCoef
    * (matchesTopic ? 10 : 6)
    / 1000
  )
```

必须保留整数运算口径。

---

### 9E. 同智力 golden table

双方智力相同：

```ts
attack = 100
roll = 0..4
```

得到：

| 普通话题牌 | 当前话题匹配 | 非当前话题 |
|---|---:|---:|
| 小 | 100～104 | 60～62 |
| 中 | 150～156 | 90～93 |
| 大 | 200～208 | 120～124 |

这张表非常适合作为 engine golden tests。

例如同智力，“当前话题小牌”虽然能在牌力上打赢“非当前话题大牌”，但前者造成约100伤害；如果后者在别的回合获胜，它自身的非当前大牌伤害约120。**比较优先级和伤害强度是两套不同计算。**

---

### 9F. 愤怒值也有精确数值

普通话题牌命中时，败方同时增加：

```ts
stressDamage = {
  small:  10,
  medium: 15,
  large:  20
}
```

原数据地址注释：`8b338c`。

平局：

```ts
both.stress += 15
```

大喝：

```ts
stressDamage = 15
```

所以心理伤害和怒气增加虽然都与牌大小相关，但不是同一个数值字段。

---

### 9G. 大喝伤害也可直接由同一函数解释

大喝使用：

```ts
topicCoef = 12
levelCoef = 15
angerCoef = 10
```

所以：

```ts
shoutDamage =
  trunc(
    (attack + randInt(0,4))
    * 10 * 15 * 12
    / 1000
  )
```

同智力时约：

```text
180～187
```

因此攻略里“大喝攻击力固定”的准确含义更接近：

> 它不使用普通牌的小/中/大等级，而使用固定 `levelCoef=15, topicCoef=12`；

但最终心理伤害仍会受双方智力生成的 attack 和 0～4 随机扰动影响，并不是所有武将永远扣完全相同的 HP。

---

### 9H. 愤激状态对普通伤害的精确修正

原运行时 `angerTimer`：

```ts
Timid / Reckless : 1
Calm / Bold      : 4
```

玩家观察到的“约3回合”与内部 timer 在触发回合末也会递减有关。

对 `CalcHpDamage()`：

#### 小心 / 刚胆

愤激时：

```ts
topicCoef = 10
angerCoef = 10
```

即普通话题牌不再吃“非当前话题 ×0.6”的伤害惩罚。

刚胆的牌力在愤激时还被强制设为：

```ts
power = 100
```

因此几乎所有普通/诡辩话题都压过，只低于无视120、大喝110。

小心则进入连续出话题牌流程；每张仍调用同一个 `CalcHpDamage()`。

#### 冷静

愤激时：

```ts
angerCoef = 15
topicCoef = 6
```

即心理伤害基础乘数相对普通非当前牌提高 50%。同时每回合恢复再考，且有 40% 机会把当前话题“大”牌塞入手牌。

#### 猪突

不是普通牌倍率，而是在进入愤激时直接：

```ts
hpDamage = 200 + martial
stressDamage = trunc(hpDamage / 15)
```

这一条可以把旧文档的“伤害受武力影响”升级成精确式。

---

### 9I. 手牌数量旧结论无需推翻，但要说明内部口径

原代码：

```ts
maxCardCount =
  I < 70 ? 4 :
  I < 80 ? 5 :
  I < 90 ? 6 : 7
```

其中 `card[0]` 固定留给“再考”。

所以真正可出的普通/话术手牌仍是：

```text
智力 <70：3张
70～79：4张
80～89：5张
>=90：6张
```

这正好解释了为什么攻略写 3～6，而内部数组却是 4～7。

---

### 9J. 原 fallback 删除

旧：

```ts
intRatio =
  clamp((attackerINT + 50)/(defenderINT + 50), 0.70, 1.40)

ordinaryBase =
  10 + 2 * max(cardAdvantage, 0)

psychDamage =
  round(ordinaryBase * intRatio)
```

全部删除。

引擎改为：

```ts
debateAttack =
  calcOriginalDebateAttack(myINT, opponentINT)

winner =
  compareOriginalCardPower(currentTopic, myCard, opponentCard)

if (winner) {
  hpDamage =
    calcOriginalDebateHpDamage(
      debateAttack,
      myCard,
      currentTopic,
      angerState,
      rng
    )
}
```

---

### 9K. 版本边界

当前这套 C++ 移植与项目数据导出明确面向 `San11pk`，因此：

```ts
pcPkDebateCore.status = "reverse-engineered"
vanillaDebateCore.status =
  "compatibility-assumption"
```

同期 2006 Vanilla 攻略已经确认：

- 话题匹配优先；
- 小/中/大；
- 无视 > 大喝 > 诡辩 > 话题牌；
- 心理槽 / 愤怒槽；
- 四种性格愤激。

所以 Vanilla 机制层高度一致；但在没有 Vanilla EXE 回归前，不把 `131`、`40`、`8b3380` 等 PK 连续常量跨版本标成源码 confirmed。

---

### 9L. E15 额外边界：power / hp / stress / effect 必须分层

实现层必须至少拆成：

```ts
cardPower
hpDamage
stressDamage
specialEffect
```

不能复用一个 `damage` 字段。

典型反例：

```text
无视：
power=120
hpDamage=0
stressDamage=30

激昂：
power=0
hpDamage=0
stressDamage=40
```

诡辩也不是固定伤害牌，而是条件式反弹普通话题伤害模板。

---

### 剩余 exactness

第 9 项“普通牌心理伤害公式”本身已经解决。

后续舌战仍可单独继续审计：

1. 特定武将的 `DebatePersonBehaviours` 是否对应原版隐藏硬编码；
2. 不同平台的手牌数量差异；
3. Vanilla 二进制连续常量；
4. 舌战胜利后的追击/留情、负伤等结算边界。


## 10. 非骑战法来源的负伤 / 战死概率（E16 已闭合主分流）

### 结论：删除“部队击破统一伤亡率”，改为 source-specific resolver

旧 fallback：

```ts
deathChance =
  none ? 0 :
  normal ? 0.02 :
  0.04

injuryChance = 0.12
```

整体删除。

PC-PK1.1 当前明确来源：

| 来源 | 处理 |
|---|---|
| 普通攻击/一般战法/设施攻击壊灭 | 无额外通用 casualty roll |
| 弩/井阑/舰船火矢、贯射、乱射 | `005974C0` 狙伤 |
| 猛者+成功位移 | 50%负伤 |
| 业火种/业火球 | `00597350` 战死+负伤 |
| 骑兵突击/突进 | 专用战死 |
| 单挑 | 专用结算 |

### 10A. 共用候选

`005971F0 DesignateInjuredPersonnel` 先从部队中指定合法候选，并处理护卫/强运。

所以所有概率表都是“候选已选中后的 conditional chance”；多将部队单人的 unconditional chance 仍缺 selector。

### 10B. 弩系狙伤

```ts
P =
  tacticBase
  + statComparisonTier
  + personality
  + criticalBonus
  - 1
```

```text
tacticBase:
三种火矢0 / 贯射1 / 乱射2

statTier:
-2 / -1 / 0 / +1

personality:
小心0 / 冷静1 / 刚胆2 / 莽撞3

critical:
普通0 / 会心1
```

原码 `0059753A = 0F 95 C1` 是 `SETNE CL`，所以会心+1是有效原逻辑；旧中文汇编注释的“setnc”只是 mnemonic 写错。

SIRE 原帖确认 statTier 四个输出。现代复核给出的阈值：

```text
diff<=0 -> -2
1..6    -> -1
7..12   -> 0
>12     -> +1
```

阈值暂标 secondary-corroborated。

理论峰值6%。

成功调用 `005963E0`，只负伤、不战死。

### 10C. 火矢特殊边界

“火矢不进入业火炸伤函数”仍成立：

```text
no call 00597350
```

但弩/井阑/舰船火矢会进入：

```text
005974C0 狙伤
```

所以不能再写成“火矢只扣兵，不伤将”。

### 10D. 业火 casualty

能力保护：

```ts
protection =
  max(LDR,WAR,INT) <=70 ? 0 :
  <=80 ? 1 :
  <=90 ? 2 : 3
```

战死：

```ts
death =
  max(0, base + personality - protection)

base = normal?2 : high?4
```

无战死跳过死亡。

负伤：

```ts
injury =
  max(0, 2 + personality - protection)
```

负伤不受战死设置关闭影响，并重新选择候选。

### 10E. 猛者

```text
0059781A 猛者
00597725 50%
```

成功推动目标的战法后，50%造成敌将负伤。

### 10F. 不存在普通击破统一伤亡 roll

原版目前明确识别出的 casualty 均有专用入口。后续 MOD 又把“全兵种战法负伤/讨杀”作为新增系统，也支持不要把这种能力反投射给原作。

fidelity：

```ts
resolveOrdinaryDestruction() {
  resolveCaptureOrEscape()
}
```

### 剩余 exactness

- `005971F0` selector；
- `005963E0` severity；
- `00596480` 阈值原指令；
- 猛者 target/severity；
- 跨版本/平台。

详见 `31-non-cavalry-casualty-sources.md`。

## 11. 毒泉 / 栈道 / 落石伤害（E17 已闭合主问题）

E17 专项证据：`32-terrain-hazard-damage.md`；结构化数据：`../sources/terrain-hazard-damage.json`。

### 结论：PK1.1 的核心伤害参数已恢复；旧 fallback 全部撤回

`[PC-PK1.1][reverse-engineered-parameters / reconstructed]`

2008 年针对**繁中 PK1.1** 的内存地址研究明确给出了：

- 栈道每走一格的固定基本伤害与随机变动范围；
- 毒泉每走一格的固定基本伤害与随机变动范围；
- 落石对部队 / 建筑各自独立的固定基本威力与随机变动范围；
- 踏破对落石的减伤分支；
- 踏破、难所行军、解毒对应的判定地址。

SIRE 后续地址表又确认原版通用随机函数：

```text
00472150 GetRandomX(X) = 0 .. X-1
```

因此旧的：

```text
毒泉固定1000兵 + 气力-5
栈道随机300~500
落石随机1000~2000 + 30%混乱
踏破落石仅减半
```

全部删除。

主要逆向来源：
- https://game.ali213.net/thread-2168294-1-1.html
- https://github.com/sean2077/311SireCustomizedPackageDev/blob/dev/material/内存地址汇总.md

---

### 11A. 栈道：每进入一格 100～299 兵

`[PC-PK1.1][reverse-engineered]`

地址：

```text
005AE58D  栈道(terrain 11)行军损伤
005AE597  踏破判定
005AE5A4  难所行军判定
005AE5C6  每走一格固定基本伤害 100
005AE5AF  每走一格附加变动范围 200
```

按原随机函数：

```ts
function plankPathEntryDamage(unit) {
  if (
    unit.hasSkill(TRAVERSE) ||
    unit.force.hasTechnology(DIFFICULT_MARCH)
  ) {
    return 0
  }

  return 100 + GetRandomX(200)
  // 100..299
}
```

关键点：

- 是**每走 / 每进入一格栈道**结算，不是每旬站在栈道上固定扣血；
- 随机部分是 `0..199`，所以总范围 **100..299**；
- PK 下“踏破”与势力技巧“难所行军”都应免除栈道通行损伤。

后期技术攻略也明确写“难所行军：通过栈道时不受伤害”。

来源：
- https://game.ali213.net/thread-2168294-1-1.html
- https://www.gamersky.com/handbook/200809/114545_2.shtml

---

### 11B. 毒泉：每进入一格 200～399 兵

`[PC-PK1.1][reverse-engineered]`

地址：

```text
005AE588  毒泉(terrain 4)行军损伤
005AE5D9  解毒判定
005AE5F8  每走一格固定基本伤害 200
005AE5E2  每走一格附加变动范围 200
```

因此：

```ts
function poisonSpringEntryDamage(unit) {
  if (unit.hasSkill(ANTIDOTE)) {
    return 0
  }

  return 200 + GetRandomX(200)
  // 200..399
}
```

同样是**按经过的格数**结算。

### 删除“气力 -5”

旧 fallback：

```ts
troops -= 1000
energy -= 5
```

没有可靠来源。

PK1.1 的地址研究把毒泉的行军伤害参数完整列为：

- 固定兵损 200；
- 随机范围 200；
- 解毒判定；

但没有出现毒泉独立的气力下降常量。与此同时同一份地址表对“扫荡 -5”“威风 -20”等气力变化都能明确列出对应地址。

因此 fidelity 模式不再凭空增加：

```ts
poisonSpring.energyDamage = 5
```

当前设为：

```ts
poisonSpring.energyDamage = 0
```

证据标签为 `negative-evidence-high`，不是“已找到一条显式写0的源码”。

来源：
- https://game.ali213.net/thread-2168294-1-1.html
- https://w.atwiki.jp/sangokushi11/pages/13.html

---

### 11C. 落石：部队与建筑使用两套参数

`[PC-PK1.1][reverse-engineered-parameters / reconstructed]`

逆向地址：

```text
005B16D2  落石对部队固定基本威力 1500
005B16D7  落石对部队伤害附加变动范围 500

005B171D  落石对建筑固定基本威力 800
005B1722  落石对建筑伤害附加变动范围 1000

005B1844  落石对部队伤害资料地址指标
005B1864  落石对建筑伤害资料地址指标
```

第一版 fidelity 实现：

```ts
function rockfallTroopDamage(unit) {
  let damage =
    1500 + GetRandomX(500)
    // 1500..1999

  if (unit.hasSkill(TRAVERSE)) {
    damage = trunc(damage / 10)
  }

  return damage
}

function rockfallBuildingDamage(building) {
  return 800 + GetRandomX(1000)
  // 800..1799 durability
}
```

“1500 + 0..499 / 800 + 0..999”是目前最合理的直接还原。该内存研究还记录了“全陷阱共通基本伤害50”参数，因此在完整 `GetTrapDamage` 函数体被文本化以前，仍保留一个很小的 exactness：

> 共通50是否在落石最终式中作为独立项再次参与，以及它在最终整数顺序中的位置。

不过玩家实测出现过 **1725** 的落石兵损，正落在 1500..1999 区间内，因此当前直接采用上述落石专用参数对游戏表现是高置信吻合。

来源：
- https://game.ali213.net/thread-2168294-1-1.html
- https://www.sohu.com/a/394347085_100186910

---

### 11D. 踏破对落石：只承受 10%

`[PC-PK1.1][reverse-engineered]`

内存地址研究直接记录：

```text
005B17C0  踏破
对落石、火陷阱伤害降至10%
```

对于本项的**落石**，因此：

```ts
if (hasTraverse) {
  rockfallDamage =
    trunc(rawRockfallDamage / 10)
}
```

也就是约：

```text
150～199兵
```

而不是旧 fallback 的：

```ts
damage *= 0.5
```

社区实测也明确观察到踏破约免疫 90% 的落石伤害。

注意：不要仅凭这一个旧地址注释，把“所有火系伤害”也统一写成 ×0.1。火陷阱与持续火伤另有多条技能/科技分支，第5/10项已经分别建模；这里仅锁定落石。

---

### 11E. 落石不再附加“30%混乱”

旧 fallback：

```ts
confusionChance = 0.30
```

没有找到原作依据。

检查结果：

- PK1.1 落石地址区明确列出了部队 / 建筑伤害参数；
- 没有同时列出落石混乱概率参数；
- 早期攻略对落石的说明集中在“击破山岩后沿方向滚落造成大伤害”，没有把混乱列为固定效果；
- 能造成混乱的石兵八阵、螺旋突、业火种、火船等，逆向资料都会出现独立状态判定。

因此 fidelity 默认：

```ts
rockfall.confusionChance = 0
```

证据标签：

`[negative-evidence-high]`

如果未来完整落石函数体显示另有状态分支，再替换这一值。

---

### 11F. 触发方式不要混淆

#### 栈道 / 毒泉

是**移动路径逐格伤害**：

```text
每进入一格
→ 判断免伤技能 / 技巧
→ 生成该格伤害
→ 扣兵
```

被枪/骑位移战法强制推进到这些地形时，只要原程序把它计作进入该格，也应走同一 terrain-entry damage service；老玩家已经观察到被推入毒泉会受毒泉伤害。

#### 落石

地图落石本身是特殊陷阱对象：

- 耐久极低；
- 被可触发的近战攻击破坏后沿预设方向滚落；
- 对路径上的敌我目标都可造成伤害；
- 使用后经过一段时间可恢复。

不要把它实现成“站在山地每旬随机落石”。

---

### 11G. Vanilla / PK 边界

这次的内存地址明确注明：

`繁中 PK1.1`

所以：

```ts
pcPk11TerrainHazard.status =
  "reverse-engineered"

vanillaTerrainHazard.status =
  "compatibility-assumption"
```

2006 年 Vanilla 资料已经确认：

- 栈道会造成通行损伤；
- 踏破减轻/免除栈道损伤并减轻落石；
- 解毒防御毒泉伤害；
- 难所行军降低/处理栈道损伤。

但早期无印攻略有时只写“难所行军使栈道损伤降低”，后期 PK 攻略则明确写“不受伤害”。因此在未取得 Vanilla EXE 前：

- 可以让 Vanilla 暂复用 PK 数值以保持引擎闭环；
- 必须标 `compatibilityAssumption=true`；
- 不把 PK1.1 的 100/200/1500/800 常量标成 Vanilla 源码事实。

---

### 第11项剩余 exactness

现在只剩很小的几个问题：

1. 完整落石伤害函数中，“全陷阱共通基本伤害50”与落石专用1500/800的最终组合顺序；
2. 落石对多个路径目标逐格结算的精确顺序；
3. Vanilla / 各主机版的常量是否与繁中 PK1.1 完全一致。

原来的四个 fallback：

- 毒泉1000；
- 毒泉气力-5；
- 栈道300～500；
- 落石1000～2000 + 30%混乱 + 踏破减半；

全部废弃。

---


## 12. 普通君主继承（E18 已闭合主机制）

E18 专项证据：`33-ruler-succession-priority.md`；结构化数据：`../sources/ruler-succession-priority.json`。

### 结论：玩家选择已确认；COM 自动继承可收敛为“关系层级 + 年长者”

这一项不再需要旧的“血缘 +10000、官职×10、功绩、魅力/统率”综合评分 fallback。

目前可靠资料把普通继承拆成两条：

1. **玩家势力**：非历史事件死亡时，由玩家从合法候选中选择后继者。
2. **COM 势力**：长期玩家批量观察高度一致地指向：`血缘 > 义兄弟 > 配偶 > 年长者`。

历史事件仍然优先覆盖普通逻辑。

### 12A. 玩家势力：普通死亡后由玩家选后继

`[COMMON][empirical-high]`

PC 与 PS2 老玩家均明确报告：

- 君主普通死亡后会进入后继者选择；
- 玩家可以自己选；
- 不要求一定是儿子、亲族、功绩最高或魅力最高；
- 新武将也可以成为后继者，只要属于合法候选。

旧 2ch 还明确记录：刘备之死历史事件条件不满足时，刘备普通死亡后可以自行选择后继者。

因此：

```ts
if (historicalSuccessionEventMatched) {
  resolveHistoricalSuccession(eventData)
} else if (force.isPlayerControlled) {
  successor = playerChoose(
    enumerateLegalSuccessors(force)
  )
}
```

来源：
- https://gamefaqs.gamespot.com/boards/931351-romance-of-the-three-kingdoms-xi/45353339
- https://w.atwiki.jp/sangokushi11/pages/1952.html
- https://w.atwiki.jp/sangokushi11/pages/31.html

### 12B. 历史事件使用固定顺序

`[confirmed as event data]`

例如：

- 曹操：`曹昂 > 曹丕 > 曹植 > 曹冲 > 曹彰`
- 刘备：`刘禅 > 刘封`

这些只在对应历史事件条件满足时生效。刘备案例构成一个很强的边界：满足历史事件时自动刘禅>刘封；不满足条件而普通死亡时则由玩家选择。

来源：
- https://www.gamersky.com/handbook/200809/124174_9.shtml
- https://w.atwiki.jp/sangokushi11/pages/942.html
- https://w.atwiki.jp/sangokushi11/pages/100.html

### 12C. COM：关系层级优先

`[COMMON][empirical-high]`

2008年前后旧2ch的连续测试直接总结：

```text
COM：
血缘 > 义兄弟 > 配偶 > 年长者
```

另一轮测试进一步指出：没有一族以后，确实按年龄顺。多个反直觉案例都与此一致：

- 董卓/牛辅系后，刚加入不久的韩遂也可能因年长继位；
- 吕布没有可用血缘后会出现王忠这类年长武将继位；
- 刘琦亲族候选被杀/俘后，出现黄忠继位；
- 韩馥之后甚至有潘凤继承的记录。

这些案例与“功绩最大 / 魅力最高 / 都督优先”模型不符。

来源：
- https://w.atwiki.jp/sangokushi11/pages/1952.html
- https://w.atwiki.jp/sangokushi11/pages/1941.html
- https://w.atwiki.jp/sangokushi11/pages/2452.html
- https://w.atwiki.jp/sangokushi11/pages/2356.html
- https://w.atwiki.jp/sangokushi11/pages/1878.html

### 12D. COM fallback：改成分层选择

```ts
function chooseAiSuccessor(oldLord, force) {
  const candidates = enumerateLegalSuccessors(force)

  const blood = candidates.filter(p => isBloodRelative(oldLord, p))
  if (blood.length) return chooseWithinBloodFallback(blood)

  const sworn = candidates.filter(p => isSwornSibling(oldLord, p))
  if (sworn.length) return chooseWithinSwornFallback(sworn)

  const spouse = candidates.filter(p => isSpouse(oldLord, p))
  if (spouse.length) return chooseWithinSpouseFallback(spouse)

  // 只有无特殊关系的普通候选，“年长者优先”是 empirical-high
  return eldestStable(candidates)
}

function eldestStable(candidates) {
  // 同龄 personId 仅为 deterministic engine fallback
  return candidates.sort(birthYearAsc, personIdAsc)[0]
}
```

证据边界：

- 关系类别顺序：`empirical-high`；
- “同一关系类别内也按年龄”：目前与所有已见案例相容，但未取得原函数体，标 `compatibility-assumption`；
- `personId` 只作同龄 deterministic tie-break，不声称原作就是 ID 小者优先。

### 12E. 功绩、能力、官职退出主排序

旧 fallback 的以下项删除：

```text
血缘 +10000
同族 +5000
官职指挥 ×10
功绩
魅力 ×20
统率 ×10
```

老玩家已经专门指出“没有血缘时是年长者，而不是功绩”；也存在新近加入却因年长而继位的案例。因此 `merit / charisma / command / office` 不再参与当前 fidelity fallback 的 COM successor ranking。

### 12F. 合法候选：被俘排除；出阵/任务状态仍需收紧

`[partial-known]`

可以可靠确认至少排除：

- 已死亡；
- 非本势力；
- 被敌方俘虏。

玩家战报明确指出：君主亲族即使仍活着，只要被敌方俘虏，也会从后继候选中排除。

另有较新的 PC 玩家记录：想让毌丘俭继位，但他当时在军中，结果没有出现在后继者选择列表。这说明出阵部队成员或某类任务状态可能被过滤，但目前只有个案证据。

第一版：

```ts
function enumerateLegalSuccessors(force) {
  return force.officers.filter(p =>
    p.alive &&
    p.forceId === force.id &&
    !p.isCaptive &&
    !p.isSpecialEventPerson
  )
}
```

`excludeFieldTroopMember` / `excludeMissionPerson` 作为 profile 参数保留；PC-PK profile 暂先排除当前出阵部队成员，等待最小存档回归。

来源：
- https://w.atwiki.jp/sangokushi11/pages/2356.html
- https://medaka.5ch.net/test/read.cgi/gamehis/1640245995/265-n

### 12G. 继位后的忠诚：不要制造“立即随机叛变”

玩家记录显示：选择相性差的新君主以后，部下忠诚会严重恶化，之后可能下野/被挖；但君主死亡当场并不是一个独立的“随机叛变事件”。

因此结构应为：

```text
确定新君主
→ 更新 force.lord
→ 后续忠诚系统改以新君主为基准
→ 正常忠诚下降 / 下野 / 登用流程继续
```

来源：
- https://w.atwiki.jp/sangokushi11/pages/1950.html
- https://w.atwiki.jp/sangokushi11/pages/2463.html
- https://w.atwiki.jp/sangokushi11/pages/1993.html

### 12H. 原程序入口线索

`[PC-PK1.1][reverse-engineered-partial]`

311MemoryResearch 的“禅让 DEMO”为复用原版君主死亡流程，直接调用 `004B9080`，并注明当前会使用“君主死亡”的 MSG。调用参数中包含势力指针，说明原版存在集中式君主死亡/后继处理入口。

当前 SIRE 公共地址表没有给 `004B9080` 正式命名，也没有公开文本函数体，因此不能把上面的 COM 四层排序宣称为源码级确认。

来源：
- https://github.com/sjn4048/311MemoryResearch/blob/master/内存资料/新功能[禅让](DEMO).txt

### 12I. 零合法候选

如果没有合法后继者，当前引擎保留统一的 leaderless-force 处理接口，不凭空创造继承者：

```ts
if (legalSuccessors.length === 0) {
  eliminateOrResolveLeaderlessForce(force)
}
```

San11 专属公开资料对零配下时的精确结束流程仍不够完整，所以此处保持 open。

### 第12项剩余 exactness

现在只剩：

1. 血缘组内部的精确优先级；
2. 同龄 tie-break；
3. 出阵 / 任务中武将的完整候选过滤；
4. `004B9080` 函数体；
5. 零合法候选的精确势力结束流程。

原综合评分 fallback 已废弃。

## 13. 评定完整提案池（E19 静态池已闭合）

E19 专项证据：`34-council-proposal-pool.md`；结构化数据：`../sources/council-proposal-pool.json`。

### 结论：具体提案词汇已经能从原版 MSG 完整恢复；真正仍未知的是“谁在什么局势下提哪一个”的选择函数

这一项需要把三个问题分开：

1. 评定流程结构；
2. 原版允许出现哪些具体提案；
3. 武将如何从这些提案中选择。

前两项现在已经大幅收敛；第3项仍没有找到公开文本反汇编。

---

### 13A. 评定是“两阶段 + 可多选”的正式命令系统

`[COMMON][confirmed-static / manual]`

官方 PK 手册确认：

- 君主在据点时可执行评定；
- 最多6名武将参加；
- 评定命令本身：期间、金钱、行动力均为“无”；
- 评定结束后，配下武将会根据评定结果采取行动。

原版武将台词进一步确认两个阶段：

```text
第一阶段：战略方针提案
→ 君主采决
→ 第二阶段：具体案提案
→ 君主采决
→ 被采纳方案执行
```

而且两层都不是简单“只能选一个”：MSG 中明确存在：

- 单独采纳某人；
- 部分采纳；
- 全部采纳；
- 全部否决；
- 中止评定。

角色台词页也有“全选”与“全部否决”的专门台词。

来源：
- 官方 PK 手册：https://cdn.akamai.steamstatic.com/steam/apps/628070/manuals/32sangokushi11wpk_manual.pdf
- https://w.atwiki.jp/sangokushi11/pages/202.html
- https://w.atwiki.jp/sangokushi11/pages/639.html
- https://www.sanguogame.com.cn/special/san11/1920.html

---

### 13B. 第一阶段方针：UI 是三大类，但 MSG 内部有“攻击 / 迎击”两个出阵子类

`[COMMON][confirmed-static-message-data]`

角色页把评定方针统一标成：

```text
内政
出阵
外交・计略
```

但完整 MSG 目录又把第一阶段台词拆成：

```text
2975～2980  建议攻击
2981～2986  建议迎击
2987～2992  建议内政
2993～2998  建议外交
2999～3002  赞同他人
```

因此引擎最好保留：

```ts
type CouncilPolicyKind =
  | "domestic"
  | "sortie-attack"
  | "sortie-defense"
  | "diplomacy-strategy"

function policyDisplayGroup(kind) {
  if (kind === "sortie-attack" || kind === "sortie-defense")
    return "sortie"
  return kind
}
```

这样既保留内部“攻击/迎击”的区别，又符合玩家看到的“出阵”大类。

---

### 13C. 具体提案池：22 类

`[COMMON][confirmed-static-message-data]`

完整 `msg2966～3288 君主评定` 目录恢复出以下 **22 类具体提案**：

#### 内政 / 人事 / 城市管理类

1. 内政建设
2. 征兵
3. 生产兵装
4. 巡查
5. 训练
6. 探索
7. 登用
8. 任命军师
9. 撤除设施

#### 出阵 / 军事类

10. 侵略
11. 迎击
12. 军事建设

#### 外交・计略类

13. 献上（亲善/赠礼）
14. 同盟
15. 摒弃（同盟破弃）
16. 停战
17. 劝降
18. 交换俘虏
19. 求援
20. 二虎竞食
21. 驱虎吞狼
22. 流言

对应 MSG 范围：

```text
3043       推荐内政建设
3034~3054  提议征兵
3055~3065  提议生产兵装
3066~3076  提议巡查
3077~3087  提议训练
3088~3098  提议侵略
3099~3104  提议迎击
3105~3110  提议军事建设
3111~3117  提议探索
3118~3124  提议登用
3125~3131  提议献上
3132~3138  提议同盟
3139~3145  提议摒弃
3146~3152  提议停战
3153~3159  提议劝降
3160~3172  提议交换俘虏
3173~3179  提议求援
3180~3186  提议二虎竞食
3187~3193  提议驱虎吞狼
3194~3200  提议流言
3201~3206  提议任命军师
3207~3209  提议撤除设施
3210~3213  赞同提议
```

目录在“内政建设/征兵”附近存在一个编号排版重叠/错位，但提案类型本身没有歧义。

“献上”与普通外交 MSG 中的“推荐亲善 / 前往亲善”对应，工程层映射为 `amicabilityGift`；“摒弃”与普通外交中的同盟破弃流程对应。

来源：
- https://www.sanguogame.com.cn/special/san11/1920.html

---

### 13D. 三个旧 fallback 提案应该删除

旧文档曾把以下也加入评定池：

```text
技巧研究
输送
褒赏
```

但完整君主评定 MSG 段没有这三类专用提案文本。

相反，旧文档漏掉了：

```text
任命军师
撤除设施
同盟破弃
迎击
军事建设
```

因此 fidelity proposal pool 现在固定使用上述22类。

如果未来反汇编证明某个无专用 MSG 的命令复用了通用提案台词，再单独恢复；在此之前不要从整个 Command 集合任意扩展评定池。

---

### 13E. “赞同他人”是原生结果，不是每人都必须产生新方案

`[COMMON][confirmed-static-message-data]`

两个阶段都存在专门的“赞同某人/赞同提议”台词。

张飞等武将的角色页也直接列出：

```text
评定方针・具体案提案（同意）
```

所以每位参加武将并不一定制造一个新 proposal。

引擎要支持：

```ts
type CouncilSpeech =
  | { kind: "new-proposal", proposal: CouncilProposal }
  | { kind: "agree", proposerId: PersonId }
  | { kind: "abort" }
```

如果后续武将生成了与已有方案完全相同的 `type + target`，fallback 优先转成 `agree`，而不是重复显示两条等价方案。

---

### 13F. 评定本身免费，但被采纳提案不是“免费行动”

`[COMMON][manual + empirical-high]`

官方手册把“评定”菜单本身标成：

```text
必要金：—
行动力：—
最大执行武将：6
```

并明确说：

```text
评定后，配下武将按评定结果行动。
```

同时 2006 年原版时期玩家明确吐槽：

> 如果采纳评定进言时不消耗行动力，那还说得过去。

这构成很强的反证：**采纳后的实际行为会消耗行动力**。

2026 年 PC-PK 实测也发现：只要还有行动力和未行动武将，开评定就会进入选人提案；把行动力先用光后，配下会直接建议不要开会、赶紧行动。

因此 engine 应分开：

```ts
openCouncil():
  actionPowerCost = 0
  moneyCost = 0

executeAcceptedProposal(p):
  dispatchToNormalCommand(p)
```

`dispatchToNormalCommand()` 至少必须沿用普通命令的行动力与合法性校验。金钱、兵粮、技巧P、设施条件等也建议走同一个 Command service；这一点在未取得评定函数调用图前标 `compatibility-assumption`，但禁止实现成“评定采纳后免费生成兵/设施/外交效果”。

来源：
- 官方 PK 手册
- https://w.atwiki.jp/sangokushi11/pages/1875.html
- https://www.ptt.cc/bbs/Koei/M.1776854540.A.47B.html

---

### 13G. 技巧P：开评定本身 +10

`[COMMON][empirical-high]`

早期中文技巧P整理记录：

```text
评定：+10P
```

因此：

```ts
onCouncilHeld() {
  force.techniquePoints += 10
}
```

被采纳的具体方案如果本身又会产生技巧P，则继续走对应普通 Command 的收益，不与“评定+10”互相替代。

来源：
- https://www.sanguogame.com.cn/special/san11/san11-xd14.html

---

### 13H. 提案选择公式：仍未找到原函数

`[PC-PK][open-exactness]`

当前 `311MemoryResearch` / SIRE 公共文本资料没有整理出评定 proposal selector 的函数体。

SIRE 确认武将结构里确实存在隐藏字段：

```text
+0x10C StrategicTendency  战略倾向
+0x110 EarthElementTenacity 地域执着
```

但目前**没有找到它们被评定函数读取的 xref**。

因此旧 fallback 直接写：

```text
起用 + 战略倾向 + 五维
→ 决定评定提案
```

没有证据，应删除。

同样，2006 年玩家曾猜测“也许性格或知力参与”，但这只是玩家猜测，不能标成事实。

来源：
- https://github.com/sean2077/311SireCustomizedPackageDev/blob/dev/material/结构体汇总.md
- https://github.com/sean2077/311SireCustomizedPackageDev/blob/dev/material/数据汇总.md
- https://w.atwiki.jp/sangokushi11/pages/2460.html

---

### 13I. 玩家观察说明“能力映射”不能做得太机械

`[COMMON][empirical-anecdotal]`

2007 年旧 2ch 有一个很有价值的观察：

- 李儒参加评定时几乎总提侵攻他国；
- 张飞却会冷静提出“多生产一些兵装做准备”。

回复者还评价评定建议经常“很随意、经常不合时宜”。

这至少排除了简单规则：

```text
高武力武将 = 必定出阵
高智力武将 = 必定外交计略
高政治武将 = 必定内政
```

另外 2008 年玩家用韩玄、孙皓、夏侯楙、曹爽、黄皓、张昭参加评定时，记录到多数低质量武将只是说“军师的提案最好”，只有张昭提出独立意见。这能支持“agree 是常见真实结果”，但不足以逆出能力阈值。

来源：
- https://w.atwiki.jp/sangokushi11/pages/1919.html
- https://w.atwiki.jp/sangokushi11/pages/1950.html

---

### 13J. provisional-engine-rule：固定E19的22类原版消息池，未知的只剩 chooser

不再从整个 Command 集合动态发明 proposal type。

```ts
const ORIGINAL_COUNCIL_PROPOSALS = [
  "domestic-build",
  "recruit",
  "produce-equipment",
  "patrol",
  "train",
  "invade",
  "intercept",
  "military-build",
  "search",
  "hire",
  "amicability-gift",
  "alliance",
  "break-alliance",
  "ceasefire",
  "demand-surrender",
  "exchange-prisoner",
  "request-reinforcement",
  "two-tigers",
  "drive-tiger",
  "rumor",
  "appoint-strategist",
  "remove-facility"
]
```

生成步骤：

```ts
function generateCouncilProposal(officer, state, existing) {
  // 1. 只保留当前能映射到合法普通 Command 的原版22类模板
  const legal = ORIGINAL_COUNCIL_PROPOSALS
    .map(t => materializeTargets(t, state))
    .flat()
    .filter(p => normalCommandCanExecute(p, officer, state))

  if (!legal.length)
    return { kind: "abort" }

  // 2. 局势需求是主项；不要伪装成已知原版AI
  for (const p of legal) {
    p.score =
        situationUrgency(p, state)       // 0..100
      + stableOfficerBias(officer.id,p) // -15..15
      + rng.int(-10, 10)
  }

  const proposal = maxBy(legal, p => p.score)

  // 3. 原版有专门“赞同他人”分支
  const same = existing.find(x =>
    x.type === proposal.type &&
    x.targetId === proposal.targetId
  )

  if (same)
    return { kind: "agree", proposerId: same.proposerId }

  return { kind: "new-proposal", proposal }
}
```

这里故意不用：

- `StrategicTendency` 直接决定三大类；
- 性格直接决定三大类；
- 五维做硬门槛。

因为都还没有 xref 证据。

`stableOfficerBias` 只是让同一个人在相近局势下有一定持续偏好，模拟“李儒经常提侵攻”这种观察；必须标 `provisional-engine-rule`。

一旦以后逆出原 selector，只替换 chooser，22类 proposal schema、两阶段 UI 和 normal Command dispatcher 都不需要改。

---

### 13K. 合法性 / 触发条件：使用普通 Command 规则，不另造第二套效果

在没有原 proposal-trigger table 的情况下，每个具体案至少满足对应 Command 的必要条件：

- 征兵：存在可征兵据点/兵舍、容量与资金等；
- 生产：对应生产设施与容量/资金；
- 巡查：可执行巡查；
- 训练：气力尚可提升；
- 侵略：存在合法敌对/空白目标；
- 迎击：存在需要防御的敌军威胁；
- 军事建设：有合法建设格与资源；
- 探索：搜索命令合法；
- 登用：存在合法目标；
- 同盟：不能已同盟；
- 破弃：必须已有同盟；
- 停战：存在可停战对象；
- 交换俘虏：必须存在可交换俘虏；
- 求援：存在符合条件的友好/同盟关系；
- 二虎竞食、驱虎吞狼、流言：对应计略目标合法；
- 任命军师：候选智力至少70（官方手册）；
- 撤除设施：存在己方可撤设施。

但“满足普通 Command 条件后，原版评定是否还有额外隐藏阈值”仍 open。

尤其 2006 年玩家记录过评定竟然建议拆造币厂改建别的设施，说明原版 proposal AI 可以给出**合法但很差**的方案，所以 fallback 不应把 utility 阈值设得过高。

来源：
- 官方 PK 手册
- https://w.atwiki.jp/sangokushi11/pages/1875.html

---

### 第13项剩余 exactness

现在真正还没解决的只剩：

1. proposal selector 的原始函数地址与权重；
2. `StrategicTendency / 性格 / 智力 / 其他隐藏属性` 是否实际进入 selector；
3. 22类 proposal 与四个内部方针子类的精确映射表；
4. 参与武将的完整过滤条件（未行动、所在据点、任务中等的逐条规则）；
5. 多个被采纳 proposal 的执行顺序，以及执行前后资源不足时的精确行为。

但**提案池本身已经不再 open**。

## 14. 委任 AI 权重（E20：统一权重表假设已撤回）

E20 专项证据：`35-delegated-ai-architecture.md`；结构化数据：`../sources/delegated-ai-architecture.json`。

### 结论：原作不是统一 utility 分数表，而是“分阶段硬门槛 + 概率 + 专用选择函数”

这一项找到的最重要逆向资料是 `311MemoryResearch/内存资料/AI专题/`：

- `函数[AI出兵策略].txt`
- `函数[AI势力强度设定].txt`
- `函数[AI行动部队].txt`
- `函数[AI选择主将].txt`

这些文件直接说明：原版 PC-PK AI 并不是把“巡查=100、征兵=95、运输=70”之类统一塞进一个 utility 表后取最大值。至少战争部分是一串明确的：

```text
合法性 / AP / 资源门槛
→ 城市与目标态势判定
→ 君主难度/野望/战略倾向修正
→ 出兵概率
→ 兵力/兵粮/金钱/兵装选择
→ 主将与兵种评分
→ 创建部队
```

因此旧的单表 deterministic utility 方案撤回。

---

### 14A. 玩家委任部队与 COM 部队共享战术行动核心

`[PC-PK1.1][reverse-engineered]`

`函数[AI行动部队].txt` 明确记录：

```text
玩家点击“委任部队行动”
→ 005746A0 循环符合条件的部队
→ 调 005AD980
```

而正常 AI 军团行动：

```text
005EC370
→ 逐一筛当前军团部队
→ 005DEF90 任务方针检查/改写
→ 005DDCF0
→ 005AD980
```

因此至少**野外部队的实际行动决策器是共用的**。不要为“玩家委任部队”另写一套聪明/愚蠢程度不同的移动攻击逻辑。

来源：
- https://github.com/sjn4048/311MemoryResearch/blob/master/内存资料/AI专题/函数[AI行动部队].txt

---

### 14B. AI 出兵概率确实读取难度、君主野望和战略倾向

`[PC-PK1.1][reverse-engineered-partial]`

`005EF440` 出兵策略在真正创建部队前明确读取：

- 游戏难度；
- 君主野望（0~4）；
- 君主 `StrategicTendency`；
- 目标城市相关 AI 评价值；
- 目标/相关城市治安；
- 当前已有部队数量与任务；
- 出兵城市兵力、兵粮、兵装；
- 到目标所需移动时间。

战略倾向四值在汇编注释中已经能对应：

```text
0 全国统一
1 地方统一
2 州统一
3 安于现状
```

其中：

- 地方统一会遍历12州，检查当前战略范围；
- 州统一同样调用州相关判定；
- 全国统一直接进入更积极的基础项；
- 安于现状走另一分支。

出兵概率最后统一：

```ts
sortieProbability = clamp(rawProbability, 5, 100)

if (!chance(sortieProbability))
  abortSortie()
```

也就是说即使前面条件允许，普通 AI 出兵仍存在概率层；最低概率5%，最高100%。

目前 `rawProbability` 中有一个局部变量语义尚未完全命名，所以不把整段强行转写成一个看似精确的闭式；但“难度 + 野望 + 战略倾向 + 城市态势 → 5~100% 出兵概率”本身已是反汇编事实。

来源：
- https://github.com/sjn4048/311MemoryResearch/blob/master/内存资料/AI专题/函数[AI出兵策略].txt
- https://github.com/sean2077/311SireCustomizedPackageDev/blob/dev/material/结构体汇总.md

---

### 14C. 超级难度并非“AI逻辑完全相同”

旧说法“超级只给资源，不改AI逻辑”需要修正。

玩家 FAQ 的准确说法是：**AI整体没有明显变聪明，主要难度来自资源优待。** 但反汇编显示出兵概率计算确实读取全局难度，因此至少战争决策中的某些概率会随难度改变。

所以版本描述应改为：

```text
超级主要优势 = 大量资源/产出/战斗修正
+
AI若干决策函数也读取 difficulty
```

而不是：

```text
difficulty never affects AI decisions
```

公开 FAQ 同时确认超级的资源修正很重：COM 初始兵力/金粮/兵装大幅增加，金粮收入 +25%，征兵和兵装生产效果×2。 

来源：
- https://w.atwiki.jp/sangokushi11/pages/8.html
- https://github.com/sjn4048/311MemoryResearch/blob/master/内存资料/AI专题/函数[AI出兵策略].txt

---

### 14D. 出兵有大量硬资源门槛，不是简单“兵力比达到1.2就打”

`[PC-PK1.1][reverse-engineered]`

已经能确认的硬约束包括：

#### 最低出兵规模

计算出的计划兵力最终有：

```ts
plannedTroops = max(plannedTroops, 5000)
```

如果出兵城在扣除已有任务/守备需求后无法满足计划兵力，则直接不出。

#### 治安门槛

出兵城治安存在 80 / 90 级别的硬门槛分支；低于当前分支要求直接 abort。当前决定究竟取80还是90的那个 flag 语义尚未完全命名，因此引擎不能简单写成永远 `publicOrder >= 90`。

#### 兵粮

AI调用原函数：

```text
005F6470 ConsumptionCalculationUsedByAI
```

规划 horizon 在主出兵路径中是：

```ts
foodHorizon = travelTime * 5 + 15
```

再按计划兵力计算出征粮。

同时：

```ts
carriedFood = min(requiredFood, availableFoodAfterReserve, 50000)
```

如果最终携粮低于计算所需，则取消这支部队。

#### 兵装

城市的枪/戟/弩/马等可用兵装总量也会参与“是否够出这支部队”的硬检查，并不是兵力够就无条件出征。

因此旧 fallback：

```text
防守：兵力比 >=1.5
标准：>=1.2
攻击：>=1.0
```

没有原版依据，删除。

---

### 14E. AI 出征携金也有精确概率规则

`[PC-PK1.1][reverse-engineered]`

普通非兵器部队：

```ts
if (city.gold >= 10000) {
  if (chance(75))
    carriedGold = (15 + randInt(0,5)) * 100
    // 1500..2000
} else if (city.gold >= 2000) {
  if (chance(50))
    carriedGold = 1000
}
```

兵器部队会跳过这一段普通携金处理。

港/关还有一条以部队武将俸禄合计×8作为携金/出兵约束的分支。

这进一步说明 AI 是一组具体规则链，不是统一 utility optimizer。

---

### 14F. 兵器选择存在固定概率倾向

`[PC-PK1.1][reverse-engineered-partial]`

出兵策略中可以直接看到不同兵器的概率：

```text
冲车        90%
井阑/木兽/投石 80%
其他分支      最终 clamp 30~70%，并受主将性格/局部状态影响
```

这里的“概率”处在兵种/编成选择阶段，不是战法命中率。

因此 AI 偏爱/使用兵器也有独立的 procedural roll。

---

### 14G. 主将选择是明确评分函数，不是随机挑最高统率

`[PC-PK1.1][reverse-engineered]`

`005F6CF0` 会针对预定兵装计算候选主将攻击/防御评分：

```text
(兵种适性 + 势力科技修正 + 7)
× 武力 / 统率
× 兵装攻击 / 防御
+ 兵种相克修正
+ 与兵种契合的特技等级加分
```

枪/戟/骑相克在这个评分中直接：

```text
优势 ×1.3
劣势 ×0.7
```

契合特技再给攻击/防御评分加成。

所以委任/COM 出征时的人选也不应简化为：

```ts
maxBy(officers, leadership)
```

来源：
- https://github.com/sjn4048/311MemoryResearch/blob/master/内存资料/AI专题/函数[AI选择主将].txt

---

### 14H. AI“势力强度”甚至含有君主硬编码

`[PC-PK1.1][reverse-engineered]`

`函数[AI势力强度设定].txt` 先按势力据点内总兵力生成一个基础强度，大致是按每1万兵一个档位；随后又针对大量君主 ID 加固定 bonus：

```text
曹操/孙策/曹睿/曹丕/刘备 +2000
孙坚/孙权                 +1900
诸葛亮/周瑜/曹彰/司马懿   +1800
董卓/吕布                 +1700
张角/袁绍                 +1600
马超/公孙瓒               +1500
...
```

还有部分弱势君主会走特殊分支。

这意味着原 AI 的战略评价不仅依赖客观资源，还存在明显的**历史人物硬编码权重**。

所以“用一个现代可解释 utility 完全等价复刻原 AI”从结构上就不成立。

来源：
- https://github.com/sjn4048/311MemoryResearch/blob/master/内存资料/AI专题/函数[AI势力强度设定].txt

---

### 14I. 城市委任内政：目前仍以经验阈值为主

`[COMMON][empirical-high]`

目前尚未找到像 `AI出兵策略` 一样完整整理出来的“城市内政 AI selector”文本函数。

但长期玩家观察很稳定：

- 委任城市强烈追求普通市场×3、普通农场×3；不足时甚至会拆掉其他设施补齐；
- 大市场、鱼市、军屯农不能替代这 3市3田计数；
- 军团会主动褒赏，把武将忠诚常补到96以上；
- 兵装设为轻视时，各基础兵装仍约生产到15000；
- 士兵轻视时仍约征到30000；
- 开启运输时约保留20000兵，把余量往指定/前线方向运输；
- 多城同军团即使没有显式指定运输，也会向更接近前线的同军团城市调资源。

这些继续作为 `empirical-high` 的委任城市 policy，而不是反汇编 exact 权重。

来源：
- https://www.gamersky.com/handbook/200706/66728.shtml
- https://w.atwiki.jp/sangokushi11/pages/74.html
- https://w.atwiki.jp/sangokushi11/pages/1878.html

---

### 14J. 行动力与普通命令不应绕过

`[PC-PK1.1][reverse-engineered]`

311MemoryResearch 已定位：

```text
004A1820  军团行动力增减
005B9340  军团行动（会调用上一个函数消耗行动力）
005CBF95  巡查
005BC4C1  市场等内政建设
005C3CAB  征兵
005C67B3  生产
005D8F68  技巧研究
```

因此委任 AI 必须调用正常行动/资源路径；不能因为是 AI 就绕过 AP、金、兵粮、设施容量等规则。

来源：
- https://github.com/sjn4048/311MemoryResearch/blob/master/内存资料/修改记录by%20sjn4048.txt

---

### 14K. 新 provisional-engine-rule：阶段式 policy，不再是全局分数表

城市内政 selector 尚未逆出前，第一版采用原作行为锚点构成**阶段式** fallback：

```ts
function delegatedCityTurn(city, corps, state) {
  // Phase 1: 紧急合法性
  resolveImmediateDefenseAndPublicOrder(city)

  // Phase 2: 原作委任的强习惯
  ensureOrdinaryMarketCount(city, 3)
  ensureOrdinaryFarmCount(city, 3)

  // Phase 3: 武将管理
  rewardOfficersToward96(city)

  // Phase 4: 军备
  applyConfiguredTroopPriority(city)     // 轻视仍约到30k
  applyConfiguredEquipmentPriority(city) // 轻视仍各约15k

  // Phase 5: 运输
  transferSurplusTowardFront(city, corps) // 运输时约留20k兵

  // Phase 6: 战争
  runPkAiSortiePipeline(city, corps, state)
}
```

每一步都必须：

```ts
while (normalCommandCanExecute(...) && corps.actionPower > 0) {
  executeNormalCommand(...)
}
```

而不是一次生成所有候选再 `maxBy(score)`。

战争部分尽量按已逆出的 `runPkAiSortiePipeline()` 实现；城市内政部分保留配置阈值与证据标签。

---

### 14L. 版本与平台边界

逐指令 AI 证据来自 PC-PK。

PC / PS2 委任军团在玩家可手动调用委任军团行动力方面存在平台差异；日文 Wiki 明确指出 PS2 能做更多操作，而 PC 基本只允许输送等有限行为。

所以：

```ts
pcPk.aiWar = reverseEngineeredPartial
vanilla.aiWar = compatibilityAssumption
console.aiDelegationUi = platformSpecific
```

但城市委任的 3市3田、15000兵装、30000/20000兵等长期行为锚点可以继续用于多平台回归。

---

### 第14项剩余 exactness

目前真正没解决的是：

1. 城市内政 AI 在建设/巡查/征兵/训练/生产/褒赏/搜索/登用之间的完整 scheduler；
2. `005EF440` 出兵 rawProbability 中少数尚未命名局部变量；
3. 运输目标与运输量的完整函数；
4. 军团“重视/普通/轻视”各档的精确内部阈值；
5. Vanilla 与主机版 AI 常量差异。

但以下旧 fallback 已可删除：

```text
巡查100 / 征兵95 / 建设90 / 运输70 ...
防守1.5 / 标准1.2 / 攻击1.0兵力比阈值
“超级完全不影响AI决策”
```

## 15. 太守魅力 → 换季治安下降概率分布

### 结论：PC-PK 已由原函数反汇编完整锁定

`[PC-PK1.1][reverse-engineered]`

311MemoryResearch 已逐指令整理原函数：

`0058D6D0  季初城市治安下降`

它只在 **1、4、7、10 月月初**执行。PK 若势力拥有“政令整备”，会先执行一次 `ProbabilityCheck(50)`；命中时本季直接不掉治安。未命中后才进入太守魅力计算。

原函数可直接整理为：

```ts
function seasonalPublicOrderLoss(city, ruleset) {
  if (
    ruleset === "pk" &&
    city.force.hasAdministrativeReform &&
    probabilityCheck(50)
  ) {
    return 0
  }

  // 原函数在取不到合法太守时 charisma 保持为 0。
  const C = city.governor ? city.governor.charisma : 0

  // 90以上会把 (90-C) 强制至少设为1；
  // 随后是整数除10，因此 81~100 最终都处在同一档。
  const base = Math.floor(Math.max(1, 90 - C) / 10)

  // 00472150 GetRandomX(3) => 0,1,2
  const jitter = getRandomX(3)

  return Math.min(5, base + jitter)
}
```

SIRE 开发地址表同时确认：

- `00472150 = GetRandomX(X)`：返回 0～X-1 的随机整数；
- `004721D0 = ProbabilityCheck(p)`：生成 0～99 随机值，小于 p 时成功。

因此“政令整备 50%”不是攻略近似，而是原程序直接传入常量 **50**。

### 完整概率分布

按 `GetRandomX(3)` 的三值随机口径，未触发政令整备免降时：

| 太守魅力 | 自然治安下降 | 概率 | 期望下降 |
|---:|---|---:|---:|
| 81+ | 0 / 1 / 2 | 各 1/3 | 1 |
| 71–80 | 1 / 2 / 3 | 各 1/3 | 2 |
| 61–70 | 2 / 3 / 4 | 各 1/3 | 3 |
| 51–60 | 3 / 4 / 5 | 各 1/3 | 4 |
| 41–50 | 4：1/3；5：2/3 | — | 14/3 ≈ 4.667 |
| 0–40 | 固定 5 | 100% | 5 |
| 无太守 | 固定 5 | 100% | 5 |

所以之前的问题“**魅力越低，概率是不是越大**”需要更精确地说：

> **总体上是，但不是每降低 1 点都连续变差，而是约每 10 点跨一个台阶。**

例如魅力 80 与 71 完全同分布；从 81 降到 80 才会整体把损失从 `0/1/2` 推到 `1/2/3`。

原 TXT 备注写“魅力89及以上按89计算”，而逐指令代码更准确：90以上把中间量至少设为1；由于随后做整数除10，**81～100 最终都得到同一个 base=0**，所以实际概率档位从81开始就相同。

### PK“政令整备”后的最终分布

因为它在自然下降公式前独立做一次 **50% 直接返回**：

| 太守魅力 | 最终分布（拥有政令整备） |
|---:|---|
| 81+ | 0：2/3；1：1/6；2：1/6 |
| 71–80 | 0：1/2；1/2/3：各1/6 |
| 61–70 | 0：1/2；2/3/4：各1/6 |
| 51–60 | 0：1/2；3/4/5：各1/6 |
| 41–50 | 0：1/2；4：1/6；5：1/3 |
| 0–40 / 无太守 | 0：1/2；5：1/2 |

所以“政令整备”不是把下降值减半，而是**有一半概率完全跳过本季自然下降**。

### Vanilla 边界

`[VANILLA][empirical-high / compatibility-assumption]`

上述逐指令证据来自 PC-PK1.1。无印时期的玩家资料已经确认：

- 换季才自然下降；
- 太守魅力决定下降幅度；
- 魅力100常见 0～2；
- 无太守固定5。

这些行为与 PK 原函数完全吻合，因此在拿到 Vanilla EXE 反证前，引擎复用同一基础公式。

但“政令整备”属于 PK 新增内政技巧，Vanilla **不执行**前置 50% 免降判定。

### 证据来源

- 311MemoryResearch：`Func-自动05-城市治安下降.txt`
  https://github.com/sjn4048/311MemoryResearch/blob/master/内存资料/整理/Func-自动05-城市治安下降.txt
- 311SireCustomizedPackageDev：`内存地址汇总.md`（GetRandomX / ProbabilityCheck）
  https://github.com/sean2077/311SireCustomizedPackageDev/blob/dev/material/内存地址汇总.md
- 日文 Wiki 实测锚点：
  https://w.atwiki.jp/sangokushi11/pages/1152.html
- PK 官方说明书：政令整备为 PK 内政技巧，效果为“治安更不容易下降”
  https://cdn.akamai.steamstatic.com/steam/apps/628070/manuals/32sangokushi11wpk_manual.pdf


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
