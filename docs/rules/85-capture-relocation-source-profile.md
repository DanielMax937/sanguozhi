# P0-50 据点陷落：旧俘虏前置释放、迁移目的地与执行顺序

更新：2026-10-04 UTC。基线main：`e4dab4be5e86bd3d410048137a9c2a3847f2f494`，PR #7已合入。承接[P0-49](84-capture-personnel-source-profile.md)。

- [结构化证据](../sources/capture-relocation-source-profile.json) · [新增文本字节](../sources/capture-relocation-source-profile/)
- [有界参考模型](../../scripts/capture_relocation_profile.py) · [校验](../../scripts/check_capture_relocation_profile.py)
- 运行：`python scripts/check_capture_relocation_profile.py`

## 1. 完成范围与来源边界

本组恢复S1旧俘虏前置循环、返回原势力路径、`004B0F50`目的地选择、`004A7990`迁移准备、缺席home-roster资格及建筑处分排序。有界模型投影人物字段，并保留顺序、事件触发时的局部人物快照、RNG消费及完整输入重放。它与P0-48/49仍是独立Python参考模块，尚未串成完整capture命令，没有接入TypeScript训练沙盒战斗。

来源沿用P0-49固定S1/S2及其URL、IDB/记录EXE指纹。S1输入路径含“血色5.0公测”；S2含“血色衣冠6.0sp5”。两者均MOD关联；未运行未知EXE，也未独立复算记录的EXE哈希。`opcode-exact`仅属于S1所列字节和有界局部路径。PC-PK1.1采用为`compatibility-reconstruction`，Vanilla显式另为`PC-Vanilla-assumed/compatibility-assumption`，PS2/Wii仍open。

共126个来源范围，其中38个复用P0-49文本，其余88个新增文本；63个S1/S2同地址窗口比较，58同、5异。S2窗口一致不等于完整S2 transitive链一致。**1084/1764个城市距离表byte不同**，不能跨源混用最近城市或期间结果。

## 2. 前置旧俘虏循环不是普通partition

`004B301A..004B30D3`发生于`004B3180→004B1280`之前：

1. `004CF360(target,mask0x20)`遍历目标所属人员链，保留有效身份5
2. `004AF4F0(property4,targetLocation,equal=1)`进一步保留实际位置等于目标的人
3. 按**观察到的链表顺序**迭代，不先按人物ID重新排序
4. 人物virtual+0x40得到的势力等于新势力，走直接解放；否则走`004A8970`

人物+0x98是所属据点，+0x9C是实际位置，二者不可合并。person virtual+0x44由`004883B0`读+0x94军团，virtual+0x40由`0047B2B0`经军团取势力；不能把+0x160旧属势力直接当当前势力。新模型因此从显式军团表求所属势力，没有独立可漂移的person.forceId缓存。

### 直接解放己方归属

顺序是status=3、formerForce=-1、captiveMonths=0、acted=true、归属source军团，再event4。此短路径没有`004A8970`的任务37、所属据点重定向或禁仕tail。模型不会统一套用“释放就全部清任务/清禁仕/移动”。官职等未被投影的字段保留，只是局部投影约定。

### 004A8970：仍存在的原势力

先记录原home据点当时的势力。然后：

- +0x160解析为有效原势力
- `00481240(force,1)`扫描军团ID0..46，取该势力**ordinal=1的第一个有效军团**，不是人物原军团或最近军团
- `00481210`取该势力君主的home所属据点
- `004A32F0`改军团、`004A31E0`改home，身份改3
- `004A7990(person,destination,-1,0)`准备任务期间并返回原/区域位置，随后`004A0CB0`将返回值写入实际位置
- `004A57B0`在原任务0..43时调用取消处理；其资源/命令专有副作用仅记录
- `00489BD0`写任务37及+0x140..+0x150的五个dword参数0，acted=true，并通知人员列表
- formerForce=-1、captiveMonths=0、acted=true，然后event4
- 最后若开始时记录的原home势力有效，设置禁止仕官君主为该势力君主、月份3

event4在这个禁仕tail**之前**。参考trace保留`personProjectionAtEmission`以免把最终局部字段误当事件收到的状态。事件本身不执行，不能据此证明真实回调不会修改字段。

