# P0-65 空军团分派、合并与精确reset

更新：2026-10-04 UTC。基线main `116c6dd44d7fc1d102b3dab6f9716a8dde3a4abe`（PR #22已合）。新增版本，不改变P0-64及更早API、frame、trace。

- [结构化来源](../sources/empty-legion-redistribution.json) · [字节域](../sources/empty-legion-redistribution/README.md)
- [事务API](../../scripts/empty_legion_redistribution_profile.py) · [原生helper](../../scripts/empty_legion_primitives.py) · [扩展frame](../../scripts/empty_legion_frame.py)
- [来源检查](../../scripts/check_empty_legion_source.py) · [模型检查](../../scripts/check_empty_legion_profile.py)

## 1. 这次闭合什么

`project_empty_legion(state,command,observations,policy)`在一个live recursive frame与一次revision提交内，展开`004BE2A0`空军团分派、`004BD3B0`已知合并步骤和`0047E470`精确reset。继承return/legion/governor/event8/14、native排序/capacity/route/target-force入口，新增`merge-legion`和`force-legion`供独立核对。正常非空分支保持原调用结构，不调用旧project、不拼接旧trace。

据点归属完整事务`004AD550`和人员重新定位`004A8270`仍以精确调用参数、saved native locals、全frame和RNG账本绑定的可变观察继续，或按policy原子拒绝。没有默认非干预，也未声称这些两个深层事务已经实现。势力灭亡`004B80A0`继续原子defer。局部步骤可测试、可替换，不把部分after冒充整场capture。

## 2. 空军团的两种方向

`004BE2A0`先验证legion，再检查raw force ID为0..41，检查该势力仍有符合status mask15的allocated人员与城市，再检查军团自身同时具有城市和valid人员。有效force0..46和此处0..41门不是同一规则。

- 非第一军团：`00481240(force,1)`按全局legion ID0..46扫描，第一个valid、force相同、ordinal=1者为目标。然后`merge(empty,first)`，即重置的是空军团自身
- 第一军团：读取force当前君主，有效君主的home需为有效building；按city ID0..41收集同势力有效城市，保持顺序，再移除当前legion所属城市。选择离保存的君主home领土最近的候选城市，把候选城市当前legion合并进空的第一军团
- 每次合并后重查第一军团presence；若仍空，按刚保存的候选legion ID过滤原临时city列表，继续选择。临时列表不会因callback换frame而重新收集
- 候选流程后仍为空则执行fallback2..8。两份source都先调用`00481240(force,ordinal)`却丢弃返回值，再把ordinal本身交给`00490AD0`作为全局legion ID。仅验证该全局军团valid，就merge它进第一军团；循环中不检查是否已经恢复presence，也不补same-force gate

最后一项是实际opcode控制流，不根据合理性改写成“按势力找到的第二到第八军团”。空分支返回后不会继续执行正常leader排序。`force-legion`的receiver只需canonical pointer身份，不读取force.valid或任何force字段；ordinal范围外直接返回-1，null receiver不能匹配有效legion。

## 3. 最近城市、source地图与S2额外熵

`0049F1D0`每个候选依次计算保存origin building的当前territory，再计算candidate city对应generic building的territory；`0047B480`使用origin作为42×42无符号byte距离表第一下标。任一territory不在0..41就返回-1，不能把该值过滤成不可达。最小距离按原有顺序保留所有tie。

origin是保存的pointer，字段每次读取；candidate city的generic building有效性和kind与city subtype是不同对象。固定city vtable+24为0047B110恒返回6，所以canonical city.valid和allocated恒为true；gate与port的fixed virtual+24也分别恒7/8，对应subtype谓词恒true。新frame明确要求42个city subtype及87个canonical base storage全列，city.valid和0..86的subtypeValid恒true。全列是明确输入域要求，不声称原作有这样的schema检查。中立或未所属以raw legion=-1表示，不能用city.valid=false替代。generic building的fixed virtual+24为恒5，virtual+08再检查raw kind0..63，故newframe也严格要求building.valid等于kind范围谓词；无效generic building用kind=-1等越界raw值表示，不能独立改缓存。这不要求generic kind必须与city/gate/port canonical ID一致。此要求也作用于每个可变观察before/after，不允许callback单独改变type-valid缓存。旧版本未自动迁移。P0-64及更早frame曾接受与这些原生谓词不一致的独立valid缓存；这些旧版本接受域不能据此认证为固定vtable精确路径。保留旧trace兼容不等于重新认证旧假设，新组合应使用本版严格frame。所读地图与距离表按S1/S2分开，固定字节是本版本明确前提。

选中tie始终调用`00472150(count)`，但count<2时返回0且不推进状态。本域最多42个不同城市，无low16截断歧义。

- S1：对当前seed作`(seed*0x6C078965+0x3039)&0xFFFFFFFF`，再用high16对count取模；不改成均匀无偏采样
- S2：`0047215E`额外调用完整恢复的`008EB010`。它顺序读取`7FFE0320`、`7FFE0008`、`7FFE0014`三个共享页dword，求和取low16后与当前seed作u32相加，再执行上述LCG/store

