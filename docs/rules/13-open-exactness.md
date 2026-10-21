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

2026-10-14 新独立工程候选：[城市粮食收入非Easy稳定已解析输入投影](city-food-income-projection.md)，基于PR #60已合并main `57a2f4dd34d0d888b23d1e46e2cb78402b91a7b4`。固定160条/494 bytes和16+22 bytes两表、30槽与4种统一类型行；军屯农保留U32乘积低位后unsigned /15000，最后signed32向零/100支持负返回；difficulty0整个Easy分支拒绝。只补已有规则的工程覆盖，原43组未决证据主题不减。来源仅source-listing-reconstruction，不认证stock/Vanilla、真实helper/ABI、原表、city/owner、writer或scheduler，P0-78及依赖排除。实现和全新验收仅本地；正式聚合及独审结果另记，以下历史通过数字不验证本树，旧城市金钱179原run/证据保持不动。

> 当前状态（2026-10-16）：下文PR #55等“最新候选/未发布”文字是当时的历史快照；[PR #55](https://github.com/DanielMax937/sanguozhi/pull/55)及截至PR #71的交付已合并，当前对应机制见[逐PR规则正文定位表](historical-pr-rule-index.md)。合并不关闭本页原作证据缺口，不升级旧API范围，不恢复P078及依赖；本次未运行测试，历史运行要求与失败原样保留。


# 尚缺精确内部公式/版本验证的规则

2026-10-11 新独立候选：[征兵治安writer请求参数叶](recruitment-security-argument.md)，基于已合并PR #57 main d1e93ada18efa5f95c584afd9309b228f9391f0c。只接早期保存C与入口ESI的u32两标量，signed IDIV/NEG、规范+0；7条/19 bytes（含两push9条/21 bytes），不接写回/command、不复用数量输入、法治MOD隔离。实际征兵/治安损失、ABI/helpers/stock仍open；新验收另记，下方旧候选/最新数字不验证本树。P0-78及其依赖新增实现继续排除。

2026-10-10 最新本地候选：[探索搜金caller整数投影](search-gold-caller.md)，基于已合并PR #54 main `cb76e148f35b519283cc296361b507674d0fff3a`。仅RNG返回后29条/82字节、逐调用点uint32观测与signed32分支；二轮getter仅裁剪时必填，不复用首轮，结果非实际奖励。人才PR #53、宝物参数PR #54已交付；以下旧“本地候选”及验收数字是各自历史冻结记录。本批新树单独验收、尚未发布；完整搜金/探索、RNG/helper/writer/stock仍open，P0-78及依赖排除。


> 2026-09-29 第三轮证据审计后更新。
>
> 本文件只保留**目前仍不能负责任地升级为 confirmed / empirical-high 的核心缺口**。已经解决的项目见 `14-evidence-audit-2026-09-29.md`；每项可运行 fallback 见 `16-unresolved-rules-fallbacks.md`。

## A. P0：仍影响长期模拟准确性

### 1. 普通登用概率（外层已源码级收窄；005C4F80本体仍open）

P0-1 专项见 `36-hiring-probability-exactness.md`。

当前 PC-PK1.1 已能把真实外层固定为：

```text
004AF7D0
硬成功/硬失败
  ↓ 未命中
005C4F80 GetHiringSuccessRate -> p
  ↓
第三参数=0？
  ├─ 是：005BA4C0 deterministicValue < p
  └─ 否：义理外层倍率 -> 004721D0 runtime probability
```

正常人才命令第三参数明确为0，因此**不吃非0模式的0.9/0.7外层义理倍率**。

非0模式精确为：

```ts
factor10 =
  min(10, 15 - 2*giriInternal)

p2 =
  min(100, trunc(p*factor10/10))
```

正常模式送入 `005BA4C0` 的七个参数已经恢复：

```text
dateKey
targetId
executorId
targetLoyalty
executorCharm
executorTargetCompatibilityDifference
0
```

最后机器码：

```asm
cmp eax,ecx
setl dl
```

所以严格是：

```text
deterministicValue < successRate
```

`005B9C00 GetTimeValue` 还确认：

```ts
dateKey =
  day*7 + month*5 + year*3
```

异地登用保存的是发令日 dateKey。

### 必须隔离的现代 MOD 公式

2025年以来新版 SIRE/血色衣冠出现的：

```text
基准60
忠诚-100%
相性差-50%
魅力+20%
仕官第一年-20
浮动值6
...
```

被其更新日志明确描述为“新忠诚度系统 / 登用意愿”的可配置规则。

因此其证据标签固定为：

```text
SIRE-modern-mod-system
```

不得回填成原版 `005C4F80`。

### 仍未知

- `004AF7D0` 完整函数体；
- `005C4F80` 内部连续成功率闭式；
- `005BA410`；
- `005BA4C0` deterministic generator；
- Vanilla / 主机版等价性。

所以本项被**显著收窄但未虚假关闭**。

### 2. 外交公式的版本边界（P0-2 边界已解决；常量仍open）

P0-2 专项见 `37-diplomacy-version-boundaries.md`。

官方补丁记录现在可以把 PC Vanilla 精确切成：

```text
1.0
↓
1.1：友好增减平衡调整
↓
1.2：友好增减再次调整
     + 计略・外交成功率调整
↓
1.3～1.3.3：公开changelog未再列外交专项
```

所以“Vanilla 一套公式”已明确错误。

同时，PK 当年明确新增“超级”难度，而现有完整外交公式族包含：

```text
初级1.0 / 上级0.8 / 超级0.7
```

因此该完整公式族只能安全标：

```text
pk-era-formula-corpus
```

不能反推成 Vanilla 1.0/1.1 原公式。

当前 profile：

```text
vanilla-pc-1.0
vanilla-pc-1.1
vanilla-pc-1.2-plus
pk-pc-formula-corpus
pk-pc-reverse-support
console-separate-open
```

Vanilla 如为了闭环临时复用 PK 公式，必须显式：

```text
compatibilityAssumption=true
```

PK1.1/1.1.1 官方补丁没有公开外交专项变化，但这只支持“公开changelog无变更”，不证明 PK1.0/1.1/1.1.1 二进制公式 identical。

本项版本**边界问题已解决**；仍 open 的是各版本 exact constants：

- Vanilla 1.0；
- Vanilla 1.1；
- Vanilla 1.2 实际改了哪些常量；
- Vanilla 1.2～1.3.3 二进制等价性；
- 现有 PK 公式 corpus 的 exact build；
- late Vanilla 与 PK 的具体共享范围；
- 主机版；
- 历史公式族的原 EXE 入口。

状态：

```text
version-boundary-resolved
constants-still-open
```

### 3. 攻城统一公式与据点接管资源（P0-3 主链已收窄）

P0-3 专项见 `38-siege-capture-exactness.md`；P0-46当前capture来源边界见 [81-capture-selector-source-profile.md](81-capture-selector-source-profile.md)。

当前 PC-PK1.1 已确认：

```text
城兵伤害：
005ADC30 通用战斗伤害核心
+ 据点/兵器/难度外层修正

耐久伤害：
普通兵种/井阑/投石 -> 005ADDC0
冲车/木兽          -> 005ADE20
```

耐久外层已恢复：

- 远程普通攻击/无战法 durabilityPower=5；
- 相邻普通攻击=15；
- 战法取 tacticData+0x2F；
- 目标类型倍率；
- 会心×1.15；
- 云梯普通陆军×1.4、兵器等×1.2；
- 超级难度玩家×0.75。

普通耐久闭式目前可用逆向重构：

```ts
trunc(
  sqrt(troops)
  * attack
  * sqrt(1/1500)
  * (1+power/25)
  * targetMultiplier
  * troopMultiplier
  * extraModifiers
)
```

10000兵、攻击80、城市目标：
- 相邻普攻=231；
- 弩远程普攻=173；
与原作实测一致。

攻陷资源保留已由 `004B329B` 完整闭合：

```ts
retainPct =
  max(5, trunc(commanderCharisma/10))

retained =
  trunc(oldAmount*retainPct/100)
```

统一作用于：

```text
金
兵粮
兵力
12类兵装
```

旧“魅力/10直接作为百分比、低魅力可能0%”错误；原程序有最低5%。

当前真正仍 open：

- `005ADDC0` 函数体；
- `005ADE20` 函数体；
- 小兵力/x87取整；
- 小数量兵器/舰船整数边界；
- 已恢复selector与clean stock PC-PK1.1的字节等价性；
- 已列3 direct caller之外的历史/脚本/劝降cause，人物/force/事件完整finalizer；
- 有界ordinary/neutral scalar以外的二次ownership/外部callback耐久关系；
- 全局RNG初始状态/消耗与存档回归；
- Vanilla各补丁/PS2/Wii自身实现。

P0-46新增已知范围：公开IDB的 `004B2CA0` body、三直接caller、city-only gate、候选链表序及30容量、完成/type30分支、`floor(max(20,charm)/20)` quota、n次全范围swap和销毁前缀均已恢复。`004B329B`只是资源局部段。新势力ID超0..41在shuffle后改为全毁；不能将其改名为“处断君主”规则。P0-46参考模型只处理已资格化有序候选；[P0-48](83-capture-transaction-source-profile.md)已新增完整世界收集与有界事务。

来源IDB的input path含“血色5.0公测”，因此 `opcode-exact` 仅限绑定hash的source profile，stock原性未核。PC-PK1.1采用为 `compatibility-reconstruction`，Vanilla单列 `compatibility-assumption`。晚期耐久 `currentAtTail < floor(maxAtTail/2)` 才写下限，不是完整capture reset公式。

P0-48进一步恢复三caller mode/关系排除、normal/neutral finalizer、普通入城及存活domestic动态owner：neutral分支会清零中间保留资源；ownership先按newOwnerMax向下cap，尾部再半max floor。`004B9840`在S1有界非负building-entry域的非整除floor已恢复，stock和troop→troop仍未知。模型显式记录未覆盖人员/force/计数器/事件等fallback，不能称整场原游戏capture闭合。

