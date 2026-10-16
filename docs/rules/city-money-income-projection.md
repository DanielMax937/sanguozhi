# 城市金钱收入：稳定已解析输入投影

> 当前状态（2026-10-16）：本页对应 [PR #60](https://github.com/DanielMax937/sanguozhi/pull/60) 已合并。下文“最终合并树必须另跑”等为当时验证阶段记录，不是本轮运行计划。本次只补文档，未运行测试；旧失败与原证据/支持域保留。


## 定位和证据

公开 API `calculateCityMoneyIncomeProjection` 与 Python `calculate_city_money_income_projection` 计算 `0049E590` 的一次本地城市金钱收入返回值。这里补的是已有收入规则的首次严格工程 API，不是新发现收入规则，也不是月收入实际入账或完整经济系统。

profile 固定为 `city-money-income-stable-resolved-i32-safe-v1`。输出证据级别是 `source-listing-reconstruction`，不声称原 EXE 提取、原游戏执行、stock 或跨版本认证。此项是额外工程覆盖债，不能直接把原有 43 个未决证据主题减为 42，也不推进 P0-78、俘虏或 force/native 事务。

固定来源为 [sjn4048/311MemoryResearch，66e167e40c3440929ec016f3872aefc3486434c1，Func-收支04-计算城市收钱](https://github.com/sjn4048/311MemoryResearch/blob/66e167e40c3440929ec016f3872aefc3486434c1/内存资料/整理/Func-收支04-计算城市收钱.txt)。本轮从只读审计快照复制，逐字节重核 UTF-8/GBK 可逆关系、SHA256 和 Git blob，不声称又独立下载了一次。

- GBK：13,630 bytes；Git blob `0f2c2d72a174d563427230bf207d65b6a639247c`；SHA256 `38b0ac07ba1d67e47add98460a013337d9ed4a97191e7371461ad1d4d89e1e7a`
- UTF-8：14,553 bytes；SHA256 `d1780c1a16fb50a06af16a0ac7acbad06c396bf31ed1ef09432077b91a5d833a`
- 原函数 `[0049E590,0049E745)`：150 条指令、437 bytes；SHA256 `30a5160008a77ce78b8602819a7041f71015fffcb30d2b09221f5abee37a37f1`
- 跳转地址表 `[0049E748,0049E758)`：16 bytes；类型分发表 `[0049E758,0049E76D)`：21 bytes，分别保存和校验
- 中间 `[0049E745,0049E748)` 的 3 bytes 原文未列出。没有补零、拼成伪完整内存样本
- 原文附带的“修改1/修改2”及 inline MOD 建议保留在来源快照里，但不进入原 profile

`83 fe ff` 是 `CMP ESI,-1`；原文多处 `c1 fa 05` 是 `SAR EDX,5`，不是助记符误写的 `SAR DL,5`。快照保留笔误，语义按机器字节解释。

## 输入的前提与严格形状

此 profile 从通过原城市有效性和 owner ID 0..46 的门槛后开始，不实现门槛本身。调用者须给出稳定的已解析观察量，外部调用应正常返回并满足该代码依赖的非易失寄存器和栈条件。这里声明的是支持域前提，不是对未知 helper/ABI 或真实游戏可达性的认证。

输入各层封闭，不能附带 `finalIncome`、`helperIncome`、`rawFacilitySum`、RNG 或整个 GameState。支持有限整值 JSON number；不截断、不接收 boolean/string 代替数字。`1.0` 与 `1` 等价，负零规范成零。

| 字段 | 合同与物理来源 |
|---|---|
| `profile` | 上述唯一 profile，不匹配返回 `unsupported-profile` |
| `baseMoneyWord` | U16 `[city+0x7E]`，0..65535 |
| `slots` | 恰好 30 个有明确观察的槽，顺序与原循环一致 |
| `slots[i] = null` | 原设施 validator `0047A630` 的返回已解析为零，不代表没取得数据 |
| 非 null 的 `facilityTypeWord` | U32 `[facility+8]` |
| 非 null 的 `constructionWord` | U32 `[facility+0x14]`，任何非零位模式都视为完成 |
| 条件 `adjacentMint` | boolean，指定坐标与类型 0x26 的 `0049E500` 返回零/非零谓词；仅实际消费时允许且必需 |
| `resolvedTypeRows` | 闭合对象，允许的键只有字符串 `31/46/47/48/50/51`；无须全给，但路径引用的行不能缺失 |
| 行 `valid:false` | 只能有 `valid`，确实观察到该类型行 validator 为零 |
| 行 `valid:true` | 必须另给 U16 `moneyYieldWord`，来自 `[row+0xC0]` |
| `difficultyWord` | U32 `[07201978]`；仅 0 和 2 特殊，其他所有位模式都是普通倍率 |
| 条件 `cityPlayerPredicate` | 仅 difficulty=2 时必需的 boolean，表示 city virtual48 返回；其他难度出现此字段即拒绝 |
| `securityByte` | 晚期 `[city+0x85]` 的 U8 读值，0..255；只有下限 50，没有上限 100 |

统一类型表保证同一稳定有效类型只有一个收益行，不允许用每个槽的任意最终收益代替来源读取。未使用的行也必须结构合法；缺行不能冒充 `valid:false`。该 profile 不证明未知 helper 在真实执行中不会改变内存，变化中的读值若要支持，必须另立有序 capture profile。

## 局部算法与条件观察

原 DWORD 类型先做模 2^32 减 31，再 unsigned 比较是否超过 20；只有以下六类进入收益路径：

| 原类型 | construction=0 | construction≠0 |
|---|---|---|
| 31、46、47、48 | 跳过，不读取类型行/造币谓词 | 读取自身类型行 |
| 50 | 有效类型回退为 31，读取 31 行 | 读取 50 行 |
| 51 | 有效类型回退为 50，读取 50 行 | 读取 51 行 |
| 其他 U32 | 跳过 | 跳过 |

行 validator 为零则贡献为零。只有有效行的有效类型为 31/50/51 时，才消费 `adjacentMint`：true 则贡献 `floor(3*yield/2)`，false 则贡献 `yield`。46/47/48 不读取造币谓词，不受造币倍率影响。忽略类型、未完成普通设施、invalid 行或特殊市场如果带 `adjacentMint`，一律 `unexpected-field`，即使字段值是 false 或 null 也不能默默忽略。

因此该 API 自己完成分发表、完成状态、升级回退、类型行选择、造币适用范围、奇数收益舍入、30 槽累加和全部难度/治安运算。它并非对外部“已计算最终收入”的薄包装。具体地图几何、邻接设施有效性/归属/完成筛选仍由未恢复的 helper 决定，本 API 不声称实现这些 helper。

## 算术安全域

设 `R = baseMoneyWord + Σcontribution`，`S=max(50,securityByte)`。难度百分比 `q`：0→125；2 且玩家→75；2 且非玩家→125；其他→100。

按原指令顺序，收据记录：

1. `scaledRaw = R*100`
2. 仅难度 0/2：`difficultyProduct = scaledRaw*q`，再 `difficultyAdjusted = trunc(difficultyProduct/100)`；其他难度 product 为 null，adjusted 直接是 scaledRaw
3. `securityProduct = difficultyAdjusted*S`
4. `securityAdjusted = trunc(securityProduct/100)`
5. `returnedIncome = trunc(securityAdjusted/100)`

每个实际的乘法结果必须在 0..2147483647；否则返回 `unsupported-arithmetic-domain`，不能让 Python 无界整数或 JS 精确的大整数中间值偷偷扩大原 signed32 支持域，也不能夹顶。普通难度没有 `R*100*100` 这一乘法，不得添加这种错误门槛。

输入位宽可证明每槽造币贡献≤98302，`R≤3014595`，所以原始加总和 `R*100` 本身不可能在合法输入形状下溢出。保留第一门槛，同时不伪造“合法输入触发该门槛”的测试。可触发的风险是难度分支乘法和之后治安乘法。

只有上述中间乘法全部安全，返回值才可化简为 `floor(R*q*S/10000)`。代表性边界：

- R=67372，difficulty=0，security=255：支持，返回 214748
- R=67373，相同条件：拒绝治安乘法溢出
- R=300000，difficulty=2/player=true，security=50：即使最终式乘积可安全，前面的 R*100*75 已溢出，仍须拒绝
- R=200000，difficulty=0，security=100：拒绝；原 DWORD 回绕模型返回 −179496，无界公式会误给 250000
- R=65535，普通 difficulty=1，security=255：支持，返回 167114，不能偷偷裁到 security=100
- R=429496，普通 difficulty=1，security=50：支持；不存在 R*100*100 的额外门槛

R=200000 可由 base=3395 加三个无造币 yield=65535 槽在字段位宽内构成；这只是标量支持域反例，不宣称 stock 真实剧本必然能达到。

## 收据与拒绝

成功含 `supported/profile/baseMoneyWord/difficultyWord/securityByte`、30 条槽收据、`rawMoney/difficultyPercent/effectiveSecurity/intermediates/returnedIncome/evidence`。每槽固定给出 index、原类型或 null、有效类型或 null、status、原 yield 或 null、mintApplied 和 contribution。status 是 `invalid-slot/ignored-type/unfinished/invalid-type-row/yield` 之一。

不 echo 原 `resolvedTypeRows` 或 input，也不返回任何 mutable input 引用。TS 所有结果递归冻结；Python 为新建 JSON dict/list，调用方可改自己的收据，不会影响原输入、其他收据或内部 evidence。`cityPlayerPredicate` 不重复返回，选定 difficultyPercent 已反映分支。

拒绝只含 `{supported:false,reason,evidence}`，与真实成功返回零明确分离。reason 是 `invalid-input/unexpected-field/unsupported-profile/missing-type-row/missing-adjacent-mint/unsupported-arithmetic-domain`。

验证顺序固定为顶层封闭字段、profile、位宽、难度条件谓词、所有类型行结构、30 槽数组结构、按索引逐槽结构及其实际消费观察量、算术域。TS 仅接受普通/null-prototype data-property 对象和普通密集数组，不调用 getter；Python 仅接受原生 dict/list，拒绝自定义容器子类。普通 JSON Schema 不表达宿主语言 descriptors/prototypes 或算术支持域；嵌入 schema 已表达全部封闭字段、难度条件、被引用行存在性以及跨有效类型行的造币条件消费。

## 验证入口与保留边界

- `python scripts/check_city_money_income.py`：固定来源、完整 listing、独立 schema/profile 哈希、授权声明及材料清单绑定
- `python scripts/check_city_money_income.py --input input.json --output receipt.json`：先校验固定来源，再执行真正的 Python 投影输入；输出文件与 stdout 相同，拒绝重复 JSON key、NaN/Infinity 和未知 CLI 参数
- `python scripts/test_city_money_income_evidence.py`：源/profile/schema/material 变异拒绝、真实 Python 输入与标准 Draft 2020-12 schema、全部 U16 造币 yield、算术边界及全部治安字节
- `python scripts/oracle_city_money_income.py`：独立完整 caller 源字节解释器与公共 Node API 默认样本比对
- `python scripts/oracle_city_money_income.py --broad`：扩大源字节解释器与公共 Node API 比对样本；不等于全部输入 Cartesian 穷举
- `python scripts/oracle_city_money_income.py --mutants`：临时副本上的 TS 行为 mutant，保留未改 public entry 对照，不原地修改产品文件
- oracle 支持 `--output report.json` 保存当次实际报告。执行结果与具体数量以该候选树产生的报告为准；身份守卫变异数量不能冒充行为 mutant 数量，本文件的公式单测也不是独立字节 oracle
- 最终合并树必须另跑完整正式回归；本项局部通过不能替代旧验收，也不代表所有 rawMoney/设施组合 Cartesian 穷举

未实现：城市和 owner getter/validator、stock 原始类型表认证、邻接 helper、收入特技、入账 writer、月初/每旬 scheduler、港关母城与完整收入路径、费用、完整经济命令、状态/RNG/native 事务。20%份额的捕获EAX+晚期type纯标量尾部由[独立返回尾部模块](base-income-return-tail.md)部分补充；本尾部API保持全U32支持域，不依赖本city API的较窄支持域，也不代表港关完整caller闭合。粮食city投影另见[粮食模块](city-food-income-projection.md)。
