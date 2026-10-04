# P0-55 能力培养任务41..43取消

更新：2026-10-04 UTC。基线main `8dd3a566b3d4627657ab2cbe9c50ccb3c9c84fdb`（PR #12已合）。承接[P0-54](89-facility-mission-cancellation.md)。

- [结构化证据](../sources/special-mission-cancellation.json)
- [独立有界API](../../scripts/special_mission_cancellation_profile.py)
- [模型校验](../../scripts/check_special_mission_cancellation_profile.py) · [字节校验](../../scripts/check_special_mission_cancellation_evidence.py)

## 1. 范围和来源

本组补齐mission41/42/43共同cancel handler `005D9C60`的有界投影。入口仍是`004A57B0→005B9B40`，检查allocated与任务0..43，dispatch scratch为`[-1,0,0]`。其他任务请用此前独立API；本API对域内非41..43返回`unsupported-mission`，不重复实现其行为。旧v1/v2/group/facility模块和旧trace均不改义，不自动把各部分拼成完整capture。

**S1/S2均MOD关联。** 本次直接重读两份完整IDB哈希和57段byte范围：新增10、引用47；28组双源比较27同/1异，唯一差异是已知S2 `004A5600`转向query267 hook。新代码采用IDA完整函数边界，新vtable数据严格为四byte。source字节exact不升级为clean stock：PC-PK1.1采用`compatibility-reconstruction`；Vanilla独立为`compatibility-assumption`；主机版open。未执行任何未知EXE，IDB所记录EXE哈希也未独立认证。

## 2. 有序gate：培养记录不是人物

`005D9C60`按下面顺序短路：

1. `0047A630(actor)` valid
2. `004897B0(actor,1)`读args[1]，`00490D00`解析建筑ID0..16383，再检查valid
3. `004897B0(actor,0)`读args[0]，`00490F50`解析能力培养记录ID0..97，再检查valid
4. 条件展示；随后`005B8400(actor,0)`；返回1

任一gate失败返回0，无标量取消写入。模型的`accepted`表示该有界命令已处理，不等于原handler返回1；gate-no-op仍可推进工程revision。

