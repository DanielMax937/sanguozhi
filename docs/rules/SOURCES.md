# 主要来源

## 官方资料

- 《三國志11 with パワーアップキット》官方说明书（Steam 附带）
  https://cdn.akamai.steamstatic.com/steam/apps/628070/manuals/32sangokushi11wpk_manual.pdf

## 游民星空（优先中文核对）

- 行动力点数相关计算公式深入研究
  https://www.gamersky.com/handbook/200603/21611.shtml
- 买卖粮的计算公式
  https://www.gamersky.com/handbook/200712/89446.shtml
- 三国志11专题/攻略资料（战法、技巧、特技等）
  https://www.gamersky.com/handbook/200603/21610.shtml
- PK相关攻略资料
  https://www.gamersky.com/handbook/200609/33179.shtml
- 全剧情发生条件官方资料
  https://www.gamersky.com/handbook/200809/124174_7.shtml
  https://www.gamersky.com/handbook/200809/124174_8.shtml
  https://www.gamersky.com/handbook/200809/124174_10.shtml

## 日文三國志11攻略Wiki

- 内政 https://w.atwiki.jp/sangokushi11/pages/74.html
- 战争 https://w.atwiki.jp/sangokushi11/pages/85.html
- 技巧研究 https://w.atwiki.jp/sangokushi11/pages/90.html
- 兵科 https://w.atwiki.jp/sangokushi11/pages/91.html
- 伤害验证 https://w.atwiki.jp/sangokushi11/pages/92.html
- 亲爱/嫌恶 https://w.atwiki.jp/sangokushi11/pages/95.html
- 爵位/官职 https://w.atwiki.jp/sangokushi11/pages/111.html
- 舌战 https://w.atwiki.jp/sangokushi11/pages/141.html
- 地理 https://w.atwiki.jp/sangokushi11/pages/149.html
- 能力值 https://w.atwiki.jp/sangokushi11/pages/1598.html
- 单挑 https://w.atwiki.jp/sangokushi11/pages/2481.html
- 隐藏数据 https://w.atwiki.jp/sangokushi11/pages/983.html
- 各种经验 https://w.atwiki.jp/sangokushi11/pages/79.html
- 遗迹/庙 https://w.atwiki.jp/sangokushi11/pages/968.html
- 历史事件 https://w.atwiki.jp/sangokushi11/pages/88.html
- Q&A（换季治安实测） https://w.atwiki.jp/sangokushi11/pages/1152.html
- 特技一覧（踏破/解毒） https://w.atwiki.jp/sangokushi11/pages/13.html
- 单挑检证补充（错误简单武力差表撤回） https://w.atwiki.jp/sangokushi11/pages/2484.html

## 逆向/实测研究

- 311MemoryResearch：三国志11PK 内存/汇编逆向资料
  https://github.com/sjn4048/311MemoryResearch
  - Func-内政01-计算征兵数量
  - Func-内政02-执行征兵

- PTT 精华区：战法、俘虏、强制单挑、战死等概率公式
  https://www.ptt.cc/man/Koei/D802/D96B/D4AA/M.1371726847.A.536.html
- 日文 Wiki 小技巧：忠诚自然下降触发条件
  https://w.atwiki.jp/sangokushi11/pages/15.html

- 游侠论坛：三国志11战斗伤害计算公式
  https://game.ali213.net/thread-5983352-1-1.html
- 游侠知道：外交判定公式
  https://zhidao.ali213.net/q/13047392.html
- 百度知道转载的完整外交公式
  https://zhidao.baidu.com/question/693845718520080364/answer/2870151990.html

## 仓库已有交叉资料

