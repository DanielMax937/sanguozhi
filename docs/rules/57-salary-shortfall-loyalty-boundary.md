# P0-22 欠薪 loyalty selector / 0058D5E0→0058C190 边界

更新：2026-10-03。主目标版本：PC-PK1.1。

## 1. 本轮结论

PC-PK1.1 月度收支链已经把欠薪忠诚处理明确拆成两层：

```text
0058D5E0
  每个欠薪据点调用一次
  输入：当前设施 + 当前现役武将列表
  this/ecx：跨据点累计容器

0058C190
  所有设施循环结束后调用一次
  输入：累计容器本身
  无显式 facility/person/list 参数
```

因此状态：

```text
P0-22-audit-complete
salary-shortfall-prepare-stage-exact
salary-shortfall-finalize-stage-exact
per-facility-immediate-loyalty-write-rejected
cross-facility-batching-exact
affected-officer-selector-open
per-officer-loss-open
```

## 2. 欠薪只在 salarySum > remainingGold 时进入准备阶段

关键链：

```asm
005909A3 call 0049F2A0   ; salarySum
005909A8 cmp  eax,edi
005909AA jg   005909B0
005909AC sub  edi,eax    ; 足够时整笔支付
```

只有 `salarySum > remainingGold` 才进入：

```asm
005909B0 lea edx,[esp+30]   ; active officer list
005909B4 push edx
005909B5 push ebp           ; facility ptr
005909B6 lea ecx,[esp+1E8]  ; accumulated penalty container
005909BD call 0058D5E0
```

所以 `0058D5E0` 不是“每月所有武将忠诚处理”，而是明确的 salary-shortfall prepare/accumulate stage。

## 3. 0058D5E0 的参数角色可以锁定

调用点直接给出：

```text
arg1 = facility pointer
arg2 = current active-officer list
this = monthly cross-facility accumulator
```

现役列表来自：

```text
004CF360
identity mask = 0x0F
= 君主 / 都督 / 太守 / 一般
```

因此 0058D5E0 至少有足够上下文去决定：

- 本据点哪些现役武将进入待罚集合；
- 是否排除君主/某些身份；
- 是否按据点信息、俸禄或人物属性生成 penalty record。

但 selector 逻辑仍未公开。

## 4. 忠诚惩罚不是在据点循环中即时写回

在 `005909BD call 0058D5E0` 之后，代码直接继续写回据点金钱、清理临时列表，并进入下一个设施。

没有在当前据点路径中看到显式逐人忠诚写回。

所有设施完成后才：

```asm
00590A20 lea ecx,[esp+1E0]
00590A27 call 0058C190
```

因此可以排除：

```ts
for each shortfall facility:
  for each officer:
    loyalty -= penalty
```

作为外层事务结构。

正确架构更接近：

```ts
for each facility:
  if salaryShortfall:
    enqueueSalaryPenaltyContext(facility, activeOfficers)

applyAllSalaryLoyaltyPenalties()
```

## 5. 0058C190 是月度统一 finalizer

`0058C190` 函数边界：

```text
0x58C190 .. 0x58C31F
next = 0x58C320
```

约 0x190 bytes。

它在 `MonthlyIncomeAndExpend` 的所有设施循环结束后只调用一次，且调用点不 push 额外参数。

因此可锁定：

```text
0058C190 = salary-loyalty batch finalizer / apply stage
```

至于它是否直接调用 `004A6CF0 ModifyPersonLoyalty`，当前公开资料仍没有 xref dump，不能强称已证实。

## 6. 0058D5E0 是 prepare/accumulate，而非 final writer

`0058D5E0` 函数边界：

```text
0x58D5E0 .. 0x58D6CF
next = 0x58D6D0 DeclineSecurity
```

约 0xF0 bytes。

结合调用方式，它最安全的命名是：

```text
prepare/enqueue salary-shortfall loyalty consequences
```

而不是：

```text
decrease loyalty now
```

直到恢复 body 为止。

## 7. selector 和 penalty formula 仍不能猜

当前仍不能回答：

- 是否所有 `0x0F` 现役身份都受罚；
- 君主是否在 0058D5E0 或 0058C190 被过滤；
- 都督/太守是否有不同规则；
- 是否按俸禄大小决定受罚概率或幅度；
- 是否按义理/野望/相性/忠诚当前值修正；
- 是否存在 RNG；
- 同一武将在多个上下文中是否去重。

所以不能写固定 `-10/-20/-30`，也不能写“全据点全员统一掉忠”。

## 8. 与 true loyalty primitive 的接口边界

P0-21 已确认：

```text
0048A770 SetLoyalty(0..255)
004A6CF0 ModifyPersonLoyalty(delta)
```

因此最终 `0058C190` 若产生忠诚变动，也必须作用于 true loyalty 层。

但当前不能把 `0058C190 -> 004A6CF0` 当成已恢复 xref，只能把它作为合理待验证路径。

## 9. 当前安全实现

```ts
interface SalaryPenaltyBatch {
  entries: SalaryPenaltyContext[]
}

for (facility of facilities) {
  if (salarySum(facility) > goldAfterCaptive(facility)) {
    salaryPenaltyBatch.enqueue({
      facility,
      activeOfficers: listByMask0x0F(facility),
    })
  }
}

applySalaryPenaltyBatch(salaryPenaltyBatch)
```

`applySalaryPenaltyBatch` 内的 selector / loss 继续由 profile 注入。

## 10. 本轮关闭 / 仍 open

### 已关闭 / 收紧

- `0058D5E0` 只在欠薪据点路径调用；
- 它接收当前设施 + 当前现役武将列表；
- 它操作一个跨据点累计容器；
- 当前据点循环不即时逐人写忠诚；
- 所有设施处理完成后统一调用 `0058C190`；
- `0058C190` 是无显式参数的月度 batch finalizer。

### 仍 open

1. `0058D5E0` 完整 body；
2. `0058C190` 完整 body；
3. 受罚人员 selector；
4. 君主是否被过滤；
5. 每人忠诚下降公式；
6. RNG / 义理 / 野望 / 相性 / 俸禄影响；
7. 去重规则；
8. `0058C190` 到 loyalty primitive 的 exact xref；
9. Vanilla / PS2 / Wii 差异。

## 11. 来源

- sjn4048/311MemoryResearch `内存资料/整理/Func-收支03-每月钱粮兵装收支.txt`
- fudanglp/311resource `san11pk_dump.exe_functions.csv`
- 关联：`41-nonnatural-loyalty-exactness.md`、P0-21
