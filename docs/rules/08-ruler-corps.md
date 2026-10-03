# 汉帝、爵位、君主继承、军团、势力灭亡与统一

## 1. 爵位与官职

普通势力的爵位/官职静态表使用 `docs/sources/ranks.json`，D10 的完整数据结构与自动封官算法见 `03-personnel.md#10-官职`。

### 1.1 爵位都市门槛

| 爵位 | 指挥兵数 | 条件 |
|---|---:|---:|
| 皇帝 | 15000 | 24都市以上，并满足汉帝条件 |
| 王 | 14000 | 20都市以上 |
| 公 | 14000 | 18都市以上 |
| 大司马 | 13000 | 14都市以上 |
| 大将军 | 13000 | 12都市以上 |
| 五官中郎将 | 12000 | 8都市以上 |
| 羽林中郎将 | 12000 | 6都市以上 |
| 州牧 | 11000 | 4都市以上 |
| 州刺史 | 11000 | 2都市以上 |
| 无 | 10000 | 仅1都市 |

旧 `ranks.json` 把“无爵位”写成 `citiesRequired=0`，D10 已按原表修正为1。

爵位越高，开放的官职层级越高；普通武将仍需满足对应功绩门槛。

### 1.2 黄巾是势力特例，不套普通爵位/官职表

日文资料明确黄巾势力没有普通爵位、不能给普通官职，但其可指挥兵数有专用规则。因此实现时应放在 force-profile 特例，而不是给黄巾武将伪造某个 OfficeID。

普通势力的官职、功绩、军制改革和自动封官规则见 D10。

## 2. 汉室态度与授爵/自称

`[COMMON][empirical-high]`

武将隐藏属性“汉室”分：重视、普通、无视。

爵位**由汉帝授予**与**势力自称**时的忠诚变化：

| 汉室态度 | 授予 | 自称 |
|---|---:|---:|
| 普通 | +3 | +3 |
| 重视 | +6 | +1 |
| 无视 | +1 | +6 |

- 公/王：上述变化 ×2。
- 皇帝：×3。

来源：https://w.atwiki.jp/sangokushi11/pages/983.html

## 3. 拥立 / 废立

`[COMMON][empirical-high]`

占领汉帝所在城市时可触发拥立/废立选择：

- 拥立：汉室重视武将忠诚 **+10**。
- 废立：汉室重视武将忠诚 **-10**。
- 汉室无视的 COM 君主占领汉帝所在城市时倾向/会选择废立。
- 汉帝存在时，称帝路径与是否拥立汉帝有关；汉帝被废/不存在后规则会改变。

来源：https://w.atwiki.jp/sangokushi11/pages/983.html

汉帝援助等事件有独立日期、城市数、金、汉室态度等条件，应放事件数据，不硬编码进爵位函数。

## 4. 君主继承（E18）

E18 已把继承拆成三条不同路径：

```text
历史事件
→ 事件自己的固定后继 / 分裂脚本

玩家普通死亡
→ 玩家自行选择合法后继者

COM普通死亡
→ 自动选择
```

完整证据矩阵见 `33-ruler-succession-priority.md`。

### 4.1 历史事件指定继承

`[confirmed as event data]`

历史死亡事件覆盖普通继承。

例如：

```text
刘备：
刘禅 > 刘封

曹操：
曹昂 > 曹丕 > 曹植 > 曹冲 > 曹彰
```

连环计等事件还会同时处理分裂势力、迁都与玩家继续控制哪一方，不能反推出一般 successor selector。

来源：
- https://w.atwiki.jp/sangokushi11/pages/942.html
- https://w.atwiki.jp/sangokushi11/pages/21.html
- https://w.atwiki.jp/sangokushi11/pages/893.html

### 4.2 玩家普通继承

`[COMMON][empirical-high]`

历史事件不命中时，玩家君主死亡会弹出后继者选择，由玩家从合法候选中自行选择。

刘备之死是最强边界案例：

```text
事件条件满足
→ 刘禅 > 刘封自动继承

事件条件未满足而刘备普通死亡
→ 玩家可以选择后继
```

所以玩家普通死亡不存在“系统自动按血缘/功绩/魅力排序”的规则。

