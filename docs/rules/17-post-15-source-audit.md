# 排除原15项后的逐点源码审计

> 每完成一个点，必须写回规则正文、审计记录与 PR。审计完成不代表所有内部函数都已恢复。
> 更新：2026-09-30，当前完成至 E20「委任 AI 权重 / 决策架构」。

## 记录保存与阅读顺序

A1–E2 的原始总表、逐项结论、源码地址和未决问题已完整保存在 [历史详细记录](audit-history/17-through-e2.md)，内容沿用原 blob `81b15b4faf86c3a7c4a1f7d2112813c4a074b459`，未删除任何历史段落。历史页末尾的“下一项”是当时状态；当前进度以本表和 STATUS 为准。

E3 的正文、来源、纠错、版本边界与测试说明见 [攻防面板与兵种基础参数](18-unit-panels.md)。

## 当前总表

| 编号 | 规则点 | 审计与写回 | 详细结论与剩余缺口 |
|---|---|---|---|
| A1 | 旬/月/季时间单位与收入触发点 | 已写回 | [历史详细记录](audit-history/17-through-e2.md) |
| A2 | 一旬内部真实结算顺序 | 已写回，完整旬级 caller 仍缺 | [历史详细记录](audit-history/17-through-e2.md) |
| A3 | 势力行动顺序 | 已写回，最终 tie-break 未确认 | [历史详细记录](audit-history/17-through-e2.md) |
| A4 | 初级/上级/超级差异 | 已写回，保留版本边界 | [历史详细记录](audit-history/17-through-e2.md) |
| A5 | 剧本初始化 | 已写回 | [历史详细记录](audit-history/17-through-e2.md) |
| B1 | 六角坐标、邻接、城市领域 | 已写回，静态地图 dump 仍缺 | [历史详细记录](audit-history/17-through-e2.md) |
| B2 | 地形×兵种战法可用性 | 已写回，骑兵浅滩仍冲突 | [历史详细记录](audit-history/17-through-e2.md) |
| B3 | 地形移动成本 | 已写回 | [历史详细记录](audit-history/17-through-e2.md) |
| B4 | 移动力加成叠加 | 已写回 | [历史详细记录](audit-history/17-through-e2.md) |
| B5 | ZOC | 已写回，伪报边界仍冲突 | [历史详细记录](audit-history/17-through-e2.md) |
| B6 | 高度与高低差 | 已写回，高度静态字段仍缺 | [历史详细记录](audit-history/17-through-e2.md) |
| B7 | 水陆切换、舰船切换 | 已写回，完整切换 caller 仍缺 | [历史详细记录](audit-history/17-through-e2.md) |
| B8 | 港关容量与所属关系 | 已写回 | [历史详细记录](audit-history/17-through-e2.md) |
| B9 | 堤防、水攻机制 | 已写回，城市受灾精确值仍缺 | [历史详细记录](audit-history/17-through-e2.md) |
| C1 | 金钱收入完整公式 | 已写回 | [历史详细记录](audit-history/17-through-e2.md) |
| C2 | 粮食收入完整公式 | 已写回，保留共用取整 helper 边界 | [历史详细记录](audit-history/17-through-e2.md) |
| C3 | 征税/征收/富豪/米道/丰作等特殊收支 | 已写回 | [历史详细记录](audit-history/17-through-e2.md) |
| C4 | 无印内政设施 | 已写回 | [历史详细记录](audit-history/17-through-e2.md) |
| C5 | PK十设施 | 已写回，若干子公式仍待恢复 | [历史详细记录](audit-history/17-through-e2.md) |
| C6 | PK吸收合并 | 已写回，工期证据分级保留 | [历史详细记录](audit-history/17-through-e2.md) |
| C7 | 各设施精确开发日数 | 已写回，原函数体仍缺 | [历史详细记录](audit-history/17-through-e2.md) |
| C8 | 商人 / 粮食交易 | 已写回，政治连续闭式仍缺 | [历史详细记录](audit-history/17-through-e2.md) |
| C9 | 行动力 | 已写回，主恢复函数体仍缺 | [历史详细记录](audit-history/17-through-e2.md) |
| C10 | 治安 | 已写回，巡查/贼的部分边界仍缺 | [历史详细记录](audit-history/17-through-e2.md) |
| C11 | 灾害 | 已写回，发生率/持续/部分损失仍缺 | [历史详细记录](audit-history/17-through-e2.md) |
| D1 | 武将生命周期 / 状态字段 | 已写回 | [历史详细记录](audit-history/17-through-e2.md) |
| D2 | 登场 / 寿命 / 死亡 | 已写回，核心寿命函数仍缺 | [历史详细记录](audit-history/17-through-e2.md) |
| D3 | 五维 / 适性 / 成长 | 已写回，部分合成与取整仍缺 | [历史详细记录](audit-history/17-through-e2.md) |
| D4 | 人际关系 | 已写回，PC 关系 helper 仍不完整 | [历史详细记录](audit-history/17-through-e2.md) |
| D5 | 登用优先级与普通概率 | 已写回，连续概率闭式仍缺 | [历史详细记录](audit-history/17-through-e2.md) |
| D6 | 相性 / 义理 / 野望 / 汉室 | 已写回，非自然忠诚路径仍缺 | [历史详细记录](audit-history/17-through-e2.md) |
| D7 | 太守 / 都督 / 军师 | 已写回，深层 selector 仍缺 | [历史详细记录](audit-history/17-through-e2.md) |
| D8 | 忠诚 / 俸禄 / 褒赏 | 已写回，褒赏与欠薪闭式仍缺 | [历史详细记录](audit-history/17-through-e2.md) |
| D9 | 俘虏 | 已写回，捕获保护/释放等边界仍缺 | [历史详细记录](audit-history/17-through-e2.md) |
| D10 | 官职 | 已写回，资格/候选排序/caller 仍缺 | [历史详细记录](audit-history/17-through-e2.md) |
| E1 | 部队编成 | 已写回，资源提交及运输兵装容量仍缺 | [历史详细记录](audit-history/17-through-e2.md) |
| E2 | 部队能力合成 | 已写回，关系 helper 与浮点取整仍缺 | [历史详细记录](audit-history/17-through-e2.md) |
| E3 | 攻防面板 / 兵种基础参数 | 已写回；12项参数表、参考验证、原版/修改器隔离 | [E3 正文与证据](18-unit-panels.md) |
| E4 | 训练效果与气力 | 已写回；训练闭式、100/120上限、练兵所×1.5、AP/经验/功绩/技巧P、军乐/奏乐/诗想与主要气力特技已核；训练gate/状态重置caller仍open | [E4 正文与证据](19-training-morale.md) |
| E5 | 兵粮消耗 | 已写回；战斗/输送/驻屯 /10,/20,/40、屯田0、阵砦城塞源码倍率、着火额外烧粮与旬级dispatcher已核；粮尽逃兵闭式仍open | [E5 正文与证据](20-food-consumption.md) |
| E6 | 补给与输送 | 已写回；输送到据点+200、野外补给+100/统率EXP+2、PC手动/自动补给、补兵兵装约束与气力加权已核；PC finalizer/逐类兵装容量仍open | [E6 正文与证据](21-supply-transport.md) |
| E7 | 技巧系统 | 已写回；36技巧ID/9系树、研究成本/能力经验、锻炼1.10/精锐1.15覆盖、主要源码常量及PK内政技巧已核；研究时间完整矩阵/部分技巧细节仍open | [E7 正文与数据](22-techniques.md) |
| E8 | 技巧补丁版本差异 | 已写回；官方Vanilla/PK补丁链、Ver1.0→后期7条明确差异、PK工兵育成×2/×2.5、爆药原BUG与社区修复隔离已核；精确transition patch/主机版差异仍open | [E8 正文与数据](23-technique-patch-differences.md) |
| E9 | 兵粮袭击 | 已写回；005ADB20触发路径、部队目标、普攻/战法共用、反击跳过及Attack×R/兵力2分之1上限已核；原RNG/资源裁剪/支援与水战边界仍open | [E9 正文与数据](24-food-raid.md) |
| E10 | 应射 | 已写回；00584DC8入口、弩兵/箭类/战法/射程地形/支援与异常状态边界已核；完整PC caller、水战profile与连战链序仍open | [E10 正文与数据](25-response-fire.md) |
| E11 | 技巧研究时间 | 已写回；超级70/140/210/280分档、210锚点、人才府-20日/最低10日及两组攻略显示时长已核；完整PC函数/超级完整矩阵/其他难度仍open | [E11 正文与数据](26-technique-research-time.md) |\n| E12 | 技巧研究完成功绩 | 已写回；现行500/1000/2000/3000与早期500/1000/1500/2500冲突已分级；Lv1/Lv2一致，PC-PK1.1 Lv3/Lv4 exact caller/版本映射仍open | [E12 正文与数据](27-technique-research-merit.md) |
| E13 | 混乱 / 伪报持续与恢复 | 已写回；PC-PK1.1自然恢复为确定性倒计时，普通每旬-1、合资格阵系范围-2、到0恢复；少兵自动混乱1～2已源码确认；普通计略初始duration与重复施放仍open | [E13 正文与数据](28-status-duration-recovery.md) |
| E14 | 单挑连续公式 | 已写回；非线性武力→actionRatio、命中/闪避/格挡、普通/必杀伤害与斗志增长通用核心已闭合；人物隐藏补正和Vanilla/主机版差异仍open | [E14 正文与数据](29-duel-continuous-formulas.md) |
| E15 | 舌战普通牌心理伤害 | 已写回；牌力与心理伤害分离、智力→attack、普通话题牌/大喝/诡辩反弹、怒气效果均已闭合；人物隐藏补正和跨平台常量仍open | [E15 正文与数据](30-debate-psychological-damage.md) |
| E16 | 非骑战法来源的负伤 / 战死 | 已写回；撤回普通击破统一伤亡率，弩系狙伤、猛者50%、业火conditional casualty与火矢边界已分流；selector/severity与跨平台仍open | [E16 正文与数据](31-non-cavalry-casualty-sources.md) |
| E17 | 地形伤害随机值 | 已写回；栈道100～299/格、毒泉200～399/格源码级闭合，落石1500/500与800/1000专用参数及踏破×0.1已恢复；common50 finalizer仍open | [E17 正文与数据](32-terrain-hazard-damage.md) |
| E18 | 普通君主继承优先级 | 已写回；历史事件/玩家普通死亡/COM自动继承三路分离，COM血缘>义兄弟>配偶>年长者为empirical-high；组内tie、candidate gate与004B9080函数体仍open | [E18 正文与数据](33-ruler-succession-priority.md) |
| E19 | 评定完整提案池 | 已写回；原版君主评定MSG恢复22类具体提案、两阶段采决、赞同/多选结构；proposal chooser、参与者过滤与采纳案执行链仍open | [E19 正文与数据](34-council-proposal-pool.md) |
| E20 | 委任 AI 权重 / 决策架构 | 已写回；撤回统一utility表假设，恢复005EF440出兵procedural pipeline、005AD980共用战术core、005F6CF0局部主将评分及AI势力强度硬编码；城市内政scheduler/运输与方针阈值仍open | [E20 正文与数据](35-delegated-ai-architecture.md) |

