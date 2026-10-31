# T15 有界只读可行性合同

现唯一city/corps/force账本可以在WorldTick替换一次固定20恢复，不需另起时钟、AP余额、whole-season或人物结算。

实际核 `calculations.ts::calculateApRecovery`：leader=26+max(floor(max(统率,魅力)/5)-6,0)；城市参数min(10*(城数-1),50)；人数取每据点最多10、前6据点；无军师100%，有军师70+floor(智力/2)%；core=floor(sum*percent/100)，PK符节台每座在floor后+5，AP存量cap255。调用现calculateApRecovery而非复制公式，用整数百分比保留实际核舍入，不把JS1.15浮点误差引入。

已有真实事实：g.activeForceId/g.corps.id/g.city.id；唯一current.ledger.actionPoints；全g.officers固定所属；field当前resident/deployed；boundTravel实际away；PK当前基础统魅智0..100；metadata.personnelFacts.ruler.id。当前库只有一个城市，不把练习地图节点当控制城。repair sites无物理驻将名单，不作为额外人数据点。

仅新增immutable genesis advisorId（null或已存在同owner人物）和policy/profile选择；ruler从已有元数据导出，不新造身份。人数由当前home resident、not-away、available派生，预约与本旬acted不排除。available代理原active身份须明确具名推断。君主即使外出仍为leader；军师不在城/不可用时本profile按无军师倍率，是明确有限可用性政策，非原caller证实。不新增任免/多军团/建筑玩法。

现FacilityFacts种类barracks/forge/stable/workshop，无符节台唯一实体支持；本profile平台固定0，不接受任意count。若以后存在真实受控符节台，另版本接当前完整设施视图，不能凭配置数字冒充现设施。

治安不在四参数公式中，不能额外带入。属性使用PK base而非装备effective是具名0..100兼容政策，保留原base/affected未知。原公式内核实测与结构证据足够实施，但原函数体、跨军团母城港关计数、跨版本与getter仍未核。

owner phase：在同一clock+1后的原AP恢复位置由旧默认20或新纯提案二选一，只调用一次writeDomestic；后续job/income/season/field任何失败整Tick回滚。所有输入从current重演派生，不保存人数镜像；receipt保留before/request/actual/after与公式每项。不得从额外EndTurn获得恢复，不能两次相加。旧默认根形状与政策不变。

最终实现直接调用既有calculateApRecovery；内部构造合法仅读GameState并validateState，未读取字段为明确中性占位且绝不导出。现任在场军师INT须70..100；低于70显式拒绝，不夹值。owner在Tick前取current事实，receipt外层记录sampledTurnBefore；rootInvariant须profile分支依据真实历史apRecovery.actualDelta累计，不能沿旧20*advances误拒。

## 私有API与生命周期边界

`projectSyntheticApRecovery(raw)` exact字段：`{ownerId,corpsId,cityId,rulerId,adviserId,actionPoints,officers:[{id,ownerId,cityId,role:'resident'|'deployed',away,available,leadership,charisma,intelligence}]}`。
全部ID合成、身份全域唯一、所有人物同当前owner/home；1..32完整人物，统魅智0..100。函数不会从用户传入人数/完成平台数/恢复量派生事实。完整roster的真实性、当前PK getter、固定advisor配置由outer根重放认证。

返回 `{ok:true,requestedGain,receipt}`，receipt含actual `calculateApRecovery` 全部分项、AP before/实际cap增量、当前名单与入选IDs、实际军师fallback理由；没有AP patch或可保存子state。外层只使用requestedGain替换原一次writer，检查该writer实际增量与calculation.actualRecovery一致并记本次current取样时点。AP已满时计算仍成功且actualRecovery=0，不应为凑收益拒Tick。

内部GameState其它字段（year1、turn0、revision0、WAR1/XP0/merit0、兵气金0、无训练/技巧/RNG seed1）只是满足现有静态type及validateState的中性数学投影；实际核不读这些字段，不执行任何command，不回写/保存、不触零值终结。唯一AP取现账本，实际统魅智取原输入。研究技巧在此核完全不读取，空列表不是用于绕过战斗/训练资格。

available代理原active身份、军师缺席fallback、basePK属性选择均是本profile具名推断，非原函数逐指令证明。与亲属关系、治安、人物health无关。不调用EndTurn/whole-season，不恢复人物行动、不补工资、不产生另一日期或AP余额。

仅本地静态候选；无测试、typecheck、build、候选执行、远端写入。旧default20必须保持，最终需整批owner独立静态审和远端候选一致核验；本叶不等world接入或运行通过。

## 当前累计接线状态

此模块自身不认证world事实；当前累计本地候选已由[唯一AP恢复owner](unified-source-ap-recovery-owner-v3.md)以当前角色事实接入，并替换一次恢复writer而非叠加。模块独审不代替完整owner审阅、远端发布或运行验收。
