# 规则审计当前状态

更新：2026-10-01。

## A1–E20 主审计已完成；正在清理 exactness gaps

A1–A5、B1–B9、C1–C11、D1–D10、E1–E20 共55个主审计点已经完成写回。

### 最新完成：P0-7 俘虏资金不足释放 / 主动释放

- [P0-7 正文](42-captive-release-exactness.md)
- [P0-7 结构化证据](../sources/captive-release-exactness.json)
- [P0-7 校验脚本](../../scripts/check_captive_release_exactness.py)
- [武将/俘虏主规则](03-personnel.md)
- [open exactness](13-open-exactness.md)
- [fallback 总表](16-unresolved-rules-fallbacks.md)
- [当前总表](17-post-15-source-audit.md)

P0-7 已把资金不足释放收紧为：

```text
releaseCount =
  max(0, prisonerCount - floor(gold/50))

0058C320 comparator
→ 004AA200
→ 004A8E10 裁剪到 releaseCount
→ 0058D1D0
→ 所有据点结束后 0058D430
```

所以释放人数与处理架构已 exact；真正剩下的是 **0058C320 按什么排序**以及 finalizer side effect。

主动“追放”释放敌俘增加技巧P为官方 confirmed，但 exact 点数仍open；社区“约+3”只作 fallback。主动释放是否必定写3个月禁仕存在互相矛盾的玩家资料，已改为 route/version conflict，不再冒充确定规则。

下一项：P0-8 官职自动分配资格 / candidate selector / tie-break。
