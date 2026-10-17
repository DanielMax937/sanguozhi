# 独立单城商人即时买卖粮规则（O10-B）

2026-10-17。profile：`standalone-city-merchant-v1`。单城、固定所有者、有限旬历、明确外部商人与粮价/敌情快照，执行即时买粮或卖粮并写入独立金粮/AP/行动/政治经验账本。[API](../engine/city-merchant-lifecycle.md)、[固定来源与完整政策](../sources/city-merchant-lifecycle.json)、[场景形状](../sources/city-merchant-lifecycle.schema.json)、[未运行场景](../../data/scenarios/city-merchant-example-v1.json)。

这是O10的第二个有限子批，与[O10-A城市财政](city-finance-lifecycle.md)拥有不同状态、schema、API和保存协议，不共享余额或自动互调。仅补本支持域的静态代码与具体规则；没有运行测试、typecheck、编译、build、checker、诊断、产品入口或示例，旧测试没有增删修改。历史默认food全套失败仍保留；旧通过数不验证本树。

## 1. 独立场景与支持域

### 1.1 输入数据

- schemaVersion=1，profile为上述固定值
- date：year为1..9999，month为1..12，day只能1、11或21；turn为非负安全整数
- advanceLimit为1..360；创建时必须检查整个horizon的日期与turn都不越界，不接受最后几旬不可推进的半有效场景
- activeForceId、city.ownerForceId、corps.forceId必须一致；只有一个city和一个corps，owner及军团身份不变
- corps：唯一id、forceId、actionPoints为0..255
- city：id、kind固定city、ownerForceId、position、gold、goldCapacity、food、foodCapacity、merchantPresent、uiTradePrice、merchantUsedTurn
- 金粮及容量均为0..1,000,000,000整数，余额不得超过对应cap；容量来自独立场景政策，不宣称原生容量上限
- position为supplied轴坐标q/r，均为[-1,000,000,1,000,000]整数；不接受原地图byte或未经解释的native位置
- uiTradePrice只接受3、4、5、6、7。即使没有商人，价格仍须合法；merchantPresent与价格是不同状态
- merchantUsedTurn为null或0..当前turn的整数。已有本旬使用标记不会被创建或加载过程清除
- officers最多256项，每项id唯一，包含forceId、cityId、available、politics、politicsXp、actedTurn。政治一律为20..100整数，未执行者也不得带0..19、101..255或小数；政治经验0..1e9，行动标记null或0..当前turn
- 场景可列其他城/其他势力或unavailable武将，但他们不能被本城交易选为合格执行者。没有原生任务、所属迁移或部队成员推断
- hostileForceIds为最多256项唯一明确敌对势力ID，不得含本城owner；不同forceId不自动意味着敌对
- completeFieldUnits必须true；fieldUnits为最多4096项、ID唯一的完整当前在场快照，每项id、forceId、position均必填。空数组表示明确提供的空快照，字段缺失不等于没有敌军
- turnInputs恰好advanceLimit项，按顺序给每个下一旬的merchantPresent、uiTradePrice、完整fieldUnits。完整性声明覆盖初始与全部未来快照
- policies和catalog必须携带完整注册参数，而不是只有版本号或digest；初始化后固定

所有ID为1..64个ASCII字母/数字及`_.:-`，首字符限字母数字。所有primitive整数禁止负零、非有限数、越界与不安全整数。对象额外字段、getter、自定义原型、symbol和稀疏数组均拒绝。

### 1.2 不包含的机制

本版只有都市商人，不接受港、关或SIRE支城交易；不做跨城运输。Advance不运行收入、工资、兵粮消耗或其他O10-A账本。不会生成商人、粮价或敌军移动，不模拟原作概率。P078及其依赖、native capture/ownership/mission/return/finalizer、俘虏、欠薪、人事迁移、自动外交结算和MOD商才均排除。

## 2. 一次交易需要什么

