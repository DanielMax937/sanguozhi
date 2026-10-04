# P0-54 设施任务取消、销毁字段与宝物42

后续：P0-55在[独立能力培养取消模型](90-special-mission-cancellation.md)投影41..43；本页保留历史API与证据边界，完整return/回调仍open。

更新：2026-10-04 UTC。基线main `3a93431f3ef8a4e15e920ebb9475939a6aab1e21`（PR #11已合）。承接[P0-53](88-group-mission-cancellation.md)。

- [结构化证据](../sources/facility-mission-cancellation.json)
- [独立有界模型](../../scripts/facility_mission_cancellation_profile.py)
- [模型验证](../../scripts/check_facility_mission_cancellation_profile.py) · [字节验证](../../scripts/check_facility_mission_cancellation_evidence.py)

## 1. 范围与版本

mission0 `005BBE30`和mission38 `005D69D0`的gate、零退款返回、宝物42尾部以及`004B09B0`的部分设施销毁现在有独立投影。完整`0x38`建筑raw保留未写byte；城市计数和人物home引用可实际更新。旧v1/v2/group模块和旧trace没有改义，也没有把这些模块自动拼成整场capture或训练沙盒战斗。

**两份来源均MOD关联。** 字节exact只属于各自IDB指纹；其记录的EXE哈希未独立认证，未执行未知EXE。PC-PK1.1复用标为`compatibility-reconstruction`，Vanilla独立为`compatibility-assumption`，主机版继续open。相同handler正文不能掩盖被调用代码或数据表差异。

有界销毁只写type3..63具体建筑对象。源码会接受type0..2目标，但城市/港关的完整销毁未闭合，因此`baseTargets=defer`只投影前面的人员返回并记录整段销毁未执行；`baseTargets=reject`整笔拒绝。它不是原机的type额外gate，不把defer称作“城市已拆除”。

## 2. gate与成功返回不等于状态变化

两handler共同要求：actor有效；actor实际location先规范成0..86或-1；该建筑有效；当前建筑type必须0。不能把home代替实际所在，也不能因为目标是设施就省去当前位置type0限制。

随后：

1. mission0先`005B8250(0,args[1],capacity3)`，在完整稀疏person ID0..1099域内按ID序取前三个valid、mission0、同args[1]者。不按势力/target/home过滤，不保证actor入组。mission38仅处理actor
2. `args[0]`经`00490D00`解析目标，建筑ID域0..16383，并检查valid
3. **无效目标直接返回1，不返回人员、不reset、不销毁**；mission0的组收集已经发生，但不要求未走返回分支的距离/query267观察
4. 有效目标才进入条件展示、按捕获顺序`005B8400(person,0)`；mission0每次返回前重新检查所选person valid
5. mission0的type30宝物tail在全部组员返回后执行；然后才判断scratch并销毁

该API对应`004A57B0→005B9B40`，dispatcher固定传scratch `[-1,0,0]`，故`[0]!=12`始终进入销毁请求；不把event12调用者的另一路路径冒充当前入口。source handler返回值和工程`accepted`分开记录；`accepted=true`只说明这个有界命令已处理，可能仍是no-op或有未执行的效果。

## 3. 零退款返回与原子性

复用P0-53已恢复的逐人零退款标量helper，保持其既有语义。异地设置mission37、五参数0、acted，再写距离观察低byte，-1成为255；同地按mission/args→duration→acted顺序reset。S2同地query267为true保留acted；异地不经过该hook。非status5记录`004BF6F0(person,home,0,1)`未执行。实际location不瞬移，没有新增加金。

新增人物home域为-1..16383，保留原`+98`建筑引用，因此设施home也能被后续销毁清除；原模块仍维持其旧-1..86输入契约。返回比较读取当时home：若home是待毁设施，先按这个home准备mission37，随后才清home=-1，不拿最终home倒灌早期比较。

每个实际入选返回分支所需距离/S2 query、type30所需treasure42、实际销毁分支所需type/territorial-city/force观察，均在任何标量writer调用前作工程preflight。只验证真正走到的分支，不给无效目标、未入选person、未用force/city添加虚假观察要求。缺失slot会报错，不猜作invalid。`personsComplete:true`明确承诺缺席person slot未分配；局部名单不能冒充完整宇宙。

## 4. type30读取的是宝物42

`00490B30(42)`是treasure数组getter（ID域0..99，stride0x54），不是person42。handler直接读treasure+40的owner编号：

- owner在0..1099时跳过reset，不查询该person是否valid、是否存在
- owner越界时才调用`004A0F00`，后者先检查treasure valid
- 有效treasure由`00484DE0(-1,-1)`先写owner=-1、city=-1，再由`00484E20(0)`写state=0

S1与S2 owner setter分别取证。S2把旧owner传给`008EA230`，hook解析旧person且只有valid时调用`0048A2D0`刷新。当前caller只有旧owner越界才进reset，因此这个hook无法解析有效旧person，不新增刷新副作用。精确hook范围为`008EA230..008EA256`，不把后面无关函数/对齐字节算入正文。mission38即便目标type30也没有这个宝物tail。

