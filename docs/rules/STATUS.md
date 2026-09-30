# 规则审计当前状态

更新：2026-09-30。

## 最新完成：E10 应射

当前逐点审计已写回 A1–A5、B1–B9、C1–C11、D1–D10、E1–E10，共45个审计点。

- [当前总表](17-post-15-source-audit.md)
- [E10 规则正文](25-response-fire.md)
- [E10 结构化证据](../sources/response-fire.json)
- [E10 兼容规则校验](../../scripts/check_response_fire.py)
- [E9 兵粮袭击](24-food-raid.md)

E10 已定位 PC-PK1.1 技巧ID9入口 `00584DC8`。高置信规则：应射主体是弩兵，触发箭类普通攻击/战法；必须满足正常射程和地形合法性；支援攻击不触发；混乱/伪报不能正常应射；火矢是明确可被应射反击的战法。

历史实测还确认超射程、森林非法目标会阻止应射，PCPK急袭可50%规避应射伤害。PS2PK双方应射+连战存在长链，但PC调用顺序/最大深度仍open。

完整00584DC8 caller、内部attack-type/unit-type比较值、水上active profile和各战法primary/collateral细分继续open。

下一项：E11 技巧研究时间。
