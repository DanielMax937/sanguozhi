# 每月城市粮食 harvest→levy PUSH EDI 参数投影

> 当前交付状态（2026-10-16）：本页对应 [PR #63](https://github.com/DanielMax937/sanguozhi/pull/63) 已合并。下文“候选”“未发布”“发布前/合并后须验证”等措辞及运行数字保留其原日期语境，不是当前发布条件或本次重新验证结果。该PR的有限支持域、未实现分支和来源等级不因合并扩大；本文档回溯未运行测试。涉及原生事务的历史内容仅作证据记录，不恢复P078及其依赖。


2026-10-14 独立工程候选，基于已核验干净main `f6b6a31d587a8094fbba4b6fd27371288e3f3287`。完整来源用于身份核验；只投影连续无CALL的16条/35 bytes `[005905E0,00590603)`，终点包含00590602 PUSH EDI并在PUSH EBX之前停止。

本模块只补C2/C3已知规则工程覆盖债，不宣称新规则发现、不关闭完整月度财政、原43组未决证据主题仍为43。P0-78与全部依赖继续排除。

## 来源与证据上限

- 仓库：sjn4048/311MemoryResearch，固定提交66e167e40c3440929ec016f3872aefc3486434c1
- [原始listing](https://github.com/sjn4048/311MemoryResearch/blob/66e167e40c3440929ec016f3872aefc3486434c1/%E5%86%85%E5%AD%98%E8%B5%84%E6%96%99/%E6%95%B4%E7%90%86/Func-%E6%94%B6%E6%94%AF03-%E6%AF%8F%E6%9C%88%E9%92%B1%E7%B2%AE%E5%85%B5%E8%A3%85%E6%94%B6%E6%94%AF.txt)
- Git blob028fae66ba44f70716951edd9fae51420780cea0；GBK原文44,283 bytes、LF、无末尾换行；SHA-256 24c1f4c75185a3aef07aac7f493400bb778f2f071bf4fd8ef3d905457d43d617
- 修改1之前完整原listing `[00590490,00590C23)`：572条/1,939 bytes；SHA-256 e65552b27524fcce9e95e2b3a48a9117a185cd27ad3362cfe0e47dbb9c9ee88b
- 叶段16条/35 bytes；SHA-256 5c6d98631284c667856b19e2319830b143ed291d9ca2e72e3b25d4dafe91749c
- 叶字节85c0740a8d047f992bc2d1f88bf88b8424b801000085c074098bc7992bc2d1f88bf857
- Apache-2.0原仓库许可快照沿用已认证文件；来源材料清单绑定GBK、可逆UTF-8、完整与选段字节/地址表

证据级别只有source-listing-reconstruction。[同一提交的仓库README](https://github.com/sjn4048/311MemoryResearch/blob/66e167e40c3440929ec016f3872aefc3486434c1/README.md)仅说明PK（Power-up Kit）；README blob为167c76640d5bcb4496589948b59f08417be1ca2a。PC-PK1.1是本工程目标，不是已认证来源版本：收据分别标记projectTarget=PC-PK1.1、sourceEditionClaim=PK、exactSourceVersionVerified=false。源码文本与Git对象的同一性不认证stock EXE、不证明真实原生执行、游戏可达性或ABI；Vanilla与主机版不继承PK结论。字节由公开listing重构，GNU objdump独立复核全部572条边界及选段语义。修改1及之后MOD建议不进入原listing字节或产品执行。

## 输入捕获点

公开TS API：calculateMonthlyCityFoodBaseArgument；profile固定monthly-city-food-base-argument-u32-v1。所有字段必填：

| 字段 | 捕获时点与含义 |
|---|---|
| entryFoodEdiU32 | 005905E0当前EDI，完整原始U32 |
| harvestPredicateEaxU32 | 同一005905E0当前EAX，完整DWORD零/非零测试 |
| lateLevyFlagDwordU32 | 005905EE从[ESP+1B8]读取的独立晚期DWORD，完整零/非零测试 |

前置005905D0 city-calculator调用、005905D9 EAX→EDI、005905DB谓词调用均在边界外。不能假定该未恢复helper保留了EDI，所以entryEDI不能替换成先前city-return值。0059059E的早期levy门槛与本模块晚期读取之间存在调用；不能假定二者相同。晚期读取在全部四路径上恰好发生一次，包括food为0的路径。

完整0..4294967295输入域是合成观测合同，不声称所有值在真实游戏中可达。不得输入负signed数代替U32位模式。TS只接受普通或null原型对象、完整自身可枚举数据属性；未知key、symbol、getter、继承字段、自定义原型均拒绝，getter不执行。对恶意Proxy反射trap无“不执行”承诺。拒绝bool、string、fraction、NaN、无穷和越界；JS数值-0接受并在所有输出数值中规范为+0。

Python直接API calculate_monthly_city_food_base_argument只接受精确内置dict、str键/profile和int字段，bool、int/str/dict子类及所有float（包括1.0、-0.0）均拒绝。CLI JSON传输层另行把有限整数型JSON number规范为int，然后调用直接API；重复JSON键、非JSON数字常量和非有限数拒绝。这是明确的传输适配，不放宽Python直接API。

## 字节算术

令u为入口EDI位模式：

1. harvest EAX非零：先low32(3×u)，把低32位解释成signed32，再向零除2，结果转U32
2. 晚期levy DWORD非零：将当前u解释成signed32，再向零除2，结果转U32
3. 00590602 PUSH EDI选择所得位模式，同时给出signed32视图

CDQ / SUB EAX,EDX / SAR EAX,1实现signed32向零减半；不能用unsigned SHR、floor、先除再乘、交换两modifier、无界3u/4或额外加回本金代替。数值3双开启返回2；0x2AAAAAAB harvest开启先回绕为signed负数，单开启返回−1073741823，双开启−536870911；0xFFFFFFFF只levy返回规范+0。

成功收据包括规范输入及入口signed视图、两个布尔分支、可选harvestTriple {unwrappedU64,lowU32,signed}、postHarvestU32/signed、lateLevyRead {address,widthBits,count}、精确执行地址数组/条数、固定pushAddress/continuationAddress、pushedArgumentU32/signed与证据字段。四条路径00/10/01/11条数分别6/11/11/16。unwrappedU64最大12,884,901,885，在JS精确整数域内；不是LEA寄存器宽度扩展。

结果不是实际获得粮食，不是writer返回，也不是真实栈改动。TS返回递归冻结的新收据（可共享不可变证据）；Python返回全部嵌套的新副本。拒绝收据只有supported=false、reason与证据。JSON Schema关闭所有对象并约束精确四分支trace及证据布尔类型；bool/number不得用宽松相等比较。

## 验证命令与分类

```sh
npm run typecheck
node --test packages/engine/test/monthly-city-food-base-argument.test.mjs
python -B scripts/check_monthly_city_food_base_argument.py
python -B scripts/test_monthly_city_food_base_argument_evidence.py
python -B scripts/oracle_monthly_city_food_base_argument.py
python -B scripts/oracle_monthly_city_food_base_argument.py --broad
python -B scripts/oracle_monthly_city_food_base_argument.py --mutants
```

- Checker绑定源文本、Git blob、完整/选段字节、封闭profile/Schema、材料清单与许可，并独立反汇编
- Evidence suite校验JSON/host/CLI合同、精确类型、别名、source/schema及依赖guard负例；这些不是行为mutant kills
- Oracle独立解码并执行重构字节，模拟寄存器与synthetic read/push，再比较完整typed TS/Python收据。该解释器不是原生EXE执行；不引用产品公式构建gold
- 默认精查7,040输入并对每例oracle/TS/Python三份收据执行Schema验证
- broad覆盖低16及高位镜像共131,072入口值×四路径，另有overflow边界、完整flag交叉积与固定种子U32随机。全部逐例比较typed收据；Schema只按257步抽样，精确条数在报告中单列；不冒称穷尽U32三维笛卡尔积
- mutants修改真正执行的TS，逐个先运行全新未改control，随后必须给出差异见证。17个包括16个数值/分支行为与1个执行收据读次数行为；不把17当成17个都改变数值结果，也不把研究18项目标当成18个行为mutants。负零由driver在JSON序列化之前用Object.is检查，见证保留数值路径和negativeZero=true；启动/运行异常不会伪装成kill

本地development日志与全新独审/聚合结果均在仓库之外单独保存；历史PASS不验证此树。正式冻结、全量回归、发布和merge状态另记，本文件不宣称这些步骤已完成。

## 明确排除

不自动调用city-food calculator或base-income return-tail；不接前置季度/levy gate、native predicate语义、helper ABI、writer004AE300及cap/实际delta、PUSH EBX、callee结果、owner/force、全局状态、技能生成、Midao后续分支、RNG、月度调度、EndTurn、P0-78及全部依赖。完整月度粮食机制仍缺原生与状态证据，不能由这个局部叶段的通过数代替。


## 2026-10-17：稳定服务快照连接

[O10-A月粮顺序](city-finance-lifecycle.md#33-月初1日的严格顺序)把自己算得F、显式未来月丰作和驻城征收存在性生成derived-adapter-observations；仍调用本核执行harvest后levy，不假称原native current EDI/EAX/late DWORD已捕获。stable helper、季度米道和cap写回是新服务政策，本叶段原边界不变。

本次连接仅静态代码和规则交付，未运行测试、编译、build、checker、诊断、产品或示例；本页历史通过记录不覆盖新服务。
