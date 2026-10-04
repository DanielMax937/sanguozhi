# P0-60通知门、active-list与acted/零退款返回尾

更新：2026-10-04 UTC。基线main `4140af9c71fba30c1a883dcf142ab494025f6472`（PR #17已合）。承接[P0-59事件监听](94-mission-event-listeners.md)，不修改该版本API或旧trace。

- [结构化来源](../sources/mission-notification-tail.json) · [字节范围说明](../sources/mission-notification-tail/README.md)
- [独立模型](../../scripts/mission_notification_tail_profile.py)
- [模型检查](../../scripts/check_mission_notification_tail_profile.py) · [字节检查](../../scripts/check_mission_notification_tail_source.py)

## 1. 有界可运行范围

`project_mission_notification_tail(state,command,observations,policy)`接受六种独立命令：

- `notification-gate`：执行005B81D0的规范对象通知资格门
- `handler23`、`handler24`：从两个原生handler入口执行入口门、通知门、必要presentation观察及005B8400(actor,0)
- `return-zero`：从005B8400(actor,0)执行同地/异地返回尾
- `ensure-active`：00482F80，只在合法人物尚不在active-list时尾追加
- `set-acted`：004A5600(actor,1)，含S2独立query267及acted写后的observer

这里没有event predicate/dispatcher、004BBAA0后置observer或角色协调组合。handler命令不要求当前mission仍等于23/24，这是原handler没有的入口门；上层P0-59 dispatcher负责captured mission。此模块也不公开任意正退款005B8400调用，两个handler的native退款实参就是0。

已知写入直接实现；presentation、非空observer、完整004BF6F0和S2 patched query267仅接受明确可变全frame观察或整次拒绝。不将未知callback默认为非干预。完整return/role/event将在新版本中组合，旧模块保留原有边界。

## 2. 通知门与getter语义

005B81D0严格顺序：actor valid → actor virtual+40取得force → force valid → force virtual+48 → actor virtual+44取得legion → legion valid → 0047A6D0。

对已验证canonical vtable：

1. person virtual+44只读raw+94，无range规范；00490AD0才把不在0..46的值映射到无效sentinel
2. person virtual+40走0047B2B0：查raw legion并valid，成功读legion的force字段，否则返回-1；不是直接在person上保存一个force值
3. force virtual+48是00480FA0，读raw+60，值0..7即true
4. 0047A6D0先经legion virtual+48再次查询force valid/player，再经virtual+44解析同一固定数组legion，valid后要求其raw+8为1

模型保留这些调用阶段，没有从“玩家势力”推定军团序号1，也不靠status/home/mission猜通知资格。valid/allocated仍是不同来源阶段观察谓词，模型不认证其与全部未提供raw字段的一致性；已证约束valid person必allocated、valid legion必forceId0..46则显式校验；canonical vtable、无并发/纯getter是明确输入域，不能用于任意修改过vtable的pointer。

handler首先检查actor valid、实际location规范0..86并检查current building valid、live args[0]目标valid。mission23目标为0..41 CITY子对象；mission24目标为0..16383 building；两者不能互换。同ID CITY有效但building无效可存在。

handler随后保存force+44或-1、current pointer与target pointer。force+44在本审计命名`raw44`，没有证据把它命名为君主ID。成功通知的presentation范围是005B6DC4..005B6E35或005CFC28..005CFC99，实参/边界绑定保存的ID、raw44与messageId 0x15A6/0x15B6。观察可以改变live home/location/valid/RNG，随后005B8400按变化后的人物字段执行，不能沿用presentation前人物快照。

## 3. 零退款返回尾与细粒度顺序

005B8400没有额外actor-valid入口门。它先将live实际location规范到0..86或-1，保存raw home，然后比较。troop location且home=-1可进入同地分支；不添加人为canonical-home gate。

### 异地

1. 通过00490D00取得current/home pointer；此处没有building-valid门；range外getter请求映射为sentinel
2. 0049E4D0距离结果为source/stage/pointer绑定的-1..255整数观察，不猜测地理或混用S1/S2距离表
3. 004A73A0检查live actor valid；以cancelOld=0写mission37、五个0参数
4. 直接00489B40置flags124 bit0，保留其余31bit
5. 004A06A0→004829B0将global07201B24 managerDirty写1
6. 004B9480→004EC870；observer非空则virtual+1B4(0,0,0,0)，执行完整可变观察
7. 00482F80重新检查live actor valid；00482AF0查pointer；已有一个或多个相同pointer时不做任何去重，缺席才由0047C1B0尾追加
8. 004A5660再次检查live actor valid；期间写入保存distance的低byte

observer可令人物失效、改变mission、移除/增加列表节点或消费RNG。原流程仍使用保存的distance，按新valid状态决定追加与期间写；不会重新恢复mission37或用原列表覆盖观察效果。

