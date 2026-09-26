# 文字版《三国志11》实现方案与架构

> 状态：v0.1 设计稿　日期：2026-09-22
>
> 目标：用纯文字复刻《三国志11（含PK）》全部游戏机制与数值；游戏主体为 Next.js Web 应用；AI 玩家由独立的 Laya 决策服务驱动；二期用 PixiJS 替换文字渲染层而不改动引擎。

---

## 0. 关键前提与结论（先读）

| 议题 | 结论 | 对架构的影响 |
|---|---|---|
| Laya 是什么 | Convai Innovations 2026-09 发布的开源（Apache-2.0）**非自回归决策模型**：ModernBERT-large 421M / mmBERT-base 322M。输入 `state`（文本或 JSON）+ 类型化问题（`choice` / `score` / `noul`），单次前向 ~33 ms 输出带校准概率的答案。**不生成文本，不做规划，上下文 512/1024 token，`choice` 选项建议 ≤ 20 个，零样本接近随机，需微调。** | AI 层 = "引擎枚举合法候选 → Laya 打分 → 引擎执行"。必须有**规则 AI**作教师与兜底；状态需压缩编码；一期 Laya 只做"影子模式"采集数据，二期微调后上线。 |
| 数值一致性 | 三国志11 全部规则数值可从 `Scenario.s11` 经 San11Editor 导出（设施/兵器/技巧/战法/官职/爵位/特技/地形表），武将 850 人全字段表有公开 HTML/XLS。 | 引擎**完全数据驱动**：规则表是 JSON，公式在代码；所有"魔法数字"必须来自数据包并带出处。 |
| 版权 | 数值与人物属性属事实性数据；**头像、列传原文、音乐、地图贴图不得复制**。 | 数据包只含数值；列传二期自写或留空；PixiJS 阶段美术自制/开源素材。 |
| "阵型" | 三国志11 本身没有 9/13 代那种"陣形"系统。空间决策体现在：城外**设施排列**（六邻格加成/吸收合并）、部队**编成**（主将+2 副将、兵种、兵器）、以及部队在六角格地图上的**站位**（ZOC、战法范围、火计、军乐台/阵/箭楼范围、包围）。 | 文字版需要一套"六角格文字表达 + 相对/模板指令 + 效果预览"的交互协议（见 §6）。 |

---

## 1. 总体架构

```mermaid
flowchart LR
  subgraph Browser
    UI[文字 UI<br/>Next.js/React<br/>一期]
    PIXI[PixiJS 渲染层<br/>二期]
  end
  subgraph Web["apps/web (Next.js 15, Node runtime)"]
    RH[Route Handlers / Server Actions]
    SSE[SSE 事件流]
    GS[GameSession 调度器]
  end
  subgraph Core["packages/*  (纯 TypeScript, 无 IO)"]
    ENG[engine<br/>规则/回合/战斗/内政]
    DATA[data<br/>JSON 规则表 + zod schema]
    AIR[ai-rules<br/>规则 AI(教师/兜底)]
    PROTO[protocol<br/>命令/事件/AI 契约]
    TXT[text-render<br/>六角格 ASCII/表格]
  end
  subgraph AI["services/ai-laya (Python 3.12, FastAPI)"]
    API[/v1/decide  /v1/decide/batch/]
    LAYA[Laya Router<br/>multilingual 1024ctx]
    TRAIN[training/<br/>数据构建 + RLCD 微调]
  end
  DB[(Postgres/SQLite<br/>存档快照 + 事件日志)]

  UI --> RH
  PIXI --> RH
  RH --> GS --> ENG
  ENG --> DATA
  GS --> AIR
  AIR -- 候选+状态编码 --> API
  API --> LAYA
  GS --> DB
  GS --> SSE --> UI
  DB -- 事件日志导出 --> TRAIN
  TRAIN -- 微调权重 --> LAYA
```

### 1.1 设计原则