`00490F50`的完整机器码明确：负数或大于`0x61`返回null，stride=`0x6C`，地址为scenario+`0x86DD8`+ID×stride。它不是person/force/research-tech getter，也不能拿前组研究技术0..35/63代替这个98条培养记录域。语义名称另由[社区结构体表](https://github.com/sean2077/311SireCustomizedPackageDev/blob/43afe4efe273cf3b6ab7833b9b6f5822bd331fd4/material/%E7%BB%93%E6%9E%84%E4%BD%93%E6%B1%87%E6%80%BB.md#21%E8%83%BD%E5%8A%9B%E5%9F%B9%E5%85%BB)的struct_ability_training/98/0x6C交叉确认，该命名本身不是stock证明。本次只需记录valid观察，不伪造培养完成或能力增值写入；目标建筑、培养记录均不被cancel标量投影修改。

**这里没有actor实际所在地valid gate。** 不得沿用P0-52/53/54的实际建筑前置限制，也没有“当前必须城市type0”条件。args[1]建筑valid不证明home或实际所在地valid。缺少实际/home建筑观察不阻止已走到的取消分支。

## 3. 通知取actor.home

此前vtable excerpt止于+0x14。本次独立读取：

| mission | vtable | +0x18 slot | target |
|---|---|---|---|
| 41 | 0084CDE8 | 0084CE00 | 005DA320 |
| 42 | 0084CE48 | 0084CE60 | 005DA320 |
| 43 | 0084CE64 | 0084CE7C | 005DA320 |

六个S1/S2 slot一致。constructor与+0xC cancel slot的此前原字节也重新核对，不能仅凭类名猜共享方法。

`005B81D0`涉及actor force/player/legion条件；true才调用virtual+0x18(actor,capabilityRecord)。`005DA320`格式化培养文本，消息ID`0x20B0`，读取actor+`0x98`的home，再`00490D00(home)→0063B180`。这里未新增home valid检查，通知地点不是args[1]或actual location。

当前API不执行展示条件、文本和通知，ledger明确`conditionEvaluated=false`与`notificationHomeId`。这是一条可能执行的条件路径，不能解读为每次实际发出了通知。整个未执行路径受显式`callbackAssumption=noninterference-v1`约束；`unknownEffects=reject`原子拒绝。不会为未执行的展示读取强迫调用方提供force/legion/home slot。

## 4. 零退款返回和哨兵边界

复用此前经过验证的`005B8400`标量投影，不修改共享实现。比较值是actual location在0..86时的原值，否则-1，与raw home比较。模型home允许-1..16383，actual location受既有人员输入域-1..1086约束；更大或损坏字段值不在此有界输入契约内。

- 不相等：要求显式距离观察；`004A73A0`先写mission37、五参数0、acted，然后cache/list边界，再`004A5660`写距离低byte。距离-1写255；不瞬移actual location，不增加钱
- 相等：`004A5780`先清mission/五参数，随后duration0、acted。S2的同地query267=true保留acted；S1无此hook。status!=5记录完整`004BF6F0(actor,home,0,1)`未执行
- troop location或-1在home=-1时，规范值确实相等：走同地reset，S2也需要query267观察。这不是原机所在地valid gate，应测试而不是额外拒绝
- home为设施引用、或与args[1]不同并不禁止异地返回；这不是对完整距离/回城实现的证明，距离仍是有来源声明的显式观察

具体写入阶段有person快照，未执行效果有整份候选状态快照与`beforeStepIndex`。不同地不会执行S2同地hook；同地不要求距离观察。完整return、角色/名册/force/事件修改继续open。

## 5. API、原子验证、fallback与重放

state包括source、revision、appliedCommands、persons、buildings和capabilityTraining。建筑/培养列表是被读取slot的观察；并未宣称完整世界，也没有全员扫描。缺失已到达的域内slot报错，不能静默当invalid；域外getter值为null，或被上游gate短路则无需该观察。提供的所有字段仍接受严格结构校验，bool不能伪装整数、重复ID拒绝。

observations保留provenance、returnDistance和s2Skill267。结构验证和实际分支的返回观察preflight发生在任何标量writer之前；缺项不会产生部分取消。所有处理在深拷贝候选上进行，输入和trace快照不别名。

显式`record-special-cancellation-v1`政策可选record-only/reject，并要求noninterference-v1。record-only返回局部after与未执行ledger；reject丢弃整个候选，after=before、steps=[]且不登记命令。reject ledger的阶段索引属于丢弃候选，不能索引空steps。这些是可替换工程边界，不是原作保证，也不声称完整事务已完成。

工程revision冲突拒绝；相同command ID/hash是幂等重放，payload不同拒绝。trace包含所有输入、policy、完整前后状态、steps、ledger和hash；replay重新执行并逐字段比对，重签伪造after也不能通过。hash仅用于完整性，不是原始观察的真实性签名。

## 6. 验证与剩余范围

```sh
python scripts/check_special_mission_cancellation_evidence.py
python scripts/check_special_mission_cancellation_profile.py
npm run check
for f in scripts/check_*.py; do python "$f"; done
npm run demo
npm run demo:lifecycle
```

新增8项字节测试与21项模型测试：双源三任务、gate次序/短路、建筑0..16383/培养0..97边界、无actual/home valid gate、troop/-1与home=-1、写入顺序/快照、S2 acted、观察preflight、严格输入、原子拒绝、revision/重放/重签篡改与360组确定性fuzz。

此前专用cancel的各个家族现都有分开的有界投影；这不关闭完整任务系统。base销毁、mission37完成、004BF6F0全返回、004A8110→005B9D30事件监听器、force消亡、capture组合、距离全链/全局RNG/真实存档以及clean stock/跨版本仍open。本组不实现mission37 completion。
