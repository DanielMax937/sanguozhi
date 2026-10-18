# 相邻遗迹／庙发现独立事件规则 v1

静态交付更新：2026-10-18 UTC；来源研究观察：2026-10-17 UTC。

profile：`standalone-adjacent-site-discovery-v1`。这是O13-B的有限独立事件服务：消费预供到达事实，自行过滤相邻点、检查部队门槛、抽取发现，并把发现、部队魅力XP、月份素质／适性或所选特技实际写入自己的状态。它不接受caller给出的成功结果或最终奖励，不是城市Search的第四种随机奖品。

见[六个API](../engine/adjacent-site-discovery-lifecycle.md)、[完整政策](../../data/catalogs/adjacent-site-discovery-policy-v1.json)、[来源](../sources/adjacent-site-discovery-lifecycle.json)、[JSON结构schema](../sources/adjacent-site-discovery-lifecycle.schema.json)与[未运行示例](../../data/scenarios/adjacent-site-discovery-example-v1.json)。[O13-A单城Search](city-search-lifecycle.md)保留独立场景、账本与随机流。

本批仅静态撰写代码、规则与数据；产品、示例、测试、typecheck、编译、build、checker、诊断和schema校验均未执行。以下公式、接口与场景说明是静态合同，不是执行验证结果，也不沿用其他模块的验证结果。

## 1. 基线与来源身份分层

本次新增的仓库基线为PR85：main `7cf050fdf57cd40641bf5f139b2c34c548aae820`、tree `c515fd47bdec5a1f8b9502da58130dad91372a09`。这是基线版本身份，不是本新增内容的运行收据。

来源必须按三层分别解释：

