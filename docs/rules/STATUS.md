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

## 2026-10-19：单锻冶厂建设与普通生产同账本

[规则](bounded-forge-development-production.md)与[七API](../engine/bounded-forge-development-production.md)新增独立有限profile：单城唯一空地块建设、同一设施ID完成后普通生产、一次根clock/AP恢复、真实资源与当前人物／TP写入、预约和完整历史重算。原服务不迁移或替换； construction私有阶段仅提供复用数学与写序。

本范围是可替换工程整合，未执行测试、typecheck、编译、build、产品或validator。施工工作量不是HP；没有完整世界调度、其他建筑及任务、取消、季节财政、普通生产TP或原生人员任务恢复。静态预算覆盖全部合法完成尾及512次完整trace/expected，不能解释为内存峰值或性能结果。原43主题／45快照边界保持；下方旧说明保留历史范围。

## 2026-10-18：有限单工房共享时钟

[规则正文](bounded-city-piece-clock.md)和[八API](../engine/bounded-city-piece-clock.md)新增独立单城账本、一次根clock／AP恢复、5号工房任务与双向预约、到期成长和完整历史重建。开始前约束可完成日期、容量及历史槽；静态全域预算计入未来完成审计、所有旧duplicate和转义保存包装。

这一有限工程完成性不等于运行／性能验证或原版全世界调度恢复。最多8人、8设施、12旬，外部事实固定；无取消／回程、多工房、财政／季节接合、全部TP／商人功绩或全局RNG。PR93私有件数抽取与PR92即时账本为实现基线，不新增其源公式恢复功劳。原43主题／45快照证据边界保留。未运行测试／typecheck／编译／构建／产品／validator；下方旧页状态保留历史时点。

## 2026-10-18：固定单城内政／商人共享根

[具体规则](bounded-city-economy.md)与[API／CLI](../engine/bounded-city-economy.md)覆盖固定城／旬唯一ledger、五类即时动作、原子1–8步顺序批次、完整genesis重放与连续legal分页。这只是跨这两个服务的限定整合；完整世界clock、jobs／预约、设施HP、其他人物服务、部队地图、TP和全局RNG仍开放。商人功绩未建模且保留原值，普通TP未建模。

PR91是私有reducer集成基线，原公式证据按原来源版本保留；新事务／保存／分页／CLI政策不冒称native。原43主题／45快照不减少，任何旧运行结果均不验证本新增。未运行产品、测试、编译、build或schema validator。

## 2026-10-18 单城季节状态：静态simulation，不关闭原作证据

[完整规则](city-season-lifecycle.md)与[六API](../engine/city-season-lifecycle.md)新增固定单城／完整驻军roster／30槽的有限月步进：current与scheduled持久化，内部seed生成／持续，真实兵粮／健康效果、Lv1移除30TP及季初两旧粮纯核串联到账。完整genesis逐receipt重建、同ID幂等、preview和所有旧返回／escaped SaveResult预算均有静态实现。

发生率／持续／损失／祈愿数值／月序与双门／PRNG是可替换simulation；风水不清旧current，Lv2及未知设施／技能拒绝，死亡边界、兵粮零、TP不足整月回滚。软件合同不代表原版全局scheduler或完整财政集成。原概率、原迁移时点、健康RNG、Lv2、原writer／技能getter／stock身份仍未恢复；跨服务账本和时钟继续未集成。原43主题／45快照保持原分母和未决项，不因独立profile而关闭。

公共入口集成基线为PR89 main `0c5ad00667d40960e72f2d8b14c9c20f7eec30fc`／tree `a88a940c92a37c85ac8a827f1f8988ae18401aea`；来源manifest保留PR86历史读取身份。两粮核、两份来源依赖与设施catalog在这两个基线间Git blob相同，不把集成版本提升为新的原作证据。 仅静态实现，产品、示例、测试、typecheck、编译、build、runtime、checker、诊断及schema验证均未运行。原43主题与45快照的证据缺口不减少，下方历史结果不验证本新增。

## 2026-10-18 一次内政评定：有限静态状态

[规则](single-council-lifecycle.md)与[七个API](../engine/single-council-lifecycle.md)新增固定单城／完整名单／最多6人两阶段独立episode。内部候选、提案与赞同、采决、公开child真实普通内政事务、完成／中止终态、完整保存重建均已有静态代码；22类池只执行Patrol／Recruit／Produce1–4三类，19类及件数生产仍排除。原有city-command能力仅复用，不扩大其native证据。

唯一正常完成+10仅是cap10000的completion projection；普通案TP保持not-modeled，没有全局finalTP或child状态注入。全否完成发奖、abort不发、chooser／过滤／去重／次序与PRNG均为显式新政策，nativeEquivalent=false。相同ID幂等，所有新终态命令拒绝，后案／预算失败回滚整个Complete，保存重算包括全部旧receipt返回与escaped SaveResult预算。

公共入口集成基线为PR88 main `8063d39731a42af87646168d4b36b92bd9d3ed3d`／tree `5e555fcda99f97e71e50c9c8565810dca50915be`；来源manifest继续保留PR86原始读取身份，普通city-command源码blob `f07b0762e045dfb77caeb8e46c06e7cee8bd255f`在两版本间相同，不把集成版本当成新的原作证据。原43主题与45快照中的未决证据不减，原版事件与跨服务一致性尚未集成。仅静态实现，未运行产品、示例、测试、typecheck、编译、build、runtime、checker、诊断或schema验证；下方历史结果不验证本新增。

## 2026-10-18 O14 query：固定来源三值查询静态状态

[具体规则](source-event-query.md)与[三个API](../engine/source-event-query.md)新增只读query，不建立事件session或世界账本。202条独立观测可定位原始条款与已知结构子条款；注册比较仅管辂治安≥90和于吉同城四原子项，共五原子／一局部all。片段comparison可met／not-met／unknown，完整clause仍受覆盖与版本限制；当前所有整体documentedConditionsStatus为unknown，executionEligibility固定disabled-source-corpus。

代码边界包括封闭non-Proxy DTO、安全数／重复ID拒绝、显式bindings、缺失事实unknown、完整响应4MiB／65536值／深48预算及小型failure。原句、sourceJSONPointer、文件／条款证据身份与fact／binding路径保留；未知分组不自动求值，onceOnly未明不视为可重复，结果不执行。仅静态阅读与撰写，没有运行产品、示例、测试、typecheck、编译、build、checker、诊断或schema校验；预算不是实测性能，历史通过数不覆盖本批。

实现集成基线PR87 main `021097bdb63ed882bb7b1e1d11f6bdeaf8af017b`／tree `077cb16ad83c8a3a32a6f60a26b3a00cee1b0a93`；PR85五语料Git blob未变，来源版本和全部原始限制保留。通用33／31／10、史实105／66／41、PS2 64／741／24及原43主题／45快照不减，corpus executionEnabled=false。O14完整事件／评定／灾害与O15仍开放；野战既有合同不改。下方历史批次按各自日期解释。

## 2026-10-18 O14 field：有限正兵力动作静态状态

[规则](field-combat-lifecycle.md)和[六API](../engine/field-combat-lifecycle.md)已有独立场景／命令／状态／完整receipt／保存重放静态实现。集成基线PR86 main `a04ee326fdaa68e930681430352f4d98fee5209e`／tree `df4e2be515e2434e4e64476517c8e58f0d3afaf0`；读取的主伤害、计略、应射、技能／技巧与O01文献身份仍逐项保留其PR85来源，不把集成版本改写为新证据认证。

本profile真实目标是内部兵损／气力／acted／异常账本；反击1/半值、普通会心复用、覆盖与holder／概率取整／状态分布均明示新政策。nativeEquivalent=false、stockVerified=false。O14其余事件查询、council、灾害及O15全局接续不关闭。原43证据组与45条snapshot不减，全部原作exactness E及域外X保留。没有运行产品、示例、测试、typecheck、编译、build、checker、诊断或schema校验；静态代码存在不是运行通过。

## O13-B：相邻遗迹／庙发现事件静态交付状态

更新：2026-10-18 UTC。

[规则](adjacent-site-discovery-lifecycle.md)与[API](../engine/adjacent-site-discovery-lifecycle.md)新增有限独立到达发现能力：完整预供序列、内部相邻和部队门槛、选择／新阈值抽样、真实发现与XP、冻结pending、12个月素质／适性或庙技能实际写入、原子幂等和全genesis逐receipt重建。基线为PR85 main `7cf050fdf57cd40641bf5f139b2c34c548aae820`／tree `c515fd47bdec5a1f8b9502da58130dad91372a09`，仅代表版本身份。

O13-A原sourceBoundary及source manifest冻结在其交付时点；其中B未实现的标记不能改成新的原作认证，也不代表本新增B仍不存在。新B有自己的profile／来源／政策／schema，两个独立账本不证明全局集成。原概率／坐标／原技能池／writer、原43／45与E／X均保留；O14／O15另有范围。

验证状态：仅静态撰写与阅读，产品、示例、测试、typecheck、编译、build、checker、诊断和schema校验均未执行；其他模块的历史结果不验证本新增。4096历史／16MiB为硬边界，不是实测性能保证。

## 2026-10-17 O13-A：固定单城Search静态交付状态

[规则](city-search-lifecycle.md)与[API](../engine/city-search-lifecycle.md)新增有限内部候选过滤／排序／选择／RNG、人才／宝物发现登记、金／AP／行动／奖励／旬序及完整genesis逐receipt重建。PR53／54／55三个限定数值核均已发布；其source-listing-reconstruction等级、false flags与历史候选正文不改。新policy包含阈值映射、稳定二读、cap及只发现奖励，不认证原作最终概率、writer或stock。

O13-B相邻遗迹／庙现有[独立静态profile](adjacent-site-discovery-lifecycle.md)，保留与A分离的到达／发现／待选奖励及保存合同。A／B有限合同均已有静态软件覆盖；O13原作等价证据、原43与45快照不关闭、不新增分母；城市事件／跨服务一致性仍为O14／O15，native人员／宝物归属及P078依赖排除。

验证状态：仅静态阅读与编辑，没有运行测试、typecheck、编译、build、checker、诊断、schema校验、产品或示例。4096历史是硬上限而非性能保证；旧核、历史food失败和旧验证结果保持原日期语境，不作本批通过证据。

## 2026-10-17：O12-B固定双城普通流言标量，静态新增

[完整规则](rumor-scalar-lifecycle.md)与[API](../engine/rumor-scalar-lifecycle.md)补固定双城普通名单的独立数值服务：内部新odds、三人平均防守、关系保护、至多一人加空槽、义理抗性与分离loss、200金/30AP及actor每旬机会、true忠诚/治安、独立旬序/RNG、完整policy/原子幂等保存重算。上述具体算法全为synthetic；仅费用与智力方向等官方事实和10/12的独立listing参数依据分开保留。

原成功率、helper/selector/loss/writer/RNG和stock继续E；原被捕风险 unresolved-not-modeled，行程/失败外交/XP功绩TP不模拟，ownershipFrozen=true，完整原世界流言及P078依赖仍X。基线main c9127cd5b911ef0b17e712379431562e741bd996（tree 2a03082efa32d2d98f0df8d99ba5bdcb7bb4bbf0），PR83已交付O12-A；整个O12和原43不关闭，不新增计数分母。未运行测试、typecheck、编译、build、checker、诊断、schema校验、产品或示例；旧测试及历史food失败保留，下方历史PASS不适用本批。

## 2026-10-17：O12-A固定驻城忠诚软件服务，静态新增

[完整规则](personnel-loyalty-lifecycle.md)与[API](../engine/personnel-loyalty-lifecycle.md)补固定单城普通名单的现金褒赏和季度自然忠诚实际账本：100N金/5NAP、每旬一次、新现金5+roll5，仁政/关系优先、教程核returnedAl>25/义理野望/dislikes候选、人心掌握及两次loss、真实byte与显示100、共享新非零xorshift、完整policy/幂等/保存重算。

