# PC-PK1.1 训练切片：确定性内核与纯文本沙盒

更新：2026-10-03。运行 profile：`pk-training-slice-v1`。

## 1. 基线与目标

本实现从 GitHub `main` 的 `5c5611bb067c0dfe13cea1126ad69a12dade697c` 单独建立，未纳入未合并的 PR3 capture-profile 草稿。它不会把 P0-46 标记为关闭，也不声称完整《三国志11》已可游玩。

长线方向：先 PC-PK1.1，再独立恢复 Vanilla；缺失规则用可替换、带来源和证据等级的工程适配器，不能把猜测伪装为原版。此切片只实现：

- `Train`：选择1～3名现驻执行武将，进行据点训练
- `EndTurn`：有限的旬推进、当前第一军团AP恢复、训练/行动标记重置
- inspect、共享计算路径的 preview、序列化存档、命令/证据/全状态重放
- 一个虚构城市和三名虚构武将组成的短目标：气力40→100

没有 Next.js、React、网页UI、第三方运行时框架、AI、经济、野外部队、战斗、外交、历史事件、真实剧本数据或能力成长转换。月份/季节边界只是事件标志，不会执行那些缺失系统。

## 2. 运行与目录

```sh
npm ci --ignore-scripts
npm run check
npm run demo
npm run play
python scripts/check_pk_training_runtime.py
python scripts/check_training_morale.py
```

- `packages/engine/src/`：无I/O的TypeScript内核
- `packages/engine/test/engine.test.mjs`：Node内置测试
- `apps/text/demo.mjs`：固定短场景与存档重放验证
- `apps/text/play.mjs`：终端输入、文件保存/载入；I/O只在此适配层
- `docs/sources/pk-training-runtime.json`：本次新归一化的常量与证据
- `scripts/check_pk_training_runtime.py`：与主分支既有Python参考函数/技巧静态数据交叉校验

环境验证：Node `v24.19.0`、npm `11.9.0`，通过官方 npm registry 查询后固定 TypeScript `7.0.2`；安装使用 `--ignore-scripts`。锁文件提交供 `npm ci` 重现。这里只声明实际测试版本，不声称本机Node是最新补丁版。

文本命令：

```text
preview o1,o2,o3
train o1,o2,o3
end
inspect
trace
save training-save.json
load training-save.json
replay
quit
```

`train`/`preview`可在执行将列表后添加据点ID，默认`city1`。保存使用排他创建，不覆盖现有文件。载入首先完整重放校验，失败不会替换当前会话。

## 3. 证据归一化

主分支19号文档和 `scripts/check_training_morale.py` 已有训练数值规则，但**原先没有本次运行时JSON**。本提交从固定main来源归一化以下常量，而不是把新文件说成既存JSON：

```text
denominator = min(100, 20 + floor(troops / 2000))
baseGain = floor((sum(WAR) + max(WAR)) / denominator) + 3
complete city drill ground: floor(baseGain * 3 / 2)
actualGain = min(boostedGain, max(0, cap - currentMorale))
AP = 20, or 10 with completed city military office
WAR XP = +2 per selected officer
merit = +50 per selected officer, capped at 60000
TP = floor(actualGain / 2) + 5, accumulated TP capped at 10000
gold = unchanged
morale cap = 100, or 120 if technique ID16 already owned
```

WAR输入是已解析的当前/有效武力；能力、宝物、年龄等如何得到这个值不在本切片中。练兵所与军事府必须是城市中的完成设施，未完成设施不加成，港/关不能塞入城市专属设施。熟练兵已拥有与否只决定cap，不自动补现有气力。

数值来源：

- [训练闭式与执行副作用](../rules/19-training-morale.md)
- [资格gate与重置行为](../rules/46-training-morale-exactness.md)
- [重置/调度xref未决](../rules/69-training-reset-scheduler-boundary.md)
- [AP恢复§9](../rules/02-economy.md)
- [XP转换§3.5与功绩cap§10.2](../rules/03-personnel.md)
- [技巧点cap§2](../rules/22-techniques.md)、既存 `techniques.json` 的ID16
- [每月1/11/21日](../rules/00-turn-scenario.md)

每条运行规则保留原证据标签、固定main SHA/path/section、原始链接，以及本实现标准化枚举：

`opcode-exact`、`address-level`、`reverse-engineered-partial`、`empirical-high`、`documented-guide`、`compatibility-assumption`、`compatibility-reconstruction`、`provisional-engine-rule`、`open`。

例如官方手册的`official-confirmed`映射为`documented-guide`，原标签仍保存；TP/功绩上限按现有地址/常量证据标`address-level`，没有借此宣称完整setter函数逐指令恢复。新工程契约文档不伪造“已存在于固定main”的URL。

## 4. 明确的替代边界

### 训练资格

`005C4100`完整据点gate与`005B8320`完整参数验证仍open。默认`conservative-training-v1`要求：

- 当前军团拥有该据点，兵力>0、未训练、气力未满
- 1～3个不重复武将ID，均为同势力、同据点现驻、尚未行动
- 足够AP，不跨越尚未实现的XP成长阈值

这些保守条件并不全部宣称来自原gate；额外条件在每次preview/执行的trace中明确标记`provisional-engine-rule`。`TrainingGate`可注入替换，必须提供ID、证据元数据和纯确定性`evaluate`方法；ID写入存档profile。调用时只给它深冻结副本。注入gate抛错、尝试修改状态或返回错误形状时原子拒绝。资源、所有权、参与者、每旬一次、XP边界安全校验不能被adapter绕开。

