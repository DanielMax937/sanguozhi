# P0-57 武将返回的home/location/rawlegion/bit9有界投影

更新：2026-10-04 UTC。基线main `1ff61538c16a1e95dddc15cd228f63d7e15cd356`（PR #14已合）。承接[P0-56](91-return-mission-lifecycle.md)。

- [结构化证据](../sources/officer-return-finalizer.json) · [双源字节及来源说明](../sources/officer-return-finalizer/README.md)
- [独立模型](../../scripts/officer_return_finalizer_profile.py)
- [模型测试](../../scripts/check_officer_return_finalizer_profile.py) · [字节检查](../../scripts/check_officer_return_source.py)

## 1. 已完成范围和版本边界

新API `project_officer_return(state, command, observations, policy)`单独投影一次`004BF6F0(person,target,showNotice,noticeVariant)`的已知标量和有序调用边界。它不是玩家命令、完整返回事务或整场capture；没有把新效果静默塞入旧取消/mission37 trace，也不修改TypeScript训练切片。

本组补齐home、actual location、raw legion以及`person+124` bit9的明确写入顺序，按源gate记录home/legion roster移除、加入和排序，记录旧/新军团及旧home角色协调顺序。原函数**不清任务、五参数、duration、acted、俘虏元数据或禁仕元数据**；它们的调用方写入不被搬进此API。

两个来源仍是MOD关联IDB。108范围直接重读并独立raw-ID1复核，54组双源比较全同；3744新增raw bytes及54个既有hash固定范围共9560 bytes。S1/S2分别记录fingerprint和逐范围字节；局部相同不能推导传递callback或stock相同。未执行EXE，不把IDB所记EXE hash当独立binary认证。PC-PK1.1采用`compatibility-reconstruction`；Vanilla单列`compatibility-assumption`。clean stock、Vanilla/主机版、真实存档与全局RNG均继续open。

## 2. 精确caller顺序

1. actor valid后才检查target valid；无效时无标量写入
2. 保存target ID、原status、原home对象和原legion对象。target governor getter/person解析结果未用于该函数的gate，仍是显式边界
3. showNotice非0时检查`0047A6D0`；通过且不是status5俘虏，才`004B93D0(messageId=175D,person,target,variant)`格式化消息（callee ret0x10），剩余预压栈参数交给`004F55E0(formattedText,target,1,-1)`显示
4. 保存old force。status0君主、person/target force ID相等、old force对象valid且其`+128==0`时，会先进入`004B40C0(target,personLegion,0)` ownership/capture
5. `004A31E0`：旧home roster移除 → 写home → 新home roster加入 → 排序。home相等时仍执行这些list调用
6. `004891C0`检查真实部队成员；false才`00486680(target)`规范化canonical base ID，并`004A0CB0`写actual location，随后`004B9480` UI回调
7. 重新读取person force，先numeric0..46，之后再次person/target force equality，才进入affiliation/role尾部。**没有force对象valid gate**
8. `004A32F0`：旧legion roster查找/有节点才删除 → 合法请求才写raw legion → 非负合法值才set bit9 → 新legion valid才加入/排序
9. 保存的oldStatus<=1且old legion valid、与new legion对象不同，先`004BE2A0(old,0)`；随后无条件调用`004BE2A0(new,0)`，callee可能自身no-op
10. 保存的oldHome对象仍valid时，重新比较其与target的legion ID；不等才`004BCA30(oldHome,0)`

新模型固定`callbackAssumption=noninterference-v1`：未执行的getter/notice/list/UI/role不能改变本次后续读取的投影字段及必要观察。因此重复读取在trace里保留调用位置，但返回值来自同一个稳定来源snapshot。这是工程前提，**不是原程序保证**。full role确实可能改变status/军团/force等，不能把局部after当作全机结果。

## 3. 数值、对象及字段域不能混同

### home与实际位置

`00490D00`对于numeric0..16383返回固定slot指针，跟allocated/valid无关。旧home building本身invalid仍可按kind找到valid子对象并尝试移出roster；不能加上“旧home必须valid”的虚构gate。只有source getter范围外才null，域内缺少slot观察报错，不能猜invalid。

kind0/ID0..41映射city，kind1/ID42..51映射gate，kind2/ID52..86映射port。home roster还要该subtype对象valid；generic或kind/ID不相符不动home roster。`00486680`只看kind/ID范围，不检查subtype valid：canonical target保持自己的base ID，非canonical返回-1。因此home可写16383而location写-1；port/gate不被替换成territorial city。

位置87..1086只说明可能是troop。`004891C0`还检查对应troop valid和actor是否确在主将/副将槽。模型在该范围要求source-bound `actualTroopMember`观察；范围外直接false。true保留actual location，但仍改home和有条件改raw legion。

### person force、target force和raw legion

双源vtable+44确认person getter直接读`+94` raw legion，跟status/bit9无关。person+40经raw legion getter、legion valid检查，再读legion+4 force ID；否则-1。legion valid是明确观察，并要求其force numeric0..46；不等于该force对象本身valid。

