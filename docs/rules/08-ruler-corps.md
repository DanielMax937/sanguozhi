# 汉帝、爵位、君主继承、军团、势力灭亡与统一

## 1. 爵位与官职

爵位/官职基础表继续使用 `docs/sources/ranks.json`。爵位控制可授官职、指挥兵力与政治事件。

当前已核对城市门槛沿用 repo 数据：
无→州刺史→州牧→羽林中郎将→五官中郎将→大将军→大司马→公→王→皇帝。

黄巾势力按其特殊规则处理。

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

## 4. 君主继承

### 4.1 历史事件指定继承

`[confirmed as event data]`

历史死亡事件覆盖普通继承：

- 刘备：刘禅 > 刘封。
- 曹操：曹昂 > 曹丕 > 曹植 > 曹冲 > 曹彰。
- 连环计等事件有自己的分裂、后继与玩家选择逻辑。

来源：
- https://w.atwiki.jp/sangokushi11/pages/942.html
- https://w.atwiki.jp/sangokushi11/pages/100.html
- https://w.atwiki.jp/sangokushi11/pages/893.html

### 4.2 玩家普通继承

`[COMMON][empirical-high]`

历史事件不命中时，玩家君主死亡会弹出后继者选择，由玩家从合法候选中选新君主；并不强制儿子、亲族、功绩最高或能力最高。

刘备之死是很好的边界：满足历史事件时自动刘禅 > 刘封；条件不满足而普通死亡时玩家自行选择。

来源：
- https://gamefaqs.gamespot.com/boards/931351-romance-of-the-three-kingdoms-xi/45353339
- https://w.atwiki.jp/sangokushi11/pages/1952.html

### 4.3 COM 普通继承

`[COMMON][empirical-high]`

长期玩家实测总结为：

```text
血缘 > 义兄弟 > 配偶 > 年长者
```

没有上述关系时，COM 明显按年长者而不是功绩、魅力或官职选人。

当前实现：

```ts
blood = legal.filter(isBloodRelative)
if (blood.length) return eldestStable(blood)

sworn = legal.filter(isSwornSibling)
if (sworn.length) return eldestStable(sworn)

spouse = legal.filter(isSpouse)
if (spouse.length) return eldestStable(spouse)

return eldestStable(legal)
```

同关系组内“也按年龄”仍标 compatibility-assumption；同龄用 personId 做稳定 tie-break，仅为工程需要。

来源：
- https://w.atwiki.jp/sangokushi11/pages/1952.html
- https://w.atwiki.jp/sangokushi11/pages/1941.html
- https://w.atwiki.jp/sangokushi11/pages/2452.html
- https://w.atwiki.jp/sangokushi11/pages/2356.html

### 4.4 候选过滤

`[partial-known]`

至少排除死亡者、非本势力武将、敌方俘虏。亲族被俘后也会退出候选。

另有 PC 玩家记录：出阵部队中的武将没有出现在后继选择列表；该规则仍需最小存档回归，因此用 profile 开关处理。

### 4.5 继位后的忠诚

不要实现“选完后继者立即随机叛变”。更符合原作记录的结构是：新君主确立后，普通忠诚/相性系统改以新君主为基准，后续若忠诚继续下降才发生下野或被挖。

来源：
- https://w.atwiki.jp/sangokushi11/pages/1950.html
- https://w.atwiki.jp/sangokushi11/pages/2463.html

### 4.6 原程序入口

`[PC-PK1.1][reverse-engineered-partial]`

311MemoryResearch 的“禅让 DEMO”直接调用 `004B9080` 复用原版君主死亡消息/流程，说明原作有集中式后继处理入口；函数体尚未公开文本化。

来源：
- https://github.com/sjn4048/311MemoryResearch/blob/master/内存资料/新功能[禅让](DEMO).txt

## 5. 军团 / 委任

### 5.1 不是一张统一 utility 表

`[PC-PK1.1][reverse-engineered + empirical-high]`

AI 专题反汇编显示，委任逻辑由多个专用模块组成：城市维护、出兵、野外部队行动、主将/兵种选择、资源携带等，并不是“给所有命令一个统一分数后取最大值”。

因此旧的 `巡查100 / 征兵95 / 建设90 / 输送70...` 自拟表已删除。

### 5.2 委任野外战斗与 COM 共用核心

玩家委任部队与正常 COM 军团最终都会调用 `005AD980` 做野外部队行动；COM 路径会先经过 `005DEF90` 调整任务方针。

所以战争委任应复用同一战术 AI，不另写一套“玩家委任专用聪明AI”。

来源：
- https://github.com/sjn4048/311MemoryResearch/blob/master/内存资料/AI专题/函数[AI行动部队].txt
- https://w.atwiki.jp/sangokushi11/pages/74.html