结构参考表将+0x140起列为六个任务参数，但本setter只写五个，到+0x150为止。模型的`missionArgs`明确只代表这五个写入字段；+0x154和其他任务内部状态未投影。

### 原势力无效的另一条路径

`004A8970`在former势力无效时先检查禁仕byte：months>0且rawF0为0/1则清除；rawF0为2则取`max(1,months//2)`，旧禁仕君主无效则清除；其他rawF0保留。这个局部算术由`forbidden_adjustment`测试，**不升级为所有释放原因的通用规则**。

随后`004BBB00`会变为在野身份4，经过`004BA520`选择home、清军团/忠诚、重置任务、设置官职80、计算期间、刷新原城/军团/势力与event2/5/21等。`004BA520`包含位置/势力分支、其他helper和Random(42)，不能随便用“最近城市”替代。

此完整在野/灭亡链尚未投影。`defer-person`保留整个人、记录该人未执行任何阶段，包括releaseFlag可能对应的前置通知；`reject`在任何局部写入或draw前拒绝整批。没有为了可运行而偷加随机home，也没有将未投影字段当真实最终不变。

## 3. 004B0F50：目的地优先级、城市距离和RNG

函数接受context、person、flag。本组模型只支持安全有效的城港关pointer域，异常null返回/无效解引用路径拒绝，不模拟原程序未定义对象行为。

优先级：

1. person.home不是被捕获据点，直接返回已有home
2. 当前军团有效、flag非零、军团长不是本人且有效、军团长home在0..0x3FFF且不是目标，返回其home；模型进一步收窄为有效base0..86
3. 按city ID0..41收集当前军团城市，目标本身若是城市才移除；从中选最小距离
4. 如为空，再从**target所属势力**收集城市，做同样处理
5. 如仍为空，尝试该势力君主home（君主不是本人且有效、home不等于目标）
6. 最后`Random(42)`选0..41城市，不额外发明“只能己方/不能目标城”的过滤

港关目标不排除其母城。`004CE360/004CE2F0`的候选是城市，不是全建筑/部队。

`0049F1D0`对候选取得territorial-city距离，严格更小时重建tie列表，相等追加。同分按候选ID升序排列，再`00472150(tieCount)`抽index。**tieCount=1仍调用helper，但helper直接返回0，零LCG消费**；tieCount>=2更新LCG一次。此处与P0-49概率p=100仍消费随机不能混淆。

`0049E450`经坐标格地带取territorial city，`0047B480`读取`0x79B830[from*42+to]`的有向byte表。输入中`territorialCityId`是显式位置观察，未伪造地图数据或最短路算法。无效pointer或territory返回-1；nearest实际按带符号值比较，**-1不是无穷远**。模型保留这一边界。S1整张42×42表有字节hash；S2表1084格不同，被隔离为负对照。

LCG是已给定入口状态的`state*0x6C078965+0x3039 mod 2^32`，取高16位mod bound。支持注入draw或纯本地seed状态；不是认证原游戏初始化或全局消费流。

## 4. 004A7990不是瞬移finalizer

本组caller第三参数=-1、第四参数=0；第三参数在此body不参与计算，第四参数非零的君主/ownership分支不在实现域。

- 先`004A6340`：实际位置0..86直接作为origin；否则经人物坐标/地带取得区域base或-1
- origin>=0时由origin与destination的territorial-city距离得到期间；origin=-1时默认1
- 设置acted；`0048A8B0`只接收低byte写+0x158，所以距离-1写成255，并不是数学clamp到0
- 对符合势力条件的当前位置base和新的home base调用`004BCA30`，可能刷新太守/相关状态；模型记录有序refresh ID，不执行完整callback
- 返回规范化origin0..86，其他返回-1

+0x158命名`missionDuration`（任务期间）。没有把它未经scheduler证据称为“日数”或“旬数”。

**不同caller的写回必须区分：**

- 旧俘虏`004A8970`将返回origin交`004A0CB0`写实际位置
- `004B1950`只有target为部队的路径才检查成员并写返回origin；本组base capture路径在`004B1A75`跳过该段，所以**实际位置字段保留原值**，只改home/任务期间等

`004B1950`在调用目的地选择前还检查context+8“目标所属势力是否有其他城市”。没有其他城市时直接`004BBB00`，甚至不会使用某人的已有home或运行selector的Random(42)尾路径。模型分别测试standalone selector可达路径与caller硬gate，不能把helper可达性当成此caller可达性。

