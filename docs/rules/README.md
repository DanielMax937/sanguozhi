## 2026-10-27：现代参考有界单回合组合事务（静态）

新增[受检出牌→攻击效果→愤怒衔接／终局分类](debate-round-transaction-v1.md)，复用PR125、PR127、PR126、PR128现有公开核，从明确非教程generic两队正HP、满ready-hand、inactive combo检查点，到下轮ready-for-play或closing-pending。外层保存手牌/额度/牌堆游标/strength/combo；Attack输出HP/stress为权威，普通attacker和playedCard不能用combo替换；保留各阶段完整收据，任一下游失败不提交半轮状态。终局不补牌、不递减timer、不消费未用抽样，牌堆不足仍整笔拒绝而非再生成。

仅静态文本阅读、人工纸面推导及字节身份核对；未运行测试、编译、typecheck、build、validator、checker、候选、来源、场景或replay。代码存在及静态审阅不证明运行正确。现代C#参考及显式工程组合不是原生PK／Vanilla等价，43证据主题／45历史快照不减。P078及全部依赖、Closing奖励受伤世界写入均排除。 这是本地候选的静态实现覆盖，不是完整会话或全部独立缺口完成；下方历史记录保留各批交付时边界。

## 2026-10-26：现代参考有界终局分类（静态）

新增[CanCritical → 显式选择 → winType](debate-terminal-classification-v1.md)，从已解析终局winner和两队当前HP投影判断败者−100及功能开关，显式映射选择PushOn0／HaveMercy1到winType1／2；非会心仅接受null并保留明确初始Normal0。符合门槛却未给选择整笔拒绝，不默认AI选择；不重新判胜、重算HP或自动连接旧核。输出止于closing-pending，不执行Closing、奖励、受伤或世界写入。既有PR126／PR127及九个旧会话不改；下方历史段落保留各批当时边界，不代表本新增仍缺实现。

仅静态文本阅读、人工纸面推导和字节核对；未运行测试、编译、typecheck、build、validator、checker、候选、来源、场景或 replay。静态审阅不证明运行正确或原生 PK／Vanilla 等价。43证据主题／45历史快照不减；P078及全部依赖保持排除。 12成功／25拒绝项仅纸面设计，不是运行通过。独立缺口未全部清空。

## 2026-10-25：现代参考有界普通攻击、效果与判胜（静态）

本批新增[Attack → Effect → CalcWinner](debate-attack-effect-v1.md)及[API合同](../engine/debate-attack-effect-v1.md)，从已出牌且攻击方已解析的显式检查点出发，复用原 `evaluateDebateHpDamage`，写入 HP／压力并在全部效果之后判胜。非终局返回 `ready-for-anger`，终局停在 `terminal-pending-classification`，不执行愤怒、崩坏、回合衔接或 Critical／Closing。

PR125 的 firstTeam、attacker、最终 playedCard、personality、angerTimer 与 currentTopic 可作显式投影来源；必须另提供两队正 HP、压力、已解析攻击力及本次精确0或1项 HP jitter。PR125 话题是 signed32，本 API 仅接受0..2，越界整笔拒绝，不钳制／取模，也不声称任意 PR125 输出均可接入。attacker 是已解析事实，不重新选择或认证。手牌、容量、额度、18牌组、游标、strength、combo 与崩坏数据仍由外层保留，不在本 API 中伪造默认值；进入 PR126 还须明确补齐其完整输入与收窄条件，不是自动整链事务。

平局双方压力+15且不执行 Effect；无视使对手压力+30且抑制对手效果；诡辩只对对方普通牌调用 HP 核，用诡辩方属性计算后反射到对手。大喝及默认分支恰调用一次 HP 核，包括镇静／激昂的零级伤害。先攻击再按攻击方、对手顺序处理效果，致死也不提前跳过效果；镇静反射仍以对手当前压力定量，激昂按反射目标写入。压力始终钳制0..100，兴奋 timer 不抑制压力写入；HP 钳制−100..1000。完整嵌套 HP 收据、逐项写入及两阶段快照可人工追踪。所有载荷先完整分离和解析，缺少／多余随机项均拒绝，失败无部分状态。

新增规则、API、固定来源映射与人工纸面场景逐一对应。现代固定 C# 不是原生 PK／Vanilla 等价证明；43证据主题／45历史快照不减。P078及全部依赖、九个旧会话、既有公开核／政策／存档均不改。完整阶段机／会话、教程、牌组再生成、人物／书籍／hook、全场随机、永久牌身份、终局奖励和 campaign 仍未接入。仅静态文本阅读、手工推导及字节核对；未运行测试、编译、typecheck、build、validator、checker、候选、来源、场景或 replay。下方历史记录保留当时边界。

## 2026-10-24：现代参考有界愤怒结算至条件回合衔接（静态）

