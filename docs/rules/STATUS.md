# 规则审计当前状态

更新：2026-10-04 UTC。

## 最新完成：P0-60通知门与active-list/acted/零退款return尾

[正文](95-mission-notification-tail.md) · [结构化证据](../sources/mission-notification-tail.json)。基线main `4140af9c71fba30c1a883dcf142ab494025f6472`（PR #17已合）。

独立API闭合canonical005B81D0与handler23/24→005B8400(actor,0)已知写序：rawlegion派生force、player0..7、legion number1；saved current/target/raw force+44；mission/reset→actedbit→dirty→observer→live list-valid/尾追加→duration。重复列表不去重，同地reset不删active节点；callback可改变valid/status/home/list。S2 wrapper query267是result+全frame/RNG观察，异地直acted不走hook；presentation/nonnull observer/fullreturn均明确可变观察或整次reject。旧API/trace不动；版本化return/role/event与后置observer组合仍next。

123范围/10,811 raw bytes，双IDB指纹与独立raw-ID1核对，61共同对比4差异及1个S2-only hook。33模型测试含512独立oracle/JSON replay通过。完整回归90条命令零失败：TypeScript、85 Node、87 Python checker与2 demos。独立审阅通过：14文件freeze/hash一致，双IDB完整指纹与123范围/10,811bytes另行stdlib mmap raw-ID1重核；33模型/18source及完整90回归独立重跑全过，额外32组query→observer→live status/saved-home链式反例与5组presentation错绑原子拒绝通过，无待修阻断。发布前仅补本结论；合并后main仍须全测。S1/S2均MOD关联；clean stock/Vanilla/force灭亡/空军团/真实存档/全局RNG仍open。

## 历史完成：P0-59 event8/14任务监听与显式可变tail观察

[正文](94-mission-event-listeners.md) · [结构化证据](../sources/mission-event-listeners.json)。基线main `de7f0218eefe528687b82c9659feeee1de77b8a3`（PR #16已合）。

新独立API恢复004A8110→005B9D30：44slot注册、copied-active节点序/重复、live executing/mission、仅mission23/event8与mission24/event14 predicate、类型/valid/ID/rawkind门及独立handler入口gate。CITY与building对象分开，handler0仍dispatcher1；成功tail以source/event/stage/saved-pointer/full-frame before→after替换或整次reject，允许任务/active/executing/data/RNG变化，不默认callback非干预。旧API/trace不动；完整004BBAA0后置observer与return/role组合仍open。

两源各169范围/105code/64data，合计22,202 raw bytes；完整IDB指纹、独立raw-ID1与text byte hash全过，169对选段全同。14source与34model测试含768独立oracle/JSON重放通过。完整回归88条命令零失败：TypeScript、85 Node、85 Python checker与2 demos；独立审阅通过：14文件/index一致，338范围/22,202bytes另行stdlib raw-ID1核对；全部回归重跑及512 evolving-frame/1,241可变tail、512 JSON replay、1,536证据/RNG重签篡改拒绝与10边界preflight测试通过，无待修阻断。发布前仅补充本审阅结论；合并后main仍须全测。S1/S2均MOD关联，recorded EXE hash非binary认证；clean stock/Vanilla/force灭亡/空军团/真实存档与全局RNG仍open。

## 历史完成：P0-58稳定非空军团与太守角色协调

[正文](93-legion-role-reconciliation.md) · [结构化证据](../sources/legion-role-reconciliation.json)。基线main `6d62e86caddd50887b4d4792cb1918526e980722`（PR #15已合）。

新增独立004BE2A0稳定分支及004BCA30(refresh=0)标量API：allocated与valid存在谓词分开，军团长与太守比较器不同，capacity低16位/office/derived bytes等输入可追溯；原home-roster次序、最后status<=1 shortcut、old==new暂态status/太守变化和0..86据点调用顺序保留。event8在太守字段写前、event14在清空后，完整阶段snapshot精确反映live mutation。capacity/mission getter与监听器均未执行，显式非干预record/reject；无虚构军师调整。

