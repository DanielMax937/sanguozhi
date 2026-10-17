# 独立官职分配 API v1

本服务是可调用的独立任官服务：单职选择 → 多职预览 → 原子提交 → JSON保存/请求重放。完整游戏规则见 [官职分配规则](../rules/office-assignment-service.md)，目录见 [80有名官职与10君主爵位](../../data/catalogs/named-offices-v1.json)。它不接入原生人物/军团/太守/归属图，不改原生状态。

## 1. 入口与输入

所有函数从 `packages/engine/src/index.ts` 导出；运行域接受普通JSON数据对象。失败返回 `{ok:false,reason}`，不抛到调用者；回放另带 `index`，`-1` 表示输入/整体档案问题。成功对象递归只读，调用者传入的对象、数组从不写入。

`createOfficeAssignmentState({titleKey,officers,assignments})` 返回 `{ok:true,state}`。初始化revision=0，填入固定schema/profile/catalog digest/policy IDs，按officeId升序规范化assignment关系。每人结构：

```ts
{
  personId: 10,
  role: 'ordinary-officer',       // 或 ruler；不映射原生Identity
  appointmentStatus: 'ready',    // 或 unavailable；不映射原生Task
  merit: 4000,
  trueLoyalty: 100,
  selectorStats: { leadership: 80, war: 80, intelligence: 75, politics: 75 }
}
```

`titleKey` 是已取得爵位，不是城市数量；稳定key与中文名对应表见规则正文。assignments为 `{officeId,personId}[]`，不存在第二份person.officeId。查询未任官返回null；80永远不代表未任官。严格拒绝多余字段（包括native force/corps/base/mission字段）、缺字段、非整数、NaN/Infinity/-0、undefined、稀疏数组、循环、symbol、访问器和非普通对象。Node运行域也拒绝Proxy。无Proxy检测能力的其他JS运行域不承诺识别Proxy，调用者应使用JSON解析后的数据。

输入范围：personId/revision为非负安全整数；merit 0..60000；trueLoyalty 0..255；四项selectorStats各1..100。最多4096人、80条关系、256个重放请求；JSON字符串最多64Mi UTF-16 code units，数据深度64、节点数1000万。大档案在容量边界原子失败。这些是独立profile的工程边界，不声称适配MOD数值域。

关系必须唯一、指向存在的ordinary-officer；人物可以成为unavailable、功绩不再达标或爵位不再开放，关系仍可作为既任快照读取。加载state要求关系已经officeId升序；导入任意关系顺序请用create。fill保持既任，锁定爵位的既任关系需显式rebuild。

## 2. 独立 selector

```ts
selectOfficeCandidate(state, {
  officeId: 64,
  mode: 'weighted-threshold',
  eligibilityPolicyId: 'detached-ready-merit-title-v1',
  incumbentPolicy: 'rebuild-all-v1',
  orderedCandidateIds: [20, 10]
})
```

`orderedCandidateIds` 是state.officers中已有人的ID引用；重复/未知ID整次拒绝。selector绝不sort；该例20先于10，同分保留20。显式eligibilityPolicyId不可省略，不接受空回调。两种mode都必须显式；缺失/未知/isAI/playerMode均失败。

返回 `{ok:true,selection}`，包含officeId/kind/mode、winnerPersonId/score（无合格者均null）、原candidateOrder、逐人资格拒绝数组、scoringStatus/reason、loyaltyBonus、score、实际政策和分层证据。已资格失败则scoringStatus=not-evaluated、bonus/score=null；过资格但忠诚或能力失败则rejected；accepted包含所有过门者，最终winner按严格`>`更新，非winner不等于不合格。

fill模式调用已占职位返回office-not-vacant；调用空位但候选已任职，则该人资格拒绝already-appointed。rebuild忽略旧占用。未开放职位的selector正常给每人title-locked，不绕过爵位门。80独立报unsupported-internal-entry-80，其余越界报invalid-office-id。

## 3. plan → apply