## E3 关键结论

`struct_equipment` 有12项，`+55/+56/+57` 分别保存基础攻击、防御、移动。完整数值表写入 `docs/sources/unit-panels.json`；表值为资料交叉核对，不冒充从原 EXE 导出的二进制表。

精锐枪/戟/弩/骑只把对应基础攻防各加10，再进入人物属性、适性、类型和状态乘算。人物五维上限100不能套给部队面板，精锐骑兵可得到115攻击的常规参考值。

输送队按剑兵输入时，攻击的十进制数学系数为 `60/100 × 0.6 × 0.4 = 0.144`；旧表的0.14不能作为精确计算常量。水上运输具体采用哪种攻防装备输入，继续等待原 caller，不由移动用走舸推断。

逆向资料包含原指令和修改指令：`008A9558` 的255封顶、`008A9580/95A2` 的统武加权、运输建设不衰减等都是修改部分，不当作官方规则。

本轮参考验证通过：12项静态数据、28个用例、4800组参数组合。验证对象为显式的有理数+末端向下取整参考模型；没有运行原游戏 EXE，也没有证明 `00707A74` / x87 逐位等价。

## E4 关键结论

PC-PK1.1 `005C3F50` 已恢复单次训练闭式：

```ts
S = 执行武将武力和
M = 执行武将最高武力
D = min(100, 20 + floor(据点兵力 / 2000))

gain = floor((S + M) / D) + 3
有练兵所：gain = floor(gain * 1.5)
actualGain = min(gain, 气力上限 - 当前气力)
```

