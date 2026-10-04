# 武将生命周期、人际关系、忠诚、登用、俘虏、官职

## 1. 武将生命周期 / 状态字段

`[PC-PK1.1][reverse-engineered-structure]`

旧文档把武将写成一条线性状态机：

`未登场 -> 未发现 -> 在野 -> 所属 -> 俘虏 -> 释放/登用/处斩/逃亡`

这个抽象过于粗糙。PC-PK1.1 的 `struct_person` 实际把武将状态拆成多个**正交维度**；其中只有 `Identity` 是单值身份枚举，其余如军师、任务、出征、健康、死亡预定都不是 Identity。

### 1.1 Identity 是唯一主身份枚举

`struct_person +0xA0 = Identity`。

| ID | 原身份 | 引擎建议名 |
|---:|---|---|
| 0 | 君主 | `LORD` |
| 1 | 都督 | `GOVERNOR` |
| 2 | 太守 | `PREFECT` |
| 3 | 一般 | `NORMAL` |
| 4 | 在野 | `WILD` |
| 5 | 俘虏 | `PRISONER` |
| 6 | 未登场 | `NOT_INTRODUCED` |
| 7 | 未发现 | `NOT_DISCOVERED` |
| 8 | 死亡 | `DEAD` |

原程序有一整组直接 identity helper：

```text
00488C00 IsLord
00488C10 IsGovernor
00488C20 IsPrefect
00488C30 IsNormalPerson
00488C40 IsInWilderness
00488C50 IsNotIntroduced
00488C60 IsNotDiscovered
00488C70 IsPrisoner
00488C80 IsDead
004898F0 SetPersonIdentity
```

因此实现里不要再使用模糊的 `所属` 作为第十种身份；“所属势力的现役武将”本质上是 Identity 0～3。

### 1.2 军师不是 Identity

这是旧状态机最重要的纠错之一。

`struct_person.Identity` 中没有“军师”。军师保存在势力结构：

```text
struct_force +0x08 AdvisorID
00488CF0 IsAdvisorOfForce
```

所以一个武将可以同时：

```text
Identity = NORMAL / PREFECT / ...
并且
force.AdvisorID = personId
```

军师是**势力角色引用**，不是武将生命周期身份。

### 1.3 出征 / 在部队不是 Identity

武将是否在野外部队由独立关系判断：

```text
004891C0 IsInArmy
00489220 GetPersonArmyID
00489280 IsArmyLeader
004A6340 GetPersonLocatedSPID
```

`struct_person` 还保存：

```text
+0x94 Legion      // 军团
+0x98 BuildingID  // 所属建筑
+0x9C Location    // 当前所在关系字段
```

因此“出征”不能建成 `Identity=EXPEDITION`。现役身份仍是君主/都督/太守/一般，同时通过 troop/location 关系表示人在部队中。

### 1.4 执行任务不是 Identity

任务有独立运行时字段：

```text
+0x13C Mission             // -1 = 无任务；任务编码 0..43
+0x140 MissionParameters[6]
+0x158 MissionDuration
```

并存在：

```text
004897B0 GetPersonNthMissionParameter
004A5780 ClearPersonTasks
004A73A0 SetPersonTask
004A7410 SetPersonTask
005B8250 GetPersonsPtrArrayForMissionAndTarget
005BA320 GetMissonDestBuildingID
```

所以外交、登用、调动、召唤等“人在路上”的状态，应由 Mission + 参数 + duration 表示，而不是再创造一组 lifecycle identity。

### 1.5 已行动 / 已褒奖 / 死亡预定是 Flags

`struct_person +0x124 Flags` 至少包含：

```text
已行动
已褒奖
死亡预定
舌战五种话术 flag
```

对应：

```text
00489120 HasActed
00489140 HasPraised
00489160 IsMarkedForDeath
00489B40 SetPersonActionStatus
```

因此尤其要区分：

```text
IsMarkedForDeath == true
!= Identity == DEAD
```

“死亡预定”只是运行时 flag；真正死亡才把 Identity 变为 8。

### 1.6 健康与体力也是独立维度

```text
+0x15C HealthLevel
  0 健康
  1 轻伤
  2 重伤
  3 濒危

+0x128 Stamina / Vitality
  0..100
```

原函数还明确区分：

```text
00489030 GetPersonActualAttr        // 受伤病影响
00489050 GetPersonBasicAttr         // 不受伤病影响
0048A110 GetPersonAttr(...health...)
0048A2D0 UpdateTroopParameters      // 健康变化后同步实际五维/部队参数
```

所以健康不是 `Identity` 的子状态，也不能只在 UI 临时扣属性。

### 1.7 俘虏与禁仕需要保留专门计数器

`struct_person` 直接保存：

```text
+0x160 FormerAllegiance
+0x164 ForbiddenLord
+0x168 ForbiddenMonths
+0x169 CaptiveMonths
```

并存在：

```text
0048A940 setCaptiveMonths
004A7340 SetCaptiveMonths
```

`00590C30 MonthlyAction` 月初还会先调用 `0058BB30` 处理“俘虏月份 / 禁仕月份计数器”。

因此：

- “俘虏”不只是一个身份标签，还伴随俘虏时长；
- “刚拒绝/逃离某君主后暂时不能再仕官”不能靠一个 boolean 表示；
- `FormerAllegiance` 与当前 Identity / 当前势力必须分开。

### 1.8 登场年、出生年、没年是基础/参考生命周期数据，不是当前状态

`struct_person` 保存：

```text
+0x44 YearOfDebut
+0x48 YearOfBirth
+0x4C YearOfDeath
+0x50 CauseOfDeath
+0xA8 ScheduledLord   // 登场预定君主
```

这些字段描述生命周期的**基础/参考剧本数据**；当前是否未登场、未发现、在野、所属或死亡仍看 `Identity`。它们进入运行时剧本后仍可被事件/编辑器改变，因此不要把 `YearOfDeath` 当不可变常量。

日文事件条件也明确把两件事分开写：

```text
已达到登场预定年
AND
身份为 在野 或 未发现
```

说明 `currentYear >= YearOfDebut` 并不能替代 Identity 判定。

同一武将在不同剧本里也可以分别以未登场、未发现、在野、一般、死亡等不同 Identity 开局。

### 1.9 生命周期不是固定单向链

可以确认的显式转换至少包括：

```text
未发现 -> 在野
  004A5B20 SetPersonAsNomadicPerson

未发现 / 在野 -> 现役
  登用或事件可直接成为所属武将

现役 -> 俘虏
  战败/城陷等捕获路径

俘虏 -> 现役 / 非所属状态
  登用、释放、逃亡等路径

任意存活身份 -> 死亡
  最终 Identity = DEAD
```

而且事件可以直接改变 Identity，因此不要写死成每个人必须经历：

```text
未登场 -> 未发现 -> 在野 -> 一般
```

例如推荐类事件明确允许“已到登场年且 Identity=未发现”的武将直接被登用；推荐失败又可能把未发现武将转成在野。

### 1.10 推荐的引擎模型

```ts
interface PersonRuntimeState {
  identity: PersonIdentity;

  corpsId: number;
  buildingId: number;
  location: number;

  mission: number;          // -1 or 0..43
  missionParams: number[];  // 6
  missionDuration: number;

  hasActed: boolean;
  hasPraised: boolean;
  markedForDeath: boolean;

  health: 0 | 1 | 2 | 3;
  stamina: number;

  formerAllegiance: number;
  forbiddenLord: number;
  forbiddenMonths: number;
  captiveMonths: number;
}
```

势力侧另外保存：

```ts
force.advisorId
```

不要把军师塞回 `identity`。

### 1.11 D1 当前结论

D1 可以标为：

```text
PC-PK1.1 reverse-engineered-structure
```

已经锁定：

- 9 个 Identity 枚举及原 helper；
- 军师不属于 Identity；
- 出征/在部队不属于 Identity；
- Mission/参数/期间是独立任务维度；
- 已行动、已褒奖、死亡预定属于 flags；
- 真正死亡与死亡预定严格分离；
- 健康0～3、体力0～100独立保存；
- FormerAllegiance / ForbiddenLord / ForbiddenMonths / CaptiveMonths 独立保存；
- YearOfDebut / Birth / Death / CauseOfDeath / ScheduledLord 与当前 Identity 分离；
- 生命周期不是固定单向链，事件和命令可以直接发生身份转换。

仍 open / 留给后续 D 项：

- `未登场` 在普通月度流程中转成 `未发现/现役` 的完整 caller 与 ScheduledLord 分支；
- 自然死亡、死亡预定 flag 和 Identity=DEAD 的精确逐旬转换；
- 伤病自然恢复/恶化时序；
- 各 Mission 0..43 的完整名称、参数语义与完成 caller；
- 俘虏/禁仕计数器的每月精确更新与重置条件。

来源：
- 311SireCustomizedPackageDev `struct_person`、身份/健康枚举、Person helper 地址表
  https://github.com/sean2077/311SireCustomizedPackageDev
- 311SireCustomizedPackageDev：`004A5B20 SetPersonAsNomadicPerson`、任务 setter/clear、军师判定
  https://github.com/sean2077/311SireCustomizedPackageDev
- 311MemoryResearch `函数[每月例行处理].txt`：月初俘虏/禁仕计数处理入口
  https://github.com/sjn4048/311MemoryResearch
- 日文 Wiki 推荐事件：登场年条件与在野/未发现 Identity 分离
  https://w.atwiki.jp/sangokushi11/pages/952.html
- 日文 Wiki 武将剧本页：同一人物可在不同剧本以未登场/未发现/在野/所属/死亡开局
  https://w.atwiki.jp/sangokushi11/pages/869.html

## 2. 登场、寿命与死亡

`[PC-PK1.1][reverse-engineered-structure + official-event-semantics + empirical-high timing]`

D2 不把“登场年”“没年”“死亡预定 flag”“健康”“真正死亡”压成一个字段。原结构和事件资料都说明它们是分层处理的。

### 2.1 登场：YearOfDebut 是门槛，不是当前身份

`struct_person` 同时保存：

```text
+0x44 YearOfDebut
+0xA0 Identity
+0xA8 ScheduledLord
```

原事件条件经常把它们分开判断：

```text
已经达到登场预定年 / 登场年龄
AND
当前 Identity = 在野 或 未发现
```

所以：

```ts
currentYear >= person.yearOfDebut
```

只能说明该武将已经满足某些“可登场/可参与事件”的时间门槛，**不能替代 Identity**。

### 2.2 不存在通用“15岁自动登场”规则

剧本数据直接反证按生理年龄自动登场：

- 诸葛亮在 200 年剧本已经 20 岁，仍是 `未登场`；
- 沙摩柯在 200 年剧本已经 34 岁，仍是 `未登场`；
- 到后续剧本才可能变成 `未发现` / 在野 / 所属。

因此 fidelity 绝不能写：

```ts
if (age >= 15) identity = NOT_DISCOVERED
```

普通登场必须尊重 `YearOfDebut`、剧本当前 Identity 和全局登场设置。

### 2.3 普通登场 caller 仍未公开展开

`struct_scenario` 还存在：

```text
+0x18 IgnoreAge
+0x50 ComeOnStage
```

说明“无视年龄/登场”确实有全局剧本选项；但公开资料没有展开普通月度流程里：

```text
NOT_INTRODUCED
→ NOT_DISCOVERED
或
→ ScheduledLord 所属势力
```

的完整 caller。

因此目前只能锁定数据模型和事件门槛，**不能伪造普通自动登场的具体月份、日期、ScheduledLord 优先级或随机规则**。

### 2.4 没年是基础/参考数据，不等于最终死亡时点

`struct_person`：

```text
+0x48 YearOfBirth
+0x4C YearOfDeath
+0x50 CauseOfDeath
```

同时原程序另有：

```text
0048A000 GetDeathYear
```

如果 `YearOfDeath` 本身就是最终死亡年份，就没有必要再保留一个独立的“取得死亡年”函数和运行时死亡预定 flag。

日文 Wiki 对 `YearOfDeath` 的说明也更接近“史书/演义没年”；实际游戏死亡会根据死因、寿命模式、事件与运行时判定发生偏移。

因此推荐接口：

```ts
baseDeathYear = person.yearOfDeath
effectiveDeathYear = getDeathYear(person, scenarioLifetimeMode, runtimeState)
```

而不是：

```ts
if (year >= person.yearOfDeath) kill(person)
```

### 2.5 寿命设置与战死设置是两套独立规则

`struct_scenario` 明确分开保存：

```text
+0x24 DieInBattleSetting
+0x38 Lifetime
```

此外还有：

```text
+0x18 IgnoreAge
+0x50 ComeOnStage
```

所以必须分离：

```text
自然寿命 / 没年流程
≠
战场伤亡 / 战死概率
```

“战死多/少”不能顺手改变自然寿命 RNG；“长寿/假想”等寿命模式也不能反推战法直接战死率。

社区长期把寿命模式描述为史实/长寿/假想，并有“长寿约多20年”“假想接近99岁”的经验，但这些数值**没有取得原函数支持**，只保留 empirical 参考，不写成 exact 常量。

### 2.6 自然死 profile

`[COMMON][empirical-high]`

长期稳定实测：

- 自然死武将到基础/有效没年后更容易进入病弱状态；
- 多数在该年内死亡；
- 少数会再延后约 2～3 年。

有军师时，年初可能出现“身体不适/天文有异”等死亡征兆台词；这说明游戏会在推进过程中形成死亡预定状态，而不是只在开局生成一个不可变最终日期。

但当前公开资料没有恢复：

- 每年 / 每月 / 每旬究竟在哪一层 roll；
- `markedForDeath` 被置位的精确概率；
- flag 置位后到真正死亡的精确延迟。

### 2.7 不自然死 profile

`[COMMON][empirical-high]`

“不自然死”不是到史实没年立即死亡。

稳定经验是：

- 到没年附近可能先短暂生病，然后恢复；
- 会在此后继续存活若干年；
- 额外寿命与基础没年时年龄负相关，越年轻通常延得越久。

旧 Wiki 常写“最多约15年”，但原页面自己标了“要验证”，而孙策实测存在：

- 把没年编辑为189后，多次于吉事件集中在205～206年；
- 原没年200时，常见事件约216年前后；
- 于吉事件胜利又明确“寿命延长20年”，之后仍可因为不自然死 profile 活得更久。

所以 **15 不能作为 actual-death hard cap**。

当前 `0048A000 GetDeathYear` 函数体尚未公开，因此“不自然死 +a”的年龄闭式继续 open。

### 2.8 “预定死亡年”与 markedForDeath 要区分概念层

官方事件条件资料明确使用：

```text
孙策预定死亡年之后或200年到临
刘备预定死亡年到临
诸葛亮预定死亡年到临
```

