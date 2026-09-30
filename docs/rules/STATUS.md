# 规则审计当前状态

更新：2026-09-30。

## 最新完成：E8 技巧补丁版本差异

当前逐点审计已写回 A1–A5、B1–B9、C1–C11、D1–D10、E1–E8，共43个审计点。

- [当前总表](17-post-15-source-audit.md)
- [E8 规则正文](23-technique-patch-differences.md)
- [E8 结构化版本差异](../sources/technique-version-deltas.json)
- [E8 校验脚本](../../scripts/check_technique_patch_profiles.py)
- [E7 技巧系统](22-techniques.md)

E8 已确认官方 Vanilla 与 PK 是两条独立更新链。Vanilla Ver1.0→后期资料有7条明确技巧差异，但官方changelog没有逐项说明它们分别在哪个补丁改变，因此 transition patch 继续标 unknown，不能一律写成“Ver1.2修改”。

PK1.1 工兵育成已从原函数闭合：内政设施相对恢复×2，城市/港/关×2.5。爆药炼成在研究目标PC二进制中存在“判定被烧方而非点火方”的原BUG；社区修复必须放入独立 fixProfile，不能冒充官方规则。矢盾/大盾挡战法也属于社区patch。

推荐版本键至少包含 rulesetVersion + patchVersion + fixProfile。

下一项：E9 兵粮袭击。

## 证据边界

仍缺 Vanilla 1.0/1.1/1.2 EXE 技巧地址diff、戟/弩/骑Lv1的Ver1.0明确倍率、Vanilla 1.0工兵育成内部双支路、爆药BUG的地区版官方修复情况，以及主机版逐项技巧差异。
