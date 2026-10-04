# P0-64 原生任务route、目标势力与递归return组合

更新：2026-10-04 UTC。基线main `28d0b0b8aa6e2c781b791886093b806e6e3d1ad3`（PR #21已合）。新增版本，不改变P0-63及更早API、frame、trace。

- [结构化来源](../sources/return-route-target-force.json) · [字节域](../sources/return-route-target-force/README.md)
- [事务API](../../scripts/return_route_target_force_profile.py) · [原生helper](../../scripts/return_route_primitives.py) · [扩展frame](../../scripts/return_route_frame.py)
- [来源检查](../../scripts/check_return_route_target_force_source.py) · [模型检查](../../scripts/check_return_route_target_force_profile.py)

## 1. 这次闭合什么

`project_return_route_target_force(state,command,observations,policy)`在原有共享recursive frame、native sort/capacity与一次revision提交内，直接执行`005BA320`、`00487EB0`及本域触达的canonical getter。正常非空role/return/event8/14继续在一个live frame内递归；不调用旧project，不拼接旧trace。

旧的whole-route和whole-target-force可变观察不再出现在新版本这些已闭合路径中。原因是固定source vtable和所选helper的完整body已证明这些路径没有未知gameplay callback，并非将未知作用改成默认pure query。显示、observer和S2技能查询等真正的外部作用仍必须逐调用提供source/callStack/full before/after/RNG绑定观察，或原子拒绝。

继承入口return、legion、governor、event、roster-sort、role-sort、capacity；新增route、at-home、target-force以独立测试具体helper。未把它们接入无战斗的TypeScript训练沙盒，也未宣称整场capture完成。

## 2. 005BA320读取当前任务、参数和目标君主home

此函数直接读取person的live mission+13C，没有入口person.valid gate。两源dispatch和所到达getter指令相同：

- mission9/10/23/24：`004897B0(person,0)`，即arg0
- mission12：`004897B0(person,1)`，即arg1
- mission15..22：arg0必须为signed0..46；解析force，直接读raw+04君主ID，不检查force.valid；解析并检查君主person.valid后读其live home+98
- mission37：直接读actor的live home+98
- 其他mission：返回0，不写输出

目的地仅检查signed0..16383，不检查目标建筑存在/valid，也不要求target输出指针存在。只有请求territory输出才进一步解析building并调用`0049E450`。完整`004897B0`接受索引0..5，但本route只触达0/1；新frame没有伪造第六任务字段。

成功时先写target输出，再做territory查找并写territory输出，最后返回1。API以`targetOutput/territoryOutput`明确两支是否存在，`targetWritten/territoryWritten`表示源是否真正store；未写值用None表示未观察的原caller值，不是把caller内存清空。新policy `routeDomain=canonical-unaliased-route-output-v1`限定两个互不重叠、也不与frame重叠的caller输出cell，以及未修改的source lookup bytes；任意输出指针别名仍不支持。

`004896C0`先保存numeric home0..86（否则-1）与actual location比较；不同则不调用route，相同再调用route(null,null)。`00489730`在返回后按源码重新读取home、检查building.valid及home subtype legion与person raw legion相等。route现已闭合，但前面的真实observer/S2 hook仍可改变任务、home和location；不能在事务开始时预计算at-home。

## 3. 00487EB0先设施类别，再领土，再canonical subtype

此函数同样没有入口building.valid gate。generic building与city/port/gate subtype是不同pointer：

1. `00487B30`按live kind0..63读取facility info的signed category+ B4。category1、category2，或kind不是24时的category3，返回building raw+0C。raw owner不加force范围/valid gate
2. 其余category4读取building virtual+3C的两个signed16坐标，通过`x*200+y`定位map dword，取`(raw>>5)&127`，再以`004839F0`读source的unsigned byte范围。解析city且city.valid后，读取city的canonical force；此路不检查generic building.kind/valid
3. 前述category4 city无效或其他类别，按generic building kind和canonical ID映射city0..41、gate42..51、port52..86；subtype有效时走其virtual+40，否则-1

city/port/gate virtual+40为`0047B2B0`：subtype raw legion→canonical legion→valid→legion virtual+40 raw force ID。它不继续要求force.valid。territorial city路径不会因generic building.kind被改成其他类别而错误拒绝。

