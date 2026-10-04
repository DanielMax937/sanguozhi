# P0-62 return/list/role与event8/14原生递归组合

更新：2026-10-04 UTC。基线main `a3c94e9d045688fe93c3c9b9172db30d5a89333a`（PR #19已合）。旧P0-57/58/59/60/61 API、schema和trace保持原样。

- [结构化证据](../sources/recursive-officer-return.json) · [字节域](../sources/recursive-officer-return/README.md)
- [新frame](../../scripts/recursive_return_frame.py) · [组合控制器/return](../../scripts/recursive_officer_return_profile.py) · [live role primitives](../../scripts/recursive_role_primitives.py)
- [来源检查](../../scripts/check_recursive_officer_return_source.py) · [模型检查](../../scripts/check_recursive_officer_return_profile.py)

## 1. 闭合域与没有闭合的部分

`project_recursive_officer_return(state, command, observations, policy)`增加独立`return`、`legion`、`governor`和`event`入口。只有一个当前frame、一个有序观察流、一次最终revision提交；内部不调用旧`project_*`，不复用P0-57/58的非干预预计划，也不把旧trace接在一起。

在正常势力、非空军团及refresh=0域，已知原生步骤连续执行：

`004BF6F0` → home/legion列表移出、字段写、尾追加、sort入口 → `004BE2A0`/`004BCA30`/`004B3A20` → 实际`004BBAA0(event8/14)` → copied-active listener/dispatcher/handler → `005B8400` → 递归`004BF6F0` → 恢复外层调用 → 后置observer。

这里的“原生步骤”指以固定源字节为依据的Python语义投影，不是执行EXE。普通非空军团的角色事件不再只是未执行账本；但**多节点native sort、未知route/target-force计算及外部callback仍是显式可变观察**，本组不声称全原机返回过程完全闭合。

force灭亡、空军团重分配、ruler ownership/capture明确整次defer。缺乏观察或超过声明的引擎资源guard也不提交任何部分状态。无empty-force默认存活、无空军团隐式选人、无callback默认不干预。

## 2. 扩展frame与同一对象

新frame `source-idb-S1-S2-recursive-return-frame-v1`显式加入：

- person的office、derived leadership/strength byte、rawWordAE与rawDword17C
- building的raw subtype validity、legion/governor及有序home roster
- legion的leader及有序roster
- force的field128与advisor

人物表限定固定type10 canonical可读slot。allocated/valid是virtual+04/+08派生getter，不能独立改布尔：rawDword17C非零时二者为true；零时allocated当且仅当signed status在0..8，valid另外排除status6/8。输入及每个观察before/after必须满足此约束；native status写会先同步派生结果再记录step/frame。status6/8/越界人物在sort后被提升到1时，后续role/event立即看到新的getter结果。raw+17C只按零/非零使用，不猜它的语义；旧API不变。

原tail frame的mission/参数/duration/status/home/location/rawlegion/完整flags、CITY有效性、active列表、executing、observer、managerDirty、RNG和opaque data均保留。city对应building的subtypeValid与cities.valid是同一原始对象有效性，输入及每个观察before/after要求一致；building.valid是另一getter结果观察。人物以外的valid仍属显式观察域，未声称与所有尚未建模raw依赖一致；这些字段在本组没有对应native raw依赖写入。schema合法或hash匹配不认证观察的原机可达性。kind/ID不匹配时getter不虚构canonical subtype。

稀疏表是完整声明宇宙：全域collection扫描省略对象表示未分配，不是未知对象；而在控制流明确到达一个域内getter时，缺少slot报证据不足，不能猜null。所有roster/active节点必须指向提供的人物slot，重复节点保留，字段名和opaque object-key域在观察间固定。旧frame不会自动补默认值升级；`tail_snapshot`只供有损诊断，绝不回写。

## 3. 每次调用自己的event/list/actor上下文

每层递归event有独立eventIndex、parentEventIndex、event内容、copiedActivePersonIds和visits。外层复制节点列表不会被内层覆盖；内层读取进入时最新active列表；两层每次访问均重读live executing和mission。actor另用push/pop栈，因此内层handler返回后，外层仍操作原先person。

`callStack`保存每次wrapper/listener/dispatcher/handler/return/role/roster入口及其native saved locals。引用对象用固定slot ID表示，读取其字段时总是解析当前frame；不能持有旧Python row引用跨越mutable boundary。

