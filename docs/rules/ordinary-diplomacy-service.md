# O08 普通外交独立服务：具体规则与证据边界

更新：2026-10-17 UTC。实现：[ordinary-diplomacy.ts](../../packages/engine/src/ordinary-diplomacy.ts)；[API](../engine/ordinary-diplomacy-service.md)；[结构化来源与政策](../sources/ordinary-diplomacy-service.json)；[静态场景](../../data/scenarios/ordinary-diplomacy-example-v1.json)。本次仅静态代码和文档工作，未运行测试、编译、build、checker、产品或诊断。静态算例不是执行结果。

## 1. 交付范围

本服务在自己持有的单城市、单出使势力、单执行者及多目标势力事实中，计算亲善、同盟、停战，实际结算独立金/AP账户与关系账本，并逐旬递减停战期限。preview、execute和保存重放共用同一纯计算路径。它不是全外交流程，也不替代旧训练GameState或既有外交adapter。

明确排除：劝降、俘虏交换、断盟、援军、捕获判定、人员身份与归属、原生mission/return/人员返还、出使旅行、原生scheduler、P078及依赖、舌战本体，以及TP/功绩/政治经验奖励。账本即时退款不调用任何原生返还函数；执行者始终是固定已解析输入，不进入“在途/已返回/被捕”状态。

## 2. 版本与证据

唯一实现profile是 `ordinary-diplomacy-pk-empirical-v1`，公式来源profile为 `pk-pc-formula-corpus`，等级 `empirical-high`，exactBuild仍 `open`。`stockOriginalVerified=false`、`nativeLifecycleIntegrated=false`。只在此PK工程域内 `compatibilityAssumption=false`，不代表没有其他工程假设。

不接受Vanilla或主机profile，也不静默fallback。Vanilla 1.1和1.2有官方外交平衡变更，PK完整公式含新增超级0.7；不能删去0.7就声称无印原公式。详细边界沿用[07](07-diplomacy.md)、[37](37-diplomacy-version-boundaries.md)及[既有版本manifest](../sources/diplomacy-version-boundaries.json)。旧15项fallback第3节是证据层resolver建议，不是本服务运行时API。

公式属于历史经验语料；官方手册和PC-PK地址材料支持外交府周边效果，但不能把整个判定升级为逐指令精确。下文费用、取整、期限、失败结算与冲突关系优先级都有具名可版本替换policy，未确认部分始终标provisional。原43组证据主题不清零、不减少。

## 3. 固定输入、字段域和方向

输入只能是普通JSON数据：拒绝额外字段、访问器、隐藏/符号字段、循环、稀疏数组、非普通原型、非安全整数、负零以及不支持的类型。支持的Node运行时还拒绝Proxy。输出深冻结且与输入脱离。ID是工程整数域0..2147483647，不声称原作ID上限。

| 字段 | 精确合同 |
|---|---|
| xun | 0..1000000000的整数，只代表本外交时钟 |
| difficulty | beginner / advanced / super |
| resources.gold / actionPoints | 分别0..1000000000的独立整数账户 |
| sourceCity.id / forceId | 一个城市ID与一个出使势力ID |
| sourceCity.diplomacyOfficeCompleted | 布尔；已完成外交府，不能用建设中项目替代 |
| executor.id / forceId | 唯一固定执行者；forceId必须等于城市forceId |
| executor.politics | 0..100整数；已解析有效政治，本服务不加宝物、官职、成长或伤病修正 |
| executor.affinity | 0..149整数；普通圆环域 |
| executor.hasDebater | 布尔；已解析是否有论客，不接受caller成功结果 |
| targets | 最多32个目标；每个forceId唯一且不等于出使势力，君主ID唯一且不等于执行者 |
| targets[].ruler | id、forceId及0..149的affinity |
| relationFacts | swornSiblings、spouses、targetRulerLikesExecutor、targetRulerDislikesExecutor，四个必填布尔 |
| specialGateFacts | resolution为known/unknown；formerServiceConflict与rulerHatredConflict为必填布尔 |
| relations | 最多528行已知势力无序pair关系；每个出使势力↔目标pair必须存在，可另提供目标间关系 |
| relation row | forceAId、forceBId、friendship整数0..100、allied布尔、ceasefireRemainingXun整数0..72 |

`targetRulerLikesExecutor`和`targetRulerDislikesExecutor`都是“目标君主→执行者”的方向，不能反写为执行者对目标的看法。它们是人际事实；friendship是势力间账本，两者不混用。

