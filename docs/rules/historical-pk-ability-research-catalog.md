# PR37：PK能力研究节点与隐藏候选完整明细

本页列出48个基础节点、10个隐藏槽位、50个隐藏候选和6项来源冲突。数值是攻略资料中的选择值；确切补丁、平台及纯净原生数据的对应关系未确认。

来源数据：[能力研究目录](../sources/pk-ability-research/catalog.json)。目录标识：pk-ability-research-guide-v1；版本：pk。

## 阅读规则

- 基础前置allOf表示所有列出的直接前置都必须完成；空列表是研究开始根节点
- 活跃隐藏槽位在开局固定一个候选；五个候选是可能性，不是同时可解锁的五个节点，不能把不同候选的前置拼成OR绕过当前候选
- 攻略记载从10个候选槽位选5个；具体选择算法、权重与随机数机制仍未确定
- 图示入边与候选前置分别保留；图片缺边不能抹去表格的明确前置
- 研究月数、金、行动力、养成类别及养成次数均按节点列出，不据此补齐命令资格、武将效果、取消、完成或调度流程

## 来源与适用边界

- 证据层级（level）：documented-guide
- 适用目标（target）：PK guide data; exact patch/platform equivalence unverified
- 资料采集日期（retrievedOn）：2026-10-06
- 是否为原生标识（nativeIds）：否（false）
- 研究树图（image）：
  - 来源链接（url）：https://img.atwiki.jp/sangokushi11/attach/46/257/%E4%B8%89%E5%9B%BD%E5%BF%9711%E8%83%BD%E5%8A%9B%E7%A0%94%E7%A9%B605.png
  - 图片宽度（width）：1020
  - 图片高度（height）：586
- 隐藏项编辑器截图（hiddenEditorImage）：
  - 来源链接（url）：https://img.atwiki.jp/sangokushi11/attach/1139/801/San11Editor01.PNG
  - 图片宽度（width）：913
  - 图片高度（height）：736

## 9项来源

- 第1项：
  - 标识（id）：atwiki-tree-05
  - 来源链接（url）：https://w.atwiki.jp/sangokushi11/pages/46.html
  - 章节（section）：能力研究ツリー / 三國志11能力研究05.png
  - 适用范围（scope）：all base labels, months, black arrows, and hidden-slot image geometry; image directly viewed
- 第2项：
  - 标识（id）：atwiki-uses
  - 来源链接（url）：https://w.atwiki.jp/sangokushi11/pages/46.html
  - 章节（section）：養成回数
  - 适用范围（scope）：base use limits
- 第3项：
  - 标识（id）：atwiki-hidden
  - 来源链接（url）：https://w.atwiki.jp/sangokushi11/pages/46.html
  - 章节（section）：隠し特技一覧
  - 适用范围（scope）：10 rows x 5 exact alternatives, prerequisites and use limits
- 第4项：
  - 标识（id）：zol-base
  - 来源链接（url）：https://game.zol.com.cn/228/2285144.html
  - 章节（section）：一般能力研究 / 基本能力研究
  - 适用范围（scope）：independent complete base months and use-limit cross-check
- 第5项：
  - 标识（id）：zol-hidden
  - 来源链接（url）：https://game.zol.com.cn/228/2285144.html
  - 章节（section）：额外能力研究 / 研究路径整理
  - 适用范围（scope）：hidden months and prerequisites; conflicting fields retained separately
- 第6项：
  - 标识（id）：gamersky-tree
  - 来源链接（url）：https://www.gamersky.com/handbook/200707/69811.shtml
  - 章节（section）：能力研究的注意事项 / 修改研究的路径
  - 适用范围（scope）：300 gold / 20 AP, AND meaning of incoming arrows, fame and war-medium prerequisite cross-check
- 第7项：
  - 标识（id）：gamersky-hidden
  - 来源链接（url）：https://www.gamersky.com/handbook/200707/69578.shtml
  - 章节（section）：hidden-position description
  - 适用范围（scope）：five selected positions from ten; numbering mapped through rule15Position
- 第8项：
  - 标识（id）：gamersky-timing
  - 来源链接（url）：https://www.gamersky.com/handbook/200704/59216.shtml
  - 章节（section）：research difficulty discussion
  - 适用范围（scope）：qualitative path cross-check only; star ratings are not research months
- 第9项：
  - 标识（id）：atwiki-editor-hidden
  - 来源链接（url）：https://w.atwiki.jp/sangokushi11/pages/1139.html
  - 章节（section）：San11Editor01.PNG, visible rows48..97
  - 适用范围（scope）：Directly viewed editor screenshot: all50 hidden prerequisite/month/use records, including heart-attack3 months and prayer5 uses. Screenshot provenance is not executable authentication.

## 48个基础节点

### 01. 枪兵A（aptitude.spear.a）

- 来源标签：槍兵A；版本：pk
- 研究：5个月；费用：金300、行动力20
- 养成类别：兵种适性（aptitude）；使用次数上限：5
- 全部直接前置：弩兵A（aptitude.crossbow.a）
- 图中中心坐标：114, 43
- 依据：atwiki-tree-05；atwiki-uses；zol-base；gamersky-tree

### 02. 弩兵A（aptitude.crossbow.a）

- 来源标签：弩兵A；版本：pk
- 研究：5个月；费用：金300、行动力20
- 养成类别：兵种适性（aptitude）；使用次数上限：5
- 全部直接前置：武+5中（stat.war.medium）
- 图中中心坐标：227, 43
- 依据：atwiki-tree-05；atwiki-uses；zol-base；gamersky-tree

### 03. 武+5中（stat.war.medium）

- 来源标签：武+5中；版本：pk
- 研究：4个月；费用：金300、行动力20
- 养成类别：能力值（stat）；使用次数上限：5
- 全部直接前置：枪兵B（aptitude.spear.b）且水军B（aptitude.navy.b）
- 图中中心坐标：341, 43
- 依据：atwiki-tree-05；atwiki-uses；zol-base；gamersky-tree

### 04. 戟兵A（aptitude.halberd.a）

- 来源标签：戟兵A；版本：pk
- 研究：5个月；费用：金300、行动力20
- 养成类别：兵种适性（aptitude）；使用次数上限：5
- 全部直接前置：水军B（aptitude.navy.b）
- 图中中心坐标：454, 43
- 依据：atwiki-tree-05；atwiki-uses；zol-base；gamersky-tree

### 05. 水军A（aptitude.navy.a）

- 来源标签：水軍A；版本：pk
- 研究：5个月；费用：金300、行动力20
- 养成类别：兵种适性（aptitude）；使用次数上限：5
- 全部直接前置：戟兵A（aptitude.halberd.a）
- 图中中心坐标：568, 43
- 依据：atwiki-tree-05；atwiki-uses；zol-base；gamersky-tree

