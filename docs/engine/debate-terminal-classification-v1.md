# 舌战终局分类 API v1

入口 `evaluateDebateTerminalClassification(input: unknown): DebateTerminalClassificationResultV1`。
常量 `DEBATE_TERMINAL_CLASSIFICATION_POLICY_V1` 与 `DEBATE_TERMINAL_CLASSIFICATION_EVIDENCE_V1`；均由公共index导出。[规则与来源](../rules/debate-terminal-classification-v1.md)。

## 完整输入合同

```ts
{
  schemaVersion: 1,
  profile: 'debate-terminal-classification-reference-v1',
  policies: DEBATE_TERMINAL_CLASSIFICATION_POLICY_V1, // 完整结构，不仅id
  genericOnly: true,
  isTutorial: false,
  winner: 0 | 1,
  hp: [number, number], // team0、team1，安全整数−100..1000
  criticalDisabled: boolean,
  initialCritical: -1,
  initialWinType: 0,
  choice: 0 | 1 | null // 0=PushOn，1=HaveMercy；不允许省略
}
```

恰11字段。胜者对手HP≤0；仅对手−100且未禁用时必须0或1，其他情况必须null。winner/HP均为供应事实，不重新调用判胜或HP核。非JSON输入、负零、NaN、Infinity、不安全或小数数字、symbol、undefined、函数、getter/setter、代理、类实例、循环、稀疏／装饰数组、隐藏属性均拒绝。允许普通/null原型记录、密集标准数组，重复非循环引用独立复制。先用可信Node `process.getBuiltinModule('node:util').types.isProxy`检测代理；运行时没有该检测器则unsupported-runtime，先于输入反射。运行时内建可信是环境前提，不承诺防御被篡改的JS全局。

分离预算：节点512、深度12、单数组16、canonical UTF-8总16384字节；深度起点0，每个值含重复引用单独计节点；键和字符串也先做字节预算，最终canonical再计总数。完整policy远低于这些静态上限。政策相等采用键排序canonical，不依赖属性书写顺序；字符串按原值比较。

## 成功与失败

成功包含 `ok:true,schemaVersion,profile,policy,evidence,state,receipt,nextCheckpoint:'closing-pending'`。

state仅有genericOnly、isTutorial、winner、hp、criticalDisabled、critical(−1|0|1)、winType(0|1|2)。hp为新的二元数组，不改调用者HP。receipt包含winner、loser、losingHp、criticalDisabled、canCritical、choice、initialCritical、finalCritical、initialWinType、finalWinType、classification(`Normal|PushOn|HaveMercy`)、calcWinTypeApplied、externalRngConsumed=0、closingExecuted=false。

|门槛|choice|critical|winType|classification|calcWinTypeApplied|
|---|---|---|---|---|---|
|不符合|null|−1|0|Normal|false|
|符合|0|0|1|PushOn|true|
|符合|1|1|2|HaveMercy|true|

冻结成功/失败及嵌套对象；不改变HP、winner或外部对象；无回调、外部I/O、随机或后继阶段调用。

失败只有 `ok:false,reason`，无state/receipt；reason为unsupported-runtime、input-limit、malformed-data、unknown-field、unsupported-profile、unsupported-policy、invalid-checkpoint、invalid-choice、choice-required、choice-forbidden。顺序为安全分离→闭合顶层→版本profile→全policy→generic/教程/初值/开关→winner→hp形状和域→loser非正→choice枚举→门槛与choice匹配。多项同时错误可能先报较前原因；不承诺枚举所有错误。未预期反射错误安全转malformed-data。

## 有界集成

只投影PR127或PR126真实成功终局的winner及两个hp；不能直接把整个state/result传入。补齐其余显式值，且initialCritical=−1与initialWinType=0的初始状态必须由调用者保证。无旧会话适配、保存加载、完整阶段调度，也不验证上游签名/真实性。返回的closing-pending仅为后续入口标记，不执行Closing或承诺其未来结果不变。

仅静态文本阅读、人工纸面推导和字节核对；未运行测试、编译、typecheck、build、validator、checker、候选、来源、场景或 replay。静态审阅不证明运行正确或原生 PK／Vanilla 等价。43证据主题／45历史快照不减；P078及全部依赖保持排除。
