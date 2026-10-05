# 尚缺精确内部公式/版本验证的规则

> 2026-09-29 第三轮证据审计后更新。
>
> 本文件只保留**目前仍不能负责任地升级为 confirmed / empirical-high 的核心缺口**。已经解决的项目见 `14-evidence-audit-2026-09-29.md`；每项可运行 fallback 见 `16-unresolved-rules-fallbacks.md`。

## A. P0：仍影响长期模拟准确性

### 1. 普通登用概率（外层已源码级收窄；005C4F80本体仍open）

P0-1 专项见 `36-hiring-probability-exactness.md`。

当前 PC-PK1.1 已能把真实外层固定为：

```text
004AF7D0
硬成功/硬失败
  ↓ 未命中
005C4F80 GetHiringSuccessRate -> p
  ↓
第三参数=0？
  ├─ 是：005BA4C0 deterministicValue < p
  └─ 否：义理外层倍率 -> 004721D0 runtime probability
```

正常人才命令第三参数明确为0，因此**不吃非0模式的0.9/0.7外层义理倍率**。

非0模式精确为：

```ts
factor10 =
  min(10, 15 - 2*giriInternal)

p2 =
  min(100, trunc(p*factor10/10))
```

正常模式送入 `005BA4C0` 的七个参数已经恢复：

```text
dateKey
targetId
executorId
targetLoyalty
executorCharm
executorTargetCompatibilityDifference
0
```

最后机器码：

```asm
cmp eax,ecx
setl dl
```

所以严格是：

```text
deterministicValue < successRate
```

`005B9C00 GetTimeValue` 还确认：

```ts
dateKey =
  day*7 + month*5 + year*3
```

异地登用保存的是发令日 dateKey。

### 必须隔离的现代 MOD 公式

2025年以来新版 SIRE/血色衣冠出现的：

```text
基准60
忠诚-100%
相性差-50%
魅力+20%
仕官第一年-20
浮动值6
...
```

被其更新日志明确描述为“新忠诚度系统 / 登用意愿”的可配置规则。

因此其证据标签固定为：

```text
SIRE-modern-mod-system
```

不得回填成原版 `005C4F80`。

### 仍未知

- `004AF7D0` 完整函数体；
- `005C4F80` 内部连续成功率闭式；
- `005BA410`；
- `005BA4C0` deterministic generator；
- Vanilla / 主机版等价性。

所以本项被**显著收窄但未虚假关闭**。

### 2. 外交公式的版本边界（P0-2 边界已解决；常量仍open）

P0-2 专项见 `37-diplomacy-version-boundaries.md`。

官方补丁记录现在可以把 PC Vanilla 精确切成：

```text
1.0
↓
1.1：友好增减平衡调整
↓
1.2：友好增减再次调整
     + 计略・外交成功率调整
↓
1.3～1.3.3：公开changelog未再列外交专项
```

所以“Vanilla 一套公式”已明确错误。

同时，PK 当年明确新增“超级”难度，而现有完整外交公式族包含：

```text
初级1.0 / 上级0.8 / 超级0.7
```

因此该完整公式族只能安全标：

```text
pk-era-formula-corpus
```

不能反推成 Vanilla 1.0/1.1 原公式。

当前 profile：

```text
vanilla-pc-1.0
vanilla-pc-1.1
vanilla-pc-1.2-plus
pk-pc-formula-corpus
pk-pc-reverse-support
console-separate-open
```

Vanilla 如为了闭环临时复用 PK 公式，必须显式：

```text
compatibilityAssumption=true
```

PK1.1/1.1.1 官方补丁没有公开外交专项变化，但这只支持“公开changelog无变更”，不证明 PK1.0/1.1/1.1.1 二进制公式 identical。

本项版本**边界问题已解决**；仍 open 的是各版本 exact constants：

- Vanilla 1.0；
- Vanilla 1.1；
- Vanilla 1.2 实际改了哪些常量；
- Vanilla 1.2～1.3.3 二进制等价性；
- 现有 PK 公式 corpus 的 exact build；
- late Vanilla 与 PK 的具体共享范围；
- 主机版；
- 历史公式族的原 EXE 入口。

状态：

```text
version-boundary-resolved
constants-still-open
```

### 3. 攻城统一公式与据点接管资源（P0-3 主链已收窄）

P0-3 专项见 `38-siege-capture-exactness.md`；P0-46当前capture来源边界见 [81-capture-selector-source-profile.md](81-capture-selector-source-profile.md)。

当前 PC-PK1.1 已确认：

```text
城兵伤害：
005ADC30 通用战斗伤害核心
+ 据点/兵器/难度外层修正

耐久伤害：
普通兵种/井阑/投石 -> 005ADDC0
冲车/木兽          -> 005ADE20
```

耐久外层已恢复：

- 远程普通攻击/无战法 durabilityPower=5；
- 相邻普通攻击=15；
- 战法取 tacticData+0x2F；
- 目标类型倍率；
- 会心×1.15；
- 云梯普通陆军×1.4、兵器等×1.2；
- 超级难度玩家×0.75。

普通耐久闭式目前可用逆向重构：

```ts
trunc(
  sqrt(troops)
  * attack
  * sqrt(1/1500)
  * (1+power/25)
  * targetMultiplier
  * troopMultiplier
  * extraModifiers
)
```

10000兵、攻击80、城市目标：
- 相邻普攻=231；
- 弩远程普攻=173；
与原作实测一致。

攻陷资源保留已由 `004B329B` 完整闭合：

```ts
retainPct =
  max(5, trunc(commanderCharisma/10))

retained =
  trunc(oldAmount*retainPct/100)
```

统一作用于：

```text
金
兵粮
兵力
12类兵装
```

旧“魅力/10直接作为百分比、低魅力可能0%”错误；原程序有最低5%。

当前真正仍 open：

- `005ADDC0` 函数体；
- `005ADE20` 函数体；
- 小兵力/x87取整；
- 小数量兵器/舰船整数边界；
- 已恢复selector与clean stock PC-PK1.1的字节等价性；
- 已列3 direct caller之外的历史/脚本/劝降cause，人物/force/事件完整finalizer；
- 有界ordinary/neutral scalar以外的二次ownership/外部callback耐久关系；
- 全局RNG初始状态/消耗与存档回归；
- Vanilla各补丁/PS2/Wii自身实现。

P0-46新增已知范围：公开IDB的 `004B2CA0` body、三直接caller、city-only gate、候选链表序及30容量、完成/type30分支、`floor(max(20,charm)/20)` quota、n次全范围swap和销毁前缀均已恢复。`004B329B`只是资源局部段。新势力ID超0..41在shuffle后改为全毁；不能将其改名为“处断君主”规则。P0-46参考模型只处理已资格化有序候选；[P0-48](83-capture-transaction-source-profile.md)已新增完整世界收集与有界事务。

来源IDB的input path含“血色5.0公测”，因此 `opcode-exact` 仅限绑定hash的source profile，stock原性未核。PC-PK1.1采用为 `compatibility-reconstruction`，Vanilla单列 `compatibility-assumption`。晚期耐久 `currentAtTail < floor(maxAtTail/2)` 才写下限，不是完整capture reset公式。

P0-48进一步恢复三caller mode/关系排除、normal/neutral finalizer、普通入城及存活domestic动态owner：neutral分支会清零中间保留资源；ownership先按newOwnerMax向下cap，尾部再半max floor。`004B9840`在S1有界非负building-entry域的非整除floor已恢复，stock和troop→troop仍未知。模型显式记录未覆盖人员/force/计数器/事件等fallback，不能称整场原游戏capture闭合。

