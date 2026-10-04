# P0-48 据点陷落：caller cause、完整候选收集与事务 finalizer

更新：2026-10-04 UTC。基线：`9462f8cf1e9e24147757f0032aec1f11df579033`。延续[P0-46](81-capture-selector-source-profile.md)，不扩展成整个战斗/人物系统。

- [结构化证据](../sources/capture-transaction-source-profile.json)
- [61个来源范围的文本机器码](../sources/capture-transaction-source-profile/)
- [参考事务](../../scripts/capture_transaction_profile.py) · [校验](../../scripts/check_capture_transaction_profile.py)
- 运行：`python scripts/check_capture_transaction_profile.py`

## 1. 这次解决什么，仍不声称什么

这次把“只消费预资格候选ID”的selector扩展成可测试的**完整有序世界设施收集器和原子事务状态投影**。恢复三处直接caller的终止条件/第三参数、关系排除、设施删除、资源保留后转属/中立化、普通部队入城资源合并、耐久最终阶段。脚本独立于TypeScript训练沙盒，未接入战斗命令或宣称游戏可进行攻城。

最重要的修正：

1. 中立化finalizer会再次把已经保留的资源全部清零；不能把资源保留中间值当最终结果
2. 转属先按**新势力**的max耐久向下cap，尾部再抬至当时max的一半；旧势力max不一定还能用
3. 入城先按完整旧兵+入城兵加权气力，再做容量裁剪；溢出的入城兵也参与这一次加权
4. 第三参数不是“耐久归零/城兵归零”原因码；fire/trap为1，attack为“非六邻格相邻”
5. 存活内政设施势力是地域所属城市的动态getter结果，包含完成type30及第31座以后的overflow；不能保留旧势力快照

`opcode-exact`只修饰固定来源中的指令/算术/已列写回。整个可运行模型的PK采用等级是`compatibility-reconstruction`，未知系统必须显式`record-only`或拒绝。stock PC-PK1.1等价、完整人物/势力/事件副作用和全局RNG回放仍是证据债，未从TODO删除。

## 2. 两个MOD来源严格隔离

