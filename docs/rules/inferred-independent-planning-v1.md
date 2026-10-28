# T16 / T20 / T28 / T32：独立规划规则

2026-10-28。四个[公开函数](../../packages/engine/src/inferred-independent-planning.ts)均只给请求或规划，不写资源、忠诚、归属、世界，不调用finalizer，不启用原命令。不是原版/PK全链恢复。只静态审阅，未运行测试、编译、typecheck、build或候选。

## T16 有限城市命令AP映射

`projectInferredCommandAP(command,hasRelevantOffice,targetCount=1)`为显式关闭枚举，不接受未知字符串，不执行命令或检查AP是否充足。输出标记base证据等级与减半所用府，避免把成本规则当动作已实现。只接受以下19种键：

|键|基础AP|相关府|依据|
|---|---:|---|---|
|train|20|军事府|已知|
|search / recruitOfficer|20|人才府|已知|
|recruitTroops / produce|20|无|已知，军事府不减|
|praise|5×人数|无|已知|
|grantTreasure|10|无|已知|
|moveOfficer / summonOfficer|20|无|已知，人才府不减|
|patrol / trade|20|无|既有独立service|
|mergeFacility|10|无|已知，不额外军事府减半|
|rumor|30|计略府|手册基数+已知府门|
|deploy / transport|20|军事府|基数20为推断；减半门已知|
|confiscateTreasure|10|无|推断，按授予的对称成本，不推断忠诚损失|
|otherDomestic|20|无|具名人工城市内政动作预算占位规则|
|otherDiplomacy|20|外交府|具名人工外交动作预算规则；基础20推断，府门已知|
|otherCityStrategy|20|计略府|具名人工城市计略动作预算规则；基础20推断，府门已知|

最后3键是明确人工类别，不把任意未知原作命令自动归类；caller必须主动选择，不能覆盖同名原作已知成本。它们不代表原作命令全集，更不含野战计略气力或P078。选择20作为未知基数，是同类常见命令量级的可替换设计，而非统计估计。未证部署/输送基础值也明确标inferred-base。实际使用新证据应增加精确键而非静默改变旧政策。

有相关府时floor(base/2)，无相关府的键即使传true也不减；只接受bool。praise人数1..4096；其他键只允许人数1；无AP255封顶，超预算请求由消费者拒绝，不能把成本截断变免费。研究/建造等已有独立政策未被新表替换，不把时间减2旬当AP减半。来源：[经济§5.10–5.14](02-economy.md)、[人事§8.14](03-personnel.md)、[计略流言](06-strategy.md)、[城市命令服务](city-command-lifecycle.md)。原全命令枚举和caller成本仍非原生闭合。

## T20 自动补给的纯优先级规划

`planInferredAutomaticSupply(source,targets)`接收**可信普通数据**，不承诺防御恶意getter/Proxy。来源必须是调用方已经确认的独立运输账户：id、troops<=60000、money<=100000、food<=500000、12项兵装库存0..2147483647。目标最多4096个，ID唯一且异于来源，所有ID拒绝消费者保留值food-consumed-sink，字段完整：

- id；`foodTurnsRemaining`0..360整数，是caller明示的当前供粮期限（不是本函数重新计算耗粮）；
- troopsDeficit<=60000、moneyDeficit<=10000、foodDeficit<=50000，均非负整数，已包含目标容量；
- equipmentId0..11，1..4时兵力缺口还须包含目标匹配兵装容量；
- `eligibleSameOwnerAdjacentCombat=true`：caller已核同属、相邻、目标combat。本函数不读取地图/势力，不能由布尔值宣称原世界合法。

所有数字拒绝−0/NaN/Infinity/小数。12槽必须稠密。目标按供粮期限升序、ASCII ID升序稳定排队；需补粮且期限0者最先；foodDeficit=0者排在所有需补粮者之后、按ID排列。零兵账户仍保留且可补给，不推断原部队生死。**这是明确推断的公平、可复核饥饿优先策略，不声称原作AI如此。** 对排到的每一目标，粮/兵/金分别min(缺口,来源余额)；兵装1..4再min匹配槽库存，同量扣槽；其他兵种不把一兵当一件攻具/船。三资源不可相互兑换，资源间处理顺序不造成跨资源竞争，竞争只在目标顺序。缺口0仍可返回零请求，来源转完最后一兵不触死亡/解散。

每项输出`sourceId,targetId,relation:{kind:'supplied-adjacent',...},requested:{troops,money,food}`，可作为现有[ManualSupply](../engine/food-supply-lifecycle.md#manualsupply)命令的规划字段；caller还需补`type:'ManualSupply',commandId,expectedRevision`并逐步重新预览验证。**本函数不创建或执行这些命令**；世界执行仍禁止。若实际源库存/目标容量/资格与规划不同，丢弃后续计划并从新快照重新规划，不可把旧投影当收据。气力加权、资源守恒收据、版本及原子性继续由原独立service负责，不在此重写。结果源余额仅纸面投影，零/不足不触finalizer。

## T28 宝物价值忠诚请求

`projectInferredTreasureLoyalty(trueLoyalty,itemValue,eligibleOrdinaryGrant)`接受两个0..255整数及true资格门。资格由caller确认普通授予、可授予宝物/合法持有与目标；不包含从另一部下转授、没收或俘虏。后两者可能需要原持有者减忠诚链，本函数不支持。

选择`requestedGain=itemValue`；`projectedTrueLoyalty=min(255,原真忠诚+value)`，display=min(100,true)，实际投影增量单列；10AP/0金。依据[非自然忠诚§5](41-nonnatural-loyalty-exactness.md)的官方价值单调性、价值20使隐藏100→120经验，采用**empirical-high候选**而非opcode exact。不得先clamp100；byte255边界单列。数值上界255是此工程输入域，不证明所有物品原value都在此域。没有写人物/宝物归属或扣AP。

## T32 堤坝耐久恢复请求：已有listing，不另猜政治系数

`projectDamRecoveryRequest(facilityType,constructionState,maximumDurability)`分别支持0..255、0/1、uint16 0..65535。仅type0x18且state0返回floor(max/10)，否则返回eligible=false及0；max<10允许0，不加min1。当前耐久、实际恢复量unknown，不把请求当实际；不输出或执行完工/归属写入。

依据[固定311MemoryResearch原listing](https://github.com/sjn4048/311MemoryResearch/blob/66e167e40c3440929ec016f3872aefc3486434c1/内存资料/整理/Func-自动01-耐久恢复.txt)（GBK blob `726708dd50c8350bf2949dff6afddd8310ec403f`）：005999F9 type门、005999FF..00599A04 state门、00599A0D MOVZX最大耐久uint16、00599A10..00599A1F有符号magic除10，在非负uint16域等价floor/10；C1 FA02是SAR EDX,2，原注释DL错误不沿用。00599A28进入004AE360 writer，本API不调用；00599A45后的完工及00487CA0可能清空归属，明确排除。**不读取政治/太守，不套港关0.15外推。** 新实现只恢复公开listing可定位标量请求，不证明原helper/writer或完整调度一致。

## 替换与未覆盖

新证据可替换推断AP基数、供粮优先次序、宝物gain映射；保持旧ID历史，不改已知安全门。未知完整原命令集/真实自动补给调度/宝物转移与没收后果/堤坝writer完工仍须分别标未覆盖。本批不扩世界权限，也不是以4个函数宣称4整主题native完成。
