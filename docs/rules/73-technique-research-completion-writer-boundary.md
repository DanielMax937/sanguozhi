# P0-38 技巧研究完成功绩 writer / participant distribution 边界

更新：2026-10-03。主目标版本：PC-PK1.1。

## 1. 本轮结论

本轮从每旬计数器 `00599CF0` 反向追研究完成链，得到一个重要结构性结论：

```text
技巧研究倒计时归零
!= 在 00599CF0 技术计数器分支内立即完成结算
```

具体地：

```asm
00599D7A mov al,[force+A0]   ; ResearchTimeLeft
00599D82 jna 00599D90        ; 0则跳过
00599D87 dec eax
00599D8B call 004815E0       ; Set ResearchTimeLeft
00599D90 ...                 ; 直接进入下一势力
```

这里没有 completion callback。

相对地，能力研究分支在剩余时间减到0后明确：

```asm
00599DE5 test bl,bl
00599DE7 jne 00599DF2
00599DE9 push esi
00599DEA call 005CE600
```

因此技巧研究的解锁、功绩、提示、参与者结算必然发生在 `00599CF0` 之外的另一条链。

状态：

```text
P0-38-audit-complete
tech-research-countdown-only-in-599cf0-exact
tech-completion-writer-not-in-countdown-branch-exact
ability-research-completion-inline-contrast-exact
tech-completion-writer-address-open
participant-distribution-open
```

## 2. `00599CF0` 只做技巧研究倒计时

势力字段：

```text
+0x9C ResearchingTech
+0xA0 ResearchTimeLeft
```

技术研究段只做：

```ts
if (ResearchTimeLeft > 0) {
  ResearchTimeLeft -= 1
}
```

没有：

- 设置技术已研究；
- 增加武将功绩；
- 增加经验；
- 弹完成提示；
- 清空 ResearchingTech；
- 遍历研究参与者。

所以这些 completion side effects 必须在别处。

## 3. 与能力研究形成非常清晰的对照

能力研究：

```text
countdown -> reaches 0 -> 005CE600 completion handler
```

技巧研究：

```text
countdown -> reaches 0 -> no completion call here
```

因此不能把 `00599CF0` 本身命名成技巧研究 completion writer。

## 4. 研究武将 mission=5 只说明任务释放依赖倒计时

同一 `00599CF0` 后半的武将移动/任务处理里，mission=5 会读取所属势力：

```asm
00599FEF mov al,[edi+A0]  ; force ResearchTimeLeft
00599FFD test al,al
00599FFF jne 0059A00C
```

也就是说当技术研究倒计时归零时，研究武将的 mission 才允许进入后续结束路径。

这说明：

```text
participant task lifetime
与 ResearchTimeLeft 绑定
```

但仍不能证明：

```text
功绩就是在这个 mission-release 分支发放
```

因为公开片段没有出现 merit write。

## 5. `005D8F68` 继续明确排除

`005D8F68` 属于研究技巧命令/AP消耗路径。

它发生在：

```text
研究开始
```

而不是：

```text
研究倒计时归零后的完成结算
```

所以继续禁止把它当 completion merit writer。

## 6. participant distribution 仍 open，但边界更清楚

技巧研究有1～3名参与武将。

当前能确认：

```text
参与武将任务状态持续到 ResearchTimeLeft=0
```

但仍不能确认：

- 每名参与者全额拿功绩；
- 只有主研究者拿；
- 按参与人数平分；
- 按贡献/相关能力分配；
- 某参与者中途状态变化时是否仍结算。

所以：

```text
participantDistribution = open
```

继续是唯一安全结论。

## 7. 两套功绩表冲突仍没有因此解决

现有两套：

```text
500 / 1000 / 2000 / 3000
500 / 1000 / 1500 / 2500
```

本轮没有找到真正的 completion writer 常量，因此 Lv3/Lv4 冲突继续 open。

但现在可以更准确地说：

```text
需要追的是 countdown-completion 之后的 writer/mission-resolution path，
而不是 research command path。
```

## 8. 本轮关闭 / 仍 open

### 已关闭 / 收紧

- `00599CF0` 技巧研究分支只是 decrement；
- 技巧研究归零后在该分支内没有 completion call；
- 能力研究归零后会显式 call `005CE600`，形成结构对照；
- mission=5 研究武将生命周期受 force ResearchTimeLeft 控制；
- `005D8F68` 继续排除为完成功绩 writer。

### 仍 open

1. PC-PK1.1 技巧研究 completion writer 地址；
2. 技术解锁 exact writer；
3. 功绩常量/动态公式；
4. participant list 在哪里保存/遍历；
5. 1～3人逐人功绩分配；
6. 完成提示与功绩写回的先后；
7. 两套表的平台/版本映射；
8. Vanilla / PS2 / Wii 差异。

## 9. 来源

- sjn4048/311MemoryResearch `内存资料/整理/Func-自动02-计数器处理【未】.txt`
- sean2077/311SireCustomizedPackageDev `material/结构体汇总.md`
- 关联：`50-technique-research-merit-exactness.md`、`27-technique-research-merit.md`