训练只看武力，不看统率；据点兵越多，单次训练越困难。

执行训练还确认：

```text
AP 20；军事府城市10
每名执行武将：武力经验+2、功绩+50、置已行动
技巧P = floor(actualGain/2)+5
```

据点与部队气力上限均为100，熟练兵后120。

野外恢复主规则：军乐台范围2每旬+10；有诗想时军乐台合计+20；奏乐在无军乐台恢复时+5，不叠加。旧“城内每旬自然+5”撤回。

主要特技：扫荡-5、威风-20且优先于扫荡、昂扬击破+10、怒发受战法+5。

参考校验已验证原 magic division 在0～150000兵区间与 `floor(T/2000)` 一致，并通过12组训练向量。该校验不是原EXE运行测试。

## E5 关键结论

PC-PK1.1 旬级耗粮调度与两个核心函数已恢复：

```text
0049D200 据点耗粮
0049D2E0 部队耗粮
```

基础：

```text
野外战斗部队：兵力/10
输送队：兵力/20
城市/港/关驻屯：兵力/40
港/关有屯田：0
```

阵系设施原EXE常量比攻略表更精确：

```text
无：100%
阵：约83.33% -> 减约16.67%
砦：约66.67% -> 减约33.33%
城塞：50%
```

运输队直接跳过阵/砦/城塞减粮分支。

着火额外烧粮：

```text
当前存粮 × (6 - 政治×0.05) × 1%
```

野外看部队政治，据点看太守政治；无太守按0政治。

旬级耗粮函数在粮尽时只扣到0并记录消息，本身不扣兵；因此旧 `兵力×0.76^N` 仍只属实测fallback，粮尽逃兵原函数继续open。

## E6 关键结论

输送到据点与野外补给必须分开：

```text
到据点：功绩+200（004BF522）
野外补给：功绩+100，率领者统率经验+2
```

PC版补给量可手动调节；直接把己方部队作为输送移动目标则会自动向上限方向补给。CS版不可自由调量，固定3000兵/1000金等只作为CS经验规则。

补兵核心限制：

```text
目标剩余指挥容量
供应方剩余兵力
枪/戟/弩/马的匹配兵装数量
三者共同限制可补兵数
```

补兵后的气力按新旧士兵人数加权；2500兵气力0 + 2500新兵气力100 => 5000兵气力50。

运行时运输兵装上限和“补给后封顶”地址已经定位，但12类兵装的具体上限值尚未语义化。到达据点/野外补给 finalizer、超限货物处理与非整除气力取整继续open。

军事府使输送AP减半已由 005DB107 锁定。

## E7 关键结论

PC-PK1.1 技巧ID现已结构化为0～35，每4个一系；0～31为无印已有8系，32～35为PK新增内政系。

研究成本：

```text
Lv1 TP1000 / 金1000
Lv2 TP2000 / 金2000
Lv3 TP3000 / 金5000
Lv4 TP5000 / 金10000
3名执行武将，50AP
指导：研究金减半
技巧P上限10000
研究能力经验=消费TP/100
```

兵科伤害层最重要纠错：

```text
锻炼 Lv1 = ×1.10
精锐 Lv4 = ×1.15
精锐覆盖锻炼，不是1.10×1.15
```

精锐还另在E3面板层给基础攻防+10；枪戟弩移动+6、骑+2。

源码级常量还包括矢盾/大盾30%、良马+4、军制改革+3000、云梯1.4/1.2、车轴+4、城壁强化+3000耐久、防御强化反击×2、神火计距离+2、木牛+3、政令整备50%。

人心掌握已与D6同步：不再是“约67% empirical”，而是 `Random(0..2)>=1` 的精确2/3免降。

完整36项数据写入 `docs/sources/techniques.json`；参考校验覆盖ID、分支、费用与主要常量。

## E8 关键结论

技巧规则不能只用 `vanilla|pk` 两个开关，至少要有：

```text
rulesetVersion
patchVersion
fixProfile
```

官方版本链确认：

```text
Vanilla Windows：
1.0 -> 1.1 -> 1.2 -> 1.3 -> 1.3.1 -> 1.3.2 -> 1.3.3

PK Windows：
1.1 -> 1.1.1
```

官方1.2说明只写“伤害平衡调整”等大类，没有逐技巧常量，因此不能伪造“所有技巧差异都在1.2修改”。

Vanilla Ver1.0与后期资料明确差异：

```text
枪兵锻炼：1.20 -> 1.10
精锐枪移动：+2 -> +6
精锐戟移动：+2 -> +6
精锐弩移动：+2 -> +6
云梯：+20% -> 后期约140%
工兵育成：400% -> 后期概括250%
防御强化：120% -> 200%
```

只有枪兵锻炼明确写Ver1.0=1.20，不能把戟/弩/骑Lv1也无证据地全部改成1.20。

E8还把 PK1.1 工兵育成原函数闭合：

```text
内政设施：0.30 / 0.15 => 相对 ×2
城市/港/关：有技巧跳过无技巧的×0.4衰减 => 相对 ×2.5
```

爆药炼成必须区分：

```text
pk-pc-reverse：
  保留原BUG——火伤加成错误地看被烧/防守方是否有爆药炼成

pk-pc-community-fixed：
  显式修复为看点火/攻击方
```

矢盾/大盾“可挡战法”同样属于社区修改，不是官方默认。

完整版本矩阵写入 `docs/sources/technique-version-deltas.json`。

## E9 关键结论

PC-PK1.1 主攻击函数已确认：

```text
005B03F5 target troop
005B03F7 attacker troop
005B03F9 call 005ADB20
```

因此兵粮袭击：

- 只对部队目标；
- 普通攻击与战法共用同一 helper；
- 反击支路明确跳过。

数量由长期攻略与现代实测交叉锁定为：

```text
raw = 部队攻击面板 × R，R∈[1,2]
raid = min(raw, floor(己方兵力/2))
```

攻击84、10000兵时约84～168；攻击105时最大210；200兵时无论攻击多高最多100。