灭亡/空军团/refresh!=0/非安全排序域整次defer，完整返回/capture未组合。stage-bound观察、完整稀疏canonical域、原子preflight、command防重与trace重放不改变所有旧API/trace。S1/S2容量计算及hook差异分别取证，clean stock/Vanilla/真实存档与全局RNG仍open。199范围/21881 raw bytes均直接双源取证并另用raw-ID1复核，98组共同范围94同4异，另含3个S2容量hook。17项source与47项模型测试（含512组独立全状态/事件快照oracle及JSON重放）通过。完整回归86条命令零失败：TypeScript、85 Node、83 Python checker、2 demos；模型测试最后新增4项后另行复跑47项全过。独立审阅通过：冻结14文件/index一致，另行直接raw-ID1核199范围/21881bytes与双IDB指纹，47模型/17source/512 oracle及完整86回归再次通过，无待修阻断；旧API/trace/训练代码未修改，staged/unstaged whitespace clean。合并后main仍须全测。

## 历史完成：P0-57武将返回字段与列表/角色调用序

[正文](92-officer-return-finalizer.md) · [结构化证据](../sources/officer-return-finalizer.json)。基线main `1ff61538c16a1e95dddc15cd228f63d7e15cd356`（PR #14已合）。

独立004BF6F0投影补home→actual location→rawlegion→bit9及旧新home/legion roster调用阶段。保留numeric same-force、实际troop观察、kind/ID/subtype区别、-1不清bit9、非法legion请求仍先移旧roster和saved status控制role顺序。ruler ownership/capture整次defer；旧新军团/旧home完整角色与list/UI/notice继续显式非干预record/reject，不把局部after当全返回。所有旧API/trace不变。

108个范围直接重读两份IDB并另用raw-ID1复核；54组双源比较全同，3744新增raw bytes/9560选定bytes，既有54范围固定hash复用。18项来源测试与27项模型测试（含384组固定seed oracle/replay）通过。全回归84条命令零失败：TypeScript、85 Node、81 Python checker与2 demos。notice formatter/display参数栈拆分已由callee ret0x10确认并修正。独立审阅无剩余阻断：冻结14文件及index逐字节一致、108范围/9560 bytes再次raw-ID1复核、27模型/18source及全部回归和另11边界case通过，旧API/trace/训练代码均未修改；staged/unstaged whitespace检查clean。合并后main须再全测。下一主题是稳定非空004BE2A0角色协调；完整角色/force/事件/capture、base销毁、clean stock/Vanilla/真实存档继续open。

## 历史完成：P0-56 mission37完成、一步推进与延迟退款

[正文](91-return-mission-lifecycle.md) · [结构化证据](../sources/return-mission-lifecycle.json)。基线main `b488a9f6a38fbb45e6e6c2ac64cd68f6fa3f97ed`（PR #13已合）。

独立complete/advance API补上mission37 positive refund→mission/five-args reset→duration0。单supplied active-list成员保留live valid/mission/acted gate、observed stop、源分离六邻城最小距离与首slot tie、到达真实building ID、handler1/dispatcher0、full-return边界后的direct acted0/duration0。no-next只清任务参数；canonical valid home/安全target地理/资源子对象限制明确是模型边界，完整callback与全链表/旬scheduler未执行。

106范围直接重读并另用ID1 raw section复核，53组双源比较46同/7异；16项source测试、27项模型测试含256组fuzz通过。完整trace/RNG零local调用、全部观察preflight、原子拒绝和重复退款保护保持此前API/trace不变。全回归82条命令通过：TypeScript、85 Node、79 Python checker与两demo。独立审阅直接复核两份IDB全部106范围、两个1764格距离矩阵，重跑旧v1/v2/group/facility/special 15/15/20/24/21 tests；port/gate query ledger前移修复及新增阶段测试复审通过，无剩余阻断。合并后main须再全测。完整004BF6F0/角色reconcile、base销毁、事件/force/capture组合、clean stock/Vanilla/真实存档继续open。

## 历史完成：P0-55能力培养任务41..43取消

