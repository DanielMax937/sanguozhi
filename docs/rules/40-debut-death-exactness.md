# P0-5 登场 / 自然死亡 exactness

更新：2026-10-01。

## 1. 本轮结论

P0-5 需要把四类状态分开：

```text
A. 登场年份 / 登场位置
B. 剧本“史实 / 假想登场”模式
C. 寿命模式与死因修正
D. 运行时病弱 / 预定死亡 / 真正死亡
```

本轮可以把边界收紧到：

```text
普通年龄 / 死亡处理：
月初 dispatcher 已锁定到 00590C30 -> 005833D0

史实登场：
使用原 YearOfDebut + 原历史位置 / 剧本身份

假想登场：
未发现/在野位置随机化
登场年统一提前到成人年（15岁口径）

IgnoreAge：
独立场景级开关；英雄集结类场景属于年龄/寿命无视 profile

寿命模式：
Historical / Longevity / Fictional 为独立 profile
Longevity 约 +20年、Fictional 约到99岁目前仍是 empirical/documented，
不是 0048A000 源码级常量

自然死 / 不自然死：
死因分支真实存在
自然死围绕有效没年进入病弱与死亡
不自然死不会在史实没年直接死亡，会额外延寿

最终死亡：
不是 scenario init 时永久预抽
```

因此状态为：

```text
monthly-lifecycle-dispatcher-resolved
debut-mode-semantics-resolved-high
ignore-age-profile-resolved-high
lifespan-mode-semantics-resolved-high
death-year-inner-formula-open
marked-death-timing-open
```

## 2. 月初年龄 / 死亡 dispatcher：005833D0

311MemoryResearch 的 `函数[每月例行处理].txt` 给出：

```asm
00590C6C call 00482680   ; 是否月初
00590C71 test eax,eax
00590C73 je   00590E7C   ; 非月初直接返回

00590C7B call 0058BB30   ; 俘虏月份 / 禁仕月份
00590C82 call 005833D0   ; 年龄 / 死亡相关处理
...
```

SIRE 地址表同时把：

```text
00590C30 = MonthlyAction
```

正式命名为“每月例行处理”。

所以可以确定：

```text
年龄 / 自然寿命主处理至少挂在月初链上
```

而不是当前旧 fallback 暗示的“每旬任意时点处理”。

但 `005833D0` 本体没有公开文本展开，所以还不能说：

- 每月都 roll 死亡；
- 只在1月 roll；
- flag 一定在1月设置；
- 真正死亡一定与 flag 同月。

正确实现边界：

```ts
onMonthStart() {
  updateAgeAndNaturalDeathState() // original entry: 005833D0
}
```

内部逻辑仍 profile / open。

逆向来源：
- https://github.com/sjn4048/311MemoryResearch/blob/master/内存资料/函数[每月例行处理].txt
- https://github.com/sean2077/311SireCustomizedPackageDev/blob/dev/material/内存地址汇总.md

## 3. 生命周期字段是分层的

PC-PK1.1 结构已经明确：

```text
struct_person:
+44  YearOfDebut
+48  YearOfBirth
+4C  YearOfDeath
+50  CauseOfDeath
+A0  Identity
+A8  ScheduledLord
+124 Flags: 含“预定死亡”
+15C HealthLevel

struct_scenario:
+18  IgnoreAge
+24  DieInBattleSetting
+38  Lifetime
+50  ComeOnStage
```

相关 helper：

```text
00488A20 GetPersonAge
00488C50 IsNotIntroduced
00488C60 IsNotDiscovered
00488C80 IsDead
00489160 IsMarkedForDeath
0048A000 GetDeathYear
```

因此以下字段绝不能合并：

```text
YearOfDeath
effective death year
markedForDeath
HealthLevel
Identity=DEAD
```

来源：
- https://github.com/sean2077/311SireCustomizedPackageDev/blob/dev/material/结构体汇总.md
- https://github.com/sean2077/311SireCustomizedPackageDev/blob/dev/material/内存地址汇总.md

