# 固定单城Search工程接口 v1

profile：`standalone-city-search-v1`；scope：`one-fixed-city-discovery-only`。实现位于[city-search-lifecycle.ts](../../packages/engine/src/city-search-lifecycle.ts)，通过engine index导出。见[完整规则](../rules/city-search-lifecycle.md)、[政策](../../data/catalogs/city-search-policy-v1.json)、[来源](../sources/city-search-lifecycle.json)、[JSON interchange schema](../sources/city-search-lifecycle.schema.json)与[未运行场景](../../data/scenarios/city-search-example-v1.json)。

这是内部过滤／选人／抽样并实际更新独立账本的O13-A服务，不是接受caller最终结果的wrapper。人才只记已知名录，宝物只记发现登记，均不改变原生归属。O13-B相邻遗迹／庙另有[独立静态profile](adjacent-site-discovery-lifecycle.md)，详见规则第10节的当前路由；A的命令和账本不变。

本批只有静态实现和文档；没有执行产品、示例、测试、typecheck、编译、build、checker、诊断或schema校验。本文API形状及纸面行为说明不是执行验证结果。

## 1. 导出与调用协议

六个函数均接收unknown输入，返回深冻结、无外部服务依赖的DTO，不会原地修改调用方对象。对于返回state的成功调用，由调用方显式保存该state；preview与save返回值见下表。

| 函数 | 参数 | 返回类型 |
|---|---|---|
| `createCitySearchStateV1` | scenario | `CitySearchStateResultV1` |
| `executeCitySearchV1` | state, envelope | `CitySearchCommandResultV1` |
| `previewCitySearchV1` | state, envelope | `CitySearchPreviewResultV1` |
| `saveCitySearchV1` | state | `CitySearchSaveResultV1` |
| `loadCitySearchV1` | JSON字符串 | `CitySearchStateResultV1` |
| `replayCitySearchV1` | trace | `CitySearchReplayResultV1` |

无inspect API、原世界适配器、授予／装备／出售／登用／移动或城市事件命令。旧GameState、Train、EndTurn及v2存档不变。

同时导出 `CITY_SEARCH_POLICY_REGISTRY_V1`、`CITY_SEARCH_DEFAULT_POLICY_V1`、`CITY_SEARCH_EVIDENCE_V1`、`CITY_SEARCH_UNSUPPORTED_V1`，以及CitySearch前缀的Scenario、State、Snapshot、Command、Envelope、Policy、Discovery、Draw、Receipt、Failure、StateResult、CommandResult、PreviewResult、SaveResult、Trace、ReplayResult V1 readonly类型。registry仅含完整 `city-search-policy-v1`，其中只注册AP20推进政策。

## 2. Scenario：完整genesis输入

所有字段必填，无额外字段：

```text
{
  schemaVersion: 1,
  profile: "standalone-city-search-v1",
  scope: "one-fixed-city-discovery-only",
  date: { year, month, day },
  turn,
  advanceLimit,
  activeForceId,
  force: { id, techniquePoints },
  city: { id, kind: "city", forceId, corpsId, gold, goldCapacity,
          talentOfficeComplete, regionId },
  corps: { id, forceId, actionPoints },
  actors: [...],
  talents: [...],
  treasures: [...],
  rng: { kind: "search-lcg32-multiply-high-v1", seed },
  policy: <完整注册政策对象，包括sourceIdentities>
}
```

force.id、city.forceId、corps.forceId均须等于activeForceId；city.corpsId必须等于corps.id。gold≤goldCapacity，两者≤1e9；AP≤255、TP≤10000。date.year为1..9999、month为1..12、day为1／11／21。turn是非负安全整数，turn+advanceLimit也须安全；advanceLimit为1..360，整个日期horizon必须有效。

actor（0..256项）的闭合字段：

```text
{id, forceId, cityId, ordinary, available, politicsU8, charmU8,
 birthRegionI32, eyeSkillEaxU32, merit, politicsXp, actedTurn}
```

