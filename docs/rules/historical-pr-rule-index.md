# PR1–71 游戏规则正文定位表

范围截至PR #71。本表按每个PR实际新增或修订的有限机制定位规则正文；“正文覆盖”不等于完整游戏、原作等价、运行验证通过或所有外部来源重新考据。参考模型、静态资料、生产接口与维护分别标明，旧版本未知域不会被后续局部恢复自动改写。原43证据主题不减，P078及其依赖不恢复；历史受限研究只保留已有来源记录。

本次补充PR #4/#5、#36/#37/#38/#43/#44、#69/#70的运行政策或完整有限事实正文，纠正训练资格的过时open与专题历史发布措辞。原数据文件保留，事件条件/结果的未知、矛盾和版本不能由表格整理变成已认证事实。事件资料仍不可执行。接口/JSON合同可继续查docs/engine，但具体游戏规则不只依赖外链。

本轮仅静态文档回溯，未运行测试、编译、构建、演示或诊断；历史food默认全套失败仍保留。PR #1/#2范围宽，本表定位其现有规则专题及后续纠错，不是重新独立认证所有原始文献。维护PR不捏造新的游戏规则。

证据缩写：S为固定MOD关联S1/S2 IDB的selected-byte/opcode/source-local重建，PK工程采用compatibility-reconstruction，clean-stock未认证；PR #3当时以S1为主，S2属于后续对照。SLR为source-listing-reconstruction；“目标PC-PK1.1”不等于已认证原始补丁。Vanilla、主机及旧版本范围按各专题单独保留。

