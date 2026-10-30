# T12：正值多目标落石原子批 v1

新增 `inferred-multi-rockfall.ts` 只组合既有 [正值损耗账本](inferred-positive-hazard-ledger-v1.md) 的 `rockfall` 命令，不重写公式、不改变默认。固定读取基线 `f84170228ca0ff98ead3d2887be993eef8088885` 的 `inferred-positive-hazard-ledger.ts`。公式及证据仍见 [推断战斗请求](inferred-combat-requests-v1.md)：部队1500+0..499、踏破floor(raw/10)，建筑800+0..999且不接受建筑踏破；共同base50是否参与的原未知仍保留，不因组合为多目标就升级原生证据。

## 外层状态与具名顺序

`createInferredMultiRockfall(initial)` 只接受旧单目标账本的1..64个合成目标初值（id、troop/building、正值value，全部由旧初始化校验），不接已有单目标历史或真实部队状态。外层状态严格为：

```
schema: inferred-multi-rockfall-ledger-v1
initial: 合成初值
commands: 批命令历史
```

每批严格含id、expectedRevision、targets。id为 `synthetic-[a-z0-9-]{1,48}`，批间唯一，revision连续；targets为1..16条，严格字段targetId、draw、pathbreaker、eligibilityConfirmed:true。targetId须按字符串字典序**严格递增**，因此同批不能重复目标；无自动排序，乱序输入拒绝，避免把caller错误悄悄归一化。

具名顺序policy为 `explicit-draws-target-id-ascending-v1`：先由调用方提供每个目标绑定的显式整数draw，再按目标ID固定顺序依次调用旧单目标命令。这是工程推断，**不是原作多目标遍历顺序或原RNG采样规律**；模块不自己抽随机数、不读取全局RNG，也不把部队与建筑不同draw上限混成同一分布。目标资格由caller逐项确认，不声称恢复原陷阱范围/地形判定。

## 原子执行与终结排除

`executeInferredMultiRockfall(state,batch)`：

1. 先完整重放旧外状态，校验新批revision/ID/形状/严格唯一顺序。
2. 最大64批，总单目标命令不得超过旧账本256条。若新增批整体会超容量，提交任何新目标前拒绝。
3. 从旧单目标初值重新创建内部账本，按外层历史重放；单目标派生ID为 `synthetic-rockfall-{批序号}-{目标序号}`，内部revision按成功单目标数，不能与外层revision混用。
4. 每个目标经原 `executeInferredPositiveHazard(...kind:'rockfall')` 校验并计算，保留原draw范围/踏破/目标存在/正值损耗门。任何目标非法、重复、抽样不合法、兵力或建筑耐久会归零/负值，整批失败；中间内账本仅局部候选，不暴露为成功结果，不修改输入。
5. 只有全部目标成功才外层revision加1并写一份批回执；回执含本批新增单目标effects及内外revision边界。新state保存外层初值与批命令，balances与innerState为重放派生结果。

跨不同批可再次命中同一目标，但每次基于前批余额；正值不足时整批拒绝。没有强制位移、地形/路径更新、击破、建筑毁坏、奖励、人物伤亡/归属、Closing、P078或globalcampaign写入。原生多目标finalizer仍未恢复；本批只完成有限显式合成正值账本的原子组合。

## 保存、去重与输入隔离

`readInferredMultiRockfall` / `saveInferredMultiRockfall` / `loadInferredMultiRockfall` 均从initial+commands完整重放；不能把外部balances/innerState/receipt快照塞进状态。外层重复batchId拒绝，而不是再次扣兵。虽然成功返回内层派生state供观察，本外层不接受其独立修改后直接回填；必须继续使用外层state以保留全批原子性。

普通数据先有界descriptor复制，拒访问器/symbol/循环/稀疏数组/自定义原型/额外数组字段等；Node支持时拒Proxy，其他runtime不能保证恶意Proxy反射trap无副作用，因此只支持可信普通数据。公共入口捕获异常返回失败。保存限10万字符，标准JSON.parse重复键last-wins归一化，不承诺原字节唯一/防作弊；更改合法初值意味着另一合成场景。

## 静态验收范围

核旧单目标模块参数及返回类型、两级revision/ID不冲突、唯一目标排序、整批容量预检查、失败无中间成功state、完整外journal重放及原限制不变。未执行候选、测试、typecheck或build；当前静态候选等待独审，不代表运行验收通过。
