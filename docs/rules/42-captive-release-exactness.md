# P0-7 俘虏资金不足释放 / 主动释放 exactness

更新：2026-10-01。

## 1. 先把“释放”拆成不同路径

《三国志11》至少存在下面几条不能混用的俘虏离开路径：

```text
A. 自然逃亡
   00582BE0
   -> captiveMonths / WAR / INT 概率

B. 据点资金不足
   00590490
   -> 0058C320
   -> 0058D1D0
   -> 0058D430

C. 君主命令“追放”
   -> 主动释放已经被拘押的敌方俘虏

D. 击破 / 落城结算界面的即时“释放”
   -> 与先收押、之后再用追放命令不是同一 UI path

E. 势力灭亡等特殊状态转换
```

P0-7 的核心结论是：这些路径共享“俘虏离开”结果，但**不能无证据地共享禁仕 flag、技巧P奖励或排序逻辑**。

状态：

```text
P0-7-audit-complete
maintenance-release-count-resolved
maintenance-selection-pipeline-resolved
maintenance-comparator-semantics-open
manual-release-tp-direction-official
manual-release-tp-amount-open
release-forbidden-period-route-conflict
```

---

## 2. 资金不足时释放人数：源码级精确

PC-PK1.1 `00590490 MonthlyIncomeAndExpend`：

```asm
00590916 ... currentGold * 0.02
00590925 ... = floor(currentGold / 50)

00590927 prisonerCount
0059092B compare prisonerCount vs payable
0059092F payable = min(prisonerCount, floor(gold / 50))

00590933 payable * 50
00590936 unpaid = prisonerCount - payable
00590938 esi = unpaid
0059093A gold -= payable * 50
```

因此：

```ts
paidCount =
  min(prisonerCount, floor(currentGold / 50))

releaseCount =
  prisonerCount - paidCount

goldAfterCaptiveMaintenance =
  currentGold - paidCount * 50
```

等价：

```ts
releaseCount =
  max(0, prisonerCount - floor(currentGold / 50))
```

例：

| 俘虏 | 金 | 可负担 | 必须释放 |
|---:|---:|---:|---:|
| 10 | 500 | 10 | 0 |
| 10 | 499 | 9 | 1 |
| 10 | 249 | 4 | 6 |
| 10 | 0 | 0 | 10 |

这一层不再 open。

来源：
- https://github.com/sjn4048/311MemoryResearch/blob/master/内存资料/整理/Func-收支03-每月钱粮兵装收支.txt

---

## 3. 资金不足并不是逐人随机“谁没饭吃谁走”

当 `releaseCount > 0` 时，原代码不是直接遍历前 N 名，也没有在外层对每人 roll：

```asm
00590940 push 0
00590942 push 0
00590944 push 0058C320
00590949 push 1
0059094F call 004AA200

00590954 cmp releaseCount, listCount
00590958 jnl 0059096F

00590960 ...
00590964 call 004A8E10
00590969 cmp releaseCount, listCount
0059096D jl 00590960

0059096F selectedList
00590974 facility
0059097C call 0058D1D0
```

可以确认的结构：

1. 给通用列表算法 `004AA200` 传入 comparator `0058C320`；
2. 得到经过 comparator 处理的列表；
3. 若列表大于本据点 `releaseCount`，反复调用 `004A8E10` 缩减；
4. 最终列表长度恰好为 `releaseCount`；
5. 把该据点 + 选择结果送给 `0058D1D0`；
6. 扫描完所有据点以后，统一调用 `0058D430`。

所以可以固定：

```text
要释放几人：exact
通过 comparator 选择一个恰好同样大小的 subset：exact
comparator 在比较什么：open
```

---

## 4. 0058C320 的业务排序仍然不能猜

同一 IDB 的轻量导出确认这些函数确实存在：

```text
0x58C320 sub_58c320
0x58D1D0 sub_58d1d0
0x58D430 sub_58d430
```

且函数边界大致是：

```text
0058C320 .. 0058C3CF
0058D1D0 .. 0058D42F
0058D430 .. 0058D5DF
```

但公开的 `311resource` 只导出了函数名 / 地址 / 结构体，没有 xref、指令或伪代码；其文档也明确说后续要导出 decompiler / xref 才能继续。

因此不能凭直觉写成：

```text
优先释放低忠诚
优先释放低能力
优先释放高能力
按俸禄
按武将ID
按俘虏时间
随机
```

这些当前都没有原函数证据。

正确接口：

```ts
const candidates =
  sortWithOriginalComparator0058C320(prisoners)

const released =
  takeOriginalSide(candidates, releaseCount)
```

其中 comparator 和“保留哪一端”的 exact 语义一起保持 open。

来源：
- https://github.com/fudanglp/311resource/blob/master/extractor/ida/data/python_idb/san11pk_dump.exe_functions.csv
- https://github.com/fudanglp/311resource/blob/master/docs/analysis/ida_resource_hints.md

---

## 5. 0058D1D0 / 0058D430：每据点收集，最后统一执行

月度收支的结构非常清楚：

