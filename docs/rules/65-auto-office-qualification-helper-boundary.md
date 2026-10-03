# P0-30 `005FA4D0` 任官资格 helper / 功绩与状态 gate 边界

更新：2026-10-03。主目标版本：PC-PK1.1。

## 1. 本轮结论

`005FA4D0` 已确认是 `005FAF00` 单官职 selector 的前置资格 helper。

函数边界：

```text
005FA4D0 .. 005FA57F
next = 005FA580
length ≈ 0xB0 bytes
```

调用方式：

```asm
005FAF61 mov ecx,[esp+2C] ; office ptr
005FAF65 push ecx
005FAF66 mov ecx,[esp+24]
005FAF6A push esi         ; person ptr
005FAF6B call 005FA4D0
005FAF70 test eax,eax
005FAF72 je reject
```

因此状态：

```text
P0-30-audit-complete
qualification-helper-boundary-exact
person-office-input-contract-exact
pre-score-gate-exact
qualification-vs-ranking-separation-exact
merit-threshold-body-open
location-status-identity-gates-open
```

## 2. `005FA4D0` 是资格 gate，不是评分器

`005FAF00` 的 score 逻辑发生在 `005FA4D0` 返回 true 之后。

所以必须分层：

```text
005FA4D0
  canPersonHoldOffice(person, office)

005FAF00
  scoreEligibleCandidate(person, office, mode)
```

这可以解释：

```text
功绩高
-> 有资格竞争更高官

但

```text
功绩不进入最终 score
```

两者并不矛盾。

## 3. 输入契约已经明确

`005FA4D0` 调用点只显式传：

```text
person pointer
office pointer
```

所以如果它检查：

- Merit；
- Identity；
- LocatedSP / 所在；
- Task / 状态；
- 当前 OfficeID；
- 势力归属；

都必须从这两个对象或全局 helper 内部读取。

不能把这些字段写成已知显式参数。

## 4. 功绩门槛应继续作为高置信行为，不升级 opcode

现有官职规则长期使用：

```text
requiredMerit = officeTier * 4000
```

并且自动封官实际行为与“功绩决定资格、能力/忠诚决定排名”高度一致。

但当前公开逆向没有 `005FA4D0` body，因此：

```text
officeTier * 4000
```

继续保持：

```text
documented/empirical-high
```

不升级为 `reverse-exact`。

## 5. 所在 / 状态 / 身份 gate 仍不能展开

311MemoryResearch 的注释只概括：

```text
主要判断勋功、所在、状态等属性
```

但没有逐指令 body。

所以当前不能确认：

- 武将在部队中是否必定不能封；
- 任务中是否不能封；
- 俘虏/在野/未登场是否在哪一层过滤；
- 已有官职是否必须高于/低于目标官职；
- 是否检查同势力/同军团；
- 所在城市/港关是否有额外限制。

这些都继续 open。

## 6. 与忠诚90 gate 的边界非常明确

`005FA4D0` 返回 true 后，`005FAF00` 还会独立执行：

```asm
cmp byte ptr [person+AC], 0x5A
jb reject
```

所以：

```text
true loyalty >= 90
```

不是 `005FA4D0` 的一部分，而是 selector 自己的第二道公共 gate。

因此 qualification helper 不应重复写忠诚90条件。

## 7. 当前安全接口

```ts
function eligible005FA4D0(person, office): boolean {
  return qualificationProfile.check(person, office)
}

function selectOfficeCandidate(...) {
  if (!eligible005FA4D0(person, office)) continue
  if (person.trueLoyalty < 90) continue
  ...score...
}
```

这样未来恢复 helper body 时，只替换 qualificationProfile。

## 8. 本轮关闭 / 仍 open

### 已关闭 / 收紧

- `005FA4D0` 函数边界 `005FA4D0..005FA57F`；
- 输入契约是 `(person, office)`；
- 它位于所有 score 计算之前；
- 它负责资格，不负责 final ranking；
- 忠诚90 gate 位于 helper 外部，不能重复塞进 `005FA4D0`。

### 仍 open

1. `005FA4D0` 完整 body；
2. merit threshold exact opcode；
3. officeTier 的 exact 读取字段；
4. 所在 gate；
5. Identity gate；
6. Task / 状态 gate；
7. 当前 OfficeID 相关限制；
8. 势力/军团归属限制；
9. Vanilla / PS2 / Wii 差异。

## 9. 来源

- sjn4048/311MemoryResearch `内存资料/函数[自动封官].txt`
- fudanglp/311resource `san11pk_dump.exe_functions.csv`
- 关联：`43-auto-office-selector-exactness.md`、P0-29
