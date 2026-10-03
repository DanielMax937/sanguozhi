# 三国志11规则总索引

> 目标：建立可直接驱动规则引擎的《三国志11》规则规范，并严格区分无印（Vanilla）与威力加强版（PK）。
> 更新日期：2026-10-01。

## 最新审计入口

[当前审计总表](17-post-15-source-audit.md) · [状态](STATUS.md) · [P0-2外交版本边界](37-diplomacy-version-boundaries.md)。

A1–E2原审计全文和旧STATUS分别完整保存在 `audit-history/`，原blob复用，无历史段落丢失。历史快照不是当前进度指针。

相同平台/版本的面板规则，E3的明确分项运算优先于旧总规则或旧对照表中的宽泛缩写。E2的人物合成继续由 `04-military.md` 管理，E3静态参数在 `../sources/unit-panels.json`。参考校验命令：`python scripts/check_unit_panels.py`；该脚本不是原游戏EXE测试。

E4训练与气力以 `19-training-morale.md` 为当前专项规范；参考校验命令为 `python scripts/check_training_morale.py`。该脚本只验证解出的整数表达式与测试向量，不代替原游戏EXE回归。

E5兵粮消耗以 `20-food-consumption.md` 为当前专项规范；参考校验命令为 `python scripts/check_food_consumption.py`。粮尽逃兵仍保持实测层，不因基础耗粮公式已恢复而自动升级。

E6补给与输送以 `21-supply-transport.md` 为当前专项规范；参考校验命令为 `python scripts/check_supply_transport.py`。脚本只验证已确认的容量约束与气力加权样例，不代替尚未恢复的PC finalizer。

E7技巧系统以 `22-techniques.md` 为基础规范，结构化表为 `../sources/techniques.json`。E8版本差异以 `23-technique-patch-differences.md` 和 `../sources/technique-version-deltas.json` 覆盖；实现时必须区分 `rulesetVersion + patchVersion + fixProfile`，社区修复不得静默覆盖 fidelity。校验命令分别为 `python scripts/check_techniques.py` 与 `python scripts/check_technique_patch_profiles.py`。

E9兵粮袭击见 `24-food-raid.md`；E10应射以 `25-response-fire.md` 为当前专项规范，结构化证据为 `../sources/response-fire.json`，兼容判定校验命令为 `python scripts/check_response_fire.py`。

E11技巧研究时间以 `26-technique-research-time.md` 为当前专项规范，结构化证据为 `../sources/technique-research-time.json`；只保存已知阈值/锚点与人才府精确修正，不填满未知矩阵。

E12技巧研究完成功绩以 `27-technique-research-merit.md` 为当前专项规范，结构化冲突证据为 `../sources/technique-research-merit.json`。现行500/1000/2000/3000仅是当前Wiki候选，早期500/1000/1500/2500同时保留；Lv3/Lv4的PC-PK1.1 exact值不得冒充已确认。

E13混乱/伪报持续与恢复以 `28-status-duration-recovery.md` 为当前专项规范，结构化证据为 `../sources/status-duration-recovery.json`。PC-PK1.1自然恢复已确认是确定性倒计时：普通每旬-1、合资格阵系范围-2、到0恢复；普通计略初始duration和重复施放刷新语义仍保持open。

E14单挑连续公式以 `29-duel-continuous-formulas.md` 为当前专项规范，结构化证据为 `../sources/duel-continuous-core.json`。PC-PK导向通用核心已闭合武力→actionRatio→Hit/Dodge/Block→伤害→斗志链；人物隐藏补正与Vanilla/主机版差异继续open。

E15舌战普通牌心理伤害以 `30-debate-psychological-damage.md` 为当前专项规范，结构化证据为 `../sources/debate-psychological-damage.json`。牌力只决定胜负，心理伤害另走智力attack×牌等级×话题系数×愤激系数；大喝、诡辩、无视/镇静/激昂边界已拆开。

E16非骑战法来源的负伤/战死以 `31-non-cavalry-casualty-sources.md` 为当前专项规范，结构化证据为 `../sources/non-cavalry-casualty-sources.json`。普通击破统一伤亡roll已撤回；弩系狙伤、猛者、业火、骑兵与单挑按来源分流。

