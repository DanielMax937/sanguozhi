# E13 混乱 / 伪报持续与恢复

更新：2026-09-30。主目标版本：PC-PK1.1。

## 1. 本轮结论

此前把“自然解除”理解成“每旬按概率醒来”是错误的。

PC-PK1.1 原函数 `00599B90` 已经把异常状态处理完整展开：

```text
先执行混乱/伪报本旬行为
→ 读取状态剩余计数
→ 普通位置减 1
→ PK 合资格阵/砦/城塞范围内减 2
→ 最低钳到 0
→ 计数为 0 时恢复正常
```

因此：

```text
不存在“每旬50%自然清醒”的原作规则
```

E13 真正仍未恢复的核心只剩：

1. 普通伪报 `005917D0` 成功时写入的初始计数分布；
2. 普通扰乱 `00591A20` 成功时写入的初始计数分布；
3. 重复施放时 `SetTroopStatus` 对旧计数的覆盖/刷新语义。

## 2. 数据结构：状态类型和剩余计数是两个字段

PC 部队结构：

```text
+0x24  状态
       0 = 正常
       1 = 混乱
       2 = 伪报

+0x28  状态持续回合 / 剩余计数
```

SIRE 地址表还定位：

```text
004AEA70  SetTroopStatus
00496350  SetTroopTurnCount
```

所以引擎应显式保存：

```ts
troop.status
troop.statusTurnCount
```

不能根据状态类型每旬重新随机一次“是否恢复”。

## 3. 每旬异常处理：00599B90

### 3.1 混乱先吃掉本旬行动

原指令：

```text
00599B9E  判断 status == 1
00599BA5  判断是否已行动
00599BB1  若未行动，设置为已行动
```

即混乱部队进入本旬异常处理时，如果尚未行动，会直接失去正常行动机会。

### 3.2 伪报先执行撤退，再标已行动

原指令从 `00599BB6` 开始判断 `status == 2`。

若部队尚未行动，会：

1. 取得所属据点；
2. 调用移动/路径处理，使部队朝所属据点退却；
3. 设置为已行动。

随后才进入统一的状态计数减少。

因此顺序必须实现为：

```text
异常状态行为
→ 已行动
→ 状态计数减少
→ 若为0则清除异常
```

不能把“恢复正常”提前到本旬异常行为之前。

## 4. 自然恢复是确定性倒计时

原函数在：

```text
00599C25
```

把正常恢复速度初始化为：

```text
1
```

随后：

```text
00599CB3  读取 [+28] 状态计数
00599CC1  remaining -= recoverySpeed
00599CCD  最低钳到 0
00599CD0  SetTroopTurnCount
00599CDC  remaining == 0 时进入恢复正常
00599CE4  调用 004AD8A0
```

因此基础规则精确为：

```ts
remaining = Math.max(0, remaining - 1)

if (remaining === 0) {
  clearAbnormalStatus()
}
```

这个过程不读取：

- 智力；
- 性格；
- 兵科；
- 适性；
- 当前兵力；
- 随机数。

所以“智力越高每旬越容易清醒”不是 PC-PK1.1 的自然恢复逻辑。

## 5. PK 阵 / 砦 / 城塞：恢复速度 1 → 2

`00599C3D` 起先根据势力技巧决定当前阵系设施类型：

```text
无强化设施：ID3 阵
有技巧25 强化设施：ID4 砦
有技巧26 强化城墙：ID5 城塞
```

然后读取对应设施类型的最大有效范围并检查同势力合资格设施。

若范围内存在对应设施：

```text
00599CAB recoverySpeed = 2
```

否则保持：

```text
recoverySpeed = 1
```

所以 PC-PK1.1 精确式为：

```ts
const recoveryStep = inQualifiedDefenseFacilityAura ? 2 : 1
remaining = Math.max(0, remaining - recoveryStep)
```

例如：

```text
remaining = 3

普通位置：
3 -> 2 -> 1 -> 0

阵系有效范围：
3 -> 1 -> 0
```

日文 Wiki 的玩家表述是“状态异常恢复率增加”，但原 EXE 的具体实现不是概率加成，而是每旬多减 1 个计数点。日文 Wiki 同时明确指出：**PC 无印没有阵/砦/城塞的异常状态恢复效果**。

因此版本层暂写：

```text
PC-PK1.1：阵系范围内 step=2（reverse-engineered）
PC Vanilla：无阵系加速（documented-guide）
```

Vanilla 的基础 `step=1` 与 PK 基础逻辑一致，可作为高置信兼容规则；但没有在本轮取得 Vanilla EXE 的同地址反汇编。

## 6. 少兵自动混乱：初始计数已是源码精确 1～2

`函数[自动眩晕].txt` 的 PC 原代码：

```text
0059A1F5  push 02
0059A1F7  call 00472150
0059A1FF  inc al
0059A206  push eax
0059A207  push 01
0059A20B  call 004AEA70
```

SIRE 地址表确认：

```text
00472150 GetRandomX(X) = 0 .. X-1
```

所以这一条来源的混乱持续计数为：

```text
GetRandomX(2) + 1
=> 1 或 2
```

这条结论只适用于“少兵自动混乱”路径，不能反推普通计略扰乱/伪报也一定使用相同分布。

## 7. 普通伪报 / 扰乱：效果函数入口已定位，但函数体仍缺

