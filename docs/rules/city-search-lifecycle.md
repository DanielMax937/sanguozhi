# 固定单城探索与发现生命周期

更新：2026-10-17。O13-A 独立有限服务，profile `standalone-city-search-v1`，scope `one-fixed-city-discovery-only`。见[API与保存协议](../engine/city-search-lifecycle.md)、[完整政策](../../data/catalogs/city-search-policy-v1.json)、[来源manifest](../sources/city-search-lifecycle.json)、[结构schema](../sources/city-search-lifecycle.schema.json)、[未运行场景](../../data/scenarios/city-search-example-v1.json)。

本服务从有限原始人才／宝物池自行过滤、选择与抽样，复用已发布的三个数值核，实际维护独立人才已知名录、宝物发现登记、城市金钱、AP、行动、功绩／政治XP／TP、日期、RNG及接受历史。调用方只能选择本城执行者，不能指定成功、候选、最终类别、roll或奖励。它不是完整原世界Search，也不自动登用或改变任何原生归属。

本批只有静态代码、规则与数据交付。没有运行产品、示例、测试、typecheck、编译、build、checker、诊断或schema校验。纸面算例、检查义务、旧版本历史结果都不是本批通过证明。

## 1. 已交付基础与证据分层

本批从PR84已发布main `6ead48d9384b2435ee4517f25856ba72e1681838`、tree `73c8ec4f636ede9132492665cfde978aed347510`出发。提交身份不代表本批新增代码经过运行验证。

PR53人才基准核 `calculateSearchTalentBaseline`、PR54宝物roll参数核 `calculateTreasureRollArgument`、PR55搜金caller投影 `calculateSearchGoldCallerProjection` 均已发布。本批调用其原API，不重建或修改旧核，不把旧文档中有日期的“候选／未发布”误读为当前交付状态。这三个核仍只是 `source-listing-reconstruction`，不是完整命令或clean-stock认证。

来源必须分成四层：

1. **固定公开listing数值核**：公开311PK研究文本、固定commit／blob／文本hash与限定指令范围。没有独立clean-stock EXE、确切补丁、Vanilla或主机版本认证；目标PC-PK1.1不等于来源二进制已鉴定
2. **listing调用点请求**：宝物／金钱／nothing的行动、功绩、XP、TP及AP扣除请求。仅证明请求形状，不证明callee writer、容量或原世界事务完成；不读取或恢复归属和人才交接实现
3. **手册／攻略观察**：20AP／人才府10AP／金0；普通探索政治XP1、发现人才但不登用XP0等。官方PDF完整获取受大小限制，命令表来自既有整理，不能宣称本批逐页重验或恢复AP helper
4. **`synthetic-replaceable-policy`**：本服务所有资格、顺序、候选排序、RNG与阈值映射、稳定二读、登记册、只发现奖励、cap、独立旬序、AP恢复及保存协议。具体定义随genesis冻结；不能用原作证据标签包裹这些设计

公开dispatcher有“人才→城市事件→宝物→金钱／nothing”的短路骨架。本服务明确省略城市事件，使用新顺序，既不把省略解释成原作无事件，也不把遗迹／庙放成第四种城市Search奖品。

## 2. A1：封闭支持域

场景固定一个active force、一座kind=city的城市及一个军团；城市、军团的force ID必须与active force一致。城市与军团身份、人员驻城和归属在整个服务内不变。场景包含完整政策与来源身份，不接任意callback或只凭digest选择政策。