### 06. 辅佐（skill.support）

- 来源标签：補佐；版本：pk
- 研究：6个月；费用：金300、行动力20
- 养成类别：特技（skill）；使用次数上限：3
- 全部直接前置：水军A（aptitude.navy.a）
- 图中中心坐标：681, 43
- 依据：atwiki-tree-05；atwiki-uses；zol-base；gamersky-tree

### 07. 霸王（skill.overlord）

- 来源标签：覇王；版本：pk
- 研究：6个月；费用：金300、行动力20
- 养成类别：特技（skill）；使用次数上限：1
- 全部直接前置：辅佐（skill.support）且统+5中（stat.leadership.medium）
- 图中中心坐标：794, 43
- 依据：atwiki-tree-05；atwiki-uses；zol-base；gamersky-tree

### 08. 连战（skill.chain-attack）

- 来源标签：連戦；版本：pk
- 研究：6个月；费用：金300、行动力20
- 养成类别：特技（skill）；使用次数上限：3
- 全部直接前置：枪兵A（aptitude.spear.a）
- 图中中心坐标：171, 128
- 依据：atwiki-tree-05；atwiki-uses；zol-base；gamersky-tree

### 09. 枪兵B（aptitude.spear.b）

- 来源标签：槍兵B；版本：pk
- 研究：4个月；费用：金300、行动力20
- 养成类别：兵种适性（aptitude）；使用次数上限：5
- 全部直接前置：弩兵B（aptitude.crossbow.b）
- 图中中心坐标：284, 128
- 依据：atwiki-tree-05；atwiki-uses；zol-base；gamersky-tree

### 10. 水军B（aptitude.navy.b）

- 来源标签：水軍B；版本：pk
- 研究：4个月；费用：金300、行动力20
- 养成类别：兵种适性（aptitude）；使用次数上限：5
- 全部直接前置：戟兵B（aptitude.halberd.b）
- 图中中心坐标：397, 128
- 依据：atwiki-tree-05；atwiki-uses；zol-base；gamersky-tree

### 11. 戟兵B（aptitude.halberd.b）

- 来源标签：戟兵B；版本：pk
- 研究：4个月；费用：金300、行动力20
- 养成类别：兵种适性（aptitude）；使用次数上限：5
- 全部直接前置：武+5低（stat.war.low）
- 图中中心坐标：511, 128
- 依据：atwiki-tree-05；atwiki-uses；zol-base；gamersky-tree

### 12. 金刚（skill.diamond）

- 来源标签：金剛；版本：pk
- 研究：3个月；费用：金300、行动力20
- 养成类别：特技（skill）；使用次数上限：3
- 全部直接前置：不屈（skill.indomitable）
- 图中中心坐标：737, 128
- 依据：atwiki-tree-05；atwiki-uses；zol-base；gamersky-tree

### 13. 统+5中（stat.leadership.medium）

- 来源标签：統+5中；版本：pk
- 研究：4个月；费用：金300、行动力20
- 养成类别：能力值（stat）；使用次数上限：5
- 全部直接前置：金刚（skill.diamond）
- 图中中心坐标：851, 128
- 依据：atwiki-tree-05；atwiki-uses；zol-base；gamersky-tree

### 14. 统+5高（stat.leadership.high）

- 来源标签：統+5高；版本：pk
- 研究：6个月；费用：金300、行动力20
- 养成类别：能力值（stat）；使用次数上限：3
- 全部直接前置：统+5中（stat.leadership.medium）
- 图中中心坐标：965, 128
- 依据：atwiki-tree-05；atwiki-uses；zol-base；gamersky-tree

### 15. 武+5高（stat.war.high）

- 来源标签：武+5高；版本：pk
- 研究：6个月；费用：金300、行动力20
- 养成类别：能力值（stat）；使用次数上限：3
- 全部直接前置：连战（skill.chain-attack）且骑兵A（aptitude.cavalry.a）
- 图中中心坐标：114, 213
- 依据：atwiki-tree-05；atwiki-uses；zol-base；gamersky-tree

### 16. 弩兵B（aptitude.crossbow.b）

- 来源标签：弩兵B；版本：pk
- 研究：4个月；费用：金300、行动力20
- 养成类别：兵种适性（aptitude）；使用次数上限：5
- 全部直接前置：武+5低（stat.war.low）
- 图中中心坐标：341, 213
- 依据：atwiki-tree-05；atwiki-uses；zol-base；gamersky-tree

### 17. 武+5低（stat.war.low）

- 来源标签：武+5低；版本：pk
- 研究：3个月；费用：金300、行动力20
- 养成类别：能力值（stat）；使用次数上限：5
- 全部直接前置：研究开始根节点（allOf为空）
- 图中中心坐标：454, 213
- 依据：atwiki-tree-05；atwiki-uses；zol-base；gamersky-tree

### 18. 统+5低（stat.leadership.low）

- 来源标签：統+5低；版本：pk
- 研究：3个月；费用：金300、行动力20
- 养成类别：能力值（stat）；使用次数上限：5
- 全部直接前置：研究开始根节点（allOf为空）
- 图中中心坐标：568, 213
- 依据：atwiki-tree-05；atwiki-uses；zol-base；gamersky-tree

### 19. 不屈（skill.indomitable）

- 来源标签：不屈；版本：pk
- 研究：3个月；费用：金300、行动力20
- 养成类别：特技（skill）；使用次数上限：3
- 全部直接前置：统+5低（stat.leadership.low）
- 图中中心坐标：681, 213
- 依据：atwiki-tree-05；atwiki-uses；zol-base；gamersky-tree

### 20. 名声（skill.fame）

- 来源标签：名声；版本：pk
- 研究：6个月；费用：金300、行动力20
- 养成类别：特技（skill）；使用次数上限：3
- 全部直接前置：统+5中（stat.leadership.medium）且能吏（skill.efficient-official）
- 图中中心坐标：794, 213
- 依据：atwiki-tree-05；atwiki-uses；zol-base；gamersky-tree

### 21. 捕缚（skill.capture）

- 来源标签：捕縛；版本：pk
- 研究：6个月；费用：金300、行动力20
- 养成类别：特技（skill）；使用次数上限：1
- 全部直接前置：名声（skill.fame）
- 图中中心坐标：909, 213
- 依据：atwiki-tree-05；atwiki-uses；zol-base；gamersky-tree

### 22. 骑兵A（aptitude.cavalry.a）

- 来源标签：騎兵A；版本：pk
- 研究：5个月；费用：金300、行动力20
- 养成类别：兵种适性（aptitude）；使用次数上限：5
- 全部直接前置：兵器A（aptitude.siege.a）
- 图中中心坐标：57, 298
- 依据：atwiki-tree-05；atwiki-uses；zol-base；gamersky-tree

