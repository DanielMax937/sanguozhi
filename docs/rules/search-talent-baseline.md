# 探索发现人才：已解析输入基准数值核

本批是基于 main `1053ce9fdee5668fc26bff4af20ff51dd913b39a` 的新本地候选，尚未发布。证据等级 `source-listing-reconstruction`：公开研究 listing 的完整66条指令、163个所列字节，不能认证 clean-stock EXE、精确补丁版本或真实运行结果。以前的回归不验证本候选。

## 范围及使用

`calculateSearchTalentBaseline` 从 engine 公共入口导出。输入 profile 必须为 `search-talent-resolved-v1`，所有字段必须是自身数据属性，字段集封闭，无类型转换、访问器、继承字段、Symbol 或额外字段；允许 null prototype，负零统一为0。即使发生提前返回，也验证全部输入。

- filteredCandidateCount：0..2147483647 整数，已经过未知 `005D1720` 过滤后的候选数，不能称全部在野人数
- politicsAL：0..255 整数，政治getter的已解析无符号低字节
- eyeSkillEax：0..4294967295 整数，眼力helper完整EAX位模式；signed -1 用4294967295表示
- cityRegion、officerBirthRegion：signed32整数，仅做相等比较，不补造州ID表

对象有效、观测稳定且输入已解析是合同前提。生产API不接native指针、人物ID、有效性helper或回调。拒绝结果是工程域拒绝，不冒充原函数无效指针返回。

返回只包含不可变快照和证据引用，不修改输入或游戏状态：

1. count=0 → returnedEax=0，branch=no-candidates；先于眼力检查
2. count>0且eyeSkillEax非零 → returnedEax=100，branch=eye-skill；完整EAX256也命中
3. 其余 → branch=arithmetic，cappedCandidateCount=min(count,5)，同州regionFactor=11、异州10，numerator=(3*cappedCandidateCount+7)*politicsAL*regionFactor，returnedEax=floor(numerator/300)

前两分支的 cappedCandidateCount、regionFactor、numerator 均为null，表示该路径未计算，而非伪造的数值。最大分子61710，数值均为精确整数。count≥5、politics255、同州返回205，没有100上限；眼力分支返回100并不保证比普通算式高。

| 已过滤count | 政治AL | 眼力EAX | 州关系 | 基准返回 |
|---|---|---|---|---|
| 0 | 255 | 256 | 同 | 0 |
| 1 | 100 | 0 | 异 / 同 | 33 / 36 |
| 5 | 100 | 0 | 异 / 同 | 73 / 80 |
| 6 | 255 | 0 | 同 | 205 |
| 1 | 0 | 256 | 异 | 100 |

## 来源与原注释纠错

固定 [公开来源](https://github.com/sjn4048/311MemoryResearch/blob/66e167e40c3440929ec016f3872aefc3486434c1/内存资料/整理/Func-人才05-计算探索是否成功.txt)，blob `d069a0a06b809de318b9f99deb1bb70f9b8dd3c7`。Apache-2.0，作者/仓库 `sjn4048/311MemoryResearch`；复用已有许可证原文 `docs/sources/production-price-LICENSE.txt`。

GitHub connector返回已解码文本，经GBK重新编码9251 bytes与固定Git blob匹配，并非直接下载raw。GBK和UTF8完整快照均原样保留，包括外层caller和错误注释。元数据与标准JSON Schema位于 `docs/sources/search-talent-baseline.json` 及同名schema。

- `005D1E61..6B` 的原“最小为5”错误：CMP / MOV5 / JG / MOV ESI给出min(count,5)，上限为5
- `005D1E85` 原 `sar dl,05` 错误：所列 `C1 FA 05` 是SAR EDX,5。与signed乘法高字、SHR符号修正一起实现受支持非负域除300

独立oracle仅解释该来源字节/指令，helper用显式观察桩，不恢复helper内部。它可以研究无效validator路径以覆盖来源全部5分支10结果，但那条native路径不属于生产API。原始所列字节的解码验证也不等于真实EXE身份验证。

## 尚未关闭

`0047A630`校验、`0047C4C0`城市设施、`004CF590`列表构造/修改、`005D1720`过滤、`004890F0`眼力、`004890A0`政治getter内部及可变行为未知。

外层 `005D1EA0..005D1F28` 先要求基准>0，再选候选并调用 `005B8140` 做最终判断；`0059CC10`选人、`00491310`人物ID、`00489F80`相性同源及最终RNG语义仍open。不得将本函数返回称为最终发现概率，不接Math.random，也不自动接PR52教程相性投影。

搜金、搜宝物、完整探索命令/登用/奖励/调度、clean-stock和跨版本仍open。无新增游戏命令；Train/限定EndTurn、save/replay不集成此核。P0-78及依赖capture/force/native事务继续排除。

## 验证

核心测试覆盖count0优先、完整EAX、高位/低位区别、count1..7与INT32_MAX、全部256个政治值、同异signed32州边界、严格输入拒绝、不变性及10个真实实现突变。独立来源oracle、标准schema、逐指令/字节身份、分支覆盖和全仓回归结果记录在新本地验收包，不复用历史通过日志。