例如返回函数保存oldStatus/oldHome/oldLegion和target ID。notice、home/legion sort、location observer、old-legion角色事件之后分别按源时点重读live person force/status、target kind/legion及old-home有效性。new-legion pointer在legion setter/sort后重新取得，再跨old-legion协调保存；不能在old-legion事件之后换成最新target legion。old/new角色与event setter也分别保留源实际保存的person/home pointer。

外部observer或sort内部发生的未知递归，可由其whole-frame观察覆盖，但不会虚构内部逐指令轨迹；只有本模型直接遇到的已知role→event调用才展开递归。

## 4. 有序list与sort的实际边界

remove查找head开始的第一个匹配node，只移除一个；append不去重。same-home/same-legion仍执行移出/追加/sort，未知allocator失败不被当作成功：本域明确要求成功分配、可读无环list。

`0047CD50`入口count<2直接成功返回，不执行临时分配、过滤或比较器。count>=2源实现涉及snapshot、allocated筛选、virtual getter、native排序、clear原list及再次allocated筛选/append。本模型把该**完整调用**作为精确roster身份和before绑定的可变effect，避免用Python稳定排序或预计算rank伪装这些行为。

角色排序`004AA200`同样保留source的count<2直接路径；更大候选集合使用带返回有序pointer列表的effect-query，实际frame可以改变。候选副本和旧leader等caller locals不随观察替换。能力计算S1/S2差异、比较器调用次数、临时分配及中途身份变化均不能凭最终排名反推；完整sort内部仍是剩余缺口。

## 5. 原子观察、随机与引擎guard

未知作用仅`observed-frame`或`reject`。每条记录绑定source、连续index、kind/helper、精确实参、完整callStack、完整before和provenance；有作用时还需完整after及RNG消费证据，返回值另外严格验型。所有观察先验证schema/domain，运行时再核实际调用位置。缺少、过期、错源、错层、错saved-local或多余记录均失败，输入不被修改。

纯已知步骤localCalls=0；mutable observations的消费按observed-count累计，任一个unknown导致总observedCalls=null。首末RNG相同不证明消费为0。全局RNG、原始观察真实性和可达性仍未认证。target建筑force不能简单等于target legion.force：设施metadata/territorial分支存在，因此逐调用显式effect-query。

`engineGuard.maxEventDepth`与`maxNativeCalls`是可配置工程资源上限，不是源程序递归终止规则。其中nativeCalls/maxNativeCalls计数的是模型scope进入（含saved-local辅助scope），不是完整x86 CALL或比较器调用次数。达到guard后after=before，不登记命令，不悄悄截断剩余事件。整个接受事务只revision+1；幂等摘要绑定command、observations和policy。完整输入重放重新执行递归树，重签hash的输出篡改也不能通过。

## 6. 验证与下一范围

```sh
python scripts/check_recursive_officer_return_source.py
python scripts/check_recursive_officer_return_profile.py
npm run check
for f in scripts/check_*.py; do python "$f"; done
npm run demo
npm run demo:lifecycle
```

17项source-only检查通过；完整双IDB指纹及独立raw-ID1重读611范围/53,266 selected range bytes通过（S1 303/S2 308；302同形对296同/6异，另7未配对宽度；重叠选段长度不去重）。37项模型测试通过，含256组独立evolving-frame递归oracle、184组listener/event/source变体、130组独立raw/status truth-table、24组promotion→event14回归、32层真实递归guard、原子拒绝和完整JSON重放。完整94条命令回归零失败：TypeScript、85 Node tests、91 Python checkers与2 demos。独立审阅发现的native status→derived validity依赖已补rawDword17C、严格一致性契约及逐写刷新；修复后完整94命令和最终37模型测试重新全过，独立复审通过：新schema的14文件/index在验证前后无漂移，17source/37model与完整94命令重跑零失败；两份完整IDB哈希和611范围/53,266bytes另用独立raw-ID1读取复核，追加36组promotion逐step派生predicate及mixed event14→8/outer-event篡改检查全过，无剩余阻断。发布前仅补本审阅结论，合并后main仍须全测。

S1/S2各自fingerprint固定且均MOD关联；IDB所记EXE hash不是独立clean binary证明。PC-PK1.1仅compatibility-reconstruction，Vanilla另为compatibility-assumption。clean stock、其他event IDs、完整sort/capacity/route、force灭亡/空军团、ruler capture、base销毁、AI disposition、真实存档/全局RNG和完整游戏调度继续open。
