# 有限季初治安、巡察与市场财政规则

本页是独立 profile `bounded-seasonal-patrol-market-v1` 的具体规则合同。在普通巡察、一次市场施工、月初金收入与完整普通官薪的同一账本上，新增固定太守、固定整备政令和有界季初治安下降。

旧 `bounded-patrol-market-income-payroll-v1` 的无季降规则、API、schema、错误顺序、收据和 save 保持不变；也不改变更早的 `bounded-market-income-payroll-v1`。旧 save 不能隐式升级。本页中“保持不变”指新 profile 明确沿用既有业务政策，不表示跨 profile 数据可互换。

这是 source-kernel 与具名 provisional engine policy 的有限组合，不是完整原作财政或 native scheduler。本页只给静态合同和明确标记的手算例；没有执行测试、build、compile、typecheck、runtime、validator、产品场景或尺寸测量，也没有新增 source/native/stock 等价验证。

## 1. 固定世界与明确排除

- 单城、单势力、单军团，全窗所属关系固定且一致。
- 完整固定 1..8 名普通官员，各自同城同势力；官职 ID 不重复，来自完整 80 行目录 0..79。无内部 office80、君主、俘虏、临时加入或缺员名单。不可用、已行动或正在施工者仍全额付薪。
- 统率、魅力、武力、智力、政治均为调用者明确提供的固定已解析整数 0..100；XP 不自动改变这些属性。太守使用名单里的同一个魅力值，不另设可矛盾的魅力输入。
- 初始 0 或 1 座已完成 Lv1 市场，并且恰有一块空 lot；最终最多两座市场。30 个槽明确映射所有提供的 lot，各恰一次，其余为 null。
- 最多一次市场开工；完成 job 永久保留，不能重开。无取消、拆除、维修、吸收、升级或外部施工任务。
- `advanceLimit` 为 1..12；日期仅 1、11、21 日；完整推进窗口须落在 1..9999 年和安全整数 turn 域内。
- 完整固定外部单位和显式敌对势力各 0..16 项。不同势力不自动敌对；独立固定 `pressureActive` 不能由开工敌情、单位距离或“城外有敌”推导。
- 无粮、收入技能、灾害、募兵、生产、商人、欠薪惩罚、原生人员进出或死亡、所有权变化、capture、P078 及其依赖。

`completeResidentRoster=true` 和 `completeFieldUnits=true` 是调用者对封闭输入的声明，不证明外部真实存档没有遗漏。固定 governor 也不构成原生太守选择、人员任务或职位轮换恢复。

完整基础域、市场和官职表、普通巡察核、construction 核及 source 绑定的既有规则见[前一 profile 的具体规则](bounded-patrol-market-income-payroll.md)与[工程合同及目录附录](../engine/bounded-patrol-market-income-payroll.md)。本页新增规则替代的只有季初治安、相关 RNG、推进顺序和对应记录；费用、成长、工资保留金、锁和一次施工限制没有放宽。

## 2. 新输入：固定太守、整备政令与有限 tape

新 scenario 顶层增加：

- `governorOfficerId`：人物 ID 或 null。非 null 必须解析到上述完整固定驻城名单的一员，不能静默退化成无太守；全窗不更换。该人不可用、已行动或参与施工不取消其固定太守身份。
- `hasAdministrativeReform`：严格 boolean，全窗不变。这里绑定 PK 整备政令的已供应观察，不模拟技巧研究、取得或失效。
- `rng`：恰含 `draws` 数组；每项恰为 `{ bound, value }`，`bound` 只能是 100 或 3，`value` 为 0..bound−1 的整数。整个数组长 0..4，顺序保留。

调用者不能提供原生 seed、生成器、开放回调、任意 bound 或初始消费 cursor。新建时 cursor 为 0。当前状态保存 `rng.cursor` 与累计 `rng.drawsConsumed`；每项完整消费记录为 `{ index, bound, value, purpose }`，purpose 仅 `administrative-reform` 或 `seasonal-loss`。

每个 tape 元素都必须合法，包括最终未使用的后缀。允许合法未用后缀，不要求 tape 长度恰等于本窗消费量，也不为了用完 tape 额外抽取。这个 tape 是确定性重放输入，不是原生 RNG、随机分布采样或种子恢复。

## 3. 季初门与全窗口 tape 预检查

只在一次成功 `AdvanceSharedMarketTurn` 进入 1、4、7、10 月的 1 日时触发季降。其他月份的 1 日照常月结，但不抽季降随机值；11、21 日也不抽。