1. **攻略观察 `guide-observation`**：[Wiki968遗迹・庙发现](https://w.atwiki.jp/sangokushi11/pages/968.html)记载相邻、主将功绩10000、部队魅力80、月份奖励、每名发现部队成员魅力XP10，以及第四座庙起最高级技能可出现。[Wiki79经验](https://w.atwiki.jp/sangokushi11/pages/79.html)另有发现魅力XP10观察；[FAQ8](https://w.atwiki.jp/sangokushi11/pages/8.html)说明首趟可能未发现、可能需要再次经过。这些是公开攻略，不是原生函数、精确补丁或独立stock认证
2. **供应事实 `supplied-scenario-facts`**：固定势力／普通名单／编成、已放置site、普通地面集合、完整有限到达序列、初始发现来源及版本化guide技能目录。创建时校验其内部关系，不认证它们就是任何原剧本、原地图、原配置或原技能池
3. **新政策 `synthetic-replaceable-policy`**：轴坐标模型、排序／选择、独立LCG、50阈值、到达消费、pending冻结、最多3个offer、饱和writer、同技能重学、完整重建和预算。即使某项以攻略事实为方向，具体软件行为仍按完整冻结政策解释，不能借攻略来源升级成原writer恢复

公开页面的研究观察日期为2026-10-17；Wiki968所示页面更新时间为2013-02-02。没有页面raw hash、EXE hash、原函数范围或逐版本执行证据；本批只依据已记录的阅读事实静态撰写，没有重新抓取并认证整页。地理页只作为来源位置，未抽取全坐标。PC／PS2／CSPK的点数、门槛和最高技能可出现时点有差异，不能合并成一个原版默认。

O13-A使用的PR53／54／55三个公开listing核仍为各自的`source-listing-reconstruction`；B不调用它们，也不把其listing／Apache-2.0身份当作遗迹／庙原函数证据。

## 2. B1：固定输入域和真实到达事实

场景只有一个固定active force。普通武将名单至多256人；每人归属须等于该势力，merit及charmXp为0..1,000,000,000，五维talent原值分别为0..255，六适性等级为0..3，skillRef为null或场景guide目录中的ID。无人员迁移、捕获、死亡、换编或原生技能ID解释。

- 发现部队1..16支，每队1..3名固定成员；成员ID唯一，一名武将不能同时出现在两支部队。leaderId必须是本队成员，且所有成员属于固定同势力普通名单
- unit明确提供resolvedCharmU8、troops和初始位置。兵力为1..1,000,000，门槛只看resolvedCharmU8，不能以个人魅力、最高个人魅力或临时重新合成能力替代。XP或素质变化不自动改resolvedCharmU8
- 实际放置sites共0..64个，唯一ID、kind为ruin／temple、轴坐标q/r均为−1,000,000..1,000,000整数，site位置彼此唯一。初始discovered／resolved只能同为false或同为true；不接受没有合法历史的半完成初态
- 场景明确供应至多4096个普通可站立格，位置唯一；部队初始位置在其中，site格不在普通可站立集合中。此集合仅用于本事件模型的输入一致性，不是全图地形数据库
- 每个初始已发现site（含遗迹）必须有唯一sourceId的逐项来源记录；庙另按1..N连续序号记录，遗迹templeOrdinal为null，未发现site的initialSource为null。庙计数从这些记录派生。不能只给一个任意“已经发现N座”数值。初始记录不再发XP或奖励，也不编造新到达发现历史
- 不规定原版默认遗迹／庙数量或初始抽点。已放置site就是供应事实，不混用PC1/6、PS2 4/4或CSPK6/6来声称原剧本恢复

完整arrival序列至多360条，每项唯一arrivalId、unitId、from、to、date。日期year为1..9999、month为1..12、day仅1／11／21；全局按时间不倒退，且不早于场景起始日期。每部队每旬最多一条记录。from必须等于该队在前序到达后的观察位置，from≠to，from与to都在普通地面集合，且轴坐标六角距离恰为1。创建时检查整条序列，不能等处理到坏记录时才发现。

`ProcessNextArrival`只消费冻结序列的下一项，更新本服务观察位置、日期和cursor。调用者不能临时传新位置、下一个arrival ID、已合资格或已经成功等字段。到达事实不证明原生移动力、地形限制、行动点、粮耗或移动服务已结算；没有寻路、任意移动命令、实时追加第361条或自动延长序列。O01／O02与未来跨服务对接须另行证明。

ID长1..64，首字符为ASCII字母／数字，其余仅`[A-Za-z0-9_.:-]`；实体集合按ASCII码元升序，不用localeCompare。arrival顺序及初始庙序数是有语义的输入，不按ID重排。完整政策、技能目录和来源身份随genesis冻结；guideCatalog.sourceIdentity只记录supplied引用或synthetic-example，不认证该引用真实性。替换须使用新版本／profile及新genesis。

## 3. B2：内部相邻检查、门槛与发现抽样

轴坐标距离明确定义为：

```text
dq = site.q - arrival.to.q
dr = site.r - arrival.to.r
d = max(abs(dq), abs(dr), abs(dq + dr))
```

仅d=1符合，d=0同格不符合，d≥2不符合。执行部队leader.merit必须≥10000，unit.resolvedCharmU8必须≥80，troops必须≥1；不混入CS宽松门槛。服务自行过滤所有尚未发现且与to相邻的site，按site ID升序。

- 门槛失败或没有合格site：合法到达仍被消费，观察位置／日期／cursor照常前进；不抽RNG、不生成pending、不发奖励
- 有n个合格site：n=1直接选唯一项，不抽selector；n>1抽一次draw(n)。随后必抽一次draw(100)，结果r<50才发现
- 50是`adjacent-discovery-half-v1`的新设计常量，不是已恢复的原作50%概率；来源只支持不是每次经过都必定发现
- 抽样失败也消费该到达与实际selector／roll，不奖励。之后不同arrival再次靠近同未发现site可以重新尝试；同一arrival不能被换command ID重复消费或重roll

本profile使用独立LCG32状态：uint32 seed全域合法，包括0。每次先以精确整数算`state=(1664525*state+1013904223) mod 2^32`，令u为新state，`draw(n)=floor(u*n/2^32)`。输出0..n−1。非2幂整除界限可能有原像数相差1的离散偏差，不称严格无偏。无Math.random、时间seed、环境RNG、拒绝采样或预抽未用分支；算法和消费顺序都不是原作随机证据。

selector＋发现roll最多2次；庙offer另至多3次，因此单次到达最多5次随机状态转换。Resolve命令不抽数；B的seed／state与A及旧引擎均独立。

发现成功原子接受：site转为已发现，记录真实日期、部队、arrival及command身份；该发现部队每名成员魅力XP各请求+10；建立唯一pending。XP采用cap1e9饱和writer，`actual=min(requested,cap-before)`、`discarded=requested-actual`，保存before／requested／actual／discarded／after。非发现部队成员不获这份XP。

本事件账本不增减AP、金、TP或功绩；这些零是本服务范围选择，不证明原生移动／事件全成本为零。不发探索政治XP，也不复用A的Search费用或奖励。

## 4. B3：遗迹12个月完整奖励

发现时的月份冻结入pending；Resolve时不能换用新的月份或自传奖励字段。`ResolveRuin {siteId,targetId}`只允许选择固定同势力普通名单中的一人，目标可以不在发现部队。一次只提高下面对应的一项：

| 发现月份 | 增加的字段 | 请求 |
|---|---|---:|
| 1 | 骑兵适性 | 等级+1 |
| 2 | 统率素质 | 原值+1 |
| 3 | 弩兵适性 | 等级+1 |
| 4 | 武力素质 | 原值+1 |
| 5 | 兵器适性 | 等级+1 |
| 6 | 魅力素质 | 原值+1 |
| 7 | 水军适性 | 等级+1 |
| 8 | 智力素质 | 原值+1 |
| 9 | 枪兵适性 | 等级+1 |
| 10 | 政治素质 | 原值+1 |
| 11 | 戟兵适性 | 等级+1 |
| 12 | 魅力素质 | 原值+1 |

五维月份采用`ruin-raw-talent-aptitude-saturating-v1`：talent原值请求+1，软件cap255；这是素质字段变化，不是普通培养XP，不消耗、重置或增加普通培养的+30额度，resolved能力也不自动重算。255仅是软件边界，不认证原作最终显示cap。

适性编码C／B／A／S＝0／1／2／3，请求等级+1、cap3。它不是适性XP的150／200／250阈值结算，不修改适性XP。攻略支持提升适性，具体原native helper／writer仍未恢复。

cap已经挡满时仍消费奖励：requested1、actual0、discarded1。成功Resolve之后site.resolved=true、清除pending；再换任何command ID也不能重领。Resolve不推进日期、不再次发发现XP、没有额外费用或随机。

## 5. B4：庙目录、第三／第四座与技能替换

场景包含完整有限且版本化的guide技能目录，以及各自非空、互不重叠的standardPool与highestPool；总共至多256个唯一技能ID。所有技能ID须在`guide:`命名空间，完整目录至多256项；池是目录中明确列出的子集，目录可含未入池的已有技能。目录是供应的实验技能ID空间，不是native98映射或原生技能表，不认证其标准／最高级分组就是原作具体池。调用者不能给本次最终offer。

第k座庙按本profile实际已发现庙数＋1派生，包含有连续来源记录的初始已发现庙。不能用一个caller自填计数替代实际site／记录。每次发现时：

1. k≤3只用standardPool；k≥4用standardPool与highestPool并集
2. 候选按ASCII ID升序，最多提供3项，逐次无放回选择。当前剩余n>1用draw(n)，n=1直接选且不抽数；选中后从候选中移除
3. 不足3项就提供全部合法项，不生成空offer。即使池大小≤3，仍按上述逐次选择规则处理其有序offer，不能擅自省去n>1时的抽样
4. 第四座仅把最高级加入可选池，不保证本次一定抽到最高级；最高级首座即可出现的CSPK差异不在本profile
5. 把templeOrdinal及具体offer冻结入pending，不能刷新、preview后重抽或跳过未领取奖励刷庙序数

`ResolveTemple {siteId,targetId,skillId}`要求同势力普通名单中的目标，skillId必须属于冻结offer。实际将target.skillRef替换成所选ID，旧技能被覆盖。选择与原技能相同允许：记录relearned及实际技能无变化，同时消耗该庙奖励；这是公开的新政策，不以它证明原作同技能规则。

成功Resolve令site.resolved=true并清pending，不推进时间、不抽随机、不扣费、不发额外XP。发现时每个部队成员的+10魅力XP不在此重复发送。

## 6. B5：pending与有限完成

同一时刻最多一个pending；未Resolve时`ProcessNextArrival`拒绝，不消费下一到达、时间、RNG或任何资源。Resolve的siteId和类型必须与pending相符，不能越过pending处理另一site。没有“关闭窗口等于领取”、自动弃领、取消退款、旅行job或native mission／return。

全部供应到达消费完且无pending，才达到本有限场景完成；不是必须恰有360条，也不要求发现所有sites。有未发现site但无剩余到达也不会自动继续探索。初始或后来已发现site都不能再成为抽样候选，已解决奖励不能重领。

O13-B由此覆盖实际过滤→门槛→内部抽样→发现→冻结待选奖励→真实XP／素质／适性／技能变化，不把有限到达事实包装成全局移动系统。

## 7. 原子性、幂等与预览

API包括create／preview／execute／save／load／replay。envelope只有`{id,expectedRevision,command}`，三个command只有本页列出的参数，不含success、roll、最终offer、月份或delta。

完整状态先从genesis重建验证，再检查envelope。已接受ID若内容完全相同，早于陈旧revision检查返回原receipt，不再发奖励或消费arrival；同ID任一字段不同均拒绝。新命令的expectedRevision必须等于当前revision。每个新接受command恰好revision+1且增加一条完整历史；重复返回不增加历史。

所有差额在独立候选状态中准备，晚期预算或schema拒绝也不提交。rejected不增revision、不占ID、不改观察位置、cursor、日期、site、XP、技能、pending或RNG。合法无发现到达是已接受业务结果，不是拒绝。

preview计算相同receipt与投影snapshot，不修改传入state、不预留ID、不消费真实RNG；对同一快照重复预览一致，后续execute与其对应。持有pending的合法Resolve也遵守该规则，预览不能让offer刷新。

## 8. 完整保存重建与有界对象

保存包含完整规范genesis场景、初始snapshot、完整注册政策／来源身份／导入目录、按接受顺序的envelope及完整receipt，以及最终snapshot。load从genesis重新计算每一步候选、门槛、随机、月份、offer和奖励，比对每条receipt及最终全部状态，包括cursor、观察位置、庙序数、site发现／resolved、XP、素质／适性、skillRef、pending与RNG。

不能只相信最终snapshot或hash，不能部分resume，不能以null跳过尚未发现／未选择数据的强制存档对比。policy须与注册的完整定义一致，不只匹配名称／digest。给定genesis下不一致的篡改应被拒绝；这只是确定性自洽性，不是密码学真实性。若协调改写完整genesis和相容历史，那是另一份供应场景，不能声称检测任意伪造。

对象入口只支持非Proxy的plain／null-prototype own-data JSON DTO、密集数组和严格有限安全整数；支持域内拒绝额外字段、继承字段、自定义原型、getter／setter、symbol、稀疏数组、负零、NaN／Infinity、不安全整数及重复ID。反射可能触发Proxy traps，敌意Proxy与污染运行时不在保证域，不能称对任意JavaScript对象均无副作用。JSON字符串load另按有界解析入口处理，重复decoded key包括转义后同名也拒绝。

共同硬上限：4096条接受command；完整序列化UTF-8为16MiB；对象深度24。其余结构上限与详细DTO见API。预算适用于完整输入、状态、保存文本以及完整返回，不能只检查局部新receipt或删除旧历史以容纳新command。重复ID返回旧receipt时也须保有预算。完整重建与历史预算增长不是常数开销；这些硬上限是静态边界，不是实测延迟或效率保证。

## 9. E／X与原计数不变

**E保留**：遗迹／庙原候选全部坐标、初始放置抽样、原发现概率／RNG、原具体技能池和分组、原月份／素质／适性／技能writer及cap，独立stock／EXE／确切patch身份与PC／Vanilla／PS2／Wii／CSPK跨版本边界；原地图／剧本初始化和全局调度。新policy不清除这些原作证据债。

**X继续排除**：P078／P0-78及全部依赖、native ownership／人员势力迁移、capture、force灭亡、ruler transfer／继承、native return／mission及相连finalizers；Search后当场登用／舌战后原生交接、宝物native归属writer；旧rules-audit-a1-b3／PR2／money179恢复。无忠诚、工资、褒赏、人员任职或native技能写入耦合。

O13-A和B分别提供有限软件服务；普通城市8类事件分支仍归O14的有限执行器，跨服务余额／行动／时间／移动／事件一致性归O15。独立账本不等于整体游戏集成，不称全探索原作等价。

原43证据主题不减；45条历史快照不重新编号、不新增分母。O13对应ordinal16 Search AP子项（由A覆盖）及ordinal30探索子项；ordinal30外交仍属O08，ordinal24其他TP事件不由B关闭，ordinal37地图、40原剧本、41–43通用／史实／PS2 corpus证据继续保留。历史corpus的`executionEnabled=false`不改。

## 10. 静态检查设计，均未执行

应覆盖：d0／d1／d2；主将9999／10000、部队魅力79／80、兵1；禁止个人魅力替代部队魅力；失败到达照常消费及后续重访；空池不抽、唯一候选不抽selector；seed0与最大uint32、最多5draw；12月份逐项且6／12均魅力；素质255、适性S、XPcap全挡仍消费奖励；奖励目标可在部队外；初始已发现庙连续序数；第3／4庙池、最高级不保证、少于3项及无放回offer；同技能relearned；pending阻塞／保存／Resolve不重复XP；重复envelope／冲突／stale revision；完整genesis与receipt／RNG／pending／月份／offer／site篡改比对；序列完整性、严格DTO、重复decoded key和晚期预算原子性。

清单不是已经运行的测试、schema校验或验证收据；旧A、三旧核、训练与EndTurn的历史结果不验证B。