### 23. 射程（skill.range）

- 来源标签：射程；版本：pk
- 研究：4个月；费用：金300、行动力20
- 养成类别：特技（skill）；使用次数上限：3
- 全部直接前置：骑兵B（aptitude.cavalry.b）
- 图中中心坐标：171, 298
- 依据：atwiki-tree-05；atwiki-uses；zol-base；gamersky-tree

### 24. 骑兵B（aptitude.cavalry.b）

- 来源标签：騎兵B；版本：pk
- 研究：4个月；费用：金300、行动力20
- 养成类别：兵种适性（aptitude）；使用次数上限：5
- 全部直接前置：兵器B（aptitude.siege.b）
- 图中中心坐标：284, 298
- 依据：atwiki-tree-05；atwiki-uses；zol-base；gamersky-tree

### 25. 兵器B（aptitude.siege.b）

- 来源标签：兵器B；版本：pk
- 研究：4个月；费用：金300、行动力20
- 养成类别：兵种适性（aptitude）；使用次数上限：5
- 全部直接前置：武+5低（stat.war.low）
- 图中中心坐标：397, 298
- 依据：atwiki-tree-05；atwiki-uses；zol-base；gamersky-tree

### 26. 铁壁（skill.iron-wall）

- 来源标签：鉄壁；版本：pk
- 研究：3个月；费用：金300、行动力20
- 养成类别：特技（skill）；使用次数上限：3
- 全部直接前置：统+5低（stat.leadership.low）且筑城（skill.fortification）
- 图中中心坐标：624, 298
- 依据：atwiki-tree-05；atwiki-uses；zol-base；gamersky-tree

### 27. 能吏（skill.efficient-official）

- 来源标签：能吏；版本：pk
- 研究：6个月；费用：金300、行动力20
- 养成类别：特技（skill）；使用次数上限：3
- 全部直接前置：繁殖（skill.breeding）
- 图中中心坐标：851, 298
- 依据：atwiki-tree-05；atwiki-uses；zol-base；gamersky-tree

### 28. 论客（skill.debater）

- 来源标签：論客；版本：pk
- 研究：6个月；费用：金300、行动力20
- 养成类别：特技（skill）；使用次数上限：1
- 全部直接前置：捕缚（skill.capture）且能吏（skill.efficient-official）
- 图中中心坐标：965, 298
- 依据：atwiki-tree-05；atwiki-uses；zol-base；gamersky-tree

### 29. 兵器A（aptitude.siege.a）

- 来源标签：兵器A；版本：pk
- 研究：5个月；费用：金300、行动力20
- 养成类别：兵种适性（aptitude）；使用次数上限：5
- 全部直接前置：射程（skill.range）
- 图中中心坐标：114, 383
- 依据：atwiki-tree-05；atwiki-uses；zol-base；gamersky-tree

### 30. 扫讨（skill.sweep）

- 来源标签：掃討；版本：pk
- 研究：3个月；费用：金300、行动力20
- 养成类别：特技（skill）；使用次数上限：3
- 全部直接前置：待伏（skill.ambush）
- 图中中心坐标：227, 383
- 依据：atwiki-tree-05；atwiki-uses；zol-base；gamersky-tree

### 31. 待伏（skill.ambush）

- 来源标签：待伏；版本：pk
- 研究：3个月；费用：金300、行动力20
- 养成类别：特技（skill）；使用次数上限：3
- 全部直接前置：知+5低（stat.intelligence.low）
- 图中中心坐标：341, 383
- 依据：atwiki-tree-05；atwiki-uses；zol-base；gamersky-tree

### 32. 知+5低（stat.intelligence.low）

- 来源标签：知+5低；版本：pk
- 研究：3个月；费用：金300、行动力20
- 养成类别：能力值（stat）；使用次数上限：5
- 全部直接前置：研究开始根节点（allOf为空）
- 图中中心坐标：454, 383
- 依据：atwiki-tree-05；atwiki-uses；zol-base；gamersky-tree

### 33. 政+5低（stat.politics.low）

- 来源标签：政+5低；版本：pk
- 研究：3个月；费用：金300、行动力20
- 养成类别：能力值（stat）；使用次数上限：5
- 全部直接前置：研究开始根节点（allOf为空）
- 图中中心坐标：568, 383
- 依据：atwiki-tree-05；atwiki-uses；zol-base；gamersky-tree

### 34. 筑城（skill.fortification）

- 来源标签：築城；版本：pk
- 研究：3个月；费用：金300、行动力20
- 养成类别：特技（skill）；使用次数上限：3
- 全部直接前置：政+5低（stat.politics.low）
- 图中中心坐标：681, 383
- 依据：atwiki-tree-05；atwiki-uses；zol-base；gamersky-tree

### 35. 繁殖（skill.breeding）

- 来源标签：繁殖；版本：pk
- 研究：6个月；费用：金300、行动力20
- 养成类别：特技（skill）；使用次数上限：3
- 全部直接前置：政+5高（stat.politics.high）
- 图中中心坐标：794, 383
- 依据：atwiki-tree-05；atwiki-uses；zol-base；gamersky-tree

### 36. 政+5高（stat.politics.high）

- 来源标签：政+5高；版本：pk
- 研究：6个月；费用：金300、行动力20
- 养成类别：能力值（stat）；使用次数上限：3
- 全部直接前置：发明（skill.invention）
- 图中中心坐标：909, 383
- 依据：atwiki-tree-05；atwiki-uses；zol-base；gamersky-tree

### 37. 知+5高（stat.intelligence.high）

- 来源标签：知+5高；版本：pk
- 研究：6个月；费用：金300、行动力20
- 养成类别：能力值（stat）；使用次数上限：3
- 全部直接前置：深谋（skill.deep-plan）
- 图中中心坐标：171, 468
- 依据：atwiki-tree-05；atwiki-uses；zol-base；gamersky-tree

### 38. 知+5中（stat.intelligence.medium）

- 来源标签：知+5中；版本：pk
- 研究：4个月；费用：金300、行动力20
- 养成类别：能力值（stat）；使用次数上限：5
- 全部直接前置：扫讨（skill.sweep）
- 图中中心坐标：284, 468
- 依据：atwiki-tree-05；atwiki-uses；zol-base；gamersky-tree

### 39. 魅+5低（stat.charisma.low）

- 来源标签：魅+5低；版本：pk
- 研究：3个月；费用：金300、行动力20
- 养成类别：能力值（stat）；使用次数上限：5
- 全部直接前置：知+5低（stat.intelligence.low）且政+5低（stat.politics.low）
- 图中中心坐标：511, 468
- 依据：atwiki-tree-05；atwiki-uses；zol-base；gamersky-tree

