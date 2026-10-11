# 征兵数量：显式ST0与逐调用观测限定核

`[source-listing-reconstruction][captured-caller-only]`

`calculateRecruitmentQuantityProjection` 使用 `recruitment-quantity-observations-f32-v1`。只恢复公开原体的数值及分支投影，不接入征兵命令或真实兵力写入；未认证stock、同版本helper/ABI或可达native trace。新树验收与发布状态以外部冻结收据为准，不复用历史审计/PR通过数字。

## 固定来源与转录

原作者sjn4048，固定[311MemoryResearch原文](https://github.com/sjn4048/311MemoryResearch/blob/66e167e40c3440929ec016f3872aefc3486434c1/内存资料/整理/Func-内政01-计算征兵数量.txt)，commit `66e167e40c3440929ec016f3872aefc3486434c1`、GBK Git blob `0b122837b1ff1ae11789121595531b64e80ff8d2`。[完整快照](../sources/recruitment-quantity-original.txt)仅可逆转为UTF-8；保留全部原注释、错字与独立MOD，另有[许可](../sources/recruitment-quantity-LICENSE.txt)、[证据记录](../sources/recruitment-quantity.json)及[闭合schema](../sources/recruitment-quantity.schema.json)。实现和解释器为本仓库新增投影，并非复制或运行原EXE。

- 原GBK 11,348字节、SHA256 `130f094728a1ccefe46c086e00f122a551fbe55e6c794626156a44072d2f43b9`
- UTF-8 12,020字节、SHA256 `1460bf463ff0e7a42fb81da8b35248748a249209b9b6213548f5ee1802ae4344`
- 原体 `[005C3610,005C3785)`，131条/373所列字节，SHA256 `222db5df5e94f2ac910dbdf6148258e815cc1494f345fa92751b4ccc2e09a5bb`
- 12直接及3间接CALL-site；附后005C3710跳转008A9D88的MOD共14条含patch，严格隔离。MOD的6BC064是乘100，与文本32矛盾，两种解读都不进入原体
- 原C1FA05/C1FA02是SAR EDX，不是来源的SAR DL。005C36EF的栈槽仍为技能10/15；005C370C FIMUL取同槽改写后的整数量，不是再乘一次技能

## 输入边界与执行顺序

始终只有profile、captures；全部入口门通过时另必须同时提供savedSecurityByte、resolvedFacilityFactorBits、difficultyWord。输入是封闭普通own-data-property记录，captures为稠密普通数组；不接受coercion、访问器、symbol、稀疏/特殊数组或未知键。Proxy元陷阱不在普通记录合同内，不声称可令任意恶意Proxy无副作用。

每个EAX捕获为 `{callAddress,eax}`，eax为uint32，地址为八位大写hex；仅三个循环site另有slotIndex 0..2。最大19项，按实际条件调用顺序消费，缺失、多余、错site/slot均工程拒绝supported=false，不能伪造成原生0。

1. 005C3619设施validator、005C3630首槽validator完整EAX零各自早退0；005C3643解析城市的EAX只留作opaque收据，再由005C364B validator决定早退。resolver零不替代validator结果
2. 通过后恰好扫描三槽；005C367B重新验证当前槽，不能复用首槽gate。非零才005C3689取得魅力，消费AL；005C36AA完整EAX非零表示查询0x4F命中。命中不提前停止后槽
3. savedSecurityByte明确是在005C36C1保存到BL的uint8，早于005C36C8倍率supplier。API不重读helper后城市治安
4. resolvedFacilityFactorBits明确代表调用者已捕获ST0，且ST0精确等于3F800000、3F99999A或3FC00000之一；分别为1、5033165/4194304、3/2。它不是等级输入、任意浮点或supplier EAX；不从注释自动恢复stock设施常量
5. 00707A74转换按有限正常向零合同推导，不能再输入独立且可能矛盾的转换EAX。difficultyWord是其后005C3717实际读取的uint32，仅恰等2才消费005C3725 city virtual48，且完整EAX零才double
6. 005C3738完整pressure EAX非零才向零half。随后消费005C374E首次troops与005C3757首次capacity；仅signed容量比较失败才消费005C3764二次troops和005C376B二次capacity，两轮不要求相等

三个入口早退分别只允许1、2或4个执行过的EAX捕获，禁止所有后续字段。完整路径调用数为 `12+2*validSlotCount+(difficultyWord==2?1:0)+(capacityFallback?2:0)`，最大21。与最多19个输入EAX不同，callDetails另有一个typed ST0供应观察和一个derived转换返回。

最小数值API省略每个有效槽的person+AE uint16勋功读及其最大值。该栈局部值后续未消费；这不等于完整memory-read trace。入口首槽通过而三次loop验证全失败合法，sum=0、技能10、N=1000，不能照搬生产数量的全无效拒绝。真实指针/人物身份、数组变化、局部寄存器保留和callee副作用仍是未证明的边界。

## 算术和反例

令O为保存治安byte，C为有效槽AL之和，S为技能参数10/15：

```
A = 1000 + floor((O+20)*C/20)
N = floor(A*S/10)
R = trunc(N*capturedST0)
if difficultyWord==2 and cityVirtualEax==0: R = ADD32(R,R)
if pressureEax!=0: R = signed toward-zero half(R)
if signed(firstCapacity) >= signed(ADD32(firstTroops,R)): return R
return SUB32(secondCapacity,secondTroops)
```

在本有限域C=0..765、O=0..255，N在1000..17277；转换量最大25915，super后最大51830。N的连续16278值超集用于24/53/64精度及四舍入模式的有限证明；部分舍入乘积不同于精确积，只保证本域最终向零整数相同。不证明异常、未知ST0、converter本体或实际FPU状态。

- O=0、C=4、S=15、3F99999A，正确1807；先倍率转换再技能误得1806。C=5则正确1808、误得1809
- 返回候选1501遇super及pressure时仍1501；交换二者顺序会误得1500
- 首次troops=capacity=INT_MAX，R=1000：ADD32回绕为负，signed JGE仍保留1000
- 首次troops/capacity=100/0触发fallback，二次0/10000返回10000，可能大于候选；二次100/0返回signed−100；二次FFFFFFFF/0返回1

因此通用min或zero clamp都不是原caller规则。`min(R,capacity-troops)`只适用于两轮getter稳定、普通非负且无溢出的额外前提。pressure的floor写法只在本非负前容量域等价，通用指令语义为signed向零。

输出深冻结并复制captures，保留signed返回与raw EAX、所有槽AL/完整EAX、sum/技能参数/A/N/转换量、super/pressure、wrapped first sum与容量fallback、条件性二次值及typed callDetails。早退没有执行的数值阶段为null；结果不是实际增加进城的兵数。

## 验证与未恢复部分

新验证包含完整source/GBK/blob/schema/许可身份、131条listing-byte解释器、每条指令及branch outcome/call覆盖、独立整数定宽与有限FPU证明、实际TypeScript API对照和mutants、源/模式协同变异、非法JSON/非JSON/getter零调用/输入不变与深冻结。实际执行数量及结果由新冻结树收据说明，不宣称任意uint32 captures笛卡尔积、native执行或真实trace穷尽。

仍缺005C3550完整设施选择和stock常量、同版本00707A74与FPU异常、validator/魅力/技能/pressure/容量/virtual原体、native ABI/对象/可达域、资格/300金与AP的执行连接、人口/经验功绩技巧点/治安损失/兵舍次数/实际troop writer及调度、clean-stock与跨版本。距离2/3格不由pressure返回值解决。本模块没有启动P0-78或新增任何其依赖实现；既有离线回归保持独立运行。