这强力证明游戏存在“基础没年之外的有效/预定死亡时点”概念。

但不能进一步偷换成：

```text
事件文本里的“预定死亡年”
==
struct_person.Flags.markedForDeath 的某一 bit
```

两者语义一致、结构上也相容，但当前没有逐指令 caller 证明它们一一对应。

可以确定的是：

```text
YearOfDeath / GetDeathYear
markedForDeath flag
Identity = DEAD
```

是至少三个不同层次。

### 2.9 死亡 flag 可以影响事件，而武将仍未死亡

事件资料提供了很好的边界：

```text
诸葛亮北伐
→ 条件之一：诸葛亮“死亡flag”尚未立起

诸葛亮之死
→ 条件之一：诸葛亮作为军师并迎来自然死
→ 结果才真正死亡
```

这再次说明：

```text
死亡预定/征兆
!= 已死亡
```

引擎不得在 `markedForDeath=true` 时立刻把 `Identity` 改成 `DEAD`。

### 2.10 死亡结果不是开局永久固定

`[COMMON][empirical-high]`

玩家长期记录：从足够早的存档重新推进，同一个武将可能在原本死亡的年份继续活着，也可能反过来死亡；灾害也有类似表现。

因此禁止：

```ts
onScenarioInit() {
  person.finalDeathDate = preRollForever()
}
```

正确的工程方向是让死亡判定消费正常模拟 PRNG；同一完整存档轨迹可以复现，但改变此前 RNG 消耗后，未来死亡结果允许变化。

### 2.11 历史事件可以覆盖普通寿命流程

孙策之死是明确锚点：

```text
事件达到条件
→ 舌战胜：寿命延长20年
→ 舌战败：孙策立即死亡，孙权继位
```

所以事件系统必须能调用统一的生命周期接口，例如：

```ts
extendLife(person, years)
killPerson(person, cause)
```

而不是把 `YearOfDeath` 当作只读资料字段。

### 2.12 健康状态与能力修正

`[PC-PK1.1 structure + empirical-high multipliers]`

结构枚举：

```text
HealthLevel
0 健康
1 轻伤
2 重伤
3 濒危
```

原程序区分：

```text
00489030 GetPersonActualAttr    // 受伤病影响
00489050 GetPersonBasicAttr     // 不受伤病影响
0048A110 GetPersonAttr(...health...)
0048A2D0 UpdateTroopParameters  // 健康变化后重算实际五维/部队参数
```

现有最强直接实机锚点来自夷陵决战制霸：

```text
甘宁基础武力94
重伤显示47  -> 50%
恢复轻伤显示75 -> floor(94*0.8)=75
```

结合其他健康资料，当前采用：

| HealthLevel | 能力倍率 |
|---:|---:|
| 健康 | 100% |
| 轻伤 | 80% |
| 重伤 | 50% |
| 濒危 | 20% |

旧“隐藏数据”页写过 `轻伤-20% / 重伤-40% / 濒死-60%`，与甘宁关卡显示值直接冲突；D2 继续以可直接复算的关卡值为准。

### 2.13 健康恢复/恶化时序仍 open

夷陵关卡本身能脚本化：甘宁重伤→3回合后轻伤→再9回合后重伤。这只能证明关卡事件能直接设置健康状态，不能拿来反推一般沙盘的自然恢复概率。

目前仍没有公开原函数体锁定：

- 轻伤/重伤/濒危自然恢复需要几旬；
- 年老/寿命到期造成健康恶化的概率；
- 疫病造成哪一级伤病的分布；
- markedForDeath 与 HealthLevel 的精确先后关系。

### 2.14 D2 当前结论（P0-5 更新）

专项： [40-debut-death-exactness.md](40-debut-death-exactness.md)。

已经锁定 / 收紧：

- `YearOfDebut` 是时间门槛，与 current Identity 独立；
- **史实模式**不存在“15岁自动登场”：成年后的诸葛亮、沙摩柯等仍可按剧本保持未登场；
- **假想登场模式**是另一条 profile：未发现/在野人物位置随机化，登场年统一改为成人年；成人年龄当前按15岁 empirical-high；
- 普通史实登场仍受 `Identity / ScheduledLord / ComeOnStage` 体系约束；
- `00590C30 MonthlyAction` 在月初调用 `005833D0` 处理年龄/死亡，生命周期主 dispatcher 的时间粒度已从“未知旬级”收紧到“月初入口”；
- `IgnoreAge` 是独立场景字段，英雄集结类 profile 至少绕过普通时间登场与自然寿命；
- `Lifetime` 与 `DieInBattleSetting` 为不同字段；用户可见寿命模式为 Historical / Longevity / Fictional；
- Longgevity 约+20年、Fictional 约99岁只标 documented/empirical compatibility profile，不能冒充 `0048A000` 精确式；
- `YearOfDeath` 是基础/参考没年，不等于最终死亡 tick；
- 存在原 `0048A000 GetDeathYear`；
- 自然死/不自然死是不同 lifespan profile；
- 不自然死额外寿命与年龄负相关，孙策实测排除最终死亡“最多+15年”的 hard cap；
- “预定死亡年”、`markedForDeath`、`HealthLevel`、`Identity=DEAD` 不能合并；
- 从较早存档重跑可改变未来死亡结果，禁止开局一次性预抽最终死亡日期；
- 历史事件可延寿或直接死亡；孙策事件 +20 年；
- 健康0/1/2/3与基础属性分离；当前能力倍率采用100/80/50/20。

仍 open：

- `005833D0` 完整函数体；
- `0048A000 GetDeathYear` 完整函数体；
- `ComeOnStage / Lifetime / IgnoreAge` 原始枚举；
- `ScheduledLord` 在普通史实登场的精确分支；
- 普通 `NOT_INTRODUCED -> NOT_DISCOVERED/现役` 的 setter 与时点；
- Longgevity +20 与死因修正先后；
- Fictional 99岁 phase；
- `markedForDeath` 触发时点、概率及真正死亡延迟；
- 一般沙盘健康自然恢复/恶化公式；
- Vanilla / 主机版寿命处理差异。

精确 fallback 继续集中在：
`16-unresolved-rules-fallbacks.md#6-登场--自然死亡精确-rngp0-5`。

来源：
- 311MemoryResearch `函数[每月例行处理].txt`
  https://github.com/sjn4048/311MemoryResearch
- 311SireCustomizedPackageDev `struct_person / struct_scenario / Person helper`
  https://github.com/sean2077/311SireCustomizedPackageDev
- 日文 Wiki / 早期攻略的史实/假想登场、成人年和寿命模式资料
  https://w.atwiki.jp/sangokushi11/pages/144.html
  https://w.atwiki.jp/sangokushi11/pages/1787.html
- 日文 Wiki 自然死/不自然死与孙策实测
  https://w.atwiki.jp/sangokushi11/pages/983.html
  https://w.atwiki.jp/sangokushi11/pages/579.html
  https://w.atwiki.jp/sangokushi11/pages/918.html

## 3. 五维、适性与成长

`[COMMON/PK][reverse-engineered-structure + empirical-exact thresholds + empirical-exact age table]`

D3 必须把“素质/基础值”“年龄盛衰”“经验培养”“PK能力研究”“健康/宝物等最终显示修正”拆开。旧规则把它们都叫“能力成长”，容易产生错误。

### 3.1 五维与底层字段

五维固定为：

```text
0 统率
1 武力
2 智力
3 政治
4 魅力
```

`struct_person` 至少保存四组不同数据：

```text
+0xC8  FiveBasicAttrs[5]            // 五维基础/素质
+0xD0  FiveBasicAttrGrowthTypes[5]  // 每一维自己的成长类型
+0x12A FiveBasicAttrExp[5]          // 五维经验
+0x170 ActualAttrs[5]               // SIRE标注：考虑伤病/宝物等后的实际值
+0x175 BasicAttrs[5]                // SIRE标注：基础显示值
```

相关原函数：

```text
00488D80 GetPersonBaseAttr
00489030 GetPersonActualAttr
00489050 GetPersonBasicAttr
004890C0 GetPersonAttrIncreaseRelativeToBase
00489180 GetPersonAttrExperience
004891A0 GetPersonAttrChangeType
0048A030 GetPersonAttrChangeCoef
0048A110 GetPersonAttr
0048A2D0 UpdateTroopParameters
0048A390 GetPersonGrowthAttr
0048A7D0 SetAttr
0048A810 SetAttrExperience
004A70D0 IncreasePersonAttrExperience
```

因此引擎不能只有一个 `person.stats[5]`。至少要保留：

```ts
talent/base
growthType
ageAdjusted
earnedIncrease/exp
uninjuredCurrent
actualAfterHealthAndTemporaryBonuses
```

公开函数表已经证明这些层存在；但“年龄系数、经验/研究增量、官职/宝物”的精确逐指令合成顺序还没有完整函数体，所以不要凭字段名伪造最终公式。

### 3.2 场景“能力变动”只控制年龄盛衰

`struct_scenario`：

```text
+0x28 AttrChange   // 能力变化
```

原版时期实测明确：

```text
能力变动 = 无效
→ 停止随年龄上升/下降
→ 经验值带来的能力提升仍然发生
```

所以：

```ts
scenario.attrChange === false
```

不能实现成“冻结所有能力变化”。它只关闭年龄曲线。

### 3.3 九种成长类型是逐能力独立保存的

SIRE 数据表给出精确编号：

| ID | 名称 | 日文Wiki对应 |
|---:|---|---|
| 0 | 超持续 | 维持・长 |
| 1 | 持续 | 维持・短 |
| 2 | 早熟 | 早熟・短 |
| 3 | 早熟持续 | 早熟・长 |
| 4 | 普通 | 普通・短 |
| 5 | 普通持续 | 普通・长 |
| 6 | 晚成 | 晚成・长 |
| 7 | 超晚成 | 晚成・短 |
| 8 | 开眼 | 开眼 |

每名武将不是只有一个总成长型，而是**统/武/智/政/魅五项各自一个 growthType**。例如同一武将可以统率“维持・长”、武力“普通・长”、智力“晚成・长”。

### 3.4 年龄曲线本质是“素质 × 年龄系数”

`0048A030 GetPersonAttrChangeCoef` 已被命名为“取得武将属性成长系数”，`0048A390 GetPersonGrowthAttr` 则返回成长后属性。

日文 Wiki 用“素质=100”的新武将逐岁实测，证明盛衰按**百分比系数**决定；素质较低时也按比例缩放，峰值年龄/衰退开始年龄不因素质大小改变。

核心曲线：

- **早熟**：18岁达到峰值100%；短型36岁起按4/5年交替 -1个百分点，长型41岁起每8年 -1。
- **维持**：25岁到峰值；短型51岁起每10年 -1，长型峰值后不衰退。
- **普通**：30岁到峰值；短型46岁起按3/4年交替 -1，长型51岁起每6年 -1。
- **晚成（ID6）**：约40岁到峰值，之后不衰退。
- **超晚成（ID7）**：约50岁到峰值，之后不衰退。
- **开眼**：25岁先到第一次峰值，41～55岁再次成长，最多可成长到原素质约130%。

年龄6附近的系数锚点：

```text
维持 / 开眼 ≈ 90%
早熟         ≈ 88%
普通         ≈ 88%
晚成         ≈ 83%
```

完整 6～101 岁逐年表已经有稳定实测，fidelity 实现应优先做 **growthType × age lookup**，而不是自己拟一条平滑曲线。

仍需保留的 exactness gap：

- `GetPersonAttrChangeCoef` 完整函数体未公开；
- 对低素质乘百分比后的精确整数取整顺序没有逐指令确认；
- “晚成/超晚成”在极少数登场当年的特殊 +2 表现应按原逐年表处理，不自行简化。

### 3.5 五维经验：每100经验 +1，余数保留

`FiveBasicAttrExp` 是 `short[5]`，并有：

```text
00489180 GetPersonAttrExperience
0048A810 SetAttrExperience
004A70D0 IncreasePersonAttrExperience
```

长期实测支持每100经验提供1点成长；**raw字段是累计经验，不是每次成长就扣100的余数**。P0-47在绑定fingerprint的S1来源恢复writer/getter：

```ts
// 普通人员、关闭年龄/装备等修正的限定兼容profile
cumulativeExp = min(3000, cumulativeExp + gained)
growthStat = max(1, min(100, talent + floor(cumulativeExp / 100)))
uiProgress = cumulativeExp >= 3000 ? 100 : cumulativeExp % 100
```

例如累计99再得3，存储为102，经验贡献+1，UI余数2；不会把存储减回2。能力100不阻止继续攒经验，累计3000才截断；此时算术余数0而情报UI显示满100。旧“while exp>=100就exp-=100”只能描述余数概念，不能作为原字段写回模型，现已撤回。

**证据边界：** S1 IDB关联血色5.0路径，S2另一个MOD样本把cap改成0/120；因此新逐字结论只限S1来源，clean stock PK等价仍open。PK研究在S1也把实际提升×100写入同一XP字段，不能另算一份+30预算。详见[来源审计](82-training-lifecycle-source-profile.md)。

### 3.6 旧规则“只要没到100就能一直练”错误：培养总增量约 +30

旧文档只写：

```text
能力100之后不再涨
```

这不完整，而且会让低能力武将无限刷高。

PK长期实测明确：

```text
普通经验 + 能力研究
相对初始素质的培养增量合计上限 ≈ +30
```

而且：

```text
经验单独也可以把这 +30 全部吃满
```

刘禅是最直观回归锚点：统率素质3，通过普通培养最多约到33，而不是最终刷到100。

因此至少需要：

```ts
earnedTrainingIncrease <= 30
```

同时还有绝对能力值约100的普通成长封顶边界；二者取先达到者。

PK能力研究本身一般最多贡献 +20；因为各“低/中/高”档位有70/80/95封顶，最后一次实际增长不足5时可利用边界做到约 +24，但研究+经验仍受约 +30 总培养额度。

### 3.7 遗迹提高的是“素质”，不是经验，因此不走 +30 培养额度

遗迹事件明确写：

```text
能力上升的不是经验，而是“素质”
即使该武将经验培养已达到 +30，仍可上升
```

每次对应能力素质 +1。

所以模型必须区分：

```text
raiseTalent(+1)     // 遗迹等
gainAttrExp(+N)     // 行动经验
trainAttr(+5)       // PK能力研究
```

不能全部调用同一个 `addStat()`。

### 3.8 兵科适性与适性经验也是两套字段

`struct_person`：

```text
+0xB0  UnitCategoryProficiency[6]
+0x134 UnitCategoryExp[6]   // byte[6]
```

六类固定为：

```text
枪 / 戟 / 弩 / 骑 / 兵器 / 水军
```

相关函数：

