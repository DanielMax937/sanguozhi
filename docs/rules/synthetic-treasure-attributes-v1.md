# T28 统一资源 owner 宝物五维只读投影

固定源码研究基线：`f132870bb58505acd0572c23e3ba91592eefa849`。本 helper 是纯投影候选，非默认世界入口、非新账本，也没有声称所有城建/战斗已消费派生属性。未运行 tests / build / typecheck / 候选代码。

## 唯一数据来源与 API

`projectSyntheticTreasureAttributes(rawItems, rawOfficers, rawConfig)`：

- rawItems 从经过完整 outer journal 重放的 **当前 city.metadata.items** 精简复制 `{id,value,holder}`。
- rawOfficers 精简 `{id,leadership,war,intelligence,politics,charm}`，四维取实际当前 owner 属性；WAR 取同一 owner 的当前基础+Train成长派生值。不得在宝物 config 再存一个静态 baseWar，不得把 XP 原值冒作属性。
- rawConfig 只有 `{equipment:[{itemId,sourceIndex,inferredBonuses:{leadership,war,intelligence,politics,charisma}}]}`。每件当前库存项恰一份配置。sourceIndex null 代表无目录关联。
- 返回冻结 projections（base / inferredBonuses / effective / sourceEffects）及政策标签；不返回可花 AP、金、工资、忠诚、库存余额、存档、revision 或写入提案。不修改传入对象。
- **caller 必须保证两个 live 输入来自同一个当前重放结果**；形状合法不是历史来源认证。helper 不把调用者随意输入认证为合法世界状态，不为此构造另一完整metadata/treasure session。

合成人物和宝物 ID 检查、1..64成员/库存、重复ID/角色ID冲突/未知holder、完整且唯一 equipment绑定、未知字段和非整数拒绝。输入先有界descriptor detach，拒accessor/symbol/cycle/exotic/sparse；Node可用getBuiltinModule时先拒Proxy。非Node不能保证任意Proxy反射无副作用，契约仍为非Proxy plain JSON DTO。

## 既有算法与明确推断

复用现有 `inferred-treasure-unified-session.ts:132–149` 的算法含义：

1. 每位当前持有者的每一维单独取所持宝物 **最大** inferredBonuses，不是相加。
2. `effective = min(255, currentOwnerBase + maxBonus)`，无宝物则bonus0。
3. 不改永久基础值；没收或转授后下一次投影立即按live holder变化，不保留旧装备缓存。
4. catalog `docs/sources/treasures.json` 43行现有资料给名字、value、定性effect等；没有本合同五维数值。bonus0..100为显式推断/可替换输入，**value只作原目录关联一致性核对，不作属性加成**。
5. sourceIndex关联仅说明所引用目录行，与value相等不能证明真实物件身份。documentedEffect原样作为资料展示且 `effectExecuted:false`，不执行单挑必退、话术等边界外效果。

输入域差别必须明确：旧独立 T28 session 把base和bonus都限0..100；统一 city 现有固定 leadership/charm/intelligence 实际可0..255，因此此bridge **仅把base扩至0..255**，bonus继续0..100，cap255不变，标签为 `live-owner-base0to255-bonus0to100-v1`。这是工程兼容选择，不是原生新公式证据。当前politics/WAR等上游更窄域由owner自己的验证保持；这里不重新定义Train规则。

## 消费边界

输出有效属性可能>100；旧field intelligence或food politics等仅收0..100时，不能静默把输出夹100或绕过其验证。需要明确具体消费合同。leadership/war不等于物理attack/defense面板，不可直接替代旧combat的resolved panels。

没有真实人物归属变化、受伤/死亡、Closing、P078、库存复制、真实项目资产操作；仅本地候选，无远端发布。该helper本身不是完整世界整合，须由唯一owner纳入新版本并独立静态审阅后才可宣称入口已接。
