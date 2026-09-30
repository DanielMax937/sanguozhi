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


## 5. 军团 / 委任

### 5.1 AI 结构

`[PC-PK1.1][reverse-engineered-partial]`

原版委任/COM AI 不是一个统一 utility 表，而是多个专用流程。战争侧已能定位：

- `005EF440` 出兵策略；
- `005EC370` AI军团部队循环；
- `005DEF90` 部队任务方针检查/改写；
- `005DDCF0 -> 005AD980` 部队实际行动决策；
- `005F6CF0` 出征主将评分；
- `005F6470` AI耗粮计算。

玩家点击“委任部队行动”也调用同一个 `005AD980`，说明至少野外战术行动核心与 COM 共用。

来源：
- https://github.com/sjn4048/311MemoryResearch/tree/master/内存资料/AI专题

### 5.2 出兵并非简单兵力比阈值

`005EF440` 会读取难度、君主野望、战略倾向、城市/目标态势、治安、兵力、兵粮、兵装和已有任务，最后把出兵概率 clamp 到5~100再随机。

战略倾向已识别为：全国统一 / 地方统一 / 州统一 / 安于现状。

同时确认：

- 计划兵力最低5000；
- 出兵城存在80/90治安门槛分支；
- 携粮按移动时间和兵力通过 `005F6470` 计算，主路径 horizon=`travelTime*5+15`；
- 单队携粮上限50000；
- 粮不够则直接取消该部队；
- 普通部队在城金>=10000时75%携1500~2000金；金>=2000时50%携1000金；
- 兵器选择还有独立概率偏好；
- 主将评分会考虑适性、武/统、兵装攻防、兵种相克、契合特技。

所以旧 `1.5/1.2/1.0` 出兵兵力比 fallback 已删除。

### 5.3 超级难度

社区 FAQ 的“AI几乎没变聪明”仍可作为总体体验描述，但不能解释为“difficulty 不进入决策”。出兵反汇编明确读取难度。

超级的主要强度仍来自资源补正：COM初始物资大增、收入+25%、征兵/兵装生产效果×2等。

来源：https://w.atwiki.jp/sangokushi11/pages/8.html

### 5.4 委任城市的稳定行为锚点

`[COMMON][empirical-high]`

- 强烈追求普通市场×3、普通农场×3，不足时会拆其他设施；
- 委任军团会褒赏武将，常补到忠诚96以上；
- 兵装轻视仍约做到各15000；
- 士兵轻视仍约征到30000；
- 有运输设置时约留20000兵，将余量运输；
- 多城军团会把资源往同军团更前线的城市移动。

来源：
- https://www.gamersky.com/handbook/200706/66728.shtml
- https://w.atwiki.jp/sangokushi11/pages/74.html
- https://w.atwiki.jp/sangokushi11/pages/1878.html

这些是稳定行为阈值，不代表城市内政 scheduler 已反汇编完成。

### 5.5 行动力

`[PC-PK1.1][reverse-engineered]`

`005B9340` 军团行动会调用 `004A1820` 消耗军团行动力；巡查、建设、征兵、生产等都有正常命令入口。因此委任 AI 不得绕过正常 AP / 资源 / 容量规则。

### 5.6 引擎 fallback

城市委任暂使用阶段式 policy：

```text
紧急防御/治安
→ 补3市3田
→ 褒赏
→ 按军备方针征兵/生产
→ 运输余量
→ 进入已逆出的 AI 出兵流程
```

而不是维护一张人为的 `action -> utility score` 总表。

完整证据与剩余 exactness 见 `16-unresolved-rules-fallbacks.md#14-委任-ai-权重`。

## 6. 势力灭亡

最后据点失陷后：

- 势力状态结束。
- 君主/武将进入俘虏、在野、登用、处斩等结算。
- 外交关系清理。
- 城市与据点接管。

在外部队和资源转移的精确细节仍需实测。

## 7. 统一

控制全部有效都市并消灭其他势力后进入统一结局；具体结局分支可根据国号、汉室与军政结构进一步选择，但不影响“统一判定”本身。
