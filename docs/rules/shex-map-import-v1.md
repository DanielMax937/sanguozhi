# SHEX0008 静态地图只读兼容导入 v1

日期：2026-10-28。基线 `9cf854c3418bd1ecd129b77b9fc6796f5fa1d3de`。实现 [shex-map-import.ts](../../packages/engine/src/shex-map-import.ts)，来源账本 [shex-map-import-v1.json](../../data/sources/shex-map-import-v1.json)。

## 已读证据，不把兼容代码当原作

实际阅读 `tankyc/sango_infinity` 固定提交 `ba3839939cf30b1ef4ab3d575563e1b530d818f1` 的 [MapGrid.cs](https://github.com/tankyc/sango_infinity/blob/ba3839939cf30b1ef4ab3d575563e1b530d818f1/Project/Assets/Sango/Scripts/Map/Render/Map/MapGrid.cs)。`San11GridData.OnLoad` 逐个读11个 byte；`LoadFrom311GridData` 跳过8字节、循环40000格，`x=i/200,y=i%200`。写出函数逐字符写 SHEX0008。

这是**现代兼容实现的格式证据**。它不是光荣原始loader、不是原始内存bit结构，也没有证明任何给定文件属于原版。读取成功只证明符合本版本结构合同，故每次全图结果恒含 `evidence=modern-compatibility-source`、`nativeAuthenticity=not-established`，不依用户文件名改变证据等级。

上游 [README](https://github.com/tankyc/sango_infinity/blob/ba3839939cf30b1ef4ab3d575563e1b530d818f1/README.md) 说明地图为仿照实现、部分素材从游戏导出并限学习用途；MIT代码许可不能证明这些素材可再分发。本批只原创实现解析器，不复制地图、人物表、图片或游戏资源。

上游 DefaultMap.bin 的3,740,851字节只核树元数据；上游自己的资料描述它为version10/256×256格。没有读取或验证该二进制，也不把它当作原作200×200 SHEX图。上游 Scenario.json 元数据显示1,651,391字节；文件读取空内容、正常raw读取报过大/不支持，因此本轮未取得正文，不能据名字或导出批处理就认定它是原剧本。未运行任何上游程序。

## 明确合同与推断/设计

| 字段或行为 | 本版本规定 | 证据等级 |
|---|---|---|
| 头 | 严格8个ASCII字节 SHEX0008 | 字符来自兼容写出函数；**严格比较**是工程防误读设计，兼容读入代码本身只跳过8字节。 |
| 文件长度 | 必须440008 = 8 + 40000×11，无尾随/截断 | 循环/记录字节数来自源码；严格拒绝额外数据为工程设计。 |
| 坐标 | index=x×200+y，x/y均0..199，x主序 | 兼容loader直接算术；不创建六角邻边，不建立地形空间保真证明。 |
| terrain / areaId | 记录前2个原始字节，均0..255 | 不加1，不做位掩码；上游转换到重制引擎才+1，本解析器不做那层转换。 |
| lpB | 第3字节原样保存 | 意义未知，不命名为高度或推断用途。 |
| trap / direction | 第4/5字节原样保存 | 上游注释给陷阱、方向含义，但本解析器不把未知值当无陷阱、不执行。 |
| interior/defence/thief/flood/fire/ruins | 第6..11字节逐项原样保存 | 不是布尔转换。特别fire可为0..255原值，不能丢弃成true/false。 |
| 无人/无灾害假设 | **不作任何假设** | 文件没有本服务的占用/部队数据；不据缺字段认定地图为空。 |

原11字节记录 ≠ runtime `struct_map_grid` 的0x14字节。areaId原字节不能直接当42城ID；不得按最近城推定归属。flood字节不推出四座堤防分别影响哪些格；不触发任何洪水、伤亡、损兵、归属、设施或其他世界写入。

## 两个 API

`importShexMapV1(input)`：只接收**普通稠密number数组**，恰440008项、每项整数0..255、不含负零、访问器、symbol、额外属性或数组洞。跨原型/TypedArray/Buffer不在直接输入合同内；调用方在自己的可信I/O边界显式转普通数组，解析器自身无I/O。先检查所有描述符并复制字节，不调用getter。代理不属于可执行代码沙箱支持域。

成功返回 `{ok:true,map}`，含profile `shex0008-modern-compatibility-v1`、宽高200、recordBytes11、sourceBytes440008、证据标签及40000格，每格含index/x/y和全部11字段，深冻结且不修改输入。失败只返回reason，不返回部分地图。

`readShexMapCellV1(input,x,y)`：坐标须为0..199整数、不含负零；同样校验**整个文件**后返回一格和同一profile。不是从任意截取11字节推断整张地图有效；结果也不认证原图。

失败reason为 `invalid-byte-array`、`invalid-length`、`invalid-header`、`invalid-coordinate`。完整长度输入中的NaN/Infinity/非整数/越界字节都拒绝。没有静默裁剪/零填充/宽松头猜测，旧数据的原始未知值则保留。

## 未运行纸面边界核对

- 第0格 x0/y0，记录起点8，最后一个字段偏移18。
- index199为x0/y199；index200为x1/y0；避免把x/y转置。
- 最后一格index39999为x199/y199，起点439997，ruins偏移440007，恰为最后字节。
- 一个合法格式但全部记录为0的合成数组只说明格式可解析，**不是原生全平地地图**；不在仓库分发假原图。
- 头错误、少/多1字节、数组洞、getter、末尾非法字节都整笔拒绝；单格读取也不可漏掉别处非法值。

仅静态代码和纸面算术核对，未运行测试/typecheck/build/编译/候选。没有声称解析过真实原图。下一步是合法可核版本的数据输入与独立核验；获得更多格式证据时新增policy，保留旧严格合同，不悄改未知字节解释。

本批不含P078及依赖、Closing、人员任务/归属、资源/奖励/受伤、世界结算，不修改旧移动器或合成旅行世界。原地图/原剧本证据缺口仍开放。
