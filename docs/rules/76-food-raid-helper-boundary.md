# P0-41 兵粮袭击 `005ADB20` helper body / RNG-clamp 边界

更新：2026-10-03。主目标版本：PC-PK1.1。

## 1. 本轮结论

`005ADB20` 已确认是独立函数，边界为：

```text
005ADB20 .. 005ADBDF
next = 005ADBE0 GetAttackedTroopStrength
length ≈ 0xC0 bytes
```

调用点：

```asm
005B03F5 mov eax,edi   ; target troop
005B03F7 mov esi,ebx   ; attacker troop
005B03F9 call 005ADB20
```

helper 内部已知：

```text
005ADB55 -> techniqueId 1 = 兵粮袭击
```

因此 function role / caller contract 可以锁定，但公开资料仍没有完整 body。

状态：

```text
P0-41-audit-complete
food-raid-helper-boundary-exact
caller-register-contract-exact
tech1-check-inside-helper-exact
rng-body-open
food-clamp-order-open
zero-damage-inner-gate-open
```

## 2. helper 是独立附加效果函数

`005ADB20` 不是主攻击函数内部的一段 inline 代码。

IDB 函数表明确：

```text
005ADB20 sub_5adb20
005ADBE0 GetAttackedTroopStrength
```

所以主攻击函数 `005AFC70` 只是调用它并接收结果。

## 3. 输入契约进一步明确

恢复的 caller：

```text
eax = target troop
esi = attacker troop
call 005ADB20
```

没有显式：

```text
push damage
push tacticId
push attackResult
```

因此 helper 的主要输入至少是 attacker / target troop 本体。

这与数量模型使用：

- attacker Attack；
- attacker troops；
- target/attacker food；

高度一致。

但没有 body 前，不能宣称它绝对不会读取其他全局/上下文状态。

## 4. 技巧检查发生在 helper 内

原地址表：

```text
005ADB55 = techId 1
```

由于该地址位于 `005ADB20..005ADBDF` 内，可以确认：

```text
兵粮袭击技术资格检查属于 helper 自身
```

而不是 caller 在调用前已经完成。

这也意味着 caller 即使无技巧也可以调用 helper，由 helper 返回0。

## 5. 防御技能零伤害边界继续保持

P0-16 已确认：

```text
damage = 0
仍进入 005ADB20
```

因此 caller 层不能写：

```ts
if (damage === 0) return 0
```

但 helper 内部是否自己检查某个状态并最终返回0，仍然 open。

## 6. RNG 仍不能闭合

攻略/实测支持：

```text
rawRaid = attackerAttack * R
R ≈ [1,2]
cap = floor(attackerTroops / 2)
```

但当前没有：

- random helper xref；
- 10..20 常量；
- 100/200 百分比常量；
- 离散表；
- float RNG 指令。

所以：

```text
original RNG granularity/distribution = open
```

`k=10..20` 继续只属于 compatibility reconstruction。

## 7. resource clamp 顺序仍 open

正常容量下可确认：

```text
target food -= N
attacker food += N
```

但没有 helper body，仍无法确认：

### 目标粮不足

例如理论 raid=200、target food=50：

- 是否 actual=50；
- 是否 target clamp 到0而 attacker仍+200；
- 是否其他顺序。

### 攻击方接近50000粮上限

例如 attacker room=30、raid=200：

- 是否 actual=30；
- 是否 target仍-200；
- 是否多余部分消失。

因此 strict fidelity 不能把“守恒 min clamp”说成原作 exact。

## 8. 当前安全 fallback

```ts
raw = floor(attacker.attack * randomIntInclusive(10,20) / 10)
raid = min(raw, floor(attacker.troops / 2))

actual = min(
  raid,
  target.food,
  attacker.foodLimit - attacker.food
)
```

其中：

```text
randomIntInclusive(10,20): compatibility-reconstruction
safeTransfer min clamp: engine-safety-fallback
```

## 9. 本轮关闭 / 仍 open

### 已关闭 / 收紧

- `005ADB20..005ADBDF` helper 边界；
- caller 使用 `eax=target` / `esi=attacker`；
- techId=1 检查位于 helper 内；
- caller 不显式传 final damage；
- damage=0 仍调用 helper。

### 仍 open

1. `005ADB20` 完整 body；
2. RNG helper / 分布 / 粒度；
3. Attack×R 的 exact integer/float arithmetic；
4. attackerTroops/2 的 exact operation；
5. target food shortage clamp；
6. attacker food-cap clamp；
7. 两边 clamp 的调用顺序与守恒/非守恒边界；
8. helper internal zero-damage/state gate；
9. support attack / failed tactic / naval profile；
10. Vanilla / PS2 / Wii 差异。

## 10. 来源

- sjn4048/311MemoryResearch `内存资料/函数[部队攻击].txt`
- sjn4048/311MemoryResearch `内存资料/地址资料.txt`
- fudanglp/311resource `san11pk_dump.exe_functions.csv`
- 关联：`24-food-raid.md`、`51-food-raid-caller-exactness.md`
