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


## T40 / T45：明确合成城市与旅行共享旬钟

新增 [共享时钟外壳](inferred-shared-world-clock-v1.md)，复用已有城市piece-clock与旅行world，创世同年1/1并原子Tick，禁止单片段时间推进；完整genesis重放、预留生产完成历史槽、容量门。它真正绑定两者时钟但不共享travelers/城市武将身份或野外资源，不宣称全局/原生scheduler。

## T02 合成施计者事务追加（2026-10-30）

[费用与资格消费者](inferred-strategy-caster-transaction-v1.md)复用旧计略效果，固定场景施计者资格/气力，合法命中与失手均原子扣费并占用行动。伏兵10/内讧20沿已有规则，妖术30明确推断；无真人、原生资格或全局闭合声明。历史原文保留。

## T06 合成火源生命周期与驻留正值整Tick事务（2026-10-30）

[合成火源生命周期与驻留正值整Tick事务](inferred-fire-lifecycle-v1.md)：生成/移动/手动灭火与整Tick驻留正值损耗、寿命递减/熄灭已消费，复用旧寿命policy与300加抽样火伤；70/30仍fallback，先伤后减为具名推断。自然蔓延/火罠链/真实世界调度及归零终结仍排除。 历史原文保留，运行未验收。

## T20 自动补给实际消费及合成容量双边转运（2026-10-30）

[自动补给实际消费及合成容量双边转运](inferred-capacity-transfer-v1.md)：保留PR141自动补给；新增同owner合成transport与depot之间15坐标整单守恒转移、容量检查、正兵约束和重放。12槽容量为显式可替换推断输入，不伪称原生getter；不删除实体、不入城finalizer、不复刻溢出丢弃。 历史原文保留，运行未验收。

## T04 合成安全伪报撤退与旧持续恢复核适配（2026-10-30）

[合成安全伪报撤退与旧持续恢复核适配](inferred-false-report-retreat-v1.md)：固定无火安全合成图按稳定BFS一步撤退并占行动，再复用旧持续减计数/恢复；到达只保留单位，不入城/解散/归属。路径排序及每旬一步是具名推断，原生持续分布与真实撤退finalizer仍未闭合，旧unsupported安全门不改。 历史原文保留，运行未验收。

## T12 正值单目标与多目标落石原子事务（2026-10-30）

[正值单目标与多目标落石原子事务](inferred-multi-rockfall-v1.md)：复用旧单目标落石与正值损耗，新增唯一升序目标集合和逐目标抽样，全部目标成功才统一提交outerjournal；归零/非法/容量失败整批拒绝。顺序抽样分配为具名推断，强制位移/击破/人物伤亡/奖励及原生caller等价未闭合。 历史原文保留，运行未验收。

## T28 合成宝物授予没收自然忠诚与装备派生统一会话（2026-10-30）

[合成宝物授予没收自然忠诚与装备派生统一会话](inferred-treasure-unified-session-v2.md)：保留固定快照适配，新增唯一outer genesis+journal交错授予/没收/自然旬推进，AP持有忠诚日期RNG连续推导，复用旧单笔事务和季度自然核；装备按当前持有派生，不写基础属性。五维bonus为显式推断而非value换算。零忠诚/真人归属/战役全局仍排除；非旧存档静默升级。 历史原文保留，运行未验收。

## 既有服务状态纠正（2026-10-30）

保留历史原文与早期remaining，当前事实见[现态索引](current-gap-status-v1.md)。T03已有流言费用与标量效果，T27已有官职plan/apply，T29已有金粮/AP商人交易，T33已有季节事件消费者；T33健康支路仅静态记录，本次不调用或扩权。代码/docs blob证据列于当前JSON。缺原生helper不等于工程消费者不存在。

## T02 四策略含火计与驻留火场共用单一合成单位状态（2026-10-30）

