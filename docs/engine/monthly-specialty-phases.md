# 月特产单兵种私有阶段

本页描述固定单城财政内部的兼容复用边界。具体游戏规则见[财政规则§6](../rules/city-finance-lifecycle.md#6-月特产四类兵装)，公共调用和保存形状见[财政API](city-finance-lifecycle.md)。该阶段提取原有单兵种处理，不新增动态forge月产接合、公开命令、state/schema或政策版本。

此处交付源码与静态合同说明。没有运行测试、typecheck、编译、build、产品入口、validator、checker、示例、场景序列或产品测量，不作运行验收通过主张。原历史失败及证据边界保持。

## 1. 三份私有源码与依赖

| 文件 | 职责 |
|---|---|
| `packages/engine/src/internal/monthly-specialty-types.ts` | 闭合输入、设施/太守事实投影、单库存target、分支收据与失败union |
| `packages/engine/src/internal/monthly-specialty-leaves.ts` | 派生30槽核输入、校验原数量请求、计算原饱和credit行；不写target |
| `packages/engine/src/internal/monthly-specialty-phases.ts` | 单兵种早返、直接调用原核、顺序检查并仅写当前库存quantity |

这些export只用于engine内部相对路径引用，不加入public index、package exports、schema或服务registry。阶段直接调用既有`calculateMonthlySpecialtyProduction`，不接受替代kernel、policy、writer、错误回调或其他服务注入。leaf只读引用既有`city-finance-policies-v1.json`中的credit.id，其值仍为saturating-positive-credit-v1；没有新政策入口。

阶段不导入财政root，不读取整张state，不负责日期/历史/工资/收入/RNG/事件，不调用公开AdvanceFinanceTurn来模拟接合。旧月特产核、核manifest和算术规则、财政policy/catalog/schema、公共index及其他owner均不变。

## 2. owner前置条件与精确输入

`applyMonthlySpecialtyEquipmentPhase(input)`只接受以下六字段：

| 字段 | 类型及owner责任 |
|---|---|
| equipmentType | 1、2、3或4；旧owner固定顺序仍为1→2→3→4 |
| monthStart | boolean；旧owner由nextDate(before.date).day===1取得，阶段不推日期 |
| facilities | readonly数组，每项null或只读kind/complete投影；恰30个稠密、显式槽由owner原parser保证 |
| governor | null或只读politics投影；旧owner从按ID排序的before.officers及before.city.governorOfficerId解析 |
| specialtyEquipmentTypes | readonly的1..4设备数组，资格和无重复约束来自owner |
| stock | 当前owner分离候选的单兵种库存；quantity可变，capacity只读 |

设施kind保留完整十种：market、farm、mint、granary、large-market、fish-market、black-market、military-farm、forge、stable。旧Facility的id、level、position仍由owner验证和保存，只是不授予此阶段读取权限。旧设施来源仍为genesis场景的s.facilities，没有给Snapshot增加facilities。

太守政治仍在原owner限制为0..100；该人必须是完整同城同势力、有目录官薪名单中的明确ID。阶段不重新查身份，不接受更宽的政治域，不用施工XP或调用者最终产量代替政治。库存仍满足0≤quantity≤capacity≤1,000,000，所有值仍受原安全整数及负零限制。

新私有类型没有any/unknown、开放Record/index signature、公共State/history或callback。设施数组保持与旧Scenario结构兼容；其类型本身不声称验证了长度。owner的既有detach/场景parser继续排除稀疏槽、accessor、隐藏字段及非数据对象，不增加另一parser或失败优先级。

## 3. 三个纯leaf

### deriveMonthlySpecialtyInput(equipmentType, facts)

facts包含只读facilities、非空governor和specialtyEquipmentTypes；阶段在确认月初且有太守之后才构造它。leaf先检查设备是否属于特产集合。

- 非特产：只建立profile、arithmeticProfile、equipmentType、specialtyEaxU32四个common字段，最后一项为0；不读设施行或politics，不附slots/politics
- 特产：specialtyEaxU32为1；设备1..3匹配forge，设备4匹配stable
- null槽产生`{validityEaxU32:0}`且无completion。非空槽产生validity1及correspondingCompletedEaxU32，只有kind匹配且complete时为1，否则为0
- 全部槽通过显式tuple按0、1、2、3、4、5、6、7、8、9、10、11、12、13、14、15、16、17、18、19、20、21、22、23、24、25、26、27、28、29各调用一次slot映射。没有补null、截短、重排或双重断言
- tuple完成后用原谓词`f !== null && f.kind === matchingKind && f.complete`过滤计数。完整30槽交原核独立计数，不以预计算count代替输入
- count0时不访问politics且不附字段；count>0时附同一governor.politics原值。每座完成设施权重1，不按level、行动、预留或普通Produce条件加权

显式索引上的非空断言仅利用owner已证明的稠密30槽前置条件，不会转换运行时null，也不是新验证器。每个槽映射都新建观测对象，不将设施对象引用放进返回input。

### readMonthlySpecialtyQuantityRequest(quantityRequest)

只接收原核production分支的完整quantityRequest。依次检查quantitySigned32是安全整数、≥0、不是负零，然后要求它等于quantityU32且≤1500。任一步失败均返回unsupported-kernel-return，不floor、不clamp、不把失败改成0。成功只交回requested整数。

这些检查仅针对入账请求，不限制整张核receipt为整数。factorValue、scaledValue等合法有限binary32派生小数完整保留；原核的converter假设及1500请求cap未改。

### creditMonthlySpecialtyEquipment(equipmentType, before, capacity, requested)

此leaf不写库存，再次按原credit入口检查requested为安全整数、非负且非负零。然后accepted=min(requested,capacity-before)，要求accepted是安全整数且≥0，否则返回invalid-resource-boundary。

成功返回一张完整write，键序与旧writer一致：resource=`equipment-${equipmentType}`、reason=specialty、before、requested、accepted、actualDelta=accepted、after=before+accepted、cap=capacity、discarded=requested-accepted、writerPolicyId=原credit.id。

核请求cap1500和库存capacity相互独立。满仓及capacity0不绕过核；requested仍完整记录，accepted及actualDelta为0，discarded=requested，after不变。requested只由阶段从原核取得，是内部数据流，不是新增公共产量答案输入。

## 4. 单兵种分支、完整收据与写入

每次成功返回`{ok:true,receipt}`，receipt仍只有原七字段，键序为equipmentType、eligibility、count、arithmeticProfile、kernelQuantityRequest、kernel、write。arithmeticProfile始终为comment-f32-rne-trunc-v1。

| 条件及优先级 | eligibility | count | kernelQuantityRequest / write | 核行为 |
|---|---|---|---|---|
| 非月初，优先于无太守 | not-due | null | null / null | 不调用，reason=not-month-start |
| 月初且governor=null | no-governor | null | null / null | 不调用，reason=no-governor |
| 月初有太守、非特产 | not-specialty | null | null / null | 原核调用一次，保留not-specialty结果 |
| 月初有太守、特产且完成匹配count0 | no-completed-facilities | 0 | null / null | 原核调用一次，无政治字段 |
| 月初有太守、特产且count>0 | production | 原核completedFacilityCount | 原requested / 完整write | 原核调用一次，检查后饱和写入 |

前两个早返不读取库存数量或容量；无太守也不读取设施。called包装保持status、api、profile、adapterObservationKind、input、result六字段，api为calculateMonthlySpecialtyProduction，profile为monthly-specialty-production-observed-v1，adapterObservationKind为derived-adapter-observations。

每个核path分别构造相应私有union分支，保持path/count/quantity/write关联。包装保存整个原kernelInput和整个原result，不构造简化版返回，不更改字段或合法小数。原result完整包括：

- supported、profile、arithmeticProfile、equipmentType、observations、capturedReturns、evidence、path、completedFacilityCount、arithmetic、quantityRequest
- observations的common字段、条件性的全部30槽及governorPoliticsEaxU32
- capturedReturns每项kind、callAddress、target、slotIndex、eaxU32、consumedWidthBits、consumedValue；顺序仍为specialty→每槽validity/条件completion→条件politics
- arithmetic的factorTier、factorBitsU32、factorValue、politicsAL、politicsTerm、scaledValue、convertedSigned32、capApplied
- quantityRequest的pushAddress、continuationAddress、quantityU32、quantitySigned32

production顺序为：确认核supported→数量leaf成功→读取当前stock.quantity/capacity→credit leaf成功→唯一赋值stock.quantity=write.after→返回receipt。核早返不调用credit。receipt不携带stock、facility或officer可变别名；内部ok包装不进入receipt/state/save，也不改变owner递归freeze时点。

## 5. owner接回、失败与整旬事务

旧owner仍在收入、季降、足薪完成之后的原for循环按1→4调用阶段。收到失败即调用原fail(reason)；成功时把receipt结构赋给旧SpecialtyReceipt，把同一item.write先追加到全局writes，再追加当前specialty，之后才进入下一设备。未修改旧公共KernelCall的input/result:unknown，私有精确类型只向旧类型结构赋值。

| 私有失败 | 原owner效果 |
|---|---|
| 原核supported=false | specialty-kernel:invalid-input、specialty-kernel:unexpected-field、specialty-kernel:unsupported-profile或specialty-kernel:stage-mismatch |
| 请求安全整数/非负/负零/signed与U32/1500检查失败 | unsupported-kernel-return |
| accepted非安全整数或负数 | invalid-resource-boundary |

这些reason通过闭合`{ok:false,reason}`union返回，接回处仍由原root的Invalid类产生错误。没有新的Error类、name/string识别或catch-all。非预期异常穿透到原公共failure(e)，仍为invalid-data；通常index/proposal为null，历史重建仍附原条目index，工资不足仍保留自己的proposal。

较早的结构、horizon、duplicate/conflict、收入、RNG和工资首错不移动。工资不足时尚未进入设备循环；循环内前一设备失败优先于后一设备。该设备检查失败不写本设备，较后设备失败则整张detached candidate由原owner丢弃，包括已写的先前设备、收入、工资、治安、RNG和clock，不部分提交。

owner在构造输入时取得stock对象引用，数量和容量仍在核与数量检查之后读取。在原无accessor的数据合同内，这不改变业务读取副作用；任意有副作用Proxy仍不属于支持域。阶段不接收回调来模拟对象读取时点。

## 6. API、保存与全输出预算的静态对应

以下是对源码路径的对应说明，不是执行结果或新增通过数字。

| 保持项 | 静态依据 |
|---|---|
| 公共API及支持域 | root仅替换月特产imports和原单设备循环体；旧public类型、unknown边界、函数签名、导出、parser与注册常量原样保留 |
| 单步snapshot/receipt | 五条路径逐项对应上表；核input/result、writer字段、顺序和全部其他结算步骤不变，内部wrapper不进入输出 |
| 初态及接受历史 | 初态生成不变；按acceptedCommands原序逐条重建，每次新ID单步结构保持；完成重建后，append判定重复则直接返回旧receipt，不再进入resolve或追加结算 |
| save/load | 原canonical JSON、重复解码键拒绝、genesis/receipt/snapshot逐字段比较和原schema/profile/tag保留，无迁移格式 |
| preview/execute | 原共用commandResult与完整execute输出预算保留；内部target仍为分离候选，caller-owned输入不变 |
| trace | 原expectedOutcome独立核对、失败candidate不提交、index包装及最终outcomes形状保留 |
| 所有预算位置 | reconstruct初态、每条完整CommandResult再比较receipt、最终state；create、commandResult完整结果、save；trace初态、每步完整结果及最终ReplayResult全部保留 |
| 原限额 | 64MiB canonical UTF-8、4,000,000节点、深度48、数组1080及对象128键等不变；没有以compact核收据或截断历史换预算 |

持久及对外返回结构没有新增节点，完整kernel及合法派生小数均在原输出内，新增ok/failure只作临时内部控制流。初态与逐步相同的静态关系支撑原history、duplicate、保存与trace合同；没有运行任何这些路径来认证该关系。

未来动态owner若新增设施状态、历史、完成尾或其他输出，必须另立完整输出预算与保存合同，不能沿用此旧结构保持结论。本抽取不替其他owner完成事务、月界或政治来源设计。

## 7. 证据等级与继续排除项

完整原evidence直接随原核result保留，其八个描述字段为level、controlFlow、arithmetic、profile、arithmeticProfile、source、projectTarget、sourceEditionClaim。下列十四字段仍为原false：exactSourceVersionVerified、runtimeSourceRehashPerformed、nativeExecutableExecuted、nativeHelpersReconstructed、converterBodyKnown、memoryConstantBytesRecovered、stockOriginalVerified、vanillaVerified、abiVerified、fullCallerExecuted、stateWriterIntegrated、ownerForceIntegrated、schedulerIntegrated、rngIntegrated。

外层阶段实际写入独立候选库存，不会把原核evidence.stateWriterIntegrated改为true；它描述的是原source/native证据边界。0049CFB0、未知converter、memory常量字节、stock/ABI/native恢复事项不因私有搬移获得认证。原43主题、45快照及E/X边界不变；P078及全部依赖仍排除。
