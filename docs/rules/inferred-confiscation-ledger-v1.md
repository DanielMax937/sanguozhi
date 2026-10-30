# T28：合成没收延续账本 v1

新模块消费经完整验证的 [合成宝物账本](inferred-treasure-ledger-v1.md) 作为不可修改初始历史，随后实际记录没收事务；不是原作没收惩罚已恢复。AP取旧 `projectInferredCommandAP('confiscateTreasure', false)` 的明确推断10。**唯一新惩罚选择：扣真忠诚等于物品value**，命名为本profile工程推断；授予加value并不证明没收一定减value，不以对称性伪造证据。

`createInferredConfiscationLedger(initialTreasury)` 先全重放旧合成授予历史，保存其初值与命令作为新的不可变起点。后续没收不回写旧账本、不把新state冒充旧schema。自身最多64条命令，严格字段id、expectedRevision、itemId、eligibilityConfirmed:true；合成ID与旧一致，唯一命令、连续revision。资格由调用方对合成演练确认，不扫描真实人物。

`executeInferredConfiscation` 查物品当前holder，须不是府库且对应合成人员存在，AP足够10、忠诚扣value后严格大于0。全部验证后原子归还同一物品至府库、扣忠诚和AP，物品不生成/删除；重复没收已回库物品失败。零价值可归库且扣AP，忠诚不变。归零/负数整条拒绝，不钳到1，不处理离反/归属/死亡/Closing。

state严格只有schema、initialTreasury、commands；每次read/execute/save/load重新验证起点和全部没收序列，余额/回执只派生。输入有界descriptor隔离、Node可用时拒Proxy；其他runtime仅面向可信普通数据、不能保证Proxy反射无副作用。标准JSON.parse文本限10万字符，重复键last-wins，不是防作弊签名。复制深度允许嵌套旧账本，旧状态保持不动。

没有再授予/交易/补AP/装备效果/自然忠诚/真实人物归属命令，调用方不能把延续账本的物品投影当可直接覆写旧保存。此次闭合明确没收事务，不声称完整物品系统/全局融合。未运行测试、typecheck、build或候选，运行未验收。
