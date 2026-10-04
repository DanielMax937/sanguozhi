# P0-53 组任务取消、城市计数与研究字段

后续：P0-55在[独立能力培养取消模型](90-special-mission-cancellation.md)投影41..43；本页保留历史API与证据边界，完整return/回调仍open。

后续：P0-54在[独立设施模型](89-facility-mission-cancellation.md)投影0/38及type3..63部分销毁；本页保留历史API与证据边界，完整base销毁/回调仍open。

更新：2026-10-04 UTC。基线main `b95e33a7c1e23e7bc14a8ec23b90ff5030099c8e`（PR #10已合）。承接[P0-52](87-mission-cancellation-zero-refund.md)。

- [结构化证据](../sources/group-mission-cancellation.json)
- [有界模型](../../scripts/group_mission_cancellation_profile.py) · [验证](../../scripts/check_group_mission_cancellation_profile.py)

## 1. 范围与版本

任务2的`005C6AA0`、任务5的`005D7FC0`现有独立组事务投影：验证发起人/所在地/目标参数，完整稀疏人员域里按源ID顺序取前三人，先写城市或势力字段，再逐人取消/返回。源handler正文相同不代表所有helper等价：S2研究getter和setter都有扩展，已单独追到`00914000`hook。

P0-51 v1与P0-52 v2文件、接口和trace均未改义；新模块显式接收增加后的人员、city-subtype和研究字段。其他mission返回unsupported，不伪装已处理0/38或41..43。`collect_group`恢复的helper也支持mission0分组，**不代表mission0取消及设施销毁已实现**。

来源仍是两份MOD关联IDB。指纹、记录输入路径、公开源URL都在证据中；EXE记录哈希未独立认证，也未运行未知EXE。PC-PK1.1采用是`compatibility-reconstruction`，Vanilla独立为`compatibility-assumption`，不是stock或跨平台证明。

## 2. 共同gate和005B8250分组

两handler先检查actor有效，然后实际location规范为0..86据点或-1，检验对应建筑有效。与任务0/38不同，任务2/5没有“当前建筑必须type0”的额外条件，港/关也可以通过。随后arg0要求0..41，arg1解析为本任务的数据对象并检查有效性。

`005B8250(mission, groupId, output, 3)`扫描person ID0..1099：

1. person有效
2. person.missionId与指定mission相同
3. 组键相同：mission0读args[1]，mission2/5读args[2]
4. 按ID序保留前三人，达到3立即停止

组键是有符号32位值，不额外排除-1或0。不按force、home、actual location、任务目标或actor身份过滤。输出未必包含发起actor：若三个较小ID匹配者已占满，actor也会留在原任务上。组成员与actor的target不同亦不会被剔除；使用actor参数做本次城市/研究字段更新。

模型要求`personsComplete: true`，明确将缺少的person slot解释为这个完整稀疏宇宙中的无效/不存在slot；不是默认拿局部名单当全世界。全部提供人物仍严格检查类型与重复ID。collector顺序不取输入数组顺序。组快照先于城市/势力写入；回到每个捕获的指针时再检查valid。未执行callback且不干预的政策下，该valid不会在两次检查间改变。

## 3. 任务2：计数恢复在逐人返回之前

arg1经`00490BC0`解析武器类型数据对象，ID域0..11，有效性是硬gate。arg0数值合法并不代表city-subtype有效：组收集后才进入`004B3EE0(city, weaponType, +1)`，它检查城市子对象valid。城市无效只跳过计数字段，**仍继续逐人取消/返回**。

`004B4018`跳转表和`004B4028`索引表恢复出四路：

- 类型1..3：city+0xA9
- 类型4：city+0xAA
- 类型5..8：city+0xAB
- 类型9..11：city+0xAC
- 类型0：数据对象若有效可通过前gate，但这个helper不写任何计数

这四项按有符号byte读取，先加1，再clamp[-1,30]。模型用`rawCountersA9AC`明确记录原字段，不把它们误写成库存装备或发明额外退款。输入域覆盖signed byte的-128..127：例如-128+1会写-1，127+1会写30；不是只测试正常0..30。helper返回新旧差值，调用方不使用它决定取消成功。

顺序为：分组 → 城市计数写入/无操作 → 条件展示 → 按组序`005B8400(person,0)`。不能先清任务参数，再回头从清零后的args读取要恢复哪一项。

