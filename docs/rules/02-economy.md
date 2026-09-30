# 经济、内政设施、商人、行动力、灾害

## 1. 金钱收入完整公式

`[PC-PK1.1][reverse-engineered]`

### 1.1 城市原始月收入 M

原函数：

```text
0049E590 GetCityMoneyIncome
```

先校验城市必须属于有效势力（ForceID 0..46）；空白/无所属城市直接返回 0。

原始结构字段：

```text
struct_city + 0x7E = BaseMoneyProduction
```

即城市自己的基础金收入。

当前 `docs/sources/cities.json.gold` 就是上级难度、治安100、无市场设施时对应的这项基准值。例如：

- 襄平 400
- 北平 500
- 洛阳 700

### 1.2 市场类设施产量

原函数最多遍历城市 30 个内政用地，只有以下市场类设施计入金收入：

| 设施 | 原始产量 |
|---|---:|
| 市场 Lv1 | 100 |
| 市场 Lv2 | 120 |
| 市场 Lv3 | 150 |
| 鱼市场 | 200 |
| 大市场 | 300 |
| 黑市 | 80 |

这些是进入难度/治安修正**之前**的原始产量。

日文 Wiki 的上级表与原结构逻辑一致：上级、治安100时这些值直接显示为收入；初级/超级随后再走难度倍率。citeturn140058search1turn140058search5

### 1.3 造币厂只加成普通市场 Lv1/2/3

原函数在设施类型分支中只对：

```text
市场 Lv1
市场 Lv2
市场 Lv3
```

检查周围一格是否存在造币厂。

命中后：

```ts
effectiveMarketYield = floor(baseMarketYield * 3 / 2)
```

因此：

| 市场 | 无造币 | 有造币 |
|---|---:|---:|
| Lv1 | 100 | 150 |
| Lv2 | 120 | 180 |
| Lv3 | 150 | 225 |

而下面三类**不会**吃造币厂：

```text
鱼市场
大市场
黑市
```

这不是经验推断，而是 `0049E63A-0049E64E` 的设施类型分支直接决定的。日文 Wiki 的设施表也明确记录同样结果。citeturn140058search1

多个造币厂也不会继续叠加，因为原函数只调用“周围是否存在指定设施”的布尔检查，而不是统计数量。

### 1.4 市场合并建设中的收入

原函数对正在吸收合并、尚未完成的市场特殊处理：

```text
市场 Lv2 未完成
→ 按 Lv1 计算

市场 Lv3 未完成
→ 按 Lv2 计算
```

因此合并期间并不是 0 收入，而是继续保留前一级效果；造币判定也按降级后的市场类型继续执行。

长期玩家实测也确认吸收建设过程中保留前一级收入。citeturn179254search6

### 1.5 城市设施加总

定义：

```ts
rawMoney =
  city.baseMoneyProduction
  + Σ(effectiveMoneyFacilityYield)
```

其中：

```text
effectiveMoneyFacilityYield =
  市场Lv1/2/3：按造币邻接后值
  鱼市场：200
  大市场：300
  黑市：80
```

非市场类内政设施在此函数中不增加金收入。

### 1.6 难度修正

原函数随后进入难度分支。

令：

```ts
difficultyPercent =
  EASY          ? 125 :
  NORMAL        ? 100 :
  SUPER_PLAYER  ?  75 :
  SUPER_AI      ? 125 :
                  100
```

即：

| 难度 | 玩家 | AI |
|---|---:|---:|
| 初级 | 125% | 125% |
| 上级 | 100% | 100% |
| 超级 | 75% | 125% |

### 1.7 治安修正

难度之后读取：

```text
city.security
```

并先做：

```ts
effectiveSecurity = max(city.security, 50)
```

因此治安 0～49 在收入公式中都按 50 处理；50～100 线性变化。

### 1.8 普通月收入的精确闭式

对非负整数收入，原汇编的多次整数乘除可化简为：

```ts
M = floor(
  rawMoney
  * difficultyPercent
  * max(security, 50)
  / 10000
)
```

这就是 `0049E590 GetCityMoneyIncome` 的返回值。

顺序语义：

```text
城市基础值
+ 市场类设施
+ 造币厂对普通市场的1.5倍
↓
难度
↓
治安（最低按50）
↓
得到 M
```

所以不要把难度或治安只乘在“城市基础收入”上；它们作用于**基础值+所有市场类设施产量的合计**。

### 1.9 Golden tests

#### 洛阳，上级，治安100，无市场

```text
rawMoney = 700
M = floor(700 × 100 × 100 / 10000)
  = 700
```

#### 洛阳，上级，治安100，1个 Lv1 市场 + 造币

```text
rawMoney = 700 + 150 = 850
M = 850
```

#### 同样配置，超级玩家

```text
M = floor(850 × 75 × 100 / 10000)
  = 637
```

#### 同样配置，超级玩家，治安80

```text
M = floor(850 × 75 × 80 / 10000)
  = 510
```

### 1.10 每月1日：征税 / 富豪如何叠加

`00590490 MonthlyIncomeAndExpend` 先取得上面的 `M`。

若没有征税：

```ts
monthStartBase = M
```

若城市有征税：

```ts
monthStartBase = floor(M / 2)
```

城市先收到：

```text
monthStartBase
```

若同城有富豪，再额外收到：

```ts
floor(monthStartBase / 2)
```

所以月初：

```ts
cityMonthStartIncome =
  monthStartBase
  + (hasWealthy ? floor(monthStartBase / 2) : 0)
```

### 1.11 每月11日 / 21日：只有征税额外触发

原函数：

```text
00599600 每旬有征税的情况下收获金钱
```

在月初直接退出，只处理 11 日和 21 日。

如果城市没有征税：

```text
收入 = 0
```

如果有征税：

```ts
income = floor(M / 2)
```

而**富豪不会在11日/21日再次触发**。

这就精确解释了为什么：

```text
征税单独：
0.5 + 0.5 + 0.5 = 1.5倍

富豪单独：
1.5倍

富豪 + 征税：
月初 0.5 × 1.5 = 0.75
11日 0.5
21日 0.5
总计约 1.75倍
```

日文 Wiki 对这点也明确写成 `1.5×0.5+0.5+0.5=1.75`。citeturn179254search1

注意由于每次 tick 独立做整数除法，精确值不是浮点倍率。

### 1.12 城市整月精确公式

令：

```ts
H = floor(M / 2)
```

则：

#### 无特技

```ts
monthly = M
```

#### 只有富豪

```ts
monthly = M + floor(M / 2)
```

#### 只有征税

```ts
monthly = 3 * H
```

#### 富豪 + 征税

```ts
monthly =
  3 * H
  + floor(H / 2)
```

因此“1.5倍 / 1.75倍”只是连续数值近似；奇数收入时会因为逐旬取整略低。

### 1.13 港 / 关金收入

港关没有自己独立的基础金产值。

母城本次先得到：

```text
cityTickBase
```

然后对该城静态下属的每个港/关：

1. 检查港关当前 `ForceID`；
2. 检查母城当前 `ForceID`；
3. 不同势力 → 本次该港关无附属金收入；
4. 同势力 → 取得母城当前 base tick 的 20%。

精确：

```ts
portBase = floor(cityTickBase / 5)
```

月初若母城有富豪，港关也额外得到：

```ts
floor(portBase / 2)
```

这里使用的是**母城的富豪特技判定**；不是要求港关自己驻有富豪武将。

11日 / 21日征税 tick：

```ts
cityTickBase = floor(M / 2)
portIncome = floor(cityTickBase / 5)
```

富豪同样不在这两旬触发。

### 1.14 每个港关整月精确公式

无征税时令：

```ts
P = floor(M / 5)
```

#### 无特技

```ts
monthlyPort = P
```

#### 只有富豪

```ts
monthlyPort = P + floor(P / 2)
```

有征税时令：

```ts
H = floor(M / 2)
Q = floor(H / 5)
```

#### 只有征税

```ts
monthlyPort = 3 * Q
```

#### 富豪 + 征税

```ts
monthlyPort =
  3 * Q
  + floor(Q / 2)
```

前提始终是港关与母城当前属于同一势力。

### 1.15 收入与支出的顺序

月初 `00590490` 内：

```text
城市金收入
→ 城市粮收入
→ 季初自然治安下降
→ 港关钱粮收入
→ 俘虏费用
→ 武将俸禄
→ 金钱不足后果
```

所以本月金收入使用的是**治安下降前**的治安值。

### 1.16 C1 当前结论

本项已经可以标：

```text
PC-PK1.1 reverse-engineered
```

已经锁定：

- 城市基础金字段；
- 所有原作市场类收入设施；
- 造币厂适用对象与1.5倍；
- 市场合并中前一级收入保留；
- 难度倍率；
- 治安下限50与线性倍率；
- 精确普通月收入闭式；
- 征税三旬 tick；
- 富豪只在月初生效；
- 富豪+征税精确 1.75 倍结构；
- 港关20%与同势力条件；
- 港关的富豪/征税整数顺序。

来源：
- 311MemoryResearch `整理/Func-收支04-计算城市收钱.txt`
- 311MemoryResearch `整理/Func-收支01-每旬收钱.txt`
- 311MemoryResearch `整理/Func-收支03-每月钱粮兵装收支.txt`
- 311MemoryResearch `整理/Func-收支07-计算城市、港、关金钱收入.txt`
- https://w.atwiki.jp/sangokushi11/pages/74.html
- https://w.atwiki.jp/sangokushi11/pages/13.html
- https://game.ali213.net/forum.php?mod=viewthread&tid=1075291

## 2. 粮食收入完整公式

`[PC-PK1.1][reverse-engineered]`

### 2.1 城市原始季度粮收入 F0

原函数：

```text
0049E810 计算城市收粮
```

城市静态字段：

```text
struct_city + 0x80 = BaseFoodProduction
```

当前 `docs/sources/cities.json.food` 对应的就是这项城市基础季度粮收入。例如：

- 洛阳 4000
- 许昌 5000
- 成都 8000
- 建业 8000

### 2.2 农场 / 谷仓

原版农场基础产量：

| 设施 | 基础季度粮 |
|---|---:|
| 农场 Lv1 | 1500 |
| 农场 Lv2 | 1800 |
| 农场 Lv3 | 2250 |

谷仓只对相邻一格的普通农场 Lv1/2/3 生效：

```ts
effectiveFarmYield = floor(baseFarmYield * 3 / 2)
```

因此：

| 农场 | 无谷仓 | 有谷仓 |
|---|---:|---:|
| Lv1 | 1500 | 2250 |
| Lv2 | 1800 | 2700 |
| Lv3 | 2250 | 3375 |

多个谷仓不会重复叠加；原函数只做“周围是否存在谷仓”的布尔判断。

### 2.3 军屯农不吃谷仓

`[PC-PK1.1][reverse-engineered]`

军屯农在设施类型分支中会直接跳到自己的兵力公式，**不会进入谷仓邻接加成分支**。

原函数等价为：

```ts
militaryFarmYield =
  floor(
    max(city.troops, 15000)
    * 1500
    / 15000
  )
```

即：

```ts
militaryFarmYield =
  floor(max(city.troops, 15000) / 10)
```

所以：

- 0～14999兵：固定1500；
- 15000兵：1500；
- 20000兵：2000；
- 30000兵：3000；
- 100000兵：10000；
- 150000兵：15000。

这与长期实测“兵力一成、15000以下固定1500”完全一致。

### 2.4 农场合并建设中的收入

和市场完全同型：

```text
农场 Lv2 未完成
→ 按 Lv1 计算

农场 Lv3 未完成
→ 按 Lv2 计算
```

所以吸收合并期间继续保留前一级产粮，而不是暂时归零。

### 2.5 原始设施加总

定义：