### 40. 魅+5高（stat.charisma.high）

- 来源标签：魅+5高；版本：pk
- 研究：6个月；费用：金300、行动力20
- 养成类别：能力值（stat）；使用次数上限：3
- 全部直接前置：魅+5中（stat.charisma.medium）
- 图中中心坐标：624, 468
- 依据：atwiki-tree-05；atwiki-uses；zol-base；gamersky-tree

### 41. 运搬（skill.transport）

- 来源标签：運搬；版本：pk
- 研究：3个月；费用：金300、行动力20
- 养成类别：特技（skill）；使用次数上限：3
- 全部直接前置：筑城（skill.fortification）
- 图中中心坐标：737, 468
- 依据：atwiki-tree-05；atwiki-uses；zol-base；gamersky-tree

### 42. 发明（skill.invention）

- 来源标签：発明；版本：pk
- 研究：4个月；费用：金300、行动力20
- 养成类别：特技（skill）；使用次数上限：3
- 全部直接前置：造船（skill.shipbuilding）
- 图中中心坐标：851, 468
- 依据：atwiki-tree-05；atwiki-uses；zol-base；gamersky-tree

### 43. 深谋（skill.deep-plan）

- 来源标签：深謀；版本：pk
- 研究：6个月；费用：金300、行动力20
- 养成类别：特技（skill）；使用次数上限：1
- 全部直接前置：明镜（skill.clear-mirror）
- 图中中心坐标：227, 553
- 依据：atwiki-tree-05；atwiki-uses；zol-base；gamersky-tree

### 44. 明镜（skill.clear-mirror）

- 来源标签：明鏡；版本：pk
- 研究：6个月；费用：金300、行动力20
- 养成类别：特技（skill）；使用次数上限：3
- 全部直接前置：知+5中（stat.intelligence.medium）且威压（skill.intimidation）
- 图中中心坐标：341, 553
- 依据：atwiki-tree-05；atwiki-uses；zol-base；gamersky-tree

### 45. 威压（skill.intimidation）

- 来源标签：威圧；版本：pk
- 研究：3个月；费用：金300、行动力20
- 养成类别：特技（skill）；使用次数上限：3
- 全部直接前置：魅+5低（stat.charisma.low）
- 图中中心坐标：454, 553
- 依据：atwiki-tree-05；atwiki-uses；zol-base；gamersky-tree

### 46. 魅+5中（stat.charisma.medium）

- 来源标签：魅+5中；版本：pk
- 研究：4个月；费用：金300、行动力20
- 养成类别：能力值（stat）；使用次数上限：5
- 全部直接前置：威压（skill.intimidation）
- 图中中心坐标：568, 553
- 依据：atwiki-tree-05；atwiki-uses；zol-base；gamersky-tree

### 47. 政+5中（stat.politics.medium）

- 来源标签：政+5中；版本：pk
- 研究：4个月；费用：金300、行动力20
- 养成类别：能力值（stat）；使用次数上限：5
- 全部直接前置：运搬（skill.transport）
- 图中中心坐标：681, 553
- 依据：atwiki-tree-05；atwiki-uses；zol-base；gamersky-tree

### 48. 造船（skill.shipbuilding）

- 来源标签：造船；版本：pk
- 研究：4个月；费用：金300、行动力20
- 养成类别：特技（skill）；使用次数上限：3
- 全部直接前置：政+5中（stat.politics.medium）
- 图中中心坐标：794, 553
- 依据：atwiki-tree-05；atwiki-uses；zol-base；gamersky-tree

## 10个隐藏槽位与50个候选

### 01. 武イ（hidden.war-i）

- 表行：武力イ；rule15位置：5；ZOL表位置：1
- 图示月数：6；图中中心坐标：57, 128
- 图示入边（imageIncoming）：枪兵A（aptitude.spear.a）；连战（skill.chain-attack）；武+5高（stat.war.high）

#### 候选1：乱战（hidden.war-i.option-1）

- 特技键：chaotic-combat；来源标签：乱戦；版本：pk
- 研究：6个月；费用：金300、行动力20
- 养成类别：特技（skill）；使用次数上限：5
- 全部直接前置：枪兵A（aptitude.spear.a）
- 依据：atwiki-hidden；zol-hidden；atwiki-editor-hidden

#### 候选2：掎角（hidden.war-i.option-2）

- 特技键：pincer；来源标签：掎角；版本：pk
- 研究：6个月；费用：金300、行动力20
- 养成类别：特技（skill）；使用次数上限：5
- 全部直接前置：连战（skill.chain-attack）
- 依据：atwiki-hidden；zol-hidden；atwiki-editor-hidden

#### 候选3：勇将（hidden.war-i.option-3）

- 特技键：brave-general；来源标签：勇将；版本：pk
- 研究：6个月；费用：金300、行动力20
- 养成类别：特技（skill）；使用次数上限：5
- 全部直接前置：枪兵A（aptitude.spear.a）
- 依据：atwiki-hidden；zol-hidden；atwiki-editor-hidden

#### 候选4：斗神（hidden.war-i.option-4）

- 特技键：war-god；来源标签：闘神；版本：pk
- 研究：6个月；费用：金300、行动力20
- 养成类别：特技（skill）；使用次数上限：5
- 全部直接前置：连战（skill.chain-attack）
- 依据：atwiki-hidden；zol-hidden；atwiki-editor-hidden

#### 候选5：疾走（hidden.war-i.option-5）

- 特技键：gallop；来源标签：疾走；版本：pk
- 研究：6个月；费用：金300、行动力20
- 养成类别：特技（skill）；使用次数上限：5
- 全部直接前置：武+5高（stat.war.high）
- 依据：atwiki-hidden；zol-hidden；atwiki-editor-hidden

### 02. 武ロ（hidden.war-ro）

- 表行：武力ロ；rule15位置：1；ZOL表位置：2
- 图示月数：3；图中中心坐标：227, 213
- 图示入边（imageIncoming）：连战（skill.chain-attack）；枪兵B（aptitude.spear.b）；弩兵B（aptitude.crossbow.b）；骑兵B（aptitude.cavalry.b）

#### 候选1：心攻（hidden.war-ro.option-1）

- 特技键：heart-attack；来源标签：心攻；版本：pk
- 研究：3个月；费用：金300、行动力20
- 养成类别：特技（skill）；使用次数上限：5
- 全部直接前置：骑兵B（aptitude.cavalry.b）
- 依据：atwiki-hidden；zol-hidden；atwiki-editor-hidden
- 关联冲突：heart-attack-months

#### 候选2：枪神（hidden.war-ro.option-2）