买与卖都只选一名执行武将，按以下规则依次检查：

1. 完整输入和state先从genesis重建；处理同ID重试、revision和历史上限
2. command.cityId等于本城，kind=city，activeForce/owner/corps保持一致
3. merchantPresent=true，merchantUsedTurn不等于当前turn
4. 执行武将存在、同城同势力、available=true，actedTurn不等于当前turn，政治位于20..100
5. 完整supplied在场单位里不能有明确敌对势力的单位距城≤2
6. 军团AP至少20，请求粮量为1..1e9整数；按当前UI价格与政治计算准确有理金额
7. 资金、出货库存和目标容量须满足整笔；卖出结果若为0金也拒绝
8. 只在分离候选里同时写两种资源、扣20AP、写城市和武将行动标记、累加政治经验
9. revision+1、完整envelope/receipt一次加入历史；任何晚期错误或预算超限使整次失败

每座城每旬最多一次商人命令，买或卖共享这一次。更换武将或新commandId不能绕过城市标记。同一武将当旬已行动也不能交易。这是独立服务的行动标记，不读取nativeTask或跨服务预约。

商人命令即时结算，没有生产job或等待日数；固定金钱手续费为0。交易本身消耗20AP，买粮的derivedGoldCost是兑换金额，不是额外手续费。

## 3. 两格敌情与盟友

采用具名`supplied-axial-distance-v1`：令dq=单位q−城市q，dr=单位r−城市r，距离为：

`distance = max(abs(dq), abs(dr), abs(dq + dr))`

某单位的forceId在hostileForceIds里，并且distance≤2，整笔交易拒绝。距离0、1、2都阻止，3不阻止；这是几何距离，没有寻路、障碍或视野过滤。单位位置可以为负轴坐标。同一邻格的盟友、未列敌对的其他势力和己方不会因为forceId不同误挡。多个阻挡单位时失败给supplied数组中首个blockingUnitId，不会先扣AP。

规则来源支持“敌军两格内不能交易”；这里的完整supplied快照、轴坐标几何、显式敌对名单及固定关系是工程适配政策，不是已恢复原生地图/敌我helper。交易成功收据列全部单位ID、force、position、hostile、distance、blocks，用于重建所检查的输入。

## 4. UI相场、政治效果与锚点

### 4.1 价格单位

UI相场表示政治50基准下1金对应的粮数，范围3..7。价格越高，同样金钱买到的粮越多；卖出同样粮的金钱越少。`uiTradePrice`的单位固定`ui-food-per-gold`。原结构中的raw TradePrice byte与UI范围的尺度尚未闭合，不能把两者放进同一个字段或直接将raw byte用作本式分母。

经验连续关系为：

- 买到粮 = 支出金 × UI价格 × 政治效果b
- 卖得金 = 卖出粮 ÷ UI价格 × 政治效果b × 0.8

0.8仅用于卖方；不能买卖两侧都乘，不能漏掉卖侧因子，不能在扣除卖粮时再扣一次20%。本服务以明确粮量Q作为买卖请求，整数金结算由§5定义。

### 4.2 完整观测锚点

具名目录`merchant-politics-observed-linear-v1`把既有经验小数选择为兼容常数。下表“观测效果”仍是近似经验，不宣称native精确百分比；“选定A”则是本服务确定使用的整数。

| 政治p | 原经验观测效果 | 选定A，效果=A/1,000,000 |
|---:|---:|---:|
| 20 | 约93.024% | 930240 |
| 50 | 100% | 1000000 |
| 51 | 约100.2516% | 1002516 |
| 60 | 约102.565% | 1025650 |
| 70 | 约105.2642% | 1052642 |
| 80 | 约108.109% | 1081090 |
| 90 | 约111.1122% | 1111122 |
| 92 | 约111.7328% | 1117328 |
| 97 | 约113.3154% | 1133154 |
| 98 | 约113.6374% | 1136374 |
| 99 | 约113.9612% | 1139612 |
| 100 | 约114.2868% | 1142868 |