现金政策明确不使用魅力/义理，有已知保真差异；41/56/03旧+5/+8/+9记录更正为无印Sourcenext且S/L选高值，pages/79当前不能支持现金增量，旧JSON证据不改。自然caller来源、教程来源、新关系图和writer分层，原global RNG/stock未认证。此项只补O12-A有限软件执行，不关闭整个O12、原43或原作闭式；P078及全部依赖、登用ownership、俘虏和欠薪后果排除。没有新增或运行测试、typecheck、编译、build、checker、诊断、schema验证、产品或示例，旧测试和历史food失败保留，下方PASS不适用本树。

## 2026-10-17：O11-B已完成内政设施自动修复，静态新增

[完整规则](domestic-repair-lifecycle.md)与[API](../engine/domestic-repair-lifecycle.md)补独立正HP账本：从供应的固定太守政治自行计算 `clamp(floor(9P/2),150,450)`，无工兵/有工兵分别floor(3B/20)/floor(3B/10)，按设施中心敌情逐旬跳过或cap写入；幂等、首次到满回执、完整genesis/命令/回执/快照保存重算。目录只有类型身份，maxHP由场景供应。旧“工兵最终整数精确×2”已在现行规则纠正；原始旧来源保留。

敌情距离仅源注释派生政策，writer与事件是独立服务合同。公开混合listing不是clean-stock认证；城市/港/关同址指令冲突、堤坝、PK特殊楼、原生getter/helper/writer/callback、建设HP迁移与全局组合仍open，整个O11及原43组均不关闭。本批没有运行测试、typecheck、编译、build、checker、诊断、产品、示例或schema validator，旧测试未改，历史food失败保留；下方历史PASS不是本树验收。

## 2026-10-17：O11-A标准设施建设与吸收

[完整规则](facility-construction-lifecycle.md)与[API](../engine/facility-construction-lifecycle.md)补9类建设、5类吸收的实际独立账本、人员预留/完工奖励、有限推进和全历史重算；已有速率核和金粮核真实复用。官方/社区/源listing/临时policy分层，功绩冲突保留。O11-A不覆盖维修；独立已完成内政维修见上方O11-B，维修其余边界、PK特殊楼、combatHP与原生writer/全局调度仍未恢复；原43不减。未运行测试、typecheck、编译、build、checker、诊断、产品或示例，旧测试未改，历史food失败保留。

# 当前状态：O10-B单城商人静态代码与具体规则（2026-10-17）

[完整规则](city-merchant-lifecycle.md) · [API](../engine/city-merchant-lifecycle.md) · [来源/全部政策](../sources/city-merchant-lifecycle.json) · [未运行场景](../../data/scenarios/city-merchant-example-v1.json)

独立BuyFood/SellFood/AdvanceMerchantTurn、每城每旬一次与20AP、supplied敌情两格、UI3..7、政治20..100精确锚点/有理插值、买ceil/卖floor与卖侧4/5、库存/cap整笔拒绝、XP5不自动成长、AP20/0政策、完整genesis/receipt/finalstate重建已补静态代码。完整135条交易listing存在，三helper/raw scale/native writer仍open；nativeExecution/stockVerified均false，原43不减。与O10-A状态独立，两批不表示全部财政完成。

未运行测试、typecheck、编译、build、checker、诊断、产品或示例，旧测试没有修改，历史默认food全套失败仍保留。P078及native capture/ownership/mission/return/finalizers、俘虏欠薪均不接入。下方旧“当前”标题和结果保留各自日期，不是本树运行验收。

# 当前状态：O10-A有限单城财政静态交付（2026-10-17）

[完整规则](city-finance-lifecycle.md) · [API](../engine/city-finance-lifecycle.md) · [固定来源/完整政策](../sources/city-finance-lifecycle.json) · [静态场景](../../data/scenarios/city-finance-example-v1.json)

独立profile已补固定owner/完整驻城普通有官薪名单、30设施到四个旧核的adapter、单旬月季历、请求base上的富豪/米道、丰作先于征收、收入先于季降、足额工资与不足整旬回滚、特产旧binary32政策及cap入库、完整保存重算。normal映射1，super2；Easy仅新服务拒绝。支持域不含港关、俘虏/未知工资身份、欠薪后果或原生任务/归属链。

这是O10-A子批，不是全财政完成；所有者/payer、稳定helper、邻接、writer/cap、调度、RNG均为具名provisional政策，source核证据不被升级；nativeExecution=false、stockVerified=false，原43组不减。没有运行测试/typecheck/编译/build/checker/产品/诊断/示例，没有修改旧测试。历史默认food全套失败仍保留。

以下是历史版本交付记录，不是当前候选运行验收；旧“当前”“待运行”“通过数”等标题/措辞只属于其原日期，不能覆盖本页顶部状态。普通外交/单挑/话题牌等只在各自子域有实现，不代表整个原生机制完成。

# 2026-10-17：O09b普通话题牌独立舌战，静态代码与规则覆盖

[完整规则](debate-topic-session-v1.md)、[API](../engine/topic-debate-session-v1.md)、[固定来源与完整policy](../sources/debate-topic-session-v1.json)：普通九模板、ordered tape/token、智力3/4/5/6普通手牌（保留再考槽）、精确attack/power/HP/stress、旧topic算伤、终局优先、非终局stress100原子拒绝、补牌及全genesis/receipt/snapshot重算已补。五话术/四性格愤激/再考/人物/开场与结束结算仍未实现；普通支持域不能覆盖任意原作牌局。

E15既有formulaEvidence保留，新增状态机仅pinned-modern-translated-reference，牌序为工程政策；nativeEquivalent=false、stockOriginalVerified=false，原43及全部平台/人物未决不减。P078、native任务、俘虏/处斩/归属、return/mission和外交自动结算排除。未运行测试/typecheck/编译/build/checker/产品/诊断或样例，未改旧测试，旧默认food失败保留；历史通过数不验证本树。

# 2026-10-17：O09a普通单挑独立session，静态代码与规则覆盖

[三方针普通session规则](duel-ordinary-session-v1.md)与[API](../engine/ordinary-duel-session-v1.md)新增：完整duelScore平方份额、stepwise截断、SourceNormal通用身份、条件3/4原始draw、Hit/Dodge/Block无反击、pre-write HP斗志、cap writer、exchange/blow双计数、HP胜负先于50合平局，以及完整policy/evidence/genesis/receipt/snapshot重放。所有人物hook关闭；普通动作调度、方针时机、有界输入/RNG适配为具名工程policy。

仅普通子集；Fury/会心/必杀/装备/特殊人物、多队员、撤退/负伤和舌战未完成。证据为固定现代translated-source-reference，nativeEquivalent=false、stockOriginalVerified=false，E14原生全链及原43组继续open；P078/native任务、return/mission、俘虏/处斩/归属完全排除。新增代码和静态场景未运行测试、编译、build、checker、产品或诊断，不改旧测试，旧默认全套food失败继续保留；以下历史通过数不验证本树。

# 2026-10-17 普通外交独立服务静态实现

[规则正文](ordinary-diplomacy-service.md)与[API](../engine/ordinary-diplomacy-service.md)补齐单城市/执行者/多目标的亲善、同盟、停战，BigInt精确比较、独立金/AP与无序pair关系账本、普通失败退款及逐旬到期；完整policy/genesis/snapshot/receipt逐项重算。危险失败与未知特殊门槛原子拒绝。

工程覆盖不等于原生外交：PK经验公式exactBuild仍open；关系冲突、末尾floor、费用退款、0..100、月数和3旬转换等具名provisional政策不升级。停战TP35/30冲突保留，本批不应用TP/功绩/政治经验，也不接P078/native捕获、mission、return、人员归属、交换或劝降。原43组证据主题不减。

本树未运行测试、typecheck、编译、build、checker、产品或诊断；无测试文件修改。静态场景/手算预期不是通过记录。历史默认food失败仍未解决，过去通过数字只属于过去版本，不能覆盖本树。

# 当前工程交付状态（2026-10-16）

## 2026-10-16：独立PK能力研究与培育静态实现

[完整规则](pk-ability-lifecycle.md)与[API](../engine/pk-ability-lifecycle.md)：研究扣费并跨旬解锁，培育扣AP/预约次数并在三旬后实际写入XP、适性或特技；48基础+显式5隐藏、并行类别、完整重算save/load/replay。固定攻略与S1核结合具名provisional政策，不宣称原生命令或clean-stock等价。

新增代码、静态场景和文档未执行测试、编译、build、checker、产品或诊断；未增删旧测试。旧默认全套food文件失败仍未解决，历史通过数不覆盖本树。原43证据主题不减；P078/native任务/归属/俘虏/取消链不纳入。


## 历史规则正文补充

完整定位见[PR1–71逐机制表](historical-pr-rule-index.md)。训练运行政策、独立耗粮/补给与编成政策已补专项正文；45处港关、PK能力树及逐来源史实/通用/PS2事件明细以可读规则页保留，不用数据外链替代。维护PR不增加游戏机制，事件仍不可执行，原43与P078边界不变。这是静态文档覆盖，不是原作认证或运行通过；本轮未测试，旧food默认全套失败继续保留。

- [耗粮与手动补给资源会话](../engine/food-supply-lifecycle.md)：PR #69 已合并交付；含完整账户 schema、ConsumeTurn/ManualSupply、容量/库存守恒、气力政策与保存重放。账户不等于原生部队，不实现真实移动到达或任务终结
- [编成与能力面板](../engine/unit-formation.md)：PR #70 已合并交付；含成员与关系、五维/六适性、兵装/技术面板、指挥容量、库存可行性及规范重放。只返回独立规格，不创建部队、扣账或迁移人员
- [巡查、征兵与生产生命周期](city-command-lifecycle.md)：PR #71 已合并的独立服务；完整场景、具体算术与费用奖励、资源预约、跨旬与失败边界见专项页

- [独立技巧研究生命周期](technique-research-lifecycle.md)：新增独立实现，包含完整36项目录与前置、Start实际扣款、1–3名参与者、指导折扣、两格敌军supplied gate、具名时间/功绩政策、Advance自动完成及仅本服务预约释放；[API](../engine/technique-research-lifecycle.md)与[工程API索引](../engine/README.md)。时间完整矩阵、原生完成writer和人员分配仍open

本次技巧研究代码、静态示例和规则仅作静态工作，未运行测试、typecheck、构建、checker、诊断或产品代码，没有新增运行计划。历史规则补齐已随PR #72 合并；其覆盖范围与本次研究服务的证据等级互不替代。

PR #69/#70 的历史验收只对各自版本有效；本次静态整理未重新运行测试，旧默认全套 food 文件失败仍未解决，后续诊断通过不构成正式全套通过。见[本次验证状态](city-command-lifecycle.md#validation-status)。这些服务实现不代表 clean-stock 或完整原生事务恢复，原43及P0-78边界保持。

## 历史状态记录

下列候选/未发布/最新措辞与数量保留其原日期语境，不用于覆盖上述当前交付状态。

2026-10-15 新独立工程候选：[每月特产兵装自动生产数量请求核](monthly-specialty-production.md)：明确设备1..4、30槽逐调用捕获与政治AL的可调用TS/Python核；opcode控制流与假定comment binary32/未知converter向零政策分层，非完整生产/实际入库/native认证。原43组未决证据主题不减，P0-78及依赖排除；本树全新验收另记，历史PASS不适用。

2026-10-14 新独立工程候选：[城市粮食收入非Easy稳定已解析输入投影](city-food-income-projection.md)，基于PR #60已合并main `57a2f4dd34d0d888b23d1e46e2cb78402b91a7b4`。固定160条/494 bytes和16+22 bytes两表、30槽与4种统一类型行；军屯农保留U32乘积低位后unsigned /15000，最后signed32向零/100支持负返回；difficulty0整个Easy分支拒绝。只补已有规则的工程覆盖，原43组未决证据主题不减。来源仅source-listing-reconstruction，不认证stock/Vanilla、真实helper/ABI、原表、city/owner、writer或scheduler，P0-78及依赖排除。实现和全新验收仅本地；正式聚合及独审结果另记，以下历史通过数字不验证本树，旧城市金钱179原run/证据保持不动。

