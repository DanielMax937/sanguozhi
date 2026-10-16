# 史实事件来源总目录、映射与分歧

本目录把 `inventory.json` 的来源说明、事件映射、全部分歧、排除范围及全局未知项展开为可读正文。它与[atwiki 61 条观察正文](historical-scenario-events-atwiki-catalog.md)及[GamerSky 44 条观察正文](historical-scenario-events-gamersky-catalog.md)一起覆盖现有历史事件转录集合。

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


## 总体范围与静态数量

- 独立观察（`observationCount`）：105 条，其中 atwiki 61 条、GamerSky 44 条
- 事件映射（`eventCount` / `eventCatalog`）：66 项；同一事件可以有多条独立观察
- 来源目录（`sources`）：13 项，即 GamerSky 12 页与 atwiki 第88页
- 分歧（`disagreements`）：41 项；按原有状态逐条保留，不以一源覆盖另一源
- 明确排除项（`exclusions`）：2 项；全局未知项（`globalUnknowns`）：4 项
- 纯元数据省略：顶层 `schemaVersion`，以及各来源的 `retrievedContentSha256`。后者是采集正文哈希，不是游戏事实；其余所有字段和游戏事实均在正文或关联的逐观察正文保留

- 证据性质（`evidence`）：公开攻略转录（`public-guide-transcription`）
- 执行开关（`executionEnabled`）：否（false）
- 观察数量（`observationCount`）：105
- 事件数量（`eventCount`）：66
- 覆盖边界（`coverageScope`）：All historical sections actually observed in the12-page GamerSky article and Wiki88 historical body. Source coverage is not a full original-game event catalog.
- 结果排列含义（`resultOrderMeaning`）：Guide-description order only, never proof of original runtime writes or callbacks.

覆盖说明：仅覆盖实际观察到的 GamerSky 12 页文章及 Wiki88 史实正文；不是原版游戏完整事件表。结果顺序仅为攻略叙述，不证明运行时写入或回调。GamerSky 文章名称中的“官方资料”保留为原标题，不据此提升证据等级。

## 来源目录（13 项）

### 来源 01：gamersky-01

