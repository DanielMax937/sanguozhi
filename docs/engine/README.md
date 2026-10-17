## 当前新增：O10-B独立单城商人

[create/preview/execute/save/load/replay API](city-merchant-lifecycle.md) · [完整买卖规则、12政治锚点及公式](../rules/city-merchant-lifecycle.md) · [source/policy](../sources/city-merchant-lifecycle.json)。BuyFood/SellFood/单旬推进、整笔资源/AP/XP写入和完整重建；独立于O04/O10-A，原43不减，不代表全财政或native认证。代码与场景仅静态新增，未运行测试、编译或产品。

## 当前新增：O10-A有限单城财政

[create/preview/execute/save/load/replay API](city-finance-lifecycle.md) · [完整游戏规则、80薪表与设施公式](../rules/city-finance-lifecycle.md) · [source/policy](../sources/city-finance-lifecycle.json)。独立固定owner/完整驻城名单、无俘虏、最多360旬；月薪不足整旬回滚。写入本服务金粮/治安/兵装，不修改O04/schema；全genesis/receipt/snapshot重算。静态新增未运行任何测试、编译或产品；仅O10-A子域，原生财政与原43证据缺口不关闭。

以下为既有模块导航，各自历史验收仅对原版本有效。

## 普通话题牌独立舌战

[O09b API](topic-debate-session-v1.md)与[完整规则](../rules/debate-topic-session-v1.md)：ordered tape/token、3/4/5/6普通容量、原子round、HP先于anger/refill、严格genesis保存重放。现代转录普通子集，五话术/愤激/再考/人物/结束结算保留；静态新增，未运行测试/typecheck/编译/build/checker/产品或诊断。

# 工程API入口

接口与实际游戏规则分开定位；各模块的版本、支持域和证据等级以各自正文为准。最新工程/证据状态见[STATUS](../rules/STATUS.md)，完整游戏规则见[规则索引](../rules/README.md)。

| 模块 | API合同 | 具体规则 |
|---|---|---|
| 合成训练运行 | [训练切片](pk-training-slice.md)、[训练生命周期](pk-training-lifecycle.md) | [训练与旬推进政策](../rules/training-runtime-policy.md) |
| 独立耗粮/手动补给 | [账户与事务](food-supply-lifecycle.md) | [耗粮与手动补给](../rules/food-supply-lifecycle.md) |
| 编成与面板 | [编成接口](unit-formation.md) | [编成政策](../rules/unit-formation-policy.md) |
| 独立城市命令 | [场景、收据及保存接口](../rules/city-command-lifecycle.md) | 同页巡查/征兵/生产公式、费用与预约 |
| 独立技巧研究 | [研究接口](technique-research-lifecycle.md) | [36项、费用、时长、奖励和完成规则](../rules/technique-research-lifecycle.md) |
| 独立PK能力研究与培育 | [两阶段接口、收据及持久化](pk-ability-lifecycle.md) | [完整目录、资格、费用、次数、效果与并行完成](../rules/pk-ability-lifecycle.md) |

技巧研究采用明确provisional政策，未修改训练GameState或共享任何其他服务的账户/预约。本次新增代码和规则只做静态工作，没有运行测试、编译、构建或诊断；历史验收不覆盖本次最终树。

- [独立官职分配服务](office-assignment-service.md)：80有名职selector→plan→apply，明确fill/rebuild、资格与排序政策，单关系状态与请求重放；不接native角色/归属事务

- [普通外交独立服务](ordinary-diplomacy-service.md)：固定PK经验profile、Gift/Alliance/Ceasefire/单旬、金/AP/关系/期限、全量policy与genesis重放；[完整规则](../rules/ordinary-diplomacy-service.md)。危险失败不提交，不应用奖励，未运行或测试

- [三方针普通单挑独立session](ordinary-duel-session-v1.md)：create/inspect/preview/execute/save/load/replay，原始draw、双计数和HP/斗志收据；[全部具体规则](../rules/duel-ordinary-session-v1.md)。仅普通子集，现代转录参考，静态新增未运行
