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
| B6 | 高度与高低差 | 下一项 | pending | ⬜ |

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
