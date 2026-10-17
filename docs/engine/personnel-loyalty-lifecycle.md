# Personnel loyalty lifecycle API

更新：2026-10-17。模块 `packages/engine/src/personnel-loyalty-lifecycle.ts`，profile `standalone-personnel-loyalty-v1`；仅固定单城普通非俘虏人事账本。具体候选、增减量、RNG及证据边界见[完整规则](../rules/personnel-loyalty-lifecycle.md)；[来源manifest](../sources/personnel-loyalty-lifecycle.json)、[结构schema](../sources/personnel-loyalty-lifecycle.schema.json)与[未运行场景](../../data/scenarios/personnel-loyalty-example-v1.json)分开保存。schema不是关系、历史可达性或原子重算的替代，也未运行schema验证。

本页描述静态代码合同，不声称通过运行验收。没有运行测试、typecheck、编译、build、checker、诊断、schema校验、产品或示例。

## 1. 公共API职责

| 导出 | 职责 |
|---|---|
| `createPersonnelLoyaltyState` | 严格验证完整scenario/policy，建立不可变初态；初始日期已结算，不抽随机 |
| `inspectPersonnelLoyalty` | 取得本域状态及true/display忠诚投影，不推进时间或改变账户 |
| `previewPersonnelLoyaltyCommand` | 在detached draft与克隆RNG上派生资格/效果/receipt；不占command ID或历史 |
| `executePersonnelLoyaltyCommand` | 两种命令的原子事务、revision、幂等、实际独立扣费/写回及完整receipt |
| `savePersonnelLoyaltyState` | 产出包含完整初态、policy、seed、接受历史/receipt及最终快照的新schema保存数据 |
| `loadPersonnelLoyaltyState` | 严格解析保存数据，从初态逐条重执行并全字段比较；不信任终态snapshot |
| `replayPersonnelLoyaltyCommands` | 从完整初态按规范命令流经同一execute重建，不直接应用caller提交的终值 |

模块同时公开 `PERSONNEL_LOYALTY_POLICY_REGISTRY_V1`、`PERSONNEL_LOYALTY_DEFAULT_POLICIES_V1`、`PERSONNEL_LOYALTY_POLICY_DIGEST_V1`、`PERSONNEL_LOYALTY_EVIDENCE_V1`、`PERSONNEL_LOYALTY_UNSUPPORTED_V1`。调用方应提供注册的[完整policy结构](../../data/catalogs/personnel-loyalty-policies-v1.json)，而非仅其ID或digest。本模块调用既有 `calculateAffinityDistance` 并保留其完整receipt，不重造相性纯核；不调用普通登用决策以制造新ownership事务。

输入参数及成功返回：

```text
createPersonnelLoyaltyState(scenario) → {ok:true,state}
inspectPersonnelLoyalty(state) → {ok:true,snapshot,officers,sourceBoundary,unsupported}
previewPersonnelLoyaltyCommand(state,envelope)
  → {ok:true,committed:false,duplicate,receipt,projectedSnapshot}
executePersonnelLoyaltyCommand(state,envelope)
  → {ok:true,committed,duplicate,state,receipt}
savePersonnelLoyaltyState(state) → {ok:true,json}
loadPersonnelLoyaltyState(json字符串) → {ok:true,state}
replayPersonnelLoyaltyCommands(trace对象) → {ok:true,state,outcomes}
```

全部公开输入为unknown并做运行时严格解析，返回深度不可变结构。execute新成功为committed=true/duplicate=false；幂等重试为committed=false/duplicate=true。inspect.officers每项为 `{id,trueLoyalty,displayedLoyalty,praisedThisTurn,cashEligible}`。相关类型均以 `PersonnelLoyalty...V1` 导出，包括Scenario、State、Snapshot、Command、Envelope、Policies、Relations、Draw、Candidate、Write、OfficerReceipt、Receipt、Failure及各Result/Inspection/Trace类型。

## 2. 场景输入

根对象所有字段必填且不允许多字段：

