# P0-10 部队主副将关系合成 / FPU 取整 exactness

更新：2026-10-01。

## 1. 本轮结论

P0-10 处理两个长期混在一起的 gap：

~~~text
A. 00495AB0 主将/副将统率与武力关系补正
B. 00707A74 浮点 -> 整数 helper
~~~

本轮最大的闭合是 B：00707A74 已可识别为 Microsoft CRT `_ftol2`，其语义是 **truncate toward zero**。所以三国志11中调用该 helper 的正常正值攻防、建设、耗粮等，最终整数化就是严格向下取整。

状态：

~~~text
P0-10-audit-complete
ftol2-identity-resolved
positive-float-conversion-floor-exact
normal-deputy-quarter-pc-exact
love-deputy-half-pc-exact
spouse-sworn-full-share-pc-high
blood-third-pc-opcode-open
relationship-helper-body-partial
~~~

## 2. 00707A74 不是未知私有函数，而是 MSVC `_ftol2`

311resource 从 san11pk_dump.exe.idb 导出的函数名与内部 local labels 为：

~~~text
00707A74 ConvertFloatToIntegerAndStoreInEAX
00707A97 arg_is_not_integer_QnaN
00707ABB positive
00707AD3 integer_QnaN_or_zero
00707AE7 localexit
00707AE9 next function
~~~

函数长度正好约 0x75 bytes。

这组内部标签与 Microsoft CRT `_ftol2` 源码完全一致。微软原始源码标题就是：

~~~text
ftol2.asm - truncate TOS to 32-bit integer
~~~

其核心流程：

~~~text
fld st(0)
fistp qword tmp
fild qword tmp
原浮点 - 临时整数
根据符号和 fractional difference 修正
返回 EDX:EAX
~~~

也就是说它不会把 C/C++ 浮点到整数转换解释成“按当前 x87 round-to-nearest 直接取结果”，而是对 `fistp` 的临时结果做修正，最终实现 **向 0 截断**。

来源：
- https://github.com/fudanglp/311resource/blob/master/extractor/ida/data/python_idb/san11pk_dump.exe_functions.csv
- https://github.com/fudanglp/311resource/blob/master/extractor/ida/data/python_idb/san11pk_dump.exe_names.csv
- Microsoft CRT `_ftol2` 源码镜像：https://github.com/tongzx/nt5src/blob/master/Source/XPSP1/NT/base/crts/fpw32/tran/i386/ftol2.asm

## 3. 对原作公式的直接含义

数学上：

~~~text
truncTowardZero(+x) = floor(x)
truncTowardZero(-x) = ceil(x)
~~~

San11 当前已确认调用 00707A74 的主规则输入通常为非负：

- 部队攻击；
- 部队防御；
- 建设力；
- 据点/部队耗粮；
- 若干伤害/耐久正值链。

所以这些正常游戏域里可以直接写：

~~~text
result = floor(rawPositiveValue)
~~~

不再需要“兼容参考 floor，但 FPU rounding 仍 open”的旧保留。

仍需区分：

- 是否调用 00707A74：必须由 caller 证明；
- 中间 x87 80-bit 精度/常量本身：若某公式对最后 bit 极敏感，仍是独立问题；
- 负值路径：helper 是向0截断，不是数学 floor。

## 4. E2 攻防 / 建设的末端取整现在 exact

`00496570 GetTroopCapabilities` 已确认攻击、防御、建设最终调用 00707A74。

因此：

~~~text
attack = max(1, truncTowardZero(attackRaw))
defense = max(1, truncTowardZero(defenseRaw))
construction = max(1, truncTowardZero(constructionRaw))
~~~

正常 raw 均为正，所以等价：

~~~text
attack = max(1, floor(attackRaw))
defense = max(1, floor(defenseRaw))
construction = max(1, floor(constructionRaw))
~~~

这与 2006 年 PC 早期研究中反复记录的“小数直接忽略”吻合。

## 5. 00495AB0：普通关系 1/4 为 PC 指令级确认

311MemoryResearch 原地址资料：

~~~text
00495B65
原值 C1 F8 02
~~~

即：

~~~asm
sar eax, 2
~~~

在该分支中输入是“副将属性 - 主将属性”的正差值，因此：

~~~text
bonus = floor((sub - main) / 4)
~~~

如果副将不高于主将，原 helper 不让它拉低主将。

