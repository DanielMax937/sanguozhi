# 固定驻城自然忠诚与现金褒赏生命周期

更新：2026-10-17。独立 O12-A 软件服务，profile 为 `standalone-personnel-loyalty-v1`。[工程接口](../engine/personnel-loyalty-lifecycle.md)另列输入、事务与持久化合同；[完整policy](../../data/catalogs/personnel-loyalty-policies-v1.json)、[来源manifest](../sources/personnel-loyalty-lifecycle.json)与[未运行静态场景](../../data/scenarios/personnel-loyalty-example-v1.json)分别保存数据和证据。

本服务实际维护自己的忠诚 byte、金/AP、每人本旬褒赏状态、日历、随机状态和接受历史，只提供 `CashReward` 与 `AdvancePersonnelTurn`。这是限定支持域的代码与规则交付；没有运行测试、typecheck、编译、build、checker、诊断、schema 校验、产品或示例。静态实现不等于执行验证，不关闭整个 O12、原43组证据主题或原作人事机制。

## 1. 支持域与证据分层

- 一个固定势力、固定君主、一座固定城市和0..80名固定驻城普通非俘虏武将。名单、归属、位置、关系、技能与君主属性均不在运行中变更；君主不进入普通忠诚目标循环
- 每人真实忠诚 `0..255`，显示值为 `min(trueLoyalty,100)`。初始忠诚是场景事实，不是登用后初始忠诚公式
- 金与AP分别为 `0..1000000000` 的封闭独立预算；不与财政、商人、城市命令或其他服务共享账户。没有工资、收入或自动回满
- 日期为年 `1..9999`、月 `1..12`、日 `1|11|21`；最多推进360旬，创建时证明配置的完整推进窗口不越过9999年。初始日期明确已经结算，初始季初不倒补掉忠

证据层不能互相替代：

| 层级 | 本批用途 | 仍未证明 |
|---|---|---|
| 官方 PK 命令说明 | 每人100金/5AP、同城多人、每人每回合一次、显示100及部队中不可褒赏 | 褒赏增量公式、精确 RNG、原生执行链 |
| 固定公开自然忠诚 caller | 季初/豁免/三分支候选、人心掌握与两次loss的分支形状 | clean-stock身份、关系helper体、global RNG、原writer |
| 既有相性教程核 | 保留双uint8输入及完整signed32/EAX/AL结果；本服务消费AL | 教程与自然caller或S1同源、native解析 |
| 新软件政策 | 固定关系图、固定名单、共享新随机流、现金5..9、byte饱和写回、事务/存档 | 不声称等于原作隐藏关系、魅力/义理公式、native人事或全局调度 |

本模块复用 `calculateAffinityDistance`，不修改其 `affinity-distance-tutorial-u8-v1` 全 `0..255` 输入域。既有 `decideOrdinaryRecruitment` 仍是单独决策 API；本模块不再包装登用，不收费模拟加入势力。O10-A已覆盖的足额月薪不重造，欠薪后果不接入。

## 2. 固定场景与关系图