- 日期：year 1..9999、month 1..12、day仅1／11／21；turn为非负安全整数。advanceLimit为1..360，创建时检查完整日期horizon及turn安全边界
- 城市：gold与goldCapacity均0..1,000,000,000，gold≤capacity；regionId为signed32；talentOfficeComplete必填boolean。capacity是供应的软件边界，不是原生城市容量认证
- 军团AP 0..255；势力TP 0..10000。TP上限可参考已有规则，但本服务具体饱和writer是新政策
- 执行者至多256人，唯一ID。必须提供id、forceId、cityId、ordinary、available、politicsU8、charmU8、birthRegionI32、eyeSkillEaxU32、merit、politicsXp、actedTurn。功绩／XP均0..1e9；actedTurn为null或0..当前turn。能力是已解析的稳定输入；XP累积不重新计算政治／魅力，不接成长、年龄、伤病或训练
- 原始人才池至多1024项，唯一ID且不得与actor ID重叠；每项有cityId、lifeStatus（living／dead）、serviceStatus（free／serving／prisoner）、availableFromTurn、discovered。genesis原始discovered标记保持不变，运行时已发现与否由snapshot.talentRegistry的ID成员关系派生；serviceStatus不因发现变成serving，不写势力、忠诚或所属
- 原始宝物池至多128项，按实例ID去重，非名称去重；每项有searchCityId、kind（ordinary／imperial-seal／bronze-pheasant）、holderRef（null或合法ID）、availableFromTurn、valueU8、discovered。holderRef只是固定资格快照；运行时发现状态由snapshot.treasureRegistry的ID成员关系派生，genesis原始记录与holderRef保持不变，也不授予、出售或装备物品
- availableFromTurn在0..horizonEnd。外城、未出现、已知、已有主、死亡或非在野项可以作为原始记录存在，不能要求caller先删掉不合格项
- 初始discovered=true仅派生 `origin=supplied-initial` 登记，command／turn／actor等发现元数据为null；不伪造发现历史，不自动赠送可处分财产。新发现用 `origin=search`，记录真实command、turn、actor及日期
- ID为1..64个ASCII字符，首字符字母或数字，其余仅 `[A-Za-z0-9_.:-]`；排序按ASCII码元升序，不用localeCompare

对象入口只支持非Proxy的plain／null-prototype own-data对象、密集数组及严格整数。拒绝额外字段、getter／setter、继承字段、symbol、自定义原型、稀疏数组、重复ID、NaN／Infinity、不安全整数及负零。整个候选池与日期／资源都先校验，不能因前一分支成功而跳过后面的坏记录；非Proxy支持域内拒绝accessor而不读取其getter；不接受policy callback。反射检查可能触发Proxy traps，敌意Proxy及污染运行时不受支持，不能声称已检测并拒绝所有Proxy或保证任意JS对象无副作用。load接收JSON字符串，经独立有界解析后重建，不能将此字符串入口边界泛化为全部对象入口。JSON中的重复decoded key也拒绝，包括不同转义拼写解码为同一key的情况。

## 3. A2：命令资格与费用

envelope只有 `{id, expectedRevision, command}`。命令只有：

- `Search {cityId, actorId}`
- `AdvanceSearchTurn`

Search没有候选ID、概率、roll、最终类别、cap覆盖、success或奖励参数。

1. 检查完整状态及其从genesis重建的证明；相同ID的完全相同envelope先返回原receipt，再考虑stale revision。相同ID任一字段不同为冲突
2. 新Search必须指定固定城市；actor必须存在、ordinary=true、同城同势力、available=true且actedTurn不等于当前turn。只选一人；不可用身份是拒绝，不触发调度或迁移
3. AP费用为有完整人才府10、否则20；金费用0。AP不足整笔拒绝，不抽随机、不记行动。每人每旬最多一次；没有每城每旬一次限制，第二个未行动actor可继续探索
4. 在分离候选状态中计算全部差额与返回预算。只有全部成功后才一次接受AP、行动、发现／金钱／奖励、RNG、revision和receipt。合法nothing仍付AP并行动；资格、核、序列化或后期预算失败都不提交
5. 本profile即时结算，无旅行job、自动登用、native任务或return。此设计不证明原命令所有跨据点／时间细节为零

不同ID重试也受真实actedTurn、发现状态等约束，不能只靠command ID去重阻止重复奖励。

## 4. A3：原始候选过滤与选择

`search-local-ordinary-filter-v1` 的人才资格是living、free、cityId等于本城、availableFromTurn≤当前turn且未发现，全部条件同时成立。合格ID排序后由服务自行得到count。人才核的同州判断比较**actor出生州与当前城市州**，不是目标人才出生州。

