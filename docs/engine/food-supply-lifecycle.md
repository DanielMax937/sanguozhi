# 独立耗粮与手动补给资源会话

此 API 保存、预览、原子提交并重放资源账户。`classification` 选择耗粮及兵装算术；它不代表原生部队、设施实例或地图行动者。所有公开函数从 `packages/engine/src/index.ts` 导出，使用 Node 24。

## 公共 API

- `createFoodSupplySession(state)`：验证完整初始状态，返回 `{ok:true,state,session}`
- `previewFoodSupply(session,command)`：返回 `{ok:true,proposedState,receipt}`，不添加历史
- `executeFoodSupply(session,command)`：重新计算并返回 `{ok:true,state,session,receipt}`；调用方自行保留新 session
- `saveFoodSupply(session)`：验证历史后返回 `{ok:true,json}`，不写磁盘
- `loadFoodSupply(json)`：严格解析并重放全部历史，返回 `{ok:true,state,session}`
- `replayFoodSupply(initialState,commands,expectedProfile)`：必须提供完整预期 profile，整段成功才返回 session

运行时入口接收 `unknown`，先验证再计算。导出的 `FoodSupplyState`、`FoodSupplyAccount`、`FoodSupplyCommand`、`FoodSupplyProfile`、`FoodSupplySession`、`FoodSupplyReceipt` 及各 Result 类型均为只读数据。没有回调、全局会话注册、时钟或 RNG。

`session={initialState,currentState,entries}`；每条 entry 是规范化的 `{command,receipt}`。输入不会被修改或冻结；返回值深度分离并冻结。预览与提交使用相同的校验、资源计算、守恒及历史/大小边界，预览对象不能代替命令提交。

失败统一返回 `{ok:false,reason,ledger:[],state,session,entries:[]}`。若当前 session 已通过验证，`state/session` 是原状态及原会话；否则为 null。重放后段失败返回最初的有效 state、null session 和空 entries，不泄露部分提交结果。原会话中的既有 entries 始终保留，失败响应的空 entries 表示本次没有提交。

错误类别：`invalid-input`、`unsupported-profile`、`unsupported-schema`、`unsupported-command`、`invalid-json`、`duplicate-command`、`stale-revision`、`invalid-turn`、`out-of-range`、`ineligible-transfer`、`profile-mismatch`、`replay-mismatch`。结构与全部上下文验证后，重复成功 commandId 优先于陈旧 revision；失败 ID 不占用。成功的零需求/零转移仍增加 revision 并记一条历史。

## 完整 schema 与有限域

State 必须恰有 `schemaVersion:1`、`scope:'detached-food-supply-accounts'`、完整 `profile`、`revision`、`turn`、`accounts`。账户必须恰有：

- `kind:'detached-resource-account'`，`id`，`ownerId`，`classification`，`equipmentId`
- 整数 `troops`、`money`、`food`、`morale`，12 项 `equipment` 数组
- `capacity:{troops,money,food,equipment}`，其中 equipment 也是12项

资源、容量、revision、turn 范围为 0..2147483647，morale 为 0..255；库存不可大于容量。ID 为1..128字符，匹配 `[A-Za-z0-9][A-Za-z0-9._:-]*`。账户 ID 不重复；`food-consumed-sink` 是保留的外部消耗汇标识，不能作账户 ID。ownerId 只是同属比较值，不创建势力。账户、消费上下文和 coverage candidates 会按 ASCII ID 排序；账本按 resource/from/to 排序。

- transport：troops/money/food 容量固定60000/100000/500000，equipmentId=null
- combat：money/food 容量10000/50000，troops 容量由调用方给出且≤60000，equipmentId 为0..11
- city/port/gate：容量由调用方给出，equipmentId=null
- combat 的 equipmentId=1..4 时，该槽库存必须等于 troops，装备容量至少等于兵容量；其他槽可保存惰性库存
- equipmentId=0 不要求每兵一剑；5..11 不按每兵消耗一辆攻具或一艘船，也不推导载具数量

所有兵装容量都是调用方明确给出的账户政策。combat 的60000上界是本 API 支持域，不声明原生主将上限。

每个输入及完整保存 envelope 最多16MiB UTF-8，递归深度≤64（根为0），任一数组≤4096；accounts 为1..4096，entries 为0..4096，兵装数组严格12项。创建、预览、执行和重放均保证产生的完整保存 envelope 满足相同限制。达到历史上限后仍能保存、加载和读取；不再提交新命令。

只接受 plain object（包括 null prototype）和密集普通数组，字段必须完整且无额外项。拒绝 getter/setter、symbol、非枚举额外属性、循环、异类原型、非整型、负数、-0、NaN、Infinity、布尔代替数字。Node 24 利用 `node:util` 的 Proxy 检查，在反射之前拒绝 Proxy，包括已撤销 Proxy，不调用 trap。浏览器若没有该 Node intrinsic，只支持可信的普通数据对象；不承诺识别浏览器 Proxy。JSON 解析拒绝重复键，包括转义后相同的键。

## 两种固定且真正生效的 profile