完整字段见[API场景合同](../engine/personnel-loyalty-lifecycle.md#2-场景输入)。本规则使用：

- 君主及各武将的原始相性byte `0..255`、内部义理/野望 `0..4`；君主魅力 `0..100` 如实保存，但现金增量政策不使用它
- 君主/名单技能只接受 `[]` 或 `["benevolent-governance"]`
- 势力的 `hasHumanHeartControl`，城市的 `hasTokenPlatform`
- 有向 `likes`、`dislikes`，规范化无向 `spouses`、`swornSiblings`，有向 `parentChild`

关系只引用本城君主与名单成员；不可自指或重复。每人最多一位配偶、两名父母，亲子无环。正反关系可以同时存在，例如同一官员可同时 likes/dislikes 君主；以先执行的豁免为准。亲子豁免只比较图中直接父子边的两个方向，不外推所有祖孙或血缘关系。

这一语义名为 `explicit-local-relation-graph-v1`，不等价于恢复 `00488910 / 00488790 / 004887D0 / 0048BDF0 / 004889E0` 全部原函数。排序统一按ASCII ID的代码单元升序，不能用locale排序；关系及名单不依赖输入排列。

所有结构封闭且字段必需。未知profile/policy、额外字段、非JSON值、accessor/symbol/隐藏字段、自定义原型、循环或稀疏数组均拒绝；整数拒绝负零、小数与非有限值。不存在可用额外字段偷接俘虏、部队、死亡、任务或外部最终判定的分支。

## 3. CashReward：资格、费用与每旬频次

请求包含1..80个不重复的目标ID。服务从当前状态自行检查每个目标：

1. 必须存在于固定 `ordinary-fixed-resident` 名单，君主不合资格
2. 本旬尚未受赏，即 `lastPraisedTurn !== currentTurn`
3. `min(trueLoyalty,100) < 100`，等价于本服务真实值 `<100`

任意一人不合格，整个命令失败；不能跳过后只收其他人的费用，也不能把未知人员当作忠诚0。先验证全体和全额预算，才按排序后的目标顺序消费随机数。

```text
N = 目标人数
goldCost = 100 × N
apCost = 5 × N
```

没有执行武将，不消耗acted，不发功绩或技巧P，人才府不减AP。金或AP不足时完全不扣费、不抽随机、不设褒赏标记。成功则一次扣全额，每个目标 `lastPraisedTurn=currentTurn`，revision只加1。

此profile把一次 `AdvancePersonnelTurn` 定义为一次新的褒赏频次窗口。旧 `lastPraisedTurn` 历史数字保留，新turn自然解除“本旬已赏”；保存/加载不会清除或重置它。

## 4. 现金增量是新软件政策

`synthetic-cash-uniform5to9-v1` 完整选择为：

```text
minimumGain = 5
outcomeCount = 5
drawsPerTarget = 1
gain = 5 + nextBounded(5)
```

每人恰一次draw，结果为5、6、7、8、9。`usesRulerCharisma=false`、`usesTargetGiri=false`、`notEstimatedFromObservedSamples=true`。

已知保真差异：原作资料有魅力影响褒赏增量、义理影响忠诚变化难易的定性说明，本新现金政策暂不建模这些作用。不能把“暂不使用”改写为原作“不使用”，不能从三种观察值拟合PK均匀分布，也不能编造一个魅力系数来淡化差异。增量由服务自己的随机流产生，caller不能传最终gain。

本服务writer `saturating-loyalty-byte-v1` 为：

```text
after = min(255, max(0, before + gain))
displayAfter = min(after, 100)
```

CashReward入口已限定before≤99，所以实际最大是108。纸面边界 `99 + 9 = 108`，显示100；不能再次clip到100。已有true100..255全部拒绝现金褒赏，不会在奖励、初始化、保存或加载中被改成100。writer是本软件的明确政策，不能以byte结构倒推出原writer完整clamp/overflow顺序已恢复。

## 5. AdvancePersonnelTurn：日历与季度入口

每次命令固定推进一旬：

```text
月1日 → 月11日 → 月21日 → 下月1日
12月21日 → 次年1月1日
```

turn与advancedCount各加1。只有进入1、4、7、10月的1日才执行下述普通自然忠诚流程；非季初仍成功推进日期，但不消耗自然忠诚随机数。初始日期已结算，create本身不执行一次季初流程。

没有自动工资、收入、流言、AP回满或金补充；这不是全局EndTurn，不能静默调用其他服务。超过场景advanceLimit、日历上限、成功历史上限或保存容量，整个推进失败，日期和所有逐人效果一起回滚。

## 6. 季度自然忠诚：先豁免，再短路候选

只遍历普通名单，按ID代码单元升序。先从同城君主与全部名单技能推导是否存在仁政，不接受caller提供豁免名单。

每人按以下严格顺序：

1. 同城存在仁政：直接豁免，无相性核调用、候选分支或随机draw
2. 目标定向likes君主、与君主为配偶/义兄弟，或有直接亲子边任一方向：豁免，无候选或随机draw
3. 调用既有相性核，以目标与君主原始uint8为输入，取完整receipt中的 `returnedAl`，严格 `>25` 则入候选
4. 只有相性条件未中，才检查目标义理 `<=1` 且野望 `>=3`；成立则入候选
5. 前两条候选均未中，才检查目标定向dislikes君主。图会员true映射synthetic EAX1，false映射0；非零入候选
6. 三条均未中：非候选，不消费随机

不使用signed返回或整个EAX代替AL，不先mod150。纸面例：相性0/151时教程返回signed -1、EAX4294967295、AL255；本新adapter因此命中 `AL>25`，不是把结果夹到0。相性25不由第一分支入选，26才入选。候选为OR并按上述顺序短路，不把后续条件都执行一次再合并。

符节台只改变候选后loss，不把非候选强拉入选。仁政/正面关系豁免优先于dislikes。进入候选不代表一定下降：人心掌握可能免降，两次loss也可能都为0。

教程核接到此新caller、关系图与ID顺序都是显式软件组合政策；保留原caller和教程不同来源、关系helper完整语义及stock认证仍开放的边界。

## 7. 人心掌握、两次loss与真实byte写回

本节 `source-shaped-normal-trait-loss-v1` 是采用所选公开listing的 **selected-listing 软件policy**。固定快照 `0058E759` 符节台 `+2` 行旁明确保留作者注释“【修改】符节台附加忠诚下降值”；不能将该行当成未经修改的stock常量认证。本服务按限定合同选择 `+2`，不消除这一修改提示或原版身份缺口。快照末尾“修改1”人心掌握概率及“修改2”忠诚基数/君主魅力两套MOD继续隔离，均不并入本policy，见[原静态来源边界](natural-loyalty-candidate-boundary.md#固定一手资料与两套mod隔离)。

对已入候选者依序执行：

```text
若有人心掌握：
  control = nextBounded(3)
  control >= 1 → 免降，停止本人的后续loss流程
  control == 0 → 继续

loss1 = nextBounded(3)
tokenAddition = 城市有符节台 ? 2 : 0
lordAddition = 君主义理为0且野望为4
  ? floor((4 - 目标义理) / 2)
  : 0
loss2 = nextBounded(3)

requestedLoss = loss1 + tokenAddition + lordAddition + loss2
after = max(0, before - requestedLoss)
actualLoss = before - after
```

没有人心掌握时不消费control draw。有此技巧且免降时只消费control一次；否则再消费两次loss。第二次loss在君主附加分支和普通分支分别保留标签 `natural-loss-second-lord` 与 `natural-loss-second-ordinary`，两支都恰一次。

原caller野望条件为signed `>=4`；本profile只接受正常 `0..4` 域，因此与 `===4` 等价。不能把该域内等价改称原全signed域都只判等于4。目标义理0/1/2/3/4对应君主附加2/1/1/0/0，基础两roll之和0..4，符节台另加2。

- true0仍走完整候选与应消费的draw，最后饱和到0；不得先跳过0忠诚导致后人的随机序列错位
- requestedLoss=0是已处理的合法零损失，与未入候选不同
- true>100正常扣减，如150→147仍显示100；不先夹100
- 真实值降到0只改变独立账本，不触发出走、叛乱、登用、释放、继承或任何归属变化。本服务冻结归属，因此不模拟这些原世界后果

在独立均匀抽样参考模型中，人心掌握有2/3免降，两次0..2之和为1:2:3:2:1的三角权重；这只是解释性模型，不认证原RNG，也不声称新有限确定流的每次draw相互独立。

## 8. 新共享随机流

`xorshift32-nonzero-mod35-v1` 接受seed `1..4294967295`，初始state=seed、drawCount=0。现金与自然忠诚共用此服务自己的流，任何旧训练/global RNG或普通登用FNV函数都不消费它。

每次draw依序：

```text
x = uint32(x xor (x << 13))
x = uint32(x xor (x >>> 17))
x = uint32(x xor (x << 5))
state = x
value = (state - 1) % bound
```

仅支持bound3与5；非零xorshift状态保持非零，完整非零周期 `2^32-1` 可被3和5整除，因而各桶完整周期计数平衡。这是新算法选择，不证明原EXE算法、seed来源、global消费顺序或有限序列独立性。

每次记录 `{drawIndex,label,targetId,bound,beforeState,afterState,value}`。标签只取 `cash-gain`、`human-heart-control`、`natural-loss-first`、`natural-loss-second-lord`、`natural-loss-second-ordinary`。失败命令无draw；不合资格、豁免及自然非候选无draw。preview使用克隆流，不提交任何RNG状态。

## 9. 事务、幂等与保存重算

命令envelope为 `{id,expectedRevision,command}`。新ID先做完整输入验证，再核revision与业务资格，然后在detached draft上派生。成功一次revision+1，追加接受记录；任何失败不改忠诚、金/AP、日期、turn、褒赏标记、随机状态或历史。

成功ID重试时，canonical envelope完全相同（包括最初的expectedRevision）返回原receipt及当前state，不重复扣费或draw；同ID不同内容拒绝。失败ID不被占用。preview不占ID、不变历史，相同状态/envelope的派生receipt应与execute一致。

每份成功receipt记录完整policy及digest、canonical命令、before/after版本/日期/turn、排序目标、逐人资格/豁免/候选短路trace、使用过的完整相性receipt、关系映射及证据等级、requested/actual gain或loss、true/display值、金/AP、褒赏标记、全部draw与写集；同时保留魅力/义理不建模等限制。digest只作身份索引，不替代逐字段比较。

保存包含完整canonical初态、全部policy参数、seed、所有接受envelope/receipt及最终快照。load从初态逐条通过同一execute重建，比较每条完整receipt与最终snapshot，核唯一ID、revision、每个中间预算和完整输出容量。不能信任snapshot直接写入，不能以当前常量覆盖旧policy，不能只保存ID/hash。

未知版本、缺/多字段、不可达状态、篡改receipt/RNG/日期/忠诚/历史、越额均整体拒绝。保存/加载不抽随机、不推进日期、不清褒赏标记；相同seed、初态与规范命令流按合同重现同一canonical结果。此为实现合同，未运行往返验证。

资源上限：4096条成功命令、完整canonical save及其 `SaveResult{ok:true,json:...}` 包装转义后完整JSON均最多8MiB UTF-8、scenario最多512KiB、JSON深度32/节点262144；预算包括初态、历史、所有receipt、最终快照和API结果，不只检查新追加记录。create和每次接受都预先保证结果可保存，load/replay逐步重算也经过同样预算，preview另核其结果。

这些上限相互约束，不能保证80人、360旬、4096条历史同时达到最大。自然季度每人最多control+两loss共3draw，全80人每季最多240draw；完整历史可能先触及字节、深度或节点预算。trace另最多4096次attempt，基础JSON每数组最多8192元素/每对象最多128属性；关系列表仍有更小的领域上限。这些都是有限软件服务保护，不是原作机制。

## 10. 全部注册policy

本版本只注册一套完整固定结构；不是只校验ID。调用方不能改参数后继续使用同一ID。后续替代须新ID/版本，旧save按已保存旧policy重放。

| ID | 完整关键参数/合同 |
|---|---|
| `fixed-one-city-ordinary-roster-v1` | maximumOfficers80；membershipMutable/rulerMutable/locationMutable/capturesAllowed/salaryConsequencesAllowed全false |
| `three-xun-quarter-entry-v1` | days=[1,11,21]；quarterMonths=[1,4,7,10]；initialDateAlreadySettled=true；maximumAdvances360；ap/goldRegeneration=0 |
| `explicit-local-relation-graph-v1` | targetOrder=ascii-code-unit-id-ascending；likes/dislikes有向；spouse/sworn对称；parentChild双向豁免；仁政由同城君主和名单推导 |
| `tutorial-u8-to-synthetic-candidate-v1` | coreProfile=affinity-distance-tutorial-u8-v1；inputRange=[0,255]；consumedReturn=returnedAl；strictGreaterThan25；nativeCalleeProvenanceCertified=false |
| `source-shaped-ordinary-three-or-v1` | giriMaximum1；ambitionMinimum3；thirdBranch=target-dislikes-ruler-map-to-nonzero；giri/ambition域均[0,4] |
| `source-shaped-normal-trait-loss-v1` | controlBound3/skipMinimum1；first/secondLossBound3；tokenAddition2；lordGiri0、正常域lordAmbition4、floor((4-targetGiri)/2)；prisonerBranchSupported/globalRngCertified=false |
| `synthetic-cash-uniform5to9-v1` | 每人100金/5AP；minimumGain5/outcomeCount5/draws1；不使用魅力/义理、不从样本估计并披露差异；display<100；每人每turn一次；all-or-nothing；无executor/acted、merit0/TP0 |
| `saturating-loyalty-byte-v1` | minimum0/maximum255/displayMaximum100；loyaltyZeroTriggersMembershipChange/nativeWriterCertified=false |
| `xorshift32-nonzero-mod35-v1` | seed1..4294967295；left13/unsigned-right17/left5各步uint32；(state-1)%bound；bound[3,5]；每调用1draw；session-local-shared-by-cash-and-natural-only；nativeRandomStreamEquivalent=false |
| `immutable-whole-command-ledger-v1` | successfulRevisionIncrement1；失败不改state；同ID同envelope返回原receipt与当前state，异envelope拒绝；失败ID不保留；preview不变state |
| `full-policy-seed-history-recompute-v1` | accepted4096/save8388608/scenario524288/depth32/nodes262144；不信任snapshot；逐完整receipt比较；每中间输出预算均核；unknownProfile=reject |

字段级固定对象以[公开政策文件](../../data/catalogs/personnel-loyalty-policies-v1.json)和模块常量为准；上表解释全部政策的行为，不授权任何参数覆盖。

## 11. 来源纠正与仍开放范围

1. [自然忠诚固定caller](https://github.com/sjn4048/311MemoryResearch/blob/66e167e40c3440929ec016f3872aefc3486434c1/内存资料/整理/Func-自动06-武将忠诚下降.txt)：Git blob `0ce79d11923901fdfb74f99ddf281f744b3d9880`；已归档UTF-8快照SHA256 `1ba952ffec7c91de3cacc991c854c412628f39e6f772a6a0a5368fcf6be8c36c`。主段与末尾两套MOD隔离；固定公开listing不是clean-stock证明
2. [官方PK说明书](https://cdn.akamai.steamstatic.com/steam/apps/628070/manuals/32sangokushi11wpk_manual.pdf?t=1516151052)：本次来源核对只得到搜索索引褒赏段，整份PDF因大小未能打开；没有新增页码、页图或完整文件hash证明
3. [无印Sourcenext日记#1](https://note.com/juicy_fox4269/n/nf69a4b2b4dae)明确非PK，记陈兰82→90、90→98与许攸87→96；[同作者#3](https://note.com/juicy_fox4269/n/n106990f3f5b6)搜索索引记韩浩88→93。作者反复S/L选择高值，存在选择偏差，不是PK概率样本。旧周泰85→94本次未重新定位，不作新增核实
4. [PK玩家2026-04-22观察](https://www.ptt.cc/bbs/Koei/M.1776854540.A.47B.html)经[公开镜像](https://www.pttweb.cc/bbs/Koei/M.1776854540.A.47B)核到99→108，仅支持允许越过UI100的观察边界；不是原分布、魅力/义理系数或stock内存捕获认证
5. [Wiki能力值页](https://w.atwiki.jp/sangokushi11/pages/1598.html)支持魅力影响褒赏的定性说明。[pages/79](https://w.atwiki.jp/sangokushi11/pages/79.html)当前为“各種経験値”，此次未找到忠诚/褒赏匹配，不能继续用它支持现金增量；不推断该页全部历史版本都无相关内容

旧[41非自然忠诚](41-nonnatural-loyalty-exactness.md)、[56现金增量边界](56-cash-reward-loyalty-boundary.md)与[03人事](03-personnel.md)同步版本说明；旧来源JSON与证据记录不改写。新policy不提升原奖励魅力/义理/RNG闭式证据等级。

P078及所有依赖均排除：native capture、ownership/登用后加入或改势力、return、mission、relocation、force灭亡、君主继承、俘虏及欠薪后果链。另不支持流言、宝物授予/没收、死亡/疾病、任官、被捕/释放、在途/部队、港关/跨城、native存档、战斗、全世界调度或跨服务预算同步。原43组不增不减，原作与跨版本证据债保持开放。

## 12. 静态交付边界

本批只新增限定软件服务、明确规则与静态场景。未创建或运行测试，未执行typecheck、编译、build、checker、诊断、schema验证、产品或示例；没有以示例执行替代验收。旧测试未改，历史food全套失败保持原状，历史通过数字不验证本树。