- 来源标识（`sourceId`）：`gamersky-01`
- 来源网址（`url`）：[https://www.gamersky.com/handbook/200809/124174.shtml](https://www.gamersky.com/handbook/200809/124174.shtml)
- 文章原名（`articleTitle`）：《三国志11》全剧情发生条件官方资料 - 史实类
- 观察日期（`observedDate`）：`2026-10-06`
- 采集方式（`retrievalKind`）：`fresh-public-html`
- 来源章节数（`expectedSectionCount`）：5
- 章节原名（`originalTitles`）：列表（按来源次序）：`黄巾之乱`、`桃园结义`、`少帝废立`、`反董卓连盟`、`恶来出场`
- 观察标识列表（`observationIds`）：列表（按来源次序）：`gamersky.yellow-turban-uprising`、`gamersky.peach-garden-oath`、`gamersky.depose-shao-emperor`、`gamersky.anti-dong-coalition`、`gamersky.recruit-dian-wei`
- 来源版本限制（`versionScope`）：Edition, executable build and original platform are not identified; modern PC sidebar is not runtime evidence.

### 来源 02：gamersky-02

- 来源标识（`sourceId`）：`gamersky-02`
- 来源网址（`url`）：[https://www.gamersky.com/handbook/200809/124174_2.shtml](https://www.gamersky.com/handbook/200809/124174_2.shtml)
- 文章原名（`articleTitle`）：《三国志11》全剧情发生条件官方资料 - 史实类
- 观察日期（`observedDate`）：`2026-10-06`
- 采集方式（`retrievalKind`）：`fresh-public-html`
- 来源章节数（`expectedSectionCount`）：5
- 章节原名（`originalTitles`）：列表（按来源次序）：`虎痴斗恶来`、`荀彧推荐郭嘉`、连还计 1 - 酒宴、连还计 2 - 凤仪亭、连还计 3 - 谋杀
- 观察标识列表（`observationIds`）：列表（按来源次序）：`gamersky.recruit-xu-chu`、`gamersky.recommend-guo-jia`、`gamersky.chain-plot-banquet`、`gamersky.chain-plot-pavilion`、`gamersky.chain-plot-assassination`
- 来源版本限制（`versionScope`）：Edition, executable build and original platform are not identified; modern PC sidebar is not runtime evidence.

### 来源 03：gamersky-03

- 来源标识（`sourceId`）：`gamersky-03`
- 来源网址（`url`）：[https://www.gamersky.com/handbook/200809/124174_3.shtml](https://www.gamersky.com/handbook/200809/124174_3.shtml)
- 文章原名（`articleTitle`）：《三国志11》全剧情发生条件官方资料 - 史实类
- 观察日期（`observedDate`）：`2026-10-06`
- 采集方式（`retrievalKind`）：`fresh-public-html`
- 来源章节数（`expectedSectionCount`）：4
- 章节原名（`originalTitles`）：列表（按来源次序）：`糜氏嫁刘备`、`孙策出阵`、`小霸王孙策`、`周瑜推举二张`
- 观察标识列表（`observationIds`）：列表（按来源次序）：`gamersky.marry-liu-bei-mi`、`gamersky.sun-ce-sortie`、`gamersky.recruit-sun-ce-five`、`gamersky.recommend-two-zhangs`
- 来源版本限制（`versionScope`）：Edition, executable build and original platform are not identified; modern PC sidebar is not runtime evidence.

### 来源 04：gamersky-04

- 来源标识（`sourceId`）：`gamersky-04`
- 来源网址（`url`）：[https://www.gamersky.com/handbook/200809/124174_4.shtml](https://www.gamersky.com/handbook/200809/124174_4.shtml)
- 文章原名（`articleTitle`）：《三国志11》全剧情发生条件官方资料 - 史实类
- 观察日期（`observedDate`）：`2026-10-06`
- 采集方式（`retrievalKind`）：`fresh-public-html`
- 来源章节数（`expectedSectionCount`）：3
- 章节原名（`originalTitles`）：列表（按来源次序）：`二乔结婚`、`伪帝僭称`、`甄氏转嫁曹丕`
- 观察标识列表（`observationIds`）：列表（按来源次序）：`gamersky.marry-two-qiaos`、`gamersky.yuan-shu-usurps`、`gamersky.marry-cao-pi-zhen`
- 来源版本限制（`versionScope`）：Edition, executable build and original platform are not identified; modern PC sidebar is not runtime evidence.

### 来源 05：gamersky-05

- 来源标识（`sourceId`）：`gamersky-05`
- 来源网址（`url`）：[https://www.gamersky.com/handbook/200809/124174_5.shtml](https://www.gamersky.com/handbook/200809/124174_5.shtml)
- 文章原名（`articleTitle`）：《三国志11》全剧情发生条件官方资料 - 史实类
- 观察日期（`observedDate`）：`2026-10-06`
- 采集方式（`retrievalKind`）：`fresh-public-html`
- 来源章节数（`expectedSectionCount`）：4
- 章节原名（`originalTitles`）：列表（按来源次序）：`二强开战`、`赵云再会`、`好汉刘备`、`郭嘉之死`
- 观察标识列表（`observationIds`）：列表（按来源次序）：`gamersky.two-powers-war`、`gamersky.zhao-yun-reunion`、`gamersky.recruit-liu-bei-five`、`gamersky.guo-jia-death`
- 来源版本限制（`versionScope`）：Edition, executable build and original platform are not identified; modern PC sidebar is not runtime evidence.

### 来源 06：gamersky-06

- 来源标识（`sourceId`）：`gamersky-06`
- 来源网址（`url`）：[https://www.gamersky.com/handbook/200809/124174_6.shtml](https://www.gamersky.com/handbook/200809/124174_6.shtml)
- 文章原名（`articleTitle`）：《三国志11》全剧情发生条件官方资料 - 史实类
- 观察日期（`observedDate`）：`2026-10-06`
- 采集方式（`retrievalKind`）：`fresh-public-html`
- 来源章节数（`expectedSectionCount`）：3
- 章节原名（`originalTitles`）：列表（按来源次序）：`孙策之死`、`诸葛亮结婚`、`甘宁逃命`
- 观察标识列表（`observationIds`）：列表（按来源次序）：`gamersky.sun-ce-death`、`gamersky.marry-zhuge-liang`、`gamersky.gan-ning-defects`
- 来源版本限制（`versionScope`）：Edition, executable build and original platform are not identified; modern PC sidebar is not runtime evidence.

### 来源 07：gamersky-07

- 来源标识（`sourceId`）：`gamersky-07`
- 来源网址（`url`）：[https://www.gamersky.com/handbook/200809/124174_7.shtml](https://www.gamersky.com/handbook/200809/124174_7.shtml)
- 文章原名（`articleTitle`）：《三国志11》全剧情发生条件官方资料 - 史实类
- 观察日期（`observedDate`）：`2026-10-06`
- 采集方式（`retrievalKind`）：`fresh-public-html`
- 来源章节数（`expectedSectionCount`）：4
- 章节原名（`originalTitles`）：列表（按来源次序）：`徐庶登场`、`曹操之南征`、三顾之礼 1 - 一顾、三顾之礼 2 - 二顾
- 观察标识列表（`observationIds`）：列表（按来源次序）：`gamersky.xu-shu-arrives`、`gamersky.cao-cao-southern-campaign`、`gamersky.three-visits-first`、`gamersky.three-visits-second`
- 来源版本限制（`versionScope`）：Edition, executable build and original platform are not identified; modern PC sidebar is not runtime evidence.

### 来源 08：gamersky-08

- 来源标识（`sourceId`）：`gamersky-08`
- 来源网址（`url`）：[https://www.gamersky.com/handbook/200809/124174_8.shtml](https://www.gamersky.com/handbook/200809/124174_8.shtml)
- 文章原名（`articleTitle`）：《三国志11》全剧情发生条件官方资料 - 史实类
- 观察日期（`observedDate`）：`2026-10-06`
- 采集方式（`retrievalKind`）：`fresh-public-html`
- 来源章节数（`expectedSectionCount`）：3
- 章节原名（`originalTitles`）：列表（按来源次序）：三顾之礼 3 - 三顾、`马氏五常`、`孙尚香结婚`
- 观察标识列表（`observationIds`）：列表（按来源次序）：`gamersky.three-visits-third`、`gamersky.recommend-ma-brothers`、`gamersky.marry-sun-shang-xiang`
- 来源版本限制（`versionScope`）：Edition, executable build and original platform are not identified; modern PC sidebar is not runtime evidence.

### 来源 09：gamersky-09

- 来源标识（`sourceId`）：`gamersky-09`
- 来源网址（`url`）：[https://www.gamersky.com/handbook/200809/124174_9.shtml](https://www.gamersky.com/handbook/200809/124174_9.shtml)
- 文章原名（`articleTitle`）：《三国志11》全剧情发生条件官方资料 - 史实类
- 观察日期（`observedDate`）：`2026-10-06`
- 采集方式（`retrievalKind`）：`fresh-public-html`
- 来源章节数（`expectedSectionCount`）：4
- 章节原名（`originalTitles`）：列表（按来源次序）：`吴下阿蒙`、`周瑜之死`、`曹操之死`、`汉中王即位`
- 观察标识列表（`observationIds`）：列表（按来源次序）：`gamersky.lu-meng-studies`、`gamersky.zhou-yu-death`、`gamersky.cao-cao-death`、`gamersky.liu-bei-hanzhong-king`
- 来源版本限制（`versionScope`）：Edition, executable build and original platform are not identified; modern PC sidebar is not runtime evidence.

### 来源 10：gamersky-10

- 来源标识（`sourceId`）：`gamersky-10`
- 来源网址（`url`）：[https://www.gamersky.com/handbook/200809/124174_10.shtml](https://www.gamersky.com/handbook/200809/124174_10.shtml)
- 文章原名（`articleTitle`）：《三国志11》全剧情发生条件官方资料 - 史实类
- 观察日期（`observedDate`）：`2026-10-06`
- 采集方式（`retrievalKind`）：`fresh-public-html`
- 来源章节数（`expectedSectionCount`）：2
- 章节原名（`originalTitles`）：列表（按来源次序）：`魏帝即位`、`蜀帝即位`
- 观察标识列表（`observationIds`）：列表（按来源次序）：`gamersky.wei-emperor-accession`、`gamersky.shu-emperor-accession`
- 来源版本限制（`versionScope`）：Edition, executable build and original platform are not identified; modern PC sidebar is not runtime evidence.

### 来源 11：gamersky-11

- 来源标识（`sourceId`）：`gamersky-11`
- 来源网址（`url`）：[https://www.gamersky.com/handbook/200809/124174_11.shtml](https://www.gamersky.com/handbook/200809/124174_11.shtml)
- 文章原名（`articleTitle`）：《三国志11》全剧情发生条件官方资料 - 史实类
- 观察日期（`observedDate`）：`2026-10-06`
- 采集方式（`retrievalKind`）：`fresh-public-html`
- 来源章节数（`expectedSectionCount`）：3
- 章节原名（`originalTitles`）：列表（按来源次序）：`虎之子`、`吴王即位`、`陆逊登场`
- 观察标识列表（`observationIds`）：列表（按来源次序）：`gamersky.sons-of-tigers-oath`、`gamersky.wu-king-accession`、`gamersky.lu-xun-arrives`
- 来源版本限制（`versionScope`）：Edition, executable build and original platform are not identified; modern PC sidebar is not runtime evidence.

### 来源 12：gamersky-12

- 来源标识（`sourceId`）：`gamersky-12`
- 来源网址（`url`）：[https://www.gamersky.com/handbook/200809/124174_12.shtml](https://www.gamersky.com/handbook/200809/124174_12.shtml)
- 文章原名（`articleTitle`）：《三国志11》全剧情发生条件官方资料 - 史实类
- 观察日期（`observedDate`）：`2026-10-06`
- 采集方式（`retrievalKind`）：`fresh-public-html`
- 来源章节数（`expectedSectionCount`）：4
- 章节原名（`originalTitles`）：列表（按来源次序）：`诸葛亮北伐`、`吴王即位`、`刘备之死`、`诸葛亮之死`
- 观察标识列表（`observationIds`）：列表（按来源次序）：`gamersky.zhuge-liang-northern-campaign`、`gamersky.wu-emperor-accession`、`gamersky.liu-bei-death`、`gamersky.zhuge-liang-death`
- 来源版本限制（`versionScope`）：Edition, executable build and original platform are not identified; modern PC sidebar is not runtime evidence.

### 来源 13：atwiki-88

- 来源标识（`sourceId`）：`atwiki-88`
- 来源网址（`url`）：[https://w.atwiki.jp/sangokushi11/pages/88.html](https://w.atwiki.jp/sangokushi11/pages/88.html)
- 文章原名（`articleTitle`）：`史実イベント`
- 观察日期（`observedDate`）：`2026-10-06`
- 采集方式（`retrievalKind`）：`fresh-web-tool-historical-body-lines-124-through-1125`
- 来源章节数（`expectedSectionCount`）：61
- 章节原名（`originalTitles`）：列表（按来源次序）：`黄巾の乱`、`桃園の誓い`、`少帝廃立`、`反董卓連合`、`遷都長安`、`反董卓連合瓦解`、`恩讐徐州攻略戦（曹嵩惨殺）`、`虎を追う者（典韋登用）`、`連環の計`、`悪来vs許褚（許褚登用）`、`郭嘉推挙`、`麋氏と劉備（劉備・麋氏結婚）`、`孫策出陣`、`小覇王・孫策（周泰、蒋欽、陳武、董襲、凌操仕官）`、`二張推挙`、`二喬婚礼`、`偽帝僭称`、`御曹司一番乗り（曹丕・甄氏結婚）`、`二強開戦-条件`、`趙雲再会（趙雲仕官）`、`好漢・劉備（龔都、周倉、裴元紹、劉辟、廖化仕官）`、`趙雲再会`、`郭嘉の死`、`于吉の呪い（孫策の死）`、`孔明の嫁とり`、`甘寧亡命`、`徐庶登場`、`曹操の南征`、`三顧の礼`、`馬氏の五常`、`孫尚香の結婚`、`呉下の阿蒙にあらず`、`周瑜の死`、`曹操の死`、`漢中王即位`、`魏帝即位`、`蜀帝即位`、`虎の子（張苞・関興義兄弟の契り）`、`呉王即位`、`陸遜登場`、`諸葛亮の北伐`、`呉帝即位`、`劉備の死`、`諸葛亮の死`、`魯粛推挙`、`諸葛瑾推挙`、`顧雍推挙`、`劉子陽推挙`、`満寵、呂虔推挙`、`徐州譲渡（徐州禅譲）`、`玉帯詔（董承の密勅）`、`遷都許昌`、`袁紹の死（袁家分裂）`、`徐庶の母（徐庶去る）`、`劉表の死（荊州分裂）`、`孫劉同盟`、`鳳雛理政（落第県令）`、`九品中正法（九品官人法）`、`魏公即位（魏公騒動）`、`魏王即位`、`関羽の驕慢（美髯公には及ばず）`
- 观察标识列表（`observationIds`）：列表（按来源次序）：`atwiki-88-01`、`atwiki-88-02`、`atwiki-88-03`、`atwiki-88-04`、`atwiki-88-05`、`atwiki-88-06`、`atwiki-88-07`、`atwiki-88-08`、`atwiki-88-09`、`atwiki-88-10`、`atwiki-88-11`、`atwiki-88-12`、`atwiki-88-13`、`atwiki-88-14`、`atwiki-88-15`、`atwiki-88-16`、`atwiki-88-17`、`atwiki-88-18`、`atwiki-88-19`、`atwiki-88-20`、`atwiki-88-21`、`atwiki-88-22`、`atwiki-88-23`、`atwiki-88-24`、`atwiki-88-25`、`atwiki-88-26`、`atwiki-88-27`、`atwiki-88-28`、`atwiki-88-29`、`atwiki-88-30`、`atwiki-88-31`、`atwiki-88-32`、`atwiki-88-33`、`atwiki-88-34`、`atwiki-88-35`、`atwiki-88-36`、`atwiki-88-37`、`atwiki-88-38`、`atwiki-88-39`、`atwiki-88-40`、`atwiki-88-41`、`atwiki-88-42`、`atwiki-88-43`、`atwiki-88-44`、`atwiki-88-45`、`atwiki-88-46`、`atwiki-88-47`、`atwiki-88-48`、`atwiki-88-49`、`atwiki-88-50`、`atwiki-88-51`、`atwiki-88-52`、`atwiki-88-53`、`atwiki-88-54`、`atwiki-88-55`、`atwiki-88-56`、`atwiki-88-57`、`atwiki-88-58`、`atwiki-88-59`、`atwiki-88-60`、`atwiki-88-61`
- 来源版本限制（`versionScope`）：Generally unspecified; explicit PK results and tentative console note remain locally qualified.

## 事件与独立观察映射（66 项）

下列一项对应一个 `eventCatalog` 记录；各观察标识旁给出源标题和正文链接。相同标题、总述/分阶段以及重复观察均不擅自合并。

### 事件 01：yellow-turban-uprising

- 事件标识（`eventId`）：`yellow-turban-uprising`
- 观察标识列表（`observationIds`），按来源目录次序：
  - 第 1 项：[gamersky.yellow-turban-uprising](historical-scenario-events-gamersky-catalog.md#gamersky.yellow-turban-uprising)：黄巾之乱
  - 第 2 项：[atwiki-88-01](historical-scenario-events-atwiki-catalog.md#atwiki-88-01)：黄巾の乱

### 事件 02：peach-garden-oath

- 事件标识（`eventId`）：`peach-garden-oath`
- 观察标识列表（`observationIds`），按来源目录次序：
  - 第 1 项：[gamersky.peach-garden-oath](historical-scenario-events-gamersky-catalog.md#gamersky.peach-garden-oath)：桃园结义
  - 第 2 项：[atwiki-88-02](historical-scenario-events-atwiki-catalog.md#atwiki-88-02)：桃園の誓い

### 事件 03：depose-shao-emperor

- 事件标识（`eventId`）：`depose-shao-emperor`
- 观察标识列表（`observationIds`），按来源目录次序：
  - 第 1 项：[gamersky.depose-shao-emperor](historical-scenario-events-gamersky-catalog.md#gamersky.depose-shao-emperor)：少帝废立
  - 第 2 项：[atwiki-88-03](historical-scenario-events-atwiki-catalog.md#atwiki-88-03)：少帝廃立

### 事件 04：anti-dong-coalition

- 事件标识（`eventId`）：`anti-dong-coalition`
- 观察标识列表（`observationIds`），按来源目录次序：
  - 第 1 项：[gamersky.anti-dong-coalition](historical-scenario-events-gamersky-catalog.md#gamersky.anti-dong-coalition)：反董卓连盟
  - 第 2 项：[atwiki-88-04](historical-scenario-events-atwiki-catalog.md#atwiki-88-04)：反董卓連合

### 事件 05：recruit-dian-wei

- 事件标识（`eventId`）：`recruit-dian-wei`
- 观察标识列表（`observationIds`），按来源目录次序：
  - 第 1 项：[gamersky.recruit-dian-wei](historical-scenario-events-gamersky-catalog.md#gamersky.recruit-dian-wei)：恶来出场
  - 第 2 项：[atwiki-88-08](historical-scenario-events-atwiki-catalog.md#atwiki-88-08)：虎を追う者（典韋登用）

### 事件 06：recruit-xu-chu

- 事件标识（`eventId`）：`recruit-xu-chu`
- 观察标识列表（`observationIds`），按来源目录次序：
  - 第 1 项：[gamersky.recruit-xu-chu](historical-scenario-events-gamersky-catalog.md#gamersky.recruit-xu-chu)：虎痴斗恶来
  - 第 2 项：[atwiki-88-10](historical-scenario-events-atwiki-catalog.md#atwiki-88-10)：悪来vs許褚（許褚登用）

### 事件 07：recommend-guo-jia

- 事件标识（`eventId`）：`recommend-guo-jia`
- 观察标识列表（`observationIds`），按来源目录次序：
  - 第 1 项：[gamersky.recommend-guo-jia](historical-scenario-events-gamersky-catalog.md#gamersky.recommend-guo-jia)：荀彧推荐郭嘉
  - 第 2 项：[atwiki-88-11](historical-scenario-events-atwiki-catalog.md#atwiki-88-11)：郭嘉推挙

### 事件 08：chain-plot-banquet

- 事件标识（`eventId`）：`chain-plot-banquet`
- 观察标识列表（`observationIds`），按来源目录次序：
  - 第 1 项：[gamersky.chain-plot-banquet](historical-scenario-events-gamersky-catalog.md#gamersky.chain-plot-banquet)：连还计 1 - 酒宴

### 事件 09：chain-plot-pavilion

- 事件标识（`eventId`）：`chain-plot-pavilion`
- 观察标识列表（`observationIds`），按来源目录次序：
  - 第 1 项：[gamersky.chain-plot-pavilion](historical-scenario-events-gamersky-catalog.md#gamersky.chain-plot-pavilion)：连还计 2 - 凤仪亭

### 事件 10：chain-plot-assassination

- 事件标识（`eventId`）：`chain-plot-assassination`
- 观察标识列表（`observationIds`），按来源目录次序：
  - 第 1 项：[gamersky.chain-plot-assassination](historical-scenario-events-gamersky-catalog.md#gamersky.chain-plot-assassination)：连还计 3 - 谋杀

### 事件 11：marry-liu-bei-mi

- 事件标识（`eventId`）：`marry-liu-bei-mi`
- 观察标识列表（`observationIds`），按来源目录次序：
  - 第 1 项：[gamersky.marry-liu-bei-mi](historical-scenario-events-gamersky-catalog.md#gamersky.marry-liu-bei-mi)：糜氏嫁刘备
  - 第 2 项：[atwiki-88-12](historical-scenario-events-atwiki-catalog.md#atwiki-88-12)：麋氏と劉備（劉備・麋氏結婚）

### 事件 12：sun-ce-sortie

- 事件标识（`eventId`）：`sun-ce-sortie`
- 观察标识列表（`observationIds`），按来源目录次序：
  - 第 1 项：[gamersky.sun-ce-sortie](historical-scenario-events-gamersky-catalog.md#gamersky.sun-ce-sortie)：孙策出阵
  - 第 2 项：[atwiki-88-13](historical-scenario-events-atwiki-catalog.md#atwiki-88-13)：孫策出陣

### 事件 13：recruit-sun-ce-five

- 事件标识（`eventId`）：`recruit-sun-ce-five`
- 观察标识列表（`observationIds`），按来源目录次序：
  - 第 1 项：[gamersky.recruit-sun-ce-five](historical-scenario-events-gamersky-catalog.md#gamersky.recruit-sun-ce-five)：小霸王孙策
  - 第 2 项：[atwiki-88-14](historical-scenario-events-atwiki-catalog.md#atwiki-88-14)：小覇王・孫策（周泰、蒋欽、陳武、董襲、凌操仕官）

### 事件 14：recommend-two-zhangs

- 事件标识（`eventId`）：`recommend-two-zhangs`
- 观察标识列表（`observationIds`），按来源目录次序：
  - 第 1 项：[gamersky.recommend-two-zhangs](historical-scenario-events-gamersky-catalog.md#gamersky.recommend-two-zhangs)：周瑜推举二张
  - 第 2 项：[atwiki-88-15](historical-scenario-events-atwiki-catalog.md#atwiki-88-15)：二張推挙

### 事件 15：marry-two-qiaos

- 事件标识（`eventId`）：`marry-two-qiaos`
- 观察标识列表（`observationIds`），按来源目录次序：
  - 第 1 项：[gamersky.marry-two-qiaos](historical-scenario-events-gamersky-catalog.md#gamersky.marry-two-qiaos)：二乔结婚
  - 第 2 项：[atwiki-88-16](historical-scenario-events-atwiki-catalog.md#atwiki-88-16)：二喬婚礼

### 事件 16：yuan-shu-usurps

- 事件标识（`eventId`）：`yuan-shu-usurps`
- 观察标识列表（`observationIds`），按来源目录次序：
  - 第 1 项：[gamersky.yuan-shu-usurps](historical-scenario-events-gamersky-catalog.md#gamersky.yuan-shu-usurps)：伪帝僭称
  - 第 2 项：[atwiki-88-17](historical-scenario-events-atwiki-catalog.md#atwiki-88-17)：偽帝僭称

### 事件 17：marry-cao-pi-zhen

- 事件标识（`eventId`）：`marry-cao-pi-zhen`
- 观察标识列表（`observationIds`），按来源目录次序：
  - 第 1 项：[gamersky.marry-cao-pi-zhen](historical-scenario-events-gamersky-catalog.md#gamersky.marry-cao-pi-zhen)：甄氏转嫁曹丕
  - 第 2 项：[atwiki-88-18](historical-scenario-events-atwiki-catalog.md#atwiki-88-18)：御曹司一番乗り（曹丕・甄氏結婚）

### 事件 18：two-powers-war

- 事件标识（`eventId`）：`two-powers-war`
- 观察标识列表（`observationIds`），按来源目录次序：
  - 第 1 项：[gamersky.two-powers-war](historical-scenario-events-gamersky-catalog.md#gamersky.two-powers-war)：二强开战
  - 第 2 项：[atwiki-88-19](historical-scenario-events-atwiki-catalog.md#atwiki-88-19)：二強開戦-条件

### 事件 19：zhao-yun-reunion

- 事件标识（`eventId`）：`zhao-yun-reunion`
- 观察标识列表（`observationIds`），按来源目录次序：
  - 第 1 项：[gamersky.zhao-yun-reunion](historical-scenario-events-gamersky-catalog.md#gamersky.zhao-yun-reunion)：赵云再会
  - 第 2 项：[atwiki-88-20](historical-scenario-events-atwiki-catalog.md#atwiki-88-20)：趙雲再会（趙雲仕官）
  - 第 3 项：[atwiki-88-22](historical-scenario-events-atwiki-catalog.md#atwiki-88-22)：趙雲再会

### 事件 20：recruit-liu-bei-five

- 事件标识（`eventId`）：`recruit-liu-bei-five`
- 观察标识列表（`observationIds`），按来源目录次序：
  - 第 1 项：[gamersky.recruit-liu-bei-five](historical-scenario-events-gamersky-catalog.md#gamersky.recruit-liu-bei-five)：好汉刘备
  - 第 2 项：[atwiki-88-21](historical-scenario-events-atwiki-catalog.md#atwiki-88-21)：好漢・劉備（龔都、周倉、裴元紹、劉辟、廖化仕官）

### 事件 21：guo-jia-death

- 事件标识（`eventId`）：`guo-jia-death`
- 观察标识列表（`observationIds`），按来源目录次序：
  - 第 1 项：[gamersky.guo-jia-death](historical-scenario-events-gamersky-catalog.md#gamersky.guo-jia-death)：郭嘉之死
  - 第 2 项：[atwiki-88-23](historical-scenario-events-atwiki-catalog.md#atwiki-88-23)：郭嘉の死

### 事件 22：sun-ce-death

- 事件标识（`eventId`）：`sun-ce-death`
- 观察标识列表（`observationIds`），按来源目录次序：
  - 第 1 项：[gamersky.sun-ce-death](historical-scenario-events-gamersky-catalog.md#gamersky.sun-ce-death)：孙策之死
  - 第 2 项：[atwiki-88-24](historical-scenario-events-atwiki-catalog.md#atwiki-88-24)：于吉の呪い（孫策の死）

### 事件 23：marry-zhuge-liang

- 事件标识（`eventId`）：`marry-zhuge-liang`
- 观察标识列表（`observationIds`），按来源目录次序：
  - 第 1 项：[gamersky.marry-zhuge-liang](historical-scenario-events-gamersky-catalog.md#gamersky.marry-zhuge-liang)：诸葛亮结婚
  - 第 2 项：[atwiki-88-25](historical-scenario-events-atwiki-catalog.md#atwiki-88-25)：孔明の嫁とり

### 事件 24：gan-ning-defects

- 事件标识（`eventId`）：`gan-ning-defects`
- 观察标识列表（`observationIds`），按来源目录次序：
  - 第 1 项：[gamersky.gan-ning-defects](historical-scenario-events-gamersky-catalog.md#gamersky.gan-ning-defects)：甘宁逃命
  - 第 2 项：[atwiki-88-26](historical-scenario-events-atwiki-catalog.md#atwiki-88-26)：甘寧亡命

### 事件 25：xu-shu-arrives

- 事件标识（`eventId`）：`xu-shu-arrives`
- 观察标识列表（`observationIds`），按来源目录次序：
  - 第 1 项：[gamersky.xu-shu-arrives](historical-scenario-events-gamersky-catalog.md#gamersky.xu-shu-arrives)：徐庶登场
  - 第 2 项：[atwiki-88-27](historical-scenario-events-atwiki-catalog.md#atwiki-88-27)：徐庶登場

### 事件 26：cao-cao-southern-campaign

- 事件标识（`eventId`）：`cao-cao-southern-campaign`
- 观察标识列表（`observationIds`），按来源目录次序：
  - 第 1 项：[gamersky.cao-cao-southern-campaign](historical-scenario-events-gamersky-catalog.md#gamersky.cao-cao-southern-campaign)：曹操之南征
  - 第 2 项：[atwiki-88-28](historical-scenario-events-atwiki-catalog.md#atwiki-88-28)：曹操の南征

### 事件 27：three-visits-first

- 事件标识（`eventId`）：`three-visits-first`
- 观察标识列表（`observationIds`），按来源目录次序：
  - 第 1 项：[gamersky.three-visits-first](historical-scenario-events-gamersky-catalog.md#gamersky.three-visits-first)：三顾之礼 1 - 一顾

### 事件 28：three-visits-second

- 事件标识（`eventId`）：`three-visits-second`
- 观察标识列表（`observationIds`），按来源目录次序：
  - 第 1 项：[gamersky.three-visits-second](historical-scenario-events-gamersky-catalog.md#gamersky.three-visits-second)：三顾之礼 2 - 二顾

### 事件 29：three-visits-third

- 事件标识（`eventId`）：`three-visits-third`
- 观察标识列表（`observationIds`），按来源目录次序：
  - 第 1 项：[gamersky.three-visits-third](historical-scenario-events-gamersky-catalog.md#gamersky.three-visits-third)：三顾之礼 3 - 三顾

### 事件 30：recommend-ma-brothers

- 事件标识（`eventId`）：`recommend-ma-brothers`
- 观察标识列表（`observationIds`），按来源目录次序：
  - 第 1 项：[gamersky.recommend-ma-brothers](historical-scenario-events-gamersky-catalog.md#gamersky.recommend-ma-brothers)：马氏五常
  - 第 2 项：[atwiki-88-30](historical-scenario-events-atwiki-catalog.md#atwiki-88-30)：馬氏の五常

### 事件 31：marry-sun-shang-xiang

- 事件标识（`eventId`）：`marry-sun-shang-xiang`
- 观察标识列表（`observationIds`），按来源目录次序：
  - 第 1 项：[gamersky.marry-sun-shang-xiang](historical-scenario-events-gamersky-catalog.md#gamersky.marry-sun-shang-xiang)：孙尚香结婚
  - 第 2 项：[atwiki-88-31](historical-scenario-events-atwiki-catalog.md#atwiki-88-31)：孫尚香の結婚

### 事件 32：lu-meng-studies

- 事件标识（`eventId`）：`lu-meng-studies`
- 观察标识列表（`observationIds`），按来源目录次序：
  - 第 1 项：[gamersky.lu-meng-studies](historical-scenario-events-gamersky-catalog.md#gamersky.lu-meng-studies)：吴下阿蒙
  - 第 2 项：[atwiki-88-32](historical-scenario-events-atwiki-catalog.md#atwiki-88-32)：呉下の阿蒙にあらず

### 事件 33：zhou-yu-death

- 事件标识（`eventId`）：`zhou-yu-death`
- 观察标识列表（`observationIds`），按来源目录次序：
  - 第 1 项：[gamersky.zhou-yu-death](historical-scenario-events-gamersky-catalog.md#gamersky.zhou-yu-death)：周瑜之死
  - 第 2 项：[atwiki-88-33](historical-scenario-events-atwiki-catalog.md#atwiki-88-33)：周瑜の死

### 事件 34：cao-cao-death

- 事件标识（`eventId`）：`cao-cao-death`
- 观察标识列表（`observationIds`），按来源目录次序：
  - 第 1 项：[gamersky.cao-cao-death](historical-scenario-events-gamersky-catalog.md#gamersky.cao-cao-death)：曹操之死
  - 第 2 项：[atwiki-88-34](historical-scenario-events-atwiki-catalog.md#atwiki-88-34)：曹操の死

### 事件 35：liu-bei-hanzhong-king

- 事件标识（`eventId`）：`liu-bei-hanzhong-king`
- 观察标识列表（`observationIds`），按来源目录次序：
  - 第 1 项：[gamersky.liu-bei-hanzhong-king](historical-scenario-events-gamersky-catalog.md#gamersky.liu-bei-hanzhong-king)：汉中王即位
  - 第 2 项：[atwiki-88-35](historical-scenario-events-atwiki-catalog.md#atwiki-88-35)：漢中王即位

### 事件 36：wei-emperor-accession

- 事件标识（`eventId`）：`wei-emperor-accession`
- 观察标识列表（`observationIds`），按来源目录次序：
  - 第 1 项：[gamersky.wei-emperor-accession](historical-scenario-events-gamersky-catalog.md#gamersky.wei-emperor-accession)：魏帝即位
  - 第 2 项：[atwiki-88-36](historical-scenario-events-atwiki-catalog.md#atwiki-88-36)：魏帝即位

### 事件 37：shu-emperor-accession

- 事件标识（`eventId`）：`shu-emperor-accession`
- 观察标识列表（`observationIds`），按来源目录次序：
  - 第 1 项：[gamersky.shu-emperor-accession](historical-scenario-events-gamersky-catalog.md#gamersky.shu-emperor-accession)：蜀帝即位
  - 第 2 项：[atwiki-88-37](historical-scenario-events-atwiki-catalog.md#atwiki-88-37)：蜀帝即位

### 事件 38：sons-of-tigers-oath

- 事件标识（`eventId`）：`sons-of-tigers-oath`
- 观察标识列表（`observationIds`），按来源目录次序：
  - 第 1 项：[gamersky.sons-of-tigers-oath](historical-scenario-events-gamersky-catalog.md#gamersky.sons-of-tigers-oath)：虎之子
  - 第 2 项：[atwiki-88-38](historical-scenario-events-atwiki-catalog.md#atwiki-88-38)：虎の子（張苞・関興義兄弟の契り）

### 事件 39：wu-king-accession

- 事件标识（`eventId`）：`wu-king-accession`
- 观察标识列表（`observationIds`），按来源目录次序：
  - 第 1 项：[gamersky.wu-king-accession](historical-scenario-events-gamersky-catalog.md#gamersky.wu-king-accession)：吴王即位
  - 第 2 项：[atwiki-88-39](historical-scenario-events-atwiki-catalog.md#atwiki-88-39)：呉王即位

### 事件 40：lu-xun-arrives

- 事件标识（`eventId`）：`lu-xun-arrives`
- 观察标识列表（`observationIds`），按来源目录次序：
  - 第 1 项：[gamersky.lu-xun-arrives](historical-scenario-events-gamersky-catalog.md#gamersky.lu-xun-arrives)：陆逊登场
  - 第 2 项：[atwiki-88-40](historical-scenario-events-atwiki-catalog.md#atwiki-88-40)：陸遜登場

### 事件 41：zhuge-liang-northern-campaign

- 事件标识（`eventId`）：`zhuge-liang-northern-campaign`
- 观察标识列表（`observationIds`），按来源目录次序：
  - 第 1 项：[gamersky.zhuge-liang-northern-campaign](historical-scenario-events-gamersky-catalog.md#gamersky.zhuge-liang-northern-campaign)：诸葛亮北伐
  - 第 2 项：[atwiki-88-41](historical-scenario-events-atwiki-catalog.md#atwiki-88-41)：諸葛亮の北伐

### 事件 42：wu-emperor-accession

- 事件标识（`eventId`）：`wu-emperor-accession`
- 观察标识列表（`observationIds`），按来源目录次序：
  - 第 1 项：[gamersky.wu-emperor-accession](historical-scenario-events-gamersky-catalog.md#gamersky.wu-emperor-accession)：吴王即位
  - 第 2 项：[atwiki-88-42](historical-scenario-events-atwiki-catalog.md#atwiki-88-42)：呉帝即位

### 事件 43：liu-bei-death

- 事件标识（`eventId`）：`liu-bei-death`
- 观察标识列表（`observationIds`），按来源目录次序：
  - 第 1 项：[gamersky.liu-bei-death](historical-scenario-events-gamersky-catalog.md#gamersky.liu-bei-death)：刘备之死
  - 第 2 项：[atwiki-88-43](historical-scenario-events-atwiki-catalog.md#atwiki-88-43)：劉備の死

### 事件 44：zhuge-liang-death

- 事件标识（`eventId`）：`zhuge-liang-death`
- 观察标识列表（`observationIds`），按来源目录次序：
  - 第 1 项：[gamersky.zhuge-liang-death](historical-scenario-events-gamersky-catalog.md#gamersky.zhuge-liang-death)：诸葛亮之死
  - 第 2 项：[atwiki-88-44](historical-scenario-events-atwiki-catalog.md#atwiki-88-44)：諸葛亮の死

### 事件 45：move-capital-chang-an

- 事件标识（`eventId`）：`move-capital-chang-an`
- 观察标识列表（`observationIds`），按来源目录次序：
  - 第 1 项：[atwiki-88-05](historical-scenario-events-atwiki-catalog.md#atwiki-88-05)：遷都長安

### 事件 46：anti-dong-coalition-collapse

- 事件标识（`eventId`）：`anti-dong-coalition-collapse`
- 观察标识列表（`observationIds`），按来源目录次序：
  - 第 1 项：[atwiki-88-06](historical-scenario-events-atwiki-catalog.md#atwiki-88-06)：反董卓連合瓦解

### 事件 47：cao-song-murder

- 事件标识（`eventId`）：`cao-song-murder`
- 观察标识列表（`observationIds`），按来源目录次序：
  - 第 1 项：[atwiki-88-07](historical-scenario-events-atwiki-catalog.md#atwiki-88-07)：恩讐徐州攻略戦（曹嵩惨殺）

### 事件 48：chain-plot-overview

- 事件标识（`eventId`）：`chain-plot-overview`
- 观察标识列表（`observationIds`），按来源目录次序：
  - 第 1 项：[atwiki-88-09](historical-scenario-events-atwiki-catalog.md#atwiki-88-09)：連環の計

### 事件 49：three-visits-overview

- 事件标识（`eventId`）：`three-visits-overview`
- 观察标识列表（`observationIds`），按来源目录次序：
  - 第 1 项：[atwiki-88-29](historical-scenario-events-atwiki-catalog.md#atwiki-88-29)：三顧の礼

### 事件 50：recommend-lu-su

- 事件标识（`eventId`）：`recommend-lu-su`
- 观察标识列表（`observationIds`），按来源目录次序：
  - 第 1 项：[atwiki-88-45](historical-scenario-events-atwiki-catalog.md#atwiki-88-45)：魯粛推挙

### 事件 51：recommend-zhuge-jin

- 事件标识（`eventId`）：`recommend-zhuge-jin`
- 观察标识列表（`observationIds`），按来源目录次序：
  - 第 1 项：[atwiki-88-46](historical-scenario-events-atwiki-catalog.md#atwiki-88-46)：諸葛瑾推挙

### 事件 52：recommend-gu-yong

- 事件标识（`eventId`）：`recommend-gu-yong`
- 观察标识列表（`observationIds`），按来源目录次序：
  - 第 1 项：[atwiki-88-47](historical-scenario-events-atwiki-catalog.md#atwiki-88-47)：顧雍推挙

### 事件 53：recommend-liu-ye

- 事件标识（`eventId`）：`recommend-liu-ye`
- 观察标识列表（`observationIds`），按来源目录次序：
  - 第 1 项：[atwiki-88-48](historical-scenario-events-atwiki-catalog.md#atwiki-88-48)：劉子陽推挙

### 事件 54：recommend-man-chong-lu-qian

- 事件标识（`eventId`）：`recommend-man-chong-lu-qian`
- 观察标识列表（`observationIds`），按来源目录次序：
  - 第 1 项：[atwiki-88-49](historical-scenario-events-atwiki-catalog.md#atwiki-88-49)：満寵、呂虔推挙

### 事件 55：tao-qian-cedes-xuzhou

- 事件标识（`eventId`）：`tao-qian-cedes-xuzhou`
- 观察标识列表（`observationIds`），按来源目录次序：
  - 第 1 项：[atwiki-88-50](historical-scenario-events-atwiki-catalog.md#atwiki-88-50)：徐州譲渡（徐州禅譲）

### 事件 56：jade-belt-decree

- 事件标识（`eventId`）：`jade-belt-decree`
- 观察标识列表（`observationIds`），按来源目录次序：
  - 第 1 项：[atwiki-88-51](historical-scenario-events-atwiki-catalog.md#atwiki-88-51)：玉帯詔（董承の密勅）

### 事件 57：move-capital-xuchang

- 事件标识（`eventId`）：`move-capital-xuchang`
- 观察标识列表（`observationIds`），按来源目录次序：
  - 第 1 项：[atwiki-88-52](historical-scenario-events-atwiki-catalog.md#atwiki-88-52)：遷都許昌

### 事件 58：yuan-shao-death-split

- 事件标识（`eventId`）：`yuan-shao-death-split`
- 观察标识列表（`observationIds`），按来源目录次序：
  - 第 1 项：[atwiki-88-53](historical-scenario-events-atwiki-catalog.md#atwiki-88-53)：袁紹の死（袁家分裂）

### 事件 59：xu-shu-leaves

- 事件标识（`eventId`）：`xu-shu-leaves`
- 观察标识列表（`observationIds`），按来源目录次序：
  - 第 1 项：[atwiki-88-54](historical-scenario-events-atwiki-catalog.md#atwiki-88-54)：徐庶の母（徐庶去る）

### 事件 60：liu-biao-death-split

- 事件标识（`eventId`）：`liu-biao-death-split`
- 观察标识列表（`observationIds`），按来源目录次序：
  - 第 1 项：[atwiki-88-55](historical-scenario-events-atwiki-catalog.md#atwiki-88-55)：劉表の死（荊州分裂）

### 事件 61：sun-liu-alliance

- 事件标识（`eventId`）：`sun-liu-alliance`
- 观察标识列表（`observationIds`），按来源目录次序：
  - 第 1 项：[atwiki-88-56](historical-scenario-events-atwiki-catalog.md#atwiki-88-56)：孫劉同盟

### 事件 62：pang-tong-county-administration

- 事件标识（`eventId`）：`pang-tong-county-administration`
- 观察标识列表（`observationIds`），按来源目录次序：
  - 第 1 项：[atwiki-88-57](historical-scenario-events-atwiki-catalog.md#atwiki-88-57)：鳳雛理政（落第県令）

### 事件 63：nine-rank-system

- 事件标识（`eventId`）：`nine-rank-system`
- 观察标识列表（`observationIds`），按来源目录次序：
  - 第 1 项：[atwiki-88-58](historical-scenario-events-atwiki-catalog.md#atwiki-88-58)：九品中正法（九品官人法）

### 事件 64：wei-duke-accession

- 事件标识（`eventId`）：`wei-duke-accession`
- 观察标识列表（`observationIds`），按来源目录次序：
  - 第 1 项：[atwiki-88-59](historical-scenario-events-atwiki-catalog.md#atwiki-88-59)：魏公即位（魏公騒動）

### 事件 65：wei-king-accession

- 事件标识（`eventId`）：`wei-king-accession`
- 观察标识列表（`observationIds`），按来源目录次序：
  - 第 1 项：[atwiki-88-60](historical-scenario-events-atwiki-catalog.md#atwiki-88-60)：魏王即位

### 事件 66：guan-yu-arrogance

- 事件标识（`eventId`）：`guan-yu-arrogance`
- 观察标识列表（`observationIds`），按来源目录次序：
  - 第 1 项：[atwiki-88-61](historical-scenario-events-atwiki-catalog.md#atwiki-88-61)：関羽の驕慢（美髯公には及ばず）

## 全部分歧与待裁决范围（41 项）

中文说明用于阅读；每项紧接着保留完整来源差异原文、涉及事件/观察/字段、状态、比对依据、类别和全部来源定位。中文概述不替代原文，更不代表已确认的统一规则。

### 分歧 01：date-month-boundaries

中文说明：中文来源的“之前/之后”未说明是否包含边界月；日文“以前/以降”包含边界。保留剧本开始日期与当前日期的区别，包括赵云事件“剧本开始于195年1月之后”。吴国日期分组与蜀帝提前日期仍分别未决。

- 分歧标识（`id`）：`date-month-boundaries`
- 涉及事件（`eventIds`）：列表（按来源次序）：`depose-shao-emperor`、`recruit-dian-wei`、`recruit-xu-chu`、`recommend-guo-jia`、`marry-liu-bei-mi`、`recruit-sun-ce-five`、`recommend-two-zhangs`、`marry-two-qiaos`、`marry-cao-pi-zhen`、`two-powers-war`、`zhao-yun-reunion`、`recruit-liu-bei-five`、`marry-zhuge-liang`、`gan-ning-defects`、`xu-shu-arrives`、`recommend-ma-brothers`、`marry-sun-shang-xiang`、`liu-bei-hanzhong-king`、`wei-emperor-accession`、`shu-emperor-accession`、`wu-king-accession`、`wu-emperor-accession`
- 观察标识列表（`observationIds`）：列表（按来源次序）：`atwiki-88-03`、`atwiki-88-08`、`atwiki-88-10`、`atwiki-88-11`、`atwiki-88-12`、`atwiki-88-14`、`atwiki-88-15`、`atwiki-88-16`、`atwiki-88-18`、`atwiki-88-19`、`atwiki-88-20`、`atwiki-88-21`、`atwiki-88-22`、`atwiki-88-25`、`atwiki-88-26`、`atwiki-88-27`、`atwiki-88-30`、`atwiki-88-31`、`atwiki-88-35`、`atwiki-88-36`、`atwiki-88-37`、`atwiki-88-39`、`atwiki-88-42`、`gamersky.depose-shao-emperor`、`gamersky.recruit-dian-wei`、`gamersky.recruit-xu-chu`、`gamersky.recommend-guo-jia`、`gamersky.marry-liu-bei-mi`、`gamersky.recruit-sun-ce-five`、`gamersky.recommend-two-zhangs`、`gamersky.marry-two-qiaos`、`gamersky.marry-cao-pi-zhen`、`gamersky.two-powers-war`、`gamersky.zhao-yun-reunion`、`gamersky.recruit-liu-bei-five`、`gamersky.marry-zhuge-liang`、`gamersky.gan-ning-defects`、`gamersky.xu-shu-arrives`、`gamersky.recommend-ma-brothers`、`gamersky.marry-sun-shang-xiang`、`gamersky.liu-bei-hanzhong-king`、`gamersky.wei-emperor-accession`、`gamersky.shu-emperor-accession`、`gamersky.wu-king-accession`、`gamersky.wu-emperor-accession`
- 涉及字段（`fields`）：列表（按来源次序）：`conditions.start-month`、`conditions.current-month`
- 来源差异说明（`description`）：Chinese uses before/after a named month without an explicit inclusion rule; Japanese uses inclusive 以前/以降. The boundary month must not be silently normalized across guides. Distinct scenario-start/current-date roles remain intact, including Zhao Yun scenario-start after195-01. Wu date-clause grouping and Shu acceleration remain separately unresolved.
- 状态（`status`）：未解决（`unresolved`）
- 比对依据（`reviewBasis`）：`fresh-source-comparison`
- 差异类别（`differenceType`）：`boundary-ambiguity`
- 关联来源（`sourceReferences`）：
  - 第 1 项：
    - 观察标识（`observationId`）：`atwiki-88-03`
    - 来源网址（`sourceURL`）：[https://w.atwiki.jp/sangokushi11/pages/88.html](https://w.atwiki.jp/sangokushi11/pages/88.html)
    - 来源章节（`sourceSection`）：`少帝廃立`
    - 来源行定位（`sourceLocator`）：
      - 起始行（`startLine`）：142
      - 结束行（`endLine`）：154
  - 第 2 项：
    - 观察标识（`observationId`）：`atwiki-88-08`
    - 来源网址（`sourceURL`）：[https://w.atwiki.jp/sangokushi11/pages/88.html](https://w.atwiki.jp/sangokushi11/pages/88.html)
    - 来源章节（`sourceSection`）：`虎を追う者（典韋登用）`
    - 来源行定位（`sourceLocator`）：
      - 起始行（`startLine`）：230
      - 结束行（`endLine`）：255
  - 第 3 项：
    - 观察标识（`observationId`）：`atwiki-88-10`
    - 来源网址（`sourceURL`）：[https://w.atwiki.jp/sangokushi11/pages/88.html](https://w.atwiki.jp/sangokushi11/pages/88.html)
    - 来源章节（`sourceSection`）：`悪来vs許褚（許褚登用）`
    - 来源行定位（`sourceLocator`）：
      - 起始行（`startLine`）：267
      - 结束行（`endLine`）：297
  - 第 4 项：
    - 观察标识（`observationId`）：`atwiki-88-11`
    - 来源网址（`sourceURL`）：[https://w.atwiki.jp/sangokushi11/pages/88.html](https://w.atwiki.jp/sangokushi11/pages/88.html)
    - 来源章节（`sourceSection`）：`郭嘉推挙`
    - 来源行定位（`sourceLocator`）：
      - 起始行（`startLine`）：298
      - 结束行（`endLine`）：322
  - 第 5 项：
    - 观察标识（`observationId`）：`atwiki-88-12`
    - 来源网址（`sourceURL`）：[https://w.atwiki.jp/sangokushi11/pages/88.html](https://w.atwiki.jp/sangokushi11/pages/88.html)
    - 来源章节（`sourceSection`）：`麋氏と劉備（劉備・麋氏結婚）`
    - 来源行定位（`sourceLocator`）：
      - 起始行（`startLine`）：323
      - 结束行（`endLine`）：344
  - 第 6 项：
    - 观察标识（`observationId`）：`atwiki-88-14`
    - 来源网址（`sourceURL`）：[https://w.atwiki.jp/sangokushi11/pages/88.html](https://w.atwiki.jp/sangokushi11/pages/88.html)
    - 来源章节（`sourceSection`）：`小覇王・孫策（周泰、蒋欽、陳武、董襲、凌操仕官）`
    - 来源行定位（`sourceLocator`）：
      - 起始行（`startLine`）：352
      - 结束行（`endLine`）：366
  - 第 7 项：
    - 观察标识（`observationId`）：`atwiki-88-15`
    - 来源网址（`sourceURL`）：[https://w.atwiki.jp/sangokushi11/pages/88.html](https://w.atwiki.jp/sangokushi11/pages/88.html)
    - 来源章节（`sourceSection`）：`二張推挙`
    - 来源行定位（`sourceLocator`）：
      - 起始行（`startLine`）：367
      - 结束行（`endLine`）：398
  - 第 8 项：
    - 观察标识（`observationId`）：`atwiki-88-16`
    - 来源网址（`sourceURL`）：[https://w.atwiki.jp/sangokushi11/pages/88.html](https://w.atwiki.jp/sangokushi11/pages/88.html)
    - 来源章节（`sourceSection`）：`二喬婚礼`
    - 来源行定位（`sourceLocator`）：
      - 起始行（`startLine`）：399
      - 结束行（`endLine`）：411
  - 第 9 项：
    - 观察标识（`observationId`）：`atwiki-88-18`
    - 来源网址（`sourceURL`）：[https://w.atwiki.jp/sangokushi11/pages/88.html](https://w.atwiki.jp/sangokushi11/pages/88.html)
    - 来源章节（`sourceSection`）：`御曹司一番乗り（曹丕・甄氏結婚）`
    - 来源行定位（`sourceLocator`）：
      - 起始行（`startLine`）：442
      - 结束行（`endLine`）：462
  - 第 10 项：
    - 观察标识（`observationId`）：`atwiki-88-19`
    - 来源网址（`sourceURL`）：[https://w.atwiki.jp/sangokushi11/pages/88.html](https://w.atwiki.jp/sangokushi11/pages/88.html)
    - 来源章节（`sourceSection`）：`二強開戦-条件`
    - 来源行定位（`sourceLocator`）：
      - 起始行（`startLine`）：463
      - 结束行（`endLine`）：480
  - 第 11 项：
    - 观察标识（`observationId`）：`atwiki-88-20`
    - 来源网址（`sourceURL`）：[https://w.atwiki.jp/sangokushi11/pages/88.html](https://w.atwiki.jp/sangokushi11/pages/88.html)
    - 来源章节（`sourceSection`）：`趙雲再会（趙雲仕官）`
    - 来源行定位（`sourceLocator`）：
      - 起始行（`startLine`）：481
      - 结束行（`endLine`）：494
  - 第 12 项：
    - 观察标识（`observationId`）：`atwiki-88-21`
    - 来源网址（`sourceURL`）：[https://w.atwiki.jp/sangokushi11/pages/88.html](https://w.atwiki.jp/sangokushi11/pages/88.html)
    - 来源章节（`sourceSection`）：`好漢・劉備（龔都、周倉、裴元紹、劉辟、廖化仕官）`
    - 来源行定位（`sourceLocator`）：
      - 起始行（`startLine`）：495
      - 结束行（`endLine`）：510
  - 第 13 项：
    - 观察标识（`observationId`）：`atwiki-88-22`
    - 来源网址（`sourceURL`）：[https://w.atwiki.jp/sangokushi11/pages/88.html](https://w.atwiki.jp/sangokushi11/pages/88.html)
    - 来源章节（`sourceSection`）：`趙雲再会`
    - 来源行定位（`sourceLocator`）：
      - 起始行（`startLine`）：511
      - 结束行（`endLine`）：523
  - 第 14 项：
    - 观察标识（`observationId`）：`atwiki-88-25`
    - 来源网址（`sourceURL`）：[https://w.atwiki.jp/sangokushi11/pages/88.html](https://w.atwiki.jp/sangokushi11/pages/88.html)
    - 来源章节（`sourceSection`）：`孔明の嫁とり`
    - 来源行定位（`sourceLocator`）：
      - 起始行（`startLine`）：537
      - 结束行（`endLine`）：545
  - 第 15 项：
    - 观察标识（`observationId`）：`atwiki-88-26`
    - 来源网址（`sourceURL`）：[https://w.atwiki.jp/sangokushi11/pages/88.html](https://w.atwiki.jp/sangokushi11/pages/88.html)
    - 来源章节（`sourceSection`）：`甘寧亡命`
    - 来源行定位（`sourceLocator`）：
      - 起始行（`startLine`）：546
      - 结束行（`endLine`）：564
  - 第 16 项：
    - 观察标识（`observationId`）：`atwiki-88-27`
    - 来源网址（`sourceURL`）：[https://w.atwiki.jp/sangokushi11/pages/88.html](https://w.atwiki.jp/sangokushi11/pages/88.html)
    - 来源章节（`sourceSection`）：`徐庶登場`
    - 来源行定位（`sourceLocator`）：
      - 起始行（`startLine`）：565
      - 结束行（`endLine`）：565
  - 第 17 项：
    - 观察标识（`observationId`）：`atwiki-88-30`
    - 来源网址（`sourceURL`）：[https://w.atwiki.jp/sangokushi11/pages/88.html](https://w.atwiki.jp/sangokushi11/pages/88.html)
    - 来源章节（`sourceSection`）：`馬氏の五常`
    - 来源行定位（`sourceLocator`）：
      - 起始行（`startLine`）：594
      - 结束行（`endLine`）：623
  - 第 18 项：
    - 观察标识（`observationId`）：`atwiki-88-31`
    - 来源网址（`sourceURL`）：[https://w.atwiki.jp/sangokushi11/pages/88.html](https://w.atwiki.jp/sangokushi11/pages/88.html)
    - 来源章节（`sourceSection`）：`孫尚香の結婚`
    - 来源行定位（`sourceLocator`）：
      - 起始行（`startLine`）：624
      - 结束行（`endLine`）：643
  - 第 19 项：
    - 观察标识（`observationId`）：`atwiki-88-35`
    - 来源网址（`sourceURL`）：[https://w.atwiki.jp/sangokushi11/pages/88.html](https://w.atwiki.jp/sangokushi11/pages/88.html)
    - 来源章节（`sourceSection`）：`漢中王即位`
    - 来源行定位（`sourceLocator`）：
      - 起始行（`startLine`）：700
      - 结束行（`endLine`）：727
  - 第 20 项：
    - 观察标识（`observationId`）：`atwiki-88-36`
    - 来源网址（`sourceURL`）：[https://w.atwiki.jp/sangokushi11/pages/88.html](https://w.atwiki.jp/sangokushi11/pages/88.html)
    - 来源章节（`sourceSection`）：`魏帝即位`
    - 来源行定位（`sourceLocator`）：
      - 起始行（`startLine`）：728
      - 结束行（`endLine`）：761
  - 第 21 项：
    - 观察标识（`observationId`）：`atwiki-88-37`
    - 来源网址（`sourceURL`）：[https://w.atwiki.jp/sangokushi11/pages/88.html](https://w.atwiki.jp/sangokushi11/pages/88.html)
    - 来源章节（`sourceSection`）：`蜀帝即位`
    - 来源行定位（`sourceLocator`）：
      - 起始行（`startLine`）：762
      - 结束行（`endLine`）：799
  - 第 22 项：
    - 观察标识（`observationId`）：`atwiki-88-39`
    - 来源网址（`sourceURL`）：[https://w.atwiki.jp/sangokushi11/pages/88.html](https://w.atwiki.jp/sangokushi11/pages/88.html)
    - 来源章节（`sourceSection`）：`呉王即位`
    - 来源行定位（`sourceLocator`）：
      - 起始行（`startLine`）：819
      - 结束行（`endLine`）：857
  - 第 23 项：
    - 观察标识（`observationId`）：`atwiki-88-42`
    - 来源网址（`sourceURL`）：[https://w.atwiki.jp/sangokushi11/pages/88.html](https://w.atwiki.jp/sangokushi11/pages/88.html)
    - 来源章节（`sourceSection`）：`呉帝即位`
    - 来源行定位（`sourceLocator`）：
      - 起始行（`startLine`）：902
      - 结束行（`endLine`）：928
  - 第 24 项：
    - 观察标识（`observationId`）：`gamersky.depose-shao-emperor`
    - 来源网址（`sourceURL`）：[https://www.gamersky.com/handbook/200809/124174.shtml](https://www.gamersky.com/handbook/200809/124174.shtml)
    - 来源章节（`sourceSection`）：`少帝废立`
  - 第 25 项：
    - 观察标识（`observationId`）：`gamersky.recruit-dian-wei`
    - 来源网址（`sourceURL`）：[https://www.gamersky.com/handbook/200809/124174.shtml](https://www.gamersky.com/handbook/200809/124174.shtml)
    - 来源章节（`sourceSection`）：`恶来出场`
  - 第 26 项：
    - 观察标识（`observationId`）：`gamersky.recruit-xu-chu`
    - 来源网址（`sourceURL`）：[https://www.gamersky.com/handbook/200809/124174_2.shtml](https://www.gamersky.com/handbook/200809/124174_2.shtml)
    - 来源章节（`sourceSection`）：`虎痴斗恶来`
  - 第 27 项：
    - 观察标识（`observationId`）：`gamersky.recommend-guo-jia`
    - 来源网址（`sourceURL`）：[https://www.gamersky.com/handbook/200809/124174_2.shtml](https://www.gamersky.com/handbook/200809/124174_2.shtml)
    - 来源章节（`sourceSection`）：`荀彧推荐郭嘉`
  - 第 28 项：
    - 观察标识（`observationId`）：`gamersky.marry-liu-bei-mi`
    - 来源网址（`sourceURL`）：[https://www.gamersky.com/handbook/200809/124174_3.shtml](https://www.gamersky.com/handbook/200809/124174_3.shtml)
    - 来源章节（`sourceSection`）：`糜氏嫁刘备`
  - 第 29 项：
    - 观察标识（`observationId`）：`gamersky.recruit-sun-ce-five`
    - 来源网址（`sourceURL`）：[https://www.gamersky.com/handbook/200809/124174_3.shtml](https://www.gamersky.com/handbook/200809/124174_3.shtml)
    - 来源章节（`sourceSection`）：`小霸王孙策`
  - 第 30 项：
    - 观察标识（`observationId`）：`gamersky.recommend-two-zhangs`
    - 来源网址（`sourceURL`）：[https://www.gamersky.com/handbook/200809/124174_3.shtml](https://www.gamersky.com/handbook/200809/124174_3.shtml)
    - 来源章节（`sourceSection`）：`周瑜推举二张`
  - 第 31 项：
    - 观察标识（`observationId`）：`gamersky.marry-two-qiaos`
    - 来源网址（`sourceURL`）：[https://www.gamersky.com/handbook/200809/124174_4.shtml](https://www.gamersky.com/handbook/200809/124174_4.shtml)
    - 来源章节（`sourceSection`）：`二乔结婚`
  - 第 32 项：
    - 观察标识（`observationId`）：`gamersky.marry-cao-pi-zhen`
    - 来源网址（`sourceURL`）：[https://www.gamersky.com/handbook/200809/124174_4.shtml](https://www.gamersky.com/handbook/200809/124174_4.shtml)
    - 来源章节（`sourceSection`）：`甄氏转嫁曹丕`
  - 第 33 项：
    - 观察标识（`observationId`）：`gamersky.two-powers-war`
    - 来源网址（`sourceURL`）：[https://www.gamersky.com/handbook/200809/124174_5.shtml](https://www.gamersky.com/handbook/200809/124174_5.shtml)
    - 来源章节（`sourceSection`）：`二强开战`
  - 第 34 项：
    - 观察标识（`observationId`）：`gamersky.zhao-yun-reunion`
    - 来源网址（`sourceURL`）：[https://www.gamersky.com/handbook/200809/124174_5.shtml](https://www.gamersky.com/handbook/200809/124174_5.shtml)
    - 来源章节（`sourceSection`）：`赵云再会`
  - 第 35 项：
    - 观察标识（`observationId`）：`gamersky.recruit-liu-bei-five`
    - 来源网址（`sourceURL`）：[https://www.gamersky.com/handbook/200809/124174_5.shtml](https://www.gamersky.com/handbook/200809/124174_5.shtml)
    - 来源章节（`sourceSection`）：`好汉刘备`
  - 第 36 项：
    - 观察标识（`observationId`）：`gamersky.marry-zhuge-liang`
    - 来源网址（`sourceURL`）：[https://www.gamersky.com/handbook/200809/124174_6.shtml](https://www.gamersky.com/handbook/200809/124174_6.shtml)
    - 来源章节（`sourceSection`）：`诸葛亮结婚`
  - 第 37 项：
    - 观察标识（`observationId`）：`gamersky.gan-ning-defects`
    - 来源网址（`sourceURL`）：[https://www.gamersky.com/handbook/200809/124174_6.shtml](https://www.gamersky.com/handbook/200809/124174_6.shtml)
    - 来源章节（`sourceSection`）：`甘宁逃命`
  - 第 38 项：
    - 观察标识（`observationId`）：`gamersky.xu-shu-arrives`
    - 来源网址（`sourceURL`）：[https://www.gamersky.com/handbook/200809/124174_7.shtml](https://www.gamersky.com/handbook/200809/124174_7.shtml)
    - 来源章节（`sourceSection`）：`徐庶登场`
  - 第 39 项：
    - 观察标识（`observationId`）：`gamersky.recommend-ma-brothers`
    - 来源网址（`sourceURL`）：[https://www.gamersky.com/handbook/200809/124174_8.shtml](https://www.gamersky.com/handbook/200809/124174_8.shtml)
    - 来源章节（`sourceSection`）：`马氏五常`
  - 第 40 项：
    - 观察标识（`observationId`）：`gamersky.marry-sun-shang-xiang`
    - 来源网址（`sourceURL`）：[https://www.gamersky.com/handbook/200809/124174_8.shtml](https://www.gamersky.com/handbook/200809/124174_8.shtml)
    - 来源章节（`sourceSection`）：`孙尚香结婚`
  - 第 41 项：
    - 观察标识（`observationId`）：`gamersky.liu-bei-hanzhong-king`
    - 来源网址（`sourceURL`）：[https://www.gamersky.com/handbook/200809/124174_9.shtml](https://www.gamersky.com/handbook/200809/124174_9.shtml)
    - 来源章节（`sourceSection`）：`汉中王即位`
  - 第 42 项：
    - 观察标识（`observationId`）：`gamersky.wei-emperor-accession`
    - 来源网址（`sourceURL`）：[https://www.gamersky.com/handbook/200809/124174_10.shtml](https://www.gamersky.com/handbook/200809/124174_10.shtml)
    - 来源章节（`sourceSection`）：`魏帝即位`
  - 第 43 项：
    - 观察标识（`observationId`）：`gamersky.shu-emperor-accession`
    - 来源网址（`sourceURL`）：[https://www.gamersky.com/handbook/200809/124174_10.shtml](https://www.gamersky.com/handbook/200809/124174_10.shtml)
    - 来源章节（`sourceSection`）：`蜀帝即位`
  - 第 44 项：
    - 观察标识（`observationId`）：`gamersky.wu-king-accession`
    - 来源网址（`sourceURL`）：[https://www.gamersky.com/handbook/200809/124174_11.shtml](https://www.gamersky.com/handbook/200809/124174_11.shtml)
    - 来源章节（`sourceSection`）：`吴王即位`
  - 第 45 项：
    - 观察标识（`observationId`）：`gamersky.wu-emperor-accession`
    - 来源网址（`sourceURL`）：[https://www.gamersky.com/handbook/200809/124174_12.shtml](https://www.gamersky.com/handbook/200809/124174_12.shtml)
    - 来源章节（`sourceSection`）：`吴王即位`

### 分歧 02：recommendation-relationship

中文说明：中文要求候选人与玩家君主相性接近，但没有数值阈值；日文要求不存在有缘关系。两者不是同一条件的互译。各自明确的单向厌恶排除条件也分别保留。

- 分歧标识（`id`）：`recommendation-relationship`
- 涉及事件（`eventIds`）：列表（按来源次序）：`recruit-dian-wei`、`recruit-xu-chu`、`recommend-guo-jia`、`recommend-two-zhangs`、`gan-ning-defects`、`recommend-ma-brothers`
- 观察标识列表（`observationIds`）：列表（按来源次序）：`atwiki-88-08`、`atwiki-88-10`、`atwiki-88-11`、`atwiki-88-15`、`atwiki-88-26`、`atwiki-88-30`、`gamersky.recruit-dian-wei`、`gamersky.recruit-xu-chu`、`gamersky.recommend-guo-jia`、`gamersky.recommend-two-zhangs`、`gamersky.gan-ning-defects`、`gamersky.recommend-ma-brothers`
- 涉及字段（`fields`）：列表（按来源次序）：`conditions.compatibility`、`conditions.associated-relationship`
- 来源差异说明（`description`）：Chinese requires candidate compatibility close to the player ruler, with no numeric threshold. Japanese requires absence of an associated relationship (有縁関係). These are different predicates, not translations of the same relation; both guides separately state directed dislike exclusions where present.
- 状态（`status`）：未解决（`unresolved`）
- 比对依据（`reviewBasis`）：`fresh-source-comparison`
- 差异类别（`differenceType`）：`source-claim-difference`
- 关联来源（`sourceReferences`）：
  - 第 1 项：
    - 观察标识（`observationId`）：`atwiki-88-08`
    - 来源网址（`sourceURL`）：[https://w.atwiki.jp/sangokushi11/pages/88.html](https://w.atwiki.jp/sangokushi11/pages/88.html)
    - 来源章节（`sourceSection`）：`虎を追う者（典韋登用）`
    - 来源行定位（`sourceLocator`）：
      - 起始行（`startLine`）：230
      - 结束行（`endLine`）：255
  - 第 2 项：
    - 观察标识（`observationId`）：`atwiki-88-10`
    - 来源网址（`sourceURL`）：[https://w.atwiki.jp/sangokushi11/pages/88.html](https://w.atwiki.jp/sangokushi11/pages/88.html)
    - 来源章节（`sourceSection`）：`悪来vs許褚（許褚登用）`
    - 来源行定位（`sourceLocator`）：
      - 起始行（`startLine`）：267
      - 结束行（`endLine`）：297
  - 第 3 项：
    - 观察标识（`observationId`）：`atwiki-88-11`
    - 来源网址（`sourceURL`）：[https://w.atwiki.jp/sangokushi11/pages/88.html](https://w.atwiki.jp/sangokushi11/pages/88.html)
    - 来源章节（`sourceSection`）：`郭嘉推挙`
    - 来源行定位（`sourceLocator`）：
      - 起始行（`startLine`）：298
      - 结束行（`endLine`）：322
  - 第 4 项：
    - 观察标识（`observationId`）：`atwiki-88-15`
    - 来源网址（`sourceURL`）：[https://w.atwiki.jp/sangokushi11/pages/88.html](https://w.atwiki.jp/sangokushi11/pages/88.html)
    - 来源章节（`sourceSection`）：`二張推挙`
    - 来源行定位（`sourceLocator`）：
      - 起始行（`startLine`）：367
      - 结束行（`endLine`）：398
  - 第 5 项：
    - 观察标识（`observationId`）：`atwiki-88-26`
    - 来源网址（`sourceURL`）：[https://w.atwiki.jp/sangokushi11/pages/88.html](https://w.atwiki.jp/sangokushi11/pages/88.html)
    - 来源章节（`sourceSection`）：`甘寧亡命`
    - 来源行定位（`sourceLocator`）：
      - 起始行（`startLine`）：546
      - 结束行（`endLine`）：564
  - 第 6 项：
    - 观察标识（`observationId`）：`atwiki-88-30`
    - 来源网址（`sourceURL`）：[https://w.atwiki.jp/sangokushi11/pages/88.html](https://w.atwiki.jp/sangokushi11/pages/88.html)
    - 来源章节（`sourceSection`）：`馬氏の五常`
    - 来源行定位（`sourceLocator`）：
      - 起始行（`startLine`）：594
      - 结束行（`endLine`）：623
  - 第 7 项：
    - 观察标识（`observationId`）：`gamersky.recruit-dian-wei`
    - 来源网址（`sourceURL`）：[https://www.gamersky.com/handbook/200809/124174.shtml](https://www.gamersky.com/handbook/200809/124174.shtml)
    - 来源章节（`sourceSection`）：`恶来出场`
  - 第 8 项：
    - 观察标识（`observationId`）：`gamersky.recruit-xu-chu`
    - 来源网址（`sourceURL`）：[https://www.gamersky.com/handbook/200809/124174_2.shtml](https://www.gamersky.com/handbook/200809/124174_2.shtml)
    - 来源章节（`sourceSection`）：`虎痴斗恶来`
  - 第 9 项：
    - 观察标识（`observationId`）：`gamersky.recommend-guo-jia`
    - 来源网址（`sourceURL`）：[https://www.gamersky.com/handbook/200809/124174_2.shtml](https://www.gamersky.com/handbook/200809/124174_2.shtml)
    - 来源章节（`sourceSection`）：`荀彧推荐郭嘉`
  - 第 10 项：
    - 观察标识（`observationId`）：`gamersky.recommend-two-zhangs`
    - 来源网址（`sourceURL`）：[https://www.gamersky.com/handbook/200809/124174_3.shtml](https://www.gamersky.com/handbook/200809/124174_3.shtml)
    - 来源章节（`sourceSection`）：`周瑜推举二张`
  - 第 11 项：
    - 观察标识（`observationId`）：`gamersky.gan-ning-defects`
    - 来源网址（`sourceURL`）：[https://www.gamersky.com/handbook/200809/124174_6.shtml](https://www.gamersky.com/handbook/200809/124174_6.shtml)
    - 来源章节（`sourceSection`）：`甘宁逃命`
  - 第 12 项：
    - 观察标识（`observationId`）：`gamersky.recommend-ma-brothers`
    - 来源网址（`sourceURL`）：[https://www.gamersky.com/handbook/200809/124174_8.shtml](https://www.gamersky.com/handbook/200809/124174_8.shtml)
    - 来源章节（`sourceSection`）：`马氏五常`

### 分歧 03：dian-wei-eligibility

中文说明：中文要求陈留、濮阳，夏侯惇忠诚>95，城市治安>80；Wiki不列指定城市，要求推荐者忠诚≥90、所属城市治安≥80，且排除禁止仕官君主为玩家的候选人。中文未列该仕官禁止条件。

- 分歧标识（`id`）：`dian-wei-eligibility`
- 涉及事件（`eventIds`）：列表（按来源次序）：`recruit-dian-wei`
- 观察标识列表（`observationIds`）：列表（按来源次序）：`atwiki-88-08`、`gamersky.recruit-dian-wei`
- 涉及字段（`fields`）：列表（按来源次序）：`conditions.cities`、`conditions.loyalty`、`conditions.public-order`、`conditions.prohibited-ruler`
- 来源差异说明（`description`）：Chinese requires Chenliu and Puyang, Xiahou Dun loyalty>95 and city order>80. Wiki has no named-city ownership gate, sponsor loyalty>=90 and assigned-city order>=80, and explicitly excludes a candidate whose prohibited ruler is the player. Chinese does not state that employment-ban gate.
- 状态（`status`）：未解决（`unresolved`）
- 比对依据（`reviewBasis`）：`fresh-source-comparison`
- 差异类别（`differenceType`）：`source-claim-difference`
- 关联来源（`sourceReferences`）：
  - 第 1 项：
    - 观察标识（`observationId`）：`atwiki-88-08`
    - 来源网址（`sourceURL`）：[https://w.atwiki.jp/sangokushi11/pages/88.html](https://w.atwiki.jp/sangokushi11/pages/88.html)
    - 来源章节（`sourceSection`）：`虎を追う者（典韋登用）`
    - 来源行定位（`sourceLocator`）：
      - 起始行（`startLine`）：230
      - 结束行（`endLine`）：255
  - 第 2 项：
    - 观察标识（`observationId`）：`gamersky.recruit-dian-wei`
    - 来源网址（`sourceURL`）：[https://www.gamersky.com/handbook/200809/124174.shtml](https://www.gamersky.com/handbook/200809/124174.shtml)
    - 来源章节（`sourceSection`）：`恶来出场`

### 分歧 04：xu-chu-eligibility

中文说明：中文要求汝南、许昌，典韦忠诚>95、治安>80；Wiki不列指定城市，使用≥90、≥80。非曹操君主失败时，中文给出在野和3个月禁止仕官，Wiki说明在玩家控制范围外、90日禁止；不得换算单位。Wiki明确进行单挑，曹操不论输赢均可登用。

- 分歧标识（`id`）：`xu-chu-eligibility`
- 涉及事件（`eventIds`）：列表（按来源次序）：`recruit-xu-chu`
- 观察标识列表（`observationIds`）：列表（按来源次序）：`atwiki-88-10`、`gamersky.recruit-xu-chu`
- 涉及字段（`fields`）：列表（按来源次序）：`conditions.cities`、`conditions.loyalty`、`conditions.public-order`、`orderedResults.failure-location`、`orderedResults.prohibited-ruler-duration`
- 来源差异说明（`description`）：Chinese requires Runan and Xuchang, Dian Wei loyalty>95 and order>80; Wiki names no owned cities and uses >=90/>=80. On a non-Cao-Cao defeat, Chinese says free officer and a 3-month ban, while Wiki explicitly places Xu Chu outside player control and states90 days. Months are not converted to days. Wiki explicitly starts a duel and states Cao Cao recruits regardless of its outcome.
- 状态（`status`）：未解决（`unresolved`）
- 比对依据（`reviewBasis`）：`fresh-source-comparison`
- 差异类别（`differenceType`）：`numeric-scope-and-unit-difference`
- 关联来源（`sourceReferences`）：
  - 第 1 项：
    - 观察标识（`observationId`）：`atwiki-88-10`
    - 来源网址（`sourceURL`）：[https://w.atwiki.jp/sangokushi11/pages/88.html](https://w.atwiki.jp/sangokushi11/pages/88.html)
    - 来源章节（`sourceSection`）：`悪来vs許褚（許褚登用）`
    - 来源行定位（`sourceLocator`）：
      - 起始行（`startLine`）：267
      - 结束行（`endLine`）：297
  - 第 2 项：
    - 观察标识（`observationId`）：`gamersky.recruit-xu-chu`
    - 来源网址（`sourceURL`）：[https://www.gamersky.com/handbook/200809/124174_2.shtml](https://www.gamersky.com/handbook/200809/124174_2.shtml)
    - 来源章节（`sourceSection`）：`虎痴斗恶来`

### 分歧 05：guo-jia-eligibility

中文说明：中文要求荀彧忠诚>95、所在城市治安>80；Wiki要求忠诚≥90，未列城市治安条件。

- 分歧标识（`id`）：`guo-jia-eligibility`
- 涉及事件（`eventIds`）：列表（按来源次序）：`recommend-guo-jia`
- 观察标识列表（`observationIds`）：列表（按来源次序）：`atwiki-88-11`、`gamersky.recommend-guo-jia`
- 涉及字段（`fields`）：列表（按来源次序）：`conditions.loyalty`、`conditions.public-order`
- 来源差异说明（`description`）：Chinese requires Xun Yu loyalty>95 and his city order>80. Wiki requires loyalty>=90 and states no city-order condition.
- 状态（`status`）：未解决（`unresolved`）
- 比对依据（`reviewBasis`）：`fresh-source-comparison`
- 差异类别（`differenceType`）：`source-claim-difference`
- 关联来源（`sourceReferences`）：
  - 第 1 项：
    - 观察标识（`observationId`）：`atwiki-88-11`
    - 来源网址（`sourceURL`）：[https://w.atwiki.jp/sangokushi11/pages/88.html](https://w.atwiki.jp/sangokushi11/pages/88.html)
    - 来源章节（`sourceSection`）：`郭嘉推挙`
    - 来源行定位（`sourceLocator`）：
      - 起始行（`startLine`）：298
      - 结束行（`endLine`）：322
  - 第 2 项：
    - 观察标识（`observationId`）：`gamersky.recommend-guo-jia`
    - 来源网址（`sourceURL`）：[https://www.gamersky.com/handbook/200809/124174_2.shtml](https://www.gamersky.com/handbook/200809/124174_2.shtml)
    - 来源章节（`sourceSection`）：`荀彧推荐郭嘉`

### 分歧 06：mi-marriage-eligibility

中文说明：中文要求下邳和小沛同时持有；Wiki允许任一，并加当前日期≥195年1月。玩家刘备时，中文糜竺功绩>10000、忠诚>95，Wiki为≥5000、≥90。女性史实模式、糜氏登场/在野/未发现、两人同城、任务条件及糜氏已仕官的允许范围均不同；招募忠诚与功绩的条件分支也必须分别保留。

- 分歧标识（`id`）：`mi-marriage-eligibility`
- 涉及事件（`eventIds`）：列表（按来源次序）：`marry-liu-bei-mi`
- 观察标识列表（`observationIds`）：列表（按来源次序）：`atwiki-88-12`、`gamersky.marry-liu-bei-mi`
- 涉及字段（`fields`）：列表（按来源次序）：`conditions.current-month`、`conditions.cities`、`conditions.merit`、`conditions.loyalty`、`conditions.character-type`、`conditions.colocation`、`conditions.mission`、`orderedResults.character-branches`
- 来源差异说明（`description`）：Chinese requires both Xiapi and Xiaopei; Wiki either city and current month>=195-01. For player Liu Bei, Chinese Mi Zhu merit>10000/loyalty>95 differs from Wiki>=5000/>=90. Chinese globally requires historical-female mode, debuted free/undiscovered Mi, and Liu Bei/Mi Zhu same city and off mission. Wiki instead conditionally checks historical Mi, permits her already serving Liu Bei, states no same-city gate, and applies mission only in the player-Liu-Bei branch. Chinese Mi loyalty100/merit1000 results are player-Liu-Bei conditional; Wiki loyalty100 is historical-mode conditional and merit1000 further requires her not already serving Liu Bei.
- 状态（`status`）：未解决（`unresolved`）
- 比对依据（`reviewBasis`）：`fresh-source-comparison`
- 差异类别（`differenceType`）：`source-claim-difference`
- 关联来源（`sourceReferences`）：
  - 第 1 项：
    - 观察标识（`observationId`）：`atwiki-88-12`
    - 来源网址（`sourceURL`）：[https://w.atwiki.jp/sangokushi11/pages/88.html](https://w.atwiki.jp/sangokushi11/pages/88.html)
    - 来源章节（`sourceSection`）：`麋氏と劉備（劉備・麋氏結婚）`
    - 来源行定位（`sourceLocator`）：
      - 起始行（`startLine`）：323
      - 结束行（`endLine`）：344
  - 第 2 项：
    - 观察标识（`observationId`）：`gamersky.marry-liu-bei-mi`
    - 来源网址（`sourceURL`）：[https://www.gamersky.com/handbook/200809/124174_3.shtml](https://www.gamersky.com/handbook/200809/124174_3.shtml)
    - 来源章节（`sourceSection`）：`糜氏嫁刘备`

### 分歧 07：sun-ce-sortie-actors

中文说明：中文列周瑜、朱治，并要求三人均无任务；Wiki只列剧本3、开始第0日与孙策为君主，不补入中文独有角色和条件。

- 分歧标识（`id`）：`sun-ce-sortie-actors`
- 涉及事件（`eventIds`）：列表（按来源次序）：`sun-ce-sortie`
- 观察标识列表（`observationIds`）：列表（按来源次序）：`atwiki-88-13`、`gamersky.sun-ce-sortie`
- 涉及字段（`fields`）：列表（按来源次序）：`conditions.officers`、`conditions.mission`
- 来源差异说明（`description`）：Chinese names Zhou Yu and Zhu Zhi and requires all three actors off mission. Wiki lists only scenario3, day0 and Sun Ce ruler. No Chinese-only actors or gates are added to Wiki.
- 状态（`status`）：未解决（`unresolved`）
- 比对依据（`reviewBasis`）：`fresh-source-comparison`
- 差异类别（`differenceType`）：`source-omission`
- 关联来源（`sourceReferences`）：
  - 第 1 项：
    - 观察标识（`observationId`）：`atwiki-88-13`
    - 来源网址（`sourceURL`）：[https://w.atwiki.jp/sangokushi11/pages/88.html](https://w.atwiki.jp/sangokushi11/pages/88.html)
    - 来源章节（`sourceSection`）：`孫策出陣`
    - 来源行定位（`sourceLocator`）：
      - 起始行（`startLine`）：345
      - 结束行（`endLine`）：351
  - 第 2 项：
    - 观察标识（`observationId`）：`gamersky.sun-ce-sortie`
    - 来源网址（`sourceURL`）：[https://www.gamersky.com/handbook/200809/124174_3.shtml](https://www.gamersky.com/handbook/200809/124174_3.shtml)
    - 来源章节（`sourceSection`）：`孙策出阵`

### 分歧 08：five-recruit-quantifiers

中文说明：中文分别要求至少一人已登场、至少一人在野或未发现，未明示必须同一个人同时满足；Wiki把两项放在同一候选人下。中文结果招募在野或未发现候选人，Wiki仅招募事件参加者。刘备事件中文要求关羽为部下且与刘备同城；Wiki明确两人在汝南。

- 分歧标识（`id`）：`five-recruit-quantifiers`
- 涉及事件（`eventIds`）：列表（按来源次序）：`recruit-sun-ce-five`、`recruit-liu-bei-five`
- 观察标识列表（`observationIds`）：列表（按来源次序）：`atwiki-88-14`、`atwiki-88-21`、`gamersky.recruit-sun-ce-five`、`gamersky.recruit-liu-bei-five`
- 涉及字段（`fields`）：列表（按来源次序）：`conditions.candidate-quantifier`、`conditions.location`、`conditions.officers`、`orderedResults.recruited-candidates`
- 来源差异说明（`description`）：Chinese separately states at least one debuted candidate and at least one free/undiscovered candidate; it does not explicitly require one same candidate to satisfy both. Wiki explicitly nests both conditions under one candidate. Chinese results recruit free/undiscovered candidates; Wiki only event participants. Liu Bei Chinese requires Guan Yu subordinate and same city with Liu Bei, while Wiki explicitly places both in Runan. Do not repair either quantifier from the other source.
- 状态（`status`）：未解决（`unresolved`）
- 比对依据（`reviewBasis`）：`fresh-source-comparison`
- 差异类别（`differenceType`）：`quantifier-and-scope-difference`
- 关联来源（`sourceReferences`）：
  - 第 1 项：
    - 观察标识（`observationId`）：`atwiki-88-14`
    - 来源网址（`sourceURL`）：[https://w.atwiki.jp/sangokushi11/pages/88.html](https://w.atwiki.jp/sangokushi11/pages/88.html)
    - 来源章节（`sourceSection`）：`小覇王・孫策（周泰、蒋欽、陳武、董襲、凌操仕官）`
    - 来源行定位（`sourceLocator`）：
      - 起始行（`startLine`）：352
      - 结束行（`endLine`）：366
  - 第 2 项：
    - 观察标识（`observationId`）：`atwiki-88-21`
    - 来源网址（`sourceURL`）：[https://w.atwiki.jp/sangokushi11/pages/88.html](https://w.atwiki.jp/sangokushi11/pages/88.html)
    - 来源章节（`sourceSection`）：`好漢・劉備（龔都、周倉、裴元紹、劉辟、廖化仕官）`
    - 来源行定位（`sourceLocator`）：
      - 起始行（`startLine`）：495
      - 结束行（`endLine`）：510
  - 第 3 项：
    - 观察标识（`observationId`）：`gamersky.recruit-sun-ce-five`
    - 来源网址（`sourceURL`）：[https://www.gamersky.com/handbook/200809/124174_3.shtml](https://www.gamersky.com/handbook/200809/124174_3.shtml)
    - 来源章节（`sourceSection`）：`小霸王孙策`
  - 第 4 项：
    - 观察标识（`observationId`）：`gamersky.recruit-liu-bei-five`
    - 来源网址（`sourceURL`）：[https://www.gamersky.com/handbook/200809/124174_5.shtml](https://www.gamersky.com/handbook/200809/124174_5.shtml)
    - 来源章节（`sourceSection`）：`好汉刘备`

### 分歧 09：two-zhangs-eligibility

中文说明：中文增加柴桑、建业、庐江及周瑜忠诚>95；Wiki不列指定城市、忠诚≥90。中文失败条款字面将张昭/张纮设为玩家君主的禁止仕官君主、持续12月；Wiki方向相反，持续360日并转到玩家控制外城市。保留中文疑似反向表述及不同单位。

- 分歧标识（`id`）：`two-zhangs-eligibility`
- 涉及事件（`eventIds`）：列表（按来源次序）：`recommend-two-zhangs`
- 观察标识列表（`observationIds`）：列表（按来源次序）：`atwiki-88-15`、`gamersky.recommend-two-zhangs`
- 涉及字段（`fields`）：列表（按来源次序）：`conditions.cities`、`conditions.loyalty`、`orderedResults.prohibited-ruler-direction`、`orderedResults.prohibited-ruler-duration`、`orderedResults.failure-location`
- 来源差异说明（`description`）：Chinese adds Chaisang/Jianye/Lujiang ownership and Zhou Yu loyalty>95; Wiki has no named-city gate and loyalty>=90. Chinese failure literally makes Zhang Zhao/Zhang Hong the player ruler’s prohibited rulers for12 months; Wiki makes the player ruler their prohibited ruler for360 days and specifies a city outside player control. Preserve the apparent Chinese reversed direction and the distinct units.
- 状态（`status`）：未解决（`unresolved`）
- 比对依据（`reviewBasis`）：`fresh-source-comparison`
- 差异类别（`differenceType`）：`scope-direction-and-unit-difference`
- 关联来源（`sourceReferences`）：
  - 第 1 项：
    - 观察标识（`observationId`）：`atwiki-88-15`
    - 来源网址（`sourceURL`）：[https://w.atwiki.jp/sangokushi11/pages/88.html](https://w.atwiki.jp/sangokushi11/pages/88.html)
    - 来源章节（`sourceSection`）：`二張推挙`
    - 来源行定位（`sourceLocator`）：
      - 起始行（`startLine`）：367
      - 结束行（`endLine`）：398
  - 第 2 项：
    - 观察标识（`observationId`）：`gamersky.recommend-two-zhangs`
    - 来源网址（`sourceURL`）：[https://www.gamersky.com/handbook/200809/124174_3.shtml](https://www.gamersky.com/handbook/200809/124174_3.shtml)
    - 来源章节（`sourceSection`）：`周瑜推举二张`

### 分歧 10：qiao-marriage-scope

中文说明：Wiki要求当前日期≥196年1月，可为存在的孙坚/孙策势力，不限玩家；中文限玩家孙吴君主、史实女性模式且二乔已登场。中文列两场婚姻与忠诚/功绩，Wiki无结果块；Wiki混合仕官/在野状态的歧义保留。

- 分歧标识（`id`）：`qiao-marriage-scope`
- 涉及事件（`eventIds`）：列表（按来源次序）：`marry-two-qiaos`
- 观察标识列表（`observationIds`）：列表（按来源次序）：`atwiki-88-16`、`gamersky.marry-two-qiaos`
- 涉及字段（`fields`）：列表（按来源次序）：`conditions.current-month`、`conditions.controller`、`conditions.character-type`、`conditions.debut`、`orderedResults`
- 来源差异说明（`description`）：Wiki adds current>=196-01 and allows an existing Sun Jian/Sun Ce force without a player-only gate. Chinese explicitly requires the player Sun-Wu ruler, historical-female mode and both Qiaos debuted. Chinese describes two marriages and loyalty/merit changes; Wiki has no result block. Wiki’s mixed force/free status wording remains ambiguous.
- 状态（`status`）：未解决（`unresolved`）
- 比对依据（`reviewBasis`）：`fresh-source-comparison`
- 差异类别（`differenceType`）：`scope-and-source-omission`
- 关联来源（`sourceReferences`）：
  - 第 1 项：
    - 观察标识（`observationId`）：`atwiki-88-16`
    - 来源网址（`sourceURL`）：[https://w.atwiki.jp/sangokushi11/pages/88.html](https://w.atwiki.jp/sangokushi11/pages/88.html)
    - 来源章节（`sourceSection`）：`二喬婚礼`
    - 来源行定位（`sourceLocator`）：
      - 起始行（`startLine`）：399
      - 结束行（`endLine`）：411
  - 第 2 项：
    - 观察标识（`observationId`）：`gamersky.marry-two-qiaos`
    - 来源网址（`sourceURL`）：[https://www.gamersky.com/handbook/200809/124174_4.shtml](https://www.gamersky.com/handbook/200809/124174_4.shtml)
    - 来源章节（`sourceSection`）：`二乔结婚`

### 分歧 11：yuan-shu-diplomacy

中文说明：中文由势力持有玉玺、排除任何其他“成”势力；Wiki为袁术本人持有，只排除电脑“成”势力，并明确玩家选择、电脑接受。中文外交结果是分别列出的方向性规则；Wiki有AND与嵌套OR分组，并保留重复的重视汉室条件。不得互相归一或决定运行时作用范围。

- 分歧标识（`id`）：`yuan-shu-diplomacy`
- 涉及事件（`eventIds`）：列表（按来源次序）：`yuan-shu-usurps`
- 观察标识列表（`observationIds`）：列表（按来源次序）：`atwiki-88-17`、`gamersky.yuan-shu-usurps`
- 涉及字段（`fields`）：列表（按来源次序）：`conditions.item-owner`、`conditions.country-name-scope`、`orderedResults.choice`、`orderedResults.diplomacy-selectors`
- 来源差异说明（`description`）：Chinese says the force owns the seal and excludes any other Cheng-named force; Wiki says Yuan Shu personally owns it and excludes only COM Cheng forces. Wiki explicitly gives a player choice and COM acceptance. Chinese lists separate directional friendship rules, including individual below-goodwill and nonallied lines. Wiki groups player-force conditions with AND plus a nested OR, preserves a redundant Han-valuing condition, and separately groups nonplayer eligible forces. Do not turn the Chinese lists into Wiki’s conjunctive selector or resolve runtime diplomatic scope.
- 状态（`status`）：未解决（`unresolved`）
- 比对依据（`reviewBasis`）：`fresh-source-comparison`
- 差异类别（`differenceType`）：`source-claim-difference`
- 关联来源（`sourceReferences`）：
  - 第 1 项：
    - 观察标识（`observationId`）：`atwiki-88-17`
    - 来源网址（`sourceURL`）：[https://w.atwiki.jp/sangokushi11/pages/88.html](https://w.atwiki.jp/sangokushi11/pages/88.html)
    - 来源章节（`sourceSection`）：`偽帝僭称`
    - 来源行定位（`sourceLocator`）：
      - 起始行（`startLine`）：412
      - 结束行（`endLine`）：441
  - 第 2 项：
    - 观察标识（`observationId`）：`gamersky.yuan-shu-usurps`
    - 来源网址（`sourceURL`）：[https://www.gamersky.com/handbook/200809/124174_4.shtml](https://www.gamersky.com/handbook/200809/124174_4.shtml)
    - 来源章节（`sourceSection`）：`伪帝僭称`

### 分歧 12：zhen-marriage-scope

中文说明：Wiki明确曹丕属于势力；中文只在模式分支提及。中文史实模式即使甄氏未婚，也要求曹丕与袁熙不同势力；Wiki只在已嫁袁熙分支要求。中文先叙述解除婚姻、再结婚；Wiki先新婚、再在已有袁熙婚姻时解除。仅保留叙述顺序。

- 分歧标识（`id`）：`zhen-marriage-scope`
- 涉及事件（`eventIds`）：列表（按来源次序）：`marry-cao-pi-zhen`
- 观察标识列表（`observationIds`）：列表（按来源次序）：`atwiki-88-18`、`gamersky.marry-cao-pi-zhen`
- 涉及字段（`fields`）：列表（按来源次序）：`conditions.force-membership`、`conditions.yuan-xi-force-inequality`、`orderedResults.order`、`orderedResults.dissolution-guard`
- 来源差异说明（`description`）：Wiki explicitly states Cao Pi belongs to a force; Chinese only refers to that force inside mode-specific clauses. Chinese historical mode requires Cao Pi and Yuan Xi in different forces even when Zhen is unmarried; Wiki places that restriction only in the already-married-to-Yuan-Xi branch. Chinese describes dissolution before new marriage; Wiki describes new marriage first and guards dissolution on an existing Yuan-Xi marriage. These are source presentation orders, not executed sequencing.
- 状态（`status`）：未解决（`unresolved`）
- 比对依据（`reviewBasis`）：`fresh-source-comparison`
- 差异类别（`differenceType`）：`source-claim-difference`
- 关联来源（`sourceReferences`）：
  - 第 1 项：
    - 观察标识（`observationId`）：`atwiki-88-18`
    - 来源网址（`sourceURL`）：[https://w.atwiki.jp/sangokushi11/pages/88.html](https://w.atwiki.jp/sangokushi11/pages/88.html)
    - 来源章节（`sourceSection`）：`御曹司一番乗り（曹丕・甄氏結婚）`
    - 来源行定位（`sourceLocator`）：
      - 起始行（`startLine`）：442
      - 结束行（`endLine`）：462
  - 第 2 项：
    - 观察标识（`observationId`）：`gamersky.marry-cao-pi-zhen`
    - 来源网址（`sourceURL`）：[https://www.gamersky.com/handbook/200809/124174_4.shtml](https://www.gamersky.com/handbook/200809/124174_4.shtml)
    - 来源章节（`sourceSection`）：`甄氏转嫁曹丕`

### 分歧 13：two-powers-date

中文说明：非开局分支，中文截止日期为198年12月之前，Wiki为≤199年12月。Wiki剧本4第0日要求两势力存在，中文开局替代条件只写剧本4第0日。Wiki后续分支另写非剧本4、曹袁无有缘关系，并枚举包括原文“陳陽”的地区城市；中文不补这些条款。

- 分歧标识（`id`）：`two-powers-date`
- 涉及事件（`eventIds`）：列表（按来源次序）：`two-powers-war`
- 观察标识列表（`observationIds`）：列表（按来源次序）：`atwiki-88-19`、`gamersky.two-powers-war`
- 涉及字段（`fields`）：列表（按来源次序）：`conditions.nonopening-start-month`、`conditions.opening-force-existence`、`conditions.scenario-branches`、`conditions.associated-relationship`、`conditions.regional-membership`
- 来源差异说明（`description`）：Chinese nonopening cutoff is before198-12; Wiki is <=199-12. Wiki’s scenario4 day0 branch explicitly requires both forces; Chinese opening alternative says only scenario4 day0. Wiki explicitly distinguishes scenario!=4 and excludes an associated Cao Cao/Yuan Shao relationship in its later branch; Chinese does not. Wiki enumerates regions, including its literal 陳陽 spelling; Chinese leaves region membership unstated.
- 状态（`status`）：未解决（`unresolved`）
- 比对依据（`reviewBasis`）：`fresh-source-comparison`
- 差异类别（`differenceType`）：`source-claim-difference`
- 关联来源（`sourceReferences`）：
  - 第 1 项：
    - 观察标识（`observationId`）：`atwiki-88-19`
    - 来源网址（`sourceURL`）：[https://w.atwiki.jp/sangokushi11/pages/88.html](https://w.atwiki.jp/sangokushi11/pages/88.html)
    - 来源章节（`sourceSection`）：`二強開戦-条件`
    - 来源行定位（`sourceLocator`）：
      - 起始行（`startLine`）：463
      - 结束行（`endLine`）：480
  - 第 2 项：
    - 观察标识（`observationId`）：`gamersky.two-powers-war`
    - 来源网址（`sourceURL`）：[https://www.gamersky.com/handbook/200809/124174_5.shtml](https://www.gamersky.com/handbook/200809/124174_5.shtml)
    - 来源章节（`sourceSection`）：`二强开战`

### 分歧 14：zhao-yun-duplicate

中文说明：Wiki保留两条独立观察：第一条无经过日数门槛、当前城市治安100；第二条经过≥30日、所属城市治安100。中文为经过≥30日、君主当前城市治安100；不以任一Wiki条目替换另一条。

- 分歧标识（`id`）：`zhao-yun-duplicate`
- 涉及事件（`eventIds`）：列表（按来源次序）：`zhao-yun-reunion`
- 观察标识列表（`observationIds`）：列表（按来源次序）：`atwiki-88-20`、`atwiki-88-22`、`gamersky.zhao-yun-reunion`
- 涉及字段（`fields`）：列表（按来源次序）：`conditions.elapsed-days`、`conditions.city-location-role`
- 来源差异说明（`description`）：Wiki has two distinct observations. First states no elapsed-days gate and current-city order100; second adds>=30 elapsed days and uses assigned-city order100. Chinese states>=30 days and ruler-current-city order100. Both Wiki observations remain separate; neither silently replaces the other.
- 状态（`status`）：未解决（`unresolved`）
- 比对依据（`reviewBasis`）：`fresh-source-comparison`
- 差异类别（`differenceType`）：`within-source-and-cross-source-variation`
- 关联来源（`sourceReferences`）：
  - 第 1 项：
    - 观察标识（`observationId`）：`atwiki-88-20`
    - 来源网址（`sourceURL`）：[https://w.atwiki.jp/sangokushi11/pages/88.html](https://w.atwiki.jp/sangokushi11/pages/88.html)
    - 来源章节（`sourceSection`）：`趙雲再会（趙雲仕官）`
    - 来源行定位（`sourceLocator`）：
      - 起始行（`startLine`）：481
      - 结束行（`endLine`）：494
  - 第 2 项：
    - 观察标识（`observationId`）：`atwiki-88-22`
    - 来源网址（`sourceURL`）：[https://w.atwiki.jp/sangokushi11/pages/88.html](https://w.atwiki.jp/sangokushi11/pages/88.html)
    - 来源章节（`sourceSection`）：`趙雲再会`
    - 来源行定位（`sourceLocator`）：
      - 起始行（`startLine`）：511
      - 结束行（`endLine`）：523
  - 第 3 项：
    - 观察标识（`observationId`）：`gamersky.zhao-yun-reunion`
    - 来源网址（`sourceURL`）：[https://www.gamersky.com/handbook/200809/124174_5.shtml](https://www.gamersky.com/handbook/200809/124174_5.shtml)
    - 来源章节（`sourceSection`）：`赵云再会`

### 分歧 15：sun-ce-death-duration

中文说明：中文给出预定死亡年/到200年的替代条件、于吉为舌战对手、胜利延寿20年、失败孙权继承；Wiki只给年份≥200、舌战、胜利延寿但不明数值、失败死亡，未说明对手或继承。

- 分歧标识（`id`）：`sun-ce-death-duration`
- 涉及事件（`eventIds`）：列表（按来源次序）：`sun-ce-death`
- 观察标识列表（`observationIds`）：列表（按来源次序）：`atwiki-88-24`、`gamersky.sun-ce-death`
- 涉及字段（`fields`）：列表（按来源次序）：`conditions.death-date`、`orderedResults.debate-participants`、`orderedResults.lifespan-duration`、`orderedResults.successor`
- 来源差异说明（`description`）：Chinese gives scheduled-death-year/arrival-of-200 alternatives, identifies Yu Ji as debate opponent, specifies20-year life extension and Sun Quan succession on defeat. Wiki simply gives year>=200, a debate, unspecified life extension on victory and death on defeat; opponent and succession are unstated.
- 状态（`status`）：未解决（`unresolved`）
- 比对依据（`reviewBasis`）：`fresh-source-comparison`
- 差异类别（`differenceType`）：`scope-and-source-omission`
- 关联来源（`sourceReferences`）：
  - 第 1 项：
    - 观察标识（`observationId`）：`atwiki-88-24`
    - 来源网址（`sourceURL`）：[https://w.atwiki.jp/sangokushi11/pages/88.html](https://w.atwiki.jp/sangokushi11/pages/88.html)
    - 来源章节（`sourceSection`）：`于吉の呪い（孫策の死）`
    - 来源行定位（`sourceLocator`）：
      - 起始行（`startLine`）：526
      - 结束行（`endLine`）：536
  - 第 2 项：
    - 观察标识（`observationId`）：`gamersky.sun-ce-death`
    - 来源网址（`sourceURL`）：[https://www.gamersky.com/handbook/200809/124174_6.shtml](https://www.gamersky.com/handbook/200809/124174_6.shtml)
    - 来源章节（`sourceSection`）：`孙策之死`

### 分歧 16：zhuge-marriage-eligibility

中文说明：中文要求诸葛亮≥20岁、史实女性模式、黄月英已登场，并有在野/未发现/同势力分支；Wiki为诸葛亮在控制城市内，黄月英在控制城市内（允许从未仕官的在野）或未发现，未列年龄/模式/登场条件，控制势力也未明确。中文列结婚招募和数值，Wiki无结果。

- 分歧标识（`id`）：`zhuge-marriage-eligibility`
- 涉及事件（`eventIds`）：列表（按来源次序）：`marry-zhuge-liang`
- 观察标识列表（`observationIds`）：列表（按来源次序）：`atwiki-88-25`、`gamersky.marry-zhuge-liang`
- 涉及字段（`fields`）：列表（按来源次序）：`conditions.age`、`conditions.character-type`、`conditions.debut`、`conditions.location`、`orderedResults`
- 来源差异说明（`description`）：Chinese requires Zhuge Liang age>=20, historical-female mode and Huang Yueying debuted, with free/undiscovered/same-force alternatives. Wiki instead states Zhuge Liang in controlled cities and Huang Yueying in controlled cities (never-served free allowed) or undiscovered, without those age/mode/debut gates. Wiki’s controlling force is implicit. Chinese describes marriage, recruitment and loyalty/merit; Wiki describes no outcomes.
- 状态（`status`）：未解决（`unresolved`）
- 比对依据（`reviewBasis`）：`fresh-source-comparison`
- 差异类别（`differenceType`）：`scope-and-source-omission`
- 关联来源（`sourceReferences`）：
  - 第 1 项：
    - 观察标识（`observationId`）：`atwiki-88-25`
    - 来源网址（`sourceURL`）：[https://w.atwiki.jp/sangokushi11/pages/88.html](https://w.atwiki.jp/sangokushi11/pages/88.html)
    - 来源章节（`sourceSection`）：`孔明の嫁とり`
    - 来源行定位（`sourceLocator`）：
      - 起始行（`startLine`）：537
      - 结束行（`endLine`）：545
  - 第 2 项：
    - 观察标识（`observationId`）：`gamersky.marry-zhuge-liang`
    - 来源网址（`sourceURL`）：[https://www.gamersky.com/handbook/200809/124174_6.shtml](https://www.gamersky.com/handbook/200809/124174_6.shtml)
    - 来源章节（`sourceSection`）：`诸葛亮结婚`

### 分歧 17：gan-ning-loyalty

中文说明：中文甘宁忠诚<90；Wiki≤95，并明确排除玩家君主仕官禁止、允许其属于另一个玩家控制势力。中文要求至少一个相邻城市；Wiki只述势力相邻。

- 分歧标识（`id`）：`gan-ning-loyalty`
- 涉及事件（`eventIds`）：列表（按来源次序）：`gan-ning-defects`
- 观察标识列表（`observationIds`）：列表（按来源次序）：`atwiki-88-26`、`gamersky.gan-ning-defects`
- 涉及字段（`fields`）：列表（按来源次序）：`conditions.loyalty`、`conditions.prohibited-ruler`、`conditions.other-player-force`、`conditions.adjacency`
- 来源差异说明（`description`）：Chinese loyalty<90 differs from Wiki<=95. Wiki explicitly excludes employment prohibition by the player ruler and permits Gan Ning in another player-controlled force; Chinese omits those clarifications. Chinese specifies at least one adjacent city; Wiki states force adjacency without that granularity.
- 状态（`status`）：未解决（`unresolved`）
- 比对依据（`reviewBasis`）：`fresh-source-comparison`
- 差异类别（`differenceType`）：`source-claim-difference`
- 关联来源（`sourceReferences`）：
  - 第 1 项：
    - 观察标识（`observationId`）：`atwiki-88-26`
    - 来源网址（`sourceURL`）：[https://w.atwiki.jp/sangokushi11/pages/88.html](https://w.atwiki.jp/sangokushi11/pages/88.html)
    - 来源章节（`sourceSection`）：`甘寧亡命`
    - 来源行定位（`sourceLocator`）：
      - 起始行（`startLine`）：546
      - 结束行（`endLine`）：564
  - 第 2 项：
    - 观察标识（`observationId`）：`gamersky.gan-ning-defects`
    - 来源网址（`sourceURL`）：[https://www.gamersky.com/handbook/200809/124174_6.shtml](https://www.gamersky.com/handbook/200809/124174_6.shtml)
    - 来源章节（`sourceSection`）：`甘宁逃命`

### 分歧 18：southern-campaign-region

中文说明：中文排除新野与吴地五城；Wiki的广义江东还排除江夏、襄阳、江陵、长沙、武陵、桂阳、零陵，并明确含“陳陽”的地区清单。中文为四城持有者至少一人与曹操非同盟，结果至少一个此类持有者友好度大降；Wiki条件措辞不同且无结果块。

- 分歧标识（`id`）：`southern-campaign-region`
- 涉及事件（`eventIds`）：列表（按来源次序）：`cao-cao-southern-campaign`
- 观察标识列表（`observationIds`）：列表（按来源次序）：`atwiki-88-28`、`gamersky.cao-cao-southern-campaign`
- 涉及字段（`fields`）：列表（按来源次序）：`conditions.excluded-cities`、`conditions.regional-membership`、`conditions.diplomatic-quantifier`、`orderedResults`
- 来源差异说明（`description`）：Chinese excludes Xinye plus five Wu cities; Wiki additionally excludes Jiangxia, Xiangyang, Jiangling, Changsha, Wuling, Guiyang and Lingling in its broad Jiangdong definition. Wiki explicitly enumerates its regions, including 陳陽. Chinese requires at least one owner of one of four named cities not allied to Cao Cao; Wiki wording covers forces owning any listed city. Chinese describes a large friendship fall with at least one such owner; Wiki has no outcome block.
- 状态（`status`）：未解决（`unresolved`）
- 比对依据（`reviewBasis`）：`fresh-source-comparison`
- 差异类别（`differenceType`）：`scope-quantifier-and-omission`
- 关联来源（`sourceReferences`）：
  - 第 1 项：
    - 观察标识（`observationId`）：`atwiki-88-28`
    - 来源网址（`sourceURL`）：[https://w.atwiki.jp/sangokushi11/pages/88.html](https://w.atwiki.jp/sangokushi11/pages/88.html)
    - 来源章节（`sourceSection`）：`曹操の南征`
    - 来源行定位（`sourceLocator`）：
      - 起始行（`startLine`）：566
      - 结束行（`endLine`）：580
  - 第 2 项：
    - 观察标识（`observationId`）：`gamersky.cao-cao-southern-campaign`
    - 来源网址（`sourceURL`）：[https://www.gamersky.com/handbook/200809/124174_7.shtml](https://www.gamersky.com/handbook/200809/124174_7.shtml)
    - 来源章节（`sourceSection`）：`曹操之南征`

### 分歧 19：ma-brothers-gates

中文说明：中文增江陵、玩家与伊籍同城、伊籍忠诚>95及伊籍无任务；Wiki用忠诚≥90、君主所属城治安100、玩家与伊籍行动均未用，不列上述城市/同城门槛。中文也列马谡双向厌恶，Wiki只列马良/伊籍。

- 分歧标识（`id`）：`ma-brothers-gates`
- 涉及事件（`eventIds`）：列表（按来源次序）：`recommend-ma-brothers`
- 观察标识列表（`observationIds`）：列表（按来源次序）：`atwiki-88-30`、`gamersky.recommend-ma-brothers`
- 涉及字段（`fields`）：列表（按来源次序）：`conditions.city-ownership`、`conditions.colocation`、`conditions.loyalty`、`conditions.public-order`、`conditions.action-used`、`conditions.mission`、`conditions.dislikes`
- 来源差异说明（`description`）：Chinese adds Jiangling ownership, player/Yi Ji same city, Yi Ji loyalty>95 and Yi Ji off mission. Wiki uses Yi Ji loyalty>=90, ruler assigned-city order100, and player/Yi Ji both action-unused, without the city-ownership/colocation gates. Chinese states both directional dislikes for Ma Su as well; Wiki states them for Ma Liang/Yi Ji but not Ma Su.
- 状态（`status`）：未解决（`unresolved`）
- 比对依据（`reviewBasis`）：`fresh-source-comparison`
- 差异类别（`differenceType`）：`source-claim-difference`
- 关联来源（`sourceReferences`）：
  - 第 1 项：
    - 观察标识（`observationId`）：`atwiki-88-30`
    - 来源网址（`sourceURL`）：[https://w.atwiki.jp/sangokushi11/pages/88.html](https://w.atwiki.jp/sangokushi11/pages/88.html)
    - 来源章节（`sourceSection`）：`馬氏の五常`
    - 来源行定位（`sourceLocator`）：
      - 起始行（`startLine`）：594
      - 结束行（`endLine`）：623
  - 第 2 项：
    - 观察标识（`observationId`）：`gamersky.recommend-ma-brothers`
    - 来源网址（`sourceURL`）：[https://www.gamersky.com/handbook/200809/124174_8.shtml](https://www.gamersky.com/handbook/200809/124174_8.shtml)
    - 来源章节（`sourceSection`）：`马氏五常`

### 分歧 20：sun-shang-xiang-setting

中文说明：中文把史实女性模式设为触发条件，孙家君主为孙坚/孙策/孙权；Wiki为孙坚或其任何血亲，仅招募/功绩/忠诚结果受史实人物模式限制。忠诚与功绩的来源描述顺序不同，不能当作执行次序。

- 分歧标识（`id`）：`sun-shang-xiang-setting`
- 涉及事件（`eventIds`）：列表（按来源次序）：`marry-sun-shang-xiang`
- 观察标识列表（`observationIds`）：列表（按来源次序）：`atwiki-88-31`、`gamersky.marry-sun-shang-xiang`
- 涉及字段（`fields`）：列表（按来源次序）：`conditions.character-type`、`conditions.sun-family-ruler`、`orderedResults.character-branch`、`orderedResults.order`
- 来源差异说明（`description`）：Chinese historical-female mode is a trigger and lists Sun Jian/Sun Ce/Sun Quan in its Sun-family ruler scope. Wiki admits Sun Jian or any Sun Jian blood relative and applies historical-character mode only to recruitment/merit/loyalty outcomes. Chinese combined result describes loyalty before merit; Wiki lists merit then loyalty. Source ordering only is preserved.
- 状态（`status`）：未解决（`unresolved`）
- 比对依据（`reviewBasis`）：`fresh-source-comparison`
- 差异类别（`differenceType`）：`source-claim-difference`
- 关联来源（`sourceReferences`）：
  - 第 1 项：
    - 观察标识（`observationId`）：`atwiki-88-31`
    - 来源网址（`sourceURL`）：[https://w.atwiki.jp/sangokushi11/pages/88.html](https://w.atwiki.jp/sangokushi11/pages/88.html)
    - 来源章节（`sourceSection`）：`孫尚香の結婚`
    - 来源行定位（`sourceLocator`）：
      - 起始行（`startLine`）：624
      - 结束行（`endLine`）：643
  - 第 2 项：
    - 观察标识（`observationId`）：`gamersky.marry-sun-shang-xiang`
    - 来源网址（`sourceURL`）：[https://www.gamersky.com/handbook/200809/124174_8.shtml](https://www.gamersky.com/handbook/200809/124174_8.shtml)
    - 来源章节（`sourceSection`）：`孙尚香结婚`

### 分歧 21：lu-meng-edition

中文说明：中文要求玩家孙权、智力<75、忠诚>95、功绩>5000；Wiki孙权为君主、智力≤70、忠诚≥95、功绩≥5000。中文无版本限定地给91/89/78及头像变化；Wiki保留该未限定组及明确PK的89/82/72，仅新数值更高时提升且头像未变时才更改。不推定平台。

- 分歧标识（`id`）：`lu-meng-edition`
- 涉及事件（`eventIds`）：列表（按来源次序）：`lu-meng-studies`
- 观察标识列表（`observationIds`）：列表（按来源次序）：`atwiki-88-32`、`gamersky.lu-meng-studies`
- 涉及字段（`fields`）：列表（按来源次序）：`conditions.controller`、`conditions.intelligence`、`conditions.loyalty`、`conditions.merit`、`orderedResults.version`、`orderedResults.raise-only`、`orderedResults.portrait`
- 来源差异说明（`description`）：Chinese requires player Sun Quan, intelligence<75, loyalty>95 and merit>5000. Wiki requires Sun Quan ruler, intelligence<=70, loyalty>=95 and merit>=5000. Chinese has unqualified 91/89/78 Lu Meng stats and unconditional portrait wording; Wiki keeps an unqualified block with those values and explicit PK89/82/72, raises stats only if higher, and changes portrait only if not changed. Neither guide’s unspecified platform is inferred.
- 状态（`status`）：未解决（`unresolved`）
- 比对依据（`reviewBasis`）：`fresh-source-comparison`
- 差异类别（`differenceType`）：`source-claim-difference`
- 关联来源（`sourceReferences`）：
  - 第 1 项：
    - 观察标识（`observationId`）：`atwiki-88-32`
    - 来源网址（`sourceURL`）：[https://w.atwiki.jp/sangokushi11/pages/88.html](https://w.atwiki.jp/sangokushi11/pages/88.html)
    - 来源章节（`sourceSection`）：`呉下の阿蒙にあらず`
    - 来源行定位（`sourceLocator`）：
      - 起始行（`startLine`）：644
      - 结束行（`endLine`）：661
  - 第 2 项：
    - 观察标识（`observationId`）：`gamersky.lu-meng-studies`
    - 来源网址（`sourceURL`）：[https://www.gamersky.com/handbook/200809/124174_9.shtml](https://www.gamersky.com/handbook/200809/124174_9.shtml)
    - 来源章节（`sourceSection`）：`吴下阿蒙`

### 分歧 22：zhou-yu-merit-equality

中文说明：中文把鲁肃是部下作为触发条件；Wiki仅把其存在作为结果保护条件，并要求周瑜普通身份。中文只定义功绩较低/较高，不定义相等；Wiki明确鲁肃功绩≥周瑜时加2000。

- 分歧标识（`id`）：`zhou-yu-merit-equality`
- 涉及事件（`eventIds`）：列表（按来源次序）：`zhou-yu-death`
- 观察标识列表（`observationIds`）：列表（按来源次序）：`atwiki-88-33`、`gamersky.zhou-yu-death`
- 涉及字段（`fields`）：列表（按来源次序）：`conditions.lu-su-membership`、`conditions.status`、`orderedResults.lu-su-guard`、`orderedResults.merit-equality`
- 来源差异说明（`description`）：Chinese requires Lu Su as a subordinate in the trigger; Wiki makes his presence only a result guard and additionally requires Zhou Yu ordinary status. Chinese defines lower and higher merit cases but leaves equality unstated; Wiki explicitly gives+2000 when Lu Su merit>=Zhou Yu merit. No equality outcome is invented for Chinese.
- 状态（`status`）：未解决（`unresolved`）
- 比对依据（`reviewBasis`）：`fresh-source-comparison`
- 差异类别（`differenceType`）：`source-claim-difference`
- 关联来源（`sourceReferences`）：
  - 第 1 项：
    - 观察标识（`observationId`）：`atwiki-88-33`
    - 来源网址（`sourceURL`）：[https://w.atwiki.jp/sangokushi11/pages/88.html](https://w.atwiki.jp/sangokushi11/pages/88.html)
    - 来源章节（`sourceSection`）：`周瑜の死`
    - 来源行定位（`sourceLocator`）：
      - 起始行（`startLine`）：662
      - 结束行（`endLine`）：675
  - 第 2 项：
    - 观察标识（`observationId`）：`gamersky.zhou-yu-death`
    - 来源网址（`sourceURL`）：[https://www.gamersky.com/handbook/200809/124174_9.shtml](https://www.gamersky.com/handbook/200809/124174_9.shtml)
    - 来源章节（`sourceSection`）：`周瑜之死`

### 分歧 23：cao-cao-death-gates

中文说明：Wiki要求许昌、洛阳、长安、邺；中文只列后三城，另有玩家曹操、曹操与继承人均无任务。Wiki不列这两门槛，并明确地区城市成员；不扩写中文未列的地区成员。

- 分歧标识（`id`）：`cao-cao-death-gates`
- 涉及事件（`eventIds`）：列表（按来源次序）：`cao-cao-death`
- 观察标识列表（`observationIds`）：列表（按来源次序）：`atwiki-88-34`、`gamersky.cao-cao-death`
- 涉及字段（`fields`）：列表（按来源次序）：`conditions.xuchang`、`conditions.controller`、`conditions.mission`、`conditions.regional-membership`
- 来源差异说明（`description`）：Wiki explicitly requires Xuchang alongside Luoyang/Chang’an/Ye; Chinese lists only the latter three. Chinese requires player Cao Cao and Cao Cao/successor off mission; Wiki does not state either gate. Wiki enumerates regional city members; Chinese region names remain unexpanded.
- 状态（`status`）：未解决（`unresolved`）
- 比对依据（`reviewBasis`）：`fresh-source-comparison`
- 差异类别（`differenceType`）：`source-claim-difference`
- 关联来源（`sourceReferences`）：
  - 第 1 项：
    - 观察标识（`observationId`）：`atwiki-88-34`
    - 来源网址（`sourceURL`）：[https://w.atwiki.jp/sangokushi11/pages/88.html](https://w.atwiki.jp/sangokushi11/pages/88.html)
    - 来源章节（`sourceSection`）：`曹操の死`
    - 来源行定位（`sourceLocator`）：
      - 起始行（`startLine`）：676
      - 结束行（`endLine`）：699
  - 第 2 项：
    - 观察标识（`observationId`）：`gamersky.cao-cao-death`
    - 来源网址（`sourceURL`）：[https://www.gamersky.com/handbook/200809/124174_9.shtml](https://www.gamersky.com/handbook/200809/124174_9.shtml)
    - 来源章节（`sourceSection`）：`曹操之死`

### 分歧 24：hanzhong-diplomacy

中文说明：Wiki要求后汉皇帝存在，未另述存活；中文无该存在条件且要求玩家刘备。中文外交结果分列，部分双向；Wiki为非同盟AND低于好意AND曹操/曹氏血亲/拥立皇帝组。功绩与忠诚叙述顺序不同，中文“江洲”、Wiki“江州”保留。

- 分歧标识（`id`）：`hanzhong-diplomacy`
- 涉及事件（`eventIds`）：列表（按来源次序）：`liu-bei-hanzhong-king`
- 观察标识列表（`observationIds`）：列表（按来源次序）：`atwiki-88-35`、`gamersky.liu-bei-hanzhong-king`
- 涉及字段（`fields`）：列表（按来源次序）：`conditions.emperor-exists`、`conditions.controller`、`orderedResults.diplomacy-selectors`、`orderedResults.order`、`conditions.city-spelling`
- 来源差异说明（`description`）：Wiki requires the Later Han emperor to exist, not an independently stated alive predicate; Chinese has no existence gate and requires player Liu Bei. Chinese gives separate nonallied/below-goodwill/named-force diplomacy lines, some mutual; Wiki applies nonallied AND below-goodwill AND the Cao/Cao-relative/emperor-supporter group. Chinese lists strategist merit before officer loyalty, Wiki the reverse. Chinese 江洲 versus Wiki 江州 remains source spelling.
- 状态（`status`）：未解决（`unresolved`）
- 比对依据（`reviewBasis`）：`fresh-source-comparison`
- 差异类别（`differenceType`）：`scope-order-and-omission`
- 关联来源（`sourceReferences`）：
  - 第 1 项：
    - 观察标识（`observationId`）：`atwiki-88-35`
    - 来源网址（`sourceURL`）：[https://w.atwiki.jp/sangokushi11/pages/88.html](https://w.atwiki.jp/sangokushi11/pages/88.html)
    - 来源章节（`sourceSection`）：`漢中王即位`
    - 来源行定位（`sourceLocator`）：
      - 起始行（`startLine`）：700
      - 结束行（`endLine`）：727
  - 第 2 项：
    - 观察标识（`observationId`）：`gamersky.liu-bei-hanzhong-king`
    - 来源网址（`sourceURL`）：[https://www.gamersky.com/handbook/200809/124174_9.shtml](https://www.gamersky.com/handbook/200809/124174_9.shtml)
    - 来源章节（`sourceSection`）：`汉中王即位`

### 分歧 25：wei-accession-choice

中文说明：中文为无任务、排除所有其他魏国、无显式玩家选择；Wiki为行动未用、排除电脑魏国、玩家选择/电脑接受。中文改爵位国号后明示皇帝死亡；Wiki先移除皇帝而未写死亡。武将+20适用汉室态度不同；外交名单/相性或血缘和逻辑组合不同。Wiki缩进使奖金/外交作用范围有歧义，保持未决。

- 分歧标识（`id`）：`wei-accession-choice`
- 涉及事件（`eventIds`）：列表（按来源次序）：`wei-emperor-accession`
- 观察标识列表（`observationIds`）：列表（按来源次序）：`atwiki-88-36`、`gamersky.wei-emperor-accession`
- 涉及字段（`fields`）：列表（按来源次序）：`conditions.action-used`、`conditions.mission`、`conditions.country-name-scope`、`orderedResults.choice`、`orderedResults.emperor-removal`、`orderedResults.loyalty-scope`、`orderedResults.diplomacy-selectors`、`orderedResults.outdented-scope`
- 来源差异说明（`description`）：Chinese requires off mission, excludes all other Wei-named forces, and describes accession without an explicit player choice. Wiki requires action-unused, excludes COM Wei forces, and states player choice/COM acceptance. Chinese explicitly kills the emperor after title/name changes; Wiki removes the emperor before title/name changes without saying death. Chinese +20 applies to non-Han-valuing officers; Wiki says Han-ignoring officers only. Chinese diplomacy is separately listed and includes Liu Bei/compatibility; Wiki uses an AND selector and blood relatives. Wiki bonus/diplomacy scope is ambiguous because its source outdents those lines; no canonical scope is selected.
- 状态（`status`）：未解决（`unresolved`）
- 比对依据（`reviewBasis`）：`fresh-source-comparison`
- 差异类别（`differenceType`）：`source-claim-difference`
- 关联来源（`sourceReferences`）：
  - 第 1 项：
    - 观察标识（`observationId`）：`atwiki-88-36`
    - 来源网址（`sourceURL`）：[https://w.atwiki.jp/sangokushi11/pages/88.html](https://w.atwiki.jp/sangokushi11/pages/88.html)
    - 来源章节（`sourceSection`）：`魏帝即位`
    - 来源行定位（`sourceLocator`）：
      - 起始行（`startLine`）：728
      - 结束行（`endLine`）：761
  - 第 2 项：
    - 观察标识（`observationId`）：`gamersky.wei-emperor-accession`
    - 来源网址（`sourceURL`）：[https://www.gamersky.com/handbook/200809/124174_10.shtml](https://www.gamersky.com/handbook/200809/124174_10.shtml)
    - 来源章节（`sourceSection`）：`魏帝即位`

### 分歧 26：shu-accession-rank

中文说明：中文要求刘家势力王位；Wiki明写皇帝爵位且结果仍设皇帝，不纠正。相性/血缘、有缘关系、对曹非同盟、电脑蜀国排除、皇帝死亡/不存在及外交分组分别保留。两源均说魏帝事件可能提前日期，却未提供替代阈值。

- 分歧标识（`id`）：`shu-accession-rank`
- 涉及事件（`eventIds`）：列表（按来源次序）：`shu-emperor-accession`
- 观察标识列表（`observationIds`）：列表（按来源次序）：`atwiki-88-37`、`gamersky.shu-emperor-accession`
- 涉及字段（`fields`）：列表（按来源次序）：`conditions.rank`、`conditions.family-relation`、`conditions.ruler-relation`、`conditions.alliance`、`conditions.country-name-scope`、`conditions.emperor-state`、`orderedResults.diplomacy-selectors`
- 来源差异说明（`description`）：Chinese requires Liu-family king rank; Wiki explicitly says emperor rank and still sets emperor in results. Chinese Liu Bei-or-close-compatibility differs from Wiki Liu Bei-or-blood-relation; cross-ruler not-close-compatibility differs from no-associated-relationship. Chinese adds nonalliance with Cao family; Wiki adds no COM Shu-named force. Chinese says emperor dead while Wiki says absent. Chinese diplomacy lines are separate; Wiki groups them conjunctively. Both sources say Wei may accelerate timing without replacement thresholds, a shared unresolved fact rather than an additional numeric difference.
- 状态（`status`）：未解决（`unresolved`）
- 比对依据（`reviewBasis`）：`fresh-source-comparison`
- 差异类别（`differenceType`）：`source-claim-difference`
- 关联来源（`sourceReferences`）：
  - 第 1 项：
    - 观察标识（`observationId`）：`atwiki-88-37`
    - 来源网址（`sourceURL`）：[https://w.atwiki.jp/sangokushi11/pages/88.html](https://w.atwiki.jp/sangokushi11/pages/88.html)
    - 来源章节（`sourceSection`）：`蜀帝即位`
    - 来源行定位（`sourceLocator`）：
      - 起始行（`startLine`）：762
      - 结束行（`endLine`）：799
  - 第 2 项：
    - 观察标识（`observationId`）：`gamersky.shu-emperor-accession`
    - 来源网址（`sourceURL`）：[https://www.gamersky.com/handbook/200809/124174_10.shtml](https://www.gamersky.com/handbook/200809/124174_10.shtml)
    - 来源章节（`sourceSection`）：`蜀帝即位`

### 分歧 27：tiger-sons-platform

中文说明：中文功绩>8000、君主为刘备或相性接近者；Wiki≥8000、刘备或血亲，并保留主机版可能≥3000的疑问。中文无条件要求三人同城；Wiki只在刘家为玩家势力时要求张苞/关兴同所属据点。

- 分歧标识（`id`）：`tiger-sons-platform`
- 涉及事件（`eventIds`）：列表（按来源次序）：`sons-of-tigers-oath`
- 观察标识列表（`observationIds`）：列表（按来源次序）：`atwiki-88-38`、`gamersky.sons-of-tigers-oath`
- 涉及字段（`fields`）：列表（按来源次序）：`conditions.merit`、`conditions.platform`、`conditions.ruler-relation`、`conditions.colocation`、`conditions.controller`
- 来源差异说明（`description`）：Chinese requires merit>8000 and a Liu Bei-or-compatible ruler; Wiki uses>=8000 and Liu Bei-or-blood-relative, plus tentative console>=3000. Chinese colocates ruler and both officers in the same city unconditionally. Wiki requires only Zhang Bao/Guan Xing same assigned base and only when the Liu force is player controlled. Console3000 remains a question, not a confirmed replacement.
- 状态（`status`）：未解决（`unresolved`）
- 比对依据（`reviewBasis`）：`fresh-source-comparison`
- 差异类别（`differenceType`）：`source-claim-difference`
- 关联来源（`sourceReferences`）：
  - 第 1 项：
    - 观察标识（`observationId`）：`atwiki-88-38`
    - 来源网址（`sourceURL`）：[https://w.atwiki.jp/sangokushi11/pages/88.html](https://w.atwiki.jp/sangokushi11/pages/88.html)
    - 来源章节（`sourceSection`）：`虎の子（張苞・関興義兄弟の契り）`
    - 来源行定位（`sourceLocator`）：
      - 起始行（`startLine`）：800
      - 结束行（`endLine`）：818
  - 第 2 项：
    - 观察标识（`observationId`）：`gamersky.sons-of-tigers-oath`
    - 来源网址（`sourceURL`）：[https://www.gamersky.com/handbook/200809/124174_11.shtml](https://www.gamersky.com/handbook/200809/124174_11.shtml)
    - 来源章节（`sourceSection`）：`虎之子`

### 分歧 28：wu-king-timing

中文说明：中文日期OR对截止月/经过日数的作用范围未决；Wiki要求截止≤221年12月且剧本≥180日，只有魏帝已发生时再要求距魏帝≥180日。孙坚本人/血亲范围、外交分列与AND及曹家排除不同，不能互相裁定。

- 分歧标识（`id`）：`wu-king-timing`
- 涉及事件（`eventIds`）：列表（按来源次序）：`wu-king-accession`
- 观察标识列表（`observationIds`）：列表（按来源次序）：`atwiki-88-39`、`gamersky.wu-king-accession`
- 涉及字段（`fields`）：列表（按来源次序）：`conditions.date-clause`、`conditions.prior-event-delay`、`conditions.sun-family-ruler`、`orderedResults.diplomacy-selectors`
- 来源差异说明（`description`）：Chinese has a date OR whose scope over cutoff/elapsed-days is unresolved. Wiki requires cutoff<=221-12 and>=180 scenario days, then additionally>=180 days since Wei accession only if Wei occurred. Chinese explicitly allows Sun Jian as well as his blood relatives; Wiki says related-to-Sun-Jian. Chinese diplomacy uses separate filters and includes all emperor forces/compatible Liu rulers; Wiki has AND filters and excludes Cao family from the emperor alternative. No guide resolves the other’s runtime rule.
- 状态（`status`）：未解决（`unresolved`）
- 比对依据（`reviewBasis`）：`fresh-source-comparison`
- 差异类别（`differenceType`）：`grouping-and-scope-difference`
- 关联来源（`sourceReferences`）：
  - 第 1 项：
    - 观察标识（`observationId`）：`atwiki-88-39`
    - 来源网址（`sourceURL`）：[https://w.atwiki.jp/sangokushi11/pages/88.html](https://w.atwiki.jp/sangokushi11/pages/88.html)
    - 来源章节（`sourceSection`）：`呉王即位`
    - 来源行定位（`sourceLocator`）：
      - 起始行（`startLine`）：819
      - 结束行（`endLine`）：857
  - 第 2 项：
    - 观察标识（`observationId`）：`gamersky.wu-king-accession`
    - 来源网址（`sourceURL`）：[https://www.gamersky.com/handbook/200809/124174_11.shtml](https://www.gamersky.com/handbook/200809/124174_11.shtml)
    - 来源章节（`sourceSection`）：`吴王即位`

### 分歧 29：lu-xun-merit

中文说明：中文功绩增加12000；Wiki设为12000。中文玩家孙权、忠诚>95、普通身份；Wiki孙权势力、忠诚≥95、非军师。中文区间端点未定，Wiki保留3000–15000。中文同时写吕蒙已死又与孙权/蒋钦同城，内部矛盾保留；目的地当前城/所属城不同。至少10部下两源相同。

- 分歧标识（`id`）：`lu-xun-merit`
- 涉及事件（`eventIds`）：列表（按来源次序）：`lu-xun-arrives`
- 观察标识列表（`observationIds`）：列表（按来源次序）：`atwiki-88-40`、`gamersky.lu-xun-arrives`
- 涉及字段（`fields`）：列表（按来源次序）：`conditions.controller`、`conditions.loyalty`、`conditions.status`、`conditions.merit-range`、`conditions.colocation`、`orderedResults.merit`、`orderedResults.destination`
- 来源差异说明（`description`）：Chinese explicitly adds12000 merit; Wiki sets merit to12000. Chinese requires player Sun Quan, loyalty>95 and ordinary status; Wiki has Sun Quan force, loyalty>=95 and status!=strategist. Chinese range endpoints are unspecified; Wiki range notation is preserved as3000–15000. Chinese simultaneously says Lu Meng dead and Sun Quan/Lu Meng/Jiang Qin same city, an internal contradiction absent from Wiki. Chinese destination is ruler current city; Wiki assigned city. Both list at least10 subordinates, so that is not retained as a numeric disagreement.
- 状态（`status`）：未解决（`unresolved`）
- 比对依据（`reviewBasis`）：`fresh-source-comparison`
- 差异类别（`differenceType`）：`source-claim-difference`
- 关联来源（`sourceReferences`）：
  - 第 1 项：
    - 观察标识（`observationId`）：`atwiki-88-40`
    - 来源网址（`sourceURL`）：[https://w.atwiki.jp/sangokushi11/pages/88.html](https://w.atwiki.jp/sangokushi11/pages/88.html)
    - 来源章节（`sourceSection`）：`陸遜登場`
    - 来源行定位（`sourceLocator`）：
      - 起始行（`startLine`）：858
      - 结束行（`endLine`）：880
  - 第 2 项：
    - 观察标识（`observationId`）：`gamersky.lu-xun-arrives`
    - 来源网址（`sourceURL`）：[https://www.gamersky.com/handbook/200809/124174_11.shtml](https://www.gamersky.com/handbook/200809/124174_11.shtml)
    - 来源章节（`sourceSection`）：`陆逊登场`

### 分歧 30：northern-campaign-order

中文说明：中文有“成都/汉中治安+15”的异常条件；Wiki明确治安≥95。君主相性/血缘、敌方不合相性/无有缘、死亡时间未到/死亡年234未到都不同。中文“永安/江洲”、Wiki“永案/江州”保留。

- 分歧标识（`id`）：`northern-campaign-order`
- 涉及事件（`eventIds`）：列表（按来源次序）：`zhuge-liang-northern-campaign`
- 观察标识列表（`observationIds`）：列表（按来源次序）：`atwiki-88-41`、`gamersky.zhuge-liang-northern-campaign`
- 涉及字段（`fields`）：列表（按来源次序）：`conditions.public-order`、`conditions.ruler-relation`、`conditions.death-timing`、`conditions.place-spelling`
- 来源差异说明（`description`）：Chinese contains malformed condition Chengdu/Hanzhong order+15; Wiki explicitly requires order>=95. Chinese Liu Bei-or-compatible ruler and not-compatible opponent differ from Wiki Liu Bei-blood-relative ruler and no-associated-relationship. Chinese says death time not yet arrived; Wiki says scheduled-death year234 not reached. Chinese 永安/江洲 versus Wiki 永案/江州 are preserved without correcting one from the other.
- 状态（`status`）：未解决（`unresolved`）
- 比对依据（`reviewBasis`）：`fresh-source-comparison`
- 差异类别（`differenceType`）：`source-claim-difference`
- 关联来源（`sourceReferences`）：
  - 第 1 项：
    - 观察标识（`observationId`）：`atwiki-88-41`
    - 来源网址（`sourceURL`）：[https://w.atwiki.jp/sangokushi11/pages/88.html](https://w.atwiki.jp/sangokushi11/pages/88.html)
    - 来源章节（`sourceSection`）：`諸葛亮の北伐`
    - 来源行定位（`sourceLocator`）：
      - 起始行（`startLine`）：881
      - 结束行（`endLine`）：901
  - 第 2 项：
    - 观察标识（`observationId`）：`gamersky.zhuge-liang-northern-campaign`
    - 来源网址（`sourceURL`）：[https://www.gamersky.com/handbook/200809/124174_12.shtml](https://www.gamersky.com/handbook/200809/124174_12.shtml)
    - 来源章节（`sourceSection`）：`诸葛亮北伐`

### 分歧 31：wu-emperor-prerequisite

中文说明：中文第12页标题重复“吴王”，结果为皇帝与国号吴，事件标识因此为吴帝；其未决日期OR指距魏帝≥360日。Wiki基准日期/经过条件之外，只在吴王事件已发生时要求距吴王≥360日。孙坚范围、电脑吴国排除及外交分组也不同。

- 分歧标识（`id`）：`wu-emperor-prerequisite`
- 涉及事件（`eventIds`）：列表（按来源次序）：`wu-emperor-accession`
- 观察标识列表（`observationIds`）：列表（按来源次序）：`atwiki-88-42`、`gamersky.wu-emperor-accession`
- 涉及字段（`fields`）：列表（按来源次序）：`sourceSection`、`conditions.date-clause`、`conditions.prior-event`、`conditions.sun-family-ruler`、`conditions.country-name-scope`、`orderedResults.diplomacy-selectors`
- 来源差异说明（`description`）：Chinese page12 repeats the heading Wu King although its result makes the ruler emperor and names Wu; this observation’s canonical identity is Wu Emperor. Chinese refers to>=360 days since Wei accession in an unresolved date OR. Wiki refers to>=360 days since Wu King accession only if that event occurred, in addition to baseline cutoff/elapsed gates. Chinese explicitly includes Sun Jian; Wiki blood-relative wording. Wiki adds a no-COM-Wu-name gate and conjunctive diplomacy; Chinese has no name gate and separate diplomacy lines. The prerequisite discrepancy remains unresolved.
- 状态（`status`）：未解决（`unresolved`）
- 比对依据（`reviewBasis`）：`fresh-source-comparison`
- 差异类别（`differenceType`）：`source-claim-difference`
- 关联来源（`sourceReferences`）：
  - 第 1 项：
    - 观察标识（`observationId`）：`atwiki-88-42`
    - 来源网址（`sourceURL`）：[https://w.atwiki.jp/sangokushi11/pages/88.html](https://w.atwiki.jp/sangokushi11/pages/88.html)
    - 来源章节（`sourceSection`）：`呉帝即位`
    - 来源行定位（`sourceLocator`）：
      - 起始行（`startLine`）：902
      - 结束行（`endLine`）：928
  - 第 2 项：
    - 观察标识（`observationId`）：`gamersky.wu-emperor-accession`
    - 来源网址（`sourceURL`）：[https://www.gamersky.com/handbook/200809/124174_12.shtml](https://www.gamersky.com/handbook/200809/124174_12.shtml)
    - 来源章节（`sourceSection`）：`吴王即位`

### 分歧 32：zhuge-death-equality

中文说明：中文预定死亡年到达，并在功绩/物品前明示死亡；Wiki为自然死亡及括注234，未另列死亡效果。中文军师非君主；Wiki军师。中文功绩相等未列结果，Wiki诸葛亮功绩≤姜维时加4000；不补分支或效果。

- 分歧标识（`id`）：`zhuge-death-equality`
- 涉及事件（`eventIds`）：列表（按来源次序）：`zhuge-liang-death`
- 观察标识列表（`observationIds`）：列表（按来源次序）：`atwiki-88-44`、`gamersky.zhuge-liang-death`
- 涉及字段（`fields`）：列表（按来源次序）：`conditions.death-trigger`、`conditions.status`、`orderedResults.explicit-death`、`orderedResults.merit-equality`
- 来源差异说明（`description`）：Chinese uses scheduled-death-year arrival and explicitly emits death before merit/item results; Wiki names natural death and its parenthetical234 but does not list death as a separate result. Chinese explicitly says strategist not ruler; Wiki says strategist. Chinese merit equality is unstated, while Wiki awards+4000 for Zhuge Liang merit<=Jiang Wei merit. No equality branch or death effect is imported into the opposite source.
- 状态（`status`）：未解决（`unresolved`）
- 比对依据（`reviewBasis`）：`fresh-source-comparison`
- 差异类别（`differenceType`）：`source-claim-difference`
- 关联来源（`sourceReferences`）：
  - 第 1 项：
    - 观察标识（`observationId`）：`atwiki-88-44`
    - 来源网址（`sourceURL`）：[https://w.atwiki.jp/sangokushi11/pages/88.html](https://w.atwiki.jp/sangokushi11/pages/88.html)
    - 来源章节（`sourceSection`）：`諸葛亮の死`
    - 来源行定位（`sourceLocator`）：
      - 起始行（`startLine`）：931
      - 结束行（`endLine`）：945
  - 第 2 项：
    - 观察标识（`observationId`）：`gamersky.zhuge-liang-death`
    - 来源网址（`sourceURL`）：[https://www.gamersky.com/handbook/200809/124174_12.shtml](https://www.gamersky.com/handbook/200809/124174_12.shtml)
    - 来源章节（`sourceSection`）：`诸葛亮之死`

### 分歧 33：opening-outcomes-unstated-vs-none

中文说明：中文明示开局事件无结果或变化；Wiki结果空白或缺失。未说明不能改写为明示无变化，也不推导结义/同盟机制。

- 分歧标识（`id`）：`opening-outcomes-unstated-vs-none`
- 涉及事件（`eventIds`）：列表（按来源次序）：`yellow-turban-uprising`、`peach-garden-oath`、`anti-dong-coalition`、`sun-ce-sortie`
- 观察标识列表（`observationIds`）：列表（按来源次序）：`atwiki-88-01`、`atwiki-88-02`、`atwiki-88-04`、`atwiki-88-13`、`gamersky.yellow-turban-uprising`、`gamersky.peach-garden-oath`、`gamersky.anti-dong-coalition`、`gamersky.sun-ce-sortie`
- 涉及字段（`fields`）：列表（按来源次序）：`orderedResults`
- 来源差异说明（`description`）：Chinese explicitly says no result/change in these opening sections; Wiki has empty or absent result blocks. not-stated is not promoted to no-described-change, and no oath/coalition mechanics are inferred.
- 状态（`status`）：未解决（`unresolved`）
- 比对依据（`reviewBasis`）：`fresh-source-comparison`
- 差异类别（`differenceType`）：`absence-versus-explicit-none`
- 关联来源（`sourceReferences`）：
  - 第 1 项：
    - 观察标识（`observationId`）：`atwiki-88-01`
    - 来源网址（`sourceURL`）：[https://w.atwiki.jp/sangokushi11/pages/88.html](https://w.atwiki.jp/sangokushi11/pages/88.html)
    - 来源章节（`sourceSection`）：`黄巾の乱`
    - 来源行定位（`sourceLocator`）：
      - 起始行（`startLine`）：126
      - 结束行（`endLine`）：132
  - 第 2 项：
    - 观察标识（`observationId`）：`atwiki-88-02`
    - 来源网址（`sourceURL`）：[https://w.atwiki.jp/sangokushi11/pages/88.html](https://w.atwiki.jp/sangokushi11/pages/88.html)
    - 来源章节（`sourceSection`）：`桃園の誓い`
    - 来源行定位（`sourceLocator`）：
      - 起始行（`startLine`）：133
      - 结束行（`endLine`）：141
  - 第 3 项：
    - 观察标识（`observationId`）：`atwiki-88-04`
    - 来源网址（`sourceURL`）：[https://w.atwiki.jp/sangokushi11/pages/88.html](https://w.atwiki.jp/sangokushi11/pages/88.html)
    - 来源章节（`sourceSection`）：`反董卓連合`
    - 来源行定位（`sourceLocator`）：
      - 起始行（`startLine`）：155
      - 结束行（`endLine`）：159
  - 第 4 项：
    - 观察标识（`observationId`）：`atwiki-88-13`
    - 来源网址（`sourceURL`）：[https://w.atwiki.jp/sangokushi11/pages/88.html](https://w.atwiki.jp/sangokushi11/pages/88.html)
    - 来源章节（`sourceSection`）：`孫策出陣`
    - 来源行定位（`sourceLocator`）：
      - 起始行（`startLine`）：345
      - 结束行（`endLine`）：351
  - 第 5 项：
    - 观察标识（`observationId`）：`gamersky.yellow-turban-uprising`
    - 来源网址（`sourceURL`）：[https://www.gamersky.com/handbook/200809/124174.shtml](https://www.gamersky.com/handbook/200809/124174.shtml)
    - 来源章节（`sourceSection`）：`黄巾之乱`
  - 第 6 项：
    - 观察标识（`observationId`）：`gamersky.peach-garden-oath`
    - 来源网址（`sourceURL`）：[https://www.gamersky.com/handbook/200809/124174.shtml](https://www.gamersky.com/handbook/200809/124174.shtml)
    - 来源章节（`sourceSection`）：`桃园结义`
  - 第 7 项：
    - 观察标识（`observationId`）：`gamersky.anti-dong-coalition`
    - 来源网址（`sourceURL`）：[https://www.gamersky.com/handbook/200809/124174.shtml](https://www.gamersky.com/handbook/200809/124174.shtml)
    - 来源章节（`sourceSection`）：`反董卓连盟`
  - 第 8 项：
    - 观察标识（`observationId`）：`gamersky.sun-ce-sortie`
    - 来源网址（`sourceURL`）：[https://www.gamersky.com/handbook/200809/124174_3.shtml](https://www.gamersky.com/handbook/200809/124174_3.shtml)
    - 来源章节（`sourceSection`）：`孙策出阵`

### 分歧 34：deposed-emperor-location

中文说明：中文明确新皇帝留在前任所在城市；Wiki只写死亡与身份替换，没有地点结果。

- 分歧标识（`id`）：`deposed-emperor-location`
- 涉及事件（`eventIds`）：列表（按来源次序）：`depose-shao-emperor`
- 观察标识列表（`observationIds`）：列表（按来源次序）：`atwiki-88-03`、`gamersky.depose-shao-emperor`
- 涉及字段（`fields`）：列表（按来源次序）：`orderedResults.emperor-location`
- 来源差异说明（`description`）：Chinese explicitly says the new emperor remains in the prior emperor’s city. Wiki only lists the death and identity replacement, with no location result.
- 状态（`status`）：未解决（`unresolved`）
- 比对依据（`reviewBasis`）：`fresh-source-comparison`
- 差异类别（`differenceType`）：`source-omission`
- 关联来源（`sourceReferences`）：
  - 第 1 项：
    - 观察标识（`observationId`）：`atwiki-88-03`
    - 来源网址（`sourceURL`）：[https://w.atwiki.jp/sangokushi11/pages/88.html](https://w.atwiki.jp/sangokushi11/pages/88.html)
    - 来源章节（`sourceSection`）：`少帝廃立`
    - 来源行定位（`sourceLocator`）：
      - 起始行（`startLine`）：142
      - 结束行（`endLine`）：154
  - 第 2 项：
    - 观察标识（`observationId`）：`gamersky.depose-shao-emperor`
    - 来源网址（`sourceURL`）：[https://www.gamersky.com/handbook/200809/124174.shtml](https://www.gamersky.com/handbook/200809/124174.shtml)
    - 来源章节（`sourceSection`）：`少帝废立`

### 分歧 35：recruitment-debut-and-prior-service

中文说明：中文为达到登场年龄、在野/未发现；Wiki为达到预定登场年、从未仕官的在野/未发现。年龄与年份、普通在野与从未仕官不得归一。

- 分歧标识（`id`）：`recruitment-debut-and-prior-service`
- 涉及事件（`eventIds`）：列表（按来源次序）：`recruit-dian-wei`、`recruit-xu-chu`、`recommend-guo-jia`、`recruit-sun-ce-five`、`recommend-two-zhangs`、`recruit-liu-bei-five`、`recommend-ma-brothers`
- 观察标识列表（`observationIds`）：列表（按来源次序）：`atwiki-88-08`、`atwiki-88-10`、`atwiki-88-11`、`atwiki-88-14`、`atwiki-88-15`、`atwiki-88-21`、`atwiki-88-30`、`gamersky.recruit-dian-wei`、`gamersky.recruit-xu-chu`、`gamersky.recommend-guo-jia`、`gamersky.recruit-sun-ce-five`、`gamersky.recommend-two-zhangs`、`gamersky.recruit-liu-bei-five`、`gamersky.recommend-ma-brothers`
- 涉及字段（`fields`）：列表（按来源次序）：`conditions.debut-basis`、`conditions.free-status`
- 来源差异说明（`description`）：Chinese says debut age reached and free/undiscovered. Wiki says scheduled debut year reached and never-served free/undiscovered. Age/year and general-free/never-served restrictions are preserved as different source predicates rather than normalized.
- 状态（`status`）：未解决（`unresolved`）
- 比对依据（`reviewBasis`）：`fresh-source-comparison`
- 差异类别（`differenceType`）：`semantic-scope-difference`
- 关联来源（`sourceReferences`）：
  - 第 1 项：
    - 观察标识（`observationId`）：`atwiki-88-08`
    - 来源网址（`sourceURL`）：[https://w.atwiki.jp/sangokushi11/pages/88.html](https://w.atwiki.jp/sangokushi11/pages/88.html)
    - 来源章节（`sourceSection`）：`虎を追う者（典韋登用）`
    - 来源行定位（`sourceLocator`）：
      - 起始行（`startLine`）：230
      - 结束行（`endLine`）：255
  - 第 2 项：
    - 观察标识（`observationId`）：`atwiki-88-10`
    - 来源网址（`sourceURL`）：[https://w.atwiki.jp/sangokushi11/pages/88.html](https://w.atwiki.jp/sangokushi11/pages/88.html)
    - 来源章节（`sourceSection`）：`悪来vs許褚（許褚登用）`
    - 来源行定位（`sourceLocator`）：
      - 起始行（`startLine`）：267
      - 结束行（`endLine`）：297
  - 第 3 项：
    - 观察标识（`observationId`）：`atwiki-88-11`
    - 来源网址（`sourceURL`）：[https://w.atwiki.jp/sangokushi11/pages/88.html](https://w.atwiki.jp/sangokushi11/pages/88.html)
    - 来源章节（`sourceSection`）：`郭嘉推挙`
    - 来源行定位（`sourceLocator`）：
      - 起始行（`startLine`）：298
      - 结束行（`endLine`）：322
  - 第 4 项：
    - 观察标识（`observationId`）：`atwiki-88-14`
    - 来源网址（`sourceURL`）：[https://w.atwiki.jp/sangokushi11/pages/88.html](https://w.atwiki.jp/sangokushi11/pages/88.html)
    - 来源章节（`sourceSection`）：`小覇王・孫策（周泰、蒋欽、陳武、董襲、凌操仕官）`
    - 来源行定位（`sourceLocator`）：
      - 起始行（`startLine`）：352
      - 结束行（`endLine`）：366
  - 第 5 项：
    - 观察标识（`observationId`）：`atwiki-88-15`
    - 来源网址（`sourceURL`）：[https://w.atwiki.jp/sangokushi11/pages/88.html](https://w.atwiki.jp/sangokushi11/pages/88.html)
    - 来源章节（`sourceSection`）：`二張推挙`
    - 来源行定位（`sourceLocator`）：
      - 起始行（`startLine`）：367
      - 结束行（`endLine`）：398
  - 第 6 项：
    - 观察标识（`observationId`）：`atwiki-88-21`
    - 来源网址（`sourceURL`）：[https://w.atwiki.jp/sangokushi11/pages/88.html](https://w.atwiki.jp/sangokushi11/pages/88.html)
    - 来源章节（`sourceSection`）：`好漢・劉備（龔都、周倉、裴元紹、劉辟、廖化仕官）`
    - 来源行定位（`sourceLocator`）：
      - 起始行（`startLine`）：495
      - 结束行（`endLine`）：510
  - 第 7 项：
    - 观察标识（`observationId`）：`atwiki-88-30`
    - 来源网址（`sourceURL`）：[https://w.atwiki.jp/sangokushi11/pages/88.html](https://w.atwiki.jp/sangokushi11/pages/88.html)
    - 来源章节（`sourceSection`）：`馬氏の五常`
    - 来源行定位（`sourceLocator`）：
      - 起始行（`startLine`）：594
      - 结束行（`endLine`）：623
  - 第 8 项：
    - 观察标识（`observationId`）：`gamersky.recruit-dian-wei`
    - 来源网址（`sourceURL`）：[https://www.gamersky.com/handbook/200809/124174.shtml](https://www.gamersky.com/handbook/200809/124174.shtml)
    - 来源章节（`sourceSection`）：`恶来出场`
  - 第 9 项：
    - 观察标识（`observationId`）：`gamersky.recruit-xu-chu`
    - 来源网址（`sourceURL`）：[https://www.gamersky.com/handbook/200809/124174_2.shtml](https://www.gamersky.com/handbook/200809/124174_2.shtml)
    - 来源章节（`sourceSection`）：`虎痴斗恶来`
  - 第 10 项：
    - 观察标识（`observationId`）：`gamersky.recommend-guo-jia`
    - 来源网址（`sourceURL`）：[https://www.gamersky.com/handbook/200809/124174_2.shtml](https://www.gamersky.com/handbook/200809/124174_2.shtml)
    - 来源章节（`sourceSection`）：`荀彧推荐郭嘉`
  - 第 11 项：
    - 观察标识（`observationId`）：`gamersky.recruit-sun-ce-five`
    - 来源网址（`sourceURL`）：[https://www.gamersky.com/handbook/200809/124174_3.shtml](https://www.gamersky.com/handbook/200809/124174_3.shtml)
    - 来源章节（`sourceSection`）：`小霸王孙策`
  - 第 12 项：
    - 观察标识（`observationId`）：`gamersky.recommend-two-zhangs`
    - 来源网址（`sourceURL`）：[https://www.gamersky.com/handbook/200809/124174_3.shtml](https://www.gamersky.com/handbook/200809/124174_3.shtml)
    - 来源章节（`sourceSection`）：`周瑜推举二张`
  - 第 13 项：
    - 观察标识（`observationId`）：`gamersky.recruit-liu-bei-five`
    - 来源网址（`sourceURL`）：[https://www.gamersky.com/handbook/200809/124174_5.shtml](https://www.gamersky.com/handbook/200809/124174_5.shtml)
    - 来源章节（`sourceSection`）：`好汉刘备`
  - 第 14 项：
    - 观察标识（`observationId`）：`gamersky.recommend-ma-brothers`
    - 来源网址（`sourceURL`）：[https://www.gamersky.com/handbook/200809/124174_8.shtml](https://www.gamersky.com/handbook/200809/124174_8.shtml)
    - 来源章节（`sourceSection`）：`马氏五常`

### 分歧 36：recruitment-result-description-order

中文说明：中文成功分支先写推荐者功绩再招募；Wiki先写加入/属性再推荐者功绩。许褚/二张非曹操君主分支中文先败后胜，Wiki先胜后败；均仅是文字排列差异。

- 分歧标识（`id`）：`recruitment-result-description-order`
- 涉及事件（`eventIds`）：列表（按来源次序）：`recruit-dian-wei`、`recruit-xu-chu`、`recommend-guo-jia`、`recommend-two-zhangs`
- 观察标识列表（`observationIds`）：列表（按来源次序）：`atwiki-88-08`、`atwiki-88-10`、`atwiki-88-11`、`atwiki-88-15`、`gamersky.recruit-dian-wei`、`gamersky.recruit-xu-chu`、`gamersky.recommend-guo-jia`、`gamersky.recommend-two-zhangs`
- 涉及字段（`fields`）：列表（按来源次序）：`orderedResults.presentation-order`
- 来源差异说明（`description`）：Chinese describes sponsor merit before recruitment in successful cases; Wiki lists recruited officer allegiance/stats before sponsor merit. Chinese presents other-ruler loss before win for Xu Chu/Two Zhangs; Wiki win before loss. These are textual ordering differences only, with no runtime ordering claim.
- 状态（`status`）：未解决（`unresolved`）
- 比对依据（`reviewBasis`）：`fresh-source-comparison`
- 差异类别（`differenceType`）：`description-order`
- 关联来源（`sourceReferences`）：
  - 第 1 项：
    - 观察标识（`observationId`）：`atwiki-88-08`
    - 来源网址（`sourceURL`）：[https://w.atwiki.jp/sangokushi11/pages/88.html](https://w.atwiki.jp/sangokushi11/pages/88.html)
    - 来源章节（`sourceSection`）：`虎を追う者（典韋登用）`
    - 来源行定位（`sourceLocator`）：
      - 起始行（`startLine`）：230
      - 结束行（`endLine`）：255
  - 第 2 项：
    - 观察标识（`observationId`）：`atwiki-88-10`
    - 来源网址（`sourceURL`）：[https://w.atwiki.jp/sangokushi11/pages/88.html](https://w.atwiki.jp/sangokushi11/pages/88.html)
    - 来源章节（`sourceSection`）：`悪来vs許褚（許褚登用）`
    - 来源行定位（`sourceLocator`）：
      - 起始行（`startLine`）：267
      - 结束行（`endLine`）：297
  - 第 3 项：
    - 观察标识（`observationId`）：`atwiki-88-11`
    - 来源网址（`sourceURL`）：[https://w.atwiki.jp/sangokushi11/pages/88.html](https://w.atwiki.jp/sangokushi11/pages/88.html)
    - 来源章节（`sourceSection`）：`郭嘉推挙`
    - 来源行定位（`sourceLocator`）：
      - 起始行（`startLine`）：298
      - 结束行（`endLine`）：322
  - 第 4 项：
    - 观察标识（`observationId`）：`atwiki-88-15`
    - 来源网址（`sourceURL`）：[https://w.atwiki.jp/sangokushi11/pages/88.html](https://w.atwiki.jp/sangokushi11/pages/88.html)
    - 来源章节（`sourceSection`）：`二張推挙`
    - 来源行定位（`sourceLocator`）：
      - 起始行（`startLine`）：367
      - 结束行（`endLine`）：398
  - 第 5 项：
    - 观察标识（`observationId`）：`gamersky.recruit-dian-wei`
    - 来源网址（`sourceURL`）：[https://www.gamersky.com/handbook/200809/124174.shtml](https://www.gamersky.com/handbook/200809/124174.shtml)
    - 来源章节（`sourceSection`）：`恶来出场`
  - 第 6 项：
    - 观察标识（`observationId`）：`gamersky.recruit-xu-chu`
    - 来源网址（`sourceURL`）：[https://www.gamersky.com/handbook/200809/124174_2.shtml](https://www.gamersky.com/handbook/200809/124174_2.shtml)
    - 来源章节（`sourceSection`）：`虎痴斗恶来`
  - 第 7 项：
    - 观察标识（`observationId`）：`gamersky.recommend-guo-jia`
    - 来源网址（`sourceURL`）：[https://www.gamersky.com/handbook/200809/124174_2.shtml](https://www.gamersky.com/handbook/200809/124174_2.shtml)
    - 来源章节（`sourceSection`）：`荀彧推荐郭嘉`
  - 第 8 项：
    - 观察标识（`observationId`）：`gamersky.recommend-two-zhangs`
    - 来源网址（`sourceURL`）：[https://www.gamersky.com/handbook/200809/124174_3.shtml](https://www.gamersky.com/handbook/200809/124174_3.shtml)
    - 来源章节（`sourceSection`）：`周瑜推举二张`

### 分歧 37：chain-plot-aggregate-vs-stages

中文说明：Wiki仅一条连环计总述条件，史实貂蝉且未登场；中文三阶段，各有史实女性/吕布未婚、未发现/保护状态、30日依赖、18月保护与刺杀/分裂结果。总述不构成第四个可执行阶段，不等同任一阶段。

- 分歧标识（`id`）：`chain-plot-aggregate-vs-stages`
- 涉及事件（`eventIds`）：列表（按来源次序）：`chain-plot-overview`、`chain-plot-banquet`、`chain-plot-pavilion`、`chain-plot-assassination`
- 观察标识列表（`observationIds`）：列表（按来源次序）：`atwiki-88-09`、`gamersky.chain-plot-banquet`、`gamersky.chain-plot-pavilion`、`gamersky.chain-plot-assassination`
- 涉及字段（`fields`）：列表（按来源次序）：`canonical-identity`、`conditions.character-mode`、`conditions.spouse`、`conditions.character-status`、`prerequisites`、`orderedResults`
- 来源差异说明（`description`）：Wiki has one aggregate conditions-only Chain Plot section, conditional on Diao Chan being a historical officer and not-yet-appeared. Chinese has three separately named stages, each requiring historical-female mode and unmarried Lu Bu, with undiscovered/guard-status distinctions,30-day dependencies, an18-month guard duration and detailed assassination/split results. The aggregate is not a fourth executable stage and is not silently equated to one staged event.
- 状态（`status`）：未解决（`unresolved`）
- 比对依据（`reviewBasis`）：`fresh-source-comparison`
- 差异类别（`differenceType`）：`coverage-and-granularity`
- 关联来源（`sourceReferences`）：
  - 第 1 项：
    - 观察标识（`observationId`）：`atwiki-88-09`
    - 来源网址（`sourceURL`）：[https://w.atwiki.jp/sangokushi11/pages/88.html](https://w.atwiki.jp/sangokushi11/pages/88.html)
    - 来源章节（`sourceSection`）：`連環の計`
    - 来源行定位（`sourceLocator`）：
      - 起始行（`startLine`）：256
      - 结束行（`endLine`）：266
  - 第 2 项：
    - 观察标识（`observationId`）：`gamersky.chain-plot-banquet`
    - 来源网址（`sourceURL`）：[https://www.gamersky.com/handbook/200809/124174_2.shtml](https://www.gamersky.com/handbook/200809/124174_2.shtml)
    - 来源章节（`sourceSection`）：连还计 1 - 酒宴
  - 第 3 项：
    - 观察标识（`observationId`）：`gamersky.chain-plot-pavilion`
    - 来源网址（`sourceURL`）：[https://www.gamersky.com/handbook/200809/124174_2.shtml](https://www.gamersky.com/handbook/200809/124174_2.shtml)
    - 来源章节（`sourceSection`）：连还计 2 - 凤仪亭
  - 第 4 项：
    - 观察标识（`observationId`）：`gamersky.chain-plot-assassination`
    - 来源网址（`sourceURL`）：[https://www.gamersky.com/handbook/200809/124174_2.shtml](https://www.gamersky.com/handbook/200809/124174_2.shtml)
    - 来源章节（`sourceSection`）：连还计 3 - 谋杀

### 分歧 38：three-visits-aggregate-vs-stages

中文说明：Wiki为一条总述条件，与刘备无血缘且控制城市治安100的范围有歧义；中文三阶段含玩家刘备、第一顾相性/两条厌恶排除、君主当前城治安100、30日依赖、36月保护及第三顾招募。不把阶段结果/依赖补到总述，也不主张一对一对应。

- 分歧标识（`id`）：`three-visits-aggregate-vs-stages`
- 涉及事件（`eventIds`）：列表（按来源次序）：`three-visits-overview`、`three-visits-first`、`three-visits-second`、`three-visits-third`
- 观察标识列表（`observationIds`）：列表（按来源次序）：`atwiki-88-29`、`gamersky.three-visits-first`、`gamersky.three-visits-second`、`gamersky.three-visits-third`
- 涉及字段（`fields`）：列表（按来源次序）：`canonical-identity`、`conditions.relationship`、`conditions.controller`、`conditions.public-order-scope`、`prerequisites`、`orderedResults`
- 来源差异说明（`description`）：Wiki has one aggregate conditions-only section with no blood relation to Liu Bei and ambiguous controlled-city order100 scope. Chinese has three named stages, explicit player Liu Bei, first-visit close compatibility and two dislike exclusions, ruler-current-city order100,30-day dependencies,36-month guard duration and third-visit recruitment details. Wiki does not inherit those stage outcomes or dependencies; no exact one-to-one canonical equivalence is asserted.
- 状态（`status`）：未解决（`unresolved`）
- 比对依据（`reviewBasis`）：`fresh-source-comparison`
- 差异类别（`differenceType`）：`coverage-and-granularity`
- 关联来源（`sourceReferences`）：
  - 第 1 项：
    - 观察标识（`observationId`）：`atwiki-88-29`
    - 来源网址（`sourceURL`）：[https://w.atwiki.jp/sangokushi11/pages/88.html](https://w.atwiki.jp/sangokushi11/pages/88.html)
    - 来源章节（`sourceSection`）：`三顧の礼`
    - 来源行定位（`sourceLocator`）：
      - 起始行（`startLine`）：581
      - 结束行（`endLine`）：593
  - 第 2 项：
    - 观察标识（`observationId`）：`gamersky.three-visits-first`
    - 来源网址（`sourceURL`）：[https://www.gamersky.com/handbook/200809/124174_7.shtml](https://www.gamersky.com/handbook/200809/124174_7.shtml)
    - 来源章节（`sourceSection`）：三顾之礼 1 - 一顾
  - 第 3 项：
    - 观察标识（`observationId`）：`gamersky.three-visits-second`
    - 来源网址（`sourceURL`）：[https://www.gamersky.com/handbook/200809/124174_7.shtml](https://www.gamersky.com/handbook/200809/124174_7.shtml)
    - 来源章节（`sourceSection`）：三顾之礼 2 - 二顾
  - 第 4 项：
    - 观察标识（`observationId`）：`gamersky.three-visits-third`
    - 来源网址（`sourceURL`）：[https://www.gamersky.com/handbook/200809/124174_8.shtml](https://www.gamersky.com/handbook/200809/124174_8.shtml)
    - 来源章节（`sourceSection`）：三顾之礼 3 - 三顾

### 分歧 39：wiki-heading-only-vs-chinese-details

中文说明：三条Wiki观察只有标题，中文有触发及结果细节；同事件下分别保留，Wiki事实仍为未说明。缺文是来源覆盖缺口，不证明中文为运行时正确机制。

- 分歧标识（`id`）：`wiki-heading-only-vs-chinese-details`
- 涉及事件（`eventIds`）：列表（按来源次序）：`guo-jia-death`、`xu-shu-arrives`、`liu-bei-death`
- 观察标识列表（`observationIds`）：列表（按来源次序）：`atwiki-88-23`、`atwiki-88-27`、`atwiki-88-43`、`gamersky.guo-jia-death`、`gamersky.xu-shu-arrives`、`gamersky.liu-bei-death`
- 涉及字段（`fields`）：列表（按来源次序）：`conditions`、`orderedResults`
- 来源差异说明（`description`）：Fresh Wiki contains only these three event headings, whereas Chinese supplies trigger and result details. Both source observations are retained under the same event identity, but all Wiki facts stay not-stated. Missing Wiki content is a coverage gap, not evidence that Chinese mechanics are runtime-correct.
- 状态（`status`）：未解决（`unresolved`）
- 比对依据（`reviewBasis`）：`fresh-source-comparison`
- 差异类别（`differenceType`）：`coverage-gap`
- 关联来源（`sourceReferences`）：
  - 第 1 项：
    - 观察标识（`observationId`）：`atwiki-88-23`
    - 来源网址（`sourceURL`）：[https://w.atwiki.jp/sangokushi11/pages/88.html](https://w.atwiki.jp/sangokushi11/pages/88.html)
    - 来源章节（`sourceSection`）：`郭嘉の死`
    - 来源行定位（`sourceLocator`）：
      - 起始行（`startLine`）：524
      - 结束行（`endLine`）：525
  - 第 2 项：
    - 观察标识（`observationId`）：`atwiki-88-27`
    - 来源网址（`sourceURL`）：[https://w.atwiki.jp/sangokushi11/pages/88.html](https://w.atwiki.jp/sangokushi11/pages/88.html)
    - 来源章节（`sourceSection`）：`徐庶登場`
    - 来源行定位（`sourceLocator`）：
      - 起始行（`startLine`）：565
      - 结束行（`endLine`）：565
  - 第 3 项：
    - 观察标识（`observationId`）：`atwiki-88-43`
    - 来源网址（`sourceURL`）：[https://w.atwiki.jp/sangokushi11/pages/88.html](https://w.atwiki.jp/sangokushi11/pages/88.html)
    - 来源章节（`sourceSection`）：`劉備の死`
    - 来源行定位（`sourceLocator`）：
      - 起始行（`startLine`）：929
      - 结束行（`endLine`）：930
  - 第 4 项：
    - 观察标识（`observationId`）：`gamersky.guo-jia-death`
    - 来源网址（`sourceURL`）：[https://www.gamersky.com/handbook/200809/124174_5.shtml](https://www.gamersky.com/handbook/200809/124174_5.shtml)
    - 来源章节（`sourceSection`）：`郭嘉之死`
  - 第 5 项：
    - 观察标识（`observationId`）：`gamersky.xu-shu-arrives`
    - 来源网址（`sourceURL`）：[https://www.gamersky.com/handbook/200809/124174_7.shtml](https://www.gamersky.com/handbook/200809/124174_7.shtml)
    - 来源章节（`sourceSection`）：`徐庶登场`
  - 第 6 项：
    - 观察标识（`observationId`）：`gamersky.liu-bei-death`
    - 来源网址（`sourceURL`）：[https://www.gamersky.com/handbook/200809/124174_12.shtml](https://www.gamersky.com/handbook/200809/124174_12.shtml)
    - 来源章节（`sourceSection`）：`刘备之死`

### 分歧 40：city-versus-base-and-assignment

中文说明：中文用当前同城；Wiki推荐事件用同所属据点，二乔/甄氏/吕蒙用同当前据点，部分治安指所属城市。都市、据点与所属不归一，不预设运行时地点模型。

- 分歧标识（`id`）：`city-versus-base-and-assignment`
- 涉及事件（`eventIds`）：列表（按来源次序）：`recruit-dian-wei`、`recruit-xu-chu`、`recommend-guo-jia`、`recommend-two-zhangs`、`marry-two-qiaos`、`marry-cao-pi-zhen`、`lu-meng-studies`
- 观察标识列表（`observationIds`）：列表（按来源次序）：`atwiki-88-08`、`atwiki-88-10`、`atwiki-88-11`、`atwiki-88-15`、`atwiki-88-16`、`atwiki-88-18`、`atwiki-88-32`、`gamersky.recruit-dian-wei`、`gamersky.recruit-xu-chu`、`gamersky.recommend-guo-jia`、`gamersky.recommend-two-zhangs`、`gamersky.marry-two-qiaos`、`gamersky.marry-cao-pi-zhen`、`gamersky.lu-meng-studies`
- 涉及字段（`fields`）：列表（按来源次序）：`conditions.colocation`、`conditions.city-reference`
- 来源差异说明（`description`）：Chinese uses same current city for these actors. Wiki recommendations use same assigned base; Qiao/Zhen/Lu Meng sections use same current base. Recommendation public-order references also use assigned city in Wiki where applicable. 都市, 拠点 and 所属 are not silently made equivalent; no runtime location model is presumed.
- 状态（`status`）：未解决（`unresolved`）
- 比对依据（`reviewBasis`）：`fresh-source-comparison`
- 差异类别（`differenceType`）：`location-granularity`
- 关联来源（`sourceReferences`）：
  - 第 1 项：
    - 观察标识（`observationId`）：`atwiki-88-08`
    - 来源网址（`sourceURL`）：[https://w.atwiki.jp/sangokushi11/pages/88.html](https://w.atwiki.jp/sangokushi11/pages/88.html)
    - 来源章节（`sourceSection`）：`虎を追う者（典韋登用）`
    - 来源行定位（`sourceLocator`）：
      - 起始行（`startLine`）：230
      - 结束行（`endLine`）：255
  - 第 2 项：
    - 观察标识（`observationId`）：`atwiki-88-10`
    - 来源网址（`sourceURL`）：[https://w.atwiki.jp/sangokushi11/pages/88.html](https://w.atwiki.jp/sangokushi11/pages/88.html)
    - 来源章节（`sourceSection`）：`悪来vs許褚（許褚登用）`
    - 来源行定位（`sourceLocator`）：
      - 起始行（`startLine`）：267
      - 结束行（`endLine`）：297
  - 第 3 项：
    - 观察标识（`observationId`）：`atwiki-88-11`
    - 来源网址（`sourceURL`）：[https://w.atwiki.jp/sangokushi11/pages/88.html](https://w.atwiki.jp/sangokushi11/pages/88.html)
    - 来源章节（`sourceSection`）：`郭嘉推挙`
    - 来源行定位（`sourceLocator`）：
      - 起始行（`startLine`）：298
      - 结束行（`endLine`）：322
  - 第 4 项：
    - 观察标识（`observationId`）：`atwiki-88-15`
    - 来源网址（`sourceURL`）：[https://w.atwiki.jp/sangokushi11/pages/88.html](https://w.atwiki.jp/sangokushi11/pages/88.html)
    - 来源章节（`sourceSection`）：`二張推挙`
    - 来源行定位（`sourceLocator`）：
      - 起始行（`startLine`）：367
      - 结束行（`endLine`）：398
  - 第 5 项：
    - 观察标识（`observationId`）：`atwiki-88-16`
    - 来源网址（`sourceURL`）：[https://w.atwiki.jp/sangokushi11/pages/88.html](https://w.atwiki.jp/sangokushi11/pages/88.html)
    - 来源章节（`sourceSection`）：`二喬婚礼`
    - 来源行定位（`sourceLocator`）：
      - 起始行（`startLine`）：399
      - 结束行（`endLine`）：411
  - 第 6 项：
    - 观察标识（`observationId`）：`atwiki-88-18`
    - 来源网址（`sourceURL`）：[https://w.atwiki.jp/sangokushi11/pages/88.html](https://w.atwiki.jp/sangokushi11/pages/88.html)
    - 来源章节（`sourceSection`）：`御曹司一番乗り（曹丕・甄氏結婚）`
    - 来源行定位（`sourceLocator`）：
      - 起始行（`startLine`）：442
      - 结束行（`endLine`）：462
  - 第 7 项：
    - 观察标识（`observationId`）：`atwiki-88-32`
    - 来源网址（`sourceURL`）：[https://w.atwiki.jp/sangokushi11/pages/88.html](https://w.atwiki.jp/sangokushi11/pages/88.html)
    - 来源章节（`sourceSection`）：`呉下の阿蒙にあらず`
    - 来源行定位（`sourceLocator`）：
      - 起始行（`startLine`）：644
      - 结束行（`endLine`）：661
  - 第 8 项：
    - 观察标识（`observationId`）：`gamersky.recruit-dian-wei`
    - 来源网址（`sourceURL`）：[https://www.gamersky.com/handbook/200809/124174.shtml](https://www.gamersky.com/handbook/200809/124174.shtml)
    - 来源章节（`sourceSection`）：`恶来出场`
  - 第 9 项：
    - 观察标识（`observationId`）：`gamersky.recruit-xu-chu`
    - 来源网址（`sourceURL`）：[https://www.gamersky.com/handbook/200809/124174_2.shtml](https://www.gamersky.com/handbook/200809/124174_2.shtml)
    - 来源章节（`sourceSection`）：`虎痴斗恶来`
  - 第 10 项：
    - 观察标识（`observationId`）：`gamersky.recommend-guo-jia`
    - 来源网址（`sourceURL`）：[https://www.gamersky.com/handbook/200809/124174_2.shtml](https://www.gamersky.com/handbook/200809/124174_2.shtml)
    - 来源章节（`sourceSection`）：`荀彧推荐郭嘉`
  - 第 11 项：
    - 观察标识（`observationId`）：`gamersky.recommend-two-zhangs`
    - 来源网址（`sourceURL`）：[https://www.gamersky.com/handbook/200809/124174_3.shtml](https://www.gamersky.com/handbook/200809/124174_3.shtml)
    - 来源章节（`sourceSection`）：`周瑜推举二张`
  - 第 12 项：
    - 观察标识（`observationId`）：`gamersky.marry-two-qiaos`
    - 来源网址（`sourceURL`）：[https://www.gamersky.com/handbook/200809/124174_4.shtml](https://www.gamersky.com/handbook/200809/124174_4.shtml)
    - 来源章节（`sourceSection`）：`二乔结婚`
  - 第 13 项：
    - 观察标识（`observationId`）：`gamersky.marry-cao-pi-zhen`
    - 来源网址（`sourceURL`）：[https://www.gamersky.com/handbook/200809/124174_4.shtml](https://www.gamersky.com/handbook/200809/124174_4.shtml)
    - 来源章节（`sourceSection`）：`甄氏转嫁曹丕`
  - 第 14 项：
    - 观察标识（`observationId`）：`gamersky.lu-meng-studies`
    - 来源网址（`sourceURL`）：[https://www.gamersky.com/handbook/200809/124174_9.shtml](https://www.gamersky.com/handbook/200809/124174_9.shtml)
    - 来源章节（`sourceSection`）：`吴下阿蒙`

### 分歧 41：emperor-dead-versus-absent

中文说明：中文魏帝结果是皇帝死亡，后续即位/北伐条件为已死；Wiki结果及后续条件为不再存在，没有独立死亡操作。死亡和不存在保持不同来源主张。

- 分歧标识（`id`）：`emperor-dead-versus-absent`
- 涉及事件（`eventIds`）：列表（按来源次序）：`wei-emperor-accession`、`shu-emperor-accession`、`wu-king-accession`、`wu-emperor-accession`、`zhuge-liang-northern-campaign`
- 观察标识列表（`observationIds`）：列表（按来源次序）：`atwiki-88-36`、`atwiki-88-37`、`atwiki-88-39`、`atwiki-88-41`、`atwiki-88-42`、`gamersky.wei-emperor-accession`、`gamersky.shu-emperor-accession`、`gamersky.wu-king-accession`、`gamersky.zhuge-liang-northern-campaign`、`gamersky.wu-emperor-accession`
- 涉及字段（`fields`）：列表（按来源次序）：`conditions.emperor-state`、`orderedResults.emperor-state`
- 来源差异说明（`description`）：Chinese uses emperor death as the Wei result and dead as the later accession/campaign condition. Wiki says the emperor ceases to exist as the Wei result and does not exist as the later condition, without a separately stated death operation. Absence and death are retained as source-specific claims, not automatically equated.
- 状态（`status`）：未解决（`unresolved`）
- 比对依据（`reviewBasis`）：`fresh-source-comparison`
- 差异类别（`differenceType`）：`semantic-state-difference`
- 关联来源（`sourceReferences`）：
  - 第 1 项：
    - 观察标识（`observationId`）：`atwiki-88-36`
    - 来源网址（`sourceURL`）：[https://w.atwiki.jp/sangokushi11/pages/88.html](https://w.atwiki.jp/sangokushi11/pages/88.html)
    - 来源章节（`sourceSection`）：`魏帝即位`
    - 来源行定位（`sourceLocator`）：
      - 起始行（`startLine`）：728
      - 结束行（`endLine`）：761
  - 第 2 项：
    - 观察标识（`observationId`）：`atwiki-88-37`
    - 来源网址（`sourceURL`）：[https://w.atwiki.jp/sangokushi11/pages/88.html](https://w.atwiki.jp/sangokushi11/pages/88.html)
    - 来源章节（`sourceSection`）：`蜀帝即位`
    - 来源行定位（`sourceLocator`）：
      - 起始行（`startLine`）：762
      - 结束行（`endLine`）：799
  - 第 3 项：
    - 观察标识（`observationId`）：`atwiki-88-39`
    - 来源网址（`sourceURL`）：[https://w.atwiki.jp/sangokushi11/pages/88.html](https://w.atwiki.jp/sangokushi11/pages/88.html)
    - 来源章节（`sourceSection`）：`呉王即位`
    - 来源行定位（`sourceLocator`）：
      - 起始行（`startLine`）：819
      - 结束行（`endLine`）：857
  - 第 4 项：
    - 观察标识（`observationId`）：`atwiki-88-41`
    - 来源网址（`sourceURL`）：[https://w.atwiki.jp/sangokushi11/pages/88.html](https://w.atwiki.jp/sangokushi11/pages/88.html)
    - 来源章节（`sourceSection`）：`諸葛亮の北伐`
    - 来源行定位（`sourceLocator`）：
      - 起始行（`startLine`）：881
      - 结束行（`endLine`）：901
  - 第 5 项：
    - 观察标识（`observationId`）：`atwiki-88-42`
    - 来源网址（`sourceURL`）：[https://w.atwiki.jp/sangokushi11/pages/88.html](https://w.atwiki.jp/sangokushi11/pages/88.html)
    - 来源章节（`sourceSection`）：`呉帝即位`
    - 来源行定位（`sourceLocator`）：
      - 起始行（`startLine`）：902
      - 结束行（`endLine`）：928
  - 第 6 项：
    - 观察标识（`observationId`）：`gamersky.wei-emperor-accession`
    - 来源网址（`sourceURL`）：[https://www.gamersky.com/handbook/200809/124174_10.shtml](https://www.gamersky.com/handbook/200809/124174_10.shtml)
    - 来源章节（`sourceSection`）：`魏帝即位`
  - 第 7 项：
    - 观察标识（`observationId`）：`gamersky.shu-emperor-accession`
    - 来源网址（`sourceURL`）：[https://www.gamersky.com/handbook/200809/124174_10.shtml](https://www.gamersky.com/handbook/200809/124174_10.shtml)
    - 来源章节（`sourceSection`）：`蜀帝即位`
  - 第 8 项：
    - 观察标识（`observationId`）：`gamersky.wu-king-accession`
    - 来源网址（`sourceURL`）：[https://www.gamersky.com/handbook/200809/124174_11.shtml](https://www.gamersky.com/handbook/200809/124174_11.shtml)
    - 来源章节（`sourceSection`）：`吴王即位`
  - 第 9 项：
    - 观察标识（`observationId`）：`gamersky.zhuge-liang-northern-campaign`
    - 来源网址（`sourceURL`）：[https://www.gamersky.com/handbook/200809/124174_12.shtml](https://www.gamersky.com/handbook/200809/124174_12.shtml)
    - 来源章节（`sourceSection`）：`诸葛亮北伐`
  - 第 10 项：
    - 观察标识（`observationId`）：`gamersky.wu-emperor-accession`
    - 来源网址（`sourceURL`）：[https://www.gamersky.com/handbook/200809/124174_12.shtml](https://www.gamersky.com/handbook/200809/124174_12.shtml)
    - 来源章节（`sourceSection`）：`吴王即位`

## 明确排除项（exclusions，2 项）

以下内容不在本次历史来源集合内；排除不等于判定游戏不存在对应机制。

### 排除 1

- 来源（`source`）：[https://w.atwiki.jp/sangokushi11/pages/88.html](https://w.atwiki.jp/sangokushi11/pages/88.html)
- 排除章节（`section`）：汎用イベント and comments/navigation
- 排除理由（`reason`）：Outside this historical-source corpus; comments are not silently promoted into rules.

### 排除 2

- 来源（`source`）：[https://w.atwiki.jp/sangokushi11/pages/100.html](https://w.atwiki.jp/sangokushi11/pages/100.html)
- 排除章节（`section`）：Separate PS2 historical corpus
- 排除理由（`reason`）：Explicit platform-specific backlog; this batch prioritizes the selected PC-relevant source material without retroactively certifying unspecified claims as PC PK.

范围说明：Wiki88 的通用事件、评论和导航不提升为史实规则；Wiki100 是单独的 PS2 史实资料范围，本集合不将未说明平台的资料追认成 PC PK。

## 全局未知项（globalUnknowns，4 项）

1. 原版运行时编号、触发调度、仅一次标志及原版存档集成均未提供；事件标识是本资料集合的标识。
   - 来源原值：Original runtime IDs, trigger scheduler, once-only flags and original-save integration are not provided; eventIds are corpus IDs.
2. 未说明的构建/平台、来源矛盾、定性幅度、来源笔误以及不完整的日期提前规则仍属未知。
   - 来源原值：Unspecified builds/platforms, source contradictions, qualitative amounts, source typos and incomplete date acceleration remain unknown.
3. 本集合没有条件求值器或效果执行器，也未接入原生事件、俘虏处理或势力灭亡。
   - 来源原值：This corpus has no predicate evaluator or effect executor and is not linked to native events/capture/force extinction.
4. 先前未发布资料及旧原始验证记录丢失；本集合属于重新整理的资料，不能继承旧验证结论，仍需其自身的验证证据。
   - 来源原值：The earlier unpublished artifact and old raw validation logs were lost. This is fresh reconstruction and requires its own validation evidence.

## 静态字段覆盖清单

- 两份观察正文逐条保留 `eventId`、`observationId`、`title`、`sourceId`、`sourceURL`、`sourceSection`、`sourceOrdinal`、atwiki 的 `sourceLocator.startLine/endLine`、`version.game/edition/platform/patch`、`evidence`、`onceOnly.status/flagId`、`conditions`、`prerequisites`、`orderedResults`、`uncertainties`，以及各自全部递归子字段
- 条件中的 `fact/all/any`、结果中的 `effect/choice/branch/if` 及其中可再次出现的条件树均按原父子关系保留。基准条件、受影响条件、日期替代项与可能分组不作扁平化
- 本目录保留总体执行关闭状态、范围、顺序定义、13 个来源、66 个事件映射、41 条分歧、2 个排除项、4 个全局未知项；来源标题、网址、采集日期、采集方式、章节数、原始标题列表、观察列表与版本限制均完整展开
- 本目录的完整非省略递归字段集合：`articleTitle`、`coverageScope`、`description`、`differenceType`、`disagreements`、`endLine`、`eventCatalog`、`eventCount`、`eventId`、`eventIds`、`evidence`、`exclusions`、`executionEnabled`、`expectedSectionCount`、`fields`、`globalUnknowns`、`id`、`observationCount`、`observationId`、`observationIds`、`observedDate`、`originalTitles`、`reason`、`resultOrderMeaning`、`retrievalKind`、`reviewBasis`、`section`、`source`、`sourceId`、`sourceLocator`、`sourceReferences`、`sourceSection`、`sourceURL`、`sources`、`startLine`、`status`、`url`、`versionScope`
- 仅省略 `schemaVersion` 和 `sources[].retrievedContentSha256`。静态数量来自现有数据正文，不表示已完成运行测试或已认证全部原版事件
