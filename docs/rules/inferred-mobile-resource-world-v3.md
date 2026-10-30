# 同一人物位置/行动与有限路径移动 v3

## 已有资料与保守适配

本模块复用 `supplied-map-movement.ts` 的实际 `moveOnSuppliedMap` 和 `GUIDE_REFERENCE_MOVEMENT_POLICY`，不是新寻路或新地形费用算法。已回读 main `f132870bb58505acd0572c23e3ba91592eefa849`，源码 Git blob `e338cdcdfffb1086f3bb66fe7abc9a8ca06d92f7`。旧核以 terrainInfoU32 低5位选地形，7/8取水上装备行；火标记按AL字节逻辑乘4，unknown/null费用拒绝。GUIDE成本只是已有手册参考表，不是原生完整地图/二进制字节证据。

地图为显式 synthetic supplied-directed-v1、最多16格的可替换小型战术图；它不是 #142 的200×200练习地图直接全图联动。同批 `createInferredPracticeMobileSlice` 可将既有练习图最多16格诱导窗口和source ID映射直接供本profile使用；跨切片迁移及全图联动仍不支持。也可明确提供其他合成小图，不能声称原生世界地图完成，更不把扩大预算当作无损地图接入。每个 actor 的 turnBudget 也是显式选定的合成预算，不冒充原版装备完整移动力或技能修正。移动不扣气力、不另扣AP/兵粮、不授XP，未有集成资料的副作用不捏造。进设施、攻陷、入城终结、碰撞战斗、跨城归属、P078、Closing、真实人物与归零终结均不开放。

## 稳定集中入口与旧版本

新增 `inferred-mobile-resource-world-v3`，API read/create/execute/save/loadInferredMobileResourceWorld；同一个 bounded 私有 timeline 新增 read/create/executeBoundedSyntheticMobileTimeline。保留 v1/v2入口与schema，不能把旧档直接改tag并当作迁移。新局显式提供额外的 movementMap 和 movementProfiles；之后仍从初始城市/资源/field/旅行+唯一commands完整重演，不重置已运行的工作历史。

`createInferredMobileResourceWorld(cityName,cityScenario,travelScenario,fieldCells,fieldTemplates,movementMap,movementProfiles,troopsBudget,resourceConfig,transportInitial)`。

fieldTemplates保留v2，movementProfiles与模板一一同序：`{actorId,landEquipmentId,navalEquipmentId,turnBudget}`，使用已固定GUIDE policy，transport=false（不是混用独立运输队账户）。movementMap为`{id,cells:[{id,terrainInfoU32,adjacent,blocked,unsupportedContext,facilityPresent}]}`，cell IDs与fieldCells同序、精确一一。没有caller occupied或fire flags字段；每一步都从当前唯一roster和当前fires派生，不能传过期环境快照绕开占位/火费。

## Move 的真实写入

外层命令 `{id,expectedRevision,action:{kind:'Move',actorId,path}}`，非空path最多16格。仅当前deployed、尚未行动、无混乱者可移动；居民没有隐藏位置或可花移动余额。路径每一格沿实际kernel检查邻接、blocked、动态占位、已知费用和预算，设施/unsupported路径及起点保守拒绝。无寻路猜测，无移动失败后的半路径写入。

成功只更新**当前同一actor**的cellId、movementBudget与acted=true；不是独立移动账本或另一个影子actor。field施计/火计随后立即读取同一位置与行动锁；同旬 Move 后不能再施计/Return，施计后也不能再Move。WorldTick完成原city生产/工资自然、field火寿命与驻留损耗、行动/移动预算恢复、旅行同步，任一失败全条拒绝。

驻留火伤仍只由Tick消费；穿火路径只按已有核计移动费用，不声称已经实现原作穿越触发损伤。所有火信息来自当前field，不能删除火史/重抽寿命来移动。Move不刷新turnBudget，部署预算与Tick恢复由固定profile管理。

Return仍只能在该模板固定entryCellId，离开后必须合法沿图移动回去并等行动资格恢复；不会瞬移回城。Deploy仍固定entry且拒火/已占位/不支持地块；费用沿v2既有T16 deploy20推断、no-office明确合同。返回当前兵与气力加权的唯一owner守恒不变。

## 历史、预算和边界

移动占真实outer/field日志槽；保持32条world与field限制及所有活动生产剩余Tick槽预留。旧城市生产预约、费用、startSnapshot、已完成历史没有被重新创世；旧独立移动request不作为可回灌信用。地图/profiles只在新局固定，命令不能重设成本、预算、位置、出生点或火。

该版本实现有限合成单城与可部署部队的移动闭环，不是原生地图、完整战役调度、自动攻城/入城或真实人物迁移。v2曾固定位置的边界在此明确推进，但其他没有实现的战斗/全局副作用不因此默认启用。

静态验收：移动到占位/设施/未知费用/超预算/非邻接整条拒绝；移动成功后唯一位置被后续火Tick使用；失败无部分路程、无额外扣费；移出entry不能Return；回到entry仍需下一Tick资格；同旬两Move/Move后Cast拒绝；保存重演相同位置/预算/角色/火；城生产始终保留。没有执行候选、tests、typecheck或build；必须对最终集成candidate独立审查，不能只沿用旧移动核PASS。
