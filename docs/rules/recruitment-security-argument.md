# 征兵治安 writer 请求参数：独立纯整数叶

本项只实现 `calculateRecruitmentSecurityArgument`，profile `recruitment-security-argument-v1`。两个输入是 **leaf入口已经取得的标量**，输出是请求参数，不是实际治安损失。它与[征兵数量投影](recruitment-quantity.md)独立，不调用数量API，不接command/EndTurn/state mutation。发布与各阶段验收收据另记；此页不借历史测试数字宣布本树通过。

## 固定来源与证据等级

[完整公开原文](https://github.com/sjn4048/311MemoryResearch/blob/66e167e40c3440929ec016f3872aefc3486434c1/内存资料/整理/Func-内政02-执行征兵.txt)，仓库 `sjn4048/311MemoryResearch`，commit `66e167e40c3440929ec016f3872aefc3486434c1`，Git blob `3e1767ccafd7d217881119d142e8f4b02cdf88ce`。Apache-2.0许可及归属见[source profile](../sources/recruitment-security-argument.json)。原文UTF8 23221 bytes，重编码GBK 22263 bytes并验证Git blob；两份完整快照保留。

证据为 `source-listing-reconstruction`，不是EXE/IDB独立提取、运行时观测或clean-stock认证。`stockOriginalVerified=false`、`originalExecutableExecuted=false`；未知helper/ABI、任意输入的游戏可达性、Vanilla、主机和跨版本仍未解决。

完整caller `[005C3A50,005C3E0B)` 共316条/955 bytes；51个直接CALL-site、1个间接CALL-site、16个直接分支。整段连续解码不表示整个函数已实现。范围分层：资格与city解析；执行者循环和奖励；数量函数/增兵writer；军团/兵舍/气力；本叶；治安writer及返回处理；技巧点/金钱/AP；RNG、显示与收尾。其余callee没有被本API补写。源005C3C60的“SAR DL,05”真实bytes C1 FA 05解码为SAR EDX,5，属后续技巧点路径，保留原文而不纳入本叶。

## 输入来源与严格合同

- `savedCharmSum`：整数0..765，入口 `[ESP+10]`。执行caller较早循环在005C3B1B逐槽getter后取AL、005C3B2A累加，005C3B7A保存。每槽随后运行经验/功绩/acted callee，后槽可能观察变化；不能把三个对象当同一瞬时快照。005C3610数量函数更晚重新查询属性，不能用其魅力和替代
- `savedTroopReturnU32`：整数0..4294967295，入口ESI位模式。caller最近显式定义是005C3BA9保存004AE3C0增兵writer返回EAX，**不是005C3610数量返回**。原注释称其为“实际增加量”，但writer完整body未证明，API不保证非负、夹限或已写入城市
- 005C3B81 PUSH后005C3B84的ESP+10实际为基准ESP+0C，没有覆盖原保存C。间隔callee的栈平衡/非易失寄存器保存只用于有限caller来源说明，不能由此宣布逐callee ABI已验证；最小API直接接入口值
- 封闭输入只接受profile与两个数值的自有data属性。拒绝遗漏、额外字段、accessor、异常原型、NaN/Infinity、非整数、越界、字符串、布尔和未知profile。普通对象与null原型可用，非enumerable data属性可用；输入-0规范为+0。不承诺免于恶意Proxy自身reflection trap
- 拒绝是工程边界，不是重建原生invalid-pointer路径。禁止输入city/currentSecurity/quantity/quantityCharmSum/lawSkill/state/nativePointer/writer等“便捷”字段

## 逐字节叶与完整域证明

算术 `[005C3C11,005C3C24)` 7条/19 bytes：

```
005C3C11 8b442410   MOV EAX,[ESP+10]
005C3C15 8d4864     LEA ECX,[EAX+100]
005C3C18 8bc6       MOV EAX,ESI
005C3C1A 99         CDQ
005C3C1B f7f9       IDIV ECX
005C3C1D b95c899907 MOV ECX,0799895C
005C3C22 f7d8       NEG EAX
005C3C24 50         PUSH EAX
005C3C25 53         PUSH EBX
```

含两push到005C3C26共9条/21 bytes；005C3C26 CALL 004B3E70在范围外。算术SHA256 `8a537f7ccca746304043e2a71bba02596ea52bd8d968e6d835b4f6f28056d698`；含push SHA256 `6b4afd8e5857db8a562d0d127212f0b28fca91d9e9a9f5d8fe251dc65094bb89`。

```
N = signed32(savedTroopReturnU32)
D = savedCharmSum + 100
Q = trunc(N/D)             // signed IDIV，向零截断
R = N-Q*D                 // N的符号或0，abs(R)<D
deltaSigned = -Q
deltaU32 = deltaSigned modulo 2^32
```

D为100..865，LEA无溢出、无零除；CDQ形成的signed64被除数恰是N。全域Q与delta均在[-21474836,21474836]内，IDIV商不溢出、NEG不溢出；没有饱和/clip。固定D的delta端点为 `[-floor((2^31-1)/D), floor(2^31/D)]`，未必对称。产品使用BigInt精确算术；所有返回0均为JavaScript普通+0。收据包含profile、两个规范化入口值、signedTroopReturn、divisor、quotientSigned、remainderSigned、securityDeltaSigned、securityDeltaU32及冻结evidence；余数仅供算术审计。

仅普通N>=0时可简写 `deltaSigned=-floor(N/(C+100))`。旧资料正数公式早已存在，本项新增实现的是严格有符号参数合同，不将旧公式包装为新发现。

## 可复算反例与不能代换的结果

| C | U/N | 请求delta | 检出的错误 |
|---|---|---:|---|
|300|4200 / 6300|−10 / −15|普通正数锚点，仅请求参数|
|0|0xFFFFFF9B / −101|+1|floor错误给+2|
|0|0xFFFFFFFF / −1|0|unsigned错误给巨大负数|
|0|0x80000000 / INT_MIN|+21474836|丢CDQ或用DIV|
|28|INT_MIN / INT_MAX|+16777216 / −16777215|误判端点对称|
|765|864 / 865|0 / −1|隐藏最小惩罚、除数常量|
|299 vs 300|399|−1 vs 0|以较晚数量魅力和代替早期C|
|300|200（数量函数可能返回4200）|0|以数量返回代替入口writer保存值|

这些是标量反例，不证明任意组合真实游戏可达。假设城市当前治安仅3，输入C300/U4200请求仍−10；本叶不算出实际新治安0或−7。之后004B3E70自己的返回EAX（例如−3）也不会倒改此请求参数；005C3C2B开始的符号处理及军团00588B50使用的是那个返回，不能把它称本叶结果。尤其x86 NEG(INT_MIN)仍INT_MIN，不是数学abs；这一后续算法不在API范围。

## MOD严格隔离

原文末尾“有法治则征兵不掉治安”是独立修改。patch005C3C1D..005C3C22（1条/5 bytes）、trampoline009107CA..009107DB（4条/17 bytes）、helper009107B0..009107CA（11条/26 bytes），总16条/48 bytes，三个非连续区间。其skill0x8C判断后清商逻辑不在原leaf，不提供法治免降开关，不拼成原函数。

## 验证与剩余边界

新Node测试逐字段对比独立长除法，覆盖全部766分母的13,022边界输入、严格输入对象合同、输入时序反例、不变状态、存档/重放隔离与26个真实TypeScript行为变体；每个mutant先运行未改control。源码/profile改动拒绝单列，不能计为产品行为mutant击杀。

Python oracle独立解析并固定完整原文、连续316指令及MOD区间，逐opcode解释九条leaf且停在writer前，和实际TypeScript批量比较；default与exhaustive模式各自报告实跑数量/摘要。exhaustive仅指所有分母的定义邻域、端点、确定性样本族，**不是766×2^32输入穷举**，不是native执行。以前只读审计的1,564,879研究探针不是本产品验收。整树验收在冻结candidate及真实merge分别新跑，远端重建focused检查与恢复检查各自区分。

未关闭资格005C37C0/005B8320、人物getter/奖励副作用、004AE3C0实际增兵/夹限、004B9840混合气力/0047CC50 writer、004B3E70治安writer及返回语义、军团显示、技巧点/金钱/AP、RNG/消息/调度/完整command、stock/跨版本/存档真实性。P0-78及依赖新增实现继续排除；保留已有离线回归不表示重新启动该工作。不能称“征兵模块完成”“实际治安损失端到端实现”或“全部缺口已清空”。