在锚点p直接使用N=A_p，D=1,000,000，b=N/D。若p处于相邻锚点l<h之间：

`N = A_l × (h − p) + A_h × (p − l)`

`D = 1,000,000 × (h − l)`

`b = N / D`

不先把b舍入成小数，更不取UI整数百分比。各锚点递增、相邻段斜率为正，所以20..100的每个整数政治都严格单调。政治97、98、99保留各自数值，不能统一当作113%。20以下和100以上拒绝，不夹顶、不外推、不套全域简单斜率。

所有整数乘除使用BigInt；收据固定保存未约分N/D。大整数导出为规范非负十进制字符串，无前导零、负零或科学计数；分母为正。锚点与插值的未约分形式是协议的一部分，不允许保存时随机约分。

## 5. 买卖金额、取整与容量

`merchant-ui-rational-rounding-v1`明确规定买卖都请求粮量Q，金钱结果为：

- 买粮成本：`goldCost = ceil(Q × D / (uiTradePrice × N))`
- 卖粮收入：`goldCredit = floor(Q × N × 4 / (uiTradePrice × D × 5))`

ceil按非负整数`(numerator + denominator − 1) / denominator`的整数商实现，floor直接整数商。中途不round或floor，不使用浮点Math.ceil。这是将经验连续式转成整数事务的新保守舍入政策，不是恢复了未知原生helper的证据。

收据保留exactGold的未约分分子/分母、rounding模式、divisionRemainder=分子%分母。roundingDifference记录买方多付的`(settled×D−N)/D`或卖方少得的`(N−settled×D)/D`，其中此处N/D指exactGold而非政治效果。每个非整数结果的差额小于1金；卖方另有4/5因子，两者不可混为一次粮损失。

采用`merchant-full-fill-cap-reject-v1`：

- 买：必须gold≥goldCost，且food+Q≤foodCapacity；恰好扣goldCost、加Q
- 卖：必须food≥Q，且gold+goldCredit≤goldCapacity；恰好扣Q、加goldCredit
- 请求Q不能为0，不能用空交易刷XP或占用行动
- `reject-zero-value-sale-v1`拒绝计算后为0金的卖出；不扣粮、不扣AP、不占用城市/武将行动，也不发XP
- 金额计算后先检查0..1e9支持域；所有最终资源都为安全整数且在cap内
- 不部分成交，不截断库存后仍按原请求收费，不静默丢弃满金库溢出；成功资源写入discarded恒为0

这与O10-A自动收入正向clip是刻意不同的具名writer政策。若将来允许partial fill，必须另设政策并反算实际收费，不能用min库存替代完整结算。

商人作为外部对手方不创建无限余额；receipt记互补goldDelta/foodDelta。例如城市买粮金减少、粮增加，merchantCounterparty金增加、粮减少。两资源之间是兑换，不能把金数和粮数相加称作同单位守恒。

### 5.1 高政治往返现象

同价连续关系的往返金系数为0.8×b²。政治92的b=1.117328在sqrt(1.25)下；政治93按上述插值为1.1204932，在其上。因此充分大额、同价、跨两个合法交易旬的往返可在93以上出现小额盈利。整数ceil/floor可能吞掉小额利润，并非每笔政治93都获利。不能为“修套利”添加未声明手续费，也不能绕过同城每旬一次进行同旬往返。

## 6. AP、行动与经验

成功一次交易同时：

- 军团AP恰减20
- 城市merchantUsedTurn写当前turn
- 执行武将actedTurn写当前turn
- 武将politicsXp请求+5，实际增量=min(5,1e9−原XP)，上限1e9；收据记录实际增量及被cap挡掉的部分
- politics保持原值；没有XP自动升级、经验阈值或能力成长计算
- 本profile不应用功绩、技巧点或忠诚账本变化，收据对应delta均为0；这不是原作无功绩奖励的结论

