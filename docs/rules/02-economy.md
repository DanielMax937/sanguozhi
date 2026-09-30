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

`[PK][confirmed]`

市场、农场、兵舍、锻冶、厩舍可合并：

- Lv2 = Lv1 效果 ×1.2
- Lv3 = Lv1 效果 ×1.5
- 合并过程中仍按合并前等级生效
- 政治 ≥70 时可一旬完成吸收

来源：https://w.atwiki.jp/sangokushi11/pages/74.html

## 7. 建设时间

`[COMMON/PK设施同公式][confirmed]`

综合政治：

`最高政治 + (其他两人政治之和)/3`

四舍五入。各设施 10/20/.../100 日门槛沿用现有已核对表。

来源：https://w.atwiki.jp/sangokushi11/pages/74.html

## 8. 商人 / 粮食交易

机制与公式已从 provisional 升为 `[empirical-high]`。

### 买粮

`买入粮 = 支付金 × 粮价 × 交易效果`

### 卖粮

`卖粮所得金 = 卖出粮 ÷ 粮价 × 交易效果 × 0.8`

结论：

- 买粮没有固定 20% 损失。
- **卖粮固定损失名义所得的 20%**。
- 政治 50 时交易效果 = 100%。
- 政治越高交易效果越高，而且是非线性；UI 显示值会截断/近似，不应反推为真实计算值。
- 例：政治 97/98/99 的实测实际交易效果约 113.3154% / 113.6374% / 113.9612%。

来源（游民星空实测）：https://www.gamersky.com/handbook/200712/89446.shtml
交叉核对：https://w.atwiki.jp/sangokushi11/pages/74.html

### 尚未 confirmed

政治 → 交易效果的**精确闭式函数**仍未取得；因此引擎应使用实测 lookup/interpolation，而不是文章中的线性近似式冒充内部公式。

## 9. 行动力

`[COMMON][empirical-high]`

2006 年原版时期的逆向研究给出了完整公式，2023 年又用多个实际存档（包括 PK 符节台）复算成功，因此从 open 升级为高置信实测规则。

### 每旬新增行动力

```
base = rulerParam + cityParam + officerParam

newAP = floor(base * adviserParam)

[PK] newAP += 5 * talismanPlatformCount
```

当前行动力：

`currentAP = min(255, previousRemainingAP + newAP)`

### 君主 / 都督参数

```
ability = max(统率, 魅力)
abilityParam = floor(ability / 5)
step = max(abilityParam - 6, 0)

rulerParam = 40 * (0.65 + 0.025 * step)
```

边界：
- 统率/魅力最高项 ≤34：26
- 35：27
- 此后每跨 5 点 +1
- 100：40

军团独立计算时，以**都督**代替君主计算该项。

### 城市参数

`cityParam = min(10 * (directCityCount - 1), 50)`

- 1 城：0
- 2 城：10
- …
- 6 城及以上：50

只算该军团/直辖军团实际支配的城市。

### 武将参数

取该军团所属、且其主城也在本军团控制下的城市/港/关：

1. 每个据点最多计 10 名武将；
2. 按据点武将数由高到低取前 6 个；
3. 相加，最大 60。

君主、军师也算人头；武将能力本身不影响这一项。

### 军师参数

无军师：

`adviserParam = 1.0`

有军师：

```
intParam = floor(军师智力 / 2)
adviserParam = 1.2 - 0.01 * (50 - intParam)
```

例如：
- 智力100 → 1.20
- 智力60 → 1.00
- 低于60时甚至不如不设军师

所有军团共用势力军师修正。

### PK 符节台

每座符节台最终固定 **+5 行动力**，是在前面乘算并取整之后追加。

实测例：刘禅直辖3城，君主30 + 城20 + 武将22，诸葛亮1.2：

`floor((30+20+22)*1.2)=86`

另有1座符节台 → 91，与游戏显示一致。

来源：
- 2006 原版逆向：https://game.ali213.net/thread-988399-1-1.html
- 存档复算与 PK 符节台验证：https://www.bilibili.com/opus/828103788131778665
- 游民星空早期实测（影响因素交叉核对）：https://www.gamersky.com/handbook/200603/21611.shtml

