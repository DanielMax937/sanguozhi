# 金收入与完整工资：私有兼容阶段

本页描述固定单城财政服务的金输入适配、金收入及完整工资兼容抽取。它保留原有玩法和保存协议，为其他有独立合同的 owner 提供可复用接缝；本身没有建立市场建设 owner，也没有接合动态市场收入。固定财政仍从 genesis 的30槽设施生成收入观测，不在 snapshot 增设设施，不新增普通名单下限、工资保留金或施工完成规则。

[财政完整规则](../rules/city-finance-lifecycle.md) · [原公共 API](city-finance-lifecycle.md) · [城市金核](../rules/city-money-income-projection.md) · [月特产阶段](monthly-specialty-phases.md)

这是源码及规则静态交付。未运行产品、测试、typecheck、编译、build、validator、场景、序列化或输出尺寸测量；下文同值关系为逐段源码论证，不是运行验证结论。原source、stock/native/ABI与原43组主题、45份快照的证据边界不扩大，P078及依赖继续排除。

## 1. 模块与职责

- [types](../../packages/engine/src/internal/finance-money-payroll-types.ts)：闭合 facts、gold target、完整核、工资及失败联合类型，仅 type import 原金核类型
- [leaves](../../packages/engine/src/internal/finance-money-payroll-leaves.ts)：五个纯叶，只值导入既有设施、有名官职、财政政策 JSON
- [phases](../../packages/engine/src/internal/finance-money-payroll-phases.ts)：两个分开的阶段，只值导入原金核、leaves、既有政策 JSON
- [财政 owner](../../packages/engine/src/city-finance-lifecycle.ts)：保留唯一日历、名单验证、候选 clone、receipt、粮/季降、四兵种顺序、history、事务与预算

只有七个私有函数值导出，不经 public index 或 package exports 注册：

| 函数 | 参数 | 返回 |
|---|---|---|
| deriveFinanceMoneyInput | facts: FinanceMoneyFacts | FinanceMoneyInputResult |
| compareFinanceOfficerIds | a,b: FinanceOfficerIdFact | -1 \| 0 \| 1 |
| resolveFinancePayroll | ordered: readonly FinancePayrollOfficerFact[] | FinancePayrollResult |
| readFinanceMoneyRequest | amount: number | FinanceMoneyRequestResult |
| creditFinanceMoney | reason: FinanceMoneyCreditReason, before/capacity/requested: number | FinanceMoneyCreditResult |
| applyFinanceMoneyPhase | input: FinanceMoneyPhaseInput | FinanceMoneyPhaseResult |
| applyFinanceFullSalaryPhase | input: FinanceFullSalaryPhaseInput | FinanceFullSalaryPhaseResult |

没有新 public parser、动态mode、替代核、任意政策入口、错误回调或 owner 工厂。private失败壳不落入保存或公开receipt。

## 2. 精确类型

设施及人员 facts 只读；gold target 唯一可写字段为 gold。数值和ID继续使用原primitive表示，范围/稠密30槽/身份由原owner验证，不把 TypeScript 类型当作运行时校验。原完整金核 input/result 类型直接引用，不改成 unknown 审计摘要。

