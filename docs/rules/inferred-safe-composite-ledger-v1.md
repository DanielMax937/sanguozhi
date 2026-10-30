# T05/T06/T12/T21/T32：安全片段原子调度 v1

该显式新profile将 [正值损耗账本](inferred-positive-hazard-ledger-v1.md) 和 [正值资源账本](inferred-positive-resource-ledger-v1.md) 的现有命令组合成一次提交。它不是全局世界引擎，也不自动判断缺粮、火格、袭击资格、太守存在或回合到期。公式与拒绝边界完全沿两服务，未扩大到伤亡/归属/Closing/P078。

`createInferredSafeCompositeLedger(initialHazard, initialResources)` 完整验证并保留两份初始journal；允许旧片段已有合法历史。新外层state只有schema、initialHazard、initialResources、commands。外层最多128批，内部仍各有原256命令限制。初始片段及后续命令被复制、冻结，原对象不写回。

每批严格字段id、expectedRevision、hazardCommand、resourceCommand。id为唯一合成ID，revision连续；两子命令各可null但不能同时null；非null必须是对应服务已有严格命令，保留自己的ID/revision/显式资格。两份内部ID空间与外层不同，任何内部重复/过期由旧服务拒绝，不伪装统一世界ID。

执行先计算损耗提案，再计算资源提案，**两者都成功才同时返回新片段**。任一失败则外层失败，无可提交的部分state；旧服务纯输入不变，因此不需要补偿写或回滚真实数据库。成功外层回执保存两片段before/after revision及实际子回执，保存/加载完整重放外层和原始片段历史。外层重复ID拒绝，不能通过换子ID重放同批。

此处“调度”只是显式原子命令分派，**不代表跨片段身份已绑定**：相同字符串不会让粮账户自动属于某兵力目标；调用方必须给出合成场景正确配对。也不由粮余额推算饥饿、不自动多扣回合或AP、不再施加费用、不融合地图/城市时钟。返回分别提供实际hazard/resources派生余额；不得直接覆写旧独立服务或当成全局GameState。

零兵/建筑终结、粮来源归零、无效修复等继续沿旧正值门拒绝；原世界终结/奖励/人物所属没有路径。当前只接这两个已核片段，不隐式接工资/宝物/建设/真实单位；若要扩接须新具名合同，而不是任意回调执行器。

输入采用有界descriptor普通数据复制，拒绝accessor/symbol/稀疏/自定义原型/循环；Node可用时拒Proxy，其他runtime不能保证Proxy反射无副作用，仅可信普通数据。文本保存/加载同限40万字符，标准JSON.parse重复键last-wins，不是防作弊签名。只静态审阅，未执行测试/typecheck/build或候选，运行未验收。