```ts
rawFood =
  city.BaseFoodProduction
  + Σ(effectiveFarmYield)
  + Σ(militaryFarmYield)
```

在原版规则下军屯农通常一城只能建一个，但公式本身按遍历到的设施累加。

### 2.6 难度修正

`0049E810` 随后应用难度：

```ts
difficultyAdjustedFood =
  EASY
    ? ConvertFloatToInteger(rawFood * 1.25)
    : NORMAL
      ? rawFood
      : SUPER_PLAYER
        ? floor(rawFood * 75 / 100)
        : SUPER_AI
          ? floor(rawFood * 125 / 100)
          : rawFood
```

其中 `00707A74 ConvertFloatToInteger` 是原程序自己的浮点转整数 helper。为了做到逐点一致，Easy 分支最好保留这个 helper 语义，不要擅自改成 JS 的 `Math.round`。

### 2.7 治安修正

和金收入一致：

```ts
effectiveSecurity = max(city.security, 50)

F = floor(
  difficultyAdjustedFood
  * effectiveSecurity
  / 100
)
```

这里的 `F` 就是：

> 当前城市在“本次粮食收入 tick”进入丰作 / 征收 / 米道之前的基础粮收入。

所以治安低于50时一律按50计算。

### 2.8 主公式顺序

```text
城市基础粮
+ 普通农场
+ 谷仓对普通农场的1.5倍
+ 军屯农（兵力/10，最低1500）
↓
难度
↓
治安（最低50）
↓
F
↓
丰作
↓
征收
↓
米道（城市仅季初）
↓
实际入账
```

### 2.9 正常季初收入

没有征收时，只有：

```text
1 / 4 / 7 / 10 月 1 日
```

才进入粮食结算。

令：

```ts
G =
  hasHarvest
    ? floor(F * 3 / 2)
    : F
```

则普通季初：

```ts
cityBaseTick = G
```

若有米道：

```ts
cityQuarterStartIncome =
  G + floor(G / 2)
```

否则：

```ts
cityQuarterStartIncome = G
```

### 2.10 征收：每月都结一次“半份季度粮”

有征收时，不再要求季初；每个月1日都会结算。

每个结算月先算丰作，再减半：

```ts
G =
  hasHarvest
    ? floor(F * 3 / 2)
    : F

H = floor(G / 2)
```

然后：

```ts
cityBaseTick = H
```

所以无丰作时，一个季度：

```ts
3 * floor(F / 2)
```

约等于普通季度粮的150%。

### 2.11 米道 + 征收：城市只在季初再加50%

城市本体有一个明确的“是否季度初”检查。

因此：

#### 季初月

```ts
income =
  H + floor(H / 2)
```

#### 季度第2、3个月

```ts
income = H
```

所以一个季度：

```ts
cityQuarter =
  3 * H
  + floor(H / 2)
```

在无丰作、忽略取整时约为：

```text
1.75 × F
```

这正是长期攻略所说的“米道+征收≈1.75倍”。

### 2.12 丰作与征收的运算顺序

源码顺序明确：

```text
F
↓
丰作 ×1.5
↓
征收 ÷2
↓
米道（若本月满足）
```

因此有丰作+征收时不能先把 `F/2` 再乘1.5；奇数值会出现取整差异。

例如：

```ts
G = floor(F * 3 / 2)
H = floor(G / 2)
```

### 2.13 港 / 关基础粮收入

港关仍然要求：

```ts
port.forceId === parentCity.forceId
```

否则本次没有母城附属粮收入。

港关基础值使用的是母城**当次已经经过丰作与征收的 cityBaseTick**：

```ts
portBase =
  floor(cityBaseTick / 5)
```

即20%。

因此：

- 丰作会自然放大港关基础粮；
- 征收会使港关跟着每月有一份半额基数；
- 港关自己没有独立农场/谷仓公式。

### 2.14 PC-PK1.1 一个非常隐蔽的米道港关特例

这是源码比攻略更细的一点。

城市米道分支前有：

```text
是否季度初？
```

所以“征收”导致的季度第2、3个月，**城市本体不会触发米道**。

但是港关米道分支：

```text
0059072B-00590744
```

没有再次检查“是否季度初”。

它只判断：

1. 本月城市粮 tick 是否非0；
2. 母城是否有米道；
3. 然后直接给港关再加 `floor(portBase/2)`。

因此在 PC-PK1.1：

> **若母城同时有征收+米道，港关在季度第2、3个月的征收 tick 也会继续吃米道 +50%。**

也就是说，Wiki 常说的“米道只在季初生效”对**城市本体**是对的；但原月度函数里的港关分支存在这个额外行为。

这是一个非常适合做实机 golden test 的原作细节，但从当前公开反汇编的控制流看已经相当明确。

### 2.15 港关米道公式

令：

```ts
P = floor(cityBaseTick / 5)
```

只要本月存在粮食 tick 且母城有米道：

```ts
portIncome =
  P + floor(P / 2)
```

因此：

#### 无征收

只有季初月有粮 tick，所以米道仍表现成“一季一次”。

#### 有征收

三个月都有粮 tick，于是港关三个月都会触发米道。

这使“征收+米道”对附属港关的季度增益比城市本体更强。

### 2.16 米道武将必须在母城

特技数组是在处理城市时从**母城设施中的武将**取得。

所以：

- 米道武将在城市 → 城市与同势力下属港关都能吃效果；
- 米道武将只驻扎在港/关 → 不会因此让母城或该港关获得米道。

这一点也与老玩家长期实测一致。

### 2.17 季度组合公式

忽略丰作时，令：

```ts
H = floor(F / 2)
```

城市：

| 组合 | 一季度城市粮 |
|---|---:|
| 无特技 | `F` |
| 米道 | `F + floor(F/2)` |
| 征收 | `3H` |
| 征收+米道 | `3H + floor(H/2)` |

若有丰作，则先：

```ts
G = floor(F * 3 / 2)
```

再把上表中的 `F` 替换为 `G`，并重新逐次做整数取整。

### 2.18 Golden tests

假设上级、治安100：

```text
BaseFoodProduction = 5000
农场Lv3 = 2250
邻接谷仓 → 3375
兵力20000 + 军屯农 → 2000
```

则：

```text
rawFood =
  5000 + 3375 + 2000
= 10375

F = 10375
```

若有丰作：

```text
G = floor(10375 * 1.5)
  = 15562
```

若同时有征收：

```text
H = floor(15562 / 2)
  = 7781
```

季初再有米道：

```text
7781 + floor(7781/2)
= 11671
```

季度第2、3月城市各：

```text
7781
```

城市一季总计：

```text
11671 + 7781 + 7781
= 27233
```

### 2.19 C2 当前结论

本项可标：

```text
PC-PK1.1 reverse-engineered
```

已经锁定：

- `BaseFoodProduction`；
- 农场 Lv1/2/3 数值；
- 谷仓 1.5 倍与只作用普通农场；
- 军屯农 = 驻兵10%，最低1500；
- 农场合并中的前一级保留；
- 难度与治安顺序；
- 丰作 → 征收 → 米道顺序；
- 征收每月半份季度粮；
- 城市米道只季初；
- 港关20%与同势力条件；
- 港关米道在征收的非季初月份仍会触发这一 PC-PK1.1 源码特例；
- 所有关键整数取整位置。

仍留一个极小实现边界：

- `00707A74 ConvertFloatToInteger` 在 Easy 分支的具体舍入模式最好后续直接展开 helper；当前 fidelity 实现应保留该 helper，而不是自行用语言默认 rounding 替代。

来源：
- 311MemoryResearch `整理/Func-收支05-计算城市收粮.txt`
- 311MemoryResearch `整理/Func-收支03-每月钱粮兵装收支.txt`
- 311MemoryResearch `整理/Func-收支06-计算城市、港、关兵粮收入.txt`
- 311SireCustomizedPackageDev `00707A74 ConvertFloatToInteger`
- https://w.atwiki.jp/sangokushi11/pages/74.html
- https://w.atwiki.jp/sangokushi11/pages/13.html
- https://w.atwiki.jp/sangokushi11/pages/2445.html
- https://game.ali213.net/forum.php?mod=viewthread&tid=1075291

## 3. 特殊收入特技与丰作

`[PC-PK1.1][reverse-engineered]`

本节只处理**特殊收支如何作用到收入**；丰作/灾害的随机生成概率与生命周期放到后续 C12。

### 3.1 特技作用域不是势力全局，而是“当前城市据点”

月初 `00590490 MonthlyIncomeAndExpend` 处理每座城市时，会先调用：

```text
004CEAE0 GetSPSpecialSkillsArray
```

对**当前城市据点**生成一个特技存在数组。

SIRE 对该函数的说明是：

> 获取城港关的武将所拥有的特技数组；若存在某特技，则对应 index 置为 1。

随后富豪 / 米道 / 征税 / 征收都读取这份城市特技结果。

因此这些特技不是：

```text
势力拥有一次 → 全势力城市生效
```

而是：

```text
哪座城市当前检出该特技
→ 哪座城市获得对应收入效果
```

这与游戏文本长期写的“所属都市”一致。citeturn347358search0turn347358search1

### 3.2 同城多个同名收入特技不会叠加

`[PC-PK1.1][reverse-engineered]`

`GetSPSpecialSkillsArray` 输出的是**有/无标志**：

```ts
hasSkill[skillId] = 1
```

不是：

```ts
skillCount[skillId]++
```

所以：

- 两个富豪同城，不会变成 ×2；
- 两个米道同城，不会变成 ×2；
- 两个征税同城，不会变成每旬再多结一次；
- 两个征收同城，不会变成每月再多结一次。

引擎必须按 boolean effect 建模。

### 3.3 港/关里的收入特技持有人不会单独激活港关效果

`[PC-PK1.1][reverse-engineered]`

月度主循环先对**母城**调用一次 `GetSPSpecialSkillsArray`，之后遍历该城下属港关时，继续复用母城已经算好的：

- 富豪标志；
- 米道标志；
- 征税/征收造成的母城当前 tick 基数。

代码没有为每个港/关重新生成一份收入特技数组。

因此：

> 港关能继承母城收入效果，但不是因为“港关自己拥有该特技”。

如果富豪/米道武将只驻在港/关，而母城没有该特技，则不能靠港关驻将让母城和本港关吃到对应加成。

这一点对米道尤其重要；老玩家实测也长期记录“米道必须放都市，不是放港关”。  

### 3.4 特技是在每个实际收入 tick 重新判定，不是永久缓存

征税的非月初函数 `00599600` 在每次 11 日 / 21 日循环城市时都会重新检查：

```text
当前城市是否有征税
```

月初的富豪/米道/征税/征收则由本次 `00590490` 重新生成城市特技数组。

因此效果取决于**结算时点的当前城市特技状态**。

这解释了社区长期存在的操作：

> 月初把征税武将暂时移出主收入城市，使该城先按富豪取得完整 1.5 倍；之后再把征税武将调回，11日和21日继续各收半份。

日文 Wiki 给出的理论结果为：

```text
1.5 + 0.5 + 0.5 = 2.5
```

这不是另一个隐藏倍率，而是各 tick 独立重新检查武将所在城市造成的。citeturn830277search0

### 3.5 富豪：只增加月初这一次的实际收入

`[PC-PK1.1][reverse-engineered]`

设 `M` 为 C1 的完整城市月金基础值。

无征税：

```ts
income_day1 =
  M + floor(M / 2)
```

有征税时，月初先把基数减半：

```ts
H = floor(M / 2)

income_day1 =
  H + floor(H / 2)
```

富豪不会在 11 日 / 21 日再次触发。

所以：

```text
富豪 + 征税
≈ 0.75 + 0.5 + 0.5
≈ 1.75倍/月
```

而不是把征税的整月总收入最后统一 ×1.5。citeturn347358search0

