# 排除原15项后的逐点源码审计

> 本文件记录“15项未决规则专项”之外的后续逐点审计。每完成一个点，必须同时更新本表与对应规则正文；聊天结论不视为完成。

## 状态

| 编号 | 规则点 | 当前结论 | 证据等级 | 已写回 |
|---|---|---|---|---|
| A1 | 旬/月/季时间单位与收入触发点 | 普通金月初、粮季初；征税/征收改变收入 tick 而非简单末端×1.5 | PC-PK1.1 reverse-engineered | ✅ |
| A2 | 一旬内部真实结算顺序 | 月初调用链已恢复；每旬全局 caller 仍缺 | reverse-engineered-partial | ✅ |
| A3 | 势力行动顺序 | 爵位→都市数→武将数为高置信实测；forceId 不是已证实原作 tie-break | empirical-high | ✅ |
| A4 | 初级/上级/超级差异 | 收入、AI征兵/生产、玩家伤害、设施攻击、AI出兵、单挑多分支已核；技巧研究时间差异撤回 | reverse-engineered-partial + empirical-high | ✅ |
| A5 | 剧本初始化 | Runtime Scenario 保存开局选项/RNG/世界状态；剧本快照还会叠加选项与难度转换 | reverse-engineered-structure | ✅ |
| B1 | 六角坐标、邻接、城市领域 | 200×200、x*200+y、六方向邻接、96项 area→city 映射已锁；缺40,000格静态 dump | reverse-engineered | ✅ |
| B2 | 地形×兵种战法可用性 | 底层为 Equipment tactic表 × Tactic terrain mask × target flags；骑兵浅滩仍冲突 | reverse-engineered-structure + empirical-high | ✅ |
| B3 | 地形移动成本 | 12×32 lookup；运输陆地用剑表、水上用小船表；火格×4；玩家设施不改底层地形成本 | reverse-engineered | ✅ |
| B4 | 移动力加成叠加 | 原`计算部队属性`函数锁定技巧/特技加法顺序；强行覆盖长驱；搬运+操舵可叠加 | PC-PK1.1 reverse-engineered | ✅ |
| B5 | ZOC | 相邻六格控制；进入ZOC后终止本回合继续移动；陆/水ZOC分离；飞将/遁走/推进边界已核；伪报是否继续发出ZOC仍冲突 | reverse-engineered-parameters + empirical-high | ✅ |
| B6 | 高度与高低差 | 高低差仅进入部分强制位移战法成功率；判定取行动开始格；旧“每级固定±5”降级；原高度静态字段位置仍 open | empirical-high + original function located | ✅ |
| B7 | 水陆切换、舰船切换 | 陆/水两套兵装并存；当前坐标选 active profile；仅河/海触发 naval；运输水上固定走舸行军表；渡/浅滩不切船 | reverse-engineered-structure + empirical-high | ✅ |
| B8 | 港关容量与所属关系 | 静态母城关系与当前势力归属分离；收入按同ForceID判定；基础/扩展容量已核；四类数量兵装与小数量兵器分离 | reverse-engineered + confirmed-game-data | ✅ |
| B9 | 堤防、水攻机制 | 静态 flood 标记、四城堤防、800耐久、击破即一次性水攻、野外受淹部队全灭、每旬恢复10%并10旬回满 | reverse-engineered + empirical-high | ✅ |
| C1 | 金钱收入完整公式 | 基础金+市场类产量→造币→难度→治安；征税/富豪逐旬取整；港关20%与同势力条件均已锁 | PC-PK1.1 reverse-engineered | ✅ |
| C2 | 粮食收入完整公式 | 基础粮+农场/谷仓/军屯农→难度→治安；丰作→征收→米道；港关20%及非季初米道源码特例已锁 | PC-PK1.1 reverse-engineered | ✅ |
| C3 | 征税/征收/富豪/米道/丰作等特殊收支 | 城市据点布尔特技作用域、同名不叠加、港关继承母城、逐tick重判、丰作状态位与运算顺序已锁 | PC-PK1.1 reverse-engineered | ✅ |
| C4 | 无印内政设施 | 九类基础设施、费用/耐久/技巧P、邻接增益、命令槽机制与无印/PK边界已锁 | Vanilla confirmed-mechanism + empirical-high + reverse-engineered-structure | ✅ |
| C5 | PK十设施 | 十设施基础数据与效果已分项核；练兵所舰船工期、符节台+2副作用、军事府实际AP覆盖、人才府/计略府原地址均已锁 | PC-PK1.1 reverse-engineered + confirmed-data | ✅ |
| C6 | PK吸收合并 | 五类设施、独立ID升级链、合法组合、城市2格敌军禁用、10AP+100金、10/20日边界与合并中前一级效果已核 | official-confirmed + reverse-engineered-structure + empirical-high timing | ✅ |
| C7 | 各设施精确开发日数 | 综合政治、全门槛表与统一耐久进度模型已核；全表可由25%初始耐久+每旬floor(1.5P)逐格精确重建，原函数体仍open | empirical-exact table reconstruction + reverse-engineered-structure | ✅ |
| C8 | 商人 / 粮食交易 | 20AP、都市2格敌军禁用、每城每旬一次、TradePrice/HasMerchant状态、买粮无损/卖粮×0.8及政治非线性交易效果已核；闭式仍open | official-confirmed + empirical-high + reverse-engineered-structure | ✅ |
| C9 | 行动力 | 军团独立AP、君主/都督+城市+武将×军师公式、最终向下取整、PK符节台取整后+5及255上限已核；主恢复函数体仍open | empirical-exact formula + reverse-engineered-structure + PK save cross-validation | ✅ |
| C10 | 治安 | 巡查边界/公式、征兵量与掉治安精确式、收入倍率、换季自然下降、PK整备政令、贼80阈值与根城持续已核；巡查敌军半减/贼生成概率等仍open | reverse-engineered core + official-confirmed + empirical-high patrol | ✅ |
| C11 | 灾害 | current/scheduled 疫病/蝗灾/丰作状态结构、月初状态→收入顺序、丰作×1.5、风水/祈愿边界及蝗灾/疫病已确认效果已核；发生率/持续/精确损失仍open | reverse-engineered state structure + reverse-engineered harvest effect + confirmed/empirical damage semantics | ✅ |
| D1 | 武将生命周期 / 状态字段 | 9种Identity、军师/部队/任务/flags/健康/禁仕/俘虏计数等正交字段已核；旧线性状态机撤回 | PC-PK1.1 reverse-engineered-structure | ✅ |
| D2 | 登场 / 寿命 / 死亡 | YearOfDebut与Identity分离、成年不自动登场、Lifetime与战死独立、YearOfDeath/GetDeathYear/死亡flag/真正死亡分层、健康100/80/50/20已核；核心寿命函数仍open | reverse-engineered-structure + official-event-semantics + empirical-high timing | ✅ |
| D3 | 五维 / 适性 / 成长 | 五维/成长型/经验/适性分层、9种成长型、年龄lookup、能力经验100→+1余数保留、普通培养+30上限、适性150/200/250、指导×2已核 | reverse-engineered-structure + empirical-exact thresholds + empirical-exact age table | ✅ |
| D4 | 人际关系 | 亲爱/厌恶方向性、夫妻/义兄弟/血缘独立结构、PC-PK支援50/30/20参数、副将1/2/1/3/1/4补正及嫌恶整队覆盖、登用/处斩硬分支已核 | reverse-engineered relation structure + reverse-engineered support parameters + empirical-high relation behavior | ✅ |
| D5 | 登用优先级与普通概率 | hard gate→005C4F80→deterministic compare 控制流、dateKey与异地锁发令日、非0参数义理倍率/随机分支、探索失败舌战>80已核；005C4F80闭式仍open | reverse-engineered control flow + deterministic final check + empirical-high hard-gate order | ✅ |
| D6 | 相性 / 义理 / 野望 / 汉室 | 相性150环精确式、忠诚0..255/UI100、换季掉忠>=25/低义理高野望门槛、己方/俘虏schedule、仁政边界、人心掌握精确2/3及掉忠数值主路径、汉室爵位与拥废常量已核 | reverse-engineered compatibility/storage/loyalty core + empirical-high behavior cross-check + documented Han constants | ✅ |
| D7 | 太守 / 都督 / 军师 | corps/city/force三层角色结构、太守都督自动选择、军师智力70任命门槛与势力级唯一引用、AP倍率、太守治安/守城/耐久恢复职责已核 | reverse-engineered role structure + official advisor rules + empirical-high automatic selection | ✅ |
| D8 | 忠诚 / 俸禄 / 褒赏 | 褒赏100金/人+5AP/人/每回合一次与随机加忠、授予10AP、隐藏忠诚>100、月度俸禄与00590490收支顺序、欠薪专门掉忠路径已核；褒赏增量/欠薪点数仍open | official-confirmed reward semantics + reverse-engineered monthly salary dispatcher + empirical-random reward gain | ✅ |
| D9 | 俘虏 | 捕获主概率、强运硬免疫、合围/铁壁/超级难度/戟战法修正、自然逃亡平方公式、月度掉忠、人心掌握2/3、50金维护与资金不足释放路径已核；名马 helper/血路城陷边界/释放排序等仍open | reverse-engineered capture + escape + loyalty + maintenance, wiki corroboration | ✅ |
| D10 | 官职 | 80官职表、81项原数组结构、4000功绩阶梯、60000功绩上限、无官5000、军制改革+3000、能力加成入实际五维、自动封官忠诚90硬门槛与双评分分支已核；资格helper/候选排序/caller flag仍open | reverse-engineered office structure + auto-selector + confirmed static table | ✅ |

