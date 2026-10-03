# 规则审计当前状态

更新：2026-10-03。

## A1–E20 主审计已完成；正在清理 exactness gaps

A1–A5、B1–B9、C1–C11、D1–D10、E1–E20 共55个主审计点已经完成写回。

### 最新完成：P0-31 `005FA650` office classifier / 第81内部官职边界

- [P0-31 正文](66-office-classifier-entry80-boundary.md)
- [P0-31 结构化证据](../sources/office-classifier-entry80-boundary.json)
- [P0-31 校验脚本](../../scripts/check_office_classifier_entry80_boundary.py)
- [P0-8 自动官职 selector](43-auto-office-selector-exactness.md)

P0-31 新收敛：

```text
005FA650..005FA6DF
  = office classifier

struct_office_ARRAY:
  count = 81
  struct size = 0x3C
  index 80 确实存在
```

因此第81项不是文档推导出来的虚构项，而是原程序真实数组成员。已命名0..79官职的 top-civil / military / civil 分类模式继续保持 reverse-inferred-high；但由于缺 `005FA650` body 和 index80 实际字段 dump，第81项的名称、用途、classifier result 与 scheduler 是否使用都继续 open。

下一项：P0-32 部队资源事务 finalizer / commit-return 边界。






