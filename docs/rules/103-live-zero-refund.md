# P0-68 live 零退款取消 handler 9/10/12/22

更新：2026-10-05 UTC。基线为 PR #25 已合并后的 main `e8bae319e5d1b08057fd091a90d305d58c9d7669`。本层新增有界实现与证据，不修改既有 P0-66/P0-67 API、frame、replay、trace 或来源文件；不表示已远端发布、已合并或原版游戏认证。

- [来源 manifest](../sources/live-zero-refund.json) · [来源检查方法](../sources/live-zero-refund/README.md)
- [独立 source checker](../../scripts/check_live_zero_refund_source.py)
- [新事务 API](../../scripts/live_zero_refund_profile.py) · [新 live primitive](../../scripts/live_zero_refund_primitives.py)
- [whole-IDB/raw-ID1 实核记录](../sources/live-zero-refund/raw-verification.json) · [独立反汇编边界复核](../sources/live-zero-refund/disassembly-verification.json)

## 1. 本次精确范围

本层将四个已恢复取消 body 接入同一个 live frame：

- mission9：`005CB050..005CB177`
- mission10：`005D5DD0..005D5EF7`
- mission12：`005C4E70..005C4F7E`
- mission22：`005BEDA0..005BEEE2`

全部区间 end-exclusive。新增 profile 为 `source-idb-S1-S2-live-zero-refund-v1`。它只扩展四个 handler 的 source-local 控制流，复用继承的 live notification、零退款 return、route、role 与 event primitive，不调用或拼接旧独立 project 事务。一次组合只有一个 frame、一个严格有序观察序列与一次 revision 提交。

取消 wrapper `004A57B0→005B9B40` 仍 capture live mission，并传入三字 cancellation event `{-1,0,0}`；它不借用 event8/9/10/14 predicate。正常 event 路径则保留自己的 predicate、active-list 副本与 caller context。四个 body 本身未读 event 参数，成功时固定返回 1，gate 失败时返回 0。

## 2. 四者共同的 actor/current 顺序

1. 对 actor 调用 `0047A630` valid；失败立即 0
2. fresh 读取 actor `+9C` location；signed 0..86 保留，其他值归一为 -1
3. 经 `00490D00` 得到 current building pointer，保存于 EBX
4. 对该 current pointer 调用 `0047A630` valid；失败立即 0
5. 调用 `004897B0(actor,0)`，读取此时 arg0，再进入各自 target 规则

保存的是 pointer identity，而不是 immutable building row snapshot。后续 presentation 即使改变 actor 的 location/mission/args 或保存 current pointer 所指行的内容，也不能把这个 pointer 替换成新的 current pointer。相反，随后 `005B8400` 入口必须 fresh 读取 actor location/home，不能复用 handler 的旧 current/target。

## 3. mission9/10：building 数值范围门，force validity 结果被丢弃

arg0 以 signed dword 检查 0..16383，保存于 EDI。范围外立即 0；范围内没有 target building validity gate。

随后执行 actor virtual+40、`00490AA0` force getter、`0047A630` force valid。最后一个调用的 EAX 紧接着被 `005B81D0` 的结果覆盖，没有任何分支使用它。因此它不是取消成功门槛，不得添加 actor-force-valid 提前失败，也不得将它当作返回值。此读取仍要求实际被读取的 canonical legion/force slots 完整。

fresh notification 返回 false 时，直接进入零退款 return。此路径尚未执行 target building getter，所以不可因 target row 不在稀疏 frame 中而报错。

notification 为 true 时，target getter 位于 opaque presentation 区间内部。boundary 绑定保存的 numeric target ID，不先额外读取 target slot；实际 getter/renderer 所需的读取及效果由整个 presentation 观察承担。

## 4. mission12：person pointer 构造不检查 target

arg0 signed 范围为 0..1099。通过后先调用 `00490B00`，将结果 pointer 保存于 EDI，再调用 notification；没有 target validity gate，也没有 handler 自己的 actor-force pre-read。

`00490B00` 的通过分支仅做 `ID * 0x190 + manager + 0xC0BC` 的地址运算，不解引用目标行。因此得到合法 pointer ID 不要求稀疏 frame 已包含该 target person row。若 notification=false，任何 target 行字段均不读取；notification=true 后的目标字段使用属于 opaque presentation。不能把“fixed-array pointer 可构造”加强成“目标存在、allocated 或 valid”。

## 5. mission22：target force validity 与 actor color 是两件事

arg0 经 `00490AA0` 转为 target force pointer，保存到 stack local，并调用 `0047A630` valid；失败立即 0。这是实际 target validity gate，需要能读取该合法范围目标 slot。

接着读取 actor virtual+40、actor force getter/valid。先保存 color=-1；仅 actor force valid 时读取它的 `+44` raw value。这个值在 notification 之前保存，不是 target force 的 `+44`，也不能在 presentation 之后 fresh 重算。

随后 fresh notification。actor force invalid 会令 notification=false，但不是 handler 返回0的额外门槛；通过前三个 gates 后仍执行零退款 return 并返回1。

## 6. notification 的 fresh canonical 读取

共享 `005B81D0` 依次检查：

1. fresh actor valid
2. fresh actor virtual+40 得到的 force pointer valid
3. force virtual+48 为 player force（canonical playerIndex 0..7）
4. fresh actor virtual+44 得到的 legion pointer valid
5. `0047A6D0(legion)` 的 canonical player 检查及 legion number=1

