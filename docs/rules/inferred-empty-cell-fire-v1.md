# T02：普通火计命中到空格点火的限定消费者

`executeInferredEmptyCellFire` 把 `decideInferredStrategyHit('fire',...)` 的明确推断命中结果连接到已有 `executeHazardCommand(igniteCell)` 的实际独立hazard状态。命中率证据/推断仍见 [推断战斗请求](inferred-combat-requests-v1.md)；火焰生命周期沿 [旧hazard合同](terrain-hazard-lifecycle.md)，不另外伪造原作完整火计规则。

调用参数为hazard初态、expectedRevision、空格cellId、双方显式智力、roll100、资格确认、免疫、必中、美人修正。primitive输入由旧概率核和本层范围校验；hazard初态经旧createHazardState的数据隔离/严格验证。revision须匹配且可递增，处于orders，格存在/未blocked/非unsupported，且不为本hazard唯一部队所在格。未知原生施计距离/人物资格由caller明确提供，不从UI或名称猜。

- 未命中：返回已验证不变state，不抽火寿命RNG，不推进revision，无火焰效果。
- 命中：发送source=strategy、critical=false的旧点火命令；由旧policy消耗独立hazard RNG、决定火寿命/重燃，成功返回真实新state和完整旧hazardReceipt；旧命令失败则没有新状态提交。
- 免疫优先于必中以及美人修正顺序只沿旧推断核。暴击/有人地表火伤/真实人物/伤亡/Closing完全不接入。

这是**效果层适配器**，不是完整施计尝试账本：不消费caster AP、气力、行动，不保存未命中尝试ID，因此不能用它冒充完整防重复施计命令或战役调度。调用方必须自己保留尝试与资格；命中后重用旧revision会拒绝，未命中则世界不变，重复相同输入仍为相同判定。概率roll是显式输入，不从旧hazard RNG二次抽取；不能声称两个随机源融合。

新state可使用既有saveHazardState保存；命中旧receipt可用于旧trace。未命中判定仍是外部审计结果，不写入旧hazard保存schema。旧empty-only默认/RNG边界/火寿命与所有存档均不变。

T02其余伏兵、内讧、妖术的命中核仍可调用，但不把名称统一映射成混乱：具体原作伤害/强制行动/位移/资格尚无完整合同，真实伤亡/归属/Closing排除。没有将“概率有结果”叫全计略世界完成。本适配只闭合已有允许的空格点火效果，无新玩法。仅静态审阅，未执行代码/测试/typecheck/build，运行未验收。