官方说明书提到执行商人会提高政治与功绩；本独立ledger尚未接入功绩账本，meritDelta=0只表示不应用该效果，不否定原作奖励。政治经验+5的具体数值来自Wiki观察，不是原交易数值函数直接恢复出的写入。`merchant-politics-xp5-no-growth-v1`的累积、饱和与不自动成长是服务政策。任何失败整体不发奖励、不过行动、不改AP。

## 7. 推进旬与外部情景

命令AdvanceMerchantTurn只推进一个旬。日期顺序1→11→21→次月1，12月21日后为下一年1月1日；9999年与safe turn边界在整个horizon初始化检查，推进时仍防越界。

第k次推进读取turnInputs[k]，将merchantPresent、uiTradePrice、完整fieldUnits一起替换为该新旬输入。没有targetDate或跳旬数量字段。输入表恰覆盖advanceLimit，耗尽后拒绝；不会把缺失单位列表默认为安全，也不会重复沿用旧相场。场景提供者明确声明输入是外部情景，不是本服务生成的原作商人概率、月度相场转移或敌军移动。

默认`merchant-service-ap-recovery20-v1`每推进恢复20AP，cap255；备选`merchant-service-ap-recovery0-v1`恢复0。两者完整参数已注册，必须初始化明确选定，期间不得改；固定+20不是原生AP公式。收据分别记requestedDelta与cap后的actualDelta。推进不发XP，不做交易，也不修改gold/food。

城市/武将旧marker不清空；新turn与旧值不相等，才恢复本服务的行动资格。没有ResetMerchant命令，不能在不推进日期/外部输入/AP政策的情况下重置同旬次数。新date/turn、inputIndex、全部新输入和AP恢复同一原子提交。

## 8. 原子事务、幂等和保存规则

每个命令envelope含id、expectedRevision、完整command。相同ID且完整envelope相同返回原receipt，哪怕当前revision已改变，不再扣款、扣AP、推进或奖励。相同ID改任何字段，包括expectedRevision，都是冲突。新ID必须匹配当前revision。preview与execute在同样重建和完整execute输出预算上计算，preview始终不提交。

保存包括完整primitive genesis scenario、初始snapshot、时间输入表、完整政策/lookup及digest、所有接受的envelope和receipt、最终snapshot。save自身先重建；load从genesis重新计算、逐条执行并复验每一步完整execute输出预算、比较全部receipt和最终状态，不信任调用者quote、cached effect、最终余额或digest。修改价格单位、政治、lookup小数、舍入、AP恢复、XP、容量、city/actor marker、fieldUnits等局部内容，即使重写摘要也不能绕过完整重算。完全自洽的新合法scenario不是认证攻击目标；本协议不是数字签名。

失败尝试可记在独立trace，但不能进入accepted history。trace的expectedOutcome是比较目标，不参与数值计算；失败不改变state，重复不重写账。对象key顺序可变化，数组顺序保留；JSON parser拒绝重复解码key。所有API返回分离且递归冻结结果。

