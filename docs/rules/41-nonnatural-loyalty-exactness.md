# P0-6 褒赏 / 欠薪 / 流言等非自然忠诚变动 exactness

更新：2026-10-01。

## 1. 本轮结论

P0-6 把非自然忠诚变化拆成四条完全不同的路径：

```text
A. 金钱褒赏
B. 宝物授予 / 转移 / 没收
C. 月俸不足
D. 城市计略“流言”
```

本轮最大的源码级收敛来自**月俸不足**：

```text
俘虏维护费先扣
→ 统计该据点现役武将总俸禄
→ 若够钱：整笔俸禄一次性扣除
→ 若不够：完全跳过俸禄扣款
           转 0058D5E0 准备欠薪忠诚处理
→ 所有据点处理结束后统一 0058C190 执行忠诚下降
```

所以原作不是：

```text
剩多少钱就先发多少工资
→ 按欠薪比例逐人扣忠
```

公开资料目前仍没有展开 `0058D5E0 / 0058C190` 函数体，因此“谁掉多少忠”继续 open。

另外两条重要 negative evidence：

```text
现金褒赏 ≠ 固定 +N
流言成功 ≠ 全城所有武将统一扣固定 N
```

当前状态：

```text
salary-payment-branch-resolved
salary-loyalty-inner-function-open
cash-reward-command-semantics-resolved
cash-reward-gain-formula-open
rumor-effect-selector-open
blanket-all-officer-rumor-model-rejected
```

## 2. 真实忠诚不是 UI 的 0..100

PC-PK 的结构和编辑器实测都说明忠诚底层是 byte，可超过100。

典型实测：

```text
真实忠诚 99
→ COM 褒赏
→ 108
→ 普通 UI 仍显示100
```

流言也会先从隐藏值向下扣：

```text
120
→ 多次流言
→ 109
```

所以所有主动变化必须作用于真实值：

```ts
trueLoyalty = clampByte(trueLoyalty + delta)
displayLoyalty = min(trueLoyalty, 100)
```

不能在每次褒赏 / 流言后先 clamp 到100。

来源：
- https://www.ptt.cc/bbs/Koei/M.1776854540.A.47B.html
- https://w.atwiki.jp/sangokushi11/pages/2025.html

## 3. 金钱褒赏：命令边界已确认

官方 PK 说明书明确：

```text
100金 / 人
5 AP / 人
一次可多人
每都市执行
同一武将每回合最多一次
显示忠诚100时不可执行
部队从军中的武将不可执行
```

结构侧存在：

```text
00489140 HasPraised
```

311MemoryResearch 的调用栈进一步定位：

```text
004A1820  AP处理
→ 005B9340
→ 005B5D60
   （原研究明确标注：褒赏扣行动力、扣钱在这里）
→ 005B9630
→ 00575370 集中入口
```

因此成本和每回合 flag 可直接写成 fidelity rule。

来源：
- KOEI《三國志11 with パワーアップキット》说明书
- https://github.com/sjn4048/311MemoryResearch/blob/master/内存资料/修改记录by%20sjn4048.txt
- https://github.com/sean2077/311SireCustomizedPackageDev/blob/dev/material/内存地址汇总.md

## 4. 金钱褒赏增量：随机 + 君主魅力影响，但闭式仍 open

多个独立来源确认：

- 君主魅力会影响褒赏忠诚上升量；
- 同一局中单次褒赏增量会变化；
- 可通过改变 RNG / S-L 观察到不同结果；
- 实际已有 +5、+8、+9 等记录。

例如玩家逐旬记录：

```text
陈兰 82 -> 90  (+8)
陈兰 90 -> 98  (+8)
许攸 87 -> 96  (+9)
韩浩 88 -> 93  (+5)
周泰 85 -> 94  (+9)
```

另一个 PC-PK 编辑器记录：

```text
99 -> 108 (+9)
```

因此：

```ts
rewardGain = fixedConstant
```

是错误模型。

同时不能把现代复刻项目当前的：

```text
保底11
+ 按性格概率再加1..5
```

反向当成原作。它与原作可观察到的 +5 / +8 / +9 直接不兼容，最多属于该项目自己的 gameplay reconstruction。

正确边界：

```ts
rewardGain =
  rewardGainProfile.roll({
    rulerCharm,
    target,
    rng,
    version,
  })
```

