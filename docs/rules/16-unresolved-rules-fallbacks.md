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

### 结论：Vanilla 本身就必须按补丁版本分 profile

这一项找到的关键证据不是另一套完整公式，而是 KOEI 官方补丁记录明确证明外交相关规则至少发生过两轮调整：

- Vanilla Ver.1.1（2006-04-10）：调整“势力间友好的增减平衡”。
- Vanilla Ver.1.2（2006-05-01）：再次调整“势力友好的增减平衡”，并明确调整“计略及外交的成功率”。
- Vanilla Ver.1.3（2006-07-06）：公开更新项目未再列外交成功率调整。
- PK Ver.1.1（2006-10-04）与 Ver.1.1.1（2007-03-14）：官方更新项目也未列外交成功率调整。

因此旧规则“Vanilla 1.0 直接复用 pc-late-empirical”证据不足，撤回。

### 版本 profile

引擎至少区分：

```ts
type DiplomacyProfile =
  | "vanilla-1.0-pre-balance"
  | "vanilla-1.1-friendship-rebalanced"
  | "vanilla-1.2-plus-post-success-rebalance"
  | "pk-1.0-1.1-late-empirical"
```

#### A. Vanilla 1.0

`[VANILLA-1.0][unknown-exact]`

1.1 官方说明明确后续调整了势力间友好增减，所以 1.0 的亲善/关系变化常量不能假定等于后期版本。完整的 1.0 外交成功率函数目前也没有找到源码级资料。

#### B. Vanilla 1.1

`[VANILLA-1.1][partial-known]`

友好度增减平衡已经相对 1.0 改过；但 1.2 又明确调整“计略及外交成功率”。因此 1.1 是独立过渡 profile，不能与 1.0 合并，也不能直接称为 PK 公式。

#### C. Vanilla 1.2 / 1.3

`[VANILLA-1.2+][post-success-rebalance / compatibility-assumption]`

1.2 是外交成功率的硬版本分界。1.3 更新列表未再声明外交成功率调整，所以没有反例前，可把 1.2/1.3 归为同一个 post-1.2 family。

但目前找到的完整亲善/同盟/停战/交换俘虏/劝降公式，主要来自后期攻略与 PK/超级难度语境资料；因此仍不能声称 Vanilla 1.2/1.3 的所有常量与 PK 完全相同。

#### D. PK 1.0 / 1.1

`[PC-PK][empirical-high]`

现有完整外交公式最适合绑定到这一 profile。尤其“超级难度系数 0.7”只能属于 PK，因为超级难度是 PK 新增。

PK 官方 1.1/1.1.1 更新项目没有列外交成功率调整，因此当前把 PK 1.0/1.1 视作同一外交 formula family；这是高置信兼容判断，不是源码级证明。

### 完整公式如何落地

`07-diplomacy.md` 中亲善、同盟、停战、俘虏交换、劝降的完整公式保留，并默认绑定：

```ts
formulaProfile = "pk-1.0-1.1-late-empirical"
```

Vanilla 不另造一套未经证实的常量，而采用显式 fallback：

```ts
function resolveDiplomacyProfile(version) {
  if (version === "vanilla-1.0")
    return { profile: "vanilla-1.0-pre-balance", exact: false, fallback: "pk-1.0-1.1-late-empirical" }

  if (version === "vanilla-1.1")
    return { profile: "vanilla-1.1-friendship-rebalanced", exact: false, fallback: "pk-1.0-1.1-late-empirical" }

  if (version === "vanilla-1.2" || version.startsWith("vanilla-1.3"))
    return { profile: "vanilla-1.2-plus-post-success-rebalance", exact: false, fallback: "pk-1.0-1.1-late-empirical" }

  return { profile: "pk-1.0-1.1-late-empirical", exact: false }
}
```

Vanilla fallback 被触发时，simulation report 必须输出 `compatibilityAssumption=true`，并记录 `reason="exact vanilla diplomacy constants not recovered"`。不要为了区分版本而凭空制造三套系数。

### PK 外交府不能混进成功率

`[PK][confirmed/empirical-high]`

外交府的效果是外交类行动力消耗减半、亲善费用减半。日文 Wiki 与 PK 攻略都把“计略府：提高流言成功率”和“外交府：AP/亲善费用减半”分开描述，所以没有证据把外交府当成同盟、停战、换俘等成功率 multiplier。

### 论客也要版本化

- Vanilla 时代已经存在论客与外交舌战机制。
- `超级`是 PK 新增难度；超级下资料长期一致为约 20% 进入外交舌战，因此 `debateEntryRate.super = 0.20` 只属于 PK super profile。

### 证据来源

