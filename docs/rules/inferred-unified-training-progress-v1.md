# v3 同一 owner 的 Train、WAR成长和宝物当前五维视图

基线：`fc133845f0cf54504401ed2914a72f0316582b2a`（typed Move及练习图切片已合并）。本批不创建新的平行 world：在已有 mobile v3 新增可选显式 `progressConfig` 能力。旧无该字段的v3根仍按原字段集合验证/输出，不偷偷填默认TP或WAR，不改变旧默认/历史save。未知或混合字段拒绝；Train在未启用扩展时拒绝。

## 创世配置和唯一负责者

createInferredMobileResourceWorld最后新增可选参数progressConfig；对应city timeline creator同样新增可选参数。提供时必须是：

```
{policyId:'inferred-unified-training-progress-v1',
 techniquePoints, techniqueIds:[], drillGround:'none'|'building'|'complete',
 officers:[{id,warBase,warXp}], equipment:[...宝物属性绑定...]}
```

officers与当前city固定名册精确同序、一一；最多32人，warBase0..100，warXp按已合并RULESET cumulative-war-growth-v2经验上限。TP0..10000为新增唯一force进度库存，不复制城市AP/gold。当前WAR每次由原 `derivedWar(warBase,warXp,RULESET.progressionConfig)`推导，不另存另一份可写WAR。base四维来自city facts，merit/acted来自当前city ledger，不能用XP当基础属性。

ruler必须是resource metadata已绑定的synthetic ruler且在该城市名册，不能造第二君主。现profile显式无军事府，与Deploy no-office合同一致；drillGround状态为固定合成声明，不冒充正在建设或完成后的动态设施。当前techniqueIds必须空：旧Train只支持16且其morale cap>100与此bridge域冲突；不静默丢科技/把既有morale夹到100。未来技巧完成须扩大真实共享消费域而非永久另存科技影子。

投影到旧训练GameState的身份0（ruler）/3（其余）、location base/unit、onMission及name=id为明确合成适配，不声称真实人物身份。固定临时RNGseed1只满足旧合法数据形状，Train实际零draw；不写回自然忠诚RNG或产生另一持续随机流。

## Train 已实际消费

外层 typed action `{kind:'Train',officerIds}`，1..3不重复；旧仅计算/规划不算执行的缺口在此接入唯一owner。用实际 `engine.executeCommand` 的 Train 分支与默认adapters，不调用EndTurn。起点来自当前city金/兵/气力/AP、唯一TP/WAR、真实当前角色/预约/行动状态。

选人必须resident、available、未预约、当旬未行动；有生产预约、部署、已城务或返回同旬均拒。城市同旬只训练一次，trainingUsedTurn用同一WorldTick的turn比较恢复；不会再跑旧训练EndTurn回AP或走第二时钟。

成功整笔写回：city morale真实增量、city AP实际扣款、唯一TP真实封顶奖励、各受训者累计WAR XP+2及派生WAR、merit+50（旧上限60000）、city actedTurn与trainingUsedTurn。原calculation/evidence/rngDraws完整保存为收据。任何合法性/域/容量/未来生产完工槽/输出预算失败，整条不返回已局部改变状态。

旧训练引擎支持stat≤100、merit≤60000和其AP/兵上限；已有city事实超过这些域时Train明确拒绝，不降低既有属性/功绩/余额。未启用progress的旧城市场景仍不受此扩展影响。Train现只消费基础WAR成长，不伪造base使旧验证绕过宝物加成。

## T28 当前有效属性视图

`effectiveAttributes`由同一owner当前metadata.items.holder、city四维、当前derived WAR即时计算。equipment绑定按宝物helper：有真实sourceIndex及目录数值则用资料，没有则明确inferredBonuses；多件同属性取最高、cap255。Grant/Confiscate改变持有人后下一读即时变化；Train改变WAR XP后下一读即时变化。不缓存第二baseWar、AP或忠诚，也不把宝物加值写进永久基础能力。

此批**只读有效属性视图已连接真实owner，尚未令宝物加成参与Train或field计略公式**。旧Train强制WAR=base+XP且stat≤100，field当前intelligence仍固定模板；不能把cap255有效属性偷偷夹值或改base骗过旧核。随后须用中性实际计算叶+具名有效属性消费profile接入，不将本批视图当全公式完成。

## 保存与兼容

progressConfig是显式新局初值；进度从同一outer journal全量重演。current progress/effectiveAttributes不能作为输入覆盖，不通过反复重新初始化训练场景清除usedTurn/预约/历史。新能力不回写或重置旧production jobs、fees、startSnapshot、reservations。普通city动作仍立即使用训练扣后的AP和增后的气力；Deploy仍从同一城兵/气力继承，Train不能产生独立单位副本。

不触P078、Closing、真人归属伤亡、零值终结。普通合成Train奖励属于实际旧安全服务，不等于受限战斗结算。仅静态候选，未执行代码/tests/build/typecheck；完整最终候选须独立审阅，不能沿用helper独审代替owner写回审查。
