# P0-2 外交公式的版本边界

更新：2026-10-01。E20 后 exactness-gap 清理第2项。

## 1. 本轮结论

本轮不重新发明亲善 / 同盟 / 停战 / 俘虏交换 / 劝降公式，而是把它们绑定到**正确的版本证据层**。

最重要的版本事实：

~~~text
Vanilla 1.0
↓
Vanilla 1.1
  官方明确：势力间友好增减平衡调整
↓
Vanilla 1.2
  官方明确：
  - 再次调整势力间友好增减
  - 调整计略・外交成功率
↓
Vanilla 1.3 / 1.3.1 / 1.3.2 / 1.3.3
  官方公开变更项没有再列外交成功率或友好度调整

PK
  新增“超级”难度
  ↓
  现有完整外交公式族包含
  t = 1.0 / 0.8 / 0.7
  对应初级 / 上级 / 超级
~~~

所以：

> **现有带“超级=0.7”的完整公式族不能作为 Vanilla 1.0/1.1 的原版公式证据。**

它至少属于 PK 时代的公式语境。

## 2. Vanilla 1.1：只确认“友好度平衡变了”

KOEI 官方 Vanilla Ver.1.1（2006-04-10）更新说明明确列出：

~~~text
以下を調整しました
...
勢力間の友好の増減バランス
~~~

但没有写：

~~~text
外交成功率
~~~

因此版本差异矩阵必须区分：

~~~text
friendshipDelta
diplomacySuccess
~~~

不能把 Ver.1.1 粗暴理解成“整套外交公式已经变成后期公式”。

当前证据：

~~~text
Vanilla 1.0 -> 1.1:
friendship balance changed = official-confirmed
diplomacy success changed = not stated / unknown
~~~

## 3. Vanilla 1.2：成功率确认发生过一次版本切换

KOEI 官方修正历史明确：

~~~text
Ver.1.2（2006-05-01）

以下を調整しました
・君主毎の戦略傾向
・勢力間の友好の増減バランス
・攻撃などによるダメージバランス
・部隊撃破時に獲得する金・兵糧の量
・計略・外交の成功率
~~~

因此：

~~~text
Vanilla 1.1
!=
Vanilla 1.2
~~~

至少在：

~~~text
friendship balance
strategy/diplomacy success-rate balance
~~~

上有官方确认差异。

这是 P0-2 最重要的版本锚点。

## 4. Vanilla 1.3～1.3.3：没有公开的后续外交专项调整

官方完整修正历史：

### Ver.1.3（2006-07-06）

公开列出的主要变化：

- AI/操作性；
- 一些寿命；
- 少兵混乱；
- 上级势力协作等。

没有单列：

~~~text
友好增减
外交成功率
~~~

### Ver.1.3.1（2006-09-06）

公开：

- 即时登用功绩/魅力EXP；
- 军团城市选择；
- 夏侯惇CG；
- 单挑平衡。

没有外交专项。

### Ver.1.3.2（2006-10-18）

公开：

- 中地图；
- 强运单挑战死；
- 新武将相性；
- 火神火计判定。

没有外交专项。

### Ver.1.3.3（2007-03-14）

公开：

- 兵粮；
- 怒发；
- 贯矢技巧P；
- 势力灭亡设施；
- Vista/影片；
- 新武将义兄弟年龄条件。

没有外交专项。

因此可以建立：

~~~text
vanilla-pc-1.2-plus
~~~

作为“**自1.2后没有公开外交专项变更**”的版本族。

但标签必须是：

~~~text
stable-by-public-changelog
~~~

而不是：

~~~text
binary-identical
~~~

原因是每版仍有“细微修正及调整”条款，没有逐版本 EXE diff 就不能逻辑证明外交函数字节完全没动。

## 5. PK 的超级难度是新增加的

4Gamer 当年 PK 评测明确写：

~~~text
最高难度“超级”新增
~~~

所以 Vanilla 无印只有旧难度集合；“超级”不是 Vanilla 1.0/1.1 的可选难度。

而我们现有完整外交公式族明确使用：

~~~text
t =
初级 1.0
上级 0.8
超级 0.7
~~~

