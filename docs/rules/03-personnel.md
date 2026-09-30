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

### 2.14 D2 当前结论

已经锁定：

- `YearOfDebut` 是时间门槛，与 current Identity 独立；
- 没有通用“15岁自动登场”规则；20岁诸葛亮、34岁沙摩柯仍可未登场；
- 普通登场还受剧本 Identity、`ScheduledLord` 与全局 `ComeOnStage/IgnoreAge` 体系约束；
- `YearOfDeath` 是基础/参考没年，不等于最终死亡 tick；
- 存在原 `0048A000 GetDeathYear`；
- `Lifetime` 与 `DieInBattleSetting` 为不同剧本字段；
- 自然死/不自然死是不同 lifespan profile；
- 不自然死额外寿命与年龄负相关，但精确函数未知；
- “预定死亡年”、`markedForDeath`、`Identity=DEAD` 不能合并成一个字段；
- 死亡 flag 可作为事件前置状态而不立即死亡；
- 从较早存档重跑可改变未来死亡结果，禁止开局一次性预抽最终死亡日期；
- 历史事件可延寿或直接死亡；孙策事件精确 +20 年；
- 健康0/1/2/3与基础属性分离；当前能力倍率采用100/80/50/20。

仍 open：

- 普通 `NOT_INTRODUCED -> NOT_DISCOVERED/现役` 的原 caller；
- `ScheduledLord` 在普通登场流程的精确优先级；
- `IgnoreAge / ComeOnStage / Lifetime` 的原始枚举值与所有分支；
- `0048A000 GetDeathYear` 完整函数体；
- 自然死/不自然死有效死亡年的精确闭式；
- `markedForDeath` 触发时点、概率及真正死亡延迟；
- 一般沙盘健康自然恢复/恶化公式；
- Vanilla EXE 与 PC-PK1.1 的寿命处理版本差异。

精确 fallback 继续集中在：
`16-unresolved-rules-fallbacks.md#6-自然死亡精确-rng`。

来源：
- 311SireCustomizedPackageDev `struct_person` / `struct_scenario` / Person helper 地址
  https://github.com/sean2077/311SireCustomizedPackageDev
- 311MemoryResearch `函数[每月例行处理].txt`：月初存在年龄/死亡相关处理入口，但公开 TXT 未展开函数体
  https://github.com/sjn4048/311MemoryResearch
- 游民星空官方剧情条件整理：预定死亡年、孙策延寿20年
  https://www.gamersky.com/handbook/200809/124174_6.shtml
- 日文 Wiki mask data：自然死/不自然死大致时序（其中健康倍率旧表已被实机锚点覆盖）
  https://w.atwiki.jp/sangokushi11/pages/983.html
- 日文 Wiki Q&A：较早存档重跑可改变死亡结果
  https://w.atwiki.jp/sangokushi11/pages/2527.html
- 日文 Wiki 孙策/孙策之死：不自然死延寿实测与事件 +20
  https://w.atwiki.jp/sangokushi11/pages/886.html
  https://w.atwiki.jp/sangokushi11/pages/918.html
- 日文 Wiki 诸葛亮、沙摩柯剧本表：成年仍可未登场
  https://w.atwiki.jp/sangokushi11/pages/123.html
  https://w.atwiki.jp/sangokushi11/pages/447.html
- 日文 Wiki PS2事件：北伐检查死亡flag、诸葛亮之死等待自然死
  https://w.atwiki.jp/sangokushi11/pages/21.html
- 日文 Wiki 夷陵决战：甘宁94→重伤47→轻伤75
  https://w.atwiki.jp/sangokushi11/pages/2165.html

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

长期实测精确确认：

```ts
exp += gained

while (exp >= 100 && trainingCapNotReached) {
  exp -= 100
  trainedStat += 1
}
```

超过100的部分会保留。例如智力经验99，再获得3点：

```text
能力 +1
剩余经验 = 2
```

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

- `0048A030 GetPersonAttrChangeCoef` 与 `0048A390 GetPersonGrowthAttr` 完整函数体；
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

`[COMMON][confirmed/empirical-high]`

### 亲爱

- 不同部队主将之间有亲爱关系时，支援攻击约 30%。
- 副将亲爱主将时，副将能力补正更高并提升会心倾向。
- 武将亲爱某君主时，对该君主登用具有强制成功关系，并通常不会被其他君主登用（配偶/义兄弟例外）。
- 在野/亡国俘虏或满足“忠诚+义理≤96”等条件时，目标亲爱执行者可覆盖普通军师失败判定。

### 嫌恶

- 同部队存在互相嫌恶者时，副将补正全部失效，并不会在单挑中互相援助。
- 武将嫌恶君主时通常不能被该君主登用；配偶/义兄弟可构成例外，但初始忠诚很低。
- COM 君主与俘虏互相嫌恶时可导致必处斩。
- 君主被另一君主嫌恶时，友好极难上升，无论客通常无法结盟（停战仍可）。

来源：https://w.atwiki.jp/sangokushi11/pages/95.html

## 5. 登用：优先级门槛

下面这些规则可从原来的“模糊评分”升级为 `[empirical-high]` 的确定优先级：

1. 目标配偶在第三方势力且目标原势力仍有城市 → 失败。
2. 目标配偶是执行者或执行势力君主 → 成功。
3. 目标嫌恶执行者或执行君主 → 失败。
4. 执行者/执行君主是目标义兄弟 → 成功。
5. 目标忠诚 + 义理 > 96 → 普通登用失败。
6. 目标义兄弟长兄在执行势力 → 成功。
7. 目标配偶在执行势力 → 成功。
8. 目标亲爱当前君主 → 失败。
9. 目标同时亲爱执行君主和执行者 → 成功。