当前仍 open：

- 原 RNG 范围 / 权重；
- 魅力如何进入；
- 目标义理是否由本 caller 直接读取，还是经过共用忠诚 helper；
- Vanilla / PK 常量是否一致。

来源：
- https://w.atwiki.jp/sangokushi11/pages/1598.html
- https://w.atwiki.jp/sangokushi11/pages/79.html
- https://www.ptt.cc/bbs/Koei/M.1776854540.A.47B.html

## 5. 宝物授予：价值越高，加忠越多

官方说明书确认：

```text
授予宝物：10 AP
必要金：0
宝物价值越高 → 忠诚上升越多
```

攻略 Wiki 也给出相同方向。

长期实测还支持非常强的近似：

```text
价值20的宝物
→ 隐藏忠诚100 -> 120
```

也就是说 `gain = item.value` 很可能就是普通授予的基线映射。

但当前 311MemoryResearch 公开文本只定位到“授予 / 没收”的菜单与相关入口，没有公开对应忠诚数值函数体。

因此当前等级：

```text
value monotonicity: official-confirmed
gain == value: empirical-high candidate
PC-PK opcode: open
```

第一版引擎可以把 `gain=item.value` 放在 profile，而不能在文档中冒充已经反汇编闭合。

来源：
- KOEI PK说明书
- https://w.atwiki.jp/sangokushi11/pages/74.html
- https://w.atwiki.jp/sangokushi11/pages/2027.html
- https://github.com/sjn4048/311MemoryResearch/blob/master/内存资料/修改记录by%20sjn4048.txt

## 6. 宝物没收 / 转给主人

三国志11 UI 中“没收”可以通过把部下持有宝物转授给君主来完成。

可靠行为是：

```text
原持有者失去宝物
→ 忠诚下降
```

多份玩家记录把普通没收描述为约 -30，但当前主逆向没有公开忠诚修改函数体。

因此继续保持：

```text
confiscation causes loyalty loss: empirical-high
fixed -30: empirical-high, not reverse-engineered
```

不要为了与“宝物价值”对称而擅自假设：

```text
loss = item.value
```

两条路径需要独立 profile。

## 7. 月俸：支付顺序已经源码级闭合

PC-PK1.1 `00590490 MonthlyIncomeAndExpend` 的据点金钱支出顺序是：

```text
本月收入
→ 俘虏维护费
→ 现役武将俸禄
→ 欠薪后果
```

现役名单通过：

```asm
00590983 push 0F
```

其中 `0x0F = 00001111b`：

```text
君主
都督
太守
一般
```

随后：

```text
004CF360 获取该设施现役列表
0049F2A0 计算列表总俸禄
```

来源：
- https://github.com/sjn4048/311MemoryResearch/blob/master/内存资料/整理/Func-收支03-每月钱粮兵装收支.txt

## 8. 够钱：全额支付

关键原指令：

```asm
005909A3 call 0049F2A0   ; salarySum
005909A8 cmp  eax,edi     ; salarySum vs remainingGold
005909AA jg   005909B0
005909AC sub  edi,eax     ; 足够 -> 一次性扣完整 salarySum
```

因此：

```ts
if (salarySum <= goldAfterPrisonerCost) {
  goldAfterSalary =
    goldAfterPrisonerCost - salarySum

  salaryShortfall = false
}
```

这是 PC-PK1.1 reverse-engineered。

## 9. 不够钱：不是部分支付，而是“整笔不扣 + 欠薪处理”

若：

```text
salarySum > goldAfterPrisonerCost
```

程序直接：

```asm
005909AA jg 005909B0
```

跳过唯一的：

```asm
005909AC sub edi,eax
```

然后：

```asm
005909B0 ...
005909BD call 0058D5E0   ; 欠薪忠诚下降准备
...
005909D3 call 004ACF50   ; 写回据点金钱
...
00590A27 call 0058C190   ; 统一执行忠诚下降
```

因此欠薪月：

```ts
if (salarySum > goldAfterPrisonerCost) {
  goldAfterSalary = goldAfterPrisonerCost
  // 不是0，也不是按比例扣完
  // 唯一例外是前面的俘虏费本来已把钱扣到0

  enqueueSalaryLoyaltyPenalty(...)
}
```

这意味着旧 open 项：

> “资金不足时是否存在部分支付？”

现在可以关闭：