P0-49新增[人员/容量审计](84-capture-personnel-source-profile.md)：S1特产容量查询、004B1280分组与binary32小值边界、004B2820处分路由已恢复；当前模型只写三个已知俘虏字段，完整位置/军团/任务/非hold处分和事件仍open。

P0-50新增[前置释放/迁移/排序审计](85-capture-relocation-source-profile.md)：旧俘虏pass、004B0F50目的地、004A7990任务期间/返回origin、base escape不写实际位置、缺席home-roster和稳定身份rank排序已source-bound恢复并有界投影。P0-50 v1原有未投影范围的后续进展见P0-51；这仍不解决0058C320维护费forced-release comparator，也不证明stock等价。

P0-51新增[游离/任务取消审计](86-personnel-detachment-source-profile.md)：004BBB00/004BA520目的地、实际territorial-city、身份/军团/职务字段与事件顺序现有独立有界投影；004A57B0注册dispatch和15..21取消退款/返回路径已恢复，S2 cap/query/acted-hook差异隔离。其他专用取消handler、004BF6F0返回和004A8110监听器、完整force灭亡/君主继承/全capture组合仍open。不能再把已实现局部路线笼统称为缺body，也不能以此关闭完整事件。

P0-52新增[六个零退款handler](87-mission-cancellation-zero-refund.md)：9/10/12/22/23/24的ordered gate、目标pointer域与无效性检查区别、零退款返回/reset现在有独立v2投影；v1仍保留历史语义。该组当时剩余专用取消为0/2/5/38和41..43（后续有界进展见P0-53..55），另mission37完成、004BF6F0及完整callback链继续open，不能再笼统称这六个handler未投影。

P0-53新增[组任务取消](88-group-mission-cancellation.md)：2/5的按ID前三人、城市signed byte恢复/actor-force研究字段先于逐人返回现有独立原子投影。S2研究getter扩展到63已追到独立hook。该组当时剩余专用cancel为0/38和41..43（后续有界进展见P0-54..55），以及mission37完成/004BF6F0/完整回调；v1/v2的历史trace保持不变。

P0-54新增[设施任务取消](89-facility-mission-cancellation.md)：0/38 gate、mission0组收集先于target、无效target返回1但不reset、type30宝物42尾部、type3..63 raw写宽/城市byte/home引用现有独立投影。S2升级设施计数仍受+14 gate，与S1分别绑定；source-accepted base目标显式defer/reject。P0-55另有41..43有界投影，另base销毁、mission37完成、004BF6F0与完整回调/force/capture仍open。

P0-55新增[能力培养任务取消](90-special-mission-cancellation.md)：41..43共享005D9C60按actor、args[1]建筑0..16383、args[0]培养记录0..97短路，独立投影不虚构actor实际所在地valid gate；troop/-1与home=-1相等路径已测试。六个S1/S2 +18 slot确认005DA320条件通知读home，展示/完整return仍显式record/reject。专用cancel家族已有分别的有界投影；base销毁、mission37完成、004BF6F0和事件/force/capture组合、clean stock/跨版本仍open。

P0-56新增[mission37生命周期](91-return-mission-lifecycle.md)：completion与单active-list成员的一步推进有独立有界API。positive refund先于mission/args reset，handler1/dispatcher0，arrival直接acted0/duration0无S2 query267；六邻城首slot同分和S1/S2距离分别绑定。active live valid/mission/acted gate与stop观察已恢复；全链表、外部reset/全scheduler、generic/invalid-home不安全域、004BF6F0完整角色/force/事件与base销毁仍open，不能再笼统称mission37 helper/一步移动未实现。

P0-57新增[武将返回字段与调用顺序](92-officer-return-finalizer.md)：004BF6F0的home→location→rawlegion→bit9、真实troop gate、numeric same-force、旧新roster阶段和role调用顺序现有独立有界投影。ruler ownership/capture明确整次defer，完整list/UI/角色仍record/reject且要求非干预，不等于004BF6F0完整执行。下一主题优先稳定非空004BE2A0角色协调；其余force灭亡/空军团合并/太守/事件/capture组合及clean stock/跨版本仍open。

P0-58新增[稳定非空军团/太守协调](93-legion-role-reconciliation.md)：004BE2A0稳定分支与004BCA30(refresh=0)已有独立有界标量执行，完整域候选/不同排序/身份暂态/有序据点与event8/14字段边界已审计。原先“稳定非空角色尚未实现”收窄为完整事件/返回组合、军师监听、force灭亡/空军团、refresh!=0和不安全排序域；S1/S2容量观察按stage隔离，clean stock/Vanilla仍open。

状态：

```text
siege-call-chain-resolved
capture-resource-formula-resolved
capture-selector-source-profile-recovered
stock-pc-pk11-equivalence-open
capture-scalar-finalizer-source-profile-recovered
capture-personnel-force-event-finalizers-and-global-rng-open
durability-inner-functions-still-open
```

### 4. 火焰持续与自然蔓延

P0-4 审计已完成，行为边界已明显收紧：

- 火计约400±100，和兵数/兵科/适性/攻防无关；
- 火计会心即时火伤约×1.2；
- 火计会心对同一次点火的**持续时间 = 基础结果 +1 回合**；
- 原作 fidelity 下不启用“着火格每旬自动向普通邻格蔓延”；
- 火种/火球/落雷范围和火罠连锁属于主动攻击/陷阱系统，不算自然蔓延；
- `00599CF0` 的普通每旬计数器处理没有发现地面火寿命逻辑，不能误挂到该函数；
- 现代复刻的 `[1,2] @ 70/30`、会心 `[2,3] @ 70/30` 只保留为可替换工程 fallback，不标原版常量。

仍未知：

- PC-PK1.1 点火寿命 setter 原函数；
- 原版基础寿命完整概率分布；
- 内部 counter 与玩家可见“第几回合熄灭”的精确 phase 映射；
- 已着火格再次点火的 setter 语义；
- 不同点火来源是否共享 lifetime RNG；
- Vanilla / PS2 / Wii 等价性。

详见 [P0-4专项](39-fire-lifetime-spread-exactness.md)。

### 5. 登场 / 自然死亡精确 RNG（P0-5 审计完成）

P0-5 专项见 [40-debut-death-exactness.md](40-debut-death-exactness.md)。

已确认 / 收紧：

- PC-PK1.1 `00590C30 MonthlyAction` 只在月初进入人员生命周期链，其中 `00590C82 -> 005833D0` 是明确的**年龄 / 死亡相关处理入口**；因此自然寿命主处理不是任意旬独立 dispatcher。
- `YearOfDebut / Identity / ScheduledLord` 为独立字段；史实模式仍使用人物原 `YearOfDebut` 与剧本位置/身份。
- `ComeOnStage` 的用户语义可分史实 / 假想；假想模式会随机化未发现/在野人物位置，并把登场年统一提前到成人年。成人年龄按现有资料采用 **15岁**（empirical-high），但 raw enum 仍open。
- `IgnoreAge` 是独立场景字段；英雄集结类“无视年龄”场景至少绕过普通时间登场 gate 与普通自然寿命，不与 `Lifetime` 合并。
- `Lifetime` 用户模式分 Historical / Longevity / Fictional；Longgevity 约 +20 年、Fictional 约 99 岁目前只作为 documented/empirical compatibility profile，不冒充 `0048A000` 原函数常量。
- 自然死 / 不自然死是不同 lifespan profile；不自然死不会在史实没年直接退场，且额外寿命与基础没年年龄负相关。
- 孙策实测排除“最终实际死亡最多只比基础没年晚15年”的 hard cap。
- `YearOfDeath / GetDeathYear / markedForDeath / HealthLevel / Identity=DEAD` 必须分层。
- 从较早存档重跑可能改变未来死亡结果，禁止 scenario init 时永久预抽最终死亡日期。

仍 open：

- `005833D0` 完整函数体；
- `0048A000 GetDeathYear` 完整函数体；
- `ComeOnStage / Lifetime / IgnoreAge` raw numeric enum；
- 史实普通登场时 `ScheduledLord` 精确分支与 setter；
- Longgevity +20 与死因修正的先后顺序；
- Fictional 99岁是进入死亡流程的 threshold 还是实际 hard date；
- `markedForDeath` 的触发概率 / 时点；
- flag 后健康恶化到真正死亡的精确时序；
- Vanilla / PS2 / Wii 差异。

### 6. 忠诚下降主函数

已绑定公开 `0058E510` 完整逐指令文本；PC-PK1.1为来源归属，caller证据不等于clean-stock认证。见[自然忠诚候选静态纠错](natural-loyalty-candidate-boundary.md)：

- `00489F80` 已有[独立教程投影](affinity-distance.md)：37条助记符恢复已解析双uint8的signed32/EAX/AL返回，完整byte域允许负signed32；无opcode bytes，不证明教程到本caller/S1同源或native解析，caller仍只使用观测到的unsigned AL；
- 己方普通武将自然掉忠只在换季；前置豁免已过后，候选为相性差>25（unsigned AL），或低/较低义理+高/较高野望，或 `004889E0` 非零（原注释“厌恶君主”，完整callee仍open）；
- 真实忠诚为 byte 0..255，UI只显示到100；
- `仁政` 阻止同都市己方武将自然掉忠，但俘虏明确跳过仁政；
- PK人心掌握caller为 `00472150(3)` 后 `AX>=1` 跳过；2/3是既有均匀0..2约定下的概率，RNG体/序列仍open；
- 俘虏跳过季初限制和这组三条普通候选，因此在月初调用中每月可判定；亲爱/配偶/义兄弟/父母子女仍可豁免；
- 进入数值路径后有两次 `00472150(3)` 调用与符节台额外`+2`；不凭调用数认证均匀独立分布；
- 若当前君主义理最低且野望最高，再加 `floor((4-targetIdeals)/2)`；
- 以上同一数值分支同时服务符合gate的普通武将与俘虏。

