# Technique research lifecycle API v1

这是独立服务的接口合同。游戏规则、36项表、公式、顺序、错误与来源见[详细规则页](../rules/technique-research-lifecycle.md)。实现为 `packages/engine/src/technique-research-lifecycle.ts`，全部公开类型和函数从 `packages/engine/src/index.ts` 导出。本次只有静态实现和文档，未运行测试、编译或产品代码。

## 固定入口与类型

| 导出 | 合同 |
|---|---|
| `TECHNIQUE_RESEARCH_CATALOG_V1` | 深冻结 `{id:'technique-research-36-compat-v1',version:1,entries:[36行]}` |
| `TECHNIQUE_RESEARCH_POLICY_REGISTRY_V1` | 14个政策族及完整可选快照；merit/AP恢复各两项，其余各一项 |
| `TECHNIQUE_RESEARCH_DEFAULT_POLICIES_V1` | 具名默认完整快照；不是隐式场景默认值 |
| `createTechniqueResearchState(scenario)` | primitive场景→深冻结revision0状态，或 `{ok:false,reason}`；成功State没有ok字段 |
| `previewTechniqueResearchCommand(state,envelope)` | `{ok:true,receipt,duplicate,baseRevision}`或Failure，不交付新状态 |
| `executeTechniqueResearchCommand(state,envelope)` | `{ok:true,state,receipt,duplicate}`或Failure；失败不改变输入 |
| `saveTechniqueResearchState(state)` | `{ok:true,serialized}`或Failure；规范独立JSON |
| `loadTechniqueResearchState(serialized)` | 重算全部历史后返回深冻结State或Failure |
| `replayTechniqueResearch(trace)` | `{ok:true,state,outcomes}`；失败为`{ok:false,reason,index,state}`，state可能null |

公开类型为：`TechniqueResearchScenarioV1`、`TechniqueResearchStateV1`、`TechniqueResearchCommandV1`、`TechniqueResearchEnvelopeV1`、`TechniqueResearchPoliciesV1`、`TechniqueResearchPolicyV1`、`TechniqueResearchCatalogV1`、`TechniqueResearchJobV1`、`TechniqueResearchReceiptV1`、`TechniqueResearchWriteV1`、`TechniqueResearchFailure`、`TechniqueResearchResultV1`、`TechniqueResearchPreviewV1`、`TechniqueResearchSaveResultV1`、`TechniqueResearchTraceV1`、`TechniqueResearchReplayResultV1`。所有公开数据为递归readonly，并在成功输出时深冻结。

## 命令闭合形状

```ts
type TechniqueResearchCommandV1 =
  | { readonly type: 'StartTechniqueResearch'; readonly cityId: string;
      readonly techniqueId: number; readonly officerIds: readonly string[] }
  | { readonly type: 'AdvanceResearchTurn' };

type TechniqueResearchEnvelopeV1 = {
  readonly id: string;
  readonly expectedRevision: number;
  readonly command: TechniqueResearchCommandV1;
};
```

Start自行选择目录费用、检查所有参与者和资金、求时长、扣账、预约；不接受caller的已算结果。Advance仅一次旬界，自动完成；没有Complete/取消/退款。幂等比较**完整envelope**，包含原expectedRevision与所选顺序；同ID完整相同返回原receipt且duplicate=true，哪怕当前revision已更高。修改expectedRevision再使用同ID是冲突，不是合法重试。

## 场景与政策

完整primitive字段参见[字段表](../rules/technique-research-lifecycle.md#2-场景字段与合法域)，[静态示例JSON](../../data/scenarios/technique-research-example-v1.json)逐个列出必填字段和默认政策。示例没有历史、研究记录或reservation；这些只能由服务派生。create成功时对已完成ID排序，其他数组保持输入顺序。

默认不恢复AP；若选择`fixed20-cap255-v1`，须在新建场景前从registry复制该政策完整快照，而不是只更改id。功绩候选切换同理。未知policy/id/参数与strict-original profile直接拒绝，不能以compat偷偷接替。

## 收据和job

- Receipt：commandId/revision/turn/date/kind、可空newJobId/timing/fees/boundary、completions数组、可空apRecovery、rngDraws=0及sideEffectsNotModeled
- timing：相关能力与合计、difficulty、两个“未建模”flags、A/B timeFamily、baseTurns、人才府是否生效与实际减旬、duration/dueTurn/dueDate、政策ID与fallback证据
- fees：三种有符号扣写收据、guidanceParticipantIds及discountApplied
- boundary：旧/新turn和date、可空jobId与旧/新remaining；无active仍可以推进
- completion：唯一job/technique、完成turn/date、解锁前后集合、逐人XP/功绩请求与实际入账/丢弃、释放名单、actedTurn和政策ID
- job：active/completed、开始快照与固定政策、费用、时长及remaining、唯一completion；完成记录不删除

任何完整State进入execute/preview/save/load时都需可信的同模块深冻结对象，或从genesis重算所有接受过的命令并比较整份派生状态。调用者不能靠修改余额、job或policyDigest通过校验。

## 持久化与trace

Save只接受本服务tag `san11-technique-research-save-v1`，与训练、城市或补给存档不互换。

Trace为闭合对象：

```ts
{
  tag: 'san11-technique-research-trace-v1',
  catalog: state.catalog,
  catalogDigest: state.catalogDigest,
  initialScenario: state.initialScenario,
  steps: [
    { envelope: startEnvelope, expected: null },
    { envelope: advanceEnvelope, expected: null }
  ],
  expectedFinalDigest: null
}
```

这是形状说明，变量需来自调用方持有的合法状态/包，并非执行报告。catalog全文和摘要必填且逐项与固定v1匹配。expected=null表示只重新计算该步；也可完整指定成功的`{ok:true,duplicate,receipt}`或失败的`{ok:false,reason}`用于结果比较。期望值永不驱动状态变化。

步骤失败、期望匹配时可以继续；期望不符则停止于该步前状态。index=-1表示步骤前校验失败，完成全部步骤后末摘要不符时index等于steps.length。摘要基于按对象key排序、保留数组序的规范JSON，UTF-8 SHA-256；无密钥认证。完整catalog与政策快照同tag不能静默迁移。

所有输入都必须是有限plain-data；额外字段和重复JSON key拒绝。详细预算、Proxy限制、错误枚举及本次未运行验证见[规则§9–12](../rules/technique-research-lifecycle.md#9-派生状态与持久化实质)。