### 同地

1. 004A5780使用allocated门，将mission=-1、五参数0；不删除active-list节点
2. 004A5660使用valid门写duration0
3. 004A5600使用valid门，再走source-specific acted路径
4. 正退款分支因实参0不进入
5. 00488C70读取最新status；等于5跳过完整返回，否则004BF6F0(actor,saved home building,0,1)

full-return观察绑定保存home，observer改变home不会改变这个native实参；但observer改变status会改变是否调用full-return。full-return尚未执行原生角色/空军团/灭亡/capture闭包，本模块绝不把旧非干预scalar投影冒充完整效果。

### S1/S2 acted区别

005B8400在两源字节相同；差异在004A5619：S1 call00489B40，S2 call0090CBA0。S2非零值先query267，true跳过writer，false直writer(1)。因此true还跳过dirty与observer。query返回后没有第二次valid门。

S2的004890F0入口本身被hook，transitive graph未闭合，故查询记录是`effect-query`：result、完整before/after、RNG消费观察一起绑定。它可改变状态；false时仍直writer，即使query令actor invalid。不默认纯查询或零RNG。异地004A73A0直接调用00489B40，完全不经过query267。

## 4. frame、缺失输入与替换规则

frame含固定canonical person/building/CITY/force/legion slots、ordered activePersonIds（重复保留）、executingPersonId、managerDirty、observerPresent、rngState及opaque data。每个人包含allocated/valid、status/home/location/rawLegion、mission/fiveArgs/duration和完整flags124。force含playerIndex、raw44；legion含forceId与number。

缺失的合法范围slot是观察不足，遇到时报错，不能猜无效。范围外getter返回sentinel。active/executing pointer必须有可读person slot。所有已命名object key及固定slot身份在before/after中必须保存；opaque list作为可变整体，调用方必须提供足够观察域。该frame不是完整机器内存的声称。非规范指针、并发、已损坏循环链、allocator失败与替换vtable在域外；`readable-acyclic-successful-append-v1`明确列出成功列表操作条件。

边界记录按顺序连续index，绑定kind、helper、完整args和精确before；source绑定顶层。pure distance query只有result（域-1..255，越域拒绝）；effect有after及RNG；S2 effect-query另外有result。missing/unused/misbound/stale观察均报错。没有隐式identity observation；需要无变化时也要明确给出同域after与消费证据。

观察可来自原机或标注synthetic的可替换规则，hash只验证绑定与重放，不认证真实性或after可达性。`unknownEffects=reject`到第一个未知效果整次拒绝，不提交早期写入；已知无未知效果路径可接受。reject账本中的边界before属于丢弃候选执行，不能当已提交副作用。

## 5. 原子性、RNG与验证

所有候选执行在private deepcopy中；晚期错误不写调用者输入。steps含独立完整stage frame，没有共享alias。命令ID/payload摘要与revision防重复或冲突。trace包含所有输入、步骤、查询、effects、前后状态与hash；replay重新执行全部流程，改输出再重签也不能通过。

已恢复纯门、标量和列表操作无local RNG；未闭合效果分别记录observed-count或unknown(null)。首尾rngState相等不能证明零消费。所有stock/Vanilla/fullEvent/fullReturn/completeGameTransaction证明flag仍false。

静态证据123范围、10,811 raw bytes：两源各61共同范围加1个S2专有hook；61共同对比中4处不同，含source-specific query/wrapper及距离表。完整IDB hash与独立raw-ID1重读已核，来源均MOD关联，未执行未知EXE；不能由此宣称clean stock。

```sh
python scripts/check_mission_notification_tail_source.py
python scripts/check_mission_notification_tail_profile.py
npm run check
for f in scripts/check_*.py; do python "$f"; done
npm run demo
npm run demo:lifecycle
```

33项模型测试通过，含512个seeded独立状态oracle/JSON replay、S2可变query、通知short-circuit、重复节点、observer改变valid/status/home/list、saved-pointer绑定、rawbit保存、期间低byte、原子拒绝/输入错误、重签篡改与alias。完整回归90条命令零失败：TypeScript、85 Node、87 Python checker与2 demos。独立审阅通过：14文件freeze/hash一致，双IDB完整指纹与123范围/10,811bytes另行stdlib mmap raw-ID1重核；33模型/18source及完整90回归独立重跑全过，额外32组query→observer→live status/saved-home链式反例与5组presentation错绑原子拒绝通过，无待修阻断。发布前仅补本结论；合并后main仍须全测。

下一主题：用版本化API组合return/稳定角色/event监听与本tail模型，补004BBAA0后置observer调用。之后继续empty-legion/force灭亡、base销毁、AI disposition与完整capture/scheduler。clean stock、Vanilla、真实存档和全局RNG证据债保持开放。
