# 三国志11规则研究与训练内核

主目标逐步复现PC-PK1.1，再单独恢复Vanilla；已证实规则、实测、工程替代和原作证据债分开记录。

当前可运行的是**虚构训练沙盒**：Train、限定EndTurn、训练资格、累计武力经验成长、状态检查、JSON存档与确定性重放。能连续推进时间，但没有AI、经济、战争、历史剧本或完整调度系统。Vanilla明确不支持。

## 运行

需要Node.js24.x与npm：

```sh
npm ci --ignore-scripts
npm run check
npm run demo
npm run demo:lifecycle
npm run play
npm run play -- --growth-fixture
```

`demo`完成气力40→100；`demo:lifecycle`从经验98推进十年（360旬）并验证完整存档重放；`--growth-fixture`在交互沙盒演示能力成长。满气力后训练仍拒绝，时间可以继续推进；没有额外添加刷经验规则。

累计XP每100贡献+1，最多3000，普通武力封顶100。默认source-profile算术可替换且带证据，尚未认证clean stock PK等价。保存默认`training-save.json`，不覆盖同名文件；v1需显式状态快照迁移，不静默改写旧trace。

- [训练切片入口](docs/engine/pk-training-slice.md)
- [生命周期、配置、证据与迁移](docs/engine/pk-training-lifecycle.md)
- [capture旧俘虏释放/迁移/排序来源审计](docs/rules/85-capture-relocation-source-profile.md)：有界前置释放与非瞬移人员投影，回调/资源/在野路径显式未完成
- [capture城兵容量/人员分组/处分来源审计](docs/rules/84-capture-personnel-source-profile.md)：独立有界人员投影，未覆盖完整迁移与AI处分
- [capture caller/完整候选/有界事务来源审计](docs/rules/83-capture-transaction-source-profile.md)：独立Python参考模型与重放，未接入沙盒战斗
- [训练gate/reset/累计经验来源审计](docs/rules/82-training-lifecycle-source-profile.md)
- [规则总索引](docs/rules/README.md) · [当前研究状态](docs/rules/STATUS.md) · [待办与证据债](TODO.md)

每个接受命令保留完整前后状态、算术、实际奖励/裁剪和来源证据。原发言武将随机选择仍被省略，核心零随机调用不等于原游戏全局随机流一致。
