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

## 2. 内政设施

无印共有：市场、造币、农场、谷仓、兵舍、锻冶、厩舍、工房、造船。

`[PK][confirmed]` 新增：大市场、鱼市场、黑市、军屯农、练兵所、符节台、军事府、人才府、外交府、计略府。

### PK 已确认细节

- 大市场：大都市限定；不吃造币加成。
- 鱼市场：有港城市限定；不吃造币加成。
- 黑市：低成本，次年 1 月强制撤去；不会额外降低治安。
- 军屯农：季度产粮，兵 ≤15000 时 1500；超过时约为驻兵 10%。
- 练兵所：训练效果 +50%；舰船制造日数缩短 20 日。
- 符节台：行动力恢复 +5；多城可叠加，并加快俘虏忠诚下降。
- 军事府：军事指令行动力减半；陷阱/军事设施建设费 -20%。
- 人才府：人才指令行动力减半；**技巧研究时间固定缩短 20 日**。
- 外交府：外交行动力减半；亲善费用减半。
- 计略府：计略行动力减半；提高流言成功率（精确概率增量仍未 confirmed）。

来源：https://w.atwiki.jp/sangokushi11/pages/74.html

## 3. PK 吸收合并

`[PK][confirmed]`

市场、农场、兵舍、锻冶、厩舍可合并：

- Lv2 = Lv1 效果 ×1.2
- Lv3 = Lv1 效果 ×1.5
- 合并过程中仍按合并前等级生效
- 政治 ≥70 时可一旬完成吸收

来源：https://w.atwiki.jp/sangokushi11/pages/74.html

## 4. 建设时间

`[COMMON/PK设施同公式][confirmed]`

综合政治：

`最高政治 + (其他两人政治之和)/3`

四舍五入。各设施 10/20/.../100 日门槛沿用现有已核对表。

来源：https://w.atwiki.jp/sangokushi11/pages/74.html

## 5. 商人 / 粮食交易

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

## 6. 行动力

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

## 7. 治安

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

## 8. 灾害

`[COMMON][confirmed mechanism]`

随机自然灾害主要是**蝗灾、疫病**；不要把地图上的堤防水攻误建模成随机“洪水/台风/地震”。

- 蝗灾：破坏农田并造成粮食损失；Lv3 农场可避免被拆。现有技巧点扣减按已核对表处理。
- 疫病：减少城市驻兵并恶化武将健康。
- 丰收：作为正面季节事件提高粮产。

来源：https://w.atwiki.jp/sangokushi11/pages/74.html

具体发生率、疫病逐旬兵损、丰收倍率的版本化精确值仍保留 empirical/open。
