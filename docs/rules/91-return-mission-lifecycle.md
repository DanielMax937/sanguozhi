# P0-56 mission37完成、一步移动与延迟退款

更新：2026-10-04 UTC。基线main `b488a9f6a38fbb45e6e6c2ac64cd68f6fa3f97ed`（PR #13已合）。承接[P0-55](90-special-mission-cancellation.md)。

- [结构化证据](../sources/return-mission-lifecycle.json) · [文本字节与来源说明](../sources/return-mission-lifecycle/README.md)
- [独立模型](../../scripts/return_mission_lifecycle_profile.py)
- [模型测试](../../scripts/check_return_mission_lifecycle_profile.py) · [字节检查](../../scripts/check_return_mission_source.py)

## 1. 已完成范围与原性边界

独立API `project_return_mission(state, command, observations, policy)`接受两种command.kind：

- `complete`：单独投影`005B9B90`的mission37完成helper
- `advance`：一个由调用方提供的active-list节点，应用本次读取的资格/stop gate，投影至多一座城市移动或到达完成

这补上了已有取消API的“异地退款存进mission37，何时实际加金”的有界闭环。旧v1/v2/group/facility/special API和trace版本完全保留，不把此模型插入旧trace。完整active-list、外部acted重置、全局旬调度和capture组合都未实现；也没有接入TypeScript训练沙盒的新战斗指令。

两份IDB均MOD关联。106个范围直接重读、source完整哈希核验；53组S1/S2比较46同、7异。另对`00599DF8..0059A019`person pass单独核哈希，确实相同。S2后部建筑更新hook不在此pass中；源距离表1764格中1084格不同，必须按source分别读取。未运行EXE，IDB所记EXE hash不冒充独立binary认证。PC-PK1.1为`compatibility-reconstruction`，Vanilla单列`compatibility-assumption`，stock、主机版和真实存档仍open。

## 2. 完成不走取消，先退款再reset

`005B9B40`取消dispatch主动跳过37；完成由`005B9E10`的两级switch table转到`005B9B90`，不能套用取消顺序。

`005B9B90`：

1. actor无效则返回1，无标量写入
2. 解析actor.home，调用person/home的virtual+44；两个结果没有被比较，因此没有军团相等gate
3. 仅当signed args[0]>0，调用`004AE2A0(home, refund)`加金
4. `004A5780`清mission=-1和五个参数为0
5. `004A5660`把duration byte清0；返回1

**完成是refund→mission/args reset→duration0。** 取消`005B8400`的同地路线恰好先reset再refund，不能混同。完成helper没有同地条件、acted/location写入或`004BF6F0`调用；standalone complete保留输入acted/location，哪怕人还在别处。这个入口是helper投影，不伪装成“允许远程领取”的游戏指令。

`005B9E10`的37分支不把helper EAX复制给其EDI返回槽，故**handler返回1，dispatcher返回0**；dispatcher清manager+4临时actor指针。arrival caller不使用返回值，而是重读mission是否仍在0..43。临时manager不是此state里的持久字段，只在step记录。

金钱沿用已审计的signed32加法后clamp，包括溢出转负归0和旧金超cap被下调的情况。S1城市100000、港关10000/40000(query33)，S2城市200000、港关50000/100000(query38)。force validity/query和资源子对象valid是显式源观察，不能跨source混入。非positive refund不读force/cap，也不要求资源子对象valid。

## 3. active-list成员不是全人物ID扫描

`00482AE0`返回manager+0x188链头。`0047BED0`先把node.next保存至cursor，再取node+8 payload；`00482F20`逐次读取该person当前状态，要求valid、mission0..43、acted bit0=false。是**链表顺序和live读取**，不是ID排序或回合开始的资格快照。`00599CF0`每次调用getter前检查global `096A59F8`停止flag，之后再次检查person valid。

本API要求`memberSelection=supplied-node-v1`，明确由调用方选择一个已观察节点；它只应用scalar过滤，不认证这个节点确实存在、不伪造链表、不跳到下一人。`globalStop`是来源相同的必要观察；true先短路。acted=true、invalid或mission域外是active-filter-no-op，域内非37则unsupported-mission。模型不按duration先过滤routed任务。

一步后acted=true，连续重提新命令不会继续赶路。下一外部phase必须提供经过独立重置的snapshot，再调用下一步；本模块没有隐式重置/日历推进。测试把这个外部阶段显式分开。工程revision/appliedCommands属于投影防重协议，accepted-no-op可登记命令，不代表原游戏执行了有效任务。

## 4. 六邻城严格最小值，零直接RNG

`005BA320`对37读取home，numeric0..16383时route=true，并返回目标building ID及`0049E450`territorial city。actor实际location只保留canonical0..86，否则-1，再得到当前位置territorial city。

`00598D60(currentCity,targetCity)`：

- current==target时直接返回target，不读城市子对象或邻城slot
- 否则验证current city对象；无效返回-1
- 按slot0..5读取运行时`city+0x1C`六个邻城dword，只接受numeric0..41
- 比较source自己的`0047B480(neighbor,target)`距离，严格小于才换候选
- 同分保留先出现slot；不按city ID排序、不随机、不要求新距离比当前更小、不检查邻城对象valid或ownership
- 无候选返回-1

