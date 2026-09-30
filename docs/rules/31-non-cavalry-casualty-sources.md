# E16 非骑兵来源的武将负伤 / 战死

更新：2026-10-01。主目标：PC-PK1.1 战场 casualty 来源分流。

## 1. 本轮核心结论

旧问题：

> 普攻、其他战法、火焰、设施攻击是否在造成兵力损失或击破后，统一再掷一次武将负伤 / 战死概率？

E16 的答案是：

**没有证据支持一个“所有攻击共用”的统一 casualty roll。原作按明确来源进入不同专用函数。**

当前 PC-PK1.1 可明确分流为：

| 来源 | 武将结果 | 主要函数 / 规则 |
|---|---|---|
| 普通攻击 / 一般战法 / 设施攻击导致部队壊灭 | 不额外掷通用负伤/战死 | 击破后主要进入俘虏/逃走 |
| 弩/井阑/舰船火矢、贯射、乱射 | **负伤** | `005974C0` 狙伤 |
| 猛者 + 成功位移战法 | **负伤** | 50%专用触发 |
| 业火种 / 业火球 | **战死 + 独立负伤** | `00597350` |
| 骑兵突击 / 突进 | **战死** | `005975E0`，E16只作边界引用 |
| 单挑 | 独立负伤/战死 | 单挑系统 |

因此引擎不能实现成：

```ts
afterEveryAttackOrDestruction() {
  rollGenericDeath()
  rollGenericInjury()
}
```

而应由各来源自己的 resolver 显式调用。

## 2. 共用候选函数：005971F0

SIRE 地址表：

```text
005971F0
DesignateInjuredPersonnel
输入 EBX = 部队指针
返回 EAX = 预定受伤人员指针
```

弩兵狙伤、业火炸死、业火炸伤、骑兵突死都能看到对该 helper 的调用。

已知它会处理：

- 强运；
- 护卫；
- 部队中是否存在合法候选。

因此后面所有概率都应理解为：

> **已经由 005971F0 指定某名合法候选之后的 conditional chance。**

若三人部队有多名合法候选，单个武将的 unconditional chance 还依赖 `005971F0` 的选择算法；公开 TXT 目前没有展开其完整函数体。

## 3. 弩兵狙伤：005974C0

这是 E16 最重要的补充。

### 3.1 哪些战法能狙伤

原函数把战法映射为四类，其中三类进入计算、一类直接返回。

可造成狙伤的五个攻击上下文：

```text
弩兵 火矢
井阑 火矢
舰船 火矢
弩兵 贯射
弩兵 乱射
```

基础狙伤率 A：

```text
三种火矢 = 0
贯射       = 1
乱射       = 2
```

这由 `005974C0` 函数体和 2010 年 SIRE 作者说明相互验证。

### 3.2 精确公式

原函数：

```text
0059750D call 005971F0   指定受伤候选
0059752A call 00596480   统武比较档
00597538 test critical
0059753A 0F 95 C1       setne cl
0059753D add eax, ebx    + 性格
0059753F add ecx, eax    + 会心
00597541 lea eax,[ecx+ebp-1]
00597546 ProbabilityCheck
```

因此：

```ts
Psniper =
  tacticBase
  + statComparisonTier
  + personality
  + criticalBonus
  - 1
```

其中：

```text
tacticBase:
火矢 0
贯射 1
乱射 2

personality:
小心 0
冷静 1
刚胆 2
莽撞 3

criticalBonus:
非会心 0
会心   1
```

`00596480` 的输出由原 SIRE 说明锁定为：

```text
-2 / -1 / 0 / +1
```

比较项是：

```text
攻击方主将 max(统率,武力)
vs
预定受伤武将 max(统率,武力)
```

### 3.3 统武差档阈值

公开 SIRE 原帖只给出四个返回档，没有展开 `00596480` 函数体。

现代复核资料一致给出：

```ts
diff =
  attacker.max(LDR,WAR)
  - target.max(LDR,WAR)

statComparisonTier =
  diff > 12 ? +1 :
  diff >= 7 ?  0 :
  diff >= 1 ? -1 :
              -2
```

证据等级：

```text
返回值四档：reverse-source-confirmed
阈值 1/7/12：secondary-corroborated / empirical-high
```

在 `00596480` 原函数逐指令恢复前，不把阈值提升成地址级 confirmed。

### 3.4 会心 opcode 纠错

旧注释把：

```asm
0F 95 C1
```

写成了类似 `setnc` 的说明。