### 3.6 征税：作用于完整城市收入，不只是市场设施

这是一个需要明确纠正的旧社区说法。

原 `00599600` 的步骤是：

```text
0049E590 GetCityMoneyIncome
↓
返回 M = 城市基础金 + 市场类设施，已含难度/治安
↓
floor(M / 2)
```

因此征税每旬拿的是**完整 M 的一半**。

所以城市自身 `BaseMoneyProduction` 同样被包含在征税节奏里。

某些 Wiki 旧注释称“征税只让相关设施数值变成1.5倍”，对 PC-PK1.1 的实际函数并不准确；原函数没有把城市基础金拆出去。citeturn202106search2turn347358search0

### 3.7 米道：只对实际发生的粮食 tick 加50%

`[PC-PK1.1][reverse-engineered]`

米道不是改 `BaseFoodProduction` 字段，也不是只改农场。

它在粮食基础 tick 已经完成后：

```ts
extra = floor(cityBaseTick / 2)
```

因此它会一起放大：

- 城市基础粮；
- 普通农场；
- 谷仓加成后的农场；
- 军屯农；
- 丰作加成后的结果；
- 若有征收，则是在征收减半后的该次 tick 上再加50%。

对**城市本体**，米道前还有明确“是否季度初”判断，所以只有 1/4/7/10 月1日触发。citeturn347358search0

### 3.8 征收：同样作用于完整城市粮收入

原顺序：

```text
0049E810 GetCityFoodIncome
↓
F = 城市基础粮 + 农场 + 军屯农，已含难度/治安
↓
若丰作：×1.5
↓
若征收：floor(... / 2)
```

因此征收不是只复制“农场产量”的一半，而是对**完整本次城市粮收入**减半后，改为每月结算。

社区长期总结“每月半份，因此季度约1.5倍”是正确的；但“只影响设施粮”不是 PC-PK1.1 的真实实现。citeturn202106search1turn202106search2

### 3.9 丰作是城市状态位，不是设施效果

`[PC-PK1.1][reverse-engineered-structure]`

`struct_city`：

```text
+9C Disasters
  bit 0 = 疫病
  bit 1 = 灾害/蝗灾
  bit 2 = 丰作

+A0 DisasterPredictions
  bit 0 = 疫病预定
  bit 1 = 灾害预定
  bit 2 = 丰作预定
```

对应函数：

```text
0047B3C0 IsCityInSpecificState
  0 = 疫病
  1 = 灾害
  2 = 丰作

0047B3F0 IsCityInScheduledState
```

所以丰作应建模为城市状态：

```ts
city.states.harvest = true
```

而不是：

```ts
farm.harvestBonus = 1.5
```

### 3.10 丰作放大的是完整粮食基础 tick

月度收支中先：

```text
0049E810 → F
```

再检查：

```text
IsCityInSpecificState(2) // 丰作
```

若命中：

```ts
harvestAdjusted =
  floor(F * 3 / 2)
```

所以丰作同时放大：

- 城市基础粮；
- 农场；
- 谷仓后的农场；
- 军屯农。

不是“只有农田产量 +50%”。

### 3.11 丰作、征收、米道的固定顺序

原函数控制流已经明确：

```text
F
↓
丰作 ×1.5
↓
征收 ÷2
↓
城市入账
↓
若季初且有米道
  再 + 当前 cityBaseTick / 2
```

即：

```ts
G = hasHarvest ? floor(F * 3 / 2) : F
H = hasLevy ? floor(G / 2) : G

cityIncome =
  H
  + (
      isQuarterStart && hasRiceWay
        ? floor(H / 2)
        : 0
    )
```

顺序不能交换，因为奇数值会产生不同取整结果。

### 3.12 港关继承母城效果时使用的基数

母城完成：

```text
丰作
→ 征收
```

之后，代码才计算：

```ts
portBase =
  floor(cityBaseTick / 5)
```

所以港关20%天然继承：

- 丰作；
- 征收。

随后港关再根据母城的米道/富豪 flag 增加自己的50%。

这和“港关自己算一套经济公式”完全不同。

### 3.13 PC-PK1.1 港关米道特例继续成立

C2 已锁定：

城市米道前会检查季度初，但港关米道分支没有这个检查。

因此同时有：

```text
征收 + 米道
```

时，季度第2/3个月：

- 城市：只有征收半份，没有米道；
- 同势力下属港关：征收半份的20%之后，**仍再吃米道 +50%**。

这是原控制流的特殊行为，不应为了“规则更整齐”而主动修正掉。

### 3.14 丰作状态更新发生在收入之前

A2 已恢复的 `00590C30 MonthlyAction` 顺序中：

```text
...
0058F4E0 丰作/灾害状态相关处理
↓
00590490 MonthlyIncomeAndExpend
...
```

所以本月收入读取的是**本次月度状态处理之后的当前丰作 flag**。

但：

- 丰作何时生成；
- current/scheduled 两组 bit 如何转换；
- 持续多久；
- 祈愿具体把概率提高多少；

仍属于 C12 灾害专项，C3 不提前伪造公式。

早期无印初版曾有“丰作 flag 不被正常清除、同一城市长期丰作”的著名 bug；旧 2006 讨论甚至直接分析为“其他灾害有平息时的 flag-off，但丰作没有”。这不能直接外推到 PC-PK1.1，应作为**历史版本差异**保留。citeturn388677search4turn388677search5

### 3.15 当前实现建议

```ts
interface CityIncomeEffects {
  wealthy: boolean
  riceWay: boolean
  taxation: boolean
  levy: boolean
}

function collectCityIncomeEffects(city) {
  // 对应 GetSPSpecialSkillsArray 的 boolean 语义
  return detectIncomeSkillsAtStrategicPoint(city)
}
```

不要建模成：

```ts
wealthyCount: number
riceWayCount: number
```

丰作则独立：

```ts
interface CitySeasonState {
  plague: boolean
  locust: boolean
  harvest: boolean
}
```

### 3.16 C3 当前结论

本项已经锁定：

- 四种收入特技按城市据点生效，不是势力全局；
- 同名收入特技多人不叠加；
- 港关不单独扫描收入特技，继承母城当前判定；
- 每个实际收入 tick 会重新检查对应特技；
- 富豪只月初；
- 米道对城市只季初；
- 征税作用于完整 `GetCityMoneyIncome`；
- 征收作用于完整 `GetCityFoodIncome`；
- 丰作是城市状态位，放大完整粮食 tick；
- 丰作 → 征收 → 米道顺序；
- 港关20%位于丰作/征收之后；
- PC-PK1.1 港关米道的非季初特例；
- 丰作状态在月度收入前更新。

仍留给 C12：

- 丰作/疫病/蝗灾的产生概率；
- current/scheduled 状态位精确迁移；
- 丰作持续时间；
- 祈愿概率修正；
- Vanilla 初版丰作 flag bug 与后续补丁的精确版本边界。

来源：
- 311MemoryResearch `整理/Func-收支01-每旬收钱.txt`
- 311MemoryResearch `整理/Func-收支03-每月钱粮兵装收支.txt`
- 311SireCustomizedPackageDev `004CEAE0 GetSPSpecialSkillsArray`
- 311SireCustomizedPackageDev `struct_city.Disasters / DisasterPredictions`
- https://w.atwiki.jp/sangokushi11/pages/13.html
- https://game.ali213.net/forum.php?mod=viewthread&tid=1075291
- https://w.atwiki.jp/sangokushi11/pages/1828.html

## 4. 无印内政设施

`[VANILLA][confirmed-mechanism / empirical-high-data]`

无印《三國志11》的都市开发体系包含 9 类标准内政设施；PK 保留这 9 类，再在其上新增特殊设施与吸收合并。

原设施类型 ID（PC-PK1.1 数据层沿用同一基础序列）：

| ID | 设施 |
|---:|---|
| 31 | 市场 Lv1 |
| 32 | 农场 Lv1 |
| 33 | 兵舍 |
| 34 | 锻冶 |
| 35 | 厩舍 |
| 36 | 工房 |
| 37 | 造船厂 |
| 38 | 造币厂 |
| 39 | 谷仓 |

### 4.1 基础数据

无印/PK Lv1 共通基础值：

| 设施 | 建造金 | 耐久 | 防御 | 完成时技巧P | 核心作用 |
|---|---:|---:|---:|---:|---|
| 市场 | 200 | 500 | 6 | +30 | 增加每月金收入 |
| 农场 | 200 | 500 | 6 | +30 | 增加季度兵粮收入 |
| 兵舍 | 300 | 800 | 6 | +30 | 允许执行征兵 |
| 锻冶 | 300 | 800 | 6 | +30 | 允许生产枪 / 戟 / 弩 |
| 厩舍 | 300 | 800 | 6 | +30 | 允许生产军马 |
| 工房 | 300 | 800 | 6 | +30 | 允许生产攻城兵器 |
| 造船厂 | 300 | 800 | 6 | +30 | 允许生产舰船 |
| 造币厂 | 400 | 1000 | 6 | +50 | 邻接市场效果 ×1.5 |
| 谷仓 | 400 | 1000 | 6 | +50 | 邻接农场效果 ×1.5 |

技巧 P 的无印数值在 2006 年原版时期资料已经有明确记录：

```text
市场 / 农场 / 兵舍 / 锻冶 / 厩舍 / 工房 / 造船 = +30P
造币 / 谷仓 = +50P
```

### 4.2 市场与农场

无印机制：

```text
市场
→ 每月1日进入城市金收入

农场
→ 1/4/7/10月1日进入城市粮收入
```

完整 PC-PK1.1 数值公式已经在 C1 / C2 逆出；C4 不再重复。

无印 2006 年的原始攻略也明确记录：

- 市场按月产金；
- 农场按季产粮；
- 收入设施需要在对应结算日前完成，才能参与之后的收入 tick。

不同无印补丁/难度资料在“UI显示的市场/农场单体数值”上存在口径混用，因此 C4 不用早期攻略中的显示值反推二进制 `yield` 常量；版本化的 PC-PK1.1 数值以 C1/C2 为准。

### 4.3 造币厂 / 谷仓：六角邻接 1 格

`[VANILLA][confirmed-behavior]`

造币和谷仓不是“整座城市全局加成”。

规则：

```text
造币厂：
仅影响与其六角相邻一格的市场

谷仓：
仅影响与其六角相邻一格的农场
```

原 PC-PK1.1 收入函数调用 `0049E500`：

```text
判断目标设施坐标周边一格有无指定设施
```

因此一个位置合适的造币/谷仓理论上最多覆盖周围 6 个开发格。

加成：

```ts
yieldWithSupport = floor(baseYield * 3 / 2)
```

无印 2006 年实测还明确确认：

> 同一个市场/农场即使同时邻接多个造币/谷仓，也不会重复叠加。

底层应按 boolean：

```ts
hasAdjacentMint
hasAdjacentGranary
```

而不是统计数量后指数叠乘。

### 4.4 无印没有吸收合并 / Lv2 / Lv3

这条是版本边界。

无印只有：

```text
市场 Lv1
农场 Lv1
兵舍 Lv1
锻冶 Lv1
厩舍 Lv1
```

不存在玩家通过吸收合并得到：

```text
Lv2
Lv3
```

PK 才加入：

- 市场 / 农场 / 兵舍 / 锻冶 / 厩舍的吸收合并；
- Lv2 / Lv3 数据；
- 新增十类特殊内政设施。

因此 fidelity 模式必须有：

```ts
if (ruleset === VANILLA) {
  absorptionMergeEnabled = false
}
```

而不能仅通过“玩家不去点合并”模拟无印。

### 4.5 兵舍 / 锻冶 / 厩舍的真正作用：增加本回合可执行次数

`[VANILLA][empirical-high + reverse-engineered-structure]`