```text
facility 0
  -> 若有养不起的俘虏
  -> 0058D1D0 加入全局本月待释放集合

facility 1
  -> 同上

...

所有设施完成
→ 0058D430 一次性处理
```

因此：

```ts
for (facility of facilities) {
  const selected =
    selectUnpaidCaptives(facility)

  appendMonthlyForcedReleaseBatch(
    facility,
    selected
  )
}

finalizeMonthlyForcedCaptiveRelease()
```

这也解释了为什么不能在每个据点循环中直接把 Identity 改掉：原程序显式延迟到后段统一 finalizer。

仍 open：

- `0058D1D0` 保存了哪些上下文；
- `0058D430` 对原势力存活 / 灭亡如何分支；
- forced release 是否设置 ForbiddenLord/Months；
- forced release 是否获得主动命令的技巧P奖励。

---

## 6. 主动释放命令：官方规则能确认什么

官方 PK 手册把“追放”定义为：

```text
配下武将的追放
或
敌方俘虏武将的解放
```

命令表给出：

```text
期间：无
必要金：无
行动力：无
执行武将：无
最多6人
```

最重要的是官方效果说明：

```text
▲ 技巧P（捕虏武将解放）
▼ 技巧P（配下武将追放）
```

因此下面这件事可以升级为 official-confirmed：

```text
主动追放命令释放敌方俘虏
→ 本势力技巧P增加
```

但官方手册**没有给具体点数**。

来源：
- https://cdn.akamai.steamstatic.com/steam/apps/628070/manuals/32sangokushi11wpk_manual.pdf

---

## 7. 主动释放到底加多少技巧P：不要把“约3”冒充 exact

旧 2ch / Wiki 讨论里有：

```text
“一応開放で上がったはず、2とか3とか”
“捕虜追放で3程上がる”
```

另有实际战报：

```text
18名释放
→ 期间技巧P合计增加67
```

但这个战报没有证明67全部只来自释放动作，因此不能反算：

```text
67 / 18
```

为原公式。

当前证据等级：

```text
release gives positive TP:
official-confirmed

exact gain:
open

+3:
empirical candidate / compatibility fallback
```

如果引擎必须先闭环，可以：

```ts
manualReleaseTechniquePointGain = 3
// compatibility fallback only
```

未来拿到原 caller 后替换。

来源：
- https://w.atwiki.jp/sangokushi11/pages/1993.html
- https://w.atwiki.jp/sangokushi11/pages/2702.html

---

## 8. ForbiddenLord / ForbiddenMonths 是真实 runtime 字段

PC-PK1.1：

```text
struct_person +0x164 ForbiddenLord
struct_person +0x168 ForbiddenMonths
struct_person +0x169 CaptiveMonths
```

月初：

```text
00590C30 MonthlyAction
→ 0058BB30
   俘虏月份 / 禁止仕官月份计数器处理
```

因此“暂时不能再次仕官某君主”不是 UI 临时条件，而是保存于武将 runtime state 的真实计数器。

来源：
- https://github.com/sean2077/311SireCustomizedPackageDev/blob/dev/material/结构体汇总.md
- https://github.com/sjn4048/311MemoryResearch/blob/master/内存资料/函数[每月例行处理].txt

---

## 9. 但“主动释放后一定写 3 个月”存在直接冲突证据

这里不能继续沿用旧文档的单一说法。

### 支持“释放后禁仕”的资料

Wiki 的“小ネタ”明确写：

```text
捕虏解放会产生登用禁止期间
```

2009 年玩家记录进一步说：

```text
捕虏解放后 3 个月 lock
势力灭亡时例外
```

来源：
- https://w.atwiki.jp/sangokushi11/pages/15.html
- https://w.atwiki.jp/sangokushi11/pages/1965.html

### 反例

2011 年另一组长期玩家记录却明确说：

```text
捕虏脱走
→ 暂时绝对无法登用

自主解放
→ 不会立这个登用禁止 flag
```

来源：
- https://w.atwiki.jp/sangokushi11/pages/2219.html

### 更晚的实测只确认其他路径

2022 年重新开机确认的讨论把“三个月禁仕”明确列给：

- 未发现武将现场登用失败；
- 推举失败；
- 落城时登用失败；
- 捕虏脱走；

但没有把主动释放列进这次复核后的列表。

来源：
- https://medaka.5ch.net/test/read.cgi/gamehis/1640245995/904
- https://itest.5ch.io/medaka/test/read.cgi/gamehis/1640245995/497-n

因此当前不能写：

```ts
manualRelease.forbiddenMonths = 3 // confirmed
```

只能写：

```text
manual release forbidden flag:
route/version conflict

3 months:
strong historical candidate, not source-exact
```

---

## 10. 很可能是“释放路径”被社区口径混在一起

至少存在：

```text
落城/击破结算时立即释放
已经收押后用追放命令释放
自然逃亡
资金不足强制释放
势力灭亡后的释放/身份重置
```

社区讨论往往都简称“解放”。

而原程序本身已经证明：

