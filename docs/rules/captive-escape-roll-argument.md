# 俘虏自然逃亡roll参数纯整数核

> 当前状态（2026-10-16）：本页对应 [PR #59](https://github.com/DanielMax937/sanguozhi/pull/59) 已合并。下文“未远端发布”“本批必须回归”等保留历史日期语境，不是当前状态或本轮运行计划；本次只补文档，未运行测试，旧失败与原证据边界保留。


2026-10-12。基线为PR #58已合并的main `3db7dc80363454b56c2dd9d138ae285f50dadf29`。这是已有文档规则首次实现为来源绑定、严格输入域的公开API，不是发现新的逃亡概率。完整自然逃亡仍未恢复；本候选验收与发布收据另记，任何历史测试数均不验证本树。

## 接口与边界

`calculateCaptiveEscapeRollArgument`和只读`CAPTIVE_ESCAPE_ROLL_ARGUMENT`由engine公共入口导出。

输入封闭对象：

```ts
{
  profile: 'captive-escape-roll-argument-u8-v1',
  savedBlU8: 0,             // 00582CE4入口BL
  currentAlU8: 255,         // 同一入口AL
  lateCaptiveMonthsU8: 4    // 00582CF9重新读取的月份byte
}
```

三个标量均须是0..255整数。拒绝额外字段、非数据属性、非普通/空原型对象、字符串、布尔、NaN、Infinity、非整数和越界，不coerce或模256。拒绝是工程合同，不声称原程序具有这些错误路径。普通数据对象与null原型对象均支持；规范化数值负零为正零。输入不变，输出及证据深冻结。

输出包含` supported/profile `、三个输入、`selectedMaximumByte`、`effectiveStat`、`effectiveMonthFactor`、`numerator`、`rollArgument`、来源`evidence`。拒绝仅含`supported:false/reason/evidence`。不返回是否逃走、概率百分比、人员身份或新位置。

```text
selectedMaximumByte = max(savedBlU8, currentAlU8)
effectiveStat = max(30, selectedMaximumByte)
effectiveMonthFactor = max(1, lateCaptiveMonthsU8 - 2)
numerator = effectiveMonthFactor² × effectiveStat
rollArgument = max(1, floor(numerator / 150))
```

全U8域：month factor最高253；numerator最高16,322,295；rollArgument最高108,815。属性与参数均没有100上限。该输出是传给`004721D0`的整数参数，不能直接解释成实际成功百分比。

## 来源身份与连续字节

固定原文：[Func-自动07-俘虏逃走.txt](https://github.com/sjn4048/311MemoryResearch/blob/66e167e40c3440929ec016f3872aefc3486434c1/内存资料/整理/Func-自动07-俘虏逃走.txt)

- 仓库commit：`66e167e40c3440929ec016f3872aefc3486434c1`
- Git blob：`966493977fe3c19250fecc32d3d4f5bc23361d86`
- GBK原字节：16828 bytes，SHA256 `9da5c1a1f927b069f38940090327184942adc98af9bea93150a04f1a7580114b`
- UTF8全文：SHA256 `c69ad1694b96a608e0d362b468e27b7e51eae6372a0f38fd15471144d3824da9`
- 完整caller：`00582BE0..<00582F66`，266条/902 bytes，SHA256 `1e86d9c476b08adffb5d1ca3435930b51205b68c651a357ef59a6d8923fc53fd`
- 独立无CALL段：`00582CE4..<00582D31`，26条/77 bytes，SHA256 `11335bc56749367435b1d5f70629b93b5c2139c063533c516833ca50e2defc83`

GBK为固定connector全文的可逆编码重建并校验Git blob，不宣称另行下载独立EXE。listing机器码重建与静态objdump对照不是原作执行。证据等级严格为`source-listing-reconstruction`。00582D3B同行“修改jmp”是作者建议，保留原列`74 0a`；不采纳MOD行为。

## 为什么不用人物快照

00582CCB先读month并以unsigned<2跳过；两个属性getter在这之后调用；00582CF9又读month。API只接后读值，绝不把前后读合并。late month0/1也能在这个纯算术域计算q=1，但不宣称这些元组真实可达或可以通过更早的资格检查。

00582CDD把此前AL存入BL，随后还调用另一个未审getter。为不伪造其非易失寄存器ABI，本API合同是00582CE4实际入口BL，不是“第一个getter必然保留的原返回”。AL/BL都按unsigned byte比较；高位属性128..255必须保持。

## 原字节算术

`3a c3 / 76 02`为CMP AL,BL及unsigned JBE；MOVZX消除高位。两个二操作数IMUL在此域均不会signed32溢出。除法采用`0x1B4E81B5`的signed高字乘法、`c1 fa 04`、符号修正。原助记符写`SAR DL,4`是笔误；字节和objdump均明确为`SAR EDX,4`。

令M=0x1B4E81B5，则150M=2³⁶+14。因0≤n≤16,322,295且14n<2³⁶，nM/2³⁶相对于n/150的增量小于1/150；n/150的小数部分只能为0/150..149/150，所以floor完全相等。原有signed运算的商在本域非负，符号修正不改变它。最后最低1，无本地min100。

关键反例：

| BL | AL | late month | argument | 排除的错误 |
|---:|---:|---:|---:|---|
| 0 | 0 | 25 | 105 | 参数clip100 |
| 255 | 0 | 4 | 6 | 属性clip100或signed8 |
| 0 | 255 | 4 | 6 | 忽略AL |
| 29 | 29 | 7 | 5 | 漏掉stat最低30 |
| 255 | 255 | 255 | 108815 | 月份clip100/平方或除数错误 |
| 255 | 0 | 128 | 26989 | 月份signed8 |
| 0 | 0 | 0/1/2/3 | 1 | 把早期gate混入纯段 |

## 验证与仍开放的机制

产品验证入口：`scripts/check_captive_escape_roll_argument.py`、`scripts/oracle_captive_escape_roll_argument.py`（默认/`--exhaustive`）、`scripts/test_captive_escape_roll_argument_evidence.py`及engine专项测试。来源和封闭schema篡改应失败；测试对真实TypeScript源码做mutant替换，不能只测另写的公式。

字节解释器验证全部65536属性pair前缀和65536个最大属性/月数后缀。JOIN处唯一活跃属性是BL，随后MOVZX覆盖EAX、ECX/EDX在使用前重定义，CMP覆盖flags；因此可组合覆盖256³标量域。不是声称执行16,777,216次完整byte路径，亦非游戏可达域证明。高位死寄存器整段样例与真实公开API差分另行记录。本批必须在新候选和真实merge HEAD分别完成全量离线回归，不继承旧170条通过数。

仍缺完整名单/资格/指针解析、属性getter与ABI/可达性、计数及月初调度、同源RNG/全局随机流、004A8970释放/迁移与全部显示/归属副作用、clean-stock与跨版本证据。此API不接入Train/EndTurn、状态、RNG、capture、force或native事务。P0-78及依赖新增实现继续排除；既有离线回归保留。
