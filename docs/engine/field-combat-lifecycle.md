# FieldCombat V1：独立正兵力动作服务

日期：2026-10-18 UTC。配套[规则](../rules/field-combat-lifecycle.md)与[来源 / policy 清单](../sources/field-combat-lifecycle.json)。

## 1. 软件边界与六个入口

实现模块为 `packages/engine/src/field-combat-lifecycle.ts`，本版公开名称均采用 FieldCombat...V1。只提供六个动作生命周期入口：

| API | 职责 |
|---|---|
| createFieldCombatStateV1 | 验证完整 scenario 和固定 policy / 地图 / 单位 / tape，构造 genesis 与独立 revision=0 状态 |
| previewFieldCombatV1 | 以同一 reducer 计算将要产生的完整收据，不改变输入或消费外部 RNG |
| executeFieldCombatV1 | 验证可提交性与预算；原子产生新状态和收据，支持全部历史 commandId 幂等 |
| saveFieldCombatV1 | 序列化完整 genesis、历史、receipt、最终 snapshot；不丢弃旧收据 |
| loadFieldCombatV1 | 封闭 DTO / 预算检查后，自 genesis 重算所有历史并核对完整收据和终态 |
| replayFieldCombatV1 | 明确执行同一 genesis 回算与完整收据核对合同，不信任保存的结果 |

这些函数不注册 native 世界命令，不接 native save，不导入训练 sandbox。没有 beginTurn、endTurn、撤退、补兵、移动、恢复气力、资源支付或终局处理入口。

`o14-detached-positive-field-action-v1` 只是这个有限软件 profile。nativeEquivalent 与 stockVerified 必须始终为 false。独立程序行为可静态审阅，不代表原作动作 caller 已恢复。

具体签名：

```ts
createFieldCombatStateV1(input: unknown): FieldCombatStateResultV1
previewFieldCombatV1(input: unknown, rawCommand: unknown): FieldCombatPreviewResultV1
executeFieldCombatV1(input: unknown, rawCommand: unknown): FieldCombatCommandResultV1
saveFieldCombatV1(input: unknown): FieldCombatSaveResultV1
loadFieldCombatV1(json: unknown): FieldCombatStateResultV1
replayFieldCombatV1(input: unknown): FieldCombatReplayResultV1
```

create 的 input 为完整 scenario；preview / execute / save 的 input 为完整 state；load 接收保存的 JSON 字符串；replay 接收 FieldCombatTraceV1。公共参数用 unknown 是为了运行时边界验证，不能据此推定任意对象受支持。

## 2. 输入所有权与封闭 DTO

所有外部边界都按封闭 JSON DTO 处理。类型声明不是运行时可信边界；create / preview / execute / save / load / replay 均不能接收额外字段、任意对象图或调用者提交的最终结果。

对象输入合同为非 Proxy 的普通 JSON DTO、未污染的运行环境。允许普通对象及 null-prototype 记录；反射可能触发 Proxy traps，不能把该合同说成对任意 Proxy / 污染运行时的安全沙箱。

- 仅接受普通 JSON 值、有限数字和明确字段；拒绝未知键、缺失必需键、非预期原型、accessor、稀疏数组、循环、非有限数字及函数
- 对地图、单位、成员、关系、技巧、tape、历史、逐阶段收据、嵌套深度和完整保存字节均有预算；必须在访问深层 schema / 业务字段前做边界检查
- ID、坐标、占用位置和所有引用必须一致，集合采用固定顺序；重复标识或不完整地图 / 成员事实不能靠去重或默认值修复
- 全部政策字段和值固定并内容核对，不能只核 policyId。逐命令没有 coefficient、damage、success、critical、状态结果或 callback 字段
- 整数、兵力、气力、status / remaining、正常 / 混乱面板、成员技能、技巧及关系均检查自身范围和跨字段关系
- 创建所得状态、receipt 和历史由服务构造；不得共享调用者可继续修改的可变引用。preview 与 execute 不修改调用者输入

