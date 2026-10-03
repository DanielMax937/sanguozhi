# E18 普通君主继承优先级

更新：2026-10-01。

## 1. 本轮结论

“君主死亡后谁继位”不能只写成一个统一排序函数。

原作至少应拆成三条路径：

```text
历史事件命中
→ 使用事件自己的固定后继/分裂脚本

玩家势力普通死亡
→ 玩家从合法候选中自行选择

COM势力普通死亡
→ 自动选择
```

其中 COM 普通继承的长期实测顺序高度一致：

```text
血缘
>
义兄弟
>
配偶
>
无上述关系时的年长者
```

证据等级：

```text
历史事件固定后继：confirmed as event data
玩家普通死亡可手选：empirical-high
COM四层顺序：empirical-high
004B9080集中处理入口：reverse-engineered-partial
同关系组内部排序：open
同龄最终tie-break：open
```

所以旧“血缘+10000、官职、功绩、魅力、统率加权总分”整体撤回。

## 2. 历史事件优先于普通继承

### 2.1 刘备之死

事件条件满足时：

```text
刘禅 > 刘封
```

并且候选人的行动状态本身就是事件条件的一部分。

该事件最重要的价值不是顺序本身，而是提供了一个 A/B 边界：

- 条件满足：走事件脚本；
- 条件不满足而刘备普通死亡：玩家可以自行选择后继。

因此历史事件与普通继承不能共用同一个 successor selector。

### 2.2 曹操之死

事件数据给出：

```text
曹昂
> 曹丕
> 曹植
> 曹冲
> 曹彰
```

同样属于脚本数据，不应反推出 COM 一般规则。

### 2.3 连环计等事件

连环计会同时处理：

- 董卓死亡；
- 后继候选的固定列表/顺序；
- 吕布分裂；
- 玩家继续控制哪一方的选择。

这进一步说明：

```text
historicalSuccession
!=
ordinarySuccession
```

## 3. 玩家势力普通死亡

历史事件不命中时，玩家君主死亡会进入后继者选择，而不是系统自动替玩家按儿子/功绩/魅力决定。

旧 2ch 记录对“刘备之死”明确写道：

```text
事件条件没满足而死亡时，可以选择后继者
```

因此：

```ts
if (matchedHistoricalSuccessionEvent) {
  resolveHistoricalEvent()
} else if (force.isPlayerControlled) {
  const candidates =
    enumerateLegalSuccessors(force)

  successor =
    playerChoose(candidates)
}
```

这意味着对**玩家普通继承**不存在：

```text
血缘 > 义兄弟 > 配偶 > 年龄
```

这样的自动优先级。

这组顺序只用于 COM 自动路径的当前高置信模型。

## 4. COM 普通继承

### 4.1 高置信类别顺序

2008 年旧 2ch 连续讨论直接总结：

```text
COM：
血缘 > 义兄弟 > 配偶者 > 年长者
```

这一结论与多个反直觉实机案例相容。

### 4.2 “无关系时按年长者”证据很强

案例包括：

#### 吕布 → 王忠

玩家观察：

- 没有可用血缘候选时；
- 吕布死后出现王忠继位；
- 王忠并不是魅力、功绩或官职最突出者；
- 解释为“年长者”后与结果相符。

#### 董卓 / 牛辅之后 → 韩遂

讨论记录指出：

- 韩遂加入时间并不长；
- 却可以成为后继；
- 原因被归结为在剩余普通候选中年长。

这对以下模型构成明显反证：

```text
功绩最高
魅力最高
官职最高
仕官时间最长
```

#### 刘琦 → 黄忠

一份完整战报记录：

- 刘琦的亲族候选死亡/被俘；
- 被敌方俘虏的亲族不会进入继承候选；
- 最终由高龄的黄忠继位。

这一案例同时支持：

```text
被敌方俘虏 => 至少从普通后继候选中排除
```

## 5. 当前可实现的 COM 选择器

### 5.1 证据级主结构

```ts
function chooseAiSuccessor(oldLord, force) {
  const legal =
    enumerateLegalSuccessors(force)

  const blood =
    legal.filter(p =>
      isBloodRelative(oldLord, p)
    )

  if (blood.length)
    return chooseWithinBloodGroup(blood)

  const sworn =
    legal.filter(p =>
      isSwornSibling(oldLord, p)
    )

  if (sworn.length)
    return chooseWithinSwornGroup(sworn)

  const spouse =
    legal.filter(p =>
      isSpouse(oldLord, p)
    )

  if (spouse.length)
    return chooseWithinSpouseGroup(spouse)

  return chooseEldestOrdinary(legal)
}
```

这里真正有高置信证据的是：

```text
类别顺序：
blood > sworn > spouse > ordinary

ordinary组：
年长者优先
```

### 5.2 不要过度确认同组排序

目前没有 `004B9080` 函数体，也没有足够的最小化测试证明：

```text
两个血缘候选之间
两个义兄弟之间
多个配偶候选（修改/自建数据场景）
```

仍然一定按年龄排序。

因此：

```text
同关系类别内按年龄
= compatibility-assumption
```

不是原作 confirmed。

### 5.3 工程稳定 tie-break

为了模拟器可重放，可以暂用：

```ts
function stableFallback(candidates) {
  return sortBy(
    candidates,
    birthYearAscending,
    personIdAscending
  )[0]
}
```

