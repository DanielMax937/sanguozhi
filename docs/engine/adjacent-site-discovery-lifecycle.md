# 相邻遗迹／庙发现工程接口 v1

静态交付更新：2026-10-18 UTC；来源研究观察：2026-10-17 UTC。

profile：`standalone-adjacent-site-discovery-v1`；scope：`one-fixed-force-frozen-arrival-events`。实现位于[adjacent-site-discovery-lifecycle.ts](../../packages/engine/src/adjacent-site-discovery-lifecycle.ts)，通过engine index导出。见[完整B1–B5规则](../rules/adjacent-site-discovery-lifecycle.md)、[policy](../../data/catalogs/adjacent-site-discovery-policy-v1.json)、[来源manifest](../sources/adjacent-site-discovery-lifecycle.json)、[JSON interchange schema](../sources/adjacent-site-discovery-lifecycle.schema.json)和[未运行示例](../../data/scenarios/adjacent-site-discovery-example-v1.json)。

这是内部过滤、门槛、抽样、发现与真实XP／素质／适性／技能账本，不接受caller最终结果。只处理完整预供到达事实；没有原世界移动、寻路、人员归属、native技能表或全局EndTurn适配器。

本批仅静态撰写；产品、示例、测试、typecheck、编译、build、checker、诊断和schema校验均未执行。API形状、纸面行为与示例目标不构成运行收据。

## 1. 六个API与结果

所有入口参数类型为unknown，输出为深冻结readonly DTO，不原地修改调用方对象。成功执行后由调用方显式持有返回state，preview不返回可替代当前state的提交结果。

| API | 参数 | 返回类型 |
|---|---|---|
| `createAdjacentSiteDiscoveryStateV1` | scenario | `AdjacentSiteDiscoveryStateResultV1` |
| `previewAdjacentSiteDiscoveryV1` | state, envelope | `AdjacentSiteDiscoveryPreviewResultV1` |
| `executeAdjacentSiteDiscoveryV1` | state, envelope | `AdjacentSiteDiscoveryCommandResultV1` |
| `saveAdjacentSiteDiscoveryV1` | state | `AdjacentSiteDiscoverySaveResultV1` |
| `loadAdjacentSiteDiscoveryV1` | JSON字符串 | `AdjacentSiteDiscoveryStateResultV1` |
| `replayAdjacentSiteDiscoveryV1` | trace | `AdjacentSiteDiscoveryReplayResultV1` |

成功返回：

```text
create/load: {ok:true, state}
execute:     {ok:true, committed, duplicate, state, receipt}
preview:     {ok:true, committed:false, duplicate, receipt, projectedSnapshot}
save:        {ok:true, json}
replay:      {ok:true, state, outcomes}
```

失败共有：

```text
{ok:false, committed:false, reason,
 revision:integer|null, cursor:integer|null,
 commandId:id|null, index:integer|null}
```

失败不附state或receipt；原输入state仍可使用。index在可定位时指向历史／trace条目。常见reason包括pending-reward、arrival-limit、no-pending-reward、pending-reward-mismatch、unknown-target、skill-not-offered、stale-revision、duplicate-command-id-conflict、history-limit、policy-mismatch、source-boundary-mismatch、serialization-budget、duplicate-json-key、noncanonical-genesis、receipt-mismatch、snapshot-mismatch。合法无发现到达不是Failure。

同时导出`ADJACENT_SITE_DISCOVERY_POLICY_REGISTRY_V1`、`ADJACENT_SITE_DISCOVERY_DEFAULT_POLICY_V1`、`ADJACENT_SITE_DISCOVERY_EVIDENCE_V1`和`ADJACENT_SITE_DISCOVERY_UNSUPPORTED_V1`。registry只有完整`adjacent-site-discovery-policy-v1`。readonly类型以前缀AdjacentSiteDiscovery和后缀V1导出Scenario、State、Snapshot、Command、Envelope、Policy、GuideCatalog、Record、Pending、Draw、Receipt、Failure、StateResult、CommandResult、PreviewResult、SaveResult、Trace、ReplayResult。

