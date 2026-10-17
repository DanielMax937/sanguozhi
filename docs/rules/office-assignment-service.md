# 独立官职分配服务：80有名官职、明确资格与可提交计划

版本：`independent-office-assignment-v1`，2026-10-16。实现：`packages/engine/src/office-assignment.ts`；[API](../engine/office-assignment-service.md)、[来源manifest](../sources/office-assignment-service.json)、[静态情景](../../data/scenarios/office-assignment-example-v1.json)。

## 1. 实际能力与不越界的承诺

本服务实际实现三个层次：单个官职selector、多官职plan、整份独立assignment关系的原子apply。不是只输出评分，也不让调用者先填最终assignment来冒充调度。

评分公式、资格调用位置、末级同分规则沿既有selector证据；80行资料目录逐项保留；资格具体条件、候选顺序、多职顺序、既任处理和状态持久化是显式版本化工程政策。它们可被未来版本替换，但本版不提供空callback来掩盖缺实现。

范围只含80个有名一般官职，不是81项原生数组全覆盖。未接入P0-78或native军团、太守、人物归属、capture、return、mission取消及其依赖；没有原生对象writer、AP/金/薪金账本、爵位取得事件、能力getter重建。官职变化不加忠诚、不增属性基值、不支付俸禄、不抽RNG。

## 2. 术语、ID与10个独立爵位元数据

`docs/sources/ranks.json`原表80行没有id，本版固定按原数组index赋officeId=0..79，sourceRowIndex与其一致。每层8职，前4文、后4武，但实际command/bonus/salary逐行读取，不能用文武类别统一推算。

君主爵位是另一类数据：原表每行重复的rulerTitle/citiesRequired/rulerCommand归并为10项rulerTitles；一般官职仅保留name/requiredTier/requiredMerit/command/bonusText/monthlySalary/kind。不可把rulerCommand当一般武将command。

`titleKey=none` 表示君主当前爵位“無”，仍开放最低层8职；它不表示人物没官。人物没任职是assignment关系不存在，查询返回officeId=null。原生内部entry80真实存在但含义未知，不能冒充“无官”sentinel。

| tier | titleKey | 爵位原名 | 新开放ID | 本层功绩 | 原表最少都市（仅元数据） | 君主指挥 |
|---:|---|---|---|---:|---:|---:|
| 0 | none | 無 | 72..79 | 0 | 1 | 10000 |
| 1 | provincial-inspector | 州刺史 | 64..71 | 4000 | 2 | 11000 |
| 2 | provincial-governor | 州牧 | 56..63 | 8000 | 4 | 11000 |
| 3 | yulin-zhonglangjiang | 羽林中郎將 | 48..55 | 12000 | 6 | 12000 |
| 4 | wuguan-zhonglangjiang | 五官中郎將 | 40..47 | 16000 | 8 | 12000 |
| 5 | grand-general | 大將軍 | 32..39 | 20000 | 12 | 13000 |
| 6 | grand-marshal | 大司馬 | 24..31 | 24000 | 14 | 13000 |
| 7 | duke | 公 | 16..23 | 28000 | 18 | 14000 |
| 8 | king | 王 | 8..15 | 32000 | 20 | 14000 |
| 9 | emperor | 皇帝 | 0..7 | 36000 | 24 | 15000 |

累计开放条件为office.requiredTier≤当前title.unlockedTier。因此州刺史用64..79，皇帝用0..79。“新开放ID”不是限制只能用该层。citiesRequired仅展示原表条件；即使都市数量增加，本服务不会取得/升降爵位，也没有cityCount输入字段。

## 3. 全部80行有名官职目录

功绩按每行requiredMerit，不按officeId×4000。月俸禄是目录元数据，本服务无发薪动作。`—`表示原表没有能力加成（JSON为null），不是待推算数值。分类0..3为top-civil；其余id%8≥4为military；其余civil，证据级别reverse-inferred-high。

