# 规则审计当前状态

更新：2026-10-05 UTC。

## 最新完成：P0-75 event9 saved-force原生reset

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