- KOEI 官方 Vanilla Ver.1.1 更新：https://www.gamecity.ne.jp/regist_c/user/san11/san11_update.htm
- Vanilla Ver.1.2 更新：https://down.gamersky.com/pc/200605/4524.shtml
- Vanilla 1.2/1.3 更新整理：https://forum.gamer.com.tw/C.php?bsn=6331&snA=5789
- KOEI 官方 PK Ver.1.1/1.1.1 更新：https://www.gamecity.ne.jp/regist_c/user/san11/pk/san11pk_update.htm
- PK 同盟完整判定公式：https://zhidao.ali213.net/q/13047392.html
- 完整外交公式汇总：https://zhidao.baidu.com/question/693845718520080364/answer/2870151990.html
- PK 外交府：https://w.atwiki.jp/sangokushi11/pages/74.html
- PK 建筑攻略：https://www.gamersky.com/handbook/200609/33180.shtml
---

## 4. 攻城统一公式与陷落资源

### 结论

本项从“几乎全靠 fallback”缩小为三个不同证据等级的问题：

1. **破城资源保留：已反汇编精确解决。**
2. **攻城伤害：统一调用链和绝大部分倍率已反汇编，耐久基础式只剩两个子函数未公开文本展开。**
3. **内政设施：保留数量档位已稳定实测，具体抽取哪几座的 RNG 仍未知。**

---

### 4A. 破城资源保留：resolved

`[PC-PK1.1][reverse-engineered]`

311MemoryResearch 的 `函数[破坏内政设施和破城获取资源].txt` 直接整理了原函数 `004B329B`。

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
- https://github.com/tankyc/sango_infinity/blob/master/Project/Assets/Sango/Scripts/Game/Object/Troop/Troop.cs

高质量公式研究：
- https://game.ali213.net/thread-5983352-1-1.html

---

### 4D. 内政设施保留：数量 resolved，选择 RNG open

`[COMMON][empirical-high]`

数量规则：

```ts
keepCount =
  charisma >= 100 ? 5 :
  charisma >= 80  ? 4 :
  charisma >= 60  ? 3 :
  charisma >= 40  ? 2 : 1
```

来源：
- https://w.atwiki.jp/sangokushi11/pages/1598.html
- https://w.atwiki.jp/sangokushi11/pages/2469.html

没有找到原版“具体哪几座留下”的排序/RNG函数。

fallback：

```ts
const retained =
  seededSampleWithoutReplacement(
    existingDomesticFacilities,
    min(keepCount, existingDomesticFacilities.length)
  )
```

不要按“最贵/等级最高/最靠近造币谷仓”做人为偏置；现有玩家记录只支持“数量由魅力决定，具体项目不可控”。

---

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

第4项现在只剩：

1. `005ADE20` 冲车/木兽基础耐久函数的逐指令闭式；
2. 内政设施具体保留对象的 RNG/排序；
3. Vanilla EXE 与 PC-PK 这套伤害/资源代码是否逐字一致。

以上三点不能阻止引擎运行，而且都已有明确可替换接口。

## 5. 火焰持续与“自然蔓延”

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
- https://github.com/tankyc/sango_infinity/blob/master/Project/Assets/Sango/Scripts/Game/Object/Skill/Effect/SetFire.cs
- https://github.com/tankyc/sango_infinity/blob/master/Build/Content/Data/Common/Skills.json

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


## 6. 自然死亡精确 RNG

### 结论：死亡状态机已能确认，精确随机函数仍缺函数体

这一项最重要的修正是：**不能在剧本初始化时直接预抽一个最终死亡年/旬。**

SIRE 开发资料已经给出原版 PK 的关键函数名和运行时字段：

- `0048A000 GetDeathYear`：返回角色死亡年；
- `00489160 IsMarkedForDeath`：判断武将是否已经“预定死亡”；
- 武将静态数据同时保存 `YearOfBirth`、`YearOfDeath`、`CauseOfDeath`；
- GetInfo 运行时字段另外暴露“是否预定死亡”和“健康状态”。

这说明原作至少存在如下分层：

```text
剧本基础数据
YearOfBirth / YearOfDeath / CauseOfDeath
              ↓
        GetDeathYear()
              ↓
到达死亡阈值后的运行时判定
              ↓
      IsMarkedForDeath
              ↓
       健康恶化 / 死亡
```

而不是：

```text
开局
→ 一次性抽出最终死亡日期
→ 到日期直接死亡
```

`[PC-PK1.1][reverse-engineered-partial]`

逆向来源：
- https://github.com/sean2077/311SireCustomizedPackageDev/blob/dev/material/内存地址汇总.md
- https://github.com/sean2077/311SireCustomizedPackageDev/blob/dev/material/结构体汇总.md
- https://github.com/sean2077/311SireCustomizedPackageDev/blob/dev/material/数据汇总.md

---

### 6A. 自然死 / 不自然死是不同寿命 profile

`[COMMON][empirical-high]`

日文攻略 Wiki 长期整理：

