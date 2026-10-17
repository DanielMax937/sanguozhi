# 普通单挑独立 session API v1

[完整具体规则](../rules/duel-ordinary-session-v1.md) · [来源分级](../sources/duel-ordinary-session-v1.json) · [未运行静态场景](../../data/scenarios/ordinary-duel-example-v1.json)

从engine入口或 `ordinary-duel.ts` 导入：

- `ORDINARY_DUEL_POLICY_V1` / `ORDINARY_DUEL_EVIDENCE_V1`：深冻结完整注册内容
- `createOrdinaryDuel(scenario)` → `{ok:true,session}`
- `inspectOrdinaryDuel(session)` → `{ok:true,inspection:{snapshot,policy,evidence,entryCount,remainingEntryCapacity,canonicalUtf8Bytes}}`
- `previewOrdinaryDuelExchange(session,command)` → `{ok:true,preview:{receipt,projectedSnapshot,policy,evidence,externalRngConsumed:0}}`
- `executeOrdinaryDuelExchange(session,command)` → `{ok:true,session,receipt}`
- `saveOrdinaryDuel(session)` → `{ok:true,json}`，canonical完整envelope
- `loadOrdinaryDuel(json)` → `{ok:true,session}`，从genesis重算全部receipt/终态
- `replayOrdinaryDuel(scenario,commands)` → `{ok:true,session}`，失败无partial结果

失败统一 `{ok:false,reason,index}`。index一般为null；加载/检查session先检查整个输入结构，能定位的结构错误携带entry index，外层或数组描述符错误可能为null；通过结构检查进入重算后报告首个失败entry。replay则按命令顺序检查并报告最早失败命令，scenario/outer-list失败为-1。所有返回深冻结，输入不修改。preview与execute共用完整追加路径和容量预算，preview不返回/提交新日志。

Scenario必需字段是 `schemaVersion,profile,genericOnly,difficulty,policies,participants`；完整policy需传入注册常量，不能只给ID。participants顺序固定挑战方/被挑战方，每人只允许opaque字符串ID、已解析武力、HP、斗志、方针。具体域、每个公式、失败原因和证据等级见规则正文。

唯一command必需字段：`type:'ResolveOrdinaryExchange'`、三个 `expectedRevision/expectedExchangeIndex/expectedBlowCount`、两项 `stances`、三项或条件四项 `rawDraws`。caller不能提供已算结果/伤害/行动者。raw draws不是原生seed；成功receipt的drawCount表示使用的有界原始项，任何API都不消费外部RNG。

独立envelope：`tag,policy,evidence,genesis,snapshot,entries`，tag为`ordinary-duel-session-v1`。它不兼容GameState/replay.ts训练schema，不接训练/部队/势力/城市、任务或人员生命周期。只有三方针普通单挑子集，不是全部单挑。

共同容量是4096条、canonical envelope UTF-8 16MiB、1,000,000值节点、深度32，任一项先到均原子拒绝。条数剩余不代表其他预算足够。inspect/save/load也重算完整历史；canonical JSON不提供签名或外部真实性。

对象输入的严格proxy拒绝依赖 `process.getBuiltinModule('node:util').types.isProxy`；不可用时fail-closed `unsupported-runtime`，不承诺浏览器或旧Node支持。TypeScript仅使用可擦除类型语法；本轮未运行类型检查、产品、测试或任何兼容性诊断。

静态示例文件外层含说明、scenario、commands、paperExpected；调用时取scenario与commands，不把整份带说明的文件当scenario。paperExpected是人工设计预期，不是运行生成的receipt或保存文件。保存文件只能由实际运行API生成；本轮没有生成或宣称已验证任何运行存档。
