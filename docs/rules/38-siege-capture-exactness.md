# P0-3 攻城统一公式与据点接管资源 exactness

更新：2026-10-01。

## 1. 本轮结论

P0-3 现在可以明确分成：

```text
城兵伤害底层：
已确认共用 005ADC30

耐久伤害：
调用链 / 输入参数 / 外层倍率已确认
005ADDC0 / 005ADE20 内部函数体仍open

攻陷后资源保留：
004B329B 已源码级闭合
```

因此“攻城完全靠一张武器伤害表”的旧模型撤回。

## 2. 城兵伤害：共用野战核心 005ADC30

`函数[部队攻击].txt` 明确显示，对设施守兵计算时最终调用：

```asm
005AFFD2 call 005ADC30
```

传入：

- 攻击方攻击；
- 守方防御；
- 战法/普攻伤害参数；
- 太鼓台等状态；
- 攻击兵力；
- 据点可参与防守兵力。

因此：

```text
攻城守兵伤害
!= 一套完全独立的新公式

而是：
005ADC30 通用战斗伤害核心
+ 据点/兵器/难度等外层修正
```

太守统率通过据点防御/有效守兵进入城兵损失，但不进入耐久伤害。

## 3. 井阑 / 投石对城兵是外层专用倍率

设施目标分支：

```text
兵种6 = 井阑
兵种7 = 投石
```

会在 `005ADC30` 结果后额外乘专用倍率。

因此：

```text
井阑/投石“对城兵强”
= 通用城兵伤害之后的专用 modifier
```

而不是另起一个完全不同的城兵 damage formula。

## 4. 耐久伤害调用链

当前公开逆向确认：

```text
普通兵种 / 井阑 / 投石
→ 005ADDC0

冲车 / 木兽
→ 005ADE20
```

之后统一叠加：

- 目标设施类型倍率；
- 会心；
- 云梯；
- 难度；
- 其他已知设施伤害修正。

所以正确架构：

```ts
rawDurability =
  isRamOrWoodBeast
    ? calcRamFamilyDurability(...)
    : calcOrdinaryDurability(...)

damage =
  applyTargetTypeMultiplier(rawDurability)

damage =
  applyCriticalLadderDifficulty(...)
```

## 5. 普通耐久的输入参数

原攻击函数确认：

```text
远程普通攻击 / 无战法：
durabilityPower = 5

相邻普通攻击：
durabilityPower = 15

战法：
durabilityPower = tacticData[+0x2F]
```

现代复刻和旧逆向研究一致使用：

```ts
ordinaryDurability =
  trunc(
    sqrt(attackerTroops)
    * attackerAttack
    * sqrt(1 / 1500)
    * (1 + durabilityPower / 25)
    * targetTypeMultiplier
    * troopDurabilityMultiplier
    * extraModifiers
  )
```

这套式子目前应标：

```text
reconstructed / empirical-high
```

因为 `005ADDC0` 本体没有公开文本函数体。

## 6. 强锚点

10000兵、攻击80、攻击城市：

```text
相邻普通攻击：
durabilityPower=15
→ 231

弩远程普通攻击：
durabilityPower=5
→ 173
```

与日文 Wiki 实测一致。

这足以把“按武器 lookup table 直接给耐久伤害”降级成测试表，而不是主规则。

## 7. 目标设施倍率

原跳转表已恢复：

| 目标 | 倍率 |
|---|---:|
| 城市 | 0.7 |
| 关所 | 0.6 |
| 港 | 0.8 |
| 阵 | 0.8 |
| 砦 | 0.7 |
| 城塞 | 0.6 |
| 土垒 | 0.9 |
| 石壁 | 0.7 |
| 内政设施 | 1.1 |
| 火种/火球等陷阱 | 1.6 |
| 堤防 | 0.7 |

冲车/木兽对城市、关、港等会跳过普通兵种的部分据点耐久衰减，因此破城能力显著更强。

## 8. 云梯

原地址：

```text
skill 19 = 云梯
```

若生效：

```text
剑/枪/戟/弩/骑等普通陆军：
耐久伤害 ×1.4

兵器等后续兵科：
耐久伤害 ×1.2
```

