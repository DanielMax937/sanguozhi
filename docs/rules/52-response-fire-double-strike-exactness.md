# P0-17 应射 caller / attack-type 与连战边界

更新：2026-10-03。主目标版本：PC-PK1.1。

## 1. 本轮结论

P0-17 没有恢复出 `00584DC8` 的完整函数体，但从同一套 PC-PK1.1 逆向地址表中锁定了一条非常关键的相邻分流：

```text
00586EE8 连击(12)
00586E12 对弩兵(3)间接攻击时连击无效
00586F0F 连击发动概率50%
           战法失败后的攻击也有效
           连击不对应支援攻击
```

这意味着“应射 + 连击”必须拆成两个方向：

```text
A. 主动攻击方的连击
B. 防守方应射产生的反击，再由防守方连击
```

二者不是同一个 gate。

状态：

```text
P0-17-audit-complete
attacker-double-strike-suppressed-on-indirect-vs-crossbow-pc-address-exact
support-attack-not-double-strike-pc-address-exact
response-fire-can-itself-double-empirical-high
response-fire-full-caller-open
attack-type-enum-open
naval-profile-open
```

## 2. 主动方：间接攻击弩兵时连击无效

PC-PK1.1 地址表明确记录：

```text
00586E12:
  对弩兵(3)间接攻击时连击无效
```

因此至少在原版 PC-PK1.1 连击判定链里存在：

```text
target unit type == 3
AND attack is indirect
=> attacker double strike disabled
```

这里的 `3` 与整套逆向资料中的兵种编号一致，表示弩兵。

所以不能实现成：

```ts
if (attacker.hasDoubleStrike)
  alwaysRoll50()
```

正确边界至少要有：

```ts
if (isIndirectNormalAttack && targetIsCrossbow)
  attackerDoubleStrikeEligible = false
```

## 3. 这不是“应射方不能连击”

历史实测与后续 SIRE 原版规则说明都明确保留：

```text
连击：
普通攻击可二次攻击
包括弩兵还射
不包括支援攻击
概率50%
```

所以 `00586E12` 不能误读成：

```text
弩兵应射绝对不能触发连击
```

更合理且与实测一致的结构是：

```text
主动方间接普攻弩兵
  -> 主动方自己的第二击被压掉

若目标具备应射并满足合法性
  -> 防守方产生一次还射

防守方若有连击
  -> 这次还射可再进行自身50%连击判定
```

这也解释了历史案例：

```text
A 弩兵攻击 B 弩兵
B 应射
B 因连击再射一次
A 若也有应射，可能再次还射
```

但 PC 的最大链深/终止条件仍没有源码闭合。

## 4. 支援攻击与连击分离是 PC 地址级明确规则

同一逆向记录在 `00586F0F` 明确说明：

```text
连击不对应支援攻击
```

所以：

```text
support attack
=> no double strike
```

这与 E10 已知：

```text
support attack
=> no response fire
```

一致。

因此支援攻击应被视为另一条独立攻击路径，而不是：

```text
normal attack + response-fire + double-strike
```

的简化复用。

## 5. 战法失败后的普通攻击仍可连击

地址表还明确写：

```text
00586F0F:
  战法失败后的攻击也有效
```

即当某些战法失败后退化/追加为普通攻击时，该普通攻击仍可能进入连击判定。

这说明连击 gate 更接近：

```text
normal-attack execution instance
```

而不是只检查：

```text
player selected "普通攻击" command
```

这对恢复应射链也很重要，因为应射本质上也是生成一次反击型普通攻击实例，而不是独立固定伤害。

## 6. 与应射的攻击方支援抑制相互印证

E10 已记录历史实测：

```text
对有应射的弩兵做间接普通攻击时
攻击方支援攻击不发动
```

而本轮又有 PC 地址级：

```text
对弩兵间接攻击时
攻击方连击无效
```

所以原流程明显不是：

```text
先正常结算主动攻击的连击/支援
最后再补一个应射
```

而更像：

```text
识别“对弩兵的间接普通攻击”
-> 进入特殊反击/应射相关分流
-> 抑制主动方部分二次攻击机会
-> 生成防守方还射机会
```

但 `00584DC8` 完整 caller 尚未恢复，不能把以上写成逐指令完整状态机。

## 7. 当前安全实现

### 主动攻击侧

```ts
function canAttackerDoubleStrike(ctx) {
  if (ctx.kind === "support")
    return false

  if (
    ctx.isIndirectNormalAttack
    && ctx.target.currentCombatProfile === CROSSBOW
  )
    return false

  return true
}
```

### 应射侧

```ts
if (canResponseFire(defender, attacker, ctx)) {
  performResponseNormalAttack()

  if (
    defender.hasDoubleStrike
    && roll50()
  ) {
    performSecondResponseAttack()
  }
}
```

其中第二段的“应射可连击”证据等级为：

```text
empirical-high / documented-original-behavior
```

不是本轮 opcode exact。

## 8. 不能过度推断的地方

`00586E12` 只明确给出：

```text
弩兵(3)
间接攻击
连击无效
```

当前仍不能从这一条单独证明：

- 是否必须目标已研究应射；
- 是否所有间接攻击类型都走这个 gate；
- “间接”内部 enum 值；
- 火矢/贯矢/乱射的 primary/collateral 是否全部共用；
- 水上舰船 active profile 是否仍视为弩兵；
- 这条 gate 是专门为应射写的，还是更广泛的“弩兵间接攻击特殊规则”。

所以当前表述固定为：

```text
attacker-side indirect-vs-crossbow double-strike suppression
```

而不是：

```text
response-fire prerequisite opcode
```

## 9. 本轮关闭 / 仍 open

### 已关闭

- 主动方间接攻击弩兵时，自己的连击是否照常：
  **否。PC 地址表明确禁用。**
- 支援攻击是否能连击：
  **否。PC 地址表明确排除。**
- 战法失败后形成的普通攻击是否可连击：
  **可以。**
- “应射方连击”与“主动方连击”是否应共用一个 gate：
  **不应共用。**

### 仍 open

1. `00584DC8` 完整 caller / body；
2. 技巧9检查周围的精确 unit-type / attack-type opcode；
3. `00586E12` 是否显式依赖 technique9 状态；
4. 火矢/贯矢/乱射 primary/collateral 逐路径；
5. 水上 active profile；
6. PC 双方应射+连击的递归终止/最大深度；
7. Vanilla / PS2 / Wii 等价性。

## 10. 来源

PC-PK1.1 逆向：
- sjn4048/311MemoryResearch `内存资料/地址资料.txt`
- 游侠NETSHOW《三国志11pk内存修改(更新内容)》

原作行为交叉：
- 日文 Wiki《技巧研究》
- 日文 Wiki《支援攻击》
- 历史玩家实测：还射本身可触发连击
- SIRE 原版规则说明：连击包括弩兵还射、不包括辅助攻击

关联：
- `25-response-fire.md`
- `docs/sources/response-fire.json`
