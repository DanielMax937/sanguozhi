# T07 / T32 固定home据点正耐久攻击与具名太守响应

本批是单一有限正值合成交易，不是原生攻陷/城市作战全链。继承本地Merchant最终core `b6d38314` 所在累计候选；field实际固定前置为repair/starvation14中的 `f03da8da6fa8e6b0d230db50c6ab3d9f968690a321bb737a209224d9afa5db6b`。不改冻结41尾链目录。没有测试、typecheck、build、候选执行或远端写入。

## 证据与算式

实际读取既有 `05-combat.md` §7.2 和 `77-siege-durability-inner-helper-boundary.md`。耐久helper与部队兵损不是同一核：普通重构式为

`raw=sqrt(currentTroops)*resolvedAttack*sqrt(1/1500)*(1+15/25)*targetMultiplier`

其中普通近接power15，gate倍率0.6、port倍率0.8；最后一次 `floor(raw)`。外层倍率/调用结构有逆向资料，普通inner闭式属于empirical-high/reconstructed，x87低值/inner body未闭合；实现binary64不宣称逐指令exact。未伪造一支目标守兵把普通兵损硬当耐久，也没有native siege engine实现。

首版只普通陆军sword/spear/halberd/crossbow/cavalry、normal难度、无技能、无额外耐久修正的近接中性输入。真实techniqueIds必须完整，当前仅接受[]或[16]（气力容量、非耐久修正）；其他实际技巧明确拒，不能传空列表隐藏云梯/已学tech。当前实际resolved attack panel来自已有scenario固定面板，不从武力擅自新算，也不暗中复制兵数为守军。原生云梯/会心/战法/攻城器械/其他难度暂不支持，不能说T07所有效果闭合。

## 纯叶输入和结果

`projectSyntheticSiteAttack(raw)` exact字段：
```
{profile:'inferred-fixed-home-site-positive-strike-v1',turn,homeOwnerId,homeCellId,
 map:{cells:[{id,q,r,blocked}]},
 actor:{id,ownerId,cellId,role:'deployed',troops,energy,acted,status,available,
        weapon,attackPanel,techniqueIds,skillKeys,difficulty:'normal'},
 site:{id,kind:'gate'|'port',ownerId,cellId,capacity,durability,governorActorId},
 governor:{id,ownerId,role:'resident'|'deployed',available,away,war},
 response:null|{profile:'inferred-fixed-site-governor-response-v1',baseCounterDamage}}
```

地图1..16格，坐标0..15、ID/坐标唯一，双方实际轴坐标距离恰1、格未blocked；不移动入城，不修改地图阻挡。site必须现home格、home owner、已完成capacity1..1e6及durability1..capacity；actor必须异owner、已部署、normal/available/unacted、正兵<=1e6，energy按实际tech16受100/120门限，无另气力扣费。身份不得与owner/格/site/governor相撞。所有raw输入使用现descriptor-safe bounded-city detach后exact检查。

**本profile选择伤害0拒绝** `no-positive-site-damage`，与旧普通攻击可零损失不同；不强制最小1，也不消耗行动。伤害>=当前耐久拒整个交易，不钳1、不攻陷、不换owner。

成功输出：
- `sitePatch:{id,before,after,requestedLoss}`，after严格正；
- `actorPatch:{id,ownerId,cellId,troopsBefore,troopsAfter,energyBefore,energyAfter,actedBefore:false,actedAfter:true}`；
- 详细算术、原始float、策略和可选response receipt。

叶无状态/时钟/世界写入；不产生守兵伤害、经验、奖励、AP、金、TP或T21粮请求。

## 可选据点太守反击，非T09部队支援

`baseCounterDamage`必须是创世显式声明1..1e6的练习场基础强度。它不是据点原生守兵/指挥上限基础式，不是耐久损失换算率，也不从隐藏假部队计算。只有指定existing home governor当前resident、available、not-away时生效；war用当前basePK0..100，不夹255装备有效值。

复用实际 `projectInferredGovernorCounterattack`：
`requested=floor(baseCounterDamage*(100+max(war-65,0))/100)`。

这是已有 `inferred-governor-war-above65-linear-v1`具名推断；旧counterattack ledger已可正值消费，本叶直接作用唯一field actor troops，不新增可保存hazard子账本。无governor资格则skip，无response则disabled。响应若为0/无效或使攻击者<=0，整笔拒；site damage、actor行动均不能部分提交。响应不消耗governor acted，不产生第二反击/应射/支援，不修改人物health。

## 私有field / 唯一world owner

普通公开field命令没有AttackSite入口。只允许内部 `OuterStep.siteStrike={actorId,siteId,context:{homeOwnerId,homeCellId,site,governor,response}}` 且 `fieldAction===null`；不能同时其他field动作、饥饿Tick或任意troop delta。

field不接受caller构造actor：它从同一当前roster读取兵、气力、位置、acted、状态；固定encounter读取weapon、normal attack panel、实际坐标；当前PK事实读取skillKey；固定模板读取available。仅existing enemy owner可打home site。私有 `combatTechniquesByOwner`要求实际两方完整列表，enemy等固定genesis，A启用时home也等当前研究事实；不能清空实际enemy技巧。全部由根重放再生，不把此私有DTO当用户授权。

response非null时，governor还必须现home field模板，role与同roster一致、war与currentFacts永久PK值一致。world须在siteStrikeConfig创世预检所有非null响应site的governor属于field.homeActorIds，避免接纳后才发现支持域缺口。response:null时不要求field模板，以保留既有repair允许非field home officer的域；其existing身份/role/basePK/away/available由world根证明，field不假称掌握不存在的field外事实。纯叶始终核site/governor绑定及homeowner。

field只写唯一actor troops/acted，返回当前commandId的 `kind:'AttackSite'` receipt，含sitePatch及 `requiresExternalSiteSettlement:true`。它不保存另一site耐久表，standalone field不是完整据点交易。world唯一 `repairs.sites` 必须验证同site当前before、正after、固定配置和治理者源，只有全链成功才提交耐久与field/全部资源。重复ID/revision/history及once-action沿用既有root规则；任何后续失败不接受已经扣了的site/actor。保存重放保留原始siteStrike上下文并由world重新生成，不能用派生snapshot冒历史。

Owner已约定 `siteStrikeConfig={profile:'inferred-fixed-home-site-positive-strike-v1',responses:[{siteId,baseCounterDamage:null|positive}]}` 对现site一一覆盖，仅新显式能力启用，旧默认不变。公共World动作只含actorId/siteId，不接受site/currentGovernor/baseCounterDamage覆盖。

## 验收边界

同owner、未知site/actor、非相邻、非normal、已行动、非中性tech/skill、缺真实列表、非正耐久/兵、非法响应、陈旧site before应全部拒；零伤害不消耗动作；一次合法敌军攻击仅消耗其一次acted和真实耐久/可选正兵响应。不存在兵力/耐久归零、入城/攻陷、真实人物归属、Closing/P078、奖励或无限战役。独审还必须覆盖实际唯一world site owner和公共路由，不能以本私有叶PASS代替全链完成。

回执补充：仅私有siteStrike且response非null的OuterStep将war列为已消费并从metadataOnly移除，另标warAttributeView=permanent-base-pk；实际既有gov war一致性资格及有资格响应使用该永久值，不声称使用装备有效war。response:null和其他旧分支不新增该声明。零伤害拒策略保持不变。