没有inspect API、追加到达、推进旬序、取消pending、原生存档或B→A账本合并接口。旧GameState／Train／EndTurn／v2存档及三个Search数值核不由此改变。

## 2. Scenario：完整且封闭的genesis输入

以下字段全部必填，无额外字段：

```text
{
  schemaVersion:1,
  profile:"standalone-adjacent-site-discovery-v1",
  scope:"one-fixed-force-frozen-arrival-events",
  date:{year,month,day},
  activeForceId,
  actors:[Actor], units:[Unit], sites:[Site],
  groundCells:[{q,r}], arrivals:[Arrival],
  guideCatalog:GuideCatalog,
  rng:{kind:"adjacent-lcg32-multiply-high-v1",seed},
  policy:<完整注册政策对象>
}
```

date为year1..9999、month1..12、day∈{1,11,21}。seed为完整uint32，0合法。policy全部字段必须等于注册定义，不能只给id／digest或callback。完整政策中的sourceIdentity分类与guideCatalog自己的sourceIdentity随genesis冻结；引用来源字符串本身不证明真实性。

普通实体ID长1..64，首字符ASCII字母／数字，余字符仅`[A-Za-z0-9_.:-]`。技能ID另外必须以`guide:`开头，冒号后的首字符为字母／数字；总长度仍≤64。坐标q/r为±1,000,000内整数。所有数值拒绝负零或不安全整数。

### Actor

```text
{
  id, forceId, ordinary:true, merit, charmXp,
  talents:{leadership,strength,intelligence,politics,charm},
  aptitudes:{spear,halberd,crossbow,cavalry,siege,navy},
  skillRef:guideSkillId|null
}
```

actors最多256项且ID唯一；所有forceId等于activeForceId，ordinary必须为true。merit、charmXp为0..1e9；talents五项为0..255，aptitudes六项为0..3，分别编码C／B／A／S。skillRef必须为null或完整目录中存在的ID。merit与所属只在genesis中保存并固定；运行时只改变charmXp、talents、aptitudes和skillRef。

### Unit

```text
{id, forceId, memberIds:[id], leaderId, resolvedCharmU8, troops, position:{q,r}}
```

units为1..16项、ID唯一；每队1..3人，成员在actors中，leaderId属于该队，forceId等于activeForceId。一名武将不能跨队重复。resolvedCharmU8为0..255，troops为1..1e6。成员名单、leader、部队能力和兵力固定，只有观察位置可随到达变化。地面集合必须包含初始位置。

### Site与初始来源

```text
{
  id, kind:"ruin"|"temple", position:{q,r}, discovered, resolved,
  initialSource:null|{sourceId,templeOrdinal:integer|null}
}
```

sites为0..64项；ID及位置各唯一。false／false须initialSource=null；true／true须提供initialSource。其他状态组合拒绝，创建时pending一定为null。

所有初始来源sourceId唯一。初始已发现遗迹的templeOrdinal必须null；初始已发现庙必须是1..N的逐项唯一连续序号，无空洞或重复，不能只给计数。初态来源记录不发XP或奖励；原始发现日期、command、unit、arrival均不编造。

### Ground与Arrival

```text
Arrival = {arrivalId,unitId,from:{q,r},to:{q,r},date:{year,month,day}}
```

groundCells最多4096项、无重复，site坐标不能在其中。arrival最多360条、arrivalId唯一，引用存在的unit，from等于其前序位置，from／to均在groundCells中，距离max(|dq|,|dr|,|dq+dr|)=1。全局时间不早于场景初日且不倒退，每队每旬最多一条。可以没有arrival，此时没有pending就是已到有限序列末尾。

创建时检查完整未来序列，包括尚未消费记录。到达是原始观察事实，不证明原生移动合法性、移动力、粮耗或行动点已结算。arrival列表顺序保留，其他实体集合按ASCII ID规范排序；groundCells按q后r数值升序。

## 3. 完整GuideCatalog