P0-49新增[人员/容量审计](84-capture-personnel-source-profile.md)：S1特产容量查询、004B1280分组与binary32小值边界、004B2820处分路由已恢复；当前模型只写三个已知俘虏字段，完整位置/军团/任务/非hold处分和事件仍open。

P0-50新增[前置释放/迁移/排序审计](85-capture-relocation-source-profile.md)：旧俘虏pass、004B0F50目的地、004A7990任务期间/返回origin、base escape不写实际位置、缺席home-roster和稳定身份rank排序已source-bound恢复并有界投影。P0-50 v1原有未投影范围的后续进展见P0-51；这仍不解决0058C320维护费forced-release comparator，也不证明stock等价。

P0-51新增[游离/任务取消审计](86-personnel-detachment-source-profile.md)：004BBB00/004BA520目的地、实际territorial-city、身份/军团/职务字段与事件顺序现有独立有界投影；004A57B0注册dispatch和15..21取消退款/返回路径已恢复，S2 cap/query/acted-hook差异隔离。其他专用取消handler、004BF6F0返回和004A8110监听器、完整force灭亡/君主继承/全capture组合仍open。不能再把已实现局部路线笼统称为缺body，也不能以此关闭完整事件。

P0-52新增[六个零退款handler](87-mission-cancellation-zero-refund.md)：9/10/12/22/23/24的ordered gate、目标pointer域与无效性检查区别、零退款返回/reset现在有独立v2投影；v1仍保留历史语义。该组当时剩余专用取消为0/2/5/38和41..43（后续有界进展见P0-53..55），另mission37完成、004BF6F0及完整callback链继续open，不能再笼统称这六个handler未投影。

P0-53新增[组任务取消](88-group-mission-cancellation.md)：2/5的按ID前三人、城市signed byte恢复/actor-force研究字段先于逐人返回现有独立原子投影。S2研究getter扩展到63已追到独立hook。该组当时剩余专用cancel为0/38和41..43（后续有界进展见P0-54..55），以及mission37完成/004BF6F0/完整回调；v1/v2的历史trace保持不变。

P0-54新增[设施任务取消](89-facility-mission-cancellation.md)：0/38 gate、mission0组收集先于target、无效target返回1但不reset、type30宝物42尾部、type3..63 raw写宽/城市byte/home引用现有独立投影。S2升级设施计数仍受+14 gate，与S1分别绑定；source-accepted base目标显式defer/reject。P0-55另有41..43有界投影，另base销毁、mission37完成、004BF6F0与完整回调/force/capture仍open。

P0-55新增[能力培养任务取消](90-special-mission-cancellation.md)：41..43共享005D9C60按actor、args[1]建筑0..16383、args[0]培养记录0..97短路，独立投影不虚构actor实际所在地valid gate；troop/-1与home=-1相等路径已测试。六个S1/S2 +18 slot确认005DA320条件通知读home，展示/完整return仍显式record/reject。专用cancel家族已有分别的有界投影；base销毁、mission37完成、004BF6F0和事件/force/capture组合、clean stock/跨版本仍open。

P0-56新增[mission37生命周期](91-return-mission-lifecycle.md)：completion与单active-list成员的一步推进有独立有界API。positive refund先于mission/args reset，handler1/dispatcher0，arrival直接acted0/duration0无S2 query267；六邻城首slot同分和S1/S2距离分别绑定。active live valid/mission/acted gate与stop观察已恢复；全链表、外部reset/全scheduler、generic/invalid-home不安全域、004BF6F0完整角色/force/事件与base销毁仍open，不能再笼统称mission37 helper/一步移动未实现。

P0-57新增[武将返回字段与调用顺序](92-officer-return-finalizer.md)：004BF6F0的home→location→rawlegion→bit9、真实troop gate、numeric same-force、旧新roster阶段和role调用顺序现有独立有界投影。ruler ownership/capture明确整次defer，完整list/UI/角色仍record/reject且要求非干预，不等于004BF6F0完整执行。下一主题优先稳定非空004BE2A0角色协调；其余force灭亡/空军团合并/太守/事件/capture组合及clean stock/跨版本仍open。

P0-58新增[稳定非空军团/太守协调](93-legion-role-reconciliation.md)：004BE2A0稳定分支与004BCA30(refresh=0)已有独立有界标量执行，完整域候选/不同排序/身份暂态/有序据点与event8/14字段边界已审计。原先“稳定非空角色尚未实现”收窄为完整事件/返回组合、军师监听、force灭亡/空军团、refresh!=0和不安全排序域；S1/S2容量观察按stage隔离，clean stock/Vanilla仍open。

状态：

```text
siege-call-chain-resolved
capture-resource-formula-resolved
capture-selector-source-profile-recovered
stock-pc-pk11-equivalence-open
capture-scalar-finalizer-source-profile-recovered
capture-personnel-force-event-finalizers-and-global-rng-open
durability-inner-functions-still-open
```

### 4. 火焰持续与自然蔓延

P0-4 审计已完成，行为边界已明显收紧：

- 火计约400±100，和兵数/兵科/适性/攻防无关；
- 火计会心即时火伤约×1.2；
- 火计会心对同一次点火的**持续时间 = 基础结果 +1 回合**；
- 原作 fidelity 下不启用“着火格每旬自动向普通邻格蔓延”；
- 火种/火球/落雷范围和火罠连锁属于主动攻击/陷阱系统，不算自然蔓延；
- `00599CF0` 的普通每旬计数器处理没有发现地面火寿命逻辑，不能误挂到该函数；
- 现代复刻的 `[1,2] @ 70/30`、会心 `[2,3] @ 70/30` 只保留为可替换工程 fallback，不标原版常量。

仍未知：

- PC-PK1.1 点火寿命 setter 原函数；
- 原版基础寿命完整概率分布；
- 内部 counter 与玩家可见“第几回合熄灭”的精确 phase 映射；
- 已着火格再次点火的 setter 语义；
- 不同点火来源是否共享 lifetime RNG；
- Vanilla / PS2 / Wii 等价性。

详见 [P0-4专项](39-fire-lifetime-spread-exactness.md)。

### 5. 登场 / 自然死亡精确 RNG（P0-5 审计完成）

P0-5 专项见 [40-debut-death-exactness.md](40-debut-death-exactness.md)。

已确认 / 收紧：

- PC-PK1.1 `00590C30 MonthlyAction` 只在月初进入人员生命周期链，其中 `00590C82 -> 005833D0` 是明确的**年龄 / 死亡相关处理入口**；因此自然寿命主处理不是任意旬独立 dispatcher。
- `YearOfDebut / Identity / ScheduledLord` 为独立字段；史实模式仍使用人物原 `YearOfDebut` 与剧本位置/身份。
- `ComeOnStage` 的用户语义可分史实 / 假想；假想模式会随机化未发现/在野人物位置，并把登场年统一提前到成人年。成人年龄按现有资料采用 **15岁**（empirical-high），但 raw enum 仍open。
- `IgnoreAge` 是独立场景字段；英雄集结类“无视年龄”场景至少绕过普通时间登场 gate 与普通自然寿命，不与 `Lifetime` 合并。
- `Lifetime` 用户模式分 Historical / Longevity / Fictional；Longgevity 约 +20 年、Fictional 约 99 岁目前只作为 documented/empirical compatibility profile，不冒充 `0048A000` 原函数常量。
- 自然死 / 不自然死是不同 lifespan profile；不自然死不会在史实没年直接退场，且额外寿命与基础没年年龄负相关。
- 孙策实测排除“最终实际死亡最多只比基础没年晚15年”的 hard cap。
- `YearOfDeath / GetDeathYear / markedForDeath / HealthLevel / Identity=DEAD` 必须分层。
- 从较早存档重跑可能改变未来死亡结果，禁止 scenario init 时永久预抽最终死亡日期。

