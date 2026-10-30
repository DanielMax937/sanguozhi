# T18：合成征兵练习实际事务入口

`runInferredRecruitmentExercise(cityName,startYear,commandId)` 复用已经存在的城市命令服务，不再另建冲突征兵账本。**旧45项历史“完整执行连接未实现”不能继续被当作当前工程状态**：截至固定main `fb34caa440aa823677627328d7d33e7c8fd60d62`，`city-command-lifecycle.ts` 已有完整独立 `Recruit`，`internal/city-instant-reducer.ts` 写兵库存、治安、气力、普通经验功绩并统一扣资源，`internal/city-domestic-leaves.ts::recruitQuantity` 确实调用 `calculateRecruitmentQuantityProjection`。历史原文保留，当前补记此实际接口事实。

## 实际调用链

1. 使用现有 `createInferredCityCommandScenario` 的明确中性blueprint：由城市资料取兵力容量，金5000、AP200、兵10000、治安80、气力80、一位能力70合成执行者、一级已完成兵舍和锻冶。具体不具历史真实性；旧fixture/catalog/policy仍保留。
2. 本入口把force/city/corps/officer/facility身份全部重命名为synthetic-recruit-*，没有任何真实人物映射。调用旧 `createCityCommandState` 完整验证初始化。
3. 构造唯一明示commandId（`synthetic-[a-z0-9-]{1,48}`）、revision0、当前合成城/兵舍/执行者的 `Recruit` envelope，实际调用 `executeCityCommand`。不是返回“建议请求”而不消费。
4. 成功返回旧初态、完整envelope、新state及原receipt；后续直接沿 `executeCityCommand` / `saveCityCommandState` / `loadCityCommandState` / `replayCityCommands`，不发明另一保存schema或跨服务同步。

## 已有事务与证据分层

数量投影资料见 [recruitment-quantity](recruitment-quantity.md)，旧服务合成caller自己构造有限捕获、设施倍率policy、稳定容量观察；这些不是原生对象、stock helper或ABI证实。数量核返回并非天然等于原world writer；本例沿旧显式writer policy才转成合成兵库存增量。

[征兵资料](04-military.md#1-征兵)记录300金、20AP、最多3执行者、每人魅力经验2/功绩50、兵舍一次使用。旧服务承担上述费用/普通奖励和acted/used标记；本入口只选择一名，**不再次扣AP/金，不再次加功绩**。治安参数使用旧限定叶，气力混合/库存裁剪采用旧具名service policy，不升级原生证据。

旧reducer在detached候选上计算所有写入，再检查费用与零产量policy；任何失败不会提交新state。旧公共服务的严格输入、同命令ID/摘要去重、revision与保存完整重放继续有效。此入口没有绕过资源或容量门，不会直接向当前用户战役塞兵。

## 新练习与既有状态不可混淆

每次调用本函数都创建一个**新的独立练习**，不是向上一次state续单。重复调用相同参数可得到同一初始演练，不是跨世界交易ID幂等。真正继续同一个练习必须保存返回state并调用旧executeCityCommand；原服务会处理同ID重复/不同内容、同旬执行者已行动、兵舍已使用和跨旬恢复。使用者不能把多个新练习的兵数手动累计称为原世界结算。

没有消费/转移真实武将，没有真实势力归属/伤亡/Closing/P078，没有全局时钟、粮食、人口、战役库存融合；普通合成魅力经验/功绩只是已有非Closing命令事务。历史场景和原writer/helper仍未恢复，不能因为此演练可加载就说全部原生征兵等价。

## 静态验收

实读旧数量叶、instant reducer、service入口及blueprint；核所有synthetic引用重命名、旧费用只扣一次、receipt/state类型与保存入口。未执行候选、测试、typecheck、build或原游戏；静态通过不代表运行验收通过。
