# E19 评定完整提案池

更新：2026-10-01。

## 1. 本轮结论

E19 可以关闭“评定到底允许出现哪些具体提案？”这个静态池问题。

原版完整 MSG 目录把 msg2966 ~ msg3288 整体标成“君主评定”，并在具体案阶段逐类列出了 22 类提案。

因此应把 E19 拆成两个问题：

~~~text
proposal type pool
→ 已恢复

proposal chooser
→ 仍 open
~~~

即：

- “能提什么”现在可以结构化；
- “某武将为什么在某局势提这一案”还没有原函数。

## 2. 官方手册确认的评定命令边界

PK 官方手册确认：

~~~text
评定
期间：无
必要金：无
行动力：无
最多参加：6人
前提：君主在据点
~~~

并明确说明评定结束后，配下武将会根据评定结果采取行动。

因此评定本身不是普通单一执行武将命令，而是君主主持的多武将决策流程。

可以确认：

~~~text
openCouncil():
  moneyCost = 0
  actionPowerCost = 0
  participants <= 6
  requiresLordAtBase = true
~~~

至于被采纳具体案最终如何扣 AP / 金钱 / 物资，是否100%复用普通命令入口，当前没有公开评定函数调用图，继续 open；引擎可复用 normal-command service 作为兼容实现，但不能标成原作已逆向。

## 3. 两阶段结构

人物台词与 MSG 目录共同确认：

~~~text
阶段1：评定方针
→ 君主采决

阶段2：具体案
→ 君主采决

之后：
→ 执行被采纳案
~~~

人物台词中还存在：

~~~text
赞同某人
全部采用
部分采用
全部否决
中止评定
~~~

因此数据结构不能假设“每个参与者都产生一个新方案”，也不能假设“君主只能选一个”。

建议模型：

~~~ts
type CouncilSpeech =
  | { kind: "new-proposal", proposal: CouncilProposal }
  | { kind: "agree", proposerId: PersonId }
  | { kind: "abort" }

type CouncilDecision =
  | { kind: "accept-one", proposalId: Id }
  | { kind: "accept-subset", proposalIds: Id[] }
  | { kind: "accept-all" }
  | { kind: "reject-all" }
  | { kind: "abort" }
~~~

## 4. 第一阶段：玩家看到3大类，MSG 又细分攻击/迎击

角色台词页统一显示：

~~~text
内政
出阵
外交・计略
~~~

完整 MSG 目录则把第一阶段台词分成：

~~~text
2975~2980 建议攻击
2981~2986 建议迎击
2987~2992 建议内政
2993~2998 建议外交
2999~3002 赞同他人
~~~

因此最安全的模型是：

~~~ts
type CouncilDisplayGroup =
  | "domestic"
  | "sortie"
  | "diplomacy-strategy"

type CouncilPolicySpeechSubtype =
  | "sortie-attack"
  | "sortie-defense"
  | "domestic"
  | "diplomacy-strategy"
~~~

这里说的是消息层可观察分类。不要在没找到 selector/function enum 前声称原代码内部一定有一个同名4值 enum。

## 5. 22 类具体提案

### 5.1 内政 / 人事 / 城市管理：9类

| ID | 提案 | MSG |
|---|---|---|
| domestic-build | 内政建设 | 3043 |
| recruit | 征兵 | 3034~3054* |
| produce-equipment | 生产兵装 | 3055~3065 |
| patrol | 巡查 | 3066~3076 |
| train | 训练 | 3077~3087 |
| search | 探索 | 3111~3117 |
| hire | 登用 | 3118~3124 |
| appoint-strategist | 任命军师 | 3201~3206 |
| remove-facility | 撤除设施 | 3207~3209 |

* 原公开目录在“内政建设/征兵”附近存在编号排版重叠；提案类型本身没有歧义，不要据此发明更多类别。

### 5.2 出阵 / 军事：3类

| ID | 提案 | MSG |
|---|---|---|
| invade | 侵略 | 3088~3098 |
| intercept | 迎击 | 3099~3104 |
| military-build | 军事建设 | 3105~3110 |

显示层都属于“出阵”。

其中：

- 侵略显然对应“攻击”话术；
- 迎击显然对应“迎击”话术；
- 军事建设到底在原 chooser 中归哪一个出阵子类，仍没有 selector 证据。

### 5.3 外交・计略：10类

| ID | 提案 | MSG |
|---|---|---|
| amicability-gift | 献上 / 亲善 | 3125~3131 |
| alliance | 同盟 | 3132~3138 |
| break-alliance | 摒弃 / 破弃同盟 | 3139~3145 |
| ceasefire | 停战 | 3146~3152 |
| demand-surrender | 劝降 | 3153~3159 |
| exchange-prisoner | 交换俘虏 | 3160~3172 |
| request-reinforcement | 求援 | 3173~3179 |
| two-tigers | 二虎竞食 | 3180~3186 |
| drive-tiger | 驱虎吞狼 | 3187~3193 |
| rumor | 流言 | 3194~3200 |

总计：

~~~text
9 + 3 + 10 = 22
~~~

## 6. 三个旧 fallback 类型删除

旧工程曾把下面三个普通命令也塞进评定 proposal pool：

~~~text
技巧研究
输送
褒赏
~~~

但完整的专用君主评定消息段没有这三类具体提案话术。

相反，旧表漏掉了：

~~~text
迎击
军事建设
破弃同盟
任命军师
撤除设施
~~~

因此当前 fidelity schema 固定为22类，而不是把所有普通 Command 自动都当成评定提案。