2026-10-13 新独立工程候选：[城市金钱收入稳定已解析输入投影](city-money-income-projection.md)，基于已合并PR #59 main `4824cfa124c573f2e2762396b85e0bcc8042d2da`。完整来源150条/437 bytes及16+21 bytes跳表，固定30槽、有效类型统一产量行、升级回退、限定造币、难度与晚期uint8治安；逐路径拒绝signed32中间乘法溢出，不将无界公式冒充原返回。属于已知规则的补充工程覆盖债，旧43组未决证据主题不减为42。不实现前置city/owner门槛、原查表/邻接helper、真实入账、完整财政/月度调度或P0-78及依赖；stock、原表和真实游戏执行仍open。本树须完成全新验收与独审，旧通过数不验证本树；以下旧候选文字为各自发布前历史记录。

# 规则审计当前状态

2026-10-12 新独立工程候选：[俘虏自然逃亡roll参数纯整数核](captive-escape-roll-argument.md)，基于已合并PR #58 main `3db7dc80363454b56c2dd9d138ae285f50dadf29`。这是已有文档公式的来源绑定API，不是新概率发现：26条/77 bytes、入口BL/AL和晚期月份三个U8，完整0..255域参数最高108815，不clip100、不合并早期month gate、不接RNG/释放/状态/EndTurn。完整自然逃亡、getter/ABI、调度及stock仍open；00599AA0同期仅纠正“断粮人口”命名债。43组剩余是证据主题，非43个可直接实现的任务。原PR #58及之前各项已按各自边界交付；以下旧候选/通过数属历史记录，不验证本树。本候选全新验收与实际发布状态另记；P0-78及依赖新增实现继续排除。

2026-10-11 新独立候选：[征兵治安writer请求参数叶](recruitment-security-argument.md)，基于已合并PR #57 main d1e93ada18efa5f95c584afd9309b228f9391f0c。只接早期保存C与入口ESI的u32两标量，signed IDIV/NEG、规范+0；7条/19 bytes（含两push9条/21 bytes），不接写回/command、不复用数量输入、法治MOD隔离。实际征兵/治安损失、ABI/helpers/stock仍open；新验收另记，下方旧候选/最新数字不验证本树。P0-78及其依赖新增实现继续排除。

2026-10-11 当前新增候选：[征兵数量显式ST0逐调用投影](recruitment-quantity.md)，基于已合并PR #56 main `aa751399544b65390ecfd66750c1362bba95a389`。131条/373所列字节；最多19个EAX捕获与独立ST0字段，最多21次typed调用收据，保留全loop无效N=1000、先技能后FIMUL、super先pressure及容量二次getter/32位回绕。仅pure caller数值核，不等于完整征兵、实际入库或stock认证。本树新验收/独审/发布另记；下方旧“最新/本地候选”与验证数字属历史冻结记录，不验证本树。P0-78及其依赖新实现持续排除。


2026-10-10 最新本地候选：[探索搜金caller整数投影](search-gold-caller.md)，基于已合并PR #54 main `cb76e148f35b519283cc296361b507674d0fff3a`。仅RNG返回后29条/82字节、逐调用点uint32观测与signed32分支；二轮getter仅裁剪时必填，不复用首轮，结果非实际奖励。人才PR #53、宝物参数PR #54已交付；以下旧“本地候选”及验收数字是各自历史冻结记录。本批新树单独验收、尚未发布；完整搜金/探索、RNG/helper/writer/stock仍open，P0-78及依赖排除。


2026-10-10 当前本地候选：[探索宝物roll参数纯核](treasure-roll-argument.md)，基于PR #53已合并main ec8baea67f4ad36a27af40220ce7596c62065d58。只补005D5B45..005D5B6B前的12条/38字节参数块；过滤/选择/RNG/归属writer/完整命令与stock仍open，P0-78及依赖仍排除。旧人才profile中的searchTreasureRecovered=false不改。以下历史冻结文字和验证数字不是本候选验收；新的候选尚未发布。

更新：2026-10-09 UTC。当前相性距离独立核为全新重建，基线：PR #51已合并的 main `2c38f06e2a3106cf25ad47e02458a2fd72c69a45`；新树验收与实际发布状态另记，不沿用旧候选或历史通过记录。

## 当前交付与仍缺证据

PR #42～48已交付项保留各自范围；PR #49巡查、PR #50价格与PR #51数量数值核均已合并。本轮仅重建已解析双uint8的相性距离独立纯函数，不补native pointer/ID、不接自然忠诚或登用caller，不修改Train/EndTurn与存档。本树全新验收另记，历史P0/PR验证数字不代表本批结果。

- 本批[相性距离独立核](affinity-distance.md)：`affinity-distance-tutorial-u8-v1` / `tutorial-source-projection`，固定教程37条助记符，无opcode bytes；signed32=min(d,150-d)，保留完整EAX与AL。0/151=-1、AL255，0/255=-105、AL151，不取模或夹零；教程到caller/S1归属、stock/跨版本、native解析及忠诚/登用集成仍open。65536组合、22500正常域、11130负返回与5分支/10结果由新树单独验收，不预报通过
- PR #51已交付[生产数量限定核](production-quantity.md)：原88条/254字节及两套MOD隔离，signed32类型早退0/1，精确三槽无首槽gate；仅支持显式3F800000/3F99999A/3FC00000。先技能倍增、倍率后向零转换、再条件超级倍增，无9000cap；完整callee、设施选择与常量bytes、city virtual、库存writer/调度/stock仍open。全无效槽和任意浮点域不支持，原本地候选措辞为发布前冻结记录，不等于尚未交付
- PR #50已交付[生产价格整数核](production-price.md)：原005C6350..005C63C0完整45条/113字节，MOD6条/14字节独立；仅AL非零才八折向下取整，EAX256不折、257折，合法零值无最低1；005C637A读取值在helper前保存，C1FA02解为SAR EDX,2。两层校验与helper原体、原表/ID映射、完整命令/扣写/调度/stock及跨版本仍缺。该已交付价格核的独立字节oracle、全字域与聚合记录属于PR #50，不能替代本相性新树验收
- PR #49已交付[巡查治安增量纯数值核](patrol-security-gain.md)：原79条/204字节与MOD7条/21字节隔离；首槽有效、稳定uint8统率/城市byte、pressureHelperEax完整uint32，先floor(sum/28)+2、非零半减、严格>100上clip。负delta保留；getter/helper/资格/费用/writer/TP/调度及stock仍open。此前本地候选文字是发布前冻结记录，不能否认已交付
- PR #48已交付[内政建设速率纯数值核](domestic-construction-rate.md)：公开005BB1D0..005BB2AA原文完整；稳定getter/设施表域为max(maxPolitics+floor(sumPolitics/2),floor((D-floor(D/4))/9))，0～3个uint8政治及uint16耐久。原GBK Git blob、84条/219字节、9条星号MOD隔离可核；不证明初始耐久writer、完整工期、getter实现、逐旬推进、完成调度或stock/跨版本等价。其历史验证不用于本批新增代码
- PR #47已交付[自然忠诚候选静态纠错](natural-loyalty-candidate-boundary.md)：普通前置豁免后为unsigned AL>25、signed义理<=1且野望>=3、或004889E0完整EAX非零三选一；俘虏跳过全部三条。固定公开source/blob与两套MOD分隔可复核；相性教程投影单列，教程到caller/S1同源、native解析/其他callee/writer/降量/RNG/stock/runtime继续open，既有审查范围不扩展为忠诚端到端认证
- PR #46已交付[S1特技培育限定资格核](pk-skill-training-s1.md)：已进入类别2后的native signed32输入，目标0..99且E8相同才helper真，caller取反；另一已有特技不阻挡，越界target即使相等也保持caller真。不映射攻略ID、不写人物/任务状态；完整命令/完成writer/费用/调度仍缺
- PR #45已交付[S1五维培育限定数值核](pk-stat-training-s1.md)：XP<2000且成长低于目标的启动资格；完成独立计算min(5,差)×100累计顶3000，已开始任务不重跑资格，负差明确拒绝。普通无年龄域与已解析getter分开；完整命令/AP/时长/使用数/native98/隐藏RNG/scheduler/stock仍open
- PR #44已交付[PS2史实攻略](ps2-historical-event-source-data.md)：64独立观测/资料ID、741来源节点；59条件结果（2仅接续）、4仅条件、1外链参照；24来源限制和全部edition未知保留。旧史实105/66/41、通用33/31/10及12文件字节不变，原生flag/目录/版本等价与运行时仍open
- PR #43已转录[所选通用事件](generic-event-source-data.md)：33观测/31新资料ID，Wiki21空标题及10项未决问题保持显式；旧史实105/66/41不变，原生ID/flag、缺失细节、完整目录与执行继续open
- PR #36 已交付[45条港关静态所属](static-subordinate-bases.md)，全部42城数量一致；三城开发分片null、原数值ID、40,000格地图和原剧本初始化仍缺，下一证据是可追溯的原作地图/剧本数据
- PR #37 已交付[PK能力研究静态树](15-pk-ability-research.md)：48基础节点、52基础箭头、4起点箭头、10隐藏位置/50候选，攻略冲突保留；原生数据等价、研究/培育执行与隐藏抽取RNG仍缺，下一证据是原始表及其caller
- PR #38 已交付[所选史实攻略](historical-event-source-data.md)：105条观测、66个资料事件ID、41项来源差异；未声明flag、差异裁决、原版完整目录及执行器仍缺，下一证据是分平台资料和原生条件/结果调用链
- PR #39–41 已交付CLI参数预检、私有重放线性累积及adapter证据形状/保留名计数修正；见[训练生命周期](../engine/pk-training-lifecycle.md)。范围仍只有Train/限定EndTurn合成沙盒，不含AI、经济、战争、历史剧情执行或完整scheduler；下一证据不能由合成回归替代clean-stock/运行时认证
- [缺口总表](../../缺少的数据.md)已区分已恢复通用核、实测公式与仍缺的原函数/版本边界；训练gate/reset以[82来源profile](82-training-lifecycle-source-profile.md)为准，不能继续统称未恢复，也不能把MOD关联source bytes提升为stock等价

P0-78及依赖capture、force灭亡、native事务的工作不在本轮；clean-stock、Vanilla/主机、全局RNG、真实存档和完整运行时边界继续保留。所选资料转录不宣称全部缺口清零。

## 静态数据补齐：45 个港关所属城市

[静态所属关系](static-subordinate-bases.md)已结构化 10 关、35 港，全部 42 城计数逐项一致，27 城有所属港关、15 城为零。新 sidecar 保留稳定仓库 ID、源表名称/行定位/版本边界和事实投影；既有 cities.json 字节及三城未知开发分片不变。9 项静态数据回归纳入 `npm run check`。本项不认证 clean-stock、Vanilla 或任何运行时归属/事件逻辑；下列原有审计与证据债不变。

## 历史完成：P0-77 event9 live home getter

[112-native-event9-home-getter.md](112-native-event9-home-getter.md)在新显式frame/version中仅展开004BA44C..45E：saved troop在00495525直接调用当前virtual08，不添加0047A630 wrapper，旧raw44=-1不是gate。unknown troop08仍精确完整frame/RNG effect-query；false保留callback变化并返回-1，true从同一saved troop当前storage读live leader，保存canonical person pointer、单次验证并从该saved person读signed homeBaseId。完整004A31E0证明既有person DWORD+98字段，所有signed32位模式保持，不与force byte+98混同、不新增重复字段或person08 callback域。25继承入口加event9-home-getter共26入口，新28组model原字节不变。

00490D00仅按signed0..16383构造fixed manager07201958下的building pointer，不读building row或validity；missing/invalid非base row仍可得到pointer，只有后续真实读取才要求storage。到达的troop/person storage缺失仍明确gap。getter RET及resolver RET4证明45E参数栈平衡，原manager、saved force/troop/subject/target、captured raw44、old/new scalars与cursor以及returned home scalar/building pointer持续绑定。opaque suffix明确绑定004AD220/site004BA467、incoming ECX0799895C、arguments[saved troop,4,building]及reverse PUSH顺序，不声称helper使用该ECX。presentation411..432与reaction45E..46C仍整体frame/RNG可变观察或atomic rejection；immutable-event只是支持域，参数cleanup不证明temporary析构、无别名或异步不保留。

