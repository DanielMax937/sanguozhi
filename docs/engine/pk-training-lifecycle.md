# PK训练生命周期 v2

更新：2026-10-04 UTC。基线：main `56f1aa4ad9cf2bff5612b1777e16dc54be0cdefb`。

本组扩展训练资格、行动重置、旬推进和武力成长，仍是单势力/第一军团的合成训练内核，不是完整游戏。原作证据缺口与可运行实现分开记账。

## 1. Growth and cumulative experience

`warBase`是此合成profile中未加年龄、宝物、官职、伤病等修正的素质；`warXp`是累计经验，不能作为0～99的余数存储。

默认配置：

```ts
newXp = min(3000, oldXp + 2)
newWar = max(1, min(100, warBase + floor(newXp / 100)))
```

经验到100、200等阈值不扣除100。能力已经100也继续累计XP，直到3000；XP已满时训练仍可因气力未满合法执行，XP实际增量0，功绩和行动标记仍按各自规则处理。`+30`来自3000/100的上限，而不是另一条可重复叠加的培养余额。PK研究在审计样本中也写同一累计XP，当前内核尚未实现研究命令。

这段算术与公开文本/静态IDB样本对齐，但IDB关联MOD路径。运行时标记 `compatibility-reconstruction`，不能把它等同于clean stock PK1.1已验证。来源逐字证据与第二MOD样本的常量冲突见[本组来源审计](../rules/82-training-lifecycle-source-profile.md)。默认不采用第二样本中的cap0/120改写。

`calculation.progression[]`同时给出requested/credited XP、累计前后、整点贡献、算术余数、显示进度、武力前后、实际能力增量和到顶状态。3000的算术余数为0，但源样本情报UI显示满100；inspect显示`FULL`，不把两者混为一谈。

当前仅实现训练会奖励的WAR；五维研究、年龄变化、遗迹改素质、伤病/装备合成、原数值ID700～799的特殊getter路径都不在此状态域。不能把任意原作存档直接灌入此profile。

## 2. Eligibility and action reset

默认仍是保守gate，满气力拒绝；**没有为了长期演示而增加满气力刷XP，或每旬无依据扣气力**。新source样本的`005C4100`也支持满气力拒绝，stock等价性另行保留。

每次训练要求：

- 据点属于当前势力/军团，兵力>0，本旬未训练，气力未满
- 1～3名不重复的己方执行武将，station与目标据点一致
- `identity`为0～3、`location='base'`、`onMission=false`、`acted=false`
- AP足够；命令、状态与profile均有效

identity、location、mission是独立维度。用5表示俘虏；在外/部队只是location，任务只用独立布尔状态，不凭空创造“出征身份”。这些状态是资格/重置回归用的合成快照，不表示已经实现派遣、回城、释放、任务完成或部队系统。

资格gate仍可替换，但不得绕过所有权、同地、行动、身份/任务、AP或每旬一次的状态安全检查。调用只给深冻结的状态、据点和执行者列表；返回错误形状、抛错或直接修改输入会原子拒绝。

AP人数过滤的`active identity + physically at base`是明示的限定适配：在城任务者仍计人数，在外/部队/俘虏不计；君主/军师角色能力引用与人数不同，在外仍可提供角色参数。原作完整人数selector不在本实现中冒充已恢复。

## 3. Turn phase plan

`EndTurn`先在当前快照计算计划，随后按保存的阶段顺序应用：

1. `advance-date`：1→11→21→次月1，36旬/年
2. `recover-ap`：沿用既有C9第一军团公式，AP库存上限255
3. `reset-base-training`：清当前受控据点的已训练标记
4. `reset-officer-actions`：清当前状态域武将的acted

trace写入阶段顺序和实际从true变false的据点/武将ID。港关同样重置；外国据点不被本单势力适配器重置。武将任务、位置、身份不改变，所以在途/任务/俘虏不会因为清acted而获得训练资格。

