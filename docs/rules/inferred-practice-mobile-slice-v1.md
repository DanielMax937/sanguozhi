# 200×200 合成练习图 → v3 小型移动图切片

`createInferredPracticeMobileSlice(originX,originY,width,height)`调用已存在的`createInferredPracticeMovementRequest()`，不另写地形/邻接算法，不执行movement核或初始化世界。窗口在0..199范围，宽高正整数、乘积≤16；不是扩大全图世界状态预算。

保留已有生成器的合成odd-q邻接、terrainInfoU32、blocked、unsupportedContext、facilityPresent；ID按可逆`g-x-y → synthetic-practice-x-y`映射。只保留窗口内部边，丢出的边逐格列在sourceMapping.excludedBoundaryEdges，不能走出窗口或瞬移到另一窗口。中心设施格仍是facilityPresent，v3禁止移动经过或在其部署，不把切图当入城功能。

已有生成器每格flagsU32=0且occupied=false。输出sourceMapping完整记录这些来源标志；v3 map不接受静态火/占位字段，因此本适配对任何未来非零flags或occupied=true直接拒绝，不静默丢失、不伪造fire实体。真正动态占位与火由v3同一roster/fires推导。

输出`fieldCells`与`movementMap`可直接作为createInferredMobileResourceWorld对应参数。调用方仍必须明确提供同一city/资源初值、fieldTemplates（entryCellId必须在合法非设施格）、movementProfiles与旅行场景；slice不创建兵、人物、AP或全局时钟，不凭地图生成器的演示marker冒充世界单位。不得将切片后重新创建一个world当成已有角色的跨片迁移。

本适配把既有练习图数据真正馈入typed Move输入，弥补手工重写小图的接口缺口；**原生地图仍未核实、全200×200联动与跨片状态迁移仍未实现**。只称最多16格诱导子图可加载；地形和邻接仍是明确设计推断，不是原作复原。

仅静态编写/核查，未调用生成器、movement核、世界、测试、typecheck或build。最终候选须与v3 Move同批独立审阅。
