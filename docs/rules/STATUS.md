# 规则审计当前状态

更新：2026-10-03。

## A1–E20 主审计已完成；正在清理 exactness gaps

A1–A5、B1–B9、C1–C11、D1–D10、E1–E20 共55个主审计点已经完成写回。

### 最新完成：P0-35 阵系 overlap winner / starvation original function 边界

- [P0-35 正文](70-food-overlap-starvation-function-boundary.md)
- [P0-35 结构化证据](../sources/food-overlap-starvation-function-boundary.json)
- [P0-35 校验脚本](../../scripts/check_food_overlap_starvation_function_boundary.py)
- [P0-12 阵系耗粮/粮尽](47-food-overlap-starvation-exactness.md)

P0-35 新收敛：

```text
0049D180..0049D1FF
  = defensive-facility single-selector

0059BF40
  = 每旬耗粮 + 粮尽提示
  != starvation troop-loss handler

00599AA0
  = 被围据点断粮人口衰减
  != 野外部队粮尽逃兵
```

因此 overlap 不叠加仍为 exact，但不同等级重叠时谁赢继续 open；野外部队粮尽掉兵的原函数地址/body仍未找到，0.76继续仅作 legacy compatibility。

下一项：P0-36 补给/输送 finalizer 气力非整除 rounding 边界。