基线为PR #34已合并main `d811288e5e9110036678719af23b597a2450650c`。最新main全新单轮124/124命令通过：TypeScript、85 Node tests、121 Python checker与2 demos。28组model在完整集合执行一次，474 accepted/1003 atomic rejection/84 killed source-specific mutants，逐mutant先过unchanged control；25 source加继承20/nested17/26/21/21/17/12/13与34 clean-controlled source mutations通过。双IDB全指纹和1329 raw-ID1区间重新验证（S1 658、S2 671），8组历史独立作者probe通过60 accepted/42 rejected；仅迁移ROOT/STAGE路径，production selectors非空且assertions保持。126份完整/专项原始字节日志逐条核hash及504条固定inode wait/start/exit/released；每条命令heap512/TAP/semi16、原argv、专用repo外npm cache、禁Python bytecode，正式TAP_DISABLE_COVERAGE/TAP_RCFILE均unset。2184 tracked文件、真实index和deps在全测/专项前后完全一致；之后仅5结果文档单独复审，生产/model/raw/report/sourcechecker不变。clean-baseline patch恢复全部hash一致；集成delta与终态独审通过。P0-74历史SIGKILL与恢复记录保留，本条新124结果仅属于P0-77冻树及其明确环境，不代表远端CI/stock/runtime认证。38已审新增含guide112，保留正式guide107，共2184 tracked文件；35新增生产/model/raw/report与最终隔离版逐字节一致。新manifest/source checker仅formal baseline、两项P0-76 metadata pin及独立的严格历史提取baseline协调，raw report原字节保持；递归Gitblob证明至P0-67，P0-67/68原draft integrationStatus在proof保留，继承P0-72已审单strict model pin correction，无新增model例外。Capstone5.0.7历史报告只核hash，不重新解码；IAT source-specific双view仍未认证。正式环境单独记录，不称与隔离run额外TAP_DISABLE_COVERAGE及external TAP_RCFILE配置完全相同，也不默默关闭产品coverage。实际presentation/reaction45E..46C、mutable event与16/18、capture/surrender/captive、force灭亡、recursive ruler ownership、positive refund/resources、其余cancel、S2 effects/full vtable tail、fallback reset scheduling、未建模temporary/formatter/external/platform/concurrent memory、全局RNG及clean-stock/Vanilla/console/original-save/runtime认证仍open。 MOD-associated S1/S2 selected bytes不等于stock，PKPC1.1优先且Vanilla隔离；历史P0-74失败和此前全部未闭合债保留。

## 历史完成：P0-76 event9 saved-troop原生raw44 reset

[111-native-event9-troop-reset.md](111-native-event9-troop-reset.md)在新显式frame/version中仅展开004BA442..44C：004AD2B0经0047A630单次验证saved ESI troop的live leader/person/deputy链，unknown08仍为精确完整frame/RNG effect-query；false保留callback变化并跳过写入，true经00495A20/00495A32在同一saved pointer当前storage直接写raw44=-1。callback改leader/vtable/frame/ownership后不二次validity、不重读owner、不虚构virtual setter；missing reached storage明确gap。raw44保留所有signed32位模式，无默认、coercion或业务含义，不暴露通用setter。24继承入口加event9-troop-reset共25入口，新34组model原字节不变。

早期EBX force仍来自pre-presentation保存的raw44，不能从current ownership或reset后的raw44重算；先前force raw94/raw98 stores与troop raw44 store处于同一atomic command。445复制原saved manager EDI到ECX，helper不读incoming ECX；setter RET4/helper RET8证明44C续接参数栈平衡，原manager及saved force/troop/subject/target、event domain、captured raw44、old/new scalars和next cursor保持。presentation411..432整体观察不变；参数cleanup不证明temporary析构、无别名或异步不保留。44C..46C home/reaction仍整体frame/RNG可变观察，live home lookup/building lookup/004AD220未展开；immutable-event只是支持域。

基线为PR #33已合并main `9a487b75b4ebd3dab0326ed0ffc81a7a3b2e5e06`。最新main全新单轮122/122命令通过：TypeScript、85 Node tests、119 Python checker与2 demos。34组model在完整集合执行一次，374 accepted/889 atomic rejection/38 killed mutants；20 source加继承17/nested26/21/21/17/12/13通过。双IDB全指纹和1327 raw-ID1区间重新验证（S1 657、S2 670），6组历史独立作者probe通过38 accepted/32 rejected；仅迁移ROOT/STAGE路径，无失效production禁用selector。124份完整/专项原始字节日志逐条核hash及固定inode wait/start/exit/released；每条命令heap512/TAP/semi16、原argv、专用repo外npm cache、禁Python bytecode，正式TAP_DISABLE_COVERAGE/TAP_RCFILE均unset。2146 tracked文件及真实index在全测/专项前后完全一致；之后仅5结果文档单独复审，生产/model/raw/report/sourcechecker不变。clean-baseline patch恢复全部hash一致；集成delta独审通过。P0-74历史SIGKILL与恢复记录保留，本条新122结果仅属于P0-76冻树及其明确环境，不代表远端CI/stock/runtime认证。192已审新增含guide111，保留正式guide107，共2146 tracked文件；189新增生产/model/raw/report与最终隔离版逐字节一致。新manifest/source checker仅formal baseline、两项P0-75 metadata pin及独立的严格历史提取baseline协调，raw report原字节保持；递归证明至P0-67，继承P0-72已审单strict model pin correction，无新增model例外。Capstone5.0.7历史报告只核hash，不重新解码；IAT source-specific双view仍未认证。正式环境单独记录，不称与隔离run额外TAP_DISABLE_COVERAGE及external TAP_RCFILE配置完全相同，也不默默关闭产品coverage。实际presentation/home/reaction44C..46C、mutable event与16/18、capture/surrender/captive、force灭亡、recursive ruler ownership、positive refund/resources、其余cancel、S2 effects/full vtable tail、fallback reset scheduling、未建模temporary/formatter/external/platform/concurrent memory、全局RNG及clean-stock/Vanilla/console/original-save/runtime认证仍open。

## 历史完成：P0-75 event9 saved-force原生reset

[110-native-event9-force-reset.md](110-native-event9-force-reset.md)在新显式frame/version中仅展开004BA432..442：保存先前troop raw44所得EBX force身份，004B5020单次检查current force validity，canonical ruler0..1099或unknown08完整frame/RNG effect-query；false保留callback变化且跳过两写，true依次在同一saved pointer的当前storage写raw94=0xffffffff、raw98=0。不重读troop ownership，不二次validity，不按新vtable虚构virtual setter，missing reached storage明确gap。rawDword94/rawByte98显式无默认，允许所有既有位模式，不猜业务含义。23继承入口加event9-force-reset共24入口，新34组model原字节不变。

432将saved manager加载到EDI，43B复制到ECX，helper不读取incoming manager ECX；完整setter RET4/helper RET12证明442续接参数栈平衡。原始manager与saved force/troop/target/subject、captured raw44、old/new scalar和next cursor保留。presentation411..432整体观察保持；参数cleanup不证明temporary析构、无别名或不保留。442..46C reaction remainder仍完整frame/RNG可变观察，live troop reset/home lookup/004AD220未展开；immutable-event仅支持域，不是原生内存恒定证明。

基线为PR #32已合并main `bbaaf647b62fa0814c8333eb1a1dc07f407649d7`。最新main全新单轮120/120命令通过：TypeScript、85 Node tests、117 Python checker与2 demos。34组model在完整集合执行一次，312 accepted/905 atomic rejection/32 killed mutants；17 source加继承26/nested21/21/17/12/13通过。双IDB全指纹和1323 raw-ID1区间重新验证（S1 655、S2 668），10组历史独立作者probe通过18 accepted/40 rejected；仅迁移ROOT/STAGE路径，无失效production禁用selector。122份完整/专项日志逐条核hash及固定inode wait/start/exit/released；每条命令heap512/TAP/semi16、原argv、固定npm cache、禁Python bytecode。1954 tracked文件及真实index在全测/专项前后完全一致；之后仅5结果文档单独复审，生产/model/raw/report/sourcechecker不变。clean-baseline patch恢复全部hash一致；集成delta独审通过。P0-74历史SIGKILL与恢复记录保留，本条新120结果仅属于P0-75冻树及其明确环境，不代表远端CI/stock/runtime认证。188已审新增含guide110，保留正式guide107，共1954 tracked文件；185新增生产/model/raw/report与最终隔离版逐字节一致。新manifest/source checker仅formal baseline和两项P0-74 metadata pin变化，递归证明至P0-67，继承P0-72已审单strict model pin correction，无新增model例外。Capstone5.0.7历史报告只核hash，不重新解码；IAT source-specific双view仍未认证。实际presentation/reaction442..46C、mutable event与16/18、capture/surrender/captive、force灭亡、recursive ruler ownership、positive refund/resources、其余cancel、S2 effects/full vtable tail、fallback reset scheduling、未建模temporary/formatter/external/platform/concurrent memory、全局RNG及clean-stock/Vanilla/console/original-save/runtime认证仍open。

## 历史完成：P0-74 event9原生展示决策

[109-native-event9-presentation.md](109-native-event9-presentation.md)在新显式frame/version中展开004BA345后的展示决策：saved raw44转换为saved force身份，与troop当前owner分开；troop48、当前force08/48和fallback saved-force08/48按原序live读取，未知virtual仍是完整frame/RNG可变effect-query。22继承入口加event9-presentation共23入口，旧API/frame/trace及42组模型checker逐字节不变。

原生event word确有重读；immutable-command-event-v1仅声明当前支持域，不能声称原生event memory不变。该域排除callback破坏event/control/saved control-flow locals，但保留411..432内已知caller-stack temporary写入。presentation 004BA411..004BA432整体观察构造、格式化、virtual、consumer及cleanup，不发明稳定temporary地址或析构/不保留/异步别名证明；reaction 004BA432..004BA46C仍独立观察。S1在0063ADE7调用00482480，S2调用008ECE20，保持source绑定。saved force/troop/target/subject、manager、locals和next cursor跨替换保持。

基线为PR #31已合并main `f9c55c48c95fa84c1594bd9fb5ddcaf5849dcbe1`。最新main 118命令集合在同一产品冻树取得通过证据：TypeScript、85 Node、115 Python checker和2 demos。首轮117/118通过；npm check及同配置重试都因lifecycle子进程SIGKILL结束（58/59），原始失败保留。direct Node的85/85仅诊断；原npm run check argv随后在heap512/TAP基础上仅追加受支持的--max-semi-space-size=16后通过，未改产品或测试。原因未确证，不能称OOM或首轮全绿。42组model、26 source及继承21/nested21/17/12/13、双IDB全指纹/1317 raw和17历史独审probes通过，122条命令尝试日志含2条失败逐条核hash；全部命令同一固定inode flock。独审额外证实test16迁移后selector命中47模块/367个production patch，干净oracle无生产调用且负控制能拒绝污染。1766文件及真实index在全测/恢复/专项期间完全一致，其后仅5结果文档修改另审；集成delta独审通过。183已审新增含guide109，保留正式guide107，共1766 tracked文件；179新增生产/model/raw/report与最终隔离版逐字节一致。新manifest/sourcechecker仅formal baseline和2项P0-73 metadata pin变化，递归证明至P0-67，继承P0-72已审单strict model pin correction，无新增model例外。Capstone 5.0.7历史报告只核hash，不重新解码。实际presentation/reaction、mutable event与16/18、capture/surrender/captive、force灭亡、recursive ruler ownership、positive refund/resources、其余cancel、S2 effects/full vtable tail、fallback reset scheduling、未建模memory/platform/concurrency、全局RNG及clean-stock/Vanilla/console/original-save/runtime认证仍open。

## 历史完成：P0-73 event9原生live部队选择

[108-native-event9-selection.md](108-native-event9-selection.md)在新显式frame/version中展开event9选择前缀：004922C0先保存node.next再读取payload，callback后沿saved-next身份继续、到达时live读取节点；允许重复payload、节点删除/重用与可终止cycle。完整00495CE0读取raw order/target并保留真实分派顺序；raw44、subject/target/troop pointer、manager ECX和saved cursor跨完整frame/RNG替换保持。21继承入口加event9-selection共22入口，普通event9同frame一次revision，旧API/frame/trace及39行为测试不改。

