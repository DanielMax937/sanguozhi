# Facility construction lifecycle v1 API

独立标准9设施新建与5类吸收合并服务。完整具体规则、数值、来源等级及政策争议见[规则正文](../rules/facility-construction-lifecycle.md)。实现为`packages/engine/src/facility-construction-lifecycle.ts`，由engine public index导出。没有扩展GameState/v2、原训练沙盒、城内生产、财政或商人schema；没有原生任务或战斗HP。

本批代码、schema、场景均未运行；未执行测试、typecheck、编译、build、checker、诊断、产品或示例。下列是调用合同，不是验证通过记录。

## 导出内容

- `FACILITY_CONSTRUCTION_CATALOG_V1`和`FACILITY_CONSTRUCTION_CATALOG_DIGEST_V1`：9类固定完整目录、升级typeId/文献耐久和金粮行
- `FACILITY_CONSTRUCTION_POLICY_REGISTRY_V1`：apRecovery、initialWork、rewards、completionActors四个数组，每组两个完整注册候选
- `FACILITY_CONSTRUCTION_DEFAULT_POLICIES_V1`：全部共同参数及四组首个候选组成的默认快照；四组可独立选择，共16种组合
- `FACILITY_CONSTRUCTION_EVIDENCE_V1`：速率listing、社区表、临时writer及非原生/非stock/无维修边界
- 公共类型`FacilityConstruction…V1`：Scenario、State、Snapshot、Command、Envelope、Policies、Catalog、Facility、Job、Receipt、Write、Failure、StateResult、CommandResult、PreviewResult、SaveResult、Trace、ReplayResult、EffectsResult

导出值和成功/失败返回递归冻结。实现只接受普通JSON数据，不以Proxy安全识别为保证。入参分离后解析，调用者不因preview/execute失败被修改。

## 创建场景

`createFacilityConstructionState(scenario: unknown)`返回`{ok:true,state}`或Failure。顶层必须具有schemaVersion/profile/date/turn/advanceLimit/activeForceId/force/corps/city/economy/officers/lots/facilities/hostileForceIds/completeFieldUnits/fieldUnits/turnInputs/policies/catalog。