- **自然死**：到基础没年后开始容易生病，多数在当年死亡，少数延后约 2–3 年；
- **不自然死**：到基础没年附近会出现一次病情变化，但不会按普通自然死立即退场，而会再获得一段寿命；
- 不自然死的额外寿命与“基础没年时年龄”负相关：死得越年轻，通常延寿越长；高龄武将延寿很少；
- 旧资料常把额外上限描述为“约 15 年”，但玩家记录存在实际死亡比基础没年晚 16–20 年的案例，因此 **15 不能作为 actual-death hard cap**。

来源：
- https://w.atwiki.jp/sangokushi11/pages/983.html
- https://w.atwiki.jp/sangokushi11/pages/886.html
- https://w.atwiki.jp/sangokushi11/pages/579.html
- https://w.atwiki.jp/sangokushi11/pages/1950.html
- https://w.atwiki.jp/sangokushi11/pages/1928.html

孙策是很好的回归锚点：

- 生年 175、基础没年 200、死因“不自然死”；
- 玩家把没年改为 189 后，十次左右测试的于吉事件集中在 205–206；
- 另有 PK 实测正常数据时事件在 216 年附近；
- 于吉事件舌战获胜后，游戏明确把孙策寿命再延长 **20 年**。

这说明事件和普通寿命系统操作的是同一条“死亡阈值 / 寿命”链，而不是另做一个固定历史日期。

事件来源：
- https://w.atwiki.jp/sangokushi11/pages/918.html
- https://w.atwiki.jp/sangokushi11/pages/886.html

---

### 6B. “预定死亡年”是原作真实概念

`[COMMON][confirmed source language / PC-PK reverse]`

游民星空转载的官方事件条件直接使用：

- “刘备预定死亡年到临”
- “诸葛亮预定死亡年到临”
- “孙策预定死亡年之后或 200 年到临”

这与 SIRE 命名的 `IsMarkedForDeath` 完全一致：**基础没年、计算后的死亡时点、运行时死亡 flag 不是同一个概念。**

来源：
- https://www.gamersky.com/handbook/200809/124174_6.shtml
- https://wap.gamersky.com/gl/Content-124174_12.html
- https://wap.gamersky.com/gl/content-134257_10.html

因此事件系统也必须查询统一的 lifespan/death service，不得直接写：

```ts
if (currentYear >= person.yearOfDeath) die()
```

---

### 6C. 死亡不是开局永久固定

`[COMMON][empirical-high]`

日文 Wiki 的问答记录中，玩家明确报告：

- 从足够早的存档重新推进后，原本已经死亡的武将可能继续活；
- 反之亦然；
- 具体哪一个时点固定死亡结果不明。

这与运行时 `IsMarkedForDeath` 字段相符：死亡结果至少有一部分是在游戏推进过程中决定，而不是 scenario load 时永久写死。

来源：
- https://w.atwiki.jp/sangokushi11/pages/2527.html

因此旧 fallback 的：

```ts
// WRONG
onScenarioInit() {
  deathYear = ...
  deathDekad = uniformInt(1, 36)
}
```

删除。

---

### 6D. 目前真正缺失的两个函数

1. `0048A000 GetDeathYear` 的完整函数体尚未在公开文本资料中展开，因此“不自然死 +a 年”的**原版年龄函数**仍未知；
2. 到达死亡阈值以后，原程序究竟在年初/月初/每旬用什么概率立 `markedForDeath`，以及立 flag 后多久真正死亡，仍未取得逐指令公式。

SIRE 仓库公开了已命名的 IDA 数据库，但当前公开 Markdown/TXT 只给函数地址与语义，不足以把函数体冒充已逆向。

---

### 6E. provisional-engine-rule：按原作状态机，而不是预抽日期

#### 第一步：计算死亡阈值

自然死：

```ts
deathThresholdYear = person.yearOfDeath
```

不自然死暂采用一个**工程年龄曲线**：

```ts
ageAtBaseDeath =
  person.yearOfDeath - person.yearOfBirth

unnaturalExtraYears = clamp(
  floor((100 - ageAtBaseDeath) / 3),
  0,
  15
)

deathThresholdYear =
  person.yearOfDeath + unnaturalExtraYears
```

这个式子不是原版公式，只是满足目前可靠方向的 fallback：

- 年轻的“不自然死”人物接近 +15 年；
- 约 60–70 岁时约 +10～13 年；
- 90 多岁时只延 0～3 年；
- 不自然死阈值之后还会进入自然死亡阶段，所以实际死亡可以晚于“+15”。

孙策若按 175→200，则年龄25，fallback 给 +15，阈值 215；与“210 年以后、常见约 216”这一批实测处在同一量级。

#### 第二步：到阈值后才做运行时死亡判定

