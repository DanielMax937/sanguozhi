# 规则审计当前状态

更新：2026-10-01。

## A1–E20 主审计已完成；正在清理 exactness gaps

A1–A5、B1–B9、C1–C11、D1–D10、E1–E20 共55个主审计点已经完成写回。

### 最新完成：P0-5 登场 / 自然死亡精确 RNG

- [P0-5 正文](40-debut-death-exactness.md)
- [P0-5 结构化证据](../sources/debut-death-exactness.json)
- [P0-5 校验脚本](../../scripts/check_debut_death_exactness.py)
- [武将主规则](03-personnel.md)
- [回合/月初顺序](00-turn-scenario.md)
- [fallback 总表](16-unresolved-rules-fallbacks.md)
- [当前总表](17-post-15-source-audit.md)

P0-5 已锁定 PC-PK1.1 月初生命周期入口：

```text
00590C30 MonthlyAction
→ month-start gate
→ 005833D0 age/death handler
```

并把登场/寿命 profile 分离为：

```text
Historical debut: YearOfDebut + scenario identity/location
Fictional debut: adult-year gate + randomized location
IgnoreAge: separate scenario bypass
Lifetime: Historical / Longevity / Fictional
```

Longgevity 约+20年、Fictional 约99岁仍只作 compatibility profile；`005833D0 / 0048A000` 函数体、death flag/illness/final-death 时序继续 open。

下一项：P0-6 褒赏 / 欠薪 / 流言等非自然忠诚变动。
