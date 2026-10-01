# 规则审计当前状态

更新：2026-10-01。

## A1–E20 主审计已完成；正在清理 exactness gaps

A1–A5、B1–B9、C1–C11、D1–D10、E1–E20 共55个主审计点已经完成写回。

当前不新增 E21；后续按 [open exactness](13-open-exactness.md) 逐项清理剩余真实缺口。

### 最新完成：P0-2 外交公式的版本边界

- [P0-2 正文](37-diplomacy-version-boundaries.md)
- [P0-2 结构化证据](../sources/diplomacy-version-boundaries.json)
- [P0-2 校验脚本](../../scripts/check_diplomacy_version_boundaries.py)
- [外交主规则](07-diplomacy.md)
- [当前总表](17-post-15-source-audit.md)

本轮解决的是**版本边界**，不是伪造各版本未知常量。

官方补丁记录确认：

```text
Vanilla 1.1：
友好增减平衡调整

Vanilla 1.2：
友好增减再次调整
+ 计略/外交成功率调整

Vanilla 1.3～1.3.3：
公开changelog未再列外交专项变化
```

PK 新增“超级”难度；现有完整外交公式 corpus 含初级1.0 / 上级0.8 / 超级0.7，因此正确标签是 `pk-era-formula-corpus`，不能无版本覆盖 Vanilla。

当前 profile：

```text
vanilla-pc-1.0
vanilla-pc-1.1
vanilla-pc-1.2-plus
pk-pc-formula-corpus
pk-pc-reverse-support
console-separate-open
```

Vanilla 如果为了模拟闭环复用 PK 公式，必须显式 `compatibilityAssumption=true`。

PK1.1/1.1.1 官方 changelog 没有外交专项变化，但这不等于二进制确认相同。外交府仍只确认 AP减半与亲善金减半，不增加外交成功率。

仍 open：Vanilla 各阶段 exact constants、PK formula corpus exact build、late Vanilla/PK共享范围、主机版与原EXE公式入口。

下一项：P0-3 攻城统一公式与据点接管资源。
