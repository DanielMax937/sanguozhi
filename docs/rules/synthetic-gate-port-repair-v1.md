# T32：固定同home港关正值耐久修复叶

这是原45范围的有限合成消费者，不是原生驻扎、自动修复调度或新建造模拟。复用 `projectInferredGatePortRepair` 已有具名推断，不另建公式；原先 `inferred-positive-resource-ledger` 已有修复余额消费，本叶补同owner/固定位置/现有治理者的有限上下文。

## 严格输入

`SyntheticGatePortRepairContext` exact字段：profile=`inferred-fixed-home-gate-port-repair-v1`、ownerId、turn、homeCellId、cellIds、sites、governors。

- cellIds 1..512个唯一合成ID，homeCellId必须存在；owner不得与格ID碰撞。
- sites 1..8个：`{id,kind:'gate'|'port',ownerId,cellId,capacity,durability,governorActorId}`。已建成、同home owner、cellId严格homeCellId，capacity1..1000000、durability1..capacity。不是气力、兵力、堤坝或建设进度。不同site可作为同home格中的独立合成耐久记录，不推导占格阻挡、原生港关布局、射程或攻城。
- governors 1..32条现有home roster：`{id,ownerId,role:'resident'|'deployed',available,away,politics}`。政治必须唯一owner的basePK当前政治0..100，不取255宝物effective、不夹值。role/away由现有部署/旅途事实导出，available沿现有资格。
- site ID、governor ID分别唯一且不得互撞owner/格。每site必须绑定已有governor；本叶不任命/创建人物，多个固定记录可绑定同actor且不产生额外行动/收入。

治理者出现条件是 resident && available && !away；这是“同home驻留可用代理”的具名工程推断，不证明实际原作驻扎。强制home格避免凭空声称远端港关有治理者。原预约、acted不被清除或扣除；这是被动读取，不把普通行动当额外任命。

## API与结果

`validateSyntheticGatePortRepairContext(raw)`仅detach+校验，成功`{ok:true}`，无伪造修复。

`projectSyntheticGatePortRepairs(raw)`按site ID固定字典序，调用原request；返回 `{ok,turn,sitePatches,receipts,policy,governorPolicy,...}`，其中patch为`{id,before,after,amount}`。每个site都有回执，包括满值/缺席skip。不返回可独立保存state；不提供arbitrary delta。

实际旧计算：basis=clamp(floor(9P/2),150,450)，存在代理时requestedRepair=floor(3*basis/20)，否则0；credited=min(requested,capacity-durability)。所有耐久始终正且不超cap。满值或缺席在本批量叶中skip，避免一个满值site使世界永远不能Tick；旧standalone资源账本默认no-positive拒绝未改。

不额外扣AP/金、不造费用、奖励、TP、人物经验或新资源。不改capacity/owner/cell，不产生伤害、攻陷、删除、归零/修满finalizer。

## 唯一世界owner待接义务

本叶是纯提案，不宣称已接WorldTick。外层创世固定site ID/kind/owner/cell/cap/governor绑定，currentSites仅有可变durability；完整root journal逐步重放恢复，用户动作不得任意重给初值。新运行时实体/迁移别名不在范围。

每次WorldTick最多调用一次，重复命令从outer去重；同旬自动调度顺序须明确记录为具名推断。本叶不自主推进时间、不验证turn递增，不能凭caller的turn当重放授权。提交前核patch.before等于唯一currentSites，整批统一提交；任何后续phase失败要回滚全部耐久以及该Tick其他状态。无site旧模式保持不变，由外层不调用而非伪造空site列表。

## 证据和验收

evidence归档实际 `inferred-combat-requests.ts`、`inferred-positive-resource-ledger.ts` 和原规则。basis和15%修复仍explicit-inference-not-native，不宣称原生系数/调度/物理驻扎证据闭合。

仅静态查验：非法0耐久/cap越界/未知home/跨owner/重复ID/失配governor整批拒；满值和缺席零patch；输入不修改；无代码执行、tests/typecheck/build。等待独立审查与owner接线后整体审阅。P078、Closing、真实人物伤亡/归属、零兵/零耐久终结均不接。

## 当前整批接线状态

以上“待owner接线/集成”描述仅是本纯叶独立交付阶段的能力边界，不是当前累计候选尚未接线。当前本地整批已由[唯一owner规则](unified-repair-starvation-owner-v3.md)接入同一WorldTick和完整原子重放；整批独审与远端发布分别核验，纯叶PASS不代替整体或运行验收。旧默认保持，受限终结仍排除。
