# P0-66 据点归属、耐久clamp与event9/10来源

更新：2026-10-05 UTC。基线main `874f6126bd82d4bfc2ff6daf778ec60a5120bc35`。

- [结构化manifest](../base-ownership-events.json)
- [独立source checker](../../../scripts/check_base_ownership_source.py)
- [继承的44任务registry、predicate/context证据](../mission-event-listeners.json)
- [继承的canonical pointer/vtable与空军团调用域](../empty-legion-redistribution.json)

## 来源与复核

S1/S2分别来自manifest中固定commit下的公开研究IDB，完整文件SHA256为：

- S1：`c591cb40ce6d6be9246148002532dedc042463f36cd39c5ed300b7c449feefab`
- S2：`aa7f2c983b266633d6e23c494d4f8e1b03e5251632505cae103e176ae850dfd8`

这两份IDB的输入路径分别关联血色5.0公测与血色衣冠6.0sp5。输入路径与recorded EXE SHA256在这次重读中从Root节点再次核对，但没有独立取得或执行EXE。它们是MOD关联来源，不能称为clean stock PC-PK1.1，也不认证Vanilla、主机版、真实存档或全局RNG。PC-PK1.1仍是compatibility-reconstruction，Vanilla单列compatibility-assumption。

从两份重新下载且完整hash验证的IDB，用python-idb 0.8.0与Capstone 5.0.9作静态恢复；另用独立的标准库mmap/struct解析ID1原始flags低byte（每4字节一byte）逐段核对。没有执行目标机器码。所有新文本byte column必须连续、长度和SHA256一致；继承manifest和338段event证据的hash及IDB原始字节也重新检查。

- 新增145段，10,641 selected bytes；继承338段，22,202 selected bytes
- 合计483段检查，32,843 selected bytes（相交的新/旧证据按各自范围重复计入，不声称是unique地址数）
- 新增72对共同起址：68对相同、4对不同；另有S2独有`008EA050..008EA05D`
- 不同对：`0047A7D0`、`004811E0`，以及`0072EB70`、`0072F4F0`两个exception-cleanup chunk的IDB记录范围/内容

`functionRegions`逐项记录完整IDB主body及非连续tail chunk。`0047A7D0`的S2 tail不可遗漏。city constructor与active-list walker也有单独恢复的SEH cleanup chunk；正常成功分配、可读非循环列表是模型域前提，异常路径未实现。`callLedgers`按实际instruction边界列所有直接/间接CALL；JMP tail另由字节和region ledger核对。仅有CALL表不代表递归callee图闭合。

## 004AD550的准确先后

完整`004AD550..004AD665`两源相同。

1. 验证generic building；requested legion允许-1或0..46
2. 依次保存building virtual+44的旧legion、virtual+40的旧force
3. 解析requested legion。无效/null时new force=-1；有效时取virtual+40，并检查0..46
4. 若`00487B30`成立，`004867A0`写building+0C signed dword；接着无条件调用`004876A0`
5. 重读virtual+40。force发生变化时，通过`004866F0`找city subtype，依次清city+A4的bit0、bit1、bit4，再发event9(building,null)
6. force未变时重读virtual+44，legion变了才发event10(building,null)。force变化优先，不同时发10

没有requested legion.valid才允许全部迁移的额外门。in-range无效legion仍可写入subtype的raw legion ID；该legion的force解析结果为-1。没有same-force/same-ID预先短路，native setters和耐久检查照常发生。

`00487B30`按当前kind读取facility metadata+B4，先category1，再在kind!=24时category3，最后category2。每次kind限制0..63，没有metadata-valid门。`004867A0`自身仅接受-1或0..46，写宽度4。

`004876A0`按raw kind与canonical generic building ID同时选择：kind0且ID0..41为city，kind1且ID42..51为gate，kind2且ID52..86为port。其余组合不写subtype，不能仅按ID判断base种类。city写+38、gate/port写+20，都是signed dword。

`004866F0`只按generic canonical ID0..41取city，不看raw kind，也不是territorial-city查询。因此ID0..41上kind与city subtype不一致的合法generic存储，force变化仍可清对应city flags。

## 耐久clamp不是单次min

三个subtype legion setter在raw legion写入之后执行同构步骤：

1. 取得对应generic building；valid时保存其+10 uint16当前耐久，否则保存0
2. 调用subtype max helper `0047A7D0`，以unsigned uint16比较current > max1
3. 只有大于才再次调用max，保存max2作requested value
4. subtype durability setter再次取得并验证generic building，然后调用`00487E20`
5. `00487E20`首先调用generic max `00487150`，之后才测试requested。requested signed16<=0写0；否则max3 signed16<=requested signed16时写max3，否则写requested。实际写generic+10 word

因此clamp分支存在三次max计算，外层unsigned比较和最内层signed16限制不能合并成一个无符号min。模型不得把高bit值当正常正数；S1低16溢出与signed16负数有可见结果。

