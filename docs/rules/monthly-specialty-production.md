# 每月特产兵装自动生产：显式观测数量请求核

> 当前交付状态（2026-10-16）：本页对应 [PR #65](https://github.com/DanielMax937/sanguozhi/pull/65) 已合并。下文“候选”“未发布”“发布前/合并后须验证”等措辞及运行数字保留其原日期语境，不是当前发布条件或本次重新验证结果。该PR的有限支持域、未实现分支和来源等级不因合并扩大；本文档回溯未运行测试。涉及原生事务的历史内容仅作证据记录，不恢复P078及其依赖。


2026-10-15，本独立候选基线 `124c033eccd49b12a1bd2cf2dc6824b1a5536329`。这是新可调用的逐兵种数量计算，不是完整月度生产或实际入库；新树验收、独审和发布另行记录，不引用历史194/179等通过数。原43组未决证据主题不减；P0-78及其全部依赖排除。

## 可调用能力与合同

- TypeScript：`calculateMonthlySpecialtyProduction`，从 engine public index 导出
- Python：`scripts/check_monthly_specialty_production.py` 的 `calculate_monthly_specialty_production`；返回递归不可变mapping/tuple，`receipt_to_json`返回独立可变JSON副本
- 输入profile：`monthly-specialty-production-observed-v1`
- 算术profile：`comment-f32-rne-trunc-v1`；当前只支持这个明确命名、可由未来新版本替换的政策，不接受任意浮点数、未知舍入模式或自定义回调
- `equipmentType`：已捕获的外层ESI循环成员1..4。完整来源00590A6A初始化1，00590BA7..BAB递增并比较4。本API不会遍历兵种或查城市
- `specialtyEaxU32`：00590A7E特产helper完整返回EAX，入口00590A83仅消费AL
- 仅当特产AL非零，必须提供精确30槽`slots`。每槽必有`validityEaxU32`；其完整EAX为0时禁止completion字段，非0时必须有独立`correspondingCompletedEaxU32`。completion完整EAX非0才计数
- 只有完成计数大于0时才必须提供`governorPoliticsEaxU32`；消费其AL。计数0时禁止该字段。特产AL为0时禁止slots及politics，绝不替早返路径索要后续观测

所有word必须在U32范围。TS拒绝非整数/非有限数、额外字段、symbol、自定义原型、访问器、隐藏字段、稀疏/多槽数组；不调用输入getter。普通Object/null原型对象可用，数组必须是标准Array原型。Python直接API要求确切built-in dict/list/str/int，拒绝bool、float和子类；JSON概念上的整数如1.0可由TS接受，Python直接API仍明确只收int，无隐式规范化。两端接收的是每次调用分别捕获的值，未声称helper真实行为、指针解析或可达性。任意带副作用的JS Proxy不在数据对象合同内。

收据复制观测并递归冻结，包含设备类型、已观察返回的顺序、实际消费宽度、计数、factor tier/binary32 bits、政治AL与整数项、转换前值、政策下的整数转换、是否执行cap以及nullable quantity request。`not-specialty`和`no-completed-facilities`没有quantity request，不能把未发生请求伪造为实际生产0。TS的成功路径与capture kind是discriminated unions，证据和导出profile也递归readonly。

`capturedReturns`不是完整CALL清单：0049CF50类型映射调用存在，但返回在本切片不参与数量计算，故不接受虚构mapper EAX；00707A74按下述政策计算，未伪造原helper观测。specialty返回来自切片入口前紧邻的00590A7E，其余输入均对应本切片实际消费。quantity request仅标记00590B82的PUSH EAX值和00590B83续点，未组装完整writer参数。

## 来源事实与显式算术假设分层

复用原已固定来源：sjn4048/311MemoryResearch，commit `66e167e40c3440929ec016f3872aefc3486434c1`，GBK Git blob `028fae66ba44f70716951edd9fae51420780cea0`。原GBK/TXT、572条/1939 bytes全listing及Apache-2.0许可均保持未修改。

新独立切片 `[00590A83,00590B83)`：71条/256 bytes，SHA-256 `0269b7298f452d1cebd6c22f8a15eca5606b99d51709ee7120974828b9f3f3fb`，包括quantity PUSH，停在PUSH ESI之前。新manifest引用复用材料及自己的slice；离线checker核验固定元数据/来源身份及objdump边界。API收据的`runtimeSourceRehashPerformed:false`是事实，不把离线核验冒充运行时重新认证。

重构的opcode/control-flow事实：

1. 特产只测AL，槽有效和对应且完成helper都测完整EAX；扫描30槽。完成计数0跳过生产
2. 计数1直接存inline `0x3F800000`；2..3先减1；4..7先减3；8..30先减7
3. 非count1的factor只有00590B46一次FSTP DWORD；之后政治AL unsigned右移1，再加60
4. 使用保存factor乘政治项，再乘来源内存常量；调用未知body的00707A74；以signed CMP/JLE执行1500上限；最后PUSH EAX

以下仅属于可替换的算术政策，不是恢复到的内存或native认证：

- 内存常量0.5、1、0.25、2、0.1、3来自source COMMENT，假定其binary32 words依次为3F000000/3F800000/3E800000/40000000/3DCCCCCD/40400000。只有count1 inline1.0字节有直接opcode证据
- factor FSTP假定round-to-nearest-even；最终未知converter假定向零截断。所选正数支持域此处等价floor，但不能升级为原converter事实
- 政策formula：count1=1；2..3为1+(count-1)×0.5；4..7为2+(count-3)×0.25；8..30为3+(count-7)×binary32(0.1)。保存factor为binary32后计算 `(floor(politicsAL/2)+60) × savedFactor × 3`，向零转换，再signed上cap1500
- 源注释三条公式都遗漏count offset；00590B27的注释还错标常量地址0074E718，实际operand为0077B338。保留原文件，不据错注释实现
- 中间运算按本有限域精确dyadic数学执行，binary64足够；没有每乘一次就round32，也不声称任意x87精度环境等价。独立Fraction oracle穷举证明pre-store最大30有效位，store后两乘最大34有效位，均少于53
- 关键见证：count8、politicsAL80，保存factor bits40466666，值3.0999999046325684；转换前929.9999713897705，数量929。十进制闭式或每乘round32可误算930

收据证据级别为`source-listing-control-flow-with-provisional-arithmetic`，明确分开source-listing reconstruction和documented arithmetic assumptions。所选域均非负，signed cap是来源事实；不以不可达负数测试或负数mutant宣称原native cap执行已认证。

## 可复现验证

```sh
npm run typecheck
node --test packages/engine/test/monthly-specialty-production.test.mjs
python3 scripts/check_monthly_specialty_production.py
python3 scripts/test_monthly_specialty_production_evidence.py
python3 scripts/oracle_monthly_specialty_production.py
python3 scripts/oracle_monthly_specialty_production.py --mutants
```

oracle独立用Fraction和整数ties-to-even推导gold，绝不调用产品计算来制造expected。31×256共7936数学格中count0的256格折叠为一个合法无politics API形状；正计数API穷举7680格，另外覆盖完整U32 helper words、四设备类型、最后槽及每槽独立位置。两语言比较完整收据；schema按明确报告的步长及全部额外helper/slot probes验证。其控制流期望是认证来源导出的模型，不是x86字节执行器或native执行。

真实TS可执行mutant在临时目录改产品逻辑、每个先跑未改控制再比较行为；startup/类型/schema/来源错误不当作行为击杀。17项中13项numerical/branch、4项receipt-only（连续分段边界3/7的tier、cap恰等1500、slot顺序）。JSON/schema/type/来源身份否定测试另计，证据不混加。新树更广适用回归由主验收记录。

## 明确保留的缺口

太守/城市/特产/helper内部及ABI、真实常量字节、converter与浮点控制环境、前置owner/force、完整月度循环、库存容量与实际增加量、writer/command/scheduler/EndTurn/RNG和stock PK/Vanilla/console认证均未完成。本核不接训练沙盒、不调用其他财政/生产API，不新增P0-78及依赖。
