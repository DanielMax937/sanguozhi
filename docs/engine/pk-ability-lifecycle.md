# PK能力研究与培育API v1

[完整游戏规则](../rules/pk-ability-lifecycle.md)包含48基础节点、50候选、所有费用/时间/计次/效果/失败顺序；本页说明调用和数据。支持Node24的独立plain-data服务，profile=`standalone-pk-ability-guide-compat-v1`，不是原生ID、存档、全局调度或跨服务账户接口。

## 导出

`packages/engine/src/index.ts`新增独立导出，旧dispatcher和旧接口不改：

- `PK_ABILITY_LIFECYCLE_CATALOG_V1`：完整冻结攻略目录，包含六冲突和全部图示元数据
- `PK_ABILITY_LIFECYCLE_CATALOG_DIGEST_V1`：固定规范JSON SHA256
- `PK_ABILITY_POLICY_REGISTRY_V1`：18族具名政策，每族完整id/version/parameters
- `PK_ABILITY_DEFAULT_POLICIES_V1`：默认包括fixed20-cap255-v1；仅AP恢复另有no-ap-recovery-v1登记变体
- `createPkAbilityLifecycle(scenario)` → `PkAbilityStateV1 | PkAbilityFailure`
- `inspectPkAbilityLifecycle(state)` → `PkAbilityInspectionV1`
- `previewPkAbilityCommand(state,envelope)` → `PkAbilityPreviewV1`
- `executePkAbilityCommand(state,envelope)` → `PkAbilityResultV1`
- `savePkAbilityLifecycle(state)` → `{ok:true,serialized} | Failure`
- `loadPkAbilityLifecycle(serialized)` → `PkAbilityStateV1 | Failure`
- `replayPkAbilityLifecycle(trace)` → `PkAbilityReplayResultV1`

create/load成功直接返回state，其service字段为standalone-pk-ability-lifecycle；失败为`{ok:false,reason}`。execute成功返回`{ok:true,state,receipt,duplicate}`；preview成功返回`{ok:true,receipt,duplicate,baseRevision}`，没有修改state。

类型导出包括Scenario、State、Command、Envelope、Policies、Policy、Catalog、Job、Receipt、Effect、Write、Failure、Result、Preview、SaveResult、Trace、ReplayResult和Inspection，均以PkAbility前缀命名，除Failure外以V1结尾。

## 初始化

完整可读场景：[pk-ability-lifecycle-example-v1.json](../../data/scenarios/pk-ability-lifecycle-example-v1.json)。这是静态输入，不是执行结果。场景必填：

| 字段 | 形状/限制 |
|---|---|
| profile | standalone-pk-ability-guide-compat-v1 |
| date | year1..9999/month1..12/day1、11或21 |
| turn | 非负safe integer |
| scope | forceId/baseId/corpsId/baseKind(city、gate、port) |
| resources | gold0..1e9/actionPoints0..255/techniquePoints0..10000 |
| hiddenSelections | 恰5个不同slotId+本槽candidateId；显式固定 |
| officers | 0..256、不同id；字段见下 |
| policies | 全部18族的完整登记对象，非只传ID |

每个officer字段为id、forceId、baseId、available、actedTurn、stats、aptitudes、skillKey。actedTurn=null或0..turn；stats必须含五维每项talent0..100/xp0..3000；aptitudes必须含六兵科的C/B/A/S；skillKey=null或安全语义字符串。所有ID为1..128ASCII，首位字母/数字，后续额外允许`._:-`。闭合字段、普通对象、密集数组、安全整数与无accessor约束递归适用。

不能传completedNodeIds、usesSpent、jobs、reservation或任何已完成答案；这些由空genesis派生。普通无年龄域只复用S1已支持数值核，不支持resolved-native-growth的自动写回。

使用默认政策的静态调用片段：

```ts
import {
  PK_ABILITY_DEFAULT_POLICIES_V1,
  createPkAbilityLifecycle,
  executePkAbilityCommand,
} from '../../packages/engine/src/index.ts';
// scenario是上面的完整JSON；以下片段未在本版执行。
const initial = createPkAbilityLifecycle({ ...scenario, policies: PK_ABILITY_DEFAULT_POLICIES_V1 });
if ('ok' in initial && initial.ok === false) throw new Error(initial.reason);
const started = executePkAbilityCommand(initial, {
  id: 'research-war-low', expectedRevision: 0,
  command: { type: 'StartAbilityResearch', baseId: 'base-example', nodeId: 'stat.war.low' },
});
```

实际TypeScript调用者应把读入JSON当unknown，做应用侧类型收窄或显式使用PkAbilityScenarioV1契约；无论静态类型如何，本API仍进行完整运行时输入验证。片段不意味着已编译或通过类型检查。

## 命令与返回

共同envelope：`{id,expectedRevision,command}`。三个闭合command：

```json
{"type":"StartAbilityResearch","baseId":"base-example","nodeId":"stat.war.low"}
{"type":"StartOfficerCultivation","baseId":"base-example","nodeId":"stat.war.low","officerId":"officer-stat"}
{"type":"AdvanceAbilityTurn"}
```

不接受elapsedTurns、target、expectedResult、forceComplete、useCount、native ID或取消字段。实际目标由48基础显式映射和所选隐藏candidate.skillKey生成。到期由单步Advance自动处理。

成功receipt固定字段：commandId、revision、turn、date、kind、newJobId、timing、fees、uses、boundary、completions、apRecovery、rngDraws。无对应项目时用null/空数组，零费用仍有账户Write：