S1为[sjn固定commit的IDB](https://github.com/sjn4048/311MemoryResearch/blob/66e167e40c3440929ec016f3872aefc3486434c1/IDA%20Related/san11pk.zip)：

- IDB SHA256：`c591cb40ce6d6be9246148002532dedc042463f36cd39c5ed300b7c449feefab`
- 记录输入：`D:\Games\三国志11\血色5.0公测\san11pk.exe`
- 记录EXE SHA256：`30d33b44876b84a8e87570873a86de88c65d2491c7e1cdeeb5883dc4b12feefb`

S2为[sean固定commit的IDB](https://github.com/sean2077/311SireCustomizedPackageDev/blob/43afe4efe273cf3b6ab7833b9b6f5822bd331fd4/ida-db/san11pk_dump.exe.idb.7z)：

- IDB SHA256：`aa7f2c983b266633d6e23c494d4f8e1b03e5251632505cae103e176ae850dfd8`
- 记录输入：`C:\Games\san11\血色衣冠6.0sp5(整合包240612)\San11Pk\san11pk_dump.exe`
- 记录EXE SHA256：`b1e9467e9612c23af83f6feda8414bc9ee99eb62c6862a84f7f4c5a8822b9da9`

EXE身份是数据库元数据，未独立获得EXE重算。本轮仅使用python-idb/Capstone静态读取已有存储字节；不执行游戏、MOD、补丁或来源仓库脚本。提交仅含必要文本、哈希和自写模型，不含EXE/IDB/压缩包。

24个S1/S2范围中17个相同、7个不同：主handler38个重叠字节差异，3个caller分别5/9/21字节差异，`004B1280`9字节差异；`00484DE0`从49字节变成62字节且出现hook；地域映射128字节读取窗口有32字节不同。S2在`004B33E9`候选入口和`004B3511`魅力调用有hook，资源算术也改变。三处capture callsite的局部push/call相同不等于整个caller相同。

[fudang函数表](https://github.com/fudanglp/311resource/blob/16efa1241dc8637dd33446abb4a9732a37f0a2b9/extractor/ida/data/python_idb/san11pk_dump.exe_functions.csv)仍只作为边界交叉核对，不用函数大小推行为。所有新语义均绑定S1；S2只作独立负对照，不借它的常量“补原版”。

## 3. Caller cause与第三参数

稳定主栈帧S中：`S+124=target`、`S+128=source object`、`S+12C=mode`；`004B36FC ret0xC`。handler入口检查target/source合法性，自身没有耐久或兵数归零gate。

| caller / callsite | terminal gate | source / mode |
|---|---|---|
| 火计`00592440 / 005926DC` | 耐久恰为0，且有效据点 | record+4 source，mode=1 |
| 火陷阱`00597A60 / 00597E94` | 耐久恰为0，且有效据点 | 原arg3 source，mode=1 |
| 攻击结果`005B1870 / 005B1BF5` | `005AE2B0`: 耐久==0，或有效据点城兵==0 | attacker troop，mode=!adjacent |

`00483DB0`按source x奇偶查6个坐标偏移，不是曼哈顿距离。同格不是相邻。原attack record的source/target坐标用于这次判断；投影要求其对应输入世界/source坐标。

三处caller都经过关系排除`004B6260→004B5D70`：两国pointer均合法时，同国、source→target盟约位、或source→target停战byte>0均阻止；任一country pointer非法则helper返回“不阻止”，不能额外发明“必须双方有效势力”caller gate。

陷阱特别注意：关系判断用原arg4 country，capture source/新势力用原arg3 object，两者不能未核上游就强制等同。模型保留单独的`command.relationship`观测；fire/attack则验证sourceForce与source object一致。关系helper复刻不等于全套外交系统。

有效据点不是只看type：`00486680`要求type0+ID0..41、type1+ID42..51（关）、type2+ID52..86（港）。fire/trap未完内政与已完成陷阱等早分支、damage计算仍是上游范围；模型输入是伤害已应用之后的快照和带来源的`upstreamEligible`。

mode只在`004B3180`传入`004B1280`第5参数；S1该完整body没有读取对应参数槽。保留trace值，不赋予未经证实的资源/俘虏倍率。历史事件、劝降、脚本接管及间接调用覆盖仍open。

## 4. 完整世界候选，不再传预资格ID

输入是当时全局链表顺序的building记录、64项设施class表、坐标对应map word和128 byte地域读取窗口。不是预筛过的普通内政ID，也不按ID、造价、等级排序。

地图getter `00487920`：

```text
cellIndex = signed16(x)*200 + signed16(y)
region = (uint32(cell.wordAtPlus4) >> 5) & 127
cityId = uint8(memory[0079C2B0 + region])
```

`004839F0`只有最后的byte查表，没有额外过滤。128是mask可达读取窗口，不等于已证明有128个有效行政区域；窗口尾甚至重叠邻格偏移表。模型拒绝缺失映射、越界坐标并显式要求输入地域数据provenance，不把安全输入限制说成原机code自身的边界检查。

只有城市ID0..41进入这个分支；关港不会收集母城设施。`004922C0`先推进cursor再处理当前payload，避免删当前节点破坏遍历。

逐节点依次处理：

1. 原owner在0..46、建筑force==原owner、同城、非class4/0、且`class1 || class2 || (class3 && type!=24)`，立即调用`004B09B0(building,0)`，不看完成状态
2. 独立重新检查pointer；class4且同城的内政分支**不检查owner**
3. state==0立即毁；type30先将treasure42 holder/city/state请求重置为(-1,-1,0)，不编造随机迁移位置
4. state非0且type30保留在quota外；其余依序最多收入30个；第31个以后跳过，不自动毁
5. 复用P0-46的full-range swap、魅力quota、新force ID0..41 gate与销毁前缀

投影在RNG前按访问顺序unlink立即销毁对象，RNG后unlink选择前缀，不给单设施额外战斗loot。source真实销毁还包括设施计数器、人员目标、force amount、事件12、AI target和显示队列；这些在本模型范围之外，必须进入fallback ledger。静态研究不是已经实现这些副作用。

`00487EB0`说明存活domestic的force动态来自上述地域城市；因此转属后刷新全部存活同城class4，包括type30和overflow。`004867D0`只为城市/关/港解析军团，内政建筑返回-1，不能给它们虚构继承军团。

## 5. 资源→ownership→entry→耐久

来源顺序为：人员/俘虏预处理→保留资源→设施收集/销毁→ownership finalizer→条件入城→太守整理→半max耐久→军队目标重置/显示恢复。

### 5.1 保留资源只是中间值

`004B329B..004B33C5`：`percent=max(5,floor(commanderCharmByte/10))`，无有效部队主将时默认5。依次写`floor(current*percent/100)`的金、粮、兵、12兵装；保留兵为0则气力0。不是新军团长魅力，也不擅自替换为君主魅力。

### 5.2 普通新势力转属

source force pointer合法、numeric ID0..41、legion pointer合法→`004B40C0(base,newLegion,0)`。军团/force关系必须一致；原机owner是由军团解析，模型独立保存两者只为可检验投影。

`004AD550→004876A0→0047CBD0/00483730/0048DB30`先写新军团，再把current durability向下cap到新max。`0047A7D0`为intrinsic base max，加合法存活owner tech26时3000。

不同force时，城市flags只清bits0、1、4（mask0x13）；普通路径不直接清fire。后续气力cap、城市治安`min(100,max(old,70+floor(newLegionLeaderCharm/5)))`（无军团长用0），再兵、金、粮和12兵装cap。军团长魅力与攻城主将是不同输入。

同force换军团走短路，跳过后续治安/气力/资源caps。本投影测试此helper边界；正常fire/attack同force会先被关系gate挡住，trap的arg4关系来源可不同。

### 5.3 中立化清零

不满足普通转属→`004B49B0→004AE0A0`：先军团/force=-1并向下cap neutral max，再金粮兵/12兵装/气力清0、fire清0、governor=-1。城市另清flags0x13并写opaque字段city+0x8C=-1；模型字段`cityQueueId`只是工程字段名，不确立原作用途。

没有直接把publicOrder或durability清0。资源保留的非零中间值这时会消失，不能重复给capturing force奖励。

### 5.4 普通入城资源投影

顶层要求source troop合法、force数值0..41及`0049D640(targetPos,radius,sourcePos)`为真；城市radius2，其他radius1。完整range helper尚未在模型内实现，必须显式提供带来源的`entryRangePass`，不能用cause猜是否入城。

普通投影必须选`entryProfile=ordinary-no-owner-change`：有效普通战斗部队/有效主将，非king/dudu/transport，不会再次改变ownership，目标已在预期force/legion。原机支持更多分支，排除它们是模型范围限制而非原作拒绝条件。

`004BF489..004BF514`及`004B9840`：

```text
morale = min(currentCap, floor((oldTroops*oldMorale + incomingTroops*incomingMorale)
                              / (oldTroops+incomingTroops)))
# 分母0时为0
add gold -> food -> troops -> 12 ordered cargo slots
# 每一步clamp到当时cap，兵数最终0则morale=0
```

使用完整incomingTroops加权，不能先裁掉溢出兵。cargo是12个(weaponId,amount)槽，ID可重复，逐槽clamp；非法weaponId跳过。投影记录实际added与discarded，资源不凭空重复。

source transport人员决策返回false仍到资源合并和消队，不把该bool理解为“交易失败”。king/dudu、neutral二次转属、人员归属与显示队列由显式fallback覆盖或拒绝，未伪闭合。投影即时标记source removed，与原显示active时延后删除的时序区别写进ledger。

容量不混用：模型要求显式old/normal/neutral容量及provenance。S1城市金100000、粮1000000，兵装0..4为100000、5..11为100；城兵cap的`004C0C30(city,0x26)`分支语义仍未命名。关港tech33会改变兵/金/粮/基础兵装cap；气力tech16为120，否则100。这些辅助来源常量记录在JSON所附body中，未作为无条件跨source默认值。

### 5.5 最终耐久

`004BCA30`是太守排名/整理；`004B3A20`是太守setter/事件8，不是max耐久修改器。最终`004B3643..004B366C`使用**当时**max：

```text
minimum = floor(maxDurabilityAtTail / 2)
if currentDurabilityAtTail < minimum: currentDurabilityAtTail = minimum
```

在明确排除外部callback写耐久、普通入城不再换owner的投影域，得到：

```text
post = max(min(pre, newOwnerMax), floor(newOwnerMax/2))
```

这是有前提的source-local scalar闭式；不能扩大为每次原游戏capture的无条件公式。tech26丢失会先降低旧current；获得会提高最终floor。事件/脚本/二次ownership不满足投影前提时仍需单独处理。

## 6. 接口、fallback与replay合同

`capture_transaction(state,command,policy,...)`只返回新state/trace，不修改输入。revision和transaction ID防止重复应用；被caller gate或策略拒绝不消耗selector RNG，不增加revision。

- state：完整世界输入、一个据点scalar、一个source snapshot、revision和已应用ID
- command：caller、独立关系观测、上游合法性、入城range结果、观测来源
- policy：显式ID、PK/Vanilla目标、旧/新/中立cap、未知效果`record-only|reject`、entry `source-scalar-projection|skip|reject`
- trace：全部before/after、command/policy、源profile、caller mode、世界资格访问、selector原draw、逐阶段结果、fallback ledger与数量

为安全整数模型，资源/输入兵限制≤1000000，max耐久限制在正signed16域，现有资源须符合显式old cap；这些是工程输入约束，不是额外原版规则。缺失/错误profile、重复ID、未知字段、缺地图、非法维度/类型直接拒绝，原输入不受部分写入影响。

`replay_capture_transaction`独立重给state/command/policy，消费已记录selector draws，不调用RNG；JSON roundtrip后全trace必须逐字canonical一致。哈希是完整性检查，不是签名。P0-46来源LCG state表示**selector入口**状态，人员预处理可能先消耗全局RNG，不能叫完整capture入口seed回放。

PK采用为`compatibility-reconstruction`；Vanilla需显式`PC-Vanilla-assumption`并标`compatibility-assumption`；PS2/Wii未支持。未知规则透明可替换，有明确ledger，未把它们升级为原作confirmed。

## 7. 验证与仍开放部分

参考校验包含静态范围哈希/连续字节、call目标、关键opcode、6邻格表、24个跨来源对照；世界资格顺序/容量/特例、三cause、关系gate、两ownership分支、max变化、气力取整/overflow/重复cargo、原子性、拒绝与零RNG、JSON与零RNG重放及输入/结果篡改检测。

仍开放：clean stock对照；人员/俘虏结果、force灭亡/量值变化、销毁设施各计数器与人员引用；太守选择tie-break；完整入城身份/运输/事件链；更广caller/scheduler、历史脚本/劝降；全球随机消费/真实存档回归；Vanilla各补丁与主机版。下一个可直接从现有S1静态资料推进的是`004B1280/004B2820`俘虏/人员分配，或`004C0C30(city,0x26)`城兵cap qualifier。缺clean EXE不阻止这些独立工作。