2006 年无印专项实测明确指出：

> 同类军需设施并不直接放大“每次征兵/生产的数量”，而是增加一回合内该命令可使用的次数。

原城市结构也直接保存：

```text
+A8 EmptyBarracks
+A9 EmptyForge
+AA EmptyStable
+AB EmptyWorkshop
+AC EmptyShipyard
```

并存在：

```text
0047B820 AdjustCityBarracksCount
004B3EE0 AdjustCityBuilding
```

用于增减城市当前空闲的征兵/生产设施数量。

因此应拆成：

```ts
recruitAmount = recruitmentFormula(officers, city, ...)
recruitCommandSlots = availableBarracks

weaponAmount = productionFormula(officers, city, ...)
weaponCommandSlots = availableForgeOrStable
```

不要写成：

```ts
recruitAmount *= barracksCount
weaponAmount *= forgeCount
```

### 4.6 兵舍

兵舍解锁：

```text
征兵
```

每个当前可用兵舍提供一次征兵命令槽。

征兵量本身由：

- 执行武将魅力；
- 治安；
- 特技；
- 难度 / AI 修正等

另一套公式决定，留到后续征兵专项。

多个兵舍的价值是让同一回合可以多次执行征兵，不是单次征兵直接 ×N。

### 4.7 锻冶

锻冶解锁普通兵装：

```text
枪
戟
弩
```

每个当前可用锻冶提供一次对应生产命令槽。

单次最多生产多少由武将政治/生产公式、能吏等另一层规则决定，不由锻冶数量直接乘算。

### 4.8 厩舍

厩舍解锁：

```text
军马
```

其设施数量同样影响可执行生产次数，而非把一次军马生产量直接乘设施数。

### 4.9 工房

工房解锁攻城兵器生产。

基础技术状态下至少包括：

```text
冲车
井阑
```

后续技巧会改变可生产/实际使用的高级兵器：

```text
冲车 → 木兽
井阑 → 投石
```

一个生产命令的产物数量为 1 件攻城兵器，而不是几千“兵装”。

生产需要时间；精确工期与执行武将能力放到 E2“兵器舰船工期”专项。

### 4.10 造船厂

造船厂解锁舰船生产。

基础舰船：

```text
楼船
```

研究相应技巧后：

```text
楼船 profile → 斗舰
```

每次生产以“1艘”为单位，且存在生产工期；具体时间留到 E2。

### 4.11 工房/造船与“当前空闲设施”状态

城市结构单独保存：

```text
EmptyWorkshop
EmptyShipyard
```

所以工房/造船也不能简单建模为：

```ts
city.hasWorkshop = true
```

至少需要保留：

```ts
availableWorkshopCount
availableShipyardCount
```

无印玩家资料把兵舍及各种装备生产设施统一描述为“设施数量决定一回合可执行次数”。

具体长工期生产任务开始后，空闲计数如何占用/恢复的逐指令 caller 仍留给 E2，不在 C4 伪造。

### 4.12 开发用地属于城市，不是任意地图格

原城市结构：

```text
DomesticLandCount
DevelopedLandCount
DomesticLands[30]
```

说明都市开发使用的是预定义的城市内政用地。

因此无印开发不是：

```text
在城市领域任意草地都能放市场
```

而是只能在该城预置的开发格中进行。

各城开发地数量并不相同；现有 `docs/sources/cities.json.developmentLots` 已保存城市开发格数量。

### 4.13 建造完成才生效

市场/农场/造币/谷仓的收入函数都会检查设施：

```text
constructionStatus == completed
```

未完成则跳过。

兵舍和生产设施同样只有完成后才进入可用设施计数。

因此：

```ts
underConstructionFacility.effectActive = false
```

无印不存在“半完成市场按耐久比例产生收入”的机制。

### 4.14 C4 权威模型

建议把九类设施分三类：

```ts
IncomeFacility:
  Market
  Farm

AdjacencyMultiplierFacility:
  Mint
  Granary

CommandCapacityFacility:
  Barracks
  Forge
  Stable
  Workshop
  Shipyard
```

这比一个统一的：

```ts
building.effectValue
```

更接近原作结构。

### 4.15 C4 当前结论

已经锁定：

- 无印标准内政设施就是 9 类；
- 31～39 的基础设施 ID 序列；
- 基础费用、耐久、防御；
- 完成开发技巧 P；
- 市场按月、农场按季；
- 造币/谷仓只作用相邻一格；
- 1.5倍且不叠加；
- 无印没有吸收合并和 Lv2/Lv3；
- 兵舍/锻冶/厩舍/工房/造船数量控制可用命令槽，而非直接乘单次产量；
- 工房生产攻城兵器、造船生产舰船；
- 开发只能使用城市预定义内政格；
- 未完成设施不生效。

留到后续专项：

- C7：各设施精确开发日数；
- E1：枪/戟/弩/马的生产价格和单次数量；
- E2：攻城兵器/舰船工期与空闲工房/船厂恢复时点；
- C5：PK 新增十设施；
- C6：PK 吸收合并。

来源：
- 311SireCustomizedPackageDev `material/数据汇总.md`
- 311SireCustomizedPackageDev `material/结构体汇总.md`
- 311SireCustomizedPackageDev `material/内存地址汇总.md`
- 311MemoryResearch `Func-收支04/05`
- https://w.atwiki.jp/sangokushi11/pages/74.html
- https://www.gamersky.com/handbook/200604/22088.shtml
- https://www.gamersky.com/handbook/200603/21634.shtml
- https://www.gamersky.com/handbook/200603/21665.shtml
- https://3g.ali213.net/gl/html/5805.html

## 5. PK 新增十设施

`[PK][PC-PK1.1 reverse-engineered + game-data]`

PK 新增十类普通内政设施：

~~~text
经济型：
  大市场 / 鱼市场 / 黑市 / 军屯农

功能型：
  符节台 / 军事府 / 人才府 / 外交府 / 计略府 / 练兵所
~~~

原 PC-PK1.1 关键设施 ID：

| ID(hex) | ID(dec) | 设施 |
|---:|---:|---|
| 0x28 | 40 | 符节台 |
| 0x29 | 41 | 军事府 |
| 0x2A | 42 | 人才府 |
| 0x2B | 43 | 外交府 |
| 0x2C | 44 | 计略府 |
| 0x2D | 45 | 练兵所 |
| 0x2E | 46 | 大市场 |
| 0x2F | 47 | 鱼市场 |
| 0x30 | 48 | 黑市 |
| 0x31 | 49 | 军屯农 |

### 5.1 基础数据

| 设施 | 费用 | 耐久 | 防御 | 数量限制 |
|---|---:|---:|---:|---|
| 大市场 | 400 | 750 | 6 | 大都市限定，1城1座 |
| 鱼市场 | 400 | 750 | 6 | 有港都市限定，1城1座 |
| 黑市 | 50 | 200 | 6 | 可多座 |
| 军屯农 | 400 | 750 | 6 | 1城1座 |
| 练兵所 | 200 | 450 | 6 | 1城1座 |
| 符节台 | 200 | 450 | 6 | 1城1座 |
| 军事府 | 200 | 450 | 6 | 1城1座 |
| 人才府 | 200 | 450 | 6 | 1城1座 |
| 外交府 | 200 | 450 | 6 | 1城1座 |
| 计略府 | 200 | 450 | 6 | 1城1座 |

### 5.2 大市场

`[PK][reverse-engineered-income + confirmed-data]`

仅大都市可建，每城最多1座。基础月金产量 300。

C1 的 `0049E590 GetCityMoneyIncome` 明确把大市场计入收入，但跳过造币厂邻接加成：

~~~ts
largeMarketYield = 300
~~~

### 5.3 鱼市场

`[PK][reverse-engineered-income + confirmed-data]`

有港都市限定，每城最多1座。基础月金产量 200，同样不吃造币厂：

~~~ts
fishMarketYield = 200
~~~

“有港”按城市地图/剧本属性理解；当前没有证据要求港口此刻必须与母城同 ForceID 才能维持鱼市场。

### 5.4 黑市

`[PK][reverse-engineered-income + empirical-high lifecycle]`

~~~text
费用 50
耐久 200
月金产量 80
可建多座
不吃造币
~~~

每到 1 月会被强制撤去。FAQ/长期实测还确认黑市不会额外提高治安下降率或贼出现率；被破坏时不能像普通市场一样掠夺金钱。

“PC版可能提高探索物品发现率”只有社区观察，不纳入 fidelity 核心规则。

### 5.5 军屯农

`[PK][reverse-engineered]`

C2 已从 `0049E810` 锁定：

~~~ts
militaryFarmYield =
  floor(max(city.troops, 15000) / 10)
~~~

所以兵力 15000 以下固定1500，之后约等于当前驻兵的10%。军屯农不吃谷仓，每城最多1座。

### 5.6 练兵所：训练效果精确 ×1.5

`[PK][PC-PK1.1 reverse-engineered]`

原函数 `005C3F50 计算训练效果` 在基础训练效果算完后检查 `0x2D = 练兵所`，命中则：

~~~ts
trainingGain =
  floor(trainingGain * 3 / 2)
~~~

随后才受据点气力上限截断。

### 5.7 练兵所：只缩短舰船制造，不缩短攻具

`[PK][PC-PK1.1 reverse-engineered]`

原 `005C6CA0` 在 `equipmentId >= 9` 时才进入练兵所分支，所以攻具 ID 5～8 不受影响。

正常舰船工期骨架：

~~~ts
turns = 10 - q
~~~

有练兵所：

~~~ts
turns = max(2, 8 - q)
~~~

其中 q 来自生产武将智力组合，完整公式留到 E2。

因此常见情况下相当于缩短2旬（20日），但底层不是最后简单 `days -= 20`。之后若有“造船”特技，原函数再把结果减半。

### 5.8 符节台：行动力恢复 +5

`[PK][empirical-high / cross-validated]`

每座符节台对对应军团的旬行动力恢复 +5 AP；多个城市的符节台可以累加。完整军团作用域留 C10。

### 5.9 符节台：忠诚下降 +2，以及原作副作用

`[PK][PC-PK1.1 reverse-engineered]`

原 `0058E510` 忠诚下降函数：

~~~text
0058E748 push 0x28      // 符节台
...
0058E759 add edi, 2     // 忠诚下降值 +2
~~~

俘虏会跳过“必须季度初”的判断，所以每个月度忠诚下降流程都可能吃到这个 +2。

但该 +2 位于通用忠诚下降数值计算里，不是俘虏专用代码。因此同一据点的本方普通武将若在季初进入自然忠诚下降流程，也会额外 +2。

这正是游侠内存研究注明的原作副作用：符节台也会使该城我方武将在季节变换时忠诚下降量增加。

### 5.10 军事府：官方说明比实际覆盖更宽

官方/攻略通常写“军事行动力消耗减半，军事设施/陷阱设置费 -20%”。

设置费已由 `0049DB6E` 确认：

~~~text
militaryBuildingPlacementCost *= 0.8
~~~

PC-PK1.1 已确认的 AP 分支：

| 命令 | 普通 | 有军事府 | 证据 |
|---|---:|---:|---|
| 训练 | 20 | 10 | `005C43FC` |
| 出征 | 基础值 | 1/2 | `005DB86E` |
| 输送 | 基础值 | 1/2 | `005DB107` |

而已展开的执行函数里：

- 征兵直接扣 20 AP；
- 枪/戟/弩/马生产直接扣 20 AP；
- 攻具/舰船生产也走自身 20 AP 扣除；

这些路径没有军事府判定。

因此当前 fidelity 先实现：

~~~text
训练 / 出征 / 输送 → 减半
征兵 / 生产 → 不因军事府减半
~~~

其他军事命令留 C11 全量穷举。

