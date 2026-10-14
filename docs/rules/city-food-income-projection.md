# 城市粮食收入：非 Easy 稳定已解析输入投影

2026-10-14。基线是 PR #60 已合并的 main `57a2f4dd34d0d888b23d1e46e2cb78402b91a7b4`，tree `823489c4475dff86cafb2733f4b1fb41a6e9db1b`。本地新增公开 API `calculateCityFoodIncomeProjection`，profile `city-food-income-stable-resolved-non-easy-u32-v1`，证据等级仅 `source-listing-reconstruction`。这是已有粮食规则的工程覆盖，不是发现未知规则，也不把原43组未决证据主题减为42。

本项只有通过 city/owner 门槛后的局部数值投影；不接 GameState、capture、force灭亡、native事务、P0-78及其依赖、writer 或 scheduler。未远端发布。下面旧项目的历史验收数字不验证本树；正式全新聚合验收与独立 byte oracle 结果必须另行生成，不能由本实现自证。

## 1. 原文身份和字节边界

[固定来源](https://github.com/sjn4048/311MemoryResearch/blob/66e167e40c3440929ec016f3872aefc3486434c1/内存资料/整理/Func-收支05-计算城市收粮.txt)，仓库 `sjn4048/311MemoryResearch`，commit `66e167e40c3440929ec016f3872aefc3486434c1`。

- GBK 17016 bytes；Git blob `79e949349af8be94b77eb70f37a948b8d3ff2f6a`；SHA256 `ef5c0c6431e167389d76c84693e4807ffdc078f94807509c73dcb24690e39947`
- UTF8 18184 bytes；SHA256 `5751f8775b63410459c7ad035177df11ee08b245222c38c1f74ac0bf42f1fa78`
- 原函数 `[0049E810,0049E9FE)`：160条连续指令，494 bytes；SHA256 `176854e5670c2e5f5957f2de3ec06529ad69668c1548e94923a849a87db850b0`
- 跳表 `[0049EA00,0049EA10)`：16 bytes；SHA256 `da490597343aadca41cdce8ddccac3c3bc6cf4918927a48017b3fb47b239e2ca`
- 分发表 `[0049EA10,0049EA26)`：22 bytes；SHA256 `1ce093453d63cd6b18ffd8aea0004a08b709cc5559325d05c5ad422b58c3f9f6`
- 中间 `[0049E9FE,0049EA00)` 两字节没有列出，不填零，不伪造完整连续内存

原文 UTF8/GBK、完整160行地址/bytes、函数体和两个表作为六份材料绑定到独立固定 manifest。profile 与封闭 profile schema 的 canonical SHA256 也由 checker 常量独立固定；不能协调修改 profile/schema/manifest 就自我认证。Apache-2.0 的固定 LICENSE 沿用同仓库同commit已保存材料并复核 hash/blob。

当前材料来自已核公开反汇编文本的重建，不是EXE/IDB独立提取。`fullCallerBytesVerified` 仅指全部已列 caller bytes 的完整性，并不表示执行过全部分支、认证clean stock、回收callee或证明可达性。PK导向来源不外推 Vanilla、其他补丁或主机版。

## 2. 输入合同

顶层封闭对象，字段如下。所有宽度均拒绝字符串、布尔数字、分数、NaN/Infinity、越界值；接受整数值的JSON number，例如1.0。输入−0规范为0，输出零全部为+0。

- `profile`：唯一固定字符串
- `baseFoodWord`：U16
- `slots`：恰好30个密集槽；null表示设施validator明确返回0，不是遗漏观察
- 非null槽必有 `facilityTypeWord` U32 与 `constructionWord` U32；后者任意非零为完成
- `resolvedTypeRows`：只允许字符串键32/49/52/53，每行只能为 `{valid:false}` 或 `{valid:true,foodYieldWord:U16}`。被实际引用的行必须存在；未消费的行也必须形状合法
- `slots[i].adjacentGranary`：仅有效普通农场实际调用谷仓谓词路径必填boolean；ignored、unfinished、invalid row、军屯农不允许带入
- `cityTroopsWord`：仅至少一个有效完成军屯农消费兵力读取时必填U32；无消费路径禁止带入
- `difficultyWord`：U32；0整个Easy分支拒绝，含零基础/零设施输入
- `cityPlayerPredicate`：仅difficulty=2必填boolean，其他难度禁止。它代表virtual48整个EAX零/非零，不是AL
- `securityByte`：晚期U8读值，允许101..255

条件字段依实际控制流而非最终贡献是否为0决定。普通农场yield=0也必须给邻接谓词；军屯农yield=0也必须给兵力。没有隐式默认产量、默认兵力或假invalid row。重复军屯农和重复类型引用统一稳定输入，不能输入每槽任意最终产量。

TS接受普通对象或null-prototype数据对象；数组必须是普通Array、密集30项、无额外或symbol属性。通过descriptor读输入，拒绝accessor而不执行getter，拒绝自定义prototype。JSON Schema覆盖序列化值的结构和跨字段条件，不能证明host对象、getter或真实游戏观察。Python仅接受exact dict/list，拒绝子类，返回fresh JSON容器但不承诺冻结。TS所有返回对象递归冻结，不保留input引用。

支持域还要求：city及owner入口已通过；设施/行validity、邻接谓词与兵力观察稳定；未知callee正常返回并保持caller所依赖的栈/非易失寄存器。这是输入前提，不是已回收外部helper或ABI合同。

## 3. 控制流与精确位宽

类型32/49走普通完成检查，未完成跳过。类型52未完成回退32，53未完成回退52；完成时保留自己的类型。其他类型忽略。实际有效类型行invalid则跳过；valid则按U16读产量Y。

普通农场32/52/53：有邻接谷仓为 `floor(3Y/2)`，无则Y。军屯农49不走谷仓路径。

军屯农定义：

```text
T = maxUnsigned(cityTroopsWord, 15000)
W = u32(T * Y)
contribution = floor(W / 15000)
```

IMUL仅保留低32位；下一条 `F7 E1` 是unsigned MUL，不是signed IMUL。魔数 `0x45E7B273` 满足 `15000M = 2^44 + 584`；对全部U32 n，`n*584 < 2^44`，所以 `floor(n*M/2^44) = floor(n/15000)`。不得把U32高位兵力当负数、在截断前除15000，或拒绝合法的高位中间值。

最多30槽单槽军屯贡献286331，故 `rawFood <= 65535 + 30*286331 = 8655465`。普通农场最大98302。累加与难度乘积均不溢出signed32。

```text
q = difficultyWord==2 ? (cityPlayerPredicate ? 75 : 125) : 100
D = floor(rawFood*q/100)
S = max(50, securityByte)
P = u32(D*S)
N = signed32(P)
returnedIncomeSigned = truncTowardZero(N/100)
returnedIncomeU32 = u32(returnedIncomeSigned)
```

其他非0/2难度原值直通，没有金钱模块的预先×100。最终乘积最大2758929405，小于2^32，所以支持域内 `securityProductRaw == securityProductU32`；跨越INT32_MAX时signed解释会成为负数。早期军屯乘法确实可能丢弃unsigned高位，而最后一步仅可能越过signed边界，二者分别展示收据，不混称同一种溢出。

最终 `C1 FA 05` 按bytes是SAR EDX,5，原文误写SAR DL被原样保留。signed魔数 `0x51EB851F` 对全部signed32给出向零/100；不可用负数floor或clip0。JS计算32位截断/解释用BigInt，军屯数学乘积最大281470681677825，收据number仍为精确整数。任何魔数乘积若以后用于测试，必须先转BigInt后乘。

## 4. 返回和拒绝

profile内含独立封闭 `resultSchema`，固定success/rejection及30条各有确定index的槽收据，约束bool与integer类型、军屯/非军屯条件字段、拒绝原因及全部evidence字段。输入和结果Schema本身一并被profile/schema独立hash锁定。跨字段算术关系仍须API与oracle验证，Schema不取代执行。

成功返回 `supported:true`、固定profile/evidence、规范后的baseFoodWord/difficultyWord/securityByte和30条slots。顶层数值包括rawFood、difficultyPercent、difficultyAdjusted、effectiveSecurity、securityProductRaw、securityProductU32、securityProductSigned、returnedIncomeSigned、returnedIncomeU32。

槽收据固定包含index、facilityTypeWord、effectiveType、status、foodYieldWord、granaryApplied、effectiveTroops、militaryProductRaw、militaryProductU32、contribution。没有产量时foodYieldWord为null；非军屯后三个字段为null。status为invalid-slot、ignored-type、unfinished、invalid-type-row或yield。成功0与拒绝分开。

拒绝为 `{supported:false,reason,evidence}`。reason可为invalid-input、unexpected-field、unsupported-profile、missing-type-row、missing-adjacent-granary、missing-city-troops、unsupported-easy-branch。校验顺序为顶层/数值/难度谓词、完整行表、槽数组及逐槽条件、未消费兵力，然后Easy拒绝；多个问题同时存在时先报告首个问题。Easy拒绝不允许用easyConvertedEax、最终值、默认round或Math.floor(rawFood*1.25)替代。

## 5. 对照例与范围

- troops20000/yield1500→2000
- troops0x80000000/yield1500→低32位0，贡献0
- troops2863311/yield1500→286331；兵力加1→低32位704，贡献0
- troops65537/yield65535→乘积0xFFFFFFFF，unsigned贡献286331
- 30个军屯上述最大贡献，加base65535→raw8655465；normal治安248→21465553，249→−21397565
- 同一输入super AI治安198→21422275，199→−21419204，255→−15360378；无界公式的27589294错误
- 常规base5000+Lv3邻谷仓3375+军屯2000→raw10375；normal/治安100→10375；super玩家/治安50→3890；super AI/治安255→33068

30军屯是输入支持域构造，不宣称游戏正常城市能建30个军屯。负返回也不等于真实城市已被扣粮，外层caller/writer未接入。

## 6. 测试入口与未决项

```sh
npm run typecheck
node --test packages/engine/test/city-food-income-projection.test.mjs
python scripts/check_city_food_income.py
python scripts/check_city_food_income.py --input input.json --output receipt.json
python scripts/test_city_food_income_evidence.py
python -B scripts/oracle_city_food_income.py
python -B scripts/oracle_city_food_income.py --broad
python -B scripts/oracle_city_food_income.py --mutants
```

`check_city_food_income.py` 无参检查材料；CLI禁止缩写参数，JSON重复key、非JSON数字和语法错误返回明确invalid-input。`test_city_food_income_evidence.py` 实际检查封闭Schema/TS/Python的JSON合同对照、全部65536普通农场产量的有/无谷仓路径、选定军屯边界与全部256治安值、Python引用隔离、CLI和身份拒绝变异；合同样本的Python与TS所有成功/拒绝收据经过resultSchema，整收据采用递归type-exact比较，另有true→1及nested数字→bool的拒绝负测。测试组合中的TS递归冻结检查由Node专测和独立oracle driver负责，不归给Python evidence runner本身。来源身份拒绝计数不能称行为mutant kill；公式自测和Python/TS互比不能称独立byte oracle。独立oracle与真实TS行为mutants由独立测试入口提供，最终验收必须运行其公开入口并单独记录结果。

Easy路径的007E7B68常量原始bytes、00707A74完整helper、x87控制字/异常/转换没有闭合，因此difficulty0全拒绝。原文四组MOD（军屯吃谷仓、全局谷仓、变法2倍、屯田额外军屯）和inline E8D5建议均不启用，原固定30槽不扩大。

[独立返回尾部模块](base-income-return-tail.md)仅补捕获city返回EAX和晚期raw type的向零/5标量步骤，不调用本API、不据此认证港关母城/ownership/callee/ABI或真实入账。

仍open：city/owner门槛、getter/validator/ABI及可变读取、原类型表/地图邻接helper、Easy、丰作/征收/米道/港关、真实入账writer、完整月度/季度scheduler、RNG/真实存档、stock/Vanilla/主机与跨版本。没有减少原43组主题，没有恢复P0-78及依赖，也没有重新运行或挪用旧城市金钱179原run。