E17地形伤害随机值以 `32-terrain-hazard-damage.md` 为当前专项规范，结构化证据为 `../sources/terrain-hazard-damage.json`。栈道100～299/格与毒泉200～399/格已源码级闭合；落石专用参数与踏破×0.1已恢复，但common50 finalizer仍open。

E18普通君主继承以 `33-ruler-succession-priority.md` 为当前专项规范，结构化证据为 `../sources/ruler-succession-priority.json`。历史事件、玩家普通死亡、COM自动继承三路已分离；COM血缘>义兄弟>配偶>年长者为empirical-high，组内tie与004B9080函数体仍open。

E19评定完整提案池以 `34-council-proposal-pool.md` 为当前专项规范，结构化证据为 `../sources/council-proposal-pool.json`。原版评定MSG恢复22类具体案和两阶段多选采决；chooser、参与者过滤与采纳案执行链仍open。

E20委任AI权重/决策架构以 `35-delegated-ai-architecture.md` 为当前专项规范，结构化证据为 `../sources/delegated-ai-architecture.json`。统一utility表假设已撤回；战争AI恢复为hard gate+概率+局部selector的procedural架构，城市内政scheduler仍open。

P0-1普通登用概率exactness以 `36-hiring-probability-exactness.md` 为专项记录，结构化证据为 `../sources/hiring-probability-exactness.json`。004AFD60外层与normal/nonzero模式已源码级收窄；005C4F80本体仍open，现代SIRE登用意愿公式已隔离为MOD-only。

P0-2外交公式版本边界以 `37-diplomacy-version-boundaries.md` 为专项记录，结构化证据为 `../sources/diplomacy-version-boundaries.json`。Vanilla 1.1友好度与1.2外交成功率补丁边界已官方锁定；现有完整公式绑定PK-era corpus，Vanilla复用必须标compatibility assumption。

P0-3攻城统一公式与据点接管资源以 `38-siege-capture-exactness.md` 为专项记录，结构化证据为 `../sources/siege-capture-exactness.json`。城兵共用005ADC30、耐久外层链与004B329B资源最低5%保留已收窄；005ADDC0/005ADE20内部函数体仍open。

P0-4火焰持续/自然蔓延以 `39-fire-lifetime-spread-exactness.md` 为专项记录；会心持续+1与自然邻格蔓延关闭已固定，基础寿命RNG仍open。

P0-5登场/自然死亡以 `40-debut-death-exactness.md` 为专项记录，结构化证据为 `../sources/debut-death-exactness.json`；月初`005833D0`入口、史实/假想登场与寿命模式语义已收紧，内部死亡函数仍open。

P0-6非自然忠诚变动以 `41-nonnatural-loyalty-exactness.md` 为专项记录，结构化证据为 `../sources/nonnatural-loyalty-exactness.json`；PC-PK月俸整笔支付/整笔不支付事务已闭合，褒赏增量与流言目标/掉忠函数仍open。

P0-7俘虏释放以 `42-captive-release-exactness.md` 为专项记录，结构化证据为 `../sources/captive-release-exactness.json`；资金不足释放人数与 comparator/list/finalizer 架构已闭合，`0058C320` 排序语义、主动释放技巧P exact 与各 release path 的禁仕 side effect 仍open。

P0-8自动官职 selector 以 `43-auto-office-selector-exactness.md` 为专项记录，结构化证据为 `../sources/auto-office-selector-exactness.json`；`005FAF00` 单官职评分和同分 first-wins 已闭合，并纠正 `005FA650` 为 office classifier；caller 列表顺序和多官职 scheduler 仍open。

P0-9部队资源事务以 `44-troop-resource-transaction-exactness.md` 为专项记录，结构化证据为 `../sources/troop-resource-transaction-exactness.json`；战斗/输送容量与draft函数边界、transport普通兵装100000上限及resource primitives已收紧，原commit/return finalizer仍open。

P0-10主副将关系/FPU取整以 `45-deputy-rounding-exactness.md` 为专项记录，结构化证据为 `../sources/deputy-rounding-exactness.json`；`00707A74` 已识别为MSVC `_ftol2`，正值最终floor闭合；普通/亲爱PC指令精确，血缘/3仍保留PC opcode gap。

