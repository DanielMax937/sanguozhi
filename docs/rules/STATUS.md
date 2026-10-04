# 规则审计当前状态

更新：2026-10-04 UTC。

## 最新完成：P0-47训练生命周期与source审计

[实现指南](../engine/pk-training-lifecycle.md) · [来源审计](82-training-lifecycle-source-profile.md) · [结构化证据](../sources/training-lifecycle-source-profile.json)。本组从main `56f1aa4ad9cf2bff5612b1777e16dc54be0cdefb`的新分支开发。

训练资格与独立身份/位置/任务状态、行动重置、可替换旬phase plan、累计WAR经验成长、v2存档与显式v1状态迁移已完成。XP0..3000累计，不在每次+1时扣100；普通合成能力clamp1..100。默认满气力拒绝，但EndTurn可继续；十年360旬全trace/seed/save/replay回归通过。

S1来源中`005C4100/005B8320/005B80F0`、XP writer/getter、研究共享XP、reset全局遍历及非连续tails、`0059C330→0059C2A0→0059A230`野外气力tail-xref现已恢复。S1/S2两个IDB均关联MOD，且S2的XP/能力cap确有不同；不能将source字节升级为stock PC-PK1.1。

原作证据债继续保留：独立clean stock对照、完整scheduler/AP时序、任务与属性全链、全局RNG、Vanilla/PS2/Wii。此切片仍无AI/经济/战斗/派遣等完整游戏系统，也不关闭下面P0-46剩余capture缺口。

验证：TypeScript检查与85个Node测试通过；全部66个`check_*.py`通过；两个demo及growth-fixture CLI通过；26个函数/尾块fingerprint、11个opcode断言、8组S1/S2对照、24,008条成长不变量通过。独立代码审阅无未修阻断。既有`check_techniques.py`只修3处字面\n语法错误，保留全部规则断言与merit unresolved标记。

## A1–E20 主审计已完成；正在清理 exactness gaps

A1–A5、B1–B9、C1–C11、D1–D10、E1–E20 共55个主审计点已经完成写回。

### 最新完成：P0-46 据点陷落 caller / 内政设施 selector 来源审计

- [P0-46 正文](81-capture-selector-source-profile.md)
- [P0-46 结构化证据](../sources/capture-selector-source-profile.json)
- [机器码摘录](../sources/capture-selector-source-profile/capture-selector.asm.txt)
- [参考模型](../../scripts/capture_selector_profile.py) 与 [校验](../../scripts/check_capture_selector_profile.py)
- [攻城主规则](05-combat.md)

本轮恢复 `004B2CA0..004B36FF`（末尾不含）的 body、三处直接 caller、city-only gate、全局链表候选顺序、完成状态/type30/30容量边界、魅力 getter、保留 quota、RNG 和销毁前缀。`004B329B` 是该函数内的资源段，不能因它不是 selector 就排除整个 containing function。

来源算法为 `keep=min(n,floor(max(20,charm)/20))`；无硬性5上限。n>1时逐项做 n 次全范围随机交换，即使全部保留或最终全毁也消耗 n 次 RNG。新势力ID超出0..41时，在 shuffle 后改为全毁。完成铜雀台在普通候选之外；总保留数不等于 quota。算法不是均匀 Fisher–Yates。

**原性边界：** 公开 IDB 记录的输入位于“血色5.0公测”目录。本轮 `opcode-exact` 只绑定其 source profile/hash，`stockOriginalVerified=false`。stock PC-PK1.1 采用时是 `compatibility-reconstruction`；Vanilla 必须另标 `compatibility-assumption`；PS2/Wii 独立 open。

附带恢复的晚期耐久块把当时耐久补到 `floor(maxAtTail/2)` 下限，高于则不降低。此前 finalizer 仍有未审副作用，不能推导完整 preCapture→postCapture 公式或宣布所有陷落模式一致。

参考模型只接收已资格化、有序候选并返回计划/trace，提供注入draw、工程seed和已给定状态的来源LCG三种模式。校验通过不等于原EXE/存档回归，也不等于完整候选/事务引擎已实现。

下一步：clean stock build 对照、剩余 caller/cause 与 finalizer、全局 RNG/存档验证；按可定位缺口推进，不预设固定 P0 终点。P0-44/45保留为历史证据，当前 selector 结论以P0-46的限定范围为准。

历史基线曾为65项中64项通过，唯一技巧脚本SyntaxError现已作语法修复；不代表技巧研究证据债关闭。