来源：
- https://w.atwiki.jp/sangokushi11/pages/1952.html
- https://w.atwiki.jp/sangokushi11/pages/942.html

### 4.3 COM 普通继承

`[COMMON][empirical-high]`

长期实测主顺序：

```text
血缘
>
义兄弟
>
配偶
>
无上述关系时的年长者
```

这与多个反直觉案例一致：

- 吕布无可用血缘后出现王忠继位；
- 董卓/牛辅系后，刚加入不久但年长的韩遂可继位；
- 刘琦亲族候选死亡/被俘后，出现黄忠继位。

因此旧：

```text
功绩最高
魅力最高
官职最高
仕官时间最长
```

不作为 fidelity 主排序。

来源：
- https://w.atwiki.jp/sangokushi11/pages/1952.html
- https://w.atwiki.jp/sangokushi11/pages/1941.html
- https://w.atwiki.jp/sangokushi11/pages/2356.html

### 4.4 COM 实现边界

真正有高置信证据的是：

```text
类别优先：
blood > sworn > spouse > ordinary

ordinary 组：
年长者优先
```

当前还没有证据证明：

```text
两个血缘候选之间
两个义兄弟之间
多个配偶候选之间
```

也一定按年龄。

因此不要把旧实现：

```ts
if (blood.length) return eldestStable(blood)
if (sworn.length) return eldestStable(sworn)
if (spouse.length) return eldestStable(spouse)
```

误写成原版 confirmed。

允许的兼容实现：

```ts
categoryPriority =
  blood > sworn > spouse > ordinary

withinCategoryFallback =
  birthYearAscending
  then personIdAscending
```

但其中：

```text
关系组内按年龄
同龄personId
```

都只是 engine deterministic fallback。

### 4.5 候选过滤

`[partial-known]`

至少确认：

```text
存活
属于当前势力
不是敌方俘虏
```

被敌方俘虏的亲族即使仍存活，也会退出普通后继候选。

出阵部队成员、执行任务中的武将是否全部排除，当前只有个案证据，继续 open。

来源：
- https://w.atwiki.jp/sangokushi11/pages/2356.html

### 4.6 原程序入口

`[PC-PK1.1][reverse-engineered-partial]`

311MemoryResearch 的“禅让 DEMO”直接调用：

```asm
push 0
push 0
push forcePtr
mov ecx, 755895C
call 4B9080
```

并备注该调用目前会使用“君主死亡”的 MSG。

因此原作存在集中式君主死亡/后继处理入口 `004B9080`。

但公开资料没有该函数完整函数体，所以：

```text
COM 血缘>义兄弟>配偶>年长者
= empirical-high
```

不是 disassembly-confirmed。

来源：
- https://github.com/sjn4048/311MemoryResearch/blob/master/内存资料/新功能[禅让](DEMO).txt

### 4.6.1 继位后的忠诚

不要额外制造：

```text
君主死亡
→ 部下立即随机叛变
```

当前结构：

```text
确定后继
→ force.lord切换
→ 后续忠诚系统改以新君主为基准
→ 正常掉忠 / 下野 / 被挖继续
```

### 4.6.2 剩余 exactness

- 血缘组内部精确顺序；
- 义兄弟组内部精确顺序；
- 同龄 tie-break；
- 出阵/任务状态 candidate gate；
- `004B9080` 完整函数体；
- 零合法候选时的势力结束流程；
- 各平台/版本差异。

## 4.7 都督 / 太守 / 军师的层级关系

`[COMMON/PK][reverse-engineered structure + empirical-high selection]`

三个角色属于不同层级：

```text
势力：AdvisorID      -> 军师
军团：CorpsLeaderID  -> 都督/军团长
据点：PrefectID      -> 太守
```

第一军团由君主承担 leader 语义；委任军团使用各自都督。C9 行动力恢复中，第一军团使用君主 `max(统率,魅力)`，委任军团用都督替换君主；军师倍率则因 `AdvisorID` 属于势力而被所有军团共享。

太守/都督正常玩法不能直接点名任命；自动选择以可指挥兵数为主、同值统率优先，并存在有官职者相对无官职者的优先边界。军师则可直接任免，官方门槛智力>=70。

不要把“太守/都督自动任命”与军团委任 AI 混成同一个 selector；前者是岗位归属，后者是已任命军团的行动决策。## 4.8 评定（E19）