来源：https://w.atwiki.jp/sangokushi11/pages/74.html
交叉核对：https://w.atwiki.jp/sangokushi11/pages/95.html

### 普通连续概率：反汇编到函数边界

`[PC-PK1.1][reverse-engineered-partial]`

以上强制门槛都不命中后，原程序进入 `005C4F80 GetHiringSuccessRate`，返回一个 0–100 的成功率。公开的 SIRE/311MemoryResearch 资料已确认函数地址、调用关系和最终比较过程，但当前可检索资料**没有完整展开该函数体**，所以内部连续评分仍不能标成 exact。

正常登用发令时会计算：

`dateKey = day*7 + month*5 + year*3`

最终不是每次重新取全局随机数，而是把 dateKey、双方武将 ID、目标忠诚、执行者魅力、执行者与目标的相性差等送入确定性值生成函数，再做：

`success = deterministicValue < successRate`

异地登用会保存发令时的 dateKey，到任务完成时继续使用。因此同一状态下读档重试应保持相同结果。

引擎 fallback 与详细证据见 `16-unresolved-rules-fallbacks.md#2-普通登用概率`。禁止重新引入网上无来源的“政治/魅力各加若干点”公式。

逆向来源：
- https://github.com/sjn4048/311MemoryResearch/blob/master/内存资料/整理/Func-人才01-计算登用是否成功.txt
- https://github.com/sjn4048/311MemoryResearch/blob/master/内存资料/整理/Func-人才03-执行登用.txt
- https://github.com/sjn4048/311MemoryResearch/blob/master/内存资料/整理/Func-人才04-执行登用完成.txt
- https://github.com/sjn4048/311MemoryResearch/blob/master/内存资料/整理/Func-人才08-探索发现人才并登用.txt
- https://github.com/sean2077/311SireCustomizedPackageDev/blob/dev/material/内存地址汇总.md

## 6. 相性、义理、野望、汉室

- 相性越近越容易登用；相性还影响自然忠诚变化。
- 义理越高越不易下降/背叛。
- 野望越高越易独立。
- 汉室态度分无视/普通/重视，影响爵位与汉帝事件。

来源：https://w.atwiki.jp/sangokushi11/pages/983.html

## 7. 太守、都督、军师

- 太守/都督自动决定时优先看官职/指挥兵力，再比较统率等。
- 军师智力影响行动力和建议准确性。
- 军师建议不是决定论；特殊人际关系的强制门槛优先。

## 8. 忠诚、俸禄、奖赏

- 官职附带俸禄。
- 忠诚受相性、义理、野望、奖赏、宝物、人心掌握等影响。
- 俘虏忠诚随时间下降；`[PK][PC-PK1.1 reverse-engineered]` 符节台会在忠诚下降数值中**额外 +2**。
- `[PK][empirical]` 人心掌握并非绝对免疫；原文为“忠诚更不容易下降”。社区长期整理常见值为换季约 **67%** 概率免除本次自然忠诚下降；SIRE 也暴露了可调整的独立免降概率参数。

### 自然忠诚下降的触发条件

`[COMMON][empirical-high]`

可靠长期实测显示，**忠诚自然变化发生在换季时**。武将满足以下任一条件时会进入下降候选：

1. 与君主相性差 ≥25；
2. 义理为“低/较低”，且野望为“高/较高”。

下降幅度还受**君主义理/野望**影响；吕布、董卓这类君主实测下降更明显。

另外，显示忠诚上限虽然是100，但内部忠诚可高于100；爵位/事件等可以把内部值继续向上叠加，因此“显示100”并不代表内部值刚好100。长期保持100的武将往往能形成内部缓冲。

### PK 符节台：忠诚下降 +2 的真实作用域

`[PK][PC-PK1.1 reverse-engineered]`

原 `0058E510` 忠诚下降函数在已经进入“需要掉忠”的武将上计算：

```text
第一次随机 0..2
+ 符节台效果（有则 +2）
+ 君主义理/野望相关附加项（若命中）
+ 第二次随机 0..2
```

关键地址：

```text
0058E748 push 0x28   // 符节台
0058E750 检查城市是否有该设施
0058E759 add edi, 2  // 忠诚下降值额外 +2
```

俘虏会跳过“必须季度初”的判断，因此月度忠诚下降流程中都可能吃到这个 +2。

重要副作用：

> 这段 +2 不在俘虏专用代码里，而在通用忠诚下降数值分支。

因此同一城市中的本方普通武将，**如果本来就满足自然忠诚下降条件并在季初进入掉忠流程**，也会被符节台额外加重 2 点下降。符节台不会让原本完全不掉忠的武将凭空掉忠，只会放大已经进入下降结算的武将。

这是 PC-PK1.1 原作行为，不应为了符合设施说明文字而只限定给俘虏。

来源：
- https://w.atwiki.jp/sangokushi11/pages/15.html
- https://w.atwiki.jp/sangokushi11/pages/74.html
- https://w.atwiki.jp/sangokushi11/pages/983.html

### 仍 open

- 单次换季具体下降多少的封闭公式。
- 欠薪时忠诚下降的精确函数。
- 俘虏基础忠诚下降的完整随机/关系闭式与版本边界。符节台的附加量本身已锁定为 **+2**。
- 人心掌握 67% 的 PC-PK 版本边界仍需存档回归，因此当前不标 confirmed。

## 9. 俘虏

可登用、释放、处斩、外交交换或逃亡。战场俘虏受捕缚、强运、名马、包围、戟兵等影响。精确概率仍列 open。

## 10. 官职

- 爵位决定可授官范围。
- 功绩决定任官资格。
- 官职提供带兵上限与能力加成并产生俸禄。
- 升降官本身不直接改变忠诚。
- 军制改革 +3000 可与官职叠加。
