# 金钱/粮食据点收入返回尾部：捕获值的纯整数投影

> 当前交付状态（2026-10-16）：本页对应 [PR #62](https://github.com/DanielMax937/sanguozhi/pull/62) 已合并。下文“候选”“未发布”“发布前/合并后须验证”等措辞及运行数字保留其原日期语境，不是当前发布条件或本次重新验证结果。该PR的有限支持域、未实现分支和来源等级不因合并扩大；本文档回溯未运行测试。涉及原生事务的历史内容仅作证据记录，不恢复P078及其依赖。


2026-10-14。本地候选基线为已合并 main `c508efac720574b17031ded707c052e19f3fb8d1`，tree `f39c3b2f8b0fc0f1724ba57a94c9604b4b252a03`。API `calculateBaseIncomeReturnTail` / Python `calculate_base_income_return_tail`，profile `base-income-return-tail-u32-v1`。仅补已有“港关20%份额”规则的一段可独立计算的标量工程覆盖，不是新机制发现，原43组未决主题不减。

## 来源和执行边界

固定仓库 `sjn4048/311MemoryResearch`、commit `66e167e40c3440929ec016f3872aefc3486434c1`：

- [收支07：城市、港、关金钱收入](https://github.com/sjn4048/311MemoryResearch/blob/66e167e40c3440929ec016f3872aefc3486434c1/内存资料/整理/Func-收支07-计算城市、港、关金钱收入.txt)：GBK 4551 bytes，Git blob `fee219ac9a482d3a3cb4d8bdc489b98b10836944`，SHA256 `a1a7af12cc4c7b5f612b1db45d16623a92d9c17e3957358f9d9dcd09d1408d0b`；UTF8 4754 bytes，SHA256 `c826c7f68b087832e9c94ea6253c7a4a2ae6e928ffc4d1bcb037c5a300d8d91f`
- [收支06：城市、港、关兵粮收入](https://github.com/sjn4048/311MemoryResearch/blob/66e167e40c3440929ec016f3872aefc3486434c1/内存资料/整理/Func-收支06-计算城市、港、关兵粮收入.txt)：GBK 4552 bytes，Git blob `2c44d123cab43fc8577ebbaa640d811dc5fc1e64`，SHA256 `0b401a880b6b60df70f5f2989c78bd9a1a4f44c32b5caa96b631dd3a4617c589`；UTF8 4755 bytes，SHA256 `64dec6ff6ac7f9179fa43cade5ac893f41cbd418f03161f4bb8a92a3c10de9c3`

GitHub connector 的完整UTF8文本能逐字GBK重编码回原Git blob，保留原EOF差异。每资源保存UTF8、原GBK、全listing JSON、149-byte完整listing和33-byte叶段；固定manifest逐文件绑定。复用同仓库同commit Apache-2.0 LICENSE快照并核验hash/blob。profile、封闭schema和manifest另有checker常量pin。

金钱完整listing `[0049E770,0049E805)`，粮食 `[0049EA30,0049EAC5)`，均66条/149 bytes。各SHA256为 `429f5a7ff2efb81829926d2e5375051e8bdfc8021eda2b6e13c48231f696a9c0`、`c578ba45587bf55af84eded966ff2b6909ab6afd77bfb0e511cdddbfeed0eb1c`。

只执行的叶段分别为 `[0049E7D5,0049E7F6)` / `[0049EA95,0049EAB6)`，包含算术10条/25 bytes和5条/8 bytes返回后缀，总15条/33 bytes。两者叶段相同，SHA256 `44b235c89055a513a0a795bd6903e1cc61360e3599f981467b5ef59b22d03d2c`。零type分支实际只退休9条，非零分支15条。完整149 bytes只做身份/连续性和GNU objdump边界核验，不执行前门槛、callee或其他返回路径。

两原文line50–59算术段 `[0049E7D5,0049E7EE)` / `[0049EA95,0049EAAE)` 同为 `8bc88b460885c07410b867666666f7e9d1fa8bcac1e91f03ca`，SHA256 `210bfcc2907afd3465d210652b2c022adaa8c4c92f9baf58fd2fd80b6c6eb88f`。line45的inline MOD建议绕过ownership gate；原bytes `75 29`和建议文本均按原文保留，但MOD从未启用，不能把此建议作为原规则。

证据仅 `source-listing-reconstruction`。完整listing核验不等于完整caller执行、原EXE/IDB独立提取、PK stock/Vanilla认证、native helper恢复、ABI验证或真实游戏可达性。

## 捕获合同：两个不同时间点

```ts
calculateBaseIncomeReturnTail({
  profile: 'base-income-return-tail-u32-v1',
  resource: 'money', // 或 'food'
  cityCalculatorReturnU32: 0xFFFFFFFA,
  lateFacilityTypeU32: 256,
}) // signed -1 / U32 0xFFFFFFFF
```

`cityCalculatorReturnU32` 是CALL `0049E7D0` / `0049EA90` 返回后立即捕获的完整EAX。第一条 `MOV ECX,EAX` 先保存它；接着 `0049E7D7` / `0049EA97` 的 `MOV EAX,[ESI+08]` 用晚期设施type DWORD覆写EAX。`lateFacilityTypeU32` 必须对应这个后读，不能拿之前缓存type替代。API不自动调用已有城市金钱/粮食API，也不要求输入落在这些city模块当前支持域。

两个标量均为完整U32（0..4294967295），必须是有限整数JSON number。接受1.0，拒绝bool、字符串、分数、NaN/Infinity、负值和超宽值。输入−0规范为+0。`profile`、`resource`及4个字段封闭；缺字段、未知字段/selector明确拒绝，没有缺省值。

TS只接受普通Object或null-prototype、必需字段为可枚举own data descriptor；拒绝accessor且不调用getter、symbol、未知own key（含non-enumerable）、自定义prototype/class和non-enumerable必需字段。输入不保留引用；成功/拒绝结果及整个公开profile递归冻结，每次顶层新建。Python只接受exact dict、exact str selector/key和exact int/float数值，拒绝子类和bool，整数JSON float归一化为int；返回新的嵌套JSON副本，不承诺冻结。JSON Schema验证序列化合同，不能认证host对象或游戏观察真实性。

任何非零raw DWORD都进入同一除法分支，包括256、0x80000000、0xFFFFFFFF。不能据此说这些值是有效港/关枚举，也不能缩为U8/U16或只接受1/2。

## 算术及完整signed32证明

令N为captured EAX的signed32解释：type=0原样复制bits；type非0返回 `truncTowardZero(N/5)`。公开返回signed与U32两种视图。

指令使用正魔数 M=0x66666667=1717986919，signed IMUL生成64-bit乘积；取signed高32位，SAR 1，再以SHR 31获得负数校正位并相加。产品API用BigInt/Python整数保留精确乘积，收据以十进制字符串展示，绝不转为不精确JS number。

证明：`5M=2^33+3`。`SAR(high32(NM),1)=floor(NM/2^33)`。对非负N，写N=5q+r（0≤r≤4），额外项 `3N/(5*2^33)<0.15`，所以整体小数部分小于0.95，floor=q。对负N=−a（1≤a≤2^31），a=5q+r，额外项严格正且≤0.15，故floor=−q−1，即使r=0也如此；SHR校正位为1，相加得−q。零校正为0。由此覆盖全signed32，不依赖有限样本碰巧通过。

- −1..−4 → +0（禁止JS −0）
- −5 → −1；−6 → −1 / U32 0xFFFFFFFF；−10 → −2
- INT32_MIN → −429496729 / U32 0xE6666667
- INT32_MAX → 429496729 / U32 0x19999999
- type=0时INT32_MIN仍复制0x80000000；不能clamp0或转unsigned再除

## 完整收据和封闭schema

成功收据固定含：supported、profile、resource、cityCalculatorReturnU32、cityCalculatorReturnSigned、lateFacilityTypeU32、branch、division、returnedIncomeSigned/U32、evidence。

copy分支division必须null。非零分支division必含 multiplierU32、productSignedDecimal、productLowU32、productHighSigned、sarHighSigned、correctionU32。十进制串禁止−0、前导零、空白和尾换行。拒绝收据固定为supported:false、reason、evidence；reason为invalid-input / unexpected-field / unsupported-profile / unsupported-resource。多个错误按顶层shape、profile、resource、数值顺序报告。所有字段通过完整type-exact比较，bool不能冒充integer。

resultSchema封闭成功/拒绝和嵌套evidence/division，绑定type零/非零与branch/division关系。跨字段计算由完整收据oracle对照保证，Schema不替代执行。

## 可复核入口

```sh
npm run typecheck
node --test packages/engine/test/base-income-return-tail.test.mjs
python -B scripts/check_base_income_return_tail.py
python -B scripts/check_base_income_return_tail.py --input input.json --output receipt.json
python -B scripts/test_base_income_return_tail_evidence.py
python -B scripts/oracle_base_income_return_tail.py
python -B scripts/oracle_base_income_return_tail.py --broad
python -B scripts/oracle_base_income_return_tail.py --mutants
```

checker验证静态来源/Schema身份；CLI拒绝重复JSON key、非JSON常量和参数缩写。evidence runner检查完整TS/Python成功/拒绝收据、Schema、host/复制合同、CLI及来源变异拒绝，不能称独立byte oracle。

oracle不从产品模块导入公式、预期结果或生成器。它从已核原文独立解析bytes，解码MOV/TEST/JE/IMUL/SAR/SHR/ADD/POP/RET，使用synthetic寄存器/稀疏内存和栈，检查RET 4与保存寄存器后缀。gold完全来自寄存器执行结果，产品只在分离比较adapter调用。每条gold、TS、Python完整结果分别过resultSchema并type-exact比较；TS driver另外检查输入未变、递归冻结及canonical +0。

有限broad覆盖全部65536 raw U16 types × 正/负N × 双resource；dense −8192..8192与零/高位type；每个mod5余数、signed极值、高位pattern、2与5幂边界、固定种子U32样本。不是完整U32×U32 Cartesian穷举。真实TS行为mutants另入口，涵盖unsigned/floor/ceil/round、4/6除数、SAR/校正错误、U8/U16/type枚举缩窄、负值clip、返回被type覆盖的EAX、错误bits、−0和证据越界声明；每个mutant前重新执行未改控制，来源hash拒绝不算行为kill。

本模块只部分收窄 [金钱模块未决边界](city-money-income-projection.md) 和 [粮食模块未决边界](city-food-income-projection.md) 的20%标量尾部。母城查找、所有权/validity gate、可变读取、callee/ABI、Easy、收入特技、GameState、force/capture、writer/tick/月度季度scheduler、RNG和真实游戏整合仍未实现。P0-78及依赖排除。旧金钱179原run/证据不触碰。本地focused开发检查不替代协调者负责的新冻结完整适用聚合验收；不写入/推送GitHub、不创建PR、不发布Library。


## 2026-10-17：单城财政的排除边界

[O10-A支持域](city-finance-lifecycle.md#1-证据场景与所有权边界)仅城市，不连接本港关返回尾部，不据此扩展本核到真实港关入账、owner、writer或调度。原核和原证据保持不变。

本次连接仅静态代码和规则交付，未运行测试、编译、build、checker、诊断、产品或示例；本页历史通过记录不覆盖新服务。