```ts
import type {
  CityMoneyIncomeProjectionInput,
  CityMoneyIncomeProjectionReceipt,
  CityMoneyIncomeProjectionRejectionReason,
} from '../city-money-income-projection.ts';

export type FinanceMoneyFacilityKind =
  | 'market' | 'farm' | 'mint' | 'granary'
  | 'large-market' | 'fish-market' | 'black-market'
  | 'military-farm' | 'forge' | 'stable';
export type FinanceMoneyFacilityFact = {
  readonly kind: FinanceMoneyFacilityKind;
  readonly level: number;
  readonly complete: boolean;
  readonly position: { readonly q: number; readonly r: number };
};
export type FinanceMoneyFacts = {
  readonly facilities: readonly (FinanceMoneyFacilityFact | null)[];
  readonly baseMoneyWord: number;
  readonly difficulty: 'normal' | 'super';
  readonly controller: 'player' | 'ai';
  readonly securityBeforeIncome: number;
};
export type FinanceGoldTarget = {
  gold: number;
  readonly goldCapacity: number;
};
export type FinanceMoneyPhaseInput = FinanceMoneyFacts & {
  readonly monthStart: boolean;
  readonly taxationActive: boolean;
  readonly wealthyActive: boolean;
  readonly goldTarget: FinanceGoldTarget;
};
export type FinanceMoneyInputResult =
  | { readonly ok: true; readonly input: CityMoneyIncomeProjectionInput }
  | { readonly ok: false; readonly reason: 'unsupported-facility' };
export type FinanceMoneyRequestResult =
  | { readonly ok: true; readonly requested: number }
  | { readonly ok: false; readonly reason: 'unsupported-kernel-return' };

export type FinanceMoneyCreditReason = 'money-base' | 'wealthy-bonus';
export type FinanceMoneyCreditWrite = {
  readonly resource: 'gold';
  readonly reason: FinanceMoneyCreditReason;
  readonly before: number;
  readonly requested: number;
  readonly accepted: number;
  readonly actualDelta: number;
  readonly after: number;
  readonly cap: number;
  readonly discarded: number;
  readonly writerPolicyId: string;
};
export type FinanceMoneyCreditResult =
  | { readonly ok: true; readonly write: FinanceMoneyCreditWrite }
  | { readonly ok: false; readonly reason:
        'unsupported-kernel-return' | 'invalid-resource-boundary' };
export type FinanceMoneyCalledKernel = {
  readonly status: 'called';
  readonly api: 'calculateCityMoneyIncomeProjection';
  readonly profile: 'city-money-income-stable-resolved-i32-safe-v1';
  readonly adapterObservationKind: 'derived-adapter-observations';
  readonly input: CityMoneyIncomeProjectionInput;
  readonly result: CityMoneyIncomeProjectionReceipt;
};
export type FinanceMoneyNotDueKernel = {
  readonly status: 'not-due';
  readonly reason: 'nonmonthly-without-taxation';
};
export type FinanceMoneyFailureReason =
  | 'unsupported-facility'
  | `money-kernel:${CityMoneyIncomeProjectionRejectionReason}`
  | 'unsupported-kernel-return'
  | 'invalid-resource-boundary';
export type FinanceMoneyPhaseResult =
  | {
      readonly ok: true;
      readonly kernel: FinanceMoneyNotDueKernel;
      readonly writes: [];
    }
  | {
      readonly ok: true;
      readonly kernel: FinanceMoneyCalledKernel;
      readonly writes: [FinanceMoneyCreditWrite]
        | [FinanceMoneyCreditWrite, FinanceMoneyCreditWrite];
    }
  | { readonly ok: false; readonly reason: FinanceMoneyFailureReason };

export type FinanceOfficerIdFact = { readonly id: string };
export type FinancePayrollOfficerFact = {
  readonly id: string;
  readonly officeId: number;
};
export type FinanceSalaryItem = {
  readonly officerId: string;
  readonly officeId: number;
  readonly officeName: string;
  readonly catalogSalary: number;
};
export type FinancePayroll = {
  readonly items: FinanceSalaryItem[];
  readonly sum: number;
};
export type FinancePayrollResult =
  | { readonly ok: true; readonly payroll: FinancePayroll }
  | { readonly ok: false; readonly reason: 'unsupported-payroll-identity' };
export type FinanceSalaryNotDue = {
  readonly status: 'not-due';
  readonly items: FinanceSalaryItem[];
  readonly sum: number;
  readonly availableBeforeSalary: null;
  readonly paid: 0;
  readonly shortfall: 0;
  readonly payerPolicyId: string;
};
export type FinanceSalaryPaid = {
  readonly status: 'paid';
  readonly items: FinanceSalaryItem[];
  readonly sum: number;
  readonly availableBeforeSalary: number;
  readonly paid: number;
  readonly shortfall: 0;
  readonly payerPolicyId: string;
};
export type FinanceSalaryWrite = {
  readonly resource: 'gold';
  readonly reason: 'salary';
  readonly before: number;
  readonly requested: number;
  readonly accepted: number;
  readonly actualDelta: number;
  readonly after: number;
  readonly cap: number;
  readonly discarded: 0;
  readonly writerPolicyId: string;
};
export type FinanceSalaryShortfallProposal = {
  readonly required: number;
  readonly available: number;
  readonly shortfall: number;
};
export type FinanceFullSalaryPhaseInput = {
  readonly monthStart: boolean;
  readonly payroll: FinancePayroll;
  readonly goldTarget: FinanceGoldTarget;
};
export type FinanceFullSalaryPhaseResult =
  | { readonly ok: true; readonly salary: FinanceSalaryNotDue;
      readonly write: null }
  | { readonly ok: true; readonly salary: FinanceSalaryPaid;
      readonly write: FinanceSalaryWrite }
  | { readonly ok: false; readonly reason: 'unsupported-salary-shortfall';
      readonly proposal: FinanceSalaryShortfallProposal };
```

