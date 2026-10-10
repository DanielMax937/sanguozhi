# 探索搜金：已捕获返回值的 caller 整数投影

## 本批边界

本地候选基于已交付 PR #54 的 main `cb76e148f35b519283cc296361b507674d0fff3a`。
`calculateSearchGoldCallerProjection` / `search-gold-caller-resolved-v1` 仅解释 RNG 返回之后的 caller 算术与分支，证据等级 `source-listing-reconstruction`。输入是已经捕获的寄存器观测，不是城市/武将对象、指针、ID、种子或回调；输出不是实际入账金钱。本批不接新命令，Train、EndTurn、存档与重放不变。正式新树聚合结果在外部不可改写收据中单列，历史 PR #54 的158项不能代替本树验收。本地实现不授权 GitHub 发布、PR 或合并。

## 来源与边界

固定来源 [sjn4048/311MemoryResearch](https://github.com/sjn4048/311MemoryResearch/blob/66e167e40c3440929ec016f3872aefc3486434c1/内存资料/整理/Func-人才06-执行探索.txt)，commit `66e167e40c3440929ec016f3872aefc3486434c1`。
继续复用仓库中完整原 GBK 与逐字 UTF8 快照，原空白、注释不改。

- GBK：42874 bytes；SHA256 `b8fb7965114ebc0d26cbb27058367c3a54ff47972bff9ab8dfc9e61867f8560a`
- Git blob：`82bff04db2dae9ae0787e1e71ad72f1b4e6852de`
- UTF8：44634 bytes；SHA256 `5cbca6abd2d96ccf6980f26bee3eb4fd31b0baa0a942d65f5efb0d4c30220f0c`
- `005D5BA6 <= PC < 005D5BF8`：29条、82所列字节，连续；字节SHA256 `e4ecb097b0d272552d3203c1f2a60f834e7c0fc50f32a032f17c4f50f4135325`
- 原获取为 GitHub connector 解码文本，GBK 重编码后匹配固定 blob，并非直接 raw 下载。Apache-2.0 署名与许可沿用既有固定文件

所列四个 getter CALL 被明确逐调用点捕获值替代：005D5BBE/00486C80、005D5BCB/00486D30，以及仅裁剪路径的005D5BDA/00486C80、005D5BE3/00486D30。这是观测驱动解释，不执行或重构 helper；不能据此推定 ABI、副作用或实际观测可达性。

上游魅力 helper 与 RNG CALL 00472150 不执行；出口005D5BF8 CALL005D3F80、005D5C02 CALL005D4160仅认证目标并在调用前停止。金钱/未发现 handler、经验功勋、消息与状态写入均未恢复。

## 封闭输入与收据

必填自身数据字段为 `profile`、`rngEax`、`firstGold`、`firstCapacity`。后三者为0..4294967295整数。仅需裁剪时才要求 `secondRead:{gold,capacity}`；不裁剪时此字段必须不存在，显式undefined也拒绝。二轮不允许偷用首轮。两个对象均拒绝额外字符串/symbol、继承字段、自定义prototype、getter/setter、类型转换、非整数或越界值。null prototype与非枚举自身数据字段可接受，负零规范化为0。拒绝是工程合同，不模拟原程序非法指针行为。

收据保留low16、初拟数量、ADD32结果、裁剪分支、最终unsigned/signed EAX、三个分支trace、依实际顺序的getter调用点/目标/观测，以及终止PC、handler目标与goldHandlerArgument（未发现时null）。所有输出深冻结，输入对象不被冻结或改写。没有最终奖励保证。

## 精确算术

1. MOVZX EAX,AX，仅取 RNG EAX 低16位，零扩展
2. `proposedAmount=min(rngLow16,80)`；JG严格大于80时跳过MOV，80恰好不跳
3. 首轮gold加proposedAmount，ADD32回绕为 `firstSumU32`
4. 首轮capacity与回绕sum按signed32比较；capacity>=sum不裁剪，恢复proposedAmount
5. 否则重新观察gold和capacity，以二轮值执行SUB32回绕
6. 将amountU32视作signed32，严格小于30走nothing，否则把EAX作为参数交给gold-handler；本API在调用之前停止

不可将上述过程普遍简化成min(roll,capacity-gold)，不可最后再夹80、夹零或补最低30。完整captured-u32域保留溢出和负返回，不限制最终amount为0..80。

关键反例：

- roll80、firstGold=INT_MAX、firstCapacity=INT_MAX：ADD后signed sum为负，不裁剪，amount80
- roll80、首轮100/0，二轮0/500：amount500，不能复用首轮或最后夹80
- 同首轮，二轮0xffffffff/29：SUB回绕为30，走gold-handler
- 首轮100/120、二轮100/120：amount20，走nothing，没有最低奖励30
- 二轮100/0：amountU32=4294967196，amountSigned=-100，走nothing
- RNG EAX0x0001001e取30；0x00008000零扩展后夹80，不能取AL或sign-extend AX

## 独立验收设计

独立Python oracle只按原字节解码并逐指令执行32位寄存器、保存槽、CMP标志、JG/JNL/JL、CALL-site捕获和终止PC，期望不调用生产公式。验证实际TypeScript导出而非复制替代模型。覆盖全65536 low16、高16变换、81个cap值、signed边界、ADD/SUB回绕、两轮不同观测、精确调用序列与分支trace。封闭schema/source/metadata变异、API拒绝与真实TypeScript算术变异单列。

JG改JGE在80相等时数值结果相同；只能用分支trace或冻结来源字节辨别，不能虚报纯数值mutant被杀死。开发失败/修复记录与正式冻结后的单attempt收据分开保存，不追改历史结果。

## 仍然开放

00472150 RNG的分布、种子、消耗与魅力关系；00486C80/00486D30 helper实现与可变原生对象语义；前置人才/事件/宝物选择；两个handler及真实奖励writer、AP、调度和完整探索命令；clean-stock原性、精确patch和跨版本等价。旧search-talent与treasure-roll profile中的历史未恢复标志不改。P0-78及其capture/force/native事务依赖继续排除。