### 5.11 人才府：探索 / 登用 AP 减半

`[PK][PC-PK1.1 reverse-engineered]`

`005D1F5E` 明确对应人才府 `0x2A`，使探索人才与登用人才行动力减半。

### 5.12 人才府：技巧研究 -20日，最短1旬

`[PK][PC-PK1.1 reverse-engineered]`

~~~text
005D7ED7  技巧研究时间 -20日
005D7EF0  耗时下限 = 1
005D7EF4  低于下限时保底 = 1
~~~

游戏内部以旬为单位，可表示为：

~~~ts
researchTurns =
  max(1, baseResearchTurns - 2)
~~~

只确认“技巧研究”，不要自动外推到 PK 能力研究/培养。

### 5.13 外交府

`[PK][official/manual + function-located]`

已定位 `005BD040 GetDiplomacyActionPointCost`。

效果：

- 从拥有外交府的城市执行外交，AP 消耗减半；
- 亲善费用减半。

没有证据表明它提高同盟/停战成功率、舌战概率或关系增长量。

### 5.14 计略府：计略 AP 减半

`[PK][PC-PK1.1 reverse-engineered]`

`005BFF3E`：计略府 `0x2C` 使计略行动力消耗减半。对应通用函数 `005BFF10 GetStrategyActionPointCost`。

### 5.15 计略府：流言提升不是固定 +20 个百分点

`[PK][PC-PK1.1 reverse-engineered]`

原流言成功率函数：

~~~text
无计略府：相关参数 = 10
有计略府：相关参数 = 12
~~~

这个参数随后进入流言公式，因此准确表述是“流言公式中的权重参数 10→12”，该项提高20%，但最终成功率不是统一 +20 percentage points。

目前没有源码证据证明计略府同时提高驱虎吞狼、二虎竞食等其他计略成功率。

### 5.16 六类功能设施都是所在城市效果

正确建模：

~~~ts
city.hasTrainingGround
city.hasTallyPlatform
city.hasMilitaryOffice
city.hasTalentOffice
city.hasDiplomacyOffice
city.hasStrategyOffice
~~~

不是 force-global bool。具体命令从哪个据点发起，会决定 helper 是否读取该城市的设施。

### 5.17 C5 汇总

| 设施 | 精确核心效果 | 证据等级 |
|---|---|---|
| 大市场 | 月金300；不吃造币；大都市1座 | reverse + data |
| 鱼市场 | 月金200；不吃造币；有港城1座 | reverse + data |
| 黑市 | 月金80；不吃造币；1月强制撤；可多座 | reverse-income + empirical-high |
| 军屯农 | `floor(max(兵,15000)/10)`；不吃谷仓 | reverse |
| 练兵所 | 训练×1.5；舰船工期基准10→8、min2 | reverse |
| 符节台 | AP恢复+5；忠诚下降值+2；有本方副作用 | reverse + cross-check |
| 军事府 | 训练/出征/输送AP减半；设置费×0.8 | reverse |
| 人才府 | 探索/登用AP减半；技巧研究-2旬、min1 | reverse |
| 外交府 | 外交AP减半；亲善金减半 | official + function-located |
| 计略府 | 计略AP减半；流言参数10→12 | reverse |

### 5.18 后续专项

- C10：符节台 +5 如何进入完整军团行动力恢复公式；
- C11：所有命令逐项穷举四府 AP reduction；
- E2：练兵所与造船特技的完整舰船生产日数；
- D10/D12：符节台 +2 对普通武将/俘虏的完整忠诚流程；
- G11：计略府参数10→12在流言最终成功率里的贡献；
- E11：特殊设施建设/拆除的技巧P。

来源：
- 311MemoryResearch `Func-收支04/05`
- 311MemoryResearch `Func-内政03-计算训练效果.txt`
- 311MemoryResearch `Func-内政13-计算生产耗时.txt`
- 311MemoryResearch `Func-自动06-武将忠诚下降.txt`
- 311MemoryResearch `函数[计算流言是否成功].txt`
- 311MemoryResearch `修改记录by sjn4048.txt`
- 311SireCustomizedPackageDev `material/内存地址汇总.md`
- https://w.atwiki.jp/sangokushi11/pages/74.html
- https://game.ali213.net/thread-2168294-1-1.html

## 6. PK 吸收合并

`[PK][official-confirmed + PC-PK1.1 reverse-engineered-structure + empirical-high timing]`

PK 的“吸收合并”不是普通开发的别名，而是独立内政行动。SIRE 数据层把它列为：

```text
actionId = 1  // 吸收合并
```

311MemoryResearch 还定位到 PC-PK1.1 的吸收合并处理点：

```text
005D758B
```

当前公开资料没有完整展开该处理函数，因此“合法性/费用”以下以官方说明书为最高证据；设施 ID 与合并中收入行为则可由数据表和已展开收入函数直接交叉确认。

### 6.1 只有五类设施可升级，Lv2/Lv3 是独立设施类型

可吸收合并的只有：

```text
市场 / 农场 / 兵舍 / 锻冶 / 厩舍
```

PC-PK1.1 数据层不是简单在 Lv1 设施上挂一个 `level++`，而是切换到另一种设施类型：

| 系列 | Lv1 | Lv2 | Lv3 |
|---|---:|---:|---:|
| 市场 | 31 | 50 | 51 |
| 农场 | 32 | 52 | 53 |
| 兵舍 | 33 | 54 | 55 |
| 锻冶 | 34 | 56 | 57 |
| 厩舍 | 35 | 58 | 59 |

因此 fidelity 实现至少应保存“等级 → 原设施类型 ID”的映射，不能只在 UI 层显示 Lv2/Lv3 而底层仍保持同一个 type。

### 6.2 合法组合不是任意两个同类等级相加

官方说明书明确给出这些约束：

1. 两个设施必须是**同类**；
2. 必须六角**相邻**；
3. 被吸收的一侧必须是 **Lv1**；
4. 最高只能到 **Lv3**；
5. 当进行 Lv2 + Lv1 时，只能把 **Lv2** 选为“升级主体”。

因此原作的合法路径是：

```text
Lv1 + Lv1 -> Lv2
Lv2 + Lv1 -> Lv3
```

而不是：

```text
Lv2 + Lv2
Lv3 + Lv1
Lv1 吸收 Lv2
```

吸收开始后，被吸收设施消失，原格被释放；升级主体进入“合并建设中”状态。

### 6.3 执行限制与固定成本

官方 PK 说明书还给出了旧文档遗漏的三个硬条件：

```text
城市周围 2 格以内存在敌军部队
-> 不能执行吸收合并

行动力消耗
-> 10

金钱消耗
-> 100
```

这里的“2 格”是以**城市**为中心的敌情限制，不是以待合并设施为中心。

吸收合并本身是 actionId=1；当前 C5 已确认的军事府 AP 减半只覆盖训练/出征/输送等分支，所以 C6 不应擅自把吸收合并的 10 AP 再减半。

### 6.4 合并工期：70 政治是 10 日 / 20 日分界

官方说明书只写“执行武将政治越高，期间越短”。

日文 Wiki 与旧实测进一步把边界锁到：

```ts
mergeDays =
  executorPolitics >= 70
    ? 10
    : 20
```

也就是：

- 政治 70 及以上：1 旬完成；
- 政治 69 及以下：2 旬完成。

这一条目前属于 `empirical-high`，因为公开的 `005D758B` 完整函数体尚未恢复；不能把它标成 reverse-engineered。

### 6.5 合并期间不是“设施失效”

官方说明书明确说明：吸收合并进行中，升级主体仍发挥**合并前一级**效果。

收入函数已经给出源码级交叉验证：

```text
市场 Lv2 未完成 -> 按市场 Lv1 计算
市场 Lv3 未完成 -> 按市场 Lv2 计算

农场 Lv2 未完成 -> 按农场 Lv1 计算
农场 Lv3 未完成 -> 按农场 Lv2 计算
```

所以：

```text
两个 Lv1 市场开始合并
-> 被吸收的那个立刻消失
-> 升级主体在完成前只按一个 Lv1 市场产出
-> 完成后才按一个 Lv2 市场产出
```

这也解释了为什么在收入结算日前贸然开始合并，短期总收入可能反而下降。

对兵舍 / 锻冶 / 厩舍，官方说明书同样把“合并中仍发挥原等级效果”作为通用规则；但当前公开逆向资料尚未逐指令展开三者在合并中的命令槽/倍率 caller，因此源码证据等级低于市场/农场。

### 6.6 Lv2 / Lv3 的效果倍率

官方说明书与长期攻略一致：

```text
Lv2 = Lv1 效果 ×1.2
Lv3 = Lv1 效果 ×1.5
```

这不是“把两个或三个 Lv1 的效果直接相加”。

对收入设施已经由 C1/C2 的原函数锁定：

```text
市场：100 -> 120 -> 150
农场：1500 -> 1800 -> 2250
```

兵舍 / 锻冶 / 厩舍则把对应征兵/生产效果提高到 1.2 / 1.5 倍；由于合并后只剩一个设施，原本两个相邻设施提供的两个独立设施槽也不会继续同时存在。

### 6.7 技巧 P

2006 年多份同期攻略一致记录：

```text
每完成一次吸收合并 -> +10 技巧P
```

但当前尚未拿到 `005D758B` 完整函数体直接验证这个奖励，所以本项保留为 `empirical-high`，不冒充源码 confirmed。

### 6.8 C6 当前结论

已经锁定：

- 仅市场/农场/兵舍/锻冶/厩舍五类可合并；
- Lv2/Lv3 在数据层对应独立设施 ID 50～59；
- 吸收合并是独立 actionId=1；
- 合法路径只有 Lv1+Lv1→Lv2、Lv2+Lv1→Lv3；
- 被吸收方必须 Lv1；
- 城市周围2格有敌军时禁止执行；
- 固定消耗 10 AP + 100 金；
- 政治70为10日/20日分界（empirical-high）；
- 合并期间升级主体继续按前一级效果生效；
- 市场/农场这一点已由收入原函数直接确认；
- Lv2 / Lv3 效果分别为 Lv1 的 1.2 / 1.5；
- 完成一次吸收合并 +10 技巧P 目前保持 empirical-high。

来源：
- 《三國志11 with パワーアップキット》官方说明书
  https://cdn.akamai.steamstatic.com/steam/apps/628070/manuals/32sangokushi11wpk_manual.pdf
- 311SireCustomizedPackageDev `material/数据汇总.md`：actionId 与 31～59 设施类型 ID
  https://github.com/sean2077/311SireCustomizedPackageDev/blob/dev/material/数据汇总.md
- 311MemoryResearch `内存资料/修改记录by sjn4048.txt`：吸收合并地址 005D758B
  https://github.com/sjn4048/311MemoryResearch
- 日文 Wiki 内政：合并对象、Lv2/Lv3倍率、合并中前一级效果、政治70一旬
  https://w.atwiki.jp/sangokushi11/pages/74.html
- 日文旧实测：政治70/69对应10日/20日
  https://w.atwiki.jp/sangokushi11/
- 游民星空 PK 建筑篇：合并收益、技巧P与短期收入变化
  https://www.gamersky.com/handbook/200609/33180.shtml

## 7. 内政设施精确开发日数

`[COMMON/PK][empirical-exact table reconstruction + reverse-engineered-structure]`

这一项过去只有“综合政治 + 门槛表”。本轮把整张 10～100 日表反推成了一个统一、逐格完全一致的耐久进度模型。

先说明证据边界：

- 日文 Wiki 给出了综合政治公式和完整门槛表；
- 官方 PK 说明书确认开发最多使用3名武将，政治越高工期越短，并给出多人开发会缩短日数的示例；
- SIRE 结构确认建筑类型保存最大耐久，建筑实例保存当前耐久与 `ConstructionStatus`；
- 旧 2ch 实测直接观察到“市场刚开始建设时为 125/500”；
- **当前仍未拿到 PC-PK1.1 计算内政开发日数的完整反汇编函数体**。311MemoryResearch 只定位到“市场等内政建设”执行路径的 `005BC4C1`。

