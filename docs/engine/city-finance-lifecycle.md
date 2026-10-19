# City finance lifecycle v1 API

独立、有限、固定所有者的单城财政服务。具体游戏规则以[完整规则正文](../rules/city-finance-lifecycle.md)为准，本页只描述调用合同。代码位于 `packages/engine/src/city-finance-lifecycle.ts`，从public index导出；不改变O04或GameState/v2。

本次新增代码、JSON场景、schema与文档只作静态交付，没有运行测试、typecheck、编译、build、checker、诊断、产品入口或示例。下列调用是接口描述，不是执行记录。

2026-10-19补充：[月特产私有阶段](monthly-specialty-phases.md)将工资后的单兵种处理作兼容抽取，原owner仍掌握工资成功后的1→2→3→4顺序及整旬事务。公共API及unknown输入/核收据边界、schema/profile/tag、政策/目录、save/history和完整结果预算均不变；没有新的公开阶段API或存档迁移，也未接合动态forge月产。此改动仅作源码与规则静态交付，未运行验收。

## 注册快照

- `CITY_FINANCE_POLICIES_V1`：完整注册政策及所有参数，包含specialty binary32假设和预算
- `CITY_FINANCE_CATALOGS_V1`：完整named-offices-v1及documented-income-facility-table-v1
- `CITY_FINANCE_POLICY_DIGEST_V1`、`CITY_FINANCE_CATALOG_DIGESTS_V1`：canonical UTF-8 JSON SHA-256
- `CITY_FINANCE_EVIDENCE_V1`：source/provisional边界；nativeExecution/stockVerified均false

导出常量递归冻结。场景必须携带完整policies/catalogs，与此版本注册内容相等；没有“只给版本号并自动装最新默认”的入口。

公开类型为CityFinanceScenarioV1、StateV1、SnapshotV1、EnvelopeV1、PoliciesV1、CatalogsV1、ReceiptV1、WriteV1、FailureV1、StateResultV1、CommandResultV1、PreviewResultV1、SaveResultV1、TraceV1、ReplayResultV1，所有类型名都带CityFinance前缀。公共函数输入unknown，实际做严格运行时结构/域检查；输出为递归readonly。

## primitive scenario

