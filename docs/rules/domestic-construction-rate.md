# 内政建设速度：稳定值限定数值核

基线：`f0b88ff446fda4622fb186975b78fbb4a4f9b79d`。本批恢复公开非星号反汇编在稳定已解析值域内的建设速度，证据等级为 `source-listing-reconstruction`。它是独立纯函数，不是完整开发命令或工期实现；不接入 Train、EndTurn、存档、重放、mission 或 scheduler。P0-78 及 capture/force/native 事务相关工作不在本批。

## 1. 结论与输入域

公共入口 `calculateDomesticConstructionRate(input)`、冻结来源常量 `DOMESTIC_CONSTRUCTION_RATE` 由 engine 导出。输入合同：

```ts
{
  profile: 'domestic-construction-rate-stable-v1',
  politics: [75, 1, 0],
  facilityDurability: 450
}
```

- `politics` 是长度0～3的已解析值数组；非空项须为整数 `0..255`，即原 getter 返回并零扩展的 `AL`
- `null` 表示空指针槽；缺少的尾部槽补为 `null`。显式0表示非空槽的零政治，在纯数值结果上与空槽相同，但不宣称原生调用行为相同
- `facilityDurability` 是稳定设施类型 `+0xC2` 的无符号16位值 `0..65535`，不是建筑实例当前耐久
- `004890A0` 对同一人每次返回相同政治，且 `00490B90` 和所有到达的设施 `+C2` 读取都解析为同一个耐久值。这是投影支持域，不是 getter 本体已经证明无副作用
- 不按普通武将100政治缩窄原生byte域，也不把负值、浮点或越界输入自动截断为合法值

算法：

```ts
politicsSum = sum(nonNullPolitics)
maxPolitics = max(0, ...nonNullPolitics)
halfPoliticsSum = floor(politicsSum / 2)
politicsRate = maxPolitics + halfPoliticsSum

durabilityQuarter = floor(facilityDurability / 4)
durabilityRemainder = facilityDurability - durabilityQuarter
durabilityMinimum = floor(durabilityRemainder / 9)

rate = max(politicsRate, durabilityMinimum)
```

`politicsSum` 的范围是0～765，`politicsRate` 是0～637；耐久剩余量最大49152，下界最大5461。所有输入皆为0时速率可以为0，不添加“至少1”的规则。

成功回执包含 `supported:true`、profile、补齐为3槽的输入快照、最大耐久、上面全部中间值、`rate`、`selectedBranch` 与证据地址。`selectedBranch` 仅在耐久下界严格大于政治项时为 `durability-minimum`，其余为 `politics`，保留原 `JLE` 的相等分支。返回对象、槽位快照和来源证据冻结，输入不被修改。

非对象、未知输入字段、缺失或错误 profile、非数组、稀疏/undefined/额外命名属性的政治数组、超过3槽、非整数/非有限数或超出上述原生范围会返回 `supported:false` 与明确原因。校验是工程输入边界，不是原作命令资格；空槽与0政治输入得到数值并不等于完整命令允许这些配置。

## 2. 不可变来源与两条代码路径