宝物资格是kind=ordinary、holderRef=null、searchCityId等于本城、已到出现turn且未发现。supplied kind为imperial-seal或bronze-pheasant的实例始终排除。本版importCatalog固定为none-supplied-instance-facts-only，没有旧宝物目录导入器、名称字段、名称映射或自动ordinary转换；只校验kind枚举并按所供事实过滤，不认证外部事实真伪，也不能识别调用方把真实特殊物谎报为ordinary。未来若另建导入器，须保留special kind，不能把特殊物默认当ordinary。原始候选ID名单、逐项排除理由和排序后的合格ID写入收据，完整原始事实只保留在genesis。

这些资格是新有限政策，不等于未知原helper `005D1720`、`004CDFB0`、`005D51D0` 的恢复。既有43条宝物攻略资料针对“英雄集结、女流之战”等特定语境且含随机地点，不是完整211年原始表或全部剧本统一表。本服务不猜配表、不修改资料、不将名称相同的多个实例合并。

## 5. A4：新RNG、类别顺序与旧核边界

`search-lcg32-multiply-high-v1` 接受全部uint32 seed，包括0。每次先以精确整数计算：

```text
state = (1664525 * state + 1013904223) mod 2^32
u = state
draw(n) = floor(u * n / 2^32)
```

draw在0..n−1；n不整除2^32时不同结果的原像数至多相差1，所以这不是严格无偏映射。算法、seed、流、取样顺序与阈值都是新政策，不是原作RNG。禁止Math.random、时间seed或浮点近似替代精确整数。收据保留每步u、bound、结果以及前后state和drawCount；不预抽未消费分支的随机。

`search-talent-treasure-gold-v1` 按以下顺序短路：

1. **人才**：调用旧人才核并完整保留returnedEax=b。count=0先返回0，即使eyeSkillEax=256也不改变此结果；count>0且完整uint32眼力非零返回100。其他情况为 `floor((3*min(count,5)+7)*politicsAL*(同州11/异州10)/300)`，最高205不clip。b=0直接转宝物，不抽人才selector或roll。b>0时，单候选直接选，多个候选draw(n)；随后始终draw(100)，包含b≥100和眼力路径。r<b则发现人才并结束。205成为必成是新百分阈值映射，不是更改核或恢复最终helper
2. **宝物**：人才未发现才进入。空池不抽数；单候选直接选，否则draw(n)。对所选value调用旧核，保留 `numerator=61-value`、`quotient=trunc(numerator/20)`、`argument=max(1,quotient)`；向零除法并规范化负零，value62的quotient为0。随后draw(100)，r<argument则发现。参数1／2／3作为百分阈值是新设计，不是已证的原概率
3. **金钱**：前两类未发现才必抽draw(charmU8+1)，包括charm=0；0..charm结果作为rngEax送旧金钱核。包括上界是本政策，不恢复原 `00472150` 的端点、分布或seed
4. **nothing**：搜金核未进入gold handler则无金入账。城市事件、遗迹与庙均不执行

单次Search最多5次转换：人才selector／roll、宝物selector／roll、金钱。没有拒绝采样或不定长循环。相同ID集合的原始数组排列不改变结果；候选内容变化必须体现在genesis。

## 6. A5：稳定二读与真实金钱账本

`search-stable-city-gold-read-v1` 在原子计算内固定余额G和cap C，0≤G≤C≤1e9，因此G+80不会进入signed32溢出域。先按旧核定义取low16，再令proposed=min(low16,80)。

- firstGold=G、firstCapacity=C
- 只有G+proposed>C才构造 `secondRead:{gold:G, capacity:C}`，作为本稳定模型中的第二次逻辑观测；未进入该分支时字段必须不存在
- 保留旧核条件二次getter、signed32比较与ADD32的合同；不声称原生getter稳定，不更改旧核变动二读、回绕或可得到500等全U32域行为
- gold-handler在本有限域必须产出30..80且不超过剩余容量，城市gold精确增加amount，不再clip；若不合该域则内部不一致整笔拒绝
- nothing实际gold delta=0。核amount为1..29或只剩20容量都不能发小额、补最低30或偷偷记为入账。收据分开记录gold.kernel.amountSigned、gold.kernel.proposedAmount、gold.capacityDiscarded、gold.belowMinimumDiscarded及gold.actualDelta