新的source审计恢复的是遍历87建筑、1100武将的全局reset链；本切片有意只适配自己的状态域，不能把“当前军团的EndTurn”等同于完整原调度器。原链后续任务处理还可能重新置acted，因此忙碌状态不能只靠acted建模。月/季/年边界是标志，不执行经济、AI、事件、衰老或任务到达。

`EngineAdapters.turn`保存ID、证据和四个阶段的排列；缺阶段、重复或未知阶段都会拒绝。各阶段当前作用于互不依赖字段，排列替换用于未来接入真实调度证据，不暗示任意顺序在完整游戏都等价。

## 4. Replaceable configuration and replay

`EngineAdapters.growth`包含证据和`experiencePerPoint/experienceCap/statMin/statMax`配置。默认100/3000/1/100；允许替换的有界配置有专门测试，不把自定义值称原作常量。

规则profile保存gate ID、成长ID及完整有效配置、旬adapter ID及阶段顺序。即使调用方复用了同一个ID，配置变化也会使旧状态/存档拒绝；自定义成长配置的trace自动标`provisional-engine-rule`。通过`rulesetForAdapters(adapters)`显式构造匹配profile。

状态校验检查`war == derivedWar(warBase, warXp, config)`；不允许篡改单个派生能力或越过累计XP上限。preview/execute共用算术，奖励和成长先计算后一次性写回；失败不改变AP、XP、气力、flags、RNG或已接受日志。

## 5. Save v2 and explicit v1 state migration

状态schema、saveVersion与engineVersion分别为2、2、`training-kernel-v2`。默认load拒绝v1，不会把历史trace伪装成用新证据执行过。

`migrateLegacyState(v1State)`仅接受原默认v1 profile和严格形状的状态快照：

- v1从未允许XP跨100，所以把0～99原值复制为累计XP，`warBase=旧war`
- 原切片所有武将都是现驻无任务者；迁移显式补身份/位置/任务字段
- `originProfile='legacy-v1-state'`保存在新状态与新存档
- 返回migration说明，`historicalTracePreserved=false`；用新状态开始新session，历史日志不迁移、不认证
- 自定义v1 profile、XP>=100、额外字段或无效资源拒绝；旧WAR0无法满足默认getter下限1也拒绝，不能默默改变数值

这不是完整v1 save历史校验器。若从旧save提取state，应保留原save供旧版本引擎验证。新存档重放会比较所有状态、算术、profile和证据，但仍不是签名或反作弊系统。

## 6. Running and validation

```sh
npm ci --ignore-scripts
npm run check
npm run demo
npm run demo:lifecycle
npm run play -- --growth-fixture
python scripts/check_pk_training_runtime.py
python scripts/check_training_lifecycle_source_profile.py
```

普通demo维持气力40→100短目标；growth fixture从XP98演示跨阈值。lifecycle demo推进360旬（十年），到满气力后训练被拒绝但继续推进时间，并完整save/load/replay验证。

自动测试覆盖97/98/99/100、199、2899、2998/2999/3000，能力100继续积累经验，+30额度，下一次训练读取新WAR，状态安全、忙碌/在外资格、AP过滤、城市/港关重置、配置替换与篡改、显式迁移、跨月/季/年、十年seed/全trace一致性。核心仍0随机调用；原发言武将RNG省略，所以不主张全局原随机流一致。

完整before/after与证据快照使日志体积随接受命令数增长；当前dispatch还复制历史以避免别名，因此长历史有性能成本。十年回归证明本状态域连续可运行，不表示已经支持完整游戏的百年AI/经济模拟。

同时只修复原`check_techniques.py`三处字面`\\n`语法错误。原merit候选与`unresolved`断言保留，未借此解决技巧研究公式争议。

最终本组验证（2026-10-04）：TypeScript与85个Node测试、全部66个Python检查通过；短demo、十年demo与growth-fixture CLI通过。来源包26个函数/尾块hash及汇编、11个opcode断言、8组S1/S2对照、5个边界向量和24,008条成长不变量通过。独立只读审阅及额外异常状态/资格组合检查无未修阻断。