基线为PR #30已合并main `82432a2c5b85ba8b9e443217b8da1b925441b10c`。最新main全新单轮116/116命令通过：TypeScript、85 Node tests、113 Python checker命令与2 demos。39组model、21新source加21继承及nested17/12/13组通过；双IDB全指纹与1297 raw-ID1区间重新核验通过（S1 642/75192 interval bytes，S2 655/75584，含重叠），18组历史独立作者probe在正式candidate重跑通过。所有119日志hash核验，命令逐条使用同一固定inode的fcntl锁，npm/node继承NODE_OPTIONS=--max-old-space-size=512 --test-reporter=tap，产品argv未改。1583 tracked文件及真实Git index在全测和专项前后完全一致；其后仅5结果文档更新另行复审。集成delta独审通过：157项新增生产/model/raw/report与已审隔离版逐字节一致，新增manifest/sourcechecker仅改formal baseline和3项P0-72已证metadata pin，未改行为assert/oracle。未执行游戏EXE，也未声称远端CI或stock认证。161已审新增含guide108，保留正式107 guide，共1583 tracked文件。P0-72 manifest/source及已批准test32 model metadata pin变化递归证明到P0-67；无新增model例外。Capstone5.0.7历史报告只核hash，不重新解码。004BA345..004BA46C的presentation与mutating reaction仍观察，virtual+48仅影响presentation路线；engine node/call/depth预算不是原作规则。event16/18、capture/surrender/captive、force灭亡、recursive ruler ownership、positive refund/resources、其余cancel、S2 effects/full vtable尾、fallback reset scheduling、未建模memory/platform/concurrency、全局RNG及clean-stock/Vanilla/console/runtime认证仍open。

## 历史完成：P0-72原生live位置与可变fallback

[107-native-live-position.md](107-native-live-position.md)在新显式frame/version中展开00489610：location只读一次，按base再troop原生validity解析base+1E、troop+3C或fallback06EE794C的storage identity；position不要求本人troop membership。0047A950随后单次DWORD读取并解释signed16 X/Y，先bounds再live map/source-local base table。004A6340的valid actor/base-location fast path继续跳过base validity、position与map读取。18继承入口和3新direct入口可用；旧API/frame/trace冻结。

基线为PR #29已合并main `8a47624d5923b447597c9fab18dc1e84fa1eade4`。最新main114命令集合经定点恢复通过，首轮冻结运行112/114通过。npm check首次因本地依赖复制解引用tsc链接而ERR_MODULE_NOT_FOUND，恢复两条原symlink后TypeScript及85 Node tests通过；此错误与历史lifecycle异常不同，不声称后者原因已解。新model test32首次因旧前代source-checker SHA断言失败，经授权只更新该metadata pin并独审，31行为组原字节不变，严格hash断言保留。修正冻树下32组model、21+17/12/13组source、两份whole-IDB及1263 raw-ID1区间（S1 625/74088 interval bytes，S2 638/74470；含重叠）和17历史独审probe通过。其余113条命令只在明确dependency证明下复用成功证据；111 Python checker命令、TypeScript/85 Node tests及2 demos均有成功终态。初始与修正两个1422文件/index冻结分别吻合，不能称全程一棵不变树或全新单轮全绿。所有命令逐条同一fcntl锁，npm/node继承NODE_OPTIONS=--max-old-space-size=512 --test-reporter=tap，原argv不改；121条日志及含inode的wait/start/exit/release逐一核验，三份首次/重复失败日志保留。集成delta和单pin例外独审无阻断；74审定新增中70文件逐字节相同，model checker仅单pin差异并非整文件未改，另增1正式guide，共1422 tracked文件。之后仅补5份结果文档并单独复核。Capstone5.0.7历史报告只核hash，本次未重新解码；未执行原EXE或已恢复的机器码，未声称远端CI/stock认证。fallback明确可变且无默认值；S1 bounded0073BE10 store/RET与S2 complete ID0 function都不能证明init调度。fallback reset、custom vtable/full S2 extent/virtual+68 caller/business、canonical ruler/capture、surrender/captive、force灭亡、recursive ruler ownership、positive refund/资源、其余cancel与presentation、event9部队反应、S2 effects/observer、未建模memory/platform/concurrency、stock/Vanilla/runtime及全局RNG继续open。

## 历史完成：P0-71原生部队成员判断

[106-native-troop-membership.md](106-native-troop-membership.md)在新显式troop-slot frame内直接执行004891C0：live location87..1086转换slot，canonical troop validity从leader raw17C/status派生，再依次检查两deputy signed<1100，最后匹配leader/两deputy。负deputy哨兵全允许且不读取deputy person；匹配leader不能绕过无效deputy，helper不添加actor-validity门。未知vtable仍精确full-frame/source/stack只读观察，缺少reached slot原子reject。17继承入口加新troop-member共18入口，旧API/frame/trace冻结。

基线为PR #28已合并main `c190abfd43985251eee4936fdccb5d3910d4fed7`。最新main全新完整112/112命令回归通过：TypeScript、85 Node tests、109 Python checker命令与2 demos；所有命令逐条使用同一fcntl锁，npm/node继承NODE_OPTIONS=--max-old-space-size=512 --test-reporter=tap，保留waiting/start/exit/release及同inode记录，产品argv未改。17组新source及12/13组继承source、31组独立model通过；两份whole-IDB与1257个raw-ID1选定区间重新核验通过（S1 622/74,069 interval bytes，S2 635/74,451，含重叠区间）；既有8组独审probe在正式candidate重跑通过。独立集成delta审阅无阻断：58项生产/model/raw/report逐字节继承已审版本，P0-70→P0-69→P0-68→P0-67递归证明只变metadata/基线断言，含P070/P071独立固定历史提取baseline而不改raw报告。1347 tracked文件/index在全测前后一致，112条日志hash逐一核验；之后仅补5份文档结果文字并另行复核。历史提取51 focused区间/1951 selected bytes，21新unique边界/365新机器码字节，45 code区间/598指令；Capstone5.0.7历史报告只核hash，本次未重新解码。未执行游戏EXE，未声称远端CI或stock认证。非base位置与fallback06EE794C、S2尾extent/virtual+68 caller/business、canonical ruler/capture、surrender/captive、force灭亡、recursive-return ruler ownership、其余handler/positive refund、presentation内部、event9部队反应、S2 effects/observer、未建模memory/platform、clean-stock/Vanilla及全局RNG仍open。

## 历史完成：P0-70原生零退款tail距离

[105-native-tail-distance.md](105-native-tail-distance.md)在同一live frame中将005B8400尾部0049E4D0距离观察替换为原生领土和source-local距离表求值。先比较normalized current与raw home，再转换getter；current领土保存后仍读取home，子scope退出后将distance保存到parent tail，后续callback不重算。duration wrapper fresh复验actor validity并写保存值低byte，-1→255。两源领土/距离表保持分离；真实矩阵均对称，非对称probe仅为synthetic索引测试。旧API/frame/trace冻结，17入口均保留。

基线为PR #27已合并main `8b21e340d577810ca664e829d1d9cb35b1046fc4`。最新main全新完整110/110命令回归通过：TypeScript、85 Node tests、107 Python checker命令与2 demos；每个npm/node使用同一fcntl锁并继承NODE_OPTIONS=--max-old-space-size=512，保留waiting/start/exit/release记录，产品argv未改。12组新source及13组继承source、29组独立model通过；两份whole-IDB与1236个raw-ID1选定区间重新核验通过（S1 612/73,783 interval bytes，S2 624/74,140，含重叠区间）；既有8组独审probe在正式candidate重跑通过。独立集成delta审阅无阻断：51项生产/model/raw/report逐字节继承已审版本，P0-69→P0-68→P0-67递归证明只变metadata/基线断言，新checker独立固定历史提取baseline而不改raw报告。1285 tracked文件/index在全测前后一致，110条日志hash逐一核验；之后仅补5份文档结果文字并另行复核。零新增unique原始区间/机器码字节；Capstone5.0.7的780指令历史报告只核hash，本次未重新解码。未执行游戏EXE，未声称远端CI或stock认证。canonical ruler/capture、surrender/captive、force灭亡、recursive-return ruler ownership、其余handler/positive refund、presentation内部、troop/位置、event9部队反应、S2 effects/observer、未建模memory/platform、stock/Vanilla及全局RNG仍open。

## 历史完成：P0-69 generic设施入口与早返

[104-generic-facility.md](104-generic-facility.md)在共享frame中展开004B40C0入口validity、old-legion pointer保存、generic建筑ID87..16383分类、requested pointer转换与live004AD550。invalid entry返回0，generic完成固定返回1，包含ownership早退或callback使目标失效后。指针构造/转换不虚构target row/validity门；仅新版本relocation移除过严requested-row预读，实际字段读取仍要求可读row，旧API冻结。canonical004B415D..004B4988仍为完整frame/RNG effect-query或原子reject，绑定原始实参、saved old pointer与symbolic entry manager，normal EAX仅integer0/1。

基线为PR #26已合并main `094f94b41795169df73fe708f9bbd29083949ea1`。最新main的108命令集合经重试全部通过：首轮TypeScript、85 Node tests、105 Python checker命令及短demo均过（107/108），末条npm run demo:lifecycle以137/Killed失败；原日志保留，同一文件/index冻结与共用Node锁下，仅该命令设置NODE_OPTIONS=--max-old-space-size=512重试通过。137原因未确认，这不是全新单轮108全绿。13组新source及13组继承source、28组独立model通过；两份whole-IDB指纹与raw-ID1闭包重新核验通过（S1 612区间/73,783 interval bytes，S2 624/74,140，含重叠区间），既有9组手工独审probe在正式树重跑通过。独立集成delta审阅无阻断；27项生产/模型/raw/report文件逐字节继承已审版本，新manifest/checker的真实baseline与两项pin已递归证明只涉及P0-68/P0-67元数据。继承Capstone5.0.7/2,222指令报告核hash，本次未重新解码。1,230 tracked文件和index在原轮及重试前后一致，108原日志加1重试日志hash逐项核验；之后仅补充5份文档结果文字。未执行游戏EXE、未声称远端CI或stock等价。full canonical ruler/capture、surrender/captive、force灭亡、recursive-return ruler ownership、其余cancel/positive refund、presentation/tail距离、troop/位置、event9部队反应、S2 effects/observer、未建模memory/platform、stock/Vanilla及全局RNG仍open。

## 历史完成：P0-68 live零退款取消9/10/12/22

[103-live-zero-refund.md](103-live-zero-refund.md)在P0-67共享frame中直接执行mission9/10/12/22的gate与control，复用notification、零退款return、relocation和真实event分派；23/24维持既有原生实现。9/10仅target数值范围门并保留丢弃的force validity读取，12只构造target person pointer，22验证target force并保存actor color。四段presentation仍需完整before→after/RNG观察或原子reject；tail fresh读取actor，成功body固定return1。旧API、模型测试和raw来源字节不变。

基线为PR #25已合并main `e8bae319e5d1b08057fd091a90d305d58c9d7669`。最新main全新完整106命令确认回归通过：TypeScript、85 Node tests、103 Python checker命令、2 demos；13组source与28组独立model检查通过。两份whole-IDB指纹与raw-ID1闭包复核通过（S1 610区间/73,708 interval bytes，S2 622/74,065，含重叠区间）。122项既有手工独审probe在集成树重跑通过；集成delta独审无阻断，生产/模型测试/raw证据逐字节继承已审版本。1,199文件与Git index在回归前后冻结一致，106日志hash核验。首轮npm的lifecycle子进程曾异常失败，原日志保留、原因未确认；同一代码的独立27项lifecycle和全新整套106随后通过，未把失败抹去。本段结果文字在全测后写入，程序、测试与来源字节不再改变。未执行游戏EXE，未将本地验证称为远端CI或stock认证。其余handler/positive refund、presentation、tail距离、S2 effects/observer、ruler/capture、troop/位置、event9部队反应、force灭亡、stock/Vanilla和全局RNG仍open。

## 历史完成：P0-67武将迁移与固定参数移动准备

