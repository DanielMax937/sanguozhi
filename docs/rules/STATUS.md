# 规则审计当前状态

更新：2026-10-01。

## 最新完成：E15 舌战普通牌心理伤害

当前逐点审计已写回 A1–A5、B1–B9、C1–C11、D1–D10、E1–E15，共50个审计点。

- [当前总表](17-post-15-source-audit.md)
- [E15 规则正文](30-debate-psychological-damage.md)
- [E15 结构化证据](../sources/debate-psychological-damage.json)
- [E15 校验脚本](../../scripts/check_debate_psychological_damage.py)
- [舌战主规则](11-debate.md)
- [E14 单挑连续公式](29-duel-continuous-formulas.md)

E15 已关闭“普通数字牌与话术的精确心理伤害函数未知”中的通用核心。

PC-PK 导向舌战先按双方智力生成每方固定 `attack`，再由牌力决定回合胜负；胜方的心理伤害另走独立公式。当前话题小/中/大 power=11/12/13，非当前=1/2/3，无视120、大喝110、诡辩20，但 power 差本身完全不进入 hpDamage。

普通话题牌伤害使用：

```text
(attack + 0..4)
× angerCoef
× levelCoef
× topicCoef
/1000
```

其中普通 level 为10/15/20，当前话题 topicCoef=10，非当前=6。同智力时当前话题小/中/大为100～104 / 150～156 / 200～208，非当前为60～62 / 90～93 / 120～124。

大喝使用固定15×12模板；诡辩用自己的attack反弹对方普通话题牌模板；无视不造成HP伤害，只+30怒气。镇静/激昂是独立怒气效果层。

可出牌数也锁定为 <70=3、70–79=4、80–89=5、>=90=6，内部另有固定“再考”槽。

下一项：E16 非骑战法来源的负伤 / 战死概率。
