# P0-58 稳定非空军团与太守角色协调

更新：2026-10-04 UTC。基线main `6d62e86caddd50887b4d4792cb1918526e980722`（PR #15已合）。承接[P0-57返回字段/调用序](92-officer-return-finalizer.md)。

- [结构化来源证据](../sources/legion-role-reconciliation.json) · [双源字节与来源说明](../sources/legion-role-reconciliation/README.md)
- [独立有界模型](../../scripts/legion_role_reconciliation_profile.py)
- [模型测试](../../scripts/check_legion_role_reconciliation_profile.py) · [字节检查](../../scripts/check_legion_role_source.py)

## 1. 新增范围不是完整返回事务

`project_legion_roles(state, command, observations, policy)`提供两个独立入口：

- `entry=legion`：一次`004BE2A0`的稳定非空军团分支，包含force/corps存在谓词、完整1100人物域候选、军团长排序/身份变化、相关home太守变化、leader字段和0..86据点顺序协调
- `entry=governor`：单次`004BCA30(building, refreshFlag=0)`，包含现有home roster筛选、太守选择、旧/新身份和太守字段写入

这是source-local标量执行与未执行回调账本。前组`project_officer_return`和所有旧取消/mission37 API及trace不改义；本组尚未把它们组合成完整返回或capture事务。军团灭亡、空军团合并/重分配，以及太守refresh!=0另路径整次原子defer。完成本主题不清除这些open，也不宣称完整军团角色系统已闭合。

S1/S2仍是分别指纹固定的MOD关联IDB，字节相同只证明选定本地范围。记录的EXE hash不是独立binary认证；未运行未知EXE。199个选定范围共21881 raw bytes（新增88范围/12927 bytes、引用111范围），两份IDB指纹及全部raw-ID1独立重读一致；98组共同范围94同4异，另列3个S2容量hook范围。PC-PK1.1采用`compatibility-reconstruction`，Vanilla单独`compatibility-assumption`；clean stock、Vanilla/主机版、全局RNG和真实存档仍open。

## 2. 稳定分支的输入门与顺序

1. `0047A630(legion)`无效则no-op；raw force numeric不是0..41则no-op。valid legion自身只要求force ID0..46，因此42..46不能错误进入普通势力协调
2. `004BBDB0`先要求valid force；`004CF480(force,15)`在1100人物ID序扫描**allocated**人物，要求当前force相等与status0..3。然后要求42城中至少一个valid city的force相等。失败进入`004B80A0`势力灭亡，模型整次`unsupported-force-extinction`
3. `004B9550`要求至少一个valid city的raw legion等于目标，之后至少一个**valid**人物的raw legion相等。不能用“有兵/港口/太守”替代；失败走`unsupported-empty-legion-redistribution`
4. 重新扫描全部1100人物，收集valid、同raw legion的候选。**这里没有status mask**；valid status4/5/7等也可能被选中
5. `004CEF90`排序取首项；随后处理旧leader，再处理新leader/home，再`004A0940`写leader字段
6. 最后ID0..86递增检查canonical base及其legion，逐个调用`004BCA30(base,0)`。外层canonical检查不等于building-valid；后者在callee入口检查

city对象与building对象有效性必须区分：city循环使用city subtype-valid，即使同ID building无效也可满足存在谓词；最终太守callee仍可no-op。city/person force均经raw legion→valid legion→raw legion.force，不追加force对象valid门到每个getter。

### 军团长与太守比较器不同

军团长`004CEF90`：

1. ruler status0优先
2. `uint16(0048A4F0)`最大带兵量降序
3. raw office有符号dword升序
4. derived leadership byte降序
5. person-array pointer升序；本输入域等价ID升序

太守`004B2090→004CF160`在没有status<=1 shortcut时：capacity16降序→derived leadership byte降序→derived strength byte降序→raw `+AE` unsigned word降序→ID升序。**没有office tie-break，也不能把军团长排序叫功绩排序**。本组按原始字段称呼`rawWordAE`，不依赖未经证实的字段俗名。

`004AA200`的flag1/0选择quicksort/mergesort，不反转比较方向。模型复现最终语义排序，不声称复现原排序器调用次数、临时链表分配或逐次比较顺序。

### 旧leader与新leader可能相同

旧leader valid且status1时：

- old.home != selected.home，且`00489730(old)`通过、old home valid并且该home太守正是old：降为status2，保留太守
- 否则，old home valid且其太守是old时先`004B3A20(home,null)`；之后status3

源代码没有old!=new门。相同status1军团长可发生：event8→清太守→status3→status1→恢复太守→写相同leader ID。不得以“状态最后不变”为由删去中间事件。

新leader不是ruler时先status1；`00489730`通过且home valid时，该home现太守valid/status2且不是新leader则status3，随后设新leader为home太守。ruler跳过这段新leader身份/home赋值。`004A0940→0047E110`只写legion+0C，不自行调军师helper或事件。

## 3. refresh=0太守协调与事件顺序

`004CF360`以**已有home-roster节点顺序**收集allocated、status0..3的人物，随后`004BC870→004B95E0`保留raw legion等于building legion且`00489730`通过者。它不重新全人物扫描、不额外检查candidate.home==本据点、不按人物ID重排、不额外比较force。

`00489730`先`004896C0`：actual location必须等于规范home（0..86保持自身，其余为-1），且`005BA320`观察返回false；再要求实际home building valid、home legion==person raw legion。因原roster可能不一致，同军团另一home的人物仍可能成为候选，本模型保留这个行为；重复roster节点也不偷偷去重。

