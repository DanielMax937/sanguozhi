# P0-60 通知门、acted/active-list 与零退款返回尾：静态字节证据

见[manifest](../mission-notification-tail.json)与[独立字节checker](../../../scripts/check_mission_notification_tail_source.py)。本组只恢复有界函数、具体虚表和有序写入，不把未恢复的presentation、query hook、observer或完整return当成零效果。

## 来源、预算与复核

2026-10-04重新校验两份IDB完整SHA256，使用既有可信静态parser读取并仅反汇编字节；每段另外直接从ID1 flags按四字节stride取低byte核对。未运行EXE或任意游戏机器码。原IDB不随仓库重新分发；原下载URL、分别指纹、recorded input path及EXE metadata完整保留在manifest。

S1关联血色5.0公测，S2关联血色衣冠6.0sp5。Recorded EXE hash只是IDB元数据，未独立认证EXE；clean stock PK、Vanilla、console、真实存档、运行态hook及全局RNG仍open。相等局部字节不是完整跨来源等价。

共同范围每源61段（55code、6data），另1段S2-only `0090CBA0..0090CBCB`，共123段、10,811 bytes。两个文本容器各有独立SHA256；manifest给出每段一基行号、end-exclusive地址、字节hash和独立ID1重读hash。`004890F0..00489116`是明确fixed fragment：S2 IDA函数end在00489100，实际入口有向外JMP，不能按旧函数边界假装已闭合。

标准库checker直接解析连续byte列，不信符号名或反汇编注释；检查18组来源、调用目标、条件跳转、虚表、写入宽度/顺序、hook差异与范围边界。无需原IDB、Capstone或运行模型：

```sh
python scripts/check_mission_notification_tail_source.py
```

## 通知门不是一个凭名称猜出的“玩家军团”布尔值

`005B81D0`严格依次执行：actor valid → actor virtual+40 → force getter00490AA0 → force valid → force virtual+48 → actor virtual+44 → legion getter00490AD0 → legion valid → 0047A6D0(legion)。每个失败门短路返回0；成功返回1。

具体person虚表0079C780的+40是0047B2B0：取raw legion，经0..46 getter及legion valid后才取legion virtual+40的raw force；无效返回-1。+44是004883B0，仅原样返回person+94，没有范围规范。Force虚表0079C0E8的+48是00480FA0，精确检查有符号force+60是否0..7，不比较“当前玩家/当前回合”。

`0047A6D0`先调用输入legion的+48。具体legion虚表0079BFB0令其落到0047A690，再取force并重新验证force/player。随后调用legion+44→0047E3A0→004912C0，取自身canonical fixed-array ID，重新获取/验证同一legion，最后比较legion+8是否1。`004195D0`是常量-1，不是线程身份观察。

规范、可读、未替换虚表且稳定输入下，这条路径没有应用状态写入或local RNG；任意pointer、异常可读性、异类/替换虚表、concurrency不在这项纯门推导内。Valid与allocated不同，force/legion/person valid也不能互换。两个handler在门前还保存force+44；该字段不是force+4，证据不把它擅自命名为君主ID。

## Acted与active-list的真实顺序

`00489B40`不是纯bit setter：

1. 00472520只改变person+124的bit0，其余位保留
2. 004A06A0→004829B0把manager+1CC（global07201B24）写1
3. 004B9480→004EC870读取global091BA048；null直接返回，非null调用该对象virtual+1B4(0,0,0,0)

第3步未闭合，可能改变后续人物字段、valid事实、observer及active-list；必须明确whole-frame观察或拒绝，不能先把它默认为不干预。位写失败/不可读内存不在成功可读字段域。

`00482F80`先重新检查actor valid，随后在manager+184（global07201ADC）上的00482AF0以原pointer相等查找；缺席才0047C1B0尾追加。已有重复节点保持，不排序、不去重、不清任务。追加保存payload到newnode+8，再写oldtail.next（空表写head），最后写tail。Native有效actor路径即使allocator返回null也返回1；模型若采用“追加成功”必须明确排除OOM/allocator/concurrency，而不能由函数return1推断分配成功。

`004A73A0`要求actor valid、mission0..43；cancelFlag非零有额外004A57B0，此处005B8400固定传0，故不走取消。其执行顺序为mission与五个参数逐dword写 → 直接00489B40(1) → 00482F80的live valid/list检查。Observer发生在写mission之后、active追加之前。

## 005B8400的已恢复返回边界

入口没有actor valid门，立即保存规范化location（0..86否则-1）和raw home+98，然后比较。规范化location与raw home相等才走同地分支，不能把两者都默默规范化。

异地：用保存的current/home building查0049E4D0 → 设置mission37，arg0=refund，其余四arg=0，cancelFlag=0 → direct acted/cache/observer → active-list → 004A5660重新valid后将保存distance的低byte写到person+158。Duration不是第二个acted bit。上述函数不会直接移除active节点。

同地：004A5780用allocated门清mission与五参数 → 004A5660用valid门写duration0 → 004A5600再次valid后处理acted1 → 仅正数signed refund调用004AE2A0 → 00488C70读live status+ A0 ==5 → 非俘虏调用004BF6F0(actor,saved home,0,1)。完整finalizer、退款callee的transitive effects未因此闭合。两个已选mission23/24 handler均明确传refund0，所以本组公开组合不处理任意正退款。

两个handler保存的current/target pointer与raw force+44只用于相应presentation参数，随后005B8400重新读取live actor位置/home等。Notification为false也继续返回尾；presentation非零路径依次调用005CF9F0、0049B390、saved current building virtual+3C、004D06A0、virtual+3C、0063ADD0。该闭包必须有整体effects观察或拒绝；无全局RNG零消费推论。

## 真正的来源差异

四个共同范围不同：004890F0、004A5600、0079B830、0079C2B0。

- 005B8400两源完全相同，005B8495均调用004A5600。差异在wrapper内004A5619：S1直接00489B40，S2调用0090CBA0
- S2 value==0时直接writer；非零先004890F0(actor,267)，query非零跳过writer，零才writer(1)。Query后无额外valid门，结果/effects必须绑定同一次调用。S2实际query入口JMP009142F8及008EA258，未闭合transitive hooks，因此采用可变full-frame的result+effects观察或拒绝，不能推为纯getter、不能套S1 skill0..99逻辑
- 004A73A0直接00489B40，两源相同；异地mission37设置不走query267
- 有向42×42 distance table不同1084 byte；territorial-zone byte table的128项中不同32 byte。相同坐标可先映射不同territorial city，再使用不同distance，不能跨source复用观察

`0049E4D0`的纯性有具体源码边界：canonical building+8 valid → +3C=00487DC0返回raw+1E packed坐标 → 坐标0..199时读运行grid → 提取bits5..11作为0..127 index → 004839F0查0079C2B0 byte表 → 0047B480查有向distance。该闭包只有查询、栈写和返回值，原样建筑虚表与安全可读grid域内无应用写/RNG；结果为-1或0..255。运行grid仍未捕获，stage/source/参数绑定的纯scalar观察不认证其真实性。地图内存、替换虚表或source外hook不在此证明内。
