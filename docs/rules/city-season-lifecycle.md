# 独立单城季节 simulation v1

2026-10-18。状态：静态实现候选；产品、示例、测试、typecheck、compile、build、runtime、checker、diagnostic、schema validator 全部未运行。本文的规则推导和反例不是运行结果。

固定基线为 PR86 main `a04ee326fdaa68e930681430352f4d98fee5209e`，tree `df4e2be515e2434e4e64476517c8e58f0d3afaf0`。唯一 profile 是 `single-city-season-simulation-v1`。这是固定单城的独立、有界、可重算 simulation，不能当作原版灾害 scheduler 或现有世界的继续入口。

公共入口的当前集成基线为 PR89 main `0c5ad00667d40960e72f2d8b14c9c20f7eec30fc`，tree `a88a940c92a37c85ac8a827f1f8988ae18401aea`。[src/index.ts](../../packages/engine/src/index.ts)导出本模块全部六API、三个固定快照常量和11个已定义类型，名称与结果schema fragment见[API文档](../engine/city-season-lifecycle.md)。来源manifest继续保留上面的PR86历史读取身份；两个粮核、其两份source依赖与设施catalog在PR89固定基线仍为相同Git blob，详见[SOURCES](SOURCES.md)。当前集成身份不增加原作证据，也不代表跨服务时钟／财政已整合。

## 1. 先去重，再定义新增范围

已有粮核 `calculateCityFoodIncomeProjection` 从已解析30槽计算完整粮 F；已有 `calculateMonthlyCityFoodBaseArgument` 执行丰作→征收的局部参数投影。两者都不生成灾害、不管理其持续，也不负责实际入账。

已有 city-finance 生命周期有固定财政账本和外部 `monthlyHarvestInputs`，后者是调用者已解析的月初丰作 primitive。该服务没有生成疫病/蝗灾/丰作的生命周期。本模块不导入 finance、不修改它的 save、不复制工资、金钱、特产和治安季降代码。仅把灾害后的本城原始30槽和真实兵数送入已存在的两纯核，再在自己的有界余额中记账。旧粮核和已有财政能力不重新计功。

已有 `28-status-duration-recovery` 处理的是部队混乱/伪报的旬计数、状态行为及恢复证据。那些状态不是城市灾害，不得把其70/30候选分布、每旬减1或防御设施加速套用到城市。这里的持续月份完全来自新的季节 policy。

本批只增加：单城月步进、current/scheduled 生命周期、内生固定种子抽样、真实兵粮/健康变化、Lv1农场槽移除及每座30TP、季初丰作实际入粮。没有事件条件查询、评定或野战功能，也没有通用世界执行器。

## 2. 来源事实与新参数分开

固定 `02-economy.md` §11（3328–3645行）的既有来源链给出：

- plague、locust、harvest 三类，current 与 scheduled 两层
- 月初状态处理在粮收入前；当前丰作作用于完整F，随后才进入征收等层
- 风水预防新疫病/蝗灾，不治疗已有 current，不阻挡丰作
- 祈愿提高丰作倾向，但没有已恢复的原始数值
- 疫病降低驻军并恶化武将健康；蝗灾损粮及拆农场
- 已有资料记载 PK Lv1农场被蝗灾拆除扣30TP，Lv3不拆；Lv2边界仍open

该文档的源资料链按原证据等级保留；没有再次打开原生函数、执行原作或把guide行为提高为native writer证明。完整固定文件和该段excerpt身份见[来源绑定](../sources/city-season-lifecycle.json)。Excerpt 的 SHA-256 只绑定片段，不冒充整份文档hash。

政策 `season-simulation-20261018-v1` 的下列数值和时序全部是新simulation选择：

| 项 | 本profile规则 |
|---|---|
| 每个可生成月的发生阈值 | plague 8/1000；locust 13/1000；harvest 21/1000 |
| 至少一名祈愿 | harvest 42/1000，多名不叠加 |
| 提前期 | 本月末生成，下一月初激活 |
| 持续月份 | plague 1..3；locust 1..2；harvest 1..2 |
| 每个有效疫病月的兵损 | 自抽125..375 basis points，floor(troops×rate/10000) |
| 每个有效疫病月每人健康 | draw(1000)<37则健康编码+1 |
| 每个有效蝗灾月的粮损 | 自抽200..700 basis points，floor(food×rate/10000) |
| 每座现存Lv1农场 | draw(3)==0移除，按ID排序，Lv3不抽 |
| 风水门 | 新生成与到期激活双门，旧current不清除 |
| 月序 | 旧current减1→激活→疫病→蝗灾→季粮→生成 |
| 回滚 | 任一不支持后果、TP不足或预算失败，整月拒绝 |