[102-officer-relocation.md](102-officer-relocation.md)新增独立版本，在P0-66共享frame中展开004A8270、allocated取消注册分派及固定参数004A7990。保留status2内嵌旧太守清理、ruler live判断、same-home不取消、away两处direct acted、保存distance低byte不复验写回与live governor刷新。004B40C0、其余cancel handler、真实troop成员/非base位置、event9部队反应、force灭亡和stock/Vanilla/全局RNG仍为明确观察或open。

最新main `5215348ebd12cd4bc7b221008775052411fb92bb` 上的完整104命令回归已通过：TypeScript、85 Node tests、101 Python checker命令、2 demos。32组独立oracle模型（含120 seeded场景）与19组来源检查通过；两份完整IDB指纹及new/inherited raw-ID1复核通过。三生产模块及模型测试与已独审隔离版本逐字节一致；集成仅调整真实基线、3项manifest metadata和索引，独立集成delta审阅无阻断。1182文件在全测前后冻结无漂移，104日志hash逐一核对。验证结果文字另行复核；未执行游戏EXE、未认证stock/Vanilla/全局RNG，也未将本地检查称为远端CI。

## 历史完成：P0-66据点归属、耐久与event9/10

[101-base-ownership-events.md](101-base-ownership-events.md)新增独立版本：在空军团merge中直接展开004AD550归属写、source分离耐久上限与有符号word裁剪、城市A4的bit0/1/4 dword重置，以及event9/10复制列表/predicate；保留saved locals与callback后的live读取。新触发的其余cancel handler、event9部队反应尾仍需精确可变观察或原子reject。旧API不变，004A8270/force/ruler/capture、其他event、stock/Vanilla和全局RNG继续open。

20项source检查、23项独立oracle模型测试及完整102命令回归通过：TypeScript、85 Node tests、99 Python checkers、2 demos。双IDB完整fingerprint与483次raw-ID1区间检查通过（32,843 summed selected bytes，含重叠范围，不声称唯一字节覆盖）。独审另核366个predicate与1,262个ownership-prefix边界案例，发现并修复新事件context读取arg2..4被旧getter拒绝的问题，仅新增版本override，旧API未改。最终1,080 tracked文件冻结在全测前后无漂移，staged whitespace通过，无剩余独审阻断。验证结果文字在全测后单独复核；源、模型与测试字节不再改变。未执行EXE，未把本地回归称作远端CI；合并后的main另行验证。

## 历史完成：P0-65空军团分派、合并与raw reset

[正文](100-empty-legion-redistribution.md) · [结构化证据](../sources/empty-legion-redistribution.json)。基线main `116c6dd44d7fc1d102b3dab6f9716a8dde3a4abe`（PR #22已合）。

[100-empty-legion-redistribution.md](100-empty-legion-redistribution.md)新增独立版本，展开空军团primary/nonprimary分派、source/destination合并方向、完整两次roster复制、live据点扫描与人员迁移调用、raw44-byte reset。primary fallback丢弃ordinal查找值而直接使用global ID2..8的原生控制流保留；nearest距离与S1/S2 RNG分开，S2三次共享页读要求逐调用观察。004AD550/004A8270仍是明确可变深层边界，force灭亡仍atomic defer；旧API、stock/Vanilla/全局RNG边界不变。

22项source-only检查及双IDB完整指纹/独立raw-ID1的155区间、26,651 selected bytes复核通过（77双源对73同/4异，另1个S2 RNG hook）。21项模型测试通过，含64组独立seeded merge oracle、完整JSON重放与raw逐store golden核对。独审发现并已收紧canonical city/gate/port恒type-valid和generic building kind派生valid；新frame显式42 city/87 base存储全列，旧API不变。最终100命令全回归零失败：TypeScript、85 Node tests、97 Python checkers、2 demos。169文件工作树/暂存区冻结在全回归及独审前后无漂移；独立复审重跑22source/21model、单独raw-ID1验证155区间及追加128随机reset/112 tie-RNG cases全过，staged/unstaged whitespace干净，无剩余阻断。源asm尾空白已规范化后重新双IDB核验；没有执行EXE或声称不存在的远端CI通过。发布前仅补验证结论及P0-64历史域更正，合并后main仍须全测。

## 历史完成：P0-64原生任务route、目标势力与递归组合

[正文](99-return-route-target-force.md) · [结构化证据](../sources/return-route-target-force.json)。基线main `28d0b0b8aa6e2c781b791886093b806e6e3d1ad3`（PR #21已合）。

[99-return-route-target-force.md](99-return-route-target-force.md)新增独立版本，直接执行005BA320任务分派/arg0与arg1/目标force君主live home/可选territory输出，以及00487EB0设施raw owner、领土city和canonical subtype势力链。两源地图byte分别固定，完整原生getter不再用whole-route/target-force观察；真实外部作用仍绑定full frame/callStack/RNG。新force rulerId和legion forceId与valid严格派生，旧API/trace不变。source未改表/固定vtable/不别名输出与可读map域明确；force灭亡/空军团/ruler/base/capture、其他event、stock/Vanilla/全局RNG仍open。

18项source-only检查通过；完整双IDB指纹及独立raw-ID1重读681范围/65,834 selected range bytes通过（S1 338/S2 343；337同形对328同/9异，另7未配对宽度；新增14范围，重叠选段长度不去重）。30项模型测试通过：2,231个独立oracle接受场景（含96组evolving-frame）、53个原子输入错误场景与25个原子defer/conflict场景；覆盖完整mission/output分派、两源128地图byte、类别/validity边界、真实observer/S2 hook后的live读取、递归event8/14、精确read/store golden顺序、幂等与JSON重放。完整98命令回归零失败：TypeScript、85 Node tests、95 Python checkers与2 demos。自审补充early-route与out-of-range facility两类跳过读取的trace-only精度修正，随后最终98命令重新全过。17文件在冻结全测前后无漂移；独立审阅再次重跑18 source/30 model和S1/S2 observer改map后的fresh target-force例，核对冻结哈希、原始字节、golden序及git diff --check，无剩余阻断。发布前补本结论，并规范化两份新增asm的EOF空行及container hash/linecount，重新通过source与staged whitespace检查；原始机器字节、范围、模型代码及测试不变。合并后main仍须全测。

## 历史完成：P0-63原生roster/role排序、capacity与S2可变查询

[正文](98-native-roster-sort.md) · [结构化证据](../sources/native-roster-sort.json)。基线main `fd1323511ae7f2d1a1f171e787bca2300444cc4b`（PR #20已合）。

新版本在共享recursive frame中展开固定field0 roster key链、entry/pointer分别保留身份的两种quicksort和governor merge；逐次comparator/live capacity替代whole-sort观察，保留重复节点、两轮allocated过滤与clear/reappend，不宣称排序稳定。S1/S2 title/office/technique分别原生投影；query377/278逐调用绑定saved locals、full before/after和RNG。canonical title/office type-valid约束、raw17C/status派生、递归上下文和一次原子提交保持严格；旧API不变。

20项source-only检查通过；完整双IDB指纹及独立raw-ID1重读667范围/65,134 selected range bytes通过（S1 331/S2 336；330同形对321同/9异，另7未配对宽度；含56个新增范围，重叠选段长度不去重）。28项模型测试通过，含100静态与128可变独立oracle、逐step/frame/scope/golden比较及hook序、status6/8 promotion、24-hook真实数组越界域反例、原子/幂等与完整JSON重放。完整96条命令回归零失败：TypeScript、85 Node tests、93 Python checkers与2 demos。16文件冻结在全测前后无漂移；asm文本尾空白规范化后的全部范围已再用raw-ID1复核。独立审阅通过：双IDB/raw667范围、20source/27model另行重跑，追加576个signed-status/raw17C comparator与576个S1 capacity边界case通过；收紧direct building receiver域后，test28/20source及6个canonical端点正例差异复审通过，未误加一般building.valid gate。最终96命令重新全过（28model），16文件冻结无漂移；完整回归结果日志经独审核对，无剩余阻断。发布前仅补本结论；合并后main仍须全测。route/target-force、一般sort flags/vtable/allocator失败、empty-corps/force灭亡、ruler/base/capture、其他event、clean stock/Vanilla/真实存档与全局RNG继续open。

## 历史完成：P0-62原生return/list/role与event8/14递归组合

[正文](97-recursive-officer-return.md) · [结构化证据](../sources/recursive-officer-return.json)。基线main `a3c94e9d045688fe93c3c9b9172db30d5a89333a`（PR #19已合）。

扩展单一live frame，已知return/list/正常非空role直接调用递归event/dispatcher/handler/return。每调用event/actor/copied/visits及native saved locals独立push/pop，回调后按源重读live字段。移首/append和count<2 sort直接执行，多节点sort/route/target-force与外部callback明确可变观察；force灭亡/空军团/ruler capture原子defer。引擎递归/调用guard不冒充原作终止规则；旧API和trace不变。

17项source-only检查通过；完整双IDB指纹及独立raw-ID1重读611范围/53,266 selected range bytes通过（S1 303/S2 308；302同形对296同/6异，另7未配对宽度；重叠选段长度不去重）。37项模型测试通过，含256组独立evolving-frame递归oracle、184组listener/event/source变体、130组独立raw/status truth-table、24组promotion→event14回归、32层真实递归guard、原子拒绝和完整JSON重放。完整94条命令回归零失败：TypeScript、85 Node tests、91 Python checkers与2 demos。独立审阅发现native status写后的derived validity依赖，已补rawDword17C、严格派生缓存及逐写刷新；修复后完整94命令和最终37模型测试重新全过，独立复审通过：新schema的14文件/index在验证前后无漂移，17source/37model与完整94命令重跑零失败；两份完整IDB哈希和611范围/53,266bytes另用独立raw-ID1读取复核，追加36组promotion逐step派生predicate及mixed event14→8/outer-event篡改检查全过，无剩余阻断。发布前仅补本审阅结论，合并后main仍须全测。clean stock、Vanilla、多节点sort内部、其他event、base/capture、全局RNG与真实存档继续open。

## 历史完成：P0-61共享live frame的event8/14单事务组合

[正文](96-mission-event-composition.md) · [结构化证据](../sources/mission-event-composition.json)。基线main `1e5862e045c9aec3db14540c2bd8decc565a321b`（PR #18已合）。

一个共享canonical frame、一个boundary流与一次revision提交执行004BBAA0→004A8110→真实predicate/handler/notification/return-tail primitive→004BA1D0(8/14空分支)→fresh004EC870/nonnull observer。保留复制节点/重复、live mission/executing/subject和native saved current/target/raw44/home/distance；不拼旧project/非干预trace。所有unknown effect仍以source/精确callStack/full before→after/RNG观察或原子reject处理，完整return/list/roles待后续版本。

13项source检查通过；完整S1/S2 IDB指纹与独立stdlib raw-ID1读取425范围、29,809 selected range bytes已复核（S1 212/S2 213；208共同相同、4不同、1 S2专有）。38项模型测试通过，含768组独立evolving-frame/callStack/visit oracle与JSON重放。完整92命令回归零失败：TypeScript、85 Node、89 Python checker与2 demos。最终38项模型测试另行复跑通过；独立审阅通过：冻结13文件/index无漂移，13 source与完整双IDB 425范围/29,809bytes另行raw-ID1重核，关键wrapper/listener/return-zero/away setter/S2 hook再由raw/objdump核序；38 model/768 oracle与完整92命令独立重跑全过，额外42条分支/观察篡改测试通过，无待修阻断。发布前仅补本结论，合并后main仍须全测。S1/S2来源独立、均MOD关联；clean stock/Vanilla/force灭亡/空军团/完整递归return与角色/真实存档/全局RNG继续open。

## 历史完成：P0-60通知门与active-list/acted/零退款return尾

[正文](95-mission-notification-tail.md) · [结构化证据](../sources/mission-notification-tail.json)。基线main `4140af9c71fba30c1a883dcf142ab494025f6472`（PR #17已合）。

独立API闭合canonical005B81D0与handler23/24→005B8400(actor,0)已知写序：rawlegion派生force、player0..7、legion number1；saved current/target/raw force+44；mission/reset→actedbit→dirty→observer→live list-valid/尾追加→duration。重复列表不去重，同地reset不删active节点；callback可改变valid/status/home/list。S2 wrapper query267是result+全frame/RNG观察，异地直acted不走hook；presentation/nonnull observer/fullreturn均明确可变观察或整次reject。旧API/trace不动；版本化return/role/event与后置observer组合仍next。

