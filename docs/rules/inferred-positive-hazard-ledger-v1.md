# T05 / T06 / T12：可选合成正值伤害账本 v1

## 证据与设计边界

本模块消费既有 `inferred-combat-requests.ts` 中的 `projectInferredStandingFire` 与 `projectInferredRockfall`，及 `inferred-rule-requests.ts` 的 `projectInferredStarvation`，不另造第二套公式。已有规则来源与推断见 [推断战斗请求](inferred-combat-requests-v1.md)，具体资料不足的部分仍是工程选择，不升级为原作证实。

- T05：显式完整无粮回合数1..360，逐回合保留 `floor(76 * troops / 100)`；推断公式沿用 [推断请求](inferred-rule-requests-v1.md)。饥饿 draw 字段在此专指完整无粮回合数，不是随机数；pathbreaker必须false，目标必须troop。任何中途或最终归零整条拒绝，不产生部分生存结果。调用方确认缺粮，不自动消耗食物、不判定库存、不触发真实部队损失。
- T06：普通无修正驻留火 `300 + draw201`，显式输入整数抽签 0..200。不是从旧 hazard RNG tape 追加抽签，更不声称该范围为原函数证据。
- T12：部队 `1500 + draw(0..499)`，踏破取 `floor(raw/10)`；建筑 `800 + draw(0..999)`，不接受建筑踏破。是否另加共同50仍采用旧纯请求的“不加”推断，不声称原作已证明。
- 仅将请求转换为**本模块独立合成目标账本**的实际余额，不修改 `GameState`、真实武将、归属、城市设施、旧 hazard、Closing 或战役保存。调用方提供事件与资格，不存在自主世界调度、持续火焰/火源传播、路径落石生成。

## 入口、状态与原子性

`createInferredPositiveHazardLedger(initial)` 创建 1..64 个目标；每个严格只有 `id, kind, value`。ID须匹配 `synthetic-[a-z0-9-]{1,48}`，唯一；kind为troop/building；value为1..1000000整数，分别代表本账本兵力/耐久。没有隐含与真实单位同ID关联。数值上限、目标数上限和名称规则都是资源约束设计。

状态严格只有 `schema: inferred-positive-hazard-ledger-v1, initial, commands`，不接受额外快照字段。`readInferredPositiveHazardLedger` 从初值完整重放，返回被冻结的 state、实际 balances、逐条 before/after/damage receipts 和 revision。初值是调用方声明的合成初值，存档不是防作弊签名；合法重写初值会构成另一个合法合成场景，不能当原历史认证。

`executeInferredPositiveHazard(state, command)` 的命令严格包含：

- id、targetId，均符合上述合成ID规则；命令ID不能重复；目标须存在。
- expectedRevision，必须等于已成功命令数；最多256次成功命令。
- kind：standing-fire、rockfall或starvation；draw为旧请求接受的显式整数范围（starvation为完整无粮回合数）。
- pathbreaker：布尔值；驻留火只允许false且目标必须troop。所有其他驻留火修正都不支持。
- eligibilityConfirmed：必须是字面true，表示调用方确认这是该合成演练应发生的一次事件，不等于本模块核实原作资格。

请求伤害必须严格小于当前值；等于或超过即整条拒绝，返回失败而不产生新状态/命令/回执。不会钳制到1，不会产生0，更没有死亡、解散、俘虏、建筑损毁、夺取、人物转属、奖励或伤病处理。消费者不修改输入，失败时调用方继续保留原状态。成功状态不能直接混入旧服务保存。

## 保存与兼容

`saveInferredPositiveHazardLedger` 先全重放验证，仅序列化初值和命令。`loadInferredPositiveHazardLedger` 限100000字符，使用标准JSON.parse解析后同样重放，重复JSON键采用标准last-wins归一化，不声称原始JSON字节唯一性或数字签名；余额不从外部快照信任。普通对象输入先经过有界descriptor-based复制，拒绝accessor、symbol、额外数组字段、稀疏数组、循环和非普通原型；Node支持时拒绝Proxy，其他运行时不能保证无Proxy反射trap副作用，不接收可执行对象作为可信存档。异常返回失败。旧默认 `empty-only-reject-v1`、旧2/100/200 RNG边界、旧hazard存档和拒绝occupiedFire行为，以及旧food-supply report-only/no-troop-loss默认与零兵账户处理，完全不变。新账本没有“迁移旧存档”入口。

本模块不消耗全局RNG、不推进世界或城市时钟，不扣全局AP、粮食，不暗中连接新模式。原作数据和世界调度未知项继续保留。它闭合的是**显式请求到可保存独立正值余额**，不是战役全流程。

## 静态验收条件

创建/执行/加载严格核字段、枚举、整数、范围、唯一ID、连续revision；同ID重放拒绝；非法draw/建筑踏破/火修正由旧请求或本层拒绝；任意会归零的请求原子拒绝；每次余额可以由初值和完整序列手算复核；旧模块零修改。仅静态审阅，不执行测试、typecheck、build或候选代码，运行正确性尚未验证。
