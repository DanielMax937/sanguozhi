# 三国志11：证据主题推断采用清单 v1

日期：2026-10-28。基线 `81e5012419d7421d1759dcc6b226f616cd904b0f`。

用户授权证据不足时采用合理推断。**推断方案闭合不等于原生证据缺口消失，也不等于全游戏完成。** 本文保留原版/PC-PK优先；无确切版本证据时不声称Vanilla、PK或主机同值。所有新行为必须具名、可替换、不污染原始来源。

## 计数纠正与使用办法

历史反复报告“43主题/45快照”；当前《缺少的数据》核心三节实际45条。为可追溯，按当前正文顺序建立T01–T45，不删任何项：本次45条全部纳入；旧43的历史计数映射未能可靠还原，不把前43条擅自等同历史43。俘虏释放和无部队旅行分别为当前T44/T45，也不漏记。没有历史证据证明45只是43的去重结果，不能编造归并关系。链接以基线正文为源，现代参考代码不是原版机制证据。

下面“采用”是工程决定；“入口”是现有静态读到的实现或新候选，不表示已运行。“未执行/受限”不伪装成完成，保持P078及依赖、Closing奖励/受伤/世界写入排除。

## 当前交付层次

45项均有明确处理决定，**并非45项都完整实现**：21项主要沿已有policy，14项追加具名推断或纯请求，6项只读资料/抽象替代，4项主要受限排除。每项仍以第三列子边界为准；分类不是native证据通过数。源函数身份、完整原地图、原剧本和原事件结果仍未知，不能计成已核实。零值捕获、人物归属、Closing等不因标注推断而解禁。

新增推断细则：[研究时间](inferred-technique-time-v1.md)、[饥饿/隐藏研究/开发分片/旅行](inferred-rule-requests-v1.md)、[计略/火石/太守/袭击](inferred-combat-requests-v1.md)、[地图/场景/叙事蓝图](inferred-blueprints-v1.md)、[欠薪请求](inferred-salary-request-v1.md)、[AP/补给/宝物/堤坝规划](inferred-independent-planning-v1.md)。每页均有具体公式/数据、理由、实际入口、限制及替换条件。

## 每项决定、理由及边界

### 后续有限落地：隐藏研究抽签接新局初始化

T36 新增 [推断隐藏研究新局加载](inferred-pk-research-loader-v1.md)：既有LCG抽签结果进入旧createPkAbilityLifecycle实际新state，具体选择随原保存持久化；seed审计单独保留。旧显式选择默认/旧存档不改，不写世界RNG、不自动执行研究费用或奖励，不改变原始证据等级。

### 后续有限落地：原创推断地图与中性开局加载

T37/T40 新增 [练习地图/加载器](inferred-practice-map-v1.md)：原创确定性200×200 odd-q练习格，直接喂既有移动消费者；中性开局函数实际初始化既有单城指令state并验证地图输入。不停留在模板，但不冒充原地理/原剧本，原资料null和已有默认均不改。两个服务的资源与时钟仍独立，不描述成全局游戏已融合。

### 后续有限落地：自动补给接已有资源账本

T20 新增 [自动补给消费者](inferred-automatic-supply-v1.md)：优先计划的缺口改由当前经重放验证的账户库存/容量推导，实际执行既有 ManualSupply；全部成功才返回更新账本，完整旧保存/重放不变。食粮期限与邻接仍由调用方供应，非原生AI、全局GameState或单位finalizer；不接人物/奖励/伤亡/Closing/P078。此前纯规划函数继续只规划，消费者另具名，不重写旧实现边界。

### 后续有限落地：中性城际旅行世界

T37/T40/T45 新增 [旅行世界 v1](inferred-travel-world-v1.md)：源42城战略邻接与既有10日/边推断进入新合成场景的实际位置/路线/旬时钟及保存重建。不是原武将或原任务writer，不接已有GameState、资源、奖励、伤病、Closing及P078。下表保留此前原主题处理分类；后续这一个有限消费者不把原地图、原剧本或原旅行证据标为已恢复，亦不把45项均视作实现完成。机器账本相应三项追加implementationFollowup，不改originalText和旧分类。

