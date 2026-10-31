# G 部署军粮、逐旬消耗、食粮补给与 T21 袭粮叶子

只读研究基线 `f132870bb58505acd0572c23e3ba91592eefa849`；当前owner接口还核对了本地 `san11-pk-field-consumer-20261030/candidate/.../inferred-cultivated-mobile-field.ts` 草稿（不是声称已发布）。本目录纯leaf候选，不修改共同core、没有远端写、未执行代码/tests/typecheck/build。**owner实际接入并通过独审前不称闭环完成。**

## 唯一确定 API

`planSyntheticFieldFood(context,action)`，raw参数完整有界detach/字段验证后仅返回 foodPatches+receipt，不保存另一state。

```
context = {
 city:{id,ownerId,food,foodCapacity},
 allocations:[{actorId,food,foodCapacity:50000}],
 actors:[{id,ownerId,role:'resident'|'deployed',cellId,troops,politics}],
 transports:[{id,ownerId,cellId,food,foodCapacity:500000}],
 cells:[{id,adjacent:[cellId]}], fires:[{cellId}],
 eligibleAttack:null | {eventId,actorId,targetId,attackPanel,weapon:'spear',techniques:[...],action:'normal-melee'}
}
```

- city粮来自current ledger；transport粮来自current cargo stock。allocation map是**同一world owner新增字段**，每名册ID固定capacity50000；**home名册创世粮必须0**，Deploy从本城借出。已绑定explicit encounter敌方名册允许新局固定 `enemyInitialFood` 与 `enemyFoodBudget`：必须覆盖完整敌方集合、每ID唯一、全部量合法、exact sum等于预算；它是不可变敌方资源初值而非home拷贝、不是动作赠粮，也不在helper中生成。所有actor恰一行allocation；resident必须troops0/cellId null/food0；deployed必须正兵<=60000与实际格。food0允许。
- `actors` 是现field角色+固定真实owner映射+currentFacts.stats.politics投影；不是第二人物状态。政治须0..100，超域拒绝而非偷偷夹值。onFire由context.fires匹配实际当前cellId派生，不由动作请求自由传bool。
- cells是当前movementMap固定相邻图精简，验证节点、邻接、无自环、双向、最多6邻；不从字符串猜坐标，不建新地图。transport现未有位置时cellId=null，**必须拒ManualSupply**；后续位置需固定并绑定同地图owner，不能为触发补给随便给邻格。
- 不创建敌人。foreign owner只可来自已经接受的explicit encounter当前roster；同owner不能袭粮。所有id合成、实体ID唯一，deployed不同格。
- eligibleAttack是outer正在原子处理的**实际合法主动攻击事件**事实，不能把用户填写了合法shape当作证明。eventId由outer命令/receipt绑定，只消费一次。不是允许随时下一个FoodRaid命令偷粮。

动作：
```
{kind:'Deploy',actorId,food}
{kind:'Return',actorId}
{kind:'FieldTick',turn,date:{year,month,day:1|11|21}}
{kind:'ManualSupply',transportId,actorId,requestedFood}
{kind:'FoodRaid',draw:0..10}
```

输出 patches `{kind:'city'|'field'|'transport',id,foodBefore,foodAfter}`；receipt包含细节、totalDelta、foodConsumed。非Tick净粮变化必须0，Tick只sink不增粮。没有兵/金/装备/士气/行动/AP/role写回；owner必须把粮patch与原动作的所有其他字段一起提交或一起拒绝。

## 各叶真实来源与处理

### Deploy / Return

此前世界Deploy只移动兵/energy、Return只返兵/合并morale，没有原生军粮初值证据。这里明确工程合同：Deploy必须由caller显式指定借出粮，可0但不默认赠送；resident旧粮0、同city owner、现city足粮、容量够，city扣等额field增。Return必须deployed同owner，**全部**余粮返城且先验容量，不截断丢粮。owner原Deploy/Return资格、AP、位置、acted、役职门仍需通过；helper不能绕过。

### FieldTick

