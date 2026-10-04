# P0-61：event8/14、真实 handler/tail 与后置 observer 的组合证据

见[来源 manifest](../mission-event-composition.json)、[规则与输入域](../../rules/96-mission-event-composition.md)及[独立 source checker](../../../scripts/check_mission_event_composition_source.py)。本组只组合已恢复的 dispatcher、通知门、零退款已知写入与外层 observer 调用序；完整 `004BF6F0` 仍是可变观察/拒绝边界。

## 来源与重复验证

- 基线：`1e5862e045c9aec3db14540c2bd8decc565a321b`
- S1 IDB SHA256：`c591cb40ce6d6be9246148002532dedc042463f36cd39c5ed300b7c449feefab`，recorded path 关联血色 5.0 公测
- S2 IDB SHA256：`aa7f2c983b266633d6e23c494d4f8e1b03e5251632505cae103e176ae850dfd8`，recorded path 关联血色衣冠 6.0sp5
- 完整来源 URL、recorded EXE metadata 保存在 manifest；EXE hash 只是 IDB 元数据，不是独立认证的可执行文件

完整引用 P0-59/P0-60 的已提交文本字节，分别锁定两个 manifest、四个容器及每个地址范围。36 个重复引用合并后为 **425 段、29,809 selected range bytes**：S1 为 212 段，S2 为 213 段。212 个共同范围中 208 对相同，4 对不同；另有 S2 专有 `0090CBA0..0090CBCB`。此计数按每段长度求和，不是对重叠虚拟地址再做去重的文件大小。

没有新增机器字节范围：`004BBAA0` 和 `004EC870` 均已在前组提取。2026-10-04 再次重新计算两份完整 IDB SHA256，并使用新 checker 的标准库 `mmap`/`struct` 直接解释 IDAv6 uncompressed ID1 段表，从每个 flags dword 取低 byte，逐段核对所有 425 段。这个原始文件重读不导入 IDAPython、旧 parser、反汇编器或游戏模型；与前组的 trusted parser/Capstone 提取形成独立复核。未执行 EXE 或任何游戏机器码。

默认命令只读仓库提交的证据，无需大 IDB：

```sh
python scripts/check_mission_event_composition_source.py
```

具备相应原始 IDB 时，可额外运行完整指纹与原始字节复核；不能把未运行此模式的默认检查称作重新读取 IDB：

```sh
python scripts/check_mission_event_composition_source.py --idb-s1 /path/to/S1.idb --idb-s2 /path/to/S2.idb
```

checker 还有两个旧 primitive 实现文件的 SHA256 锁，防止新 adapter 静默继承后来改动。这只锁定明确重用的文件，不声称关闭全部 Python import 依赖或替代机器码证据。

## `004BBAA0` 的准确外层序列

完整范围为 `004BBAA0..004BBAF8`，两源相同：

1. 分配 12-byte 栈 record，保存 event ID、subject pointer、argument；ESI 保存原 manager
2. `004BBAC5` 调用 `004A8110`，传该栈 record pointer
3. `004BBAD1` 调用 `004BA1D0`，传同一个 record pointer 和原 manager
4. `004BBAD6` **重新**调用 `004EC870`
5. `004BBADB` 检查结果；null 经 `004BBADE` 跳到 `004BBAF2`
6. 非 null 在 `004BBAEC` 调用该对象的 vtable `+0x1B4`，this 为刚读到的 pointer，四个栈参数全为 0
7. `004BBAF2..004BBAF8` 释放栈 record 并返回；没有固定成功 EAX 赋值

`004EC870..004EC876` 全部六个字节是 `A1 48 A0 1B 09 C3`：仅读取 global `091BA048` 并返回。没有回调、应用写入或 RNG 调用。该 getter 的纯性不等于 nonnull observer 的纯性。

`004BA1D0` 只采用明确片段 `004BA1D0..004BA20D` 与 `004BA478..004BA485`。event 8/14 都经减 9、减 7、减 2 的比较到达 epilogue；途中仅局部栈写入，没有应用状态写入/函数调用。这里没有恢复其余事件分支的完整函数，也没有把第二子系统无操作推广为整场事件无效果。

