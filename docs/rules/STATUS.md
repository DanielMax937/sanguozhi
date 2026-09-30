# 规则审计当前状态

更新：2026-09-30。

## 最新完成：E13 混乱 / 伪报持续与恢复

当前逐点审计已写回 A1–A5、B1–B9、C1–C11、D1–D10、E1–E13，共48个审计点。

- [当前总表](17-post-15-source-audit.md)
- [E13 规则正文](28-status-duration-recovery.md)
- [E13 结构化证据](../sources/status-duration-recovery.json)
- [E13 校验脚本](../../scripts/check_status_duration_recovery.py)
- [E12 技巧研究完成功绩](27-technique-research-merit.md)

E13 已确认 PC-PK1.1 的混乱/伪报自然恢复不是“每旬按概率清醒”，而是独立剩余计数的确定性倒计时。

原函数 `00599B90` 确认：先执行本旬异常行为并标记已行动，再减少剩余计数；普通位置每旬 -1，在本势力合资格阵/砦/城塞有效范围内每旬 -2，最低钳到0，计数到0立即恢复正常。恢复过程中不读取智力、性格、兵种或随机数。

少兵自动混乱路径的初始计数也已源码确认是 `GetRandomX(2)+1`，即1或2。但普通计略的伪报 `005917D0` 与扰乱 `00591A20` 仍缺内部 duration 生成函数，因此普通/会心的精确初始分布保持 open；会心至少2回合是当前稳定攻略边界。

工程 fallback 的70/30持续分布仅作为 `provisional-engine-rule`，不冒充原作。

下一项：E14 单挑连续公式。