但公开逆向只有 helper 入口和 techId 地址，没有 `005ADB20` 函数体，因此原RNG粒度/分布仍open。兼容fallback采用10～20整数档、0.1步长，并明确标 `compatibility-reconstruction`。

目标缺粮、攻方满粮、伤害被盾类置0、支援攻击、水上枪兵等边界继续open。连击两次抢粮只标 empirical-high。

## E10 关键结论

PC-PK1.1 已定位：

```text
00584DC8 = 应射 / 还射
techniqueId = 9
```

当前高置信规则已经从“远程攻击可反击”收窄为：

```text
防守方是应射弩兵
+ 来袭属于箭类攻击
+ 不是支援攻击
+ 防守方不处于混乱/伪报
+ 攻击源在防守方当前合法攻击范围/地形内
=> 自动反击
```

火矢、贯矢、乱射以及其他箭类战法都可进入应射语义；火矢通常无反击，但应射弩兵是明确例外。

应射不能无视射程：敌方强弩从3格射来，而防守方只有2格射程时不能打回去；森林等目标合法性同样会阻止。

支援攻击不触发应射。PCPK“急袭”可以50%规避应射伤害。PS2PK双方“应射+连战”可形成多次互射，但PC精确链序仍open。

完整 `00584DC8` caller 尚未公开，因此内部 attack-type 数值、水上 active profile 和 primary/collateral 逐路径继续保留 open。

## E11 关键结论

研究时间不是固定每级表，也不能把“能力和210 -> 30/40/60/90”全局化。

当前证据：

```text
超级难度相关能力和分档：
70 / 140 / 210 / 280
```

2021 Wiki 实测锚点：

```text
能力和210，无人才府：
Lv1 30
Lv2 40
Lv3 60
Lv4 90
```

但测试技巧系未注明，因此只标 anchor。

人才府是PC地址级精确规则：

```text
005D7ED7  -20日
005D7EF0 / 005D7EF4  最低1旬
=> max(10日, baseDays-20日)
```

另有：

```text
280 + 人才府，Lv4 = 60日
=> 反推同条件无人才府 Lv4 = 80日
```

攻略层“通常显示时间”分两组：

```text
枪/戟/弩/骑/练兵：30/40/60/90
发明/防卫/火攻/内政：40/50/70/100
```

攻略同时明确这些并非固定值。

完整PC研究时间函数、超级完整五档矩阵、初级/上级难度、属性getter层和跨平台差异继续open。

## E12 关键结论

技巧研究完成后的功绩不能再写成“500/1000/2000/3000已确认”。

当前资料：

```text
现行日文Wiki《功绩值》：
500 / 1000 / 2000 / 3000

同站《小ネタ》+ 2006中文攻略：
500 / 1000 / 1500 / 2500
```

所以 Lv1=500、Lv2=1000 为共同值；Lv3/Lv4存在真实冲突。

PC-PK1.1 逆向侧能确认人才府研究时间规则和：

```text
研究能力经验 = 消费技巧P / 100
```

也能定位“研究技巧”相关地址锚点 `005D8F68`，但公开资料没有展开“完成研究 -> 功绩”的 exact caller/常量。逆向研究目录里的“研究技巧”也未标记为已完成。

因此项目继续把 `[500,1000,2000,3000]` 作为兼容候选，但证据标签降为 `documented-current-wiki-candidate`，`meritExactness=unresolved`；旧 `[500,1000,1500,2500]` 同时保存在冲突数据中。

不能仅凭旧表恰好等于技巧P/2就发明“功绩=技巧P/2”公式，也不能无证据宣称“无印旧表、PK新表”。

## E13 关键结论

PC-PK1.1 的异常状态“自然恢复”已经由原函数 `00599B90` 闭合，不再是概率问题。

部队结构明确保存：

```text
+0x24 状态：0正常 / 1混乱 / 2伪报
+0x28 状态剩余计数
```

每旬结算顺序：

```text
先执行异常行为
→ 标记已行动
→ 普通位置计数 -1
→ PK合资格己方阵/砦/城塞范围内计数 -2
→ 最低0
→ 到0恢复正常
```

其中 `00599CAB` 明确把阵系范围内恢复步长改为2；`00599CD0` 调用 `00496350 SetTroopTurnCount` 写回计数；0时由 `00599CE4` 进入恢复正常处理。

因此旧“每旬按概率自然清醒”“智力高更容易每旬醒来”等 fallback 全部撤回。

少兵自动混乱路径还能精确恢复：

```text
0059A1F5 push 2
0059A1F7 GetRandomX
0059A1FF +1
=> 初始计数 1 或 2
```

但普通计略 `005917D0` 伪报、`00591A20` 扰乱的内部 duration 生成函数仍未公开展开，所以不能用少兵混乱反推普通计略分布。日文 Wiki 只稳定支持“数回合、会心至少2回合”。

工程 fallback 的“普通1/2=70/30、会心2/3=70/30”只来自开源复刻项目，已明确标为 `provisional-engine-rule`；后续恢复链全部走原代码级确定性倒计时。

## E14 关键结论

“单挑只看武力差”的旧模型正式撤回。

PC-PK 导向通用核心现已恢复为：

```text
伤病修正武力
→ 非线性 duelScore
→ 双方 score² 占比
→ actionRatio(1..99)
→ 方针系数
→ Hit / Dodge / Block
→ 普通/必杀伤害
→ 斗志增长
```

最关键反例：

```text
100 vs 95：
actionRatio = 55
攻击重视完整命中 = 13

80 vs 75：
actionRatio = 52
攻击重视完整命中 = 12
```

两组都是武力差5，但结果不同，正好解释日文 Wiki 当年为什么删除“武力差伤害表”。

同武力严格：

```text
actionRatio = 50

攻击重视 = 12
防御重视 = 7
斗志重视 = 10
```

与 Wiki 实测全部吻合。

SIRE 地址资料还直接给出：

```text
005097C3 / 005097EB
6B C0 64 99 F7 F9
```

解码为：

```asm
imul eax,eax,100
cdq
idiv ecx
```

即最终百分比比值步骤，与 C++ 逆向翻译中的 `score² ×100 / sum` 相互验证。

E14 同时闭合：

- 四方针 speed/hit/attack/block/attackSub/spiritGain 表；
- 普攻基础伤害；
- 命中阈值；
- 闪避公式；
- 格挡与防御重视格挡减伤；
- 攻击重视会心3～4连击且逐击独立判定；
- 通用必杀伤害；
- 气合×5/4；
- 坚守×3/4；
- 剑的斗志增长×3/2；
- HP、难度、方针对斗志增长的连续修正。