## A1 关键纠错

原先把“征税/征收 = 收入×1.5”理解成单次倍率不够精确。

- 征税：月初、11日、21日各约取得普通月收入的50%。
- 征收：季度三个月每月各约取得普通季度粮收入的50%。
- 每个 tick 独立整数运算。

## A2 关键纠错

旧文档“资源收入→行动力→研究→死亡/俘虏”的顺序不能作为原作事实。

`00590C30 MonthlyAction` 已确认月初至少是：

```text
俘虏/禁仕计数
→ 年龄/死亡
→ 俘虏逃跑
→ 丰作处理
→ 月度钱粮/治安/俸禄/自动兵装
→ 技巧点
→ 在野移动/自动出仕
→ 后续月度处理
→ 季初忠诚下降
```

完整旬级顺序仍待 `00580100 MainLoop` 函数体。

## A3 关键纠错

删除“势力ID是原作最终 tie-break”的暗示。

当前只把：

```text
爵位低
→ 都市少
→ 武将少
```

作为 `empirical-high`。港关数与最终随机仍待 comparator / 存档实验。

## A4 关键纠错

已确认：

- 初级城市钱粮 ×1.25；
- 上级 ×1；
- 超级玩家 ×0.75、AI ×1.25；
- 超级 AI 征兵 ×2；
- 超级 AI 普通兵装生产 ×2；
- 超级玩家主要部队伤害 ×0.75；
- 超级玩家所属设施攻击 ×0.8；
- AI 出兵策略读取 difficulty；
- 单挑难度通过伤害、斗志、必杀、一击必杀多个独立分支实现。

撤回旧结论：

> “技巧研究时间与其他难度不同”

当前未找到可靠源码支持。

## A5 关键纠错

剧本文件不是最终 Runtime Scenario 的全部。

运行时 `struct_scenario` 独立保存难度、战死、寿命、事件、血缘、人际、相性、性格、登场、RandomSeed、CurrentRoundNumber，并连续持有城市/势力/武将/建筑/部队等完整世界状态。

## B1 关键纠错

地图规则已基本清楚，真正缺的是静态地图 dump：

```text
200×200
40,000 grid
grid size 0x14
packed coord: low16=x, high16=y
index=x*200+y
```

城市领域由：

```ts
areaCode = (gridInfo >> 5) & 0x7f
cityId = Tbl_GridToCityID[areaCode]
```

决定，不应使用“最近城市”推导。

## B2 关键纠错

地形战法限制不是单一 `terrainAllowed[troop][terrain]`。

权威模型应保留：

- Equipment.Tactics[32]
- Tactic.TacticOnTerrains
- Tactic target flags
- NecessaryUnitBranch
- CheckTroopTactic
- 特技/技巧 override

当前唯一明确保留的小型 exactness gap：骑兵对浅滩目标能否使用骑兵战法。

## B3 关键纠错

移动成本函数只读取：

```text
目标 terrain
陆/水行军兵装
着火 flag
```

不会因为格上有阵/箭楼等玩家建筑就统一改成4。

- 都市/关/港为4，是因为它们自己是 terrain type。
- 玩家设施格仍按底层 terrain 计费。
- 火格成本精确 ×4。
- 运输陆地使用剑兵表，水上使用小船表。

