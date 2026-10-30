# 城市与运输队逐旬中性耗粮叶子 v1

固定证据 main `f132870bb58505acd0572c23e3ba91592eefa849`。本地候选、未执行、未测试 / typecheck / build，未远端发布。

## 唯一接口

`planSyntheticNeutralFoodTick(rawContext, rawConfig)`：

```
context = { turn, date:{year,month,day:1|11|21},
  city:{id,ownerId,troops,food,foodCapacity},
  transports:[{id,ownerId,troops,food,foodCapacity}] }
config = {profile:'city-transport-neutral-food-v1'}
```

仅此接口；不提供 transferContext 第二版本。输入取同一 outer owner **当前** city ledger 与 transport stock，不能取创世库存。城市及运输兵均须正数；合成ID、同owner、唯一账号，最多8运输队；既有transport上限60000兵/500000粮保持。完整DTO有界detach，拒非法数值、未知字段、重复身份、负数、-0、accessor等。

输出 `foodPatches:[{id,foodBefore,foodAfter}]` 与完整 receipt（当前turn/date、每账号精确有理数normalRaw/combinedRaw、requestCost、debited、shortfall、耗尽/可用状态和food sink ledger）。仅提案，没有独立存档、余额持有者或可执行命令队列，不推进日期，不恢复AP，不动金/兵/士气/装备/工资/忠诚。失败不返回半patch。

helper 不假装单独具有 exactly-once 能力。唯一 world owner 在接受 `WorldTick` 时校验旧/新日期恰下一旬、turn+1、命令去重和revision，并**每一成功旬只调用/提交一次**。重复直接调用该纯函数只是同提案，不是重复结算授权。任何其他同旬阶段失败应连同粮提案全部丢弃。不得在子city Tick和outer WorldTick各调用一次。

## 逐行来源与范围

完整实际源码保存于 `san11-neutral-food-leaf-20261030/evidence/food-supply-lifecycle.ts`（固定ref读取）。提取而非执行整个服务：

- 源158–162：`rational` / `mul` / `bits` 有理数及IEEE sourcebits转换。原 `SCALE=bits(0x3d4ccccd)` 保留，不能替换为十进制近似0.05。
- 源167–181：`ConsumeTurn` 的 consume 中，city normal=`troops/40`，transport normal=`troops*SCALE`，粮0原样skip。火分支在此具名中性profile不参与，combinedRaw与normalRaw相同。
- 源177–180：一次截断，正兵最小消费请求1，实际扣除min(foodBefore,requestCost)，余数报shortfall，不写任何兵损。
- 源202–213：原服务每个ConsumeTurn遍历一次账号；本叶不复制session，而由outer的唯一Tick承担相同一次性职责。

源服务粮0状态 `already-empty-skipped` 的requestCost/shortfall为null，保留此差异，不伪造“供给充足”。粮耗尽到0允许；不制造部队兵0，不执行饿死、伤亡、撤退、删除或Closing。

## 未建模，不等于观察到不存在

当前city/transport没有空间火灾owner或覆盖索引，因此本profile明确 `fireAndCoverage:'not-modeled-not-a-no-fire-observation'`。**不能声称事实上无火**，也不能拿本叶代替完整火灾耗粮。提取中性叶无需编造军官政治值或虚构账户金/装备。

部署field兵粮仍 `fieldFoodCovered:false`：field没有自己的food账户前不能声称覆盖了全部军队。未来若接真实current field food与火格、运输位置、政治、coverage，须另明确合同，不能修改此profile含义。

city/transport资源在既有唯一owner；不保存金、装备副本，也没有伪造resource0占位。本文件没有import/call任何season模块、health/plague模块、whole season execute/load/preview/replay、P078，亦不调用候选代码。不得用“耗粮阶段”偷跑其余季节效果。