P0-11训练/气力以 `46-training-morale-exactness.md` 为专项记录，结构化证据为 `../sources/training-morale-exactness.json`；训练gate边界、每回合一次cadence及`0059A230`野外恢复local handler已收紧，reset/top scheduler xref仍open。

P0-12阵系耗粮/粮尽以 `47-food-overlap-starvation-exactness.md` 为专项记录，结构化证据为 `../sources/food-overlap-starvation-exactness.json`；阵/砦/城塞单一selector、float32常量与不叠乘已闭合，overlap winner与starvation原函数仍open；旧0.76降为legacy-only。

P0-13补给/输送finalizer以 `48-supply-transport-finalizer-exactness.md` 为专项记录，结构化证据为 `../sources/supply-transport-finalizer-exactness.json`；`004BF522` 已归入 `sub_4BF1F0`，到达满仓overflow丢弃行为与野外补给target-cap语义已收紧，troop气力非整除rounding和field-supply finalizer仍open。

## 版本标记

- `[COMMON]`：无印与 PK 共通。
- `[VANILLA]`：仅无印，或无印数值/行为与 PK 不同。
- `[PK]`：仅威力加强版新增或改变。
- 平台（PC / PS2 / Wii）有差异时单独标注。
- 少数 PC 规则还存在补丁差异（例如 Ver1.0 与后续版本），需额外记录 `patchVersion`。

## 证据等级

- **已证实**：游戏数据、官方/准官方资料，或多个可靠来源互证。
- **实测可信**：长期玩家实测/攻略 Wiki 结果稳定，但未取得内部公式。
- **临时采用**：原作机制存在，但精确内部公式未知；为引擎闭环采用确定性规则，必须和原作事实分开。
- **缺静态数据**：规则明确，但尚缺完整地图、剧本等数据文件。
- **参考模型已验证**：数据/参考算法通过测试，不等于已对原游戏EXE或存档完成验证。

## 模块