仍 open：

- `005833D0` 完整函数体；
- `0048A000 GetDeathYear` 完整函数体；
- `ComeOnStage / Lifetime / IgnoreAge` raw numeric enum；
- 史实普通登场时 `ScheduledLord` 精确分支与 setter；
- Longgevity +20 与死因修正的先后顺序；
- Fictional 99岁是进入死亡流程的 threshold 还是实际 hard date；
- `markedForDeath` 的触发概率 / 时点；
- flag 后健康恶化到真正死亡的精确时序；
- Vanilla / PS2 / Wii 差异。

### 6. 忠诚下降主函数

已确认（PC-PK1.1 `0058E510` 已有完整逐指令文本）：

- 相性差使用 `00489F80` 的150点环形距离：`min(abs(a-b),150-abs(a-b))`；
- 己方普通武将自然掉忠只在换季，候选条件为相性差>=25，或低/较低义理+高/较高野望；
- 真实忠诚为 byte 0..255，UI只显示到100；
- `仁政` 阻止同都市己方武将自然掉忠，但俘虏明确跳过仁政；
- PK `人心掌握` 精确为 `Random(0..2)>=1` 时跳过，即2/3免降；
- 俘虏跳过季初限制，因此在月初调用中每月可判定；但亲爱/配偶/义兄弟/父母子女仍可豁免；
- 进入数值路径后为两个独立 `Random(0..2)`，有符节台额外`+2`；
- 若当前君主义理最低且野望最高，再加 `floor((4-targetIdeals)/2)`；
- 以上同一数值分支同时服务符合gate的普通武将与俘虏。

仍未知：

- 欠薪、流言、事件等**非自然路径**各自的精确忠诚函数；
- Vanilla/其他平台是否有常量差异。

旧“人心掌握约2/3但仅empirical”“俘虏月度基础闭式open”“君主义理/野望附加项只作fallback”均已撤回。

### 6.0.1 俘虏捕获 / 逃亡 / 资金不足释放（P0-7 更新）

已确认：

- `004B1280`当前以P0-49 source-bound审计为准：末城gate在强运/宝物之前，binary32舍入与nearby=0不可省略；`00582BE0`自然逃亡、`0058E510`月度掉忠保留原有独立证据边界；
- 据点俘虏维护费50金/人；
- 可支付人数 = `min(count, floor(gold/50))`；
- **资金不足必须释放人数** = `max(0, count-floor(gold/50))`，这一项已 exact；
- 资金不足并非直接前N名：原程序把 `0058C320` 作为 comparator 传入 `004AA200`，随后用 `004A8E10` 裁剪到恰好 releaseCount；
- 每据点选出的 forced-release 列表先交 `0058D1D0`，全部据点完成后统一 `0058D430` finalizer；
- 官方“追放”命令可主动释放敌俘，无金/AP/执行武将，最多6人；释放敌俘会**增加技巧P**；
- 技巧P具体点数仍未官方/逆向闭合；社区“约3”只作为 empirical compatibility candidate；
- `ForbiddenLord / ForbiddenMonths` 是真实字段，月初 `0058BB30` 处理禁仕计数；
- “主动释放一定3个月禁仕”存在直接冲突资料：2009记录支持3个月，2011记录明确称自主释放不立flag。因此必须按 release cause / version 拆分，不能静默写死。

仍未知：

- S1 `004A0590` 已由P0-49恢复为持有指定type宝物检查；clean stock等价继续open；
- S1参数7的3/4已定位为目标cell低5bit地形值，具体地形命名/跨版本等价另核；
- 血路的路径/版本边界；
- S1 `004721D0` 的p>100必成功且消费一次已恢复；stock/S2随机等价仍open；
- `0058C320` comparator 字段与方向；
- `004A8E10` 裁剪方向；
- `0058D1D0 / 0058D430` 完整函数体；
- forced maintenance release 的 Forbidden/技巧P side effect；
- 主动释放技巧P exact；
- 主动释放3个月禁仕冲突的版本/路径消歧；
- 即时捕获界面释放与势力灭亡路径。

详见 [P0-7专项](42-captive-release-exactness.md)。

### 6.2 官职自动分配资格 / selector / tie-break（P0-8）

专项见 [43-auto-office-selector-exactness.md](43-auto-office-selector-exactness.md)。

已确认 / 收紧：

- `005FAF00` 参数角色已经恢复：arg1=candidate list、arg2=office、arg3=scoring mode flag；
- 旧“`005FA650` 生成/排序候选列表”说法错误，已撤回；它实际接收 office 并返回 office type；
- 对80个有名官职，type0=丞相/司空/太尉/司徒，type1=武官，type2=普通文官；
- `005FA4D0(person,office)` 先做资格 gate，随后 true loyalty <90 共用硬拒绝；
- arg3!=0 的 weighted-threshold mode：
  - top civil：统+智>=150，score=统+智+忠诚项；
  - military：max(统,武)>=60，score=统+武+忠诚项；
  - civil：max(智,政)>=70，score=max(智,政)+忠诚项；
  - 忠诚项=`9*min(trueLoyalty-90,10)`；
- arg3==0 的 role-affinity mode：
  - military 仅在 max(统,武)>=max(智,政) 时参与；
  - civil/top-civil 仅在 max(智,政)>max(统,武) 时参与；
  - 相等时武官侧获分类优势；
  - 不加忠诚 score bonus；
- final score 相等时不替换：**caller list first-in wins**；
- merit 负责前置资格，不进入 `005FAF00` final score。

仍 open：

- `005FA4D0` 完整资格 body；
- `005FA650` 完整 opcode与第81项；
- `005FAF00` caller / xref；
- caller candidate list 构造与顺序；
- arg3 的业务语义；
- 多官职连续自动分配时的 office 顺序、candidate removal；
- Vanilla / 主机版。

因此当前 selector 的**单个官职选人核心已经可以 exact 实现**；尚不能伪造跨多个官职的完整自动任官 scheduler。

### 6.1 褒赏 / 欠薪 / 流言等非自然忠诚变动（P0-6）

P0-6 专项见 [41-nonnatural-loyalty-exactness.md](41-nonnatural-loyalty-exactness.md)。

已确认 / 收紧：

- 金钱褒赏：100金/人、5AP/人、多人、每人每回合一次、显示忠诚100不可、部队从军武将不可；`00489140 HasPraised` 为结构证据；
- `005B5D60` 已定位为褒赏扣 AP / 金钱的执行链；
- 褒赏忠诚增量是随机结果，君主魅力影响上升量；实测有 +5 / +8 / +9，现代复刻“保底11”与原作样本冲突，不进入 fidelity；
- 隐藏忠诚可超过100，褒赏可出现99→108；
- 宝物授予10AP，价值越高忠诚越高；`gain=item.value` 当前只标 empirical-high candidate；
- 月俸每月支付，俘虏维护先于现役俸禄；
- PC-PK1.1 俸禄外层事务已经源码级闭合为**每据点整笔支付 / 整笔不支付**：
  - `salarySum <= postCaptiveGold` → 一次性全额扣除；
  - `salarySum > postCaptiveGold` → 跳过唯一的 salary 扣款，保留 post-captive 金钱，进入 `0058D5E0 -> 0058C190` 欠薪忠诚路径；
  - 因此外层不存在“剩余钱按比例部分发工资”。