123范围/10,811 raw bytes，双IDB指纹与独立raw-ID1核对，61共同对比4差异及1个S2-only hook。33模型测试含512独立oracle/JSON replay通过。完整回归90条命令零失败：TypeScript、85 Node、87 Python checker与2 demos。独立审阅通过：14文件freeze/hash一致，双IDB完整指纹与123范围/10,811bytes另行stdlib mmap raw-ID1重核；33模型/18source及完整90回归独立重跑全过，额外32组query→observer→live status/saved-home链式反例与5组presentation错绑原子拒绝通过，无待修阻断。发布前仅补本结论；合并后main仍须全测。S1/S2均MOD关联；clean stock/Vanilla/force灭亡/空军团/真实存档/全局RNG仍open。

## 历史完成：P0-59 event8/14任务监听与显式可变tail观察

[正文](94-mission-event-listeners.md) · [结构化证据](../sources/mission-event-listeners.json)。基线main `de7f0218eefe528687b82c9659feeee1de77b8a3`（PR #16已合）。

新独立API恢复004A8110→005B9D30：44slot注册、copied-active节点序/重复、live executing/mission、仅mission23/event8与mission24/event14 predicate、类型/valid/ID/rawkind门及独立handler入口gate。CITY与building对象分开，handler0仍dispatcher1；成功tail以source/event/stage/saved-pointer/full-frame before→after替换或整次reject，允许任务/active/executing/data/RNG变化，不默认callback非干预。旧API/trace不动；完整004BBAA0后置observer与return/role组合仍open。

两源各169范围/105code/64data，合计22,202 raw bytes；完整IDB指纹、独立raw-ID1与text byte hash全过，169对选段全同。14source与34model测试含768独立oracle/JSON重放通过。完整回归88条命令零失败：TypeScript、85 Node、85 Python checker与2 demos；独立审阅通过：14文件/index一致，338范围/22,202bytes另行stdlib raw-ID1核对；全部回归重跑及512 evolving-frame/1,241可变tail、512 JSON replay、1,536证据/RNG重签篡改拒绝与10边界preflight测试通过，无待修阻断。发布前仅补充本审阅结论；合并后main仍须全测。S1/S2均MOD关联，recorded EXE hash非binary认证；clean stock/Vanilla/force灭亡/空军团/真实存档与全局RNG仍open。

## 历史完成：P0-58稳定非空军团与太守角色协调

[正文](93-legion-role-reconciliation.md) · [结构化证据](../sources/legion-role-reconciliation.json)。基线main `6d62e86caddd50887b4d4792cb1918526e980722`（PR #15已合）。

新增独立004BE2A0稳定分支及004BCA30(refresh=0)标量API：allocated与valid存在谓词分开，军团长与太守比较器不同，capacity低16位/office/derived bytes等输入可追溯；原home-roster次序、最后status<=1 shortcut、old==new暂态status/太守变化和0..86据点调用顺序保留。event8在太守字段写前、event14在清空后，完整阶段snapshot精确反映live mutation。capacity/mission getter与监听器均未执行，显式非干预record/reject；无虚构军师调整。

灭亡/空军团/refresh!=0/非安全排序域整次defer，完整返回/capture未组合。stage-bound观察、完整稀疏canonical域、原子preflight、command防重与trace重放不改变所有旧API/trace。S1/S2容量计算及hook差异分别取证，clean stock/Vanilla/真实存档与全局RNG仍open。199范围/21881 raw bytes均直接双源取证并另用raw-ID1复核，98组共同范围94同4异，另含3个S2容量hook。17项source与47项模型测试（含512组独立全状态/事件快照oracle及JSON重放）通过。完整回归86条命令零失败：TypeScript、85 Node、83 Python checker、2 demos；模型测试最后新增4项后另行复跑47项全过。独立审阅通过：冻结14文件/index一致，另行直接raw-ID1核199范围/21881bytes与双IDB指纹，47模型/17source/512 oracle及完整86回归再次通过，无待修阻断；旧API/trace/训练代码未修改，staged/unstaged whitespace clean。合并后main仍须全测。

## 历史完成：P0-57武将返回字段与列表/角色调用序

[正文](92-officer-return-finalizer.md) · [结构化证据](../sources/officer-return-finalizer.json)。基线main `1ff61538c16a1e95dddc15cd228f63d7e15cd356`（PR #14已合）。

独立004BF6F0投影补home→actual location→rawlegion→bit9及旧新home/legion roster调用阶段。保留numeric same-force、实际troop观察、kind/ID/subtype区别、-1不清bit9、非法legion请求仍先移旧roster和saved status控制role顺序。ruler ownership/capture整次defer；旧新军团/旧home完整角色与list/UI/notice继续显式非干预record/reject，不把局部after当全返回。所有旧API/trace不变。

108个范围直接重读两份IDB并另用raw-ID1复核；54组双源比较全同，3744新增raw bytes/9560选定bytes，既有54范围固定hash复用。18项来源测试与27项模型测试（含384组固定seed oracle/replay）通过。全回归84条命令零失败：TypeScript、85 Node、81 Python checker与2 demos。notice formatter/display参数栈拆分已由callee ret0x10确认并修正。独立审阅无剩余阻断：冻结14文件及index逐字节一致、108范围/9560 bytes再次raw-ID1复核、27模型/18source及全部回归和另11边界case通过，旧API/trace/训练代码均未修改；staged/unstaged whitespace检查clean。合并后main须再全测。下一主题是稳定非空004BE2A0角色协调；完整角色/force/事件/capture、base销毁、clean stock/Vanilla/真实存档继续open。

## 历史完成：P0-56 mission37完成、一步推进与延迟退款

[正文](91-return-mission-lifecycle.md) · [结构化证据](../sources/return-mission-lifecycle.json)。基线main `b488a9f6a38fbb45e6e6c2ac64cd68f6fa3f97ed`（PR #13已合）。

独立complete/advance API补上mission37 positive refund→mission/five-args reset→duration0。单supplied active-list成员保留live valid/mission/acted gate、observed stop、源分离六邻城最小距离与首slot tie、到达真实building ID、handler1/dispatcher0、full-return边界后的direct acted0/duration0。no-next只清任务参数；canonical valid home/安全target地理/资源子对象限制明确是模型边界，完整callback与全链表/旬scheduler未执行。

106范围直接重读并另用ID1 raw section复核，53组双源比较46同/7异；16项source测试、27项模型测试含256组fuzz通过。完整trace/RNG零local调用、全部观察preflight、原子拒绝和重复退款保护保持此前API/trace不变。全回归82条命令通过：TypeScript、85 Node、79 Python checker与两demo。独立审阅直接复核两份IDB全部106范围、两个1764格距离矩阵，重跑旧v1/v2/group/facility/special 15/15/20/24/21 tests；port/gate query ledger前移修复及新增阶段测试复审通过，无剩余阻断。合并后main须再全测。完整004BF6F0/角色reconcile、base销毁、事件/force/capture组合、clean stock/Vanilla/真实存档继续open。

## 历史完成：P0-55能力培养任务41..43取消

[正文](90-special-mission-cancellation.md) · [结构化证据](../sources/special-mission-cancellation.json)。基线main `8dd3a566b3d4627657ab2cbe9c50ccb3c9c84fdb`（PR #12已合）。

41..43共享005D9C60已有独立有界API：actor→args[1]建筑0..16383→args[0]培养记录0..97按序短路，不虚构实际所在地valid gate。troop/-1与home=-1相等时正确reset；六个双源vtable+18新slot确认005DA320条件通知取actor.home。零退款、S2同地acted差异、字段阶段快照、观察preflight和显式callback非干预/record/reject保持此前API/trace不变。

新增10范围、引用47范围均直接重读IDB并核哈希；28组双源比较27同/1异。8项字节checker和21项模型测试含360组fuzz通过。全回归80条命令通过（TypeScript、85 Node、77 Python checker与2 demos）；独立审阅无阻断：独立stdlib mmap/ID1直接重读两份IDB，全部57范围与源哈希及六slot吻合；新增8+21和旧v1/v2/group/facility的15+15+20+24 tests重跑通过。合并后main仍须再全测。专用cancel家族现均有分开的有界投影；base销毁、mission37完成、004BF6F0全返回/事件/force/capture组合以及clean stock/Vanilla仍open。

## 历史完成：P0-54设施任务取消、销毁字段与宝物42

[正文](89-facility-mission-cancellation.md) · [结构化证据](../sources/facility-mission-cancellation.json)。基线main `3a93431f3ef8a4e15e920ebb9475939a6aab1e21`（PR #11已合）。

0/38已有独立有界投影：当前建筑必须type0；mission0按ID前三组收集先于target；目标无效返回1且不reset。零退款返回之后才是type30 treasure42 owner/city/state与设施销毁。raw0x38只写精确offset/width，未知byte保留；城市计数模256，S2升级type54..59仍有construction gate而S1无此gate；home扫描使用allocated与来源各自ID排除。

新增24项模型测试通过，覆盖两源完整设施type/construction矩阵、全部byte回绕、treasure边界、invalid-but-allocated home、精确写宽、所有必要观测preflight、原子拒绝、时序快照、重放与fuzz。source-accepted type0..2销毁为显式defer/reject；完整列表/attachment/force/空间AI/return回调未执行，非干预是可替换工程前提。77个新字节范围、24个既有引用，38组双源比较35同/3异，10项字节checker通过。TypeScript、85 Node、全部75个Python checker与两demo共78条命令全过。独立审阅无阻断：重跑新增10+24及旧group20/v2 15/v1 15测试，另366组直接source-bytes计数oracle和20项invalid-type/reorder回归通过；具体class5 gate证据缺口已补齐并复核。合并后main须再全测；不以局部after冒充整场capture或stock/Vanilla证明。

## 历史完成：P0-53组任务取消、城市计数与研究字段

[正文](88-group-mission-cancellation.md) · [结构化证据](../sources/group-mission-cancellation.json)。基线main `b95e33a7c1e23e7bc14a8ec23b90ff5030099c8e`（PR #10已合）。

2/5现有独立组事务投影：完整稀疏person宇宙，ID序前三个同任务/组键匹配者，不按势力/位置/target过滤且不保证actor入组。2先恢复四路signed city计数clamp[-1,30]；5先清actor force研究ID/byte，然后才按组序零退款返回。无效city/force只跳过相应字段，不阻止组取消。S2研究getter扩至63的00914000 hook与S1分离。

新增20项测试通过；21新增byte范围（10双源比较8同/2异及1S2 hook）、25既有引用范围和容器/manifest哈希锁定。TypeScript、85 Node、73 Python checker与两demo共76条命令全过。独立审阅无阻断：新增20、旧v1/v2各15及detachment28测试通过，另1024组独立oracle/重放和16组mutation/domain验证通过，46范围均从两份IDB重读匹配；preflight修复已复核。PR #11合并后main 3a93431f已复测76条命令全过。旧v1/v2未改义；完整return/list/event/force回调、41..43与stock/Vanilla仍open；0/38新增有界范围见P0-54。

## 历史完成：P0-52六个零退款任务取消handler

[正文](87-mission-cancellation-zero-refund.md) · [结构化证据](../sources/mission-cancellation-zero-refund.json)。基线main `324dd78b3c5a831cdf5d9406f63c492b7248bed4`（PR #9已合）。

9/10/12/22/23/24现有独立v2有界投影：actor→实际据点→target的短路gate、零退款、异地mission37/同地reset和S2 acted hook。9/10/12没有目标有效性硬gate；24建筑getter域到16383；23城市子对象不与建筑valid混淆。旧v1保持原trace边界；回调未执行及其不干预是显式record/reject政策。

验证：新增15项测试通过；TypeScript、85 Node、全部72 Python checker与两训练demo全测通过。双源六handler正文相同；新增4个source字节范围、既有manifest固定哈希和直接调用/比较opcode校验。独立审阅无待修阻断，另5760组source/gate/boundary/policy/trace和12组v1迁移/快照alias验证通过；新增四段由审阅者重新读取IDB核对。PR #10合并后的main b95e33a已复测75条命令全过（typecheck/85 Node/72 Python/两demo）；未运行原作或真实存档。剩余0/2/5/38、41..43、mission37完成、004BF6F0完整返回/事件/force链及clean stock/Vanilla/主机版继续open。

