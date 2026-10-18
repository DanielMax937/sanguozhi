# 一次内政评定：single-council-domestic-v1

日期：2026-10-18。仅静态实现，未运行产品、示例、测试、typecheck、编译、build、runtime、checker、诊断或 schema validator。

## 1. 范围与证据

本 profile 是一个能完成或中止一次的有限评定 episode。固定一城、一势力、一军团标签、完整驻城名单和同一旬，实际复用普通 city-command 公开服务执行 Patrol、Recruit、Produce 装备1–4。其他19类具体提案只保留来源池元数据；件数兵器及舰船、事件、灾害、战斗、出阵、建设、人员任命和时间推进均不提供。

官方手册已知评定本身0金/0AP、最多6名参加者、君主在据点；MSG资料已知两阶段、赞同与多种采决、22类静态池；同期攻略记载完成评定+10TP。君主角色、完整人员过滤、chooser、采纳顺序、重复提案去重、普通命令分派和全否/中止奖励资格都是本实现显式新政策，未认证 native 函数或原版完整调用链。证据与固定字节见 [source manifest](../sources/single-council-lifecycle.json) 与既有 [22类评定池](34-council-proposal-pool.md)。没有再次成功获取原始外站内容；引用是固定仓库中的既有来源链。

原始实现及证据读取基线为 PR86 main a04ee326fdaa68e930681430352f4d98fee5209e，tree df4e2be515e2434e4e64476517c8e58f0d3afaf0。city-command 源码 blob f07b0762e045dfb77caeb8e46c06e7cee8bd255f 与 PR85 研究基线相同。既有接口已具备费用、核计算、资源writer、XP/功绩、人物acted、设施used、preview和完整genesis保存；本实现不重写这些叶，也不重复计作新能力。旧43主题、45快照中的原证据缺口不因此降低；原版事件与跨服务一致性尚未集成。

公共入口集成基线为 PR88 main 8063d39731a42af87646168d4b36b92bd9d3ed3d，tree 5e555fcda99f97e71e50c9c8565810dca50915be。普通 city-command 源码仍为上述相同 blob；来源manifest、完整policy、示例与schema保留原固定证据身份，不因公共入口集成而升级原作证据。七个API、固定policy与14个类型现可从 packages/engine/src/index.ts 导入。

## 2. 完整初始数据与真实对齐关系

每个 scenario 必须携带完整 CityScenarioV1，包括所有政策、全部十种兵装库存/目录条目、现有金/AP/治安/兵力/士气、人员属性/技能/全部XP/功绩/actedTurn、设施usedTurn、各种原始事实。child只有普通服务原字段，不新增TP、lord、city.owner、corps.forceId或officer.corpsId。

wrapper另外提供 context：completeCityRoster=true、membershipFrozen=true、cityId、forceId、corpsId、lordOfficerId、完整 roster[{officerId,role}]。这些是明确 supplied 的角色/成员关系。cityId 必须等于 child.city.id；forceId 等于 child.activeForceId；corpsId 等于 child.corps.id。名单与 child.officers 一一相等、无重复，恰有一名 lord 且ID等于 lordOfficerId；所有人物的既有 cityId/forceId 都必须匹配固定城/势力。所有设施必须在该城。不得把不存在的 child ownership/军团成员关系当作已交叉认证；列表完整性是输入者对本有限场景的明确声明，不是从原游戏世界自动证明的。

人数2–256，君主之外至少一人。开始时选择1–6名不同下属；排除君主。君主与参与者都必须 available、未在当前turn行动、reservationJobId=null，且角色/城/势力匹配。这些额外过滤是 complete-fixed-single-city-supplied-roles-v1。未参与人物仍完整保存，其余额/标记不被清空。wrapper envelope/episode/参与人物 ID 限1–64 ASCII字符；child其他实体保留普通服务1–128字符约束。

initialTechniquePoints为0–10000，seed为1–4294967295。完整 wrapper policy 和 sources 必须逐字段等于注册版本，不能仅给ID或hash。初始phase=unopened，revision=0。运行中无政策、场景或角色替换命令。

## 3. 两阶段、赞同与采决

命令 envelope 固定 {id,expectedRevision,command}；caller只提交参与人和采决，不能提交提案payload、最终成功、资源delta、PRNG结果或奖励。

