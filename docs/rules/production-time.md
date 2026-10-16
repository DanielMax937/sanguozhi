# 生产耗时：逐调用点观测的 caller 整数投影

> 当前交付状态（2026-10-16）：本页对应 [PR #56](https://github.com/DanielMax937/sanguozhi/pull/56) 已合并。下文“候选”“未发布”“发布前/合并后须验证”等措辞及运行数字保留其原日期语境，不是当前发布条件或本次重新验证结果。该PR的有限支持域、未实现分支和来源等级不因合并扩大；本文档回溯未运行测试。涉及原生事务的历史内容仅作证据记录，不恢复P078及其依赖。


## 交付边界

本地候选基于已交付 PR #55 的 main `6a29c50b643f833d0c80f6934222628acbacc576`。
`calculateProductionTimeProjection` / `production-time-observations-v1` 独立恢复公开 listing 的 caller 分支和整数运算，证据等级 `source-listing-reconstruction`。返回内部整数（允许负数和零），不认证真实日数、原生产命令或完成调度。无沙盒命令集成；既有价格与数量核不变。
本树须全新验收；PR #55 的历史通过不能替代本树结果。发布与合并状态由外部交付收据另记。

## 来源

固定来源 [sjn4048/311MemoryResearch](https://github.com/sjn4048/311MemoryResearch/blob/66e167e40c3440929ec016f3872aefc3486434c1/内存资料/整理/Func-内政13-计算生产耗时.txt)，commit `66e167e40c3440929ec016f3872aefc3486434c1`。

- 原 GBK 11701 bytes，SHA256 `b6beaf54ca6a279bf9b999a499358d0986cab703767bdc2432f874624d80db13`，Git blob `a42599657262ed157c1911d939c3828048e01e1e`
- 完整可逆 UTF8 快照 `docs/sources/production-time-original.txt`，原注释、空白与后附 MOD 全部保留；获取为 GitHub connector 解码文本后 GBK 重编码校验，非 EXE/raw 下载
- 原体 `005C6CA0 <= PC < 005C6E34`：138条、404字节、连续无缺口；SHA256 `7d5b7c84d0bac670be09671878ab1dd3bd236d6145d990d1f0f81100b8f64c09`
- 原体后19字节两级表：`DC6C5C00E66C5C003C6D5C00 00000000020101`；SHA256 `4285391581aea210a6b7005e14bc441dfaaefc01016cac32587af237cbd1cbdb`
- Apache-2.0 固定许可逐字保存，见 source metadata
- 字节 `C1 FA 02` 为 SAR EDX,2，原文两处 SAR DL 注释错误；`JA` 是 unsigned，type0..4的type−5下溢会跳过扫描
- 后附 `005C6D79 JMP 008A9640` MOD 独立排除，不能把它的最低1夹入原体

## 输入合同

封闭普通对象必填 `profile`、signed32 `nativeEquipmentType`、`captures`。每个capture为自身数据字段 `{callAddress,eax}`，仅三个循环调用点须加 `slotIndex`（0、1、2）。地址须8位大写十六进制，eax为完整uint32。captures按实际路径调用顺序，最多15项；缺项、额外项、乱序、错误地址或slot均拒绝。

- 逐槽：`005C6CF8→0047A630` 验证；非零才观察 `005C6D06→00489090` 智力与 `005C6D25→004890F0` 技能
- 舰船：`005C6D90→0047A630` 再验首槽；非零才 `005C6DAA→00490D00` 首次设施解析、`005C6DB0→0047A630` 验证设施
- 设施验证非零才 `005C6DCA→00490D00` 第二次设施解析、`005C6DD1→004866F0` 城市转换、`005C6DDE→0049DAB0` 查询设施0x2D

首次与二次解析EAX可不同，首槽扫描验证与后续验证可不同。opaque解析返回值保留收据但不解引用，不根据它们伪造有效性。技能命中也不会提前停止后续槽调用。

拒绝访问器、额外字符串/symbol、稀疏数组、自定义prototype、隐式转换；允许null-prototype与非枚举自身数据字段。Proxy元操作trap不在普通记录合同支持范围。拒绝是工程合同，不是原生返回0。输入不修改不冻结；输出与嵌套收据深冻结，trace是独立快照。

该合同仅在指定正常callee返回与caller局部值/寄存器保持的抽象下成立。未恢复原生两次 `[person+0x98]` 内存读取、可变数组/武将身份、callee副作用或ABI；观测输入不证明真实trace可达性。不能把stub栈管理当作ABI证据。

## 路由与算术

1. signed32输入中，type不在0..11时原生返回0；超出signed32输入域为工程拒绝。0..4经unsigned跳转绕过扫描也返回0，无helper、无q
2. 表将5..8映射扫描与技能0x52，9直接跳过扫描，10..11映射扫描与技能0x53
3. 扫描恰好三槽，每槽validity完整EAX非零才取智力AL（0..255），累计sum及从0开始的max，再查完整技能EAX非零
4. `x=maxAL+sumAL−200`；`q=trunc(max(24,x)/24)`；普通值 `10−q`
5. 类型9..11检查舰船设施路径；设施判定完整EAX非零则 `max(2,8−q)`
6. 技能最后执行CDQ/SUB/SAR等价的向零减半，非floor；无通用最低1或0

三个槽全无效仍q=1，普通返回9。type9因无扫描，q恒1，按设施路径返回9或7，不能接受伪造智力/技能captures。三个AL255时q34，普通−24、技能−12；三个AL248时普通−23、技能−11。舰船设施可使上述变2，再技能减为1。零和负值不改写为实际正天数。

输出保留signed返回值与raw EAX、扫描/技能ID、各槽AL/validity/skill、sum/max、rawX/clampedX/q、设施与技能分支、减半前值、逐调用观测与target/queryId收据。无运算的早退字段为null。

## 验证与剩余缺口

Node测试覆盖类型、表路由、八种validity、AL/完整EAX差异、技能全槽命中、24倍数阈值、负数减半、全无效、独立重复验证/解析、type9、9个静态CALL-site、封闭合同及深冻结。独立listing-byte解释oracle、真实TS mutants、schema/source校验与冻结树聚合验收另行运行，实际覆盖/结果以外部收据为准，不宣称uint32/transcript笛卡尔积穷尽。

仍缺：helpers/ABI/真实对象可变性与可达域、完整命令资格/AP/费用/经验功绩技巧点、库存writer、完成调度、真实日数换算、clean-stock精确版本/patch与跨版本认证。原段无RNG CALL不证明完整生产命令无随机。P0-78及其依赖持续排除。