因此“单挑通用攻防/命中/斗志公式未知”已从 open 移除。

仍 open：

- 特定人物隐藏补正原硬编码；
- Vanilla EXE 逐指令等价性；
- PS2/Wii公式差异。

## E15 关键结论

舌战的“牌力”和“心理伤害”是两套独立系统。

牌力只决定本回合谁赢：

```text
非当前话题：
小1 / 中2 / 大3

当前话题：
小11 / 中12 / 大13

诡辩20
大喝110
无视120
镇静/激昂0
```

因此：

```text
当前话题小牌 power=11
>
非当前大牌 power=3
```

但心理伤害恰好可能反过来更低。

进入舌战时先按双方智力生成每方固定 attack：

```ts
attack =
  100
  + trunc(
      40*(myINT-opponentINT)
      /(131-myINT)
    )
```

普通话题牌心理伤害：

```ts
hpDamage =
  trunc(
    (attack + RandInt(5))
    * angerCoef
    * levelCoef
    * topicCoef
    / 1000
  )
```

普通状态：

```text
levelCoef：
小10 / 中15 / 大20

topicCoef：
当前话题10
非当前话题6

angerCoef=10
RandInt(5)=0..4
```

同智力 golden table：

```text
当前话题：
小100～104
中150～156
大200～208

非当前：
小60～62
中90～93
大120～124
```

这说明“赢多少 power”完全不进入 hpDamage。

话术边界也已拆清：

- 大喝：固定 level=15、topic=12，但仍读取出牌者 attack；同智力约180～187；
- 诡辩：用自己的 attack + 对方普通话题牌模板反弹，不存在固定诡辩伤害；
- 无视：hpDamage=0，只使对方怒气+30；
- 镇静：怒气减少 `max(对方怒气/2,30)`；
- 激昂：怒气+40；
- 平局：双方怒气各+15。

可出牌数也重新锁定：

```text
智力 <70：3
70～79：4
80～89：5
>=90：6
```

内部另固定保留一个“再考”槽。

因此“普通数字牌/话术精确心理伤害未知”已从 open 移除。

仍 open：

- 特定人物隐藏修正；
- Vanilla 连续常量的二进制等价性；
- PS2/Wii 差异；
- 追击/留情等结束结算的逐平台差异。

## E16 关键结论

旧“部队被普通攻击/普通战法击破后统一约15%负伤、2%～5%战死”的模型撤回。

PC-PK1.1 武将战场 casualty 是明确的 source-specific 分流：

```text
普通攻击/一般战法/设施攻击壊灭
  -> 无额外通用 casualty roll

弩/井阑/舰船火矢、贯射、乱射
  -> 005974C0 狙伤

猛者+成功位移
  -> 50%负伤

业火种/业火球
  -> 00597350 战死 + 独立负伤

骑兵突击/突进
  -> 005975E0 专用战死

单挑
  -> 单挑专用结算
```

弩系狙伤原函数恢复为：

```ts
P =
  tacticBase
  + statComparisonTier
  + personality
  + criticalBonus
  - 1
```

其中：

```text
火矢/贯射/乱射基础 = 0/1/2
统武比较档 = -2/-1/0/+1
小心/冷静/刚胆/莽撞 = 0/1/2/3
会心 = +1
```

理论最高6%。

`0059753A = 0F 95 C1` 实际是 `SETNE CL`，所以旧中文汇编注释里类似“setnc”的 mnemonic 是写错，不是游戏会心加成失效。

SIRE 原帖只确认四个 stat tier；现代复核给出的差值阈值 `<=0 / 1..6 / 7..12 / >12` 当前标 secondary-corroborated，等待 `00596480` 原函数体。

业火 casualty：

```ts
protection =
  max(统,武,智) <=70 ? 0 :
  <=80 ? 1 :
  <=90 ? 2 : 3

death =
  max(0, baseDeath + personality - protection)

injury =
  max(0, 2 + personality - protection)
```

普通/高战死 base=2/4；无战死只跳过 death，不关闭 injury。

本轮还修正一个重要边界：

```text
火矢不调用00597350
!=
火矢绝不会伤将
```

弩、井阑、舰船火矢仍可走 `005974C0` 狙伤。

剩余 exactness：

- `005971F0` 多候选 selector；
- `005963E0` 伤病等级；
- `00596480` 四档阈值原指令；
- 猛者 target/severity；
- Vanilla/PS2/Wii 等价性。

## E17 关键结论

PC-PK1.1 的栈道与毒泉随机兵损已经从地址参数 + 共用随机函数完全闭合：

```text
00472150 GetRandomX(X)
= 0..X-1
```

因此：

```text
栈道：
005AE5C6 base100
005AE5AF range200
=> 100..299 / 每进入一格

毒泉：
005AE5F8 base200
005AE5E2 range200
=> 200..399 / 每进入一格
```

免伤：

```text
踏破 -> 栈道0伤
难所行军 -> 栈道0伤
解毒 -> 毒泉0伤
```

所以旧：

```text
毒泉固定1000兵
毒泉气力-5
栈道300～500
```

全部撤回。

落石的专用参数也已由繁中PK1.1地址锁定：

```text
005B16D2 对部队base1500
005B16D7 对部队range500

005B171D 对建筑base800
005B1722 对建筑range1000
```

当前直接还原：

```text
部队1500..1999
建筑800..1799
```

踏破：

```text
005B17C0 / 005B17CF
落石伤害 ×0.1
```

即部队约150～199，而不是旧“减半”。

旧“落石固定30%混乱”也撤回：逆向参数区没有对应状态常量，而已知混乱来源都会有独立判定。

但 E17 对落石仍保留一个很小的 exactness：

```text
005B1632
全陷阱（含落石）共通基本伤害50
```

完整 trap finalizer 尚未文本化，所以不能确认该50是否在专用1500/800之外再次叠加，以及整数顺序。

因此：

```text
栈道 / 毒泉 = reverse-engineered exact ranges
落石 = reverse-engineered parameters + reconstructed finalizer
```

## E18 关键结论

君主继承不是一个统一的“后继者评分公式”。

必须先分三路：