为了同时满足“多数当年死、少数拖 2–3 年”和 `markedForDeath` 独立状态，fallback 不预抽最终日期，而在每年第一次寿命结算时做：

```ts
const markChanceByOverdueYear = [
  0.65,      // 阈值年
  0.7142857, // 若首年未中，则第二年；累计死亡年权重约25%
  0.80,      // 第三年；累计约8%
  1.00       // 第四年兜底；累计约2%
]

function updateNaturalDeathAtYearBoundary(person, year, rng) {
  if (person.dead || person.markedForDeath) return

  const threshold = getFallbackDeathThresholdYear(person)
  if (year < threshold) return

  const overdue = min(year - threshold, 3)

  if (rng.chance(markChanceByOverdueYear[overdue])) {
    person.markedForDeath = true

    // 只在 flag 立起时决定本年度的死亡旬；
    // 不在剧本初始化阶段预抽。
    person.pendingDeathDekad = rng.int(0, 35)
  }
}
```

这组 conditional chance 对应最终年份分布约：

```text
阈值年   65%
+1年     25%
+2年      8%
+3年      2%
```

它继承旧 fallback 的经验权重，但**语义已经变成原作式“逐年立死亡 flag”**。

#### 第三步：flag 与健康状态分开

```ts
if (person.markedForDeath) {
  updateIllnessPresentation(person)

  if (currentDekadIndex >= person.pendingDeathDekad) {
    resolveNaturalDeath(person)
  }
}
```

健康状态是独立 runtime state。当前没有证据给出“健康→轻伤/重伤/濒死→死亡”的精确转换概率，因此：

- 健康恶化主要用于 UI/能力修正；
- 不再让健康状态另掷一个独立死亡概率；
- 真正死亡统一由 lifespan state machine 决定。

这样避免“寿命 RNG + 健康 RNG”重复计算死亡风险。

---

### 6F. RNG 与回放

死亡 roll 必须使用模拟器正常 PRNG 状态，而不是：

```ts
hash(personId, year) // 永远固定
```

原因是旧玩家实测表明，从更早时间重跑可能改变死亡结果。

引擎仍可通过保存 PRNG state 保证**同一完整游戏轨迹可重放**；但改变此前行动、事件和 RNG 消耗后，未来死亡结果允许变化，这更符合原作表现。

---

### 6G. 历史事件优先级

历史死亡事件满足条件时，可以：

- 直接死亡；
- 修改寿命/死亡阈值；
- 拦截普通死亡流程。

例如孙策于吉事件胜利是“延寿 +20”，失败则死亡。因此统一接口应为：

```ts
getEffectiveDeathThreshold(person)
markForNaturalDeath(person)
extendLife(person, years)
killPerson(person, cause)
```

而不是事件脚本直接修改若干互不相干字段。

---

### 剩余 exactness

第 6 项现在真正只剩：

1. `0048A000 GetDeathYear` 中“不自然死 +a”的原版闭式；
2. `markedForDeath` 的原版触发时点与概率；
3. flag 后病情恶化到实际死亡的精确时序；
4. Vanilla EXE 是否与 PC-PK 完全相同。

当前 fallback 已经恢复正确的**状态结构**；以后拿到函数体时，只替换 `getFallbackDeathThresholdYear()` 和 `updateNaturalDeathAtYearBoundary()`，不改生命周期接口。

---


## 7. 混乱 / 伪报持续与恢复

### 结论：恢复机制已反汇编精确；初始持续计数仍缺两个效果函数体

这一项可以拆成：

1. 施加异常时写入多少“剩余回合计数”；
2. 每旬如何减少；
3. 什么时候恢复正常；
4. PK 的阵/砦/城塞到底如何加速恢复。

其中 2～4 已由 PC-PK 反汇编锁定。

---

### 7A. 原作不是“每旬掷骰决定是否醒来”

`[PC-PK1.1][reverse-engineered]`

311MemoryResearch 的：

`Func-自动03-部队异常状态处理.txt`

直接给出每旬处理函数 `00599B90`。

部队有一个独立的：

`statusTurnCount`

计数。正常情况下每旬固定：

```ts
statusTurnCount -= 1
```

而不是：

```ts
if (random() < recoveryChance) recover()
```

当计数减到 0 时，程序立即调用正常化处理。

精确结构：

```ts
recoverySpeed = 1

if (ruleset === "pk" && insideFriendlyDefensiveFacilityAura(unit)) {
  recoverySpeed = 2
}

statusTurnCount =
  max(0, statusTurnCount - recoverySpeed)

if (statusTurnCount === 0) {
  clearAbnormalStatus(unit)
}
```

因此旧 fallback：

`每旬 50% 概率清醒`

应彻底删除。

逆向来源：
- https://github.com/sjn4048/311MemoryResearch/blob/master/内存资料/整理/Func-自动03-部队异常状态处理.txt

---

