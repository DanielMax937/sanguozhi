# GamerSky 史实事件逐观察规则正文

本文展开 `gamersky-2008.json` 中全部 **44 条观察**。全资料集合共 105 条观察、66 个事件映射、41 条未解决分歧；完整来源目录、版本范围、排除项、全局未知项及分歧见[史实事件总目录](historical-scenario-events-inventory.md)。

- 数据集标识（`datasetId`）：`san11-historical-events-gamersky-2008`
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

- [gamersky.yellow-turban-uprising · 黄巾之乱](#gamersky.yellow-turban-uprising)；事件 `yellow-turban-uprising`
- [gamersky.peach-garden-oath · 桃园结义](#gamersky.peach-garden-oath)；事件 `peach-garden-oath`
- [gamersky.depose-shao-emperor · 少帝废立](#gamersky.depose-shao-emperor)；事件 `depose-shao-emperor`
- [gamersky.anti-dong-coalition · 反董卓连盟](#gamersky.anti-dong-coalition)；事件 `anti-dong-coalition`
- [gamersky.recruit-dian-wei · 恶来出场](#gamersky.recruit-dian-wei)；事件 `recruit-dian-wei`
- [gamersky.recruit-xu-chu · 虎痴斗恶来](#gamersky.recruit-xu-chu)；事件 `recruit-xu-chu`
- [gamersky.recommend-guo-jia · 荀彧推荐郭嘉](#gamersky.recommend-guo-jia)；事件 `recommend-guo-jia`
- [gamersky.chain-plot-banquet · 连还计 1 - 酒宴](#gamersky.chain-plot-banquet)；事件 `chain-plot-banquet`
- [gamersky.chain-plot-pavilion · 连还计 2 - 凤仪亭](#gamersky.chain-plot-pavilion)；事件 `chain-plot-pavilion`
- [gamersky.chain-plot-assassination · 连还计 3 - 谋杀](#gamersky.chain-plot-assassination)；事件 `chain-plot-assassination`
- [gamersky.marry-liu-bei-mi · 糜氏嫁刘备](#gamersky.marry-liu-bei-mi)；事件 `marry-liu-bei-mi`
- [gamersky.sun-ce-sortie · 孙策出阵](#gamersky.sun-ce-sortie)；事件 `sun-ce-sortie`
- [gamersky.recruit-sun-ce-five · 小霸王孙策](#gamersky.recruit-sun-ce-five)；事件 `recruit-sun-ce-five`
- [gamersky.recommend-two-zhangs · 周瑜推举二张](#gamersky.recommend-two-zhangs)；事件 `recommend-two-zhangs`
- [gamersky.marry-two-qiaos · 二乔结婚](#gamersky.marry-two-qiaos)；事件 `marry-two-qiaos`
- [gamersky.yuan-shu-usurps · 伪帝僭称](#gamersky.yuan-shu-usurps)；事件 `yuan-shu-usurps`
- [gamersky.marry-cao-pi-zhen · 甄氏转嫁曹丕](#gamersky.marry-cao-pi-zhen)；事件 `marry-cao-pi-zhen`
- [gamersky.two-powers-war · 二强开战](#gamersky.two-powers-war)；事件 `two-powers-war`
- [gamersky.zhao-yun-reunion · 赵云再会](#gamersky.zhao-yun-reunion)；事件 `zhao-yun-reunion`
- [gamersky.recruit-liu-bei-five · 好汉刘备](#gamersky.recruit-liu-bei-five)；事件 `recruit-liu-bei-five`
- [gamersky.guo-jia-death · 郭嘉之死](#gamersky.guo-jia-death)；事件 `guo-jia-death`
- [gamersky.sun-ce-death · 孙策之死](#gamersky.sun-ce-death)；事件 `sun-ce-death`
- [gamersky.marry-zhuge-liang · 诸葛亮结婚](#gamersky.marry-zhuge-liang)；事件 `marry-zhuge-liang`
- [gamersky.gan-ning-defects · 甘宁逃命](#gamersky.gan-ning-defects)；事件 `gan-ning-defects`
- [gamersky.xu-shu-arrives · 徐庶登场](#gamersky.xu-shu-arrives)；事件 `xu-shu-arrives`
- [gamersky.cao-cao-southern-campaign · 曹操之南征](#gamersky.cao-cao-southern-campaign)；事件 `cao-cao-southern-campaign`
- [gamersky.three-visits-first · 三顾之礼 1 - 一顾](#gamersky.three-visits-first)；事件 `three-visits-first`
- [gamersky.three-visits-second · 三顾之礼 2 - 二顾](#gamersky.three-visits-second)；事件 `three-visits-second`
- [gamersky.three-visits-third · 三顾之礼 3 - 三顾](#gamersky.three-visits-third)；事件 `three-visits-third`
- [gamersky.recommend-ma-brothers · 马氏五常](#gamersky.recommend-ma-brothers)；事件 `recommend-ma-brothers`
- [gamersky.marry-sun-shang-xiang · 孙尚香结婚](#gamersky.marry-sun-shang-xiang)；事件 `marry-sun-shang-xiang`
- [gamersky.lu-meng-studies · 吴下阿蒙](#gamersky.lu-meng-studies)；事件 `lu-meng-studies`
- [gamersky.zhou-yu-death · 周瑜之死](#gamersky.zhou-yu-death)；事件 `zhou-yu-death`
- [gamersky.cao-cao-death · 曹操之死](#gamersky.cao-cao-death)；事件 `cao-cao-death`
- [gamersky.liu-bei-hanzhong-king · 汉中王即位](#gamersky.liu-bei-hanzhong-king)；事件 `liu-bei-hanzhong-king`
- [gamersky.wei-emperor-accession · 魏帝即位](#gamersky.wei-emperor-accession)；事件 `wei-emperor-accession`
- [gamersky.shu-emperor-accession · 蜀帝即位](#gamersky.shu-emperor-accession)；事件 `shu-emperor-accession`
- [gamersky.sons-of-tigers-oath · 虎之子](#gamersky.sons-of-tigers-oath)；事件 `sons-of-tigers-oath`
- [gamersky.wu-king-accession · 吴王即位](#gamersky.wu-king-accession)；事件 `wu-king-accession`
- [gamersky.lu-xun-arrives · 陆逊登场](#gamersky.lu-xun-arrives)；事件 `lu-xun-arrives`
- [gamersky.zhuge-liang-northern-campaign · 诸葛亮北伐](#gamersky.zhuge-liang-northern-campaign)；事件 `zhuge-liang-northern-campaign`
- [gamersky.wu-emperor-accession · 吴王即位](#gamersky.wu-emperor-accession)；事件 `wu-emperor-accession`
- [gamersky.liu-bei-death · 刘备之死](#gamersky.liu-bei-death)；事件 `liu-bei-death`
- [gamersky.zhuge-liang-death · 诸葛亮之死](#gamersky.zhuge-liang-death)；事件 `zhuge-liang-death`

<a id="gamersky.yellow-turban-uprising"></a>

## 观察 01：黄巾之乱

- 事件标识（`eventId`）：`yellow-turban-uprising`
- 观察标识（`observationId`）：`gamersky.yellow-turban-uprising`
- 原文标题（`title`）：`黄巾之乱`
- 来源标识（`sourceId`）：`gamersky-01`
- 来源网址（`sourceURL`）：[https://www.gamersky.com/handbook/200809/124174.shtml](https://www.gamersky.com/handbook/200809/124174.shtml)
- 来源章节（`sourceSection`）：`黄巾之乱`
- 来源节序（`sourceOrdinal`）：1
- 版本范围（`version`）：
  - 游戏（`game`）：`SAN11`
  - 版本类型（`edition`）：未指定（`unspecified`）
  - 平台（`platform`）：未指定（`unspecified`）
  - 补丁（`patch`）：未指定（`unspecified`）
- 证据性质（`evidence`）：公开攻略转录（`public-guide-transcription`）
- 仅发生一次信息（`onceOnly`）：
  - 状态（`status`）：未说明（`not-stated`）
  - 标志标识（`flagId`）：未提供（null）
- 来源行定位：此观察未提供 `sourceLocator`；保留网址、章节和来源节序作为定位信息

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
  - 结果效果（`kind=effect`）；操作（`operation`）：来源明示无变化（`no-described-change`）；作用对象（`target`）：`event`
    - 参数（`values`）：空属性集（0 项）

### 不确定性与来源限定（`uncertainties`）

- 空列表（0 项）

<a id="gamersky.peach-garden-oath"></a>

## 观察 02：桃园结义

- 事件标识（`eventId`）：`peach-garden-oath`
- 观察标识（`observationId`）：`gamersky.peach-garden-oath`
- 原文标题（`title`）：`桃园结义`
- 来源标识（`sourceId`）：`gamersky-01`
- 来源网址（`sourceURL`）：[https://www.gamersky.com/handbook/200809/124174.shtml](https://www.gamersky.com/handbook/200809/124174.shtml)
- 来源章节（`sourceSection`）：`桃园结义`
- 来源节序（`sourceOrdinal`）：2
- 版本范围（`version`）：
  - 游戏（`game`）：`SAN11`
  - 版本类型（`edition`）：未指定（`unspecified`）
  - 平台（`platform`）：未指定（`unspecified`）
  - 补丁（`patch`）：未指定（`unspecified`）
- 证据性质（`evidence`）：公开攻略转录（`public-guide-transcription`）
- 仅发生一次信息（`onceOnly`）：
  - 状态（`status`）：未说明（`not-stated`）
  - 标志标识（`flagId`）：未提供（null）
- 来源行定位：此观察未提供 `sourceLocator`；保留网址、章节和来源节序作为定位信息

### 触发条件（`conditions`）

- 第 1 项：
  - 事实条件（`kind=fact`）；类别（`category`）：剧本（`scenario`）；对象（`subject`）：剧本（`scenario`）；字段（`field`）：编号（`number`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：1
- 第 2 项：
  - 事实条件（`kind=fact`）；类别（`category`）：日期（`date`）；对象（`subject`）：剧本（`scenario`）；字段（`field`）：剧本经过日数（`elapsed-days`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：0
- 第 3 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`player`；字段（`field`）：君主（`ruler`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：`刘焉`
- 第 4 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`刘焉`；字段（`field`）：武将列表（`officers`）；比较关系（`operator`）：包含全部（`contains-all`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：`刘备`、`关羽`、`张飞`

### 前置事件关系（`prerequisites`）

- 空列表（0 项）

### 结果与分支（仅来源描述顺序）（`orderedResults`）

- 第 1 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：来源明示无变化（`no-described-change`）；作用对象（`target`）：`event`
    - 参数（`values`）：空属性集（0 项）

### 不确定性与来源限定（`uncertainties`）

- 空列表（0 项）

<a id="gamersky.depose-shao-emperor"></a>

## 观察 03：少帝废立

- 事件标识（`eventId`）：`depose-shao-emperor`
- 观察标识（`observationId`）：`gamersky.depose-shao-emperor`
- 原文标题（`title`）：`少帝废立`
- 来源标识（`sourceId`）：`gamersky-01`
- 来源网址（`sourceURL`）：[https://www.gamersky.com/handbook/200809/124174.shtml](https://www.gamersky.com/handbook/200809/124174.shtml)
- 来源章节（`sourceSection`）：`少帝废立`
- 来源节序（`sourceOrdinal`）：3
- 版本范围（`version`）：
  - 游戏（`game`）：`SAN11`
  - 版本类型（`edition`）：未指定（`unspecified`）
  - 平台（`platform`）：未指定（`unspecified`）
  - 补丁（`patch`）：未指定（`unspecified`）
- 证据性质（`evidence`）：公开攻略转录（`public-guide-transcription`）
- 仅发生一次信息（`onceOnly`）：
  - 状态（`status`）：未说明（`not-stated`）
  - 标志标识（`flagId`）：未提供（null）
- 来源行定位：此观察未提供 `sourceLocator`；保留网址、章节和来源节序作为定位信息

### 触发条件（`conditions`）

- 第 1 项：
  - 事实条件（`kind=fact`）；类别（`category`）：日期（`date`）；对象（`subject`）：剧本（`scenario`）；字段（`field`）：剧本开始年月（`start-month`）；比较关系（`operator`）：指定月份之前，边界未说明（`before-month`）；确定性（`certainty`）：月份边界未说明（`month-boundary-unspecified`）
    - 取值（`value`）：列表（按来源次序）：189、8
- 第 2 项：
  - 事实条件（`kind=fact`）；类别（`category`）：日期（`date`）；对象（`subject`）：`calendar`；字段（`field`）：当前年月（`current-month`）；比较关系（`operator`）：指定月份之后，边界未说明（`after-month`）；确定性（`certainty`）：月份边界未说明（`month-boundary-unspecified`）
    - 取值（`value`）：列表（按来源次序）：189、9
- 第 3 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`董卓`；字段（`field`）：存在（`exists`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：是（true）
- 第 4 项：
  - 事实条件（`kind=fact`）；类别（`category`）：城市（`city`）；对象（`subject`）：`董卓`；字段（`field`）：持有城市（`cities`）；比较关系（`operator`）：包含全部（`contains-all`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：`洛阳`、`长安`
- 第 5 项：
  - 事实条件（`kind=fact`）；类别（`category`）：皇帝（`emperor`）；对象（`subject`）：`董卓`；字段（`field`）：拥立汉帝（`supports-han-emperor`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：是（true）
- 第 6 项：
  - 事实条件（`kind=fact`）；类别（`category`）：皇帝（`emperor`）；对象（`subject`）：`han-emperor`；字段（`field`）：身份（`identity`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：`少帝`
- 第 7 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`董卓`；字段（`field`）：武将列表（`officers`）；比较关系（`operator`）：包含全部（`contains-all`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：`李儒`
- 第 8 项：
  - 事实条件（`kind=fact`）；类别（`category`）：任务或行动（`mission`）；对象（`subject`）：列表（按来源次序）：`董卓`、`李儒`；字段（`field`）：正在执行任务（`on-mission`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：否（false）

### 前置事件关系（`prerequisites`）

- 空列表（0 项）

### 结果与分支（仅来源描述顺序）（`orderedResults`）

- 第 1 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：死亡（`death`）；作用对象（`target`）：`少帝`
    - 参数（`values`）：空属性集（0 项）
- 第 2 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：设为（`set`）；作用对象（`target`）：`han-emperor`
    - 参数（`values`）：
      - 身份（`identity`）：`献帝`
- 第 3 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：移动（`move`）；作用对象（`target`）：`献帝`
    - 参数（`values`）：
      - 目的地（`destination`）：`少帝.current-city`

### 不确定性与来源限定（`uncertainties`）

- 空列表（0 项）

<a id="gamersky.anti-dong-coalition"></a>

## 观察 04：反董卓连盟

- 事件标识（`eventId`）：`anti-dong-coalition`
- 观察标识（`observationId`）：`gamersky.anti-dong-coalition`
- 原文标题（`title`）：`反董卓连盟`
- 来源标识（`sourceId`）：`gamersky-01`
- 来源网址（`sourceURL`）：[https://www.gamersky.com/handbook/200809/124174.shtml](https://www.gamersky.com/handbook/200809/124174.shtml)
- 来源章节（`sourceSection`）：`反董卓连盟`
- 来源节序（`sourceOrdinal`）：4
- 版本范围（`version`）：
  - 游戏（`game`）：`SAN11`
  - 版本类型（`edition`）：未指定（`unspecified`）
  - 平台（`platform`）：未指定（`unspecified`）
  - 补丁（`patch`）：未指定（`unspecified`）
- 证据性质（`evidence`）：公开攻略转录（`public-guide-transcription`）
- 仅发生一次信息（`onceOnly`）：
  - 状态（`status`）：未说明（`not-stated`）
  - 标志标识（`flagId`）：未提供（null）
- 来源行定位：此观察未提供 `sourceLocator`；保留网址、章节和来源节序作为定位信息

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
  - 结果效果（`kind=effect`）；操作（`operation`）：来源明示无变化（`no-described-change`）；作用对象（`target`）：`event`
    - 参数（`values`）：空属性集（0 项）

### 不确定性与来源限定（`uncertainties`）

- 空列表（0 项）

<a id="gamersky.recruit-dian-wei"></a>

## 观察 05：恶来出场

- 事件标识（`eventId`）：`recruit-dian-wei`
- 观察标识（`observationId`）：`gamersky.recruit-dian-wei`
- 原文标题（`title`）：`恶来出场`
- 来源标识（`sourceId`）：`gamersky-01`
- 来源网址（`sourceURL`）：[https://www.gamersky.com/handbook/200809/124174.shtml](https://www.gamersky.com/handbook/200809/124174.shtml)
- 来源章节（`sourceSection`）：`恶来出场`
- 来源节序（`sourceOrdinal`）：5
- 版本范围（`version`）：
  - 游戏（`game`）：`SAN11`
  - 版本类型（`edition`）：未指定（`unspecified`）
  - 平台（`platform`）：未指定（`unspecified`）
  - 补丁（`patch`）：未指定（`unspecified`）
- 证据性质（`evidence`）：公开攻略转录（`public-guide-transcription`）
- 仅发生一次信息（`onceOnly`）：
  - 状态（`status`）：未说明（`not-stated`）
  - 标志标识（`flagId`）：未提供（null）
- 来源行定位：此观察未提供 `sourceLocator`；保留网址、章节和来源节序作为定位信息

### 触发条件（`conditions`）

- 第 1 项：
  - 事实条件（`kind=fact`）；类别（`category`）：日期（`date`）；对象（`subject`）：剧本（`scenario`）；字段（`field`）：剧本开始年月（`start-month`）；比较关系（`operator`）：指定月份之前，边界未说明（`before-month`）；确定性（`certainty`）：月份边界未说明（`month-boundary-unspecified`）
    - 取值（`value`）：列表（按来源次序）：193、12
- 第 2 项：
  - 事实条件（`kind=fact`）；类别（`category`）：日期（`date`）；对象（`subject`）：剧本（`scenario`）；字段（`field`）：剧本经过日数（`elapsed-days`）；比较关系（`operator`）：大于或等于（`gte`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：90
- 第 3 项：
  - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：列表（按来源次序）：`典韦`；字段（`field`）：已达登场年龄（`debut-age-reached`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：是（true）
- 第 4 项：
  - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：列表（按来源次序）：`典韦`；字段（`field`）：状态（`status`）；比较关系（`operator`）：每一项均属于（`each-in`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：`free`、`undiscovered`
- 第 5 项：
  - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：列表（按来源次序）：`典韦`；字段（`field`）：与玩家君主的相性（`compatibility-to-player-ruler`）；比较关系（`operator`）：相近，阈值按来源限定（`close`）；确定性（`certainty`）：阈值未说明（`threshold-unspecified`）
    - 取值（`value`）：是（true）
- 第 6 项：
  - 全部成立（`all`）（节点种类（`kind`））
    - 逻辑：本组各子项均成立；仅表示来源的分组，不引入调度规则
    - 子项（`items`）：
      - 第 1 项：
        - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：列表（按来源次序）：`典韦`；字段（`field`）：厌恶武将列表（`disliked-officers`）；比较关系（`operator`）：不包含（`not-contains`）；确定性（`certainty`）：来源明示（`stated`）
          - 取值（`value`）：`player-ruler`
      - 第 2 项：
        - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：`player-ruler`；字段（`field`）：厌恶武将列表（`disliked-officers`）；比较关系（`operator`）：全部不包含（`contains-none`）；确定性（`certainty`）：来源明示（`stated`）
          - 取值（`value`）：列表（按来源次序）：`典韦`
- 第 7 项：
  - 事实条件（`kind=fact`）；类别（`category`）：城市（`city`）；对象（`subject`）：`player`；字段（`field`）：持有城市（`cities`）；比较关系（`operator`）：包含全部（`contains-all`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：`陈留`、`濮阳`
- 第 8 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`player`；字段（`field`）：武将列表（`officers`）；比较关系（`operator`）：包含全部（`contains-all`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：`夏侯敦`
- 第 9 项：
  - 事实条件（`kind=fact`）；类别（`category`）：城市（`city`）；对象（`subject`）：列表（按来源次序）：`player-ruler`、`夏侯敦`；字段（`field`）：当前所在城市（`current-city`）；比较关系（`operator`）：全部相同（`all-equal`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：是（true）
- 第 10 项：
  - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：`夏侯敦`；字段（`field`）：忠诚（`loyalty`）；比较关系（`operator`）：大于（`gt`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：95
- 第 11 项：
  - 全部成立（`all`）（节点种类（`kind`））
    - 逻辑：本组各子项均成立；仅表示来源的分组，不引入调度规则
    - 子项（`items`）：
      - 第 1 项：
        - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：列表（按来源次序）：`夏侯敦`；字段（`field`）：厌恶武将列表（`disliked-officers`）；比较关系（`operator`）：不包含（`not-contains`）；确定性（`certainty`）：来源明示（`stated`）
          - 取值（`value`）：`player-ruler`
      - 第 2 项：
        - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：`player-ruler`；字段（`field`）：厌恶武将列表（`disliked-officers`）；比较关系（`operator`）：全部不包含（`contains-none`）；确定性（`certainty`）：来源明示（`stated`）
          - 取值（`value`）：列表（按来源次序）：`夏侯敦`
- 第 12 项：
  - 事实条件（`kind=fact`）；类别（`category`）：城市（`city`）；对象（`subject`）：`夏侯敦.current-city`；字段（`field`）：治安（`public-order`）；比较关系（`operator`）：大于（`gt`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：80
- 第 13 项：
  - 事实条件（`kind=fact`）；类别（`category`）：任务或行动（`mission`）；对象（`subject`）：列表（按来源次序）：`player-ruler`、`夏侯敦`；字段（`field`）：正在执行任务（`on-mission`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：否（false）

### 前置事件关系（`prerequisites`）

- 空列表（0 项）

### 结果与分支（仅来源描述顺序）（`orderedResults`）

- 第 1 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：增加（`add`）；作用对象（`target`）：`夏侯敦`
    - 参数（`values`）：
      - 功绩（`merit`）：500
- 第 2 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：加入势力（`join-force`）；作用对象（`target`）：`典韦`
    - 参数（`values`）：
      - 势力（`force`）：`player`
- 第 3 项：
  - 分支（`branch`）（节点种类（`kind`））
    - 分支标识（`branchId`）：`cao-cao`
    - 分支条件（`condition`）：
      - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`player`；字段（`field`）：君主（`ruler`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
        - 取值（`value`）：`曹操`
    - 按来源描述排列的结果（`orderedResults`）：
      - 第 1 项：
        - 结果效果（`kind=effect`）；操作（`operation`）：设为（`set`）；作用对象（`target`）：`典韦`
          - 参数（`values`）：
            - 忠诚（`loyalty`）：100
            - 功绩（`merit`）：2000
- 第 4 项：
  - 分支（`branch`）（节点种类（`kind`））
    - 分支标识（`branchId`）：`other-ruler`
    - 分支条件（`condition`）：
      - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`player`；字段（`field`）：君主（`ruler`）；比较关系（`operator`）：不等于（`ne`）；确定性（`certainty`）：来源明示（`stated`）
        - 取值（`value`）：`曹操`
    - 按来源描述排列的结果（`orderedResults`）：
      - 第 1 项：
        - 结果效果（`kind=effect`）；操作（`operation`）：设为（`set`）；作用对象（`target`）：`典韦`
          - 参数（`values`）：
            - 忠诚（`loyalty`）：100
            - 功绩（`merit`）：500

### 不确定性与来源限定（`uncertainties`）

- 空列表（0 项）

<a id="gamersky.recruit-xu-chu"></a>

## 观察 06：虎痴斗恶来

- 事件标识（`eventId`）：`recruit-xu-chu`
- 观察标识（`observationId`）：`gamersky.recruit-xu-chu`
- 原文标题（`title`）：`虎痴斗恶来`
- 来源标识（`sourceId`）：`gamersky-02`
- 来源网址（`sourceURL`）：[https://www.gamersky.com/handbook/200809/124174_2.shtml](https://www.gamersky.com/handbook/200809/124174_2.shtml)
- 来源章节（`sourceSection`）：`虎痴斗恶来`
- 来源节序（`sourceOrdinal`）：1
- 版本范围（`version`）：
  - 游戏（`game`）：`SAN11`
  - 版本类型（`edition`）：未指定（`unspecified`）
  - 平台（`platform`）：未指定（`unspecified`）
  - 补丁（`patch`）：未指定（`unspecified`）
- 证据性质（`evidence`）：公开攻略转录（`public-guide-transcription`）
- 仅发生一次信息（`onceOnly`）：
  - 状态（`status`）：未说明（`not-stated`）
  - 标志标识（`flagId`）：未提供（null）
- 来源行定位：此观察未提供 `sourceLocator`；保留网址、章节和来源节序作为定位信息

### 触发条件（`conditions`）

- 第 1 项：
  - 事实条件（`kind=fact`）；类别（`category`）：日期（`date`）；对象（`subject`）：剧本（`scenario`）；字段（`field`）：剧本开始年月（`start-month`）；比较关系（`operator`）：指定月份之前，边界未说明（`before-month`）；确定性（`certainty`）：月份边界未说明（`month-boundary-unspecified`）
    - 取值（`value`）：列表（按来源次序）：193、12
- 第 2 项：
  - 事实条件（`kind=fact`）；类别（`category`）：日期（`date`）；对象（`subject`）：剧本（`scenario`）；字段（`field`）：剧本经过日数（`elapsed-days`）；比较关系（`operator`）：大于或等于（`gte`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：180
- 第 3 项：
  - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：列表（按来源次序）：`许褚`；字段（`field`）：已达登场年龄（`debut-age-reached`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：是（true）
- 第 4 项：
  - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：列表（按来源次序）：`许褚`；字段（`field`）：状态（`status`）；比较关系（`operator`）：每一项均属于（`each-in`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：`free`、`undiscovered`
- 第 5 项：
  - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：列表（按来源次序）：`许褚`；字段（`field`）：与玩家君主的相性（`compatibility-to-player-ruler`）；比较关系（`operator`）：相近，阈值按来源限定（`close`）；确定性（`certainty`）：阈值未说明（`threshold-unspecified`）
    - 取值（`value`）：是（true）
- 第 6 项：
  - 全部成立（`all`）（节点种类（`kind`））
    - 逻辑：本组各子项均成立；仅表示来源的分组，不引入调度规则
    - 子项（`items`）：
      - 第 1 项：
        - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：列表（按来源次序）：`许褚`；字段（`field`）：厌恶武将列表（`disliked-officers`）；比较关系（`operator`）：不包含（`not-contains`）；确定性（`certainty`）：来源明示（`stated`）
          - 取值（`value`）：`player-ruler`
      - 第 2 项：
        - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：`player-ruler`；字段（`field`）：厌恶武将列表（`disliked-officers`）；比较关系（`operator`）：全部不包含（`contains-none`）；确定性（`certainty`）：来源明示（`stated`）
          - 取值（`value`）：列表（按来源次序）：`许褚`
- 第 7 项：
  - 事实条件（`kind=fact`）；类别（`category`）：城市（`city`）；对象（`subject`）：`player`；字段（`field`）：持有城市（`cities`）；比较关系（`operator`）：包含全部（`contains-all`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：`汝南`、`许昌`
- 第 8 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`player`；字段（`field`）：武将列表（`officers`）；比较关系（`operator`）：包含全部（`contains-all`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：`典韦`
- 第 9 项：
  - 事实条件（`kind=fact`）；类别（`category`）：城市（`city`）；对象（`subject`）：列表（按来源次序）：`player-ruler`、`典韦`；字段（`field`）：当前所在城市（`current-city`）；比较关系（`operator`）：全部相同（`all-equal`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：是（true）
- 第 10 项：
  - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：`典韦`；字段（`field`）：忠诚（`loyalty`）；比较关系（`operator`）：大于（`gt`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：95
- 第 11 项：
  - 全部成立（`all`）（节点种类（`kind`））
    - 逻辑：本组各子项均成立；仅表示来源的分组，不引入调度规则
    - 子项（`items`）：
      - 第 1 项：
        - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：列表（按来源次序）：`典韦`；字段（`field`）：厌恶武将列表（`disliked-officers`）；比较关系（`operator`）：不包含（`not-contains`）；确定性（`certainty`）：来源明示（`stated`）
          - 取值（`value`）：`player-ruler`
      - 第 2 项：
        - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：`player-ruler`；字段（`field`）：厌恶武将列表（`disliked-officers`）；比较关系（`operator`）：全部不包含（`contains-none`）；确定性（`certainty`）：来源明示（`stated`）
          - 取值（`value`）：列表（按来源次序）：`典韦`
- 第 12 项：
  - 事实条件（`kind=fact`）；类别（`category`）：城市（`city`）；对象（`subject`）：`典韦.current-city`；字段（`field`）：治安（`public-order`）；比较关系（`operator`）：大于（`gt`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：80
- 第 13 项：
  - 事实条件（`kind=fact`）；类别（`category`）：任务或行动（`mission`）；对象（`subject`）：列表（按来源次序）：`player-ruler`、`典韦`；字段（`field`）：正在执行任务（`on-mission`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：否（false）

### 前置事件关系（`prerequisites`）

- 空列表（0 项）

### 结果与分支（仅来源描述顺序）（`orderedResults`）

- 第 1 项：
  - 分支（`branch`）（节点种类（`kind`））
    - 分支标识（`branchId`）：`cao-cao`
    - 分支条件（`condition`）：
      - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`player`；字段（`field`）：君主（`ruler`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
        - 取值（`value`）：`曹操`
    - 按来源描述排列的结果（`orderedResults`）：
      - 第 1 项：
        - 结果效果（`kind=effect`）；操作（`operation`）：增加（`add`）；作用对象（`target`）：`典韦`
          - 参数（`values`）：
            - 功绩（`merit`）：500
      - 第 2 项：
        - 结果效果（`kind=effect`）；操作（`operation`）：加入势力（`join-force`）；作用对象（`target`）：`许褚`
          - 参数（`values`）：
            - 势力（`force`）：`player`
      - 第 3 项：
        - 结果效果（`kind=effect`）；操作（`operation`）：设为（`set`）；作用对象（`target`）：`许褚`
          - 参数（`values`）：
            - 忠诚（`loyalty`）：100
            - 功绩（`merit`）：2000
- 第 2 项：
  - 分支（`branch`）（节点种类（`kind`））
    - 分支标识（`branchId`）：`other-ruler-loses`
    - 分支条件（`condition`）：
      - 全部成立（`all`）（节点种类（`kind`））
        - 逻辑：本组各子项均成立；仅表示来源的分组，不引入调度规则
        - 子项（`items`）：
          - 第 1 项：
            - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`player`；字段（`field`）：君主（`ruler`）；比较关系（`operator`）：不等于（`ne`）；确定性（`certainty`）：来源明示（`stated`）
              - 取值（`value`）：`曹操`
          - 第 2 项：
            - 事实条件（`kind=fact`）；类别（`category`）：其他（`other`）；对象（`subject`）：`duel`；字段（`field`）：玩家一方的结果（`player-side-outcome`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
              - 取值（`value`）：`loss`
    - 按来源描述排列的结果（`orderedResults`）：
      - 第 1 项：
        - 结果效果（`kind=effect`）；操作（`operation`）：设为（`set`）；作用对象（`target`）：`许褚`
          - 参数（`values`）：
            - 状态（`status`）：在野（`free`）
      - 第 2 项：
        - 结果效果（`kind=effect`）；操作（`operation`）：设置仕官禁止（`set-employment-ban`）；作用对象（`target`）：`许褚`
          - 参数（`values`）：
            - 君主（`ruler`）：`player-ruler`
            - 持续时间（`duration`）：
              - 取值（`value`）：3
              - 单位（`unit`）：月（`months`）
- 第 3 项：
  - 分支（`branch`）（节点种类（`kind`））
    - 分支标识（`branchId`）：`other-ruler-wins`
    - 分支条件（`condition`）：
      - 全部成立（`all`）（节点种类（`kind`））
        - 逻辑：本组各子项均成立；仅表示来源的分组，不引入调度规则
        - 子项（`items`）：
          - 第 1 项：
            - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`player`；字段（`field`）：君主（`ruler`）；比较关系（`operator`）：不等于（`ne`）；确定性（`certainty`）：来源明示（`stated`）
              - 取值（`value`）：`曹操`
          - 第 2 项：
            - 事实条件（`kind=fact`）；类别（`category`）：其他（`other`）；对象（`subject`）：`duel`；字段（`field`）：玩家一方的结果（`player-side-outcome`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
              - 取值（`value`）：`win`
    - 按来源描述排列的结果（`orderedResults`）：
      - 第 1 项：
        - 结果效果（`kind=effect`）；操作（`operation`）：增加（`add`）；作用对象（`target`）：`典韦`
          - 参数（`values`）：
            - 功绩（`merit`）：300
      - 第 2 项：
        - 结果效果（`kind=effect`）；操作（`operation`）：加入势力（`join-force`）；作用对象（`target`）：`许褚`
          - 参数（`values`）：
            - 势力（`force`）：`player`
      - 第 3 项：
        - 结果效果（`kind=effect`）；操作（`operation`）：设为（`set`）；作用对象（`target`）：`许褚`
          - 参数（`values`）：
            - 忠诚（`loyalty`）：100
            - 功绩（`merit`）：500

### 不确定性与来源限定（`uncertainties`）

- 空列表（0 项）

<a id="gamersky.recommend-guo-jia"></a>

## 观察 07：荀彧推荐郭嘉

- 事件标识（`eventId`）：`recommend-guo-jia`
- 观察标识（`observationId`）：`gamersky.recommend-guo-jia`
- 原文标题（`title`）：`荀彧推荐郭嘉`
- 来源标识（`sourceId`）：`gamersky-02`
- 来源网址（`sourceURL`）：[https://www.gamersky.com/handbook/200809/124174_2.shtml](https://www.gamersky.com/handbook/200809/124174_2.shtml)
- 来源章节（`sourceSection`）：`荀彧推荐郭嘉`
- 来源节序（`sourceOrdinal`）：2
- 版本范围（`version`）：
  - 游戏（`game`）：`SAN11`
  - 版本类型（`edition`）：未指定（`unspecified`）
  - 平台（`platform`）：未指定（`unspecified`）
  - 补丁（`patch`）：未指定（`unspecified`）
- 证据性质（`evidence`）：公开攻略转录（`public-guide-transcription`）
- 仅发生一次信息（`onceOnly`）：
  - 状态（`status`）：未说明（`not-stated`）
  - 标志标识（`flagId`）：未提供（null）
- 来源行定位：此观察未提供 `sourceLocator`；保留网址、章节和来源节序作为定位信息

### 触发条件（`conditions`）

- 第 1 项：
  - 事实条件（`kind=fact`）；类别（`category`）：日期（`date`）；对象（`subject`）：剧本（`scenario`）；字段（`field`）：剧本开始年月（`start-month`）；比较关系（`operator`）：指定月份之前，边界未说明（`before-month`）；确定性（`certainty`）：月份边界未说明（`month-boundary-unspecified`）
    - 取值（`value`）：列表（按来源次序）：193、12
- 第 2 项：
  - 事实条件（`kind=fact`）；类别（`category`）：日期（`date`）；对象（`subject`）：剧本（`scenario`）；字段（`field`）：剧本经过日数（`elapsed-days`）；比较关系（`operator`）：大于或等于（`gte`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：30
- 第 3 项：
  - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：列表（按来源次序）：`郭嘉`；字段（`field`）：已达登场年龄（`debut-age-reached`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：是（true）
- 第 4 项：
  - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：列表（按来源次序）：`郭嘉`；字段（`field`）：状态（`status`）；比较关系（`operator`）：每一项均属于（`each-in`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：`free`、`undiscovered`
- 第 5 项：
  - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：列表（按来源次序）：`郭嘉`；字段（`field`）：与玩家君主的相性（`compatibility-to-player-ruler`）；比较关系（`operator`）：相近，阈值按来源限定（`close`）；确定性（`certainty`）：阈值未说明（`threshold-unspecified`）
    - 取值（`value`）：是（true）
- 第 6 项：
  - 全部成立（`all`）（节点种类（`kind`））
    - 逻辑：本组各子项均成立；仅表示来源的分组，不引入调度规则
    - 子项（`items`）：
      - 第 1 项：
        - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：列表（按来源次序）：`郭嘉`；字段（`field`）：厌恶武将列表（`disliked-officers`）；比较关系（`operator`）：不包含（`not-contains`）；确定性（`certainty`）：来源明示（`stated`）
          - 取值（`value`）：`player-ruler`
      - 第 2 项：
        - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：`player-ruler`；字段（`field`）：厌恶武将列表（`disliked-officers`）；比较关系（`operator`）：全部不包含（`contains-none`）；确定性（`certainty`）：来源明示（`stated`）
          - 取值（`value`）：列表（按来源次序）：`郭嘉`
- 第 7 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`player`；字段（`field`）：武将列表（`officers`）；比较关系（`operator`）：包含全部（`contains-all`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：`荀彧`
- 第 8 项：
  - 事实条件（`kind=fact`）；类别（`category`）：城市（`city`）；对象（`subject`）：列表（按来源次序）：`player-ruler`、`荀彧`；字段（`field`）：当前所在城市（`current-city`）；比较关系（`operator`）：全部相同（`all-equal`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：是（true）
- 第 9 项：
  - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：`荀彧`；字段（`field`）：忠诚（`loyalty`）；比较关系（`operator`）：大于（`gt`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：95
- 第 10 项：
  - 全部成立（`all`）（节点种类（`kind`））
    - 逻辑：本组各子项均成立；仅表示来源的分组，不引入调度规则
    - 子项（`items`）：
      - 第 1 项：
        - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：列表（按来源次序）：`荀彧`；字段（`field`）：厌恶武将列表（`disliked-officers`）；比较关系（`operator`）：不包含（`not-contains`）；确定性（`certainty`）：来源明示（`stated`）
          - 取值（`value`）：`player-ruler`
      - 第 2 项：
        - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：`player-ruler`；字段（`field`）：厌恶武将列表（`disliked-officers`）；比较关系（`operator`）：全部不包含（`contains-none`）；确定性（`certainty`）：来源明示（`stated`）
          - 取值（`value`）：列表（按来源次序）：`荀彧`
- 第 11 项：
  - 事实条件（`kind=fact`）；类别（`category`）：城市（`city`）；对象（`subject`）：`荀彧.current-city`；字段（`field`）：治安（`public-order`）；比较关系（`operator`）：大于（`gt`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：80
- 第 12 项：
  - 事实条件（`kind=fact`）；类别（`category`）：任务或行动（`mission`）；对象（`subject`）：列表（按来源次序）：`player-ruler`、`荀彧`；字段（`field`）：正在执行任务（`on-mission`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：否（false）

### 前置事件关系（`prerequisites`）

- 空列表（0 项）

### 结果与分支（仅来源描述顺序）（`orderedResults`）

- 第 1 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：增加（`add`）；作用对象（`target`）：`荀彧`
    - 参数（`values`）：
      - 功绩（`merit`）：500
- 第 2 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：加入势力（`join-force`）；作用对象（`target`）：`郭嘉`
    - 参数（`values`）：
      - 势力（`force`）：`player`
- 第 3 项：
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
- 第 4 项：
  - 分支（`branch`）（节点种类（`kind`））
    - 分支标识（`branchId`）：`other-ruler`
    - 分支条件（`condition`）：
      - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`player`；字段（`field`）：君主（`ruler`）；比较关系（`operator`）：不等于（`ne`）；确定性（`certainty`）：来源明示（`stated`）
        - 取值（`value`）：`曹操`
    - 按来源描述排列的结果（`orderedResults`）：
      - 第 1 项：
        - 结果效果（`kind=effect`）；操作（`operation`）：设为（`set`）；作用对象（`target`）：`郭嘉`
          - 参数（`values`）：
            - 忠诚（`loyalty`）：100
            - 功绩（`merit`）：500

### 不确定性与来源限定（`uncertainties`）

- 空列表（0 项）

<a id="gamersky.chain-plot-banquet"></a>

## 观察 08：连还计 1 - 酒宴

- 事件标识（`eventId`）：`chain-plot-banquet`
- 观察标识（`observationId`）：`gamersky.chain-plot-banquet`
- 原文标题（`title`）：连还计 1 - 酒宴
- 来源标识（`sourceId`）：`gamersky-02`
- 来源网址（`sourceURL`）：[https://www.gamersky.com/handbook/200809/124174_2.shtml](https://www.gamersky.com/handbook/200809/124174_2.shtml)
- 来源章节（`sourceSection`）：连还计 1 - 酒宴
- 来源节序（`sourceOrdinal`）：3
- 版本范围（`version`）：
  - 游戏（`game`）：`SAN11`
  - 版本类型（`edition`）：未指定（`unspecified`）
  - 平台（`platform`）：未指定（`unspecified`）
  - 补丁（`patch`）：未指定（`unspecified`）
- 证据性质（`evidence`）：公开攻略转录（`public-guide-transcription`）
- 仅发生一次信息（`onceOnly`）：
  - 状态（`status`）：未说明（`not-stated`）
  - 标志标识（`flagId`）：未提供（null）
- 来源行定位：此观察未提供 `sourceLocator`；保留网址、章节和来源节序作为定位信息

### 触发条件（`conditions`）

- 第 1 项：
  - 事实条件（`kind=fact`）；类别（`category`）：日期（`date`）；对象（`subject`）：`calendar`；字段（`field`）：当前年月（`current-month`）；比较关系（`operator`）：大于或等于（`gte`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：192、1
- 第 2 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`player`；字段（`field`）：君主（`ruler`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：`董卓`
- 第 3 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`董卓`；字段（`field`）：城市数（`city-count`）；比较关系（`operator`）：大于或等于（`gte`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：2
- 第 4 项：
  - 事实条件（`kind=fact`）；类别（`category`）：皇帝（`emperor`）；对象（`subject`）：`董卓`；字段（`field`）：拥立汉帝（`supports-han-emperor`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：是（true）
- 第 5 项：
  - 事实条件（`kind=fact`）；类别（`category`）：游戏设置（`settings`）；对象（`subject`）：游戏设置（`settings`）；字段（`field`）：女性武将模式（`female-officers`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：`historical`
- 第 6 项：
  - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：列表（按来源次序）：`吕布`；字段（`field`）：配偶（`spouse`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：未提供（null）
- 第 7 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`董卓`；字段（`field`）：武将列表（`officers`）；比较关系（`operator`）：包含全部（`contains-all`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：`王允`、`吕布`
- 第 8 项：
  - 事实条件（`kind=fact`）；类别（`category`）：任务或行动（`mission`）；对象（`subject`）：列表（按来源次序）：`董卓`、`王允`、`吕布`；字段（`field`）：正在执行任务（`on-mission`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：否（false）
- 第 9 项：
  - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：`貂蝉`；字段（`field`）：状态（`status`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：`undiscovered`
- 第 10 项：
  - 事实条件（`kind=fact`）；类别（`category`）：城市（`city`）；对象（`subject`）：`董卓.current-city`；字段（`field`）：治安（`public-order`）；比较关系（`operator`）：小于（`lt`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：75

### 前置事件关系（`prerequisites`）

- 空列表（0 项）

### 结果与分支（仅来源描述顺序）（`orderedResults`）

- 第 1 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：加入势力（`join-force`）；作用对象（`target`）：`貂蝉`
    - 参数（`values`）：
      - 势力（`force`）：`player`
- 第 2 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：设置临时状态（`set-temporary-status`）；作用对象（`target`）：`貂蝉`
    - 参数（`values`）：
      - 状态（`status`）：暂不可分配（`unavailable-for-assignment`）
      - 持续时间（`duration`）：
        - 取值（`value`）：18
        - 单位（`unit`）：月（`months`）

### 不确定性与来源限定（`uncertainties`）

- 空列表（0 项）

<a id="gamersky.chain-plot-pavilion"></a>

## 观察 09：连还计 2 - 凤仪亭

- 事件标识（`eventId`）：`chain-plot-pavilion`
- 观察标识（`observationId`）：`gamersky.chain-plot-pavilion`
- 原文标题（`title`）：连还计 2 - 凤仪亭
- 来源标识（`sourceId`）：`gamersky-02`
- 来源网址（`sourceURL`）：[https://www.gamersky.com/handbook/200809/124174_2.shtml](https://www.gamersky.com/handbook/200809/124174_2.shtml)
- 来源章节（`sourceSection`）：连还计 2 - 凤仪亭
- 来源节序（`sourceOrdinal`）：4
- 版本范围（`version`）：
  - 游戏（`game`）：`SAN11`
  - 版本类型（`edition`）：未指定（`unspecified`）
  - 平台（`platform`）：未指定（`unspecified`）
  - 补丁（`patch`）：未指定（`unspecified`）
- 证据性质（`evidence`）：公开攻略转录（`public-guide-transcription`）
- 仅发生一次信息（`onceOnly`）：
  - 状态（`status`）：未说明（`not-stated`）
  - 标志标识（`flagId`）：未提供（null）
- 来源行定位：此观察未提供 `sourceLocator`；保留网址、章节和来源节序作为定位信息

### 触发条件（`conditions`）

- 第 1 项：
  - 事实条件（`kind=fact`）；类别（`category`）：前置事件（`prerequisite`）；对象（`subject`）：`chain-plot-banquet`；字段（`field`）：事件发生后经过时间（`time-since-occurrence`）；比较关系（`operator`）：大于或等于（`gte`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：
      - 取值（`value`）：30
      - 单位（`unit`）：日（`days`）
- 第 2 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`player`；字段（`field`）：君主（`ruler`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：`董卓`
- 第 3 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`董卓`；字段（`field`）：城市数（`city-count`）；比较关系（`operator`）：大于或等于（`gte`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：2
- 第 4 项：
  - 事实条件（`kind=fact`）；类别（`category`）：皇帝（`emperor`）；对象（`subject`）：`董卓`；字段（`field`）：拥立汉帝（`supports-han-emperor`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：是（true）
- 第 5 项：
  - 事实条件（`kind=fact`）；类别（`category`）：游戏设置（`settings`）；对象（`subject`）：游戏设置（`settings`）；字段（`field`）：女性武将模式（`female-officers`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：`historical`
- 第 6 项：
  - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：列表（按来源次序）：`吕布`；字段（`field`）：配偶（`spouse`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：未提供（null）
- 第 7 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`董卓`；字段（`field`）：武将列表（`officers`）；比较关系（`operator`）：包含全部（`contains-all`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：`王允`、`吕布`
- 第 8 项：
  - 事实条件（`kind=fact`）；类别（`category`）：任务或行动（`mission`）；对象（`subject`）：列表（按来源次序）：`董卓`、`王允`、`吕布`；字段（`field`）：正在执行任务（`on-mission`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：否（false）
- 第 9 项：
  - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：`貂蝉`；字段（`field`）：临时状态（`temporary-status`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：暂不可分配（`unavailable-for-assignment`）

### 前置事件关系（`prerequisites`）

- 第 1 项：
  - 事件标识（`eventId`）：`chain-plot-banquet`
  - 前置要求（`requirement`）：必需前置（`required`）
  - 间隔（`delay`）：
    - 比较关系（`operator`）：大于或等于（`gte`）
    - 取值（`value`）：30
    - 单位（`unit`）：日（`days`）

### 结果与分支（仅来源描述顺序）（`orderedResults`）

- 第 1 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：来源明示无变化（`no-described-change`）；作用对象（`target`）：`event`
    - 参数（`values`）：空属性集（0 项）

### 不确定性与来源限定（`uncertainties`）

- 空列表（0 项）

<a id="gamersky.chain-plot-assassination"></a>

## 观察 10：连还计 3 - 谋杀

- 事件标识（`eventId`）：`chain-plot-assassination`
- 观察标识（`observationId`）：`gamersky.chain-plot-assassination`
- 原文标题（`title`）：连还计 3 - 谋杀
- 来源标识（`sourceId`）：`gamersky-02`
- 来源网址（`sourceURL`）：[https://www.gamersky.com/handbook/200809/124174_2.shtml](https://www.gamersky.com/handbook/200809/124174_2.shtml)
- 来源章节（`sourceSection`）：连还计 3 - 谋杀
- 来源节序（`sourceOrdinal`）：5
- 版本范围（`version`）：
  - 游戏（`game`）：`SAN11`
  - 版本类型（`edition`）：未指定（`unspecified`）
  - 平台（`platform`）：未指定（`unspecified`）
  - 补丁（`patch`）：未指定（`unspecified`）
- 证据性质（`evidence`）：公开攻略转录（`public-guide-transcription`）
- 仅发生一次信息（`onceOnly`）：
  - 状态（`status`）：未说明（`not-stated`）
  - 标志标识（`flagId`）：未提供（null）
- 来源行定位：此观察未提供 `sourceLocator`；保留网址、章节和来源节序作为定位信息

### 触发条件（`conditions`）

- 第 1 项：
  - 事实条件（`kind=fact`）；类别（`category`）：前置事件（`prerequisite`）；对象（`subject`）：`chain-plot-pavilion`；字段（`field`）：事件发生后经过时间（`time-since-occurrence`）；比较关系（`operator`）：大于或等于（`gte`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：
      - 取值（`value`）：30
      - 单位（`unit`）：日（`days`）
- 第 2 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`player`；字段（`field`）：君主（`ruler`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：`董卓`
- 第 3 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`董卓`；字段（`field`）：城市数（`city-count`）；比较关系（`operator`）：大于或等于（`gte`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：2
- 第 4 项：
  - 事实条件（`kind=fact`）；类别（`category`）：皇帝（`emperor`）；对象（`subject`）：`董卓`；字段（`field`）：拥立汉帝（`supports-han-emperor`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：是（true）
- 第 5 项：
  - 事实条件（`kind=fact`）；类别（`category`）：游戏设置（`settings`）；对象（`subject`）：游戏设置（`settings`）；字段（`field`）：女性武将模式（`female-officers`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：`historical`
- 第 6 项：
  - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：列表（按来源次序）：`吕布`；字段（`field`）：配偶（`spouse`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：未提供（null）
- 第 7 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`董卓`；字段（`field`）：武将列表（`officers`）；比较关系（`operator`）：包含全部（`contains-all`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：`王允`、`吕布`
- 第 8 项：
  - 事实条件（`kind=fact`）；类别（`category`）：任务或行动（`mission`）；对象（`subject`）：列表（按来源次序）：`董卓`、`王允`、`吕布`；字段（`field`）：正在执行任务（`on-mission`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：否（false）
- 第 9 项：
  - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：`貂蝉`；字段（`field`）：临时状态（`temporary-status`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：暂不可分配（`unavailable-for-assignment`）

### 前置事件关系（`prerequisites`）

- 第 1 项：
  - 事件标识（`eventId`）：`chain-plot-pavilion`
  - 前置要求（`requirement`）：必需前置（`required`）
  - 间隔（`delay`）：
    - 比较关系（`operator`）：大于或等于（`gte`）
    - 取值（`value`）：30
    - 单位（`unit`）：日（`days`）

### 结果与分支（仅来源描述顺序）（`orderedResults`）

- 第 1 项：
  - 分支（`branch`）（节点种类（`kind`））
    - 分支标识（`branchId`）：`split-if-general-present`
    - 分支条件（`condition`）：
      - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`original-董卓-force`；字段（`field`）：武将列表（`officers`）；比较关系（`operator`）：包含任一（`contains-any`）；确定性（`certainty`）：来源明示（`stated`）
        - 取值（`value`）：列表（按来源次序）：`李傕`、`郭汜`、`张济`、`樊稠`
    - 按来源描述排列的结果（`orderedResults`）：
      - 第 1 项：
        - 结果效果（`kind=effect`）；操作（`operation`）：分裂势力（`split-force`）；作用对象（`target`）：`董卓`
          - 参数（`values`）：
            - 继承人候选（`successorChoices`）：列表（按来源次序）：`吕布`、`李傕`、`郭汜`、`张济`、`樊稠`
- 第 2 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：加入势力（`join-force`）；作用对象（`target`）：`貂蝉`
    - 参数（`values`）：
      - 势力（`force`）：`player`
- 第 3 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：移动（`move`）；作用对象（`target`）：`貂蝉`
    - 参数（`values`）：
      - 目的地（`destination`）：`吕布.current-city`
- 第 4 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：设为（`set`）；作用对象（`target`）：`貂蝉`
    - 参数（`values`）：
      - 忠诚（`loyalty`）：100
- 第 5 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：结婚（`marry`）；作用对象（`target`）：列表（按来源次序）：`貂蝉`、`吕布`
    - 参数（`values`）：空属性集（0 项）
- 第 6 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：死亡（`death`）；作用对象（`target`）：列表（按来源次序）：`董卓`、`李儒`
    - 参数（`values`）：空属性集（0 项）
- 第 7 项：
  - 分支（`branch`）（节点种类（`kind`））
    - 分支标识（`branchId`）：`split-destinations`
    - 分支条件（`condition`）：
      - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`original-董卓-force`；字段（`field`）：武将列表（`officers`）；比较关系（`operator`）：包含任一（`contains-any`）；确定性（`certainty`）：来源明示（`stated`）
        - 取值（`value`）：列表（按来源次序）：`李傕`、`郭汜`、`张济`、`樊稠`
    - 按来源描述排列的结果（`orderedResults`）：
      - 第 1 项：
        - 结果效果（`kind=effect`）；操作（`operation`）：势力迁移（`relocate-force`）；作用对象（`target`）：`吕布`
          - 参数（`values`）：
            - 候选城市（`candidateCities`）：列表（按来源次序）：`洛阳`、`陈留`、`宛`、`濮阳`
            - 合资格的城市持有者（`eligibleOwner`）：`original-董卓-force`
            - 选择方法（`selection`）：`most-troops`
      - 第 2 项：
        - 结果效果（`kind=effect`）；操作（`operation`）：势力迁移（`relocate-force`）；作用对象（`target`）：`li-jue-group`
          - 参数（`values`）：
            - 候选城市（`candidateCities`）：列表（按来源次序）：`长安`、`安定`、`天水`
            - 合资格的城市持有者（`eligibleOwner`）：`original-董卓-force`
            - 选择方法（`selection`）：`most-troops`
      - 第 3 项：
        - 结果效果（`kind=effect`）；操作（`operation`）：转移武将（`transfer-officers`）；作用对象（`target`）：`original-董卓-force`
          - 参数（`values`）：
            - 目的地（`destination`）：`吕布`
            - 武将（`officers`）：列表（按来源次序）：`貂蝉`、`张辽`、`高顺`、`侯成`、`魏续`、`宋宪`、`曹性`、`王允`、`李肃`
            - 附加事项（`also`）：blood-related officers; reference person unspecified
      - 第 4 项：
        - 结果效果（`kind=effect`）；操作（`operation`）：转移武将（`transfer-officers`）；作用对象（`target`）：`original-董卓-force`
          - 参数（`values`）：
            - 目的地（`destination`）：`li-jue-group`
            - 武将（`officers`）：`remaining`
- 第 8 项：
  - 分支（`branch`）（节点种类（`kind`））
    - 分支标识（`branchId`）：`no-general-present`
    - 分支条件（`condition`）：
      - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`original-董卓-force`；字段（`field`）：武将列表（`officers`）；比较关系（`operator`）：全部不包含（`contains-none`）；确定性（`certainty`）：来源明示（`stated`）
        - 取值（`value`）：列表（按来源次序）：`李傕`、`郭汜`、`张济`、`樊稠`
    - 按来源描述排列的结果（`orderedResults`）：
      - 第 1 项：
        - 结果效果（`kind=effect`）；操作（`operation`）：继承势力（`inherit-force`）；作用对象（`target`）：`吕布`
          - 参数（`values`）：
            - 势力（`force`）：`董卓`

### 不确定性与来源限定（`uncertainties`）

- 第 1 项：Successor priority among the four generals, tied troop counts, empty city candidate pools and the kinship reference person are not specified.
- 第 2 项：Player successor choice and faction-specific ownership are not fully routed by this guide.

<a id="gamersky.marry-liu-bei-mi"></a>

## 观察 11：糜氏嫁刘备

- 事件标识（`eventId`）：`marry-liu-bei-mi`
- 观察标识（`observationId`）：`gamersky.marry-liu-bei-mi`
- 原文标题（`title`）：`糜氏嫁刘备`
- 来源标识（`sourceId`）：`gamersky-03`
- 来源网址（`sourceURL`）：[https://www.gamersky.com/handbook/200809/124174_3.shtml](https://www.gamersky.com/handbook/200809/124174_3.shtml)
- 来源章节（`sourceSection`）：`糜氏嫁刘备`
- 来源节序（`sourceOrdinal`）：1
- 版本范围（`version`）：
  - 游戏（`game`）：`SAN11`
  - 版本类型（`edition`）：未指定（`unspecified`）
  - 平台（`platform`）：未指定（`unspecified`）
  - 补丁（`patch`）：未指定（`unspecified`）
- 证据性质（`evidence`）：公开攻略转录（`public-guide-transcription`）
- 仅发生一次信息（`onceOnly`）：
  - 状态（`status`）：未说明（`not-stated`）
  - 标志标识（`flagId`）：未提供（null）
- 来源行定位：此观察未提供 `sourceLocator`；保留网址、章节和来源节序作为定位信息

### 触发条件（`conditions`）

- 第 1 项：
  - 事实条件（`kind=fact`）；类别（`category`）：日期（`date`）；对象（`subject`）：剧本（`scenario`）；字段（`field`）：剧本开始年月（`start-month`）；比较关系（`operator`）：指定月份之前，边界未说明（`before-month`）；确定性（`certainty`）：月份边界未说明（`month-boundary-unspecified`）
    - 取值（`value`）：列表（按来源次序）：196、12
- 第 2 项：
  - 事实条件（`kind=fact`）；类别（`category`）：日期（`date`）；对象（`subject`）：剧本（`scenario`）；字段（`field`）：剧本经过日数（`elapsed-days`）；比较关系（`operator`）：大于或等于（`gte`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：30
- 第 3 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`刘备`；字段（`field`）：存在（`exists`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：是（true）
- 第 4 项：
  - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：列表（按来源次序）：`糜氏`、`刘备`；字段（`field`）：配偶（`spouse`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：未提供（null）
- 第 5 项：
  - 事实条件（`kind=fact`）；类别（`category`）：游戏设置（`settings`）；对象（`subject`）：游戏设置（`settings`）；字段（`field`）：女性武将模式（`female-officers`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：`historical`
- 第 6 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`刘备`；字段（`field`）：武将列表（`officers`）；比较关系（`operator`）：包含全部（`contains-all`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：`糜竺`
- 第 7 项：
  - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：列表（按来源次序）：`糜氏`；字段（`field`）：已达登场年龄（`debut-age-reached`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：是（true）
- 第 8 项：
  - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：列表（按来源次序）：`糜氏`；字段（`field`）：状态（`status`）；比较关系（`operator`）：每一项均属于（`each-in`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：`free`、`undiscovered`
- 第 9 项：
  - 事实条件（`kind=fact`）；类别（`category`）：城市（`city`）；对象（`subject`）：`刘备`；字段（`field`）：持有城市（`cities`）；比较关系（`operator`）：包含全部（`contains-all`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：`下邳`、`小沛`
- 第 10 项：
  - 条件后果（`if`）（节点种类（`kind`））
    - 分支条件（`condition`）：
      - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`player`；字段（`field`）：君主（`ruler`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
        - 取值（`value`）：`刘备`
    - 条件成立时的后果（`consequence`）：
      - 全部成立（`all`）（节点种类（`kind`））
        - 逻辑：本组各子项均成立；仅表示来源的分组，不引入调度规则
        - 子项（`items`）：
          - 第 1 项：
            - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：`糜竺`；字段（`field`）：功绩（`merit`）；比较关系（`operator`）：大于（`gt`）；确定性（`certainty`）：来源明示（`stated`）
              - 取值（`value`）：10000
          - 第 2 项：
            - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：`糜竺`；字段（`field`）：忠诚（`loyalty`）；比较关系（`operator`）：大于（`gt`）；确定性（`certainty`）：来源明示（`stated`）
              - 取值（`value`）：95
- 第 11 项：
  - 事实条件（`kind=fact`）；类别（`category`）：城市（`city`）；对象（`subject`）：列表（按来源次序）：`刘备`、`糜竺`；字段（`field`）：当前所在城市（`current-city`）；比较关系（`operator`）：全部相同（`all-equal`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：是（true）
- 第 12 项：
  - 事实条件（`kind=fact`）；类别（`category`）：任务或行动（`mission`）；对象（`subject`）：列表（按来源次序）：`刘备`、`糜竺`；字段（`field`）：正在执行任务（`on-mission`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：否（false）

### 前置事件关系（`prerequisites`）

- 空列表（0 项）

### 结果与分支（仅来源描述顺序）（`orderedResults`）

- 第 1 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：结婚（`marry`）；作用对象（`target`）：列表（按来源次序）：`刘备`、`糜氏`
    - 参数（`values`）：空属性集（0 项）
- 第 2 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：设为（`set`）；作用对象（`target`）：`糜竺`
    - 参数（`values`）：
      - 忠诚（`loyalty`）：100
- 第 3 项：
  - 分支（`branch`）（节点种类（`kind`））
    - 分支标识（`branchId`）：`player-liu-bei`
    - 分支条件（`condition`）：
      - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`player`；字段（`field`）：君主（`ruler`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
        - 取值（`value`）：`刘备`
    - 按来源描述排列的结果（`orderedResults`）：
      - 第 1 项：
        - 结果效果（`kind=effect`）；操作（`operation`）：设为（`set`）；作用对象（`target`）：`糜氏`
          - 参数（`values`）：
            - 忠诚（`loyalty`）：100
            - 功绩（`merit`）：1000

### 不确定性与来源限定（`uncertainties`）

- 空列表（0 项）

<a id="gamersky.sun-ce-sortie"></a>

## 观察 12：孙策出阵

- 事件标识（`eventId`）：`sun-ce-sortie`
- 观察标识（`observationId`）：`gamersky.sun-ce-sortie`
- 原文标题（`title`）：`孙策出阵`
- 来源标识（`sourceId`）：`gamersky-03`
- 来源网址（`sourceURL`）：[https://www.gamersky.com/handbook/200809/124174_3.shtml](https://www.gamersky.com/handbook/200809/124174_3.shtml)
- 来源章节（`sourceSection`）：`孙策出阵`
- 来源节序（`sourceOrdinal`）：2
- 版本范围（`version`）：
  - 游戏（`game`）：`SAN11`
  - 版本类型（`edition`）：未指定（`unspecified`）
  - 平台（`platform`）：未指定（`unspecified`）
  - 补丁（`patch`）：未指定（`unspecified`）
- 证据性质（`evidence`）：公开攻略转录（`public-guide-transcription`）
- 仅发生一次信息（`onceOnly`）：
  - 状态（`status`）：未说明（`not-stated`）
  - 标志标识（`flagId`）：未提供（null）
- 来源行定位：此观察未提供 `sourceLocator`；保留网址、章节和来源节序作为定位信息

### 触发条件（`conditions`）

- 第 1 项：
  - 事实条件（`kind=fact`）；类别（`category`）：剧本（`scenario`）；对象（`subject`）：剧本（`scenario`）；字段（`field`）：编号（`number`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：3
- 第 2 项：
  - 事实条件（`kind=fact`）；类别（`category`）：日期（`date`）；对象（`subject`）：剧本（`scenario`）；字段（`field`）：剧本经过日数（`elapsed-days`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：0
- 第 3 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`player`；字段（`field`）：君主（`ruler`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：`孙策`
- 第 4 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`孙策`；字段（`field`）：武将列表（`officers`）；比较关系（`operator`）：包含全部（`contains-all`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：`周瑜`、`朱治`
- 第 5 项：
  - 事实条件（`kind=fact`）；类别（`category`）：任务或行动（`mission`）；对象（`subject`）：列表（按来源次序）：`孙策`、`周瑜`、`朱治`；字段（`field`）：正在执行任务（`on-mission`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：否（false）

### 前置事件关系（`prerequisites`）

- 空列表（0 项）

### 结果与分支（仅来源描述顺序）（`orderedResults`）

- 第 1 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：来源明示无变化（`no-described-change`）；作用对象（`target`）：`event`
    - 参数（`values`）：空属性集（0 项）

### 不确定性与来源限定（`uncertainties`）

- 空列表（0 项）

<a id="gamersky.recruit-sun-ce-five"></a>

## 观察 13：小霸王孙策

- 事件标识（`eventId`）：`recruit-sun-ce-five`
- 观察标识（`observationId`）：`gamersky.recruit-sun-ce-five`
- 原文标题（`title`）：`小霸王孙策`
- 来源标识（`sourceId`）：`gamersky-03`
- 来源网址（`sourceURL`）：[https://www.gamersky.com/handbook/200809/124174_3.shtml](https://www.gamersky.com/handbook/200809/124174_3.shtml)
- 来源章节（`sourceSection`）：`小霸王孙策`
- 来源节序（`sourceOrdinal`）：3
- 版本范围（`version`）：
  - 游戏（`game`）：`SAN11`
  - 版本类型（`edition`）：未指定（`unspecified`）
  - 平台（`platform`）：未指定（`unspecified`）
  - 补丁（`patch`）：未指定（`unspecified`）
- 证据性质（`evidence`）：公开攻略转录（`public-guide-transcription`）
- 仅发生一次信息（`onceOnly`）：
  - 状态（`status`）：未说明（`not-stated`）
  - 标志标识（`flagId`）：未提供（null）
- 来源行定位：此观察未提供 `sourceLocator`；保留网址、章节和来源节序作为定位信息

### 触发条件（`conditions`）

- 第 1 项：
  - 事实条件（`kind=fact`）；类别（`category`）：日期（`date`）；对象（`subject`）：剧本（`scenario`）；字段（`field`）：剧本开始年月（`start-month`）；比较关系（`operator`）：指定月份之前，边界未说明（`before-month`）；确定性（`certainty`）：月份边界未说明（`month-boundary-unspecified`）
    - 取值（`value`）：列表（按来源次序）：194、12
- 第 2 项：
  - 事实条件（`kind=fact`）；类别（`category`）：日期（`date`）；对象（`subject`）：剧本（`scenario`）；字段（`field`）：剧本经过日数（`elapsed-days`）；比较关系（`operator`）：大于或等于（`gte`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：30
- 第 3 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`player`；字段（`field`）：君主（`ruler`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：`孙策`
- 第 4 项：
  - 事实条件（`kind=fact`）；类别（`category`）：城市（`city`）；对象（`subject`）：`孙策`；字段（`field`）：持有城市（`cities`）；比较关系（`operator`）：包含全部（`contains-all`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：`柴桑`、`建业`、`吴`
- 第 5 项：
  - 事实条件（`kind=fact`）；类别（`category`）：任务或行动（`mission`）；对象（`subject`）：列表（按来源次序）：`孙策`；字段（`field`）：正在执行任务（`on-mission`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：否（false）
- 第 6 项：
  - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：列表（按来源次序）：`蒋钦`、`周泰`、`陈武`、`淩操`、`董袭`；字段（`field`）：已达登场年龄（`debut-age-reached`）；比较关系（`operator`）：至少一项等于（`any-eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：是（true）
- 第 7 项：
  - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：列表（按来源次序）：`蒋钦`、`周泰`、`陈武`、`淩操`、`董袭`；字段（`field`）：状态（`status`）；比较关系（`operator`）：至少一项属于（`any-in`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：`free`、`undiscovered`

### 前置事件关系（`prerequisites`）

- 空列表（0 项）

### 结果与分支（仅来源描述顺序）（`orderedResults`）

- 第 1 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：符合条件的武将加入（`join-eligible-officers`）；作用对象（`target`）：列表（按来源次序）：`蒋钦`、`周泰`、`陈武`、`淩操`、`董袭`
    - 参数（`values`）：
      - 势力（`force`）：`孙策`
      - 适用条件（`eligibility`）：列表（按来源次序）：`free`、`undiscovered`
      - 忠诚（`loyalty`）：100
      - 功绩（`merit`）：1000

### 不确定性与来源限定（`uncertainties`）

- 第 1 项：The two source existential conditions are separately stated; no same-candidate matching rule is supplied.

<a id="gamersky.recommend-two-zhangs"></a>

## 观察 14：周瑜推举二张

- 事件标识（`eventId`）：`recommend-two-zhangs`
- 观察标识（`observationId`）：`gamersky.recommend-two-zhangs`
- 原文标题（`title`）：`周瑜推举二张`
- 来源标识（`sourceId`）：`gamersky-03`
- 来源网址（`sourceURL`）：[https://www.gamersky.com/handbook/200809/124174_3.shtml](https://www.gamersky.com/handbook/200809/124174_3.shtml)
- 来源章节（`sourceSection`）：`周瑜推举二张`
- 来源节序（`sourceOrdinal`）：4
- 版本范围（`version`）：
  - 游戏（`game`）：`SAN11`
  - 版本类型（`edition`）：未指定（`unspecified`）
  - 平台（`platform`）：未指定（`unspecified`）
  - 补丁（`patch`）：未指定（`unspecified`）
- 证据性质（`evidence`）：公开攻略转录（`public-guide-transcription`）
- 仅发生一次信息（`onceOnly`）：
  - 状态（`status`）：未说明（`not-stated`）
  - 标志标识（`flagId`）：未提供（null）
- 来源行定位：此观察未提供 `sourceLocator`；保留网址、章节和来源节序作为定位信息

### 触发条件（`conditions`）

- 第 1 项：
  - 事实条件（`kind=fact`）；类别（`category`）：日期（`date`）；对象（`subject`）：剧本（`scenario`）；字段（`field`）：剧本开始年月（`start-month`）；比较关系（`operator`）：指定月份之前，边界未说明（`before-month`）；确定性（`certainty`）：月份边界未说明（`month-boundary-unspecified`）
    - 取值（`value`）：列表（按来源次序）：194、12
- 第 2 项：
  - 事实条件（`kind=fact`）；类别（`category`）：日期（`date`）；对象（`subject`）：剧本（`scenario`）；字段（`field`）：剧本经过日数（`elapsed-days`）；比较关系（`operator`）：大于或等于（`gte`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：30
- 第 3 项：
  - 事实条件（`kind=fact`）；类别（`category`）：城市（`city`）；对象（`subject`）：`player`；字段（`field`）：持有城市（`cities`）；比较关系（`operator`）：包含全部（`contains-all`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：`柴桑`、`建业`、`庐江`
- 第 4 项：
  - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：列表（按来源次序）：`张昭`、`张纮`；字段（`field`）：已达登场年龄（`debut-age-reached`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：是（true）
- 第 5 项：
  - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：列表（按来源次序）：`张昭`、`张纮`；字段（`field`）：状态（`status`）；比较关系（`operator`）：每一项均属于（`each-in`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：`free`、`undiscovered`
- 第 6 项：
  - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：列表（按来源次序）：`张昭`、`张纮`；字段（`field`）：与玩家君主的相性（`compatibility-to-player-ruler`）；比较关系（`operator`）：相近，阈值按来源限定（`close`）；确定性（`certainty`）：阈值未说明（`threshold-unspecified`）
    - 取值（`value`）：是（true）
- 第 7 项：
  - 全部成立（`all`）（节点种类（`kind`））
    - 逻辑：本组各子项均成立；仅表示来源的分组，不引入调度规则
    - 子项（`items`）：
      - 第 1 项：
        - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：列表（按来源次序）：`张昭`、`张纮`；字段（`field`）：厌恶武将列表（`disliked-officers`）；比较关系（`operator`）：不包含（`not-contains`）；确定性（`certainty`）：来源明示（`stated`）
          - 取值（`value`）：`player-ruler`
      - 第 2 项：
        - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：`player-ruler`；字段（`field`）：厌恶武将列表（`disliked-officers`）；比较关系（`operator`）：全部不包含（`contains-none`）；确定性（`certainty`）：来源明示（`stated`）
          - 取值（`value`）：列表（按来源次序）：`张昭`、`张纮`
- 第 8 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`player`；字段（`field`）：军师（`strategist`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：`周瑜`
- 第 9 项：
  - 事实条件（`kind=fact`）；类别（`category`）：城市（`city`）；对象（`subject`）：列表（按来源次序）：`player-ruler`、`周瑜`；字段（`field`）：当前所在城市（`current-city`）；比较关系（`operator`）：全部相同（`all-equal`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：是（true）
- 第 10 项：
  - 全部成立（`all`）（节点种类（`kind`））
    - 逻辑：本组各子项均成立；仅表示来源的分组，不引入调度规则
    - 子项（`items`）：
      - 第 1 项：
        - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：列表（按来源次序）：`周瑜`；字段（`field`）：厌恶武将列表（`disliked-officers`）；比较关系（`operator`）：不包含（`not-contains`）；确定性（`certainty`）：来源明示（`stated`）
          - 取值（`value`）：`player-ruler`
      - 第 2 项：
        - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：`player-ruler`；字段（`field`）：厌恶武将列表（`disliked-officers`）；比较关系（`operator`）：全部不包含（`contains-none`）；确定性（`certainty`）：来源明示（`stated`）
          - 取值（`value`）：列表（按来源次序）：`周瑜`
- 第 11 项：
  - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：`周瑜`；字段（`field`）：忠诚（`loyalty`）；比较关系（`operator`）：大于（`gt`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：95
- 第 12 项：
  - 事实条件（`kind=fact`）；类别（`category`）：任务或行动（`mission`）；对象（`subject`）：列表（按来源次序）：`player-ruler`、`周瑜`；字段（`field`）：正在执行任务（`on-mission`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：否（false）

### 前置事件关系（`prerequisites`）

- 空列表（0 项）

### 结果与分支（仅来源描述顺序）（`orderedResults`）

- 第 1 项：
  - 分支（`branch`）（节点种类（`kind`））
    - 分支标识（`branchId`）：`sun-ce`
    - 分支条件（`condition`）：
      - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`player`；字段（`field`）：君主（`ruler`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
        - 取值（`value`）：`孙策`
    - 按来源描述排列的结果（`orderedResults`）：
      - 第 1 项：
        - 结果效果（`kind=effect`）；操作（`operation`）：增加（`add`）；作用对象（`target`）：`周瑜`
          - 参数（`values`）：
            - 功绩（`merit`）：500
      - 第 2 项：
        - 结果效果（`kind=effect`）；操作（`operation`）：加入势力（`join-force`）；作用对象（`target`）：列表（按来源次序）：`张昭`、`张纮`
          - 参数（`values`）：
            - 势力（`force`）：`player`
      - 第 3 项：
        - 结果效果（`kind=effect`）；操作（`operation`）：设为（`set`）；作用对象（`target`）：列表（按来源次序）：`张昭`、`张纮`
          - 参数（`values`）：
            - 忠诚（`loyalty`）：100
            - 功绩（`merit`）：4000
- 第 2 项：
  - 分支（`branch`）（节点种类（`kind`））
    - 分支标识（`branchId`）：`other-ruler-loses`
    - 分支条件（`condition`）：
      - 全部成立（`all`）（节点种类（`kind`））
        - 逻辑：本组各子项均成立；仅表示来源的分组，不引入调度规则
        - 子项（`items`）：
          - 第 1 项：
            - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`player`；字段（`field`）：君主（`ruler`）；比较关系（`operator`）：不等于（`ne`）；确定性（`certainty`）：来源明示（`stated`）
              - 取值（`value`）：`孙策`
          - 第 2 项：
            - 事实条件（`kind=fact`）；类别（`category`）：其他（`other`）；对象（`subject`）：`debate`；字段（`field`）：玩家一方的结果（`player-side-outcome`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
              - 取值（`value`）：`loss`
    - 按来源描述排列的结果（`orderedResults`）：
      - 第 1 项：
        - 结果效果（`kind=effect`）；操作（`operation`）：设为（`set`）；作用对象（`target`）：列表（按来源次序）：`张昭`、`张纮`
          - 参数（`values`）：
            - 状态（`status`）：在野（`free`）
      - 第 2 项：
        - 结果效果（`kind=effect`）；操作（`operation`）：来源仕官禁止表述存在歧义（`source-ambiguous-employment-ban`）；作用对象（`target`）：列表（按来源次序）：`张昭`、`张纮`
          - 参数（`values`）：
            - 君主（`ruler`）：`player-ruler`
            - 持续时间（`duration`）：
              - 取值（`value`）：12
              - 单位（`unit`）：月（`months`）
            - 方向（`direction`）：source reverses the usual officer/ruler relation
- 第 3 项：
  - 分支（`branch`）（节点种类（`kind`））
    - 分支标识（`branchId`）：`other-ruler-wins`
    - 分支条件（`condition`）：
      - 全部成立（`all`）（节点种类（`kind`））
        - 逻辑：本组各子项均成立；仅表示来源的分组，不引入调度规则
        - 子项（`items`）：
          - 第 1 项：
            - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`player`；字段（`field`）：君主（`ruler`）；比较关系（`operator`）：不等于（`ne`）；确定性（`certainty`）：来源明示（`stated`）
              - 取值（`value`）：`孙策`
          - 第 2 项：
            - 事实条件（`kind=fact`）；类别（`category`）：其他（`other`）；对象（`subject`）：`debate`；字段（`field`）：玩家一方的结果（`player-side-outcome`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
              - 取值（`value`）：`win`
    - 按来源描述排列的结果（`orderedResults`）：
      - 第 1 项：
        - 结果效果（`kind=effect`）；操作（`operation`）：增加（`add`）；作用对象（`target`）：`周瑜`
          - 参数（`values`）：
            - 功绩（`merit`）：300
      - 第 2 项：
        - 结果效果（`kind=effect`）；操作（`operation`）：加入势力（`join-force`）；作用对象（`target`）：列表（按来源次序）：`张昭`、`张纮`
          - 参数（`values`）：
            - 势力（`force`）：`player`
      - 第 3 项：
        - 结果效果（`kind=effect`）；操作（`operation`）：设为（`set`）；作用对象（`target`）：列表（按来源次序）：`张昭`、`张纮`
          - 参数（`values`）：
            - 忠诚（`loyalty`）：100
            - 功绩（`merit`）：500

### 不确定性与来源限定（`uncertainties`）

- 第 1 项：The failed-debate employment-ban sentence reverses subject/object; not silently corrected.
- 第 2 项：The strategist condition has an extra ruler word; interpreting this role is disclosed.

<a id="gamersky.marry-two-qiaos"></a>

## 观察 15：二乔结婚

- 事件标识（`eventId`）：`marry-two-qiaos`
- 观察标识（`observationId`）：`gamersky.marry-two-qiaos`
- 原文标题（`title`）：`二乔结婚`
- 来源标识（`sourceId`）：`gamersky-04`
- 来源网址（`sourceURL`）：[https://www.gamersky.com/handbook/200809/124174_4.shtml](https://www.gamersky.com/handbook/200809/124174_4.shtml)
- 来源章节（`sourceSection`）：`二乔结婚`
- 来源节序（`sourceOrdinal`）：1
- 版本范围（`version`）：
  - 游戏（`game`）：`SAN11`
  - 版本类型（`edition`）：未指定（`unspecified`）
  - 平台（`platform`）：未指定（`unspecified`）
  - 补丁（`patch`）：未指定（`unspecified`）
- 证据性质（`evidence`）：公开攻略转录（`public-guide-transcription`）
- 仅发生一次信息（`onceOnly`）：
  - 状态（`status`）：未说明（`not-stated`）
  - 标志标识（`flagId`）：未提供（null）
- 来源行定位：此观察未提供 `sourceLocator`；保留网址、章节和来源节序作为定位信息

### 触发条件（`conditions`）

- 第 1 项：
  - 事实条件（`kind=fact`）；类别（`category`）：日期（`date`）；对象（`subject`）：剧本（`scenario`）；字段（`field`）：剧本开始年月（`start-month`）；比较关系（`operator`）：指定月份之前，边界未说明（`before-month`）；确定性（`certainty`）：月份边界未说明（`month-boundary-unspecified`）
    - 取值（`value`）：列表（按来源次序）：198、12
- 第 2 项：
  - 事实条件（`kind=fact`）；类别（`category`）：日期（`date`）；对象（`subject`）：剧本（`scenario`）；字段（`field`）：剧本经过日数（`elapsed-days`）；比较关系（`operator`）：大于或等于（`gte`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：30
- 第 3 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`player`；字段（`field`）：君主（`ruler`）；比较关系（`operator`）：属于（`in`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：`孙坚`、`孙策`
- 第 4 项：
  - 事实条件（`kind=fact`）；类别（`category`）：城市（`city`）；对象（`subject`）：`sun-wu`；字段（`field`）：持有城市（`cities`）；比较关系（`operator`）：包含全部（`contains-all`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：`柴桑`、`建业`、`吴`、`会稽`
- 第 5 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`sun-wu`；字段（`field`）：武将列表（`officers`）；比较关系（`operator`）：包含全部（`contains-all`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：`孙策`、`周瑜`
- 第 6 项：
  - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：列表（按来源次序）：`孙策`、`周瑜`、`大乔`、`小乔`；字段（`field`）：配偶（`spouse`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：未提供（null）
- 第 7 项：
  - 事实条件（`kind=fact`）；类别（`category`）：游戏设置（`settings`）；对象（`subject`）：游戏设置（`settings`）；字段（`field`）：女性武将模式（`female-officers`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：`historical`
- 第 8 项：
  - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：列表（按来源次序）：`大乔`、`小乔`；字段（`field`）：已达登场年龄（`debut-age-reached`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：是（true）
- 第 9 项：
  - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：列表（按来源次序）：`大乔`、`小乔`；字段（`field`）：状态（`status`）；比较关系（`operator`）：每一项均属于（`each-in`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：`free`、`undiscovered`、`sun-wu-officer`
- 第 10 项：
  - 事实条件（`kind=fact`）；类别（`category`）：城市（`city`）；对象（`subject`）：列表（按来源次序）：`孙策`、`周瑜`；字段（`field`）：当前所在城市（`current-city`）；比较关系（`operator`）：全部相同（`all-equal`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：是（true）
- 第 11 项：
  - 事实条件（`kind=fact`）；类别（`category`）：任务或行动（`mission`）；对象（`subject`）：列表（按来源次序）：`孙策`、`周瑜`；字段（`field`）：正在执行任务（`on-mission`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：否（false）

### 前置事件关系（`prerequisites`）

- 空列表（0 项）

### 结果与分支（仅来源描述顺序）（`orderedResults`）

- 第 1 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：结婚（`marry`）；作用对象（`target`）：列表（按来源次序）：`孙策`、`大乔`
    - 参数（`values`）：空属性集（0 项）
- 第 2 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：结婚（`marry`）；作用对象（`target`）：列表（按来源次序）：`周瑜`、`小乔`
    - 参数（`values`）：空属性集（0 项）
- 第 3 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：设为（`set`）；作用对象（`target`）：列表（按来源次序）：`周瑜`、`大乔`、`小乔`
    - 参数（`values`）：
      - 忠诚（`loyalty`）：100
- 第 4 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：设为（`set`）；作用对象（`target`）：列表（按来源次序）：`大乔`、`小乔`
    - 参数（`values`）：
      - 功绩（`merit`）：1000

### 不确定性与来源限定（`uncertainties`）

- 空列表（0 项）

<a id="gamersky.yuan-shu-usurps"></a>

## 观察 16：伪帝僭称

- 事件标识（`eventId`）：`yuan-shu-usurps`
- 观察标识（`observationId`）：`gamersky.yuan-shu-usurps`
- 原文标题（`title`）：`伪帝僭称`
- 来源标识（`sourceId`）：`gamersky-04`
- 来源网址（`sourceURL`）：[https://www.gamersky.com/handbook/200809/124174_4.shtml](https://www.gamersky.com/handbook/200809/124174_4.shtml)
- 来源章节（`sourceSection`）：`伪帝僭称`
- 来源节序（`sourceOrdinal`）：2
- 版本范围（`version`）：
  - 游戏（`game`）：`SAN11`
  - 版本类型（`edition`）：未指定（`unspecified`）
  - 平台（`platform`）：未指定（`unspecified`）
  - 补丁（`patch`）：未指定（`unspecified`）
- 证据性质（`evidence`）：公开攻略转录（`public-guide-transcription`）
- 仅发生一次信息（`onceOnly`）：
  - 状态（`status`）：未说明（`not-stated`）
  - 标志标识（`flagId`）：未提供（null）
- 来源行定位：此观察未提供 `sourceLocator`；保留网址、章节和来源节序作为定位信息

### 触发条件（`conditions`）

- 第 1 项：
  - 事实条件（`kind=fact`）；类别（`category`）：日期（`date`）；对象（`subject`）：剧本（`scenario`）；字段（`field`）：剧本经过日数（`elapsed-days`）；比较关系（`operator`）：大于或等于（`gte`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：30
- 第 2 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`袁术`；字段（`field`）：存在（`exists`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：是（true）
- 第 3 项：
  - 事实条件（`kind=fact`）；类别（`category`）：皇帝（`emperor`）；对象（`subject`）：`袁术`；字段（`field`）：拥立汉帝（`supports-han-emperor`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：否（false）
- 第 4 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`袁术-force`；字段（`field`）：物品（`items`）；比较关系（`operator`）：包含（`contains`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：`玉玺`
- 第 5 项：
  - 事实条件（`kind=fact`）；类别（`category`）：爵位（`title`）；对象（`subject`）：`袁术-force`；字段（`field`）：爵位（`title`）；比较关系（`operator`）：不等于（`ne`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：皇帝（`emperor`）
- 第 6 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`袁术`；字段（`field`）：城市数（`city-count`）；比较关系（`operator`）：大于或等于（`gte`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：3
- 第 7 项：
  - 事实条件（`kind=fact`）；类别（`category`）：任务或行动（`mission`）；对象（`subject`）：列表（按来源次序）：`袁术`；字段（`field`）：正在执行任务（`on-mission`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：否（false）
- 第 8 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`other-forces`；字段（`field`）：国号（`state-name`）；比较关系（`operator`）：没有一项等于（`none-eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：`成`

### 前置事件关系（`prerequisites`）

- 空列表（0 项）

### 结果与分支（仅来源描述顺序）（`orderedResults`）

- 第 1 项：
  - 选择（`choice`）（节点种类（`kind`））
    - 选择标识（`choiceId`）：`claim-emperor`
    - 控制方（`controller`）：未说明（`not-stated`）
    - 电脑默认选项（`aiDefault`）：未提供（null）
    - 可选项（`options`）：
      - 第 1 项：
        - 选项标识（`optionId`）：`accept`
        - 按来源描述排列的结果（`orderedResults`）：
          - 第 1 项：
            - 结果效果（`kind=effect`）；操作（`operation`）：设为（`set`）；作用对象（`target`）：`袁术`
              - 参数（`values`）：
                - 爵位（`title`）：皇帝（`emperor`）
          - 第 2 项：
            - 结果效果（`kind=effect`）；操作（`operation`）：设为（`set`）；作用对象（`target`）：`袁术-force`
              - 参数（`values`）：
                - 国号（`stateName`）：`成`
          - 第 3 项：
            - 结果效果（`kind=effect`）；操作（`operation`）：降低友好度（`decrease-friendship`）；作用对象（`target`）：`袁术`
              - 参数（`values`）：
                - 作用对象筛选（`targetSelector`）：non-player emperor-supporters
                - 变化幅度（`magnitude`）：未指定（`unspecified`）
                - 方向（`direction`）：`other-to-subject`
          - 第 4 项：
            - 结果效果（`kind=effect`）；操作（`operation`）：解除同盟（`break-alliance`）；作用对象（`target`）：`袁术`
              - 参数（`values`）：
                - 作用对象筛选（`targetSelector`）：non-player emperor-supporters
          - 第 5 项：
            - 结果效果（`kind=effect`）；操作（`operation`）：降低友好度（`decrease-friendship`）；作用对象（`target`）：`袁术`
              - 参数（`values`）：
                - 作用对象筛选（`targetSelector`）：non-player Han-respecting rulers
                - 变化幅度（`magnitude`）：未指定（`unspecified`）
                - 方向（`direction`）：`other-to-subject`
          - 第 6 项：
            - 结果效果（`kind=effect`）；操作（`operation`）：解除同盟（`break-alliance`）；作用对象（`target`）：`袁术`
              - 参数（`values`）：
                - 作用对象筛选（`targetSelector`）：non-player Han-respecting rulers
          - 第 7 项：
            - 结果效果（`kind=effect`）；操作（`operation`）：降低友好度（`decrease-friendship`）；作用对象（`target`）：`袁术`
              - 参数（`values`）：
                - 作用对象筛选（`targetSelector`）：non-player rulers CaoCao LiuBei SunJian SunCe SunQuan LuBu YuanShao
                - 变化幅度（`magnitude`）：未指定（`unspecified`）
                - 方向（`direction`）：`other-to-subject`
          - 第 8 项：
            - 结果效果（`kind=effect`）；操作（`operation`）：解除同盟（`break-alliance`）；作用对象（`target`）：`袁术`
              - 参数（`values`）：
                - 作用对象筛选（`targetSelector`）：non-player rulers CaoCao LiuBei SunJian SunCe SunQuan LuBu YuanShao
          - 第 9 项：
            - 结果效果（`kind=effect`）；操作（`operation`）：降低友好度（`decrease-friendship`）；作用对象（`target`）：`袁术`
              - 参数（`values`）：
                - 作用对象筛选（`targetSelector`）：`player`
                - 变化幅度（`magnitude`）：未指定（`unspecified`）
                - 方向（`direction`）：`subject-to-other`
          - 第 10 项：
            - 结果效果（`kind=effect`）；操作（`operation`）：降低友好度（`decrease-friendship`）；作用对象（`target`）：`袁术`
              - 参数（`values`）：
                - 作用对象筛选（`targetSelector`）：`emperor-supporters`
                - 变化幅度（`magnitude`）：未指定（`unspecified`）
                - 方向（`direction`）：`subject-to-other`
          - 第 11 项：
            - 结果效果（`kind=effect`）；操作（`operation`）：降低友好度（`decrease-friendship`）；作用对象（`target`）：`袁术`
              - 参数（`values`）：
                - 作用对象筛选（`targetSelector`）：Han-respecting rulers
                - 变化幅度（`magnitude`）：未指定（`unspecified`）
                - 方向（`direction`）：`subject-to-other`
          - 第 12 项：
            - 结果效果（`kind=effect`）；操作（`operation`）：降低友好度（`decrease-friendship`）；作用对象（`target`）：`袁术`
              - 参数（`values`）：
                - 作用对象筛选（`targetSelector`）：friendship below goodwill
                - 变化幅度（`magnitude`）：未指定（`unspecified`）
                - 方向（`direction`）：`subject-to-other`
          - 第 13 项：
            - 结果效果（`kind=effect`）；操作（`operation`）：降低友好度（`decrease-friendship`）；作用对象（`target`）：`袁术`
              - 参数（`values`）：
                - 作用对象筛选（`targetSelector`）：not allied
                - 变化幅度（`magnitude`）：未指定（`unspecified`）
                - 方向（`direction`）：`subject-to-other`
          - 第 14 项：
            - 结果效果（`kind=effect`）；操作（`operation`）：降低友好度（`decrease-friendship`）；作用对象（`target`）：`袁术`
              - 参数（`values`）：
                - 作用对象筛选（`targetSelector`）：rulers CaoCao LiuBei SunJian SunCe SunQuan LuBu YuanShao
                - 变化幅度（`magnitude`）：未指定（`unspecified`）
                - 方向（`direction`）：`subject-to-other`
      - 第 2 项：
        - 选项标识（`optionId`）：`decline`
        - 按来源描述排列的结果（`orderedResults`）：
          - 第 1 项：
            - 结果效果（`kind=effect`）；操作（`operation`）：来源明示无变化（`no-described-change`）；作用对象（`target`）：`event`
              - 参数（`values`）：空属性集（0 项）

### 不确定性与来源限定（`uncertainties`）

- 第 1 项：Diplomacy target filters appear as separate lines; the guide does not group them like the Japanese article.

<a id="gamersky.marry-cao-pi-zhen"></a>

## 观察 17：甄氏转嫁曹丕

- 事件标识（`eventId`）：`marry-cao-pi-zhen`
- 观察标识（`observationId`）：`gamersky.marry-cao-pi-zhen`
- 原文标题（`title`）：`甄氏转嫁曹丕`
- 来源标识（`sourceId`）：`gamersky-04`
- 来源网址（`sourceURL`）：[https://www.gamersky.com/handbook/200809/124174_4.shtml](https://www.gamersky.com/handbook/200809/124174_4.shtml)
- 来源章节（`sourceSection`）：`甄氏转嫁曹丕`
- 来源节序（`sourceOrdinal`）：3
- 版本范围（`version`）：
  - 游戏（`game`）：`SAN11`
  - 版本类型（`edition`）：未指定（`unspecified`）
  - 平台（`platform`）：未指定（`unspecified`）
  - 补丁（`patch`）：未指定（`unspecified`）
- 证据性质（`evidence`）：公开攻略转录（`public-guide-transcription`）
- 仅发生一次信息（`onceOnly`）：
  - 状态（`status`）：未说明（`not-stated`）
  - 标志标识（`flagId`）：未提供（null）
- 来源行定位：此观察未提供 `sourceLocator`；保留网址、章节和来源节序作为定位信息

### 触发条件（`conditions`）

- 第 1 项：
  - 事实条件（`kind=fact`）；类别（`category`）：日期（`date`）；对象（`subject`）：剧本（`scenario`）；字段（`field`）：剧本开始年月（`start-month`）；比较关系（`operator`）：指定月份之前，边界未说明（`before-month`）；确定性（`certainty`）：月份边界未说明（`month-boundary-unspecified`）
    - 取值（`value`）：列表（按来源次序）：204、12
- 第 2 项：
  - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：列表（按来源次序）：`曹丕`；字段（`field`）：配偶（`spouse`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：未提供（null）
- 第 3 项：
  - 条件后果（`if`）（节点种类（`kind`））
    - 分支条件（`condition`）：
      - 事实条件（`kind=fact`）；类别（`category`）：游戏设置（`settings`）；对象（`subject`）：游戏设置（`settings`）；字段（`field`）：女性武将模式（`female-officers`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
        - 取值（`value`）：`event`
    - 条件成立时的后果（`consequence`）：
      - 全部成立（`all`）（节点种类（`kind`））
        - 逻辑：本组各子项均成立；仅表示来源的分组，不引入调度规则
        - 子项（`items`）：
          - 第 1 项：
            - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`曹丕.force`；字段（`field`）：俘虏（`prisoners`）；比较关系（`operator`）：包含（`contains`）；确定性（`certainty`）：来源明示（`stated`）
              - 取值（`value`）：`袁熙`
          - 第 2 项：
            - 事实条件（`kind=fact`）；类别（`category`）：城市（`city`）；对象（`subject`）：列表（按来源次序）：`曹丕`、`袁熙`；字段（`field`）：当前所在城市（`current-city`）；比较关系（`operator`）：全部相同（`all-equal`）；确定性（`certainty`）：来源明示（`stated`）
              - 取值（`value`）：是（true）
- 第 4 项：
  - 条件后果（`if`）（节点种类（`kind`））
    - 分支条件（`condition`）：
      - 事实条件（`kind=fact`）；类别（`category`）：游戏设置（`settings`）；对象（`subject`）：游戏设置（`settings`）；字段（`field`）：女性武将模式（`female-officers`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
        - 取值（`value`）：`historical`
    - 条件成立时的后果（`consequence`）：
      - 全部成立（`all`）（节点种类（`kind`））
        - 逻辑：本组各子项均成立；仅表示来源的分组，不引入调度规则
        - 子项（`items`）：
          - 第 1 项：
            - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`曹丕.force`；字段（`field`）：俘虏（`prisoners`）；比较关系（`operator`）：包含（`contains`）；确定性（`certainty`）：来源明示（`stated`）
              - 取值（`value`）：`甄氏`
          - 第 2 项：
            - 事实条件（`kind=fact`）；类别（`category`）：城市（`city`）；对象（`subject`）：列表（按来源次序）：`曹丕`、`甄氏`；字段（`field`）：当前所在城市（`current-city`）；比较关系（`operator`）：全部相同（`all-equal`）；确定性（`certainty`）：来源明示（`stated`）
              - 取值（`value`）：是（true）
          - 第 3 项：
            - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：`甄氏`；字段（`field`）：配偶（`spouse`）；比较关系（`operator`）：属于（`in`）；确定性（`certainty`）：来源明示（`stated`）
              - 取值（`value`）：列表（按来源次序）：未提供（null）、`袁熙`
          - 第 4 项：
            - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：列表（按来源次序）：`曹丕`、`袁熙`；字段（`field`）：势力（`force`）；比较关系（`operator`）：并非全部相同（`not-all-equal`）；确定性（`certainty`）：来源明示（`stated`）
              - 取值（`value`）：是（true）
- 第 5 项：
  - 事实条件（`kind=fact`）；类别（`category`）：任务或行动（`mission`）；对象（`subject`）：列表（按来源次序）：`曹丕`；字段（`field`）：正在执行任务（`on-mission`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：否（false）

### 前置事件关系（`prerequisites`）

- 空列表（0 项）

### 结果与分支（仅来源描述顺序）（`orderedResults`）

- 第 1 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：结束婚姻（`end-marriage`）；作用对象（`target`）：列表（按来源次序）：`袁熙`、`甄氏`
    - 参数（`values`）：空属性集（0 项）
- 第 2 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：结婚（`marry`）；作用对象（`target`）：列表（按来源次序）：`曹丕`、`甄氏`
    - 参数（`values`）：空属性集（0 项）
- 第 3 项：
  - 分支（`branch`）（节点种类（`kind`））
    - 分支标识（`branchId`）：`historical-women`
    - 分支条件（`condition`）：
      - 事实条件（`kind=fact`）；类别（`category`）：游戏设置（`settings`）；对象（`subject`）：游戏设置（`settings`）；字段（`field`）：女性武将模式（`female-officers`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
        - 取值（`value`）：`historical`
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

- 空列表（0 项）

<a id="gamersky.two-powers-war"></a>

## 观察 18：二强开战

- 事件标识（`eventId`）：`two-powers-war`
- 观察标识（`observationId`）：`gamersky.two-powers-war`
- 原文标题（`title`）：`二强开战`
- 来源标识（`sourceId`）：`gamersky-05`
- 来源网址（`sourceURL`）：[https://www.gamersky.com/handbook/200809/124174_5.shtml](https://www.gamersky.com/handbook/200809/124174_5.shtml)
- 来源章节（`sourceSection`）：`二强开战`
- 来源节序（`sourceOrdinal`）：1
- 版本范围（`version`）：
  - 游戏（`game`）：`SAN11`
  - 版本类型（`edition`）：未指定（`unspecified`）
  - 平台（`platform`）：未指定（`unspecified`）
  - 补丁（`patch`）：未指定（`unspecified`）
- 证据性质（`evidence`）：公开攻略转录（`public-guide-transcription`）
- 仅发生一次信息（`onceOnly`）：
  - 状态（`status`）：未说明（`not-stated`）
  - 标志标识（`flagId`）：未提供（null）
- 来源行定位：此观察未提供 `sourceLocator`；保留网址、章节和来源节序作为定位信息

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
      - 第 2 项：
        - 全部成立（`all`）（节点种类（`kind`））
          - 逻辑：本组各子项均成立；仅表示来源的分组，不引入调度规则
          - 子项（`items`）：
            - 第 1 项：
              - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`曹操`；字段（`field`）：存在（`exists`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
                - 取值（`value`）：是（true）
            - 第 2 项：
              - 事实条件（`kind=fact`）；类别（`category`）：城市（`city`）；对象（`subject`）：`曹操`；字段（`field`）：中原城市数（`central-plains-city-count`）；比较关系（`operator`）：大于或等于（`gte`）；确定性（`certainty`）：来源明示（`stated`）
                - 取值（`value`）：5
            - 第 3 项：
              - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`袁绍`；字段（`field`）：存在（`exists`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
                - 取值（`value`）：是（true）
            - 第 4 项：
              - 事实条件（`kind=fact`）；类别（`category`）：城市（`city`）；对象（`subject`）：`袁绍`；字段（`field`）：河北城市数（`hebei-city-count`）；比较关系（`operator`）：大于或等于（`gte`）；确定性（`certainty`）：来源明示（`stated`）
                - 取值（`value`）：5
            - 第 5 项：
              - 事实条件（`kind=fact`）；类别（`category`）：日期（`date`）；对象（`subject`）：剧本（`scenario`）；字段（`field`）：剧本开始年月（`start-month`）；比较关系（`operator`）：指定月份之前，边界未说明（`before-month`）；确定性（`certainty`）：月份边界未说明（`month-boundary-unspecified`）
                - 取值（`value`）：列表（按来源次序）：198、12
            - 第 6 项：
              - 事实条件（`kind=fact`）；类别（`category`）：城市（`city`）；对象（`subject`）：列表（按来源次序）：`曹操`、`袁绍`；字段（`field`）：相邻城市（`adjacent-cities`）；比较关系（`operator`）：大于或等于（`gte`）；确定性（`certainty`）：来源明示（`stated`）
                - 取值（`value`）：1
            - 第 7 项：
              - 事实条件（`kind=fact`）；类别（`category`）：外交（`diplomacy`）；对象（`subject`）：列表（按来源次序）：`曹操`、`袁绍`；字段（`field`）：同盟（`alliance`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
                - 取值（`value`）：否（false）
            - 第 8 项：
              - 事实条件（`kind=fact`）；类别（`category`）：任务或行动（`mission`）；对象（`subject`）：列表（按来源次序）：`曹操`、`袁绍`；字段（`field`）：正在执行任务（`on-mission`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
                - 取值（`value`）：否（false）

### 前置事件关系（`prerequisites`）

- 空列表（0 项）

### 结果与分支（仅来源描述顺序）（`orderedResults`）

- 第 1 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：设置友好度（`set-friendship`）；作用对象（`target`）：列表（按来源次序）：`曹操`、`袁绍`
    - 参数（`values`）：
      - 取值（`value`）：`hostile`
      - 方向（`direction`）：`mutual`

### 不确定性与来源限定（`uncertainties`）

- 第 1 项：Opening scenario4 is an alternative to the remaining conditions; region membership is not enumerated.

<a id="gamersky.zhao-yun-reunion"></a>

## 观察 19：赵云再会

- 事件标识（`eventId`）：`zhao-yun-reunion`
- 观察标识（`observationId`）：`gamersky.zhao-yun-reunion`
- 原文标题（`title`）：`赵云再会`
- 来源标识（`sourceId`）：`gamersky-05`
- 来源网址（`sourceURL`）：[https://www.gamersky.com/handbook/200809/124174_5.shtml](https://www.gamersky.com/handbook/200809/124174_5.shtml)
- 来源章节（`sourceSection`）：`赵云再会`
- 来源节序（`sourceOrdinal`）：2
- 版本范围（`version`）：
  - 游戏（`game`）：`SAN11`
  - 版本类型（`edition`）：未指定（`unspecified`）
  - 平台（`platform`）：未指定（`unspecified`）
  - 补丁（`patch`）：未指定（`unspecified`）
- 证据性质（`evidence`）：公开攻略转录（`public-guide-transcription`）
- 仅发生一次信息（`onceOnly`）：
  - 状态（`status`）：未说明（`not-stated`）
  - 标志标识（`flagId`）：未提供（null）
- 来源行定位：此观察未提供 `sourceLocator`；保留网址、章节和来源节序作为定位信息

### 触发条件（`conditions`）

- 第 1 项：
  - 事实条件（`kind=fact`）；类别（`category`）：日期（`date`）；对象（`subject`）：剧本（`scenario`）；字段（`field`）：剧本开始年月（`start-month`）；比较关系（`operator`）：指定月份之后，边界未说明（`after-month`）；确定性（`certainty`）：月份边界未说明（`month-boundary-unspecified`）
    - 取值（`value`）：列表（按来源次序）：195、1
- 第 2 项：
  - 事实条件（`kind=fact`）；类别（`category`）：日期（`date`）；对象（`subject`）：剧本（`scenario`）；字段（`field`）：剧本经过日数（`elapsed-days`）；比较关系（`operator`）：大于或等于（`gte`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：30
- 第 3 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`player`；字段（`field`）：君主（`ruler`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：`刘备`
- 第 4 项：
  - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：`赵云`；字段（`field`）：状态（`status`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：在野（`free`）
- 第 5 项：
  - 事实条件（`kind=fact`）；类别（`category`）：城市（`city`）；对象（`subject`）：`刘备.current-city`；字段（`field`）：治安（`public-order`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：100
- 第 6 项：
  - 事实条件（`kind=fact`）；类别（`category`）：任务或行动（`mission`）；对象（`subject`）：列表（按来源次序）：`刘备`；字段（`field`）：正在执行任务（`on-mission`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：否（false）

### 前置事件关系（`prerequisites`）

- 空列表（0 项）

### 结果与分支（仅来源描述顺序）（`orderedResults`）

- 第 1 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：加入势力（`join-force`）；作用对象（`target`）：`赵云`
    - 参数（`values`）：
      - 势力（`force`）：`player`
- 第 2 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：设为（`set`）；作用对象（`target`）：`赵云`
    - 参数（`values`）：
      - 忠诚（`loyalty`）：100
      - 功绩（`merit`）：4000

### 不确定性与来源限定（`uncertainties`）

- 空列表（0 项）

<a id="gamersky.recruit-liu-bei-five"></a>

## 观察 20：好汉刘备

- 事件标识（`eventId`）：`recruit-liu-bei-five`
- 观察标识（`observationId`）：`gamersky.recruit-liu-bei-five`
- 原文标题（`title`）：`好汉刘备`
- 来源标识（`sourceId`）：`gamersky-05`
- 来源网址（`sourceURL`）：[https://www.gamersky.com/handbook/200809/124174_5.shtml](https://www.gamersky.com/handbook/200809/124174_5.shtml)
- 来源章节（`sourceSection`）：`好汉刘备`
- 来源节序（`sourceOrdinal`）：3
- 版本范围（`version`）：
  - 游戏（`game`）：`SAN11`
  - 版本类型（`edition`）：未指定（`unspecified`）
  - 平台（`platform`）：未指定（`unspecified`）
  - 补丁（`patch`）：未指定（`unspecified`）
- 证据性质（`evidence`）：公开攻略转录（`public-guide-transcription`）
- 仅发生一次信息（`onceOnly`）：
  - 状态（`status`）：未说明（`not-stated`）
  - 标志标识（`flagId`）：未提供（null）
- 来源行定位：此观察未提供 `sourceLocator`；保留网址、章节和来源节序作为定位信息

### 触发条件（`conditions`）

- 第 1 项：
  - 事实条件（`kind=fact`）；类别（`category`）：日期（`date`）；对象（`subject`）：剧本（`scenario`）；字段（`field`）：剧本开始年月（`start-month`）；比较关系（`operator`）：指定月份之前，边界未说明（`before-month`）；确定性（`certainty`）：月份边界未说明（`month-boundary-unspecified`）
    - 取值（`value`）：列表（按来源次序）：206、12
- 第 2 项：
  - 事实条件（`kind=fact`）；类别（`category`）：日期（`date`）；对象（`subject`）：剧本（`scenario`）；字段（`field`）：剧本经过日数（`elapsed-days`）；比较关系（`operator`）：大于或等于（`gte`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：30
- 第 3 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`player`；字段（`field`）：君主（`ruler`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：`刘备`
- 第 4 项：
  - 事实条件（`kind=fact`）；类别（`category`）：城市（`city`）；对象（`subject`）：`刘备`；字段（`field`）：持有城市（`cities`）；比较关系（`operator`）：包含全部（`contains-all`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：`汝南`
- 第 5 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`刘备`；字段（`field`）：武将列表（`officers`）；比较关系（`operator`）：包含全部（`contains-all`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：`关羽`
- 第 6 项：
  - 事实条件（`kind=fact`）；类别（`category`）：城市（`city`）；对象（`subject`）：列表（按来源次序）：`刘备`、`关羽`；字段（`field`）：当前所在城市（`current-city`）；比较关系（`operator`）：全部相同（`all-equal`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：是（true）
- 第 7 项：
  - 事实条件（`kind=fact`）；类别（`category`）：任务或行动（`mission`）；对象（`subject`）：列表（按来源次序）：`刘备`、`关羽`；字段（`field`）：正在执行任务（`on-mission`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：否（false）
- 第 8 项：
  - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：列表（按来源次序）：`周仓`、`裴元绍`、`刘辟`、`龚都`、`廖化`；字段（`field`）：已达登场年龄（`debut-age-reached`）；比较关系（`operator`）：至少一项等于（`any-eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：是（true）
- 第 9 项：
  - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：列表（按来源次序）：`周仓`、`裴元绍`、`刘辟`、`龚都`、`廖化`；字段（`field`）：状态（`status`）；比较关系（`operator`）：至少一项属于（`any-in`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：`free`、`undiscovered`

### 前置事件关系（`prerequisites`）

- 空列表（0 项）

### 结果与分支（仅来源描述顺序）（`orderedResults`）

- 第 1 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：符合条件的武将加入（`join-eligible-officers`）；作用对象（`target`）：列表（按来源次序）：`周仓`、`裴元绍`、`刘辟`、`龚都`、`廖化`
    - 参数（`values`）：
      - 势力（`force`）：`刘备`
      - 适用条件（`eligibility`）：列表（按来源次序）：`free`、`undiscovered`
      - 忠诚（`loyalty`）：100
      - 功绩（`merit`）：1000

### 不确定性与来源限定（`uncertainties`）

- 第 1 项：Separately stated existential conditions do not explicitly require the same candidate.

<a id="gamersky.guo-jia-death"></a>

## 观察 21：郭嘉之死

- 事件标识（`eventId`）：`guo-jia-death`
- 观察标识（`observationId`）：`gamersky.guo-jia-death`
- 原文标题（`title`）：`郭嘉之死`
- 来源标识（`sourceId`）：`gamersky-05`
- 来源网址（`sourceURL`）：[https://www.gamersky.com/handbook/200809/124174_5.shtml](https://www.gamersky.com/handbook/200809/124174_5.shtml)
- 来源章节（`sourceSection`）：`郭嘉之死`
- 来源节序（`sourceOrdinal`）：4
- 版本范围（`version`）：
  - 游戏（`game`）：`SAN11`
  - 版本类型（`edition`）：未指定（`unspecified`）
  - 平台（`platform`）：未指定（`unspecified`）
  - 补丁（`patch`）：未指定（`unspecified`）
- 证据性质（`evidence`）：公开攻略转录（`public-guide-transcription`）
- 仅发生一次信息（`onceOnly`）：
  - 状态（`status`）：未说明（`not-stated`）
  - 标志标识（`flagId`）：未提供（null）
- 来源行定位：此观察未提供 `sourceLocator`；保留网址、章节和来源节序作为定位信息

### 触发条件（`conditions`）

- 第 1 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`player`；字段（`field`）：武将列表（`officers`）；比较关系（`operator`）：包含全部（`contains-all`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：`郭嘉`
- 第 2 项：
  - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：`郭嘉`；字段（`field`）：死亡类型（`death-type`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：`natural`
- 第 3 项：
  - 事实条件（`kind=fact`）；类别（`category`）：日期（`date`）；对象（`subject`）：`郭嘉`；字段（`field`）：已到预定死亡时间（`scheduled-death-reached`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：是（true）
- 第 4 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`player`；字段（`field`）：城市数（`city-count`）；比较关系（`operator`）：大于或等于（`gte`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：6
- 第 5 项：
  - 事实条件（`kind=fact`）；类别（`category`）：任务或行动（`mission`）；对象（`subject`）：列表（按来源次序）：`player-ruler`、`郭嘉`；字段（`field`）：正在执行任务（`on-mission`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：否（false）

### 前置事件关系（`prerequisites`）

- 空列表（0 项）

### 结果与分支（仅来源描述顺序）（`orderedResults`）

- 第 1 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：死亡（`death`）；作用对象（`target`）：`郭嘉`
    - 参数（`values`）：空属性集（0 项）

### 不确定性与来源限定（`uncertainties`）

- 空列表（0 项）

<a id="gamersky.sun-ce-death"></a>

## 观察 22：孙策之死

- 事件标识（`eventId`）：`sun-ce-death`
- 观察标识（`observationId`）：`gamersky.sun-ce-death`
- 原文标题（`title`）：`孙策之死`
- 来源标识（`sourceId`）：`gamersky-06`
- 来源网址（`sourceURL`）：[https://www.gamersky.com/handbook/200809/124174_6.shtml](https://www.gamersky.com/handbook/200809/124174_6.shtml)
- 来源章节（`sourceSection`）：`孙策之死`
- 来源节序（`sourceOrdinal`）：1
- 版本范围（`version`）：
  - 游戏（`game`）：`SAN11`
  - 版本类型（`edition`）：未指定（`unspecified`）
  - 平台（`platform`）：未指定（`unspecified`）
  - 补丁（`patch`）：未指定（`unspecified`）
- 证据性质（`evidence`）：公开攻略转录（`public-guide-transcription`）
- 仅发生一次信息（`onceOnly`）：
  - 状态（`status`）：未说明（`not-stated`）
  - 标志标识（`flagId`）：未提供（null）
- 来源行定位：此观察未提供 `sourceLocator`；保留网址、章节和来源节序作为定位信息

### 触发条件（`conditions`）

- 第 1 项：
  - 任一成立（`any`）（节点种类（`kind`））
    - 逻辑：本组至少一个子项成立；仅表示来源的分组，不引入调度规则
    - 子项（`items`）：
      - 第 1 项：
        - 事实条件（`kind=fact`）；类别（`category`）：日期（`date`）；对象（`subject`）：`calendar`；字段（`field`）：当前年份（`current-year`）；比较关系（`operator`）：大于（`gt`）；确定性（`certainty`）：来源明示（`stated`）
          - 取值（`value`）：`孙策.scheduled-death-year`
      - 第 2 项：
        - 事实条件（`kind=fact`）；类别（`category`）：日期（`date`）；对象（`subject`）：`calendar`；字段（`field`）：当前年份（`current-year`）；比较关系（`operator`）：大于或等于（`gte`）；确定性（`certainty`）：来源明示（`stated`）
          - 取值（`value`）：200
- 第 2 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`player`；字段（`field`）：君主（`ruler`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：`孙策`
- 第 3 项：
  - 事实条件（`kind=fact`）；类别（`category`）：城市（`city`）；对象（`subject`）：`player`；字段（`field`）：持有城市（`cities`）；比较关系（`operator`）：包含全部（`contains-all`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：`庐江`、`柴桑`、`建业`、`吴`、`会稽`
- 第 4 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`孙策`；字段（`field`）：武将列表（`officers`）；比较关系（`operator`）：包含全部（`contains-all`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：`孙权`
- 第 5 项：
  - 事实条件（`kind=fact`）；类别（`category`）：任务或行动（`mission`）；对象（`subject`）：列表（按来源次序）：`孙策`、`孙权`；字段（`field`）：正在执行任务（`on-mission`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：否（false）

### 前置事件关系（`prerequisites`）

- 空列表（0 项）

### 结果与分支（仅来源描述顺序）（`orderedResults`）

- 第 1 项：
  - 分支（`branch`）（节点种类（`kind`））
    - 分支标识（`branchId`）：`win-yu-ji-debate`
    - 分支条件（`condition`）：
      - 事实条件（`kind=fact`）；类别（`category`）：其他（`other`）；对象（`subject`）：`debate-with-于吉`；字段（`field`）：结果（`outcome`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
        - 取值（`value`）：`win`
    - 按来源描述排列的结果（`orderedResults`）：
      - 第 1 项：
        - 结果效果（`kind=effect`）；操作（`operation`）：延长寿命（`extend-life`）；作用对象（`target`）：`孙策`
          - 参数（`values`）：
            - 取值（`value`）：20
            - 单位（`unit`）：年（`years`）
- 第 2 项：
  - 分支（`branch`）（节点种类（`kind`））
    - 分支标识（`branchId`）：`lose-yu-ji-debate`
    - 分支条件（`condition`）：
      - 事实条件（`kind=fact`）；类别（`category`）：其他（`other`）；对象（`subject`）：`debate-with-于吉`；字段（`field`）：结果（`outcome`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
        - 取值（`value`）：`loss`
    - 按来源描述排列的结果（`orderedResults`）：
      - 第 1 项：
        - 结果效果（`kind=effect`）；操作（`operation`）：死亡（`death`）；作用对象（`target`）：`孙策`
          - 参数（`values`）：空属性集（0 项）
      - 第 2 项：
        - 结果效果（`kind=effect`）；操作（`operation`）：继承势力（`inherit-force`）；作用对象（`target`）：`孙权`
          - 参数（`values`）：
            - 势力（`force`）：`孙策`

### 不确定性与来源限定（`uncertainties`）

- 空列表（0 项）

<a id="gamersky.marry-zhuge-liang"></a>

## 观察 23：诸葛亮结婚

- 事件标识（`eventId`）：`marry-zhuge-liang`
- 观察标识（`observationId`）：`gamersky.marry-zhuge-liang`
- 原文标题（`title`）：`诸葛亮结婚`
- 来源标识（`sourceId`）：`gamersky-06`
- 来源网址（`sourceURL`）：[https://www.gamersky.com/handbook/200809/124174_6.shtml](https://www.gamersky.com/handbook/200809/124174_6.shtml)
- 来源章节（`sourceSection`）：`诸葛亮结婚`
- 来源节序（`sourceOrdinal`）：2
- 版本范围（`version`）：
  - 游戏（`game`）：`SAN11`
  - 版本类型（`edition`）：未指定（`unspecified`）
  - 平台（`platform`）：未指定（`unspecified`）
  - 补丁（`patch`）：未指定（`unspecified`）
- 证据性质（`evidence`）：公开攻略转录（`public-guide-transcription`）
- 仅发生一次信息（`onceOnly`）：
  - 状态（`status`）：未说明（`not-stated`）
  - 标志标识（`flagId`）：未提供（null）
- 来源行定位：此观察未提供 `sourceLocator`；保留网址、章节和来源节序作为定位信息

### 触发条件（`conditions`）

- 第 1 项：
  - 事实条件（`kind=fact`）；类别（`category`）：日期（`date`）；对象（`subject`）：剧本（`scenario`）；字段（`field`）：剧本开始年月（`start-month`）；比较关系（`operator`）：指定月份之前，边界未说明（`before-month`）；确定性（`certainty`）：月份边界未说明（`month-boundary-unspecified`）
    - 取值（`value`）：列表（按来源次序）：202、12
- 第 2 项：
  - 事实条件（`kind=fact`）；类别（`category`）：日期（`date`）；对象（`subject`）：剧本（`scenario`）；字段（`field`）：剧本经过日数（`elapsed-days`）；比较关系（`operator`）：大于或等于（`gte`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：30
- 第 3 项：
  - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：列表（按来源次序）：`诸葛亮`、`黄月英`；字段（`field`）：配偶（`spouse`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：未提供（null）
- 第 4 项：
  - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：`诸葛亮`；字段（`field`）：年龄（`age`）；比较关系（`operator`）：大于或等于（`gte`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：20
- 第 5 项：
  - 事实条件（`kind=fact`）；类别（`category`）：游戏设置（`settings`）；对象（`subject`）：游戏设置（`settings`）；字段（`field`）：女性武将模式（`female-officers`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：`historical`
- 第 6 项：
  - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：列表（按来源次序）：`黄月英`；字段（`field`）：已达登场年龄（`debut-age-reached`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：是（true）
- 第 7 项：
  - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：`黄月英`；字段（`field`）：状态（`status`）；比较关系（`operator`）：属于（`in`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：`free`、`undiscovered`、`诸葛亮.force-officer`
- 第 8 项：
  - 事实条件（`kind=fact`）；类别（`category`）：任务或行动（`mission`）；对象（`subject`）：列表（按来源次序）：`诸葛亮`、`黄月英`；字段（`field`）：正在执行任务（`on-mission`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：否（false）

### 前置事件关系（`prerequisites`）

- 空列表（0 项）

### 结果与分支（仅来源描述顺序）（`orderedResults`）

- 第 1 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：结婚（`marry`）；作用对象（`target`）：列表（按来源次序）：`诸葛亮`、`黄月英`
    - 参数（`values`）：空属性集（0 项）
- 第 2 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：加入势力（`join-force`）；作用对象（`target`）：`黄月英`
    - 参数（`values`）：
      - 势力（`force`）：`诸葛亮.force`
- 第 3 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：设为（`set`）；作用对象（`target`）：`黄月英`
    - 参数（`values`）：
      - 忠诚（`loyalty`）：100
      - 功绩（`merit`）：1000

### 不确定性与来源限定（`uncertainties`）

- 空列表（0 项）

<a id="gamersky.gan-ning-defects"></a>

## 观察 24：甘宁逃命

- 事件标识（`eventId`）：`gan-ning-defects`
- 观察标识（`observationId`）：`gamersky.gan-ning-defects`
- 原文标题（`title`）：`甘宁逃命`
- 来源标识（`sourceId`）：`gamersky-06`
- 来源网址（`sourceURL`）：[https://www.gamersky.com/handbook/200809/124174_6.shtml](https://www.gamersky.com/handbook/200809/124174_6.shtml)
- 来源章节（`sourceSection`）：`甘宁逃命`
- 来源节序（`sourceOrdinal`）：3
- 版本范围（`version`）：
  - 游戏（`game`）：`SAN11`
  - 版本类型（`edition`）：未指定（`unspecified`）
  - 平台（`platform`）：未指定（`unspecified`）
  - 补丁（`patch`）：未指定（`unspecified`）
- 证据性质（`evidence`）：公开攻略转录（`public-guide-transcription`）
- 仅发生一次信息（`onceOnly`）：
  - 状态（`status`）：未说明（`not-stated`）
  - 标志标识（`flagId`）：未提供（null）
- 来源行定位：此观察未提供 `sourceLocator`；保留网址、章节和来源节序作为定位信息

### 触发条件（`conditions`）

- 第 1 项：
  - 事实条件（`kind=fact`）；类别（`category`）：日期（`date`）；对象（`subject`）：剧本（`scenario`）；字段（`field`）：剧本开始年月（`start-month`）；比较关系（`operator`）：指定月份之前，边界未说明（`before-month`）；确定性（`certainty`）：月份边界未说明（`month-boundary-unspecified`）
    - 取值（`value`）：列表（按来源次序）：207、12
- 第 2 项：
  - 事实条件（`kind=fact`）；类别（`category`）：日期（`date`）；对象（`subject`）：剧本（`scenario`）；字段（`field`）：剧本经过日数（`elapsed-days`）；比较关系（`operator`）：大于或等于（`gte`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：30
- 第 3 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`甘宁`；字段（`field`）：势力（`force`）；比较关系（`operator`）：不等于（`ne`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：`player`
- 第 4 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：列表（按来源次序）：`甘宁`、`黄祖`；字段（`field`）：势力（`force`）；比较关系（`operator`）：全部相同（`all-equal`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：是（true）
- 第 5 项：
  - 事实条件（`kind=fact`）；类别（`category`）：城市（`city`）；对象（`subject`）：`player`；字段（`field`）：持有城市（`cities`）；比较关系（`operator`）：包含全部（`contains-all`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：`庐江`、`柴桑`、`建业`、`吴`、`会稽`
- 第 6 项：
  - 事实条件（`kind=fact`）；类别（`category`）：城市（`city`）；对象（`subject`）：列表（按来源次序）：`player`、`甘宁.force`；字段（`field`）：相邻城市（`adjacent-cities`）；比较关系（`operator`）：大于或等于（`gte`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：1
- 第 7 项：
  - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：列表（按来源次序）：`甘宁`；字段（`field`）：与玩家君主的相性（`compatibility-to-player-ruler`）；比较关系（`operator`）：相近，阈值按来源限定（`close`）；确定性（`certainty`）：阈值未说明（`threshold-unspecified`）
    - 取值（`value`）：是（true）
- 第 8 项：
  - 全部成立（`all`）（节点种类（`kind`））
    - 逻辑：本组各子项均成立；仅表示来源的分组，不引入调度规则
    - 子项（`items`）：
      - 第 1 项：
        - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：列表（按来源次序）：`甘宁`；字段（`field`）：厌恶武将列表（`disliked-officers`）；比较关系（`operator`）：不包含（`not-contains`）；确定性（`certainty`）：来源明示（`stated`）
          - 取值（`value`）：`player-ruler`
      - 第 2 项：
        - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：`player-ruler`；字段（`field`）：厌恶武将列表（`disliked-officers`）；比较关系（`operator`）：全部不包含（`contains-none`）；确定性（`certainty`）：来源明示（`stated`）
          - 取值（`value`）：列表（按来源次序）：`甘宁`
- 第 9 项：
  - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：`甘宁`；字段（`field`）：身份角色（`role`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：`ordinary`
- 第 10 项：
  - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：`甘宁`；字段（`field`）：忠诚（`loyalty`）；比较关系（`operator`）：小于（`lt`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：90
- 第 11 项：
  - 事实条件（`kind=fact`）；类别（`category`）：任务或行动（`mission`）；对象（`subject`）：列表（按来源次序）：`player-ruler`、`甘宁`；字段（`field`）：正在执行任务（`on-mission`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：否（false）

### 前置事件关系（`prerequisites`）

- 空列表（0 项）

### 结果与分支（仅来源描述顺序）（`orderedResults`）

- 第 1 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：加入势力（`join-force`）；作用对象（`target`）：`甘宁`
    - 参数（`values`）：
      - 势力（`force`）：`player`
- 第 2 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：设为（`set`）；作用对象（`target`）：`甘宁`
    - 参数（`values`）：
      - 忠诚（`loyalty`）：100
      - 功绩（`merit`）：4000

### 不确定性与来源限定（`uncertainties`）

- 空列表（0 项）

<a id="gamersky.xu-shu-arrives"></a>

## 观察 25：徐庶登场

- 事件标识（`eventId`）：`xu-shu-arrives`
- 观察标识（`observationId`）：`gamersky.xu-shu-arrives`
- 原文标题（`title`）：`徐庶登场`
- 来源标识（`sourceId`）：`gamersky-07`
- 来源网址（`sourceURL`）：[https://www.gamersky.com/handbook/200809/124174_7.shtml](https://www.gamersky.com/handbook/200809/124174_7.shtml)
- 来源章节（`sourceSection`）：`徐庶登场`
- 来源节序（`sourceOrdinal`）：1
- 版本范围（`version`）：
  - 游戏（`game`）：`SAN11`
  - 版本类型（`edition`）：未指定（`unspecified`）
  - 平台（`platform`）：未指定（`unspecified`）
  - 补丁（`patch`）：未指定（`unspecified`）
- 证据性质（`evidence`）：公开攻略转录（`public-guide-transcription`）
- 仅发生一次信息（`onceOnly`）：
  - 状态（`status`）：未说明（`not-stated`）
  - 标志标识（`flagId`）：未提供（null）
- 来源行定位：此观察未提供 `sourceLocator`；保留网址、章节和来源节序作为定位信息

### 触发条件（`conditions`）

- 第 1 项：
  - 事实条件（`kind=fact`）；类别（`category`）：日期（`date`）；对象（`subject`）：剧本（`scenario`）；字段（`field`）：剧本开始年月（`start-month`）；比较关系（`operator`）：指定月份之前，边界未说明（`before-month`）；确定性（`certainty`）：月份边界未说明（`month-boundary-unspecified`）
    - 取值（`value`）：列表（按来源次序）：207、12
- 第 2 项：
  - 事实条件（`kind=fact`）；类别（`category`）：日期（`date`）；对象（`subject`）：剧本（`scenario`）；字段（`field`）：剧本经过日数（`elapsed-days`）；比较关系（`operator`）：大于或等于（`gte`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：30
- 第 3 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`player`；字段（`field`）：君主（`ruler`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：`刘备`
- 第 4 项：
  - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：列表（按来源次序）：`徐庶`；字段（`field`）：已达登场年龄（`debut-age-reached`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：是（true）
- 第 5 项：
  - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：`徐庶`；字段（`field`）：状态（`status`）；比较关系（`operator`）：属于（`in`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：`free`、`undiscovered`、`sun-wu-officer`
- 第 6 项：
  - 事实条件（`kind=fact`）；类别（`category`）：城市（`city`）；对象（`subject`）：`player`；字段（`field`）：持有城市（`cities`）；比较关系（`operator`）：包含全部（`contains-all`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：`新野`
- 第 7 项：
  - 事实条件（`kind=fact`）；类别（`category`）：城市（`city`）；对象（`subject`）：`刘备`；字段（`field`）：当前所在城市（`current-city`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：`新野`
- 第 8 项：
  - 事实条件（`kind=fact`）；类别（`category`）：城市（`city`）；对象（`subject`）：`新野`；字段（`field`）：治安（`public-order`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：100
- 第 9 项：
  - 事实条件（`kind=fact`）；类别（`category`）：任务或行动（`mission`）；对象（`subject`）：列表（按来源次序）：`刘备`；字段（`field`）：正在执行任务（`on-mission`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：否（false）

### 前置事件关系（`prerequisites`）

- 空列表（0 项）

### 结果与分支（仅来源描述顺序）（`orderedResults`）

- 第 1 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：加入势力（`join-force`）；作用对象（`target`）：`徐庶`
    - 参数（`values`）：
      - 势力（`force`）：`player`
- 第 2 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：设为（`set`）；作用对象（`target`）：`徐庶`
    - 参数（`values`）：
      - 忠诚（`loyalty`）：100
      - 功绩（`merit`）：8000

### 不确定性与来源限定（`uncertainties`）

- 第 1 项：The source explicitly permits a Sun-Wu officer; this surprising alternative is retained.

<a id="gamersky.cao-cao-southern-campaign"></a>

## 观察 26：曹操之南征

- 事件标识（`eventId`）：`cao-cao-southern-campaign`
- 观察标识（`observationId`）：`gamersky.cao-cao-southern-campaign`
- 原文标题（`title`）：`曹操之南征`
- 来源标识（`sourceId`）：`gamersky-07`
- 来源网址（`sourceURL`）：[https://www.gamersky.com/handbook/200809/124174_7.shtml](https://www.gamersky.com/handbook/200809/124174_7.shtml)
- 来源章节（`sourceSection`）：`曹操之南征`
- 来源节序（`sourceOrdinal`）：2
- 版本范围（`version`）：
  - 游戏（`game`）：`SAN11`
  - 版本类型（`edition`）：未指定（`unspecified`）
  - 平台（`platform`）：未指定（`unspecified`）
  - 补丁（`patch`）：未指定（`unspecified`）
- 证据性质（`evidence`）：公开攻略转录（`public-guide-transcription`）
- 仅发生一次信息（`onceOnly`）：
  - 状态（`status`）：未说明（`not-stated`）
  - 标志标识（`flagId`）：未提供（null）
- 来源行定位：此观察未提供 `sourceLocator`；保留网址、章节和来源节序作为定位信息

### 触发条件（`conditions`）

- 第 1 项：
  - 事实条件（`kind=fact`）；类别（`category`）：日期（`date`）；对象（`subject`）：剧本（`scenario`）；字段（`field`）：剧本经过日数（`elapsed-days`）；比较关系（`operator`）：大于或等于（`gte`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：30
- 第 2 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`曹操`；字段（`field`）：存在（`exists`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：是（true）
- 第 3 项：
  - 事实条件（`kind=fact`）；类别（`category`）：城市（`city`）；对象（`subject`）：`曹操`；字段（`field`）：中原城市数（`central-plains-city-count`）；比较关系（`operator`）：大于或等于（`gte`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：7
- 第 4 项：
  - 事实条件（`kind=fact`）；类别（`category`）：城市（`city`）；对象（`subject`）：`曹操`；字段（`field`）：襄平以外河北城市（`hebei-cities-except-xiangping`）；比较关系（`operator`）：包含全部（`contains-all`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：是（true）
- 第 5 项：
  - 事实条件（`kind=fact`）；类别（`category`）：城市（`city`）；对象（`subject`）：`曹操`；字段（`field`）：持有城市（`cities`）；比较关系（`operator`）：包含全部（`contains-all`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：`宛`、`许昌`
- 第 6 项：
  - 事实条件（`kind=fact`）；类别（`category`）：城市（`city`）；对象（`subject`）：`曹操`；字段（`field`）：持有城市（`cities`）；比较关系（`operator`）：全部不包含（`contains-none`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：`新野`、`庐江`、`柴桑`、`建业`、`吴`、`会稽`
- 第 7 项：
  - 事实条件（`kind=fact`）；类别（`category`）：外交（`diplomacy`）；对象（`subject`）：`owners-of-襄阳-江陵-柴桑-建业`；字段（`field`）：与曹操同盟（`allied-to-cao-cao`）；比较关系（`operator`）：至少一项等于（`any-eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：否（false）
- 第 8 项：
  - 事实条件（`kind=fact`）；类别（`category`）：任务或行动（`mission`）；对象（`subject`）：列表（按来源次序）：`曹操`；字段（`field`）：正在执行任务（`on-mission`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：否（false）

### 前置事件关系（`prerequisites`）

- 空列表（0 项）

### 结果与分支（仅来源描述顺序）（`orderedResults`）

- 第 1 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：降低友好度（`decrease-friendship`）；作用对象（`target`）：`曹操`
    - 参数（`values`）：
      - 作用对象筛选（`targetSelector`）：at least one owner of 襄阳 江陵 柴桑 建业
      - 变化幅度（`magnitude`）：`large`

### 不确定性与来源限定（`uncertainties`）

- 第 1 项：Regional city membership, result-target selection, friendship direction and exact amount are not defined.

<a id="gamersky.three-visits-first"></a>

## 观察 27：三顾之礼 1 - 一顾

- 事件标识（`eventId`）：`three-visits-first`
- 观察标识（`observationId`）：`gamersky.three-visits-first`
- 原文标题（`title`）：三顾之礼 1 - 一顾
- 来源标识（`sourceId`）：`gamersky-07`
- 来源网址（`sourceURL`）：[https://www.gamersky.com/handbook/200809/124174_7.shtml](https://www.gamersky.com/handbook/200809/124174_7.shtml)
- 来源章节（`sourceSection`）：三顾之礼 1 - 一顾
- 来源节序（`sourceOrdinal`）：3
- 版本范围（`version`）：
  - 游戏（`game`）：`SAN11`
  - 版本类型（`edition`）：未指定（`unspecified`）
  - 平台（`platform`）：未指定（`unspecified`）
  - 补丁（`patch`）：未指定（`unspecified`）
- 证据性质（`evidence`）：公开攻略转录（`public-guide-transcription`）
- 仅发生一次信息（`onceOnly`）：
  - 状态（`status`）：未说明（`not-stated`）
  - 标志标识（`flagId`）：未提供（null）
- 来源行定位：此观察未提供 `sourceLocator`；保留网址、章节和来源节序作为定位信息

### 触发条件（`conditions`）

- 第 1 项：
  - 事实条件（`kind=fact`）；类别（`category`）：日期（`date`）；对象（`subject`）：剧本（`scenario`）；字段（`field`）：剧本开始年月（`start-month`）；比较关系（`operator`）：指定月份之前，边界未说明（`before-month`）；确定性（`certainty`）：月份边界未说明（`month-boundary-unspecified`）
    - 取值（`value`）：列表（按来源次序）：207、12
- 第 2 项：
  - 事实条件（`kind=fact`）；类别（`category`）：日期（`date`）；对象（`subject`）：`calendar`；字段（`field`）：当前年月（`current-month`）；比较关系（`operator`）：指定月份之后，边界未说明（`after-month`）；确定性（`certainty`）：月份边界未说明（`month-boundary-unspecified`）
    - 取值（`value`）：列表（按来源次序）：208、1
- 第 3 项：
  - 事实条件（`kind=fact`）；类别（`category`）：日期（`date`）；对象（`subject`）：剧本（`scenario`）；字段（`field`）：剧本经过日数（`elapsed-days`）；比较关系（`operator`）：大于或等于（`gte`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：60
- 第 4 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`player`；字段（`field`）：君主（`ruler`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：`刘备`
- 第 5 项：
  - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：列表（按来源次序）：`诸葛亮`；字段（`field`）：已达登场年龄（`debut-age-reached`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：是（true）
- 第 6 项：
  - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：列表（按来源次序）：`诸葛亮`；字段（`field`）：状态（`status`）；比较关系（`operator`）：每一项均属于（`each-in`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：`free`、`undiscovered`
- 第 7 项：
  - 事实条件（`kind=fact`）；类别（`category`）：城市（`city`）；对象（`subject`）：`player`；字段（`field`）：持有城市（`cities`）；比较关系（`operator`）：包含全部（`contains-all`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：`新野`
- 第 8 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`player`；字段（`field`）：城市数（`city-count`）；比较关系（`operator`）：小于或等于（`lte`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：2
- 第 9 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`player`；字段（`field`）：武将列表（`officers`）；比较关系（`operator`）：包含全部（`contains-all`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：`关羽`、`张飞`
- 第 10 项：
  - 事实条件（`kind=fact`）；类别（`category`）：任务或行动（`mission`）；对象（`subject`）：列表（按来源次序）：`刘备`、`关羽`、`张飞`；字段（`field`）：正在执行任务（`on-mission`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：否（false）
- 第 11 项：
  - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：列表（按来源次序）：`诸葛亮`；字段（`field`）：与玩家君主的相性（`compatibility-to-player-ruler`）；比较关系（`operator`）：相近，阈值按来源限定（`close`）；确定性（`certainty`）：阈值未说明（`threshold-unspecified`）
    - 取值（`value`）：是（true）
- 第 12 项：
  - 全部成立（`all`）（节点种类（`kind`））
    - 逻辑：本组各子项均成立；仅表示来源的分组，不引入调度规则
    - 子项（`items`）：
      - 第 1 项：
        - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：列表（按来源次序）：`诸葛亮`；字段（`field`）：厌恶武将列表（`disliked-officers`）；比较关系（`operator`）：不包含（`not-contains`）；确定性（`certainty`）：来源明示（`stated`）
          - 取值（`value`）：`player-ruler`
      - 第 2 项：
        - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：`player-ruler`；字段（`field`）：厌恶武将列表（`disliked-officers`）；比较关系（`operator`）：全部不包含（`contains-none`）；确定性（`certainty`）：来源明示（`stated`）
          - 取值（`value`）：列表（按来源次序）：`诸葛亮`
- 第 13 项：
  - 事实条件（`kind=fact`）；类别（`category`）：城市（`city`）；对象（`subject`）：`刘备.current-city`；字段（`field`）：治安（`public-order`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：100

### 前置事件关系（`prerequisites`）

- 空列表（0 项）

### 结果与分支（仅来源描述顺序）（`orderedResults`）

- 第 1 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：设置临时状态（`set-temporary-status`）；作用对象（`target`）：`诸葛亮`
    - 参数（`values`）：
      - 状态（`status`）：暂不可分配（`unavailable-for-assignment`）
      - 持续时间（`duration`）：
        - 取值（`value`）：36
        - 单位（`unit`）：月（`months`）

### 不确定性与来源限定（`uncertainties`）

- 空列表（0 项）

<a id="gamersky.three-visits-second"></a>

## 观察 28：三顾之礼 2 - 二顾

- 事件标识（`eventId`）：`three-visits-second`
- 观察标识（`observationId`）：`gamersky.three-visits-second`
- 原文标题（`title`）：三顾之礼 2 - 二顾
- 来源标识（`sourceId`）：`gamersky-07`
- 来源网址（`sourceURL`）：[https://www.gamersky.com/handbook/200809/124174_7.shtml](https://www.gamersky.com/handbook/200809/124174_7.shtml)
- 来源章节（`sourceSection`）：三顾之礼 2 - 二顾
- 来源节序（`sourceOrdinal`）：4
- 版本范围（`version`）：
  - 游戏（`game`）：`SAN11`
  - 版本类型（`edition`）：未指定（`unspecified`）
  - 平台（`platform`）：未指定（`unspecified`）
  - 补丁（`patch`）：未指定（`unspecified`）
- 证据性质（`evidence`）：公开攻略转录（`public-guide-transcription`）
- 仅发生一次信息（`onceOnly`）：
  - 状态（`status`）：未说明（`not-stated`）
  - 标志标识（`flagId`）：未提供（null）
- 来源行定位：此观察未提供 `sourceLocator`；保留网址、章节和来源节序作为定位信息

### 触发条件（`conditions`）

- 第 1 项：
  - 事实条件（`kind=fact`）；类别（`category`）：前置事件（`prerequisite`）；对象（`subject`）：`three-visits-first`；字段（`field`）：事件发生后经过时间（`time-since-occurrence`）；比较关系（`operator`）：大于或等于（`gte`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：
      - 取值（`value`）：30
      - 单位（`unit`）：日（`days`）
- 第 2 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`player`；字段（`field`）：君主（`ruler`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：`刘备`
- 第 3 项：
  - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：列表（按来源次序）：`诸葛亮`；字段（`field`）：已达登场年龄（`debut-age-reached`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：是（true）
- 第 4 项：
  - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：列表（按来源次序）：`诸葛亮`；字段（`field`）：状态（`status`）；比较关系（`operator`）：每一项均属于（`each-in`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：`free`、`undiscovered`
- 第 5 项：
  - 事实条件（`kind=fact`）；类别（`category`）：城市（`city`）；对象（`subject`）：`player`；字段（`field`）：持有城市（`cities`）；比较关系（`operator`）：包含全部（`contains-all`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：`新野`
- 第 6 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`player`；字段（`field`）：城市数（`city-count`）；比较关系（`operator`）：小于或等于（`lte`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：2
- 第 7 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`player`；字段（`field`）：武将列表（`officers`）；比较关系（`operator`）：包含全部（`contains-all`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：`关羽`、`张飞`
- 第 8 项：
  - 事实条件（`kind=fact`）；类别（`category`）：任务或行动（`mission`）；对象（`subject`）：列表（按来源次序）：`刘备`、`关羽`、`张飞`；字段（`field`）：正在执行任务（`on-mission`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：否（false）
- 第 9 项：
  - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：`诸葛亮`；字段（`field`）：临时状态（`temporary-status`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：暂不可分配（`unavailable-for-assignment`）

### 前置事件关系（`prerequisites`）

- 第 1 项：
  - 事件标识（`eventId`）：`three-visits-first`
  - 前置要求（`requirement`）：必需前置（`required`）
  - 间隔（`delay`）：
    - 比较关系（`operator`）：大于或等于（`gte`）
    - 取值（`value`）：30
    - 单位（`unit`）：日（`days`）

### 结果与分支（仅来源描述顺序）（`orderedResults`）

- 第 1 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：来源明示无变化（`no-described-change`）；作用对象（`target`）：`event`
    - 参数（`values`）：空属性集（0 项）

### 不确定性与来源限定（`uncertainties`）

- 空列表（0 项）

<a id="gamersky.three-visits-third"></a>

## 观察 29：三顾之礼 3 - 三顾

- 事件标识（`eventId`）：`three-visits-third`
- 观察标识（`observationId`）：`gamersky.three-visits-third`
- 原文标题（`title`）：三顾之礼 3 - 三顾
- 来源标识（`sourceId`）：`gamersky-08`
- 来源网址（`sourceURL`）：[https://www.gamersky.com/handbook/200809/124174_8.shtml](https://www.gamersky.com/handbook/200809/124174_8.shtml)
- 来源章节（`sourceSection`）：三顾之礼 3 - 三顾
- 来源节序（`sourceOrdinal`）：1
- 版本范围（`version`）：
  - 游戏（`game`）：`SAN11`
  - 版本类型（`edition`）：未指定（`unspecified`）
  - 平台（`platform`）：未指定（`unspecified`）
  - 补丁（`patch`）：未指定（`unspecified`）
- 证据性质（`evidence`）：公开攻略转录（`public-guide-transcription`）
- 仅发生一次信息（`onceOnly`）：
  - 状态（`status`）：未说明（`not-stated`）
  - 标志标识（`flagId`）：未提供（null）
- 来源行定位：此观察未提供 `sourceLocator`；保留网址、章节和来源节序作为定位信息

### 触发条件（`conditions`）

- 第 1 项：
  - 事实条件（`kind=fact`）；类别（`category`）：前置事件（`prerequisite`）；对象（`subject`）：`three-visits-second`；字段（`field`）：事件发生后经过时间（`time-since-occurrence`）；比较关系（`operator`）：大于或等于（`gte`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：
      - 取值（`value`）：30
      - 单位（`unit`）：日（`days`）
- 第 2 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`player`；字段（`field`）：君主（`ruler`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：`刘备`
- 第 3 项：
  - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：列表（按来源次序）：`诸葛亮`；字段（`field`）：已达登场年龄（`debut-age-reached`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：是（true）
- 第 4 项：
  - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：列表（按来源次序）：`诸葛亮`；字段（`field`）：状态（`status`）；比较关系（`operator`）：每一项均属于（`each-in`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：`free`、`undiscovered`
- 第 5 项：
  - 事实条件（`kind=fact`）；类别（`category`）：城市（`city`）；对象（`subject`）：`player`；字段（`field`）：持有城市（`cities`）；比较关系（`operator`）：包含全部（`contains-all`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：`新野`
- 第 6 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`player`；字段（`field`）：城市数（`city-count`）；比较关系（`operator`）：小于或等于（`lte`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：2
- 第 7 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`player`；字段（`field`）：武将列表（`officers`）；比较关系（`operator`）：包含全部（`contains-all`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：`关羽`、`张飞`
- 第 8 项：
  - 事实条件（`kind=fact`）；类别（`category`）：任务或行动（`mission`）；对象（`subject`）：列表（按来源次序）：`刘备`、`关羽`、`张飞`；字段（`field`）：正在执行任务（`on-mission`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：否（false）
- 第 9 项：
  - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：`诸葛亮`；字段（`field`）：临时状态（`temporary-status`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：暂不可分配（`unavailable-for-assignment`）

### 前置事件关系（`prerequisites`）

- 第 1 项：
  - 事件标识（`eventId`）：`three-visits-second`
  - 前置要求（`requirement`）：必需前置（`required`）
  - 间隔（`delay`）：
    - 比较关系（`operator`）：大于或等于（`gte`）
    - 取值（`value`）：30
    - 单位（`unit`）：日（`days`）

### 结果与分支（仅来源描述顺序）（`orderedResults`）

- 第 1 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：加入势力（`join-force`）；作用对象（`target`）：`诸葛亮`
    - 参数（`values`）：
      - 势力（`force`）：`player`
- 第 2 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：设为（`set`）；作用对象（`target`）：`诸葛亮`
    - 参数（`values`）：
      - 身份角色（`role`）：`strategist`
      - 忠诚（`loyalty`）：100
      - 功绩（`merit`）：12000
- 第 3 项：
  - 分支（`branch`）（节点种类（`kind`））
    - 分支标识（`branchId`）：`huang-yue-ying`
    - 分支条件（`condition`）：
      - 全部成立（`all`）（节点种类（`kind`））
        - 逻辑：本组各子项均成立；仅表示来源的分组，不引入调度规则
        - 子项（`items`）：
          - 第 1 项：
            - 事实条件（`kind=fact`）；类别（`category`）：游戏设置（`settings`）；对象（`subject`）：游戏设置（`settings`）；字段（`field`）：女性武将模式（`female-officers`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
              - 取值（`value`）：`historical`
          - 第 2 项：
            - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：列表（按来源次序）：`黄月英`；字段（`field`）：已达登场年龄（`debut-age-reached`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
              - 取值（`value`）：是（true）
    - 按来源描述排列的结果（`orderedResults`）：
      - 第 1 项：
        - 结果效果（`kind=effect`）；操作（`operation`）：加入势力（`join-force`）；作用对象（`target`）：`黄月英`
          - 参数（`values`）：
            - 势力（`force`）：`player`
      - 第 2 项：
        - 结果效果（`kind=effect`）；操作（`operation`）：设为（`set`）；作用对象（`target`）：`黄月英`
          - 参数（`values`）：
            - 忠诚（`loyalty`）：100
            - 功绩（`merit`）：1000
- 第 4 项：
  - 分支（`branch`）（节点种类（`kind`））
    - 分支标识（`branchId`）：`zhuge-jun`
    - 分支条件（`condition`）：
      - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：列表（按来源次序）：`诸葛均`；字段（`field`）：已达登场年龄（`debut-age-reached`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
        - 取值（`value`）：是（true）
    - 按来源描述排列的结果（`orderedResults`）：
      - 第 1 项：
        - 结果效果（`kind=effect`）；操作（`operation`）：加入势力（`join-force`）；作用对象（`target`）：`诸葛均`
          - 参数（`values`）：
            - 势力（`force`）：`player`
      - 第 2 项：
        - 结果效果（`kind=effect`）；操作（`operation`）：设为（`set`）；作用对象（`target`）：`诸葛均`
          - 参数（`values`）：
            - 忠诚（`loyalty`）：100
            - 功绩（`merit`）：500

### 不确定性与来源限定（`uncertainties`）

- 空列表（0 项）

<a id="gamersky.recommend-ma-brothers"></a>

## 观察 30：马氏五常

- 事件标识（`eventId`）：`recommend-ma-brothers`
- 观察标识（`observationId`）：`gamersky.recommend-ma-brothers`
- 原文标题（`title`）：`马氏五常`
- 来源标识（`sourceId`）：`gamersky-08`
- 来源网址（`sourceURL`）：[https://www.gamersky.com/handbook/200809/124174_8.shtml](https://www.gamersky.com/handbook/200809/124174_8.shtml)
- 来源章节（`sourceSection`）：`马氏五常`
- 来源节序（`sourceOrdinal`）：2
- 版本范围（`version`）：
  - 游戏（`game`）：`SAN11`
  - 版本类型（`edition`）：未指定（`unspecified`）
  - 平台（`platform`）：未指定（`unspecified`）
  - 补丁（`patch`）：未指定（`unspecified`）
- 证据性质（`evidence`）：公开攻略转录（`public-guide-transcription`）
- 仅发生一次信息（`onceOnly`）：
  - 状态（`status`）：未说明（`not-stated`）
  - 标志标识（`flagId`）：未提供（null）
- 来源行定位：此观察未提供 `sourceLocator`；保留网址、章节和来源节序作为定位信息

### 触发条件（`conditions`）

- 第 1 项：
  - 事实条件（`kind=fact`）；类别（`category`）：日期（`date`）；对象（`subject`）：剧本（`scenario`）；字段（`field`）：剧本开始年月（`start-month`）；比较关系（`operator`）：指定月份之前，边界未说明（`before-month`）；确定性（`certainty`）：月份边界未说明（`month-boundary-unspecified`）
    - 取值（`value`）：列表（按来源次序）：209、12
- 第 2 项：
  - 事实条件（`kind=fact`）；类别（`category`）：日期（`date`）；对象（`subject`）：剧本（`scenario`）；字段（`field`）：剧本经过日数（`elapsed-days`）；比较关系（`operator`）：大于或等于（`gte`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：60
- 第 3 项：
  - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：列表（按来源次序）：`马良`、`马谡`；字段（`field`）：已达登场年龄（`debut-age-reached`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：是（true）
- 第 4 项：
  - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：列表（按来源次序）：`马良`、`马谡`；字段（`field`）：状态（`status`）；比较关系（`operator`）：每一项均属于（`each-in`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：`free`、`undiscovered`
- 第 5 项：
  - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：列表（按来源次序）：`马良`、`马谡`；字段（`field`）：与玩家君主的相性（`compatibility-to-player-ruler`）；比较关系（`operator`）：相近，阈值按来源限定（`close`）；确定性（`certainty`）：阈值未说明（`threshold-unspecified`）
    - 取值（`value`）：是（true）
- 第 6 项：
  - 全部成立（`all`）（节点种类（`kind`））
    - 逻辑：本组各子项均成立；仅表示来源的分组，不引入调度规则
    - 子项（`items`）：
      - 第 1 项：
        - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：列表（按来源次序）：`马良`、`马谡`；字段（`field`）：厌恶武将列表（`disliked-officers`）；比较关系（`operator`）：不包含（`not-contains`）；确定性（`certainty`）：来源明示（`stated`）
          - 取值（`value`）：`player-ruler`
      - 第 2 项：
        - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：`player-ruler`；字段（`field`）：厌恶武将列表（`disliked-officers`）；比较关系（`operator`）：全部不包含（`contains-none`）；确定性（`certainty`）：来源明示（`stated`）
          - 取值（`value`）：列表（按来源次序）：`马良`、`马谡`
- 第 7 项：
  - 事实条件（`kind=fact`）；类别（`category`）：城市（`city`）；对象（`subject`）：`player`；字段（`field`）：持有城市（`cities`）；比较关系（`operator`）：包含全部（`contains-all`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：`江陵`
- 第 8 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`player`；字段（`field`）：武将列表（`officers`）；比较关系（`operator`）：包含全部（`contains-all`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：`伊籍`
- 第 9 项：
  - 事实条件（`kind=fact`）；类别（`category`）：城市（`city`）；对象（`subject`）：列表（按来源次序）：`player-ruler`、`伊籍`；字段（`field`）：当前所在城市（`current-city`）；比较关系（`operator`）：全部相同（`all-equal`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：是（true）
- 第 10 项：
  - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：`伊籍`；字段（`field`）：忠诚（`loyalty`）；比较关系（`operator`）：大于（`gt`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：95
- 第 11 项：
  - 全部成立（`all`）（节点种类（`kind`））
    - 逻辑：本组各子项均成立；仅表示来源的分组，不引入调度规则
    - 子项（`items`）：
      - 第 1 项：
        - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：列表（按来源次序）：`伊籍`；字段（`field`）：厌恶武将列表（`disliked-officers`）；比较关系（`operator`）：不包含（`not-contains`）；确定性（`certainty`）：来源明示（`stated`）
          - 取值（`value`）：`player-ruler`
      - 第 2 项：
        - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：`player-ruler`；字段（`field`）：厌恶武将列表（`disliked-officers`）；比较关系（`operator`）：全部不包含（`contains-none`）；确定性（`certainty`）：来源明示（`stated`）
          - 取值（`value`）：列表（按来源次序）：`伊籍`
- 第 12 项：
  - 事实条件（`kind=fact`）；类别（`category`）：任务或行动（`mission`）；对象（`subject`）：列表（按来源次序）：`伊籍`；字段（`field`）：正在执行任务（`on-mission`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：否（false）

### 前置事件关系（`prerequisites`）

- 空列表（0 项）

### 结果与分支（仅来源描述顺序）（`orderedResults`）

- 第 1 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：增加（`add`）；作用对象（`target`）：`伊籍`
    - 参数（`values`）：
      - 功绩（`merit`）：500
- 第 2 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：加入势力（`join-force`）；作用对象（`target`）：列表（按来源次序）：`马良`、`马谡`
    - 参数（`values`）：
      - 势力（`force`）：`player`
- 第 3 项：
  - 分支（`branch`）（节点种类（`kind`））
    - 分支标识（`branchId`）：`liu-bei`
    - 分支条件（`condition`）：
      - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`player`；字段（`field`）：君主（`ruler`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
        - 取值（`value`）：`刘备`
    - 按来源描述排列的结果（`orderedResults`）：
      - 第 1 项：
        - 结果效果（`kind=effect`）；操作（`operation`）：设为（`set`）；作用对象（`target`）：`马良`
          - 参数（`values`）：
            - 忠诚（`loyalty`）：100
            - 功绩（`merit`）：4000
      - 第 2 项：
        - 结果效果（`kind=effect`）；操作（`operation`）：设为（`set`）；作用对象（`target`）：`马谡`
          - 参数（`values`）：
            - 忠诚（`loyalty`）：100
            - 功绩（`merit`）：500
- 第 4 项：
  - 分支（`branch`）（节点种类（`kind`））
    - 分支标识（`branchId`）：`other-ruler`
    - 分支条件（`condition`）：
      - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`player`；字段（`field`）：君主（`ruler`）；比较关系（`operator`）：不等于（`ne`）；确定性（`certainty`）：来源明示（`stated`）
        - 取值（`value`）：`刘备`
    - 按来源描述排列的结果（`orderedResults`）：
      - 第 1 项：
        - 结果效果（`kind=effect`）；操作（`operation`）：设为（`set`）；作用对象（`target`）：`马良`
          - 参数（`values`）：
            - 忠诚（`loyalty`）：100
            - 功绩（`merit`）：2000
      - 第 2 项：
        - 结果效果（`kind=effect`）；操作（`operation`）：设为（`set`）；作用对象（`target`）：`马谡`
          - 参数（`values`）：
            - 忠诚（`loyalty`）：100
            - 功绩（`merit`）：500

### 不确定性与来源限定（`uncertainties`）

- 空列表（0 项）

<a id="gamersky.marry-sun-shang-xiang"></a>

## 观察 31：孙尚香结婚

- 事件标识（`eventId`）：`marry-sun-shang-xiang`
- 观察标识（`observationId`）：`gamersky.marry-sun-shang-xiang`
- 原文标题（`title`）：`孙尚香结婚`
- 来源标识（`sourceId`）：`gamersky-08`
- 来源网址（`sourceURL`）：[https://www.gamersky.com/handbook/200809/124174_8.shtml](https://www.gamersky.com/handbook/200809/124174_8.shtml)
- 来源章节（`sourceSection`）：`孙尚香结婚`
- 来源节序（`sourceOrdinal`）：3
- 版本范围（`version`）：
  - 游戏（`game`）：`SAN11`
  - 版本类型（`edition`）：未指定（`unspecified`）
  - 平台（`platform`）：未指定（`unspecified`）
  - 补丁（`patch`）：未指定（`unspecified`）
- 证据性质（`evidence`）：公开攻略转录（`public-guide-transcription`）
- 仅发生一次信息（`onceOnly`）：
  - 状态（`status`）：未说明（`not-stated`）
  - 标志标识（`flagId`）：未提供（null）
- 来源行定位：此观察未提供 `sourceLocator`；保留网址、章节和来源节序作为定位信息

### 触发条件（`conditions`）

- 第 1 项：
  - 事实条件（`kind=fact`）；类别（`category`）：日期（`date`）；对象（`subject`）：剧本（`scenario`）；字段（`field`）：剧本开始年月（`start-month`）；比较关系（`operator`）：指定月份之前，边界未说明（`before-month`）；确定性（`certainty`）：月份边界未说明（`month-boundary-unspecified`）
    - 取值（`value`）：列表（按来源次序）：209、12
- 第 2 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`sun-wu`；字段（`field`）：君主（`ruler`）；比较关系（`operator`）：属于（`in`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：`孙坚`、`孙策`、`孙权`
- 第 3 项：
  - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：`孙尚香`；字段（`field`）：与势力君主有血缘关系（`blood-related-to-force-ruler`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：是（true）
- 第 4 项：
  - 事实条件（`kind=fact`）；类别（`category`）：游戏设置（`settings`）；对象（`subject`）：游戏设置（`settings`）；字段（`field`）：女性武将模式（`female-officers`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：`historical`
- 第 5 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`sun-wu`；字段（`field`）：武将列表（`officers`）；比较关系（`operator`）：包含全部（`contains-all`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：`孙尚香`
- 第 6 项：
  - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：`孙尚香`；字段（`field`）：身份角色（`role`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：`ordinary`
- 第 7 项：
  - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：列表（按来源次序）：`刘备`、`孙尚香`；字段（`field`）：配偶（`spouse`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：未提供（null）
- 第 8 项：
  - 事实条件（`kind=fact`）；类别（`category`）：外交（`diplomacy`）；对象（`subject`）：列表（按来源次序）：`刘备`、`sun-wu`；字段（`field`）：双向友好度（`mutual-friendship`）；比较关系（`operator`）：大于或等于（`gte`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：`neutral`
- 第 9 项：
  - 事实条件（`kind=fact`）；类别（`category`）：任务或行动（`mission`）；对象（`subject`）：列表（按来源次序）：`刘备`、`孙尚香`、`sun-wu-ruler`；字段（`field`）：正在执行任务（`on-mission`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：否（false）

### 前置事件关系（`prerequisites`）

- 空列表（0 项）

### 结果与分支（仅来源描述顺序）（`orderedResults`）

- 第 1 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：结婚（`marry`）；作用对象（`target`）：列表（按来源次序）：`刘备`、`孙尚香`
    - 参数（`values`）：空属性集（0 项）
- 第 2 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：加入势力（`join-force`）；作用对象（`target`）：`孙尚香`
    - 参数（`values`）：
      - 势力（`force`）：`刘备`
- 第 3 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：设为（`set`）；作用对象（`target`）：`孙尚香`
    - 参数（`values`）：
      - 忠诚（`loyalty`）：100
      - 功绩（`merit`）：1000
- 第 4 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：提高友好度（`increase-friendship`）；作用对象（`target`）：列表（按来源次序）：`刘备`、`sun-wu`
    - 参数（`values`）：
      - 方向（`direction`）：`mutual`
      - 变化幅度（`magnitude`）：未指定（`unspecified`）
- 第 5 项：
  - 分支（`branch`）（节点种类（`kind`））
    - 分支标识（`branchId`）：`not-allied`
    - 分支条件（`condition`）：
      - 事实条件（`kind=fact`）；类别（`category`）：外交（`diplomacy`）；对象（`subject`）：列表（按来源次序）：`刘备`、`sun-wu`；字段（`field`）：同盟（`alliance`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
        - 取值（`value`）：否（false）
    - 按来源描述排列的结果（`orderedResults`）：
      - 第 1 项：
        - 结果效果（`kind=effect`）；操作（`operation`）：缔结同盟（`form-alliance`）；作用对象（`target`）：列表（按来源次序）：`刘备`、`sun-wu`
          - 参数（`values`）：空属性集（0 项）

### 不确定性与来源限定（`uncertainties`）

- 空列表（0 项）

<a id="gamersky.lu-meng-studies"></a>

## 观察 32：吴下阿蒙

- 事件标识（`eventId`）：`lu-meng-studies`
- 观察标识（`observationId`）：`gamersky.lu-meng-studies`
- 原文标题（`title`）：`吴下阿蒙`
- 来源标识（`sourceId`）：`gamersky-09`
- 来源网址（`sourceURL`）：[https://www.gamersky.com/handbook/200809/124174_9.shtml](https://www.gamersky.com/handbook/200809/124174_9.shtml)
- 来源章节（`sourceSection`）：`吴下阿蒙`
- 来源节序（`sourceOrdinal`）：1
- 版本范围（`version`）：
  - 游戏（`game`）：`SAN11`
  - 版本类型（`edition`）：未指定（`unspecified`）
  - 平台（`platform`）：未指定（`unspecified`）
  - 补丁（`patch`）：未指定（`unspecified`）
- 证据性质（`evidence`）：公开攻略转录（`public-guide-transcription`）
- 仅发生一次信息（`onceOnly`）：
  - 状态（`status`）：未说明（`not-stated`）
  - 标志标识（`flagId`）：未提供（null）
- 来源行定位：此观察未提供 `sourceLocator`；保留网址、章节和来源节序作为定位信息

### 触发条件（`conditions`）

- 第 1 项：
  - 事实条件（`kind=fact`）；类别（`category`）：日期（`date`）；对象（`subject`）：剧本（`scenario`）；字段（`field`）：剧本经过日数（`elapsed-days`）；比较关系（`operator`）：大于或等于（`gte`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：30
- 第 2 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`player`；字段（`field`）：君主（`ruler`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：`孙权`
- 第 3 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`孙权`；字段（`field`）：武将列表（`officers`）；比较关系（`operator`）：包含全部（`contains-all`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：`吕蒙`、`蒋钦`
- 第 4 项：
  - 事实条件（`kind=fact`）；类别（`category`）：城市（`city`）；对象（`subject`）：列表（按来源次序）：`孙权`、`吕蒙`、`蒋钦`；字段（`field`）：当前所在城市（`current-city`）；比较关系（`operator`）：全部相同（`all-equal`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：是（true）
- 第 5 项：
  - 事实条件（`kind=fact`）；类别（`category`）：任务或行动（`mission`）；对象（`subject`）：列表（按来源次序）：`孙权`、`吕蒙`、`蒋钦`；字段（`field`）：正在执行任务（`on-mission`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：否（false）
- 第 6 项：
  - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：列表（按来源次序）：`吕蒙`、`蒋钦`；字段（`field`）：智力（`intelligence`）；比较关系（`operator`）：小于（`lt`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：75
- 第 7 项：
  - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：列表（按来源次序）：`吕蒙`、`蒋钦`；字段（`field`）：忠诚（`loyalty`）；比较关系（`operator`）：大于（`gt`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：95
- 第 8 项：
  - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：列表（按来源次序）：`吕蒙`、`蒋钦`；字段（`field`）：功绩（`merit`）；比较关系（`operator`）：大于（`gt`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：5000

### 前置事件关系（`prerequisites`）

- 空列表（0 项）

### 结果与分支（仅来源描述顺序）（`orderedResults`）

- 第 1 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：增加（`add`）；作用对象（`target`）：列表（按来源次序）：`吕蒙`、`蒋钦`
    - 参数（`values`）：
      - 功绩（`merit`）：500
- 第 2 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：设为（`set`）；作用对象（`target`）：`吕蒙`
    - 参数（`values`）：
      - 统率（`leadership`）：91
      - 智力（`intelligence`）：89
      - 政治（`politics`）：78
- 第 3 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：设为（`set`）；作用对象（`target`）：`蒋钦`
    - 参数（`values`）：
      - 统率（`leadership`）：78
      - 智力（`intelligence`）：51
      - 政治（`politics`）：42
- 第 4 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：改变头像（`change-portrait`）；作用对象（`target`）：`吕蒙`
    - 参数（`values`）：
      - 头像（`portrait`）：未指定（`unspecified`）

### 不确定性与来源限定（`uncertainties`）

- 第 1 项：This source gives no PK qualifier, raise-only rule or portrait index.

<a id="gamersky.zhou-yu-death"></a>

## 观察 33：周瑜之死

- 事件标识（`eventId`）：`zhou-yu-death`
- 观察标识（`observationId`）：`gamersky.zhou-yu-death`
- 原文标题（`title`）：`周瑜之死`
- 来源标识（`sourceId`）：`gamersky-09`
- 来源网址（`sourceURL`）：[https://www.gamersky.com/handbook/200809/124174_9.shtml](https://www.gamersky.com/handbook/200809/124174_9.shtml)
- 来源章节（`sourceSection`）：`周瑜之死`
- 来源节序（`sourceOrdinal`）：2
- 版本范围（`version`）：
  - 游戏（`game`）：`SAN11`
  - 版本类型（`edition`）：未指定（`unspecified`）
  - 平台（`platform`）：未指定（`unspecified`）
  - 补丁（`patch`）：未指定（`unspecified`）
- 证据性质（`evidence`）：公开攻略转录（`public-guide-transcription`）
- 仅发生一次信息（`onceOnly`）：
  - 状态（`status`）：未说明（`not-stated`）
  - 标志标识（`flagId`）：未提供（null）
- 来源行定位：此观察未提供 `sourceLocator`；保留网址、章节和来源节序作为定位信息

### 触发条件（`conditions`）

- 第 1 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`player`；字段（`field`）：武将列表（`officers`）；比较关系（`operator`）：包含全部（`contains-all`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：`周瑜`、`鲁肃`
- 第 2 项：
  - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：`周瑜`；字段（`field`）：死亡类型（`death-type`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：`natural`
- 第 3 项：
  - 事实条件（`kind=fact`）；类别（`category`）：日期（`date`）；对象（`subject`）：`周瑜`；字段（`field`）：已到预定死亡时间（`scheduled-death-reached`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：是（true）
- 第 4 项：
  - 事实条件（`kind=fact`）；类别（`category`）：城市（`city`）；对象（`subject`）：`player`；字段（`field`）：持有城市（`cities`）；比较关系（`operator`）：包含全部（`contains-all`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：`庐江`、`柴桑`、`建业`、`吴`、`会稽`
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
    - 分支标识（`branchId`）：`lu-su-lower`
    - 分支条件（`condition`）：
      - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：`鲁肃`；字段（`field`）：功绩（`merit`）；比较关系（`operator`）：小于（`lt`）；确定性（`certainty`）：来源明示（`stated`）
        - 取值（`value`）：`周瑜.merit`
    - 按来源描述排列的结果（`orderedResults`）：
      - 第 1 项：
        - 结果效果（`kind=effect`）；操作（`operation`）：复制字段（`copy-field`）；作用对象（`target`）：`鲁肃`
          - 参数（`values`）：
            - 字段（`field`）：功绩（`merit`）
            - 来源（`source`）：`周瑜.merit`
- 第 3 项：
  - 分支（`branch`）（节点种类（`kind`））
    - 分支标识（`branchId`）：`lu-su-higher`
    - 分支条件（`condition`）：
      - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：`鲁肃`；字段（`field`）：功绩（`merit`）；比较关系（`operator`）：大于（`gt`）；确定性（`certainty`）：来源明示（`stated`）
        - 取值（`value`）：`周瑜.merit`
    - 按来源描述排列的结果（`orderedResults`）：
      - 第 1 项：
        - 结果效果（`kind=effect`）；操作（`operation`）：增加（`add`）；作用对象（`target`）：`鲁肃`
          - 参数（`values`）：
            - 功绩（`merit`）：2000

### 不确定性与来源限定（`uncertainties`）

- 第 1 项：Equal-merit result is unstated.

<a id="gamersky.cao-cao-death"></a>

## 观察 34：曹操之死

- 事件标识（`eventId`）：`cao-cao-death`
- 观察标识（`observationId`）：`gamersky.cao-cao-death`
- 原文标题（`title`）：`曹操之死`
- 来源标识（`sourceId`）：`gamersky-09`
- 来源网址（`sourceURL`）：[https://www.gamersky.com/handbook/200809/124174_9.shtml](https://www.gamersky.com/handbook/200809/124174_9.shtml)
- 来源章节（`sourceSection`）：`曹操之死`
- 来源节序（`sourceOrdinal`）：3
- 版本范围（`version`）：
  - 游戏（`game`）：`SAN11`
  - 版本类型（`edition`）：未指定（`unspecified`）
  - 平台（`platform`）：未指定（`unspecified`）
  - 补丁（`patch`）：未指定（`unspecified`）
- 证据性质（`evidence`）：公开攻略转录（`public-guide-transcription`）
- 仅发生一次信息（`onceOnly`）：
  - 状态（`status`）：未说明（`not-stated`）
  - 标志标识（`flagId`）：未提供（null）
- 来源行定位：此观察未提供 `sourceLocator`；保留网址、章节和来源节序作为定位信息

### 触发条件（`conditions`）

- 第 1 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`player`；字段（`field`）：君主（`ruler`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：`曹操`
- 第 2 项：
  - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：`曹操`；字段（`field`）：死亡类型（`death-type`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：`natural`
- 第 3 项：
  - 事实条件（`kind=fact`）；类别（`category`）：日期（`date`）；对象（`subject`）：`曹操`；字段（`field`）：已到预定死亡时间（`scheduled-death-reached`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：是（true）
- 第 4 项：
  - 事实条件（`kind=fact`）；类别（`category`）：爵位（`title`）；对象（`subject`）：`曹操`；字段（`field`）：爵位（`title`）；比较关系（`operator`）：属于（`in`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：`duke`、`king`、`emperor`
- 第 5 项：
  - 事实条件（`kind=fact`）；类别（`category`）：城市（`city`）；对象（`subject`）：`曹操`；字段（`field`）：持有城市（`cities`）；比较关系（`operator`）：包含全部（`contains-all`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：`洛阳`、`邺`、`长安`
- 第 6 项：
  - 事实条件（`kind=fact`）；类别（`category`）：城市（`city`）；对象（`subject`）：`曹操`；字段（`field`）：中原城市数（`central-plains-city-count`）；比较关系（`operator`）：大于或等于（`gte`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：7
- 第 7 项：
  - 事实条件（`kind=fact`）；类别（`category`）：城市（`city`）；对象（`subject`）：`曹操`；字段（`field`）：襄平以外河北城市（`hebei-cities-except-xiangping`）；比较关系（`operator`）：包含全部（`contains-all`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：是（true）
- 第 8 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`曹操`；字段（`field`）：武将列表（`officers`）；比较关系（`operator`）：包含任一（`contains-any`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：`曹昂`、`曹丕`、`曹植`、`曹冲`、`曹彰`
- 第 9 项：
  - 事实条件（`kind=fact`）；类别（`category`）：任务或行动（`mission`）；对象（`subject`）：列表（按来源次序）：`曹操`、`selected-successor`；字段（`field`）：正在执行任务（`on-mission`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：否（false）

### 前置事件关系（`prerequisites`）

- 空列表（0 项）

### 结果与分支（仅来源描述顺序）（`orderedResults`）

- 第 1 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：死亡（`death`）；作用对象（`target`）：`曹操`
    - 参数（`values`）：空属性集（0 项）
- 第 2 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：选择继承人（`select-successor`）；作用对象（`target`）：`曹操`
    - 参数（`values`）：
      - 优先次序（`priority`）：列表（按来源次序）：`曹昂`、`曹丕`、`曹植`、`曹冲`、`曹彰`
      - 资格（`eligible`）：officers of Cao Cao

### 不确定性与来源限定（`uncertainties`）

- 空列表（0 项）

<a id="gamersky.liu-bei-hanzhong-king"></a>

## 观察 35：汉中王即位

- 事件标识（`eventId`）：`liu-bei-hanzhong-king`
- 观察标识（`observationId`）：`gamersky.liu-bei-hanzhong-king`
- 原文标题（`title`）：`汉中王即位`
- 来源标识（`sourceId`）：`gamersky-09`
- 来源网址（`sourceURL`）：[https://www.gamersky.com/handbook/200809/124174_9.shtml](https://www.gamersky.com/handbook/200809/124174_9.shtml)
- 来源章节（`sourceSection`）：`汉中王即位`
- 来源节序（`sourceOrdinal`）：4
- 版本范围（`version`）：
  - 游戏（`game`）：`SAN11`
  - 版本类型（`edition`）：未指定（`unspecified`）
  - 平台（`platform`）：未指定（`unspecified`）
  - 补丁（`patch`）：未指定（`unspecified`）
- 证据性质（`evidence`）：公开攻略转录（`public-guide-transcription`）
- 仅发生一次信息（`onceOnly`）：
  - 状态（`status`）：未说明（`not-stated`）
  - 标志标识（`flagId`）：未提供（null）
- 来源行定位：此观察未提供 `sourceLocator`；保留网址、章节和来源节序作为定位信息

### 触发条件（`conditions`）

- 第 1 项：
  - 事实条件（`kind=fact`）；类别（`category`）：日期（`date`）；对象（`subject`）：剧本（`scenario`）；字段（`field`）：剧本开始年月（`start-month`）；比较关系（`operator`）：指定月份之前，边界未说明（`before-month`）；确定性（`certainty`）：月份边界未说明（`month-boundary-unspecified`）
    - 取值（`value`）：列表（按来源次序）：218、12
- 第 2 项：
  - 事实条件（`kind=fact`）；类别（`category`）：日期（`date`）；对象（`subject`）：剧本（`scenario`）；字段（`field`）：剧本经过日数（`elapsed-days`）；比较关系（`operator`）：大于或等于（`gte`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：180
- 第 3 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`player`；字段（`field`）：君主（`ruler`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：`刘备`
- 第 4 项：
  - 事实条件（`kind=fact`）；类别（`category`）：城市（`city`）；对象（`subject`）：`刘备`；字段（`field`）：持有城市（`cities`）；比较关系（`operator`）：包含全部（`contains-all`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：`永安`、`汉中`、`梓潼`、`江洲`、`成都`
- 第 5 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`刘备`；字段（`field`）：武将列表（`officers`）；比较关系（`operator`）：包含全部（`contains-all`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：`诸葛亮`
- 第 6 项：
  - 事实条件（`kind=fact`）；类别（`category`）：爵位（`title`）；对象（`subject`）：`刘备`；字段（`field`）：爵位（`title`）；比较关系（`operator`）：不属于（`not-in`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：`king`、`emperor`
- 第 7 项：
  - 事实条件（`kind=fact`）；类别（`category`）：皇帝（`emperor`）；对象（`subject`）：`刘备`；字段（`field`）：拥立汉帝（`supports-han-emperor`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：否（false）
- 第 8 项：
  - 事实条件（`kind=fact`）；类别（`category`）：任务或行动（`mission`）；对象（`subject`）：列表（按来源次序）：`刘备`、`诸葛亮`；字段（`field`）：正在执行任务（`on-mission`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：否（false）

### 前置事件关系（`prerequisites`）

- 空列表（0 项）

### 结果与分支（仅来源描述顺序）（`orderedResults`）

- 第 1 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：设为（`set`）；作用对象（`target`）：`刘备`
    - 参数（`values`）：
      - 爵位（`title`）：`king`
- 第 2 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：增加（`add`）；作用对象（`target`）：`刘备.controlled-cities`
    - 参数（`values`）：
      - 治安（`publicOrder`）：15
      - 士气（`morale`）：15
- 第 3 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：增加（`add`）；作用对象（`target`）：`诸葛亮`
    - 参数（`values`）：
      - 功绩（`merit`）：2000
- 第 4 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：增加（`add`）；作用对象（`target`）：`刘备.officers`
    - 参数（`values`）：
      - 忠诚（`loyalty`）：15
- 第 5 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：降低友好度（`decrease-friendship`）；作用对象（`target`）：`刘备`
    - 参数（`values`）：
      - 作用对象筛选（`targetSelector`）：not allied
      - 变化幅度（`magnitude`）：未指定（`unspecified`）
      - 方向（`direction`）：未指定（`unspecified`）
- 第 6 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：降低友好度（`decrease-friendship`）；作用对象（`target`）：`刘备`
    - 参数（`values`）：
      - 作用对象筛选（`targetSelector`）：friendship below goodwill
      - 变化幅度（`magnitude`）：未指定（`unspecified`）
      - 方向（`direction`）：未指定（`unspecified`）
- 第 7 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：降低友好度（`decrease-friendship`）；作用对象（`target`）：`刘备`
    - 参数（`values`）：
      - 作用对象筛选（`targetSelector`）：`曹操`
      - 变化幅度（`magnitude`）：未指定（`unspecified`）
      - 方向（`direction`）：`mutual`
- 第 8 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：降低友好度（`decrease-friendship`）；作用对象（`target`）：`刘备`
    - 参数（`values`）：
      - 作用对象筛选（`targetSelector`）：rulers blood-related to CaoCao
      - 变化幅度（`magnitude`）：未指定（`unspecified`）
      - 方向（`direction`）：`mutual`
- 第 9 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：降低友好度（`decrease-friendship`）；作用对象（`target`）：`刘备`
    - 参数（`values`）：
      - 作用对象筛选（`targetSelector`）：Han-emperor-supporting rulers
      - 变化幅度（`magnitude`）：未指定（`unspecified`）
      - 方向（`direction`）：`mutual`

### 不确定性与来源限定（`uncertainties`）

- 第 1 项：Diplomacy filters are separate source lines, not silently grouped with the other guide.

<a id="gamersky.wei-emperor-accession"></a>

## 观察 36：魏帝即位

- 事件标识（`eventId`）：`wei-emperor-accession`
- 观察标识（`observationId`）：`gamersky.wei-emperor-accession`
- 原文标题（`title`）：`魏帝即位`
- 来源标识（`sourceId`）：`gamersky-10`
- 来源网址（`sourceURL`）：[https://www.gamersky.com/handbook/200809/124174_10.shtml](https://www.gamersky.com/handbook/200809/124174_10.shtml)
- 来源章节（`sourceSection`）：`魏帝即位`
- 来源节序（`sourceOrdinal`）：1
- 版本范围（`version`）：
  - 游戏（`game`）：`SAN11`
  - 版本类型（`edition`）：未指定（`unspecified`）
  - 平台（`platform`）：未指定（`unspecified`）
  - 补丁（`patch`）：未指定（`unspecified`）
- 证据性质（`evidence`）：公开攻略转录（`public-guide-transcription`）
- 仅发生一次信息（`onceOnly`）：
  - 状态（`status`）：未说明（`not-stated`）
  - 标志标识（`flagId`）：未提供（null）
- 来源行定位：此观察未提供 `sourceLocator`；保留网址、章节和来源节序作为定位信息

### 触发条件（`conditions`）

- 第 1 项：
  - 事实条件（`kind=fact`）；类别（`category`）：日期（`date`）；对象（`subject`）：剧本（`scenario`）；字段（`field`）：剧本开始年月（`start-month`）；比较关系（`operator`）：指定月份之前，边界未说明（`before-month`）；确定性（`certainty`）：月份边界未说明（`month-boundary-unspecified`）
    - 取值（`value`）：列表（按来源次序）：219、12
- 第 2 项：
  - 事实条件（`kind=fact`）；类别（`category`）：日期（`date`）；对象（`subject`）：剧本（`scenario`）；字段（`field`）：剧本经过日数（`elapsed-days`）；比较关系（`operator`）：大于或等于（`gte`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：180
- 第 3 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`cao-family`；字段（`field`）：存在（`exists`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：是（true）
- 第 4 项：
  - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：`cao-family-ruler`；字段（`field`）：与指定人物有血缘关系（`blood-related-to`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：`曹操`
- 第 5 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`cao-family`；字段（`field`）：君主（`ruler`）；比较关系（`operator`）：不等于（`ne`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：`曹操`
- 第 6 项：
  - 事实条件（`kind=fact`）；类别（`category`）：爵位（`title`）；对象（`subject`）：`cao-family-ruler`；字段（`field`）：爵位（`title`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：`king`
- 第 7 项：
  - 事实条件（`kind=fact`）；类别（`category`）：皇帝（`emperor`）；对象（`subject`）：`cao-family`；字段（`field`）：拥立汉帝（`supports-han-emperor`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：是（true）
- 第 8 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`cao-family`；字段（`field`）：城市数（`city-count`）；比较关系（`operator`）：大于或等于（`gte`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：12
- 第 9 项：
  - 事实条件（`kind=fact`）；类别（`category`）：城市（`city`）；对象（`subject`）：`cao-family`；字段（`field`）：持有城市（`cities`）；比较关系（`operator`）：包含全部（`contains-all`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：`许昌`、`洛阳`、`邺`、`长安`
- 第 10 项：
  - 事实条件（`kind=fact`）；类别（`category`）：任务或行动（`mission`）；对象（`subject`）：列表（按来源次序）：`cao-family-ruler`；字段（`field`）：正在执行任务（`on-mission`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：否（false）
- 第 11 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`other-forces`；字段（`field`）：国号（`state-name`）；比较关系（`operator`）：没有一项等于（`none-eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：`魏`

### 前置事件关系（`prerequisites`）

- 空列表（0 项）

### 结果与分支（仅来源描述顺序）（`orderedResults`）

- 第 1 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：设为（`set`）；作用对象（`target`）：`cao-family`
    - 参数（`values`）：
      - 爵位（`title`）：皇帝（`emperor`）
- 第 2 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：设为（`set`）；作用对象（`target`）：`cao-family`
    - 参数（`values`）：
      - 国号（`stateName`）：`魏`
- 第 3 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：死亡（`death`）；作用对象（`target`）：`han-emperor`
    - 参数（`values`）：空属性集（0 项）
- 第 4 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：增加（`add`）；作用对象（`target`）：`cao-family.controlled-cities`
    - 参数（`values`）：
      - 治安（`publicOrder`）：20
      - 士气（`morale`）：20
- 第 5 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：增加（`add`）；作用对象（`target`）：`cao-family.Han-respecting-officers`
    - 参数（`values`）：
      - 忠诚（`loyalty`）：-20
- 第 6 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：增加（`add`）；作用对象（`target`）：`cao-family.other-officers`
    - 参数（`values`）：
      - 忠诚（`loyalty`）：20
- 第 7 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：降低友好度（`decrease-friendship`）；作用对象（`target`）：`cao-family`
    - 参数（`values`）：
      - 作用对象筛选（`targetSelector`）：not allied
      - 变化幅度（`magnitude`）：`large`
      - 方向（`direction`）：未指定（`unspecified`）
- 第 8 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：降低友好度（`decrease-friendship`）；作用对象（`target`）：`cao-family`
    - 参数（`values`）：
      - 作用对象筛选（`targetSelector`）：friendship below goodwill
      - 变化幅度（`magnitude`）：`large`
      - 方向（`direction`）：未指定（`unspecified`）
- 第 9 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：降低友好度（`decrease-friendship`）；作用对象（`target`）：`cao-family`
    - 参数（`values`）：
      - 作用对象筛选（`targetSelector`）：Han-respecting rulers
      - 变化幅度（`magnitude`）：`large`
      - 方向（`direction`）：未指定（`unspecified`）
- 第 10 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：降低友好度（`decrease-friendship`）；作用对象（`target`）：`cao-family`
    - 参数（`values`）：
      - 作用对象筛选（`targetSelector`）：emperor-ranked rulers
      - 变化幅度（`magnitude`）：`large`
      - 方向（`direction`）：`mutual`
- 第 11 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：降低友好度（`decrease-friendship`）；作用对象（`target`）：`cao-family`
    - 参数（`values`）：
      - 作用对象筛选（`targetSelector`）：`刘备`
      - 变化幅度（`magnitude`）：`large`
      - 方向（`direction`）：`mutual`
- 第 12 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：降低友好度（`decrease-friendship`）；作用对象（`target`）：`cao-family`
    - 参数（`values`）：
      - 作用对象筛选（`targetSelector`）：rulers with close compatibility to LiuBei
      - 变化幅度（`magnitude`）：`large`
      - 方向（`direction`）：`mutual`

### 不确定性与来源限定（`uncertainties`）

- 第 1 项：No decline branch is described.
- 第 2 项：Diplomacy filters are separately listed and must not inherit conjunction from another source.

<a id="gamersky.shu-emperor-accession"></a>

## 观察 37：蜀帝即位

- 事件标识（`eventId`）：`shu-emperor-accession`
- 观察标识（`observationId`）：`gamersky.shu-emperor-accession`
- 原文标题（`title`）：`蜀帝即位`
- 来源标识（`sourceId`）：`gamersky-10`
- 来源网址（`sourceURL`）：[https://www.gamersky.com/handbook/200809/124174_10.shtml](https://www.gamersky.com/handbook/200809/124174_10.shtml)
- 来源章节（`sourceSection`）：`蜀帝即位`
- 来源节序（`sourceOrdinal`）：2
- 版本范围（`version`）：
  - 游戏（`game`）：`SAN11`
  - 版本类型（`edition`）：未指定（`unspecified`）
  - 平台（`platform`）：未指定（`unspecified`）
  - 补丁（`patch`）：未指定（`unspecified`）
- 证据性质（`evidence`）：公开攻略转录（`public-guide-transcription`）
- 仅发生一次信息（`onceOnly`）：
  - 状态（`status`）：未说明（`not-stated`）
  - 标志标识（`flagId`）：未提供（null）
- 来源行定位：此观察未提供 `sourceLocator`；保留网址、章节和来源节序作为定位信息

### 触发条件（`conditions`）

- 第 1 项：
  - 事实条件（`kind=fact`）；类别（`category`）：日期（`date`）；对象（`subject`）：`event`；字段（`field`）：提前日期条款（`accelerated-date-clause`）；比较关系（`operator`）：未解决（`unresolved`）；确定性（`certainty`）：来源有歧义（`source-ambiguous`）
    - 取值（`value`）：
      - 基准条件（`baselineConditions`）：
        - 全部成立（`all`）（节点种类（`kind`））
          - 逻辑：本组各子项均成立；仅表示来源的分组，不引入调度规则
          - 子项（`items`）：
            - 第 1 项：
              - 事实条件（`kind=fact`）；类别（`category`）：日期（`date`）；对象（`subject`）：剧本（`scenario`）；字段（`field`）：剧本开始年月（`start-month`）；比较关系（`operator`）：指定月份之前，边界未说明（`before-month`）；确定性（`certainty`）：月份边界未说明（`month-boundary-unspecified`）
                - 取值（`value`）：列表（按来源次序）：220、12
            - 第 2 项：
              - 事实条件（`kind=fact`）；类别（`category`）：日期（`date`）；对象（`subject`）：剧本（`scenario`）；字段（`field`）：剧本经过日数（`elapsed-days`）；比较关系（`operator`）：大于或等于（`gte`）；确定性（`certainty`）：来源明示（`stated`）
                - 取值（`value`）：180
      - 可能提前日期的事件（`accelerationEvent`）：`wei-emperor-accession`
      - 受影响的基准条件（`affectedBaselinePredicates`）：未说明（`not-stated`）
      - 替代条件（`replacementConditions`）：未说明（`not-stated`）
- 第 2 项：
  - 事实条件（`kind=fact`）；类别（`category`）：皇帝（`emperor`）；对象（`subject`）：`han-emperor`；字段（`field`）：已死亡（`dead`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：是（true）
- 第 3 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`cao-family`；字段（`field`）：存在（`exists`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：是（true）
- 第 4 项：
  - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：`cao-family-ruler`；字段（`field`）：与指定人物有血缘关系（`blood-related-to`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：`曹操`
- 第 5 项：
  - 事实条件（`kind=fact`）；类别（`category`）：爵位（`title`）；对象（`subject`）：`cao-family-ruler`；字段（`field`）：爵位（`title`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：皇帝（`emperor`）
- 第 6 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`cao-family`；字段（`field`）：城市数（`city-count`）；比较关系（`operator`）：大于或等于（`gte`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：8
- 第 7 项：
  - 事实条件（`kind=fact`）；类别（`category`）：城市（`city`）；对象（`subject`）：`cao-family`；字段（`field`）：持有城市（`cities`）；比较关系（`operator`）：包含全部（`contains-all`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：`洛阳`、`邺`
- 第 8 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`liu-family`；字段（`field`）：存在（`exists`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：是（true）
- 第 9 项：
  - 任一成立（`any`）（节点种类（`kind`））
    - 逻辑：本组至少一个子项成立；仅表示来源的分组，不引入调度规则
    - 子项（`items`）：
      - 第 1 项：
        - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`liu-family`；字段（`field`）：君主（`ruler`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
          - 取值（`value`）：`刘备`
      - 第 2 项：
        - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：`liu-family-ruler`；字段（`field`）：与刘备的相性（`compatibility-to-liu-bei`）；比较关系（`operator`）：相近，阈值按来源限定（`close`）；确定性（`certainty`）：阈值未说明（`threshold-unspecified`）
          - 取值（`value`）：是（true）
- 第 10 项：
  - 事实条件（`kind=fact`）；类别（`category`）：爵位（`title`）；对象（`subject`）：`liu-family`；字段（`field`）：爵位（`title`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：`king`
- 第 11 项：
  - 事实条件（`kind=fact`）；类别（`category`）：城市（`city`）；对象（`subject`）：`liu-family`；字段（`field`）：持有城市（`cities`）；比较关系（`operator`）：包含全部（`contains-all`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：`永安`、`汉中`、`梓潼`、`江洲`、`成都`
- 第 12 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`liu-family`；字段（`field`）：武将列表（`officers`）；比较关系（`operator`）：包含全部（`contains-all`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：`诸葛亮`
- 第 13 项：
  - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：列表（按来源次序）：`liu-family-ruler`、`cao-family-ruler`；字段（`field`）：相性（`compatibility`）；比较关系（`operator`）：不相近，阈值按来源限定（`not-close`）；确定性（`certainty`）：阈值未说明（`threshold-unspecified`）
    - 取值（`value`）：是（true）
- 第 14 项：
  - 事实条件（`kind=fact`）；类别（`category`）：外交（`diplomacy`）；对象（`subject`）：列表（按来源次序）：`liu-family`、`cao-family`；字段（`field`）：同盟（`alliance`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：否（false）
- 第 15 项：
  - 事实条件（`kind=fact`）；类别（`category`）：外交（`diplomacy`）；对象（`subject`）：列表（按来源次序）：`liu-family`、`cao-family`；字段（`field`）：友好度（`friendship`）；比较关系（`operator`）：小于（`lt`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：`goodwill`
- 第 16 项：
  - 事实条件（`kind=fact`）；类别（`category`）：任务或行动（`mission`）；对象（`subject`）：列表（按来源次序）：`liu-family-ruler`、`诸葛亮`；字段（`field`）：正在执行任务（`on-mission`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：否（false）

### 前置事件关系（`prerequisites`）

- 第 1 项：
  - 事件标识（`eventId`）：`wei-emperor-accession`
  - 前置要求（`requirement`）：可能提前日期（`may-accelerate`）
  - 间隔（`delay`）：未提供（null）

### 结果与分支（仅来源描述顺序）（`orderedResults`）

- 第 1 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：设为（`set`）；作用对象（`target`）：`liu-family`
    - 参数（`values`）：
      - 爵位（`title`）：皇帝（`emperor`）
- 第 2 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：设为（`set`）；作用对象（`target`）：`liu-family`
    - 参数（`values`）：
      - 国号（`stateName`）：`蜀`
- 第 3 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：增加（`add`）；作用对象（`target`）：`liu-family.controlled-cities`
    - 参数（`values`）：
      - 治安（`publicOrder`）：30
      - 士气（`morale`）：30
- 第 4 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：增加（`add`）；作用对象（`target`）：`liu-family.officers`
    - 参数（`values`）：
      - 忠诚（`loyalty`）：30
- 第 5 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：降低友好度（`decrease-friendship`）；作用对象（`target`）：`liu-family`
    - 参数（`values`）：
      - 作用对象筛选（`targetSelector`）：not allied
      - 变化幅度（`magnitude`）：未指定（`unspecified`）
      - 方向（`direction`）：未指定（`unspecified`）
- 第 6 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：降低友好度（`decrease-friendship`）；作用对象（`target`）：`liu-family`
    - 参数（`values`）：
      - 作用对象筛选（`targetSelector`）：friendship below goodwill
      - 变化幅度（`magnitude`）：未指定（`unspecified`）
      - 方向（`direction`）：未指定（`unspecified`）
- 第 7 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：降低友好度（`decrease-friendship`）；作用对象（`target`）：`liu-family`
    - 参数（`values`）：
      - 作用对象筛选（`targetSelector`）：emperor-ranked rulers
      - 变化幅度（`magnitude`）：未指定（`unspecified`）
      - 方向（`direction`）：`mutual`
- 第 8 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：降低友好度（`decrease-friendship`）；作用对象（`target`）：`liu-family`
    - 参数（`values`）：
      - 作用对象筛选（`targetSelector`）：`曹操`
      - 变化幅度（`magnitude`）：未指定（`unspecified`）
      - 方向（`direction`）：`mutual`
- 第 9 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：降低友好度（`decrease-friendship`）；作用对象（`target`）：`liu-family`
    - 参数（`values`）：
      - 作用对象筛选（`targetSelector`）：`cao-family`
      - 变化幅度（`magnitude`）：未指定（`unspecified`）
      - 方向（`direction`）：`mutual`

### 不确定性与来源限定（`uncertainties`）

- 第 1 项：Wei accession may accelerate the date, but the new threshold and overridden predicates are unspecified.
- 第 2 项：Diplomacy filters remain separate source lines.

<a id="gamersky.sons-of-tigers-oath"></a>

## 观察 38：虎之子

- 事件标识（`eventId`）：`sons-of-tigers-oath`
- 观察标识（`observationId`）：`gamersky.sons-of-tigers-oath`
- 原文标题（`title`）：`虎之子`
- 来源标识（`sourceId`）：`gamersky-11`
- 来源网址（`sourceURL`）：[https://www.gamersky.com/handbook/200809/124174_11.shtml](https://www.gamersky.com/handbook/200809/124174_11.shtml)
- 来源章节（`sourceSection`）：`虎之子`
- 来源节序（`sourceOrdinal`）：1
- 版本范围（`version`）：
  - 游戏（`game`）：`SAN11`
  - 版本类型（`edition`）：未指定（`unspecified`）
  - 平台（`platform`）：未指定（`unspecified`）
  - 补丁（`patch`）：未指定（`unspecified`）
- 证据性质（`evidence`）：公开攻略转录（`public-guide-transcription`）
- 仅发生一次信息（`onceOnly`）：
  - 状态（`status`）：未说明（`not-stated`）
  - 标志标识（`flagId`）：未提供（null）
- 来源行定位：此观察未提供 `sourceLocator`；保留网址、章节和来源节序作为定位信息

### 触发条件（`conditions`）

- 第 1 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`liu-family`；字段（`field`）：存在（`exists`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：是（true）
- 第 2 项：
  - 任一成立（`any`）（节点种类（`kind`））
    - 逻辑：本组至少一个子项成立；仅表示来源的分组，不引入调度规则
    - 子项（`items`）：
      - 第 1 项：
        - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`liu-family`；字段（`field`）：君主（`ruler`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
          - 取值（`value`）：`刘备`
      - 第 2 项：
        - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：`liu-family-ruler`；字段（`field`）：与刘备的相性（`compatibility-to-liu-bei`）；比较关系（`operator`）：相近，阈值按来源限定（`close`）；确定性（`certainty`）：阈值未说明（`threshold-unspecified`）
          - 取值（`value`）：是（true）
- 第 3 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`liu-family`；字段（`field`）：武将列表（`officers`）；比较关系（`operator`）：包含全部（`contains-all`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：`关兴`、`张苞`
- 第 4 项：
  - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：列表（按来源次序）：`关兴`、`张苞`；字段（`field`）：义兄弟（`sworn-siblings`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：空列表（0 项）
- 第 5 项：
  - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：列表（按来源次序）：`关兴`、`张苞`；字段（`field`）：功绩（`merit`）；比较关系（`operator`）：大于（`gt`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：8000
- 第 6 项：
  - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：列表（按来源次序）：`关兴`、`张苞`；字段（`field`）：与刘家势力君主有血缘关系（`blood-related-to-liu-family-ruler`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：否（false）
- 第 7 项：
  - 事实条件（`kind=fact`）；类别（`category`）：城市（`city`）；对象（`subject`）：列表（按来源次序）：`关兴`、`张苞`、`liu-family-ruler`；字段（`field`）：当前所在城市（`current-city`）；比较关系（`operator`）：全部相同（`all-equal`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：是（true）
- 第 8 项：
  - 事实条件（`kind=fact`）；类别（`category`）：任务或行动（`mission`）；对象（`subject`）：列表（按来源次序）：`关兴`、`张苞`、`liu-family-ruler`；字段（`field`）：正在执行任务（`on-mission`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：否（false）

### 前置事件关系（`prerequisites`）

- 空列表（0 项）

### 结果与分支（仅来源描述顺序）（`orderedResults`）

- 第 1 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：结义（`swear-brotherhood`）；作用对象（`target`）：列表（按来源次序）：`关兴`、`张苞`
    - 参数（`values`）：空属性集（0 项）
- 第 2 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：设为（`set`）；作用对象（`target`）：列表（按来源次序）：`关兴`、`张苞`
    - 参数（`values`）：
      - 忠诚（`loyalty`）：100
- 第 3 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：增加（`add`）；作用对象（`target`）：列表（按来源次序）：`关兴`、`张苞`
    - 参数（`values`）：
      - 功绩（`merit`）：500

### 不确定性与来源限定（`uncertainties`）

- 空列表（0 项）

<a id="gamersky.wu-king-accession"></a>

## 观察 39：吴王即位

- 事件标识（`eventId`）：`wu-king-accession`
- 观察标识（`observationId`）：`gamersky.wu-king-accession`
- 原文标题（`title`）：`吴王即位`
- 来源标识（`sourceId`）：`gamersky-11`
- 来源网址（`sourceURL`）：[https://www.gamersky.com/handbook/200809/124174_11.shtml](https://www.gamersky.com/handbook/200809/124174_11.shtml)
- 来源章节（`sourceSection`）：`吴王即位`
- 来源节序（`sourceOrdinal`）：2
- 版本范围（`version`）：
  - 游戏（`game`）：`SAN11`
  - 版本类型（`edition`）：未指定（`unspecified`）
  - 平台（`platform`）：未指定（`unspecified`）
  - 补丁（`patch`）：未指定（`unspecified`）
- 证据性质（`evidence`）：公开攻略转录（`public-guide-transcription`）
- 仅发生一次信息（`onceOnly`）：
  - 状态（`status`）：未说明（`not-stated`）
  - 标志标识（`flagId`）：未提供（null）
- 来源行定位：此观察未提供 `sourceLocator`；保留网址、章节和来源节序作为定位信息

### 触发条件（`conditions`）

- 第 1 项：
  - 事实条件（`kind=fact`）；类别（`category`）：日期（`date`）；对象（`subject`）：`event`；字段（`field`）：日期条款的逻辑范围（`date-clause-scope`）；比较关系（`operator`）：未解决（`unresolved`）；确定性（`certainty`）：来源有歧义（`source-ambiguous`）
    - 取值（`value`）：
      - 尚未裁决的可能分组（`possibleGroupings`）：
        - 第 1 项：
          - 全部成立（`all`）（节点种类（`kind`））
            - 逻辑：本组各子项均成立；仅表示来源的分组，不引入调度规则
            - 子项（`items`）：
              - 第 1 项：
                - 事实条件（`kind=fact`）；类别（`category`）：日期（`date`）；对象（`subject`）：剧本（`scenario`）；字段（`field`）：剧本开始年月（`start-month`）；比较关系（`operator`）：指定月份之前，边界未说明（`before-month`）；确定性（`certainty`）：月份边界未说明（`month-boundary-unspecified`）
                  - 取值（`value`）：列表（按来源次序）：221、12
              - 第 2 项：
                - 任一成立（`any`）（节点种类（`kind`））
                  - 逻辑：本组至少一个子项成立；仅表示来源的分组，不引入调度规则
                  - 子项（`items`）：
                    - 第 1 项：
                      - 事实条件（`kind=fact`）；类别（`category`）：日期（`date`）；对象（`subject`）：剧本（`scenario`）；字段（`field`）：剧本经过日数（`elapsed-days`）；比较关系（`operator`）：大于或等于（`gte`）；确定性（`certainty`）：来源明示（`stated`）
                        - 取值（`value`）：180
                    - 第 2 项：
                      - 事实条件（`kind=fact`）；类别（`category`）：前置事件（`prerequisite`）；对象（`subject`）：`wei-emperor-accession`；字段（`field`）：事件发生后经过时间（`time-since-occurrence`）；比较关系（`operator`）：大于或等于（`gte`）；确定性（`certainty`）：来源明示（`stated`）
                        - 取值（`value`）：
                          - 取值（`value`）：180
                          - 单位（`unit`）：日（`days`）
        - 第 2 项：
          - 任一成立（`any`）（节点种类（`kind`））
            - 逻辑：本组至少一个子项成立；仅表示来源的分组，不引入调度规则
            - 子项（`items`）：
              - 第 1 项：
                - 全部成立（`all`）（节点种类（`kind`））
                  - 逻辑：本组各子项均成立；仅表示来源的分组，不引入调度规则
                  - 子项（`items`）：
                    - 第 1 项：
                      - 事实条件（`kind=fact`）；类别（`category`）：日期（`date`）；对象（`subject`）：剧本（`scenario`）；字段（`field`）：剧本开始年月（`start-month`）；比较关系（`operator`）：指定月份之前，边界未说明（`before-month`）；确定性（`certainty`）：月份边界未说明（`month-boundary-unspecified`）
                        - 取值（`value`）：列表（按来源次序）：221、12
                    - 第 2 项：
                      - 事实条件（`kind=fact`）；类别（`category`）：日期（`date`）；对象（`subject`）：剧本（`scenario`）；字段（`field`）：剧本经过日数（`elapsed-days`）；比较关系（`operator`）：大于或等于（`gte`）；确定性（`certainty`）：来源明示（`stated`）
                        - 取值（`value`）：180
              - 第 2 项：
                - 事实条件（`kind=fact`）；类别（`category`）：前置事件（`prerequisite`）；对象（`subject`）：`wei-emperor-accession`；字段（`field`）：事件发生后经过时间（`time-since-occurrence`）；比较关系（`operator`）：大于或等于（`gte`）；确定性（`certainty`）：来源明示（`stated`）
                  - 取值（`value`）：
                    - 取值（`value`）：180
                    - 单位（`unit`）：日（`days`）
- 第 2 项：
  - 事实条件（`kind=fact`）；类别（`category`）：皇帝（`emperor`）；对象（`subject`）：`han-emperor`；字段（`field`）：已死亡（`dead`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：是（true）
- 第 3 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`world`；字段（`field`）：势力数（`force-count`）；比较关系（`operator`）：大于或等于（`gte`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：3
- 第 4 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`cao-family`；字段（`field`）：存在（`exists`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：是（true）
- 第 5 项：
  - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：`cao-family-ruler`；字段（`field`）：与指定人物有血缘关系（`blood-related-to`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：`曹操`
- 第 6 项：
  - 事实条件（`kind=fact`）；类别（`category`）：爵位（`title`）；对象（`subject`）：`cao-family-ruler`；字段（`field`）：爵位（`title`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：皇帝（`emperor`）
- 第 7 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`cao-family`；字段（`field`）：城市数（`city-count`）；比较关系（`operator`）：大于或等于（`gte`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：8
- 第 8 项：
  - 事实条件（`kind=fact`）；类别（`category`）：城市（`city`）；对象（`subject`）：`cao-family`；字段（`field`）：持有城市（`cities`）；比较关系（`operator`）：包含全部（`contains-all`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：`洛阳`、`邺`
- 第 9 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`sun-family`；字段（`field`）：存在（`exists`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：是（true）
- 第 10 项：
  - 任一成立（`any`）（节点种类（`kind`））
    - 逻辑：本组至少一个子项成立；仅表示来源的分组，不引入调度规则
    - 子项（`items`）：
      - 第 1 项：
        - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`sun-family`；字段（`field`）：君主（`ruler`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
          - 取值（`value`）：`孙坚`
      - 第 2 项：
        - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：`sun-family-ruler`；字段（`field`）：与指定人物有血缘关系（`blood-related-to`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
          - 取值（`value`）：`孙坚`
- 第 11 项：
  - 事实条件（`kind=fact`）；类别（`category`）：爵位（`title`）；对象（`subject`）：`sun-family`；字段（`field`）：爵位（`title`）；比较关系（`operator`）：不属于（`not-in`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：`king`、`emperor`
- 第 12 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`sun-family`；字段（`field`）：城市数（`city-count`）；比较关系（`operator`）：大于或等于（`gte`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：8
- 第 13 项：
  - 事实条件（`kind=fact`）；类别（`category`）：城市（`city`）；对象（`subject`）：`sun-family`；字段（`field`）：持有城市（`cities`）；比较关系（`operator`）：包含全部（`contains-all`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：`庐江`、`柴桑`、`建业`、`吴`、`会稽`
- 第 14 项：
  - 事实条件（`kind=fact`）；类别（`category`）：外交（`diplomacy`）；对象（`subject`）：列表（按来源次序）：`sun-family`、`cao-family`；字段（`field`）：友好度（`friendship`）；比较关系（`operator`）：大于或等于（`gte`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：`unfriendly`
- 第 15 项：
  - 事实条件（`kind=fact`）；类别（`category`）：任务或行动（`mission`）；对象（`subject`）：列表（按来源次序）：`sun-family-ruler`；字段（`field`）：正在执行任务（`on-mission`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：否（false）

### 前置事件关系（`prerequisites`）

- 第 1 项：
  - 事件标识（`eventId`）：`wei-emperor-accession`
  - 前置要求（`requirement`）：替代前置（`alternative`）
  - 间隔（`delay`）：
    - 比较关系（`operator`）：大于或等于（`gte`）
    - 取值（`value`）：180
    - 单位（`unit`）：日（`days`）

### 结果与分支（仅来源描述顺序）（`orderedResults`）

- 第 1 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：设为（`set`）；作用对象（`target`）：`sun-family`
    - 参数（`values`）：
      - 爵位（`title`）：`king`
- 第 2 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：增加（`add`）；作用对象（`target`）：`sun-family.controlled-cities`
    - 参数（`values`）：
      - 治安（`publicOrder`）：10
      - 士气（`morale`）：10
- 第 3 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：增加（`add`）；作用对象（`target`）：`sun-family.officers`
    - 参数（`values`）：
      - 忠诚（`loyalty`）：10
- 第 4 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：提高友好度（`increase-friendship`）；作用对象（`target`）：列表（按来源次序）：`sun-family`、`cao-family`
    - 参数（`values`）：
      - 变化幅度（`magnitude`）：未指定（`unspecified`）
- 第 5 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：降低友好度（`decrease-friendship`）；作用对象（`target`）：`sun-family`
    - 参数（`values`）：
      - 作用对象筛选（`targetSelector`）：not allied
      - 变化幅度（`magnitude`）：未指定（`unspecified`）
      - 方向（`direction`）：未指定（`unspecified`）
- 第 6 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：降低友好度（`decrease-friendship`）；作用对象（`target`）：`sun-family`
    - 参数（`values`）：
      - 作用对象筛选（`targetSelector`）：friendship below goodwill
      - 变化幅度（`magnitude`）：未指定（`unspecified`）
      - 方向（`direction`）：未指定（`unspecified`）
- 第 7 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：降低友好度（`decrease-friendship`）；作用对象（`target`）：`sun-family`
    - 参数（`values`）：
      - 作用对象筛选（`targetSelector`）：emperor-ranked rulers
      - 变化幅度（`magnitude`）：未指定（`unspecified`）
      - 方向（`direction`）：`mutual`
- 第 8 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：降低友好度（`decrease-friendship`）；作用对象（`target`）：`sun-family`
    - 参数（`values`）：
      - 作用对象筛选（`targetSelector`）：`刘备`
      - 变化幅度（`magnitude`）：未指定（`unspecified`）
      - 方向（`direction`）：`mutual`
- 第 9 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：降低友好度（`decrease-friendship`）；作用对象（`target`）：`sun-family`
    - 参数（`values`）：
      - 作用对象筛选（`targetSelector`）：rulers with close compatibility to LiuBei
      - 变化幅度（`magnitude`）：未指定（`unspecified`）
      - 方向（`direction`）：`mutual`

### 不确定性与来源限定（`uncertainties`）

- 第 1 项：Source uses OR for scenario age and event age; scope around the scenario-start cutoff is not explicit.
- 第 2 项：Diplomacy filters remain separate source lines.

<a id="gamersky.lu-xun-arrives"></a>

## 观察 40：陆逊登场

- 事件标识（`eventId`）：`lu-xun-arrives`
- 观察标识（`observationId`）：`gamersky.lu-xun-arrives`
- 原文标题（`title`）：`陆逊登场`
- 来源标识（`sourceId`）：`gamersky-11`
- 来源网址（`sourceURL`）：[https://www.gamersky.com/handbook/200809/124174_11.shtml](https://www.gamersky.com/handbook/200809/124174_11.shtml)
- 来源章节（`sourceSection`）：`陆逊登场`
- 来源节序（`sourceOrdinal`）：3
- 版本范围（`version`）：
  - 游戏（`game`）：`SAN11`
  - 版本类型（`edition`）：未指定（`unspecified`）
  - 平台（`platform`）：未指定（`unspecified`）
  - 补丁（`patch`）：未指定（`unspecified`）
- 证据性质（`evidence`）：公开攻略转录（`public-guide-transcription`）
- 仅发生一次信息（`onceOnly`）：
  - 状态（`status`）：未说明（`not-stated`）
  - 标志标识（`flagId`）：未提供（null）
- 来源行定位：此观察未提供 `sourceLocator`；保留网址、章节和来源节序作为定位信息

### 触发条件（`conditions`）

- 第 1 项：
  - 事实条件（`kind=fact`）；类别（`category`）：日期（`date`）；对象（`subject`）：剧本（`scenario`）；字段（`field`）：剧本经过日数（`elapsed-days`）；比较关系（`operator`）：大于或等于（`gte`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：30
- 第 2 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`player`；字段（`field`）：君主（`ruler`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：`孙权`
- 第 3 项：
  - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：列表（按来源次序）：`周瑜`、`鲁肃`、`吕蒙`；字段（`field`）：已死亡（`dead`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：是（true）
- 第 4 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`孙权`；字段（`field`）：武将列表（`officers`）；比较关系（`operator`）：包含全部（`contains-all`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：`陆逊`
- 第 5 项：
  - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：`陆逊`；字段（`field`）：忠诚（`loyalty`）；比较关系（`operator`）：大于（`gt`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：95
- 第 6 项：
  - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：`陆逊`；字段（`field`）：功绩（`merit`）；比较关系（`operator`）：介于两值，端点按来源限定（`between`）；确定性（`certainty`）：区间端点未说明（`endpoints-unspecified`）
    - 取值（`value`）：列表（按来源次序）：3000、15000
- 第 7 项：
  - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：`陆逊`；字段（`field`）：身份角色（`role`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：`ordinary`
- 第 8 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`孙权`；字段（`field`）：武将数（`officer-count`）；比较关系（`operator`）：大于或等于（`gte`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：10
- 第 9 项：
  - 事实条件（`kind=fact`）；类别（`category`）：城市（`city`）；对象（`subject`）：列表（按来源次序）：`孙权`、`吕蒙`、`蒋钦`；字段（`field`）：当前所在城市（`current-city`）；比较关系（`operator`）：全部相同（`all-equal`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：是（true）
- 第 10 项：
  - 事实条件（`kind=fact`）；类别（`category`）：任务或行动（`mission`）；对象（`subject`）：列表（按来源次序）：`孙权`、`陆逊`；字段（`field`）：正在执行任务（`on-mission`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：否（false）
- 第 11 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`other-force`；字段（`field`）：存在且满足所列条件（`exists-with`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：
      - 相邻对象（`adjacentTo`）：`孙权`
      - 友好度上界（`friendshipAtMost`）：`unfriendly`
      - 同盟（`allied`）：否（false）
      - 城市数下界（`cityCountAtLeast`）：5

### 前置事件关系（`prerequisites`）

- 空列表（0 项）

### 结果与分支（仅来源描述顺序）（`orderedResults`）

- 第 1 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：移动（`move`）；作用对象（`target`）：`陆逊`
    - 参数（`values`）：
      - 目的地（`destination`）：`孙权.current-city`
- 第 2 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：设为（`set`）；作用对象（`target`）：`陆逊`
    - 参数（`values`）：
      - 忠诚（`loyalty`）：100
- 第 3 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：增加（`add`）；作用对象（`target`）：`陆逊`
    - 参数（`values`）：
      - 功绩（`merit`）：12000
- 第 4 项：
  - 分支（`branch`）（节点种类（`kind`））
    - 分支标识（`branchId`）：`kan-ze-present`
    - 分支条件（`condition`）：
      - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`孙权`；字段（`field`）：武将列表（`officers`）；比较关系（`operator`）：包含全部（`contains-all`）；确定性（`certainty`）：来源明示（`stated`）
        - 取值（`value`）：列表（按来源次序）：`阚泽`
    - 按来源描述排列的结果（`orderedResults`）：
      - 第 1 项：
        - 结果效果（`kind=effect`）；操作（`operation`）：增加（`add`）；作用对象（`target`）：`阚泽`
          - 参数（`values`）：
            - 功绩（`merit`）：300

### 不确定性与来源限定（`uncertainties`）

- 第 1 项：The same-city condition names dead Lü Meng and Jiang Qin. Retained as a source inconsistency, not corrected.

<a id="gamersky.zhuge-liang-northern-campaign"></a>

## 观察 41：诸葛亮北伐

- 事件标识（`eventId`）：`zhuge-liang-northern-campaign`
- 观察标识（`observationId`）：`gamersky.zhuge-liang-northern-campaign`
- 原文标题（`title`）：`诸葛亮北伐`
- 来源标识（`sourceId`）：`gamersky-12`
- 来源网址（`sourceURL`）：[https://www.gamersky.com/handbook/200809/124174_12.shtml](https://www.gamersky.com/handbook/200809/124174_12.shtml)
- 来源章节（`sourceSection`）：`诸葛亮北伐`
- 来源节序（`sourceOrdinal`）：1
- 版本范围（`version`）：
  - 游戏（`game`）：`SAN11`
  - 版本类型（`edition`）：未指定（`unspecified`）
  - 平台（`platform`）：未指定（`unspecified`）
  - 补丁（`patch`）：未指定（`unspecified`）
- 证据性质（`evidence`）：公开攻略转录（`public-guide-transcription`）
- 仅发生一次信息（`onceOnly`）：
  - 状态（`status`）：未说明（`not-stated`）
  - 标志标识（`flagId`）：未提供（null）
- 来源行定位：此观察未提供 `sourceLocator`；保留网址、章节和来源节序作为定位信息

### 触发条件（`conditions`）

- 第 1 项：
  - 事实条件（`kind=fact`）；类别（`category`）：日期（`date`）；对象（`subject`）：剧本（`scenario`）；字段（`field`）：剧本经过日数（`elapsed-days`）；比较关系（`operator`）：大于或等于（`gte`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：30
- 第 2 项：
  - 事实条件（`kind=fact`）；类别（`category`）：皇帝（`emperor`）；对象（`subject`）：`han-emperor`；字段（`field`）：已死亡（`dead`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：是（true）
- 第 3 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`liu-family`；字段（`field`）：存在（`exists`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：是（true）
- 第 4 项：
  - 任一成立（`any`）（节点种类（`kind`））
    - 逻辑：本组至少一个子项成立；仅表示来源的分组，不引入调度规则
    - 子项（`items`）：
      - 第 1 项：
        - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`liu-family`；字段（`field`）：君主（`ruler`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
          - 取值（`value`）：`刘备`
      - 第 2 项：
        - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：`liu-family-ruler`；字段（`field`）：与刘备的相性（`compatibility-to-liu-bei`）；比较关系（`operator`）：相近，阈值按来源限定（`close`）；确定性（`certainty`）：阈值未说明（`threshold-unspecified`）
          - 取值（`value`）：是（true）
- 第 5 项：
  - 事实条件（`kind=fact`）；类别（`category`）：爵位（`title`）；对象（`subject`）：`liu-family`；字段（`field`）：爵位（`title`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：皇帝（`emperor`）
- 第 6 项：
  - 事实条件（`kind=fact`）；类别（`category`）：城市（`city`）；对象（`subject`）：`liu-family`；字段（`field`）：持有城市（`cities`）；比较关系（`operator`）：包含全部（`contains-all`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：`永安`、`汉中`、`梓潼`、`江洲`、`成都`、`建宁`、`云南`
- 第 7 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`liu-family`；字段（`field`）：武将列表（`officers`）；比较关系（`operator`）：包含全部（`contains-all`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：`诸葛亮`
- 第 8 项：
  - 事实条件（`kind=fact`）；类别（`category`）：城市（`city`）；对象（`subject`）：列表（按来源次序）：`成都`、`汉中`；字段（`field`）：治安（`public-order`）；比较关系（`operator`）：来源在条件中写成加值（`source-addition-in-condition`）；确定性（`certainty`）：来源有歧义（`source-ambiguous`）
    - 取值（`value`）：15
- 第 9 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`northern-force`；字段（`field`）：存在且满足所列条件（`exists-with`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：
      - 城市列表（`cities`）：列表（按来源次序）：`洛阳`、`许昌`、`邺`
      - 城市数严格下界（`cityCountGreaterThan`）：`liu-family`
      - 爵位（`title`）：皇帝（`emperor`）
- 第 10 项：
  - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：列表（按来源次序）：`liu-family-ruler`、`northern-force-ruler`；字段（`field`）：相性（`compatibility`）；比较关系（`operator`）：不相近，阈值按来源限定（`not-close`）；确定性（`certainty`）：阈值未说明（`threshold-unspecified`）
    - 取值（`value`）：是（true）
- 第 11 项：
  - 事实条件（`kind=fact`）；类别（`category`）：外交（`diplomacy`）；对象（`subject`）：列表（按来源次序）：`liu-family`、`northern-force`；字段（`field`）：同盟（`alliance`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：否（false）
- 第 12 项：
  - 事实条件（`kind=fact`）；类别（`category`）：外交（`diplomacy`）；对象（`subject`）：列表（按来源次序）：`liu-family`、`northern-force`；字段（`field`）：友好度（`friendship`）；比较关系（`operator`）：小于（`lt`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：`goodwill`
- 第 13 项：
  - 事实条件（`kind=fact`）；类别（`category`）：日期（`date`）；对象（`subject`）：`诸葛亮`；字段（`field`）：已到预定死亡时间（`scheduled-death-reached`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：否（false）
- 第 14 项：
  - 事实条件（`kind=fact`）；类别（`category`）：任务或行动（`mission`）；对象（`subject`）：列表（按来源次序）：`liu-family-ruler`、`诸葛亮`；字段（`field`）：正在执行任务（`on-mission`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：否（false）

### 前置事件关系（`prerequisites`）

- 空列表（0 项）

### 结果与分支（仅来源描述顺序）（`orderedResults`）

- 第 1 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：设置友好度（`set-friendship`）；作用对象（`target`）：列表（按来源次序）：`liu-family`、`northern-force`
    - 参数（`values`）：
      - 取值（`value`）：`hostile`
- 第 2 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：增加（`add`）；作用对象（`target`）：`liu-family.officers`
    - 参数（`values`）：
      - 忠诚（`loyalty`）：10

### 不确定性与来源限定（`uncertainties`）

- 第 1 项：The condition literally gives public order +15. No >=95 condition is imported from the Japanese guide.

<a id="gamersky.wu-emperor-accession"></a>

## 观察 42：吴王即位

- 事件标识（`eventId`）：`wu-emperor-accession`
- 观察标识（`observationId`）：`gamersky.wu-emperor-accession`
- 原文标题（`title`）：`吴王即位`
- 来源标识（`sourceId`）：`gamersky-12`
- 来源网址（`sourceURL`）：[https://www.gamersky.com/handbook/200809/124174_12.shtml](https://www.gamersky.com/handbook/200809/124174_12.shtml)
- 来源章节（`sourceSection`）：`吴王即位`
- 来源节序（`sourceOrdinal`）：2
- 版本范围（`version`）：
  - 游戏（`game`）：`SAN11`
  - 版本类型（`edition`）：未指定（`unspecified`）
  - 平台（`platform`）：未指定（`unspecified`）
  - 补丁（`patch`）：未指定（`unspecified`）
- 证据性质（`evidence`）：公开攻略转录（`public-guide-transcription`）
- 仅发生一次信息（`onceOnly`）：
  - 状态（`status`）：未说明（`not-stated`）
  - 标志标识（`flagId`）：未提供（null）
- 来源行定位：此观察未提供 `sourceLocator`；保留网址、章节和来源节序作为定位信息

### 触发条件（`conditions`）

- 第 1 项：
  - 事实条件（`kind=fact`）；类别（`category`）：日期（`date`）；对象（`subject`）：`event`；字段（`field`）：日期条款的逻辑范围（`date-clause-scope`）；比较关系（`operator`）：未解决（`unresolved`）；确定性（`certainty`）：来源有歧义（`source-ambiguous`）
    - 取值（`value`）：
      - 尚未裁决的可能分组（`possibleGroupings`）：
        - 第 1 项：
          - 全部成立（`all`）（节点种类（`kind`））
            - 逻辑：本组各子项均成立；仅表示来源的分组，不引入调度规则
            - 子项（`items`）：
              - 第 1 项：
                - 事实条件（`kind=fact`）；类别（`category`）：日期（`date`）；对象（`subject`）：剧本（`scenario`）；字段（`field`）：剧本开始年月（`start-month`）；比较关系（`operator`）：指定月份之前，边界未说明（`before-month`）；确定性（`certainty`）：月份边界未说明（`month-boundary-unspecified`）
                  - 取值（`value`）：列表（按来源次序）：228、12
              - 第 2 项：
                - 任一成立（`any`）（节点种类（`kind`））
                  - 逻辑：本组至少一个子项成立；仅表示来源的分组，不引入调度规则
                  - 子项（`items`）：
                    - 第 1 项：
                      - 事实条件（`kind=fact`）；类别（`category`）：日期（`date`）；对象（`subject`）：剧本（`scenario`）；字段（`field`）：剧本经过日数（`elapsed-days`）；比较关系（`operator`）：大于或等于（`gte`）；确定性（`certainty`）：来源明示（`stated`）
                        - 取值（`value`）：180
                    - 第 2 项：
                      - 事实条件（`kind=fact`）；类别（`category`）：前置事件（`prerequisite`）；对象（`subject`）：`wei-emperor-accession`；字段（`field`）：事件发生后经过时间（`time-since-occurrence`）；比较关系（`operator`）：大于或等于（`gte`）；确定性（`certainty`）：来源明示（`stated`）
                        - 取值（`value`）：
                          - 取值（`value`）：360
                          - 单位（`unit`）：日（`days`）
        - 第 2 项：
          - 任一成立（`any`）（节点种类（`kind`））
            - 逻辑：本组至少一个子项成立；仅表示来源的分组，不引入调度规则
            - 子项（`items`）：
              - 第 1 项：
                - 全部成立（`all`）（节点种类（`kind`））
                  - 逻辑：本组各子项均成立；仅表示来源的分组，不引入调度规则
                  - 子项（`items`）：
                    - 第 1 项：
                      - 事实条件（`kind=fact`）；类别（`category`）：日期（`date`）；对象（`subject`）：剧本（`scenario`）；字段（`field`）：剧本开始年月（`start-month`）；比较关系（`operator`）：指定月份之前，边界未说明（`before-month`）；确定性（`certainty`）：月份边界未说明（`month-boundary-unspecified`）
                        - 取值（`value`）：列表（按来源次序）：228、12
                    - 第 2 项：
                      - 事实条件（`kind=fact`）；类别（`category`）：日期（`date`）；对象（`subject`）：剧本（`scenario`）；字段（`field`）：剧本经过日数（`elapsed-days`）；比较关系（`operator`）：大于或等于（`gte`）；确定性（`certainty`）：来源明示（`stated`）
                        - 取值（`value`）：180
              - 第 2 项：
                - 事实条件（`kind=fact`）；类别（`category`）：前置事件（`prerequisite`）；对象（`subject`）：`wei-emperor-accession`；字段（`field`）：事件发生后经过时间（`time-since-occurrence`）；比较关系（`operator`）：大于或等于（`gte`）；确定性（`certainty`）：来源明示（`stated`）
                  - 取值（`value`）：
                    - 取值（`value`）：360
                    - 单位（`unit`）：日（`days`）
- 第 2 项：
  - 事实条件（`kind=fact`）；类别（`category`）：皇帝（`emperor`）；对象（`subject`）：`han-emperor`；字段（`field`）：已死亡（`dead`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：是（true）
- 第 3 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`world`；字段（`field`）：皇帝爵位势力数（`emperor-ranked-force-count`）；比较关系（`operator`）：大于或等于（`gte`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：2
- 第 4 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`sun-family`；字段（`field`）：存在（`exists`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：是（true）
- 第 5 项：
  - 任一成立（`any`）（节点种类（`kind`））
    - 逻辑：本组至少一个子项成立；仅表示来源的分组，不引入调度规则
    - 子项（`items`）：
      - 第 1 项：
        - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`sun-family`；字段（`field`）：君主（`ruler`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
          - 取值（`value`）：`孙坚`
      - 第 2 项：
        - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：`sun-family-ruler`；字段（`field`）：与指定人物有血缘关系（`blood-related-to`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
          - 取值（`value`）：`孙坚`
- 第 6 项：
  - 事实条件（`kind=fact`）；类别（`category`）：爵位（`title`）；对象（`subject`）：`sun-family`；字段（`field`）：爵位（`title`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：`king`
- 第 7 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`sun-family`；字段（`field`）：城市数（`city-count`）；比较关系（`operator`）：大于或等于（`gte`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：8
- 第 8 项：
  - 事实条件（`kind=fact`）；类别（`category`）：城市（`city`）；对象（`subject`）：`sun-family`；字段（`field`）：持有城市（`cities`）；比较关系（`operator`）：包含全部（`contains-all`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：`庐江`、`柴桑`、`建业`、`吴`、`会稽`
- 第 9 项：
  - 事实条件（`kind=fact`）；类别（`category`）：任务或行动（`mission`）；对象（`subject`）：列表（按来源次序）：`sun-family-ruler`；字段（`field`）：正在执行任务（`on-mission`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：否（false）

### 前置事件关系（`prerequisites`）

- 第 1 项：
  - 事件标识（`eventId`）：`wei-emperor-accession`
  - 前置要求（`requirement`）：替代前置（`alternative`）
  - 间隔（`delay`）：
    - 比较关系（`operator`）：大于或等于（`gte`）
    - 取值（`value`）：360
    - 单位（`unit`）：日（`days`）

### 结果与分支（仅来源描述顺序）（`orderedResults`）

- 第 1 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：设为（`set`）；作用对象（`target`）：`sun-family`
    - 参数（`values`）：
      - 爵位（`title`）：皇帝（`emperor`）
- 第 2 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：设为（`set`）；作用对象（`target`）：`sun-family`
    - 参数（`values`）：
      - 国号（`stateName`）：`吴`
- 第 3 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：增加（`add`）；作用对象（`target`）：`sun-family.controlled-cities`
    - 参数（`values`）：
      - 治安（`publicOrder`）：20
      - 士气（`morale`）：20
- 第 4 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：增加（`add`）；作用对象（`target`）：`sun-family.officers`
    - 参数（`values`）：
      - 忠诚（`loyalty`）：20
- 第 5 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：降低友好度（`decrease-friendship`）；作用对象（`target`）：`sun-family`
    - 参数（`values`）：
      - 作用对象筛选（`targetSelector`）：not allied
      - 变化幅度（`magnitude`）：未指定（`unspecified`）
      - 方向（`direction`）：未指定（`unspecified`）
- 第 6 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：降低友好度（`decrease-friendship`）；作用对象（`target`）：`sun-family`
    - 参数（`values`）：
      - 作用对象筛选（`targetSelector`）：friendship below goodwill
      - 变化幅度（`magnitude`）：未指定（`unspecified`）
      - 方向（`direction`）：未指定（`unspecified`）
- 第 7 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：降低友好度（`decrease-friendship`）；作用对象（`target`）：`sun-family`
    - 参数（`values`）：
      - 作用对象筛选（`targetSelector`）：emperor-ranked rulers
      - 变化幅度（`magnitude`）：未指定（`unspecified`）
      - 方向（`direction`）：`mutual`

### 不确定性与来源限定（`uncertainties`）

- 第 1 项：The heading repeats Wu king, but results grant emperor and state name Wu; original title is retained while corpus identity follows the described result.
- 第 2 项：The prerequisite names Wei accession; do not replace it with Wu king.
- 第 3 项：OR scope around the scenario-start cutoff is unspecified.
- 第 4 项：Diplomacy filters remain separate source lines.

<a id="gamersky.liu-bei-death"></a>

## 观察 43：刘备之死

- 事件标识（`eventId`）：`liu-bei-death`
- 观察标识（`observationId`）：`gamersky.liu-bei-death`
- 原文标题（`title`）：`刘备之死`
- 来源标识（`sourceId`）：`gamersky-12`
- 来源网址（`sourceURL`）：[https://www.gamersky.com/handbook/200809/124174_12.shtml](https://www.gamersky.com/handbook/200809/124174_12.shtml)
- 来源章节（`sourceSection`）：`刘备之死`
- 来源节序（`sourceOrdinal`）：3
- 版本范围（`version`）：
  - 游戏（`game`）：`SAN11`
  - 版本类型（`edition`）：未指定（`unspecified`）
  - 平台（`platform`）：未指定（`unspecified`）
  - 补丁（`patch`）：未指定（`unspecified`）
- 证据性质（`evidence`）：公开攻略转录（`public-guide-transcription`）
- 仅发生一次信息（`onceOnly`）：
  - 状态（`status`）：未说明（`not-stated`）
  - 标志标识（`flagId`）：未提供（null）
- 来源行定位：此观察未提供 `sourceLocator`；保留网址、章节和来源节序作为定位信息

### 触发条件（`conditions`）

- 第 1 项：
  - 事实条件（`kind=fact`）；类别（`category`）：日期（`date`）；对象（`subject`）：`刘备`；字段（`field`）：已到预定死亡年（`scheduled-death-year-reached`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：是（true）
- 第 2 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`player`；字段（`field`）：君主（`ruler`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：`刘备`
- 第 3 项：
  - 事实条件（`kind=fact`）；类别（`category`）：爵位（`title`）；对象（`subject`）：`player`；字段（`field`）：爵位（`title`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：皇帝（`emperor`）
- 第 4 项：
  - 事实条件（`kind=fact`）；类别（`category`）：城市（`city`）；对象（`subject`）：`player`；字段（`field`）：持有城市（`cities`）；比较关系（`operator`）：包含全部（`contains-all`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：`永安`、`汉中`、`梓潼`、`江洲`、`成都`
- 第 5 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`player`；字段（`field`）：武将列表（`officers`）；比较关系（`operator`）：包含全部（`contains-all`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：`诸葛亮`
- 第 6 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`player`；字段（`field`）：武将列表（`officers`）；比较关系（`operator`）：包含任一（`contains-any`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：`刘禅`、`刘封`
- 第 7 项：
  - 事实条件（`kind=fact`）；类别（`category`）：任务或行动（`mission`）；对象（`subject`）：列表（按来源次序）：`刘备`、`诸葛亮`；字段（`field`）：正在执行任务（`on-mission`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：否（false）

### 前置事件关系（`prerequisites`）

- 空列表（0 项）

### 结果与分支（仅来源描述顺序）（`orderedResults`）

- 第 1 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：死亡（`death`）；作用对象（`target`）：`刘备`
    - 参数（`values`）：空属性集（0 项）
- 第 2 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：选择继承人（`select-successor`）；作用对象（`target`）：`刘备`
    - 参数（`values`）：
      - 优先次序（`priority`）：列表（按来源次序）：`刘禅`、`刘封`
      - 资格（`eligible`）：officers of Liu Bei

### 不确定性与来源限定（`uncertainties`）

- 空列表（0 项）

<a id="gamersky.zhuge-liang-death"></a>

## 观察 44：诸葛亮之死

- 事件标识（`eventId`）：`zhuge-liang-death`
- 观察标识（`observationId`）：`gamersky.zhuge-liang-death`
- 原文标题（`title`）：`诸葛亮之死`
- 来源标识（`sourceId`）：`gamersky-12`
- 来源网址（`sourceURL`）：[https://www.gamersky.com/handbook/200809/124174_12.shtml](https://www.gamersky.com/handbook/200809/124174_12.shtml)
- 来源章节（`sourceSection`）：`诸葛亮之死`
- 来源节序（`sourceOrdinal`）：4
- 版本范围（`version`）：
  - 游戏（`game`）：`SAN11`
  - 版本类型（`edition`）：未指定（`unspecified`）
  - 平台（`platform`）：未指定（`unspecified`）
  - 补丁（`patch`）：未指定（`unspecified`）
- 证据性质（`evidence`）：公开攻略转录（`public-guide-transcription`）
- 仅发生一次信息（`onceOnly`）：
  - 状态（`status`）：未说明（`not-stated`）
  - 标志标识（`flagId`）：未提供（null）
- 来源行定位：此观察未提供 `sourceLocator`；保留网址、章节和来源节序作为定位信息

### 触发条件（`conditions`）

- 第 1 项：
  - 事实条件（`kind=fact`）；类别（`category`）：日期（`date`）；对象（`subject`）：`诸葛亮`；字段（`field`）：已到预定死亡年（`scheduled-death-year-reached`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：是（true）
- 第 2 项：
  - 事实条件（`kind=fact`）；类别（`category`）：爵位（`title`）；对象（`subject`）：`player-ruler`；字段（`field`）：爵位（`title`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：皇帝（`emperor`）
- 第 3 项：
  - 事实条件（`kind=fact`）；类别（`category`）：城市（`city`）；对象（`subject`）：`player`；字段（`field`）：持有城市（`cities`）；比较关系（`operator`）：包含全部（`contains-all`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：`永安`、`汉中`、`梓潼`、`江洲`、`成都`
- 第 4 项：
  - 事实条件（`kind=fact`）；类别（`category`）：城市（`city`）；对象（`subject`）：`player`；字段（`field`）：持有城市（`cities`）；比较关系（`operator`）：全部不包含（`contains-none`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：`洛阳`、`许昌`、`邺`
- 第 5 项：
  - 事实条件（`kind=fact`）；类别（`category`）：势力（`force`）；对象（`subject`）：`player`；字段（`field`）：武将列表（`officers`）；比较关系（`operator`）：包含全部（`contains-all`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：列表（按来源次序）：`诸葛亮`、`姜维`
- 第 6 项：
  - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：`诸葛亮`；字段（`field`）：身份角色（`role`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：`strategist`
- 第 7 项：
  - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：`诸葛亮`；字段（`field`）：身份角色（`role`）；比较关系（`operator`）：不等于（`ne`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：`ruler`
- 第 8 项：
  - 事实条件（`kind=fact`）；类别（`category`）：任务或行动（`mission`）；对象（`subject`）：列表（按来源次序）：`player-ruler`、`诸葛亮`、`姜维`；字段（`field`）：正在执行任务（`on-mission`）；比较关系（`operator`）：等于（`eq`）；确定性（`certainty`）：来源明示（`stated`）
    - 取值（`value`）：否（false）

### 前置事件关系（`prerequisites`）

- 空列表（0 项）

### 结果与分支（仅来源描述顺序）（`orderedResults`）

- 第 1 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：死亡（`death`）；作用对象（`target`）：`诸葛亮`
    - 参数（`values`）：空属性集（0 项）
- 第 2 项：
  - 分支（`branch`）（节点种类（`kind`））
    - 分支标识（`branchId`）：`jiang-wei-lower`
    - 分支条件（`condition`）：
      - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：`姜维`；字段（`field`）：功绩（`merit`）；比较关系（`operator`）：小于（`lt`）；确定性（`certainty`）：来源明示（`stated`）
        - 取值（`value`）：`诸葛亮.merit`
    - 按来源描述排列的结果（`orderedResults`）：
      - 第 1 项：
        - 结果效果（`kind=effect`）；操作（`operation`）：复制字段（`copy-field`）；作用对象（`target`）：`姜维`
          - 参数（`values`）：
            - 字段（`field`）：功绩（`merit`）
            - 来源（`source`）：`诸葛亮.merit`
- 第 3 项：
  - 分支（`branch`）（节点种类（`kind`））
    - 分支标识（`branchId`）：`jiang-wei-higher`
    - 分支条件（`condition`）：
      - 事实条件（`kind=fact`）；类别（`category`）：人物（`actor`）；对象（`subject`）：`姜维`；字段（`field`）：功绩（`merit`）；比较关系（`operator`）：大于（`gt`）；确定性（`certainty`）：来源明示（`stated`）
        - 取值（`value`）：`诸葛亮.merit`
    - 按来源描述排列的结果（`orderedResults`）：
      - 第 1 项：
        - 结果效果（`kind=effect`）；操作（`operation`）：增加（`add`）；作用对象（`target`）：`姜维`
          - 参数（`values`）：
            - 功绩（`merit`）：4000
- 第 4 项：
  - 结果效果（`kind=effect`）；操作（`operation`）：转移物品（`transfer-items`）；作用对象（`target`）：`诸葛亮`
    - 参数（`values`）：
      - 接收对象（`recipient`）：`姜维`
      - 物品（`items`）：全部（`all`）

### 不确定性与来源限定（`uncertainties`）

- 第 1 项：Equal-merit result is unstated.

## 静态覆盖清单

- 观察正文：44 条；每条均逐项展开全部条件、前置关系、结果层级和不确定性
- 节点数：`fact` 466；`effect` 177；`all` 27；`any` 11；`choice` 1；`branch` 27；`if` 3。这些是转录结构的静态数量，不是游戏触发次数
- 所有非省略字段均已在正文保留；完整递归字段集合：`accelerationEvent`、`adjacentTo`、`affectedBaselinePredicates`、`aiDefault`、`allied`、`also`、`baselineConditions`、`branchId`、`candidateCities`、`category`、`certainty`、`choiceId`、`cities`、`cityCountAtLeast`、`cityCountGreaterThan`、`condition`、`conditions`、`consequence`、`controller`、`datasetId`、`delay`、`destination`、`direction`、`duration`、`edition`、`eligibility`、`eligible`、`eligibleOwner`、`eventId`、`events`、`evidence`、`executionEnabled`、`field`、`flagId`、`force`、`friendshipAtMost`、`game`、`identity`、`intelligence`、`items`、`kind`、`leadership`、`loyalty`、`magnitude`、`merit`、`morale`、`observationId`、`officers`、`onceOnly`、`operation`、`operator`、`optionId`、`options`、`orderedResults`、`patch`、`platform`、`politics`、`portrait`、`possibleGroupings`、`prerequisites`、`priority`、`publicOrder`、`recipient`、`replacementConditions`、`requirement`、`role`、`ruler`、`selection`、`source`、`sourceId`、`sourceOrdinal`、`sourceSection`、`sourceURL`、`stateName`、`status`、`subject`、`successorChoices`、`target`、`targetSelector`、`title`、`uncertainties`、`unit`、`value`、`values`、`version`
- 省略项仅为 `schemaVersion`；没有删减游戏事实，没有裁决未解决分歧
