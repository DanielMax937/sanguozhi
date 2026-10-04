# P0-61 共享live frame的event8/14与handler/tail事务

更新：2026-10-04 UTC。基线main `1e5862e045c9aec3db14540c2bd8decc565a321b`（PR #18已合）。承接[P0-59](94-mission-event-listeners.md)与[P0-60](95-mission-notification-tail.md)，两个旧API、schema与trace不改。

- [结构化证据](../sources/mission-event-composition.json) · [字节域](../sources/mission-event-composition/README.md)
- [共享frame与primitive adapters](../../scripts/mission_composition_frame.py)
- [组合模型](../../scripts/mission_event_composition_profile.py)
- [模型检查](../../scripts/check_mission_event_composition_profile.py) · [来源检查](../../scripts/check_mission_event_composition_source.py)

## 1. 本次可执行范围

`project_mission_event_composition(state, command, observations, policy)`从`004BBAA0(event8/14)`入口执行一次新版本事务，内部只有一个frame owner、一个有序boundary流、一次revision提交。它直接调用已恢复的predicate与tail primitive，不调用旧`project_*`事务，不拼接旧非干预trace，不在中间提交revision。

调用序为：栈event三字段 → `004A8110`复制/遍历任务列表 → 真predicate后的原handler入口门、通知门、presentation边界与`005B8400(actor,0)`已知写序 → 销毁临时列表 → `004BA1D0`的8/14空分支 → **重新读取**`004EC870` → 当前observer非空时virtual+1B4(0,0,0,0) → wrapper返回。

004EC870只有读取global091BA048并返回。最后observer的存在性不能沿用handler/acted阶段的值。handler内observer或full-return观察可将它变成空/非空，最后wrapper必须使用最新值。004BBAA0的wrapper调用序已闭合，observer/presentation/完整004BF6F0的函数体仍未闭合。

该API是独立Python参考模型，没有接入训练沙盒、角色协调或完整capture。完整return/role闭包下一版本再接入；不能把此输出当作完整原机角色事务。

## 2. 单一frame与版本化adapter

共享域`source-idb-S1-S2-live-mission-frame-v1`采用P0-60严格canonical frame：persons/buildings/CITY/forces/legions固定slot、完整person status/home/location/rawlegion/mission/args/duration/flags124、active节点序、live executing、managerDirty、observerPresent、rngState和声明的opaque data。

- listener adapter直接用同一个owner执行P0-59 predicate，所有table/valid读取都解析**当前**frame
- tail adapter直接用同一个owner执行P0-60已知primitive；boundary替换owner.frame后，后续person/slot读取立即看到新值
- `listener_snapshot`是明确有损、只读诊断投影；`tail_snapshot`是完整分离快照；均不用于回写或迁移旧state
- 没有暗补allocated/status/forces/observer等默认值的旧schema升级；调用者必须显式提供新域
- 与P0-59旧稀疏域不同，新域中缺少合法范围slot意味着观察不足并报错，不能当invalid；范围外getter仍返回sentinel

observerPresent只表达有无，不认证observer具体pointer/vtable身份；需要区分对象的捕获必须在声明的opaque data中保存身份，并由完整before/after绑定。

各层只有primitive重用，没有旧模块的after/trace级组合。旧源码作为版本固定依赖由来源checker锁定，旧公开入口保持原语义。

## 3. copied nodes、live reads与native saved locals

004A8110保存进入时active节点pointer序列，含重复。每次访问重新读取executing和mission；一次handler改global列表不改当前复制序列，改后续人物任务或executing则立即生效。dispatcher捕获mission一次，真predicate后的handler不重新要求live mission=23/24；handler0仍dispatcher1。

新的`callStack`在每一步和每条boundary保存嵌套调用域：

1. wrapper：完整event，包括subject pointer身份与argument
2. listener：本次copied节点序列
3. dispatcher：visitIndex、personId、capturedMissionId
4. handler：原生保存current building、target类型/ID与force+44
5. return：personId、refund0、normalized actual location、saved raw home；异地查询后还保存distance

