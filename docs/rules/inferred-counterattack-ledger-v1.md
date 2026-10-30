# T32：正值反击延续账本 v1

消费已有 `projectInferredGovernorCounterattack`：`floor(baseDamage*(100+max(governorWar-65,0))/100)`，保留 [推断请求](inferred-combat-requests-v1.md) 的非原生身份。不伪称此倍率/阈值已获原函数证实。

初始输入必须是完整有效的 [合成正值损耗账本](inferred-positive-hazard-ledger-v1.md)，由旧read全重放；延续保存其历史而不修改旧账本。新命令严格id、expectedRevision、targetId、baseDamage1..100万、governorWar0..100、eligibilityConfirmed:true。合成ID、唯一命令、连续revision，上限256条；只接受troop目标。明确输入baseDamage是本次合成反击的基数，不先额外扣一次普攻、也不从已有血量倒推实际战斗。

调用旧请求后伤害必须小于当前兵力，否则整条拒绝；成功实际减少延续账本兵力并写before/after回执，不处理归零、死亡、俘虏、占领、真实武将、功绩或Closing。资格由caller明示，不自动扫描太守/城市/反击范围。已建成港关修复是另一独立入口，不把此反击写入那份耐久账本。

新schema仅initialHazard+commands，完整重放得到余额，旧保存不覆写。read/execute/save/load使用descriptor隔离，拒循环/accessor/稀疏/自定义原型，公共入口捕获异常；Node可用时拒Proxy，其他runtime只接可信普通数据。允许200000字符保存及有界双层journal，不是原始字节签名；JSON.parse重复键last-wins。新旧revision各自独立，不声称全局融合或旧historical事件再次执行。

未执行测试/typecheck/build或候选；静态验收核旧公式参数、无双扣、严格正值、ID/revision及全重放，运行验收仍未完成。