仍未知：

- `00489F80` 原opcode、教程到caller/S1同源和native解析；`004889E0` 完整callee；`004A6CF0` 最终writer；RNG及忠诚降量端到端、clean-stock/runtime认证；
- 欠薪、流言、事件等**非自然路径**各自的精确忠诚函数；
- Vanilla/其他平台是否有常量差异。

历史已恢复的caller算术仍保留，但不据此关闭完整忠诚系统；两套MOD修改不混入该caller。此次仅纠正严格阈值、补齐第三候选并明确证据边界。

### 6.0.1 俘虏捕获 / 逃亡 / 资金不足释放（P0-7 更新）

已确认：

- `004B1280`当前以P0-49 source-bound审计为准：末城gate在强运/宝物之前，binary32舍入与nearby=0不可省略；`00582BE0`自然逃亡、`0058E510`月度掉忠保留原有独立证据边界；
- 据点俘虏维护费50金/人；
- 可支付人数 = `min(count, floor(gold/50))`；
- **资金不足必须释放人数** = `max(0, count-floor(gold/50))`，这一项已 exact；
- 资金不足并非直接前N名：原程序把 `0058C320` 作为 comparator 传入 `004AA200`，随后用 `004A8E10` 裁剪到恰好 releaseCount；
- 每据点选出的 forced-release 列表先交 `0058D1D0`，全部据点完成后统一 `0058D430` finalizer；
- 官方“追放”命令可主动释放敌俘，无金/AP/执行武将，最多6人；释放敌俘会**增加技巧P**；
- 技巧P具体点数仍未官方/逆向闭合；社区“约3”只作为 empirical compatibility candidate；
- `ForbiddenLord / ForbiddenMonths` 是真实字段，月初 `0058BB30` 处理禁仕计数；
- “主动释放一定3个月禁仕”存在直接冲突资料：2009记录支持3个月，2011记录明确称自主释放不立flag。因此必须按 release cause / version 拆分，不能静默写死。

仍未知：

- S1 `004A0590` 已由P0-49恢复为持有指定type宝物检查；clean stock等价继续open；
- S1参数7的3/4已定位为目标cell低5bit地形值，具体地形命名/跨版本等价另核；
- 血路的路径/版本边界；
- S1 `004721D0` 的p>100必成功且消费一次已恢复；stock/S2随机等价仍open；
- `0058C320` comparator 字段与方向；
- `004A8E10` 裁剪方向；
- `0058D1D0 / 0058D430` 完整函数体；
- forced maintenance release 的 Forbidden/技巧P side effect；
- 主动释放技巧P exact；
- 主动释放3个月禁仕冲突的版本/路径消歧；
- 即时捕获界面释放与势力灭亡路径。

详见 [P0-7专项](42-captive-release-exactness.md)。

### 6.2 官职自动分配资格 / selector / tie-break（P0-8）

专项见 [43-auto-office-selector-exactness.md](43-auto-office-selector-exactness.md)。

已确认 / 收紧：

- `005FAF00` 参数角色已经恢复：arg1=candidate list、arg2=office、arg3=scoring mode flag；
- 旧“`005FA650` 生成/排序候选列表”说法错误，已撤回；它实际接收 office 并返回 office type；
- 对80个有名官职，type0=丞相/司空/太尉/司徒，type1=武官，type2=普通文官；
- `005FA4D0(person,office)` 先做资格 gate，随后 true loyalty <90 共用硬拒绝；
- arg3!=0 的 weighted-threshold mode：
  - top civil：统+智>=150，score=统+智+忠诚项；
  - military：max(统,武)>=60，score=统+武+忠诚项；
  - civil：max(智,政)>=70，score=max(智,政)+忠诚项；
  - 忠诚项=`9*min(trueLoyalty-90,10)`；
- arg3==0 的 role-affinity mode：
  - military 仅在 max(统,武)>=max(智,政) 时参与；
  - civil/top-civil 仅在 max(智,政)>max(统,武) 时参与；
  - 相等时武官侧获分类优势；
  - 不加忠诚 score bonus；
- final score 相等时不替换：**caller list first-in wins**；
- merit 负责前置资格，不进入 `005FAF00` final score。

仍 open：

- `005FA4D0` 完整资格 body；
- `005FA650` 完整 opcode与第81项；
- `005FAF00` caller / xref；
- caller candidate list 构造与顺序；
- arg3 的业务语义；
- 多官职连续自动分配时的 office 顺序、candidate removal；
- Vanilla / 主机版。

因此当前 selector 的**单个官职选人核心已经可以 exact 实现**；尚不能伪造跨多个官职的完整自动任官 scheduler。

### 6.1 褒赏 / 欠薪 / 流言等非自然忠诚变动（P0-6）

P0-6 专项见 [41-nonnatural-loyalty-exactness.md](41-nonnatural-loyalty-exactness.md)。

已确认 / 收紧：

- 金钱褒赏：100金/人、5AP/人、多人、每人每回合一次、显示忠诚100不可、部队从军武将不可；`00489140 HasPraised` 为结构证据；
- `005B5D60` 已定位为褒赏扣 AP / 金钱的执行链；
- 褒赏忠诚增量是随机结果，君主魅力影响上升量；实测有 +5 / +8 / +9，现代复刻“保底11”与原作样本冲突，不进入 fidelity；
- 隐藏忠诚可超过100，褒赏可出现99→108；
- 宝物授予10AP，价值越高忠诚越高；`gain=item.value` 当前只标 empirical-high candidate；
- 月俸每月支付，俘虏维护先于现役俸禄；
- PC-PK1.1 俸禄外层事务已经源码级闭合为**每据点整笔支付 / 整笔不支付**：
  - `salarySum <= postCaptiveGold` → 一次性全额扣除；
  - `salarySum > postCaptiveGold` → 跳过唯一的 salary 扣款，保留 post-captive 金钱，进入 `0058D5E0 -> 0058C190` 欠薪忠诚路径；
  - 因此外层不存在“剩余钱按比例部分发工资”。
- 流言成功率与效果量是不同函数层；公开逆向只标出 effect-side `005D05B0 / 005D05F0`，函数体仍未展开；
- “成功流言 → 全城所有武将统一扣固定忠诚”已被百人都市、300+成功流言实测反例否定；必须保留 target selector + per-target loss RNG；
- 现代复刻当前的“全体存活武将 8..15 + 义理修正”明确属于工程重建，不作为原作 fidelity。

仍 open：

- `005B5D60` 内部褒赏忠诚公式；
- 褒赏 RNG / 君主魅力 / 目标义理闭式；
- 宝物 value→loyalty 原 opcode 与没收 -30 的版本边界；
- `0058D5E0 / 0058C190` 完整函数体、欠薪最终受罚集合和每人下降值；
- `005D05B0 / 005D05F0` 流言 effect helper；
- 流言 target selector、单人忠诚损失分布与治安下降分布；
- Vanilla / PK / 主机版差异。

### 6.3 部队编成最终资源事务（P0-9）

专项见 [44-troop-resource-transaction-exactness.md](44-troop-resource-transaction-exactness.md)。

已确认 / 收紧：

- battle troop-count draft = sub_647250；
- battle money/food draft 位于 sub_647AC0；
- transport cargo draft 位于 sub_615790 / sub_615A10；
- 战斗部队金10000、粮50000，runtime helper 也会封顶，不只是 UI 值；
- 输送兵60000、金100000、粮500000；
- 输送 ordinary equipment quantity cap 可由地址表 + SIRE reverse-history 收紧为 **100000**；
- troop strength 另有65535硬边界；
- 据点侧 004AE2A0/300/3C0/430 与 troop侧 004AE4A0/510/570 等资源 primitive 已定位；
- ID1～4 枪戟弩马为数量型，出征资源量与士兵数等量；
- ID5～8与10～11为件数型，一支对应部队一件/一艘是 documented/empirical-high；
- 回城资源并入据点，存活件数型装备可重新入库；
- 入库超过据点容量会产生超额损失，为长期原作实测；
- 现代 sango_infinity 的 commit/return 调用顺序只作 reconstruction 对照，不标原作。

仍 open：

- battle / transport actual commit finalizer 地址和 body；
- 据点扣兵/金/粮/兵装与 runtime troop 创建的精确顺序；
- commit rollback；
- 件数型扣1 caller；
- transport 全12类兵装是否完全共享100000路径；
- enter-building/disband finalizer；
- 数量型兵装返还量、伤兵与兵装顺序；
- 多资源同时超容量的裁剪顺序；
- 出征武将完整过滤；
- Vanilla / 主机版。

因此 E1 的“资源事务语义”已经可以高置信复现，但 exact opcode finalizer 继续显式 open。

### 6.4 部队主副将关系合成 / FPU取整（P0-10）

专项见 [45-deputy-rounding-exactness.md](45-deputy-rounding-exactness.md)。

已确认 / 收紧：

- `00495AB0` 只用于统率/武力；智/政/魅在无嫌恶时直接取三人最高；
- 普通关系 `00495B65 = sar eax,2`，即正差值/4向下截断，为PC opcode exact；
- 亲爱 `00495B79 = sar eax,1`，即正差值/2向下截断，为PC opcode exact；
- 夫妻/义兄弟 full-share 除PS2精确实测外，又获PC SIRE原版规则说明交叉，升级为PC-high；
- 血缘/3仍保持cross-platform-high，PC opcode继续open；
- 两名副将分别与主将算candidate后取最大，不叠加bonus；
- 任一主/副、副/副嫌恶pair仍触发五维主将-only hard override，但适性继续三人取高；
- `00707A74` 已通过原IDB内部label与Microsoft CRT源码识别为 `_ftol2`；
- `_ftol2` 语义是 toward-zero truncation，因此正常正攻防/建设/耗粮 raw 的最终转换就是 exact floor；
- 旧“00707A74 rounding mode open”撤回。

