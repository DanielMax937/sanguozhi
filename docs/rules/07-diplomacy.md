# 外交关系与外交指令

> 外交是已确认存在**补丁级版本平衡差异**的系统。P0-2 已把边界收紧到 Vanilla 1.0 / 1.1 / 1.2-plus / PK formula corpus；完整证据见 `37-diplomacy-version-boundaries.md`。

## 1. 外交状态

每对势力保存：

- 友好度与 5 档显示关系
- 同盟
- 停战及剩余期限
- 嫌恶/亲爱君主关系
- 援军/共同作战目标（如适用）

## 2. 亲善

`[PK-era formula corpus][empirical-high; exact build open]`

玩家逆向公式：

`友好度上升 = (c×20 + max(执行者政治 - 相性差/2, 0) + 100) / 10`

其中：
- c=1.5：义兄弟/配偶/目标君主亲爱执行者
- c=-1：目标君主嫌恶执行者
- 其他 c=1
- 难度修正：初级 1.0、上级 0.8、超级 0.7

该组外交公式在多个中文资料站长期转载，但缺官方源码验证，因此标 `empirical-high`。

## 3. 同盟

逆向判定值：

`V = (金/150 + 执行者政治 - 相性差/5 + c×10) × t`

c 同亲善；t=1.0/0.8/0.7。

- 若 `V > (100-友好度)×2`：成功。
- 否则若有论客，或 `V > (80-友好度)×2`：普通失败。
- 否则：失败并进入“被捕”判定分支（实际外交结果仍为失败）。

另有人际/旧势力关系导致必败的特殊门槛。

成功后常见结果：友好 +10、执行者功绩 +500、政治经验 +5、技巧P +50。

## 4. 停战

`V = (金/400 + 执行者政治 - 相性差/5 + c) × t`

其中 c：
- 义兄弟/配偶/亲爱：20
- 嫌恶：-15
- 其他：10

成功门槛：

`V > 80 + 停战期间/2 - 友好度/4`

失败/论客门槛：

`V > 70 + 停战期间/2 - 友好度/4`

停战可谈到较长时间；攻略实测指出 24 个月停战不会被对方主动破弃。

## 5. 俘虏交换

逆向判定：

`V = (金/200 + 交换俘虏五维和/10 + 执行者政治 - 相性差/10 + c) × t`

c：
- 义兄弟/配偶/亲爱：20
- 嫌恶：-15
- 其他：15

成功门槛：

`120 + (目标俘虏最高能力² + 次高能力²)/400 - 友好度/5`

次级失败门槛将 120 换为 110。成功时政治经验 +8，双方技巧P +30。

## 6. 劝降

逆向资料给出的前置条件包括：

- 游戏开始超过 1 年
- 总势力数 >2
- 我方城市数至少为目标 4 倍
- 我方部队数至少为目标 3 倍
- 目标城市数 ≤4
- 双方城市接壤
- 君主不能互为嫌恶
- 一组强硬君主（如曹操、孙坚、孙策、刘备、关羽、张飞、董卓、吕布、张角）作为君主时拒绝劝降

判定基本值：

`B = ((我城/敌城)/2 + (我城-敌城)/5 - 相性差×11/28 + 汉帝加成 + 执行者魅力 + c) × t / 2`

`V = B + rand(B)`

拥立汉帝时汉帝加成 +10。c=20（亲爱/义兄弟/配偶）、0（嫌恶）、10（其他）。

### 版本注意（P0-2）

`[version-boundary-resolved / exact constants still open]`

不要把现有完整公式族无版本地复用到所有 PC 版本。

官方补丁边界：

```text
Vanilla 1.0
↓
1.1（2006-04-10）
  明确调整：势力间友好增减平衡
↓
1.2（2006-05-01）
  再次调整：势力间友好增减
  明确调整：计略・外交成功率
↓
1.3 / 1.3.1 / 1.3.2 / 1.3.3
  公开changelog未再列外交专项调整
```

因此：

```text
Vanilla 1.0 != 1.1 != 1.2
```

至少在官方声明层已经成立。

1.2～1.3.3 可标：

```text
stable-by-public-changelog
```

但不能标：

```text
binary-identical
```

因为后续版本仍含“细微修正及调整”，尚无逐EXE diff。

PK 的“超级”是新增难度，而本页完整公式族明确存在：

```text
t = 1.0 / 0.8 / 0.7
初级 / 上级 / 超级
```

所以这组完整公式的正确证据标签是：

```text
pk-era-formula-corpus
```

不能拿“去掉0.7”就冒充 Vanilla 原公式。

当前 profile：

```text
vanilla-pc-1.0
vanilla-pc-1.1
vanilla-pc-1.2-plus
pk-pc-formula-corpus
pk-pc-reverse-support
console-separate-open
```

Vanilla 为了模拟闭环若临时复用 PK 公式，必须输出：

```text
compatibilityAssumption=true
```

现有 PK 公式 corpus 的 exact build（PK1.0 / 1.1 / 1.1.1）仍 open。官方 PK1.1/1.1.1 changelog 没有列外交成功率或友好度专项变化，只能说明：

```text
no-explicit-diplomacy-change-in-public-changelog
```

不能证明二进制完全一致。

PK 外交府继续只确认：

- `005BD040 GetDiplomacyActionPointCost`；
- 执行城市有外交府时外交 AP 减半；
- 亲善所需金减半；
- 没有文档证据给同盟/停战/交换/劝降成功率额外 multiplier。

详细版本矩阵：
- `37-diplomacy-version-boundaries.md`
- `../sources/diplomacy-version-boundaries.json`

版本来源：
- KOEI Vanilla Ver.1.1：https://www.gamecity.ne.jp/regist_c/user/san11/san11_update.htm
- KOEI Vanilla 1.2～1.3.3：https://www.gamecity.ne.jp/regist_c/user/san11/san11_update02_history.htm
- KOEI PK Ver.1.1/1.1.1：https://www.gamecity.ne.jp/regist_c/user/san11/pk/san11pk_update.htm
- 4Gamer PK（超级新增）：https://www.4gamer.net/review/sangokushi11pk/sangokushi11pk.shtml
- PK 外交府手册：https://cdn.akamai.steamstatic.com/steam/apps/628070/manuals/32sangokushi11wpk_manual.pdf

公式来源：
- https://game.ali213.net/forum.php?action=printable&mod=viewthread&tid=1262010
- https://www.ptt.cc/bbs/Koei/M.1217946021.A.1FA.html
- https://zhidao.ali213.net/q/13047392.html


## 7. 论客

- 论客可把外交失败转入舌战。
- repo 现有：初级/上级高触发、超级约20%。
- 舌战实际胜负见 `11-debate.md`。

## 8. 断盟

- 断盟降低友好并扣技巧P。
- 现有可靠表：技巧P -50。
- 停战本身不会被对方主动“撕毁”；可通过先转同盟再破弃等系统路径改变状态。

来源：https://w.atwiki.jp/sangokushi11/pages/15.html