## 主要逆向来源

- https://github.com/sjn4048/311MemoryResearch
- https://github.com/sean2077/311SireCustomizedPackageDev
- https://github.com/tankyc/sango_infinity
- https://w.atwiki.jp/sangokushi11/


## B4 关键纠错

原函数 `00496570 计算部队属性` 已恢复移动力分支。

技巧修正：

```text
精锐枪兵 +6
精锐戟兵 +6
精锐弩兵 +6
出产良马 +4
精锐骑兵 +2
强化车轴 +4
木牛流马 +3（运输陆/水）
```

行军特技：

```text
强行 +5
长驱 +3
搬运 +5
操舵 +4
```

全部为直接整数加法。

特别规则：

```text
骑兵同时有强行和长驱：
先判强行
强行命中后直接跳过长驱
=> 只 +5，不是 +8
```

运输：

```text
陆上：剑兵基础20 + 运输固定5
水上：走舸基础16 + 运输固定5

木牛流马 +3
搬运 +5
水上再可叠加操舵 +4
```

因此木牛流马+搬运的陆上运输为33；水上再配操舵也是33。


## B5 关键纠错

ZOC 不应实现成 terrain cost 额外加值。

```text
正常支付目标格地形移动成本
→ 若目标格处于敌方ZOC且未被无视
→ 本回合停止继续扩展移动
```

PC-PK1.1 原参数地址：

```text
005A369D 陆上ZOC开关
005A36A4 水上ZOC开关
005A36B8 陆上ZOC无视兵装范围
005A36BE 飞将
005A36CB 遁走
005A36D7 陆上ZOC无视命中
005A36DE 推进
005A36EB 水上ZOC无视命中
```

设施方面：

- 阵/砦/城塞、橹/投石台、军乐台/太鼓台等敌方所属设施会形成ZOC；
- 土垒、石墙、火种/火球等火陷阱无ZOC。

状态方面：

- 混乱：ZOC消失，empirical-high；
- 伪报：中文老实测写“消失”，日文长期Wiki写“保留”，当前公开逆向未恢复状态判断，保留 `conflicting-evidence`。
- 为使引擎可运行，暂用 `falseReportRetainsZOC=true`，明确标 `provisional-engine-rule / compatibilityAssumption`。


## B6 关键纠错

原函数已定位：

```text
005AF850 TacticSuccessRate
```

高度/地势不是通用攻防倍率，而主要作用于强制位移战法：

```text
枪：突刺、二段突
戟：熊手
骑：突击、突破、突进
```

方向：

```text
枪/骑：攻击者越高越有利
熊手：攻击者越低越有利
```

关键实现点：

- 判定使用本次行动开始格，而不是移动后实际发动格；
- 一级有利高差常见 +5；
- 二级常见 +10；
- 二段突/突进存在二级高差 +15 的稳定实测；
- 因此旧 `5 * heightDiff` 不能作为完整原作公式；
- 当前公开 `struct_map_grid` 尚未有被正式命名为 Height 的字段，原始 elevation 数据存储位置仍 open。


## B7 关键纠错

原程序不是“部队下水后永久把陆兵种改成船”，而是同时保留陆上/水上两套兵装信息：

```text
00495480 GetLandMobilityEquipID
00495490 GetNavalMobilityEquipID
00496160 GetTroopMobilityEquipID(troop, coord)
00912FE8 getTroopEquipmentIDs(..., onWater)
```

目标格地形决定行军兵装：

```text
7 河 → 水上
8 海 → 水上
其他 → 陆上
```

因此：

- 渡所不切到水军；
- 浅滩不切到水军；
- 港 terrain 本身也不是 naval branch；
- 川不可正常通行，不等于河。

水上战斗使用舰船 + 水军适性，不继续使用陆上枪/戟/弩/骑/兵器 profile。

运输队水上移动原函数固定映射兵装9（走舸），不会因为楼船/斗舰库存改变水上行军成本。

当前没有发现额外上船/下船移动税；但完整 `005A4540` 尚未逐指令恢复，所以跨陆水边界时两套总移动力上限的内部比较仍保留 exactness gap。


## B8 关键纠错

港关“属于哪座城市”与“当前属于哪个势力”是两套字段/关系：

```text
City.SubordinateHarborAndPassID[5]  // 静态母城
Harbor/Pass.CorpsID                 // 当前军团
Corps.PowerID                       // 当前势力
```

月度收入源码：

```text
GetForceID(port/pass)
GetForceID(parentCity)
→ 不同势力：本次无附属收入
→ 同势力：按母城当次钱粮的20%结算
```

比较的是 ForceID，不是 CorpsID，因此同势力不同军团仍有收入。

港关基础容量：

```text
金       10000
兵粮     100000
士兵     30000
枪戟弩马 各30000
```

PK扩展港关：

```text
金       40000
兵粮     400000
士兵     60000
枪戟弩马 各60000
```

注意“兵装3万→6万”只对应 `EquipmentCounts[4]`（枪戟弩马）。冲车～斗舰存于独立 `SiegeWeaponCounts[7]`，不能误写成6万；其精确库存上限本项仍 open。


## B9 关键纠错

堤防不是普通可建设施：

```text
原设施类型ID 0x18
不可建设
最大耐久 800
中立陷阱
```

原作只有四城有堤防：

```text
襄平 / 邺 / 下邳 / 寿春
```

静态地图格式已经明确有逐格：

```text
trap
flood
```

其中 `flood=1` 就是水坝破坏后的受淹格标记，因此不能只靠高度动态 flood-fill。

堤防击破后：

- 水攻立即结算；
- 不分敌我；
- 落在受淹格的野外部队直接全灭，不是固定兵损；
- 城市也受损，但耐久/兵力/治安/气力的精确原函数仍 open。

原 `00599710` 自动恢复函数的堤防专用分支：

```text
restore = trunc(maxDurability / 10)
```

800耐久即每旬 +80；击破后10旬回满。该分支绕过普通“附近有敌军则不恢复”判断，回满后重新设为完成、中立陷阱。


## C1 关键结论

原函数：

```text
0049E590 GetCityMoneyIncome
```

精确主公式：

```ts
rawMoney =
  city.BaseMoneyProduction
  + Σ(effectiveMarketYield)

M = floor(
  rawMoney
  * difficultyPercent
  * max(city.security, 50)
  / 10000
)
```

市场原始产量：