ordinary／available为boolean；politics与charm为0..255，birthRegion为signed32，eyeSkillEax为完整uint32；merit／politicsXp为0..1e9；actedTurn为null或0..初始turn。初始名单可有外城、非普通或不可用actor，Search自行拒绝不合资格者。能力为固定事实，XP账本不自动重算能力。

人才（0..1024项）：

```text
{id, cityId, lifeStatus: "living"|"dead",
 serviceStatus: "free"|"serving"|"prisoner",
 availableFromTurn, discovered}
```

宝物（0..128项）：

```text
{id, searchCityId, kind: "ordinary"|"imperial-seal"|"bronze-pheasant",
 holderRef: id|null, availableFromTurn, valueU8, discovered}
```

availableFromTurn为0..初始turn+advanceLimit。valueU8为0..255。所有ID长1..64，ASCII首字符字母数字、其余字母数字或 `_ . : -`。actor与talent的ID整体唯一，treasure实例ID在自身池内唯一。create按ASCII ID排序全部三池；不靠名称去重。

原始discovered是不可变的初始事实，运行时是否已发现由snapshot的talentRegistry／treasureRegistry的ID成员关系派生。initial true生成supplied-initial登记，但不产生可出售、授予或装备的原生财产。无现有宝物目录导入器或名称映射；importCatalog明确为 `none-supplied-instance-facts-only`。必填kind被枚举校验，两个special kind被过滤；本服务不认证供应事实真实性，无法识别真实特殊物被谎报ordinary。

完整policy要与注册值一致，不只校验id或digest。sourceIdentities随其冻结，记录旧listing身份。改变policy需新profile／版本及新genesis，不能中途改变旧replay含义。

## 3. 两个命令与幂等顺序

```text
{id, expectedRevision, command: {type: "Search", cityId, actorId}}
{id, expectedRevision, command: {type: "AdvanceSearchTurn"}}
```

expectedRevision为0..4096。每个新接受命令使revision+1并增加一条acceptedCommands，包含合法nothing与推进。输入不能含目标候选、success、roll、奖励、概率或cap覆盖。

execute先重建并验证完整输入state，再验证envelope。已接受ID若envelope完全相同，返回原receipt及当前state，`committed=false, duplicate=true`；这一步早于stale revision检查。已接受ID内容不同拒绝。新的stale revision、历史上限、资格／AP／推进上限及任何后期预算错误均拒绝。

Search只能在固定城市由普通、available、同城同势力且本turn未行动的actor执行。AP为人才府10，否则20；金0。无每城每旬一次限制。合法nothing也付费并写actedTurn。Advance只前进一旬、AP请求+20并cap255，不抽RNG、不改人员行动历史、不触发任何其他服务。

## 4. Snapshot与Discovery

```text
{
  revision, turn, advancedCount, date,
  gold, actionPoints, techniquePoints,
  actors: [{id, merit, politicsXp, actedTurn}],
  talentRegistry: [Discovery],
  treasureRegistry: [Discovery],
  rng: {state, drawCount}
}
```

所有名录按ID升序。Discovery恰有 `{id, origin, commandId, turn, date, actorId}`：

- supplied-initial：commandId／turn／date／actorId全部null，不编造历史
- search：上述字段全部为真实已接受Search对应的ID、turn、日期及执行者；不能给null跳过验证

genesis原始人才／宝物记录始终不改，当前发现状态从registry派生；人才serviceStatus及宝物holderRef冻结。每个已发现实例仅有一条登记。

## 5. Receipt：原值、请求与实际写入分开

每条receipt包含schemaVersion／profile／scope、commandId及完整envelope、policyId、固定sourceBoundary、前后revision／turn／date、cityId、actorId、outcome、talent／treasure／discovery／gold／resources／rewards、actorBefore／actorAfter、rngBefore／rngAfter与draws。

outcome只有talent-found、treasure-found、gold-found、nothing、turn-advanced。

