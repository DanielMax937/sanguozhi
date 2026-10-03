# P0-19 登场 / 自然死亡 RNG 内部函数边界

更新：2026-10-03。主目标版本：PC-PK1.1。

## 1. 本轮结论

当前可由公开逆向资料稳定确认：

```text
00590C30 MonthlyAction
00590C6C month-start check
00590C82 call 005833D0

0048A000 GetDeathYear
00489160 IsMarkedForDeath
00488C80 IsDead
struct_person +0x15C HealthLevel
```

因此生命周期至少必须拆成：

```text
effective death-year query
!=
marked-for-death flag
!=
health state
!=
final DEAD identity
```

状态：

```text
P0-19-audit-complete
month-start-entry-exact
death-year-query-layer-exact
marked-death-flag-layer-exact
health-layer-exact
final-dead-layer-exact
transition-probabilities-open
005833D0-body-open
```

## 2. 005833D0 是月初 lifecycle handler，不是 GetDeathYear 本身

原每月例行处理：

```asm
00590C67 mov ecx,07201958
00590C6C call 00482680
00590C71 test eax,eax
00590C73 je   00590E7C

00590C79 mov ecx,edi
00590C7B call 0058BB30

00590C80 mov ecx,edi
00590C82 call 005833D0
```

因此 `005833D0` 应标为 month-start age/death lifecycle handler containing function，而不是 `GetDeathYear`。死亡年查询已有独立 helper：`0048A000 GetDeathYear`。

## 3. effective death year 是查询层

SIRE 地址表明确 `0048A000 GetDeathYear` = 角色死亡年查询，因此原程序存在独立的 `effectiveDeathYear = GetDeathYear(person)` 层。

这意味着 `person.YearOfDeath` 不能直接视为所有情况下最终有效死亡阈值。`GetDeathYear` 很可能组合原始 YearOfDeath、CauseOfDeath、scenario Lifetime、IgnoreAge 等修正，但完整函数体仍未公开，具体顺序继续 open。

## 4. 预定死亡 flag 是独立层

`00489160 IsMarkedForDeath` 与 `struct_person +0x124 Flags` 中的死亡预定位确认，说明达到有效死亡阈值不能直接等价为 `Identity = DEAD`。

中间至少存在 `markedForDeath` 运行时层。这与玩家提前出现身体不适/星象提示、随后才真正死亡的行为一致。

## 5. HealthLevel 是另一独立层

`struct_person +0x15C HealthLevel` 独立存在，且 `0048A110 GetPersonAttr` 会显式接收健康程度并影响属性。因此健康状态不是死亡 flag 的别名。

引擎必须允许 markedForDeath、health、Identity 处于不同组合，而不能把它们压成一个布尔 dead。

## 6. final death 是 Identity 层

公开 helper `00488C80 IsDead` 与身份表 `Identity 8 = DEAD` 说明最终死亡是进入 DEAD identity 的状态迁移，而不是简单表达式 `currentYear >= GetDeathYear(person)`。

## 7. 正确的四层生命周期模型

```ts
effectiveYear = GetDeathYearProfile(person, scenario)

onMonthStart(person) {
  evaluateDeathYearGate(person, effectiveYear)
  evaluateMarkedForDeath(person)
  updateHealth(person)
  maybeFinalizeDeath(person)
}
```

证据层：月初入口 exact；层级分离为结构级 exact；`005833D0` 内部 transition 顺序与概率仍 open。

## 8. 禁止继续使用 finalDeathDate 单字段

错误实现是开局一次性 roll `finalDeathDate`，到期就直接 dead。这会错误合并 GetDeathYear、monthly RNG、markedForDeath、HealthLevel、Identity transition。

已有存档重跑实测还显示未来死亡结果会随正常 PRNG 消费改变，因此不支持 scenario init 永久预抽。

## 9. 登场与死亡 handler 仍不能强行合并

P0-5 已确认 YearOfDebut / Identity / ScheduledLord 是独立字段。本轮没有证据证明 `005833D0` 同时负责所有未登场武将身份转换。

所以安全表述仍是：`005833D0 = age/death-related month-start handler`，而不是“complete debut+death state machine”。登场 setter / ScheduledLord branch 继续 open。

## 10. 当前可实现接口

```ts
interface PersonLifecycle {
  rawDeathYear: number
  causeOfDeath: number
  markedForDeath: boolean
  healthLevel: number
  identity: PersonIdentity
}

interface LifecycleRules {
  getEffectiveDeathYear(person, scenario): number | Infinity
  onMonthStart(person, scenario, rng): LifecycleDelta
}
```

`LifecycleDelta` 应允许分别变更 markForDeath、healthLevel、identity，而不是只返回 `dead: boolean`。

## 11. 本轮关闭 / 仍 open

已关闭 / 收紧：
- `005833D0` 只应视为月初 lifecycle handler；
- `0048A000 GetDeathYear` 是独立死亡年查询层；
- `00489160 IsMarkedForDeath` 是独立预定死亡 flag 层；
- `HealthLevel` 独立于死亡 flag；
- `IsDead / Identity=DEAD` 是最终状态层；
- 禁止用一个 finalDeathDate 合并上述所有层。

仍 open：
1. `005833D0` 完整 body；
2. `0048A000` 完整 body；
3. GetDeathYear 内 CauseOfDeath/Lifetime/IgnoreAge 的 exact 顺序；
4. markedForDeath 设置条件/概率；
5. HealthLevel 恶化/恢复 transition；
6. markedForDeath 到 final DEAD 的月度时序；
7. 登场身份转换是否在同一 handler；
8. ScheduledLord 精确 branch；
9. Vanilla / PS2 / Wii 差异。

## 12. 来源

- sjn4048/311MemoryResearch `内存资料/函数[每月例行处理].txt`
- sean2077/311SireCustomizedPackageDev `material/内存地址汇总.md`
- sean2077/311SireCustomizedPackageDev `material/结构体汇总.md`
- 关联：`40-debut-death-exactness.md`、`docs/sources/debut-death-exactness.json`
