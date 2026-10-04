# P0-63 原生roster/role排序、capacity与可变S2查询

更新：2026-10-04 UTC。基线main `fd1323511ae7f2d1a1f171e787bca2300444cc4b`（PR #20已合）。新增版本，不修改P0-62及更早API、frame或trace。

- [结构化来源](../sources/native-roster-sort.json) · [字节域](../sources/native-roster-sort/README.md)
- [事务API](../../scripts/native_roster_sort_profile.py) · [原生排序/capacity](../../scripts/native_sort_primitives.py) · [扩展frame](../../scripts/native_sort_frame.py)
- [来源检查](../../scripts/check_native_roster_sort_source.py) · [模型检查](../../scripts/check_native_roster_sort_profile.py)

## 1. 这次闭合什么

`project_native_roster_sort(state,command,observations,policy)`继续使用一个共享live frame、一个有序观察流及一次revision提交。独立入口支持return、legion、governor、event，另提供roster-sort、role-sort和capacity来检验具体原生helper。direct building roster入口也要求kind/ID对应canonical city/port/gate且subtypeValid；否则在count shortcut前原子defer，不能把generic building的schema占位字段视为原生list。此项是API支持域限制，未在0047CD50本体伪造building gate。

在原来正常非空势力/军团、有界return/event域内，这个版本将两种whole-sort观察边界替换为源顺序原生投影：

- `0047CD50(1,0,0,0)`：按当前节点顺序建立独立key-entry，allocated过滤、virtual getter、真实quicksort、clear、第二次allocated过滤与reappend
- `004AA200`：复制并过滤caller的候选pointer，leader的quicksort或governor的merge、live comparator、clear/reappend
- `0048A4F0→0049D540→0049D420`：两源分别执行capacity字段、title/office和technique分支；S2的query377/278保留逐调用可变边界

源程序是语义投影，没有执行EXE、原生allocator或hook。没有用Python排序、预计算capacity映射、稳定排序假设或默认callback不干预来替代这些调用。

## 2. roster的key实际上是ID，不是身份rank

本域只有固定type10 person vtable及roster调用参数`(1,0,0,0)`。它给virtual+14传递`(field0,1,0)`，实际路径为：

`00488720 → 004C9610 → 004C90E0 → 004C8720 → 00491310`

各层allocated gate和两张jump table的field0分支最终返回canonical person slot ID。它不是其他字段/其他flags的身份rank，也不触发capacity/ability query。本域第一次list遍历期间没有可变callback，所以保持节点序的局部occurrence副本等价于源遍历；这项结论不能推广到一般virtual getter。

entry count<2直接返回1，不做过滤、key getter、临时分配、sort或rebuild。count>=2时，每个allocated重复节点都有自己的key-entry和自己的getter调用，不能先去重。临时数组中每项由独立occurrence编号标识，person pointer可以相同。

`004A6960`先检查left allocated，再检查right allocated；任一失败以canonical raw person pointer顺序比较。正常分支使用缓存的signed key升序；相同key先读right virtual+28、保存结果，再读left virtual+28，比较left ID是否严格更小。source中null key-entry分支在成功分配/可读列表的本域不可达。

## 3. 三个真实排序路径与相等项

| 入口 | 路径 | pivot身份 / tie行为 |
| --- | --- | --- |
| roster `(1,0,0,0)` | `0047C6A0→0047B910` | pivot是key-entry pointer，每个重复节点的entry独立 |
| leader flag1 | `004A8F40→004A69E0` | pivot是person pointer，所有同person副本都会跳过pivot比较 |
| governor flag0 | `004A8FF0→004A6B70` | merge只有comparator真才取left，否则取right |

两种quicksort的控制拓扑相同：中间pivot，左扫描`cmp(item,pivot)`、右扫描`cmp(pivot,item)`，交叉前交换，先递归左段再迭代右段。两项span无条件调用comparator，false便交换，包括相同pointer。它们不是稳定排序。

governor merge先递归left再right，复制已排序left段作为临时buffer。因为comparator是严格顺序，完全相同的pointer返回false时取right；不能声称它按occurrence稳定。普通不同人的最终ID tie-break可得到确定顺序，也不等于任意mutable comparator具备全局传递性。

角色sort首次过滤后保存的候选pointer和排序数组不会被callback写入live roster所替换。每一次comparator重新读取当前frame。最终再次检查allocated，callback使某person不再allocated时可被删除；变回allocated的先前未入组person也不会凭空加入。完整前后两轮不等价于只过滤一次。

## 4. comparator保留实时读与saved值

leader `004CEF90`：依次valid(left/right)、ruler优先、capacity低16位降序、office有符号升序、leadership byte降序，最后canonical pointer升序。没有same-pointer shortcut；两项相同person仍可以调用两次capacity。left的低16位结果在right capacity调用前保存；right hook改变left能力/office时，后面的live读取能看到改变，却不能覆盖已保存的left capacity。

governor `004CF160`：valid(left/right)后才有same-pointer false；任一status<=1且两status不同先按signed status升序，否则capacity低16位、leadership、strength、rawWordAE降序，最终ID升序。leadership或strength不等分支还会重新调用left/right两个getter。capacity hook返回后不重新执行已经通过的最初valid/status gate。

