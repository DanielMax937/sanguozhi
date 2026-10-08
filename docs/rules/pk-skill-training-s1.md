# PK 特技培育：S1 类别2限定资格核

基线：PR #45 合并后的 `4dad95554915935b9a0982c028eff71114d69cd3`，tree `e1ae186e231ef66f0068aed91d18ec05db4add01`。本批只新增独立纯函数，没有接入游戏命令、完成写入或调度。P0-78 及其依赖完全排除。

## 函数与支持域

公共入口导出 `qualifyPkSkillTraining(input)` 及冻结来源 `PK_SKILL_TRAINING_S1`。调用前提是原 caller 已通过人物/记录指针gate、已进入类别2。函数不替调用者完成这些前置检查，也不回答完整研究/培育命令是否可用。

输入为 `{profile: 's1-pk-skill-training-v1', person: {rawE8}, trainingRecord: {raw58}}`。两个字段均为原生signed32标量，完整支持 -2147483648..2147483647；不自动把攻略ID、技能名称或攻略隐藏候选映射为原生ID。

1. helper只有在目标 `raw58` 为0..99且人物 `rawE8` 与目标精确相等时返回true
2. caller对helper取反，得到本分支 `eligible`
3. 因此相同有效目标不合格，另一已有特技不阻挡；没有“必须无特技”的条件
4. 目标小于0或大于99时helper为false，caller仍为true，即使两个raw值相等。这是原始分支数值结果，不代表这类记录能通过完整命令

未知字段、缺字段、非对象、错误profile、非整数、非有限数以及signed32以外的值都返回 `supported:false` 与明确原因。这些拒绝是工程输入契约，不是新增原生gate；native范围0..99之外但仍在signed32内的目标不会被工程拒绝。

成功结果包含 `supported:true`、profile、两个输入标量快照、`helperMatchesSkill`、`eligible`、`reason`（eligible/already-has-target-skill）与证据地址。结果与证据不可变，函数不修改输入、人物、任务、存档或RNG。

```js
qualifyPkSkillTraining({profile: 's1-pk-skill-training-v1', person: {rawE8: 32}, trainingRecord: {raw58: 32}}); // eligible:false
qualifyPkSkillTraining({profile: 's1-pk-skill-training-v1', person: {rawE8: 27}, trainingRecord: {raw58: 32}}); // eligible:true
qualifyPkSkillTraining({profile: 's1-pk-skill-training-v1', person: {rawE8: -1}, trainingRecord: {raw58: -1}}); // supported:true, eligible:true
```

## 完整来源绑定

S1 是 [sjn4048/311MemoryResearch 固定提交66e167e](https://github.com/sjn4048/311MemoryResearch/tree/66e167e40c3440929ec016f3872aefc3486434c1) 中已收录的IDB字节；caller与helper元数据均绑定IDB `c591cb40ce6d6be9246148002532dedc042463f36cd39c5ed300b7c449feefab`、血色5.0 MOD关联输入。等级仍是compatibility-reconstruction，stockOriginalVerified=false。本批没有重新取得或运行EXE/IDB。

- caller完整 `0049DC60..0049DD27`（end exclusive），199字节，SHA256 `df2ecab2bee55d4a5bea0018acbb3894031747654552e53d3afd20815454989e`；来自 [training manifest](../sources/training-lifecycle-source-profile.json) 与原反汇编
- `0049DD05..DD08` 比较类别2；`0049DD0A`读取record+58；`0049DD0E`将person放入ECX；`0049DD10`相对call精确落在004890F0
- `0049DD15..DD1D` 的NEG/SBB/INC将零结果变成1、非零变成0；中间POP不修改carry
- helper完整 `004890F0..00489116`（end exclusive），38字节，SHA256 `28b915b82376fbebe6a95c983a5b1e9bb19d3fefb49a53a1a45312c4c0a5862f`；来自 [helper manifest](../sources/capture-personnel-source-profile.json) 的S1行与 `S1-004890F0.asm.txt`
- helper在 `004890F4..FB` 用signed分支判断0..99，在 `004890FE` 读person+E8，`00489106..0E`返回精确相等谓词，越界在 `00489111..13` 返回0

helper虽收录于旧capture证据目录，本身是无调用的通用标量查询。本批仅引用静态证据，不导入或执行capture/P0-78实现。S2同地址片段有跳转改写，不能混入S1；checker以实际S2片段替换作负控。既有所有source bytes/manifest保持不变。

## 验证与范围保持

```sh
python -B scripts/check_pk_skill_training_source.py
node --test packages/engine/test/pk-skill-training.test.mjs
npm run check
npm run demo
npm run demo:lifecycle
```

新9个Node测试包含独立“范围→相等→取反”oracle，0..99全部当前/目标组合加-1、100、signed32极值，共10,816对；实际生产代码的12种行为突变逐一先跑未改控制，再检出无技能误要求、范围遗漏、0/99/100边界、相等反转、漏取反、误拒raw目标和缩窄/截断当前值。源码checker重建两个完整连续地址字节流，固定SHA、S1身份与6条opcode序列，并检出34种source/profile突变，均有未改控制。专项、完整回归和独立审查的最终结果单独留在验收包，历史P0计数不改写为本批结果。

PR45五维资格/完成核保持原字节；Train/限定EndTurn、saveVersion2、engineVersion training-kernel-v2、48基础节点/52基础箭头/4起点/50隐藏候选，以及史实、通用、PS2三套静态资料均保持原合同。本API不新增可派发命令。

## 仍缺

完整研究/培育资格与执行、AP/金/时长/使用次数、mission清理与展示、适性与特技完成writer、native98记录和攻略ID映射、隐藏选择算法/权重/RNG、完整scheduler、clean-stock PC-PK1.1与S2/Vanilla/主机等价、原作存档/运行时认证仍open。

适性分支已见当前适性等于目标减1的调用点，但同S1的00494FF0、00495010、00488D40完整函数仍缺，不能据此补猜等级/字段或宣称完整适性资格。下一证据为这三个可归属callee的完整字节。本批仅关闭“类别2的S1标量资格纯函数未实现”。
