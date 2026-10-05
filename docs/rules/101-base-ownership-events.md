# P0-66 据点归属、耐久与event9/10

更新：2026-10-05 UTC。基线main `874f6126bd82d4bfc2ff6daf778ec60a5120bc35`（PR #23已合）。这是显式新版本；旧API、frame与trace保持不变。

- [来源与字节](../sources/base-ownership-events.json) · [来源域](../sources/base-ownership-events/README.md)
- [事务API](../../scripts/base_ownership_events_profile.py) · [原生helper](../../scripts/base_ownership_primitives.py) · [frame](../../scripts/base_ownership_frame.py)
- [独立来源检查](../../scripts/check_base_ownership_source.py) · [模型检查](../../scripts/check_base_ownership_profile.py)

## 1. 本次闭合的调用范围

`project_base_ownership(state,command,observations,policy)`扩展P0-65共享frame，直接展开`004AD550`，并在原有空军团merge的逐据点扫描中调用同一primitive。新增`base-ownership`入口，参数为generic building ID与requested legion ID；其他return/role/sort/route/empty-legion入口继续存在，所有调用只提交一次revision，不调用旧project函数拼接事务。

已知归属写、耐久max/裁剪、城市flags、event9/10列表分派与predicate直接执行。成功的mission23/24继续使用已恢复的真实handler/tail/return路径；其余此次新触发的取消handler用返回dword加全frame/RNG的精确调用观察继续，或按policy原子reject。event9的`004BA1D0`仍为单独全frame可变观察；event10的该尾为源证实no-op。无默认identity callback。

这不是完整据点陷落、部队反应或势力消亡事务。观察域是声明的canonical字段与opaque data，不是完整进程内存；hash不能证明观察真实性或可达性。

## 2. 归属选择与保存值

入口先检查generic building.valid，再接受requested legion=-1或0..46。保存building.virtual+44旧军团与virtual+40旧势力。requested legion无效时new force=-1，只有valid legion才读取其force。没有额外要求requested force本身valid；军团valid和势力valid是两个不同谓词。

`00487B30`判定直属设施后，`004867A0`才写generic raw+0C owner force。其category1、kind24例外/category3、category2顺序沿用source getter。随后无条件进入`004876A0`，按当前raw kind0/1/2及对应canonical ID范围选择city/gate/port subtype；无匹配时不写subtype军团，也不假装修改了领土城市归属。

转属后重新读取generic virtual+40：

- 新旧force不同：先执行城市flags重置，再发event9，直接返回，不补发event10
- force相同但新旧virtual+44 legion不同：只发event10
- 两者相同：不发事件，但已发生的归属setter和耐久检查不会被省略

`004866F0`城市获取只看generic ID是否0..41，不检查其raw kind。因此ID落在城市存储范围的非city kind也可能进入城市flags分支。中立化、不合法legion对象、same-legion写入、category与canonical subtype不一致均不被人为“修正”为合理化行为。

## 3. 耐久不是简单的无符号min

新增building字段`durabilityWord`表示generic +10 uint16；`subtypeMaxDurabilityWord`表示canonical city+82或gate/port+62 uint16。这两个对象/字段保持独立。

city`0047CBD0`、gate`00483730`、port`0048DB30`先写各自raw legion dword（city+38，gate/port+20），再保存generic current durability，调用`0047A7D0`求新max并作unsigned16比较。仅current>max才再次求max，交给对应durability setter，再经generic`00487E20→00487150`第三次计算max。

- S1：`low16(intrinsic + (valid owner且tech26 ? 3000 : 0))`
- S2：检查tech36，先做相同low16，再由完整`008EA050`尾把结果按unsigned限制至24000

S2尾只有比较、赋AX和函数返回，不是外部query或RNG hook。force.valid依据raw ruler范围，不能额外检查该ruler person是否valid。technique bit使用source对应bit，S1与S2不能混用。

最终generic setter先取得max，再把requested低16解释成signed16：requested<=0写0；否则如果signed(max)<=signed(requested)写max，否则写requested。这保留S1 wrap/高位值下与直觉min-u16不同的结果。真实写宽为word。canonical subtype确定之后至此没有callback，因此本调用域的`00487150`facility fallback不可达；此处不声称实现一般设施耐久setter入口。

