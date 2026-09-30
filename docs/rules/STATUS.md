# 规则审计当前状态

更新：2026-09-30。

## 最新完成：E14 单挑连续公式

当前逐点审计已写回 A1–A5、B1–B9、C1–C11、D1–D10、E1–E14，共49个审计点。

- [当前总表](17-post-15-source-audit.md)
- [E14 规则正文](29-duel-continuous-formulas.md)
- [E14 结构化证据](../sources/duel-continuous-core.json)
- [E14 校验脚本](../../scripts/check_duel_continuous_core.py)
- [单挑主规则](10-duel.md)
- [E13 混乱 / 伪报持续与恢复](28-status-duration-recovery.md)

E14 已关闭“单挑通用连续公式未知”这一 open 项。

PC-PK 导向通用核心使用双方伤病修正后的武力，通过非线性 `duelScore` 和双方 score² 占比计算 `actionRatio(1..99)`。同武力 ratio=50；100/95 得55，而80/75只有52，因此同样武力差5也会产生不同伤害。

在此基础上，方针静态表继续决定命中、格挡、攻击、被击修正和斗志增长；Hit/Dodge/Block 三态、普通伤害、格挡减伤、攻击重视3～4连击、通用必杀伤害以及斗志增长均已恢复。

直接 SIRE 地址 `005097C3 / 005097EB` 的原字节 `6B C0 64 99 F7 F9` 对应 `100×分子/分母` 的整数比值步骤，与 C++ 逆向翻译的 actionRatio 末端相吻合。Wiki 的同武力12/7/10以及100/95与80/75同差不同伤害也完成交叉验证。

本轮还确认剑使斗志增长 `×3/2`，旧“剑系数未知”撤回。

仍 open 的主要是特定人物隐藏补正原硬编码，以及 Vanilla/PS2/Wii 的逐平台公式差异。

下一项：E15 舌战普通牌心理伤害。