```ts
const started = createOfficeAssignmentState(scenario);
if (started.ok) {
  const preview = planOfficeAssignments(started.state, {
    mode: 'weighted-threshold',
    incumbentPolicy: 'fill-vacancies-v1'
  });
  if (preview.ok) {
    const committed = applyOfficeAssignmentPlan(started.state, preview.plan);
    // committed.ok 后持有 committed.state；输入 started.state 始终不变
  }
}
```

plan request只含mode与可选incumbentPolicy；省略后者明确等同fill-vacancies-v1。rebuild-all-v1必须显式给出，覆盖全部独立关系，可卸任既任人物。plan完整携带：schema/profile、baseRevision、完整beforeState的canonical SHA-256 fingerprint、catalog version/digest、固定policy IDs、规范请求、初始候选顺序、被排除现任、实际officeOrder、逐职selection、before/after关系、added/removed/retained及每人before/after office、空缺职列表与证据。

apply先检查当前完整state和plan JSON，再检查revision/fingerprint，随后根据当前state与plan.request重新计算完整计划并逐字段canonical比对。修改winner/score/order/after/delta/evidence/policy、增加字段等均不会成为授权。stale-plan和plan-mismatch均不产生部分写入。提交成功只换整个assignments并revision+1；person字段、原officers顺序、titleKey等逐值不变。

关系不变返回receipt.status=no-change、保持revision。成功写入后重送旧plan得到stale-plan，绝不二次任官/加忠诚；no-change计划可重复执行，仍是no-change。这是效果幂等和乐观并发控制，非跨调用持久command-id去重。调用者须原子替换自己持有的state引用；本纯函数不提供跨进程数据库锁或磁盘写入。

`inspectOfficeAssignment(state,personId)`返回officeId、目录一般官职资料或null；只有role=ruler时另外返回rulerTitle元数据。command/bonusText/monthlySalary仅供效果展示，不改能力、不加兵、不付钱。

## 4. 保存、加载、真正的请求重放

- `serializeOfficeAssignmentState(state)` → `{ok:true,serialized}`；`deserializeOfficeAssignmentState(serialized)`验证完整profile/schema/关系再返回state，继续plan/apply。此接口是快照导入，不证明此前发生过什么
- `replayOfficeAssignments({initialState,requests})`从该独立初始状态逐条重新做plan+commit，返回state和archive，包括规范请求、每条完整receipt和finalState；不读取预先给出的after答案
- `saveOfficeAssignmentReplay({initialState,requests})`同样从头重算并保存完整archive
- `loadOfficeAssignmentReplay(serialized)`验证tag/catalog/policy，重算全部请求、每条receipt、最终完整state，整档canonical比对；伪造receipt/finalState得到archive-replay-mismatch

initialState是调用者声明的独立起点，可以含既有关系或非零revision；它不是原生存档鉴权。SHA-256是内容一致性标识，不能证明来源、身份、授权或stock等价。攻击者同时改起点和全部结果构成另一份合法独立情景，不是本服务可以鉴别的历史造假。

回放只接受成功请求序列；失败不会保存部分结果。index定位提交过程中失败的请求；请求数组格式/未知mode等整体输入失败为-1。所有保存接口只返回字符串，不自动写盘或上传。非幂等的状态变化必须由新请求重新plan，不应把旧计划当可恢复命令队列。

## 5. 错误与证据

核心错误：invalid-title-key、invalid-scoring-mode、invalid-incumbent-policy、invalid-eligibility-policy、catalog-mismatch、policy-mismatch、duplicate-person-id、unknown-assignee、duplicate-office-assignment、duplicate-person-assignment、ruler-cannot-hold-named-office、noncanonical-assignment-order、duplicate-candidate-id、unknown-candidate-id、office-not-vacant、locked-incumbent-requires-rebuild、stale-plan、plan-mismatch、revision-overflow、archive-profile-mismatch、archive-replay-mismatch。结构/容量错误另见源码返回reason。普通“无人可选”不是API失败。

本轮仅静态源码与文档交付；未执行测试、typecheck、build、编译、checker、产品或诊断。旧测试不增删；规则正文列未来验收向量而不冒充执行记录。selector来源精确性与工程政策不混称，参见 [来源manifest](../sources/office-assignment-service.json)。
