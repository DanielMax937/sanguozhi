# O10-A：固定单城的有限财政生命周期

关联子批：[O10-B城市商人](city-merchant-lifecycle.md)提供独立即时买卖粮/AP/行动账本与外部旬输入。它不自动接入本财政状态，两个有限子批仍不等于全部财政或native事务完成；原43边界不变。

2026-10-17补充保存一致性：重建时先检查初态预算，并逐条按原execute完整输出形状复验每个接受事件的预算，再比较收据；原限额、算法与policy不变。仅静态强化，未证明本支持域内可触达反例，未运行测试或性能评估，不宣称已复现故障。

2026-10-17，profile `standalone-city-finance-v1`。本页描述新独立服务的完整支持规则：按旬推进，实际改变本服务城市的金、粮、治安与四类兵装库存，按80有名官职目录支付完整驻城名单的月薪。它不改变 O04 城市命令、训练 GameState/v2 或其他服务的账户/schema。

这是 O10 财政能力的一批有限静态代码与规则交付，不是“全部财政完成”，不增加机制分母，也不减少原43组证据主题。新增模块、场景和文档未运行测试、typecheck、编译、build、checker、产品、诊断或示例；没有新增或修改旧测试。历史通过数字不覆盖本树，历史默认 food 全套失败继续保留。

导航：[API与保存形状](../engine/city-finance-lifecycle.md) · [完整政策及来源清单](../sources/city-finance-lifecycle.json) · [primitive JSON schema](../sources/city-finance-lifecycle.schema.json) · [未运行静态场景](../../data/scenarios/city-finance-example-v1.json) · [当前状态](STATUS.md)

## 1. 证据、场景与所有权边界

本服务调用四个原有纯核，不修改它们的输入域或证据等级：

| 原核 | 保持的作用与局限 | 本服务如何连接 |
|---|---|---|
| [城市金收入](city-money-income-projection.md) | 稳定已解析30槽、安全 signed32 局部返回，不是实际到账 | 以原始设施、固定表、旧治安生成输入，再独立 credit |
| [城市粮收入](city-food-income-projection.md) | 非Easy位宽精确局部返回；旧核可返回负 signed 值 | 本服务只允许无回绕非负子域，失败或负返回拒绝 |
| [月粮 harvest→levy](monthly-city-food-base-argument.md) | 当前 EDI/EAX、独立晚期 levy DWORD 的35-byte叶段 | 用稳定服务快照生成观测；不是原生捕获，稳定性是政策 |
| [月特产](monthly-specialty-production.md) | 1..4兵种数量请求，含 provisional binary32/converter政策 | 从固定设施推导完成计数，薪资成功后逐种入独立库存 |
| [港关返回尾部](base-income-return-tail.md) | 已捕获值与 late type 的局部 `/5` | 本批没有港关，不接此核，旧能力与边界不变 |

`sourceBoundary` 标明 `nativeExecution:false`、`stockVerified:false`、`adapterObservationKind:derived-adapter-observations`。原核的 receipt 字段即使叫 `capturedReturns`，本服务提供的是派生 adapter 值，不是内存捕获。将计算请求交给新 writer 不会提升为原生入账认证。

固定单城的 owner、payer、完整驻城名单、技能筛选、地图邻接、稳定 helper、完成设施匹配、容量、实际 credit/debit、自然治安写回、日历、RNG tape 与事务回滚均为具名 provisional 工程政策。既有公开 listing 仅支持局部调用顺序，不提供这些新状态归属的认证。

### 1.1 初始化场景字段

所有对象封闭，遗漏或额外字段拒绝。仅接收普通 Object/null 原型对象、标准稠密 Array 和有限 JSON 值；禁止 accessor、symbol、隐藏字段、自定义原型、循环、undefined、NaN、Infinity 和负零。primitive 数值逐项要求安全整数，布尔值不能充当数值。派生核收据允许有限非整数，以无损保存合法 binary32 值。任意有副作用的 JavaScript Proxy 不属于数据对象合同，不能把描述符校验理解为隔离任意代码的沙箱。

| 字段 | 支持域与意义 |
|---|---|
| `schemaVersion`、`profile` | 固定1、`standalone-city-finance-v1` |
| `date` | `{year:1..9999, month:1..12, day:1|11|21}` |
| `turn`、`advanceLimit` | turn为非负安全整数；limit为1..360，且 `turn+limit` 不得超过安全整数。整个请求日历区间须不超过9999年 |
| `initialDateAlreadySettled` | 必须true；创建时不补发当前日收入 |
| `activeForceId` | 必须等于 city.ownerForceId，后续没有转移命令 |
| `difficulty`、`controller` | 仅normal/super、player/ai。收入adapter normal→1，super→2。Easy仅被新服务拒绝，旧金核0域不变 |
| `city` | 下表的完整唯一城市 |
| `baseProduction` | `{baseMoneyWord,baseFoodWord}`，分别0..65535。是真实输入的基础产值，不是调用者预先算好的最终收入 |
| `facilities` | 恰好30槽，null明确空槽；非空槽完整定义见§2 |
| `completeResidentRoster` | 必须true，明确声明 officers 是本场景全部驻城工资人员，不允许用省略人员绕过未知工资 |
| `officers` | 0..80名；每人有唯一id及唯一officeId，详细见§5。允许真实声明的空名单 |
| `prisonerCount` | 必须0；非零整体拒绝，不实现先收部分俘虏费 |
| `hasAdministrativeReform` | 独立已解析 boolean，表示技巧0x22效果，不连接技巧研究任务 |
| `monthlyHarvestInputs` | 推进区间每个未来月初恰一条，按年月递增；含year、month、postMonthlyHarvest boolean，false也必须写明 |
| `rng` | `{kind:"bounded-tape-v1",draws:[{bound:100|3,value}],cursor:0}`，0≤value<bound，最多720条，仅季初治安消费 |
| `policies`、`catalogs` | 完整注册参数及完整固定目录快照，逐字段比较，不能只提交ID或digest |