```text
PC-PK1.1：不存在外层部分支付。
```

如果 `0058D5E0` 内部另外记录“欠薪比例”，那只是忠诚计算输入，不会改变外层金钱事务。

## 10. 欠薪真正还没闭合的是“掉谁、掉多少”

`0058D5E0` 接收：

- 当前设施；
- 当前现役武将列表；
- 一个跨设施累计的待处理容器。

全部据点扫描结束后统一调用：

```text
0058C190
```

公开文本没有展开这两个函数。

所以仍不能锁死：

- 是否所有名单成员都受罚；
- 君主是否最终再被过滤；
- 义理 / 相性 / 野望 / 官职如何影响；
- 每人下降是固定、随机还是按俸禄；
- 多个欠薪据点如何去重。

但现在可以删除旧的：

```text
全城 -10..-30
按剩余资金比例支付
```

## 11. 流言：成功率与效果量必须分开

公开逆向已经有：

```text
函数[计算流言是否成功].txt
```

同时在文件末尾标出：

```text
005D05B0 流言相关函数
005D05F0 流言相关函数
```

但这两个 effect-side helper 没有展开。

因此：

```text
rumor success roll
!=
rumor loyalty/security effect
```

成功率公式已知，不代表成功后的掉忠量也已知。

来源：
- https://github.com/sjn4048/311MemoryResearch/blob/master/内存资料/函数[计算流言是否成功].txt

## 12. 流言不能实现成“全城所有武将统一掉 N”

这是 P0-6 第二个很重要的纠错。

2018 年一个极端但很有价值的实机样本：

```text
目标城市：
100+ 武将

成功流言：
300+ 次

结果：
治安已经降到0
但大多数目标武将忠诚几乎不动
只有少数武将明显降到70多
某些指定目标只是偶尔才掉一次
```

这几乎直接排除：

```ts
for (const officer of city.officers) {
  officer.loyalty -= sameDrop
}
```

如果原作每次成功流言都对全城全员固定扣值，300次成功后不可能出现上述分布。

另一个 2026 年 PC-PK 实测也明确描述：

- 同一次成功流言通过改变 RNG 后，**被影响的是哪些武将、下降多少**会变化；
- 隐藏忠诚会正常下降，例如120→109；
- 个别观测还出现“看起来反弹”的情况，但未排除 AI 褒赏 / 其他结算干扰，因此本轮不把“流言可正向加忠”写成规则。

正确架构必须是：

```ts
targets =
  selectRumorLoyaltyTargets(
    targetCity,
    rng,
    versionProfile
  )

for (const person of targets) {
  const loss =
    rollRumorLoyaltyLoss(person, rng, versionProfile)

  changeTrueLoyalty(person, -loss)
}

applyRumorSecurityEffect(...)
```

`selectRumorLoyaltyTargets()` 和 `rollRumorLoyaltyLoss()` 目前都保持 open。

来源：
- https://www.ptt.cc/bbs/Koei/M.1526989285.A.762.html
- https://www.ptt.cc/bbs/Koei/M.1776854540.A.47B.html

## 13. 关系 / 义理很可能进入流言 eligibility，但不要先猜公式

PC-PK 玩家记录：

```text
君主亲爱武将
→ 流言下似乎不会掉忠
```

另一批长期实测又显示：

- 义理高的武将明显更难通过流言压忠；
- 义理低 / 相性差的武将更容易成为流言登用目标。

这些都支持：

```text
流言存在 target-side gate / resistance
```

而不是单纯“城市成功一次，全员统一扣”。

但在 `005D05B0 / 005D05F0` 函数体恢复前，不把：

```text
亲爱 = 绝对免疫
义理 = 某固定线性系数
```

写成 source-confirmed。

来源：
- https://w.atwiki.jp/sangokushi11/pages/95.html
- https://w.atwiki.jp/sangokushi11/pages/1153.html

## 14. 现代复刻的 rumor 数值必须隔离

`tankyc/sango_infinity` 当前实现：

```text
成功一次
→ 整城存活武将共享一个 8..15 基准掉忠
→ 每人再按义理追加
→ 城市治安另掉 6..12
```

但其配置注释自己明确写：

- 8..15 是根据“原版量级”重新调的工程值；
- 不是从原 EXE 中恢复的常量。

更重要的是，“整城所有存活武将都掉”与上面的原作百人都市实测冲突。

