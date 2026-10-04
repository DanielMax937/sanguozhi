# P0-51 人员游离、末城逃逸与任务取消资源

更新：2026-10-04 UTC。基线main：`453305b2dc64927a715fc58fceb0522557815f34`，PR #8已合入。承接[P0-50](85-capture-relocation-source-profile.md)。

- [结构化证据](../sources/personnel-detachment-source-profile.json)
- [有界游离投影](../../scripts/personnel_detachment_profile.py) · [验证](../../scripts/check_personnel_detachment_profile.py)
- [独立任务取消投影](../../scripts/mission_cancellation_profile.py) · [验证](../../scripts/check_mission_cancellation_profile.py)

## 1. 结论与证据边界

此前`004BBB00/004BA520`整人defer现在有独立、可拒绝的有界实现：选择在野home、设置实际所在territorial-city、军团/身份/忠诚/官职/任务期间、清原军师/太守/军团长，以及事件发射顺序。旧P0-50模块和v1 trace不静默改义；新入口明确接管此前未实现的三种路径：直接detach、原势力无效的俘虏释放、末城escape。

任务取消另有独立投影。`004A57B0→005B9B40`是按任务注册handler的dispatcher，**不是“取消必退款/必清任务”**。已恢复44个slot及cancel入口，部分为无操作；任务15..21的普通退款/返回路径可以执行，其他专用handler保留明确record/reject。不把未执行handler说成“无退款”。

两模块仍未与P0-48/49/50组合成完整capture，更没有接入训练沙盒战斗。人员链表、事件监听器、全势力灭亡/君主继承、AI处置和UI等未执行。`after`仅是关闭这些回调后的有界字段投影；回调不干预是显式工程前提，不是原机保证。

S1/S2沿用固定IDB指纹和公开URL，分别关联“血色5.0公测”和“血色衣冠6.0sp5”。未运行未知EXE；IDB记录的EXE哈希未独立重新计算。PC-PK采用仍是`compatibility-reconstruction`，Vanilla是独立`compatibility-assumption`；clean stock、真实存档/全局RNG和主机版保持open。

## 2. 004BA520在野home选择

`004BA490`先由有效旧home的坐标取territorial-city；home无效时改由人物实际位置的坐标取territorial-city。`00489610`证明人物virtual+0x3C来自实际base或troop位置，不能拿新的home冒充实际所在。

随后：

1. 无效person直接`Random(42)`返回
2. 初始anchor不在0..41时先`Random(42)`选anchor
3. 人物virtual+0x40数值不在0..46时直接返回anchor，不做邻城抽取。这个数值范围gate与`004BBB00`保存原force对象是否有效是两件事
4. 有势力编码且实际location在87..1086时，验证troop坐标后用其territorial-city覆盖anchor。**第2步已消费的随机不会退还**
5. `004B94E0→0047BC70`按城市ID0..41收集`distance[candidateCity,anchorCity]==1`，然后`Random(count)`选一项
6. 候选为空或返回不在0..41时，最后`Random(42)`，没有己方/中立/敌方、旧home、目标城或可仕官过滤

这不是“选最近己方城市”，也不是把P0-50最近同分selector套到在野。候选比较方向是candidate行、anchor列；S1邻接恰好对称不构成倒置参数的理由，测试另用非对称替身核验方向。所有42个anchor共146个distance1候选选项均逐项测试/重放。

S1 `00472150(1)`调用但不消费LCG；多候选消费一次。初始invalid-anchor、troop覆盖后的邻城抽取和最终fallback是各自独立的阶段。S2 RNG helper与距离表不同，detachment模型只采用S1；S2同地址函数窗口相同不证明跨helper效果相同。

## 3. 004BBB00字段和事件顺序

先保存旧status、旧home对象、旧legion对象和旧force对象。按源码顺序：

1. 若保存的旧force有效，event2，发生在home selector之前
2. 选择新home；`004A31E0`写home；`004A32F0`清legion=-1；status=4、loyalty=0、acted=1
3. 若旧force军师ID恰为本人，`004813E0`清advisor=-1
4. `004A5780`直接设mission=-1、五个参数=0。它不调用取消dispatcher
5. 实际所在是troop则`00495A50→0047B460`取territorial-city；否则由人物实际坐标取territorial-city。写实际location为该city或-1，设office=80
6. 计算实际territorial-city与新home的source距离，设置mission37及五参数0、acted，再把distance低byte写任务期间。-1写255，不替换为clamp0
7. 旧status<=2且旧home的governor为本人时，`004B3A20`先发event8，再清旧governor=-1
8. 旧status<=1且旧legion有效时，清leader=-1。此局部源码不再检查旧leader是否等于本人，模型也不添加这个条件
9. event5；若保存的旧force有效，再event21

`004A7410`内虽调用`004A57B0`，但第4步已把mission设成-1，故不进入旧任务cancel handler。这是关键调用次序，**不能对在野路线补发原任务退款**。

港/关实际位置也规范到territorial-city ID，不保留港/关ID。`troopMember`是前组`004891C0`资格观察；location改成city/-1后该谓词必为false，模型同步更新，不能保留一个“在部队里但location为city”的矛盾快照。具体旧部队人员列表的编辑仍在未投影ledger。

直接detach没有统一清formerForce/captiveMonths/forbidden；这些字段必须由相应caller处理，测试保留这个差别。源event通过`004BBAA0→004A8110`通知其他任务，再经过`004BA1D0`和UI callback；模型仅存局部人物/role快照，不执行监听器。

