# T09 同一 field roster 的单支援桥

本增量基于 T07 最终 field `dccfa44a94687ca11c8dec7b73558fd999932b4f167e252708af37d56726c357`；保留据点零伤整笔拒及永久 WAR 回执修正。actual kernel 使用已独审单支援源 `482f34f36c99e528fe197aa8ff3420b71a09452dd977fa4ba27c9259de3fe157` 原文，无改公式。

## 私有合同与真实 owner

只在私有 `OuterStep` 增加 `singleSupport:{profile:'inferred-single-support-reaction-core-v1',supporterId,relationCase}`。必须同时是 `fieldAction:{kind:'Attack',actorId,targetId,attackKind:'normal-melee',draws}`。与 siteStrike/null-action、FieldTick、FalseReport、射击不兼容。公开 field execute 仍不能调用 OuterStep；没有新公共关系输入或第二长期战斗账本。

完整 world root 必须以固定 directed `supporterId→attackerId` 单一关系配置选择此 proof，不能将玩家请求的关系作为事实；home 主攻/支援者的 away、预约门在唯一城市 owner 验证。field 不认证历史亲属事实、不保存城市预约状态。完整根重放是这些权限事实的认证边界，私有 field 存档仅为可重放提案，不可当世界授权。

field 从当前唯一 roster 读取主攻/支援/目标的 cell、正兵、气力、acted、condition；从固定 encounter 读独立双方 owner、武器及 resolved panels；从当前 PK/effective 读智魅、技能。支援者必须实际 deployed、available、normal、未行动、同主攻 owner、不同主攻和目标；actual 核继续检查目标邻接和双方资格。居民不会投影成新部队，敌方不得伪装成 home。所有部署角色非 null skillKey 仍明确拒绝，不能静默删除未知被动。实际技巧列表全量传递，研究16的120域、D255读视图不降级；枪支援者含技巧1时 actual 叶明确拒绝未实现支援粮袭，不清空技巧绕过。

## 单次解析与原子写集

中性 helper 在同一当前 scenario 投影内调用一次 `projectFieldCombatSingleSupportV1`，不先执行主击再构造另一次“未行动”Attack。临时 scenario 的 acted/status/current troops 原样传递；不是另一持久余额。正常无支援路径仍调用旧 execute。

同一 tape（最多8项）顺序由 actual 核严格消费：主击→反击→`support.0.relation`→适用的 shield/critical；无 proof 的 support 样本拒绝，所有多余/不足/错序样本拒绝。关系失败也占支援者行动，成功伤害使用 actual 普通核后半伤推断，详见对应 actual 单支援规则。不得将发生率当伤害系数，不递归支援/反击。

完整 patch 只改同一 roster：主攻和支援 acted=true，其他 acted保持；只主攻/目标允许兵数减少，支援及无关角色兵数保持，所有位置/能量/status/count保持。任一零兵/非法写集/预算失败整步失败，无 partial commit。保持外层32命令、完整 genesis+journal、重复ID、save/load全重放与既有总数据预算；不添加额外 Tick。

`Attack` receipt 新增 `singleSupport`，内容精确等于 proof，供 root 核对固定 pair。`combatReceipt` 保存全部实际 trace。只主击 actual 生成的 `pendingFoodRaidRequest` 仍转交一次：支援造成的兵损不制造主粮袭，主击盾挡不能被支援命中替代资格。world 必须以同一 pre-attack 粮快照消费该唯一请求，并将城市/粮/field整体提交；任何食品或末端容量失败全部回滚。不得将提案 committed:false 误认为已写世界。

## 证据、推断、未完成

实际来源与推断逐项见 `inferred-single-support-proposal-v1.md`：50/30/20关系率来自已归档主将规则；主击/反击后的单支援、失败占行动、半伤、额外费用为零为具名有限推断，不声称原生 caller。未知技能、连战、辅佐、多关系优先级、兵器/远射支援、原生支援倍率仍未实现。无真实人物关系/任免/伤病、Closing奖励、P078、归零终结。

这是静态候选，尚待完整 world 集成与独立审阅；未运行测试/typecheck/build/候选，未远端发布。旧无 proof 默认不引入支持事件，也不改变原伤害公式。

## 当前累计接线状态

以上“尚待world集成”仅指此模块单独交付阶段的能力边界；当前累计本地候选已由[同一world owner](unified-single-support-owner-v3.md)接入固定关系、城市角色锁与唯一粮/field原子提交。模块PASS不代替整批静态审阅、远端发布或运行验收；当前未发布未运行。