- 特技键：spear-god；来源标签：槍神；版本：pk
- 研究：3个月；费用：金300、行动力20
- 养成类别：特技（skill）；使用次数上限：3
- 全部直接前置：枪兵B（aptitude.spear.b）且连战（skill.chain-attack）
- 依据：atwiki-hidden；zol-hidden；atwiki-editor-hidden

#### 候选3：戟神（hidden.war-ro.option-3）

- 特技键：halberd-god；来源标签：戟神；版本：pk
- 研究：3个月；费用：金300、行动力20
- 养成类别：特技（skill）；使用次数上限：3
- 全部直接前置：弩兵B（aptitude.crossbow.b）且连战（skill.chain-attack）
- 依据：atwiki-hidden；zol-hidden；atwiki-editor-hidden

#### 候选4：弓神（hidden.war-ro.option-4）

- 特技键：bow-god；来源标签：弓神；版本：pk
- 研究：3个月；费用：金300、行动力20
- 养成类别：特技（skill）；使用次数上限：3
- 全部直接前置：弩兵B（aptitude.crossbow.b）且连战（skill.chain-attack）
- 依据：atwiki-hidden；zol-hidden；atwiki-editor-hidden

#### 候选5：水神（hidden.war-ro.option-5）

- 特技键：water-god；来源标签：水神；版本：pk
- 研究：3个月；费用：金300、行动力20
- 养成类别：特技（skill）；使用次数上限：3
- 全部直接前置：弩兵B（aptitude.crossbow.b）且连战（skill.chain-attack）
- 依据：atwiki-hidden；zol-hidden；atwiki-editor-hidden

### 03. 武ハ（hidden.war-ha）

- 表行：武力ハ；rule15位置：6；ZOL表位置：3
- 图示月数：6；图中中心坐标：57, 468
- 图示入边（imageIncoming）：知+5高（stat.intelligence.high）；兵器A（aptitude.siege.a）

#### 候选1：攻城（hidden.war-ha.option-1）

- 特技键：siege；来源标签：攻城；版本：pk
- 研究：6个月；费用：金300、行动力20
- 养成类别：特技（skill）；使用次数上限：5
- 全部直接前置：知+5高（stat.intelligence.high）且兵器A（aptitude.siege.a）
- 依据：atwiki-hidden；zol-hidden；atwiki-editor-hidden

#### 候选2：神将（hidden.war-ha.option-2）

- 特技键：divine-general；来源标签：神将；版本：pk
- 研究：6个月；费用：金300、行动力20
- 养成类别：特技（skill）；使用次数上限：5
- 全部直接前置：知+5高（stat.intelligence.high）且兵器A（aptitude.siege.a）
- 依据：atwiki-hidden；zol-hidden；atwiki-editor-hidden

#### 候选3：骑神（hidden.war-ha.option-3）

- 特技键：cavalry-god；来源标签：騎神；版本：pk
- 研究：6个月；费用：金300、行动力20
- 养成类别：特技（skill）；使用次数上限：3
- 全部直接前置：兵器A（aptitude.siege.a）
- 依据：atwiki-hidden；zol-hidden；atwiki-editor-hidden

#### 候选4：工神（hidden.war-ha.option-4）

- 特技键：engineering-god；来源标签：工神；版本：pk
- 研究：6个月；费用：金300、行动力20
- 养成类别：特技（skill）；使用次数上限：3
- 全部直接前置：兵器A（aptitude.siege.a）
- 依据：atwiki-hidden；zol-hidden；atwiki-editor-hidden

#### 候选5：猛者（hidden.war-ha.option-5）

- 特技键：fierce；来源标签：猛者；版本：pk
- 研究：6个月；费用：金300、行动力20
- 养成类别：特技（skill）；使用次数上限：5
- 全部直接前置：兵器A（aptitude.siege.a）
- 依据：atwiki-hidden；zol-hidden；atwiki-editor-hidden

### 04. 統イ（hidden.leadership-i）

- 表行：統率イ；rule15位置：2；ZOL表位置：6
- 图示月数：3；图中中心坐标：624, 128
- 图示入边（imageIncoming）：辅佐（skill.support）；金刚（skill.diamond）；统+5低（stat.leadership.low）；不屈（skill.indomitable）

#### 候选1：长驱（hidden.leadership-i.option-1）

- 特技键：long-drive；来源标签：長駆；版本：pk
- 研究：3个月；费用：金300、行动力20
- 养成类别：特技（skill）；使用次数上限：5
- 全部直接前置：金刚（skill.diamond）
- 依据：atwiki-hidden；zol-hidden；atwiki-editor-hidden

#### 候选2：踏破（hidden.leadership-i.option-2）

- 特技键：traverse；来源标签：踏破；版本：pk
- 研究：3个月；费用：金300、行动力20
- 养成类别：特技（skill）；使用次数上限：5
- 全部直接前置：金刚（skill.diamond）
- 依据：atwiki-hidden；zol-hidden；atwiki-editor-hidden

#### 候选3：血路（hidden.leadership-i.option-3）

- 特技键：blood-road；来源标签：血路；版本：pk
- 研究：3个月；费用：金300、行动力20
- 养成类别：特技（skill）；使用次数上限：5
- 全部直接前置：统+5低（stat.leadership.low）
- 依据：atwiki-hidden；zol-hidden；atwiki-editor-hidden

#### 候选4：护卫（hidden.leadership-i.option-4）

- 特技键：bodyguard；来源标签：護衛；版本：pk
- 研究：3个月；费用：金300、行动力20
- 养成类别：特技（skill）；使用次数上限：5
- 全部直接前置：不屈（skill.indomitable）
- 依据：atwiki-hidden；zol-hidden；atwiki-editor-hidden

#### 候选5：奏乐（hidden.leadership-i.option-5）

- 特技键：music；来源标签：楽奏；版本：pk
- 研究：3个月；费用：金300、行动力20
- 养成类别：特技（skill）；使用次数上限：3
- 全部直接前置：辅佐（skill.support）且不屈（skill.indomitable）
- 依据：atwiki-hidden；zol-hidden；atwiki-editor-hidden

### 05. 統ロ（hidden.leadership-ro）

- 表行：統率ロ；rule15位置：7；ZOL表位置：7
- 图示月数：6；图中中心坐标：909, 43
- 图示入边（imageIncoming）：霸王（skill.overlord）；统+5中（stat.leadership.medium）；统+5高（stat.leadership.high）

#### 候选1：飞将（hidden.leadership-ro.option-1）

- 特技键：flying-general；来源标签：飛将；版本：pk
- 研究：6个月；费用：金300、行动力20
- 养成类别：特技（skill）；使用次数上限：3
- 全部直接前置：统+5高（stat.leadership.high）且霸王（skill.overlord）
- 依据：atwiki-hidden；zol-hidden；atwiki-editor-hidden

#### 候选2：遁走（hidden.leadership-ro.option-2）

