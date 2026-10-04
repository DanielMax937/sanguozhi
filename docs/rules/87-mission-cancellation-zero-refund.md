# P0-52 六个零退款任务取消 handler

更新：2026-10-04 UTC。基线main `324dd78b3c5a831cdf5d9406f63c492b7248bed4`（PR #9已合）。承接[P0-51](86-personnel-detachment-source-profile.md)。

- [结构化证据](../sources/mission-cancellation-zero-refund.json)
- [v2有界模型](../../scripts/mission_cancellation_v2_profile.py) · [检查](../../scripts/check_mission_cancellation_v2_profile.py)

## 1. 此次关闭的实施缺口

任务9、10、12、22、23、24不再只记“专用handler未执行”。六者通过各自gate后，均先经过条件展示分支，再明确调用`005B8400(actor, 0)`；零是直接调用参数，不是从资金未变化猜出的退款规则。没有额外AP、技巧P、粮、兵或装备返还。

本组采用独立v2入口，保留P0-51 v1文件、接口和trace语义。v1仍记录这些handler未知，旧trace依旧可重放；新v2也保留15..21、registry no-op及37跳过。此前用旧command ID记录过“未投影”的动作不会被重放成新效果；要作新的投影必须提交新ID和当前revision。

这仍是局部字段投影，未接入训练沙盒战争，也不是完整原作取消事务。`004BF6F0`、展示、cache、list、事件监听器没有被执行。S1和S2均来自MOD相关IDB，指纹、输入路径和公开来源沿用P0-51；两源六个handler正文完全相同不推出其被调helper、stock PC-PK1.1或Vanilla相同。

## 2. 精确gate与容易混淆的区别

六者首先检验actor的`0047A630`有效性，再读取实际location。只有0..86会保留，其他值规范为-1；随后`00490D00`取建筑对象并检验其有效性。这个gate不读取home代替实际location，不接受troop location，也不把在部队的武将瞬移回城。只有当前建筑有效，才处理arg0。

- 9→`005CB050`、10→`005D5DD0`：arg0只检查有符号范围0..16383，没有目标有效性gate。显示分支可用目标指针，但不能反推取消要求目标有效
- 12→`005C4E70`：arg0只检查0..1099。后续`00490B00`解析目标person，但没有`IsLegalPtr(target)`检查；无效/缺席的目标person不阻止已恢复的标量取消路线
- 22→`005BEDA0`：arg0解析为0..46势力，必须有效
- 23→`005B6D00`：arg0先规范为0..41，然后通过`00490A10`取city-subtype对象并检验有效性。不能拿同ID的建筑对象有效性代替城市子对象
- 24→`005CFB70`：arg0通过`00490D00`解析建筑并检验有效性。getter域是0..16383，**不是0..86**；目标可以是非据点设施

gate短路顺序被记录；gate失败返回0，没有任务/行动/资源字段写入，也不会进入条件展示。通过后handler尾返回1。actor所属势力的查询服务于显示，不是这六个handler的额外硬gate。模型不执行显示读取，故不要求补全那些不影响标量取消的目标、force和legion槽位。

`bases`沿用旧有据点字段。`observations.targetBuildings`是额外0..16383建筑槽位的valid观察，与已给出的base同ID时必须一致；`targetCities`是独立0..41子对象观察，可以与同ID建筑valid不同。需要的有效范围内槽位未提供时报错；超出getter域按null处理。二者均要求ID不重复和真正boolean值。

## 3. 005B8400字段、副作用顺序

通过gate后的条件展示被记入ledger，明确采用“未执行且不干预本次标量投影”的工程前提，绝不声称已恢复实际显示或监听器。

实际base与home不同：先使用带provenance的`0049E4D0`返回观察，再设置mission37、五个参数全0、acted=true，最后将距离低byte写duration。cancelOld=false，不递归取消旧任务；不写实际location和home，不立即进入`004BF6F0`。距离仍是helper观察，未换成虚构几何距离；-1写255。

实际base与home相同：先`004A5780`写mission=-1/五参数0，再duration=0，然后`004A5600`处理acted。退款恒0，因此不会调用加金helper。status不是5时记录`004BF6F0(person, home, 0, 1)`未执行；俘虏跳过该尾调用。其他人物与base/force资源原样保留。

S1 acted置true。S2同地分支仍有query267 hook：观察为true保留原acted，false设true。异地分支直接调`00489B40`，不经过S2 hook。source绑定延续P0-51，不从相同handler字节推断相同acted结果。

## 4. fallback、安全性和版本

`record-zero-refund-cancellation-v2`的`unknownEffects=record-only`明确保留展示、cache/list和返回尾调用的缺口，`reject`则在任何写回前拒绝整个投影。已知gate失败/no-op无需假造未知副作用，严格策略下也可接受无操作结果。缺少距离或S2 hook观察不是任意default，而是输入错误；函数深复制并不修改输入，即使错误发生在局部候选状态已经写入之后。

完整trace包含before、command、observations、policy、source、步骤、ledger、after和hash。重放独立重算全部结果，篡改after、步骤、证据状态或ledger后重签hash也不能通过。hash不认证现实世界观察；一致更改输入只会构成另一个模拟。PK采用标为`compatibility-reconstruction`；Vanilla是单独`compatibility-assumption`，并未实现/验证Vanilla。

## 5. 验证与剩余范围

新增15项测试覆盖六handler×来源×同地/异地、gate短路、target12无有效性gate、target24非据点域、city-subtype分离、S2 hook/俘虏、输入错误原子性、幂等/revision冲突、v1隔离与全trace重放。既有源码容器由P0-51 checker验证；本组锁定其manifest SHA256，逐个复核引用范围，并增加双源`00490A10`和`005B81D0`四个文本字节范围。直接零退款调用参数、边界比较和target12 getter→展示的无valid-check顺序均有opcode断言。

TypeScript、85 Node、72 Python checker与两训练demo全通过。独立审阅无待修阻断，另5760组source/gate/boundary/policy/trace和12组v1命令迁移/快照alias验证通过，四个新增范围也从两份IDB重新提取核验。合并后main还需复测，详细结果记于[STATUS](STATUS.md)。当前继续开放：0/2/5/38的人员组/设施/研究字段，41/42/43的目标与展示helper，`004BF6F0`完整返回、mission37完成、事件监听、force消亡与完整capture组合；clean stock、原机/真实存档、全局RNG、Vanilla及主机版证据不因本组通过而关闭。
