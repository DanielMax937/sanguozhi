# T29：宝物effective政治到商人价格视图的端点政策

`projectSyntheticMerchantPricePolitics({officerId,effectivePolitics})` 是私有纯只读适配。exact字段、合成ID、effectivePolitics整数0..255（拒负0），输出同ID、pricePolitics和完整只读receipt。沿已存在catalog的20..100观察范围，pricePolitics=max(20,min(100,effectivePolitics))。

只饱和**商人价格计算输入视图**，不截断/回写人物才华、成长值、effective属性或XP。收据同时保留真实effectivePolitics、实际pricePolitics、identity/lower-endpoint/upper-endpoint、具名 `inferred-merchant-politics-endpoint-saturation-v1`、catalogVersion和nativeEquivalent:false。原生未知区间不伪称恢复。

## 原算法和资格不改

原 `city-merchant-trade-reducer.ts`、catalog、policy均不修改。原20..100输入恒等，原锚点有理数插值、买入ceil、卖出floor和4/5卖系数逐字不变。

原独立商人API仍拒域外政治。仅显式新owner模式调用此view。原city/force/corps、商人在场、每城每旬一次、actor available/acted、敌军两格、AP20、足额金粮、容量、zero-sale拒绝、XP+5及其原上限、无额外固定金费/TP/功绩等全部由原reducer/owner验证，不由此函数假称已验证。

## owner接线

owner在command-start计算唯一live effective；用本view构造当次MerchantTradeFrame的actor.politics。成功验证中第二次 merchantFrame(s,next)也必须同一policy，否则现有candidate相等核会失配。只提交原明确的资源/AP/XP/acted/merchantUsedTurn字段，不把临时candidate.officers.politics写入人物。

旧audit.politicsEffect及politicsXp.politicsBefore/After仍记录reducer所见20..100的**价格视图**，外层附本receipt说明真实effective。不能声称属性被降到100。人物XP增长的原持久字段仍独立保存；生产/研究历史startSnapshot不可由新视图重写。原qualified-world入口对genesis politics20..100的门不由本叶修改；owner若用当前255读视图须明确新profile，保留旧默认。

## 单调与套利边界（静态代数）

catalog effect锚点依次非减，分段线性有理数插值非减；本view的端点饱和亦非减，因此有效政治上升不会使同一ui/同Q的买入金额更高或卖出金额更低（ceil/floor分别保持该序）。20以下均沿20，100以上均沿100，绝不外推更优惠价格。

不能声称旧定价绝无套利：e100=1142868/1000000，而同ui同Q忽略舍入的卖/买倍率为4e²/5，e100>1.14，4*(1.14²)/5=1.03968>1。足够大Q时旧最高政治已可能出现正价差；买ceil/卖floor只减小价差，AP20/每城每旬一次等限制仍存在。此次饱和没有新增effect值，也不提高原最大倍率；跨时ui价格变化也仍属旧行情输入，不由本政策制造。保留原规则而非擅改锚点“修复套利”。所有使用的新视图值均已在旧20..100输入域内，最有利价格/最坏套利上界不扩大。

## 证据与审查

evidence保存实际merchant reducer/types/lifecycle和两catalog的读取内容，manifest记录hash；锚点本身 `selected-approximate-observations-not-native-exact`，舍入和写入亦原service具名政策。本批未执行候选/tests/typecheck/build，未改shared owner/远端，待独立静态审阅及owner全链核验。