- 特技键：escape；来源标签：遁走；版本：pk
- 研究：6个月；费用：金300、行动力20
- 养成类别：特技（skill）；使用次数上限：3
- 全部直接前置：统+5中（stat.leadership.medium）
- 依据：atwiki-hidden；zol-hidden；atwiki-editor-hidden

#### 候选3：强行（hidden.leadership-ro.option-3）

- 特技键：forced-march；来源标签：強行；版本：pk
- 研究：6个月；费用：金300、行动力20
- 养成类别：特技（skill）；使用次数上限：3
- 全部直接前置：统+5高（stat.leadership.high）
- 依据：atwiki-hidden；zol-hidden；atwiki-editor-hidden

#### 候选4：藤甲（hidden.leadership-ro.option-4）

- 特技键：rattan-armor；来源标签：藤甲；版本：pk
- 研究：6个月；费用：金300、行动力20
- 养成类别：特技（skill）；使用次数上限：3
- 全部直接前置：统+5高（stat.leadership.high）
- 依据：atwiki-hidden；zol-hidden；atwiki-editor-hidden

#### 候选5：强运（hidden.leadership-ro.option-5）

- 特技键：fortune；来源标签：強運；版本：pk
- 研究：6个月；费用：金300、行动力20
- 养成类别：特技（skill）；使用次数上限：5
- 全部直接前置：统+5中（stat.leadership.medium）
- 依据：atwiki-hidden；zol-hidden；atwiki-editor-hidden

### 06. 知イ（hidden.intelligence-i）

- 表行：知力イ；rule15位置：10；ZOL表位置：4
- 图示月数：6；图中中心坐标：114, 553
- 图示入边（imageIncoming）：知+5高（stat.intelligence.high）；深谋（skill.deep-plan）

#### 候选1：虚实（hidden.intelligence-i.option-1）

- 特技键：feint；来源标签：虚実；版本：pk
- 研究：6个月；费用：金300、行动力20
- 养成类别：特技（skill）；使用次数上限：3
- 全部直接前置：知+5高（stat.intelligence.high）
- 依据：atwiki-hidden；zol-hidden；atwiki-editor-hidden

#### 候选2：洞察（hidden.intelligence-i.option-2）

- 特技键：insight；来源标签：洞察；版本：pk
- 研究：6个月；费用：金300、行动力20
- 养成类别：特技（skill）；使用次数上限：3
- 全部直接前置：知+5高（stat.intelligence.high）
- 依据：atwiki-hidden；zol-hidden；atwiki-editor-hidden

#### 候选3：神算（hidden.intelligence-i.option-3）

- 特技键：divine-calculation；来源标签：神算；版本：pk
- 研究：6个月；费用：金300、行动力20
- 养成类别：特技（skill）；使用次数上限：3
- 全部直接前置：深谋（skill.deep-plan）
- 依据：atwiki-hidden；zol-hidden；atwiki-editor-hidden

#### 候选4：百出（hidden.intelligence-i.option-4）

- 特技键：hundred-plans；来源标签：百出；版本：pk
- 研究：6个月；费用：金300、行动力20
- 养成类别：特技（skill）；使用次数上限：3
- 全部直接前置：知+5高（stat.intelligence.high）
- 依据：atwiki-hidden；zol-hidden；atwiki-editor-hidden

#### 候选5：鬼门（hidden.intelligence-i.option-5）

- 特技键：demon-gate；来源标签：鬼門；版本：pk
- 研究：6个月；费用：金300、行动力20
- 养成类别：特技（skill）；使用次数上限：3
- 全部直接前置：知+5高（stat.intelligence.high）
- 依据：atwiki-hidden；zol-hidden；atwiki-editor-hidden

### 07. 知ロ（hidden.intelligence-ro）

- 表行：知力ロ；rule15位置：4；ZOL表位置：5
- 图示月数：3；图中中心坐标：397, 468
- 图示入边（imageIncoming）：待伏（skill.ambush）；知+5低（stat.intelligence.low）；知+5中（stat.intelligence.medium）；明镜（skill.clear-mirror）

#### 候选1：看破（hidden.intelligence-ro.option-1）

- 特技键：perception；来源标签：看破；版本：pk
- 研究：3个月；费用：金300、行动力20
- 养成类别：特技（skill）；使用次数上限：3
- 全部直接前置：魅+5低（stat.charisma.low）且待伏（skill.ambush）
- 依据：atwiki-hidden；zol-hidden；atwiki-editor-hidden

#### 候选2：火神（hidden.intelligence-ro.option-2）

- 特技键：fire-god；来源标签：火神；版本：pk
- 研究：3个月；费用：金300、行动力20
- 养成类别：特技（skill）；使用次数上限：3
- 全部直接前置：知+5中（stat.intelligence.medium）
- 依据：atwiki-hidden；zol-hidden；atwiki-editor-hidden

#### 候选3：鬼谋（hidden.intelligence-ro.option-3）

- 特技键：demonic-plan；来源标签：鬼謀；版本：pk
- 研究：3个月；费用：金300、行动力20
- 养成类别：特技（skill）；使用次数上限：3
- 全部直接前置：知+5低（stat.intelligence.low）且明镜（skill.clear-mirror）
- 依据：atwiki-hidden；zol-hidden；atwiki-editor-hidden

#### 候选4：连环（hidden.intelligence-ro.option-4）

- 特技键：chain-plan；来源标签：連環；版本：pk
- 研究：3个月；费用：金300、行动力20
- 养成类别：特技（skill）；使用次数上限：3
- 全部直接前置：魅+5低（stat.charisma.low）且待伏（skill.ambush）
- 依据：atwiki-hidden；zol-hidden；atwiki-editor-hidden

#### 候选5：反计（hidden.intelligence-ro.option-5）

- 特技键：counter-plan；来源标签：反計；版本：pk
- 研究：3个月；费用：金300、行动力20
- 养成类别：特技（skill）；使用次数上限：3
- 全部直接前置：知+5低（stat.intelligence.low）且待伏（skill.ambush）
- 依据：atwiki-hidden；zol-hidden；atwiki-editor-hidden

### 08. 政イ（hidden.politics-i）

- 表行：政治イ；rule15位置：3；ZOL表位置：8
- 图示月数：3；图中中心坐标：737, 298
- 图示入边（imageIncoming）：不屈（skill.indomitable）；筑城（skill.fortification）；繁殖（skill.breeding）

#### 候选1：指导（hidden.politics-i.option-1）

- 特技键：guidance；来源标签：指導；版本：pk
- 研究：3个月；费用：金300、行动力20
- 养成类别：特技（skill）；使用次数上限：5
- 全部直接前置：不屈（skill.indomitable）且筑城（skill.fortification）
- 依据：atwiki-hidden；zol-hidden；atwiki-editor-hidden

