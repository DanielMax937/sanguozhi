# D / T28 有效政治火灾粮耗：显式非负扩域叶 v2

本地静态候选，未执行、未测试/typecheck/build、未远端发布。必须待统一 owner 集成与独审后才能称实际闭环。不是原生规则新证据，也不修改 PK 人物基础政治、旧 food-supply API 或任何旧默认。

## 来源及推断边界

真实源码基线 `f132870bb58505acd0572c23e3ba91592eefa849` 的 `packages/engine/src/food-supply-lifecycle.ts` 已归档 evidence：第 140–142 行验证 field politics 0..100；第 158–181 行有理数与 consume，普通 combat 无覆盖分支为 troops × sourcebits `0x40000000` × `0x3d4ccccd`，火项为当前粮 × (600−5×politics)/10000，先合并再截断，正兵最少请求 1，实扣 min(当前粮,请求)。粮 0 直接 skip。

已封版 G 叶亦归档：`synthetic-field-food-leaf-v1.ts` SHA256 `a938fe925c36c58dec4f66c3d3630946b64257973d3eeeb07969a6ece5d2f046`；匹配规则版本 SHA256 `8ad8358a80d5523b11d2a7896c16cdc0f9c2d26d8dd58a2f23a0f5858791399d`。本次复制其有界 plain-data detach、当前名册/余额/地图/火校验与 FieldTick 算术，独立成无 import 的仅旬消费入口。未复制 Deploy/Return/ManualSupply/FoodRaid 操作分支，未扩大这些 API 的 politics 输入域。

**具名工程推断 `nonnegative-fire-food-contribution-v2`：** 为支持 D 从当前宝物五维投影取得的有效政治 0..255，将火项系数改成 `max(0,600−5×effectivePolitics)`。这是安全扩域，不声称原作高政治火项公式已证。不能把系数先与普通项相加后再整体夹零，也不能夹整个有效政治至 100；两者会改变授权语义。

## 唯一入口

`planSyntheticEffectivePoliticsFieldFoodTick(rawContext, rawAction, rawPolicy)`

```
policy = {profile:'nonnegative-fire-food-contribution-v2'}
action = {kind:'FieldTick',turn,date:{year,month,day:1|11|21}}
context = {
 city:{id,ownerId,food,foodCapacity},
 allocations:[{actorId,food,foodCapacity:50000}],
 actors:[{id,ownerId,role:'resident'|'deployed',cellId,troops,politics}],
 transports:[{id,ownerId,cellId,food,foodCapacity:500000}],
 cells:[{id,adjacent:[cellId]}], fires:[{cellId}], eligibleAttack:null
}
```

所有 raw 输入经 descriptor detach，拒额外字段/稀疏数组/访问器/循环/越界。policy 必须明确且字段精确；动作必须仅 FieldTick。旧 owner 未显式启用 D 时仍调用旧 G 入口，不能失败后偷偷 fallback 或自动切换。该新入口完整校验原 context 而只产生 deployed field 的粮 patch，city/cargo 不在此再次耗粮。

- 当前唯一 allocations、owner、角色、位置与 fire cells 必须来自同一 owner 重放；所有 actor 有唯一 allocation，resident 粮/兵皆 0 且 cellId null，deployed 兵 1..60000 与有效唯一格。粮 0 合法。
- actors.politics 为当前有效政治整数 0..255；D owner 必须在同一次消费 proposal 内从 live 唯一宝物持有关系和当前基础属性派生，不能另存静态 bonus/人物快照。对没有适用装备的 actor 同样传其实际当前派生值，不能捏造敌方属性。
- onFire 只按实际 cellId 与当前 fires 判定，不接受自由布尔 flag。地图/身份/owner 及容量验证沿用 G；shape 验证不是来源认证。
- 初始化 home 粮 0、Deploy 借粮，enemy 只允许已绑定完整敌方集合与 exact-sum enemyFoodBudget 的显式不可变初值。此叶不初始化、不赠粮、不改变历史。

输出为冻结 `{ok:true,foodPatches,receipt}`；patch `{kind:'field',id,foodBefore,foodAfter}`（内部联合类型保留 G 兼容），receipt 保留原消耗细节并加政策标识、有效政治来源标记、逐行 fireCoefficient；粮 0 skip 仍不计算该行有理数。无状态、副本余额、随机抽样、日期 advance、第二 journal。

## 算术与守恒（静态推导，不是测试结果）

- p 在 0..100 时系数在 600..100，max 不改变数值；普通项、合并顺序、截断、最少 1、扣粮上限和粮 0 skip 全部与旧 G 相同。receipt 因新政策有明确新字段，不承诺字节完全同旧 receipt。
- p=119 系数 5；p=120..255 系数 0。高政治不能让负火项抵消普通耗粮，更不能增加粮。
- 普通项保持 sourcebits 精确 BigInt 有理数；新火项先夹非负再转换 BigInt，与普通项相加后仅一次截断。安全整数域使系数算术无精度损失。
- 实扣不超过当前粮；不足只报告 shortfall，粮可归 0，不执行伤兵/饿死/部队终结。总 patch delta 必须不正，foodConsumed 为其相反数。

## Owner 接入必须核实

1. D 固定 profile 显式启用新入口，旧存档/默认仍旧核；仅替换当旬 field food 这一个 phase，不能旧核、新核都调用造成双扣。
2. tick 日期严格下一旬且同一 command 一次，采样与当前 fires/hazard 的先后顺序沿用已封版 FHG profile；此叶只验合法日期形状，不自行去重/推进时钟。
3. current politics/food/roles 同一个 proposal 版本，提交时核 foodBefore，和其他 Tick phases 原子提交或全部拒绝；任何后续失败不留半个 patch。
4. Deploy/Return/ManualSupply/FoodRaid 仍走其原受审入口/域，不能把有效政治超 100 自由灌给全部旧 API。
5. 禁止任何 whole-season/health/P078/Closing 链、真实人物归属伤亡、兵 0 终结。此模块无 import，无候选执行。