## 4. 城市flags与事件顺序

新增city`rawFlagsA4` uint32。`004815F0`、`0047B6F0`、`0047B710`各经`00472520`对同一+ A4 dword依次清bit0、bit1、bit4，保留其他位，并逐次记录真实dword RMW。不是三个byte字段，也没有把全dword清零。平台成功读写probe属于显式nativePlatform输入域；没有执行EXE或系统探针。

flags完成后`004BBAA0`创建event9/10，复制当前active列表，按节点顺序遍历，保留重复节点；每次重新读executing person和mission。已有8/14嵌套调用仍有独立event/actor/copied-node上下文，返回后恢复外层保存值。

## 5. event9/10 predicate域

全部44项注册槽、mission37跳过和stub保持source规则。

- event9，mission0/38：typed且valid的building subject ID等于actor.home，不是arg0
- event9，mission2/5/9/10/23/24：building subject ID等于arg0
- event9，mission41/42/43：building subject ID等于arg1
- event9，mission21：先构造context并依次验证actor、force、arg1 building、arg3 building，再比较subject的type5 pointer是否等于arg1或arg3。第二分支重新typecast；没有另加subject.valid检查
- event10：所有predicate返回false，但源中事件分流前的actor检查、参数读取及context构造仍执行

mission24的kind1/2限制只适用于event14，不能挪到event9。mission12/22和wrapper15..20虽不会因9/10取消，仍保留已有前置读取。

wrapper15..21先验证actor和当前mission，再保存actor pointer并从arg0获取force pointer；额外参数通过`005BC560`重新检查context actor，失效返回0。20的arg1/3为person pointer，21的arg1/3为building pointer；获取canonical地址本身不读取目标字段，真正valid/read时才要求相应观察行。没有未恢复的外部hook被当作纯函数。

新成功handler观察严格绑定source、顺序index、captured mission、event、完整callStack与精确before。handler返回值由dispatcher忽略，但观察仍显式提供；修改active节点或后来person mission会影响后续live访问，而不改已复制节点。

## 6. 显式边界与原子性

event9的`004BA1D0`不是no-op：源中有部队遍历、条件表现与部队相关深层调用。本版不把未知部队字段塞进默认值；需要完整阶段before→after观察。该观察结束后才fresh读取observerPresent并在非空时调用observer.virtual1B4。event10跳过该深层尾，仍有fresh observer。

所有观察before/after须满足新frame、固定slot/data域、raw aliases、派生validity；missing/unused/stale/wrong-source/wrong-stack拒绝。未解决效果、势力灭亡、ruler/capture及工程递归预算触发时整次不提交。预算是工程guard，不是原作终止证明。未知RNG消费为null，不因首尾state相同而记0。

S1/S2都是完整固定指纹的MOD关联IDB。共同opcode不认证clean stock PC-PK1.1；PK采用仍为compatibility-reconstruction，Vanilla单独compatibility-assumption。完整迁移004A8270、此次未直接实现的cancel handlers/event9部队反应、force灭亡、ruler/capture、其他event IDs、全局RNG、真实存档及stock/Vanilla认证继续open。

## 7. 验证

    python scripts/check_base_ownership_source.py
    python scripts/check_base_ownership_profile.py
    npm run check
    for f in scripts/check_*.py; do python "$f"; done
    npm run demo
    npm run demo:lifecycle

20项source检查、23项独立oracle模型测试及完整102命令回归通过：TypeScript、85 Node tests、99 Python checkers、2 demos。双IDB完整fingerprint与483次raw-ID1区间检查通过（32,843 summed selected bytes，含重叠范围，不声称唯一字节覆盖）。独审另核366个predicate与1,262个ownership-prefix边界案例，发现并修复新事件context读取arg2..4被旧getter拒绝的问题，仅新增版本override，旧API未改。最终1,080 tracked文件冻结在全测前后无漂移，staged whitespace通过，无剩余独审阻断。验证结果文字在全测后单独复核；源、模型与测试字节不再改变。未执行EXE，未把本地回归称作远端CI；合并后的main另行验证。
