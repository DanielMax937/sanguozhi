# T02：具名合成计略效果账本 v1

模块 `inferred-strategy-effects.ts` 是显式opt-in练习账本；来源边界继承 [推断命中请求](inferred-combat-requests-v1.md)。已实际读取该请求及规则，火/伏兵/同讨旧基数曾撤回原生证据等级，本新服务不会将它们恢复成原作事实。

## 资料和新推断分开

命中只调用已有 `decideInferredStrategyHit`：伏兵60、内讧40、妖术30基数，加智力差/2、5..95门；免疫优先必中，美人不作用妖术。这是旧具名工程设计，不是原生概率。原作完整伏兵/内讧伤害、妖术目标/持续caller未读得，以下**新增替代效果完全是工程选择**：

- ambush：成功使显式单目标扣300兵。固定小额用来闭合一次突袭正值结算，不声称原作公式，不附会心/位移。
- discord：成功使显式两个不同目标各扣150兵，作为合成双方互相消耗。两笔合计300，避免把群体效果简单复制成更大输出；不是原作单位互攻规则，不调用普通攻击、反击或关系resolver。
- sorcery：成功使显式1..3目标 `confusedTurns=1`；不扣兵。选择短时控制与上述两种伤害区分，不把所有计略都写成混乱。目标数量、固定1回合均是本policy设计。

所有被扣兵目标必须留下严格正值；任何一个会归零/负数，整条失败、其他目标不提交。没有击破、死亡、俘虏、人物归属、功绩、Closing/P078结果。未命中仍写入命令journal，推进revision，便于拒绝相同命令ID重发；不改变目标值。

## 实际状态与命令

`createInferredStrategyEffects(initial)` 接受1..64个合成单位：唯一 `synthetic-[a-z0-9-]{1,48}` id、troops1..100万、confusedTurns0或1、acted布尔。没有原武将、阵营、地图、真实归属字段。

`executeInferredStrategyEffects(state, command)` 三类严格命令：

1. cast：id/expectedRevision/strategy/targets/intelligence/targetIntelligence/roll/immune/guaranteed/beautyBonus/eligibilityConfirmed:true。strategy仅上述三种；targets唯一、数量匹配；智力0..100、roll0..99。多目标采用同一显式目标智力和一次组判定，所有目标共同免疫/必中标志由caller确认，**不模拟每目标独立roll或属性resolver**。名单存在性先检查；资格为调用方确认，不能把任意真实人物直接当合成单位。
2. advance：id/expectedRevision，合成turn+1，所有单位confusedTurns减1至0，acted恢复false。不是原作旬/日期，也不推进其他服务。
3. act：id/expectedRevision/targetId，目标必须未行动且不混乱；成功将acted=true。因此妖术效果有实际行动门，并可随advance恢复，不只是UI标记。

cast不代表某一个目标单位自身发起，所以不读取其acted作为caster资格，不扣caster AP/气力、不消耗caster行动。调用方应另行明确施计者尝试合同；不能把本练习账本冒充完整战役施计命令。混乱不会阻止别人向其再次施计；重复妖术刷新到1，不叠加时长。

## 原子、保存、兼容

状态严格只有schema、initial、commands。read/execute/save/load从初值完整重放，命令ID唯一、revision连续，最多256条；每条记录before/after/命中判定/效果/turn。保存只含初值和命令，回执由重放得出，不信任外部余额。命令失败不修改输入，调用方保留旧状态；非法历史整体拒绝，无部分输出。

输入经有界descriptor复制，拒accessor/symbol/循环/稀疏/额外数组属性/自定义原型。Node支持时拒Proxy，其他runtime不能保证反射trap无副作用，故只接可信普通数据。JSON文本限100万字符（save也核同上限），标准JSON.parse重复键last-wins；不宣称原字节唯一、防作弊或原历史认证。

旧hazard默认/状态/存档完全不改；本混乱是独立0/1计数，不冒用旧hazard的持续/恢复policy。原空格火计适配仍是单独入口，不能将两者随机源/时钟/资源说成融合。所有新值和群体判定均可由新具名policy替换，不回写旧profile。只静态审阅，无执行代码/测试/typecheck/build，运行验收未完成。
