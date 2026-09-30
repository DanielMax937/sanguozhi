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