创建时pair按较小ID在前、按两个ID排序规范化，反向重复同样拒绝；不允许同势力pair、未知势力、重复目标或重复人物。缺关系行不默认成0。已同盟与正停战期限不能共存。持久化snapshot必须已经规范排序，拒绝篡改为反向/乱序的存档。目标间关系只会被单旬推进递减，不开放以其他城市/人员发外交命令。

snapshot增加schemaVersion=1、固定profile与revision。genesis revision必须0，接受命令后revision加1；创建后以上固定人物/城市/难度/事实没有setter。想换输入须明确创建新独立场景，不能悄悄更换原生人员。

## 4. 相性、关系系数和难度

令P为执行者政治，F为友好度，G为同盟或停战名义报价。令a、b为执行者与目标君主相性：

`D = min(abs(a-b), 150-abs(a-b))`

在0..149普通域，D为0..75。例：0与149的D为1。此服务不复用现有uint8相性叶的异常输入域，也不推导其native caller。

具名 `preferred-before-disliked-v1` 冲突优先级：

1. swornSiblings或spouses或targetRulerLikesExecutor为true → preferred
2. 否则targetRulerDislikesExecutor为true → disliked
3. 否则ordinary

同时有亲爱与嫌恶时按第1项处理。这是确定性的工程冲突政策，不是原生优先级已获证明。

亲善/同盟的c分别为1.5、−1、1；停战的c分别为20、−15、10。t在初级、上级、超级分别为1、0.8、0.7，内部存整数d=10、8、7，t=d/10。外交府不改P、D、F、c、t或判定值。

## 5. 亲善公式与结算

`rawGain = ((20*c + max(P-D/2, 0) + 100)/10)*t`

不向命令传入任意gift金额；费用固定见第8节，不能通过多送金无依据放大增量。具名 `rational-formula-final-floor-v1` 只在最终rawGain取floor，然后friendship上限裁剪到100。中间D/2不提前截断。最终floor位置是工程政策，非原EXE逐指令结论。

精确表示：

`rawGain = d*(40*c + max(2*P-D,0) + 200)/200`

2c取3/−2/2，故所有中间计算可用整数。亲善在普通支持上下文中分类success；不抽RNG，不发起舌战。即使友好已100，命令仍按固定费与AP支付，revision仍增加，这是本服务显式合同。

## 6. 同盟公式与严格阈值

`V = (G/150 + P-D/5 + 10*c)*t`

顺序不可交换：

1. `V > 2*(100-F)` → success
2. 否则若hasDebater，或 `V > 2*(80-F)` → ordinary-failure
3. 否则 → dangerous-failure

同盟成功：友好+10后clamp；allied=true；清除已有停战计时。+10是07历史公式语料支持，不因此升级为stock精确结算。普通失败：友好−10后clamp；保留原条约和停战期限。−10属于明确provisional政策。危险失败只可preview分类，不执行见第10节。

精确分数：

`V = d*(G + 150*P - 30*D + 1500*c)/1500`

内部1500c以750*(2c)求值，不用浮点c。所有阈值采用交叉相乘严格大于，无epsilon，不做中间floor。等于成功阈值不能成功；等于次级阈值且无论客为危险失败。

## 7. 停战公式与严格阈值

`V = (G/400 + P-D/5 + c)*t`

本服务明确选择period=durationMonths：

1. `V > 80 + durationMonths/2 - F/4` → success
2. 否则若hasDebater，或 `V > 70 + durationMonths/2 - F/4` → ordinary-failure
3. 否则 → dangerous-failure

精确分数：

`V = d*(G + 400*P - 80*D + 400*c)/4000`

成功阈值为 `(320 + 2*months - F)/4`，次级为 `(280 + 2*months - F)/4`。全部用BigInt交叉乘法；报价只允许0..1000000000安全整数，从Number转BigInt前已检查。输出分数是十进制字符串numerator/denominator，允许不约分，不把有理数转换为浮点来分类。

成功设置 `ceasefireRemainingXun=3*durationMonths`，友好变化0是provisional政策；已有停战成功续谈时直接替换期限，可能延长也可能缩短。普通失败友好−10且保持原计时。已同盟请求停战拒绝，不默默转约。

## 8. 钱、AP、外交府与退款