## 5. 设施销毁：城市byte、home引用与raw reset

### 5.1 原流程和未投影边界

`004B09B0(target,1)`先检查建筑valid，取得类型数据；+22不是FFFF时请求attachment cleanup。然后是类型分类、force/city处理、可能的event12、home引用清除、第一次`004B06E0`、`004A3180`列表删除与virtual+20 reset、第二次`004B06E0`。

具体building虚表为`0079C718`，由`004880A0`constructor写入。virtual+08=`00486400`校验class5和type0..63，virtual+20=`00486430`。virtual+24的`00573470`返回立即数5；`004A3180`的`0047A660(class5)`通过virtual+2C进入`004863D0`，其class5分支返回1，两个gate均由具体leaf字节闭合。模型只接受该具体vtable和完整raw0x38，`pointerReadable`是通用指针可读性观察；valid由它与raw type范围共同决定。它不是另加person的allocated gate。reset后仍保留可读slot，但type=-1使valid为false。

type3..63不走type0的展示、city-owner force调整和event12；type0..2整段销毁显式defer/reject。对于其余非domestic设施，force有效且类型数据有效时记录精确`004B6580(force,-unsigned(type+CA),0)`请求；`004B6460`的具体势力量值/回调未实现，不把它猜成金钱、技巧或其他资源。

attachment、展示、列表unlink、force调整、空间/AI刷新及完整返回不执行，以ledger注明顺序和阶段快照。`callbackAssumption=noninterference-v1`是明示、可替换的工程前提，不能当作原机保证。`unknownEffects=reject`整笔拒绝，after保持before、steps清空；ledger的beforeStepIndex此时属于丢弃的候选步骤，不能索引空steps。

### 5.2 城市计数的来源差异

`00487A30`读type-data+ B4==4判定domestic；此读取自身不检查type-data valid。domestic且territorial-city子对象valid才可能减计数，建筑valid不替代城市子对象valid。

`004B0C5C`九个跳转指针及`004B0C80`二十七个索引byte恢复：

- types33/34/35/36/37 → city+A8/A9/AA/AB/AC，两源都要求建筑dword+14非零
- types38..53及其他未列类型无计数写入
- types54/55→A8、56/57→A9、58/59→AA：S1跳过+14 gate，无论+14是否0都减；**S2数据表把这些指回带+14 gate的分支**

五个helper `0047B820/840/860/880/8A0`直接byte ADD(-1)，模256回绕：0→255、128→127。它们不是P0-53任务2的signed byte clamp[-1,30]，两条操作不能混用。模型保留五个raw unsigned byte，+14称为原始construction字段，不借此推定所有类型的完整工程进度语义。

### 5.3 home-reference完整扫描

`004CF270(mask63)`按person ID0..1099扫描，要求`0047A600` allocated，**不要求`0047A630` valid**。`00488B9C`十项状态跳表证明mask63选status0..5；status-1/6/7/8分别用其他bit，不入选。再排除：

- S1 person ID700..799；S2 person ID704..753
- virtual+40 force编码42..45，以及46

符合者只有home+98等于待毁building ID时写-1；其他人物字段不变，包括valid=false但allocated=true的人也能清home。选取及写回发生在所有取消返回以后、raw reset以前。模型要求forceId观察；不从home/current owner猜它。

### 5.4 精确写宽，不是memset

`00486430`先调用`00423230`（RET4，无状态写），再依次：

- dword+08=-1；dword+0C=-1
- word+10=0；dword+14=0；dword+18=0；byte+1C=0
- word+1E=-1；word+20=-1
- dword+28=0；dword+2C=0

raw中的+00虚表、+04、+12/+13、+1D、+22/+23、+24、+30、+34等其余byte原样保留；特别是constructor写过的+22并不由此reset清除。不替未知保留字段发明名称，也不把0x38全部置零。每次写有offset/width/前后byte和building快照；第二次空间/AI刷新ledger看见type=-1。

## 6. 验证与剩余工作

模型24项测试通过，含两源/两任务、ID序前三与actor排除、当前type0 gate、invalid-target return1、完整type3..63×construction×source计数矩阵、全部byte回绕、逐byte reset保留、treasure owner边界、allocated-invalid home扫描与来源排除、预验证/原子拒绝、副作用时序快照、完整trace/幂等/重放及128组确定性fuzz。新增77个byte范围及24个既有引用、6个小文本容器；38组双源比较35同/3异。10项独立byte checker锁定来源容器、指纹、既有manifest引用、CALL顺序、虚表、写宽与数据表差异。TypeScript、85 Node、75 Python checker和两demo共78条命令通过。独立审阅另通过366组直接source-bytes计数oracle及20项invalid-type/reorder验证；class5 leaf/gate链已补全，终审无阻断。合并后main仍须复测。

当前原实现仍有边界：41..43 handler、mission37完成、004BF6F0完整返回、mission-event监听器、base销毁、列表/attachment/空间/AI、force调整/灭亡与完整capture组合，clean stock/真实存档/全局RNG和Vanilla/主机版。新增有界设施投影不能把这些债务删掉。完整回归及独立审阅结果记于[STATUS](STATUS.md)。