完整字段与值域见[规则§1](../rules/city-finance-lifecycle.md#11-初始化场景字段)。必须声明schemaVersion1、profile、日期/turn/limit/初始已结算、activeForce、normal或super及controller、完整city、U16基础产值、恰30槽、completeResidentRoster=true、0..80名普通有官者、prisonerCount0、整备政令、完整未来月丰作primitive、bounded tape、完整政策/目录。

[场景schema](../sources/city-finance-lifecycle.schema.json)只说明JSON形状和固定快照，`$defs.envelope`描述唯一命令。owner、金额≤cap、完整未来月、唯一人员/官职/设施坐标、整个horizon与safe integer跨字段关系由代码补充；schema不能替代状态重建或receipt验证。对象禁止额外字段、getter、自定义原型及稀疏数组；primitive不接受派生结果冒充输入。

## createCityFinanceState(scenario)

成功 `{ok:true,state}`。创建不结算initial date，revision/advancedCount/rngCursor=0，lastSettledDate=initial date，harvestCurrent=null。先检查完整horizon能否安全推进，不截短越界区间。primitive初始月不再重发收入。

## previewCityFinanceCommand(state,envelope)

唯一envelope：`{id,expectedRevision,command:{type:"AdvanceFinanceTurn"}}`。没有targetDate、count、computedIncome等字段。成功 `{ok:true,committed:false,duplicate,receipt,projectedSnapshot}`。

完整state先从genesis重算，再对分离候选调用与execute完全相同的resolver和完整execute输出预算，涵盖工资不足、RNG不足、历史和容量拒绝。不会改原state/RNG。projectedSnapshot不是可以绕过执行导入的可信状态凭据。

## executeCityFinanceCommand(state,envelope)

成功 `{ok:true,committed,duplicate,state,receipt}`，这是函数式更新，调用者须显式保留返回state。新ID成功committed=true、duplicate=false，旬历只进一次，接受历史追加一个完整envelope/receipt。

同ID+完整envelope重复：返回原receipt，duplicate=true、committed=false，state内容不变，不受已经耗尽的limit或当前revision影响。原receipt.duplicate固定false，表示其原始接受事件；重试标记只在API外层。相同ID更改expectedRevision等任何字段即command-id-conflict。新ID使用旧revision即revision-conflict。

每个成功receipt包括完整政策参数、目录digest、sourceBoundary、owner/payer与工资名单、技能持有者、丰作与旧治安、每个核完整input/result、逐笔cap写入/弃置、季降draw、逐人月薪、四兵种早返/生产路径、所有随机消费及日期结算事件。合法派生浮点完整保留，不错误限制为整数。

## 失败

所有API失败返回 `{ok:false,committed:false,reason,index,proposal}`。index为history或trace分歧位置，普通输入错误为null；proposal仅工资不足时给 `{required,available,shortfall}`。不返回部分提交的state，也没有finalizer执行对象。

调用者传入对象从不被写入。工资不足、kernel unsupported/负值、错bound/缺draw、预算超限均使当前整旬失败；不存在部分工资、只推进日期、保留刚入粮或预消费外部RNG的例外。完整reason分类见[规则§8.5](../rules/city-finance-lifecycle.md#85-有限资源与失败)。

## saveCityFinanceState(state) / loadCityFinanceState(json)

save成功 `{ok:true,json}`，json是完整canonical state。load成功 `{ok:true,state}`。保存内容包括：

- tag=`city-finance-state-v1`、schemaVersion1、profile、scope
- 完整policies/catalogs及canonical digests
- genesis `{scenario,snapshot}`
- 当前snapshot（schema/profile/revision/advancedCount/date/turn/city/officers/harvestCurrent/rngCursor/lastSettledDate）
- acceptedCommands数组，每项完整envelope及receipt

save自身也重算，不直接序列化不可信余额。load的有限JSON parser拒绝重复解码key，然后重新创建genesis snapshot、按原序执行每个接受命令、逐字段比较receipt/最终snapshot。未知政策、修改目录薪水、改写余额/RNG/日期/receipt都不能仅靠改hash通过。一个完整自洽的新合法场景不是签名伪造检测的目标；本服务不提供身份认证。

2026-10-17保存一致性强化：reconstruct先检查初态预算，每个accepted step都构造与execute相同的完整CommandResult再检查预算，之后比较receipt。保留原限额、财政算法与政策；这是静态合同一致性强化，尚未证明原支持域内可触达反例，也未运行测试或性能评估，不是已复现故障的修复声明。

对象key顺序可变化，数组顺序必须保留。JSON数值允许语法上1.0表达整数1；primitive语义仍要求安全整数，禁止负零。只有派生核receipt允许有限小数。无系统时钟、联网或当前main依赖。

## replayCityFinanceCommands(trace)

trace完整形状：

- tag：`city-finance-trace-v1`
- scenario：完整primitive初始场景
- attempts：最多1080项 `{envelope,expectedOutcome}`，顺序保留
- expectedFinalSnapshot：完整期望snapshot或null

expectedOutcome可为null（只演算）、`{ok:true,duplicate,receipt}`（完整成功收据核对）或`{ok:false,reason}`（失败核对）。先得到实际结果，再比较期望；期望不改变计算。失败attempt不改state，重复ID不再写账；每次成功仍受与execute相同的候选预算。

成功 `{ok:true,state,outcomes}`。首个结构/期望分歧返回failure和index，不返回部分state。最终结果还受总体预算，超限不截断outcomes。

## 预算与可移植性

profile冻结64MiB canonical JSON、4,000,000节点、48深度、1080数组长度、128对象键；最多360接受命令、720随机draw、80工资人员、30设施槽。整个horizon upfront验证安全年/turn上限。preview/execute候选预算完全共用。没有Node专属process/util/crypto API，不使用TypeScript参数属性语法；canonical SHA-256为已有独立实现的静态复用。没有为本批运行任何运行时兼容性验收。

静态场景直接见[data/scenarios/city-finance-example-v1.json](../../data/scenarios/city-finance-example-v1.json)；[规则§10](../rules/city-finance-lifecycle.md#10-静态场景与纸面推导没有运行)列明第一旬纸面计算。本页不提供运行步骤。