### 7B. 混乱 / 伪报在“减计数之前”先执行状态效果

`[PC-PK1.1][reverse-engineered]`

同一函数还确认了结算顺序。

#### 混乱

如果部队本旬尚未行动：

```ts
unit.hasActed = true
```

也就是直接失去正常行动机会。

#### 伪报

如果尚未行动：

1. 取得所属据点；
2. 执行朝所属据点撤退的 AI 移动处理；
3. 设置为已行动。

之后才进入统一的 `statusTurnCount` 减少。

所以引擎结算必须是：

```text
异常行为
→ 标记已行动
→ 剩余计数减少
→ 若到0，恢复正常
```

不能先清异常再决定本旬是否行动。

---

### 7C. PK 防御设施：不是“概率提高”，而是计数每旬 -2

`[PK][reverse-engineered]`

PK 官方说明书说，阵、砦、城塞影响范围内的己方部队“从伪报/混乱恢复的概率提高”。

原程序实现其实更具体：

```ts
normalRecoverySpeed = 1
facilityAuraRecoverySpeed = 2
```

即每旬多消掉 1 点异常计数。

原函数会根据势力已经研究的防御设施科技确定当前设施类型，并读取该设施的有效范围，在范围内才启用 `recoverySpeed=2`。

因此如果剩余计数为 3：

```text
普通位置：3 → 2 → 1 → 0
设施范围：3 → 1 → 0
```

官方 PK 手册还明确说这是“本体功能之外追加”的效果，所以：

- Vanilla：默认每旬 -1；
- PK：满足防御设施范围时每旬 -2。

官方来源：
- https://cdn.akamai.steamstatic.com/steam/apps/628070/manuals/32sangokushi11wpk_manual.pdf

反汇编来源：
- https://github.com/sjn4048/311MemoryResearch/blob/master/内存资料/整理/Func-自动03-部队异常状态处理.txt

社区交叉：
- https://forum.gamer.com.tw/Co.php?bsn=60001&sn=380559

---

### 7D. 状态 setter 也已定位

SIRE 地址表确认：

- `004AEA70 SetTroopStatus`：设置部队状态与状态回合数；
- `00496350 SetTroopTurnCount`：直接设置状态回合计数。

因此“状态类型”和“剩余回合计数”在原作数据结构中是两个明确字段，不是根据状态类型每旬重新算概率。

来源：
- https://github.com/sean2077/311SireCustomizedPackageDev/blob/dev/material/内存地址汇总.md

---

### 7E. 施加时的初始计数：仍缺 exact

普通计略主流程已经定位：

- `005917D0`：伪报演示与实际处理；
- `00591A20`：扰乱演示与实际处理；
- `00591C70`：镇静；
- 上层 `00593424` 会先算是否会心，再把会心 flag 传进上述效果函数。

但是 311MemoryResearch 的公开 TXT 只把调用点整理出来，没有展开 `005917D0 / 00591A20` 的完整函数体。

所以目前不能源码级回答：

> 普通扰乱究竟是 1/2 各多少概率？会心究竟是 2/3 各多少概率？

可靠边界只有：

- 普通扰乱/伪报玩家长期观察主要为 **1～2 回合**；
- 日文 Wiki 明确说会心后**至少持续 2 回合**；
- 旧 2ch 同样说明计略会心的核心效果是“混乱/火计/伪报至少持续2回合”；
- 部分后期专项实测认为会心常见为 2～3 或固定观察到 3。

来源：
- https://w.atwiki.jp/sangokushi11/pages/85.html
- https://w.atwiki.jp/sangokushi11/pages/1964.html
- https://www.gamersky.com/handbook/200604/22297.shtml

---

### 7F. 性格 / 智力：影响会心率，不进入恢复函数

`[PC-PK1.1][reverse-engineered]`

`函数[计策爆击率].txt` 明确显示，施法方主将性格进入“伪报/扰乱的会心率”计算。

伪报的性格修正：

```text
胆小 +10
冷静  +5
刚胆   0
莽撞  -5
```

扰乱正好偏向另一端：

```text
胆小  -5
冷静   0
刚胆  +5
莽撞 +10
```

施法方/受术方智力也进入会心率计算。

但是已经进入异常状态以后，`00599B90` 的恢复逻辑没有读取智力、性格、适性或兵种，只读取：

- 当前异常计数；
- 是否处于 PK 防御设施加速范围。

所以正确建模是：

```text
性格/智力
→ 影响是否会心
→ 会心影响初始异常持续值
→ 后续每旬固定倒计时
```

而不是：

```text
智力高 → 每旬更容易随机清醒
```

逆向来源：
- https://github.com/sjn4048/311MemoryResearch/blob/master/内存资料/函数[计策爆击率].txt

---

### 7G. provisional-engine-rule：只替代“初始计数生成”

第一版不再模拟随机恢复，只对设置时的 duration 使用 fallback。

