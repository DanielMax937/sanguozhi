# T09 单支援纯提案 v1

只新增显式 `projectFieldCombatSingleSupportV1(rawScenario, rawCommand, rawSupport)`；旧 execute/preview/save/load API、默认空跨部队关系和旧伤害算式保持。候选依赖已完成D255 actual field-combat-lifecycle，不覆盖并行T07候选；接线时必须合并两个受审增量而非用本文件覆盖其新增函数。

## 输入、输出与唯一所有者

scenario 使用实际 `FieldCombatScenarioV1` 完整当前单位/主副将/技能/技巧/面板/地图/tape；cmd沿既有结构，仅 normal-melee、expectedRevision=0（单次纯提案，不是独立可存账本）。rawSupport精确为：

```
{profile:'inferred-single-support-reaction-core-v1',
 supporterId, relationCase:'spouse'|'sworn'|'supporter-likes-attacker'|'parent-child'|'siblings'}
```

返回 ok/committed:false、完整receipt、projectedSnapshot、support政策信息；失败无任何可提交效果。外层唯一root须从同一当前state生成全部scenario事实，验证immutable配置的攻击主将→支援主将关系、两者同owner、所有成员synthetic身份、两者deployed/available/非away/非预约与同旬acted，不能接收用户任意可写关系或另造场景余额。核内部也验证参与者synthetic ID、同side、主将唯一（既有scenario规则）、supporter不同actor/target、未acted、normal、目标邻接。外层必须整笔提交主击、反击、支援、主food obligation和RNG；任何末端容量失败均不提交。

关系绑定于各部队实际唯一 `relationshipToLeader:'leader'` 成员，而非某副将；本函数不认证历史亲属身份，outer固定synthetic关系配置是具名场景事实。更换主将须使旧关系配置失效，不能继承另一主将关系。

## 真实证据与推断逐项

1. 已归档 `03-personnel.md §4.4` PC-PK1.1参数：配偶/义兄弟50，支援方亲爱攻击方30，血缘20（父子/兄弟有实测）；仅主将、对目标普通可达、兵器不能、连战发动不能、辅佐需嫌恶门。此版关系case单选，不推断重叠关系优先级；只五种陆军普通近接，未扩射程/兵器。辅佐和连战仍按原unsupportedPhysicalSkills拒绝，不能空技能绕过。
2. 原actual physical闭包直接复用：盾牌、会心、resolved panels、当前兵数、training/elite技巧、difficulty和每步floor均原算式。实际完整tech列表与energyCap/chain校验不变，不把研究技巧清空。supporter枪tech1明确拒绝（该支援副作用尚未定义），其他武器保留真实tech。主攻击tech1保持原资格。
3. **具名推断**：主普通攻击与唯一主目标反击全部完成后，尝试最多一次支援；关系失败也消耗支援者acted；不额外扣AP/气力；成功按当时兵数计算一次普通core后floor(core/2)。50/30/20是发生率，不是伤害倍率；半伤不宣称原生。
4. 支援后不执行应射/反击/第二支援，不递归。源码资料支援不触发应射，其他关闭递归为有限推断。护盾挡支援也消耗acted；不会为零伤强加最小1。
5. 支援不得生成独立tech1粮袭。主攻击对目标是否造成兵损在support阶段前取值；主击被盾挡而support造成损失，不能由此伪造主粮袭。主foodRaidRequest仍唯一并交outer原子结算。
6. 任意主击、反击、support导致兵数<=0即整单拒，不能钳1。无Closing/奖励/伤病/真人归属/P078/终结/时钟恢复/资源复制。

## 抽样与重放

实际同一次resolve只用一条有界stage tape：主attack.*→reaction.*→support.0.relation→命中时support.0.shield（适用才有）→support.0.critical（盾挡不抽）。原roll对概率0/100不抽；relation率均在0/100之间所以精确抽一项bound100。支持阶段不复用reaction样本；新export要求全部tape恰好消费，无多余后缀。rawSupport参数和完整draw必须被outer根journal固定重放，不以hash代替事实。

纯提案不调用第二次Attack，不构造另一个“未行动支援战斗”，而在同一次actual resolve闭包访问同一snapshot并复用physical。无支持的旧调用未改变任何receipt字段、抽样或数值；支持trace的半伤标为explicit-simulation-policy。

## 静态交付边界

仅叶子候选，尚非world接入/远端发布/运行通过。外层需固定关系配置、current角色锁、现技能映射、全事务预算及独立审阅；本地未执行代码、测试、typecheck或build。原支援伤害caller、血缘扩展范围、多关系优先级、跨版本与native opcode仍未核。该功能不关闭这些原生证据缺口。

## 当前累计接线状态

以上“尚待world集成”仅指此模块单独交付阶段的能力边界；当前累计本地候选已由[同一world owner](unified-single-support-owner-v3.md)接入固定关系、城市角色锁与唯一粮/field原子提交。模块PASS不代替整批静态审阅、远端发布或运行验收；当前未发布未运行。