这些读取不采用 handler9/10 的 discarded force result 或 handler22 保存的 color。当前 canonical vtables 下这些部分可由继承 primitive 展开；MOD vtable 替换、未知 hooks 和缺失必读 slots 并未获得默认行为。

## 7. 精确 presentation 边界

- mission9：`005CB0E2..005CB15E`，message `0x13A5`
- mission10：`005D5E62..005D5EDE`，message `0x207E`
- mission12：`005C4EF4..005C4F65`，message `0x13E9`
- mission22：`005BEE58..005BEEC9`，message `0x1595`

全部 end-exclusive，覆盖格式化、`0049B390`、保存 current pointer 的两次 virtual+3C、`004D06A0`、`0063ADD0` 及 actor register 恢复。9/10 还覆盖最开始的 target building getter；12/22 使用已保存 target pointer。

9/10/12 在 `004D06A0` 之后、`0063ADD0` 之前，以原 actor pointer 调用 `0047A770`。它位于未知 presentation 内，不能替换为 notification 之前保存的 force color。22 没有该调用，使用之前保存的 actor force+44 或 -1。

边界必须绑定 source、actor、精确区间、保存 current/target/color 参数、完整 caller stack、紧邻 before frame，并携带完整 after frame 与 RNG consumption 说明；否则原子 reject。不能把 presentation 记为无作用，不能用 scalar projection 或 noninterference 假设吞掉它。unknown RNG count 仍然是 unknown，不升级为零消耗。

## 8. presentation 后的零退款 live return

四者都执行 `005B8400(actor,0)`，不重新检查 actor valid 再决定是否调用。helper 入口 fresh 保存 normalized location 与 home：

- away：current/home getters→source-local distance→valid-gated mission37 setter→direct acted/observer→fresh active append→valid duration wrapper。中途回调可能改变后续读取
- same-home：allocated-only mission reset→valid duration0→valid acted wrapper（S2 保留 query267）→fresh status5 test→必要时 `004BF6F0(actor,savedHome,0,1)`

refund=0 跳过退款资源 helper；这里不扩展非零退款行为。handler 不使用 return helper 的 EAX，最后固定写1。任何继承 observer、S2 query、排序、return、role 或 event 边界仍必须精确观察或拒绝。新 handler 成功不代表整个游戏取消事务或所有 transitive machine code 已闭合。

## 9. 来源验证和旧接口冻结

独立 source checker 不导入生产模型。13 项检查覆盖固定 body SHA256、连续字节、全部 130 calls/56 branches、range/target/actor-force 门槛、saved identities、四个 opaque 区间和继承 tail 差异。

两个 whole-IDB 指纹与其 raw ID1 bytes 已重新实核：S1 610 个唯一 selected intervals、73,708 interval bytes；S2 622、74,065。此统计含继承闭包及重叠区间，不能当作新增代码量。新增专属 body 文件为8个区间、2,364 bytes。另用 Capstone 对 raw handler bytes 新解码，864 条指令的地址与长度全部匹配。

当前 evidence 固定六个直接旧文件 hash；复用冻结的 officer-relocation source checker，验证其17个旧 manifests、622个 physical artifacts、1,852条physical range记录、23个旧Python modules及92个relocation区间。17 个专属文件从已独审隔离实现原样重用，仅调整新 manifest/checker 的真实 main 基线与两项继承 pin，并更新文档；旧 checker、旧 API、模型测试、raw source bytes 和 trace golden 值不变。两项新 pin 对应 P0-67 已合并时的三个 manifest 元数据字段及单条 baseline assertion 调整，其余语义逐字节一致。模型 oracle、回归测试结果以最终集成结果为准，不能由 static source checks 代替。

## 9.1 PR #25 合并基线上的集成复验

在上述真实main基线上，13组source、28组独立model及全新完整106命令确认回归通过（TypeScript、85 Node tests、103 Python checker命令、2 demos）。两份whole-IDB/raw-ID1闭包按上述610/622区间重新实核；122项既有手工独审probe重跑通过。集成delta独审确认只改新基线/pin及文档，无阻断；13个新生产/模型/raw文件与隔离审阅版逐字节一致。原Capstone864指令记录保留并核hash，本次集成未重复该解码。

首轮106中的npm lifecycle子进程曾失败，原始日志保留、原因未确认；未改代码的独立27项lifecycle与全新完整106确认均通过。全测前后1,199 tracked文件与index无漂移，106日志hash逐项核验；之后只补充5份文档验证结果文字，所有程序、测试、raw证据不变。以上均为本地source/synthetic-model验证，未运行原作EXE、未声称远端CI或完整游戏等价。

## 10. MOD-associated 与原版 PK 证据分开

S1 和 S2 都是 MOD-associated IDB。whole-IDB 指纹和 selected-byte equality 只确认指定来源。IDB 中的 EXE SHA256 是记录值，未在本任务中以实际 EXE 独立验证；没有运行原版 EXE 或 target machine code。

因此 PC-PK1.1 仍是 compatibility reconstruction，PC-Vanilla 仍是 explicit compatibility assumption，console 保持 open。clean-stock 原版 PK、全局 RNG、真实 savefile、runtime vtables/tables、scheduler、实际递归终止、观察真实性和整个战斗/俘虏/势力消亡事务仍未认证。未知 presentation、ruler-capture、troop/position、force-extinction、event9 troop tail 等继承边界均未因四body字节相同而消失。
