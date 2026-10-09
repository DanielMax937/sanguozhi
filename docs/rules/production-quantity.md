# 生产数量：显式已解析 binary32 输入限定核

更新：2026-10-09 UTC。基线为 PR #50 已合并的 main `946bd63a83f4eae5256d4be8ac7d2674e01cedb3`。本批为生产数量本地候选，尚未发布；全新验收、独立审阅与恢复结果另记，不借用 PR #50 的 145 项或更早聚合结果。

## 证据、来源与许可

等级 `source-listing-reconstruction`；`stockOriginalVerified=false`、`originalExecutableExecuted=false`、`commandIntegrated=false`。这是公开列表的限定数值重建，未执行原 EXE 或原机器码，不认证 clean-stock、完整生产命令或跨版本 runtime。

固定来源：[sjn4048/311MemoryResearch 计算生产数量](https://github.com/sjn4048/311MemoryResearch/blob/66e167e40c3440929ec016f3872aefc3486434c1/内存资料/整理/Func-内政11-计算生产数量.txt)。原 GBK Git blob `e8c0c22e68e8557b202088290d52101abb02ca3a`，9650 bytes、SHA256 `cadf90aa55d43b69f407620abebccf6fb4307ed7dcb5511f434779f38b722285`。[UTF-8快照](../sources/production-quantity-original.txt)10336 bytes、SHA256 `65be4259fef8c741dee5d3df32a3f8fd6b00214427536daa624c0e6c8da00c53`，可逆编码回同一 GBK blob；正文、内联改法、MOD 和注释错字全保留。[证据 JSON](../sources/production-quantity.json)与[闭合 schema](../sources/production-quantity.schema.json)固定来源、支持域和限制。

源作者 sjn4048，源仓库许可 Apache-2.0。本数量快照复用已保存的[上游 LICENSE 副本](../sources/production-price-LICENSE.txt)，并在数量 metadata 明确归属；不是把价格研究当作数量来源。许可 Git blob `261eeb9e9f8b2b4b0d119366dda99c6fd7d35c64`、11357 bytes、SHA256 `c71d239df91726fc519c6eb72d318ec65820627232b2f796219e87dcf35d0ab4`；固定上游树没有 NOTICE 文件。

原函数 `005C63D0..005C64CD`，end-exclusive `005C64CE`，88 条 / 254 bytes，SHA256 `083337e2420a74a923349256cc7add7e6c665ccccad6f3406ea2f343d3bbceb1`；5 个 direct CALL、15 个相对 branch，以及 `005C64BB` 的 city vtable+0x48 间接调用。下列两套 MOD 完整隔离：

- 修改1“能吏繁殖效果自定义”：patch `005C648A..005C6490` 为 2 列表行、3 指令 / 7 bytes（JMP、NOP、NOP）；trampoline `008A95F8..008A960E` 为 6 条 / 23 bytes。两段 SHA256 分别为 `6125f5f7f6c9c2ba63eb342048fe99e88c24c29acd9c4a2c7281a260d4d6b106`、`b903c3a2e5461297bdfc3bb32924aeca36dcbbe257777186eedbff4424c139ab`。显示的 200/100 在支持正常域恰好等于原 ×2，不捏造正常域差异，也不将补丁覆盖原体
- 修改2“特产/非特产城市产量自定义”：patch `005C64A7..005C64AB` 为 1 条 / 5 bytes，trampoline `008A9D48..008A9D86` 为 20 条 / 63 bytes，另有 `008A8170..008A817F` 的 16 bytes 数据。SHA256 依次为 `73c515cccd0de0ba26d8fabd800aa94cf5e7f009a0edb8deaf6bad13e47b6a6b`、`729d96341ea81278f73ebb3d2b57b49bf7447189640155332e6f3280abbae09b`、`2fece05476ea75674604c5d22ec05d755837b18fb0ddedea70b6a17d70bc276f`。它读取 city+type+0x85 特产字段及作者数据区，不能混入原数量核

## 原字节执行顺序

1. `nativeEquipmentType` 以 signed32 比较：小于0或大于11返回0；5..11直接返回1，不读武将槽、设施倍率、难度或 city virtual
2. 0..4 进入计算：type0 的 `skillQueryId=-1`，type1..3 为80（0x50），type4 为81（0x51）。type0仍调用特技helper，不能自行假定它返回false，也不从业务 catalog 推导类型映射
3. 精确扫描三槽。`0047A630` 的完整 `TEST EAX,EAX` 为0才跳过当前槽；没有首槽有效门。每个有效槽调用 `00489090`，以 `MOVZX EAX,AL` 取0..255，然后计算总和和有符号max；随后 `004890F0` 的完整 EAX 非零把技能标志设为1。已有技能也继续读取后续槽
4. `baseQuantity = (maxAL + sumAL + 200) * 5`；有技能先乘2。`005C649B` 调 `005C5F90` 取 ST0，`005C64A0` 的 FIMUL 乘 signed32 技能后产量，`005C64A7` 调 `00707A74` 向零转换并保存 ESI
5. `difficultyWord` 完整 dword 恰好等于2才调用 city vtable+0x48；完整 `cityVirtualEax === 0` 才将已经转换的 ESI 再乘2。EAX256不是0，不能把它的 AL0 当成加倍条件
6. 原文 `005C6446` 旁的政治 getter `004890A0` 是内联 MOD 建议，原字节实际 CALL `00489090`。`005C64C2` 注释“超级难度电脑征兵加倍”为复制错字，原字节仍是生产数量的 ADD ESI,ESI

原体没有9000上限、1010最低值、政治、名声或直接特产倍率。全三槽无效时原生max保留 `INT32_MIN`，base低32位为 `0x800003E8`（signed -2147482648）；这条路径不是原生早退0，本API明确拒绝，byte oracle仍保留它。

旧攻略式 `((M+100)+(S-M)/2)*10` 在不提前取整时与 `(M+S+200)*5` 完全等价；差异是未经来源支持的提前取整、最终四舍五入和9000裁剪。新限定核不把攻略观察域自动升级为原版字节认证。

## API：闭合输入及显式观测

公开导出 `PRODUCTION_QUANTITY`、`calculateProductionQuantity`；profile 必须为 `production-quantity-resolved-f32-v1`。

输入必须是闭合 own-data-property 记录，拒绝未知字段、符号键、accessor、隐式转换、稀疏数组和非支持值。早退输入只含 `profile` 和 `nativeEquipmentType`，后者范围 -2147483648..2147483647；不能附上原路径未读取的槽、倍率或virtual。

0..4输入还必须包括：
- `slots`：恰好3个显式槽；null表示已解析为validator失败，否则是只含 `intelligenceGetterEax`、`skillHelperEax` 的闭合记录，二者均为完整uint32（0..4294967295）；至少一槽有效，首槽可以为null
- `resolvedFacilityFactorBits`：严格大写8位十六进制字符串，只允许 `3F800000`、`3F99999A`、`3FC00000`。必须是调用者已取得并确认的005C5F90实际ST0值，数值恰等于该binary32；不是选择设施等级的接口
- `difficultyWord`：完整uint32
- `cityVirtualEax`：只有difficultyWord恰等于2才必需，值为完整uint32；其他难度必须省略该字段，不能传null或undefined模拟一次未发生的调用

不提供默认值，不接收facilityLevel、任意JS倍率、AI布尔值、特产flag、人物/城市对象、原生pointer或回调。`3F999999`、小写bitword、NaN/Inf、负倍率和来源未知的ST0不支持；不得偷偷归一化。

成功计算回执包含 `reason=resolved-quantity`、`resolvedInputsObserved=true`，保留独立冻结三槽快照（raw EAX与 `intelligenceAl`）、`validSlotCount`、`intelligenceSum`、`intelligenceMax`、`skillQueryId`、`skillApplied`、`baseQuantity`、`skillAdjustedQuantity`、`resolvedFacilityFactorBits`、`convertedQuantity`、`difficultyWord`、`cityVirtualObserved`、`cityVirtualEax`、`superApplied`、`returnedQuantity` 及冻结evidence。非2难度的回执cityVirtualEax为null且cityVirtualObserved=false，与输入必须省略的契约分开。

成功早退回执分别为 `native-invalid-type-return-zero` / `single-item-return-one`，`resolvedInputsObserved=false`，返回0 / 1；没有虚构后续getter或倍率观察。工程拒绝以 `supported=false` 和原因返回，不能写成原生返回0。

## 浮点支持域的条件证明

三个输入因子是：`3F800000 = 1`、`3F99999A = 5033165/4194304`、`3FC00000 = 3/2`。中间值 `3F99999A` 不是精确6/5；必须保留bitword和实际因子身份，即使本域最终整数相同。

至少一槽有效时，base为1000..6100的5倍数，技能后n为1000..12200的5倍数。对这个2241值超集，3因子 × x87 precision 24/53/64 × down/up/toward-zero/nearest-even 四种舍入方向共80676项，正常返回后的最终向零结果分别恒为n、6n/5和floor(3n/2)。这只是有限支持域精度证明，不证明异常mask、任意浮点值、原FPU环境或实际stock常量。全域oracle与独立Fraction精度校验的本树运行结果须单独报告，不能借用前期研究记录。

[同固定来源的设施索引](https://github.com/sjn4048/311MemoryResearch/blob/66e167e40c3440929ec016f3872aefc3486434c1/内存资料/整理/专题索引01-内政设施.txt)（blob `784fcb92531dd474fa5ea6ebbba789c51e714f4a`）定位 `005C6048 FLD dword[0077B334]`、`005C605E FLD dword[00849118]`、`005C60E3 FLD dword[0074E718]`。但没有005C5F90完整设施选择，也没有这三个地址的原4bytes；禁止从“一级1/二级1.2/三级1.5”注释补出stock原表。00707A74身份仅沿用既有P0-10旁证，本批不升级成同版本完整callee认证。

## 必要反例与验证分层

- 只有第二槽AL100、factor1得到2000；有效AL0得到1000。它们否定首槽gate与1010最低值
- getter EAX256取AL0，257取AL1；skillHelper EAX256仍触发技能；cityVirtual EAX256不触发超级倍增
- AL为[1,1,null]时base1015：factor1.5普通为1522，技能先倍后转换为3045，超级转换后倍增为3044
- AL为[100,100,100]，技能、factor1.5、超级条件都满足时返回18000，无9000裁剪；AL全255同条件返回36600
- 多个技能命中仍只乘2，发现技能后不得漏读后槽；交换槽位或改变null位置不改变相同AL集合的结果
- 类型0的-1查询仍能由调用者观察到非零技能返回；difficulty0/1/3/FFFFFFFF不调用virtual，2且virtual0才翻倍
- 全无效槽工程拒绝，与oracle原生INT32_MIN哨兵路径分开；不为6/5与3F99999A捏造本域整数反例

`scripts/check_production_quantity.py`认证GBK/UTF-8、原88条/254字节、5 CALL/15 branch、独立MOD与数据、闭合schema、复用许可及当前文档，并用受控变异保护边界。`scripts/oracle_production_quantity.py`独立解码完整原body，外部调用作明确stubs，不执行机器码，也不将生产函数公式当期望值。可达(M,S)恰有65536对；与技能2×因子3×超级2交叉构成786432数值场景，再另测7种有效mask、类型gate、完整EAX与调用序。API测试、标准JSON Schema校验、精度证明与全域sweep属于不同验收层，不由一种通过替代另一种。

## 仍缺证据与不接入范围

仍缺 `0047A630`、`00489090`、`004890F0` 完整callee及可变调用语义；005C5F90设施选择/常量bytes/真实ST0来源；city virtual内部归属判断；同版本转换callee和异常FPU运行环境；完整生产资格、业务ID、费用/AP/EXP/功绩/TP、耗时、调度和实际库存writer。

[执行生产caller](https://github.com/sjn4048/311MemoryResearch/blob/66e167e40c3440929ec016f3872aefc3486434c1/内存资料/整理/Func-内政12-执行生产(非攻具舰船).txt)（blob `b21c4e03c048192e0144f64be35935f29b82bd04`）在005C6710调用数量后，于005C6720调用004B4040，随后保存作者标为“考虑城市兵装上限后的增加兵装数量”的返回值。这只证明后续writer分层存在，不证明004B4040全部语义。返回数量无9000cap，不等于实际入库无cap。

PR #50 的[生产价格核](production-price.md)已经合并；其中本地候选措辞是当时冻结的发布前记录，不表示价格尚未交付。本数量核不改价格计算、Train、EndTurn、state/save/replay或命令调度；P0-78与capture/force-extinction/native事务依赖继续排除。clean-stock PC-PK1.1、Vanilla、主机及完整原生runtime均未认证。