仍 open：

- `00495AB0` 完整PC body；
- 血缘/3 PC opcode；
- 夫妻/义兄弟full-share PC精确branch/opcode；
- relation check方向性；
- x87中间 extended precision / 原常量 bit pattern 极端边界；
- Vanilla / PS2 / Wii等价性。

### 6.6 训练生命周期剩余边界（P0-11 / P0-47）

旧轮次见[46号](46-training-morale-exactness.md)与[69号](69-training-reset-scheduler-boundary.md)；当前source结果以[82号](82-training-lifecycle-source-profile.md)为准。

S1固定fingerprint已恢复：

- `005C4100`完整base gate、`005B8320`三槽参数helper、`005B80F0`身份/部队/acted/missionDuration过滤
- 零兵力、已训练、满气力拒绝；AP/至少一位合格者的上层校验
- `0059C423→00598630`全局reset，经`00487860`非连续tails清城市+A4、港关+68，再遍历1100人清acted/praised
- `0059C330→0059C2A0`尾跳`0059A230`野外气力caller；后续任务处理可能重新置acted
- 累计XP0..3000、floor(XP/100)派生能力、普通1..100cap，PK研究共享XP额度
- 360天游戏年/30天月/每旬10天的整数日期getter

新字节只属于MOD关联S1来源；另一个S2 MOD样本确有不同XP/能力上限，所以不能直接写stock confirmed。带配置/测试/trace的训练生命周期兼容实现已接入，implementation gap与以下原作证据债分开：

- clean stock PC-PK1.1独立hash与上述字节/完整调用链等价
- 完整scheduler、AP恢复位置、经济/AI/事件/任务交错与全局RNG
- 所有任务/位置predicate与完整人员属性修正、特殊人员ID语义
- `0059A230`全body与多个军乐台selector全部细节
- stock EXE/存档回归，Vanilla/PS2/Wii独立验证

### 6.7 阵系耗粮重叠 / 粮尽逃兵（P0-12）

专项见 [47-food-overlap-starvation-exactness.md](47-food-overlap-starvation-exactness.md)。

已确认 / 收紧：

- `0049D180` 返回一个防御系列设施 type，`0049D2E0` 只消费一个 multiplier，因此重叠阵/砦/城塞**不叠乘**；
- 原 multiplier bit pattern：
  - 无 `0x40000000`；
  - 阵 `0x3FD55555`；
  - 砦 `0x3FAAAAAB`；
  - 城塞 `0x3F800000`；