| ID | 官职原名 | tier | 功绩≥ | 一般指挥 | 能力加成原文 | 月俸 | selector类别 |
|---:|---|---:|---:|---:|---|---:|---|
| 0 | 丞相 | 9 | 36000 | 15000 | 政治+5 | 60 | top-civil |
| 1 | 司空 | 9 | 36000 | 15000 | 政治+5 | 60 | top-civil |
| 2 | 太尉 | 9 | 36000 | 15000 | 政治+5 | 60 | top-civil |
| 3 | 司徒 | 9 | 36000 | 15000 | 政治+5 | 60 | top-civil |
| 4 | 大都督 | 9 | 36000 | 15000 | 統率+2 | 55 | military |
| 5 | 衛將軍 | 9 | 36000 | 15000 | 統率+2 | 55 | military |
| 6 | 驃騎將軍 | 9 | 36000 | 15000 | 統率+2 | 55 | military |
| 7 | 車騎將軍 | 9 | 36000 | 15000 | 統率+2 | 55 | military |
| 8 | 光祿勳 | 8 | 32000 | 9000 | 政治+5 | 50 | civil |
| 9 | 大司農 | 8 | 32000 | 9000 | 政治+5 | 50 | civil |
| 10 | 廷尉 | 8 | 32000 | 9000 | 政治+5 | 50 | civil |
| 11 | 衛尉 | 8 | 32000 | 9000 | 政治+5 | 50 | civil |
| 12 | 征東將軍 | 8 | 32000 | 14000 | 統率+1 | 50 | military |
| 13 | 征南將軍 | 8 | 32000 | 14000 | 統率+1 | 50 | military |
| 14 | 征西將軍 | 8 | 32000 | 14000 | 統率+1 | 50 | military |
| 15 | 征北將軍 | 8 | 32000 | 14000 | 統率+1 | 50 | military |
| 16 | 尚書令 | 7 | 28000 | 9000 | 政治+4 | 45 | civil |
| 17 | 太僕 | 7 | 28000 | 9000 | 政治+4 | 45 | civil |
| 18 | 太常 | 7 | 28000 | 9000 | 政治+4 | 45 | civil |
| 19 | 大鴻臚 | 7 | 28000 | 9000 | 政治+4 | 45 | civil |
| 20 | 鎮東將軍 | 7 | 28000 | 13000 | 統率+1 | 45 | military |
| 21 | 鎮南將軍 | 7 | 28000 | 13000 | 統率+1 | 45 | military |
| 22 | 鎮西將軍 | 7 | 28000 | 13000 | 統率+1 | 45 | military |
| 23 | 鎮北將軍 | 7 | 28000 | 13000 | 統率+1 | 45 | military |
| 24 | 中書令 | 6 | 24000 | 8000 | 政治+4 | 40 | civil |
| 25 | 御史中丞 | 6 | 24000 | 8000 | 政治+4 | 40 | civil |
| 26 | 執金吾 | 6 | 24000 | 8000 | 政治+4 | 40 | civil |
| 27 | 少府 | 6 | 24000 | 8000 | 政治+4 | 40 | civil |
| 28 | 安東將軍 | 6 | 24000 | 12000 | — | 40 | military |
| 29 | 安南將軍 | 6 | 24000 | 12000 | — | 40 | military |
| 30 | 安西將軍 | 6 | 24000 | 12000 | — | 40 | military |
| 31 | 安北將軍 | 6 | 24000 | 12000 | — | 40 | military |
| 32 | 秘書令 | 5 | 20000 | 8000 | 政治+3 | 35 | civil |
| 33 | 侍中 | 5 | 20000 | 8000 | 政治+3 | 35 | civil |
| 34 | 留府長史 | 5 | 20000 | 8000 | 政治+3 | 35 | civil |
| 35 | 太学博士 | 5 | 20000 | 8000 | 政治+3 | 35 | civil |
| 36 | 左將軍 | 5 | 20000 | 11000 | — | 35 | military |
| 37 | 右將軍 | 5 | 20000 | 11000 | — | 35 | military |
| 38 | 前將軍 | 5 | 20000 | 11000 | — | 35 | military |
| 39 | 後將軍 | 5 | 20000 | 11000 | — | 35 | military |
| 40 | 謁者僕射 | 4 | 16000 | 7000 | 政治+3 | 30 | civil |
| 41 | 都尉 | 4 | 16000 | 7000 | 政治+3 | 30 | civil |
| 42 | 黄門侍郎 | 4 | 16000 | 7000 | 政治+3 | 30 | civil |
| 43 | 太史令 | 4 | 16000 | 7000 | 政治+3 | 30 | civil |
| 44 | 軍師將軍 | 4 | 16000 | 10000 | — | 30 | military |
| 45 | 安国將軍 | 4 | 16000 | 10000 | — | 30 | military |
| 46 | 破虜將軍 | 4 | 16000 | 10000 | — | 30 | military |
| 47 | 討逆將軍 | 4 | 16000 | 10000 | — | 30 | military |
| 48 | 郎中 | 3 | 12000 | 7000 | 政治+2 | 25 | civil |
| 49 | 從事中郎 | 3 | 12000 | 7000 | 政治+2 | 25 | civil |
| 50 | 長史 | 3 | 12000 | 7000 | 政治+2 | 25 | civil |
| 51 | 司馬 | 3 | 12000 | 7000 | 政治+2 | 25 | civil |
| 52 | 平東將軍 | 3 | 12000 | 9000 | — | 25 | military |
| 53 | 平南將軍 | 3 | 12000 | 9000 | — | 25 | military |
| 54 | 平西將軍 | 3 | 12000 | 9000 | — | 25 | military |
| 55 | 平北將軍 | 3 | 12000 | 9000 | — | 25 | military |
| 56 | 太楽令 | 2 | 8000 | 6000 | 政治+2 | 20 | civil |
| 57 | 大倉令 | 2 | 8000 | 6000 | 政治+2 | 20 | civil |
| 58 | 武庫令 | 2 | 8000 | 6000 | 政治+2 | 20 | civil |
| 59 | 衛士令 | 2 | 8000 | 6000 | 政治+2 | 20 | civil |
| 60 | 牙門將軍 | 2 | 8000 | 8000 | — | 20 | military |
| 61 | 護軍 | 2 | 8000 | 8000 | — | 20 | military |
| 62 | 偏將軍 | 2 | 8000 | 8000 | — | 20 | military |
| 63 | 裨將軍 | 2 | 8000 | 8000 | — | 20 | military |
| 64 | 主簿 | 1 | 4000 | 6000 | 政治+1 | 15 | civil |
| 65 | 諫議大夫 | 1 | 4000 | 6000 | 政治+1 | 15 | civil |
| 66 | 侍郎 | 1 | 4000 | 6000 | 政治+1 | 15 | civil |
| 67 | 中郎 | 1 | 4000 | 6000 | 政治+1 | 15 | civil |
| 68 | 忠義校尉 | 1 | 4000 | 7000 | — | 15 | military |
| 69 | 昭信校尉 | 1 | 4000 | 7000 | — | 15 | military |
| 70 | 儒林校尉 | 1 | 4000 | 7000 | — | 15 | military |
| 71 | 建議校尉 | 1 | 4000 | 7000 | — | 15 | military |
| 72 | 左僕射 | 0 | 0 | 5000 | 政治+1 | 10 | civil |
| 73 | 右僕射 | 0 | 0 | 5000 | 政治+1 | 10 | civil |
| 74 | 典農校尉 | 0 | 0 | 5000 | 政治+1 | 10 | civil |
| 75 | 議郎 | 0 | 0 | 5000 | 政治+1 | 10 | civil |
| 76 | 奮威校尉 | 0 | 0 | 6000 | — | 10 | military |
| 77 | 長水校尉 | 0 | 0 | 6000 | — | 10 | military |
| 78 | 破賊校尉 | 0 | 0 | 6000 | — | 10 | military |
| 79 | 武衛校尉 | 0 | 0 | 6000 | — | 10 | military |