人才与宝物Pool保留原始candidate IDs、eligible IDs及每个排除项的全部reasons；原始事实存于genesis，不逐receipt复制。人才排除理由为not-living、not-free、other-city、not-yet-available、already-discovered；宝物为special-kind、already-held、other-city、not-yet-available、already-discovered。

- talent：Pool、selectedId、roll、完整人才核receipt。原returnedEax最高205保留。b=0时selectedId／roll均null；b>0必抽百分roll，singleton不抽selector
- treasure：Pool、reached、selectedId、roll、核receipt或null。人才成功时仍保留已经派生的宝物过滤记录，但reached=false且不选择、不抽样、不调用宝物核；reached=true但空池仍无核与roll
- gold：`{before, capacity, after, actualDelta, capacityDiscarded, belowMinimumDiscarded, kernel}`。人才／宝物成功和advance时kernel=null；搜金时保留原完整caller receipt，包括条件secondRead和call-site reads。capacityDiscarded是proposed减最终amount，belowMinimumDiscarded是nothing路径未入账的amount，两者都不等于actualDelta
- resources：`{goldCost:0, actionPointsBefore, actionPointsCost, actionPointRecovery, actionPointsAfter}`。Search的recovery为0请求，其before／after都使用扣费后的AP；Advance的cost为0，recovery请求20
- rewards：`{merit, politicsXp, techniquePoints}`。Search都有Credit；Advance的merit／politicsXp为null，techniquePoints是0请求Credit。没有actor的advance不能借此给人员奖励
- Credit：`{before, requested, actual, discarded, after}`。actual=min(requested,cap−before)，discarded=requested−actual。功绩／XP cap1e9，TP cap10000，AP cap255；gold不使用此writer
- Draw：`{drawIndex,label,bound,beforeState,afterState,value}`。label限定talent-selector／talent-roll／treasure-selector／treasure-roll／gold-roll；每Search最多5条，advance为0条。所有RNG计算以精确BigInt整数进行，seed0合法；乘高映射不宣称严格无偏或原作RNG

旧核receipt的evidence原样保留，包括历史listedBytesVerified=true；它不意味着本批重新运行字节检查。新receipt的sourceBoundary另行声明新政策、调用点请求、攻略观察、stock未认证及原writer／ownership未接入。其中O13-B未实现标记保持A交付时点的冻结身份，不因后来独立B的新增而改写；当前B能力与来源见其独立文档，不能将此旧标记误读为当前仓库状态。

## 6. State与完整保存重建

```text
{
  tag: "city-search-state-v1", schemaVersion: 1,
  profile, scope, policy, sourceBoundary,
  genesis: {scenario, snapshot},
  snapshot,
  acceptedCommands: [{envelope, receipt}]
}
```

genesis保存完整规范场景与派生初始snapshot；snapshot是当前状态。save先完整重建，再输出规范JSON。load接收字符串，不接受已解析对象作为存档捷径。它拒绝重复decoded JSON key（包括转义后重名），重建规范scenario和初始snapshot，再逐条执行acceptedCommands、比对完整receipt，最后比对完整当前snapshot。相同ID不能作为第二条接受历史；登记册、RNG或任何其他字段不由存档中的值直接驱动执行。

保存genesis若不是create的规范排序，load拒绝noncanonical-genesis。不要把当前新policy覆盖进旧存档，不支持部分resume或仅靠hash通过。对给定genesis不一致的变更将被拒绝；这是自洽性，不是密码学真实性。协调改写完整genesis和匹配历史会形成另一份所供场景，不承诺识别任意伪造。

## 7. Replay与结果联合类型

```text
{
  tag: "city-search-trace-v1",
  scenario,
  attempts: [{envelope, expectedOutcome: <ExpectedOutcome>|null}],
  expectedFinalSnapshot: <Snapshot>|null
}
```

