# E20 委任 AI 权重 / 决策架构

更新：2026-10-01。主目标：PC-PK1.1 委任军团 / COM AI 的真实决策结构。

## 1. 本轮结论：不存在应被复刻成“一张全局 utility 权重表”的已知原作结构

旧问题常写成：

> 巡查、征兵、建设、运输、出兵分别多少分？AI 每回合把所有动作打分后取最高吗？

E20 的逆向结论是：

**至少已经恢复的战争与野外行动部分，不是这种结构。**

当前 PC-PK1.1 证据显示的是一组专用流程：

~~~text
军团/部队筛选
→ 当前任务方针检查与改写
→ 出兵合法性 / 资源硬门槛
→ 难度、君主野望、战略倾向、城市态势修正
→ 出兵概率
→ 计划兵力
→ 兵粮
→ 携金
→ 兵装 / 兵器概率
→ 主将评分
→ 创建部队
→ 野外部队任务执行
~~~

因此旧的：

~~~text
巡查100
征兵95
建设90
运输70
出兵60
...
→ maxBy(score)
~~~

不是 fidelity 规则，应删除。

E20 关闭的是：

~~~text
“委任AI是否存在一个可直接列出的统一全局权重表？”
→ 当前答案：没有证据支持；逆向结构明确是 procedural / modular。
~~~

但城市内政 scheduler 的完整分支顺序仍 open。

## 2. 野外战术核心：玩家委任部队与 COM 共用 005AD980

### 2.1 玩家点击“委任部队行动”

逆向：

~~~text
005746A0
→ 遍历部队
→ 00572890 检查任务/已行动/势力等
→ 005AD980 执行部队行动
~~~

核心调用：

~~~asm
005746BA push esi
005746BB mov ecx,096A9350
005746C0 call 005AD980
~~~

### 2.2 正常 COM 军团

~~~text
005EC370
→ 按军团遍历未行动部队
→ 005DEF90 任务方针检查/改写
→ 预选列表
→ 005DDCF0
→ 005AD980
~~~

关键链：

~~~text
005EC429 -> 005DEF90
005EC500 -> 005DDCF0
005DDD24 -> 005AD980
~~~

所以至少野外 tactical executor 是共用的。

工程上不要写：

~~~text
PlayerDelegatedTroopAI
ComputerTroopAI
~~~

两套不同决策器；应共享 tactical core，只让上游任务/权限/调用方式区分。

## 3. 出兵策略：005EF440 是 procedural pipeline

`005EF440` 不是“算一个总 utility”。

它在最终出兵前依次检查/读取：

- 势力、城市、目标是否合法；
- 已有任务和已有出征部队；
- 城市兵力、兵粮、兵装；
- 目标距离；
- 治安；
- 难度；
- 君主野望；
- 君主 StrategicTendency；
- AI 城市评价数组；
- 计划兵力；
- 兵粮储备；
- 编成和主将。

大量分支失败会直接跳到：

~~~text
005F0097
→ 不出兵
~~~

所以这些是 gate，而不是“扣一点分以后仍可能赢过别的动作”。

## 4. 出兵概率：难度 + 野望 + 战略倾向 + 城市态势

### 4.1 难度

`005EF8D9` 直接读取全局难度：

~~~asm
mov eax,[07201978]
add eax,3
imul eax,eax,100
...
~~~

因此旧说法：

~~~text
超级难度只改资源，AI决策完全不读难度
~~~

错误。

正确边界：

~~~text
超级的主要强度仍来自资源/产出补正，
但至少部分战争决策明确读取 difficulty。
~~~

### 4.2 君主野望

`005EF900`：

~~~text
[person+0xF4] = 野望 0..4
~~~

进入出兵概率计算。

### 4.3 战略倾向

`005EF93F`：

~~~text
[person+0x10C] StrategicTendency
~~~

逆向注释已经识别：

~~~text
0 全国统一
1 地方统一
2 州统一
3 安于现状
~~~