[正文](90-special-mission-cancellation.md) · [结构化证据](../sources/special-mission-cancellation.json)。基线main `8dd3a566b3d4627657ab2cbe9c50ccb3c9c84fdb`（PR #12已合）。

41..43共享005D9C60已有独立有界API：actor→args[1]建筑0..16383→args[0]培养记录0..97按序短路，不虚构实际所在地valid gate。troop/-1与home=-1相等时正确reset；六个双源vtable+18新slot确认005DA320条件通知取actor.home。零退款、S2同地acted差异、字段阶段快照、观察preflight和显式callback非干预/record/reject保持此前API/trace不变。

新增10范围、引用47范围均直接重读IDB并核哈希；28组双源比较27同/1异。8项字节checker和21项模型测试含360组fuzz通过。全回归80条命令通过（TypeScript、85 Node、77 Python checker与2 demos）；独立审阅无阻断：独立stdlib mmap/ID1直接重读两份IDB，全部57范围与源哈希及六slot吻合；新增8+21和旧v1/v2/group/facility的15+15+20+24 tests重跑通过。合并后main仍须再全测。专用cancel家族现均有分开的有界投影；base销毁、mission37完成、004BF6F0全返回/事件/force/capture组合以及clean stock/Vanilla仍open。

## 历史完成：P0-54设施任务取消、销毁字段与宝物42

[正文](89-facility-mission-cancellation.md) · [结构化证据](../sources/facility-mission-cancellation.json)。基线main `3a93431f3ef8a4e15e920ebb9475939a6aab1e21`（PR #11已合）。

0/38已有独立有界投影：当前建筑必须type0；mission0按ID前三组收集先于target；目标无效返回1且不reset。零退款返回之后才是type30 treasure42 owner/city/state与设施销毁。raw0x38只写精确offset/width，未知byte保留；城市计数模256，S2升级type54..59仍有construction gate而S1无此gate；home扫描使用allocated与来源各自ID排除。

新增24项模型测试通过，覆盖两源完整设施type/construction矩阵、全部byte回绕、treasure边界、invalid-but-allocated home、精确写宽、所有必要观测preflight、原子拒绝、时序快照、重放与fuzz。source-accepted type0..2销毁为显式defer/reject；完整列表/attachment/force/空间AI/return回调未执行，非干预是可替换工程前提。77个新字节范围、24个既有引用，38组双源比较35同/3异，10项字节checker通过。TypeScript、85 Node、全部75个Python checker与两demo共78条命令全过。独立审阅无阻断：重跑新增10+24及旧group20/v2 15/v1 15测试，另366组直接source-bytes计数oracle和20项invalid-type/reorder回归通过；具体class5 gate证据缺口已补齐并复核。合并后main须再全测；不以局部after冒充整场capture或stock/Vanilla证明。

## 历史完成：P0-53组任务取消、城市计数与研究字段

[正文](88-group-mission-cancellation.md) · [结构化证据](../sources/group-mission-cancellation.json)。基线main `b95e33a7c1e23e7bc14a8ec23b90ff5030099c8e`（PR #10已合）。

2/5现有独立组事务投影：完整稀疏person宇宙，ID序前三个同任务/组键匹配者，不按势力/位置/target过滤且不保证actor入组。2先恢复四路signed city计数clamp[-1,30]；5先清actor force研究ID/byte，然后才按组序零退款返回。无效city/force只跳过相应字段，不阻止组取消。S2研究getter扩至63的00914000 hook与S1分离。

新增20项测试通过；21新增byte范围（10双源比较8同/2异及1S2 hook）、25既有引用范围和容器/manifest哈希锁定。TypeScript、85 Node、73 Python checker与两demo共76条命令全过。独立审阅无阻断：新增20、旧v1/v2各15及detachment28测试通过，另1024组独立oracle/重放和16组mutation/domain验证通过，46范围均从两份IDB重读匹配；preflight修复已复核。PR #11合并后main 3a93431f已复测76条命令全过。旧v1/v2未改义；完整return/list/event/force回调、41..43与stock/Vanilla仍open；0/38新增有界范围见P0-54。