完整 policy snapshot 同时声明数值、顺序与拒绝边界。改任一固定字段都属于不同 policy，不能沿用当前版本 ID 伪装兼容。

预算固定为：UTF-8 序列化 16,777,216 bytes（16 MiB）、1,048,576 个访问节点、深度 32、单数组 4,096 项、单记录 128 个 own keys；地图 256 格、单位 64、成员每队 3、tape 4,096 项、accepted history 64、replay attempts 4,096。检查计入 JSON 结构 / 转义及结果封装，不能只累加未转义字符串长度。

ID 为 1..64 字符，首字符字母或数字，其后只允许字母、数字、下划线、点、冒号、连字符。数值为有限安全域，-0 也拒绝。JSON 文本解析拒绝重复的解码后键，包括不同转义形式写出的同一键，不让 JSON.parse 的覆盖行为隐去冲突。

公开只读类型为 FieldCombatScenarioV1、FieldCombatStateV1、FieldCombatSnapshotV1、FieldCombatCommandV1、FieldCombatPolicyV1、FieldCombatReceiptV1、FieldCombatFailureV1、FieldCombatStateResultV1、FieldCombatCommandResultV1、FieldCombatPreviewResultV1、FieldCombatSaveResultV1、FieldCombatTraceV1、FieldCombatReplayResultV1。固定常量出口为 FIELD_COMBAT_POLICY_REGISTRY_V1、FIELD_COMBAT_DEFAULT_POLICY_V1、FIELD_COMBAT_EVIDENCE_V1。

### 2.1 Scenario 与命令字段

FieldCombatScenarioV1 的必需顶层键：schemaVersion=1、profile、episodeId、round、context、map、units、rng、policy。round 为 0..1,000,000 的固定标签，不因动作改变。

- context：kind=detached-ground-only、allMembersAndSkillsComplete=true、allTechniquesComplete=true、crossUnitRelations=[]、unsupportedEntities=[]；这些完整性声明不能替代源事实核对，也不导入其他世界对象
- map：qMin、qMax、rMin、rMax、cells；坐标在 -255..255，矩形面积 1..256，必须完整覆盖每个坐标。cell 只有 id、q、r、terrain、height、blocked；地形为 plain / grass / sand / forest / wasteland / wetland / road，高度 0..255
- unit 动态键：id、cellId、troops、energy、acted、status、remaining。troops 1..1,000,000，异常 remaining 1..255，normal remaining=0
- unit 静态键：side、weapon、aptitude、energyCap、difficulty、intelligence、charm、martial、temperament、panels、members、techniques；weapon 为 sword / spear / halberd / crossbow / cavalry，aptitude 为 C/B/A/S，temperament 为 timid/calm/bold/reckless
- intelligence 与成员 intelligence 为 0..100；charm、martial、两种面板 attack / defense 为 0..255。panels.kind=resolved-state-panels-v1、techAndStatusIncluded=true，normal / confused 均必须供给；不再重复添加技巧和状态减成
- member 只有 id、intelligence、sex、skills、relationshipToLeader；sex 为 male/female，关系为 leader/none/like/spouse/sworn/dislike。每队 1..3 人，恰好一位 leader；关系单枚举不允许同一成员重叠类别。成员 ID 跨队唯一
- skills 采用 policy 的固定 aliases 规范化和同一成员去重；未知技能在 create 拒绝。20 个支持技能、16 个已知未支持物理技能、3 个已知未支持计略技能组成识别集；后两类在相关命令的预检拒绝
- techniques 为不重复的 0..35 整数，同一四级分支必须完整包含所有前置项，同 side 单位集合一致。技巧 16 存在时 energyCap 必须为 120，否则必须为 100；energy<=energyCap
- rng.kind=stage-bounded-tape-v1，tape 项只有 stage、bound、value；bound 只能为 2 或 100

FieldCombatCommandV1 必需且仅有 commandId、expectedRevision、actorId、targetId、action。expectedRevision 为 0..64；action 必须是规则 §3 的七种之一。命令不接受 caller 派生方向或目标列表。