地方/州统一会调用州域判断；全国统一进入更积极的通路；安于现状走另一分支。

这说明 StrategicTendency 在**战争 AI**中有真实 xref；不要把 E19 “评定 chooser 尚未证实读取 StrategicTendency”误解成这个字段全局无效。

## 5. 最终出兵概率有硬 clamp 5..100

`005EF9FC ~ 005EFA13`：

~~~text
raw < 5   -> 5
raw > 100 -> 100

ProbabilityCheck(raw)
~~~

即：

~~~ts
p = clamp(rawSortieProbability, 5, 100)

if (!ProbabilityCheck(p)) {
  abortSortie()
}
~~~

因此在前置 gate 都通过后，出兵仍是概率事件。

注意：

- “最低5%”只适用于已经走到这一概率层的分支；
- 前面任意硬 gate 都可以让本次出兵直接为0；
- 不能把所有城市每旬都解释成“至少5%会进攻”。

## 6. 计划兵力：有5000下限，但不是简单兵力比阈值

`005EFC23~005EFC2E`：

~~~text
plannedTroops >= 5000
~~~

即：

~~~ts
plannedTroops =
  max(calculatedTroops, 5000)
~~~

但后续还要检查：

- 当前城市实际可抽调兵力；
- 已有部队/任务占用；
- 兵装；
- 粮；
- 目标距离；
- 其他局部约束。

因此旧：

~~~text
防守型 1.5倍才出兵
标准型 1.2倍
攻击型 1.0倍
~~~

没有原版依据，删除。

## 7. 治安是硬 gate，不是 utility penalty

出兵函数直接读取出兵城市治安，并存在：

~~~text
80 / 90
~~~

两个阈值分支。

当前控制“用80还是90”的 flag 语义尚未完全命名。

所以 fidelity 应保存为：

~~~ts
requiredPublicOrder =
  resolveSortiePublicOrderThreshold(context)
// observed branches: 80 or 90

if (city.publicOrder < requiredPublicOrder)
  abortSortie()
~~~

而不是：

~~~ts
score -= (90-publicOrder)*k
~~~

## 8. 兵粮：目标距离直接决定规划 horizon

主出兵路径：

~~~asm
005EFCB8 读取目标移动旬数
005EFCC0 travelTime*5 + 15
005EFCCB call 005F6470
~~~

所以：

~~~ts
foodHorizon =
  travelTime * 5 + 15

requiredFood =
  AIConsumption(plannedTroops, foodHorizon)
~~~

然后：

~~~text
从城内粮中扣除应保留部分
→ 取可携量
→ 上限50000
→ 如果最终携粮 < requiredFood
   直接取消该部队
~~~

即：

~~~text
粮不够不是降低出兵分数
粮不够是 abort
~~~

## 9. 携金：原函数有独立概率规则

普通非兵器部队：

~~~ts
if (city.gold >= 10000) {
  if (ProbabilityCheck(75)) {
    carriedGold =
      (15 + GetRandomX(6)) * 100
    // 1500..2000
  }
}
else if (city.gold >= 2000) {
  if (ProbabilityCheck(50)) {
    carriedGold = 1000
  }
}
~~~

兵器部队跳过这段普通携金逻辑。

港/关分支另检查：

~~~text
城内金 >= 出征武将俸禄合计 × 8
~~~

否则取消出兵。

这再次说明原 AI 是由专用规则组成，而不是“金币价值折算成 utility”。

## 10. 兵器选择：专用概率

`005EFE08` 之后可直接看到：

~~~text
冲车：90%
井阑 / 木兽 / 投石：80%
~~~

其他编成分支从50附近计算，并受：

- 主将性格；
- 局部状态差；
- 其他尚未命名变量

修正，最后 clamp：

~~~text
30..70
~~~

再调用 `ProbabilityCheck`。

因此“选择攻城兵器”也是独立 procedural roll。

## 11. 主将选择：005F6CF0 是局部评分器

这点非常重要：

