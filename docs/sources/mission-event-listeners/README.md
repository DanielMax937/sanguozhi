# event8/14任务监听：S1/S2文本字节证据

见[结构化manifest](../mission-event-listeners.json)和[规则/输入域](../../rules/94-mission-event-listeners.md)。

两份S1/S2来源分别关联血色5.0公测与血色衣冠6.0sp5；来源URL、IDB完整SHA256、recorded EXE metadata见manifest。所有选段通过既有trusted static parser读取，另直接按ID1 flags低byte/四字节stride独立重读。只反汇编静态数据，未运行未知EXE。选择范围各169段、105code/64data，合计22,202 bytes；169对本地范围全同，不推导transitive hooks/table/运行态或原版一致。

S1-selected.asm.txt / S2-selected.asm.txt按manifest的一基lineStart/lineCount定位，所有byte column须地址连续、长度与SHA256相符；容器另有完整hash。43个vtable+8/+C配对与44slot初始化通过constructor/实际写入源码验证。checker只用Python标准库读取提交的文本字节，不依赖未redistribute的IDB或EXE。

关键函数：004BBAA0、004A8110、005B9D30、005BA8E0、全部独立predicate与15..21context wrappers、005B7560/005D00A0、005B6D00/005CFB70；全部有关switch/vtable数据列为独立范围。004BA1D0只选择8/14必经prefix与epilogue；这不是其完整函数恢复。005B8400仅作下游任务变化证据，完整transitive graph未闭合。

类型getter0067F810=10、00573470=5；004195D0=常量-1。canonical ID getters不做thread identity检测。handler tail在005B6D87/005CFBEB，post-event observer在004BBAD6之后；模型不执行这几个开放闭包，而用stage绑定whole-frame观察或原子拒绝。

PC-PK1.1仍为compatibility-reconstruction；Vanilla独立compatibility-assumption；clean stock/console/真实存档/全局RNG未知。选定字节相等不能把观察替换升级为native执行。
