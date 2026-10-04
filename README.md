# 三国志11规则研究与训练内核

主目标是逐步复现 PC-PK1.1，再单独恢复 Vanilla；已证实规则、实测规则、工程替代和未决边界必须可区分。

当前可运行的是**虚构的短训练沙盒**，不是完整游戏：一条玩法命令 `Train`，加有限 `EndTurn`、状态检查、JSON存档、确定性重放。没有AI、经济、战斗、历史剧本或能力成长转换。Vanilla在此切片中明确不支持。

## 运行

需要 Node.js 24.x 与 npm：

```sh
npm ci --ignore-scripts
npm run check
npm run demo
npm run play
```

`demo` 自动走完三次训练、两次旬切换并验证存档重放；`play` 提供交互式纯文本命令。存档默认使用 `training-save.json`，为避免误覆盖，文件已存在时保存会报错。

- [训练切片指南、证据边界与测试](docs/engine/pk-training-slice.md)
- [规则总索引](docs/rules/README.md)
- [当前研究状态](docs/rules/STATUS.md)
- [后续任务](TODO.md)

已接受命令保存完整前后状态、计算中间量与来源证据。原训练命令的发言武将随机选择属于表现层，本内核明确省略；“核心零随机调用”不代表原游戏整条命令或全局随机流等价。