building+40具有generic设施/territorial特殊分支，不可一概从building legion反推force。本模型以`targetForceId`作为有provenance的必要观察：只在status0 ruler比较或person numeric-force gate到达时要求。此观察覆盖稳定callback前后的重复读取。旧force对象的valid/+128只有ruler且数值相等时才需要；普通返回允许force42..46，即使没有对应valid force对象。

building+44先规范kind/ID及valid subtype，再读city+38或gate/port+20原始signed dword；没有legion ID规范化。缺/invalid子对象得到-1。故`004A32F0`请求可能是-1、0..46或其他值。旧roster查找在请求范围检查**之前**，非法请求仍可能删旧roster：

- 请求-1或0..46：写`person+94`
- 请求0..46：额外把`person+124` bit9置1，保留其余31 bit
- 请求-1：不清bit9
- 其他signed值：不写raw legion/bit9，但之前roster调用仍保留
- new legion valid才加入/排序；即使new==old也不跳过

`flags124`是完整unsigned32字段；独立`acted`须与bit0一致，bit9操作不能改acted。任务、参数、duration及status保持输入，是此局部标量投影，不声明role回调实际不会改变它们。

## 4. 明确defer与record/reject

ruler ownership/capture路径整次返回`unsupported-ruler-ownership`，after=before且无候选写入。没有把`004B40C0`当展示回调省略后继续伪装完整返回；这条涉及ownership/force/capture的分支需另组组合实现。

其余未实现作用通过`unknownEffects`有序记录调用参数、`beforeStepIndex`和深拷贝阶段snapshot：

- target governor查询的未使用结果及传递效果
- 条件通知格式化/显示
- 旧home移除helper内部find/conditional erase；新home append/sort
- location/UI
- 旧legion find，观察到节点才erase；新legion append/sort
- old/new legion完整`004BE2A0`，以及旧home完整`004BCA30`

`oldLegionRosterContains`是到达有效旧legion后必需的观察；它不宣称链表已重建。home移除用完整helper边界表达，未臆测不存在的节点。无任何list/角色字段更新被伪造。

`unknownEffects=record-only`接受带假设的局部投影；`reject`保留诊断ledger但丢弃候选after/steps，不登记命令。rejected ledger的step索引属于丢弃的候选。所有完整性证据flag保持false，包括`fullReturnExecuted`、`callbacksExecuted`、`rostersExecuted`、`roleReconciliationExecuted`和`completeGameTransaction`。

## 5. 原子输入、防重和回放

`pointerDomain=array-slots-v1`明确只接受给定源数组slot ID，不模拟任意进程pointer。state、command、observations、policy shape严格；bool不作int，重复ID、跨source、缺域内slot、缺实际分支观察报错。`_plan`先解析全部必要依赖，再进入`_apply`；即使最后role所需slot缺失，也不会先写home或消耗命令。

全部状态在深拷贝上处理，调用者state和每个快照相互隔离。revision/command ID+完整payload hash做工程防重；相同ID/payload重提不再执行list/通知，改target/showNotice/variant/person/revision则冲突。新ID重新调用同地同军团仍执行源list顺序，不能误称源helper本身idempotent。

本地投影无RNG调用，trace记录输入/输出相同rngState、calls=[]、consumed=0以及`unexecutedCallbacksCovered=false`。未执行callback/role可能消费随机数，不声称原作全局流无变化。

`replay_officer_return`校验trace hash，再从完整before/command/observations/policy重算plan、steps、ledger、RNG和after；JSON roundtrip支持。重新签hash的伪造输出也被重放检查拒绝。hash不是外部观察的真实性认证。

## 6. 验证与下一主题

```sh
python scripts/check_officer_return_source.py
python scripts/check_officer_return_finalizer_profile.py
npm run check
for f in scripts/check_*.py; do python "$f"; done
npm run demo
npm run demo:lifecycle
```

新增27项模型测试含384组固定seed scalar oracle/replay，覆盖原始四字段、所有legion边界、bit9保留、same-home/same-legion list、真实troop观察、source范围、条件通知、ruler defer、角色调用顺序、原子preflight/reject、防重和篡改重放。18项source测试通过。84条全回归零失败：TypeScript、85 Node、81 Python checker、2 demos。独立审阅再次核108范围/9560 bytes、冻结14文件/index一致，并重跑27模型/18source、完整回归及另11边界case，无剩余阻断；notice formatter/display参数分属两个callee，ret0x10与caller清栈已复核。旧API/trace/训练代码未修改，staged/unstaged whitespace检查clean。合并后main仍须全测。

下一有界主题：`004BE2A0`的稳定非空军团角色协调。其capacity/office/derived leadership/ID排序、旧leader/status、各base governor和event顺序必须一起审计，不能只写leader ID就宣称完整reconcile。force灭亡、空军团合并/重分配、ruler capture、完整`004BCA30`、mission-event监听、base销毁以及更广capture/全scheduler组合继续open；clean stock/Vanilla证据不因本次caller恢复而关闭。