```text
00488D40 GetPersonUnitCategoryProficiencyLevel
00488D60 GetPersonDispositionExperience
004A6DB0 IncreasePersonSkillExperience
```

实测阈值：

```text
C -> B : 150
B -> A : 200
A -> S : 250
```

适性没有五维那种“+30培养上限”：只要持续获得对应兵科经验，C武将最终也可以练到S。

### 3.9 自然升适性与能力研究升适性的经验处理不同

日文 Wiki 给出了非常强的边界例：

```text
弩兵 B
当前适性经验 192
→ 用 PK 能力研究直接升为 A
→ 原192经验仍保留
→ 距离 S 的250只剩58
```

因此：

```text
PK研究升适性
!= 清空 UnitCategoryExp
```

反过来，自然靠经验跨档后资料明确提醒“要重新积累”；即自然 C→B、B→A 后进入下一档时，上一档进度不会作为整条累计600经验直接继续使用。

当前仍没有原 `IncreasePersonSkillExperience` 函数体来锁定**跨阈值那一次的超额余数**究竟清零还是扣除阈值后保留，所以该一格继续标 exactness gap。

### 3.10 指导：只给“出阵中的同部队经验”×2

长期实测：

```text
同一野外部队中有“指导”持有者
→ 其他武将获得的出阵经验 ×2
```

包括战斗行为和部队在外时触发的经验事件。

但：

- 据点命令不翻倍；巡查、训练、生产等即使和指导武将一起执行也不翻倍；
- 指导持有者本人通常不享受自己的×2；
- 同一部队若有两名或以上指导持有者，则指导武将也能从另一名指导获得×2；
- 同名效果不进一步变成×4。

这条同时作用五维经验和对应兵科适性经验。

### 3.11 基础值 / 年龄值 / 当前值不要混用

当前建议接口：

```ts
type PersonAbility = {
  talent: number;          // 素质/基础源值
  growthType: number;      // 0..8
  attrExp: number;
  trainingIncrease: number;
}

function getGrowthAttr(person, attr, age): number
function getBasicDisplayedAttr(person, attr): number
function getActualAttr(person, attr, health): number
```

使用哪一层必须由具体原函数决定。例如 D2 已确认伤病读取的是受伤病影响的 actual/display 层；而某些公式明确读“基础魅力/基础政治”时不能拿受伤后的值替换。

目前对所有系统做统一“永远用界面显示值”或“永远用素质”都不符合原结构。

### 3.12 D3 当前结论

已经锁定：

- 五维各有独立基础值、成长类型、经验；
- 成长类型是每个能力分别保存，不是每武将一个总类型；
- 九种成长类型 ID 0～8 已锁定；
- `AttrChange` 只控制年龄盛衰，关闭后经验培养仍有效；
- 年龄盛衰按素质百分比系数，完整逐年表可用于 lookup；
- 原程序存在 `GetPersonAttrChangeCoef / GetPersonGrowthAttr`；
- 五维经验每100点 +1，超额余数保留；
- 旧“没到100即可无限经验成长”撤回，普通经验/PK研究培养总增量约 +30；
- PK研究自身通常约 +20、边界最高约 +24，但与经验共享 +30培养额度；
- 遗迹直接 +1 素质，不走普通经验 +30额度；
- 六适性拥有独立 level 与 byte exp；C→B 150、B→A 200、A→S 250；
- PK研究提升适性不会清已有适性经验；
- 指导仅对出阵同部队经验×2，据点命令不吃。

仍 open：

- `0048A030 GetPersonAttrChangeCoef` 的完整年龄语义及与已恢复S1 `0048A390` getter的clean-stock等价性；
- 年龄百分比应用到低素质时的精确整数取整；
- 年龄盛衰、培养增量、官职/宝物、伤病的最终逐指令合成顺序；
- 自然适性升档时超出阈值的余数处理；
- Vanilla 与 PK 的 +30 培养上限是否存在细小版本差异。

来源：
- 311SireCustomizedPackageDev：`struct_person` 五维/成长型/经验/适性字段及 00488D40～0048A390 系列函数
  https://github.com/sean2077/311SireCustomizedPackageDev
- 日文 Wiki《各種経験値》：五维100经验+1、余数保留、适性150/200/250、指导×2、研究升适性保留经验
  https://w.atwiki.jp/sangokushi11/pages/79.html
- 日文 Wiki《素質盛衰表》：6～101岁完整 growthType×age 百分比表
  https://w.atwiki.jp/sangokushi11/pages/1787.html
- PTT《三國志11成長類型》：九种中文成长型与峰值/衰退语义交叉核对
  https://www.ptt.cc/bbs/Koei/M.1425532487.A.9C8.html
- 日文 Wiki《能力研究》：研究+经验总培养上限约+30、研究单项上限
  https://w.atwiki.jp/sangokushi11/pages/46.html
- 日文 Wiki Q&A：经验单独也可吃满+30
  https://w.atwiki.jp/sangokushi11/pages/2527.html
- 日文 Wiki 刘禅/育成实录：素质3统率最终约33的直接回归锚点
  https://w.atwiki.jp/sangokushi11/pages/834.html
  https://w.atwiki.jp/sangokushi11/pages/2796.html
- 日文 Wiki 遗迹/庙：遗迹增加的是素质而非经验，可绕过经验+30培养限制
  https://w.atwiki.jp/sangokushi11/pages/968.html
- 2ch旧实测：能力变动关闭只停止年龄升降，不停止经验成长
  https://w.atwiki.jp/sangokushi11/pages/1978.html

## 4. 人际关系

`[PC-PK1.1][reverse-engineered relation structure + reverse-engineered support parameters + empirical-high relation behavior]`

人际关系不是一个统一“好感分”。原 `struct_person` 同时保存亲爱/厌恶列表、血缘树、配偶、义兄弟和相性；不同系统读取不同关系 predicate。

### 4.1 底层关系字段

`struct_person`：

```text
+0x54 BloodRelation
+0x58 FatherID
+0x5C MotherID
+0x60 SpouseID
+0x64 SwornSiblingID
+0x68 Generation
+0x69 Compatibility     // SIRE字段名Personality，注释为相性
+0x6C IntimatePersonsID[5]
+0x80 HatedPersonsID[5]
```

对应原 helper：

```text
00488790 IsSpouse
004887D0 IsSwornBrother
00488890 GetFriendlyPersonID
004888B0 GetNumberOfFriendlyPersons
00488910 IsFriendlyWith
00488950 GetDislikePersonID
00488970 GetNumberOfDislikePersons
004889E0 IsPerson1HatesPerson2

0048BB70 IsBloodRelation
0048BC10 IsAConsort
0048BCA0 IsParent
0048BD80 IsChild
0048BDF0 IsAChildOrParent
0048C040 IsBrother
```

因此实现应有独立 relation service，而不是只存：

```ts
relationScore[A][B] = number
```

### 4.2 亲爱 / 厌恶是有方向的

`IntimatePersonsID[5] / HatedPersonsID[5]` 属于**武将A自己的列表**。

所以：

```ts
likes(A, B) !== likes(B, A)
hates(A, B) !== hates(B, A)
```

除非数据两边都明确设置。

支援攻击给出了最直接的方向性实测：只有**支援方主将亲爱攻击方主将**时，亲爱支援才成立；攻击方单方面亲爱支援方不成立。

这也意味着登用必须写成“目标是否亲爱执行君主/执行者”，不能用无方向的 `areFriends(a,b)`。

### 4.3 配偶 / 义兄弟 / 血缘不是亲爱列表的别名

配偶、义兄弟、血缘均有独立字段和 helper。即使两名武将没有彼此写进 `IntimatePersonsID`，这些关系仍会独立参与：

- 副将能力补正；
- 支援攻击；
- 登用硬分支；
- 单挑援助等关系判定。

因此不要为了简化把：

```text
配偶 = 自动互相亲爱
义兄弟 = 自动互相亲爱
血缘 = 自动互相亲爱
```

写回数据层。

`0048A5F0 GetRelationWithLord` 还直接把与君主关系分类为父母、兄弟、儿子、女儿、其他血亲、配偶、义兄弟、无关系，进一步证明这些关系是独立离散分支。

### 4.4 支援攻击：PC-PK1.1 参数已经逆出

`[PC-PK1.1][reverse-engineered-parameters]`

游侠 2008 对繁中 PK1.1 的内存定位：

```text
00585555 辅佐(26)；只有主将之间关系影响支援攻击
0058557B 辅佐 / 亲爱：30
0058559B 血缘：20
005855A8 义兄弟 / 夫妇：50
```

所以关系分支的原参数为：

| 支援方主将与攻击方主将 | PC-PK1.1 参数 |
|---|---:|
| 配偶 / 义兄弟 | 50% |
| 亲爱 | 30% |
| 特技「辅佐」 | 30% |
| 血缘 | 20% |

PS2PK 大样本实测约得到亲爱31%、辅佐28.8%、义兄弟约45%、血缘约20%，与 PC-PK 参数方向一致。

关系条件还包括：

- **只看双方主将**，副将关系不触发支援；
- 亲爱必须是 `likes(supporterMain, attackerMain)`；
- 血缘实测包括父子与兄弟；
- 支援部队必须在对目标可普通攻击的范围内；
- 兵器部队不能支援；
- 连战已经发动时不再触发支援；
- 辅佐主将若嫌恶攻击方主将，则不触发辅佐支援。

支援伤害/防御技巧等属于战斗层，D4 只负责关系资格与概率参数。

### 4.5 副将能力补正：旧规则漏了“血缘 = 1/3”

`[PS2][empirical-exact; PC-PK function body still open]`

现有独立实测对统率/武力给出：若副将该能力高于主将，副将贡献主副差值的一部分。

```ts
candidate = mainStat + floor((subStat - mainStat) / divisor)
```

关系 divisor：

| 副将→主将关系 | divisor | 差值贡献 |
|---|---:|---:|
| 配偶 / 义兄弟 | 1 | 100% |
| 亲爱 | 2 | 1/2 |
| 血缘 | 3 | 1/3 |
| 普通 | 4 | 1/4 |

若副将能力不高于主将，则该项不会把主将能力拉低。两名副将都可提供候选值，取较高结果。

旧仓库此前写成：

```text
夫妻/义兄弟=1；亲爱=2；其他=4
```

把血缘错误并入普通。本轮已改成独立 `/3`。

注意：这套 1/2、1/3、1/4 的精确测值来自 PS2 实测；PC-PK1.1 当前只恢复了关系 helper 与支援概率参数，尚未公开副将补正函数体，因此跨版本仍标 `empirical-high`，不冒充 PC 逐指令确认。

### 4.6 嫌恶的优先级高于任何正面副将关系

长期实测：同一部队三人中**任意一对存在嫌恶关系**（包括两个副将互相嫌恶），则：

```text
所有副将能力补正 = 0
```

不是只忽略那一个嫌恶武将。

即使另一名副将是主将的配偶或义兄弟，也同样全部失效。

同一嫌恶覆盖还会让相关武将在单挑时不来援助。

所以正确顺序应先检查：

```ts
if (anyHatePairInTroop) disableAllDeputyRelationBonus()
```

再去计算配偶/义兄弟/亲爱/血缘/普通 divisor。

### 4.7 登用里关系是硬分支，不是分数加成

D5 会继续核完整登用优先级；D4 先锁定关系语义：

- 目标亲爱执行君主：该君主存在强制成功关系，并通常阻止其他君主普通登用；配偶/义兄弟是重要例外；
- 目标亲爱执行武将：当目标为在野/亡国俘虏，或满足特定低忠诚+义理门槛时，可以越过普通军师失败判断；
- 目标嫌恶执行君主：普通登用直接失败；
- 配偶/义兄弟可以覆盖部分嫌恶/忠诚普通分支。

这些都应发生在连续成功率计算**之前**。

禁止实现成：

```text
亲爱 +20%
嫌恶 -30%
配偶 +40%
```

这种统一打分模型。

完整先后顺序留给 D5。

### 4.8 嫌恶还影响 COM 处斩与君主外交

旧总规则写过“处斩俘虏没有厌恶或报复”，这句话需要拆成两件事：

1. **处斩不会自动新生成嫌恶关系**：例如处断配偶会解除配偶关系，但没有“因此新增嫌恶”的通用惩罚；
2. **已有嫌恶会影响 COM 的处置**：COM 君主嫌恶俘虏，或俘虏嫌恶该 COM 君主，长期实测会走必处斩分支。

所以不能写成“嫌恶与处斩无关”。

外交侧也有稳定行为：若某君主嫌恶另一君主，则双方友好极难上升；无「论客」时通常无法结盟，但停战仍可。

这部分的连续外交公式/版本边界继续由外交专项负责。

### 4.9 关系可以在运行中改变，不能只当静态人物表

游戏内“仲介”可以建立结婚/结义关系；旧实测还确认出征中的武将也可通过仲介结婚或结义。

因此：

```text
Spouse / SwornSibling
```

属于 Runtime Scenario State，而不只是 Scenario.s11 的初始静态资料。

结义最多三人这一组关系的内部表达应通过 `IsSwornBrother()` 查询，不要假定裸 `SwornSiblingID` 只能表示一对一。

### 4.10 推荐关系服务

```ts
relation.likes(a, b)
relation.hates(a, b)
relation.isSpouse(a, b)
relation.isSwornSibling(a, b)
relation.isBloodRelative(a, b)
relation.isParent(a, b)
relation.isChild(a, b)
relation.isSibling(a, b)
relation.relationToLord(person, lord)
```

各系统调用 predicate，不把关系压缩成一个标量。

### 4.11 D4 当前结论

已经锁定：

- 亲爱/厌恶各最多5个显式槽位，且是有方向关系；
- 配偶/义兄弟/血缘有独立字段与 helper，不等价于亲爱；
- PC-PK1.1 支援参数：配偶/义兄弟50、亲爱30、辅佐30、血缘20；只看主将；
- 亲爱支援方向为“支援主将亲爱攻击主将”；
- 副将关系补正应区分：配偶/义兄弟100%、亲爱1/2、血缘1/3、普通1/4；
- 任意嫌恶 pair 会让整队全部副将能力补正归零；
- 亲爱/嫌恶/配偶/义兄弟在登用里是概率前硬分支，不是统一百分比加减；
- 已有嫌恶影响 COM 处斩与君主外交，但执行处斩本身不会自动创建新嫌恶；
- 婚姻/结义可在运行中建立，必须进入 Runtime State。

仍 open：

- PC-PK1.1 副将 1/2、1/3、1/4 补正的完整函数体与所有取整边界；
- 亲爱导致会心率提高的精确数值；
- 血缘支援在更远亲属上的完整边界（当前明确父子/兄弟）；
- Vanilla PC 与 PK1.1 支援概率是否完全一致；
- 登用关系分支的完整先后顺序（D5继续）；
- 外交嫌恶修正的连续公式。

