# ActivityFeedCard 缩略图 1:1 随宽变化 — 设计说明

**日期:** 2026-04-12  
**状态:** 已定稿（实现手段：CSS `aspect-ratio`）

## 背景与目标

活动卡片缩略图（`.card-image`）当前为固定高度 `280rpx`，宽度随列宽变化，因此在不同屏宽下视觉比例不固定。产品期望缩略图区域为 **正方形（宽:高 = 1:1）**，使 **高度随卡片内容区宽度**（进而随 `.card-list-cell` 列宽）成比例变化。

## 范围

- **包含:** `TrendyCollectionApp/components/ActivityFeedCard.vue` 内封面区域样式；保持现有 `squareThumb` 背景图、`background-size: cover` 与角标叠层行为。
- **不包含:** CMS 字段、接口、合并逻辑；父级列表布局（`.card-list` / `.card-list-cell`）除非发现与 1:1 冲突，否则不改动。

## 方案（已选定）

采用 **方案 1：纯 CSS `aspect-ratio: 1 / 1`**。

- `.card-image`：`width: 100%`；设置 `aspect-ratio: 1 / 1`；**移除**固定 `height: 280rpx`（若引擎需要，可显式 `height: auto` 或不声明高度）。
- 保留 `background-size: cover`、`background-position: center`，避免非方图源图变形，仅裁切边缘。
- `.card-cover` 保持 `position: relative`、全宽，角标容器（`.card-corner-marks`）仍铺满封面，随正方形区域伸缩。

## 兼容性说明

微信小程序 WXSS 对 `aspect-ratio` 的支持依赖基础库版本。若目标最低版本在真机验证中不支持该属性，再单独评估 **padding-bottom 占位方案**（不纳入本次实现范围，除非验收失败）。

## 验收标准

- 双列布局下，不同屏宽时缩略图区域均为正方形，列对齐无异常。
- 有图 / 无图占位均为方形灰底区域。
- 角标位置与可读性与改动前一致（相对封面四角）。

## 测试建议

- 开发者工具与真机各至少一种宽度下目视检查。
- 可选：对 `ActivityFeedCard` 截图对比（非自动化强制）。