| 字段 | 封闭结构及约束 |
|---|---|
| `schemaVersion` | 恰为1 |
| `profile` | 恰为 `standalone-personnel-loyalty-v1` |
| `date` | `{year,month,day}`，年1..9999、月1..12、日1/11/21 |
| `initialDateAlreadySettled` | 恰为true |
| `advanceLimit` | 1..360；完整窗口在创建时不得跨9999年 |
| `force` | `{id,rulerId,hasHumanHeartControl}`，技巧为boolean |
| `city` | `{id,ownerForceId,hasTokenPlatform,gold,actionPoints}`；owner匹配force；金/AP各0..1000000000 |
| `ruler` | `{id,forceId,affinityByte,giriInternal,ambitionInternal,charisma,skills}`；id匹配force.rulerId；固定本城，非赏目标 |
| `officers` | 长度0..80、唯一ID、排除君主；每项结构如下 |
| `relations` | `{likes,dislikes,spouses,swornSiblings,parentChild}`，详见下方 |
| `rng` | `{kind:"xorshift32-nonzero-mod35-v1",seed}`，seed1..4294967295 |
| `policies` | 注册的完整固定policy对象，逐字段比较 |

每名普通武将只有：

```text
id
forceId
cityId
kind = "ordinary-fixed-resident"
trueLoyalty = 0..255
affinityByte = 0..255
giriInternal = 0..4
ambitionInternal = 0..4
skills = [] 或 ["benevolent-governance"]
praisedThisTurn = boolean
```

forceId/cityId必须与本场景一致。君主的相性/义理/野望同上，charisma为0..100，skills仅同一技能选择；charisma保留但新现金增量不消费它。

ID为1..64位ASCII字符串，首位字母或数字，后续只允许字母数字、`_ . : -`。规范排序用代码单元顺序，不用locale。

关系封闭结构：

- `likes`、`dislikes`：`{from,to}`有向边
- `spouses`、`swornSiblings`：两个ID组成的规范化无向pair
- `parentChild`：`{parent,child}`有向边
- 全部引用君主+名单；拒绝自指、重复、未知ID；每人最多一配偶、两父母，亲子图无环
- likes/dislikes允许重叠，豁免优先；亲子豁免比较直接边两方向

likes/dislikes各最多6480边，spouses/swornSiblings各最多3240 pair，parentChild最多162边；实际还受人数、配偶唯一、每人最多两父母和无环条件约束。create会排序名单、边和无向pair；保存中的genesis必须已经canonical，不能用重排的保存内容绕过完整值比较。

初态revision=turn=advancedCount=0，rng.state=seed、drawCount=0；初始praisedThisTurn=true映射lastPraisedTurn=0，否则null。输入深拷贝并不可变，原始对象之后的修改不能改变state。

不接受caller的gain、loss、roll、eligible、selected或success字段；没有普通以外身份、部队、俘虏、任务、死亡、在途或归属变更分支。关系、技能与固定名单不能由后续命令更新。

## 3. JSON与有限资源合同

所有输入必须为封闭JSON纯数据：拒绝额外/缺失字段、undefined、非有限数、小数、负零、accessor、symbol、隐藏字段、自定义原型、循环、稀疏数组；对象允许普通Object.prototype或null原型，数组仅Array.prototype。JSON文本另拒绝重复key和尾部多余内容。未知profile/policy或同ID参数变化均拒绝。

| 限额 | 值 |
|---|---:|
| 成功命令总数 | 4096 |
| 完整canonical save UTF-8 | 8388608 bytes |
| canonical scenario UTF-8 | 524288 bytes |
| JSON最大深度 | 32 |
| JSON最大节点数 | 262144 |
| 基础JSON单数组元素 | 8192 |
| 基础JSON单对象属性 | 128 |
| replay trace尝试总数 | 4096 |

写入预算包含完整初态、全部历史和receipt、最终快照及API结果，不只测新命令大小。8MiB也限制 `SaveResult{ok:true,json:canonical(state)}` 包装转义后的完整JSON，create/每次接受预先核可保存性；加载/重放核每个中间输出预算，preview另核其结果。越额原子拒绝，不能截断历史或只保存hash。

各维上界不能保证同时达到最大：自然季度全80人最多240draw，receipt/历史增长可能先达到512KiB场景、8MiB输出、深度32或节点262144预算；4096历史只是硬上限。资源限额是新服务政策。

## 4. 命令与版本

每个envelope恰为 `{id,expectedRevision,command}`；ID同场景ID规则，expectedRevision为0..4096整数。

两种command：

```text
{type:"CashReward",targetOfficerIds:[id,...]}
{type:"AdvancePersonnelTurn"}
```