### 5.3 内政/军备目标

`[COMMON][empirical-high]`

委任城市稳定追求：

- 市场×3、农场×3、兵舍×1、锻冶×1；
- 对应生产被允许时补厩舍/工房；
- 治安约80～90；
- 军团武将忠诚约96以上；
- 兵装轻视时各约15000；
- 士兵轻视时约30000；若设置输送则约留20000并发送余量；
- 多城军团会向同军团前线城市运输 surplus。

空地不够时 AI 会拆除其他设施以补齐基础模板。

来源：
- https://w.atwiki.jp/sangokushi11/pages/74.html
- https://www.gamersky.com/handbook/200706/66728.shtml

### 5.4 出兵倾向：难度 / 性格 / 野望 / 战略倾向

`[PC-PK1.1][reverse-engineered-partial]`

原版 `005EF440` 出兵策略中，初始概率为：

```ts
p = (difficulty + 3) * 5 * (personality + 2)

// ambition: 0..4
p = ambition === 0 ? trunc(p/3) :
    ambition === 1 ? trunc(p/2) :
    ambition === 2 ? p :
    ambition === 3 ? trunc(p*6/5) :
                     trunc(p*7/5)
```

`StrategicTendency` 为：

```text
0 全国统一
1 地方统一
2 州统一
3 现状维持
```

现状维持会把当前出兵倾向压到5；地方/州统一根据州域目标判定也可能压到5。随后还有目标/势力强度修正，最终 `clamp(5,100)` 后做概率判定。

因此超级难度与上级不是“完全相同AI只多资源”：同一 planner 架构下，难度直接影响出兵概率。

来源：
- https://github.com/sjn4048/311MemoryResearch/blob/master/内存资料/AI专题/函数[AI出兵策略].txt
- https://game.ali213.net/thread-6594040-1-6.html

### 5.5 出兵硬门槛/携带资源

`[PC-PK1.1][reverse-engineered]`

- 单支出征部队最低5000兵。
- 来源都市通常需治安>=90；弱势力分支放宽到>=80。
- 路程由 `005F6C90` 计算。
- 攻击携粮按 `移动旬数*5+15` 个旬的耗粮估算，最多携带50000粮；粮不足则放弃该队。
- 城市>=10000金时75%概率带1500～2000金；>=2000金时50%概率带1000金。
- 兵器部队不走普通携金逻辑。
- 非都市据点还会校验随队武将约8倍俸禄的资金储备。

SIRE 地址表已正式命名 `005F6470 ConsumptionCalculationUsedByAI` 和 `005DB840 GetExpeditionActionPointCost`。

来源：
- https://github.com/sjn4048/311MemoryResearch/blob/master/内存资料/AI专题/函数[AI出兵策略].txt
- https://github.com/sean2077/311SireCustomizedPackageDev/blob/dev/material/内存地址汇总.md
- https://www.xycq.org.cn/forum/thread-241027-1-1.html

### 5.6 AI 势力强度与主将评分

`[PC-PK1.1][reverse-engineered]`

势力基础强度先按：

```ts
ceil(totalGarrisonTroops / 10000) * 10
```

再叠加大量历史君主硬编码 bonus，并归一化成0～100的AI强度位置值；出兵逻辑会读取该值。SIRE v1.28 后来也开放了“AI强度可配置”。

出征主将/兵种则根据武力、统率、兵种适性、势力科技、兵装攻防、兵种克制和特技契合度评分；克制优势×1.3，劣势×0.7，契合特技按特技等级给攻防加分。

来源：
- https://github.com/sjn4048/311MemoryResearch/blob/master/内存资料/AI专题/函数[AI势力强度设定].txt
- https://github.com/sjn4048/311MemoryResearch/blob/master/内存资料/AI专题/函数[AI选择主将].txt
- https://game.ali213.net/thread-6379202-1-2.html

### 5.7 剩余未知

仍未完整逆出的主要是：

- 城市内政多个 deficit 同时存在时的精确优先顺序；
- 自动输送的目标选择/资源量函数；
- 出兵中 `005F6660 / 005F7BC0` 等目标修正函数完整语义；
- 各委任方针如何改变内部模块参数。

详细 fallback 与证据边界见 `16-unresolved-rules-fallbacks.md#14-委任-ai-权重`。

## 6. 势力灭亡

最后据点失陷后：

- 势力状态结束。
- 君主/武将进入俘虏、在野、登用、处斩等结算。
- 外交关系清理。
- 城市与据点接管。

在外部队和资源转移的精确细节仍需实测。

## 7. 统一

控制全部有效都市并消灭其他势力后进入统一结局；具体结局分支可根据国号、汉室与军政结构进一步选择，但不影响“统一判定”本身。