导出的 `DETACHED_FOOD_SUPPLY_PROFILE`：

- id=`detached-food-supply-v1`
- arithmetic=`source-bits-exact-rational-v1`
- coverage=`supplied-single-selector-v1`
- morale=`weighted-floor-v1`
- transfer=`accepted-min-retain-v1`
- zeroTroops=`retain-account-no-unit-lifecycle-v1`
- shortage=`report-only-no-troop-loss-v1`

`DETACHED_FOOD_SUPPLY_HALF_UP_PROFILE` 只将 id 改为 `detached-food-supply-nearest-half-up-v1`、morale 改为 `weighted-nearest-half-up-v1`。必须使用这两组完整组合之一；未知字段、未知值、ID和算法不匹配均拒绝。建立 session 后不能热切换；另一模式必须建立新的独立 session。存档保存完整 profile，跨模式 replay 返回 `profile-mismatch`，不会重新解释旧历史。

两种模式是显式工程政策，不声称恢复原生非整除气力 helper。旧目标1兵/0气力，加1兵/1气力，floor 得0，half-up 得1。

## ConsumeTurn

命令字段：`{type:'ConsumeTurn',commandId,expectedRevision,turn,contexts}`。turn 必须恰好增加1；contexts 对每个账户恰好一项：

`{accountId,onFire,politics,hasTuntian,coverage:{candidates,selectedId}}`

onFire/hasTuntian 为 bool。combat/transport 的 politics 为0..100整数；city/port/gate 可用 null，表示无太守、按政治0计算。candidate 为 `{id,type,ownerId}`，type 是 camp/fort/fortress，owner 必须同账户。非空 candidates 必须明确选择一个 ID；空列表仅允许 selectedId=null。combat 只使用该一个候选，不叠乘、不自动选最强。transport 验证但忽略 coverage；city/port/gate 必须空 coverage。

求值顺序：

1. 完整校验所有账户和上下文
2. 旬初 food=0：跳过需求评估，requestCost/shortfall/raw 均为 null，debited=0，不重新产生粮尽事件
3. port/gate 且 hasTuntian=true：整个分支免粮，包括火；requestCost/shortfall=0，raw 为 null。city 不免
4. combat 的 normalRaw = troops × multiplier × scale；transport = troops × scale；驻屯 = troops/40
5. 着火 fireRaw = 旬初food × (600−5×politics)/10000；未火为0
6. normalRaw+fireRaw 后只截断一次；troops>0 且结果<1 时取1
7. debited=min(旬初food,requestCost)，shortfall=requestCost−debited

field multiplier 原 float32 bits：none=0x40000000、camp=0x3FD55555、fort=0x3FAAAAAB、fortress=0x3F800000；scale=0x3D4CCCCD。BigInt 有理数解码这些位型，不换成5/3或4/3，不逐步 fround。18000兵阵覆盖为1499，不能按旧数学近似改成1500。驻屯1/40及火的十进制式以精确有理数解释，是明确兼容求值选择，不宣称恢复其原bytes或完整x87中间精度。

receipt.consumptions 给出逐账户 foodBefore/foodAfter、约分后的 normalRaw/fireRaw/combinedRaw（`numerator/denominator`）、requestCost、debited、shortfall、status、exhaustedNow、foodAvailabilityAfter 和 coverage。status 为 already-empty-skipped / tuntian-exempt / consumed / insufficient；正粮恰好扣完属于 consumed 且 exhaustedNow=true，只有需求大于库存才 insufficient。零兵未火需求0，零兵仍可损失存粮于火。所有兵、金、气力、装备保持不变。

粮不足只报告，不掉兵。历史 shortage receipt 不作为当前 flag；补粮后 availability 立即为 positive。

## ManualSupply

命令字段：`{type:'ManualSupply',commandId,expectedRevision,sourceId,targetId,relation,requested}`。relation 必须是 `{kind:'supplied-adjacent',sourceId,targetId}`，且 ID 与命令完全一致；这是调用方供应的相邻关系，不执行地图验证或移动。

仅同 owner 的不同 transport→combat 账户。requested 必须明确包含 troops/money/food 三个非负整数，不默认最大补给。每项 accepted=min(requested,目标剩余容量,来源库存)。目标装备1..4还按来源匹配槽库存限制 acceptedTroops，并将同量兵装从该槽转入目标对应槽。所有金额由命令开始快照独立计算，原子提交。

没被接受的 request 差额不是库存；只从来源扣 accepted，不丢弃、不双倍返还。receipt 给出 requested、accepted、unaccepted 及完整 ledger。acceptedTroops>0 时：N=旧目标兵×旧目标气力+acceptedTroops×来源气力；D=旧目标兵+acceptedTroops。floor 使用 N/D 整除；half-up 使用 (2N+D)/(2D) 整除。全部 BigInt。acceptedTroops=0 保留目标气力，receipt.morale 的 numerator/denominator 均为 null，表示未进行加权；否则保存未约分的 N/D 十进制整数字符串。来源气力始终不变。

