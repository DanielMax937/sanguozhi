# City merchant lifecycle v1 API

独立有限单城即时粮食交易；具体游戏规则、政治锚点、公式和证据边界见[完整规则正文](../rules/city-merchant-lifecycle.md)。实现 `packages/engine/src/city-merchant-lifecycle.ts` 从public index导出，不扩展O04、O10-A或GameState/v2。

代码、schema和静态场景均未运行；没有执行测试、typecheck、编译、build、checker、诊断、产品入口或示例。以下是调用合同，不是通过记录。

## 注册内容

- `CITY_MERCHANT_POLICY_REGISTRY_V1`：两个完整参数快照，唯一差别为具名AP恢复20或0
- `CITY_MERCHANT_DEFAULT_POLICIES_V1`：恢复20的完整默认快照
- `CITY_MERCHANT_CATALOG_V1`、`CITY_MERCHANT_CATALOG_DIGEST_V1`：12政治观测锚点/插值规则与canonical SHA-256
- `CITY_MERCHANT_EVIDENCE_V1`：source/provisional界限，nativeExecution/stockVerified均false

场景必须明确给完整policies与catalog，不能只交ID或摘要。注册内容及输出递归冻结，输入分离后再解析；不会修改调用者对象。公开类型均为 `CityMerchant…V1`，包括Scenario、State、Snapshot、Command、Envelope、Policies、Catalog、Receipt、Write、Failure、StateResult、CommandResult、PreviewResult、SaveResult、Trace、ReplayResult。

## 场景

