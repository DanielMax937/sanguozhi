# 2026-09-29 证据审计：provisional → confirmed / empirical-high

本轮目标不是“让每条看起来确定”，而是把**真正有可复核证据的规则升级**，并删除错误的临时式。

## 升级结果

| 规则 | 旧状态 | 新状态 | 结论 |
|---|---|---|---|
| 行动力 | incomplete | empirical-high | 原版逆向公式 + PK存档复算，完整分解到君主/城数/武将/军师/符节台 |
| 地形移动成本 | 不完整 | confirmed | 兵科×地形完整移动成本表已补 |
| 战法地形限制 | 部分 | confirmed | 枪/戟/骑/弩逐地形表已补 |
| 商人买卖 | provisional | empirical-high | 买粮无固定损失；卖粮固定×0.8；政治交易效果实测表 |
| PK人才府 | 模糊“缩短” | confirmed | 技巧研究固定缩短20日 |
| 征兵主能力 | 错误政治公式 | confirmed机制 | 主能力为魅力；旧 `1000+政治×15` 删除 |
| 名声 | 已知 | confirmed | 征兵量×1.5，治安下降也×1.5 |
| 兵装生产量 | provisional | empirical-high | 完整智力组合公式 |
| 兵器/舰船工期 | 部分 | empirical-high | 综合智力+门槛表+特技减半+练兵所 |
| 粮尽逃兵 | 未知 | empirical-high | N旬后剩余 `A×0.76^N` |
| 登用门槛 | 自拟评分 | empirical-high | 配偶/义兄弟/亲爱/嫌恶/忠诚+义理优先级 |
| 最终战斗伤害 | 自拟sqrt式 | empirical-high (PC-PK) | 换成完整玩家逆向公式；仍需Vanilla回归 |
| 火计伤害 | 模糊 | empirical-high | 400±100、会心×1.2、爆炼/踏破/火神/藤甲顺序 |
| 城陷落设施保留 | 未知 | empirical-high | 魅力100/80/60/40档保留5/4/3/2/1 |
| 外交 | 大量缺失 | empirical-high (PK/后期PC) | 亲善/同盟/停战/劝降/交换俘虏逆向公式 |
| 汉室态度 | 缺 | empirical-high | 授爵/自称忠诚修正、拥立+10、废立-10 |
| 遗迹/庙 | 缺 | empirical-high | 发现条件、数量平台差异、按月份奖励、特技奖励 |
| 单挑 | 大量 provisional | empirical-high | 4方针、必杀消耗/基准伤害、辅助动作 |
| 舌战手牌 | 边界错误 | empirical-high | <70=3、70段=4、80段=5、≥90=6 |
| 舌战再考 | 旧规则错误 | empirical-high | 4段足场，每崩一段恢复再考，通常整场4次 |
| 武将寿命 | 模糊 | empirical-high | 自然死/不自然死大致时序已明确 |
| 忠诚自然下降触发 | 模糊 | empirical-high | 换季；相性差≥25，或低义理+高野望；下降幅度仍未闭式 |
| 委任AI | 空白 | empirical | 固定设施、治安、兵装/兵力阈值、输送倾向 |

## 仍未升级的原因

### 征兵人数
资料一致确认魅力、兵舍等级、名声，但没有找到可复核的完整魅力→人数闭式。

### 普通登用概率
确定性门槛已确认；门槛之外的概率函数仍未知。

### 战斗公式的版本边界
完整公式来自长期玩家逆向且可计算，但发表在中文PK讨论区。它足以取代旧自拟式，但在没有 Vanilla 多版本回归前不升为跨版本 confirmed。

### 外交公式的版本边界
公式在多个中文站点长期一致转载，但缺原始源码/官方数学式，而且官方补丁曾调整过部分行为的可能性不能排除。因此标 PC-PK/后期 empirical-high。

## 主要证据

- 游民星空：买卖粮公式
  https://www.gamersky.com/handbook/200712/89446.shtml
- 游民星空：行动力深入研究
  https://www.gamersky.com/handbook/200603/21611.shtml
- 游侠：战斗伤害逆向公式
  https://game.ali213.net/thread-5983352-1-1.html
- 日文Wiki：内政
  https://w.atwiki.jp/sangokushi11/pages/74.html
- 日文Wiki：战争
  https://w.atwiki.jp/sangokushi11/pages/85.html
- 日文Wiki：兵科
  https://w.atwiki.jp/sangokushi11/pages/91.html
- 日文Wiki：伤害验证
  https://w.atwiki.jp/sangokushi11/pages/92.html
- 日文Wiki：人物关系
  https://w.atwiki.jp/sangokushi11/pages/95.html
- 日文Wiki：能力/魅力
  https://w.atwiki.jp/sangokushi11/pages/1598.html
- 日文Wiki：单挑
  https://w.atwiki.jp/sangokushi11/pages/2481.html
- 日文Wiki：舌战
  https://w.atwiki.jp/sangokushi11/pages/141.html
- 日文Wiki：遗迹庙
  https://w.atwiki.jp/sangokushi11/pages/968.html
- 日文Wiki：隐藏数据/汉室
  https://w.atwiki.jp/sangokushi11/pages/983.html
- 游侠知道/百度转载：外交逆向公式
  https://zhidao.ali213.net/q/13047392.html
  https://zhidao.baidu.com/question/693845718520080364/answer/2870151990.html


## 第三轮补证（同日）

### 官方说明书确认：征兵
官方《三國志11 with パワーアップキット》说明书明确：
- 征兵需要兵舍；
- 金300、行动力20、最多3人；
- 魅力合计越高征兵量越大；
- 城市周围2格存在敌部队时征兵量下降。

因此“征兵核心能力=魅力、邻敌降低征兵量”升级为 **confirmed**；只有精确连续公式仍 open。

### 忠诚自然下降
日文 Wiki 的长期实测页明确：
- 换季时才做自然下降；
- 相性与君主差≥25，或“低/较低义理 + 高/较高野望”时进入下降候选；
- 下降幅度还受君主义理/野望影响。

这部分升级为 **empirical-high**；精确下降点数继续 open。

### 贼与异民族
确认：
- 治安 <80 时才可能生成根城；
- 根城一旦存在，即使后来治安100也会继续生成贼/异族，直到根城被毁；
- 乌丸/羌为骑兵；山越/南蛮为枪/戟；
- 贼/异族攻陷城市后，该城市变为空白地。

来源：https://w.atwiki.jp/sangokushi11/pages/74.html
