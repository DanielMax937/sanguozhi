# 规则审计当前状态

更新：2026-10-01。

## A1–E20 主审计已完成；正在清理 exactness gaps

A1–A5、B1–B9、C1–C11、D1–D10、E1–E20 共55个主审计点已经完成写回。

### 最新完成：P0-10 部队主副将关系合成 / FPU 取整

- [P0-10 正文](45-deputy-rounding-exactness.md)
- [P0-10 结构化证据](../sources/deputy-rounding-exactness.json)
- [P0-10 校验脚本](../../scripts/check_deputy_rounding_exactness.py)
- [军事/部队能力主规则](04-military.md)
- [单位面板专项](18-unit-panels.md)
- [耗粮专项](20-food-consumption.md)
- [open exactness](13-open-exactness.md)
- [当前总表](17-post-15-source-audit.md)

P0-10 最大的新闭合：

~~~text
00707A74
= MSVC _ftol2
= truncate toward zero

对正常正值：
= floor
~~~

因此 E2/E3攻防建设和 E5耗粮里重复存在的最终 rounding gap 已关闭。

关系层：

~~~text
普通  /4  PC opcode exact
亲爱  /2  PC opcode exact
夫妻/义兄弟 full-share PC-high + PS2-exact
血缘  /3  cross-platform-high，PC opcode仍open
~~~

两副将分别算 candidate 后取最大，不叠加。

下一项：P0-11 训练资格 gate / 已训练 reset / 野外气力恢复 caller。