## 4. 两个caller的有界恢复

### 原势力无效的004A8970

入口要求有效俘虏且formerForce解析为无效。先执行P0-50已恢复的rawF0禁仕调整，再调用上述detach；随后清formerForce=-1、captiveMonths=0、acted，发event4。最后若进入release前旧home的force有效，再覆盖forbiddenLord=该势力君主、months=3。

所以event2/5/21看到的是禁仕初步调整；event4在清俘虏字段之后、最终禁仕tail之前。新模型保存各阶段快照，不能把最终状态倒灌到先前事件。

### 004B1950末城escape

只有target旧force无效或已无其他自有城市时进入这一条。此caller硬gate发生在`004B0F50`之前，因此即使某人已有别的home，也会进入detach。releaseFlag=true时先记录`004A9120`；宝物/通知等仍未执行。不伪造技巧P奖励或给全部escape统一禁仕。

## 5. 任务取消dispatch和退款边界

完整接口、注册表和字节见结构化证据的missionCancellationDispatch字段；check直接校验对应源码范围和注册slot，而非只断言手写常量。

`004A57B0`先检测已分配指针，再只对mission0..43调用`005B9B40`。mission37直接返回；其他slot调用handler vtable+0xC(person, scratch[-1,0,0])。dispatcher自身不清mission或退款，合法与否仍由各handler gate决定。

已投影任务15/16/18取原args[1]作为退款；20/21取原args[2]；17/19为0。共同gate要求person和args[0]目标force有效；20还要求args[2]>=1000与目标person有效；21另要求两个目标base有效。gate失败是无操作，不走通用取消重置。

`005BC9F0→005B8400`比较规范化实际base location与home：

- 异地：设置mission37、args=[refund,0,0,0,0]、acted=true、任务期间=调用距离helper结果低byte；**不立即加金**。这里保留带provenance的实际helper结果输入，没有用估计天数代替它
- 同地：mission=-1/五参数0、duration=0、acted，然后仅refund>0才调用`004AE2A0`。非俘虏还进入`004BF6F0`返回home处理，后者仍记录未执行
- 金钱加法先按x86有符号32位ADD解释，再做非正归0/上限裁剪；overflow不是Python无限精度加法

S1 city cap=100000；S2=200000。S1港关在有效force/query33为真时40000，否则10000；S2改query38与100000/50000。这些query是来源绑定的显式布尔观察，不冒充已恢复完整科技查询器。

S2 `004A5600`在acted路径改调`0090CBA0`，读取`004890F0(person,267)`；结果非零跳过acted setter。该hook也有文本字节，不混成S1规则。S2复用仅限此模块明确建模的source分支，不表示完整S2/stock/Vanilla等价。

## 6. 可替换fallback与安全输入域

`record-detachment-callbacks-v1`投影已列标量/role，记录列表、mission监听、显示、势力/君主链等缺口。`unknownEffects=reject`在任何字段/RNG/event投影前拒绝整批；`unsupportedPerson=defer-person|reject`只针对未给定有效所在位置或不安全troop坐标，整个人延迟，不执行其前置event和随机。默认不把未知坐标当最近城或随机城。

detachment要求完整87个base观察、42个安全有效city slot；person/legion/force允许显式稀疏ID。可控的欠覆盖输入域与原机所有异常pointer行为分开。取消模块用allocated与valid两个观察区分原指针检查，缺少被引用slot报错，不能默认为无效。

detachment拒绝重复ID；取消模块对相同ID/相同command-hash幂等返回，payload冲突拒绝；两者都有revision检查、完整输入、policy、观察provenance与重放；随机仅使用注入draw或给定入口状态的本地LCG，未改共享RNG服务。输入深复制和late-error测试避免半写回。旧版本module/trace不自动接入资源状态，因为那需要额外base/force/mission handler上下文。

## 7. 验证

403个文本字节范围覆盖201组S1/S2同地址窗口（194同/7异）与1个S2独立hook。每个范围验证连续地址、长度、SHA256；合并文本容器另验证完整文件SHA256及line-range定位。44注册slot、43个非空slot的双源vtable+0xC、注册构造链与关键opcode直接对照手写模型。

全回归：TypeScript类型检查、85 Node、71个Python checker、两个训练demo通过。detachment 28项测试含146个邻城选择的全选项/重放、role/event快照、invalid-former/last-city、unsafe-defer/严格拒绝及源LCG；cancel 15项测试覆盖无操作/专用未解分流、7退款路径、source caps/query/hook、正/零/负退款、signed overflow、异地延迟、gate、原子性、幂等与完整trace篡改。独立审阅无未修阻断，另704组source/mission/location/policy重放/原子性/幂等扩测通过；仍不是运行原作或真实存档回归。

## 8. 仍未解决

- 独立clean PC-PK1.1 build/hash/bytes与真实存档、全局RNG验证
- 其他专用任务cancel handler的完整资源/外交/设施/人员副作用，以及普通返回`004BF6F0`完整投影
- `004A8110→005B9D30`事件监听任务链、`004B03D0`AI处分及玩家交互
- 旧部队/人员/军团列表、force消亡、君主继承、关系及设施计数器的完整事务组合
- Vanilla、PS2/Wii和补丁版本各自证据

因此本组关闭的是特定helper缺body和明确有界实施缺口，不关闭“完整势力灭亡”或“所有TODO”。