新query边界`008EB010/shared-user-data`必须提供按该次调用顺序采样的三个uint32，与source、callStack、before frame和地址列表绑定。不是一次同时发生的系统时钟snapshot，不猜测OS字段名称，不以0代替缺失读值。完整hook只有读取和算术，无gameplay callback、内存写或额外调用，因此三值read-only观察足够；随后算术与RNG写由模型执行。单候选跳过整个hook。S2存在这条MOD关联差异，不得将S1确定性seed规则跨源默认为原作精确。旧API/trace不重写；全局种子来源、所有消费和clean stock仍未知。

## 4. 合并的复制列表、live重读与深层边界

`004BD3B0(source,destination)`入口没有source/destination有效性、same-force或same-pointer检查。source必须可读；destination只检查pointer非null。null目标会略过转移而继续reset，in-range无效目标仍可进入转移，自己合并给自己也不被人为禁止。

1. 保存source当前leader pointer。若person有效，status<=1才决定降为2或3：at-home且保存home有效且该home的governor仍为自身则2，否则3。status>1也继续清source leader（该setter会重查legion.valid），然后重新读取保存person当前home并governor刷新
2. 非null destination时完整复制source roster节点，再由`004A33B0`完整复制一次。两次`0049F820`都不检查person allocation；重复及指向无效person的节点仍留在临时列表，逐人`004A32F0`自身才检查allocated并执行remove-first/append/native sort
3. 按building ID0..16383扫描当前valid、canonical base且当前legion=source者，逐次调用可变`004AD550(building,destinationId)`观察。callback后的后续ID重新读取，不能预先冻结所有待转移据点
4. 扫描之后才读取destination当前leader和有效leader的home，保存其building pointer。若保存目的home有效，遍历第一次复制的人员节点，重查person.valid与其当前home.valid；home当前legion不同于person当前raw legion时，调用可变`004A8270(person,savedDestinationHome)`
5. 最后reset保存的source pointer，不因其valid后来变化而跳过

每个外部效果可改变当前person/status/mission、city/base/legion、active列表、观察器和RNG，但完整schema、raw别名、fixed domain都必须成立；缺失、多余、错source/阶段/保存值/前置frame的记录拒绝。原native局部值与callback后的live字段不能互相替代。列表和排序使用既有固定vtable、成功内存分配、可读非循环链、非null canonical person节点域；任意坏指针或并发改写不在此模型内。

## 5. raw reset与不变的旧版本

新legion增加`rawScalarHex`，只覆盖offset+04..+2F的44字节，严格小写hex。forceId/+04、number/+08、leaderId/+0C是同一storage的有符号dword别名，legion.valid仍由forceId0..46派生。写setter和reset会同步全部别名；观察不能提供彼此矛盾的raw与scalar。vtable与+30 list结构仍在明确canonical抽象域内，不伪造进程地址。

constructor真实store确认vtable首址`0079BFB0`，其virtual+20为`0047E470`，不能错用第二slot的`0079BFB4`作首址。reset(0)先调用已证明为空桩的`00423230(0)`，然后按源码先后写：

- dword+08/+24/+28=0、byte+2C=0
- dword+04/+0C/+10/+14/+18/+1C/+20=-1
- `0047E280`依次设置+28 bits0..10，清bit11并再次写+20=-1
- 最后清+30 roster

+2D..+2F padding完全保留；位操作中间值和真实store宽度逐步入trace。最终+28=0x7FF。没有附会其他未知字段名称或额外归属迁移。

force灭亡、完整base归属与mission重定位、ruler/capture、其他event IDs、一般sort参数/vtable、损坏指针/失败分配、原作递归终止继续开放。资源预算只是工程guard；无法继续的递归或输入域原子回退不改变原state。幂等command与全JSON重放继承原有严格契约，成功只提交一次revision。

S1/S2均为固定IDB指纹的MOD关联来源。两源共同opcode不是clean stock PC-PK1.1认证；PK仍标为compatibility-reconstruction，Vanilla单独compatibility-assumption。没有执行EXE，真实存档、Vanilla、主机版、完整调度与全局RNG未验证。

## 6. 验证

```sh
python scripts/check_empty_legion_source.py
python scripts/check_empty_legion_profile.py
npm run check
for f in scripts/check_*.py; do python "$f"; done
npm run demo
npm run demo:lifecycle
```

22项source-only检查及双IDB完整指纹/独立raw-ID1的155区间、26,651 selected bytes复核通过（77双源对73同/4异，另1个S2 RNG hook）。21项模型测试通过，含64组独立seeded merge oracle、完整JSON重放与raw逐store golden核对。独审发现并已收紧canonical city/gate/port恒type-valid和generic building kind派生valid；新frame显式42 city/87 base存储全列，旧API不变。最终100命令全回归零失败：TypeScript、85 Node tests、97 Python checkers、2 demos。169文件工作树/暂存区冻结在全回归及独审前后无漂移；独立复审重跑22source/21model、单独raw-ID1验证155区间及追加128随机reset/112 tie-RNG cases全过，staged/unstaged whitespace干净，无剩余阻断。源asm尾空白已规范化后重新双IDB核验；没有执行EXE或声称不存在的远端CI通过。发布前仅补验证结论及P0-64历史域更正，合并后main仍须全测。
