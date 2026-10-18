# 来源事件三值查询：固定证据与保守未知

状态：仅静态代码与具体规则；未运行产品、示例、测试、build、typecheck、compile、schema validator、checker或diagnostic。不得把本文预期写成测试通过。

本模块只回答固定来源中某个已核片段与调用者显式原始事实的比较。不生成事件，不执行结果，不调用探索、评定、灾害、战斗或原生世界服务，不建立发生记录。旧corpus字节与 `executionEnabled:false` 不改。

## 1. 去重与固定来源

实现集成基线：DanielMax937/sanguozhi PR87 main，commit `021097bdb63ed882bb7b1e1d11f6bdeaf8af017b`，tree `077cb16ad83c8a3a32a6f60a26b3a00cee1b0a93`。三个查询API与七个类型由公共 `packages/engine/src/index.ts` 导出。

来源证据版本仍固定为PR85，commit `7cf050fdf57cd40641bf5f139b2c34c548aae820`，tree `c515fd47bdec5a1f8b9502da58130dad91372a09`。五个旧corpus在PR87树中仍为相同Git blob；原字节的SHA-256、predicate及source binding不改。集成main与来源版本分别记录，不把新集成版本充作新原作证据。

现有通用资料README明确没有condition evaluator、scheduler、effect executor或engine dependency。既有rules.ts提供训练规则/evidence引用，不接typed事件facts和bindings。固定全树及公共index未发现同语义接口。因此新增只读query层，没有重写旧转录，也不把既有资料浏览数量计作新实现条件数。

三族及观测身份保持独立：

- scenario-events：105观测、66资料ID、41差异
- generic-events：33观测、31资料ID、10问题；Wiki31标题里21项仅标题
- ps2-scenario-events：64观测、741来源节点、24限制；PS2不等于PC，颜色丢失不证明PK

源文件的完整blob、SHA-256、字节、commit/tree和collection在固定profile及来源JSON中。查询须指定family/path/blob/SHA-256/observationId。资料ID不是native事件ID，来源字符串不是引擎ID，同名不合并。

## 2. 为什么收窄管辂灾害条件

`data/generic-events/atwiki-88.json` blob `527988afe81227bf07a08b591919c16e35308a16`，SHA-256 `cd76844fe0b6f8417acea0f84fbeaf3f94d5b2edfc51b645ce07be026e330d28`。

管辂观测 `generic.atwiki88.12` 的 `/observations/11/conditions/2`，来源渲染行1210–1211，完整转录为：

> 没有蝗灾或疫病；执行探索的城市治安至少90。

分号后的城市scope明确修饰治安；分号前无明确城市scope。不能把于吉的城市限定自动套过来。固定同基线 `data/generic-events/README.md` blob `fe9f135d04baf46f0d9da7839f4ecbc35ad34909`，SHA-256 `fa384f796eac4bad72f245bb25fa888f9d5192eebcd8d3211bc0b3caa1ddfe39`，“Key retained uncertainties”的Guan Lu项明确警告不能静默赋予于吉城市scope。

因此研究合同最初“管辂无城市灾害”的建议被收窄：只比较search-city.security≥90；未定位灾害空间范围的片段为 `disaster-scope-unresolved`。亲爱/嫌恶AND/OR、人才探索及管辂存在、发生概率、结果均未解析。不得用caller关系真值填缺口。

## 3. 于吉的唯一完整局部条件组

同一文件 `generic.atwiki88.15`，`/observations/14/conditions/1`，来源行1227–1229：

> 探索城市没有疫病或蝗灾，治安至少90，资金至少2001。

注册四个同城原子：plague eq false、locust eq false、security gte90、gold gte2001。该句的局部 `all` 有明确同一城市和并列条件，不因此证明整条观测的逻辑树。

必须绑定search-city、searching-person和yu-ji，后两者分别指不同person事实，且各自cityId明确等于该城。绑定是本次查询的显式身份假设；不做姓名匹配，不产生人物移动或native归属关系。缺人/缺城/未绑定/城市不一致/角色重合均unknown。security/gold/灾害值不由绑定补出。

`/observations/14/conditions/0` 的“执行人才探索；于吉在执行探索的城市”仍完整可读unknown。即使绑定一致，也不能宣布已执行O13探索或确定发生了事件。

## 4. 严格原子、集合与三值

固定registry是实现资源，调用者只能指定profile ID，不能提交expression、conditionTruth、eligible或已解析结果。