replay从scenario开始，最多4096次attempt，可包括有效envelope的业务拒绝、已接受重复ID及冲突。expectedOutcome和expectedFinalSnapshot是断言，null仅关闭各自比对；实际过滤／选择／RNG／费用和结果始终计算。load从不允许用null跳过存档receipt或snapshot比对。非法envelope的防御性失败记录不属于schema所描述的typed envelope interchange。

所有失败共有：

```text
{ok:false, committed:false, reason, revision:null|integer,
 turn:null|integer, commandId:null|id, index:null|integer}
```

失败无state或receipt；index在可定位时标明历史／trace条目。常见reason包含wrong-city、unknown-actor、ineligible-actor、actor-already-acted、insufficient-ap、advance-limit、stale-revision、duplicate-command-id-conflict、history-limit、serialization-budget、policy-mismatch、receipt-mismatch、snapshot-mismatch、duplicate-json-key。nothing是付费的已接受结果，不是Failure。

成功结果：

- create／load：`{ok:true,state}`
- execute：`{ok:true,committed,duplicate,state,receipt}`
- preview：`{ok:true,committed:false,duplicate,receipt,projectedSnapshot}`
- save：`{ok:true,json}`
- replay：`{ok:true,state,outcomes}`，每个outcome是 `{ok:true,duplicate,receipt}` 或Failure

preview执行相同命令／save／旧幂等返回预算门槛后，还检查完整preview返回。不预留command ID，不推进调用方状态或RNG。duplicate preview的projectedSnapshot为当前snapshot，而不是原receipt时的旧快照。

## 8. 支持对象边界与统一预算

对象API仅支持**非Proxy**的plain／null-prototype own-data JSON DTO、密集数组及严格有限安全整数。支持域内拒绝额外字段、继承字段、非数据descriptor、symbol、稀疏数组、自定义原型、负零或不安全数字；不读取getter，不接policy callback。反射getPrototypeOf／ownKeys／getOwnPropertyDescriptors及command ID读取可能触发Proxy traps。敌意Proxy及污染运行时明确unsupported；不承诺检测全部Proxy，也不承诺处理任意JS对象无callback或副作用。JSON字符串load使用单独的有界parser，不能据此扩大对象API保证。

统一上限：完整UTF-8 JSON 16MiB、节点1,048,576、depth24、单数组4096、单对象128键，另有每域更小上限。接受历史和trace attempts各最多4096。完整输入、状态、execute／preview／replay等每个返回都受预算；save同时计量结构state和**转义内层JSON后的完整SaveResult**。各字段单独最大值不保证可同时达到。

每个新接受state还分别找canonical UTF-8 bytes、raw string/key bytes、nodes、depth的历史receipt极值，对这些receipt加当前state的完整duplicate返回预算作检查。最多四个极值receipt足以保留每个维度，但不能只选择最新receipt或最大字节receipt。于是任何旧接受ID都保留原receipt的返回容量；较小的Advance也不能挤掉较大的旧Search重试。load／replay在每步重做这些预算，不截断历史或压缩掉旧receipt。

性能仅静态有界：execute／preview／save／load完整重建历史，replay也逐step重做预算与旧receipt容量扫描；随历史增长至少呈二次成本。4096只是硬上限，不是延迟或效率承诺，也没有任何实测结果。

所有新状态都先在分离对象中计算；任何晚期核／schema／预算失败都返回Failure，原对象不变，不收费、不耗RNG、不预留ID。4096成功命令只是上限，16MiB等预算可能使某个具体场景更早拒绝。

## 9. 证据与集成停止线

PR53／54／55已经交付限定人才、宝物参数、搜金投影核；旧候选措辞按其原日期理解，三个核的范围和false证据标记不因本服务改变。完整Search原概率／RNG／资格／writer、stock与跨版本仍E。独立发现名录不等于登用，宝物登记不等于native授予或归属。

不接native人员迁移、capture、force灭亡／继承、mission／return／finalizers、当场登用／舌战交接、P078或其依赖；不共享其他服务余额／行动／时间。原43主题及45条快照不减，城市事件归O14、跨服务一致性归O15；历史corpus的executionEnabled=false保持不变。