- 流言成功率与效果量是不同函数层；公开逆向只标出 effect-side `005D05B0 / 005D05F0`，函数体仍未展开；
- “成功流言 → 全城所有武将统一扣固定忠诚”已被百人都市、300+成功流言实测反例否定；必须保留 target selector + per-target loss RNG；
- 现代复刻当前的“全体存活武将 8..15 + 义理修正”明确属于工程重建，不作为原作 fidelity。

仍 open：

- `005B5D60` 内部褒赏忠诚公式；
- 褒赏 RNG / 君主魅力 / 目标义理闭式；
- 宝物 value→loyalty 原 opcode 与没收 -30 的版本边界；
- `0058D5E0 / 0058C190` 完整函数体、欠薪最终受罚集合和每人下降值；
- `005D05B0 / 005D05F0` 流言 effect helper；
- 流言 target selector、单人忠诚损失分布与治安下降分布；
- Vanilla / PK / 主机版差异。

### 6.3 部队编成最终资源事务（P0-9）

专项见 [44-troop-resource-transaction-exactness.md](44-troop-resource-transaction-exactness.md)。

已确认 / 收紧：

- battle troop-count draft = sub_647250；
- battle money/food draft 位于 sub_647AC0；
- transport cargo draft 位于 sub_615790 / sub_615A10；
- 战斗部队金10000、粮50000，runtime helper 也会封顶，不只是 UI 值；
- 输送兵60000、金100000、粮500000；
- 输送 ordinary equipment quantity cap 可由地址表 + SIRE reverse-history 收紧为 **100000**；
- troop strength 另有65535硬边界；
- 据点侧 004AE2A0/300/3C0/430 与 troop侧 004AE4A0/510/570 等资源 primitive 已定位；
- ID1～4 枪戟弩马为数量型，出征资源量与士兵数等量；
- ID5～8与10～11为件数型，一支对应部队一件/一艘是 documented/empirical-high；
- 回城资源并入据点，存活件数型装备可重新入库；
- 入库超过据点容量会产生超额损失，为长期原作实测；
- 现代 sango_infinity 的 commit/return 调用顺序只作 reconstruction 对照，不标原作。

仍 open：

- battle / transport actual commit finalizer 地址和 body；
- 据点扣兵/金/粮/兵装与 runtime troop 创建的精确顺序；
- commit rollback；
- 件数型扣1 caller；
- transport 全12类兵装是否完全共享100000路径；
- enter-building/disband finalizer；
- 数量型兵装返还量、伤兵与兵装顺序；
- 多资源同时超容量的裁剪顺序；
- 出征武将完整过滤；
- Vanilla / 主机版。

因此 E1 的“资源事务语义”已经可以高置信复现，但 exact opcode finalizer 继续显式 open。

### 6.4 部队主副将关系合成 / FPU取整（P0-10）

专项见 [45-deputy-rounding-exactness.md](45-deputy-rounding-exactness.md)。

已确认 / 收紧：

- `00495AB0` 只用于统率/武力；智/政/魅在无嫌恶时直接取三人最高；
- 普通关系 `00495B65 = sar eax,2`，即正差值/4向下截断，为PC opcode exact；
- 亲爱 `00495B79 = sar eax,1`，即正差值/2向下截断，为PC opcode exact；
- 夫妻/义兄弟 full-share 除PS2精确实测外，又获PC SIRE原版规则说明交叉，升级为PC-high；
- 血缘/3仍保持cross-platform-high，PC opcode继续open；
- 两名副将分别与主将算candidate后取最大，不叠加bonus；
- 任一主/副、副/副嫌恶pair仍触发五维主将-only hard override，但适性继续三人取高；
- `00707A74` 已通过原IDB内部label与Microsoft CRT源码识别为 `_ftol2`；
- `_ftol2` 语义是 toward-zero truncation，因此正常正攻防/建设/耗粮 raw 的最终转换就是 exact floor；
- 旧“00707A74 rounding mode open”撤回。

仍 open：

- `00495AB0` 完整PC body；
- 血缘/3 PC opcode；
- 夫妻/义兄弟full-share PC精确branch/opcode；
- relation check方向性；
- x87中间 extended precision / 原常量 bit pattern 极端边界；
- Vanilla / PS2 / Wii等价性。

### 6.6 训练生命周期剩余边界（P0-11 / P0-47）

旧轮次见[46号](46-training-morale-exactness.md)与[69号](69-training-reset-scheduler-boundary.md)；当前source结果以[82号](82-training-lifecycle-source-profile.md)为准。

S1固定fingerprint已恢复：

- `005C4100`完整base gate、`005B8320`三槽参数helper、`005B80F0`身份/部队/acted/missionDuration过滤
- 零兵力、已训练、满气力拒绝；AP/至少一位合格者的上层校验
- `0059C423→00598630`全局reset，经`00487860`非连续tails清城市+A4、港关+68，再遍历1100人清acted/praised
- `0059C330→0059C2A0`尾跳`0059A230`野外气力caller；后续任务处理可能重新置acted
- 累计XP0..3000、floor(XP/100)派生能力、普通1..100cap，PK研究共享XP额度
- 360天游戏年/30天月/每旬10天的整数日期getter

新字节只属于MOD关联S1来源；另一个S2 MOD样本确有不同XP/能力上限，所以不能直接写stock confirmed。带配置/测试/trace的训练生命周期兼容实现已接入，implementation gap与以下原作证据债分开：

- clean stock PC-PK1.1独立hash与上述字节/完整调用链等价
- 完整scheduler、AP恢复位置、经济/AI/事件/任务交错与全局RNG
- 所有任务/位置predicate与完整人员属性修正、特殊人员ID语义
- `0059A230`全body与多个军乐台selector全部细节
- stock EXE/存档回归，Vanilla/PS2/Wii独立验证

### 6.7 阵系耗粮重叠 / 粮尽逃兵（P0-12）

专项见 [47-food-overlap-starvation-exactness.md](47-food-overlap-starvation-exactness.md)。

已确认 / 收紧：

- `0049D180` 返回一个防御系列设施 type，`0049D2E0` 只消费一个 multiplier，因此重叠阵/砦/城塞**不叠乘**；
- 原 multiplier bit pattern：
  - 无 `0x40000000`；
  - 阵 `0x3FD55555`；
  - 砦 `0x3FAAAAAB`；
  - 城塞 `0x3F800000`；
- 公共 `0.05f = 0x3D4CCCCD`；
- 配合 P0-10 `_ftol2`，18000兵结果精确为1800/1499/1200/900；
- `0059BF40` 对进入旬时0粮的对象直接跳过；本旬扣到0也只记录粮尽消息，不扣兵；
- 因此粮尽掉兵存在独立 handler；
- `00599AA0` 是围城断粮据点人口衰减，不是野外 troop starvation；
- 旧 `A*0.76^N` 缺乏可信出处，从 empirical-high 降为 legacy-compatibility-only。

仍 open：

- `0049D180` 不同等级覆盖重叠时的 winner priority；
- 野外粮尽掉兵 handler 地址与闭式/RNG；
- 战斗/输送 starvation 是否同规则；
- 首旬与持续粮尽是否不同；
- Vanilla/主机版。