新frame显式提供force rulerId、building rawOwnerForceId/positionX/positionY、facilityInfos category和mapCells packed dword。canonical force.valid严格等于rulerId落在0..1099；legion.valid严格等于forceId落在0..46。它们与person raw17C/status派生predicate一样是派生校验字段，不能由观察记录任意独立改写。旧frame/API保持原历史契约，新版本不自动填默认值或迁移。

## 4. source地图与两个不同的边界

`0049E450`先building.valid，再逐坐标检查0..199，失败返回-1；成功的`004839F0`采用MOVZX，所以读到255就返回255，不能改成-1。

`00487EB0`的category4没有这些坐标检查。模型只对实际线性地址设置明确的工程可读域0..39999：例如x=-1、y=200仍会读取index0；越出该分配域原子defer为`unsupported-native-map-read-domain`。这不是声称原作在这里返回-1，也不通过Python负索引访问另一端数据。域内缺少map slot则是输入证据不足，拒绝而非默认0。

两source的`0079C2B0`可读128-byte范围分别固定；若7-bit索引落入尾部，按实际byte读取，不捏造有效city。S1/S2中42..86区域不同，不能共用映射。表冻结是本版本明确source-memory前提；运行时重写该表、任意vtable/IAT修改、失败平台probe/allocator、损坏list不在已证域。

## 5. caller保存值、递归context和剩余边界

`004BF6F0`原有saved old status/home/legion/force、ruler/affiliation compare force和target pointer不变。显示、set-location observer及S2 capacity hook后的字段按原来时点live重读；target-force在到达时读取目标当前类别/owner/legion，不能拿之前捕获的actor force替换。后续role/event recursion拥有各自的actor/event/copied list和saved locals。

schema及所有观察的完整frame、固定domain、派生predicate在执行前检查。未知作用记录仍逐层精确绑定；多/少/错源/错scope/错frame记录、篡改trace或重复ID不同payload均拒绝。成功仅一次revision增加，重复提交不重做副作用，JSON replay重新执行全部路径。S2查询RNG仅按观察计数，不认证全局随机流。

完整force extinction、empty-corps redistribution、ruler ownership/capture、base销毁、其他event IDs、一般sort参数/任意vtable和原作递归终止仍开放，沿用明确atomic defer或已声明外部观察边界。`004891C0`的既有实际troop-membership观察与distance观察未被本组冒充闭合。资源预算仍是工程guard。

S1/S2均是固定IDB指纹的MOD关联来源；两源局部字节相同不等于clean stock PC-PK1.1证据。PK采用compatibility-reconstruction，Vanilla独立compatibility-assumption；独立原版、PS2/Wii、真实存档、完整调度与全局RNG继续开放。

## 6. 验证

```sh
python scripts/check_return_route_target_force_source.py
python scripts/check_return_route_target_force_profile.py
npm run check
for f in scripts/check_*.py; do python "$f"; done
npm run demo
npm run demo:lifecycle
```

18项source-only检查通过；完整双IDB指纹及独立raw-ID1重读681范围/65,834 selected range bytes通过（S1 338/S2 343；337同形对328同/9异，另7未配对宽度；新增14范围，重叠选段长度不去重）。30项模型测试通过：2,231个独立oracle接受场景（含96组evolving-frame）、53个原子输入错误场景与25个原子defer/conflict场景；覆盖完整mission/output分派、两源128地图byte、类别/validity边界、真实observer/S2 hook后的live读取、递归event8/14、精确read/store golden顺序、幂等与JSON重放。完整98命令回归零失败：TypeScript、85 Node tests、95 Python checkers与2 demos。自审补充early-route与out-of-range facility两类跳过读取的trace-only精度修正，随后最终98命令重新全过。17文件在冻结全测前后无漂移；独立审阅再次重跑18 source/30 model和S1/S2 observer改map后的fresh target-force例，核对冻结哈希、原始字节、golden序及git diff --check，无剩余阻断。发布前补本结论，并规范化两份新增asm的EOF空行及container hash/linecount，重新通过source与staged whitespace检查；原始机器字节、范围、模型代码及测试不变。合并后main仍须全测。