```text
Lv1 100
Lv2 120
Lv3 150
鱼市场 200
大市场 300
黑市 80
```

造币只加成 Lv1/2/3：

```text
100→150
120→180
150→225
```

大市场/鱼市场/黑市不吃造币。

市场合并未完成：

```text
Lv2未完成 → 按Lv1
Lv3未完成 → 按Lv2
```

征税/富豪：

```ts
H = floor(M/2)

普通 = M
富豪 = M + floor(M/2)
征税 = 3*H
富豪+征税 = 3*H + floor(H/2)
```

富豪只在月初触发，11日/21日只结征税半额。

港关每个 tick 取母城当次 base tick 的20%，且必须与母城当前 ForceID 相同；富豪的额外50%同样只在月初触发。


## C2 关键结论

原函数：

```text
0049E810 计算城市收粮
```

基础公式：

```ts
rawFood =
  city.BaseFoodProduction
  + Σ(farmYieldWithGranary)
  + Σ(militaryFarmYield)

difficultyAdjusted = difficulty(rawFood)

F =
  floor(
    difficultyAdjusted
    * max(city.security, 50)
    / 100
  )
```

设施：

```text
农场Lv1 1500
农场Lv2 1800
农场Lv3 2250
谷仓：普通农场 ×1.5
军屯农：floor(max(兵力,15000)/10)
```

军屯农不吃谷仓。

结算顺序：

```text
F
→ 丰作 ×1.5
→ 征收 ÷2
→ 米道
```

城市米道只在季初触发；但 PC-PK1.1 港关分支没有季度判断，因此“征收+米道”时港关在季度第2、3个月也会再 +50%，这是源码级特殊行为。

港关基础粮：

```ts
floor(cityBaseTick / 5)
```

且必须与母城同 ForceID。


## C3 关键结论

收入特技作用域来自：

```text
004CEAE0 GetSPSpecialSkillsArray
```

该函数按**当前城港关据点**生成“特技存在=1”的布尔数组，因此：

- 富豪/米道/征税/征收不是势力全局；
- 同城多个同名收入特技不叠加；
- 月初先扫描母城，港关后续直接复用母城收入特技结果，不会再扫描港关自己的收入特技。

逐 tick：

- 富豪只月初；
- 米道对城市只季初；
- 征税在 1/11/21 各 tick 重新按当前城市特技状态结算；
- 征收每月1日重新按当前城市特技状态结算。

源码还明确纠正旧攻略中的一个常见误解：

```text
征税 = floor(GetCityMoneyIncome / 2)
征收 = floor(GetCityFoodIncome(after harvest) / 2)
```

因此城市基础产出同样参与，不是只影响市场/农场设施。

丰作：

```text
struct_city.Disasters bit2 = 丰作
struct_city.DisasterPredictions bit2 = 丰作预定
```

粮食顺序：

```text
完整城市粮F
→ 丰作×1.5
→ 征收÷2
→ 米道
→ 港关取20%
```

丰作状态更新函数位于月度收入之前；产生概率、持续期、祈愿概率和早期无印丰作flag bug留到 C11 灾害专项。


## C4 关键结论

无印标准内政设施固定为9类：

```text
市场 / 农场 / 兵舍 / 锻冶 / 厩舍 / 工房 / 造船 / 造币 / 谷仓
```

PC-PK1.1 基础设施 ID 31～39 沿用这一序列。

基础数据：

```text
市场/农场：200金，500耐久，完成+30P
兵舍/锻冶/厩舍/工房/造船：300金，800耐久，完成+30P
造币/谷仓：400金，1000耐久，完成+50P
防御力均为6
```

机制分三类：

```text
收入：
  市场 / 农场

六角邻接放大：
  造币 / 谷仓
  → 相邻1格
  → ×1.5
  → 多个不叠加

命令容量：
  兵舍 / 锻冶 / 厩舍 / 工房 / 造船
```

原 city struct 直接保存：

```text
EmptyBarracks / EmptyForge / EmptyStable / EmptyWorkshop / EmptyShipyard
```

2006无印实测也确认同类军需设施数量影响的是“一回合内可执行命令次数”，而不是把单次征兵/生产量直接乘N。

无印没有吸收合并和 Lv2/Lv3；这是 PK 专属规则，后续 C6 单独处理。


## C5 关键结论

PK十设施：

```text
40 符节台
41 军事府
42 人才府
43 外交府
44 计略府
45 练兵所
46 大市场
47 鱼市场
48 黑市
49 军屯农
```

经济设施：

- 大市场：300/月，不吃造币，大都市1座；
- 鱼市场：200/月，不吃造币，有港城1座；
- 黑市：80/月，不吃造币，1月强拆，可多座；
- 军屯农：`floor(max(cityTroops,15000)/10)`，不吃谷仓。

练兵所：

```text
训练效果 ×1.5
只缩短舰船生产，不缩短攻具
舰船 turns: 10-q → max(2,8-q)
之后造船特技再÷2
```

符节台：

```text
旬AP恢复 +5
忠诚下降计算 +2
```

+2 位于通用忠诚下降分支，因此不只影响俘虏，也会加重该城本方武将在季初进入下降流程时的掉忠。

军事府 PC-PK1.1 已确认：

```text
训练 / 出征 / 输送 AP减半
军事设施/陷阱设置费 ×0.8
```

已展开的征兵、普通生产、攻具舰船生产执行函数没有军事府判定，不能按说明文字统一全部半AP。

人才府：

```text
探索 / 登用 AP减半
技巧研究 -2旬，最低1旬
```

外交府：

```text
外交AP减半
亲善金减半
```

计略府：

```text
计略AP减半
流言公式参数 10→12
```

参数10→12不等于最终成功率固定+20个百分点。


## C6 关键结论

PK 吸收合并已从“只有倍率和政治70”补成完整动作规则。

数据层：

```text
actionId 1 = 吸收合并

市场 31 -> 50 -> 51
农场 32 -> 52 -> 53
兵舍 33 -> 54 -> 55
锻冶 34 -> 56 -> 57
厩舍 35 -> 58 -> 59
```

官方说明书锁定：

```text
相邻同类
被吸收方必须Lv1
Lv1+Lv1 -> Lv2
Lv2+Lv1 -> Lv3
Lv3为上限
城市周围2格有敌军 -> 禁止
AP 10
金 100
```

合并进行中：