因此下面的闭式应标为：

```text
empirical-exact / table-reconstructed
```

而不是伪装成 `reverse-engineered function`。

### 7.1 综合政治 P

最多选择3名武将。

令三人的政治从高到低为：

```text
p1 >= p2 >= p3
```

缺少的武将按0处理。

Wiki 公式：

```ts
P = round(
  p1 + (p2 + p3) / 3
)
```

因为 `p2+p3` 除以3的小数部分只可能是 0、1/3、2/3，所以可以无浮点地写成：

```ts
P = p1 + floor((p2 + p3 + 1) / 3)
```

也就是说：

- 第一名政治完整计入；
- 其余两名合计只按约1/3计入；
- 三人并不是简单把政治相加。

### 7.2 开发进度模型

令设施最大耐久为 `D`。

已知门槛表与所有原作设施耐久可以被下面模型**逐项精确重建**：

```ts
initialDurability = roundHalfUp(D / 4)

gainPerTurn = floor(P * 3 / 2)

turnsNeeded =
  gainPerTurn <= 0
    ? 10
    : ceil(
        (D - initialDurability)
        / gainPerTurn
      )

turns = min(10, turnsNeeded)
days = turns * 10
```

对原作现有耐久值，`roundHalfUp(D/4)` 等价于：

```ts
floor((D + 2) / 4)
```

因此可以把机制理解为：

```text
开始开发
→ 设施先拥有约25%最大耐久
→ 每旬增加 floor(综合政治 × 1.5) 耐久
→ 达到最大耐久即完成
→ 最慢固定100日
```

市场的旧实测明确观察到：

```text
125 / 500
```

与“初始25%耐久”直接一致。

其他设施的初始值目前是由整张门槛表反推出来，而不是逐设施在存档中直接读取，因此实现时应保留这一证据说明。

### 7.3 为什么那些奇怪门槛会出现

这个模型解释了表里很多看似不规则的数字。

#### 市场 / 农场：D=500

```text
initial = 125
```

如果 P=125：

```text
每旬 gain = floor(125×1.5)=187
20日后 = 125 + 187×2 = 499
```

还差1点，因此不能20日完成。

P=126：

```text
gain = 189
125 + 189×2 = 503
```

所以 **20日门槛恰好是126**，不是125。

#### 黑市：D=200

```text
initial = 50
```

P=25：

```text
gain=37
40日后=50+37×4=198
```

不够。

P=26：

```text
gain=39
50+39×4=206
```

所以40日门槛是 **26**。

#### 铜雀台：D=1300

```text
initial = 325
```

P=325：

```text
gain=487
20日后=325+487×2=1299
```

仍差1点。

P=326：

```text
gain=489
325+489×2=1303
```

所以20日门槛正好是 **326**。

这种“刚好差1”的现象是判断该模型不是偶然拟合的重要证据。

### 7.4 全设施门槛表

下表是日文 Wiki 的原门槛；用上面的公式逐格重算，所有数字完全一致。

| 完成日数 | 市场/农场 D500 | 黑市 D200 | 造币/谷仓 D1000 | 大市场/鱼市/军屯农 D750 | 兵舍/锻冶/厩舍/工房/造船 D800 | 练兵所/符节台/四府 D450 | 铜雀台 D1300 |
|---:|---:|---:|---:|---:|---:|---:|---:|
| 10 | 250 | 100 | 500* | 375 | 400 | 225 | 650* |
| 20 | 126 | 50 | 250 | 188 | 200 | 113 | 326 |
| 30 | 84 | 34 | 167 | 126 | 134 | 76 | 217 |
| 40 | 63 | 26 | 126 | 94 | 100 | 57 | 163 |
| 50 | 50 | 20 | 100 | 76 | 80 | 46 | 130 |
| 60 | 42 | 17 | 84 | 63 | 67 | 38 | 109 |
| 70 | 36 | 15 | 72 | 54 | 58 | 33 | 94 |
| 80 | 32 | 13 | 63 | 48 | 50 | 29 | 82 |
| 90 | 28 | 12 | 56 | 42 | 45 | 26 | 73 |

`*`：原 Wiki 的10日栏对造币/谷仓、铜雀台显示“—”。公式反推所需 P 分别是500和650。

正常武将政治上限100时：

```text
Pmax = 100 + floor((100+100+1)/3)
     = 167
```

所以当然达不到这些10日门槛。

Wiki 还记录把政治用编辑器改到255时：

```text
Pmax = 255 + floor((255+255+1)/3)
     = 425
```

仍然达不到500/650，因此这两个“—”同样被公式解释。

### 7.5 PK新增设施不是另一套工期公式

PK新增设施只是因为最大耐久不同，落入不同门槛组：

```text
大市场 / 鱼市场 / 军屯农
D=750

练兵所 / 符节台 / 军事府 / 人才府 / 外交府 / 计略府
D=450
```

代入同一个：

```ts
gainPerTurn = floor(1.5 * P)
```

即可精确得到 Wiki 全部 PK 门槛。

所以引擎不需要为 PK 特殊设施写一套独立 hard-coded 日数表；正确抽象应是：

```ts
developmentDays(maxDurability, officersPolitics)
```

### 7.6 Lv2 / Lv3 不属于“重新开发”

市场/农场/兵舍/锻冶/厩舍的 Lv2/Lv3 来自 C6 的**吸收合并**，走独立 actionId=1 与10/20日合并规则，不应套 C7 的普通开发日数。

也就是说：

```text
从空地建 Lv1
→ C7 普通开发公式

Lv1→Lv2 / Lv2→Lv3
→ C6 吸收合并公式
```

### 7.7 C7 当前结论

已经锁定：

- 普通开发最多3名武将；
- 综合政治为最高政治 + 其余两人政治合计的1/3，再四舍五入；
- 任意普通内政设施最长100日；
- 日文 Wiki 的整张10～90日门槛表可信；
- 整张门槛表可以由“约25%初始耐久 + 每旬 floor(1.5×综合政治)”统一重建，所有数字逐格一致；
- 市场初始125/500有旧实测直接支持；
- PK新增设施不需要独立工期函数，只是最大耐久不同；
- Lv2/Lv3升级属于C6吸收合并，不属于C7普通开发。

仍保留一个明确 exactness gap：

> 公开逆向资料尚未展开 PC-PK1.1 内政开发日数函数体，所以“25%初始耐久 + 1.5P/旬”目前是**全表精确重建模型**，不是直接逐指令还原。

来源：
- 《三國志11 with パワーアップキット》官方说明书
  https://cdn.akamai.steamstatic.com/steam/apps/628070/manuals/32sangokushi11wpk_manual.pdf
- 日文 Wiki 内政：综合政治与完整开发日数门槛
  https://w.atwiki.jp/sangokushi11/pages/74.html
- 旧2ch/Wiki存档：市场建设中125/500实测
  https://w.atwiki.jp/sangokushi11/pages/1869.html
- 311SireCustomizedPackageDev：
  `struct_building_type` 最大耐久、`struct_building` 当前耐久/ConstructionStatus
  https://github.com/sean2077/311SireCustomizedPackageDev
- 311MemoryResearch：
  `修改记录by sjn4048.txt` 定位“市场等内政建设”执行路径 `005BC4C1`
  https://github.com/sjn4048/311MemoryResearch

## 8. 商人 / 粮食交易

`[COMMON/PK][official-confirmed command semantics + empirical-high formula + reverse-engineered-structure]`

C8 处理原版/PK 的都市“商人”命令，不把 SIRE 后续的“交易优势”“商贸城市”等 MOD 扩展倒推成原作。

### 8.1 命令边界

官方 PK 说明书确认：

```text
行动力：20
额外固定金钱费用：无
期间：无（即时结算）
城市周围2格以内存在敌军部队：不可执行
执行武将政治越高：交易越有利
```

原数据结构还保存：

```text
struct_city +0x7C TradePrice   // 粮价
struct_city +0x7D HasMerchant  // 是否有商人
struct_city +0xA4 CityActions
  bit0 = 已巡查
  bit1 = 已商人
  bit4 = 已训练
```

并已定位：

```text
0047B6F0 SetCityMerchantStatus
0047BD50 SetCityTradePrice
005CAD1B 商人命令执行路径
```

### 8.2 每座都市每旬最多一次

`CityActions.bit1 = 已商人` 是结构级证据，说明商人和巡查、训练一样有本旬执行状态。

日文 Wiki 的经验数据也独立吻合：商人每次政治经验 +5，一年36旬，单都市全年最大180，正好是 `36 × 5`。

因此 fidelity 应按每都市每旬一次建模，而不能把“买卖数量没有很低的额外配额”误读成同城同旬可无限重复点击。

### 8.3 商人是都市命令，不是港 / 关原生命令

`TradePrice / HasMerchant / CityActions` 都是 `struct_city` 字段，官方说明也以都市为执行据点。

因此原作默认：

```text
城市：满足商人状态时可交易
港 / 关：没有原生商人命令
```

后来的 PK2.2 / SIRE“支城粮食交易”属于 MOD 扩展。

### 8.4 商人存在状态与粮价状态

城市独立保存 `HasMerchant` 与 `TradePrice`，所以两者都应进入 Runtime City State，而不是每次打开界面临时生成。

老玩家资料一致表明商人并非所有城市永久常驻，粮价会随月份变化；但公开 PC-PK1.1 逆向尚未恢复商人出现/消失的精确概率和粮价转移分布。

特别注意：SIRE 后来的“商贸城市商人常驻、非商贸城市25%出现”等是 MOD 规则，不能写进原作默认 fidelity。

### 8.5 粮价的含义

原作相场通常为 `3..7`，其语义是：

```text
1 金可以买 TradePrice 兵粮
```

因此数字越大越适合买粮，数字越小越适合卖粮。经典“7买3卖”就是利用这个方向。

### 8.6 买粮公式

2007 年大样本实测锁定主体结构：

```ts
b = tradeEffect(executorPolitics)
boughtFood = paidGold * city.tradePrice * b
```

买粮没有额外固定20%损失。政治50时 `b = 1.00`。

### 8.7 卖粮公式

卖粮则存在稳定的20%折损：

```ts
receivedGold = soldFood / city.tradePrice * b * 0.8
```

所以20%损失只在卖粮侧；不是买卖各扣10%，也不是所有交易统一先乘0.8。

### 8.8 政治对买卖使用同一交易效果 b

实测显示交易效果随政治非线性提高，且 UI 整数百分比会丢掉真实小数精度。

| 政治 | 实测交易效果 |
|---:|---:|
| 20 | 约93.024% |
| 50 | 100% |
| 51 | 约100.2516% |
| 60 | 约102.565% |
| 70 | 约105.2642% |
| 80 | 约108.109% |
| 90 | 约111.1122% |
| 92 | 约111.7328% |
| 97 | 约113.3154% |
| 98 | 约113.6374% |
| 99 | 约113.9612% |
| 100 | 约114.2868% |

例如政治97/98/99在 UI 上可能都显示113%，但实际成交量并不相同。

### 8.9 同价往返的盈利阈值

若粮价不变且买卖使用同一个 `b`：

```ts
finalGold = initialGold * b * b * 0.8
```

所以盈利条件是：

```text
0.8 * b² > 1
b > sqrt(1.25)
b > 1.118033...
```

政治92的实测约111.7328%，略低于临界值；长期实测边界约在政治93。

### 8.10 跨城粮价差

若在城市A买粮、城市B卖粮：

```ts
finalGold = initialGold
  * (priceA / priceB)
  * buyEffect
  * sellEffect
  * 0.8
```