### 6.8 补给 / 输送剩余边界（P0-13）

专项见 [48-supply-transport-finalizer-exactness.md](48-supply-transport-finalizer-exactness.md)。

已确认 / 收紧：

- `004BF522` 输送到达+200功绩位于 `sub_4BF1F0`（下一函数 `004BF6F0`），到达处理所在函数范围已定位；
- 输送到据点功绩+200为PC地址级确认；
- 目标据点满仓时超出兵/金等会提示并消失，overflow discard 为PC empirical-high；
- PC手动补给使用相邻命令+slider，直接以目标部队为移动目标时走自动最大补给；
- 自动/手动补给均受目标兵/金/粮容量限制；
- 枪/戟/弩/马补兵需要等量匹配兵装；
- 输送队不能作为普通补给目标（empirical-high）；
- 补兵后气力按新旧兵数加权；
- `004B9840` 是原程序 building 气力混合 helper，支持“兵数加权”模型。

仍 open：

- `sub_4BF1F0` stock等价、复杂人员/二次ownership路径；S1完整body与普通入城scalar写入顺序已由P0-48恢复；
- 手动/自动野外补给 finalizer及是否共享核心；
- troop→troop morale merge helper；
- stock/field troop-to-troop非整除气力rounding；S1 building-entry的`004B9840`已由P0-48恢复；
- target=transport hard gate PC地址；
- 野外补给+100功绩/+2统率经验PC地址；
- 自动补给多资源优先级；
- transport death/loot finalizer和掠夺比例；
- Vanilla/主机版。

### 6.9 技巧系统剩余边界

E7 已确认：

- 36个技巧ID和9系×4级结构；
- Lv1～4技巧P/金成本；
- 3人、50AP、同系顺序研究；
- 技巧P上限10000；
- 研究能力经验=消费TP/100；
- 锻炼伤害1.10、精锐伤害1.15且覆盖锻炼；
- 精锐面板攻防+10与移动加成；
- 矢盾/大盾30%且原版默认不挡战法；
- 强弩、良马、骑射、熟练兵、军制改革、云梯、车轴、城壁强化、防御强化、神火计、木牛流马、政令整备、人心掌握等核心常量。

仍未知：

- E11：技巧研究完整PC时间函数、超级五档完整矩阵、初级/上级难度、属性getter层；
- 兵粮袭击 `005ADB20` 原RNG粒度/分布与资源裁剪边界（触发路径和数量主模型已由E9闭合）；
- 应射 `00584DC8` 完整caller、内部attack-type/unit-type值、水上active profile与PC连战链序（主行为已由E10收窄）；
- 技巧研究完成功绩的PC逐地址；
- 爆药炼成原PC BUG及补丁差异（转E8）。

旧“精锐=锻炼1.10再乘1.15”“人心掌握仅约67% empirical”均撤回。

### 6.10 技巧补丁版本差异剩余边界

E8 已确认：

- Vanilla与PK是独立官方补丁链；
- Vanilla Ver1.0→后期资料有7条明确技巧差异；
- 官方changelog未给逐技巧transition patch，因此不能统一标“1.2修改”；
- PK1.1工兵育成：内政设施×2、城市/港/关×2.5；
- PK1.1爆药炼成原BUG看被烧/防守方技巧所有权；
- 社区修复改为看点火/攻击方；
- 矢盾/大盾挡战法属于社区patch，不是官方默认；
- 版本层至少需要 `rulesetVersion + patchVersion + fixProfile`。

仍未知：

- Vanilla 1.0/1.1/1.2 EXE技巧地址diff；
- 戟/弩/骑Lv1在Vanilla 1.0是否也为1.20；
- Vanilla 1.0工兵育成400%的内部双支路；
- 爆药炼成BUG是否在某个官方地区发行版静默修复；
- 主机版逐项技巧常量差异。

### 6.11 兵粮袭击剩余边界

E9 已确认：

- `005ADB20` 是兵粮袭击 helper；
- `005ADB55` 对应 techId=1；
- 只对部队目标；
- 普通攻击和战法共用同一附加效果段；
- 反击明确跳过；
- 数量高置信为 `min(Attack×R, floor(己方兵力/2))`，`R∈[1,2]`；
- Attack 是部队攻击面板，不是本次实际兵损；
- 连击两次抢粮为 empirical-high。

仍未知：

- `005ADB20` 完整逐指令；
- 原RNG是连续、0.1档、0.01档或其他分布；
- 目标粮少于计算量时如何处理；
- 攻击方接近50000粮上限时如何处理；
- 盾类让伤害归0时是否仍转移粮；
- 支援攻击是否调用；
- 枪兵处于水上舰船active profile时是否触发；
- 战法失败路径的最终资源行为；
- Vanilla/主机版是否完全一致。

兼容闭环采用 `k∈[10,20]` 的均匀整数档并做资源守恒裁剪，但必须标 `compatibility-reconstruction / engine-safety-fallback`，不能冒充原作。

### 6.12 应射剩余边界

E10 已确认/高置信：

- 技巧ID9，地址 `00584DC8`；
- 防守主体为弩兵；
- 箭类普通攻击和战法可触发；
- 火矢明确可被应射；
- 必须满足正常射程和地形攻击合法性；
- 支援攻击不触发应射；
- 混乱/伪报不能正常应射；
- PCPK急袭可50%规避应射伤害；
- PS2PK双方应射+连战可形成长链。

仍未知：

- `00584DC8` 周边完整PC caller；
- 精确 attack-type / unit-type 比较常量；
- 各战法 primary/collateral 的逐路径；
- 水上 active profile；
- PC 应射+连战的调用顺序/最大深度；
- Vanilla/Wii/PS2逐项等价性。

兼容实现应复用普通攻击合法性，不要把应射写成“所有远程攻击、无限射程、固定弩箭动画”的独立伤害函数。

### 6.13 技巧研究时间剩余边界（P0-14）

专项见 [49-technique-research-time-exactness.md](49-technique-research-time-exactness.md)。

已确认 / 收紧：

- 原 IDB 将 `005D7ED7 / 005D7EF0 / 005D7EF4` 全部归入 `005D7DD0..005D7EFF`，因此 `sub_5d7dd0` 是技巧研究时间 calculator containing function；
- 人才府在基础时间算完后固定 -2旬（-20日）；
- 最低1旬（10日）；
- 势力 `ResearchTimeLeft +0xA0` 以旬存储，每旬 `00599CF0` -1；
- `struct_technology[36]` 当前没有已恢复的研究时间字段，因此基础时间应视为代码派生，不再假设存在已知静态time字段；
- 超级相关能力和70/140/210/280分档保持 empirical-high；
- 210无人材府30/40/60/90为已知锚点；
- 280+人才府Lv4=60，结合exact -20可反推280无人材府Lv4=80；
- 初级/上级难度没有证据可直接复制超级阈值；
- 研究命令执行路径位于 `sub_5d8c50` 一带，与时间 calculator 分离。

仍 open：

- `005D7DD0` 完整body与参数签名；
- Basic/Actual 属性getter层；
- 阈值比较符；
- 超级完整5档×36技巧矩阵；
- 初级/上级矩阵；
- 技巧类别基础时长分支；
- `struct_technology +0x68` 含义；
- Vanilla/主机版。

禁止用线性插值填未知矩阵。

### 6.14 技巧研究完成功绩剩余边界

E12 已确认存在两套资料：