字段、数值边界见[规则§1](../rules/facility-construction-lifecycle.md#1-场景账户与支持范围)及[结构schema](../sources/facility-construction-lifecycle.schema.json)。最多30地块/128人员/128单位/128敌方势力。初始设施只能complete的原始id/lotId/kind/level，类型/有效等级/任务字段不得手填。所有者固定；场景必须不与其他独立服务共享活跃任务，无法导入那些服务的在途生产锁。

创建即验证所有未来旬输入、最终日期/turn可表示、catalog全内容与每个政策全参数。日期有效不代表场景可无限前进。初态revision=0、advancedCount=0、jobs=[]、人员reservation=null；初态actedTurn保留，不能借create/load隐式刷新行动资格。

示例文件是`{status,description,scenario,commands,manualExpectations}`；传入其中scenario字段，不是整个包装。commands及manualExpectations仅纸面设计，没有执行。

## 命令、预览与执行

完整envelope为`{id,expectedRevision,command}`。三种命令：

```ts
{ type: 'StartDevelopment', cityId, lotId, facilityId, facilityKind, officerIds }
{ type: 'StartAbsorption', cityId, receiverId, donorId, officerId }
{ type: 'AdvanceFacilityTurn' }
```

不接受rate、cost、duration、initialProgress、completed、success、settlement、targetDate或任何额外字段。StartDevelopment的人数1..3且唯一；StartAbsorption只有一个officerId。不存在取消/拆除/伤害/修复/捕获命令。

`previewFacilityConstructionCommand(state,envelope)`返回`{ok:true,committed:false,duplicate,receipt,projectedSnapshot}`。与execute共享完整重建、合法性、资格、费用、任务计算、有限horizon和完整execute输出预算；投影snapshot不是可直接替代state的授权结果。

`executeFacilityConstructionCommand(state,envelope)`返回`{ok:true,committed,duplicate,state,receipt}`。调用方需要采用新state。新命令一次原子提交，revision+1；命令拒绝无副作用。

相同ID和完整envelope相同，返回原回执且duplicate=true/committed=false；这在后续revision、日期、horizon变化后仍成立。同ID改expectedRevision或命令任何字段就是command-id-conflict；新ID旧revision是revision-conflict。累计最多512任务、872接受命令；开始任务必须在场景剩余旬数内可完成。

## 状态与回执

state保存完整genesis scenario与初态snapshot、policies/catalog及canonical SHA-256摘要、acceptedCommands和当前snapshot。snapshot含force/corps/city实际账户、officers/预留、活动facilities、所有jobs、usedFacilityIds及本旬fieldUnits。

- facility：id/lotId/kind/目标level/typeId、status、effectiveLevel、当前jobId。完成任务的历史不阻止该设施日后新任务；当前jobId必须匹配
- development job：起始政治、1..3参与者、start/dueTurn、dueDate、duration/remainingTurns、work(initial/current/required/perAdvance/完整rate回执)
- absorption job：旧级/目标级、开始政治和期限，work=null；不伪造耐久进度
- 已消耗donor从活动数组删除，其完整快照在开始receipt；usedFacilityIds保留历史身份，旧lot释放而旧ID不可复用
- receipt：完整命令、前后revision/date/turn、owner/corps/city、policy/catalog digest、AP/金Write、sourceBoundary、rngDraws=0
- 开始receipt还含完整job、createdFacility或receiverBefore/After、removedDonor、逐单位敌情检查
- Advance receipt含固定输入索引/内容、每个active job的剩余旬与work前后、完成项；完成项含等级/type/有效等级、TP Write、逐人XP/功绩Write与政治不变快照、释放人员和政策ID

`Write={before,requestedDelta,actualDelta,after,cap,discarded,policyId}`。负数只用于足额扣费；正数奖励/AP允许封顶弃置。完整policies/catalog在state/genesis中保留，回执摘要关联这些不可任意替换的快照。

默认奖励为建设XP3（造币/谷仓4）、功绩100，吸收XP2/功绩100，TP建设30/50与吸收10。造币150功绩是可选政策；功绩冲突、多人分配/完成时点未被宣称为原writer。默认完成人员当旬已行动，替代政策允许当旬再用；所有在途人员都保持busy。

## 有效设施与只读经济投影

`projectFacilityEffects(state)`返回`{ok:true,effects}`或Failure。effects含revision/turn/date、policy/catalog digest、facilities、productionSlots、lotSlotOrder、money/food的完整旧核输入与结果，以及incomePosted=false/externalProductionJobsIntegrated=false。

新建effectiveLevel=0；吸收effectiveLevel=旧级；完整=目标级。每个有效生产建筑只给一个槽。实际调用旧金粮核，传目标type与constructionWord，让旧核处理吸收中的降一级；邻接只取已完mint/granary且布尔不叠加。未完成Lv1市场/农场省略邻接字段，避免旧核将额外字段拒绝。

这是基于scenario.economy和当前设施的返回值投影，不写实际金粮、不改变其他服务genesis、不分配外部生产任务。即使建设state合法，旧money核也可能因signed32安全域拒绝极端参数组合，此时返回unsupported-effects-projection；本API不保证所有合法建设state均可形成经济结果。战斗HP没有输入、状态或输出，documentedMaxDurability只是目录数据。

## 保存、加载、重放

- `saveFacilityConstructionState(state)`：全量重建后返回`{ok:true,json}`，json为canonical JSON文本
- `loadFacilityConstructionState(json)`：有界JSON解析，重复解码键拒绝；从genesis重建每步，返回`{ok:true,state}`
- `replayFacilityConstructionTrace(trace)`：tag=`facility-construction-trace-v1`，包含scenario、attempts与expectedFinalSnapshot；每次attempt为`{envelope,expectedOutcome}`，expectedOutcome可null或完整成功/失败断言

成功trace outcome为`{ok:true,duplicate,receipt}`，失败为`{ok:false,reason,blockingUnitId}`。失败/重复都可作为尝试记录，但只新接受命令进入state.acceptedCommands。最多2616尝试；返回`{ok:true,state,outcomes}`，或Failure指示失败index。

所有重建检查完整政策和目录而不只digest；比较genesis snapshot、每一步receipt全部字段、最终snapshot全部字段。每个接受步骤严格执行与execute相同的完整输出预算；不能用load/replay绕过原执行预算。snapshot不能自行改progress、completedTurn、rewards、busy、donor、政策或有效等级后保存。

## Failure与限制

Failure统一`{ok:false,committed:false,reason,index,blockingUnitId}`。index通常null，历史或trace失败时为从0开始的步骤；blockingUnitId仅在敌军门槛失败时给出。

常见reason：invalid-fields、unsupported-scenario-schema、policy-mismatch、catalog-mismatch、owner-corps-mismatch、officer-not-found/unavailable/busy/already-acted、unknown-lot/occupied-lot、facility-id-reused、incompatible-absorption-kind/level、facilities-not-adjacent、facility-busy、hostile-within-two、insufficient-action-points/gold、completion-outside-horizon、advance-limit、job-history-limit/history-limit、command-id-conflict/revision-conflict、receipt-mismatch/snapshot-mismatch、budget-exceeded、unsupported-effects-projection。

结构schema只覆盖类型内envelope；runtime也可从unknown输入记录非法字段/不支持命令等更宽的失败尝试，这些尝试不一定通过该shape。结构schema不是运行结果；rate回执对象的完整语义、各ID关系、余额cap、marker≤turn、有限日历和回执重放都由运行时检查。本服务不支持原生任务、取消/返回/易主/捕获、PK特殊楼、战斗耐久、维修、原生EndTurn或全局财政/生产组合。