计略主流程已经定位：

```text
005917D0  伪报效果处理
00591A20  扰乱效果处理
00591C70  镇静效果处理
```

上层流程会先算成功与会心，再把相关 flag 传入效果函数。

但是当前公开逆向 TXT 没有展开 `005917D0 / 00591A20` 内部设置初始 duration 的逐指令，因此不能源码级写：

```text
普通：1回合多少%、2回合多少%
会心：2回合多少%、3回合多少%
```

可靠资料边界只有：

- 日文 Wiki：普通伪报/扰乱持续“数回合”；
- 日文 Wiki：会心时**必定至少 2 回合**；
- 2009 年旧 2ch 讨论也明确把计略会心描述为“混乱/火计/伪报效果最低持续2回合”；
- 2007 年旧 2ch 有玩家记忆“伪报和扰乱会心持续3回合”，只能作为历史经验锚点，不能覆盖“至少2回合”的更稳表述。

因此 fidelity 模式仍必须把普通计略初始持续分布标为 `unresolved`。

## 8. 螺旋突刺：不要把社区重实现当原 EXE

公开研究资料中的 `008A...` 扩展代码，以及现代复刻项目，都给出过类似：

```text
非会心：15%混乱
会心：100%混乱
普通 duration 1/2
会心 duration 2/3
```

但 `008A...` 段属于研究者/修改器新增区域，不能直接冒充原 EXE 原指令。

因此 E13 只保留：

- “螺旋突刺存在非会心低概率混乱、会心高概率/必混乱”的攻略/重实现锚点；
- 具体 duration 分布继续与普通计略分开分级。

如果以后恢复原版战法效果 caller，再升级。

## 9. 工程 fallback：只补“初始计数”

开源复刻项目 `tankyc/sango_infinity` 当前配置对伪报、扰乱采用：

```text
普通：
  duration 1：70%
  duration 2：30%

会心：
  duration 2：70%
  duration 3：30%
```

对应公开数据：

```text
Skills.json
ID24 伪报
ID25 扰乱
```

这不是原作逆向常量，只能作为：

```text
provisional-engine-rule
```

推荐实现：

```ts
function fallbackInitialDuration(critical: boolean): number {
  const base = weightedChoice({1: 0.70, 2: 0.30})
  return critical ? base + 1 : base
}
```

随后恢复过程必须使用原代码级倒计时：

```ts
remaining = Math.max(
  0,
  remaining - (inPkDefenseAura ? 2 : 1)
)
```

也就是说 fallback 只污染“初始写入值”，不会污染后续恢复系统。

## 10. 重复施放仍 open

旧工程规则若存在：

```text
newRemaining = min(5, max(oldRemaining,newDuration)+1)
```

应删除，因为没有原作证据。

在 `005917D0 / 00591A20 / 004AEA70` 的覆盖语义恢复前，兼容实现可保守采用：

```text
remaining = max(currentRemaining, newlyRolledDuration)
```

但必须标 `provisional-engine-rule`。

## 11. 镇静

日文 Wiki 明确：

- 镇静成功：解除目标混乱/伪报；
- 会心镇静：目标以及邻接友军均可被镇静。

这条是主动清除状态，不经过自然倒计时。

## 12. E13 证据分级

### reverse-engineered / PC-PK1.1

- 部队 `+0x24` 状态、`+0x28` 状态剩余计数；
- `00599B90` 每旬异常状态主处理；
- 混乱先标已行动；
- 伪报先执行朝所属据点退却再标已行动；
- 普通每旬计数 -1；
- PK 合资格阵系范围内每旬 -2；
- 计数最低0，到0恢复正常；
- 少兵自动混乱初始计数 `GetRandomX(2)+1`，即1或2；
- `004AEA70 SetTroopStatus`；
- `00496350 SetTroopTurnCount`。

### documented-guide

- 普通伪报/扰乱持续“数回合”；
- 会心伪报/扰乱至少2回合；
- PC Vanilla 的阵系没有异常恢复加速；
- 镇静的基本/会心范围行为。

### provisional-engine-rule

- 普通 1/2 = 70%/30%；
- 会心 2/3 = 70%/30%；
- 重复施放暂用 `max(old,new)`。

### open

- `005917D0` 普通伪报初始 duration 原函数；
- `00591A20` 普通扰乱初始 duration 原函数；
- `004AEA70` 对已有异常状态的精确覆盖/刷新语义；
- Vanilla/主机版完整逐指令等价性；
- 原版螺旋突刺混乱 duration 的逐指令链。

## 13. 来源

- 311MemoryResearch：
  - `内存资料/整理/Func-自动03-部队异常状态处理.txt`
  - `内存资料/函数[自动眩晕].txt`
  - `内存资料/函数[计策施放全过程].txt`
  - `内存资料/地址资料.txt`
- 311SireCustomizedPackageDev：`material/内存地址汇总.md`
- 日文《三國志11攻略wiki》“戦争”：https://w.atwiki.jp/sangokushi11/pages/85.html
- 日文 Wiki 旧 2ch 日志：https://w.atwiki.jp/sangokushi11/pages/1964.html
- 2007 旧 2ch 日志：https://w.atwiki.jp/sangokushi11/pages/1890.html
- 开源复刻项目（仅 fallback）：https://github.com/tankyc/sango_infinity/blob/main/Build/Content/Data/Common/Skills.json