items与writes是普通数组/tuple，元素字段只读；它们可结构赋值给旧可变SalaryItem[]/Write[]，最终递归冻结仍由公开边界执行。called的writes单项必为money-base，双项必按money-base、wealthy-bonus排列；该顺序同时由阶段控制流保证。not-due的writes只能为空，工资not-due的write只能为null。policyId虽保持原string类型，实际值只能来自固定JSON，调用者不能填入政策。

## 3. 金核输入的完整映射

### 3.1 30槽与全部18条设施映射

按owner提供的稠密槽索引顺序构造新slots，null保持null，不补空、截短或重排。每个非空先在固定设施rows中按kind和level查找，首个缺行返回unsupported-facility；然后才生成constructionWord与条件邻接字段。

| kind | level | facilityTypeWord |
|---|---|---|
| market | 1、2、3 | 31、50、51 |
| farm | 1、2、3 | 32、52、53 |
| mint | 1 | 38 |
| granary | 1 | 39 |
| large-market | 1 | 46 |
| fish-market | 1 | 47 |
| black-market | 1 | 48 |
| military-farm | 1 | 49 |
| forge | 1、2、3 | 0、0、0 |
| stable | 1、2、3 | 0、0、0 |

forge/stable的0只为旧adapter忽略哨兵，未恢复其原生类型编号。constructionWord为complete?1:0。仅普通market且complete或level>1时附adjacentMint；其false也显式保留。未完L1、三特殊市场、farm、mint、granary、军屯、forge/stable完全省略该键，不用undefined占位。

邻接只在该消费分支求值：同一设施数组内，complete mint且 `max(abs(dq),abs(dr),abs(dq+dr))===1`。多个mint只取存在性；距离0、2与未完mint不生效。未完工L2的50→31、L3的51→50回退仍由原核负责，保留原facilityTypeWord审计，adapter不先改为回退类型。

### 3.2 顶层输入与核支持域

顶层原键次序为profile、baseMoneyWord、slots、resolvedTypeRows、difficultyWord、条件cityPlayerPredicate、securityByte。固定profile为city-money-income-stable-resolved-i32-safe-v1。六行resolvedTypeRows始终全部提供，valid均true：31→100，50→120，51→150，46→300，47→200，48→80；不只保留消费行，也不接受自定义产值。

normal→difficultyWord1，player/ai两者都省略cityPlayerPredicate；super→2，两者都附真实controller==='player'。securityByte取before.city.security，不取季降后的余额对象字段，不追加clamp。基础金0..65535、旧治安0..100及全部18映射不缩域。金核自身更宽的Easy0、其他U32难度与治安101..255未被修改。

## 4. 金阶段：完整分支与逐笔写入

monthStart、taxationActive、wealthyActive分别简称月初、征税、富豪，M为原核真实返回。

| 月初 | 征税 | 富豪 | 核与写入请求 |
|---|---|---|---|
| false | false | false | not-due；无适配、核、金读取或写入 |
| false | false | true | 同上；富豪单独不触发 |
| false | true | false | 一次核；base=floor(M/2) |
| false | true | true | 一次核；base=floor(M/2)，无bonus |
| true | false | false | 一次核；base=M |
| true | false | true | 一次核；base=M，bonus=floor(M/2) |
| true | true | false | 一次核；base=floor(M/2) |
| true | true | true | 一次核；base=floor(M/2)，bonus=floor(base请求/2) |

