# T21 / T32：显式正值资源消费者 v1

模块 `inferred-positive-resource-ledger.ts` 只消费 [推断战斗请求](inferred-combat-requests-v1.md) 已有 `projectInferredFoodRaid` 和 `projectInferredGatePortRepair`；这些仍是具名工程推断，不宣称原作随机取样/修复系数已证实。默认世界、真实人物、旧服务、Closing/P078不变。

## 初始账本与资格

`createInferredPositiveResourceLedger(initial)` 创建1..64个合成账户：严格字段id、kind（food或gate-port-durability）、value、capacity。唯一 `synthetic-[a-z0-9-]{1,48}` ID；capacity不超过100万，value须1..capacity。food是显式粮食余额；gate-port-durability只代表**已建成**合成港关正值耐久，不是堤坝/建设进度，修满不会触发完工/归属。

所有命令含唯一合成id、expectedRevision、targetId、eligibilityConfirmed:true；最大256条，revision连续。资格是caller对该合成请求的明确前提，不假装本模块检查原战斗、真实太守、回合或位置；不自动调度、抽取随机数、扣AP、产生功绩。

## T21：兵粮袭击转移

kind=food-raid，另外严格包含sourceId、attackPanel（0..100万）、ownTroops（1..100万）、draw（0..10）。source为被袭击方粮食账户，target为袭击方接收账户，必须不同ID且都为food。请求函数参数依次使用攻击面板、caller明示兵力、source余额、target余额、target容量、draw和资格true。

请求按旧公式求出 `proposedTransfer`：倍率整数十分位、兵力一半上限、来源余额及接收空位共同限额。实际从source扣同一个量、给target加同一个量，粮食总和守恒。若量为0，或扣后source归零，则整条拒绝，无部分钳制到1。拒绝耗尽来源是本可选正值profile的保守边界，不是原作粮尽规则。兵力只是算式输入，不写任何真实或合成兵力。不是完整枪兵战法/战斗finalizer。

## T32：普通港关修复

kind=gate-port-repair，另外严格包含politics（0..100）、governorPresent布尔值。目标须gate-port-durability。使用旧请求 `requestedRepair`，实际增加min(请求,容量−当前值)。无太守或已满导致0则拒绝；修复不会改变capacity或类型、所有者、人物，也不施加据点反击/伤害。堤坝恢复/完工不是此入口范围。

## 事务、保存、兼容

两种命令在所有前提满足后才生成新账本与回执，输入不修改；失败不提交局部金额。read/execute/save/load都从initial+commands完整重放，不信任余额快照，重复命令拒绝。状态严格只有schema、initial、commands。

输入经有界descriptor复制，拒accessor/symbol/稀疏/额外数组字段/自定义原型/循环。Node可用时拒Proxy，其他runtime不能保证反射trap无副作用，故仅接受可信普通数据。公共入口捕获异常。保存最多10万字符，标准JSON.parse采用重复键last-wins归一化；不是原字节认证/防作弊，合法初值可声明另一合成场景。

这些接口闭合独立资源变化，不自动接city-finance、food-supply、战役GameState或原人物。所有数值上下限、合成ID、正值拒绝/无效果拒绝是工程合同，不能误称原作上限。只静态审阅，未执行测试/typecheck/build/候选，运行验收未完成。