来源：
- 311SireCustomizedPackageDev `struct_person` 与 Person relation helpers
  https://github.com/sean2077/311SireCustomizedPackageDev
- 游侠 PC-PK1.1 内存研究：支援攻击关系参数 50/30/20，只有主将关系生效
  https://game.ali213.net/thread-2168294-1-1.html
- 日文 Wiki《支援攻击》：方向性、主将条件、PS2PK大样本概率及攻击范围边界
  https://w.atwiki.jp/sangokushi11/pages/1584.html
- 日文 Wiki《検証》：副将亲爱/血缘/普通 1/2、1/3、1/4 实测
  https://w.atwiki.jp/sangokushi11/pages/30.html
- 日文 Wiki《亲爱・嫌恶》：副将嫌恶覆盖、登用/处斩/外交关系语义
  https://w.atwiki.jp/sangokushi11/pages/95.html
- 日文 Wiki《内政》：登用关系优先级与“处斩不自动新增嫌恶”
  https://w.atwiki.jp/sangokushi11/pages/74.html
- 日文 Wiki《小ネタ》：出征武将仍可仲介结婚/结义
  https://w.atwiki.jp/sangokushi11/pages/15.html

## 5. 登用优先级与普通概率

> P0-1 exactness 专项：`36-hiring-probability-exactness.md`。该专项进一步锁定 `004AFD60` 外层、普通/非0模式分流、`005BA4C0` 七个入参与现代 SIRE 新忠诚系统的 MOD-only 边界；`005C4F80` 本体仍 open。

`[PC-PK1.1][reverse-engineered control flow + deterministic final check + empirical-high forced-branch order]`

D5 最重要的结论是：原作登用不是一个“把所有因素加成一个分数，再 Math.random()”的系统。

实际至少分成三层：

```text
第一层：004AF7D0 必成功 / 必失败关系门槛
第二层：005C4F80 GetHiringSuccessRate -> 0..100 连续成功率
第三层：正常登用用 005BA4C0 生成确定性比较值，再与成功率比较
```

只有第一层既不必成也不必败，才进入第二层。

### 5.1 反汇编已经锁定的总控制流

`004AFD60` 是普通登用的核心“是否成功”函数。

逐指令流程：

```text
校验目标 / 执行者 / 执行势力君主
↓
004AF7D0
  → 若命中硬分支，直接返回成功或失败
↓
005C4F80 GetHiringSuccessRate
  → 返回整数型概率 p
↓
根据调用模式做最终判定
```

SIRE 地址表也独立将：

```text
005C4F80 = GetHiringSuccessRate
```

并注明其内部还会调用 `005BA410`。

当前公开文本仍没有展开 `005C4F80` 完整函数体，所以**连续概率闭式依然 open**；但函数外层和最终判定已经远比旧“评分公式”精确。

### 5.2 硬分支优先级

`[COMMON][empirical-high order; PC-PK confirms hard-branch function executes first]`

日文 Wiki / 旧实测长期一致的优先顺序为：

1. **目标配偶属于第三方势力，且目标原势力仍有支配都市** → 失败。
2. **目标配偶就是执行者，或执行势力君主** → 成功。
3. **目标嫌恶执行者，或嫌恶执行势力君主** → 失败。
4. **执行者或执行君主是目标的义兄弟** → 成功。
5. **目标忠诚 + 义理 > 96** → 普通登用失败。
6. **目标义兄弟的长兄在执行势力** → 成功。
7. **目标配偶在执行势力** → 成功。
8. **目标亲爱当前君主** → 失败。
9. **目标同时亲爱执行君主与执行者** → 成功。

另外 `004AF7D0` 的调用注释和关系实测都确认还会处理：

- 禁止仕官期；
- 逃亡 / 下野 / 未发现登用失败后的禁止再登用状态；
- 配偶 / 义兄弟 / 亲爱 / 嫌恶的强制覆盖。

因此上述关系不能写成：

```text
亲爱 +20%
嫌恶 -30%
夫妻 +40%
```

而必须先跑硬门槛。

### 5.3 “忠诚 + 义理 > 96”边界不要过度源码化

这条 96 门槛来自长期稳定实测和 Wiki 的优先级表；当前公开资料虽然确认 `004AF7D0` 会处理义理/忠诚类硬条件，但**没有展开该函数体逐指令验证 96 与内部义理编码的换算**。

因此当前状态应是：

```text
门槛行为：empirical-high
004AF7D0 在概率前执行：reverse-engineered
内部五档义理值如何映射到 96：exactness gap
```

不要把 Wiki 的 1～5 显示档位和内存 `Ideals` 编码在没有函数体时强行当成同一个整数。

### 5.4 普通人才→登用：不是运行时随机，而是确定性比较

`[PC-PK1.1][reverse-engineered]`

正常“人才→登用”调用 `004AFD60` 时：

```text
第三参数 = 0
第四参数 = dateKey
```

其中：

```ts
dateKey = day * 7 + month * 5 + year * 3
```

硬分支未命中后，先得到：

```ts
p = GetHiringSuccessRate(target, executor, 0, dateKey)
```

然后程序读取：

- 目标武将 ID；
- 执行武将 ID；
- 目标忠诚；
- 执行武将魅力；
- 执行者与目标的相性差；
- `dateKey`；

送入 `005BA4C0`，最终：

```ts
success = deterministicValue < p
```

汇编是：

```text
cmp eax, ecx
setl dl
```

其中 `eax = deterministicValue`、`ecx = p`。

所以当前代码注释里若出现“值大于成功率则成功”，那只是旧注释笔误；**机器码本身明确是 `< p` 成功**。

### 5.5 同状态 S/L 为什么通常不改变结果

因为普通登用不是每次调用全局随机：

```text
同日期
+ 同目标
+ 同执行者
+ 同忠诚
+ 同魅力
+ 同相性差
```

会送入同一确定性生成器。

因此：

```text
同一状态反复读档重试
→ 结果应保持相同
```

而下面任一变化都可能改变结果：

- 换日期；
- 换执行者；
- 目标忠诚变化；
- 执行者魅力变化；
- 双方相性差变化。

注意：`dateKey` 同时也作为第四参数传给 `005C4F80`，所以日期理论上既可能改变成功率 `p`，也会改变最终确定性比较值；在函数体恢复前不能假定日期只影响“roll”。

### 5.6 异地登用锁定的是“发令日” dateKey

`[PC-PK1.1][reverse-engineered]`

若目标与执行城市不在同一城市区域，执行者不会当场判定，而是建立任务：

```text
Mission = 0x0C  // 登用
MissionParameter[2] = 发令时 dateKey
```

任务完成函数 `005C5300...` 再读取这个第三个任务参数，并调用：

```ts
004AFD60(target, executor, 0, savedDateKey)
```

所以：

```text
走了20/30/...天以后才到达目标
≠ 用抵达日重新掷一次
```

而是保留发令时的日期键。

这也是模拟器任务系统必须保存 `dateKey` 的理由。

### 5.7 第三参数非0的路径是另一种判定模式

`[PC-PK1.1][reverse-engineered]`

`004AFD60` 在第三参数不为0时，会在 `005C4F80` 结果外再施加一个义理倍率：

```ts
factor10 = min(10, 15 - 2 * idealsInternal)
p2 = min(100, floor(p * factor10 / 10))
```

若内部义理编码按当前常见 0..4 解释，则倍率为：

```text
0 -> 1.0
1 -> 1.0
2 -> 1.0
3 -> 0.9
4 -> 0.7
```

随后这条路径不是 `005BA4C0` deterministic compare，而是调用：

```text
004721D0 0～100随机函数
```

也就是说：

```text
第三参数 = 0
→ 正常登用的 deterministic check

第三参数 != 0
→ 额外义理倍率 + 真随机/运行时随机判定
```

当前公开调用点里正常玩家人才→登用和异地登用都明确传0；其他非0 caller 的完整业务语义尚未全部命名，所以**绝不能把这条 0.9/0.7 外层倍率套到普通玩家登用**。

### 5.8 探索发现人才后的“当场登用”是独立流程

`[PC-PK1.1][reverse-engineered]`

`005D5220`“探索发现人才并登用”没有直接复用普通人才命令的完整最终判定。

它先调用 `005C51C0` 取得成功率：

```text
004AF7D0 硬分支
→ 必成返回100 / 必败返回0
→ 否则 005C4F80
```

然后自己计算当前：

```ts
dateKey = day * 7 + month * 5 + year * 3
```

再调用 `005BA4C0` 做 deterministic compare。

因此“探索后当场登用”仍然具有同状态确定性，但调用结构与普通人才命令并不完全相同。

### 5.9 探索登用失败后可能进入舌战

更重要的是，探索当场登用第一次判定失败后，并不是总直接失败。

源码继续计算：

```ts
debateScore =
  executorCharm
  - compatibilityDifference(executor, executorLord)
  + hiringSuccessRate
```

然后：

```ts
if (debateScore > 80) {
  enterDebate()
} else {
  failHire()
}
```

原注释里 `cmp eax, 0x50` 已直接给出阈值 80。

玩家第一军团进入实际舌战；非玩家分支走 AI 舌战结果计算。

所以不能把：

```text
探索发现人才后的当场登用
```

和：

```text
人才菜单普通登用
```

当成完全同一条失败处理。

### 5.10 军师“推荐成功/失败”不能替代真实硬分支

`004AFD60` 同时被军师推荐路径调用；而亲爱等硬关系实测已经证明：

```text
军师显示 ×
但若目标亲爱执行者并满足可覆盖条件
→ 实际仍可必成功
```

因此军师建议是 UI/预测层，不能成为最终规则源。

引擎应始终让：

```text
hardHiringGate()
→ GetHiringSuccessRate()
→ finalHiringCheck()
```

决定真实结果。

### 5.11 成功/失败的执行副作用也有路径差异

普通人才命令本地登用：

```text
成功：功绩 +200，魅力经验 +5
失败：功绩 +10，魅力经验 +1
```

探索发现人才后的当场登用走 `005D3C90`：

```text
成功：功绩 +200，政治经验 +3，魅力经验 +5
失败：功绩 +100，政治经验 +3
```

这说明两个 UI 上都叫“登用”的路径不能粗暴只保留一个 reward table。

### 5.12 旧自拟“登用分数公式”正式撤回

旧总规则曾保留：

```text
(100-忠诚)*2
+ (100-义理*20)
+ (75-相性差)
+ floor(魅力*0.5)
```

并用“分数>0即可能成功”闭环。

这组公式没有原作函数体支持，且与已经恢复的：

```text
硬分支
+ GetHiringSuccessRate
+ deterministicValue
```

结构不一致。

本轮从总规则正式移除。

### 5.13 当前唯一核心 exactness gap

真正影响普通概率 fidelity 的核心缺口已经收缩到：

```text
005C4F80 GetHiringSuccessRate
```

完整函数体。

目前可以确认：

- 返回整数 0..100；
- 参数包含目标/执行者指针、调用模式参数和第四整数参数；
- 内部调用 `005BA410`；
- 外层硬关系与最终判定已经恢复；
- 相性、忠诚、魅力等至少会影响最终普通登用链；
- 不能据此反推出网上任何线性评分闭式。

因此现有 `16-unresolved-rules-fallbacks.md#2` 只允许替换**第二层成功率函数**，不得重新替换第一层硬分支和第三层 deterministic check。

### 5.14 D5 当前结论

已经锁定：

- 硬关系/禁仕 gate 一定先于连续概率；
- 9条长期稳定关系门槛及其顺序保留为 empirical-high；
- 普通人才登用第三参数=0；
- `dateKey = day*7 + month*5 + year*3`；
- 普通最终判定 `deterministicValue < p`；
- 异地登用保存发令日 dateKey，到达时复用；
- 第三参数非0路径存在 `min(10,15-2*义理)` 外层倍率，并改用运行时随机；不能套给普通玩家登用；
- 探索发现人才后的当场登用走独立 wrapper；
- 探索首次登用失败后，`魅力 - 与本君主相性差 + p > 80` 可进入舌战；
- 普通登用与探索登用的功绩/能力经验奖励不同；
- 军师建议不能覆盖真正硬关系规则；
- 旧自拟连续“登用分数”撤回。

仍 open：

- `004AF7D0` 完整函数体，用来逐指令确认9条 empirical 顺序和禁止仕官细节；
- `005C4F80 GetHiringSuccessRate` 完整闭式；
- `005BA410 / 005BA4C0` 的完整确定性生成算法；
- 96门槛使用的义理显示档位与内部编码精确映射；
- 第三参数非0的所有原版 caller 业务语义；
- Vanilla EXE 与 PC-PK1.1 是否完全同链。

来源：
- 311MemoryResearch `Func-人才01-计算登用是否成功.txt`：004AFD60、硬gate→005C4F80→两类最终判定
  https://github.com/sjn4048/311MemoryResearch
- 311MemoryResearch `Func-人才03-执行登用.txt`：本地/异地、dateKey保存、普通奖励
  https://github.com/sjn4048/311MemoryResearch
- 311MemoryResearch `Func-人才04-执行登用完成.txt`：异地抵达后读取任务中的发令日dateKey
  https://github.com/sjn4048/311MemoryResearch
- 311MemoryResearch `Func-人才08-探索发现人才并登用.txt`：探索wrapper、deterministic compare及失败后舌战阈值
  https://github.com/sjn4048/311MemoryResearch
- 311SireCustomizedPackageDev：`005C4F80 GetHiringSuccessRate`、`005DB0E0 GetRecruitingActionPointCost`
  https://github.com/sean2077/311SireCustomizedPackageDev
- 日文 Wiki 内政：9条登用优先级
  https://w.atwiki.jp/sangokushi11/pages/74.html
- 日文 Wiki 亲爱/嫌恶：亲爱覆盖军师×、嫌恶/配偶/义兄弟边界
  https://w.atwiki.jp/sangokushi11/pages/95.html
- 2006 Vanilla 100忠诚挖人实测：忠诚/亲爱/婚姻/义兄弟核心行为
  https://www.gamersky.com/handbook/200603/21923.shtml

## 6. 相性、义理、野望、汉室

`[PC-PK1.1][reverse-engineered compatibility + reverse-engineered loyalty storage/display + empirical-high loyalty behavior + documented Han-event constants]`

这四项不是一个统一“忠诚性格分”。底层分别有独立字段，并在不同系统中读取。

### 6.1 底层字段

`struct_person`：

```text
+0x69 Compatibility        // SIRE旧字段名 Personality，实际注释为“相性”
+0xAC Loyalty              // byte，真实值
+0xF0 Ideals               // 义理
+0xF4 Ambition             // 野望
+0x108 HanDynastyAttention // 汉室重视
```

