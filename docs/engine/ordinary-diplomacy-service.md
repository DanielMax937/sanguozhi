# 普通外交独立API（O08）

规则正文：[ordinary-diplomacy-service.md](../rules/ordinary-diplomacy-service.md)。本页定义调用合同；不是原生mission API。本批未运行测试、编译、build、checker、产品或诊断。

## 导出

从engine index导出：

- ORDINARY_DIPLOMACY_POLICY_V1：完整深冻结固定政策配置
- ORDINARY_DIPLOMACY_EVIDENCE_V1：公式/版本/费用/退款/期限/奖励证据分层
- createOrdinaryDiplomacy(scenario)：创建revision0会话
- previewOrdinaryDiplomacy(session, command)：无副作用纯计划
- executeOrdinaryDiplomacy(session, command)：重算并原子返回新会话和receipt
- saveOrdinaryDiplomacy(session)：完整重算后返回规范JSON
- loadOrdinaryDiplomacy(json)：解析、验证policy、从genesis重算每条receipt和最终snapshot
- replayOrdinaryDiplomacy(initialScenario, commands)：从scenario重放请求序列；失败返回index，不返回部分会话

类型导出：OrdinaryDiplomacyScenarioV1、SnapshotV1、CommandV1、SessionV1、PolicyV1、EvidenceV1、FormulaV1、ReceiptV1、PreviewV1、Failure，以及SessionResultV1、ExecuteResultV1、PreviewResultV1、SaveResultV1、ReplayResultV1，后缀前均带OrdinaryDiplomacy。类型只读；所有入口仍对unknown实际内容作运行时验证。

## 创建与状态

scenario包含xun、difficulty、resources、sourceCity、executor、targets和relations，完整字段域见[规则第3节](../rules/ordinary-diplomacy-service.md#3-固定输入字段域和方向)。没有profile选择参数：本API只创建PK经验公式工程profile。试图给scenario加入version/profile/success等额外字段会拒绝；加载其他profile返回unsupported-profile。

成功：`{ ok: true, session }`；失败：`{ ok: false, reason }`。session结构：

```text
tag = ordinary-diplomacy-session-v1
policy = 完整有效固定配置
genesis = schemaVersion/profile/revision0 + 完整scenario
snapshot = 当前全部固定事实及动态资源/关系/xun/revision
entries = [{ command, receipt }, ...]
```

创建规范化目标与无序pair排序；不读全局GameState或其他服务账户。0..32目标都合法；零目标可仅推进外交时钟。

## 命令

所有字段必填，额外字段拒绝：

```text
AmicabilityGift:
  type, expectedRevision, sourceCityId, executorId, targetForceId
OfferAlliance:
  type, expectedRevision, sourceCityId, executorId, targetForceId, offeredGold
OfferCeasefire:
  type, expectedRevision, sourceCityId, executorId, targetForceId,
  offeredGold, durationMonths
AdvanceDiplomacyXun:
  type, expectedRevision, expectedXun
```

报价0..1000000000整数；月数1..24整数；revision/xun为0..1000000000。命令不能传政治、关系修正、是否成功、危险判定、辩论结果、RNG或最终增量。固定事实仅来自已创建会话。

不存在commandId缓存或重试幂等成功：重复提交原expectedRevision给新session会得到stale-revision；对原session重新计算只产生另一个独立不可变结果，不重复改变任何共享账户。调用者应替换为返回的session。Advance还校验expectedXun，且只推进一旬。

## preview与execute

preview成功解析返回：

```text
{ ok: true, preview: {
  executable, rejectionReason, formula, costs,
  receipt, projectedSnapshot, policy, evidence, rngDraws: 0
} }
```

executable=false表示可解释但不可提交，例如钱/AP不足、已同盟、危险失败、特殊门槛不支持。receipt及projectedSnapshot均null；formula在已算出分类时仍存在，特殊门槛未通过时为null，costs为0表示未计算，不能理解为免费。schema、字段、身份、陈旧revision等错误直接ok=false。

executable=true时receipt与projectedSnapshot为候选；execute不会接受该计划作为输入，而是用同一plan函数从会话与command重算，成功返回 `{ ok: true, session, receipt }`。危险失败的execute返回 `{ ok: false, reason: 'unsupported-dangerous-failure' }`；没有部分提交。

## Formula与Receipt

formula：classification、politics、affinityDistance、friendship、offeredGold、durationMonths、difficultyTenths、relationClass、relationC、value、successThreshold、secondaryThreshold、friendshipGainBeforeClamp、debateEligible。

relationC/value/threshold为 `{ numerator: 十进制字符串, denominator: 正十进制字符串 }`，不保证约分。亲善无阈值，两个threshold为null；非停战durationMonths为null；亲善offeredGold=0只是无报价命令标记，实际费用看costs。

receipt包括：schemaVersion、profile、command、before/afterRevision、before/afterXun、before/afterResources、formula、costs、settlement、relationChanges、expiredPairs、完整policy/evidence、rewardsApplied=false、rngDraws=0。

settlement中reservedGold为预算、spentGold为实际消费、refundedGold为立即退回、netGoldCost=reserved−refunded；费用不支持延期支付。relationChanges只列真正不同的before/after行；亲善达cap即使无关系变化也照扣费。Advance的formula=null、costs/settlement全0，只列递减/到期关系。

## 保存、载入与重放

save返回 `{ ok: true, json }`；load返回SessionResult。固定policy必须全文相等，同id不同配置也失败。所有保存和消费已有session入口都会重新验证genesis revision0、每条command与完整receipt、最后整个snapshot；receipt-evidence/policy/固定人物事实不能只靠部分字段蒙混。

replay输入是创建场景和最多256个commands；成功返回session；失败 `{ ok: false, reason, index }`，index=-1代表场景或命令数组本身不合法。只接受成功提交的历史，不把危险失败或其他拒绝塞进entries。每会话256条、16MiB文本、32层/1000000节点的工程上限见正文。没有自动checkpoint或跨会话资源共享。

重算是一致性验证，不是签名、用户认证或原版存档读取。JSON保存不支持任何原生SAN11存档格式。

## 静态使用样例

[ordinary-diplomacy-example-v1.json](../../data/scenarios/ordinary-diplomacy-example-v1.json)的scenario与commands是API输入；expectedByHand只供读者核对设计，不能作为命令或receipt传入。未运行本样例。

```ts
const created = createOrdinaryDiplomacy(example.scenario);
if (created.ok) {
  const view = previewOrdinaryDiplomacy(created.session, example.commands[0]);
  const applied = executeOrdinaryDiplomacy(created.session, example.commands[0]);
  // 只有applied.ok时，调用者用applied.session继续。
  // save/load会自行重算，不信任caller提供的计算结果。
}
```

公开运行环境遵循仓库既有Node 24约定。未添加测试、脚本或运行步骤；旧套件历史结果不代表本模块已通过验证。