创建规范化顺序为 cell ID、unit ID、member ID、技能 canonical 名、技巧数值；这与未知字段拒绝不同。占用、ID 与技巧重复仍拒绝，同一成员技能别名允许规范化去重。

## 3. 冻结状态与行为事实

FieldCombatStateV1 必需键为 tag=field-combat-state-v1、schemaVersion、profile、policy、sourceBoundary、genesis、snapshot、acceptedCommands。genesis 包含 scenario 与初始 snapshot；acceptedCommands 每项保留 command 与完整 receipt。固定场景与 tape 在 genesis.scenario 中完整保留，不从当前 snapshot 反推。

FieldCombatSnapshotV1 只含 revision、episodeId、round、units、rngCursor；units 为 id、cellId、troops、energy、acted、status、remaining。初始 revision=0、rngCursor=0；一条接受命令推进一次 revision，无自动 round / episode 切换。

每个单位保留正常与混乱两种已解析攻防面板、部队属性、兵装 / 适性、主将性格、完整成员性别 / 智力 / canonical 技能名单、队内关系和完整技巧事实。原 getter 和人物 ownership 不属于服务；技能 holder 由 member 快照派生，不能用部队最高智力替换。

状态用 normal / confused / false-report 与 remaining。false-report 仅为状态，无位置、home、path 或 mission 写入。对同类 max 刷新和异类拒绝使用显式 O01 内部 adapter，不开放已成功 applyStatus 命令；普通计略的 70/30 duration 是具名模拟分布。此 adapter 不是全局 O01 调度接入。

## 4. 单一 reducer 与命令事务

preview 与 execute 共享纯 reducer；execute 额外负责可提交历史和保存预算的原子提交。固定顺序详见规则 §4。每一阶段都先写私有 working state、working cursor 和 tentative trace。

必须区分三个对象：

1. before：已验证的当前快照
2. tentative：当前命令在私有工作区中的全部阶段结果
3. after：仅在所有验证、正兵力和保存预算均成立后，才能替换的提交快照

若任何目标 / 旁目标 / 反击使兵力<=0，返回 unsupported-terminal-effect。任何 RNG 耗尽 / 错 stage / 错 bound、异类状态替换、不支持副效应、数值异常或保存预算失败，同样没有部分提交。拒绝时 before=after，effects=[]，revision、气力、acted、兵力、状态与 RNG cursor 都原样。

如果连输入 state 都未能完整重建，失败 before / after 都为 null，不冒用未经验证的输入为可信快照。当前状态已验证后的命令失败则返回相等的真实 before / after。

异常 actor、已行动 actor、射程 / 地形 / 兵装 / 适性非法、资源不足、未知技能和不支持技巧触发上下文，应在第一条抽签前拒绝。不能因有 chance 不触发而接受禁止副效应的上下文。

结构上已知的异类异常替换也预检拒绝，不能靠这次可能 miss 绕过。对多目标战法，先枚举完整几何覆盖并预检所有潜在参与者，再抽主命中；失败虽只打主目标，也不使已知域外旁目标上下文合法。

远程合法性使用 complete-axial-rectangle-conservative-ray-v1：若起终点间任何最短轴向路径的 intermediate 格被 blocked，则保守拒绝。此限制额外收窄本 profile，不认证 stock line-of-sight。物理上下文中任一单位有辅佐即保守拒绝。完整前置链意味着技巧 2 奇袭必带技巧 1 兵粮袭击，故当前枪主动攻击先被资源副效应预检拒绝；不构造缺前置的成功样本。

## 5. 确定性 RNG 与阶段审计

tape 单元为 `{stage,bound,value}`。每次实际需要抽签时，阶段名和 bound 必须与 cursor 所指单元完全一致，value 在 0..bound-1 内。不得跳过不匹配项去寻找后续可用项。