公开 San11 重制项目 `sango_infinity` 对伪报与扰乱采用：

```text
普通：1回合 70%，2回合 30%
会心：2回合 70%，3回合 30%
```

这不是原作反汇编常量，但满足目前所有可靠边界，因此可作为工程默认：

```ts
function fallbackAbnormalDuration(isCritical) {
  const base =
    weightedChoice({
      1: 0.70,
      2: 0.30
    })

  return base + (isCritical ? 1 : 0)
}
```

来源仅作为工程参考：
- https://github.com/tankyc/sango_infinity/blob/master/Build/Content/Data/Common/Skills.json

必须配置成：

```ts
rules.abnormal.initialDurationProfile
```

而不是写死在状态系统中。

---

### 7H. 重复施放：旧 fallback 的“额外 +1”删除

旧规则：

```ts
duration =
  min(5, max(oldDuration, newDuration) + 1)
```

没有可靠原作依据，删除。

当前在 `005917D0 / 00591A20 / SetTroopStatus` 函数体未完全展开前，重施策略保持独立 open-exactness。

初版建议只做保守刷新：

```ts
remaining =
  max(currentRemaining, newlyRolledDuration)
```

并明确标记 `provisional-engine-rule`。

这样不会因为重复施放人为制造一个原版未证实的“每次叠 +1、最多5回合”系统。

---

### 7I. 镇静

`[COMMON][confirmed mechanism]`

镇静是主动解除混乱/伪报，不走自然倒计时。

会心镇静会把效果扩展到目标邻接友军，这一点日文 Wiki 明确。

所以：

```ts
onCalmdownSuccess(target) {
  clearAbnormalStatus(target)

  if (critical) {
    for (const ally of adjacentAllies(target)) {
      clearAbnormalStatus(ally)
    }
  }
}
```

来源：
- https://w.atwiki.jp/sangokushi11/pages/85.html

---

### 剩余 exactness

第 7 项现在只剩两个真正未知点：

1. `005917D0` 伪报初始回合数生成；
2. `00591A20` 扰乱初始回合数生成，以及重复施放时 setter 的覆盖策略。

**自然恢复本身已经解决，不再是概率问题。**


## 8. 单挑连续命中 / 伤害函数

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
- https://github.com/tankyc/sango_infinity/blob/master/Project/Assets/Sango/Scripts/Game/Duel/Duel.cs
- https://github.com/tankyc/sango_infinity/blob/master/Project/Assets/Sango/Scripts/Game/Duel/DuelEnum.cs
- https://github.com/tankyc/sango_infinity/blob/master/Data/事件系统-项目变更影响评估.md
- https://github.com/tankyc/sango_infinity/blob/master/Data/Export/export311Scenario.bat

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

### 8H. 原 fallback 删除

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

### 8I. 版本边界与剩余 exactness

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


## 9. 舌战普通牌心理伤害

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
- https://github.com/tankyc/sango_infinity/blob/master/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs
- https://github.com/tankyc/sango_infinity/blob/master/Project/Assets/Sango/Scripts/Game/Debate/DebateEnum.cs

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

### 剩余 exactness

第 9 项“普通牌心理伤害公式”本身已经解决。

后续舌战仍可单独继续审计：

1. 特定武将的 `DebatePersonBehaviours` 是否对应原版隐藏硬编码；
2. 不同平台的手牌数量差异；
3. Vanilla 二进制连续常量；
4. 舌战胜利后的追击/留情、负伤等结算边界。


## 10. 非骑战法来源的负伤 / 战死概率

### 结论：删除“部队击破统一伤亡率”；按明确来源分别结算

这一项最大的纠错是：**没有证据支持原版在每次普通攻击/普通战法击破部队后，再统一掷一次 2%/4% 战死与 12% 负伤。**

目前 PC-PK 逆向能明确识别的武将战场伤亡来源包括：

1. 骑兵“突击 / 突进”的专用战死判定；
2. 特技“猛者”的 50% 负伤；
3. 业火种 / 业火球的专用炸伤 / 炸死函数；
4. 单挑中的急所 / 无双 / 假退却等专用负伤与单挑结果。

普通部队兵力归零主要进入**俘虏 / 逃走 / 返回所属地**的击破结算，而不是再套一个通用战死 RNG。

因此旧 fallback：

```ts
deathChance =
  deathSetting === "none" ? 0 :
  deathSetting === "normal" ? 0.02 :
  0.04

injuryChance = 0.12
```

整体删除。

---

### 10A. 业火种 / 业火球：专用 casualty 函数已逐指令确认

`[PC-PK1.1][reverse-engineered]`

311MemoryResearch 的：

`内存资料/函数[火陷阱炸伤炸死].txt`

明确显示，火陷阱伤害处理结束后只有：

- ID 16：业火种
- ID 15：业火球