候选存在status<=1人物时，遍历到底，取**最后一个**。没有此类人物才调用`004B2090`；单项无需capacity，多个valid候选按上述太守比较器排序。多个含invalid候选时源比较器会混合pointer排序与字段排序，不能保证一般全序；本有界模型整次`unsupported-invalid-ranking-candidate`，不伪称Python排序等于原native排序。一项invalid仍按源valid gate走无太守尾部。

选择之后，旧太守valid/status2时：

- old.home==当前base：status3，即使稍后重新选回同一人
- old.home不同：只有其home valid且那个home太守不是old才status3；不同home无效则保留status2

新选择valid时，身份既非0也非1才设2，再调用`004B3A20`。无valid选择时先`004B3A20(base,null)`，之后event14(base,0)。

`004B3A20`：building valid且新person valid或null才进入；旧太守valid、与新pointer不同才event8(oldPerson,0)，**事件在governor字段写入之前**。随后根据canonical city/gate/port的subtype-valid写太守ID；generic/invalid subtype写入no-op。相同pointer不发event8，但仍执行setter。

事件`004BBAA0`先`004A8110`任务监听，再`004BA1D0`，最后可选UI virtual+1B4。本组记录这一顺序及完整阶段快照，**不执行监听器**。event8可取消任务并写更多字段，所以不能把“太守最后正确”当全机状态等价。军师字段本入口没有直接写入，完整listener/force军师协调继续open。

## 4. 来源观察、域与可替换假设

所有state、command、observations、policy严格shape；bool不是int、重复ID/观察拒绝。`pointerDomain=complete-sparse-canonical-arrays-v1`是显式工程输入契约：

- 完整person0..1099、building0..16383、legion/force0..46数组的稀疏表达；省略slot明确表示无allocated/valid对象，不表示“尚未观察”
- building0..86的kind与ID必须采用规范city0..41/gate42..51/port52..86映射。此版本不接收kind/ID错配；generic87..16383无canonical subtype
- building.valid与subtypeValid分开。subtype raw legion/governor和原homeRoster按输入保留；不强制roster与home一致，也不修复重复节点
- 人物保留status/home/location/rawlegion/office/derived bytes/raw word/flags/任务五参数及duration等全部输入字段；只改实际命中的status字段。forces含advisorId但不改它

`0048A4F0`的完整容量计算不是匿名常量：S1/S2的base calculator、force query及S2 detour确有差异。观察以source+provenance和stage绑定：`leader`或`governor:<baseId>`，signed dword保留bit pattern，比较时显式低16位。同一人物在状态变化后可能需不同stage值，不能用一次entry观测覆盖所有后续比较。

`routedMissions`记录每人实际`005BA320`返回值，不以mission37等枚举猜测。location与规范home相等时才需要该观察；同一标量协调中不写mission，故在显式callback非干预下可稳定复用。容量rank只在n>1时要求该stage所有参与人的观察。这是模型对完整排名输入的契约，非原比较器实际访问集合/次数。

`callbackAssumption=noninterference-v1`要求未执行capacity/query/mission getter及event/UI不能改变后续投影字段、roster或观察。`listAssumption=successful-temporary-lists-v1`假设暂存列表分配成功并遵守已恢复遍历/排序语义；不执行native分配/释放/锁。观察helper与事件都进入带完整snapshot的`unknownEffects`，不冒充实际函数执行。

`unknownEffects=record-only`接受上述有界投影；`reject`保留候选账本，但丢弃after与steps、不登记命令。账本中的索引属于丢弃候选。灭亡/空军团/refresh/非安全排序域则整次defer，连局部候选字段也不提交。

## 5. 原子性与重放

`_plan`在私有state副本上完成所有动态gate、依赖、排序与后续据点的观察preflight，然后`_apply`只执行预先确定的操作序列。即使最后据点缺capacity/route观察，也不会先提交leader或status，更不会消耗command ID。调用者输入、before/after与每个边界snapshot均无alias。

revision与command ID/完整payload hash提供工程防重；重提相同命令返回replay，payload不同冲突。新command ID可再次执行源same-leader的中间事件。该保证不等于原helper本身幂等。

trace保留完整before/command/observations/policy、plan、步骤、事件/观察账本、after与hash。`replay_legion_roles`从输入完整重算；重签hash的伪造输出也会失败。hash不是外部观察真实性证明。

局部零RNG调用记录initial/final state与空calls；capacity/query/mission/event都未执行，`unexecutedCallbacksCovered=false`，不推导原全局RNG不变。所有stock/fullReturn/callback/completeGameTransaction等证明flag保持false。

## 6. 验证与后续

```sh
python scripts/check_legion_role_source.py
python scripts/check_legion_role_reconciliation_profile.py
npm run check
for f in scripts/check_*.py; do python "$f"; done
npm run demo
npm run demo:lifecycle
```

17项source与47项模型测试通过；模型包括512组独立全状态/事件快照oracle及逐例JSON重放。完整回归86条命令零失败：TypeScript、85 Node、83 Python checker和2 demos；模型最后追加4项后另行复跑47项全过。独立审阅已通过：冻结14文件与index逐字节一致；审阅者独立raw-ID1重读199范围/21881bytes、完整双IDB指纹匹配，47模型/17source/512 oracle与全部86回归再次通过，无剩余阻断。旧TypeScript训练切片和全部旧API/trace保持不变，staged/unstaged whitespace clean；合并后main仍须全测。

下一建议有界主题：`004A8110→005B9D30`的event8/14任务监听及其与角色字段的先后作用，随后用新版本组合返回/角色/任务投影；或分别恢复force灭亡/空军团分配，不能把它们混入本稳定分支后悄悄清掉open。base销毁、AI处分、全capture/scheduler与clean stock/跨版本证据仍按TODO继续推进。