例如剩余容量20且本次proposed>20时，稳定二读给amount20，仍是nothing、实际入账0。这只是按新稳定域连接旧核的纸面推导，不是运行结果。旧核goldHandlerArgument继续表示caller参数，不能改名为已认证的native实际奖励。

## 7. A6：每个合法终局的真实差额

所有合法Search均扣10／20AP、写actor.actedTurn=currentTurn、revision+1，并只前进实际已消费的RNG。

| 终局 | 独立状态变化 | 功绩请求 | 政治XP请求 | TP请求 |
|---|---|---:|---:|---:|
| talent-found | 人才名录增加ID与真实发现元数据，由成员关系派生当前discovered=true；genesis及serviceStatus不变 | 0 | 0 | 0 |
| treasure-found | 宝物登记增加该实例，由成员关系派生当前discovered=true；genesis及holderRef不变 | 50 | 1 | 2 |
| gold-found | city.gold增加旧核允许的amount | 50 | 1 | 2 |
| nothing | 不改候选／名录／城市金钱 | 10 | 1 | 0 |

人才用 `discovery-only-no-hire-reward-v1`。政治XP0有攻略“不登用”观察；功绩0与TP0是保守的新政策，不是原作已证明无奖励。此分支不是当场登用失败，不能移用100功绩／政治XP3，也不执行登用或舌战交接。

其他三行是公开listing调用点请求：宝物005D3F01..005D3F70；金钱005D3F92..005D3FCA及005D4103..005D4147；nothing005D427B..005D42C3。nothing尾段没有TP增加请求。005D42B8文字目标多写一位0的资料缺陷保留，不建立新的opcode认证。

实际writer使用新 `search-ledger-saturating-v1`：功绩／XP cap1e9、TP cap10000，actual=min(requested,cap−before)，discarded=requested−actual。即使cap挡住全部请求也记录三值。XP不自动提升能力；1e9不是原生XP cap。金钱另遵守前节，不能套用奖励饱和writer而发出不足30的小额。

## 8. A7：有限独立旬序

`AdvanceSearchTurn` 前进一旬：1→11→21→下月1，12月21→下一年1月1；turn和advancedCount增加1，不抽RNG。注册的 `search-service-ap-recovery20-v1` 请求AP+20、cap255；本版仅注册这一个AP20版本，不提供零恢复或任意恢复数。AP请求、实际与弃置分开记录。

新旬通过actedTurn比较恢复actor机会，不抹掉原行动标记。不发工资、收入，不自然掉忠，不建设、维修、巡查、成长或推进其他服务。本服务不修改旧GameState、Train、EndTurn或v2存档。达到advanceLimit拒绝继续推进；没有隐藏循环或自动延长horizon。

## 9. 原子性、幂等、完整重建与返回预算

create／preview／execute／save／load／replay使用同一确定性规则。preview计算同一receipt和投影快照，不提交状态、预留ID或消耗真实RNG；同状态重复preview相同，之后execute与其一致。完全相同envelope的重试返回原receipt和当前状态，不重复收费；同ID不同内容拒绝，且原receipt比较早于stale revision拒绝。

保存包含完整genesis scenario、初始snapshot、完整固定政策／来源身份、按接受顺序的每个envelope与receipt，以及最终snapshot。load从完整genesis重建，逐条执行并比较完整receipt、最终state、RNG、候选发现状态与登记册；不能仅信最终snapshot、hash、部分resume对象或被调用者给出的receipt。replay从scenario派生结果；expectedOutcome／expectedFinalSnapshot为null只关闭对应断言，绝不替代实际计算。

统一硬边界：最多4096条接受历史；完整JSON UTF-8最多16MiB；对象深度最多24。限制覆盖输入、保存文本、状态、完整各类返回及整个转义后的 `{ok:true,json}` SaveResult，不能只量内层JSON。每个新接受状态还必须预留**所有旧幂等receipt加当前state的完整返回容量**；不能只检查最新receipt，也不能为了容纳新命令截断旧历史。load／replay在每个中间状态重做这些预算。较早拒绝新命令是允许的，但原状态、资源、ID与旧重试能力保持不变。