- docs/rules.md
- 确定规则.md
- 缺少的数据.md
- docs/open-questions.md
- docs/sources/*


## 第五轮未决规则专项来源

- 游民星空：100忠诚挖人实验
  https://www.gamersky.com/handbook/200603/21923.shtml
- 游民星空：190刘虞开局（攻陷物资保留公式）
  https://www.gamersky.com/handbook/200703/57518.shtml
- 游民星空：军团委任心得
  https://www.gamersky.com/handbook/200706/66728.shtml
- 游民星空：全剧情条件（曹操之死等）
  https://www.gamersky.com/handbook/200809/124174_9.shtml
- 日文Wiki：委任/内政 FAQ
  https://w.atwiki.jp/sangokushi11/pages/8.html
- 日文Wiki：换季治安实测
  https://w.atwiki.jp/sangokushi11/pages/1152.html
- 日文Wiki：单挑连续公式负证据
  https://w.atwiki.jp/sangokushi11/pages/2484.html
- 日文Wiki：刘备之死/继承
  https://w.atwiki.jp/sangokushi11/pages/942.html
- 3DM：SIRE v1.26 参数说明（换季治安上限、政令整备概率）
  https://dl.3dmgame.com/patch/26091.html
- 311MemoryResearch：季初城市治安下降原函数 `0058D6D0`
  https://github.com/sjn4048/311MemoryResearch/blob/master/内存资料/整理/Func-自动05-城市治安下降.txt
- 311SireCustomizedPackageDev：`GetRandomX` / `ProbabilityCheck` 地址与语义
  https://github.com/sean2077/311SireCustomizedPackageDev/blob/dev/material/内存地址汇总.md
- 轩辕春秋：San11Sire 修改器讨论
  https://www.xycq.org.cn/forum/viewthread.php?tid=209820
- 社区长期整理：PK内政技巧概率
  https://www.sohu.com/a/411270684_120015190
- 巴哈姆特：计略会心延长异常/燃烧
  https://forum.gamer.com.tw/Co.php?bsn=60001&sn=380559


## 2026-09-30 排除原15项后的源码审计来源

- 311MemoryResearch：月度/旬度自动处理、收支、地形移动、地图格研究
  https://github.com/sjn4048/311MemoryResearch
  - `函数[每月例行处理].txt`
  - `整理/Func-收支01-每旬收钱.txt`
  - `整理/Func-收支03-每月钱粮兵装收支.txt`
  - `整理/Func-内政01-计算征兵数量.txt`
  - `整理/Func-内政11-计算生产数量.txt`
  - `AI专题/函数[AI出兵策略].txt`
  - `函数[部队攻击].txt`
  - `函数[设施攻击].txt`
  - `函数[计算部队进入某地格消耗的移动力].txt`
  - `函数[计算部队属性].txt`（移动力基础值、技巧/特技加成、强行/长驱优先级、搬运/操舵叠加）
  - `地形研究.txt`

- 311SireCustomizedPackageDev：原函数命名、结构体、地图/战法/兵装字段
  https://github.com/sean2077/311SireCustomizedPackageDev
  - `material/内存地址汇总.md`
  - `material/结构体汇总.md`
  - `material/数据汇总.md`

- sango_infinity：原 311 数据兼容层以及标注由 s11_sys_duel.h / cpp 翻译的单挑核心
  https://github.com/tankyc/sango_infinity
  - `Project/Assets/Sango/Scripts/Game/Duel/Duel.cs`
  - `Project/Assets/Sango/Scripts/Map/Render/Map/MapGrid.cs`
  - `Build/Content/Data/Common/TroopTypes.json`

- 日文三國志11攻略Wiki：行动顺序、兵科/地形/移动交叉实测
  https://w.atwiki.jp/sangokushi11/


### B5 ZOC 专项

- 游侠 sergi：PC-PK1.1 ZOC 开关与飞将/遁走/推进地址
  https://game.ali213.net/thread-2168294-1-1.html
- 游民星空：一兵流移动力/ZOC 实测
  https://www.gamersky.com/handbook/200809/124600.shtml
- 日文 Wiki FAQ：ZOC 为部队/设施相邻6格，进入即停止
  https://w.atwiki.jp/sangokushi11/pages/8.html
- 日文 Wiki 特技：飞将/遁走/推进陆水边界
  https://w.atwiki.jp/sangokushi11/pages/13.html
- 日文 Wiki 战争：土垒/石壁/火罠无ZOC；混乱无ZOC；伪报ZOC保留的冲突证据
  https://w.atwiki.jp/sangokushi11/pages/85.html


### B6 高度 / 地势专项

- SIRE 地址表：`005AF850 TacticSuccessRate`
  https://github.com/sean2077/311SireCustomizedPackageDev/blob/dev/material/内存地址汇总.md
- 日文 Wiki 兵科：位移战法高低差方向、行动开始格判定
  https://w.atwiki.jp/sangokushi11/pages/91.html
- 日文旧帖：高低差只显著影响枪/戟/骑的位移战法，弩未观察到同类修正
  https://w.atwiki.jp/sangokushi11/pages/1945.html
- SIRE v1.26 参数说明：原战法基础成功率与高低关系摘要
  https://dl.3dmgame.com/patch/26091.html
- 三国瑜云：坡地/凸地/平地分类与二段突/突进两级高差 +15 实测
  https://vincecarter0315.pixnet.net/blog/posts/14217116027


### B7 水陆/舰船切换专项

- SIRE 地址表：
  - `00495480 GetLandMobilityEquipID`
  - `00495490 GetNavalMobilityEquipID`
  - `00496160 GetTroopMobilityEquipID`
  - `00912FE8 getTroopEquipmentIDs`
  https://github.com/sean2077/311SireCustomizedPackageDev/blob/dev/material/内存地址汇总.md
- SIRE `struct_troop`：EquipmentStatus / CurrentUnitType / ActualUnitCategoryProficiency
  https://github.com/sean2077/311SireCustomizedPackageDev/blob/dev/material/结构体汇总.md
- 311MemoryResearch：
  - `函数[计算部队进入某地格消耗的移动力].txt`
  - `函数[计算部队属性].txt`
- 日文 Wiki 兵科：走舸/楼船/斗舰、水军适性与舰船战法
  https://w.atwiki.jp/sangokushi11/pages/91.html
- 日文 Wiki 地理：渡、浅滩、河/海的地形移动区分
  https://w.atwiki.jp/sangokushi11/pages/149.html
- 赤壁决战数据：同一部队明确同时记录陆兵科+舰船
  https://w.atwiki.jp/sangokushi11/pages/2159.html


### B8 港关容量 / 所属专项

- SIRE 结构体：
  - `struct_city.SubordinateHarborAndPassID[5]`
  - `struct_harbor / struct_pass.CorpsID`
  - `struct_corp.PowerID`
  https://github.com/sean2077/311SireCustomizedPackageDev/blob/dev/material/结构体汇总.md
- SIRE 地址表：
  - `0047B2B0 GetForceID`
  - `0047BC50 GetNthHarborIDOfCity`
  - `00483810 GetCorpIDForHarborOrPass`
  - `0048D7E0 / 4820 / 4860 / 48A0` 港关各容量上限 getter
  https://github.com/sean2077/311SireCustomizedPackageDev/blob/dev/material/内存地址汇总.md
- 311MemoryResearch：`Func-收支03-每月钱粮兵装收支.txt`，含港关20%与同势力判断
- 日文 Wiki 都市数据：港关与母城对应、20%收入
  https://w.atwiki.jp/sangokushi11/pages/77.html
- 日文 Wiki 技巧研究：扩展港关容量
  https://w.atwiki.jp/sangokushi11/pages/90.html
- 中文 PK 技巧表：扩展港关 10000/100000/30000 → 40000/400000/60000
  https://read01.com/zh-hk/m6LA4P.html


### B9 堤防 / 水攻专项

- 311MemoryResearch：`整理/Func-自动01-耐久恢复.txt`
  - 原设施类型 `0x18` 堤防专用恢复分支
  - 每旬恢复最大耐久 1/10
  - 回满后重设建设完成 / 中立
- sango_infinity：San11GridData 静态地图兼容结构
  - `trap: 0无 / 1堤防 / 2落石`
  - `flood: 水淹格`
  https://github.com/tankyc/sango_infinity/blob/main/Project/Assets/Sango/Scripts/Map/Render/Map/MapGrid.cs
- PK bin 编辑器说明：水淹=1 表示水坝破坏时被淹
  https://www.3h3.com/patch/264861.html
- 日文 Wiki 都市表：只有襄平、邺、下邳、寿春有堤防
  https://w.atwiki.jp/sangokushi11/pages/77.html
- 日文 Wiki 小ネタ：破堤即水攻、范围内敌我部队全灭
  https://w.atwiki.jp/sangokushi11/pages/15.html
- 游民星空 2006 实测：800耐久、破堤水攻、堤防回满后可再次发动
  https://www.gamersky.com/handbook/200603/21911.shtml
- PTT 实测：寿春水攻会同时降低城内兵力、气力、治安、耐久
  https://www.ptt.cc/bbs/Koei/M.1218858498.A.BEB.html


### C1 金钱收入专项

- 311MemoryResearch：
  - `整理/Func-收支04-计算城市收钱.txt`：0049E590 完整城市金收入
  - `整理/Func-收支01-每旬收钱.txt`：00599600 征税 11/21 日 tick
  - `整理/Func-收支03-每月钱粮兵装收支.txt`：月初征税/富豪及港关结算
  - `整理/Func-收支07-计算城市、港、关金钱收入.txt`：港关20%与同势力条件
- 日文 Wiki 内政：市场100/120/150、鱼200、大300、黑80、造币1.5倍
  https://w.atwiki.jp/sangokushi11/pages/74.html
- 日文 Wiki 特技：富豪/征税与 1.75 倍组合
  https://w.atwiki.jp/sangokushi11/pages/13.html
- 游侠 2006 新手技术：富豪、征税、组合语义
  https://game.ali213.net/forum.php?mod=viewthread&tid=1075291


### C2 粮食收入专项

- 311MemoryResearch：
  - `整理/Func-收支05-计算城市收粮.txt`：0049E810 城市粮收入
  - `整理/Func-收支03-每月钱粮兵装收支.txt`：丰作/征收/米道与港关顺序
  - `整理/Func-收支06-计算城市、港、关兵粮收入.txt`：港关20%与同势力判断
- SIRE 地址表：
  - `00707A74 ConvertFloatToInteger`
- 日文 Wiki 内政：农场1500/1800/2250、谷仓1.5倍、军屯农=兵力10%且最低1500
  https://w.atwiki.jp/sangokushi11/pages/74.html
- 日文 Wiki 特技：米道/征收触发周期
  https://w.atwiki.jp/sangokushi11/pages/13.html
- 2ch/Wiki 实测：军屯农兵力10%
  https://w.atwiki.jp/sangokushi11/pages/2445.html
- 游侠新手技术：米道/征收基础语义
  https://game.ali213.net/forum.php?mod=viewthread&tid=1075291


### C3 特殊收入特技 / 丰作专项

- 311MemoryResearch：
  - `整理/Func-收支01-每旬收钱.txt`
  - `整理/Func-收支03-每月钱粮兵装收支.txt`
- SIRE 地址表：
  - `004CEAE0 GetSPSpecialSkillsArray`
  - `0047B3C0 IsCityInSpecificState`
  - `0047B3F0 IsCityInScheduledState`
- SIRE `struct_city`：
  - `Disasters`
  - `DisasterPredictions`
- 日文 Wiki 特技：富豪/米道/征税/征收的所属都市、触发周期及组合
  https://w.atwiki.jp/sangokushi11/pages/13.html
- 游侠新手技术：收入类特技作用语义
  https://game.ali213.net/forum.php?mod=viewthread&tid=1075291
- 2ch/Wiki 早期无印丰作 flag bug 记录
  https://w.atwiki.jp/sangokushi11/pages/1828.html


### C4 无印内政设施专项

- SIRE 数据/结构/地址：
  - 基础设施 ID 31～39
  - `struct_city.EmptyBarracks / EmptyForge / EmptyStable / EmptyWorkshop / EmptyShipyard`
  - `0047B820 AdjustCityBarracksCount`
  - `004B3EE0 AdjustCityBuilding`
  https://github.com/sean2077/311SireCustomizedPackageDev
- 2006 无印攻略：市场按月、农场按季、造币/谷仓相邻1格1.5倍
  https://www.gamersky.com/handbook/200604/22088.shtml
- 2006 无印实测：造币/谷仓可覆盖周围最多6格且效果不叠加
  https://www.gamersky.com/handbook/200603/21634.shtml
- 2006 无印实测：兵舍及军需生产设施数量控制一回合可执行次数，不直接放大单次产量
  https://3g.ali213.net/gl/html/5805.html
- 2006 技巧P记录：基础7设施+30P，造币/谷仓+50P
  https://www.gamersky.com/handbook/200603/21665.shtml
- 日文 Wiki 内政设施表：基础费用、耐久、防御、功能
  https://w.atwiki.jp/sangokushi11/pages/74.html


### C5 PK 新增十设施专项

- 311MemoryResearch：
  - `整理/Func-收支04-计算城市收钱.txt`：大市场/鱼市场/黑市
  - `整理/Func-收支05-计算城市收粮.txt`：军屯农
  - `整理/Func-内政03-计算训练效果.txt`：练兵所训练×1.5
  - `整理/Func-内政13-计算生产耗时.txt`：练兵所仅作用舰船，10-q→max(2,8-q)
  - `整理/Func-自动06-武将忠诚下降.txt`：符节台忠诚下降+2及本方副作用
  - `函数[计算流言是否成功].txt`：计略府参数10→12
  - `修改记录by sjn4048.txt`：四府/符节台/练兵所关键地址
- SIRE 地址表：
  - `005BD040 GetDiplomacyActionPointCost`
  - `005BFF10 GetStrategyActionPointCost`
  - 其他据点/设施 helper
  https://github.com/sean2077/311SireCustomizedPackageDev/blob/dev/material/内存地址汇总.md
- 日文 Wiki PK 设施表：费用、耐久、数量限制与说明
  https://w.atwiki.jp/sangokushi11/pages/74.html
- 游侠 PC-PK1.1 内存研究：练兵所、军事府、人才府、计略府、符节台具体地址
  https://game.ali213.net/thread-2168294-1-1.html


### C6 PK 吸收合并专项

- 《三國志11 with パワーアップキット》官方说明书：
  - 同类相邻设施合并；
  - 被吸收侧必须 Lv1；
  - Lv1+Lv1→Lv2、Lv2+Lv1→Lv3；
  - 城市周围2格有敌军时不可执行；
  - 固定 10 行动力 + 100 金；
  - 合并中仍发挥升级前效果；
  - Lv2/Lv3 为 Lv1 的 1.2/1.5。
  https://cdn.akamai.steamstatic.com/steam/apps/628070/manuals/32sangokushi11wpk_manual.pdf
- 311SireCustomizedPackageDev `material/数据汇总.md`：
  - actionId 1 = 吸收合并；
  - Lv1/Lv2/Lv3 原设施类型 ID：31～35、50～59。
  https://github.com/sean2077/311SireCustomizedPackageDev/blob/dev/material/数据汇总.md
- 311MemoryResearch `内存资料/修改记录by sjn4048.txt`：
  - PC-PK1.1 吸收合并关键地址 `005D758B`。
  https://github.com/sjn4048/311MemoryResearch
- 日文 Wiki 内政：
  - 五类可合并设施；
  - Lv2/Lv3 倍率；
  - 合并中按前一级生效；
  - 政治70以上一旬完成。
  https://w.atwiki.jp/sangokushi11/pages/74.html
- 日文旧实测：
  - 政治70/69对应10日/20日边界。
  https://w.atwiki.jp/sangokushi11/
- 游民星空 PK 建筑篇：
  - 合并 +10 技巧P、合并阶段的短期收益变化等同期实测。
  https://www.gamersky.com/handbook/200609/33180.shtml


### C7 内政设施开发日数专项

- 《三國志11 with パワーアップキット》官方说明书：
  - 开发最多选择3名武将；
  - 政治越高，开发期间越短；
  - 多人开发可缩短显示日数。
  https://cdn.akamai.steamstatic.com/steam/apps/628070/manuals/32sangokushi11wpk_manual.pdf
- 日文 Wiki 内政：
  - 综合政治 = 最高政治 + 其余两人政治之和/3（四舍五入）；
  - 10～90日完整门槛表；
  - 不足90日最低门槛时固定100日；
  - 编辑器255政治时综合政治上限425，造币/谷仓与铜雀台仍无法10日完成。
  https://w.atwiki.jp/sangokushi11/pages/74.html
- 旧2ch/Wiki存档：
  - 市场开始建设时125/500耐久的实测记录。
  https://w.atwiki.jp/sangokushi11/pages/1869.html
- 311SireCustomizedPackageDev：
  - `struct_building_type +C2` 为最大耐久；
  - `struct_building.Durability / ConstructionStatus` 保存建设进度状态。
  https://github.com/sean2077/311SireCustomizedPackageDev
- 311MemoryResearch：
  - `内存资料/修改记录by sjn4048.txt` 定位“市场等内政建设”路径 `005BC4C1`；
  - 当前公开资料未展开开发日数完整函数体。
  https://github.com/sjn4048/311MemoryResearch

全表精确重建模型：

```ts
P = highestPolitics + floor((otherPoliticsSum + 1) / 3)
initial = roundHalfUp(maxDurability / 4)
gainPerTurn = floor(3 * P / 2)
days = 10 * min(10, ceil((maxDurability - initial) / gainPerTurn))
```

该式对日文 Wiki 所有设施类别、所有10～90日门槛逐格一致；证据等级标为 `empirical-exact table reconstruction`，不冒充已恢复原函数体。

### C8 商人 / 粮食交易专项

- 《三國志11 with パワーアップキット》官方说明书：
  - 商人命令行动力20；
  - 固定所需金钱“无”；
  - 即时结算；
  - 都市周围2格有敌军时不可执行；
  - 执行武将政治越高交易越有利。
  https://cdn.akamai.steamstatic.com/steam/apps/628070/manuals/32sangokushi11wpk_manual.pdf
- 311SireCustomizedPackageDev：
  - `struct_city.TradePrice`；
  - `struct_city.HasMerchant`；
  - `struct_city.CityActions bit1 = 已商人`；
  - `0047B6F0 SetCityMerchantStatus`；
  - `0047BD50 SetCityTradePrice`。
  https://github.com/sean2077/311SireCustomizedPackageDev
- 311MemoryResearch：
  - 商人命令执行路径 `005CAD1B`。
  https://github.com/sjn4048/311MemoryResearch
- 游民星空 2007 实测：
  - 买粮无20%损失；
  - 卖粮固定×0.8；
  - 买/卖粮主体公式；
  - 政治50=100%；
  - 多个政治点交易效果锚点；
  - UI显示值不是精确计算值。
  https://www.gamersky.com/handbook/200712/89446.shtml
- 日文 Wiki 内政：
  - 金→米按相场，米→金8折；
  - 同价往返约112%交易效果开始转正；
  - 政治93附近为实战盈利边界；
  - 粮价按月变化。
  https://w.atwiki.jp/sangokushi11/pages/74.html
- 日文 Wiki 各种经验：
  - 商人命令政治经验+5；
  - 单都市全年最大180，支持每旬一次限制。
  https://w.atwiki.jp/sangokushi11/pages/79.html

注意：SIRE/PK2.2 后续加入的“交易优势”“商贸城市”“非商贸城市25%出现商人”等属于 MOD 扩展，不作为 PC-PK1.1 原作默认参数。

### C9 行动力专项

- 《三國志11 with パワーアップキット》官方说明书：
  - 1回合=10天；
  - 行动力每回合恢复；
  - 最大行动力255。
  https://cdn.akamai.steamstatic.com/steam/apps/628070/manuals/32sangokushi11wpk_manual.pdf
- 游侠 2006-06-14《行动力计算详解》：
  - 每旬恢复 = (君主参数 + 城市参数 + 武将参数) × 军师参数；
  - 君主参数只看统率/魅力较高项；
  - 城市参数每城+10、最大50；
  - 武将参数前6据点、每据点最多10、最大60；
  - 军师参数线性步进；
  - 无印核心恢复理论最大180。
  https://game.ali213.net/thread-988399-1-1.html
- 游侠《311中文版新手入门技术》：公式交叉整理。
  https://game.ali213.net/forum.php?mod=viewthread&tid=1075291
- 游民星空 2006-03-23 早期研究：
  - 行动力可累积；
  - 早期影响因素实测；
  - 其中“多项能力共同影响”的早期解释被6月后续专项纠正。
  https://www.gamersky.com/handbook/200603/21611.shtml
- Bilibili 2023 PK存档复算：
  - 刘禅直辖3城例 `(30+20+22)*1.2=86.4 -> 86`；
  - 1座符节台后实际91，锁定符节台在核心取整后+5；
  - 委任军团独立行动力，军团长替代君主，势力军师共用。
  https://www.bilibili.com/opus/828103788131778665
- 日文 Wiki 内政：
  - 行动力影响因素；
  - 符节台每回合恢复+5。
  https://w.atwiki.jp/sangokushi11/pages/74.html
- 311SireCustomizedPackageDev：
  - `struct_force.AdvisorID`；
  - `struct_corp.CorpsLeaderID / ActionPoints / PersonList`；
  - `0047E3E0 SetCorpsActionPoints`；
  - `005B9340 DeductCorpActionPoints`。
  https://github.com/sean2077/311SireCustomizedPackageDev
- 311MemoryResearch：
  - `004A1820` 军团行动力修改点；
  - `005B9340` 军团行动力扣除路径。
  https://github.com/sjn4048/311MemoryResearch

当前证据等级：`empirical-exact formula + reverse-engineered-structure + PK save cross-validation`。尚未公开展开 PC-PK1.1 行动力恢复主函数体。

### C10 治安专项

- 《三國志11 with パワーアップキット》官方说明书：
  - 巡查费用100金、20行动力、最多3人；
  - 每都市每回合仅1次；
  - 统率合计越高，上升越多；
  - 都市周围2格有敌军时上升值减小；
  - 治安80以上不会新发生普通贼。
  https://cdn.akamai.steamstatic.com/steam/apps/628070/manuals/32sangokushi11wpk_manual.pdf
- 311MemoryResearch：
  - `整理/Func-内政01-计算征兵数量.txt`：治安直接进入征兵量 `(security+20)`；
  - `整理/Func-内政02-执行征兵.txt`：征兵后治安下降 `floor(actualRecruited/(魅力和+100))`；
  - `整理/Func-自动05-城市治安下降.txt`：季初自然下降函数 `0058D6D0`，整备政令 `ProbabilityCheck(50)`。
  https://github.com/sjn4048/311MemoryResearch
- 311SireCustomizedPackageDev：
  - `struct_city.CitySecurity`；
  - `struct_city.CityActions bit0 = 已巡查`；
  - `004815F0 SetCityPatrolStatus`；
  - `0047BD70 SetCityPublicOrder`。
  https://github.com/sean2077/311SireCustomizedPackageDev
- 日文 Wiki 能力育成实测：
  - 巡查治安上升 `floor(执行武将统率和/28)+2`。
  https://w.atwiki.jp/sangokushi11/pages/1239.html
- 日文 Wiki 内政：
  - 治安<80时可能出现贼/异民族根城；
  - 根城生成后治安恢复到100也不会自动消失，仍可继续刷新部队。
  https://w.atwiki.jp/sangokushi11/pages/74.html
- 日文 Wiki 特技：
  - 亲乌/亲羌/亲越/亲蛮只阻止对应异族根城，不阻止普通治安下降或普通贼；
  - 后期实测支持威压把安全治安阈值由80降至约60，而非绝对免疫。
  https://w.atwiki.jp/sangokushi11/pages/13.html
- 2ch 旧实测：
  - 敌军逼城时巡查和征兵效果约半减。
  https://w.atwiki.jp/sangokushi11/pages/1941.html
- SIRE v1.26 参数说明：
  - 换季治安下降上限；
  - 整备政令免降概率；
  - 巡查效果倍率；
  - 威压降低贼军出现治安阈值。
  https://dl.3dmgame.com/patch/26091.html

当前证据等级：巡查基础公式 `empirical-high`；征兵掉治安、换季自然下降、整备政令为 PC-PK1.1 `reverse-engineered`。未把“治安影响瘟疫/蝗灾概率”写成规则。

### C11 灾害专项

- 311SireCustomizedPackageDev：
  - `struct_city +0x9C Disasters`：bit0疫病 / bit1蝗灾 / bit2丰作；
  - `struct_city +0xA0 DisasterPredictions`：对应三种预定状态；
  - `0047B3C0 IsCityInSpecificState`；
  - `0047B3F0 IsCityInScheduledState`。
  https://github.com/sean2077/311SireCustomizedPackageDev
- 311MemoryResearch `函数[每月例行处理].txt`：
  - `00590C30 MonthlyAction` 在月初先调用 `0058F4E0` 丰作/季节状态处理，再调用 `00590490` 钱粮收入。
  https://github.com/sjn4048/311MemoryResearch
- 311MemoryResearch `整理/Func-收支03-每月钱粮兵装收支.txt`：
  - `0047B3C0(city,2)` 检查当前丰作；
  - 丰作将完整城市基础粮 tick ×1.5；
  - 顺序在征收、米道、港关20%之前。
  https://github.com/sjn4048/311MemoryResearch
- 日文 Wiki 内政：
  - 自然有害灾害主要为疫病、蝗灾；
  - 蝗灾破坏农场并损失兵粮；
  - 疫病减少驻军并恶化武将健康；
  - Lv1农场蝗灾可被拆，Lv3不拆。
  https://w.atwiki.jp/sangokushi11/pages/74.html
- 日文 Wiki 特技：
  - 风水阻止所属都市新发生疫病/蝗灾，不能治疗已发生灾害；
  - 祈愿提高丰作发生倾向；精确概率未给。
  https://w.atwiki.jp/sangokushi11/pages/13.html
- 日文 Wiki 事件/旅人：
  - 灾害状态被事件条件直接读取，支持其为持续 Runtime State。
  https://w.atwiki.jp/sangokushi11/pages/960.html
  https://w.atwiki.jp/sangokushi11/pages/970.html
- 早期无印丰作 flag bug：
  - 部分早期版本存在丰作 flag 不正常清除的记录；只作为 patch-version 历史兼容。
  https://w.atwiki.jp/sangokushi11/pages/1828.html

明确排除：SIRE 扩展区 `00911238 ReducePopDueToDisaster / 009112E0 DisasterPopLossFactors` 不能反推 San11PK.exe 原版灾害百分比；`sango_infinity` 的祈愿 chance=50 / duration=3 亦为重制实现参数，不作为原作证据。

本轮撤回旧 provisional：蝗灾5%、疫病5%、丰作10%、每年1月独立判定、疫病每旬5～10%兵损、30%患病、持续1～2季。

### D1 武将生命周期 / 状态字段专项

- 311SireCustomizedPackageDev `struct_person`：
  - `Identity`、`Legion`、`BuildingID`、`Location`；
  - `Flags`（已行动/已褒奖/死亡预定等）；
  - `Mission / MissionParameters[6] / MissionDuration`；
  - `HealthLevel / Stamina`；
  - `FormerAllegiance / ForbiddenLord / ForbiddenMonths / CaptiveMonths`；
  - `YearOfDebut / YearOfBirth / YearOfDeath / CauseOfDeath / ScheduledLord`。
  https://github.com/sean2077/311SireCustomizedPackageDev
- 311SireCustomizedPackageDev 身份枚举：
  - 0君主 / 1都督 / 2太守 / 3一般 / 4在野 / 5俘虏 / 6未登场 / 7未发现 / 8死亡；
  - 健康 0健康 / 1轻伤 / 2重伤 / 3濒危。
  https://github.com/sean2077/311SireCustomizedPackageDev/blob/dev/material/数据汇总.md
- 原函数/helper：
  - `00488C00..00488C80` 各 Identity 判断；
  - `00488CF0 IsAdvisorOfForce`；
  - `004891C0 IsInArmy` / `00489220 GetPersonArmyID`；
  - `004898F0 SetPersonIdentity`；
  - `004A5B20 SetPersonAsNomadicPerson`（未发现→在野）；
  - `004A5780 ClearPersonTasks`；
  - `004A73A0 / 004A7410 SetPersonTask`。
  https://github.com/sean2077/311SireCustomizedPackageDev/blob/dev/material/内存地址汇总.md
- 311MemoryResearch `函数[每月例行处理].txt`：
  - 月初调用 `0058BB30` 处理俘虏月份/禁止仕官月份计数。
  https://github.com/sjn4048/311MemoryResearch
- 日文 Wiki 推荐事件：
  - 条件同时要求“达到登场预定年”与“身份为在野或未发现”，证明登场年与 current Identity 是两个维度；
  - 推荐失败时未发现武将可能转为在野。
  https://w.atwiki.jp/sangokushi11/pages/952.html
- 日文 Wiki 鲁肃剧本页：
  - 同一武将在不同剧本可分别以未登场、未发现、在野、一般、死亡等身份开局。
  https://w.atwiki.jp/sangokushi11/pages/869.html

证据等级：`PC-PK1.1 reverse-engineered-structure`。普通登场 caller、死亡预定→真正死亡、健康自然恢复与 Mission 0..43 完整语义留给后续 D 项。

### D2 登场 / 寿命 / 死亡专项

- 311SireCustomizedPackageDev `struct_person`：
  - `YearOfDebut / YearOfBirth / YearOfDeath / CauseOfDeath / ScheduledLord`；
  - `Flags.markedForDeath`；
  - `HealthLevel`；
  - `Identity`。
  https://github.com/sean2077/311SireCustomizedPackageDev
- 311SireCustomizedPackageDev `struct_scenario`：
  - `IgnoreAge`；
  - `DieInBattleSetting`；
  - `Lifetime`；
  - `ComeOnStage`。
  https://github.com/sean2077/311SireCustomizedPackageDev/blob/dev/material/结构体汇总.md
- 原函数/helper：
  - `00488A20 GetPersonAge`；
  - `00488C50 IsNotIntroduced`；
  - `00488C60 IsNotDiscovered`；
  - `00488C80 IsDead`；
  - `00489160 IsMarkedForDeath`；
  - `0048A000 GetDeathYear`；
  - `00489030 GetPersonActualAttr / 00489050 GetPersonBasicAttr / 0048A2D0 UpdateTroopParameters`。
  https://github.com/sean2077/311SireCustomizedPackageDev/blob/dev/material/内存地址汇总.md
- 311MemoryResearch `函数[每月例行处理].txt`：
  - `00590C30` 月初存在年龄/死亡相关处理入口 `005833D0`；当前公开文本未展开该函数体。
  https://github.com/sjn4048/311MemoryResearch
- 游民星空官方剧情条件整理：
  - 孙策条件使用“预定死亡年之后或200年到临”；
  - 舌战胜于吉后寿命精确延长20年。
  https://www.gamersky.com/handbook/200809/124174_6.shtml
- 日文 Wiki 诸葛亮 / 沙摩柯剧本表：
  - 诸葛亮200年20岁仍未登场；
  - 沙摩柯200年34岁仍未登场；
  - 反证通用“成年自动登场”。
  https://w.atwiki.jp/sangokushi11/pages/123.html
  https://w.atwiki.jp/sangokushi11/pages/447.html
- 日文 Wiki mask data：
  - 自然死通常有效没年当年死亡，少数延后2～3年；
  - 不自然死额外延寿与年龄负相关；
  - 其健康 -20/-40/-60 表与决战制霸直接显示值冲突，因此不用于倍率。
  https://w.atwiki.jp/sangokushi11/pages/983.html
- 日文 Wiki Q&A：
  - 从足够早的存档重跑后，未来死亡结果可发生变化。
  https://w.atwiki.jp/sangokushi11/pages/2527.html
- 日文 Wiki 孙策 / 孙策之死：
  - 不自然死实际延寿的多次实测；
  - 于吉事件胜利延寿约20年、失败立即死亡。
  https://w.atwiki.jp/sangokushi11/pages/886.html
  https://w.atwiki.jp/sangokushi11/pages/918.html
- 日文 Wiki PS2事件：
  - 诸葛亮北伐要求死亡flag未立；
  - 诸葛亮之死等待军师诸葛亮迎来自然死后才真正死亡。
  https://w.atwiki.jp/sangokushi11/pages/21.html
- 日文 Wiki 夷陵决战：
  - 甘宁基础武94，重伤显示47；3回合后轻伤显示75，直接支持重伤50%/轻伤80%。
  https://w.atwiki.jp/sangokushi11/pages/2165.html
- 旧2ch寿命模式讨论：
  - “长寿约+20、假想约99岁”为社区经验，仅作 empirical 参考，不写成 exact 常量。
  https://w.atwiki.jp/sangokushi11/pages/1945.html

证据等级：`reverse-engineered-structure + official-event-semantics + empirical-high timing`。仍缺普通登场 caller、Lifetime/ComeOnStage/IgnoreAge 枚举、GetDeathYear函数体、死亡flag RNG与一般沙盘伤病恢复。

### D3 五维 / 适性 / 成长专项

- 311SireCustomizedPackageDev `struct_person`：
  - `FiveBasicAttrs[5]`；
  - `FiveBasicAttrGrowthTypes[5]`；
  - `FiveBasicAttrExp[5]`；
  - `UnitCategoryProficiency[6] / UnitCategoryExp[6]`；
  - `ActualAttrs[5] / BasicAttrs[5]`。
  https://github.com/sean2077/311SireCustomizedPackageDev
- 311SireCustomizedPackageDev 原函数/helper：
  - `00488D40 GetPersonUnitCategoryProficiencyLevel`；
  - `00488D60 GetPersonDispositionExperience`；
  - `00488D80 GetPersonBaseAttr`；
  - `00489030 GetPersonActualAttr`；
  - `00489050 GetPersonBasicAttr`；
  - `004890C0 GetPersonAttrIncreaseRelativeToBase`；
  - `00489180 GetPersonAttrExperience`；
  - `004891A0 GetPersonAttrChangeType`；
  - `0048A030 GetPersonAttrChangeCoef`；
  - `0048A390 GetPersonGrowthAttr`；
  - `004A6DB0 IncreasePersonSkillExperience`；
  - `004A70D0 IncreasePersonAttrExperience`。
  https://github.com/sean2077/311SireCustomizedPackageDev/blob/dev/material/内存地址汇总.md
- SIRE 成长类型编号：
  - 0超持续 / 1持续 / 2早熟 / 3早熟持续 / 4普通 / 5普通持续 / 6晚成 / 7超晚成 / 8开眼。
  https://github.com/sean2077/311SireCustomizedPackageDev/blob/dev/material/数据汇总.md
- 日文 Wiki《各種経験値》：
  - 五维100经验+1；
  - 超额经验保留；
  - 适性 C→B 150 / B→A 200 / A→S 250；
  - 指导只对野外同队经验×2，据点命令无效；
  - PK能力研究直接升适性时保留已有适性经验。
  https://w.atwiki.jp/sangokushi11/pages/79.html
- 日文 Wiki《素質盛衰表》：
  - 6～101岁逐年实测；
  - 盛衰按素质百分比；
  - 早熟18岁峰值、维持25、普通30、晚成长型40/50、开眼41～55二次成长；
  - 低素质按比例变化，峰值/衰退年龄不随素质改变。
  https://w.atwiki.jp/sangokushi11/pages/1787.html
- PTT 旧文重贴《三國志11成長類型》：
  - 中文九种成长型与峰值/衰退周期交叉核对；
  - 晚成约40岁峰值、超晚成约50岁峰值。
  https://www.ptt.cc/bbs/Koei/M.1425532487.A.9C8.html
- 日文 Wiki《能力研究》与 Q&A：
  - PK能力研究本身一般累计约+20，档位边界可到约+24；
  - 能力研究+经验总培养增量约+30；
  - 经验单独也可吃满+30。
  https://w.atwiki.jp/sangokushi11/pages/46.html
  https://w.atwiki.jp/sangokushi11/pages/2527.html
- 刘禅 / 育成实录：
  - 刘禅统率素质3，普通培养最终约33，直接反证“低能力可无限刷到100”。
  https://w.atwiki.jp/sangokushi11/pages/834.html
  https://w.atwiki.jp/sangokushi11/pages/2796.html
- 遗迹/庙事件：
  - 遗迹+1的是“素质”而非经验；
  - 已达到普通经验+30培养额度的武将仍可通过遗迹继续提高。
  https://w.atwiki.jp/sangokushi11/pages/968.html
- 2ch旧实测：
  - 场景“能力变动=无效”只关闭随年龄上升/下降；经验成长继续发生。
  https://w.atwiki.jp/sangokushi11/pages/1978.html

证据等级：`reverse-engineered-structure + empirical-exact thresholds + empirical-exact age table`。尚缺年龄系数函数体、低素质整数取整、最终多层能力合成顺序以及自然适性升档的超额余数。

### D4 人际关系专项

- 311SireCustomizedPackageDev `struct_person`：
  - `BloodRelation / FatherID / MotherID / SpouseID / SwornSiblingID / Generation`；
  - `IntimatePersonsID[5] / HatedPersonsID[5]`；
  - 相性字段。
  https://github.com/sean2077/311SireCustomizedPackageDev/blob/dev/material/结构体汇总.md
- 311SireCustomizedPackageDev relation helpers：
  - `00488790 IsSpouse`；
  - `004887D0 IsSwornBrother`；
  - `00488910 IsFriendlyWith`；
  - `004889E0 IsPerson1HatesPerson2`；
  - `0048BB70 IsBloodRelation`；
  - `0048BC10 IsAConsort`；
  - `0048BCA0 / 0048BD80 / 0048BDF0 / 0048C040` 父母/子女/兄弟；
  - `0048A5F0 GetRelationWithLord`。
  https://github.com/sean2077/311SireCustomizedPackageDev/blob/dev/material/内存地址汇总.md
- 游侠繁中 PC-PK1.1 内存研究：
  - `00585555`：支援只看主将关系；
  - `0058557B`：辅佐/亲爱支援参数30；
  - `0058559B`：血缘20；
  - `005855A8`：义兄弟/夫妇50。
  https://game.ali213.net/thread-2168294-1-1.html
- 日文 Wiki《支援攻击》：
  - 夫妻/义兄弟50%、亲爱30%、辅佐30%、血缘20%的PS2PK交叉实测；
  - 只看主将；
  - 亲爱方向必须是支援方亲爱攻击方；
  - 血缘明确父子/兄弟可触发；
  - 支援范围、连战和兵器边界。
  https://w.atwiki.jp/sangokushi11/pages/1584.html
- 日文 Wiki《検証》副将能力：
  - 亲爱取主副差值1/2；
  - 血缘1/3；
  - 普通1/4；
  - 夫妻/义兄弟使用双方最优能力，相当于差值100%。
  https://w.atwiki.jp/sangokushi11/pages/30.html
- 日文 Wiki《亲爱・嫌恶》：
  - 嫌恶 pair 包括副将之间时，整队所有副将补正归零；
  - 登用亲爱/嫌恶硬分支；
  - COM君主与俘虏任一方向嫌恶时必处断；
  - 君主嫌恶对友好/同盟的影响。
  https://w.atwiki.jp/sangokushi11/pages/95.html
- 日文 Wiki《内政》：
  - 完整登用关系优先级；
  - 处断配偶会解除配偶关系，但处断本身不会新增嫌恶关系。
  https://w.atwiki.jp/sangokushi11/pages/74.html
- 日文 Wiki《小ネタ》：
  - 仲介结婚/结义可作用于出征中的武将，说明关系是运行时可变状态。
  https://w.atwiki.jp/sangokushi11/pages/15.html

证据等级：关系字段/helper与支援50/30/20参数为 PC-PK1.1 reverse-engineered；副将1/2、1/3、1/4为PS2 empirical-exact，PC函数体仍open；登用/处斩/外交关系行为为长期 empirical-high。

### D5 登用优先级与普通概率专项

- 311MemoryResearch `Func-人才01-计算登用是否成功.txt`：
  - `004AFD60` 为核心是否成功函数；
  - 先调用 `004AF7D0` 做必成/必败 hard gate；
  - 再调用 `005C4F80 GetHiringSuccessRate`；
  - 正常第三参数=0时使用 `005BA4C0` 确定性值比较，机器码为 `cmp eax,ecx / setl`，即 `deterministicValue < p`；
  - 第三参数非0时额外乘 `min(10,15-2*Ideals)/10` 并调用 `004721D0` 随机判定。
  https://github.com/sjn4048/311MemoryResearch
- 311MemoryResearch `Func-人才03-执行登用.txt`：
  - `dateKey = day*7 + month*5 + year*3`；
  - 本地人才登用传 `third=0`；
  - 异地登用将发令日 dateKey 保存为登用任务参数；
  - 普通本地成功/失败：功绩+200/+10，魅力经验+5/+1。
  https://github.com/sjn4048/311MemoryResearch
- 311MemoryResearch `Func-人才04-执行登用完成.txt`：
  - 异地任务完成时读取 MissionParameter[2] 中的发令日 dateKey，继续传给 `004AFD60`。
  https://github.com/sjn4048/311MemoryResearch
- 311MemoryResearch `Func-人才08-探索发现人才并登用.txt`：
  - 探索发现后的当场登用使用 `005C51C0` wrapper；
  - 同样做 hard gate / `005C4F80` / deterministic compare；
  - 首次失败后 `执行者魅力 - 与本君主相性差 + p > 80` 进入舌战；
  - 探索登用的功绩/经验奖励与普通人才命令不同。
  https://github.com/sjn4048/311MemoryResearch
- 311SireCustomizedPackageDev 地址表：
  - `005C4F80 = GetHiringSuccessRate`；
  - 内部调用 `005BA410`；
  - `005C4840 ProcessPersonHiredSuccessfully`；
  - `005DB0E0 GetRecruitingActionPointCost`。
  https://github.com/sean2077/311SireCustomizedPackageDev/blob/dev/material/内存地址汇总.md
- 日文 Wiki《内政》：
  - 9条登用 hard gate 的长期整理顺序；
  - 配偶第三方、嫌恶、义兄弟、忠诚+义理>96、当前君主亲爱等硬分支。
  https://w.atwiki.jp/sangokushi11/pages/74.html
- 日文 Wiki《亲爱・嫌恶》：
  - 亲爱执行者在特定无所属/低忠诚条件下可覆盖军师×而必成；
  - 亲爱当前君主通常阻止第三方登用；
  - 嫌恶当前执行君主为硬失败；配偶/义兄弟存在例外。
  https://w.atwiki.jp/sangokushi11/pages/95.html
- Vanilla 2006“100忠诚挖人”实验：
  - 忠诚、亲爱、婚姻、义兄弟是 Vanilla 已存在的核心登用关系变量。
  https://www.gamersky.com/handbook/200603/21923.shtml

证据等级：普通控制流、dateKey、异地锁发令日、两类最终判定、探索失败舌战阈值均为 PC-PK1.1 reverse-engineered；9条 hard gate 顺序为 empirical-high，因 `004AF7D0` 函数体未公开；`005C4F80` 连续概率闭式仍 open。
