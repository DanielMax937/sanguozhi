# 规则审计当前状态

更新：2026-10-01。

## A1–E20 主审计已完成；正在清理 exactness gaps

A1–A5、B1–B9、C1–C11、D1–D10、E1–E20 共55个主审计点已经完成写回。

### 最新完成：P0-20 俘虏 forced-release comparator / 选择方向

- [P0-20 正文](55-captive-forced-release-ordering-boundary.md)
- [P0-20 结构化证据](../sources/captive-forced-release-ordering-boundary.json)
- [P0-20 校验脚本](../../scripts/check_captive_forced_release_ordering_boundary.py)
- [P0-7 俘虏释放](42-captive-release-exactness.md)

P0-20 新收敛：

```text
004AA200:
  一次性接收 0058C320 comparator 做列表有序处理

004A8E10:
  每次仅接收 list this/ecx
  不传 person/index/releaseCount
  循环直到 listCount == releaseCount
```

因此可以排除“每轮重新按业务规则任意挑一名俘虏删除”的结构。最终优先级必须由 comparator 排序方向 + 004A8E10 固定删除哪一端联合决定；这两点仍 open。

下一项：P0-21 非自然忠诚：褒赏忠诚增量 caller / RNG 边界。
