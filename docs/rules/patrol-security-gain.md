# 巡查治安增量：稳定输入限定数值核

基线：PR #48 合并后的 `015c9b3d4dd238ae6fe71b8efcaf1d6d4c3b7edf`。本批只恢复公开 `005CBA10..005CBADB` 函数在稳定、已解析且前置 gate 通过的输入域中的数值投影，等级为 `source-listing-reconstruction`。这是本地候选实现，尚未发布；新树完整验证与独立恢复审查须另行记录，不能沿用旧 139 项或 214 Node 结果。

纯函数不接入巡查命令、Train、EndTurn、mission、存档、重放或调度。P0-78 与 capture/force/native 事务相关工作不在本批。完整巡查命令、原版可执行文件身份及跨版本等价仍未认证。

## 1. API 与支持域

公共入口 `calculatePatrolSecurityGain(input)` 与冻结来源常量 `PATROL_SECURITY_GAIN` 由 engine 导出，生产文件为 `packages/engine/src/patrol-security-gain.ts`。

```ts
{
  profile: 'patrol-security-gain-stable-v1',
  resolvedLeadershipSlots: [84, null],
  publicOrderByte: 97,
  pressureHelperEax: 1
}
```

- `profile` 必须显式提供；未知或缺失 profile 不自动回退
- `resolvedLeadershipSlots` 长度为 1～3。首槽必须是整数 `0..255`；0 是有效已解析统率，`null` 不是0
- 尾槽允许整数 `0..255` 或 `null`。`null` 表示稳定无效/空槽，不调用 getter；缺少的尾槽规范化为 `null`。数组中间的空洞和显式 `undefined` 不是“缺少尾槽”
- 每个数值是 `00489070` 返回后由 `MOVZX ECX,AL` 取得的 uint8 已解析统率。不能自动映射到引擎的基础统率、未经处理的 leadership 或其他版本能力值
- `publicOrderByte` 是稳定城市 `+0x85` 零扩展 byte，取完整 `0..255` 域；不因正常游戏治安上限100而缩窄输入
- `pressureHelperEax` 是外部已观察的 `004B99B0` 完整 uint32 返回值，取整数 `0..4294967295`。0 不半减，任意非0均半减；不是布尔值、AL低位或“只等于1”

前提是设施指针、首槽武将、解析后的城市已通过 `0047A630`，槽解析、循环中的重复校验、getter 及城市 byte 在所需观察之间稳定。本 API 不证明这些 getter/validator 无副作用，也不模拟真实指针。尤其首槽原先通过而循环重检失败的可变情况不属于此 profile。

### 1.1 原生早退与工程拒绝分开

完整快照保留三处原生 gate：`005CBA18` 设施、`005CBA30` 首将、`005CBA4C` 城市，任一返回 `EAX=0` 都跳至 `005CBAD6` 返回0。原函数没有在这里展示数组本身可读性的独立保护。

本 API 从三个 gate 已通过的稳定合同开始；**不提供 gate 早退 API**。例如 `[null,100,100]` 返回工程 `supported:false`，既不能加成200统率得到9，也不能把此拒绝冒称已经模拟了原生返回0。相反 `[0]` 是有效首将的零统率，基础增量2。

### 1.2 回执与校验

成功回执包含 `supported:true`、`profile`、补足三槽的 `normalizedLeadershipSlots`、`publicOrderByte`、`pressureHelperEax`，以及 `sumLeadership`、`baseGain`、`afterPressure`、`returnedDelta`、`pressureApplied`、`capBranch` 和 `evidence`。对象、槽快照与证据深冻结，不修改输入。

`capBranch` 是布尔值，仅 `publicOrderByte + afterPressure > 100` 时为 `true`；相等时为 `false`，即使返回数值恰与裁剪值相等，也不混淆分支。

拒绝回执只有 `supported:false`、`reason`、`evidence`。原因枚举为 `invalid-input`、`unexpected-field`、`unsupported-profile`、`invalid-leadership-slots`、`invalid-public-order-byte`、`invalid-pressure-helper-eax`。输入要求普通对象或null原型对象的data属性；非对象、自定义原型、accessor、未知/额外symbol字段、无效 profile、非数组/超过三槽/首槽无效/稀疏数组/显式 undefined/额外命名或symbol属性、非整数/非有限数/越界数值均不被自动截断或强制转换。校验是工程输入合同，不是原作命令资格。

## 2. 精确算术与原指令

```ts
sumLeadership = sum(nonNullResolvedLeadershipSlots)
baseGain = floor(sumLeadership / 28) + 2
pressureApplied = pressureHelperEax !== 0

afterPressure = pressureApplied ? floor(baseGain / 2) : baseGain
capBranch = publicOrderByte + afterPressure > 100
returnedDelta = capBranch ? 100 - publicOrderByte : afterPressure
```