## 4. 史实登场：YearOfDebut 是门槛，不是年龄自动转换

官方事件条件和日文 Wiki 一致使用：

```text
已达到登场预定年
AND
当前身份是 在野 或 未发现
```

因此：

```ts
currentYear >= yearOfDebut
```

只是时间 gate。

它不等价于：

```ts
if (age >= 15) identity = NOT_DISCOVERED
```

历史剧本有大量反例：

- 张松 184 年已经15岁，仍未登场；
- 邓艾 211 年已经15岁，仍未登场；
- 诸葛亮在200年已成年，仍可保持未登场；
- 沙摩柯成年后也能继续是未登场状态。

所以历史登场必须继续尊重：

```text
YearOfDebut
+ current Identity
+ ScheduledLord / scenario data
+ ComeOnStage profile
```

来源：
- https://www.gamersky.com/handbook/200809/124174_2.shtml
- https://w.atwiki.jp/sangokushi11/pages/1033.html
- https://w.atwiki.jp/sangokushi11/pages/628.html
- https://w.atwiki.jp/sangokushi11/pages/687.html

## 5. ComeOnStage：史实 / 假想语义已基本闭合

用户可见设置长期明确为：

```text
Debuts:
Historical / Fictional
```

早期英文攻略描述：

- Historical：在史实城市、按历史登场；
- Fictional：在随机城市登场。

日文 Wiki 对假想模式进一步说明：

```text
未发现 / 在野武将的位置随机
登场年一律变为成人年
```

而原作“可登场成人年龄”有稳定 15 岁锚点：

- 新武将可登场年龄从15岁开始；
- 多名武将剧本表在15岁附近进入可登场区间；
- 玩家实测未来出生的新武将在15岁后出现。

因此 fidelity profile 可以写：

```ts
if (comeOnStage === "historical") {
  effectiveDebutYear = person.yearOfDebut
  debutLocationPolicy = "scenario/historical"
}

if (comeOnStage === "fictional") {
  effectiveDebutYear = person.yearOfBirth + 15
  debutLocationPolicy = "randomized"
}
```

证据等级：

```text
mode semantics: documented / empirical-high
adultAge15: empirical-high
raw numeric enum: open
```

不能反过来把 `ComeOnStage` 的原始 int 数值猜成 0/1 后宣称源码级确认。

来源：
- https://gamefaqs.gamespot.com/pc/931351-romance-of-the-three-kingdoms-xi/faqs/49611
- https://w.atwiki.jp/sangokushi11/pages/144.html
- https://w.atwiki.jp/sangokushi11/pages/1787.html

## 6. IgnoreAge：必须独立于 ComeOnStage

`struct_scenario +0x18` 单独保存 `IgnoreAge`。

英雄集结等跨时代场景的玩家资料明确称：

```text
无视年龄 / 寿命无视
```

并可以让在普通史实剧本已经死亡的武将重新作为一般武将出现。

所以至少在这类 scenario profile 中：

```ts
if (scenario.ignoreAge) {
  bypassOrdinaryChronologicalDebutGate = true
  bypassOrdinaryNaturalLifespan = true
}
```

这是场景级机制，不应该伪装成：

```text
Lifetime = Fictional
```

两者字段本来就是独立的。

注意：

- `IgnoreAge` 的 raw int enum / bit 仍未恢复；
- 是否影响所有年龄成长曲线、头像变化等其他系统，不在本轮自动推广。

来源：
- https://w.atwiki.jp/sangokushi11/pages/144.html
- https://w.atwiki.jp/sangokushi11/pages/799.html

## 7. Lifetime：三种用户可见模式

早期攻略对开始设置稳定记录：

```text
Lifespan:
Historical
Longevity
Fictional
```

### Historical

以人物资料中的没年与死因为基础，再进入原版 `GetDeathYear` / 自然死亡流程。

### Longevity

多个独立老玩家记录一致指向：

