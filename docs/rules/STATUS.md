# 规则审计当前状态

更新：2026-10-03。

## A1–E20 主审计已完成；正在清理 exactness gaps

A1–A5、B1–B9、C1–C11、D1–D10、E1–E20 共55个主审计点已经完成写回。

### 最新完成：P0-39 火焰寿命 base RNG / setter 候选边界

- [P0-39 正文](74-fire-lifetime-rng-setter-candidate-boundary.md)
- [P0-39 结构化证据](../sources/fire-lifetime-rng-setter-candidate-boundary.json)
- [P0-39 校验脚本](../../scripts/check_fire_lifetime_rng_setter_candidate_boundary.py)
- [P0-18 火焰寿命 setter](53-fire-lifetime-setter-boundary.md)

P0-39 新收敛：

```text
00486320..004863BF
  = facility fire-state query

00495CA0..00495CDF
  = troop fire-state query
```

这两个 query 都很短，只支持“是否着火”读取，不支持把它们当 lifetime setter。真正 setter 的搜索范围进一步限定到成功点火执行链：`005AECxx` 火计、`005B12xx` 火计/火矢、`005B16xx~005B17xx` 火陷阱；但当前仍无完整 body/xref。base RNG、重复点火语义、critical +1 opcode order 都继续 open。

下一项：P0-40 应射/还射完整 caller / 连击递归深度边界。














