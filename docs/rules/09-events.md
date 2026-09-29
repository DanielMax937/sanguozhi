# 通用事件、历史事件、遗迹与庙

## 1. 事件数据模型

每个事件必须包含：

- 版本/平台
- 剧本、日期范围
- 势力/城市/武将状态
- 行动済/任务中条件
- 外交/爵位/汉帝条件
- 一次性 flag
- 结果事件列表

## 2. 历史事件

大量历史事件已经有逐条条件资料，不能再把“历史事件”整体视为未知。例如：

- 连环计系列
- 曹操之死
- 刘备之死
- 汉中王即位
- 五虎将
- 三顾茅庐等

部分事件甚至明确指定继承顺序、忠诚/治安/气力变化。

来源入口：
- https://w.atwiki.jp/sangokushi11/pages/88.html
- https://w.atwiki.jp/sangokushi11/pages/100.html

因此当前缺口从“规则未知”降级为：**把已有事件页结构化抄录成 scenario-events 数据**。

## 3. 遗迹 / 庙

`[PC][empirical-high]`

- 候选点中开局随机配置。
- PC 常见配置：遗迹 1、庙 6。
- PS2 无印：遗迹 4、庙 4。
- CS/PK 报告：遗迹 6、庙 6。
- PC 发现条件：主将功绩 ≥10000、部队魅力 ≥80，并移动到候选点**相邻格**。
- 主机版条件更宽松，未完全满足也可能发现。

来源：
- https://w.atwiki.jp/sangokushi11/pages/149.html
- https://w.atwiki.jp/sangokushi11/pages/968.html

### 遗迹奖励

发现后选择一名所属武将，按发现月份提升 1 点素质/适性：

| 月 | 提升 |
|---:|---|
| 1 | 骑兵 |
| 2 | 统率 |
| 3 | 弩兵 |
| 4 | 武力 |
| 5 | 兵器 |
| 6 | 魅力 |
| 7 | 水军 |
| 8 | 智力 |
| 9 | 枪兵 |
| 10 | 政治 |
| 11 | 戟兵 |
| 12 | 魅力 |

发现部队所有武将魅力经验 +10。

### 庙奖励

- 选择一名所属武将学习特技；已有特技则替换。
- 一般第 4 座及以后可出现最高级特技。
- CSPK 有“从第一座即可学最高级特技”的平台差异。
- 发现部队所有武将魅力经验 +10。

### 尚缺

候选点**完整坐标清单**仍需要结构化导入；规则本身已不再 provisional。

## 4. 评定

### 4.1 流程

`[COMMON][confirmed-static/manual]`

评定是两阶段决策，不是单层建议：

```text
方针提案
→ 君主采决（单个 / 部分 / 全部 / 全否）
→ 具体案提案
→ 君主采决（单个 / 部分 / 全部 / 全否）
→ 被采纳提案执行
```

官方 PK 手册：君主在据点时可以召开，最多6人参加；评定命令本身不耗金钱、行动力，结束后配下根据结果行动。

来源：
- https://cdn.akamai.steamstatic.com/steam/apps/628070/manuals/32sangokushi11wpk_manual.pdf
- https://w.atwiki.jp/sangokushi11/pages/202.html
- https://w.atwiki.jp/sangokushi11/pages/639.html

### 4.2 原版具体提案池：22类

`[COMMON][confirmed-static-message-data]`

原版 `msg2966~3288 君主评定` 可恢复：

```text
内政建设
征兵
生产兵装
巡查
训练
侵略
迎击
军事建设
探索
登用
献上（亲善/赠礼）
同盟
同盟破弃
停战
劝降
交换俘虏
求援
二虎竞食
驱虎吞狼
流言
任命军师
撤除设施
```

并有独立“赞同他人 / 赞同提议 / 中止评定”文本。

旧 fallback 的 `技巧研究 / 输送 / 褒赏` 不在评定 MSG 提案段，已从 fidelity pool 删除。

来源：https://www.sanguogame.com.cn/special/san11/1920.html

### 4.3 第一阶段方针

角色页显示三大类：

```text
内政 / 出阵 / 外交・计略
```

MSG 内部又区分“建议攻击 / 建议迎击 / 建议内政 / 建议外交”，所以引擎把攻击与迎击作为 `出阵` 的两个内部子类保存。

### 4.4 执行与成本

`[manual + empirical-high]`

评定本身成本为0，但采纳的实际方案并非免费行动。原版时期玩家明确抱怨“如果采纳评定进言不消耗行动力还说得过去”，说明实际采纳会消耗行动力。

因此采纳 proposal 后必须 dispatch 到对应普通 Command，并至少沿用其行动力和合法性校验；金钱/兵粮/技巧P等资源成本也走普通 Command service，后者在拿到原评定调用图前标兼容假设。

评定本身获得技巧P +10。

来源：
- https://w.atwiki.jp/sangokushi11/pages/1875.html
- https://www.sanguogame.com.cn/special/san11/san11-xd14.html

### 4.5 谁会提什么：仍 open

SIRE 能确认武将有隐藏 `StrategicTendency` 字段，但尚未找到它被评定 selector 读取的 xref。旧玩家也只是在猜性格/知力是否参与。

因此不把 `战略倾向 / 性格 / 五维` 写成 confirmed proposal 权重。

第一版只在**原版22类 + 当前合法目标**中，使用局势 urgency + 小幅稳定武将偏好 + 随机扰动生成方案；重复方案转为“赞同他人”。详细 fallback 见 `16-unresolved-rules-fallbacks.md#13-评定完整提案池`。

来源：
- https://github.com/sean2077/311SireCustomizedPackageDev/blob/dev/material/结构体汇总.md
- https://w.atwiki.jp/sangokushi11/pages/1919.html

## 5. 通用事件

应数据化：

- 推举
- 义兄弟/结婚
- 官爵授予
- 武将登场/死亡/下野
- 汉帝援助
- 宝物/铜雀
- 其他角色事件

历史事件关闭时，只关闭历史剧情类事件；自然死亡、灾害、爵位等普通规则继续运行。


## 7. 史实事件资料状态

`[COMMON/版本需逐事件标注][confirmed source availability]`

历史事件已经不属于“规则资料找不到”的问题。游民星空发布的《全剧情发生条件官方资料》给出了大量事件的逐项**条件与结果**，日文攻略 Wiki 也有对应事件页，可以直接转录成结构化数据。

例如“三顾之礼 3”明确包含：

- 前置事件“二顾”后至少30日；
- 玩家君主为刘备；
- 诸葛亮达到登场年龄且在野/未发现；
- 刘备支配新野且支配都市≤2；
- 势力中有关羽、张飞；
- 诸葛亮处于留守状态；
- 刘备、关羽、张飞不在任务中。

结果包括诸葛亮加入、军师身份、忠诚100、功绩12000，并按女性史实武将设置处理黄月英/诸葛均。

因此后续应新增 `data/scenario-events/*.json` 批量录入，而不是继续把“历史事件”列为未知机制。

来源：
- https://www.gamersky.com/handbook/200809/124174_7.shtml
- https://www.gamersky.com/handbook/200809/124174_8.shtml
- https://www.gamersky.com/handbook/200809/124174_10.shtml
- https://w.atwiki.jp/sangokushi11/pages/88.html