```text
历史事件命中
→ 使用事件自己的固定后继/分裂脚本

玩家普通死亡
→ 玩家从合法候选中自行选择

COM普通死亡
→ 自动选择
```

刘备之死提供了最清晰的边界：

```text
事件条件满足
→ 刘禅 > 刘封

条件不满足而普通死亡
→ 玩家可自行选择后继
```

曹操之死也有独立固定候选顺序，所以历史事件不能拿来推导普通 selector。

COM 普通继承的长期实测高度一致：

```text
血缘
>
义兄弟
>
配偶
>
年长者
```

多个反直觉案例支持“年长者”而不是功绩/魅力/官职：

- 吕布后出现王忠；
- 董卓/牛辅系后，刚加入不久的韩遂可继位；
- 刘琦亲族候选死亡/被俘后，黄忠继位。

因此旧：

```text
血缘+10000
同族+5000
官职×10
功绩
魅力×20
统率×10
```

综合评分 fallback 全部撤回。

候选至少要求：

```text
存活
属于当前势力
不是敌方俘虏
```

被敌方俘虏的亲族会退出普通后继候选。

原程序集中入口也已定位：

```asm
push 0
push 0
push forcePtr
mov ecx, 755895C
call 4B9080
```

311MemoryResearch 的禅让 DEMO 直接复用该调用，并注明会出现“君主死亡”MSG。

但是：

```text
004B9080完整函数体
```

仍未公开，所以 COM 四层顺序的正确标签是：

```text
empirical-high
```

不是 disassembly-confirmed。

同关系类别内部如何排序、同龄 tie-break、出阵/任务候选过滤、零候选流程继续 open。

## E19 关键结论

“评定有哪些具体提案”已经可以从原版专用 MSG 段完整恢复。

```text
msg2966~3288
= 君主评定
```

具体案共22类：

```text
内政/人事/城市 9：
内政建设、征兵、生产兵装、巡查、训练、
探索、登用、任命军师、撤除设施

出阵/军事 3：
侵略、迎击、军事建设

外交・计略 10：
献上/亲善、同盟、破弃同盟、停战、劝降、
交换俘虏、求援、二虎竞食、驱虎吞狼、流言
```

旧 fallback 中的：

```text
技巧研究
输送
褒赏
```

没有出现在专用君主评定提案话术中，当前从 fidelity pool 删除。

评定结构：

```text
方针
→ 采决
→ 具体案
→ 采决
→ 执行
```

显示层方针是：

```text
内政 / 出阵 / 外交・计略
```

MSG 话术层又把出阵拆成攻击 / 迎击。

原版还明确支持：

- 赞同他人；
- 采纳一个；
- 采纳部分；
- 全部采纳；
- 全部否决；
- 中止评定。

官方手册确认评定本身：

```text
金钱0
行动力0
期间无
最多6人
君主必须在据点
```

同期技巧P资料记录评定+10P。

本轮关闭的是：

```text
proposal type pool
```

不是：

```text
proposal chooser
```

目前仍没有公开反汇编证明 StrategicTendency、地域执着、性格、五维等如何影响提案。参与武将过滤、proposal-specific gate、多案执行顺序和采纳案资源/AP调用链也继续 open。

## E20 关键结论

“委任 AI 有一张统一 action 权重表”这个问题前提撤回。

PC-PK1.1 已恢复的战争/野外 AI 是 procedural / modular：

```text
任务和合法性 hard gate
→ 城市/目标态势
→ difficulty
→ 君主野望
→ StrategicTendency
→ 出兵概率
→ 计划兵力
→ 兵粮 / 金 / 兵装
→ 主将局部评分
→ 创建部队
→ 005AD980 野外行动
```

玩家点击委任部队行动：

```text
005746A0
→ 00572890
→ 005AD980
```

正常 COM：

```text
005EC370
→ 005DEF90
→ 005DDCF0
→ 005AD980
```

因此至少野外 tactical core 是共用的。

出兵 `005EF440` 明确确认：

```text
最终出兵概率 clamp 5..100
计划兵力最低5000
治安存在80/90 gate
foodHorizon = travelTime*5+15
携粮上限50000
粮不足直接abort
```

普通非兵器部队携金：

```text
cityGold >=10000：
75%带1500..2000

2000<=cityGold<10000：
50%带1000
```

兵器编成：

```text
冲车90%
井阑/木兽/投石80%
```

主将选择 `005F6CF0` 是局部评分函数，会读取适性、势力科技、武力/统率、兵装攻防、兵种相克和契合特技。

AI势力强度基础：

```text
ceil(据点总兵力/10000)*10
```

随后还有君主ID硬编码：

```text
曹操/孙策/曹睿/曹丕/刘备 +2000
孙坚/孙权 +1900
诸葛亮/周瑜/曹彰/司马懿 +1800
...
```

所以“原AI是一套纯资源、可解释的统一utility optimizer”在结构上不成立。

E20 关闭的是统一权重表假设；仍 open：

- 城市内政完整 scheduler；
- 005EF440 少数未命名局部变量；
- 80/90治安 gate context；
- 完整运输 target/amount；
- 重视/普通/轻视/禁止内部阈值；
- 弱势君主特殊分支；
- Vanilla/主机版差异。

至此，当前 A1～E20 的55个逐点审计项全部完成写回。

## Post-E20 exactness cleanup

55个 A1～E20 主审计点已经完成；后续不继续制造 E21，而是逐项清理 `13-open-exactness.md` 的真实缺口。

### P0-1 普通登用概率

状态：**外层源码级收窄，内部连续函数仍open。**

新增确认：

```text
004AFD60
→ 004AF7D0 hard gate
→ 005C4F80 successRate
→ normal: 005BA4C0 deterministicValue < p
→ nonzero-mode: giri multiplier + 004721D0 runtime probability
```

普通人才命令第三参数为0，所以不套非0模式义理外层倍率。

`005BA4C0` 七个入参已明确，dateKey 为 `day*7+month*5+year*3`，异地登用保存发令日。

最新 SIRE“基准60登用意愿”公式已确认属于**新忠诚度 MOD 系统**，禁止当作原版 `005C4F80`。

仍缺：

- `004AF7D0` 函数体；
- `005C4F80`；
- `005BA410`；
- `005BA4C0` generator。

详见 [P0-1专项](36-hiring-probability-exactness.md)。

### P0-2 外交公式的版本边界

