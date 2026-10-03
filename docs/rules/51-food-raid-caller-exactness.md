# P0-16 兵粮袭击 caller / 零伤害边界

更新：2026-10-03。主目标版本：PC-PK1.1。

## 1. 本轮结论

P0-16 重点清理 E9 的一个长期 open：

```text
大盾 / 矢盾 / 金刚 / 不屈
把本次兵损置为0后，
是否还会进入兵粮袭击？
```

PC-PK1.1 的原攻击函数已经能给出明确 caller 级答案：

```text
会。
```

具体顺序：

```text
005B03BA  防御技能判定
005B03C6  若发动 -> damage = 0

005B03CD  扫讨
005B03E1  威风

005B03F5  target troop -> eax
005B03F7  attacker troop -> esi
005B03F9  call 005ADB20
005B03FE  result -> attackResult +0x18
005B0401  result -> attackResult +0x2C
```

因此可以精确排除：

```ts
if (damage == 0) {
  skipFoodRaid();
}
```

作为 caller 逻辑。

状态：

```text
P0-16-audit-complete
zero-damage-caller-still-invokes-food-raid-exact
food-raid-result-separated-from-troop-damage-exact
helper-internal-zero-damage-check-still-open
rng-body-open
resource-clamp-open
```

## 2. 防御技能置零发生在兵粮袭击之前

PC 原函数：

```asm
005B03BA call 005AE000
005B03BF add  esp,04
005B03C2 test eax,eax
005B03C4 je   005B03CD
005B03C6 mov  [ebp+0c],0
```

此处：

```text
[ebp+0c] = 本次兵力伤害
```

也就是防御技能成功时：

```text
troopDamage = 0
```

但控制流没有跳过后面的 food-raid 段。

随后仍按固定顺序进入：

```asm
005B03F5 mov eax,edi
005B03F7 mov esi,ebx
005B03F9 call 005ADB20
```

所以：

> 防御技能导致 0 兵损，并不会在 caller 层阻止兵粮袭击 helper 被调用。

这是 PC-PK1.1 caller 逐指令级结论。

## 3. food raid 与 troop damage 是独立 attack-result 字段

调用完成后：

```asm
005B03FE mov [ebp+18],eax
005B0401 mov [ebp+2c],eax
```

而兵损一直保存在：

```text
[ebp+0c]
```

因此调用链至少明确区分：

```text
troopDamage
!=
foodRaidResult
```

不能实现成：

```ts
foodRaid = f(finalTroopDamage)
```

并把 damage=0 自动推出 foodRaid=0。

## 4. helper 调用点没有显式传入 damage

在 `005B03F9` 之前没有：

```text
push damage
push attackResult
```

调用点只明确准备：

```text
eax = target troop
esi = attacker troop
```

然后直接：

```asm
call 005ADB20
```

因此公开 caller 证据没有显示 `005ADB20` 接受“最终兵损”作为显式参数。

这进一步支持：

```text
兵粮袭击是独立附加效果
而不是按最终兵损比例计算
```

但在没有 `005ADB20` 完整函数体前，不能绝对宣称 helper 内部永远无法读取其他状态。

所以严格表达为：

```text
no explicit damage argument at recovered call site
```

而不是：

```text
helper provably cannot inspect damage
```

## 5. 与攻略数量公式一致

2008《技术详解》记录：

```text
抢粮 = Attack × R
R = 1..2
上限 = floor(己方兵力/2)
```

它本身就不包含：

```text
本次造成兵损
```

现代实测也显示：

- 普攻和战法都落在 Attack×[1,2] 范围；
- 200兵时上限100；
- 连击可发生两次抢粮。

这与 PC caller 的“food raid 独立于 damage 字段”结构一致。

但 RNG 粒度仍不能从攻略反推。

## 6. 反击路径与零伤害路径必须分开

原函数对反击有明确跳转：

```text
强袭 / 突袭免反伤成功
-> jmp 005B0404
```

逆向注释明确指出该跳转会绕过：

```text
金刚
不屈
矢盾
大盾
扫讨
威风
袭击兵粮
```

因此：

### 主动攻击被盾挡成0伤害

```text
仍调用 005ADB20
```

### 反击/反伤专用跳转

```text
直接绕过 005ADB20
```

不能把这两个“0伤害”场景合并。

## 7. 当前 fidelity 实现边界

当前安全写法：

```ts
damage = resolveTroopDamage(...)

if (defenseSkillTriggered) {
  damage = 0
}

// do NOT gate this call on damage > 0
foodRaid = resolveFoodRaid(attacker, target)
```

其中：

```text
resolveFoodRaid caller invocation:
  exact

resolveFoodRaid internal RNG/formula:
  partially documented / exact body open
```

如果 fidelity 引擎尚未恢复 helper body，可继续使用 E9 compatibility model：

```ts
k = randomIntInclusive(10, 20)
raid = min(
  floor(attacker.attack * k / 10),
  floor(attacker.troops / 2)
)
```

但 `k=10..20` 仍只能标：

```text
compatibility-reconstruction
```

## 8. 本轮关闭 / 仍 open

### 已关闭

- 防御技能置0伤害后，caller 是否跳过 food raid：
  **不跳过；仍调用 helper。**
- food raid 是否与 troop damage 共用同一个结果字段：
  **否，字段独立。**
- recovered call site 是否显式把 damage 作为参数传入：
  **没有。**

### 仍 open

1. `005ADB20` 完整逐指令 body；
2. helper 内部是否存在额外状态 gate；
3. 原 RNG 粒度 / 分布；
4. 目标粮少于计算值时如何裁剪；
5. 攻击方接近50000粮上限时如何裁剪；
6. 支援攻击是否走同一 helper；
7. 水上 active profile 下枪兵是否满足 tech gate；
8. 战法失败路径的最终调用语义；
9. Vanilla / PS2 / Wii 等价性。

## 9. 来源

逆向：
- sjn4048/311MemoryResearch
  - `内存资料/函数[部队攻击].txt`
  - PC-PK1.1 `005B03BA..005B0401`

攻略 / 实测：
- 游民星空《三国志11 技术详解》
  - https://wap.gamersky.com/gl/Content-114545.html
- 游侠《三国志11 技术详解》
  - https://3g.ali213.net/gl/html/7604.html
- 现代枪兵科技实测文章用于范围/连击交叉，不用于恢复原RNG粒度。

关联：
- `24-food-raid.md`
- `docs/sources/food-raid.json`