- 被吸收设施已经退出独立生效；
- 升级主体继续保留前一级效果；
- 市场/农场已由 0049E590 / 0049E810 直接验证“未完成Lv2按Lv1、未完成Lv3按Lv2”；
- 兵舍/锻冶/厩舍的通用“合并中仍有效”有官方说明书支持，但公开逆向尚未逐指令展开其命令 caller。

工期：

```text
政治 >= 70 -> 10日
政治 <= 69 -> 20日
```

该精确边界目前标 empirical-high；311MemoryResearch 只公开定位到 005D758B，未公布完整函数体。

每次合并 +10 技巧P 亦有多份同期资料一致记录，但同样暂不标 reverse-engineered。


## C7 关键结论

普通内政设施开发日数不再只保留一张 lookup 表。

综合政治：

```ts
P = p1 + floor((p2 + p3 + 1) / 3)
```

其中 `p1` 为最高政治，最多3名武将。

日文 Wiki 的全部开发门槛可以被下面模型逐格精确重建：

```ts
initialDurability = roundHalfUp(maxDurability / 4)
gainPerTurn = floor(P * 3 / 2)
turns = min(
  10,
  ceil((maxDurability - initialDurability) / gainPerTurn)
)
days = turns * 10
```

关键验证：

- 市场 D500：20日门槛126；P125时两旬后恰为499；
- 黑市 D200：40日门槛26；P25时四旬后恰为198；
- 铜雀台 D1300：20日门槛326；P325时两旬后恰为1299；
- 市场/农场、黑市、造币/谷仓、大/鱼/军屯农、五类军需、六类PK功能设施、铜雀台的全部门槛均精确吻合；
- 旧2ch实测直接记录市场开工时125/500，支持初始25%耐久解释；
- SIRE结构确认设施类型有最大耐久、建筑实例有当前耐久和ConstructionStatus。

证据边界：

311MemoryResearch 目前只定位到内政建设执行路径 `005BC4C1`，没有公开完整开发日数函数体。因此本式标 `empirical-exact table reconstruction`，不标 `reverse-engineered function`。

下一项：C8 商人 / 粮食交易。

## C8 关键结论

商人命令已经从“只有买卖公式”补成完整动作边界：

```text
都市命令
AP 20
固定费用 0
即时结算
城市周围2格有敌军 -> 禁止
每都市每旬最多1次
```

结构证据：

```text
city +0x7C TradePrice
city +0x7D HasMerchant
city +0xA4 CityActions
  bit1 = 已商人
```

交易主体公式：

```ts
buyFood = gold * price * b
sellGold = food / price * b * 0.8
```

其中 `b = tradeEffect(politics)`。

已锁定：

- 政治50 -> b=100%；
- 买粮没有固定手续费；
- 卖粮固定损失20%；
- UI显示百分比会丢失真实小数精度；
- 政治97/98/99实际效果约113.3154%/113.6374%/113.9612%；
- 同价往返盈利条件 `0.8*b²>1`，边界约政治93；
- 商人 +5 政治经验，36旬/年与“单城年最大180”再次验证每旬一次。

明确未锁：

- `tradeEffect(politics)` 原始闭式；
- 整数截断完整顺序；
- 商人随机出现/消失概率；
- 每月粮价的精确转移分布。

SIRE 后来的“交易优势”“商贸城市25%商人出现”等属于扩展参数，不作为原作证据。

下一项：C9 行动力。

## C9 关键结论

行动力已从“经验公式”进一步拆分证据层级。

核心：

```ts
leaderParam = 26 + max(floor(max(leadership, charisma)/5) - 6, 0)
cityParam = min(10 * (corpsCityCount - 1), 50)
officerParam = sum(top6(min(officersAtBase, 10)))
adviserParam = adviser ? 0.70 + 0.01 * floor(adviserIntelligence/2) : 1.0

coreRecovery = floor((leaderParam + cityParam + officerParam) * adviserParam)
[PK] recovery = coreRecovery + 5 * completedTalismanPlatforms
currentAP = min(255, previousRemainingAP + recovery)
```

SIRE结构确认：`ActionPoints` 属于 `struct_corp`，军团长也属于 corp；军师 `AdvisorID` 属于 `struct_force`。这与“每军团独立计算、势力军师共用”的实测一致。

刘禅存档：`(30+20+22)*1.2=86.4 -> 86`，再加1座符节台得到91，锁定了最终向下取整与符节台在取整之后追加的顺序。

2006资料的“新增行动力最大180”只适用于无印核心公式 `150*1.2=180`；PK符节台追加后不能再把180当统一硬上限，明确的最终当前AP上限是255。

证据边界：跨军团拆分母城/港关时武将参数归属、官职/宝物修正读取 base 还是 display stat、行动力恢复主函数体仍 open。

下一项：C10 治安。

## C10 关键结论

治安系统已拆成四条独立精确链：巡查、征兵副作用、收入倍率、换季自然下降。

巡查：

```ts
patrolGain = floor(sumLeadership / 28) + 2
```

官方锁定100金、20AP、最多3人、每都市每旬一次；敌军2格内效果下降。普通公式来自长期实测，敌军半减的奇数取整仍保留 empirical-high。

征兵掉治安由 PC-PK1.1 `005C3A50` 直接锁定：

```ts
orderLoss = floor(actualRecruited / (sumCharisma + 100))
```

`actualRecruited` 已经过名声/兵舍/超级AI/兵临城下/城市上限修正，所以名声并不存在独立第二次“治安×1.5”，而是先放大实际征兵数。

收入：`effectiveSecurity=max(security,50)`，50～100线性，因此80只是防贼安全线，不是收入断点。

换季下降：

```ts
base=floor(max(1,90-governorCharm)/10)
loss=min(5, base + GetRandomX(3))
```

PK整备政令为精确50%整次免降，不是损失减半。

贼/异民族：治安<80才可能新出根城；已有根城不会因治安恢复到100而消失。亲○防对应异族根城；威压的80→60阈值模型采用 empirical-high，并保留早期资料冲突标记。

没有可靠证据证明低治安直接提高瘟疫/蝗灾概率；该问题留到 C11 灾害。

下一项：C11 灾害。

## C11 关键结论

灾害系统不是季初即时 roll 后立刻丢弃，而是城市持久状态：

```text
struct_city +0x9C Disasters
  bit0 疫病 / bit1 蝗灾 / bit2 丰作

struct_city +0xA0 DisasterPredictions
  bit0 疫病预定 / bit1 蝗灾预定 / bit2 丰作预定
```

