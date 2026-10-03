# P0-29 自动封官跨官职 scheduler / candidate construction

更新：2026-10-03。主目标版本：PC-PK1.1。

## 1. 本轮结论

`005FAF00` 的单官职 selector 已经闭合，但本轮继续追上层 scheduler 时，公开资料没有恢复其 caller/xref。

因此当前必须明确区分两层：

```text
单官职 selector:
  005FAF00
  输入 candidate list + office + scoringMode

跨官职 scheduler:
  caller 未恢复
  candidate construction 未恢复
  office traversal order 未恢复
```

状态：

```text
P0-29-audit-complete
single-office-selector-input-contract-exact
candidate-list-owned-by-caller-exact
multi-office-scheduler-open
candidate-construction-open
office-traversal-order-open
assigned-person-removal-open
```

## 2. candidate list 明确由 caller 传入

`005FAF00` 内部：

```asm
005FAF40 mov ecx,[esp+28]
005FAF49 call 0047BED0
```

这里迭代的是 arg1 candidate list。

因此：

```text
005FAF00 不构造候选池
005FA650 不构造候选池
```

候选顺序、候选集合、是否已去除已任官人员，全部属于 caller/scheduler 层。

## 3. 公开自动封官逆向文件没有上层调用点

`函数[自动封官].txt` 从 `005FAF00` 本体开始，只恢复了 selector 逻辑，没有记录：

```text
call 005FAF00
```

的上层 scheduler。

因此目前不能声称：

- 官职严格按 officeId 0→79 遍历；
- 高官到低官；
- 文官/武官分开两轮；
- 每选中一人就从共享候选列表删除；
- 每个官职都重新构造完整候选池。

这些全部继续 open。

## 4. `first-in-list wins` 只解决单官职 tie，不解决全局分配

`005FAF00` 已经 exact：

```ts
if (candidateScore > bestScore) {
  best = candidate
}
```

所以同分时：

```text
caller list 中先出现的人胜出
```

但这并不能推出：

```text
personId 小者一定优先
```

因为 list order 仍由 caller 决定。

更不能推出：

```text
某武将先拿高官还是低官
```

因为这还取决于 office traversal order。

## 5. 跨官职 scheduler 至少需要解决三件事

一个完整 fidelity scheduler 必须恢复：

```text
A. offices traversal order
B. candidate list construction / order
C. winner application / removal semantics
```

这三者共同决定最终自动封官结果。

例如即使 selector 完全相同：

```text
高官→低官
```

与：

```text
低官→高官
```

会产生完全不同的最终名单。

## 6. 已任官者如何处理仍 open

当前 `005FAF00` 只返回一个 `struct_person*`。

它本身没有：

- 修改候选列表；
- 设置官职；
- 删除已选人；
- 继续下一个官职。

因此 winner 的实际写回和后续 candidate removal 必然发生在上层。

公开资料未恢复这部分。

所以不能擅自实现：

```ts
candidates.remove(winner)
```

并声称是 original exact。

## 7. scoringMode 的 caller 语义仍 open

`005FAF00` 第三个参数已经明确分成：

```text
0  -> role-affinity mode
!=0 -> weighted-threshold mode
```

但没有 caller 就无法确认：

```text
哪个入口传0
哪个入口传1
```

因此仍禁止直接命名成：

```text
playerMode / aiMode
```

只能保留行为名。

## 8. 当前安全实现

```ts
interface AutoOfficeSchedulerProfile {
  officeOrder: OfficeId[]
  buildCandidates(ctx): Person[]
  removeAssignedPerson: boolean | CustomRule
}

selector 则保持 exact：

```ts
winner = selectAutomaticOfficeCandidate(
  candidates,
  office,
  scoringMode
)
```

严格 fidelity profile 在 scheduler 未恢复前，应把这三项标 open；compatibility profile 可以使用稳定顺序，但必须明确是 fallback。

## 9. 推荐 fallback

若引擎必须先闭环：

```text
officeOrder:
  officeId ascending

candidateOrder:
  personId ascending

afterAssignment:
  remove winner from later candidate pools
```

但三项都必须标：

```text
provisional scheduler fallback
```

不能标 original behavior。

## 10. 本轮关闭 / 仍 open

### 已关闭 / 收紧

- `005FAF00` 自身不构造候选池；
- candidate list 明确由 caller 传入；
- 单官职 tie 只依赖 caller list 顺序；
- `005FAF00` 不负责 winner 官职写回 / removal / next-office；
- 因此 multi-office 结果必须由上层 scheduler 决定。

### 仍 open

1. `005FAF00` caller/xref；
2. office traversal order；
3. candidate list construction；
4. candidate list original iteration order；
5. winner 官职写回函数；
6. 已分配者是否/何时移出后续候选池；
7. scoringMode per caller；
8. 第81个 internal office entry；
9. Vanilla / PS2 / Wii 差异。

## 11. 来源

- sjn4048/311MemoryResearch `内存资料/函数[自动封官].txt`
- fudanglp/311resource `san11pk_dump.exe_functions.csv`
- 关联：`43-auto-office-selector-exactness.md`
