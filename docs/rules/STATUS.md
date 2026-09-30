# 规则审计当前状态

更新：2026-10-01。

## 最新完成：E19 评定完整提案池

当前逐点审计已写回 A1–A5、B1–B9、C1–C11、D1–D10、E1–E19，共54个审计点。

- [当前总表](17-post-15-source-audit.md)
- [E19 规则正文](34-council-proposal-pool.md)
- [E19 结构化证据](../sources/council-proposal-pool.json)
- [E19 校验脚本](../../scripts/check_council_proposal_pool.py)
- [君主/军团主规则](08-ruler-corps.md)
- [E18 普通君主继承](33-ruler-succession-priority.md)

E19 已关闭“评定具体提案池未知”这一静态问题。

原版专用君主评定 MSG 段恢复出22类具体案：内政/人事/城市9类、出阵/军事3类、外交・计略10类。评定是“方针→采决→具体案→采决→执行”的两阶段结构；参与者可赞同他人，君主可采纳一个、部分、全部，或全部否决/中止。

官方手册确认评定本身0金、0行动力、最多6人参加，君主必须在据点。同期资料记录评定+10技巧P。

旧 fallback 中的“技巧研究、输送、褒赏”不再列入评定提案池。

仍 open 的是 proposal chooser：武将为何提某一案、隐藏属性/五维是否参与、参与者过滤、额外 availability gate、多案执行顺序以及采纳案资源/AP调用链。

下一项：E20 委任 AI 权重。