```text
大约 +20 年
```

例如张辽基础没年222，在 Longgevity 下玩家记录预期约活到240～242。

当前应标：

```text
empirical-high
```

不能标 `0048A000` exact。

### Fictional

早期攻略一致描述：

```text
全武将寿命接近 / 设为 99 岁
```

因此 compatibility profile 可以把普通寿命 threshold 设到：

```ts
birthYear + 99
```

但“99岁当月必死”还是“99岁进入死亡流程”没有源码级证明，继续保留 phase open。

来源：
- https://gamefaqs.gamespot.com/ps2/934129-romance-of-the-three-kingdoms-xi/faqs/49611
- https://gamefaqs.gamespot.com/boards/931351-romance-of-the-three-kingdoms-xi/54844812
- https://gamefaqs.gamespot.com/boards/931351-romance-of-the-three-kingdoms-xi/47785604
- https://gamefaqs.gamespot.com/boards/931351-romance-of-the-three-kingdoms-xi/63559669

## 8. 死因：自然死 / 不自然死是不同 profile

日文隐藏数据长期实测：

### 自然死

- 到有效没年附近开始病弱；
- 多数当年死亡；
- 长则常见再延2～3年；
- 有军师时年初会出现“身体不适 / 星象”等死亡征兆。

### 不自然死

- 史实没年不会直接触发普通死亡；
- 没年附近可能病一次后恢复；
- 然后获得额外寿命；
- 额外寿命与没年时年龄负相关。

这与 GameFAQs 的跨平台玩家观察一致：

- 郭嘉这种自然死人物在207附近病死；
- 孙坚、何进等不自然死人物不会按史实死年自动死亡。

来源：
- https://w.atwiki.jp/sangokushi11/pages/983.html
- https://gamefaqs.gamespot.com/boards/934129-romance-of-the-three-kingdoms-xi/54417613

## 9. 孙策：不自然死不能硬封 +15

孙策提供了非常强的 empirical anchor。

玩家把基础没年从200改成189后：

```text
十次左右测试
→ 于吉事件集中在205～206
```

即约：

```text
+16～17年
```

正常没年200时，另有 PS2PK 实测：

```text
216年11月发生
```

如果舌战胜利：

```text
寿命 +20年
mask death year 变成220
实际又可活到约237
```

因此：

```text
“不自然死额外寿命最多15”
```

最多只能理解为某个中间修正的旧近似，绝不能作为最终实际死亡 hard cap。

来源：
- https://w.atwiki.jp/sangokushi11/pages/579.html
- https://w.atwiki.jp/sangokushi11/pages/918.html

## 10. 死亡不是开局永久预抽

运行时存在：

```text
IsMarkedForDeath
RandomSeed
MonthlyAction
```

而玩家长期报告：

- 从足够早的存档重新推进；
- 同一武将未来是否在原年份死亡可能改变。

所以禁止：

```ts
scenarioInit() {
  person.finalDeathDate = fixedRandomDate()
}
```

正确架构应至少是：

```text
月初进入生命周期处理
→ 读取 effective death year / health / flag
→ 消费正常模拟 RNG
→ 可能设置 markedForDeath / health
→ 后续真正死亡
```

具体每一步的原概率仍 open。

来源：
- https://w.atwiki.jp/sangokushi11/pages/2527.html

## 11. 当前 fallback 应如何改

旧 fallback 最大的结构错误不是某个百分比，而是“把寿命更新当成独立年结算”。

现在应改成：

```ts
function onMonthStart(state, rng) {
  for (const person of state.persons) {
    if (!person.alive) continue

    updateDebutAtMonthStart(person, state, rng)
    updateNaturalLifeAtMonthStart(person, state, rng)
  }
}
```

### 登场 fallback

```ts
function effectiveDebutYear(person, scenario) {
  if (scenario.ignoreAge) return -Infinity

  if (scenario.comeOnStage === "fictional") {
    return person.yearOfBirth + 15
  }

  return person.yearOfDebut
}
```

