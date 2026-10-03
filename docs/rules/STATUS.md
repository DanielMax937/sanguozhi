# 规则审计当前状态

更新：2026-10-01。

## A1–E20 主审计已完成；正在清理 exactness gaps

A1–A5、B1–B9、C1–C11、D1–D10、E1–E20 共55个主审计点已经完成写回。

### 最新完成：P0-17 应射 caller / attack-type 与连战边界

- [P0-17 正文](52-response-fire-double-strike-exactness.md)
- [P0-17 结构化证据](../sources/response-fire-double-strike-exactness.json)
- [P0-17 校验脚本](../../scripts/check_response_fire_double_strike_exactness.py)
- [E10 应射](25-response-fire.md)

P0-17 新收敛：

```text
00586E12:
  对弩兵(3)间接攻击时
  主动方连击无效

00586F0F:
  连击50%
  战法失败后的普通攻击仍可连击
  支援攻击不对应连击
```

历史实测同时确认应射本身可以触发防守方连击，因此“主动方连击”和“应射方连击”必须拆成两条不同方向的 gate。完整 `00584DC8` caller、是否显式检查 technique9、PC递归终止仍 open。

下一项：P0-18 火焰寿命 setter / 重复点火刷新边界。