特别注意：44“軍師將軍”按military评分，不能看名字改成文官；72..75为指挥5000/政治+1，76..79为指挥6000/无加成。80明确unsupported-internal-entry-80；-1、81及其他越界为invalid-office-id；小数/NaN等在JSON数据门也可能先得到invalid-number。

## 4. 来源证据分层及对早期43的纠正

| 项目 | 本版采用 | 证据层级/尚未闭合 |
|---|---|---|
| 005FAF00输入 | caller已给有序candidate list、office、mode | 调用约定/listing支持；不生成候选 |
| 005FA4D0调用 | person+office资格gate在评分前 | 调用边界exact，body尚未恢复 |
| trueLoyalty≥90 | helper通过后独立检查 | selector内读取，不假称helper内部条件 |
| 两种评分与严格大于替换 | 按下节表执行 | 既有source-listing reverse-exact；非stock执行认证 |
| 0..79分类 | top-civil/military/civil | reverse-inferred-high；005FA650完整body仍open |
| 80条目录与4000功绩阶梯 | requiredMerit为0..36000 | 真实资料表、其他功绩/UI helper证据支持 |
| 005FA4D0内部功绩读取 | 不声称恢复opcode/tier字段 | documented/empirical-high，body-open |
| 普通人物/ready/爵位/占用资格 | 明确可执行policy | provisional-engine-rule，不映射原生状态码 |
| 候选/官职升序、获选移出 | 明确可执行policy | provisional-caller-scheduler，不宣称原caller |
| 独立关系提交/保存 | 本服务确定性算法 | 工程状态协议，原writer仍open |