### AP恢复与有限旬结算

C9公式是`empirical-high`，不能标原函数完整opcode-exact：

```text
leader = 26 + max(floor(max(leadership,charisma)/5)-6, 0)
city = min(10*(ownedCityCount-1), 50)
officer = sum(top6(min(presentOfficersAtBase,10)))
adviserPercent = 100 if none, otherwise 70 + floor(INT/2)
core = floor((leader+city+officer) * adviserPercent / 100)
recovery = core + 5 * completedTalismanPlatforms
newCorpsAP = min(255, remainingAP + recovery)
```

以整数百分比计算，避免`floor(100*1.15)`浮点误差。PK恢复量可以超过180，只有存量cap255。数值模型限一个势力的第一军团（leader为君主），军师仍是势力级角色，驻港关人数仅在母城受控时计入，港关不增加city项。

此状态域只支持合成的现驻武将、0～100无宝物/官职修正的能力、至少一座受控城市。不存在跨军团拆分母城与港关、出征/任务/俘虏或年龄能力衍生状态；导入此类字段/第二军团会明确拒绝。角色参数与驻扎人数是两种计算，不把“本沙盒所有人现驻”推广为原作君主/军师必须在城才能提供角色参数。

`EndTurn`只是`training-only-turn-v1`适配器：推进整数旬历，恢复这一个军团AP，清本军团据点训练标记与合成武将acted标记。原训练flag重置cadence已知，但精确caller、全局时序和完整范围仍open。因此此处顺序明确是工程安排，不声称原游戏完整scheduler，也不会在据点每旬无依据地加5气力。

### XP与短场景

主分支明确每100经验产生能力成长，培养额度另有约+30总边界。这里不实现那些后续链：WAR XP必须0～99；任何选择武将`warXp+2>=100`的训练都会在修改任何状态前拒绝。

内置目标只需3次训练，每名武将总+6XP。此保护防止用户通过无限训练绕过成长语义；不把超过100的累积当作正常SAN11状态。

### 随机性：核心与原命令表现层

**训练数值核心不需要随机，但原执行函数并非整条命令零RNG。** 新核对的公开训练执行文本在玩家第一军团的表现分支中，`005C4442 -> 00472150(3)`选择发言武将；空槽可能重试：

[固定上游66e167e执行文本L202–217](https://github.com/sjn4048/311MemoryResearch/blob/66e167e40c3440929ec016f3872aefc3486434c1/内存资料/整理/Func-内政04-执行训练.txt#L202-L217)

本切片明确省略这条表现分支（`omit-training-presentation-v1`），每次接受Train都把省略写入trace。没有伪造固定一次`rand(3)`替代其条件/重试。**这会改变任何共享原版RNG后续序列，所以不能声称原命令整体或全局随机流等价。**

`xorshift32-engine-v1`是新工程PRNG，seed/draws可序列化，可通过`RandomSource`接口替换，不声称恢复了原作PRNG。现有训练/AP/日期核心都不调用它；preview也不调用。测试中的0 draws仅验证这个明示的内核边界。

### 版本

仅开启`rulesetVersion=pk, patchVersion=1.1, fixProfile=original`。`resolveRuleset('vanilla')`明确返回unsupported；伪造Vanilla存档或未知patch/fix profile被拒绝。长期Vanilla目标保留，但此处不从PK静默继承练兵所/军事府或其他规则。

## 5. 原子性、日志、存档与重放

- preview和execute共用`previewCommand`计算；所有验证先于任何状态写入
- 输入状态不原地修改，成功返回新状态
- 失败返回原状态对象，AP/金/气力/TP/XP/功绩/flags/RNG和已接受日志均不改变；拒绝原因单独返回
- 每条已接受日志包含command、before/after完整状态、计算中间量、原始来源证据、副作用/裁剪说明以及core RNG draws
- save包含初始状态、当前状态、规则profile、seed/draws和全接受日志
- load/replay逐条重算，比较全状态、计算和每条证据；篡改任一结果或证据会失败
- 存档校验不是签名或防作弊：合法改写初始状态和完全重算的日志仍可以形成一个新合成场景
- 自定义adapter的ID/行为/元数据必须在重放时一致；默认加载器不会擅自代换未知profile

## 6. 验证与已知基线问题

本切片的自动测试覆盖：主分支12组训练向量、1999/2000分母边界、奇数×1.5取整、100/120cap、实际增量→TP、TP/功绩cap、完成设施/城市边界、invalid atomicity、共享preview、保守gate可见性、XP阈值拒绝、AP四参数与cap、年月旬历、Vanilla拒绝、工程RNG、全trace存档重放与篡改拒绝。

验证记录：

- `npm run check`：TypeScript通过，59个Node测试通过（含纯文本适配层存档/载入/重放集成测试）
- `npm run demo`：40→64→88→100，日期200/12/11→201/1/1；末态AP94、TP45、各武将XP6/功绩150，存档/载入/重放一致
- `python scripts/check_training_morale.py`：主分支训练参考检查通过
- `python scripts/check_pk_training_runtime.py`：归一化规则/来源与参考向量检查

仓库已有 `scripts/check_techniques.py:55` 把字面量 `\n` 写在同一Python代码行中，造成SyntaxError。该文件保持主分支原样，未把其既有问题混入本主题；所以不能声称整个仓库原有Python检查全绿。本次运行全部64个 `scripts/check_*.py`：63通过、1个上述既有SyntaxError失败。所有数值检查都是参考规则/内核测试，不是执行原版EXE回归。
