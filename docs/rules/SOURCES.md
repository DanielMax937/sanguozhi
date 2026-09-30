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