模型分别固定S1/S2的1764-byte距离表和SHA；六neighbor slot、base territorial city与city subtype validity来自同source的显式观察。需要的域内slot缺失是错误，不当作invalid。invalid current building/非canonical实际location得到currentCity=-1，进入no-next；current city valid与building valid是不同对象观察。

已到达路径：guarded move到**目标building原ID**，因此同territorial city的港/关不会被错写成城市ID；duration先0，然后完成refund/reset。完成后mission=-1、actual base valid；非俘虏记录`004BF6F0(person,actualBase,1,1)`边界，随后direct `00489B40(0)`与direct `0048A8B0(0)`。

`0048A8B0`仍写person+0x158 **duration byte**，不是另一行动标志。S2到达acted清0直接调用`00489B40`，没有同地取消的query267 wrapper。俘虏status5跳过`004BF6F0`，仍清acted和duration。

未到达路径：`004A0CF0`move至选中city、direct acted1、duration写剩余距离低byte，保留mission37及refund参数。无next路径仅`004A5780`清mission/five args，不退款、不清duration、不清acted，也不调用full return。这个raw reset只是scalar writer，不杜撰active-list/cache回调。

## 5. 安全域限制不是source额外gate

原completion解析home后未先验证就dereference；源route也不要求targetCity有效。为避免替损坏/不完整指针造规则，此模型要求命名政策`homeDomain=valid-canonical-only-v1`：

- 到达/complete需已观察valid canonical home0..86
- 需要route时target territorial city必须0..41
- positive refund需valid资源子对象；港/关需已到达的force slot/query观察
- generic building home87..16383、invalid home、invalid target geography、invalid refund子对象均**整次拒绝、无写入**，返回具体unsupported原因

这些是有界模型限制，不是原作gate。源invalid targetCity=-1仍可用distance=-1选首个有效邻城并写duration255；此模型明确没有执行该不安全域。home=-1且duration>0的non-routed分支可无操作等待，duration不在这个pass内递减；duration0会到completion不安全域，明确拒绝。

在可投影move路径，valid person保证allocated，当前实际location是canonical base，因此`004891C0`的真实troop membership为false。模型没有把任意troop-range location都当“部队成员”；该位置在此caller更早规范成-1，因而没有下一城。目标canonical ID通过`00488350`原值保留。完整泛用move和generic home仍不是此API承诺。

## 6. 原子preflight、回调边界与重放

state保留source/revision/appliedCommands/persons/bases/forces，增加rngState；人物沿用此前scalar字段，raw home扩至-1..16383。observations严格包含source/provenance/globalStop/territories/cities；policy还要求`callbackAssumption=noninterference-v1`和`unknownEffects=record-only|reject`。

结构验证及实际branch所有必要观察的`_plan`发生在`_apply`/任何scalar writer之前。缺slot、缺stop、重复ID、bool冒充int、跨source观察、shape错误都报错；unsupported域无候选写入。所有计算在深拷贝上进行，输入不被修改，step/person/ledger快照互不别名。

完整return-home会写home/location/rawlegion/bit9、动roster、通知、ownership/capture及role/force；本组**不执行这些效果**。after的人员字段只是已声明scalar投影，full return也可能改变它们；继续调用尾部需要显式非干预假设。ledger保存调用参数、阶段snapshot及beforeStepIndex，不能把未投影字段保留误读为原机不变。virtual getter和force/query调用使用观察/非干预边界，move与acted的cache/UI调用也记录。record-only给出局部after，reject丢弃全部候选、after=before、steps=[]且不登记命令；reject ledger索引只描述丢弃候选。

本地路径无随机选择；输入rngState与输出相同，trace有calls=[]、consumed=0，并明确`unexecutedCallbacksCovered=false`。不声称全局或回调随机流零消耗。

command ID/hash防止重复退款；kind属于hash，complete/advance不可同ID互换。revision冲突和payload冲突拒绝。新ID重做已经completed的person不会再次refund。trace包含全部输入、分支计划、source、policy、完整before/after、steps/ledger/RNG和hash，JSON roundtrip后可完整replay，重签造假的after/RNG也被重算拒绝。hash不是来源观察的真实性签名。

## 7. 验证与下一范围

```sh
python scripts/check_return_mission_source.py
python scripts/check_return_mission_lifecycle_profile.py
npm run check
for f in scripts/check_*.py; do python "$f"; done
npm run demo
npm run demo:lifecycle
```

新增16项source测试和27项模型测试（含256组source/neighbor oracle与完整replay），覆盖refund-before-reset、source cap/query、signed溢出、同地域港关到达、no-next保留字段、active gate、外部acted重置、延迟退款串接旧cancel v2、preflight、缺slot、原子reject、revision/防重、篡改重放和零local RNG。

全回归82条命令通过：TypeScript、85 Node、79 Python checker与两demo。独立审阅核对全部106范围与两个1764格距离矩阵，旧v1/v2/group/facility/special 15/15/20/24/21 tests及新增27+16 tests重跑通过；port/gate force/query ledger现位于退款写之前，阶段快照测试已复核，无剩余阻断。合并后main仍须复测。

后续优先独立实现`004BF6F0`的home/location/rawlegion/bit9/list ledger，再把稳定非空军团的`004BE2A0`角色reconcile作为单独有界主题。ruler capture、空军团合并、force灭亡、`004A8110→005B9D30`事件监听、base销毁、全active-list/全scheduler/capture组合以及clean stock/Vanilla/真实存档继续open。