[PR125](https://github.com/DanielMax937/sanguozhi/pull/125)已交付受检双队出牌至伤害入口。本批补充[有界愤怒后衔接事务](debate-anger-transition-v1.md)与[API合同](../engine/debate-anger-transition-v1.md)，复用既有双次愤怒核和回合衔接核，闭合给定愤怒前检查点至非终局下一次出牌前或终局待分类的小流程，不复制反制、连打、计时、话题和补牌算法。它不是从PR125检查点自动执行Attack，更不是全回合或完整会话。

严格先调用一次既有AngerPhase：第一轮反制允许、完整待连击、胜负；若未终局，再第二轮禁止激昂反射、完整待连击、崩坏、胜负。路由采用该实际返回胜负与outcome，不沿用初始winner−1。首轮终局跳过第二轮和崩坏，第二轮终局保留刚更新的崩坏；两者均不调用TurnEnd／TurnStart、不递减计时、不清已出牌或崩坏、不恢复再考、不填牌，只返回待分类检查点。所有未用衔接抽样须为空，不能静默丢弃。

仅非终局将愤怒实际修改后的手牌、计时和崩坏标志送入原回合衔接，保留外层原普通attacker、原playedCard、话题、额度及当前18牌元数据。combo.attacker、愤怒入场者或连打末牌均不能替代普通攻击方与已出牌。衔接后覆盖手牌、计时、已出牌、额度、崩坏标志和游标，保留愤怒后的HP、压力、武力、崩坏等级和combo；不得把旧崩坏标志再覆盖回TurnStart已清除的状态。

补牌需求取决于愤怒真实移牌后的空槽：原满手不保证游标18足够；无实际空槽时游标18仍可成功，恰用第18项成功，确需下一项整笔拒绝，不再生成。新的冷静4在回合结束减为3才恢复额度，莽撞或胆小1先减为0；刚胆按补牌最终普通牌数退怒。原反制／连打移牌会清全部尾槽；未移牌时补牌仍保留非活动尾槽。双队和所有组件的失败均无部分状态或收据返回。

工程准入明确收窄：初始HP正数、初始winner−1／inactive combo、genericOnly、非教程、七槽容量4..7、槽0必须0、其余活动槽不得0、18张显式牌堆与0..18游标。初始允许空槽且不要求排序；这些是本组合安全检查点，不是固定源额外规则或任意旧核结果可接入证明。所有载荷安全分离与语法检查先于领域计算；保留两个完整嵌套成功结果及局部索引，外层另记录最多八次连打加一次话题加双队修补的保守十一项顺序上界，不宣称这个宽松上界在更窄槽0准入域一定可达。

九个旧会话、既有公开核／政策／存档均不改。普通Attack／Effect、完整阶段机、教程、牌组再生成、CanCritical／Critical／Closing及终局奖励、人物／书籍／hook、全场随机／永久牌身份和campaign未接入；P078及全部依赖排除。43证据主题／45历史快照不减，固定现代C#不是原生PK／Vanilla等价证明。仅静态文本、独立审阅、人工纸面推导和字节核对，未运行测试、编译、typecheck、build、validator、checker、候选、来源、场景或replay。下方历史段落保留其当时边界。

## 2026-10-24：现代参考受检双队出牌至伤害入口（静态）

[PR124](https://github.com/DanielMax937/sanguozhi/pull/124)已交付有界非终局回合衔接。本批补充[受检双队出牌事务](debate-checked-play-v1.md)与[API合同](../engine/debate-checked-play-v1.md)，复用既有出牌可用性、完整当前牌堆再考动作和攻击方判定三个公开核，闭合给定选择计划到双方最终已出牌及DamagePhaseBegin攻击方计算的小流程。不另拆一个移牌查询，也不把旧普通回合解算器错误当作兴奋态伤害适配器。

先手一方必须完成选择／移牌／必要再考／清除再考已出牌／重新选择，之后才轮到对手；两方最终非再考牌提交后，复用CalcAttacker参考核，不执行Attack。选牌下标针对当时物理手牌，再考后的下标不是旧牌位置或永久token。移牌先记已出牌，再把全部七物理槽清空并按原顺序压紧活动区幸存牌；非活动尾槽也被清除。该操作不能误套再考或TurnStart的尾槽保留规则。

每次选择调用可用性核，是本版本明确的受检选择工程准入；固定源PlayPhase本身只检查下标和非空，并没有直接调用IsCardAvailable。每队计划包含最终牌，或一次再考加最终牌；最多一次受检再考来自额度检查与再考末尾写false，不是原始阶段循环强制只迭代两次。完整再考核仍保留原true或false额度都可直接调用的合同，本组合没有改写它。

初始七槽中保留槽0必须为0、活动可出牌槽须满1..14、playedCard必须为−1；不要求初始数值排序。容量4..7、当前牌堆18项、游标0..18、性格与计时、额度由调用者给定。winner−1和非教程标记是工程路线限制，不认证HP、完整开局、前序合法性或任意来源可达状态。现有回合开始／回合衔接输出可提供相容检查点，但不自动调用、迁移或证明任意其他核输出可直接接入。

全部计划和抽样先安全解析，至多4次选择、2次完整再考、4次可用性查询、1次最终攻击方查询。每次再考内按必要整数修补→冷静布尔结果记录，外层按完整先手计划→对手计划串联，不改嵌套局部索引、完整收据与覆盖来源。后半队失败不提交前半队已移牌、额度、牌堆游标或部分收据；当前18牌实际不足仍整笔拒绝，不执行再生成。

九个旧会话及既有核、政策、存档保持不变。完整PlayPhase阶段机、AI／UI选择、无效选择等待与重试循环、中间step持久化、实际伤害与HP／压力、愤怒结算、TurnEnd、教程、终局、再生成、全场随机／牌身份与campaign均不接入。P078及全部依赖排除；43证据主题／45历史快照不减，现代固定翻译参考不是原生PK／Vanilla等价证明。

仅静态文本、独立审阅、人工纸面推导与字节身份核对，未运行测试、编译、typecheck、build、validator、checker、候选、来源、场景或replay。下方历史段落保留原交付时的边界。

## 2026-10-22：现代参考有界非终局跨回合事务（静态）

[PR123](https://github.com/DanielMax937/sanguozhi/pull/123)已交付当前牌堆内再考动作。本批补充[非终局非教程TurnEnd→TurnStart事务](debate-round-transition-v1.md)及[API合同](../engine/debate-round-transition-v1.md)，把回合结束数据规则与既有TurnStart公开核组合到下一次出牌前检查点，不再把计时递减、先手或话题更新单独拆成查询微批，也不复制补牌、额度恢复和刚胆计数算法。

严格先完成双方正计时器递减，再用原普通attacker更新先手／普通牌话题，必要时消费一次诡辩bound3话题抽样，最后整体调用原TurnStart。attacker与combo.attacker不是同一来源字段，不能拿后者代替，也不在计时递减后重算攻击方。attacker=−1跳过全部先手／话题／诡辩处理，但双方计时及下一回合开始仍进行。双方都满足诡辩条件也只消费一次话题抽样；同话题结果仍记录已消费。原playedCard保留到话题处理完成，再由TurnStart清除。

冷静timer1→0后不得仅因冷静恢复额度，timer2→1则仍可恢复；crumbled标志独立恢复。TurnStart按整个队0再整个队1执行，保留原当前18牌与物理槽准入、补牌修补、最终手牌刚胆扫描和崩坏清除。全局显式抽样顺序是回合结束话题→队0修补→队1修补，最多三项；原嵌套局部索引及完整收据不改写。任一步失败不返回已递减计时、已更新先手／话题、第一队半补牌或部分收据。

winner=−1只是本版本非终局路由检查点，不是来源TurnEnd自身检查胜负，也不证明先前已执行AngerPhase。两队仍须满足原TurnStart的七物理槽、活动容量4..7、计时0..4和各自完整18牌域；活动可出牌槽0仍拒绝。PR120返回的合成手牌域更宽，且缺普通attacker／原playedCard／话题／额度／牌堆等状态，不能声称任意PR120结果直接接入。人物性格及前序合法性均由调用者给定，保留明确工程域与来源规则区别。

九个旧会话、TurnStart及其补牌依赖核、政策和存档均不修改。当前牌堆实际耗尽仍整笔拒绝，不执行再生成；教程、终局／追击留情／Closing、完整出牌／攻击／愤怒会话、全局随机与永久牌身份、人物／书籍／非恒等hook及campaign仍未接入。P078及全部依赖排除；43证据主题／45历史快照保持。这里只闭合给定非终局当前牌堆检查点至下一次出牌前的数据事务，不等于完整回合模拟或原生PK／Vanilla等价。

仅静态文本、独立审阅、人工纸面推导与文件字节身份核对；未运行测试、编译、typecheck、build、validator、候选、来源、场景或replay。下方历史段落保留各原交付时点边界。

## 2026-10-22：现代参考有界当前牌堆再考动作事务（静态）

[PR122](https://github.com/DanielMax937/sanguozhi/pull/122)已交付有界非教程双队TurnStart。本批补充[有界当前牌堆再考动作事务](debate-rethink-action-v1.md)与[API合同](../engine/debate-rethink-action-v1.md)，直接组合既有补牌核和冷静加成核，再按来源Rethink包装末尾消耗额度，不复制第二套填牌／修补／冷静算法，也不把额度赋值另拆成未来微批。

只处理已选择再考后的单人显式检查点：先清空活动前缀，补牌核恢复0槽、填入所有活动可出牌槽并按需修补／排序，冷静核处理正计时冷静的布尔返回值和话题大牌覆盖／第二次排序，全部成功后canRethink写false。原playedCard=0作为工程准入检查点且成功后仍为0，后续PlayPhase调用方的ResetPlayedCard不在本事务。原额度true或false均可进入，不添加原Rethink方法没有的额度true资格判断，也不认证此选择合法。

七物理槽原值均允许−1..14，包括活动区0，因为全活动区先清空；不机械照搬TurnStart保留旧牌时的活动0拒绝。活动容量4..7，每次无条件需要容量减1张新牌，即使原手牌已经满；非活动尾槽原值保留。当前18牌堆游标恰好用到18可成功，实际需要下一张则整个事务拒绝，不回绕或执行牌组再生成。全新补牌必有新增槽，所以成功时至少一张普通牌，满足既有冷静核的输入合同。

先发生必要的话题修补整数抽样，再发生正计时冷静必要的RandBool(40)布尔结果；无效话题仍消费该布尔结果，不伪造bound100数值映射。两套嵌套审计保持原局部索引，外层另记有类型的事件顺序。最终牌来源经第二次排序映射回补牌原槽及牌堆索引，保留话题修补和冷静覆盖两层记录；同牌覆盖仍记录执行。等牌身份映射是工程审计，不是原生Array.Sort稳定性证明。

“完整”仅指准入域内该再考数据动作事务，不指整个PlayPhase、UI、会话或原生可达性。任一组件失败不返回清空后的手牌、部分游标、已消费额度或半收据。旧九会话及各既有核、政策、存档不改；选择／可用性、PlayCard移除、后续playedCard重置、教程流程、再生成、TurnStart额度恢复、TurnEnd、全回合随机／身份预算、人物／书籍／hook、开场／追击／留情与campaign均不接入。P078及全部依赖排除；43证据主题／45历史快照保持，现代参考不是原生PK／Vanilla等价证明。

仅静态文本、独立审阅、人工纸面推导与字节身份核对；未运行测试、编译、typecheck、build、validator、候选、来源、场景或replay。下方历史段落保留各原交付边界。

## 2026-10-22：现代参考有界非教程回合开始事务（静态）

[PR121](https://github.com/DanielMax937/sanguozhi/pull/121)已交付独立冷静再考补牌后加成。本批补充[有界非教程 TurnStart 组合事务](debate-turn-start-v1.md)及[API合同](../engine/debate-turn-start-v1.md)，直接复用现有当前18牌堆补牌核，连接再考恢复、补牌、刚胆取消兴奋和崩坏标志清除，而非再拆一个普通牌计数查询。

严格按整个0队再整个1队处理：清除已出牌，崩坏或兴奋冷静恢复再考额度，执行既有补牌，按最终活动手牌统计普通牌，仅兴奋刚胆且普通牌为零时清计时，最后清崩坏标志。不是出牌耗尽瞬间清计时，也不是在补牌前判断。满手话术而没有空槽时补牌核不会修补，故刚胆退出；有空槽且补入全话术时，必要的普通牌修补完成后刚胆应保留计时。现有收据 topicCardCountAfterFill 为修补前计数，不能代替本批的最终计数。

显式输入两队七物理槽检查点、活动容量4..7、已解析性格、计时、额度与崩坏、各自当前18张牌堆和游标。保留物理空槽位置映射，补牌恢复0槽，只写活动前缀并保留非活动尾槽。原子组合保留既有补牌完整收据及每队局部抽样，外层仅按队次序记录全局抽样位置。任一队失败不返回第一队半状态或部分收据。

仅接受非教程；游标18且无需抽牌可成功，刚好取到第18项亦可成功，实际需要下一项时以不支持再生成拒绝整个事务，不回绕、不截短、不重复实现牌组生成。活动可出牌槽的0值明确不在此有限补牌核准入域内；人物解析、实际到达TurnStart的前置合法性与完整历史不认证。

九个旧会话、现有补牌／完成／再生成及其他核、政策和存档不修改，不自动接入。再生成版TurnStart、教程分支、完整再考与完整愤怒会话、TurnEnd、计时递减、完整回合随机／身份预算继续开放。本批不处理攻击、终局分类、人物／书籍、非恒等hook、开场／追击／留情或campaign；P078及全部依赖排除。固定现代C#不是原生PK／Vanilla等价证明，43证据主题／45历史快照保持。

仅静态文本、独立审阅、人工纸面推导与字节身份核对，未运行测试、编译、typecheck、build、validator、候选、来源、场景或replay。下方历史段落保留原交付边界。

## 2026-10-22：现代参考冷静再考补牌后加成（静态）

[PR120](https://github.com/DanielMax937/sanguozhi/pull/120)已交付有界双次愤怒结算。本批补充[冷静再考补牌后加成](debate-calm-rethink-v1.md)与[API合同](../engine/debate-calm-rethink-v1.md)，只覆盖 CharacterRethink 在补牌完成后的性格加成和最终排序，不重复实现清牌、补牌、牌组再生成或整个再考事务。

输入为调用方给定的已补满且数值排序的4..7个活动物理槽：槽0为再考0，其余为1..14且至少一张普通话题牌。仅计时器为正且性格为冷静时要求一个显式 RandBool(40) 布尔返回值，即使当前话题无效也必须消费；其他情况不能携带该返回值。返回真且话题0..2时，把当前物理槽1覆盖为对应大牌3／6／9，然后再次数值排序。同牌覆盖仍记录为已执行，不能因数值未变跳过。槽1是排序后数值最小的可出牌槽，不等同于等级最低或随机槽。

记录原手牌、条件、布尔返回值消费、覆盖及排序来源槽映射；等牌身份顺序仅采用显式工程稳定策略，不声称原 Array.Sort 的对象身份保证。只承接 RandBool 的语义返回值，不实现或认证其底层随机映射、概率或原生随机流。坏形、缺失或多余返回值原子拒绝；不修改调用方数据。

这是独立补牌后检查点，不证明输入确由某次再考产生，不验证再考额度、持牌操作或人物性格解析。旧九会话、补牌与再生成组件、其他政策和存档保持原样；完整冷静再考接入、刚胆耗牌、TurnStart／TurnEnd、计时、全回合随机与身份预算仍开放。人物／书籍、非恒等hook、开场／追击／留情与campaign排除；P078及全部依赖排除。固定现代C#不是原生PK／Vanilla证明，43证据主题／45历史快照保持。

仅静态文本、独立审阅、纸面推导及字节身份核对，未运行测试、编译、typecheck、build、validator、候选、来源、场景或replay。下方历史段落保留交付时边界。

## 2026-10-21：现代参考双次愤怒结算组合核（静态）

[PR119](https://github.com/DanielMax937/sanguozhi/pull/119)已交付独立攻击方判定。本批补充[有界双次愤怒结算事务](debate-anger-phase-v1.md)与[完整API合同](../engine/debate-anger-phase-v1.md)，直接复用PR115入场与PR116胆小连打公开核，不另复制反制、连打伤害或压紧算法。它整合已有组件，但仍不是旧九会话集成，也不是完整AngerPhase路由与回合执行。

从winner=−1、双方HP为正且combo未激活的显式检查点开始，先可反射入场、完整执行新激活的胆小连打，再判胜负。若首次已终局，立即结束，不做第二次入场或崩坏。否则第二次以canReflect=false入场（只禁激昂反射，仍可镇静反制）、完整连打，先计算崩坏再判胜负。最多两次，不因第二次新加压力循环到稳定；连打自身不在途中HP归零时停止。

两次抽样分别明确提供，每次最多4个既有bound5 jitter；全部输入预先安全分离校验，无连打或被跳过的第二次不能携带多余抽样。组合层保留各组件完整收据及局部抽样记录，另记阶段顺序与全局偏移；失败不返回部分状态。胜负按原firstTeam的对手HP优先检查；崩坏按HP每250一档且限制0..3，等级任意改变（含下降）置标记，等级不变保留原标记。

结果仅为“待终局分类”或“待回合结束”：不调用CanCritical，不执行Critical／Closing／TurnEnd、计时递减、先手／话题更新、补牌或牌组生成。给定性格、武力与两方attack是调用方检查点，genericOnly仅声明恒等人物伤害hook，不认证真实人物解析。旧九会话、各依赖核、政策和存档保持原样；完整愤怒会话、冷静再考／刚胆耗牌、全回合随机与身份预算继续开放。

人物／书籍、非恒等hook、开场／追击／留情与campaign排除；固定现代C#不是原生PK／Vanilla证明，43证据主题／45历史快照保持；P078及全部依赖排除。仅静态文本、独立审阅、纸面推导和字节身份核对，未运行测试、编译、typecheck、build、validator、checker、诊断、候选、来源、场景或replay。下方历史段落保留各批交付时的边界。

## 2026-10-21：现代参考兴奋刚胆攻击方判定核（静态）

[PR118](https://github.com/DanielMax937/sanguozhi/pull/118)已交付四性格通用体力伤害公式。本批补充[独立攻击方判定](debate-attacker-selection-v1.md)与[完整API合同](../engine/debate-attacker-selection-v1.md)，只计算固定现代参考 GetCardPower 与 CalcAttacker 的牌力和胜出方，不把判定结果等同于完整出牌或攻击执行。

两方先按牌码求基础牌力：无视120、大喝110、诡辩20；普通牌为1加等级，当前话题有效且匹配时再加10；其余牌码为0。随后分别检查性格与计时器：兴奋刚胆无条件将自身牌力替换为100，不是加100或至少100，因此也会降低无视／大喝的基础牌力。只比较最终牌力，严格较大者为攻击方，相等返回−1；不因先手或人物属性打破平局。

输入显式给定两方已解析性格、0..4计时器、signed32当前话题及两张signed32牌码。无效话题不加匹配分，越界整型牌码按来源默认基础0而非坏形；兴奋刚胆仍可覆盖为100。这些是合成检查点查询，不证明该牌合法、持有或允许出牌。可用性核保持独立，本核不调用它；没有HP／压力、伤害、随机或状态写入。

九个旧会话及既有各核、政策和存档不修改，没有自动接入。完整双次愤怒阶段、胜负／崩坏／回合结束编排、冷静再考／刚胆耗牌、计时与全回合随机／身份预算仍开放。人物／书籍、非恒等人物hook、开场／追击／留情与campaign排除；固定现代C#不是原生PK／Vanilla证明，43证据主题／45历史快照保持；P078及全部依赖排除。仅静态文本、独立审阅、纸面推导和字节身份核对，未运行测试、编译、typecheck、build、validator、checker、诊断、候选、来源、场景或replay。下方历史段落保留各批交付时的边界。

## 2026-10-21：现代参考四性格通用体力伤害公式核（静态）

[PR117](https://github.com/DanielMax937/sanguozhi/pull/117)已交付独立出牌可用性。本批补充[通用体力伤害公式核](debate-hp-damage-v1.md)与[完整API合同](../engine/debate-hp-damage-v1.md)，仅计算固定现代参考 CalcHpDamage 的一次通用恒等人物hook结果，覆盖四性格／兴奋计时对系数的影响，不扣HP、不加压力、不选择攻击方，也不接入会话。

给定已解析attack=70..227、性格、timer=0..4、当前话题0..2、牌码−1..14与一次bound5 jitter。timer>0的胆小／刚胆话题系数10，冷静／莽撞保持6，即使牌话题匹配或为大喝也不进入正常态分支。timer=0时大喝系数12，否则匹配普通话题系数10、不匹配6。大喝等级系数15，普通牌等级系数10／15／20，其余0；仅兴奋冷静另取怒气系数15，其余10。按源码顺序完成整数乘积后截断除1000，不逐步截断。

每次公式调用都需要且仅需一个显式jitter，等级系数0也不能省略随机记录；坏形、缺失或多余抽样拒绝，不留下部分结果。返回系数选择理由、完整算术和抽样审计；genericOnly=true是调用方限定恒等人物hook的声明，不证明真实人物行为已被解析。上述支持域内最大请求伤害462，不照抄来源注释的宽泛上界作为实现保证。

九个旧会话、入场／连击／可用性组件及既有政策和存档不修改，没有自动接入。本核不验证持牌／出牌合法性，不实现攻方判定的刚胆牌力覆盖、HP／压力writer、胜负／崩坏、双次愤怒阶段、冷静再考／刚胆耗牌、计时或全回合随机／身份预算。人物／书籍、非恒等伤害hook、开场／追击／留情与campaign排除。固定现代C#不是原生PK／Vanilla证明，43证据主题／45历史快照保持；P078及全部依赖排除。仅静态文本、独立审阅、人工纸面算术和字节身份核对，未运行测试、编译、typecheck、build、validator、checker、诊断、候选、来源、场景或replay。下方保留历史边界。

## 2026-10-21：现代参考愤怒出牌可用性核（静态）

[PR116](https://github.com/DanielMax937/sanguozhi/pull/116)已交付胆小待连击执行核。本批另补[牌码可用性判定](debate-card-availability-v1.md)与[完整API合同](../engine/debate-card-availability-v1.md)，落实固定现代参考 IsCardAvailable 中独立的性格／计时／再考额度分支，不把纯查询等同于会话已经支持愤怒出牌。

仅冷静或刚胆且timer>0形成该函数的受限兴奋态。普通话题牌1..9始终通过；再考0先阻止兴奋刚胆，再读取己方canRethink，不受对手冷静直接压制。大喝／诡辩／无视先阻止己方兴奋刚胆，再阻止对方兴奋冷静；镇静／激昂先阻止己方兴奋冷静或刚胆，再阻止对方兴奋冷静。胆小／莽撞的正计时器不触发这些限制。越界整型牌码返回不可用，不与坏形输入混淆；原因、短路检查及两方判定条件审计是显式工程输出，不宣称原参考返回过这些记录。

核只查询给定两方已解析性格、0..4计时器、再考布尔额度及一个牌码，不读取持牌、HP、当前话题、先手或出牌阶段。因此available=true不证明拥有该牌或该回合允许行动；不给卡、不消耗额度、不改计时、不抽样。九个旧会话、愤怒入场和连击组件均保持原接口／政策／存档，未接入此判定。

完整双次愤怒阶段、其他性格伤害系数、冷静再考／刚胆耗牌、计时递减及新会话接入仍开放；人物性格解析、书籍、开场／追击／留情与campaign不在范围。固定现代C#不是原生PK／Vanilla证明，43证据主题／45历史快照不减。P078及全部依赖排除。仅静态文本、独立审阅、纸面推导和字节身份核对，未运行测试、编译、typecheck、build、validator、checker、诊断、候选、来源、场景或replay。下方旧段保留历史边界。

## 2026-10-21：现代参考胆小待连击执行核（静态）

[PR115](https://github.com/DanielMax937/sanguozhi/pull/115)已交付单次愤怒入场，其胆小分支仅产生待连击标记。本批补充[独立胆小连打执行核](debate-timid-combo-v1.md)与[完整API合同](../engine/debate-timid-combo-v1.md)，仅接纳胆小timer=1、combo.active=true且counter=0的显式待处理检查点，不把它伪装为完整愤怒阶段或会话接入。

核按来源从0至有效容量末槽遍历当前物理手牌；只有当下读取到普通话题牌才消费一次bound5 jitter并攻击。每次伤害按给定attack与胆小兴奋系数计算，先写HP再写按请求伤害除15所得压力，随后删除本槽、清空七物理槽并稳定压紧有效前缀、增加计数。循环下标仍继续递增，因此刚移入当前槽的牌会被跳过，不能改成遍历初始牌清单或消耗所有普通牌。途中HP≤0不终止；整圈完成后清combo.active，零次攻击也清，保留attacker并按实际次数返回counter。

容量4..7使实际命中最多4次；每次仅用其对应显式jitter，缺失／多余／错形抽样整条拒绝。给定resolvedAttack=70..227及genericOnly限定是工程支持域，人物attack解析和非恒等伤害hook均未实现。完整扫描、伤害请求／实际写入、删除压紧与抽样记录返回；没有补牌、牌组再生成、计时递减、胜负判定或第二次愤怒入场。

旧九会话及PR115入场核、已有存档和政策均不修改；调用者可显式转交兼容角色与待办数据，但没有自动编排。完整双次愤怒阶段、愤怒中普通出牌／其他性格系数、冷静再考／刚胆耗牌、全回合随机与身份预算仍开放。固定现代C#参考不是原生PK／Vanilla／主机证明，43证据主题／45历史快照不减。P078及全部依赖、人物／书籍、开场／追击／留情与campaign排除。仅静态文本、独立审阅、纸面推导和字节身份核对，未运行测试、编译、typecheck、build、validator、checker、诊断、候选、来源、场景或replay。下方旧段保留历史profile边界。

## 2026-10-21：现代参考单次愤怒入场核（静态）

[PR114](https://github.com/DanielMax937/sanguozhi/pull/114)已交付按需牌组再生成会话。本批新增[独立愤怒入场规则核](debate-anger-entry-v1.md)与[完整API合同](../engine/debate-anger-entry-v1.md)，只覆盖一次 CalcAngering(canReflect) 后的 Anger，不伪装成会话已经支持完整愤怒阶段。

输入明确给定两方性格、已解析武力、HP／压力／计时器、七个物理牌槽及有效容量和连击检查点。按先手再后手选压力满且未兴奋者；保留来源“第一张匹配牌下标严格大于0”的自动激昂／镇静反制，反制时按原序压紧有效牌槽并清除其余物理槽。激昂转移入场，镇静取消入场；压力写入逐次截断。胆小／莽撞计时1，冷静／刚胆计时4；莽撞按200+给定武力扣HP，再加截断除15所得压力；胆小只标记待连击，不执行连打。无入场或非胆小分支不擅自清除已有连击字段。

核无随机、不检查胜负、不补牌、不重复触发到稳定，也不递减计时器。完整愤怒阶段的两次判定、胆小连打、胜负／崩坏／回合结束顺序、愤怒中的出牌与伤害系数、冷静再考和刚胆牌耗尽处理仍开放。旧九个会话、存档和此前各独立核均不修改；PR114仍按原合同拒绝非终局怒线，不能把本组件当作旧会话接入。

固定现代C#转录参考不是原生PK／Vanilla／主机确认；人物性格及武力解析、开场／追击／留情、campaign、P078及其全部依赖排除。43证据主题／45历史快照不减。仅静态编辑、独立审阅、纸面推导与文件字节身份核对，未运行测试、编译、typecheck、build、validator、checker、诊断、候选、示例或replay。以下历史段落按原profile及交付时点保留。

## 2026-10-21：现代参考按需牌组再生成会话（静态）

[PR113](https://github.com/DanielMax937/sanguozhi/pull/113)已交付独立牌组生成核。本批新增[真正接入再生成的独立会话](regenerated-debate-session-v1.md)与[完整API／随机及存档合同](../engine/regenerated-debate-session-v1.md)，不把组件存在视为旧会话已接入。输入是明确提供的当前18牌、初始游标0..18和有序话术池；第0代是合成检查点，不认证此前发牌历史、人物资格或DeckInit。

只在空槽确实需要下一张且游标已达18时调用既有DeckGenerate，成功后换入完整新牌组、保留完整话术池重排、递增代号并清0游标，再继续同一次补牌。跨边界前后的空位全填完后才做一次普通话题修补和排序，不能拆成两次旧补牌调用而提前修补。牌身份包含参与者、代号和代内下标，修补只改牌面不重用身份；完整生成收据保留局部索引，外层另记参与者、阶段、代号和全局抽样区间。

新会话复用原共享战斗核；补牌完成段抽为内部共享函数，旧公开补牌API的政策、类型、错误顺序和收据保持。旧八个session及其存档不迁移，PR112仍拒绝第19项；仅新profile接受其显式抽样范围内的按需再生成。初始化按队伍0／1；每轮仍按先手／后手选择与可选再考、攻击与诡辩话题、非终局队伍0／1补牌顺序，终局不额外生成。

每人一轮最多6张再考补牌加1张回合补缺，因此最多一次跨代，全轮至多两次生成；显式draw上界初始化8036、每轮8040。新profile采用8192数组长度、16条历史、32MiB完整封装、200万值节点和深度32预算，完整提案超限可提前拒绝，不承诺所有16轮组合均装得下。预览／执行／保存／重算均保留完整生成与补牌审计，不裁剪2000次交换或话术池第五项。

仍为固定现代转录参考，不认证原生PK／Vanilla／主机、PRNG或概率分布；人物书籍、DeckInit、愤激／性格、开场／追击／留情、campaign与P078及全部依赖排除。43证据主题／45历史快照不减。仅静态编辑、独立审阅、纸面推导和字节身份核对，未运行测试、编译、typecheck、build、validator、checker、诊断、候选、示例或replay。以下旧段按原profile及历史时点保留。

## 2026-10-21：现代参考 DeckGenerate 显式抽样独立核（静态）

[PR112](https://github.com/DanielMax937/sanguozhi/pull/112)已将补牌核接入有限当前牌组会话。本批另补[可复用牌组生成核](debate-deck-generate-v1.md)与[完整API／抽样和交换审计](../engine/debate-deck-generate-v1.md)：给定有序且不重复的0至5张话术可用池与完整原始draw，自行生成18张牌和新的话术池顺序，不由调用方直接指定最终牌组。

固定现代 DeckGenerate 按8小／4中／2大先取普通牌；话术池非空才执行2000次交换，再把打乱后前至多4张放入尾槽，不足部分从完整九种普通牌表抽取；最后整堆执行2000次交换。普通表是[4,1,7,5,2,8,6,3,9]，不是补牌修补的1+draw映射。池长1仍消费2000次bound1，池长5只取打乱后前4张，但完整5张重排状态返回。n=0..5所需draw依次2018／4017／4016／4015／4014／4014，不删自交换、不用Fisher–Yates替换，不声称均匀洗牌或真实概率。

本核没有牌组游标，DeckGenerate本身不重置index；原调用者跨界后置index=0是另一步。返回完整抽样／交换／阶段审计，错误时无部分牌组或池状态；不接人物／书籍／MOD资格、DeckInit或全局PRNG。旧八个会话与已交付补牌／共享战斗核均不改，**尚未将生成核接入跨18牌边界**，PR112的unsupported-deck-regeneration仍保留，不能把本组件交付说成完整发牌或完整舌战闭环。

固定现代转录来源不认证原生PK／Vanilla／主机，43证据主题／45历史快照不减；愤激／性格、人物、开场／追击／留情、campaign与P078及其依赖继续排除。仅静态文本、独立审阅、人工纸面推导与字节哈希；未运行测试、编译、typecheck、build、validator、checker、诊断、候选、示例或replay。下方各旧范围按原profile及历史时点保留。

## 2026-10-20：18张当前牌组补牌核接入正常态会话（静态）

[PR111](https://github.com/DanielMax937/sanguozhi/pull/111)已交付独立补牌核；本批新增[实际接核的独立会话](filled-debate-session-v1.md)与[API／收据／存档合同](../engine/filled-debate-session-v1.md)，在初始化、可选再考与非终局补缺三个阶段调用同一核。出牌后按固定源码先压紧保留牌，再将尾部空位交给补牌核；保存补牌前槽位、数值排序与牌身份，普通话题修补覆盖牌面但保留已消费牌组项的token，不伪造额外抽牌。

每人只接收给定18张当前牌组。必要的修补随机与伤害／诡辩话题随机按阶段串联；先手再考→后手再考→攻击→话题→队伍0／1补缺，初始化另按队伍0／1处理。完整核收据和全历史重算覆盖实际状态，缺失、多余、错序随机或越过当前牌组边界整条拒绝。未实现牌组再生成、发牌概率、洗牌或全局PRNG。

为避免再次复制整套战斗逻辑，正常态攻击／附效／终局和话题结算抽为内部共享核，PR110旧再考模块保持原公开接口、政策、收据与存档行为；其他六个旧模块不改，新补牌核也不改。新tag不接受旧存档、不隐式迁移，旧七个profile原边界不因本批消失。愤激／性格、人物书籍、开场／追击／留情和campaign结果仍未覆盖；只扩大固定现代转录参考支持域，不认证原生PK／Vanilla／主机等价。43证据主题／45历史快照保留，P078及全部依赖排除。

仅静态代码与文档审查及字节身份核对，未运行测试、typecheck、编译、构建、validator、诊断、纸面示例、replay或项目代码；不能据此宣称运行通过。下方历史段落按各自原profile与时点解释。

## 2026-10-20：舌战当前牌组补牌／话题修补独立核（静态）

[PR110](https://github.com/DanielMax937/sanguozhi/pull/110)已交付正常态再考会话。本批另外新增[独立补牌规则核](debate-hand-fill-v1.md)及[完整API／来源审计](../engine/debate-hand-fill-v1.md)：只接收给定的18张当前牌组、游标、3至6个可出手槽与必要的九选一修补原始输入，不再复制一套完整会话。

按固定现代 CharacterFillCards 顺序，先恢复保留再考槽0，再在原物理槽1起依次补空位；只有填后无普通话题牌且本次确实补过空槽，才把最后新补槽改为1+RandInt(9)对应牌，再按现代枚举数值排序。完整无空位的全话术手牌不会被无条件修补。修补覆盖的牌组项仍算已消费，不另推进游标；同值牌的可追踪排序仅采用显式工程审计规则，不声称固定了原排序的对象身份顺序。

跨越18张当前牌组边界明确返回 unsupported-deck-regeneration；不实现牌组生成、洗牌、概率、全局PRNG、人物书籍或愤激覆写。本核没有HP／stress／canRethink／回合／campaign写入，也没有会话存档。旧七个profile与存档保持不变，**尚未接入新核**；PR110的 unsupported-topic-repair 与各旧版原发牌边界仍然存在，不能把此底层核交付说成完整发牌或完整舌战已经完成。

证据限定固定现代C#转录及枚举，不升级为原生PK／Vanilla／主机认证；原43证据主题／45历史快照不减，P078及全部依赖排除。本批仅静态代码／文档审查，未运行测试、typecheck、编译、构建、validator、诊断、示例或项目代码；独立纸面输入与预期不作运行通过结论。

## 2026-10-20：再考重抽与崩坏恢复的独立正常态会话（静态）

在[PR109](https://github.com/DanielMax937/sanguozhi/pull/109)诡辩版本之外，新增[正常态再考参考会话](rethink-debate-session-v1.md)与[完整API及重抽收据](../engine/rethink-debate-session-v1.md)。再考不是第七种攻击牌：在出牌阶段按先手可选重抽→先手最终选牌→后手可选重抽→后手最终选牌处理，再进入既有六种战斗牌结算。整个过程被工程API打包成一个原子回合，不声称实现交互式阶段存档。

正常态再考初始可用，用后关闭；仅非终局崩坏等级改变时在下轮开始恢复，不是每回合自动恢复，也不积累多次额度。同轮先再考后受伤跨崩坏阈值，可以使下轮恢复，但不能借用尚未发生的恢复来满足本轮请求。重抽弃掉整副可出手牌，沿原提供牌带继续消费，保留独立弃牌／替换牌／补牌与游标审计；现代显示层可用性保护不冒充原生玩家侧已认证限制。

新profile的所有补牌阶段（初始、再考、非终局补缺）都要求给定手牌至少含一张普通话题牌，否则整轮或初始化明确拒绝，保留原强制话题替换随机分支未实现。终局出牌后不补牌，不额外套该约束。原发牌分布、洗牌、全局RNG、显示排序及愤激冷静额外重抽规则不在本批内；无外部随机副作用只属于明确的给定牌带／无修复子集，不声称原源码再考天然不消费随机。

旧六个profile、源码与存档不变，无隐式迁移；下方历史“再考未覆盖”只适用原profile或时点。仍缺四性格愤激／自动反制／连打、原发牌和强制替换、人物书籍、教程、开场／追击／留情及campaign结果。固定现代转录来源不升级为原生PK／Vanilla／主机认证，原43证据主题／45历史快照保持开放。P078及全部依赖排除。

只静态代码与文档审查，未运行测试、typecheck、编译、构建、validator、诊断、示例、replay或产品；五轮及独立拒绝的纸面设计不作运行通过结论。

## 2026-10-20：诡辩反射及条件话题随机的独立正常态会话（静态）

在[PR108](https://github.com/DanielMax937/sanguozhi/pull/108)激昂版本之外，新增[普通话题＋五话术的正常态参考会话](sophistry-debate-session-v1.md)及[完整API与阶段收据](../engine/sophistry-debate-session-v1.md)。诡辩power20，以诡辩方attack和对方普通牌系数计算反弹伤害；镇静的请求基数仍读对方stress，但反射后写自己，激昂则反射给对方。计算主体、牌所属方、请求基数与实际写入目标分开记录，不凭自然语言猜目标。

限定非教程、双方angerTimer0的通用子集。非终局非平局，只要一方出诡辩且对面不是无视，回合末额外消费bound3话题随机，包括诡辩输给大喝；可以抽回原话题。Attack所需bound5伤害随机先消费，HP终局不消费话题随机；非终局stress100仍在话题阶段之前整轮拒绝。全部随机按阶段校验，拒绝多余、缺失或错序输入，无外部RNG副作用。

旧五个profile、源码及存档不变，无隐式迁移。本批接纳正常态普通牌和五话术，不等于完整舌战：再考、四性格愤激／自动反制／连打、原发牌／全局RNG、教程、人物书籍、开场／追击／留情及campaign结果仍未实现。本段之后历史“诡辩未覆盖”只属于原profile／时点，不重复交付已完成版本。

新增固定现代枚举源码仅支持Story0／Logic1／Trend2映射，不认证原生PK／Vanilla／主机，原43证据主题／45历史快照不减。P078及全部依赖排除。只静态文本修改与独立审查，未运行测试、typecheck、编译、构建、validator、诊断、示例、replay或产品；七轮及下一轮拒绝的纸面例子不作运行通过结论。

## 2026-10-20：激昂自增压力的独立正常态会话（静态）

在[PR107](https://github.com/DanielMax937/sanguozhi/pull/107)镇静版本之外，新增[普通＋大喝＋无视＋镇静＋激昂会话](agitate-debate-session-v1.md)与[完整API及阶段收据](../engine/agitate-debate-session-v1.md)。固定现代参考中激昂power0，不会赢过本子集任何牌；输给普通／大喝时先承受攻击，再为使用者自己请求stress+40并裁剪。无视胜会抑制败方激昂；双激昂或激昂对镇静是平局，只双方stress+15，不调用附加效果。

攻击→附加效果→HP终局→非终局愤激边界顺序不变：HP败退仍先记录激昂效果；非终局效果后stress100则整轮拒绝，不产生半轮保存、也不假装已实现愤激。收据的激昂targetId为使用者本人，被抑制请求为null而非假算+40；镇静仍以对方为目标。旧四个profile、源码和存档保持不变，无隐式迁移。

历史段落中“激昂未覆盖”只属原profile／时点；当前仍缺诡辩反弹及条件话题随机、四性格愤激／自动反制／再考、原发牌／全局RNG、人物书籍、开场／追击／留情及campaign结果。本次只扩大固定现代转录源码的正常态通用子集，不升级原生PK／Vanilla／主机证据，不减少原43主题／45历史快照。P078及全部依赖继续排除。

仅静态文本与独立审查；未运行测试、typecheck、编译、构建、validator、诊断、示例、replay或产品。五轮成功及第六轮拒绝的纸面例子不是运行结果。

## 2026-10-20：镇静附加效果的独立会话（静态）

在[PR106](https://github.com/DanielMax937/sanguozhi/pull/106)已交付普通＋大喝＋无视之外，新增[普通＋大喝＋无视＋镇静会话](compose-debate-session-v1.md)及[完整API与阶段收据](../engine/compose-debate-session-v1.md)。参考源码正常态镇静power0，输给普通或大喝后降低对方（本轮胜者）当前stress：−max(trunc(stress/2),30)，再裁剪；并非给自己镇静。无视胜会阻断败方镇静，双镇静平局没有附加效果，仍双方stress+15。

新独立profile保留攻击→附加效果→HP终局→非终局愤激边界的明确顺序，收据保留攻击和附加效果分阶段请求／实际写入以及被抑制状态。旧三个profile、源码和存档不改，不隐式迁移。下方各旧批次的“尚未覆盖镇静”只适用其原profile／时点，不应据此重复交付；当前仍不支持诡辩／激昂、四性格愤激／再考、原发牌／全局RNG、人物书籍、开场／追击／留情或campaign结果。

只扩展固定现代转录参考下的通用正常态子集，不把工程政策或现代源码升级为原生PK／Vanilla／主机证据，不减少原43主题／45历史快照。P078及全部依赖排除。仅静态代码／文档与审查，未运行测试、typecheck、编译、构建、validator、诊断、示例、replay或产品；纸面例子不是运行结果。

## 2026-10-20：大喝已交付登记与无视独立会话（静态）

[PR105](https://github.com/DanielMax937/sanguozhi/pull/105)已交付[普通＋大喝会话](shout-debate-session-v1.md)；本批补齐该版本的公共包入口和全局索引，不重交付其既有行为。另新增[普通＋大喝＋无视会话](ignore-debate-session-v1.md)及[完整API](../engine/ignore-debate-session-v1.md)：无视power120、败方stress+30、零HP伤害／零jitter，胜方非终局更新先手但保留话题；双无视仍为双方stress+15的平局。无视胜与平局的receipt明确区分，非终局stress100与牌带不足仍整轮拒绝。

三个独立profile／存档各自保留，旧普通和大喝API不改行为、不隐式迁移。下方历史“五话术均未实现”等说法只适用于旧普通profile或原日期；当前新增覆盖仅普通＋大喝＋无视的正常态通用子集，不能改称完整舌战已完成。诡辩／镇静／激昂、四性格愤激、再考、原发牌／全局RNG、人物书籍、开场／追击／留情及campaign结果层仍未覆盖。

来源仍为固定现代C#转录参考；既有普通核心证据标签不外推到新增话术，不认证原生PK、Vanilla或主机。原43证据主题／45历史快照不减，P078及全部依赖继续排除。本批只静态读写与审查，未运行测试、typecheck、编译、构建、validator、诊断、示例、replay或产品；纸面预期不是运行结果。

## 2026-10-20：巡察／市场共享账本接入季度治安下降（静态）

[具体规则](bounded-seasonal-patrol-market.md)与[完整API及保存合同](../engine/bounded-seasonal-patrol-market.md)增加独立版本化后继profile：固定太守／整备政令、有限完整随机带，季初先按旧治安计月收入，再写实际季降和足额工资；此后巡察及下月收入读取同一治安账本。复用原财政季降phase，不重复声称恢复旧公式。旧巡察市场v1与旧保存格式不变，无隐式迁移。

PR99的动态锻冶月产、PR101的市场收入工资、PR103的巡察收入反馈已分别有具体规则；本页下方旧“未集成”仅属当时或原profile范围，不能据此重新交付已补部分。当前仍未覆盖完整财政／粮／灾害、通用scheduler、多施工／升级／维修／取消、原RNG／writer／stock／Vanilla等价。P078及全部依赖继续排除；原43证据主题／45快照不减。完整窗口随机带预核只是工程完成尾政策，不是原生随机机制证据。

本批仅文本编辑和静态阅读，未运行测试、typecheck、编译、构建、validator、诊断、示例或产品。预算是纸面上界，不是运行测量；历史通过数字不验证本批。

# 巡察治安影响市场月收入

[详细规则正文](bounded-patrol-market-income-payroll.md)列出普通巡察 100 金/20 AP、治安与成长写入、人物施工锁、动态月收入、完整普通官薪与工资保留金。新独立 profile 最多 12 旬、25 条接受历史与 32 次完整重放；巡察不能占掉已接受施工所需的完成尾。压力是显式独立观测，顺序和集成政策保持可替换推测，不代表原版财政全部恢复。[API 与保存说明](../engine/bounded-patrol-market-income-payroll.md)给出完整闭合合同；未运行测试、编译或构建。

# 市场建设与收入、工资共享金账

[详细规则正文](bounded-market-income-payroll.md)列出市场工作量与费用、动态30槽收入、固定完整官薪名单、先收入封顶再足额工资、剩余窗口工资保留金及完成尾边界。保留金不等于已发薪，也不允许未来收入借款；顺序与输入范围是明确工程推测，不称原版完整财政。[API及保存说明](../engine/bounded-market-income-payroll.md)定义新13历史、32次完整重放；本次未运行测试、编译或构建。

# 金收入与完整工资的兼容复用

[财政规则正文](city-finance-lifecycle.md)补充现有金收入适配、分离时序、足额发薪、完整空名单零额发薪及不足拒绝的具体政策；[私有阶段说明](../engine/finance-money-payroll-phases.md)列出强类型接缝和兼容证明。原财政公开协议与保存保持；新市场动态收入、工资保留金不由本次抽取接入。未运行测试、编译或构建。

# 动态锻冶建设与每月特产

[详细规则正文](bounded-forge-monthly-production.md)记录同账本建设、普通生产、固定太守、动态30槽、完工后月产、三兵种完整核审计和库存饱和规则。区分原核证据与本 profile 的可替换调度政策；不声称原作整链恢复。[API及有界保存合同](../engine/bounded-forge-monthly-production.md)另列完整128尝试域，旧profile的512域不变。本次未运行测试、编译或构建。

## 锻冶三命令内部复用的兼容规则（2026-10-19，静态）

[规则正文](bounded-forge-development-production.md)保留同一设施ID从开工到普通生产的费用／当前成长／TP／预约／唯一旬时钟规则，补明内部抽取不改变这些行为；[私有core说明](../engine/bounded-forge-core.md)说明精确事实视图、开工revision上下文及原owner的验证职责。

本次只抽现有三命令业务，原v1的七API、512trace与完整保存预算不变；没有动态月产或新数值域，不能据此宣称月产已经集成。原source-local／provisional和未知边界保留，P078及依赖排除。未运行测试、编译、构建、产品或validator。

## 月特产单兵种阶段的兼容规则（2026-10-19，静态）

[财政规则正文](city-finance-lifecycle.md)补明月界／太守／特产／30槽计数、完整旧核证据与合法小数、请求整数检查及饱和库存写入；[私有阶段说明](../engine/monthly-specialty-phases.md)记录原owner仍负责的工资后1→4调度和完整事务。

这是既有财政服务的内部复用抽取，不新增动态建设设施的月产接合，不改变公开保存格式或四类设备支持。原来源、工程政策与未知边界保持，P078及依赖仍排除；未运行测试、编译、构建或产品，静态审阅不证明运行等价。

## 单锻冶厂建设→普通生产具体规则（2026-10-19，静态）

[完整规则正文](bounded-forge-development-production.md)记录空地块开工300金／20AP、800施工工作量及200初始量、旧核旬率／1–10旬工期、唯一时钟AP恢复、当前TP+30／政治XP+3／功绩100、完工者本旬行动标记，以及同ID完成设施的普通兵装1–3生产资格／价格／数量／奖励。

[七API与保存合同](../engine/bounded-forge-development-production.md)明确新根全历史重算、双向锁、最先失败顺序与完整包装预算。所有限定生命周期、固定外部事实及普通生产TP未建模边界均为显式工程政策，不增添原版机制证据；P078及依赖仍排除。未运行测试、编译、构建或产品。下方旧批次的未整合描述保留原时点。

## 建设阶段的完整兼容规则（2026-10-19，静态）

[建设生命周期正文](facility-construction-lifecycle.md)补充九类新建、五类吸收、16种具名政策组合、开始首错、逐旬进度、当前TP／XP写入及完成者标记；[包内阶段说明](../engine/facility-construction-phases.md)记录无独立时钟的复用接口和原owner职责。

这是旧服务内部兼容抽取，未新增建设→普通生产共享profile，既有只读设施效果仍不自动接生产或收入。source-local／empirical／provisional边界不变，P078及依赖仍排除。未运行任何测试、编译、build、产品或validator，静态审阅不证明运行等价。

## 单工房共享时钟的具体规则（2026-10-18，静态）

- [完整正文](bounded-city-piece-clock.md)：同账本即时动作、根资格与锁顺序、开工20AP／三核审计、到期容量／成长、一次旬推进与AP恢复、完成尾保证的有限条件
- [八API、完整保存重建与分页](../engine/bounded-city-piece-clock.md)
- [固定政策](../../data/policies/bounded-city-piece-clock-v1.json)与[来源边界](../../data/sources/bounded-city-piece-clock-v1.json)

仅独立单城／单工房／类型5／最多12旬工程域，未运行测试、编译或产品。supplied外部事实不是原版世界证据，原43主题／45快照不清空；下方旧阶段“未整合时钟／任务”限定各自旧profile，旧接口保持。

## 件数生产的内部兼容边界（2026-10-18，静态）

[城内指令具体规则](city-command-lifecycle.md)补充旧六类件数生产的计算／开工／费用／完成兼容约束；[内部计划器说明](../engine/piece-command-planners.md)列出owner保留的时钟、预约写入、快照和错误顺序。公开profile与全部既有政策不变，本次不新增世界时钟或生产任务整合。未运行测试／编译／构建或产品；原证据缺口保留。

## 固定单城共享账本：具体规则与接口（2026-10-18，静态）

- [完整游戏规则与工程政策](bounded-city-economy.md)：普通内政／商人唯一余额、人物行动、原子动作顺序、费用与饱和、未建模TP／功绩边界
- [八API／分页legal／严格文件CLI](../engine/bounded-city-economy.md)：固定单城单旬的新profile，完整genesis重算；没有世界时钟或旧state导入

只覆盖这个独立支持域，原43主题／45快照证据缺口不减。未运行测试、编译、构建、示例或validator。下方历史专题和当轮结论按版本保留。

## 即时命令内部维护（2026-10-18，静态）

[包内即时命令说明](../engine/instant-command-reducers.md) · [城市命令具体规则](city-command-lifecycle.md) · [商人买卖粮具体规则](city-merchant-lifecycle.md)

此次仅作内部兼容抽取，原规则与公共接口继续适用，不新增玩法或共享账本。未运行产品、示例、测试、typecheck、编译、build、runtime、checker或validator；既有验证限制保留。

## 当前规则入口：固定单城季节 simulation（2026-10-18，静态）

[详细季节规则](city-season-lifecycle.md) · [六API](../engine/city-season-lifecycle.md) · [policy](../../data/catalogs/city-season-policy-v1.json) · [设施catalog](../../data/catalogs/city-season-food-facilities-v1.json) · [source](../sources/city-season-lifecycle.json) · [schema](../sources/city-season-lifecycle.schema.json) · [未运行trace](../../data/scenarios/city-season-example-v1.json)

固定单城、完整驻城名单与30槽，current／scheduled月初处理后先疫病、再蝗灾、再季粮、最后生成下月pending。疫病实际扣兵并恶化健康；蝗灾实际损粮、按新抽样拆Lv1并扣每座30TP；Lv3不拆，Lv2与未知设施／技能出域。死亡边界、兵粮零、TP不足均整月拒绝，不夹1或留部分写入。风水仅预防新生成／激活，祈愿只切换显式新阈值。

完整F来自灾害后的真实兵数／剩余设施并真实调用旧粮核，当前丰作由第二个旧叶处理后才credit封顶；request、receipt、实际delta与discarded全部保留。发生率、持续、损失、顺序、风水激活门与PRNG是可替换simulation参数，不是原作常量。原版全局scheduler、完整财政和跨服务账本／时钟均未集成；原概率／writer／skill getter／stock及Lv2证据缺口不减少。

公共入口集成基线为PR89 main `0c5ad00667d40960e72f2d8b14c9c20f7eec30fc`／tree `a88a940c92a37c85ac8a827f1f8988ae18401aea`；来源manifest保留PR86历史读取身份。两粮核、两份来源依赖与设施catalog在这两个基线间Git blob相同，不把集成版本提升为新的原作证据。 仅静态实现，产品、示例、测试、typecheck、编译、build、runtime、checker、诊断及schema验证均未运行。原43主题与45快照的证据缺口不减少，下方历史结果不验证本新增。

## 一次内政评定：具体规则（2026-10-18，静态）

[完整规则](single-council-lifecycle.md) · [七个API](../engine/single-council-lifecycle.md) · [固定policy](../../data/catalogs/single-council-policy-v1.json) · [来源manifest](../sources/single-council-lifecycle.json) · [DTO schema](../sources/single-council-lifecycle.schema.json) · [未运行trace](../../data/scenarios/single-council-example-v1.json)。

一个固定单城episode，完整roster与君主／势力关系交叉匹配，最多6名下属；方针与具体案分别生成、采决，赞同解析到原提案且不增加执行人。仅巡查、征兵、数量兵装1–4三类由普通city-command硬门／preview生成候选，caller只选择生成的speech ID。其他19类与件数兵器／舰船排除；采纳集合按冻结参与顺序共享child执行真实费用／资源／奖励／标记，后案失败或预算失败整体回滚。

评定本身0金／AP；正常Complete请求唯一+10、cap10000，只写完成奖projection。普通案TP未模拟，child不加TP字段，不输出全局finalTP。全否发奖／abort不发、过滤／chooser／PRNG／去重／顺序都是新policy；completed／aborted不可重开、推进或重复发奖。完整genesis、保存和逐收据重算不证明原作等价。公共入口集成基线为PR88 main `8063d39731a42af87646168d4b36b92bd9d3ed3d`／tree `5e555fcda99f97e71e50c9c8565810dca50915be`；来源manifest继续保留PR86原始读取身份，普通city-command源码blob `f07b0762e045dfb77caeb8e46c06e7cee8bd255f`在两版本间相同，不把集成版本当成新的原作证据。原43主题与45快照中的未决证据不减，原版事件与跨服务一致性尚未集成。仅静态实现，未运行产品、示例、测试、typecheck、编译、build、runtime、checker、诊断或schema验证；下方历史结果不验证本新增。

## O14 query：来源事件三值查询具体规则（2026-10-18 静态）

[完整规则](source-event-query.md) · [三个API](../engine/source-event-query.md) · [固定registry](../../data/catalogs/source-event-query-profile-v1.json) · [来源身份](../sources/source-event-query.json) · [输入schema](../../data/schemas/source-event-query-v1.schema.json) · [响应schema](../../data/schemas/source-event-query-response-v1.schema.json) · [未运行输入示例](../../data/scenarios/source-event-query-example-v1.json)。明确固定观测身份、typed facts与显式bindings、strict eq/ne/order/set及三值all/any、完整原条款和子节点pointer；算子支持不代表所有来源分组已核。

registry只含管辂治安≥90与于吉同城无疫病／蝗灾、治安≥90、资金≥2001，共五原子和一个局部all。不得把于吉明确的城市范围套用于管辂灾害条件；其余条款与分组可读unknown，heading-only非true。片段comparison不等于完整clause或整体documentedConditionsStatus；当前整体仍unknown，executionEligibility始终disabled-source-corpus，repeatability仍unknown-repeatability。

202观测只是浏览范围；通用33／31／10、史实105／66／41、PS2 64／741／24与原43主题／45快照不减，executionEnabled=false不改，无发生／效果／世界state。实现集成基线PR87 main `021097bdb63ed882bb7b1e1d11f6bdeaf8af017b`／tree `077cb16ad83c8a3a32a6f60a26b3a00cee1b0a93`；来源仍为PR85相同五个Git blob。O14与O15未关闭；仅静态新增，产品、示例、测试、typecheck、编译、build、checker、诊断和schema校验均未运行。

## O14 field：有限正兵力动作完整规则（2026-10-18 静态）

[完整规则](field-combat-lifecycle.md) · [API](../engine/field-combat-lifecycle.md) · [政策](../../data/catalogs/field-combat-policy-v1.json) · [来源](../sources/field-combat-lifecycle.json) · [DTO schema](../sources/field-combat-lifecycle.schema.json)。普通近接／弩攻、一次反应、螺旋／横扫／旋风、扰乱与仅状态伪报形成一个固定episode事务；任何致命结果或未支持副效应都整体拒绝。伤害counter是克制；反击重算与scale单列模拟政策，精锐覆盖锻炼，O01状态不重复计功。

集成基线PR86 main `a04ee326fdaa68e930681430352f4d98fee5209e`／tree `df4e2be515e2434e4e64476517c8e58f0d3afaf0`。不含全战斗奖励、全旬、终局、建筑伤害、火、事件／council／灾害；原43证据组与45条snapshot不减，全部原作exactness E及域外X保留。没有运行产品、示例、测试、typecheck、编译、build、checker、诊断或schema校验；静态代码存在不是运行通过。

## 相邻遗迹／庙发现完整规则（O13-B，静态新增）

更新：2026-10-18 UTC。

[完整规则](adjacent-site-discovery-lifecycle.md) · [API](../engine/adjacent-site-discovery-lifecycle.md) · [完整政策](../../data/catalogs/adjacent-site-discovery-policy-v1.json) · [来源](../sources/adjacent-site-discovery-lifecycle.json) · [schema](../sources/adjacent-site-discovery-lifecycle.schema.json)。B1固定到达／编成、B2相邻／10000与80门槛／新随机、B3完整12个月奖励、B4第3／4庙技能池／冻结offer与真实替换、B5 pending／幂等／独立保存均明确。发现全体成员XP10，cap全挡或同技能重学仍消费奖励。

来源是guide-observation与supplied事实；50阈值、LCG、cap、技能池和生命周期均明示synthetic。原概率／坐标／原池／writer仍E，人员native事务等X保留，原43／45不减。O13-A与B分开，O14城市事件及O15集成不由此关闭。全部仅静态撰写，未执行产品、示例、测试、typecheck、编译、build、checker、诊断或schema校验。

## 2026-10-17：固定单城探索与发现（O13-A）

[完整具体规则](city-search-lifecycle.md) · [API](../engine/city-search-lifecycle.md) · [policy](../../data/catalogs/city-search-policy-v1.json) · [source](../sources/city-search-lifecycle.json) · [schema](../sources/city-search-lifecycle.schema.json)。A1–A7覆盖固定域／费用、原始候选过滤、选人／新LCG、人才原值205、宝物参数新映射、稳定二读与金不足30不发、分支奖励、独立旬序及原子幂等完整重建。PR53／54／55三个有限核已发布，旧候选措辞保留其历史日期含义。

仅独立发现登记，不登用或写native ownership；listing数值核、请求段、攻略与新政策分层，原stock／RNG／writer仍E。O13-B移动相邻遗迹／庙已补[独立静态profile](adjacent-site-discovery-lifecycle.md)，不进入A命令集；O13整体及原43／45不关闭。只完成静态代码／规则／数据，未运行产品、示例、测试、typecheck、编译、build、checker、诊断或schema校验，历史通过结果不验证本批。

## 固定双城普通流言标量规则（O12-B）

[rumor-scalar-lifecycle.md](rumor-scalar-lifecycle.md)：200金/30AP、执行者每旬一次、内部synthetic odds、三人平均防守、关系保护、至多一人加空槽、义理阈值、分离loss、true byte/UI、独立旬序/RNG及原子幂等保存重算。[API](../engine/rumor-scalar-lifecycle.md) · [政策](../../data/catalogs/rumor-scalar-policy-v1.json) · [来源](../sources/rumor-scalar-lifecycle.json) · [schema](../sources/rumor-scalar-lifecycle.schema.json) · [未运行场景](../../data/scenarios/rumor-scalar-example-v1.json)。

具体公式/关系保护/平均防守/selector/义理/loss/RNG全是新政策；200/30与智力方向有官方依据，计略府10/12只有独立listing参数依据。原成功率E、完整原命令X；原被捕风险 unresolved-not-modeled，travel/failureDiplomacy/xpMeritTp未模拟、ownershipFrozen=true。PR83的O12-A已交付，整个O12及原43不关闭、不新增分母；未运行测试、typecheck、编译、build、checker、诊断、schema、产品或示例。

## 固定驻城自然忠诚与现金褒赏独立规则（O12-A）

[personnel-loyalty-lifecycle.md](personnel-loyalty-lifecycle.md)：100金/5AP每人、每旬一次、显示100拒绝与99→108、明确新现金5+roll5；季度仁政/关系豁免、returnedAl>25/义理野望/dislikes短路、人心掌握、两次loss及符节台/君主附加；真实byte、共享新xorshift、原子幂等与完整保存重算。[API](../engine/personnel-loyalty-lifecycle.md) · [政策](../../data/catalogs/personnel-loyalty-policies-v1.json) · [来源](../sources/personnel-loyalty-lifecycle.json) · [未运行场景](../../data/scenarios/personnel-loyalty-example-v1.json)。

这是限定软件服务，现金忽略魅力/义理的保真差异公开；无印Sourcenext/S-L观察不作PK概率证据。原global RNG、关系helper、writer及stock仍open；登用ownership、俘虏、欠薪后果和P078全部依赖排除。整个O12与原43不关闭；未新增或运行测试、typecheck、编译、build、checker、诊断、schema或产品。

## 已完成内政设施自动修复独立规则（O11-B）

[domestic-repair-lifecycle.md](domestic-repair-lifecycle.md)：标准设施身份/供应正HP、固定单母城与太守、9P半除及150..450夹值、工兵两支独立整数取整、设施中心两格敌情、实际cap写入/弃置/首次到满、有限旬输入与完整genesis保存重放。[API](../engine/domestic-repair-lifecycle.md) · [来源与固定政策](../sources/domestic-repair-lifecycle.json) · [结构schema](../sources/domestic-repair-lifecycle.schema.json) · [未运行场景](../../data/scenarios/domestic-repair-example-v1.json)。源listing、注释派生距离与服务writer分层；城市港关/堤坝/PK特殊楼/native与全局调度仍开放，原43不减。仅静态新增，没有执行验收。

## 标准设施建设与吸收独立规则（O11-A）

[facility-construction-lifecycle.md](facility-construction-lifecycle.md)：9类费用/耐久/TP、5类合法吸收与type映射、城心敌情/忙碌人员、精确速率/非HP工作量政策、完成奖励争议与16组政策、旧级效力/旧金粮核投影、有限日历及完整保存重放。含[API](../engine/facility-construction-lifecycle.md)、[来源](../sources/facility-construction-lifecycle.json)与未运行场景；本建设模块不覆盖维修，独立维修子域见上方O11-B；不关闭维修其余边界/PK特殊楼或原生证据债。

## 当前新增：O10-B单城商人即时交易（2026-10-17）

[完整具体规则](city-merchant-lifecycle.md)逐项写明12政治锚点、严格单调有理插值、买ceil/卖floor、sell-only4/5、20AP/每城每旬一次、两格敌情及盟友、整笔capacity拒绝、AP20/0/XP5、外部旬输入和保存重建。[API](../engine/city-merchant-lifecycle.md) · [完整来源/政策](../sources/city-merchant-lifecycle.json) · [未运行场景](../../data/scenarios/city-merchant-example-v1.json)。原135条listing存在，但helper/raw相场尺度/native writer未闭合；原43不减、O10-A/B仍非全财政。代码文档仅静态新增，未运行测试或产品，旧测试与旧food失败保留。

## 当前新增：O10-A固定单城有限财政（2026-10-17）

[完整规则正文](city-finance-lifecycle.md)包含全部字段、30槽设施映射、80官职月薪、金/粮原核逐步公式、四技能时点、旬月季年顺序、旧治安收入、逐笔cap/弃置、季降tape、足薪与不足整旬拒绝、特产binary32及完整保存重算。[API](../engine/city-finance-lifecycle.md) · [source/policy](../sources/city-finance-lifecycle.json) · [未运行场景](../../data/scenarios/city-finance-example-v1.json)。仅固定owner/完整普通有官薪名单、无俘虏的独立子域；所有者/调度/writer等仍provisional，不宣称全财政或native认证，原43不减。

代码及文档仅静态新增，没有运行测试/typecheck/编译/build/checker/诊断/产品或示例，旧测试未改。以下历史导航及历史数字不验证本树，各普通子集不能替代完整机制。

## 2026-10-17：普通话题牌独立舌战（O09b）

[完整字段、九牌表、公式、顺序、边界和保存规则](debate-topic-session-v1.md) · [API](../engine/topic-debate-session-v1.md) · [固定来源与完整policy](../sources/debate-topic-session-v1.json) · [未运行五轮纸面设计](../../data/scenarios/topic-debate-example-v1.json)。仅普通牌支持域；非终局stress100原子拒绝，终局先于愤激与补牌。现代参考状态机与E15公式证据分层；原43不减，五话术/四性格/再考/人物/平台/结束结算仍开放。本批代码文档静态新增，未运行任何测试或检查器。

## 2026-10-17：普通单挑独立session（O09a）

- [O09a三方针普通单挑独立session](duel-ordinary-session-v1.md)：完整输入域、全部公式、条件draw、顺序/writer/胜负、错误原子与重放；仅普通子集、现代转录参考，新增代码与纸面场景未运行，不关闭E14原生全链或原43组

## 2026-10-17：普通外交独立服务（O08）

[完整具体规则](ordinary-diplomacy-service.md)：亲善/同盟/停战三公式、严格阈值、方向关系与优先级、外交府及固定费用、普通失败即时退款、危险失败原子拒绝、同盟/停战转换、单旬期限与完整保存重放。[API](../engine/ordinary-diplomacy-service.md)、[来源与完整policy](../sources/ordinary-diplomacy-service.json)、[静态场景](../../data/scenarios/ordinary-diplomacy-example-v1.json)。公式为PK经验语料、精确build仍open；取整/失败/期限等明确provisional。未运行测试/编译/build/checker/产品/诊断；原43不减，旧默认food失败保留，P078及native任务/归属/返还/捕获与奖励应用不纳入。

# 当前工程规则入口

## 独立PK能力研究与培育

[完整规则](pk-ability-lifecycle.md)：48基础/50隐藏候选逐项表、显式5槽、真实两阶段Start/Advance、金/AP扣款、五维XP/六适性/单特技写回、共享次数预约与并行原子完成。[API](../engine/pk-ability-lifecycle.md)和[来源与完整政策](../sources/pk-ability-lifecycle.json)。明确guide/S1/provisional分层；本次仅静态代码文档，未执行测试/编译/build/checker/产品。旧默认food失败与43组证据口径保留，P078及native任务/归属/俘虏/取消链排除。

## 历史PR逐机制规则导航

[PR1–71规则正文定位表](historical-pr-rule-index.md)逐PR列出具体机制、正文和版本/证据边界；维护项明确无新增游戏规则。新增详细正文包括[训练运行与旬推进](training-runtime-policy.md)、[耗粮与手动补给](food-supply-lifecycle.md)、[编成与容量政策](unit-formation-policy.md)，以及下列完整有限事实：

- [45处港关所属](historical-subordinate-bases-catalog.md)
- [PK能力树48节点与50隐藏候选](historical-pk-ability-research-catalog.md)
- 史实事件：[Wiki逐观察](historical-scenario-events-atwiki-catalog.md)、[游民逐观察](historical-scenario-events-gamersky-catalog.md)、[66项映射与分歧](historical-scenario-events-inventory.md)
- 通用事件：[逐来源条件结果](historical-generic-events-catalog.md)、[未知与分歧](historical-generic-events-inventory.md)
- PS2史实：[观察1–32](historical-ps2-scenario-events-catalog-01-32.md)、[观察33–64](historical-ps2-scenario-events-catalog-33-64.md)、[版本限制与未决](historical-ps2-scenario-events-inventory.md)

这些是规则正文，不只列接口或外部数据链接；原数据与未知条件、冲突、版本等级仍保留。静态资料不因此可执行，原43主题不减。本次没有运行测试，历史默认全套失败不因文档补齐而消失。

更新：2026-10-16 UTC。工程实现状态和原作证据等级是两件事；以下入口保留各自的 provisional/有限支持域。

- [耗粮与手动补给规则](food-supply-lifecycle.md)：PR #69 已合并交付；ConsumeTurn/ManualSupply、容量/库存守恒、气力政策与边界正文；[接口合同](../engine/food-supply-lifecycle.md)。账户不等于原生部队，不实现真实移动到达或任务终结
- [编成与能力面板规则](unit-formation-policy.md)：PR #70 已合并交付；成员关系、五维/六适性、兵装/技术面板、容量与库存规则正文；[接口合同](../engine/unit-formation.md)。只返回独立规格，不创建部队、扣账或迁移人员
- [巡查、征兵与生产生命周期](city-command-lifecycle.md)：PR #71 已合并的独立服务；完整场景、具体算术与费用奖励、资源预约、跨旬与失败边界见专项页

- [独立技巧研究生命周期](technique-research-lifecycle.md)：新增Start/Advance研究服务，36项前置、实际扣款、参与指导、跨旬自动解锁/奖励/释放及重算持久化；两时间组与两功绩候选的provisional边界逐项说明。[接口合同](../engine/technique-research-lifecycle.md)与[工程API索引](../engine/README.md)。本次代码、静态示例和文档未运行验证

PR #69/#70 已完成各自此前版本的验收；这些历史结果不代表本次最终树重新运行过测试。本次只有静态整理，先前默认全套 food 文件失败仍未解决，详见[验证状态](city-command-lifecycle.md#validation-status)。P0-78 及依赖排除，原43组证据主题不减。

## 历史发布前记录与来源审计

以下保留各批次当时的“候选”“未发布”“最新”文字及通过数字，不作为当前交付状态，也不替代上方工程文档与本次验证状态。

2026-10-15 新独立工程候选：[每月特产兵装自动生产数量请求核](monthly-specialty-production.md)：明确设备1..4、30槽逐调用捕获与政治AL的可调用TS/Python核；opcode控制流与假定comment binary32/未知converter向零政策分层，非完整生产/实际入库/native认证。原43组未决证据主题不减，P0-78及依赖排除；本树全新验收另记，历史PASS不适用。

2026-10-14 新独立工程候选：[城市粮食收入非Easy稳定已解析输入投影](city-food-income-projection.md)，基于PR #60已合并main `57a2f4dd34d0d888b23d1e46e2cb78402b91a7b4`。固定160条/494 bytes和16+22 bytes两表、30槽与4种统一类型行；军屯农保留U32乘积低位后unsigned /15000，最后signed32向零/100支持负返回；difficulty0整个Easy分支拒绝。只补已有规则的工程覆盖，原43组未决证据主题不减。来源仅source-listing-reconstruction，不认证stock/Vanilla、真实helper/ABI、原表、city/owner、writer或scheduler，P0-78及依赖排除。实现和全新验收仅本地；正式聚合及独审结果另记，以下历史通过数字不验证本树，旧城市金钱179原run/证据保持不动。

2026-10-13 新独立工程候选：[城市金钱收入稳定已解析输入投影](city-money-income-projection.md)，基于已合并PR #59 main `4824cfa124c573f2e2762396b85e0bcc8042d2da`。完整来源150条/437 bytes及16+21 bytes跳表，固定30槽、有效类型统一产量行、升级回退、限定造币、难度与晚期uint8治安；逐路径拒绝signed32中间乘法溢出，不将无界公式冒充原返回。属于已知规则的补充工程覆盖债，旧43组未决证据主题不减为42。不实现前置city/owner门槛、原查表/邻接helper、真实入账、完整财政/月度调度或P0-78及依赖；stock、原表和真实游戏执行仍open。本树须完成全新验收与独审，旧通过数不验证本树；以下旧候选文字为各自发布前历史记录。

> 最新capture人员/城市容量来源与有界模型：[P0-49](84-capture-personnel-source-profile.md)；完整人员迁移、AI处分和stock等价仍开放。

2026-10-12 新独立工程候选：[俘虏自然逃亡roll参数纯整数核](captive-escape-roll-argument.md)，基于已合并PR #58 main `3db7dc80363454b56c2dd9d138ae285f50dadf29`。这是已有文档公式的来源绑定API，不是新概率发现：26条/77 bytes、入口BL/AL和晚期月份三个U8，完整0..255域参数最高108815，不clip100、不合并早期month gate、不接RNG/释放/状态/EndTurn。完整自然逃亡、getter/ABI、调度及stock仍open；00599AA0同期仅纠正“断粮人口”命名债。43组剩余是证据主题，非43个可直接实现的任务。原PR #58及之前各项已按各自边界交付；以下旧候选/通过数属历史记录，不验证本树。本候选全新验收与实际发布状态另记；P0-78及依赖新增实现继续排除。

2026-10-11 当前新增候选：[征兵数量显式ST0逐调用投影](recruitment-quantity.md)，基于已合并PR #56 main `aa751399544b65390ecfd66750c1362bba95a389`。131条/373所列字节；最多19个EAX捕获与独立ST0字段，最多21次typed调用收据，保留全loop无效N=1000、先技能后FIMUL、super先pressure及容量二次getter/32位回绕。仅pure caller数值核，不等于完整征兵、实际入库或stock认证。本树新验收/独审/发布另记；下方旧“最新/本地候选”与验证数字属历史冻结记录，不验证本树。P0-78及其依赖新实现持续排除。


2026-10-10 最新本地候选：[探索搜金caller整数投影](search-gold-caller.md)，基于已合并PR #54 main `cb76e148f35b519283cc296361b507674d0fff3a`。仅RNG返回后29条/82字节、逐调用点uint32观测与signed32分支；二轮getter仅裁剪时必填，不复用首轮，结果非实际奖励。人才PR #53、宝物参数PR #54已交付；以下旧“本地候选”及验收数字是各自历史冻结记录。本批新树单独验收、尚未发布；完整搜金/探索、RNG/helper/writer/stock仍open，P0-78及依赖排除。


新增本地候选：[探索宝物roll参数纯核](treasure-roll-argument.md)。已选候选的稳定uint8输入，12条/38字节，独立参数核；保留向零中间商，最低1，不执行004721D0。source-listing-reconstruction，不认证stock或完整搜宝；新验收另记，未发布。

新增[生产数量显式binary32限定核](production-quantity.md)：原88条/254字节、两套MOD隔离；signed32类型gate、三槽AL与完整skill EAX、显式factor bits，技能先倍/转换向零/超级后倍，无9000cap或1010最低值。设施选择/常量、callee、实际writer/完整命令及stock仍缺，本地候选未发布。

PR #50已交付[生产价格捕获输入整数核](production-price.md)：uint16保存原价、raw EAX只读AL；原45/113与MOD6/14隔离，EAX256不折/257折，无最低1。表/helper/完整扣费库存命令/调度/stock及跨版本仍缺。

新增[PK五维培育S1限定数值核](pk-stat-training-s1.md)：启动资格与完成算术分层，累计XP/3000裁剪与getter域显式；独立纯函数不接完整命令、原生98表或scheduler，clean-stock与其他版本仍open。

新增[P0-77 event9 live home getter](112-native-event9-home-getter.md)：004BA44C..45E direct troop08、live leader/saved person signed homeBaseId与numeric building pointer；raw44=-1非gate，不读building row/validity，26入口，presentation与45E..46C reaction继续观察；最新main全新124/124命令、28 model、25 source及继承链、双IDB/1329 raw和8 probes通过；2184文件/index全程一致，集成delta与终态独审通过。

新增[P0-76 event9 saved-troop原生raw44 reset](111-native-event9-troop-reset.md)：004BA442..44C单次saved troop live validity及raw44=-1 direct store；saved EBX force保持，25入口，presentation与44C..46C home/reaction继续观察；最新main全新122/122命令、34 model、20 source及继承链、双IDB/1327 raw和6 probes通过；2146文件/index全程一致，集成delta独审通过。

新增[P0-75 event9 saved-force原生reset](110-native-event9-force-reset.md)：004BA432..442固定saved force、单次live validity、有序raw94/raw98 direct stores；24入口，presentation与442..46C reaction继续观察；最新main全新120/120命令、34 model、17 source及继承链、双IDB/1323 raw和10 probes通过；1954文件/index全程一致，集成delta独审通过。

新增[P0-74 event9原生展示决策](109-native-event9-presentation.md)：saved force与live owner分离、原序可变virtual48/08决策；23入口和明确immutable-event域，presentation/reaction仍两段观察，temporary lifetime未闭合；最新main 118命令集合定点恢复后通过（首轮117/118，两次npm SIGKILL保留，semi16新配置通过）；42 model、26 source及继承链、双IDB/1317 raw和17 probes、集成delta独审通过，1766文件/index全程一致。

新增[P0-73 event9原生live部队选择](108-native-event9-selection.md)：saved-next heap-node遍历与live raw44/order/target，完整可变virtual effect-query；21继承加1新direct，presentation/reaction仍边界，engine预算非原作规则；最新main全新116/116命令、21+21+17/12/13 source、39 model、双IDB/1297 raw区间及18既有独审probe通过；1583文件/index冻结一致，集成delta独审通过。

新增[P0-72原生live位置与可变fallback](107-native-live-position.md)：base/troop/fallback pointer身份与后置DWORD读取、signed16坐标及fast path；显式新frame无fallback默认值，旧API及unknown债保留；21+17/12/13组source、32组model、双IDB及17组既有独审probe通过；114命令集合经定点恢复通过（首轮112/114），两次文件/index冻结分别核验，集成delta及单metadata pin例外独审通过；不是单轮全绿。

新增[P0-71原生部队成员判断](106-native-troop-membership.md)：live location、leader raw validity、signed deputy<1100与原生成员匹配；18入口/新troop frame，旧API和unknown边界保留；17+12/13组source、31组model、双IDB及8组既有独审probe通过；最新main全新112/112命令通过，文件/index冻结一致，集成delta独审无阻断。

新增[P0-70原生零退款tail距离](105-native-tail-distance.md)：同frame领土/源分离距离表、parent saved distance与live validity低byte写回；零新增原始机器码字节，旧API及其余证据债保留；12+13组source、29组model、双IDB及8组既有独审probe通过；最新main全新110/110命令通过，文件/index冻结一致，集成delta独审无阻断。

新增[P0-69 generic设施入口与早返](104-generic-facility.md)：004B40C0入口、generic87..16383共享frame归属与明确0/1结果；canonical完整观察及其余证据债保留；13+13组source、28组model、双IDB、9组既有独审probe通过；108命令集合经重试全过（首轮107/108，lifecycle以512MiB old-space上限重试成功，137原因未确认），集成delta独审无阻断。

新增[P0-68 live零退款取消9/10/12/22](103-live-zero-refund.md)：同frame gate/control与live return，精确presentation观察及其余证据债保留；13组source、28组model、双IDB和最新main106命令复验及集成delta独审通过。

新增[P0-67武将迁移与固定参数移动准备](102-officer-relocation.md)：004A8270、取消分派和004A7990原生组合，旧API不变；两个officer-relocation检查覆盖来源/模型，最新main104命令复验及集成独审通过。

新增[P0-66据点归属、耐久与event9/10](101-base-ownership-events.md)：归属/耐久/flags与源分离事件predicate，深层handler及部队反应保持明确可变边界。20项source、23项model与102命令全回归及独审通过；运行两项base-ownership检查。

# 三国志11规则总索引

> 目标：建立可直接驱动规则引擎的《三国志11》规则规范，并严格区分无印（Vanilla）与威力加强版（PK）。
> 更新日期：2026-10-08 UTC。

## 最新审计入口

新增[巡查治安增量限定数值核](patrol-security-gain.md)：公开005CBA10..005CBADB原79条/204字节与另列MOD7条/21字节隔离；稳定已解析1～3个uint8统率（首槽必有效）、城市byte和helper完整uint32 EAX，先/28+2、非零半减、严格>100上clip，保留负delta。首null不模拟原生gate0，helper/getter/资格/扣费/writer/技巧点/调度/stock仍缺；本地候选未发布，验收另记。

新增[内政建设速度限定数值核](domestic-construction-rate.md)：已找到完整公开005BB1D0..2AA正文；稳定uint8政治与uint16设施耐久给出 `max(maxPolitics+floor(sumPolitics/2),floor((D-floor(D/4))/9))`。星号MOD隔离，Wiki重建不等价；完整工期/初始writer/进度/完成调度/getter/stock仍缺。

新增[S1特技培育限定资格核](pk-skill-training-s1.md)：类别2分支的native signed32标量纯函数，完整caller/helper字节绑定；已有不同技能不阻挡，越界目标保留caller取反结果。不含完成/费用/调度，也不映射攻略ID；PR45五维与旧静态资料、运行时合同不变。

新增[PS2史实攻略独立资料](ps2-historical-event-source-data.md)：64观测/64独立ID、741来源节点；59条件结果（2仅接续）、4仅条件、1外链参照，保留24来源限制、PK归属未知及原生/运行时证据债。本次恢复数据后采用全新验收，不复用丢失的旧日志。

新增[所选通用事件攻略静态资料](generic-event-source-data.md)：Wiki31标题加游民2009两条，共33观测/31新资料ID；21空标题与10项未决问题保留，无引擎执行，旧史实105/66/41字节不变。

此前PR #42总表对账基于PR #36–41合并基线 `6095cc0cb16249988fbdbbdceb714441dba9efc0`。已交付：[港关静态所属](static-subordinate-bases.md)、[PK能力研究攻略树](15-pk-ability-research.md)、[所选史实资料](historical-event-source-data.md)，以及[训练沙盒CLI/私有重放/adapter证据合同](../engine/pk-training-lifecycle.md)修正。具体已交付/仍缺/下一证据见[STATUS](STATUS.md)与[缺口总表](../../缺少的数据.md)。

这些资料和工程修正没有扩成完整游戏：研究/史实执行、三城null分片、40,000格地图、原剧本数据、clean-stock/跨版本/全局RNG/运行时仍有缺口。训练gate/reset已有source-profile证据；战斗与计略的实测公式不提升成stock opcode-exact。P0-78及依赖capture/force/native事务的工作不在本轮；下方历史审计数字和冻结证据不变。

[港关静态所属城市](static-subordinate-bases.md)：45 个唯一据点（10 关、35 港）对应既有 42 城，逐行来源及所有城市数量一致；社区来源版本边界明确，三城开发分片仍未知，不涉及动态归属或事件执行。

新增[100-empty-legion-redistribution.md](100-empty-legion-redistribution.md)新增独立版本，展开空军团primary/nonprimary分派、source/destination合并方向、完整两次roster复制、live据点扫描与人员迁移调用、raw44-byte reset。primary fallback丢弃ordinal查找值而直接使用global ID2..8的原生控制流保留；nearest距离与S1/S2 RNG分开，S2三次共享页读要求逐调用观察。004AD550/004A8270仍是明确可变深层边界，force灭亡仍atomic defer；旧API、stock/Vanilla/全局RNG边界不变。`python scripts/check_empty_legion_source.py`、`python scripts/check_empty_legion_profile.py`。

新增[99-return-route-target-force.md](99-return-route-target-force.md)新增独立版本，直接执行005BA320任务分派/arg0与arg1/目标force君主live home/可选territory输出，以及00487EB0设施raw owner、领土city和canonical subtype势力链。两源地图byte分别固定，完整原生getter不再用whole-route/target-force观察；真实外部作用仍绑定full frame/callStack/RNG。新force rulerId和legion forceId与valid严格派生，旧API/trace不变。source未改表/固定vtable/不别名输出与可读map域明确；force灭亡/空军团/ruler/base/capture、其他event、stock/Vanilla/全局RNG仍open。`python scripts/check_return_route_target_force_source.py`、`python scripts/check_return_route_target_force_profile.py`。

新增[P0-63原生roster/role排序与capacity](98-native-roster-sort.md)：固定field0 key链、两种quicksort/一种merge、按实际比较序live读与两轮allocated筛选；capacity分别执行S1/S2标量路径，query377/278保留全frame/RNG可变观察。`python scripts/check_native_roster_sort_source.py`、`python scripts/check_native_roster_sort_profile.py`；旧API不变，一般flags/vtable、route/force/capture/stock继续open。

新增[P0-62原生return/list/role递归组合](97-recursive-officer-return.md)：每调用context stack保存native locals，正常非空角色event直接回到dispatcher/handler/return；count<2 sort闭合，多节点sort/route/target-force明确可变观察；灭亡/空军团/ruler路径原子defer。`python scripts/check_recursive_officer_return_source.py`、`python scripts/check_recursive_officer_return_profile.py`。

新增[P0-61共享frame单事务event8/14组合](96-mission-event-composition.md)：dispatcher直接调用已知handler/notification/return-tail primitives，保留copied/live/native saved locals，再执行004BA1D0空分支与fresh post-event observer。全部unknown边界可变观察或原子拒绝，旧API不变；完整return/list/role仍next。`python scripts/check_mission_event_composition_source.py`、`python scripts/check_mission_event_composition_profile.py`。

新增[P0-60通知门与零退款return尾](95-mission-notification-tail.md)：canonical通知资格、saved-pointer presentation、acted/dirty/可变observer/active尾追加/期间写序及S2 mutable query267。旧API不变，完整return/role/event待新版本组合。`python scripts/check_mission_notification_tail_source.py`、`python scripts/check_mission_notification_tail_profile.py`。

新增[P0-59 event8/14任务监听](94-mission-event-listeners.md)：44slot注册、live列表/任务分派、23/8与24/14 predicate及handler gate；成功tail用完整阶段观察或原子拒绝，绝不默认非干预。完整return/角色/后置observer仍open。`python scripts/check_mission_event_listener_source.py`与`python scripts/check_mission_event_listener_profile.py`。

新增[P0-58稳定非空军团/太守角色协调](93-legion-role-reconciliation.md)：独立004BE2A0稳定分支与004BCA30(refresh=0)，不同比较器、原roster顺序、live身份变化与event8/14阶段账本；完整监听/force/返回组合仍open。`python scripts/check_legion_role_source.py`与`python scripts/check_legion_role_reconciliation_profile.py`。

新增[P0-55能力培养任务取消](90-special-mission-cancellation.md)：41..43有序actor/建筑/98培养记录gate，无actual-location valid gate；home通知与troop/home=-1边界、独立原子API及重放。完整return/callback和stock仍open。`python scripts/check_special_mission_cancellation_profile.py`与`python scripts/check_special_mission_cancellation_evidence.py`。

新增[P0-54设施任务取消/销毁字段/宝物42](89-facility-mission-cancellation.md)：0/38 gate与返回、raw0x38精确写宽、S1/S2城市byte表差异、allocated-person home引用；base销毁及完整回调仍open。`python scripts/check_facility_mission_cancellation_profile.py`与`python scripts/check_facility_mission_cancellation_evidence.py`。

新增[P0-51人员游离/末城逃逸/任务取消](86-personnel-detachment-source-profile.md)：004BA520有向distance1候选与RNG阶段、004BBB00局部role写回及event时序、invalid-former/last-city入口、44项cancel注册分流及有界退款。S1/S2金cap和acted hook明确分离。`python scripts/check_personnel_detachment_profile.py`、`python scripts/check_mission_cancellation_profile.py`。完整force消亡/监听回调/其他专用取消仍open。

新增[P0-50旧俘虏释放/迁移/稳定排序](85-capture-relocation-source-profile.md)：前置链序、返回原势力、目的地分层/距离同分RNG、非瞬移actual-location语义、缺席home-roster与身份rank排序。有界独立投影、defer/reject与事件时序，`python scripts/check_capture_relocation_profile.py`。126范围/63对照；P0-50 v1未投影004BBB00/资源，后续P0-51另模块恢复部分范围；完整AI/force回调和clean stock仍open。

新增[P0-48 capture transaction](83-capture-transaction-source-profile.md)：完整有序世界候选、三caller cause/mode、normal/neutral scalar finalizer、普通入城资源与耐久投影、显式fallback及重放。`python scripts/check_capture_transaction_profile.py`。61个来源范围、24组S1/S2对照；source字节不等于stock证明，完整人物/force/事件链仍open。独立参考模型，未接入训练沙盒战斗。

新增运行入口：[PK训练生命周期v2](../engine/pk-training-lifecycle.md)。资格/行动重置/旬推进/累计WAR成长、显式迁移与十年重放；非完整游戏。`npm run check`、`npm run demo:lifecycle`。新增[P0-47 source审计](82-training-lifecycle-source-profile.md)与`../sources/training-lifecycle-source-profile.json`；两MOD关联样本明确分离，stock等价/完整scheduler和Vanilla仍open。

[当前审计总表](17-post-15-source-audit.md) · [状态](STATUS.md) · [P0-46据点陷落selector来源](81-capture-selector-source-profile.md) · [P0-2外交版本边界](37-diplomacy-version-boundaries.md)。

P0-46已恢复公开IDB的capture caller/候选/selector字节，但其输入路径含“血色5.0公测”。`opcode-exact`限定source profile/hash，stock PC-PK1.1仍open；PK采用为`compatibility-reconstruction`，Vanilla另为`compatibility-assumption`，主机版独立open。

A1–E2原审计全文和旧STATUS分别完整保存在 `audit-history/`，原blob复用，无历史段落丢失。历史快照不是当前进度指针。

相同平台/版本的面板规则，E3的明确分项运算优先于旧总规则或旧对照表中的宽泛缩写。E2的人物合成继续由 `04-military.md` 管理，E3静态参数在 `../sources/unit-panels.json`。参考校验命令：`python scripts/check_unit_panels.py`；该脚本不是原游戏EXE测试。

E4训练与气力以 `19-training-morale.md` 为当前专项规范；参考校验命令为 `python scripts/check_training_morale.py`。该脚本只验证解出的整数表达式与测试向量，不代替原游戏EXE回归。

E5兵粮消耗以 `20-food-consumption.md` 为当前专项规范；参考校验命令为 `python scripts/check_food_consumption.py`。粮尽逃兵仍保持实测层，不因基础耗粮公式已恢复而自动升级。

E6补给与输送以 `21-supply-transport.md` 为当前专项规范；参考校验命令为 `python scripts/check_supply_transport.py`。脚本只验证已确认的容量约束与气力加权样例，不代替尚未恢复的PC finalizer。

E7技巧系统以 `22-techniques.md` 为基础规范，结构化表为 `../sources/techniques.json`。E8版本差异以 `23-technique-patch-differences.md` 和 `../sources/technique-version-deltas.json` 覆盖；实现时必须区分 `rulesetVersion + patchVersion + fixProfile`，社区修复不得静默覆盖 fidelity。校验命令分别为 `python scripts/check_techniques.py` 与 `python scripts/check_technique_patch_profiles.py`。

E9兵粮袭击见 `24-food-raid.md`；E10应射以 `25-response-fire.md` 为当前专项规范，结构化证据为 `../sources/response-fire.json`，兼容判定校验命令为 `python scripts/check_response_fire.py`。

E11技巧研究时间以 `26-technique-research-time.md` 为当前专项规范，结构化证据为 `../sources/technique-research-time.json`；只保存已知阈值/锚点与人才府精确修正，不填满未知矩阵。

E12技巧研究完成功绩以 `27-technique-research-merit.md` 为当前专项规范，结构化冲突证据为 `../sources/technique-research-merit.json`。现行500/1000/2000/3000仅是当前Wiki候选，早期500/1000/1500/2500同时保留；Lv3/Lv4的PC-PK1.1 exact值不得冒充已确认。

E13混乱/伪报持续与恢复以 `28-status-duration-recovery.md` 为当前专项规范，结构化证据为 `../sources/status-duration-recovery.json`。PC-PK1.1自然恢复已确认是确定性倒计时：普通每旬-1、合资格阵系范围-2、到0恢复；普通计略初始duration和重复施放刷新语义仍保持open。

E14单挑连续公式以 `29-duel-continuous-formulas.md` 为当前专项规范，结构化参考为 `../sources/duel-continuous-core.json`。证据级别是固定现代 `translated-source-reference`；Defense dodge保留完整n、Spirit dodge与Defense/Spirit无敌取max(trunc(n/2),1)。原生PC-PK/PK1.1全链等价、stock/patch身份、人物及平台差异仍open；小范围参考回归不减少原43组。

E15舌战普通牌心理伤害以 `30-debate-psychological-damage.md` 为当前专项规范，结构化证据为 `../sources/debate-psychological-damage.json`。牌力只决定胜负，心理伤害另走智力attack×牌等级×话题系数×愤激系数；大喝、诡辩、无视/镇静/激昂边界已拆开。

E16非骑战法来源的负伤/战死以 `31-non-cavalry-casualty-sources.md` 为当前专项规范，结构化证据为 `../sources/non-cavalry-casualty-sources.json`。普通击破统一伤亡roll已撤回；弩系狙伤、猛者、业火、骑兵与单挑按来源分流。

E17地形伤害随机值以 `32-terrain-hazard-damage.md` 为当前专项规范，结构化证据为 `../sources/terrain-hazard-damage.json`。栈道100～299/格与毒泉200～399/格已源码级闭合；落石专用参数与踏破×0.1已恢复，但common50 finalizer仍open。

E18普通君主继承以 `33-ruler-succession-priority.md` 为当前专项规范，结构化证据为 `../sources/ruler-succession-priority.json`。历史事件、玩家普通死亡、COM自动继承三路已分离；COM血缘>义兄弟>配偶>年长者为empirical-high，组内tie与004B9080函数体仍open。

E19评定完整提案池以 `34-council-proposal-pool.md` 为当前专项规范，结构化证据为 `../sources/council-proposal-pool.json`。原版评定MSG恢复22类具体案和两阶段多选采决；chooser、参与者过滤与采纳案执行链仍open。

E20委任AI权重/决策架构以 `35-delegated-ai-architecture.md` 为当前专项规范，结构化证据为 `../sources/delegated-ai-architecture.json`。统一utility表假设已撤回；战争AI恢复为hard gate+概率+局部selector的procedural架构，城市内政scheduler仍open。

P0-1普通登用概率exactness以 `36-hiring-probability-exactness.md` 为专项记录，结构化证据为 `../sources/hiring-probability-exactness.json`。004AFD60外层与normal/nonzero模式已源码级收窄；005C4F80本体仍open，现代SIRE登用意愿公式已隔离为MOD-only。

P0-2外交公式版本边界以 `37-diplomacy-version-boundaries.md` 为专项记录，结构化证据为 `../sources/diplomacy-version-boundaries.json`。Vanilla 1.1友好度与1.2外交成功率补丁边界已官方锁定；现有完整公式绑定PK-era corpus，Vanilla复用必须标compatibility assumption。

P0-3攻城统一公式与据点接管资源以 `38-siege-capture-exactness.md` 为专项记录，结构化证据为 `../sources/siege-capture-exactness.json`。城兵共用005ADC30、耐久外层链与004B329B资源最低5%保留已收窄；005ADDC0/005ADE20内部函数体仍open。

P0-4火焰持续/自然蔓延以 `39-fire-lifetime-spread-exactness.md` 为专项记录；会心持续+1与自然邻格蔓延关闭已固定，基础寿命RNG仍open。

P0-5登场/自然死亡以 `40-debut-death-exactness.md` 为专项记录，结构化证据为 `../sources/debut-death-exactness.json`；月初`005833D0`入口、史实/假想登场与寿命模式语义已收紧，内部死亡函数仍open。

P0-6非自然忠诚变动以 `41-nonnatural-loyalty-exactness.md` 为专项记录，结构化证据为 `../sources/nonnatural-loyalty-exactness.json`；PC-PK月俸整笔支付/整笔不支付事务已闭合，褒赏增量与流言目标/掉忠函数仍open。

P0-7俘虏释放以 `42-captive-release-exactness.md` 为专项记录，结构化证据为 `../sources/captive-release-exactness.json`；资金不足释放人数与 comparator/list/finalizer 架构已闭合，`0058C320` 排序语义、主动释放技巧P exact 与各 release path 的禁仕 side effect 仍open。

P0-8自动官职 selector 以 `43-auto-office-selector-exactness.md` 为专项记录，结构化证据为 `../sources/auto-office-selector-exactness.json`；`005FAF00` 单官职评分和同分 first-wins 已闭合，并纠正 `005FA650` 为 office classifier；caller 列表顺序和多官职 scheduler 仍open。

P0-9部队资源事务以 `44-troop-resource-transaction-exactness.md` 为专项记录，结构化证据为 `../sources/troop-resource-transaction-exactness.json`；战斗/输送容量与draft函数边界、transport普通兵装100000上限及resource primitives已收紧，原commit/return finalizer仍open。

P0-10主副将关系/FPU取整以 `45-deputy-rounding-exactness.md` 为专项记录，结构化证据为 `../sources/deputy-rounding-exactness.json`；`00707A74` 已识别为MSVC `_ftol2`，正值最终floor闭合；普通/亲爱PC指令精确，血缘/3仍保留PC opcode gap。

P0-11训练/气力以 `46-training-morale-exactness.md` 为专项记录，结构化证据为 `../sources/training-morale-exactness.json`；训练gate边界、每回合一次cadence及`0059A230`野外恢复local handler已收紧，reset/top scheduler xref仍open。

P0-14技巧研究时间以 `49-technique-research-time-exactness.md` 为专项记录，结构化证据为 `../sources/technique-research-time-exactness.json`；`005D7DD0` calculator、人才府-20日/最低10日已收紧，完整难度矩阵仍open。

P0-15技巧研究完成功绩以 `50-technique-research-merit-exactness.md` 为专项记录，结构化证据为 `../sources/technique-research-merit-exactness.json`；`005D8F68` 仅锁定研究命令/AP路径，公开逆向功绩地址表未暴露研究完成常量，因此Lv3/Lv4两套表冲突继续open，禁止伪造Vanilla→PK改值。

P0-16兵粮袭击caller以 `51-food-raid-caller-exactness.md` 为专项记录，结构化证据为 `../sources/food-raid-caller-exactness.json`；防御技能将兵损置0后 caller 仍调用 `005ADB20`，food raid 与 troop damage 字段分离；helper 内部RNG与资源裁剪仍open。

P0-17应射/连击方向性以 `52-response-fire-double-strike-exactness.md` 为专项记录，结构化证据为 `../sources/response-fire-double-strike-exactness.json`；`00586E12` 明确压掉主动方对弩兵间接攻击的连击，`00586F0F` 明确支援攻击不连击且战法失败后的普通攻击仍可连击；还射自身连击保持empirical-high，完整`00584DC8` caller仍open。

P0-18火焰寿命setter边界以 `53-fire-lifetime-setter-boundary.md` 为专项记录，结构化证据为 `../sources/fire-lifetime-setter-boundary.json`；`00486320/00495CA0` 只确认着火状态查询，未恢复寿命setter/reignite helper，`00599CF0` 继续不能冒充火焰ticker。

P0-19登场/自然死亡生命周期层级以 `54-death-lifecycle-layer-boundary.md` 为专项记录，结构化证据为 `../sources/death-lifecycle-layer-boundary.json`；月初`005833D0`、`0048A000 GetDeathYear`、`00489160 IsMarkedForDeath`、HealthLevel与最终DEAD identity分层确认，内部transition仍open。

P0-20俘虏 forced-release 排序/裁剪以 `55-captive-forced-release-ordering-boundary.md` 为专项记录，结构化证据为 `../sources/captive-forced-release-ordering-boundary.json`；`0058C320` comparator 先经 `004AA200` 一次排序，`004A8E10` 再以无索引参数固定缩减列表，直到恰好 releaseCount；comparison key 与删头/删尾仍open。

P0-21现金褒赏忠诚以 `56-cash-reward-loyalty-boundary.md` 为专项记录，结构化证据为 `../sources/cash-reward-loyalty-boundary.json`；`005B5D60` 为执行 containing function，`0048A770 SetLoyalty(0..255)` 与 `004A6CF0 ModifyPersonLoyalty(delta)` 证明 true loyalty 与UI100分层；增量RNG/魅力/义理公式仍open。

P0-22欠薪忠诚以 `57-salary-shortfall-loyalty-boundary.md` 为专项记录，结构化证据为 `../sources/salary-shortfall-loyalty-boundary.json`；`0058D5E0` 逐欠薪据点准备并写入跨据点累计容器，`0058C190` 在全部设施扫描后统一finalize；selector与每人掉忠公式仍open。

P0-23流言 effect helper 以 `58-rumor-effect-helper-boundary.md` 为专项记录，结构化证据为 `../sources/rumor-effect-helper-boundary.json`；流言成功计算listing在`005D05AD`前返回，随后`005D05B0`与`005D05F0`是两个独立函数；原完整成功率/helper/RNG及sar文本宽度冲突仍open，后续selector/忠诚/治安业务角色未证。O12-B另有明确synthetic有限软件服务，不提升原证据。

P0-24宝物授予/没收忠诚以 `59-treasure-loyalty-opcode-boundary.md` 为专项记录，结构化证据为 `../sources/treasure-loyalty-opcode-boundary.json`；TreasureValue `+0x3C`、宝物owner/city setter、state setter与`004A6CF0 ModifyPersonLoyalty`独立，确认ownership/state mutation与loyalty side effect分层；gain=value与没收-30仍非opcode exact。

P0-25普通登用成功率签名以 `60-hiring-success-rate-signature-boundary.md` 为专项记录，结构化证据为 `../sources/hiring-success-rate-signature-boundary.json`；`005C4F80` 精确签名为 `(targetPtr, executorPtr, mode, dateKey)`，忠诚/魅力/相性差并非显式标量参数；`005BA4C0` 的7个deterministic输入与success-rate函数输入已明确分层。

P0-12阵系耗粮/粮尽以 `47-food-overlap-starvation-exactness.md` 为专项记录，结构化证据为 `../sources/food-overlap-starvation-exactness.json`；阵/砦/城塞单一selector、float32常量与不叠乘已闭合，overlap winner与starvation原函数仍open；旧0.76降为legacy-only。

P0-13补给/输送finalizer以 `48-supply-transport-finalizer-exactness.md` 为专项记录，结构化证据为 `../sources/supply-transport-finalizer-exactness.json`；`004BF522` 已归入 `sub_4BF1F0`，到达满仓overflow丢弃行为与野外补给target-cap语义已收紧，troop气力非整除rounding和field-supply finalizer仍open。

## 版本标记

- `[COMMON]`：无印与 PK 共通。
- `[VANILLA]`：仅无印，或无印数值/行为与 PK 不同。
- `[PK]`：仅威力加强版新增或改变。
- 平台（PC / PS2 / Wii）有差异时单独标注。
- 少数 PC 规则还存在补丁差异（例如 Ver1.0 与后续版本），需额外记录 `patchVersion`。

## 证据等级

- **已证实**：游戏数据、官方/准官方资料，或多个可靠来源互证。
- **实测可信**：长期玩家实测/攻略 Wiki 结果稳定，但未取得内部公式。
- **临时采用**：原作机制存在，但精确内部公式未知；为引擎闭环采用确定性规则，必须和原作事实分开。
- **缺静态数据**：规则明确，但尚缺完整地图、剧本等数据文件。
- **参考模型已验证**：数据/参考算法通过测试，不等于已对原游戏EXE或存档完成验证。

## 模块

1. `00-turn-scenario.md` 时间、回合、难度、势力行动顺序、剧本
2. `01-map.md` 六角地图、地形、移动、港关、水战、ZOC
3. `02-economy.md` 收入、内政设施、商人、行动力、灾害
4. `03-personnel.md` 武将生命周期、关系、忠诚、登用、俘虏、官职
5. `04-military.md` 征兵、兵装、编成、训练、补给、技巧
6. `05-combat.md` 攻防、战法、伤害、攻城、火、异常、伤亡
7. `06-strategy.md` 战场计略、城市计略
8. `07-diplomacy.md` 亲善、同盟、停战、交换俘虏、劝降
9. `08-ruler-corps.md` 汉帝、爵位、继承、军团、灭亡、统一
10. `09-events.md` 通用事件、历史事件、遗迹与庙
11. `10-duel.md` 单挑
12. `11-debate.md` 舌战
13. `12-pk.md` PK 专属系统总表
14. `13-open-exactness.md` 尚缺精确内部公式与引擎临时采用值
15. `14-evidence-audit-2026-09-29.md` 证据审计与升级记录
16. `15-pk-ability-research.md` PK 能力研究机制、48节点完整基础图与50隐藏候选数据；来源冲突、开局RNG和命令/scheduler仍有明确边界
17. `16-unresolved-rules-fallbacks.md` 15项未决规则逐项核对与引擎 fallback
18. `17-post-15-source-audit.md` 后续逐点审计当前总表与历史记录入口
19. `18-unit-panels.md` E3兵种基础参数、面板公式、修改器隔离和测试边界
20. `19-training-morale.md` E4训练闭式、气力上限、军乐/奏乐/诗想与气力特技
21. `20-food-consumption.md` E5旬级兵粮消耗、阵系减粮、着火烧粮与粮尽边界
22. `21-supply-transport.md` E6补给/输送路径、补兵约束、气力混合与平台差异
23. `22-techniques.md` E7 36技巧ID、研究成本、效果分层与证据等级
24. `23-technique-patch-differences.md` E8 Vanilla/PK补丁链、技巧版本差异、原BUG与社区修复profile
25. `24-food-raid.md` E9兵粮袭击触发路径、数量模型与RNG边界
26. `25-response-fire.md` E10应射箭类触发、射程/地形/支援边界与平台差异
27. `26-technique-research-time.md` E11技巧研究时间分档、人才府修正与证据矩阵
28. `27-technique-research-merit.md` E12技巧研究完成功绩冲突表、版本边界与PC exact缺口
29. `28-status-duration-recovery.md` E13混乱/伪报状态计数、每旬恢复、阵系加速与初始duration边界
30. `29-duel-continuous-formulas.md` E14单挑连续公式的固定现代转录参考与原生未证边界
31. `30-debate-psychological-damage.md` E15舌战牌力、心理伤害、怒气与话术反弹连续公式
32. `31-non-cavalry-casualty-sources.md` E16弩系狙伤、猛者、业火与普通击破武将伤亡来源分流
33. `32-terrain-hazard-damage.md` E17栈道、毒泉、落石随机伤害与免伤边界
34. `33-ruler-succession-priority.md` E18历史/玩家/COM君主继承路径与自动后继类别优先
35. `34-council-proposal-pool.md` E19君主评定22类具体提案、两阶段采决与chooser边界
36. `35-delegated-ai-architecture.md` E20委任/COM AI procedural架构、出兵gate/概率与局部主将评分
37. `36-hiring-probability-exactness.md` P0-1普通登用原版外层判定链与005C4F80未决边界
38. `37-diplomacy-version-boundaries.md` P0-2 Vanilla补丁外交边界、PK公式corpus与版本profile
39. `38-siege-capture-exactness.md` P0-3攻城耐久调用链、城兵共用核心与陷落资源保留公式
40. `39-fire-lifetime-spread-exactness.md` P0-4火焰寿命会心+1、基础RNG边界与自然邻格蔓延隔离
41. `40-debut-death-exactness.md` P0-5月初生命周期入口、登场/寿命profile与死亡内部函数边界
42. `41-nonnatural-loyalty-exactness.md` P0-6褒赏、月俸欠薪与流言忠诚效果边界
43. `42-captive-release-exactness.md` P0-7资金不足俘虏释放人数/选择管线、主动释放技巧P与禁仕路径冲突
44. `43-auto-office-selector-exactness.md` P0-8自动封官单官职评分、first-wins同分与caller列表边界
45. `44-troop-resource-transaction-exactness.md` P0-9出征/输送draft容量、资源守恒、100000兵装上限与finalizer边界
46. `45-deputy-rounding-exactness.md` P0-10主副将关系除数、_ftol2取整与剩余PC opcode边界
47. `46-training-morale-exactness.md` P0-11训练gate/reset cadence与0059A230野外气力恢复
48. `47-food-overlap-starvation-exactness.md` P0-12阵系耗粮重叠与粮尽逃兵边界
49. `48-supply-transport-finalizer-exactness.md` P0-13补给/输送finalizer与气力加权
50. `49-technique-research-time-exactness.md` P0-14研究时间calculator、人才府减时与难度边界
51. `50-technique-research-merit-exactness.md` P0-15技巧研究完成功绩caller、两套表冲突与参与者分配边界
52. `51-food-raid-caller-exactness.md` P0-16兵粮袭击caller、零伤害与反击绕过边界
53. `52-response-fire-double-strike-exactness.md` P0-17应射caller、主动/防守连击方向性与支援边界
54. `53-fire-lifetime-setter-boundary.md` P0-18火焰寿命setter、状态查询与重复点火边界
55. `54-death-lifecycle-layer-boundary.md` P0-19登场/自然死亡RNG层级、死亡年/flag/健康/DEAD边界
56. `55-captive-forced-release-ordering-boundary.md` P0-20俘虏forced-release comparator排序与固定方向裁剪边界
57. `56-cash-reward-loyalty-boundary.md` P0-21现金褒赏true-loyalty写回primitive与RNG公式边界
58. `57-salary-shortfall-loyalty-boundary.md` P0-22欠薪prepare/accumulate与月度batch-finalizer边界
59. `58-rumor-effect-helper-boundary.md` P0-23流言success/effect函数分层与target-selector边界
60. `59-treasure-loyalty-opcode-boundary.md` P0-24宝物授予/没收ownership-state与loyalty side-effect边界
61. `60-hiring-success-rate-signature-boundary.md` P0-25普通登用005C4F80四参数签名与内部输入边界
48. `47-food-overlap-starvation-exactness.md` P0-12阵系耗粮bit-exact、重叠不叠乘与粮尽逃兵证据降级
49. `48-supply-transport-finalizer-exactness.md` P0-13野外补给、输送抵达函数范围、overflow与气力加权边界

## 来源优先级

1. 游戏数据 / 官方攻略资料
2. 可明确区分原指令与修改指令的逆向记录
3. 游民星空《三国志11》专题资料
4. 日文《三國志11攻略wiki》
5. 仓库已有 `docs/sources/*.md`
6. 单一玩家经验帖仅作候选

## 版本核心差异（先记住）

- **无印已经有 8 系技巧**：枪、戟、弩、骑、练兵、发明、防御、火攻。
- **PK 新增第 9 系：内政系技巧**（木牛流马、港关扩张、政令整备、人心掌握）。
- **PK 新增能力研究**。
- **PK 新增吸收合并**（同类设施 Lv1→Lv2→Lv3）。
- **PK 新增 10 类内政设施**：大市场、鱼市场、黑市、军屯农、练兵所、符节台、军事府、人才府、外交府、计略府。

## 冲突处理

1. 先分版本，不允许 PK 规则覆盖无印。
2. 同版本内：游戏数据/官方 > 已区分原版与修改的逆向 > 可复现实测 > 单篇攻略。
3. 找不到精确公式时保留“原作未知”，另写“引擎临时采用值”。
4. 找到更可靠证据时只替换临时采用项；不得把修改器的新增公式冒充原作。


P0-26 `005BA410` 共享数值 helper 以 `61-shared-numeric-helper-005ba410-boundary.md` 为专项记录，结构化证据为 `../sources/shared-numeric-helper-005ba410-boundary.json`；它同时被 `005C4F80` 登用成功率与 `005D052C` 流言成功率调用，因此不能再建模为 hiring-only 公式；完整 body 与输入业务语义仍 open。


P0-27 `005BA4C0` deterministic generator 以 `62-hiring-deterministic-generator-boundary.md` 为专项记录，结构化证据为 `../sources/hiring-deterministic-generator-boundary.json`；函数仅约0x30字节，普通登用七参数输入与 `< successRate` 判定已锁定，非0 mode 则走 `004721D0` runtime probability；具体混合算法与返回范围仍 open。


P0-28 `004AF7D0` hard recruitment gate 以 `63-hard-recruitment-gate-boundary.md` 为专项记录，结构化证据为 `../sources/hard-recruitment-gate-boundary.json`；函数通过 handled-return + out-result 短路 forced success/fail，只有未命中才进入 `005C4F80`，因此关系/禁仕条件不是概率修正；内部优先级仍 open。


P0-29自动封官跨官职scheduler以 `64-auto-office-scheduler-boundary.md` 为专项记录，结构化证据为 `../sources/auto-office-scheduler-boundary.json`；`005FAF00` 只负责单官职selector，candidate list由caller传入，官职遍历、候选构造、winner写回与后续移除均属于尚未恢复的上层scheduler。


P0-30 `005FA4D0` 任官资格 helper 以 `65-auto-office-qualification-helper-boundary.md` 为专项记录，结构化证据为 `../sources/auto-office-qualification-helper-boundary.json`；helper 只做 `(person, office)` 资格判定且发生在评分前，忠诚90 gate 明确在其外部；功绩门槛与所在/身份/任务等内部规则仍待 body 恢复。


P0-31 `005FA650` office classifier 以 `66-office-classifier-entry80-boundary.md` 为专项记录，结构化证据为 `../sources/office-classifier-entry80-boundary.json`；classifier 边界与 `struct_office[81]` 已锁定，index80 确认为真实原数组成员；0..79分类模式仍为高置信逆向推断，index80 类型与用途继续 open。


P0-32部队资源事务 finalizer 以 `67-troop-resource-finalizer-boundary.md` 为专项记录，结构化证据为 `../sources/troop-resource-finalizer-boundary.json`；据点/部队资源 adjust functions 只确认到单项 primitive，不能冒充出征commit或回城return finalizer；事务顺序、rollback与return caller继续open。


P0-33主副将血缘 `/3` PC opcode 以 `68-deputy-blood-third-pc-opcode-boundary.md` 为专项记录，结构化证据为 `../sources/deputy-blood-third-pc-opcode-boundary.json`；`00495AB0..00495B8F` 边界、普通 `/4` 与亲爱 `/2` 的 PC opcode 保持 exact，血缘 `/3` 继续只标 PS2 empirical-exact / cross-platform-high，PC 指令仍 open。


P0-34训练 reset / top scheduler xref 以 `69-training-reset-scheduler-boundary.md` 为专项记录，结构化证据为 `../sources/training-reset-scheduler-boundary.json`；训练 reset 行为语义与 `0059A230` local morale handler 边界已锁定，但 setter(value=0) caller 与 top-level morale scheduler xref 仍 open，禁止按地址邻近猜调用链。


P0-35阵系 overlap / starvation 原函数边界以 `70-food-overlap-starvation-function-boundary.md` 为专项记录，结构化证据为 `../sources/food-overlap-starvation-function-boundary.json`；`0049D180` single-selector 边界已锁定，重叠不叠加继续 exact；粮尽 troop-loss handler 地址/body 仍未找到，`00599AA0` 明确排除，0.76继续 legacy-only。


P0-36补给/输送气力非整除 rounding 以 `71-morale-weighted-merge-rounding-boundary.md` 为专项记录，结构化证据为 `../sources/morale-weighted-merge-rounding-boundary.json`；`004B9840` building morale merge helper 边界已锁定，兵力加权核心保持 high-confidence，但 building/troop 非整除 rounding 与 troop→troop helper 继续 open，禁止无 xref 套用 `_ftol2`。


P0-37技巧研究时间难度矩阵以 `72-technique-research-difficulty-matrix-boundary.md` 为专项记录，结构化证据为 `../sources/technique-research-difficulty-matrix-boundary.json`；`005D7DD0` calculator 边界与 `DifficultyLevel` 场景字段已锁定，但 calculator 是否读取难度仍无 xref；Super 70/140/210/280 保持 empirical-high，Beginner/Advanced 矩阵继续 open。


P0-38技巧研究完成功绩 writer 以 `73-technique-research-completion-writer-boundary.md` 为专项记录，结构化证据为 `../sources/technique-research-completion-writer-boundary.json`；`00599CF0` 的技巧研究段只做倒计时，不在归零时调用 completion handler；能力研究则显式 `005CE600` 完成处理，因此技巧研究 writer 必在另一条链上，participant distribution 与两套功绩表冲突继续 open。


P0-39火焰寿命 base RNG / setter 候选以 `74-fire-lifetime-rng-setter-candidate-boundary.md` 为专项记录，结构化证据为 `../sources/fire-lifetime-rng-setter-candidate-boundary.json`；两个 fire-state query 边界已锁定且不能冒充 lifetime setter，setter 搜索范围收窄到火计/火矢/火陷阱成功点火执行链，base RNG / reignite / critical+1 opcode继续open。


P0-40应射/还射 caller / 连击递归深度以 `75-response-fire-recursion-boundary.md` 为专项记录，结构化证据为 `../sources/response-fire-recursion-boundary.json`；`00584DC8` 与 `00586E12/00586F0F` 已分别归入两个不同 containing function，应射 helper 与攻击/连击 core 分层确认，但二者 xref、response re-entry 与最大 chain depth 继续 open。


P0-41兵粮袭击 `005ADB20` helper 以 `76-food-raid-helper-boundary.md` 为专项记录，结构化证据为 `../sources/food-raid-helper-boundary.json`；helper 边界、caller寄存器契约和techId=1检查位置已锁定，但RNG、Attack×R精确算术以及双方粮食clamp顺序继续open。


P0-42攻城耐久 `005ADDC0 / 005ADE20` inner helper 以 `77-siege-durability-inner-helper-boundary.md` 为专项记录，结构化证据为 `../sources/siege-durability-inner-helper-boundary.json`；两个基础helper边界、3参数调用形态、x87浮点返回与外层倍率后置均已锁定，helper内部公式和x87小值边界继续open。


P0-43兵临城下出城 / AI 3格与1.2倍规则以 `78-ai-defense-sortie-boundary.md` 为专项记录，结构化证据为 `../sources/ai-defense-sortie-boundary.json`；旧“3格+1.2倍兵力比”已撤回为不受支持的 legacy fallback，AI 出兵必须走已逆出的多阶段 procedural pipeline；固定3格守城trigger仍open。


P0-44历史据点陷落 takeover reset 审计以 `79-facility-takeover-reset-boundary.md` 为专项记录，结构化证据为 `../sources/facility-takeover-reset-boundary.json`；`00487E20` 耐久 setter 与 `004B329B` 资源保留路径已分层，资源保留 exact，但两种陷落入口的 reset writer、10%耐久重置与守兵归零保留耐久都继续 open。


P0-45历史内政设施保留 selector 审计以 `80-retained-facility-selector-boundary.md` 为专项记录，结构化证据为 `../sources/retained-facility-selector-boundary.json`；魅力决定保留1–5座的档位继续 empirical-high，但具体 selector/RNG 仍 open，`004BA610` 与 `004B329B` 均已排除为该 selector。

P0-46当前capture selector以 `81-capture-selector-source-profile.md` 为专项记录，结构化证据为 `../sources/capture-selector-source-profile.json`。`004B2CA0` containing body及三caller、city-only gate、全局链表前30完成普通内政候选、魅力byte除20、全范围n次交换/RNG与销毁前缀已在固定source profile恢复；完成铜雀台另行跳过，新势力ID超0..41在shuffle后全毁。旧“100+固定5”和均匀sample不代表该source算法；stock等价、完整finalizer与跨版本仍open。局部模型/trace/replay校验：`python scripts/check_capture_selector_profile.py`；不代表原EXE或整引擎回归。

P0-47训练生命周期审计以`82-training-lifecycle-source-profile.md`为准：source gate/parameter/officer helpers、累计XP3000、普通growth1..100、PK研究共享XP、reset全局loop/noncontiguous tails和野外气力tail-xref已恢复；stock等价/完整AP与scheduler顺序仍未证实。实现是带配置/证据/重放的限定兼容模型。

P0-52专用零退款取消以[87-mission-cancellation-zero-refund.md](87-mission-cancellation-zero-refund.md)为准：9/10/12/22/23/24的ordered gate与零退款返回/reset有界投影，独立v2保留v1重放语义；组任务/设施/研究与完整return/callback仍open。

P0-53组任务取消以[88-group-mission-cancellation.md](88-group-mission-cancellation.md)为准：2/5按ID序前三人、signed city计数/force研究字段先于逐人返回，S2研究扩展单独绑定；独立新API保留v1/v2历史trace。

P0-54以[89-facility-mission-cancellation.md](89-facility-mission-cancellation.md)为准：0/38有独立有界投影；旧v1/v2/group语义不变，stock/Vanilla未验证。

P0-55以[90-special-mission-cancellation.md](90-special-mission-cancellation.md)为准：41..43共享handler有独立有界投影，无actual-location valid gate；旧模块/trace不变，完整return与stock仍open。

P0-56以[91-return-mission-lifecycle.md](91-return-mission-lifecycle.md)为准：mission37完成与单active-list成员的一步推进已有独立有界投影，退款先于reset、direct acted尾部、源分离距离/金cap、显式安全域与零local RNG重放；完整return/全链表与scheduler仍open。

P0-57以[92-officer-return-finalizer.md](92-officer-return-finalizer.md)为准：004BF6F0四字段及完整列表/role调用顺序已有独立有界投影，ruler ownership原子defer；004BE2A0稳定非空军团角色协调为下一主题，完整callback/force/stock/Vanilla仍open。

P0-58以[93-legion-role-reconciliation.md](93-legion-role-reconciliation.md)为准：原下一主题稳定军团与refresh=0太守标量协调已有独立有界API；事件监听、force灭亡/空军团及完整返回/capture仍open。


## 2026-10-11 生产耗时独立caller投影

已新增本地候选 `calculateProductionTimeProjection` / `production-time-observations-v1`（说明：production-time.md）。仅固定listing与逐调用观测驱动的整数/trace；全无效返回9、type9跳扫描、重复validity/设施解析独立、允许负数和零、技能向零减半。真实helpers/ABI/对象可变读取/命令/库存writer/完成调度/实际日数/stock仍open；未覆盖P0-78及依赖。新树验收和发布状态外部收据单列，不复用PR #55历史通过。

## 独立官职分配服务（2026-10-16）

[完整规则正文](office-assignment-service.md)记录全部80个一般官职、10个分离爵位元数据、六分支评分、资格/爵位门、稳定调度、即时移出、fill/rebuild及原子状态保存重放。[来源manifest](../sources/office-assignment-service.json)区分4000功绩表证据与005FA4D0 body-open；[API](../engine/office-assignment-service.md)提供真实可提交接口。此工程服务不关闭64/65/66的原生证据债。本次只做静态代码/文档，不执行测试或编译类检查。

## 巡察内部兼容抽取

[城市命令规则的巡察兼容说明](city-command-lifecycle.md#private-patrol-compatibility-extraction)与[工程合同](../engine/city-patrol-phase.md)记录原100金/20AP、原奖励/零收益政策、supplied压力及完整审计的私有抽取。旧政策域、公共保存和预算不变；仅静态分析，原生helper/writer/调度与stock证据边界继续保留。

