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


### C7 内政建设速度数值核与开发日数观察

主要来源是 [sjn4048/311MemoryResearch 完整建设速度文本](https://github.com/sjn4048/311MemoryResearch/blob/66e167e40c3440929ec016f3872aefc3486434c1/内存资料/函数%5B计算内政建设速度%5D.txt)：

- 固定提交 `66e167e40c3440929ec016f3872aefc3486434c1`，路径 `内存资料/函数[计算内政建设速度].txt`
- 原 GBK blob `76b1f9591a9f94830bcf4e5a67764d2911e19fd4`，5936 bytes，SHA256 `cabc5cb11e62dee04fda39aadce804284d272ca20e98ece202fd16cedfbe9216`
- 非星号正文完整覆盖 `005BB1D0..005BB2AA`；此前“只定位005BC4C1、未公开函数体”的概括错误。建设速度函数存在，完整开发日数 caller 仍未恢复
- 政治 getter `004890A0` 重复调用，`AL` 零扩展；设施 getter `00490B90` 重复调用，最大耐久从类型 `+C2` 读取为 `uint16`
- `005BB23E..247` 是有符号总和除2向零截断；`005BB249..266` 的 `SHR2`、相减、`IMUL 0x38E38E39` 高半部及 `SAR1` 是耐久剩余量除9；`005BB268..2AA` 返回较大项
- 星号 `*005BB263 → 008A9DE8..008A9DFD` 是另列 MOD 改写，独立保存且排除于非星号数值核；其字面乘100再除100在本政治项0～637域内数值恒等，隔离依据是来源/结构，不能虚构行为反例
- [解码快照](../sources/domestic-construction-rate-original.txt)、[证据清单](../sources/domestic-construction-rate.json)、[schema](../sources/domestic-construction-rate.schema.json)、[完整支持域说明](domestic-construction-rate.md)

在0～3个已解析 `uint8` 政治值和稳定 `uint16` 设施耐久 `D` 域内：

```ts
rate = max(
  maxPolitics + floor(sumPolitics / 2),
  floor((D - floor(D / 4)) / 9)
)
```

稳定政治 getter 与稳定设施表是纯函数投影的前提，不宣称可变 getter 等价。原字节中的 `D>>2` 只用于速率下界，不证明初始耐久 writer；公开逆向文本也不构成独立 clean-stock 认证。

攻略/结构旁证独立保留：

- [官方 PK 说明书](https://cdn.akamai.steamstatic.com/steam/apps/628070/manuals/32sangokushi11wpk_manual.pdf)：最多3名武将，政治影响开发期间，多人可缩短显示日数
- [日文 Wiki 内政](https://w.atwiki.jp/sangokushi11/pages/74.html)：综合政治的四舍五入式、10～90日门槛与最低档100日观察；不是上述速率函数的逐指令证据
- [旧2ch/Wiki存档](https://w.atwiki.jp/sangokushi11/pages/1869.html)：市场开始建设时125/500的单项实测
- [311SireCustomizedPackageDev](https://github.com/sean2077/311SireCustomizedPackageDev)：类型最大耐久 `+C2` 与建筑实例 `Durability / ConstructionStatus`；字段存在不证明写入时机

旧 `P=highestPolitics+floor((otherPoliticsSum+1)/3)` 后算 `floor(3*P/2)` 的重建与源函数不等价：`[75,1,0], D450` 得113而旧式112；`[29,1,0], D500` 得44而旧式43；全0政治、D500仍有下界41而旧式0。三人100政治、D500同为250只能作锚点。旧“约25%初始耐久 + 1.5P/旬”的门槛表重建保留为历史假设，不能用来填补完整工期、初始 writer、每旬进度、完成调度、getter 本体和 clean-stock/跨版本缺口。

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
  - 商人命令执行路径 `005CAD1B`；
  - 固定commit `66e167e40c3440929ec016f3872aefc3486434c1` 的 `Func-内政05-计算交易收支.txt` 已列 `005CA620..005CA76A` 原段135条/331 bytes，GBK9860 bytes复算Git blob `e53ce1f6f1945c1efd0d8c569eec161cffaaa560`；末尾商才MOD独立；
  - [保留边界](02-economy.md#811-已有函数体与仍未闭合的精确合同)：`0070A330`/`0070A280`/`005CA5B0` 完整合同、原TradePrice/UI尺度、取整/溢出和writer未闭合，本批不实现交易。
  https://github.com/sjn4048/311MemoryResearch/blob/66e167e40c3440929ec016f3872aefc3486434c1/内存资料/整理/Func-内政05-计算交易收支.txt
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

- 巡查限定数值核：[固定提交原函数](https://github.com/sjn4048/311MemoryResearch/blob/66e167e40c3440929ec016f3872aefc3486434c1/内存资料/整理/Func-内政08-计算巡查效果.txt)，原GBK blob `71b6c28bdc4c3d0f591d0af5ee813c8fb9f4134a`；原79条/204字节与“修改 - 巡查倍率可调整”7条/21字节分隔
  - [UTF-8可逆快照](../sources/patrol-security-gain-original.txt)、[证据记录](../sources/patrol-security-gain.json)、[闭合schema](../sources/patrol-security-gain.schema.json)、[Apache-2.0许可](../sources/patrol-security-gain-LICENSE.txt)、[完整支持域](patrol-security-gain.md)
  - 稳定已解析统率AL合计先除28加2，`004B99B0`完整EAX非零再向下半减，最后严格大于100上clip；城市byte0..255保留负delta。原第65行`sar dl,04`保留，字节C1 FA04实为SAR EDX,4
  - [固定执行巡查context](https://github.com/sjn4048/311MemoryResearch/blob/66e167e40c3440929ec016f3872aefc3486434c1/内存资料/整理/Func-内政09-执行巡查.txt)与[本地快照](../sources/patrol-security-gain-command-context.txt)：005CBE8C调数值核，005CBE9B调治安writer，005CBF95扣AP；技巧点消费writer返回，本批不实现、不串接
  - 源注释城市3格/港关2格与官方都市2格并列保留；helper本体未取得。来源未提供本函数clean-stock EXE hash或精确补丁归属，不升级为stock PC-PK1.1或跨版本认证

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

当前证据等级：巡查稳定已解析输入数值核为 `source-listing-reconstruction`，包含半减奇数取整和严格上clip分支；旧实测锚点相容。helper距离谓词、getter、命令资格/费用/writer/调度及clean-stock/跨版本仍open。征兵掉治安、换季自然下降、整备政令沿用既有 PC-PK1.1 `reverse-engineered` 标记，不因本批巡查证据扩级。未把“治安影响瘟疫/蝗灾概率”写成规则。

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

### D6 相性 / 义理 / 野望 / 汉室专项

- 311MemoryResearch / SIRE tutorial：
  - 固定 `66e167e40c3440929ec016f3872aefc3486434c1` 的 `SireCustomizedPackageDev/README.md`，完整33369 bytes，SHA-256 `d5e496619ce21736861f796223523e3897591a2b3374e482aa0505b03606acb3`；
  - `00489F80..00489FD7` 共37条助记符，函数opcode bytes缺失；
  - [相性距离独立投影](affinity-distance.md)为 `tutorial-source-projection`，双uint8算 `min(abs(A-B),150-abs(A-B))` 并保留signed32/EAX/AL，0/151=-1、AL255；
  - 不取mod150、不夹零，native pointer/ID、教程到caller/S1同源与stock仍缺；不接自然忠诚或登用；
  - [完整快照](../sources/affinity-distance-tutorial-original.md)、[证据JSON](../sources/affinity-distance.json)、[闭合schema](../sources/affinity-distance.schema.json)，不把教程原文hash当机器码校验。
  https://github.com/sjn4048/311MemoryResearch/blob/66e167e40c3440929ec016f3872aefc3486434c1/SireCustomizedPackageDev/README.md
- 311SireCustomizedPackageDev `struct_person`：
  - `+0x69` 相性；
  - `+0xAC Loyalty`；
  - `+0xF0 Ideals`；
  - `+0xF4 Ambition`；
  - `+0x108 HanDynastyAttention`。
  https://github.com/sean2077/311SireCustomizedPackageDev/blob/dev/material/结构体汇总.md
- 311SireCustomizedPackageDev loyalty helper / UI汇编：
  - `0048A770 SetLoyalty` 标注0..255；
  - 原列表getter读取byte忠诚后仅在显示时把>=100截到100。
  https://github.com/sean2077/311SireCustomizedPackageDev/blob/dev/material/内存地址汇总.md
  https://github.com/sean2077/311SireCustomizedPackageDev/blob/dev/tutorial/1.%20Sire%20自定义包的原理.md
- 日文 Wiki《マスクデータ》：
  - 相性越近越易登用，远离君主会导致自然忠诚下降；
  - 义理高时忠诚较难下降也较难上升、较难背叛；
  - 野望高时较易独立；
  - 汉室无视/普通/重视三档；
  - 爵位授予/自称忠诚：普通+3/+3、重视+6/+1、无视+1/+6；王/公×2、皇帝×3；
  - 拥立/废立汉帝对汉室重视武将+10/-10；汉室无视COM会废立。
  https://w.atwiki.jp/sangokushi11/pages/983.html
- 日文 Wiki《小ネタ》：
  - 己方自然忠诚下降发生在季节转换；
  - 历史候选摘要已由[固定caller纠错](natural-loyalty-candidate-boundary.md)更新：相性差>25（unsigned AL），或低/较低义理+高/较高野望，或 `004889E0` 非零；后一条来自caller及“厌恶君主”注释，不归给本Wiki；
  - 下降幅度还受君主义理/野望影响。
  https://w.atwiki.jp/sangokushi11/pages/15.html
- 日文 Wiki《内政》/仁政武将页：
  - 仁政阻止同都市己方武将的自然忠诚下降。
  https://w.atwiki.jp/sangokushi11/pages/74.html
  https://w.atwiki.jp/sangokushi11/pages/554.html
- 日文旧讨论：
  - 俘虏为月度忠诚下降流程；
  - 符节台加速俘虏忠诚下降；
  - 隐藏忠诚可高于100甚至到255，因此显示100可长期不动。
  https://w.atwiki.jp/sangokushi11/pages/1926.html
  https://w.atwiki.jp/sangokushi11/pages/2378.html
- 311MemoryResearch `整理/Func-自动06-武将忠诚下降.txt`：
  - `0058E510` 完整逐指令文本，固定commit/blob与GBK可逆UTF-8快照见[静态证据](natural-loyalty-candidate-boundary.md)；
  - `0058E6BF JA` 确认相性差>25；`0058E6D6..DD` 确认 `004889E0` 非零的第三候选，源注释“厌恶君主”；
  - 仅主函数 `0058E510..0058E82B` 入证，末尾两套MOD修改隔离；callee/stock完整语义未补齐；
  - 普通武将季初 gate 与俘虏跳过季初 gate；
  - 俘虏跳过仁政，但保留亲爱/配偶/义兄弟/父母子女豁免；
  - 人心掌握：`00472150(3)` 后 `AX>=1` 跳过；2/3依赖均匀0..2随机约定；
  - 两次 `00472150(3)` 调用、符节台`+2`；调用数不证明RNG独立性；
  - 君主义理最低且野望最高时追加 `floor((4-targetIdeals)/2)`。
  https://github.com/sjn4048/311MemoryResearch
- SIRE 原作者更新说明：
  - 换季忠诚下降参数、符节台附加减忠、人心掌握不下降概率均可独立调整；
  - 与上述原EXE逐指令结果交叉一致。
  https://www.xycq.org.cn/forum/viewthread.php?authoruid=374759&tid=209820
- 日文 Wiki《魏帝即位》：
  - 曹家称帝后汉室无视武将忠诚+20、汉室重视-20。
  https://w.atwiki.jp/sangokushi11/pages/937.html
- 日文 Wiki《汉帝援助》：
  - 玩家君主汉室重视为事件条件；
  - 援助/拒绝会让汉室重视配下分别涨/掉忠，幅度因人而异。
  https://w.atwiki.jp/sangokushi11/pages/958.html
- 二次“代码研究”转载：
  - 现仅作为历史cross-check；其中随机调用点、人心掌握比较、符节台+2、最低义理最高野望君主附加算术可由 `0058E510` caller复核；分布/独立性、最终writer和stock不由转载或caller单独证明。
  https://wenku.baidu.com/view/ad1f1482561252d381eb6edb?bfetype=new

证据等级：忠诚0..255/UI100保留既有逆向证据；相性独立核为教程助记符投影，不是byte-exact。`0058E510` 仍仅为source-bound caller文本证据，教程到caller/S1同源、native解析与原opcode仍缺；`004889E0`完整callee、`004A6CF0` writer、RNG/降量端到端及stock/runtime仍open。汉室爵位/拥废/特定事件常量保留documented exact；非自然路径仍各自保留缺口。

### D7 太守 / 都督 / 军师专项

- 《三國志11 with パワーアップキット》官方说明书：
  - “军师”命令直接任命势力军师；
  - 仅智力>=70的武将可任命；
  - 智力越高，助言越准确；
  - 期间/必要金/行动力/执行武将均无；
  - 驱虎吞狼针对敌都市太守，太守野望高且忠诚低时更易成功。
  https://cdn.akamai.steamstatic.com/steam/apps/628070/manuals/32sangokushi11wpk_manual.pdf
- 311SireCustomizedPackageDev：
  - `struct_force.AdvisorID`；
  - `struct_corp.CorpsLeaderID`；
  - `struct_city.PrefectID`；
  - `0047C310 GetCityPrefectID` / `00485160 GetPrefectIDForHarborOrPass`；
  - `00488C10 IsGovernor / 00488C20 IsPrefect / 00488CF0 IsAdvisorOfForce`。
  https://github.com/sean2077/311SireCustomizedPackageDev
- 日文 Wiki FAQ：
  - 太守/都督不能直接手选，而是自动决定；
  - 港/关/堤防无太守则耐久不恢复，恢复量受太守政治影响。
  https://w.atwiki.jp/sangokushi11/pages/8.html
- 日文 Wiki 爵位・官职：
  - 都督/太守自动选候选中可指挥兵数最大者；
  - 同值时统率高者优先；
  - 有官职者相对无官职者存在优先边界。
  https://w.atwiki.jp/sangokushi11/pages/111.html
- 日文 Wiki 内政/委任：
  - 都督任命优先级再次记录为可指挥兵数→统率，有官职者优遇。
  https://w.atwiki.jp/sangokushi11/pages/74.html
- 日文 Wiki 据点伤害：
  - 太守统率>=66开始降低守兵损失；
  - 太守武力>=66开始提高反击伤害；
  - 太守统率不影响耐久伤害；
  - 超过太守可指挥兵数的驻兵不继续贡献据点攻防。
  https://w.atwiki.jp/sangokushi11/pages/92.html
- 日文 Wiki 各种经验：
  - 军师智力影响助言命中率，也影响行动力恢复。
  https://w.atwiki.jp/sangokushi11/pages/79.html
- 旧2ch排序讨论：
  - 太守存在“君主>都督>一般→指挥兵数→统率”的更细描述；
  - 都督有“官职顺序”说法，与后期Wiki统一口径存在细节冲突，因此只作selector exactness边界。
  https://w.atwiki.jp/sangokushi11/pages/1938.html

证据等级：角色字段/helper为PC-PK1.1 reverse-engineered；军师70门槛/助言语义/零成本为official-confirmed；太守/都督自动selector主排序为empirical-high，完整EXE comparator仍open。

### D8 忠诚 / 俸禄 / 褒赏专项

- 《三國志11 with パワーアップキット》官方说明书：
  - 褒赏：100金/人、5AP/人、即时、无执行武将；
  - 可一次多人；同一武将每回合最多一次；
  - 显示忠诚100和部队中武将不能褒赏；
  - 授予宝物：10AP，宝物价值越高忠诚上升越多；
  - 移动/召唤均20AP；
  - 官职俸禄是每月支付，金不足会造成忠诚下降。
  https://cdn.akamai.steamstatic.com/steam/apps/628070/manuals/32sangokushi11wpk_manual.pdf
- 311MemoryResearch `Func-收支03-每月钱粮兵装收支.txt`：
  - `00590490 MonthlyIncomeAndExpend`；
  - 每据点先处理俘虏维护费，每俘虏50金；
  - 再以 `0049F2A0` 求现役君主/都督/太守/一般武将俸禄总和；
  - 够钱直接扣总俸禄；不足转 `0058D5E0` 欠薪忠诚下降准备，后段 `0058C190` 处理忠诚。
  https://github.com/sjn4048/311MemoryResearch
- 311SireCustomizedPackageDev：
  - `00489140 HasPraised`，支持“一人每回合最多一次褒赏”的状态位；
  - loyalty setter / modifier 与 D6 的0..255真实忠诚结构。
  https://github.com/sean2077/311SireCustomizedPackageDev
- 日文 Wiki 能力值 / 各种经验：
  - 君主魅力会影响褒赏时忠诚上升量。
  https://w.atwiki.jp/sangokushi11/pages/1598.html
  https://w.atwiki.jp/sangokushi11/pages/79.html
- 日文 Wiki 内政：
  - 褒赏与宝物是独立忠诚管理路径。
  https://w.atwiki.jp/sangokushi11/pages/74.html
- 日文 Wiki 爵位・官职：
  - 普通武将升官/降官本身不改变忠诚；官职影响指挥兵数、能力与月俸。
  https://w.atwiki.jp/sangokushi11/pages/111.html
- Vanilla 刘备逐旬实录：
  - 褒赏实例 +5/+8/+9；
  - 作者明确说明忠诚上升量随机并用S/L刷高结果。
  https://note.com/juicy_fox4269/n/nf69a4b2b4dae
- PC-PK 隐藏忠诚实测：
  - 真实忠诚99经COM褒赏可变为108，而UI仍显示100。
  https://www.ptt.cc/bbs/Koei/M.1776854540.A.47B.html
- PC/PK宝物没收实录：
  - 没收导致忠诚下降；-30有多次稳定实机记录，当前只标empirical-high。
  https://blog.id774.net/entry/2020/11/06/1676/
  https://blog.id774.net/entry/2021/01/08/1703/

证据等级：褒赏/授予的命令成本和资格、俸禄每月为official-confirmed；月度收支调度为PC-PK1.1 reverse-engineered；褒赏忠诚增量的随机性与魅力影响为empirical-high，精确闭式仍open。


### D9 俘虏专项

- 311MemoryResearch `内存资料/函数[捕获].txt`：
  - PC-PK1.1 `004B1280`；
  - 同一函数覆盖部队击破与据点陷落后的武将捕获；
  - 目标能力取 `max(武力,智力)`；
  - 合围部队数直接进入倍率，目标有铁壁时倍率回到1；
  - context id 3/4 时×1.5（业务语义未命名）；
  - 超级难度“玩家击破AI”方向再÷2；
  - 捕缚+100并封顶100；
  - 戟兵战法最终+30并再次封顶100；
  - 强运(skill 32)为不可捕获硬分支。
  https://github.com/sjn4048/311MemoryResearch
- 311MemoryResearch `内存资料/地址资料.txt`：
  - `004B15B9` 捕缚(19)；
  - `004B17B1` 强运(32)：部队击破不被俘虏；
  - `004B18A0` 戟兵战法捕获成功率+30。
  https://github.com/sjn4048/311MemoryResearch
- 311MemoryResearch `整理/Func-自动07-俘虏逃走.txt`：
  - `00582BE0` 每月俘虏自然逃走；
  - `CaptiveMonths<2` 不判定；
  - `q=max(1,m-2)`；
  - `stat=max(30,max(WAR,INT))`；
  - 概率参数 `max(1,floor(q*q*stat/150))`；
  - 必须能从人物Location解析到有效城市/港/关设施，因此野外部队携带俘虏不走该据点逃亡roll。
  https://github.com/sjn4048/311MemoryResearch
- 311MemoryResearch `函数[每月例行处理].txt`：
  - 月初先 `0058BB30` 更新俘虏/禁仕月份；
  - 后 `00582BE0` 自然逃亡；
  - 再进入 `00590490` 月度收入/支出。
  https://github.com/sjn4048/311MemoryResearch
- 311MemoryResearch `整理/Func-收支03-每月钱粮兵装收支.txt`：
  - 据点俘虏维护50金/人；
  - 可支付人数 `min(count,floor(gold/50))`；
  - 不足人数进入 `0058C320 -> 0058D1D0` 准备，最终 `0058D430` 实际释放/逃走处理；
  - 自然逃亡与资金不足释放是两条独立路径。
  https://github.com/sjn4048/311MemoryResearch
- 311MemoryResearch `整理/Func-自动06-武将忠诚下降.txt`：
  - 俘虏跳过季初限制与仁政；
  - 关系豁免仍生效；
  - 人心掌握caller在AX>=1时跳过；2/3依赖均匀0..2随机约定，RNG/stock边界见[忠诚静态纠错](natural-loyalty-candidate-boundary.md)；
  - 两个0..2随机、符节台+2、特定君主义理/野望附加项。
  https://github.com/sjn4048/311MemoryResearch
- 日文 Wiki《特技一覧》/武将页：
  - 捕缚对没有强运、没有名马的武将必捕；
  - 野外出阵部队携带的俘虏不会自然逃亡，回据点后才有逃亡风险。
  https://w.atwiki.jp/sangokushi11/pages/13.html
  https://w.atwiki.jp/sangokushi11/pages/718.html
- 日文 Wiki《小ネタ》：
  - 主动释放俘虏会产生登用禁止期间。
  https://w.atwiki.jp/sangokushi11/pages/15.html
- 日文 Wiki 评论/Q&A：
  - 血路对部队壊滅的反捕获语义稳定；
  - 对据点陷落是否同样有效存在长期版本/场景争议，因此不升级成统一硬免疫。
  https://w.atwiki.jp/sangokushi11/pages/28.html
  https://w.atwiki.jp/sangokushi11/pages/2526.html

证据等级：捕获主公式、强运、戟战法+30、自然逃亡公式、月度掉忠与50金维护均为PC-PK1.1 reverse-engineered；名马反制捕缚与野外携俘不逃为长期稳定wiki/实机交叉验证。仍open：`004A0590`精确语义、context 3/4、血路城陷边界、概率helper超100、资金不足释放排序、释放禁仕月数与释放技巧P。


### D10 官职专项

- 311SireCustomizedPackageDev `struct_person` / `struct_office`：
  - Person `+A4 OfficeID`、`+AE Merit`；
  - PC-PK1.1 `struct_office[81]`；
  - `+2C TroopNumber`、`+30 AttrIncreaseType`、`+34 AttrIncrease`、`+35 Salary`、`+36 Rank`；
  - `00490C10 GetOfficePtrFromID`、`005B3BD0 GetMeritByOfficialID`。
  https://github.com/sean2077/311SireCustomizedPackageDev
- 311MemoryResearch `内存资料/地址资料.txt`：
  - `004CB6F7 / 005B3BBB / 005B3C03` 的所需功绩阶梯均直接使用 `0xFA0=4000`；
  - `004A6D89/8E`、`0048A7B5/BB` 锁定功绩上限 `0xEA60=60000`；
  - `0049D57D` 军制改革技术ID18；
  - `0049D58B` 实际部队上限+3000；
  - `004CB636` 封官界面上限+3000。
  https://github.com/sjn4048/311MemoryResearch
- 311MemoryResearch `函数[计算武将属性].txt`：
  - `0048A22B -> 00490C10` 读取OfficeID；
  - 匹配 `AttrIncreaseType` 后增加 `AttrIncrease`；
  - 官职后还有后段加成，最后统一进入原版100能力封顶。
  https://github.com/sjn4048/311MemoryResearch
- 311MemoryResearch `函数[自动封官].txt`：
  - `005FAF00`；
  - `005FA4D0` 先做任官资格；
  - 真实忠诚<90直接剔除；
  - 专门评分分支：最高档统+智>=150；武官max(统,武)>=60；文官max(智,政)>=70；
  - 忠诚权重为 `9*min(trueLoyalty-90,10)`；
  - 另一分支按 `max(统,武)` / `max(智,政)` 作倾向分流；
  - 同分不替换；候选列表由 caller 直接传入，`005FA650` 实际是 office classifier，不负责候选排序。
  https://github.com/sjn4048/311MemoryResearch
- 日文 Wiki《爵位・官職》：
  - 80个有名官职完整表；
  - 爵位都市门槛；
  - 升降官不改忠；
  - 官职指挥上限与军制改革叠加，普通最大18000；
  - 无爵位为仅1都市；
  - 黄巾无普通爵位/官职。
  https://w.atwiki.jp/sangokushi11/pages/111.html
- 日文 Wiki《技巧研究》：
  - 军制改革+3000；
  - 无官职5000 -> 8000。
  https://w.atwiki.jp/sangokushi11/pages/90.html

证据等级：官职结构、4000功绩阶梯、60000功绩上限、军制改革+3000、实际能力加成与 `005FAF00` 主selector均为PC-PK1.1 reverse-engineered；80官职/爵位表由日文Wiki与仓库旧表交叉确认。P0-8已闭合单官职score与first-wins tie，并纠正`005FA650`角色；`005FA4D0`、caller顺序和mode业务映射仍open。


### E1 部队编成专项

- 311SireCustomizedPackageDev `struct_troop`：
  - `TroopType 0=战斗 / 1=输送`；
  - `MainGeneralID / SubGeneral1ID / SubGeneral2ID`；
  - 兵力、金、粮独立字段；
  - `EquipmentStatus` 为12个 type+quantity 兵装栏；
  - `CurrentUnitType` 与陆/水装备 getter 分离。
  https://github.com/sean2077/311SireCustomizedPackageDev
- 311SireCustomizedPackageDev troop helper：
  - `00495310 IsTroopLeader`；
  - `00495340 IsTroopFollower`；
  - `00495390 IsPersonInTroop`；
  - `004957B0 GetTroopStrengthLimit`；
  - `004957F0 GetTroopMoneyLimit`；
  - `00495810 GetTroopFoodLimit`；
  - `00495480/490` 陆/水行军兵装；
  - `00496160` 按坐标选择当前行军兵装。
  https://github.com/sean2077/311SireCustomizedPackageDev
- 311MemoryResearch `出征窗口部分界面代码.txt`：
  - `00647250` 读取选定主将并调用 `0048A4F0` 获取主将可带兵上限；
  - 与据点现有兵力取小；
  - 兵种ID1～4再与对应枪/戟/弩/马库存取小；
  - `006472FB` 写死出征下限1；
  - 未选主将时 `00646E60` 仅用于UI预览据点最高指挥上限。
  https://github.com/sjn4048/311MemoryResearch
- 311MemoryResearch `地址资料.txt`：
  - 战斗部队金上限10000、粮上限50000；
  - 输送队兵力60000、金100000、粮500000；
  - `004962CF/00496306...` 等运输兵装容量相关入口已定位但数值语义未展开。
  https://github.com/sjn4048/311MemoryResearch
- 日文 Wiki《戦争》：
  - 普通部队粮上限50000；
  - 输送队兵力上限60000；
  - 可用极少兵力部队/输送队，输送队可搭载多名武将；
  - 枪戟弩马随士兵损失等量消耗，攻城兵器不按士兵损失消耗。
  https://w.atwiki.jp/sangokushi11/pages/85.html
- 日文 Wiki《技巧研究》《内政》：
  - 高级舰船按需要装备的出征部队数准备，而不是按士兵数量准备。
  https://w.atwiki.jp/sangokushi11/pages/90.html
  https://w.atwiki.jp/sangokushi11/pages/74.html

证据等级：部队结构、玩家出征兵力上下限、战斗/输送金粮兵上限均为PC-PK1.1 reverse-engineered；数量型兵装损耗与件数型攻具/舰船行为由源码结构与长期实机资料交叉确认。P0-9进一步恢复transport普通兵装100000 hard-cap的reverse-history证据，并定位UI/draft函数边界；actual commit/return finalizer仍open。


### E2 部队能力合成专项

- 311MemoryResearch `函数[计算部队属性].txt`：
  - `00496570 GetTroopCapabilities` 完整主链；
  - 单将直接读取主将 Basic/Actual Attr；
  - 多将先用 `00495B90` 检查主-副1、主-副2、副1-副2三组双向嫌恶；
  - 任意嫌恶命中则五维退回主将，但随后六适性仍遍历三人取最高；
  - 统率/武力对每名副将调用 `00495AB0`；
  - 智力/政治/魅力直接比较取高；
  - 六兵科适性三人逐项取最高；
  - C/B/A/S 由 `(level+7)*0.1` 得到0.7/0.8/0.9/1.0；
  - 剑兵与输送走舸固定0.6；
  - 混乱状态倍率0.8；
  - 输送攻击0.4、防御/建设1/3；
  - 精锐枪戟弩骑基础攻防各+10；
  - 建设力 `政治*2/3+50`。
  https://github.com/sjn4048/311MemoryResearch
- 311MemoryResearch `地址资料.txt`：
  - `00495B65` 普通关系副将差值1/4；
  - `00495B79` 亲爱关系差值1/2；
  - `00496932` 输送攻击0.4；
  - `004969F2` 输送防御/建设1/3；
  - `00496A49 / 00496A4F` 建设力2/3与+50。
  https://github.com/sjn4048/311MemoryResearch
- 311SireCustomizedPackageDev：
  - `00489030 GetPersonActualAttr`；
  - `00489050 GetPersonBasicAttr`；
  - `00495AB0 GetHighestAttrOfMgAndDg`；
  - `00495B90 ArePersonsMutuallyHateful`；
  - `00496570 GetTroopCapabilities`。
  https://github.com/sean2077/311SireCustomizedPackageDev
- 日文 Wiki《検証》：
  - 亲爱差值1/2、血缘1/3、普通1/4；
  - 夫妻/义兄弟取最高能力；
  - 适性由队内最高者提供。
  https://w.atwiki.jp/sangokushi11/pages/30.html
- 日文 Wiki FAQ / 中文早期实测：
  - 义兄弟/夫妻可互补统武；
  - 副将智力高于主将时部队智力直接取高。
  https://w.atwiki.jp/sangokushi11/pages/8.html
  https://gl.ali213.net/html/2006/5840.html

证据等级：嫌恶分支、统武vs智政魅分流、适性取高、混乱0.8、输送倍率、建设力与精锐+10均为PC-PK1.1 reverse-engineered；普通1/4与亲爱1/2另有PC地址级参数；血缘1/3与夫妻/义兄弟1继续标PS2 empirical-exact，待 `00495AB0` 完整逐指令公开后再升级。


### E4 训练效果与气力专项

- 311MemoryResearch `整理/Func-内政03-计算训练效果.txt`：
  - `005C3F50`；
  - 最多3名执行武将，只取武力；
  - 武力和与最高武力分别累计；
  - 据点兵力经magic division得到 `floor(T/2000)`，再+20并封顶100；
  - 训练基础 `floor((sumWAR+maxWAR)/D)+3`；
  - PK城市有练兵所时结果×1.5后整数化；
  - 最终按据点气力上限裁剪。
  https://github.com/sjn4048/311MemoryResearch
- 311MemoryResearch `整理/Func-内政04-执行训练.txt`：
  - 调用同一 `005C3F50`；
  - 每名执行者武力经验+2、功绩+50、置已行动；
  - 写入据点已训练状态；
  - 技巧P为 `floor(actualGain/2)+5`；
  - AP 20，PK城市有军事府时10；
  - 当前执行路径无固定金钱支出。
  https://github.com/sjn4048/311MemoryResearch
- 311MemoryResearch `整理/Func-公共06-获取城市港关气力上限.txt` / `Func-公共07-增加城市港关气力.txt`：
  - 城市/港/关气力上限100；
  - 熟练兵后120；
  - 增减据点气力时同样封顶。
  https://github.com/sjn4048/311MemoryResearch
- 311MemoryResearch `地址资料.txt`：
  - 部队气力上限100/熟练兵120；
  - 军乐台范围2、每旬+10；
  - 奏乐+5；
  - 诗想在军乐台范围额外+10；
  - 扫荡-5、威风-20、昂扬+10、怒发+5；
  - 单挑胜负+15/-15、被拒绝方两侧+10/-5。
  https://github.com/sjn4048/311MemoryResearch
- 311SireCustomizedPackageDev：
  - `00486F60 GetSPMorale` / `00487010 GetSPMoraleLimit` / `00488010 IncreaseSPMorale`；
  - `00496020 GetTroopMorale` / `00496490 SetTroopMorale` / `004964F0 AdjustTroopMorale`。
  https://github.com/sean2077/311SireCustomizedPackageDev
- 日文 Wiki《技巧研究》：
  - 熟练兵使气力上限100→120，研究完成并不会把当前气力直接补到120。
  https://w.atwiki.jp/sangokushi11/pages/90.html
- 日文 Wiki《特技一覧》《戦争》：
  - 奏乐、诗想、扫荡、威风及军乐台恢复语义；
  - 奏乐不与军乐台恢复叠加；
  - 补兵后气力按新旧兵力加权平均。
  https://w.atwiki.jp/sangokushi11/pages/13.html
  https://w.atwiki.jp/sangokushi11/pages/85.html

证据等级：训练闭式、练兵所倍率、训练AP/经验/功绩/技巧P、据点/部队100/120上限均为PC-PK1.1 reverse-engineered；P0-11进一步锁定`005C4100`据点gate边界、官方每回合一次cadence及`0059A230`野外恢复local handler。reset/top scheduler xref与`005C4100`完整body仍open。


### E5 兵粮消耗专项

- 311MemoryResearch `整理/Func-收支02-每旬耗粮.txt`：
  - `0059BF40` 旬级调度；
  - 先城市/港/关，再地图部队；
  - 当前粮>0才进入耗粮；
  - 本旬扣到0时记录粮尽对象；
  - 港/关有屯田时直接跳过耗粮函数。
  https://github.com/sjn4048/311MemoryResearch
- 311MemoryResearch `整理/Func-收支09-计算城市、港、关兵粮支出.txt`：
  - `0049D200`；
  - 据点驻屯基础 `兵力×0.025`；
  - 着火额外 `currentFood*(6-prefectPolitics*0.05)*0.01`；
  - 兵力>0时最低支出1。
  https://github.com/sjn4048/311MemoryResearch
- 311MemoryResearch `整理/Func-收支10-计算部队兵粮支出.txt`：
  - `0049D2E0`；
  - 普通野外战斗 multiplier=2 -> /10；
  - 输送 multiplier=1 -> /20；
  - 阵≈5/3、砦≈4/3、城塞=1，再统一×0.05；
  - 输送队直接跳过阵/砦/城塞分支；
  - 着火额外 `currentFood*(6-troopPolitics*0.05)*0.01`；
  - 兵力>0时最低支出1。
  https://github.com/sjn4048/311MemoryResearch
- 311MemoryResearch `整理/Func-自动04-兵临城下逃兵处理.txt`：
  - 确认兵临城下逃兵是独立机制，不能拿它解释粮尽逃兵。
  https://github.com/sjn4048/311MemoryResearch
- 日文 Wiki《戦争》《小ネタ》：
  - 长期实机规则：战斗/10、输送/20、驻屯/40、港关屯田0；
  - 攻略表把阵/砦/城塞减粮写15%/30%/50%，本轮以PC原浮点常量为更高精度来源；
  - 粮尽后每旬兵力大幅下降，但未给闭式。
  https://w.atwiki.jp/sangokushi11/pages/85.html
  https://w.atwiki.jp/sangokushi11/pages/15.html

证据等级：旬级调度、/10 /20 /40、屯田、阵系倍率、着火额外耗粮均为PC-PK1.1 reverse-engineered；P0-12进一步锁定阵/砦/城塞 float32 bit pattern与单一selector不叠乘。粮尽原函数仍open；旧约76%因出处无法验证已降为legacy-compatibility-only。


### E6 补给与输送专项

- 311MemoryResearch `地址资料.txt`：
  - `004BF522`：输送队抵达据点，功绩+200；
  - 输送队兵/金/粮容量与出阵上限；
  - `006157C1/006157D8` 出阵兵装上限地址；
  - `004962CF/004962D6` 运行时兵装上限；
  - `00496306/0D/28/2F` 补给后兵装封顶；
  - `005DB107` 军事府使输送AP减半；
  - `005DB86E` 军事府使出征AP减半。
  https://github.com/sjn4048/311MemoryResearch
- 311SireCustomizedPackageDev：
  - `GetTroopStrengthLimit / GetTroopMoneyLimit / GetTroopFoodLimit`；
  - `GetSPEquipmentLimit / GetSPTroopStrengthLimit / GetSPMoneyLimit / GetSPFoodLimit`；
  - `AdjustSPSoldier / AdjustSPEquipment / AdjustTroopStrength / AdjustTroopMoney / AdjustTroopFood`；
  - `004B9840 GetBuildingCombinedStrength` 以原兵力/气力与新增兵力/气力计算混合气力；
  - `005DB840 GetExpeditionActionPointCost`。
  https://github.com/sean2077/311SireCustomizedPackageDev
- 游侠NETSHOW《三国志11pk内存修改》：
  - 再次记录 `004BF522` 输送抵达+200；
  - `005DB107/005DB86E` 军事府对输送/出征AP减半。
  https://game.ali213.net/thread-2168294-1-1.html
- 日文 Wiki《功績値》：
  - 輸送・到着=200；
  - 補給=100；
  - 补给另有统率经验+2实测记录。
  https://w.atwiki.jp/sangokushi11/pages/113.html
- 日文 Wiki《各種経験値》：
  - “輸送部隊を率いての補給”统率经验+2；
  - PC手动补给同样获得+2的实测记录。
  https://w.atwiki.jp/sangokushi11/pages/79.html
- 日文 Wiki《戦争》：
  - PC补给量可调；
  - 补兵后气力按新旧兵数平均；
  - 2500兵气力0补到5000、供应气力100 => 最终气力50。
  https://w.atwiki.jp/sangokushi11/pages/85.html
- 日文 Wiki《兵科》：
  - PC可任意调节补给量，CS不可；
  - 输送队是独立TroopType的后勤单位。
  https://w.atwiki.jp/sangokushi11/pages/91.html
- 日文 Wiki 2ch历史日志：
  - PC相邻手动补给有滑块；
  - 直接把目标部队作为移动目标会自动向最大兵数/物资补给；
  - 补士兵要求等量当前兵科物资（枪、戟等）。
  https://w.atwiki.jp/sangokushi11/pages/1950.html
- 日文 Wiki《戦争/コメントログ1》：
  - 输送队不能接受普通补给；
  - 输送队粮尽/地形消灭时货物消失，被敌军击破时货物可被掠夺。
  https://w.atwiki.jp/sangokushi11/pages/1471.html

证据等级：输送到据点+200、容量/封顶地址、军事府输送AP减半为PC-PK1.1地址级；PC补给交互、兵装约束、气力平均、补给+100/统率EXP+2为长期可复现实测/high。完整PC supply/arrival finalizer与逐类兵装容量仍open。


### E7 技巧系统专项

- 311MemoryResearch `内存资料/地址资料.txt`：
  - 技巧ID 0～35及大量PC-PK1.1效果入口；
  - 锻炼类战斗伤害1.10，精锐1.15并覆盖锻炼；
  - 精锐枪/戟/弩/骑基础攻防+10，移动+6/+6/+6/+2；
  - 矢盾/大盾30%；
  - 良马+4、骑射射程+1；
  - 熟练兵100→120、军制改革+3000；
  - 云梯1.4/1.2；
  - 车轴+4、城壁强化+3000、强化防御反击×2；
  - 神火计距离+2、木牛流马+3；
  - 政令整备50%、人心掌握ID35；
  - 技巧P上限10000；
  - 技术研究能力经验=消费技巧P/100。
  https://github.com/sjn4048/311MemoryResearch
- 311MemoryResearch `函数[计算部队属性].txt`：
  - 精锐四兵科基础攻防+10的面板链。
  https://github.com/sjn4048/311MemoryResearch
- 311MemoryResearch `函数[部队攻击].txt` / 地址资料战斗段：
  - 锻炼1.10；
  - 精锐1.15；
  - 精锐覆盖锻炼而非相乘；
  - 云梯建筑伤害层。
  https://github.com/sjn4048/311MemoryResearch
- 日文 Wiki《技巧研究》：
  - 9系×4级完整表；
  - Lv1～4技巧P/金费用；
  - 技巧效果与研究时间实测；
  - PK内政系。
  https://w.atwiki.jp/sangokushi11/pages/90.html
- 日文 Wiki《技巧研究/コメント》：
  - 超级难度相关能力和70/140/210/280分档；
  - 210能力和无人才府的30/40/60/90日锚点；
  - 人才府与280能力和的高档锚点。
  https://w.atwiki.jp/sangokushi11/pages/337.html
- 日文 Wiki《功績値》：
  - 技巧研究Lv1～4主表功绩500/1000/2000/3000。
  https://w.atwiki.jp/sangokushi11/pages/113.html
- 游民星空《技术详解》：
  - 8系费用、效果与早期PC补丁差异；
  - 用作Wiki/逆向交叉来源，补丁差异转E8。
  https://www.gamersky.com/handbook/200806/114545.shtml
- 本项目既有专项：
  - E3精锐面板；
  - E4熟练兵；
  - B3/B4难所行军与移动；
  - D10军制改革；
  - C10政令整备；
  - D6人心掌握；
  - B8港关扩张。

证据等级：技巧ID和多数核心常量为PC-PK1.1地址/反汇编级；完整技巧树、费用和若干行为由Wiki/Gamersky交叉。E8已把PK1.1工兵育成闭合为内政设施×2、城市港关×2.5；当前仍open的是完整研究时间函数、兵粮袭击 `005ADB20` 的原RNG/资源边界、应射PC caller/水战/连锁细边界与技巧研究功绩逐地址。爆药炼成原PC判定BUG与补丁差异见E8。


### E8 技巧补丁版本差异专项

- 光荣 GameCity Vanilla Windows Ver1.1 官方更新页：
  - 2006-04-10；
  - 1.0→1.1；
  - AI与BUG修复；
  - 已安装PK时不需本体更新。
  https://www.gamecity.ne.jp/regist_c/user/san11/san11_update.htm
- 光荣 GameCity Vanilla 更新历史：
  - Ver1.2 2006-05-01明确写“攻击等伤害平衡”调整；
  - 后续1.3～1.3.3继续AI/BUG平衡；
  - 官方未提供逐技巧常量变更表。
  https://www.gamecity.ne.jp/regist_c/user/san11/san11_update02_history.htm
- 光荣 GameCity PK 官方更新页：
  - PK Ver1.1 2006-10-04；
  - PK Ver1.1.1 2007-03-14；
  - 1.1.1修复兵粮预测/消耗、怒髪、贯矢技巧P等；
  - 未列技巧树常量重平衡或爆药炼成判定BUG修复。
  https://www.gamecity.ne.jp/regist_c/user/san11/pk/san11pk_update.htm
- 游民星空《三国志11 技术详解》：
  - 明确回顾 Vanilla Ver1.0 与后期差异：枪兵锻炼20→10%、精锐枪/戟/弩移动2→6、云梯20%→后期约140%、工兵育成400%→250%、防御强化120%→200%；
  - 只对枪兵锻炼明确写Ver1.0=20%，不据此强推戟/弩/骑Lv1。
  https://www.gamersky.com/handbook/200806/114545.shtml
- 311MemoryResearch `整理/Func-自动01-耐久恢复.txt`：
  - 工兵育成ID24；
  - 内政设施有技巧×0.30、无技巧×0.15 => 相对×2；
  - 城市/港/关无技巧路径额外×0.4，有技巧跳过 => 相对×2.5。
  https://github.com/sjn4048/311MemoryResearch
- 311MemoryResearch `地址资料.txt`：
  - 爆药炼成ID31原BUG与修复说明；
  - 社区修复地址 `005B1227 / 005B1239`；
  - 矢盾对战法社区修改 `005AE01B`；
  - 大盾对战法社区修改 `005AE083`。
  https://github.com/sjn4048/311MemoryResearch

证据等级：官方页面只证明官方版本链和公开变更大类；Ver1.0→后期技巧差异来自当年攻略回顾；PK1.1工兵育成与爆药/盾类原逻辑来自逆向。精确1.1/1.2 transition patch、地区发行版差异和主机版逐项常量仍open。


### E9 兵粮袭击专项

- 311MemoryResearch `函数[部队攻击].txt`：
  - 主攻击函数 `005AFC70` 同时处理普通攻击与战法；
  - 目标为部队时，附加效果段 `005B03F5～005B0401` 调用 `005ADB20`；
  - 反击/反伤支路明确跳过“扫讨、威风和袭击兵粮”等判定；
  - 设施目标走另一条分支，不进入该 helper。
  https://github.com/sjn4048/311MemoryResearch
- 311MemoryResearch `地址资料.txt`：
  - `005ADB55`：技术ID1=袭击兵粮。
  https://github.com/sjn4048/311MemoryResearch
- 日文 Wiki《技巧研究》：
  - 枪兵每次攻击会让敌军兵粮减少；
  - 数量非常小。
  https://w.atwiki.jp/sangokushi11/pages/90.html
- 游民星空 / 游侠 2008《技术详解》：
  - 每次敌减/己增 `攻击力×R`；
  - `R=1～2`；
  - 每2名己兵最多抢1粮，即自身兵力/2封顶；
  - 攻击105时最大210的示例。
  https://wap.gamersky.com/gl/Content-114545.html
  https://3g.ali213.net/gl/html/7604.html
- 现代枪兵专项实测：
  - 攻击84的部队，普通攻击和战法多次结果都位于84～168；
  - 200兵时上限100；
  - 连击可发生两次抢粮。
  https://k.sina.com.cn/article_6551359332_1867dcf64001013y31.html
- `tankyc/sango_infinity` 独立复刻：
  - 使用 `k=10..20` 整数随机档；
  - `min(troops/2, Attack*k/10)`；
  - 仅作为 compatibility reconstruction，不作为原EXE反汇编证据。
  https://github.com/tankyc/sango_infinity

证据等级：触发位置、目标类型、普通/战法共用与反击跳过为PC-PK1.1 reverse-engineered；Attack×R、R∈[1,2]、兵力/2封顶为 documented + empirical-high。`005ADB20` 本体尚未恢复，因此原RNG粒度、目标缺粮/攻方满粮、盾类零伤害、支援/水战边界仍open。


### E10 应射专项

- 311MemoryResearch `地址资料.txt`：
  - `00584DC8`：应射/还射，techId=9。
  https://github.com/sjn4048/311MemoryResearch
- 游侠 NETSHOW《三国志11pk内存修改》：
  - 独立转录同一地址 `00584DC8`，用于地址交叉确认。
  https://game.ali213.net/thread-2168294-1-1.html
- 日文 Wiki《技巧研究》：
  - 弩兵受到弩攻击时反击；
  - 与连战存在互动。
  https://w.atwiki.jp/sangokushi11/pages/90.html
- 日文 Wiki《戦争》：
  - 火矢通常不受反击，应射弩兵是明确例外。
  https://w.atwiki.jp/sangokushi11/pages/85.html
- 日文 Wiki《支援攻击》：
  - 对应射弩兵做间接普通攻击时，攻击方支援攻击会被抑制；
  - 近接普通、近接战法、间接战法仍可触发支援；
  - 目标混乱/伪报时该抑制消失。
  https://w.atwiki.jp/sangokushi11/pages/1584.html
- 2ch 历史日志 Part54：
  - 应射覆盖弩/舰船间接攻击、骑射和箭类战法；
  - 超射程与森林目标合法性会阻止；
  - 支援攻击不触发应射；
  - 邻接贯矢/乱射卷入时可出现近身回应形式。
  https://w.atwiki.jp/sangokushi11/pages/1956.html
- Wiki《特技一覧》：
  - PCPK 急袭可50%规避应射反击伤害。
  https://w.atwiki.jp/sangokushi11/pages/13.html
- 游民星空/游侠《技术详解》：
  - 应射只限弩兵队，且包括战法。
  https://www.gamersky.com/handbook/200806/114545_2.shtml

证据等级：techId与地址为PC地址级；箭类攻击集合、射程/地形/支援/异常/急袭边界为多来源长期实测high。`00584DC8` 完整caller、水上active profile、PC连战链序仍open。


### E11 技巧研究时间专项

- 日文 Wiki《技巧研究/コメント》：
  - 超级难度下相关能力和在70/140/210/280处分档；
  - 能力和210、无人材府时30/40/60/90日；
  - 210或280 + 人材府时Lv1都可10日；
  - 280 + 人材府时Lv4为60日；
  - 评论明确说其他难度差异未确认。
  https://w.atwiki.jp/sangokushi11/pages/337.html
- 游侠 NETSHOW《三国志11pk内存修改》：
  - `005D7ED7`：人才府使技巧研究-20日；
  - `005D7EF0 / 005D7EF4`：有人才府时最低1旬。
  https://game.ali213.net/thread-2168294-1-1.html
- 2006 无印技巧攻略：
  - 明确提示技巧研究时间并非固定；
  - 枪/戟/弩/骑/练兵通常显示30/40/60/90；
  - 发明/防卫/火攻通常显示40/50/70/100。
  https://www.gamersky.com/handbook/200603/21607.shtml
- 2006 PK 技巧攻略：
  - PK新增内政系通常显示40/50/70/100；
  - 再次提供各系通常显示时长。
  https://www.gamersky.com/handbook/200609/33179.shtml

证据等级：人才府-20日/最低10日为PC地址级；70/140/210/280及210/280锚点为Super empirical-high；两组通常时长为documented-guide。完整PC计算函数与完整矩阵仍open。

### P0-4 火焰持续与自然蔓延专项

- 日文 Wiki《戦争》《ダメージ検証》《決戦制覇》：
  - 火计/火罠伤害实测；
  - 会心延长燃烧；
  - 火球与火罠连锁属于主动范围/陷阱链。
  https://w.atwiki.jp/sangokushi11/pages/85.html
  https://w.atwiki.jp/sangokushi11/pages/92.html
  https://w.atwiki.jp/sangokushi11/pages/2166.html
- 巴哈姆特旧资料：
  - 火计会心会延长燃烧回合。
  https://forum.gamer.com.tw/Co.php?bsn=60001&sn=380559
- 火系统专项实测：
  - 成对观察普通1/3/3、强制会心2/4/4，支持“基础结果+1”而非固定持续值。
  https://www.bilibili.com/opus/374609164980707553
- 311MemoryResearch：
  - 已定位火神、着火格火伤、火罠/业火 casualty 等路径；
  - 公开文本未恢复点火寿命 setter。
  https://github.com/sjn4048/311MemoryResearch
- SIRE 地址表：
  - `00486320 IsBuildingOnFire`；
  - `00495CA0 IsTroopOnFire`。
  https://github.com/sean2077/311SireCustomizedPackageDev/blob/dev/material/内存地址汇总.md
- `tankyc/sango_infinity`：
  - `SetFire` 使用普通[1,2]、70/30，会心[2,3]、70/30；
  - 当前 `SpreadFire` 是可配置的现代扩展，不能当作原作证明。
  https://github.com/tankyc/sango_infinity/blob/main/Project/Assets/Sango/Scripts/Game/Object/Skill/Effect/SetFire.cs
  https://github.com/tankyc/sango_infinity/blob/main/Build/Content/Data/Common/Skills.json

证据等级：会心持续+1为empirical-high；原版自然邻格扩散为negative-evidence-high并在fidelity关闭；70/30为secondary-code-reconstruction fallback；原始PC-PK1.1寿命RNG仍open。

### P0-5 登场 / 自然死亡专项

- 311MemoryResearch `函数[每月例行处理].txt`：
  - `00590C30` 月初例行处理；
  - `00590C82 -> 005833D0` 被原研究注释为武将年龄/死亡相关处理。
  https://github.com/sjn4048/311MemoryResearch/blob/master/内存资料/函数[每月例行处理].txt
- 311SireCustomizedPackageDev：
  - `struct_person` 的 YearOfDebut / Birth / Death / Cause / Identity / ScheduledLord / Flags / Health；
  - `struct_scenario` 的 IgnoreAge / DieInBattleSetting / Lifetime / ComeOnStage；
  - `0048A000 GetDeathYear`、`00489160 IsMarkedForDeath` 等 helper。
  https://github.com/sean2077/311SireCustomizedPackageDev/blob/dev/material/结构体汇总.md
  https://github.com/sean2077/311SireCustomizedPackageDev/blob/dev/material/内存地址汇总.md
- 早期攻略 / 日文 Wiki：
  - 登场设置分史实 / 假想；
  - 假想时未发现/在野位置随机并把登场年改为成人年；
  - 成人年龄15作为高置信实测口径。
  https://gamefaqs.gamespot.com/pc/931351-romance-of-the-three-kingdoms-xi/faqs/49611
  https://w.atwiki.jp/sangokushi11/pages/144.html
  https://w.atwiki.jp/sangokushi11/pages/1787.html
- 寿命资料：
  - Lifetime 分 Historical / Longevity / Fictional；
  - Longgevity约+20年、Fictional约99岁为 documented/empirical compatibility profile；
  - 自然死/不自然死行为分离。
  https://w.atwiki.jp/sangokushi11/pages/983.html
  https://gamefaqs.gamespot.com/boards/931351-romance-of-the-three-kingdoms-xi/54844812
  https://gamefaqs.gamespot.com/boards/931351-romance-of-the-three-kingdoms-xi/47785604
- 孙策 lifespan anchor：
  - 编辑没年189后于吉事件集中205～206；
  - 正常数据有216年前后样本；
  - 事件胜利延寿20年。
  https://w.atwiki.jp/sangokushi11/pages/579.html
  https://w.atwiki.jp/sangokushi11/pages/918.html

证据等级：月初 dispatcher 为PC-PK1.1 reverse-engineered-partial；登场/寿命模式语义为documented/empirical-high；+20/99岁与65/25/8/2均不是原EXE exact；`005833D0 / 0048A000` 内部函数继续open。

### P0-6 非自然忠诚变动专项

- KOEI PK说明书：
  - 金钱褒赏100金/人、5AP/人；
  - 可多人、每人每回合一次；
  - 显示忠诚100和部队从军武将不可；
  - 宝物授予10AP、价值越高加忠越多。
  https://cdn.akamai.steamstatic.com/steam/apps/628070/manuals/32sangokushi11wpk_manual.pdf
- 311MemoryResearch `修改记录by sjn4048.txt`：
  - `005B5D60` 位于褒赏扣行动力/扣钱执行链。
  https://github.com/sjn4048/311MemoryResearch/blob/master/内存资料/修改记录by%20sjn4048.txt
- 311MemoryResearch `Func-收支03-每月钱粮兵装收支.txt`：
  - `004CF360` 获取现役列表；
  - `0049F2A0` 计算总俸禄；
  - `005909AA` 不足时跳过唯一的 `sub edi,eax`；
  - `0058D5E0` 准备欠薪；
  - `0058C190` 后段统一忠诚下降。
  https://github.com/sjn4048/311MemoryResearch/blob/master/内存资料/整理/Func-收支03-每月钱粮兵装收支.txt
- 311MemoryResearch `函数[计算流言是否成功].txt`：
  - 成功率计算与效果结算分离；
  - 标出 `005D05B0 / 005D05F0` 两个流言相关 helper，但未展开函数体。
  https://github.com/sjn4048/311MemoryResearch/blob/master/内存资料/函数[计算流言是否成功].txt
- 日文 Wiki：
  - 君主魅力影响褒赏忠诚上升量；
  - 宝物价值影响授予加忠；
  - 君主亲爱/义理等与流言效果有明显关系。
  https://w.atwiki.jp/sangokushi11/pages/1598.html
  https://w.atwiki.jp/sangokushi11/pages/79.html
  https://w.atwiki.jp/sangokushi11/pages/74.html
  https://w.atwiki.jp/sangokushi11/pages/95.html
- PC-PK实测：
  - 隐藏忠诚99经褒赏可到108；
  - 流言可削减>100的隐藏忠诚；
  - 成功流言的目标与下降量存在随机性。
  https://www.ptt.cc/bbs/Koei/M.1776854540.A.47B.html
- 2018百人都市极端实测：
  - 100+武将城市承受300+成功流言，治安归0但大多数武将忠诚几乎不变，只有少数显著下降；
  - 否定“每次成功对全城全员统一扣忠”的实现。
  https://www.ptt.cc/bbs/Koei/M.1526989285.A.762.html
- 现代复刻 `sango_infinity`：
  - 当前褒赏“保底11+额外”与原作+5/+8/+9样本冲突；
  - 当前流言“全员8..15+义理”配置注释本身就是工程调参；
  - 两者仅作 negative/reconstruction 对照，不作 fidelity 证据。
  https://github.com/tankyc/sango_infinity

证据等级：月俸支付事务为PC-PK1.1 reverse-engineered；褒赏命令语义为official；褒赏增量为empirical-high、公式open；流言 blanket-all-officer 模型由强反例否定，原 target/loss/security 函数仍open。

### P0-7 俘虏释放专项

- 311MemoryResearch `Func-收支03-每月钱粮兵装收支.txt`：
  - 俘虏维护50金/人；
  - releaseCount = unpaid count；
  - `0058C320 -> 004AA200 -> 004A8E10` subset 选择架构；
  - `0058D1D0` 每据点累计；
  - `0058D430` 全据点后的 finalizer。
  https://github.com/sjn4048/311MemoryResearch/blob/master/内存资料/整理/Func-收支03-每月钱粮兵装收支.txt
- SIRE / IDB导出：
  - `ForbiddenLord +0x164`、`ForbiddenMonths +0x168`；
  - IDB functions.csv 确认 `0058C320 / 0058D1D0 / 0058D430` 函数边界，但没有公开函数体。
  https://github.com/sean2077/311SireCustomizedPackageDev/blob/dev/material/结构体汇总.md
  https://github.com/fudanglp/311resource/blob/master/extractor/ida/data/python_idb/san11pk_dump.exe_functions.csv
- 官方 PK 手册：
  - “追放”可以释放敌方俘虏；
  - 无期间/金/AP/执行武将、最多6人；
  - 释放敌俘会增加技巧P。
  https://cdn.akamai.steamstatic.com/steam/apps/628070/manuals/32sangokushi11wpk_manual.pdf
- 技巧P数值：
  - 旧讨论记录“2或3”“约3”；只作 empirical candidate。
  https://w.atwiki.jp/sangokushi11/pages/1993.html
- 禁仕冲突：
  - Wiki小ネタ与2009记录支持释放后禁仕、其中一条称3个月；
  - 2011记录明确称自主释放不立禁仕flag、逃亡才立；
  - 因此按 release cause/version 继续open。
  https://w.atwiki.jp/sangokushi11/pages/15.html
  https://w.atwiki.jp/sangokushi11/pages/1965.html
  https://w.atwiki.jp/sangokushi11/pages/2219.html

证据等级：forced release人数与选择管线为PC-PK1.1 reverse-engineered；主动释放增加技巧P为official-confirmed；+3仅empirical candidate；主动释放3个月禁仕为conflicted，不标exact。

### P0-8 自动封官专项

- 311MemoryResearch `函数[自动封官].txt`：
  - `005FAF00` 完整 selector；
  - arg1候选列表、arg2官职、arg3 mode；
  - `005FA650(office)` 返回 office type；
  - `005FA4D0(person,office)` 前置资格；
  - 忠诚<90硬拒绝；
  - weighted-threshold 与 role-affinity 两套 score；
  - 最终只在 candidateScore > bestScore 时替换，因此同分 first-in wins。
  https://github.com/sjn4048/311MemoryResearch/blob/master/内存资料/函数[自动封官].txt
- 311MemoryResearch `地址资料.txt`：
  - 4000功绩阶梯；
  - `005FAF78` 忠诚90门；
  - officeId 0x2C=军师将军等 ID 锚点。
  https://github.com/sjn4048/311MemoryResearch/blob/master/内存资料/地址资料.txt
- SIRE struct_office：
  - named office静态布局与字段。
  https://github.com/sean2077/311SireCustomizedPackageDev/blob/dev/material/结构体汇总.md
- 311resource IDB functions 导出：
  - 确认 `005FA4D0 / 005FA650 / 005FAF00` 函数边界；
  - 当前导出不含xref/decompiler，因此caller仍open。
  https://github.com/fudanglp/311resource/blob/master/extractor/ida/data/python_idb/san11pk_dump.exe_functions.csv
- SIRE v1.26历史更新：
  - 明确“电脑自动封官规则可设定”；
  - 只作为 mode 业务方向的旁证，不能替代 caller xref。
  https://games.sina.com.cn/d/e/pc/140457.shtml
  https://patch.ali213.net/showpatch/18430.html

证据等级：单官职 selector score、忠诚门、两种 mode 和 final same-score first-wins 为PC-PK1.1 reverse-engineered；office type mapping为reverse-inferred-high；candidate caller order、arg3业务映射与多官职scheduler仍open。

### P0-9 部队资源事务专项

- 311MemoryResearch 出征窗口：
  - 00647250 / sub_647250 为 battle troop-count draft；
  - 枪戟弩马库存限制与最小1兵。
  https://github.com/sjn4048/311MemoryResearch/blob/master/内存资料/出征窗口部分界面代码.txt
- 311MemoryResearch 地址资料：
  - battle money 10000 / food 50000；
  - transport troops 60000 / money 100000 / food 500000；
  - transport equipment cap地址006157C1/D8、004962CF/D6、补给后00496306/0D/28/2F；
  - troop strength无法突破65535的研究注记。
  https://github.com/sjn4048/311MemoryResearch/blob/master/内存资料/地址资料.txt
- 311SireCustomizedPackageDev：
  - building getters/setters/adjust helpers 00486950、00486B10、00486C80、00486DF0、00487230、00487310、004873F0、004874D0、004AE2A0、004AE300、004AE3C0、004AE430；
  - troop resource helpers 004954E0、00496010、00496280、004AE4A0、004AE510、004AE570。
  https://github.com/sean2077/311SireCustomizedPackageDev/blob/dev/material/内存地址汇总.md
- 311resource IDB functions.csv：
  - 00647D8E/00647E2A落在sub_647AC0；
  - transport cap地址分别落在sub_615790/sub_615A10；
  - 当前导出只有函数/名称/结构体，没有xref/decompiler，故不能据此虚构finalizer。
  https://github.com/fudanglp/311resource/blob/master/extractor/ida/data/python_idb/san11pk_dump.exe_functions.csv
  https://github.com/fudanglp/311resource/blob/master/docs/analysis/ida_resource_hints.md
- SIRE early reverse-history：
  - 明确修复“transport equipment cap配置超过100000，补给后会回到100000”，暴露原硬编码100000路径。
  https://www.xycq.org.cn/forum/viewthread.php?action=printable&tid=209820
- 官方 PK 手册 / 日文Wiki：
  - 出征可编辑兵/钱/粮/陆水兵装；
  - 输送用于运输兵装/资金/兵粮；
  - 数量型装备与士兵数相匹配。
  https://cdn.akamai.steamstatic.com/steam/apps/628070/manuals/32sangokushi11wpk_manual.pdf
  https://w.atwiki.jp/sangokushi11/pages/85.html
- 2006原作实测：
  - 部队进入容量已满据点时，超出部分会提示损失。
  https://forum.gamer.com.tw/Co.php?bsn=6331&sn=41312
- tankyc/sango_infinity：
  - 当前commit/return代码仅作现代architecture对照，不作为原EXE证据。
  https://github.com/tankyc/sango_infinity

证据等级：battle/transport基础容量与draft地址为PC-PK1.1 reverse-engineered；transport equipment 100000为reverse-history-high；commit/return资源守恒为official/structure/gameplay-high；actual finalizer opcode/order继续open。

### P0-10 主副将关系 / FPU取整专项

- 311MemoryResearch `函数[计算部队属性].txt`：
  - `00496570 GetTroopCapabilities`；
  - 统/武调用`00495AB0`；
  - 智/政/魅直接取高；
  - 最终攻防/建设调用`00707A74`。
  https://github.com/sjn4048/311MemoryResearch/blob/master/内存资料/函数[计算部队属性].txt
- 311MemoryResearch `地址资料.txt`：
  - `00495B65 C1 F8 02`：普通关系正差值/4；
  - `00495B79 D1 F8`：亲爱正差值/2。
  https://github.com/sjn4048/311MemoryResearch/blob/master/内存资料/地址资料.txt
- 311resource IDB names/functions：
  - `00707A74 ConvertFloatToIntegerAndStoreInEAX`；
  - 内部label为`arg_is_not_integer_QnaN / positive / integer_QnaN_or_zero / localexit`；
  - 下一函数从00707AE9开始。
  https://github.com/fudanglp/311resource/blob/master/extractor/ida/data/python_idb/san11pk_dump.exe_functions.csv
  https://github.com/fudanglp/311resource/blob/master/extractor/ida/data/python_idb/san11pk_dump.exe_names.csv
- Microsoft CRT `ftol2.asm`：
  - 原标题明确为“truncate TOS to 32-bit integer”；
  - 控制流/label与San11 IDB完全对应；
  - 因此`00707A74`最终语义为toward-zero truncation。
  https://github.com/tongzx/nt5src/blob/master/Source/XPSP1/NT/base/crts/fpw32/tran/i386/ftol2.asm
- 日文Wiki PS2精确副将测试：
  - 亲爱1/2、血缘1/3、普通1/4；
  - 加成小数舍去；
  - 夫妻/义兄弟full-share另有长期实测。
  https://w.atwiki.jp/sangokushi11/pages/30.html
  https://w.atwiki.jp/sangokushi11/pages/8.html
- SIRE PC原版规则说明：
  - “最高武统值计算”修改把普通非嫌恶组合提升到最高值；
  - 原版义兄弟/夫妻本身就是例外/full-share；
  - 作为PC侧高置信交叉，不代替`00495AB0`完整opcode。
  https://patch.ali213.net/showpatch/18430.html
  https://www.53miji.com/contents/201502/15507.html

证据等级：`00707A74=_ftol2`和toward-zero转换为runtime-level exact；普通/亲爱divisor为PC opcode exact；夫妻/义兄弟为PC reverse-author documented-high + PS2 empirical-exact；血缘/3仍缺PC逐指令。

### P0-11 训练/气力 exactness专项

- 311MemoryResearch `Func-内政04-执行训练.txt`：
  - `005C4220` 入口先调用 `005C4100(SP)`；
  - 之后才调用 `005B8320` 参数校验；
  - `004AD080(SP,1)` 设置已训练。
  https://github.com/sjn4048/311MemoryResearch/blob/master/内存资料/整理/Func-内政04-执行训练.txt
- 311MemoryResearch `Func-自动02-计数器处理【未】.txt`：
  - `00599CF0` 完整公开body不清 CityActions+0xA4 / 港关+0x68，因此排除为训练reset。
  https://github.com/sjn4048/311MemoryResearch/blob/master/内存资料/整理/Func-自动02-计数器处理【未】.txt
- 311resource IDB functions.csv：
  - `005C4100..005C421F` 独立gate函数；
  - `0059A230..0059A4AF` 覆盖军乐台/奏乐/诗想全部已知地址。
  https://github.com/fudanglp/311resource/blob/master/extractor/ida/data/python_idb/san11pk_dump.exe_functions.csv
- SIRE struct/address：
  - CityActions bit4=已训练；
  - 港/关 +0x68 TrainingCompleted；
  - `0047B710 SetCityTrainingStatus`、`004AD080 SetSPTrainingStatus`。
  https://github.com/sean2077/311SireCustomizedPackageDev
- KOEI PK官方手册：
  - 训练每回合仅一次、20AP、最多3人、武力合计影响效果。
  https://cdn.akamai.steamstatic.com/steam/apps/628070/manuals/32sangokushi11wpk_manual.pdf
- 日文Wiki《特技一覧》：
  - 奏乐每回合+5；
  - 奏乐不与军乐台同时生效；
  - 诗想使军乐台恢复翻倍到20。
  https://w.atwiki.jp/sangokushi11/pages/13.html

证据等级：training once-per-turn=official；gate function boundary=PC IDB exact；morale local handler address=PC IDB/reverse high；reset xref与global scheduler xref继续open。

### P0-12 阵系耗粮 / 粮尽专项

- 311MemoryResearch `Func-收支10-计算部队兵粮支出.txt`：
  - `0049D311 -> 0049D180` 返回单一阵系设施type；
  - `0049D32B/35/3F` 分别写城塞/砦/阵单一 multiplier；
  - bit pattern：2.0=`0x40000000`、阵=`0x3FD55555`、砦=`0x3FAAAAAB`、城塞=`0x3F800000`；
  - 公共0.05f=`0x3D4CCCCD`。
  https://github.com/sjn4048/311MemoryResearch/blob/master/内存资料/整理/Func-收支10-计算部队兵粮支出.txt
- 311MemoryResearch `Func-收支02-每旬耗粮.txt`：
  - 0粮对象本旬直接跳过；
  - 正粮扣到0只进入粮尽消息列表；
  - 公开函数体无 troop-strength reduction。
  https://github.com/sjn4048/311MemoryResearch/blob/master/内存资料/整理/Func-收支02-每旬耗粮.txt
- SIRE：
  - `00599AA0 ReducePopForStarvedBesiegedSP` 明确是围城断粮据点人口衰减，不是野外部队粮尽掉兵。
  https://github.com/sean2077/311SireCustomizedPackageDev/blob/dev/material/内存地址汇总.md
- KOEI PK官方说明书：
  - 无兵粮会导致士兵减少；未给具体比例。
  https://cdn.akamai.steamstatic.com/steam/apps/628070/manuals/32sangokushi11wpk_manual.pdf
- 日文Wiki《戦争》：
  - 0粮时兵力每回合大幅下降；未给闭式。
  https://w.atwiki.jp/sangokushi11/pages/85.html

证据等级：防御设施单一selector/不叠乘、float32常量、0059BF40与starvation分层为PC-PK1.1 source-level；overlap winner与starvation exact函数继续open；0.76不再属于empirical-high。

### P0-13 补给 / 输送 finalizer专项

- 311MemoryResearch `地址资料.txt`：
  - `004BF522` 输送队抵达据点功绩+200；
  - 输送/补给后的兵装上限相关地址；
  - `005DB840` 周边出征/输送AP信息。
  https://github.com/sjn4048/311MemoryResearch/blob/master/内存资料/地址资料.txt
- 311resource IDB functions.csv：
  - `004BF522` 落在 `sub_4BF1F0` 内；
  - 下一函数 `004BF6F0`，因此 arrival completion path 的 containing function 范围已锁定。
  https://github.com/fudanglp/311resource/blob/master/extractor/ida/data/python_idb/san11pk_dump.exe_functions.csv
- 311SireCustomizedPackageDev：
  - `004B9840 GetBuildingCombinedStrength`，按原/新增兵力和气力计算混合气力；
  - target troop/SP 资源 limit/getter/adjust helper；
  - `005DB840 GetExpeditionActionPointCost`。
  https://github.com/sean2077/311SireCustomizedPackageDev/blob/dev/material/内存地址汇总.md
- 日文Wiki《戦争》《兵科》：
  - 补兵后气力按兵数平均；
  - PC手动补给量可调；
  - 输送队不可作为普通补给目标。
  https://w.atwiki.jp/sangokushi11/pages/85.html
  https://w.atwiki.jp/sangokushi11/pages/91.html
- 日文Wiki旧2ch日志：
  - 直接以目标部队为移动目标会自动向最大兵/物资方向补给；
  - 目标据点已满时输送的兵/金等超出部分会提示并消失；
  - COM会继续往满仓据点输送，造成物资损失。
  https://w.atwiki.jp/sangokushi11/pages/1950.html
  https://w.atwiki.jp/sangokushi11/pages/1992.html
  https://w.atwiki.jp/sangokushi11/pages/1958.html
- 日文Wiki《功績値》：
  - 输送到达+200、野外补给+100。
  https://w.atwiki.jp/sangokushi11/pages/113.html
- 战争评论日志：
  - 输送队因粮尽/栈道等消灭时货物消失；
  - 被敌军击破时货物可能被掠夺。
  https://w.atwiki.jp/sangokushi11/pages/1471.html

证据等级：arrival +200为PC地址级；arrival containing function range为IDB exact；到达overflow discard、手动/自动补给、输送队不可补给为PC empirical-high；气力加权核心为wiki+原building helper high；troop非整除rounding、wild-supply finalizer和sub_4BF1F0资源写入顺序仍open。

### P0-14 技巧研究时间专项

- 311resource IDB functions.csv：
  - `005D7DD0..005D7EFF` 包含人才府减时与最低1旬逻辑；
  - `005D8C50..005D8F9F` 为研究命令执行相关函数范围。
  https://github.com/fudanglp/311resource/blob/master/extractor/ida/data/python_idb/san11pk_dump.exe_functions.csv
- 311MemoryResearch：
  - `005D8F68` 技巧研究行动力路径；
  - `00599CF0` 每旬 ResearchTimeLeft -1。
  https://github.com/sjn4048/311MemoryResearch
- 311SireCustomizedPackageDev：
  - struct_force +0x9C ResearchingTech / +0xA0 ResearchTimeLeft；
  - struct_technology[36] size0x6C，目前仅明确+0x60 RequiredPoints，未恢复研究时间字段。
  https://github.com/sean2077/311SireCustomizedPackageDev
- 日文Wiki《技巧研究》：
  - 超级实测相关能力合计70/140/210/280处分档；
  - 210无人材府30/40/60/90；
  - 280+人才府Lv4=60；
  - 明确写“难度による変化は未確認”。
  https://w.atwiki.jp/sangokushi11/pages/90.html
- 早期攻略：
  - 枪戟弩骑练兵一般30/40/60/90；
  - 发明防卫火攻/PK内政一般40/50/70/100；
  - 同时声明研究时间不是固定值。
  https://www.gamersky.com/handbook/200603/21607.shtml
  https://gl.ali213.net/html/2006/5914.html

证据等级：人才府-20日/最低10日为PC地址级exact；containing function由原IDB边界确认；超级阈值为empirical-high；完整base-time函数/矩阵、初级上级仍open。


### 生产价格捕获输入整数核（2026-10-09）

[完整支持域](production-price.md)；[固定原文](https://github.com/sjn4048/311MemoryResearch/blob/66e167e40c3440929ec016f3872aefc3486434c1/内存资料/整理/Func-内政10-计算生产价格.txt)，GBK blob `928b34bd8b9f06057dd44e9639db92dacc364c85`。原45条/113字节与独立MOD6条/14字节分别固定；[可逆快照](../sources/production-price-original.txt)、[证据记录](../sources/production-price.json)、[闭合schema](../sources/production-price.schema.json)、[Apache-2.0许可](../sources/production-price-LICENSE.txt)。005C637A先保存uint16原价；TEST AL清CF，JNA仅AL0不折；C1FA02为SAR EDX2，源sar dl错字保留。显示MOD80/100在全uint16域数值相同仍隔离。`source-listing-reconstruction`，不证明价格表/ID/helper/完整命令/writer/stock或跨版本。

### 生产数量显式binary32限定核（2026-10-09）

[完整支持域](production-quantity.md)；[固定原文](https://github.com/sjn4048/311MemoryResearch/blob/66e167e40c3440929ec016f3872aefc3486434c1/内存资料/整理/Func-内政11-计算生产数量.txt)，GBK blob `e8c0c22e68e8557b202088290d52101abb02ca3a`。原88条/254字节、5 direct CALL/15 branch与两套MOD（含各自patch/trampoline及修改2数据）完全隔离；[可逆快照](../sources/production-quantity-original.txt)、[证据记录](../sources/production-quantity.json)、[闭合schema](../sources/production-quantity.schema.json)。源作者sjn4048，本数量快照明确复用[Apache-2.0许可](../sources/production-price-LICENSE.txt)。完整EAX验证/技能/virtual、getter仅AL，先技能倍增后FIMUL/向零转换再超级倍增；不把内联政治替换、名声或MOD2特产当原式。仅接受显式已解析3F800000/3F99999A/3FC00000，不由Lv注释填stock常量。原函数无9000cap，后续004B4040实际库存writer仍缺。`source-listing-reconstruction`，stockOriginalVerified=false、originalExecutableExecuted=false、commandIntegrated=false；完整callee/设施原表/运行时和跨版本仍开放。
