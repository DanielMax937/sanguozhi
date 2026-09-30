# 规则审计当前状态

更新：2026-09-30。

## 最新完成：E12 技巧研究完成功绩

当前逐点审计已写回 A1–A5、B1–B9、C1–C11、D1–D10、E1–E12，共47个审计点。

- [当前总表](17-post-15-source-audit.md)
- [E12 规则正文](27-technique-research-merit.md)
- [E12 结构化证据](../sources/technique-research-merit.json)
- [E12 校验脚本](../../scripts/check_technique_research_merit.py)
- [E11 技巧研究时间](26-technique-research-time.md)

E12 确认“技巧研究完成功绩”存在两套不能直接合并的资料：现行日文 Wiki 功绩主表为 500/1000/2000/3000，而同站小ネタ及2006早期中文攻略为 500/1000/1500/2500。

Lv1=500、Lv2=1000 两边一致；Lv3/Lv4 冲突。繁中 PC-PK1.1 逆向资料能确认研究时间、人才府和“研究能力经验=消费技巧P/100”等相邻规则，但尚未公开恢复研究完成后的功绩 caller/常量。

因此项目现有 [500,1000,2000,3000] 继续只作为兼容候选，证据标签降为 `documented-current-wiki-candidate`，并显式标记 `meritExactness=unresolved`。旧表同时结构化保存；禁止无证据写成“Vanilla旧表、PK新表”，也禁止把旧表的“技巧P/2”算术关系冒充原作公式。

下一项：E13 混乱 / 伪报基础持续与恢复。
