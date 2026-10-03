# P0-46 据点陷落 caller、内政设施 selector 与来源版本边界

更新：2026-10-03 UTC。主目标仍为 PC-PK1.1；本轮完成来源审计，不把来源不明的二进制冒充官方原版。

- 结构化证据：[capture-selector-source-profile.json](../sources/capture-selector-source-profile.json)
- 机器码摘录：[capture-selector.asm.txt](../sources/capture-selector-source-profile/capture-selector.asm.txt)
- 参考模型：`scripts/capture_selector_profile.py`
- 校验：`python scripts/check_capture_selector_profile.py`

## 1. 结论与证据边界

已找到公开 IDB 中的真正函数体与 caller xref，旧“selector 完全没有 body”可以收窄为：

```text
004B2CA0..004B36FF（end exclusive）  据点陷落 containing handler
  004B329B                         资源保留局部段，不是独立函数
  004B33C5..004B3587               城市内政候选、shuffle、销毁前缀
  004B3643..004B366C               晚期耐久至少一半的局部写回
```

但 IDB 记录的输入文件位于 `D:\Games\三国志11\血色5.0公测\san11pk.exe`。因此本轮结论必须绑定以下来源 profile：

```text
source-idb-30d33b44-capture-selector-v1
evidence = opcode-exact
scope = identified-idb-source-profile
stockOriginalVerified = false
stockPcPk11Equivalence = open
```

目录名不证明所有字节都被修改，也不证明它是 clean stock。原厂/独立验证的 PC-PK1.1 EXE 尚未逐字节核对；PC Vanilla、PS2、Wii 必须独立标记。P0-46 **audit complete 不等于全部原版机制 closed**。

## 2. 来源身份与可复核证据

