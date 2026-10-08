# 自然忠诚普通候选：严格阈值与第三分支纠错

本批基线：PR #46 已合并的 `0f5ea43`。仅静态来源、候选控制流和文档纠错；未新增忠诚runtime，未关闭完整忠诚系统，未借用PR #46的发布授权。

## 固定一手资料与两套MOD隔离

- [311MemoryResearch 原文](https://github.com/sjn4048/311MemoryResearch/blob/66e167e40c3440929ec016f3872aefc3486434c1/内存资料/整理/Func-自动06-武将忠诚下降.txt)
- commit：`66e167e40c3440929ec016f3872aefc3486434c1`；Git blob：`0ce79d11923901fdfb74f99ddf281f744b3d9880`
- [完整UTF-8快照](../sources/natural-loyalty/0058E510-source-utf8.txt)：23159 bytes，SHA-256 `1ba952ffec7c91de3cacc991c854c412628f39e6f772a6a0a5368fcf6be8c36c`；回编码GBK为21580 bytes，并按Git blob头复算到上述原blob，未把转码快照hash冒充原blob
- [结构化sidecar](../sources/natural-loyalty-candidate-boundary.json)保存来源身份、18条候选指令、条件与未闭合项

原函数从 `0058E510` 到 `0058E82B ret`，238条连续指令、796个文本列出的指令字节。这里只核公开注释反汇编的内部连续性，未取得或认证原EXE。末尾“修改1”替换人心掌握概率，“修改2”替换忠诚基数并加入君主魅力，均完整保存在快照但不参与原函数指令投影；禁止按同地址后写覆盖前文。主段符节台行旁的“【修改】”是作者修改提示，本批不将其作为stock身份凭证。

## 普通候选的三个 OR 分支

前提：已经通过更早的有效性、季初、仁政及关系豁免。这里“入选”只表示到达 `0058E6E3`，后续人心掌握或零减量仍可能使忠诚不变。

| 地址 | 指令 | 有证结论 |
|---|---|---|
| `0058E6AA..6B3` | `call 00488C70; test eax,eax; jne 0058E6E3` | 俘虏返回非零直接绕过下列三条普通候选 |
| `0058E6B5..6BF` | `push edi; mov ecx,esi; call 00489F80; cmp al,19; ja 0058E6E3` | **unsigned AL >25**，等于25不由此入选；不是整个EAX比较 |
| `0058E6C1..6D1` | `cmp [esi+F0],1; jg 6D3; cmp [esi+F4],3; jnl 6E3` | **signed32义理 <=1 且 signed32野望 >=3**；原五档域对应低/较低与高/较高 |
| `0058E6D3..6DD` | `push edi; mov ecx,esi; call 004889E0; test eax,eax; je 0058E7B9` | **完整EAX非零**才落入 `6E3`，零则拒绝；原注释称“厌恶君主” |

`ESI`为当前武将；`0058E626..62D`调用并保存的君主ID在`EDI`。两处候选helper都是 `ECX=ESI`、栈参数为`EDI`，因此“厌恶君主”是当前武将指向君主的源注释归属，不是把反向关系或当前看守君主另作推断。完整 `004889E0` 未在此来源中，不能声称其全部关系语义已证。

短路顺序保留：相性分支入选不调用义理/厌恶；义理野望合格不调用厌恶。原文 `0058E6D1` 注释称“相性差小于25”，但实际从 `JA` 不跳的分支进入，包含25；按字节而不是注释恢复边界。

俘虏的 `0058E61A` 跳过仁政、`0058E656` 跳过季初、`0058E6B3` 跳过三条普通候选是不同跳转。既有关联关系豁免仍在前面，不把俘虏解释成无条件掉忠，也不改变俘虏月度流程。

## 必须保持的反例

以下普通例子均假定前置豁免已过。

| 俘虏 | 相性helper AL | 义理 | 野望 | 厌恶helper EAX | 进入6E3 |
|---|---:|---:|---:|---:|---|
| 否 | 25 | 2 | 2 | 0 | 否 |
| 否 | 26 | 2 | 2 | 0 | 是 |
| 否 | 0 | 2 | 2 | 1 | 是 |
| 否 | 25 | 2 | 2 | 1 | 是 |
| 否 | 25 | 1 | 3 | 0 | 是 |
| 是 | 未调用 | 未读取 | 未读取 | 未调用 | 是 |

`AL`高位舍弃、义理/野望signed32比较、厌恶/俘虏完整EAX非零也有反例测试。其余位模式仅测试caller观察宽度，不赋予MOD属性新的游戏意义。

## 边界与验证

`00489F80`、`004889E0`完整callee，`004A6CF0`最终writer，`00472150` RNG内部/分布/全局序列仍未补齐。历史150点环公式、caller数值算术和参考0..2随机摘要继续保留各自证据层级；caller的两次调用不证明均匀独立性，2/3概率依赖该约定。忠诚降量端到端、stock PC-PK1.1、Vanilla、PS2/Wii、原存档及运行时不由本批认证。

静态checker核不可变来源hash、原GBK blob、主段/MOD分隔、全部连续性、候选18条投影、rel32/rel8目的地、三条件与文档一致性。测试包含25组边界/篡改检查和25600组普通五档域组合；独立作者另外运行28个固定反例与225792组原字节解释器比较，并用GNU objdump交叉核指令。

可复跑：

```sh
python -B scripts/check_natural_loyalty_candidate_boundary.py
python -B scripts/test_natural_loyalty_candidate_boundary.py
node --test packages/engine/test/natural-loyalty-source-data.test.mjs
```

本批新跑 `npm run check`：TypeScript与204项Node tests全部通过（包含本静态wrapper的25组Python检查）；新静态checker及4项既有忠诚相关checker和技巧资料checker通过。25组中含25600组合，独立probe另有28固定例/225792组合。测试前后2244个在册及新增文件hash一致；只读依赖沿用基线，命令使用既有验证锁和heap512/semi16/TAP配置。没有运行游戏EXE或声称远端CI通过。

上述静态回归纳入现有 `npm run check`。历史134项native长测不以本批静态纠错重报；P0-78及capture/force灭亡/native事务依赖保持排除。首轮独审发现当前摘要中另一个“相性与君主差”的包含阈值写法，以及俘虏节/技巧摘要的边界措辞残留；已纠正并加入3项文档反例。15份当前摘要纳入检查，保留audit-history原文。修订后独立恢复复审结果随本批交付记录；发布仍须单独批准。