[43](43-auto-office-selector-exactness.md) §11早期“005FA4D0功绩门槛已经确定”应与后继 [65](65-auto-office-qualification-helper-boundary.md)合读：目录门槛有支持，而helper完整body、具体opcode、tier读取仍未恢复。此纠正不撤销真实×4000阶梯；也不把其他helper opcode移植成005FA4D0证据。

原资格中所在地、身份、任务、现任升降官、同势力/军团等具体限制继续open。手工任官UI条件不等于自动资格helper。旧参考Python只实现评分/first-wins，不能当作真实资格、爵位开放、多职位或writer已有实现。原caller候选构造/顺序和mode的业务映射继续见 [64](64-auto-office-scheduler-boundary.md)，entry80继续见 [66](66-office-classifier-entry80-boundary.md)。

## 5. 资格、输入域与忠诚门

独立状态内每人有稳定唯一非负安全整数personId，role为ordinary-officer/ruler，appointmentStatus为ready/unavailable，merit整数0..60000，trueLoyalty整数0..255，四项selectorStats整数1..100。越界拒绝，不clamp。trueLoyalty=150保存为150，不因显示忠诚100改写。

`detached-ready-merit-title-v1` 对每一候选按以下条件构造资格拒绝数组：

1. 该ID是state.officers中已有一行；未知或重复candidate ID是整次格式错误，不按“无资格”吞掉
2. role=ordinary-officer，否则not-ordinary-officer
3. appointmentStatus=ready，否则appointment-unavailable
4. requiredTier≤已拥有爵位unlockedTier，否则title-locked
5. merit≥该行requiredMerit，相等通过，否则insufficient-merit
6. fill模式下该人没有现任，否则already-appointed；rebuild模式忽略旧任占用

多项失败可同时报告。身份/status是调用者提供的独立快照，不解释原生Identity/Task整数。既有关系可保留unavailable、功绩不再达标或低忠诚的人；fill是保留政策，不暗中复审卸任。ruler不可占一般官职，关系创建/加载即拒绝。

资格通过后才检查真实忠诚≥90；失败为true-loyalty-below-90。资格拒绝不运行评分。功绩只决定有资格，不加分；爵位也不加分。

## 6. 两种mode，六条完整评分分支

令L=统率，W=武力，I=智力，P=政治。weighted-threshold在忠诚90门之后计算B=9×min(trueLoyalty−90,10)：90/91/100/150分别加0/9/90/90。role-affinity不加忠诚分，但同样要过忠诚90门。

| mode | 类别 | 能力资格门 | score |
|---|---|---|---|
| weighted-threshold | top-civil | L+I≥150 | L+I+B |
| weighted-threshold | military | max(L,W)≥60 | L+W+B |
| weighted-threshold | civil | max(I,P)≥70 | max(I,P)+B |
| role-affinity | top-civil | max(I,P)>max(L,W) | max(I,P) |
| role-affinity | military | max(L,W)≥max(I,P) | max(L,W) |
| role-affinity | civil | max(I,P)>max(L,W) | max(I,P) |

武官weighted门是max但分是L+W，不能混淆。role-affinity没有150/60/70额外阈值；文武相等只属武官候选。模式是两个明示字符串，未知/缺失拒绝；没有AI/player别名，不能根据名称推断原caller。

每人得分后仅在`score>bestScore`替换winner。同分保留输入中第一个；selector绝不再按personId、功绩、忠诚、名称排序。selector的调用顺序由输入决定，planner升序是下一层工程政策。无合格者winnerPersonId/score均null，保留全部拒绝明细；它不是API异常，也不创造占位人。

## 7. 多职调度、即时移出与既任政策

