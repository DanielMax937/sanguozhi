# 规则：按需再生成的有界单回合 v2

[API](../engine/debate-regenerated-round-v2.md) · [来源JSON](../sources/debate-regenerated-round-v2.json) · [旧单回合规则](debate-round-transaction-v1.md) · [实现](../../packages/engine/src/debate-regenerated-round.ts) · [未运行纸面说明](../../data/scenarios/debate-regenerated-round-paper-v2.json)

本页区分固定现代C#来源行为与工程准入，不把静态实现或纸面案例称为运行验证。新版本重构六个既有非会话文件（含原单回合主组合），不修改旧九会话，不新增Closing行为，不减少43主题／45快照证据缺口。

## 1. 来源及一一对应实现

固定仓库 [`tankyc/sango_infinity@a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef`](https://github.com/tankyc/sango_infinity/tree/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef)：

- [Debate.cs](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/Debate.cs)
- [DebatePhase.cs](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/DebatePhase.cs)
- [DebateEnum.cs](https://github.com/tankyc/sango_infinity/blob/a0d8a4f17ec9143c610346b38e523ff2f6eaf6ef/Project/Assets/Sango/Scripts/Game/Debate/DebateEnum.cs)

|规则编号|来源／性质|候选代码与解释|
|---|---|---|
|RG2-01|Debate.cs412–438填牌；18项堆界|`debate-regenerated-fill-internal.ts`：只在真实空槽且cursor18生成，保留跨界前旧堆剩余牌；非空槽不抽牌|
|RG2-02|Debate.cs306–340 DeckGenerate|直接复用 `evaluateDebateDeckGenerate`；生成成功后调用处才重置游标，生成核本身不读写游标|
|RG2-03|Debate.cs323–336话术交换／尾牌|保存返回完整有序话术池，不只保留入堆前4项；话术资格由调用者提供|
|RG2-04|Debate.cs412–438及406–409|所有空槽填完后一次 `completeDebateHandFill`；只在无普通牌且有新槽时修补最后新增槽，然后完整排序|
|RG2-05|Debate.cs491–509、1254–1260；Phase199–209／235–245|共享 `debate-rethink-action.ts` 与 `debate-checked-play.ts` 主体；清牌／填牌／冷静／额度／重选顺序不另抄|
|RG2-06|DebatePhase.cs397–420|共享单回合主体仍普通Attack→Effect→CalcWinner，终局先分类，非终局才进入愤怒|
|RG2-07|原愤怒与回合衔接规则|共享 `debate-anger-transition.ts`、`debate-round-transition.ts`；普通attacker／playedCard不换成combo值；终局不走TurnStart|
|RG2-08|Debate.cs1046–1079|共享 `debate-turn-start.ts`；队0整段完成再队1；实际填牌后才大胆检查／清崩坏|
|RG2-09|显式工程原子性|全部输入语法先验；任一后期失败只返回失败，不泄漏前段成功状态；未用包严格拒绝|
|RG2-10|显式工程有界准入|每队最多12次取牌、一次生成；全轮最多2次生成，事件上界8050为保守和|
|RG2-11|显式工程版本隔离|v1入口保留原政策／依赖／拒绝；新内部主体无伪v1政策，新v2独立包装；旧九会话不动|
|RG2-12|沿用PR128边界|仅CanCritical／显式choice／winType，止于closing-pending；P078、奖励受伤世界写入不含|

以上接口抽取是现有非会话核源码变更，不能称“所有旧核文件未改”。保留v1公开合同属于本次静态对照目标，尚无运行兼容性证据。

## 2. 不允许的捷径

- 不能在轮初或再考前因为cursor18而提前生成；若终局或无空槽，该生成根本不应发生。
- 不能把当前堆仅剩后缀和新堆拼成伪18项输入，也不能丢弃旧堆未消费项。
- 不能把一次跨界填牌拆成“先补旧段、再补新段”两次现有补牌；这会改变修补和排序时机。
- 不能复制DeckGenerate、topic repair、排序或整套出牌／愤怒／回合resolver。
- 不能从用户输入获取函数、hooks、闭包或可执行对象；可信组合回调只由内部代码构造。
- 不能把大生成包按旧小预算截断，也不能削减2000次交换审计；预算不足即候选未完成。
- 不能用“没有全量测试”反过来声称失败；只能明确运行正确性未验证。

## 3. 纸面正反情景要求

纸面文件列13成功／19拒绝情景，内含4个仅helper层面的情景；它们不是32个可执行公共输入，也没有运行。以下列关键静态核对类别：

1. cursor17两个空槽：旧堆最后项→生成→新堆第一项，最后修补／排序一次。
2. cursor18且零空槽：不生成；任何非null包均多余。
3. 再考未耗尽、TurnStart才跨界：使用turnStart包；rethink包非null拒绝。
4. 再考已经生成，之后继续取该真实堆：不再生成或重置；保留真实池顺序。
5. 跨界前后新增牌都为话术：最终只修补最后新增槽，原牌面和来源仍可追溯。
6. 五项话术池：生成返回的五项顺序完整保存，尽管牌堆尾部仅有四槽；另有明确非self-swap纸面情景 `[14,10]→[10,14]` 验证应传播真实返回顺序，而非仅self-swap下值相等。
7. 攻击／愤怒终局：不补牌、不生成、不多减timer，所有未用包必须null。
8. team1最后生成或修补失败：team0生成和先前攻击结果也不返回为可提交状态。
9. 同一队两包、错角色／bound／值、缺项／多项、代理／访问器等均按相应层拒绝。
10. v1同样输入的当前堆耗尽仍原拒绝；v1政策不能替代v2政策；旧会话文件无变化。

## 4. 资源与验证边界

已确定保守事件界：单队再考≤6、最终补牌≤6，全轮生成≤2；`2×4017+16=8050`。代码输入上限为100000节点／64深度／单数组4017／2097152 UTF-8字节；输出4000000节点／128深度／67108864 UTF-8字节，按重复引用实际展开核算，超限整笔 `output-limit`，不截断审计。

输入生成主项32136节点（8034×4），加原round保守32768和新包装／政策小于1000，低于100000；字节以8034×96加262144及新政策小于16 KiB计，低于2 MiB。输出主项8000交换行加3×8034 draw/audit出现，每项保守16节点／512字节，得到513632节点／16436224字节；其他固定状态／非生成／有限元数据按至多128个审计组、每组保守8192节点／256 KiB，再留1048576节点／32 MiB，总计1562208节点／49990656字节（小于48 MiB），低于代码限制。

三份draw出现为生成器consumedDraws、fill randomEvents及顶级events；交换仅完整generator receipt一次。固定leaf上界availability4、calm2、attacker1、attack1（HP≤1）、anger1（entry≤2／combo≤2）、terminal≤1、generator≤2；排除大数组后仅固定政策／证据及七槽手牌、18牌堆、4选择、2pass、16非生成事件，无用户自由长文本。上述是静态保守结构估算，不是测量或精确可达最大；运行输出budget guard继续保留。[API预算段](../engine/debate-regenerated-round-v2.md#5-有界预算与验证状态)说明完整计数规则。

现代参考及局部工程身份不等于原生PK/Vanilla；没有本次执行测试或实验。P078及依赖、人物书籍解析、非恒等hook、全局RNG、教程、长期会话、Closing奖励／受伤／世界写入全部排除。
