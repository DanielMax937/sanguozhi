# 有界舌战终局分类 v1

[API](../engine/debate-terminal-classification-v1.md) · [实现](../../packages/engine/src/debate-terminal-classification.ts) · [来源映射](../sources/debate-terminal-classification-v1.json) · [纸面场景](../../data/scenarios/debate-terminal-classification-paper-v1.json)

## 具体规则与依据

固定现代参考 [tankyc/sango_infinity@a0d8a4f](https://github.com/tankyc/sango_infinity/tree/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef)，不是原生二进制认证：

1. [Debate.cs L1399–1405](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L1399-L1405)：未决winner=-1不能会心；功能被禁不能会心；其余以胜者对手当前HP≤−100判定。本接口已限定winner0或1，因此未决是拒绝而不是返回非会心成功。HP输入必须已钳制到−100..1000，不接受−101然后自行修复，阈值在本域实际为−100。
2. [枚举 L80–93](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/DebateEnum.cs#L80-L93)：选择PushOn=0、HaveMercy=1，与winType Normal=0、PushOn=1、HaveMercy=2不同。必须显式映射，不能原数字照抄。
3. [CalcWinType L1409–1419](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L1409-L1419)：只有两个choice分支写winType。没有default重置。故本有限入口要求initialCritical=−1、initialWinType=Normal(0)，不宣称任意旧winType都会被重置；该初值来自[初始化 L1540–1542](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs#L1540-L1542)。
4. [CriticalPhase L278–300](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/DebatePhase.cs#L278-L300)分为取得合法选择、计算winType、转Closing。这里不执行玩家界面、AI选择、step调度或日志，调用者必须给显式choice。合法会心若未给choice返回choice-required，不擅自留情或追击。
5. [Damage路由 L412–414](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/DebatePhase.cs#L412-L414)与愤怒路由L354–356、L382–384都是判胜后按CanCritical选Critical或Closing。非会心输入choice必须null，保留Normal、critical=−1，calcWinTypeApplied=false；会心明确映射且calcWinTypeApplied=true。两种都只返回closing-pending，绝不调用Closing。

## 工程准入，不冒充额外源规则

仅genericOnly=true、非教程、已解析winner、两队当前HP的显式投影。loser=1−winner，其HP必须≤0。胜者HP不强制正数：原CalcWinner存在先后检查，两队非正可能已有明确winner；本模块不重新判胜、不推翻供应winner，也不认证检查点来源或可达性。HP/胜者均不修改。

criticalDisabled是调用者提供的已解析功能开关，不访问系统、配置或人物。必须为boolean。initialCritical与initialWinType是首次分类检查点的显式安全条件；重入已分类state不是合法输入，不提供持久化、幂等命令或重复奖励服务。

政策全文精确匹配；关闭未知字段并完整分离输入，失败只返回原因、无部分state或receipt。所有成功结果递归冻结且脱离调用者，未调用任何随机源，未消费随机值。本模块不接受rawDraws，即使空数组也属于未知字段。

## 与已有核关系及剩余边界

PR127 `evaluateDebateAttackEffect` 的成功且nextCheckpoint=terminal-pending-classification可提供state.winner及state.characters两队hp；PR126 `evaluateDebateAngerTransition` 的同名终局路由也仅作为显式投影来源。调用者须确认实际成功和终局，再补criticalDisabled、初始分类字段、policy及choice。不是直接接受完整旧结果、不是自动组合，既有两个核和九个旧会话均不修改。nonterminal的winner=−1拒绝；不能只凭路由字符串认证身份。

Closing、ParamSetWinner、奖励／受伤／随机／人物／势力／任务／归属／外交写入、P078及其依赖、全回合／全会话／campaign均排除。这里的winType是Closing之前的分类，不能当作全部结束逻辑已处理，不能据此发奖或自动修改世界。

仅静态文本阅读、人工纸面推导和字节核对；未运行测试、编译、typecheck、build、validator、checker、候选、来源、场景或 replay。静态审阅不证明运行正确或原生 PK／Vanilla 等价。43证据主题／45历史快照不减；P078及全部依赖保持排除。
