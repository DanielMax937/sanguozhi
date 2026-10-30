# T06：可选合成火源生命周期与正值驻留消费者 v1

## 证据、复用和明确推断

本次静态读取基线 `f84170228ca0ff98ead3d2887be993eef8088885` 的 `terrain-hazard-lifecycle.ts`、`inferred-combat-requests.ts`、`inferred-positive-hazard-ledger.ts` 和 [39火焰持续证据](39-fire-lifetime-spread-exactness.md)。不是新原版逆向成果。

| 项 | 实现与证据边界 |
|---|---|
| strategy火基础寿命 | 直接读旧 `DETACHED_HAZARD_POLICY.lifetimeBySource.strategy` 的weights；当前是1/2、70/30。39规则指出它来自现代复刻的二级工程重建，**不是原版概率已证实**。不复制常量，不开放任意隐含新profile。 |
| 会心寿命 | 同一旧profile的 `criticalBonus`，当前+1；39中成对实测关系属empirical-high，不代表已取得原setter。 |
| 持续驻留火伤 | 调用已合并 `executeInferredPositiveHazard`，其请求再调用 `projectInferredStandingFire`；普通无修正300+draw(0..200)沿用具名推断。无新公式、无即时会心伤害倍率；critical只影响寿命。 |
| tick处理顺序 | `inferred-strategy-profile-no-spread-atomic-standing-fire-v1`：tick开始在燃烧格的目标先损耗，全部成功后统一寿命减1，归零熄灭。原计数phase未证，这是明确选择。 |
| 熄灭 | 寿命到0移除火源；显式Extinguish也是合成控制命令，无AP/成功率/武将技能推断。 |
| 重复点燃 | 活跃着火格拒绝；不同于旧服务max-remaining重燃策略。原setter仍open，本狭窄接口不开放重燃，亦不修改旧服务。 |
| 自然传播 | 完全不实现，与39规则原作fidelity关闭一致；火罠/火球/雷击范围和链式点燃不在本批。 |

旧39所列原始参考包括 https://w.atwiki.jp/sangokushi11/pages/92.html 、https://forum.gamer.com.tw/Co.php?bsn=60001&sn=380559 、https://github.com/tankyc/sango_infinity/blob/main/Project/Assets/Sango/Scripts/Game/Object/Skill/Effect/SetFire.cs 。本批读取的是仓库已有证据文档与代码，**未重新访问这些外链**，不将引用包装成新实验或亲读原函数。

## 数据及入口

`createInferredFireLifecycle(cells, initial)`：1..16唯一合成cell ID；1..8唯一合成目标 `{id,cellId,value}`，cell须存在、value为1..1000000整数。所有ID匹配 `synthetic-[a-z0-9-]{1,48}`。目标固定为独立troop数量账本，不关联真实部队、军官、伤亡或归属。cell只是不带几何的合成位置，不是原生地形；允许多目标驻留，既非原作栈规则也不声称碰撞规则。

初始没有火，tick=0。状态仅 `{schema:'inferred-fire-lifecycle-v1',cells,initial,commands}`，没有可注入余额、火快照或clock。`readInferredFireLifecycle`从头重放返回实际targets、fires、tick、逐命令receipt和派生hazardState/hazardRevision。返回的hazardState只是核查输出，不能替代本层输入。

`executeInferredFireLifecycle(state,{id,expectedRevision,action})`，动作严格：

- `Ignite {fireId,cellId,durationDraw,critical}`：strategy来源；durationDraw整数0..99，critical布尔；只生成火，不立即伤害。火ID整条历史不得复用，活跃火格拒绝。未执行计策命中/施术者费用，调用者显式选择已允许的合成点火。
- `Extinguish {fireId}`：只接受当前活跃火；过期/未知拒绝，无静默成功。
- `Move {targetId,cellId}`：只更新合成驻留位置，拒同格无效移动；不推断路径/范围/AP/入格火伤。下次Tick采用新位置。
- `Tick {draws:[{targetId,draw}]}`：覆盖**全部**当前燃烧格上的目标，严格初始目标顺序，不允许选择子集/重复/额外抽签；draw为0..200。无目标时必须空数组，仍推进tick及火寿命。输入整数抽签不是自动RNG、也不消耗旧hazard RNG tape。

命令ID唯一；expectedRevision等于已接受命令数。重复/过期/非法字段均拒绝。最多64外层命令，内层总伤害命令最多256；超过预算整条拒绝。Tick不是旬、没有日期，不冒充城市/旅行共享时钟。

## 原子性与保存

同一Tick先在局部候选调用旧正值消费者，所有目标成功才提交候选余额并减少全部火寿命/推进tick。任一伤害达到或超过目标余额（零或终结），或内层容量不足，返回失败且**无新state、无部分余额/火寿命/tick/日志写入**。不钳制到1，也不模拟死亡/撤退/俘获。调用方保留原state；可选择未来不同合法控制命令，但没有自动消灾/跳过该目标。每个成功Tick实际消费火伤，不再只输出计划。

内部伤害命令ID由外层序号及目标序号固定生成；内层revision独立连续，外层重放不信任任何派生快照。`saveInferredFireLifecycle`先完整验证只序列化genesis+commands；`loadInferredFireLifecycle`最大100000字符并完整重放。每个成功状态保存长度也检查100000，结构最多64命令*8draw及8目标，满足本层10000节点/深12/数组256预算；内层最多256伤害日志，沿用其有界输入验证。满日志可能使后续推进不能执行，这是明确容量拒绝，不宣称无限期世界模拟或所有火必能燃尽。

普通对象输入使用descriptor有界复制，拒accessor/symbol/额外数组字段/稀疏数组/循环/非普通原型。支持Node util时拒Proxy；其他运行时不能保证无反射trap，只接可信普通数据。标准JSON重复键last-wins，不声称签名或初值真实性；更改合法初值即另一个合成场景。输出深冻结，输入不修改。

## 未接入与静态验收

旧默认、旧occupiedFire拒绝、旧存档、旧RNG不变。只复用旧duration policy数据及独立正值hazard消费者；不调用真实人物finalizer、P078、Closing、GameState或global campaign。不接自然扩散、火罠链、建筑火伤、踏破/火神/藤甲修正、即时攻击、策略命中、全局AP/食物/资源、真实人物伤亡/归属、零值终结。它闭合的是**合成火生成→驻留正值消耗→寿命递减/熄灭的原子局部循环**，不是全局战役接入。

静态核点：寿命draw临界69/70与critical+1沿用旧weights；寿命1本次Tick伤后熄灭；离开燃烧格不再损耗；多个目标任一终结整tick回滚；不存在的火/重复ID/陈旧revision拒绝；全日志重放重建所有结果，预算满拒绝无部分提交。未执行候选、测试、typecheck或build，运行正确性未验证。