#### 候选2：眼力（hidden.politics-i.option-2）

- 特技键：discernment；来源标签：眼力；版本：pk
- 研究：3个月；费用：金300、行动力20
- 养成类别：特技（skill）；使用次数上限：5
- 全部直接前置：不屈（skill.indomitable）且筑城（skill.fortification）
- 依据：atwiki-hidden；zol-hidden；atwiki-editor-hidden

#### 候选3：征税（hidden.politics-i.option-3）

- 特技键：taxation；来源标签：徴税；版本：pk
- 研究：3个月；费用：金300、行动力20
- 养成类别：特技（skill）；使用次数上限：3
- 全部直接前置：繁殖（skill.breeding）
- 依据：atwiki-hidden；zol-hidden；atwiki-editor-hidden

#### 候选4：风水（hidden.politics-i.option-4）

- 特技键：feng-shui；来源标签：風水；版本：pk
- 研究：3个月；费用：金300、行动力20
- 养成类别：特技（skill）；使用次数上限：5
- 全部直接前置：筑城（skill.fortification）
- 依据：atwiki-hidden；zol-hidden；atwiki-editor-hidden

#### 候选5：祈愿（hidden.politics-i.option-5）

- 特技键：prayer；来源标签：祈願；版本：pk
- 研究：3个月；费用：金300、行动力20
- 养成类别：特技（skill）；使用次数上限：5
- 全部直接前置：筑城（skill.fortification）
- 依据：atwiki-hidden；zol-hidden；atwiki-editor-hidden
- 关联冲突：prayer-use-limit

### 09. 政ロ（hidden.politics-ro）

- 表行：政治ロ；rule15位置：8；ZOL表位置：9
- 图示月数：6；图中中心坐标：965, 468
- 图示入边（imageIncoming）：政+5高（stat.politics.high）；发明（skill.invention）

#### 候选1：米道（hidden.politics-ro.option-1）

- 特技键：rice；来源标签：米道；版本：pk
- 研究：6个月；费用：金300、行动力20
- 养成类别：特技（skill）；使用次数上限：5
- 全部直接前置：发明（skill.invention）
- 依据：atwiki-hidden；zol-hidden；atwiki-editor-hidden

#### 候选2：米道（hidden.politics-ro.option-2）

- 特技键：rice；来源标签：米道；版本：pk
- 研究：6个月；费用：金300、行动力20
- 养成类别：特技（skill）；使用次数上限：5
- 全部直接前置：政+5高（stat.politics.high）
- 依据：atwiki-hidden；zol-hidden；atwiki-editor-hidden

#### 候选3：征收（hidden.politics-ro.option-3）

- 特技键：collection；来源标签：徴収；版本：pk
- 研究：6个月；费用：金300、行动力20
- 养成类别：特技（skill）；使用次数上限：5
- 全部直接前置：发明（skill.invention）
- 依据：atwiki-hidden；zol-hidden；atwiki-editor-hidden

#### 候选4：征收（hidden.politics-ro.option-4）

- 特技键：collection；来源标签：徴収；版本：pk
- 研究：6个月；费用：金300、行动力20
- 养成类别：特技（skill）；使用次数上限：5
- 全部直接前置：政+5高（stat.politics.high）
- 依据：atwiki-hidden；zol-hidden；atwiki-editor-hidden

#### 候选5：征收（hidden.politics-ro.option-5）

- 特技键：collection；来源标签：徴収；版本：pk
- 研究：6个月；费用：金300、行动力20
- 养成类别：特技（skill）；使用次数上限：5
- 全部直接前置：政+5高（stat.politics.high）且发明（skill.invention）
- 依据：atwiki-hidden；zol-hidden；atwiki-editor-hidden

### 10. 政ハ（hidden.politics-ha）

- 表行：政治ハ；rule15位置：9；ZOL表位置：10
- 图示月数：6；图中中心坐标：909, 553
- 图示入边（imageIncoming）：发明（skill.invention）；造船（skill.shipbuilding）

#### 候选1：屯田（hidden.politics-ha.option-1）

- 特技键：farming；来源标签：屯田；版本：pk
- 研究：6个月；费用：金300、行动力20
- 养成类别：特技（skill）；使用次数上限：5
- 全部直接前置：造船（skill.shipbuilding）且发明（skill.invention）
- 依据：atwiki-hidden；zol-hidden；atwiki-editor-hidden

#### 候选2：屯田（hidden.politics-ha.option-2）

- 特技键：farming；来源标签：屯田；版本：pk
- 研究：6个月；费用：金300、行动力20
- 养成类别：特技（skill）；使用次数上限：5
- 全部直接前置：造船（skill.shipbuilding）
- 依据：atwiki-hidden；zol-hidden；atwiki-editor-hidden

#### 候选3：屯田（hidden.politics-ha.option-3）

- 特技键：farming；来源标签：屯田；版本：pk
- 研究：6个月；费用：金300、行动力20
- 养成类别：特技（skill）；使用次数上限：5
- 全部直接前置：发明（skill.invention）
- 依据：atwiki-hidden；zol-hidden；atwiki-editor-hidden

#### 候选4：仁政（hidden.politics-ha.option-4）

- 特技键：benevolence；来源标签：仁政；版本：pk
- 研究：6个月；费用：金300、行动力20
- 养成类别：特技（skill）；使用次数上限：5
- 全部直接前置：造船（skill.shipbuilding）
- 依据：atwiki-hidden；zol-hidden；atwiki-editor-hidden

#### 候选5：仁政（hidden.politics-ha.option-5）

- 特技键：benevolence；来源标签：仁政；版本：pk
- 研究：6个月；费用：金300、行动力20
- 养成类别：特技（skill）；使用次数上限：5
- 全部直接前置：发明（skill.invention）
- 依据：atwiki-hidden；zol-hidden；atwiki-editor-hidden

## 图示覆盖

- 研究起点（start）：
  - 来源标签（sourceLabel）：研究開始
  - 图中中心坐标（imageCenter）：
    - 1. 511
    - 2. 298
- 起点指向（startTargets）：
  - 1. stat.war.low
  - 2. stat.leadership.low
  - 3. stat.intelligence.low
  - 4. stat.politics.low
- 基础节点数（baseNodeCount）：48
- 隐藏槽位数（hiddenSlotCount）：10
- 基础箭头数（baseArrowCount）：52
- 起点箭头数（startArrowCount）：4
- 隐藏箭头数（hiddenArrowCount）：29

## 6项来源冲突与资料处理

### hidden-intelligence-image-arrow

隐藏知ロ的图示没有魅力低到槽位的箭头，但Wiki和ZOL表都写看破、连环需要魅力低且待伏。保留图示实际入边，候选前置采用明确表格；两种记录不互相覆盖。