同一执行政治时就是 `initialGold * (priceA/priceB) * b² * 0.8`。但粮价按月变化，因此跨月运输必须使用实际卖出时的 `TradePrice`。

### 8.11 仍未取得的精确闭式

当前仍没有公开反汇编锁定 `tradeEffect(politics)` 的内部闭式函数。

2007 文章里的 `1 + (政治-50) × 0.285736%` 是作者明确说明的线性近似，不能冒充原作公式。

现阶段 fidelity 优先级：

1. 以后若恢复原函数，直接替换；
2. 当前使用已测政治点 lookup；
3. 中间值使用单调插值；
4. 明确标 `empirical`。

同样，最终资源变化的逐步整数截断顺序目前也没有完整函数体支持。

### 8.12 C8 当前结论

已经锁定：

- 商人命令20AP、无固定费用、即时结算；
- 都市周围2格有敌军时禁止；
- 城市保存 `TradePrice / HasMerchant`；
- `CityActions.bit1` 表示本旬已商人，因此每都市每旬最多一次；
- 港/关没有原作商人命令；
- 粮价语义为1金兑换3～7粮；
- 买粮无20%损失，卖粮固定×0.8；
- 买卖共享政治交易效果；
- 政治50=100%，交易效果随政治非线性提高；
- UI百分比不是内部精确值；
- 同价往返盈利阈值 `b > sqrt(1.25)`，实战边界约政治93；
- 跨城倒粮可由两城价格比直接推导。

仍 open：

- 政治→交易效果的原始闭式函数；
- 每一步整数取整/截断顺序；
- 原版商人出现/消失概率与生命周期；
- 粮价每月变化的精确转移概率。

来源：
- 《三國志11 with パワーアップキット》官方说明书
  https://cdn.akamai.steamstatic.com/steam/apps/628070/manuals/32sangokushi11wpk_manual.pdf
- 311SireCustomizedPackageDev：`struct_city.TradePrice / HasMerchant / CityActions`、`0047B6F0`、`0047BD50`
  https://github.com/sean2077/311SireCustomizedPackageDev
- 311MemoryResearch：商人执行路径 `005CAD1B`
  https://github.com/sjn4048/311MemoryResearch
- 游民星空 2007 大样本交易实测
  https://www.gamersky.com/handbook/200712/89446.shtml
- 日文 Wiki 内政 / 相场
  https://w.atwiki.jp/sangokushi11/pages/74.html
- 日文 Wiki 各种经验
  https://w.atwiki.jp/sangokushi11/pages/79.html

## 9. 行动力

`[COMMON/PK][empirical-exact formula + reverse-engineered-structure + PK cross-validation]`

这一项的主体公式不是 PC-PK1.1 完整函数体逆向，而是 2006 年后期的大量实测精确公式；2023 年又用 PK 存档和符节台重新复算。SIRE 的结构体/函数地址进一步确认了“行动力按军团保存、军师按势力保存”的底层结构。

### 9.1 每旬结算与 255 上限

官方说明书确认：

```text
1回合 = 10天
行动力每回合恢复
行动力最大值 = 255
未使用的行动力可累积
```

因此：

```ts
currentAP = min(255, previousRemainingAP + recoveredAP)
```

SIRE 结构进一步确认行动力属于军团：

```text
struct_corp +0x2C ActionPoints
0047E3E0 SetCorpsActionPoints
005B9340 DeductCorpActionPoints
```

所以不是整个势力只有一个共用 AP 池。

### 9.2 每旬恢复的核心公式

对一个军团：

```ts
coreRecovery = floor(
  (leaderParam + cityParam + officerParam)
  * adviserParam
)

[PK] recoveredAP =
  coreRecovery
  + 5 * completedTalismanPlatformsInThisCorps
```

最终再与上回合剩余行动力相加并封顶255。

### 9.3 君主 / 都督参数

第一军团使用君主；委任军团使用该军团的军团长/都督。

令：

```ts
A = max(leadership, charisma)
band = max(floor(A / 5) - 6, 0)
leaderParam = 26 + band
```

这与旧写法完全等价：

```text
40 × [0.65 + 0.025 × (floor(A/5)-6)]
```

其中负值部分按0处理。

正常0～100能力范围下：

| 统率/魅力较高值 | leaderParam |
|---:|---:|
| 0～34 | 26 |
| 35～39 | 27 |
| 40～44 | 28 |
| ... | ... |
| 95～99 | 39 |
| 100 | 40 |

因此只看统率与魅力两者较高项；武力、智力、政治不进入这一项。

2006年3月的早期探索曾误以为“多项高能力”共同影响行动力；6月的后续专项实测已经明确推翻，C9 以6月精确公式为准。

### 9.4 城市参数

```ts
cityParam = min(10 * (corpsCityCount - 1), 50)
```

即：

```text
1城 -> 0
2城 -> 10
3城 -> 20
...
6城及以上 -> 50
```

这里按**当前军团**控制的城市数计算；第一军团即玩家直辖城市。城市本身是哪一座不重要，只看数量。

### 9.5 武将参数

对该军团可计入的城、港、关，先把每个据点人数截到10：

```ts
countAtBase = min(officersAtBase, 10)
```

再从人数最多的据点中取前6个求和：

```ts
officerParam = sum(top6(countAtBase))
```

所以最大：

```text
6 × 10 = 60
```

君主、军师都算人头；武将身份和五维不影响这一项。

港/关的证据边界要特别写清：

- 港/关本身不会增加 `cityParam`；
- 港/关驻将可以增加 `officerParam`；
- 实测要求其所属母城也在本势力控制下，单独占港/关而母城不属于本势力时不计；
- “母城与港关被人为拆到同势力不同军团”这一极端配置，公开资料没有独立回归，因此不要把跨军团母城条件写成源码 confirmed。

### 9.6 军师参数

`struct_force` 只有一个势力级：

```text
+0x08 AdvisorID
```

而 `struct_corp` 没有独立军师字段。这与实测“所有军团共用势力军师”一致。

无军师：

```ts
adviserParam = 1.0
```

有军师：

```ts
intelBand = floor(adviserIntelligence / 2)
adviserParam = 1.2 - 0.01 * (50 - intelBand)
// 等价：0.70 + 0.01 * intelBand
```

常见值：

| 军师智力 | adviserParam |
|---:|---:|
| 70 | 1.05 |
| 80 | 1.10 |
| 90 | 1.15 |
| 100 | 1.20 |

公式理论上在智力低于60时会低于1.0，但正常游戏任命军师本身要求智力至少70，因此“低智军师反而减成”主要是编辑器/MOD边界，不是正常流程。

军师和君主/都督的亲爱、义兄弟、厌恶关系不影响该倍率。

### 9.7 最终乘算向下取整

最终核心恢复量取整数向下。

PK 实测给出非常好的边界例：

```text
刘禅参数 30
直辖3城 -> 20
武将参数 -> 22
诸葛亮军师 -> 1.20

(30+20+22) × 1.20
= 86.4
-> 核心恢复 86
```

这直接证明最终乘算不是四舍五入。

### 9.8 PK 符节台的插入位置

同一实测中，宛城有1座符节台，游戏实际增加91：

```text
核心公式 86
+ 符节台 5
= 91
```

因此符节台不是先进入军师倍率，而是在核心乘算并取整后追加：

```ts
recoveredAP = floor(base * adviserParam) + 5 * platformCount
```

如果把 +5 放在乘算前，诸葛亮1.2会算出92而不是91，所以插入位置可以视为高置信实测。

### 9.9 “新增行动力上限180”的正确版本边界

无印核心公式的理论最大值：

```text
leader 40
+ city 50
+ officer 60
= 150

150 × 1.20
= 180
```

所以2006资料写“每回合新增最多180”对**无印核心公式**是正确的。

但 PK 符节台是核心公式之后再加，因此不能把180当作 PK 的统一恢复硬上限。当前明确的最终限制仍是：

```text
当前军团行动力 <= 255
```

### 9.10 委任军团独立计算

SIRE 数据结构：

```text
struct_corp.CorpsLeaderID
struct_corp.ActionPoints
struct_corp.PersonList
struct_force.AdvisorID
```

与长期实测完全一致：

- 每个军团有自己的行动力池；
- 每个军团分别按自己的城市数、据点武将数计算；
- 第一军团用君主作为 leader；
- 委任军团把君主替换为该军团长/都督；
- 势力军师是全军团共用倍率。

因此把超过6城的后方城市拆成委任军团，确实可能提高全势力所有军团行动力之和，但玩家在 PC 版并不能像第一军团一样自由消费委任军团的全部行动力。

### 9.11 C9 当前结论

已经锁定：

- 行动力按军团独立保存；
- 每旬恢复、剩余可累积、最终上限255；
- 君主/都督参数只看统率与魅力较高项；
- 城市参数每多1城+10，最多50；
- 武将参数取据点前6名、每据点最多10，最大60；
- 港/关只通过驻将影响武将参数，不直接增加城市参数；
- 军师是势力级单一 AdvisorID，所有军团共用；
- 军师倍率为线性0.01步进，智力100=1.20；
- 核心乘算结果向下取整；
- PK符节台在取整后每座+5；
- 委任军团用军团长替换君主独立计算；
- 无印核心恢复最大180，但180不能当作PK含符节台后的统一硬上限。

证据等级仍不是“完整函数逐指令 reverse-engineered”，而是：

```text
empirical-exact formula
+ reverse-engineered data structure
+ PK save cross-validation
```

仍 open：

- PC-PK1.1 行动力恢复主函数的完整反汇编地址/函数体；
- 跨军团拆分母城与附属港关时，港关驻将计数的极端边界；
- 官职/宝物导致的显示能力修正究竟读取 base 还是 affected display stat 的逐指令确认。

来源：
- 《三國志11 with パワーアップキット》官方说明书：每旬恢复、最大255
  https://cdn.akamai.steamstatic.com/steam/apps/628070/manuals/32sangokushi11wpk_manual.pdf
- 游侠 2006-06-14《行动力计算详解》：精确四参数公式及指令AP表
  https://game.ali213.net/thread-988399-1-1.html
- 游侠《311中文版新手入门技术》：公式交叉整理
  https://game.ali213.net/forum.php?mod=viewthread&tid=1075291
- 游民星空 2006-03-23 早期研究：早期影响因素与存量累积实测（其中能力解释已被6月资料纠正）
  https://www.gamersky.com/handbook/200603/21611.shtml
- Bilibili 2023 PK存档复算：符节台+5位于核心乘算取整之后、军团独立计算
  https://www.bilibili.com/opus/828103788131778665
- 日文 Wiki 内政：行动力影响因素与符节台
  https://w.atwiki.jp/sangokushi11/pages/74.html
- 311SireCustomizedPackageDev：`struct_force.AdvisorID`、`struct_corp.CorpsLeaderID/ActionPoints/PersonList`、`0047E3E0`、`005B9340`
  https://github.com/sean2077/311SireCustomizedPackageDev
- 311MemoryResearch：`004A1820` 军团行动力修改点、`005B9340` 扣行动力路径
  https://github.com/sjn4048/311MemoryResearch

## 10. 治安

`[COMMON/PK][mixed: PC-PK1.1 reverse-engineered + official-confirmed + empirical-high patrol]`

治安不是单一“防贼数值”。原作里它同时进入：

1. 城市金收入；
2. 城市粮收入；
3. 征兵数量；
4. 征兵后的新兵初始气力；
5. 贼 / 异民族根城生成门槛；
6. 换季自然下降。

但目前**没有可靠证据证明治安直接改变瘟疫/蝗灾的发生概率**；自然灾害放到 C11 单独处理。

### 10.1 运行时字段与范围

SIRE 结构确认：