[四策略含火计与驻留火场共用单一合成单位状态](inferred-unified-field-v1.md)：FireCast资格/智力/气力10/行动从唯一roster读取，命中实际生成火、miss同样扣费；原三策略复用同兵力/气力/acted/混乱。FieldTick原子推进驻留火伤、寿命及行动混乱恢复，原始抽样由outerhistory保留；临时旧消费者仅投影，不保存双份兵力。固定战术格与部署，不含移动/真人/零终结/原生全资格。 历史原文保留，运行未验收。

## T40 合成城市旅行战场固定部署与统一原子世界旬（2026-10-30）

[合成城市旅行战场固定部署与统一原子世界旬](inferred-unified-safe-world-v1.md)：复用可加载中性剧本，新增同ID固定city-officer与field-actor智力绑定，部署者禁止所有城市动作/生产参与并每步反核；field是其唯一兵力气力行动状态。初始城市兵与场上兵显式分配，WorldTick原子同旬推进城市/旅行/火场四策略，禁止子域私自加时。旅行者不冒充人物迁移，无动态部署返城/真人/全战役原生声明；仍受旧12旬窗口。 历史原文保留，运行未验收。

## T26 月薪与自然忠诚接入城市唯一余额及WorldTick（2026-10-30）

[月薪与自然忠诚接入城市唯一余额及WorldTick](inferred-unified-resource-world-v1.md)：新synthetic资源timeline完整重演普通城务与工资/宝物/转运桥，保留生产jobs预约历史；城市current.ledger唯一金粮AP兵装备。WorldTick月薪一次后自然忠诚，所有域成功才提交；不足全不支付及减忠诚为具名政策，归零整笔拒绝。旧默认schema/load不变，固定部署，无真人或Closing/P078。 历史原文保留，运行未验收。

## 统一资源与动态合成部署（2026-10-30）

[动态统一世界](inferred-dynamic-resource-world-v2.md)在同一完整genesis/journal协调城市资源、工资/自然、宝物、转运与field角色。部署/返城不再是永久“未提供”边界，但不涉及真实人物迁移、零值终结或原生战役声明。气力按既有兵数加权语义处理，不新增守恒能量池；所有推断与限制逐项见规则。

## T37 推断小图typed Move接唯一actor位置、行动与共享旬时钟（2026-10-30）

[推断小图typed Move接唯一actor位置、行动与共享旬时钟](inferred-mobile-field-v3.md)：复用实际supplied移动核；200x200练习图可抽取<=16格矩形接统一Move，非全图/跨片联动。原生地图/高度/城市定位仍待证；设施攻陷/入城终结排除，运行未验收。 历史原文保留，运行未验收。

## T23 Train接唯一城市资源与TP/WAR成长记录，真实复用既有Train（2026-10-30）

[统一Train与当前属性](inferred-unified-training-progress-v1.md)：旧v3无配置兼容；显式progressConfig启用，基础WAR参与Train；宝物加成尚未用于Train/field公式，技术horizon仍有限，运行未验收。 历史确认与证据原文保留。

## T28 唯一当前宝物持有+成长后属性生成即时五维只读派生（2026-10-30）

[统一Train与当前属性](inferred-unified-training-progress-v1.md)：不另建AP/忠诚/属性余额；有效加成尚未进入Train/field公式，不伪造base通过旧校验；运行未验收。 历史确认与证据原文保留。

## T14 单锻冶StartForge接真实共享锁、WorldTick完成与生产设施视图（2026-10-30）

[规则](inferred-unified-forge-food-v1.md)：固定一个未完成forge槽；不新增双建设或任意设施/吸收。保留生产历史与实际完成奖励；运行未验收。 历史确认与证据原文保留。

## T20 城市/运输账户转运与逐旬中性耗粮接唯一资源owner（2026-10-30）

[规则](inferred-unified-forge-food-v1.md)：food0允许且缺粮仅报告不损兵；field粮owner/供给尚未接。火与覆盖效果未建模，非观测无火；运行未验收。 历史确认与证据原文保留。

## T17 真实财政与丰收中性叶接同一WorldTick金粮owner（2026-10-30）

