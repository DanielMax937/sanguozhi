# P0-49 据点捕获：城兵容量、人员分组与处分边界

更新：2026-10-04 UTC。基线main：`feca7b37678bccff55d0e8e5732cea463c457708`。承接[P0-48](83-capture-transaction-source-profile.md)。

- [结构化证据](../sources/capture-personnel-source-profile.json) · [142个文本字节范围](../sources/capture-personnel-source-profile/)
- [人员参考模型](../../scripts/capture_personnel_profile.py) · [30项校验/77,824组算术](../../scripts/check_capture_personnel_profile.py)
- 运行：`python scripts/check_capture_personnel_profile.py`

## 1. 完成范围与来源

本轮恢复S1城市容量查询、`004B1280`的据点人员资格与分组、`004B2820`六分支处分dispatcher及下游主要职责。模型读取完整相关稀疏人物表，按来源顺序分组，并提供有界人物字段投影、全trace和重放。它是独立Python参考模型，没有接入训练沙盒或P0-48完整事务；没有声称可运行整场战斗。

S1：[sjn固定IDB](https://github.com/sjn4048/311MemoryResearch/blob/66e167e40c3440929ec016f3872aefc3486434c1/IDA%20Related/san11pk.zip)，IDB SHA256 `c591cb40ce6d6be9246148002532dedc042463f36cd39c5ed300b7c449feefab`，记录EXE SHA256 `30d33b44876b84a8e87570873a86de88c65d2491c7e1cdeeb5883dc4b12feefb`，路径含“血色5.0公测”。

S2：[sean固定IDB](https://github.com/sean2077/311SireCustomizedPackageDev/blob/43afe4efe273cf3b6ab7833b9b6f5822bd331fd4/ida-db/san11pk_dump.exe.idb.7z)，IDB SHA256 `aa7f2c983b266633d6e23c494d4f8e1b03e5251632505cae103e176ae850dfd8`，记录EXE SHA256 `b1e9467e9612c23af83f6feda8414bc9ee99eb62c6862a84f7f4c5a8822b9da9`，路径含“血色衣冠6.0sp5”。

两者均MOD相关。EXE哈希来自IDB元数据，未另取EXE复算。全部操作为静态读取/反汇编，没有运行未知EXE。提交仅文本字节和自写代码。71组对照61同/10异；对比为**S1范围的同地址窗口**，不宣称S2 hook完整控制流已恢复。

`opcode-exact`仅限列出的S1字节和局部分支。PK采用为`compatibility-reconstruction`；Vanilla必须显式`PC-Vanilla-assumed`/`compatibility-assumption`；PS2/Wii仍open。原作证据债没有因单元测试通过而消失。

## 2. 城兵容量：0x26并非布尔predicate

`004C0C30(city,0x26)`的switch表槽位在`004C16B8`，独立四字节`D6 11 4C 00`指向`004C11D6`，不能只提取函数body而省略该表。

有效城市上：

1. `0047B3A0`按0..5读city+0x86..+0x8B六个byte
2. 查询返回第一个**非零**byte的索引0..5；全部零返回-1
3. `test al,al; ja`在这里等同非零，0x80/0xFF也成立
4. S1 `0047B330`：索引-1→150000兵；其他→100000兵

社区结构表将这六项标作城市特产；偏移、宽度、首项优先和容量常量由S1字节自身证明。该路径不查特技、科技、太守、人员数量或当前兵力。无效city入口返回0，不能据此构造正常城市容量。

S2 `0047B345`把S1的`add eax,150000`改成`mov eax,[ecx+0x3C];nop;nop`，覆盖此前算式，结果来自S2城市字段。即使查询arm和getter相同，容量不能跨源共用。S2字段加载/写入来源本轮不扩散追踪。

`city_troop_capacity([six bytes])`是S1适配器，返回来源标识和容量。可以将其`troops`作为P0-48显式old/normal/neutral capacity observation的一部分；每个阶段应读取当时六字节，不能无证据固定全事务不变。它没有把S2或stock常量静默写入P0-48默认policy。

## 3. 主caller人员阶段与模型起点

`004B2CA0`在资源保留之前按以下顺序处理人员：

- `004B3032→004CF360(mask0x20)`从目标据点人员链收集身份5的原有俘虏，再按属性4==目标base过滤
- 旧俘虏所属势力等于新势力：身份3、formerForce=-1、captiveMonths=0、acted标记1、归属新军团，发出事件4；其他旧俘虏走`004A8970`释放/迁移链
- `004B3180→004B1280(capturedArray,escapeArray,target,source,mode,-1,-1,0)`分组
- `004B318E→0049F820`把captured按顺序追加到escapeArray，形成全部处理列表
- 再从据点人员链收集身份0..3、旧势力、当前位置不等于该base，排除俘虏和实际部队成员，追加不在城内的相关人员
- `004B3271→004B2820(allArray,capturedArray,target,source)`处分
- 然后才到`004B329B`资源保留

本模型输入明确是**004B3180入口、旧俘虏释放已完成后的观测**。输入的`valid=true`是适配器对所需`0047A600`(virtual+4)和`0047A630`(virtual+8)均通过的合并观测；只通过其中一个的异常对象不在本模型支持域。它实现当前位置据点人员的partition，暂不应用前置释放、缺席home-roster、处分排序及完整人员迁移。它们出现在fallback ledger中，未从TODO撤销。不能把`after`未改字段当作整个原事务结束后的最终状态。

## 4. 004B1280据点分组

### 候选与环境

- `004CF2F0`顺序扫描person ID0..1099，验证pointer、`person+0x9C==base location`，再调用身份mask helper
- `00488B30`的独立switch表证明mask0xF接受身份0..3；`004AF400`再过滤到目标原势力
- 相同地点但他势力、身份4/5/6/7/8、无效对象不入普通候选
- 人物表输入顺序不改变此ID升序；不是P0-48的建筑链表顺序
- troop的vtable+0x58/+0x5C在`0079CC70/74`绑定`0047A8A0→00495600`，检查主将和两副将的单skill字段；S2的`00495600`本体又有hook，不能跨源继承
- 目标是城市时接触半径参数2；港关为1。传给helper的邻近数量参数为-1时会按目标地图范围统计source势力部队；地形参数-1会读目标cell低5bit
- 本模型要求观察得到的`inRange`、`nearbySourceTroops`和terrain及非空provenance。未伪造完整地图邻域helper或世界全局调度

context helper `004B0E20`枚举目标原势力的城市，若目标本身是城市就从列表移除；其+8表示还有其他城市。港关不会排除母城，也不是“还有任何一个建筑/部队”。模型从显式完整相关城市表求这个值。

### 顺序重要

每个普通候选按以下顺序：

1. 任一正规force index不在0..41、scenario option0x18，或captor为建筑且没有己方符合条件人员→escape，不roll
2. 目标原势力没有其他城市→capture，不roll
3. `004A0590(person,0)`持有type0宝物→escape，不roll
4. 特技ID0x20→escape，不roll
5. 普通概率

因此S1末城强制capture在宝物/skill32判断**之前**。不能将“强运绝对免疫”不分路径套到末城。S2已把第2条的条件跳转改为无条件跳转，直接绕过强制捕获；不能混作相同规则。

`004A0590`的语义现在闭合为：`004CDF40`遍历0..99宝物，选合法且holderPersonId等于该人物，再检查treasure+0x38类型是否等于参数0。type0通常标作名马。模型以观察得到的`horseTreasure`代表这个查询结果，不因名称从其他来源引入额外效果。

### 概率算术

W/I是byte getter `00489080/00489090`读取的+0x171/+0x172。模型保留偏移名称，避免宣称已计算完整能力成长/缓存。

```text
q = truncTowardZero((120 - max(byte171,byte172)) / 3)
mult = 1                                         if nearbySourceTroops == 0
     = 100                                      if nearby > 0 and skill == 0x1D
     = 100 * nearbySourceTroops                  otherwise
terrainFactor = 1.5 if terrain in {3,4} else 1.0
divisor = 2 only if difficulty==2 and sourcePlayer and not targetPlayer
arrest = 100 if source has skill0x13 AND inRange else 0
p = truncTowardZero(q * mult * terrainFactor * binary32(0.01) / divisor + arrest)
p = min(100, p)
if arg8 != 0: p = min(100, p + 30)
```

关键修正：

- **nearby=0时mult=1，然后仍乘约0.01**，不是普通合围倍率1；低值常得到p=0
- `0077AA88`存的是`0A D7 23 3C`，精确值`5368709/536870912`，小于数学0.01。W/I=100、nearby=1、普通地形、无其他修正，q=6，来源结果为**5而非6**
- +100在浮点转整前加入；没有下界clamp。超常能力byte>120时带符号除3按向零截断，不是Python负数floor
- arg8在本base-capture caller为0。这里只保留它的数值作用，不再未经caller证据将整个参数命名为“任意戟兵战法”
- arg5 mode在S1完整body未被读取；trace保留，不编造倍率
- 算术实现使用精确dyadic Fraction，在本模型byte和0..18邻兵的有界域、x87 64-bit significand运算前提下中间值可精确表示。stock运行时FPU环境、超界32位溢出并未认证

S1 `004721D0`：p<=0直接false，**零RNG消费**；p>0更新32位LCG `state*0x6C078965+0x3039`，取`(state>>16)%100 < p`。p=100也消费一次；p>100在此helper也必成功且消费一次。当前capture前面已有上cap，不把此结论误写成当前caller可产生p>100。提供的seed只是此loop入口观察状态，不是原游戏初始seed。

## 5. 004B2820处分表及有界投影

独立jump table `004B2C84`证明：

| code | 入口 | 路由 |
|---|---|---|
| 0 | 004B2A67 | 归顺/登用：004A92C0，再分建筑接收/目的地→004A8440或004A88A0，事件7 |
| 1 | 004B2B30 | 俘虏：004AD9A0解析captor代表，004A93B0处理 |
| 2 | 004B2B64 | 释放：004A9120，再004B1950(flag1) |
| 3 | 004B2BDA | 处断：004A9120，再004ACBE0 |
| 4 | 004B2C4C | 不动作，继续下一个 |
| 5 | 004B2A51 | 脱离：004B1950(flag0) |

处理数组初始所有1100项为5；captured列表交`004B27F0`后才填入决定。`004B27F0`有非连续tails：玩家进入`004B2380`交互界面，AI进入`004B03D0`判断招募/关系/君主等。不能把它当随机捕获概率的延伸，或把初始化5当所有人的最终决定。

dispatcher先复制全部人员。目标若为部队，主将移到处理列表尾；目标建筑则调用`0047CD50`按属性0x14排序。排序字段、tie-break及对全事件顺序的作用本轮未完整实现；参考模型按候选ID顺序输出意图，明确是工程报告序，不冒充dispatcher执行序。

可运行policy：

- `hold-captive-v1`：给概率/硬gate判定捕获的人选择已知code1，是可替换工程选择，不声称原AI/用户这样决定
- `observed-codes`：对全部候选预先提供0..5；只对实际captured应用，escaped仍是5。非1路由只record-only意图
- `reject`：拒绝缺少完整处分语义的运行；`unknownEffects=reject`同样在RNG前拒绝

code1仅应用`004A93B0`在有效人物/合法captor代表前提下恢复的三项scalar写回：`status=5`、`formerForceId=捕获前人物forceId`、`officeId=80`。其他字段保持输入值且明确标为**未投影**。没有虚构关押目的地、所属军团/势力变化、太守/都督调整、任务清理或事件。`captorRepresentativeId`须是显式观察到的合法代表；troop第一成员须为主将，成员force/location必须一致，troop location限定87..1086、building限定0..86、成员与代表限serving身份0..3；空成员拒绝；建筑的太守→君主选择由观察提供。可能执行code1却缺有效代表时，在RNG前拒绝。原函数中间callbacks可改变对象，模型未运行这些步骤，故这些字段只是忽略未建模副作用条件下的局部投影，不能暗保完整原事务后仍这样写。`officeId=80`只证明此路径使用该值，不关闭整个官职classifier的index80语义。

## 6. S2具体负对照

10个不同范围含：

- `004B1280`：末城强捕gate取消；免疫skill0x20→0x18；合围抑制skill0x1D→0x7D；捕缚bonus100→30；额外修正30→20及cap控制流变化
- `004890F0`：S1只检查0..99单skill字段，S2出现多个hook，不能拿S2的skill125解释S1
- `004721D0`：S1读取全局LCG状态，S2先call0x008EB010，不能认证相同随机来源
- `0047B330`：S2读city+0x3C代替S1特产容量结果
- `004C0C30`整体不同，但本次0x26 arm和表slot相同
- `00495600`、`004A9120/004A92C0`、`004AF0E0`、`0047BDA0`也不同；相同dispatcher不会证明全部transitive效果相同

## 7. 验证和下一缺口

30项测试覆盖：142范围全部字节/长度/hash、71对照、关键jump table/opcode；77,824组独立浮点算术交叉验证；首非零特产byte；ID/身份/势力/末城/港关/宝物/skill优先级；普通/超级方向；mode无影响；零/p100随机消费；可变处分；原子性、重复/过期/revision耗尽、非法输入、JSON重放与重新签hash后的篡改识别。

仍需继续：stock独立对照；前置旧俘虏释放与缺席人员完整projection；`004B0F50/004A7990`目的地选择及迁移、`004B03D0`AI处分全callees、玩家交互结果；军团/太守/任务/force灭亡/事件副作用；真实存档与全局随机流；Vanilla/PS2/Wii。已取得函数体、分支图和已知写回，但未实现的整条链仍为证据或工程债。