E19 已恢复君主评定的**静态提案池**，但 proposal chooser 仍未逆向。

官方手册确认：

~~~text
评定本身：
金钱 0
行动力 0
期间 无
最多6人参加
君主必须在据点
~~~

原版完整 MSG 段 msg2966~3288 明确属于“君主评定”。

评定分两阶段：

~~~text
方针提案
→ 君主采决
→ 具体案提案
→ 君主采决
→ 执行采纳案
~~~

显示层方针为：

~~~text
内政
出阵
外交・计略
~~~

而 MSG 话术层把“出阵”继续拆成“攻击 / 迎击”。

具体案固定22类：

~~~text
内政/人事/城市：
内政建设、征兵、生产兵装、巡查、训练、
探索、登用、任命军师、撤除设施

军事：
侵略、迎击、军事建设

外交・计略：
献上/亲善、同盟、破弃同盟、停战、劝降、
交换俘虏、求援、二虎竞食、驱虎吞狼、流言
~~~

原版还明确支持：

~~~text
赞同他人
只采纳一个
采纳部分
全部采纳
全部否决
中止评定
~~~

因此参与者不一定每人都生成一个不同新案，采决也不是单选。

旧 proposal pool 中的：

~~~text
技巧研究
输送
褒赏
~~~

没有出现在专用评定 MSG 类型中；当前 fidelity pool 删除这三类。

2006同期技巧P资料记录：

~~~text
评定 +10P
~~~

该值标 empirical-high，不是反汇编确认。

仍 open：

- proposal chooser 原函数和权重；
- 战略倾向、地域执着、性格、五维是否进入 chooser；
- proposal-specific 额外 gate；
- 参与武将完整过滤；
- 多案执行顺序；
- 采纳案实际 AP/金钱/物资调用链；
- 跨平台差异。

完整规则见 `34-council-proposal-pool.md`。


## 5. 军团 / 委任（E20）

E20 的核心结论：

> 原版 PC-PK 委任/COM AI 不是“一张全局 action→utility 权重表”。

已经恢复的战争与野外行动部分是：

```text
筛选 / hard gate
→ 局势判断
→ 难度 / 野望 / 战略倾向
→ 概率
→ 兵力 / 兵粮 / 金钱
→ 兵装 roll
→ 主将局部评分
→ 创建部队
→ 共用野外 tactical executor
```

完整专项见 `35-delegated-ai-architecture.md`。

### 5.1 玩家委任野外部队与 COM 共用 tactical core

玩家点击委任部队行动：

```text
005746A0
→ 00572890 状态检查
→ 005AD980
```

COM 军团：

```text
005EC370
→ 005DEF90 任务方针检查/改写
→ 005DDCF0
→ 005AD980
```

因此至少野外实际行动器 `005AD980` 是共用的。

### 5.2 出兵策略 005EF440：不是简单兵力比

`005EF440` 明确读取：

- difficulty；
- 君主野望；
- StrategicTendency；
- 城市/目标 AI 状态；
- 治安；
- 兵力；
- 兵粮；
- 兵装；
- 已有任务/部队；
- 目标移动旬数。

最终出兵概率：

```ts
p = clamp(rawProbability, 5, 100)

if (!ProbabilityCheck(p))
  abort
```

但5%下限只适用于已经通过前置 hard gate 的路径；前置资源/合法性失败仍可直接0%。

战略倾向：

```text
0 全国统一
1 地方统一
2 州统一
3 安于现状
```

注意：E19 中“尚未证明 StrategicTendency 进入评定 proposal chooser”，不等于这个字段不被 AI 使用；E20 已确认它进入战争出兵逻辑。

### 5.3 硬 gate

已确认：

```text
计划兵力最低5000
治安存在80/90阈值分支
粮不足直接取消
兵装不足可取消
城市可抽调兵力不足可取消
```

旧：

```text
攻击1.0 / 标准1.2 / 防守1.5兵力比
```

不采用。

80还是90由哪个 context flag 决定仍 open。

### 5.4 兵粮

主出兵路径：

```text
foodHorizon =
  travelTime * 5 + 15

005F6470
→ 计算计划兵粮

携粮上限50000
如果最终可带粮 < requiredFood
→ abort
```