1. `00-turn-scenario.md` 时间、回合、难度、势力行动顺序、剧本
2. `01-map.md` 六角地图、地形、移动、港关、水战、ZOC
3. `02-economy.md` 收入、内政设施、商人、行动力、灾害
4. `03-personnel.md` 武将生命周期、关系、忠诚、登用、俘虏、官职
5. `04-military.md` 征兵、兵装、编成、训练、补给、技巧
6. `05-combat.md` 攻防、战法、伤害、攻城、火、异常、伤亡
7. `06-strategy.md` 战场计略、城市计略
8. `07-diplomacy.md` 亲善、同盟、停战、交换俘虏、劝降
9. `08-ruler-corps.md` 汉帝、爵位、继承、军团、灭亡、统一
10. `09-events.md` 通用事件、历史事件、遗迹与庙
11. `10-duel.md` 单挑
12. `11-debate.md` 舌战
13. `12-pk.md` PK 专属系统总表
14. `13-open-exactness.md` 尚缺精确内部公式与引擎临时采用值
15. `14-evidence-audit-2026-09-29.md` 证据审计与升级记录
16. `15-pk-ability-research.md` PK 能力研究完整机制、隐藏特技与培育上限
17. `16-unresolved-rules-fallbacks.md` 15项未决规则逐项核对与引擎 fallback
18. `17-post-15-source-audit.md` 后续逐点审计当前总表与历史记录入口
19. `18-unit-panels.md` E3兵种基础参数、面板公式、修改器隔离和测试边界
20. `19-training-morale.md` E4训练闭式、气力上限、军乐/奏乐/诗想与气力特技
21. `20-food-consumption.md` E5旬级兵粮消耗、阵系减粮、着火烧粮与粮尽边界
22. `21-supply-transport.md` E6补给/输送路径、补兵约束、气力混合与平台差异
23. `22-techniques.md` E7 36技巧ID、研究成本、效果分层与证据等级
24. `23-technique-patch-differences.md` E8 Vanilla/PK补丁链、技巧版本差异、原BUG与社区修复profile
25. `24-food-raid.md` E9兵粮袭击触发路径、数量模型与RNG边界
26. `25-response-fire.md` E10应射箭类触发、射程/地形/支援边界与平台差异
27. `26-technique-research-time.md` E11技巧研究时间分档、人才府修正与证据矩阵
28. `27-technique-research-merit.md` E12技巧研究完成功绩冲突表、版本边界与PC exact缺口
29. `28-status-duration-recovery.md` E13混乱/伪报状态计数、每旬恢复、阵系加速与初始duration边界
30. `29-duel-continuous-formulas.md` E14单挑actionRatio、命中/闪避/格挡、伤害与斗志连续公式
31. `30-debate-psychological-damage.md` E15舌战牌力、心理伤害、怒气与话术反弹连续公式
32. `31-non-cavalry-casualty-sources.md` E16弩系狙伤、猛者、业火与普通击破武将伤亡来源分流
33. `32-terrain-hazard-damage.md` E17栈道、毒泉、落石随机伤害与免伤边界
34. `33-ruler-succession-priority.md` E18历史/玩家/COM君主继承路径与自动后继类别优先
35. `34-council-proposal-pool.md` E19君主评定22类具体提案、两阶段采决与chooser边界
36. `35-delegated-ai-architecture.md` E20委任/COM AI procedural架构、出兵gate/概率与局部主将评分
37. `36-hiring-probability-exactness.md` P0-1普通登用原版外层判定链与005C4F80未决边界
38. `37-diplomacy-version-boundaries.md` P0-2 Vanilla补丁外交边界、PK公式corpus与版本profile
39. `38-siege-capture-exactness.md` P0-3攻城耐久调用链、城兵共用核心与陷落资源保留公式
40. `39-fire-lifetime-spread-exactness.md` P0-4火焰寿命会心+1、基础RNG边界与自然邻格蔓延隔离
41. `40-debut-death-exactness.md` P0-5月初生命周期入口、登场/寿命profile与死亡内部函数边界
42. `41-nonnatural-loyalty-exactness.md` P0-6褒赏、月俸欠薪与流言忠诚效果边界
43. `42-captive-release-exactness.md` P0-7资金不足俘虏释放人数/选择管线、主动释放技巧P与禁仕路径冲突
44. `43-auto-office-selector-exactness.md` P0-8自动封官单官职评分、first-wins同分与caller列表边界
45. `44-troop-resource-transaction-exactness.md` P0-9出征/输送draft容量、资源守恒、100000兵装上限与finalizer边界
46. `45-deputy-rounding-exactness.md` P0-10主副将关系除数、_ftol2取整与剩余PC opcode边界
47. `46-training-morale-exactness.md` P0-11训练gate/reset cadence与0059A230野外气力恢复
48. `47-food-overlap-starvation-exactness.md` P0-12阵系耗粮bit-exact、重叠不叠乘与粮尽逃兵证据降级
49. `48-supply-transport-finalizer-exactness.md` P0-13野外补给、输送抵达函数范围、overflow与气力加权边界

## 来源优先级

1. 游戏数据 / 官方攻略资料
2. 可明确区分原指令与修改指令的逆向记录
3. 游民星空《三国志11》专题资料
4. 日文《三國志11攻略wiki》
5. 仓库已有 `docs/sources/*.md`
6. 单一玩家经验帖仅作候选

## 版本核心差异（先记住）

- **无印已经有 8 系技巧**：枪、戟、弩、骑、练兵、发明、防御、火攻。
- **PK 新增第 9 系：内政系技巧**（木牛流马、港关扩张、政令整备、人心掌握）。
- **PK 新增能力研究**。
- **PK 新增吸收合并**（同类设施 Lv1→Lv2→Lv3）。
- **PK 新增 10 类内政设施**：大市场、鱼市场、黑市、军屯农、练兵所、符节台、军事府、人才府、外交府、计略府。

## 冲突处理

1. 先分版本，不允许 PK 规则覆盖无印。
2. 同版本内：游戏数据/官方 > 已区分原版与修改的逆向 > 可复现实测 > 单篇攻略。
3. 找不到精确公式时保留“原作未知”，另写“引擎临时采用值”。
4. 找到更可靠证据时只替换临时采用项；不得把修改器的新增公式冒充原作。