1. **引擎与表现彻底分离**：`engine` 只接受 `Command`、产出 `Event[]` 和新 `GameState`，不知道文字/像素的存在。一期文字、二期 PixiJS 消费同一事件流。
2. **确定性**：全部随机来自可注入的种子 PRNG（xoshiro128\*\*）。`hash(state0) + commands[] + seed` ⇒ 唯一 `stateN`。这是回放、测试、AI 训练数据可复现的基础。
3. **命令/事件溯源**：存档 = 快照 + 事件日志。事件日志同时是 Laya 的训练语料。
4. **数据驱动**：任何数值改动只改 `packages/data`，引擎代码只有公式。
5. **AI 三层兜底**：Laya（微调后）→ 规则 AI → 随机合法动作。任何一层不可用不影响游戏进行。

### 1.2 Monorepo 目录

```
sanguozhi/
├─ apps/
│  └─ web/                    # Next.js 15 (App Router, React 19, TS)
│     ├─ app/(game)/...       # 页面：主界面/城市/武将/部队/外交/日志
│     ├─ app/api/game/...     # Route Handlers：命令提交、SSE、存档
│     └─ features/            # 按功能切分的客户端组件与 hooks
├─ packages/
│  ├─ engine/                 # 规则引擎（纯函数 + reducer）
│  ├─ data/                   # 规则 JSON、剧本、武将；zod schema；构建脚本
│  ├─ protocol/               # Command/Event/AI 契约 (zod → JSON Schema)
│  ├─ ai-rules/               # 规则 AI：候选生成 + 启发式评估（教师）
│  ├─ text-render/            # 六角格 ASCII、表格、态势摘要（一期 UI 核心）
│  └─ pixi-render/            # 二期：PixiJS 场景，消费同一事件流
├─ services/
│  └─ ai-laya/                # FastAPI + laya；推理与训练
│     ├─ app/                 # routers/ schemas/ deps/ main.py
│     ├─ training/            # 数据集构建、RLCD 微调、温度校准
│     └─ Dockerfile
├─ tools/
│  ├─ data-import/            # San11Editor 导出 CSV → JSON；HTML 武将表抓取
│  └─ sim/                    # 无头自对弈 / 回归模拟 CLI
├─ docs/
└─ infra/                     # docker-compose、env 模板
```

工具链：pnpm workspaces + Turborepo；TypeScript strict；vitest；Biome；Python 端 uv + ruff + pytest。

---

## 2. 数据层（packages/data）

### 2.1 数据来源与提取流程

