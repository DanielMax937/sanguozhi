# 规则审计当前状态

更新：2026-10-03。

## A1–E20 主审计已完成；正在清理 exactness gaps

A1–A5、B1–B9、C1–C11、D1–D10、E1–E20 共55个主审计点已经完成写回。

### 最新完成：P0-28 `004AF7D0` hard recruitment gate / 关系优先级边界

- [P0-28 正文](63-hard-recruitment-gate-boundary.md)
- [P0-28 结构化证据](../sources/hard-recruitment-gate-boundary.json)
- [P0-28 校验脚本](../../scripts/check_hard_recruitment_gate_boundary.py)
- [P0-1 普通登用概率](36-hiring-probability-exactness.md)

P0-28 新收敛：

```text
004AF7D0..004AFD5F
  = RecruitmentDetermination

return != 0:
  outResult = forced success/fail
  GetRecruitmentSuccess 立即返回

return == 0:
  才进入 005C4F80 success-rate
```

因此厌恶、结义/亲善、禁止仕官期等不是 success-rate modifier，而是真正的 short-circuit hard gate。ForbiddenLord / ForbiddenMonths 也已确认是持久 runtime state。内部关系优先级、忠诚+义理阈值 opcode 与 mode 影响仍 open。

下一项：P0-29 自动封官跨官职 scheduler / candidate construction。



