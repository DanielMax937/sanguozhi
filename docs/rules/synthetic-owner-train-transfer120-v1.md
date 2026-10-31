# 同一 owner 的训练/转运气力 120 兼容叶

## 范围与证据

仅私有 owner 投影入口，旧 exports 默认仍 100。依据 main d417ecce 的 `calculations.moraleCap`、`state.validateState` 和 `docs/sources/pk-training-runtime.json`：普通100，技巧16可120，技术完成本身不增加气力。证据等级是已刊指令资料重建，不宣称原版可执行文件核验。

转运 weighted-floor 为已存在具名兼容推断；本批只放宽已获16的同owner输入域，不新增公式或恢复。

## API

- `planSyntheticTrainingBridge120(rawGameState, rawBindings, rawAction)`：参数/完整返回与原Train桥相同；policyId为 `synthetic-owner-train-tech16-domain120-v1`。仅使用真实 `executeCommand(Train)`，实际GameState的technique16决定cap。merit≤60000、合法GameState、同城市/同势力、resident/acted/预约锁、每旬训练marker等仍完整验证。默认growth与XP/TP/AP写入不改。不调用EndTurn。
- `SyntheticTransferEnergyContext = {ownerId, techniqueIds}`：exact字段，合成owner；完整当前techniqueIds为unique整数0..35，最多36个；仅16影响cap。必须由外层唯一research重放状态构造，禁止从用户动作直接透传。Train专用GameState继续投影其需要的16，转运context接受完整研究集合，二者不是第二技术余额。
- `createSyntheticCityTransports120(rawTransports, rawCity, rawOwnerEnergy)`：零动作初始化校验；0..8个运输账户，空数组也验证owner与city morale；返回 `{ok:true,transports}`。
- `planSyntheticCityTransferBridge120(rawCity, rawTransports, rawAction, rawOwnerEnergy)`：与原桥相同有限 `{cityPatch,transports,receipt,mappingPolicy}` 输出。所有城市和transport账户必须同context owner，并在派生cap内。
- 底层 `validateOwnerCapacityAccounts120(initial,context)`：只校验2..32个有限账户，返回accounts/cap，不造动作。
- 底层 `planOwnerCapacityTransfer120(initial,command,context)`：一次current proposal，command.expectedRevision必须0；复用原 `apply`，返回accounts/receipt/cap/energyPolicy。不是独立120 ledger，没有save/load，也不能靠反复调用代替outer去重。

## 原子性与守恒

保持源足额、目标15坐标容量、正兵账户与source剩余正兵门；不删除运输实体，不执行入城finalizer。金粮装备可归零但兵不能归零。

目标气力仍为 `floor((目标旧兵*目标旧气力+调入兵*源气力)/目标新兵)`；无调兵时气力不变，源气力不变。同cap的凸组合仍不超过cap；不夹值、不添气力、不减损记录。所有验证后在detach副本上提交。任何无16而morale>100、已16但>120、owner不符、重复技术、容量失败均拒整笔。

城市库存1..5仍映射本地槽0..4，后7槽quantity/cap/amount硬0；第五类reservation扣可用capacity而不变现quantity。无并列城市库存或余额。

## 外层必须完成的接线

唯一owner每次提供当前完整技术事实、原有城市ledger和transport列表；使用根journal进行去重/重放。创世无技术16就只允许100。研究完成仅改变派生上限，不改气力；后续Train真实增量才写入。必须同步动态city cap及Deploy/Return/field消费者，否则不能称全A闭合。本叶不改bounded/world/field。

失败时不提交任何AP/TP/库存/气力/acted/XP/history；完整Train返回必须整体提交，不只取morale。旧public容量v1仍以100重放，新底层current proposal不能当独立120存档恢复权威。任意调用者提交context不能证明世界解锁，只有外层全历史验证能证明。

## 静态验收范围

已逐项阅读旧默认路径、100/120门、正兵floor、reserved容量、加权floor、Train实际服务调用与完整patch。本批未执行候选、测试、构建、类型检查；需最终全A独立审查，不以本叶静态检查声称世界集成通过。排除P078、Closing、真实人物伤亡/归属和零兵终结。
