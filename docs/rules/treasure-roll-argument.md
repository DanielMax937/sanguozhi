# 探索宝物：已选候选的 roll 参数纯核

本批基于 PR #53 已合并 main `ec8baea67f4ad36a27af40220ce7596c62065d58`，为新的本地候选，未发布。证据等级 `source-listing-reconstruction`；只恢复随机调用之前的参数，不能称百分比、最终成功概率或完整搜宝行为。历史 PR #53 的 `searchTreasureRecovered=false` 保持原样，表示其原任务范围。

## 合同与接口

`calculateTreasureRollArgument` 从 engine 公共入口导出，来源常量为 `TREASURE_ROLL_ARGUMENT`。只接受自身数据属性组成的封闭对象：

- `profile: 'treasure-roll-resolved-v1'`
- `treasureValueU8`：0..255 整数，已经选定候选对象 `+0x3C` 的稳定无符号 byte 观测

不接受指针、ID、helper、RNG或回调；没有类型转换，不执行访问器，不读取继承字段，不接受 Symbol/额外字段。允许 null prototype 与非枚举自身数据属性。输入负零统一为0。拒绝为工程合同拒绝，不能冒充原游戏无效指针路径。

成功收据包含冻结的输入、`numerator`、`quotient`、`rollArgument`、`branch`、证据引用；无输入或游戏状态写入，不新增命令，不接 Train/EndTurn、存档或重放。

1. numerator = 61 - treasureValueU8，范围 -194..61
2. quotient = trunc(numerator / 20)，向零取整，范围 -9..3；负零规范为0
3. rollArgument = max(1, quotient)
4. quotient < 1 时 branch=`minimum-clamp`，否则为 `quotient`。quotient=1 走原 JNL 分支，不标作夹取

| value | numerator | quotient | rollArgument | branch |
|---|---:|---:|---:|---|
| 0 / 1 | 61 / 60 | 3 | 3 | quotient |
| 2 / 21 | 59 / 40 | 2 | 2 | quotient |
| 22 / 41 | 39 / 20 | 1 | 1 | quotient |
| 42 / 61 | 19 / 0 | 0 | 1 | minimum-clamp |
| 62 / 80 | -1 / -19 | 0 | 1 | minimum-clamp |
| 81 / 255 | -20 / -194 | -1 / -9 | 1 | minimum-clamp |

最终分档：value 0..1 →3（2项）；2..21 →2（20项）；22..255 →1（234项）。这三个数是传入未知随机helper的参数，不由本任务推导其实际分布或成功率。

## 来源、字节与边界

固定来源 [sjn4048/311MemoryResearch listing](https://github.com/sjn4048/311MemoryResearch/blob/66e167e40c3440929ec016f3872aefc3486434c1/内存资料/整理/Func-人才06-执行探索.txt#L166-L179)，commit `66e167e40c3440929ec016f3872aefc3486434c1`，Git blob `82bff04db2dae9ae0787e1e71ad72f1b4e6852de`。Apache-2.0，署名 `sjn4048/311MemoryResearch`，保留已有许可证 `docs/sources/production-price-LICENSE.txt`。

来源由 GitHub connector 返回解码文本，原样重编码GBK后42874 bytes与固定Git blob匹配，并非raw直接下载；UTF8快照44634 bytes。完整原文分别保存在 `docs/sources/treasure-search-original.gbk` 和 `.txt`，包括caller、注释及不在本核内的探索分支。完整快照不意味着这些其他代码已恢复。

- 计算范围 `005D5B45 <= PC < 005D5B6B`：12条、38所列字节，内无CALL
- `005D5B6B PUSH EAX` 为输出交接；计入该条为13条、39字节
- 下一条 `005D5B6C CALL 004721D0` 只校验目标，绝不执行或模拟随机返回
- 指令原注 `005D5B57 sar dl,03` 保留；单列纠错：`C1 FA 03` 是32位 `SAR EDX,3`，不是DL
- signed `IMUL ECX` 使用乘数 `0x66666667` 的高32位，随后 SAR3、复制EDX、逻辑SHR31和ADD符号修正，得到向零除20；CMP1/JNL 实现最低1

字节验证只证明与公开研究文档一致，不认证clean-stock EXE、补丁版本、真实执行或跨版本同一性。

## 验证及使用

```
node --input-type=module -e "import {calculateTreasureRollArgument as f} from './packages/engine/src/index.ts'; console.log(f({profile:'treasure-roll-resolved-v1',treasureValueU8:62}));"
node --test packages/engine/test/treasure-roll-argument.test.mjs
python -B scripts/check_treasure_roll.py
python -B scripts/treasure_roll_source_oracle.py
python -B scripts/treasure_roll_source_oracle.py --exhaustive
python -B scripts/treasure_roll_source_oracle.py --output /tmp/treasure-roll-report.json
```

上述为纯核/证据CLI，无新增游戏命令。oracle直接对照生产TypeScript，独立按所列字节解释寄存器、signed IMUL高字、移位、符号修正及分支；覆盖全部256输入，核验两个分支及PUSH交接，停在CALL之前。闭合schema和来源身份另由独立固定合同检查。

指令宽度测试另有边界：合法输入的IMUL高字为[-78,24]，均能由signed8表达，因此真实SAR DL,3变体在256输入的最终寄存器数值上等价；由固定C1源字节拒绝该变体，并用域外EDX=0x100的独立指令宽度探针区分，不能声称合法输入杀死这个数值等价变体。

关键陷阱：value≥62 时 `floor` 与 `trunc` 的差异会被最终最低1遮蔽；必须同时检查中间 quotient。测试包含0/1/2、21/22、41/42、61/62、255和负商边界；源字节/指令、证据/schema、API拒绝与实际TS实现分别做变异测试。专项通过不代替全套回归；全新冻结验收与恢复包记录在交付收据，不沿用旧测试结果。

## 仍然开放

`004CDFB0`候选过滤、`005D51D0`选择、`0047A630`验证；`004721D0`随机语义、分布、种子与消耗；前序人才/事件分支造成的整次探索条件概率；`005D3D90`归属与奖励writer、AP、完整命令/调度；native解析和可变观测；搜金；原版精确版本与跨版本认证，均未关闭。

P0-78及依赖capture/force/native事务继续排除。本项不扩大任何历史证据等级，也不宣称缺口清零。
