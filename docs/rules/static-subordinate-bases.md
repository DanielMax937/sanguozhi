# 港关静态所属城市数据

本项只关闭“45 个港、关的名称及所属城市尚未结构化”这一数据缺口。它不实现势力归属、军团、收入、攻陷、指令或事件逻辑。

## 数据与来源

- 数据：[subordinate-bases.json](../sources/subordinate-bases.json)，schemaVersion 1，datasetVersion `atwiki-77-2021-08-04-v1`
- 已读取来源：[三國志11攻略wiki「都市データ」](https://w.atwiki.jp/sangokushi11/pages/77.html)，`一覧表 > 港関` 的 `関門名 / 所属` 两列
- 页面标注更新日期：2021-08-04 08:20，页面未标明时区；读取日期：2026-10-06 UTC
- [45 行所属关系事实投影](../sources/subordinate-bases/atwiki-77-parentage.tsv)保留日文原名、所属城市和源表数据行序号；[42 城数量事实投影](../sources/subordinate-bases/atwiki-77-city-counts.tsv)来自同页 `一覧表 > 都市 / 港関` 列。两个文件均在数据内固定 SHA-256
- 这是社区资料。表格没有逐行注明平台、无印/PK 或补丁版本；不据此认证 clean-stock PC-PK、Vanilla、主机版、剧本或 MOD 等价

## 契约与兼容性

每条记录有稳定仓库 `id`、`kind`（gate / port）、繁体显示名 `name`、`parentCity`，以及包含源表原名、原所属城市、1 起始行序号和 sourceId 的 `evidence`。ID 是仓库命名键，不是原作数值据点 ID，也不是源表行号；显示名或源表排列变化不应改变 ID。

`parentCity` 精确引用既有 [cities.json](../sources/cities.json) 的 `cities[].name`，不使用数组下标。既有 cities.json 保持逐字节不变，旧调用方、数量字段和开发分片均不变。新表作为其 sidecar；无需把名字或映射塞进原有数值 `portsAndGates` 字段。

源表城市名只做四项明确转换：晋陽→晉陽、寿春→壽春、呉→吳、会稽→會稽。港关日文写法如剣閣、臨済港、解県港、新豊港、羅県港、巫県港及 `関` 字也保留在 evidence，并用数据内的有限转换表生成繁体显示名。没有任意繁简转换或模糊名称匹配。

## 对账与边界

- 45 个唯一 ID、45 个唯一显示名、45 个唯一源表名称，分为 10 关和 35 港
- 45 条关系落在 27 城；其余 15 城没有所属港关。对全部 42 城逐一核对，源表数量、既有 `portsAndGates` 和新表实际计数完全一致，总计 45
- 特别保留函谷關→長安、濡須港→壽春等源表关系，不按距离或当前控制势力猜测所属
- 当前未发现上述两表与既有计数间的差异，`disagreements` 为显式空列表；这不表示完成原作文件或独立第二来源认证。后续有矛盾需记录来源和差异，不能静默覆盖
- 北海、建業、會稽的 `developmentPatches` 仍为 null；六角格坐标、地形高度、格子邻接、原作据点 ID、各剧本初始状态仍不在本项范围

## 检查

`npm run check` 自动包含 `packages/engine/test/subordinate-bases.test.mjs` 的 9 项数据回归：来源和版本范围、事实投影哈希、数量和唯一性、逐行所属关系、全部城市引用/数量、有限拼写转换、稳定 ID、旧城市字节及未知分片、差异与认证边界。它是静态数据检查，不是游戏运行时认证。