相性还存在原函数：

```text
00489F80 GetCompatibilityDifference
```

忠诚相关 helper：

```text
0048A770 SetLoyalty        // 0..255
004A6CF0 ModifyPersonLoyalty
```

因此“相性/义理/野望/汉室”必须作为独立 mask data 保存。

### 6.2 相性是 150 点环，不是普通绝对差

`[PC-PK1.1][confirmed-by-disassembly]`

`00489F80` 函数体已经公开到逐指令。核心：

```ts
raw = abs(a.compatibility - b.compatibility)
compatibilityDiff = min(raw, 150 - raw)
```

正常原作人物的相性处在 150 点环上，因此最大有效差值为75。

例：

```text
1 vs 149 -> raw 148 -> diff 2
25 vs 100 -> diff 75
25 vs 26  -> diff 1
```

所以任何：

```ts
Math.abs(a.compatibility - b.compatibility)
```

直接当最终相性差的实现都是错的。

该函数对非法/超出原作正常范围的 MOD 数值没有做现代意义上的 normalize；fidelity 数据应优先约束在原作相性域，而不是把 255 等编辑值解释成新的圆环。

### 6.3 相性的已确认作用域

已知至少进入：

- D5 普通登用及最终 deterministic check；
- 探索发现人才后失败转舌战条件；
- 换季自然忠诚下降候选；
- 多项外交/人事判断。

日文资料明确：相性越接近越容易登用；任官后相性离君主过远，则更容易发生自然忠诚下降。

相性本身**不是亲爱/厌恶**。D4 已确认亲爱/厌恶有独立方向性列表。

### 6.4 义理：五档，既影响“掉忠”也影响“涨忠”

`[COMMON][empirical-high + reverse-engineered-field]`

界面按五档显示：

```text
1/5 ... 5/5
```

原结构保存 `Ideals` 整数。D5 的第三参数非0路径直接拿该内部值进入：

```ts
15 - 2 * idealsInternal
```

因此原代码确实把义理作为离散整数参与运算。

长期实测语义：

- 义理高：忠诚较难下降，也较难上涨；较难背叛；
- 义理低：忠诚更容易下降，也更容易通过褒赏等上涨；更容易背叛。

注意这不是“义理越高一律越好”的线性 loyalty bonus；它同时降低忠诚的**向下和向上变化敏感度**。

当前显示1～5与内部0～4的逐项 UI 映射虽高度一致，但尚未找到专门的枚举 getter 函数体，因此需要内部数值时仍以原字段/函数调用为准。

### 6.5 野望：五档，是独立倾向，不是义理反义词

`[COMMON][empirical-high + reverse-engineered-field]`

`Ambition` 与 `Ideals` 分开保存。界面同样五档。

长期实测：

```text
野望越高
→ 越容易走独立/叛乱方向
```

官方说明书对“驱虎吞狼”也明确把“野心高 + 忠诚低”的太守描述为更容易独立。

因此：

- 高义理、高野望可以同时存在；
- 低义理、低野望也可以同时存在；
- 不要用 `ambition = 4 - ideals` 之类派生关系。

自然独立、驱虎吞狼和 AI 独立的精确连续公式仍应分别由各自 caller 决定；D6 不凭“野望高”自行制造统一叛变概率。

### 6.6 真实忠诚是 byte 0..255，UI 只显示到100

`[PC-PK1.1][confirmed-by-disassembly]`

这是 D6 对长期模拟非常重要的一个边界。

`struct_person +0xAC Loyalty` 是 byte，`SetLoyalty` 明确允许：

```text
0..255
```

而人物列表的原 getter：

```asm
movzx esi, byte ptr [person+0xAC]
cmp   esi, 100
jl    return_value
mov   esi, 100
```

所以：

```ts
trueLoyalty = person.loyaltyByte       // 0..255
displayLoyalty = min(trueLoyalty, 100)
```

这解释了为什么有些武将长时间显示100，即使季节/俘虏流程实际上已经连续扣过忠诚：例如真实值150降到147，界面仍然是100。

因此模拟器绝不能每次结算后强制：

```ts
loyalty = min(loyalty, 100)
```

那会破坏原作的隐藏忠诚缓冲。

### 6.7 己方武将的自然掉忠：换季，不是每月

`[COMMON][empirical-high timing/trigger]`

现役己方武将的自然忠诚下降在**季节转换**判定，也就是 1/4/7/10 月的季初。

稳定实测的下降候选条件是满足任一：

```text
A. 与君主相性差 >= 25

OR

B. 义理 = 低 / 较低
   AND
   野望 = 高 / 较高
```

下降幅度还受**君主自己的义理/野望**影响；吕布、董卓这种低义理高野望君主常见掉得更多。

所以旧规则：

```text
相性差 >30
+ 每月初判定
```

两处都需要纠正为：

```text
相性差 >=25
+ 换季判定
```

### 6.8 仁政 / 人心掌握：对己方与俘虏的边界不同

`[PC-PK1.1][confirmed-by-disassembly]`

`0058E510` 的完整逐指令文本已经可以恢复这一段，不再只依赖社区经验。

`仁政` 的处理：

```text
普通己方武将：
  同设施存在仁政 -> 跳过自然忠诚下降

俘虏：
  先判定“是否俘虏”
  是俘虏 -> 直接跳过仁政判定
```

所以仁政只保护同设施的己方武将，**不保护俘虏**。

`[PK] 人心掌握` 位于普通武将/俘虏共用的后段：

```text
Random(0..2)
>= 1 -> 本次不下降
== 0 -> 继续计算下降值
```

因此原版 PC-PK1.1 的免降概率是精确的：

```text
2/3
```

这条现在升级为 reverse-engineered confirmed，不再标 empirical。

### 6.9 己方换季掉忠与俘虏月度掉忠是同函数里的不同 schedule

`0058E510` 被月初 dispatcher `00590C30 MonthlyAction` 调用。

普通己方武将：

```text
不是季初 -> 跳过
季初 -> 再走相性/义理/野望 gate
```

俘虏：

```text
Identity=PRISONER
-> 跳过季初 gate
-> 跳过普通武将的相性/义理/野望候选 gate
-> 每个月都可以进入后续忠诚下降判定
```

所以正确周期是：

```text
己方普通武将：季初
俘虏：月初
```

不是旧稿的“己方每月 / 俘虏每旬”。

俘虏虽然跳过普通候选 gate，但仍保留一组关系豁免。对当前所属/看守势力君主，若满足任一项则本月不降：

- `00488910` 亲爱/亲善关系；
- 配偶；
- 义兄弟；
- 父母子女。

### 6.10 忠诚下降数值：主函数已恢复

`[PC-PK1.1][confirmed-by-disassembly]`

进入数值分支后：

```ts
loss = Random(0..2)

if (city.hasTokenPlatform) {
  loss += 2
}

if (
  captorLord.ideals === 0 &&
  captorLord.ambition === 4
) {
  loss += floor((4 - target.ideals) / 2)
}

loss += Random(0..2)
target.loyalty -= loss
```

其中两次 `Random(0..2)` 独立，因此没有额外项时基础下降量为：

| 基础损失 | 概率 |
|---:|---:|
| 0 | 1/9 |
| 1 | 2/9 |
| 2 | 3/9 |
| 3 | 2/9 |
| 4 | 1/9 |

注意：

- 符节台 `+2` 是进入掉忠数值分支后的附加值，不负责把原本不满足 gate 的普通武将“变成会掉忠”；
- 人心掌握在这段数值计算**之前**以 2/3 概率直接跳过；
- 俘虏不吃仁政，但仍吃人心掌握和上面的关系豁免；
- 欠薪、流言、事件等不是这条自然/月度忠诚路径，仍应分开建模。

### 6.11 汉室：三档，是事件/爵位分支，不是每旬忠诚倍率

`[COMMON][documented exact event constants]`

汉室态度：

```text
无视 / 普通 / 重视
```

日文 Wiki 已给出爵位“汉室授予”与“自行称号”时的精确忠诚变化：

| 汉室态度 | 汉室授予 | 自称 |
|---|---:|---:|
| 普通 | +3 | +3 |
| 重视 | +6 | +1 |
| 无视 | +1 | +6 |

若爵位是：

```text
王 / 公 -> 上述变化 ×2
皇帝   -> 上述变化 ×3
```

这里说的是**爵位取得这一事件的忠诚变化**，不是每旬被动加成。

### 6.12 拥立 / 废立汉帝

占领汉帝所在城市后进行选择时，对“汉室重视”的属下：

```text
拥立汉帝 -> 忠诚 +10
废立汉帝 -> 忠诚 -10
```

而“汉室无视”的 COM 君主占领汉帝所在地时，会选择废立汉帝。

特定历史事件还可以覆盖通用 ±10。例如“魏帝即位”事件明确：

```text
曹家势力汉室无视武将  +20
曹家势力汉室重视武将  -20
```

这再次说明汉室应由**事件规则读取 mask data**，不能压成一个统一 loyalty multiplier。

### 6.13 汉帝援助等事件继续读取汉室态度

“汉帝援助”要求玩家君主汉室重视；选择援助时，势力内汉室重视武将忠诚上升，不援助则下降。

该事件页面明确说明不同武将的变化幅度并不统一，因此不能从“汉室重视”直接推出一个通用 `±N`。

其他如遗迹/庙破坏、帝位/国号相关事件也会读取汉室态度。

### 6.14 D6 当前结论

已经锁定：

- 相性是150点环，精确 `min(abs(a-b),150-abs(a-b))`；
- 正常最大相性差75，1与149仅差2；
- 义理与野望是两个独立五档字段；
- 高义理=忠诚较难涨也较难掉、较难背叛；低义理相反；
- 高野望提高独立倾向，但不存在已恢复的统一“野望→叛变概率”公式；
- 真实忠诚存0..255，UI只显示 `min(value,100)`；
- 己方自然掉忠发生在换季，不是每月；
- 候选条件为相性差>=25，或低/较低义理+高/较高野望；
- 仁政阻止同都市己方普通武将自然掉忠，但俘虏明确跳过仁政；
- 人心掌握已由 `0058E510` 精确确认：`Random(0..2)>=1` 时跳过，即 2/3 免降；
- 俘虏跳过季初 gate，因此月初每月都可能判定掉忠，但亲爱/配偶/义兄弟/父母子女仍可豁免；
- 进入数值路径后为两个独立 `Random(0..2)` + 符节台 `+2` + 特定君主义理/野望附加；
- 君主义理最低且野望最高时，附加 `floor((4-targetIdeals)/2)`；
- 汉室是三档事件/爵位 mask data，爵位忠诚变化与拥立/废立的精确常量已核。

仍 open：

- 欠薪、流言、事件等非自然忠诚变化的各自精确函数；
- 野望参与驱虎吞狼/自然独立的精确连续函数；
- Vanilla 各补丁与 PK1.1 在 loyalty scheduler 上是否逐字一致。

来源：
- 311MemoryResearch / SIRE tutorial：`00489F80` 相性环形距离完整反汇编
  https://github.com/sjn4048/311MemoryResearch
- 311SireCustomizedPackageDev：相性/义理/野望/汉室/忠诚字段、`SetLoyalty(0..255)`
  https://github.com/sean2077/311SireCustomizedPackageDev
- 日文 Wiki mask data：相性、义理、野望、汉室语义与爵位/拥立常量
  https://w.atwiki.jp/sangokushi11/pages/983.html
- 日文 Wiki 小ネタ：季初忠诚下降的相性25与义理/野望门槛
  https://w.atwiki.jp/sangokushi11/pages/15.html
- 日文 Wiki 内政 / 仁政：同都市自然忠诚不下降
  https://w.atwiki.jp/sangokushi11/pages/74.html
  https://w.atwiki.jp/sangokushi11/pages/13.html
- 日文 Wiki 魏帝即位：汉室无视+20、汉室重视-20
  https://w.atwiki.jp/sangokushi11/pages/937.html
- 日文 Wiki 汉帝援助：汉室重视作为事件条件及忠诚变化
  https://w.atwiki.jp/sangokushi11/pages/958.html
- SIRE 参数说明：换季忠诚、人心掌握概率、符节台附加减忠均为独立参数
  https://www.xycq.org.cn/forum/viewthread.php?authoruid=374759&tid=209820
- 二次“代码研究”转载：忠诚损失三角分布/人心掌握2/3/符节台+2等候选，用于交叉验证而非主逆向证据
  https://wenku.baidu.com/view/ad1f1482561252d381eb6edb?bfetype=new

## 7. 太守 / 都督 / 军师

`[COMMON/PK][reverse-engineered role structure + official advisor rules + empirical-high automatic selection]`

这三个职位在数据层不是同一种东西：

```text
都督 = Person.Identity 1 + CorpsLeaderID
太守 = Person.Identity 2 + City/Port/Gate PrefectID
军师 = Force.AdvisorID
```

所以军师依然不是 Identity；同一个武将可以在数据层同时是太守/都督身份，并被势力 `AdvisorID` 引用为军师。

### 7.1 原结构：三个角色分别挂在 corps / city / force

SIRE 结构已经直接锁定：

```text
struct_force +0x08 AdvisorID
struct_corp  +0x0C CorpsLeaderID
struct_city  +0x34 PrefectID
```

港、关也有独立太守 getter：

```text
0047C310 GetCityPrefectID
00485160 GetPrefectIDForHarborOrPass
```

Person helper：

```text
00488C10 IsGovernor
00488C20 IsPrefect
00488C90 IsLordGovernorOrPrefect
00488CB0 IsLordOrGovernor
00488CF0 IsAdvisorOfForce
```

因此不要让“城市太守”“军团都督”“势力军师”共用一个 `person.role` 单值字段。

### 7.2 太守 / 都督在正常游戏里不能直接点名任命

`[COMMON][empirical-high UI/selection behavior]`

日文 FAQ 明确回答：

```text
太守和都督能不能自己选？
→ 不能。
```

两者会自动决定。玩家真正能直接操作的是**官职**、军团编成/委任等外围条件，因此可以间接影响谁成为太守/都督。

这与军师不同：军师有独立“军师”命令，可以直接任免。

### 7.3 自动选择：首先看可指挥兵数，其次统率

`[COMMON][empirical-high; original selector body open]`

日文 Wiki 的整理规则：

```text
都督 / 太守
→ 候选中可指挥兵数最大者优先
→ 同值时统率更高者优先
```

另外存在一个重要的“有官职者优先于完全无官职者”边界：最低文官即使不增加指挥兵数，也可能压过无官职者。

因此最安全的模拟接口不是只写：

```ts
maxBy(candidates, leadership)
```

而是把：

```text
身份资格
官职有无 / 官职带来的指挥兵数
统率
```

作为显式比较维度。

旧 2ch 进一步记录过：