> 证据等级保持 `empirical-high` 而非 `confirmed`：公式来自逆向/复算而非官方源码，但已跨原版时期与 PK 存档相互验证。

## 10. 治安

- 治安影响收入和征兵量。
- 巡查提高治安；征兵降低治安。
- `[PK][empirical-high/reverse]` 政令整备并非“绝对不下降”；原文是“治安更不容易下降”。SIRE 暴露了独立的“有政令整备时本季不下降概率”参数，长期社区整理指向默认约 **50%**。

### 换季自然下降

`[PC-PK1.1][reverse-engineered]`

311MemoryResearch 已逆出原函数 `0058D6D0`。自然治安下降只在 **1/4/7/10 月月初**执行。

若没有触发 PK“政令整备”的免降判定，精确式为：

```ts
C = governor ? governor.charisma : 0
base = floor(max(1, 90 - C) / 10)
loss = min(5, base + GetRandomX(3)) // GetRandomX(3) = 0..2
```

因此未触发政令整备时的分布为：

| 太守魅力 | 自然下降 |
|---:|---|
| 81+ | 0 / 1 / 2，各1/3 |
| 71–80 | 1 / 2 / 3，各1/3 |
| 61–70 | 2 / 3 / 4，各1/3 |
| 51–60 | 3 / 4 / 5，各1/3 |
| 41–50 | 4：1/3；5：2/3 |
| 0–40 | 固定5 |
| 无太守 | 固定5 |

所以魅力影响是**阶梯式**而非连续线性：大约每跨 10 点才改变一档；魅力81～100最终同为 `0/1/2`。

来源：
- https://github.com/sjn4048/311MemoryResearch/blob/master/内存资料/整理/Func-自动05-城市治安下降.txt
- https://github.com/sean2077/311SireCustomizedPackageDev/blob/dev/material/内存地址汇总.md
- https://w.atwiki.jp/sangokushi11/pages/1152.html

Vanilla 尚未取得 EXE 级复核；无印时期实测与这套公式的边界完全吻合，因此暂按 `empirical-high / compatibility-assumption` 复用基础公式。

### PK 政令整备

`[PK][reverse-engineered]`

原函数在自然下降计算**之前**检查“政令整备”，直接调用：

```text
ProbabilityCheck(50)
```

命中则立即返回，本季自然治安下降为0；未命中才执行上面的太守魅力公式。

因此它不是“下降值×0.5”，而是：

```ts
if (hasAdministrativeReform && ProbabilityCheck(50)) {
  loss = 0
} else {
  loss = seasonalLossByGovernorCharisma()
}
```

其中 `004721D0 ProbabilityCheck(p)` 的逆向定义就是生成0～99随机数并判断是否小于 `p`，所以 **50% 是精确常量**，不是约数。

### 贼与异民族

`[COMMON][confirmed mechanism / empirical-high behavior]`

- 治安 **<80** 时，领内才可能生成贼或异民族**根城**。
- 根城一旦出现，即使治安恢复到100，也会继续生成部队，直到根城被摧毁。
- 普通贼为剑兵。
- 北方乌丸、羌使用骑兵；南方山越、南蛮使用枪/戟。
- 贼/异民族若攻陷城市，该城变为**空白都市**，不是建立正常势力。

来源：https://w.atwiki.jp/sangokushi11/pages/74.html

生成概率、根城选格和每次兵力仍 open。

## 11. 灾害

`[COMMON][confirmed mechanism]`

随机自然灾害主要是**蝗灾、疫病**；不要把地图上的堤防水攻误建模成随机“洪水/台风/地震”。

- 蝗灾：破坏农田并造成粮食损失；Lv3 农场可避免被拆。现有技巧点扣减按已核对表处理。
- 疫病：减少城市驻兵并恶化武将健康。
- 丰收：作为正面季节事件提高粮产。

来源：https://w.atwiki.jp/sangokushi11/pages/74.html

具体发生率、疫病逐旬兵损、丰收倍率的版本化精确值仍保留 empirical/open。