这些是单次native调用的局部值，与可被替换的live frame分离。presentation后return重新读live home/location；进入return后observer再改home，不改已保存full-return实参；异地observer改valid/list/mission，不改保存distance。事件subject身份保持原指针ID，但subject的valid/rawkind等内容在后来predicate按live slot读。

`callStack`不是已恢复完整CPU/栈内存的声称。边界里的callback若触发递归event，其全效果归入该完整mutable observation；本组不虚构未知callback内部的递归指令轨迹。

## 4. 显式观察、拒绝与随机

所有unknown effect只允许`unknownEffects=observed-frame`或`reject`：presentation、S2 query267 result+effect、acted observer、完整004BF6F0、最后wrapper observer。distance是纯结果query，不猜地理。每条记录精确绑定source、连续index、kind/helper、实参、完整callStack/native locals、完整before与provenance。

mutable after必须保留所有固定slot及list以外命名object-key域。可改变任何提供的live字段、嵌套data、active节点、executing、observer存在性与RNG。没有隐式identity transition，也不因为callback名字像“UI”而假定无干预。观察可为原机捕获或明确synthetic的可替换规则；模型只能验证绑定、域与重放，不能认证观察真实性或原机可达性。

纯已知代码local RNG calls=0；所有observed effects另计observed-count或unknown(null)。相同首尾RNG状态不证明零消费。任一未知count使总observedCalls=null；globalConsumptionVerified始终false。S2的query267只在同地wrapper acted中出现，异地直writer不调用它。

## 5. 单事务原子性与重放

先验证整个输入域及每条候选观察schema，再在private deepcopy运行完整控制流，检查每个动态边界的精确binding及unused记录。只有全部成功才一次提交frame、revision+1和appliedCommands。晚期missing/stale/query错误不触碰调用者输入；policy reject退回完整before，不留下早期handler的mission、bit、dirty或列表写入。拒绝账本中的candidate before只是已丢弃计划，不能当已提交状态。

新API的幂等摘要包括command、observations和policy；同ID不同观察或政策是payload conflict，不能将两次不同callback规则当相同命令。重复同payload不会再次执行或递增revision。trace包含完整输入/输出、copied nodes、visits、stage snapshots、queries、effects和hash；`replay_mission_event_composition`重新执行全流程，改输出再重签也会被拒绝。

所有step/boundary/frame/stack快照独立deepcopy。模型没有共享alias使后面observer的改动倒写早期快照。

## 6. 验证与保留缺口

```sh
python scripts/check_mission_event_composition_source.py
python scripts/check_mission_event_composition_profile.py
npm run check
for f in scripts/check_*.py; do python "$f"; done
npm run demo
npm run demo:lifecycle
```

13项source检查通过；完整S1/S2 IDB指纹与独立stdlib raw-ID1读取425范围、29,809 selected range bytes已复核（S1 212/S2 213；208共同相同、4不同、1 S2专有）。38项模型测试通过，含768组独立evolving-frame/callStack/visit oracle与JSON重放。完整92命令回归零失败：TypeScript、85 Node、89 Python checker与2 demos。最终38项模型测试另行复跑通过；独立审阅通过：冻结13文件/index无漂移，13 source与完整双IDB 425范围/29,809bytes另行raw-ID1重核，关键wrapper/listener/return-zero/away setter/S2 hook再由raw/objdump核序；38 model/768 oracle与完整92命令独立重跑全过，额外42条分支/观察篡改测试通过，无待修阻断。发布前仅补本结论，合并后main仍须全测。source-profile S1/S2分别验证，均MOD关联；source byte相同不是clean stock认证。Vanilla明确仅可标compatibility-assumption，真实存档、完整global RNG和主机版均未证明。

下一主题：在新组合frame中加入完整return的list与稳定role原生阶段，处理旧/新legion与旧home调用，并由实际event递归回到此dispatcher。之后继续empty-legion/force灭亡、base销毁、其他event IDs、AI disposition及完整capture/scheduler。TODO的其余研究债不因本组合完成而关闭。