**原作不是完全没有 score。**

它有**局部专用 score**，例如“在已经决定要出这类兵装后，从候选武将中评主将”。

`005F6CF0`：

先算：

~~~text
Q = 兵种适性 + 势力技巧修正 + 7
~~~

攻击侧：

~~~text
Q
× 武力
× 兵装攻击
→ 整数缩放
→ ×2000
~~~

防御侧：

~~~text
Q
× 统率
× 兵装防御
→ 整数缩放
→ ×1000
~~~

中间另有一个尚未语义化的 common offset 同时加到攻防 score。

然后枪/戟/骑相克：

~~~text
优势：攻击score、 防御score ×1.3
劣势：攻击score、 防御score ×0.7
~~~

与兵种契合的特技：

~~~text
攻击score += 特技等级 ×1000
防御score += 特技等级 ×1000
~~~

所以正确架构是：

~~~text
不是没有评分函数，
而是存在“某个局部 selector 的专用评分函数”。

这和“所有AI动作共享一个全局utility”是两回事。
~~~

## 12. AI 势力强度：资源档位 + 君主硬编码

`函数[AI势力强度设定].txt` 先取势力据点内总兵力。

原指令等价于：

~~~ts
baseStrength =
  ceil(totalGarrisonTroops / 10000) * 10
~~~

因为原码：

~~~text
total + 9999
整数除10000
×5
×2
~~~

随后根据君主 ID 直接加特殊 bonus。

已确认部分：

| 君主 | bonus |
|---|---:|
| 曹操 / 孙策 / 曹睿 / 曹丕 / 刘备 | +2000 |
| 孙坚 / 孙权 | +1900 |
| 诸葛亮 / 周瑜 / 曹彰 / 司马懿 | +1800 |
| 董卓 / 吕布 | +1700 |
| 张角 / 袁绍 | +1600 |
| 马超 / 公孙瓒 | +1500 |
| 刘谌 / 刘封 | +1400 |
| 孙登 / 刘禅 | +1300 |
| 袁术 | +1200 |
| 钟会 / 邓艾 / 关羽 / 陆逊 | +1100 |
| 司马师 / 司马昭 / 司马炎 | +1000 |

另有刘璋、刘表、王朗、严白虎、刘繇、陶谦等特殊弱势分支，以及“诸葛亮在该势力时”的额外处理。

这说明 AI 评价明显含有：

~~~text
historical-person hardcode
~~~

因此若目标是复刻原作，不能用一个纯资源、纯能力、纯可解释的现代评价函数替换。

## 13. 城市委任内政：目前仍没有完整源码 scheduler

战争 AI 的逆向深度已经很高，但城市内政侧目前没有同等完整的：

~~~text
建设 vs 巡查 vs 征兵 vs 训练 vs 生产 vs 褒赏 vs 搜索 vs 登用
~~~

全 scheduler 函数。

所以 E20 **不能**声称已经恢复了所有城市动作权重。

当前长期稳定行为锚点：

- 每城尽量保有普通市场×3、普通农场×3；
- 还会要求兵舍、锻冶等基础设施；
- 缺位且无空地时可能主动拆别的设施重建；
- 治安通常维持80以上、约90附近；
- 兵装“轻视”仍约生产到各15000；
- 士兵“轻视”仍约征到30000；
- 有运输设定时约留20000兵并运走余量；
- 多城市同军团会向前线城市调资源；
- 会主动褒赏，常把忠诚补到约96以上。

这些是：

~~~text
empirical-high behavior anchors
~~~

不是“内部权重数字”。

## 14. 行动力和普通命令路径仍生效

逆向地址：

~~~text
004A1820 军团行动力增减
005B9340 军团行动
005CBF95 巡查
005BC4C1 市场等内政建设
005C3CAB 征兵
005C67B3 生产
005D8F68 技巧研究
~~~

`005B9340` 会调用 `004A1820`。

因此委任 AI 不能被实现成一个跳过普通经济约束的后台脚本。