稳定ID为1..64个ASCII字符，首字符字母/数字，后续可用字母数字及 `_ . : -`。对象key顺序无意义；设施槽、人员原顺序、技能数组、目录行、命令历史和随机带的数组顺序保留。发薪及技能持有者收据单独按ID的代码单元顺序排序，不依赖系统locale。

### 1.2 城市字段

- `id`、`kind:"city"`、`ownerForceId`：唯一城市身份及固定拥有者。港、关和跨城账户不支持
- `gold`、`goldCapacity`，`food`、`foodCapacity`：0≤余额≤capacity≤1,000,000,000，容量是显式场景参数，不称原作上限
- `security`：0..100；原核U8更宽的输入域不因此改变
- `troops`：0..150,000，场景内固定，仅用于军屯计算；不征兵、不扣军粮
- `inventory`：必须恰含键1/2/3/4，各为 `{quantity,capacity}`，0≤quantity≤capacity≤1,000,000。这四种是数量型兵装，不包括件数型兵器、舰船
- `specialtyEquipmentTypes`：1..4的无重复数组，代表本场景给定资格，不是原生城市特产 getter 恢复
- `governorOfficerId`：null或完整名单中的一员。太守是显式关系，人员的工资角色仍是普通有官薪者；不会由官职分配API自动推断，也不会产生君主工资规则

### 1.3 丰作完整区间

`monthlyHarvestInputs` 表达0058F4E0之后外部已解析的当月 primitive；不计算灾害生成、持续时间、概率，不把scheduled标记自动转成current，不应用蝗灾或疫病损失。

创建时逐旬推导整个limit区间，枚举所有将进入的月初。输入须和枚举逐项相同，没有重复、遗漏、区间外或乱序项。初始日期已经结算，不要求给初始月再发一项。`harvestCurrent`初始null，只在成功进入月初时更新为对应条；11/21日保留它但不消费它来发粮。日历全部溢出边界在收入和历史重算前核对。

## 2. 30设施槽、固定表和邻接

每个非空槽为 `{id,kind,level,complete,position:{q,r}}`。同城设施ID和占用坐标都不得重复；q/r为[-1,000,000,1,000,000]整数。`complete`是独立服务完成状态，不冒充native validator。没有施工/移动/升级命令，30槽整个场景固定。

| kind | level | 核typeWord | 金基础产值 | 粮基础产值 |
|---|---:|---:|---:|---:|
| market | 1 | 31 | 100 | 0 |
| market | 2 | 50 | 120 | 0 |
| market | 3 | 51 | 150 | 0 |
| farm | 1 | 32 | 0 | 1500 |
| farm | 2 | 52 | 0 | 1800 |
| farm | 3 | 53 | 0 | 2250 |
| mint | 1 | 38 | 0 | 0 |
| granary | 1 | 39 | 0 | 0 |
| large-market | 1 | 46 | 300 | 0 |
| fish-market | 1 | 47 | 200 | 0 |
| black-market | 1 | 48 | 80 | 0 |
| military-farm | 1 | 49 | 0 | 1500 |
| forge | 1/2/3 | 0（adapter忽略哨兵） | 0 | 0 |
| stable | 1/2/3 | 0（adapter忽略哨兵） | 0 | 0 |

forge/stable的0不声称原生类型编号，只保证金粮核走忽略分支。固定目录见[设施表](../../data/catalogs/city-finance-facilities-v1.json)，不能传入自定义产值扩大安全域。

完成设施传 `constructionWord=1`，未完成传0。普通market/farm升级中的L2按L1、L3按L2由既有核回退；未完工L1及未完工特殊设施不生产。adapter不提前把回退结果转换成最终收益。

政策 `supplied-axial-complete-support-v1`：六角距离为 `max(|dq|,|dr|,|dq+dr|)`；距1且complete的mint给普通市场支持，granary给普通农场支持，多座仅取boolean存在。满足普通市场/农场消费路径时才附邻接字段，包括未完工L2/L3回退；未完工L1、忽略类型、特殊市场、军屯都不附未消费字段。军屯只有完成时给粮核 `cityTroopsWord`。这只是给定地图的政策，不恢复原地图/查表/邻接helper。