创建时已有日期视为已经结算：即使初始日期为 1 月 1 日，也没有初始收入、工资、季降或 RNG 补发。只考察接下来实际进入的日期；年末推进进入次年 1 月 1 日属于季初。

创建时先遍历完整的 1..12 次未来日期入口，以固定改革条件和 tape 内实际数值检查所有将需要的抽取：

1. 非季初不要求任何值。
2. 季初且有改革时，下一项必须是 bound100；该值小于 50 则此季结束，不要求 bound3。
3. 无改革，或改革值为 50..99 时，下一项必须是 bound3。
4. 对后续季初继续按同一规则检查，不重置位置。

12 次推进最多进入两个季初，因此全窗最多消费四项。预检查使用临时位置，不提前改变当前 cursor 或产生实际结算收据；真正消费仍发生在各次成功推进中。检查的是所有剩余日期，不只当前季初、当前施工的到期日或第一次收入。

若后面某季缺值或 bound 不匹配，情景在接纳时就被拒绝，不能先开工再因季降 tape 耗尽而停在完工之前。这个保证来自有限日期窗、固定改革和对条件分支的完整预检查；不能套用于旧独立财政服务，也不能外推为任何原生任务的终结保证。有效后缀预留只是输入，不构成提前抽取。

## 4. 季初损失的精确公式和分支

复用[已有财政季初治安内部 phase](../engine/finance-seasonal-security-phases.md)，不另写一份近似公式。令 `before` 为本次季降入口的真实当前治安：

1. 解析太守魅力 `charm`；无太守时 `charm=0`。
2. 仅当 `hasAdministrativeReform=true`，抽取一次 bound100 的 `adminRoll`。
3. 若 `adminRoll<50`，本季状态为 `administrative-reform-skip`：不再抽 loss，不写治安，requestedLoss=actualLoss=0，before=after。
4. 没有改革或改革未跳过时，恰抽一次 bound3 的 `lossRoll`，值为 0、1、2。
5. `requestedLoss=min(5, floor(max(1,90−charm)/10)+lossRoll)`。
6. `actualLoss=min(before,requestedLoss)`，`after=before−actualLoss`。

`max(1,90−charm)` 在除以 10 和向下取整之前，不能变成“最终至少损失 1”。魅力 90..100 时基础量为 0，lossRoll=0 可请求 0；无太守或魅力 0 时三个 lossRoll 的请求量都被上限截为 5。不能用政治、统率、人物序号或工资代替魅力。

治安已经为 0 也必须完成应有抽取。没有改革的季初消费一项；改革成功跳过消费一项；改革未跳过消费两项，并且先 bound100、后 bound3。不得预抽 loss、在低治安时略过、改变条件阈值或把跳过所省的值当作已消费。

三类完整治安收据：

- `not-due`：保留 governorId 或 null，charm/adminRoll/lossRoll 为 null，损失为 0，before=after，无 write。
- `administrative-reform-skip`：保留 governorId、解析魅力和 adminRoll，lossRoll 为 null，损失为 0，before=after，无 write。
- `applied`：保留 governorId、解析魅力、adminRoll 或 null、lossRoll、请求/实际损失和 before/after；即使实际损失为 0，仍有完整 write。

applied write 的 resource 为 security，reason 为 seasonal-security，cap 为 100；requested 为 requestedLoss，accepted 为 actualLoss，discarded 为 requestedLoss−actualLoss，actualDelta 为实际负变化或正零。零损失不能产生 `-0`。writer 身份固定沿用财政 security policy，不由调用者自由替换。

## 5. 唯一旬推进：完成、收入、季降、工资

`AdvanceSharedMarketTurn` 保持一个原子事务，顺序为：

1. 检查剩余窗口，日期、turn 和 advancedCount 各推进一次。
2. AP 请求恢复 20、cap255，记录实际恢复与丢弃量。
3. 活动市场 job 推进一次；到期时完成，写完成成长和技术点，释放人物 reservation 并写完成旬 actedTurn。
4. 若进入 1 日，使用此时已完成设施和季降前真实 current security 计算本月金收入，按金容量先入同一账本。
5. 执行上述季初治安 phase；不在季初则返回 not-due 且不消费 RNG。
6. 若进入 1 日，从同一金账精确扣完整普通名单工资。
7. 完整审计、不变量和包装预算全部通过后才一次提交。