且长期转载资料直接以：

~~~text
PK版超级难度
~~~

作为问题场景。

因此该公式族的最安全证据标签是：

~~~text
pk-era-formula-corpus
~~~

而不是：

~~~text
all-PC-versions
~~~

## 6. 现有完整公式族保留，但绑定 PK profile

当前项目保留以下公式族。

### 6.1 亲善

~~~text
friendshipGain =
(
  c*20
  + max(POL - affinityDiff/2, 0)
  + 100
) / 10
~~~

关系 c：

~~~text
义兄弟 / 配偶 / 目标君主亲爱执行者：1.5
目标君主嫌恶执行者：-1
其他：1
~~~

难度：

~~~text
初级 1.0
上级 0.8
超级 0.7
~~~

### 6.2 同盟

~~~text
V =
(
  gold/150
  + POL
  - affinityDiff/5
  + c*10
) * t
~~~

成功：

~~~text
V > (100-friendship)*2
~~~

次级阈值：

~~~text
V > (80-friendship)*2
~~~

### 6.3 停战

~~~text
V =
(
  gold/400
  + POL
  - affinityDiff/5
  + c
) * t
~~~

成功：

~~~text
V >
80
+ ceasefirePeriod/2
- friendship/4
~~~

次级：

~~~text
70
+ ceasefirePeriod/2
- friendship/4
~~~

### 6.4 俘虏交换

~~~text
V =
(
  gold/200
  + prisonerFiveStatsSum/10
  + POL
  - affinityDiff/10
  + c
) * t
~~~

主要门槛：

~~~text
120
+ (bestStat^2 + secondStat^2)/400
- friendship/5
~~~

次级门槛把120换成110。

### 6.5 劝降

~~~text
B =
(
  (ourCities/theirCities)/2
  + (ourCities-theirCities)/5
  - affinityDiff*11/28
  + emperorBonus
  + executorCHA
  + relationC
) * t / 2

V = B + rand(B)
~~~

这些仍然是：

~~~text
empirical-high / historical-formula-corpus
~~~

不是原 EXE 函数体反汇编。

## 7. 不能把 PK 公式“删掉超级系数”就称为 Vanilla 公式

一个危险 fallback 是：

~~~ts
if (ruleset === "vanilla") {
  // 反正无超级
  // 把PK公式照抄，只允许 t=1.0/0.8
}
~~~

这只能叫：

~~~text
compatibility-assumption
~~~

不能叫：

~~~text
vanilla-original
~~~

因为官方已经证明：

~~~text
1.0 -> 1.1:
友好增减发生调整

1.1 -> 1.2:
友好增减再次调整
外交成功率发生调整
~~~

所以至少三个 Vanilla 阶段不是同一组常量。

## 8. 推荐 profile 现在拆成5层

旧四层 profile 收紧为：

~~~text
vanilla-pc-1.0
vanilla-pc-1.1
vanilla-pc-1.2-plus
pk-pc-formula-corpus
pk-pc-reverse-support
~~~

含义：

### vanilla-pc-1.0

~~~text
friendship:
  pre-1.1 unknown

diplomacySuccess:
  pre-1.2 unknown
~~~

禁止默认标成 PK 公式。

### vanilla-pc-1.1

~~~text
friendship:
  changed from 1.0
  exact constants unknown

diplomacySuccess:
  pre-1.2
  exact constants unknown
~~~

### vanilla-pc-1.2-plus

~~~text
friendship:
  changed again at 1.2

diplomacySuccess:
  changed at 1.2

1.3..1.3.3:
  no explicit later diplomacy-specific changelog
~~~

如果为了模拟闭环复用 PK formula：

~~~text
compatibilityAssumption = true
~~~

### pk-pc-formula-corpus

使用现有：

- 亲善；
- 同盟；
- 停战；
- 俘虏交换；
- 劝降；

公式。

支持超级0.7。

证据：

~~~text
historical/empirical formula corpus
~~~

### pk-pc-reverse-support

只放真正有 PC-PK1.1 地址证据的外交周边，例如：

~~~text
005BD040 GetDiplomacyActionPointCost
外交府：
外交AP减半
亲善费用减半
~~~