- eq/ne：同primitive类型的严格比较；数字1不等于布尔true或字符串"1"
- lt/lte/gt/gte：只比较安全整数；没有字符串顺序、官职排名或日期补精度
- in/not-in：只对固定、非空、同类型literal集合求membership；本次没有来源条目使用集合算子
- all：任一not-met则not-met；全部met才met；否则unknown
- any：任一met则met；全部not-met才not-met；否则unknown
- 空all/any为unknown；heading-only或空conditions也为unknown

本次只有eq/gte及一个局部all被来源registry使用。内部实现其他算子不等于增加了已核来源。没有已核any组；不能借旧描述树里写了all/any，就承认其执行语义。所有日期、延迟、if、前置链、未知关系和PS2缩进仍unknown，不做自然语言parser。

每个comparison保留typed actual、operator、全部literal、factJSONPointers、bindingJSONPointers、semanticScope、子比较和reason。每条clause附带只描述结构、不授予predicate资格的nodeShape；保留完整originalClause、可用原句、sourceURL、完整证据身份和sourceJSONPointer；来源没有精确行号时留空，不伪造。

历史描述节点的完整子条款路径覆盖all/any.items、if.condition/consequence、branch.condition/orderedResults、choice.options及option.orderedResults。fact.value中的baselineConditions/possibleGroupings描述包装与子predicate分别有pointer和unknown原因。branch内条件使用conditions角色，不误标效果；来源all/any不因被遍历而获得逻辑资格。未知node shape显式标source-node-shape-unrecognized，仍仅浏览结构。effect.values、quantities、delay等普通payload完整保留在父节点，不伪装为逻辑条款。

## 5. comparison、clause与整体资格不能混淆

`comparisonStatus`仅比较已核片段，所以可为met或not-met；这不是来源版本已经适用。完整clause还需要覆盖完整、来源及target版本一致，否则status unknown。Wiki edition/platform/patch未明确；输入PK/PC/1.1不会补全它。

本registry未证明任何完整观测的条件分组；当前所有 `documentedConditionsStatus` 保持unknown。原子明确不满足依然显示not-met，避免把未知与假混成一类。全局同时保留conditionCompleteness、resultCompleteness、versionResolution、原始onceOnly及固定disabled-source-corpus。

任何met都不意味着“事件会发生”。`executionEnabled:false`；没有发生概率抽样、执行资格、真实资源操作或顺序恢复。onceOnly.status=not-stated与flagId=null只给unknown-repeatability，不等于可重复，更不新增已发生flag。

## 6. 结果只读与明确排除

于吉结果原条款全部保留，包括交1000金/技巧点+50、魅力经验数量和选项范围未决、不交金兵数上升但量未知，以及斩杀分支的原述。全部标unknown、effects-never-executed；不只提取安全数字就冒称执行完整事件。灾害援助/义勇兵/嘆愿空标题不能补数量。

来源文字中的死亡、归属、捕获等只是不可执行的原文，不连接任何相关handler。明确排除P078及依赖、native ownership/capture/灭亡/继承/mission-return-finalizers、评定/灾害/战斗实现和跨服务世界state。

## 7. 输入和输出政策

封闭non-Proxy DTO；未知字段、getter/setter、稀疏数组、循环、非安全数、负零、重复实体ID/绑定symbol拒绝；缺少可选原始事实或未绑定实体则unknown，不能误当畸形输入或false。详见engine文档和输入schema。

输入预算为1MiB/16384节点/深24；城市和人物各最多64。完整成功响应另设4MiB canonical UTF-8、65536值节点、深48（root=0）预算，包含原记录、父子条款、证据和reason；三个API成功结果均先预算再返回。超限返回固定小型output-budget failure。其他failure的pointer大于1024 UTF-8 bytes时置null并显式pointerStatus，不截断回显；固定error code加受限pointer的failure即使JSON转义也小于8KiB，避免错误报告再次放大。get/list成功返回分别为{ok:true,profile}和{ok:true,observations}；三个接口共享failure形状，见response schema。以上预算代码未运行。源数据为固定受信代码资源，模块复制成私有只读数据，调用者不能替换predicate registry。固定文件hash是源码身份记录，不宣称运行时重新验证安装文件字节；已注册完整clause还会逐内容比对。

没有序列化接口。保存调用输入或导出查询结果只能是可重算的查询文档，不能叫save、replay、receipt历史或原生存档。本文和example的预期全未运行。

## 8. 原证据债保留

原43主题/45快照不变；三corpus全部目录、未决差异、native事件ID、完整条件/结果、版本适用、一次性flag、概率和原作等价继续未决。此交付仅减少有限来源查询工程缺口，不关闭O14；跨服务时钟/账本/真实世界仍属O15。
