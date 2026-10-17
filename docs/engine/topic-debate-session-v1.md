# 普通话题牌独立舌战 API v1

[完整规则、全部字段/公式/顺序/失败](../rules/debate-topic-session-v1.md) · [固定来源与全部policy](../sources/debate-topic-session-v1.json) · [五轮纸面设计，未运行](../../data/scenarios/topic-debate-example-v1.json)

从engine入口或`topic-debate.ts`导入：

- `TOPIC_DEBATE_POLICY_V1` / `TOPIC_DEBATE_EVIDENCE_V1`：完整深冻结常量
- `createTopicDebate(scenario)` → `{ok:true,session}`
- `inspectTopicDebate(session)` → `{ok:true,inspection:{snapshot,policy,evidence,entryCount,remainingEntryCapacity,canonicalUtf8Bytes}}`
- `previewTopicDebateRound(session,command)` → `{ok:true,preview:{receipt,projectedSnapshot,policy,evidence,externalRngConsumed:0}}`
- `executeTopicDebateRound(session,command)` → `{ok:true,session,receipt}`
- `saveTopicDebate(session)` → `{ok:true,json}`，canonical完整session
- `loadTopicDebate(json)` → `{ok:true,session}`，重算genesis、每条receipt与final snapshot
- `replayTopicDebate(scenario,commands)` → `{ok:true,session}`，首错误原子失败，无partial结果

失败为`{ok:false,reason,index}`。一般null；session对象先整体安全分离，能定位的entry结构错误给0-based index，外层/数组描述符错误可能null；结构通过后重算给首失败entry。replay场景/外层列表错误为-1，之后按命令逐项分离/执行并给首失败命令index，不先扫描后续命令的内部。详见规则§11。

Scenario仅`schemaVersion:1,profile:'debate-topic-only-reference-v1',genericOnly:true,difficulty:'source-normal',policies,challengerId,initialTopic,participants`。policies必须完整注册内容。两人均仅`id,resolvedIntelligence,hp:1000,stress:0,angerTimer:0,cardTape`；cardTape显式有序`{topic,level}`，每方至多512张，须足初始3/4/5/6普通手牌。源4/5/6/7总槽位包含保留再考槽；没有可用再考按钮。

Command仅`type:'ResolveTopicRound',expectedRevision,expectedRoundIndex,expectedFirstId,choices,rawDraws`。choices按scenario顺序，恰好两项`{participantId,cardToken}`。token来自当前hand，格式`id:tapeIndex`；模板重复不等于同张牌。平局rawDraws必须空，胜负恰一项`{role:'psychological-damage-jitter',bound:5,value:0..4}`。请求不接受外部计算的power/attack/damage/winner。

Session tag=`topic-debate-session-v1`，envelope=`tag,policy,evidence,genesis,snapshot,entries`。genesis=`scenario,snapshot`，含完整牌序及重新计算初局；entries=`command,receipt`。每个API均重算输入session，不信任attack/cursor/手牌/结果；所有输出深冻结，输入不修改。save不是加密签名，不认证外部真实游戏记录。

HP终局优先于stress100、崩坏、topic/first更新和补牌；终局牌带耗尽不阻止胜利。非终局stress100或补牌不足均整轮拒绝，不cap99、不跳过愤激。preview使用与execute完全相同的完整追加预算，不提交日志；无外部RNG消耗。共同预算4096条、16MiB canonical UTF-8、100万节点、深32，条数剩余不保证其他预算足够。

Node严格plain/proxy检查依赖`process.getBuiltinModule('node:util').types.isProxy`，无此内建入口时`unsupported-runtime`；代码只使用可擦除TypeScript语法，无参数属性。没有运行typecheck、编译、测试、checker、产品、诊断或样例，未改旧测试，不能声称已验证Node兼容性。

静态场景外层有说明/scenario/commands/paperExpected。使用时取scenario和commands，不把整份说明文件传入create。paperExpected是人工设计，不是运行receipt/存档。本批没有生成“运行存档”。本接口独立于training-kernel-v2、外交、城市/势力/奖励和任何native人员任务；普通子集不等于完整舌战。