这里的阈值和区间定义算法行为；有限相关PRNG序列不获认证为严格无偏或独立。阈值不读取治安。旧5%/5%/10%、每旬病死5–10%、30%患病、1–2季，以及其他项目50%/3月均未复活为原作常量。

完整 policy、catalog、sources 必须逐字段等于内置注册数据，不能只给ID或hash，也不能在月命令里替换参数。改数值必须另注册版本；已有save仍需完整旧政策。

模块在初始化时建立与共享JSON imports分离的私有深冻结快照；后续比较、生成、标签均只读取该快照，导出的政策/目录/来源常量也是同一冻结快照。其他普通importer之后改共享raw JSON，不会使本模块的注册合同漂移。可信代码与打包资源的初始身份仍属于宿主前提，不能据此承诺防任意模块初始化前的代码/资源替换。

## 3. 完整genesis与支持域

所有输入都是封闭、非Proxy、普通JSON DTO。拒绝未知/缺失字段、undefined、非有限值、不安全整数、负零、accessor、symbol、不可枚举附加字段、自定义原型、稀疏数组、循环及重复ID。对象原型只允许 Object.prototype/null，数组只允许标准Array原型。返回值冻结并与输入分离。反射检查不是防任意Proxy trap的沙箱；宿主须提供未污染的普通realm和非Proxy对象。

| primitive | 支持域 |
|---|---|
| schemaVersion/profile | 1 / single-city-season-simulation-v1 |
| date | year1..9999、month1..12、day恒1 |
| initialMonthAlreadySettled | true，创建时不补收入或伤害 |
| monthLimit | 1..36；整个推进区间加下一月pending的lookahead都必须在9999年内 |
| ownershipFrozen/completeResidentRoster | 必须true；这是输入完整性声明，不是native roster自动发现 |
| unsupportedIncomeSkillsAbsent | 必须true，明确没有需征收/米道/富豪/征税等经济技能处理的场景事实 |
| activeForceId | 必须等于city.ownerForceId |
| city.food | 1..foodCapacity；foodCapacity1..1,000,000,000 |
| city.troops/security/techniquePoints | 1..150000 / 0..100 / 0..10000 |
| baseFoodWord | 0..65535，不接受F/finalIncome/finalLoss |
| difficulty/controller | normal或super / player或ai，Easy不支持 |
| officers | 完整0..80名；固定本城、本势力、ordinary-officer、present；唯一ID |
| health | 0健康、1轻伤、2重伤、3濒死；没有死亡人物 |
| seasonSkills | fengshui/prayer无重复子集；任何未知值拒绝 |
| facilities | 恰30槽，null明确空位；唯一ID及唯一轴坐标 |
| 非空设施 | farm Lv1/Lv3、granary Lv1、military-farm Lv1；complete必须true |
| position | q/r均[-1,000,000,1,000,000]整数 |
| seed | 1..4294967295，0拒绝 |

设施Lv2、未完成设施、其他设施、其他人物身份、外出/俘虏等均整体不支持，不按Lv1/0产量/0伤害代替。普通部队状态、工资、金、特产、人口、伤病恢复、自然治安变化不在这个账本里；需要它们与季节同步的真实场景仍需跨服务账本和时钟整合，不能宣称完整财政。

ID为1..64个ASCII字符，首字母/数字，之后字母数字及 `_ . : -`。对象键顺序无意义；设施槽、roster原顺序、目录数组及命令历史顺序保留。用于健康与拆除的独立处理顺序是ID代码单元升序，不用locale比较。

每类current为 `{remainingMonths:0..3}`，是否有效由>0派生，不能再提交冲突的boolean。初始scheduled为null或 `{activationYear,activationMonth,durationMonths}`；必须只指下一真实月、同类current为0。初始duration仍按本policy类目上限：疫病3，蝗灾/丰作2。允许不同类同时有效。

## 4. 唯一命令和月初流程

命令完整形状为 `{id,expectedRevision,command:{type:"AdvanceSeasonMonth"}}`。不接受推进次数、目标日期、成功、选中事件、持续、损失、目标人物或最终收入。

### 4.1 幂等与候选

先完整验证state并从genesis重算，随后解析envelope。同ID且整个envelope相同，返回原receipt，duplicate=true、committed=false，不检查新的revision、不抽新RNG。相同ID改expectedRevision或任意内容则拒绝。只有新ID才校验revision及月数/历史预算。

所有写入发生在独立candidate。成功只返回新冻结state，调用者显式用它继续；输入对象绝不原地更新。失败不提交日期、计数、种子、cursor、余额、健康、设施或历史。

### 4.2 衰减与激活

推进到下一月1日。每类旧current正数减1，0保持0；再消费到期scheduled。正常激活把duration写入current，激活月就是第一个有效月。比如生成duration=2的pending，激活月计数2并有效；下月减为1仍有效；再下月减0失效。