## 历史完成：P0-52六个零退款任务取消handler

[正文](87-mission-cancellation-zero-refund.md) · [结构化证据](../sources/mission-cancellation-zero-refund.json)。基线main `324dd78b3c5a831cdf5d9406f63c492b7248bed4`（PR #9已合）。

9/10/12/22/23/24现有独立v2有界投影：actor→实际据点→target的短路gate、零退款、异地mission37/同地reset和S2 acted hook。9/10/12没有目标有效性硬gate；24建筑getter域到16383；23城市子对象不与建筑valid混淆。旧v1保持原trace边界；回调未执行及其不干预是显式record/reject政策。

验证：新增15项测试通过；TypeScript、85 Node、全部72 Python checker与两训练demo全测通过。双源六handler正文相同；新增4个source字节范围、既有manifest固定哈希和直接调用/比较opcode校验。独立审阅无待修阻断，另5760组source/gate/boundary/policy/trace和12组v1迁移/快照alias验证通过；新增四段由审阅者重新读取IDB核对。PR #10合并后的main b95e33a已复测75条命令全过（typecheck/85 Node/72 Python/两demo）；未运行原作或真实存档。剩余0/2/5/38、41..43、mission37完成、004BF6F0完整返回/事件/force链及clean stock/Vanilla/主机版继续open。

## 历史完成：P0-51人员游离、末城逃逸与任务取消资源

[正文](86-personnel-detachment-source-profile.md) · [结构化证据](../sources/personnel-detachment-source-profile.json)。本组基线main `453305b2dc64927a715fc58fceb0522557815f34`（PR #8已合）。

004BA520按candidate→anchor距离1收集42城ID序候选，不过滤势力；无效anchor的早期Random42在troop覆盖后仍保留消费。004BBB00的home/territorial-city实际位置、军团/身份/忠诚/官职/期间与旧军师/太守/军团长字段现有有界投影；events2/8/5/21及invalid-former release的event4/tail顺序有快照与重放。旧任务直接reset后才set37，因此此在野路线不触发取消退款。

44任务cancel注册表和vtable+0xC已恢复，明确区分无操作、15..21已投影退款/异地返回以及其余专用handler。S1/S2金cap、query33/38和S2 acted-hook分别绑定来源。旧P0-50 v1不静默改trace；两个新独立模块均显式record/reject，尚未组成完整capture或force灭亡，未接入训练战斗。

验证：TypeScript、85 Node、全部71 Python checker与两个训练demo通过；detachment 28项测试覆盖146个邻城选项，cancel 15项专用测试含source分支和完整输入重放。403个文本字节范围、201组S1/S2对照（194同/7异），另S2 hook单独取证。独立审阅无待修阻断，另704组source/mission/location/policy扩测通过；最终main合并后另行复核，不能将无远端CI配置误称CI通过。clean stock、真实存档/全局RNG、监听器/其余cancel/完整返回与force、Vanilla/主机版仍open。下一主题可优先进入其余专用cancel handler、004BF6F0返回、004A8110→005B9D30事件任务链或004B03D0 AI处分。

## 最新完成：P0-50旧俘虏释放、迁移与排序来源审计

[正文](85-capture-relocation-source-profile.md) · [结构化证据](../sources/capture-relocation-source-profile.json)。本组基线main `e4dab4be5e86bd3d410048137a9c2a3847f2f494`（PR #7已合）。

恢复原home链序的旧俘虏pass、己方归属shortcut、返回原势力首军团/君主home、event4后禁仕tail、004B0F50目的地优先链和territorial-city距离/同分随机。004A7990只准备任务期间并返回origin，base escape不写actual location；004B1950末城gate在selector之前。缺席home-roster与身份rank表降序稳定排序已恢复，不能混同资金不足forced-release comparator。