`0047A7D0`先通过subtype virtual+4C取base uint16：city+82，gate/port+62；再取subtype当前force，经有效force与technique bit判定加3000，返回low16。

- S1检查technique26
- S2检查technique36；S2的`004811E0`支持0..63位（另有arg64特例，与此处无关）
- S2随后跳转完整13-byte tail `008EA050`：unsigned AX大于24000才改成24000，然后pop/pop/ret

S2 tail没有callback、内存写、额外随机数或动态查询。它不是需要人为补观察的未知hook，不能遗漏，也不能误植到S1。

`00487150`按rawkind和canonical ID解析subtype并尾调用`0047A7D0`；若subtype不可用则检查有效facility metadata并读+C2 uint16，否则0。正常ownership setter已经选中匹配的固定canonical subtype，事件之前这段callee链无外部callback，generic kind/ID不变，所以该ownership分支不会进入facility fallback。完整fallback仍恢复以明确getter边界。

## city flags与固定vtable域

`004815F0`、`0047B6F0`、`0047B710`分别传city+A4、bit0/1/4与参数0给`00472520`。后者执行3次有序dword read-modify-write；不是byte写，也不整块清零，其他bits保留。helper有null及导入read/write probe guards。模型依赖固定canonical可读写内存，不声明任意坏指针、被替换IAT或vtable也能精确执行。

manifest列明building/city/gate/port/legion vtable+40/+44与max+4C地址，byte checker核对槽值与原始getter。generic building type-valid由kind0..63派生；canonical city/gate/port固定type getters恒6/7/8，subtype-valid与generic-valid必须分开。

## event9/10的44-slot predicate路径

`004BBAA0`先`004A8110`，再`004BA1D0`，最后重新读取observer并在非null时调用virtual+1B4(0,0,0,0)。复制active-list的节点顺序及重复项保留；每次visit重读executing pointer和actor当前mission，dispatcher保存mission后选择predicate与handler。handler返回值不改变dispatcher成功返回1。

event9可返回true的任务：

- 0/38：actor有效，预读arg0；type5且valid的subject building ID等于actor当前home/+98。不使用预读arg0作这个比较
- 2/5/9/10/23/24：actor有效；type5且valid的subject building ID等于保存的arg0
- 41/42/43：先读arg1再arg0；相同subject门，ID等于保存的arg1
- 21：完整context-valid gate通过后，type5-converted subject pointer等于arg1或arg3解析的building pointer

任务24的kind1/2限定只属于event14，event9无此门。任务0/38的event9由byte map[9-2]=1跳到005BBD31；arg0-based相邻building分支属于event11/12。任务23的event9跳转005B76D7。

全部event10 predicate返回false；37在dispatcher跳过。false不表示没有前置读取。非stub direct predicate仍先验actor、读args；任务12预读arg0，22预读arg0/arg1。共享00441880的任务直接返回0。

15..21的wrapper先构造context再调用predicate。构造器初始化context，在actor有效且当前mission等于context virtual+08固定任务号时保存actor并解析arg0为force。后续005BC560每次重新验证context actor，无效则返回0；初始gate失败也继续执行tail参数getter及对应对象解析。顺序分别为：

- 15/16/19：force0、scalar1
- 17：force0
- 18：force0、scalar1、scalar2
- 20：force0、person1、scalar2、person3
- 21：force0、building1、scalar2、building3、scalar4

解析器范围：force0..46、person0..1099、generic building0..16383，否则null。21的predicate在判断event之前通过00572760顺序验证context actor、force、firstbuilding、secondbuilding。event9先cast subject并pointer比较firstbuilding；未中则重新cast，再比较secondbuilding。没有独立subject-validity调用，不替换为提前统一subject-valid gate。event10也先经过context-valid。

## 完整字节与尚未执行的边界

`004BA1D0..004BA485`完整恢复且两源相同。event10直接到epilogue；event9会进入live troop-list遍历，并可能调用presentation004F55E0、004B5020、004AD2B0、004AD220。该部分可使用精确source/stage/callStack绑定的全frame/RNG可变效果观察，不能称为无副作用、空操作或原生transitive closure。

predicate返回true后，未展开的真实cancellation handler也保持明确可变边界；其返回值仍被dispatcher忽略。post-event observer是独立的fresh lookup。此source包不自动证明未知callback、ruler/capture、force extinction、所有event IDs或全局RNG闭合。

## 检查

```sh
python scripts/check_base_ownership_source.py
python scripts/check_base_ownership_source.py --idb-s1 /path/to/san11pk.idb --idb-s2 /path/to/san11pk_dump.exe.idb
```

默认检查只依赖提交的文本、JSON与Python标准库。可选IDB参数先检查完整fingerprint，再独立核对所有483个new/inherited选段；无需安装IDB parser，也不执行EXE。
