# P0-59 event8/14任务监听与有界效果观察

更新：2026-10-04 UTC。基线main `de7f0218eefe528687b82c9659feeee1de77b8a3`（PR #16已合）。承接[P0-58稳定军团/太守](93-legion-role-reconciliation.md)。

- [结构化证据](../sources/mission-event-listeners.json) · [来源与字节域](../sources/mission-event-listeners/README.md)
- [独立监听模型](../../scripts/mission_event_listener_profile.py)
- [模型检查](../../scripts/check_mission_event_listener_profile.py) · [字节检查](../../scripts/check_mission_event_listener_source.py)

## 1. 结论与范围

`project_mission_event(state, command, observations, policy)`只投影一次`004A8110(event8/14)`。它恢复有序active-list复制、live executing/mission筛选、44注册slot、`005B9D30`、两个有效predicate和handler入口gate。

- event8只有mission23可触发：有效subject person ID等于listener的live args[1]
- event14只有mission24可触发：有效subject building的raw kind为1/2，且ID等于listener的live args[0]
- 其余任务的相应predicate都false；mission37先被dispatcher排除
- 真predicate之后handler还可能因独立gate失败而return0；dispatcher仍return1

因此`004BA1D0`对8/14无操作不能推广为整个事件无效果。mission23/24成功tail包含返回/清任务，可能影响随后listener、太守写入前状态及全局随机消费。此版本不将旧取消模块的非干预投影硬接成完整handler。

已知dispatcher/predicate/gate直接执行语义模型；成功tail必须提供完整观察域的before/after替换，或整次拒绝。无隐式“只记录然后当作零效果”。旧P0-58角色API、P0-57返回API和其他旧trace保持原语义。本API尚未接入角色协调或训练沙盒，也没有自动执行整场capture。

## 2. 事件调用序与复制列表

`004BBAA0`在栈上构造`{eventID,subject,argument}`，顺序调用：

1. `004A8110`任务监听
2. `004BA1D0`其他事件子系统；本次event8/14直接走epilogue
3. `004EC870`以及非空结果的virtual+1B4(0,0,0,0)

此API在第1步返回，未执行第3步；不可用输出替代完整`004BBAA0`。前组event8在governor字段写之前，event14在清空之后；完整新版本组合仍必须插入正确阶段及后置observer。

`004A8110`先复制global active list07201ADC，复制的是人物pointer而非人物/任务快照。保留原节点序与重复项，无排序、去重或提前筛选。每次访问：

- 先比较当前live执行人物09771594，相等就skip；函数不会自行设置该指针
- 之后读取live mission+13C，范围0..43才进dispatcher
- 外层没有allocated/valid/status/force/home门

handler改变global active list不会改变此轮已复制序列；已移出的节点仍访问，新加入的节点不加入此轮。较早handler改变后续人物mission或executing指针会立即影响后续访问。递归事件被包括在对应whole-tail观察中，其内部逐条轨迹没有假造。

## 3. 注册与predicate

`005BA8E0`清44个slot，赋值43个对象；slot37空。`005B9D30`入口只捕获一次mission，排除37/空slot；event0/1的self shortcut不适用于8/14。predicate virtual+8与handler virtual+C使用同一captured mission的registry slot，参数都为live person与event pointer。handler返回值不影响dispatcher最终return1。

本域要求初始化且未替换的原注册表。43组predicate/handler配对、对象偏移、constructor调用与vtable immediate由checker从源码字节独立恢复；不依赖只手写一张映射表。

### mission23 / event8 / 005B7560

先验证listener，再读args[0]和args[1]。非null subject通过virtual+2C(10)类型查询，成功保留原pointer；验证subject，再用00491310取人物ID，与args[1]比较。args[0]虽然读到，但不影响该predicate。没有same-force/home/legion、governor status、subject==listener或targetcity有效性要求。

### mission24 / event14 / 005D00A0

先验证listener，再读args[0]。subject经virtual+2C(5)确认为building并有效后，rawkind必须1或2，之后00491770取building ID并与args[0]比较。没有额外canonical gate/port subtype ID门；本模型保留“ID0且rawkind2”等原有字段组合，不默默规范化。

null subject直接跳过类型虚调用；wrong type或invalid subject返回false。人物、building、CITY子对象的valid不可互换。getter00491310/00491770在canonical fixed-array slot域返回其ID，不看rawkind。004195D0两次返回常量-1，不是thread identity检查。

其余pair虽然false，也可能执行纯getter/context前序：15..21先构造temporary context，21还调context valid门；本模型省略这些无写入、无本地随机的中间调用。`steps`是有界语义轨迹，不声称逐条native指令/全部callee次数相同。

## 4. handler独立gate与开放tail

两个handler都重新读取live人物，按序：

1. listener valid
2. 实际location规范为0..86，否则-1；00490D00取current building并要求valid
3. 读取live args[0]
4. mission23将其规范为0..41，否则-1；00490A10取CITY子对象并要求valid
5. mission24直接00490D00，允许0..16383 target building并要求valid

无live mission==23/24复核。gate失败的handler return0，但`005B9D30`return1，不能误记为predicate false。mission23可以target CITY有效而同ID building无效；current building是独立条件。