| 具名policy | 本批完整有效行为 | 证据层级 |
|---|---|---|
| diplomacy-ap20-office-half-v1 | 普通20AP，执行城市已完成外交府10AP | 总表20与官方半价支持；独立费用caller合同provisional |
| amicability-flat1000-office-half-v1 | 普通亲善1000金，已完成外交府500金 | 1000与半价地址/手册支持；完整native费用合同未闭合 |
| offer-gold-no-office-discount-v1 | 同盟/停战报价0..1000000000，公式与预算使用全额G，外交府不折价 | 不额外发明报价折扣，standalone policy |
| immediate-refund-on-ordinary-failure-v1 | 全额预算先合格；成功消费全额；普通失败报价即时全退、AP不退 | provisional-engine-rule，原生返还时机open |
| friendship-clamp0-100-v1 | 0..100夹限；亲善floor(rawGain)、同盟成功+10、普通失败−10、停战成功0 | 同盟+10语料支持，其他界限/结算选择明确provisional |

即使已知会普通失败，也必须先有全额G和完整AP，不允许利用“以后会退”在钱不足时执行。资金/AP不足不会部分扣款。报价G=0合法，仍支付AP并按公式分类。

收据分列：reservedGold为本次必须具备的预算；refundedGold为普通失败立即返还部分；spentGold为实际消费；netGoldCost=reservedGold−refundedGold=spentGold；spentActionPoints为实际消耗。成功例如报价1500：reserved=1500、spent=1500、refund=0、net=1500。普通失败同报价：reserved=1500、spent=0、refund=1500、net=0。账本只按net一次扣金，refund不是以后可重复领取的凭证，不另创建待退账户。

`005B8400`人员归还中涉及外交失败金钱，仅证明真实原生付款/返还与人员生命周期相连，不能作为本服务“即刻退款已经原生证实”的依据。本实现完全不调用它。

## 9. 条约、月份与外交时钟

- `ceasefire-months-to-xun3-v1`：整数月份1..24；公式period按月；每月3旬；剩余1..72旬。这组单位解释、3旬换算、24上限均是工程政策。攻略有24个月实例不证明原版最大值为24
- `alliance-indefinite-ceasefire-exclusive-v1`：同盟不自动到期；成功同盟清停战；已同盟的重复同盟及停战拒绝。位字段存在不证明这一完整转换顺序
- `diplomacy-only-single-xun-v1`：Advance只推进1旬，所有正停战计数减1；1→0在该收据列expiredPairs，之后保持0；不能减成负数
- Advance不改变友好/同盟，不恢复AP、不产生收入、不更新全游戏年月、不驱动其他服务、人物或原生任务
- 每条命令必须expectedRevision，Advance还必须expectedXun；成功后重复原命令因旧revision拒绝，不再退款、扣款或推进。没有command-id或跨重试幂等缓存；调用者用返回session继续下一条
- revision与xun上限均1000000000；达到相应上限时拒绝，不溢出。无停战仍允许单旬推进，并增加revision/xun

## 10. 未闭合特殊门槛与危险失败的原子边界

07只记载存在旧势力/君主人际导致必败的特殊门槛，没有完整条件正文。`resolution=unknown`、`formerServiceConflict=true`或`rulerHatredConflict=true`中的任一情况使本次外交返回 `unsupported-special-gate`。不把未知默认false，不把特殊事实当caller success override；针对其他已知普通目标和外交时钟仍可运行。

危险失败意味着语料中本应进入进一步被捕分支。该分支不在本服务范围，因此preview保留精确formula与dangerous-failure，标executable=false，receipt/projectedSnapshot均null；execute原子失败 `unsupported-dangerous-failure`。它不计算捕获概率、不抽签、不伪装为普通失败，不扣钱/AP、不改友好/条约/旬/revision/entries，也不生成已提交收据。

处理序列：

1. 普通数据、安全整数、字段、profile、完整policy、genesis/history一致性
2. command shape、revision及城市/执行者/目标一致性
3. 特殊上下文支持门槛
4. 费用与精确公式计算
5. 全额金、AP及条约合法性
6. 危险失败拒绝
7. 在脱离输入的副本上一次提交资源、关系、revision、收据

多种失败同时存在时按此顺序报告。任何失败都不返回部分提交的新session。preview的ok=true只代表得到一个有效计划，仍须查看executable；schema或身份错误会直接ok=false。preview不会改变输入，execute会重新计算，不能把caller伪造的preview当授权结果。

## 11. 论客和随机性

hasDebater只用于成功分支之后的次级OR。它不能把本来成功降为失败，也不能自动升级失败为成功。只在非成功且有论客时输出debateEligible=true，意思是留给其他未来服务的候选标注，不代表实际触发舌战。