- 0 / 100 的确定率不消耗 RNG，收据记原因
- 普通概率命中 / 会心、盾、急袭、螺旋非会心入口均用 bound100
- 螺旋 count 使用 bound2；普通计略 duration 使用 bound100
- 不存在反击资格时不抽急袭；盾完全挡住时不抽本击会心；计略失败不抽会心或 duration
- 事务失败撤销暂存 cursor，不让已拒绝命令消耗外部 tape

主动目标顺序和反应顺序都是 policy 的一部分。反应从主动伤害及状态处理后重算；不能把主动伤害数值拷作反击，也不能混用 matchup 和 reactionScale。

盾 gate 的来源判断按 damage source 的 weapon：矢盾适用 a.weapon=crossbow 的全部普通伤害，含近接普攻 / 近接反击；大盾适用全部普通伤害，两者只一个 30% gate。成功战法跳过盾。这项近接弩范围由 policy.shieldSource=crossbow-weapon-including-melee-v1 显式固定，与 one-shield-gate-v1 一同记入步骤，不认证 stock caller。policy.height=recorded-no-scalar-modifier-supported-actions-v1 另记录在 legality 阶段，不添加本域未支持的全局高度攻防倍率。

固定 RNG stage 命名：战法命中 tactic.hit；计略 strategy.hit、strategy.critical、strategy.duration；主动第 i 个受击目标（零起）attack.i.shield、attack.i.critical、attack.i.spiral-gate、attack.i.spiral-count；反应 reaction.avoid、reaction.shield、reaction.critical。不适用或确定分支不需要对应 tape 项。steps 还记录不消耗 RNG 的 legality、ordinary.hit、attack.i.damage / status、strategy.status、reaction.eligibility / damage 等审计阶段。

## 6. 命令幂等与全部历史

commandId 与完整规范化 payload 绑定。查历史相同 ID 时，必须先比 payload：完全相同返回当时原 receipt，不再次验证成新动作、消耗气力、抽 RNG 或推进 revision；不同 payload 返回冲突。没有历史 ID 的新命令必须匹配当前 expectedRevision。

所有历史命令的 receipt 都继续可查，不能仅保留最后命令，也不能因 revision 已变化而拒绝本来合法的历史重复请求。重复请求不复制历史，不改变 after 状态。保存 / 加载后这条合同不变。

## 7. 完整收据，而非仅最终伤害

每份接受收据记录：

- 完整 command、schema/profile/policy 版本与内容 hash、episode、前后 revision / state hash
- actor、主 / 旁目标、固定 side、开始格 / 发动格、范围 / 地形 / 兵装 / 适性判定、覆盖与排序
- 每阶段 sourceKey、evidenceGrade、policyId、输入面板及已包含层、技能 holder 与选择原因
- 命中 / 会心 rawRate、取整 / clip 后率、条件优先级与确定率不抽签原因
- 伤害公式各中间值、k、critical、matchup、tech、drum、difficulty、reactionScale 及其来源
- 每条 RNG 的 stage、index、bound、value，cursor 前后值
- 主动与反应分开的资格、盾 / 免疫 / 规避理由和结果
- 兵力、气力、acted、状态和 count 的 before / requestedDelta / actualDelta / after；max 刷新 actualDelta=0 仍如实记录

拒绝收据不得把暂存效果列为已提交 effects。诊断 trace 若保留，必须与 committed effects 分离，并受相同封闭 DTO 与预算限制。

实际 receipt 的阶段字段 steps 每项为 stage、sourceKey、evidenceGrade、policyId、actorId、targetId、decision、reason、numbers、labels。numbers 与 labels 用具名条目保留全部中间事实；不能仅看最后一次伤害。draws 每项为 index / stage / bound / value。coverage 每项保留 cellId、occupantId、side、disposition、order；disposition 包括 primary、secondary、friendly-skipped、empty、outside-map。

effects 为每个受影响单位的写入记录，携带 side 与 cellBefore / cellAfter；数值写入统一保留 before、requestedAfter、requestedDelta、actualDelta、after，acted 与 status 同样保留请求 / 实际结果。outcome 为 physical、tactic-fallback、strategy-succeeded 或 strategy-failed；失败是独立 FieldCombatFailureV1，ok=false、committed=false、reason、commandId、index、before、after、effects=[]。

