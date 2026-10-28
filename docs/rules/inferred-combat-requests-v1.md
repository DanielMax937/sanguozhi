# 未明公式的具名设计推断请求 v1

2026-10-28。实现 [inferred-combat-requests.ts](../../packages/engine/src/inferred-combat-requests.ts)。全部新结果 `evidence=explicit-design-inference`、`worldEffectsApplied=false`，不是原作已恢复。只返回标量/发生决定/请求，不扣兵、扣耐久、生成部队、改变人物/城池、运行P078或Closing。旧游戏profile与默认不变。

## T02 普通计略命中

`decideInferredStrategyHit(kind,intelligence,targetIntelligence,roll100,eligibilityConfirmed,immune,guaranteed,beautyBonus)`。

- kind为fire/ambush/discord/sorcery，双方智力0..100，roll0..99，四个布尔必须严格boolean；资格未明确则拒绝。资格事实由调用者供应，不声称恢复地形/目标/技能resolver。
- 基准分别70/60/40/30，普通率 `clamp(base+floor((智力−目标智力)/2),5,95)`。倾国标记仅前三种加倍再cap95；妖术不加倍。免疫先于必中，否则严格roll<rate。
- **火计70/伏兵60/同讨40来自已经撤回的旧模拟值，只作为本新设计重新选择，不恢复其原生证据等级。** 妖术30、斜率1/2和上下限也是设计。理由是智力差单调、较强群体效果较低基率，且尽量避免0/100绝对化；不是原作样本拟合。
- 来源边界：[计略规则](06-strategy.md)。原helper/目标距离/原RNG仍未知。这里只算成功决定，不执行火/伏击/混乱/内讧效果。

## T06 驻留火伤

`projectInferredStandingFire(draw201,ordinaryNoModifiers)`：draw整数0..200且ordinaryNoModifiers必须true，返回300+draw，即闭区间300..500，不加会心。

[战斗规则火伤](05-combat.md)只有即时普通火计约400±100证据；**把该量级外推到一次驻留结算是推断**，不是已核每旬伤害。持续灼烧不是新的施计会心，故不重复会心倍率。相关特技/技巧/装备倍率尚无此驻留caller证据，不纳此普通域；不隐式把false当无效果。旬调度、燃烧格移动、致命后果未自动接入。

## T12 落石finalizer

`projectInferredRockfall(target,draw,pathbreaker)`：部队draw0..499，raw=1500+draw；建筑draw0..999，raw=800+draw。部队踏破floor(raw/10)，建筑不接受踏破。**默认不另加共通50**，返回 `commonBase50Participation=assumed-not-added`。

[地形伤害来源](32-terrain-hazard-damage.md)已有专用参数；共通50参与未知，最少假设是不再次相加，避免无证据双计。调用者逐目标显式调用，每目标独立提供draw；无隐式批量排序、混乱或击破结算。实际target名单/次序须由上层明确，不声明原caller顺序。

## T32 太守系数及初始忠诚

- `projectInferredGovernorCounterattack(baseDamage,governorWar)`：war0..100，`numerator=100+max(W−65,0)`，请求floor(baseDamage×numerator/100)。[人物规则](03-personnel.md)只支持65阈值及高武力增强；每点1个百分点是最简单线性设计，不是逆向斜率。只看太守，不混统率；上限1.35。BigInt中间，最终超安全整数拒绝。
- `projectInferredGatePortRepair(governorPolitics,governorPresent)`：政治0..100；有太守 `B=clamp(floor(9P/2),150,450)`，请求floor(3B/20)，无太守0。**将普通设施形式外推到港关是推断**；原港关IMUL8/LEA9冲突保留，不包括堤坝。返回请求而非实际cap/耐久更新，无敌军/资格判断。
- `projectInferredInitialLoyalty()`：新设计固定请求80，`sourceEstimated=false`、不建模魅力/相性。没有可辨护的原式时选择中高而非满忠诚，为后续褒赏留空间；**不是最可能原作数值的统计估计**。只提供初值提案，不登用/移籍、不覆盖已有忠诚。

## T33 贼兵/异族发生请求

`decideInferredRaidRequest(kind,security,roll1000,eligibilityConfirmed)`：kind bandit/tribal，治安0..100，roll0..999。资格必须明确true。仅模拟**新威胁/根城的关联模板请求**，不模拟既存根城刷新：治安≥80时两类阈值均0，遵守已知安全门；治安<80时贼兵阈值100−治安、异族10（1%），严格roll<threshold。成功仅返回1支/3000兵的关联模板请求，根城/部队都不实际创建。一次月度调用为本设计时机；原发生周期未恢复。威压降低安全阈值及对应亲○技能等更严格资格须由caller纳入eligibilityConfirmed，不得仅用城市存在代替资格。

[经济规则10.11–10.12](02-economy.md)区分治安80新根城安全门与既存根城刷新，且给出普通贼通常剑兵、各异民族常见兵种；本函数不把这些定性类别绑定成具体单位。**低治安域内概率、时机、规模为设计假设，不是来源估计；安全门则保留既有证据。** 低治安增加贼患是设计方向，3000/1%为小型扰动；没有编造各族兵种、人物、出生格或原地理资格。equipmentResolved/spawnPositionResolved/nativeEligibilityEstablished均false。故这是具名发生/规模请求，**不是已实现异族生成**。调用者不可将结果当可直接出阵单位；不接世界writer。灾害现有policy保留且不以此重复抽灾害。

## T21 兵粮袭击补充

`projectInferredFoodRaid(attackPanel,ownTroops,targetFood,ownFood,foodCapacity,draw11,eligibleActiveSpearAttack)`：非负安全整数，ownFood不得超容量，draw0..10。最后参数须严格true，表示caller已确认主动枪兵攻击、已取得枪Lv2兵粮袭击、目标为部队且非反击；false拒绝。不从数值反推这些已知资格，调用者不得用于建筑或反击。倍率(10+draw)/10、请求 `min(floor(attackPanel*倍率),floor(ownTroops/2))`；提议转移min(请求,目标粮,自身空间)，借贷相等，未转移留源。

[兵粮袭击规则](24-food-raid.md)的R=1..2和兵力一半上限沿既有资料；11个十分位均值映射、floor和库存短缺/满cap处理是显式保守转移推断，不是原RNG/资源finalizer。BigInt中间避免浮点/安全整数溢出，最终请求受兵力半数约束。只返回请求，不写粮。

## 输入、安全和替换

所有数值函数拒绝NaN/Infinity/非安全整数/−0；damage兵数/资源域最多MAX_SAFE_INTEGER，限定属性/roll另有上限。纯函数不使用全局随机，roll由调用者显式供应；本模块不声称各draw独立或均匀。

发现可归属PC/PK版本原函数、caller、合法域、RNG或带完整输入的独立观测反例时，新增source-backed或新inference policy，不原位修改同ID值。旧假设及冲突保留。本文仅静态推演，未运行测试、typecheck、编译、build或候选，运行正确性未验证。