非due先返回，不访问设施成员、不查设施表、不调用核，也不读取gold/goldCapacity。传入普通已detached scalar与对象引用不等于提前适配或读取余额。

due的严格顺序：适配全部slots→检查适配结果→原核一次→supported检查→正请求检查→算H→构造完整called→读取真实gold/capacity→base credit检查→立刻写gold→条件bonus再读真实gold/capacity并credit→写gold→返回完整核和有序writes。没有净收入减工资再clip的捷径。

正请求检查顺序为 `!Number.isSafeInteger(amount) || amount < 0 || Object.is(amount,-0)`；失败unsupported-kernel-return。credit入口再次检查请求，然后accepted=min(requested,capacity-before)，再要求accepted为安全整数且非负，否则invalid-resource-boundary。不新增before/cap提前门，不把NaN、拒绝或负值默认成0。

每笔保留全部原writer字段和键序：resource=gold、reason、before、requested、accepted、actualDelta=accepted、after=before+accepted、cap、discarded=requested-accepted、writerPolicyId=saturating-positive-credit-v1。base与bonus各自cap，bonus基于请求H而非accepted；满仓、capacity0或base全弃置也不省略bonus。M=0仍called，保留原核以及零credit，不改为not-due。所有合法零值保持+0。

called保留status、api、profile、adapterObservationKind、input、result六字段。input就是实际传给核的完整输入；result就是同一原返回对象，完整含supported/profile/baseMoneyWord/difficultyWord/securityByte、30槽、rawMoney/difficultyPercent/effectiveSecurity、intermediates、returnedIncome及evidence。每槽保留index/facilityTypeWord/effectiveType/status/moneyYieldWord/mintApplied/contribution；intermediates保留scaledRaw/difficultyProduct/difficultyAdjusted/securityProduct/securityAdjusted，normal的difficultyProduct仍null。不得只保存收入值、重新计算第二次核或删证据。

base成功而bonus失败时，候选gold可以已有base值，但整个候选被owner丢弃。私有失败不返回部分kernel/writes。receipt赋值和push在阶段成功后回到原接缝，成功次序仍base→bonus→food；普通数据合同无中间观察回调，失败公开结果不含部分receipt，因此此局部封装不改变可观察业务结果。

## 5. 每旬完整查薪与月初足薪

### 5.1 排序、目录及全部工资行

owner先复制完整officers数组，再用精确比较 `a.id < b.id ? -1 : a.id > b.id ? 1 : 0` 排序。不能localeCompare、数字ID排序、按官职排序或原位sort输入；完整人员对象仍供技能和太守查找。

resolveFinancePayroll每旬调用，在effects之后、governor及harvest选择/缺项检查之前。按已排次序逐人find固定namedOffices.offices，生成officerId、officeId、officeName、catalogSalary四字段；首缺行返回unsupported-payroll-identity。不能延至月初、二次排序、过滤人员、边生成边增设金额检查或更改原字形。全部items完成后才按原reduce求和，初值+0。

以下为固定目录全部80项；资格、角色、唯一官职、完整驻城、同城同势力、俘虏0及太守归属仍由原owner解析，不在叶里重建新名单政策。

