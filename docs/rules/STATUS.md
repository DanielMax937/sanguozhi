# 规则审计当前状态

更新：2026-10-01。

## 最新完成：E20 委任 AI 权重 / 决策架构

当前逐点审计已写回 A1–A5、B1–B9、C1–C11、D1–D10、E1–E20，共55个审计点。

- [当前总表](17-post-15-source-audit.md)
- [E20 规则正文](35-delegated-ai-architecture.md)
- [E20 结构化证据](../sources/delegated-ai-architecture.json)
- [E20 校验脚本](../../scripts/check_delegated_ai_architecture.py)
- [君主/军团主规则](08-ruler-corps.md)
- [E19 评定提案池](34-council-proposal-pool.md)

E20 已撤回“委任/COM AI 应该存在一张全局 action utility 权重表”的错误前提。

PC-PK1.1 已恢复的是 procedural/modular 架构：COM军团与玩家委任野外部队最终共享 `005AD980` 战术行动 core；`005EF440` 出兵策略读取 difficulty、君主野望、StrategicTendency、城市/目标态势及资源，经过 hard gate 后才进入5～100概率层；`005F6CF0` 则是“已决定兵装后选择主将”的局部评分器。

出兵关键常量包括：计划兵力最低5000、80/90治安 gate、`travelTime*5+15` 兵粮 horizon、携粮上限50000、粮不足 abort、普通非兵器部队的携金75%/50%规则，以及冲车90%、井阑/木兽/投石80%的编成概率。

AI势力强度还存在君主ID硬编码 bonus，因此不能用一套纯资源 utility 冒充原作。

当前 A1～E20 共55个逐点审计项已全部完成。剩余工作转为各项内部 exactness gap 与静态数据补全，不再新增一个“E21统一权重表”之类的伪问题。