有风水时，到期plague/locust消费pending并记录prevented-fengshui，current不激活。harvest不拦。风水不会主动清除已有current：初态已有疫病计数2时，下月仍减到1并照常伤害。计数1按正常衰减到0不是风水治疗。

双门时点和衰减顺序是新的工程政策，不宣称原scheduled flag原本如此消费。现有current和同类pending不重叠也是本profile限制，不声称原bit必互斥。

### 4.3 疫病

current.plague>0时，先抽兵损率，按当前真实troops计算floor损失。0损失如实写0，不强制最低1；after<=0则unsupported-terminal-effect，整月回滚。

随后按officerId顺序，每个完整在场人员抽一枚健康roll。命中则health+1，否则保持。3→4涉及死亡边界，整月拒绝；不夹3、不实施死亡处置，也不先保留别人健康变化或兵损。

### 4.4 蝗灾

current.locust>0时，先对灾害阶段当时的真实food抽率并扣floor损失；扣到0或以下整月拒绝，不能靠稍后季粮把非法中间态救回来。

然后按facilityId顺序扫描仍存在的Lv1农场。每座各抽draw(3)，命中0才实际移除它所在槽、记完整removedFacility，并扣30TP。若某一座所需TP不足，前面已计算的全部农场移除、兵粮、健康与RNG都回滚。TP=30可以合法扣到0；TP不足不能夹到0后仍拆。

Lv3完全不抽不拆；谷仓及军屯不受本拆除规则影响。这里的槽移除不触发原设施计数器、任务、callbacks或原世界对象。

### 4.5 季初实际粮收入

只有month∈{1,4,7,10}执行，其他月份income.status=not-due且不调用粮核。使用灾害之后的兵数、剩余设施和同一security，不把拆掉的农场继续计产。

adapter规则沿既有安全财政输入域收窄：

1. farm Lv1→type32/Y1500，Lv3→type53/Y2250；granary→type39（粮核忽略的支持设施）；military-farm→type49/Y1500
2. 所有本域设施complete=true，constructionWord=1；空槽仍null
3. 普通farm距任一complete granary轴距1即支持，多座不叠加。距离=max(abs(dq),abs(dr),abs(dq+dr))
4. 仅普通farm附adjacentGranary；仅存在军屯时附cityTroopsWord；仅super时附cityPlayerPredicate，拒绝靠未消费字段蒙混适配
5. 真正调用旧city-food核；军屯贡献floor(max(15000,troops)×1500/15000)，不吃谷仓；普通farm支持为floor(3Y/2)
6. 核累加baseFoodWord+贡献后，normal百分比100，super player75/AI125；难度层floor后，再以max(50,security)计算完整F
7. 将旧核真实returnedIncomeU32作为harvest叶entryFoodEdiU32；harvestPredicate由本月新current.harvest派生，lateLevyFlagDwordU32恒0。真正调用旧harvest叶，得到J
8. 当前丰作时J=floor(3F/2)，否则J=F；再执行foodAfter=min(foodCapacity,foodBefore+J)。actualDelta=foodAfter-foodBefore，discarded=J-actualDelta

完整两个request、两个receipt（含原evidence对象）、最终posting同时保留，标derived-adapter-observations。adapter条件不是native gate/getter捕获。旧leaf evidence内cityCalculatorCalled=false、incomeWriterIntegrated=false仍描述它自己的局部能力；不会因wrapper调用与本地入账而把旧证据旗标改true。

本域上界：单军屯≤15000；rawFood≤65535+30×15000=515535；难度后≤644418；security乘积≤64441800；F≤644418；丰作3F≤1933254，J≤966627。都是非负安全signed32。核supported=false、负返回、非安全整数、signed/U32或军屯乘积不一致均拒绝，不以0替代。

丰作基数是完整F，不是余额，不是cap后的实际到账。即使粮满导致actualDelta=0，仍保存真实请求J及discarded，不能把0误认原核收益。

### 4.6 生成下一月pending

按plague→locust→harvest固定顺序。尚有current或pending则不生成不抽。风水对前两类直接记prevented-fengshui，不抽。其余draw(1000)<阈值才成功；仅成功后再抽该类duration区间。祈愿只决定harvest阈值，名单多持有者不叠加。

生成只指下一真实月，不在同月立刻造成伤害。月数达到monthLimit可留下pending供查询，不能自动延长、后台激活或靠save/load重新开放有限horizon。创建时额外校验一个月lookahead，所以最终月份也不会写超出9999年的pending。

## 5. RNG修正后的完整合同

具名政策 `xorshift32-nonzero-domain-rejection-v1`，与其他独立服务不共享种子/cursor。

