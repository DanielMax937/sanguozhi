# 工程API入口

接口与实际游戏规则分开定位；各模块的版本、支持域和证据等级以各自正文为准。最新工程/证据状态见[STATUS](../rules/STATUS.md)，完整游戏规则见[规则索引](../rules/README.md)。

| 模块 | API合同 | 具体规则 |
|---|---|---|
| 合成训练运行 | [训练切片](pk-training-slice.md)、[训练生命周期](pk-training-lifecycle.md) | [训练与旬推进政策](../rules/training-runtime-policy.md) |
| 独立耗粮/手动补给 | [账户与事务](food-supply-lifecycle.md) | [耗粮与手动补给](../rules/food-supply-lifecycle.md) |
| 编成与面板 | [编成接口](unit-formation.md) | [编成政策](../rules/unit-formation-policy.md) |
| 独立城市命令 | [场景、收据及保存接口](../rules/city-command-lifecycle.md) | 同页巡查/征兵/生产公式、费用与预约 |
| 独立技巧研究 | [研究接口](technique-research-lifecycle.md) | [36项、费用、时长、奖励和完成规则](../rules/technique-research-lifecycle.md) |

技巧研究采用明确provisional政策，未修改训练GameState或共享任何其他服务的账户/预约。本次新增代码和规则只做静态工作，没有运行测试、编译、构建或诊断；历史验收不覆盖本次最终树。