| ID / 处理类别 / 原主题 | 具体采用及理由（未有原证者均为推断） | 实现/剩余界限 |
|---|---|---|
| T01 [采用现有policy] 部队攻击伤害 | 采用已存PC-PK经验式；binary64计算、末尾floor；反击完整反向核后战法再floor一半，普攻倍率1。保留来源而不再造统一本式。 | [field-combat-lifecycle.ts](../../packages/engine/src/field-combat-lifecycle.ts)；建筑/水战/致命后果未覆盖，源取整与版本仍未知。 |
| T02 [追加policy/纯请求] 计略命中 | 伪报/扰乱/落雷沿既有经验公式；火计/伏兵/内讧/妖术采用独立新设计70/60/40/30+floor(智差/2)，5..95；免疫优先，倾国不影响妖术。 | [field-combat-lifecycle.ts](../../packages/engine/src/field-combat-lifecycle.ts)/rules.ts；[inferred-combat-requests.ts](../../packages/engine/src/inferred-combat-requests.ts)新增4类具名线性命中率；已撤回旧模拟数值仅标新设计，不恢复原证据等级。 |
| T03 [采用现有policy] 流言 | 采用现有rumor-scalar具名有限政策，不把计略府10→12解释成固定+20个百分点；只标量治安/忠诚，不产生捕获或归属变化。 | [rumor-scalar-lifecycle.ts](../../packages/engine/src/rumor-scalar-lifecycle.ts)；原helper/最终比较未证。 |
| T04 [采用现有policy] 伪报时长 | 1/2旬=70/30，会心+1，同态max(旧,新)，不同异常替换拒绝；旬界减1，符合恢复设施减2。理由是沿用可重放fallback而非新造随机。 | [terrain-hazard-lifecycle.ts](../../packages/engine/src/terrain-hazard-lifecycle.ts)；自动撤退及人物/世界关联排除。 |
| T05 [追加policy/纯请求] 粮尽减员 | 既有耗粮精确请求/库存短缺维持；新增legacy每旬保留76%的独立推断损失请求，不能称该数原生或保守下界。 | [food-supply-lifecycle.ts](../../packages/engine/src/food-supply-lifecycle.ts)仍report-only；[inferred-rule-requests.ts](../../packages/engine/src/inferred-rule-requests.ts)已提供算术请求，不接死亡。 |
| T06 [追加policy/纯请求] 地表火 | 现有空格火1/2旬=70/30，会心+1；重燃max，无自然扩散；脚本火2旬。沿用已有policy，版本分开。 | [terrain-hazard-lifecycle.ts](../../packages/engine/src/terrain-hazard-lifecycle.ts)；[inferred-combat-requests.ts](../../packages/engine/src/inferred-combat-requests.ts)另提供普通无修正驻留300..500请求，不执行驻留/扣兵。 |
| T07 [受限排除] 城耐久与零值结算 | 正值伤害可沿已有兵器/攻城核；归零城兵/耐久导致的捕获、归属、奖励不推断执行。 | [rules.ts](../../packages/engine/src/rules.ts)及攻城证据；受限结算继续排除。 |
| T08 [采用现有policy] 单挑 | 采用已固定现代转录的duelScore/actionRatio及伤害/斗志，不对人物隐藏补正额外加猜测bonus。 | [ordinary-duel.ts](../../packages/engine/src/ordinary-duel.ts)；参考身份保留，Closing/伤亡世界结算不接。 |
| T09 [采用现有policy] 支援关系 | 夫妻/义兄弟50%，亲爱/辅佐30%，血缘20%；仅现有主将关系范围，不将未知远亲自动等同血缘。 | [rules.ts](../../packages/engine/src/rules.ts)/unit-formation.ts；跨版本与完整血缘caller未证。 |
| T10 [采用现有policy] 舌战 | 固定现代转录通用牌/性格流程；未明确的人物隐藏加成取0，不伪造原生人物能力；保留每个profile支持域。 | [debate-regenerated-round.ts](../../packages/engine/src/debate-regenerated-round.ts)等；Closing/追击留情世界后果不启用。 |
| T11 [受限排除] 伤亡/俘虏 | 采用专用来源分流，不恢复“普通击破再额外通用受伤/战死roll”。 | 原来源核保留；人物伤病/俘虏writer及P078依赖受限。 |
| T12 [追加policy/纯请求] 地形伤害 | 栈道100+0..199、毒泉200+0..199，已有免伤条件；每格顺序，致命整笔拒绝。落石共通50不在缺证据时重复加一次。 | [terrain-hazard-lifecycle.ts](../../packages/engine/src/terrain-hazard-lifecycle.ts)；[inferred-combat-requests.ts](../../packages/engine/src/inferred-combat-requests.ts)提供部队1500+0..499/建筑800+0..999请求，踏破floor(/10)，不另加未知共通50；多目标/终端未接。 |
| T13 [采用现有policy] 巡查 | 既有floor(统率AL和/28)+2、非零helper半减、治安>100裁剪的核，不改负增量支持域；完整服务使用既有供应属性映射。 | [patrol-security-gain.ts](../../packages/engine/src/patrol-security-gain.ts)/city-command-lifecycle.ts；stock/getter原体未知。 |
| T14 [采用现有policy] 建设速度 | 采用公开整数核max(最高政治+floor(和/2),floor((D-floor(D/4))/9))，不以现代经验替换已恢复顺序。 | [domestic-construction-rate.ts](../../packages/engine/src/domestic-construction-rate.ts)/facility-construction-lifecycle.ts；原writer身份仍未知。 |
| T15 [采用现有policy] AP恢复 | 采用已记录四参数恢复式及PK符节台；各独立服务的无恢复/固定20等选择仍显式，不叠加两个时钟。 | [calculations.ts](../../packages/engine/src/calculations.ts)及各服务policy；原全局调度未模拟。 |
| T16 [追加policy/纯请求] 指令AP | 保留各服务费用（研究50等）；新增19键有限AP请求表，已知四府门严格分开，部署/输送基数20、没收10及人工类别20明确推断，未知字符串拒绝。 | [独立规划](inferred-independent-planning-v1.md#t16-有限城市命令ap映射)；只成本请求不启用原命令，不能声称全指令AP全集已证。 |
| T17 [采用现有policy] 金粮收入 | 采用各原核已有整数顺序与max(security,50)/100；财政收入、工资、特产顺序沿已交付具名政策。 | [city-finance-lifecycle.ts](../../packages/engine/src/city-finance-lifecycle.ts)及收入投影；原版本认证仍未知。 |
| T18 [采用现有policy] 征兵/生产量 | 复用ST0逐调用/explicit binary32核，不把请求量等同实际入库；现有城市服务负担/容量/费用事务不重造。 | [recruitment-quantity.ts](../../packages/engine/src/recruitment-quantity.ts)/production-quantity.ts/city-command-lifecycle.ts；getter/原writer未知。 |
| T19 [采用现有policy] 生产价格 | 原价uint16、特产EAX低AL非零才八折；不把EAX256等价true。 | [production-price.ts](../../packages/engine/src/production-price.ts)及城市服务；原价格表ID身份仍未知。 |
| T20 [追加policy/纯请求] 补给/运输 | 手动accepted=min请求、源库存、目标余量，余货留源；匹配兵装同步；合并气力默认floor。新增供粮期限/ID顺序的独立自动规划，三资源逐目标共享源余额且匹配兵装受限。 | [food-supply-lifecycle.ts](../../packages/engine/src/food-supply-lifecycle.ts)及[独立规划](inferred-independent-planning-v1.md#t20-自动补给的纯优先级规划)；调用方核资格，输出仅草案，每步需新消费者验证，finalizer受限。 |
| T21 [追加policy/纯请求] 技巧系统/时间 | 沿36项目录；新增按70点档每档减1旬推断，210档两系基准3/4/6/9与4/5/7/10，人才府−2最低1；难度无附加倍率。 | [technique-research-lifecycle.ts](../../packages/engine/src/technique-research-lifecycle.ts)新opt-in；详inferred-technique-time-v1.md，非原矩阵恢复；兵粮袭击另有十分位倍率+守恒转移请求，应射沿已有至多一次主反应非递归政策，原caller链仍未证。 |
| T22 [采用现有policy] 技巧版本 | 默认仅采用现有PC-PK兼容值，Vanilla/主机没有差异证据时标unknown，不将社区修复当官方补丁。 | 各catalog原version限制不改；无证据不能补二进制地址或官方身份。 |
| T23 [采用现有policy] 训练 | 现有训练核/奖励；reset先后按现有独立profile，任务可再次置acted。不把两份MOD关联IDB当stock。 | [calculations.ts](../../packages/engine/src/calculations.ts)/engine.ts及training-runtime-policy；全局scheduler未知。 |
| T24 [受限排除] 技巧P额外奖惩 | 已知上限10000保留；受伤/灾害/释放/攻城奖励各保留来源归属，不凭总奖数拆成虚构子奖。 | 已有独立policy覆盖部分；Closing、释放、占领world写入排除。 |
| T25 [采用现有policy] 功绩 | 训练/征兵每名50、到达200、野补100沿已核；研究采用当前Wiki500/1000/2000/3000候选、每参与人全额，保留旧冲突表可选。 | [technique-research-lifecycle.ts](../../packages/engine/src/technique-research-lifecycle.ts)及各既有核；同盟/空城奖不新增受限结算。 |
| T26 [追加policy/纯请求] 欠薪 | 薪俸按月先算；资金不足的旧有限财务推进仍拒绝；已知设施总工资足额整笔扣/不足整笔不扣；v1部分支付撤回。v2按该设施门返回个人支付0或全额，唯一推断为欠薪且个人应领>0时减忠诚请求5。 | [city-finance-lifecycle.ts](../../packages/engine/src/city-finance-lifecycle.ts)；inferred-salary-request.ts仅规划；实际工资/忠诚后果未接；支付门已证，具体欠薪名单及减量仍未证。 |
| T27 [采用现有policy] 官职 | 80有名职+爵位目录，单职selector同分先到者；候选按显式名单而非暗加人名优先。 | [office-assignment.ts](../../packages/engine/src/office-assignment.ts)；原资格/第81项/真实人员职务与统兵联动未知。 |
| T28 [追加policy/纯请求] 忠诚 | 现金沿synthetic每100金、5AP、均匀5..9；新增普通宝物授予gain=value经验候选，真忠诚byte255截顶不截100，10AP/0金。 | [personnel-loyalty-lifecycle.ts](../../packages/engine/src/personnel-loyalty-lifecycle.ts)及[独立规划](inferred-independent-planning-v1.md#t28-宝物价值忠诚请求)；原getter/RNG未闭；宝物转授/没收损失和人物归属变更不执行。 |
| T29 [采用现有policy] 商人 | 沿显式有理price输入、整数买卖、供应政治字段及固定有限费用，不从UI相场猜原raw价尺度。 | [city-merchant-lifecycle.ts](../../packages/engine/src/city-merchant-lifecycle.ts)；原三helper和商人/价格生成未知。 |
| T30 [采用现有policy] 探索/外交 | 人才→宝物→金既有顺序，候选稳定ID序；探索AP20/府10，发现不等于登用。普通外交采用既有经验率与具名退款/期限政策。 | [city-search-lifecycle.ts](../../packages/engine/src/city-search-lifecycle.ts)/ordinary-diplomacy.ts；危险捕获失败拒绝，原筛选/写序未知。 |
| T31 [采用现有policy] 登用 | 采用现有九门顺序与有理fallback率；FNV七u32模100作可重放决策，标合成RNG。 | [ordinary-recruitment-policy.ts](../../packages/engine/src/ordinary-recruitment-policy.ts)；仅决策，不写效忠/人员归属。 |
| T32 [追加policy/纯请求] 属性系数/治安 | 征兵魅力、季初治安沿已知；太守反击/港关修复/初忠诚80为具名推断。新增堤坝已知listing纯请求type0x18且state0时floor(uint16最大耐久/10)，不套政治系数。 | [inferred-combat-requests.ts](../../packages/engine/src/inferred-combat-requests.ts)与[独立规划](inferred-independent-planning-v1.md#t32-堤坝耐久恢复请求已有listing不另猜政治系数)；堤坝实际writer/完工/归属写入继续排除。 |
| T33 [追加policy/纯请求] 灾害/异族 | 单城已有月率疫8/1000、蝗13/1000、丰21/1000，祈愿42/1000且不叠；延迟下月，明确仿真常数。 | [city-season-lifecycle.ts](../../packages/engine/src/city-season-lifecycle.ts)；新根城威胁纯请求保留治安>=80安全门，低于80贼兵(100-security)/1000、异族1%，1支3000；不创建根城/部队、不模拟已存根城刷新；兵种/位置需具体场景，伤病新写入不扩。 |
| T34 [采用现有policy] PK特技培育 | 同技能拒绝、不同技能覆盖而不叠加；适性仅C→B、B→A，S不开放；1类别1任务、3旬。 | [pk-ability-lifecycle.ts](../../packages/engine/src/pk-ability-lifecycle.ts)/pk-skill-training.ts；原98表/完整native技能writer未证。 |
| T35 [采用现有policy] PK五维培育 | 沿S1普通无年龄域、共用XP顶3000；目标低70中80高95，按现有核处理，不假定训练XP立即提升所有服务属性。 | [pk-stat-training.ts](../../packages/engine/src/pk-stat-training.ts)/pk-ability-lifecycle.ts；年龄/原生ID与跨服务成长未证。 |
| T36 [追加policy/纯请求] PK研究树 | 保留48节点/52基础箭头/4起点及10槽各5候选；当前显式选5槽各1个，不伪称原隐藏RNG。 | [ability-research.ts](../../packages/engine/src/ability-research.ts)/pk-ability-lifecycle.ts；[inferred-rule-requests.ts](../../packages/engine/src/inferred-rule-requests.ts)新增显式LCG32选五槽/各一候选，为新建场景供应hiddenSelections；不改旧explicit-five-fixed默认。 |
| T37 [只读推断/资料] 40000格地图 | 决定采用供应地图作为工程抽象：明确坐标/地形/边由场景提供；城际邻接图仅用于城际问题，不生成假原作六角世界。 | [supplied-map-movement.ts](../../packages/engine/src/supplied-map-movement.ts)；原地图数据仍缺，此决定不等于40000格原地图交付。 |
| T38 [追加policy/纯请求] 三城开发分片 | 可推断北海12、建業18、會稽15各一抽象片；前两城依“聚集”描述，會稽为最简工程选择、低置信。片内邻接不由同片推出。 | [inferred-rule-requests.ts](../../packages/engine/src/inferred-rule-requests.ts)现返回明确抽象componentSizes，原cities.json的null不覆盖。 |
| T39 [只读推断/资料] 港关 | 采用已核45条名称/所属城；使用资料ID，不猜原作数值ID或剧情初始所有权。 | static-subordinate-bases来源资料；动态归属/剧情需独立输入。 |
| T40 [只读推断/资料] 剧本 | 不伪造“原作开局”；已有手工场景作为明确synthetic练习场景，原作剧本缺表时不可加载为native。 | data/scenarios已有有限示例；[inferred-blueprints.ts](../../packages/engine/src/inferred-blueprints.ts)有42城中性资料+可给createCityCommandState的单城合成初值；非历史，完整原作剧本仍未知。 |
| T41 [只读推断/资料] 通用事件 | 采用已转录33观测/31资料ID；空标题不生造事件。未明条件返回unknown，不把unknown视true；不执行结果。 | [source-event-query.ts](../../packages/engine/src/source-event-query.ts)；[inferred-blueprints.ts](../../packages/engine/src/inferred-blueprints.ts)另提供真实来源ID绑定的固定日历叙事提示计划；非原游戏条件/flag/概率恢复。 |
| T42 [只读推断/资料] PS2事件 | 单独64观测与24限制保留，不覆盖PC；缺述不从史实常识补成原游戏触发式。 | [source-event-query.ts](../../packages/engine/src/source-event-query.ts)；另有独立来源叙事提示计划；不世界执行。 |
| T43 [只读推断/资料] 历史事件 | 105观测/66资料ID/41来源差异分版本保留；冲突不合并“多数票原机制”。采用可读条件子式查询，整体缺失unknown。 | [source-event-query.ts](../../packages/engine/src/source-event-query.ts)；另有叙事计划；原事件执行/原flag仍缺且world执行排除。 |
| T44 [受限排除] 俘虏释放 | 不补虚构排序/禁仕月数/TP后执行释放。 | P078及相关人员事务继续排除，原证据未知。 |
| T45 [追加policy/纯请求] 无部队旅行 | 城图BFS最少边、同长稳定排序、每边10日；同城0日，均为工程推断。 | [inferred-rule-requests.ts](../../packages/engine/src/inferred-rule-requests.ts)只返回route/天数，非原距离、合法资格、人物位置或任务writer。 |

## 替换规则（逐项共同适用）

每项实现引用该主题的既有规则/来源记录；获得可归属版本原始函数/调用链，或有版本、输入、观测过程的独立样本时，先与此推断逐字段比较。反例出现即将受影响推断标为不适用，新增policy版本；保留旧文献、旧policy和旧存档，不能原位悄改。只有工程规则选择完成的项才能标“推断合同已定”；只有实际代码覆盖且静态审阅后才标“静态实现已交付”。以上未实施、资料缺失和受限项不得算已清零。

## 原文快照与来源索引

当前45条逐字原文及每行原链接另存[机器可读决策账本](../../data/inferred/evidence-topic-decisions-v1.json)，固定原始main81e501；历史文字不改写，不把本行新决定倒填为当年的事实。每条的原文解释“仍缺”属于证据维度，本页补充工程决定而不是删历史证据。

仅静态审阅，未运行测试、typecheck、编译、build或候选；运行正确性未验证。资料/纯请求/独立服务互不自动成为一个完整游戏，不宣称任务全部清空或自动暂停进度提醒。






## T05 / T06 / T12：显式正值伤害账本消费者

新增 [正值驻留火/落石账本](inferred-positive-hazard-ledger-v1.md)，将既有饥饿/驻留火/落石推断请求消费为独立合成目标的实际正值余额变更；完整命令重放、revision和重复ID验证。零值、致死、毁坏全部原子拒绝。不迁移旧hazard状态，不改变empty-only旧默认；没有全局回合调度、原生验证、人物/归属/奖励/Closing结果。具体出现资格由调用方显式确认，不假装已实现世界资格判定。


## T26：合成薪资与正值忠诚消费者

新增 [独立账本](inferred-salary-ledger-v1.md)，由固定合成名单求设施工资总额，足额整笔扣一次、不足全不付；减忠诚5沿用v2明确推断，任何归零整期拒绝。完整journal重放与期号去重。旧city-finance欠薪拒绝保持，非真实人事/全局世界结算；不恢复错误部分支付v1。


## T28：合成库存授予原子事务

新增 [合成宝物账本](inferred-treasure-ledger-v1.md)：府库物品唯一转交、目标真忠诚按旧请求增益、AP10一次扣费同时提交，重复领取/无AP/非府库物品拒绝；完整保存重放。非真实人物归属或全局集成，没收与装备效果未实现，旧默认不变。


## T21 / T32：正值资源请求消费者

新增 [合成资源账本](inferred-positive-resource-ledger-v1.md)：兵粮袭击实际等额粮食转移、已建成港关正值耐久修复，源粮归零拒绝，不做堤坝完工/归属/全局调度。完整保存重放；旧公式推断身份与旧默认不变。


## T38：可加载的三城推断开发区

新增 [三城练习开发区](inferred-development-layout-v1.md)，真实总地块数配原创3列轴坐标布局，接既有设施建设state和odd-q移动map并提供明确对应。原生developmentPatches:null不改；不宣称原图、共享时钟或后续设施地图自动同步；不扩大双建设模式。


## T02：限定空格火计效果消费者

新增 [命中到旧空格点火](inferred-empty-cell-fire-v1.md)：成功实际进入旧hazard igniteCell，失手不变；不接完整施计尝试/AP/人物资格，伏兵内讧妖术效果不擅自写成混乱。只说明已连接的效果层，非全计略/全局调度完成。


## T28：合成没收延续事务

新增 [没收延续账本](inferred-confiscation-ledger-v1.md)，保留已验证授予初始历史，独立记录物品回库、推断扣value忠诚、AP10原子事务；归零拒绝，不将对称惩罚冒充原生，不改真实人事或旧保存。


## T32：追加限定消费者

[inferred-counterattack-ledger-v1](inferred-counterattack-ledger-v1.md)：正值合成反击延续账本：旧太守倍率请求实际扣正值兵力，保留原始损耗journal，归零拒绝，不重复扣基数，不触战斗终结。


## T18：追加限定消费者

[inferred-recruitment-exercise-v1](inferred-recruitment-exercise-v1.md)：实读旧Recruit已有完整独立事务，纠正历史“执行未实现”的过时工程状态但保留历史原文；新增合成练习实际复用旧数量/金AP/库存/治安/气力及普通命令回执，不重复造核。


## T02：追加限定消费者

[inferred-strategy-effects-v1](inferred-strategy-effects-v1.md)：明确推断伏兵单目标300、内讧双目标各150、妖术至多3目标一回合混乱；正值拒零、miss记命令、行动门与恢复、完整重放。非原作数值/真实人物/全局费用。


## T38：追加限定消费者

[inferred-development-markers-v1](inferred-development-markers-v1.md)：只读marker投影：建设保存全重放并绑定固定三城layout genesis，核地图输入，按当前设施生成新视图；不执行命令、不写回、无自动时钟/碰撞融合。


## 正值片段原子分派

新增 [安全组合账本](inferred-safe-composite-ledger-v1.md)：损耗与粮食/港关资源子命令全部验证后一起提交，保存全重放、双层revision与批ID；任何拒零/资格失败整批失败。没有自动身份配对、回合资格或全局时钟，不接受限finalizer。


## 当前总状态与历史剩余项的区别（2026-10-30）

[当前45主题索引](current-gap-status-v1.md) 汇总所有后续消费者。早期followup中的remaining是当批历史，不覆盖之后新增的合成实现；同样，后续合成实现不会证明原生算法或全局调度。历史originalText及全部逐批字段保留，不改写旧共识。
