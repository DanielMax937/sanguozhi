# atwiki 史实事件逐观察规则正文

本文展开 `atwiki-88.json` 中全部 **61 条观察**。全资料集合共 105 条观察、66 个事件映射、41 条未解决分歧；完整来源目录、版本范围、排除项、全局未知项及分歧见[史实事件总目录](historical-scenario-events-inventory.md)。

- 数据集标识（`datasetId`）：`san11-historical-events-atwiki-88`
- 证据性质（`evidence`）：公开攻略转录（`public-guide-transcription`）
- 执行开关（`executionEnabled`）：否（false）
- 仅省略纯格式字段 `schemaVersion`；不省略任何游戏事实。来源级采集哈希不在事件文件中，来源目录另说明其省略范围

## 阅读边界与保留规则

- 本文是已有公开攻略转录数据的静态中文正文展开。证据性质为公开攻略转录（`public-guide-transcription`），不是对游戏运行时机制的确认
- 执行开关保持 `executionEnabled=false`。这里不定义事件调度器、触发频率、概率、原版运行时事件编号、存档标志或自动执行逻辑
- `eventId` 是本资料集合的事件标识，`observationId` 是独立来源观察；同一事件的不同观察不互相覆盖
- `orderedResults` 的编号只表示攻略描述顺序，不证明真实写入、回调或引擎执行顺序。`branch`、`choice`、`if` 的层级和各自条件单独保留，不把所有结果当成无条件一起发生
- `all` 表示其子项全部成立，`any` 表示其子项任一成立；其他顶层清单维持来源排列，不额外裁决未知逻辑。`possibleGroupings` 是尚未裁决的多个可能分组，不合并成已确认条件
- `onceOnly.status=not-stated` 和 `flagId=null` 仅表示未说明、未提供，不能推出会重复或只会触发一次。空条件、空前置列表、空参数和空不确定性分别标明，不把缺失信息推断为否定结论
- 未指定版本/平台/补丁不认证为 PC、PK 或主机版本；条目局部的 PK、暂定主机阈值及其他限制按来源保留
- 月份前后边界、区间端点、相性阈值、量词、地点/所属据点、外交方向、数值与单位、疑似笔误、未决日期加速及条件矛盾均按原值保留。列表按原次序展开，年月列表仍为“年、月”，不做日期或日/月换算
- 中文标签及解释帮助阅读；括号中的字段名、枚举值、源文人名/地名、英文说明保留原值。原值与中文解释有冲突时，应回到本条独立来源，不能据译名推导新规则
- 本文只做静态文本整理，未运行测试、游戏、构建或项目脚本，也不构成运行时验证


## 观察索引

- [atwiki-88-01 · 黄巾の乱](#atwiki-88-01)；事件 `yellow-turban-uprising`
- [atwiki-88-02 · 桃園の誓い](#atwiki-88-02)；事件 `peach-garden-oath`
- [atwiki-88-03 · 少帝廃立](#atwiki-88-03)；事件 `depose-shao-emperor`
- [atwiki-88-04 · 反董卓連合](#atwiki-88-04)；事件 `anti-dong-coalition`
- [atwiki-88-05 · 遷都長安](#atwiki-88-05)；事件 `move-capital-chang-an`
- [atwiki-88-06 · 反董卓連合瓦解](#atwiki-88-06)；事件 `anti-dong-coalition-collapse`
- [atwiki-88-07 · 恩讐徐州攻略戦（曹嵩惨殺）](#atwiki-88-07)；事件 `cao-song-murder`
- [atwiki-88-08 · 虎を追う者（典韋登用）](#atwiki-88-08)；事件 `recruit-dian-wei`
- [atwiki-88-09 · 連環の計](#atwiki-88-09)；事件 `chain-plot-overview`
- [atwiki-88-10 · 悪来vs許褚（許褚登用）](#atwiki-88-10)；事件 `recruit-xu-chu`
- [atwiki-88-11 · 郭嘉推挙](#atwiki-88-11)；事件 `recommend-guo-jia`
- [atwiki-88-12 · 麋氏と劉備（劉備・麋氏結婚）](#atwiki-88-12)；事件 `marry-liu-bei-mi`
- [atwiki-88-13 · 孫策出陣](#atwiki-88-13)；事件 `sun-ce-sortie`
- [atwiki-88-14 · 小覇王・孫策（周泰、蒋欽、陳武、董襲、凌操仕官）](#atwiki-88-14)；事件 `recruit-sun-ce-five`
- [atwiki-88-15 · 二張推挙](#atwiki-88-15)；事件 `recommend-two-zhangs`
- [atwiki-88-16 · 二喬婚礼](#atwiki-88-16)；事件 `marry-two-qiaos`
- [atwiki-88-17 · 偽帝僭称](#atwiki-88-17)；事件 `yuan-shu-usurps`
- [atwiki-88-18 · 御曹司一番乗り（曹丕・甄氏結婚）](#atwiki-88-18)；事件 `marry-cao-pi-zhen`
- [atwiki-88-19 · 二強開戦-条件](#atwiki-88-19)；事件 `two-powers-war`
- [atwiki-88-20 · 趙雲再会（趙雲仕官）](#atwiki-88-20)；事件 `zhao-yun-reunion`
- [atwiki-88-21 · 好漢・劉備（龔都、周倉、裴元紹、劉辟、廖化仕官）](#atwiki-88-21)；事件 `recruit-liu-bei-five`
- [atwiki-88-22 · 趙雲再会](#atwiki-88-22)；事件 `zhao-yun-reunion`
- [atwiki-88-23 · 郭嘉の死](#atwiki-88-23)；事件 `guo-jia-death`
- [atwiki-88-24 · 于吉の呪い（孫策の死）](#atwiki-88-24)；事件 `sun-ce-death`
- [atwiki-88-25 · 孔明の嫁とり](#atwiki-88-25)；事件 `marry-zhuge-liang`
- [atwiki-88-26 · 甘寧亡命](#atwiki-88-26)；事件 `gan-ning-defects`
- [atwiki-88-27 · 徐庶登場](#atwiki-88-27)；事件 `xu-shu-arrives`
- [atwiki-88-28 · 曹操の南征](#atwiki-88-28)；事件 `cao-cao-southern-campaign`
- [atwiki-88-29 · 三顧の礼](#atwiki-88-29)；事件 `three-visits-overview`
- [atwiki-88-30 · 馬氏の五常](#atwiki-88-30)；事件 `recommend-ma-brothers`
- [atwiki-88-31 · 孫尚香の結婚](#atwiki-88-31)；事件 `marry-sun-shang-xiang`
- [atwiki-88-32 · 呉下の阿蒙にあらず](#atwiki-88-32)；事件 `lu-meng-studies`
- [atwiki-88-33 · 周瑜の死](#atwiki-88-33)；事件 `zhou-yu-death`
- [atwiki-88-34 · 曹操の死](#atwiki-88-34)；事件 `cao-cao-death`
- [atwiki-88-35 · 漢中王即位](#atwiki-88-35)；事件 `liu-bei-hanzhong-king`
- [atwiki-88-36 · 魏帝即位](#atwiki-88-36)；事件 `wei-emperor-accession`
- [atwiki-88-37 · 蜀帝即位](#atwiki-88-37)；事件 `shu-emperor-accession`
- [atwiki-88-38 · 虎の子（張苞・関興義兄弟の契り）](#atwiki-88-38)；事件 `sons-of-tigers-oath`
- [atwiki-88-39 · 呉王即位](#atwiki-88-39)；事件 `wu-king-accession`
- [atwiki-88-40 · 陸遜登場](#atwiki-88-40)；事件 `lu-xun-arrives`
- [atwiki-88-41 · 諸葛亮の北伐](#atwiki-88-41)；事件 `zhuge-liang-northern-campaign`
- [atwiki-88-42 · 呉帝即位](#atwiki-88-42)；事件 `wu-emperor-accession`
- [atwiki-88-43 · 劉備の死](#atwiki-88-43)；事件 `liu-bei-death`
- [atwiki-88-44 · 諸葛亮の死](#atwiki-88-44)；事件 `zhuge-liang-death`
- [atwiki-88-45 · 魯粛推挙](#atwiki-88-45)；事件 `recommend-lu-su`
- [atwiki-88-46 · 諸葛瑾推挙](#atwiki-88-46)；事件 `recommend-zhuge-jin`
- [atwiki-88-47 · 顧雍推挙](#atwiki-88-47)；事件 `recommend-gu-yong`
- [atwiki-88-48 · 劉子陽推挙](#atwiki-88-48)；事件 `recommend-liu-ye`
- [atwiki-88-49 · 満寵、呂虔推挙](#atwiki-88-49)；事件 `recommend-man-chong-lu-qian`
- [atwiki-88-50 · 徐州譲渡（徐州禅譲）](#atwiki-88-50)；事件 `tao-qian-cedes-xuzhou`
- [atwiki-88-51 · 玉帯詔（董承の密勅）](#atwiki-88-51)；事件 `jade-belt-decree`
- [atwiki-88-52 · 遷都許昌](#atwiki-88-52)；事件 `move-capital-xuchang`
- [atwiki-88-53 · 袁紹の死（袁家分裂）](#atwiki-88-53)；事件 `yuan-shao-death-split`
- [atwiki-88-54 · 徐庶の母（徐庶去る）](#atwiki-88-54)；事件 `xu-shu-leaves`
- [atwiki-88-55 · 劉表の死（荊州分裂）](#atwiki-88-55)；事件 `liu-biao-death-split`
- [atwiki-88-56 · 孫劉同盟](#atwiki-88-56)；事件 `sun-liu-alliance`
- [atwiki-88-57 · 鳳雛理政（落第県令）](#atwiki-88-57)；事件 `pang-tong-county-administration`
- [atwiki-88-58 · 九品中正法（九品官人法）](#atwiki-88-58)；事件 `nine-rank-system`
- [atwiki-88-59 · 魏公即位（魏公騒動）](#atwiki-88-59)；事件 `wei-duke-accession`
- [atwiki-88-60 · 魏王即位](#atwiki-88-60)；事件 `wei-king-accession`
- [atwiki-88-61 · 関羽の驕慢（美髯公には及ばず）](#atwiki-88-61)；事件 `guan-yu-arrogance`

<a id="atwiki-88-01"></a>

## 观察 01：黄巾の乱

- 事件标识（`eventId`）：`yellow-turban-uprising`
- 观察标识（`observationId`）：`atwiki-88-01`
- 原文标题（`title`）：`黄巾の乱`
- 来源标识（`sourceId`）：`atwiki-88`
- 来源网址（`sourceURL`）：[https://w.atwiki.jp/sangokushi11/pages/88.html](https://w.atwiki.jp/sangokushi11/pages/88.html)
- 来源章节（`sourceSection`）：`黄巾の乱`
- 来源节序（`sourceOrdinal`）：1
- 来源行定位（`sourceLocator`）：
  - 起始行（`startLine`）：126
  - 结束行（`endLine`）：132
- 版本范围（`version`）：
  - 游戏（`game`）：`SAN11`
  - 版本类型（`edition`）：未指定（`unspecified`）
  - 平台（`platform`）：未指定（`unspecified`）
  - 补丁（`patch`）：未指定（`unspecified`）
- 证据性质（`evidence`）：公开攻略转录（`public-guide-transcription`）
- 仅发生一次信息（`onceOnly`）：
  - 状态（`status`）：未说明（`not-stated`）
  - 标志标识（`flagId`）：未提供（null）

### 触发条件（`conditions`）

- 第 1 项：
  - 事实条件（`kind=fact`）；类别（`category`）：剧本（`scenario`）；对象（`subject`）：剧本（`scenario`）；字段（`field`）：编号（`number`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：1
- 第 2 项：
  - 事实条件（`kind=fact`）；类别（`category`）：日期（`date`）；对象（`subject`）：剧本（`scenario`）；字段（`field`）：剧本经过日数（`elapsed-days`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：0

### 前置事件关系（`prerequisites`）

- 空列表（0 项）

### 结果与分支（仅来源描述顺序）（`orderedResults`）

- 第 1 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：未说明（`not-stated`）；作用对象（`target`）：`event`
    - 参数（`values`）：空属性集（0 项）

### 不确定性与来源限定（`uncertainties`）

- 第 1 项：The result heading is empty.

<a id="atwiki-88-02"></a>

## 观察 02：桃園の誓い

- 事件标识（`eventId`）：`peach-garden-oath`
- 观察标识（`observationId`）：`atwiki-88-02`
- 原文标题（`title`）：`桃園の誓い`
- 来源标识（`sourceId`）：`atwiki-88`
- 来源网址（`sourceURL`）：[https://w.atwiki.jp/sangokushi11/pages/88.html](https://w.atwiki.jp/sangokushi11/pages/88.html)
- 来源章节（`sourceSection`）：`桃園の誓い`
- 来源节序（`sourceOrdinal`）：2
- 来源行定位（`sourceLocator`）：
  - 起始行（`startLine`）：133
  - 结束行（`endLine`）：141
- 版本范围（`version`）：
  - 游戏（`game`）：`SAN11`
  - 版本类型（`edition`）：未指定（`unspecified`）
  - 平台（`platform`）：未指定（`unspecified`）
  - 补丁（`patch`）：未指定（`unspecified`）
- 证据性质（`evidence`）：公开攻略转录（`public-guide-transcription`）
- 仅发生一次信息（`onceOnly`）：
  - 状态（`status`）：未说明（`not-stated`）
  - 标志标识（`flagId`）：未提供（null）

### 触发条件（`conditions`）

- 第 1 项：
  - 事实条件（`kind=fact`）；类别（`category`）：剧本（`scenario`）；对象（`subject`）：剧本（`scenario`）；字段（`field`）：编号（`number`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：1
- 第 2 项：
  - 事实条件（`kind=fact`）；类别（`category`）：日期（`date`）；对象（`subject`）：剧本（`scenario`）；字段（`field`）：剧本经过日数（`elapsed-days`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：0
- 第 3 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`player`；字段（`field`）：君主（`ruler`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：`劉焉`
- 第 4 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`劉焉`；字段（`field`）：武将列表（`officers`）；比较关系（`operator`）：包含全部（`contains-all`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：`劉備`、`関羽`、`張飛`

### 前置事件关系（`prerequisites`）

- 空列表（0 项）

### 结果与分支（仅来源描述顺序）（`orderedResults`）

- 第 1 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：未说明（`not-stated`）；作用对象（`target`）：`event`
    - 参数（`values`）：空属性集（0 项）

### 不确定性与来源限定（`uncertainties`）

- 第 1 项：The result heading is empty; no relationship effects are supplied by this observation.

<a id="atwiki-88-03"></a>

## 观察 03：少帝廃立

- 事件标识（`eventId`）：`depose-shao-emperor`
- 观察标识（`observationId`）：`atwiki-88-03`
- 原文标题（`title`）：`少帝廃立`
- 来源标识（`sourceId`）：`atwiki-88`
- 来源网址（`sourceURL`）：[https://w.atwiki.jp/sangokushi11/pages/88.html](https://w.atwiki.jp/sangokushi11/pages/88.html)
- 来源章节（`sourceSection`）：`少帝廃立`
- 来源节序（`sourceOrdinal`）：3
- 来源行定位（`sourceLocator`）：
  - 起始行（`startLine`）：142
  - 结束行（`endLine`）：154
- 版本范围（`version`）：
  - 游戏（`game`）：`SAN11`
  - 版本类型（`edition`）：未指定（`unspecified`）
  - 平台（`platform`）：未指定（`unspecified`）
  - 补丁（`patch`）：未指定（`unspecified`）
- 证据性质（`evidence`）：公开攻略转录（`public-guide-transcription`）
- 仅发生一次信息（`onceOnly`）：
  - 状态（`status`）：未说明（`not-stated`）
  - 标志标识（`flagId`）：未提供（null）

### 触发条件（`conditions`）

- 第 1 项：
  - 事实条件（`kind=fact`）；类别（`category`）：日期（`date`）；对象（`subject`）：剧本（`scenario`）；字段（`field`）：剧本开始年月（`start-month`）；比较关系（`operator`）：小于或等于（`lte`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：189、8
- 第 2 项：
  - 事实条件（`kind=fact`）；类别（`category`）：日期（`date`）；对象（`subject`）：`calendar`；字段（`field`）：当前年月（`current-month`）；比较关系（`operator`）：大于或等于（`gte`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：189、9
- 第 3 项：
  - 事实条件（`kind=fact`）；类别（`category`）：皇帝（`emperor`）；对象（`subject`）：`later-han-emperor`；字段（`field`）：身份（`identity`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：`少帝`
- 第 4 项：
  - 事实条件（`kind=fact`）；类别（`category`）：皇帝（`emperor`）；对象（`subject`）：`董卓`；字段（`field`）：拥立后汉皇帝（`supports-later-han-emperor`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：是（true）
- 第 5 项：
  - 事实条件（`kind=fact`）；类别（`category`）：城市（`city`）；对象（`subject`）：`董卓`；字段（`field`）：持有城市（`cities`）；比较关系（`operator`）：包含全部（`contains-all`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：`長安`、`洛陽`
- 第 6 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`董卓`；字段（`field`）：武将列表（`officers`）；比较关系（`operator`）：包含全部（`contains-all`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：`李儒`
- 第 7 项：
  - 事实条件（`kind=fact`）；类别（`category`）：任务或行动（`mission`）；对象（`subject`）：列表（按来源次序）：`董卓`、`李儒`；字段（`field`）：正在执行任务（`on-mission`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：否（false）

### 前置事件关系（`prerequisites`）

- 空列表（0 项）

### 结果与分支（仅来源描述顺序）（`orderedResults`）

- 第 1 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：死亡（`death`）；作用对象（`target`）：`少帝`
    - 参数（`values`）：空属性集（0 项）
- 第 2 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：设为（`set`）；作用对象（`target`）：`later-han-emperor`
    - 参数（`values`）：
      - 身份（`identity`）：`献帝`

### 不确定性与来源限定（`uncertainties`）

- 空列表（0 项）

<a id="atwiki-88-04"></a>

## 观察 04：反董卓連合

- 事件标识（`eventId`）：`anti-dong-coalition`
- 观察标识（`observationId`）：`atwiki-88-04`
- 原文标题（`title`）：`反董卓連合`
- 来源标识（`sourceId`）：`atwiki-88`
- 来源网址（`sourceURL`）：[https://w.atwiki.jp/sangokushi11/pages/88.html](https://w.atwiki.jp/sangokushi11/pages/88.html)
- 来源章节（`sourceSection`）：`反董卓連合`
- 来源节序（`sourceOrdinal`）：4
- 来源行定位（`sourceLocator`）：
  - 起始行（`startLine`）：155
  - 结束行（`endLine`）：159
- 版本范围（`version`）：
  - 游戏（`game`）：`SAN11`
  - 版本类型（`edition`）：未指定（`unspecified`）
  - 平台（`platform`）：未指定（`unspecified`）
  - 补丁（`patch`）：未指定（`unspecified`）
- 证据性质（`evidence`）：公开攻略转录（`public-guide-transcription`）
- 仅发生一次信息（`onceOnly`）：
  - 状态（`status`）：未说明（`not-stated`）
  - 标志标识（`flagId`）：未提供（null）

### 触发条件（`conditions`）

- 第 1 项：
  - 事实条件（`kind=fact`）；类别（`category`）：剧本（`scenario`）；对象（`subject`）：剧本（`scenario`）；字段（`field`）：编号（`number`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：2
- 第 2 项：
  - 事实条件（`kind=fact`）；类别（`category`）：日期（`date`）；对象（`subject`）：剧本（`scenario`）；字段（`field`）：剧本经过日数（`elapsed-days`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：0

### 前置事件关系（`prerequisites`）

- 空列表（0 项）

### 结果与分支（仅来源描述顺序）（`orderedResults`）

- 第 1 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：未说明（`not-stated`）；作用对象（`target`）：`event`
    - 参数（`values`）：空属性集（0 项）

### 不确定性与来源限定（`uncertainties`）

- 第 1 项：No result block is supplied.

<a id="atwiki-88-05"></a>

## 观察 05：遷都長安

- 事件标识（`eventId`）：`move-capital-chang-an`
- 观察标识（`observationId`）：`atwiki-88-05`
- 原文标题（`title`）：`遷都長安`
- 来源标识（`sourceId`）：`atwiki-88`
- 来源网址（`sourceURL`）：[https://w.atwiki.jp/sangokushi11/pages/88.html](https://w.atwiki.jp/sangokushi11/pages/88.html)
- 来源章节（`sourceSection`）：`遷都長安`
- 来源节序（`sourceOrdinal`）：5
- 来源行定位（`sourceLocator`）：
  - 起始行（`startLine`）：160
  - 结束行（`endLine`）：193
- 版本范围（`version`）：
  - 游戏（`game`）：`SAN11`
  - 版本类型（`edition`）：未指定（`unspecified`）
  - 平台（`platform`）：未指定（`unspecified`）
  - 补丁（`patch`）：未指定（`unspecified`）
- 证据性质（`evidence`）：公开攻略转录（`public-guide-transcription`）
- 仅发生一次信息（`onceOnly`）：
  - 状态（`status`）：未说明（`not-stated`）
  - 标志标识（`flagId`）：未提供（null）

### 触发条件（`conditions`）

- 第 1 项：
  - 事实条件（`kind=fact`）；类别（`category`）：日期（`date`）；对象（`subject`）：剧本（`scenario`）；字段（`field`）：剧本开始年月（`start-month`）；比较关系（`operator`）：小于或等于（`lte`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：190、1
- 第 2 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`董卓`；字段（`field`）：存在（`exists`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：是（true）
- 第 3 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`曹操`；字段（`field`）：存在（`exists`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：是（true）
- 第 4 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`袁紹`；字段（`field`）：存在（`exists`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：是（true）
- 第 5 项：
  - 任一成立（`any`）（节点种类（`kind`））
    - 逻辑：本组至少一个子项成立；仅表示来源的分组，不引入调度规则
    - 子项（`items`）：
      - 第 1 项：
        - 事实条件（`kind=fact`）；类别（`category`）：日期（`date`）；对象（`subject`）：`calendar`；字段（`field`）：当前年月（`current-month`）；比较关系（`operator`）：大于或等于（`gte`）；确定性（`certainty`）：来源明示（`stated`）
          - 取值（`value`）：列表（按来源次序）：190、4
      - 第 2 项：
        - 事实条件（`kind=fact`）；类别（`category`）：城市（`city`）；对象（`subject`）：`虎牢関`；字段（`field`）：控制势力（`controlling-force`）；比较关系（`operator`）：不等于（`neq`）；确定性（`certainty`）：来源明示（`stated`）
          - 取值（`value`）：`董卓`
- 第 6 项：
  - 事实条件（`kind=fact`）；类别（`category`）：皇帝（`emperor`）；对象（`subject`）：`董卓`；字段（`field`）：拥立后汉皇帝（`supports-later-han-emperor`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：是（true）
- 第 7 项：
  - 事实条件（`kind=fact`）；类别（`category`）：城市（`city`）；对象（`subject`）：`董卓`；字段（`field`）：持有城市（`cities`）；比较关系（`operator`）：包含全部（`contains-all`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：`長安`、`洛陽`
- 第 8 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`董卓`；字段（`field`）：武将列表（`officers`）；比较关系（`operator`）：包含全部（`contains-all`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：`李儒`
- 第 9 项：
  - 事实条件（`kind=fact`）；类别（`category`）：城市（`city`）；对象（`subject`）：`董卓`；字段（`field`）：所属城市（`assigned-city`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：`洛陽`
- 第 10 项：
  - 事实条件（`kind=fact`）；类别（`category`）：外交（`diplomacy`）；对象（`subject`）：列表（按来源次序）：`董卓`、`曹操`；字段（`field`）：友好度（`friendship`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：`険悪`
- 第 11 项：
  - 事实条件（`kind=fact`）；类别（`category`）：外交（`diplomacy`）；对象（`subject`）：列表（按来源次序）：`董卓`、`袁紹`；字段（`field`）：友好度（`friendship`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：`険悪`
- 第 12 项：
  - 事实条件（`kind=fact`）；类别（`category`）：外交（`diplomacy`）；对象（`subject`）：列表（按来源次序）：`董卓`、`曹操`；字段（`field`）：处于同盟（`allied`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：否（false）
- 第 13 项：
  - 事实条件（`kind=fact`）；类别（`category`）：外交（`diplomacy`）；对象（`subject`）：列表（按来源次序）：`董卓`、`袁紹`；字段（`field`）：处于同盟（`allied`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：否（false）
- 第 14 项：
  - 事实条件（`kind=fact`）；类别（`category`）：外交（`diplomacy`）；对象（`subject`）：列表（按来源次序）：`曹操`、`袁紹`；字段（`field`）：处于同盟（`allied`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：是（true）
- 第 15 项：
  - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：列表（按来源次序）：`董卓`、`曹操`；字段（`field`）：有缘关系（`associated-relationship`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：否（false）
- 第 16 项：
  - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：列表（按来源次序）：`董卓`、`袁紹`；字段（`field`）：有缘关系（`associated-relationship`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：否（false）
- 第 17 项：
  - 事实条件（`kind=fact`）；类别（`category`）：任务或行动（`mission`）；对象（`subject`）：列表（按来源次序）：`董卓`、`李儒`；字段（`field`）：行动已用（`action-used`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：否（false）
- 第 18 项：
  - 事实条件（`kind=fact`）；类别（`category`）：皇帝（`emperor`）；对象（`subject`）：`later-han-emperor`；字段（`field`）：存活（`alive`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：是（true）
- 第 19 项：
  - 事实条件（`kind=fact`）；类别（`category`）：皇帝（`emperor`）；对象（`subject`）：`later-han-emperor`；字段（`field`）：所属城市（`assigned-city`）；比较关系（`operator`）：不等于（`neq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：`長安`

### 前置事件关系（`prerequisites`）

- 空列表（0 项）

### 结果与分支（仅来源描述顺序）（`orderedResults`）

- 第 1 项：
  - 选择（`choice`）（节点种类（`kind`））
    - 选择标识（`choiceId`）：迁都（`move-capital`）
    - 控制方（`controller`）：`董卓:player-chooses;COM-always-moves`
    - 电脑默认选项（`aiDefault`）：移动（`move`）
    - 可选项（`options`）：
      - 第 1 项：
        - 选项标识（`optionId`）：移动（`move`）
        - 按来源描述排列的结果（`orderedResults`）：
          - 第 1 项：
            - 结果效果（`kind=effect`）；操作（`operation`）：迁移（`relocate`）；作用对象（`target`）：列表（按来源次序）：`later-han-emperor`、`all-officers-assigned-to-洛陽`
              - 参数（`values`）：
                - 目的地（`destination`）：`長安`
          - 第 2 项：
            - 结果效果（`kind=effect`）；操作（`operation`）：降低忠诚（`decrease-loyalty`）；作用对象（`target`）：`officers-with-漢室重視`
              - 参数（`values`）：
                - 数额（`amount`）：未说明（`not-stated`）
                - 势力范围（`forceScope`）：未说明（`not-stated`）
          - 第 3 项：
            - 结果效果（`kind=effect`）；操作（`operation`）：转移全部所列资源（`transfer-all-resources`）；作用对象（`target`）：`洛陽-city-region`
              - 参数（`values`）：
                - 资源（`resources`）：列表（按来源次序）：`gold`、`food`、`soldiers`、`equipment`
                - 目的地（`destination`）：`長安`
          - 第 4 项：
            - 结果效果（`kind=effect`）；操作（`operation`）：设为（`set`）；作用对象（`target`）：`洛陽`
              - 参数（`values`）：
                - 耐久（`durability`）：0
                - 治安（`publicOrder`）：0
          - 第 5 项：
            - 结果效果（`kind=effect`）；操作（`operation`）：全部移除（`remove-all`）；作用对象（`target`）：`洛陽-development-land`
              - 参数（`values`）：
                - 设施类型（`facilityType`）：`domestic`
          - 第 6 项：
            - 结果效果（`kind=effect`）；操作（`operation`）：全部移除（`remove-all`）；作用对象（`target`）：`洛陽-city-region`
              - 参数（`values`）：
                - 设施类型（`facilityType`）：列表（按来源次序）：`traps`、`military`
          - 第 7 项：
            - 结果效果（`kind=effect`）；操作（`operation`）：撤出全部控制据点（`vacate-all-controlled-bases`）；作用对象（`target`）：`董卓`
              - 参数（`values`）：
                - 地区（`region`）：`洛陽-city-region`
          - 第 8 项：
            - 结果效果（`kind=effect`）；操作（`operation`）：增加（`increase`）；作用对象（`target`）：`長安`
              - 参数（`values`）：
                - 金（`gold`）：30000
      - 第 2 项：
        - 选项标识（`optionId`）：`decline`
        - 按来源描述排列的结果（`orderedResults`）：
          - 第 1 项：
            - 结果效果（`kind=effect`）；操作（`operation`）：来源明示无变化（`no-described-change`）；作用对象（`target`）：`event`
              - 参数（`values`）：空属性集（0 项）

### 不确定性与来源限定（`uncertainties`）

- 第 1 项：Loyalty-loss magnitude and affected force scope are not stated.

<a id="atwiki-88-06"></a>

## 观察 06：反董卓連合瓦解

- 事件标识（`eventId`）：`anti-dong-coalition-collapse`
- 观察标识（`observationId`）：`atwiki-88-06`
- 原文标题（`title`）：`反董卓連合瓦解`
- 来源标识（`sourceId`）：`atwiki-88`
- 来源网址（`sourceURL`）：[https://w.atwiki.jp/sangokushi11/pages/88.html](https://w.atwiki.jp/sangokushi11/pages/88.html)
- 来源章节（`sourceSection`）：`反董卓連合瓦解`
- 来源节序（`sourceOrdinal`）：6
- 来源行定位（`sourceLocator`）：
  - 起始行（`startLine`）：194
  - 结束行（`endLine`）：210
- 版本范围（`version`）：
  - 游戏（`game`）：`SAN11`
  - 版本类型（`edition`）：未指定（`unspecified`）
  - 平台（`platform`）：未指定（`unspecified`）
  - 补丁（`patch`）：未指定（`unspecified`）
- 证据性质（`evidence`）：公开攻略转录（`public-guide-transcription`）
- 仅发生一次信息（`onceOnly`）：
  - 状态（`status`）：未说明（`not-stated`）
  - 标志标识（`flagId`）：未提供（null）

### 触发条件（`conditions`）

- 第 1 项：
  - 事实条件（`kind=fact`）；类别（`category`）：剧本（`scenario`）；对象（`subject`）：剧本（`scenario`）；字段（`field`）：编号（`number`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：2
- 第 2 项：
  - 事实条件（`kind=fact`）；类别（`category`）：日期（`date`）；对象（`subject`）：`calendar`；字段（`field`）：当前年月（`current-month`）；比较关系（`operator`）：大于或等于（`gte`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：191、1
- 第 3 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`董卓`；字段（`field`）：存在（`exists`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：是（true）
- 第 4 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`曹操`；字段（`field`）：存在（`exists`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：是（true）
- 第 5 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`袁紹`；字段（`field`）：存在（`exists`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：是（true）
- 第 6 项：
  - 事实条件（`kind=fact`）；类别（`category`）：皇帝（`emperor`）；对象（`subject`）：`董卓`；字段（`field`）：拥立后汉皇帝（`supports-later-han-emperor`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：是（true）
- 第 7 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`董卓`；字段（`field`）：城市数（`city-count`）；比较关系（`operator`）：大于或等于（`gte`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：2
- 第 8 项：
  - 事实条件（`kind=fact`）；类别（`category`）：外交（`diplomacy`）；对象（`subject`）：列表（按来源次序）：`董卓`、`曹操`；字段（`field`）：处于同盟（`allied`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：否（false）
- 第 9 项：
  - 事实条件（`kind=fact`）；类别（`category`）：外交（`diplomacy`）；对象（`subject`）：列表（按来源次序）：`董卓`、`袁紹`；字段（`field`）：处于同盟（`allied`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：否（false）
- 第 10 项：
  - 事实条件（`kind=fact`）；类别（`category`）：外交（`diplomacy`）；对象（`subject`）：列表（按来源次序）：`曹操`、`袁紹`；字段（`field`）：处于同盟（`allied`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：是（true）
- 第 11 项：
  - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：列表（按来源次序）：`董卓`、`曹操`；字段（`field`）：有缘关系（`associated-relationship`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：否（false）
- 第 12 项：
  - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：列表（按来源次序）：`董卓`、`袁紹`；字段（`field`）：有缘关系（`associated-relationship`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：否（false）
- 第 13 项：
  - 事实条件（`kind=fact`）；类别（`category`）：任务或行动（`mission`）；对象（`subject`）：列表（按来源次序）：`董卓`；字段（`field`）：行动已用（`action-used`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：否（false）

### 前置事件关系（`prerequisites`）

- 空列表（0 项）

### 结果与分支（仅来源描述顺序）（`orderedResults`）

- 第 1 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：所列对象间友好度恶化（`worsen-friendship-among`）；作用对象（`target`）：列表（按来源次序）：`曹操`、`劉備`、`孫堅`、`馬騰`、`袁紹`、`袁術`、`公孫瓚`、`韓馥`、`孔融`、`劉岱`、`陶謙`、`孔伷`、`張楊`
    - 参数（`values`）：
      - 变化幅度（`magnitude`）：未说明（`not-stated`）

### 不确定性与来源限定（`uncertainties`）

- 空列表（0 项）

<a id="atwiki-88-07"></a>

## 观察 07：恩讐徐州攻略戦（曹嵩惨殺）

- 事件标识（`eventId`）：`cao-song-murder`
- 观察标识（`observationId`）：`atwiki-88-07`
- 原文标题（`title`）：`恩讐徐州攻略戦（曹嵩惨殺）`
- 来源标识（`sourceId`）：`atwiki-88`
- 来源网址（`sourceURL`）：[https://w.atwiki.jp/sangokushi11/pages/88.html](https://w.atwiki.jp/sangokushi11/pages/88.html)
- 来源章节（`sourceSection`）：`恩讐徐州攻略戦（曹嵩惨殺）`
- 来源节序（`sourceOrdinal`）：7
- 来源行定位（`sourceLocator`）：
  - 起始行（`startLine`）：211
  - 结束行（`endLine`）：229
- 版本范围（`version`）：
  - 游戏（`game`）：`SAN11`
  - 版本类型（`edition`）：未指定（`unspecified`）
  - 平台（`platform`）：未指定（`unspecified`）
  - 补丁（`patch`）：未指定（`unspecified`）
- 证据性质（`evidence`）：公开攻略转录（`public-guide-transcription`）
- 仅发生一次信息（`onceOnly`）：
  - 状态（`status`）：未说明（`not-stated`）
  - 标志标识（`flagId`）：未提供（null）

### 触发条件（`conditions`）

- 第 1 项：
  - 事实条件（`kind=fact`）；类别（`category`）：日期（`date`）；对象（`subject`）：剧本（`scenario`）；字段（`field`）：剧本开始年月（`start-month`）；比较关系（`operator`）：小于或等于（`lte`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：193、6
- 第 2 项：
  - 事实条件（`kind=fact`）；类别（`category`）：日期（`date`）；对象（`subject`）：`calendar`；字段（`field`）：当前年月（`current-month`）；比较关系（`operator`）：大于或等于（`gte`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：194、12
- 第 3 项：
  - 事实条件（`kind=fact`）；类别（`category`）：日期（`date`）；对象（`subject`）：剧本（`scenario`）；字段（`field`）：剧本经过日数（`elapsed-days`）；比较关系（`operator`）：大于或等于（`gte`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：180
- 第 4 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`player`；字段（`field`）：君主（`ruler`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：`曹操`
- 第 5 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`曹操`；字段（`field`）：存在（`exists`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：是（true）
- 第 6 项：
  - 事实条件（`kind=fact`）；类别（`category`）：城市（`city`）；对象（`subject`）：`曹操`；字段（`field`）：持有城市（`cities`）；比较关系（`operator`）：包含全部（`contains-all`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：`陳留`、`濮陽`
- 第 7 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`曹操`；字段（`field`）：城市数（`city-count`）；比较关系（`operator`）：小于或等于（`lte`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：4
- 第 8 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`陶謙`；字段（`field`）：控制方（`controller`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：`COM`
- 第 9 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`陶謙`；字段（`field`）：存在（`exists`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：是（true）
- 第 10 项：
  - 事实条件（`kind=fact`）；类别（`category`）：城市（`city`）；对象（`subject`）：`陶謙`；字段（`field`）：持有城市（`cities`）；比较关系（`operator`）：包含全部（`contains-all`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：`下邳`
- 第 11 项：
  - 事实条件（`kind=fact`）；类别（`category`）：外交（`diplomacy`）；对象（`subject`）：列表（按来源次序）：`曹操`、`陶謙`；字段（`field`）：处于同盟（`allied`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：否（false）
- 第 12 项：
  - 事实条件（`kind=fact`）；类别（`category`）：外交（`diplomacy`）；对象（`subject`）：列表（按来源次序）：`曹操`、`陶謙`；字段（`field`）：友好度（`friendship`）；比较关系（`operator`）：属于（`in`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：`険悪`、`不和`、`中立`
- 第 13 项：
  - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：列表（按来源次序）：`曹操`、`陶謙`；字段（`field`）：有缘关系（`associated-relationship`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：否（false）
- 第 14 项：
  - 事实条件（`kind=fact`）；类别（`category`）：任务或行动（`mission`）；对象（`subject`）：列表（按来源次序）：`曹操`；字段（`field`）：行动已用（`action-used`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：否（false）

### 前置事件关系（`prerequisites`）

- 空列表（0 项）

### 结果与分支（仅来源描述顺序）（`orderedResults`）

- 第 1 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：恶化友好度（`worsen-friendship`）；作用对象（`target`）：列表（按来源次序）：`曹操`、`陶謙`
    - 参数（`values`）：
      - 变化幅度（`magnitude`）：未说明（`not-stated`）
- 第 2 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：增加（`increase`）；作用对象（`target`）：`曹操.all-base-and-unit-soldiers`
    - 参数（`values`）：
      - 气力（`energy`）：10
- 第 3 项：
  - 分支（`branch`）（节点种类（`kind`））
    - 分支标识（`branchId`）：`zhang-kai-resigns`
    - 分支条件（`condition`）：
      - 全部成立（`all`）（节点种类（`kind`））
        - 逻辑：本组各子项均成立；仅表示来源的分组，不引入调度规则
        - 子项（`items`）：
          - 第 1 项：
            - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`陶謙`；字段（`field`）：武将列表（`officers`）；比较关系（`operator`）：包含全部（`contains-all`）；确定性（`certainty`）：来源明示（`stated`）
              - 取值（`value`）：列表（按来源次序）：`張闓`
          - 第 2 项：
            - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：`張闓`；字段（`field`）：状态（`status`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
              - 取值（`value`）：`ordinary`
          - 第 3 项：
            - 事实条件（`kind=fact`）；类别（`category`）：任务或行动（`mission`）；对象（`subject`）：列表（按来源次序）：`張闓`；字段（`field`）：行动已用（`action-used`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
              - 取值（`value`）：否（false）
    - 按来源描述排列的结果（`orderedResults`）：
      - 第 1 项：
        - 结果效果（`kind=effect`）；操作（`operation`）：变为在野（`become-free`）；作用对象（`target`）：`張闓`
          - 参数（`values`）：空属性集（0 项）

### 不确定性与来源限定（`uncertainties`）

- 第 1 项：Source tentatively says there seems to be no further development.

<a id="atwiki-88-08"></a>

## 观察 08：虎を追う者（典韋登用）

- 事件标识（`eventId`）：`recruit-dian-wei`
- 观察标识（`observationId`）：`atwiki-88-08`
- 原文标题（`title`）：`虎を追う者（典韋登用）`
- 来源标识（`sourceId`）：`atwiki-88`
- 来源网址（`sourceURL`）：[https://w.atwiki.jp/sangokushi11/pages/88.html](https://w.atwiki.jp/sangokushi11/pages/88.html)
- 来源章节（`sourceSection`）：`虎を追う者（典韋登用）`
- 来源节序（`sourceOrdinal`）：8
- 来源行定位（`sourceLocator`）：
  - 起始行（`startLine`）：230
  - 结束行（`endLine`）：255
- 版本范围（`version`）：
  - 游戏（`game`）：`SAN11`
  - 版本类型（`edition`）：未指定（`unspecified`）
  - 平台（`platform`）：未指定（`unspecified`）
  - 补丁（`patch`）：未指定（`unspecified`）
- 证据性质（`evidence`）：公开攻略转录（`public-guide-transcription`）
- 仅发生一次信息（`onceOnly`）：
  - 状态（`status`）：未说明（`not-stated`）
  - 标志标识（`flagId`）：未提供（null）

### 触发条件（`conditions`）

- 第 1 项：
  - 事实条件（`kind=fact`）；类别（`category`）：日期（`date`）；对象（`subject`）：剧本（`scenario`）；字段（`field`）：剧本开始年月（`start-month`）；比较关系（`operator`）：小于或等于（`lte`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：193、12
- 第 2 项：
  - 事实条件（`kind=fact`）；类别（`category`）：日期（`date`）；对象（`subject`）：剧本（`scenario`）；字段（`field`）：剧本经过日数（`elapsed-days`）；比较关系（`operator`）：大于或等于（`gte`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：90
- 第 3 项：
  - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：列表（按来源次序）：`典韋`；字段（`field`）：已到预定登场年（`scheduled-debut-year-reached`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：是（true）
- 第 4 项：
  - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：列表（按来源次序）：`典韋`；字段（`field`）：状态（`status`）；比较关系（`operator`）：每一项均属于（`each-in`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：`never-served-free`、`undiscovered`
- 第 5 项：
  - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：列表（按来源次序）：`典韋`、`player-ruler`；字段（`field`）：有缘关系（`associated-relationship`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：否（false）
- 第 6 项：
  - 全部成立（`all`）（节点种类（`kind`））
    - 逻辑：本组各子项均成立；仅表示来源的分组，不引入调度规则
    - 子项（`items`）：
      - 第 1 项：
        - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：列表（按来源次序）：`典韋`；字段（`field`）：厌恶武将（`disliked-officer`）；比较关系（`operator`）：不等于（`neq`）；确定性（`certainty`）：来源明示（`stated`）
          - 取值（`value`）：`player-ruler`
      - 第 2 项：
        - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：`player-ruler`；字段（`field`）：厌恶武将列表（`disliked-officers`）；比较关系（`operator`）：全部不包含（`contains-none`）；确定性（`certainty`）：来源明示（`stated`）
          - 取值（`value`）：列表（按来源次序）：`典韋`
- 第 7 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`player-force`；字段（`field`）：武将列表（`officers`）；比较关系（`operator`）：包含全部（`contains-all`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：`夏侯惇`
- 第 8 项：
  - 事实条件（`kind=fact`）；类别（`category`）：城市（`city`）；对象（`subject`）：列表（按来源次序）：`player-ruler`、`夏侯惇`；字段（`field`）：所属据点（`assigned-base`）；比较关系（`operator`）：全部相同（`all-equal`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：是（true）
- 第 9 项：
  - 全部成立（`all`）（节点种类（`kind`））
    - 逻辑：本组各子项均成立；仅表示来源的分组，不引入调度规则
    - 子项（`items`）：
      - 第 1 项：
        - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：列表（按来源次序）：`夏侯惇`；字段（`field`）：厌恶武将（`disliked-officer`）；比较关系（`operator`）：不等于（`neq`）；确定性（`certainty`）：来源明示（`stated`）
          - 取值（`value`）：`player-ruler`
      - 第 2 项：
        - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：`player-ruler`；字段（`field`）：厌恶武将列表（`disliked-officers`）；比较关系（`operator`）：全部不包含（`contains-none`）；确定性（`certainty`）：来源明示（`stated`）
          - 取值（`value`）：列表（按来源次序）：`夏侯惇`
- 第 10 项：
  - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：`夏侯惇`；字段（`field`）：忠诚（`loyalty`）；比较关系（`operator`）：大于或等于（`gte`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：90
- 第 11 项：
  - 事实条件（`kind=fact`）；类别（`category`）：任务或行动（`mission`）；对象（`subject`）：列表（按来源次序）：`player-ruler`、`夏侯惇`；字段（`field`）：正在执行任务（`on-mission`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：否（false）
- 第 12 项：
  - 事实条件（`kind=fact`）；类别（`category`）：城市（`city`）；对象（`subject`）：`夏侯惇.assigned-city`；字段（`field`）：治安（`public-order`）；比较关系（`operator`）：大于或等于（`gte`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：80
- 第 13 项：
  - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：`典韋`；字段（`field`）：禁止仕官的君主（`prohibited-ruler`）；比较关系（`operator`）：不等于（`neq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：`player-ruler`

### 前置事件关系（`prerequisites`）

- 空列表（0 项）

### 结果与分支（仅来源描述顺序）（`orderedResults`）

- 第 1 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：加入势力（`join-force`）；作用对象（`target`）：`典韋`
    - 参数（`values`）：
      - 势力（`force`）：`player-force`
- 第 2 项：
  - 分支（`branch`）（节点种类（`kind`））
    - 分支标识（`branchId`）：`cao-cao`
    - 分支条件（`condition`）：
      - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`player`；字段（`field`）：君主（`ruler`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
        - 取值（`value`）：`曹操`
    - 按来源描述排列的结果（`orderedResults`）：
      - 第 1 项：
        - 结果效果（`kind=effect`）；操作（`operation`）：设为（`set`）；作用对象（`target`）：`典韋`
          - 参数（`values`）：
            - 忠诚（`loyalty`）：100
            - 功绩（`merit`）：2000
- 第 3 项：
  - 分支（`branch`）（节点种类（`kind`））
    - 分支标识（`branchId`）：`other-ruler`
    - 分支条件（`condition`）：
      - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`player`；字段（`field`）：君主（`ruler`）；比较关系（`operator`）：不等于（`neq`）；确定性（`certainty`）：来源明示（`stated`）
        - 取值（`value`）：`曹操`
    - 按来源描述排列的结果（`orderedResults`）：
      - 第 1 项：
        - 结果效果（`kind=effect`）；操作（`operation`）：设为（`set`）；作用对象（`target`）：`典韋`
          - 参数（`values`）：
            - 忠诚（`loyalty`）：100
            - 功绩（`merit`）：500
- 第 4 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：增加（`increase`）；作用对象（`target`）：`夏侯惇`
    - 参数（`values`）：
      - 功绩（`merit`）：500

### 不确定性与来源限定（`uncertainties`）

- 空列表（0 项）

<a id="atwiki-88-09"></a>

## 观察 09：連環の計

- 事件标识（`eventId`）：`chain-plot-overview`
- 观察标识（`observationId`）：`atwiki-88-09`
- 原文标题（`title`）：`連環の計`
- 来源标识（`sourceId`）：`atwiki-88`
- 来源网址（`sourceURL`）：[https://w.atwiki.jp/sangokushi11/pages/88.html](https://w.atwiki.jp/sangokushi11/pages/88.html)
- 来源章节（`sourceSection`）：`連環の計`
- 来源节序（`sourceOrdinal`）：9
- 来源行定位（`sourceLocator`）：
  - 起始行（`startLine`）：256
  - 结束行（`endLine`）：266
- 版本范围（`version`）：
  - 游戏（`game`）：`SAN11`
  - 版本类型（`edition`）：未指定（`unspecified`）
  - 平台（`platform`）：未指定（`unspecified`）
  - 补丁（`patch`）：未指定（`unspecified`）
- 证据性质（`evidence`）：公开攻略转录（`public-guide-transcription`）
- 仅发生一次信息（`onceOnly`）：
  - 状态（`status`）：未说明（`not-stated`）
  - 标志标识（`flagId`）：未提供（null）

### 触发条件（`conditions`）

- 第 1 项：
  - 事实条件（`kind=fact`）；类别（`category`）：日期（`date`）；对象（`subject`）：`calendar`；字段（`field`）：当前年月（`current-month`）；比较关系（`operator`）：大于或等于（`gte`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：192、1
- 第 2 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`player`；字段（`field`）：君主（`ruler`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：`董卓`
- 第 3 项：
  - 事实条件（`kind=fact`）；类别（`category`）：皇帝（`emperor`）；对象（`subject`）：`董卓`；字段（`field`）：拥立后汉皇帝（`supports-later-han-emperor`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：是（true）
- 第 4 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`董卓`；字段（`field`）：武将列表（`officers`）；比较关系（`operator`）：包含全部（`contains-all`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：`王允`、`呂布`
- 第 5 项：
  - 事实条件（`kind=fact`）；类别（`category`）：城市（`city`）；对象（`subject`）：`董卓.current-city`；字段（`field`）：治安（`public-order`）；比较关系（`operator`）：小于（`lt`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：75
- 第 6 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`董卓`；字段（`field`）：城市数（`city-count`）；比较关系（`operator`）：大于或等于（`gte`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：2
- 第 7 项：
  - 事实条件（`kind=fact`）；类别（`category`）：任务或行动（`mission`）；对象（`subject`）：列表（按来源次序）：`董卓`、`王允`、`呂布`；字段（`field`）：正在执行任务（`on-mission`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：否（false）
- 第 8 项：
  - 条件后果（`if`）（节点种类（`kind`））
    - 分支条件（`condition`）：
      - 事实条件（`kind=fact`）；类别（`category`）：游戏设置（`settings`）；对象（`subject`）：`貂蝉`；字段（`field`）：人物类型（`character-type`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
        - 取值（`value`）：`historical-officer`
    - 条件成立时的后果（`consequence`）：
      - 全部成立（`all`）（节点种类（`kind`））
        - 逻辑：本组各子项均成立；仅表示来源的分组，不引入调度规则
        - 子项（`items`）：
          - 第 1 项：
            - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：`貂蝉`；字段（`field`）：状态（`status`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
              - 取值（`value`）：`not-yet-appeared`

### 前置事件关系（`prerequisites`）

- 空列表（0 项）

### 结果与分支（仅来源描述顺序）（`orderedResults`）

- 第 1 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：未说明（`not-stated`）；作用对象（`target`）：`event`
    - 参数（`values`）：空属性集（0 项）

### 不确定性与来源限定（`uncertainties`）

- 第 1 项：Aggregate guide section only; no individual stages or results are described.

<a id="atwiki-88-10"></a>

## 观察 10：悪来vs許褚（許褚登用）

- 事件标识（`eventId`）：`recruit-xu-chu`
- 观察标识（`observationId`）：`atwiki-88-10`
- 原文标题（`title`）：`悪来vs許褚（許褚登用）`
- 来源标识（`sourceId`）：`atwiki-88`
- 来源网址（`sourceURL`）：[https://w.atwiki.jp/sangokushi11/pages/88.html](https://w.atwiki.jp/sangokushi11/pages/88.html)
- 来源章节（`sourceSection`）：`悪来vs許褚（許褚登用）`
- 来源节序（`sourceOrdinal`）：10
- 来源行定位（`sourceLocator`）：
  - 起始行（`startLine`）：267
  - 结束行（`endLine`）：297
- 版本范围（`version`）：
  - 游戏（`game`）：`SAN11`
  - 版本类型（`edition`）：未指定（`unspecified`）
  - 平台（`platform`）：未指定（`unspecified`）
  - 补丁（`patch`）：未指定（`unspecified`）
- 证据性质（`evidence`）：公开攻略转录（`public-guide-transcription`）
- 仅发生一次信息（`onceOnly`）：
  - 状态（`status`）：未说明（`not-stated`）
  - 标志标识（`flagId`）：未提供（null）

### 触发条件（`conditions`）

- 第 1 项：
  - 事实条件（`kind=fact`）；类别（`category`）：日期（`date`）；对象（`subject`）：剧本（`scenario`）；字段（`field`）：剧本开始年月（`start-month`）；比较关系（`operator`）：小于或等于（`lte`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：193、12
- 第 2 项：
  - 事实条件（`kind=fact`）；类别（`category`）：日期（`date`）；对象（`subject`）：剧本（`scenario`）；字段（`field`）：剧本经过日数（`elapsed-days`）；比较关系（`operator`）：大于或等于（`gte`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：180
- 第 3 项：
  - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：列表（按来源次序）：`許褚`；字段（`field`）：已到预定登场年（`scheduled-debut-year-reached`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：是（true）
- 第 4 项：
  - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：列表（按来源次序）：`許褚`；字段（`field`）：状态（`status`）；比较关系（`operator`）：每一项均属于（`each-in`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：`never-served-free`、`undiscovered`
- 第 5 项：
  - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：列表（按来源次序）：`許褚`、`player-ruler`；字段（`field`）：有缘关系（`associated-relationship`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：否（false）
- 第 6 项：
  - 全部成立（`all`）（节点种类（`kind`））
    - 逻辑：本组各子项均成立；仅表示来源的分组，不引入调度规则
    - 子项（`items`）：
      - 第 1 项：
        - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：列表（按来源次序）：`許褚`；字段（`field`）：厌恶武将（`disliked-officer`）；比较关系（`operator`）：不等于（`neq`）；确定性（`certainty`）：来源明示（`stated`）
          - 取值（`value`）：`player-ruler`
      - 第 2 项：
        - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：`player-ruler`；字段（`field`）：厌恶武将列表（`disliked-officers`）；比较关系（`operator`）：全部不包含（`contains-none`）；确定性（`certainty`）：来源明示（`stated`）
          - 取值（`value`）：列表（按来源次序）：`許褚`
- 第 7 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`player-force`；字段（`field`）：武将列表（`officers`）；比较关系（`operator`）：包含全部（`contains-all`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：`典韋`
- 第 8 项：
  - 事实条件（`kind=fact`）；类别（`category`）：城市（`city`）；对象（`subject`）：列表（按来源次序）：`player-ruler`、`典韋`；字段（`field`）：所属据点（`assigned-base`）；比较关系（`operator`）：全部相同（`all-equal`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：是（true）
- 第 9 项：
  - 全部成立（`all`）（节点种类（`kind`））
    - 逻辑：本组各子项均成立；仅表示来源的分组，不引入调度规则
    - 子项（`items`）：
      - 第 1 项：
        - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：列表（按来源次序）：`典韋`；字段（`field`）：厌恶武将（`disliked-officer`）；比较关系（`operator`）：不等于（`neq`）；确定性（`certainty`）：来源明示（`stated`）
          - 取值（`value`）：`player-ruler`
      - 第 2 项：
        - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：`player-ruler`；字段（`field`）：厌恶武将列表（`disliked-officers`）；比较关系（`operator`）：全部不包含（`contains-none`）；确定性（`certainty`）：来源明示（`stated`）
          - 取值（`value`）：列表（按来源次序）：`典韋`
- 第 10 项：
  - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：`典韋`；字段（`field`）：忠诚（`loyalty`）；比较关系（`operator`）：大于或等于（`gte`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：90
- 第 11 项：
  - 事实条件（`kind=fact`）；类别（`category`）：任务或行动（`mission`）；对象（`subject`）：列表（按来源次序）：`player-ruler`、`典韋`；字段（`field`）：正在执行任务（`on-mission`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：否（false）
- 第 12 项：
  - 事实条件（`kind=fact`）；类别（`category`）：城市（`city`）；对象（`subject`）：`典韋.assigned-city`；字段（`field`）：治安（`public-order`）；比较关系（`operator`）：大于或等于（`gte`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：80

### 前置事件关系（`prerequisites`）

- 空列表（0 项）

### 结果与分支（仅来源描述顺序）（`orderedResults`）

- 第 1 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：开始单挑（`start-duel`）；作用对象（`target`）：列表（按来源次序）：`典韋`、`許褚`
    - 参数（`values`）：空属性集（0 项）
- 第 2 项：
  - 分支（`branch`）（节点种类（`kind`））
    - 分支标识（`branchId`）：`cao-cao-regardless-of-duel`
    - 分支条件（`condition`）：
      - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`player`；字段（`field`）：君主（`ruler`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
        - 取值（`value`）：`曹操`
    - 按来源描述排列的结果（`orderedResults`）：
      - 第 1 项：
        - 结果效果（`kind=effect`）；操作（`operation`）：加入势力（`join-force`）；作用对象（`target`）：`許褚`
          - 参数（`values`）：
            - 势力（`force`）：`player-force`
      - 第 2 项：
        - 结果效果（`kind=effect`）；操作（`operation`）：设为（`set`）；作用对象（`target`）：`許褚`
          - 参数（`values`）：
            - 忠诚（`loyalty`）：100
            - 功绩（`merit`）：2000
      - 第 3 项：
        - 结果效果（`kind=effect`）；操作（`operation`）：增加（`increase`）；作用对象（`target`）：`典韋`
          - 参数（`values`）：
            - 功绩（`merit`）：500
- 第 3 项：
  - 分支（`branch`）（节点种类（`kind`））
    - 分支标识（`branchId`）：`other-ruler-win`
    - 分支条件（`condition`）：
      - 全部成立（`all`）（节点种类（`kind`））
        - 逻辑：本组各子项均成立；仅表示来源的分组，不引入调度规则
        - 子项（`items`）：
          - 第 1 项：
            - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`player`；字段（`field`）：君主（`ruler`）；比较关系（`operator`）：不等于（`neq`）；确定性（`certainty`）：来源明示（`stated`）
              - 取值（`value`）：`曹操`
          - 第 2 项：
            - 事实条件（`kind=fact`）；类别（`category`）：其他（`other`）；对象（`subject`）：`duel`；字段（`field`）：胜方（`winner`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
              - 取值（`value`）：`典韋`
    - 按来源描述排列的结果（`orderedResults`）：
      - 第 1 项：
        - 结果效果（`kind=effect`）；操作（`operation`）：加入势力（`join-force`）；作用对象（`target`）：`許褚`
          - 参数（`values`）：
            - 势力（`force`）：`player-force`
      - 第 2 项：
        - 结果效果（`kind=effect`）；操作（`operation`）：设为（`set`）；作用对象（`target`）：`許褚`
          - 参数（`values`）：
            - 忠诚（`loyalty`）：100
            - 功绩（`merit`）：500
      - 第 3 项：
        - 结果效果（`kind=effect`）；操作（`operation`）：增加（`increase`）；作用对象（`target`）：`典韋`
          - 参数（`values`）：
            - 功绩（`merit`）：300
- 第 4 项：
  - 分支（`branch`）（节点种类（`kind`））
    - 分支标识（`branchId`）：`other-ruler-loss`
    - 分支条件（`condition`）：
      - 全部成立（`all`）（节点种类（`kind`））
        - 逻辑：本组各子项均成立；仅表示来源的分组，不引入调度规则
        - 子项（`items`）：
          - 第 1 项：
            - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`player`；字段（`field`）：君主（`ruler`）；比较关系（`operator`）：不等于（`neq`）；确定性（`certainty`）：来源明示（`stated`）
              - 取值（`value`）：`曹操`
          - 第 2 项：
            - 事实条件（`kind=fact`）；类别（`category`）：其他（`other`）；对象（`subject`）：`duel`；字段（`field`）：败方（`loser`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
              - 取值（`value`）：`典韋`
    - 按来源描述排列的结果（`orderedResults`）：
      - 第 1 项：
        - 结果效果（`kind=effect`）；操作（`operation`）：变为在野（`become-free`）；作用对象（`target`）：`許褚`
          - 参数（`values`）：
            - 城市（`city`）：`outside-player-control`
      - 第 2 项：
        - 结果效果（`kind=effect`）；操作（`operation`）：设为（`set`）；作用对象（`target`）：`許褚`
          - 参数（`values`）：
            - 禁止仕官的君主（`prohibitedRuler`）：`player-ruler`
            - 持续日数（`durationDays`）：90

### 不确定性与来源限定（`uncertainties`）

- 空列表（0 项）

<a id="atwiki-88-11"></a>

## 观察 11：郭嘉推挙

- 事件标识（`eventId`）：`recommend-guo-jia`
- 观察标识（`observationId`）：`atwiki-88-11`
- 原文标题（`title`）：`郭嘉推挙`
- 来源标识（`sourceId`）：`atwiki-88`
- 来源网址（`sourceURL`）：[https://w.atwiki.jp/sangokushi11/pages/88.html](https://w.atwiki.jp/sangokushi11/pages/88.html)
- 来源章节（`sourceSection`）：`郭嘉推挙`
- 来源节序（`sourceOrdinal`）：11
- 来源行定位（`sourceLocator`）：
  - 起始行（`startLine`）：298
  - 结束行（`endLine`）：322
- 版本范围（`version`）：
  - 游戏（`game`）：`SAN11`
  - 版本类型（`edition`）：未指定（`unspecified`）
  - 平台（`platform`）：未指定（`unspecified`）
  - 补丁（`patch`）：未指定（`unspecified`）
- 证据性质（`evidence`）：公开攻略转录（`public-guide-transcription`）
- 仅发生一次信息（`onceOnly`）：
  - 状态（`status`）：未说明（`not-stated`）
  - 标志标识（`flagId`）：未提供（null）

### 触发条件（`conditions`）

- 第 1 项：
  - 事实条件（`kind=fact`）；类别（`category`）：日期（`date`）；对象（`subject`）：剧本（`scenario`）；字段（`field`）：剧本开始年月（`start-month`）；比较关系（`operator`）：小于或等于（`lte`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：193、12
- 第 2 项：
  - 事实条件（`kind=fact`）；类别（`category`）：日期（`date`）；对象（`subject`）：剧本（`scenario`）；字段（`field`）：剧本经过日数（`elapsed-days`）；比较关系（`operator`）：大于或等于（`gte`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：30
- 第 3 项：
  - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：列表（按来源次序）：`郭嘉`；字段（`field`）：已到预定登场年（`scheduled-debut-year-reached`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：是（true）
- 第 4 项：
  - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：列表（按来源次序）：`郭嘉`；字段（`field`）：状态（`status`）；比较关系（`operator`）：每一项均属于（`each-in`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：`never-served-free`、`undiscovered`
- 第 5 项：
  - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：列表（按来源次序）：`郭嘉`、`player-ruler`；字段（`field`）：有缘关系（`associated-relationship`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：否（false）
- 第 6 项：
  - 全部成立（`all`）（节点种类（`kind`））
    - 逻辑：本组各子项均成立；仅表示来源的分组，不引入调度规则
    - 子项（`items`）：
      - 第 1 项：
        - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：列表（按来源次序）：`郭嘉`；字段（`field`）：厌恶武将（`disliked-officer`）；比较关系（`operator`）：不等于（`neq`）；确定性（`certainty`）：来源明示（`stated`）
          - 取值（`value`）：`player-ruler`
      - 第 2 项：
        - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：`player-ruler`；字段（`field`）：厌恶武将列表（`disliked-officers`）；比较关系（`operator`）：全部不包含（`contains-none`）；确定性（`certainty`）：来源明示（`stated`）
          - 取值（`value`）：列表（按来源次序）：`郭嘉`
- 第 7 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`player-force`；字段（`field`）：武将列表（`officers`）；比较关系（`operator`）：包含全部（`contains-all`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：`荀彧`
- 第 8 项：
  - 事实条件（`kind=fact`）；类别（`category`）：城市（`city`）；对象（`subject`）：列表（按来源次序）：`player-ruler`、`荀彧`；字段（`field`）：所属据点（`assigned-base`）；比较关系（`operator`）：全部相同（`all-equal`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：是（true）
- 第 9 项：
  - 全部成立（`all`）（节点种类（`kind`））
    - 逻辑：本组各子项均成立；仅表示来源的分组，不引入调度规则
    - 子项（`items`）：
      - 第 1 项：
        - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：列表（按来源次序）：`荀彧`；字段（`field`）：厌恶武将（`disliked-officer`）；比较关系（`operator`）：不等于（`neq`）；确定性（`certainty`）：来源明示（`stated`）
          - 取值（`value`）：`player-ruler`
      - 第 2 项：
        - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：`player-ruler`；字段（`field`）：厌恶武将列表（`disliked-officers`）；比较关系（`operator`）：全部不包含（`contains-none`）；确定性（`certainty`）：来源明示（`stated`）
          - 取值（`value`）：列表（按来源次序）：`荀彧`
- 第 10 项：
  - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：`荀彧`；字段（`field`）：忠诚（`loyalty`）；比较关系（`operator`）：大于或等于（`gte`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：90
- 第 11 项：
  - 事实条件（`kind=fact`）；类别（`category`）：任务或行动（`mission`）；对象（`subject`）：列表（按来源次序）：`player-ruler`、`荀彧`；字段（`field`）：正在执行任务（`on-mission`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：否（false）

### 前置事件关系（`prerequisites`）

- 空列表（0 项）

### 结果与分支（仅来源描述顺序）（`orderedResults`）

- 第 1 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：加入势力（`join-force`）；作用对象（`target`）：`郭嘉`
    - 参数（`values`）：
      - 势力（`force`）：`player-force`
- 第 2 项：
  - 分支（`branch`）（节点种类（`kind`））
    - 分支标识（`branchId`）：`cao-cao`
    - 分支条件（`condition`）：
      - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`player`；字段（`field`）：君主（`ruler`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
        - 取值（`value`）：`曹操`
    - 按来源描述排列的结果（`orderedResults`）：
      - 第 1 项：
        - 结果效果（`kind=effect`）；操作（`operation`）：设为（`set`）；作用对象（`target`）：`郭嘉`
          - 参数（`values`）：
            - 忠诚（`loyalty`）：100
            - 功绩（`merit`）：4000
- 第 3 项：
  - 分支（`branch`）（节点种类（`kind`））
    - 分支标识（`branchId`）：`other-ruler`
    - 分支条件（`condition`）：
      - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`player`；字段（`field`）：君主（`ruler`）；比较关系（`operator`）：不等于（`neq`）；确定性（`certainty`）：来源明示（`stated`）
        - 取值（`value`）：`曹操`
    - 按来源描述排列的结果（`orderedResults`）：
      - 第 1 项：
        - 结果效果（`kind=effect`）；操作（`operation`）：设为（`set`）；作用对象（`target`）：`郭嘉`
          - 参数（`values`）：
            - 忠诚（`loyalty`）：100
            - 功绩（`merit`）：500
- 第 4 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：增加（`increase`）；作用对象（`target`）：`荀彧`
    - 参数（`values`）：
      - 功绩（`merit`）：500

### 不确定性与来源限定（`uncertainties`）

- 空列表（0 项）

<a id="atwiki-88-12"></a>

## 观察 12：麋氏と劉備（劉備・麋氏結婚）

- 事件标识（`eventId`）：`marry-liu-bei-mi`
- 观察标识（`observationId`）：`atwiki-88-12`
- 原文标题（`title`）：`麋氏と劉備（劉備・麋氏結婚）`
- 来源标识（`sourceId`）：`atwiki-88`
- 来源网址（`sourceURL`）：[https://w.atwiki.jp/sangokushi11/pages/88.html](https://w.atwiki.jp/sangokushi11/pages/88.html)
- 来源章节（`sourceSection`）：`麋氏と劉備（劉備・麋氏結婚）`
- 来源节序（`sourceOrdinal`）：12
- 来源行定位（`sourceLocator`）：
  - 起始行（`startLine`）：323
  - 结束行（`endLine`）：344
- 版本范围（`version`）：
  - 游戏（`game`）：`SAN11`
  - 版本类型（`edition`）：未指定（`unspecified`）
  - 平台（`platform`）：未指定（`unspecified`）
  - 补丁（`patch`）：未指定（`unspecified`）
- 证据性质（`evidence`）：公开攻略转录（`public-guide-transcription`）
- 仅发生一次信息（`onceOnly`）：
  - 状态（`status`）：未说明（`not-stated`）
  - 标志标识（`flagId`）：未提供（null）

### 触发条件（`conditions`）

- 第 1 项：
  - 事实条件（`kind=fact`）；类别（`category`）：日期（`date`）；对象（`subject`）：剧本（`scenario`）；字段（`field`）：剧本开始年月（`start-month`）；比较关系（`operator`）：小于或等于（`lte`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：196、12
- 第 2 项：
  - 事实条件（`kind=fact`）；类别（`category`）：日期（`date`）；对象（`subject`）：剧本（`scenario`）；字段（`field`）：剧本经过日数（`elapsed-days`）；比较关系（`operator`）：大于或等于（`gte`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：30
- 第 3 项：
  - 事实条件（`kind=fact`）；类别（`category`）：日期（`date`）；对象（`subject`）：`calendar`；字段（`field`）：当前年月（`current-month`）；比较关系（`operator`）：大于或等于（`gte`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：195、1
- 第 4 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`劉備`；字段（`field`）：存在（`exists`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：是（true）
- 第 5 项：
  - 事实条件（`kind=fact`）；类别（`category`）：城市（`city`）；对象（`subject`）：`劉備`；字段（`field`）：持有城市（`cities`）；比较关系（`operator`）：包含任一（`contains-any`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：`下邳`、`小沛`
- 第 6 项：
  - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：列表（按来源次序）：`劉備`、`麋氏`；字段（`field`）：配偶（`spouse`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：未提供（null）
- 第 7 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`劉備`；字段（`field`）：武将列表（`officers`）；比较关系（`operator`）：包含全部（`contains-all`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：`麋竺`
- 第 8 项：
  - 条件后果（`if`）（节点种类（`kind`））
    - 分支条件（`condition`）：
      - 事实条件（`kind=fact`）；类别（`category`）：游戏设置（`settings`）；对象（`subject`）：`麋氏`；字段（`field`）：人物类型（`character-type`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
        - 取值（`value`）：`historical-officer`
    - 条件成立时的后果（`consequence`）：
      - 全部成立（`all`）（节点种类（`kind`））
        - 逻辑：本组各子项均成立；仅表示来源的分组，不引入调度规则
        - 子项（`items`）：
          - 第 1 项：
            - 任一成立（`any`）（节点种类（`kind`））
              - 逻辑：本组至少一个子项成立；仅表示来源的分组，不引入调度规则
              - 子项（`items`）：
                - 第 1 项：
                  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`劉備`；字段（`field`）：武将列表（`officers`）；比较关系（`operator`）：包含全部（`contains-all`）；确定性（`certainty`）：来源明示（`stated`）
                    - 取值（`value`）：列表（按来源次序）：`麋氏`
                - 第 2 项：
                  - 全部成立（`all`）（节点种类（`kind`））
                    - 逻辑：本组各子项均成立；仅表示来源的分组，不引入调度规则
                    - 子项（`items`）：
                      - 第 1 项：
                        - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：列表（按来源次序）：`麋氏`；字段（`field`）：已到预定登场年（`scheduled-debut-year-reached`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
                          - 取值（`value`）：是（true）
                      - 第 2 项：
                        - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：列表（按来源次序）：`麋氏`；字段（`field`）：状态（`status`）；比较关系（`operator`）：每一项均属于（`each-in`）；确定性（`certainty`）：来源明示（`stated`）
                          - 取值（`value`）：列表（按来源次序）：`never-served-free`、`undiscovered`
- 第 9 项：
  - 条件后果（`if`）（节点种类（`kind`））
    - 分支条件（`condition`）：
      - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`player`；字段（`field`）：君主（`ruler`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
        - 取值（`value`）：`劉備`
    - 条件成立时的后果（`consequence`）：
      - 全部成立（`all`）（节点种类（`kind`））
        - 逻辑：本组各子项均成立；仅表示来源的分组，不引入调度规则
        - 子项（`items`）：
          - 第 1 项：
            - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：`麋竺`；字段（`field`）：功绩（`merit`）；比较关系（`operator`）：大于或等于（`gte`）；确定性（`certainty`）：来源明示（`stated`）
              - 取值（`value`）：5000
          - 第 2 项：
            - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：`麋竺`；字段（`field`）：忠诚（`loyalty`）；比较关系（`operator`）：大于或等于（`gte`）；确定性（`certainty`）：来源明示（`stated`）
              - 取值（`value`）：90
          - 第 3 项：
            - 事实条件（`kind=fact`）；类别（`category`）：任务或行动（`mission`）；对象（`subject`）：列表（按来源次序）：`劉備`、`麋竺`；字段（`field`）：正在执行任务（`on-mission`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
              - 取值（`value`）：否（false）

### 前置事件关系（`prerequisites`）

- 空列表（0 项）

### 结果与分支（仅来源描述顺序）（`orderedResults`）

- 第 1 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：结婚（`marry`）；作用对象（`target`）：列表（按来源次序）：`劉備`、`麋氏`
    - 参数（`values`）：空属性集（0 项）
- 第 2 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：设为（`set`）；作用对象（`target`）：`麋竺`
    - 参数（`values`）：
      - 忠诚（`loyalty`）：100
- 第 3 项：
  - 分支（`branch`）（节点种类（`kind`））
    - 分支标识（`branchId`）：`historical-mi`
    - 分支条件（`condition`）：
      - 事实条件（`kind=fact`）；类别（`category`）：游戏设置（`settings`）；对象（`subject`）：`麋氏`；字段（`field`）：人物类型（`character-type`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
        - 取值（`value`）：`historical-officer`
    - 按来源描述排列的结果（`orderedResults`）：
      - 第 1 项：
        - 结果效果（`kind=effect`）；操作（`operation`）：设为（`set`）；作用对象（`target`）：`麋氏`
          - 参数（`values`）：
            - 忠诚（`loyalty`）：100
- 第 4 项：
  - 分支（`branch`）（节点种类（`kind`））
    - 分支标识（`branchId`）：`historical-mi-not-subordinate`
    - 分支条件（`condition`）：
      - 全部成立（`all`）（节点种类（`kind`））
        - 逻辑：本组各子项均成立；仅表示来源的分组，不引入调度规则
        - 子项（`items`）：
          - 第 1 项：
            - 事实条件（`kind=fact`）；类别（`category`）：游戏设置（`settings`）；对象（`subject`）：`麋氏`；字段（`field`）：人物类型（`character-type`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
              - 取值（`value`）：`historical-officer`
          - 第 2 项：
            - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`麋氏`；字段（`field`）：势力（`force`）；比较关系（`operator`）：不等于（`neq`）；确定性（`certainty`）：来源明示（`stated`）
              - 取值（`value`）：`劉備`
    - 按来源描述排列的结果（`orderedResults`）：
      - 第 1 项：
        - 结果效果（`kind=effect`）；操作（`operation`）：设为（`set`）；作用对象（`target`）：`麋氏`
          - 参数（`values`）：
            - 功绩（`merit`）：1000

### 不确定性与来源限定（`uncertainties`）

- 第 1 项：The stated results do not explicitly say 麋氏 joins 劉備.

<a id="atwiki-88-13"></a>

## 观察 13：孫策出陣

- 事件标识（`eventId`）：`sun-ce-sortie`
- 观察标识（`observationId`）：`atwiki-88-13`
- 原文标题（`title`）：`孫策出陣`
- 来源标识（`sourceId`）：`atwiki-88`
- 来源网址（`sourceURL`）：[https://w.atwiki.jp/sangokushi11/pages/88.html](https://w.atwiki.jp/sangokushi11/pages/88.html)
- 来源章节（`sourceSection`）：`孫策出陣`
- 来源节序（`sourceOrdinal`）：13
- 来源行定位（`sourceLocator`）：
  - 起始行（`startLine`）：345
  - 结束行（`endLine`）：351
- 版本范围（`version`）：
  - 游戏（`game`）：`SAN11`
  - 版本类型（`edition`）：未指定（`unspecified`）
  - 平台（`platform`）：未指定（`unspecified`）
  - 补丁（`patch`）：未指定（`unspecified`）
- 证据性质（`evidence`）：公开攻略转录（`public-guide-transcription`）
- 仅发生一次信息（`onceOnly`）：
  - 状态（`status`）：未说明（`not-stated`）
  - 标志标识（`flagId`）：未提供（null）

### 触发条件（`conditions`）

- 第 1 项：
  - 事实条件（`kind=fact`）；类别（`category`）：剧本（`scenario`）；对象（`subject`）：剧本（`scenario`）；字段（`field`）：编号（`number`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：3
- 第 2 项：
  - 事实条件（`kind=fact`）；类别（`category`）：日期（`date`）；对象（`subject`）：剧本（`scenario`）；字段（`field`）：剧本经过日数（`elapsed-days`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：0
- 第 3 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`player`；字段（`field`）：君主（`ruler`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：`孫策`

### 前置事件关系（`prerequisites`）

- 空列表（0 项）

### 结果与分支（仅来源描述顺序）（`orderedResults`）

- 第 1 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：未说明（`not-stated`）；作用对象（`target`）：`event`
    - 参数（`values`）：空属性集（0 项）

### 不确定性与来源限定（`uncertainties`）

- 第 1 项：No result block is supplied.

<a id="atwiki-88-14"></a>

## 观察 14：小覇王・孫策（周泰、蒋欽、陳武、董襲、凌操仕官）

- 事件标识（`eventId`）：`recruit-sun-ce-five`
- 观察标识（`observationId`）：`atwiki-88-14`
- 原文标题（`title`）：`小覇王・孫策（周泰、蒋欽、陳武、董襲、凌操仕官）`
- 来源标识（`sourceId`）：`atwiki-88`
- 来源网址（`sourceURL`）：[https://w.atwiki.jp/sangokushi11/pages/88.html](https://w.atwiki.jp/sangokushi11/pages/88.html)
- 来源章节（`sourceSection`）：`小覇王・孫策（周泰、蒋欽、陳武、董襲、凌操仕官）`
- 来源节序（`sourceOrdinal`）：14
- 来源行定位（`sourceLocator`）：
  - 起始行（`startLine`）：352
  - 结束行（`endLine`）：366
- 版本范围（`version`）：
  - 游戏（`game`）：`SAN11`
  - 版本类型（`edition`）：未指定（`unspecified`）
  - 平台（`platform`）：未指定（`unspecified`）
  - 补丁（`patch`）：未指定（`unspecified`）
- 证据性质（`evidence`）：公开攻略转录（`public-guide-transcription`）
- 仅发生一次信息（`onceOnly`）：
  - 状态（`status`）：未说明（`not-stated`）
  - 标志标识（`flagId`）：未提供（null）

### 触发条件（`conditions`）

- 第 1 项：
  - 事实条件（`kind=fact`）；类别（`category`）：日期（`date`）；对象（`subject`）：剧本（`scenario`）；字段（`field`）：剧本开始年月（`start-month`）；比较关系（`operator`）：小于或等于（`lte`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：194、12
- 第 2 项：
  - 事实条件（`kind=fact`）；类别（`category`）：日期（`date`）；对象（`subject`）：剧本（`scenario`）；字段（`field`）：剧本经过日数（`elapsed-days`）；比较关系（`operator`）：大于或等于（`gte`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：30
- 第 3 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`player`；字段（`field`）：君主（`ruler`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：`孫策`
- 第 4 项：
  - 事实条件（`kind=fact`）；类别（`category`）：城市（`city`）；对象（`subject`）：`孫策`；字段（`field`）：持有城市（`cities`）；比较关系（`operator`）：包含全部（`contains-all`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：`柴桑`、`建業`、`呉`
- 第 5 项：
  - 任一成立（`any`）（节点种类（`kind`））
    - 逻辑：本组至少一个子项成立；仅表示来源的分组，不引入调度规则
    - 子项（`items`）：
      - 第 1 项：
        - 全部成立（`all`）（节点种类（`kind`））
          - 逻辑：本组各子项均成立；仅表示来源的分组，不引入调度规则
          - 子项（`items`）：
            - 第 1 项：
              - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：列表（按来源次序）：`周泰`；字段（`field`）：已到预定登场年（`scheduled-debut-year-reached`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
                - 取值（`value`）：是（true）
            - 第 2 项：
              - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：列表（按来源次序）：`周泰`；字段（`field`）：状态（`status`）；比较关系（`operator`）：每一项均属于（`each-in`）；确定性（`certainty`）：来源明示（`stated`）
                - 取值（`value`）：列表（按来源次序）：`never-served-free`、`undiscovered`
      - 第 2 项：
        - 全部成立（`all`）（节点种类（`kind`））
          - 逻辑：本组各子项均成立；仅表示来源的分组，不引入调度规则
          - 子项（`items`）：
            - 第 1 项：
              - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：列表（按来源次序）：`蒋欽`；字段（`field`）：已到预定登场年（`scheduled-debut-year-reached`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
                - 取值（`value`）：是（true）
            - 第 2 项：
              - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：列表（按来源次序）：`蒋欽`；字段（`field`）：状态（`status`）；比较关系（`operator`）：每一项均属于（`each-in`）；确定性（`certainty`）：来源明示（`stated`）
                - 取值（`value`）：列表（按来源次序）：`never-served-free`、`undiscovered`
      - 第 3 项：
        - 全部成立（`all`）（节点种类（`kind`））
          - 逻辑：本组各子项均成立；仅表示来源的分组，不引入调度规则
          - 子项（`items`）：
            - 第 1 项：
              - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：列表（按来源次序）：`陳武`；字段（`field`）：已到预定登场年（`scheduled-debut-year-reached`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
                - 取值（`value`）：是（true）
            - 第 2 项：
              - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：列表（按来源次序）：`陳武`；字段（`field`）：状态（`status`）；比较关系（`operator`）：每一项均属于（`each-in`）；确定性（`certainty`）：来源明示（`stated`）
                - 取值（`value`）：列表（按来源次序）：`never-served-free`、`undiscovered`
      - 第 4 项：
        - 全部成立（`all`）（节点种类（`kind`））
          - 逻辑：本组各子项均成立；仅表示来源的分组，不引入调度规则
          - 子项（`items`）：
            - 第 1 项：
              - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：列表（按来源次序）：`董襲`；字段（`field`）：已到预定登场年（`scheduled-debut-year-reached`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
                - 取值（`value`）：是（true）
            - 第 2 项：
              - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：列表（按来源次序）：`董襲`；字段（`field`）：状态（`status`）；比较关系（`operator`）：每一项均属于（`each-in`）；确定性（`certainty`）：来源明示（`stated`）
                - 取值（`value`）：列表（按来源次序）：`never-served-free`、`undiscovered`
      - 第 5 项：
        - 全部成立（`all`）（节点种类（`kind`））
          - 逻辑：本组各子项均成立；仅表示来源的分组，不引入调度规则
          - 子项（`items`）：
            - 第 1 项：
              - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：列表（按来源次序）：`凌操`；字段（`field`）：已到预定登场年（`scheduled-debut-year-reached`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
                - 取值（`value`）：是（true）
            - 第 2 项：
              - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：列表（按来源次序）：`凌操`；字段（`field`）：状态（`status`）；比较关系（`operator`）：每一项均属于（`each-in`）；确定性（`certainty`）：来源明示（`stated`）
                - 取值（`value`）：列表（按来源次序）：`never-served-free`、`undiscovered`
- 第 6 项：
  - 事实条件（`kind=fact`）；类别（`category`）：任务或行动（`mission`）；对象（`subject`）：列表（按来源次序）：`孫策`；字段（`field`）：正在执行任务（`on-mission`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：否（false）

### 前置事件关系（`prerequisites`）

- 空列表（0 项）

### 结果与分支（仅来源描述顺序）（`orderedResults`）

- 第 1 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：加入势力（`join-force`）；作用对象（`target`）：`participating-officers-only`
    - 参数（`values`）：
      - 候选对象（`candidates`）：列表（按来源次序）：`周泰`、`蒋欽`、`陳武`、`董襲`、`凌操`
      - 势力（`force`）：`孫策`
- 第 2 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：设为（`set`）；作用对象（`target`）：`newly-joined-participating-officers`
    - 参数（`values`）：
      - 忠诚（`loyalty`）：100
      - 功绩（`merit`）：1000

### 不确定性与来源限定（`uncertainties`）

- 第 1 项：The guide selects event participants from the candidates; it does not say all five always join.

<a id="atwiki-88-15"></a>

## 观察 15：二張推挙

- 事件标识（`eventId`）：`recommend-two-zhangs`
- 观察标识（`observationId`）：`atwiki-88-15`
- 原文标题（`title`）：`二張推挙`
- 来源标识（`sourceId`）：`atwiki-88`
- 来源网址（`sourceURL`）：[https://w.atwiki.jp/sangokushi11/pages/88.html](https://w.atwiki.jp/sangokushi11/pages/88.html)
- 来源章节（`sourceSection`）：`二張推挙`
- 来源节序（`sourceOrdinal`）：15
- 来源行定位（`sourceLocator`）：
  - 起始行（`startLine`）：367
  - 结束行（`endLine`）：398
- 版本范围（`version`）：
  - 游戏（`game`）：`SAN11`
  - 版本类型（`edition`）：未指定（`unspecified`）
  - 平台（`platform`）：未指定（`unspecified`）
  - 补丁（`patch`）：未指定（`unspecified`）
- 证据性质（`evidence`）：公开攻略转录（`public-guide-transcription`）
- 仅发生一次信息（`onceOnly`）：
  - 状态（`status`）：未说明（`not-stated`）
  - 标志标识（`flagId`）：未提供（null）

### 触发条件（`conditions`）

- 第 1 项：
  - 事实条件（`kind=fact`）；类别（`category`）：日期（`date`）；对象（`subject`）：剧本（`scenario`）；字段（`field`）：剧本开始年月（`start-month`）；比较关系（`operator`）：小于或等于（`lte`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：194、12
- 第 2 项：
  - 事实条件（`kind=fact`）；类别（`category`）：日期（`date`）；对象（`subject`）：剧本（`scenario`）；字段（`field`）：剧本经过日数（`elapsed-days`）；比较关系（`operator`）：大于或等于（`gte`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：30
- 第 3 项：
  - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：列表（按来源次序）：`張昭`、`張紘`；字段（`field`）：已到预定登场年（`scheduled-debut-year-reached`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：是（true）
- 第 4 项：
  - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：列表（按来源次序）：`張昭`、`張紘`；字段（`field`）：状态（`status`）；比较关系（`operator`）：每一项均属于（`each-in`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：`never-served-free`、`undiscovered`
- 第 5 项：
  - 全部成立（`all`）（节点种类（`kind`））
    - 逻辑：本组各子项均成立；仅表示来源的分组，不引入调度规则
    - 子项（`items`）：
      - 第 1 项：
        - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：列表（按来源次序）：`張昭`、`player-ruler`；字段（`field`）：有缘关系（`associated-relationship`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
          - 取值（`value`）：否（false）
      - 第 2 项：
        - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：列表（按来源次序）：`張紘`、`player-ruler`；字段（`field`）：有缘关系（`associated-relationship`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
          - 取值（`value`）：否（false）
- 第 6 项：
  - 全部成立（`all`）（节点种类（`kind`））
    - 逻辑：本组各子项均成立；仅表示来源的分组，不引入调度规则
    - 子项（`items`）：
      - 第 1 项：
        - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：列表（按来源次序）：`張昭`、`張紘`；字段（`field`）：厌恶武将（`disliked-officer`）；比较关系（`operator`）：不等于（`neq`）；确定性（`certainty`）：来源明示（`stated`）
          - 取值（`value`）：`player-ruler`
      - 第 2 项：
        - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：`player-ruler`；字段（`field`）：厌恶武将列表（`disliked-officers`）；比较关系（`operator`）：全部不包含（`contains-none`）；确定性（`certainty`）：来源明示（`stated`）
          - 取值（`value`）：列表（按来源次序）：`張昭`、`張紘`
- 第 7 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`player-force`；字段（`field`）：武将列表（`officers`）；比较关系（`operator`）：包含全部（`contains-all`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：`周瑜`
- 第 8 项：
  - 事实条件（`kind=fact`）；类别（`category`）：城市（`city`）；对象（`subject`）：列表（按来源次序）：`player-ruler`、`周瑜`；字段（`field`）：所属据点（`assigned-base`）；比较关系（`operator`）：全部相同（`all-equal`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：是（true）
- 第 9 项：
  - 全部成立（`all`）（节点种类（`kind`））
    - 逻辑：本组各子项均成立；仅表示来源的分组，不引入调度规则
    - 子项（`items`）：
      - 第 1 项：
        - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：列表（按来源次序）：`周瑜`；字段（`field`）：厌恶武将（`disliked-officer`）；比较关系（`operator`）：不等于（`neq`）；确定性（`certainty`）：来源明示（`stated`）
          - 取值（`value`）：`player-ruler`
      - 第 2 项：
        - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：`player-ruler`；字段（`field`）：厌恶武将列表（`disliked-officers`）；比较关系（`operator`）：全部不包含（`contains-none`）；确定性（`certainty`）：来源明示（`stated`）
          - 取值（`value`）：列表（按来源次序）：`周瑜`
- 第 10 项：
  - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：`周瑜`；字段（`field`）：忠诚（`loyalty`）；比较关系（`operator`）：大于或等于（`gte`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：90
- 第 11 项：
  - 事实条件（`kind=fact`）；类别（`category`）：任务或行动（`mission`）；对象（`subject`）：列表（按来源次序）：`player-ruler`、`周瑜`；字段（`field`）：正在执行任务（`on-mission`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：否（false）
- 第 12 项：
  - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：`周瑜`；字段（`field`）：状态（`status`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：`strategist`

### 前置事件关系（`prerequisites`）

- 空列表（0 项）

### 结果与分支（仅来源描述顺序）（`orderedResults`）

- 第 1 项：
  - 分支（`branch`）（节点种类（`kind`））
    - 分支标识（`branchId`）：`other-ruler-debate`
    - 分支条件（`condition`）：
      - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`player`；字段（`field`）：君主（`ruler`）；比较关系（`operator`）：不等于（`neq`）；确定性（`certainty`）：来源明示（`stated`）
        - 取值（`value`）：`孫策`
    - 按来源描述排列的结果（`orderedResults`）：
      - 第 1 项：
        - 结果效果（`kind=effect`）；操作（`operation`）：开始舌战（`start-debate`）；作用对象（`target`）：`participants-not-stated`
          - 参数（`values`）：空属性集（0 项）
- 第 2 项：
  - 分支（`branch`）（节点种类（`kind`））
    - 分支标识（`branchId`）：`sun-ce-no-debate`
    - 分支条件（`condition`）：
      - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`player`；字段（`field`）：君主（`ruler`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
        - 取值（`value`）：`孫策`
    - 按来源描述排列的结果（`orderedResults`）：
      - 第 1 项：
        - 结果效果（`kind=effect`）；操作（`operation`）：加入势力（`join-force`）；作用对象（`target`）：列表（按来源次序）：`張昭`、`張紘`
          - 参数（`values`）：
            - 势力（`force`）：`player-force`
      - 第 2 项：
        - 结果效果（`kind=effect`）；操作（`operation`）：设为（`set`）；作用对象（`target`）：列表（按来源次序）：`張昭`、`張紘`
          - 参数（`values`）：
            - 忠诚（`loyalty`）：100
            - 功绩（`merit`）：4000
      - 第 3 项：
        - 结果效果（`kind=effect`）；操作（`operation`）：增加（`increase`）；作用对象（`target`）：`周瑜`
          - 参数（`values`）：
            - 功绩（`merit`）：500
- 第 3 项：
  - 分支（`branch`）（节点种类（`kind`））
    - 分支标识（`branchId`）：`other-ruler-win`
    - 分支条件（`condition`）：
      - 全部成立（`all`）（节点种类（`kind`））
        - 逻辑：本组各子项均成立；仅表示来源的分组，不引入调度规则
        - 子项（`items`）：
          - 第 1 项：
            - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`player`；字段（`field`）：君主（`ruler`）；比较关系（`operator`）：不等于（`neq`）；确定性（`certainty`）：来源明示（`stated`）
              - 取值（`value`）：`孫策`
          - 第 2 项：
            - 事实条件（`kind=fact`）；类别（`category`）：其他（`other`）；对象（`subject`）：`debate`；字段（`field`）：玩家结果（`player-outcome`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
              - 取值（`value`）：`win`
    - 按来源描述排列的结果（`orderedResults`）：
      - 第 1 项：
        - 结果效果（`kind=effect`）；操作（`operation`）：加入势力（`join-force`）；作用对象（`target`）：列表（按来源次序）：`張昭`、`張紘`
          - 参数（`values`）：
            - 势力（`force`）：`player-force`
      - 第 2 项：
        - 结果效果（`kind=effect`）；操作（`operation`）：设为（`set`）；作用对象（`target`）：列表（按来源次序）：`張昭`、`張紘`
          - 参数（`values`）：
            - 忠诚（`loyalty`）：100
            - 功绩（`merit`）：500
      - 第 3 项：
        - 结果效果（`kind=effect`）；操作（`operation`）：增加（`increase`）；作用对象（`target`）：`周瑜`
          - 参数（`values`）：
            - 功绩（`merit`）：300
- 第 4 项：
  - 分支（`branch`）（节点种类（`kind`））
    - 分支标识（`branchId`）：`other-ruler-loss`
    - 分支条件（`condition`）：
      - 全部成立（`all`）（节点种类（`kind`））
        - 逻辑：本组各子项均成立；仅表示来源的分组，不引入调度规则
        - 子项（`items`）：
          - 第 1 项：
            - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`player`；字段（`field`）：君主（`ruler`）；比较关系（`operator`）：不等于（`neq`）；确定性（`certainty`）：来源明示（`stated`）
              - 取值（`value`）：`孫策`
          - 第 2 项：
            - 事实条件（`kind=fact`）；类别（`category`）：其他（`other`）；对象（`subject`）：`debate`；字段（`field`）：玩家结果（`player-outcome`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
              - 取值（`value`）：`loss`
    - 按来源描述排列的结果（`orderedResults`）：
      - 第 1 项：
        - 结果效果（`kind=effect`）；操作（`operation`）：变为在野（`become-free`）；作用对象（`target`）：列表（按来源次序）：`張昭`、`張紘`
          - 参数（`values`）：
            - 城市（`city`）：`outside-player-control`
      - 第 2 项：
        - 结果效果（`kind=effect`）；操作（`operation`）：设为（`set`）；作用对象（`target`）：列表（按来源次序）：`張昭`、`張紘`
          - 参数（`values`）：
            - 禁止仕官的君主（`prohibitedRuler`）：`player-ruler`
            - 持续日数（`durationDays`）：360

### 不确定性与来源限定（`uncertainties`）

- 空列表（0 项）

<a id="atwiki-88-16"></a>

## 观察 16：二喬婚礼

- 事件标识（`eventId`）：`marry-two-qiaos`
- 观察标识（`observationId`）：`atwiki-88-16`
- 原文标题（`title`）：`二喬婚礼`
- 来源标识（`sourceId`）：`atwiki-88`
- 来源网址（`sourceURL`）：[https://w.atwiki.jp/sangokushi11/pages/88.html](https://w.atwiki.jp/sangokushi11/pages/88.html)
- 来源章节（`sourceSection`）：`二喬婚礼`
- 来源节序（`sourceOrdinal`）：16
- 来源行定位（`sourceLocator`）：
  - 起始行（`startLine`）：399
  - 结束行（`endLine`）：411
- 版本范围（`version`）：
  - 游戏（`game`）：`SAN11`
  - 版本类型（`edition`）：未指定（`unspecified`）
  - 平台（`platform`）：未指定（`unspecified`）
  - 补丁（`patch`）：未指定（`unspecified`）
- 证据性质（`evidence`）：公开攻略转录（`public-guide-transcription`）
- 仅发生一次信息（`onceOnly`）：
  - 状态（`status`）：未说明（`not-stated`）
  - 标志标识（`flagId`）：未提供（null）

### 触发条件（`conditions`）

- 第 1 项：
  - 事实条件（`kind=fact`）；类别（`category`）：日期（`date`）；对象（`subject`）：剧本（`scenario`）；字段（`field`）：剧本开始年月（`start-month`）；比较关系（`operator`）：小于或等于（`lte`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：198、12
- 第 2 项：
  - 事实条件（`kind=fact`）；类别（`category`）：日期（`date`）；对象（`subject`）：剧本（`scenario`）；字段（`field`）：剧本经过日数（`elapsed-days`）；比较关系（`operator`）：大于或等于（`gte`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：30
- 第 3 项：
  - 事实条件（`kind=fact`）；类别（`category`）：日期（`date`）；对象（`subject`）：`calendar`；字段（`field`）：当前年月（`current-month`）；比较关系（`operator`）：大于或等于（`gte`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：196、1
- 第 4 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`孫呉勢力`；字段（`field`）：君主（`ruler`）；比较关系（`operator`）：属于（`in`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：`孫堅`、`孫策`
- 第 5 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`孫呉勢力`；字段（`field`）：存在（`exists`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：是（true）
- 第 6 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`孫呉勢力`；字段（`field`）：武将列表（`officers`）；比较关系（`operator`）：包含全部（`contains-all`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：`孫策`、`周瑜`
- 第 7 项：
  - 事实条件（`kind=fact`）；类别（`category`）：城市（`city`）；对象（`subject`）：`孫呉勢力`；字段（`field`）：持有城市（`cities`）；比较关系（`operator`）：包含全部（`contains-all`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：`柴桑`、`建業`、`呉`、`会稽`
- 第 8 项：
  - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：列表（按来源次序）：`孫策`、`周瑜`、`大喬`、`小喬`；字段（`field`）：配偶（`spouse`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：未提供（null）
- 第 9 项：
  - 事实条件（`kind=fact`）；类别（`category`）：城市（`city`）；对象（`subject`）：列表（按来源次序）：`孫策`、`周瑜`；字段（`field`）：当前所在据点（`current-base`）；比较关系（`operator`）：全部相同（`all-equal`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：是（true）
- 第 10 项：
  - 事实条件（`kind=fact`）；类别（`category`）：任务或行动（`mission`）；对象（`subject`）：列表（按来源次序）：`孫策`、`周瑜`；字段（`field`）：正在执行任务（`on-mission`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：否（false）
- 第 11 项：
  - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：列表（按来源次序）：`大喬`、`小喬`；字段（`field`）：位置或状态（`location/status`）；比较关系（`operator`）：每一项均属于（`each-in`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：`in-孫呉勢力-including-never-served-free`、`undiscovered`

### 前置事件关系（`prerequisites`）

- 空列表（0 项）

### 结果与分支（仅来源描述顺序）（`orderedResults`）

- 第 1 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：未说明（`not-stated`）；作用对象（`target`）：`event`
    - 参数（`values`）：空属性集（0 项）

### 不确定性与来源限定（`uncertainties`）

- 第 1 项：No result block is supplied. The source allows never-served free officers alongside force membership without clarifying location versus allegiance.

<a id="atwiki-88-17"></a>

## 观察 17：偽帝僭称

- 事件标识（`eventId`）：`yuan-shu-usurps`
- 观察标识（`observationId`）：`atwiki-88-17`
- 原文标题（`title`）：`偽帝僭称`
- 来源标识（`sourceId`）：`atwiki-88`
- 来源网址（`sourceURL`）：[https://w.atwiki.jp/sangokushi11/pages/88.html](https://w.atwiki.jp/sangokushi11/pages/88.html)
- 来源章节（`sourceSection`）：`偽帝僭称`
- 来源节序（`sourceOrdinal`）：17
- 来源行定位（`sourceLocator`）：
  - 起始行（`startLine`）：412
  - 结束行（`endLine`）：441
- 版本范围（`version`）：
  - 游戏（`game`）：`SAN11`
  - 版本类型（`edition`）：未指定（`unspecified`）
  - 平台（`platform`）：未指定（`unspecified`）
  - 补丁（`patch`）：未指定（`unspecified`）
- 证据性质（`evidence`）：公开攻略转录（`public-guide-transcription`）
- 仅发生一次信息（`onceOnly`）：
  - 状态（`status`）：未说明（`not-stated`）
  - 标志标识（`flagId`）：未提供（null）

### 触发条件（`conditions`）

- 第 1 项：
  - 事实条件（`kind=fact`）；类别（`category`）：日期（`date`）；对象（`subject`）：剧本（`scenario`）；字段（`field`）：剧本经过日数（`elapsed-days`）；比较关系（`operator`）：大于或等于（`gte`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：30
- 第 2 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`袁術`；字段（`field`）：存在（`exists`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：是（true）
- 第 3 项：
  - 事实条件（`kind=fact`）；类别（`category`）：皇帝（`emperor`）；对象（`subject`）：`袁術`；字段（`field`）：拥立后汉皇帝（`supports-later-han-emperor`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：否（false）
- 第 4 项：
  - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：`袁術`；字段（`field`）：物品（`items`）；比较关系（`operator`）：包含（`contains`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：`玉璽`
- 第 5 项：
  - 事实条件（`kind=fact`）；类别（`category`）：爵位（`title`）；对象（`subject`）：`袁術`；字段（`field`）：爵位（`rank-title`）；比较关系（`operator`）：不等于（`neq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：`皇帝`
- 第 6 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`袁術`；字段（`field`）：城市数（`city-count`）；比较关系（`operator`）：大于或等于（`gte`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：3
- 第 7 项：
  - 事实条件（`kind=fact`）；类别（`category`）：任务或行动（`mission`）；对象（`subject`）：列表（按来源次序）：`袁術`；字段（`field`）：正在执行任务（`on-mission`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：否（false）
- 第 8 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`COM-forces`；字段（`field`）：国号（`country-name`）；比较关系（`operator`）：全部不包含（`contains-none`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：`成`

### 前置事件关系（`prerequisites`）

- 空列表（0 项）

### 结果与分支（仅来源描述顺序）（`orderedResults`）

- 第 1 项：
  - 选择（`choice`）（节点种类（`kind`））
    - 选择标识（`choiceId`）：`accept-emperor`
    - 控制方（`controller`）：`袁術:player-chooses;COM-accepts`
    - 电脑默认选项（`aiDefault`）：`accept`
    - 可选项（`options`）：
      - 第 1 项：
        - 选项标识（`optionId`）：`accept`
        - 按来源描述排列的结果（`orderedResults`）：
          - 第 1 项：
            - 结果效果（`kind=effect`）；操作（`operation`）：设为（`set`）；作用对象（`target`）：`袁術`
              - 参数（`values`）：
                - 爵位（`rankTitle`）：`皇帝`
          - 第 2 项：
            - 结果效果（`kind=effect`）；操作（`operation`）：设为（`set`）；作用对象（`target`）：`袁術-force`
              - 参数（`values`）：
                - 国号（`countryName`）：`成`
          - 第 3 项：
            - 结果效果（`kind=effect`）；操作（`operation`）：降低友好度（`decrease-friendship`）；作用对象（`target`）：`袁術`
              - 参数（`values`）：
                - 作用对象筛选（`targetSelector`）：
                  - 全部成立（`all`）（节点种类（`kind`））
                    - 逻辑：本组各子项均成立；仅表示来源的分组，不引入调度规则
                    - 子项（`items`）：
                      - 第 1 项：
                        - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`selected-force`；字段（`field`）：控制方（`controller`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
                          - 取值（`value`）：`player`
                      - 第 2 项：
                        - 事实条件（`kind=fact`）；类别（`category`）：外交（`diplomacy`）；对象（`subject`）：列表（按来源次序）：`selected-force`、`袁術`；字段（`field`）：处于同盟（`allied`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
                          - 取值（`value`）：否（false）
                      - 第 3 项：
                        - 事实条件（`kind=fact`）；类别（`category`）：外交（`diplomacy`）；对象（`subject`）：列表（按来源次序）：`selected-force`、`袁術`；字段（`field`）：友好度（`friendship`）；比较关系（`operator`）：小于（`lt`）；确定性（`certainty`）：来源明示（`stated`）
                          - 取值（`value`）：`好意`
                      - 第 4 项：
                        - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：`selected-force.ruler`；字段（`field`）：汉室态度（`Han-attitude`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
                          - 取值（`value`）：`重視`
                      - 第 5 项：
                        - 任一成立（`any`）（节点种类（`kind`））
                          - 逻辑：本组至少一个子项成立；仅表示来源的分组，不引入调度规则
                          - 子项（`items`）：
                            - 第 1 项：
                              - 事实条件（`kind=fact`）；类别（`category`）：皇帝（`emperor`）；对象（`subject`）：`selected-force`；字段（`field`）：拥立后汉皇帝（`supports-later-han-emperor`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
                                - 取值（`value`）：是（true）
                            - 第 2 项：
                              - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：`selected-force.ruler`；字段（`field`）：汉室态度（`Han-attitude`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
                                - 取值（`value`）：`重視`
                            - 第 3 项：
                              - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`selected-force`；字段（`field`）：君主（`ruler`）；比较关系（`operator`）：属于（`in`）；确定性（`certainty`）：来源明示（`stated`）
                                - 取值（`value`）：列表（按来源次序）：`袁紹`、`曹操`、`孫堅`、`孫策`、`孫権`、`劉備`、`呂布`
                - 变化幅度（`magnitude`）：未说明（`not-stated`）
                - 方向（`direction`）：未说明（`not-stated`）
          - 第 4 项：
            - 结果效果（`kind=effect`）；操作（`operation`）：恶化友好度（`worsen-friendship`）；作用对象（`target`）：`袁術`
              - 参数（`values`）：
                - 作用对象筛选（`targetSelector`）：
                  - 全部成立（`all`）（节点种类（`kind`））
                    - 逻辑：本组各子项均成立；仅表示来源的分组，不引入调度规则
                    - 子项（`items`）：
                      - 第 1 项：
                        - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`selected-force`；字段（`field`）：控制方（`controller`）；比较关系（`operator`）：不等于（`neq`）；确定性（`certainty`）：来源明示（`stated`）
                          - 取值（`value`）：`player`
                      - 第 2 项：
                        - 任一成立（`any`）（节点种类（`kind`））
                          - 逻辑：本组至少一个子项成立；仅表示来源的分组，不引入调度规则
                          - 子项（`items`）：
                            - 第 1 项：
                              - 事实条件（`kind=fact`）；类别（`category`）：皇帝（`emperor`）；对象（`subject`）：`selected-force`；字段（`field`）：拥立后汉皇帝（`supports-later-han-emperor`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
                                - 取值（`value`）：是（true）
                            - 第 2 项：
                              - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：`selected-force.ruler`；字段（`field`）：汉室态度（`Han-attitude`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
                                - 取值（`value`）：`重視`
                            - 第 3 项：
                              - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`selected-force`；字段（`field`）：君主（`ruler`）；比较关系（`operator`）：属于（`in`）；确定性（`certainty`）：来源明示（`stated`）
                                - 取值（`value`）：列表（按来源次序）：`袁紹`、`曹操`、`孫堅`、`孫策`、`孫権`、`劉備`、`呂布`
                - 变化幅度（`magnitude`）：未说明（`not-stated`）
          - 第 5 项：
            - 结果效果（`kind=effect`）；操作（`operation`）：解除同盟（`break-alliance`）；作用对象（`target`）：`袁術`
              - 参数（`values`）：
                - 作用对象筛选（`targetSelector`）：
                  - 全部成立（`all`）（节点种类（`kind`））
                    - 逻辑：本组各子项均成立；仅表示来源的分组，不引入调度规则
                    - 子项（`items`）：
                      - 第 1 项：
                        - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`selected-force`；字段（`field`）：控制方（`controller`）；比较关系（`operator`）：不等于（`neq`）；确定性（`certainty`）：来源明示（`stated`）
                          - 取值（`value`）：`player`
                      - 第 2 项：
                        - 任一成立（`any`）（节点种类（`kind`））
                          - 逻辑：本组至少一个子项成立；仅表示来源的分组，不引入调度规则
                          - 子项（`items`）：
                            - 第 1 项：
                              - 事实条件（`kind=fact`）；类别（`category`）：皇帝（`emperor`）；对象（`subject`）：`selected-force`；字段（`field`）：拥立后汉皇帝（`supports-later-han-emperor`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
                                - 取值（`value`）：是（true）
                            - 第 2 项：
                              - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：`selected-force.ruler`；字段（`field`）：汉室态度（`Han-attitude`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
                                - 取值（`value`）：`重視`
                            - 第 3 项：
                              - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`selected-force`；字段（`field`）：君主（`ruler`）；比较关系（`operator`）：属于（`in`）；确定性（`certainty`）：来源明示（`stated`）
                                - 取值（`value`）：列表（按来源次序）：`袁紹`、`曹操`、`孫堅`、`孫策`、`孫権`、`劉備`、`呂布`
      - 第 2 项：
        - 选项标识（`optionId`）：`decline`
        - 按来源描述排列的结果（`orderedResults`）：
          - 第 1 项：
            - 结果效果（`kind=effect`）；操作（`operation`）：来源明示无变化（`no-described-change`）；作用对象（`target`）：`event`
              - 参数（`values`）：空属性集（0 项）

### 不确定性与来源限定（`uncertainties`）

- 第 1 项：The player-force selector redundantly repeats 漢室重視; the redundancy is retained. The malformed non-player list is interpreted as its described selector and ordered effects.

<a id="atwiki-88-18"></a>

## 观察 18：御曹司一番乗り（曹丕・甄氏結婚）

- 事件标识（`eventId`）：`marry-cao-pi-zhen`
- 观察标识（`observationId`）：`atwiki-88-18`
- 原文标题（`title`）：`御曹司一番乗り（曹丕・甄氏結婚）`
- 来源标识（`sourceId`）：`atwiki-88`
- 来源网址（`sourceURL`）：[https://w.atwiki.jp/sangokushi11/pages/88.html](https://w.atwiki.jp/sangokushi11/pages/88.html)
- 来源章节（`sourceSection`）：`御曹司一番乗り（曹丕・甄氏結婚）`
- 来源节序（`sourceOrdinal`）：18
- 来源行定位（`sourceLocator`）：
  - 起始行（`startLine`）：442
  - 结束行（`endLine`）：462
- 版本范围（`version`）：
  - 游戏（`game`）：`SAN11`
  - 版本类型（`edition`）：未指定（`unspecified`）
  - 平台（`platform`）：未指定（`unspecified`）
  - 补丁（`patch`）：未指定（`unspecified`）
- 证据性质（`evidence`）：公开攻略转录（`public-guide-transcription`）
- 仅发生一次信息（`onceOnly`）：
  - 状态（`status`）：未说明（`not-stated`）
  - 标志标识（`flagId`）：未提供（null）

### 触发条件（`conditions`）

- 第 1 项：
  - 事实条件（`kind=fact`）；类别（`category`）：日期（`date`）；对象（`subject`）：剧本（`scenario`）；字段（`field`）：剧本开始年月（`start-month`）；比较关系（`operator`）：小于或等于（`lte`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：204、12
- 第 2 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`曹丕`；字段（`field`）：属于势力（`belongs-to-force`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：是（true）
- 第 3 项：
  - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：列表（按来源次序）：`曹丕`；字段（`field`）：配偶（`spouse`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：未提供（null）
- 第 4 项：
  - 事实条件（`kind=fact`）；类别（`category`）：任务或行动（`mission`）；对象（`subject`）：列表（按来源次序）：`曹丕`；字段（`field`）：正在执行任务（`on-mission`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：否（false）
- 第 5 项：
  - 条件后果（`if`）（节点种类（`kind`））
    - 分支条件（`condition`）：
      - 事实条件（`kind=fact`）；类别（`category`）：游戏设置（`settings`）；对象（`subject`）：`甄氏`；字段（`field`）：人物类型（`character-type`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
        - 取值（`value`）：`historical-officer`
    - 条件成立时的后果（`consequence`）：
      - 全部成立（`all`）（节点种类（`kind`））
        - 逻辑：本组各子项均成立；仅表示来源的分组，不引入调度规则
        - 子项（`items`）：
          - 第 1 项：
            - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：`甄氏`；字段（`field`）：被指定对象俘虏（`prisoner-of`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
              - 取值（`value`）：`曹丕.force`
          - 第 2 项：
            - 事实条件（`kind=fact`）；类别（`category`）：城市（`city`）；对象（`subject`）：列表（按来源次序）：`甄氏`、`曹丕`；字段（`field`）：当前所在据点（`current-base`）；比较关系（`operator`）：全部相同（`all-equal`）；确定性（`certainty`）：来源明示（`stated`）
              - 取值（`value`）：是（true）
          - 第 3 项：
            - 任一成立（`any`）（节点种类（`kind`））
              - 逻辑：本组至少一个子项成立；仅表示来源的分组，不引入调度规则
              - 子项（`items`）：
                - 第 1 项：
                  - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：列表（按来源次序）：`甄氏`；字段（`field`）：配偶（`spouse`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
                    - 取值（`value`）：未提供（null）
                - 第 2 项：
                  - 全部成立（`all`）（节点种类（`kind`））
                    - 逻辑：本组各子项均成立；仅表示来源的分组，不引入调度规则
                    - 子项（`items`）：
                      - 第 1 项：
                        - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：`甄氏`；字段（`field`）：配偶（`spouse`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
                          - 取值（`value`）：`袁煕`
                      - 第 2 项：
                        - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：列表（按来源次序）：`曹丕`、`袁煕`；字段（`field`）：势力（`force`）；比较关系（`operator`）：并非全部相同（`not-all-equal`）；确定性（`certainty`）：来源明示（`stated`）
                          - 取值（`value`）：是（true）
- 第 6 项：
  - 条件后果（`if`）（节点种类（`kind`））
    - 分支条件（`condition`）：
      - 事实条件（`kind=fact`）；类别（`category`）：游戏设置（`settings`）；对象（`subject`）：`甄氏`；字段（`field`）：人物类型（`character-type`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
        - 取值（`value`）：`event-character`
    - 条件成立时的后果（`consequence`）：
      - 全部成立（`all`）（节点种类（`kind`））
        - 逻辑：本组各子项均成立；仅表示来源的分组，不引入调度规则
        - 子项（`items`）：
          - 第 1 项：
            - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：`袁煕`；字段（`field`）：被指定对象俘虏（`prisoner-of`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
              - 取值（`value`）：`曹丕.force`
          - 第 2 项：
            - 事实条件（`kind=fact`）；类别（`category`）：城市（`city`）；对象（`subject`）：列表（按来源次序）：`袁煕`、`曹丕`；字段（`field`）：当前所在据点（`current-base`）；比较关系（`operator`）：全部相同（`all-equal`）；确定性（`certainty`）：来源明示（`stated`）
              - 取值（`value`）：是（true）

### 前置事件关系（`prerequisites`）

- 空列表（0 项）

### 结果与分支（仅来源描述顺序）（`orderedResults`）

- 第 1 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：结婚（`marry`）；作用对象（`target`）：列表（按来源次序）：`曹丕`、`甄氏`
    - 参数（`values`）：空属性集（0 项）
- 第 2 项：
  - 分支（`branch`）（节点种类（`kind`））
    - 分支标识（`branchId`）：`previous-yuan-marriage`
    - 分支条件（`condition`）：
      - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：列表（按来源次序）：`袁煕`、`甄氏`；字段（`field`）：已婚（`married`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
        - 取值（`value`）：是（true）
    - 按来源描述排列的结果（`orderedResults`）：
      - 第 1 项：
        - 结果效果（`kind=effect`）；操作（`operation`）：解除婚姻（`dissolve-marriage`）；作用对象（`target`）：列表（按来源次序）：`袁煕`、`甄氏`
          - 参数（`values`）：空属性集（0 项）
- 第 3 项：
  - 分支（`branch`）（节点种类（`kind`））
    - 分支标识（`branchId`）：`historical-zhen`
    - 分支条件（`condition`）：
      - 事实条件（`kind=fact`）；类别（`category`）：游戏设置（`settings`）；对象（`subject`）：`甄氏`；字段（`field`）：人物类型（`character-type`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
        - 取值（`value`）：`historical-officer`
    - 按来源描述排列的结果（`orderedResults`）：
      - 第 1 项：
        - 结果效果（`kind=effect`）；操作（`operation`）：加入势力（`join-force`）；作用对象（`target`）：`甄氏`
          - 参数（`values`）：
            - 势力（`force`）：`曹丕.force`
      - 第 2 项：
        - 结果效果（`kind=effect`）；操作（`operation`）：设为（`set`）；作用对象（`target`）：`甄氏`
          - 参数（`values`）：
            - 忠诚（`loyalty`）：100
            - 功绩（`merit`）：3000

### 不确定性与来源限定（`uncertainties`）

- 第 1 项：Effects retain source presentation order, which lists the new marriage before dissolution of the old marriage.

<a id="atwiki-88-19"></a>

## 观察 19：二強開戦-条件

- 事件标识（`eventId`）：`two-powers-war`
- 观察标识（`observationId`）：`atwiki-88-19`
- 原文标题（`title`）：`二強開戦-条件`
- 来源标识（`sourceId`）：`atwiki-88`
- 来源网址（`sourceURL`）：[https://w.atwiki.jp/sangokushi11/pages/88.html](https://w.atwiki.jp/sangokushi11/pages/88.html)
- 来源章节（`sourceSection`）：`二強開戦-条件`
- 来源节序（`sourceOrdinal`）：19
- 来源行定位（`sourceLocator`）：
  - 起始行（`startLine`）：463
  - 结束行（`endLine`）：480
- 版本范围（`version`）：
  - 游戏（`game`）：`SAN11`
  - 版本类型（`edition`）：未指定（`unspecified`）
  - 平台（`platform`）：未指定（`unspecified`）
  - 补丁（`patch`）：未指定（`unspecified`）
- 证据性质（`evidence`）：公开攻略转录（`public-guide-transcription`）
- 仅发生一次信息（`onceOnly`）：
  - 状态（`status`）：未说明（`not-stated`）
  - 标志标识（`flagId`）：未提供（null）

### 触发条件（`conditions`）

- 第 1 项：
  - 任一成立（`any`）（节点种类（`kind`））
    - 逻辑：本组至少一个子项成立；仅表示来源的分组，不引入调度规则
    - 子项（`items`）：
      - 第 1 项：
        - 全部成立（`all`）（节点种类（`kind`））
          - 逻辑：本组各子项均成立；仅表示来源的分组，不引入调度规则
          - 子项（`items`）：
            - 第 1 项：
              - 事实条件（`kind=fact`）；类别（`category`）：剧本（`scenario`）；对象（`subject`）：剧本（`scenario`）；字段（`field`）：编号（`number`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
                - 取值（`value`）：4
            - 第 2 项：
              - 事实条件（`kind=fact`）；类别（`category`）：日期（`date`）；对象（`subject`）：剧本（`scenario`）；字段（`field`）：剧本经过日数（`elapsed-days`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
                - 取值（`value`）：0
            - 第 3 项：
              - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`曹操`；字段（`field`）：存在（`exists`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
                - 取值（`value`）：是（true）
            - 第 4 项：
              - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`袁紹`；字段（`field`）：存在（`exists`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
                - 取值（`value`）：是（true）
      - 第 2 项：
        - 全部成立（`all`）（节点种类（`kind`））
          - 逻辑：本组各子项均成立；仅表示来源的分组，不引入调度规则
          - 子项（`items`）：
            - 第 1 项：
              - 事实条件（`kind=fact`）；类别（`category`）：剧本（`scenario`）；对象（`subject`）：剧本（`scenario`）；字段（`field`）：编号（`number`）；比较关系（`operator`）：不等于（`neq`）；确定性（`certainty`）：来源明示（`stated`）
                - 取值（`value`）：4
            - 第 2 项：
              - 事实条件（`kind=fact`）；类别（`category`）：日期（`date`）；对象（`subject`）：剧本（`scenario`）；字段（`field`）：剧本开始年月（`start-month`）；比较关系（`operator`）：小于或等于（`lte`）；确定性（`certainty`）：来源明示（`stated`）
                - 取值（`value`）：列表（按来源次序）：199、12
            - 第 3 项：
              - 事实条件（`kind=fact`）；类别（`category`）：城市（`city`）；对象（`subject`）：`曹操`；字段（`field`）：地区内持有城市数（`owned-city-count-in-region`）；比较关系（`operator`）：大于或等于（`gte`）；确定性（`certainty`）：来源明示（`stated`）
                - 取值（`value`）：
                  - 城市列表（`cities`）：列表（按来源次序）：`北海`、`下邳`、`小沛`、`寿春`、`濮陽`、`陳陽`、`許昌`、`汝南`、`洛陽`
                  - 数量（`count`）：5
            - 第 4 项：
              - 事实条件（`kind=fact`）；类别（`category`）：城市（`city`）；对象（`subject`）：`袁紹`；字段（`field`）：地区内持有城市数（`owned-city-count-in-region`）；比较关系（`operator`）：大于或等于（`gte`）；确定性（`certainty`）：来源明示（`stated`）
                - 取值（`value`）：
                  - 城市列表（`cities`）：列表（按来源次序）：`襄平`、`北平`、`薊`、`南皮`、`平原`、`晋陽`、`鄴`
                  - 数量（`count`）：5
            - 第 5 项：
              - 事实条件（`kind=fact`）；类别（`category`）：城市（`city`）；对象（`subject`）：列表（按来源次序）：`曹操`、`袁紹`；字段（`field`）：相邻城市对数（`adjacent-city-pair-count`）；比较关系（`operator`）：大于或等于（`gte`）；确定性（`certainty`）：来源明示（`stated`）
                - 取值（`value`）：1
            - 第 6 项：
              - 事实条件（`kind=fact`）；类别（`category`）：外交（`diplomacy`）；对象（`subject`）：列表（按来源次序）：`曹操`、`袁紹`；字段（`field`）：处于同盟（`allied`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
                - 取值（`value`）：否（false）
            - 第 7 项：
              - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：列表（按来源次序）：`曹操`、`袁紹`；字段（`field`）：有缘关系（`associated-relationship`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
                - 取值（`value`）：否（false）
            - 第 8 项：
              - 事实条件（`kind=fact`）；类别（`category`）：任务或行动（`mission`）；对象（`subject`）：列表（按来源次序）：`曹操`、`袁紹`；字段（`field`）：正在执行任务（`on-mission`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
                - 取值（`value`）：否（false）

### 前置事件关系（`prerequisites`）

- 空列表（0 项）

### 结果与分支（仅来源描述顺序）（`orderedResults`）

- 第 1 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：设为（`set`）；作用对象（`target`）：列表（按来源次序）：`曹操`、`袁紹`
    - 参数（`values`）：
      - 友好度（`friendship`）：`険悪`

### 不确定性与来源限定（`uncertainties`）

- 第 1 项：The city label 陳陽 is retained exactly as the source gives it.

<a id="atwiki-88-20"></a>

## 观察 20：趙雲再会（趙雲仕官）

- 事件标识（`eventId`）：`zhao-yun-reunion`
- 观察标识（`observationId`）：`atwiki-88-20`
- 原文标题（`title`）：`趙雲再会（趙雲仕官）`
- 来源标识（`sourceId`）：`atwiki-88`
- 来源网址（`sourceURL`）：[https://w.atwiki.jp/sangokushi11/pages/88.html](https://w.atwiki.jp/sangokushi11/pages/88.html)
- 来源章节（`sourceSection`）：`趙雲再会（趙雲仕官）`
- 来源节序（`sourceOrdinal`）：20
- 来源行定位（`sourceLocator`）：
  - 起始行（`startLine`）：481
  - 结束行（`endLine`）：494
- 版本范围（`version`）：
  - 游戏（`game`）：`SAN11`
  - 版本类型（`edition`）：未指定（`unspecified`）
  - 平台（`platform`）：未指定（`unspecified`）
  - 补丁（`patch`）：未指定（`unspecified`）
- 证据性质（`evidence`）：公开攻略转录（`public-guide-transcription`）
- 仅发生一次信息（`onceOnly`）：
  - 状态（`status`）：未说明（`not-stated`）
  - 标志标识（`flagId`）：未提供（null）

### 触发条件（`conditions`）

- 第 1 项：
  - 事实条件（`kind=fact`）；类别（`category`）：日期（`date`）；对象（`subject`）：剧本（`scenario`）；字段（`field`）：剧本开始年月（`start-month`）；比较关系（`operator`）：大于或等于（`gte`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：195、1
- 第 2 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`player`；字段（`field`）：君主（`ruler`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：`劉備`
- 第 3 项：
  - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：`趙雲`；字段（`field`）：状态（`status`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：在野（`free`）
- 第 4 项：
  - 事实条件（`kind=fact`）；类别（`category`）：城市（`city`）；对象（`subject`）：`劉備.current-city`；字段（`field`）：治安（`public-order`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：100
- 第 5 项：
  - 事实条件（`kind=fact`）；类别（`category`）：任务或行动（`mission`）；对象（`subject`）：列表（按来源次序）：`劉備`；字段（`field`）：正在执行任务（`on-mission`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：否（false）

### 前置事件关系（`prerequisites`）

- 空列表（0 项）

### 结果与分支（仅来源描述顺序）（`orderedResults`）

- 第 1 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：加入势力（`join-force`）；作用对象（`target`）：`趙雲`
    - 参数（`values`）：
      - 势力（`force`）：`劉備`
- 第 2 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：设为（`set`）；作用对象（`target`）：`趙雲`
    - 参数（`values`）：
      - 忠诚（`loyalty`）：100
      - 功绩（`merit`）：4000

### 不确定性与来源限定（`uncertainties`）

- 第 1 项：First of two distinct observations for this event. This section does not state an elapsed-days requirement.

<a id="atwiki-88-21"></a>

## 观察 21：好漢・劉備（龔都、周倉、裴元紹、劉辟、廖化仕官）

- 事件标识（`eventId`）：`recruit-liu-bei-five`
- 观察标识（`observationId`）：`atwiki-88-21`
- 原文标题（`title`）：`好漢・劉備（龔都、周倉、裴元紹、劉辟、廖化仕官）`
- 来源标识（`sourceId`）：`atwiki-88`
- 来源网址（`sourceURL`）：[https://w.atwiki.jp/sangokushi11/pages/88.html](https://w.atwiki.jp/sangokushi11/pages/88.html)
- 来源章节（`sourceSection`）：`好漢・劉備（龔都、周倉、裴元紹、劉辟、廖化仕官）`
- 来源节序（`sourceOrdinal`）：21
- 来源行定位（`sourceLocator`）：
  - 起始行（`startLine`）：495
  - 结束行（`endLine`）：510
- 版本范围（`version`）：
  - 游戏（`game`）：`SAN11`
  - 版本类型（`edition`）：未指定（`unspecified`）
  - 平台（`platform`）：未指定（`unspecified`）
  - 补丁（`patch`）：未指定（`unspecified`）
- 证据性质（`evidence`）：公开攻略转录（`public-guide-transcription`）
- 仅发生一次信息（`onceOnly`）：
  - 状态（`status`）：未说明（`not-stated`）
  - 标志标识（`flagId`）：未提供（null）

### 触发条件（`conditions`）

- 第 1 项：
  - 事实条件（`kind=fact`）；类别（`category`）：日期（`date`）；对象（`subject`）：剧本（`scenario`）；字段（`field`）：剧本开始年月（`start-month`）；比较关系（`operator`）：小于或等于（`lte`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：206、12
- 第 2 项：
  - 事实条件（`kind=fact`）；类别（`category`）：日期（`date`）；对象（`subject`）：剧本（`scenario`）；字段（`field`）：剧本经过日数（`elapsed-days`）；比较关系（`operator`）：大于或等于（`gte`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：30
- 第 3 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`player`；字段（`field`）：君主（`ruler`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：`劉備`
- 第 4 项：
  - 事实条件（`kind=fact`）；类别（`category`）：城市（`city`）；对象（`subject`）：`劉備`；字段（`field`）：持有城市（`cities`）；比较关系（`operator`）：包含全部（`contains-all`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：`汝南`
- 第 5 项：
  - 事实条件（`kind=fact`）；类别（`category`）：城市（`city`）；对象（`subject`）：列表（按来源次序）：`劉備`、`関羽`；字段（`field`）：当前所在城市（`current-city`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：`汝南`
- 第 6 项：
  - 任一成立（`any`）（节点种类（`kind`））
    - 逻辑：本组至少一个子项成立；仅表示来源的分组，不引入调度规则
    - 子项（`items`）：
      - 第 1 项：
        - 全部成立（`all`）（节点种类（`kind`））
          - 逻辑：本组各子项均成立；仅表示来源的分组，不引入调度规则
          - 子项（`items`）：
            - 第 1 项：
              - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：列表（按来源次序）：`龔都`；字段（`field`）：已到预定登场年（`scheduled-debut-year-reached`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
                - 取值（`value`）：是（true）
            - 第 2 项：
              - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：列表（按来源次序）：`龔都`；字段（`field`）：状态（`status`）；比较关系（`operator`）：每一项均属于（`each-in`）；确定性（`certainty`）：来源明示（`stated`）
                - 取值（`value`）：列表（按来源次序）：`never-served-free`、`undiscovered`
      - 第 2 项：
        - 全部成立（`all`）（节点种类（`kind`））
          - 逻辑：本组各子项均成立；仅表示来源的分组，不引入调度规则
          - 子项（`items`）：
            - 第 1 项：
              - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：列表（按来源次序）：`周倉`；字段（`field`）：已到预定登场年（`scheduled-debut-year-reached`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
                - 取值（`value`）：是（true）
            - 第 2 项：
              - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：列表（按来源次序）：`周倉`；字段（`field`）：状态（`status`）；比较关系（`operator`）：每一项均属于（`each-in`）；确定性（`certainty`）：来源明示（`stated`）
                - 取值（`value`）：列表（按来源次序）：`never-served-free`、`undiscovered`
      - 第 3 项：
        - 全部成立（`all`）（节点种类（`kind`））
          - 逻辑：本组各子项均成立；仅表示来源的分组，不引入调度规则
          - 子项（`items`）：
            - 第 1 项：
              - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：列表（按来源次序）：`裴元紹`；字段（`field`）：已到预定登场年（`scheduled-debut-year-reached`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
                - 取值（`value`）：是（true）
            - 第 2 项：
              - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：列表（按来源次序）：`裴元紹`；字段（`field`）：状态（`status`）；比较关系（`operator`）：每一项均属于（`each-in`）；确定性（`certainty`）：来源明示（`stated`）
                - 取值（`value`）：列表（按来源次序）：`never-served-free`、`undiscovered`
      - 第 4 项：
        - 全部成立（`all`）（节点种类（`kind`））
          - 逻辑：本组各子项均成立；仅表示来源的分组，不引入调度规则
          - 子项（`items`）：
            - 第 1 项：
              - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：列表（按来源次序）：`劉辟`；字段（`field`）：已到预定登场年（`scheduled-debut-year-reached`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
                - 取值（`value`）：是（true）
            - 第 2 项：
              - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：列表（按来源次序）：`劉辟`；字段（`field`）：状态（`status`）；比较关系（`operator`）：每一项均属于（`each-in`）；确定性（`certainty`）：来源明示（`stated`）
                - 取值（`value`）：列表（按来源次序）：`never-served-free`、`undiscovered`
      - 第 5 项：
        - 全部成立（`all`）（节点种类（`kind`））
          - 逻辑：本组各子项均成立；仅表示来源的分组，不引入调度规则
          - 子项（`items`）：
            - 第 1 项：
              - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：列表（按来源次序）：`廖化`；字段（`field`）：已到预定登场年（`scheduled-debut-year-reached`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
                - 取值（`value`）：是（true）
            - 第 2 项：
              - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：列表（按来源次序）：`廖化`；字段（`field`）：状态（`status`）；比较关系（`operator`）：每一项均属于（`each-in`）；确定性（`certainty`）：来源明示（`stated`）
                - 取值（`value`）：列表（按来源次序）：`never-served-free`、`undiscovered`
- 第 7 项：
  - 事实条件（`kind=fact`）；类别（`category`）：任务或行动（`mission`）；对象（`subject`）：列表（按来源次序）：`劉備`、`関羽`；字段（`field`）：正在执行任务（`on-mission`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：否（false）

### 前置事件关系（`prerequisites`）

- 空列表（0 项）

### 结果与分支（仅来源描述顺序）（`orderedResults`）

- 第 1 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：加入势力（`join-force`）；作用对象（`target`）：`participating-officers-only`
    - 参数（`values`）：
      - 候选对象（`candidates`）：列表（按来源次序）：`龔都`、`周倉`、`裴元紹`、`劉辟`、`廖化`
      - 势力（`force`）：`劉備`
- 第 2 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：设为（`set`）；作用对象（`target`）：`newly-joined-participating-officers`
    - 参数（`values`）：
      - 忠诚（`loyalty`）：100
      - 功绩（`merit`）：1000

### 不确定性与来源限定（`uncertainties`）

- 第 1 项：Only participating candidates are said to join; no automatic all-five recruitment is inferred.

<a id="atwiki-88-22"></a>

## 观察 22：趙雲再会

- 事件标识（`eventId`）：`zhao-yun-reunion`
- 观察标识（`observationId`）：`atwiki-88-22`
- 原文标题（`title`）：`趙雲再会`
- 来源标识（`sourceId`）：`atwiki-88`
- 来源网址（`sourceURL`）：[https://w.atwiki.jp/sangokushi11/pages/88.html](https://w.atwiki.jp/sangokushi11/pages/88.html)
- 来源章节（`sourceSection`）：`趙雲再会`
- 来源节序（`sourceOrdinal`）：22
- 来源行定位（`sourceLocator`）：
  - 起始行（`startLine`）：511
  - 结束行（`endLine`）：523
- 版本范围（`version`）：
  - 游戏（`game`）：`SAN11`
  - 版本类型（`edition`）：未指定（`unspecified`）
  - 平台（`platform`）：未指定（`unspecified`）
  - 补丁（`patch`）：未指定（`unspecified`）
- 证据性质（`evidence`）：公开攻略转录（`public-guide-transcription`）
- 仅发生一次信息（`onceOnly`）：
  - 状态（`status`）：未说明（`not-stated`）
  - 标志标识（`flagId`）：未提供（null）

### 触发条件（`conditions`）

- 第 1 项：
  - 事实条件（`kind=fact`）；类别（`category`）：日期（`date`）；对象（`subject`）：剧本（`scenario`）；字段（`field`）：剧本开始年月（`start-month`）；比较关系（`operator`）：大于或等于（`gte`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：195、1
- 第 2 项：
  - 事实条件（`kind=fact`）；类别（`category`）：日期（`date`）；对象（`subject`）：剧本（`scenario`）；字段（`field`）：剧本经过日数（`elapsed-days`）；比较关系（`operator`）：大于或等于（`gte`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：30
- 第 3 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`player`；字段（`field`）：君主（`ruler`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：`劉備`
- 第 4 项：
  - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：`趙雲`；字段（`field`）：状态（`status`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：在野（`free`）
- 第 5 项：
  - 事实条件（`kind=fact`）；类别（`category`）：城市（`city`）；对象（`subject`）：`劉備.assigned-city`；字段（`field`）：治安（`public-order`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：100
- 第 6 项：
  - 事实条件（`kind=fact`）；类别（`category`）：任务或行动（`mission`）；对象（`subject`）：列表（按来源次序）：`劉備`；字段（`field`）：正在执行任务（`on-mission`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：否（false）

### 前置事件关系（`prerequisites`）

- 空列表（0 项）

### 结果与分支（仅来源描述顺序）（`orderedResults`）

- 第 1 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：加入势力（`join-force`）；作用对象（`target`）：`趙雲`
    - 参数（`values`）：
      - 势力（`force`）：`劉備`
- 第 2 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：设为（`set`）；作用对象（`target`）：`趙雲`
    - 参数（`values`）：
      - 忠诚（`loyalty`）：100
      - 功绩（`merit`）：4000

### 不确定性与来源限定（`uncertainties`）

- 第 1 项：Second, independently retained observation. It adds elapsed days >= 30; the first observation does not. It refers to the ruler assigned city rather than current city.

<a id="atwiki-88-23"></a>

## 观察 23：郭嘉の死

- 事件标识（`eventId`）：`guo-jia-death`
- 观察标识（`observationId`）：`atwiki-88-23`
- 原文标题（`title`）：`郭嘉の死`
- 来源标识（`sourceId`）：`atwiki-88`
- 来源网址（`sourceURL`）：[https://w.atwiki.jp/sangokushi11/pages/88.html](https://w.atwiki.jp/sangokushi11/pages/88.html)
- 来源章节（`sourceSection`）：`郭嘉の死`
- 来源节序（`sourceOrdinal`）：23
- 来源行定位（`sourceLocator`）：
  - 起始行（`startLine`）：524
  - 结束行（`endLine`）：525
- 版本范围（`version`）：
  - 游戏（`game`）：`SAN11`
  - 版本类型（`edition`）：未指定（`unspecified`）
  - 平台（`platform`）：未指定（`unspecified`）
  - 补丁（`patch`）：未指定（`unspecified`）
- 证据性质（`evidence`）：公开攻略转录（`public-guide-transcription`）
- 仅发生一次信息（`onceOnly`）：
  - 状态（`status`）：未说明（`not-stated`）
  - 标志标识（`flagId`）：未提供（null）

### 触发条件（`conditions`）

- 空列表（0 项）

### 前置事件关系（`prerequisites`）

- 空列表（0 项）

### 结果与分支（仅来源描述顺序）（`orderedResults`）

- 第 1 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：未说明（`not-stated`）；作用对象（`target`）：`event`
    - 参数（`values`）：空属性集（0 项）

### 不确定性与来源限定（`uncertainties`）

- 第 1 项：Heading-only section: trigger conditions and results are not stated.

<a id="atwiki-88-24"></a>

## 观察 24：于吉の呪い（孫策の死）

- 事件标识（`eventId`）：`sun-ce-death`
- 观察标识（`observationId`）：`atwiki-88-24`
- 原文标题（`title`）：`于吉の呪い（孫策の死）`
- 来源标识（`sourceId`）：`atwiki-88`
- 来源网址（`sourceURL`）：[https://w.atwiki.jp/sangokushi11/pages/88.html](https://w.atwiki.jp/sangokushi11/pages/88.html)
- 来源章节（`sourceSection`）：`于吉の呪い（孫策の死）`
- 来源节序（`sourceOrdinal`）：24
- 来源行定位（`sourceLocator`）：
  - 起始行（`startLine`）：526
  - 结束行（`endLine`）：536
- 版本范围（`version`）：
  - 游戏（`game`）：`SAN11`
  - 版本类型（`edition`）：未指定（`unspecified`）
  - 平台（`platform`）：未指定（`unspecified`）
  - 补丁（`patch`）：未指定（`unspecified`）
- 证据性质（`evidence`）：公开攻略转录（`public-guide-transcription`）
- 仅发生一次信息（`onceOnly`）：
  - 状态（`status`）：未说明（`not-stated`）
  - 标志标识（`flagId`）：未提供（null）

### 触发条件（`conditions`）

- 第 1 项：
  - 事实条件（`kind=fact`）；类别（`category`）：日期（`date`）；对象（`subject`）：`calendar`；字段（`field`）：当前年份（`current-year`）；比较关系（`operator`）：大于或等于（`gte`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：200
- 第 2 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`player`；字段（`field`）：君主（`ruler`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：`孫策`
- 第 3 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`孫策`；字段（`field`）：武将列表（`officers`）；比较关系（`operator`）：包含全部（`contains-all`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：`孫権`
- 第 4 项：
  - 事实条件（`kind=fact`）；类别（`category`）：城市（`city`）；对象（`subject`）：`孫策`；字段（`field`）：持有城市（`cities`）；比较关系（`operator`）：包含全部（`contains-all`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：`廬江`、`柴桑`、`建業`、`呉`、`会稽`
- 第 5 项：
  - 事实条件（`kind=fact`）；类别（`category`）：任务或行动（`mission`）；对象（`subject`）：列表（按来源次序）：`孫策`、`孫権`；字段（`field`）：正在执行任务（`on-mission`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：否（false）

### 前置事件关系（`prerequisites`）

- 空列表（0 项）

### 结果与分支（仅来源描述顺序）（`orderedResults`）

- 第 1 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：开始舌战（`start-debate`）；作用对象（`target`）：`participants-not-stated`
    - 参数（`values`）：空属性集（0 项）
- 第 2 项：
  - 分支（`branch`）（节点种类（`kind`））
    - 分支标识（`branchId`）：`win`
    - 分支条件（`condition`）：
      - 事实条件（`kind=fact`）；类别（`category`）：其他（`other`）；对象（`subject`）：`debate`；字段（`field`）：玩家结果（`player-outcome`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
        - 取值（`value`）：`win`
    - 按来源描述排列的结果（`orderedResults`）：
      - 第 1 项：
        - 结果效果（`kind=effect`）；操作（`operation`）：延长寿命（`extend-lifespan`）；作用对象（`target`）：`孫策`
          - 参数（`values`）：
            - 数额（`amount`）：未说明（`not-stated`）
- 第 3 项：
  - 分支（`branch`）（节点种类（`kind`））
    - 分支标识（`branchId`）：`loss`
    - 分支条件（`condition`）：
      - 事实条件（`kind=fact`）；类别（`category`）：其他（`other`）；对象（`subject`）：`debate`；字段（`field`）：玩家结果（`player-outcome`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
        - 取值（`value`）：`loss`
    - 按来源描述排列的结果（`orderedResults`）：
      - 第 1 项：
        - 结果效果（`kind=effect`）；操作（`operation`）：死亡（`death`）；作用对象（`target`）：`孫策`
          - 参数（`values`）：空属性集（0 项）

### 不确定性与来源限定（`uncertainties`）

- 第 1 项：Lifespan extension amount and debate participants are not explicitly stated.

<a id="atwiki-88-25"></a>

## 观察 25：孔明の嫁とり

- 事件标识（`eventId`）：`marry-zhuge-liang`
- 观察标识（`observationId`）：`atwiki-88-25`
- 原文标题（`title`）：`孔明の嫁とり`
- 来源标识（`sourceId`）：`atwiki-88`
- 来源网址（`sourceURL`）：[https://w.atwiki.jp/sangokushi11/pages/88.html](https://w.atwiki.jp/sangokushi11/pages/88.html)
- 来源章节（`sourceSection`）：`孔明の嫁とり`
- 来源节序（`sourceOrdinal`）：25
- 来源行定位（`sourceLocator`）：
  - 起始行（`startLine`）：537
  - 结束行（`endLine`）：545
- 版本范围（`version`）：
  - 游戏（`game`）：`SAN11`
  - 版本类型（`edition`）：未指定（`unspecified`）
  - 平台（`platform`）：未指定（`unspecified`）
  - 补丁（`patch`）：未指定（`unspecified`）
- 证据性质（`evidence`）：公开攻略转录（`public-guide-transcription`）
- 仅发生一次信息（`onceOnly`）：
  - 状态（`status`）：未说明（`not-stated`）
  - 标志标识（`flagId`）：未提供（null）

### 触发条件（`conditions`）

- 第 1 项：
  - 事实条件（`kind=fact`）；类别（`category`）：日期（`date`）；对象（`subject`）：剧本（`scenario`）；字段（`field`）：剧本开始年月（`start-month`）；比较关系（`operator`）：小于或等于（`lte`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：202、12
- 第 2 项：
  - 事实条件（`kind=fact`）；类别（`category`）：日期（`date`）；对象（`subject`）：剧本（`scenario`）；字段（`field`）：剧本经过日数（`elapsed-days`）；比较关系（`operator`）：大于或等于（`gte`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：30
- 第 3 项：
  - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：列表（按来源次序）：`諸葛亮`、`黄月英`；字段（`field`）：配偶（`spouse`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：未提供（null）
- 第 4 项：
  - 事实条件（`kind=fact`）；类别（`category`）：任务或行动（`mission`）；对象（`subject`）：列表（按来源次序）：`諸葛亮`、`黄月英`；字段（`field`）：正在执行任务（`on-mission`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：否（false）
- 第 5 项：
  - 事实条件（`kind=fact`）；类别（`category`）：城市（`city`）；对象（`subject`）：`諸葛亮`；字段（`field`）：城市（`city`）；比较关系（`operator`）：属于（`in`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：`controlled-cities`
- 第 6 项：
  - 任一成立（`any`）（节点种类（`kind`））
    - 逻辑：本组至少一个子项成立；仅表示来源的分组，不引入调度规则
    - 子项（`items`）：
      - 第 1 项：
        - 事实条件（`kind=fact`）；类别（`category`）：城市（`city`）；对象（`subject`）：`黄月英`；字段（`field`）：城市（`city`）；比较关系（`operator`）：属于（`in`）；确定性（`certainty`）：来源明示（`stated`）
          - 取值（`value`）：`controlled-cities-including-never-served-free`
      - 第 2 项：
        - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：`黄月英`；字段（`field`）：状态（`status`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
          - 取值（`value`）：`undiscovered`

### 前置事件关系（`prerequisites`）

- 空列表（0 项）

### 结果与分支（仅来源描述顺序）（`orderedResults`）

- 第 1 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：未说明（`not-stated`）；作用对象（`target`）：`event`
    - 参数（`values`）：空属性集（0 项）

### 不确定性与来源限定（`uncertainties`）

- 第 1 项：No result block is supplied; the force controlling the cities is implicit in the guide.

<a id="atwiki-88-26"></a>

## 观察 26：甘寧亡命

- 事件标识（`eventId`）：`gan-ning-defects`
- 观察标识（`observationId`）：`atwiki-88-26`
- 原文标题（`title`）：`甘寧亡命`
- 来源标识（`sourceId`）：`atwiki-88`
- 来源网址（`sourceURL`）：[https://w.atwiki.jp/sangokushi11/pages/88.html](https://w.atwiki.jp/sangokushi11/pages/88.html)
- 来源章节（`sourceSection`）：`甘寧亡命`
- 来源节序（`sourceOrdinal`）：26
- 来源行定位（`sourceLocator`）：
  - 起始行（`startLine`）：546
  - 结束行（`endLine`）：564
- 版本范围（`version`）：
  - 游戏（`game`）：`SAN11`
  - 版本类型（`edition`）：未指定（`unspecified`）
  - 平台（`platform`）：未指定（`unspecified`）
  - 补丁（`patch`）：未指定（`unspecified`）
- 证据性质（`evidence`）：公开攻略转录（`public-guide-transcription`）
- 仅发生一次信息（`onceOnly`）：
  - 状态（`status`）：未说明（`not-stated`）
  - 标志标识（`flagId`）：未提供（null）

### 触发条件（`conditions`）

- 第 1 项：
  - 事实条件（`kind=fact`）；类别（`category`）：日期（`date`）；对象（`subject`）：剧本（`scenario`）；字段（`field`）：剧本开始年月（`start-month`）；比较关系（`operator`）：小于或等于（`lte`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：207、12
- 第 2 项：
  - 事实条件（`kind=fact`）；类别（`category`）：日期（`date`）；对象（`subject`）：剧本（`scenario`）；字段（`field`）：剧本经过日数（`elapsed-days`）；比较关系（`operator`）：大于或等于（`gte`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：30
- 第 3 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`甘寧`；字段（`field`）：势力（`force`）；比较关系（`operator`）：不等于（`neq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：`current-player-force`
- 第 4 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：列表（按来源次序）：`甘寧`、`黄祖`；字段（`field`）：势力（`force`）；比较关系（`operator`）：全部相同（`all-equal`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：是（true）
- 第 5 项：
  - 事实条件（`kind=fact`）；类别（`category`）：城市（`city`）；对象（`subject`）：`player-force`；字段（`field`）：持有城市（`cities`）；比较关系（`operator`）：包含全部（`contains-all`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：`建業`、`呉`、`会稽`、`廬江`、`柴桑`
- 第 6 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：列表（按来源次序）：`player-force`、`甘寧.force`；字段（`field`）：相邻（`adjacent`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：是（true）
- 第 7 项：
  - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：列表（按来源次序）：`甘寧`、`player-ruler`；字段（`field`）：有缘关系（`associated-relationship`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：否（false）
- 第 8 项：
  - 全部成立（`all`）（节点种类（`kind`））
    - 逻辑：本组各子项均成立；仅表示来源的分组，不引入调度规则
    - 子项（`items`）：
      - 第 1 项：
        - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：列表（按来源次序）：`甘寧`；字段（`field`）：厌恶武将（`disliked-officer`）；比较关系（`operator`）：不等于（`neq`）；确定性（`certainty`）：来源明示（`stated`）
          - 取值（`value`）：`player-ruler`
      - 第 2 项：
        - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：`player-ruler`；字段（`field`）：厌恶武将列表（`disliked-officers`）；比较关系（`operator`）：全部不包含（`contains-none`）；确定性（`certainty`）：来源明示（`stated`）
          - 取值（`value`）：列表（按来源次序）：`甘寧`
- 第 9 项：
  - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：`甘寧`；字段（`field`）：禁止仕官的君主（`prohibited-ruler`）；比较关系（`operator`）：不等于（`neq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：`player-ruler`
- 第 10 项：
  - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：`甘寧`；字段（`field`）：状态（`status`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：`ordinary`
- 第 11 项：
  - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：`甘寧`；字段（`field`）：忠诚（`loyalty`）；比较关系（`operator`）：小于或等于（`lte`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：95
- 第 12 项：
  - 事实条件（`kind=fact`）；类别（`category`）：任务或行动（`mission`）；对象（`subject`）：列表（按来源次序）：`player-ruler`、`甘寧`；字段（`field`）：正在执行任务（`on-mission`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：否（false）

### 前置事件关系（`prerequisites`）

- 空列表（0 项）

### 结果与分支（仅来源描述顺序）（`orderedResults`）

- 第 1 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：加入势力（`join-force`）；作用对象（`target`）：`甘寧`
    - 参数（`values`）：
      - 势力（`force`）：`player-force`
- 第 2 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：设为（`set`）；作用对象（`target`）：`甘寧`
    - 参数（`values`）：
      - 忠诚（`loyalty`）：100
      - 功绩（`merit`）：4000

### 不确定性与来源限定（`uncertainties`）

- 第 1 项：An officer in a different player-controlled force is explicitly allowed; only the current player force is excluded.

<a id="atwiki-88-27"></a>

## 观察 27：徐庶登場

- 事件标识（`eventId`）：`xu-shu-arrives`
- 观察标识（`observationId`）：`atwiki-88-27`
- 原文标题（`title`）：`徐庶登場`
- 来源标识（`sourceId`）：`atwiki-88`
- 来源网址（`sourceURL`）：[https://w.atwiki.jp/sangokushi11/pages/88.html](https://w.atwiki.jp/sangokushi11/pages/88.html)
- 来源章节（`sourceSection`）：`徐庶登場`
- 来源节序（`sourceOrdinal`）：27
- 来源行定位（`sourceLocator`）：
  - 起始行（`startLine`）：565
  - 结束行（`endLine`）：565
- 版本范围（`version`）：
  - 游戏（`game`）：`SAN11`
  - 版本类型（`edition`）：未指定（`unspecified`）
  - 平台（`platform`）：未指定（`unspecified`）
  - 补丁（`patch`）：未指定（`unspecified`）
- 证据性质（`evidence`）：公开攻略转录（`public-guide-transcription`）
- 仅发生一次信息（`onceOnly`）：
  - 状态（`status`）：未说明（`not-stated`）
  - 标志标识（`flagId`）：未提供（null）

### 触发条件（`conditions`）

- 空列表（0 项）

### 前置事件关系（`prerequisites`）

- 空列表（0 项）

### 结果与分支（仅来源描述顺序）（`orderedResults`）

- 第 1 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：未说明（`not-stated`）；作用对象（`target`）：`event`
    - 参数（`values`）：空属性集（0 项）

### 不确定性与来源限定（`uncertainties`）

- 第 1 项：Heading-only section: trigger conditions and results are not stated.

<a id="atwiki-88-28"></a>

## 观察 28：曹操の南征

- 事件标识（`eventId`）：`cao-cao-southern-campaign`
- 观察标识（`observationId`）：`atwiki-88-28`
- 原文标题（`title`）：`曹操の南征`
- 来源标识（`sourceId`）：`atwiki-88`
- 来源网址（`sourceURL`）：[https://w.atwiki.jp/sangokushi11/pages/88.html](https://w.atwiki.jp/sangokushi11/pages/88.html)
- 来源章节（`sourceSection`）：`曹操の南征`
- 来源节序（`sourceOrdinal`）：28
- 来源行定位（`sourceLocator`）：
  - 起始行（`startLine`）：566
  - 结束行（`endLine`）：580
- 版本范围（`version`）：
  - 游戏（`game`）：`SAN11`
  - 版本类型（`edition`）：未指定（`unspecified`）
  - 平台（`platform`）：未指定（`unspecified`）
  - 补丁（`patch`）：未指定（`unspecified`）
- 证据性质（`evidence`）：公开攻略转录（`public-guide-transcription`）
- 仅发生一次信息（`onceOnly`）：
  - 状态（`status`）：未说明（`not-stated`）
  - 标志标识（`flagId`）：未提供（null）

### 触发条件（`conditions`）

- 第 1 项：
  - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：`曹操`；字段（`field`）：状态（`status`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：`ruler`
- 第 2 项：
  - 事实条件（`kind=fact`）；类别（`category`）：日期（`date`）；对象（`subject`）：剧本（`scenario`）；字段（`field`）：剧本经过日数（`elapsed-days`）；比较关系（`operator`）：大于或等于（`gte`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：30
- 第 3 项：
  - 事实条件（`kind=fact`）；类别（`category`）：城市（`city`）；对象（`subject`）：`曹操`；字段（`field`）：持有城市（`cities`）；比较关系（`operator`）：包含全部（`contains-all`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：`北平`、`薊`、`南皮`、`平原`、`晋陽`、`鄴`
- 第 4 项：
  - 事实条件（`kind=fact`）；类别（`category`）：城市（`city`）；对象（`subject`）：`曹操`；字段（`field`）：地区内持有城市数（`owned-city-count-in-region`）；比较关系（`operator`）：大于或等于（`gte`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：
      - 城市列表（`cities`）：列表（按来源次序）：`北海`、`下邳`、`小沛`、`寿春`、`濮陽`、`陳陽`、`許昌`、`汝南`、`洛陽`
      - 数量（`count`）：7
- 第 5 项：
  - 事实条件（`kind=fact`）；类别（`category`）：城市（`city`）；对象（`subject`）：`曹操`；字段（`field`）：地区内持有城市数（`owned-city-count-in-region`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：
      - 城市列表（`cities`）：列表（按来源次序）：`建業`、`呉`、`会稽`、`廬江`、`柴桑`、`江夏`、`新野`、`襄陽`、`江陵`、`長沙`、`武陵`、`桂陽`、`零陵`
      - 数量（`count`）：0
- 第 6 项：
  - 事实条件（`kind=fact`）；类别（`category`）：城市（`city`）；对象（`subject`）：`曹操`；字段（`field`）：持有城市（`cities`）；比较关系（`operator`）：包含全部（`contains-all`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：`許昌`、`宛`
- 第 7 项：
  - 事实条件（`kind=fact`）；类别（`category`）：城市（`city`）；对象（`subject`）：`曹操`；字段（`field`）：持有城市（`cities`）；比较关系（`operator`）：全部不包含（`contains-none`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：`新野`
- 第 8 项：
  - 事实条件（`kind=fact`）；类别（`category`）：外交（`diplomacy`）；对象（`subject`）：`曹操`；字段（`field`）：与持有所列任一城市之势力的同盟（`alliance-with-any-force-owning-any-listed-city`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：
      - 取值（`value`）：否（false）
      - 城市列表（`cities`）：列表（按来源次序）：`建業`、`柴桑`、`襄陽`、`江陵`
- 第 9 项：
  - 事实条件（`kind=fact`）；类别（`category`）：任务或行动（`mission`）；对象（`subject`）：列表（按来源次序）：`曹操`；字段（`field`）：正在执行任务（`on-mission`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：否（false）

### 前置事件关系（`prerequisites`）

- 空列表（0 项）

### 结果与分支（仅来源描述顺序）（`orderedResults`）

- 第 1 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：未说明（`not-stated`）；作用对象（`target`）：`event`
    - 参数（`values`）：空属性集（0 项）

### 不确定性与来源限定（`uncertainties`）

- 第 1 项：No result block is supplied. The source includes 新野 in its 江東 region and separately excludes ownership; both statements are preserved. 陳陽 is retained.

<a id="atwiki-88-29"></a>

## 观察 29：三顧の礼

- 事件标识（`eventId`）：`three-visits-overview`
- 观察标识（`observationId`）：`atwiki-88-29`
- 原文标题（`title`）：`三顧の礼`
- 来源标识（`sourceId`）：`atwiki-88`
- 来源网址（`sourceURL`）：[https://w.atwiki.jp/sangokushi11/pages/88.html](https://w.atwiki.jp/sangokushi11/pages/88.html)
- 来源章节（`sourceSection`）：`三顧の礼`
- 来源节序（`sourceOrdinal`）：29
- 来源行定位（`sourceLocator`）：
  - 起始行（`startLine`）：581
  - 结束行（`endLine`）：593
- 版本范围（`version`）：
  - 游戏（`game`）：`SAN11`
  - 版本类型（`edition`）：未指定（`unspecified`）
  - 平台（`platform`）：未指定（`unspecified`）
  - 补丁（`patch`）：未指定（`unspecified`）
- 证据性质（`evidence`）：公开攻略转录（`public-guide-transcription`）
- 仅发生一次信息（`onceOnly`）：
  - 状态（`status`）：未说明（`not-stated`）
  - 标志标识（`flagId`）：未提供（null）

### 触发条件（`conditions`）

- 第 1 项：
  - 事实条件（`kind=fact`）；类别（`category`）：日期（`date`）；对象（`subject`）：剧本（`scenario`）；字段（`field`）：剧本开始年月（`start-month`）；比较关系（`operator`）：小于或等于（`lte`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：207、12
- 第 2 项：
  - 事实条件（`kind=fact`）；类别（`category`）：日期（`date`）；对象（`subject`）：`calendar`；字段（`field`）：当前年月（`current-month`）；比较关系（`operator`）：大于或等于（`gte`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：208、1
- 第 3 项：
  - 事实条件（`kind=fact`）；类别（`category`）：日期（`date`）；对象（`subject`）：剧本（`scenario`）；字段（`field`）：剧本经过日数（`elapsed-days`）；比较关系（`operator`）：大于或等于（`gte`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：60
- 第 4 项：
  - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：列表（按来源次序）：`諸葛亮`；字段（`field`）：状态（`status`）；比较关系（`operator`）：每一项均属于（`each-in`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：`never-served-free`、`undiscovered`
- 第 5 项：
  - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：列表（按来源次序）：`諸葛亮`、`劉備`；字段（`field`）：血缘关系（`blood-related`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：否（false）
- 第 6 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`劉備`；字段（`field`）：武将列表（`officers`）；比较关系（`operator`）：包含全部（`contains-all`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：`関羽`、`張飛`
- 第 7 项：
  - 事实条件（`kind=fact`）；类别（`category`）：任务或行动（`mission`）；对象（`subject`）：列表（按来源次序）：`劉備`、`関羽`、`張飛`；字段（`field`）：正在执行任务（`on-mission`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：否（false）
- 第 8 项：
  - 事实条件（`kind=fact`）；类别（`category`）：城市（`city`）；对象（`subject`）：`劉備`；字段（`field`）：持有城市（`cities`）；比较关系（`operator`）：包含全部（`contains-all`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：`新野`
- 第 9 项：
  - 事实条件（`kind=fact`）；类别（`category`）：城市（`city`）；对象（`subject`）：`劉備.controlled-cities`；字段（`field`）：治安（`public-order`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：100
- 第 10 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`劉備`；字段（`field`）：城市数（`city-count`）；比较关系（`operator`）：小于或等于（`lte`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：2

### 前置事件关系（`prerequisites`）

- 空列表（0 项）

### 结果与分支（仅来源描述顺序）（`orderedResults`）

- 第 1 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：未说明（`not-stated`）；作用对象（`target`）：`event`
    - 参数（`values`）：空属性集（0 项）

### 不确定性与来源限定（`uncertainties`）

- 第 1 项：Aggregate guide section; no separate visits, choices, or results are supplied. The guide ties the date to 諸葛亮 scheduled debut year 208. Whether public order 100 is required in every controlled city is not clarified.

<a id="atwiki-88-30"></a>

## 观察 30：馬氏の五常

- 事件标识（`eventId`）：`recommend-ma-brothers`
- 观察标识（`observationId`）：`atwiki-88-30`
- 原文标题（`title`）：`馬氏の五常`
- 来源标识（`sourceId`）：`atwiki-88`
- 来源网址（`sourceURL`）：[https://w.atwiki.jp/sangokushi11/pages/88.html](https://w.atwiki.jp/sangokushi11/pages/88.html)
- 来源章节（`sourceSection`）：`馬氏の五常`
- 来源节序（`sourceOrdinal`）：30
- 来源行定位（`sourceLocator`）：
  - 起始行（`startLine`）：594
  - 结束行（`endLine`）：623
- 版本范围（`version`）：
  - 游戏（`game`）：`SAN11`
  - 版本类型（`edition`）：未指定（`unspecified`）
  - 平台（`platform`）：未指定（`unspecified`）
  - 补丁（`patch`）：未指定（`unspecified`）
- 证据性质（`evidence`）：公开攻略转录（`public-guide-transcription`）
- 仅发生一次信息（`onceOnly`）：
  - 状态（`status`）：未说明（`not-stated`）
  - 标志标识（`flagId`）：未提供（null）

### 触发条件（`conditions`）

- 第 1 项：
  - 事实条件（`kind=fact`）；类别（`category`）：日期（`date`）；对象（`subject`）：剧本（`scenario`）；字段（`field`）：剧本开始年月（`start-month`）；比较关系（`operator`）：小于或等于（`lte`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：209、12
- 第 2 项：
  - 事实条件（`kind=fact`）；类别（`category`）：日期（`date`）；对象（`subject`）：剧本（`scenario`）；字段（`field`）：剧本经过日数（`elapsed-days`）；比较关系（`operator`）：大于或等于（`gte`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：60
- 第 3 项：
  - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：列表（按来源次序）：`馬良`；字段（`field`）：已到预定登场年（`scheduled-debut-year-reached`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：是（true）
- 第 4 项：
  - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：列表（按来源次序）：`馬良`；字段（`field`）：状态（`status`）；比较关系（`operator`）：每一项均属于（`each-in`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：`never-served-free`、`undiscovered`
- 第 5 项：
  - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：列表（按来源次序）：`馬良`、`player-ruler`；字段（`field`）：有缘关系（`associated-relationship`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：否（false）
- 第 6 项：
  - 全部成立（`all`）（节点种类（`kind`））
    - 逻辑：本组各子项均成立；仅表示来源的分组，不引入调度规则
    - 子项（`items`）：
      - 第 1 项：
        - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：列表（按来源次序）：`馬良`；字段（`field`）：厌恶武将（`disliked-officer`）；比较关系（`operator`）：不等于（`neq`）；确定性（`certainty`）：来源明示（`stated`）
          - 取值（`value`）：`player-ruler`
      - 第 2 项：
        - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：`player-ruler`；字段（`field`）：厌恶武将列表（`disliked-officers`）；比较关系（`operator`）：全部不包含（`contains-none`）；确定性（`certainty`）：来源明示（`stated`）
          - 取值（`value`）：列表（按来源次序）：`馬良`
- 第 7 项：
  - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：列表（按来源次序）：`馬謖`；字段（`field`）：已到预定登场年（`scheduled-debut-year-reached`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：是（true）
- 第 8 项：
  - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：列表（按来源次序）：`馬謖`；字段（`field`）：状态（`status`）；比较关系（`operator`）：每一项均属于（`each-in`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：`never-served-free`、`undiscovered`
- 第 9 项：
  - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：列表（按来源次序）：`馬謖`、`player-ruler`；字段（`field`）：有缘关系（`associated-relationship`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：否（false）
- 第 10 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`player-force`；字段（`field`）：武将列表（`officers`）；比较关系（`operator`）：包含全部（`contains-all`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：`伊籍`
- 第 11 项：
  - 全部成立（`all`）（节点种类（`kind`））
    - 逻辑：本组各子项均成立；仅表示来源的分组，不引入调度规则
    - 子项（`items`）：
      - 第 1 项：
        - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：列表（按来源次序）：`伊籍`；字段（`field`）：厌恶武将（`disliked-officer`）；比较关系（`operator`）：不等于（`neq`）；确定性（`certainty`）：来源明示（`stated`）
          - 取值（`value`）：`player-ruler`
      - 第 2 项：
        - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：`player-ruler`；字段（`field`）：厌恶武将列表（`disliked-officers`）；比较关系（`operator`）：全部不包含（`contains-none`）；确定性（`certainty`）：来源明示（`stated`）
          - 取值（`value`）：列表（按来源次序）：`伊籍`
- 第 12 项：
  - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：`伊籍`；字段（`field`）：忠诚（`loyalty`）；比较关系（`operator`）：大于或等于（`gte`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：90
- 第 13 项：
  - 事实条件（`kind=fact`）；类别（`category`）：城市（`city`）；对象（`subject`）：`player-ruler.assigned-city`；字段（`field`）：治安（`public-order`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：100
- 第 14 项：
  - 事实条件（`kind=fact`）；类别（`category`）：任务或行动（`mission`）；对象（`subject`）：列表（按来源次序）：`player-ruler`、`伊籍`；字段（`field`）：行动已用（`action-used`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：否（false）

### 前置事件关系（`prerequisites`）

- 空列表（0 项）

### 结果与分支（仅来源描述顺序）（`orderedResults`）

- 第 1 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：增加（`increase`）；作用对象（`target`）：`伊籍`
    - 参数（`values`）：
      - 功绩（`merit`）：500
- 第 2 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：加入势力（`join-force`）；作用对象（`target`）：列表（按来源次序）：`馬良`、`馬謖`
    - 参数（`values`）：
      - 势力（`force`）：`player-force`
- 第 3 项：
  - 分支（`branch`）（节点种类（`kind`））
    - 分支标识（`branchId`）：`liu-bei`
    - 分支条件（`condition`）：
      - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`player`；字段（`field`）：君主（`ruler`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
        - 取值（`value`）：`劉備`
    - 按来源描述排列的结果（`orderedResults`）：
      - 第 1 项：
        - 结果效果（`kind=effect`）；操作（`operation`）：设为（`set`）；作用对象（`target`）：`馬良`
          - 参数（`values`）：
            - 忠诚（`loyalty`）：100
            - 功绩（`merit`）：4000
      - 第 2 项：
        - 结果效果（`kind=effect`）；操作（`operation`）：设为（`set`）；作用对象（`target`）：`馬謖`
          - 参数（`values`）：
            - 忠诚（`loyalty`）：100
            - 功绩（`merit`）：500
- 第 4 项：
  - 分支（`branch`）（节点种类（`kind`））
    - 分支标识（`branchId`）：`other-ruler`
    - 分支条件（`condition`）：
      - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`player`；字段（`field`）：君主（`ruler`）；比较关系（`operator`）：不等于（`neq`）；确定性（`certainty`）：来源明示（`stated`）
        - 取值（`value`）：`劉備`
    - 按来源描述排列的结果（`orderedResults`）：
      - 第 1 项：
        - 结果效果（`kind=effect`）；操作（`operation`）：设为（`set`）；作用对象（`target`）：`馬良`
          - 参数（`values`）：
            - 忠诚（`loyalty`）：100
            - 功绩（`merit`）：2000
      - 第 2 项：
        - 结果效果（`kind=effect`）；操作（`operation`）：设为（`set`）；作用对象（`target`）：`馬謖`
          - 参数（`values`）：
            - 忠诚（`loyalty`）：100
            - 功绩（`merit`）：500

### 不确定性与来源限定（`uncertainties`）

- 第 1 项：No mutual-dislike exclusions are stated for 馬謖; none are inferred.

<a id="atwiki-88-31"></a>

## 观察 31：孫尚香の結婚

- 事件标识（`eventId`）：`marry-sun-shang-xiang`
- 观察标识（`observationId`）：`atwiki-88-31`
- 原文标题（`title`）：`孫尚香の結婚`
- 来源标识（`sourceId`）：`atwiki-88`
- 来源网址（`sourceURL`）：[https://w.atwiki.jp/sangokushi11/pages/88.html](https://w.atwiki.jp/sangokushi11/pages/88.html)
- 来源章节（`sourceSection`）：`孫尚香の結婚`
- 来源节序（`sourceOrdinal`）：31
- 来源行定位（`sourceLocator`）：
  - 起始行（`startLine`）：624
  - 结束行（`endLine`）：643
- 版本范围（`version`）：
  - 游戏（`game`）：`SAN11`
  - 版本类型（`edition`）：未指定（`unspecified`）
  - 平台（`platform`）：未指定（`unspecified`）
  - 补丁（`patch`）：未指定（`unspecified`）
- 证据性质（`evidence`）：公开攻略转录（`public-guide-transcription`）
- 仅发生一次信息（`onceOnly`）：
  - 状态（`status`）：未说明（`not-stated`）
  - 标志标识（`flagId`）：未提供（null）

### 触发条件（`conditions`）

- 第 1 项：
  - 事实条件（`kind=fact`）；类别（`category`）：日期（`date`）；对象（`subject`）：剧本（`scenario`）；字段（`field`）：剧本开始年月（`start-month`）；比较关系（`operator`）：小于或等于（`lte`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：209、12
- 第 2 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`劉備`；字段（`field`）：存在（`exists`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：是（true）
- 第 3 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`劉備`；字段（`field`）：君主（`ruler`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：`劉備`
- 第 4 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`孫呉勢力`；字段（`field`）：存在（`exists`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：是（true）
- 第 5 项：
  - 任一成立（`any`）（节点种类（`kind`））
    - 逻辑：本组至少一个子项成立；仅表示来源的分组，不引入调度规则
    - 子项（`items`）：
      - 第 1 项：
        - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`孫呉勢力`；字段（`field`）：君主（`ruler`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
          - 取值（`value`）：`孫堅`
      - 第 2 项：
        - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：`孫呉勢力.ruler`；字段（`field`）：与指定人物有血缘关系（`blood-related-to`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
          - 取值（`value`）：`孫堅`
- 第 6 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`孫呉勢力`；字段（`field`）：武将列表（`officers`）；比较关系（`operator`）：包含全部（`contains-all`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：`孫尚香`
- 第 7 项：
  - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：`孫尚香`；字段（`field`）：状态（`status`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：`ordinary`
- 第 8 项：
  - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：列表（按来源次序）：`孫尚香`、`劉備`；字段（`field`）：配偶（`spouse`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：未提供（null）
- 第 9 项：
  - 事实条件（`kind=fact`）；类别（`category`）：任务或行动（`mission`）；对象（`subject`）：列表（按来源次序）：`孫尚香`、`劉備`、`孫呉勢力.ruler`；字段（`field`）：正在执行任务（`on-mission`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：否（false）
- 第 10 项：
  - 事实条件（`kind=fact`）；类别（`category`）：外交（`diplomacy`）；对象（`subject`）：列表（按来源次序）：`劉備`、`孫呉勢力`；字段（`field`）：友好度（`friendship`）；比较关系（`operator`）：大于或等于（`gte`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：`中立`

### 前置事件关系（`prerequisites`）

- 空列表（0 项）

### 结果与分支（仅来源描述顺序）（`orderedResults`）

- 第 1 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：结婚（`marry`）；作用对象（`target`）：列表（按来源次序）：`劉備`、`孫尚香`
    - 参数（`values`）：空属性集（0 项）
- 第 2 项：
  - 分支（`branch`）（节点种类（`kind`））
    - 分支标识（`branchId`）：`historical-sun-shang-xiang`
    - 分支条件（`condition`）：
      - 事实条件（`kind=fact`）；类别（`category`）：游戏设置（`settings`）；对象（`subject`）：`孫尚香`；字段（`field`）：人物类型（`character-type`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
        - 取值（`value`）：`historical-officer`
    - 按来源描述排列的结果（`orderedResults`）：
      - 第 1 项：
        - 结果效果（`kind=effect`）；操作（`operation`）：加入势力（`join-force`）；作用对象（`target`）：`孫尚香`
          - 参数（`values`）：
            - 势力（`force`）：`劉備`
      - 第 2 项：
        - 结果效果（`kind=effect`）；操作（`operation`）：设为（`set`）；作用对象（`target`）：`孫尚香`
          - 参数（`values`）：
            - 功绩（`merit`）：1000
      - 第 3 项：
        - 结果效果（`kind=effect`）；操作（`operation`）：设为（`set`）；作用对象（`target`）：`孫尚香`
          - 参数（`values`）：
            - 忠诚（`loyalty`）：100
- 第 3 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：提高友好度（`increase-friendship`）；作用对象（`target`）：列表（按来源次序）：`劉備`、`孫呉勢力`
    - 参数（`values`）：
      - 变化幅度（`magnitude`）：未说明（`not-stated`）
- 第 4 项：
  - 分支（`branch`）（节点种类（`kind`））
    - 分支标识（`branchId`）：`not-already-allied`
    - 分支条件（`condition`）：
      - 事实条件（`kind=fact`）；类别（`category`）：外交（`diplomacy`）；对象（`subject`）：列表（按来源次序）：`劉備`、`孫呉勢力`；字段（`field`）：处于同盟（`allied`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
        - 取值（`value`）：否（false）
    - 按来源描述排列的结果（`orderedResults`）：
      - 第 1 项：
        - 结果效果（`kind=effect`）；操作（`operation`）：缔结同盟（`form-alliance`）；作用对象（`target`）：列表（按来源次序）：`劉備`、`孫呉勢力`
          - 参数（`values`）：
            - 持续时间（`duration`）：未说明（`not-stated`）

### 不确定性与来源限定（`uncertainties`）

- 空列表（0 项）

<a id="atwiki-88-32"></a>

## 观察 32：呉下の阿蒙にあらず

- 事件标识（`eventId`）：`lu-meng-studies`
- 观察标识（`observationId`）：`atwiki-88-32`
- 原文标题（`title`）：`呉下の阿蒙にあらず`
- 来源标识（`sourceId`）：`atwiki-88`
- 来源网址（`sourceURL`）：[https://w.atwiki.jp/sangokushi11/pages/88.html](https://w.atwiki.jp/sangokushi11/pages/88.html)
- 来源章节（`sourceSection`）：`呉下の阿蒙にあらず`
- 来源节序（`sourceOrdinal`）：32
- 来源行定位（`sourceLocator`）：
  - 起始行（`startLine`）：644
  - 结束行（`endLine`）：661
- 版本范围（`version`）：
  - 游戏（`game`）：`SAN11`
  - 版本类型（`edition`）：未指定（`unspecified`）
  - 平台（`platform`）：未指定（`unspecified`）
  - 补丁（`patch`）：未指定（`unspecified`）
- 证据性质（`evidence`）：公开攻略转录（`public-guide-transcription`）
- 仅发生一次信息（`onceOnly`）：
  - 状态（`status`）：未说明（`not-stated`）
  - 标志标识（`flagId`）：未提供（null）

### 触发条件（`conditions`）

- 第 1 项：
  - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：`孫権`；字段（`field`）：状态（`status`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：`ruler`
- 第 2 项：
  - 事实条件（`kind=fact`）；类别（`category`）：日期（`date`）；对象（`subject`）：剧本（`scenario`）；字段（`field`）：剧本经过日数（`elapsed-days`）；比较关系（`operator`）：大于或等于（`gte`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：30
- 第 3 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`孫権`；字段（`field`）：武将列表（`officers`）；比较关系（`operator`）：包含全部（`contains-all`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：`呂蒙`、`蒋欽`
- 第 4 项：
  - 事实条件（`kind=fact`）；类别（`category`）：城市（`city`）；对象（`subject`）：列表（按来源次序）：`孫権`、`呂蒙`、`蒋欽`；字段（`field`）：当前所在据点（`current-base`）；比较关系（`operator`）：全部相同（`all-equal`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：是（true）
- 第 5 项：
  - 事实条件（`kind=fact`）；类别（`category`）：任务或行动（`mission`）；对象（`subject`）：列表（按来源次序）：`孫権`、`呂蒙`、`蒋欽`；字段（`field`）：正在执行任务（`on-mission`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：否（false）
- 第 6 项：
  - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：列表（按来源次序）：`呂蒙`、`蒋欽`；字段（`field`）：智力（`intelligence`）；比较关系（`operator`）：小于或等于（`lte`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：70
- 第 7 项：
  - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：列表（按来源次序）：`呂蒙`、`蒋欽`；字段（`field`）：忠诚（`loyalty`）；比较关系（`operator`）：大于或等于（`gte`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：95
- 第 8 项：
  - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：列表（按来源次序）：`呂蒙`、`蒋欽`；字段（`field`）：功绩（`merit`）；比较关系（`operator`）：大于或等于（`gte`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：5000

### 前置事件关系（`prerequisites`）

- 空列表（0 项）

### 结果与分支（仅来源描述顺序）（`orderedResults`）

- 第 1 项：
  - 分支（`branch`）（节点种类（`kind`））
    - 分支标识（`branchId`）：`unqualified-result-block`
    - 分支条件（`condition`）：
      - 事实条件（`kind=fact`）；类别（`category`）：游戏设置（`settings`）；对象（`subject`）：`source-result-block`；字段（`field`）：版本（`edition`）；比较关系（`operator`）：未说明（`not-stated`）；确定性（`certainty`）：版本未说明（`edition-unspecified`）
        - 取值（`value`）：`unqualified`
    - 按来源描述排列的结果（`orderedResults`）：
      - 第 1 项：
        - 结果效果（`kind=effect`）；操作（`operation`）：仅在新数值更高时提升（`raise-only-if-greater`）；作用对象（`target`）：`呂蒙`
          - 参数（`values`）：
            - 统率（`leadership`）：91
            - 智力（`intelligence`）：89
            - 政治（`politics`）：78
      - 第 2 项：
        - 结果效果（`kind=effect`）；操作（`operation`）：增加（`increase`）；作用对象（`target`）：`呂蒙`
          - 参数（`values`）：
            - 功绩（`merit`）：500
      - 第 3 项：
        - 分支（`branch`）（节点种类（`kind`））
          - 分支标识（`branchId`）：`unqualified-portrait-not-changed`
          - 分支条件（`condition`）：
            - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：`呂蒙`；字段（`field`）：头像已改变（`portrait-already-changed`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
              - 取值（`value`）：否（false）
          - 按来源描述排列的结果（`orderedResults`）：
            - 第 1 项：
              - 结果效果（`kind=effect`）；操作（`operation`）：改变头像（`change-portrait`）；作用对象（`target`）：`呂蒙`
                - 参数（`values`）：
                  - 头像标识（`portraitId`）：未说明（`not-stated`）
      - 第 4 项：
        - 结果效果（`kind=effect`）；操作（`operation`）：仅在新数值更高时提升（`raise-only-if-greater`）；作用对象（`target`）：`蒋欽`
          - 参数（`values`）：
            - 统率（`leadership`）：78
            - 智力（`intelligence`）：51
            - 政治（`politics`）：42
      - 第 5 项：
        - 结果效果（`kind=effect`）；操作（`operation`）：增加（`increase`）；作用对象（`target`）：`蒋欽`
          - 参数（`values`）：
            - 功绩（`merit`）：500
- 第 2 项：
  - 分支（`branch`）（节点种类（`kind`））
    - 分支标识（`branchId`）：`power-up-kit`
    - 分支条件（`condition`）：
      - 事实条件（`kind=fact`）；类别（`category`）：游戏设置（`settings`）；对象（`subject`）：`game`；字段（`field`）：版本（`edition`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
        - 取值（`value`）：`power-up-kit`
    - 按来源描述排列的结果（`orderedResults`）：
      - 第 1 项：
        - 结果效果（`kind=effect`）；操作（`operation`）：仅在新数值更高时提升（`raise-only-if-greater`）；作用对象（`target`）：`呂蒙`
          - 参数（`values`）：
            - 统率（`leadership`）：89
            - 智力（`intelligence`）：82
            - 政治（`politics`）：72
      - 第 2 项：
        - 结果效果（`kind=effect`）；操作（`operation`）：增加（`increase`）；作用对象（`target`）：`呂蒙`
          - 参数（`values`）：
            - 功绩（`merit`）：500
      - 第 3 项：
        - 分支（`branch`）（节点种类（`kind`））
          - 分支标识（`branchId`）：`pk-portrait-not-changed`
          - 分支条件（`condition`）：
            - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：`呂蒙`；字段（`field`）：头像已改变（`portrait-already-changed`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
              - 取值（`value`）：否（false）
          - 按来源描述排列的结果（`orderedResults`）：
            - 第 1 项：
              - 结果效果（`kind=effect`）；操作（`operation`）：改变头像（`change-portrait`）；作用对象（`target`）：`呂蒙`
                - 参数（`values`）：
                  - 头像标识（`portraitId`）：未说明（`not-stated`）
      - 第 4 项：
        - 结果效果（`kind=effect`）；操作（`operation`）：仅在新数值更高时提升（`raise-only-if-greater`）；作用对象（`target`）：`蒋欽`
          - 参数（`values`）：
            - 统率（`leadership`）：78
            - 智力（`intelligence`）：51
            - 政治（`politics`）：42
      - 第 5 项：
        - 结果效果（`kind=effect`）；操作（`operation`）：增加（`increase`）；作用对象（`target`）：`蒋欽`
          - 参数（`values`）：
            - 功绩（`merit`）：500

### 不确定性与来源限定（`uncertainties`）

- 第 1 项：The first result block has no edition label; it is not promoted to a proven vanilla-only rule. The second result block explicitly says Power Up Kit. Only parameter values greater than the prior value are changed; merit increments and conditional portrait changes remain separate.

<a id="atwiki-88-33"></a>

## 观察 33：周瑜の死

- 事件标识（`eventId`）：`zhou-yu-death`
- 观察标识（`observationId`）：`atwiki-88-33`
- 原文标题（`title`）：`周瑜の死`
- 来源标识（`sourceId`）：`atwiki-88`
- 来源网址（`sourceURL`）：[https://w.atwiki.jp/sangokushi11/pages/88.html](https://w.atwiki.jp/sangokushi11/pages/88.html)
- 来源章节（`sourceSection`）：`周瑜の死`
- 来源节序（`sourceOrdinal`）：33
- 来源行定位（`sourceLocator`）：
  - 起始行（`startLine`）：662
  - 结束行（`endLine`）：675
- 版本范围（`version`）：
  - 游戏（`game`）：`SAN11`
  - 版本类型（`edition`）：未指定（`unspecified`）
  - 平台（`platform`）：未指定（`unspecified`）
  - 补丁（`patch`）：未指定（`unspecified`）
- 证据性质（`evidence`）：公开攻略转录（`public-guide-transcription`）
- 仅发生一次信息（`onceOnly`）：
  - 状态（`status`）：未说明（`not-stated`）
  - 标志标识（`flagId`）：未提供（null）

### 触发条件（`conditions`）

- 第 1 项：
  - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：`周瑜`；字段（`field`）：自然死亡时间已到（`natural-death-due`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：是（true）
- 第 2 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`player-force`；字段（`field`）：武将列表（`officers`）；比较关系（`operator`）：包含全部（`contains-all`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：`周瑜`
- 第 3 项：
  - 事实条件（`kind=fact`）；类别（`category`）：城市（`city`）；对象（`subject`）：`player-force`；字段（`field`）：持有城市（`cities`）；比较关系（`operator`）：包含全部（`contains-all`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：`建業`、`呉`、`会稽`、`廬江`、`柴桑`
- 第 4 项：
  - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：`周瑜`；字段（`field`）：状态（`status`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：`ordinary`
- 第 5 项：
  - 事实条件（`kind=fact`）；类别（`category`）：任务或行动（`mission`）；对象（`subject`）：列表（按来源次序）：`player-ruler`、`周瑜`；字段（`field`）：正在执行任务（`on-mission`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：否（false）

### 前置事件关系（`prerequisites`）

- 空列表（0 项）

### 结果与分支（仅来源描述顺序）（`orderedResults`）

- 第 1 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：死亡（`death`）；作用对象（`target`）：`周瑜`
    - 参数（`values`）：空属性集（0 项）
- 第 2 项：
  - 分支（`branch`）（节点种类（`kind`））
    - 分支标识（`branchId`）：`lu-su-subordinate`
    - 分支条件（`condition`）：
      - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`player-force`；字段（`field`）：武将列表（`officers`）；比较关系（`operator`）：包含全部（`contains-all`）；确定性（`certainty`）：来源明示（`stated`）
        - 取值（`value`）：列表（按来源次序）：`魯粛`
    - 按来源描述排列的结果（`orderedResults`）：
      - 第 1 项：
        - 分支（`branch`）（节点种类（`kind`））
          - 分支标识（`branchId`）：`lower-merit`
          - 分支条件（`condition`）：
            - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：`魯粛`；字段（`field`）：功绩（`merit`）；比较关系（`operator`）：小于（`lt`）；确定性（`certainty`）：来源明示（`stated`）
              - 取值（`value`）：
                - 参考依据（`reference`）：`周瑜.merit`
          - 按来源描述排列的结果（`orderedResults`）：
            - 第 1 项：
              - 结果效果（`kind=effect`）；操作（`operation`）：设为（`set`）；作用对象（`target`）：`魯粛`
                - 参数（`values`）：
                  - 功绩（`merit`）：
                    - 参考依据（`reference`）：`周瑜.merit`
      - 第 2 项：
        - 分支（`branch`）（节点种类（`kind`））
          - 分支标识（`branchId`）：`not-lower-merit`
          - 分支条件（`condition`）：
            - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：`魯粛`；字段（`field`）：功绩（`merit`）；比较关系（`operator`）：大于或等于（`gte`）；确定性（`certainty`）：来源明示（`stated`）
              - 取值（`value`）：
                - 参考依据（`reference`）：`周瑜.merit`
          - 按来源描述排列的结果（`orderedResults`）：
            - 第 1 项：
              - 结果效果（`kind=effect`）；操作（`operation`）：增加（`increase`）；作用对象（`target`）：`魯粛`
                - 参数（`values`）：
                  - 功绩（`merit`）：2000

### 不确定性与来源限定（`uncertainties`）

- 空列表（0 项）

<a id="atwiki-88-34"></a>

## 观察 34：曹操の死

- 事件标识（`eventId`）：`cao-cao-death`
- 观察标识（`observationId`）：`atwiki-88-34`
- 原文标题（`title`）：`曹操の死`
- 来源标识（`sourceId`）：`atwiki-88`
- 来源网址（`sourceURL`）：[https://w.atwiki.jp/sangokushi11/pages/88.html](https://w.atwiki.jp/sangokushi11/pages/88.html)
- 来源章节（`sourceSection`）：`曹操の死`
- 来源节序（`sourceOrdinal`）：34
- 来源行定位（`sourceLocator`）：
  - 起始行（`startLine`）：676
  - 结束行（`endLine`）：699
- 版本范围（`version`）：
  - 游戏（`game`）：`SAN11`
  - 版本类型（`edition`）：未指定（`unspecified`）
  - 平台（`platform`）：未指定（`unspecified`）
  - 补丁（`patch`）：未指定（`unspecified`）
- 证据性质（`evidence`）：公开攻略转录（`public-guide-transcription`）
- 仅发生一次信息（`onceOnly`）：
  - 状态（`status`）：未说明（`not-stated`）
  - 标志标识（`flagId`）：未提供（null）

### 触发条件（`conditions`）

- 第 1 项：
  - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：`曹操`；字段（`field`）：自然死亡时间已到（`natural-death-due`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：是（true）
- 第 2 项：
  - 事实条件（`kind=fact`）；类别（`category`）：爵位（`title`）；对象（`subject`）：`曹操`；字段（`field`）：爵位（`rank-title`）；比较关系（`operator`）：属于（`in`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：`皇帝`、`王`、`公`
- 第 3 项：
  - 事实条件（`kind=fact`）；类别（`category`）：城市（`city`）；对象（`subject`）：`曹操`；字段（`field`）：持有城市（`cities`）；比较关系（`operator`）：包含全部（`contains-all`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：`許昌`、`洛陽`、`長安`、`鄴`
- 第 4 项：
  - 事实条件（`kind=fact`）；类别（`category`）：城市（`city`）；对象（`subject`）：`曹操`；字段（`field`）：地区内持有城市数（`owned-city-count-in-region`）；比较关系（`operator`）：大于或等于（`gte`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：
      - 城市列表（`cities`）：列表（按来源次序）：`北海`、`下邳`、`小沛`、`寿春`、`濮陽`、`陳陽`、`許昌`、`汝南`、`洛陽`
      - 数量（`count`）：7
- 第 5 项：
  - 事实条件（`kind=fact`）；类别（`category`）：城市（`city`）；对象（`subject`）：`曹操`；字段（`field`）：持有城市（`cities`）；比较关系（`operator`）：包含全部（`contains-all`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：`北平`、`薊`、`南皮`、`平原`、`晋陽`、`鄴`
- 第 6 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`曹操`；字段（`field`）：武将列表（`officers`）；比较关系（`operator`）：包含任一（`contains-any`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：`曹昂`、`曹丕`、`曹植`、`曹沖`、`曹彰`

### 前置事件关系（`prerequisites`）

- 空列表（0 项）

### 结果与分支（仅来源描述顺序）（`orderedResults`）

- 第 1 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：死亡（`death`）；作用对象（`target`）：`曹操`
    - 参数（`values`）：空属性集（0 项）
- 第 2 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：按来源优先次序选择继承人（`select-successor-in-priority-order`）；作用对象（`target`）：`曹操-force`
    - 参数（`values`）：
      - 候选对象（`candidates`）：列表（按来源次序）：`曹昂`、`曹丕`、`曹植`、`曹沖`、`曹彰`
      - 适用条件（`eligibility`）：`only-current-subordinates`

### 不确定性与来源限定（`uncertainties`）

- 第 1 项：The succession priority is 曹昂 > 曹丕 > 曹植 > 曹沖 > 曹彰. Source spelling 陳陽 is retained.

<a id="atwiki-88-35"></a>

## 观察 35：漢中王即位

- 事件标识（`eventId`）：`liu-bei-hanzhong-king`
- 观察标识（`observationId`）：`atwiki-88-35`
- 原文标题（`title`）：`漢中王即位`
- 来源标识（`sourceId`）：`atwiki-88`
- 来源网址（`sourceURL`）：[https://w.atwiki.jp/sangokushi11/pages/88.html](https://w.atwiki.jp/sangokushi11/pages/88.html)
- 来源章节（`sourceSection`）：`漢中王即位`
- 来源节序（`sourceOrdinal`）：35
- 来源行定位（`sourceLocator`）：
  - 起始行（`startLine`）：700
  - 结束行（`endLine`）：727
- 版本范围（`version`）：
  - 游戏（`game`）：`SAN11`
  - 版本类型（`edition`）：未指定（`unspecified`）
  - 平台（`platform`）：未指定（`unspecified`）
  - 补丁（`patch`）：未指定（`unspecified`）
- 证据性质（`evidence`）：公开攻略转录（`public-guide-transcription`）
- 仅发生一次信息（`onceOnly`）：
  - 状态（`status`）：未说明（`not-stated`）
  - 标志标识（`flagId`）：未提供（null）

### 触发条件（`conditions`）

- 第 1 项：
  - 事实条件（`kind=fact`）；类别（`category`）：日期（`date`）；对象（`subject`）：剧本（`scenario`）；字段（`field`）：剧本开始年月（`start-month`）；比较关系（`operator`）：小于或等于（`lte`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：218、12
- 第 2 项：
  - 事实条件（`kind=fact`）；类别（`category`）：日期（`date`）；对象（`subject`）：剧本（`scenario`）；字段（`field`）：剧本经过日数（`elapsed-days`）；比较关系（`operator`）：大于或等于（`gte`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：180
- 第 3 项：
  - 事实条件（`kind=fact`）；类别（`category`）：皇帝（`emperor`）；对象（`subject`）：`later-han-emperor`；字段（`field`）：存在（`exists`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：是（true）
- 第 4 项：
  - 事实条件（`kind=fact`）；类别（`category`）：爵位（`title`）；对象（`subject`）：`劉備`；字段（`field`）：爵位（`rank-title`）；比较关系（`operator`）：不属于（`not-in`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：`皇帝`、`王`
- 第 5 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`劉備`；字段（`field`）：武将列表（`officers`）；比较关系（`operator`）：包含全部（`contains-all`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：`諸葛亮`
- 第 6 项：
  - 事实条件（`kind=fact`）；类别（`category`）：皇帝（`emperor`）；对象（`subject`）：`劉備`；字段（`field`）：拥立后汉皇帝（`supports-later-han-emperor`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：否（false）
- 第 7 项：
  - 事实条件（`kind=fact`）；类别（`category`）：城市（`city`）；对象（`subject`）：`劉備`；字段（`field`）：持有城市（`cities`）；比较关系（`operator`）：包含全部（`contains-all`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：`永安`、`漢中`、`梓潼`、`江州`、`成都`
- 第 8 项：
  - 事实条件（`kind=fact`）；类别（`category`）：任务或行动（`mission`）；对象（`subject`）：列表（按来源次序）：`劉備`、`諸葛亮`；字段（`field`）：正在执行任务（`on-mission`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：否（false）

### 前置事件关系（`prerequisites`）

- 空列表（0 项）

### 结果与分支（仅来源描述顺序）（`orderedResults`）

- 第 1 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：设为（`set`）；作用对象（`target`）：`劉備`
    - 参数（`values`）：
      - 爵位（`rankTitle`）：`王`
- 第 2 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：增加（`increase`）；作用对象（`target`）：`劉備.all-controlled-cities`
    - 参数（`values`）：
      - 治安（`publicOrder`）：15
- 第 3 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：增加（`increase`）；作用对象（`target`）：`劉備.all-controlled-city-soldiers`
    - 参数（`values`）：
      - 气力（`energy`）：15
- 第 4 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：增加（`increase`）；作用对象（`target`）：`劉備.all-subordinate-officers`
    - 参数（`values`）：
      - 忠诚（`loyalty`）：15
- 第 5 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：增加（`increase`）；作用对象（`target`）：`諸葛亮`
    - 参数（`values`）：
      - 功绩（`merit`）：2000
- 第 6 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：降低友好度（`decrease-friendship`）；作用对象（`target`）：`劉備`
    - 参数（`values`）：
      - 作用对象筛选（`targetSelector`）：
        - 全部成立（`all`）（节点种类（`kind`））
          - 逻辑：本组各子项均成立；仅表示来源的分组，不引入调度规则
          - 子项（`items`）：
            - 第 1 项：
              - 事实条件（`kind=fact`）；类别（`category`）：外交（`diplomacy`）；对象（`subject`）：列表（按来源次序）：`selected-force`、`劉備`；字段（`field`）：处于同盟（`allied`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
                - 取值（`value`）：否（false）
            - 第 2 项：
              - 事实条件（`kind=fact`）；类别（`category`）：外交（`diplomacy`）；对象（`subject`）：列表（按来源次序）：`selected-force`、`劉備`；字段（`field`）：友好度（`friendship`）；比较关系（`operator`）：小于（`lt`）；确定性（`certainty`）：来源明示（`stated`）
                - 取值（`value`）：`好意`
            - 第 3 项：
              - 任一成立（`any`）（节点种类（`kind`））
                - 逻辑：本组至少一个子项成立；仅表示来源的分组，不引入调度规则
                - 子项（`items`）：
                  - 第 1 项：
                    - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`selected-force`；字段（`field`）：君主（`ruler`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
                      - 取值（`value`）：`曹操`
                  - 第 2 项：
                    - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：`selected-force.ruler`；字段（`field`）：与指定人物有血缘关系（`blood-related-to`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
                      - 取值（`value`）：`曹操`
                  - 第 3 项：
                    - 事实条件（`kind=fact`）；类别（`category`）：皇帝（`emperor`）；对象（`subject`）：`selected-force`；字段（`field`）：拥立后汉皇帝（`supports-later-han-emperor`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
                      - 取值（`value`）：是（true）
      - 变化幅度（`magnitude`）：未说明（`not-stated`）
      - 方向（`direction`）：未说明（`not-stated`）

### 不确定性与来源限定（`uncertainties`）

- 空列表（0 项）

<a id="atwiki-88-36"></a>

## 观察 36：魏帝即位

- 事件标识（`eventId`）：`wei-emperor-accession`
- 观察标识（`observationId`）：`atwiki-88-36`
- 原文标题（`title`）：`魏帝即位`
- 来源标识（`sourceId`）：`atwiki-88`
- 来源网址（`sourceURL`）：[https://w.atwiki.jp/sangokushi11/pages/88.html](https://w.atwiki.jp/sangokushi11/pages/88.html)
- 来源章节（`sourceSection`）：`魏帝即位`
- 来源节序（`sourceOrdinal`）：36
- 来源行定位（`sourceLocator`）：
  - 起始行（`startLine`）：728
  - 结束行（`endLine`）：761
- 版本范围（`version`）：
  - 游戏（`game`）：`SAN11`
  - 版本类型（`edition`）：未指定（`unspecified`）
  - 平台（`platform`）：未指定（`unspecified`）
  - 补丁（`patch`）：未指定（`unspecified`）
- 证据性质（`evidence`）：公开攻略转录（`public-guide-transcription`）
- 仅发生一次信息（`onceOnly`）：
  - 状态（`status`）：未说明（`not-stated`）
  - 标志标识（`flagId`）：未提供（null）

### 触发条件（`conditions`）

- 第 1 项：
  - 事实条件（`kind=fact`）；类别（`category`）：日期（`date`）；对象（`subject`）：剧本（`scenario`）；字段（`field`）：剧本开始年月（`start-month`）；比较关系（`operator`）：小于或等于（`lte`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：219、12
- 第 2 项：
  - 事实条件（`kind=fact`）；类别（`category`）：日期（`date`）；对象（`subject`）：剧本（`scenario`）；字段（`field`）：剧本经过日数（`elapsed-days`）；比较关系（`operator`）：大于或等于（`gte`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：180
- 第 3 项：
  - 事实条件（`kind=fact`）；类别（`category`）：皇帝（`emperor`）；对象（`subject`）：`later-han-emperor`；字段（`field`）：存在（`exists`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：是（true）
- 第 4 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`曹家勢力`；字段（`field`）：君主（`ruler`）；比较关系（`operator`）：不等于（`neq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：`曹操`
- 第 5 项：
  - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：`曹家勢力.ruler`；字段（`field`）：与指定人物有血缘关系（`blood-related-to`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：`曹操`
- 第 6 项：
  - 事实条件（`kind=fact`）；类别（`category`）：皇帝（`emperor`）；对象（`subject`）：`曹家勢力`；字段（`field`）：拥立后汉皇帝（`supports-later-han-emperor`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：是（true）
- 第 7 项：
  - 事实条件（`kind=fact`）；类别（`category`）：爵位（`title`）；对象（`subject`）：`曹家勢力.ruler`；字段（`field`）：爵位（`rank-title`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：`王`
- 第 8 项：
  - 事实条件（`kind=fact`）；类别（`category`）：城市（`city`）；对象（`subject`）：`曹家勢力`；字段（`field`）：持有城市（`cities`）；比较关系（`operator`）：包含全部（`contains-all`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：`許昌`、`洛陽`、`長安`、`鄴`
- 第 9 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`曹家勢力`；字段（`field`）：城市数（`city-count`）；比较关系（`operator`）：大于或等于（`gte`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：12
- 第 10 项：
  - 事实条件（`kind=fact`）；类别（`category`）：任务或行动（`mission`）；对象（`subject`）：列表（按来源次序）：`曹家勢力.ruler`；字段（`field`）：行动已用（`action-used`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：否（false）
- 第 11 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`COM-forces`；字段（`field`）：国号（`country-name`）；比较关系（`operator`）：全部不包含（`contains-none`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：`魏`

### 前置事件关系（`prerequisites`）

- 空列表（0 项）

### 结果与分支（仅来源描述顺序）（`orderedResults`）

- 第 1 项：
  - 选择（`choice`）（节点种类（`kind`））
    - 选择标识（`choiceId`）：`accept-emperor`
    - 控制方（`controller`）：`曹家勢力:player-chooses;COM-accepts`
    - 电脑默认选项（`aiDefault`）：`accept`
    - 可选项（`options`）：
      - 第 1 项：
        - 选项标识（`optionId`）：`accept`
        - 按来源描述排列的结果（`orderedResults`）：
          - 第 1 项：
            - 结果效果（`kind=effect`）；操作（`operation`）：移除当前皇帝（`remove-current-emperor`）；作用对象（`target`）：`later-han-emperor`
              - 参数（`values`）：空属性集（0 项）
          - 第 2 项：
            - 结果效果（`kind=effect`）；操作（`operation`）：设为（`set`）；作用对象（`target`）：`曹家勢力.ruler`
              - 参数（`values`）：
                - 爵位（`rankTitle`）：`皇帝`
          - 第 3 项：
            - 结果效果（`kind=effect`）；操作（`operation`）：设为（`set`）；作用对象（`target`）：`曹家勢力`
              - 参数（`values`）：
                - 国号（`countryName`）：`魏`
      - 第 2 项：
        - 选项标识（`optionId`）：`decline`
        - 按来源描述排列的结果（`orderedResults`）：
          - 第 1 项：
            - 结果效果（`kind=effect`）；操作（`operation`）：未说明（`not-stated`）；作用对象（`target`）：`event`
              - 参数（`values`）：空属性集（0 项）
- 第 2 项：
  - 分支（`branch`）（节点种类（`kind`））
    - 分支标识（`branchId`）：`outdented-scope-ambiguous`
    - 分支条件（`condition`）：
      - 事实条件（`kind=fact`）；类别（`category`）：其他（`other`）；对象（`subject`）：`source-result-lines-750-761`；字段（`field`）：适用范围（`applicability`）；比较关系（`operator`）：未知（`unknown`）；确定性（`certainty`）：来源缩进导致范围歧义（`ambiguous-source-indentation`）
        - 取值（`value`）：`acceptance-only-or-unconditional`
    - 按来源描述排列的结果（`orderedResults`）：
      - 第 1 项：
        - 结果效果（`kind=effect`）；操作（`operation`）：增加（`increase`）；作用对象（`target`）：`曹家勢力.all-controlled-cities`
          - 参数（`values`）：
            - 治安（`publicOrder`）：20
            - 范围确定性（`scopeCertainty`）：`ambiguous-outdented-source;acceptance-only-versus-unconditional-not-resolved`
      - 第 2 项：
        - 结果效果（`kind=effect`）；操作（`operation`）：增加（`increase`）；作用对象（`target`）：`曹家勢力.all-controlled-city-soldiers`
          - 参数（`values`）：
            - 气力（`energy`）：20
            - 范围确定性（`scopeCertainty`）：`ambiguous-outdented-source;acceptance-only-versus-unconditional-not-resolved`
      - 第 3 项：
        - 结果效果（`kind=effect`）；操作（`operation`）：增加（`increase`）；作用对象（`target`）：`曹家勢力.subordinates-with-漢室無視`
          - 参数（`values`）：
            - 忠诚（`loyalty`）：20
            - 范围确定性（`scopeCertainty`）：`ambiguous-outdented-source;acceptance-only-versus-unconditional-not-resolved`
      - 第 4 项：
        - 结果效果（`kind=effect`）；操作（`operation`）：减少（`decrease`）；作用对象（`target`）：`曹家勢力.subordinates-with-漢室重視`
          - 参数（`values`）：
            - 忠诚（`loyalty`）：20
            - 范围确定性（`scopeCertainty`）：`ambiguous-outdented-source;acceptance-only-versus-unconditional-not-resolved`
      - 第 5 项：
        - 结果效果（`kind=effect`）；操作（`operation`）：降低友好度（`decrease-friendship`）；作用对象（`target`）：`曹家勢力`
          - 参数（`values`）：
            - 作用对象筛选（`targetSelector`）：
              - 全部成立（`all`）（节点种类（`kind`））
                - 逻辑：本组各子项均成立；仅表示来源的分组，不引入调度规则
                - 子项（`items`）：
                  - 第 1 项：
                    - 事实条件（`kind=fact`）；类别（`category`）：外交（`diplomacy`）；对象（`subject`）：列表（按来源次序）：`selected-force`、`曹家勢力`；字段（`field`）：处于同盟（`allied`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
                      - 取值（`value`）：否（false）
                  - 第 2 项：
                    - 事实条件（`kind=fact`）；类别（`category`）：外交（`diplomacy`）；对象（`subject`）：列表（按来源次序）：`selected-force`、`曹家勢力`；字段（`field`）：友好度（`friendship`）；比较关系（`operator`）：小于（`lt`）；确定性（`certainty`）：来源明示（`stated`）
                      - 取值（`value`）：`好意`
                  - 第 3 项：
                    - 任一成立（`any`）（节点种类（`kind`））
                      - 逻辑：本组至少一个子项成立；仅表示来源的分组，不引入调度规则
                      - 子项（`items`）：
                        - 第 1 项：
                          - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：`selected-force.ruler`；字段（`field`）：汉室态度（`Han-attitude`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
                            - 取值（`value`）：`重視`
                        - 第 2 项：
                          - 事实条件（`kind=fact`）；类别（`category`）：爵位（`title`）；对象（`subject`）：`selected-force.ruler`；字段（`field`）：爵位（`rank-title`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
                            - 取值（`value`）：`皇帝`
                        - 第 3 项：
                          - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：`selected-force.ruler`；字段（`field`）：与指定人物有血缘关系（`blood-related-to`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
                            - 取值（`value`）：`劉備`
            - 变化幅度（`magnitude`）：未说明（`not-stated`）
            - 方向（`direction`）：未说明（`not-stated`）
            - 范围确定性（`scopeCertainty`）：`ambiguous-outdented-source;acceptance-only-versus-unconditional-not-resolved`

### 不确定性与来源限定（`uncertainties`）

- 第 1 项：The source outdents the public-order, energy, loyalty, and diplomacy effects after the acceptance branch. Their scope is ambiguous and is deliberately not resolved into unconditional or acceptance-only behavior. No refusal result is described.

<a id="atwiki-88-37"></a>

## 观察 37：蜀帝即位

- 事件标识（`eventId`）：`shu-emperor-accession`
- 观察标识（`observationId`）：`atwiki-88-37`
- 原文标题（`title`）：`蜀帝即位`
- 来源标识（`sourceId`）：`atwiki-88`
- 来源网址（`sourceURL`）：[https://w.atwiki.jp/sangokushi11/pages/88.html](https://w.atwiki.jp/sangokushi11/pages/88.html)
- 来源章节（`sourceSection`）：`蜀帝即位`
- 来源节序（`sourceOrdinal`）：37
- 来源行定位（`sourceLocator`）：
  - 起始行（`startLine`）：762
  - 结束行（`endLine`）：799
- 版本范围（`version`）：
  - 游戏（`game`）：`SAN11`
  - 版本类型（`edition`）：未指定（`unspecified`）
  - 平台（`platform`）：未指定（`unspecified`）
  - 补丁（`patch`）：未指定（`unspecified`）
- 证据性质（`evidence`）：公开攻略转录（`public-guide-transcription`）
- 仅发生一次信息（`onceOnly`）：
  - 状态（`status`）：未说明（`not-stated`）
  - 标志标识（`flagId`）：未提供（null）

### 触发条件（`conditions`）

- 第 1 项：
  - 事实条件（`kind=fact`）；类别（`category`）：日期（`date`）；对象（`subject`）：`event`；字段（`field`）：提前日期条款（`accelerated-date-clause`）；比较关系（`operator`）：未解决（`unresolved`）；确定性（`certainty`）：来源有歧义（`source-ambiguous`）
    - 取值（`value`）：
      - 基准条件（`baselineConditions`）：
        - 全部成立（`all`）（节点种类（`kind`））
          - 逻辑：本组各子项均成立；仅表示来源的分组，不引入调度规则
          - 子项（`items`）：
            - 第 1 项：
              - 事实条件（`kind=fact`）；类别（`category`）：日期（`date`）；对象（`subject`）：剧本（`scenario`）；字段（`field`）：剧本开始年月（`start-month`）；比较关系（`operator`）：小于或等于（`lte`）；确定性（`certainty`）：来源明示（`stated`）
                - 取值（`value`）：列表（按来源次序）：220、12
            - 第 2 项：
              - 事实条件（`kind=fact`）；类别（`category`）：日期（`date`）；对象（`subject`）：剧本（`scenario`）；字段（`field`）：剧本经过日数（`elapsed-days`）；比较关系（`operator`）：大于或等于（`gte`）；确定性（`certainty`）：来源明示（`stated`）
                - 取值（`value`）：180
      - 可能提前日期的事件（`accelerationEvent`）：`wei-emperor-accession`
      - 提前日期的适用情形（`accelerationWhen`）：`event-already-occurred`
      - 受影响的基准条件（`affectedBaselinePredicates`）：未说明（`not-stated`）
      - 替代条件（`replacementConditions`）：未说明（`not-stated`）
- 第 2 项：
  - 事实条件（`kind=fact`）；类别（`category`）：皇帝（`emperor`）；对象（`subject`）：`later-han-emperor`；字段（`field`）：存在（`exists`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：否（false）
- 第 3 项：
  - 任一成立（`any`）（节点种类（`kind`））
    - 逻辑：本组至少一个子项成立；仅表示来源的分组，不引入调度规则
    - 子项（`items`）：
      - 第 1 项：
        - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`劉家勢力`；字段（`field`）：君主（`ruler`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
          - 取值（`value`）：`劉備`
      - 第 2 项：
        - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：`劉家勢力.ruler`；字段（`field`）：与指定人物有血缘关系（`blood-related-to`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
          - 取值（`value`）：`劉備`
- 第 4 项：
  - 事实条件（`kind=fact`）；类别（`category`）：爵位（`title`）；对象（`subject`）：`劉家勢力.ruler`；字段（`field`）：爵位（`rank-title`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：`皇帝`
- 第 5 项：
  - 事实条件（`kind=fact`）；类别（`category`）：城市（`city`）；对象（`subject`）：`劉家勢力`；字段（`field`）：持有城市（`cities`）；比较关系（`operator`）：包含全部（`contains-all`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：`永安`、`漢中`、`梓潼`、`江州`、`成都`
- 第 6 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`劉家勢力`；字段（`field`）：武将列表（`officers`）；比较关系（`operator`）：包含全部（`contains-all`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：`諸葛亮`
- 第 7 项：
  - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：`曹家勢力.ruler`；字段（`field`）：与指定人物有血缘关系（`blood-related-to`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：`曹操`
- 第 8 项：
  - 事实条件（`kind=fact`）；类别（`category`）：爵位（`title`）；对象（`subject`）：`曹家勢力.ruler`；字段（`field`）：爵位（`rank-title`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：`皇帝`
- 第 9 项：
  - 事实条件（`kind=fact`）；类别（`category`）：城市（`city`）；对象（`subject`）：`曹家勢力`；字段（`field`）：持有城市（`cities`）；比较关系（`operator`）：包含全部（`contains-all`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：`洛陽`、`鄴`
- 第 10 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`曹家勢力`；字段（`field`）：城市数（`city-count`）；比较关系（`operator`）：大于或等于（`gte`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：8
- 第 11 项：
  - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：列表（按来源次序）：`劉家勢力.ruler`、`曹家勢力.ruler`；字段（`field`）：有缘关系（`associated-relationship`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：否（false）
- 第 12 项：
  - 事实条件（`kind=fact`）；类别（`category`）：外交（`diplomacy`）；对象（`subject`）：列表（按来源次序）：`劉家勢力`、`曹家勢力`；字段（`field`）：友好度（`friendship`）；比较关系（`operator`）：小于（`lt`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：`好意`
- 第 13 项：
  - 事实条件（`kind=fact`）；类别（`category`）：任务或行动（`mission`）；对象（`subject`）：列表（按来源次序）：`劉家勢力.ruler`、`諸葛亮`；字段（`field`）：正在执行任务（`on-mission`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：否（false）
- 第 14 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`COM-forces`；字段（`field`）：国号（`country-name`）；比较关系（`operator`）：全部不包含（`contains-none`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：`蜀`

### 前置事件关系（`prerequisites`）

- 第 1 项：
  - 事件标识（`eventId`）：`wei-emperor-accession`
  - 前置要求（`requirement`）：可能提前日期（`may-accelerate`）
  - 间隔（`delay`）：未提供（null）

### 结果与分支（仅来源描述顺序）（`orderedResults`）

- 第 1 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：设为（`set`）；作用对象（`target`）：`劉家勢力.ruler`
    - 参数（`values`）：
      - 爵位（`rankTitle`）：`皇帝`
- 第 2 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：设为（`set`）；作用对象（`target`）：`劉家勢力`
    - 参数（`values`）：
      - 国号（`countryName`）：`蜀`
- 第 3 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：增加（`increase`）；作用对象（`target`）：`劉家勢力.all-controlled-cities`
    - 参数（`values`）：
      - 治安（`publicOrder`）：30
- 第 4 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：增加（`increase`）；作用对象（`target`）：`劉家勢力.all-controlled-city-soldiers`
    - 参数（`values`）：
      - 气力（`energy`）：30
- 第 5 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：增加（`increase`）；作用对象（`target`）：`劉家勢力.all-subordinate-officers`
    - 参数（`values`）：
      - 忠诚（`loyalty`）：30
- 第 6 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：降低友好度（`decrease-friendship`）；作用对象（`target`）：`劉家勢力`
    - 参数（`values`）：
      - 作用对象筛选（`targetSelector`）：
        - 全部成立（`all`）（节点种类（`kind`））
          - 逻辑：本组各子项均成立；仅表示来源的分组，不引入调度规则
          - 子项（`items`）：
            - 第 1 项：
              - 事实条件（`kind=fact`）；类别（`category`）：外交（`diplomacy`）；对象（`subject`）：列表（按来源次序）：`selected-force`、`劉家勢力`；字段（`field`）：处于同盟（`allied`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
                - 取值（`value`）：否（false）
            - 第 2 项：
              - 事实条件（`kind=fact`）；类别（`category`）：外交（`diplomacy`）；对象（`subject`）：列表（按来源次序）：`selected-force`、`劉家勢力`；字段（`field`）：友好度（`friendship`）；比较关系（`operator`）：小于（`lt`）；确定性（`certainty`）：来源明示（`stated`）
                - 取值（`value`）：`好意`
            - 第 3 项：
              - 任一成立（`any`）（节点种类（`kind`））
                - 逻辑：本组至少一个子项成立；仅表示来源的分组，不引入调度规则
                - 子项（`items`）：
                  - 第 1 项：
                    - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`selected-force`；字段（`field`）：君主（`ruler`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
                      - 取值（`value`）：`曹操`
                  - 第 2 项：
                    - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：`selected-force.ruler`；字段（`field`）：与指定人物有血缘关系（`blood-related-to`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
                      - 取值（`value`）：`曹操`
                  - 第 3 项：
                    - 事实条件（`kind=fact`）；类别（`category`）：爵位（`title`）；对象（`subject`）：`selected-force.ruler`；字段（`field`）：爵位（`rank-title`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
                      - 取值（`value`）：`皇帝`
      - 变化幅度（`magnitude`）：未说明（`not-stated`）
      - 方向（`direction`）：未说明（`not-stated`）

### 不确定性与来源限定（`uncertainties`）

- 第 1 项：The condition explicitly says the Liu-family ruler already has 皇帝 rank, then repeats 皇帝 as a result; this is preserved rather than corrected. The starred start-date and elapsed-time conditions can be earlier after 魏帝即位, but replacement values are not stated.

<a id="atwiki-88-38"></a>

## 观察 38：虎の子（張苞・関興義兄弟の契り）

- 事件标识（`eventId`）：`sons-of-tigers-oath`
- 观察标识（`observationId`）：`atwiki-88-38`
- 原文标题（`title`）：`虎の子（張苞・関興義兄弟の契り）`
- 来源标识（`sourceId`）：`atwiki-88`
- 来源网址（`sourceURL`）：[https://w.atwiki.jp/sangokushi11/pages/88.html](https://w.atwiki.jp/sangokushi11/pages/88.html)
- 来源章节（`sourceSection`）：`虎の子（張苞・関興義兄弟の契り）`
- 来源节序（`sourceOrdinal`）：38
- 来源行定位（`sourceLocator`）：
  - 起始行（`startLine`）：800
  - 结束行（`endLine`）：818
- 版本范围（`version`）：
  - 游戏（`game`）：`SAN11`
  - 版本类型（`edition`）：未指定（`unspecified`）
  - 平台（`platform`）：未指定（`unspecified`）
  - 补丁（`patch`）：未指定（`unspecified`）
- 证据性质（`evidence`）：公开攻略转录（`public-guide-transcription`）
- 仅发生一次信息（`onceOnly`）：
  - 状态（`status`）：未说明（`not-stated`）
  - 标志标识（`flagId`）：未提供（null）

### 触发条件（`conditions`）

- 第 1 项：
  - 任一成立（`any`）（节点种类（`kind`））
    - 逻辑：本组至少一个子项成立；仅表示来源的分组，不引入调度规则
    - 子项（`items`）：
      - 第 1 项：
        - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`劉家勢力`；字段（`field`）：君主（`ruler`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
          - 取值（`value`）：`劉備`
      - 第 2 项：
        - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：`劉家勢力.ruler`；字段（`field`）：与指定人物有血缘关系（`blood-related-to`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
          - 取值（`value`）：`劉備`
- 第 2 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`劉家勢力`；字段（`field`）：武将列表（`officers`）；比较关系（`operator`）：包含全部（`contains-all`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：`張苞`、`関興`
- 第 3 项：
  - 条件后果（`if`）（节点种类（`kind`））
    - 分支条件（`condition`）：
      - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`劉家勢力`；字段（`field`）：控制方（`controller`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
        - 取值（`value`）：`player`
    - 条件成立时的后果（`consequence`）：
      - 全部成立（`all`）（节点种类（`kind`））
        - 逻辑：本组各子项均成立；仅表示来源的分组，不引入调度规则
        - 子项（`items`）：
          - 第 1 项：
            - 事实条件（`kind=fact`）；类别（`category`）：城市（`city`）；对象（`subject`）：列表（按来源次序）：`張苞`、`関興`；字段（`field`）：所属据点（`assigned-base`）；比较关系（`operator`）：全部相同（`all-equal`）；确定性（`certainty`）：来源明示（`stated`）
              - 取值（`value`）：是（true）
- 第 4 项：
  - 任一成立（`any`）（节点种类（`kind`））
    - 逻辑：本组至少一个子项成立；仅表示来源的分组，不引入调度规则
    - 子项（`items`）：
      - 第 1 项：
        - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：列表（按来源次序）：`張苞`、`関興`；字段（`field`）：功绩（`merit`）；比较关系（`operator`）：大于或等于（`gte`）；确定性（`certainty`）：来源明示（`stated`）
          - 取值（`value`）：8000
      - 第 2 项：
        - 全部成立（`all`）（节点种类（`kind`））
          - 逻辑：本组各子项均成立；仅表示来源的分组，不引入调度规则
          - 子项（`items`）：
            - 第 1 项：
              - 事实条件（`kind=fact`）；类别（`category`）：游戏设置（`settings`）；对象（`subject`）：`game`；字段（`field`）：平台（`platform`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
                - 取值（`value`）：`console`
            - 第 2 项：
              - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：列表（按来源次序）：`張苞`、`関興`；字段（`field`）：功绩（`merit`）；比较关系（`operator`）：大于或等于（`gte`）；确定性（`certainty`）：暂定，来源以疑问表述（`tentative-source-question`）
                - 取值（`value`）：3000
- 第 5 项：
  - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：列表（按来源次序）：`張苞`、`関興`；字段（`field`）：义兄弟（`sworn-siblings`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：空列表（0 项）
- 第 6 项：
  - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：列表（按来源次序）：`張苞`、`関興`；字段（`field`）：与指定人物有血缘关系（`blood-related-to`）；比较关系（`operator`）：不等于（`neq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：`劉家勢力.ruler`
- 第 7 项：
  - 事实条件（`kind=fact`）；类别（`category`）：任务或行动（`mission`）；对象（`subject`）：列表（按来源次序）：`劉家勢力.ruler`、`張苞`、`関興`；字段（`field`）：正在执行任务（`on-mission`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：否（false）

### 前置事件关系（`prerequisites`）

- 空列表（0 项）

### 结果与分支（仅来源描述顺序）（`orderedResults`）

- 第 1 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：义兄弟关系（`sworn-siblings`）；作用对象（`target`）：列表（按来源次序）：`張苞`、`関興`
    - 参数（`values`）：空属性集（0 项）
- 第 2 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：设为（`set`）；作用对象（`target`）：列表（按来源次序）：`張苞`、`関興`
    - 参数（`values`）：
      - 忠诚（`loyalty`）：100
- 第 3 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：增加（`increase`）；作用对象（`target`）：列表（按来源次序）：`張苞`、`関興`
    - 参数（`values`）：
      - 功绩（`merit`）：500

### 不确定性与来源限定（`uncertainties`）

- 第 1 项：The guide gives merit >= 8000 and a tentative parenthesis that console versions may use >= 3000. The latter is a qualified possible replacement, not a confirmed additional requirement or a proven universal threshold.

<a id="atwiki-88-39"></a>

## 观察 39：呉王即位

- 事件标识（`eventId`）：`wu-king-accession`
- 观察标识（`observationId`）：`atwiki-88-39`
- 原文标题（`title`）：`呉王即位`
- 来源标识（`sourceId`）：`atwiki-88`
- 来源网址（`sourceURL`）：[https://w.atwiki.jp/sangokushi11/pages/88.html](https://w.atwiki.jp/sangokushi11/pages/88.html)
- 来源章节（`sourceSection`）：`呉王即位`
- 来源节序（`sourceOrdinal`）：39
- 来源行定位（`sourceLocator`）：
  - 起始行（`startLine`）：819
  - 结束行（`endLine`）：857
- 版本范围（`version`）：
  - 游戏（`game`）：`SAN11`
  - 版本类型（`edition`）：未指定（`unspecified`）
  - 平台（`platform`）：未指定（`unspecified`）
  - 补丁（`patch`）：未指定（`unspecified`）
- 证据性质（`evidence`）：公开攻略转录（`public-guide-transcription`）
- 仅发生一次信息（`onceOnly`）：
  - 状态（`status`）：未说明（`not-stated`）
  - 标志标识（`flagId`）：未提供（null）

### 触发条件（`conditions`）

- 第 1 项：
  - 事实条件（`kind=fact`）；类别（`category`）：日期（`date`）；对象（`subject`）：剧本（`scenario`）；字段（`field`）：剧本开始年月（`start-month`）；比较关系（`operator`）：小于或等于（`lte`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：221、12
- 第 2 项：
  - 事实条件（`kind=fact`）；类别（`category`）：日期（`date`）；对象（`subject`）：剧本（`scenario`）；字段（`field`）：剧本经过日数（`elapsed-days`）；比较关系（`operator`）：大于或等于（`gte`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：180
- 第 3 项：
  - 条件后果（`if`）（节点种类（`kind`））
    - 分支条件（`condition`）：
      - 事实条件（`kind=fact`）；类别（`category`）：前置事件（`prerequisite`）；对象（`subject`）：`wei-emperor-accession`；字段（`field`）：已发生（`occurred`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
        - 取值（`value`）：是（true）
    - 条件成立时的后果（`consequence`）：
      - 全部成立（`all`）（节点种类（`kind`））
        - 逻辑：本组各子项均成立；仅表示来源的分组，不引入调度规则
        - 子项（`items`）：
          - 第 1 项：
            - 事实条件（`kind=fact`）；类别（`category`）：前置事件（`prerequisite`）；对象（`subject`）：`wei-emperor-accession`；字段（`field`）：事件发生后经过时间（`time-since-occurrence`）；比较关系（`operator`）：大于或等于（`gte`）；确定性（`certainty`）：来源明示（`stated`）
              - 取值（`value`）：
                - 取值（`value`）：180
                - 单位（`unit`）：日（`days`）
- 第 4 项：
  - 事实条件（`kind=fact`）；类别（`category`）：皇帝（`emperor`）；对象（`subject`）：`later-han-emperor`；字段（`field`）：存在（`exists`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：否（false）
- 第 5 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`world`；字段（`field`）：势力数（`force-count`）；比较关系（`operator`）：大于或等于（`gte`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：3
- 第 6 项：
  - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：`孫呉勢力.ruler`；字段（`field`）：与指定人物有血缘关系（`blood-related-to`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：`孫堅`
- 第 7 项：
  - 事实条件（`kind=fact`）；类别（`category`）：爵位（`title`）；对象（`subject`）：`孫呉勢力.ruler`；字段（`field`）：爵位（`rank-title`）；比较关系（`operator`）：不属于（`not-in`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：`皇帝`、`王`
- 第 8 项：
  - 事实条件（`kind=fact`）；类别（`category`）：城市（`city`）；对象（`subject`）：`孫呉勢力`；字段（`field`）：持有城市（`cities`）；比较关系（`operator`）：包含全部（`contains-all`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：`建業`、`呉`、`会稽`、`廬江`、`柴桑`
- 第 9 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`孫呉勢力`；字段（`field`）：城市数（`city-count`）；比较关系（`operator`）：大于或等于（`gte`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：8
- 第 10 项：
  - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：`曹家勢力.ruler`；字段（`field`）：与指定人物有血缘关系（`blood-related-to`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：`曹操`
- 第 11 项：
  - 事实条件（`kind=fact`）；类别（`category`）：爵位（`title`）；对象（`subject`）：`曹家勢力.ruler`；字段（`field`）：爵位（`rank-title`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：`皇帝`
- 第 12 项：
  - 事实条件（`kind=fact`）；类别（`category`）：城市（`city`）；对象（`subject`）：`曹家勢力`；字段（`field`）：持有城市（`cities`）；比较关系（`operator`）：包含全部（`contains-all`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：`洛陽`、`鄴`
- 第 13 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`曹家勢力`；字段（`field`）：城市数（`city-count`）；比较关系（`operator`）：大于或等于（`gte`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：8
- 第 14 项：
  - 事实条件（`kind=fact`）；类别（`category`）：外交（`diplomacy`）；对象（`subject`）：列表（按来源次序）：`孫呉勢力`、`曹家勢力`；字段（`field`）：友好度（`friendship`）；比较关系（`operator`）：大于或等于（`gte`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：`不和`
- 第 15 项：
  - 事实条件（`kind=fact`）；类别（`category`）：任务或行动（`mission`）；对象（`subject`）：列表（按来源次序）：`孫呉勢力.ruler`；字段（`field`）：正在执行任务（`on-mission`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：否（false）

### 前置事件关系（`prerequisites`）

- 第 1 项：
  - 事件标识（`eventId`）：`wei-emperor-accession`
  - 前置要求（`requirement`）：若已经发生则要求（`required-if-occurred`）
  - 间隔（`delay`）：
    - 比较关系（`operator`）：大于或等于（`gte`）
    - 取值（`value`）：180
    - 单位（`unit`）：日（`days`）

### 结果与分支（仅来源描述顺序）（`orderedResults`）

- 第 1 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：设为（`set`）；作用对象（`target`）：`孫呉勢力.ruler`
    - 参数（`values`）：
      - 爵位（`rankTitle`）：`王`
- 第 2 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：增加（`increase`）；作用对象（`target`）：`孫呉勢力.all-controlled-cities`
    - 参数（`values`）：
      - 治安（`publicOrder`）：10
- 第 3 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：增加（`increase`）；作用对象（`target`）：`孫呉勢力.all-controlled-city-soldiers`
    - 参数（`values`）：
      - 气力（`energy`）：10
- 第 4 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：增加（`increase`）；作用对象（`target`）：`孫呉勢力.all-subordinate-officers`
    - 参数（`values`）：
      - 忠诚（`loyalty`）：10
- 第 5 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：提高友好度（`increase-friendship`）；作用对象（`target`）：列表（按来源次序）：`孫呉勢力`、`曹家勢力`
    - 参数（`values`）：
      - 变化幅度（`magnitude`）：未说明（`not-stated`）
- 第 6 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：降低友好度（`decrease-friendship`）；作用对象（`target`）：`孫呉勢力`
    - 参数（`values`）：
      - 作用对象筛选（`targetSelector`）：
        - 全部成立（`all`）（节点种类（`kind`））
          - 逻辑：本组各子项均成立；仅表示来源的分组，不引入调度规则
          - 子项（`items`）：
            - 第 1 项：
              - 事实条件（`kind=fact`）；类别（`category`）：外交（`diplomacy`）；对象（`subject`）：列表（按来源次序）：`selected-force`、`孫呉勢力`；字段（`field`）：处于同盟（`allied`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
                - 取值（`value`）：否（false）
            - 第 2 项：
              - 事实条件（`kind=fact`）；类别（`category`）：外交（`diplomacy`）；对象（`subject`）：列表（按来源次序）：`selected-force`、`孫呉勢力`；字段（`field`）：友好度（`friendship`）；比较关系（`operator`）：小于（`lt`）；确定性（`certainty`）：来源明示（`stated`）
                - 取值（`value`）：`好意`
            - 第 3 项：
              - 任一成立（`any`）（节点种类（`kind`））
                - 逻辑：本组至少一个子项成立；仅表示来源的分组，不引入调度规则
                - 子项（`items`）：
                  - 第 1 项：
                    - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`selected-force`；字段（`field`）：君主（`ruler`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
                      - 取值（`value`）：`劉備`
                  - 第 2 项：
                    - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：`selected-force.ruler`；字段（`field`）：与指定人物有血缘关系（`blood-related-to`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
                      - 取值（`value`）：`劉備`
                  - 第 3 项：
                    - 全部成立（`all`）（节点种类（`kind`））
                      - 逻辑：本组各子项均成立；仅表示来源的分组，不引入调度规则
                      - 子项（`items`）：
                        - 第 1 项：
                          - 事实条件（`kind=fact`）；类别（`category`）：爵位（`title`）；对象（`subject`）：`selected-force.ruler`；字段（`field`）：爵位（`rank-title`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
                            - 取值（`value`）：`皇帝`
                        - 第 2 项：
                          - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`selected-force`；字段（`field`）：身份（`identity`）；比较关系（`operator`）：不等于（`neq`）；确定性（`certainty`）：来源明示（`stated`）
                            - 取值（`value`）：`曹家勢力`
      - 变化幅度（`magnitude`）：未说明（`not-stated`）
      - 方向（`direction`）：未说明（`not-stated`）

### 不确定性与来源限定（`uncertainties`）

- 第 1 项：The 180-day delay since 魏帝即位 applies only if that event occurred; occurrence itself is not required.

<a id="atwiki-88-40"></a>

## 观察 40：陸遜登場

- 事件标识（`eventId`）：`lu-xun-arrives`
- 观察标识（`observationId`）：`atwiki-88-40`
- 原文标题（`title`）：`陸遜登場`
- 来源标识（`sourceId`）：`atwiki-88`
- 来源网址（`sourceURL`）：[https://w.atwiki.jp/sangokushi11/pages/88.html](https://w.atwiki.jp/sangokushi11/pages/88.html)
- 来源章节（`sourceSection`）：`陸遜登場`
- 来源节序（`sourceOrdinal`）：40
- 来源行定位（`sourceLocator`）：
  - 起始行（`startLine`）：858
  - 结束行（`endLine`）：880
- 版本范围（`version`）：
  - 游戏（`game`）：`SAN11`
  - 版本类型（`edition`）：未指定（`unspecified`）
  - 平台（`platform`）：未指定（`unspecified`）
  - 补丁（`patch`）：未指定（`unspecified`）
- 证据性质（`evidence`）：公开攻略转录（`public-guide-transcription`）
- 仅发生一次信息（`onceOnly`）：
  - 状态（`status`）：未说明（`not-stated`）
  - 标志标识（`flagId`）：未提供（null）

### 触发条件（`conditions`）

- 第 1 项：
  - 事实条件（`kind=fact`）；类别（`category`）：日期（`date`）；对象（`subject`）：剧本（`scenario`）；字段（`field`）：剧本经过日数（`elapsed-days`）；比较关系（`operator`）：大于或等于（`gte`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：30
- 第 2 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`孫権`；字段（`field`）：武将列表（`officers`）；比较关系（`operator`）：包含全部（`contains-all`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：`陸遜`
- 第 3 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`孫権`；字段（`field`）：从属武将数（`subordinate-officer-count`）；比较关系（`operator`）：大于或等于（`gte`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：10
- 第 4 项：
  - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：列表（按来源次序）：`周瑜`、`魯粛`、`呂蒙`；字段（`field`）：存活（`alive`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：否（false）
- 第 5 项：
  - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：`陸遜`；字段（`field`）：忠诚（`loyalty`）；比较关系（`operator`）：大于或等于（`gte`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：95
- 第 6 项：
  - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：`陸遜`；字段（`field`）：功绩（`merit`）；比较关系（`operator`）：介于两值且包含端点（`between-inclusive`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：3000、15000
- 第 7 项：
  - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：`陸遜`；字段（`field`）：状态（`status`）；比较关系（`operator`）：不等于（`neq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：`strategist`
- 第 8 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`world`；字段（`field`）：存在符合条件的势力（`exists-force-matching`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：
      - 全部成立（`all`）（节点种类（`kind`））
        - 逻辑：本组各子项均成立；仅表示来源的分组，不引入调度规则
        - 子项（`items`）：
          - 第 1 项：
            - 事实条件（`kind=fact`）；类别（`category`）：外交（`diplomacy`）；对象（`subject`）：列表（按来源次序）：`selected-force`、`孫権`；字段（`field`）：友好度（`friendship`）；比较关系（`operator`）：小于或等于（`lte`）；确定性（`certainty`）：来源明示（`stated`）
              - 取值（`value`）：`不和`
          - 第 2 项：
            - 事实条件（`kind=fact`）；类别（`category`）：外交（`diplomacy`）；对象（`subject`）：列表（按来源次序）：`selected-force`、`孫権`；字段（`field`）：处于同盟（`allied`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
              - 取值（`value`）：否（false）
          - 第 3 项：
            - 事实条件（`kind=fact`）；类别（`category`）：城市（`city`）；对象（`subject`）：`selected-force`；字段（`field`）：持有与指定对象相邻的城市（`owns-city-adjacent-to`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
              - 取值（`value`）：`孫権`
          - 第 4 项：
            - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`selected-force`；字段（`field`）：城市数（`city-count`）；比较关系（`operator`）：大于或等于（`gte`）；确定性（`certainty`）：来源明示（`stated`）
              - 取值（`value`）：5
- 第 9 项：
  - 事实条件（`kind=fact`）；类别（`category`）：任务或行动（`mission`）；对象（`subject`）：列表（按来源次序）：`孫権`、`陸遜`；字段（`field`）：正在执行任务（`on-mission`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：否（false）

### 前置事件关系（`prerequisites`）

- 空列表（0 项）

### 结果与分支（仅来源描述顺序）（`orderedResults`）

- 第 1 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：迁移（`relocate`）；作用对象（`target`）：`陸遜`
    - 参数（`values`）：
      - 目的地（`destination`）：`孫権.assigned-city`
- 第 2 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：设为（`set`）；作用对象（`target`）：`陸遜`
    - 参数（`values`）：
      - 忠诚（`loyalty`）：100
- 第 3 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：设为（`set`）；作用对象（`target`）：`陸遜`
    - 参数（`values`）：
      - 功绩（`merit`）：12000
- 第 4 项：
  - 分支（`branch`）（节点种类（`kind`））
    - 分支标识（`branchId`）：`kan-ze-subordinate`
    - 分支条件（`condition`）：
      - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`孫権`；字段（`field`）：武将列表（`officers`）；比较关系（`operator`）：包含全部（`contains-all`）；确定性（`certainty`）：来源明示（`stated`）
        - 取值（`value`）：列表（按来源次序）：`闞沢`
    - 按来源描述排列的结果（`orderedResults`）：
      - 第 1 项：
        - 结果效果（`kind=effect`）；操作（`operation`）：增加（`increase`）；作用对象（`target`）：`闞沢`
          - 参数（`values`）：
            - 功绩（`merit`）：300

### 不确定性与来源限定（`uncertainties`）

- 空列表（0 项）

<a id="atwiki-88-41"></a>

## 观察 41：諸葛亮の北伐

- 事件标识（`eventId`）：`zhuge-liang-northern-campaign`
- 观察标识（`observationId`）：`atwiki-88-41`
- 原文标题（`title`）：`諸葛亮の北伐`
- 来源标识（`sourceId`）：`atwiki-88`
- 来源网址（`sourceURL`）：[https://w.atwiki.jp/sangokushi11/pages/88.html](https://w.atwiki.jp/sangokushi11/pages/88.html)
- 来源章节（`sourceSection`）：`諸葛亮の北伐`
- 来源节序（`sourceOrdinal`）：41
- 来源行定位（`sourceLocator`）：
  - 起始行（`startLine`）：881
  - 结束行（`endLine`）：901
- 版本范围（`version`）：
  - 游戏（`game`）：`SAN11`
  - 版本类型（`edition`）：未指定（`unspecified`）
  - 平台（`platform`）：未指定（`unspecified`）
  - 补丁（`patch`）：未指定（`unspecified`）
- 证据性质（`evidence`）：公开攻略转录（`public-guide-transcription`）
- 仅发生一次信息（`onceOnly`）：
  - 状态（`status`）：未说明（`not-stated`）
  - 标志标识（`flagId`）：未提供（null）

### 触发条件（`conditions`）

- 第 1 项：
  - 事实条件（`kind=fact`）；类别（`category`）：日期（`date`）；对象（`subject`）：剧本（`scenario`）；字段（`field`）：剧本经过日数（`elapsed-days`）；比较关系（`operator`）：大于或等于（`gte`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：30
- 第 2 项：
  - 事实条件（`kind=fact`）；类别（`category`）：皇帝（`emperor`）；对象（`subject`）：`later-han-emperor`；字段（`field`）：存在（`exists`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：否（false）
- 第 3 项：
  - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：`劉家勢力.ruler`；字段（`field`）：与指定人物有血缘关系（`blood-related-to`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：`劉備`
- 第 4 项：
  - 事实条件（`kind=fact`）；类别（`category`）：爵位（`title`）；对象（`subject`）：`劉家勢力.ruler`；字段（`field`）：爵位（`rank-title`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：`皇帝`
- 第 5 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`劉家勢力`；字段（`field`）：武将列表（`officers`）；比较关系（`operator`）：包含全部（`contains-all`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：`諸葛亮`
- 第 6 项：
  - 事实条件（`kind=fact`）；类别（`category`）：城市（`city`）；对象（`subject`）：`劉家勢力`；字段（`field`）：持有城市（`cities`）；比较关系（`operator`）：包含全部（`contains-all`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：`永案`、`漢中`、`梓潼`、`江州`、`成都`、`建寧`、`雲南`
- 第 7 项：
  - 事实条件（`kind=fact`）；类别（`category`）：城市（`city`）；对象（`subject`）：列表（按来源次序）：`成都`、`漢中`；字段（`field`）：治安（`public-order`）；比较关系（`operator`）：大于或等于（`gte`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：95
- 第 8 项：
  - 事实条件（`kind=fact`）；类别（`category`）：爵位（`title`）；对象（`subject`）：`force-A.ruler`；字段（`field`）：爵位（`rank-title`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：`皇帝`
- 第 9 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`force-A`；字段（`field`）：城市数（`city-count`）；比较关系（`operator`）：大于（`gt`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：
      - 参考依据（`reference`）：`劉家勢力.city-count`
- 第 10 项：
  - 事实条件（`kind=fact`）；类别（`category`）：城市（`city`）；对象（`subject`）：`force-A`；字段（`field`）：持有城市（`cities`）；比较关系（`operator`）：包含全部（`contains-all`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：`洛陽`、`許昌`、`鄴`
- 第 11 项：
  - 事实条件（`kind=fact`）；类别（`category`）：外交（`diplomacy`）；对象（`subject`）：列表（按来源次序）：`劉家勢力`、`force-A`；字段（`field`）：处于同盟（`allied`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：否（false）
- 第 12 项：
  - 事实条件（`kind=fact`）；类别（`category`）：外交（`diplomacy`）；对象（`subject`）：列表（按来源次序）：`劉家勢力`、`force-A`；字段（`field`）：友好度（`friendship`）；比较关系（`operator`）：小于（`lt`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：`好意`
- 第 13 项：
  - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：列表（按来源次序）：`劉家勢力.ruler`、`force-A.ruler`；字段（`field`）：有缘关系（`associated-relationship`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：否（false）
- 第 14 项：
  - 事实条件（`kind=fact`）；类别（`category`）：日期（`date`）；对象（`subject`）：`諸葛亮`；字段（`field`）：已到预定死亡年（`scheduled-death-year-reached`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：否（false）
- 第 15 项：
  - 事实条件（`kind=fact`）；类别（`category`）：日期（`date`）；对象（`subject`）：`諸葛亮`；字段（`field`）：预定死亡年（`scheduled-death-year`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：234
- 第 16 项：
  - 事实条件（`kind=fact`）；类别（`category`）：任务或行动（`mission`）；对象（`subject`）：列表（按来源次序）：`劉家勢力.ruler`、`諸葛亮`；字段（`field`）：正在执行任务（`on-mission`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：否（false）

### 前置事件关系（`prerequisites`）

- 空列表（0 项）

### 结果与分支（仅来源描述顺序）（`orderedResults`）

- 第 1 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：设为（`set`）；作用对象（`target`）：列表（按来源次序）：`劉家勢力`、`force-A`
    - 参数（`values`）：
      - 友好度（`friendship`）：`険悪`
- 第 2 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：增加（`increase`）；作用对象（`target`）：`劉家勢力.subordinate-officers`
    - 参数（`values`）：
      - 忠诚（`loyalty`）：10

### 不确定性与来源限定（`uncertainties`）

- 第 1 项：Source city spelling 永案 is retained, not silently changed to 永安. Force A is described as an opposing force.

<a id="atwiki-88-42"></a>

## 观察 42：呉帝即位

- 事件标识（`eventId`）：`wu-emperor-accession`
- 观察标识（`observationId`）：`atwiki-88-42`
- 原文标题（`title`）：`呉帝即位`
- 来源标识（`sourceId`）：`atwiki-88`
- 来源网址（`sourceURL`）：[https://w.atwiki.jp/sangokushi11/pages/88.html](https://w.atwiki.jp/sangokushi11/pages/88.html)
- 来源章节（`sourceSection`）：`呉帝即位`
- 来源节序（`sourceOrdinal`）：42
- 来源行定位（`sourceLocator`）：
  - 起始行（`startLine`）：902
  - 结束行（`endLine`）：928
- 版本范围（`version`）：
  - 游戏（`game`）：`SAN11`
  - 版本类型（`edition`）：未指定（`unspecified`）
  - 平台（`platform`）：未指定（`unspecified`）
  - 补丁（`patch`）：未指定（`unspecified`）
- 证据性质（`evidence`）：公开攻略转录（`public-guide-transcription`）
- 仅发生一次信息（`onceOnly`）：
  - 状态（`status`）：未说明（`not-stated`）
  - 标志标识（`flagId`）：未提供（null）

### 触发条件（`conditions`）

- 第 1 项：
  - 事实条件（`kind=fact`）；类别（`category`）：日期（`date`）；对象（`subject`）：剧本（`scenario`）；字段（`field`）：剧本开始年月（`start-month`）；比较关系（`operator`）：小于或等于（`lte`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：228、12
- 第 2 项：
  - 事实条件（`kind=fact`）；类别（`category`）：日期（`date`）；对象（`subject`）：剧本（`scenario`）；字段（`field`）：剧本经过日数（`elapsed-days`）；比较关系（`operator`）：大于或等于（`gte`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：180
- 第 3 项：
  - 条件后果（`if`）（节点种类（`kind`））
    - 分支条件（`condition`）：
      - 事实条件（`kind=fact`）；类别（`category`）：前置事件（`prerequisite`）；对象（`subject`）：`wu-king-accession`；字段（`field`）：已发生（`occurred`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
        - 取值（`value`）：是（true）
    - 条件成立时的后果（`consequence`）：
      - 全部成立（`all`）（节点种类（`kind`））
        - 逻辑：本组各子项均成立；仅表示来源的分组，不引入调度规则
        - 子项（`items`）：
          - 第 1 项：
            - 事实条件（`kind=fact`）；类别（`category`）：前置事件（`prerequisite`）；对象（`subject`）：`wu-king-accession`；字段（`field`）：事件发生后经过时间（`time-since-occurrence`）；比较关系（`operator`）：大于或等于（`gte`）；确定性（`certainty`）：来源明示（`stated`）
              - 取值（`value`）：
                - 取值（`value`）：360
                - 单位（`unit`）：日（`days`）
- 第 4 项：
  - 事实条件（`kind=fact`）；类别（`category`）：皇帝（`emperor`）；对象（`subject`）：`later-han-emperor`；字段（`field`）：存在（`exists`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：否（false）
- 第 5 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`world`；字段（`field`）：君主为皇帝的势力数（`forces-with-emperor-ruler-count`）；比较关系（`operator`）：大于或等于（`gte`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：2
- 第 6 项：
  - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：`孫呉勢力.ruler`；字段（`field`）：与指定人物有血缘关系（`blood-related-to`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：`孫堅`
- 第 7 项：
  - 事实条件（`kind=fact`）；类别（`category`）：爵位（`title`）；对象（`subject`）：`孫呉勢力.ruler`；字段（`field`）：爵位（`rank-title`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：`王`
- 第 8 项：
  - 事实条件（`kind=fact`）；类别（`category`）：城市（`city`）；对象（`subject`）：`孫呉勢力`；字段（`field`）：持有城市（`cities`）；比较关系（`operator`）：包含全部（`contains-all`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：`建業`、`呉`、`会稽`、`廬江`、`柴桑`
- 第 9 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`孫呉勢力`；字段（`field`）：城市数（`city-count`）；比较关系（`operator`）：大于或等于（`gte`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：8
- 第 10 项：
  - 事实条件（`kind=fact`）；类别（`category`）：任务或行动（`mission`）；对象（`subject`）：列表（按来源次序）：`孫呉勢力.ruler`；字段（`field`）：正在执行任务（`on-mission`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：否（false）
- 第 11 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`COM-forces`；字段（`field`）：国号（`country-name`）；比较关系（`operator`）：全部不包含（`contains-none`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：`呉`

### 前置事件关系（`prerequisites`）

- 第 1 项：
  - 事件标识（`eventId`）：`wu-king-accession`
  - 前置要求（`requirement`）：若已经发生则要求（`required-if-occurred`）
  - 间隔（`delay`）：
    - 比较关系（`operator`）：大于或等于（`gte`）
    - 取值（`value`）：360
    - 单位（`unit`）：日（`days`）

### 结果与分支（仅来源描述顺序）（`orderedResults`）

- 第 1 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：设为（`set`）；作用对象（`target`）：`孫呉勢力.ruler`
    - 参数（`values`）：
      - 爵位（`rankTitle`）：`皇帝`
- 第 2 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：设为（`set`）；作用对象（`target`）：`孫呉勢力`
    - 参数（`values`）：
      - 国号（`countryName`）：`呉`
- 第 3 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：增加（`increase`）；作用对象（`target`）：`孫呉勢力.all-controlled-cities`
    - 参数（`values`）：
      - 治安（`publicOrder`）：20
- 第 4 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：增加（`increase`）；作用对象（`target`）：`孫呉勢力.all-controlled-city-soldiers`
    - 参数（`values`）：
      - 气力（`energy`）：20
- 第 5 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：增加（`increase`）；作用对象（`target`）：`孫呉勢力.all-subordinate-officers`
    - 参数（`values`）：
      - 忠诚（`loyalty`）：20
- 第 6 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：降低友好度（`decrease-friendship`）；作用对象（`target`）：`孫呉勢力`
    - 参数（`values`）：
      - 作用对象筛选（`targetSelector`）：
        - 全部成立（`all`）（节点种类（`kind`））
          - 逻辑：本组各子项均成立；仅表示来源的分组，不引入调度规则
          - 子项（`items`）：
            - 第 1 项：
              - 事实条件（`kind=fact`）；类别（`category`）：外交（`diplomacy`）；对象（`subject`）：列表（按来源次序）：`selected-force`、`孫呉勢力`；字段（`field`）：处于同盟（`allied`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
                - 取值（`value`）：否（false）
            - 第 2 项：
              - 事实条件（`kind=fact`）；类别（`category`）：外交（`diplomacy`）；对象（`subject`）：列表（按来源次序）：`selected-force`、`孫呉勢力`；字段（`field`）：友好度（`friendship`）；比较关系（`operator`）：小于（`lt`）；确定性（`certainty`）：来源明示（`stated`）
                - 取值（`value`）：`好意`
            - 第 3 项：
              - 事实条件（`kind=fact`）；类别（`category`）：爵位（`title`）；对象（`subject`）：`selected-force.ruler`；字段（`field`）：爵位（`rank-title`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
                - 取值（`value`）：`皇帝`
      - 变化幅度（`magnitude`）：未说明（`not-stated`）
      - 方向（`direction`）：未说明（`not-stated`）

### 不确定性与来源限定（`uncertainties`）

- 第 1 项：The 360-day delay since 呉王即位 applies only if that event occurred; occurrence itself is not required.

<a id="atwiki-88-43"></a>

## 观察 43：劉備の死

- 事件标识（`eventId`）：`liu-bei-death`
- 观察标识（`observationId`）：`atwiki-88-43`
- 原文标题（`title`）：`劉備の死`
- 来源标识（`sourceId`）：`atwiki-88`
- 来源网址（`sourceURL`）：[https://w.atwiki.jp/sangokushi11/pages/88.html](https://w.atwiki.jp/sangokushi11/pages/88.html)
- 来源章节（`sourceSection`）：`劉備の死`
- 来源节序（`sourceOrdinal`）：43
- 来源行定位（`sourceLocator`）：
  - 起始行（`startLine`）：929
  - 结束行（`endLine`）：930
- 版本范围（`version`）：
  - 游戏（`game`）：`SAN11`
  - 版本类型（`edition`）：未指定（`unspecified`）
  - 平台（`platform`）：未指定（`unspecified`）
  - 补丁（`patch`）：未指定（`unspecified`）
- 证据性质（`evidence`）：公开攻略转录（`public-guide-transcription`）
- 仅发生一次信息（`onceOnly`）：
  - 状态（`status`）：未说明（`not-stated`）
  - 标志标识（`flagId`）：未提供（null）

### 触发条件（`conditions`）

- 空列表（0 项）

### 前置事件关系（`prerequisites`）

- 空列表（0 项）

### 结果与分支（仅来源描述顺序）（`orderedResults`）

- 第 1 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：未说明（`not-stated`）；作用对象（`target`）：`event`
    - 参数（`values`）：空属性集（0 项）

### 不确定性与来源限定（`uncertainties`）

- 第 1 项：Heading-only section: trigger conditions and results are not stated.

<a id="atwiki-88-44"></a>

## 观察 44：諸葛亮の死

- 事件标识（`eventId`）：`zhuge-liang-death`
- 观察标识（`observationId`）：`atwiki-88-44`
- 原文标题（`title`）：`諸葛亮の死`
- 来源标识（`sourceId`）：`atwiki-88`
- 来源网址（`sourceURL`）：[https://w.atwiki.jp/sangokushi11/pages/88.html](https://w.atwiki.jp/sangokushi11/pages/88.html)
- 来源章节（`sourceSection`）：`諸葛亮の死`
- 来源节序（`sourceOrdinal`）：44
- 来源行定位（`sourceLocator`）：
  - 起始行（`startLine`）：931
  - 结束行（`endLine`）：945
- 版本范围（`version`）：
  - 游戏（`game`）：`SAN11`
  - 版本类型（`edition`）：未指定（`unspecified`）
  - 平台（`platform`）：未指定（`unspecified`）
  - 补丁（`patch`）：未指定（`unspecified`）
- 证据性质（`evidence`）：公开攻略转录（`public-guide-transcription`）
- 仅发生一次信息（`onceOnly`）：
  - 状态（`status`）：未说明（`not-stated`）
  - 标志标识（`flagId`）：未提供（null）

### 触发条件（`conditions`）

- 第 1 项：
  - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：`諸葛亮`；字段（`field`）：自然死亡时间已到（`natural-death-due`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：是（true）
- 第 2 项：
  - 事实条件（`kind=fact`）；类别（`category`）：日期（`date`）；对象（`subject`）：`諸葛亮`；字段（`field`）：预定死亡年（`scheduled-death-year`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：234
- 第 3 项：
  - 事实条件（`kind=fact`）；类别（`category`）：爵位（`title`）；对象（`subject`）：`player-ruler`；字段（`field`）：爵位（`rank-title`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：`皇帝`
- 第 4 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`player-force`；字段（`field`）：武将列表（`officers`）；比较关系（`operator`）：包含全部（`contains-all`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：`諸葛亮`、`姜維`
- 第 5 项：
  - 事实条件（`kind=fact`）；类别（`category`）：任务或行动（`mission`）；对象（`subject`）：列表（按来源次序）：`player-ruler`、`諸葛亮`、`姜維`；字段（`field`）：正在执行任务（`on-mission`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：否（false）
- 第 6 项：
  - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：`諸葛亮`；字段（`field`）：状态（`status`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：`strategist`
- 第 7 项：
  - 事实条件（`kind=fact`）；类别（`category`）：城市（`city`）；对象（`subject`）：`player-force`；字段（`field`）：持有城市（`cities`）；比较关系（`operator`）：包含全部（`contains-all`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：`永安`、`漢中`、`梓潼`、`江州`、`成都`
- 第 8 项：
  - 事实条件（`kind=fact`）；类别（`category`）：城市（`city`）；对象（`subject`）：`player-force`；字段（`field`）：持有城市（`cities`）；比较关系（`operator`）：全部不包含（`contains-none`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：`洛陽`、`許昌`、`鄴`

### 前置事件关系（`prerequisites`）

- 空列表（0 项）

### 结果与分支（仅来源描述顺序）（`orderedResults`）

- 第 1 项：
  - 分支（`branch`）（节点种类（`kind`））
    - 分支标识（`branchId`）：`jiang-wei-lower-merit`
    - 分支条件（`condition`）：
      - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：`諸葛亮`；字段（`field`）：功绩（`merit`）；比较关系（`operator`）：大于（`gt`）；确定性（`certainty`）：来源明示（`stated`）
        - 取值（`value`）：
          - 参考依据（`reference`）：`姜維.merit`
    - 按来源描述排列的结果（`orderedResults`）：
      - 第 1 项：
        - 结果效果（`kind=effect`）；操作（`operation`）：设为（`set`）；作用对象（`target`）：`姜維`
          - 参数（`values`）：
            - 功绩（`merit`）：
              - 参考依据（`reference`）：`諸葛亮.merit`
- 第 2 项：
  - 分支（`branch`）（节点种类（`kind`））
    - 分支标识（`branchId`）：`jiang-wei-not-lower-merit`
    - 分支条件（`condition`）：
      - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：`諸葛亮`；字段（`field`）：功绩（`merit`）；比较关系（`operator`）：小于或等于（`lte`）；确定性（`certainty`）：来源明示（`stated`）
        - 取值（`value`）：
          - 参考依据（`reference`）：`姜維.merit`
    - 按来源描述排列的结果（`orderedResults`）：
      - 第 1 项：
        - 结果效果（`kind=effect`）；操作（`operation`）：增加（`increase`）；作用对象（`target`）：`姜維`
          - 参数（`values`）：
            - 功绩（`merit`）：4000
- 第 3 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：转移物品（`transfer-items`）；作用对象（`target`）：`諸葛亮.items`
    - 参数（`values`）：
      - 新归属（`newOwner`）：`姜維`

### 不确定性与来源限定（`uncertainties`）

- 第 1 项：Natural death is a trigger condition, but the result list does not separately state a death effect. The parenthetical death year is preserved as source metadata, not a derived date window.

<a id="atwiki-88-45"></a>

## 观察 45：魯粛推挙

- 事件标识（`eventId`）：`recommend-lu-su`
- 观察标识（`observationId`）：`atwiki-88-45`
- 原文标题（`title`）：`魯粛推挙`
- 来源标识（`sourceId`）：`atwiki-88`
- 来源网址（`sourceURL`）：[https://w.atwiki.jp/sangokushi11/pages/88.html](https://w.atwiki.jp/sangokushi11/pages/88.html)
- 来源章节（`sourceSection`）：`魯粛推挙`
- 来源节序（`sourceOrdinal`）：45
- 来源行定位（`sourceLocator`）：
  - 起始行（`startLine`）：946
  - 结束行（`endLine`）：954
- 版本范围（`version`）：
  - 游戏（`game`）：`SAN11`
  - 版本类型（`edition`）：未指定（`unspecified`）
  - 平台（`platform`）：未指定（`unspecified`）
  - 补丁（`patch`）：未指定（`unspecified`）
- 证据性质（`evidence`）：公开攻略转录（`public-guide-transcription`）
- 仅发生一次信息（`onceOnly`）：
  - 状态（`status`）：未说明（`not-stated`）
  - 标志标识（`flagId`）：未提供（null）

### 触发条件（`conditions`）

- 第 1 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`player`；字段（`field`）：君主（`ruler`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：`孫策`
- 第 2 项：
  - 事实条件（`kind=fact`）；类别（`category`）：剧本（`scenario`）；对象（`subject`）：剧本（`scenario`）；字段（`field`）：编号（`number`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：3
- 第 3 项：
  - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：列表（按来源次序）：`魯粛`；字段（`field`）：状态（`status`）；比较关系（`operator`）：每一项均属于（`each-in`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：`never-served-free`、`undiscovered`
- 第 4 项：
  - 事实条件（`kind=fact`）；类别（`category`）：任务或行动（`mission`）；对象（`subject`）：列表（按来源次序）：`周瑜`、`孫策`；字段（`field`）：行动已用（`action-used`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：否（false）
- 第 5 项：
  - 事实条件（`kind=fact`）；类别（`category`）：城市（`city`）；对象（`subject`）：列表（按来源次序）：`周瑜`、`孫策`；字段（`field`）：当前所在城市（`current-city`）；比较关系（`operator`）：全部相同（`all-equal`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：是（true）
- 第 6 项：
  - 事实条件（`kind=fact`）；类别（`category`）：日期（`date`）；对象（`subject`）：`calendar`；字段（`field`）：当前年月（`current-month`）；比较关系（`operator`）：变为（`becomes`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：194、7

### 前置事件关系（`prerequisites`）

- 空列表（0 项）

### 结果与分支（仅来源描述顺序）（`orderedResults`）

- 第 1 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：加入势力（`join-force`）；作用对象（`target`）：`魯粛`
    - 参数（`values`）：
      - 势力（`force`）：`player-force`
      - 功绩增量（`meritDelta`）：500

### 不确定性与来源限定（`uncertainties`）

- 第 1 项：Source describes recruitment with 功績+500; it does not explicitly distinguish initial merit 500 from an increment.

<a id="atwiki-88-46"></a>

## 观察 46：諸葛瑾推挙

- 事件标识（`eventId`）：`recommend-zhuge-jin`
- 观察标识（`observationId`）：`atwiki-88-46`
- 原文标题（`title`）：`諸葛瑾推挙`
- 来源标识（`sourceId`）：`atwiki-88`
- 来源网址（`sourceURL`）：[https://w.atwiki.jp/sangokushi11/pages/88.html](https://w.atwiki.jp/sangokushi11/pages/88.html)
- 来源章节（`sourceSection`）：`諸葛瑾推挙`
- 来源节序（`sourceOrdinal`）：46
- 来源行定位（`sourceLocator`）：
  - 起始行（`startLine`）：955
  - 结束行（`endLine`）：963
- 版本范围（`version`）：
  - 游戏（`game`）：`SAN11`
  - 版本类型（`edition`）：未指定（`unspecified`）
  - 平台（`platform`）：未指定（`unspecified`）
  - 补丁（`patch`）：未指定（`unspecified`）
- 证据性质（`evidence`）：公开攻略转录（`public-guide-transcription`）
- 仅发生一次信息（`onceOnly`）：
  - 状态（`status`）：未说明（`not-stated`）
  - 标志标识（`flagId`）：未提供（null）

### 触发条件（`conditions`）

- 第 1 项：
  - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：列表（按来源次序）：`諸葛瑾`；字段（`field`）：状态（`status`）；比较关系（`operator`）：每一项均属于（`each-in`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：`never-served-free`、`undiscovered`
- 第 2 项：
  - 事实条件（`kind=fact`）；类别（`category`）：任务或行动（`mission`）；对象（`subject`）：列表（按来源次序）：`player-ruler`、`魯粛`；字段（`field`）：行动已用（`action-used`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：否（false）
- 第 3 项：
  - 事实条件（`kind=fact`）；类别（`category`）：城市（`city`）；对象（`subject`）：列表（按来源次序）：`player-ruler`、`魯粛`；字段（`field`）：当前所在城市（`current-city`）；比较关系（`operator`）：全部相同（`all-equal`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：是（true）
- 第 4 项：
  - 事实条件（`kind=fact`）；类别（`category`）：日期（`date`）；对象（`subject`）：`calendar`；字段（`field`）：当前年月（`current-month`）；比较关系（`operator`）：变为（`becomes`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：195、1

### 前置事件关系（`prerequisites`）

- 空列表（0 项）

### 结果与分支（仅来源描述顺序）（`orderedResults`）

- 第 1 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：加入势力（`join-force`）；作用对象（`target`）：`諸葛瑾`
    - 参数（`values`）：
      - 势力（`force`）：`player-force`
      - 功绩增量（`meritDelta`）：500

### 不确定性与来源限定（`uncertainties`）

- 第 1 项：The ruler identity, allegiance of 魯粛, and initial-versus-increment merit semantics are not explicitly stated.

<a id="atwiki-88-47"></a>

## 观察 47：顧雍推挙

- 事件标识（`eventId`）：`recommend-gu-yong`
- 观察标识（`observationId`）：`atwiki-88-47`
- 原文标题（`title`）：`顧雍推挙`
- 来源标识（`sourceId`）：`atwiki-88`
- 来源网址（`sourceURL`）：[https://w.atwiki.jp/sangokushi11/pages/88.html](https://w.atwiki.jp/sangokushi11/pages/88.html)
- 来源章节（`sourceSection`）：`顧雍推挙`
- 来源节序（`sourceOrdinal`）：47
- 来源行定位（`sourceLocator`）：
  - 起始行（`startLine`）：964
  - 结束行（`endLine`）：979
- 版本范围（`version`）：
  - 游戏（`game`）：`SAN11`
  - 版本类型（`edition`）：未指定（`unspecified`）
  - 平台（`platform`）：未指定（`unspecified`）
  - 补丁（`patch`）：未指定（`unspecified`）
- 证据性质（`evidence`）：公开攻略转录（`public-guide-transcription`）
- 仅发生一次信息（`onceOnly`）：
  - 状态（`status`）：未说明（`not-stated`）
  - 标志标识（`flagId`）：未提供（null）

### 触发条件（`conditions`）

- 第 1 项：
  - 任一成立（`any`）（节点种类（`kind`））
    - 逻辑：本组至少一个子项成立；仅表示来源的分组，不引入调度规则
    - 子项（`items`）：
      - 第 1 项：
        - 全部成立（`all`）（节点种类（`kind`））
          - 逻辑：本组各子项均成立；仅表示来源的分组，不引入调度规则
          - 子项（`items`）：
            - 第 1 项：
              - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`player`；字段（`field`）：君主（`ruler`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
                - 取值（`value`）：`孫策`
            - 第 2 项：
              - 事实条件（`kind=fact`）；类别（`category`）：剧本（`scenario`）；对象（`subject`）：剧本（`scenario`）；字段（`field`）：编号（`number`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
                - 取值（`value`）：3
            - 第 3 项：
              - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：列表（按来源次序）：`顧雍`；字段（`field`）：状态（`status`）；比较关系（`operator`）：每一项均属于（`each-in`）；确定性（`certainty`）：来源明示（`stated`）
                - 取值（`value`）：列表（按来源次序）：`never-served-free`、`undiscovered`
            - 第 4 项：
              - 事实条件（`kind=fact`）；类别（`category`）：任务或行动（`mission`）；对象（`subject`）：列表（按来源次序）：`孫策`、`張紘`；字段（`field`）：行动已用（`action-used`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
                - 取值（`value`）：否（false）
            - 第 5 项：
              - 事实条件（`kind=fact`）；类别（`category`）：城市（`city`）；对象（`subject`）：列表（按来源次序）：`孫策`、`張紘`；字段（`field`）：当前所在城市（`current-city`）；比较关系（`operator`）：全部相同（`all-equal`）；确定性（`certainty`）：来源明示（`stated`）
                - 取值（`value`）：是（true）
            - 第 6 项：
              - 事实条件（`kind=fact`）；类别（`category`）：城市（`city`）；对象（`subject`）：`player-force`；字段（`field`）：持有城市（`cities`）；比较关系（`operator`）：包含全部（`contains-all`）；确定性（`certainty`）：来源明示（`stated`）
                - 取值（`value`）：列表（按来源次序）：`会稽`
            - 第 7 项：
              - 事实条件（`kind=fact`）；类别（`category`）：日期（`date`）；对象（`subject`）：`calendar`；字段（`field`）：当前年月（`current-month`）；比较关系（`operator`）：变为（`becomes`）；确定性（`certainty`）：来源明示（`stated`）
                - 取值（`value`）：列表（按来源次序）：197、1
      - 第 2 项：
        - 全部成立（`all`）（节点种类（`kind`））
          - 逻辑：本组各子项均成立；仅表示来源的分组，不引入调度规则
          - 子项（`items`）：
            - 第 1 项：
              - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`player`；字段（`field`）：君主（`ruler`）；比较关系（`operator`）：不等于（`neq`）；确定性（`certainty`）：来源明示（`stated`）
                - 取值（`value`）：`孫策`
            - 第 2 项：
              - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：列表（按来源次序）：`顧雍`；字段（`field`）：状态（`status`）；比较关系（`operator`）：每一项均属于（`each-in`）；确定性（`certainty`）：来源明示（`stated`）
                - 取值（`value`）：列表（按来源次序）：`never-served-free`、`undiscovered`
            - 第 3 项：
              - 事实条件（`kind=fact`）；类别（`category`）：任务或行动（`mission`）；对象（`subject`）：列表（按来源次序）：`player-ruler`、`張紘`；字段（`field`）：行动已用（`action-used`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
                - 取值（`value`）：否（false）
            - 第 4 项：
              - 事实条件（`kind=fact`）；类别（`category`）：城市（`city`）；对象（`subject`）：列表（按来源次序）：`player-ruler`、`張紘`；字段（`field`）：当前所在城市（`current-city`）；比较关系（`operator`）：全部相同（`all-equal`）；确定性（`certainty`）：暂定，必要性存疑（`tentative-necessity-questioned`）
                - 取值（`value`）：是（true）
            - 第 5 项：
              - 事实条件（`kind=fact`）；类别（`category`）：日期（`date`）；对象（`subject`）：`calendar`；字段（`field`）：当前年月（`current-month`）；比较关系（`operator`）：变为（`becomes`）；确定性（`certainty`）：来源明示（`stated`）
                - 取值（`value`）：列表（按来源次序）：197、1

### 前置事件关系（`prerequisites`）

- 空列表（0 项）

### 结果与分支（仅来源描述顺序）（`orderedResults`）

- 第 1 项：
  - 分支（`branch`）（节点种类（`kind`））
    - 分支标识（`branchId`）：`sun-ce-force`
    - 分支条件（`condition`）：
      - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`player`；字段（`field`）：君主（`ruler`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
        - 取值（`value`）：`孫策`
    - 按来源描述排列的结果（`orderedResults`）：
      - 第 1 项：
        - 结果效果（`kind=effect`）；操作（`operation`）：加入势力（`join-force`）；作用对象（`target`）：`顧雍`
          - 参数（`values`）：
            - 势力（`force`）：`player-force`
            - 功绩增量（`meritDelta`）：500
- 第 2 项：
  - 分支（`branch`）（节点种类（`kind`））
    - 分支标识（`branchId`）：`other-force`
    - 分支条件（`condition`）：
      - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`player`；字段（`field`）：君主（`ruler`）；比较关系（`operator`）：不等于（`neq`）；确定性（`certainty`）：来源明示（`stated`）
        - 取值（`value`）：`孫策`
    - 按来源描述排列的结果（`orderedResults`）：
      - 第 1 项：
        - 结果效果（`kind=effect`）；操作（`operation`）：加入势力（`join-force`）；作用对象（`target`）：`顧雍`
          - 参数（`values`）：
            - 势力（`force`）：`player-force`
            - 功绩增量（`meritDelta`）：500

### 不确定性与来源限定（`uncertainties`）

- 第 1 项：For non-Sun-Ce forces the source questions whether sharing a city is necessary. Recruitment merit is written 功績+500.

<a id="atwiki-88-48"></a>

## 观察 48：劉子陽推挙

- 事件标识（`eventId`）：`recommend-liu-ye`
- 观察标识（`observationId`）：`atwiki-88-48`
- 原文标题（`title`）：`劉子陽推挙`
- 来源标识（`sourceId`）：`atwiki-88`
- 来源网址（`sourceURL`）：[https://w.atwiki.jp/sangokushi11/pages/88.html](https://w.atwiki.jp/sangokushi11/pages/88.html)
- 来源章节（`sourceSection`）：`劉子陽推挙`
- 来源节序（`sourceOrdinal`）：48
- 来源行定位（`sourceLocator`）：
  - 起始行（`startLine`）：980
  - 结束行（`endLine`）：990
- 版本范围（`version`）：
  - 游戏（`game`）：`SAN11`
  - 版本类型（`edition`）：未指定（`unspecified`）
  - 平台（`platform`）：未指定（`unspecified`）
  - 补丁（`patch`）：未指定（`unspecified`）
- 证据性质（`evidence`）：公开攻略转录（`public-guide-transcription`）
- 仅发生一次信息（`onceOnly`）：
  - 状态（`status`）：未说明（`not-stated`）
  - 标志标识（`flagId`）：未提供（null）

### 触发条件（`conditions`）

- 第 1 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`player`；字段（`field`）：君主（`ruler`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：`曹操`
- 第 2 项：
  - 事实条件（`kind=fact`）；类别（`category`）：剧本（`scenario`）；对象（`subject`）：剧本（`scenario`）；字段（`field`）：编号（`number`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：2
- 第 3 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`player-force`；字段（`field`）：武将列表（`officers`）；比较关系（`operator`）：包含全部（`contains-all`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：`郭嘉`
- 第 4 项：
  - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：列表（按来源次序）：`劉嘩`；字段（`field`）：状态（`status`）；比较关系（`operator`）：每一项均属于（`each-in`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：`never-served-free`、`undiscovered`
- 第 5 项：
  - 事实条件（`kind=fact`）；类别（`category`）：任务或行动（`mission`）；对象（`subject`）：列表（按来源次序）：`曹操`、`郭嘉`；字段（`field`）：行动已用（`action-used`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：否（false）
- 第 6 项：
  - 事实条件（`kind=fact`）；类别（`category`）：城市（`city`）；对象（`subject`）：列表（按来源次序）：`曹操`、`郭嘉`；字段（`field`）：当前所在城市（`current-city`）；比较关系（`operator`）：全部相同（`all-equal`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：是（true）
- 第 7 项：
  - 事实条件（`kind=fact`）；类别（`category`）：城市（`city`）；对象（`subject`）：`shared-city`；字段（`field`）：身份（`identity`）；比较关系（`operator`）：属于（`in`）；确定性（`certainty`）：暂定，限制存疑（`tentative-restriction-questioned`）
    - 取值（`value`）：列表（按来源次序）：`許昌`、`陳留`
- 第 8 项：
  - 事实条件（`kind=fact`）；类别（`category`）：日期（`date`）；对象（`subject`）：`calendar`；字段（`field`）：当前年月（`current-month`）；比较关系（`operator`）：变为（`becomes`）；确定性（`certainty`）：暂定，年份存疑（`tentative-year-questioned`）
    - 取值（`value`）：列表（按来源次序）：194、1

### 前置事件关系（`prerequisites`）

- 空列表（0 项）

### 结果与分支（仅来源描述顺序）（`orderedResults`）

- 第 1 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：加入势力（`join-force`）；作用对象（`target`）：`劉嘩`
    - 参数（`values`）：
      - 势力（`force`）：`player-force`
      - 功绩增量（`meritDelta`）：500

### 不确定性与来源限定（`uncertainties`）

- 第 1 项：The heading names 劉子陽, but the body spells the officer 劉嘩; this mismatch is retained. The city restriction and year 194 are both questioned by the source. Recruitment merit is written 功績+500.

<a id="atwiki-88-49"></a>

## 观察 49：満寵、呂虔推挙

- 事件标识（`eventId`）：`recommend-man-chong-lu-qian`
- 观察标识（`observationId`）：`atwiki-88-49`
- 原文标题（`title`）：`満寵、呂虔推挙`
- 来源标识（`sourceId`）：`atwiki-88`
- 来源网址（`sourceURL`）：[https://w.atwiki.jp/sangokushi11/pages/88.html](https://w.atwiki.jp/sangokushi11/pages/88.html)
- 来源章节（`sourceSection`）：`満寵、呂虔推挙`
- 来源节序（`sourceOrdinal`）：49
- 来源行定位（`sourceLocator`）：
  - 起始行（`startLine`）：991
  - 结束行（`endLine`）：1001
- 版本范围（`version`）：
  - 游戏（`game`）：`SAN11`
  - 版本类型（`edition`）：未指定（`unspecified`）
  - 平台（`platform`）：未指定（`unspecified`）
  - 补丁（`patch`）：未指定（`unspecified`）
- 证据性质（`evidence`）：公开攻略转录（`public-guide-transcription`）
- 仅发生一次信息（`onceOnly`）：
  - 状态（`status`）：未说明（`not-stated`）
  - 标志标识（`flagId`）：未提供（null）

### 触发条件（`conditions`）

- 第 1 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`player-force`；字段（`field`）：武将列表（`officers`）；比较关系（`operator`）：包含全部（`contains-all`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：`劉嘩`
- 第 2 项：
  - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：列表（按来源次序）：`満寵`、`呂虔`；字段（`field`）：状态（`status`）；比较关系（`operator`）：每一项均属于（`each-in`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：`never-served-free`、`undiscovered`
- 第 3 项：
  - 事实条件（`kind=fact`）；类别（`category`）：任务或行动（`mission`）；对象（`subject`）：列表（按来源次序）：`曹操`、`劉嘩`；字段（`field`）：行动已用（`action-used`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：否（false）
- 第 4 项：
  - 事实条件（`kind=fact`）；类别（`category`）：城市（`city`）；对象（`subject`）：列表（按来源次序）：`曹操`、`劉嘩`；字段（`field`）：当前所在城市（`current-city`）；比较关系（`operator`）：全部相同（`all-equal`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：是（true）
- 第 5 项：
  - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：`劉嘩`；字段（`field`）：功绩（`merit`）；比较关系（`operator`）：可能需要（`possibly-required`）；确定性（`certainty`）：暂定，阈值未确认（`tentative-unconfirmed-threshold`）
    - 取值（`value`）：
      - 阈值（`threshold`）：未说明（`not-stated`）
      - 来源报告的成功数值（`observedSuccessfulValue`）：500
- 第 6 项：
  - 事实条件（`kind=fact`）；类别（`category`）：日期（`date`）；对象（`subject`）：`calendar`；字段（`field`）：当前年月（`current-month`）；比较关系（`operator`）：变为（`becomes`）；确定性（`certainty`）：暂定，年份存疑（`tentative-year-questioned`）
    - 取值（`value`）：列表（按来源次序）：194、1

### 前置事件关系（`prerequisites`）

- 空列表（0 项）

### 结果与分支（仅来源描述顺序）（`orderedResults`）

- 第 1 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：增加（`increase`）；作用对象（`target`）：`劉嘩`
    - 参数（`values`）：
      - 功绩（`merit`）：500
- 第 2 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：加入势力（`join-force`）；作用对象（`target`）：列表（按来源次序）：`満寵`、`呂虔`
    - 参数（`values`）：
      - 势力（`force`）：`player-force`
      - 功绩增量（`meritDelta`）：500

### 不确定性与来源限定（`uncertainties`）

- 第 1 项：劉嘩 spelling is preserved. The source confirms an occurrence at merit 500, not a minimum threshold. Year 194 is tentative. It references 曹操 without explicitly declaring a player-ruler condition.

<a id="atwiki-88-50"></a>

## 观察 50：徐州譲渡（徐州禅譲）

- 事件标识（`eventId`）：`tao-qian-cedes-xuzhou`
- 观察标识（`observationId`）：`atwiki-88-50`
- 原文标题（`title`）：`徐州譲渡（徐州禅譲）`
- 来源标识（`sourceId`）：`atwiki-88`
- 来源网址（`sourceURL`）：[https://w.atwiki.jp/sangokushi11/pages/88.html](https://w.atwiki.jp/sangokushi11/pages/88.html)
- 来源章节（`sourceSection`）：`徐州譲渡（徐州禅譲）`
- 来源节序（`sourceOrdinal`）：50
- 来源行定位（`sourceLocator`）：
  - 起始行（`startLine`）：1002
  - 结束行（`endLine`）：1015
- 版本范围（`version`）：
  - 游戏（`game`）：`SAN11`
  - 版本类型（`edition`）：未指定（`unspecified`）
  - 平台（`platform`）：未指定（`unspecified`）
  - 补丁（`patch`）：未指定（`unspecified`）
- 证据性质（`evidence`）：公开攻略转录（`public-guide-transcription`）
- 仅发生一次信息（`onceOnly`）：
  - 状态（`status`）：未说明（`not-stated`）
  - 标志标识（`flagId`）：未提供（null）

### 触发条件（`conditions`）

- 第 1 项：
  - 任一成立（`any`）（节点种类（`kind`））
    - 逻辑：本组至少一个子项成立；仅表示来源的分组，不引入调度规则
    - 子项（`items`）：
      - 第 1 项：
        - 全部成立（`all`）（节点种类（`kind`））
          - 逻辑：本组各子项均成立；仅表示来源的分组，不引入调度规则
          - 子项（`items`）：
            - 第 1 项：
              - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`player`；字段（`field`）：君主（`ruler`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
                - 取值（`value`）：`劉備`
            - 第 2 项：
              - 事实条件（`kind=fact`）；类别（`category`）：剧本（`scenario`）；对象（`subject`）：剧本（`scenario`）；字段（`field`）：编号（`number`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
                - 取值（`value`）：3
            - 第 3 项：
              - 事实条件（`kind=fact`）；类别（`category`）：城市（`city`）；对象（`subject`）：`劉備`；字段（`field`）：持有城市（`cities`）；比较关系（`operator`）：包含全部（`contains-all`）；确定性（`certainty`）：来源明示（`stated`）
                - 取值（`value`）：列表（按来源次序）：`小沛`
            - 第 4 项：
              - 事实条件（`kind=fact`）；类别（`category`）：城市（`city`）；对象（`subject`）：`陶謙`；字段（`field`）：持有城市（`cities`）；比较关系（`operator`）：包含全部（`contains-all`）；确定性（`certainty`）：来源明示（`stated`）
                - 取值（`value`）：列表（按来源次序）：`下ヒ`
            - 第 5 项：
              - 事实条件（`kind=fact`）；类别（`category`）：任务或行动（`mission`）；对象（`subject`）：列表（按来源次序）：`劉備`；字段（`field`）：行动已用（`action-used`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
                - 取值（`value`）：否（false）
            - 第 6 项：
              - 事实条件（`kind=fact`）；类别（`category`）：日期（`date`）；对象（`subject`）：`calendar`；字段（`field`）：当前年月（`current-month`）；比较关系（`operator`）：变为（`becomes`）；确定性（`certainty`）：来源明示（`stated`）
                - 取值（`value`）：列表（按来源次序）：194、12
      - 第 2 项：
        - 全部成立（`all`）（节点种类（`kind`））
          - 逻辑：本组各子项均成立；仅表示来源的分组，不引入调度规则
          - 子项（`items`）：
            - 第 1 项：
              - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`player`；字段（`field`）：君主（`ruler`）；比较关系（`operator`）：不等于（`neq`）；确定性（`certainty`）：来源明示（`stated`）
                - 取值（`value`）：`劉備`
            - 第 2 项：
              - 事实条件（`kind=fact`）；类别（`category`）：其他（`other`）；对象（`subject`）：`event`；字段（`field`）：触发条件（`trigger-conditions`）；比较关系（`operator`）：未说明（`not-stated`）；确定性（`certainty`）：来源明示（`stated`）
                - 取值（`value`）：`reported-occurrence-only`

### 前置事件关系（`prerequisites`）

- 空列表（0 项）

### 结果与分支（仅来源描述顺序）（`orderedResults`）

- 第 1 项：
  - 分支（`branch`）（节点种类（`kind`））
    - 分支标识（`branchId`）：`liu-bei-player`
    - 分支条件（`condition`）：
      - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`player`；字段（`field`）：君主（`ruler`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
        - 取值（`value`）：`劉備`
    - 按来源描述排列的结果（`orderedResults`）：
      - 第 1 项：
        - 结果效果（`kind=effect`）；操作（`operation`）：死亡（`death`）；作用对象（`target`）：`陶謙`
          - 参数（`values`）：空属性集（0 项）
      - 第 2 项：
        - 结果效果（`kind=effect`）；操作（`operation`）：转移城市（`transfer-city`）；作用对象（`target`）：`下ヒ`
          - 参数（`values`）：
            - 新势力（`newForce`）：`劉備`
      - 第 3 项：
        - 结果效果（`kind=effect`）；操作（`operation`）：转移武将（`transfer-officers`）；作用对象（`target`）：`陶謙.subordinate-officers`
          - 参数（`values`）：
            - 新势力（`newForce`）：`劉備`
- 第 2 项：
  - 分支（`branch`）（节点种类（`kind`））
    - 分支标识（`branchId`）：`non-liu-bei-player`
    - 分支条件（`condition`）：
      - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`player`；字段（`field`）：君主（`ruler`）；比较关系（`operator`）：不等于（`neq`）；确定性（`certainty`）：来源明示（`stated`）
        - 取值（`value`）：`劉備`
    - 按来源描述排列的结果（`orderedResults`）：
      - 第 1 项：
        - 结果效果（`kind=effect`）；操作（`operation`）：未说明（`not-stated`）；作用对象（`target`）：`event`
          - 参数（`values`）：空属性集（0 项）

### 不确定性与来源限定（`uncertainties`）

- 第 1 项：Non-Liu-Bei-player occurrence is reported, but its conditions and results are unknown. Source city spelling 下ヒ is retained.

<a id="atwiki-88-51"></a>

## 观察 51：玉帯詔（董承の密勅）

- 事件标识（`eventId`）：`jade-belt-decree`
- 观察标识（`observationId`）：`atwiki-88-51`
- 原文标题（`title`）：`玉帯詔（董承の密勅）`
- 来源标识（`sourceId`）：`atwiki-88`
- 来源网址（`sourceURL`）：[https://w.atwiki.jp/sangokushi11/pages/88.html](https://w.atwiki.jp/sangokushi11/pages/88.html)
- 来源章节（`sourceSection`）：`玉帯詔（董承の密勅）`
- 来源节序（`sourceOrdinal`）：51
- 来源行定位（`sourceLocator`）：
  - 起始行（`startLine`）：1016
  - 结束行（`endLine`）：1031
- 版本范围（`version`）：
  - 游戏（`game`）：`SAN11`
  - 版本类型（`edition`）：未指定（`unspecified`）
  - 平台（`platform`）：未指定（`unspecified`）
  - 补丁（`patch`）：未指定（`unspecified`）
- 证据性质（`evidence`）：公开攻略转录（`public-guide-transcription`）
- 仅发生一次信息（`onceOnly`）：
  - 状态（`status`）：未说明（`not-stated`）
  - 标志标识（`flagId`）：未提供（null）

### 触发条件（`conditions`）

- 第 1 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`player`；字段（`field`）：君主（`ruler`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：`劉備`
- 第 2 项：
  - 事实条件（`kind=fact`）；类别（`category`）：剧本（`scenario`）；对象（`subject`）：剧本（`scenario`）；字段（`field`）：编号（`number`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：3
- 第 3 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`曹操`；字段（`field`）：武将列表（`officers`）；比较关系（`operator`）：包含全部（`contains-all`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：`董承`
- 第 4 项：
  - 事实条件（`kind=fact`）；类别（`category`）：任务或行动（`mission`）；对象（`subject`）：列表（按来源次序）：`劉備`；字段（`field`）：行动已用（`action-used`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：否（false）
- 第 5 项：
  - 事实条件（`kind=fact`）；类别（`category`）：日期（`date`）；对象（`subject`）：`calendar`；字段（`field`）：当前年月（`current-month`）；比较关系（`operator`）：变为（`becomes`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：200、2
- 第 6 项：
  - 事实条件（`kind=fact`）；类别（`category`）：其他（`other`）；对象（`subject`）：`event`；字段（`field`）：附加条件（`additional-conditions`）；比较关系（`operator`）：未知（`unknown`）；确定性（`certainty`）：来源追问是否还有条件（`source-asks-if-additional-conditions-exist`）
    - 取值（`value`）：未提供（null）

### 前置事件关系（`prerequisites`）

- 空列表（0 项）

### 结果与分支（仅来源描述顺序）（`orderedResults`）

- 第 1 项：
  - 选择（`choice`）（节点种类（`kind`））
    - 选择标识（`choiceId`）：`oppose-cao-cao`
    - 控制方（`controller`）：`player`
    - 电脑默认选项（`aiDefault`）：未提供（null）
    - 可选项（`options`）：
      - 第 1 项：
        - 选项标识（`optionId`）：`agree`
        - 按来源描述排列的结果（`orderedResults`）：
          - 第 1 项：
            - 结果效果（`kind=effect`）；操作（`operation`）：设为（`set`）；作用对象（`target`）：列表（按来源次序）：`player-force`、`曹操`
              - 参数（`values`）：
                - 关系（`relationship`）：`worst`
          - 第 2 项：
            - 结果效果（`kind=effect`）；操作（`operation`）：设为（`set`）；作用对象（`target`）：`player-force.cities`
              - 参数（`values`）：
                - 士气（`morale`）：`maximum`
          - 第 3 项：
            - 结果效果（`kind=effect`）；操作（`operation`）：提高忠诚（`increase-loyalty`）；作用对象（`target`）：`officers-with-漢室重視`
              - 参数（`values`）：
                - 数额（`amount`）：未说明（`not-stated`）
                - 势力范围（`forceScope`）：未说明（`not-stated`）
          - 第 4 项：
            - 结果效果（`kind=effect`）；操作（`operation`）：死亡（`death`）；作用对象（`target`）：`董承`
              - 参数（`values`）：空属性集（0 项）
          - 第 5 项：
            - 分支（`branch`）（节点种类（`kind`））
              - 分支标识（`branchId`）：`low-held-gold`
              - 分支条件（`condition`）：
                - 事实条件（`kind=fact`）；类别（`category`）：其他（`other`）；对象（`subject`）：`held-gold`；字段（`field`）：数额（`amount`）；比较关系（`operator`）：低，阈值按来源限定（`low`）；确定性（`certainty`）：来源明示（`stated`）
                  - 取值（`value`）：
                    - 阈值（`threshold`）：未说明（`not-stated`）
              - 按来源描述排列的结果（`orderedResults`）：
                - 第 1 项：
                  - 结果效果（`kind=effect`）；操作（`operation`）：获得金（`receive-gold`）；作用对象（`target`）：`recipient-not-stated`
                    - 参数（`values`）：
                      - 数额（`amount`）：3000
      - 第 2 项：
        - 选项标识（`optionId`）：`disagree`
        - 按来源描述排列的结果（`orderedResults`）：
          - 第 1 项：
            - 结果效果（`kind=effect`）；操作（`operation`）：不死亡（`does-not-die`）；作用对象（`target`）：`董承`
              - 参数（`values`）：空属性集（0 项）

### 不确定性与来源限定（`uncertainties`）

- 第 1 项：The source explicitly questions additional trigger conditions. The low-gold threshold, recipient/storage scope, timing of the 3000 gold, and loyalty-increase magnitude/scope are not stated.

<a id="atwiki-88-52"></a>

## 观察 52：遷都許昌

- 事件标识（`eventId`）：`move-capital-xuchang`
- 观察标识（`observationId`）：`atwiki-88-52`
- 原文标题（`title`）：`遷都許昌`
- 来源标识（`sourceId`）：`atwiki-88`
- 来源网址（`sourceURL`）：[https://w.atwiki.jp/sangokushi11/pages/88.html](https://w.atwiki.jp/sangokushi11/pages/88.html)
- 来源章节（`sourceSection`）：`遷都許昌`
- 来源节序（`sourceOrdinal`）：52
- 来源行定位（`sourceLocator`）：
  - 起始行（`startLine`）：1032
  - 结束行（`endLine`）：1041
- 版本范围（`version`）：
  - 游戏（`game`）：`SAN11`
  - 版本类型（`edition`）：未指定（`unspecified`）
  - 平台（`platform`）：未指定（`unspecified`）
  - 补丁（`patch`）：未指定（`unspecified`）
- 证据性质（`evidence`）：公开攻略转录（`public-guide-transcription`）
- 仅发生一次信息（`onceOnly`）：
  - 状态（`status`）：未说明（`not-stated`）
  - 标志标识（`flagId`）：未提供（null）

### 触发条件（`conditions`）

- 第 1 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`player`；字段（`field`）：君主（`ruler`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：`曹操`
- 第 2 项：
  - 事实条件（`kind=fact`）；类别（`category`）：日期（`date`）；对象（`subject`）：剧本（`scenario`）；字段（`field`）：剧本开始年（`start-year`）；比较关系（`operator`）：小于或等于（`lte`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：196
- 第 3 项：
  - 事实条件（`kind=fact`）；类别（`category`）：城市（`city`）；对象（`subject`）：`曹操`；字段（`field`）：持有城市（`cities`）；比较关系（`operator`）：包含（`contains`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：`献帝.current-city`
- 第 4 项：
  - 事实条件（`kind=fact`）；类别（`category`）：城市（`city`）；对象（`subject`）：`曹操`；字段（`field`）：持有城市（`cities`）；比较关系（`operator`）：包含全部（`contains-all`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：`許昌`

### 前置事件关系（`prerequisites`）

- 空列表（0 项）

### 结果与分支（仅来源描述顺序）（`orderedResults`）

- 第 1 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：迁都（`move-capital`）；作用对象（`target`）：`capital`
    - 参数（`values`）：
      - 目的地（`destination`）：`許昌`
- 第 2 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：提高忠诚（`increase-loyalty`）；作用对象（`target`）：`officers-with-漢室重視`
    - 参数（`values`）：
      - 数额（`amount`）：未说明（`not-stated`）
      - 势力范围（`forceScope`）：未说明（`not-stated`）

### 不确定性与来源限定（`uncertainties`）

- 第 1 项：The emperor-city condition explicitly permits either 洛陽 or 長安; these examples are not made an exclusive list.

<a id="atwiki-88-53"></a>

## 观察 53：袁紹の死（袁家分裂）

- 事件标识（`eventId`）：`yuan-shao-death-split`
- 观察标识（`observationId`）：`atwiki-88-53`
- 原文标题（`title`）：`袁紹の死（袁家分裂）`
- 来源标识（`sourceId`）：`atwiki-88`
- 来源网址（`sourceURL`）：[https://w.atwiki.jp/sangokushi11/pages/88.html](https://w.atwiki.jp/sangokushi11/pages/88.html)
- 来源章节（`sourceSection`）：`袁紹の死（袁家分裂）`
- 来源节序（`sourceOrdinal`）：53
- 来源行定位（`sourceLocator`）：
  - 起始行（`startLine`）：1042
  - 结束行（`endLine`）：1052
- 版本范围（`version`）：
  - 游戏（`game`）：`SAN11`
  - 版本类型（`edition`）：未指定（`unspecified`）
  - 平台（`platform`）：未指定（`unspecified`）
  - 补丁（`patch`）：未指定（`unspecified`）
- 证据性质（`evidence`）：公开攻略转录（`public-guide-transcription`）
- 仅发生一次信息（`onceOnly`）：
  - 状态（`status`）：未说明（`not-stated`）
  - 标志标识（`flagId`）：未提供（null）

### 触发条件（`conditions`）

- 第 1 项：
  - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：`袁紹`；字段（`field`）：死亡（`dies`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：是（true）
- 第 2 项：
  - 事实条件（`kind=fact`）；类别（`category`）：城市（`city`）；对象（`subject`）：`袁譚`；字段（`field`）：当前所在城市（`current-city`）；比较关系（`operator`）：属于（`in`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：`北海`、`平原`
- 第 3 项：
  - 事实条件（`kind=fact`）；类别（`category`）：城市（`city`）；对象（`subject`）：列表（按来源次序）：`袁尚`、`袁譚`；字段（`field`）：当前所在地区（`current-region`）；比较关系（`operator`）：并非全部相同（`not-all-equal`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：是（true）
- 第 4 项：
  - 事实条件（`kind=fact`）；类别（`category`）：城市（`city`）；对象（`subject`）：列表（按来源次序）：`袁キ`、`袁譚`；字段（`field`）：当前所在地区（`current-region`）；比较关系（`operator`）：并非全部相同（`not-all-equal`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：是（true）
- 第 5 项：
  - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：`brothers`；字段（`field`）：状态（`status`）；比较关系（`operator`）：每一项均等于（`each-eq`）；确定性（`certainty`）：暂定，尚未确认（`tentative-unconfirmed`）
    - 取值（`value`）：`district-commander`

### 前置事件关系（`prerequisites`）

- 空列表（0 项）

### 结果与分支（仅来源描述顺序）（`orderedResults`）

- 第 1 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：独立（`become-independent`）；作用对象（`target`）：列表（按来源次序）：`袁尚`、`袁譚`
    - 参数（`values`）：空属性集（0 项）
- 第 2 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：分裂势力（`split-force`）；作用对象（`target`）：`袁紹-force`
    - 参数（`values`）：空属性集（0 项）
- 第 3 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：分配追随武将（`assign-followers`）；作用对象（`target`）：`袁譚`
    - 参数（`values`）：
      - 武将（`officers`）：列表（按来源次序）：`王修`、`郭図`、`辛評`、`辛毘`
- 第 4 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：分配追随武将（`assign-followers`）；作用对象（`target`）：`袁尚`
    - 参数（`values`）：
      - 武将（`officers`）：`all-others`

### 不确定性与来源限定（`uncertainties`）

- 第 1 项：The body spells one brother 袁キ; no correction is made. The requirement that each brother be a district commander is explicitly unconfirmed.

<a id="atwiki-88-54"></a>

## 观察 54：徐庶の母（徐庶去る）

- 事件标识（`eventId`）：`xu-shu-leaves`
- 观察标识（`observationId`）：`atwiki-88-54`
- 原文标题（`title`）：`徐庶の母（徐庶去る）`
- 来源标识（`sourceId`）：`atwiki-88`
- 来源网址（`sourceURL`）：[https://w.atwiki.jp/sangokushi11/pages/88.html](https://w.atwiki.jp/sangokushi11/pages/88.html)
- 来源章节（`sourceSection`）：`徐庶の母（徐庶去る）`
- 来源节序（`sourceOrdinal`）：54
- 来源行定位（`sourceLocator`）：
  - 起始行（`startLine`）：1053
  - 结束行（`endLine`）：1066
- 版本范围（`version`）：
  - 游戏（`game`）：`SAN11`
  - 版本类型（`edition`）：未指定（`unspecified`）
  - 平台（`platform`）：未指定（`unspecified`）
  - 补丁（`patch`）：未指定（`unspecified`）
- 证据性质（`evidence`）：公开攻略转录（`public-guide-transcription`）
- 仅发生一次信息（`onceOnly`）：
  - 状态（`status`）：未说明（`not-stated`）
  - 标志标识（`flagId`）：未提供（null）

### 触发条件（`conditions`）

- 第 1 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`player`；字段（`field`）：君主（`ruler`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：`劉備`
- 第 2 项：
  - 事实条件（`kind=fact`）；类别（`category`）：剧本（`scenario`）；对象（`subject`）：剧本（`scenario`）；字段（`field`）：编号（`number`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：5
- 第 3 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`player-force`；字段（`field`）：武将列表（`officers`）；比较关系（`operator`）：包含全部（`contains-all`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：`徐庶`
- 第 4 项：
  - 事实条件（`kind=fact`）；类别（`category`）：任务或行动（`mission`）；对象（`subject`）：列表（按来源次序）：`劉備`、`徐庶`；字段（`field`）：行动已用（`action-used`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：否（false）
- 第 5 项：
  - 事实条件（`kind=fact`）；类别（`category`）：城市（`city`）；对象（`subject`）：列表（按来源次序）：`劉備`、`徐庶`；字段（`field`）：当前所在地区（`current-region`）；比较关系（`operator`）：全部相同（`all-equal`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：是（true）
- 第 6 项：
  - 事实条件（`kind=fact`）；类别（`category`）：日期（`date`）；对象（`subject`）：`calendar`；字段（`field`）：当前年月（`current-month`）；比较关系（`operator`）：变为（`becomes`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：207、12

### 前置事件关系（`prerequisites`）

- 空列表（0 项）

### 结果与分支（仅来源描述顺序）（`orderedResults`）

- 第 1 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：开始舌战（`start-debate`）；作用对象（`target`）：`徐庶`
    - 参数（`values`）：
      - 开始时条件（`conditionAtStart`）：`injured`
      - 其他参加者（`otherParticipants`）：未说明（`not-stated`）
- 第 2 项：
  - 分支（`branch`）（节点种类（`kind`））
    - 分支标识（`branchId`）：`lose`
    - 分支条件（`condition`）：
      - 事实条件（`kind=fact`）；类别（`category`）：其他（`other`）；对象（`subject`）：`debate`；字段（`field`）：玩家结果（`player-outcome`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
        - 取值（`value`）：`loss`
    - 按来源描述排列的结果（`orderedResults`）：
      - 第 1 项：
        - 结果效果（`kind=effect`）；操作（`operation`）：离开势力（`leave-force`）；作用对象（`target`）：`徐庶`
          - 参数（`values`）：
            - 目的地（`destination`）：未说明（`not-stated`）
- 第 3 项：
  - 分支（`branch`）（节点种类（`kind`））
    - 分支标识（`branchId`）：`win`
    - 分支条件（`condition`）：
      - 事实条件（`kind=fact`）；类别（`category`）：其他（`other`）；对象（`subject`）：`debate`；字段（`field`）：玩家结果（`player-outcome`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
        - 取值（`value`）：`win`
    - 按来源描述排列的结果（`orderedResults`）：
      - 第 1 项：
        - 结果效果（`kind=effect`）；操作（`operation`）：留在原势力（`remain-in-force`）；作用对象（`target`）：`徐庶`
          - 参数（`values`）：空属性集（0 项）
      - 第 2 项：
        - 结果效果（`kind=effect`）；操作（`operation`）：设为（`set`）；作用对象（`target`）：`徐庶`
          - 参数（`values`）：
            - 忠诚（`loyalty`）：`maximum`
- 第 4 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：改变发言者（`vary-speaker`）；作用对象（`target`）：`event-dialogue`
    - 参数（`values`）：
      - 依赖项（`dependsOn`）：列表（按来源次序）：`liu-biao-death-split`、`other-unspecified-events`
- 第 5 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：后续事件发生（`future-event-occurs`）；作用对象（`target`）：`three-visits-overview`
    - 参数（`values`）：
      - 不受其影响的事项（`regardlessOf`）：`persuasion-success-or-failure`
      - 时间点（`timing`）：未说明（`not-stated`）

### 不确定性与来源限定（`uncertainties`）

- 第 1 项：The source questions whether the trigger begins as early as November 21 rather than December 207. The current-month condition retains the main claim and the alternative remains tentative. No Xu Shu destination is stated.

<a id="atwiki-88-55"></a>

## 观察 55：劉表の死（荊州分裂）

- 事件标识（`eventId`）：`liu-biao-death-split`
- 观察标识（`observationId`）：`atwiki-88-55`
- 原文标题（`title`）：`劉表の死（荊州分裂）`
- 来源标识（`sourceId`）：`atwiki-88`
- 来源网址（`sourceURL`）：[https://w.atwiki.jp/sangokushi11/pages/88.html](https://w.atwiki.jp/sangokushi11/pages/88.html)
- 来源章节（`sourceSection`）：`劉表の死（荊州分裂）`
- 来源节序（`sourceOrdinal`）：55
- 来源行定位（`sourceLocator`）：
  - 起始行（`startLine`）：1067
  - 结束行（`endLine`）：1076
- 版本范围（`version`）：
  - 游戏（`game`）：`SAN11`
  - 版本类型（`edition`）：未指定（`unspecified`）
  - 平台（`platform`）：未指定（`unspecified`）
  - 补丁（`patch`）：未指定（`unspecified`）
- 证据性质（`evidence`）：公开攻略转录（`public-guide-transcription`）
- 仅发生一次信息（`onceOnly`）：
  - 状态（`status`）：未说明（`not-stated`）
  - 标志标识（`flagId`）：未提供（null）

### 触发条件（`conditions`）

- 第 1 项：
  - 事实条件（`kind=fact`）；类别（`category`）：前置事件（`prerequisite`）；对象（`subject`）：`cao-cao-southern-campaign`；字段（`field`）：已宣布南征（`southern-campaign-declared`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：是（true）
- 第 2 项：
  - 事实条件（`kind=fact`）；类别（`category`）：城市（`city`）；对象（`subject`）：`劉表`；字段（`field`）：持有城市（`cities`）；比较关系（`operator`）：包含全部（`contains-all`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：`江夏`、`襄陽`
- 第 3 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`劉表`；字段（`field`）：武将列表（`officers`）；比较关系（`operator`）：包含全部（`contains-all`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：`劉琮`、`劉琦`、`蔡瑁`
- 第 4 项：
  - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：列表（按来源次序）：`劉琮`、`劉琦`、`蔡瑁`；字段（`field`）：存活（`alive`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：是（true）
- 第 5 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`劉備`；字段（`field`）：存在（`exists`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：是（true）
- 第 6 项：
  - 事实条件（`kind=fact`）；类别（`category`）：日期（`date`）；对象（`subject`）：`calendar`；字段（`field`）：当前年份（`current-year`）；比较关系（`operator`）：大于或等于（`gte`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：208
- 第 7 项：
  - 事实条件（`kind=fact`）；类别（`category`）：其他（`other`）；对象（`subject`）：`event`；字段（`field`）：附加条件（`additional-conditions`）；比较关系（`operator`）：未知（`unknown`）；确定性（`certainty`）：来源追问是否还有条件（`source-asks-if-additional-conditions-exist`）
    - 取值（`value`）：未提供（null）

### 前置事件关系（`prerequisites`）

- 第 1 项：
  - 事件标识（`eventId`）：`cao-cao-southern-campaign`
  - 前置要求（`requirement`）：必需前置（`required`）
  - 间隔（`delay`）：未提供（null）

### 结果与分支（仅来源描述顺序）（`orderedResults`）

- 第 1 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：死亡（`death`）；作用对象（`target`）：`劉表`
    - 参数（`values`）：空属性集（0 项）
- 第 2 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：消灭势力（`destroy-force`）；作用对象（`target`）：`劉表`
    - 参数（`values`）：空属性集（0 项）
- 第 3 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：转移城市（`transfer-city`）；作用对象（`target`）：`江夏`
    - 参数（`values`）：
      - 新势力（`newForce`）：`劉備`
- 第 4 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：转移城市（`transfer-city`）；作用对象（`target`）：`襄陽`
    - 参数（`values`）：
      - 新势力（`newForce`）：`曹操`
- 第 5 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：全部撤出（`vacate-all`）；作用对象（`target`）：`other-劉表-territory`
    - 参数（`values`）：空属性集（0 项）

### 不确定性与来源限定（`uncertainties`）

- 第 1 项：The guide questions additional trigger conditions. The prerequisite is the southern-campaign declaration, with no delay stated.

<a id="atwiki-88-56"></a>

## 观察 56：孫劉同盟

- 事件标识（`eventId`）：`sun-liu-alliance`
- 观察标识（`observationId`）：`atwiki-88-56`
- 原文标题（`title`）：`孫劉同盟`
- 来源标识（`sourceId`）：`atwiki-88`
- 来源网址（`sourceURL`）：[https://w.atwiki.jp/sangokushi11/pages/88.html](https://w.atwiki.jp/sangokushi11/pages/88.html)
- 来源章节（`sourceSection`）：`孫劉同盟`
- 来源节序（`sourceOrdinal`）：56
- 来源行定位（`sourceLocator`）：
  - 起始行（`startLine`）：1077
  - 结束行（`endLine`）：1088
- 版本范围（`version`）：
  - 游戏（`game`）：`SAN11`
  - 版本类型（`edition`）：未指定（`unspecified`）
  - 平台（`platform`）：未指定（`unspecified`）
  - 补丁（`patch`）：未指定（`unspecified`）
- 证据性质（`evidence`）：公开攻略转录（`public-guide-transcription`）
- 仅发生一次信息（`onceOnly`）：
  - 状态（`status`）：未说明（`not-stated`）
  - 标志标识（`flagId`）：未提供（null）

### 触发条件（`conditions`）

- 第 1 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`player`；字段（`field`）：君主（`ruler`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：`劉備`
- 第 2 项：
  - 事实条件（`kind=fact`）；类别（`category`）：剧本（`scenario`）；对象（`subject`）：剧本（`scenario`）；字段（`field`）：编号（`number`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：5
- 第 3 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`劉備`；字段（`field`）：控制地区数（`controlled-region-count`）；比较关系（`operator`）：小于或等于（`lte`）；确定性（`certainty`）：来源另报数值为三时成功，与条件相冲突（`source-contradicted-by-reported-occurrence-at-three`）
    - 取值（`value`）：2
- 第 4 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：列表（按来源次序）：`劉備`、`孫権`、`曹操`；字段（`field`）：相邻状态（`adjacency-state`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：成对适用范围未说明（`pairwise-scope-not-stated`）
    - 取值（`value`）：是（true）
- 第 5 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`player-force`；字段（`field`）：武将列表（`officers`）；比较关系（`operator`）：包含全部（`contains-all`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：`諸葛亮`
- 第 6 项：
  - 事实条件（`kind=fact`）；类别（`category`）：外交（`diplomacy`）；对象（`subject`）：列表（按来源次序）：`劉備`、`孫権`；字段（`field`）：外交状态允许同盟（`diplomatic-state-permits-alliance`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：是（true）

### 前置事件关系（`prerequisites`）

- 空列表（0 项）

### 结果与分支（仅来源描述顺序）（`orderedResults`）

- 第 1 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：缔结同盟（`form-alliance`）；作用对象（`target`）：列表（按来源次序）：`孫権`、`劉備`
    - 参数（`values`）：
      - 持续时间（`duration`）：未说明（`not-stated`）
- 第 2 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：设置友好度下限（`set-friendship-at-least`）；作用对象（`target`）：列表（按来源次序）：`孫権`、`劉備`
    - 参数（`values`）：
      - 取值（`value`）：`好意`

### 不确定性与来源限定（`uncertainties`）

- 第 1 项：The stated <= 2 controlled regions is questioned by the same source reporting an occurrence with 3 and speculating that 劉備 rank may matter. Adjacency pair details are not stated.

<a id="atwiki-88-57"></a>

## 观察 57：鳳雛理政（落第県令）

- 事件标识（`eventId`）：`pang-tong-county-administration`
- 观察标识（`observationId`）：`atwiki-88-57`
- 原文标题（`title`）：`鳳雛理政（落第県令）`
- 来源标识（`sourceId`）：`atwiki-88`
- 来源网址（`sourceURL`）：[https://w.atwiki.jp/sangokushi11/pages/88.html](https://w.atwiki.jp/sangokushi11/pages/88.html)
- 来源章节（`sourceSection`）：`鳳雛理政（落第県令）`
- 来源节序（`sourceOrdinal`）：57
- 来源行定位（`sourceLocator`）：
  - 起始行（`startLine`）：1089
  - 结束行（`endLine`）：1099
- 版本范围（`version`）：
  - 游戏（`game`）：`SAN11`
  - 版本类型（`edition`）：未指定（`unspecified`）
  - 平台（`platform`）：未指定（`unspecified`）
  - 补丁（`patch`）：未指定（`unspecified`）
- 证据性质（`evidence`）：公开攻略转录（`public-guide-transcription`）
- 仅发生一次信息（`onceOnly`）：
  - 状态（`status`）：未说明（`not-stated`）
  - 标志标识（`flagId`）：未提供（null）

### 触发条件（`conditions`）

- 第 1 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`player-force`；字段（`field`）：武将列表（`officers`）；比较关系（`operator`）：包含全部（`contains-all`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：`ホウ統`
- 第 2 项：
  - 事实条件（`kind=fact`）；类别（`category`）：城市（`city`）；对象（`subject`）：列表（按来源次序）：`ホウ統`、`player-ruler`；字段（`field`）：当前所在地区（`current-region`）；比较关系（`operator`）：并非全部相同（`not-all-equal`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：是（true）
- 第 3 项：
  - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：`ホウ統`；字段（`field`）：功绩（`merit`）；比较关系（`operator`）：小于或等于（`lte`）；确定性（`certainty`）：暂定，来源以疑问表述（`tentative-source-question`）
    - 取值（`value`）：5000
- 第 4 项：
  - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：`player-force`；字段（`field`）：具有指定性格的部下（`subordinate-with-personality`）；比较关系（`operator`）：包含（`contains`）；确定性（`certainty`）：暂定，来源以疑问表述（`tentative-source-question`）
    - 取值（`value`）：`猪突`

### 前置事件关系（`prerequisites`）

- 空列表（0 项）

### 结果与分支（仅来源描述顺序）（`orderedResults`）

- 第 1 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：迁移（`relocate`）；作用对象（`target`）：`ホウ統`
    - 参数（`values`）：
      - 目的地（`destination`）：`player-ruler.current-city`
      - 持续日数（`durationDays`）：10
- 第 2 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：增加（`increase`）；作用对象（`target`）：`ホウ統`
    - 参数（`values`）：
      - 功绩（`merit`）：2000
- 第 3 项：
  - 分支（`branch`）（节点种类（`kind`））
    - 分支标识（`branchId`）：`possible-liu-bei-zhuge-liang-restriction`
    - 分支条件（`condition`）：
      - 全部成立（`all`）（节点种类（`kind`））
        - 逻辑：本组各子项均成立；仅表示来源的分组，不引入调度规则
        - 子项（`items`）：
          - 第 1 项：
            - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`player`；字段（`field`）：君主（`ruler`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：暂定，来源以疑问表述（`tentative-source-question`）
              - 取值（`value`）：`劉備`
          - 第 2 项：
            - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`player-force`；字段（`field`）：军师（`strategist`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：暂定，来源以疑问表述（`tentative-source-question`）
              - 取值（`value`）：`諸葛亮`
    - 按来源描述排列的结果（`orderedResults`）：
      - 第 1 项：
        - 结果效果（`kind=effect`）；操作（`operation`）：设为（`set`）；作用对象（`target`）：`ホウ統`
          - 参数（`values`）：
            - 忠诚（`loyalty`）：`maximum`

### 不确定性与来源限定（`uncertainties`）

- 第 1 项：Source name ホウ統 and the unclosed parenthesis on the movement line are preserved in the source snapshot. Merit <= 5000 and a 猪突 subordinate are tentative. Maximum loyalty is stated, while its possible restriction to 劉備 ruler / 諸葛亮 strategist is questioned.

<a id="atwiki-88-58"></a>

## 观察 58：九品中正法（九品官人法）

- 事件标识（`eventId`）：`nine-rank-system`
- 观察标识（`observationId`）：`atwiki-88-58`
- 原文标题（`title`）：`九品中正法（九品官人法）`
- 来源标识（`sourceId`）：`atwiki-88`
- 来源网址（`sourceURL`）：[https://w.atwiki.jp/sangokushi11/pages/88.html](https://w.atwiki.jp/sangokushi11/pages/88.html)
- 来源章节（`sourceSection`）：`九品中正法（九品官人法）`
- 来源节序（`sourceOrdinal`）：58
- 来源行定位（`sourceLocator`）：
  - 起始行（`startLine`）：1100
  - 结束行（`endLine`）：1119
- 版本范围（`version`）：
  - 游戏（`game`）：`SAN11`
  - 版本类型（`edition`）：未指定（`unspecified`）
  - 平台（`platform`）：未指定（`unspecified`）
  - 补丁（`patch`）：未指定（`unspecified`）
- 证据性质（`evidence`）：公开攻略转录（`public-guide-transcription`）
- 仅发生一次信息（`onceOnly`）：
  - 状态（`status`）：未说明（`not-stated`）
  - 标志标识（`flagId`）：未提供（null）

### 触发条件（`conditions`）

- 第 1 项：
  - 事实条件（`kind=fact`）；类别（`category`）：日期（`date`）；对象（`subject`）：剧本（`scenario`）；字段（`field`）：剧本经过日数（`elapsed-days`）；比较关系（`operator`）：大于或等于（`gte`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：180
- 第 2 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`player-force`；字段（`field`）：武将列表（`officers`）；比较关系（`operator`）：包含全部（`contains-all`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：`陳羣`
- 第 3 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`player-force`；字段（`field`）：从属武将数（`subordinate-officer-count`）；比较关系（`operator`）：大于或等于（`gte`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：50
- 第 4 项：
  - 事实条件（`kind=fact`）；类别（`category`）：爵位（`title`）；对象（`subject`）：`player-ruler`；字段（`field`）：爵位（`rank-title`）；比较关系（`operator`）：属于（`in`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：`公`、`王`、`皇帝`
- 第 5 项：
  - 事实条件（`kind=fact`）；类别（`category`）：城市（`city`）；对象（`subject`）：`player-force`；字段（`field`）：地区内持有城市数（`owned-city-count-in-region`）；比较关系（`operator`）：大于或等于（`gte`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：
      - 城市列表（`cities`）：列表（按来源次序）：`北海`、`下邳`、`小沛`、`寿春`、`濮陽`、`陳陽`、`許昌`、`汝南`、`洛陽`
      - 数量（`count`）：5
- 第 6 项：
  - 事实条件（`kind=fact`）；类别（`category`）：城市（`city`）；对象（`subject`）：`player-force`；字段（`field`）：地区内持有城市数（`owned-city-count-in-region`）；比较关系（`operator`）：大于或等于（`gte`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：
      - 城市列表（`cities`）：列表（按来源次序）：`襄平`、`北平`、`薊`、`南皮`、`平原`、`晋陽`、`鄴`
      - 数量（`count`）：5
- 第 7 项：
  - 事实条件（`kind=fact`）；类别（`category`）：城市（`city`）；对象（`subject`）：`player-force`；字段（`field`）：持有城市（`cities`）；比较关系（`operator`）：包含全部（`contains-all`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：`洛陽`、`許昌`
- 第 8 项：
  - 事实条件（`kind=fact`）；类别（`category`）：城市（`city`）；对象（`subject`）：列表（按来源次序）：`player-ruler`、`陳羣`；字段（`field`）：当前所在据点（`current-base`）；比较关系（`operator`）：全部相同（`all-equal`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：是（true）
- 第 9 项：
  - 事实条件（`kind=fact`）；类别（`category`）：任务或行动（`mission`）；对象（`subject`）：列表（按来源次序）：`player-ruler`、`陳羣`；字段（`field`）：行动已用（`action-used`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：否（false）

### 前置事件关系（`prerequisites`）

- 空列表（0 项）

### 结果与分支（仅来源描述顺序）（`orderedResults`）

- 第 1 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：增加（`increase`）；作用对象（`target`）：`陳羣`
    - 参数（`values`）：
      - 功绩（`merit`）：3000
- 第 2 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：设为（`set`）；作用对象（`target`）：`player-force.all-controlled-cities`
    - 参数（`values`）：
      - 治安（`publicOrder`）：100
- 第 3 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：增加（`increase`）；作用对象（`target`）：`player-force.all-controlled-city-soldiers`
    - 参数（`values`）：
      - 气力（`energy`）：20
- 第 4 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：增加（`increase`）；作用对象（`target`）：`player-force.all-subordinate-officers`
    - 参数（`values`）：
      - 忠诚（`loyalty`）：20

### 不确定性与来源限定（`uncertainties`）

- 第 1 项：Source city spelling 陳陽 is retained.

<a id="atwiki-88-59"></a>

## 观察 59：魏公即位（魏公騒動）

- 事件标识（`eventId`）：`wei-duke-accession`
- 观察标识（`observationId`）：`atwiki-88-59`
- 原文标题（`title`）：`魏公即位（魏公騒動）`
- 来源标识（`sourceId`）：`atwiki-88`
- 来源网址（`sourceURL`）：[https://w.atwiki.jp/sangokushi11/pages/88.html](https://w.atwiki.jp/sangokushi11/pages/88.html)
- 来源章节（`sourceSection`）：`魏公即位（魏公騒動）`
- 来源节序（`sourceOrdinal`）：59
- 来源行定位（`sourceLocator`）：
  - 起始行（`startLine`）：1120
  - 结束行（`endLine`）：1121
- 版本范围（`version`）：
  - 游戏（`game`）：`SAN11`
  - 版本类型（`edition`）：未指定（`unspecified`）
  - 平台（`platform`）：未指定（`unspecified`）
  - 补丁（`patch`）：未指定（`unspecified`）
- 证据性质（`evidence`）：公开攻略转录（`public-guide-transcription`）
- 仅发生一次信息（`onceOnly`）：
  - 状态（`status`）：未说明（`not-stated`）
  - 标志标识（`flagId`）：未提供（null）

### 触发条件（`conditions`）

- 空列表（0 项）

### 前置事件关系（`prerequisites`）

- 空列表（0 项）

### 结果与分支（仅来源描述顺序）（`orderedResults`）

- 第 1 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：未说明（`not-stated`）；作用对象（`target`）：`event`
    - 参数（`values`）：空属性集（0 项）

### 不确定性与来源限定（`uncertainties`）

- 第 1 项：Heading-only section: trigger conditions and results are not stated.

<a id="atwiki-88-60"></a>

## 观察 60：魏王即位

- 事件标识（`eventId`）：`wei-king-accession`
- 观察标识（`observationId`）：`atwiki-88-60`
- 原文标题（`title`）：`魏王即位`
- 来源标识（`sourceId`）：`atwiki-88`
- 来源网址（`sourceURL`）：[https://w.atwiki.jp/sangokushi11/pages/88.html](https://w.atwiki.jp/sangokushi11/pages/88.html)
- 来源章节（`sourceSection`）：`魏王即位`
- 来源节序（`sourceOrdinal`）：60
- 来源行定位（`sourceLocator`）：
  - 起始行（`startLine`）：1122
  - 结束行（`endLine`）：1123
- 版本范围（`version`）：
  - 游戏（`game`）：`SAN11`
  - 版本类型（`edition`）：未指定（`unspecified`）
  - 平台（`platform`）：未指定（`unspecified`）
  - 补丁（`patch`）：未指定（`unspecified`）
- 证据性质（`evidence`）：公开攻略转录（`public-guide-transcription`）
- 仅发生一次信息（`onceOnly`）：
  - 状态（`status`）：未说明（`not-stated`）
  - 标志标识（`flagId`）：未提供（null）

### 触发条件（`conditions`）

- 空列表（0 项）

### 前置事件关系（`prerequisites`）

- 空列表（0 项）

### 结果与分支（仅来源描述顺序）（`orderedResults`）

- 第 1 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：未说明（`not-stated`）；作用对象（`target`）：`event`
    - 参数（`values`）：空属性集（0 项）

### 不确定性与来源限定（`uncertainties`）

- 第 1 项：Heading-only section: trigger conditions and results are not stated.

<a id="atwiki-88-61"></a>

## 观察 61：関羽の驕慢（美髯公には及ばず）

- 事件标识（`eventId`）：`guan-yu-arrogance`
- 观察标识（`observationId`）：`atwiki-88-61`
- 原文标题（`title`）：`関羽の驕慢（美髯公には及ばず）`
- 来源标识（`sourceId`）：`atwiki-88`
- 来源网址（`sourceURL`）：[https://w.atwiki.jp/sangokushi11/pages/88.html](https://w.atwiki.jp/sangokushi11/pages/88.html)
- 来源章节（`sourceSection`）：`関羽の驕慢（美髯公には及ばず）`
- 来源节序（`sourceOrdinal`）：61
- 来源行定位（`sourceLocator`）：
  - 起始行（`startLine`）：1124
  - 结束行（`endLine`）：1125
- 版本范围（`version`）：
  - 游戏（`game`）：`SAN11`
  - 版本类型（`edition`）：未指定（`unspecified`）
  - 平台（`platform`）：未指定（`unspecified`）
  - 补丁（`patch`）：未指定（`unspecified`）
- 证据性质（`evidence`）：公开攻略转录（`public-guide-transcription`）
- 仅发生一次信息（`onceOnly`）：
  - 状态（`status`）：未说明（`not-stated`）
  - 标志标识（`flagId`）：未提供（null）

### 触发条件（`conditions`）

- 空列表（0 项）

### 前置事件关系（`prerequisites`）

- 空列表（0 项）

### 结果与分支（仅来源描述顺序）（`orderedResults`）

- 第 1 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：未说明（`not-stated`）；作用对象（`target`）：`event`
    - 参数（`values`）：空属性集（0 项）

### 不确定性与来源限定（`uncertainties`）

- 第 1 项：Heading-only section: trigger conditions and results are not stated.

## 静态覆盖清单

- 观察正文：61 条；每条均逐项展开全部条件、前置关系、结果层级和不确定性
- 节点数：`fact` 613；`effect` 199；`all` 57；`any` 20；`choice` 4；`branch` 41；`if` 8。这些是转录结构的静态数量，不是游戏触发次数
- 所有非省略字段均已在正文保留；完整递归字段集合：`accelerationEvent`、`accelerationWhen`、`affectedBaselinePredicates`、`aiDefault`、`amount`、`baselineConditions`、`branchId`、`candidates`、`category`、`certainty`、`choiceId`、`cities`、`city`、`condition`、`conditionAtStart`、`conditions`、`consequence`、`controller`、`count`、`countryName`、`datasetId`、`delay`、`dependsOn`、`destination`、`direction`、`durability`、`duration`、`durationDays`、`edition`、`eligibility`、`endLine`、`energy`、`eventId`、`events`、`evidence`、`executionEnabled`、`facilityType`、`field`、`flagId`、`force`、`forceScope`、`friendship`、`game`、`gold`、`identity`、`intelligence`、`items`、`kind`、`leadership`、`loyalty`、`magnitude`、`merit`、`meritDelta`、`morale`、`newForce`、`newOwner`、`observationId`、`observedSuccessfulValue`、`officers`、`onceOnly`、`operation`、`operator`、`optionId`、`options`、`orderedResults`、`otherParticipants`、`patch`、`platform`、`politics`、`portraitId`、`prerequisites`、`prohibitedRuler`、`publicOrder`、`rankTitle`、`reference`、`regardlessOf`、`region`、`relationship`、`replacementConditions`、`requirement`、`resources`、`scopeCertainty`、`sourceId`、`sourceLocator`、`sourceOrdinal`、`sourceSection`、`sourceURL`、`startLine`、`status`、`subject`、`target`、`targetSelector`、`threshold`、`timing`、`title`、`uncertainties`、`unit`、`value`、`values`、`version`
- 省略项仅为 `schemaVersion`；没有删减游戏事实，没有裁决未解决分歧