```text
太守：君主 > 都督 > 一般
      然后指挥兵数 > 统率
```

以及“都督更偏官职顺序”的说法。它和后期 Wiki 的统一“指挥兵数→统率、且有官职者优先”表述存在细节差异，所以：

- `可指挥兵数优先、同值统率`：采用 empirical-high；
- `君主/都督身份在本城的太守优先`：采用 empirical-high；
- “都督具体比较官职等级还是只比较最终可指挥兵数”的深层 tie-break：继续 open。

### 7.4 玩家可通过官职间接控制太守 / 都督

官职会改变：

```text
可指挥兵数
能力补正
俸禄
```

而都督/太守自动选择又高度依赖可指挥兵数，所以玩家可以通过授官/撤官操纵自动结果。

这也是为什么 Wiki 建议：若不想某个低义理武将自动成为太守，可给目标武将预留能增加指挥兵数的官职。

因此：

```text
不能手动选太守
```

不等于：

```text
玩家完全无法影响太守人选
```

### 7.5 第一军团与委任军团的都督边界

C9 已经确认行动力按军团保存。

第一军团的 leader 语义由君主承担；委任军团则使用该军团 `CorpsLeaderID` / 都督。

所以行动力恢复中的：

```ts
leaderParam =
  firstCorps
    ? rulerParam
    : governorParam
```

其中都督/君主都只取：

```ts
max(leadership, charisma)
```

进入 C9 的行动力 leader 参数。

都督不是全势力共用：每个委任军团有自己的 `CorpsLeaderID`。

### 7.6 军师可以直接任命，智力至少70

`[COMMON/PK][official-confirmed]`

官方说明书对“军师”命令明确：

```text
作用：任命在执行命令时提供助言的军师
资格：智力 >= 70
智力越高，助言越准确
期间：无
必要金：无
行动力：无
执行武将：无
```

也就是说，军师任免是**即时、无AP、无金钱消耗**的势力级设置。

注意：智力70是**任命资格门槛**，不是“70以上助言就可靠”的保证。Wiki 对70智军师的长期评价恰恰是助言仍经常出错。

### 7.7 军师是势力级，一个军师服务所有军团

`struct_force` 只有一个：

```text
AdvisorID
```

而 `struct_corp` 没有自己的 advisor 字段。

所以：

- 一个势力同一时刻只有一个军师；
- 第一军团和所有委任军团共享同一军师；
- 军师被任命后不会把原本的 `Identity=NORMAL/PREFECT/GOVERNOR` 改成新的身份。

这也是 C9 为什么所有军团都共享同一 `adviserParam`。

### 7.8 军师对行动力的精确作用

C9 已锁定：

```ts
adviserParam =
  advisor
    ? 0.70 + 0.01 * floor(advisorIntelligence / 2)
    : 1.0
```

正常任命门槛 `INT >= 70` 下：

| 军师智力 | AP倍率 |
|---:|---:|
| 70 | 1.05 |
| 80 | 1.10 |
| 90 | 1.15 |
| 100 | 1.20 |

然后：

```ts
coreRecovery = floor(
  (leaderParam + cityParam + officerParam)
  * adviserParam
)
```

所以军师不仅影响 UI 助言准确度，还真实影响每个军团每旬行动力恢复。

### 7.9 军师助言不是最终判定规则

D5 已经给出一个重要反例：登用最终成功由：

```text
hard gate
→ GetHiringSuccessRate
→ final check
```

决定。

亲爱/配偶/义兄弟等硬关系可以出现：

```text
军师预测失败
但真实规则必成功
```

因此引擎绝不能实现：

```ts
success = advisorSaysYes
```

军师助言只能视为对真实结果的**预测/UI信息层**。

官方只确认“智力越高越准确”；当前没有恢复：

```text
INT -> 助言正确率
```

的完整原 EXE 闭式。不要用 `accuracy=INT%` 等线性式冒充。

### 7.10 太守的能力真实影响哪些系统

太守不是单纯 UI 头衔。已经锁定至少四组作用。

#### A. 换季治安：魅力

C10 的 PC-PK1.1 逆向：

```ts
C = prefect ? prefect.charisma : 0
base = floor(max(1, 90 - C) / 10)
seasonalOrderLoss = min(5, base + Random(0..2))
```

无太守按魅力0处理，因此固定掉5。

#### B. 据点守兵防御：统率

稳定实测：

- 太守统率 <=65：无额外减伤；
- >=66：开始减少守兵受到的伤害；
- 统率越高减伤越明显；
- 城内其他武将统率不参与；
- 太守统率不影响据点耐久伤害。

#### C. 据点反击：武力

- 太守武力 <=65：无额外反击加成；
- >=66：开始增加据点反击伤害；
- 武力越高越强；
- 城内其他武将武力不参与。

#### D. 有效守兵上限：太守可指挥兵数

据点兵越多攻防越高，但：

```text
超过太守可指挥兵数的那部分驻兵
→ 不再继续贡献据点攻防成长
```

所以“给高指挥兵数武将官职→自动成为太守”不仅影响人事，还会直接改变守城强度。

### 7.11 港关 / 堤防恢复：需要太守，政治决定恢复量

`[COMMON][empirical-high]`

FAQ 明确：

```text
没有太守
→ 堤防、港、关耐久不恢复

有太守
→ 恢复量受太守政治影响
```

当前还没有恢复“政治→每旬耐久恢复”的完整闭式，因此不要填一个自拟线性系数。

### 7.12 太守智力与城市计略防御

官方说明书在“流言”说明里把目标都市：

```text
太守 / 君主 / 军师的智力
```

列为影响成功难易的因素；日文 Wiki 也长期记录“太守智力高会更容易挡住流言”。

所以太守智力确实属于城市计略防御相关数据。

但具体的：

```text
军师 -> 太守 -> 君主
```

抵抗者回退链以及各自如何进入最终流言闭式，目前在现代逆向复刻中有明确实现，但原公开 EXE 文本还未完成同等级核对，因此 D7 只锁“这些角色会参与”，不把复刻项目的回退链冒充原程序逐指令事实。

### 7.13 驱虎吞狼直接以太守为目标

官方说明书明确：

```text
驱虎吞狼
→ 让敌方都市太守独立
→ 太守野望高、忠诚低时更容易成功
```

因此“太守”是计略系统的真实状态节点；不能只通过 `city.officers[0]` 临时推导。

精确成功率留城市计略专项。

### 7.14 D7 当前结论

已经锁定：

- 都督、太守是 Person Identity；军师是 force-level AdvisorID，不属于 Identity；
- corps / city / force 分别持有 CorpsLeaderID / PrefectID / AdvisorID；
- 正常玩法不能直接点名太守/都督，但可以通过官职/军团编成间接影响；
- 自动都督/太守高置信主排序为可指挥兵数优先、同值统率，且有官职者相对无官职者存在优先边界；
- 第一军团用君主，委任军团用都督计算行动力 leader 参数；
- 军师可直接任免，智力 >=70，立即生效、0金、0AP；
- 军师是全势力唯一引用，所有军团共享；
- 军师智力70/80/90/100对应行动力倍率1.05/1.10/1.15/1.20；
- 军师助言只是预测层，不能替代真实命令判定；助言准确率闭式仍open；
- 太守魅力影响换季治安、统率影响守兵防御、武力影响反击、指挥兵数封顶有效守兵；
- 港关/堤防无太守不恢复，恢复量看太守政治；
- 太守智力参与城市计略防御；
- 驱虎吞狼直接针对太守的野望/忠诚。

仍 open：

- PC-PK1.1 自动太守/都督 selector 的完整函数体与最终 tie-break；
- 都督“官职顺序”与“最终指挥兵数优先”旧资料差异的逐指令消歧；
- 军师助言准确率的原函数；
- 太守政治→港关/堤防耐久恢复量闭式；
- 太守/都督死亡、被俘、调离后原作精确的自动重选时点；
- Vanilla 与 PK 在上述 selector / advice 规则上是否有版本差异。

来源：
- 官方 PK 说明书：军师智力>=70、智力越高助言越准确、军师命令无金/AP/期间；驱虎吞狼针对高野望低忠诚太守
  https://cdn.akamai.steamstatic.com/steam/apps/628070/manuals/32sangokushi11wpk_manual.pdf
- 311SireCustomizedPackageDev：Identity、AdvisorID、CorpsLeaderID、PrefectID与角色helper
  https://github.com/sean2077/311SireCustomizedPackageDev
- 日文 Wiki FAQ：太守/都督不能直接选；港关/堤防恢复需太守且看政治
  https://w.atwiki.jp/sangokushi11/pages/8.html
- 日文 Wiki 爵位/官职：都督/太守按可指挥兵数、同值统率自动任命及有官职优先边界
  https://w.atwiki.jp/sangokushi11/pages/111.html
- 日文 Wiki 内政/委任：都督任命优先级
  https://w.atwiki.jp/sangokushi11/pages/74.html
- 日文 Wiki 据点伤害：太守统率66+/武力66+/可指挥兵数实测
  https://w.atwiki.jp/sangokushi11/pages/92.html
- 日文 Wiki 各种经验：军师智力同时影响助言准确度与行动力恢复
  https://w.atwiki.jp/sangokushi11/pages/79.html
- 旧2ch：太守身份→指挥兵数→统率、都督官职相关排序细节（作为冲突边界，不作为唯一真值）
  https://w.atwiki.jp/sangokushi11/pages/1938.html

## 8. 忠诚 / 俸禄 / 褒赏

`[PC-PK1.1][official-confirmed reward semantics + reverse-engineered monthly salary dispatcher + empirical-random reward gain]`

D6 已经把忠诚的存储、自然下降和俘虏月度下降拆开。D8 重点处理“主动提高忠诚”和“俸禄支付失败”。

### 8.1 先保留真实忠诚 0..255，不在褒赏后 clamp 到100

D6 已确认：

```ts
trueLoyalty = person.loyaltyByte   // 0..255
displayLoyalty = min(trueLoyalty, 100)
```

因此所有主动忠诚变化必须操作真实值，再由 UI 截到100。

这对褒赏尤其重要。PK 实机/编辑器记录可以出现：

```text
真实忠诚 99
→ 被 COM 褒赏
→ 真实忠诚 108
→ UI 显示 100
```

所以：

```ts
person.loyalty = min(255, person.loyalty + gain)
```

而不是：

```ts
person.loyalty = min(100, person.loyalty + gain)
```

### 8.2 金钱褒赏：官方命令边界已经精确

`[COMMON/PK][official-confirmed]`

官方说明书：

```text
期间：无
必要金：每人100
行动力：每人5
执行武将：无
```

并明确：

- 可以一次选择多人；
- 总成本按人数线性累加；
- 忠诚显示为100的武将不能执行金钱褒赏；
- 每都市执行；
- 同一武将每回合最多被褒赏一次；
- 正在部队中从军的武将不能执行。

因此：

```ts
goldCost = 100 * targetCount
apCost   =   5 * targetCount
```

结构上还有：

```text
00489140 HasPraised
```

与“一人每回合一次”的官方规则完全吻合。该 flag 应随回合重置，不要只靠 UI 隐藏按钮。

### 8.3 人才府不减褒赏 AP

C5 已经锁定人才府的原作 AP 减免作用域是：

```text
探索 / 登用
```

而不是所有“人事”命令。

所以金钱褒赏仍是：

```text
5 AP / 人
```

不能因为有“人才府”变成2或3。

旧总规则把“褒赏、调动、召唤、授予/没收”打包成 `5 AP -> 人才府减半`，本轮正式撤回。

### 8.4 褒赏忠诚上升不是固定值，而是随机结果

`[COMMON][empirical-high]`

公开玩家逐旬记录直接证明同一君主的褒赏上升量会变化，并且可以通过 S/L 刷取较高结果。

刘备实机记录包括：

```text
陈兰 82 -> 90  (+8)
陈兰 90 -> 98  (+8)
许攸 87 -> 96  (+9)
韩浩 88 -> 93  (+5)
周泰 85 -> 94  (+9)
```

记录作者还明确说明“忠诚的上升幅度是随机的”，会重读直到得到较高数字。

所以旧规则：

```text
固定 +3..+10
基数 = 君主魅力*0.05 + 义理修正
```

不能继续作为原作公式。

### 8.5 魅力影响褒赏效果，但精确闭式仍 open

日文 Wiki 长期明确：

```text
君主魅力
→ 影响褒赏时忠诚度上升量
```

D6 又确认义理高时忠诚整体“较难上升、也较难下降”，义理低时相反。

但当前尚未恢复金钱褒赏的原 EXE 函数体，因此只能锁定：

```text
rewardGain = RNG + rulerCharm-related behavior + target loyalty traits
```

不能从观察样本反推固定线性式。

当前 exactness gap：

- RNG 的离散范围/分布；
- 魅力如何进入；
- 义理是否在褒赏 caller 内直接参与，还是通过共用忠诚变化函数参与；
- Vanilla / PK 是否完全同式。

### 8.6 达到显示100后，金钱褒赏锁住，但隐藏忠诚可能已>100

官方规则写的是：

```text
忠诚100 -> 不能执行褒赏
```

结合底层 0..255，可以得到正确工程语义：

```ts
if (displayLoyalty >= 100) {
  cashRewardAllowed = false
}
```

而不是检查“历史上是否已经褒赏到过100”。

一次从99开始的褒赏仍可把真实值推过100；之后 UI 显示100，下一回合也无法再用金钱褒赏继续堆。

### 8.7 宝物授予是另一条主动忠诚路径

`[COMMON/PK][official-confirmed]`

官方说明书：

```text
授予宝物
期间：无
必要金：无
行动力：10
执行武将：无
```

并明确：

```text
宝物价值越高
→ 忠诚上升越多
```

因此授予宝物不能和金钱褒赏共用一个固定 `rewardGain()`。

长期实测还支持：显示忠诚100时虽然不能再用金钱褒赏，仍可通过宝物等其他事件/关系路径让隐藏忠诚继续提高。

但：

```text
item.value -> loyaltyGain
```

的 PC-PK1.1 精确映射表/取整仍需专项恢复。不要直接把论坛“价值N就+N”升级成 exact。

### 8.8 宝物没收：确认会降忠，但精确原函数证据仍不足

长期实机资料一致记录：

```text
没收所属武将持有宝物
→ 忠诚下降
→ 忠诚过低时可能下野
```

多份 PC/PK 实机记录给出 **-30** 的稳定表现。

但当前官方说明书与公开主逆向仓库没有展开没收的忠诚修改函数体，因此 D8 把：

```text
没收会降忠
```

列为 confirmed behavior / empirical-high；

```text
固定 -30
```

暂标 `empirical-high`，不标 PC-PK1.1 reverse-engineered。

### 8.9 官职升降本身不改变忠诚

