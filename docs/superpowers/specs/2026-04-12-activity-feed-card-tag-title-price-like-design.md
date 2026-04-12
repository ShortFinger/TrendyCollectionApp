# ActivityFeedCard：tag 与标题同行、价格与点赞同行 — 设计说明

**日期:** 2026-04-12  
**状态:** 已定稿（布局：Flex 标题行 + Flex 价格行）

## 背景与目标

`ActivityFeedCard` 当前结构为：封面 → 标题 → 价格行（仅价格）→ 描述 → 页脚（tag + 点赞）。产品期望：

1. **tag 在标题前**，且与标题 **同一行**（tag 在左为胶囊，标题在右可多行省略）。
2. **价格与点赞同一行**（价左、赞右，横向分布）。

数据与点击行为不变：`item` 形状不变，仍 `emit('cardTap', item)`。

## 范围

- **包含:** `TrendyCollectionApp/components/ActivityFeedCard.vue` 的模板顺序与样式；`formatLikes` 逻辑可复用，不新增字段。
- **不包含:** CMS、合并卡片、父页面列表结构；其它使用 `ActivityFeedCard` 的页面除非验收发现布局耦合，否则不改动。

## 纵向信息顺序（自上而下）

1. 封面（`.card-cover` / `.card-image` 与角标，行为不变）。
2. **标题行**（新建容器，如 `.card-title-row`）：可选 tag + 标题；无 tag 时标题占满该行可用宽度。
3. **价格行**（`.card-price-row` 扩展）：左侧可选 `priceText`，右侧点赞数（沿用 `formatLikes`）。
4. **描述区**（`.card-content`）：仅描述；保留「无描述时收紧上 padding」的行为（等价于现有 `card-content--no-desc`）。

原 `.card-footer` / `.card-meta` 中 tag、点赞迁出；页脚若因此无内容则移除，避免空节点。

## 方案（已选定）

采用 **做法 1：Flex 行布局**。

### 标题行

- 容器：`display: flex`、`align-items: flex-start`，`box-sizing: border-box`，与现标题区左右 padding 对齐（与原先 `.card-title` 的 `20rpx` 水平 padding 一致或显式迁移到行容器）。
- **Tag**（`v-if="item.tag"`）：`flex-shrink: 0`；保留胶囊背景、圆角、单行省略与合理 `max-width`（可与现 `.card-tag` 的 `140rpx` 一致）。
- **标题**：外层包一层 `min-width: 0` 的容器或直接作用于文本节点，设置 `flex: 1`、`min-width: 0`，保留 **两行** `-webkit-line-clamp` 与 `word-break`，避免 flex 子项溢出撑破省略。
- **间距**：tag 与标题之间 `gap` 约 `8rpx`～`12rpx`（与原先 meta 区 `gap` 量级一致即可）。

### 价格行

- 容器：`display: flex`、`justify-content: space-between`、`align-items: center`（或 `flex-start`，以与价格字号基线对齐为准）；保留合理 `min-height`，使「仅有赞无价格」时行高仍稳定。
- 左侧：`v-if="item.priceText"` 显示价格样式（沿用 `.card-price`）。
- 右侧：点赞文案；无价格时点赞仍 **靠右**。

### 无 tag / 无价格

- 无 tag：不渲染 tag 节点，标题 flex 占满。
- 无价格：左侧为空，右侧仍显示点赞（若业务上点赞恒存在；若为 0 仍显示 `formatLikes` 结果，与现有一致）。

## 风险与兼容性

- 小程序中 **flex 子项多行省略** 需在真机确认；若异常，再评估为标题外包一层 `view` 并固定 flex 子项宽度策略（不预先纳入实现，仅作回退备忘）。

## 验收标准

- 有 tag：tag 在左、标题在右，标题两行截断正常，tag 过长单行省略。
- 无 tag：标题区表现与「整行标题」一致，无多余空白列。
- 价格行：价左赞右；仅有赞时赞靠右；有价有赞时两端对齐。
- 有/无描述时，描述区与无描述 padding 行为与改动前意图一致。
- 卡片整卡可点击、`cardTap` 行为不变。

## 测试建议

- 开发者工具或真机：组合覆盖「长标题 + tag」「无 tag」「仅有价格」「仅有赞」「价+赞」「有描述 / 无描述」。