会调用：

`00597350`

进行武将炸死 / 炸伤判定。

普通火种、火焰种、火球、火焰球、火船都**不会进入这条 casualty 分支**。

其中火船另有 25% 混乱判定；业火种另有 50% 混乱判定，但这是状态异常，不是武将伤亡。

---

### 10B. 候选武将先经过护卫 / 强运过滤

`00597350` 在战死和负伤阶段都会分别调用：

`005971F0 DesignateInjuredPersonnel`

SIRE 地址表也明确把该函数命名为“预定受伤人员”。

311MemoryResearch 的逐指令注释确认这里会考虑：

- 护卫
- 强运

所以流程不是：

```text
每名武将各自独立掷一次
```

而是：

```text
从部队中指定一名合法候选
→ 对该候选计算概率
→ 掷一次
```

战死判定结束以后，负伤阶段会**再次调用 005971F0**，所以两个阶段可以指定不同候选。

这意味着一次业火爆炸理论上可以：

- 一人战死；
- 随后另一名合法武将再负伤。

公开文本尚未展开 `005971F0` 的完整“多名合法候选时如何挑人”算法，所以**单个指定武将的最终 unconditional 概率**还要乘上候选选中概率；下面给出的百分比是“该武将已经被指定为候选”后的 conditional chance。

来源：
- https://github.com/sjn4048/311MemoryResearch/blob/master/内存资料/函数[火陷阱炸伤炸死].txt
- https://github.com/sean2077/311SireCustomizedPackageDev/blob/dev/material/内存地址汇总.md

---

### 10C. 能力保护档：取统 / 武 / 智最大值

`00596380` 读取目标武将：

```ts
M = max(leadership, strength, intelligence)
```

并返回：

```ts
abilityProtection =
  M <= 70 ? 0 :
  M <= 80 ? 1 :
  M <= 90 ? 2 :
            3
```

注意这个值在汇编里是被 **SUB** 掉：

```asm
call 00596380
sub  esi, eax
```

所以能力越高，炸伤 / 炸死概率越低。

网上有一篇流传较广的火攻文章把这里写成：

`A + 性格 + 能力档`

并得出“属性越高反而越容易炸死/炸伤”的结论；这与 `00597350` 的实际 `sub esi,eax` 冲突，因此 repo 不采用该转载公式。

---

### 10D. 性格内部值

原枚举顺序：

```ts
Timid    = 0 // 小心/胆小
Calm     = 1 // 冷静
Bold     = 2 // 刚胆
Reckless = 3 // 莽撞/猪突
```

因此性格越莽撞，火陷阱 casualty chance 越高。

这也与老玩家长期观察“猪突更容易被骑兵突死、谨慎更安全”的方向一致。

---

### 10E. 业火炸死率：精确条件式

战死设置：

```ts
baseDeath =
  deathMode === "none"   ? null :
  deathMode === "normal" ? 2 :
  deathMode === "high"   ? 4 :
                           0
```

若 `deathMode === "none"`，整个战死阶段直接跳过。

其余情况：

```ts
deathChance =
  max(
    0,
    baseDeath
      + personalityInternal
      - abilityProtection
  )
```

然后：

```ts
if (chance(deathChance)) {
  battleDeath(candidate)
}
```

#### 普通战死设置

| max(统,武,智) | 小心 | 冷静 | 刚胆 | 莽撞 |
|---|---:|---:|---:|---:|
| ≤70 | 2% | 3% | 4% | 5% |
| 71–80 | 1% | 2% | 3% | 4% |
| 81–90 | 0% | 1% | 2% | 3% |
| >90 | 0% | 0% | 1% | 2% |

#### 高战死设置

| max(统,武,智) | 小心 | 冷静 | 刚胆 | 莽撞 |
|---|---:|---:|---:|---:|
| ≤70 | 4% | 5% | 6% | 7% |
| 71–80 | 3% | 4% | 5% | 6% |
| 81–90 | 2% | 3% | 4% | 5% |
| >90 | 1% | 2% | 3% | 4% |

这里按概率语义对 `<=0` 统一视为 0。

---

### 10F. 业火炸伤率：与战死设置无关

即使设置为“无战死”，仍然会进入受伤阶段。

同样先重新指定合法候选，然后：

```ts
injuryChance =
  max(
    0,
    2
      + personalityInternal
      - abilityProtection
  )
```

因此：

| max(统,武,智) | 小心 | 冷静 | 刚胆 | 莽撞 |
|---|---:|---:|---:|---:|
| ≤70 | 2% | 3% | 4% | 5% |
| 71–80 | 1% | 2% | 3% | 4% |
| 81–90 | 0% | 1% | 2% | 3% |
| >90 | 0% | 0% | 1% | 2% |

成功后调用：

`005963E0`

执行具体伤病处理。