主要来源为 [sjn4048/311MemoryResearch 固定 commit 的 san11pk.zip](https://github.com/sjn4048/311MemoryResearch/blob/66e167e40c3440929ec016f3872aefc3486434c1/IDA%20Related/san11pk.zip)，成员 `san11pk.idb`。

| 对象 | SHA-256 |
|---|---|
| ZIP | `47beee4ac990869694a5e6f7577947cd6b34a41aefe60bace3af3350c682ce5a` |
| IDB | `c591cb40ce6d6be9246148002532dedc042463f36cd39c5ed300b7c449feefab` |
| IDB 记录的输入 EXE | `30d33b44876b84a8e87570873a86de88c65d2491c7e1cdeeb5883dc4b12feefb` |
| `004B2CA0` 全函数原始字节 | `88ad5211c4484037aad336c7cd3ef0dbd1fc0c1091a00627d67986c222caa5af` |

IDB 记录的输入 MD5 为 `5183312eb33a7556fb5d8de8ca2fae91`。这是数据库元数据，不是本轮独立取得 EXE 后重算的身份；其 `7.00` 是 IDA 数据库版本，不是游戏补丁版本。

静态提取使用 `python-idb 0.8.0` 读取存储字节、`capstone 5.0.9` 解码 x86-32；全函数 2655 字节连续解码。未执行游戏、SIRE、补丁或来源仓库代码。提交只含必要文本、哈希及自己的参考模型，不包含 IDB、EXE 或压缩包。

交叉证据均固定到 commit，不能用 MOD 替换指令冒充原码：

1. [新特技专题 L1208–1241](https://github.com/sjn4048/311MemoryResearch/blob/66e167e40c3440929ec016f3872aefc3486434c1/内存资料/新特技专题.txt#L1208-L1241)：安民 MOD 保存原 `004B3511 -> 004890B0` call，并绕过到 `004B3587`。原 call 提供入口线索；注入代码不属于原版特技规则
2. [资源保留 TXT L547–658](https://github.com/sjn4048/311MemoryResearch/blob/66e167e40c3440929ec016f3872aefc3486434c1/内存资料/函数[破坏内政设施和破城获取资源].txt#L547-L658)：105 条非缩进原指令与 IDB 全部一致，缩进修改方案排除。此结果只交叉验证资源段，不能替整个 selector 证明 stock 原性
3. [函数表 L5044–5045](https://github.com/fudanglp/311resource/blob/16efa1241dc8637dd33446abb4a9732a37f0a2b9/extractor/ida/data/python_idb/san11pk_dump.exe_functions.csv#L5044-L5045)：独立列出起点 `004B2CA0` 和 next start `004B3700`。实际函数 end-exclusive 用 IDB 的 `004B36FF`，不从大小推行为
4. [SIRE 地址表](https://github.com/sean2077/311SireCustomizedPackageDev/blob/43afe4efe273cf3b6ab7833b9b6f5822bd331fd4/material/内存地址汇总.md#L350-L356)、[结构表](https://github.com/sean2077/311SireCustomizedPackageDev/blob/43afe4efe273cf3b6ab7833b9b6f5822bd331fd4/material/结构体汇总.md#L648-L672)：辅助命名 getter、建设状态和全局链表；不把该 MOD 工具的整个数据表或运行态 dump 当作官方原版

## 3. 三处直接 caller 与城、港、关分支

| callsite | containing function，末尾不含 | 可核语境 |
|---|---|---|
| `005926DC` | `00592440..00592732` | 火计路径；耐久为0、据点及来源/关系 gate 后调用 |
| `00597E94` | `00597A60..00597EFF` | 火陷阱路径；类似耐久与据点 gate；非据点走 `004BD700` |
| `005B1BF5` | `005B1870..005B1D92` | 通用攻击结果应用；经 `005AE2B0` 的耐久0或据点兵数0 gate |

这些是实际 `E8 rel32` call，不是地址邻近猜测。前两路径的文档语境见 [CE 导出 L84–87](https://github.com/sjn4048/311MemoryResearch/blob/66e167e40c3440929ec016f3872aefc3486434c1/内存资料/CE档导出.txt#L84-L87)；攻击结果语境见 [逐记录应用 caller](https://github.com/sjn4048/311MemoryResearch/blob/66e167e40c3440929ec016f3872aefc3486434c1/内存资料/函数[枪兵突刺、二段、楼船猛撞].txt#L135-L147)。文档里的修改字节不作原码证据。

`004B2CA0` 接受 target building、source object、尚未命名的 mode flag，并 `ret 0xC`。不能把第三参数直接命名为“耐久归零/守兵归零”。在此来源内，至少上述攻击路径汇入同一 containing handler；历史事件、脚本、劝降及全部特殊接管仍未覆盖。

内政 selector 另有 **city-only gate**：`004B2DCA -> 004866F0` 将目标 building ID 限定为 `0..41` 再取得 city pointer；`004B33C5..004B33D4` 校验失败则直接跳 `004B3587`。所以该来源的港、关不会借用母城内政候选；这不表示港、关没有资源保留或其他 capture effects。

## 4. 候选构造：资格、顺序、特殊设施

来源逐指令恢复的步骤：

1. 从全局 building list 的 head `073FB4F0` 出发；`004922C0` 依 next 遍历，payload 为当前 node+8。是**当时链表顺序**，不等于已证明的建筑 ID 或建造时间顺序
2. 内政分类为 `00487A30` 的设施类型资料 `+0xB4 == 4`
3. `00487920` 通过建筑坐标、地图地域映射和 `GetCityID` 检查同城；不能凭空替换为某个 `building.city` 字段
4. 建设状态 `building+0x14 == 0` 立即经 `004B34CE -> 004B09B0` 销毁，不进入保留抽样。若 type30，另先经过宝物42相关路径，其完整副作用仍 open
5. 状态非0且 type30（铜雀台）绕过普通候选，不被此内政 selector 销毁，也不占普通 quota
6. 其他完成内政设施依顺序加入指针数组，最多30个；第31个及以后不加入，不可擅自推导为“全部销毁”

**内政分支没有 owner 相等过滤。** 前面的军事设施/障碍物/部分陷阱清理分支确有原 owner 条件，但它与内政候选不同，不能移植。后者只按上述内政类别及同城等 gate。

完成铜雀台在 quota 之外，故总残存设施数不能简单写成 `keepCount` 或“全城最多5座”。参考模型只消费已资格化、有序、唯一的普通候选 ID，**没有实现世界候选收集器**；type、建设状态、港关 dispatch 不是它已通过的整引擎测试。

## 5. 魅力数量、force override 与随机交换

### 5.1 输入和数量

source troop 的主将 getter 为 `00495A40`，经 troop+0xC 人物 ID 取 pointer；保存到统一栈帧 `S+0x20`。`004B3511 -> 004890B0` 读取人物 `+0x174` 的魅力 byte。辅助资料称其为受伤病影响的显示魅力；不是部队合成魅力或副将最高魅力。

指令先取至少20，再正整数除20：

```text
effectiveCharm = validCommander ? max(20, charmByte) : 20
keepCount = min(n, floor(effectiveCharm / 20))
destroyCount = n - keepCount
```

0–39留1、40–59留2、60–79留3、80–99留4、100–119留5；来源 byte 范围中的120对应6、255对应12，再受 n 限制。**没有全局最大5的指令**。这只陈述该来源的算术，不声称 stock 正常玩法可达到任意 byte 值。

无有效主将时本段默认20。虽前面出现君主 pointer lookup，却未回写此主将 slot，不能发明“无主将自动用君主魅力”。参考模型要求显式选择 `source-default-20` 才允许缺魅力输入，否则拒绝。

`004B3559..004B3566` 读取 `S+0x24` 的 capturing/new force ID；它由 `004B2D36` 的 source object force getter 得来。若 ID 不在 `0..41`，改为 `destroyCount=n`。这是**数值 gate**，不是已经证明的“处断君主必全毁”规则。

### 5.2 算法：全范围交换，销毁前缀

`004B3532` 调用 `00689BF0(array,n,1)`；源码语义为：

```text
if n > 1:
    for i in 0..n-1:
        j = GetRandomX(n)
        swap(array[i], array[j])

keepCount = min(n, floor(effectiveCharm / 20))
destroyCount = n - keepCount
if newForceId < 0 or newForceId > 41:
    destroyCount = n

destroy array[0:destroyCount] in order
retain array[destroyCount:n]
```

每次 bound 恒为 n，没有缩小范围，所以不是 Fisher–Yates，也不是均匀无放回 sample 的等价替换。以理想独立均匀 draw 为结构反例：n=3、keep=2 的27条 draw 序列，三个保留集合计数为10、9、8；这不是实际 LCG 的精确概率声明。

- n=0或1：无 RNG draw
- n>=2：恰好 n 次 draw
- 即使全保留，仍先 shuffle 并消耗 n 次 draw
- 即使 force override 导致全毁，也在 shuffle 之后覆盖
- 销毁打乱后的前缀，保留后缀；不能反向取前 keep 项
- 禁止为了“稳定”在 selector 内按 ID 排序，顺序必须由调用者和 trace 保留

### 5.3 来源 RNG 与工程 RNG 分开

`00472150` 在此 selector 的 n=2..30 范围内：

```text
state = (state * 0x6C078965 + 0x3039) mod 2^32
j = (state >> 16) % n
```

state 地址 `008A5D44`。通用 helper 另有低16位 bound 检查，但 n<=30 不触及该大 bound 问题。

参考模型提供三种互斥来源：

- `raw_draws`：已记录或测试注入的 `00472150` 返回索引
- `source_rng_state`：显式32位进入状态，使用 `source-idb-lcg32-high16-mod-v1`
- `seed`：工程 `sha256-counter-rejection-v1`，只用于确定性测试/兼容运行，不冒充游戏 RNG

恢复 LCG 不等于恢复原作存档回放：初始 seed、全局其他 RNG 调用和 stock 等价性仍 open。

## 6. 销毁不是单设施战斗掉落；耐久只是晚期局部条件

`004BA610` 是普通单设施 loot；`004BD700` 的普通击破路径会调用它。capture 的候选销毁直接调用 `004B09B0`，没有在这些调用点经过 `004BA610`/`004BD700`。不得给每个 capture 销毁对象再发一份普通战斗 loot。

资源保留 `004B329B` 与设施 selector 同在 `004B2CA0` 内，但它本身只处理金、粮、兵、12类兵装。排除该**局部段**为 selector 是对的，排除整个 containing function 则是错误推断。

`004B3645..004B3667` 新发现的只是晚期局部写回：

```text
minimum = floor(maxDurabilityAtThisPoint / 2)
if currentDurabilityAtThisPoint < minimum:
    SetFacilityDurability(minimum)
```

高于此下限时本块不降低耐久，低于时经合法性检查写入。此前 `004B40C0`、`004B49B0`、部队入城、`004BCA30` 等 side effects 未全审，不能把它改写成 `postCapture=max(preCaptureDurability,max/2)`，也不能宣布两种归零入口的完整 reset 全部闭合。旧10%值未被本来源支持；stock exact 仍需独立核验。

## 7. PK优先与 Vanilla、主机版隔离

| 目标 | 采用方式 | 禁止越界 |
|---|---|---|
| 固定 IDB source profile | 候选 gate、计数、交换、force override 可来源内精确重建 | 不等同完整 transaction/世界状态回放 |
| stock PC-PK1.1 | 明示 `compatibility-reconstruction`，保留 stock equivalence open | 不标原厂已证实，不静默覆盖全PK版本 |
| PC Vanilla 各补丁 | 独立 `compatibility-assumption`；候选类型/版本由调用方隔离 | 不把PK地址和设施表算作无印自身证据 |
| PS2 / Wii | 各自 open；若使用近似则另设 profile | 不以PC静态字节推主机实现 |

[魅力 Wiki](https://w.atwiki.jp/sangokushi11/pages/1598.html) 是城市攻略分档观察，条目没有精确平台/build；[2011讨论](https://w.atwiki.jp/sangokushi11/pages/2469.html) 含数量异议和君主处断全毁说法，控制变量不足，不确立额外规则。[2006-03-17 首发期记录](https://w.atwiki.jp/sangokushi11/pages/1818.html) 支持 Vanilla 已有部分设施毁坏/残存，却未报魅力和准确补丁，不能验证完整分档或 selector。

[官方合订手册](https://cdn.akamai.steamstatic.com/steam/apps/628070/manuals/32sangokushi11wpk_manual.pdf) 的城市开发地、港关单列，以及鱼市场可在同都市圈港口敌有时开发，只支持对象/功能语义，不证明 opcode 或 capture 顺序。[Vanilla 补丁记录](https://www.gamecity.ne.jp/regist_c/user/san11/san11_update02_history.htm) 未发现专项 selector 变更也不证明二进制相同。

旧 `seededSampleWithoutReplacement` 仅保留为历史 `provisional-engine-rule`。本轮新增来源绑定算法，不把旧均匀采样或本轮工程 seed 通过“PK兼容”标签升级成原版事实。

## 8. 可替换模型与验证范围

模型接口 `select_capture_facilities(...)` 接收有序候选、资格/顺序/来源说明、主将魅力或显式缺失策略、new force ID、source profile/fingerprint，以及三种 RNG 模式之一；只返回计划和 JSON-safe trace，不修改世界。

trace 绑定 source identity、算法、适配器、输入顺序与哈希、每次 bound/draw、进入/离开状态、打乱序列与保留/销毁结果。replay 必须验证契约和记录，不取新随机数；哈希是数据一致性检查，不是防篡改签名或 seed 历史真实性证明。

参考测试应覆盖：

- 魅力0/19/20/39/40/99/100/110/119/120/255、显式缺魅力默认
- n=0/1/2/30、quota>=n仍消耗draw、超30/重复/无序输入拒绝
- force=-1/0/41/42/46、先shuffle后全毁
- 固定draw逐步交换、输入顺序影响、保留/销毁不交叠且并集完整、输入不变
- 来源 LCG 32位截断与已知状态、工程seed确定性及两适配器标签分离
- profile/source/input/draw/result篡改或不匹配拒绝；成功 replay 不读取新 RNG
- 文档JSON与模型常量/来源指纹一致，关键 callsite 与机器码证据一致

这些是**局部参考模型/证据一致性测试，不是原 EXE 或存档回归**。模型不执行候选资格化、未完成设施立即销毁、铜雀台副作用、港关 dispatch、ownership/resource/personnel/durability commit。

## 9. 本轮闭合与下一步

已收紧：真正 containing function、三处直接 caller、city-only gate、候选资格和当前链表序、30容量、显示魅 getter、quota算术、全范围交换/RNG helper、销毁前缀与新势力ID override，以及晚期最低一半耐久的局部条件。

仍 open：

1. clean stock PC-PK1.1 的 build/hash 与本来源逐字节等价性
2. 各 caller 全部业务参数、特殊原因及所有 city/harbor/gate 接管路径覆盖
3. 全部 finalizer、副作用与事务顺序；晚期耐久之前发生了什么
4. seed 初始化及全局 RNG 调用序；原游戏/存档可复现对照
5. Vanilla 各补丁、PS2、Wii 自身 selector 与候选表
6. 将已验证局部模型接入完整引擎时的候选及事务集成测试

下一项优先取得 clean build 对照或继续 caller/finalizer 的可定位缺口；不预设新的 P0 终点，不把这次 audit-complete 写成 remaining-gaps=0。
