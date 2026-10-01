# 规则审计当前状态

更新：2026-10-01。

## A1–E20 主审计已完成；正在清理 exactness gaps

A1–A5、B1–B9、C1–C11、D1–D10、E1–E20 共55个主审计点已经完成写回。

### 最新完成：P0-9 部队编成最终资源事务

- [P0-9 正文](44-troop-resource-transaction-exactness.md)
- [P0-9 结构化证据](../sources/troop-resource-transaction-exactness.json)
- [P0-9 校验脚本](../../scripts/check_troop_resource_transaction_exactness.py)
- [军事/编成主规则](04-military.md)
- [open exactness](13-open-exactness.md)
- [fallback 总表](16-unresolved-rules-fallbacks.md)
- [当前总表](17-post-15-source-audit.md)

P0-9 已把 UI/draft 与真正资源 finalizer 明确分层：

~~~text
sub_647250            battle troop draft
sub_647AC0            battle resource draft
sub_615790/615A10     transport cargo draft
unknown               actual commit finalizer
unknown               return/disband finalizer
~~~

容量方面：

~~~text
battle money 10000
battle food 50000
transport troops 60000
transport money 100000
transport food 500000
transport ordinary equipment quantity 100000 (reverse-history-high)
~~~

据点与 troop 两侧资源 mutation primitives 已恢复，commit/return 的资源守恒语义可高置信实现；真正仍 open 的是原 EXE finalizer 地址、调用顺序、件数型装备路径、伤兵返还和 overflow 逐项处理。

下一项：P0-10 部队主副将关系合成 / FPU 取整边界。