最安全的引擎架构：

~~~text
AI scheduler / selector
→ normal command legality
→ normal AP / gold / food / capacity mutation
~~~

城市内政 caller 是否逐项直接复用玩家命令函数仍需继续逆，但**资源/AP约束不能无故绕开**。

## 15. E20 后推荐的工程结构

不要：

~~~ts
const weights = {
  patrol: 100,
  recruit: 95,
  build: 90,
  transport: 70,
  sortie: 60,
}

execute(maxBy(weights))
~~~

推荐：

~~~ts
function runDelegatedCorpsTurn(corps, state) {
  runEmergencyAndPublicOrderPhase(corps, state)

  runDomesticMaintenancePhase(corps, state)
  // city scheduler still compatibility layer

  runOfficerMaintenancePhase(corps, state)

  runArmamentPhase(corps, state)

  runTransportPhase(corps, state)
  // exact target/amount still open

  runSortiePipeline(corps, state)
  // use reverse-engineered PC-PK procedural pipeline

  runFieldTroopActions(corps, state)
  // shared 005AD980 tactical core
}
~~~

每个 phase 内：

~~~ts
while (
  corps.actionPower > 0
  && normalCommandCanExecute(...)
) {
  executeThroughNormalCommand(...)
}
~~~

其中战争部分尽量按逆向实现；城市部分继续显式标 compatibility policy。

## 16. 旧 fallback 删除

全部撤回：

~~~text
巡查100
征兵95
建设90
训练85
生产80
褒赏75
运输70
搜索60
出兵50
...
~~~

以及：

~~~text
防守方针：兵力比1.5才出兵
标准：1.2
攻击：1.0
~~~

以及：

~~~text
超级难度完全不进入AI决策
~~~

## 17. E20 关闭与保留边界

### 已关闭

- “委任AI有一张全局 action utility 权重表”的假设；
- 玩家委任野外部队与 COM 是否共用战术核心；
- 出兵概率是否读取 difficulty / ambition / StrategicTendency；
- 出兵概率最终 clamp 5..100；
- 计划兵力最低5000；
- 80/90治安 gate 的存在；
- 主路径粮食 horizon = travelTime*5+15；
- 携粮不足则 abort；
- 普通部队携金规则；
- 冲车90%、井阑/木兽/投石80%的兵器 roll；
- `005F6CF0` 主将局部评分链；
- AI 势力强度中的君主硬编码 bonus；
- 委任不能无视军团行动力 / 普通资源约束。

### 仍 open

1. 城市内政完整 scheduler；
2. `005EF440` raw sortie probability 中少数未命名局部变量；
3. 80/90治安阈值的上下文 flag 业务名；
4. 运输目标、运输量完整函数；
5. “重视 / 普通 / 轻视 / 禁止”等方针的逐档内部阈值；
6. AI 势力强度的所有弱势君主特殊分支业务语义；
7. Vanilla / PS2 / Wii AI 常量与 UI 差异。

## 18. 来源

逆向：
- https://github.com/sjn4048/311MemoryResearch/blob/master/内存资料/AI专题/函数[AI出兵策略].txt
- https://github.com/sjn4048/311MemoryResearch/blob/master/内存资料/AI专题/函数[AI势力强度设定].txt
- https://github.com/sjn4048/311MemoryResearch/blob/master/内存资料/AI专题/函数[AI行动部队].txt
- https://github.com/sjn4048/311MemoryResearch/blob/master/内存资料/AI专题/函数[AI选择主将].txt
- https://github.com/sjn4048/311MemoryResearch/blob/master/内存资料/修改记录by%20sjn4048.txt

结构：
- https://github.com/sean2077/311SireCustomizedPackageDev/blob/dev/material/结构体汇总.md

委任城市行为：
- https://w.atwiki.jp/sangokushi11/pages/74.html
- https://w.atwiki.jp/sangokushi11/pages/8.html
- https://w.atwiki.jp/sangokushi11/pages/1878.html