主要来源：[sjn4048/311MemoryResearch 固定提交中的 `内存资料/函数[计算内政建设速度].txt`](https://github.com/sjn4048/311MemoryResearch/blob/66e167e40c3440929ec016f3872aefc3486434c1/内存资料/函数%5B计算内政建设速度%5D.txt)。

| 项目 | 身份 |
|---|---|
| 提交 | `66e167e40c3440929ec016f3872aefc3486434c1` |
| 原 GBK Git blob | `76b1f9591a9f94830bcf4e5a67764d2911e19fd4` |
| 原 GBK 大小 / SHA256 | 5936 bytes / `cabc5cb11e62dee04fda39aadce804284d272ca20e98ece202fd16cedfbe9216` |
| UTF-8 快照 SHA256 | `f092b0a16ab99ca74106c967e4dfb320211c2b4d2a066f0ca36b4be84272b132` |
| 非星号连续原路径 | `005BB1D0..005BB2AA`（end exclusive `005BB2AB`），84指令、219 bytes |
| 非星号字节 SHA256 | `8529878a0dca1cd080dfa805b5112ff940eba58631f31c5c5c83025400c7106c` |
| 排除的星号 MOD | 替换点 `*005BB263`，跳到 `008A9DE8..008A9DFD`，9行、31个所列字节 |
| 星号所列字节 SHA256 | `6067cd400b4750217191e66a2e133f6327281261ebd033dd7e686c7ab98f4e03` |

本地[UTF-8 解码快照](../sources/domestic-construction-rate-original.txt)保留源文本的注释和星号行；[证据 JSON](../sources/domestic-construction-rate.json)及[对应 schema](../sources/domestic-construction-rate.schema.json)分别约束原路径和排除路径。源文件中的非星号 `005BB263/005BB266` 与星号替换不能拼成一条“原版”指令流。

这是公开反汇编文本的可追溯字节，不是本轮独立取得的 clean-stock EXE，也没有执行原始游戏。`stockOriginalVerified=false`、`originalExecutableExecuted=false`。既有文档声称“公开资料只定位到执行路径005BC4C1、没有展开函数体”不准确：速率函数完整存在；完整工期与调度证据仍缺。

## 3. 从指令到稳定值公式

### 3.1 三槽政治累计及重复 getter

`005BB1D0..005BB1DD` 将总和、最大值和槽序号初始化为0。`005BB1E0..005BB213` 扫描三个指针槽，空指针在 `005BB1E9` 直接跳过。

非空槽在 `005BB1ED` 调 `004890A0`，返回 `AL` 经 `MOVZX` 进入总和；在 `005BB1F9` 第二次读取用于与当前最高政治比较；比较值大于当前最高值时，再在 `005BB207` 读取并保存第三次返回的 `AL`。因此源文件不是“每人取一次值”的执行过程。只有这些返回稳定时，纯数值层才能化为总和和最大值。

`005BB23E..005BB247`：总和载入 `EAX`，`CDQ; SUB EAX,EDX; SAR EAX,1` 按有符号除2向零截断，再加到保存的最高政治。因支持域的总和非负，这里等于 `floor(sum/2)`。它没有先计算或舍入 Wiki 的综合政治。

### 3.2 耐久读取及除9下界

设施类型解析函数 `00490B90` 在 `005BB223` 与 `005BB237` 被调用；类型 `+C2` 在 `005BB22A` 保存到 `BP`，另一次类型读取的word在 `005BB249` 被零扩展。`005BB250` 先逻辑右移2位；`005BB253..256` 将保存的word零扩展并减去这一商。

若解析和字段稳定，减法得到 `D - floor(D/4)`。`005BB258..266` 用 `0x38E38E39`、有符号 `IMUL` 的高32位、算术右移1和符号校正计算除9的向零截断。剩余量在 `0..49152` 内，所以等于 `floor((D-floor(D/4))/9)`。

源注释“1/12耐久”只能作概略描述；`D=11` 时精确下界为 `floor((11-2)/9)=1`，而 `floor(11/12)=0`。把下界简化成 `floor(D/12)` 会丢掉合法 `uint16` 输入。

### 3.3 比较、重读与返回

`005BB268` 比较耐久下界与政治项，`005BB26A JLE` 在下界小于或等于政治项时跳到 `005BB2A3..2AA`，返回政治项。

只有下界更大时，`005BB26C` 重新从早期保存的设施指针读word，`005BB279` 第三次解析类型，`005BB27E` 再读word，然后重新计算差值和除9，至 `005BB2A2` 返回。在稳定设施域内等价于返回下界；可变设施表或 getter 下不能把第一次比较值当成最终返回值。因此纯函数没有声称覆盖任意可变 getter、表更新、别名或调用副作用。

## 4. 与旧 Wiki 重建的关系

旧重建先令 `P=p1+floor((p2+p3+1)/3)`，再计算 `floor(3*P/2)`。下列反例分别检验舍入顺序和设施下界：

| 政治槽 | D | 政治项 | 下界 | 当前源速率 | 旧重建速率 |
|---|---:|---:|---:|---:|---:|
| `[75,1,0]` | 450 | 113 | 37 | 113 | 112 |
| `[29,1,0]` | 500 | 44 | 41 | 44 | 43 |
| `[0,0,0]` | 500 | 0 | 41 | 41 | 0 |
| `[100,100,100]` | 500 | 250 | 41 | 250 | 250 |

最后一项是共同锚点，不是全域等价证明。空槽、槽位重排和重复数值在稳定值域内遵循同一和/最大值运算；它们不能证明原生 getter 的调用次数或副作用可省略。

[经济规则 C7](02-economy.md#7-内政建设速度数值核与开发日数观察)保留 Wiki 门槛表与旧进度假设，明确标为独立攻略观察/历史重建。官方最多3人、政治影响日数的说明，市场125/500的旧实测，以及 SIRE 的耐久/建设状态结构，都不能代替原生 writer/caller。

尤其 `D=450` 时源下界先用 `D>>2=112`，旧初始模型 `roundHalfUp(D/4)` 给113；这里没有向建筑实例写入任何初始耐久。无论采用112还是113作实际初始值，都需要独立 writer 证据。源注释提到“10旬的最大时间限制”也不能独自恢复首次推进时机、完成条件或完整显示工期。

## 5. 验证边界与仍缺证据

验证应分别覆盖公开快照身份/连续指令、星号 MOD 隔离、纯数值输入域、三个反例与共同锚点，以及旧训练/存档/命令合同保持。星号 MOD 按本文件字面先将政治项乘100，再有符号除100；在本支持域政治项0～637内，乘积不溢出、商精确还原原值。因此该精确补丁在此域内数值恒等，MOD 隔离是来源与结构义务，不能声称存在区分该补丁与非星号路径的域内行为反例。实际测试结果以本批新运行日志和独立审查为准；本文不把历史通过数或计划检查当成本批成功结果。

本批关闭的是“公开建设速度函数尚未发现”和“稳定已解析值数值核尚未实现”，不关闭下列项目：

- 政治 getter `004890A0` 完整属性合成、可变读取与副作用；设施 resolver `00490B90` 本体及可变设施表语义
- 武将选择/资格、城市/设施资格、费用、任务记录与完整建设命令
- 实际初始耐久 writer、每旬进度写入、第一次推进时机、完成判定/调度，以及完整开发/显示日数
- Train/EndTurn、mission、真实存档与重放集成
- 独立 clean-stock PC-PK1.1 原字节及 Vanilla、主机、其他版本等价

下一证据应是可归属的 getter/caller/writer 完整字节和独立原版样本；不能由攻略表拟合或本地模型回归替代。