### 5.5 携金

普通非兵器部队：

```ts
if (city.gold >= 10000) {
  75%:
    1500..2000
}
else if (city.gold >= 2000) {
  50%:
    1000
}
```

其中1500..2000来自：

```text
(15 + GetRandomX(6)) * 100
```

兵器部队跳过普通携金段。

港/关另有：

```text
城内金 >= 出征武将俸禄合计 ×8
```

的 gate。

### 5.6 兵器选择

出兵编成中：

```text
冲车：90%
井阑 / 木兽 / 投石：80%
```

其他分支依据性格/局部状态计算后 clamp 到30..70。

这是编成 roll，不是战法命中率。

### 5.7 主将局部评分：005F6CF0

原 AI 并非“不评分”；而是不同 selector 有自己的局部分数。

先：

```text
Q = 兵种适性 + 势力技巧修正 + 7
```

攻击侧大体链：

```text
Q × 武力 × 兵装攻击
→ 整数缩放
→ ×2000
→ + commonOffset
```

防御侧：

```text
Q × 统率 × 兵装防御
→ 整数缩放
→ ×1000
→ + commonOffset
```

枪/戟/骑相克：

```text
优势 ×1.3
劣势 ×0.7
```

契合特技：

```text
攻击score += 特技等级×1000
防御score += 特技等级×1000
```

commonOffset 的业务含义继续 open。

### 5.8 AI 势力强度还有君主硬编码

基础：

```ts
baseStrength =
  ceil(totalGarrisonTroops / 10000) * 10
```

随后原码按君主 ID 加大量 bonus，例如：

```text
曹操/孙策/曹睿/曹丕/刘备 +2000
孙坚/孙权                 +1900
诸葛亮/周瑜/曹彰/司马懿   +1800
董卓/吕布                 +1700
张角/袁绍                 +1600
马超/公孙瓒               +1500
...
```

另有弱势君主特殊分支。

所以 fidelity AI 不是“纯资源理性 optimizer”。

### 5.9 城市委任内政仍是 E20 的主要 open

目前没有恢复出与战争 AI 同等完整的城市内政 scheduler：

```text
建设
巡查
征兵
训练
生产
褒赏
搜索
登用
运输
```

之间的完整原始执行顺序/选择函数。

长期稳定行为锚点：

- 普通市场至少3；
- 普通农场至少3；
- 兵舍/锻冶等按方针补齐；
- 治安维持80以上、常在90附近；
- 兵装轻视仍约各15000；
- 士兵轻视仍约30000；
- 运输时约留20000兵；
- 会往同军团前线输送；
- 会主动褒赏，常补忠诚到约96。

这些仍标 `empirical-high`，不是 internal weights。

### 5.10 AP / 普通资源路径

逆向地址：

```text
004A1820 军团行动力增减
005B9340 军团行动
005CBF95 巡查
005BC4C1 内政建设
005C3CAB 征兵
005C67B3 生产
005D8F68 技巧研究
```

委任 AI 不能绕过 AP、金、粮、容量等正常硬约束。

### 5.11 推荐引擎 fallback

不再维护：

```ts
actionWeights = {...}
maxBy(actionWeights)
```

改为阶段式：

```text
紧急防御/治安
→ 城市维护
→ 武将维护
→ 军备
→ 运输
→ 逆向出兵 pipeline
→ 005AD980 野外行动
```

战争部分按已逆出的 procedural 规则；城市部分明确标 compatibility policy。

### 5.12 剩余 exactness

- 城市内政完整 scheduler；
- `005EF440` 少数未命名局部变量；
- 80/90治安 gate 的 context 语义；
- 完整运输 target/amount；
- 重视/普通/轻视/禁止的内部精确阈值；
- 势力强度弱势君主特殊分支；
- Vanilla / PS2 / Wii 差异。


## 6. 势力灭亡

最后据点失陷后：

- 势力状态结束。
- 君主/武将进入俘虏、在野、登用、处斩等结算。
- 外交关系清理。
- 城市与据点接管。

在外部队和资源转移的精确细节仍需实测。

## 7. 统一

控制全部有效都市并消灭其他势力后进入统一结局；具体结局分支可根据国号、汉室与军政结构进一步选择，但不影响“统一判定”本身。