所以普通关系：

~~~text
combined = main + floor(max(sub-main,0)/4)
~~~

为 PC-PK1.1 address/opcode exact。

## 6. 亲爱关系 1/2 同样是 PC 指令级确认

原地址：

~~~text
00495B79
原值 D1 F8
~~~

即：

~~~asm
sar eax, 1
~~~

因此对正差值：

~~~text
bonus = floor((sub-main)/2)
combined = main + bonus
~~~

这一项也不再只是攻略经验。

## 7. 夫妻 / 义兄弟：PC 原版可升级为 full-share high confidence

旧文档主要依赖 PS2PK 实测：

~~~text
夫妻 / 义兄弟 divisor=1
直接使用主副将中的较高统率/武力
~~~

P0-10 增加 PC 侧交叉：SIRE 原作者基于 PC-PK 代码研究的帮助说明明确说，原版普通副将只取得部分加成，**义兄弟和夫妻是例外**；而“部队攻防使用最高武统值”这个修改，是把其他非嫌恶关系也改成和义兄弟/夫妻一样取最高。

后续 SIRE/血色说明更直白地描述：原版要达到最高统/武，必须是“仲介关系”，即义兄弟或夫妻同队。

因此当前等级升级为：

~~~text
spouse/sworn full-share:
PC reverse-author documented-high
+ PS2 empirical-exact
~~~

建议规则：

~~~text
combined = max(main, sub)
~~~

但由于 00495AB0 完整 PC 函数体仍未公开文本化，本项目仍不把它写成“逐指令 exact”。

## 8. 血缘 1/3：继续保留 PC opcode gap

日文 Wiki 的 PS2PK 精确测试：

~~~text
主50 / 副100:
亲爱 -> 部队关系能力 75
血缘 -> 66
普通 -> 62
~~~

以及主1、副100样例都符合：

~~~text
亲爱 1/2
血缘 1/3
普通 1/4
~~~

且加成部分的小数直接舍去。

但 PC 地址资料只公开标出了：

~~~text
00495B65 1/4
00495B79 1/2
~~~

没有公开血缘除3那段完整指令。

所以：

~~~text
blood divisor=3
= PS2 empirical-exact / cross-platform-high
≠ PC opcode-exact
~~~

这一项继续 honest-open。

## 9. 两名副将时不是把 bonus 相加

`00496570` 对统率/武力分别调用 00495AB0：

~~~text
candidate1 = combine(main, sub1)
candidate2 = combine(main, sub2)
result = max(candidate1, candidate2)
~~~

所以不能写：

~~~text
main + bonus(sub1) + bonus(sub2)
~~~

例如主将武力 50，两个普通副将武力 90、100：

~~~text
sub1 candidate = 50 + floor(40/4) = 60
sub2 candidate = 50 + floor(50/4) = 62
最终 = 62
~~~

不是72。

## 10. 嫌恶 hard override 的优先级保持不变

`00496570` 在调用关系 helper 之前会检查三组双向嫌恶：

~~~text
主↔副1
主↔副2
副1↔副2
~~~

任意命中：

~~~text
五维全部退回主将
~~~

之后才继续兵科适性三人取最高。

因此即使另一名副将是夫妻/义兄弟，也不能绕过这一 hard override。

## 11. 智 / 政 / 魅不使用 00495AB0

PC `00496570` 已经确认：

~~~text
统率、武力 -> 00495AB0
智力、政治、魅力 -> 直接取三人最高
~~~

前提仍是没有任意嫌恶 pair。

所以“血缘1/3”等关系 divisor 只用于统率/武力，不能继续扩散到智力/政治/魅力。

## 12. `_ftol2` 也解释了旧实测中的舍去行为

PS2副将测试虽然不是 PC 二进制，但数值：

~~~text
主50 副100 普通：
关系属性 = 62
枪兵攻击 = 62 * 0.95 = 58.9
显示 58
~~~

PC `_ftol2` 的正值 trunc/floor 与这个观察一致。

同理：

~~~text
关系加成的 /2 /4 是整数位移先截断
面板末端又经 _ftol2 截断
~~~

必须保留两次不同层级的整数化，不能把整个公式一次性最后 round。

## 13. 跨规则影响：E3 单位面板

`18-unit-panels.md` 之前写：

~~~text
末端 floor 只是兼容模型
00707A74 仍 open
~~~