```text
现行日文Wiki主表：500 / 1000 / 2000 / 3000
早期2006攻略/同站小ネタ：500 / 1000 / 1500 / 2500
```

共同无冲突部分只有：

```text
Lv1 = 500
Lv2 = 1000
```

繁中 PC-PK1.1 逆向资料已经给出技巧研究时间、人才府和“研究经验=消费技巧P/100”等相邻规则，也列出大量其他动作的功绩地址，但公开文本没有给出技巧研究完成的功绩写入地址。

因此：

- `500/1000/2000/3000` 仅保留为 `documented-current-wiki-candidate`；
- `500/1000/1500/2500` 保存为早期资料候选；
- 不能把两者擅自映射成“Vanilla表/PK表”；
- 旧表恰好等于技巧P/2，不能据此发明动态公式。

仍未知：

- PC-PK1.1 exact caller/常量；
- 两表真正的补丁/平台映射；
- 1～3名研究武将是否逐人全额结算；
- Vanilla/PS2/Wii等价性。

详见 `27-technique-research-merit.md`。

## B. P1：局部系统精度

### 7. 混乱 / 伪报基础持续与恢复

E13 已把“自然恢复概率”从 open 项中移除。PC-PK1.1 原函数 `00599B90` 表明异常状态使用独立剩余计数，并在每旬做确定性倒计时。

已确认：

- 部队 `+0x24` 是状态：0正常、1混乱、2伪报；
- `+0x28` 是异常状态剩余计数；
- 每旬先执行状态行为，再减少计数；
- 混乱且尚未行动时直接标记已行动；
- 伪报且尚未行动时先朝所属据点执行退却，再标记已行动；
- 普通位置每旬 `remaining -= 1`；
- PC-PK1.1 在本势力当前合资格阵/砦/城塞有效范围内每旬 `remaining -= 2`；
- 计数最低钳到0，等于0时恢复正常；
- 这一恢复流程不读取智力、性格、兵种、适性或随机数；
- 少兵自动混乱路径已源码确认初始计数为 `GetRandomX(2)+1`，即1或2；
- 普通计略伪报/扰乱会心至少持续2旬，是攻略/Wiki层稳定边界。

因此旧的：

```text
每旬按某个概率自然清醒
```

必须删除。

仍未知：

- `005917D0` 普通伪报成功时的初始 duration 原函数；
- `00591A20` 普通扰乱成功时的初始 duration 原函数；
- `004AEA70 SetTroopStatus` 对已经处于异常状态目标的精确覆盖/刷新语义；
- 原版螺旋突刺混乱持续时间的逐指令链；
- Vanilla/PS2/Wii 的完整逐指令等价性。

开源复刻项目使用的“普通1/2回合=70/30、会心2/3回合=70/30”只能作为 `provisional-engine-rule`，不能冒充原作概率。

详见 `28-status-duration-recovery.md`。


### 8. 单挑连续公式（E14 通用核心已闭合）

E14 已恢复 PC-PK 导向的通用连续核心：

```text
伤病修正后的武力
→ 非线性 duelScore
→ 双方 score² 占比
→ actionRatio (1..99)
→ 方针 hit/block/attack 系数
→ Hit / Dodge / Block
→ 普通伤害 / 必杀伤害
→ 斗志增长
```

关键反例已经解释：

```text
100 vs 95 -> actionRatio 55 -> 攻击重视命中13
80  vs 75 -> actionRatio 52 -> 攻击重视命中12
```

所以同为武力差5并不等价；旧“只按武力差”模型撤回。

同武力则严格：

```text
actionRatio = 50
攻击/防御/斗志重视完整命中 = 12 / 7 / 10
```

命中阈值、闪避、格挡、格挡伤害、攻击重视3～4连击、气合×5/4、坚守×3/4、剑的斗志×3/2以及通用必杀伤害都已结构化。

直接地址交叉：

```text
005097C3 / 005097EB
6B C0 64 99 F7 F9
=> imul eax,eax,100; cdq; idiv ecx
```

与 `actionRatio` 最终百分比计算一致。

因此本项原先的“完整连续公式未知”从 open 移除。

仍需单独审计的只有：

- 特定人物隐藏补正原硬编码；
- Vanilla EXE 逐指令等价性；
- PS2/Wii 平台差异。

详见 `29-duel-continuous-formulas.md`。

### 9. 舌战普通牌心理伤害（E15 通用核心已闭合）

E15 已恢复 PC-PK 导向通用心理伤害链：

```text
双方智力
→ 每方固定 debateAttack
→ 牌力只决定本回合胜负
→ 胜方按牌模板计算 hpDamage
→ 独立计算 stressDamage / 特殊效果
```

智力攻击值：

```ts
attack =
  100
  + trunc(
      40*(myINT-opponentINT)
      /(131-myINT)
    )
```

普通话题牌：

```ts
hpDamage =
  trunc(
    (attack + RandInt(5))
    * angerCoef
    * levelCoef
    * topicCoef
    / 1000
  )
```

其中：

```text
levelCoef：小10 / 中15 / 大20
普通 angerCoef：10
当前话题 topicCoef：10
非当前话题 topicCoef：6
```

同智力 golden table：

```text
当前话题：
小100～104 / 中150～156 / 大200～208

非当前：
小60～62 / 中90～93 / 大120～124
```

牌力与伤害严格分离：

```text
当前话题小牌 power 11 > 非当前大牌 power 3
但其心理伤害约100 < 非当前大牌约120
```

大喝、诡辩、无视、镇静、激昂也已拆清：

- 大喝固定牌模板，但仍读取出牌者 attack；
- 诡辩用自己的 attack + 对手普通话题牌模板反弹；
- 无视不造成HP伤害，只使对方怒气+30；
- 镇静/激昂属于怒气效果层，不是普通心理伤害。

因此本项原“精确心理伤害函数未知”从 open 移除。

仍 open：

- 特定人物隐藏修正；
- Vanilla 连续常量的二进制等价性；
- PS2/Wii 平台差异；
- 追击/留情等结束结算的逐平台差异。

详见 `30-debate-psychological-damage.md`。

### 10. 非骑战法来源的负伤 / 战死（E16 主问题已闭合）

E16 证明原问题不能用“普攻/战法/火焰/设施各自有一个统一伤亡率”来回答。

PC-PK1.1 已确认是**来源分流**：

```text
弩系火矢/贯射/乱射 -> 005974C0 狙伤
猛者成功位移      -> 50%负伤
业火种/业火球      -> 00597350 战死+独立负伤
骑兵突击/突进      -> 005975E0 专用战死
单挑               -> 单挑专用结算
```

普通攻击、一般战法、设施攻击导致部队壊灭后，不再额外添加一个自拟“2～5%战死 / 15%负伤”roll。

弩系狙伤核心：

```ts
P =
  tacticBase
  + statTier
  + personality
  + critical
  - 1
```

```text
火矢0 / 贯射1 / 乱射2
性格0/1/2/3
会心+1
statTier=-2/-1/0/+1
理论峰值6%
```

业火 conditional casualty：

```ts
death =
  max(0, baseDeath + personality - abilityProtection)

injury =
  max(0, 2 + personality - abilityProtection)
```

其中普通/高战死 base=2/4；无战死仅跳过 death，不跳过 injury。

因此本项原“普攻、其他战法、火焰、设施攻击的精确版本化概率全部未知”从 open 移除。

仍 open 的是更细粒度：