这是设施耐久 modifier，不应该乘到城兵伤害上。

## 9. 会心和超级难度

设施耐久：

```text
会心 ×1.15
```

超级难度下玩家方：

```text
耐久伤害 ×0.75
```

与野战非火伤的超级难度衰减方向一致。

## 10. 攻陷后资源保留：004B329B 已精确闭合

原函数首先：

```asm
mov ebp,5
```

即默认最低保留率：

```text
5%
```

若破城部队有效，则读取该部队魅力：

```text
004B32B3 -> 004890B0
```

然后计算：

```ts
retainPct =
  max(
    5,
    trunc(commanderCharisma / 10)
  )
```

这里旧注释写“魅力×10%”容易误导；机器码实际等价于魅力除10得到百分比整数档。

## 11. 同一保留率作用于所有主要资源

`004B329B` 依次处理：

```text
金
兵粮
兵力
12类兵装
```

每一项：

```ts
retained =
  trunc(
    oldAmount * retainPct / 100
  )
```

所以：

```text
不是只有金粮按魅力
不是兵装随机掉
不是兵力单独另一套比例
```

而是同一个 `retainPct`。

## 12. 魅力档位

| 魅力 | retainPct |
|---:|---:|
| 0–59 | 5% |
| 60–69 | 6% |
| 70–79 | 7% |
| 80–89 | 8% |
| 90–99 | 9% |
| 100–109 | 10% |

函数自身没有显式10%封顶。

若魅力 getter 允许超过109：

```text
110 -> 11%
120 -> 12%
...
```

是否在正常游戏数据中可达到，另由能力系统决定；不能在 `004B329B` 层擅自封顶。

若破城部队/指针无效：

```text
retainPct = 5
```

## 13. 旧资源公式修正

旧攻略式：

```text
oldAmount / 100
× floor(主将魅力/10)
```

在魅力>=60时与逆向值相容。

但魅力<50时会得到0%，与原程序冲突。

正确：

```ts
retainPct =
  max(5, trunc(CHA/10))
```

这是本轮最重要的资源接管纠错。

## 14. 内政设施保留不要混进资源公式

内政设施保留数量是另一条规则：

```text
CHA >=100 -> 5
80..99    -> 4
60..79    -> 3
40..59    -> 2
<=39      -> 1
```

这不是 `004B329B` 的资源百分比逻辑。

因此陷落处理应拆成：

```text
资源保留率
→ 004B329B

内政设施保留个数
→ 独立 selector / destroy flow
```

## 15. 当前真正剩余的 exactness gap

### 已闭合

- 城兵底层共用 `005ADC30`；
- 普通/兵器耐久的两条 helper 路径；
- durabilityPower=5/15/战法字段；
- 目标类型倍率；
- 云梯1.4/1.2；
- 会心1.15；
- 超级玩家0.75；
- 攻陷资源最低5%；
- 金/粮/兵/12兵装统一保留率。

### 仍 open

1. `005ADDC0` 完整函数体；
2. `005ADE20` 冲车/木兽内部基础式；
3. 小兵力时 sqrt / x87 / `00707A74` 的精确取整；
4. 小数量攻具/舰船的最终整数边界；
5. 内政设施“具体保留哪几座”的 selector；
6. 据点耐久在陷落/接管瞬间的所有重置路径；
7. Vanilla / 主机版等价性。

状态：

```text
siege-call-chain-resolved
capture-resource-formula-resolved
durability-inner-functions-still-open
```

## 16. 来源

逆向：
- https://github.com/sjn4048/311MemoryResearch/blob/master/内存资料/函数[部队攻击].txt
- https://github.com/sjn4048/311MemoryResearch/blob/master/内存资料/函数[破坏内政设施和破城获取资源].txt

研究公式：
- https://game.ali213.net/thread-5983352-1-1.html

原作实测：
- https://w.atwiki.jp/sangokushi11/pages/92.html

现代复刻交叉：
- https://github.com/tankyc/sango_infinity/blob/main/Project/Assets/Sango/Scripts/Game/Object/Troop/Troop.cs
