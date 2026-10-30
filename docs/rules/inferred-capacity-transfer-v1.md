# T20：普通合成容量/库存双边转运 v1

`inferred-capacity-transfer.ts` 是显式 opt-in 账本，不是原生输送抵达、部队解散、入城或人物任务finalizer。旧 `food-supply-lifecycle.ts` 的 `ManualSupply`、`inferred-automatic-supply.ts` 的相邻战斗目标补给及旧保存/默认政策均不改。新账本仅允许同合成owner的一端transport、一端depot相互转运，不允许combat账户借此绕过枪戟弩马匹配兵装约束。

## 实际已读证据与推断

本次固定基线 `f84170228ca0ff98ead3d2887be993eef8088885`，实读 `food-supply-lifecycle.ts`、`inferred-automatic-supply.ts` 和 [21-supply-transport](21-supply-transport.md)：

- 输送兵/金/粮容量60000/100000/500000有既有资料，transport账户必须用这三个上限，不声称它们是新逆向结果。
- 12组EquipmentStatus存在及其容量相关地址有资料，但12槽逐类型具体容量仍未恢复。新合同**不伪造默认原作数字**：必须显式提供完整12个容量，强制标记 `equipmentCapacityPolicy: inferred-per-slot-input-v1`，各值0..10亿。每个数字是调用方具名推断输入，不是原生事实；取得新证据后创建带新初值的新账本，不静默修改旧journal初始政策。
- depot的兵/金/粮及12槽容量也由调用方明确输入，范围0..10亿，只是合成资源约束，不把某城市默认值套给所有港关。账户kind=depot不代表某个真实城市/港/关ID。
- 气力加权核心沿旧补给证据；本profile明确采用BigInt整数向下取整兼容选择，不认证野外/据点原helper、原作非整除取整或回绕行为。

## 数据合同

`createInferredCapacityTransfer(initial)` 输入2..32个账户，每个严格包含：

```
id, ownerId, kind, morale, stock, capacity, equipmentCapacityPolicy
```

id/ownerId须匹配 `synthetic-[a-z0-9-]{1,48}`，账户id唯一。kind仅transport或depot。morale为0..100。stock/capacity严格包含troops、money、food、equipment，equipment为**恰12槽**稠密整数数组，索引只是槽位，不重新解释成原生装备身份。库存每个分量均不超过对应容量，且**所有初始账户兵力必须为正**，不接受0兵账户。纯金粮/装备库存可0。

命令严格包含 `id, expectedRevision, sourceId, targetId, amounts, eligibilityConfirmed:true`。ID为同类合成格式；源目标不同、存在、owner相同、kind不同。amounts是同样15个资源坐标（3标量+12槽），每项非负整数，至少一个为正；调用方明确确认这个合成账本转运资格，不代表已检测原生距离/移动到达。

## 整单足额、守恒和正兵边界

1. 每个请求坐标都必须不超过来源库存。
2. 每个目标加量后都必须不超过对应容量；任何一项不满足整单拒绝，不按槽部分提交、不丢弃超量，不把原作满城可能丢失货物的经验行为套入本安全profile。
3. 若兵力请求使已有正兵来源归零，整单拒绝；不是仅保留空账户而绕过零兵/实体终结禁区。初始0兵也禁止。金/粮/装备归零只是普通库存变化，不产生人物或实体结果。
4. 全部验证通过后，同时从source各项扣指定量、给target各项加同一指定量，所以逐资源总量守恒。容量、owner、kind、账户数量均不改。
5. 如有兵力转移，目标新气力为 `floor((旧目标兵×旧目标气力 + 转入兵×源气力)/新目标兵)`；source气力保持，目标无兵转入时气力不变。明确不承诺逆转后气力守恒（向下取整有信息损失），只承诺库存分量守恒。

回执含双方before/after、转移量、气力before/after及discarded=0。只有所有前提满足才构造新账户；失败不返回新state，不修改输入，调用方保留原state。没有实体删除、入城奖励、武将移动、归属变化、AP/费用/时钟/粮耗结算或自动路线。

## 去重、保存、重放

状态严格只有schema=`inferred-capacity-transfer-ledger-v1`、initial、commands；最大128次成功命令，expectedRevision须等于已成功命令数，重复命令ID拒绝，不做默默二次提交。

- `readInferredCapacityTransfer`：初值与全journal重放验证，派生accounts/receipts/revision冻结返回，不能注入余额快照。
- `executeInferredCapacityTransfer`：先重放旧state，校验新命令，再重放完整新journal，失败保持原输入。
- `saveInferredCapacityTransfer`：验证后仅序列化初值和命令。
- `loadInferredCapacityTransfer`：最多10万字符，标准JSON.parse解析再重放；重复JSON键采用last-wins归一化，不是字节唯一认证或防作弊。修改合法初值代表另一合成账本，不是原历史真实性。

输入使用与本轮既有合成账本一致的有界descriptor复制，拒accessor、symbol、稀疏数组、自定义原型、循环、额外数组字段及非法整数。Node支持时在反射前拒Proxy；其他runtime无法保证恶意Proxy反射trap无副作用，故只接可信普通数据，不接可执行对象。异常返回失败。

## 未完成和验收边界

本模块完成明确双边库存原子转移，而非原生T20全项：仍未恢复12类原上限/原finalizer字段顺序、实体移除与原人物任务、满城原超限处理、主机交互差异。没有将本policy自动接入旧 `ManualSupply` 或自动补给。P078/Closing/真实人物归属伤亡/globalcampaign均不触及。

仅静态核对/待独审；未运行候选、测试、typecheck或build。运行正确性和原生等价未验收。