CashReward目标1..80、不重复，规范化为ID升序。Advance不接目标日期、金/AP补充、最终损失或caller判定；服务自己推进一旬并决定是否进入季度流程。

新ID：完整形状/域验证→revision→业务资格/预算→detached draft派生→全输出预算→一次提交。每成功命令只revision+1；失败不改变任何state字段或历史。

幂等在成功历史上比较完整canonical envelope，包括旧expectedRevision。同ID同envelope返回原receipt与当前state，不重放effect；同ID异内容为 `duplicate-command-id-conflict`。失败不保留ID。相同状态+envelope的preview和execute应产生相同派生receipt；preview不更改实际流、revision、历史或ID占用。

## 5. 真实写集与派生值

CashReward只写本服务金/AP、各目标trueLoyalty/lastPraisedTurn、RNG、revision与历史：全目标100N金/5NAP、每人5+roll5，显示100者或本旬已赏者导致全命令失败。没有actor、acted、功绩、技巧P、人才府折扣或外部账户扣款。

Advance只写本服务date/turn/advancedCount、季度目标trueLoyalty、需要的RNG、revision与历史；lastPraisedTurn数字不清零，以currentTurn比较解除旧标记。非季初不抽自然RNG。没有收入、工资、AP回满或全世界调度。

显示忠诚始终为getter派生的 `min(true,100)`，不能写回true字段。自然loss先消耗其路径需要的draw再饱和到0，true0不提前跳过；true>100仍正常减少。忠诚到0不改变成员资格、所属或位置。

