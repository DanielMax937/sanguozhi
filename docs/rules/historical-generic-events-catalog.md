# PR43：通用事件的33条来源观察

本页覆盖Wiki88的31条通用事件观察，以及游民2009年的2条补充观察，对应31个资料事件标识。并非原游戏完整事件表。仅标题、仅条件、定性结果及未验证轶闻都保留原有等级。

全部记录都是公开攻略转录，executionEnabled=false。资料未给出原生事件ID、已确认的触发概率或一次性标志。条件空白表示来源未述，不表示无条件；结果空白不表示没有变化。列举顺序只是攻略描述顺序，不是原生写入/回调顺序。

来源数据：[Wiki观察](../../data/generic-events/atwiki-88.json)、[游民观察](../../data/generic-events/gamersky-2009.json)；[来源映射与10项未决](historical-generic-events-inventory.md)。

## Wiki88：31条

资料集：san11.generic.atwiki88.20261007

版本范围：版本种类（edition）：未指定（unspecified）；平台（platform）：未知／未给出（null）；补丁（patch）：未知／未给出（null）；依据（basis）：未述（not-stated）

### generic.atwiki88.01：統一前反乱疑惑

- 事件标识：generic.pre-unification-rebellion-suspicion
- 来源：[atwiki-88-generic](https://w.atwiki.jp/sangokushi11/pages/88.html)；章节：統一前反乱疑惑；序号：1；序号范围：selected-generic-section；行：1127–1152
- 版本范围：版本种类（edition）：未指定（unspecified）；平台（platform）：未知／未给出（null）；补丁（patch）：未知／未给出（null）；依据（basis）：未述（not-stated）
- 证据：公开攻略转录（public-guide-transcription）；执行：否（false）
- 原生事件ID：未知／未给出（null）；仅发生一次：未述（not-stated）；标志ID：未知／未给出（null）；触发概率：未知／未给出（null）
- 覆盖：有实质条件与结果（substantive）；条件完整性：来源局部描述（partial-source-description）；结果完整性：来源局部描述（partial-source-description）

#### 条件

1. 剧本开始已过至少360日。
   - 作用范围：event；确定性：来源明确陈述（source-stated）；来源行：1131–1131
   - 数量：scenario-elapsed；关系：大于或等于（gte）；值：360；单位：days

2. 当前为1、4、7或10月的1日。
   - 作用范围：event；确定性：来源明确陈述（source-stated）；来源行：1132–1132
   - 数量：calendar-month；关系：为列举值之一（one-of）；值：1、4、7、10；单位：month
   - 数量：calendar-day；关系：等于（eq）；值：1；单位：day

3. 君主爵位为王或皇帝。
   - 作用范围：event；确定性：来源明确陈述（source-stated）；来源行：1133–1133
   - 数量字段：空列表（无额外数值记录）

4. 支配至少35座城市。
   - 作用范围：event；确定性：来源明确陈述（source-stated）；来源行：1134–1134
   - 数量：controlled-cities；关系：大于或等于（gte）；值：35；单位：cities

5. 至少两个军团。
   - 作用范围：event；确定性：来源明确陈述（source-stated）；来源行：1135–1135
   - 数量：legions；关系：大于或等于（gte）；值：2；单位：legions

6. 君主、被怀疑武将、密告武将均不在任务中。
   - 作用范围：event；确定性：来源明确陈述（source-stated）；来源行：1136–1136
   - 数量字段：空列表（无额外数值记录）

7. 至少一名被怀疑候选：都督，与君主非血缘、亲子、配偶、义兄弟，忠诚不足100。
   - 作用范围：suspect-candidate-exists；确定性：来源明确陈述（source-stated）；来源行：1137–1140
   - 数量：candidate-count；关系：大于或等于（gte）；值：1；单位：officers
   - 数量：suspect-loyalty；关系：小于（lt）；值：100；单位：loyalty

8. 至少一名密告候选：义理低；与君主及身为都督的武将均非血缘、亲子、配偶、义兄弟；属于君主势力，并与君主同据点。原文未给低义理阈值，也未明确多个都督时的量词范围。
   - 作用范围：informer-candidate-exists；确定性：来源明确陈述（source-stated）；来源行：1141–1146
   - 数量：candidate-count；关系：大于或等于（gte）；值：1；单位：officers
   - 数量：low-duty-threshold；关系：未知（unknown）；值：未知／未给出（null）；单位：duty

#### 结果

1. 处罚密告武将时，其忠诚减少20。
   - 作用范围：punish-informer；确定性：来源明确陈述（source-stated）；来源行：1147–1148
   - 数量：informer-loyalty；关系：增减量（delta）；值：-20；单位：loyalty

2. 处罚被怀疑武将时，该武将独立；全体部下忠诚减少5；所有支配城市治安减少10。
   - 作用范围：punish-suspect；确定性：来源明确陈述（source-stated）；来源行：1149–1152
   - 数量：subordinates-loyalty；关系：增减量（delta）；值：-5；单位：loyalty
   - 数量：controlled-cities-order；关系：增减量（delta）；值：-10；单位：public-order

#### 注释

1. 密告引出对部下谋反的怀疑。
   - 作用范围：event；确定性：来源明确陈述（source-stated）；来源行：1129–1129
   - 数量字段：空列表（无额外数值记录）

### generic.atwiki88.02：銅雀台

- 事件标识：generic.bronze-sparrow-acquisition
- 来源：[atwiki-88-generic](https://w.atwiki.jp/sangokushi11/pages/88.html)；章节：銅雀台；序号：2；序号范围：selected-generic-section；行：1153–1166
- 版本范围：版本种类（edition）：未指定（unspecified）；平台（platform）：未知／未给出（null）；补丁（patch）：未知／未给出（null）；依据（basis）：未述（not-stated）
- 证据：公开攻略转录（public-guide-transcription）；执行：否（false）
- 原生事件ID：未知／未给出（null）；仅发生一次：未述（not-stated）；标志ID：未知／未给出（null）；触发概率：未知／未给出（null）
- 覆盖：有实质条件与结果（substantive）；条件完整性：来源局部描述（partial-source-description）；结果完整性：来源局部描述（partial-source-description）

#### 条件

1. 君主由玩家控制。
   - 作用范围：event；确定性：来源明确陈述（source-stated）；来源行：1157–1157
   - 数量字段：空列表（无额外数值记录）

2. 剧本开始已过至少360日。
   - 作用范围：event；确定性：来源明确陈述（source-stated）；来源行：1158–1158
   - 数量：scenario-elapsed；关系：大于或等于（gte）；值：360；单位：days

3. 支配ギョウ，且君主在ギョウ。地名保留该来源写法。
   - 作用范围：event；确定性：来源明确陈述（source-stated）；来源行：1159–1161
   - 数量字段：空列表（无额外数值记录）

4. 支配至少10座城市。
   - 作用范围：event；确定性：来源明确陈述（source-stated）；来源行：1160–1160
   - 数量：controlled-cities；关系：大于或等于（gte）；值：10；单位：cities

5. 君主爵位属于大将軍、公、王、皇帝之一。
   - 作用范围：event；确定性：来源明确陈述（source-stated）；来源行：1162–1162
   - 数量字段：空列表（无额外数值记录）

6. 銅雀物品尚未登场，君主不在任务中。
   - 作用范围：event；确定性：来源明确陈述（source-stated）；来源行：1163–1164
   - 数量字段：空列表（无额外数值记录）

#### 结果

1. 描述君主收下农民发现的铜雀。
   - 作用范围：event；确定性：来源明确陈述（source-stated）；来源行：1155–1155
   - 数量字段：空列表（无额外数值记录）

2. 取得之后可以开发铜雀台；开发后持续提高技术力。此句位于来源的条件列表尾部，含义是取得后的说明，不作为触发条件；数额与频率未给出。
   - 作用范围：event；确定性：来源明确陈述（source-stated）；来源行：1165–1165
   - 数量：technology-increase；关系：定性描述（qualitative）；值：未知／未给出（null）；单位：unspecified

#### 注释

本记录未列注释

### generic.atwiki88.03：推挙－文官

- 事件标识：generic.recommend-civil-officer
- 来源：[atwiki-88-generic](https://w.atwiki.jp/sangokushi11/pages/88.html)；章节：推挙－文官；序号：3；序号范围：selected-generic-section；行：1167–1170
- 版本范围：版本种类（edition）：未指定（unspecified）；平台（platform）：未知／未给出（null）；补丁（patch）：未知／未给出（null）；依据（basis）：未述（not-stated）
- 证据：公开攻略转录（public-guide-transcription）；执行：否（false）
- 原生事件ID：未知／未给出（null）；仅发生一次：未述（not-stated）；标志ID：未知／未给出（null）；触发概率：未知／未给出（null）
- 覆盖：未验证轶闻（unverified-anecdote）；条件完整性：未述（not-stated）；结果完整性：未述（not-stated）

#### 条件

来源未述；不表示无条件触发

#### 结果

来源未述；不表示没有状态变化

#### 注释

1. 来源明确标为未验证轶闻：仅剩一城、两名武将且受大军攻击时，连续两回合遇到事件；这是一次局面报告，不能当作必要条件或重复概率。
   - 作用范围：event；确定性：来源未验证（source-unverified）；来源行：1169–1169
   - 数量：reported-cities；关系：等于（eq）；值：1；单位：cities
   - 数量：reported-officers；关系：等于（eq）；值：2；单位：officers
   - 数量：reported-consecutive-turns；关系：等于（eq）；值：2；单位：turns

2. 该未验证记录称舌战获胜即可登用，并以问号猜测部下与君主相性好可能有关。没有确立通用招募结果或相性阈值。
   - 作用范围：event；确定性：来源未验证（source-unverified）；来源行：1169–1169
   - 数量：compatibility-threshold；关系：未知（unknown）；值：未知／未给出（null）；单位：unspecified

### generic.atwiki88.04：推挙－武官

- 事件标识：generic.recommend-military-officer
- 来源：[atwiki-88-generic](https://w.atwiki.jp/sangokushi11/pages/88.html)；章节：推挙－武官；序号：4；序号范围：selected-generic-section；行：1171–1171
- 版本范围：版本种类（edition）：未指定（unspecified）；平台（platform）：未知／未给出（null）；补丁（patch）：未知／未给出（null）；依据（basis）：未述（not-stated）
- 证据：公开攻略转录（public-guide-transcription）；执行：否（false）
- 原生事件ID：未知／未给出（null）；仅发生一次：未述（not-stated）；标志ID：未知／未给出（null）；触发概率：未知／未给出（null）
- 覆盖：仅标题（heading-only）；条件完整性：未述（not-stated）；结果完整性：未述（not-stated）

#### 条件

来源未述；不表示无条件触发

#### 结果

来源未述；不表示没有状态变化

#### 注释

本记录未列注释

### generic.atwiki88.05：五虎将

- 事件标识：generic.five-tiger-generals
- 来源：[atwiki-88-generic](https://w.atwiki.jp/sangokushi11/pages/88.html)；章节：五虎将；序号：5；序号范围：selected-generic-section；行：1172–1192
- 版本范围：版本种类（edition）：未指定（unspecified）；平台（platform）：未知／未给出（null）；补丁（patch）：未知／未给出（null）；依据（basis）：未述（not-stated）
- 证据：公开攻略转录（public-guide-transcription）；执行：否（false）
- 原生事件ID：未知／未给出（null）；仅发生一次：未述（not-stated）；标志ID：未知／未给出（null）；触发概率：未知／未给出（null）
- 覆盖：有实质条件与结果（substantive）；条件完整性：来源局部描述（partial-source-description）；结果完整性：来源局部描述（partial-source-description）

#### 条件

1. 君主爵位公以上，支配至少10座城市。
   - 作用范围：event；确定性：来源明确陈述（source-stated）；来源行：1174–1175
   - 数量：controlled-cities；关系：大于或等于（gte）；值：10；单位：cities

2. 已经任命军师，且军师在城市内、未出阵。
   - 作用范围：event；确定性：来源明确陈述（source-stated）；来源行：1176–1176
   - 数量字段：空列表（无额外数值记录）

3. 上述条件下，来源指定1、4、7、10月的初旬。初旬保留为十日时段，不改成每月1日。
   - 作用范围：event；确定性：来源明确陈述（source-stated）；来源行：1177–1177
   - 数量：calendar-month；关系：为列举值之一（one-of）；值：1、4、7、10；单位：month

4. 之后筛选五虎将候选：武力至少90、功绩至少20000、忠诚100，且未被任命为军师。来源未说明同分、多于五名或不足五名时的选择办法。
   - 作用范围：candidate-selection；确定性：来源明确陈述（source-stated）；来源行：1181–1186
   - 数量：strength；关系：大于或等于（gte）；值：90；单位：ability
   - 数量：merit；关系：大于或等于（gte）；值：20000；单位：merit
   - 数量：loyalty；关系：等于（eq）；值：100；单位：loyalty

#### 结果

1. 被选武将功绩增加2000。
   - 作用范围：selected-officers；确定性：来源明确陈述（source-stated）；来源行：1188–1188
   - 数量：merit；关系：增减量（delta）；值：2000；单位：merit

2. 被选武将的武力、统率及兵科适性经验增加，数额未给。
   - 作用范围：selected-officers；确定性：来源明确陈述（source-stated）；来源行：1189–1189
   - 数量：strength-experience；关系：定性描述（qualitative）；值：未知／未给出（null）；单位：experience
   - 数量：leadership-experience；关系：定性描述（qualitative）；值：未知／未给出（null）；单位：experience
   - 数量：troop-aptitude-experience；关系：定性描述（qualitative）；值：未知／未给出（null）；单位：experience

#### 注释

1. 来源猜测经验量大致相当于研究四级技巧，不能由此填入精确经验数值。
   - 作用范围：event；确定性：来源带不确定性（source-uncertain）；来源行：1189–1189
   - 数量字段：空列表（无额外数值记录）

2. 来源称在事件月份前一回合解任军师或令其出阵，可把该季事件推迟到下一季；这里只保留攻略建议，不证明实际调度顺序。
   - 作用范围：event；确定性：来源明确陈述（source-stated）；来源行：1191–1191
   - 数量字段：空列表（无额外数值记录）

### generic.atwiki88.06：遺跡発見

- 事件标识：generic.discover-ruins
- 来源：[atwiki-88-generic](https://w.atwiki.jp/sangokushi11/pages/88.html)；章节：遺跡発見；序号：6；序号范围：selected-generic-section；行：1193–1194
- 版本范围：版本种类（edition）：未指定（unspecified）；平台（platform）：未知／未给出（null）；补丁（patch）：未知／未给出（null）；依据（basis）：未述（not-stated）
- 证据：公开攻略转录（public-guide-transcription）；执行：否（false）
- 原生事件ID：未知／未给出（null）；仅发生一次：未述（not-stated）；标志ID：未知／未给出（null）；触发概率：未知／未给出（null）
- 覆盖：仅标题（heading-only）；条件完整性：未述（not-stated）；结果完整性：未述（not-stated）

#### 条件

来源未述；不表示无条件触发

#### 结果

来源未述；不表示没有状态变化

#### 注释

本记录未列注释

### generic.atwiki88.07：廟発見

- 事件标识：generic.discover-shrine
- 来源：[atwiki-88-generic](https://w.atwiki.jp/sangokushi11/pages/88.html)；章节：廟発見；序号：7；序号范围：selected-generic-section；行：1195–1196
- 版本范围：版本种类（edition）：未指定（unspecified）；平台（platform）：未知／未给出（null）；补丁（patch）：未知／未给出（null）；依据（basis）：未述（not-stated）
- 证据：公开攻略转录（public-guide-transcription）；执行：否（false）
- 原生事件ID：未知／未给出（null）；仅发生一次：未述（not-stated）；标志ID：未知／未给出（null）；触发概率：未知／未给出（null）
- 覆盖：仅标题（heading-only）；条件完整性：未述（not-stated）；结果完整性：未述（not-stated）

#### 条件

来源未述；不表示无条件触发

#### 结果

来源未述；不表示没有状态变化

#### 注释

本记录未列注释

### generic.atwiki88.08：遺跡、廟破壊

- 事件标识：generic.destroy-ruins-or-shrine
- 来源：[atwiki-88-generic](https://w.atwiki.jp/sangokushi11/pages/88.html)；章节：遺跡、廟破壊；序号：8；序号范围：selected-generic-section；行：1197–1198
- 版本范围：版本种类（edition）：未指定（unspecified）；平台（platform）：未知／未给出（null）；补丁（patch）：未知／未给出（null）；依据（basis）：未述（not-stated）
- 证据：公开攻略转录（public-guide-transcription）；执行：否（false）
- 原生事件ID：未知／未给出（null）；仅发生一次：未述（not-stated）；标志ID：未知／未给出（null）；触发概率：未知／未给出（null）
- 覆盖：仅标题（heading-only）；条件完整性：未述（not-stated）；结果完整性：未述（not-stated）

#### 条件

来源未述；不表示无条件触发

#### 结果

来源未述；不表示没有状态变化

#### 注释

本记录未列注释

### generic.atwiki88.09：少帝即位

- 事件标识：generic.shao-emperor-accession
- 来源：[atwiki-88-generic](https://w.atwiki.jp/sangokushi11/pages/88.html)；章节：少帝即位；序号：9；序号范围：selected-generic-section；行：1199–1200
- 版本范围：版本种类（edition）：未指定（unspecified）；平台（platform）：未知／未给出（null）；补丁（patch）：未知／未给出（null）；依据（basis）：未述（not-stated）
- 证据：公开攻略转录（public-guide-transcription）；执行：否（false）
- 原生事件ID：未知／未给出（null）；仅发生一次：未述（not-stated）；标志ID：未知／未给出（null）；触发概率：未知／未给出（null）
- 覆盖：仅标题（heading-only）；条件完整性：未述（not-stated）；结果完整性：未述（not-stated）

#### 条件

来源未述；不表示无条件触发

#### 结果

来源未述；不表示没有状态变化

#### 注释

本记录未列注释

### generic.atwiki88.10：献帝即位

- 事件标识：generic.xian-emperor-accession
- 来源：[atwiki-88-generic](https://w.atwiki.jp/sangokushi11/pages/88.html)；章节：献帝即位；序号：10；序号范围：selected-generic-section；行：1201–1202
- 版本范围：版本种类（edition）：未指定（unspecified）；平台（platform）：未知／未给出（null）；补丁（patch）：未知／未给出（null）；依据（basis）：未述（not-stated）
- 证据：公开攻略转录（public-guide-transcription）；执行：否（false）
- 原生事件ID：未知／未给出（null）；仅发生一次：未述（not-stated）；标志ID：未知／未给出（null）；触发概率：未知／未给出（null）
- 覆盖：仅标题（heading-only）；条件完整性：未述（not-stated）；结果完整性：未述（not-stated）

#### 条件

来源未述；不表示无条件触发

#### 结果

来源未述；不表示没有状态变化

#### 注释

本记录未列注释

### generic.atwiki88.11：献帝崩御

- 事件标识：generic.xian-emperor-death
- 来源：[atwiki-88-generic](https://w.atwiki.jp/sangokushi11/pages/88.html)；章节：献帝崩御；序号：11；序号范围：selected-generic-section；行：1203–1203
- 版本范围：版本种类（edition）：未指定（unspecified）；平台（platform）：未知／未给出（null）；补丁（patch）：未知／未给出（null）；依据（basis）：未述（not-stated）
- 证据：公开攻略转录（public-guide-transcription）；执行：否（false）
- 原生事件ID：未知／未给出（null）；仅发生一次：未述（not-stated）；标志ID：未知／未给出（null）；触发概率：未知／未给出（null）
- 覆盖：仅标题（heading-only）；条件完整性：未述（not-stated）；结果完整性：未述（not-stated）

#### 条件

来源未述；不表示无条件触发

#### 结果

来源未述；不表示没有状态变化

#### 注释

本记录未列注释

### generic.atwiki88.12：旅人訪問・管輅

- 事件标识：generic.visit-guan-lu
- 来源：[atwiki-88-generic](https://w.atwiki.jp/sangokushi11/pages/88.html)；章节：旅人訪問・管輅；序号：12；序号范围：selected-generic-section；行：1204–1212
- 版本范围：版本种类（edition）：未指定（unspecified）；平台（platform）：未知／未给出（null）；补丁（patch）：未知／未给出（null）；依据（basis）：未述（not-stated）
- 证据：公开攻略转录（public-guide-transcription）；执行：否（false）
- 原生事件ID：未知／未给出（null）；仅发生一次：未述（not-stated）；标志ID：未知／未给出（null）；触发概率：未知／未给出（null）
- 覆盖：仅条件（conditions-only）；条件完整性：来源局部描述（partial-source-description）；结果完整性：未述（not-stated）

#### 条件

1. 执行人才探索，管輅存在。
   - 作用范围：event；确定性：来源明确陈述（source-stated）；来源行：1207–1208
   - 数量字段：空列表（无额外数值记录）

2. 探索武将有亲爱、嫌恶武将。原文并列关系保留，不扩写成某个具体人物或另一种关系判定；AND/OR范围未决。
   - 作用范围：event；确定性：来源表述歧义（source-ambiguous）；来源行：1209–1209
   - 数量字段：空列表（无额外数值记录）

3. 没有蝗灾或疫病；执行探索的城市治安至少90。
   - 作用范围：event；确定性：来源明确陈述（source-stated）；来源行：1210–1211
   - 数量：search-city-order；关系：大于或等于（gte）；值：90；单位：public-order

#### 结果

来源未述；不表示没有状态变化

#### 注释

1. 来源称探索武将魅力越高越容易发生，未提供概率或公式。
   - 作用范围：event；确定性：来源明确陈述（source-stated）；来源行：1211–1211
   - 数量：trigger-probability；关系：未知（unknown）；值：未知／未给出（null）；单位：probability

### generic.atwiki88.13：旅人訪問・許劭

- 事件标识：generic.visit-xu-shao
- 来源：[atwiki-88-generic](https://w.atwiki.jp/sangokushi11/pages/88.html)；章节：旅人訪問・許劭；序号：13；序号范围：selected-generic-section；行：1213–1220
- 版本范围：版本种类（edition）：未指定（unspecified）；平台（platform）：未知／未给出（null）；补丁（patch）：未知／未给出（null）；依据（basis）：未述（not-stated）
- 证据：公开攻略转录（public-guide-transcription）；执行：否（false）
- 原生事件ID：未知／未给出（null）；仅发生一次：未述（not-stated）；标志ID：未知／未给出（null）；触发概率：未知／未给出（null）
- 覆盖：仅条件（conditions-only）；条件完整性：来源局部描述（partial-source-description）；结果完整性：未述（not-stated）

#### 条件

1. 执行人才探索，許劭存在。
   - 作用范围：event；确定性：来源明确陈述（source-stated）；来源行：1216–1217
   - 数量字段：空列表（无额外数值记录）

2. 没有蝗灾或疫病；执行探索的城市治安至少90。
   - 作用范围：event；确定性：来源明确陈述（source-stated）；来源行：1218–1219
   - 数量：search-city-order；关系：大于或等于（gte）；值：90；单位：public-order

#### 结果

来源未述；不表示没有状态变化

#### 注释

本记录未列注释

### generic.atwiki88.14：旅人訪問・華佗

- 事件标识：generic.visit-hua-tuo
- 来源：[atwiki-88-generic](https://w.atwiki.jp/sangokushi11/pages/88.html)；章节：旅人訪問・華佗；序号：14；序号范围：selected-generic-section；行：1221–1221
- 版本范围：版本种类（edition）：未指定（unspecified）；平台（platform）：未知／未给出（null）；补丁（patch）：未知／未给出（null）；依据（basis）：未述（not-stated）
- 证据：公开攻略转录（public-guide-transcription）；执行：否（false）
- 原生事件ID：未知／未给出（null）；仅发生一次：未述（not-stated）；标志ID：未知／未给出（null）；触发概率：未知／未给出（null）
- 覆盖：仅标题（heading-only）；条件完整性：未述（not-stated）；结果完整性：未述（not-stated）

#### 条件

来源未述；不表示无条件触发

#### 结果

来源未述；不表示没有状态变化

#### 注释

本记录未列注释

### generic.atwiki88.15：旅人訪問・于吉

- 事件标识：generic.visit-yu-ji
- 来源：[atwiki-88-generic](https://w.atwiki.jp/sangokushi11/pages/88.html)；章节：旅人訪問・于吉；序号：15；序号范围：selected-generic-section；行：1222–1234
- 版本范围：版本种类（edition）：未指定（unspecified）；平台（platform）：未知／未给出（null）；补丁（patch）：未知／未给出（null）；依据（basis）：未述（not-stated）
- 证据：公开攻略转录（public-guide-transcription）；执行：否（false）
- 原生事件ID：未知／未给出（null）；仅发生一次：未述（not-stated）；标志ID：未知／未给出（null）；触发概率：未知／未给出（null）
- 覆盖：有实质条件与结果（substantive）；条件完整性：来源局部描述（partial-source-description）；结果完整性：来源局部描述（partial-source-description）

#### 条件

1. 执行人才探索；于吉在执行探索的城市。
   - 作用范围：event；确定性：来源明确陈述（source-stated）；来源行：1225–1226
   - 数量字段：空列表（无额外数值记录）

2. 探索城市没有疫病或蝗灾，治安至少90，资金至少2001。
   - 作用范围：event；确定性：来源明确陈述（source-stated）；来源行：1227–1229
   - 数量：search-city-order；关系：大于或等于（gte）；值：90；单位：public-order
   - 数量：search-city-gold；关系：大于或等于（gte）；值：2001；单位：gold

#### 结果

1. 于吉询问是否交付1000金。原文称无论选择何项，执行武将魅力经验上升，但该用语对后列第三个斩杀选项是否同样适用未决，不能据此定义全选项共同效果。
   - 作用范围：choice-prompt-unresolved-xp-scope；确定性：来源表述歧义（source-ambiguous）；来源行：1231–1231
   - 数量：offered-payment；关系：等于（eq）；值：1000；单位：gold
   - 数量：charm-experience；关系：定性描述（qualitative）；值：未知／未给出（null）；单位：experience

2. 选择交付1000金：技巧点增加50。该段未写实际扣款顺序或资源不足处理。
   - 作用范围：give-gold；确定性：来源明确陈述（source-stated）；来源行：1232–1232
   - 数量：technology-points；关系：增减量（delta）；值：50；单位：points

3. 选择不交金：义勇兵聚集，兵数上升，具体数量未给。不能用此补全单独的义勇兵空标题。
   - 作用范围：decline-gold；确定性：来源明确陈述（source-stated）；来源行：1233–1233
   - 数量：soldiers；关系：定性描述（qualitative）；值：未知／未给出（null）；单位：soldiers

4. 选择斩杀于吉：治安减少20，执行武将濒死。未明写于吉死亡的后续存储或flag。
   - 作用范围：execute-yu-ji；确定性：来源明确陈述（source-stated）；来源行：1234–1234
   - 数量：public-order；关系：增减量（delta）；值：-20；单位：public-order

#### 注释

本记录未列注释

### generic.atwiki88.16：旅人訪問・禰衡

- 事件标识：generic.visit-mi-heng
- 来源：[atwiki-88-generic](https://w.atwiki.jp/sangokushi11/pages/88.html)；章节：旅人訪問・禰衡；序号：16；序号范围：selected-generic-section；行：1235–1248
- 版本范围：版本种类（edition）：未指定（unspecified）；平台（platform）：未知／未给出（null）；补丁（patch）：未知／未给出（null）；依据（basis）：未述（not-stated）
- 证据：公开攻略转录（public-guide-transcription）；执行：否（false）
- 原生事件ID：未知／未给出（null）；仅发生一次：未述（not-stated）；标志ID：未知／未给出（null）；触发概率：未知／未给出（null）
- 覆盖：有实质条件与结果（substantive）；条件完整性：来源局部描述（partial-source-description）；结果完整性：来源局部描述（partial-source-description）

#### 条件

1. 执行人才探索；探索城市没有疫病或蝗灾，且禰衡在该城。
   - 作用范围：event；确定性：来源明确陈述（source-stated）；来源行：1238–1240
   - 数量字段：空列表（无额外数值记录）

2. 探索武将智力至少70，技巧点为1至9900。
   - 作用范围：event；确定性：来源明确陈述（source-stated）；来源行：1241–1242
   - 数量：intelligence；关系：大于或等于（gte）；值：70；单位：ability
   - 数量：technology-points；关系：区间且包含端点（range-inclusive）；值：1、9900；单位：points

#### 结果

1. 禰衡提出舌战挑战。
   - 作用范围：event；确定性：来源明确陈述（source-stated）；来源行：1244–1244
   - 数量字段：空列表（无额外数值记录）

2. 舌战获胜：技巧点增加10，执行武将政治经验增加，经验量未给。
   - 作用范围：debate-win；确定性：来源明确陈述（source-stated）；来源行：1245–1245
   - 数量：technology-points；关系：增减量（delta）；值：10；单位：points
   - 数量：politics-experience；关系：定性描述（qualitative）；值：未知／未给出（null）；单位：experience

3. 舌战失败：技巧点减少1，执行武将政治经验增加，经验量未给。
   - 作用范围：debate-loss；确定性：来源明确陈述（source-stated）；来源行：1246–1246
   - 数量：technology-points；关系：增减量（delta）；值：-1；单位：points
   - 数量：politics-experience；关系：定性描述（qualitative）；值：未知／未给出（null）；单位：experience

4. 忽略挑战：执行武将魅力经验增加，经验量未给。
   - 作用范围：ignore-challenge；确定性：来源明确陈述（source-stated）；来源行：1247–1247
   - 数量：charm-experience；关系：定性描述（qualitative）；值：未知／未给出（null）；单位：experience

#### 注释

本记录未列注释

### generic.atwiki88.17：旅人訪問・司馬徽Ａ

- 事件标识：generic.visit-sima-hui-a
- 来源：[atwiki-88-generic](https://w.atwiki.jp/sangokushi11/pages/88.html)；章节：旅人訪問・司馬徽Ａ；序号：17；序号范围：selected-generic-section；行：1249–1250
- 版本范围：版本种类（edition）：未指定（unspecified）；平台（platform）：未知／未给出（null）；补丁（patch）：未知／未给出（null）；依据（basis）：未述（not-stated）
- 证据：公开攻略转录（public-guide-transcription）；执行：否（false）
- 原生事件ID：未知／未给出（null）；仅发生一次：未述（not-stated）；标志ID：未知／未给出（null）；触发概率：未知／未给出（null）
- 覆盖：仅标题（heading-only）；条件完整性：未述（not-stated）；结果完整性：未述（not-stated）

#### 条件

来源未述；不表示无条件触发

#### 结果

来源未述；不表示没有状态变化

#### 注释

本记录未列注释

### generic.atwiki88.18：旅人訪問・司馬徽Ｂ

- 事件标识：generic.visit-sima-hui-b
- 来源：[atwiki-88-generic](https://w.atwiki.jp/sangokushi11/pages/88.html)；章节：旅人訪問・司馬徽Ｂ；序号：18；序号范围：selected-generic-section；行：1251–1252
- 版本范围：版本种类（edition）：未指定（unspecified）；平台（platform）：未知／未给出（null）；补丁（patch）：未知／未给出（null）；依据（basis）：未述（not-stated）
- 证据：公开攻略转录（public-guide-transcription）；执行：否（false）
- 原生事件ID：未知／未给出（null）；仅发生一次：未述（not-stated）；标志ID：未知／未给出（null）；触发概率：未知／未给出（null）
- 覆盖：仅标题（heading-only）；条件完整性：未述（not-stated）；结果完整性：未述（not-stated）

#### 条件

来源未述；不表示无条件触发

#### 结果

来源未述；不表示没有状态变化

#### 注释

本记录未列注释

### generic.atwiki88.19：旅人訪問・黄承彦

- 事件标识：generic.visit-huang-cheng-yan
- 来源：[atwiki-88-generic](https://w.atwiki.jp/sangokushi11/pages/88.html)；章节：旅人訪問・黄承彦；序号：19；序号范围：selected-generic-section；行：1253–1254
- 版本范围：版本种类（edition）：未指定（unspecified）；平台（platform）：未知／未给出（null）；补丁（patch）：未知／未给出（null）；依据（basis）：未述（not-stated）
- 证据：公开攻略转录（public-guide-transcription）；执行：否（false）
- 原生事件ID：未知／未给出（null）；仅发生一次：未述（not-stated）；标志ID：未知／未给出（null）；触发概率：未知／未给出（null）
- 覆盖：仅标题（heading-only）；条件完整性：未述（not-stated）；结果完整性：未述（not-stated）

#### 条件

来源未述；不表示无条件触发

#### 结果

来源未述；不表示没有状态变化

#### 注释

本记录未列注释

### generic.atwiki88.20：夫婦の助け

- 事件标识：generic.spousal-help
- 来源：[atwiki-88-generic](https://w.atwiki.jp/sangokushi11/pages/88.html)；章节：夫婦の助け；序号：20；序号范围：selected-generic-section；行：1255–1256
- 版本范围：版本种类（edition）：未指定（unspecified）；平台（platform）：未知／未给出（null）；补丁（patch）：未知／未给出（null）；依据（basis）：未述（not-stated）
- 证据：公开攻略转录（public-guide-transcription）；执行：否（false）
- 原生事件ID：未知／未给出（null）；仅发生一次：未述（not-stated）；标志ID：未知／未给出（null）；触发概率：未知／未给出（null）
- 覆盖：仅标题（heading-only）；条件完整性：未述（not-stated）；结果完整性：未述（not-stated）

#### 条件

来源未述；不表示无条件触发

#### 结果

来源未述；不表示没有状态变化

#### 注释

本记录未列注释

### generic.atwiki88.21：義兄弟の気炎

- 事件标识：generic.sworn-brothers-spirit
- 来源：[atwiki-88-generic](https://w.atwiki.jp/sangokushi11/pages/88.html)；章节：義兄弟の気炎；序号：21；序号范围：selected-generic-section；行：1257–1258
- 版本范围：版本种类（edition）：未指定（unspecified）；平台（platform）：未知／未给出（null）；补丁（patch）：未知／未给出（null）；依据（basis）：未述（not-stated）
- 证据：公开攻略转录（public-guide-transcription）；执行：否（false）
- 原生事件ID：未知／未给出（null）；仅发生一次：未述（not-stated）；标志ID：未知／未给出（null）；触发概率：未知／未给出（null）
- 覆盖：仅标题（heading-only）；条件完整性：未述（not-stated）；结果完整性：未述（not-stated）

#### 条件

来源未述；不表示无条件触发

#### 结果

来源未述；不表示没有状态变化

#### 注释

本记录未列注释

### generic.atwiki88.22：泰山封禅

- 事件标识：generic.taishan-fengshan
- 来源：[atwiki-88-generic](https://w.atwiki.jp/sangokushi11/pages/88.html)；章节：泰山封禅；序号：22；序号范围：selected-generic-section；行：1259–1268
- 版本范围：版本种类（edition）：未指定（unspecified）；平台（platform）：未知／未给出（null）；补丁（patch）：未知／未给出（null）；依据（basis）：未述（not-stated）
- 证据：公开攻略转录（public-guide-transcription）；执行：否（false）
- 原生事件ID：未知／未给出（null）；仅发生一次：未述（not-stated）；标志ID：未知／未给出（null）；触发概率：未知／未给出（null）
- 覆盖：有实质条件与结果（substantive）；条件完整性：来源局部描述（partial-source-description）；结果完整性：来源局部描述（partial-source-description）

#### 条件

1. 君主爵位为皇帝。
   - 作用范围：event；确定性：来源明确陈述（source-stated）；来源行：1262–1262
   - 数量字段：空列表（无额外数值记录）

2. 支配徐州地区至少一座城市；来源没有在该句列城市成员，不自动替换为小沛。
   - 作用范围：event；确定性：来源明确陈述（source-stated）；来源行：1263–1263
   - 数量：controlled-xuzhou-cities；关系：大于或等于（gte）；值：1；单位：cities

#### 结果

1. 君主全部能力数值增加2。
   - 作用范围：event；确定性：来源明确陈述（source-stated）；来源行：1265–1265
   - 数量：ruler-all-abilities；关系：增减量（delta）；值：2；单位：ability

2. 君主各兵种经验上升，经验量未给。
   - 作用范围：event；确定性：来源明确陈述（source-stated）；来源行：1266–1266
   - 数量：ruler-troop-experience；关系：定性描述（qualitative）；值：未知／未给出（null）；单位：experience

3. 来源带问号提及部下功绩上升，是否发生与具体增量均未确定。
   - 作用范围：event；确定性：来源带不确定性（source-uncertain）；来源行：1267–1267
   - 数量：subordinates-merit；关系：定性描述（qualitative）；值：未知／未给出（null）；单位：merit

#### 注释

本记录未列注释

### generic.atwiki88.23：義勇兵

- 事件标识：generic.volunteers
- 来源：[atwiki-88-generic](https://w.atwiki.jp/sangokushi11/pages/88.html)；章节：義勇兵；序号：23；序号范围：selected-generic-section；行：1269–1270
- 版本范围：版本种类（edition）：未指定（unspecified）；平台（platform）：未知／未给出（null）；补丁（patch）：未知／未给出（null）；依据（basis）：未述（not-stated）
- 证据：公开攻略转录（public-guide-transcription）；执行：否（false）
- 原生事件ID：未知／未给出（null）；仅发生一次：未述（not-stated）；标志ID：未知／未给出（null）；触发概率：未知／未给出（null）
- 覆盖：仅标题（heading-only）；条件完整性：未述（not-stated）；结果完整性：未述（not-stated）

#### 条件

来源未述；不表示无条件触发

#### 结果

来源未述；不表示没有状态变化

#### 注释

本记录未列注释

### generic.atwiki88.24：嘆願

- 事件标识：generic.petition
- 来源：[atwiki-88-generic](https://w.atwiki.jp/sangokushi11/pages/88.html)；章节：嘆願；序号：24；序号范围：selected-generic-section；行：1271–1272
- 版本范围：版本种类（edition）：未指定（unspecified）；平台（platform）：未知／未给出（null）；补丁（patch）：未知／未给出（null）；依据（basis）：未述（not-stated）
- 证据：公开攻略转录（public-guide-transcription）；执行：否（false）
- 原生事件ID：未知／未给出（null）；仅发生一次：未述（not-stated）；标志ID：未知／未给出（null）；触发概率：未知／未给出（null）
- 覆盖：仅标题（heading-only）；条件完整性：未述（not-stated）；结果完整性：未述（not-stated）

#### 条件

来源未述；不表示无条件触发

#### 结果

来源未述；不表示没有状态变化

#### 注释

本记录未列注释

### generic.atwiki88.25：災害援助

- 事件标识：generic.disaster-aid
- 来源：[atwiki-88-generic](https://w.atwiki.jp/sangokushi11/pages/88.html)；章节：災害援助；序号：25；序号范围：selected-generic-section；行：1273–1274
- 版本范围：版本种类（edition）：未指定（unspecified）；平台（platform）：未知／未给出（null）；补丁（patch）：未知／未给出（null）；依据（basis）：未述（not-stated）
- 证据：公开攻略转录（public-guide-transcription）；执行：否（false）
- 原生事件ID：未知／未给出（null）；仅发生一次：未述（not-stated）；标志ID：未知／未给出（null）；触发概率：未知／未给出（null）
- 覆盖：仅标题（heading-only）；条件完整性：未述（not-stated）；结果完整性：未述（not-stated）

#### 条件

来源未述；不表示无条件触发

#### 结果

来源未述；不表示没有状态变化

#### 注释

本记录未列注释

### generic.atwiki88.26：漢帝密使

- 事件标识：generic.han-emperor-secret-envoy
- 来源：[atwiki-88-generic](https://w.atwiki.jp/sangokushi11/pages/88.html)；章节：漢帝密使；序号：26；序号范围：selected-generic-section；行：1275–1276
- 版本范围：版本种类（edition）：未指定（unspecified）；平台（platform）：未知／未给出（null）；补丁（patch）：未知／未给出（null）；依据（basis）：未述（not-stated）
- 证据：公开攻略转录（public-guide-transcription）；执行：否（false）
- 原生事件ID：未知／未给出（null）；仅发生一次：未述（not-stated）；标志ID：未知／未给出（null）；触发概率：未知／未给出（null）
- 覆盖：仅标题（heading-only）；条件完整性：未述（not-stated）；结果完整性：未述（not-stated）

#### 条件

来源未述；不表示无条件触发

#### 结果

来源未述；不表示没有状态变化

#### 注释

本记录未列注释

### generic.atwiki88.27：漢帝援助

- 事件标识：generic.aid-han-emperor
- 来源：[atwiki-88-generic](https://w.atwiki.jp/sangokushi11/pages/88.html)；章节：漢帝援助；序号：27；序号范围：selected-generic-section；行：1277–1277
- 版本范围：版本种类（edition）：未指定（unspecified）；平台（platform）：未知／未给出（null）；补丁（patch）：未知／未给出（null）；依据（basis）：未述（not-stated）
- 证据：公开攻略转录（public-guide-transcription）；执行：否（false）
- 原生事件ID：未知／未给出（null）；仅发生一次：未述（not-stated）；标志ID：未知／未给出（null）；触发概率：未知／未给出（null）
- 覆盖：仅标题（heading-only）；条件完整性：未述（not-stated）；结果完整性：未述（not-stated）

#### 条件

来源未述；不表示无条件触发

#### 结果

来源未述；不表示没有状态变化

#### 注释

本记录未列注释

### generic.atwiki88.28：賞賛

- 事件标识：generic.praise
- 来源：[atwiki-88-generic](https://w.atwiki.jp/sangokushi11/pages/88.html)；章节：賞賛；序号：28；序号范围：selected-generic-section；行：1278–1283
- 版本范围：版本种类（edition）：未指定（unspecified）；平台（platform）：未知／未给出（null）；补丁（patch）：未知／未给出（null）；依据（basis）：未述（not-stated）
- 证据：公开攻略转录（public-guide-transcription）；执行：否（false）
- 原生事件ID：未知／未给出（null）；仅发生一次：未述（not-stated）；标志ID：未知／未给出（null）；触发概率：未知／未给出（null）
- 覆盖：仅定性结果（qualitative-result-only）；条件完整性：未述（not-stated）；结果完整性：来源局部描述（partial-source-description）

#### 条件

来源未述；不表示无条件触发

#### 结果

1. 受赞赏的武将功绩上升；数额未给，条件小标题下没有内容。
   - 作用范围：event；确定性：来源明确陈述（source-stated）；来源行：1280–1282
   - 数量：praised-officer-merit；关系：定性描述（qualitative）；值：未知／未给出（null）；单位：merit

#### 注释

本记录未列注释

### generic.atwiki88.29：誹謗

- 事件标识：generic.slander
- 来源：[atwiki-88-generic](https://w.atwiki.jp/sangokushi11/pages/88.html)；章节：誹謗；序号：29；序号范围：selected-generic-section；行：1284–1285
- 版本范围：版本种类（edition）：未指定（unspecified）；平台（platform）：未知／未给出（null）；补丁（patch）：未知／未给出（null）；依据（basis）：未述（not-stated）
- 证据：公开攻略转录（public-guide-transcription）；执行：否（false）
- 原生事件ID：未知／未给出（null）；仅发生一次：未述（not-stated）；标志ID：未知／未给出（null）；触发概率：未知／未给出（null）
- 覆盖：仅标题（heading-only）；条件完整性：未述（not-stated）；结果完整性：未述（not-stated）

#### 条件

来源未述；不表示无条件触发

#### 结果

来源未述；不表示没有状态变化

#### 注释

本记录未列注释

### generic.atwiki88.30：修行報告・知系

- 事件标识：generic.study-report-intellect
- 来源：[atwiki-88-generic](https://w.atwiki.jp/sangokushi11/pages/88.html)；章节：修行報告・知系；序号：30；序号范围：selected-generic-section；行：1286–1286
- 版本范围：版本种类（edition）：未指定（unspecified）；平台（platform）：未知／未给出（null）；补丁（patch）：未知／未给出（null）；依据（basis）：未述（not-stated）
- 证据：公开攻略转录（public-guide-transcription）；执行：否（false）
- 原生事件ID：未知／未给出（null）；仅发生一次：未述（not-stated）；标志ID：未知／未给出（null）；触发概率：未知／未给出（null）
- 覆盖：仅标题（heading-only）；条件完整性：未述（not-stated）；结果完整性：未述（not-stated）

#### 条件

来源未述；不表示无条件触发

#### 结果

来源未述；不表示没有状态变化

#### 注释

本记录未列注释

### generic.atwiki88.31：修行報告・武系

- 事件标识：generic.study-report-military
- 来源：[atwiki-88-generic](https://w.atwiki.jp/sangokushi11/pages/88.html)；章节：修行報告・武系；序号：31；序号范围：selected-generic-section；行：1287–1287
- 版本范围：版本种类（edition）：未指定（unspecified）；平台（platform）：未知／未给出（null）；补丁（patch）：未知／未给出（null）；依据（basis）：未述（not-stated）
- 证据：公开攻略转录（public-guide-transcription）；执行：否（false）
- 原生事件ID：未知／未给出（null）；仅发生一次：未述（not-stated）；标志ID：未知／未给出（null）；触发概率：未知／未给出（null）
- 覆盖：仅标题（heading-only）；条件完整性：未述（not-stated）；结果完整性：未述（not-stated）

#### 条件

来源未述；不表示无条件触发

#### 结果

来源未述；不表示没有状态变化

#### 注释

本记录未列注释

## 游民2009：2条

资料集：san11.generic.gamersky2009.20261007

版本范围：版本种类（edition）：PK；平台（platform）：未知／未给出（null）；补丁（patch）：未知／未给出（null）；依据（basis）：文章标题与引言（article-title-and-introduction）

### generic.gamersky2009.01.bronze-sparrow：铜雀台

- 事件标识：generic.bronze-sparrow-acquisition
- 来源：[gamersky-2009-01](https://www.gamersky.com/handbook/200902/134257.shtml)；章节：铜雀台；序号：1；序号范围：selected-observations-on-page；行：275–276
- 版本范围：版本种类（edition）：PK；平台（platform）：未知／未给出（null）；补丁（patch）：未知／未给出（null）；依据（basis）：文章标题与引言（article-title-and-introduction）
- 证据：公开攻略转录（public-guide-transcription）；执行：否（false）
- 原生事件ID：未知／未给出（null）；仅发生一次：未述（not-stated）；标志ID：未知／未给出（null）；触发概率：未知／未给出（null）
- 覆盖：补充观察（supplementary）；条件完整性：来源局部描述（partial-source-description）；结果完整性：来源局部描述（partial-source-description）

#### 条件

1. 2009年1月26日补记称官职达到大司马，君主前往字面地点“邻”。“邻”疑似错字但未裁决，不自动更正为邺；也不把“达到”擅自扩成排序阈值。
   - 作用范围：event；确定性：来源表述歧义（source-ambiguous）；来源行：276–276
   - 数量字段：空列表（无额外数值记录）

#### 结果

1. 补记称可取得铜雀；没有复述Wiki的其他条件，不代表否定或免除这些条件。
   - 作用范围：event；确定性：来源明确陈述（source-stated）；来源行：276–276
   - 数量字段：空列表（无额外数值记录）

#### 注释

本记录未列注释

### generic.gamersky2009.13.taishan：泰山封禅

- 事件标识：generic.taishan-fengshan
- 来源：[gamersky-2009-13](https://www.gamersky.com/handbook/200902/134257_13.shtml)；章节：泰山封禅；序号：1；序号范围：selected-observations-on-page；行：336–342
- 版本范围：版本种类（edition）：PK；平台（platform）：未知／未给出（null）；补丁（patch）：未知／未给出（null）；依据（basis）：文章标题与引言（article-title-and-introduction）
- 证据：公开攻略转录（public-guide-transcription）；执行：否（false）
- 原生事件ID：未知／未给出（null）；仅发生一次：未述（not-stated）；标志ID：未知／未给出（null）；触发概率：未知／未给出（null）
- 覆盖：补充观察（supplementary）；条件完整性：来源局部描述（partial-source-description）；结果完整性：来源局部描述（partial-source-description）

#### 条件

1. 君主爵位为皇帝。
   - 作用范围：event；确定性：来源明确陈述（source-stated）；来源行：339–339
   - 数量字段：空列表（无额外数值记录）

2. 支配小沛。
   - 作用范围：event；确定性：来源明确陈述（source-stated）；来源行：340–340
   - 数量字段：空列表（无额外数值记录）

#### 结果

1. 君主能力、适性上升；没有数额，也未区分能力数值、适性等级和经验，不能从Wiki补值。
   - 作用范围：event；确定性：来源明确陈述（source-stated）；来源行：342–342
   - 数量：ruler-abilities；关系：定性描述（qualitative）；值：未知／未给出（null）；单位：unspecified
   - 数量：ruler-aptitude；关系：定性描述（qualitative）；值：未知／未给出（null）；单位：unspecified

#### 注释

本记录未列注释

## 字段覆盖

静态条目数为33条观察、32条条件、20条结果、6条注释及52项数量记录；空条件/结果/注释列表也逐项标明。

33条观察的eventId、observationId、sourceId、sourceURL、sourceSection、sourceOrdinal、ordinalScope、sourceLocator、evidence、executionEnabled、coverageKind、nativeEventId、onceOnly、triggerProbability、conditionCompleteness、resultCompleteness全部逐项列出；conditions、results、annotations每条text、scope、certainty、sourceLocator及quantities中的name/operator/value/unit均保留。数据集versionScope在来源章节及每条观察复列。只省略schemaVersion和snapshotSha256摘要；资料集条件与结果顺序的限制已于开头用中文明确。