成功tail边界分别005B6D87与005CFBEB。此时current building和target pointer已经保存。后续force/presentation/UI使用这些saved pointer，最终`005B8400(actor,0)`读取live人物状态。已恢复的下游字节显示：异地可改mission37、args0退款0、acted/list/duration；同地可清mission、duration/acted，再进入004BF6F0。完整presentation/return/事件递归尚未闭合，故本组不凭这些局部字节推测完整after。

## 5. 观察域与可替换fallback

state包含source、revision、appliedCommands和frame。frame显式包含：

- 固定person slots：ID、valid、missionId、五参数、raw location以及data
- 固定building slots：ID、valid、rawkind以及data
- 固定CITY slots：ID、valid以及data
- 有序activePersonIds（允许重复）、executingPersonId、rngState、其余data

`typed-fixed-observation-slots-v1`定义同一次执行内slot身份不变；缺席非active对象明确代表此观察域中的invalid对象，不代表尚未调查。active/executing pointer必须有可读人物slot。valid是source/stage事实输入，不按mission/status猜测；opaque data可承载角色/资源/任务期间等所需字段，完全保存但不由此模型解释。before/after维持全部slot与list外嵌套object-key观察域，不允许删掉命名字段来伪装一致；list整体作为可变值（含其内部对象）替换，调用者须选择足够的观察域。任意pointer、内存异常、被替换class/vtable、注册表改写、并发或allocator failure不在域内。successful-copy-and-traversal是明确工程条件，不宣称恢复了native分配器。

handlerFrames逐次绑定source（顶层）、event全部三字段、copied visitIndex、personId、captured mission、handler/tail地址、saved current/target ID及完整before。before必须与此前所有操作后的live frame逐JSON值相同，bool/整数不能混等；after是完整同域替换，可改变任何提供的任务、valid、active/executing、data或RNG状态。反复出现同一listener必须有独立阶段frame。缺少、错stage/参数或多余frame均报错，不能跳过未观察调用。

- `handlerTails=observed-frame`：只在已知gate通过时应用明确观察，记录完整边界before/after与provenance
- `handlerTails=reject`：到第一个开放tail整次拒绝，after等于before，不登记命令；已知全no-op/失败gate仍可成功；拒绝账本中的beforeStepIndex仅指已丢弃的候选轨迹

观察可能来自真实捕获或明确的synthetic替代规则。模型只验证绑定与内部一致性，不认证观察真实性、完整机器状态覆盖或任意after在原机上可达。相同before/after必须由调用者明确给出，不能默认callback非干预。新后续实现可替换whole-tail观察，而不静默修改此版本trace。

## 6. 原子性、随机与重放

所有操作在private deepcopy计划上执行，晚期缺frame或验证失败不会写调用者输入或半提交命令。步骤及边界snapshot相互不alias。revision/command ID完整payload hash防重复应用tail；同ID异payload冲突；新ID可再次发事件。

trace含完整before、command、observations、policy、copied sequence、visit结果、步骤、observedEffects、after与hash。`replay_mission_event`重算全部流程；仅改输出后重签hash仍失败。改全部输入得到的是另一场模拟，hash不等于source签名。

已恢复dispatcher/predicate/gate无local随机调用。rngState是调用者定义的32位投影状态，并非已证明的native完整RNG布局；tail另提供observed-count或unknown，unknown的调用数为null。首末state相同不能证明未消费随机。`globalConsumptionVerified=false`，所有stock/Vanilla/fullEvent/fullReturn/completeGameTransaction证明flag仍false。

## 7. 验证与下一步

两源各169范围（105code/64data），合计22,202 raw bytes；双IDB完整SHA256与每段独立raw-ID1重读一致，169组本地范围全同。两份来源都关联MOD；recorded EXE hash仅IDB metadata。未执行未知EXE，clean stock PK、Vanilla、主机、真实存档与全局RNG仍open。

```sh
python scripts/check_mission_event_listener_source.py
python scripts/check_mission_event_listener_profile.py
npm run check
for f in scripts/check_*.py; do python "$f"; done
npm run demo
npm run demo:lifecycle
```

14项source与34项model检查通过，含768组独立oracle/JSON重放，以及重复节点、列表突变、live mission/executing、city/building隔离、kind/ID不一致、short-circuit、snapshot绑定/alias、未知RNG与原子拒绝。完整回归88条命令零失败：TypeScript、85 Node、85 Python checker与2 demos；独立审阅通过：14文件/index一致，338范围/22,202bytes另行stdlib raw-ID1核对；全部回归重跑及512 evolving-frame/1,241可变tail、512 JSON replay、1,536证据/RNG重签篡改拒绝与10边界preflight测试通过，无待修阻断。发布前仅补充本审阅结论；合并后main仍须全测。

下一有界主题：恢复005B81D0 presentation门及005B8400周边active-list/acted/return边界，再用独立新版本组合return/roles/event。后置004EC870 observer、force灭亡/空军团、base销毁、AI处分、完整capture/scheduler和clean stock/跨版本不因本监听模型完成而关闭。