- `005971F0` 多候选 selector；
- `005963E0` 伤病等级；
- `00596480` 的1/7/12阈值原指令；
- 猛者候选/伤病等级；
- Vanilla/PS2/Wii等价性。

详见 `31-non-cavalry-casualty-sources.md`。

### 11. 地形伤害随机值（E17 主问题已闭合）

PC-PK1.1 的栈道/毒泉随机值已由地址参数 + 共用随机函数闭合：

```text
00472150 GetRandomX(X) = 0..X-1

栈道：
100 + GetRandomX(200)
= 100..299 / 每进入一格

毒泉：
200 + GetRandomX(200)
= 200..399 / 每进入一格
```

免伤：

```text
栈道：
踏破 -> 0
难所行军 -> 0

毒泉：
解毒 -> 0
```

旧“毒泉1000兵+气力-5”“栈道300～500”已撤回。

落石原地址参数：

```text
对部队：
base1500 / randomRange500

对建筑：
base800 / randomRange1000

踏破：
×0.1
```

当前直接还原为：

```text
部队1500..1999
建筑800..1799
踏破后部队约150..199
```

但由于同一逆向资料还列出“全陷阱共通基本伤害50”，而完整 trap finalizer 尚未文本化，所以落石保留一个**很小**的 exactness：该共通50是否在专用1500/800之外再次参与及整数顺序。

旧“落石1000～2000 + 30%混乱 + 踏破减半”全部撤回；当前没有可靠依据给落石固定混乱。

因此本项原“毒泉/栈道/落石随机值全部未知”从 open 移除。

仍 open：

- 落石 common-base50 finalizer；
- 落石多目标逐格结算顺序；
- 强制位移跨多格危险地形的逐 caller 顺序；
- Vanilla / PS2 / Wii 常量差异。

详见 `32-terrain-hazard-damage.md`。

### 12. 普通君主继承优先级（E18 主机制已闭合）

E18 已确认不能用一个统一排序函数处理所有君主死亡。

```text
历史事件命中
→ 事件脚本固定后继/分裂

玩家普通死亡
→ 玩家从合法候选中选择

COM普通死亡
→ 自动选择
```

COM 长期实测主顺序：

```text
血缘
>
义兄弟
>
配偶
>
年长者
```

“年长者”分支有多个反直觉案例支持：

- 吕布后王忠；
- 董卓/牛辅系后新近加入的韩遂；
- 刘琦亲族候选消失后黄忠。

这些结果与功绩/魅力/官职/仕官时间综合评分不符，因此旧 weighted fallback 撤回。

候选至少要求：

```text
存活
本势力
非敌方俘虏
```

原程序集中入口 `004B9080` 已定位，但函数体未公开展开，所以 COM 四层顺序仍是 `empirical-high`，不是源码级确认。

本项“普通继承完全无可靠规则”从 open 移除。

仍 open：

- 关系类别内部的精确排序；
- 同龄 tie-break；
- 出阵/任务状态过滤；
- `004B9080` 完整函数体；
- 零合法候选处理；
- 跨平台差异。

详见 `33-ruler-succession-priority.md`。

### 13. 评定完整提案池（E19 静态池已闭合）

原版完整 MSG 段 `msg2966~3288` 属于君主评定，并能枚举出22类具体案。

显示层方针：

```text
内政
出阵
外交・计略
```

MSG 层另把出阵话术分成：

```text
攻击
迎击
```

22类具体案：

```text
内政建设
征兵
生产兵装
巡查
训练
探索
登用
任命军师
撤除设施

侵略
迎击
军事建设

献上/亲善
同盟
破弃同盟
停战
劝降
交换俘虏
求援
二虎竞食
驱虎吞狼
流言
```

人物台词和 MSG 同时确认：

- 可以赞同已有方案；
- 可以采纳一个、部分、全部；
- 可以全部否决；
- 可以中止。

官方手册确认评定本身0金、0行动力、最多6人，且君主须在据点。

因此“完整提案类型池未知”从 open 移除。

仍 open 的不是 proposal type，而是：

- proposal chooser 原函数；
- 22类各自的评定专用 availability gate；
- 隐藏属性/五维是否及如何进入 chooser；
- 参与武将过滤；
- 多案执行顺序；
- 采纳案的资源/AP调用链；
- 跨平台差异。

详见 `34-council-proposal-pool.md`。

### 14. 委任 AI 权重（E20：统一权重表假设已撤回）

E20 已确认至少 PC-PK 战争/野外委任 AI 并不是一个：

```text
所有动作
→ 同一张utility表
→ 取最高分
```

的结构。

已恢复的模块：

```text
005EC370 AI军团部队循环
005DEF90 任务方针检查/改写
005DDCF0 包装
005AD980 共用野外行动器

005EF440 出兵策略
005F6470 AI兵粮规划
005F6CF0 主将局部评分
AI势力强度设定函数
```

出兵策略明确包含：

- hard gate；
- difficulty；
- 君主野望；
- StrategicTendency；
- 城市/目标状态；
- 概率层（最终5..100）；
- 最低5000兵；
- 80/90治安 gate；
- `travelTime*5+15` 粮 horizon；
- 50000携粮上限；
- 粮不足 abort；
- 普通携金独立概率；
- 兵器专用概率。

主将选择则是另一个局部 score 函数，包含适性、统武、兵装攻防、兵种相克和契合特技。

AI势力强度还存在君主ID硬编码 bonus，因此不能用一张现代通用 utility 表声称完全等价原版。

所以“委任 AI 的统一权重数字是什么”这个 open 问题从根上撤回。

真正仍 open 的是：

- 城市内政完整 scheduler；
- 出兵 raw probability 少量未命名局部变量；
- 80/90治安阈值 context；
- 运输 target/amount；
- 重视/普通/轻视/禁止精确阈值；
- 跨平台差异。

详见 `35-delegated-ai-architecture.md`。


## C. 规则明确但仍缺静态数据

1. 全地图六角坐标、地形、高度、城市归属。
2. 港关/堤防完整坐标及水攻覆盖格。
3. 各标准剧本完整初始状态。
4. 全历史事件结构化数据。**这已经不是资料缺失**：游民星空“全剧情发生条件官方资料”及日文 Wiki 已提供大量逐事件条件/结果，主要剩录入与版本核对。
5. 遗迹/庙候选点完整坐标（发现规则已解决）。
6. PK 能力研究：机制、次数、隐藏槽位规则已整理在 `15-pk-ability-research.md`；仅剩把官方/攻略图中的基础节点箭头完整转录为 JSON。

## D. 已不再属于 open 的项目

- 换季治安下降完整分布与 PK 政令整备 50% 免降判定（PC-PK1.1 原函数 `0058D6D0` 反汇编）

以下已从 provisional 升级：

- 委任/COM AI 的 procedural 架构、出兵 gate/概率与局部评分器（E20）
- 君主评定22类具体提案池与两阶段采决结构（E19）
- 普通君主继承：玩家手选、COM关系类别优先与年长者分支（E18）
- 地形伤害随机值：栈道/毒泉精确区间与落石专用参数（E17）
- 非骑兵武将伤亡来源分流、弩系狙伤与业火conditional casualty（E16）
- 单挑通用连续核心：actionRatio、命中/闪避/格挡、普通/必杀伤害与斗志增长（E14）
- 征兵数量与征兵治安下降公式（PC-PK1.1 confirmed-by-disassembly；Vanilla empirical-high）
- 行动力完整恢复公式（empirical-high；原版逆向 + PK 存档复算）
- 地形移动成本和战法地形限制
- 商人买卖核心公式
- PK内政设施/吸收合并
- 兵装生产量与兵器/舰船开发时间
- 粮尽逃兵公式
- 登用强制优先级
- 忠诚自然下降的触发条件
- 贼/异民族根城机制
- 自然灾害的机制边界
- 最终战斗伤害 PC-PK 逆向公式
- 战法会心率与部分战死/俘虏逆向概率
- 火伤计算主要规则
- 城陷落后设施保留数量
- 汉室态度/拥立废立忠诚变化
- 遗迹/庙发现与奖励
- 单挑方针/必杀核心数值
- 舌战手牌与再考
- PK人才府技巧研究固定-20日


