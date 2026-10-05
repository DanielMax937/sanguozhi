# 三国志11规则研究与训练内核

主目标逐步复现PC-PK1.1，再单独恢复Vanilla；已证实规则、实测、工程替代和原作证据债分开记录。

当前可运行的是**虚构训练沙盒**：Train、限定EndTurn、训练资格、累计武力经验成长、状态检查、JSON存档与确定性重放。能连续推进时间，但没有AI、经济、战争、历史剧本或完整调度系统。Vanilla明确不支持。

## 运行

需要Node.js24.x与npm：

```sh
npm ci --ignore-scripts
npm run check
npm run demo
npm run demo:lifecycle
npm run play
npm run play -- --growth-fixture
```

`demo`完成气力40→100；`demo:lifecycle`从经验98推进十年（360旬）并验证完整存档重放；`--growth-fixture`在交互沙盒演示能力成长。满气力后训练仍拒绝，时间可以继续推进；没有额外添加刷经验规则。

累计XP每100贡献+1，最多3000，普通武力封顶100。默认source-profile算术可替换且带证据，尚未认证clean stock PK等价。保存默认`training-save.json`，不覆盖同名文件；v1需显式状态快照迁移，不静默改写旧trace。

- [训练切片入口](docs/engine/pk-training-slice.md)
- [生命周期、配置、证据与迁移](docs/engine/pk-training-lifecycle.md)
- [event9 saved-troop原生raw44 reset](docs/rules/111-native-event9-troop-reset.md)：004BA442..44C单次live troop validity及raw44=-1 direct store；早期saved EBX force身份不重算，24继承入口加1新direct，后续home/reaction44C..46C仍完整观察；最新main全新122/122命令通过；双IDB/1327 raw、6 probes及集成delta独审通过
- [event9 saved-force原生reset](docs/rules/110-native-event9-force-reset.md)：004BA432..442固定saved force身份、单次live validity及有序raw94/raw98写入；23继承入口加1新direct，442..46C reaction仍完整观察；最新main全新120/120命令通过；双IDB/1323 raw、10 probes及集成delta独审通过
- [event9原生展示决策](docs/rules/109-native-event9-presentation.md)：saved-force身份与live troop/force virtual48决策，22继承入口加1新direct；immutable-event支持域明确，展示与reaction仍分别观察；最新main 118命令集合经环境定点恢复通过（首轮117/118，原npm同配置重试仍SIGKILL，追加semi16后85/85）；双IDB/1317 raw区间、17 probes及集成独审通过
- [event9原生live部队选择](docs/rules/108-native-event9-selection.md)：saved-next heap-node遍历、live raw44/order/target与精确可变virtual查询；21继承入口加1新direct，presentation/reaction仍显式边界；最新main全新116/116命令、双IDB/1297 raw区间、18独审probe及集成delta独审通过
- [原生live位置与可变fallback](docs/rules/107-native-live-position.md)：base/troop/fallback pointer身份、后置DWORD读取及signed16坐标；新version/frame且无fallback默认值，旧API及其余缺口保留；114命令集合经定点恢复通过（首轮112/114），集成delta独审通过
- [原生部队成员判断](docs/rules/106-native-troop-membership.md)：live location、raw leader validity与两deputy成员；18入口、新troop frame、旧API及其余缺口保留；最新main112命令复验及集成delta独审通过
- [原生零退款tail距离](docs/rules/105-native-tail-distance.md)：同frame领土/源分离距离表、parent saved distance与live低byte写回；旧API及其余缺口保留；最新main110命令复验及集成delta独审通过
- [generic设施入口与早返](docs/rules/104-generic-facility.md)：004B40C0入口、87..16383原生共享frame归属与0/1返回；canonical续段及其余缺口保留；最新main108命令集合重试后通过（首轮107/108），集成delta独审通过
- [live零退款取消9/10/12/22](docs/rules/103-live-zero-refund.md)：同frame原生gate/control与live return；presentation和其余缺口保留；最新main106命令复验及集成delta独审通过
- [武将迁移与固定移动准备](docs/rules/102-officer-relocation.md)：同一frame内的迁移/cancel分派/保存值与live回读；ruler与troop/位置等边界明确；104命令复验及集成独审通过
- [据点归属、耐久与event9/10](docs/rules/101-base-ownership-events.md)：原生归属/耐久/flags与复制列表事件predicate；深层取消/部队反应显式观察；专项、102命令回归与独审通过
- [空军团分派、合并与raw reset](docs/rules/100-empty-legion-redistribution.md)：两方向merge、copied/live状态、精确写宽及S2额外熵；深层base/迁移保持显式边界
- [原生任务route与目标势力](docs/rules/99-return-route-target-force.md)：live任务参数/君主home、设施与领土/canonical势力链；source地图分开与旧API不变
- [原生roster/role排序与capacity](docs/rules/98-native-roster-sort.md)：真实比较调用序、重复节点/两轮过滤及S2可变hook；旧API不变
- [原生return/list/role与event8/14递归组合](docs/rules/97-recursive-officer-return.md)：独立上下文栈、live重读和单次原子提交；多节点sort/force/空军团仍有明确边界
- [共享frame的event8/14与handler/tail事务](docs/rules/96-mission-event-composition.md)：真实调用序、native saved locals、原子可变边界与后置observer；完整return/roles仍open
- [通知门与active-list/acted/零退款return尾审计](docs/rules/95-mission-notification-tail.md)：精确写序、可变observer与S2 query267；完整return/role/event组合仍open
- [event8/14任务监听审计](docs/rules/94-mission-event-listeners.md)：live任务/列表顺序、原生predicate/gate与可变tail观察；完整return/事件组合仍open
- [稳定军团/太守角色协调审计](docs/rules/93-legion-role-reconciliation.md)：不同排名、live身份写入与event8/14顺序；灭亡/空军团/完整监听仍open
- [武将返回字段/列表顺序审计](docs/rules/92-officer-return-finalizer.md)：home/location/rawlegion/bit9、真实troop gate与ruler defer；完整role/callback仍open
- [mission37完成/一步移动/延迟退款审计](docs/rules/91-return-mission-lifecycle.md)：active资格、源分离六邻城、先退款再清任务和到达direct acted0；完整return/scheduler仍open
- [能力培养任务取消审计](docs/rules/90-special-mission-cancellation.md)：41..43有序gate、98记录域、home通知与无所在地valid gate；完整回调仍open
- [设施任务取消/销毁字段/宝物42审计](docs/rules/89-facility-mission-cancellation.md)：0/38、raw写宽、城市byte/S2差异与home引用；完整销毁回调仍open
- [组任务取消/城市计数/研究字段审计](docs/rules/88-group-mission-cancellation.md)：2/5组ID序前三人、先字段后返回与S2研究扩展；完整回调仍open
- [六个零退款cancel handler来源审计](docs/rules/87-mission-cancellation-zero-refund.md)：精确gate、设施/城市子对象分离、字段顺序与独立v2重放；完整return/callback仍open
- [人员游离/末城逃逸/任务取消来源审计](docs/rules/86-personnel-detachment-source-profile.md)：在野目的地、人员/职务/事件顺序与来源隔离退款；完整force消亡/回调仍open
- [capture旧俘虏释放/迁移/排序来源审计](docs/rules/85-capture-relocation-source-profile.md)：P0-50 v1有界前置释放与非瞬移投影；后续在野/取消部分投影见P0-51
- [capture城兵容量/人员分组/处分来源审计](docs/rules/84-capture-personnel-source-profile.md)：独立有界人员投影，未覆盖完整迁移与AI处分
- [capture caller/完整候选/有界事务来源审计](docs/rules/83-capture-transaction-source-profile.md)：独立Python参考模型与重放，未接入沙盒战斗
- [训练gate/reset/累计经验来源审计](docs/rules/82-training-lifecycle-source-profile.md)
- [规则总索引](docs/rules/README.md) · [当前研究状态](docs/rules/STATUS.md) · [待办与证据债](TODO.md)

每个接受命令保留完整前后状态、算术、实际奖励/裁剪和来源证据。原发言武将随机选择仍被省略，核心零随机调用不等于原游戏全局随机流一致。
