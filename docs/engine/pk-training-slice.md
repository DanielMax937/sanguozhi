# PC-PK1.1训练内核与纯文本沙盒

当前运行profile：`pk-training-lifecycle-v2`（2026-10-04）。[生命周期、资格、成长、迁移与验证完整指南](pk-training-lifecycle.md)。

v1最初基于main `5c5611bb067c0dfe13cea1126ad69a12dade697c`，随后PR #3/#4合入main。v2从新main `56f1aa4ad9cf2bff5612b1777e16dc54be0cdefb`建立新主题分支。历史v1设计见[合并时的指南](https://github.com/DanielMax937/sanguozhi/blob/56f1aa4ad9cf2bff5612b1777e16dc54be0cdefb/docs/engine/pk-training-slice.md)，其“XP到100拒绝”限制已被v2替代。

## 运行

```sh
npm ci --ignore-scripts
npm run check
npm run demo
npm run demo:lifecycle
npm run play
npm run play -- --growth-fixture
```

需要Node24.x；已实际验证Node24.19.0/npm11.9.0与锁定的TypeScript7.0.2。`demo`运行三次训练短目标，`demo:lifecycle`验证360旬。纯文本命令：`preview`、`train`、`end`、`inspect`、`trace`、`save`、`load`、`replay`、`quit`。保存排他创建，不覆盖同名文件；载入先完整重放，失败不替换会话。

## 目录与证据

- `packages/engine/src/`：无I/O的TypeScript内核
- `packages/engine/test/`：原训练数值及生命周期回归
- `apps/text/`：I/O适配与短/长演示
- `docs/sources/pk-training-runtime.json`：原固定main的常量来源及新v2配置，两个来源基线分开保存
- [来源审计](../rules/82-training-lifecycle-source-profile.md)：source-bound gate、reset、累计经验；stock等价继续open
- `scripts/check_pk_training_runtime.py`：既有Python训练参考函数/技巧常量交叉检查

继承的训练公式不变：

```text
denominator=min(100,20+floor(troops/2000))
baseGain=floor((sum(WAR)+max(WAR))/denominator)+3
completed city drill: floor(baseGain*3/2)
actualGain=min(boostedGain,cap-currentMorale)
AP20，完成军事府时10；金不变
每位执行武将WAR XP+2、功绩+50（cap60000）
TP=floor(actualGain/2)+5（库存cap10000）
气力cap100；已拥有熟练兵ID16时120
```

训练先使用当前WAR计算，再奖励经验并重算下一次命令会读到的WAR。能力/XP封顶是两个不同边界。

## Engineering RNG contract / Presentation RNG boundary

`xorshift32-engine-v1`是可序列化工程PRNG，seed/draws存入状态，可经`RandomSource`替换。训练、AP、日历与当前成长核心不调用随机；preview也不调用。

公开执行文本的`005C4442 -> 00472150(3)`会选择发言武将，空槽可能重试。此表现分支被明确省略为`omit-training-presentation-v1`，每条Train证据记录该省略。核心0 draws不代表原命令或共享全局RNG等价。

## Bounded state and serialization contract

仅单势力/第一军团、合成据点、可验证的普通人员素质/累计经验域。没有AI、经济、战斗、派遣/任务结算、历史剧本、特殊人员ID、年龄/健康/装备合成。Vanilla/PS2/Wii不静默继承PK，未知patch/fix profile拒绝。月份和季节只产生边界标志。

默认满气力不再训练，但`EndTurn`能继续推进；资格、成长配置和有限phase plan都有可替换接口和trace。v2保存全状态和证据，提供显式v1状态快照迁移，绝不静默重写老trace。

所有测试都是来源/参考模型/内核回归，不是运行原版EXE认证。source样本的MOD路径与第二IDB冲突在本组审计中保留。
