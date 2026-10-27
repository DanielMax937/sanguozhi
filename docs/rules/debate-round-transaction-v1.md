# 有界单回合：受检出牌 → 攻击效果 → 愤怒衔接／终局分类

[完整API](../engine/debate-round-transaction-v1.md) · [实现](../../packages/engine/src/debate-round-transaction.ts) · [来源映射](../sources/debate-round-transaction-v1.json) · [纸面案例](../../data/scenarios/debate-round-transaction-paper-v1.json)

## 补齐的问题

PR125已有给定选择计划到Attack前的受检出牌；PR127已有Attack→Effect→CalcWinner；PR126已有愤怒与条件回合衔接；PR128已有CanCritical与明确追击/留情到winType。本批把这些现有独立核按单轮数据事务组合，不让调用者在半轮成功后误提交手牌、把旧HP/压力覆盖回去、用combo攻击者替代普通攻击者或在终局后补牌。只闭合明确检查点到下一检查点，不是完整游戏会话。

## 来源支持与工程选择分层

固定现代C#仓库 [tankyc/sango_infinity@a0d8a4f](https://github.com/tankyc/sango_infinity/tree/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef)，不是原生PK或Vanilla验证。

- [DebatePhase.cs L397–420](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/DebatePhase.cs#L397-L420)：Attack后Effect，再CalcWinner；已终局按CanCritical进入Critical或Closing，否则进入Anger。不可因Attack先致死就跳过Effect，也不可继续愤怒。
- [原出牌事务规则](debate-checked-play-v1.md)：实际移除/再考/重选/攻击方查询由PR125复用。每次选择的可用性gate是其明确工程策略；不是源PlayPhase调用IsCardAvailable的事实。
- [攻击效果规则](debate-attack-effect-v1.md)：伤害/压力钳制、平局、反射、效果顺序及判胜由PR127负责，不复制第二套公式。
- [愤怒衔接规则](debate-anger-transition-v1.md)：两次愤怒和条件TurnEnd→TurnStart原样复用；首轮终局不做第二轮/崩坏，次轮终局保留崩坏但不衔接；非终局才递减计时、调整先手话题和补牌。
- [终局分类规则](debate-terminal-classification-v1.md)：显式供应选择映射0→1、1→2，非会心保持Normal；只到Closing之前，不执行后果。

外层新的闭合schema、安全分离、最大预算、一次原子提交、完整收据、choice和未用draw拒绝，以及交集域topic0..2/满ready-hand/非教程generic/初始正HP/inactive combo，都是明确工程合同，不是来源多了一组规则或原生前史已被认证。

## 每一字段的唯一权威

|字段|首次来源|更新权威／限制|
|---|---|---|
|普通attacker|PR125真正返回|一直独立于combo.attacker，PR126衔接使用原普通值|
|playedCard|PR125最终非再考牌|愤怒后仍携带直到原TurnStart清除，连打末牌不能替换|
|hand/quota/cardTape/cursor|PR125出牌/再考实际结果|PR126实际移牌/补牌/恢复覆盖；不把初始手牌/游标盖回来|
|hp/stress|初始供应，随后PR127全部效果后|PR126接收PR127输出，返回后其state为权威|
|strength/resolvedAttack|调用者显式已解析|不自动读取人物/书籍/装备/hook；resolvedAttack只携带本轮值|
|timer/crumbled/levels/combo|初始供应与原组件|PR126完整结果为准，终局不额外递减/清除/恢复|
|firstTeam/currentTopic|本轮输入|普通分支和PR126依源顺序更新，不从combo攻击者猜先手|
|critical/winType|显式初始−1/Normal0|终局时PR128唯一写入；非终局仍初值且choice须空|

初始活动可出牌槽须满，非0出牌一定腾出至少一槽；再考还会消费当前牌堆容量−1项后再出牌。因此本组合比单独PR126“已经无空槽可cursor18”域更窄：不能由此前满手推断后续无需补牌。当前牌堆实际不足就整笔失败，不再生成，不消费对手牌带、不回绕。终局则不要求补回已移除牌，cursor18仍可能合法完成。

## 终局与未用输入

所有载荷先安全分离和完整语法/字段域检查，再调用实际核，不调用假想分支作为validator。Attack终局必须同时满足所有后续draw为空；仅终局门槛满足时允许显式choice。未终局不能预存choice用于未来回合。愤怒内终局的未用pass/话题/补牌draw维持原组件拒绝。抽样不是建议列表，不以默默丢弃实现“成功”。

无论后手出牌失败、后续伤害抽样不符、愤怒后补牌耗尽，或最后分类缺choice，均不返回前段成功state/receipt，外部只能提交整笔成功的最终state。输入/调用者和旧核不改；失败原因可追踪到依赖阶段，但不泄漏可被误提交的半回合结果。

## 不包括什么

不增加完整phase/step调度、无效选择等待循环、AI/UI、整场生成/牌堆再生成、全局RNG、永久牌身份、保存/重放/长会话、人物/书籍有效属性解析、非恒等hook、教程、旧九会话适配。Closing、ParamSetWinner、奖励/伤害后果/人物势力任务归属外交世界写入及P078所有依赖继续排除；不是清空所有独立缺口，更不是全部原作验证通过。

仅静态文本阅读、人工纸面推导及字节身份核对；未运行测试、编译、typecheck、build、validator、checker、候选、来源、场景或replay。代码存在及静态审阅不证明运行正确。现代C#参考及显式工程组合不是原生PK／Vanilla等价，43证据主题／45历史快照不减。P078及全部依赖、Closing奖励受伤世界写入均排除。