状态：**version-boundary-resolved / constants-still-open**。

官方补丁记录已经把 Vanilla 外交分成明确阶段：

```text
Vanilla 1.0
↓
1.1：
  友好增减平衡调整
↓
1.2：
  友好增减再次调整
  + 计略/外交成功率调整
↓
1.3～1.3.3：
  公开changelog未再列外交专项调整
```

因此“Vanilla一套公式”已明确错误。

PK 当年新增“超级”难度，而现有完整外交公式族包含：

```text
初级1.0
上级0.8
超级0.7
```

所以现有完整公式 corpus 正确绑定到：

```text
pk-era-formula-corpus
```

不能直接称作 Vanilla 1.0/1.1 原公式。

当前 profile：

```text
vanilla-pc-1.0
vanilla-pc-1.1
vanilla-pc-1.2-plus
pk-pc-formula-corpus
pk-pc-reverse-support
console-separate-open
```

Vanilla 临时复用 PK formula 必须标：

```text
compatibilityAssumption=true
```

官方 PK1.1/1.1.1 更新项没有公开外交专项变化，但这只能标“public changelog无显式变化”，不能证明 binary-identical。

PK 外交府继续只确认 AP×0.5 与亲善金×0.5，不加入外交成功率 bonus。

仍 open：

- Vanilla 1.0 exact constants；
- Vanilla 1.1 友好增减 exact constants；
- Vanilla 1.2 实际改动常量；
- 1.2～1.3.3 binary diff；
- PK formula corpus exact build；
- late Vanilla / PK 共享范围；
- 主机版；
- 历史公式族的原 EXE 入口。

详见 [P0-2专项](37-diplomacy-version-boundaries.md)。

下一 exactness gap：P0-3 攻城统一公式与据点接管资源。

### P0-3 攻城统一公式与据点接管资源

状态：

```text
siege-call-chain-resolved
capture-resource-formula-resolved
durability-inner-functions-still-open
```

确认：
- 城兵伤害共用 `005ADC30`；
- 普通耐久 `005ADDC0`、冲车/木兽 `005ADE20`；
- durabilityPower 5/15/战法字段；
- 目标倍率、会心、云梯、超级难度；
- `004B329B` 的资源保留率 `max(5,trunc(CHA/10))`；
- 金/粮/兵/12兵装统一按该比例保留。

仍缺 `005ADDC0/005ADE20` 内部函数体、小数取整与据点接管耐久细节。

详见 [P0-3专项](38-siege-capture-exactness.md)。

下一 exactness gap：P0-4 火焰持续与自然蔓延。

### P0-4 火焰持续与自然蔓延

状态：

```text
P0-4-audit-complete
critical-duration-transform-resolved
base-lifetime-rng-open
natural-adjacent-spread-disabled
```

本轮确认：

- 原作火计会心除即时火伤 modifier 外，燃烧持续时间按**基础结果 +1 回合**处理；
- 公开 311MemoryResearch / SIRE 能定位着火查询、火伤、火神、火罠等路径，但尚未定位 PC-PK1.1 点火寿命 setter；
- `00599CF0` 普通计数器处理排除为已知地面火寿命路径；
- `sango_infinity` 的普通 `[1,2] 70/30`、会心 `[2,3] 70/30` 只作为二级工程重建 fallback；
- 原版 fidelity 默认自然邻格蔓延为0；火种/火球/落雷范围与火罠连锁独立建模；
- 现代复刻的 `SpreadFire()` 是可配置扩展，不能反向证明原作存在自然扩散。

仍 open：

- 原版基础寿命 RNG；
- 内部 counter 与可见回合的 phase；
- 重复点火 setter；
- 不同点火来源差异；
- 跨版本/平台。

详见 [P0-4专项](39-fire-lifetime-spread-exactness.md)。

下一 exactness gap：P0-5 登场 / 自然死亡精确 RNG。

### P0-5 登场 / 自然死亡精确 RNG

状态：

```text
P0-5-audit-complete
monthly-lifecycle-dispatcher-resolved
debut-profile-semantics-resolved-high
lifespan-profile-semantics-resolved-high
death-inner-functions-open
```

本轮确认 / 收紧：

- `00590C30 MonthlyAction` 的月初链中，`00590C82 -> 005833D0` 明确负责年龄/死亡相关处理；
- 史实登场继续以人物 `YearOfDebut` / 剧本身份为主，不存在通用15岁自动登场；
- 假想登场是独立 profile：未发现/在野位置随机，登场年统一到成人年，当前成人年龄按15岁 empirical-high；
- `IgnoreAge` 是独立场景级 bypass，英雄集结类至少绕过普通时间登场和自然寿命；
- `Lifetime` 的 Historical / Longevity / Fictional 用户语义已分层；约+20年与约99岁只作 compatibility profile；
- 自然死 / 不自然死分支保持分离，孙策样本排除最终死亡+15 hard cap；
- `YearOfDeath / GetDeathYear / markedForDeath / HealthLevel / DEAD` 分层保持；
- 死亡未来值不得在开局永久预抽。

仍 open：

- `005833D0` / `0048A000` 函数体；
- raw enums；
- ScheduledLord / 普通登场 setter；
- Longgevity/死因修正顺序；
- Fictional 99岁 phase；
- death flag / illness / actual death 精确时序；
- 跨版本/平台。

详见 [P0-5专项](40-debut-death-exactness.md)。

下一 exactness gap：P0-6 褒赏 / 欠薪 / 流言等非自然忠诚变动。

### P0-6 褒赏 / 欠薪 / 流言等非自然忠诚变动

状态：

```text
P0-6-audit-complete
salary-payment-transaction-resolved
reward-gain-formula-open
salary-penalty-formula-open
rumor-effect-formula-open
blanket-rumor-model-rejected
```

本轮核心收敛：

- 金钱褒赏命令层100金/人、5AP/人等保持官方 confirmed；`005B5D60` 定位到扣AP/金钱执行链；
- 原作褒赏有 +5/+8/+9 实测，现代复刻“保底11”与原作冲突，隔离为非 fidelity；
- 月俸支付的外层事务由 `005909A3～005909BD` 源码级闭合：够钱整笔扣，不够钱完全跳过工资扣款并进入 `0058D5E0`；
- 欠薪月据点金钱保持“扣完俘虏维护后的余额”，不是剩余金钱先按比例发工资；
- 后段统一 `00590A27 -> 0058C190` 执行欠薪忠诚处理；具体受罚者和损失仍open；
- 流言 effect helper `005D05B0 / 005D05F0` 已定位但未展开；
- 百人都市+300次成功流言的实测否定“全城所有武将统一扣固定忠诚”，需要 target selector + per-target loss；
- 隐藏忠诚>100同时适用于褒赏与流言。