有效escape路径还会在跨军团时将都督status1改3、清原军团长职责，再给非君主分配新军团；非君主若仍是原home太守也改3。君主保留原军团。leader/governor对象的进一步变更仅记录，人物本身的局部status/legion写回有测试。

处分code2还先调用`004A9120`，再`004B1950(flag1)`；code5直接flag0。模型按此顺序记录前置调用，但treasure/message等副作用未执行，不凭空给技巧P或禁仕奖励。

## 5. 缺席home-roster与建筑处分排序

`004B31B3..004B3246`按所属据点人员链读取mask0xF，property0x4B过滤target旧势力，property4过滤实际位置不等于target，再跳过俘虏与`004891C0`判定的实际部队成员。后者不等同“location字段在87..1086”：模型要求独立`troopMember`观察，未自行模拟troop成员表。`absent_home_roster`要求**该阶段post-release roster**，保留观察顺序；不能拿修改前的列表自动充当完整迁移后的列表。

`004B2820`先复制escape+captured+缺席人员处理列表。建筑target调用`0047CD50(mode0,property0x14,descending1,arg0)`：

- vtable+0x14→`00488720→004C9610→004C90E0`
- raw identity由`004C8720`取得，但排序key随后查`0x8AB728`，S1表为`[0,1,2,3,5,4,6,7,8]`
- 身份4/5的rank互换，不能直接sort(status)
- descending comparator `006599E0`在相等时返回true，`0047BAA0`归并true取左，所以同rank**稳定保留输入序**；没有人物ID tie-break
- status=-1转成INT_MIN作为此降序路径的最低key

`dispatcher_order`只返回执行序，不执行AI选择或各处分。排序发生于新俘虏写status5之前；不得先调用P0-49 hold projection再用修改后的身份冒充来源执行序。部队target的主将移尾路径仍由P0-49说明，未混入此建筑排序适配器。

## 6. 输入契约、fallback与验证

事务API `project_personnel`接受`old-captive-prelude`或`escape-relocation`命令。世界输入包含完整87个base slot、完整相关稀疏人物/军团/势力观察；homeRosterIds必须与人物home membership一致且唯一，顺序由观察提供。非base人物的区域映射必须显式提供；无效origin pointer在期间计算时得到-1/byte255。

所有callback均为record-only，包括人员/军团链修改、可用标志、原任务取消及其资源副作用、太守/军团长对象、事件与force状态；`unknownEffects=reject`可拒绝整个部分投影。若callback在真实执行中改变人物、资源或候选列表，局部标量结果不保证等于最终原机结果。**本模型不提供“资源完全不变”的原作结论。**

命令有revision、重复ID、耗尽、精确schema与整批失败检查；输入不被修改。trace保存完整before/context/policy/after及draw。injected replay只用记录的draw；source-seed replay用纯本地整数再次验证同一LCG序列，既不调用外部随机服务，也不推进任何共享游戏RNG。重新计算hash的字段篡改仍被深比较发现；hash仅作完整性/一致性校验，不是来源认证或抗恶意签名。测试不是原EXE/真实存档回归。

34项测试涵盖126范围字节/hash、63对照、1764距离格、120种身份排序排列、2560种禁仕局部组合、前置链序与筛选、shortcut与返回原势力、完整目的地优先链、singleton/tie/random、last-city caller gate、港关母城、无效origin、任务期间byte写回、事件快照时序、君主/都督/太守边界、显式defer/reject、PK/Vanilla分离、原子性与重放，以及先迁移军团长会改变后续人的目的地与RNG消费。

下一步：继续`004BBB00→004BA520`游离/势力灭亡与任务取消resource callee、`004B03D0`AI处分完整callees、完整人物/军团/太守/force回调和P0-48/49/50组合。独立clean stock、RNG全局序列、真实存档、Vanilla/PS2/Wii仍是证据债。维护费forced-release的`0058C320/004A8E10`排序/裁剪不是本组建筑处分排序，仍open。

后续进展：[P0-51](86-personnel-detachment-source-profile.md)新增004BBB00/004BA520游离、invalid-former/last-city caller与部分任务取消资源的独立投影。本篇v1接口及defer trace保持兼容；完整监听器/force消亡/其他任务handler与stock仍open。