金输入现由[私有适配叶](../engine/finance-money-payroll-phases.md#3-金核输入的完整映射)生成，固定s.facilities与全部18行映射保持不变，不在snapshot增加动态设施。每个非空先查kind/level，再生成完成字和条件邻接；仅market且complete或level>1时附adjacentMint（false也明确保留），其他路径完全省略该键。resolvedTypeRows始终含六行valid=true：31=100、50=120、51=150、46=300、47=200、48=80，不删未消费行。normal不附cityPlayerPredicate，super才附真实player boolean；securityByte取本旬季降前治安，不追加新clamp。

### 2.1 金钱核在此域的具体计算

1. 从baseMoneyWord开始累加所有有效设施贡献；普通市场有mint时贡献 `floor(3Y/2)`，否则Y；大型/鱼/黑市不吃mint
2. `rawMoney = baseMoneyWord + Σ贡献`，`scaledRaw=rawMoney×100`
3. normal：`difficultyAdjusted=scaledRaw`。super player取75、AI取125，`difficultyAdjusted=floor(scaledRaw×percent/100)`
4. `effectiveSecurity=max(50,securityBeforeIncome)`
5. `securityAdjusted=floor(difficultyAdjusted×effectiveSecurity/100)`
6. 原核返回 `M=floor(securityAdjusted/100)`。逐步取整保留，不用一次总乘后round替代

### 2.2 粮食核在此域的具体计算

1. 普通农场有granary时贡献 `floor(3Y/2)`，否则Y
2. 完成军屯贡献 `floor(max(15000,troops)×1500/15000)`，不吃谷仓；其乘法在本域不回绕
3. `rawFood=baseFoodWord+Σ贡献`
4. normal percent100；super player75、AI125。`D=floor(rawFood×percent/100)`
5. `F=floor(D×max(50,securityBeforeIncome)/100)`。旧粮核的signed向零步骤在此非负安全域等于floor

### 2.3 安全域为何无需clip

- 任意设施金贡献≤300，rawMoney≤65535+30×300=74535；最坏 `raw×100×125=931687500`。治安≤100，后续乘法仍在signed32正范围
- 军屯乘积≤150000×1500=225000000，单槽≤15000；rawFood≤65535+30×15000=515535
- 粮难度调整≤644418，治安乘积≤64441800，返回≤644418，丰作三倍≤1933254，均为安全非负signed32
- 所有核仍真实被调用并检查 supported；失败、负返回、非安全整数或signed/U32视图不一致均拒绝，不用0掩盖。放宽目录/兵力/治安须另立profile或重做支持域说明

## 3. 旬、月、季、年的唯一推进规则

命令恰为 `{id,expectedRevision,command:{type:"AdvanceFinanceTurn"}}`；没有日期、推进数量、最终税金、工资和、太守损失或最终特产量字段。

日历唯一转移：1→11→21→下月1；12月21→下一年1月1。每次成功turn/revision/advancedCount各加1，lastSettledDate设为新日期。到limit拒绝；即使有足够资源，也不允许越过有限区间。创建日1不发当月收入，直到真正进入下一月初。没有AP恢复、AP成本、人物行动标记或对O04的任何隐式变更。

全部工作写在分离候选里；最终预算也通过后才返回新state。任一步拒绝，原对象、日期、治安、RNG cursor、库存及接受历史全不变。调用者应显式用成功返回的state继续，函数不会就地修改旧state。

### 3.1 每次共通顺序

1. 完整场景/政策/目录/genesis/接受历史/当前snapshot全部重算校验
2. 解析命令；先查ID幂等。相同ID与完整envelope相同返回原receipt，顶层duplicate=true、committed=false；不能再次推进。相同ID但expectedRevision等任何字段不同拒绝
3. 新ID检查expectedRevision、历史上限、advanceLimit、turn和日历
4. 从完整固定名单重新推导四种技能boolean和按ID排序的持有者列表；多名同技能不叠加
5. 新月取唯一显式丰作primitive；固定本次 `securityBeforeIncome`
6. 按下述顺序结算。不同政策的“顺序”不等于原helper稳定性或native调度已认证

### 3.2 11日和21日

- 无征税：money/food/salary/specialty/security都明确not-due，不为了生成0而调用收入核
- 有征税：调用金核取得M，H=floor(M/2)，只作一次金credit H
- 富豪不在11/21触发；米道、月薪、月特产、季降也不触发

### 3.3 月初1日的严格顺序

先城市金→城市粮→季初治安→正常足薪→特产1、2、3、4。本批排除的港关和原未知后果处理不会被伪造为空的native调用。

A. 金：调用金核得M。征税在场则H=floor(M/2)，否则H=M；先独立credit H。富豪在场再独立credit floor(H/2)。富豪基数是请求H，不是cap后的actualDelta，也不是总金收入。

B. 粮：月∈{1,4,7,10}为季初。只有季初或征收在场才调用粮核得F；否则明确not-due。把F、丰作boolean与征收boolean映射给月粮核：先 `G=丰作?floor(3F/2):F`，后 `J=征收?floor(G/2):G`，credit J。只有季初且米道在场，另credit floor(J/2)；非季初即使征收+米道也无米道bonus。F=3且丰作+征收时为floor(floor(9/2)/2)=2，交换顺序会错误变1。

C. 季初治安：本次金粮一直用下降前治安，不回算已入账项目；下降影响后续旬次收入，见§4。

D. 足额工资：用所有已cap的真实gold判断；工资总和≤余额才精确扣全额，相等时合法归零。不足整次Advance失败，包括刚计算的金粮、治安和RNG全部回滚，见§5。

E. 特产：工资成功后，按1→2→3→4处理，见§6。失败也不保留前面任何兵种的部分入库。

技能表：wealthy=富豪，rice-way=米道，taxation=征税，levy=征收。四者由固定同城同势力名单的incomeSkills存在性得出，无调用者最终加成参数。

### 3.4 金／工资抽取仍按原时点结算

每旬都先复制并按ID代码单元排序完整名单，在技能effects之后解析完整工资items/sum，再找太守、选择harvest并检查缺项。查薪不是只有月初才做，也不延到发薪位置。harvestCurrent更新在金阶段之前；只有粮阶段里的harvest乘数、粮写入和季降/RNG位于金阶段与工资之间。

金阶段无due时先返回，不读设施成员、不查表、不调用核、不读gold/capacity；富豪单独不能触发非月初收入。due且M=0则仍真实调用金核，保留完整input/result/evidence与money-base零credit。月初有富豪时，bonus请求或accepted为0也保留该笔write。money、food、季降/RNG、工资、特产1→4的原位分离确保missing-harvest-input早于金错误，RNG缺项/错bound早于工资不足，工资不足早于任一特产核或库存错误。

两个私有阶段均写owner clone后的同一个真实candidate city.gold；不是副本钱包或提前算好的可支出余额。完整公开收据只接回原kernel、salary及逐笔write，不存private阶段包装。详细接口、写域与静态同值说明见[金收入与完整工资阶段](../engine/finance-money-payroll-phases.md)。这只提供兼容复用准备，没有接合动态市场建设或月收入。

## 4. 季初治安与随机带

具名政策 `seasonal-security-bounded-tape-v1`，只在1/4/7/10月1日运行。引用[治安§10.8–10.10](02-economy.md#108-季初自然下降)的公式和整备政令摘要；本批未另行复核原helper，因此不将这一段标为新exact核。

1. 有整备政令则先取bound100的一枚；value<50整次跳过季降，不再取bound3。value≥50继续。无整备不消费bound100
2. 其余路径取bound3的一枚，0/1/2。太守存在则C=charm，不存在C=0
3. `base=floor(max(1,90-C)/10)`，`requestedLoss=min(5,base+roll3)`
4. `actualLoss=min(securityBefore,requestedLoss)`，`securityAfter=securityBefore-actualLoss`，下限0

| 魅力C | 未被整备跳过的requestedLoss |
|---:|---|
| 81..100 | 0/1/2 |
| 71..80 | 1/2/3 |
| 61..70 | 2/3/4 |
| 51..60 | 3/4/5 |
| 41..50 | 4/5/5 |
| 0..40，含无太守 | 5/5/5 |

即使无太守或C很低而结果必5，本服务仍消费一枚bound3。tape本身不产生概率分布，不保证给定数据均匀；“50%”是原规则摘要，value<50是本服务确定性适配。RNG缺项/错误bound拒绝整旬；preview只在分离候选消费。原PRNG、early-return随机消费顺序、writer下限及原子消费没有被认证。

## 5. 完整驻城有官薪人员与月俸

每人字段：id、forceId、cityId、role、officeId、politics、charm、incomeSkills。role必须ordinary-officer；officeId为0..79且存在固定[有名官职目录](../../data/catalogs/named-offices-v1.json)；politics/charm各0..100；incomeSkills为四技能的无重复子集。同一人和同一官职不能重复。每人必须在本城且forceId等于固定owner/activeForce。

名单不能含君主、无官、entry80、null官职、俘虏、外出、身份或工资未知者；不得把他们按0薪处理。governorOfficerId只在这些普通有官薪者内选。支持空名单，不代表其他人员可以隐身省略。任免、资格/爵位、升降官、统率奖励和忠诚处理均不在本服务内。

### 5.1 完整80项月薪表

以下直接列出named-offices-v1的officeId、名称、monthlySalary；不把统兵数或官职加成当工资。目录还保留其完整源资料与其他字段，但本服务只按明确monthlySalary逐人取值。

| officeId | 官职 | 每月金 |
|---:|---|---:|
| 0 | 丞相 | 60 |
| 1 | 司空 | 60 |
| 2 | 太尉 | 60 |
| 3 | 司徒 | 60 |
| 4 | 大都督 | 55 |
| 5 | 衛將軍 | 55 |
| 6 | 驃騎將軍 | 55 |
| 7 | 車騎將軍 | 55 |
| 8 | 光祿勳 | 50 |
| 9 | 大司農 | 50 |
| 10 | 廷尉 | 50 |
| 11 | 衛尉 | 50 |
| 12 | 征東將軍 | 50 |
| 13 | 征南將軍 | 50 |
| 14 | 征西將軍 | 50 |
| 15 | 征北將軍 | 50 |
| 16 | 尚書令 | 45 |
| 17 | 太僕 | 45 |
| 18 | 太常 | 45 |
| 19 | 大鴻臚 | 45 |
| 20 | 鎮東將軍 | 45 |
| 21 | 鎮南將軍 | 45 |
| 22 | 鎮西將軍 | 45 |
| 23 | 鎮北將軍 | 45 |
| 24 | 中書令 | 40 |
| 25 | 御史中丞 | 40 |
| 26 | 執金吾 | 40 |
| 27 | 少府 | 40 |
| 28 | 安東將軍 | 40 |
| 29 | 安南將軍 | 40 |
| 30 | 安西將軍 | 40 |
| 31 | 安北將軍 | 40 |
| 32 | 秘書令 | 35 |
| 33 | 侍中 | 35 |
| 34 | 留府長史 | 35 |
| 35 | 太学博士 | 35 |
| 36 | 左將軍 | 35 |
| 37 | 右將軍 | 35 |
| 38 | 前將軍 | 35 |
| 39 | 後將軍 | 35 |
| 40 | 謁者僕射 | 30 |
| 41 | 都尉 | 30 |
| 42 | 黄門侍郎 | 30 |
| 43 | 太史令 | 30 |
| 44 | 軍師將軍 | 30 |
| 45 | 安国將軍 | 30 |
| 46 | 破虜將軍 | 30 |
| 47 | 討逆將軍 | 30 |
| 48 | 郎中 | 25 |
| 49 | 從事中郎 | 25 |
| 50 | 長史 | 25 |
| 51 | 司馬 | 25 |
| 52 | 平東將軍 | 25 |
| 53 | 平南將軍 | 25 |
| 54 | 平西將軍 | 25 |
| 55 | 平北將軍 | 25 |
| 56 | 太楽令 | 20 |
| 57 | 大倉令 | 20 |
| 58 | 武庫令 | 20 |
| 59 | 衛士令 | 20 |
| 60 | 牙門將軍 | 20 |
| 61 | 護軍 | 20 |
| 62 | 偏將軍 | 20 |
| 63 | 裨將軍 | 20 |
| 64 | 主簿 | 15 |
| 65 | 諫議大夫 | 15 |
| 66 | 侍郎 | 15 |
| 67 | 中郎 | 15 |
| 68 | 忠義校尉 | 15 |
| 69 | 昭信校尉 | 15 |
| 70 | 儒林校尉 | 15 |
| 71 | 建議校尉 | 15 |
| 72 | 左僕射 | 10 |
| 73 | 右僕射 | 10 |
| 74 | 典農校尉 | 10 |
| 75 | 議郎 | 10 |
| 76 | 奮威校尉 | 10 |
| 77 | 長水校尉 | 10 |
| 78 | 破賊校尉 | 10 |
| 79 | 武衛校尉 | 10 |

### 5.2 发薪与不足

每旬按稳定ID代码单元顺序逐行查表，在harvest选择/缺项检查之前生成完整items；全部行完成后才以+0为初值reduce得 `salarySum=Σ monthlySalary`。resolver不再次排序、不筛掉人员、不改目录名称字形，首个缺行仍拒绝。80项唯一官职全取时精确总额为2620；4800只是80×60的保守上界。

发薪阶段与查表分离。非月初仍有完整items和sum，status=not-due、availableBeforeSalary=null、paid/shortfall=0，无debit，也不读取余额作affordability判断。月初先完成当月收入credit、容量弃置与季降/RNG，再取 `availableBeforeSalary=gold`。salarySum≤available时全额扣除，相等合法精确归零。真实空名单items=[]、sum=+0仍记录paid和完整零debit，actualDelta显式+0，不跳过、不产生人员现金钱包。没有新增非空名单下限、工资保留金、W>0门或部分工资。

若不足，返回 `unsupported-salary-shortfall`，只附只读 `{required,available,shortfall}` 提案；原state一字不改。不使用部分支付、clamp到0或自动补款。

[原规则§8.10–8.13](03-personnel.md#810-官职俸禄是每月支付不是每季)与listing说明足额扣全额；不足跳过正常工资扣款并进入另一个后果链。**整个Advance回滚是 `atomic-month-reject-shortfall-v1` 的新服务政策，不是原作实际行为。** 本批无俘虏前提使本场景俘虏费用为0；不会调用俘虏helper、欠薪prepare/finalizer，也不虚构全员掉忠或释放行为。

## 6. 月特产四类兵装

月初工资成功之后按equipment 1/2/3/4独立处理。非月初所有项目not-due；无太守时全部no-governor且不调用特产核，来自月listing先校验太守的顺序（00590A47..00590A64）。

- 不在给定specialtyEquipmentTypes集合：只给核 `specialtyEaxU32=0`，不传slots或politics；结果not-specialty，无数量请求/写入
- 在集合内：`specialtyEaxU32=1`。null槽映射validity=0且无completion；其他槽validity=1，complete且匹配设施时completion=1，否则0
- 设备1/2/3匹配forge，4匹配stable。完整设施每座仅计1，等级不另加权。这是 `documented-matching-complete-facilities-v1` 政策，未恢复0049CFB0内部
- count=0：不传politics，no-completed-facilities，无数量请求/写入
- count>0：传同一太守politics给核；保留原算术profile `comment-f32-rne-trunc-v1`

### 6.1 数量公式与浮点边界

| 完成数n | factor保存前表达式 |
|---:|---|
| 1 | 1 |
| 2..3 | 1+(n−1)×0.5 |
| 4..7 | 2+(n−3)×0.25 |
| 8..30 | 3+(n−7)×binary32(0.1) |

常量假设word依次为half=0x3F000000、one=0x3F800000、quarter=0x3E800000、two=0x40000000、tenth=0x3DCCCCCD、three=0x40400000。只有因子一次binary32 round-to-nearest-even保存；其余有限域的dyadic乘法由既有核保留，不每一步round32。

`politicsTerm=floor(politics/2)+60`；`scaled=politicsTerm×storedFactor×3`；假设未知converter向零截断，最后核数量请求cap1500。常量来自源COMMENT，converter仍未知，不能升级为原生等价。

重要：政治80且count8，factor bits0x40466666=3.0999999046325684，scaled=929.9999713897705，核请求929，不能把它“修正”为930。receipt完整保留factorValue/scaledValue等合法派生小数；primitive输入仍只收规定整数。

### 6.2 请求cap与库存cap分开

核的1500上限只限制一次数量请求。随后由本服务各兵种显式inventory.capacity独立饱和credit。每个兵种分别留下kernelQuantityRequest、before、accepted/actualDelta、discarded、after、cap；不得将核数量直接称原生实际入库。

本次不发AP/金成本、行动完成标记、XP、功绩或技巧点。特产不触发其他服务的普通生产任务或完成奖励。

### 6.3 兼容私有抽取

月特产的单兵种处理提取为[私有阶段](../engine/monthly-specialty-phases.md)。这只复用本服务已经存在的月产规则，不新增动态forge月产接合、公开命令、场景字段或政策版本；设备4的stable路径完整保留。

财政owner仍从新日期判断是否月初，从按ID排序的完整同城同势力工资名单解析太守，并使用genesis场景固定的30设施槽。工资成功后仍按1→2→3→4逐设备调用；每个设备先调用核、检查数量、写当前分离候选库存，再按原序追加writes和specialty，才处理下一个设备。日期、RNG和事件仍在原owner位置结算，不先计算四个核再批量写入。

- 非月初先返回not-due，即使太守为null也不变；月初无太守返回no-governor，两者均不调用核或读取库存数量
- 有太守但非特产仍调用原核一次，仅含profile、arithmeticProfile、equipmentType、specialtyEaxU32四字段，不附slots/politics
- 特产输入按索引0..29逐一映射全部槽，不补空、不截短、不重排。非空但未完成或不匹配仍为validity1/completion0；映射全部槽后才以原匹配完成谓词计数
- count=0不读取政治且不附politics；count>0只取同一已解析太守的0..100 politics原值。等级、施工XP、人员行动、预留或普通Produce条件不参与计数
- 生产请求按顺序检查signed数量为安全整数、非负、非负零，再要求与U32相等且≤1500；credit入口再次检查安全整数/非负/非负零。之后计算accepted=min(requested,capacity-before)，要求accepted为安全整数且≥0
- 只有该设备全部检查成功才写stock.quantity=before+accepted。before/capacity来自此时的真实候选库存；满仓和capacity0仍调用核，保留原请求、accepted0及discarded=requested，不把实际入库数覆盖核请求

该阶段只接收一个库存target，唯一可写字段为quantity，不持有整张state、clock、history或公开callback。较后设备失败时，先前设备、收入、工资、治安和RNG仍只存在于被丢弃的整旬候选中，不部分提交。private返回包装不进入对外receipt或保存；旧错误类别、首错顺序及全输出预算不因抽取改变。

## 7. 有序writer与资金恒等式

所有正向资源写入使用 `saturating-positive-credit-v1`：

- `accepted=min(requested,cap-before)`
- `after=before+accepted`
- `discarded=requested-accepted`

请求必须非负，空cap或满cap仍保留该次请求、accepted0与完整discarded。月金base和富豪、月粮base和米道分别写，不合并丢弃记录。bonus总以base请求计算，即使base已被cap全丢弃也不改bonus请求。

金阶段先base成功写gold，再从同一当前gold独立计算bonus的容量；工资读取两笔clip后的实际gold。不能先把收入减工资得到净额后一次clip，也不能以accepted代替富豪的requested基数。每笔credit完整保留resource/reason/before/requested/accepted/actualDelta/after/cap/discarded/writerPolicyId及原次序；请求0或accepted0仍保留，不产生-0。

发薪使用 `exact-affordable-salary-debit-v1`，accepted=requested=sum，actualDelta=−sum，discarded=0。季降的requested是损失幅度，accepted为实际损失、actualDelta为负；底限未接受部分以discarded记录，cap100与floor0同时由政策界定。零损失/零薪的actualDelta为规范+0。

城市金：`afterGold=beforeGold+ΣacceptedMoneyCredits−salaryPaid`。每条credit有 `requested=accepted+discarded`。粮/各兵装同理且本批无消耗debit。收入是明示的新资源来源，不称无中生有的“守恒”；容量弃置是独立sink。工资是从城市流出，不自动转入人员钱包。

`writes`按实际顺序排列，含resource、reason、before、requested、accepted、actualDelta、after、cap、discarded、writerPolicyId。没有凭空假定native writer返回值，因此不伪造returned字段。

## 8. 状态、完整收据、保存及重放

### 8.1 state和snapshot

state顶层为tag=`city-finance-state-v1`、schemaVersion1、profile、scope=`independent-fixed-owned-city`、完整policies/catalogs、policyDigest/catalogDigests、genesis、snapshot、acceptedCommands。

- genesis含完整primitive scenario及创建时snapshot；初始date已结算，revision/advancedCount/rngCursor=0，harvestCurrent=null
- snapshot含schemaVersion、profile、revision、advancedCount、date、turn、city、officers、harvestCurrent、rngCursor、lastSettledDate
- acceptedCommands只含真实新ID成功项 `{envelope,receipt}`，按提交顺序。失败和重复请求不增加历史
- digest为对象key排序、数组顺序保留的canonical JSON UTF-8 SHA-256；完整政策和目录仍须保存，digest不替代完整比较

### 8.2 成功receipt

每张原始receipt的duplicate固定false。重试会返回同一内容，重试状态由API顶层duplicate=true表达，不修改原历史。

收据含：命令ID；前后revision/date/turn；city+新日期settlementKey；完整effective policies、policyDigest和catalogDigests；sourceBoundary；固定ownerSnapshot、payerCityId、稳定payrollOfficerIds；四技能boolean及holderIds；当月harvestInput或not-due；securityBeforeIncome；money/food/monthlyFood核完整派生input和完整result；有序writes；security全过程；salary逐行officeId/名称/catalogSalary、sum、availableBeforeSalary、paid、shortfall0及payerPolicy；四兵种eligibility/count/arithmeticProfile/数量请求/kernel/write；rngBefore/After与每枚draw的index/bound/value/purpose；服务语义events。

核未执行时记录 `{status:"not-due",reason}`，不伪造成功值0。治安未走的adminRoll/lossRoll明确null；非季初charm为null；无太守季降采用C0。salary在非月初仍列完整名单/目录总和，但status=not-due、paid0、availableBeforeSalary=null。四兵种明确区分not-due、no-governor、not-specialty、no-completed-facilities与production。

私有抽取后，每项specialty仍仅含equipmentType、eligibility、count、arithmeticProfile、kernelQuantityRequest、kernel、write七字段，顺序和null分支不变。called包装保留完整原input和整个原result，包括observations的条件性30槽、capturedReturns原序、完整arithmetic、quantityRequest和evidence；合法factorValue/scaledValue小数不做整数化。production的write与全局writes中对应行是同一对象，包含resource、reason、before、requested、accepted、actualDelta、after、cap、discarded、writerPolicyId全部字段。原核evidence全部false标志不因外层库存写入而升级，adapterObservationKind仍为derived-adapter-observations。

金阶段的called仍保留status/api/profile/adapterObservationKind/input/result六字段，input为实际完整核输入，result为同一原返回对象。30槽每项index/facilityTypeWord/effectiveType/status/moneyYieldWord/mintApplied/contribution、五项intermediates（normal difficultyProduct=null）、returnedIncome与全部19项evidence均不删减。salary逐人四字段、全部政策/目录与digest原样；private ok/failure、facts和target不进入receipt/state/save。外层gold写入不升级金核incomeWriterIntegrated或其他原false证据。

事件只有finance-turn-settled、finance-month-settled、finance-quarter-settled及settlementKey。不是native完成通知，不产生迁移、归属、释放或任务事件。

### 8.3 每个公共入口都重建

create校验完整场景和预算。preview/execute/save/load均从初始primitive重新构造初始snapshot，逐个重新执行接受envelope，逐字段比较完整receipt，再比较最终snapshot。连genesis.snapshot本身也不被信任。owner/payer/工资行、日期、余额、RNG、治安、结算键、政策参数、目录薪资任一改动与重算不符均拒绝。只改最终gold再重算一个hash不能通过。

这是确定性一致性校验，不是带秘密签名的来源认证；一个自洽但整体替换成另一个合法场景的文件不可能仅凭内部重算证明原来是谁创建的。

save输出canonical JSON。load使用有界JSON parser，按解码后的对象键拒绝重复键（包括转义别名），然后同样完整重算。对象键重排等价，数组不能重排。保存不读系统日期、不联网、不访问“当前main”，完整快照必须匹配此版本固定注册内容，不拉取最新默认政策。

preview和execute复用同一个resolver与完整execute输出预算。preview committed=false，只返回receipt与projectedSnapshot；没有可被信任导入的最终state凭据，调用者仍需执行并接收新state。重复相同ID+完整envelope返回旧receipt且不受当前revision/limit耗尽影响；相同ID更改expectedRevision也属冲突。

月特产私有抽取保留所有公共函数及公开unknown边界、原schema/profile/tag、政策/目录和digest、完整history与保存字段；无存档迁移或新save格式。初态不变、单步逐字段对应、接受历史逐项重算、重复返回旧receipt的关系维持原合同。此处为源码静态兼容说明，未运行save/load、preview/execute或trace验收。

金收入与完整工资兼容抽取同样保留6 API、15公开类型、5常量、unknown输入和原Frozen输出。静态归纳从未变初态开始：逐槽适配、排序/查薪、分支和writer同值，未改粮/季降/特产读取同值候选，因此每个接受prefix完整snapshot/receipt及最旧/最新duplicate返回均保持。旧预算收到相同JSON值，canonical UTF-8、节点、深度、数组与键数随之同值；这是源码论证，未执行序列化或测量。

save原本仅在重建后budget(state)，再输出canonical(state)，没有额外budget({ok:true,json})的escaped SaveResult门；本次不暗加该门。原字符串与再次转义后的内容同值，不等于旧实现已限制所有外层逃逸包络。新市场owner的完整预算须另行建立，不能借用此兼容说明。

### 8.4 trace与失败尝试

trace tag=`city-finance-trace-v1`，包含scenario、attempts、expectedFinalSnapshot。每个attempt有envelope和expectedOutcome（允许null）；最多1080项。期望成功值为 `{ok:true,duplicate,receipt}`，期望失败值为 `{ok:false,reason}`。expectedFinalSnapshot允许null。

每项先独立得出真实结果再核对expectedOutcome，期望不驱动状态。失败时保持前一state，可继续检查后续请求；重复不重入账。首个期望或结构分歧停止，报告index，不返回部分可继续提交的state。全部一致后返回最终state和outcomes，并再次执行总体预算检查。

### 8.5 有限资源与失败

容量政策：canonical JSON上限64MiB；每次数据遍历最多4,000,000节点，深度48，数组最长1080，单对象最多128键；tape720、成功历史≤360且≤advanceLimit，trace尝试≤1080。所有生成结果也受预算约束，超限拒绝，不截短历史或自动判游戏结束。primitive整数字段均各自限制，特殊核收据的有限派生小数单独保留。没有Node专属API或依赖Node的TS参数属性语法。

失败形状为 `{ok:false,committed:false,reason,index,proposal}`，index为重放历史/trace分歧位置或null；proposal仅不足薪资时为数字说明，其他为null。失败没有写回部分state，不修改调用者对象。

私有月特产阶段返回的失败仅为specialty-kernel:invalid-input/unexpected-field/unsupported-profile/stage-mismatch、unsupported-kernel-return或invalid-resource-boundary，仍在原owner位置交给原Invalid/fail适配。非预期异常不在阶段内捕获或改类，仍由公共边界映射invalid-data；历史index和薪资proposal包装不变。重建初态、每步完整CommandResult、最终state、preview/execute共用结果、save与trace各步及最终完整结果的预算检查全部保留；不因新增内部包装而减少receipt字段或截断历史。

金／工资private失败仍交给owner原唯一Invalid/fail/failure。unsupported-facility、money-kernel的六个原reason、unsupported-kernel-return、invalid-resource-boundary、unsupported-payroll-identity均fail(reason)且proposal=null；工资不足用fail(reason,null,proposal)保留required/available/shortfall。非预期异常不catch为业务失败，仍在公共边界成为invalid-data。reconstruct附原历史index并保留proposal；trace失败ExpectedOutcome只存reason，结构/期望分歧再附外层index，不新增trace proposal。

所有既有预算位置和上限不变：重建初态、每步完整CommandResult后才比receipt、最终snapshot/state、preview/execute共享完整结果、save的state、trace各步完整execution与最终完整ReplayResult。接受历史、数组和审计字段不删减；合法派生小数仍保留，负零、重复JSON键及伪造政策/目录/receipt/snapshot继续由原解析和全fold拒绝。

| 失败类别 | 代表reason / 处理 |
|---|---|
| 结构与数字 | invalid-fields/object/array/data/prototype/number/boolean/id；没有容错截断或默认0 |
| JSON | invalid-json、duplicate-json-key；无重复键覆盖 |
| 范围与身份 | unsupported-schema-profile/state-schema/trace-schema、unsupported-difficulty/controller/city-kind、owner-mismatch、payer-roster-mismatch |
| 工资域 | incomplete-payroll-roster、unsupported-payroll-identity、unsupported-prisoners、duplicate-officer/office、unknown-governor |
| 初始区间 | unsettled-initial-date、calendar-overflow、incomplete-harvest-horizon；整体拒绝 |
| 设施/技能 | unsupported-facility、invalid-facility-slots、duplicate-facility-id/position、duplicate-specialty/skill、unsupported-income-skill |
| 命令 | unsupported-command、command-id-conflict、revision-conflict、advance-limit、history-limit、turn-overflow |
| 随机 | invalid-rng/bound、rng-exhausted、rng-bound-mismatch；不推进cursor |
| 算术 | money-kernel:*、food-kernel:*、monthly-food-kernel:*、specialty-kernel:*、unsupported-kernel-return、invalid-resource-boundary |
| 工资不足 | unsupported-salary-shortfall，整旬回滚且无欠薪后果实现 |
| 保存一致性 | policy-mismatch、catalog-mismatch、genesis-snapshot-mismatch、receipt-mismatch、snapshot-mismatch、duplicate-accepted-entry |
| 重放/资源 | trace-outcome-mismatch、trace-snapshot-mismatch、budget-exceeded |

错误返回首个实际检查发现，不承诺多个同时错误的输入都得到某个特定业务错误优先级。不存在手动CreditIncome、SetGold、PaySalary(sum)、ForceCompleteMonth、通用patch或欠薪repair命令。

## 9. 注册政策目录

完整参数冻结在[city-finance-policies-v1](../../data/catalogs/city-finance-policies-v1.json)并完整进入场景、state与每张receipt。下列ID均有实参，不仅保存标签：

| 政策ID | 冻结的主要参数/作用 |
|---|---|
| finite-ten-day-calendar-v1 | 日1/11/21；季月1/4/7/10；年1..9999；limit≤360；初始已结算；每命令1旬 |
| fixed-owned-city-v1 | kind city；activeForce须拥有；不变更所有权 |
| complete-named-office-payroll-v1 | 完整驻城、同payer；普通role；80唯一官职0..79；无俘虏；ID顺序 |
| stable-income-roster-v1 | 四技能每Advance重新存在性筛选；不叠加；旧治安 |
| supplied-axial-complete-support-v1 | 六角距1；complete；market-mint、farm-granary；boolean支持 |
| documented-income-facility-table-v1 | 30槽、完整产值表、完成1/未完0、升级回退交原核、forge/stable忽略哨兵0 |
| post-monthly-harvest-snapshot-v1 | 完整未来月清单；初始current null；月收入前读取；缺失拒绝；不生成灾害 |
| documented-month-quarter-income-order-v1 | normal1/super2，Easy拒绝；月金→粮→季降→工资→特产；技能时点/基数/逐次floor |
| saturating-positive-credit-v1 | min(request,cap-before)；每条弃置；bonus取请求base；cap由场景给定 |
| exact-affordable-salary-debit-v1 | 表薪求和；cap后判断；禁止部分付；无人员钱包 |
| atomic-month-reject-shortfall-v1 | 不足整Advance含RNG/calendar回滚；不调用native后果 |
| seasonal-security-bounded-tape-v1 | admin100阈值50、loss3；C缺省0；损失公式与floor0；跳过消费策略 |
| documented-matching-complete-facilities-v1 | 四兵种固定顺序；1..3 forge/4 stable；完成每座1；有太守；库存另cap |
| comment-f32-rne-trunc-v1 | 六常量word、四段factor、一次RNE存储、政治项、向零converter、请求1500cap，均完整参数化冻结 |
| bounded-finance-input-v1 | 各资源/兵力/base上限与64MiB/节点/深度/数组/历史预算 |
| canonical-recompute-v1 | schema1、完整政策目录比较、SHA-256、genesis/receipt/snapshot全重算、duplicate JSON key拒绝 |

## 10. 静态场景与纸面推导（没有运行）

[场景](../../data/scenarios/city-finance-example-v1.json)由200年12月21日、turn35开始，最多4旬，未来201年1月和2月丰作状态分别true/false。全部四种技能各有一名普通有官者，office0..3各60月薪，太守政治80/魅力80；8座complete forge、1座stable、市场/造币、大市场、农场/谷仓、军屯共15槽，其余null。该场景是人工提供的独立输入，不冒称原stock初始化。

第一条新ID、expectedRevision0的Advance纸面顺序：

1. 进入201-01-01：M=1000+225+300=1525，征税H762，富豪381；金由10000变11143
2. F=10000+3375+6000=19375；丰作后29062，征收后14531，米道7265；粮由40000变61796
3. 治安使用tape的bound3/value1：base1+roll1损失2，100→98；本次金粮仍按旧100
4. 足额工资4×60=240，gold11143→10903
5. 设备1..3各count8，原核政策请求929；设备4 count1，请求300；库存cap10000均容纳
6. revision/advancedCount=1，turn36，rngCursor1，lastSettledDate201-01-01。重新提交完全相同envelope不重复入账

以上是依据文字规则的纸面计算，不是产品执行输出或测试通过记录。后续11/21只有征税入金；2月1日有征收粮/工资/特产，但无米道季bonus、无季降。没有生成测试文件或运行这些命令。

## 11. 固定来源与继续开放的能力

原公开仓库为[sjn4048/311MemoryResearch固定commit](https://github.com/sjn4048/311MemoryResearch/tree/66e167e40c3440929ec016f3872aefc3486434c1)。金、粮、月度listing及许可证沿用仓库内冻结源，未修改其内容。

- [月度收支原listing](https://github.com/sjn4048/311MemoryResearch/blob/66e167e40c3440929ec016f3872aefc3486434c1/内存资料/整理/Func-收支03-每月钱粮兵装收支.txt)：GBK Git blob `028fae66ba44f70716951edd9fae51420780cea0`，文本44283 bytes、UTF-8文本46993 bytes；所列机器指令572条/1939 bytes。文本大小不能和指令字节数混淆
- [城市收钱listing](https://github.com/sjn4048/311MemoryResearch/blob/66e167e40c3440929ec016f3872aefc3486434c1/内存资料/整理/Func-收支04-计算城市收钱.txt)及[城市收粮listing](https://github.com/sjn4048/311MemoryResearch/blob/66e167e40c3440929ec016f3872aefc3486434c1/内存资料/整理/Func-收支05-计算城市收粮.txt)，其原manifest保留byte/hash/profile详细身份
- [官职公开表](https://w.atwiki.jp/sangokushi11/pages/111.html)与固定ranks/named-offices-v1目录；不扩展为君主/无官工资认证
- 00590536/558/576金；005905D0/609/635粮；00590652季降；005909A3..D3工资；00590A2C..BA7特产。顺序证据和新服务的stable观测/写回政策分栏

仍开放：真实city/owner/人员getter及0049F2A0内部、未知工资身份、native cap/writer返回、技能驻点筛选、原邻接、特产0049CFB0内部、浮点常量/00707A74、丰作生成与scheduled/current转换、原PRNG/调度、stock EXE/原版/跨平台。明确排除港关、俘虏维护/逃亡、欠薪后果、死亡/势力灭亡、native capture/ownership/return/mission以及P078及其依赖。旧原核、旧实验与历史审计不在本批修改范围。

金收入／完整工资的私有抽取没有新增原生证据，原source/stock/native/ABI、43组主题及45份快照边界继续开放。固定财政仍使用原30槽、0..80名册、无工资保留金及原推进范围；新市场建设/动态收入未接合，已有独立forge月产不受影响。此处不能将复用接缝称为新的市场玩法交付，也不关闭P078及其依赖。
