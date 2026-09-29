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

`[COMMON][empirical-high]`

委任 AI 会自动执行内政、军备、搜索/登用、输送和按方针战争。

已观察到的稳定委任行为：

- 各城倾向至少建设：兵舍、锻冶、市场×3、农场×3。
- 空地不足时会自行拆设施以满足目标。
- 治安倾向维持在 80–90 左右。
- 兵装设为轻视时通常做到各约 15000。
- 士兵轻视时通常征到约 30000；若有输送设置则约留 20000，并把余量送往前线。
- 多城军团即使未明确设运输，也会向同军团更靠前线城市输送。
- PC 与 PS2 在“玩家能否用委任军团行动力直接下达某些命令”上有平台差异。

来源：https://w.atwiki.jp/sangokushi11/pages/74.html

这些是 AI 行为模板，不代表权重公式已逆向；第一版委任 AI 使用可解释 utility 权重，见 `16-unresolved-rules-fallbacks.md`。

## 6. 势力灭亡

最后据点失陷后：

- 势力状态结束。
- 君主/武将进入俘虏、在野、登用、处斩等结算。
- 外交关系清理。
- 城市与据点接管。

在外部队和资源转移的精确细节仍需实测。

## 7. 统一

控制全部有效都市并消灭其他势力后进入统一结局；具体结局分支可根据国号、汉室与军政结构进一步选择，但不影响“统一判定”本身。