`schemaVersion:1`、`profile:"standalone-city-merchant-v1"`；完整字段见[规则§1](../rules/city-merchant-lifecycle.md#1-独立场景与支持域)与[shape schema](../sources/city-merchant-lifecycle.schema.json)。必须给初始日期/turn、advanceLimit、activeForceId、corps、city、officers、hostileForceIds、completeFieldUnits=true、完整fieldUnits、恰advanceLimit个下一旬turnInputs、完整policies和catalog。

全horizon年/turn能否安全推进在创建时先检查，不先创建再截断；每个未来primitive都验证，包括无商人旬的合法UI价格。每名武将政治都必须20..100，未执行者也不例外。同城同势力是执行者资格，场景可保留不合格武将供命令拒绝；不得从native任务身份推断资格。

schema仅记JSON形状；余额≤cap、marker≤turn、owner/corps一致、ID唯一、完整horizon和总预算由运行时严格检查。schema或digest不能替代完整state重建。

## createCityMerchantState(scenario)

成功 `{ok:true,state}`。revision与advancedCount为0；创建不交易、不扣AP、不发XP、不推进旬。初始city/actor marker保留，不能借load/create隐式重置为未行动。

## previewCityMerchantCommand(state,envelope)

完整envelope为 `{id,expectedRevision,command}`，命令三选一：

- `{type:"BuyFood",cityId,officerId,foodAmount}`
- `{type:"SellFood",cityId,officerId,foodAmount}`
- `{type:"AdvanceMerchantTurn"}`

foodAmount为1..1e9安全整数。买卖均以粮量请求，禁止额外goldCost、effect、quote、finalStock、成功布尔或targetDate字段。

成功 `{ok:true,committed:false,duplicate,receipt,projectedSnapshot}`。preview与execute共用完整reconstruct、资格/敌情/资金/容量、resolver及完整execute输出预算。没有副作用；preview收据或余额不是执行授权凭据。

## executeCityMerchantCommand(state,envelope)

成功 `{ok:true,committed,duplicate,state,receipt}`。调用者须保存新返回state。新ID有效命令一次原子提交，revision+1，acceptedCommands追加完整envelope和receipt。

同ID和完整envelope完全相同：返回原receipt、committed=false、duplicate=true，即使当前revision、旬或horizon已经改变。相同ID改expectedRevision或命令任何字段即command-id-conflict。新ID带旧revision即revision-conflict。换ID/执行者仍受城市同旬一次门槛。

交易收据包含完整command、前后revision/date/turn、owner/corps/city/officer、policy/catalog digest、原始UI相场、锚点/未约分有理效果、卖侧因子、exactGold、ceil/floor、整除余数、roundingDifference、有符号双资源写入与外部商人互补流、完整敌情逐单位距离/hostile/blocks、行动marker、AP、XP前后及cap余量。未约分大整数都是规范十进制字符串；没有JSON BigInt或科学计数。

meritDelta=0是本profile未接功绩账本、不应用功绩变化，不能据此声称原作商人无功绩奖励；官方说明书提到政治/功绩提高，XP+5的具体数值另来自Wiki观察。

推进收据含inputIndex、完整新旬input、fixed-external-scenario标识、AP恢复policy与requested/actual delta。不会运行财政收入、耗粮、工资或其他服务。

## 失败与预算

所有API失败返回 `{ok:false,committed:false,reason,index,blockingUnitId}`。普通index为null，保存历史/trace分歧时为位置；hostile-within-two给第一个阻挡单位ID（supplied数组顺序），其他blocker字段为null。

常见reason：invalid-fields/invalid-number、unsupported-schema-profile、unsupported-city-kind、owner-corps-mismatch、incomplete-field-unit-snapshot、incomplete-turn-input-horizon、policy-mismatch、catalog-mismatch、command-id-conflict、revision-conflict、city-mismatch、merchant-absent、city-merchant-already-used、officer-not-found、officer-city-force-mismatch、officer-unavailable、officer-already-acted、hostile-within-two、insufficient-action-points、zero-value-sale、gold-amount-out-of-range、insufficient-gold/food、food/gold-capacity-exceeded、advance-limit、calendar-overflow、history-limit、budget-exceeded。

64MiB canonical UTF-8、4,000,000节点、48深度、4096最大数组、128对象键；256武将、256敌对势力、每快照4096单位、360推进、最多2×advanceLimit+1接受事件（全局721）、2163 trace attempts。各维上限不能保证可同时取满，总体预算还会拒绝。preview预算等同完整execute输出；晚期预算错误也不提交部分state。

## saveCityMerchantState(state) / loadCityMerchantState(json)

save成功 `{ok:true,json}`；load成功 `{ok:true,state}`。保存包含tag=city-merchant-state-v1、schemaVersion/profile/scope、完整policies/catalog与digest、genesis的完整scenario和初始snapshot、最终snapshot、所有acceptedCommands及完整receipt。

save本身也reconstruct；load用有限JSON parser拒绝重复解码key，重建genesis，逐条重执行接受命令并复验原execute完整输出预算，逐字段比对receipt，最后比对snapshot。价格、政治、锚点、政策、输入表、AP/XP、余额/cap、marker、units或收据被局部修改，不能凭重新计算hash通过。完全自洽的另一个合法scenario不是签名伪造检测目标，本服务不提供身份认证。

对象key顺序无关，数组顺序保留。禁止负零、非有限数、额外字段、getter、symbol、自定义原型、稀疏数组及超预算结构。未知shape不会作为原生存档解释。

## replayCityMerchantTrace(trace)

trace完整字段：tag=city-merchant-trace-v1、scenario、attempts、expectedFinalSnapshot。attempts各项 `{envelope,expectedOutcome}`；expectedOutcome可为null、`{ok:true,duplicate,receipt}`，或`{ok:false,reason,blockingUnitId}`；expectedFinalSnapshot为完整snapshot或null。

先用当前状态和命令独立求实际结果，再对比期望。失败不入accepted history；重复不重扣资源。成功 `{ok:true,state,outcomes}`；任何期望/形状不符或最终总预算错误返回failure，不交付部分state。没有接受caller quote或从预期结果反推写入的路径。

[静态场景](../../data/scenarios/city-merchant-example-v1.json)与[纸面金额推导](../rules/city-merchant-lifecycle.md#9-静态场景与纸面推导未运行)只描述预期，没有执行。
