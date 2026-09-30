# 规则审计当前状态

更新：2026-09-30。

## 最新完成：E9 兵粮袭击

当前逐点审计已写回 A1–A5、B1–B9、C1–C11、D1–D10、E1–E9，共44个审计点。

- [当前总表](17-post-15-source-audit.md)
- [E9 规则正文](24-food-raid.md)
- [E9 结构化证据](../sources/food-raid.json)
- [E9 参考校验脚本](../../scripts/check_food_raid.py)
- [E8 技巧补丁版本差异](23-technique-patch-differences.md)

E9 已确认 PC-PK1.1 在部队攻击结果链的 `005B03F9` 调用 `005ADB20`：只对部队目标，普通攻击/战法共用；反击分支明确跳过兵粮袭击。

数量主模型由长期技术详解和现代实测交叉确认：`min(攻击面板×R, floor(己方兵力/2))`，R位于1～2。原 `005ADB20` 函数体尚未公开，所以RNG粒度、目标缺粮/攻方满粮裁剪、盾类零伤害、支援攻击与水上profile仍open。

兼容fallback采用10～20整数档并标 `compatibility-reconstruction`，不能冒充原EXE。连击两次抢粮保持 empirical-high。

下一项：E10 应射。

## 证据边界

E9 已把“是否触发/哪些主路径触发”和数量范围从泛攻略升级到源码调用+多来源交叉；真正未闭合的是 `005ADB20` 内部RNG和资源边界。