```text
struct_city +0x85 CitySecurity
0047BD70 SetCityPublicOrder
```

游戏正常范围为：

```text
0 <= security <= 100
```

### 10.2 巡查命令边界

官方说明书确认：

```text
费用：100金
行动力：20
期间：无（即时）
执行武将：最多3人
每都市每旬只能执行1次
```

且：

- 巡查看执行武将的**统率合计**；
- 都市周围2格有敌军时仍可执行，但治安上升值变小；
- 治安达到80以上即可避免新的普通贼根城生成。

结构上：

```text
struct_city.CityActions bit0 = 已巡查
004815F0 SetCityPatrolStatus
```

因此“每旬一次”不是 UI 约定，而是城市状态。

### 10.3 巡查治安上升公式

`[COMMON][empirical-high]`

长期日文实测给出的普通状态公式：

```ts
patrolGain = floor(sumLeadership / 28) + 2
```

其中 `sumLeadership` 是最多3名执行武将的统率合计。

锚点：

| 统率合计 | 基础治安上升 |
|---:|---:|
| 0～27 | 2 |
| 28～55 | 3 |
| 56～83 | 4 |
| 84～111 | 5 |
| 140 | 7 |
| 196 | 9 |
| 252 | 11 |
| 280～300 | 12 |

正常能力上限下三人统率合计最多300，因此普通巡查理论最大上升为12；最终仍受治安100封顶。

官方说明书只给出“敌军在都市周围2格时上升量减少”；同期玩家实测称巡查效果约减半。由于当前公开逆向只定位到巡查执行点 `005CBF95`，没有展开完整公式体，所以当前 fidelity 可采用：

```ts
if (enemyWithin2) {
  patrolGain = floor(patrolGain / 2)
}
```

但这条的**奇数取整边界仍标 empirical-high**，不能写成源码 confirmed。

### 10.4 征兵量如何吃治安

`[PC-PK1.1][confirmed-by-disassembly]`

C4 / 军事规则已经锁定征兵核心：

```ts
C = sumCharismaOfUpTo3Officers
O = city.security

A = 1000 + floor((O + 20) * C / 20)
```

随后才进入名声、兵舍等级、超级AI、兵临城下和兵力上限修正。

所以治安并不是仅在80这个门槛上起作用；从0到100都直接影响征兵基础量。

例如同样 `C=300`：

```text
治安100 -> 1000 + 120*300/20 = 2800
治安80  -> 1000 + 100*300/20 = 2500
治安50  -> 1000 +  70*300/20 = 2050
```

### 10.5 征兵导致的精确治安下降

`[PC-PK1.1][confirmed-by-disassembly]`

`005C3A50` 在所有征兵量修正完成之后，使用**实际最终增加进城市的兵力**计算治安损失：

```ts
C = sumCharismaOfExecutingOfficers
orderLoss = floor(actualRecruited / (C + 100))
security -= orderLoss
```

这里的 `actualRecruited` 已经经过：

- 名声倍率；
- 兵舍等级；
- 超级难度 AI 倍率；
- 兵临城下减半；
- 城市兵力上限裁剪。

因此名声没有另一条隐藏的“治安再×1.5”代码。

正确顺序是：

```text
名声 -> 征兵数×1.5
↓
使用放大后的实际征兵数计算治安下降
```

所以常见体验上治安损失也约放大1.5倍。

例：治安100、三名魅力100、Lv3兵舍：

```text
无名声：4200兵 -> floor(4200/400)=10治安
有名声：6300兵 -> floor(6300/400)=15治安
```

这与同期玩家记录完全吻合。

### 10.6 征兵还会用征兵前治安决定新兵气力

`[PC-PK1.1][confirmed-by-disassembly]`

在扣除本次征兵导致的治安之前，源码先读取当前治安：

```ts
newRecruitMorale = floor(preRecruitSecurity / 2)
```

然后与原驻军气力按新旧兵力人数加权混合；最终城市气力最低保证20。

所以顺序是：

```text
旧治安
→ 算新兵气力
→ 混合城市气力
→ 再按实际征兵数扣治安
```

### 10.7 治安对金 / 粮收入

`[PC-PK1.1][reverse-engineered]`

C1 / C2 已经锁定：

```ts
effectiveSecurity = max(city.security, 50)
```

金收入和粮收入都在难度修正后再乘：

```ts
effectiveSecurity / 100
```

因此：

- 治安100 -> 100%收入；
- 治安80 -> 80%；
- 治安50 -> 50%；
- 治安0～49 -> 都按50%，不会继续降到零收入。

这也纠正了“治安<80收入突然腰斩”的说法：**80不是收入断点，只是贼生成安全线；收入在50～100之间线性变化。**

### 10.8 季初自然下降

`[PC-PK1.1][reverse-engineered]`

原函数：

```text
0058D6D0 季初城市治安下降
```

只在：

```text
1月1日 / 4月1日 / 7月1日 / 10月1日
```

执行。

若没有被 PK“整备政令”挡掉：

```ts
C = governor ? governor.charisma : 0
base = floor(max(1, 90 - C) / 10)
loss = min(5, base + GetRandomX(3))
// GetRandomX(3) = 0,1,2
```

分布：

| 太守魅力 | 换季自然下降 |
|---:|---|
| 81+ | 0 / 1 / 2，各1/3 |
| 71–80 | 1 / 2 / 3，各1/3 |
| 61–70 | 2 / 3 / 4，各1/3 |
| 51–60 | 3 / 4 / 5，各1/3 |
| 41–50 | 4：1/3；5：2/3 |
| 0–40 | 固定5 |
| 无太守 | 固定5 |

所以太守魅力是**十点档阶梯**，不是连续线性。

### 10.9 PK 整备政令

`[PK][reverse-engineered]`

原函数在计算太守魅力前检查技巧 `0x22 = 整备政令`：

```ts
if (hasAdministrativeReform && ProbabilityCheck(50)) {
  seasonalLoss = 0
} else {
  seasonalLoss = seasonalLossByGovernorCharisma()
}
```

`ProbabilityCheck(50)` 是精确50%概率。

所以整备政令不是：

```text
自然下降值减半
```

而是：

```text
50%整次跳过换季下降
50%照原公式下降
```

### 10.10 季初收入与自然下降的调用顺序

C1 月度主函数已恢复顺序：

```text
城市金收入
→ 城市粮收入
→ 季初自然治安下降
→ 港关收入
→ 后续支出
```

因此 1/4/7/10 月1日的**城市本体本次收入使用下降前的治安**。

换季治安下降不会反过来重算刚刚已经结算的城市收入。

### 10.11 贼 / 异民族根城

`[COMMON][official-confirmed threshold + empirical-high behavior]`

官方说明书明确：

```text
治安 >= 80
→ 不会新生成普通贼根城
```

日文 Wiki 与长期实测补充：

- 治安 <80 时才进入新的贼 / 异民族根城生成可能；
- 根城已经生成后，把治安重新拉到100**不会自动拆掉根城**；
- 根城仍可继续刷新部队，必须摧毁根城本体；
- 普通贼通常为剑兵；
- 乌丸、羌多为骑兵；山越、南蛮多为枪/戟；
- 贼/异民族攻陷城市后，该城变成空白城市，而不是形成普通势力。

具体每旬生成概率、根城候选格、生成部队兵力/武将、刷新周期仍 open。

### 10.12 亲○ / 威压的边界

`[COMMON][mixed evidence]`

日文 Wiki 长期实测：

- 亲乌：阻止所属都市对应的乌丸根城；
- 亲羌：阻止羌；
- 亲越：阻止山越；
- 亲蛮：阻止南蛮；
- 这些特技**不阻止普通治安自然下降，也不阻止普通贼**。

“威压”存在早期资料与后期实测冲突：

- 2006早期攻略曾写成“阻止贼根城、对异民族有BUG”；
- 后期日文 Wiki 实测与 SIRE 参数化更支持：威压不是100%防止，而是把安全阈值从治安80降低到约60。

因此当前 fidelity 不应把威压写成绝对免疫。推荐：

```text
PC-PK1.1 default：按 threshold 80 -> 60 的 empirical-high 规则
并保留版本回归标记
```

### 10.13 与自然灾害严格分离

低治安与瘟疫/蝗灾是否有关，旧玩家讨论长期存在“感觉更容易发生”的说法，但没有稳定公式或当前逆向证据支持。

因此：

```text
治安 <80 -> 贼/异民族根城风险
```

可以写死；

但：

```text
治安越低 -> 瘟疫/蝗灾概率越高
```

目前**不能**写成原作规则。灾害进入 C11 专项。

### 10.14 C10 当前结论

已经锁定：

- `CitySecurity` 是独立城市运行时字段，正常0～100；
- 巡查100金、20AP、最多3人、每城市每旬一次；
- 普通巡查上升 `floor(统率和/28)+2`，正常最高12，标 empirical-high；
- 敌军2格内巡查效果降低，当前半减规则标 empirical-high；
- 治安直接进入征兵量公式；
- 征兵掉治安精确为 `floor(actualRecruited/(魅力和+100))`；
- 名声通过实际征兵数间接放大治安损失，不存在第二次独立1.5倍；
- 新兵初始气力使用征兵前治安的一半；
- 收入治安倍率最低按50，50～100线性；
- 80只是贼生成安全线，不是收入断点；
- 换季自然下降精确公式及太守魅力分布；
- PK整备政令精确50%整次免降；
- 季初城市收入先于自然下降结算；
- 已出现根城不会因治安恢复而自动消失。

仍 open：

- 巡查在敌军2格内的精确整数取整顺序；
- PC-PK1.1 巡查治安上升完整函数体；
- 贼/异民族根城每旬生成概率、候选格算法、刷新周期与兵力；
- 威压不同 PC 版本的精确边界；
- 任何“治安影响自然灾害概率”的直接公式。

来源：
- 官方 PK 说明书：巡查100金/20AP/最多3人/每旬一次、统率合计、治安80防贼、敌军2格效果下降
  https://cdn.akamai.steamstatic.com/steam/apps/628070/manuals/32sangokushi11wpk_manual.pdf
- 311MemoryResearch `Func-内政01-计算征兵数量.txt` / `Func-内政02-执行征兵.txt`
  https://github.com/sjn4048/311MemoryResearch
- 311MemoryResearch `Func-自动05-城市治安下降.txt`
  https://github.com/sjn4048/311MemoryResearch
- 311SireCustomizedPackageDev：`CitySecurity` / `CityActions bit0` / `SetCityPatrolStatus` / `SetCityPublicOrder`
  https://github.com/sean2077/311SireCustomizedPackageDev
- 日文 Wiki：巡查公式、贼/异民族、亲○与威压长期实测
  https://w.atwiki.jp/sangokushi11/pages/74.html
  https://w.atwiki.jp/sangokushi11/pages/13.html
  https://w.atwiki.jp/sangokushi11/pages/1239.html
- 2ch旧实测：敌军逼城时巡查/征兵效果约半减
  https://w.atwiki.jp/sangokushi11/pages/1941.html
- SIRE v1.26 参数说明：换季治安上限、整备政令概率、巡查倍率、威压阈值参数
  https://dl.3dmgame.com/patch/26091.html

## 11. 灾害

`[COMMON][confirmed mechanism]`

随机自然灾害主要是**蝗灾、疫病**；不要把地图上的堤防水攻误建模成随机“洪水/台风/地震”。

- 蝗灾：破坏农田并造成粮食损失；Lv3 农场可避免被拆。现有技巧点扣减按已核对表处理。
- 疫病：减少城市驻兵并恶化武将健康。
- 丰收：作为正面季节事件提高粮产。

来源：https://w.atwiki.jp/sangokushi11/pages/74.html

具体发生率、疫病逐旬兵损、丰收倍率的版本化精确值仍保留 empirical/open。