这些都是逐条分支的局部比较结果。可变查询可能产生与静态key不同甚至不传递的比较，模型仍执行实际算法，不把结果强制修正为某种“正确排序”。若可变比较使native quicksort扫描越过临时数组实际分配域，则原子defer为不支持的原生读域，绝不让Python负索引绕回尾部，也不伪造原作安全终止。分区边界之外但仍在实际数组内的读取不被擅自截断。

## 5. capacity字段与两源差异

新frame显式增加person raw+54、force raw+40/titleId/raw+58 technique dwords，以及title0..9/office0..80的valid和capacityWord。两源分别核对constructor/vtable/+08/+24后，title/office的valid只取决于固定type15/16，本canonical域必须为true；输入及每个观察不允许写成false。所有明确到达的域内slot都必须提供，省略不代表unknown-null。

`0049D420`先valid person，再解析并valid force，保存force pointer：

- ruler按force title0..9查title容量；越界用9，force40==5用0；源有title无效后进入office分支，但在本固定canonical表域该分支不可达
- office signed范围0..80，普通force内越界用80；force ID不在0..41时S1用44、S2用0
- force40==5的S1比较person与person403的raw+54，匹配时返回canonical title0容量，否则office20
- S2仍读取person403/raw54，但无条件跳过匹配title分支，使用office20
- title容量读uint16+2E；office容量读uint16+2C；源的无效record返回0路径仍有分支记录，但本固定canonical表域不伪造invalid对象

S2的query377在保存且验证force之后发生。非零则读取callback后的live ruler状态，返回12000或15000；零则读取先前保存force pointer的live raw40，继续原分支，不重新验证person/force，也不按person的新rawlegion替换saved force。

`0049D540`保存base结果后重新验证person，再按live person force解析bonus势力。有效force已研究S1 technique18或S2 technique3时加3000。S2即使此时force无效仍执行query278；person无效则直接返回保存base，跳过278。query278非零再加2000，不重新读base或technique结果。

query377/278都通过`effect-query`记录完整before/after、signed EAX结果及RNG消费证据。非零不是必须等于1；缺少观察或policy reject都会使整个事务不提交。查询可改变person/force/title/office/roster/任务/RNG，后续读取遵循源保存值与实时值边界。

## 6. 原子性、资源guard与证据限制

旧P0-62的严格rawDword17C/status→allocated/valid派生、逐status写刷新、CITY/building alias、事件/actor stack及copied active-list上下文继续生效。新frame不自动从旧schema补默认值；诊断snapshot只用于共享字段校验，不作为可变状态回写。

观察绑定source、连续index、helper/args、完整callStack、full before、provenance及结果/after/RNG。schema/domain预检先于任何状态提交；错层、错源、错saved-local、少/多记录、篡改trace或callback后派生缓存不一致均拒绝。命令摘要绑定完整command/observations/policy；接受只有一次revision增长，重复提交不会重复副作用，完整JSON重放重新执行。

`maxSortDepth`新增为1..128的可配置模拟器栈guard；原event depth/native call guard仍有效。这些是工程预算，不是原作排序/递归的终止规则。count/head/tail一致的可读无环list、成功allocator/内存可读探测与固定canonical vtable是明确适用域；policy另要求`nativePlatform=unmodified-successful-probes-allocator-locks-v1`：import名称来自IDB元数据，未认证运行中IAT pointer，只在未替换的正常平台内存探测、allocator和锁域投影。失败分配、node损坏/复用、一般key/flag、任意vtable/IAT重写未模拟。

S1/S2均为分别固定指纹的MOD关联来源。local exact bytes不认证clean stock、Vanilla、原机可达观察、真实存档或全局RNG。其他event、route/target-force、force灭亡、空军团重分配、ruler capture/base销毁及整场游戏调度仍open。未知机制继续采用可替换观察/拒绝边界，不以本组关闭整个TODO。

## 7. 验证

```sh
python scripts/check_native_roster_sort_source.py
python scripts/check_native_roster_sort_profile.py
npm run check
for f in scripts/check_*.py; do python "$f"; done
npm run demo
npm run demo:lifecycle
```

20项source-only检查通过；完整双IDB指纹及独立raw-ID1重读667范围/65,134 selected range bytes通过（S1 331/S2 336；330同形对321同/9异，另7未配对宽度；含56个新增范围，重叠选段长度不去重）。28项模型测试通过，含100静态与128可变独立oracle、逐step/frame/scope/golden比较及hook序、status6/8 promotion、24-hook真实数组越界域反例、原子/幂等与完整JSON重放。完整96条命令回归零失败：TypeScript、85 Node tests、93 Python checkers与2 demos。16文件冻结在全测前后无漂移；asm文本尾空白规范化后的全部范围已再用raw-ID1复核。独立审阅通过：双IDB/raw667范围、20source/27model另行重跑，追加576个signed-status/raw17C comparator与576个S1 capacity边界case通过；收紧direct building receiver域后，test28/20source及6个canonical端点正例差异复审通过，未误加一般building.valid gate。最终96命令重新全过（28model），16文件冻结无漂移；完整回归结果日志经独审核对，无剩余阻断。发布前仅补本结论；合并后main仍须全测。