```text
{
  id, version:1, namespace:"supplied-guide-v1",
  sourceIdentity:{
    kind:"supplied-guide-reference"|"synthetic-example",
    reference:<非空文本，最多2048字符>
  },
  skills:[{id:<guide:...>,name:<非空文本，最多128字符>}],
  standardPool:[guideSkillId], highestPool:[guideSkillId]
}
```

skills至多256项、ID唯一；两池各非空，彼此及各自无重复，合计≤256，所有pool ID必须在skills目录中。目录可包含当前不入池的技能，例如actor已有的guide skill；它们不会自动成为offer。skill.name和reference须含非空白内容，长度按JavaScript字符串字符单元边界检查。

创建时规范排序skills与两个池；完整内容而非仅目录名称存入genesis。没有联网校验reference、导入原native98表或核实其分组的逻辑，supplied-guide-reference也不等于authenticated-native-table。替换目录或policy必须从新的genesis开始。

## 4. 三个命令与消费顺序

```text
{id,expectedRevision,command:{type:"ProcessNextArrival"}}
{id,expectedRevision,command:{type:"ResolveRuin",siteId,targetId}}
{id,expectedRevision,command:{type:"ResolveTemple",siteId,targetId,skillId}}
```

expectedRevision为0..4096。新命令必须匹配当前revision。execute先完整重建state，再校验envelope；同ID同envelope早于stale revision检查返回原receipt与当前state，`committed=false,duplicate=true`。同ID任意内容不同拒绝。新接受结果`committed=true,duplicate=false`并增加一条历史与一个revision。

ProcessNextArrival有pending时拒绝；没有剩余arrival也拒绝。否则消费下一条并更新观察位置／日期／cursor，再自行筛选相邻未发现点和主将功绩≥10000、部队resolvedCharm≥80门槛。无候选／门槛不足照常接受、无draw无奖励；合格时singleton直接选，否则draw(n)，再必draw(100)，r<50成功。失败仍消费到达和已用随机。50及LCG均为新政策。

