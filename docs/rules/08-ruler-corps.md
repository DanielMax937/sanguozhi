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
