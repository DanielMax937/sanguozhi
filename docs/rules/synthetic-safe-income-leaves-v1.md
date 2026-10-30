# I 安全财政/丰收纯叶桥 v1

本地候选，固定源码证据 `f132870bb58505acd0572c23e3ba91592eefa849`；未运行tests/typecheck/build/候选。不是whole season/finance入口，不是已完成WorldTick整合。

## 确定接口及唯一数据

`planSyntheticIncomeLeaves(rawContext, rawConfig)`：

```
context = {cityId,ownerId,turn,date:{year,month,day:1|11|21},
 gold,food,goldCapacity,foodCapacity,security,troops,
 facilities:[30个 null 或 {id,kind,level,complete,position:{q,r}}]}
config = {profile:'synthetic-income-only-leaves-v1',
 baseMoneyWord,baseFoodWord,difficulty:'normal'|'super',controller:'player'|'ai',
 incomeSkills:{taxation,wealthy,levy,riceWay},
 harvestInputs:[{year,month,postMonthlyHarvest}]}
```

- context 是**当前唯一owner**的余额/城市/部队/治安/设施完成态。date 是准备接受的下一旬日期，不由helper推进。outer先核日期恰下一旬、revision/command去重，整个Tick只settle一次。
- config 在outer genesis固定并保存；不能让每次命令任意伪造技能/丰收。真实资料缺失时这些开关/基础word须明确具名推断，不能称观测原生寄存器/技能。harvest年月唯一，月初必须存在对应行，即使本月无food-income也不静默假设false。
- facilities的固定30slot映射/坐标可采用具名推断布局，**complete/level 必须由当前设施owner更新**。不保留另一旧设施快照，不生成新实体。map至财务输入域只使用已有catalog支持的kind/level；未知种类拒绝，不擅自拿forge哨兵替代barracks或workshop。null只能是明确收入视图空槽，不能把实际有收入设施漏掉。
- 城市/owner合成ID；设施ID及坐标唯一且不撞城市/owner。word0..65535、金粮容量0..1e9、security0..100、正兵<=150000、位置±1e6，遵守旧finance adapter域。超域拒绝，不裁掉输入。
- 返回 cityPatch `{goldBefore,goldAfter,foodBefore,foodAfter}` 及所有核input/result/write receipt；不返回长期state或可花独立余额。只给内部私有goldTarget运行money phase，绝不直接修改传入owner。

## 真实调用链白名单

1. `synthetic-safe-income-leaves → applyFinanceMoneyPhase`（internal/finance-money-payroll-phases.ts）。其实际调用 deriveFinanceMoneyInput、calculateCityMoneyIncomeProjection、readFinanceMoneyRequest、creditFinanceMoney；运行依赖只有纯projection、finance catalog/source JSON。
2. 提取原 `city-finance-lifecycle.ts:266–272` 的 foodInput 适配器：实际farm/已完成granary轴坐标邻接，已有typeWords/yields、difficulty/controller/security，完成military-farm时传当前troops。
3. `calculateCityFoodIncomeProjection`（仅source JSON import）；再 `calculateMonthlyCityFoodBaseArgument`（仅source JSON import）。校验signed/u32一致、非负和原安全域后才使用返回。
4. 原 `city-finance-lifecycle.ts:277–280` 饱和credit中性行为：accepted=min(requested,cap-before)，record discard；只提取此叶，不import/call整个文件。

**零个whole finance/season execute/load/preview/replay调用；不调用salary phase、seasonal-security phase、specialty phase、health/plague/P078/Closing。** money-phase所在module虽然定义salary函数，本helper没有调用它；不以此为借口执行模块里的其他阶段。

完整实际source取证在 `san11-neutral-food-leaf-20261030/evidence/`：city-finance-lifecycle、finance-money-payroll-leaves/phases/types、city-money-income-projection、city-food-income-projection、monthly-city-food-base-argument；不是执行这些源代码。设施/政策表由固定ref实际读取并与import名称核对。

## 保持已有财政/丰收行为，不新造倍率

- 非月初且无taxation：money not-due。
- taxation：floor(m/2)每旬；否则月初m。月初wealthy额外floor(h/2)，依据请求base而非受容量截断后的accepted；逐笔饱和与discard保留。
- food：仅月初且季度月1/4/7/10或levy。使用旧完整food核，monthly leaf已有丰收/征收倍率及整型顺序保持，不重写为浮点乘法。
- harvest使用绑定当月的postMonthlyHarvest明确0/1；这是既有finance适配，不是假称截获原生EAX。quarter riceWay额外floor(j/2)，同样依请求额、独立容量饱和。
- 金/粮为0允许；不损兵、不改归属，不跑饿死或部队终结。超容量增加有discard，不虚增余额。

## 与既有世界阶段的边界

现metadata已经处理月工资和自然忠诚，必须保留其唯一职责，不能因引入income而再调用full salary。AP不在本helper输入/输出，不恢复第二次。security只读，不能隐式季度扣治安。没有人物奖励/受伤。

与工资、粮耗、field火、建设完成的相对排序需由新outer profile显式固定：可选择income→现工资/自然→中性耗粮→field阶段，但这是工程排序推断，不自动覆盖旧profile。阶段失败需连同income提案一起丢弃，不先落金再报粮核失败。parent/owner实际接入Tick并独立静态审阅前，不能称“世界结算已接通”。

## 后续静态审阅重点

完整30slot绑定与未知种类拒绝；财务余额来自同一current；月初未绑定harvest拒绝；taxation非月初正确触发而wealthy不触发；bonus基于请求额；溢出/符号不一致整笔拒；不重复工资/AP；失败无半patch；固定config+完整outer history重放；所有非候选字段不改。此为审查要求，不是已跑测试声明。