成功发现给发现部队全员charmXp请求+10、cap1e9，设置site.discovered并建立pending。遗迹冻结发现月份及对应reward；庙冻结真实序号和最多3个无放回offer，前三座仅standardPool，第4座起两池并集，最高级不保证出现。完整12个月表及各证据等级见[规则第4节](../rules/adjacent-site-discovery-lifecycle.md#4-b3遗迹12个月完整奖励)。

Resolve只允许匹配pending的site／类型和同势力普通名单中的target。遗迹对冻结字段+1，talents cap255、aptitudes cap3，cap挡满也消耗。庙的skillId须在冻结offer中，实际替换旧技能；同技能重学也消费。两者均site.resolved=true、pending=null，不推进日期／cursor，不抽数、不再次发XP。

## 5. Snapshot、Discovery与Pending

```text
Snapshot = {
  revision,cursor,date,
  actors:[{id,charmXp,talents,aptitudes,skillRef}],
  units:[{id,position}],
  sites:[{id,discovered,resolved,discovery}],
  pending:<Pending>|null,
  rng:{state,drawCount}
}
```

revision从0起，每个新接受command加1。cursor只在ProcessNextArrival加1。固定身份／merit／单位编成与能力保留在genesis，snapshot不复制它们。已发现site的discovery完整字段：

```text
{siteId,kind,origin,sourceId,commandId,arrivalId,unitId,date,templeOrdinal}
```

- `origin="supplied-initial"`：sourceId来自初态来源，commandId／arrivalId／unitId／date均null；只有庙有连续templeOrdinal，遗迹为null
- `origin="arrival"`：sourceId=null，其余commandId／arrivalId／unitId／date均是本次真实到达的记录，庙有实际序数，遗迹为null
- 未发现site的discovery必须null，不能用缺失元数据跳过完整重建

pending公共字段为`{siteId,commandId,arrivalId,unitId,date}`，附带以下二者之一：

```text
{kind:"ruin",month,reward:{kind:"talent"|"aptitude",field}}
{kind:"temple",templeOrdinal,offerSkillIds:[guideSkillId]}
```

field必须属于对应talents／aptitudes字段，值由发现月份映射。offer数组保持抽样顺序，不在发现后重新排序；preview／保存／load均不能刷新它。没有额外completed字段：cursor等于arrival总数且pending=null表示有限场景完成。

## 6. Receipt：请求、实际与弃置

receipt全部字段为：

```text
{
  schemaVersion,profile,scope,commandId,envelope,policyId,sourceBoundary,
  revisionBefore,revisionAfter,cursorBefore,cursorAfter,dateBefore,dateAfter,
  outcome,arrival,discovery,pendingBefore,pendingAfter,
  rewards:{charmXp:[{actorId,value}],ruin,temple},
  eventLedger:{actionPointsDelta:0,goldDelta:0,techniquePointsDelta:0,meritDelta:0},
  rngBefore,rngAfter,draws
}
```

outcome限定arrival-no-discovery、ruin-discovered、temple-discovered、ruin-resolved、temple-resolved。arrival-no-discovery可能来自门槛失败、空池或抽样失败，具体由arrival内部字段区分。

ArrivalEvaluation保存完整本次arrival、observationBefore／After，以及：

- eligibility：leaderId、leaderMerit、resolvedCharmU8、troops、passed与reasons。理由为leader-merit-below-minimum／unit-charm-below-minimum／no-troops；支持场景创建要求troops≥1，因此no-troops只是防御性理由，不代表支持初始零兵部队
- rawSiteIds：全部site IDs；eligibleSiteIds：内部过滤后ID序；excluded每项为`{id,distance,reasons}`，理由可同时含already-discovered／not-adjacent／unit-ineligible
- selectedSiteId与roll：没有候选时均null；有候选即保留所选ID与0..99的发现roll，失败也保留

Resolve时arrival=null、discovery=null，但pendingBefore保留对应发现来源；发现成功时discovery记录本次新增来源。每条receipt不复制整个genesis。

`Credit={before,requested,actual,discarded,after}`，actual=min(requested,cap−before)、discarded=requested−actual。发现XP和遗迹奖励使用Credit。

- rewards.charmXp仅发现成功有该部队每人的请求记录，Resolve或失败到达为空数组
- rewards.ruin为`{targetId,reward:{kind,field},value:Credit}`或null
- rewards.temple为`{targetId,beforeSkillRef,requestedSkillId,afterSkillRef,requestedReplacements:1,actualReplacements,discardedReplacements,relearned}`或null。相同技能actual=0、discarded=1、relearned=true；不同技能actual=1、discarded=0
- eventLedger的四个0只表明本事件账本无这些资源差额，不证明原生移动／事件完整成本为0

Draw为`{drawIndex,label,bound,beforeState,afterState,value}`；label仅site-selector／discovery-roll／temple-offer。每到达至多5条，Resolve为0条。精确BigInt整数LCG与乘高映射，uint32 seed0合法；原作RNG与严格无偏均不作承诺。

sourceBoundary固定标明guide-observation、synthetic-replaceable-policy、supplied-reference-not-authenticated-native-table；原概率／坐标／原技能池／writer／stock／跨版本认证均false，sourceArrivalProvesNativeMovement=false、ownershipFrozen=true、trainingXpAndAllowanceChanged=false、citySearchLedgerShared=false，原43／45未减少。来源证据不能由调用者替换成true。

## 7. State、save与load

```text
{
  tag:"adjacent-site-discovery-state-v1",schemaVersion:1,profile,scope,
  policy,sourceBoundary,
  genesis:{scenario,snapshot},
  snapshot,
  acceptedCommands:[{envelope,receipt}]
}
```

create规范化整个scenario后生成初始snapshot。save完整重建state，再返回规范JSON文本。load只接JSON字符串，拒绝重复decoded key，包括不同转义拼写解码为同名；不允许用已解析对象作存档捷径。

重建从完整规范genesis开始，比对初始snapshot，重新执行每条接受历史并比较整个receipt，最后比较全部snapshot。非规范排序genesis、重复接受同ID、任一receipt或snapshot不一致均拒绝。每个中间状态重复执行完整返回／保存／幂等预算，不只验最后结果。

不支持只保存snapshot、hash通过、裁剪历史、subset resume、null receipt或以最新政策重解释旧保存。完整genesis／固定来源／目录与历史自洽性不等于密码学真实性；协调改写完整genesis和一致历史会构成另一份供应场景，不能称任意伪造都可检测。

## 8. Trace与未运行示例

```text
{
  tag:"adjacent-site-discovery-trace-v1",
  scenario,
  attempts:[{envelope,expectedOutcome:<ExpectedOutcome>|null}],
  expectedFinalSnapshot:<Snapshot>|null
}
```

attempts最多4096，允许正常接受、业务拒绝、旧ID幂等及冲突。ExpectedOutcome成功项是`{ok:true,duplicate,receipt}`，失败项是Failure。非null时比较完整值；null仅关闭该断言，绝不提供success、roll、offer或奖励。load的强制receipt／snapshot比对不受trace的null规则影响。非法envelope的防御性失败记录不扩大typed envelope schema的支持域。

[示例trace](../../data/scenarios/adjacent-site-discovery-example-v1.json)为静态设计：seed0，两个实验技能池各一项，三个初始已发现庙，以及两条供应到达。8个attempts依次安排首次到达、旧ID重试、pending阻塞、部队外目标的遗迹Resolve、第二到达、第4庙同技能Resolve、再次旧ID重试及到达耗尽。该顺序是演示意图，没有实际执行；所有expectedOutcome和expectedFinalSnapshot均为null，因此不是断言向量或通过记录，不可据此声称已验证抽样或终局。

## 9. 预算、原子性与对象边界

完整输入／状态／各API返回的UTF-8 JSON上限16MiB；节点1,048,576、depth24、数组4096、对象128键。保存同时预算结构state与转义内层JSON后的整个`{ok:true,json}`返回。各实体的更小上限见前文，独立最大值不保证可同时装满预算。

最多4096条成功command；重复不增加历史，拒绝不预留ID。每个新接受状态必须预留所有旧ID幂等返回`state＋旧receipt`的完整容量；代码按各预算维度的最大历史receipt检查，不只检查最新或单一最大字节receipt。更早拒绝新command可以保住旧返回能力，不能截断历史。preview执行同样的execute／保存／旧ID门槛，再检查完整preview返回。

新状态在分离候选对象中计算，晚期预算错误也不提交任何资源、位置、cursor、日期、site、pending、XP、技能或RNG。深冻结返回不代表原世界事务已执行，执行入口不会修改调用方state。完整历史重建和重复预算扫描是静态有界设计，不作性能、延迟或实测效率承诺。

对象API支持非Proxy、plain／null-prototype own-data JSON DTO和密集数组；拒绝额外字段、继承字段、非数据descriptor、自定义原型、symbol、稀疏数组、负零及不安全整数。支持域内拒绝getter／setter而不读取其值；不接policy callback。反射可能触发Proxy traps，敌意Proxy与污染运行时不支持，不能承诺任意JS对象都无callback或副作用。load的JSON字符串入口是单独有界解析，不扩展对象API保证。

## 10. 来源与旧API边界

基线PR85 main `7cf050fdf57cd40641bf5f139b2c34c548aae820`／tree `c515fd47bdec5a1f8b9502da58130dad91372a09`仅标仓库版本。新B的攻略观察、供应事实与synthetic政策各自保留；没有原EXE、完整坐标、原概率、原池／writer或跨版本认证。

A的冻结sourceBoundary与source manifest中B未实现描述是A交付时点的身份，不改旧保存或source语义；当前B的存在和能力由本页与独立manifest记录。B不共享A的资源、随机流或保存语义，也不改其三个listing核。原43主题／45快照与E／X保持；O14城市事件、O15跨服务集成另行处理。完整边界见[规则第9节](../rules/adjacent-site-discovery-lifecycle.md#9-ex与原计数不变)。