1. OpenCouncil{participantIds}：冻结输入参与顺序；第一人生成 domestic 新方针，其他人生成 agree 指向它。phase=policy，不抽签、不扣评定费、不标参加者行动
2. DecidePolicy{decision}：abort终止；reject-all转ready且无具体案；采纳任一方针/赞同则生成每人具体speech，phase=concrete
3. DecideConcrete{decision}：只引用引擎已生成speech ID；agree解析到原proposal，不追加执行人。选择后phase=ready。domestic已采纳时，可在concrete或ready反复改选，直到预算或终态；不执行普通命令、不扣费、不加奖励
4. CompleteCouncil{}：仅ready可用，执行最终采纳集合全部普通命令，再结算唯一完成奖，成功后phase=completed
5. AbortCouncil{}：任意非终态可用，phase=aborted，清空待执行集合，不发完成奖。所有选择阶段均未执行child，所以中止保留原child

decision形状为 accept-one{speechId}、accept-subset{speechIds}、accept-all、reject-all、abort，实际对象均还含kind。subset非空、ID唯一；只能引用当前阶段已生成且非abort的speech。accept-all忽略abort speech；无可用speech时等价采纳空集合。speech IDs按阶段和冻结参与序号生成；concrete:1不是caller可携带自拟command的容器。

方针全否直接ready；具体案全否/全无合法候选也可正常Complete。normal-finish-including-reject-all-v1均请求+10；abort请求0。以上精确资格尚无原函数证明。两个终态不允许新ID命令，含再次完成、中止、重开、下一旬；旧已接受envelope的相同ID幂等重试仍可返回原receipt。

## 4. 内部候选、chooser与去重

对每名参与者，从同一个未执行child现态枚举：单人Patrol、每个兵舍的单人Recruit、每个锻冶/马厩对应已解锁1–4兵装的单人Produce。按(type代码单元、facilityId代码单元、equipmentType数值)排序，逐项调用公开 previewCityCommand 硬门；complete/used/acted/资源/容量/零产出/技能和核约束全部由child真实裁决。保留每项command和完整preview结果，失败reason不被改写为成功。

只在合法候选中用固定PRNG+拒绝映射选择一次。没有合法项则该人生成 abort/no-legal-speech，不抽word。这是speech状态，不自动终止整个episode。候选单独合法不保证联合可执行：多个案可能争用同一设施、AP、金或容量，用户可在Complete失败后改选。

相同(type,cityId,facilityId或null,equipmentType或null)映射为agree，保留第一提案人的proposal。提案人不参与去重键，agree不成为多执行人，也不另发普通命令奖励。即使随机选中的候选后来转agree，该次选择的raw仍真实消耗并记账。最终采纳集合按原新提案人的冻结参与顺序排列，不按caller的speechIds数组顺序执行。

### RNG政策与研究勘误

xorshift32-nonzero-domain-rejection-v1：依次 x^=x<<13、x^=x>>>17、x^=x<<5，每步转U32。非零seed使raw位于1..4294967295。令sample=raw-1，M=4294967295，limit=floor(M/B)*B；sample>=limit拒绝重抽，否则value=sample%B。B限1..1000000，B=1仍消耗raw；每个拒绝raw计入4096总额，绝无有偏fallback。

receipt逐draw记录label、bound、全部raw/sample/limit/rejected、value、cursorBefore/After、seedBefore/After、policyId。初稿研究把非零xorshift raw当成完整2^32域，本实现已改用非零域映射。这一有限接受域的余数等原像性质，不能证明确定序列在有限预算下整体chooser严格无偏、独立或密码学安全；strictlyUnbiased=false、nativeEquivalent=false。不是原PRNG，也不与别的profile共享seed/cursor。

## 5. 原子执行与普通资源

Complete先在私有候选child链按冻结提案顺序执行全部选中案。child envelope ID由episode+proposal决定，expectedRevision取这条候选链当时真实child revision。每次只用公开 executeCityCommand，保留完整普通receipt；不得重建child清掉前一个案的acted/used，也不得改child genesis或snapshot。

- Patrol：普通100金/20AP，真实治安核+writer、人物XP/功绩和城巡查标记
- Recruit：普通300金/20AP，真实征兵数量/治安参数核、士气政策、人物奖励和兵舍标记
- Produce1–4：完整supplied catalog与特产price核、普通quantity核、原productionAp政策、库存writer、人物奖励及锻冶/马厩标记。默认20AP，可继承已注册25AP替代政策；不能统一写为免费