最后 callback 不接受 event 参数。新模型可以用 event 绑定观察 context，但它不是 native 实参。模型 `accepted` 仅表示候选事务提交，不是 `004BBAA0` 的 native EAX 返回值。

## 嵌套突变期间哪些值保存，哪些必须重读

- `0049F820` 复制 active list 的 pointer payload，保持顺序与重复；`004A8110` 的临时表独立于后续 global active list 变化。每次访问才重新读 live executing global `09771594` 和该人物 `+0x13C` mission
- `005B9D37` 把 mission 保存到 EBX。predicate `+8` 与 handler `+C` 的 registry lookup 都使用此 EBX，不能在 predicate 后改按 live mission 选择另一 handler
- 两个 handler 保存 current building pointer 到 EBX，target pointer 到栈，通知用的 force `+0x44` 或 -1 到栈。`+0x44` 未被证实为君主 ID，不重命名其语义
- presentation 范围分别为 `005B6DC4..005B6E35` 和 `005CFC28..005CFC99`，包含末尾从 `[EBP+8]` 恢复原 actor pointer 的指令；其后才 push refund 0 并调用 `005B8400`
- `005B8400` 入口重新读 live location 和 raw home，无额外 actor-valid 入口门。location 规范为 0..86 或 -1，home 保持原始值；不能两者一起规范化
- 异地分支在 `005B844F` 将 distance 保存到 EDI。mission37/direct acted/dirty/observer/active-list 之后，期间 setter 仍接收这个保存值，按最新 valid 门写 low byte
- 同地分支 EDI 保存 raw home，跨过 clear/duration/S2 query/acted observer。最终 status 来自新的 live 读取；full-return target 来自保存 home，而不是 observer 改过后的 live home

这里保存的是 pointer/scalar 身份，不是冻结其指向对象的全部字段。随后 listener 的 subject valid、raw kind、mission、executing 均按最新 live frame 解释。未知回调的 whole-frame 观察不授权篡改原生栈、registry、vtable 或 canonical slot identity。

## 两类 observer 不合并

acted 的 `00489B40` 顺序为 bit0 写入 → manager dirty → `004B9480`；该 helper 自己调用 `004EC870`，非空才执行 `virtual+1B4(0,0,0,0)`。这是 handler 内较早的一次运行态读取。

外层 `004BBAD6` 在所有 copied listener、handler、return-tail、nested whole-frame 效果以及 temporary-list destruction 之后才重新读取同一个 global。较早 callback 可以令 observer 存在性变成 null/nonnull，因此两次调用必须分别绑定 stage；不能缓存入口值或复用前一次效果记录。最后一次 callback 的未知函数体仍需完整可变观察或原子拒绝。

模型的 `observerPresent` 只是 null/nonnull 投影，不表示已恢复 observer pointer 或其 vtable identity。需要区分具体 callback instance 的观察必须在声明的 opaque frame data 中保留相应身份；不能仅凭相同 presence 布尔值声称是同一个原生对象。source checker 验证实际 getter 与调用点，不认证观察中的运行态对象身份。

## 来源差异与未闭合范围

四个不同的共同范围仍是 `004890F0`、`004A5600`、`0079B830`、`0079C2B0`。S1 同地 acted wrapper 直接到 `00489B40`；S2 经 `0090CBA0` 的 query267，可产生完整可变效果，返回后没有第二个 valid 门。两源异地 `004A73A0` 都直接调用 writer，不调用 query267。相同 `005B8400` 字节不能抹去这些下游差异。

未闭合项保持显式：presentation；S2 patched query；任意 nonnull observer body；完整 `004BF6F0`；runtime grid/distance observation 的真实性；allocator/OOM、并发、异常展开和非规范 pointer；未知回调内部递归事件；完整角色/空军团/灭亡/capture/scheduler 与全局 RNG。

两个 handler 的退款实参都是 0，因此本组不执行任意正退款 `004AE2A0` 闭包。显式 identity observation 是可替换规则，不是 native 无干预的证明；相同 RNG 首末值也不能证明零消费。

S1/S2 都是 MOD-associated 来源。PC-PK1.1 仍为 compatibility reconstruction；Vanilla 单独为 compatibility assumption；clean stock、主机版、真实存档与完整游戏事务均未获验证。局部字节一致不升级这些边界。
