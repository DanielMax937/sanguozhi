# 生产价格：捕获输入限定整数核

更新：2026-10-09 UTC。基线为 PR #49 已合并的 main `1760b38e169bffc2953b17efe95674705a927c59`。本批是独立本地候选，尚未获本批发布批准；新树验收和独立恢复记录在交接包中，不能借用旧 PR 的通过数。

## 证据与完整原文

等级：`source-listing-reconstruction`；`stockOriginalVerified=false`、`originalExecutableExecuted=false`。只按公开原函数列表恢复已捕获输入的整数语义，不认证原版程序、PC-PK1.1/Vanilla/主机等价或完整 runtime。

固定来源：[sjn4048/311MemoryResearch 计算生产价格](https://github.com/sjn4048/311MemoryResearch/blob/66e167e40c3440929ec016f3872aefc3486434c1/内存资料/整理/Func-内政10-计算生产价格.txt)。Git blob `928b34bd8b9f06057dd44e9639db92dacc364c85`，原 GBK 4178 bytes；[UTF-8快照](../sources/production-price-original.txt)可逆重新编码到同一 Git blob，未改正文、注释或错字。源作者 sjn4048 的 Apache-2.0 [许可副本](../sources/production-price-LICENSE.txt)随文本保留；[证据 JSON](../sources/production-price.json)和[闭合 schema](../sources/production-price.schema.json)固定源、域和限制。

原体 `005C6350..005C63C0`，end-exclusive `005C63C1`，45 条 / 113 bytes，字节 SHA256 `8231023624aacaa163f18e3e199a34858edf8ade601ad5043ddfaaba4bc685da`。

另列“修改 - 特产城市折扣倍率自定义”是独立 MOD：`005C63A1..005C63AE`，6 条 / 14 bytes，SHA256 `031a517ac04ce7dbbd28b35632a2e715a69a489212d0872b81f86a70cc77d722`。不将它覆盖到原体。展示值 `0x50/0x64` 即 80/100，在全部 uint16 正常域与原八折数值相同；这个相同不取消来源隔离，也不证明其他自定义值。

## 原字节顺序及笔误

1. `0047A630` 先检查城市指针，再检查兵装类型指针；原体均用完整 `TEST EAX,EAX`，任一返回0立即返回0，没有价格读取或后续 helper。本 API 的输入以前置 gate 已通过为条件，不实现校验器。
2. `005C637A` 的 `0F B7 B7 98 00 00 00` 一次读取类型 `+0x98` 的无符号 word，保存到 ESI。这个价格在 helper 链之前已经捕获；后续表发生变化也不能重新读取替换它。
3. 依次调用 `004914A0` 指针转 ID、`0047EC80` 类别 helper、`0047B3A0` 特产 helper。其内部体和 stock ID/业务名对应未知，不能由作者注释填入映射。
4. `005C639D` 是 `TEST AL,AL`，随后 `JNA`。TEST 清 CF，所以 AL=0 跳过折扣；不是完整 EAX 非零判断。EAX=256 不折，257 折，`0x80000000` 不折，`0xffffffff` 折。
5. 折扣分支先 `LEA ECX,[ESI*8]`，再用 `0x66666667` 有符号乘高字、`SAR EDX,2`、符号校正。源 `005C63AF` 助记符写成 `sar dl,02`，但机器字节 `C1 FA 02` 明确是 `sar edx,2`；快照保留笔误，解释器以字节为准。
6. 返回保存原价或折后价。没有最低1、费用扣写、库存入账或 AP/完成调度。

## API 与支持域

公开导出 `PRODUCTION_PRICE`、`calculateProductionPrice`，显式 profile 为 `production-price-resolved-v1`。

输入只允许三个 own data 字段：
- `profile`：严格匹配上述 profile
- `savedBasePriceWord`：0..65535 整数，表示已在 `005C637A` 捕获的原价
- `specialtyHelperEax`：0..4294967295 整数，表示最后 helper 的完整已观察 EAX 位模式

不接受城市/兵装业务名、原生 ID、特产布尔值、pointer callback、MOD 设置或未说明的属性。不做隐式数字转换；accessor、继承输入、缺字段和未知字段拒绝。拒绝为 `supported=false`，不携带 `returnedPrice`，不能伪装原生 early-return 0。原价0和折后0都是合法成功。

```text
specialtyResultAl = specialtyHelperEax & 255
discountApplied = specialtyResultAl != 0
returnedPrice = discountApplied ? floor(savedBasePriceWord * 8 / 10) : savedBasePriceWord
```

回执冻结并保留三个输入值、`specialtyResultAl`、`discountApplied`、`returnedPrice` 和证据。输入不被写入，后续输入变更不影响已返回快照。

重要反例：1金八折→0；2→1；9→7；11→8；65535→52428。先除10再乘8、round/ceil、最低1、signed16原价和完整 EAX 判断都不等价。`锻冶700金/厩舍800金` 不是这个原函数的固有费用常量；本核从已解析价格 word 计算，逐兵装原表仍缺，不能把旧无来源硬码作为本核输入来源。

## 验证方法与边界

- `python -B scripts/check_production_price.py`：固定原GBK blob/UTF-8、原45条/113字节与MOD6条/14字节、CALL/branch目标、源错字、许可、闭合schema及定向文档；带成功控制与恶意变异检查
- `python -B scripts/oracle_production_price.py --sweep`：受限 x86 字节解释器，期待值由原字节解码产生；外部函数为受约束 opaque 输入桩，不运行游戏EXE或机器码。全部65536原价×AL零/非零两分支，共131072次完整原函数入口，与实际公开 API 回执逐一比较；不是两个闭式公式互证
- 额外验证全部256 AL与六组高24位、完整 EAX validator早返、调用顺序/清栈/保存寄存器、helper改变原表后仍使用已保存价；MOD单独执行展示设置并与原正常域比较，绝不叠加原体
- Node 测试覆完整字域、冻结/无副作用/严格拒绝、真实生产模块代码变异、Train/EndTurn/save/replay不扩域
- 全工程检查必须在本批最终冻树重新执行；相关独立恢复测试与整套验收分别记账

仍缺：两个validator及可变pointer语义，`004914A0`/`0047EC80`/`0047B3A0`原体，价格表与原生ID/特产业务映射，完整生产命令资格，实际扣钱/库存上限/产量入账 writer，功绩/EXP/AP/TP、耗时和完成调度，clean-stock/跨版本以及完整原生runtime。本批不接Train/EndTurn/state/save/replay；P0-78及依赖capture/force/native事务继续排除。产量规则的独立核对不因价格核通过而自动完成。