| PR | 实际交付机制/性质 | 具体规则正文 | 覆盖口径 | 版本及证据边界 |
|---|---|---|---|---|
| [#1](https://github.com/DanielMax937/sanguozhi/pull/1) | 基础规则说明，无生产代码 | [00-turn-scenario](00-turn-scenario.md)；[README](README.md)；[SOURCES](SOURCES.md) | 已有有限规则正文 | 原版/PK分层，手册/攻略/假设混合，逐条等级保留 |
| [#2](https://github.com/DanielMax937/sanguozhi/pull/2) | 来源复核与规则/checker纠正，无新游戏引擎 | [13-open-exactness](13-open-exactness.md)；[STATUS](STATUS.md) | 已有有限规则正文 | 各专题分别标原版/PK/平台/来源限制 |
| [#3](https://github.com/DanielMax937/sanguozhi/pull/3) | 设施保留selector；scripts/capture_selector_profile.py | [81-capture-selector-source-profile](81-capture-selector-source-profile.md) | 已有有限规则正文 | S，S1为主 |
| [#4](https://github.com/DanielMax937/sanguozhi/pull/4) | 训练内核；packages/engine/src/{engine,calculations,rules,state,types,replay}.ts | [training-runtime-policy](training-runtime-policy.md)；[19-training-morale](19-training-morale.md)；[46-training-morale-exactness](46-training-morale-exactness.md) | 本次补充有限规则正文 | 来源重建+明确工程policy；clean stock未证 |
| [#5](https://github.com/DanielMax937/sanguozhi/pull/5) | 训练生命周期/累计XP；同训练引擎 | [training-runtime-policy](training-runtime-policy.md)；[82-training-lifecycle-source-profile](82-training-lifecycle-source-profile.md) | 本次补充有限规则正文 | S1重建；S2负对照；Vanilla未知 |
| [#6](https://github.com/DanielMax937/sanguozhi/pull/6) | 三caller cause、外交gate、世界候选、资源/转属/入城/耐久顺序、容量和fallback | [83-capture-transaction-source-profile](83-capture-transaction-source-profile.md) | 已有有限规则正文 | S |
| [#7](https://github.com/DanielMax937/sanguozhi/pull/7) | 人员ID序、末城/宝物/skill优先、精确浮点概率、p100耗随机、处分码/部分俘虏写回；未投影链明示 | [84-capture-personnel-source-profile](84-capture-personnel-source-profile.md) | 已有有限规则正文 | S |
| [#8](https://github.com/DanielMax937/sanguozhi/pull/8) | 旧俘虏释放、目的地优先/距离/tie RNG、期间byte、缺席roster、身份rank稳定排序、callback边界 | [85-capture-relocation-source-profile](85-capture-relocation-source-profile.md) | 已有有限规则正文 | S |
| [#9](https://github.com/DanielMax937/sanguozhi/pull/9) | 在野home选择/字段事件顺序、取消44槽/37跳过、资源signed32与容量、未知拒绝 | [86-personnel-detachment-source-profile](86-personnel-detachment-source-profile.md) | 已有有限规则正文 | S |
| [#10](https://github.com/DanielMax937/sanguozhi/pull/10) | 9/10/12/22/23/24各gate、零退款tail/位置、S2 query | [87-mission-cancellation-zero-refund](87-mission-cancellation-zero-refund.md) | 已有有限规则正文 | S |
| [#11](https://github.com/DanielMax937/sanguozhi/pull/11) | 2/5分组前三人、key/顺序、计数器signed byte clamp、研究清理与两源域 | [88-group-mission-cancellation](88-group-mission-cancellation.md) | 已有有限规则正文 | S |
| [#12](https://github.com/DanielMax937/sanguozhi/pull/12) | 0/38 gate、建物raw reset、宝物42、type0..2城市/港关销毁defer、计数器回绕/引用扫描 | [89-facility-mission-cancellation](89-facility-mission-cancellation.md) | 已有有限规则正文 | S |
| [#13](https://github.com/DanielMax937/sanguozhi/pull/13) | 41–43训练record域、home通知、零退款及S2 hook | [90-special-mission-cancellation](90-special-mission-cancellation.md) | 已有有限规则正文 | S |
| [#14](https://github.com/DanielMax937/sanguozhi/pull/14) | 37退款/reset/期间、dispatcher返回、移动节点与最近六邻、到达保存值、全调度未知 | [91-return-mission-lifecycle](91-return-mission-lifecycle.md) | 已有有限规则正文 | S |
| [#15](https://github.com/DanielMax937/sanguozhi/pull/15) | 保存对象、home/list/legion与bit9、真实troop门、职责次序、不清其他任务字段 | [92-officer-return-finalizer](92-officer-return-finalizer.md) | 已有有限规则正文 | S |
| [#16](https://github.com/DanielMax937/sanguozhi/pull/16) | 稳定军团/太守排序容量及tie、event8写前/event14清后、空军团/灭亡defer | [93-legion-role-reconciliation](93-legion-role-reconciliation.md) | 已有有限规则正文 | S |
| [#17](https://github.com/DanielMax937/sanguozhi/pull/17) | event8/14 predicate、复制节点/重复/live读取、37跳过与handler/dispatcher返回区别 | [94-mission-event-listeners](94-mission-event-listeners.md) | 已有有限规则正文 | S |
| [#18](https://github.com/DanielMax937/sanguozhi/pull/18) | 玩家第一军团通知、23/24、saved home/distance、回调live更新与S2 effect | [95-mission-notification-tail](95-mission-notification-tail.md) | 已有有限规则正文 | S |
| [#19](https://github.com/DanielMax937/sanguozhi/pull/19) | 共享frame、递归callstack局部值、最终observer fresh读、一次revision与精确观察 | [96-mission-event-composition](96-mission-event-composition.md) | 已有有限规则正文 | S |
| [#20](https://github.com/DanielMax937/sanguozhi/pull/20) | return/list/role/event递归、remove-first/append不去重、sort边界、工程guard非原作规则 | [97-recursive-officer-return](97-recursive-officer-return.md) | 已有有限规则正文 | S |
| [#21](https://github.com/DanielMax937/sanguozhi/pull/21) | roster ID key、三sort与tie、实时比较/saved左容量、title/office/tech/S2 queries | [98-native-roster-sort](98-native-roster-sort.md) | 已有有限规则正文 | S |
| [#22](https://github.com/DanielMax937/sanguozhi/pull/22) | mission参数route、target force getter、两地图边界、saved/live；另见100专题对后继路径的更正 | [99-return-route-target-force](99-return-route-target-force.md) | 已有有限规则正文 | S |
| [#23](https://github.com/DanielMax937/sanguozhi/pull/23) | 首军团/非首、fallback全局ID原行为、最近城市/S2熵、合并live扫描、精确raw reset | [100-empty-legion-redistribution](100-empty-legion-redistribution.md) | 已有有限规则正文 | S |
| [#24](https://github.com/DanielMax937/sanguozhi/pull/24) | 归属分类/耐久signed16/两源科技、城市bits、event9/10 predicate/尾部观察 | [101-base-ownership-events](101-base-ownership-events.md) | 已有有限规则正文 | S |
| [#25](https://github.com/DanielMax937/sanguozhi/pull/25) | status2/governor门、君主/非君主、away/same-home、固定参数移动、取消返回、坐标表；旧API仍保留本版本范围 | [102-officer-relocation](102-officer-relocation.md) | 已有有限规则正文 | S |
| [#26](https://github.com/DanielMax937/sanguozhi/pull/26) | 9/10/12/22 fresh/saved、force结果丢弃、pointer构造与行读区别、presentation、live return | [103-live-zero-refund](103-live-zero-refund.md) | 已有有限规则正文 | S |
| [#27](https://github.com/DanielMax937/sanguozhi/pull/27) | generic ID87..16383、null指针、归属后无条件1、canonical capture全frame观察及参数；未声称整capture | [104-generic-facility](104-generic-facility.md) | 已有有限规则正文 | S |
| [#28](https://github.com/DanielMax937/sanguozhi/pull/28) | live位置/home、两次地带查表、有向距离、savedDistance低byte255 | [105-native-tail-distance](105-native-tail-distance.md) | 已有有限规则正文 | S |
| [#29](https://github.com/DanielMax937/sanguozhi/pull/29) | location87..1086、主将valid/副将只上界、actor无valid门、canonical vtable、未知观察 | [106-native-troop-membership](106-native-troop-membership.md) | 已有有限规则正文 | S |
| [#30](https://github.com/DanielMax937/sanguozhi/pull/30) | base/troop/fallback live坐标、mutable fallback无默认、packed signed16与地图 | [107-native-live-position](107-native-live-position.md) | 已有有限规则正文 | S |
| [#31](https://github.com/DanielMax937/sanguozhi/pull/31) | live链节点、raw44域、保存cursor/对象和读序、未知suffix，工程node guard不冒充原作 | [108-native-event9-selection](108-native-event9-selection.md) | 已有有限规则正文 | S |
| [#32](https://github.com/DanielMax937/sanguozhi/pull/32) | virtual48/08观察、临时presentation范围与后续reaction分界、saved cursor | [109-native-event9-presentation](109-native-event9-presentation.md) | 已有有限规则正文 | S |
| [#33](https://github.com/DanielMax937/sanguozhi/pull/33) | saved force EBX有效门、DWORD94=-1/byte98=0、saved manager、回调后不重验；只闭合该prefix | [110-native-event9-force-reset](110-native-event9-force-reset.md) | 已有有限规则正文 | S |
| [#34](https://github.com/DanielMax937/sanguozhi/pull/34) | saved troop ESI valid门、raw44=-1写宽、无多余ownership/重验、remaining suffix明确 | [111-native-event9-troop-reset](111-native-event9-troop-reset.md) | 已有有限规则正文 | S |
| [#35](https://github.com/DanielMax937/sanguozhi/pull/35) | live virtual08、leader person/home、数字0..16383 pointer resolver不读valid；后续effect helper仍open，不启动P078 | [112-native-event9-home-getter](112-native-event9-home-getter.md) | 已有有限规则正文 | S |
| [#36](https://github.com/DanielMax937/sanguozhi/pull/36) | 静态港关所属 | [static-subordinate-bases](static-subordinate-bases.md)；[historical-subordinate-bases-catalog](historical-subordinate-bases-catalog.md) | 本次补充有限规则正文 | 社区资料，平台/版本未知 |
| [#37](https://github.com/DanielMax937/sanguozhi/pull/37) | 静态能力树及只读导出 | [15-pk-ability-research](15-pk-ability-research.md)；[historical-pk-ability-research-catalog](historical-pk-ability-research-catalog.md) | 本次补充有限规则正文 | PK documented-guide |
| [#38](https://github.com/DanielMax937/sanguozhi/pull/38) | 静态史实事件 | [historical-event-source-data](historical-event-source-data.md)；[historical-scenario-events-atwiki-catalog](historical-scenario-events-atwiki-catalog.md)；[historical-scenario-events-gamersky-catalog](historical-scenario-events-gamersky-catalog.md)；[historical-scenario-events-inventory](historical-scenario-events-inventory.md) | 本次补充有限规则正文 | public-guide-transcription，版本未知保留 |
| [#39](https://github.com/DanielMax937/sanguozhi/pull/39) | CLI预检与0.76文案纠正 | [13-open-exactness](13-open-exactness.md) | 维护，无新增游戏机制 | 工程维护+证据纠正 |
| [#40](https://github.com/DanielMax937/sanguozhi/pull/40) | 回放历史累积性能 | [training-runtime-policy](training-runtime-policy.md) | 维护，无新增游戏机制 | 工程合同 |
| [#41](https://github.com/DanielMax937/sanguozhi/pull/41) | adapter证据校验及统计 | [training-runtime-policy](training-runtime-policy.md) | 维护，无新增游戏机制 | 工程合同 |
| [#42](https://github.com/DanielMax937/sanguozhi/pull/42) | 交付/缺口摘要对齐 | [STATUS](STATUS.md) | 维护，无新增游戏机制 | 文档对账 |
| [#43](https://github.com/DanielMax937/sanguozhi/pull/43) | 静态通用事件 | [generic-event-source-data](generic-event-source-data.md)；[historical-generic-events-catalog](historical-generic-events-catalog.md)；[historical-generic-events-inventory](historical-generic-events-inventory.md) | 本次补充有限规则正文 | 攻略转录；Wiki版本未知、游民PK |
| [#44](https://github.com/DanielMax937/sanguozhi/pull/44) | 静态PS2史实 | [ps2-historical-event-source-data](ps2-historical-event-source-data.md)；[historical-ps2-scenario-events-catalog-01-32](historical-ps2-scenario-events-catalog-01-32.md)；[historical-ps2-scenario-events-catalog-33-64](historical-ps2-scenario-events-catalog-33-64.md)；[historical-ps2-scenario-events-inventory](historical-ps2-scenario-events-inventory.md) | 本次补充有限规则正文 | PS2，edition/patch未知 |
| [#45](https://github.com/DanielMax937/sanguozhi/pull/45) | 生产五维培育纯函数 | [pk-stat-training-s1](pk-stat-training-s1.md) | 已有有限规则正文 | MOD关联S1 compatibility-reconstruction |
| [#46](https://github.com/DanielMax937/sanguozhi/pull/46) | 生产特技培育资格纯函数 | [pk-skill-training-s1](pk-skill-training-s1.md) | 已有有限规则正文 | MOD关联S1 compatibility-reconstruction |
| [#47](https://github.com/DanielMax937/sanguozhi/pull/47) | 忠诚候选参考纠正 | [natural-loyalty-candidate-boundary](natural-loyalty-candidate-boundary.md) | 已有有限规则正文 | 固定公开listing，非stock |
| [#48](https://github.com/DanielMax937/sanguozhi/pull/48) | 生产建设速度纯函数 | [domestic-construction-rate](domestic-construction-rate.md) | 已有有限规则正文 | SLR |
| [#49](https://github.com/DanielMax937/sanguozhi/pull/49) | 生产巡查增量纯函数 | [patrol-security-gain](patrol-security-gain.md) | 已有有限规则正文 | 公开PK listing，精确补丁未证 |
| [#50](https://github.com/DanielMax937/sanguozhi/pull/50) | 生产价格纯函数 | [production-price](production-price.md) | 已有有限规则正文 | SLR |
| [#51](https://github.com/DanielMax937/sanguozhi/pull/51) | 生产数量纯函数 | [production-quantity](production-quantity.md) | 已有有限规则正文 | SLR，原常量bytes未证 |
| [#52](https://github.com/DanielMax937/sanguozhi/pull/52) | 相性距离纯函数 | [affinity-distance](affinity-distance.md) | 已有有限规则正文 | tutorial-source-projection，无opcode bytes |
| [#53](https://github.com/DanielMax937/sanguozhi/pull/53) | 探索人才基准纯函数 | [search-talent-baseline](search-talent-baseline.md) | 已有有限规则正文 | SLR |
| [#54](https://github.com/DanielMax937/sanguozhi/pull/54) | 宝物roll参数纯函数 | [treasure-roll-argument](treasure-roll-argument.md) | 已有有限规则正文 | SLR |
| [#55](https://github.com/DanielMax937/sanguozhi/pull/55) | 搜金caller纯投影 | [search-gold-caller](search-gold-caller.md) | 已有有限规则正文 | SLR |
| [#56](https://github.com/DanielMax937/sanguozhi/pull/56) | 生产时间caller纯投影 | [production-time](production-time.md) | 已有有限规则正文 | SLR，非实际生产日数 |
| [#57](https://github.com/DanielMax937/sanguozhi/pull/57) | 征兵数量caller纯投影 | [recruitment-quantity](recruitment-quantity.md) | 已有有限规则正文 | SLR |
| [#58](https://github.com/DanielMax937/sanguozhi/pull/58) | 征兵治安请求纯函数 | [recruitment-security-argument](recruitment-security-argument.md) | 已有有限规则正文 | SLR |
| [#59](https://github.com/DanielMax937/sanguozhi/pull/59) | 俘虏逃亡参数纯函数+命名纠正 | [captive-escape-roll-argument](captive-escape-roll-argument.md) | 已有有限规则正文 | SLR |
| [#60](https://github.com/DanielMax937/sanguozhi/pull/60) | 城市金钱收入纯投影 | [city-money-income-projection](city-money-income-projection.md) | 已有有限规则正文 | SLR，stock/原表未证 |
| [#61](https://github.com/DanielMax937/sanguozhi/pull/61) | 城市粮食收入纯投影 | [city-food-income-projection](city-food-income-projection.md) | 已有有限规则正文 | SLR |
| [#62](https://github.com/DanielMax937/sanguozhi/pull/62) | 据点收入返回尾段 | [base-income-return-tail](base-income-return-tail.md) | 已有有限规则正文 | SLR |
| [#63](https://github.com/DanielMax937/sanguozhi/pull/63) | 月粮harvest→levy参数 | [monthly-city-food-base-argument](monthly-city-food-base-argument.md) | 已有有限规则正文 | PK来源，PC-PK1.1只是目标 |
| [#64](https://github.com/DanielMax937/sanguozhi/pull/64) | E14参考模型/检查器纠正 | [29-duel-continuous-formulas](29-duel-continuous-formulas.md) | 已有有限规则正文 | translated-source-reference，非生产engine/native |
| [#65](https://github.com/DanielMax937/sanguozhi/pull/65) | 月特产生产请求纯函数 | [monthly-specialty-production](monthly-specialty-production.md) | 已有有限规则正文 | source-listing-control-flow-with-provisional-arithmetic |
| [#66](https://github.com/DanielMax937/sanguozhi/pull/66) | 独立供应地图移动reducer | [supplied-map-movement](supplied-map-movement.md) | 已有有限规则正文 | mnemonic listing+guide表+显式policy |
| [#67](https://github.com/DanielMax937/sanguozhi/pull/67) | 独立普通登用决策 | [ordinary-recruitment-policy](ordinary-recruitment-policy.md) | 已有有限规则正文 | empirical-high gate+provisional rate/hash |
| [#68](https://github.com/DanielMax937/sanguozhi/pull/68) | 独立地形/状态/空格火生命周期 | [terrain-hazard-lifecycle](terrain-hazard-lifecycle.md) | 已有有限规则正文 | reverse-source reference+empirical+工程policy |
| [#69](https://github.com/DanielMax937/sanguozhi/pull/69) | 独立耗粮/手动补给资源会话 | [food-supply-lifecycle](food-supply-lifecycle.md)；[20-food-consumption](20-food-consumption.md)；[21-supply-transport](21-supply-transport.md)；[47-food-overlap-starvation-exactness](47-food-overlap-starvation-exactness.md) | 本次补充有限规则正文 | 源位型/部分逆向+显式兼容policy |
| [#70](https://github.com/DanielMax937/sanguozhi/pull/70) | 独立面板/编成预览 | [unit-formation-policy](unit-formation-policy.md)；[18-unit-panels](18-unit-panels.md)；[45-deputy-rounding-exactness](45-deputy-rounding-exactness.md)；[68-deputy-blood-third-pc-opcode-boundary](68-deputy-blood-third-pc-opcode-boundary.md) | 本次补充有限规则正文 | documented/PS2 empirical-cross-platform+工程policy |
| [#71](https://github.com/DanielMax937/sanguozhi/pull/71) | 独立城市命令生命周期 | [city-command-lifecycle](city-command-lifecycle.md) | 已有有限规则正文 | listing引用+service policy；当前只有静态审阅 |

## 查阅顺序

先读对应专题的适用版本、公式/条件与边界，再读来源清单。静态事件逐来源分别保留，不把不同攻略强行合为一个真值；能力树同名候选仍是不同槽位，不把多个前置改成OR。原生参考模型专题的旧scope仍有效。新独立服务的工程政策明确命名，不冒充stock机制。