- 自然逃亡走 `00582BE0`；
- 资金不足走 `0058D430`；
- 主动“追放”是君主命令；
- 捕获结算另有独立 MSG/行为路径。

所以最安全的 fidelity 数据结构应按 **ReleaseCause** 分离：

```ts
type CaptiveExitCause =
  | "natural-escape"
  | "maintenance-shortfall"
  | "manual-exile-command"
  | "immediate-after-capture"
  | "force-destruction"
  | "diplomatic-exchange"
```

Forbidden / TP 不能在一个通用 `releaseCaptive()` 里无条件写死。

---

## 11. 当前建议 fallback

### 资金不足 selector

没有 comparator 原函数时：

```ts
maintenanceReleaseSelector =
  "stable-person-id-order"
// 明确标 provisional
```

选择一个稳定 deterministic fallback，比伪造“低能力优先”更可审计。

必须保留：

```ts
ruleset.captiveMaintenance.selectorProfile
```

拿到 `0058C320` 后直接替换。

### 主动释放技巧P

```ts
manualReleaseTechniquePointGain = 3
// empirical compatibility fallback
```

### 禁仕

不把所有释放路径统一设3个月。

建议：

```ts
forbiddenPolicy = {
  "natural-escape": 3,          // empirical-high
  "manual-exile-command": 3,    // compatibility candidate; disputed
  "maintenance-shortfall": null,// exact open
  "immediate-after-capture": null,
  "force-destruction": 0,       // documented exception candidate
}
```

其中 `null` 表示必须由 version/profile 决定，不代表0。

对于 strict-fidelity profile，manual release 也应保留“disputed”标记，而不是隐藏争议。

---

## 12. 资金不足自动释放不要自动奖励技巧P

官方说明书的技巧P奖励明确挂在玩家/AI的君主命令：

```text
追放
→ 捕虏武将解放
→ ▲技巧P
```

目前没有证据说明：

```text
00590490 资金不足
→ 0058D430 自动释放
```

也会调用同一个奖励路径。

所以默认应分开：

```ts
manualExileCommand.releaseTpReward = compatibilityProfile

maintenanceShortfall.releaseTpReward = 0
// conservative fallback, exact still open
```

这里的0是“不要无证据发奖励”的工程策略，不是原作已证实的0。

---

## 13. 当前剩余 exactness gap

### 已闭合 / 收紧

- 每名据点俘虏每月维护50金；
- 资金不足时必须释放人数的完整闭式；
- 资金不足选择不是简单“直接前N名”，而是 `0058C320` comparator + 列表裁剪；
- 每据点通过 `0058D1D0` 累计、全部据点之后 `0058D430` 统一 finalizer；
- 主动“追放”命令释放敌俘不消耗金/AP/执行武将，最多6人；
- 主动释放增加技巧P为官方确认；
- `ForbiddenLord / ForbiddenMonths` 是真实 runtime 字段；
- 禁仕月份由月初 `0058BB30` 计数处理；
- “所有释放一律3个月禁仕”被冲突证据否定，必须按路径/版本拆分。

### 仍 open

1. `0058C320` comparator 完整函数体；
2. comparator 排序方向 + `004A8E10` 删除哪一端；
3. `0058D1D0` 完整函数体；
4. `0058D430` 完整函数体；
5. 资金不足 forced release 是否写 ForbiddenLord/Months；
6. 资金不足 forced release 是否奖励技巧P；
7. 主动追放命令的技巧P精确值；
8. 主动追放命令是否/何版本写3个月 ForbiddenMonths；
9. 即时捕获界面“释放”的禁仕/技巧P；
10. 势力灭亡分支如何清除/绕过禁仕；
11. Vanilla / PC-PK / PS2 / Wii 路径差异。

状态：

```text
P0-7-audit-complete
forced-release-count-exact
forced-release-selection-architecture-resolved
forced-release-priority-open
manual-release-tp-positive-official
manual-release-tp-value-open
release-forbidden-route-conflict
```

## 14. 来源

逆向：
- https://github.com/sjn4048/311MemoryResearch/blob/master/内存资料/整理/Func-收支03-每月钱粮兵装收支.txt
- https://github.com/sjn4048/311MemoryResearch/blob/master/内存资料/整理/Func-自动07-俘虏逃走.txt
- https://github.com/sjn4048/311MemoryResearch/blob/master/内存资料/函数[每月例行处理].txt
- https://github.com/sean2077/311SireCustomizedPackageDev/blob/dev/material/结构体汇总.md
- https://github.com/fudanglp/311resource/blob/master/extractor/ida/data/python_idb/san11pk_dump.exe_functions.csv

官方：
- https://cdn.akamai.steamstatic.com/steam/apps/628070/manuals/32sangokushi11wpk_manual.pdf

Wiki / 实测：
- https://w.atwiki.jp/sangokushi11/pages/15.html
- https://w.atwiki.jp/sangokushi11/pages/1965.html
- https://w.atwiki.jp/sangokushi11/pages/2219.html
- https://w.atwiki.jp/sangokushi11/pages/1993.html
- https://w.atwiki.jp/sangokushi11/pages/2702.html