月初调用顺序已定位：

```text
00590C30 MonthlyAction
→ 0058F4E0 季节/丰作状态处理
→ 00590490 钱粮收入
```

丰作 current flag 的收入效果为源码级：

```ts
food = floor(baseFoodTick * 3 / 2)
```

之后才进入征收、米道与港关20%。

风水只阻止新的疫病/蝗灾，不会治疗已经发生的灾害；祈愿只确认提高丰作倾向，精确概率修正仍 open。

蝗灾：确认破坏农场并损失粮食；Lv1 被拆时 -30P，Lv3 不拆，Lv2及直接粮损量仍 open。

疫病：确认减少驻军并恶化武将健康；精确兵损、患病 RNG 与持续时间仍 open。

旧 provisional `蝗灾5% / 疫病5% / 丰作10% / 每年1月判定 / 疫病每旬5–10%兵损 / 30%患病 / 持续1–2季` 已从规则正文撤回。

SIRE 的 `00911238 ReducePopDueToDisaster / 009112E0 DisasterPopLossFactors` 属于扩展代码区，只能说明 SIRE 支持灾害人口损失扩展，不能反推 San11PK.exe 原版百分比。

C 维度完成。

下一项进入 D 维度：D1 武将生命周期 / 状态字段。

## D1 关键结论

旧的线性状态机：

```text
未登场 -> 未发现 -> 在野 -> 所属 -> 俘虏 -> ...
```

已撤回。PC-PK1.1 的 `struct_person` 是多维正交状态。

真正的 `Identity` 只有9种：

```text
0 君主
1 都督
2 太守
3 一般
4 在野
5 俘虏
6 未登场
7 未发现
8 死亡
```

重要纠错：

- 军师不在 Identity 枚举里，而是 `struct_force.AdvisorID`；
- 出征/在部队由 `IsInArmy / GetPersonArmyID / Location` 表示；
- 执行任务由 `Mission + MissionParameters[6] + MissionDuration` 表示；
- 已行动、已褒奖、死亡预定位于 `Flags`；
- `markedForDeath` 与 `Identity=DEAD` 是两回事；
- 健康为独立 `HealthLevel=0..3`，体力为独立 0..100；
- `FormerAllegiance / ForbiddenLord / ForbiddenMonths / CaptiveMonths` 均为独立运行时字段；
- `YearOfDebut / YearOfBirth / YearOfDeath / CauseOfDeath / ScheduledLord` 是基础生命周期数据，不等于当前 Identity。

已定位显式转换 helper：

```text
004898F0 SetPersonIdentity
004A5B20 SetPersonAsNomadicPerson  // 未发现 -> 在野
004A5780 ClearPersonTasks
004A73A0 / 004A7410 SetPersonTask
```

日文推荐事件也明确把“已到登场年”与“Identity=在野/未发现”分开判断，并允许未发现武将直接被登用；失败时又可能转成在野。因此生命周期不能硬编码成固定顺序链。

仍 open：普通登场 caller、死亡预定→真正死亡、伤病自然恢复、Mission 0..43 完整语义、俘虏/禁仕计数器精确更新。

下一项：D2 登场 / 寿命 / 死亡。

## D2 关键结论

登场：

- `YearOfDebut` 是时间门槛，与 `Identity` 分离；
- 诸葛亮在200年已20岁仍未登场，沙摩柯34岁仍未登场，因此不存在通用“15岁自动登场”；
- `struct_scenario` 另有 `IgnoreAge / ComeOnStage`，`struct_person` 另有 `ScheduledLord`；普通自动登场 caller 仍未公开展开。

寿命与死亡：

```text
struct_person.YearOfDeath / CauseOfDeath
0048A000 GetDeathYear
Flags.markedForDeath
Identity = DEAD
```

属于不同层次，不能合并。

`struct_scenario` 又明确分开：

```text
DieInBattleSetting
Lifetime
```

所以自然寿命 RNG 与战场战死概率必须分开。

经验边界：自然死通常在有效没年当年死亡，少数延后2～3年；不自然死会额外延寿且与没年年龄负相关。旧“最多15年”不是 hard cap。孙策事件官方条件使用“预定死亡年”，胜于吉明确延寿20年。

死亡 flag 也不是死亡本身：诸葛亮北伐要求死亡flag未立，诸葛亮之死则等到自然死条件后才真正死亡。

健康：原结构 `HealthLevel=0..3`，夷陵决战甘宁94武力在重伤时47、轻伤时75，直接支持当前 100% / 80% / 50% / 20% 模型；旧 -20/-40/-60 表与实机冲突，继续不采用。

仍 open：普通登场 caller、Lifetime/ComeOnStage/IgnoreAge 枚举、`GetDeathYear` 函数体、markedForDeath触发概率与真正死亡延迟、一般沙盘伤病恢复。

下一项：D3 五维 / 适性 / 成长。

## D3 关键结论

原 `struct_person` 明确把五维拆成：基础/素质、五维成长型、五维经验、成长后属性、无伤病显示值、实际显示值等多个层次。

九种成长型编号已锁定：

```text
0 超持续
1 持续
2 早熟
3 早熟持续
4 普通
5 普通持续
6 晚成
7 超晚成
8 开眼
```

`struct_scenario.AttrChange` 只控制年龄盛衰；能力变动关闭后，经验成长仍继续。

年龄成长：`0048A030 GetPersonAttrChangeCoef` + `0048A390 GetPersonGrowthAttr` 已定位；日文 Wiki 的 6～101 岁实测表可作为 growthType×age lookup。早熟18岁峰值、维持25、普通30、晚成40、超晚成50；开眼41～55岁存在二次成长。低素质乘百分比的精确整数取整仍 open。

五维经验：每100经验能力+1，超过部分保留；但旧“没到100即可无限练”已撤回。普通经验单独或与PK能力研究合计，对同一能力的培养增量约封顶 +30；刘禅统率素质3最多约33是直接回归锚点。

遗迹属于 `raiseTalent(+1)`，明确增加“素质”而不是经验，因此可绕过普通培养 +30 限制。

适性经验：C→B 150、B→A 200、A→S 250；无五维+30上限。PK能力研究直接升适性时保留已有适性经验，例如B+192经验研究到A后距S只剩58。

指导：只对同一野外部队的出阵经验×2；据点命令不加倍；本人通常不吃自身指导，两名指导同队时可互相生效但不×4。