但必须标记：

```text
personId tie-break
= engine deterministic fallback
```

不能写成原版规则。

## 6. 合法候选过滤

目前可靠确认至少要求：

```text
仍存活
属于该势力
不是敌方俘虏
```

刘琦战报明确记录：

> 亲族虽然活着，只要被敌方俘虏，就会从后继候选中排除。

第一版：

```ts
function baseLegalSuccessor(p, force) {
  return (
    p.alive
    && p.forceId === force.id
    && !p.isCaptive
  )
}
```

### 6.1 出阵 / 任务状态仍 open

有玩家个案称：

- 希望让某武将继位；
- 该武将当时在出阵部队；
- 没出现在候选列表。

但这一点还没有最小化回归，不能升级成 confirmed。

因此：

```text
excludeFieldTroopMember
excludeMissionOfficer
```

继续作为待验证 profile gate。

## 7. 原程序入口：004B9080

311MemoryResearch 的“禅让 DEMO”通过：

```asm
push 0
push 0
push forcePtr
mov ecx, 755895C
call 4B9080
```

复用了原流程。

该 DEMO 作者明确备注：

```text
目前会使用“君主死亡”的MSG
```

说明：

- 原作存在一个集中式君主死亡/势力继承处理入口；
- 该入口接受势力指针；
- 可以被外部调用强制进入相同流程。

但当前公开资料没有 `004B9080` 的完整函数体。

所以不能把：

```text
blood > sworn > spouse > eldest
```

标成 disassembly-confirmed。

其正确证据标签仍为：

```text
empirical-high
```

## 8. 功绩 / 能力 / 官职退出主排序

旧 fallback：

```text
血缘 +10000
同族 +5000
官职 ×10
功绩
魅力 ×20
统率 ×10
```

全部删除。

原因不是“这些字段绝对不会在任何隐藏 tie-break 中读取”，而是：

1. 现有 COM 主排序实测与关系/年龄模型一致；
2. 存在“刚加入但年长的人继位”的案例；
3. 存在能力/魅力明显更优者没有继位的案例；
4. 没有源码或稳定实验支持旧综合评分。

因此：

```text
merit
charisma
leadership
office
serviceLength
```

不得作为当前 fidelity 主排序权重。

## 9. 继位后的忠诚

不要附加一个：

```text
君主死亡
→ 每名部下随机判断是否立即叛变
```

更符合现有资料与已经恢复的忠诚系统的是：

```text
确定后继者
→ force.lord = successor
→ 各武将与新君主的相性/关系成为后续忠诚判断基准
→ 正常忠诚下降 / 下野 / 被挖流程继续
```

所以“选错后继导致很多人离开”可以由既有忠诚系统解释，不需要新增即时叛乱 RNG。

## 10. 零合法候选

若：

```text
legalSuccessors.length === 0
```

目前只能进入一个显式的 leaderless-force 处理接口：

```ts
resolveLeaderlessForce(force)
```

San11 普通沙盘中“零合法后继”的完整势力消灭/归属流程尚未有足够资料。

不能：

- 随机创造新君主；
- 从敌方/在野自动抓一个人继位；
- 擅自假设城市立即归最近势力。

## 11. 版本边界

### PC / PK

玩家选择与 COM 关系/年龄主排序在长期 PC 社区记录中稳定。

`004B9080` 入口来自 PC-PK1.1 逆向环境。

### PS2 / Wii

玩家死亡后可选继承者在主机玩家记录中也有支持，但：

- COM 同组 tie-break；
- 候选过滤；
- 事件边界

仍应逐平台核对。

## 12. E18 关闭与保留边界

### 已关闭

- 玩家普通死亡是否自动按某个属性选后继：**否，玩家选择**；
- 历史事件是否与普通继承共用统一排序：**否，事件脚本优先**；
- COM 主类别优先：`血缘 > 义兄弟 > 配偶 > 年长普通武将`；
- 旧功绩/魅力/统率/官职综合评分；
- 被敌方俘虏仍可正常继位的假设；
- `004B9080` 作为集中处理入口的存在。

### 仍 open

1. 血缘组内部的精确顺序；
2. 义兄弟组内部顺序；
3. 同龄最终 tie-break；
4. 出阵/任务中的完整候选过滤；
5. `004B9080` 完整函数体；
6. 零合法候选时的原版势力终止流程；
7. Vanilla / PS2 / Wii 的逐平台差异。

## 13. 来源

普通 COM 继承讨论：
- https://w.atwiki.jp/sangokushi11/pages/1952.html
- https://w.atwiki.jp/sangokushi11/pages/1941.html

被俘候选排除：
- https://w.atwiki.jp/sangokushi11/pages/2356.html

刘备死亡事件 / 普通死亡边界：
- https://w.atwiki.jp/sangokushi11/pages/942.html
- https://w.atwiki.jp/sangokushi11/pages/1952.html

曹操死亡事件：
- https://w.atwiki.jp/sangokushi11/pages/21.html

连环计：
- https://w.atwiki.jp/sangokushi11/pages/893.html
- https://w.atwiki.jp/sangokushi11/pages/100.html

原入口：
- https://github.com/sjn4048/311MemoryResearch/blob/master/内存资料/新功能[禅让](DEMO).txt