零兵保留同一个账户及全部剩余库存，包括历史气力。来源可以转出最后一兵，也可在0兵时转金粮；目标0兵可接收兵。这些操作只改变资源，绝不表示部队死亡、复活、创建或无人运输队行动。

## 守恒与存档

每个 ledger 行为 `{resource,from,to,amount}`，amount>0。手动转移的 troops/money/food/equipment:1..4 均守恒；消费只将实扣粮记至 food-consumed-sink。提交前逐账户逐资源核对实际差额、非负和容量，不能只核全局总量。气力不是可守恒资源，不生成气力损失行。

保存 schema=`san11.detached-food-supply.save`，version=1，包含 profile、initialState、currentState、entries。对象键按 ASCII 升序，规范数组保持顺序，不直接序列化 BigInt。load 从 initialState 执行全部 commands，逐条比较完整 receipt 及 currentState；手改库存、ledger、profile、command、turn 均不能作为可信缓存。此完整性检查不是加密签名：若有人同时一致地改写整个初态和历史，那是另一份自洽的输入，不能用于认证外部身份或授权。

## 可运行示例

在仓库根目录通过 `node --input-type=module` 运行：

```js
import assert from 'node:assert/strict';
import {
  DETACHED_FOOD_SUPPLY_PROFILE, createFoodSupplySession,
  previewFoodSupply, executeFoodSupply, saveFoodSupply,
  loadFoodSupply, replayFoodSupply,
} from './packages/engine/src/index.ts';
const ok = result => { assert.equal(result.ok, true); return result; };
const stocks = () => Array(12).fill(0);
const account = (id, classification, troops, money, food, morale) => ({
  kind: 'detached-resource-account', id, ownerId: 'F1', classification,
  equipmentId: classification === 'combat' ? 0 : null,
  troops, money, food, morale, equipment: stocks(),
  capacity: {
    troops: classification === 'combat' ? 10000 : 60000,
    money: classification === 'combat' ? 10000 : 100000,
    food: classification === 'combat' ? 50000 : 500000,
    equipment: Array(12).fill(100000),
  },
});
const initial = {
  schemaVersion: 1, scope: 'detached-food-supply-accounts',
  profile: DETACHED_FOOD_SUPPLY_PROFILE, revision: 0, turn: 0,
  accounts: [account('C', 'combat', 1000, 9000, 50, 50),
             account('T', 'transport', 1000, 300, 1000, 100)],
};
const contexts = ['C', 'T'].map(accountId => ({
  accountId, onFire: false, politics: 100, hasTuntian: false,
  coverage: { candidates: [], selectedId: null },
}));
const commands = [
  { type: 'ConsumeTurn', commandId: 'consume-1', expectedRevision: 0, turn: 1, contexts },
  { type: 'ManualSupply', commandId: 'supply-2', expectedRevision: 1,
    sourceId: 'T', targetId: 'C',
    relation: { kind: 'supplied-adjacent', sourceId: 'T', targetId: 'C' },
    requested: { troops: 500, money: 100, food: 200 } },
  { type: 'ConsumeTurn', commandId: 'consume-3', expectedRevision: 2, turn: 2, contexts },
];
let session = ok(createFoodSupplySession(initial)).session;
for (const command of commands) {
  const preview = ok(previewFoodSupply(session, command));
  const executed = ok(executeFoodSupply(session, command));
  assert.deepEqual(preview.proposedState, executed.state);
  session = ok(loadFoodSupply(ok(saveFoodSupply(executed.session)).json)).session;
}
assert.deepEqual(session.currentState.accounts.map(a => a.food), [50, 725]);
assert.equal(session.currentState.accounts[0].morale, 66);
assert.deepEqual(ok(replayFoodSupply(initial, commands, initial.profile)).session, session);
assert.equal(executeFoodSupply(session, commands[0]).reason, 'duplicate-command');
console.log('food C=50 T=725; morale C=66; replay and roundtrip agree');
```

## 来源与明确排除

[来源清单](../sources/food-supply-lifecycle.json) 记录使用的文件哈希和范围。消费位型与单 selector 依据 [20](../rules/20-food-consumption.md) 和 [47](../rules/47-food-overlap-starvation-exactness.md)；容量、手动请求、匹配兵装及加权气力约束来自 [21](../rules/21-supply-transport.md)，接受最小值/保留差额以及 floor 属于显式兼容政策。旧单项耗粮脚本的5/3近似与分开取整不能用作本 API 的 oracle。

已知位型与最终截断不等于干净 stock 身份、完整 x87 链或主机版本等价。native coverage winner、troop→troop 的具体 helper/非整除气力取整仍未知，两种 profile 都不替这些未知背书。

不包含任何饥饿掉兵（包括0.76）、自动补给、出征/到达/归还、创建/死亡/消灭/复活、捕获/归属/势力灭亡、任务终结、P078及依赖、功绩/经验/AP。成功收据不能转译为原生 finalizer 许可。本模块不依赖移动或地形会话，不作为运输任务终点，不迁移 GameState v2、不改变旧 Train/EndTurn、save/trace 或既有证据主题的结论。