- 公共 `0.05f = 0x3D4CCCCD`；
- 配合 P0-10 `_ftol2`，18000兵结果精确为1800/1499/1200/900；
- `0059BF40` 对进入旬时0粮的对象直接跳过；本旬扣到0也只记录粮尽消息，不扣兵；
- 因此粮尽掉兵存在独立 handler；
- `00599AA0` 固定 listing 是设施围城兵力减员 caller，没有显式粮0门槛，不是野外 troop starvation；旧 SIRE 标签 `ReducePopForStarvedBesiegedSP` 的“断粮人口”解读是误译 / 无依据外推，`004B99B0` 内部与版本身份仍 open，不能推广为所有版本均无断粮条件（[70 §5](70-food-overlap-starvation-function-boundary.md#5-00599aa0-不是野外-troop-starvation-handler)）；
- 旧 `A*0.76^N` 缺乏可信出处，从 empirical-high 降为 legacy-compatibility-only。

仍 open：

- `0049D180` 不同等级覆盖重叠时的 winner priority；
- 野外粮尽掉兵 handler 地址与闭式/RNG；
- 战斗/输送 starvation 是否同规则；
- 首旬与持续粮尽是否不同；
- Vanilla/主机版。

### 6.8 补给 / 输送剩余边界（P0-13）

专项见 [48-supply-transport-finalizer-exactness.md](48-supply-transport-finalizer-exactness.md)。

已确认 / 收紧：

- `004BF522` 输送到达+200功绩位于 `sub_4BF1F0`（下一函数 `004BF6F0`），到达处理所在函数范围已定位；
- 输送到据点功绩+200为PC地址级确认；
- 目标据点满仓时超出兵/金等会提示并消失，overflow discard 为PC empirical-high；
- PC手动补给使用相邻命令+slider，直接以目标部队为移动目标时走自动最大补给；
- 自动/手动补给均受目标兵/金/粮容量限制；
- 枪/戟/弩/马补兵需要等量匹配兵装；
- 输送队不能作为普通补给目标（empirical-high）；
- 补兵后气力按新旧兵数加权；
- `004B9840` 是原程序 building 气力混合 helper，支持“兵数加权”模型。

仍 open：

- `sub_4BF1F0` stock等价、复杂人员/二次ownership路径；S1完整body与普通入城scalar写入顺序已由P0-48恢复；
- 手动/自动野外补给 finalizer及是否共享核心；
- troop→troop morale merge helper；
- stock/field troop-to-troop非整除气力rounding；S1 building-entry的`004B9840`已由P0-48恢复；
- target=transport hard gate PC地址；
- 野外补给+100功绩/+2统率经验PC地址；
- 自动补给多资源优先级；
- transport death/loot finalizer和掠夺比例；
- Vanilla/主机版。

### 6.9 技巧系统剩余边界

E7 已确认：

- 36个技巧ID和9系×4级结构；
- Lv1～4技巧P/金成本；
- 3人、50AP、同系顺序研究；
- 技巧P上限10000；
- 研究能力经验=消费TP/100；
- 锻炼伤害1.10、精锐伤害1.15且覆盖锻炼；
- 精锐面板攻防+10与移动加成；
- 矢盾/大盾30%且原版默认不挡战法；
- 强弩、良马、骑射、熟练兵、军制改革、云梯、车轴、城壁强化、防御强化、神火计、木牛流马、政令整备、人心掌握等核心常量。

仍未知：

- E11：技巧研究完整PC时间函数、超级五档完整矩阵、初级/上级难度、属性getter层；
- 兵粮袭击 `005ADB20` 原RNG粒度/分布与资源裁剪边界（触发路径和数量主模型已由E9闭合）；
- 应射 `00584DC8` 完整caller、内部attack-type/unit-type值、水上active profile与PC连战链序（主行为已由E10收窄）；
- 技巧研究完成功绩的PC逐地址；
- 爆药炼成原PC BUG及补丁差异（转E8）。

旧“精锐=锻炼1.10再乘1.15”仍撤回。人心掌握的caller比较已核，但2/3依赖均匀0..2随机约定，RNG/stock边界按[忠诚静态证据](natural-loyalty-candidate-boundary.md)保留。

### 6.10 技巧补丁版本差异剩余边界

E8 已确认：

- Vanilla与PK是独立官方补丁链；
- Vanilla Ver1.0→后期资料有7条明确技巧差异；
- 官方changelog未给逐技巧transition patch，因此不能统一标“1.2修改”；
- 工兵内政公开listing：B=clamp(floor(9P/2),150,450)，无工兵floor(3B/20)、有工兵floor(3B/10)；取整前比率2不等于最终整数精确×2；城市港关同址指令冲突及stock认证仍open，见[O11-B](domestic-repair-lifecycle.md)；
- PK1.1爆药炼成原BUG看被烧/防守方技巧所有权；
- 社区修复改为看点火/攻击方；
- 矢盾/大盾挡战法属于社区patch，不是官方默认；
- 版本层至少需要 `rulesetVersion + patchVersion + fixProfile`。

仍未知：

- Vanilla 1.0/1.1/1.2 EXE技巧地址diff；
- 戟/弩/骑Lv1在Vanilla 1.0是否也为1.20；
- Vanilla 1.0工兵育成400%的内部双支路；
- 爆药炼成BUG是否在某个官方地区发行版静默修复；
- 主机版逐项技巧常量差异。

### 6.11 兵粮袭击剩余边界

E9 已确认：

- `005ADB20` 是兵粮袭击 helper；
- `005ADB55` 对应 techId=1；
- 只对部队目标；
- 普通攻击和战法共用同一附加效果段；
- 反击明确跳过；
- 数量高置信为 `min(Attack×R, floor(己方兵力/2))`，`R∈[1,2]`；
- Attack 是部队攻击面板，不是本次实际兵损；
- 连击两次抢粮为 empirical-high。

仍未知：

- `005ADB20` 完整逐指令；
- 原RNG是连续、0.1档、0.01档或其他分布；
- 目标粮少于计算量时如何处理；
- 攻击方接近50000粮上限时如何处理；
- 盾类让伤害归0时是否仍转移粮；
- 支援攻击是否调用；
- 枪兵处于水上舰船active profile时是否触发；
- 战法失败路径的最终资源行为；
- Vanilla/主机版是否完全一致。

兼容闭环采用 `k∈[10,20]` 的均匀整数档并做资源守恒裁剪，但必须标 `compatibility-reconstruction / engine-safety-fallback`，不能冒充原作。

### 6.12 应射剩余边界

E10 已确认/高置信：

- 技巧ID9，地址 `00584DC8`；
- 防守主体为弩兵；
- 箭类普通攻击和战法可触发；
- 火矢明确可被应射；
- 必须满足正常射程和地形攻击合法性；
- 支援攻击不触发应射；
- 混乱/伪报不能正常应射；
- PCPK急袭可50%规避应射伤害；
- PS2PK双方应射+连战可形成长链。

仍未知：

- `00584DC8` 周边完整PC caller；
- 精确 attack-type / unit-type 比较常量；
- 各战法 primary/collateral 的逐路径；
- 水上 active profile；
- PC 应射+连战的调用顺序/最大深度；
- Vanilla/Wii/PS2逐项等价性。

兼容实现应复用普通攻击合法性，不要把应射写成“所有远程攻击、无限射程、固定弩箭动画”的独立伤害函数。

### 6.13 技巧研究时间剩余边界（P0-14）

专项见 [49-technique-research-time-exactness.md](49-technique-research-time-exactness.md)。

已确认 / 收紧：

- 原 IDB 将 `005D7ED7 / 005D7EF0 / 005D7EF4` 全部归入 `005D7DD0..005D7EFF`，因此 `sub_5d7dd0` 是技巧研究时间 calculator containing function；
- 人才府在基础时间算完后固定 -2旬（-20日）；
- 最低1旬（10日）；
- 势力 `ResearchTimeLeft +0xA0` 以旬存储，每旬 `00599CF0` -1；
- `struct_technology[36]` 当前没有已恢复的研究时间字段，因此基础时间应视为代码派生，不再假设存在已知静态time字段；
- 超级相关能力和70/140/210/280分档保持 empirical-high；
- 210无人材府30/40/60/90为已知锚点；
- 280+人才府Lv4=60，结合exact -20可反推280无人材府Lv4=80；
- 初级/上级难度没有证据可直接复制超级阈值；
- 研究命令执行路径位于 `sub_5d8c50` 一带，与时间 calculator 分离。

仍 open：

- `005D7DD0` 完整body与参数签名；
- Basic/Actual 属性getter层；
- 阈值比较符；
- 超级完整5档×36技巧矩阵；
- 初级/上级矩阵；
- 技巧类别基础时长分支；
- `struct_technology +0x68` 含义；
- Vanilla/主机版。

禁止用线性插值填未知矩阵。

### 6.14 技巧研究完成功绩剩余边界

E12 已确认存在两套资料：

```text
现行日文Wiki主表：500 / 1000 / 2000 / 3000
早期2006攻略/同站小ネタ：500 / 1000 / 1500 / 2500
```

共同无冲突部分只有：

```text
Lv1 = 500
Lv2 = 1000
```

繁中 PC-PK1.1 逆向资料已经给出技巧研究时间、人才府和“研究经验=消费技巧P/100”等相邻规则，也列出大量其他动作的功绩地址，但公开文本没有给出技巧研究完成的功绩写入地址。

因此：

- `500/1000/2000/3000` 仅保留为 `documented-current-wiki-candidate`；
- `500/1000/1500/2500` 保存为早期资料候选；
- 不能把两者擅自映射成“Vanilla表/PK表”；
- 旧表恰好等于技巧P/2，不能据此发明动态公式。

仍未知：

- PC-PK1.1 exact caller/常量；
- 两表真正的补丁/平台映射；
- 1～3名研究武将是否逐人全额结算；
- Vanilla/PS2/Wii等价性。

详见 `27-technique-research-merit.md`。

## B. P1：局部系统精度

### 7. 混乱 / 伪报基础持续与恢复

E13 已把“自然恢复概率”从 open 项中移除。PC-PK1.1 原函数 `00599B90` 表明异常状态使用独立剩余计数，并在每旬做确定性倒计时。

已确认：

- 部队 `+0x24` 是状态：0正常、1混乱、2伪报；
- `+0x28` 是异常状态剩余计数；
- 每旬先执行状态行为，再减少计数；
- 混乱且尚未行动时直接标记已行动；
- 伪报且尚未行动时先朝所属据点执行退却，再标记已行动；
- 普通位置每旬 `remaining -= 1`；
- PC-PK1.1 在本势力当前合资格阵/砦/城塞有效范围内每旬 `remaining -= 2`；
- 计数最低钳到0，等于0时恢复正常；
- 这一恢复流程不读取智力、性格、兵种、适性或随机数；
- 少兵自动混乱路径已源码确认初始计数为 `GetRandomX(2)+1`，即1或2；
- 普通计略伪报/扰乱会心至少持续2旬，是攻略/Wiki层稳定边界。

因此旧的：

```text
每旬按某个概率自然清醒
```

必须删除。

仍未知：

- `005917D0` 普通伪报成功时的初始 duration 原函数；
- `00591A20` 普通扰乱成功时的初始 duration 原函数；
- `004AEA70 SetTroopStatus` 对已经处于异常状态目标的精确覆盖/刷新语义；
- 原版螺旋突刺混乱持续时间的逐指令链；
- Vanilla/PS2/Wii 的完整逐指令等价性。

开源复刻项目使用的“普通1/2回合=70/30、会心2/3回合=70/30”只能作为 `provisional-engine-rule`，不能冒充原作概率。

详见 `28-status-duration-recovery.md`。


### 8. 单挑连续公式（E14 现代转录参考，原生等价未证）

E14 已整理固定现代 `translated-source-reference`，以下链条不代表原生PC-PK/PK1.1认证：

```text
伤病修正后的武力
→ 非线性 duelScore
→ 双方 score² 占比
→ actionRatio (1..99)
→ 方针 hit/block/attack 系数
→ Hit / Dodge / Block
→ 普通伤害 / 必杀伤害
→ 斗志增长
```

关键反例已经解释：

```text
100 vs 95 -> actionRatio 55 -> 攻击重视命中13
80  vs 75 -> actionRatio 52 -> 攻击重视命中12
```

所以同为武力差5并不等价；旧“只按武力差”模型撤回。

同武力则严格：

```text
actionRatio = 50
攻击/防御/斗志重视完整命中 = 12 / 7 / 10
```

命中阈值、闪避、格挡、格挡伤害、攻击重视3～4连击、气合×5/4、坚守×3/4、剑的斗志×3/2以及通用必杀伤害都已结构化。

直接地址交叉：

```text
005097C3 / 005097EB
6B C0 64 99 F7 F9
=> imul eax,eax,100; cdq; idiv ecx
```

仅与 `actionRatio` 末端百分比算术一致，不能验证完整链。

现代参考中Defense dodge保留完整n；Spirit dodge及Defense/Spirit无敌取max(trunc(n/2),1)，无敌优先于普通结果。小范围回归不关闭原生exactness，原43组不减。

仍需单独审计：

- 原生PC-PK/PK1.1全链等价、stock/patch身份及原始C++来源链；
- 特定人物隐藏补正原硬编码；
- Vanilla EXE 逐指令等价性；
- PS2/Wii 平台差异。

详见 `29-duel-continuous-formulas.md`。

### 9. 舌战普通牌心理伤害（E15 通用核心已闭合）

E15 已恢复 PC-PK 导向通用心理伤害链：

```text
双方智力
→ 每方固定 debateAttack
→ 牌力只决定本回合胜负
→ 胜方按牌模板计算 hpDamage
→ 独立计算 stressDamage / 特殊效果
```

智力攻击值：

```ts
attack =
  100
  + trunc(
      40*(myINT-opponentINT)
      /(131-myINT)
    )
```

普通话题牌：

```ts
hpDamage =
  trunc(
    (attack + RandInt(5))
    * angerCoef
    * levelCoef
    * topicCoef
    / 1000
  )
```

其中：

```text
levelCoef：小10 / 中15 / 大20
普通 angerCoef：10
当前话题 topicCoef：10
非当前话题 topicCoef：6
```

同智力 golden table：

```text
当前话题：
小100～104 / 中150～156 / 大200～208

非当前：
小60～62 / 中90～93 / 大120～124
```

牌力与伤害严格分离：

```text
当前话题小牌 power 11 > 非当前大牌 power 3
但其心理伤害约100 < 非当前大牌约120
```

大喝、诡辩、无视、镇静、激昂也已拆清：

- 大喝固定牌模板，但仍读取出牌者 attack；
- 诡辩用自己的 attack + 对手普通话题牌模板反弹；
- 无视不造成HP伤害，只使对方怒气+30；
- 镇静/激昂属于怒气效果层，不是普通心理伤害。

因此本项原“精确心理伤害函数未知”从 open 移除。

仍 open：

- 特定人物隐藏修正；
- Vanilla 连续常量的二进制等价性；
- PS2/Wii 平台差异；
- 追击/留情等结束结算的逐平台差异。

详见 `30-debate-psychological-damage.md`。

### 10. 非骑战法来源的负伤 / 战死（E16 主问题已闭合）

E16 证明原问题不能用“普攻/战法/火焰/设施各自有一个统一伤亡率”来回答。

PC-PK1.1 已确认是**来源分流**：

```text
弩系火矢/贯射/乱射 -> 005974C0 狙伤
猛者成功位移      -> 50%负伤
业火种/业火球      -> 00597350 战死+独立负伤
骑兵突击/突进      -> 005975E0 专用战死
单挑               -> 单挑专用结算
```

普通攻击、一般战法、设施攻击导致部队壊灭后，不再额外添加一个自拟“2～5%战死 / 15%负伤”roll。

弩系狙伤核心：

```ts
P =
  tacticBase
  + statTier
  + personality
  + critical
  - 1
```

```text
火矢0 / 贯射1 / 乱射2
性格0/1/2/3
会心+1
statTier=-2/-1/0/+1
理论峰值6%
```

业火 conditional casualty：

```ts
death =
  max(0, baseDeath + personality - abilityProtection)

injury =
  max(0, 2 + personality - abilityProtection)
```

其中普通/高战死 base=2/4；无战死仅跳过 death，不跳过 injury。

因此本项原“普攻、其他战法、火焰、设施攻击的精确版本化概率全部未知”从 open 移除。

仍 open 的是更细粒度：

- `005971F0` 多候选 selector；
- `005963E0` 伤病等级；
- `00596480` 的1/7/12阈值原指令；
- 猛者候选/伤病等级；
- Vanilla/PS2/Wii等价性。

详见 `31-non-cavalry-casualty-sources.md`。

### 11. 地形伤害随机值（E17 主问题已闭合）

PC-PK1.1 的栈道/毒泉随机值已由地址参数 + 共用随机函数闭合：

```text
00472150 GetRandomX(X) = 0..X-1

栈道：
100 + GetRandomX(200)
= 100..299 / 每进入一格

毒泉：
200 + GetRandomX(200)
= 200..399 / 每进入一格
```

免伤：

```text
栈道：
踏破 -> 0
难所行军 -> 0

毒泉：
解毒 -> 0
```

旧“毒泉1000兵+气力-5”“栈道300～500”已撤回。

落石原地址参数：

```text
对部队：
base1500 / randomRange500

对建筑：
base800 / randomRange1000

踏破：
×0.1
```

当前直接还原为：

```text
部队1500..1999
建筑800..1799
踏破后部队约150..199
```

但由于同一逆向资料还列出“全陷阱共通基本伤害50”，而完整 trap finalizer 尚未文本化，所以落石保留一个**很小**的 exactness：该共通50是否在专用1500/800之外再次参与及整数顺序。

旧“落石1000～2000 + 30%混乱 + 踏破减半”全部撤回；当前没有可靠依据给落石固定混乱。

因此本项原“毒泉/栈道/落石随机值全部未知”从 open 移除。

仍 open：

- 落石 common-base50 finalizer；
- 落石多目标逐格结算顺序；
- 强制位移跨多格危险地形的逐 caller 顺序；
- Vanilla / PS2 / Wii 常量差异。

详见 `32-terrain-hazard-damage.md`。

### 12. 普通君主继承优先级（E18 主机制已闭合）

E18 已确认不能用一个统一排序函数处理所有君主死亡。

```text
历史事件命中
→ 事件脚本固定后继/分裂

玩家普通死亡
→ 玩家从合法候选中选择

COM普通死亡
→ 自动选择
```

COM 长期实测主顺序：

```text
血缘
>
义兄弟
>
配偶
>
年长者
```

“年长者”分支有多个反直觉案例支持：

- 吕布后王忠；
- 董卓/牛辅系后新近加入的韩遂；
- 刘琦亲族候选消失后黄忠。

这些结果与功绩/魅力/官职/仕官时间综合评分不符，因此旧 weighted fallback 撤回。

候选至少要求：

```text
存活
本势力
非敌方俘虏
```

原程序集中入口 `004B9080` 已定位，但函数体未公开展开，所以 COM 四层顺序仍是 `empirical-high`，不是源码级确认。

本项“普通继承完全无可靠规则”从 open 移除。

仍 open：

- 关系类别内部的精确排序；
- 同龄 tie-break；
- 出阵/任务状态过滤；
- `004B9080` 完整函数体；
- 零合法候选处理；
- 跨平台差异。

详见 `33-ruler-succession-priority.md`。

### 13. 评定完整提案池（E19 静态池已闭合）

原版完整 MSG 段 `msg2966~3288` 属于君主评定，并能枚举出22类具体案。

显示层方针：

```text
内政
出阵
外交・计略
```

MSG 层另把出阵话术分成：

```text
攻击
迎击
```

22类具体案：

```text
内政建设
征兵
生产兵装
巡查
训练
探索
登用
任命军师
撤除设施

侵略
迎击
军事建设

献上/亲善
同盟
破弃同盟
停战
劝降
交换俘虏
求援
二虎竞食
驱虎吞狼
流言
```

人物台词和 MSG 同时确认：

- 可以赞同已有方案；
- 可以采纳一个、部分、全部；
- 可以全部否决；
- 可以中止。

官方手册确认评定本身0金、0行动力、最多6人，且君主须在据点。

因此“完整提案类型池未知”从 open 移除。

仍 open 的不是 proposal type，而是：

- proposal chooser 原函数；
- 22类各自的评定专用 availability gate；
- 隐藏属性/五维是否及如何进入 chooser；
- 参与武将过滤；
- 多案执行顺序；
- 采纳案的资源/AP调用链；
- 跨平台差异。

详见 `34-council-proposal-pool.md`。

### 14. 委任 AI 权重（E20：统一权重表假设已撤回）

E20 已确认至少 PC-PK 战争/野外委任 AI 并不是一个：

```text
所有动作
→ 同一张utility表
→ 取最高分
```

的结构。

已恢复的模块：

```text
005EC370 AI军团部队循环
005DEF90 任务方针检查/改写
005DDCF0 包装
005AD980 共用野外行动器

005EF440 出兵策略
005F6470 AI兵粮规划
005F6CF0 主将局部评分
AI势力强度设定函数
```

出兵策略明确包含：

- hard gate；
- difficulty；
- 君主野望；
- StrategicTendency；
- 城市/目标状态；
- 概率层（最终5..100）；
- 最低5000兵；
- 80/90治安 gate；
- `travelTime*5+15` 粮 horizon；
- 50000携粮上限；
- 粮不足 abort；
- 普通携金独立概率；
- 兵器专用概率。

主将选择则是另一个局部 score 函数，包含适性、统武、兵装攻防、兵种相克和契合特技。

AI势力强度还存在君主ID硬编码 bonus，因此不能用一张现代通用 utility 表声称完全等价原版。

所以“委任 AI 的统一权重数字是什么”这个 open 问题从根上撤回。

真正仍 open 的是：

- 城市内政完整 scheduler；
- 出兵 raw probability 少量未命名局部变量；
- 80/90治安阈值 context；
- 运输 target/amount；
- 重视/普通/轻视/禁止精确阈值；
- 跨平台差异。

详见 `35-delegated-ai-architecture.md`。


## C. 规则明确但仍缺静态数据

1. 全地图六角坐标、地形、高度、城市归属。
2. 港关/堤防完整坐标及水攻覆盖格。
3. 各标准剧本完整初始状态。
4. 全历史事件结构化数据。**所选公开攻略录入完成，原版目录/版本和执行核对仍open**：游民原文12页44条、Wiki88史实部分61条已成为独立[来源数据](historical-event-source-data.md)，保留重复、空缺、分支和41项新复核差异。这仅证明所选来源覆盖，不证明一次性flag、精确运行边界、全游戏目录或跨版本等价。
5. 遗迹/庙候选点完整坐标（发现规则已解决）。
6. PK 能力研究基础图转录已完成：`../sources/pk-ability-research/catalog.json` 收录48基础节点、52基础箭头/4起点箭头、10隐藏位置和50精确候选，独立逐图核对。此静态录入不再 open；攻略间差异、开局选择RNG、完整命令/scheduler/native cancellation/completion及clean-stock版本等价仍 open，见 `15-pk-ability-research.md` §8–9。

## D. 已不再属于 open 的项目

- 换季治安下降完整分布与 PK 政令整备 50% 免降判定（PC-PK1.1 原函数 `0058D6D0` 反汇编）

以下已从 provisional 升级：

- 委任/COM AI 的 procedural 架构、出兵 gate/概率与局部评分器（E20）
- 君主评定22类具体提案池与两阶段采决结构（E19）
- 普通君主继承：玩家手选、COM关系类别优先与年长者分支（E18）
- 地形伤害随机值：栈道/毒泉精确区间与落石专用参数（E17）
- 非骑兵武将伤亡来源分流、弩系狙伤与业火conditional casualty（E16）
- E14仅现代转录参考已整理：actionRatio、结果/伤害和斗志算术；本条不计为原生闭合，原生PC-PK/PK1.1仍open，原43组不减
- 征兵数量与征兵治安下降公式（PC-PK1.1 confirmed-by-disassembly；Vanilla empirical-high）
- 行动力完整恢复公式（empirical-high；原版逆向 + PK 存档复算）
- 地形移动成本和战法地形限制
- 商人买卖核心公式
- PK内政设施/吸收合并
- 兵装生产量与兵器/舰船开发时间
- 登用强制优先级
- 忠诚自然下降的触发条件
- 贼/异民族根城机制
- 自然灾害的机制边界
- 最终战斗伤害 PC-PK 逆向公式
- 战法会心率与部分战死/俘虏逆向概率
- 火伤计算主要规则
- 城陷落后设施保留数量
- 汉室态度/拥立废立忠诚变化
- 遗迹/庙发现与奖励
- 单挑方针/必杀的现代转录参考数值（E14；原生等价仍open）
- 舌战手牌与再考
- PK人才府技巧研究固定-20日


### P0-59 event8/14监听缺口收窄

见[94-mission-event-listeners.md](94-mission-event-listeners.md)。004A8110/005B9D30的注册、copied-active顺序、live executing/mission、predicate与23/24 handler入口gate现已恢复并有独立有界模型。event8可取消mission23，event14可取消mission24；004BA1D0自身no-op不证明全事件无效果。成功tail采用source/stage/完整观察域before→after替换或原子reject，不要求callbacks非干预。原生完整presentation/return/递归事件、004EC870后置observer、新版本role/return组合和其他event ID仍open；clean stock/Vanilla/全局RNG/真实存档不因此关闭。


### P0-60通知/active-list/acted尾缺口收窄

见[95-mission-notification-tail.md](95-mission-notification-tail.md)。canonical005B81D0、两个handler入口/saved pointers及005B8400(actor,0)已知写序有独立模型；acted后manager dirty与可变observer先于live list append/duration，S2 query267仅wrapper路径。presentation、fullreturn、nonnull observer、patched query267保留精确stage可变观察或reject，不声称完整native闭包。下一步版本化return/role/event与004BBAA0后置observer组合；full force/empty legion/base destruction/stock/Vanilla仍open。


### P0-61单事务event8/14与已知handler/tail组合

[96-mission-event-composition.md](96-mission-event-composition.md)使用严格共享canonical frame、直接primitive adapters与单次原子提交，顺序执行004BBAA0→004A8110/predicate/handler/notification/return-tail→004BA1D0(8/14无操作)→fresh004EC870/非空observer。callStack绑定source/event/复制列表/visit/captured mission及saved current/target/raw44/home/distance；所有未知效果仍明确可变观察或整次reject，不默认非干预。旧API/trace不变；完整004BF6F0/list/role递归、empty-corps/force灭亡、base销毁、其他event IDs、stock/Vanilla与全局RNG继续open。


### P0-62原生return/list/role/event递归组合

[97-recursive-officer-return.md](97-recursive-officer-return.md)以扩展canonical frame执行return/list/stable-role及递归event8/14，只有一次revision提交。每层自己的event/actor/copied nodes/visits和native saved IDs保留，回调后按源重新读取live字段。移首节点/追加和count<2 sort闭合；非平凡sort、route、target-force及外部observer仍为精确stage-bound可变观察，不默认不干预。empty-force/corps和ruler ownership明确defer，递归/调用预算只是工程guard，不证明原作终止。完整sort内部、force/base/capture、其他event IDs、stock/Vanilla/全局RNG继续open。


### P0-63原生roster/role排序与source-separated capacity

[98-native-roster-sort.md](98-native-roster-sort.md)新增独立版本：固定roster参数(1,0,0,0)的virtual field0实际返回canonical person ID；按不同entry/pointer pivot身份执行两种quicksort及governor merge，保留比较调用序、相等项非稳定行为、两轮allocated过滤与clear/reappend。capacity的title/office/technique分支分别按S1/S2执行，query377/278为精确callStack/full-frame/RNG可变观察；saved left低16位、saved force pointer与后续live读取不混淆。canonical title/office的type15/16 validity固定true，person raw/status派生规则不变。旧API/trace不变；一般sort flags/vtable/分配失败、route/target-force、empty-corps/force灭亡、其他event/base/capture、stock/Vanilla与全局RNG继续open。


### P0-64原生任务route与目标势力闭合

[99-return-route-target-force.md](99-return-route-target-force.md)新增独立版本，直接执行005BA320任务分派/arg0与arg1/目标force君主live home/可选territory输出，以及00487EB0设施raw owner、领土city和canonical subtype势力链。两源地图byte分别固定，完整原生getter不再用whole-route/target-force观察；真实外部作用仍绑定full frame/callStack/RNG。新force rulerId和legion forceId与valid严格派生，旧API/trace不变。source未改表/固定vtable/不别名输出与可读map域明确；force灭亡/空军团/ruler/base/capture、其他event、stock/Vanilla/全局RNG仍open。


### P0-65空军团分派、合并与raw reset

[100-empty-legion-redistribution.md](100-empty-legion-redistribution.md)新增独立版本，展开空军团primary/nonprimary分派、source/destination合并方向、完整两次roster复制、live据点扫描与人员迁移调用、raw44-byte reset。primary fallback丢弃ordinal查找值而直接使用global ID2..8的原生控制流保留；nearest距离与S1/S2 RNG分开，S2三次共享页读要求逐调用观察。004AD550/004A8270仍是明确可变深层边界，force灭亡仍atomic defer；旧API、stock/Vanilla/全局RNG边界不变。


### P0-66据点归属、耐久与event9/10

[101-base-ownership-events.md](101-base-ownership-events.md)新增独立版本：在空军团merge中直接展开004AD550归属写、source分离耐久上限与有符号word裁剪、城市A4的bit0/1/4 dword重置，以及event9/10复制列表/predicate；保留saved locals与callback后的live读取。新触发的其余cancel handler、event9部队反应尾仍需精确可变观察或原子reject。旧API不变，004A8270/force/ruler/capture、其他event、stock/Vanilla和全局RNG继续open。


### P0-67武将迁移与固定参数移动准备

[102-officer-relocation.md](102-officer-relocation.md)新增独立版本，在P0-66共享frame中展开004A8270、allocated取消注册分派及固定参数004A7990。保留status2内嵌旧太守清理、ruler live判断、same-home不取消、away两处direct acted、保存distance低byte不复验写回与live governor刷新。004B40C0、其余cancel handler、真实troop成员/非base位置、event9部队反应、force灭亡和stock/Vanilla/全局RNG仍为明确观察或open。 坐标read-only query绑定source/person/live location/全before/stack；mutable fallback坐标06EE794C不能从IDB快照默认。所有未知可变作用仍需完整before→after/RNG或原子reject；工程预算不认证原作终止。


### P0-68 live零退款取消9/10/12/22

[103-live-zero-refund.md](103-live-zero-refund.md)在P0-67共享frame中直接执行mission9/10/12/22的gate与control，复用notification、零退款return、relocation和真实event分派；23/24维持既有原生实现。9/10仅target数值范围门并保留丢弃的force validity读取，12只构造target person pointer，22验证target force并保存actor color。四段presentation仍需完整before→after/RNG观察或原子reject；tail fresh读取actor，成功body固定return1。旧API、模型测试和raw来源字节不变。 仅这四个whole-handler观察被收窄；其他handler、非零退款/资源、presentation内部、tail距离观察、S2 effects/observer、完整004B40C0 ruler/capture、真实troop成员/非base位置、event9部队反应、force灭亡、未建模memory/platform域及全局RNG继续open。S1/S2仍为MOD-associated；相同selected bytes不认证clean-stock PK、Vanilla或console。上文旧版本说明保持其历史边界。


### P0-69 generic设施入口与早返

[104-generic-facility.md](104-generic-facility.md)在共享frame中展开004B40C0入口validity、old-legion pointer保存、generic建筑ID87..16383分类、requested pointer转换与live004AD550。invalid entry返回0，generic完成固定返回1，包含ownership早退或callback使目标失效后。指针构造/转换不虚构target row/validity门；仅新版本relocation移除过严requested-row预读，实际字段读取仍要求可读row，旧API冻结。canonical004B415D..004B4988仍为完整frame/RNG effect-query或原子reject，绑定原始实参、saved old pointer与symbolic entry manager，normal EAX仅integer0/1。 仅有界入口与generic早返闭合；完整canonical ruler transfer/capture、surrender/captive、force灭亡、recursive-return ruler ownership、其余handler/positive refund、presentation内部、tail距离、真实troop成员/非base位置、event9部队反应、S2 effects/observer、未建模memory/platform与全局RNG继续open。任意/非对齐pointer、真实memory probe、stack fault/cookie failure/SEH不属于该normal域。S1/S2仍为MOD-associated；selected bytes相同不认证clean-stock PK、Vanilla或console。上文旧版本保留历史边界。


### P0-70原生零退款tail距离

[105-native-tail-distance.md](105-native-tail-distance.md)在同一live frame中将005B8400尾部0049E4D0距离观察替换为原生领土和source-local距离表求值。先比较normalized current与raw home，再转换getter；current领土保存后仍读取home，子scope退出后将distance保存到parent tail，后续callback不重算。duration wrapper fresh复验actor validity并写保存值低byte，-1→255。两源领土/距离表保持分离；真实矩阵均对称，非对称probe仅为synthetic索引测试。旧API/frame/trace冻结，17入口均保留。 仅新版本取消这一个distance观察；仍要求显式mapCells与可读slot，eager双getter slot要求是保守模型域，不是原生pointer构造读。其余opaque effect继续ordered full-frame/stack/RNG观察或原子reject。canonical ruler/capture、surrender/captive、force灭亡、recursive-return ruler ownership、positive refund/资源、其余handler、presentation内部、真实troop成员/非base位置、event9部队反应、S2 effects/observer、未建模memory/platform、全局RNG与runtime/stock/Vanilla认证继续open。46 focused区间均继承复用，零新增unique原始区间与机器码字节；MOD-associated S1/S2不能代表clean-stock PK、Vanilla或console。旧版本仍保留历史distance观察契约。


### P0-71原生部队成员判断

[106-native-troop-membership.md](106-native-troop-membership.md)在新显式troop-slot frame内直接执行004891C0：live location87..1086转换slot，canonical troop validity从leader raw17C/status派生，再依次检查两deputy signed<1100，最后匹配leader/两deputy。负deputy哨兵全允许且不读取deputy person；匹配leader不能绕过无效deputy，helper不添加actor-validity门。未知vtable仍精确full-frame/source/stack只读观察，缺少reached slot原子reject。17继承入口加新troop-member共18入口，旧API/frame/trace冻结。 仅canonical membership闭合；non-base position virtual+3C和mutable fallback06EE794C仍需明确观察，不能从IDB偶然快照初始化。共同26-slot dispatch block不代表完整通用ABI；0079CC80在S1为float50、S2为00911B50代码指针，已固定完整target但有效virtual+68 caller及S2尾extent未证，业务不实现。canonical ruler/capture、surrender/captive、force灭亡、recursive-return ruler ownership、positive refund/资源、其余handler、presentation内部、event9部队反应、S2 effects/observer、未建模memory/platform、全局RNG与runtime/clean-stock/Vanilla认证继续open。MOD-associated S1/S2相同selected bytes不能代表clean-stock PK、Vanilla或console；旧版本保留历史membership观察契约。


### P0-72原生live位置与可变fallback

[107-native-live-position.md](107-native-live-position.md)在新显式frame/version中展开00489610：location只读一次，按base再troop原生validity解析base+1E、troop+3C或fallback06EE794C的storage identity；position不要求本人troop membership。0047A950随后单次DWORD读取并解释signed16 X/Y，先bounds再live map/source-local base table。004A6340的valid actor/base-location fast path继续跳过base validity、position与map读取。18继承入口和3新direct入口可用；旧API/frame/trace冻结。 新frame显式提供troop X/Y与mutable fallbackPosition06EE794C；没有默认值/隐式迁移，S1快照00000000、S2快照FFFFFFFF均不证明运行时初始化。未知virtual链需精确mutable full-frame/source/stack/RNG观察，opaque pointer解引用需单独read观察。S1的0073BE10只证bounded store/RET block，S2证complete ID0 function；都不证明init调度、执行或reset时机。fallback reset scheduling、custom vtables与full S2 extent/virtual+68 caller/business、canonical ruler/capture、surrender/captive、force灭亡、recursive-return ruler ownership、positive refund/资源、其余handler与presentation内部、event9部队反应、S2 effects/observer、未建模memory/platform/concurrency、全局RNG与runtime/clean-stock/Vanilla/console认证仍open。MOD-associated S1/S2的相同selected bytes不能代替stock证明。上文旧版本仍保留历史位置观察契约。


### P0-73 event9原生live部队选择

[108-native-event9-selection.md](108-native-event9-selection.md)在新显式frame/version中展开event9选择前缀：004922C0先保存node.next再读取payload，callback后沿saved-next身份继续、到达时live读取节点；允许重复payload、节点删除/重用与可终止cycle。完整00495CE0读取raw order/target并保留真实分派顺序；raw44、subject/target/troop pointer、manager ECX和saved cursor跨完整frame/RNG替换保持。21继承入口加event9-selection共22入口，普通event9同frame一次revision，旧API/frame/trace及39行为测试不改。 新frame显式提供troop raw44/order/target和heap-node head/inventory；没有默认运行时节点快照。未知virtual validity/type/force是精确source/callsite/stack/full-frame/RNG可变effect-query，不能默认false或纯读取。failed readable/writable probe与missing reached storage明确reject；并发、SEH/平台fault与未建模内存不在成功域。node/call/depth预算仅引擎保护而非原作规则。004BA345..004BA46C仍整体观察presentation/reaction；virtual+48只改显示路线，两路均到mutating reaction，不能称event9或capture完整。event16/18、capture/surrender/captive、force灭亡、recursive ruler ownership、positive refund/资源、其他cancel、S2 effects/full vtable extent、fallback reset scheduling、全局RNG、clean-stock/Vanilla/console/runtime/original-save认证仍open。MOD-associated S1/S2的相同selected bytes不证明stock规则；上文旧版本契约继续作为历史边界。


### P0-74 event9原生展示决策

[109-native-event9-presentation.md](109-native-event9-presentation.md)在新显式frame/version中展开004BA345后的展示决策：saved raw44转换为saved force身份，与troop当前owner分开；troop48、当前force08/48和fallback saved-force08/48按原序live读取，未知virtual仍是完整frame/RNG可变effect-query。22继承入口加event9-presentation共23入口，旧API/frame/trace及42组模型checker逐字节不变。 原生event word确有重读；immutable-command-event-v1仅声明当前支持域，不能声称原生event memory不变。该域排除callback破坏event/control/saved control-flow locals，但保留411..432内已知caller-stack temporary写入。presentation 004BA411..004BA432整体观察构造、格式化、virtual、consumer及cleanup，不发明稳定temporary地址或析构/不保留/异步别名证明；reaction 004BA432..004BA46C仍独立观察。S1在0063ADE7调用00482480，S2调用008ECE20，保持source绑定。saved force/troop/target/subject、manager、locals和next cursor跨替换保持。 实际presentation/reaction、mutable event与16/18、capture/surrender/captive、force灭亡、recursive ruler ownership、positive refund/resources、其余cancel、S2 effects/full vtable tail、fallback reset scheduling、未建模memory/platform/concurrency、全局RNG及clean-stock/Vanilla/console/original-save/runtime认证仍open。 MOD-associated S1/S2的相同selected bytes不证明stock规则；旧版本契约继续作为历史边界，不据本主题移除未闭合证据。


### P0-75 event9 saved-force原生reset

[110-native-event9-force-reset.md](110-native-event9-force-reset.md)在新显式frame/version中仅展开004BA432..442：保存先前troop raw44所得EBX force身份，004B5020单次检查current force validity，canonical ruler0..1099或unknown08完整frame/RNG effect-query；false保留callback变化且跳过两写，true依次在同一saved pointer的当前storage写raw94=0xffffffff、raw98=0。不重读troop ownership，不二次validity，不按新vtable虚构virtual setter，missing reached storage明确gap。rawDword94/rawByte98显式无默认，允许所有既有位模式，不猜业务含义。23继承入口加event9-force-reset共24入口，新34组model原字节不变。 432将saved manager加载到EDI，43B复制到ECX，helper不读取incoming manager ECX；完整setter RET4/helper RET12证明442续接参数栈平衡。原始manager与saved force/troop/target/subject、captured raw44、old/new scalar和next cursor保留。presentation411..432整体观察保持；参数cleanup不证明temporary析构、无别名或不保留。442..46C reaction remainder仍完整frame/RNG可变观察，live troop reset/home lookup/004AD220未展开；immutable-event仅支持域，不是原生内存恒定证明。 实际presentation/reaction442..46C、mutable event与16/18、capture/surrender/captive、force灭亡、recursive ruler ownership、positive refund/resources、其余cancel、S2 effects/full vtable tail、fallback reset scheduling、未建模temporary/formatter/external/platform/concurrent memory、全局RNG及clean-stock/Vanilla/console/original-save/runtime认证仍open。 MOD-associated S1/S2的相同selected bytes不证明stock规则；旧版本契约与此前所有未闭合债继续保留。


### P0-76 event9 saved-troop原生raw44 reset

[111-native-event9-troop-reset.md](111-native-event9-troop-reset.md)在新显式frame/version中仅展开004BA442..44C：004AD2B0经0047A630单次验证saved ESI troop的live leader/person/deputy链，unknown08仍为精确完整frame/RNG effect-query；false保留callback变化并跳过写入，true经00495A20/00495A32在同一saved pointer当前storage直接写raw44=-1。callback改leader/vtable/frame/ownership后不二次validity、不重读owner、不虚构virtual setter；missing reached storage明确gap。raw44保留所有signed32位模式，无默认、coercion或业务含义，不暴露通用setter。24继承入口加event9-troop-reset共25入口，新34组model原字节不变。 早期EBX force仍来自pre-presentation保存的raw44，不能从current ownership或reset后的raw44重算；先前force raw94/raw98 stores与troop raw44 store处于同一atomic command。445复制原saved manager EDI到ECX，helper不读incoming ECX；setter RET4/helper RET8证明44C续接参数栈平衡，原manager及saved force/troop/subject/target、event domain、captured raw44、old/new scalars和next cursor保持。presentation411..432整体观察不变；参数cleanup不证明temporary析构、无别名或异步不保留。44C..46C home/reaction仍整体frame/RNG可变观察，live home lookup/building lookup/004AD220未展开；immutable-event只是支持域。 实际presentation/home/reaction44C..46C、mutable event与16/18、capture/surrender/captive、force灭亡、recursive ruler ownership、positive refund/resources、其余cancel、S2 effects/full vtable tail、fallback reset scheduling、未建模temporary/formatter/external/platform/concurrent memory、全局RNG及clean-stock/Vanilla/console/original-save/runtime认证仍open。 MOD-associated S1/S2的相同selected bytes不证明stock规则；PKPC1.1优先、Vanilla隔离，旧版本契约与此前所有未闭合债继续保留。


### P0-77 event9 live home getter

[112-native-event9-home-getter.md](112-native-event9-home-getter.md)在新显式frame/version中仅展开004BA44C..45E：saved troop在00495525直接调用当前virtual08，不添加0047A630 wrapper，旧raw44=-1不是gate。unknown troop08仍精确完整frame/RNG effect-query；false保留callback变化并返回-1，true从同一saved troop当前storage读live leader，保存canonical person pointer、单次验证并从该saved person读signed homeBaseId。完整004A31E0证明既有person DWORD+98字段，所有signed32位模式保持，不与force byte+98混同、不新增重复字段或person08 callback域。25继承入口加event9-home-getter共26入口，新28组model原字节不变。 00490D00仅按signed0..16383构造fixed manager07201958下的building pointer，不读building row或validity；missing/invalid非base row仍可得到pointer，只有后续真实读取才要求storage。到达的troop/person storage缺失仍明确gap。getter RET及resolver RET4证明45E参数栈平衡，原manager、saved force/troop/subject/target、captured raw44、old/new scalars与cursor以及returned home scalar/building pointer持续绑定。opaque suffix明确绑定004AD220/site004BA467、incoming ECX0799895C、arguments[saved troop,4,building]及reverse PUSH顺序，不声称helper使用该ECX。presentation411..432与reaction45E..46C仍整体frame/RNG可变观察或atomic rejection；immutable-event只是支持域，参数cleanup不证明temporary析构、无别名或异步不保留。 实际presentation/reaction45E..46C、mutable event与16/18、capture/surrender/captive、force灭亡、recursive ruler ownership、positive refund/resources、其余cancel、S2 effects/full vtable tail、fallback reset scheduling、未建模temporary/formatter/external/platform/concurrent memory、全局RNG及clean-stock/Vanilla/console/original-save/runtime认证仍open。 MOD-associated S1/S2的相同selected bytes不证明stock规则；PKPC1.1优先、Vanilla隔离，旧版本契约与此前所有未闭合债继续保留。

### 2026-10-12 自然逃亡：已知参数算术的工程覆盖与完整机制分开

[自然逃亡roll参数纯整数API](captive-escape-roll-argument.md)新增工程实现；正常域公式早已在03-personnel记录，不能称发现未知概率。仅`00582CE4..<00582D31`26条/77 bytes，入口BL、AL和晚期月份三个严格U8；完整域参数上限108815，保留早晚月份两次读取边界。完整资格/名单、属性getter与ABI/可达性、同源RNG、释放/迁移和月初调度、stock与跨版本仍open；已有S1 RNG并不自动证明与此listing同源。新增实现不依赖P0-78/capture/force/native，原43组缺口清单按证据主题理解，不按新增叶函数数量计算清空比例。
