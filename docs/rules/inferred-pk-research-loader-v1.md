# 隐藏研究推断抽签 → 新局PK实际状态 v1

2026-10-28。对应T36；代码 [inferred-pk-research-loader.ts](../../packages/engine/src/inferred-pk-research-loader.ts)。

此前 `selectInferredHiddenResearch(seed)` 仅返回选五槽/每槽一候选的显式LCG结果。本批 `createInferredSeededPkAbilityLifecycle(baseline,seed)` 把结果真正交给现有 `createPkAbilityLifecycle`，返回可供旧 `executePkAbilityCommand` 使用的**新局状态**。它不是另造研究系统，也不修改任何正在进行的研究或存档。

## 资料、推断与入口

| 部分 | 具体采用 | 边界 |
|---|---|---|
| 隐藏目录 | 既有10槽、每槽5候选，取5个不同槽各1候选 | 来源/目录等级沿现有ability-research与[推断请求规则](inferred-rule-requests-v1.md)，不新造第11槽或新能力。 |
| 抽签 | 复用具名LCG32、槽ID稳定序、候选tableColumn序、floor(word×bound/2^32) | 工程可重放选择，非原RNG、非严格均匀证明。算法/抽签记录不在本批悄改。 |
| 新局其余字段 | 原baseline经旧create完整校验后原样保留 | 不生成史实人物/势力/初值，不修改资格、费用、奖励或时钟policy。 |
| 实际消费者 | 第二次调用旧create，以抽签结果替换新scenario的hiddenSelections | 返回真实新state；旧create/execute/save/load合同不改、默认仍为原显式选择模式。 |

## 精确流程

1. seed为旧selector接受的u32整数，负零/越界/非整数等失败；选项仅在局部计算，无全球随机源状态。
2. baseline须是**完整有效的既有PkAbilityScenarioV1**，包括原先五项有效hiddenSelections。调用旧create严格分离并校验后，读取其冻结initialScenario；不信任任意外部快照，不接受PkAbilityState当scenario绕过历史。
3. 复制已校验initialScenario，仅替换hiddenSelections；再次调用旧create，生成revision0的新局（turn/date仍沿baseline，不偷偷归零调用方明确初始日期）。
4. 成功返回state、selection（含seed/finalWord/draws/具名算法/具体选项）、replacedBaselineSelections，以及消费者名称。失败只返回reason，不返回中间状态。

先验证baseline再替换，意味着用户不能把无效旧hidden列表当占位符传入，也不会静默“修复”其他错误。要求完整有效baseline是本factory的保守工程合同，不是原游戏加载限制。

输入不修改；state与选项由原消费者/selector深冻结，外层也冻结。成功只表示按静态代码将建立此有限状态，本轮没有执行候选，运行正确性未验证。

## 保存、重放与审计

继续使用原 `savePkAbilityLifecycle` / `loadPkAbilityLifecycle`。生成的具体hiddenSelections已写入新initialScenario及新state，旧重放按这些具体选项重建，不再重新抽签，因此读档不会刷新隐藏树。

seed和draws属于factory返回的额外审计，不嵌入旧save schema。要核查“为何选了这五项”，调用者需另存返回selection；仅保留旧save也可恢复已选树和后续研究，但不能声称原save包含这个生成seed。重复调用同一baseline/seed生成相同初值是可重现factory，不是为现有世界追加任务或重新roll。

## 明确排除

不写世界RNG、人物归属、P078及依赖、Closing、伤亡；不自动开始或完成研究，不执行TP/功绩/费用/奖励，也不开放既有服务未支持的能力。后续主动执行旧研究命令仍受原服务全部政策限制。本factory初始化并不是一次研究结算。

原隐藏RNG/原始剧本事实仍未知，推断不能认证native。旧显式五选默认、历史保存和原来源文本不改。仅静态审阅，未运行测试、typecheck、编译、build或代码。