- 标识（id）：hidden-intelligence-image-arrow
- 字段（field）：imageIncoming
- 来源取值（values）：
  - 第1项：
    - 来源（source）：atwiki-tree-05
    - 原值（value）：no stat.charisma.low -> hidden.intelligence-ro arrow
  - 第2项：
    - 来源（source）：atwiki-hidden
    - 原值（value）：perception and chain-plan require stat.charisma.low AND skill.ambush
  - 第3项：
    - 来源（source）：zol-hidden
    - 原值（value）：same AND prerequisites as the wiki table
- 资料中的处理与限制（resolution）：Use the explicit table for option prerequisites; preserve the actual image arrow set independently.

### heart-attack-months

心攻：树图与编辑器截图为3个月，旧ZOL为6个月。目录取攻略值3；截图不能认证纯净原生数据。

- 标识（id）：heart-attack-months
- 字段（field）：months
- 来源取值（values）：
  - 第1项：
    - 来源（source）：atwiki-tree-05
    - 原值（value）：3
  - 第2项：
    - 来源（source）：zol-hidden
    - 原值（value）：6
  - 第3项：
    - 来源（source）：atwiki-editor-hidden
    - 原值（value）：3
- 资料中的处理与限制（resolution）：Guide value3: linked screenshot row48 corroborates image duration3 against older ZOL6. Native clean-stock equivalence remains unverified.

### prayer-use-limit

祈愿：Wiki与编辑器截图为5次，旧ZOL为3次。目录取攻略值5，祈願/祈祷保留为来源别名；原生等价性仍未确认。

- 标识（id）：prayer-use-limit
- 字段（field）：useLimit
- 来源取值（values）：
  - 第1项：
    - 来源（source）：atwiki-hidden
    - 原值（value）：5
  - 第2项：
    - 来源（source）：zol-hidden
    - 原值（value）：3
  - 第3项：
    - 来源（source）：atwiki-editor-hidden
    - 原值（value）：5
- 资料中的处理与限制（resolution）：Guide value5: linked screenshot row62 corroborates wiki table5 against older ZOL3. Names 祈願 and 祈祷 are source aliases; native clean-stock equivalence remains unverified.

### hidden-selection-count

ZOL开头称6个，后文称5个，Wiki与游民称5个。目录记录多数来源默认5，同时保留ZOL内部冲突，不补选择算法。

- 标识（id）：hidden-selection-count
- 字段（field）：semantics.hiddenSelection.documentedSlotsSelected
- 来源取值（values）：
  - 第1项：
    - 来源（source）：zol-hidden
    - 原值（value）：article opening says6; later note says5
  - 第2项：
    - 来源（source）：atwiki-hidden
    - 原值（value）：5
  - 第3项：
    - 来源（source）：gamersky-hidden
    - 原值（value）：5
- 资料中的处理与限制（resolution）：Record the majority documented default5, preserve ZOL internal conflict; no selection algorithm or RNG implementation.

### halberd-b-predecessor

戟兵B：直接查看的Wiki树图前置为武力低，较早游民文字写统率低。目录随图示，仍保留文字冲突及原生前置未验证的边界。

- 标识（id）：halberd-b-predecessor
- 字段（field）：baseNodes.aptitude.halberd.b.prerequisites
- 来源取值（values）：
  - 第1项：
    - 来源（source）：atwiki-tree-05
    - 原值（value）：stat.war.low
  - 第2项：
    - 来源（source）：gamersky-tree
    - 原值（value）：stat.leadership.low
- 资料中的处理与限制（resolution）：This base-tree transcription follows the directly viewed latest wiki image. The older prose disagrees; clean-stock native prerequisite equivalence remains unverified.

### collection-invention-only

征收：Wiki明确列有仅需发明的候选，旧ZOL路径摘要只列政治高或政治高加发明。表列各列分别保留，不把摘要当完整穷举。

- 标识（id）：collection-invention-only
- 字段（field）：hiddenSlots.hidden.politics-ro.option-3.prerequisites
- 来源取值（values）：
  - 第1项：
    - 来源（source）：atwiki-hidden
    - 原值（value）：skill.invention alone is one of three collection variants
  - 第2项：
    - 来源（source）：zol-hidden
    - 原值（value）：path summary lists politics-high or politics-high plus invention; invention-only is omitted
- 资料中的处理与限制（resolution）：Preserve every explicit wiki table column as a separate alternative; the older summary is not exhaustive.

## 完整语义原注

- basePrerequisites：allOf: every listed direct predecessor must be completed; empty means research-start root
- hiddenAlternatives：Exactly one alternative at an active slot is fixed at game start. Alternatives are possibilities, not simultaneous unlockable nodes; never OR their prerequisites to bypass a selected alternative.
- hiddenSelection：
  - documentedSlotsSelected：5
  - candidateSlots：10
  - algorithm：open
  - rng：open
- fieldResolution：All fields are explicit source-backed guide values. Historical contradictions remain in conflicts; the linked editor screenshot corroborates heart-attack3 months and prayer5 uses without certifying native stock data.

## 仍未确定的边界

- 开局隐藏项选择算法、权重与全局随机数
- 完整研究/武将养成命令的资格、效果与调度
- 原生取消与完成的整合
- 攻略分歧以及选定攻略数值与原生数据的一致性
- 纯净PC-PK1.1的可执行文件/运行时对应、原版与主机的等价性

- 1. Hidden startup selection algorithm, weighting and global RNG
- 2. Complete ability-research and officer-training commands, eligibility, effects and scheduler
- 3. Native cancellation and completion integration
- 4. Documented source disagreements and native agreement with selected guide values remain unverified
- 5. Clean-stock PC-PK1.1 executable/runtime equivalence, Vanilla and console parity

## 字段覆盖

静态条目数为48个基础节点、52条直接AND前置、10个隐藏槽位、29条隐藏图示入边、50个隐藏候选、66条候选直接AND前置和6项冲突。研究开始另有4条图示箭头。

48个基础节点逐项保留id、name、sourceLabel、version、months、costGold、costAP、trainingCategory、useLimit、prerequisites.allOf、imageCenter、evidence及存在的conflicts。10个槽位逐项保留id、sourceLabel、tableRow、rule15Position、zolTablePosition、imageMonths、imageCenter、imageIncoming；50个候选逐项保留id、tableColumn、skillKey、name、sourceLabel、version、months、costGold、costAP、trainingCategory、useLimit、prerequisites.allOf、evidence及存在的conflicts。6项冲突的字段、各来源取值、处理与限制全部保留。
省略仅限$schema、schemaVersion、provenance.baselineCommit及图片SHA-256摘要；图片尺寸/坐标、9项来源、完整semantics、imageCoverage及5项openBoundaries均已列出。