`stable-ascending-immediate-removal-v1`执行：

1. 固定该次输入的selectorStats，全程不因临时获官重算有效能力
2. 建立personId数值升序候选池，绝不按功绩排；fill先移除所有已有关系的人，rebuild从全体开始
3. 取所有当前爵位已开放officeId，数值升序；fill跳过已占职位，rebuild遍历全部
4. 每职调用同一selector。获选人物立即从工作池移出；后续职位看不到他，保证一人一职
5. 无winner留空并继续下一职；即使后续职位可能分更高，也不回溯全局优化
6. 输出after关系按officeId升序，逐项added/removed/retained以及每人beforeOfficeId/afterOfficeId

两个现任政策：

- fill-vacancies-v1是request省略incumbentPolicy时的明确默认。保留所有既任关系并排除既任人物；如果旧任中有爵位当前未开放的职位，则locked-incumbent-requires-rebuild，不能悄悄降官
- rebuild-all-v1必须在request显式选择。清空本服务工作关系后重新分配，旧人不再合格可能被卸任，可能调往其他职；收据必须列出removed/added及person变化。其“全部”仅是这个独立state的关系

本服务没有能力影响、资源或忠诚账本。不能将“本服务不扣费”扩写为“原游戏任官费用等于0”；财政成本/时点未来需另有证据与版本。也不触发爵位事件的忠诚变化。

## 8. 单一状态关系、plan绑定与原子提交

state有schemaVersion=1、固定scope/profile、revision、catalogVersion/digest、policyIds、titleKey、officers、assignments。每职最多一人，每人最多一职。没有person.officeId副本；查询从唯一关系派生，无任职返回null。一般官职效果从目录查询，君主爵位元数据分开返回。

plan是纯预览，绑定整个beforeState的canonical SHA-256及baseRevision、目录与政策版本、规范request、mode、候选/职位顺序、逐职winner/score/全部拒绝、before/after关系、差额、空缺职位和证据标签。目录SHA-256绑定数据内容；不是签名或native认证。

apply先验证输入，检查revision/完整state指纹，然后从当前state与plan.request重算整个规范plan，逐字段对照。只改after/winner/score、忽略末项或新增字段都不能成功。stats/merit/loyalty/title/关系/revision变化会使旧plan过期；catalog/policy变化作为不支持的profile拒绝。所有错误在新状态返回前发生，输入对象从不写入。

成功有变化时只更新整个assignments并revision+1，其余字段逐值保留；无变化status=no-change且revision不动。重复应用旧的有变化plan返回stale-plan，保证不会二次加官或再增revision；重复no-change始终无变化。这是重复无副作用，不是自动用旧计划重新分配。

收据包含实际前后revision、plan/state指纹、request、added/removed/retained、人物前后职位、逐职评分拒绝明细、全部当前空缺、政策/证据和rngDraws=0。失败不返回半个成功state；调用者负责把成功返回的新state作为自己的下一版本，不提供跨进程锁。

## 9. 保存/加载与从请求真正回放

独立state快照可JSON保存/加载，严格验证schema、所有人的字段、关系和目录政策后继续plan/apply。快照是新导入的独立起点，不能证明它是某个原生存档的真实历史。

需要历史一致性时使用replay archive：保存initialState + 规范requests + 逐条完整receipts + finalState，并绑定catalogDigest/policyIds。保存从initialState重算，不采信外部receipt；加载同样逐请求重新selector→plan→commit并核对整档receipt/finalState。伪造after、末次分配、某条score或前期收据均不只是“格式通过”。一致改写起点和全部历史形成另一独立情景，hash本身不是鉴权，不能证明起点真实性。

回放初始revision可非0，既任关系可非空；表示调用者选择的合法起点。一次回放最多256个请求且受容量边界限制，只接受全部成功的序列；失败给索引，不发布部分结果。保存仅返回字符串，不写磁盘/上传。详情及API完整返回结构见引擎文档。

## 10. 可实际提交的静态例子

以下是人工推导的静态期望，未执行的示例不是测试通过记录。示例JSON给出可传给create的scenario和requests。

当前爵位州刺史，开放64..79。五人均ordinary/ready：

