# P0-1 普通登用概率 exactness

更新：2026-10-01。E20 后的首个 exactness-gap 清理项。

## 1. 结论

本轮**没有伪造 `005C4F80 GetHiringSuccessRate` 的原版闭式**。

但通过 311MemoryResearch 的整理文件：

```text
Func-人才01-计算登用是否成功.txt
Func-人才03-执行登用.txt
Func-人才04-执行登用完成.txt
Func-人才08-探索发现人才并登用.txt
```

可以把原版 PC-PK1.1 的外层链收紧为：

```text
004AF7D0
硬成功 / 硬失败
        ↓ 未命中
005C4F80
GetHiringSuccessRate -> p
        ↓
第三参数=0？
   ├─ 是：005BA4C0 deterministicValue < p
   └─ 否：义理外层倍率 -> 004721D0 runtime probability
```

因此当前真正缺的只剩：

1. `004AF7D0` 完整函数体；
2. `005C4F80` 完整函数体；
3. `005BA410` 完整函数体；
4. `005BA4C0` 的确定性值生成算法。

## 2. 004AFD60 外层已逐指令恢复

入口：

```text
004AFD60 GetRecruitmentSuccess
```

主要调用：

```text
004AFDC9 -> 004AF7D0
004AFDEB -> 005C4F80
004AFE97 -> 005BA4C0
004AFEB8 -> 004721D0
```

SIRE 地址表分别命名：

```text
004AF7D0 RecruitmentDetermination
004AFD60 GetRecruitmentSuccess
005C4F80 GetHiringSuccessRate
```

`005C4F80` 的备注还明确：

```text
会调用 005BA410（一组数据的计算）
```

## 3. 正常人才→登用：第三参数严格为0

普通人才菜单、本地登用和异地登用完成路径当前确认都把第三参数设为0。

所以 `004AFD60` 中：

```asm
test ebx,ebx
mov ecx,10
je 004AFE11
```

直接使：

```text
factor10 = 10
```

也就是说普通路径在 `005C4F80` 外层**不再额外乘义理0.9/0.7之类倍率**。

如果义理影响普通登用连续成功率，只能来自：

- `004AF7D0` hard gate；
- 或 `005C4F80` 内部。

不能把非0调用模式的外层义理倍率错误套给普通人才命令。

## 4. 非0调用模式：外层义理倍率精确

第三参数非0时：

```asm
edx = giri * 2
ecx = 15 - edx
ecx = min(ecx,10)

p2 = trunc(p * ecx / 10)
p2 = min(p2,100)
```

即：

```ts
factor10 =
  min(10, 15 - 2*giriInternal)

p2 =
  min(100, trunc(p*factor10/10))
```

随后调用：

```text
004721D0 ProbabilityCheck
```

而不是 `005BA4C0`。

如果 internal giri 为常见0..4：

| giri | factor10 | 倍率 |
|---:|---:|---:|
| 0 | 10 | 1.0 |
| 1 | 10 | 1.0 |
| 2 | 10 | 1.0 |
| 3 | 9 | 0.9 |
| 4 | 7 | 0.7 |

但“0..4就是该调用场景的最终义理业务编码”仍按结构资料理解，不能借此反推 `005C4F80` 本体。

## 5. 正常登用的最终判定是 deterministic，不是每次 Math.random()

第三参数=0时，原代码准备 `005BA4C0` 的参数：

```text
第四参数/dateKey
目标武将ID
执行武将ID
目标忠诚
执行武将魅力
执行者↔目标相性差
0
```

调用：

```text
004AFE97 -> 005BA4C0
```

之后：

```asm
mov ecx,[successRate]
cmp eax,ecx
setl dl
```

所以机器码语义明确是：

```ts
success =
  deterministicValue < successRate
```

注意原中文注释在这里写过“值大于成功率则成功”，但 `SETL` 与注释矛盾；以 opcode 为准，旧注释属于文字错误。

## 6. dateKey

SIRE 地址表直接命名：

```text
005B9C00 GetTimeValue
```

返回：

```ts
dateKey =
  currentDay * 7
  + currentMonth * 5
  + currentYear * 3
```

异地登用会把**发令时**的 dateKey 保存进 MissionParameter，抵达后继续传给 `004AFD60`。

所以：

```text
改变抵达日
!= 自动得到新的登用roll
```

只要任务保存的 dateKey 不变，最终 deterministic 输入仍保留发令日。

## 7. 005BA4C0 已确认的入参，不等于已恢复算法

当前能确认：

```text
deterministicValue =
  005BA4C0(
    dateKey,
    targetId,
    executorId,
    targetLoyalty,
    executorCharm,
    executorTargetAffinityDiff,
    0
  )
```

但公开 311MemoryResearch 整理文件与 SIRE 地址表均**没有 `005BA4C0` 函数体**。

因此不能根据入参自行发明：

- CRC；
- LCG；
- 简单加权和；
- hash %100；
- “每旬固定随机表”。

