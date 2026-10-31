# T33 蝗灾/丰收安全子集：两阶段纯叶

固定取证 `425ca111e3cbc6dc3745e511044f998bec107d79`，原文件/政策/source JSON归档于本目录 evidence。原政策 `season-simulation-20261018-v1` 明示新模拟、非原生常数。本候选**没有任何import、没有whole season create/execute/preview/load/replay调用**，plague整个分支不存在，亦没有health/兵损/收入/工资/AP/Closing/P078写入。

## API与元数据（无资源副本）

```
createSyntheticSafeSeason(config,initialContext)
config={profile:'synthetic-locust-harvest-subset-v1',initialMonthAlreadySettled:true,
 monthLimit:1..36,seed:1..4294967295,
 current:{locust:0..2,harvest:0..2},
 scheduled:{locust:null|Pending,harvest:null|Pending}}
Pending={activationYear,activationMonth,durationMonths:1..2}
initialContext={date:{year,month,day:1|11|21},officerIds:[...],facilities:[30 slots]}
Facility=null|{id,kind,level,complete}
```

构造只绑定现有合成ID与原slot ID，没有创建任何城市、人物或设施。计划日期必须已经结算，完整月数+一月lookahead<=9999年；pending仅允许下月且同kind inactive。专用非零seed不与自然忠诚或旧whole season RNG混用。

元数据仅含lastDate、advancedMonths/monthLimit、locust/harvest剩余月数和pending、专用rng.word/cursor、removedFarms exact `{slot,facilityId}`、原slotIds、原officerIds及瞬时phase/pendingSkills。没有food、TP、gold、troops、设施完整资源副本。每次接入outer仍要从原genesis+完整journal重放，此形状校验不能认证随意篡改的metadata来源。

```
planSyntheticSafeSeasonPreIncome(metadata,context)
context={date,turn,food,techniquePoints,facilities:[30slots],residentOfficerIds:[...],
 skillHolders:{fengshui:[ids],prayer:[ids]}}

planSyntheticSafeSeasonPostIncome(pre.metadata)
```

context取**当前唯一owner**余额、TP、设施视图、居家resident名单与当前技能投影。所有holders必须在resident名单，名单必须为绑定officerIds子集；不得把出征/在途角色视为驻城。技能来源本身由owner真实currentFacts或明确固定推断配置确定，不由用户临时请求bool赋值。metadata不另存一份静态技能真相。

## 两阶段与日期一次性

1. outer现有city/jobs/forge/research完成等先取得本旬私有候选。
2. `PreIncome` 要date严格等于metadata.lastDate下一旬；day11/21只前移lastDate，counter/RNG/资源不变，phase保持settled，**不调用PostIncome**。
3. day1 Pre执行decay→activate→locust，返回foodPatch/TPPatch before/after、exact removals、harvestActive及`phase:'awaiting-income'`。首次稻田移除后owner把同一slot view变null。
4. owner调用**既有唯一income叶**，输入post-removal当前slots和这个harvestActive；不调用旧season income函数，不额外credit。
5. income提案成功后 `PostIncome` 才生成下月safe pending/RNG，返回phase settled。重复post或未完成pre再次pre均拒绝；整个outerTick之后其他阶段若失败，以上所有候选一起丢弃。

保持旧 `decay-activate-damage-income-generate` 相对序；不因实现便利把生成提前到收入前。与城市其他服务的总排序仍需新owner profile具名，不能称完整原生顺序已验证。

新season模式应在income入口选择唯一 `harvestSource:'safe-season-current'`，不得同时让固定harvestInputs清单争夺当前boolean；旧supplied-list模式保留不变。helper本身既不构造第二income session，也不自动改旧配置。

## 精确叶子来源及有意差异

原 `city-season-lifecycle.ts:185–190`：locust/harvest每月先max(0,n−1)，pending匹配当月且remaining0才能激活/清空。风水阻止locust新激活/生成但**不治愈**已生效locust；丰收不受风水。初始计数这里限0..2，与safe种类最大duration一致（不开放原通用3月计数）。

原201–210：蝗灾rate=`200+draw(501)` basis points，loss=floor(当前food×rate/10000)。completed farm1按ID字典升序，draw(3)==0选中；每选中30TP，按原逐个次序检查。一旦不足返回失败attempt（保留至此draws、先前候选removals与当前selected），**不提交此前已选农场/TP/粮**，不继续抽后面农场以改变原失败轨迹。

food=0是本安全profile明确`zero-food-no-loss`，仍保留当月rate和farm抽样；不把旧whole-season正粮限制偷偷变成死亡/终结。TP0允许，选中农场且不足则整月拒绝。

只接受完整farm1/farm3事实；farm2或未完成farm明确拒绝，不能静默当免灾。非farm既有设施仅透明保留，绝不移除forge/stable/工作坊或修改其锁。扩展farm2/施工中的行为需要独立具名政策。

原214–221：仅inactive且无pending才生成；locust13/1000；harvest21/1000，有当前祈愿42/1000，不叠加holders；duration=1+draw(2)，生效期为下月。上述都是**沿用已有模拟参数**，不是恢复原生概率。

原143–151：xorshift32非零域，sample=word−1，limit=floor(4294967295/bound)×bound，sample>=limit重抽，每raw计cursor；保留每个raw和拒绝记录。最多4096raw，不重新每月seed；预算中断也返回已抽attempt。新stream名 `safe-subset-xorshift32-nonzero-rejection-v1`，plague抽样被整体移除，因此**与旧whole-season序列及原生RNG不等价**，不声称严格独立/无偏。

## 单一设施owner与tombstone

initial slotIds固定，允许在同一现有ID上读取owner当前completion/level；已移除slot必须null，不能换ID或复活原ID。初始空slot此有限profile保持空，不新增建造/恢复模式。每次pre验原slot/当前ID和全部旧tombstones；新removals只返回真farm1 ID+slot。

owner的incomeFacilities()/current施設view必须应用同一metadata tombstones，不改immutable economicFacilities genesis，也不能同时保留另一份可消费农场。收入、展示及后续消费者复用该当前视图；非候选设施/角色/历史完全不动。

## 交付状态

只完成纯叶候选及对应规则，未执行tests/typecheck/build或候选，未远端写。需唯一owner实际接WorldTick、postIncome调用、TP/food patch、harvest单输入、tombstone当前视图，再独立静态审阅；此前不宣称T33世界闭环完成。
