# PK 五维培育：S1 限定资格与完成数值核

基线：PR #44 合并后的 `181a37d26044ff1d6ff994c777d82355b6c1b946`。本批新增独立纯函数，未增加游戏命令、原生记录映射或调度器。P0-78 及其依赖完全排除。

## 已实现的窄边界

`packages/engine/src/pk-stat-training.ts` 通过 engine 公共入口导出：

- `qualifyPkStatTraining(input)`：只回答五维分支的数值启动条件，即累计 XP < 2000 且当前成长能力 < 目标；XP 先判断，失败理由为 `xp-start-limit` 或 `growth-target-reached`
- `completePkStatTraining(input)`：只计算已开始任务的完成数值，requestedPoints = min(5, target − currentGrowth)，requestedXp = requestedPoints × 100，xpAfter = min(3000, xpBefore + requestedXp)
- `PK_STAT_TRAINING_S1`：冻结的来源、证据地址、常数与支持域，等级为 `compatibility-reconstruction`

完成函数不调用启动资格函数。XP 已到 2000、甚至到 3000 的已开始任务仍能计算完成，等于目标时增量为零。完成时 currentGrowth > target 会返回 `unsupported-negative-delta`；原生 caller 只有上限 5，没有 max(0, delta)，本批明确排除其负差/raw-word 行为，不能静默归零。

结果包含数值资格或支持域拒因、属性名称、XP/成长前值、目标、requested/credited/clipped XP、完成后 XP 与证据地址。`requestedPoints` 不代表实际可见属性增长。所有函数不修改输入、游戏状态、原始天赋、存档或 RNG。

## 输入域与 getter 边界

每次调用必须明确 `profile: 's1-pk-stat-training-v1'`，`attribute` 为 leadership/war/intelligence/politics/charisma；它是调用者选定的语义标签，不是原生98条培育表的映射。XP 取整数0..3000，target 取整数1..100。未知字段、错类型、非有限数、分数、越界和其他版本均显式拒绝。这些是工程支持域，不冒称完整原生 gate。

`growth` 必须二选一：

1. `{kind: 'resolved-native-growth', value}`：调用者已经解析当前 `0048A390` 返回值1..100。完成只输出 XP；`growthAfter` 和 `actualGrowth` 为 null，须重新解析 getter 才能知道后值。不会从一个 getter 数值推断年龄或特殊人物行为
2. `{kind: 'ordinary-no-age', talent}`：调用者明确断言普通人物、无年龄修正，不适用于原生 ID700..799。talent 限定整数0..100，派生成长为 max(1,min(100,talent+floor(XP/100)))。本 API 不接受或自行校验人物 ID，也不实现年龄表、完整属性管线

普通域示例：

```js
const input = {
  profile: 's1-pk-stat-training-v1', attribute: 'war', xp: 1900, target: 80,
  growth: {kind: 'ordinary-no-age', talent: 51},
};
qualifyPkStatTraining(input);  // growthBefore70, eligible=true
completePkStatTraining(input); // requestedXp500, creditedXp500, xpAfter2400, growthAfter75
qualifyPkStatTraining({...input, xp: 2400}); // eligible=false, reason='xp-start-limit'
```

这保留普通经验与培育共用累计 XP 的语义，没有发明另一份“研究+20”额度。talent0/XP0 的 getter 下限为1，完成加500XP后为5，实际可见增长为4；不能把 getter 前值当作原始天赋再加经验。

## 真实指令来源

S1 为 [sjn4048/311MemoryResearch 固定提交66e167e](https://github.com/sjn4048/311MemoryResearch/tree/66e167e40c3440929ec016f3872aefc3486434c1) 的已收录 IDB 字节。IDB 输入元数据关联血色5.0 MOD；来源身份与五个完整函数字节保留于 [82来源报告](82-training-lifecycle-source-profile.md) 和 [原manifest](../sources/training-lifecycle-source-profile.json)，本批没有重新取得或运行 EXE/IDB。

- `0049DCAE..DCB4`：无符号 word XP 与2000比较，只有低于才继续；`0049DCBF..DCD3` 调用成长 getter，按 current < target 返回
- `005D9283..9297`：读取当前 getter、target减current，只有上限5；`005D929E..92B7` 读取累计 XP、乘100相加、顶3000；`005D92C5` 调用 wrapper
- `004A55CF` 真正调用 `0048A810`；`0048A838..84B` 保留 word XP 顶3000及共享存储地址 `person+0x12A+2*attrID`
- `0048A3BB..3C9` 对700..799跳过年龄与 XP 加成；`0048A3D9` 调用年龄系数；普通分支 `0048A405..44F` 加 floor(XP/100) 并钳到1..100

完整五函数字节长度分别为199、642、90、67、191；checker 固定各自SHA256并重建连续地址的反汇编字节，不仅检查自然语言注释。15条真实 opcode 序列单独约束比较、分支、乘100、累计加法、上限和 caller→wrapper→writer。S2 的不同常数未混入本 profile。

## 验证入口

```sh
python -B scripts/check_pk_stat_training_source.py
node --test packages/engine/test/pk-stat-training.test.mjs
npm run check
npm run demo
npm run demo:lifecycle
```

专项11个 Node 测试包含硬编码独立边界 oracle、五维75025个 XP/差值向量、普通域1212个天赋/XP组合、13个真实生产函数行为突变（每次先跑未改控制），并验证拒绝输入、输入不变和旧存档/replay合同。源码checker含24个来源/profile突变及各自未改控制。以上是本地数值/源码和合成沙盒验证，不是运行原作或认证 clean-stock。最终全树回归与独审结果由本批验收记录单独提供，历史P0报告数字不改写为新结果。

## 保留缺口

仍缺完整研究/培育资格、命令执行、AP/金/时长、使用次数、mission清理、展示、完整 scheduler、原生98条记录与攻略ID对应、隐藏抽取算法/权重/RNG、完整年龄/特殊人物属性 getter、负差 raw-word 行为、clean-stock PC-PK1.1、S2/Vanilla/主机等价及原作存档/运行时验证。

Train/EndTurn、saveVersion2/engineVersion training-kernel-v2、48基础节点/52基础箭头/4起点/50隐藏候选，以及史实、通用、PS2三套资料与既有证据字节不变。只关闭“限定S1五维数值核未实现”，不关闭整个能力研究系统。