x86 opcode `0F 95 /r` 实际是：

```asm
SETNE / SETNZ
```

结合前一条：

```asm
test esi,esi
```

可知：

```text
critical != 0 => +1
critical == 0 => +0
```

所以会心确实提高狙伤率1个百分点；这里是旧汇编注释的 mnemonic 错误，不是原游戏逻辑失效。

### 3.5 上限与示例

理论最高：

```text
乱射2
+ 统武优势1
+ 莽撞3
+ 会心1
- 1
= 6%
```

最低可为负；传入概率 helper 后实际成功率按0理解。

例如最大统武优势、莽撞目标：

| 战法 | 非会心 | 会心 |
|---|---:|---:|
| 火矢 | 3% | 4% |
| 贯射 | 4% | 5% |
| 乱射 | 5% | 6% |

成功后调用：

```text
005963E0
```

进行具体伤病处理。

这条路径**只负伤，不战死**。

## 4. 火矢边界：需要修正旧文档

必须区分两个概念：

### 4.1 火矢不会进入业火 casualty

火矢不会因为“点火”去调用：

```text
00597350
```

所以它没有业火种/业火球那套：

```text
baseDeath + personality - abilityProtection
```

炸死公式。

### 4.2 但箭类火矢可进入狙伤

弩、井阑、舰船火矢会进入：

```text
005974C0
```

所以可能造成武将负伤。

因此正确描述是：

```text
火矢：
  不触发业火炸伤炸死
  但可触发弩系狙伤
```

不能写成“火矢只扣兵，绝不伤将”。

## 5. 业火种 / 业火球：00597350

火陷阱主流程在：

```text
ID16 业火种
ID15 业火球
```

时调用 `00597350`。

其他火种、火焰种、火球、火焰球、火船不会进入这条 casualty 函数。

## 6. 业火候选的能力保护

`00596380`：

```ts
M = max(
  target.leadership,
  target.strength,
  target.intelligence
)

abilityProtection =
  M <= 70 ? 0 :
  M <= 80 ? 1 :
  M <= 90 ? 2 :
            3
```

汇编明确：

```asm
call 00596380
sub  esi,eax
```

所以能力越高，业火负伤/战死概率越低。

## 7. 业火战死

战死设置：

```ts
baseDeath =
  normal ? 2 :
  high   ? 4 :
  none   ? SKIP_DEATH : 0
```

候选性格内部值：

```text
小心0 / 冷静1 / 刚胆2 / 莽撞3
```

条件概率：

```ts
deathChance =
  max(
    0,
    baseDeath
    + personality
    - abilityProtection
  )
```

普通战死：

| max(统,武,智) | 小心 | 冷静 | 刚胆 | 莽撞 |
|---|---:|---:|---:|---:|
| ≤70 | 2 | 3 | 4 | 5 |
| 71–80 | 1 | 2 | 3 | 4 |
| 81–90 | 0 | 1 | 2 | 3 |
| >90 | 0 | 0 | 1 | 2 |

高战死：

| max(统,武,智) | 小心 | 冷静 | 刚胆 | 莽撞 |
|---|---:|---:|---:|---:|
| ≤70 | 4 | 5 | 6 | 7 |
| 71–80 | 3 | 4 | 5 | 6 |
| 81–90 | 2 | 3 | 4 | 5 |
| >90 | 1 | 2 | 3 | 4 |

成功后调用：

```text
004ACBE0
```

执行战死。

## 8. 业火负伤

无论是否开启战死，都继续走独立负伤阶段。

它会**再次调用 `005971F0`**，所以可能与刚才战死候选不是同一个人。

```ts
injuryChance =
  max(
    0,
    2
    + personality
    - abilityProtection
  )
```

即与普通战死表相同。

成功后调用：

```text
005963E0
```

伤病等级分布仍 open。

## 9. 猛者

原地址资料：

```text
0059781A 猛者(51)
00597725 发动概率(50)
```

2006 同期特技说明：

> 使用能推动敌人的战法后，50%概率敌将负伤。

所以通用触发可写：

```ts
if (
  attackerHasSkill(MIGHTY)
  && tacticSuccessfullyMovedTarget
  && Chance(50)
) {
  resolveMightyInjury(targetUnit)
}
```

它是一条独立专用来源，不与弩兵狙伤或业火 casualty 合并。

当前仍缺：

- 猛者如何选择三人部队中的目标；
- 成功后伤病等级；
- 是否逐字复用 `005971F0/005963E0`。

在原 caller 未展开前不强行假设。