- Write：before/requestedDelta/actualDelta/after/cap/discarded/policyId
- Timing：durationTurns/dueTurn/dueDate/policyId；研究9/12/15/18旬，培育3旬
- Uses：nodeId、before/after的limit/spent/reserved/available、policyId
- Boundary：before/after turn/date及每active job的remainingBefore/remainingAfter，按研究→stat→aptitude→skill排列
- Completion：jobId/kind/nodeId/catalogCandidateId/category/turn/date，研究有unlockedBefore/After，培育有officerId/effect/uses/releasedReservation/actedTurn
- Stat effect：attribute和完整S1 completion result，包含XP/显示成长前后、requestedPoints/requestedXp/creditedXp/clippedXp和S1 evidence
- Aptitude effect：aptitude、before、after、policyId；skill effect：before、after、policyId

Completion.sourceLevel=documented-guide仅指目录/攻略事实，lifecycleLevel=provisional-engine-rule；S1的数值证据仍属于compatibility-reconstruction。stat效果不会靠通用来源字段变成原作精确。

例如最短路径研究Start金15900→15600/AP255→235/TP0→0；九次Advance到期解锁。培育Start再扣AP20且预留一次；三次Advance后talent51/XP0→XP500/显示56。详尽静态步序和全部前置见规则第11节；不得把此文字当运行输出。

## 查看、preview及常见拒绝

inspect返回revision/date/资源/解锁/隐藏选择，activeResearch和stat/aptitude/skill各自activeJob，剩余history槽和最长预约尾部，每节点缺失allOf/次数/研究资格/预计到期，每人物共同资格/派生显示五维及逐节点培育资格。它不改变预约、AP或history。

preview走同样transition，在私有分叉生成实际完整receipt，然后丢弃分叉；调用者只有随后成功execute才获得新state。所有API结果递归冻结；不依赖调用者保持输入对象不变。

常见reason包括unsupported-profile/policy/catalog/schema、unexpected-field、invalid-hidden-selection-count、invalid-hidden-selection、duplicate-hidden-slot、revision-conflict、command-id-conflict、inactive-or-unknown-node、node-already-researched、research-already-active、missing-prerequisite、node-not-researched、cultivation-category-active、unknown-officer、officer-wrong-force、officer-not-present、officer-unavailable、officer-acted-this-turn、officer-reserved、node-uses-exhausted、xp-start-limit、growth-target-reached、aptitude-not-adjacent、skill-already-known、insufficient-gold、insufficient-ap、calendar-overflow、turn-overflow、completion-history-capacity-unavailable及command-history-full。

失败不提交任何局部变化或占用ID；完整失败优先级见规则第5节。重复原成功envelope先于revision检查返回原receipt，并保留当前state，不回退到旧state。每次后续Start都重新保留所有active任务最长剩余旬数的history容量。

## 保存与读取

```ts
const saved = savePkAbilityLifecycle(state);
if (saved.ok) {
  const loaded = loadPkAbilityLifecycle(saved.serialized);
  // loaded重新执行完整genesis历史并逐条核对，不信任存档终态。
}
```

save JSON为`{tag:'san11-pk-ability-save-v1',state}`。state完整含初始场景/固定catalog及digest/policies及digest/所有accepted envelopes及完整receipts/所有jobs、snapshots、completions/当前人物、预约、次数/解锁。

读取拒绝重复JSON key（含转义别名）、非plain数据、未知字段/格式、不同catalog或政策、修改的receipt/任意派生状态。逐条transition重建history并比较每个Applied，最后比较整个state；重新hash被篡改终态仍失败。安全hash不是外部密码学签名：完全改写genesis并提供另一条完整自洽历史会被当作不同合法场景，服务不声称鉴定外部历史真实性。

历史最多4096条，JSON输入上限64Mi UTF-16 code units，递归深度64、detach访问节点预算2,000,000；只对受支持的有限目录/人物/命令域提供服务。已完成job不会再次推进。

## 独立重放

Trace所有字段均必填，允许expected/expectedFinalState/expectedFinalDigest为null：

```ts
const trace = {
  tag: 'san11-pk-ability-trace-v1',
  catalog: PK_ABILITY_LIFECYCLE_CATALOG_V1,
  catalogDigest: PK_ABILITY_LIFECYCLE_CATALOG_DIGEST_V1,
  initialScenario: scenario,
  steps: [{ envelope, expected: null }],
  expectedFinalState: null,
  expectedFinalDigest: null,
};
```

每step重新执行完整envelope。expected成功形状`{ok:true,duplicate,receipt}`，失败形状`{ok:false,reason}`；它们只比较，不供应答案。成功结果含完整state/outcomes；失败含reason/index及前一state（初始化失败为null）。失败步骤和幂等步骤允许出现在trace，但不产生额外accepted history。可选expectedFinalState对全状态比较，expectedFinalDigest只作附加身份比较，不替代重建。

旧save/trace格式不隐式迁移；不能将Native save或技巧研究state直接传入。不得同ID换policy参数，必须新profile/版本和明确迁移设计。原43证据主题及P078/native任务/归属/俘虏/取消链排除不变。

## 交付与验证边界

本版只完成静态代码/文档及示例，不执行测试、编译、build、checker、产品或诊断，也不删除旧测试。原默认全套food文件失败继续保留；历史验收不是本版运行证据。