仍 open：年龄系数函数体、低素质取整、宝物/伤病等其余后段修正的完整合成顺序、自然适性跨档的超额余数、Vanilla/PK +30边界。D10 已锁定官职加成位于核心属性后段并在最终100封顶之前。

下一项：D4 人际关系。

## D4 关键结论

关系层不是一个统一好感分。`struct_person` 分开保存：

```text
FatherID / MotherID / SpouseID / SwornSiblingID
IntimatePersonsID[5]
HatedPersonsID[5]
BloodRelation / Generation / Compatibility
```

亲爱/嫌恶是有方向的；夫妻、义兄弟、血缘使用独立 helper。

PC-PK1.1 支援攻击参数已由内存地址锁定：

```text
夫妻/义兄弟 50%
亲爱         30%
辅佐         30%
血缘         20%
```

并且只有主将关系生效；亲爱必须是支援主将亲爱攻击主将。

副将统率/武力补正的 PS2 精确实测：

```text
夫妻/义兄弟：差值 100%
亲爱：       差值 1/2
血缘：       差值 1/3
普通：       差值 1/4
```

旧仓库漏掉“血缘=1/3”，已同步修正 `docs/rules.md`、`确定规则.md`、`04-military.md`。

若部队任意两人之间存在嫌恶，包括两名副将互相嫌恶，则整队全部副将能力补正归零；另一名配偶/义兄弟副将也不能保留补正。

登用中的亲爱/嫌恶/夫妻/义兄弟是连续概率之前的硬分支，不应折算为统一百分比加减。完整优先级留 D5。

旧“处斩俘虏没有厌恶或报复”已拆开：处斩本身不会自动新增嫌恶，但已有君主↔俘虏嫌恶会让 COM 走必处斩分支。

仍 open：PC-PK 副将补正函数体、亲爱会心率精确加成、远亲血缘支援边界、Vanilla支援率版本差异、外交嫌恶连续公式。

下一项：D5 登用优先级与普通概率。

## D5 关键结论

PC-PK1.1 普通登用控制流：

```text
004AFD60
→ 004AF7D0 hard gate（必成/必败、关系、禁仕）
→ 005C4F80 GetHiringSuccessRate
→ 正常第三参数0时，用005BA4C0确定性值比较
```

普通人才登用：

```ts
dateKey = day*7 + month*5 + year*3
p = GetHiringSuccessRate(target, executor, 0, dateKey)
success = deterministicValue(dateKey, IDs, loyalty, charm, affinityDiff, ...) < p
```

异地登用把发令日 dateKey 存进 MissionParameter[2]，抵达后继续复用，不按抵达日重算日期键。

第三参数非0时是另一种模式：

```ts
factor10 = min(10, 15 - 2*Ideals)
p2 = floor(p*factor10/10)
result = runtimeRandom(p2)
```

正常本地/异地人才登用都明确传0，所以该义理倍率不能套到普通玩家登用。

探索发现人才后的当场登用走独立 wrapper；首次 deterministic 判定失败后：

```ts
executorCharm - affinityDiff(executor, executorLord) + p > 80
```

则进入舌战。

9条关系/忠诚硬门槛的顺序继续按长期 Wiki/2ch 实测保留 empirical-high；PC 反汇编只确认 `004AF7D0` 一定在概率函数之前，尚未公开该函数体。

旧总规则自拟“(100-忠诚)*2 + ...”登用分数已正式删除。

仍 open：`004AF7D0` 函数体、`005C4F80` 连续概率闭式、`005BA410/005BA4C0` 确定性生成算法、96门槛的义理编码映射、非0 caller 完整业务语义。

下一项：D6 相性 / 义理 / 野望 / 汉室。

## D6 关键结论

相性函数 `00489F80` 已逐指令恢复：

```ts
raw = abs(a-b)
diff = min(raw, 150-raw)
```

原作正常相性域最大差75；1与149只差2。

忠诚数据层也已锁定：`struct_person+0xAC` 为 byte 0..255，原列表 getter 只在显示时把>=100压成100。因此隐藏忠诚>100是真实状态，不能在引擎数据层 clamp 到100。

自然掉忠：己方普通武将只在换季判定；相性差>=25，或低/较低义理+高/较高野望时进入候选。旧“每月、相性>30”已从总规则撤回。`仁政`阻止同都市自然掉忠。

D9补回 `0058E510` 完整逐指令文本后，人心掌握与俘虏分支可升级：人心掌握以 `Random(0..2)>=1` 精确实现2/3免降；俘虏跳过季初限制与仁政，但保留亲爱/配偶/义兄弟/父母子女豁免。进入数值路径后为两个独立 `Random(0..2)` + 符节台`+2` + 特定君主义理/野望附加项。旧“每旬-1~2、符节台翻倍、基础闭式未知”均撤回。

汉室是三档事件mask而非持续倍率：普通授予/自称+3/+3，重视+6/+1，无视+1/+6；王/公×2，皇帝×3。拥立/废立对汉室重视武将+10/-10；魏帝即位等历史事件可另有专用±20。

仍open：欠薪/流言/事件等非自然忠诚路径，以及跨版本回归；`0058E510` 主路径本身已不再列 open。

下一项：D7 太守 / 都督 / 军师。

## D7 关键结论

角色数据层分离：

```text
force.AdvisorID     -> 军师
corps.CorpsLeaderID -> 都督
city.PrefectID      -> 太守
```

都督/太守属于 Person Identity；军师不是 Identity。

正常玩法中太守/都督不能直接点名任命。日文 Wiki 的稳定主规则是“可指挥兵数最大者优先，同值统率优先”，并存在有官职者优先于完全无官职者的边界；旧2ch对都督深层 tie-break 有“官职顺序”说法，因此 selector 完整函数体仍 open。

官方说明书锁定军师：智力>=70才能任命；智力越高助言越准确；任免无金、无AP、无期间。军师是势力唯一 AdvisorID，所有军团共享。

C9 行动力中军师倍率：

```ts
0.70 + 0.01*floor(INT/2)
```

正常70/80/90/100智对应1.05/1.10/1.15/1.20。

太守职责已拆清：魅力控制换季治安下降；统率>=66开始降低据点守兵损失；武力>=66开始提高据点反击；超过太守可指挥兵数的驻兵不继续提高据点攻防；港关/堤防无太守不恢复耐久，恢复量看太守政治。

军师助言只是预测层，D5 的硬关系登用可出现“军师×但真实必成”，因此不得用 advisorSaysYes 直接决定命令结果。