预算固定64MiB canonical UTF-8、4,000,000节点、48深度、最大数组4096、每对象128键。每场景最多360推进，因此最多2×advanceLimit+1个接受事件：初始旬交易一次，每未来旬推进一次并交易一次，全局上界721；trace最多2163次尝试。各个数量最大值不保证能同时使用，总体budget仍可能先满。超过预算、历史上限、horizon或任何最后阶段错误均整次拒绝，不产生部分写入。运行时失败reason与API形状详见[API失败节](../engine/city-merchant-lifecycle.md#失败与预算)。

## 9. 静态场景与纸面推导（未运行）

[场景](../../data/scenarios/city-merchant-example-v1.json)以200年1月1日、turn0、gold1000、food1000、AP40、政治50/XP0开始；两种cap100000，初始商人在、UI价7，一个附近盟友不阻止。完整未来两旬依次为“商人在/价3/空单位”和“商人不在/价5/空单位”，默认AP+20。

以下只是手算预期，并未调用产品或执行示例：

1. revision0买700粮：b=1，ceil(700/7)=100金；金900、粮1700、AP20、XP5，city/actor marker均turn0，revision1
2. 当旬任何新ID再买卖都因本城已使用拒绝；重试完全相同第一envelope只返回原收据
3. revision1推进：进入1月11日/turn1，价格3，AP恢复到40，金粮/XP不变，revision2
4. revision2卖700粮：floor(700/3×4/5)=186金；金1086、粮1000、AP20、XP10、politics仍50，marker均turn1，revision3
5. revision3再推进：进入1月21日/turn2，商人不在、价5、AP40；后续交易拒绝，后续推进因horizon已满拒绝

同价7而非价3的另一合法下一旬卖700粮，政治50得到80金；这说明4/5只卖侧及价格方向，并非场景中的既定第二输入。AP恢复0版本的完整场景在两次交易后为AP0。所有说明均非运行结果。

## 10. 来源、已知边界与仍未闭合内容

来源分为三层，不互相升级：

1. 官方PK命令语义：都市商人、20AP、无固定金费、即时、两格敌军阻止、政治影响交易，以及政治/功绩提高的说明。功绩未接本profile，不能以零delta替代原作奖励结论。见[官方说明书](https://cdn.akamai.steamstatic.com/steam/apps/628070/manuals/32sangokushi11wpk_manual.pdf)
2. 经验资料：UI相场3..7、买卖连续式、0.8卖侧、近似政治锚点与XP+5。见[游民攻略](https://www.gamersky.com/handbook/200712/89446.shtml)、[Wiki命令资料](https://w.atwiki.jp/sangokushi11/pages/74.html)、[Wiki经验资料](https://w.atwiki.jp/sangokushi11/pages/79.html)。现有规则引用不等于本次重新做游戏实验
3. 固定公开原函数listing：[交易收支原文](https://github.com/sjn4048/311MemoryResearch/blob/66e167e40c3440929ec016f3872aefc3486434c1/内存资料/整理/Func-内政05-计算交易收支.txt)。原段005CA620..005CA76A，135条、331所列字节；GBK-LF原blob e53ce1f6f1945c1efd0d8c569eec161cffaaa560，9860 bytes，SHA-256 183c06ba9fbcf443425261451ddf75b23a14473ec827c2c72d3d508ae6c4bd4b。归一UTF-8是另一字节表示，10292 bytes、SHA-256 e468deb16ba54f7f787723c2522cb91d18f9cebefd798b5ccde7e75489f7cc7c；不得用归一字节宣称原blob身份

原函数完整段确实已公开，不能写成“完全缺少函数体”。尚未闭合的是0070A330、0070A280、005CA5B0的完整helper语义、raw TradePrice byte↔UI相场尺度、原生乘除/取整/溢出、实际扣款与入库writer。即使listing出现450−politics，也不能未经证明就把400/(450−politics)或CRT/x87语义宣称为原作精确公式。后附“商才”MOD修改与本profile分离。

本实现使用具名经验lookup和provisional整数writer/容量/资格/奖励/AP/调度政策。来源身份/135条listing完整性不等于三helper闭合，更不等于stock或原生执行认证。nativeExecution=false、stockVerified=false；确切PC-PK1.1/Vanilla跨版本、原生价格更新、商人发生、AP公式与地图/owner/helper仍开放。

O10-A与B合计只是O10能力的有限覆盖，不是“全部财政完成”。原43组未决证据主题分母不变，P078及相关capture/ownership/mission/return/俘虏欠薪仍排除。旧经济页§8保留原证据与未知，本页描述新增独立服务规则，不覆盖其历史来源等级。