1. `005CBA60..005CBA81` 恒循环三槽；每槽校验失败跳过，成功调用 `00489070`，只把零扩展 `AL` 累加
2. `005CBA87..005CBA9E` 先用有符号 magic 除法计算 `/28` 再加2。`B8 93 24 49 92` 的立即数为 `0x92492493`。支持域的总和 `S∈[0,765]` 非负，因此向零截断等于 `floor(S/28)`，基础量为 `2..29`
3. `005CBAA2` 调 `004B99B0` 后，`005CBAA7 TEST EAX,EAX` 测完整32位；后续两条 POP 不改 flags。`005CBAAB JE` 只在 EAX 为0时跳过半减
4. `005CBAAD..005CBAB4` 对已经 `/28 + 2` 的基础量执行 `CDQ; SUB; SAR` 有符号除2。基础量非负，结果等于向下取整；不能先半减统率再加2
5. `005CBABA` 从城市 `+0x85` 零扩展读取 byte；`005CBAC4 CMP 100`、`005CBAC7 JLE` 在加后量小于或等于100时保留原量，仅严格大于100返回 `100−publicOrderByte`

原码没有 lower clamp。`publicOrderByte=101` 必返−1，255必返−155；`returnedDelta` 是 signed 数值，不是对实际写入结果或合法命令状态的承诺。不能增加 `max(0,...)` 后仍称完整 byte 域字面投影。

### 2.1 源助记符错字必须保留

[原 UTF-8 快照](../sources/patrol-security-gain-original.txt) 第65行原样写 `005CBA90 - c1 fa 04 - sar dl,04`；字节 `C1 FA 04` 的正确反汇编为 `SAR EDX,4`，不是对8位 DL 右移。快照保留错字，证据记录在 `sourceCorrections` 独立说明；算术和字节恢复以机器字节为准。没有为使测试通过而重写原文。

## 3. 固定来源、许可与原路径/MOD 隔离