| officeId | 官职 | 每月金 |
|---:|---|---:|
| 0 | 丞相 | 60 |
| 1 | 司空 | 60 |
| 2 | 太尉 | 60 |
| 3 | 司徒 | 60 |
| 4 | 大都督 | 55 |
| 5 | 衛將軍 | 55 |
| 6 | 驃騎將軍 | 55 |
| 7 | 車騎將軍 | 55 |
| 8 | 光祿勳 | 50 |
| 9 | 大司農 | 50 |
| 10 | 廷尉 | 50 |
| 11 | 衛尉 | 50 |
| 12 | 征東將軍 | 50 |
| 13 | 征南將軍 | 50 |
| 14 | 征西將軍 | 50 |
| 15 | 征北將軍 | 50 |
| 16 | 尚書令 | 45 |
| 17 | 太僕 | 45 |
| 18 | 太常 | 45 |
| 19 | 大鴻臚 | 45 |
| 20 | 鎮東將軍 | 45 |
| 21 | 鎮南將軍 | 45 |
| 22 | 鎮西將軍 | 45 |
| 23 | 鎮北將軍 | 45 |
| 24 | 中書令 | 40 |
| 25 | 御史中丞 | 40 |
| 26 | 執金吾 | 40 |
| 27 | 少府 | 40 |
| 28 | 安東將軍 | 40 |
| 29 | 安南將軍 | 40 |
| 30 | 安西將軍 | 40 |
| 31 | 安北將軍 | 40 |
| 32 | 秘書令 | 35 |
| 33 | 侍中 | 35 |
| 34 | 留府長史 | 35 |
| 35 | 太学博士 | 35 |
| 36 | 左將軍 | 35 |
| 37 | 右將軍 | 35 |
| 38 | 前將軍 | 35 |
| 39 | 後將軍 | 35 |
| 40 | 謁者僕射 | 30 |
| 41 | 都尉 | 30 |
| 42 | 黄門侍郎 | 30 |
| 43 | 太史令 | 30 |
| 44 | 軍師將軍 | 30 |
| 45 | 安国將軍 | 30 |
| 46 | 破虜將軍 | 30 |
| 47 | 討逆將軍 | 30 |
| 48 | 郎中 | 25 |
| 49 | 從事中郎 | 25 |
| 50 | 長史 | 25 |
| 51 | 司馬 | 25 |
| 52 | 平東將軍 | 25 |
| 53 | 平南將軍 | 25 |
| 54 | 平西將軍 | 25 |
| 55 | 平北將軍 | 25 |
| 56 | 太楽令 | 20 |
| 57 | 大倉令 | 20 |
| 58 | 武庫令 | 20 |
| 59 | 衛士令 | 20 |
| 60 | 牙門將軍 | 20 |
| 61 | 護軍 | 20 |
| 62 | 偏將軍 | 20 |
| 63 | 裨將軍 | 20 |
| 64 | 主簿 | 15 |
| 65 | 諫議大夫 | 15 |
| 66 | 侍郎 | 15 |
| 67 | 中郎 | 15 |
| 68 | 忠義校尉 | 15 |
| 69 | 昭信校尉 | 15 |
| 70 | 儒林校尉 | 15 |
| 71 | 建議校尉 | 15 |
| 72 | 左僕射 | 10 |
| 73 | 右僕射 | 10 |
| 74 | 典農校尉 | 10 |
| 75 | 議郎 | 10 |
| 76 | 奮威校尉 | 10 |
| 77 | 長水校尉 | 10 |
| 78 | 破賊校尉 | 10 |
| 79 | 武衛校尉 | 10 |

80项唯一官职总额为 `4×60+4×55+8×(50+45+40+35+30+25+20+15+10)=2620`；4800只是80×60的保守宽界。太学博士、黄門侍郎、安国將軍、太楽令等混合字形按原目录保留。名单支持0..80人；真实空列表得到items=[]、sum=+0，不引入其他owner的1..8下限/上限。

### 5.2 分离的发薪阶段

full salary接收先前resolver的同一payroll，不再次查表，不接受公开工资答案。非月初返回not-due、完整items/sum、availableBeforeSalary=null、paid0、shortfall0、payerPolicyId=complete-named-office-payroll-v1、write=null；不读取gold/capacity或提前判断affordability。owner保留receipt初始化时原not-due工资对象，不把临时壳赋回。

月初先读取当前真实gold为available。sum>available返回unsupported-salary-shortfall，proposal按required=sum、available、shortfall=sum-available排列；不扣金、不补钱。足额则执行原 `gold -= sum`，随后构造paid salary和完整debit，availableBeforeSalary为扣前余额，paid=sum，shortfall0。

salary write的resource=gold、reason=salary、before=available、requested=accepted=sum、actualDelta=sum===0?0:-sum、after为减后真实gold、cap为真实goldCapacity、discarded0、writerPolicyId=exact-affordable-salary-debit-v1。sum===available精确归零；空名单sum0仍paid并保留零debit，绝不省略或改not-due，不产生-0。没有工资保留金、W>0门、额外safe-integer门、部分支付或人员钱包。

工资不足拒绝整个Advance，包括已经候选写入的金粮、季降/RNG、日期与库存，是atomic-month-reject-shortfall-v1工程政策，不认证原作欠薪后果。未进入后续specialty，也不引入俘虏维护或欠薪finalizer。

