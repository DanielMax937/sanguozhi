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

### 1.8 登场年、出生年、没年是静态生命周期数据，不是当前状态

`struct_person` 保存：

```text
+0x44 YearOfDebut
+0x48 YearOfBirth
+0x4C YearOfDeath
+0x50 CauseOfDeath
+0xA8 ScheduledLord   // 登场预定君主
```

这些字段描述生命周期的**基础剧本数据**；当前是否未登场、未发现、在野、所属或死亡仍看 `Identity`。

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

### 数据与运行时状态

`[PC-PK1.1][reverse-engineered-partial]`

D1 已确认 `YearOfDebut / YearOfBirth / YearOfDeath / CauseOfDeath / ScheduledLord` 是基础生命周期字段，而当前 `Identity / HealthLevel / markedForDeath` 是独立运行时状态。

另外已定位：

- `0048A000 GetDeathYear`：取得角色死亡年；
- `00489160 IsMarkedForDeath`：读取“预定死亡” flag。

所以“史实没年”不能直接等价为“本局最终死亡日期”。死亡 RNG、寿命设置和健康恶化的精确流程放到 D2 继续核。

逆向来源：
- https://github.com/sean2077/311SireCustomizedPackageDev/blob/dev/material/内存地址汇总.md
- https://github.com/sean2077/311SireCustomizedPackageDev/blob/dev/material/结构体汇总.md
- https://github.com/sean2077/311SireCustomizedPackageDev/blob/dev/material/数据汇总.md

### 自然死 / 不自然死

`[COMMON][empirical-high]`

- **自然死**：基础没年后开始容易生病，多数在当年死亡，少数延后约 2–3 年。
- **不自然死**：基础没年并不是立即进入普通死亡；额外寿命与“没年时年龄”负相关，年轻武将通常延得更久。
- 旧资料常说额外上限约15年，但实际玩家记录存在 16–20 年级别的最终延寿，因此 15 不能当 actual-death hard cap。
- 孙策等历史事件直接以“预定死亡年”为触发条件，并可继续延寿；于吉事件胜利后寿命 +20。
- 从较早存档重跑后，同一武将的实际死亡结果可能改变，所以禁止在 scenario init 时一次性预抽最终死亡旬。
- 战死设置另外影响战场死亡，不与自然寿命 RNG 混算。

主要来源：
- https://w.atwiki.jp/sangokushi11/pages/983.html
- https://w.atwiki.jp/sangokushi11/pages/2527.html
- https://w.atwiki.jp/sangokushi11/pages/918.html
- https://www.gamersky.com/handbook/200809/124174_6.shtml

精确 fallback 与剩余缺口见：
`16-unresolved-rules-fallbacks.md#6-自然死亡精确-rng`

### 健康能力修正

`[COMMON][empirical-high]`

按当前攻略 Wiki 与决战制霸关卡可直接反算：

- 健康：100%
- 轻伤：80%（-20%）
- 重伤：50%（-50%）
- 濒死：20%（-80%）

关卡实证：甘宁原武力94，重伤时显示47，恢复轻伤后显示75，正好对应 50% / 80%。

来源：
- https://w.atwiki.jp/sangokushi11/pages/1598.html
- https://w.atwiki.jp/sangokushi11/pages/2165.html

旧隐藏数据页的 -20/-40/-60 与实际关卡数值冲突，因此不采用。

## 3. 五维、适性与成长

- 五维：统率、武力、智力、政治、魅力。
- 能力经验满 100 后对应能力 +1，超过部分保留；能力自然成长到 100 后停止。
- 适性：C→B 150、B→A 200、A→S 250。
- 经验获得表沿用 `docs/rules.md`。

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