这些来源/政策边界完整继承 [普通服务](city-command-lifecycle.md)。数量兵装是即时命令，不创建生产job；本模块无AdvanceCityTurn及任何件数生产入口。

任何后案失败，或最终receipt/state/save/escaped SaveResult/历史返回预算失败，整条Complete返回failure且effects=[]，不交出候选state。不提交前案资源/行动标记、TP、RNG、revision或history。公开输入只读；原state仍可换选择再试。同一个Complete ID失败未进入历史，允许在正确revision重新提交。

## 6. 完成奖仅是projection

普通 city-command 没有TP字段，presentation policy明确not-modeled。wrapper只维护 councilCompletionTechniquePoints：初值initialTechniquePoints，正常完成唯一一次 requested=10，after=min(10000,before+10)，actualDelta=after-before，discarded=requested-actualDelta；未完成或abort请求0。每笔完成奖收据都有before/requested/after/actualDelta/discarded/policyId。

ordinaryProposalTp='not-modeled'不是0；tpScope='council-completion-only'。没有global finalTP、没有宣称所有普通案奖励已结算、没有把完成奖塞进child。最终视图的普通资源来自childState，完成奖投影来自wrapper；它不能作为无损全局force TP继续游戏。child save只是普通案效果的证据，拿去另建服务不等于继续本评定账本。

评定自己的费用另以0请求收据记录，明确不抵消child执行真实费用。child完整receipt保持其requested/returned/actualDelta/cap/discarded和源核input/output，wrapper不会用总差额替代原写入证据。

## 7. 幂等、持久化和预算

每次公开输入先脱离非Proxy、普通或null原型、own-data JSON DTO，再验证闭合形状。拒绝accessor、symbol、循环、稀疏/额外数组属性、异常原型、undefined、非安全整数、非有限数、负零；primitive scenario/envelope具体整数域由wrapper或原child验证。继承child的已派生numeric observations原样保留，并要求安全整数和完整重算相同。Proxy反射可执行trap，故Proxy不属于承诺支持域；没有跨realm/污染运行时防护声明。

相同ID+整个envelope一致，先返旧receipt duplicate=true，再考虑旧revision/终态；相同ID不同内容拒绝。新ID需revision一致。每条新接受命令只增加1 revision。所有旧receipt不丢弃。

save包含完整genesis、source绑定、双层policy/catalog、初seed、全部接受envelope和receipt、全部speech/审计候选/draw、child state和公开child SaveResult。load从genesis重新create child，重枚举每个preview、重抽每个raw、重建speech、重执行child命令和唯一TP projection，逐条比较完整receipt，再比较整个state和child SaveResult。任何被改动的派生结果不能靠修改checksum被接受；但整份一致历史可被另写，因此不是签名、防伪或来源真实性证明。

预算：接受命令≤256、raw≤4096、JSON深度≤32、节点≤250000、UTF-8≤16MiB、trace尝试≤4096。所有边界是联合约束，单项最大值不保证同时可达。逐步覆盖完整state、全部历史、child SaveResult、保存对象、转义后的外层SaveResult、execute/preview实际结果；还为每个旧receipt在当前state上的重复返回分别保留同样预算，避免小新收据挤坏大旧收据。一个新接受命令同时检查execute与preview两种实际包裹大小。preview在独立候选重算，不消耗正式RNG。预算失败与执行失败均无提交。

JSON文本读取拒绝重复decoded key（含escape别名），重新排序对象key不改变语义。trace expected仅用于比较，null代表不设预期，不能驱动执行；遇到预期不符或聚合结果过大，保留此前trace state。完整重算、旧receipt逐个返回预算与反复保存可能达到很高多项式开销；这些上限不是吞吐量/时延承诺。

## 8. 静态示例与排除

[示例trace](../../data/scenarios/single-council-example-v1.json)完整保留原12人city示例，声明o12为君主，o1–o6参会，seed20261018、完成奖投影初值9995。它依次Open→方针全采→选择concrete:1→Complete→同ID重试→新ID重复完成。所有expected为null，未计算或记录一次运行结果；预期语义是首次Complete封顶投影、同ID不重发、新ID终态拒绝，具体普通案由引擎自身选择。

未运行任何产品、示例、测试、typecheck、编译、build、runtime、诊断、checker或schema验证。本profile不实现native ownership、俘虏、死亡、势力灭亡、继承及mission/return finalizers；不是通用世界引擎。原版事件与跨服务一致性尚未集成。