`005963E0` 的“到底升到轻伤/重伤/濒危哪一级”的完整函数体尚未在公开 TXT 中展开，因此**概率已解决，伤病等级分布仍 open**。

---

### 10G. 猛者：50% 是独立专用来源

`[COMMON][confirmed/empirical-high]`

猛者的官方/同期攻略描述长期一致：

> 使用能够推动敌部队的战法并成功产生位移后，50% 概率使敌将负伤。

因此：

```ts
if (
  attackerHasFierceWarrior &&
  tacticSuccessfullyMovedTarget
) {
  if (chance(50)) {
    resolveMightyWarriorInjury(targetUnit)
  }
}
```

不能把猛者 50% 和业火 2～5% 再叠成一条“通用攻击负伤率”。

来源：
- https://www.gamersky.com/handbook/200603/21610.shtml
- https://w.atwiki.jp/sangokushi11/pages/593.html

猛者最终伤到三人部队中的哪一人，以及具体伤病等级，当前仍可复用统一 casualty-candidate / injury-severity 接口，等待对应原函数进一步展开。

---

### 10H. 普通攻击 / 普通战法 / 攻击设施：不添加额外武将 casualty roll

`[PC-PK1.1][negative-reverse-evidence-high]`

已经逐项检查：

- `函数[部队攻击].txt`
- `函数[战法效果].txt`
- `函数[强制单挑].txt`

都没有调用：

- `00597350` 火陷阱伤死函数；
- `005971F0` casualty candidate selector；
- `005963E0` 伤病处理；
- `004ACBE0` 战死处理。

而火陷阱文件只有在 ID15/16 的明确分支才调用 `00597350`。

社区机制资料同样把可主动造成武将伤亡的主要来源单列为：

- 骑兵战法 → 战死；
- 猛者 → 负伤；
- 业火系 → 负伤/战死；
- 单挑 → 负伤/战死。

普通部队壊灭相关特技“血路”处理的是**不被俘虏**，早期“捕缚”攻略也把普通最后一击描述为捕获武将，而不是额外产生随机战死。

更强的旁证是后来的 San11 PK2.2 MOD 把：

- “全兵种战法负伤系统”
- “全兵种战法讨杀系统”

明确当作**新增功能**宣传。如果原版本来就有全兵种通用伤亡 roll，这两项就不应是新增系统。

因此 fidelity 引擎采用：

```ts
function resolveOrdinaryTroopDestruction(...) {
  resolveCaptureOrEscape(...)
  // no generic injury/death roll
}
```

而不是旧：

```ts
rollGenericDeath()
rollGenericInjury()
```

注意这句话只针对“普通攻击/普通战法/设施伤害导致兵力归零”的**额外通用武将伤亡 roll**。如果最后一击本身属于骑兵突击/突进、猛者位移、业火种/业火球、单挑等专用来源，仍先/另行执行对应专用规则。

资料：
- https://w.atwiki.jp/sangokushi11/pages/13.html
- https://www.gamersky.com/handbook/200603/21633.shtml
- https://www.bilibili.com/video/BV1yq4y1S7Mr/
- https://www.bilibili.com/video/BV14P4y1s762/

---

### 10I. 火计 / 火矢 / 普通着火格

当前公开逆向把：

- 火计 / 火矢点火；
- 格子持续火伤；
- 普通火种 / 火焰种 / 火球 / 火焰球；
- 火船

的兵力伤害与“业火种/业火球 casualty”分开。

`00597350` 的 call-site 明确只接受 ID15/16。

因此第一版 fidelity 规则：

```ts
ordinaryFireDamage:
  troopDamageOnly

wildfireTileTick:
  troopDamageOnly

basicFireTrap:
  troopDamageOnly

fireShip:
  troopDamage + confusion25

hellfireSeed:
  troopDamage + confusion50 + casualtyCheck

hellfireBall:
  troopDamage + casualtyCheck
```

不再给“站在普通火里”每旬额外添加一个我们自拟的武将战死/负伤率。

---

### 版本边界

逐指令证据来自 PC-PK。

Vanilla 同期已经存在：

- 猛者；
- 强运；
- 护卫；
- 骑兵战法战死。

但业火种/业火球属于后期技巧链的具体代码仍应按版本资料核对；无印/主机版在未做二进制回归前，不把 PC-PK 的 `00597350` 常量跨版本标成源码级 confirmed。

---

### 剩余 exactness

第 10 项现在只剩：

1. `005971F0` 多名合法武将时，候选人的精确选择算法；
2. `005963E0` 负伤成功后的伤病等级分布；
3. 猛者具体“选中哪名敌将 / 伤到哪一级”的原函数；
4. Vanilla 与各主机版是否完全共用 PC-PK casualty 常量。

但原来的“普通击破统一 2%/4% 战死 + 12% 负伤”已经可以删除。


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