来源为 [sjn4048/311MemoryResearch 固定提交](https://github.com/sjn4048/311MemoryResearch/blob/66e167e40c3440929ec016f3872aefc3486434c1/内存资料/整理/Func-内政08-计算巡查效果.txt)。源 README 仅明确研究311PK，未给本函数可认证 EXE hash、干净 stock 身份或精确补丁版本。

| 项目 | 身份 |
|---|---|
| commit | `66e167e40c3440929ec016f3872aefc3486434c1` |
| 原 GBK Git blob | `71b6c28bdc4c3d0f591d0af5ee813c8fb9f4134a` |
| 原 GBK 大小 / SHA256 | 6637 bytes / `8f6c8f52f13c83804629202238e0db60c0e9f048c4b891501050c618ba9fc315` |
| UTF-8 快照大小 / SHA256 | 7013 bytes / `3989a39a14e15d83c6f8ed7ef5b057a3fed92441c26ff3cc3ec60c0a08e6d52a` |
| 完整原函数 | `[005CBA10,005CBADC)`，79条 / 204 bytes |
| 原函数字节 SHA256 | `57471a89512c477dadcab409565d8b38fcb428963e894f828972714d87687543` |
| 另列 MOD | `[005CBA83,005CBA98)`，7条 / 21 bytes |
| MOD所列字节 SHA256 | `4a39ecdd13e7d2e72465ff60113b4a717810bc40c724822472fd6efebeaa8f50` |

[证据 JSON](../sources/patrol-security-gain.json) 与[闭合 schema](../sources/patrol-security-gain.schema.json)固定 profile、完整来源身份、两套字节清单、原函数7个 CALL/7个内部条件跳转、支持域、边界反例与未闭合项。原 GBK 身份通过 UTF-8→GBK→UTF-8 无损往返和重算 Git blob 共同验证；connector 返回的 base64 内容本身是已转码 UTF-8，不能将其冒充原 GBK raw bytes。

源仓库采用 [Apache-2.0](https://github.com/sjn4048/311MemoryResearch/blob/66e167e40c3440929ec016f3872aefc3486434c1/LICENSE)，本地保留[完整许可证](../sources/patrol-security-gain-LICENSE.txt)。快照变更仅是 GBK→UTF-8 转码，文本、注释、错字和换行保留；解释性更正仅放在派生文档与证据记录中。来源归属保留给该仓库及其贡献者。

原文件第107行明确分隔“修改 - 巡查倍率可调整”，并非建设批的星号形式。另列 MOD 先 `S×100` 再 `/2800`，在显示100%设定、全部766种可达总和上与原 `/28` 恒等，公共尾段仍加2。这是显示设定的有限域算术恒等，不能扩展为所有倍率恒等。隔离必须依据原文分段和独立字节结构，不能拼接原函数与 MOD，也不能伪造100%时的行为差异作反例。

公开 listing 重建不等于执行原 EXE。记录固定 `stockOriginalVerified=false`、`originalExecutableExecuted=false`，不宣称 PC-PK1.1、Vanilla、PS2、Wii 或其他补丁完全等价。

## 4. 必须保留的边界例

| 稳定统率槽 | 治安 byte | helper EAX | 基础量 | 半减后 | 返回增量 | clip分支 | 所防错误 |
|---|---:|---:|---:|---:|---:|---|---|
| `[0]` | 0 | 0 | 2 | 2 | 2 | false | 首槽0与首槽null不能混为一谈 |
| `[28]` | 0 | 1 | 3 | 1 | 1 | false | 先半减统率再+2会错成2 |
| `[84]` | 97 | 1 | 5 | 2 | 2 | false | 先clip再半减会错成1 |
| `[28]` | 97 | 0 | 3 | 3 | 3 | false | 恰等100仍走非clip分支 |
| `[0]` | 101 | 0 | 2 | 2 | −1 | true | 不增加下界0 |
| `[0]` | 255 | 0 | 2 | 2 | −155 | true | 不缩窄城市byte域 |
| `[255,255,255]` | 0 | 0 | 29 | 29 | 29 | false | 不把单人/总和截到100/300 |
| `[28]` | 0 | 2 | 3 | 1 | 1 | false | 非零不仅是1 |
| `[28]` | 0 | 4294967295 | 3 | 1 | 1 | false | 使用完整uint32返回 |

`[null,100,100]` 是工程拒绝；若真实首将 gate 失败，原函数返回0，但该原生早退不在此 API 支持域。正常能力最多100/人且治安0..100的既有实测锚点与本函数数值相容，本次提升的是来源等级、整数顺序和边界精度，不声称已推翻普通状态实测式。

## 5. helper、命令与技巧点边界

`004B99B0` 的零/非零消费方式已可逐字节证明，其内部距离/敌我/同盟/设施类别/地形/可达性规则未在本批取得。原注释称“城市3格、港关2格”，官方说明书称“都市周围2格”，两者保留来源差异；不能将输入命名为 `enemyWithin2`、自行择一作为源代码规则，或声称已实现地图压力判定。

[执行巡查 context 快照](../sources/patrol-security-gain-command-context.txt)保留固定提交的完整公开 listing，仅用于约束调用边界：

- `005CBE8C` 才是对 `005CBA10` 数值核的调用
- `005CBE9B` 将结果传给 `004B3ED0` 治安 writer，`005CBEA0` 把 writer 返回值存入 EDI
- `005CBF95` 是对 `005B9340` 的行动力扣除调用，不是数值核入口
- `005CBF61..005CBF79` 的技巧点请求片段消费的是 writer 的实际返回值；本批不实现、不导出、不测试为生产API，也不把 `returnedDelta` 自动串为技巧点输入。请求值、最终净TP和writer裁剪是不同证据问题

该 context 的原 GBK blob 为 `8743c1da9deda198dbea7be004a36203b4ad8c4a`；GBK 18222 bytes / SHA256 `71bd497a64593687ba7d42ad2c75f9e811b0db6b323cf59b28602f32aefdfe16`；UTF-8 18845 bytes / SHA256 `c3dd3d3e33bbc0468c63c01ef8cc3697dcfe3bdf5552cf9486f11ea6e8a7d4fe`。保留完整调用 listing 不代表恢复了其全部外调、资格、写回或费用语义。

## 6. 验证要求与剩余缺口

本批验收应分别验证：可逆源快照/许可身份，原79条/204字节与另列7条/21字节结构隔离，API实际导出与原生输入域，分支和反例，逐字节独立oracle，以及旧训练/存档/命令合同未改。纯数值枚举应覆盖全部 `766×256×2=392192` 个总和/城市byte/压力零或非零组合，并另外覆盖不同非零EAX位型及首槽/数组拒绝。

先前只读研究里的 byte 解释器和枚举结果是研究证据，不是当前生产代码的通过记录；旧批139项/214 Node结果也不适用于这棵新增代码树。当前实现仍为本地候选，完整回归与独立恢复审查、发布各自单独记录和批准。

已补的是公开完整巡查数值函数正文及其稳定输入数值 API；仍 open：

- `00489070` 属性getter完整合成、基础/显示/受伤病属性映射及可变行为
- `0047A630` validator、`004866F0` 城市resolver、真实指针/重复读取与副作用
- `004B99B0` helper本体及两种距离描述的归属和等价
- 完整命令资格、选择、设施/首将/城市 gate、费用与行动标记写入
- `004B3ED0` 治安writer及实际增量、技巧点请求独立实现及 `004B6580` writer/最终净值
- 调用调度、Train/EndTurn、mission、存档、重放集成
- clean-stock EXE hash、精确补丁归属、PC-PK1.1/Vanilla/主机和跨版本等价

下一证据应是可归属的 helper/getter/caller/writer 字节及独立原版样本，不能用攻略拟合、当前纯函数回归或源注释替代。
