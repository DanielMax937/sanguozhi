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

P0-3 专项见 `38-siege-capture-exactness.md`。

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
- 内政设施具体保留哪几座的 selector；
- 据点耐久接管时的所有重置路径；
- Vanilla/主机版差异。

状态：

```text
siege-call-chain-resolved
capture-resource-formula-resolved
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

- `004B1280` 捕获主公式、强运硬免疫、`00582BE0` 据点自然逃亡、`0058E510` 俘虏月度掉忠均沿用 D9 已恢复结论；
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

- 捕获前置 `004A0590` 精确语义；
- context id 3/4 的业务含义；
- 血路的路径/版本边界；
- `004721D0` 对 p>100 的语义；
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

### 6.4 部队能力合成剩余边界

E2 已恢复 `00496570` 主链，当前不再 open 的包括：嫌恶三pair hard override、统武vs智政魅分流、六适性取高、适性倍率、混乱0.8、输送0.4/1/3、精锐基础攻防+10与建设力 `政治*2/3+50`。

仍未知：

- `00495AB0` 完整逐指令文本，主要用于把血缘1/3、夫妻/义兄弟1从PS2 empirical-exact升级为PC逐指令；
- `00707A74 ConvertFloatToInteger` 对所有正小数边界的精确FPU rounding模式；
- Vanilla/主机版是否在混乱0.8与输送0.4/1/3上完全同常量。

### 6.6 训练 / 气力剩余边界

E4 已确认：

- `005C3F50` 单次训练闭式；
- 训练只看最多3名执行者武力；
- 据点兵力通过 `floor(T/2000)` 进入分母；
- 练兵所精确×1.5；
- 据点/部队气力上限100，熟练兵120；
- 训练AP 20，军事府10；
- 每名执行者武力经验+2、功绩+50；
- 技巧P = `floor(actualGain/2)+5`；
- 军乐台+10、诗想军乐台合计+20、奏乐无军乐台时+5；
- 扫荡/威风/昂扬/怒发主要气力常量。

仍未知：

- `005C4100` 完整训练资格gate；
- 据点“已训练”状态的完整重置caller；
- 军乐台/奏乐/诗想每旬处理主函数的完整逐指令文本；
- Vanilla/主机版训练公式与常量是否逐项一致。

旧“训练=5+统率×0.15”“城内自然每旬+5”“训练技巧P固定7～10”均不再作为 fallback。

### 6.7 兵粮消耗剩余边界

E5 已确认：

- 战斗部队 /10；
- 输送队 /20；
- 据点驻屯 /40；
- 港/关有屯田时0；
- 阵/砦/城塞原EXE倍率约为普通耗粮的5/6、2/3、1/2；
- 输送队不吃阵系减粮；
- 着火额外耗粮看当前存粮与政治；
- 兵力>0时最低耗粮1。

仍未知：

- `0049D180` 在多个不同等级阵系设施重叠时的优先级；
- `00707A74` 浮点转整数边界；
- 粮尽逃兵的PC-PK1.1原函数与闭式；
- Vanilla/主机版阵系常量是否完全一致。

旧攻略15%/30%/50%在PC-PK1.1 fidelity层不再作为精确常量；旧 `A*0.76^N` 粮尽逃兵仍保留为 empirical-high，而不是 reverse-engineered。

### 6.8 补给 / 输送剩余边界

E6 已确认或高置信：

- 输送到据点功绩+200，PC地址 `004BF522`；
- 野外补给功绩+100，率领输送队者统率经验+2；
- PC手动补给可任意调节数量；直接以目标部队为移动目标时自动补给；
- CS版不可自由调量；
- 枪/戟/弩/马补兵需要等量匹配兵装；
- 补兵受目标指挥上限与供应资源共同限制；
- 补兵后气力按新旧兵数加权；
- 军事府使输送AP减半；
- 到达据点必须进入据点自身兵/金/粮/兵装容量体系。

仍未知：

- PC-PK1.1 野外补给完整 finalizer；
- 输送抵达据点完整 finalizer；
- 12类运输兵装逐类型上限；
- 气力加权非整除时的整数化；
- 自动补给资源优先级；
- 据点或目标部队满仓时剩余货物如何处理；
- “输送队不可被补给”的PC hard gate；
- 被击破运输货物掠夺的原函数与比例；
- `005DB840` 基础AP完整函数。

CS版3000兵/1000金等固定补给数字只作为CS empirical-high，不进入PC主规则。

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

### 6.13 技巧研究时间剩余边界

E11 已确认：

- 超级研究时间在相关能力和70/140/210/280处分档；
- 能力和210、无人材府的30/40/60/90为一组实测锚点，但技巧系未注明；
- 人才府精确-20日，最低10日；
- 280+人才府Lv4=60日，因此同条件无人材府Lv4=80日；
- 攻略一般显示时间存在30/40/60/90与40/50/70/100两组，并明确“并非固定”。

仍未知：

- PC原研究时间函数；
- 超级完整5档×技巧矩阵；
- 初级/上级；
- 基础时间是否来自技巧数据字段；
- 属性读取Basic/Actual哪层；
- 阈值比较符；
- Vanilla/主机版。

禁止用线性插值把未知矩阵填满。

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
