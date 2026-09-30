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
