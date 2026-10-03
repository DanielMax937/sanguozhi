# P0-15 技巧研究完成功绩 PC caller / 两套表冲突

更新：2026-10-03。主目标：PC-PK1.1。

## 1. 本轮结论

P0-15 对 E12 的长期冲突做源码边界收敛。

当前仍存在两套文献表：

| 等级 | 现行日文 Wiki《功绩值》 | 同站《小ネタ》/2006 中文攻略 |
|---:|---:|---:|
| Lv1 | 500 | 500 |
| Lv2 | 1000 | 1000 |
| Lv3 | 2000 | 1500 |
| Lv4 | 3000 | 2500 |

本轮最重要的新结论不是选出其中一套，而是确认：

```text
PC-PK1.1 public reverse notes
do not currently expose
the technique-research completion merit constant/caller.
```

因此状态为：

```text
P0-15-audit-complete
lv1-lv2-consensus-documented
lv3-lv4-conflict-real
pc-pk11-completion-merit-caller-open
participant-allocation-open
version-transition-open
```

## 2. 研究命令地址不能等同于完成功绩地址

311MemoryResearch 的修改记录定位：

```text
研究技巧：005D8F68
```

但上下文明确是：

```text
君主技·内政行动力消耗-1
```

所以 `005D8F68` 只能作为：

```text
research command / AP consumption path anchor
```

不能把它写成：

```text
research completion merit writer
```

P0-14 已进一步把它放入：

```text
sub_5D8C50
```

的研究命令执行路径中；这与研究时间 calculator `sub_5D7DD0` 也应分开。

## 3. “经验和功绩获得”逆向目录没有列出技巧研究完成功绩常量

311MemoryResearch 的公开“以下经验和功绩获得”段落逐项给出大量 PC-PK1.1 地址，例如：

```text
005CBF26 巡查功绩 +50
005C4377 训练功绩 +50
005C66BC 生产武器军马功绩 +50
005C5EEA 生产兵器舰船功绩 +100
005D11DC 流言成功功绩 +150
005B236D 同盟成功功绩 +500
005B65E3 停战成功功绩 +500
005CACC9 商人买卖功绩 +50
004B2EFD 占领都市功绩 +2000
004BF522 输送队抵达功绩 +200
```

同一资料还明确记录：

```text
技术研究的经验 = 消费的技巧点数 / 100
```

但公开段落没有出现：

```text
技巧研究完成功绩 +500/+1000/+1500/+2000/+2500/+3000
```

对应地址。

这意味着：

- 公开逆向资料对相邻行为覆盖很深；
- “技术研究经验”有明确规则；
- “技术研究完成功绩”仍没有公开地址/常量链；
- 因而不能把任一社区表升级成 reverse-engineered exact。

这不是“没有该功绩机制”的证据；只是 caller/constants 尚未恢复。

## 4. 两套表的证据地位

### 4.1 现行 Wiki 主表

```text
500 / 1000 / 2000 / 3000
```

继续标记：

```text
documented-current-wiki-candidate
```

### 4.2 早期攻略 / Wiki 小ネタ

```text
500 / 1000 / 1500 / 2500
```

继续标记：

```text
documented-early-guide
```

其中旧表恰好满足：

```text
merit = techniquePointCost / 2
```

但目前没有 PC 指令证明这是动态公式，所以仍只能视为算术特征。

## 5. 当前不能建立 Vanilla -> PK 改值结论

目前仍没有找到：

- 官方补丁说明称 Lv3/Lv4 功绩改值；
- PC Vanilla / PK 的二进制常量对照；
- 同版本可重复内存实验。

因此禁止直接写：

```text
Vanilla = 500/1000/1500/2500
PK      = 500/1000/2000/3000
```

当前安全版本表达仍是：

```text
early-2006-guide:
  500 / 1000 / 1500 / 2500

current-wiki-main:
  500 / 1000 / 2000 / 3000

PC-PK1.1-exact:
  unresolved
```

## 6. 参与武将分配仍 open

技巧研究可有 1～3 名参与者。

目前公开资料不能源码级确认：

- 每名参与者是否都获得完整功绩；
- 是否只有主执行者获得功绩；
- 是否按贡献/能力分配；
- 中途离队/状态变化如何结算。

因此 fidelity 层必须保留：

```text
participantDistribution = unresolved
```

如果兼容实现继续沿用“每名参与者全额”，必须标：

```text
compatibilityAssumption=true
```

## 7. 当前安全实现

严格复刻：

```ts
meritByLevel = {
  1: 500,
  2: 1000,
  3: unresolved,
  4: unresolved
}
```

兼容候选：

```ts
[500, 1000, 2000, 3000]
```

并附：

```text
evidence=documented-current-wiki-candidate
exactness=unresolved
conflict=[500,1000,1500,2500]
```

## 8. 仍 open

1. PC-PK1.1 完成研究 -> 功绩写入 caller；
2. 对应常量或动态公式；
3. 两套表真正的平台/补丁映射；
4. 1～3 名研究武将逐人分配；
5. Vanilla / PS2 / Wii 等价性；
6. 若确有改值，精确 transition patch。

## 9. 来源

- https://w.atwiki.jp/sangokushi11/pages/113.html
- https://w.atwiki.jp/sangokushi11/pages/15.html
- https://www.gamersky.com/handbook/200604/22600.shtml
- https://github.com/sjn4048/311MemoryResearch
  - `内存资料/修改记录by sjn4048.txt`
- 当前 E12：`27-technique-research-merit.md`
- P0-14：`49-technique-research-time-exactness.md`