## 4. 任务5：actor势力研究字段与S2扩展

arg1经`00490C70`解析研究数据对象。S1只允许0..35；S2原范围外的null分支改跳`00914000..00914017`，扩展到36..63。hook使用unsigned `JA63`，所以负数仍为null，不把负数当扩展数组下标。数据对象valid仍须单独观察；范围合法并不自动有效。

组收集后，用**actor的virtual+0x40 force**解析势力，不用当前建筑owner、目标城市owner或第一个组员force代替。如果actor势力有效，`004B53E0(force,-1,0)`依次执行：

1. `004815C0`写force+0x9C=-1
2. `004815E0`写force+0xA0的低byte=0

S1 setter正常ID域为0..35或-1，S2为0..63或-1；本次写-1两源皆允许。模型保留researchId/researchDuration的前后值，但不猜duration的时间单位。即使取消的arg1与force当前researchId不同，此路径仍清actor势力字段，未加相等性检查。

actor势力无效只跳过研究字段，不阻止后续组取消。这个handler的target city对象只在未执行展示分支里使用，故标量域不额外要求target city有效。随后才记展示ledger，再按组序返回；各组员可属于不同势力，本次只改actor势力研究字段。

## 5. 逐人零退款返回与原子契约

每个组员独立比较规范化actual base和home，不重新套actor的所在地gate。例如组员location是troop时，`005B8400`仍把它规范为-1；这个直接helper调用与P0-52六handler的前gate不同。

- 异地：逐人要求带provenance的距离观察，记录`0049E4D0`，再mission37/args全0/acted，cache与active-person list未执行，最后写duration低byte（-1→255）。actual location/home不变
- 同地：mission=-1/args0 → duration0 → acted。S2 query267为true保留acted，false置true；异地直接setter不经过hook
- refund恒0，不调用加金，不更改基地money或其他未列资源。非俘虏记录`004BF6F0(person, home, 0, 1)`未执行；status5跳过该返回尾调用

每个人都保存字段阶段快照；接受投影的unknown ledger含`beforeStepIndex`，可定位展示、cache/list和return边界相对于标量步骤的顺序。严格拒绝的trace会清空steps；此时ledger索引属于已丢弃的候选序列，不能直接拿来索引空steps。`record-group-cancellation-v1`的record-only是假设这些未执行回调不干预局部投影；`unknownEffects=reject`整笔拒绝。不能把局部after称作完整原作final state。

完整输入先校验；必要slot观察缺失不会猜无效。分组后、任何城市/force/人物写入前，额外作工程preflight：只按入选人物实际返回分支检查所需距离或S2 query267，缺观察立即报错；不要求未入选者或未走分支的观察。这是安全验证，不冒充原作额外调用。函数仍只编辑deep copy，后续错误也不会泄漏半写回。revision、command ID幂等/冲突、before/command/observations/policy、全部步骤/ledger/after和hash都进入重放；重签篡改的结果仍不能通过重算。hash不认证现实观察来源。

## 6. 验证与仍开放范围

新增20项测试，包含双源/两任务、按ID前三/actor排除/跨force与位置、完整signed-byte域与映射、无效城市/势力软分支、研究35/36/63/64边界、S2 acted、字段/回调顺序与阶段快照、所有写入前观察preflight及错误原子性、幂等/冲突与重放篡改。

21个新增byte范围整合到两个文本容器；10组S1/S2同地址比较为8同/2异，另独立S2 hook。另锁定前两组manifest哈希并引用25个已验证范围。handler有直接相对CALL顺序断言；完整source字节、容器SHA、line-range、分组上限/键slot、四路跳转表、force写入和S2扩展分支均有回归。TypeScript、85 Node、73 Python checker与两demo全过。独立审阅已复核20项新增、旧v1/v2各15和detachment28测试、1024组独立oracle/重放及16组mutation/domain验证，两份IDB的46个范围也重新提取一致；观察preflight修复已通过终审，无待修阻断。合并后main还需复测；详见[STATUS](STATUS.md)。

继续开放：mission0/38设施销毁/宝物tail，41..43目标/显示helper，mission37完成，`004BF6F0`完整返回，任务event监听、AI、force灭亡与capture组合，以及clean stock/真实存档/全局RNG/Vanilla/主机版证据。这些不能用“组取消已经跑通”替代。