实际 `food-supply-lifecycle.ts:158–181` 的combat无供给设施覆盖分支精确提取：
- normal = troops × sourcebits `0x40000000` × `0x3d4ccccd`；保留BigInt精确有理数，不用近似十进制乘法。
- 火额外 = 当前foodBefore × (600−5×当前politics)/10000；先和normal合并，再一次截断；正兵请求最少1。
- 实扣min(现粮,请求)，food0时旧核原样skip；记录shortfall，不损兵、不饿死、不finalize。
- 仅deployed消费。这里具名 `explicit-no-supply-facility-coverage-v1`，没有camp/fort/fortress覆盖索引时不能凭空降低耗粮；不表示全场不存在设施。

outer只在实际WorldTick调用一次，并检查日期/turn前后一旬；helper不advance、不去重另一存档。与当旬火损兵/火熄灭的采样顺序须在新profile固定（例如拿field hazard前current roster+fires），不能因先fireTick删火再让这份粮耗漏火。此跨核顺序是工程选择，非考证原生全序。

### ManualSupply：仅食粮子集

提取旧 `food-supply-lifecycle.ts:215–232` 的food分支：source transport → deployed combat，同owner、相邻图一跳。`accepted=min(requested,targetCapacity-targetFood,sourceFood)`，未接受留source；允许accepted0，不谎称已运到。总粮守恒。

**不覆盖兵/钱/装备补给及其加权士气**，当前没有对应唯一field字段就不造。也不新加native AP费用；owner若将它视作占一次运输行动需明确profile，该leaf只算粮。没有transport空间绑定就拒绝，不把supplied-adjacent标签本身当距离证据。

### T21 袭粮

真实复用 `inferred-combat-requests.ts::projectInferredFoodRaid`，源码完整保留evidence/：`floor(attackPanel*(10+draw)/10)`，上限floor(ownTroops/2)，再min敌现粮、己余容量。公式是该既有具名推断 `inferred-food-raid-tenths-conservative-transfer-v1`，不是已核原生。

使用已验证事件主动normal-melee、spear、tech0+tech1、distinct owner、当前相邻正兵双方；attackPanel0..255来自同一实际战斗事件而非自由命令。当前版本只开放该普通主动枪兵子集，不能把反击、非枪兵或任意计略当资格。

旧 `inferred-positive-resource-ledger.ts` 的独立账本要求双方粮>0且袭后source不能空；本桥不复制那一整套正值存档：用户明确允许粮归0，故直接调用其已复用的projector，允许零粮/零transfer，**兵数始终不改**。旧账本并未因此被修改。

在F encounter/physical owner原子处理中，须先用实际事件和当前余额生成T21提案，再与攻击效果一起统一提交；任何原攻击终结/失败则粮也不提交。采样ownTroops是该phase当前owner值，具体在反击前/后必须由world profile固定。当前战斗核仍可能拒food-raid context；只有owner明确接此新side effect后才称支持，不能删拒绝却漏粮。

## 边界与审查

无P078、Closing、真实人物归属伤亡、部队0终结；不导入任何whole season/finance/health链。只导入已有推断food-raid pure projector。来源完整保留：food-supply-lifecycle.ts、inferred-positive-resource-ledger.ts、inferred-combat-requests.ts。

校验shape不能认证历史：outer保证home allocations初0、enemy仅不可变完整名单且exact-sum budget绑定的显式初粮、所有快照来自同一重放、eventId未用、当前图/火/政治/owner事实可信；返回foodBefore应与提交时owner再核。不能接受调用者的另一余额替换world。

审阅重点：部署借粮守恒、Return容量拒绝、resident粮0、粮0skip无兵损、火政治范围、重复格/身份、无运输位置拒补给、同owner袭粮拒、缺事件拒、袭后敌粮0允许但兵不动、跨阶段失败无半粮patch、完整原始journal不改历史。以上为静态要求，不是测试执行结论。

2026-10-30父/owner明确批准敌方独立新局food预算后本规则更新；纯leaf只读当前allocations，计算代码不变。新敌方初值与预算验算应由outer构造并完整重放，纳入整批重新独审；本helper不能单独认证来源。