每个raw依次按U32执行 x^=x<<13、x^=x>>>17、x^=x<<5。非零seed始终在raw1..4294967295。设M=4294967295，sample=raw-1，因此sample0..4294967294；draw(B)的limit=floor(M/B)×B，sample>=limit就拒绝重抽，否则value=sample%B。

不能错误地把此PRNG当作覆盖含0的2^32个raw，再套raw%B。B接受1..1000000，B=1仍消耗一枚raw。每个raw包括rejection都消耗4096总预算，全部保留seedBefore/After、cursorBefore/After、raw、sample、limit、rejected。每次draw还保存label、bound、最终value及总前后状态。

只可说：在accepted nonzero raw domain中各余数具有相同原像数。有限、相关的确定序列并不因此严格无偏、独立、密码学安全或原版等价；policy与所有输出边界固定strictlyUnbiased=false、independentDrawsCertified=false。预算不足整月拒绝，没有取模fallback或丢掉rejected word。

preview在隔离candidate抽样；同ID重试不抽；load从原seed重算所有raw和rejection，不相信保存的最终loss/roll。

## 6. 收据、保存和预算

每个数值写入含path、cause、before/requested/after/actualDelta/discarded/policyId。requested是有符号请求差额，actualDelta严格为after-before，discarded=abs(requested-actualDelta)。负损失的floor=0显式用+0，避免产生负零。状态迁移另保留pending before/after、原因；移除另保留原设施与槽。

State保留完整genesis（包括policy/catalog/sources/seed）、snapshot、每条接受的完整envelope及完整receipt。save外壳是 `{tag:"san11-city-season-save-v1",state}`；输出为canonical JSON字符串。load拒绝重复解码key，包括转义后相同的key；随后从genesis逐条执行、比较整份receipt、逐步预算，最后比较完整snapshot/state。没有依赖checksum替代重算，也没有把expectedFinalState注入引擎。

资源预算：接受历史≤256，实际月数≤36，trace attempts≤256，总raw≤4096，单DTO深度≤32、节点≤250000、UTF-8 canonical JSON≤16MiB、数组≤4096、对象键≤256。每个child纯核request/receipt是外围DTO的一部分，没有省略证据以压预算。

提交前同时核：完整state、raw save、escaped `{ok:true,serialized}` 返回、create/load形状、新execute返回、新preview返回，以及当前state配每一条旧receipt的幂等execute/preview返回。后期较小receipt不能令早期较大receipt不可返回。预算失败整月拒绝，不丢历史。

重算仅证明保存内容在这个绑定simulation内部一致。攻击者若连genesis、seed及整段历史一起重写，仍可能构造另一份自洽场景；这不是签名、防篡改来源认证或native等价证明。

## 7. 静态反例清单，全部未运行

- 创建时troops0或food0：拒绝，不夹1
- 未完成设施、farm Lv2、未知seasonSkills或经济技能存在：整体出域
- 健康3的人员本月命中恶化：整月拒绝，之前兵损和抽样不提交
- 两座Lv1农场均被选中，TP只有30：第二座不足导致整月回滚；不是只拆第一座
- 已有疫病remaining=2且有风水：下一月remaining=1继续伤害；新疫病pending则可被激活门阻挡
- 同月plague、locust、harvest到期：按迁移→两灾→剩余设施计算粮→harvest叶→到账，不能先赚粮后算蝗灾
- 粮将满：cap后actualDelta小于J，丢弃量可见，丰作不得改乘actualDelta
- 同ID完全重复：原receipt；同ID只改expectedRevision：冲突；过期revision的新ID：拒绝
- 篡改历史某个raw、removedFacility、核receipt、snapshot或genesis policy：完整重算/绑定比较拒绝，不能只改终态逃过
- 升到horizon后有pending：保存其尚未激活状态，没有暗中补跑
- raw、节点、转义save或任一旧返回超预算：整月拒绝，无有偏fallback

JSON示例只给完整输入，所有expected=null，未生成或声称任何运行收据。以上是代码静态审阅应对照的路径，并非测试已通过。

## 8. 精确保留的E/X

E：原43组、45快照不缩减；C11原概率、祈愿数值、current/scheduled原时序、持续和损失分布、健康RNG、Lv2边界及丰作bug补丁仍开放。native技能getter、设施表/邻接helper、资源writer、原全局调用序、stock/patch身份及原作等价仍未认证。跨服务账本/时钟尚未集成。

X：本profile不接线或实现native ownership/capture、死亡/势力灭亡/继承、native mission-return-finalizers。金钱、工资、特产库存、自然治安变化和其他服务的账本继续在支持域之外。

任何需要这些后果的输入/月份整体拒绝，不能只挑安全字段提交并宣称完整事件已执行。
