# P0-67 武将迁移与固定参数移动准备

更新：2026-10-05 UTC。基线main `5215348ebd12cd4bc7b221008775052411fb92bb`（PR #24已合），tree `5abaed889e2d2329040c7f55f1a9b3cd90ef408d`与已审P0-66快照完全一致。本主题在此最新main上独立集成；旧API、frame和trace保持不变。

- [来源manifest](../sources/officer-relocation.json) · [来源域与验证方式](../sources/officer-relocation/README.md)
- [新事务API](../../scripts/officer_relocation_profile.py) · [原生primitive](../../scripts/officer_relocation_primitives.py) · [独立声明的signed table](../../scripts/officer_relocation_tables.py)
- [独立来源检查](../../scripts/check_officer_relocation_source.py)

## 1. 新版本与有界目标

`project_officer_relocation(state, command, observations, policy)`直接展开`004A8270`协调器、`004A57B0→005B9B40`取消分派，以及固定`004A7990(person,destination,-1,0)`。入口为：

- `relocate-officer`：`personId`、`targetBuildingId`；不对协调器EAX赋予语义，`nativeResult=null`
- `prepare-movement`：相同参数；只接受源码第三参数=-1、第四参数=0的子域，返回保存的原始origin（0..86），否则-1
- `cancel-mission`：`personId`；保留wrapper和handler的已恢复EAX结果
- 已有base ownership、event、return、role、sort、route、empty-legion入口继续在新planner内组合

`PROFILE_ID=source-idb-S1-S2-officer-relocation-v1`。沿用P0-66 frame形状，新增policy `relocationDomain=canonical-officer-relocation-v1`；没有新增任意troop.valid或隐含坐标默认值。所有primitive使用同一live frame、同一观察序列、一次revision提交。空军团merge原来的`004A8270`边界仅在新planner中展开；复制节点的index与保存destination home留在外层scope。

本主题不是整个据点陷落/俘虏/势力消亡图的闭合。观察只覆盖声明的canonical字段与opaque data，不是完整进程内存；hash不认证观察真实性、运行时可达性或外部结果。

## 2. 保存home、status2与governor嵌套门槛

先分别检查person与destination valid。保存第一次raw home和由它转换的old-home pointer；再次读取raw home，与destination canonical ID比较。若相等，跳过全部status/governor/legion/home修改，仍继续troop和mission路径。

若不相等，仅当live status=2且首次raw home仍不等于再次取得的destination ID，才执行`004A5AF0(person,3)`及后续旧太守清理。`82DB`、`82EA`均跳到`832D`，因此governor clear也在这个嵌套门槛内，不能无条件扩展至其他status。

`004A5AF0`检查allocated，而不是valid；底层`004898F0`只约束请求status。随后使用保存的old-home pointer，检查它现在的valid与governor；只有governor canonical ID等于该person，才调用`004B3A20(oldHome,null)`。这不是`004BCA30`全面刷新。该setter的event8先于live subtype governor写，可改变person/destination以及整个frame。

## 3. ruler/非ruler分支与重读

在上面的callback之后重新读取status。status=0的ruler分支读取person自身live virtual+44，转换为legion pointer，调用整个`004B40C0(savedDestination,savedPersonLegion,0)`。不能改成destination legion，不能额外过滤invalid/null requested legion，也不能以简单ownership setter替代。返回值在观察中保留为signed dword，协调器忽略它。

非ruler分支读取destination live virtual+44并调用`004A32F0`，沿用remove-first、raw-legion/bit9、append和原生sort。任一分支之后重新取得保存destination的canonical ID，再调用`004A31E0`；home写发生在legion/capture效果之后。

接着调用`004891C0`。true意味着实际有效部队的主将或两个副将之一，立即结束；raw location=87..1086本身不是成员证明。false后重新读actual location，将0..86以外归一为-1；再保存此刻home，作为away/same-home判断和后续same-home return的保存值。

## 4. away与same-home不可混用

### away：normalized location不等于保存home

重新检查person valid。通过时依次：

1. `004A57B0`真实取消分派
2. 原始`00489BD0`写mission37及五个零参数
3. 直接`00489B40(person,1)`，写bit0、manager dirty，再fresh观察者回调
4. `00482F80`fresh valid及live active membership检查后按需append

handler callback之后没有重新检查allocated/valid，故第2步仍会覆盖handler留下的mission字段。第3步观察者可改变valid、mission与active list，第4步读取变化后的状态。

无论入口的away valid gate是否通过，最后都调用`004A7990(person,savedDestination,-1,0)`。返回origin被忽略。协调器本身没有actual location直接写入；内部return或外部observer等组合效果仍可改变location。

### same-home：normalized location等于保存home

顺序是allocated-only mission reset `004A5780`、valid duration0 wrapper `004A5660`、valid acted1 wrapper `004A5600`。本分支不调用取消handler，也不产生旧任务退款。S2 acted wrapper保留query267 hook；away和movement的direct acted调用均绕过该hook。