`[COMMON][empirical-exact]`

爵位/官职 Wiki 明确：

```text
升官 / 降官
→ 忠诚无变化
```

官职真正改变的是：

- 可指挥兵数；
- 能力加成；
- 每月俸禄。

所以不要实现：

```ts
promoteOfficer() => loyalty + N
demoteOfficer()  => loyalty - N
```

爵位授予/自称造成的忠诚变化属于 D6 的**势力爵位事件**，不能和普通武将官职升降混为一谈。

### 8.10 官职俸禄是每月支付，不是每季

`[COMMON/PK][official-confirmed + PC-PK1.1 reverse-engineered dispatcher]`

官方说明书直接写：

```text
金不足
→ 武将的俸禄（每月）无法支付
→ 忠诚下降
```

`docs/sources/ranks.json` 已录入80个官职，月俸值为：

```text
10 .. 60
```

PC-PK1.1 `00590490 MonthlyIncomeAndExpend` 又确认俸禄确实在月初经济链中结算。

所以旧：

```text
1/4/7/10月按季付俸
```

是错误的。

### 8.11 月初收支顺序：先俘虏维护，再现役武将俸禄

`[PC-PK1.1][reverse-engineered]`

`00590490` 对每个城市/港/关的相关顺序为：

```text
本月金粮收入
↓
俘虏维护费
↓
现役武将俸禄
↓
资金不足后果
```

俘虏维护费这一层已直接逆出：

```ts
prisonerCost = 50 * paidPrisonerCount
paidPrisonerCount = min(
  prisonerCount,
  floor(currentGold / 50)
)
```

也就是说，俘虏每人每月50金，并且**先占用该据点本月资金**。未能负担的俘虏进入后续逃亡/逃跑准备路径；完整细节放 D9。

### 8.12 现役俸禄：够钱则全额扣除

`00590490` 随后取得该据点的现役身份列表：

```text
君主 / 都督 / 太守 / 一般
```

通过：

```text
0049F2A0
```

计算该列表总俸禄。

若：

```ts
salarySum <= remainingGold
```

外层代码直接：

```ts
remainingGold -= salarySum
```

所以“月俸只是 UI 信息、不实际扣钱”同样是错误的。

### 8.13 俸禄付不起时：进入专门欠薪掉忠流程

如果：

```ts
salarySum > remainingGold
```

正常“全额扣 salarySum”分支被跳过，程序改调用：

```text
0058D5E0  欠薪/忠诚下降准备
```

并在月度处理后段进入：

```text
0058C190  忠诚下降处理
```

这与官方“每月俸禄付不出 -> 忠诚下降”完全吻合。

这里还能进一步锁定**资金事务本身**：

- `005909AC sub edi,eax` 是正常俸禄唯一的外层扣款；
- 资金不足时 `005909AA jg 005909B0` 直接跳过该指令；
- 因而该据点不会“把剩余钱按比例发掉”，写回金钱仍是扣完俘虏维护后的余额。

但 `0058D5E0 / 0058C190` 的完整函数体目前没有公开文本化，因此仍不能锁死：

- 哪些武将最终被选中掉忠；
- 每人掉多少；
- 是否按义理/相性/官职/欠薪比例分档；
- 多个欠薪据点进入最终容器后的去重/顺序。

所以旧 fallback：

```text
钱不够
→ 全城统一忠诚 -10..-30
```

正式撤回。

### 8.14 褒赏、授予的 AP 表同步纠错

官方命令表：

| 命令 | AP | 金 | 人才府减半 |
|---|---:|---:|---|
| 探索 | 20 | 0 | 是 ->10 |
| 登用 | 20 | 0 | 是 ->10 |
| 褒赏 | 5 / 人 | 100 / 人 | **否** |
| 授予宝物 | 10 | 0 | **否** |
| 移动 | 20 | 0 | **否** |
| 召唤 | 20 | 0 | **否** |

没收宝物与授予位于同一赏罚体系，但当前本轮没有取得能把其 AP 单独逐项锁死的 PC-PK1.1 caller；因此不再沿用旧 `5 -> 人才府2`。

### 8.15 D8 当前结论（P0-6 更新）

专项： [41-nonnatural-loyalty-exactness.md](41-nonnatural-loyalty-exactness.md)。

已经锁定：

- 金钱褒赏100金/人、5AP/人、即时、无执行武将；
- 可一次褒赏多人，但同一武将每回合最多一次；`HasPraised` 是结构证据；
- 显示忠诚100不能用金钱褒赏，部队中武将不能褒赏；
- 褒赏结果是随机上升，君主魅力影响上升量；精确函数仍open；
- 褒赏可把真实忠诚从99推到100以上，数据层不能clamp到100；
- 授予宝物10AP、价值越高忠诚提升越多；精确 value->gain 映射open；
- 没收宝物会降忠，-30有稳定实机记录但尚未主逆向；
- 普通官职升降不直接改变忠诚；
- 官职俸禄是**每月**支付，不是季度；
- `00590490` 明确先结算俘虏50金/人，再结算现役俸禄；
- 俸禄够钱时按总额直接扣金；
- 付不起时进入专门欠薪忠诚下降路径，而不是固定全城-10..-30；
- PC-PK1.1 外层支付事务为“够钱全额扣 / 不够整笔不扣”，已排除部分支付；
- 人才府只减探索/登用，不减褒赏/授予/移动/召唤。

仍 open：

- 金钱褒赏忠诚增长的原始 RNG/魅力/义理闭式；
- 宝物价值到忠诚增量的精确映射；
- 宝物没收 -30 的 PC-PK1.1 原函数体；
- `0058D5E0 / 0058C190` 欠薪影响武将集合与精确忠诚损失；
- 流言成功后的 loyalty target selector、单人损失与治安损失精确函数（P0-6）；
- 不同 PC/主机补丁对“移动中武将是否可褒赏”的版本差异。

来源：
- 官方 PK 说明书：褒赏100金/人、5AP/人、忠诚100不可、每回合每人一次、部队中不可；授予10AP且价值越高加忠越多；俸禄每月
  https://cdn.akamai.steamstatic.com/steam/apps/628070/manuals/32sangokushi11wpk_manual.pdf
- 311MemoryResearch `Func-收支03-每月钱粮兵装收支.txt`：月度俘虏费用→俸禄→欠薪忠诚处理调用链
  https://github.com/sjn4048/311MemoryResearch
- 311SireCustomizedPackageDev：`00489140 HasPraised`、忠诚存储/修改 helper
  https://github.com/sean2077/311SireCustomizedPackageDev
- 日文 Wiki 能力值/经验：君主魅力影响褒赏忠诚上升量
  https://w.atwiki.jp/sangokushi11/pages/1598.html
  https://w.atwiki.jp/sangokushi11/pages/79.html
- 日文 Wiki 内政：褒赏/宝物作为忠诚提升路径
  https://w.atwiki.jp/sangokushi11/pages/74.html
- 日文 Wiki 爵位・官职：官职升降本身不改变忠诚
  https://w.atwiki.jp/sangokushi11/pages/111.html
- Vanilla刘备逐旬实录：褒赏+5/+8/+9等、明确说明上升幅度随机
  https://note.com/juicy_fox4269/n/nf69a4b2b4dae
- PC-PK忠诚黑数实测：99褒赏后可变108
  https://www.ptt.cc/bbs/Koei/M.1776854540.A.47B.html
- PC/PK宝物没收-30的独立实机记录（当前只作empirical-high）
  https://blog.id774.net/entry/2020/11/06/1676/
  https://blog.id774.net/entry/2021/01/08/1703/

## 9. 俘虏

`[PC-PK1.1][reverse-engineered capture + escape + maintenance + loyalty]`

俘虏不是只有一个“是否被抓”的布尔状态。至少要保存：

```text
Identity = PRISONER(5)
FormerAllegiance
ForbiddenLord
ForbiddenMonths
CaptiveMonths
Location
```

其中 `CaptiveMonths` 直接进入逃亡概率；`Location` 决定是否处在据点俘虏流程。

### 9.1 野战 / 据点击破捕获：主概率函数已恢复

PC-PK1.1 的主函数位于 `004B1280`。它同时处理部队被击破与据点陷落后的武将捕获。

普通概率路径的已确认核心：

```ts
stat = max(target.war, target.intelligence)

surround = 1
if (surroundingFriendlyUnits > 0 && !target.hasSkill("铁壁")) {
  surround = surroundingFriendlyUnits
}

contextMultiplier = (unknownContextId === 3 || unknownContextId === 4)
  ? 1.5
  : 1.0

difficultyDivisor =
  (difficulty === "超级" &&
   attackerIsPlayer &&
   defenderIsAI)
  ? 2
  : 1

p = toInt(
  floor((120 - stat) / 3)
  * surround
  * contextMultiplier
  / difficultyDivisor
)

if (attackingUnit.hasSkill("捕缚")) {
  p += 100
}
p = min(p, 100)

if (isHalberdTactic) {
  p += 30
}
p = min(p, 100)

capture = ProbabilityRoll(p)
```

说明：

- 目标武将取**武力、智力较高者**；能力越高，普通被俘率越低。
- 合围会按周围己方部队数线性放大；目标有`铁壁`时，合围倍率被压回1，但铁壁不是绝对免疫。
- 超级难度中仅“玩家击破AI”这一方向再除以2。
- `捕缚`在普通概率路径直接加100，因此在没有更前面的逃脱/免疫硬分支时等价于必捕。
- 戟兵战法在最终概率上再`+30`，然后再次封顶100。
- `unknownContextId==3/4 -> ×1.5` 已由反汇编确认，但该 context 的业务语义还没有可靠命名，暂不猜成某个战法/地形。
- 浮点转整数 helper `00707A74` 的边界舍入语义仍沿用全项目统一 open，不在这里自造 round/floor 差异。

旧总规则里的：

```text
近战约30%
位移战法约40%
包围约70%
```

只能视为旧经验样本，**不能继续作为 PC-PK1.1 的主公式**。

### 9.2 强运 / 名马 / 血路不能混成一个百分比修正

`强运`是源码级硬边界：

```text
004B17B1 skill 32 强运
-> 部队击破捕获流程中直接走不可捕获分支
```

`捕缚`的日文特技说明长期一致表述为“对没有强运、没有名马的武将必定捕获”，因此**名马是高置信反捕获条件**；但主捕获函数中位于强运之前的 `004A0590` 保护检查尚未完成语义映射，当前不把它擅自命名成“名马检查”。

`血路`另有独立函数/特技入口，社区资料也明确存在“部队壊滅时有效、城陷落时边界不同”的版本/场景争议。因此：

- 不把血路简单塞进上面的概率公式；
- 部队全灭、据点陷落分别建模；
- 血路对据点陷落的精确边界继续 open。

### 9.3 据点俘虏的自然逃亡概率已恢复

月初 dispatcher 的顺序是：

```text
0058BB30 俘虏月数/禁仕月数计数
-> ...
-> 00582BE0 俘虏自然逃亡
-> ...
-> 00590490 月度收入/支出
```

`00582BE0` 只对能解析为城市/港/关设施的俘虏做自然逃亡 roll。

因此野外部队携带的俘虏不进入这条据点逃亡判定；日文 Wiki 的长期实测“出阵部队携带的俘虏不会自行逃亡，回城后才可能逃亡”与源码结构一致。

精确公式：

```ts
if (!isValidFacility(prisoner.location)) {
  return NO_NATURAL_ESCAPE_ROLL
}

if (prisoner.captiveMonths < 2) {
  return NO_NATURAL_ESCAPE_ROLL
}

q = max(1, prisoner.captiveMonths - 2)
stat = max(30, max(prisoner.war, prisoner.intelligence))

p = max(1, floor(q * q * stat / 150))

escape = ProbabilityRoll(p)
```

即：

- 被俘月数不足2：不会走自然逃亡 roll；
- 武力/智力取较高值，低于30按30；
- 随被俘时间**平方增长**，随武/智最大值线性增长；
- 本函数只设最小概率1，没有本地 `min(100)`；当算式超过100时，最终行为取决于共用概率 helper `004721D0` 对超范围参数的处理，这一极端边界仍 open。

### 9.4 俘虏月度掉忠：不再 open

俘虏忠诚使用 D6 已恢复的 `0058E510`：

```text
月初
-> 俘虏跳过季初限制
-> 俘虏跳过仁政
-> 关系豁免（亲爱/配偶/义兄弟/父母子女）
-> 人心掌握 2/3 免降
-> Random(0..2)
   + 符节台 2
   + 特定君主义理/野望附加
   + Random(0..2)
```

特定附加项：

```ts
if (captorLord.ideals === 0 && captorLord.ambition === 4) {
  loss += floor((4 - prisoner.ideals) / 2)
}
```

所以旧“俘虏每旬 -1～2”“符节台翻倍”“基础月度闭式未知”均撤回。

### 9.5 50金维护与“养不起”释放/逃走：人数与选择架构已恢复

P0-7 专项： [42-captive-release-exactness.md](42-captive-release-exactness.md)。

`00590490 MonthlyIncomeAndExpend` 在每个城市/港/关按设施俘虏数计算：

```ts
payable = min(
  prisonerCount,
  floor(currentGold / 50)
)

prisonerCost = payable * 50
releaseCount = prisonerCount - payable
currentGold -= prisonerCost
```

所以**必须释放几个人**已经是 PC-PK1.1 exact：

```ts
releaseCount =
  max(0, prisonerCount - floor(currentGold / 50))
```

当 `releaseCount > 0`，原代码继续：

```text
0058C320 comparator
→ 004AA200 通用列表处理
→ 004A8E10 反复裁剪，直到列表长度 = releaseCount
→ 0058D1D0 把本据点结果加入月度待处理集合
→ 全部据点循环结束
→ 0058D430 统一 finalizer
```

因此：

- 释放人数不再 open；
- 选择过程是 comparator + subset 裁剪，不应实现成“直接前N名”；
- `0058C320` 到底按能力、忠诚、ID、俘虏时间或其他字段排序仍 open；
- `004A8E10` 裁掉哪一端与 comparator 方向也需要一起恢复；
- `0058D1D0 / 0058D430` 的 release-side effect 仍未展开。

这段支出只枚举设施俘虏；野外部队携带的俘虏不属于该设施俘虏列表。

### 9.6 登用 / 释放 / 处斩 / 交换