本服务所有命令 `rngDraws=0`，不接受RNG/roll/outcome/success之类caller字段。地址材料中的初/上与超级20触发参数不在此应用；舌战触发与胜负都没有被实现。调用者不能凭论客让外交自动成功。

## 12. 奖励明确不应用

本批不应用TP、功绩、政治经验奖励，也没有对应账户或人物setter。每条收据 `rewardsApplied=false`。

保留证据与冲突：

- 07历史语料：同盟成功功绩500、政治经验5、TP50
- 亲善奖励地址注释支持政治经验3、功绩50；同盟与停战对应注释支持经验5、功绩500，但不在本批写回
- `docs/rules.md`旧奖励表的停战成功TP35，与[百度知道历史完整外交公式转载](https://zhidao.baidu.com/question/693845718520080364/answer/2870151990.html)停战结果段的TP30不一致。该转载只是低等级历史再转载，原始研究出处与精确build仍open；PTT所列页面只有劝降相关公式，不能充当停战TP30的出处。两项按原来源和适用范围完整保留，不能挑一个假装confirmed，也不能靠另一条同盟TP50来推停战

这一冲突不阻塞独立关系/费用/期限服务，但阻止声明完整外交奖励或全流程等价。未来奖励接入需另立版本与证据，不借此扩展人员返还/归属/P078。

## 13. 持久化、收据与政策完整性

会话保存tag、完整policy、genesis、最终snapshot与每条accepted command/receipt。固定政策id只是一部分：id相同而任何有效配置不同也拒绝。每条receipt再次携带完整policy与evidence，包含精确formula、前后revision/xun/资源、费用预约与退还、前后关系、到期pair、未应用奖励及RNG信息。

save、load、preview和execute读取已有会话时，都从revision0的genesis重新计算每个command，逐字段比较完整receipt，最后比较整个snapshot，包括固定城市/执行者/目标/难度/事实，不只比较资源。修改receipt、遗漏条目、伪造最终事实或更改policy不能靠一个相同id逃过重算。

保存为规范key顺序JSON；每会话最多256个成功接受的命令，输入/输出文本上限16MiB UTF-16 code units，输入递归深度32、节点1000000。达到history-limit后拒绝新命令，不自动丢弃历史或改genesis。此上限是独立存档工程域；不是原作回合上限。重放一致性不是数字签名：若第三方一致地改写整个genesis和轨迹，可组成另一个有效场景，不能把它当真实性认证。

## 14. 静态算例与待验证矩阵

以下均为纸面推导，未运行代码：

- 初级、D=0、普通c、F=50、G=1500、P=80：同盟V=100，恰等于成功阈值100，次级60；普通失败。P=40时V=60等于次级，危险失败；各自P加1则分别成功/普通失败
- 初级、D=0、普通c、F=40、G=4000、months=6、P=53：停战V=73，恰等于成功阈值73，次级63；普通失败。P=43时等于次级，危险失败；各自P加1则分别成功/普通失败
- 上级、P=81、D=1、普通c：亲善rawGain=(20+80.5+100)/10*0.8=16.04，只在最终floor为16；F=95时实际增量5
- 同盟危险等号例只把hasDebater改true：ordinary-failure且debateEligible=true，不是success

静态场景依次演示同盟等号失败退款、亲善、同盟成功、另一目标停战成功与单旬递减；expectedByHand是设计说明，不能当已执行收据。

后续验收设计应覆盖三难度、关系冲突和方向、相性跨环、两类阈值等号、论客OR、资金/AP刚好及差1、外交府只减允许项目、危险及special原子拒绝、重复命令无重复退款、友好上下界、旧停战保留/替换、同盟清停战、1→0到期和重复tick、非法profile、全部存档字段及policy篡改。本批未创建或执行这些测试，也没有修改旧测试、脚本或已有历史报告。

## 15. 来源与保留缺口

[来源manifest](../sources/ordinary-diplomacy-service.json)逐项列出固定提交、URL、锚点、适用规则及不足。核心材料为07/37、官方PK手册、历史公式语料、固定311MemoryResearch与Sire材料。地址是资料索引，不代表已经拿到完整函数体或当前stock二进制。

仍open：精确PK build、原判定函数逐指令、中间取整/溢出、特殊必败门槛、原生费用与返还、期限单位/上限/转换及scheduler、舌战触发与胜负、奖励争议，以及Vanilla/console对应规则。工程实现不把它们转为confirmed；原43、P078排除与历史未解决的默认food测试失败保持，不用过去通过数字覆盖此树。