## 历史完成：P0-51人员游离、末城逃逸与任务取消资源

[正文](86-personnel-detachment-source-profile.md) · [结构化证据](../sources/personnel-detachment-source-profile.json)。本组基线main `453305b2dc64927a715fc58fceb0522557815f34`（PR #8已合）。

004BA520按candidate→anchor距离1收集42城ID序候选，不过滤势力；无效anchor的早期Random42在troop覆盖后仍保留消费。004BBB00的home/territorial-city实际位置、军团/身份/忠诚/官职/期间与旧军师/太守/军团长字段现有有界投影；events2/8/5/21及invalid-former release的event4/tail顺序有快照与重放。旧任务直接reset后才set37，因此此在野路线不触发取消退款。

44任务cancel注册表和vtable+0xC已恢复，明确区分无操作、15..21已投影退款/异地返回以及其余专用handler。S1/S2金cap、query33/38和S2 acted-hook分别绑定来源。旧P0-50 v1不静默改trace；两个新独立模块均显式record/reject，尚未组成完整capture或force灭亡，未接入训练战斗。

验证：TypeScript、85 Node、全部71 Python checker与两个训练demo通过；detachment 28项测试覆盖146个邻城选项，cancel 15项专用测试含source分支和完整输入重放。403个文本字节范围、201组S1/S2对照（194同/7异），另S2 hook单独取证。独立审阅无待修阻断，另704组source/mission/location/policy扩测通过；最终main合并后另行复核，不能将无远端CI配置误称CI通过。clean stock、真实存档/全局RNG、监听器/其余cancel/完整返回与force、Vanilla/主机版仍open。下一主题可优先进入其余专用cancel handler、004BF6F0返回、004A8110→005B9D30事件任务链或004B03D0 AI处分。

## 最新完成：P0-50旧俘虏释放、迁移与排序来源审计

[正文](85-capture-relocation-source-profile.md) · [结构化证据](../sources/capture-relocation-source-profile.json)。本组基线main `e4dab4be5e86bd3d410048137a9c2a3847f2f494`（PR #7已合）。

恢复原home链序的旧俘虏pass、己方归属shortcut、返回原势力首军团/君主home、event4后禁仕tail、004B0F50目的地优先链和territorial-city距离/同分随机。004A7990只准备任务期间并返回origin，base escape不写actual location；004B1950末城gate在selector之前。缺席home-roster与身份rank表降序稳定排序已恢复，不能混同资金不足forced-release comparator。

独立有界Python人物投影，34项测试；126个文本范围、63组S1/S2对照（58同/5异），其中距离表1084/1764个byte不同。输入与RNG/事件时序有trace和重放，未执行任务取消资源、太守/军团/force/事件callback；004BBB00/004BA520在野路线用明确defer/reject，未拼成完整capture。两源均MOD相关；stock、真实存档/全局RNG和独立Vanilla等价仍open。

全回归：TypeScript、85 Node、全部69 Python checker、两训练demo通过（最终main仍须合并后复核）。下一主题可继续004BBB00/004BA520及任务取消资源finalizer，或004B03D0 AI处分callee；不能因本组helper body恢复而清除完整游戏证据债。

## 最新完成：P0-49城兵容量与人员capture来源审计

[正文](84-capture-personnel-source-profile.md) · [结构化证据](../sources/capture-personnel-source-profile.json)。本组基线main `feca7b37678bccff55d0e8e5732cea463c457708`。

S1城市特产查询及150000/100000兵cap、身份/地点/势力候选ID顺序、末城硬gate、type0宝物与skill32优先级、binary32(0.01)取整、p<=0零随机/p100仍消费随机已恢复。004B2820六路处分表及玩家/AI非连续tails已取证；可运行模型提供显式hold/observed/reject配置和三个已知俘虏字段写回。

这是004B3180起点的独立部分投影：前置释放已作为输入阶段契约，后续位置/军团/任务/非hold处分及事件不伪造。P0-48未因此变成整场capture。PK reconstruction、Vanilla单独assumption；S1/S2均MOD相关。S2确有末城gate/skill/概率/RNG和容量改动。

静态证据：142个文本范围、71组对照（61同/10异）。新30项测试含77,824组算术及trace/replay边界通过。全回归：TypeScript类型检查、85个Node测试、全部68个Python checker与两个训练demo通过。依赖沿用前组相同lockfile且已验证的registry包副本。这些原下一项已由P0-50新增有界投影；当前剩余在野/资源/AI/callback范围见顶部P0-50。clean stock/全局RNG/真实存档债仍保留。

## 最新完成：P0-48 capture transaction来源审计与有界投影

[正文](83-capture-transaction-source-profile.md) · [结构化证据](../sources/capture-transaction-source-profile.json)。本组基线main `9462f8cf1e9e24147757f0032aec1f11df579033`。

三direct caller cause/mode、关系helper、完整有序世界候选、type30/overflow、设施unlink和存活domestic动态owner刷新已接入参考模型。Neutral最终清零此前保留资源；ordinary ownership按新owner max先cap耐久，再尾半max floor；普通入城先用完整兵数加权气力，再逐资源/12 cargo slot cap。半耐久与非整除rounding现在有S1 body和有前提的scalar实现，不再笼统称缺body。

这是独立Python参考事务，未向TypeScript训练沙盒添加战斗。PK明确reconstruction，Vanilla独立assumption；人员/俘虏、force量值/灭亡、设施计数器/引用、太守排名、事件/AI/显示队列及复杂入城使用显式fallback ledger或拒绝，不冒充完整原作事务。

静态证据：61个来源范围、24组S1/S2比较（17同/7异）；S2对caller/资源/候选/宝物/地域表有修改，绝不混入S1。全部来源仍MOD关联，clean stock、全局RNG/真实存档以及跨平台证据债保留。

验证：新参考校验35个test（含150状态组合）通过；TypeScript检查、85个Node测试、全部67个Python check脚本、训练demo和十年360旬生命周期demo均通过。该组后续人员/容量研究现见P0-49；完整人员迁移及事件链仍可从已有静态资料推进。

### 既有P0-36更新范围

`004B9840`在S1普通building-entry非负有界域为整数floor加权，source rounding已恢复。P0-36的旧unknown断言保留为当时/stock与troop-to-troop证据边界，不再作为S1 helper缺body的现行结论。

## 最新完成：P0-47训练生命周期与source审计

[实现指南](../engine/pk-training-lifecycle.md) · [来源审计](82-training-lifecycle-source-profile.md) · [结构化证据](../sources/training-lifecycle-source-profile.json)。本组从main `56f1aa4ad9cf2bff5612b1777e16dc54be0cdefb`的新分支开发。

训练资格与独立身份/位置/任务状态、行动重置、可替换旬phase plan、累计WAR经验成长、v2存档与显式v1状态迁移已完成。XP0..3000累计，不在每次+1时扣100；普通合成能力clamp1..100。默认满气力拒绝，但EndTurn可继续；十年360旬全trace/seed/save/replay回归通过。

S1来源中`005C4100/005B8320/005B80F0`、XP writer/getter、研究共享XP、reset全局遍历及非连续tails、`0059C330→0059C2A0→0059A230`野外气力tail-xref现已恢复。S1/S2两个IDB均关联MOD，且S2的XP/能力cap确有不同；不能将source字节升级为stock PC-PK1.1。

原作证据债继续保留：独立clean stock对照、完整scheduler/AP时序、任务与属性全链、全局RNG、Vanilla/PS2/Wii。此切片仍无AI/经济/战斗/派遣等完整游戏系统，也不关闭下面P0-46剩余capture缺口。

验证：TypeScript检查与85个Node测试通过；全部66个`check_*.py`通过；两个demo及growth-fixture CLI通过；26个函数/尾块fingerprint、11个opcode断言、8组S1/S2对照、24,008条成长不变量通过。独立代码审阅无未修阻断。既有`check_techniques.py`只修3处字面\n语法错误，保留全部规则断言与merit unresolved标记。

## A1–E20 主审计已完成；正在清理 exactness gaps

A1–A5、B1–B9、C1–C11、D1–D10、E1–E20 共55个主审计点已经完成写回。

### 最新完成：P0-46 据点陷落 caller / 内政设施 selector 来源审计

- [P0-46 正文](81-capture-selector-source-profile.md)
- [P0-46 结构化证据](../sources/capture-selector-source-profile.json)
- [机器码摘录](../sources/capture-selector-source-profile/capture-selector.asm.txt)
- [参考模型](../../scripts/capture_selector_profile.py) 与 [校验](../../scripts/check_capture_selector_profile.py)
- [攻城主规则](05-combat.md)

本轮恢复 `004B2CA0..004B36FF`（末尾不含）的 body、三处直接 caller、city-only gate、全局链表候选顺序、完成状态/type30/30容量边界、魅力 getter、保留 quota、RNG 和销毁前缀。`004B329B` 是该函数内的资源段，不能因它不是 selector 就排除整个 containing function。

来源算法为 `keep=min(n,floor(max(20,charm)/20))`；无硬性5上限。n>1时逐项做 n 次全范围随机交换，即使全部保留或最终全毁也消耗 n 次 RNG。新势力ID超出0..41时，在 shuffle 后改为全毁。完成铜雀台在普通候选之外；总保留数不等于 quota。算法不是均匀 Fisher–Yates。

**原性边界：** 公开 IDB 记录的输入位于“血色5.0公测”目录。本轮 `opcode-exact` 只绑定其 source profile/hash，`stockOriginalVerified=false`。stock PC-PK1.1 采用时是 `compatibility-reconstruction`；Vanilla 必须另标 `compatibility-assumption`；PS2/Wii 独立 open。

附带恢复的晚期耐久块把当时耐久补到 `floor(maxAtTail/2)` 下限，高于则不降低。P0-48现已恢复ordinary/neutral scalar finalizer和有前提的pre-to-post关系；全人物/事件副作用仍未闭合，不能宣布所有陷落模式一致。

参考模型只接收已资格化、有序候选并返回计划/trace，提供注入draw、工程seed和已给定状态的来源LCG三种模式。校验通过不等于原EXE/存档回归，也不等于完整候选/事务引擎已实现。

下一步以P0-48为准：clean stock build 对照、剩余人物/force/callback finalizer、全局 RNG/存档验证；按可定位缺口推进，不预设固定 P0 终点。P0-44/45保留为历史证据，当前 selector 结论以P0-46的限定范围为准。

历史基线曾为65项中64项通过，唯一技巧脚本SyntaxError现已作语法修复；不代表技巧研究证据债关闭。


## 2026-10-11 生产耗时独立caller投影

已新增本地候选 `calculateProductionTimeProjection` / `production-time-observations-v1`（说明：production-time.md）。仅固定listing与逐调用观测驱动的整数/trace；全无效返回9、type9跳扫描、重复validity/设施解析独立、允许负数和零、技能向零减半。真实helpers/ABI/对象可变读取/命令/库存writer/完成调度/实际日数/stock仍open；未覆盖P0-78及依赖。新树验收和发布状态外部收据单列，不复用PR #55历史通过。

## 2026-10-16 独立官职分配服务

已提供80有名官职的selector、稳定升序/即时移出planner、带完整state绑定和重算核对的原子apply，以及单状态JSON和initialState+requests完整receipt重放。资格policy明确ordinary/ready/merit/title/占用门，既任默认fill、显式rebuild；一般职与10个君主爵位元数据分开，null未任职与内部entry80不混用。

[具体规则、80行表及手算示例](office-assignment-service.md) · [API](../engine/office-assignment-service.md) · [来源](../sources/office-assignment-service.json)

仍open：005FA4D0/005FA650 body、entry80、原caller候选顺序和mode映射、多职writer、stock/Vanilla/console等价。4000真实资料阶梯保留，但不把其他helper opcode当成005FA4D0 body证据。本次未执行测试、typecheck、build、编译、checker、产品/诊断，旧测试不增删；不复用历史通过状态。未连接P0-78/native军团太守/归属/capture/return/mission依赖。

