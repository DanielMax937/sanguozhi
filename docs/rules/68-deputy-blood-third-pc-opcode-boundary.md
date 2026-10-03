# P0-33 主副将血缘 `/3` PC opcode 边界

更新：2026-10-03。主目标版本：PC-PK1.1。

## 1. 本轮结论

`00495AB0 GetHighestAttrOfMgAndDg` 的完整 PC 函数边界已经锁定：

```text
00495AB0 .. 00495B8F
next = 00495B90 ArePersonsMutuallyHateful
length ≈ 0xE0 bytes
```

公开 PC 逆向仍只暴露：

```text
00495B65: C1 F8 02  -> sar eax,2  -> /4
00495B79: D1 F8     -> sar eax,1  -> /2
```

没有公开 `/3` 分支的原始 PC opcode / 指令序列。

因此状态：

```text
P0-33-audit-complete
relationship-helper-boundary-exact
normal-quarter-pc-opcode-exact
love-half-pc-opcode-exact
blood-third-cross-platform-high
blood-third-pc-opcode-open
```

## 2. 为什么 `/3` 不能从现有 PC patch 点反推

`/4` 与 `/2` 都可以用算术右移直接实现：

```asm
sar eax,2
sar eax,1
```

但 `/3` 不存在对应单条 shift。

原编译器可能使用：

- `idiv 3`；
- magic multiply + shift；
- 调 helper；
- 其他等价整数除法序列。

在没有函数体时，不能根据结果值自行指定其中一种。

## 3. PC 函数确实足够容纳多关系分支

`00495AB0` 长度约 `0xE0` 字节，随后立即进入：

```text
00495B90 ArePersonsMutuallyHateful
```

说明主副将关系合成逻辑完整位于这一小段中。

SIRE 地址表对它的语义命名为：

```text
GetHighestAttrOfMgAndDg
返回主副将中最高属性
```

结合已知 `/4`、`/2` patch 点，可以确认 PC 端确实存在按关系分支的属性合成逻辑。

## 4. 血缘 `/3` 仍来自跨平台精确实测

PS2PK 实测：

```text
主50 / 副100
亲爱 -> 75
血缘 -> 66
普通 -> 62
```

与：

```text
main + floor((sub-main)/2)
main + floor((sub-main)/3)
main + floor((sub-main)/4)
```

严格吻合。

所以：

```text
blood divisor = 3
```

仍可作为：

```text
PS2 empirical-exact
cross-platform-high
```

但不能写成：

```text
PC-PK1.1 opcode-exact
```

## 5. spouse / sworn full-share 仍是同一层级缺口

夫妻 / 义兄弟：

```text
combined = max(main, deputy)
```

在 PC 上已有 SIRE 原作者说明与 PS2 实测交叉。

但和血缘 `/3` 一样，当前没有公开 `00495AB0` 完整 branch opcode。

因此两者都应继续保留：

```text
behavior high-confidence
opcode open
```

## 6. 当前安全实现

```ts
function combineDeputy(main, sub, relation) {
  if (sub <= main) return main

  const diff = sub - main

  switch (relation) {
    case 'spouse':
    case 'sworn':
      return sub

    case 'love':
      return main + Math.floor(diff / 2)

    case 'blood':
      return main + Math.floor(diff / 3)

    default:
      return main + Math.floor(diff / 4)
  }
}
```

其中 evidence：

```text
/4 PC opcode exact
/2 PC opcode exact
/3 cross-platform-high
/1 PC-high + PS2-exact
```

## 7. 本轮关闭 / 仍 open

### 已关闭 / 收紧

- `00495AB0` 函数边界 `00495AB0..00495B8F`；
- `/4` 和 `/2` PC patch 点仍为 opcode exact；
- 不能用 shift 形式反推 `/3`；
- `/3` 继续作为 cross-platform-high，而不是 PC opcode exact。

### 仍 open

1. `00495AB0` 完整 PC body；
2. blood `/3` 的 PC 原指令序列；
3. spouse/sworn full-share 的 PC branch/opcode；
4. love / sworn / blood 的 directionality 检查；
5. Vanilla / Wii 等价性。

## 8. 来源

- sean2077/311SireCustomizedPackageDev `material/内存地址汇总.md`
- fudanglp/311resource `san11pk_dump.exe_functions.csv`
- sjn4048/311MemoryResearch 原地址资料（`00495B65`、`00495B79`）
- 关联：`45-deputy-rounding-exactness.md`