自然loss采用 `source-shaped-normal-trait-loss-v1` selected-listing软件policy：固定源快照 `0058E759` 的符节台 `+2` 行旁有“【修改】符节台附加忠诚下降值”，是必须保留的作者修改提示，不能作为stock常量认证。本模块明确选择+2而不提升其原版证据等级；末尾“修改1”人心掌握概率与“修改2”忠诚基数/君主魅力两套MOD保持隔离，不混入此实现。详见[自然loss规则及来源限制](../rules/personnel-loyalty-lifecycle.md#7-人心掌握两次loss与真实byte写回)。

固定policy全文的行为分组见[注册policy表](../rules/personnel-loyalty-lifecycle.md#10-全部注册policy)。现金算法明确不使用君主魅力或目标义理，不从旧观察样本估计；这项保真差异属于公开policy/receipt语义。

## 6. Receipt与失败结果

receipt封闭字段为：

```text
schemaVersion, profile, commandId, envelope, policies, policyDigest,
sourceBoundary, unsupported,
revisionBefore, revisionAfter, turnBefore, turnAfter,
dateBefore, dateAfter, quarterEntry, sortedTargetIds,
officers, resources, draws, writeSet
```

writeSet恰为 `{before:Snapshot,after:Snapshot}`。Snapshot字段为 `revision,turn,advancedCount,date,gold,actionPoints,officers,rng`；officers每项 `{id,trueLoyalty,lastPraisedTurn}`，rng为 `{state,drawCount}`。非季初Advance的sortedTargetIds/officers/draws为空；季度目标列表包含所有普通成员及其豁免或非候选结果，而非仅最后掉忠者。

每份成功receipt覆盖：

- schema/profile、完整policy快照及digest、commandId和canonical命令
- revision、turn、date的before/after，排序目标
- 逐人资格、仁政/关系豁免、三分支候选短路trace与实际调用的完整相性receipt；关系映射/证据等级
- requested与actual gain/loss、true/display before/after、lastPraisedTurn before/after
- 金/AP before、cost、after，全部RNG draw和状态写集
- 原作未证范围、新关系/RNG/writer政策与现金魅力/义理差异

每个draw含 `drawIndex,label,targetId,bound,beforeState,afterState,value`。标签只为cash-gain、human-heart-control、natural-loss-first、natural-loss-second-lord、natural-loss-second-ordinary；原global RNG身份不由本流证明。

officers每项包含 `officerId,qualification,candidate,status,loyalty,lastPraisedTurnBefore,lastPraisedTurnAfter,controlRoll,cashGain,naturalLoss`。candidate含 `policyId,reason,eligible,benevolenceHolderIds,relationExemption,affinity,traitBranch,syntheticDislikeEax`；未执行的后续分支为null。loyalty为 `trueBefore,displayBefore,requestedGain,actualGain,requestedLoss,actualLoss,trueAfter,displayAfter,policyId`。cashGain包含policyId/roll/minimumGain/gain；naturalLoss含firstRoll/tokenAddition/lordAddition/secondRoll/lordBranch/requestedLoss；不适用项为null。resources为 `goldBefore,goldCost,goldAfter,actionPointsBefore,actionPointsCost,actionPointsAfter`。

失败恰为 `{ok:false,committed:false,reason,revision,turn,commandId,index}`，不夹带成功字段或部分receipt。原state无效时revision/turn为null，不可取得的commandId及非历史/trace定位index为null。实际代表原因包括：

```text
invalid-input / invalid-number / invalid-fields / invalid-data / invalid-prototype
invalid-object / invalid-array / invalid-boolean / invalid-id / invalid-date
invalid-json / duplicate-json-key / unsupported-profile / policy-mismatch
unsupported-personnel-scope / inconsistent-scenario
unsupported-command / affinity-policy-rejected
stale-revision / duplicate-command-id-conflict
unknown-officer / empty-targets / duplicate-target
display-loyalty-at-cap / already-praised-this-turn
insufficient-gold / insufficient-ap
advance-limit / calendar-limit / history-limit / serialization-budget
noncanonical-genesis / genesis-snapshot-mismatch / noncanonical-envelope
duplicate-accepted-entry / receipt-mismatch / snapshot-mismatch
trace-outcome-mismatch / trace-snapshot-mismatch
```

非法输入不被自动修补，未知人员不默认忠诚0。收据中的requestedLoss0与未入候选、免降及失败是不同语义。

## 7. 保存、加载与重放

此服务使用独立schema，不修改训练GameState/v2或任何其他服务存档。state封闭根结构为 `{tag:"personnel-loyalty-state-v1",schemaVersion:1,profile,policies,policyDigest,genesis,snapshot,acceptedCommands}`；genesis恰为 `{scenario,snapshot}`，acceptedCommands每项为 `{envelope,receipt}`。save成功返回json字符串，load接收该字符串。保存必须携带：

1. 完整canonical初始scenario，包括完整policy与seed
2. 所有接受的canonical envelope及完整receipt，按执行顺序
3. 最终snapshot、revision、date、turn/advancedCount、RNG state/drawCount和褒赏标记

load/replay从初态逐条运行同一个execute，核所有ID唯一性、revision、每条完整receipt与每次中间输出预算，最后比较整个snapshot。caller提供的最终快照不是可信状态来源；digest不替代逐值比较，当前policy不能静默覆盖保存的旧参数。

未知schema/profile/policy、缺字段、多字段、不可达state、receipt或RNG篡改、预算越限全部拒绝，不返回部分重建。保存/加载不推进日期、不消费随机、不清本旬褒赏标记。相同seed+初态+规范命令流按合同重现canonical receipt/state，JSON往返保留101..255；本批没有执行往返或重放验收。

replay接收封闭trace `{tag:"personnel-loyalty-trace-v1",scenario,attempts,expectedFinalSnapshot}`，attempts最多4096条，每项恰为 `{envelope,expectedOutcome}`。expectedOutcome为null或完整预期结果：成功 `{ok:true,duplicate,receipt}`，失败为完整Failure；expectedFinalSnapshot为null或完整Snapshot。期望值只比较重新派生的结果，不提供gain/loss/roll/资格/终态输入。失败attempt保留前一state，成功/幂等attempt按相同execute语义处理，返回逐次outcomes；指定期望不匹配则整个replay结果失败，index定位出错attempt。

## 8. 不支持范围与验收状态

P078及所有依赖排除；不接native capture/ownership/return/mission/relocation、势力灭亡、君主继承、俘虏、欠薪后果、登用后加入或改势力。没有流言、宝物授予/没收、死亡/疾病、任官、被捕/释放、在途/部队、港关/跨城、native存档、全局调度或跨服务预算同步。

旧普通登用决策API与O10-A足额工资服务不被重造；本模块只交付固定驻城自然忠诚及现金褒赏软件执行。source-shaped算术、新关系图、新随机流和新writer的边界必须保留，整个O12与原43证据组不关闭。

本批仅静态文本/代码交付，未新建或运行测试，未运行typecheck、编译、build、checker、诊断、schema validator、产品或示例；旧测试及历史food失败未改。历史PASS不覆盖本模块或当前树。