性能边界仅由静态结构给出：execute／preview／save／load等重建完整历史，逐step预算并扫描历史receipt容量，随历史增长至少呈二次成本；4096仅是硬上限，不承诺延迟、效率或实测表现。

每次新接受command恰有一条历史且revision+1；duplicate无新历史；rejected不增revision、不耗RNG、不改AP、行动、余额、名录或奖励。任何后期预算／schema／核拒绝也全部回滚。receipt保留候选ID／排除理由／核收据／差额，不逐条复制整个genesis。与给定genesis／政策不一致的seed、候选、cap、排序、被选项、receipt或快照变化由完整重建比对拒绝。这是自洽性检查，不是密码学真实性认证；若协调改写整个genesis与相容历史，得到的是另一份所供场景，不能声称可检测任意伪造。

<a id="10-o13-b明确尚未实现的独立有限后续"></a>

## 10. O13-B：独立相邻发现profile的当前路由

O13-A的命令、schema和场景只接受固定城市Search；O13-B现已补为[独立静态相邻遗迹／庙profile](adjacent-site-discovery-lifecycle.md)，完整API见[相邻发现工程文档](../engine/adjacent-site-discovery-lifecycle.md)。B自行消费有限到达、检查相邻及部队门槛、抽取发现、冻结月份／庙offer，并实际写入XP／素质／适性／技能；A不将其接入城市Search类别链或共享RNG／账本。

A交付时的sourceBoundary、source manifest及其B未实现标记保留为当时的冻结身份；它们描述A自身交付时点的范围，不代表当前仓库没有B，也不因B存在而升级A的原作证据。旧锚点保留仅用于历史导航。B新政策独立保存和重建，未运行产品、示例、测试、typecheck、编译、build、checker、诊断或schema校验。

遗迹／庙全部原坐标、初始放置抽样、原发现概率、原技能池和native writer继续E；B不是原地图移动、全局事件系统或原世界集成。完整月份表、门槛、cap和技能抽样详见新B规则，不再把它列为当前未交付的有限功能。

## 11. 未关闭项与历史计数

E继续保留：三个核的stock／EXE／精确patch与跨版本身份；原人才候选／选择／最终概率及政治眼力getter；宝物候选／选择／原概率；金钱RNG端点／分布／seed、getter稳定性与容量；共享随机顺序；Search原资格／AP helper、真实writer／cap、只发现不登用完整奖励；城市事件支路；遗迹／庙原配置与writer；原地图／剧本初始化及跨服务调度。

城市普通安全事件另归O14有限执行器；余额／行动／时间／移动／事件跨服务一致性另归O15。各自维护独立账本不证明整体游戏已集成。

本服务不实现P078及其依赖、native ownership或人员势力迁移、capture、force灭亡、ruler transfer／继承、native return／mission／相连finalizers、当场登用或舌战后原生交接、宝物native归属writer。旧核与旧验证历史保持原状。独立宝物发现登记并不自动成为native归属事务。

原43证据主题不减，45条历史快照不重新编号、不新增分母。O13-A只覆盖ordinal16的Search AP子项与ordinal30的探索有限服务子项；ordinal30外交仍归O08，ordinal37地图、40原剧本、41–43静态corpus证据债均保留，ordinal24其他TP事件不由Search关闭。历史corpus的executionEnabled=false不改。A与B的有限静态软件覆盖不等于完整原探索；不得称全探索原作等价或原43清零。

## 12. 静态检查义务（均未执行）

应覆盖count0／眼力256／基准205不clip；所有人才与宝物排除理由和原始顺序反转；特殊宝物与多实例；value0/1/2/21/22/41/42/61/62/81/255；金钱low16／80／29与30／容量20与30；只在需要时二读；nothing仍收费；每分支奖励与饱和弃置；人才府9/10及普通19/20AP；第二actor同旬可用；seed0及最大U32、唯一候选不抽selector、每次最多5draw；preview、重复ID／冲突／stale revision；严格DTO／重复decoded key；完整genesis篡改、逐receipt对比、全部旧幂等返回预算及失败原子性。旧三核全U32特殊观测仍由各原API保留，不强塞入本普通城市域。这份清单是检查设计，不是任何已执行验证。