## 6. 原位时序、真实target与首错

完整顺序保持：advance/turn/calendar门→复制排序→effects→完整payroll→governor→harvest选择/缺项检查→原receipt与闭包→harvestCurrent更新→money→food（包括harvest乘数后levy、粮写入）→季降/RNG→salary→specialty1→2→3→4→clock/events。

harvest准备和harvestCurrent在money之前；只有粮中的harvest乘数、粮写入和季降在money与salary之间。money使用before.city.security；salary读取粮与季降之后的当前gold，不缓存预算余额。无due不提前适配，工资查表不延后。由此missing-harvest-input早于money，money早于food，rng-exhausted/rng-bound-mismatch早于工资不足，工资不足早于所有特产核或库存错误。detach/parser/horizon、state全fold、命令ID冲突/revision/history及日历门保持原位置，duplicate不进入阶段。

两个phase都收到 `goldTarget: after.city`，这里after来自原clone(before)。不是两个数字的副本、before.city、公共输入、另建财政子state、Proxy或commit callback。阶段只有以下写权：

- money：base成功后赋gold一次；月初富豪bonus成功后再赋一次
- salary：due且足额时对gold执行一次减法，sum0也保留该语句
- leaves：仅构造本地slots/items及结果，不写入参数、原数组或JSON目录；比较器不排序
- owner：原位映射完整moneyKernel，依序push同一write对象；仅工资paid分支替换salary和push同一debit

food/security/inventory/officers/positions/capacity/date/turn/revision/advancedCount/harvest/rng/history/genesis/policies/digests都不在新阶段写域。原foodInput、adjacent/typeWord、positiveRequest/credit/addCredit继续原样供food；季降及月特产内部实现均未改。未完设施、stable设备4、非月初/无太守/非特产/count0/production和合法binary32小数保留。

### 6.1 唯一错误品牌

只有原owner的Invalid/fail/failure；private阶段不创建Error、throw失败DTO或catch-all。业务联合在原接缝映射：

| private失败 | owner转换 | proposal |
|---|---|---|
| unsupported-facility | fail(reason) | null |
| money-kernel:invalid-input / unexpected-field / unsupported-profile / missing-type-row / missing-adjacent-mint / unsupported-arithmetic-domain | fail(reason) | null |
| unsupported-kernel-return | fail(reason) | null |
| invalid-resource-boundary | fail(reason) | null |
| unsupported-payroll-identity | fail(reason) | null |
| unsupported-salary-shortfall | fail(reason,null,proposal) | 完整required/available/shortfall |

非预期异常继续穿透至原public failure，映射invalid-data和null proposal。reconstruct继续附历史index并保留proposal；trace的失败ExpectedOutcome仍只存reason，结构/期望失败再附外层index，不新增trace proposal。

## 7. 初始化和结构兼容

root原三个JSON imports、clone/digest/freeze注册常量与初态构造不变。leaves只读同一固定JSON值，没有top-level clone/digest/freeze、Map缓存、排序或校验；phases直接读取原payroll/debit政策值。封闭注册合同内，原冻结clone的行值与直接JSON行值相同，owner仍对完整scenario政策/目录做same检查。没有提供修改JSON模块或替换目录的公共入口，不承诺任意恶意改写内建原型或模块缓存的行为。

types的type imports消去；leaves和phases均不回import owner，没有循环或TDZ。原金核仍是同一个模块实例，其source deepFreeze不复制、不提前制造新的注册值、不将完整source全文装入每个receipt。没有I/O、系统时钟、随机、process/env、fs/util/crypto/Buffer、动态import或平台registry。

沿用ES2023、NodeNext、Node>=24<25、TypeScript7.0.2、strict、noUncheckedIndexedAccess、exactOptionalPropertyTypes、verbatimModuleSyntax、noEmit及.ts路径/JSON import attributes。未更改配置，也未以类型检查或运行声称通过；无any、unknown私有审计、双重断言、enum、namespace或参数属性。