详见 [P0-6专项](41-nonnatural-loyalty-exactness.md)。

下一 exactness gap：P0-7 俘虏资金不足释放排序 / 主动释放后的禁仕与技巧点。

### P0-7 俘虏资金不足释放 / 主动释放

状态：

```text
P0-7-audit-complete
forced-release-count-exact
forced-release-selection-architecture-resolved
forced-release-priority-open
manual-release-tp-positive-official
manual-release-tp-value-open
release-forbidden-route-conflict
```

本轮确认 / 收紧：

- 资金不足释放人数完整闭式：`max(0, prisonerCount-floor(gold/50))`；
- `0058C320 -> 004AA200 -> 004A8E10` 证明原作先 comparator 处理候选，再裁剪到恰好 releaseCount；
- 每据点 `0058D1D0` 累计，全部据点后 `0058D430` 统一 finalizer；
- comparator 具体排序仍未恢复，因此不猜“先放弱将/强将/低忠/高忠”；
- 官方“追放”命令释放敌俘不耗金/AP/执行武将、最多6人，并明确增加技巧P；
- “释放+3技巧P”只保留 empirical compatibility candidate；
- `ForbiddenLord / ForbiddenMonths` 结构与月度计数确认；
- 主动释放的禁仕资料存在直接冲突，不能继续写成无条件“3个月 confirmed”；
- 自然逃亡 / 资金不足 / 主动追放 / 即时捕获释放 / 势力灭亡 / 外交换俘必须分 cause。

详见 [P0-7专项](42-captive-release-exactness.md)。

下一 exactness gap：P0-8 官职自动分配资格 / candidate selector / tie-break。

### P0-8 官职自动分配资格 / selector / tie-break

状态：

```text
P0-8-audit-complete
selector-scoring-exact
selector-final-tie-exact
office-classifier-role-corrected
candidate-list-generator-attribution-corrected
caller-list-order-open
qualification-helper-open
mode-caller-mapping-open
```

本轮重要纠错 / 收敛：

- `005FA650` 不是候选列表生成/排序，而是 `005FA650(office)->officeType`；
- candidate list 是 caller 作为 arg1 直接传给 `005FAF00`；
- arg3 是独立 scoring-mode flag；
- 两种 mode 的完整能力门、score、忠诚权重已逐指令整理；
- military 的 threshold=max(统,武)，但 weighted score=统+武+忠诚项；
- ordinary civil 用 max(智,政)，不是智+政；
- top-civil 门槛为统+智>=150；
- `loyaltyBonus=9*min(loyalty-90,10)`；
- affinity mode 文武相等时只允许武官侧；
- candidate 最终同分时 first-in-list wins，selector 自身 tie-break 已 exact；
- merit 不进入 final score，只属于前置资格体系。

仍 open：

- `005FA4D0` body；
- `005FAF00` caller/xref；
- caller list 顺序；
- arg3业务语义；
- 多官职 scheduler；
- 第81项与跨版本。

详见 [P0-8专项](43-auto-office-selector-exactness.md)。

下一 exactness gap：P0-9 部队编成最终资源事务。

### P0-9 部队编成最终资源事务

状态：

~~~text
P0-9-audit-complete
draft-function-boundaries-resolved
battle-resource-caps-exact
transport-basic-caps-exact
transport-equipment-100000-high
resource-mutation-primitives-resolved
commit-semantics-high
commit-opcode-order-open
return-semantics-high
return-finalizer-open
~~~

本轮确认 / 收紧：

- battle troop draft=sub_647250；battle资源draft=sub_647AC0；transport draft=sub_615790/sub_615A10；
- 战斗金10000/粮50000与 runtime cap 同源；
- 输送兵60000/金100000/粮500000；
- SIRE reverse-history 暴露 transport equipment 原100000硬上限，旧“兵装容量完全open”收窄；
- troop strength 65535 hard boundary；
- building/troop 两侧资源 mutation helper 已恢复；
- 枪戟弩马数量型、攻具和高级舰船件数型继续分层；
- commit 的 source→troop 资源守恒语义可固定，但 exact caller/order/rollback 未恢复；
- 回城资源入库、存活件装备可回收、容量溢出损失为高置信行为；
- 现代重制 finalizer 顺序明确隔离。

仍 open：

- battle/transport commit finalizer；
- piece扣1 caller；
- transport件数型特殊边界；
- return/disband finalizer；
- 伤兵/数量型兵装返还；
- overflow处理顺序；
- 跨版本。

详见 [P0-9专项](44-troop-resource-transaction-exactness.md)。

下一 exactness gap：P0-10 部队主副将关系合成 / FPU 取整边界。

### P0-10 部队主副将关系合成 / FPU 取整

状态：

~~~text
P0-10-audit-complete
ftol2-identity-resolved
positive-rounding-floor-exact
normal-quarter-pc-exact
love-half-pc-exact
spouse-sworn-full-share-pc-high
blood-third-cross-platform-high
relationship-helper-body-partial
~~~

本轮核心收敛：

- 原IDB在00707A74的内部label与Microsoft CRT `_ftol2`完全对应；
- 因此浮点→整数语义闭合为toward-zero truncation，正常正值即exact floor；
- E2/E3攻防建设、E5耗粮等已证明调用该helper的最终rounding gap可关闭；
- 普通副将 `00495B65 sar eax,2` = 正差值/4；
- 亲爱 `00495B79 sar eax,1` = 正差值/2；
- 夫妻/义兄弟full-share获得PC SIRE原版规则说明交叉，不再只靠PS2；
- 血缘/3仍缺PC opcode，继续诚实保留cross-platform-high；
- 两副将candidate取最大，不叠加；
- 嫌恶hard override和智政魅直接取高边界保持。

详见 [P0-10专项](45-deputy-rounding-exactness.md)。

下一 exactness gap：P0-11 训练资格 gate / 已训练 reset / 野外气力恢复 caller。