[规则](inferred-unified-income-owner-v1.md)：30槽现有forge/stable引用当前设施，原主题economicFacilities为明确推断初值；不冒名barracks/workshop、不新增建设模式、不重复工资，运行未验收。 历史确认与证据原文保留。

## T33 安全财政/丰收叶已接统一日期与资源，健康季节支路仍排除（2026-10-30）

[规则](inferred-unified-income-owner-v1.md)：不调用whole season或whole finance；瘟疫health/事件人物/归属不执行。蝗灾/其他安全叶尚需明确接入，不将本批视为全季节完成；运行未验收。 历史确认与证据原文保留。

## T21 技巧研究Start/完成已接唯一TP与当前属性，保留其他原有支路（2026-10-30）

[规则](inferred-unified-technique-owner-v1.md)：研究timing实际读取live宝物五维；技巧被解锁不等全部被动效果执行。袭粮/其他field资源支路仍待统一，原生阈值与功绩版本证据仍待核；运行未验收。 历史确认与证据原文保留。

## T28 当前宝物五维已被研究timing真实消费，持有与成长同owner（2026-10-30）

[规则](inferred-unified-technique-owner-v1.md)：Train/field其他公式尚未全部消费有效加成，不能伪造base或夹值。与现Grant/Confiscate/自然忠诚保持单一持有关系；运行未验收。 历史确认与证据原文保留。

## T40 统一世界新增有界21旬研究profile与跨作业共享锁（2026-10-30）

[规则](inferred-unified-technique-owner-v1.md)：旧12旬默认保留；21为单最长研究+培养预留，不等从空走完整前置树。PK/旅行角色等后续尚待接入，32/64历史与正值约束仍有效；运行未验收。 历史确认与证据原文保留。

## T45 合成旅客绑定同actor唯一角色、真实出发到站行动锁与返家闭环（2026-10-30）

[规则](inferred-unified-bound-travel-v1.md)：私有同timeline旅行单次推进，不改变真实归属/兵数/新增费用；away仅按实际有向路线返home，完整往返槽预留。原生地图/旅行时间证据仍待核；运行未验收。 历史确认与证据原文保留。

## T40 统一21旬世界新增合成actor旅行角色锁，保留跨作业资源唯一owner（2026-10-30）

[规则](inferred-unified-bound-travel-v1.md)：PK/正值普通战斗/field粮等待接项仍独立列出；有限剧情与32/64日志不等完整无限战役。P078/Closing及真实人物终结仍排除；运行未验收。 历史确认与证据原文保留。

## T34 显式PK研究培养接统一费用、时钟、预约与真实完成（2026-10-30）

[规则](inferred-unified-pk-owner-v1.md)：21旬有限合成局；新局talent/XP映射为具名兼容推断，非原生全树及全特技效果 历史确认与证据原文保留。

## T35 PK属性培养共享XP且当前属性实际供城务研究与field智力使用（2026-10-30）

[规则](inferred-unified-pk-owner-v1.md)：普通无年龄getter；旧job工期保持真实startSnapshot，原版人物/年龄健康不接 历史确认与证据原文保留。

## T36 PK适性特技实际完成并保留唯一元数据（2026-10-30）

[规则](inferred-unified-pk-owner-v1.md)：未知原生被动映射仍未实现；不继承旧numeric skillIds，不改变真实归属 历史确认与证据原文保留。

## T15 PK成长使用同一XP/行动/预约且每WorldTick一次（2026-10-30）

[规则](inferred-unified-pk-owner-v1.md)：不增第二AP或独立人物账本；零值与Closing仍排除 历史确认与证据原文保留。

## T40 统一world实际路由PK与每outer一步currentfacts同步（2026-10-30）

[规则](inferred-unified-pk-owner-v1.md)：旧默认不变；静态未运行，密集记录仍受完整历史容量限制 历史确认与证据原文保留。

## T27 具名官职分配接统一office、工资与真实Deploy统率容量（2026-10-30）

[规则](inferred-unified-office-owner-v1.md)：仅合成fill-vacancies；君主真实角色排除，无官容量显式推断，不实现任免归属/所有被动 历史确认与证据原文保留。