因此该实现应标：

```text
modern-reconstruction / mod-profile
NOT fidelity evidence
```

不得把它复制回 San11 fidelity 规则。

## 15. P0-6 建议运行时接口

```ts
interface LoyaltyRules {
  cashReward: {
    goldPerPerson: 100
    apPerPerson: 5
    gainProfile: RewardGainProfile
  }

  itemTransfer: {
    grantProfile: ItemGrantLoyaltyProfile
    confiscateProfile: ItemConfiscateLoyaltyProfile
  }

  salary: {
    paymentMode: "all-or-nothing-per-facility"
    penaltyProfile: SalaryShortfallPenaltyProfile
  }

  rumor: {
    selectTargets: RumorTargetSelector
    loyaltyLossProfile: RumorLoyaltyLossProfile
    securityLossProfile: RumorSecurityLossProfile
  }
}
```

其中只有：

```text
cashReward cost/gates
salary payment transaction
```

可以直接写成 source-level fidelity。

## 16. 当前剩余 exactness gap

### 已闭合 / 明显收紧

- 金钱褒赏100金/人、5AP/人、多人、每人每回合一次等命令规则；
- `005B5D60` 属于褒赏扣 AP / 金钱执行链；
- 褒赏结果是随机、魅力相关，拒绝固定值；
- 现代复刻“保底11”不得作为 fidelity；
- 宝物价值越高加忠越多；
- 月俸按月；
- 俘虏维护优先于月俸；
- 月俸外层事务为**整笔支付 / 整笔不支付**；
- 欠薪时不会先把据点剩余金钱按比例发掉；
- 欠薪准备 `0058D5E0`、实际忠诚处理 `0058C190`；
- 流言成功率与效果函数分离；
- 流言“全城全员统一掉忠”模型被实机反例否定；
- 流言要保留 target selector 与 loss RNG。

### 仍 open

1. `005B5D60` 中金钱褒赏忠诚增量的完整原函数；
2. 褒赏 RNG / 君主魅力 / 义理的精确闭式；
3. 宝物 value -> loyalty 的 PC-PK 原 opcode；
4. 没收忠诚下降原函数与 -30 的版本边界；
5. `0058D5E0` 完整函数体；
6. `0058C190` 完整函数体；
7. 欠薪最终受罚武将集合和每人下降值；
8. `005D05B0 / 005D05F0` 流言 effect helper；
9. 流言 loyalty target selector；
10. 流言单人忠诚损失分布；
11. 流言治安损失原分布；
12. Vanilla / PK / 主机版差异。

状态：

```text
P0-6-audit-complete
salary-payment-transaction-resolved
reward-gain-formula-open
salary-penalty-formula-open
rumor-effect-formula-open
blanket-rumor-model-rejected
```

## 17. 来源

逆向：
- https://github.com/sjn4048/311MemoryResearch/blob/master/内存资料/整理/Func-收支03-每月钱粮兵装收支.txt
- https://github.com/sjn4048/311MemoryResearch/blob/master/内存资料/函数[计算流言是否成功].txt
- https://github.com/sjn4048/311MemoryResearch/blob/master/内存资料/修改记录by%20sjn4048.txt
- https://github.com/sean2077/311SireCustomizedPackageDev

官方 / Wiki：
- KOEI《三國志11 with パワーアップキット》说明书
- https://w.atwiki.jp/sangokushi11/pages/74.html
- https://w.atwiki.jp/sangokushi11/pages/79.html
- https://w.atwiki.jp/sangokushi11/pages/1598.html
- https://w.atwiki.jp/sangokushi11/pages/95.html

流言实测：
- https://www.ptt.cc/bbs/Koei/M.1526989285.A.762.html
- https://www.ptt.cc/bbs/Koei/M.1776854540.A.47B.html

现代复刻（仅 negative / reconstruction 对照）：
- https://github.com/tankyc/sango_infinity/blob/main/Project/Assets/Sango/Scripts/Game/Object/City/City.cs
- https://github.com/tankyc/sango_infinity/blob/main/Project/Assets/Sango/Scripts/Game/System/CityStrategy/Actions/CityStrategyActionRumor.cs
- https://github.com/tankyc/sango_infinity/blob/main/Project/Assets/Sango/Scripts/Game/Scenario/ScenarioVariables.cs