下一项：D8 忠诚 / 俸禄 / 奖赏。

## D8 关键结论

官方褒赏命令已经锁定：

```text
100金 / 人
5行动力 / 人
即时
无执行武将
一次可多人
同一武将每回合最多一次
显示忠诚100或正在部队中时不可执行
```

`00489140 HasPraised` 是“一人每回合一次”的结构证据。

褒赏忠诚增量不是固定值。Vanilla逐旬实录直接出现 +5/+8/+9，并明确通过S/L刷高结果；君主魅力影响褒赏效果，但 RNG/魅力/义理的完整闭式仍 open。

忠诚底层仍按 D6 的 byte 0..255 保存，因此一次从真实99开始的褒赏可推到108而UI只显示100；数据层不能 clamp 到100。

授予宝物：官方锁定10AP、0金，宝物价值越高忠诚上升越多；value→gain精确映射仍open。没收宝物会降忠，-30有稳定PC/PK实机记录，但当前只标 empirical-high。

普通武将官职升降本身不改变忠诚；爵位授予/自称造成的忠诚变化属于势力事件，不与普通任官混用。

PC-PK1.1 `00590490 MonthlyIncomeAndExpend` 已锁定月度支出顺序：

```text
本月钱粮收入
→ 俘虏维护费（50金/人）
→ 现役武将官职俸禄（0049F2A0求和）
→ 资金不足后果
```

俸禄够钱则直接全额扣除；不足时转 `0058D5E0` 欠薪忠诚下降准备，后段 `0058C190` 处理忠诚。旧“季度付俸、钱不够全城-10～30”已撤回。

同时修正旧行动力表：人才府只减探索/登用，不减褒赏/移动/召唤/授予。官方值为褒赏5AP/人、移动20AP、召唤20AP、授予10AP。

仍 open：褒赏增量闭式、宝物value→忠诚映射、没收-30原函数、欠薪具体影响对象与点数、欠薪时是否存在更细的部分支付逻辑。

## D9 关键结论

PC-PK1.1 的俘虏系统这次从“描述性规则”推进到了三条可执行主链。

**1. 击破捕获主函数 `004B1280`：**

```text
目标基值 = floor((120 - max(武力, 智力)) / 3)
合围倍率 = 无合围/有铁壁时1，否则为周围己方部队数
特殊context 3/4 = ×1.5（业务语义仍open）
超级难度玩家击破AI = 再÷2
捕缚 = +100
戟兵战法 = 最终再+30
两次均封顶100
```

强运(skill 32)是源码级不可捕获硬分支。名马对捕缚的反制由日文Wiki长期稳定确认，但主函数前置 `004A0590` 尚未完成语义映射，因此不把该 helper 擅自命名。血路另有独立路径，部队全灭与据点陷落的边界继续拆开。

**2. 自然逃亡 `00582BE0`：**

```ts
if (CaptiveMonths < 2) noRoll
q = max(1, CaptiveMonths - 2)
stat = max(30, max(WAR, INT))
p = max(1, floor(q*q*stat/150))
```

只对有效城市/港/关设施内的俘虏 roll，因此“野外部队携带俘虏不会走自然逃亡、回据点后才会”与源码一致。函数本地没有100上限；超100参数如何由共用概率helper处理仍open。

**3. 月度忠诚与维护：**

俘虏在 `0058E510` 中跳过季初限制和仁政，但保留亲爱/配偶/义兄弟/父母子女豁免；人心掌握精确为2/3免降。进入掉忠值计算后：

```text
Random(0..2)
+ 符节台2
+ [君主义理最低且野望最高时 floor((4-俘虏义理)/2)]
+ Random(0..2)
```

`00590490` 的维护费则是另一条路径：

```text
可支付人数 = min(俘虏数, floor(当前金/50))
维护费 = 可支付人数×50
付不起人数 = 俘虏数-可支付人数
-> 0058C320/0058D1D0 准备
-> 0058D430 实际释放/逃走处理
```

所以“自然逃亡”和“没钱养导致释放/逃走”不能合并成一个概率。

旧“近战30% / 位移40% / 包围70%”已从PC-PK1.1主规则撤回；这些只保留为历史经验样本，不再覆盖逆向公式。

仍 open：`004A0590`精确语义、context 3/4的业务名、血路城陷边界、概率helper超100行为、资金不足释放排序、释放后的默认禁仕月数与释放技巧P。

## D10 关键结论

D10 已从“静态表”推进到原数据结构与自动 selector。

数据层：

```text
person +A4 = OfficeID
person +AE = Merit
struct_office[81]
  +2C TroopNumber
  +30 AttrIncreaseType
  +34 AttrIncrease
  +35 Salary
  +36 Rank
```

公开有名官职为80个；第81项内部语义仍不命名。

功绩门槛由原EXE的 `×0xFA0 = ×4000` 直接锁定，对应0/4000/.../36000；人物功绩上限 `0xEA60=60000`。

指挥兵数：

```text
无官 = 5000
有官 = office.TroopNumber
军制改革 = +3000
普通最高 = 15000 + 3000 = 18000
```

原地址同时确认军制改革+3000作用于实际部队上限和封官界面。

官职能力加成也不是UI装饰。`0048A110` 的原属性计算明确读取 OfficeID/AttrIncreaseType/AttrIncrease；官职加成位于核心能力计算之后，最后仍进入原版五维100封顶。

自动封官 `005FAF00`：

- 先调用 `005FA4D0` 检查任官资格；
- 真实忠诚<90直接不选；
- 一个评分模式中：
  - 最高档：统率+智力>=150，分数=统率+智力+忠诚权重；
  - 武官：max(统,武)>=60，分数=统率+武力+忠诚权重；
  - 文官：max(智,政)>=70，分数=max(智,政)+忠诚权重；
  - 忠诚权重 = `9 * min(trueLoyalty-90,10)`；
- 另一模式用 `max(统,武)` 与 `max(智,政)` 做文武倾向分流；
- 最佳候选用严格“大于”替换，因此同分保留上游列表中先出现者。

重要证据边界：60/70/150属于其中一个 caller 分支，**不能强行套给所有自动封官场景**；`005FA4D0`、`005FA650` 和 caller flag 语义仍open。

静态数据同步修正：`ranks.json` 的“无爵位”从错误的 `citiesRequired=0` 改为原表“仅1都市”。

D维度到此完成。

下一项进入 E1：部队编成。
