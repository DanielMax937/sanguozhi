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

丰作状态更新函数位于月度收入之前；产生概率、持续期、祈愿概率和早期无印丰作flag bug留到 C12 灾害专项。


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