同样，最新 SIRE 新忠诚系统所说的“由武将ID和当前旬生成伪随机值”，只能说明 MOD 新实现的设计，不能反证原 `005BA4C0` 的具体算法。

## 8. 005C4F80 当前能确认到哪里

SIRE：

```text
005C4F80 = GetHiringSuccessRate
返回登用成功概率
会调用005BA410
```

`004AFD60` 又确认其返回值随后会：

- 乘外层 factor10；
- 除10；
- 上限100；
- 用作 deterministic threshold 或 runtime ProbabilityCheck 参数。

因此其业务输出可以安全表示为：

```text
integer successRate
nominal range <= 100 after outer clamp
```

但是**内部输入权重仍未知**。

现有资料只能定性确认：

- 忠诚相关；
- 相性相关；
- 执行者魅力相关；
- 人际关系的大量强制效果在 hard gate 层；
- target/executor 完整指针都传入，理论上还能读取更多字段。

不能把这些定性关系拼成百分比闭式。

## 9. 最新“基准60登用意愿”公式属于 MOD，不是原版

2025 年以后新版 SIRE / 血色衣冠资料出现一套完整、可配置的：

```text
基准值60
忠诚系数-100%
君主相性差-50%
执行者魅力+20%
三组人际关系权重
俘虏+10
仕官第一年-20
义理/野心修正
浮动值6
```

并且血色衣冠更新日志明确把它称为：

```text
“新忠诚度系统”
“登用意愿基准值”
可按难度配置
```

因此这套公式的证据标签必须是：

```text
SIRE-modern-mod-system
```

而不是：

```text
original-PC-PK1.1
```

禁止把：

```text
base=60
loyalty min=60
affinity coef=-0.5
charm coef=+0.2
first-service-year=-20
```

写进原版 fidelity profile。

## 10. hard gate 仍采用现有高置信顺序，但不冒充逐指令

`004AF7D0` 的存在、调用位置与功能已 reverse-confirmed：

```text
在005C4F80之前
处理嫌恶、结义、亲爱、禁止仕官期等
```

但公开文本没有完整函数体。

因此 Wiki 的关系优先顺序继续标：

```text
empirical-high
```

尤其：

```text
忠诚 + 义理 > 96
```

不要在函数体恢复前进一步宣称内部义理编码就是 UI 1..5 原值。

## 11. fallback 边界

现有项目 fallback 仍只允许替换：

```text
005C4F80 GetHiringSuccessRate
```

不得替换：

- hard gate；
- 第三参数模式分流；
- dateKey 保存；
- deterministic final compare。

推荐接口：

```ts
const forced =
  hardHiringGate(...)

if (forced !== NONE)
  return forced

const p =
  fallbackHiringRate(
    target,
    executor,
    ruler,
    dateKey
  )

if (mode === NORMAL) {
  const roll =
    stableHiringDeterministicValue(...)

  return roll < p
}

const p2 =
  applyNonzeroModeGiriMultiplier(
    p,
    target.giri
  )

return runtimeProbabilityCheck(p2)
```

其中 `fallbackHiringRate` 和 `stableHiringDeterministicValue` 都必须显式标 compatibility，不得命名成 original。

## 12. 本轮 exactness 状态

### 新增确认

- `004AFD60` 完整外层链可作为源码级基准；
- 普通第三参数=0，不吃非0模式外层义理倍率；
- 非0模式义理倍率精确；
- 正常模式 `005BA4C0` 七个入参已经明确；
- 最终比较严格为 `deterministicValue < p`；
- 发令日 dateKey 在异地登用任务中保留；
- 最新“基准60登用意愿”公式正式隔离为 MOD-only。

### 仍 open

- `004AF7D0` 完整 hard-gate 函数体；
- `005C4F80` 连续成功率闭式；
- `005BA410`；
- `005BA4C0` deterministic generator；
- Vanilla / PS2 / Wii 等价性。

这意味着本项**被显著收窄，但没有被虚假关闭**。

## 13. 来源

逆向：
- https://github.com/sjn4048/311MemoryResearch/blob/master/内存资料/整理/Func-人才01-计算登用是否成功.txt
- https://github.com/sjn4048/311MemoryResearch/blob/master/内存资料/整理/Func-人才03-执行登用.txt
- https://github.com/sjn4048/311MemoryResearch/blob/master/内存资料/整理/Func-人才04-执行登用完成.txt
- https://github.com/sjn4048/311MemoryResearch/blob/master/内存资料/整理/Func-人才08-探索发现人才并登用.txt
- https://github.com/sean2077/311SireCustomizedPackageDev/blob/dev/material/内存地址汇总.md

原版经验边界：
- https://w.atwiki.jp/sangokushi11/pages/74.html
- https://w.atwiki.jp/sangokushi11/pages/95.html
- https://w.atwiki.jp/sangokushi11/pages/1886.html
- https://www.gamersky.com/handbook/200603/21923.shtml

MOD-only 反例：
- https://c.tieba.baidu.com/p/9706421271?fr=good
- https://sg.games98.com/6377.html