| ID | 功绩 | 真忠诚 | L | W | I | P |
|---:|---:|---:|---:|---:|---:|---:|
| 10 | 4000 | 100 | 80 | 80 | 75 | 75 |
| 20 | 4000 | 90 | 40 | 40 | 85 | 90 |
| 30 | 3999 | 100 | 60 | 60 | 60 | 70 |
| 40 | 0 | 89 | 100 | 100 | 100 | 100 |
| 50 | 0 | 90 | 60 | 1 | 30 | 30 |

无既任、weighted-threshold：64先选10（165胜20的90）；65选20；30功绩3999不能拿tier1，只在72以160获选；50在76以61获选；40忠诚89始终拒绝。after为64→10、65→20、72→30、76→50，apply一次后revision 0→1。

同一空白起点、role-affinity：64选20（文90），10更偏武，直到68才以80获选；72选30（文70），76选50（武60）。after为64→20、68→10、72→30、76→50，revision仍从0→1，不把两种模式结果串联。

若初始有79→10：fill保留79→10，只补64→20、72→30、76→50；rebuild显式覆盖后得到weighted空白起点的64→10、65→20、72→30、76→50。rebuild收据包括removed 79→10、added 64→10，人物10从79转64，忠诚仍100；20从null到65。此时未发生所谓新爵位或忠诚奖励。

再次对成功state做同mode fill预览，所有剩余人仍不合格时为no-change，revision保持1。把首次plan重复给revision1则stale-plan，不重新扫描替代旧plan。

## 11. 边界向量清单与本轮验证限制

这些是未来执行验收的目标，本轮只静态阅读/写代码和文档，未测试、typecheck、build、编译、checker、产品或诊断；旧测试没有增删，不借用历史通过结果。

| 维度 | 应覆盖的具体结果 |
|---|---|
| 忠诚 | 89拒绝；90/91/100/150的weighted bonus为0/9/90/90；保存150不clamp |
| 顶文 | L79+I70=149拒绝，80+70=150通过 |
| 武官 | 59/59拒绝，60/1通过分61；不可误把max当score |
| 普通文官 | max69拒绝、70通过；role-affinity不套70阈值 |
| affinity | 文武同值只过military；top-civil也只看角色优势，无150额外门；忠诚90与100同能力同分 |
| 同分 | selector [A,B]保留A，反转保留B；planner另按ID升序 |
| 功绩 | 3999/4000、35999/36000边界；60000接受/60001拒绝；功绩不加score |
| 爵位 | 無仅72..79，州刺史64..79，皇帝0..79；无城市数隐式升爵 |
| 分类/ID | 0/3 top-civil、4/44/79 military、8 civil；80unsupported；null仅派生未任官 |
| 资格 | ordinary/ready/title/merit/occupation分别失败；ruler元数据和一般office不混用 |
| 调度 | 同一人只占首个获选职并移出；无winner继续；重复plan相同且不改输入 |
| 既任 | fill保留/排除既任、锁定既任报错；rebuild显示卸任/调职；坏关系不部分写入 |
| stale/篡改 | preview后改任意before内容拒绝；改winner/score/after/order/evidence拒绝；revision溢出拒绝 |
| 原子/幂等 | 成功只改关系/revision；旧plan重复不二次写；no-change不增revision；忠诚/功绩/属性保持 |
| 持久化 | state roundtrip后能继续；archive从初始请求重算；中途receipt/finalState篡改拒绝 |
| 有效变异 | 将严格>换≥、去掉能力/忠诚/功绩门、改武官max门与sum分、去掉bonus封顶/移出等应被未来验收区别 |

## 12. 仍开放的原作问题

005FA4D0完整body；005FA650完整分类body；entry80字段/用途；原caller候选构造/顺序、mode业务映射、多职顺序、现任移出/升降与writer；stock/Vanilla/console版本差异均仍open。本服务交付不关闭这些证据债，不宣称原自动封官完整复原、81职覆盖或原生职位/归属事务等价。


## 2026-10-17：独立财政仅消费工资目录

[O10-A完整驻城月俸](city-finance-lifecycle.md#5-完整驻城有官薪人员与月俸)只读named-offices-v1的0..79每项monthlySalary，按固定同城普通人员完整名单求和。它不执行本服务的资格/分配/任免，也不扩展君主、无官或entry80工资；不足整旬回滚是新财政政策。

本次连接仅静态代码和规则交付，未运行测试、编译、build、checker、诊断、产品或示例；本页历史通过记录不覆盖新服务。