### P0-59 event8/14监听缺口收窄

见[94-mission-event-listeners.md](94-mission-event-listeners.md)。004A8110/005B9D30的注册、copied-active顺序、live executing/mission、predicate与23/24 handler入口gate现已恢复并有独立有界模型。event8可取消mission23，event14可取消mission24；004BA1D0自身no-op不证明全事件无效果。成功tail采用source/stage/完整观察域before→after替换或原子reject，不要求callbacks非干预。原生完整presentation/return/递归事件、004EC870后置observer、新版本role/return组合和其他event ID仍open；clean stock/Vanilla/全局RNG/真实存档不因此关闭。


### P0-60通知/active-list/acted尾缺口收窄

见[95-mission-notification-tail.md](95-mission-notification-tail.md)。canonical005B81D0、两个handler入口/saved pointers及005B8400(actor,0)已知写序有独立模型；acted后manager dirty与可变observer先于live list append/duration，S2 query267仅wrapper路径。presentation、fullreturn、nonnull observer、patched query267保留精确stage可变观察或reject，不声称完整native闭包。下一步版本化return/role/event与004BBAA0后置observer组合；full force/empty legion/base destruction/stock/Vanilla仍open。


### P0-61单事务event8/14与已知handler/tail组合

[96-mission-event-composition.md](96-mission-event-composition.md)使用严格共享canonical frame、直接primitive adapters与单次原子提交，顺序执行004BBAA0→004A8110/predicate/handler/notification/return-tail→004BA1D0(8/14无操作)→fresh004EC870/非空observer。callStack绑定source/event/复制列表/visit/captured mission及saved current/target/raw44/home/distance；所有未知效果仍明确可变观察或整次reject，不默认非干预。旧API/trace不变；完整004BF6F0/list/role递归、empty-corps/force灭亡、base销毁、其他event IDs、stock/Vanilla与全局RNG继续open。


### P0-62原生return/list/role/event递归组合

[97-recursive-officer-return.md](97-recursive-officer-return.md)以扩展canonical frame执行return/list/stable-role及递归event8/14，只有一次revision提交。每层自己的event/actor/copied nodes/visits和native saved IDs保留，回调后按源重新读取live字段。移首节点/追加和count<2 sort闭合；非平凡sort、route、target-force及外部observer仍为精确stage-bound可变观察，不默认不干预。empty-force/corps和ruler ownership明确defer，递归/调用预算只是工程guard，不证明原作终止。完整sort内部、force/base/capture、其他event IDs、stock/Vanilla/全局RNG继续open。


### P0-63原生roster/role排序与source-separated capacity

[98-native-roster-sort.md](98-native-roster-sort.md)新增独立版本：固定roster参数(1,0,0,0)的virtual field0实际返回canonical person ID；按不同entry/pointer pivot身份执行两种quicksort及governor merge，保留比较调用序、相等项非稳定行为、两轮allocated过滤与clear/reappend。capacity的title/office/technique分支分别按S1/S2执行，query377/278为精确callStack/full-frame/RNG可变观察；saved left低16位、saved force pointer与后续live读取不混淆。canonical title/office的type15/16 validity固定true，person raw/status派生规则不变。旧API/trace不变；一般sort flags/vtable/分配失败、route/target-force、empty-corps/force灭亡、其他event/base/capture、stock/Vanilla与全局RNG继续open。


### P0-64原生任务route与目标势力闭合

[99-return-route-target-force.md](99-return-route-target-force.md)新增独立版本，直接执行005BA320任务分派/arg0与arg1/目标force君主live home/可选territory输出，以及00487EB0设施raw owner、领土city和canonical subtype势力链。两源地图byte分别固定，完整原生getter不再用whole-route/target-force观察；真实外部作用仍绑定full frame/callStack/RNG。新force rulerId和legion forceId与valid严格派生，旧API/trace不变。source未改表/固定vtable/不别名输出与可读map域明确；force灭亡/空军团/ruler/base/capture、其他event、stock/Vanilla/全局RNG仍open。


### P0-65空军团分派、合并与raw reset

[100-empty-legion-redistribution.md](100-empty-legion-redistribution.md)新增独立版本，展开空军团primary/nonprimary分派、source/destination合并方向、完整两次roster复制、live据点扫描与人员迁移调用、raw44-byte reset。primary fallback丢弃ordinal查找值而直接使用global ID2..8的原生控制流保留；nearest距离与S1/S2 RNG分开，S2三次共享页读要求逐调用观察。004AD550/004A8270仍是明确可变深层边界，force灭亡仍atomic defer；旧API、stock/Vanilla/全局RNG边界不变。


### P0-66据点归属、耐久与event9/10

[101-base-ownership-events.md](101-base-ownership-events.md)新增独立版本：在空军团merge中直接展开004AD550归属写、source分离耐久上限与有符号word裁剪、城市A4的bit0/1/4 dword重置，以及event9/10复制列表/predicate；保留saved locals与callback后的live读取。新触发的其余cancel handler、event9部队反应尾仍需精确可变观察或原子reject。旧API不变，004A8270/force/ruler/capture、其他event、stock/Vanilla和全局RNG继续open。


### P0-67武将迁移与固定参数移动准备

[102-officer-relocation.md](102-officer-relocation.md)新增独立版本，在P0-66共享frame中展开004A8270、allocated取消注册分派及固定参数004A7990。保留status2内嵌旧太守清理、ruler live判断、same-home不取消、away两处direct acted、保存distance低byte不复验写回与live governor刷新。004B40C0、其余cancel handler、真实troop成员/非base位置、event9部队反应、force灭亡和stock/Vanilla/全局RNG仍为明确观察或open。 坐标read-only query绑定source/person/live location/全before/stack；mutable fallback坐标06EE794C不能从IDB快照默认。所有未知可变作用仍需完整before→after/RNG或原子reject；工程预算不认证原作终止。


### P0-68 live零退款取消9/10/12/22

[103-live-zero-refund.md](103-live-zero-refund.md)在P0-67共享frame中直接执行mission9/10/12/22的gate与control，复用notification、零退款return、relocation和真实event分派；23/24维持既有原生实现。9/10仅target数值范围门并保留丢弃的force validity读取，12只构造target person pointer，22验证target force并保存actor color。四段presentation仍需完整before→after/RNG观察或原子reject；tail fresh读取actor，成功body固定return1。旧API、模型测试和raw来源字节不变。 仅这四个whole-handler观察被收窄；其他handler、非零退款/资源、presentation内部、tail距离观察、S2 effects/observer、完整004B40C0 ruler/capture、真实troop成员/非base位置、event9部队反应、force灭亡、未建模memory/platform域及全局RNG继续open。S1/S2仍为MOD-associated；相同selected bytes不认证clean-stock PK、Vanilla或console。上文旧版本说明保持其历史边界。