P0-10 后应改成：

~~~text
只要该分支最终调用 00707A74，
对正 raw 值，末端 floor 是 PC-PK1.1 exact。
~~~

仍 open 的只剩：

- 原浮点常量的 bit-exact dump；
- x87 中间精度对极端边界的影响；
- 水上输送 caller 参数。

## 14. 跨规则影响：E5 耗粮

`0049D200 / 0049D2E0` 最后调用同一 00707A74。

因此正耗粮：

~~~text
expenditure = truncTowardZero(raw)
            = floor(raw)
~~~

若兵力>0且结果<=0再保底1。

所以 E5 原来的“不要直接写语言级 floor，00707A74 gap”可以关闭。

防御设施浮点 multiplier 本身的精确 bit pattern仍应与‘转换方式’分开。

## 15. 跨规则影响：P0-3 攻城耐久

攻城耐久链已知某些正浮点结果最后进入 00707A74。

因此其最终 float→int 也可以确定为向0截断/正值floor。

但：

- sqrt 计算；
- x87 中间 80-bit 精度；
- 005ADDC0 / 005ADE20 内部 body；

仍是独立 gap，不能因为 `_ftol2` 已闭合就声称整个攻城公式 bit-exact。

## 16. 推荐实现

关系层：

~~~text
if any mutual-hate pair in troop:
  fiveAttrs = mainOnly
else:
  L/W:
    candidate per deputy
    spouse/sworn -> max(main,sub)
    love -> main + floor(diff/2)
    blood -> main + floor(diff/3)  // cross-platform-high
    normal -> main + floor(diff/4)
    final = max(candidate1,candidate2)
  I/P/C:
    max(main,sub1,sub2)
~~~

转换层：

~~~text
function san11FloatToInt(x):
  return truncTowardZero(x)
~~~

不要使用宿主语言默认 `round()`。

## 17. 当前剩余 exactness gap

已闭合 / 收紧：
- 00707A74 识别为 MSVC `_ftol2`；
- 浮点→整数精确语义 = toward-zero truncation；
- 正攻防/建设/耗粮的最终整数化 = floor；
- 普通副将差值/4 PC opcode exact；
- 亲爱副将差值/2 PC opcode exact；
- 夫妻/义兄弟 full-share 增加 PC SIRE 原版规则交叉，升级为 PC-high + PS2-exact；
- 两副将取两候选最大，不叠加；
- 嫌恶 hard override 与适性例外继续保持；
- 智政魅不走关系 divisor。

仍 open：
1. 00495AB0 完整 PC 函数体；
2. 血缘 /3 的 PC 原 opcode；
3. 夫妻/义兄弟 full-share 的 PC exact branch/opcode；
4. 00495AB0 对单向亲爱、单向结义等方向性的精确调用关系；
5. x87 中间 extended precision 对极端 bit-boundary 的影响；
6. Vanilla / PS2 / Wii 是否使用同一编译转换 helper / 关系函数。

最终状态：

~~~text
P0-10-audit-complete
ftol2-identity-resolved
positive-rounding-floor-exact
normal-quarter-pc-exact
love-half-pc-exact
spouse-sworn-full-share-pc-high
blood-third-cross-platform-high
relationship-helper-body-partial
~~~

## 18. 来源

逆向：
- https://github.com/sjn4048/311MemoryResearch/blob/master/内存资料/函数[计算部队属性].txt
- https://github.com/sjn4048/311MemoryResearch/blob/master/内存资料/地址资料.txt
- https://github.com/sean2077/311SireCustomizedPackageDev/blob/dev/material/内存地址汇总.md
- https://github.com/fudanglp/311resource/blob/master/extractor/ida/data/python_idb/san11pk_dump.exe_functions.csv
- https://github.com/fudanglp/311resource/blob/master/extractor/ida/data/python_idb/san11pk_dump.exe_names.csv

MS CRT：
- https://github.com/tongzx/nt5src/blob/master/Source/XPSP1/NT/base/crts/fpw32/tran/i386/ftol2.asm

关系实测 / 交叉：
- https://w.atwiki.jp/sangokushi11/pages/30.html
- https://w.atwiki.jp/sangokushi11/pages/8.html
- https://patch.ali213.net/showpatch/18430.html
- https://www.53miji.com/contents/201502/15507.html
- https://game.ali213.net/forum.php?mod=viewthread&tid=964175