- **登用**：继续走 D5 的俘虏登用 hard gate 与普通概率流程。
- **主动释放**：官方 PK 手册把“追放”同时用于配下追放和敌俘释放；命令本身无期间、无金、无AP、无执行武将，最多6人。官方明确写“释放敌方俘虏会增加技巧P”，但未给具体点数。
- **释放技巧P数值**：旧实测常见“2或3”“约3”，所以 +3 只作 compatibility fallback，不升级为原作 exact。
- **禁仕字段**：`ForbiddenLord / ForbiddenMonths` 为真实 runtime state，月初 `0058BB30` 递减/处理。
- **释放后的禁仕期**：资料存在直接冲突。Wiki/2009记录说释放后有禁仕期并称3个月；2011记录却明确称“自主释放不会立 flag，捕虏逃亡才会”。因此不能把所有 release path 无条件写成3个月。
- **自然逃亡**、**资金不足强制释放**、**追放命令主动释放**、**击破/落城结算立即释放**、**势力灭亡**必须按不同 cause 建模；Forbidden 与技巧P不能在通用 release helper 中一刀切。
- **资金不足 forced release** 是否奖励主动命令的技巧P、是否写 Forbidden 字段，当前均 open；在没有证据前不要偷偷复用主动“追放”的奖励。
- **处斩**：D4 已确认“处斩本身不自动新增嫌恶”，已有君主↔俘虏嫌恶仍可进入 COM 必处斩分支。
- **交换**：属于外交系统；成功时政治经验 +8，交换价格/谈判公式继续使用外交章节的版本化规则。

### 9.7 D9 仍 open 的最小集合（P0-7 更新）

- 捕获函数中 `004A0590` 的精确业务语义，以及它与名马/其他逃脱条件的映射；
- `unknownContextId==3/4 -> ×1.5` 的业务语义；
- 血路在“部队壊滅 vs 据点陷落”两条路径的精确版本边界；
- `004721D0` 对 `p>100` 的精确处理；
- `0058C320` comparator 的字段、排序方向，以及 `004A8E10` 保留哪一端；
- `0058D1D0 / 0058D430` forced-release side effect；
- 不同 release cause 对 `ForbiddenLord / ForbiddenMonths` 的精确 setter；
- 主动释放技巧P的原始点数；
- 资金不足自动释放是否也给技巧P。

### 9.8 本节依据

- 311MemoryResearch：`内存资料/函数[捕获].txt`
- 311MemoryResearch：`内存资料/整理/Func-自动07-俘虏逃走.txt`
- 311MemoryResearch：`内存资料/整理/Func-自动06-武将忠诚下降.txt`
- 311MemoryResearch：`内存资料/整理/Func-收支03-每月钱粮兵装收支.txt`
- 311MemoryResearch：`内存资料/函数[每月例行处理].txt`
- 311MemoryResearch：`内存资料/地址资料.txt`
- 日文 Wiki 特技一覧 / 小ネタ：捕缚、名马、野外部队携带俘虏、释放禁仕期的实机语义交叉验证。

## 10. 官职

`[PC-PK1.1][reverse-engineered data model + reverse-engineered auto-appointment selector + confirmed static table]`

D10 把“官职”拆成四层：**静态官职表、任官资格、实际能力/带兵效果、自动封官 selector**。旧的一句“爵位决定可授官范围、功绩决定资格”方向正确，但不足以复现原作。

### 10.1 数据层：武将持有 OfficeID，官职本身是独立表

`struct_person`：

```text
+A4 OfficeID
+AE Merit        // short，功勋
```

PC-PK1.1 的官职数组：

```text
struct_office[81]
每项 0x3C bytes

+2C TroopNumber       // 可指挥兵数
+30 AttrIncreaseType  // 能力加成类型
+34 AttrIncrease      // 能力加成值
+35 Salary            // 俸禄
+36 Rank              // 等级
```

公开资料表有 **80 个有名官职**；原内存数组为81项，因此还有1项内部/空位记录。当前不擅自给第81项命名，JSON继续只保存80个有名官职。

原 helper 已定位：

```text
00490C10 GetOfficePtrFromID
0048E0D0 GetOfficeIDFromPtr
005B3BD0 GetMeritByOfficialID
004A6D50 IncreasePersonMerit
```

### 10.2 爵位决定“可用官职层级”，功绩按4000一档

日文官职表与仓库 `docs/sources/ranks.json` 交叉一致：

| 君主爵位 | 最少都市 | 君主指挥 | 对应官职最低功绩 |
|---|---:|---:|---:|
| 无 | 1 | 10000 | 0 |
| 州刺史 | 2 | 11000 | 4000 |
| 州牧 | 4 | 11000 | 8000 |
| 羽林中郎将 | 6 | 12000 | 12000 |
| 五官中郎将 | 8 | 12000 | 16000 |
| 大将军 | 12 | 13000 | 20000 |
| 大司马 | 14 | 13000 | 24000 |
| 公 | 18 | 14000 | 28000 |
| 王 | 20 | 14000 | 32000 |
| 皇帝 | 24 | 15000 | 36000 |

原 EXE 对“官职所需功绩”直接出现：

```text
× 0xFA0
= × 4000
```

对应地址至少包括：

```text
004CB6F7  官职列表显示所需功绩
005B3BBB  判断已任官武将是否能升官
005B3C03  判断武将能否放入该官职
```

因此功绩门槛不是攻略表偶然规律，而是原程序的 **4000点阶梯**。

人物功绩本身另有上限：

```text
004A6D89 / 004A6D8E
0048A7B5 / 0048A7BB
0xEA60 = 60000
```

所以 fidelity 层应保存：

```ts
person.merit = clamp(person.merit, 0, 60000)
```

### 10.3 80个官职的效果是静态数据，不要按“文官/武官”自行生成

当前完整表继续放在：

```text
docs/sources/ranks.json
```

总体结构为每一爵位层8个职位，前4个通常为文官组、后4个通常为武官组；但**具体值必须读表**，不要用一条统一公式推导。

静态范围：

```text
可指挥兵数：5000 ～ 15000
能力加成：政治 +1～+5，或统率 +1～+2，或无加成
月俸：10 ～ 60
所需功绩：0 ～ 36000
```

例如最低一层：

```text
左仆射 / 右仆射 / 典农校尉 / 议郎
  指挥5000，政治+1，月俸10，功绩0

奋威 / 长水 / 破贼 / 武卫校尉
  指挥6000，无能力加成，月俸10，功绩0
```

### 10.4 无官职基础带兵5000；军制改革在其上 +3000

日文技巧表直接给出：

```text
军制改革：可指挥兵数 +3000
无官职武将也会从5000变成8000
```

原 EXE 地址又锁定：

```text
0049D57D  技巧18 = 军制改革
0049D58B  部队士兵上限 +3000
004CB636  封官界面显示兵力上限 +3000
```

所以：

```ts
baseCommand =
  person.hasOffice
    ? office.troopNumber
    : 5000

commandCap =
  baseCommand
  + (force.hasMilitaryReform ? 3000 : 0)
```

普通最高官职/皇帝15000，加军制改革后得到 **18000**。

对部队而言，以**主将**的指挥上限限制可带兵数；副将不会把各自官职兵力相加。君主走爵位自身的指挥兵力表，普通武将走 OfficeID。

### 10.5 官职能力加成直接进入实际五维，最后仍封顶100

`0048A110 / 计算武将属性` 的官职段已经公开：

```text
读取 person.OfficeID
-> 00490C10 获取 struct_office
-> 当前正在计算的属性 == office.AttrIncreaseType ?
-> 加 office.AttrIncrease
```

对应反汇编：

```text
0048A22B  读取 +A4 OfficeID
0048A237  GetOfficePtrFromID
0048A24B  比较能力索引与 +30 AttrIncreaseType
0048A250  读取 +34 AttrIncrease
0048A254  加到当前能力
```

顺序上，官职加成位于年龄/经验等核心能力计算之后，随后还能进入“内助”等后段加成，最后统一做上下限处理。

原版最终五维上限由：

```text
0048A2AB / 0048A2B1
= 100
```

控制。因此正常规则是：

```text
基础/年龄/经验等
-> 官职加成
-> 其他后段加成
-> 最终 clamp 到 1..100
```

不要因为官职“政治+5”就在引擎数据层允许正常五维显示到105。

### 10.6 升官 / 降官本身不改忠诚

这一点 D8 已核：

```text
任官 / 升官 / 降官
-> 不直接修改忠诚
```

爵位授予/自称带来的汉室态度忠诚变化，是 D6 的**势力事件**，不是普通官职变化。

官职真正改变的是：指挥兵数、指定五维加成、每月俸禄，以及间接影响太守/都督自动选择和据点有效守兵上限。

### 10.7 自动封官不是“按功绩从高到低”（P0-8）

P0-8 专项： [43-auto-office-selector-exactness.md](43-auto-office-selector-exactness.md)。

PC-PK1.1 已公开 `005FAF00` 自动选人函数。

本轮首先纠正一个旧误标：

```text
005FA650
```

**不是候选列表生成/排序函数**。

`005FAF00` 的真实参数结构可恢复为：

```text
arg1 = caller 已经构造好的候选武将列表
arg2 = 目标官职指针
arg3 = scoring mode flag
```

函数开头先：

```text
005FA650(office)
→ officeType
```

然后直接遍历 arg1。

因此最终同分结果依赖 caller 提供的候选顺序；不是 `005FA650` 内部再排序。

### 10.8 officeType 与 scoringModeFlag 是两个独立量

对80个有名官职，`005FA650` 的分类行为可高置信整理为：

```text
type 0:
  丞相 / 司空 / 太尉 / 司徒
  即 officeId 0..3

type 1:
  武官
  named office 中 officeId % 8 >= 4

type 2:
  其余文官
```

已知 `officeId=0x2C(44)` 是军师将军，与“每层8官、后4为武官”的静态表完全吻合。

注意：

```text
officeType = 005FA650(office)
scoringModeFlag = 005FAF00 arg3
```

不能混成一个“官职类型参数”。

第81个内部 office entry 的分类仍 open。

### 10.9 两种 mode 共用的 hard gate

每个候选先调用：

```text
005FA4D0(person, office)
```

现有逆向注释确认它主要检查：

- 功绩；
- 所在；
- 状态；
- 其他任官资格。

完整函数体仍 open。

随后无论哪种 mode：

```ts
if (trueLoyalty < 90)
  reject
```

读取的是 `struct_person +0xAC` 的真实忠诚 byte。

### 10.10 arg3 != 0：weighted-threshold mode

忠诚权重：

```ts
loyaltyBonus =
  9 * min(trueLoyalty - 90, 10)
```

所以：

```text
90 -> +0
91 -> +9
...
100及以上 -> +90
```

#### type 0：顶级四文官

```ts
base = leadership + intelligence

if (base < 150)
  reject

score =
  base + loyaltyBonus
```

门槛是**>=150**，不是 >150。

#### type 1：武官

```ts
if (max(leadership, war) < 60)
  reject

score =
  leadership
  + war
  + loyaltyBonus
```

必须区分：

```text
资格门 = max(统,武)
排序分 = 统+武
```

#### type 2：普通文官

```ts
civil =
  max(intelligence, politics)

if (civil < 70)
  reject

score =
  civil + loyaltyBonus
```

不是“智+政”。

因此功绩的主要作用在更前面的**资格 gate**；`005FAF00` final score 本身没有 merit 项。

### 10.11 arg3 == 0：role-affinity mode

先算：

```ts
martial =
  max(leadership, war)

civil =
  max(intelligence, politics)
```

武官：

```ts
if (martial < civil)
  reject

score = martial
```

type0 + 普通文官：

```ts
if (civil <= martial)
  reject

score = civil
```

因此：

```text
martial == civil
→ 武官侧允许
→ 文官侧拒绝
```

这一 mode 仍保留公共忠诚>=90门槛，但没有90～100的忠诚 score bonus。

### 10.12 mode 的 caller 业务含义仍 open

从行为看：

```text
arg3 != 0
→ 能力门槛 + 忠诚权重

arg3 == 0
→ 文武倾向 partition
```

SIRE v1.26 的历史更新说明也明确写过：

```text
电脑自动封官的规则可设定
```

但当前公开 IDB / TXT 没有 `005FAF00` caller xref，因此不能正式把：

```text
arg3=1
arg3=0
```

硬命名成：

```text
AI
玩家自动按钮
```

当前规则名保持中性：

```text
weighted-threshold
role-affinity
```

直到 caller 闭合。

### 10.13 最终同分规则已经 exact：first-in-list wins

`005FAF00` 初始化：

```text
bestScore = INT_MIN
bestPerson = null
```

最终只在：

```ts
candidateScore > bestScore
```

时替换。

相等时不替换。

因此 selector 自身的 tie-break：

```text
相同 score
→ caller list 中先出现的 candidate 获胜
```

这是源码级 exact。

仍未知的是：

```text
caller list 本身按什么顺序构造
```

所以不能继续写“同分ID小者 / 年长者 / 功绩高者”。

### 10.14 D10 当前结论（P0-8 更新）

已经锁定：

- Person 的 `OfficeID` 与 `Merit` 独立保存；
- 官职结构保存指挥兵数、能力加成、俸禄、等级；
- PC-PK1.1 原数组81项，公开有名官职80项；
- 官职功绩门槛按4000点一档，功绩上限60000；
- 无官职指挥5000、军制改革+3000；
- 官职能力加成进入实际属性，最终100封顶；
- 升降官本身不改忠诚；
- `005FAF00` 的 candidate list / office / mode 三个参数角色；
- `005FA650` 是 office classifier，不是候选排序器；
- true loyalty <90 为两种 mode 共用硬拒绝；
- weighted-threshold mode 的三类门槛与 score 已完整恢复；
- military 门槛用 max(统,武)，但 score 用统+武；
- ordinary civil 用 max(智,政)，不是智+政；
- top-civil 为统+智>=150；
- loyalty bonus = `9*min(loyalty-90,10)`；
- role-affinity mode 的文武倾向比较已恢复；
- 文武相等时武官侧胜；
- 最终同 score 为稳定 first-wins；
- merit 不进入 `005FAF00` final score。

仍 open：

- `005FA4D0` 完整资格函数；
- `005FA650` 完整 opcode（有名80官分类行为已高置信恢复）；
- `005FAF00` 所有 caller / xref；
- caller candidate list 的构造与原始顺序；
- arg3 在每个 caller 的业务语义；
- 自动连续分配多个官职时已选武将如何移出后续候选；
- 多官职遍历顺序；
- 第81个 office entry；
- Vanilla / 主机版差异；
- 黄巾特殊无爵位/无普通官职继续放 `08-ruler-corps.md`。

### 10.15 本节依据

- 311MemoryResearch：`内存资料/函数[自动封官].txt`。
- 311MemoryResearch：`内存资料/地址资料.txt`。
- 311SireCustomizedPackageDev：`struct_person / struct_office[81]`。
- 311resource：原 IDB 函数边界轻量导出。
- 日文 Wiki《爵位・官职》：80官职静态表。
- SIRE v1.26 更新记录：电脑自动封官规则可设置；仅作 caller 业务语义的旁证，不替代 xref。