独立有界Python人物投影，34项测试；126个文本范围、63组S1/S2对照（58同/5异），其中距离表1084/1764个byte不同。输入与RNG/事件时序有trace和重放，未执行任务取消资源、太守/军团/force/事件callback；004BBB00/004BA520在野路线用明确defer/reject，未拼成完整capture。两源均MOD相关；stock、真实存档/全局RNG和独立Vanilla等价仍open。

全回归：TypeScript、85 Node、全部69 Python checker、两训练demo通过（最终main仍须合并后复核）。下一主题可继续004BBB00/004BA520及任务取消资源finalizer，或004B03D0 AI处分callee；不能因本组helper body恢复而清除完整游戏证据债。

## 最新完成：P0-49城兵容量与人员capture来源审计

[正文](84-capture-personnel-source-profile.md) · [结构化证据](../sources/capture-personnel-source-profile.json)。本组基线main `feca7b37678bccff55d0e8e5732cea463c457708`。

S1城市特产查询及150000/100000兵cap、身份/地点/势力候选ID顺序、末城硬gate、type0宝物与skill32优先级、binary32(0.01)取整、p<=0零随机/p100仍消费随机已恢复。004B2820六路处分表及玩家/AI非连续tails已取证；可运行模型提供显式hold/observed/reject配置和三个已知俘虏字段写回。

这是004B3180起点的独立部分投影：前置释放已作为输入阶段契约，后续位置/军团/任务/非hold处分及事件不伪造。P0-48未因此变成整场capture。PK reconstruction、Vanilla单独assumption；S1/S2均MOD相关。S2确有末城gate/skill/概率/RNG和容量改动。

静态证据：142个文本范围、71组对照（61同/10异）。新30项测试含77,824组算术及trace/replay边界通过。全回归：TypeScript类型检查、85个Node测试、全部68个Python checker与两个训练demo通过。依赖沿用前组相同lockfile且已验证的registry包副本。这些原下一项已由P0-50新增有界投影；当前剩余在野/资源/AI/callback范围见顶部P0-50。clean stock/全局RNG/真实存档债仍保留。

## 最新完成：P0-48 capture transaction来源审计与有界投影

[正文](83-capture-transaction-source-profile.md) · [结构化证据](../sources/capture-transaction-source-profile.json)。本组基线main `9462f8cf1e9e24147757f0032aec1f11df579033`。

三direct caller cause/mode、关系helper、完整有序世界候选、type30/overflow、设施unlink和存活domestic动态owner刷新已接入参考模型。Neutral最终清零此前保留资源；ordinary ownership按新owner max先cap耐久，再尾半max floor；普通入城先用完整兵数加权气力，再逐资源/12 cargo slot cap。半耐久与非整除rounding现在有S1 body和有前提的scalar实现，不再笼统称缺body。

这是独立Python参考事务，未向TypeScript训练沙盒添加战斗。PK明确reconstruction，Vanilla独立assumption；人员/俘虏、force量值/灭亡、设施计数器/引用、太守排名、事件/AI/显示队列及复杂入城使用显式fallback ledger或拒绝，不冒充完整原作事务。

静态证据：61个来源范围、24组S1/S2比较（17同/7异）；S2对caller/资源/候选/宝物/地域表有修改，绝不混入S1。全部来源仍MOD关联，clean stock、全局RNG/真实存档以及跨平台证据债保留。

验证：新参考校验35个test（含150状态组合）通过；TypeScript检查、85个Node测试、全部67个Python check脚本、训练demo和十年360旬生命周期demo均通过。该组后续人员/容量研究现见P0-49；完整人员迁移及事件链仍可从已有静态资料推进。

### 既有P0-36更新范围

`004B9840`在S1普通building-entry非负有界域为整数floor加权，source rounding已恢复。P0-36的旧unknown断言保留为当时/stock与troop-to-troop证据边界，不再作为S1 helper缺body的现行结论。

## 最新完成：P0-47训练生命周期与source审计

[实现指南](../engine/pk-training-lifecycle.md) · [来源审计](82-training-lifecycle-source-profile.md) · [结构化证据](../sources/training-lifecycle-source-profile.json)。本组从main `56f1aa4ad9cf2bff5612b1777e16dc54be0cdefb`的新分支开发。

