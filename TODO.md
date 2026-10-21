## 2026-10-21：现代参考四性格通用体力伤害公式核（静态）

[PR117](https://github.com/DanielMax937/sanguozhi/pull/117)已交付独立出牌可用性。本批补充[通用体力伤害公式核](docs/rules/debate-hp-damage-v1.md)与[完整API合同](docs/engine/debate-hp-damage-v1.md)，仅计算固定现代参考 CalcHpDamage 的一次通用恒等人物hook结果，覆盖四性格／兴奋计时对系数的影响，不扣HP、不加压力、不选择攻击方，也不接入会话。

给定已解析attack=70..227、性格、timer=0..4、当前话题0..2、牌码−1..14与一次bound5 jitter。timer>0的胆小／刚胆话题系数10，冷静／莽撞保持6，即使牌话题匹配或为大喝也不进入正常态分支。timer=0时大喝系数12，否则匹配普通话题系数10、不匹配6。大喝等级系数15，普通牌等级系数10／15／20，其余0；仅兴奋冷静另取怒气系数15，其余10。按源码顺序完成整数乘积后截断除1000，不逐步截断。

每次公式调用都需要且仅需一个显式jitter，等级系数0也不能省略随机记录；坏形、缺失或多余抽样拒绝，不留下部分结果。返回系数选择理由、完整算术和抽样审计；genericOnly=true是调用方限定恒等人物hook的声明，不证明真实人物行为已被解析。上述支持域内最大请求伤害462，不照抄来源注释的宽泛上界作为实现保证。

九个旧会话、入场／连击／可用性组件及既有政策和存档不修改，没有自动接入。本核不验证持牌／出牌合法性，不实现攻方判定的刚胆牌力覆盖、HP／压力writer、胜负／崩坏、双次愤怒阶段、冷静再考／刚胆耗牌、计时或全回合随机／身份预算。人物／书籍、非恒等伤害hook、开场／追击／留情与campaign排除。固定现代C#不是原生PK／Vanilla证明，43证据主题／45历史快照保持；P078及全部依赖排除。仅静态文本、独立审阅、人工纸面算术和字节身份核对，未运行测试、编译、typecheck、build、validator、checker、诊断、候选、来源、场景或replay。下方保留历史边界。

## 2026-10-21：现代参考愤怒出牌可用性核（静态）

[PR116](https://github.com/DanielMax937/sanguozhi/pull/116)已交付胆小待连击执行核。本批另补[牌码可用性判定](docs/rules/debate-card-availability-v1.md)与[完整API合同](docs/engine/debate-card-availability-v1.md)，落实固定现代参考 IsCardAvailable 中独立的性格／计时／再考额度分支，不把纯查询等同于会话已经支持愤怒出牌。

仅冷静或刚胆且timer>0形成该函数的受限兴奋态。普通话题牌1..9始终通过；再考0先阻止兴奋刚胆，再读取己方canRethink，不受对手冷静直接压制。大喝／诡辩／无视先阻止己方兴奋刚胆，再阻止对方兴奋冷静；镇静／激昂先阻止己方兴奋冷静或刚胆，再阻止对方兴奋冷静。胆小／莽撞的正计时器不触发这些限制。越界整型牌码返回不可用，不与坏形输入混淆；原因、短路检查及两方判定条件审计是显式工程输出，不宣称原参考返回过这些记录。

核只查询给定两方已解析性格、0..4计时器、再考布尔额度及一个牌码，不读取持牌、HP、当前话题、先手或出牌阶段。因此available=true不证明拥有该牌或该回合允许行动；不给卡、不消耗额度、不改计时、不抽样。九个旧会话、愤怒入场和连击组件均保持原接口／政策／存档，未接入此判定。

完整双次愤怒阶段、其他性格伤害系数、冷静再考／刚胆耗牌、计时递减及新会话接入仍开放；人物性格解析、书籍、开场／追击／留情与campaign不在范围。固定现代C#不是原生PK／Vanilla证明，43证据主题／45历史快照不减。P078及全部依赖排除。仅静态文本、独立审阅、纸面推导和字节身份核对，未运行测试、编译、typecheck、build、validator、checker、诊断、候选、来源、场景或replay。下方旧段保留历史边界。

## 2026-10-21：现代参考胆小待连击执行核（静态）

[PR115](https://github.com/DanielMax937/sanguozhi/pull/115)已交付单次愤怒入场，其胆小分支仅产生待连击标记。本批补充[独立胆小连打执行核](docs/rules/debate-timid-combo-v1.md)与[完整API合同](docs/engine/debate-timid-combo-v1.md)，仅接纳胆小timer=1、combo.active=true且counter=0的显式待处理检查点，不把它伪装为完整愤怒阶段或会话接入。

核按来源从0至有效容量末槽遍历当前物理手牌；只有当下读取到普通话题牌才消费一次bound5 jitter并攻击。每次伤害按给定attack与胆小兴奋系数计算，先写HP再写按请求伤害除15所得压力，随后删除本槽、清空七物理槽并稳定压紧有效前缀、增加计数。循环下标仍继续递增，因此刚移入当前槽的牌会被跳过，不能改成遍历初始牌清单或消耗所有普通牌。途中HP≤0不终止；整圈完成后清combo.active，零次攻击也清，保留attacker并按实际次数返回counter。

容量4..7使实际命中最多4次；每次仅用其对应显式jitter，缺失／多余／错形抽样整条拒绝。给定resolvedAttack=70..227及genericOnly限定是工程支持域，人物attack解析和非恒等伤害hook均未实现。完整扫描、伤害请求／实际写入、删除压紧与抽样记录返回；没有补牌、牌组再生成、计时递减、胜负判定或第二次愤怒入场。

旧九会话及PR115入场核、已有存档和政策均不修改；调用者可显式转交兼容角色与待办数据，但没有自动编排。完整双次愤怒阶段、愤怒中普通出牌／其他性格系数、冷静再考／刚胆耗牌、全回合随机与身份预算仍开放。固定现代C#参考不是原生PK／Vanilla／主机证明，43证据主题／45历史快照不减。P078及全部依赖、人物／书籍、开场／追击／留情与campaign排除。仅静态文本、独立审阅、纸面推导和字节身份核对，未运行测试、编译、typecheck、build、validator、checker、诊断、候选、来源、场景或replay。下方旧段保留历史profile边界。

## 2026-10-21：现代参考单次愤怒入场核（静态）

[PR114](https://github.com/DanielMax937/sanguozhi/pull/114)已交付按需牌组再生成会话。本批新增[独立愤怒入场规则核](docs/rules/debate-anger-entry-v1.md)与[完整API合同](docs/engine/debate-anger-entry-v1.md)，只覆盖一次 CalcAngering(canReflect) 后的 Anger，不伪装成会话已经支持完整愤怒阶段。

输入明确给定两方性格、已解析武力、HP／压力／计时器、七个物理牌槽及有效容量和连击检查点。按先手再后手选压力满且未兴奋者；保留来源“第一张匹配牌下标严格大于0”的自动激昂／镇静反制，反制时按原序压紧有效牌槽并清除其余物理槽。激昂转移入场，镇静取消入场；压力写入逐次截断。胆小／莽撞计时1，冷静／刚胆计时4；莽撞按200+给定武力扣HP，再加截断除15所得压力；胆小只标记待连击，不执行连打。无入场或非胆小分支不擅自清除已有连击字段。

核无随机、不检查胜负、不补牌、不重复触发到稳定，也不递减计时器。完整愤怒阶段的两次判定、胆小连打、胜负／崩坏／回合结束顺序、愤怒中的出牌与伤害系数、冷静再考和刚胆牌耗尽处理仍开放。旧九个会话、存档和此前各独立核均不修改；PR114仍按原合同拒绝非终局怒线，不能把本组件当作旧会话接入。

固定现代C#转录参考不是原生PK／Vanilla／主机确认；人物性格及武力解析、开场／追击／留情、campaign、P078及其全部依赖排除。43证据主题／45历史快照不减。仅静态编辑、独立审阅、纸面推导与文件字节身份核对，未运行测试、编译、typecheck、build、validator、checker、诊断、候选、示例或replay。以下历史段落按原profile及交付时点保留。

## 2026-10-21：现代参考按需牌组再生成会话（静态）

[PR113](https://github.com/DanielMax937/sanguozhi/pull/113)已交付独立牌组生成核。本批新增[真正接入再生成的独立会话](docs/rules/regenerated-debate-session-v1.md)与[完整API／随机及存档合同](docs/engine/regenerated-debate-session-v1.md)，不把组件存在视为旧会话已接入。输入是明确提供的当前18牌、初始游标0..18和有序话术池；第0代是合成检查点，不认证此前发牌历史、人物资格或DeckInit。

只在空槽确实需要下一张且游标已达18时调用既有DeckGenerate，成功后换入完整新牌组、保留完整话术池重排、递增代号并清0游标，再继续同一次补牌。跨边界前后的空位全填完后才做一次普通话题修补和排序，不能拆成两次旧补牌调用而提前修补。牌身份包含参与者、代号和代内下标，修补只改牌面不重用身份；完整生成收据保留局部索引，外层另记参与者、阶段、代号和全局抽样区间。

新会话复用原共享战斗核；补牌完成段抽为内部共享函数，旧公开补牌API的政策、类型、错误顺序和收据保持。旧八个session及其存档不迁移，PR112仍拒绝第19项；仅新profile接受其显式抽样范围内的按需再生成。初始化按队伍0／1；每轮仍按先手／后手选择与可选再考、攻击与诡辩话题、非终局队伍0／1补牌顺序，终局不额外生成。

每人一轮最多6张再考补牌加1张回合补缺，因此最多一次跨代，全轮至多两次生成；显式draw上界初始化8036、每轮8040。新profile采用8192数组长度、16条历史、32MiB完整封装、200万值节点和深度32预算，完整提案超限可提前拒绝，不承诺所有16轮组合均装得下。预览／执行／保存／重算均保留完整生成与补牌审计，不裁剪2000次交换或话术池第五项。

仍为固定现代转录参考，不认证原生PK／Vanilla／主机、PRNG或概率分布；人物书籍、DeckInit、愤激／性格、开场／追击／留情、campaign与P078及全部依赖排除。43证据主题／45历史快照不减。仅静态编辑、独立审阅、纸面推导和字节身份核对，未运行测试、编译、typecheck、build、validator、checker、诊断、候选、示例或replay。以下旧段按原profile及历史时点保留。

## 2026-10-21：现代参考 DeckGenerate 显式抽样独立核（静态）

[PR112](https://github.com/DanielMax937/sanguozhi/pull/112)已将补牌核接入有限当前牌组会话。本批另补[可复用牌组生成核](docs/rules/debate-deck-generate-v1.md)与[完整API／抽样和交换审计](docs/engine/debate-deck-generate-v1.md)：给定有序且不重复的0至5张话术可用池与完整原始draw，自行生成18张牌和新的话术池顺序，不由调用方直接指定最终牌组。

固定现代 DeckGenerate 按8小／4中／2大先取普通牌；话术池非空才执行2000次交换，再把打乱后前至多4张放入尾槽，不足部分从完整九种普通牌表抽取；最后整堆执行2000次交换。普通表是[4,1,7,5,2,8,6,3,9]，不是补牌修补的1+draw映射。池长1仍消费2000次bound1，池长5只取打乱后前4张，但完整5张重排状态返回。n=0..5所需draw依次2018／4017／4016／4015／4014／4014，不删自交换、不用Fisher–Yates替换，不声称均匀洗牌或真实概率。

本核没有牌组游标，DeckGenerate本身不重置index；原调用者跨界后置index=0是另一步。返回完整抽样／交换／阶段审计，错误时无部分牌组或池状态；不接人物／书籍／MOD资格、DeckInit或全局PRNG。旧八个会话与已交付补牌／共享战斗核均不改，**尚未将生成核接入跨18牌边界**，PR112的unsupported-deck-regeneration仍保留，不能把本组件交付说成完整发牌或完整舌战闭环。

固定现代转录来源不认证原生PK／Vanilla／主机，43证据主题／45历史快照不减；愤激／性格、人物、开场／追击／留情、campaign与P078及其依赖继续排除。仅静态文本、独立审阅、人工纸面推导与字节哈希；未运行测试、编译、typecheck、build、validator、checker、诊断、候选、示例或replay。下方各旧范围按原profile及历史时点保留。

## 2026-10-20：18张当前牌组补牌核接入正常态会话（静态）

[PR111](https://github.com/DanielMax937/sanguozhi/pull/111)已交付独立补牌核；本批新增[实际接核的独立会话](docs/rules/filled-debate-session-v1.md)与[API／收据／存档合同](docs/engine/filled-debate-session-v1.md)，在初始化、可选再考与非终局补缺三个阶段调用同一核。出牌后按固定源码先压紧保留牌，再将尾部空位交给补牌核；保存补牌前槽位、数值排序与牌身份，普通话题修补覆盖牌面但保留已消费牌组项的token，不伪造额外抽牌。

每人只接收给定18张当前牌组。必要的修补随机与伤害／诡辩话题随机按阶段串联；先手再考→后手再考→攻击→话题→队伍0／1补缺，初始化另按队伍0／1处理。完整核收据和全历史重算覆盖实际状态，缺失、多余、错序随机或越过当前牌组边界整条拒绝。未实现牌组再生成、发牌概率、洗牌或全局PRNG。

为避免再次复制整套战斗逻辑，正常态攻击／附效／终局和话题结算抽为内部共享核，PR110旧再考模块保持原公开接口、政策、收据与存档行为；其他六个旧模块不改，新补牌核也不改。新tag不接受旧存档、不隐式迁移，旧七个profile原边界不因本批消失。愤激／性格、人物书籍、开场／追击／留情和campaign结果仍未覆盖；只扩大固定现代转录参考支持域，不认证原生PK／Vanilla／主机等价。43证据主题／45历史快照保留，P078及全部依赖排除。

仅静态代码与文档审查及字节身份核对，未运行测试、typecheck、编译、构建、validator、诊断、纸面示例、replay或项目代码；不能据此宣称运行通过。下方历史段落按各自原profile与时点解释。

## 2026-10-20：舌战当前牌组补牌／话题修补独立核（静态）

[PR110](https://github.com/DanielMax937/sanguozhi/pull/110)已交付正常态再考会话。本批另外新增[独立补牌规则核](docs/rules/debate-hand-fill-v1.md)及[完整API／来源审计](docs/engine/debate-hand-fill-v1.md)：只接收给定的18张当前牌组、游标、3至6个可出手槽与必要的九选一修补原始输入，不再复制一套完整会话。

按固定现代 CharacterFillCards 顺序，先恢复保留再考槽0，再在原物理槽1起依次补空位；只有填后无普通话题牌且本次确实补过空槽，才把最后新补槽改为1+RandInt(9)对应牌，再按现代枚举数值排序。完整无空位的全话术手牌不会被无条件修补。修补覆盖的牌组项仍算已消费，不另推进游标；同值牌的可追踪排序仅采用显式工程审计规则，不声称固定了原排序的对象身份顺序。

跨越18张当前牌组边界明确返回 unsupported-deck-regeneration；不实现牌组生成、洗牌、概率、全局PRNG、人物书籍或愤激覆写。本核没有HP／stress／canRethink／回合／campaign写入，也没有会话存档。旧七个profile与存档保持不变，**尚未接入新核**；PR110的 unsupported-topic-repair 与各旧版原发牌边界仍然存在，不能把此底层核交付说成完整发牌或完整舌战已经完成。

证据限定固定现代C#转录及枚举，不升级为原生PK／Vanilla／主机认证；原43证据主题／45历史快照不减，P078及全部依赖排除。本批仅静态代码／文档审查，未运行测试、typecheck、编译、构建、validator、诊断、示例或项目代码；独立纸面输入与预期不作运行通过结论。

## 2026-10-20：再考重抽与崩坏恢复的独立正常态会话（静态）

在[PR109](https://github.com/DanielMax937/sanguozhi/pull/109)诡辩版本之外，新增[正常态再考参考会话](docs/rules/rethink-debate-session-v1.md)与[完整API及重抽收据](docs/engine/rethink-debate-session-v1.md)。再考不是第七种攻击牌：在出牌阶段按先手可选重抽→先手最终选牌→后手可选重抽→后手最终选牌处理，再进入既有六种战斗牌结算。整个过程被工程API打包成一个原子回合，不声称实现交互式阶段存档。

正常态再考初始可用，用后关闭；仅非终局崩坏等级改变时在下轮开始恢复，不是每回合自动恢复，也不积累多次额度。同轮先再考后受伤跨崩坏阈值，可以使下轮恢复，但不能借用尚未发生的恢复来满足本轮请求。重抽弃掉整副可出手牌，沿原提供牌带继续消费，保留独立弃牌／替换牌／补牌与游标审计；现代显示层可用性保护不冒充原生玩家侧已认证限制。

新profile的所有补牌阶段（初始、再考、非终局补缺）都要求给定手牌至少含一张普通话题牌，否则整轮或初始化明确拒绝，保留原强制话题替换随机分支未实现。终局出牌后不补牌，不额外套该约束。原发牌分布、洗牌、全局RNG、显示排序及愤激冷静额外重抽规则不在本批内；无外部随机副作用只属于明确的给定牌带／无修复子集，不声称原源码再考天然不消费随机。

旧六个profile、源码与存档不变，无隐式迁移；下方历史“再考未覆盖”只适用原profile或时点。仍缺四性格愤激／自动反制／连打、原发牌和强制替换、人物书籍、教程、开场／追击／留情及campaign结果。固定现代转录来源不升级为原生PK／Vanilla／主机认证，原43证据主题／45历史快照保持开放。P078及全部依赖排除。

只静态代码与文档审查，未运行测试、typecheck、编译、构建、validator、诊断、示例、replay或产品；五轮及独立拒绝的纸面设计不作运行通过结论。

## 2026-10-20：诡辩反射及条件话题随机的独立正常态会话（静态）

在[PR108](https://github.com/DanielMax937/sanguozhi/pull/108)激昂版本之外，新增[普通话题＋五话术的正常态参考会话](docs/rules/sophistry-debate-session-v1.md)及[完整API与阶段收据](docs/engine/sophistry-debate-session-v1.md)。诡辩power20，以诡辩方attack和对方普通牌系数计算反弹伤害；镇静的请求基数仍读对方stress，但反射后写自己，激昂则反射给对方。计算主体、牌所属方、请求基数与实际写入目标分开记录，不凭自然语言猜目标。

限定非教程、双方angerTimer0的通用子集。非终局非平局，只要一方出诡辩且对面不是无视，回合末额外消费bound3话题随机，包括诡辩输给大喝；可以抽回原话题。Attack所需bound5伤害随机先消费，HP终局不消费话题随机；非终局stress100仍在话题阶段之前整轮拒绝。全部随机按阶段校验，拒绝多余、缺失或错序输入，无外部RNG副作用。

旧五个profile、源码及存档不变，无隐式迁移。本批接纳正常态普通牌和五话术，不等于完整舌战：再考、四性格愤激／自动反制／连打、原发牌／全局RNG、教程、人物书籍、开场／追击／留情及campaign结果仍未实现。本段之后历史“诡辩未覆盖”只属于原profile／时点，不重复交付已完成版本。

新增固定现代枚举源码仅支持Story0／Logic1／Trend2映射，不认证原生PK／Vanilla／主机，原43证据主题／45历史快照不减。P078及全部依赖排除。只静态文本修改与独立审查，未运行测试、typecheck、编译、构建、validator、诊断、示例、replay或产品；七轮及下一轮拒绝的纸面例子不作运行通过结论。

## 2026-10-20：激昂自增压力的独立正常态会话（静态）

在[PR107](https://github.com/DanielMax937/sanguozhi/pull/107)镇静版本之外，新增[普通＋大喝＋无视＋镇静＋激昂会话](docs/rules/agitate-debate-session-v1.md)与[完整API及阶段收据](docs/engine/agitate-debate-session-v1.md)。固定现代参考中激昂power0，不会赢过本子集任何牌；输给普通／大喝时先承受攻击，再为使用者自己请求stress+40并裁剪。无视胜会抑制败方激昂；双激昂或激昂对镇静是平局，只双方stress+15，不调用附加效果。

攻击→附加效果→HP终局→非终局愤激边界顺序不变：HP败退仍先记录激昂效果；非终局效果后stress100则整轮拒绝，不产生半轮保存、也不假装已实现愤激。收据的激昂targetId为使用者本人，被抑制请求为null而非假算+40；镇静仍以对方为目标。旧四个profile、源码和存档保持不变，无隐式迁移。

历史段落中“激昂未覆盖”只属原profile／时点；当前仍缺诡辩反弹及条件话题随机、四性格愤激／自动反制／再考、原发牌／全局RNG、人物书籍、开场／追击／留情及campaign结果。本次只扩大固定现代转录源码的正常态通用子集，不升级原生PK／Vanilla／主机证据，不减少原43主题／45历史快照。P078及全部依赖继续排除。

仅静态文本与独立审查；未运行测试、typecheck、编译、构建、validator、诊断、示例、replay或产品。五轮成功及第六轮拒绝的纸面例子不是运行结果。

## 2026-10-20：镇静附加效果的独立会话（静态）

在[PR106](https://github.com/DanielMax937/sanguozhi/pull/106)已交付普通＋大喝＋无视之外，新增[普通＋大喝＋无视＋镇静会话](docs/rules/compose-debate-session-v1.md)及[完整API与阶段收据](docs/engine/compose-debate-session-v1.md)。参考源码正常态镇静power0，输给普通或大喝后降低对方（本轮胜者）当前stress：−max(trunc(stress/2),30)，再裁剪；并非给自己镇静。无视胜会阻断败方镇静，双镇静平局没有附加效果，仍双方stress+15。

新独立profile保留攻击→附加效果→HP终局→非终局愤激边界的明确顺序，收据保留攻击和附加效果分阶段请求／实际写入以及被抑制状态。旧三个profile、源码和存档不改，不隐式迁移。下方各旧批次的“尚未覆盖镇静”只适用其原profile／时点，不应据此重复交付；当前仍不支持诡辩／激昂、四性格愤激／再考、原发牌／全局RNG、人物书籍、开场／追击／留情或campaign结果。

只扩展固定现代转录参考下的通用正常态子集，不把工程政策或现代源码升级为原生PK／Vanilla／主机证据，不减少原43主题／45历史快照。P078及全部依赖排除。仅静态代码／文档与审查，未运行测试、typecheck、编译、构建、validator、诊断、示例、replay或产品；纸面例子不是运行结果。

## 2026-10-20：大喝已交付登记与无视独立会话（静态）

[PR105](https://github.com/DanielMax937/sanguozhi/pull/105)已交付[普通＋大喝会话](docs/rules/shout-debate-session-v1.md)；本批补齐该版本的公共包入口和全局索引，不重交付其既有行为。另新增[普通＋大喝＋无视会话](docs/rules/ignore-debate-session-v1.md)及[完整API](docs/engine/ignore-debate-session-v1.md)：无视power120、败方stress+30、零HP伤害／零jitter，胜方非终局更新先手但保留话题；双无视仍为双方stress+15的平局。无视胜与平局的receipt明确区分，非终局stress100与牌带不足仍整轮拒绝。

三个独立profile／存档各自保留，旧普通和大喝API不改行为、不隐式迁移。下方历史“五话术均未实现”等说法只适用于旧普通profile或原日期；当前新增覆盖仅普通＋大喝＋无视的正常态通用子集，不能改称完整舌战已完成。诡辩／镇静／激昂、四性格愤激、再考、原发牌／全局RNG、人物书籍、开场／追击／留情及campaign结果层仍未覆盖。

来源仍为固定现代C#转录参考；既有普通核心证据标签不外推到新增话术，不认证原生PK、Vanilla或主机。原43证据主题／45历史快照不减，P078及全部依赖继续排除。本批只静态读写与审查，未运行测试、typecheck、编译、构建、validator、诊断、示例、replay或产品；纸面预期不是运行结果。

## 2026-10-20：巡察／市场共享账本接入季度治安下降（静态）

[具体规则](docs/rules/bounded-seasonal-patrol-market.md)与[完整API及保存合同](docs/engine/bounded-seasonal-patrol-market.md)增加独立版本化后继profile：固定太守／整备政令、有限完整随机带，季初先按旧治安计月收入，再写实际季降和足额工资；此后巡察及下月收入读取同一治安账本。复用原财政季降phase，不重复声称恢复旧公式。旧巡察市场v1与旧保存格式不变，无隐式迁移。

PR99的动态锻冶月产、PR101的市场收入工资、PR103的巡察收入反馈已分别有具体规则；本页下方旧“未集成”仅属当时或原profile范围，不能据此重新交付已补部分。当前仍未覆盖完整财政／粮／灾害、通用scheduler、多施工／升级／维修／取消、原RNG／writer／stock／Vanilla等价。P078及全部依赖继续排除；原43证据主题／45快照不减。完整窗口随机带预核只是工程完成尾政策，不是原生随机机制证据。

本批仅文本编辑和静态阅读，未运行测试、typecheck、编译、构建、validator、诊断、示例或产品。预算是纸面上界，不是运行测量；历史通过数字不验证本批。

## 2026-10-19 单锻冶厂建设→普通生产：限定同账本整合

[规则正文](docs/rules/bounded-forge-development-production.md)与[七API](docs/engine/bounded-forge-development-production.md)覆盖唯一新建锻冶厂从空地块、施工、完成到1–3号普通兵装生产；同一资源／人物／设施账本与唯一clock，完整开工证据、双向锁、真实当前TP／成长和全历史重建均保留。候选只用静态审阅，不运行测试、编译、构建或产品验证。

仍未覆盖多建设任务、其他建筑／吸收／升级／取消、HP与维修账本、件数工房任务、跨服务全部成长、季节财政、普通生产TP、全局RNG、原生人员任务或完整世界scheduler。完成尾只保证已接受施工可完成，不保证末旬完成后还有额外旬、金、AP或可用人员生产。原43主题／45快照证据缺项未被清除。以下旧范围说明保留原历史时点。

## 2026-10-18 单工房共享时钟：限定工程整合

[具体规则](docs/rules/bounded-city-piece-clock.md)与[八API](docs/engine/bounded-city-piece-clock.md)增加独立有限单城会话：内政／商人共享账本、唯一日期／旬／AP恢复、5号生产开工与容量／人物／设施双向预约、到期库存和成长、完整保存重建及连续legal分页。只覆盖这一封闭域，旧固定旬与独立服务保留；下面旧范围说明属于各批历史时点。

仍未覆盖完整世界scheduler、多工房／多任务类型、取消与返还、原生人员任务、设施施工和HP账本、跨服务全部人物成长、部队地图、季节／财政接合、完整TP／商人功绩、全局RNG及原始剧本。supplied事实与工程政策不清除原43主题／45快照的证据缺项。全部本批修改仅静态，未运行任何测试、编译、构建或产品验证。

## 2026-10-18 固定单城共享账本纵切（静态）

新增[规则](docs/rules/bounded-city-economy.md)与[API／CLI](docs/engine/bounded-city-economy.md)：单genesis、单ledger、五类即时动作、1–8步原子批次、全历史重算和无状态连续legal分页。仅这一固定城／固定旬支持域合并普通内政与商人的余额和人物进度，不能标整个O15或全游戏完成。

继续未覆盖：跨旬scheduler／任务预约、共用设施HP、跨服务人物属性与成长、部队／地图、完整TP／奖励、全局RNG、原始历史剧本及完整世界保存／AI。旧服务仍独立；原43主题与45快照保持历史分母和证据边界。所有新实现和示例仅静态，未运行测试、编译、构建或任何产品验证。下方各旧批次按其时点保留，旧测试结果不覆盖本批。

## 2026-10-18 固定单城季节：有限simulation静态覆盖

- [x] 新增[完整规则](docs/rules/city-season-lifecycle.md)、[六API](docs/engine/city-season-lifecycle.md)、policy／设施catalog／source／schema及未运行trace；公共index导出六函数、三常量和11类型
- [x] 固定单城、完整驻城名单和30槽；current／scheduled月步进、内部固定seed生成与持续、实际扣兵粮／健康恶化／Lv1农场移除和每座30TP
- [x] 真正复用两旧粮纯核：灾害后30槽／兵数→完整F→当前丰作→本地粮余额，完整请求／核receipt／实际到账和discarded保留
- [x] 风水只对新生成与激活双门、祈愿显式新参数；死亡／兵粮零／TP不足整月拒绝；genesis完整重算、幂等、preview及escaped SaveResult／全部旧返回预算的静态代码存在
- [ ] 原发生概率、祈愿数值、原迁移时点／持续／损失／健康RNG、Lv2边界、原writer／skill getter／stock版本仍未恢复；新政策不清这些证据债
- [ ] 原版全局scheduler、完整财政与跨服务账本／时钟未集成；原43主题／45快照不减少
- [ ] 产品、示例、测试、typecheck、编译、build、runtime、checker、诊断和schema验证均未运行；勾选项仅指静态代码与说明存在

公共入口集成基线为PR89 main `0c5ad00667d40960e72f2d8b14c9c20f7eec30fc`／tree `a88a940c92a37c85ac8a827f1f8988ae18401aea`；来源manifest保留PR86历史读取身份。两粮核、两份来源依赖与设施catalog在这两个基线间Git blob相同，不把集成版本提升为新的原作证据。 下方既有批次按各自日期与支持域保留。

## 2026-10-18 一次内政评定：有限静态覆盖

- [x] 新增[完整规则](docs/rules/single-council-lifecycle.md)、[七个API](docs/engine/single-council-lifecycle.md)、完整policy／sources／schema及未运行trace；公共index导出全部函数、固定policy和14个类型
- [x] 固定完整roster、君主关系及最多6参与者，方针／具体案两阶段采决；内部合法候选生成、提案／赞同去重、可改选和唯一Complete／Abort终态
- [x] 三类普通内政案复用原city-command公开API：Patrol、Recruit、Produce装备1–4；共享同一child真实费用／资源／XP／功绩／acted／used，整条原子提交，保留所有child receipt
- [x] 完整genesis重算、固定新PRNG与全部raw、同ID幂等、终态限制、escaped SaveResult与所有历史receipt预算的静态实现
- [ ] 其他19类、件数兵器／舰船、native chooser／完整筛选／执行调用链／次序／原奖励资格、普通案TP与全局接续仍未实现或未证实；+10只为完成奖projection，不能认作完整force TP
- [ ] 原版事件／灾害与跨服务一致性未集成；原43主题／45快照未决项不减，22类池不等于22类可执行
- [ ] 产品、示例、测试、typecheck、编译、build、runtime、checker、诊断及schema验证均未运行；以上勾选仅指静态代码与说明存在

公共入口集成基线为PR88 main `8063d39731a42af87646168d4b36b92bd9d3ed3d`／tree `5e555fcda99f97e71e50c9c8565810dca50915be`；来源manifest继续保留PR86原始读取身份，普通city-command源码blob `f07b0762e045dfb77caeb8e46c06e7cee8bd255f`在两版本间相同，不把集成版本当成新的原作证据。下方既有批次按各自日期与支持域保留。

## 2026-10-18 O14 query：固定来源三值查询静态覆盖

- [x] 新增[完整规则](docs/rules/source-event-query.md)、[三个API](docs/engine/source-event-query.md)、固定registry、来源身份、输入／响应schema与未运行输入示例；公共index导出查询及类型
- [x] 独立浏览通用33／史实105／PS2 64观测，保留已知形状子条款pointer与unknown原因；只比较管辂治安≥90和于吉同城四原子项，共五原子／一局部all，不把资料数当实现数
- [x] 静态代码区分片段comparison、完整clause、整体条件与禁用执行；封闭typed facts＋bindings输入，缺失／版本／未知分组保守unknown；完整响应预算与小型failure另设界限
- [ ] 完整观测条件分组、管辂灾害scope、其余来源条款、原生ID／版本／一次性flag／概率／完整结果继续未决，heading-only不判true；corpus executionEnabled=false不改，事件发生与结果执行均无实现
- [ ] 评定／灾害、完整O14与O15跨服务一致性仍开放；原43主题／45快照及全部E／X不减，既有野战等服务不扩域
- [ ] 运行验收未执行：产品、示例、测试、typecheck、编译、build、checker、诊断与schema校验均未运行，静态覆盖不等于通过

实现集成基线PR87 main `021097bdb63ed882bb7b1e1d11f6bdeaf8af017b`／tree `077cb16ad83c8a3a32a6f60a26b3a00cee1b0a93`；来源仍固定PR85五个未变Git blob。下方既有批次保留其各自日期与范围。

## 2026-10-18 O14 field：有限正兵力动作静态批次

- [x] 新增独立七动作／一次主目标反应、内部完整数值与状态写入，合法性／能力副效应／正兵力原子边界、六API、完整schema／固定policy／未运行example及[具体规则](docs/rules/field-combat-lifecycle.md)
- [x] 逐阶段来源与模拟政策分开，命中／会心／伤害／目标顺序／RNG全部receipt留证；genesis重算、所有历史重复ID、SaveResult转义和返回预算静态实现
- [ ] 原反击闭式、原普通会心、计略取整／helper／caller、stock字节及跨版本等价仍E；原native奖励、军团AP、死亡／capture／ownership／移动／火及全局事务仍域外
- [ ] O14事件／council／灾害、O15跨服务一致性不由本动作账本完成

集成基线：PR86 main `a04ee326fdaa68e930681430352f4d98fee5209e`／tree `df4e2be515e2434e4e64476517c8e58f0d3afaf0`。原43证据组与45条snapshot不减，全部原作exactness E及域外X保留。没有运行产品、示例、测试、typecheck、编译、build、checker、诊断或schema校验；静态代码存在不是运行通过。

## O13-B：相邻遗迹／庙有限事件静态覆盖

更新：2026-10-18 UTC。

- [x] 补[完整具体规则](docs/rules/adjacent-site-discovery-lifecycle.md)、[API](docs/engine/adjacent-site-discovery-lifecycle.md)、[policy](data/catalogs/adjacent-site-discovery-policy-v1.json)、[source](docs/sources/adjacent-site-discovery-lifecycle.json)、[schema](docs/sources/adjacent-site-discovery-lifecycle.schema.json)及[未运行场景](data/scenarios/adjacent-site-discovery-example-v1.json)：固定名单／编成／放置点／到达事实，内部相邻门槛、选择／抽样、真实发现／XP及12个月奖励、庙offer／替换、pending和独立完整保存重建
- [x] 区分攻略事实、supplied输入与新50阈值／LCG／cap／技能实验池；第4庙仅开放最高级池，不保证抽中；原作概率／坐标／具体池／writer及stock仍E
- [ ] 静态新增不等于运行验收；产品、示例、测试、typecheck、编译、build、checker、诊断和schema校验均未执行，其他模块的历史结果不验证本批
- [ ] 原43主题／45历史快照不减、不换分母；O14普通城市事件、O15全局集成仍分开，P078及native人员／归属／捕获／灭亡继承／任务return与finalizers继续X

## 2026-10-17 O13-A：固定单城Search有限覆盖

- [x] 静态新增内部过滤／选择／新RNG、三旧核复用、人才／宝物发现登记、金／AP／行动／奖励、有限旬序与完整genesis逐receipt保存重算；[完整规则](docs/rules/city-search-lifecycle.md)、[API](docs/engine/city-search-lifecycle.md)、[policy](data/catalogs/city-search-policy-v1.json)、[source](docs/sources/city-search-lifecycle.json)、[schema](docs/sources/city-search-lifecycle.schema.json)及[未运行场景](data/scenarios/city-search-example-v1.json)
- [x] 明确PR53／54／55仅三个已发布限定核；205原值不clip、宝物1／2／3不是原概率、稳定二读是新服务模型、最终金不足30实际入账0。新政策／listing调用点／攻略观察／旧核来源严格分层
- [x] O13-B有限到达／发现／奖励合同已补独立静态profile，见[相邻发现规则](docs/rules/adjacent-site-discovery-lifecycle.md)；A的历史来源身份与账本不改，未执行任何运行验收
- [ ] 原过滤／选择／RNG／AP helper／writer／stock／跨版本与O14事件、O15跨服务一致性继续开放；不实现当场登用、native归属、capture、force继承、任务return/finalizers或P078依赖
- [ ] 原43主题与45快照不减、不重新编号或新增分母。静态覆盖不等于验收通过；本批未运行产品、示例、测试、typecheck、编译、build、checker、诊断或schema校验，旧验证及历史food失败保持原状

## 2026-10-17 O12-B：固定双城普通流言标量有限覆盖

- [x] 补[完整规则](docs/rules/rumor-scalar-lifecycle.md)、[API](docs/engine/rumor-scalar-lifecycle.md)、新政策/来源/schema/未运行场景；内部success、保护/稀疏selector/抗性与loss，独立200金/30AP/actor频次、真实byte/治安、日历/RNG/原子幂等保存重算
- [x] 明确平均防守、odds、绝对关系保护、最多一人加空槽、义理阈值、loss和RNG均新设计；纠正旧“成功率公式已知”扩大表述，10/12仅独立listing参数事实
- [ ] 原成功概率/角色helper/selector/loss/writer/RNG、stock与跨版本继续E；原被捕风险 unresolved-not-modeled，行程/失败外交/XP功绩TP未模拟、ownershipFrozen=true，完整原世界命令与P078所有依赖仍X
- [ ] O12-A自然/现金已由PR83交付，但整个O12与原43不关闭、不增加分母；宝物E/未来物品范围非本批新增必做，普通item登记不自动归native ownership X
- [ ] 本批未运行测试、typecheck、编译、build、checker、诊断、schema校验、产品或示例；静态产物不等于验收通过，旧测试及历史food失败保留

## 2026-10-17 O12-A：固定驻城自然忠诚与现金褒赏有限覆盖

- [x] 静态新增两个真实命令及独立true忠诚/金/AP/每旬褒赏/日期/RNG账本；[完整规则](docs/rules/personnel-loyalty-lifecycle.md)和[API](docs/engine/personnel-loyalty-lifecycle.md)覆盖原子幂等、完整policy、逐receipt保存重算
- [x] 复用既有相性uint8教程核并仅消费returnedAl；明确自然三分支/豁免/两次loss、true0仍抽路径随机及true>100正常扣减
- [x] 新现金5+roll5不使用魅力/义理；公开保真差异、无印Sourcenext与S/L样本偏差、pages/79当前引用相关性纠正，保留旧来源JSON
- [ ] 原现金增量闭式/魅力义理/global RNG、原关系helper/writer、stock与跨版本身份继续开放；本批不实现登用ownership、俘虏、欠薪后果、native任务及P078所有依赖
- [ ] 整个O12与原43证据组不关闭；本树未运行测试、typecheck、编译、build、checker、诊断、schema校验、产品或示例，旧测试与历史food失败保持原状

## 2026-10-17 O11-B：已完成标准内政设施自动修复

- [x] 静态新增独立HP账本、政治9P/2与150..450夹值、两支独立floor、设施中心敌情、cap/弃置/首次到满、幂等与genesis保存重算代码及[完整规则](docs/rules/domestic-repair-lifecycle.md)
- [x] 明确混合listing身份、原GBK元数据与仅观察UTF-8 hash的区别；更正旧规则把最终整数工兵效果写成精确×2的误述
- [ ] 城市/港/关同址指令冲突、堤坝、PK特殊楼、native getter/helper/writer/callback、原版身份、全局调度与建设HP组合继续开放
- [ ] 本树尚未运行测试、typecheck、编译、build、checker、诊断、产品或示例；静态覆盖不等于验收通过，原43不减，旧测试及历史food失败保留

## 2026-10-17 O11-A：建设/吸收有限覆盖

- [x] 新增标准9设施建设与5类吸收独立状态机，完整费用/占地/人员/任务/奖励/保存重放代码和[详细规则](docs/rules/facility-construction-lifecycle.md)
- [x] 明确quarter/zero工作量、AP20/0、功绩争议和完工行动标记16种政策组合，复用旧速率与金粮核
- [ ] O11维修其余边界、PK十类特殊楼、战斗HP/升级HP writer与跨服务组合仍开放；已完成标准内政设施的独立维修见上方O11-B
- 本批仅静态代码/文档审查，未运行测试、typecheck、编译、build、checker、诊断、产品或示例。原43不减，既有food失败和P078依赖禁区不变

# 当前工作范围：O10-B单城商人（2026-10-17）

已补[具体规则](docs/rules/city-merchant-lifecycle.md)、[API](docs/engine/city-merchant-lifecycle.md)、独立代码、完整政策/lookup、schema与未运行场景：20AP/每城每旬一次、敌情两格、政治精确有理插值、买卖整笔入账与容量拒绝、AP/XP/行动、旬输入及全量保存重建。仅静态工作，没有执行测试/typecheck/编译/build/checker/诊断/产品/示例，旧测试与旧food失败保留。

仍开放：三交易helper完整语义、raw相场尺度、native取整/writer/owner/几何/AP/商人和价格生成、跨城运输、港关和全财政集成；原43不减。O10-A/B是两个独立有限子批，不能称全部财政完成；P078及native capture/mission/return/finalizers、俘虏欠薪排除。下方既有记录保留原日期语境。

# 当前工作范围：O10-A有限单城财政（2026-10-17）

已补本批独立代码与[完整规则](docs/rules/city-finance-lifecycle.md)、[API](docs/engine/city-finance-lifecycle.md)、[来源/政策](docs/sources/city-finance-lifecycle.json)、[未运行场景](data/scenarios/city-finance-example-v1.json)：固定owner、完整驻城普通有官薪名单、30设施金粮计算、旬/月/季结算、足额工资、逐兵种特产和cap、完整genesis重算。支持域内是代码覆盖，未运行测试/编译/build/checker/诊断/产品或示例，旧测试未改；历史food失败保留。

仍开放：港关财政、未知工资身份、欠薪后果、灾害生成、native owner/getter/helper/writer/调度/PRNG与stock版本认证。O10-A不是全部财政清零，原43组不减少；P078及其依赖继续不接入。其他普通子集不因此变成完整机制。

## 以前的候选与审计记录（历史，不是当前执行计划）

以下内容原样保留以追溯各自版本；旧“最新”“本地候选”“须验收”和通过数字不构成本次状态或运行结果。当前导航以上方入口及[STATUS](docs/rules/STATUS.md)为准。

2026-10-15 新独立工程候选：[每月特产兵装自动生产数量请求核](docs/rules/monthly-specialty-production.md)：明确设备1..4、30槽逐调用捕获与政治AL的可调用TS/Python核；opcode控制流与假定comment binary32/未知converter向零政策分层，非完整生产/实际入库/native认证。原43组未决证据主题不减，P0-78及依赖排除；本树全新验收另记，历史PASS不适用。

2026-10-14 新独立本地工程候选：[每月城市粮食harvest→levy参数叶](docs/rules/monthly-city-food-base-argument.md)，基于main `f6b6a31d587a8094fbba4b6fd27371288e3f3287`。仅连续无CALL的16条/35 bytes `[005905E0,00590603)`，当前EDI/EAX与独立晚期levy DWORD三个完整U32；先low32三倍再signed向零半减，后levy再向零半减，投影PUSH EDI位模式与signed视图。只补C2/C3已知规则工程债，原43不减；不假定helper保留EDI、不复用早期levy、不组合city或return-tail API，不接stack/writer/owner/force/scheduler/EndTurn。source-listing-reconstruction不认证stock/Vanilla/native。P0-78及依赖继续排除；正式新树验收/发布另记，历史PASS不验证本候选。

2026-10-14 新本地工程候选：[金钱/粮食据点收入返回尾部](docs/rules/base-income-return-tail.md)，基于已合并main `c508efac720574b17031ded707c052e19f3fb8d1`。双来源各66条/149 bytes只作身份核验，只投影15条/33 bytes返回叶段；捕获city callee返回EAX与后读type DWORD，零type原bits复制，任何非零raw type作signed32向零/5。完整U32输入，不自动调用city模块、不接owner/helper/ABI/writer/scheduler。仅部分补20%已知规则工程覆盖，原43组不减，P0-78及依赖排除。所有正式新树聚合/独审结果另记，以下历史通过数字不验证此候选；无外部发布。

2026-10-14 新独立工程候选：[城市粮食收入非Easy稳定已解析输入投影](docs/rules/city-food-income-projection.md)，基于PR #60已合并main `57a2f4dd34d0d888b23d1e46e2cb78402b91a7b4`。固定160条/494 bytes和16+22 bytes两表、30槽与4种统一类型行；军屯农保留U32乘积低位后unsigned /15000，最后signed32向零/100支持负返回；difficulty0整个Easy分支拒绝。只补已有规则的工程覆盖，原43组未决证据主题不减。来源仅source-listing-reconstruction，不认证stock/Vanilla、真实helper/ABI、原表、city/owner、writer或scheduler，P0-78及依赖排除。实现和全新验收仅本地；正式聚合及独审结果另记，以下历史通过数字不验证本树，旧城市金钱179原run/证据保持不动。

2026-10-13 新独立工程候选：[城市金钱收入稳定已解析输入投影](docs/rules/city-money-income-projection.md)，基于已合并PR #59 main `4824cfa124c573f2e2762396b85e0bcc8042d2da`。完整来源150条/437 bytes及16+21 bytes跳表，固定30槽、有效类型统一产量行、升级回退、限定造币、难度与晚期uint8治安；逐路径拒绝signed32中间乘法溢出，不将无界公式冒充原返回。属于已知规则的补充工程覆盖债，旧43组未决证据主题不减为42。不实现前置city/owner门槛、原查表/邻接helper、真实入账、完整财政/月度调度或P0-78及依赖；stock、原表和真实游戏执行仍open。本树须完成全新验收与独审，旧通过数不验证本树；以下旧候选文字为各自发布前历史记录。

# TODO — SAN11 Rules Exactness Cleanup

2026-10-12 新独立工程候选：[俘虏自然逃亡roll参数纯整数核](docs/rules/captive-escape-roll-argument.md)，基于已合并PR #58 main `3db7dc80363454b56c2dd9d138ae285f50dadf29`。这是已有文档公式的来源绑定API，不是新概率发现：26条/77 bytes、入口BL/AL和晚期月份三个U8，完整0..255域参数最高108815，不clip100、不合并早期month gate、不接RNG/释放/状态/EndTurn。完整自然逃亡、getter/ABI、调度及stock仍open；00599AA0同期仅纠正“断粮人口”命名债。43组剩余是证据主题，非43个可直接实现的任务。原PR #58及之前各项已按各自边界交付；以下旧候选/通过数属历史记录，不验证本树。本候选全新验收与实际发布状态另记；P0-78及依赖新增实现继续排除。

2026-10-11 新独立候选：[征兵治安writer请求参数叶](docs/rules/recruitment-security-argument.md)，基于已合并PR #57 main d1e93ada18efa5f95c584afd9309b228f9391f0c。只接早期保存C与入口ESI的u32两标量，signed IDIV/NEG、规范+0；7条/19 bytes（含两push9条/21 bytes），不接写回/command、不复用数量输入、法治MOD隔离。实际征兵/治安损失、ABI/helpers/stock仍open；新验收另记，下方旧候选/最新数字不验证本树。P0-78及其依赖新增实现继续排除。

2026-10-11 当前新增候选：[征兵数量显式ST0逐调用投影](docs/rules/recruitment-quantity.md)，基于已合并PR #56 main `aa751399544b65390ecfd66750c1362bba95a389`。131条/373所列字节；最多19个EAX捕获与独立ST0字段，最多21次typed调用收据，保留全loop无效N=1000、先技能后FIMUL、super先pressure及容量二次getter/32位回绕。仅pure caller数值核，不等于完整征兵、实际入库或stock认证。本树新验收/独审/发布另记；下方旧“最新/本地候选”与验证数字属历史冻结记录，不验证本树。P0-78及其依赖新实现持续排除。


2026-10-10 最新本地候选：[探索搜金caller整数投影](docs/rules/search-gold-caller.md)，基于已合并PR #54 main `cb76e148f35b519283cc296361b507674d0fff3a`。仅RNG返回后29条/82字节、逐调用点uint32观测与signed32分支；二轮getter仅裁剪时必填，不复用首轮，结果非实际奖励。人才PR #53、宝物参数PR #54已交付；以下旧“本地候选”及验收数字是各自历史冻结记录。本批新树单独验收、尚未发布；完整搜金/探索、RNG/helper/writer/stock仍open，P0-78及依赖排除。


本地候选：[探索宝物roll参数核](docs/rules/treasure-roll-argument.md)已新增独立API，256值域及中间商需以本候选新验收为准。仍待候选过滤/选择、004721D0随机语义、005D3D90归属奖励、完整探索命令及stock版本认证。PR #53人才核已合并；其历史搜宝未恢复标记保留，本次不声称搜宝完整关闭。

> Working policy: one fresh theme branch from the latest GitHub `main`
> Current theme: local resolved-input search-talent baseline listing reconstruction
> Integration baseline: PR #52 merged; this local candidate starts at `1053ce9fdee5668fc26bff4af20ff51dd913b39a`
> History: PR #2 was merged into main at `5c5611bb067c0dfe13cea1126ad69a12dade697c`
> Publication: local implementation and validation only. GitHub publication, PR and merge require new approval; no old validation result is reused
> Primary target: PC-PK1.1
> Updated: 2026-10-10 (UTC)

## Current reconciliation: delivered work and retained gaps

PR #42 reconciled summaries; PR #43–44 delivered selected static corpora, PR #45–46 bounded cultivation kernels, PR #47 the natural-loyalty caller correction, PR #48 domestic construction-rate and PR #49 patrol security-gain. PR #50 delivered the captured-input production-price integer core. PR #51 delivered the resolved-input production-quantity core. PR #52 delivered the independent affinity tutorial projection with its original limitations. This batch adds only the resolved-input search-talent numerical baseline reconstructed from a pinned public listing. It does not establish stock identity, final probability, helper bodies or any caller integration. Prior validation logs do not validate this tree. P0-78 and dependent capture, force-extinction and native-transaction work remain excluded.

- Local candidate: [search-talent baseline](docs/rules/search-talent-baseline.md), profile `search-talent-resolved-v1`, grade `source-listing-reconstruction`. Frozen base main1053ce9f (PR #52 delivered). Filtered count and stable resolved observations only; max205 is not clipped. No final probability, RNG, native helper bodies, command, gold or treasure closure. New independent validation required; no publication authorized
- Delivered, PR #52; original prepublication rebuild notes: [affinity-distance numerical core](docs/rules/affinity-distance.md), profile `affinity-distance-tutorial-u8-v1`, grade `tutorial-source-projection`. Full uint8 pairs retain negative results for differences above150; no modulo150, nonnegative clamp, pointer/ID resolution or caller integration. Fresh schema/source projection, exhaustive oracle, engine tests and aggregate validation must establish this tree independently
- Delivered, PR #51: [production-quantity numerical core](docs/rules/production-quantity.md), profile `production-quantity-resolved-f32-v1`. No implicit facility levels; skill before conversion and super after conversion; no 9000 cap or invented actual stock delta. All-invalid slots are unsupported, not native zero. Its original local-candidate text is a prepublication freeze; its tests do not validate the affinity rebuild
- Delivered, PR #50: [production-price integer core](docs/rules/production-price.md), profile `production-price-resolved-v1`, captured uint16 price and observed uint32 specialty EAX. AL zero returns original price; nonzero returns floor(8p/10), including legal zero. EAX256 does not discount,257 does. Source `sar dl` is preserved but C1FA02 decodes SAR EDX,2. Its earlier local-only text is a prepublication freeze; this new affinity tree cannot reuse its validation results
- Delivered, PR #49: [patrol security-gain numerical core](docs/rules/patrol-security-gain.md), complete original79 instructions/204 bytes with MOD7/21 isolated. Stable resolved input projection only; helper/getter/qualification/fees/writers/TP/scheduling and stock/cross-version evidence remain open. Its earlier local-only text was a prepublication freeze, not an undelivered kernel
- Delivered, PR #48: [domestic construction-rate numerical core](docs/rules/domestic-construction-rate.md), complete005BB1D0..005BB2AA public listing; max(maxPolitics+floor(sumPolitics/2),floor((D-floor(D/4))/9)) under stable getter/table assumptions. Original GBK blob and starred MOD separation are explicit; initial writer, full duration, mutable getters, per-turn progress, completion scheduling and clean-stock/cross-version equivalence remain open
- Delivered, PR #47: [natural-loyalty candidate source correction](docs/rules/natural-loyalty-candidate-boundary.md), unsigned AL>25 OR signed duty<=1/ambition>=3 OR full EAX from004889E0 nonzero; prisoners bypass the three clauses. Immutable public source, two MOD sections isolated. The independent affinity tutorial projection does not establish tutorial-to-caller linkage, native pointer/ID resolution, other callees, writer/RNG or stock closure
- Delivered, PR #44: [selected PS2 historical guide](docs/rules/ps2-historical-event-source-data.md), 64 independent observations/IDs and 741 source nodes; 59 condition/result sections (2 continuation-only), 4 condition-only openings and 1 reference-only section. The 24 source limitations, PK membership, original flags/catalog and runtime remain open. Historical105/66/41 and generic33/31/10 corpora remain byte-identical
- Delivered, PR #36: [45 static port/gate parent-city relations](docs/rules/static-subordinate-bases.md), reconciled against all 42 city counts. Still missing: the three null development-patch splits, original numeric base IDs, 40,000-cell terrain/coordinate/adjacency data and original scenario initialization. Next evidence: independently attributable original map/scenario data, not inferred static parentage
- Delivered, PR #46: [S1 PK skill-training scalar eligibility](docs/rules/pk-skill-training-s1.md), after category2 selection, with full native signed32 inputs, equality plus caller inversion and byte-bound S1 evidence. Another existing skill does not block; out-of-range targets yield caller true. No guide-ID mapping, state writes, completion, fees or scheduling
- Delivered, PR #45: [S1 PK five-stat numeric core](docs/rules/pk-stat-training-s1.md), separate start predicate and completion arithmetic with requested/credited XP, bounded ordinary or already-resolved getter inputs, explicit negative-delta rejection and byte-bound evidence. Full command gates, AP/gold/duration/use counters, native98 mapping, hidden RNG, scheduler and clean-stock equivalence remain open
- Delivered, PR #37: [PK ability research guide transcription](docs/rules/15-pk-ability-research.md), with 48 base nodes, 52 base arrows, 4 start arrows and 50 hidden candidates in 10 positions; conflicting guide claims remain explicit. Still missing: original-data equivalence, ability-research/cultivation command execution, hidden-selection algorithm and RNG. Next evidence: source-bound original tables and callers; guide data is not stock certification
- Delivered, PR #38: [selected historical guides](docs/rules/historical-event-source-data.md), 105 observations / 66 corpus event IDs / 41 source differences. Still missing: unstated flags, unresolved differences, complete original catalog and evaluation/result execution. Next evidence: additional platform-qualified sources and original flag/caller/result paths
- Delivered, PR #39–41: strict CLI parsing before effects, linear accumulation of private replay history with public dispatch isolation preserved, and RuleEvidence shape validation / reserved-name counting. See [training lifecycle](docs/engine/pk-training-lifecycle.md) and the root README's CLI contract. These improve only the Train / bounded EndTurn synthetic sandbox; no AI, economy, warfare, scenario execution or complete scheduler was added. Next evidence for original equivalence remains source-bound runtime/clean-stock validation, not passing sandbox tests
- Reconciled current rule debt: [缺少的数据.md](缺少的数据.md) now separates delivered generic kernels and published formulas from their actual remaining exactness/version boundaries. [Training gate/reset](docs/rules/82-training-lifecycle-source-profile.md) is source-profile recovered; [auto-office](docs/rules/43-auto-office-selector-exactness.md) retains classifier/caller/qualification gaps; combat and strategy formulas keep their existing empirical evidence grades

Clean-stock PK1.1, Vanilla/console equivalence, global RNG, original saves and full runtime remain open. No open item is closed merely to reach a zero count.

## Static data: selected generic-event guides

- [x] Transcribe Wiki88's complete31-heading generic section and two selected GamerSky2009 PK observations into [an independent corpus](docs/rules/generic-event-source-data.md):33 observations,31 new generic IDs,10 unresolved source/interpretation issues
- [x] Preserve the Wiki-only6/2/1/1/21 coverage breakdown:21 heading-only records contain no invented rules; civil-officer recommendation stays an unverified anecdote
- [x] Keep unknown native IDs, one-shot flags, probabilities and qualitative deltas null; source URLs, selection boundaries, rendered-line snapshot hashes and uncertainty remain explicit
- [x] Add independent closed schemas and78 static adversarial tests without importing historical checkers or engine code; historical105/66/41 files remain byte-identical
- Still open: missing source conditions/results, unresolved comparisons, original event catalog, platform/build equivalence and executable behavior. No evaluator, scheduler or result executor was added; P0-78/native-dependent work remains excluded

## Static data: 45 subordinate-base parent-city mappings

- [x] Add [45 named parent relations](docs/sources/subordinate-bases.json), with 10 gates and 35 ports, stable repository IDs, exact existing city-name references and per-row source locators
- [x] Preserve the source's spellings, explicit normalization, page timestamp, retrieval date and community-reference/unspecified-version boundary; retain factual projections and their SHA-256 pins
- [x] Reconcile every one of the existing 42 city counts, including 15 zero-count cities; no count disagreement found. Existing `cities.json` bytes remain unchanged
- [x] Add 9 static-data tests to the existing `npm run check` suite; [scope and contract](docs/rules/static-subordinate-bases.md)
- Still open: 北海/建業/會稽 development-patch splits, hex coordinates/terrain/adjacency, original numeric base IDs and scenario initialization. Static parentage supplies no runtime ownership, capture, income, order or event behavior; all existing evidence debt below remains

## 1. Current progress

### Completed bounded implementation: event9 live home getter

- P0-77 expands only 004BA44C..004BA45E in a new explicit frame/version, retaining all 25 inherited entries and adding event9-home-getter. The saved troop calls its current virtual08 directly at00495525, with no invented0047A630 wrapper or raw44 gate; prior raw44=-1 does not suppress this getter. Unknown troop08 remains an exact ordered whole-frame/RNG effect-query. False preserves callback changes and returns-1; true reads the live leader from current storage of that same saved troop, saves its canonical person pointer, validates once and reads signed homeBaseId from that saved person
- Complete004A31E0 proves the already represented person.homeBaseId is DWORD+98. Every signed32 bit pattern remains accepted, separately from force byte+98; no duplicate field or arbitrary person08 callback domain is added. 00490D00 accepts signed0..16383 and constructs numeric building pointer identity under fixed manager07201958 without reading building storage or validity. A missing/invalid in-range building can still yield a pointer; storage is required only at a later genuine read. Missing reached troop/person storage is an explicit gap
- Getter RET and numeric resolver RET4 balance the45E continuation. Original manager, saved force/troop/subject/target, captured raw44, old/new scalars and cursor remain bound, together with the returned home scalar and building pointer. The opaque suffix binds004AD220/site004BA467, incoming ECX0799895C, arguments[saved troop,4,building] and reverse PUSH order, without claiming the helper uses incoming ECX. Presentation411..432 and reaction45E..46C remain whole-frame/RNG observations or atomic rejection. Old APIs/frames/traces remain intact
- Guide: `docs/rules/112-native-event9-home-getter.md`; the complete latest-main 124/124 command run passed on one frozen tree: TypeScript,85 Node tests,121 Python checker commands and2 demos. Its unchanged28-group independent model ran once in the full set (474 accepted cases,1003 atomic rejections,84 killed source-specific mutations, each with an unchanged control). The25 source groups plus inherited20/nested17/26/21/21/17/12/13 and34 clean-controlled source mutations, both complete IDB fingerprints/all1329 raw intervals (S1 658/S2 671), and8 historical independent probes (60 accepted/42 rejected) passed. All126 full/supplemental raw command logs and504 fixed-inode lock events were hash-verified. Every command used heap512/TAP/semi16, a dedicated repository-external npm cache and no Python bytecode writes; original product argv stayed unchanged. Formal TAP_DISABLE_COVERAGE/TAP_RCFILE were unset, whereas the historical isolated run added both, so identical environments are not claimed. All2184 tracked files, the real index and dependencies remained identical through full/supplemental checks; only5 result documents were then updated for separate review. Independent delta and terminal review passed, including35/38 unchanged new production/model/raw/report files, formal baseline/two P0-76 metadata pins and the separate strict historical extraction baseline for the unchanged raw report; Gitblob proof recurses to P0-67. P0-72's approved strict test32 pin remains with no new model exception. Historical Capstone5.0.7 reports were hash-checked only; no recovered machine code was executed and no hosted CI/stock/runtime proof is claimed. The38 additions include guide112 and retain formal guide107; previous failure history and open evidence debt remain
- Still open: actual presentation and reaction45E..46C, mutable event arguments and event16/18, canonical capture/surrender/captive policy, force extinction, recursive ruler ownership, positive refunds/resources and other cancellation, S2 effects/full vtable tail, fallback reset scheduling, unrepresented temporary/formatter/external/platform/concurrent state, global RNG, clean-stock/Vanilla/console/original-save/runtime certification. PKPC1.1 stays primary and Vanilla remains isolated; MOD-associated selected bytes do not prove clean-stock behavior

### Completed bounded implementation: event9 saved-troop raw44 reset

- P0-76 expands only 004BA442..004BA44C in a new explicit frame/version, retaining all 24 inherited entries and adding event9-troop-reset. Existing troop raw44 accepts every signed32 bit pattern; its DWORD all-ones store is represented as -1, separately from unsigned force rawDword94. No defaults, coercion or gameplay meaning are inferred
- 004AD2B0 validates the saved ESI troop exactly once through 0047A630: canonical live leader/person/deputy validity, or an exact unknown08 full-frame/RNG effect-query. False preserves callback changes but skips the direct store; true writes raw44=-1 on current storage of that same saved identity through 00495A20/00495A32, even after callback changes leader/vtable/frame/ownership. No second validity, owner reread or virtual setter dispatch is invented; missing reached storage is an explicit gap. No generalized setter API is exposed
- The earlier EBX force remains the identity captured from pre-presentation raw44, never recomputed from current ownership or the reset field. Its raw94/raw98 writes precede troop raw44 in the same atomic command. 445 copies original saved manager EDI into ECX, but the helper ignores incoming ECX; setter RET4/helper RET8 balance the 44C continuation, retaining original manager, saved force/troop/subject/target, event domain, captured raw44, old/new scalars and next-node cursor. Presentation411..432 stays combined; home/reaction44C..46C remains one full-frame/RNG observation. Stack cleanup does not prove temporary destruction or absence of aliasing/asynchronous retention
- Guide: `docs/rules/111-native-event9-troop-reset.md`; the complete latest-main 122/122 command run passed on one frozen tree: TypeScript,85 Node tests,119 Python checker commands and2 demos. Its unchanged34-group independent model ran once in the full set (374 accepted cases,889 atomic rejections,38 killed mutations). The20 source groups plus inherited17/nested26/21/21/17/12/13, both complete IDB fingerprints/all1327 raw intervals (S1 657/S2 670), and6 historical independent probes (38 accepted/32 rejected) passed. All124 full/supplemental raw command logs and fixed-inode lock records were hash-verified. Every command used heap512/TAP/semi16, a dedicated repository-external npm cache and no Python bytecode writes; original product argv stayed unchanged. Formal TAP_DISABLE_COVERAGE/TAP_RCFILE were unset, whereas the historical isolated run added both, so identical environments are not claimed. All2146 tracked files and the real index remained identical through full/supplemental checks; only5 result documents were then updated for separate review. Independent delta review confirmed189/192 unchanged new production/model/raw/report files, formal baseline/two P0-75 metadata pins and the separate strict historical extraction baseline for the unchanged raw report; proof recurses to P0-67. P0-72's approved strict test32 pin remains with no new model exception. Historical Capstone5.0.7 reports were hash-checked only; no recovered machine code was executed and no hosted CI/stock/runtime proof is claimed. The192 additions include guide111 and retain formal guide107; previous failure history and open evidence debt remain
- Still open: actual presentation and home/reaction44C..46C, mutable event arguments and event16/18, canonical capture/surrender/captive policy, force extinction, recursive ruler ownership, positive refunds/resources and other cancellation, S2 effects/full vtable tail, fallback reset scheduling, unrepresented temporary/formatter/external/platform/concurrent state, global RNG, clean-stock/Vanilla/console/original-save/runtime certification

### Completed bounded implementation: event9 saved-force reset

- P0-75 expands only 004BA432..004BA442 in a new explicit frame/version, retaining all 23 inherited entries and adding event9-force-reset. Force rows require unsigned32 rawDword94 and unsigned8 rawByte98; existing bit patterns stay unrestricted and no game meaning is inferred
- EBX retains the force identity derived from the earlier saved troop raw44. 004B5020 checks that force's current validity once: canonical ruler0..1099, or exact unknown08 full-frame/RNG effect-query. False preserves callback changes but skips both stores; true writes raw94=0xffffffff then raw98=0 on current storage of the same saved identity, even after callback replaces ruler/vtable/frame. No reread of troop ownership, second validity gate or virtual setter is invented; missing reached storage is a gap
- 432 reloads the manager to EDI and 43B copies it to ECX, but the helper ignores incoming manager ECX. Setter RET4 and helper RET12 balance the 442 continuation; saved manager/force/troop/subject/target, raw44, old/new scalars and next-node cursor remain bound through the whole 442..46C reaction remainder. Presentation411..432 stays combined; parameter cleanup does not prove presentation-object destruction or absence of retention
- Guide: `docs/rules/110-native-event9-force-reset.md`; the complete latest-main 120/120 command run passed on one frozen tree: TypeScript, 85 Node tests, 117 Python checker commands and 2 demos. Its unchanged 34-group independent model ran once in the full set (312 accepted cases, 905 atomic rejections, 32 killed mutations). The 17 source groups plus inherited26/nested21/21/17/12/13, both complete IDB fingerprints/all1323 raw intervals (S1 655/S2 668), and10 historical independent probes (18 accepted/40 rejected) passed. All122 full/supplemental command logs and fixed-inode lock records were hash-verified. Every command used heap512/TAP/semi16, a dedicated repository-external npm cache and no Python bytecode writes; original product argv stayed unchanged. All1954 tracked files and the real index remained identical through full/supplemental checks; only5 result documents were then updated for separate review. Independent delta review confirmed185/188 unchanged new production/model/raw/report files and formal-baseline/two P0-74 metadata-pin changes, recursively proved to P0-67. P0-72's approved strict test32 metadata pin remains with no new model exception. Historical Capstone5.0.7 reports were hash-checked only; no recovered machine code was executed and no hosted CI/stock/runtime proof is claimed. The188 additions include guide110 and retain formal guide107
- Still open: actual presentation and reaction442..46C, mutable event arguments and event16/18, canonical capture/surrender/captive policy, force extinction, recursive ruler ownership, positive refunds/resources and other cancellation, S2 effects/full vtable tail, fallback reset scheduling, unrepresented temporary/formatter/external/platform/concurrent memory, global RNG, clean-stock/Vanilla/console/original-save/runtime certification

### Completed bounded implementation: event9 presentation decision

- P0-74 expands the post-selection decision from 004BA345: saved troop raw44 becomes a saved force pointer, distinct from the troop's live owner. Canonical troop48/current-force validity/player predicates preserve virtual-call order and live rereads after mutable callbacks; unknown 08/40/48 calls remain exact full-frame/RNG effect-queries
- All 22 inherited entries plus event9-presentation use a new explicit frame/version. Force vtableAddress is required; old APIs/frames/traces and the full 42-group model checker are unchanged. Saved force/troop/target/subject pointers, entry manager, scalar locals and next-node cursor survive observation replacements
- Native event-word reread is preserved within the explicit immutable-command-event-v1 domain; mutable event memory and event16/18 remain open. Known caller-stack temporary writes remain inside the 004BA411..004BA432 whole presentation observation. Cleanup does not prove destruction, retention, aliasing or asynchronous lifetime. 004BA432..004BA46C remains a separate mutating reaction observation; S1/S2 0063ADE7 subcalls remain source-specific
- Guide: `docs/rules/109-native-event9-presentation.md`; all 118 required command types have successful evidence on one frozen product tree: TypeScript, 85 Node tests, 115 Python checkers and 2 demos. The initial run passed 117/118; npm check and its unchanged-environment retry each ended with lifecycle child SIGKILL (58/59). A direct Node 85/85 run was diagnostic only. The original npm run check argv subsequently passed with the sole supported environment addition --max-semi-space-size=16 to heap512/TAP. The cause of the earlier signals remains unproved; this is not a single-green-run claim. The 42 model groups, 26 source plus inherited21/nested21/17/12/13, both whole-IDBs/all1317 raw intervals and17 historical independent probes passed. All122 command-attempt logs, including both failures, were hash-checked. All1766 files and the real index stayed unchanged throughout; only5 result documents were later updated for separate review. Independent delta review confirmed179 unchanged audited new production/model/raw/report files, recursively proved baseline and2 new metadata pins, and retained the approved P0-72 strict test32 pin correction with no new model exception. The relocated test16 module selector was independently shown nonempty (47 modules/367 production patches), with a rejecting production-contamination control. Historical Capstone5.0.7 reports were hash-checked only; no game code was executed or hosted CI/stock proof claimed. The183 additions include guide109; formalguide107 is preserved
- Still open: actual presentation/reaction, mutable event arguments and event16/18, canonical capture/surrender/captive policy, force extinction, recursive ruler ownership, positive refunds/resources and other cancellation, S2 effects/full vtable tail, fallback reset scheduling, unrepresented memory/platform/concurrency, global RNG, clean-stock/Vanilla/console/original-save/runtime certification

### Completed bounded implementation: event9 live troop selection

- P0-73 expands004BA1D0 eligibility through004BA345 in the same frame.004922C0 saves next node before payload/virtual/suffix callbacks; it later follows that saved identity and reads the reached node live. Duplicate payloads, node removal/reuse and terminating cycles are represented; failed probes and missing reached storage remain explicit gaps
- New explicit frame adds troop raw44/order/target fields and mutable heap-node identities. Complete00495CE0 target dispatch and canonical troop+40 use live reads; saved raw44, subject/target/troop pointers, manager ECX and next cursor survive full-frame/RNG replacement. All21 inherited entries remain plus event9-selection. Old APIs/frames/traces and39 behavioral model groups are unchanged
- Unknown virtual validity/type/force calls are exact mutable effect-queries, never implicit pure/false answers. Ordinary event9 composes in one frame/revision.004BA345..004BA46C still observes presentation and mutating reaction, including virtual+48; node/call/depth budgets are engine safeguards, not native game rules
- Guide: `docs/rules/108-native-event9-selection.md`; fresh latest-main116/116 commands passed in one frozen run: TypeScript,85 Node tests,113 Python checker commands and2 demos. The39 model groups,21 new plus21 inherited and nested17/12/13 source groups,both whole-IDB/all1297 raw intervals and18 historical independently authored probes passed on this candidate. All119 command logs were hash-checked; all commands used the fixed-inode per-command fcntl lock with NODE_OPTIONS=--max-old-space-size=512 --test-reporter=tap and unchanged product argv. Independent integration-delta review passed;157 audited new files are byte-identical, including production,39-group model,raw data and historical reports. Only three proved P0-72 metadata pins and the formal baseline change in the new manifest/source checker; P0-72 throughP0-67 are recursively proved, including the already approved inherited P0-72 single strict model pin correction. No new model exception. All1583 files/index remained unchanged across full and supplemental validation; afterward only5 result documents were changed for separate review. Capstone5.0.7 historical reports were hash-checked, not re-decoded. The161 audited additions include guide108; existing formal guide107 is preserved
- Still open: event9 presentation/reaction, event16/18, canonical capture/surrender/captive policy, force extinction, recursive ruler ownership, positive refunds/resources, other cancellation, S2 effects/full vtable tail, fallback reset scheduling, unrepresented memory/platform/concurrency, global RNG and clean-stock/Vanilla/console/runtime certification

### Completed bounded implementation: native live position

- P0-72 expands00489610 into saved-location base/troop/fallback storage resolution, then0047A950's separate packed DWORD read, signed16 coordinates, bounds and source-local live map/base-table lookup; all18 inherited entries remain, with new position-pointer/position/movement-origin direct entries. Old APIs/frames/traces are frozen
- Troop position uses leader/deputy validity rather than officer membership. Base+1E and troop+3C pointer identity stays separate from coordinates; missing reached rows reject.004A6340's valid-actor/base-location fast path still skips base validity, position and map reads
- New frame explicitly requires troop X/Y and mutable fallbackPosition06EE794C. No default or implicit migration exists. Unknown virtual chains require mutable full-frame/RNG observations; opaque pointer reads need separate observations. S1 bounded0073BE10 store/RET evidence and S2 complete ID0 function do not prove initializer scheduling
- Guide: `docs/rules/107-native-live-position.md`; latest-main114-command set passed after targeted recovery: the first frozen run passed112/114. npm check first failed because the local dependency copy dereferenced its tsc symlink; restoring both original symlinks passed TypeScript/85 Node tests. Model test32 first rejected its historical predecessor-source-checker SHA; an authorized single strict metadata-pin correction was independently reviewed, with all31 behavioral groups byte-identical. The corrected32 model groups,21+17/12/13 source groups,both whole-IDB/all1263 raw intervals and17 historical reviewer probes passed. Unaffected command evidence is reused only with an explicit dependency proof. Initial and corrected1422-file/index freezes were verified separately; this is not one unchanged tree or a fresh single all-green run. Every command used the same per-command fcntl lock and npm/node inherited NODE_OPTIONS=--max-old-space-size=512 --test-reporter=tap, with argv unchanged. All121 command logs, including the three retained failed attempts, were hash-checked. Capstone5.0.7 historical reports were hash-checked, not re-decoded. The74 audited additions plus1 formal guide give1422 files; only5 result documents were updated afterward for separate review
- Still open: fallback reset scheduling, custom vtables/full S2 tail/virtual+68 caller/business, canonical ruler/capture, surrender/captive policy, force extinction, recursive-return ruler ownership, positive refunds/resources, other cancellation bodies, presentation internals, event9 troop reaction, S2 effects/observers, unrepresented memory/platform/concurrency, global RNG and runtime/clean-stock/Vanilla certification

### Completed bounded implementation: native troop membership

- P0-71 replaces the reached004891C0 membership observation with native live-location lookup, canonical troop validity and leader/two-deputy membership in a new explicit troop-slot frame; all17 inherited entries remain and the new troop-member entry makes18. Old APIs/frames/traces are frozen
- Native troop validity derives the leader predicate from live raw person17C/status, then checks each signed deputy<1100. All negative deputy sentinels pass; deputy person rows are not read. A matching leader cannot bypass an invalid deputy, and this helper adds no actor-validity gate
- Unknown troop vtables retain exact read-only queries bound to full live frame/source/stack; missing reached troop or leader rows reject atomically. No location-only shortcut, guessed member list or implicit callback identity is introduced
- Guide: `docs/rules/106-native-troop-membership.md`; fresh latest-main112/112 commands passed: TypeScript,85 Node tests,109 Python checker commands and2 demos. Every command used the shared fcntl lock; npm/node inherited NODE_OPTIONS=--max-old-space-size=512 --test-reporter=tap, with product argv unchanged. The17 new plus12/13 inherited source groups,31 model groups,both whole-IDB/all1257 selected raw intervals and8 historical reviewer probe groups passed. Independent integration-delta review found no blocker; all1347 files/index stayed unchanged across validation and all112 log hashes were checked. Only5 result documents were updated afterward for separate review. Historical extraction has51 focused intervals/1951 selected bytes,21 new unique boundaries/365 newly recovered machine-code bytes and598 instructions; Capstone5.0.7 reports were hash-checked, not re-decoded
- Still open: non-base position/fallback06EE794C, custom vtables and S2 vtable-tail extent/virtual+68 caller/business, canonical ruler/capture, surrender/captive policy, force extinction, recursive-return ruler ownership, positive refunds/resources, other cancellation bodies, presentation internals, event9 troop reaction, S2 effects/observers, unrepresented memory/platform, global RNG and runtime/clean-stock/Vanilla certification

### Completed bounded implementation: native zero-refund tail distance

- P0-70 replaces only the reached005B8400→0049E4D0 distance observation with native source-local territory and current-to-home byte-table evaluation in the same live frame; all17 entries remain available under the new version and old APIs/traces are frozen
- Normalized live current and raw home compare before getter normalization. Current territory is saved before home territory; home is evaluated even if current failed. The helper scope closes before savedDistance is kept in the parent tail, surviving later callbacks; the duration wrapper rechecks live validity and stores the saved low byte, including-1→255
- Source territory/distance tables stay distinct; both real matrices are symmetric. The asymmetric probe is explicitly synthetic. Missing reached slot/map data rejects; eager represented getter slots remain a conservative model-domain restriction
- Guide: `docs/rules/105-native-tail-distance.md`; fresh latest-main110/110 commands passed: TypeScript,85 Node tests,107 Python checker commands and2 demos, with the shared Node lock and NODE_OPTIONS=--max-old-space-size=512. The12 new plus13 inherited source groups,29 model groups,both whole-IDB/raw checks and8 historical reviewer probe groups passed. Independent integration-delta review found no blocker; all1285 files/index stayed unchanged across validation and all110 log hashes were checked. Only5 result documents were updated afterward for separate review. Zero new unique raw intervals or newly recovered machine-code bytes; inherited Capstone5.0.7 reports were hash-checked, not re-decoded
- Still open: canonical ruler/capture, surrender/captive policy, force extinction, recursive-return ruler ownership, positive refunds/resources, other cancellation bodies, presentation internals, troop membership/non-base positions, event9 troop reaction, S2 effects/observers, unrepresented memory/platform paths, global RNG and runtime/stock/Vanilla certification

### Completed bounded implementation: generic-facility entry and early return

- P0-69 expands004B40C0 entry validity, old-legion pointer save, generic building IDs87..16383, canonical requested-pointer conversion and same-frame004AD550; normal invalid entry returns0 and generic completion returns1 even after ownership early exits or callback invalidation
- Pointer construction/conversion adds no target-row or validity gate. Only the new relocation version removes its former conservative requested-row pre-read; earlier APIs remain frozen and actual field reads still require readable rows
- Canonical004B415D..004B4988 remains an exact full-frame/RNG effect-query or atomic rejection, preserving original arguments, saved old pointer and symbolic entry manager; normal observed EAX is integer0 or1
- Guide: `docs/rules/104-generic-facility.md`; 13 new plus13 inherited source groups,28 independent-model groups,both whole-IDB/raw-ID1 checks and9 historical reviewer probe groups passed. The latest-main108-command set passed after retry: the original run passed107/108; only npm run demo:lifecycle exited137, then passed under the same shared Node lock with NODE_OPTIONS=--max-old-space-size=512. The cause remains unconfirmed. This is not a fresh single all-green run; all1230 files/index stayed unchanged across attempts and independent integration-delta review passed
- Still open: full canonical ruler/capture, surrender/captive policy, force extinction, recursive-return ruler ownership, remaining cancellation/positive refunds, presentation/tail-distance observations, troop membership/non-base positions, event9 troop reaction, S2 effects/observers, unrepresented memory/platform paths, stock/Vanilla and global RNG

### Completed bounded implementation: live zero-refund cancellation handlers 9/10/12/22

- P0-68 executes four source-local handler gates/control in the shared relocation/cancellation/event frame; existing23/24 remain native, with one observation order and one revision
- 9/10 only gate signed arg0 range0..16383 and preserve the discarded actor-force validity read; 12 gates0..1099 and constructs its fixed-array target pointer without requiring a target row; 22 requires a valid target force and saves actor force/color before notification
- The four presentation segments remain exact full-frame/RNG observations or atomic rejection; 9/10/12 late color reads stay inside them. The zero-refund tail reads the live actor after presentation and successful handlers return1 even if callbacks invalidate it
- Guide: `docs/rules/103-live-zero-refund.md`; 13 source groups, 28 independent-model groups and both whole-IDB/raw-ID1 checks passed. Fresh latest-main106-command regression and independent integration-delta review passed; the first lifecycle subprocess failure is retained in the validation record, with its cause unconfirmed
- Still open: other cancellation handlers, positive refunds/resources, presentation internals, tail-distance observations, S2 effects/observers, ruler/capture, troop membership/non-base positions, event9 troop reaction, force extinction, stock/Vanilla and global RNG

### Completed bounded implementation: officer relocation and fixed movement

- P0-67 expands004A8270 coordinator, allocated004A57B0/captured005B9B40 cancellation and fixed004A7990(-1,0) in the shared P0-66 live frame; old APIs/traces unchanged
- Exact status2-only demotion/governor nesting, saved destination/old home, live ruler/legion/home reads, same-home no-cancel reset, away mission37 overwrite and two direct acted callbacks
- Movement preserves origin/distance across callbacks, writes duration low byte without an extra validity gate, and refreshes current/home governors in native order
- Guide: `docs/rules/102-officer-relocation.md`; 19 source groups, 32 model groups, latest-main104-command regression and independent integration review passed
- Still open: whole004B40C0 ruler capture/transfer, wider cancellation bodies, real troop membership, non-base position query, event9 troop reaction, force extinction, other events, stock/Vanilla and global RNG

### Completed bounded implementation: base ownership and event9/10

- P0-66 expands004AD550 in the shared empty-legion merge frame: native ownership, S1/S2 durability maximum and signed16 clamp, city A4 bit0/1/4 dword resets, exact event selection
- Executes event9/10 copied-list dispatch and source predicates, including mission0/38 home comparison and mission21 typed-context pointer matching; old APIs/traces unchanged
- Newly reached non23/24 cancellation handlers and event9 troop-reaction004BA1D0 remain exact mutable full-frame/RNG observations or atomic rejection; no implicit identity callback
- Guide: `docs/rules/101-base-ownership-events.md`; 20 source tests, 23 model tests, full102-command regression and independent review passed
- Still open: those handler/troop-reaction internals, full004A8270 relocation, force extinction, ruler/capture, other events, stock/Vanilla and global RNG

### Completed bounded implementation: empty-legion dispatch and merge

- P0-65: native primary/nonprimary dispatch, both merge directions, copied roster loops, live base/relocation calls and exact raw scalar reset in one recursive frame
- Preserves the primary fallback's discarded lookup/global-ID2..8 behavior; no invented same-force/same-pointer/valid-destination gate
- Nearest city uses source-separated geometry and RNG; S2 clock-shared-page reads are required per-call observations, singleton consumes no RNG state
- Full base transfer004AD550 and relocation004A8270 remain mutable observations; force extinction remains atomic defer; previous APIs/traces unchanged
- Guide: `docs/rules/100-empty-legion-redistribution.md`; run both empty-legion checkers
- Final 100-command regression and independent review pass; canonical42-city/87-base validity aliases are strict in this version; next force extinction, full base/relocation and ruler/capture, other events, general sort flags/vtables, stock and global RNG

### Completed bounded implementation: native route and target-force

- P0-64: executes mission route dispatch/arg0/arg1/dynamic target-ruler home and optional territory outputs in the existing recursive live frame
- Target force executes raw facility ownership, territorial city and canonical subtype/legion paths; S1/S2 geography bytes remain separate
- Force ruler and legion force validity aliases are strict; real external hooks retain full mutable observations/RNG, and all older APIs/traces stay unchanged
- Guide: `docs/rules/99-return-route-target-force.md`; run both return-route-target-force checkers
- Final 98-command regression and independent review pass; P0-65 separately adds empty-corps dispatch/merge/reset; force extinction, full base/relocation, ruler/capture, other events, general sort flags/vtables and stock/global RNG stay open

### Completed bounded implementation: native roster/role sort and capacity

- P0-63: a new version executes roster field0 virtual-key paths, occurrence-aware quicksort, leader quicksort and governor merge in the shared recursive frame
- Native comparator order, duplicate pointer/entry distinctions, both allocation filters, clear/reappend and live reads replace whole-sort observations; equality is not assumed stable
- Source-separated title/office/technique capacities execute directly; S2 query377/278 remain exact per-call mutable-frame/RNG boundaries with saved-local continuation
- Canonical title/office validity is source-proven constant true; person raw17C/status derived validity and all older APIs/traces remain unchanged
- Guide: `docs/rules/98-native-roster-sort.md`; run both native-roster-sort checkers
- P0-64 separately closes route/target-force internals; next empty-corps/force extinction, ruler/base/capture integration, other event IDs and general sort flags/vtables; stock/Vanilla/global RNG remain open

### Completed bounded implementation: recursive return/list/role/event composition

- P0-62: expanded canonical frame, direct native return/home+legion roster/normal nonempty role stages and recursive event8/14, one revision commit
- Person allocation/validity is derived from explicit raw17C/status; native promotions refresh both before snapshots and later event gates
- Every event owns copied nodes/visits and saved actor/event context; native saved IDs survive callbacks while later reads use the current frame
- Remove-first/append and count<2 sort execute; nontrivial native sorts, transitive route/target-force and external callbacks require exact stage-bound mutable observations
- Empty force/corps, ruler ownership and engine recursion/resource guards defer atomically; guards are engineering limits, not original termination rules
- Guide: `docs/rules/97-recursive-officer-return.md`; run both recursive-officer-return checkers
- P0-63 separately closes fixed-domain multi-node sorts/capacity and P0-64 closes route/target-force; general key/flags, empty-corps/force extinction, ruler/base/capture integration and other event IDs remain open, alongside stock/Vanilla/global RNG

### Completed bounded implementation: atomic event8/14 and handler/tail composition

- P0-61: one shared canonical live frame and one atomic commit across004BBAA0→004A8110→dispatcher→real handler/tail primitives→004BA1D0→fresh post-event observer
- Preserves copied node order/duplicates, live executing/mission/subject reads and captured dispatcher mission; no old project/trace concatenation
- Versioned adapters share live reads; source/stage/callStack binds native saved event/current/target/raw44/home/distance independently of callback mutations
- Presentation, S2 effect-query, nonnull observers and full004BF6F0 require mutable observations or atomic reject; no implicit noninterference
- Guide: `docs/rules/96-mission-event-composition.md`; run both mission-event-composition checkers
- Next: integrate full return/list/roles with native event recursion in a new version; force/empty-corps/stock/Vanilla remain open

### Completed bounded implementation: notification and zero-refund return tails

- P0-60: separate canonical005B81D0 gate and handler23/24→005B8400(actor,0) APIs; old event/listener APIs unchanged
- Exact raw-legion/force-player0..7/legion-number1, saved current/target/raw force+44, and live return reads
- Mission/reset→acted-bit→manager-dirty→mutable observer→live active-list validity/append→duration ordering; duplicate nodes preserved
- S2 query267 is a result+mutable-frame/RNG boundary in004A5600 only; direct away-branch acted writer does not use it
- Presentation, nonnull observer and full return require explicit stage observations or atomic reject; no implicit noninterference
- Guide: `docs/rules/95-mission-notification-tail.md`; run both mission-notification-tail checkers
- Next: versioned return/role/event composition plus post-event observer; force/empty-corps/stock/Vanilla remain open

### Completed bounded implementation: event8/14 mission listeners

- P0-59: separate004A8110→005B9D30 API; copied active-node order/duplicates and live executing/mission reads
- All44 registry slots and predicate/handler pairs recovered; onlymission23/event8 andmission24/event14 may invoke handlers
- Exact subject type/validity/ID/rawkind and independently rechecked actor/current-building/target-CITY-or-building gates
- Handler return0 still dispatcher1; successful tails require source/event/stage/saved-pointer/full-frame observations or atomic rejection, never implicit noninterference
- Observed tails may mutate mission/active list/executing/data/RNG; old APIs and trace contracts remain intact
- Guide: `docs/rules/94-mission-event-listeners.md`; run both mission-event-listener checkers
- P0-60 separately closes notification gates and known active-list/acted/return-tail writes with explicit mutable presentation/observer/full-return boundaries; versioned composition and post-event observer remain next

### Completed bounded implementation: stable legion/governor roles

- P0-58: separate004BE2A0 stable nonempty branch and004BCA30 refresh=0 scalar APIs
- Force allocated/status-mask predicates remain distinct from valid corps/person candidates; leader and governor ranking are different, with explicit uint16 capacity inputs
- Existing home-roster order, last status<=1 shortcut, transient same-leader changes, all canonical-base passes and event8-before-write/event14-after-clear are preserved
- Capacity/mission observations and listeners have stage snapshots and explicit noninterference/record/reject; no advisor mutation is invented
- Extinction, empty-corps redistribution, refresh!=0 and unsafe mixed-validity sort domains defer atomically; old APIs/traces remain intact
- Guide: `docs/rules/93-legion-role-reconciliation.md`; run both legion-role checkers
- P0-59 separately recovers event8/14 dispatch/predicates/handler gates; successful tails remain explicit mutable observations or rejection, and full return/force/empty corps/stock remain open

### Completed bounded implementation: officer return scalar/call order

- P0-57: separate004BF6F0 API preserves home→actual location→raw legion→bit9 and old/new roster call stages
- Numeric same-force gate differs from force-object validity; real troop membership is a required observation, and generic targets map location to-1
- Invalid requested legion still reaches old-roster removal; -1 preserves bit9, same-home/same-legion still call remove/add/sort
- Ruler ownership/capture branch explicitly defers atomically; full old/new legion and old-home governor reconciliation remain record/reject boundaries
- Source-bound getter/slot observations, full-field snapshots, preflight, command idempotency, local RNG and replay preserve all earlier APIs
- Guide: `docs/rules/92-officer-return-finalizer.md`; run both officer return checkers
- Stable nonempty004BE2A0 and refresh=0 governor scalar coordination now have a separate P0-58 API; complete callback/force/capture composition, clean stock and Vanilla remain open

### Completed bounded implementation: mission37 lifecycle

- P0-56: separate complete/advance API closes positive delayed refund → mission/five-args reset → duration0
- One supplied active-list member applies live valid/mission/acted and stop gates, source-specific six-neighbor distance ordering, one-hop or exact-base arrival
- Arrival has handler1/dispatcher0, optional full-return boundary, then direct acted0 and duration0; no S2 cancellation query267 hook
- Invalid next city only clears mission/args; safe canonical-home/geography/resource restrictions are explicit model limits, not source gates
- Source-local RNG zero-call trace, atomic observation preflight, stage snapshots, record/reject and full replay preserve earlier APIs
- Guide: `docs/rules/91-return-mission-lifecycle.md`; run both return mission checkers
- Full `004BF6F0`, whole linked-list/scheduler, base destruction, event/force/capture composition and clean stock/Vanilla remain open

### Completed bounded implementation: capability-training cancellation

- P0-55: missions41/42/43 share actor → args[1] building0..16383 → args[0] capability-training0..97 ordered validity gates
- No actual-location validity gate: troop location and home=-1 correctly take the normalized same-home branch
- Six new S1/S2 vtable+0x18 slots identify conditional005DA320 notification at actor.home, explicitly left unexecuted
- Independent API/trace, required-observation preflight, ordered zero-refund scalar writes, callback noninterference/record/reject and full replay preserve all earlier APIs
- Guide: `docs/rules/90-special-mission-cancellation.md`; run both special mission cancellation checkers
- All dedicated cancel families now have separate bounded projections; P0-56 adds mission37 completion/one-hop within its explicit domain, while base destruction and full return/event/force/capture composition remain open

### Completed bounded implementation: facility mission cancellation

- P0-54: missions0/38 have exact current-type0 gates, mission0 first-three group collection before target lookup, and invalid-target return1 without resetting people
- Ordered zero-refund returns precede mission0 type30 treasure42 owner/city/state tail and bounded type3..63 facility destruction
- Full raw0x38 building storage preserves unknown bytes and exact write widths; city counters wrap modulo256, with separate S1/S2 upgraded-type construction gates
- Complete allocated-person home-reference selection includes source-specific excluded ID ranges; force/list/attachment/spatial/AI callbacks remain explicit record/reject
- Independent API/trace, observation preflight, base-target defer/reject, replay and boundary/fuzz tests preserve prior modules
- Guide: `docs/rules/89-facility-mission-cancellation.md`; run both facility mission cancellation checkers
- P0-55/56 separately project handlers41..43 and bounded mission37 completion; base destruction and full return/event/force/capture composition remain open

### Completed bounded implementation: grouped mission cancellation

- P0-53: missions2/5 now execute source-local gates, complete sparse ID-ordered first-three group collection and ordered per-person zero-refund return/reset
- Mission2 restores the selected signed city byte with clamp[-1,30]; invalid city skips only that write
- Mission5 resets actor-force research ID then duration byte before returning group members; S1 research0..35 and S2 extended0..63 getter/hook are separate
- Independent API preserves v1/v2 traces; explicit callback noninterference/record/reject policy, field-stage snapshots, atomic errors and full replay
- Guide: `docs/rules/88-group-mission-cancellation.md`; run `check_group_mission_cancellation_profile.py`
- P0-54/56 separately project facility handlers0/38 and bounded mission37 completion; base destruction and full return/event/force composition remain open

### Completed bounded implementation: dedicated zero-refund cancellation

- P0-52: missions9/10/12/22/23/24 now execute their source-local ordered gates and zero-refund return/reset projection
- Target9/10/12 numeric-range gates do not invent target-validity requirements; mission24 permits buildings through16383, while mission23 checks a separate city-subtype object
- Independent v2 preserves v1 traces, S1/S2 acted differences, explicit unknown-effect policies, atomic validation and full replay
- Guide: `docs/rules/87-mission-cancellation-zero-refund.md`; run `check_mission_cancellation_v2_profile.py`
- P0-53/54 separately project group/facility/research handlers0/2/5/38; P0-55 separately projects handlers41..43; full return/callback effects remain open

### Completed bounded implementation: personnel detachment and cancellation

- P0-51: source-bound wandering selector, numeric-affiliation gate, ordered distance-one city pool and preserved early RNG consumption
- Previously deferred invalid-former-force captive release and last-city escape now have a separate bounded projection
- Actual location normalizes to territorial city; former advisor/governor/legion leader scalar clearing and event2/8/5/21/4 order
- Direct mission reset occurs before set37, so detachment does not dispatch old-mission refunds
- Mission-cancel registry recovered for 44 slots; explicit no-op and task15..21 refund/return projection with separate S1/S2 caps and S2 acted hook
- Guide: `docs/rules/86-personnel-detachment-source-profile.md`; run both `check_personnel_detachment_profile.py` and `check_mission_cancellation_profile.py`
- Callbacks/other task handlers/full force extinction and composition remain explicit record/reject boundaries; stock and Vanilla are not proven

### Completed bounded implementation: captive release and relocation

- P0-50: pre-capture old-prisoner roster pass, own-affiliation shortcut and bounded return-former-force writes
- Source 004B0F50 destination priority, nearest territorial-city table/ties, singleton-zero-RNG, and 004B1950 last-city gate
- 004A7990 prepares mission duration and returns origin; base escape does not teleport actual location
- Absent home-roster collector and stable transformed-identity dispatcher ordering; event4 snapshot before forbidden tail
- 126 text byte ranges, 63 S1/S2 comparisons (58 identical / 5 different); 34 regression tests
- Guide: `docs/rules/85-capture-relocation-source-profile.md`; `python scripts/check_capture_relocation_profile.py`
- P0-50 v1 keeps its original defer/reject trace contract; P0-51 separately adds bounded wandering/cancel projections. Full callbacks/force extinction/composition remain open

### Completed bounded implementation: capture personnel projection

- P0-49: S1 city specialty query and 150000/100000 troop-cap adapter; S2 separately reads its city+0x3C field
- Full sparse base-person collection in person-ID order, other-city gate, treasure-type0/skill32 precedence and binary32 probability arithmetic
- Positive-p RNG consumption (including p=100), no RNG for nonpositive p, exact input-state LCG and replay
- Six disposition routes mapped; explicitly configurable hold/observed-code/reject policy and three known held-captive field writes
- 142 text byte ranges, 71 S1/S2 comparisons (61 identical / 10 different); 30 tests and 77,824 arithmetic cases
- Guide: `docs/rules/84-capture-personnel-source-profile.md`; `python scripts/check_capture_personnel_profile.py`
- P0-49 starts after prior prisoners' release; P0-50 adds a separate bounded prelude/migration model, while AI choices/callbacks and full composition remain open

### Completed bounded implementation: capture transaction projection

- P0-48: three direct caller cause/mode and directed relationship gate; full ordered world-facility qualification instead of prequalified IDs
- Neutral finalizer wipes retained resources; ordinary ownership clamps against new-owner durability max before the late half-max floor
- Ordinary entry weighted morale uses full incoming troops before caps; ordered duplicate cargo slots and overflow are traced
- All surviving domestic owners refresh from territorial city; completed type30 and candidate overflow remain outside quota
- Explicit PK reconstruction / separate Vanilla assumption, named replaceable fallback policies, atomic projected state, replay and invalid-input tests
- Source corpus has 61 byte-verified ranges and 24 S1/S2 comparisons (17 identical / 7 different); both sources are MOD-associated
- Guide: `docs/rules/83-capture-transaction-source-profile.md`; `python scripts/check_capture_transaction_profile.py`
- This is a standalone reference transaction, not a battle command integrated into the training sandbox; stock evidence and unmodelled domain effects remain open

### Completed bounded implementation: PK training lifecycle v2

- Train资格、行动/训练标记重置、可替换旬phase plan、累计WAR XP与派生能力成长已接入
- `warXp`累计0..3000；每100提供+1而不扣经验；能力1..100，满能力仍可积累XP
- 默认满气力拒绝；时间可持续推进，不凭空增加刷XP或气力衰减规则
- 十年360旬测试与demo验证seed、全trace、save/load/replay；v1状态有显式迁移，旧trace不静默改写
- Guide: `docs/engine/pk-training-lifecycle.md`; run `npm run check`, `npm run demo:lifecycle`
- 训练gate、全局reset、野外气力tail-xref、累计XP/helper在固定S1 source恢复；第二MOD样本差异明确隔离
- source字节exact只属于其fingerprint；stock PC-PK1.1等价、完整scheduler/AP时序、全局RNG及跨版本仍是证据债
- Vanilla与完整游戏未实现；此实现不关闭P0-46 capture/stock/finalizer缺口

Main audit is complete:

- A1–A5
- B1–B9
- C1–C11
- D1–D10
- E1–E20

Total: 55 main audit points.

P0 exactness cleanup has currently reached:

- P0-65 audit complete: native empty-legion dispatch/merge/reset, stricter source-derived canonical validity and S2 shared-page entropy; deep base/relocation effects remain bound observations
- P0-64 audit complete: native route/target-force on its original versioned frame; P0-65 adds stricter canonical validity, without retroactively certifying older inconsistent validity-cache inputs

- P0-63 audit complete: native roster/role algorithms and source-separated capacity with explicit mutable S2 hooks; complete native comparator schedule and post-sort allocation filtering

- P0-62 audit complete: live return/list/stable-role/event recursion, independently scoped native locals, explicit mutable whole-sort boundaries and atomic engine guards
- P0-61 audit complete: atomic event8/14 wrapper/handler/tail composition on a single mutable frame

- P0-60 audit complete: canonical notification gates, saved-pointer presentation boundaries, active-list/acted/cache/observer order and source-specific zero-refund tails

- P0-59 audit complete: event8/14 registration, live dispatch, native predicate/gate semantics and explicit stage-bound mutable-tail observation contract

- P0-58 audit complete: stable nonempty legion and governor scalar roles, distinct rankings, exact transient/status/event ordering and explicit unsafe-path deferral
- P0-57 audit complete: officer-return scalar fields, exact roster/callback order, real troop and numeric affiliation gates, atomic ruler defer
- P0-56 audit complete: mission37 completion, single active member advance, refund order, live eligibility and source-separated geometry

- P0-55 audit complete: capability-training cancellation gates, 98-record getter, home notification and sentinel return boundary
- P0-54 audit complete: facility cancellation, exact raw reset, source-separated city counter table and treasure42 tail
- P0-53 audit complete: grouped cancellation, signed city-counter mapping and source-separated force research reset
- P0-52 audit complete: six dedicated zero-refund handler gates and bounded return/reset projection
- P0-51 audit complete: source-bound wandering, detachment role/event order and bounded mission cancellation resources
- P0-50 audit complete: source-bound release, destination/migration and stable ordering with tested partial projection
- P0-49 audit complete: source-bound capacity, personnel partition and explicit partial projection
- P0-48 audit complete: capture caller/collector/scalar finalizer and tested transaction projection
- P0-47 audit complete: source-bound training lifecycle and tested compatibility implementation
- P0-46 audit complete: source-bound capture caller/selector recovered
- Stock PC-PK1.1 equivalence, full personnel/force/callback finalizers and cross-version validation remain open

Current source of truth:

- `docs/rules/STATUS.md`
- `docs/rules/13-open-exactness.md`
- `docs/rules/16-unresolved-rules-fallbacks.md`

---

## 2. Immediate next items

### P0-46 completed audit: source-bound capture selector

Current record: `docs/rules/81-capture-selector-source-profile.md` and
`docs/sources/capture-selector-source-profile.json`.

- Recovered `004B2CA0` containing body, three direct callers, city-only
  domestic branch, ordered candidate construction, count, RNG and destruction
- `004B329B` is an interior resource block, not an independent selector
- Source IDB records an input under `血色5.0公测`; opcode-exact claims are
  restricted to its fingerprint. Stock PC-PK1.1 remains unverified
- Reference planner and replay checks exist in `scripts/capture_selector_profile.py`
  and `scripts/check_capture_selector_profile.py`; they accept prequalified
  ordered candidates and do not implement the full capture transaction
- PK reuse is `compatibility-reconstruction`; Vanilla reuse is a separate
  `compatibility-assumption`. PS2/Wii are separate open targets

### P0-48 current capture transaction result

Current source audit: `docs/rules/83-capture-transaction-source-profile.md` and
`docs/sources/capture-transaction-source-profile.json`.

- `scripts/capture_transaction_profile.py` now collects world candidates and applies a bounded scalar transaction; the P0-46 selector remains a reused subroutine
- `004B40C0/004B49B0`, ownership setters, neutral reset, ordinary `004BF1F0` resource projection and `004BCA30` role are recovered within S1
- Cause mode is not a durability/troops enum; trap relationship arg4 and capture source arg3 remain distinct
- Source-local normal/neutral durability and ordinary entry integer rounding no longer lack helper bodies
- P0-49 now recovers ordinary personnel partition and disposition routing; full destruction counters/references, person relocation/tasks, force adjustments/extinction, governor ranking and event/AI callbacks still require implementation/evidence

### Immediate next research

- Obtain an independently verified clean PC-PK1.1 build/hash and compare the
  recovered bytes, without treating a MOD-associated input path as stock proof
- P0-51/52/53/54/55 now recover wandering/role order, registry/task15..21 refunds, six zero-refund handlers9/10/12/22/23/24, group/city/research handlers2/5, bounded facility/treasure handlers0/38 and capability-training handlers41..43; P0-56 adds bounded mission37 completion/one-hop and P0-57 separate return-home scalar/list-order projection; P0-58 adds separate stable nonempty `004BE2A0` and refresh=0 governor scalar coordination; P0-59 adds event8/14 registration/dispatch/predicates/handler gates; P0-60 closes canonical notification and active-list/acted/return-tail writes with mutable presentation/observer/full-return boundaries; P0-61 now composes the event8/14 wrapper/dispatcher/known tail/post-event observer in one live-frame transaction; P0-62 now executes versioned return/list/stable-role/native recursive events; P0-63 closes fixed-domain multi-node roster/role sorting and source-separated capacity with mutable S2 hooks; P0-64 now closes source-local route/target-force in the recursive frame; next recover general sort-key/vtable internals and continue base destruction, full `004BF6F0` return-home role/callback effects, other `004A8110→005B9D30` event IDs, full force extinction and `004B03D0` AI disposition callees
- Complete remaining base destruction/callback effects and broader ruler/corps/transport entry paths; S1 city troop-cap query is now resolved and S2 remains separate
- Validate source RNG initialization/global consumption and capture savegame cases
- Keep Vanilla patch-specific candidate/selector behavior separately open

### P0-47 source-bound training lifecycle audit

See `docs/rules/82-training-lifecycle-source-profile.md` and
`docs/sources/training-lifecycle-source-profile.json`.

- Source gate/parameter/officer helpers recovered; full morale and zero troops reject
- Raw cumulative experience cap3000, derived `floor(XP/100)`, cap1..100, shared research XP field
- Actual reset uses global loops and noncontiguous direct-clear tails, not a guessed setter(0) caller
- Both inspected IDBs are MOD-associated; S2 changes XP/stat caps and must not supply anonymous stock constants
- Open: independent clean stock hash/bytes, complete mission predicates and attribute composition, AP/global scheduler placement and cross-version regression

### Baseline validation repair

The three literal `\n` separators in `scripts/check_techniques.py` were changed
into actual newlines. All existing assertions remain, including the unresolved
research-merit status. This syntax-only repair does not resolve rule uncertainty.
The previous 64/65 result is historical; see current validation in STATUS.

### After P0-46

Continue from the latest unresolved exactness gaps in `STATUS.md`.
Do not invent a fixed P0 endpoint.

Likely remaining families include:

- clean-build capture equivalence, personnel/force/event finalizer effects, and cross-version domestic-facility selection;
- hiring inner probability body;
- diplomacy per-build constants;
- siege durability inner helper bodies;
- fire lifetime setter / RNG / reignition;
- natural death / marked-for-death exact RNG;
- reward / salary-shortfall / rumor inner formulas;
- captive forced-release comparator/finalizer details;
- auto-office scheduler / remaining classifier and qualification bodies;
- sortie / transport commit and return finalizers;
- deputy blood/spouse/sworn remaining PC opcodes;
- training clean-stock reset equivalence / complete top scheduler and AP placement;
- starvation field-troop handler and formula;
- full supply / transport finalizer; S1 ordinary building-entry rounding now recovered, stock and troop-to-troop rounding remain open;
- technique research full calculator / difficulty matrix;
- technique-research completion merit writer / participant distribution;
- food-raid helper body / RNG / clamps;
- response-fire caller / recursion termination;
- Vanilla / PS2 / Wii / patch-version equivalence for all above.

---

## 3. Reverse-engineering / disassembly repositories we depend on

### 3.1 sjn4048/311MemoryResearch

Repository:

`https://github.com/sjn4048/311MemoryResearch`

Role:

Primary public PK-oriented reverse-engineering corpus used throughout this project.
Each executable/IDB artifact still needs its own provenance check; P0-46 found
a MOD-directory input path in the archived IDB, so its new byte claims are
source-profile exact, not verified stock PC-PK1.1.

High-value material includes:

- `内存资料/地址资料.txt`
- `内存资料/修改记录by sjn4048.txt`
- `内存资料/整理/*.txt`
- `内存资料/AI专题/*.txt`
- `内存资料/函数[部队攻击].txt`
- `内存资料/函数[破坏内政设施和破城获取资源].txt`
- `内存资料/函数[火陷阱炸伤炸死].txt`

Used for:

- battle / siege caller bodies;
- food raid;
- fire damage;
- training;
- recruitment;
- monthly / seasonal schedulers;
- AI sortie logic;
- capture-resource retention;
- loyalty / captive handling;
- technique addresses;
- many exact constants and opcodes.

Evidence level:

- strongest when a full instruction listing is present;
- address-only entries remain address-level evidence;
- comments are not automatically treated as exact unless verified by instructions.

---

### 3.2 sean2077/311SireCustomizedPackageDev

Repository:

`https://github.com/sean2077/311SireCustomizedPackageDev`

Role:

SIRE reverse-documentation / structure / function-address reference.

High-value material includes:

- `material/内存地址汇总.md`
- `material/结构体汇总.md`
- `material/数据汇总.md`

Used for:

- function names and signatures;
- object / struct layouts;
- offsets for force / troop / facility / scenario;
- setter / getter identification;
- skill / technique IDs;
- cross-checking address semantics;
- reverse-history comments from SIRE development.

Important rule:

SIRE configurable / community-patched behavior must not be backfilled as original SAN11 behavior unless separately proven.

Modern SIRE / mod formulas must be tagged as:

`SIRE-modern-mod-system`

when they are not original executable behavior.

---

### 3.3 fudanglp/311resource

Repository:

`https://github.com/fudanglp/311resource`

Role:

IDA-derived resource dump and function-boundary source.

High-value material includes:

- `extractor/ida/data/python_idb/san11pk_dump.exe_functions.csv`
- `extractor/ida/data/python_idb/san11pk_dump.exe_struct_members.csv`
- `extractor/ida/data/resource_hints/*.csv`
- `extractor/ida/data/resource_hints/*.json`

Used for:

- exact function start addresses;
- next-function boundaries;
- recovered symbol names;
- struct member names / offsets;
- locating containing functions for known interior addresses.

Typical use:

`address X`
→ find previous function start
→ find next function start
→ establish exact containing-function boundary.

Important rule:

Function size / location alone must never be used to invent body semantics.

---

## 4. Secondary implementation / reconstruction references

### 4.1 tankyc/sango_infinity

Repository:

`https://github.com/tankyc/sango_infinity`

Role:

Modern open-source SAN11-like reconstruction used only as an engineering comparison / compatibility fallback source.

Used for examples such as:

- fire lifetime weighted choices;
- fire spread extension architecture;
- food-raid 10..20 compatibility RNG;
- resource transaction organization;
- some reconstructed battle formulas.

Evidence label:

`compatibility-reconstruction`

or

`engineering-reference`

Never:

`reverse-engineered-original`

unless independently verified against original executable evidence.

---

## 5. Supporting external source classes

These are not code repositories, but are regularly used for cross-checking:

### Official / manual

- KOEI / Steam SAN11 and PK manuals
- official patch / version changelogs

Use for:

- user-visible rules;
- version boundaries;
- Vanilla vs PK feature additions;
- patch chronology.

### Japanese Wiki

`https://w.atwiki.jp/sangokushi11/`

Use for:

- controlled empirical tests;
- battle / technique behavior;
- support attack / response-fire interactions;
- capture / facility-retention observations;
- difficulty-specific tests.

Evidence labels:

- `empirical-high`
- `documented-community`

Never silently upgrade to opcode-exact.

### Gamersky / Ali213 / old Chinese guides

Used for:

- early-version documentation;
- 2006-era Vanilla behavior;
- numeric examples;
- version-history cross-checks.

Important:

Old guide values may conflict with later Wiki values; preserve the conflict rather than forcing one table.

---

## 6. Evidence policy

Every rule should be classified as one of:

- `reverse-engineered / opcode-exact`
- `reverse-engineered / address-level`
- `empirical-high`
- `documented-guide`
- `compatibility-reconstruction`
- `provisional-engine-rule`
- `open`

Do not invent formulas.

Do not infer a caller from neighboring addresses.

Do not infer semantics from function size.

Do not infer original behavior from SIRE/community fixes.

Do not infer uniform RNG just because the player cannot choose the outcome.

Do not merge platform/version behavior without evidence.

---

## 7. Working procedure for each new theme / P0 item

Before editing, verify the latest GitHub `main` commit and create a fresh theme branch from it. Read `TODO.md`, `STATUS.md`, the rule index, `13-open-exactness.md` and `16-unresolved-rules-fallbacks.md`. Do not use another unmerged PR as the baseline. Keep implementation slices separate from unresolved research closure.

1. Read live `docs/rules/STATUS.md`.
2. Read the existing related rule/evidence files.
3. Search:
   - `311MemoryResearch`
   - `311SireCustomizedPackageDev`
   - `311resource`
4. Use function-table boundaries when only an interior address is known.
5. Separate:
   - caller;
   - helper;
   - finalizer;
   - UI/draft;
   - runtime mutation;
   - return/reset path.
6. Preserve unresolved behavior explicitly.
7. Add:
   - one Markdown audit file;
   - one structured JSON evidence file;
   - one validation script.
8. Update:
   - `docs/rules/STATUS.md`
   - `docs/rules/README.md`
   - the new theme PR body, including test results, evidence boundaries and any parallel-PR index conflicts.
9. Open a new draft PR for this theme. PR #2 is merged history, not the current work target.
10. The user authorized self-merging subsequent project PRs on 2026-10-04; merge only after verification and independent review. Do not infer broader deployment authorization.

---

## 8. Current principle

The goal is not to make every rule look complete.

The goal is to make every rule honest about what is:

- exact;
- strongly observed;
- reconstructed;
- still unknown.

A smaller exact core is preferable to a larger invented ruleset.


## 2026-10-11 生产耗时独立caller投影

已新增本地候选 `calculateProductionTimeProjection` / `production-time-observations-v1`（说明：docs/rules/production-time.md）。仅固定listing与逐调用观测驱动的整数/trace；全无效返回9、type9跳扫描、重复validity/设施解析独立、允许负数和零、技能向零减半。真实helpers/ABI/对象可变读取/命令/库存writer/完成调度/实际日数/stock仍open；未覆盖P0-78及依赖。新树验收和发布状态外部收据单列，不复用PR #55历史通过。

