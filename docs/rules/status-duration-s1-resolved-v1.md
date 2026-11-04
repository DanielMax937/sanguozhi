# S1 同异常状态持续值投影

2026-11-04。`same-abnormal-duration-s1-resolved-v1`。这是固定 MOD-associated IDB 来源的纯 resolved-input 投影，不是已认证原版规则，不接现有计略 service、world、存档或时钟。源码位于 [status-duration-s1.ts](../../packages/engine/src/status-duration-s1.ts)，证据位于 [source JSON](../sources/status-duration-s1.json) 与 [逐指令材料](../sources/status-duration-s1/functions.asm.txt)。

## 已读来源与证据边界

[固定公开 ZIP](https://github.com/sjn4048/311MemoryResearch/blob/66e167e40c3440929ec016f3872aefc3486434c1/IDA%20Related/san11pk.zip) 本身含血色5.0公测路径。因此只能表述该档案的 S1 语义，不能认定 clean stock、PC-PK1.1完整版本认证或跨平台等价。公开 dispatcher listing 的已比对237条指令/603字节与档案一致，并不认证未比对部分。

005917D0 与00591A20在成功分支分别处理伪报/扰乱。其第三参数为critical，由 dispatcher 中EBX传入。critical非零时持续增量直接为3；普通分支调用00472150(2)，零扩展AX后加1。该RNG在此参数下返回0或1，因此增量为1或2；本模块只接收已解析结果，不模拟全局seed或宣称运行概率是50/50。70/30旧fallback不能据此当来源事实。

004AEA70在新旧状态相同的分支跳过异状态展示/状态更改链，把增量夹到1..5后交004AE5D0；该helper把旧remaining byte与增量相加并夹0..5。本投影限定合法输入，因此结果是 `min(5, currentRemaining + increment)`。并非 `max(currentRemaining, increment)`。其他状态转换有额外调用，未将其副作用核清，全部不在本模块范围。

## 输入合同

`projectSameAbnormalDurationS1(input)`仅投影一次已经成功、资格已经外部解析、既有状态与本次请求状态相同的计略效果：

- profile必须为上面的完整具名值；不自动选择或升级旧协议。
- sameStatus只允许1（扰乱/混乱）或2（伪报），表示新旧状态都等于该值；不提供其他状态字段，也不支持转换、解除或失败计略。
- currentRemaining必须是0..5安全整数，拒绝负零；允许0作为原始解析值，但不验证该状态/旬数组合在世界中是否可达。
- critical必须是严格布尔。true时恰好4个字段，禁止附加durationRngResult。false时必须恰好5个字段，durationRngResult必须是整数0或1。
- 使用既有 descriptor-only bounded data snapshot，不触发输入getter或proxy trap、不修改/冻结调用方对象。无Node builtin isProxy支持时对象输入失败关闭。继承该边界的预算、纯数据和有限整数限制，失败统一invalid-data；通过数据边界后按本模块形状/profile/字段检查返回明确原因。
- 未证明的指针、资格、成功率、暴击率、人员、费用、奖励、全局RNG、其他异常状态、当前值超过5、跨状态及归属均不接受。

## 输出合同

只返回冻结的纯结果：增量increment、夹限后的newRemaining、实际appliedIncrement、clamped、所用durationRngResult或null，以及来源标记。durationRngInputUsed只是消费外部解析值，rngDrawn始终false；stateWritten始终false。它不是执行收据或可信state，重复调用无去重/世界效果。

本文件导出函数与类型，但未增加包根index导出：避免触碰当前其他候选的index，也不把研究投影默认接入产品API。未来公开入口需另行明确接线范围。

## 静态算术验收点（未运行）

- ordinary RNG0→增量1；RNG1→增量2；critical→增量3且无duration RNG输入。
- old4+2→5，实际+1；old5+3→5，实际+0；old2+1→3，不能沿用max得2。
- old0+3→3，限本输入域；不据此证明世界可达。
- 不合法status、负零/小数/范围、额外字段、critical附带RNG或ordinary缺RNG皆拒绝。
- 原商人六文件、旧70/30及max兼容fallback、现有service/world/存档/index保持不变。

未运行测试、类型检查、构建、候选或原程序；静态阅读不等于运行验收。此候选尚未发布，不能称已交付或原版问题已解决。