逐项结构关系：旧十种Facility及position满足只读facility fact；完整Officer可作id/officeId视图；旧City正是gold/goldCapacity target；完整called/not-due可赋旧KernelCall；SalaryItem[]和salary两分支覆盖旧Receipt.salary；闭合gold write可赋宽Write；三个number proposal可赋原Failure.proposal。原公开KernelCall.input/result的unknown边界仍保留，私有精确类型不反向改动公开结构。

## 8. API、保存和完整预算的同值归纳

六个API不变：createCityFinanceState、previewCityFinanceCommand、executeCityFinanceCommand、saveCityFinanceState、loadCityFinanceState、replayCityFinanceCommands；输入unknown、输出Frozen及失败形状不变。15个CityFinance公开类型（ScenarioV1、StateV1、SnapshotV1、EnvelopeV1、PoliciesV1、CatalogsV1、ReceiptV1、WriteV1、FailureV1、StateResultV1、CommandResultV1、PreviewResultV1、SaveResultV1、TraceV1、ReplayResultV1）和五个CITY_FINANCE常量（POLICIES_V1、CATALOGS_V1、POLICY_DIGEST_V1、CATALOG_DIGESTS_V1、EVIDENCE_V1）均不修改。没有inspect API或公开phase API。

1. 初始：相同parser、完整政策/目录、clone/freeze、initialState与genesis/snapshot得到相同初态；初始日1不补发收入
2. 单步：原adapter逐槽值、ID比较/查薪、credit算术、due分支、salary减法及原位receipt映射逐项相同；未改粮/季降/四兵种/clock读取同值候选。成功snapshot/完整receipt及数组次序相同；失败reason/index/proposal同源
3. 全历史：对每个accepted prefix归纳，append追加相同envelope/receipt。最旧和最新duplicate都返回其原receipt，不重入phase；同ID冲突先于revision/limit，不只证明最近一次月收据
4. reconstruct：先初态budget；每步完整CommandResult预算后才比完整receipt；再比最终snapshot，最后budget(state)。没有trust-current或摘要重建捷径
5. preview/execute共用commandResult及完整execute预算；save/load继续重建，load保留有限parser和重复解码键拒绝。trace每步完整execution预算且失败candidate不提交，expectedOutcome独立比对，最后完整ReplayResult预算不变
6. 因每个既有budget接到同一JSON值，其canonical UTF-8、节点、深度、数组长度与对象键计数同值；没有靠删核审计、截历史、改上限或实测结果换取通过

固定限制仍为64MiB、4,000,000节点、48深度、1080数组、128对象键、360接受历史、720draw、80名单、30设施。合法派生小数不新增整数门，负零、伪造政策/目录/receipt/snapshot继续经过原解析和全fold。

save仅在重建后budget(state)，然后canonical(state)，没有额外budget({ok:true,json})的escaped SaveResult门。本次不补此门；原save字符串逐字符同值也意味着再次JSON转义后的内容同值，但不表示所有逃逸外层包络原本都经过64MiB门。新owner必须另证自己的完整预算，不能把旧财政范围当作动态市场的预算证明。

facts、target、private ok/failure包装不落盘；完整原input/result、政策目录、salary items和每笔write全部保留。以上是静态兼容证明义务的源码对应，尚未运行验收。

## 9. 可复用范围与证据边界

其他owner可以在自己的独立合同内，从真实当前设施形成同形facts，解析完整名单，并给出自己分离候选的真实gold target；这不自动建立建设/完成/收入/工资共享事务。固定财政的s.facilities、0..80名单、无工资保留金和原推进范围继续不变。动态市场接合仍未实现；已有独立forge月产能力不受此描述影响。

金核evidence原19项完整保留：level/profile/source/originalRange；fullCallerBytesVerified和stableResolvedInputsRequired为true；entryGatesIntegrated、stockOriginalVerified、originalExecutableExecuted、nativeHelpersReconstructed、abiVerified、realTraceReachabilityVerified、typeTableStockVerified、adjacencyHelperRecovered、rngRecovered、monthlySchedulerIntegrated、incomeWriterIntegrated、commandIntegrated、modBehaviorIncluded均false。外层真实候选gold写入不把原核incomeWriterIntegrated升为true，也不重新认证stock EXE、native helper/ABI或原始listing。所有原provisional政策与未恢复能力继续有效。