不要因为周边 helper 被逆出，就把整个外交成功率公式升级成 reverse-engineered。

## 9. PK 1.1 / 1.1.1 更新没有公开外交成功率调整

KOEI 官方 PK 修正页：

### PK Ver.1.1（2006-10-04）

列出的主要变化是：

- 数据编辑；
- 中地图；
- 太鼓台单挑成功率；
- 强运单挑战死；
- 新武将相性；
- 空白据点编辑；
- 部队移动算法。

没有外交成功率/友好度专项。

### PK Ver.1.1.1（2007-03-14）

列出：

- 兵粮；
- 怒发；
- 贯矢技巧P；
- 势力灭亡设施；
- Vista；
- 编辑器；
- 影片；
- 新武将义兄弟年龄。

同样没有外交专项。

因此：

~~~text
PK 1.0 -> 1.1 -> 1.1.1
~~~

可以标：

~~~text
no-explicit-diplomacy-change-in-public-changelog
~~~

但不能写：

~~~text
binary-confirmed-identical
~~~

## 10. PK 外交府边界保持独立

官方 PK 手册明确：

~~~text
外交府：
该城市的外交行动力减半
亲善所需金减半
~~~

它没有写：

~~~text
外交成功率提高
~~~

所以继续保持：

~~~text
diplomacyOffice.apMultiplier = 0.5
diplomacyOffice.amicabilityGoldMultiplier = 0.5
diplomacyOffice.successRateMultiplier = 1.0
~~~

最后一条的证据性质是：

~~~text
no-success-bonus-documented
~~~

不是“找到一条显式乘1.0指令”。

## 11. 主机版必须继续独立

PS2 / Wii：

- 难度；
- UI；
- 论客；
- 外交命令细节

存在平台差异资料。

没有足够证据把 PC PK 的完整公式常量直接宣称为主机版 identical。

因此：

~~~text
console-diplomacy = separate-profile / open
~~~

## 12. P0-2 本轮状态

### 已关闭 / 明确

- Vanilla 1.0/1.1/1.2 不能用一个无版本公式；
- 1.1 的官方外交相关变化是“友好增减平衡”；
- 1.2 官方明确又改友好度，并改“计略・外交成功率”；
- 1.3～1.3.3 没有公开外交专项变化；
- PK 新增超级，因此含0.7超级系数的完整公式族必须绑定 PK 时代；
- PK 1.1/1.1.1 没有公开外交专项变化；
- 外交府只确认 AP/亲善金钱减半，不增加外交成功率。

### 仍 open

1. Vanilla 1.0 的各外交 exact constants；
2. Vanilla 1.1 的友好增减 exact constants；
3. Vanilla 1.2 对各外交成功函数到底改了哪些常量；
4. Vanilla 1.2～1.3.3 的二进制是否真正完全相同；
5. PK 公式族来自 PK1.0、1.1 还是1.1.1中的哪一精确 build；
6. PK 与 Vanilla 1.2-plus 是否共享部分公式；
7. PS2 / Wii exact constants；
8. 现有历史公式族的原 EXE 函数入口和逐指令验证。

所以 P0-2 的状态是：

~~~text
version-boundary-resolved
constants-still-open
~~~

## 13. 来源

官方 Vanilla：
- https://www.gamecity.ne.jp/regist_c/user/san11/san11_update.htm
- https://www.gamecity.ne.jp/regist_c/user/san11/san11_update02_history.htm

官方 PK：
- https://www.gamecity.ne.jp/regist_c/user/san11/pk/san11pk_update.htm

PK 新增超级：
- https://www.4gamer.net/review/sangokushi11pk/sangokushi11pk.shtml

PK 手册外交府：
- https://cdn.akamai.steamstatic.com/steam/apps/628070/manuals/32sangokushi11wpk_manual.pdf

历史公式 corpus：
- https://game.ali213.net/forum.php?action=printable&mod=viewthread&tid=1262010
- https://www.ptt.cc/bbs/Koei/M.1217946021.A.1FA.html
- https://zhidao.ali213.net/q/13047392.html