## 8. 完整 genesis 回算和预算不变量

保存结果为 ok=true 与 json；json 保存完整 state，包括 genesis、固定场景、完整 policy、tape、全部 acceptedCommands / receipts 和最终 snapshot。哈希仅是 FNV-1a64 对规范化文本 UTF-16 code unit 的非认证内容标签，前缀 fnv1a64-utf16:；不能证明来源、对抗哈希碰撞或替代重算。原始来源身份另以来源文件的 Git blob 标识记录。

FieldCombatTraceV1 的顶层键为 tag=field-combat-trace-v1、scenario、attempts、expectedFinalSnapshot。每次 attempt 包含 command 和 expectedOutcome；expectedOutcome 可为 null（不附断言）或完整预期结果。expectedFinalSnapshot 可为 null 或完整预期终态。replay 可包含失败或重复尝试，不能把 attempts 总数等同 accepted history；预期存在时须完整核对。

load / replay 的检查顺序：

1. 原始 DTO 数量 / 深度 / 字节预算和封闭字段验证
2. genesis 的结构、范围、引用、固定 policy 和场景验证
3. 从 genesis 创建新的独立工作状态，按历史次序调用同一 reducer
4. 每一条命令核对完整生成 receipt，包括公式中间值、政策、目标顺序、RNG trace、拒绝 / 提交效果及前后 hash
5. 核对完整最终 snapshot、revision、cursor 和完整历史，而非仅 troops 或一个最终 hash；trace 另逐条核对非 null 的 expectedOutcome 和非 null 的 expectedFinalSnapshot

改 reactionScale、holder 能力、命中分式、难度归属、RNG stage、旁目标排序或状态 actualDelta，若与 genesis 独立回算不一致，即使最终兵数碰巧一样，也必须被完整核对检出。不信任调用者给出的 checksum，不做旧版本隐式迁移。这个自洽性保证不认证 genesis 来自真实原作，也不能识别同时重写全部 genesis 和自洽结果的伪造来源。

可保存性是每次成功提交的不变量。execute 在提交前按下一完整状态和全部历史核对预算，计入 save 字符串的转义及每一个历史 receipt 的重复命令返回封装；无法保存或无法完整返回任一旧收据，就原子拒绝。不接受后才发现 save 超限，也不裁切最旧 receipt 来维持表面成功。预算是软件防护，不是原作容量事实。

## 9. 静态审阅重点与未运行声明

2026-10-17 的 34 条设计向量仍是静态审阅预期，不是 PASS 记录。重点包括：k0 非零伤害、signed trunc、精锐覆盖、反应难度方归属、受击后反向重算、目标 / actor 性格分离、缺席秘计、holder 低于部队智力、螺旋零 duration、同类 max 的零实际增量、应射射程 / 森林、盾后反击、急袭无资格不抽签、旁目标 / 反应致命全回滚、所有历史幂等、逐阶段篡改检出和无自动旬。

本批只静态编写与读取文本，未运行产品、测试、typecheck、编译、build、checker、诊断、schema 验证或示例。文档列出 API 与不变量，不代表运行正确性已验证，不关闭原 43 证据组、45 条 snapshot 或任何 native exactness E。

## 10. 本批集成与独立边界

公共出口与导航基于已独立回读的 PR86 main `a04ee326fdaa68e930681430352f4d98fee5209e` / tree `df4e2be515e2434e4e64476517c8e58f0d3afaf0` 追加；没有修改旧服务实现。反应伤害组合段的 evidenceGrade 为 explicit-simulation-policy，另有 reaction.scale 阶段记录完整核心 floor 后的具名反应有理倍率；主核及其各倍率来源仍单独留证。coverage 是预检时完整几何覆盖，失败战法只实际攻击主目标，不把旁格 coverage 当作已提交兵损名单。
