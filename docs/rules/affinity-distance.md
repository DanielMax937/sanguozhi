# 相性距离：已解析双uint8的独立教程数值核

本批从PR #51合并后的main `2c38f06e2a3106cf25ad47e02458a2fd72c69a45` 全新重建。它不是旧候选 `d8d3148`，不能沿用旧候选或历史PR的验收。范围仅为 `calculateAffinityDistance` 独立纯函数与来源、测试、文档；不接自然忠诚或登用caller，不修改Train、EndTurn、state/save/replay，不包含P0-78及其capture/force灭亡/native事务依赖。

## 固定来源与证据等级

- 原仓库：`sjn4048/311MemoryResearch`，commit `66e167e40c3440929ec016f3872aefc3486434c1`
- [教程原文](https://github.com/sjn4048/311MemoryResearch/blob/66e167e40c3440929ec016f3872aefc3486434c1/SireCustomizedPackageDev/README.md)：`SireCustomizedPackageDev/README.md`
- [完整教程快照](../sources/affinity-distance-tutorial-original.md)：33369 bytes，SHA-256 `d5e496619ce21736861f796223523e3897591a2b3374e482aa0505b03606acb3`，Git blob `82420492d65150f217effd8cb6b93febdf1c3c2d`
- [证据JSON](../sources/affinity-distance.json)与[闭合schema](../sources/affinity-distance.schema.json)
- 该教程的 `00489F80..00489FD7` 提供37条地址助记符，没有此函数的opcode bytes。邻近自定义包的机器码不能填补该缺失，按地址间距猜测编码也不构成原机器码证据

证据固定为 `tutorial-source-projection`，profile为 `affinity-distance-tutorial-u8-v1`。来源记录和每次结果保留 `opcodeBytes=null`、`machineCodeVerified=false`、`stockOriginalVerified=false`、`originalExecutableExecuted=false`、`s1CallerIntegrated=false`、`loyaltyIntegrated=false`、`recruitmentIntegrated=false`。

`originalRange`为 `00489F80..00489FD7`，`scope`为 `resolved unsigned affinity bytes; numerical return only`。完整文本与结构化逐行投影支持来源可核验性，不是byte-exact、clean-stock PC-PK1.1认证、S1同源证明或原EXE运行记录。Vanilla、PS2/Wii和MOD等价也未证。

## 输入与返回合同

输入的标准Draft2020-12 schema位于相性元数据 `metadata.inputSchema`，即 `docs/sources/affinity-distance.json#/inputSchema`：闭合三个字段、profile常量、两个integer 0..255。`affinity-distance.schema.json`校验来源元数据，不能把其变异测试当作输入schema验证；JavaScript own-data字段及非JSON值的拒绝另由API测试覆盖。

`calculateAffinityDistance`只接受显式profile及两个已解析uint8：`sourceAffinityByte`、`targetAffinityByte`，每个为0..255的整数。没有默认profile，不接受native pointer、人物ID、回调或由本函数查询人物表。拒绝结果为 `supported:false`，含原因与相同证据；API输入拒绝不模拟原生非法ID/指针路径。

支持结果为 `supported:true`，保留profile、两个输入、`absoluteDifference`、`complement`、`signedComparisonBranch`、`returnedSigned32`、`returnedEax`、`returnedAl`与evidence。计算如下：

```text
d = abs(sourceAffinityByte - targetAffinityByte)
absoluteDifference = d
complement = 150 - d
signedComparisonBranch = d < complement ? 'keep-d' : 'use-complement'
returnedSigned32 = min(d, complement)
returnedEax = returnedSigned32 的uint32位模式
returnedAl = returnedEax & 255
```

`00489FB3`以MOVZX读目标 `[esi+69h]`，`00489FB7`以MOVZX读来源 `[edi+69h]`；差值是signed32运算，`JNS`决定是否NEG。随后以150减绝对差，`00489FCA` 的 `JL`作signed比较。没有mod150或非负夹取，也不把所有byte强制收缩到正常0..149域。

| 输入 | d | 150-d | signedComparisonBranch | returnedSigned32 | returnedEax | returnedAl |
|---|---:|---:|---|---:|---:|---:|
| 1,149 | 148 | 2 | use-complement | 2 | 2 | 2 |
| 0,75 | 75 | 75 | use-complement | 75 | 75 | 75 |
| 0,150 | 150 | 0 | use-complement | 0 | 0 | 0 |
| 0,151 | 151 | -1 | use-complement | -1 | 4294967295 | 255 |
| 0,255 | 255 | -105 | use-complement | -105 | 4294967191 | 151 |
| 255,255 | 0 | 150 | keep-d | 0 | 0 | 0 |

d=75时虽然两个数相同，`JL`不跳，故receipt必须是 `use-complement`。正常0..149的22500个有序组合结果为0..75；完整uint8域65536个有序组合中11130个返回负signed32。把负数夹零、只保留AL、把AL解释为完整signed32、按unsigned比较或预先mod150都会改变支持域合同。

## 完整教程路径与生产API的分层

教程还列出原生参数范围检查、`GetPersonPtr`、`IsLegalPtr`及返回恢复。独立source oracle解释这37条助记符，helper只由显式测试观测代替；它不恢复这些callee，不运行游戏或原生机器码。完整列表有5个条件分支：`00489F89 JL`、`00489F90 JLE`、`00489FB1 JZ`、`00489FBD JNS`、`00489FCA JL`，应覆盖各自taken/not-taken共10种结果。

原列表的非法路径执行 `xor al,al`，不能笼统写成完整EAX清零。非法ID、合法ID但无效目标指针的栈/寄存器行为属于source oracle边界反例；生产API不接受这些native输入，也不把API拒绝等同于原生返回零。两个byte读取之前的有效性/解析、可变内存及对象身份均留给将来的独立caller研究。

## 自然忠诚与登用仍独立

[自然忠诚候选静态证据](natural-loyalty-candidate-boundary.md)仍绑定另一份 `0058E510..0058E82B` 来源：238条/796 bytes、两套MOD隔离、18条候选gate不变。它只证明俘虏绕过三条普通候选，以及普通候选的unsigned AL>25、低义理高野望、`004889E0`完整EAX非零三选一。

新的教程数值投影不能自动证明该caller调用的callee与教程/S1同源。即使0/151的独立计算产生AL255，也不把该结果直接接入忠诚或登用；caller守卫仍使用观测到的helper返回。`004889E0`完整语义、`004A6CF0` writer、RNG/降量端到端、完整调度与stock仍缺。完整登用判定也不因这个独立核而完成。

## 验证与本批状态

可复跑命令：

```sh
python -B scripts/check_affinity_distance.py
python -B scripts/affinity_distance_source_oracle.py --exhaustive
python -B scripts/check_natural_loyalty_candidate_boundary.py
python -B scripts/test_natural_loyalty_candidate_boundary.py
node --test packages/engine/test/natural-loyalty-source-data.test.mjs
npm run check
```

验收应分别核来源hash/逐行schema、完整37条助记符解释、5分支10结果、65536个byte组合（含22500正常组合与11130负返回）、输入拒绝与证据不可变性，以及自然忠诚旧gate/MOD回归。数字是明确覆盖域，不是预填通过记录。所有本批通过结论须由当前重建树的实际命令日志及独立审查支持，历史聚合不能代替；发布状态以实际远端核验为准。