| 数据 | 来源 | 方法 |
|---|---|---|
| 武将 850 人（五维、六适性、特技、相性、义理/野望、性格、战略倾向、亲近/厌恶、血缘、登场/生卒年、出身地、能力成长曲线） | `reganlu007.github.io/san11/man.html`；《三国志11武将能力表 v3.0.xls` | `tools/data-import/scrape_officers.ts` 解析 HTML 表 → `officers.json` |
| 设施（种类、必要技巧、生产力、耐久、费用、火计、范围、可建地形）/ 兵器 / 技巧树 / 战法 / 官职 / 爵位 / 特技 / 地形 / 能力 | 本地正版游戏的 `Scenario.s11` + San11Editor 原始数据导出 | 导出 CSV → `tools/data-import/convert.ts` → 各 `*.json` |
| 剧本（势力、城市初始钱粮兵、太守、所属、外交、技巧点） | 同上（各剧本 `.s11`） | `scenarios/{id}.json` |
| 地图（200×200 六角格地形、42 城 + 关/港、建设用地格、栈道、河流、港口连接） | 游戏文件 + 社区地图数据；不足处手工标注 | `map/terrain.bin`（1 byte/格）+ `map/nodes.json` |
| 城市隐含基础收入（金 375–875 / 粮 5000–10000 分档） | 社区实测表 | `cities.json` 字段 `base_gold`, `base_food` |

所有 JSON 通过 zod schema 校验（`packages/data/src/schema/*.ts`），构建时生成 `index.ts` 常量导出，运行时零解析成本。

### 2.2 核心规则表（节选字段）

```ts
// facilities.json 单条
{ id: "market", name: "市场", kind: "economy", requiresTech: null,
  cost: 500, durability: 300, buildDays: 20, level: 1, absorbable: true,
  effect: { goldPerMarket: 100 }, terrain: ["plain"] }

{ id: "mint", name: "造币厂", kind: "economy", cost: 1000, durability: 500,
  effect: { adjacentBoost: { target: "market", mult: 1.5, stack: false } } }

// tactics.json (战法)
{ id: "spear_spiral", name: "螺旋突", troop: "spear", requiredAptitude: "B",
  unitDamage: 1.3, durabilityDamage: 0.0, moraleCost: 15, terrain: ["plain","forest"] }
```

### 2.3 数值一致性验证（Golden Tests）

- `packages/engine/test/golden/`：以社区已验证公式/实测截图为准写断言。例如：
  - 治安 100、3 市场 + 1 造币厂邻接 2 市场 ⇒ 金收入 = base × (1 + (3 + 2×0.5) × 0.25)。
  - 1 万兵城内驻屯每旬耗粮 250。
  - 军屯农：驻兵 <3 万 = 1 级农场 1/3，≥3 万 = 1 级农场 2 倍，不受谷仓加成。
  - LV3 市场 = 1.5×，邻接造币厂 ⇒ 2.25×；黑市 = 0.8× 且不吃造币加成；鱼市 = 2×、大市场 = 3× 不吃加成。
- 每条 golden test 注明来源 URL/截图，形成"数值出处台账"。

---

## 3. 规则引擎（packages/engine）

### 3.1 状态模型（GameState，可序列化）

```ts
type GameState = {
  meta: { scenarioId; turn: number; year; month; dekad: 1|2|3; seed; rngState };
  map: { width: 200; height: 200; terrainRef: string; // 地形只读引用
         buildings: Record<HexKey, Building>;         // 城外设施/军事建筑
         units: Record<UnitId, Unit> };
  factions: Record<FactionId, Faction>;   // 君主、军师、爵位、技巧点、已研究技巧、外交关系、行动力
  cities: Record<CityId, City>;           // 钱粮兵、气力、治安、耐久、兵器库、太守、军团、市价、建设用地
  gates: Record<NodeId, GateOrPort>;      // 关/港：守备、耐久
  officers: Record<OfficerId, Officer>;   // 静态引用 + 动态（所属、所在、身份、忠诚、功绩、体力、伤病、经验）
  diplomacy: { relations; ceasefires; alliances; hostages };
  pendingEvents: HistoricalEvent[];       // 历史事件、登场预定
  log: Event[];                           // 本回合事件
};
```

### 3.2 回合流程（1 回合 = 1 旬，3 旬 = 1 月）

```
回合开始
 ├─ 日期推进；行动力恢复（按武将数，公式取自数据表）
 ├─ 月初(上旬)：金收入结算；季初(1/4/7/10 月上旬)：粮收入结算；市价波动
 ├─ 设施建设/吸收合并进度；技巧研究进度；伤病恢复；忠诚/功绩/官职变动
 ├─ 灾害、历史事件、武将登场/死亡、俘虏忠诚下降
 ├─ 各势力按序行动：
 │    玩家：输入命令直到"结束回合"
 │    AI ：GameSession 调 ai-rules/Laya 生成命令序列 → 逐条 apply
 ├─ 部队行动结算：移动 → 攻击/战法/计略 → 军事建筑攻击 → 士气/兵粮消耗
 ├─ 城市/关港耐久归零判定、势力灭亡、统一判定
 └─ 回合结束 → 快照(可选) + 事件写库
```

### 3.3 规则模块与关键公式（全部从数据表取参）

| 模块 | 内容 |
|---|---|
| `economy` | 金/粮收入、市价与买卖、征收/输送、设施加成、军屯农、兵粮消耗（城内/野外/兵种差异） |
| `construction` | 建设用地几何（六邻）、造币/谷仓邻接加成不叠加、吸收合并（仅可吸收 LV1，10–20 天）、鱼市/大市场/黑市城市条件、军事建筑（阵/军乐台/箭楼/投石台/土垒/石兵八阵/太鼓台）范围 |
| `personnel` | 登用/搜索/褒赏/没收、忠诚与相性/义理、官职与俸禄、爵位与军团、太守/军师任命、俘虏处置 |
| `military` | 部队编成（主将+副将×2，兵种适性取最高/主将规则按原作）、征兵/训练、兵器生产、出征行动力 |
| `combat` | 六角格移动力与地形消耗、ZOC、通常攻击与反击、战法（适性门槛、气力、范围形状）、计略成功率（智力差、特技）、火计蔓延、单挑/舌战判定、伤病/被俘、士气 |
| `tech` | 六系技巧树、技巧点获得（研究/战斗/特技）、解锁效果 |
| `diplomacy` | 亲善/同盟/停战/劝降/共同作战、势力好感、人质 |
| `events` | 历史事件触发条件、剧本专属剧情、武将登场/隐退/自然死亡 |
| `ai-hooks` | 合法动作枚举（`enumerateCommands(state, factionId)`）、状态特征提取（`featurize`） |

**接口形态（函数式）**

```ts
export function applyCommand(state: GameState, cmd: Command, rng: Rng): Result<{ state: GameState; events: Event[] }, RuleError>;
export function endTurn(state: GameState, rng: Rng): { state: GameState; events: Event[] };
export function enumerateCommands(state: GameState, factionId: FactionId): Command[];
export function preview(state: GameState, cmd: Command): Preview; // 建设/战法/移动的效果预览，供 UI 与 AI 共用
```

### 3.4 测试策略

- 单元：每条公式一组 golden 用例。
- 性质：同 seed 同命令序列 ⇒ 状态哈希一致（防非确定性回归）。
- 模拟：`tools/sim` 跑 N 局全 AI 自对弈，输出统一年限/经济曲线，对照原作经验值（如 190 年剧本 AI 群雄 20–30 年内决出胜负）做粗校准。

---

## 4. Web 应用（apps/web，Next.js 15）

### 4.1 运行模型

- 单人游戏，一局 = 一个 `GameSession`（服务端内存 + DB 持久化）。
- 玩家命令：`POST /api/game/{id}/command` → `applyCommand` → 返回 `events` + 局部状态 diff。
- 结束回合：`POST /api/game/{id}/end-turn` → 服务端串行处理所有 AI 势力与结算，进度通过 **SSE** `GET /api/game/{id}/stream` 推送（"曹操军 出征 濮阳 ×3 部队…"），前端边收边渲染文字战报。
- AI 回合内对 Laya 服务的调用是网络 IO，用批量接口一次提交一个势力全部候选问题（Laya 批量 7 ms/问）。
- 一期不引入队列；二期若做多人或长回合再拆 `apps/game-server`（Node worker + BullMQ）。

### 4.2 持久化（Drizzle ORM）

- 一期本地：SQLite（libsql）；部署：Postgres。同一 schema。
- 表：`games`（元信息、当前回合、seed）、`snapshots`（gzip JSON，每 N 回合）、`events`（append-only，含 `factionId, turn, cmd, events, aiMeta`）、`ai_decisions`（Laya 输入/输出/最终采用与否，训练语料）。

### 4.3 前端信息架构（一期文字）

三栏布局：左「导航/势力概况」，中「主视图（文字面板）」，右「事件日志/战报流」。底部一条**命令行**（支持自然的中文指令与补全）+ 键盘快捷键。所有面板都是"表格 + 等宽块"两种基本渲染：

- 势力：金粮/技巧点/行动力/爵位/外交
- 城市：钱粮兵/耐久/治安/气力/兵器/建设用地 ASCII
- 武将：列表（可排序/筛选）、详情（五维雷达用文字条 `统 ██████████ 96`）
- 部队：编成、位置、周边态势 ASCII
- 地图：**分级文字地图**——战略层（城市邻接图 + 距离）、战术层（局部六角格 ASCII）

---

## 5. 文字化的"命令语法"（protocol）

命令统一为结构化 `Command`，命令行输入经解析器映射；UI 按钮生成同样的结构。示例：

```
建设 洛阳 #4 造币厂
吸收 洛阳 #1 <- #2
征兵 洛阳 5000 由 曹仁
出征 洛阳 [夏侯惇 曹仁 李典] 枪兵 8000 兵粮 20000 目标 宛
移动 夏侯惇队 至 宛 西北 3格
移动 夏侯惇队 (112,84)
战法 夏侯惇队 螺旋突 -> 刘备队
布阵 组A=[夏侯惇 前, 曹仁 左后, 李典 右后] 锚 (112,84) 面向 东南
包围 宛 用 [夏侯惇队 曹仁队 李典队]
外交 亲善 刘备 金 2000 使者 荀彧
研究 枪兵 长枪
结束回合
```

解析器输出 zod 校验后的 `Command`，非法时返回可读错误（"李典 适性 C，无法使用螺旋突（需 B）"）。

---

## 6. 空间决策的文字替代方案（重点）

### 6.1 城外设施排列

三国志11 的建设用地是主地图上围绕城市的若干六角格，收益取决于**六邻关系**（造币厂/谷仓对相邻市场/农场 ×1.5、不叠加）与**吸收合并**（相邻 LV1 → LV2 → LV3）。文字替代分三层：

**(a) 结构化视图**：每格编号，等宽 ASCII 保留六角拓扑，同时给出邻接表，让玩家不用"看"也能推算。

```
洛阳 建设用地 12 格　　○ 空地　◇ 建设中
         [1]市场L2   [2]市场L1   [3]○
    [4]○        [5]市场L1   [6]兵舍     [7]○
         [8]锻冶    [9]○        [10]○
    [11]○       [12]厩舍
邻接：#4 ↔ {1,5,8,9,11}　#9 ↔ {4,5,8,10,11,12}
```

**(b) 效果预览**（引擎 `preview`）：

```
> 建设 洛阳 #4 造币厂
  影响：相邻市场 #1(L2) #5(L1) → 收益 ×1.5
  预计金收入：+412/月 → 1,650/月（治安 92）
  费用 1000 金，20 天，需武将 1 名（推荐：荀彧 政治 95）
```

**(c) 规划模板**：引擎对当前空地做小规模搜索，直接给出最优"花形"：

```
> 规划 洛阳 商业花
  方案：造币厂 → #9；市场 → #4 #10 #11 #12（与现有 #5 共 5 座受加成）
  预计满级后金收入 2,930/月。
  建设顺序（避免过早合并）：#4 #10 #11 #12 → 逐对吸收 → 最后建 #9
  [执行全部] [仅第一步]
```

### 6.2 部队编成（替代"阵型"直觉）

三国志11 没有陣形，编成决策 = 主将+2 副将 + 兵种 + 兵数 + 兵器。文字版直接给**编成计算器**：

```
> 编成 洛阳 [夏侯惇 曹仁 李典]
  兵种可选：枪 A(夏侯惇)  戟 B  弩 C  骑 S(夏侯惇)  兵器 B  水 C
  推荐：骑兵（适性 S，可用 战法 突击/突进/突破；特技 疾驰(夏侯惇) 生效）
  统率 89（主将夏侯惇）/ 武力 90 / 智力 66（副将补正）
  可携兵粮上限 …　行动力消耗 …
```

### 6.3 部队站位与"布阵"

三国志11 的战场空间要素：六角格移动力、ZOC、战法影响格（直线 2 格/扇形 3 格/推退）、火计蔓延、军乐台/阵/箭楼范围、包围城池的六格。文字替代：

**(a) 局部战术 ASCII（半径 4）**：以选中部队为中心，六方位（北/东北/东南/南/西南/西北）标注；符号表示地形与单位，坐标可点/可输入。

```
夏侯惇队 (112,84) 周边　　░森 ▲山 ~河 ═栈道 ■城 ☐阵/建筑
                  .  .  ░  ░
               .  .  .  刘  .          刘=刘备队 枪 7,200 距 2 (东北)
            .  .  张  .  .  .          张=张飞队 骑 5,000 距 2 (北)
         .  .  .  惇  .  .  ~          仁=曹仁队(我) 距 1 (西南)
            仁  .  .  .  ~  ~
               .  ☐  .  ~  ~           ☐=敌 军乐台 (110,86) 范围覆盖 刘/张
```

**(b) 态势摘要**（每回合自动生成，替代"一眼扫地图"）：

```
[态势] 宛 方向：敌 3 部队 距 宛 4–6 格，预计 2 旬抵达；我方 夏侯惇队 位于 敌 军乐台 范围外 1 格。
[威胁] 张飞队 可于本回合 突击 夏侯惇队（推退 1 格 至 河边）。
[机会] 刘备队 位于 森，我方 弩 可无反击射击（距 2）。
```

**(c) 相对指令与模板**：玩家用"相对方位 + 模板"下达，引擎换算为格坐标并返回预览：

```
> 布阵 组A 楔形 锚 夏侯惇队 面向 东北
  夏侯惇队 → (112,84) 保持；曹仁队 → (111,85)；李典队 → (113,85)
  形成 ZOC 封锁 东北 3 格；曹仁 处于 敌弩 射程内（距 2） [调整] [确认]

> 包围 宛 用 [夏侯惇队 曹仁队 李典队]
  宛 六邻中可站位 4 格（2 格为河）；分配：惇→东 仁→南 典→西南；缺口：北/西北
  攀登/井阑 攻城预估：耐久 -1,240/回合 → 约 6 回合破城
```

模板集合（均由引擎几何计算，非美术）：横列、纵列、楔形、掩护弩队（前戟后弩）、包围环、护送（辎重居中）、退守关港路径。

**(d) 战法/计略范围预览**：

```
> 战法 曹仁队 横扫
  影响格：(113,83)(114,83)(114,84)　命中：刘备队、张飞队　预计伤兵 1,120 / 890　气力 -20
```

以上全部依赖 `engine.preview()`，二期 PixiJS 只是把这些格子高亮出来而已。

---

## 7. AI 层设计（ai-rules + Laya 服务）

### 7.1 分层决策

Laya 只能回答"在这些选项里哪个更好/多有把握"，所以决策拆成三层，每层问题的选项数 ≤ 20：

| 层级 | 频率 | Laya 问题示例 | 引擎提供的候选 |
|---|---|---|---|
| 战略（势力） | 每回合 1 次 | `choice` 本回合势力总方针：扩张/防守/内政/外交/休整；`score` 每个邻接敌势力的威胁 0–4；`noul` 是否应向 X 提出停战 | 邻接势力列表、势力比 |
| 作战（城市/军团） | 每城每回合 | `choice` 该城任务：征兵/建设/输送/出征/研究/登用；`choice` 出征目标（≤ 8 个候选城）；`score` 需要多少部队（1–4） | 合法城市命令集合 |
| 战术（部队） | 每部队每回合 | `choice` 本回合动作：前进/攻击目标 A/B/C/战法 X/后撤/驻守；`noul` 是否使用计略 | `enumerateCommands` 后由规则剪枝到 ≤ 12 |

**流程**：`ai-rules` 先做硬约束剪枝（钱粮不足、适性不够、路径不通）→ 得到候选 → 编码 state → 一次批量请求 Laya → 按概率选择（温度由君主"战略倾向/性格"决定：莽撞高温、小心低温）→ 置信度 < 阈值时回退到 `ai-rules` 的启发式评分 → 生成 `Command`。

### 7.2 状态编码（受 1024 token 限制）

- 使用 `laya-multilingual`（1024 上下文，中文可读）；键名用短英文码，值为数字/枚举，控制在 ~600 token。
- 每层只放该层需要的特征：

```json
{"t":"190/03/2","f":"caocao","gold":12400,"food":83000,"troops":56000,"cities":3,
 "rank":"none","tech_pts":420,
 "nbrs":[{"f":"liubei","rel":-20,"troops":21000,"cities":1,"border":["xiapi"]},
         {"f":"yuanshao","rel":40,"ally":true,"troops":140000,"cities":9}],
 "city":{"id":"xuchang","gold":4300,"food":31000,"troops":18000,"morale":85,"order":92,
         "dur":0.78,"empty_lots":3,"threat":2,"officers":[["xiahoudun",89,90,66],["xunyu",70,20,95]]},
 "cands":{"A":"levy 5000","B":"build market #4","C":"attack xiapi 2u","D":"research spear_1","E":"idle"}}
```

- 问题文本固定模板，选项 `criteria` 引用 `cands` 的键，保持训练/推理一致。

### 7.3 训练数据与微调路线

1. **一期（影子模式）**：`ai-rules` 做决策并驱动游戏；同时把同一 state + 候选 + 教师选择写入 `ai_decisions`。
2. **结果标注**：自对弈 N 局（`tools/sim`，无头，几百局/小时），用后验指标（20 回合后城市数/兵力/钱粮变化、是否丢城）给每个决策打分，形成 soft label（好于教师的选择加权）。
3. **微调**：`services/ai-laya/training/` 复用官方 RLCD 微调脚本（2×T4 4–5 小时/30k 问），按层级分别微调或多任务混合；之后按 (问题类型, 选项数) 拟合温度校准。
4. **评估**：微调模型 vs 规则 AI 对弈胜率、平均统一年限、经济曲线合理性；A/B 由 `GameSession` 的 `aiPolicy` 开关控制。
5. **二期上线**：Laya 主决策，置信度门控 + 规则兜底。

### 7.4 Laya 服务（services/ai-laya，FastAPI）

- 生命周期：`lifespan` 中 `Router(max_loaded=1)` 预热 `multilingual`；GPU 优先，CPU 可运行（延迟上升，批量摊薄）。
- 路由（函数式、Pydantic v2、`async def` + `run_in_threadpool` 包裹 torch 推理）：

```
GET  /healthz                      -> {status, model, device}
GET  /v1/models                    -> 已加载/可用 checkpoint
POST /v1/decide                    -> {state, questions, model?, temperature?} -> {answers, routing, latency_ms}
POST /v1/decide/batch              -> [{id, state, questions}] -> [{id, answers}]  (一个势力一次)
POST /v1/feedback                  -> 写回最终采用动作与后验分（训练用，可选）
```

- 契约：`packages/protocol` 用 zod 定义 → 生成 JSON Schema → `datamodel-codegen` 生成 Pydantic 模型，CI 校验双端一致。
- 错误处理：模型未就绪返回 503，`GameSession` 立即回退规则 AI 并记录；超时 2s。
- 部署：Docker（`pytorch` 基础镜像），`docker-compose` 与 web 同网段；`AI_LAYA_URL` 环境变量。

---

## 8. 一期范围（纯文字，可完整通关）

### 8.1 功能清单

- [ ] 数据包：武将 850、42 城 + 关/港、地形、设施/兵器/技巧/战法/官职/爵位/特技全表，至少 2 个剧本（184 黄巾、194/200 群雄割据类）
- [ ] 引擎：§3.3 全部模块；灭亡/统一判定；存档/读档
- [ ] 文字 UI：§4.3 面板 + §5 命令行 + §6 全部空间替代方案
- [ ] 规则 AI：完整可玩的对手（内政发展、征兵、出征、防守、外交基础）
- [ ] Laya 服务：可运行、批量接口、影子模式采集
- [ ] `tools/sim` 自对弈与数值回归
- [ ] 数值出处台账 + golden tests

### 8.2 里程碑（约 5 个）

| M | 交付 | 说明 |
|---|---|---|
| M1 数据与骨架 | monorepo、data pipeline、schema、地图/建设用地数据、engine 空 reducer 可跑回合 | 数据正确性优先 |
| M2 内政闭环 | 经济/建设/人事/技巧/市价，文字 UI 城市面板与建设 ASCII/预览/规划 | 用 golden tests 锁数值 |
| M3 军事闭环 | 编成/出征/移动/战斗/战法/计略/攻城/单挑/舌战，战术 ASCII、态势摘要、布阵模板 | 最大工作量 |
| M4 AI 与外交 | 规则 AI 三层、外交、历史事件、Laya 服务与影子采集、自对弈 CLI | 可从头玩到统一 |
| M5 打磨 | 存档、回放、性能（AI 回合 < 5s）、数值校准、文档 | 一期发布 |

---

## 9. 二期范围

### 9.1 Laya 正式接管 AI

- 完成 §7.3 步骤 2–5；按君主个性分别调温；`noul` 问题用于"是否单挑/是否劝降/是否背盟"等风格化行为。
- 加入对玩家行为的在线学习（仅收集，离线再训）。

### 9.2 PixiJS 渲染层（packages/pixi-render）

- 引擎与协议**零改动**；`pixi-render` 订阅同一 `Event[]` 与 `preview` 结果：
  - 战略地图：六角格瓦片地图（200×200，视口裁剪 + 分块），城市/关港节点，部队精灵，可缩放。
  - 城市视图：建设用地格高亮，点击格 = 生成同样的 `建设 洛阳 #4 …` 命令；规划模板结果直接高亮。
  - 战术：移动范围/战法影响格/火计蔓延/军乐台范围 = 渲染 `preview` 返回的格集合；事件流驱动动画（推退、火、伤兵数字）。
- 文字面板保留为"信息层与无障碍层"，命令行继续可用；两种渲染可同时开。
- 素材：自绘或开源（Kenney 等），不使用原作贴图/头像。

### 9.3 其他二期候选

- 多人（热座 → 联网）：拆 `apps/game-server`，命令走 WebSocket。
- 剧本/武将编辑器（复用 zod schema 生成表单）。
- 回放与战报分享（事件日志即回放）。
- PK 版差异开关（技巧研究、决战称霸模式等）。

---

## 10. 风险与对策

| 风险 | 对策 |
|---|---|
| Laya 零样本弱、上下文小 | 一期只做影子；分层小选项；规则 AI 永远兜底；状态压缩编码 |
| 数值提取不完整/社区数据有误 | 数值出处台账；golden tests；`tools/sim` 宏观校准；提供"规则变量"调参而不改代码 |
| 六角格文字表达学习成本 | 三层表达（编号+邻接表、预览、模板/规划）；态势摘要自动生成；命令行补全 |
| AI 回合耗时 | 候选剪枝、批量请求、Laya 批量 7 ms/问；SSE 流式战报避免"卡住"感 |
| 版权 | 只用数值；无头像/列传/音乐/贴图 |
| 引擎与 UI 耦合导致二期重做 | 从 M1 起强制 `engine` 无 DOM/IO 依赖，`preview` 作为唯一"空间信息"出口 |

---

## 11. 技术选型汇总

| 层 | 选型 |
|---|---|
| 前端/服务端 | Next.js 15（App Router、Server Actions、Route Handlers、SSE）、React 19、TypeScript strict、Tailwind |
| 引擎 | 纯 TS，immutable 更新（structura/immer 或手写），xoshiro128\*\* PRNG |
| 校验/契约 | zod → JSON Schema → Pydantic（datamodel-codegen） |
| 存储 | Drizzle ORM；SQLite(libsql) 本地 / Postgres 部署 |
| AI 服务 | Python 3.12、FastAPI、Pydantic v2、uv、`laya`（torch）、Docker |
| 测试 | vitest（engine/protocol）、Playwright（web）、pytest（服务）、`tools/sim` 回归 |
| 工程 | pnpm + Turborepo、Biome、ruff、GitHub Actions |
| 二期渲染 | PixiJS 8 |