训练资格与独立身份/位置/任务状态、行动重置、可替换旬phase plan、累计WAR经验成长、v2存档与显式v1状态迁移已完成。XP0..3000累计，不在每次+1时扣100；普通合成能力clamp1..100。默认满气力拒绝，但EndTurn可继续；十年360旬全trace/seed/save/replay回归通过。

S1来源中`005C4100/005B8320/005B80F0`、XP writer/getter、研究共享XP、reset全局遍历及非连续tails、`0059C330→0059C2A0→0059A230`野外气力tail-xref现已恢复。S1/S2两个IDB均关联MOD，且S2的XP/能力cap确有不同；不能将source字节升级为stock PC-PK1.1。

原作证据债继续保留：独立clean stock对照、完整scheduler/AP时序、任务与属性全链、全局RNG、Vanilla/PS2/Wii。此切片仍无AI/经济/战斗/派遣等完整游戏系统，也不关闭下面P0-46剩余capture缺口。

验证：TypeScript检查与85个Node测试通过；全部66个`check_*.py`通过；两个demo及growth-fixture CLI通过；26个函数/尾块fingerprint、11个opcode断言、8组S1/S2对照、24,008条成长不变量通过。独立代码审阅无未修阻断。既有`check_techniques.py`只修3处字面\n语法错误，保留全部规则断言与merit unresolved标记。

## A1–E20 主审计已完成；正在清理 exactness gaps

A1–A5、B1–B9、C1–C11、D1–D10、E1–E20 共55个主审计点已经完成写回。

### 最新完成：P0-46 据点陷落 caller / 内政设施 selector 来源审计

- [P0-46 正文](81-capture-selector-source-profile.md)
- [P0-46 结构化证据](../sources/capture-selector-source-profile.json)
- [机器码摘录](../sources/capture-selector-source-profile/capture-selector.asm.txt)
- [参考模型](../../scripts/capture_selector_profile.py) 与 [校验](../../scripts/check_capture_selector_profile.py)
- [攻城主规则](05-combat.md)

本轮恢复 `004B2CA0..004B36FF`（末尾不含）的 body、三处直接 caller、city-only gate、全局链表候选顺序、完成状态/type30/30容量边界、魅力 getter、保留 quota、RNG 和销毁前缀。`004B329B` 是该函数内的资源段，不能因它不是 selector 就排除整个 containing function。

来源算法为 `keep=min(n,floor(max(20,charm)/20))`；无硬性5上限。n>1时逐项做 n 次全范围随机交换，即使全部保留或最终全毁也消耗 n 次 RNG。新势力ID超出0..41时，在 shuffle 后改为全毁。完成铜雀台在普通候选之外；总保留数不等于 quota。算法不是均匀 Fisher–Yates。

**原性边界：** 公开 IDB 记录的输入位于“血色5.0公测”目录。本轮 `opcode-exact` 只绑定其 source profile/hash，`stockOriginalVerified=false`。stock PC-PK1.1 采用时是 `compatibility-reconstruction`；Vanilla 必须另标 `compatibility-assumption`；PS2/Wii 独立 open。

附带恢复的晚期耐久块把当时耐久补到 `floor(maxAtTail/2)` 下限，高于则不降低。P0-48现已恢复ordinary/neutral scalar finalizer和有前提的pre-to-post关系；全人物/事件副作用仍未闭合，不能宣布所有陷落模式一致。

参考模型只接收已资格化、有序候选并返回计划/trace，提供注入draw、工程seed和已给定状态的来源LCG三种模式。校验通过不等于原EXE/存档回归，也不等于完整候选/事务引擎已实现。

下一步以P0-48为准：clean stock build 对照、剩余人物/force/callback finalizer、全局 RNG/存档验证；按可定位缺口推进，不预设固定 P0 终点。P0-44/45保留为历史证据，当前 selector 结论以P0-46的限定范围为准。

历史基线曾为65项中64项通过，唯一技巧脚本SyntaxError现已作语法修复；不代表技巧研究证据债关闭。