## 10. 普通攻击 / 一般战法 / 设施攻击

已检查的公开 PC-PK 逆向文本里，没有发现一个在所有：

```text
普通攻击
普通战法
设施攻击
部队兵力归零
```

之后统一调用 casualty selector / injury / death handler 的逻辑。

相反，已知伤亡入口都具有明确来源：

```text
弩系战法 -> 005974C0
骑兵突死 -> 005975E0
业火 -> 00597350
猛者 -> 专用50%
单挑 -> 单挑系统
```

后来的 PK2.2 MOD 也把“全兵种战法负伤系统”和“全兵种战法讨杀系统”作为新增功能，而不是原版既有系统。

因此 fidelity 实现：

```ts
function resolveGenericTroopDestruction() {
  resolveCaptureOrEscape()
  // 不添加自拟统一 injury/death roll
}
```

## 11. 普通火伤 / 火船 / 落石

当前源级边界：

```text
普通火计 / 着火格：
  兵力火伤
  no hellfire casualty

普通火种/火焰种/火球/火焰球：
  兵力/耐久伤害
  no hellfire casualty

火船：
  火伤
  25%混乱
  no hellfire casualty

业火种：
  火伤
  50%混乱
  00597350 casualty

业火球：
  火伤
  00597350 casualty
```

注意弩/井阑/舰船“火矢”的**箭击本身**另走狙伤，不能与“普通火焰持续伤害”混淆。

当前没有证据让普通着火格、普通火陷阱、落石、设施攻击再额外掷一个通用武将 casualty。

## 12. 概率边界

所有上述概率都要分清：

```text
event chance
vs
per-officer unconditional chance
```

`005971F0` 先指定一名合法候选。

因此：

```text
狙伤6%
```

表示：

> 在最高公式条件、且某名合法武将已成为预定受伤候选后的事件判定参数最高为6。

并不表示三人部队中的每名武将都各自独立6%。

同理业火表也是候选条件概率。

## 13. 版本边界

### PC-PK1.1

- 弩兵狙伤：reverse-engineered；
- 业火 casualty：reverse-engineered；
- 猛者50%：地址 + 同期资料高置信；
- 无统一 casualty roll：negative-reverse-evidence-high。

### Vanilla

同期已存在：

- 弩兵火矢/贯射/乱射；
- 猛者；
- 护卫/强运；
- 骑兵战死。

但 PC-PK 地址常量不能未经二进制回归直接标 Vanilla source-confirmed。

尤其业火种/业火球和PK技巧链要单独处理版本边界。

### PS2 / Wii

逐项常量仍 open。

## 14. E16 关闭与剩余 exactness

### E16 已关闭

- “普通击破后是否统一2%～5%战死/约15%负伤”；
- 弩兵狙伤通用公式；
- 会心对狙伤 +1 的真实 opcode 语义；
- 业火种/业火球 conditional 战死/负伤公式；
- 无战死设置对业火：只跳过战死、不跳过负伤；
- 火矢“不会业火炸伤”与“会弩系狙伤”的边界；
- 猛者50%作为独立来源。

### 仍 open

1. `005971F0` 多候选时的精确 selector；
2. `005963E0` 负伤成功后的伤病等级；
3. `00596480` 四档返回值的原指令阈值（1/7/12当前为 secondary-corroborated）；
4. 猛者候选与伤病等级原 caller；
5. Vanilla / PS2 / Wii 逐项等价性。

## 15. 来源

逆向：
- https://github.com/sjn4048/311MemoryResearch/blob/master/内存资料/函数[弓兵狙伤].txt
- https://github.com/sjn4048/311MemoryResearch/blob/master/内存资料/函数[火陷阱炸伤炸死].txt
- https://github.com/sjn4048/311MemoryResearch/blob/master/内存资料/函数[骑兵突死].txt
- https://github.com/sean2077/311SireCustomizedPackageDev/blob/dev/material/内存地址汇总.md

SIRE 作者原帖：
- https://www.xycq.org.cn/forum/viewthread.php?authoruid=374759&tid=209820

狙伤阈值复核：
- https://www.bilibili.com/opus/827377857051230209
- https://www.toutiao.com/article/6973578283569054215/

猛者同期资料：
- https://games.sina.com.cn/j/h/2006-03-22/14333934.shtml

“全兵种伤亡”为后续新增功能的反证：
- https://www.bilibili.com/video/BV1yq4y1S7Mr/
- https://www.bilibili.com/video/BV14P4y1s762/