## T26 官职变化原子更新同一salary并由后续月薪消费（2026-10-30）

[规则](inferred-unified-office-owner-v1.md)：不立即重发工资/重置日期；缺资原逻辑和正值门保留 历史确认与证据原文保留。

## T40 统一world实际路由AssignOffices与Deploy容量校验（2026-10-30）

[规则](inferred-unified-office-owner-v1.md)：旧默认不变，无第二工资账本；静态未运行，title固定场景事实 历史确认与证据原文保留。

## T01 显式敌我初值预算与同roster普通正值Attack真实接world（2026-10-30）

[规则](unified-field-composition-v3.md)：中性已核技能域；actual techniques不清空；拒终结，无敌AI或同城人物冒充敌 历史确认与证据原文保留。

## T04 真实FalseReport caller与唯一condition/逐Tick退却接入（2026-10-30）

[规则](unified-field-composition-v3.md)：完整stage tape、失败费用行动；退却入场plain支持域前置，非真实入城finalizer 历史确认与证据原文保留。

## T05 野战唯一粮分配随部署返城与逐Tick消费（2026-10-30）

[规则](unified-field-composition-v3.md)：粮0仅报告不写兵损；不冒称原生饥饿伤亡 历史确认与证据原文保留。

## T06 同路径火入格与驻留/状态恢复组合（2026-10-30）

[规则](unified-field-composition-v3.md)：火入格per-visit为具名中性推断；混合地形火路径明确拒，非原生caller证明 历史确认与证据原文保留。

## T09 实际普通攻击及正值反击同一原子事务（2026-10-30）

[规则](unified-field-composition-v3.md)：不运行Closing、奖励、零兵终结；未映射被动显式拒 历史确认与证据原文保留。

## T12 固定单次Rockfall全footprint目标与抽样接同roster（2026-10-30）

[规则](unified-field-composition-v3.md)：环境触发为明确场景配置，非武将法术/任意灾害生成 历史确认与证据原文保留。

## T20 野战配粮返粮与food-only相邻ManualSupply同库存（2026-10-30）

[规则](unified-field-composition-v3.md)：敌粮为独立显式创世预算；transport固定位置推断，不含兵金装备补给 历史确认与证据原文保留。

## T21 真实正伤枪兵技巧请求由同次粮owner原子消费（2026-10-30）

[规则](unified-field-composition-v3.md)：actual tech damage保留，0伤无请求为具名保守推断；无独立偷粮命令/重复事件消费 历史确认与证据原文保留。

## T32 普通Attack真实反击与同状态火后恢复（2026-10-30）

[规则](unified-field-composition-v3.md)：仅正值战斗；耐久实体维修未作为兵气替代 历史确认与证据原文保留。

## T37 Move实际路径预算与当前占位/地形火入格组合（2026-10-30）

[规则](unified-field-composition-v3.md)：有限图及支持域，不冒充全原生地图/入城结算 历史确认与证据原文保留。

## T40 F/H/G同唯一field owner与WorldTick组合（2026-10-30）

[规则](unified-field-composition-v3.md)：旧默认保留；所有下游失败含粮兵行动原子拒，静态未运行 历史确认与证据原文保留。

## T33 安全locust/harvest叶实际接同WorldTick与唯一income（2026-10-30）

[规则](unified-safe-season-owner-v3.md)：只安全子集，模拟率/RNG具名非原生；whole season/plague/health全部排除 历史确认与证据原文保留。

## T17 当月蝗粮TP/农场tombstone后由既有income唯一结算丰收（2026-10-30）

[规则](unified-safe-season-owner-v3.md)：同30slot当前设施无第二账本；无重建玩法/第二次收入，完整失败回滚 历史确认与证据原文保留。

## T40 统一季节两phase与当前PK居民技能/同粮TP owner（2026-10-30）

[规则](unified-safe-season-owner-v3.md)：父内容链完整审与远端一致性为发布前提；静态不等运行验收 历史确认与证据原文保留。