历史模式下，普通 `NOT_INTRODUCED -> NOT_DISCOVERED / ScheduledLord` 的精确转换仍不能自拟；只在达到 gate 后交给 profile。

### 寿命 fallback

```ts
function baseLifetimeThreshold(person, scenario) {
  if (scenario.ignoreAge) return Infinity

  switch (scenario.lifetime) {
    case "historical":
      return historicalCauseAdjustedThreshold(person)

    case "longevity":
      return historicalCauseAdjustedThreshold(person) + 20
      // empirical fallback, not EXE exact

    case "fictional":
      return person.yearOfBirth + 99
      // documented compatibility threshold, phase still open
  }
}
```

当前 `historicalCauseAdjustedThreshold` 的不自然死年龄曲线仍使用原来的 provisional formula，不升级为原作事实。

### 死亡 flag fallback

死亡 flag / 真正死亡的经验分布仍可以保留旧：

```text
阈值年 / +1 / +2 / +3
约 65 / 25 / 8 / 2
```

但它现在只能作为：

```text
month-start lifecycle profile 内部的 provisional annual gate
```

不能再描述成已确认的原作“年初函数”。

## 12. 当前剩余 exactness gap

### 已收紧

- 月初生命周期 dispatcher：`00590C30 -> 005833D0`；
- `YearOfDebut / Identity / ScheduledLord` 分层；
- ComeOnStage 的史实 / 假想用户语义；
- 假想登场的随机位置与成人年 gate；
- 成人年龄15的高置信口径；
- IgnoreAge 是独立场景级 bypass；
- Lifetime 三模式语义；
- 自然死 / 不自然死 profile；
- 运行时死亡不能 scenario-init 永久预抽。

### 仍 open

1. `005833D0` 完整函数体；
2. `0048A000 GetDeathYear` 完整函数体；
3. `ComeOnStage / Lifetime / IgnoreAge` raw numeric enum；
4. 史实普通登场时 `ScheduledLord` 精确分支；
5. `NOT_INTRODUCED -> NOT_DISCOVERED / NORMAL` 的精确月/日与 setter；
6. Longevity +20 是否先于 / 后于不自然死修正；
7. Fictional 99 岁是死亡阈值还是实际死亡 hard date；
8. `markedForDeath` 设置概率和时点；
9. flag 后 HealthLevel 恶化与真正死亡的时序；
10. Vanilla / PS2 / Wii 的逐版本差异。

状态：

```text
P0-5-audit-complete
monthly-lifecycle-dispatcher-resolved
debut-profile-semantics-resolved-high
lifespan-profile-semantics-resolved-high
death-inner-functions-open
```

## 13. 来源

逆向：
- https://github.com/sjn4048/311MemoryResearch/blob/master/内存资料/函数[每月例行处理].txt
- https://github.com/sean2077/311SireCustomizedPackageDev/blob/dev/material/结构体汇总.md
- https://github.com/sean2077/311SireCustomizedPackageDev/blob/dev/material/内存地址汇总.md

登场：
- https://gamefaqs.gamespot.com/pc/931351-romance-of-the-three-kingdoms-xi/faqs/49611
- https://w.atwiki.jp/sangokushi11/pages/144.html
- https://w.atwiki.jp/sangokushi11/pages/1787.html
- https://www.gamersky.com/handbook/200809/124174_2.shtml

寿命 / 死因：
- https://w.atwiki.jp/sangokushi11/pages/983.html
- https://w.atwiki.jp/sangokushi11/pages/579.html
- https://w.atwiki.jp/sangokushi11/pages/918.html
- https://gamefaqs.gamespot.com/boards/934129-romance-of-the-three-kingdoms-xi/54417613
- https://gamefaqs.gamespot.com/boards/931351-romance-of-the-three-kingdoms-xi/54844812
- https://gamefaqs.gamespot.com/boards/931351-romance-of-the-three-kingdoms-xi/47785604