因此在 4 月 1 日之类的月季重合边界，本月收入读取损失前治安；季降后的治安留在真实 current ledger，供后续巡察及下个月收入使用。不能先降治安再回算本次收入，也不能把季降只放进展示收据而不写 current。

到 1 日恰好完工的市场计入当期收入。这个“完成先于收入”仍是本组合根的具名 engine 调度政策；来源支持财政内部收入早于季降、季降早于工资的相对调用顺序，不证明市场施工与财政相互调度的完整原生顺序。

非 1 日不调用月收入核、不写收入或工资；完整工资名单与 sum、not-due 财政结果仍保留。季降不扣金/AP、不产生 XP/功绩、不设置巡察机会、不解除施工锁，也不另推进一次时钟。

## 6. 巡察与施工仍使用同一个真实状态

普通巡察沿用[前一 profile 第 2 节](bounded-patrol-market-income-payroll.md#2-普通巡察旧核公式成本和成长)：每次选 1..3 个不同人物，按选择顺序检查存在、归属、在城、available、无 reservation、未本旬行动；城市本旬也未用过巡察。仅非终端可新发巡察。

令 L 为所选固定统率之和，B=floor(L/28)+2，H 为受压时 floor(B/2)、否则 B；gain=min(H,100−currentSecurity)。调用既有巡察核，先除 28 再加 2，然后才受压减半；严格超过 100 才走 clip。成功收费 100 金、20AP，各选人请求统率 XP+2、功绩+50，分别在 1e9 饱和；写城市机会与选人本旬 actedTurn。满治安或成长满 cap 仍收费、成长结算并占机会，不消费 seasonal tape。

市场沿用[前一 profile 第 4 节](bounded-patrol-market-income-payroll.md#4-一次市场开发和人物锁)的同一 construction 核、开工检查和永久单 job：

- 只在开工检查显式敌对单位与城心 hex distance≤2；距离为 max(abs(dq),abs(dr),abs(dq+dr))。它不阻止后续推进，也不决定巡察 pressure。
- 开工选 1..3 个合资格人物，收费 200 金、20AP；必须保证剩余窗口和完整历史槽足够完成，并保留工资保留金。设施 type31、Lv1，required work500、initial work125。
- 固定政治总和 S、最大值 Pmax；rate=max(Pmax+floor(S/2),41)，duration=ceil(375/rate)。本域 rate41..250、duration2..10 旬；开工当天不推进 work。
- 每次推进 work=min(500,work+rate)，remainingTurns 减 1；到期仍校验真实设施、双向锁、日期、turn 和 work500。
- 完工请求 TP+30、cap10000，各参建者政治 XP+3、功绩+100、cap1e9；保留此前巡察所得和其他真实成长。变为 complete/effectiveLevel1，释放锁，永久保留 job。
- 参建者完成旬仍写 actedTurn=新 turn，故该旬虽解锁也不能巡察，下一旬才重新合资格。施工中只能由另一个未锁且合资格的人巡察；先巡察者同旬不能开工。

太守身份本身不占人物行动机会，也不豁免上述门。固定太守被锁在施工中时，季初仍使用其固定魅力；不能因 busy 临时换太守。季降改变的是下一次巡察的入口治安，巡察改变的是后续季降和收入读取的同一治安。

## 7. 月收入、完整工资和保留金不变

月收入继续逐位投影 30 槽：空设施为 null；施工市场 constructionWord0 且不出现 adjacentMint；完成市场 constructionWord1、adjacentMint=false。没有铸币厂加成。固定 normal/difficultyWord1，baseMoneyWord0..65535，市场 yield100；player/AI 可供但没有收入技能。

令 C 为当期完成市场数，raw=baseMoneyWord+100×C，E=max(50,本次季降前的 currentSecurity)，M=floor(raw×E/100)。实际仍调用既有 `calculateCityMoneyIncomeProjection`，保留完整 input/result/Evidence；这个简式只是本域解释，不替换核或扩大旧 API 域。

当期收入先写：accepted=min(M,goldCapacity−G)，discarded=M−accepted，G 加 accepted；随后季降，再从 G 精确扣全薪 W。不能先把 M−W 净额入账。即使收入为 0 或满仓全部丢弃，也保留收入 write。

W 是按 ID 排序的完整固定名单逐人查完整官职表 monthlySalary 后求和，每人 10..60、总额 10..480；不接收外部自填总工资，不因 unavailable/acted/reservation 减薪，也不发个人现金钱包。目录来源与限制见[前一 profile 第 6 节](bounded-patrol-market-income-payroll.md#6-全薪全部来源和证据边界)。

令 n=advanceLimit−advancedCount，当前日 1/11/21 的 offset 为 d=0/1/2，则剩余月初数 H=floor((d+n)/3)，工资保留金 R=H×W：

- 创建要求 G≥R。
- 开工要求 G≥200 且 G−200≥R。
- 巡察要求 G≥100 且 G−100≥R。
- R 只派生，不是另一个钱包、预扣薪或库存；不能借未来收入。

每 prefix 仍保持 G≥H×W。非月推进不改变 G/H；月初即使 accepted=0，扣薪后也满足 G'=G+accepted−W≥(H−1)W。季降不改变这个证明，因为它不扣金，且不能把收入变成负数。因此全窗 tape 预检查与工资/历史尾槽保留分别解决 RNG、现金和历史容量的施工完成阻塞，不互相替代。

## 8. 原子性、收据、重复与完整重放

三个命令仍为 `StartMarketDevelopment`、`Patrol`、`AdvanceSharedMarketTurn`。accepted 最多 25，advance 最多 12，trace attempts 最多 32，后者包括失败和重复。每个成功 prefix 继续保证 25−revision≥remainingAdvances≥active.remainingTurns。

入口安全 detach 后从 genesis 完整重放历史，再按 envelope、dedup、revision、历史容量、分支 shape、终端门和业务顺序处理。完整内容相同的已有 ID 返回原 receipt 与最新 state/current，先于 stale revision、满 history 和终端门；同 ID 内容不同则冲突。失败 ID 不登记。季降由 advance 内部驱动，不能用新 ID 单独多降一次。

每个 common receipt 保留 `rngDraws`、`rngBefore`、`rngAfter`、该命令 `drawsConsumed`。巡察、开工和非季初推进没有新增消费。tick detail 中 `seasonalSecurity` 保留完整 `{ security, write, rngBefore, rngAfter, drawsConsumed }`；当前 rng 保存累计消费。展示数量不能替代逐项 index/bound/value/purpose 的完整记录。

收入、季降、工资、完成成长、锁、机会标记和 RNG cursor 都属于同一候选状态。任何晚期业务、来源、不变量或预算失败，时钟/AP/施工/设施/成长/金/治安/cursor/消费记录全部不提交；不能先提交随机消费再回滚其他字段。preview 使用同一 transition，但不提交；重复命令不会再次抽取或扣薪。

load、inspect、save、preview 均完整重算，比较完整政策、目录、genesis、当前状态、所有 receipt 和 tape 消费记录，不只信 digest、余额或 cursor。篡改治安、太守关系、tape、消费顺序、来源、费用或成长都不能靠替换摘要绕过。输出 detached 且递归冻结；不修改或冻结调用者输入。

继续限制每包 16,777,216 canonical UTF8 bytes、500,000 occurrence nodes、depth48、array4096、object keys128；拒绝 getter/setter、proxy、循环、稀疏数组、未知字段、非安全整数、负零、重复 JSON key 与非普通对象。没有安全 proxy 识别能力时 fail-closed。前一 profile 的精确 node/byte 小计不直接宣称适用于新增了季降和 RNG 的 DTO；新组合的完整包装、重复包装、每 prefix 与施工完成尾仍须遵循自身工程合同，不能凭旧小计或运行测量替代。

## 9. 手算例：当期收入不受当期季降回扣

以下均是纸面规则推导，未执行情景、测试或验证器；省略的基础字段须满足完整合同。

初始 3 月 21 日、limit4，治安 60，baseMoneyWord100，已有一座完成市场；唯一人物 office79、月薪10、统率100、魅力80，并为固定太守。G500，AP 足够，无改革，tape 为一项 bound3/value2，金容量足够。

1. 推进至 4 月 1 日：先按治安60取收入 floor(200×60/100)=120，金变620。
2. 季降请求 min(5,floor(max(1,90−80)/10)+2)=3，治安变57，消费一项。
3. 再扣工资10，金为610。不得按57把刚结算的收入改成114。
4. 此旬巡察：统率100得 floor(100/28)+2=5，治安变62，金减100为510；相应行动和成长按常规写入。
5. 后续至4月11日、21日无月收入或季降；推进至5月1日，收入 floor(200×62/100)=124，再扣工资10，金为624、治安仍62。

不做第4步巡察，则5月收入114、最终金714。巡察增加后续收入10，但花费100；“巡察提高市场收入”不等于该有限窗口内巡察回本。初始 R=2×10=20，4月1日结算后 R=10，例中费用满足保留金。

## 10. 手算例：条件消费、零治安与满仓

以下同样只是未运行的手算说明。

- 改革阈值：魅力80时，bound100/value49 直接跳过，无 loss 抽取；value50 不跳过，必须随后读取 bound3。随后若 value2，则请求损失3。49/50 的边界不能互换。
- 两次季初预检查：从6月21日推进10次会进入7月1日与10月1日。有改革，tape 依次为 (100,49)、(100,50)、(3,2)，消费路径为7月跳过、10月损失3。若只给 (100,49)、(3,2)，第二季所需 bound100 不匹配，情景应在接纳时拒绝，而不是到10月才阻塞。
- 零治安：治安0、魅力80、无改革、lossRoll2 时仍消费 bound3，请求3、实际0、治安保持0，仍有 applied write，discarded3、actualDelta 为正零。
- 高魅力零请求：魅力90、无改革、lossRoll0，基础 floor(max(1,0)/10)=0，请求0；仍消费一项并记录 applied write。无太守则魅力0，任何合法 lossRoll 都请求5，再按真实治安截实际值。
- 满仓：G=capacity1000，治安60，base100且一座完成市场，工资10。季初收入请求120、接受0、丢弃120；若季降3则治安57；工资后金为990。不能把净收入110先并账而得到1000。
- 初始季初：创建在1月1日且下一次进入1月11日，不补发1月收入、工资或季降，不消费 tape。之后真正进入的季初才需要相应值。

## 11. PK、Vanilla 与证据边界

基础规则参考[经济规则第 10.8–10.10 节](02-economy.md#108-季初自然下降)和[既有财政 source manifest](../sources/city-finance-lifecycle.json)。季初自然下降引用原函数标签 `0058D6D0`；本组合没有新取得或新验证该 helper body。整备政令是 PK 规则；不能把本 profile 的固定改革开关及其分支写成 Vanilla 已验证行为。`hasAdministrativeReform=false` 只关闭这一分支，不使整个 profile 自动成为 Vanilla 等价实现。

月收公开 listing 为 [sjn4048/311MemoryResearch《每月钱粮兵装收支》固定提交](https://github.com/sjn4048/311MemoryResearch/blob/66e167e40c3440929ec016f3872aefc3486434c1/%E5%86%85%E5%AD%98%E8%B5%84%E6%96%99/%E6%95%B4%E7%90%86/Func-%E6%94%B6%E6%94%AF03-%E6%AF%8F%E6%9C%88%E9%92%B1%E7%B2%AE%E5%85%B5%E8%A3%85%E6%94%B6%E6%94%AF.txt)，归属原仓库作者，许可见 [Apache-2.0 LICENSE](https://github.com/sjn4048/311MemoryResearch/blob/66e167e40c3440929ec016f3872aefc3486434c1/LICENSE)。既有 manifest 保留 money calls 00590536/00590558/00590576、seasonal-security call 00590652、salary range 005909A3..005909D3；它证明的是来源 listing 内的相对调用次序，不是完整 construction scheduler。

项目目标为 PC-PK1.1，来源声明 PK；精确原版号、stock、Vanilla、console、native helper、ABI 和真实执行可达性仍不因此获证。本组合没有执行原 EXE，没有新增 capture，也没有恢复原生 RNG、太守选择器、writer 或建设与财政全调度。

须分开理解三层：

1. 既有 source-kernel：巡察增益、市场建设 rate、城市金收入继续使用既有核及其原有证据和输入域。
2. 既有财政规则复用：季降公式、改革条件抽取和 writer 复用已有私有 phase；其 `provisional-engine-rule` 身份不因复用而升级。
3. 新组合政策：固定太守/改革、供应 tape、全窗预检查、当前治安共享、完成先收入、全事务回滚、工资/历史尾槽保留和有限封闭世界。它们提供可解释的确定性软件合同，不宣称 source recovery。

新增这个组合不降低任何既有 source/native/stock 证据债或待恢复计数；不将 43 主题、45 快照或 E/X 项的覆盖范围改写成完整原作。P078、capture、原生人员/死亡/归属、粮和灾害仍明确在范围外。