## T03 固定独立敌城scalar Rumor实际消费home费用行动与目标治安忠诚RNG（2026-10-30）

[规则](unified-fixed-enemy-city-rumor-v3.md)：绑定显式敌owner但非field敌人同实体；成功失败均真实扣费，零忠诚归属终结拒 历史确认与证据原文保留。

## T40 统一world路由AttemptRumor且无第二home账本/额外Tick（2026-10-30）

[规则](unified-fixed-enemy-city-rumor-v3.md)：完整outer重放/同actor角色锁及容量；源概率为明确模拟，非原生全局流言 历史确认与证据原文保留。

## T23 真实技巧16后的Train可达120并贯通同城/转运/部署返城/field（2026-10-30）

[规则](unified-researched-morale120-v3.md)：显式profile由唯一研究成果派生cap；学习不发气力，旧100默认不变 历史确认与证据原文保留。

## T34 研究16完成只扩真实准入上限且下游共享实际tech（2026-10-30）

[规则](unified-researched-morale120-v3.md)：不清空技巧绕过原核，不扩255/未证被动；full history保留 历史确认与证据原文保留。

## T20 同owner城transport加权转运支持真实已研究120域（2026-10-30）

[规则](unified-researched-morale120-v3.md)：不造独立120账本，reserved库存和实际容量照旧 历史确认与证据原文保留。

## T40 唯一morale/field energy完整120消费者链（2026-10-30）

[规则](unified-researched-morale120-v3.md)：原公式费用行动与加权回城不重置，旧default保持；静态未运行 历史确认与证据原文保留。

## T28 当前装备effective实际供城务/forge/研究/官职/Train/field智魅/火粮（2026-10-30）

[规则](unified-live-equipment-effective-v3.md)：永久PK才华XP与临时有效视图分离且允许收回后下降；固定物理panels/未知被动不伪造重算 历史确认与证据原文保留。

## T23 Train真实calculateTraining消费effective WAR且资格奖励原proposal一次写回（2026-10-30）

[规则](unified-live-equipment-effective-v3.md)：不伪造warBase/XP过校验；实际技巧16已120贯通；21旬有限非全战役 历史确认与证据原文保留。

## T15 永久成长与装备派生双视图由同root历史维护（2026-10-30）

[规则](unified-live-equipment-effective-v3.md)：0..255智力扩域及高政治非负火粮为具名推断，非原生caller证实 历史确认与证据原文保留。

## T02 当前effective智魅接实际/既有推断策略核且完整上下游扩域（2026-10-30）

[规则](unified-live-equipment-effective-v3.md)：旧100默认与原样本费用保留；高防御负fraction按原clip，不冒称全原生单调公式 历史确认与证据原文保留。

## T40 统一owner每命令同步装备读视图且不改历史job参数（2026-10-30）

[规则](unified-live-equipment-effective-v3.md)：完整action/资源/物品/有效视图同事务；旧默认保留，运行未验/原生资料仍待证 历史确认与证据原文保留。

## T32 普通Attack真实反击与同状态火后恢复；固定同home港关正值耐久修复已接唯一WorldTick（本地未发布）（2026-10-30）

[规则](unified-repair-starvation-owner-v3.md)：仅正值战斗；耐久实体维修未作为兵气替代；治理者只读basePK政治；固定site不建造迁移，耐久零/攻陷终结排除；静态待整批独审，非原生证据闭合 历史确认与证据原文保留。

## T05 野战唯一粮分配随部署返城与逐Tick消费；完整零粮边界认证接火后正值76%饥饿及单次恢复（本地未发布）（2026-10-30）

[规则](unified-repair-starvation-owner-v3.md)：旧无starvationConfig模式粮0仅报告不写兵损；显式启用完整零粮边界profile才按具名推断火后保留76%且要求正兵数；任意正粮入账清证，新Deploy首Tick不资格，归零整Tick拒绝，不接死亡伤病；非原生证据闭合，运行未验收 历史确认与证据原文保留。