证据边界：

- 22类 = confirmed-static-message-data；
- “没有专用MSG就绝对不可能运行时复用通用话术”无法做逻辑证明；
- 在没有新的 caller 证据前，不加入消息池外的 proposal type。

## 7. “赞同他人”是原生结果

MSG：

~~~text
2999~3002  第一阶段赞同他人
3210~3213  具体案赞同提议
~~~

人物角色页也存在专门“评定方针・具体案提案（同意）”。

所以 participant output 必须允许 agree，不能硬编码：

~~~text
6名参与者
= 一定出现6个不同新提案
~~~

## 8. 采决不是单选

MSG 目录包含：

~~~text
第一阶段：
赞同某一人
赞同所有人
赞同部分战略方针
否决全部战略方针

第二阶段：
提议1人建议
同意所有提议
同意部分提议
全部否定

另有：
中止评定
~~~

人物君主台词同样明确存在“全选”与“全部否决”。

所以 engine 的 decision model 必须支持集合采纳。

## 9. 评定本身 +10 技巧P

2006 年同期技巧P整理记录：

~~~text
评定：+10P
~~~

这项与“具体案执行后本身产生的技巧P”要分开。

当前：

~~~ts
onCouncilCompleted() {
  force.techniquePoints += 10
}
~~~

证据等级：

~~~text
contemporary-guide / empirical-high
~~~

未取得评定主函数的技巧P写入地址，所以不标 disassembly-confirmed。

## 10. 22类 ≠ 22类在所有时候都可提

E19 闭合的是 type pool，不是 availability table。

例如明显需要目标/状态的 proposal：

- 同盟：不能已经同盟；
- 破弃：应存在同盟；
- 交换俘虏：必须有可交换俘虏；
- 任命军师：至少需要合法候选，官方普通命令要求智力>=70；
- 撤除设施：必须有可撤除己方设施；
- 迎击：应存在防御对象；
- 侵略：应存在合法攻击目标。

当前没有“评定 proposal-specific gate table”的原函数。

所以 compatibility 实现可以：

~~~text
materializeProposal(type)
→ reuseNormalCommandTargetingAndHardGates()
~~~

但这只是避免生成非法方案的工程策略，不等于原版评定 selector 一定直接调用普通 command validator。

## 11. chooser 仍 open

SIRE 结构表确认武将有：

~~~text
+0x10C StrategicTendency
+0x110 EarthElementTenacity
~~~

但当前没有找到评定函数 xref 证明这些字段被 proposal chooser 读取。

同样没有源码证据支持：

~~~text
高政治 -> 必提内政
高武力 -> 必提出阵
高智力 -> 必提外交计略
性格 -> 固定方针
起用 -> 固定提案
~~~

玩家记录反而表明：军师型人物也会主张侵攻，武将型人物也可能提出生产兵装，且很多参与者会直接赞同他人。

因此当前不能机械按五维/性格映射 proposal。

## 12. chooser 的 provisional-engine-rule

引擎需要闭环时：

~~~ts
function generateCouncilSpeech(
  officer,
  state,
  existing
) {
  const legal =
    ORIGINAL_COUNCIL_PROPOSALS
      .flatMap(type =>
        materializeLegalTargets(type, state)
      )

  if (legal.length === 0)
    return { kind: "abort" }

  const proposal =
    chooseBySituationUrgencyPlusStableBias(
      officer,
      legal,
      state
    )

  const same =
    existing.find(x =>
      x.type === proposal.type
      && x.targetId === proposal.targetId
    )

  if (same) {
    return {
      kind: "agree",
      proposerId: same.proposerId
    }
  }

  return {
    kind: "new-proposal",
    proposal
  }
}
~~~

其中 situationUrgency、stableOfficerBias、随机扰动全部必须标 provisional-engine-rule，不能写成原作权重。

## 13. E19 关闭与保留边界

### 已关闭

- 君主评定是否有固定具体 proposal schema：有；
- 具体案池：22类；
- 第一阶段显示组：内政 / 出阵 / 外交・计略；
- MSG 层出阵又分攻击 / 迎击话术；
- 参与者可以赞同他人而不新增方案；
- 君主可以采纳一个、部分、全部或全部否决；
- 评定本身0金、0行动力、最多6名参与者；
- 旧“技巧研究/输送/褒赏属于评定池” fallback 撤回；
- 评定 +10 技巧P作为同期攻略高置信值。

### 仍 open

1. proposal chooser 原函数地址；
2. 各 proposal 的额外评定专用触发 gate；
3. StrategicTendency / EarthElementTenacity / 性格 / 五维 是否以及如何进入 chooser；
4. 22类到第一阶段4种消息子类的精确映射（尤其军事建设）；
5. 参与武将完整过滤条件；
6. 多个采纳案的执行顺序；
7. 执行具体案时 AP/金钱/物资的原调用链；
8. Vanilla / PS2 / Wii 差异。

## 14. 来源

完整原版 MSG 目录：
- https://www.sanguogame.com.cn/special/san11/1920.html

官方 PK 手册：
- https://cdn.akamai.steamstatic.com/steam/apps/628070/manuals/32sangokushi11wpk_manual.pdf

人物评定台词：
- https://w.atwiki.jp/sangokushi11/pages/202.html
- https://w.atwiki.jp/sangokushi11/pages/639.html

技巧P：
- https://www.gamersky.com/handbook/200604/22088.shtml

隐藏字段结构：
- https://github.com/sean2077/311SireCustomizedPackageDev/blob/dev/material/结构体汇总.md
