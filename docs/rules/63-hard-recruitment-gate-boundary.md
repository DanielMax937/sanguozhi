# P0-28 `004AF7D0` hard recruitment gate / 关系优先级边界

更新：2026-10-03。主目标版本：PC-PK1.1。

## 1. 本轮结论

`004AF7D0 RecruitmentDetermination` 已确认是普通登用成功率计算之前的 hard gate。

函数边界：

```text
004AF7D0 .. 004AFD5F
next = 004AFD60 GetRecruitmentSuccess
length ≈ 0x590 bytes
```

SIRE 对该函数的说明：

```text
登用必成功和必不成功判定
会考虑：
厌恶、结义、亲善、禁止仕官期等条件
```

因此状态：

```text
P0-28-audit-complete
hard-gate-function-boundary-exact
forced-result-output-contract-exact
relation-and-forbidden-service-domain-confirmed
gate-before-success-rate-exact
internal-priority-order-open
loyalty-giri-hard-threshold-open
```

## 2. hard gate 的调用契约

`004AFD60` 调用：

```asm
004AFDB7 lea eax,[esp+14] ; forced result out ptr
004AFDBB push eax
004AFDBC push ebx         ; mode
004AFDBD push edi         ; executor ptr
004AFDBE push esi         ; target ptr
004AFDBF mov ecx,ebp      ; global manager
004AFDC9 call 004AF7D0

004AFDCE test eax,eax
004AFDD0 je   004AFDDD    ; 0 = no forced decision

004AFDD2 mov eax,[esp+14] ; 1 success / 0 fail
004AFDDA ret
```

所以它的语义非常清楚：

```ts
const gate = recruitmentDetermination(target, executor, mode)

if (gate.handled) {
  return gate.result // success or fail
}

// only then calculate success rate
```

## 3. 它不是 probability modifier

因为 `004AF7D0` 命中时会直接从 `004AFD60` 返回，完全跳过：

```text
005C4F80 GetHiringSuccessRate
005BA4C0 deterministic generator
004721D0 runtime probability
```

因此：

```text
厌恶 / 结义 / 亲爱 / 禁仕期等 hard 条件
```

不能实现成：

```text
successRate += X
successRate -= Y
```

而必须是短路判定。

## 4. 禁止仕官是持久 runtime state，不是 UI 临时规则

`struct_person` 明确有：

```text
+0x164 ForbiddenLord
+0x168 ForbiddenMonths
```

并且月初 `0058BB30` 会处理禁仕月份计数。

因此 `004AF7D0` 处理“禁止仕官期”时读取的是实际 runtime state，而不是临时推导条件。

## 5. 关系 helper / 数据层已经存在

当前可确认的相关 helper / 字段包括：

```text
0048A5F0 GetRelationWithLord
  0 父母
  1 兄弟
  2 儿子
  3 女儿
  4 血亲
  5 配偶
  6 义兄弟
  7 无

00489F80 GetCompatibilityDifference

struct_person:
  affection list
  hate list
  ForbiddenLord
  ForbiddenMonths
  Loyalty
  Giri
```

但“helper 存在”不等于已证明 `004AF7D0` 的具体调用顺序。

## 6. 内部优先级仍不能从经验表直接升级

当前 Wiki / 玩家经验常给出类似：

```text
厌恶 -> 必失败
某些亲属/义兄弟/亲爱 -> 必成功
禁仕 -> 必失败
高忠诚+高义理 -> 不可登用
```

这些行为可以继续标：

```text
empirical-high / documented-high
```

但没有 `004AF7D0` body 前，不能声称源码真实优先级是：

```text
hate > forbidden > spouse > sworn > affection > loyalty+giri
```

或任何其他固定序列。

## 7. “忠诚 + 义理 > 96”仍不能升级成 opcode exact

这个规则在玩家社区长期存在，并且行为上有很高置信度。

但当前：

- `004AF7D0` body 未公开；
- 内部义理编码与 UI 口径尚未逐指令恢复；
- 不清楚该阈值是否只适用于某身份/某 mode。

所以继续保持：

```text
empirical-high
```

而不是 `reverse-exact`。

## 8. fallback 设计必须保留三态结果

错误接口：

```ts
hardGate(...): boolean
```

因为它无法区分：

```text
forced success
forced fail
no forced decision
```

正确接口：

```ts
type ForcedRecruitmentDecision =
  | { handled: true; result: true }
  | { handled: true; result: false }
  | { handled: false }
```

这与原函数返回值 + out-parameter 契约一致。

## 9. 本轮关闭 / 仍 open

### 已关闭 / 收紧

- `004AF7D0` 函数边界 `004AF7D0..004AFD5F`；
- 它在 `005C4F80` 前执行；
- 命中时直接返回 forced success / fail；
- 输出契约是 handled-return + result-out-parameter；
- SIRE 明确确认它覆盖厌恶、结义、亲善、禁止仕官期等 domain；
- ForbiddenLord / ForbiddenMonths 是持久 runtime state。

### 仍 open

1. `004AF7D0` 完整 body；
2. 厌恶 / 禁仕 / 配偶 / 义兄弟 / 亲爱之间的 exact 优先级；
3. 是否调用 `0048A5F0` 及具体位置；
4. affection/hate list 的 exact 检查顺序；
5. 忠诚+义理阈值 exact opcode；
6. mode 对 hard gate 的影响；
7. 相性是否在 hard gate 中参与；
8. Vanilla / PS2 / Wii 等价性。

## 10. 来源

- sjn4048/311MemoryResearch `Func-人才01-计算登用是否成功.txt`
- sean2077/311SireCustomizedPackageDev `material/内存地址汇总.md`
- sean2077/311SireCustomizedPackageDev `material/结构体汇总.md`
- fudanglp/311resource `san11pk_dump.exe_functions.csv`
- 关联：`36-hiring-probability-exactness.md`
