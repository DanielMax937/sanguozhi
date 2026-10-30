# T26：显式合成薪资/忠诚账本 v1

实现 `inferred-salary-ledger.ts`，消费既有 `projectInferredSalaryShortfallV2`。原 [欠薪请求 v2](inferred-salary-request-v1.md) 与 [已知欠薪边界](57-salary-shortfall-loyalty-boundary.md) 继续有效：同设施工资总额足够整笔扣，不足整笔不扣；每人正工资全欠时减忠诚5仍为工程推断，**不是原生逆向值**。撤回的逐人部分支付v1不恢复。

## 新 opt-in 合同

`createInferredSalaryLedger(initialGold, initialOfficers)` 创建独立合成账本。金0..10亿，名单1..64；每人严格包含唯一 `synthetic-[a-z0-9-]{1,48}` ID、工资0..100万、真忠诚1..255。工资是合成场景明示值，不查询真实官职/历史人员。设施工资严格由同一名单工资求和，最多6400万，避免caller另报不一致总额。没有属主、势力、驻地、武将或任务字段，也没有真实人事保存映射。

`executeInferredSalaryPeriod(state, command)` 严格命令字段：唯一合成id、expectedRevision、period（1..100万的严格递增合成期号）、payrollEligibilityConfirmed:true。期号不等于游戏日期；允许跳号，但跳过期号不自动补扣工资。资格、当前应结算一次由调用方明示确认，本模块不会自动查月份或与其他城市时钟融合。最大128条成功命令。

每期先以当时金钱和名单总工资计算设施门，再以**同一未扣款金钱**计算每个人的应付与减忠诚计划，所有人通过后设施金额只扣一次。足额时每人拿足工资、忠诚不变；不足时全员不支付，正工资者请求减5、零工资者不减。任何忠诚减后会为0/负数，则整期拒绝、所有钱/忠诚/期号/命令均不提交；不会钳到1，不处理零忠诚、离反、归属或人物finalizer。

成功返回被冻结的新state、gold、officers、period、revision和逐期回执。读取入口 `readInferredSalaryLedger` 始终从initialGold/initialOfficers/commands完整重放，拒绝余额快照注入、命令重复和重复/倒退期号。失败不修改输入；调用方保留原状态。此处实际改变的是**独立合成薪资和忠诚账本**，并非原作人物或全局世界状态。

## 保存、安全与旧兼容

`saveInferredSalaryLedger` 验证后序列化初值和完整命令；`loadInferredSalaryLedger` 限10万字符，标准JSON.parse解析再重放。重复JSON键按标准last-wins，不承诺原字节唯一或防作弊。改写合法初值等于另一合成场景，不是原历史证据。

普通输入先有界descriptor复制，拒绝accessor/symbol/循环/稀疏数组/自定义原型/额外数组字段；公共入口捕获失败。Node支持时拒绝Proxy；其他runtime不能保证Proxy反射trap无副作用，接口只面向可信普通数据，不接可执行对象。范围/复制限制是工程资源约束，不是原游戏上限。

不改变旧city-finance的欠薪整旬拒绝、原存档、费用顺序、工资catalog或任何默认policy；不自动把此结果写回旧服务。不接Closing/P078、真实人物、归属、伤亡、奖励、全局时钟。没有收入/补款/变更工资/宝物/任免命令；后续若要接真实名单或调度须另建明确合同，不把本账本当全局完成。

## 静态验收

核总工资来自唯一固定名单；工资门使用同一金钱；足额只扣设施总额一次；不足不部分支付；正工资欠薪请求5与零工资0一致；任一归零整期拒绝；保存读回全序列重放；旧代码零修改。仅静态审阅，未运行测试、typecheck、build或候选，运行验收未完成。
