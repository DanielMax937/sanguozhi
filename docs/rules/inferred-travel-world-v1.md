# 中性城际旅行场景：从路线请求到实际状态 v1

日期：2026-10-28。基线 `de58d31616c39872afb323062b6fc41cfac04704`。
实现：[inferred-travel-world.ts](../../packages/engine/src/inferred-travel-world.ts)。
关联 T37/T40/T45。本文是独立新设计规则，不是原地图、原剧本或原武将旅行的恢复证明。

## 这一批真正落地的边界

此前 `projectInferredOfficerTravel` 仅给路线和天数。本批消费其路线，在**新建的旅行专用世界状态**内实际维护合成旅行实体的位置、在途路线、已完成边数、当前日期、回合、修订号、命令和回执。创建、启程、推进一旬、到达、保存和重建均有代码入口，不再只有请求。

这不是已有 `GameState` 的全局插件，也不连接人员表或原生任务链。新实体 ID 必须以 `traveler-` 开头，只在该场景内有意义；无武将引用、姓名映射、势力、军团、归属、俘虏、资源和奖励字段。旧城际蓝图、单城指令场景和原服务的默认行为全部不变。

## 资料 / 推断逐项分离

| 项目 | 采用值与依据 | 等级与替换条件 |
|---|---|---|
| 城市及战略邻接 | 复用已录 [cities.json](../sources/cities.json) 的 42 城名称与 neighbors；原记录来源为 [瑜云城市攻略](https://vincecarter0315.pixnet.net/blog/posts/14215527290)、[日文 wiki 城市页](https://w.atwiki.jp/sangokushi11/pages/77.html) | 本轮直接读取的是仓库来源转录，没有声称新读外站或原数据 dump。保留有向邻接，不自行增补反向边。 |
| 路径 | 原有 planner 的 BFS 最少边，邻城名称默认字符串排序；同长首次找到者 | 工程推断；不是道路、六角距离或原 helper。获得原路径规则时新增 policy，不改旧存档含义。 |
| 耗时 | 每边恰一旬；启程不推进时间，随后每次 Advance 走一条边 | 10 日/边沿既有具名推断。距离、天气、人物能力均不参与，没有伪称原速率。 |
| 历法 | 1/11/21 日三旬，12 月后换年 | 三旬规则沿 [时间资料](00-turn-scenario.md)；这里专用时钟不调原世界月/季函数。年 1..9999，跨越上限整笔拒绝。 |
| 初始剧本 | 调用者指定年份与 1..32 个合成实体的初始城市，统一 1月1日、turn0、revision0 | 明确人工中性场景，不生成历史人物、政治版图、金粮兵、RNG 或事件标志。不是任何原作剧本。 |
| 途中位置 | 每旬将实体 city 写为该次到达的图节点；未走完时保留 journey | 纯战略图状态，不宣称实体此时位于原地图城心，不允许在途重派/取消；最终边后 journey=null。 |
| 去重与保存 | 命令 ID + 完整信封一致重试；genesis + 全历史确定性重建校验 | 软件合同；不是原存档格式或 native writer。 |

原作 200×200 地图仍需 terrain/areaCode/flags；这里不生成假六角格、不猜坐标、不填 null、不改 cities 原资料。见 [地图证据边界](01-map.md)。原作完整开局及选项 loader 同样未恢复。

## API 与有限合同

- `createInferredTravelWorld(input)`：输入严格形状 `{version:1,startYear,travelers:[{id,city}]}`；实体唯一 ID 为 ASCII 字母数字起始、最多96字符并以 `traveler-` 起头；city 必须匹配源目录。实体稳定 ID 排序。成功返回 `{ok:true,state}`。
- `executeInferredTravelWorld(state,envelope)`：信封仅 `{commandId,expectedRevision,action}`。`commandId` 同样有限 ASCII ID，修订从0开始；新命令必须等于当前修订。成功返回新的冻结状态及回执，输入从不修改。
- `StartTravel` action：`{kind:'StartTravel',travelerId,destination}`。未知实体、正在旅行、当前即目的地、无法到达都拒绝；成功写 journey，而不移动位置、不扣费、不推进旬。
- `AdvanceTravelTurn` action：仅 `{kind:'AdvanceTravelTurn'}`。所有在途实体同时前进一边，按实体 ID 顺序写回执；最终边标 `arrived:true` 并清空 journey。无在途实体也能推进日期；只操作本服务时钟。
- 已接受命令 ID 若完整信封（包括旧 expectedRevision）一致，返回原回执和当前状态，`duplicate:true`，不再推进；相同 ID 但任意内容改变返回 `command-id-conflict`。去重在旧修订检查之前。
- 每场景最多1024个已接受命令。到上限后新命令拒绝，但旧命令幂等读取仍可进行。每个成功的新命令修订加1，只有 Advance 使 turn 加1。
- `saveInferredTravelWorld(state)`：先重建比对再输出 JSON；`loadInferredTravelWorld(serialized)`：最多16,000,000字符，重放全部唯一命令后对比日期、位置、路线、回执、修订、turn等完整状态。伪造快照/回执、跳号、重复历史、额外字段均拒绝。没有自动迁移旧服务保存。
- 普通输入拒绝 getter、循环、稀疏数组、symbol、非JSON值、负零、异种原型、超过32层嵌套；对象数据先脱离再读取。返回深冻结，失败不暴露半完成状态。代理对象不是安全沙箱支持域，不应传入可执行代理。

## 未运行纸面流程

[场景与操作样例](../../data/scenarios/inferred-travel-world-example-v1.json)以合成 traveler-demo 从襄平到北平：

1. create：第200年1月1日，turn0/revision0，襄平，journey=null。
2. start command `depart-1`、expectedRevision0：路线襄平→北平，位置仍襄平，turn0/revision1。
3. advance command `tick-1`、expectedRevision1：第200年1月11日，turn1/revision2，位置北平，journey=null；到达回执 true。
4. 重试同一 `tick-1` 信封：仍第1旬，duplicate=true；不同内容复用该ID则拒绝。

以上为按代码逐句推导的预期，未运行的样例不是验收证据。BFS图中多边路线每旬仅走一边；途中再次 Start 拒绝、同一目标到达后再次 Start 拒绝。保存保持源路线由固定版本代码重建；将来修改城市图应发布新 policy/加载器，不能悄改本版本解释。

## 明确不包含

P078及其依赖、原武将任务/移动/登用/归属、Closing奖励/受伤/世界写入全部不接。此服务自己的合成位置写入不代表这些禁区解锁。无兵力、死亡、伤病、金粮、AP、TP、功绩、忠诚、俘虏、战斗、洪水、原事件触发；无双建设或其他模式。

不称整个游戏可玩、不称原地图或历史剧本完成、不称原43/当前45证据债清零。未运行测试、typecheck、编译、build、候选或产品；仅静态实现，发布后须独立静态审阅与候选/远端一致性核对，运行正确性未验证。