随后fresh status=5时结束；否则以troop查询后保存的home调用`004BF6F0(person,savedHome,0,1)`。不能采用observer之后新home替换这个保存参数。原recursive return的未闭合边界继续保留。

## 5. 固定参数移动准备

`004A7990`再次独立检查person和destination valid。`004A6340`对valid person的raw location0..86直接返回，不检查对应building valid；其他location经`0047A950`取origin。

保存distance默认1。origin在0..16383时，以origin和saved destination调用`0049E4D0`：先求origin territory，再求destination territory，再查源专属有向city-distance byte table；无效territory产生-1，不应忽略。origin与distance跨acted callback保存。

第四参数=0跳过整个跨legion/ruler分支；完整函数未读取第三参数。然后：

1. 再次直接acted1，包括fresh observer callback。这是valid away路径的第二个direct acted
2. 原始`0048A8B0`写duration低byte，没有allocated/valid gate；distance=-1写255
3. fresh person virtual+40数值仅在0..46时进入governor刷新，不另查force对象valid
4. fresh location归一后的base valid且当前virtual+40等于保存person force时，调用`004BCA30(current,0)`并保存该pointer；否则保存null
5. 在上一步callback之后重新读person home；若对应base valid且pointer不同于保存current pointer，调用`004BCA30(home,0)`。home没有额外same-force gate

返回最初保存origin（0..86，否则-1）。该helper没有actual location直接store；组合的return/observer等效果仍可改变location，不保证整个事务location不变。

## 6. 取消注册表和返回值

`004A57B0`先检查allocated，然后只为live mission0..43进入dispatcher。`005B9B40`再次capture mission，跳过37，读取固定注册command，构造native三字event `{-1,0,0}`，调用virtual+0C。它不运行event8/9/10/14 predicate，也不伪造支持的event ID来复用event dispatcher。

- 未allocated：wrapper EAX=0
- 已allocated但mission在0..43外：EAX是刚读取的raw mission，不能统一写0
- mission37和`00441880` stub：0
- mission23/24：直接执行已有live handler/tail/return primitive，保留真实返回值
- 其他到达handler：全before/after frame、RNG、source、actor、captured mission、cancel words与完整stack绑定的effect-query，或原子reject；signed dword结果保留

旧独立`project_mission_cancellation*`事务不会被调用或拼接。嵌套event/actor/copy-list上下文仍由同一planner管理。

## 7. 坐标与table边界

`0047A950`将virtual+3C所指dword拆为signed16 x/y，分别检查0..199，然后读取map `06FB0E6C+20*(200*x+y)`，抽bits5..11。`00483B00(index,1)`读取独立的`0079C358..0079C558`共128个signed dword；非负值原样，负值做x86 NEG，最终只接受base0..86。这不是P0-64的unsigned-byte city table。

person vtable `0079C780+3C`指向`00489610`。它会按base/troop validity寻找位置，但troop提供坐标不要求该person真是部队成员。原生troop derived validity与完整位置对象未闭合，因此非base路径保留read-only coordinate query，绑定source、person、live raw location、stack与完整before frame，不可变更frame或消耗RNG。

fallback `06EE794C`是mutable storage；S1 recorded bytes=00000000、S2=ffffffff只描述IDB快照，绝不作为runtime默认坐标。新signed table分别声明S1/S2，字节相同也不认证运行时未修改。

## 8. 验证与继续open的范围

19项独立来源检查已通过；两个完整IDB指纹与new/inherited raw-ID1 bytes在本地复核通过。新92区间14,930 bytes、718 callsites；继承闭包17 manifests、622 physical artifacts、23 local Python modules、1,852 inherited range记录均被固定与独立解析。新production signed表另以AST literal对比全部256个源dword通过。最新main `5215348ebd12cd4bc7b221008775052411fb92bb` 上的完整104命令回归已通过：TypeScript、85 Node tests、101 Python checker命令、2 demos。32组独立oracle模型（含120 seeded场景）与19组来源检查通过；两份完整IDB指纹及new/inherited raw-ID1复核通过。三生产模块及模型测试与已独审隔离版本逐字节一致；集成仅调整真实基线、3项manifest metadata和索引，独立集成delta审阅无阻断。1182文件在全测前后冻结无漂移，104日志hash逐一核对。验证结果文字另行复核；未执行游戏EXE、未认证stock/Vanilla/全局RNG，也未将本地检查称为远端CI。

仍open：整个`004B40C0`、其他取消handler、真实troop成员/非base位置、既有S2 effect queries、observer/presentation、event9 troop reaction `004BA1D0`、force extinction `004B80A0`、recursive-return ruler-ownership，以及非canonical vtables、坏/循环链表、分配失败、缺失slots、修改lookup memory、原生递归终止、真实存档、全局RNG、stock/Vanilla/console认证。

mutable边界必须精确before/full-after/RNG或原子reject；readonly query也须严格绑定且明确未经真实性认证。缺失、unused、stale、wrong-source、wrong-stack及alias不一致均不是隐式成功。engine budget是工程保护，不是原作规则。
