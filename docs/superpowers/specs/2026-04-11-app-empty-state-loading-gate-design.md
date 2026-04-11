# App 端「暂无活动 / 暂无分类」误报与加载态门禁设计

**日期**: 2026-04-11  
**范围**: `TrendyCollectionApp` 首页 `pages/index/index.vue`、分类页 `pages/category/index.vue`；依赖 `utils/cmsSlotLoader.js`、`utils/mergeActivityCards.js`、`utils/categoryListFromCms.js`。不改变 CMS 单槽拉取主路径与业务过滤规则（与既有 spec 一致）。

## 1. 背景与现象

- 抓包可见 **HTTP 200** 且响应中 **存在** `activityDisplay` / `categoryDisplay` 等水合字段（用户确认）。
- 端上仍常出现 **「暂无活动」** 或 **「暂无分类」**，且 **无** 对应错误 toast。
- 现象 **偏偶发**：多刷或重进小程序后可能恢复正常。

## 2. 根因假设（与实现对齐）

### 2.1 空态闪现（与「偶发」最一致）

- **首页**：`loadHomeData` 起始调用 `resetHomeSections()`，将 `cards` 等清空；在 `fetchPublishedSlotsForPage` 与 `processSlots` **完成前**，`cards.length === 0`，模板走 `v-else` 显示「暂无活动」。无独立「卡片区加载中」时，网络慢或主线程忙会 **拉长空态停留时间**，易被感知为「经常暂无」。
- **分类页左侧**：`categoryList` 在 `loadCategoryCms` 完成前为空，`v-else-if="!categoryList.length"` 直接显示「暂无分类」，**无**「分类槽位加载中」状态。

### 2.2 其它（按需验证）

- **内存槽位缓存**（`cmsSlotLoader`）：若命中偏旧/偏空的缓存，可能出现界面空与 Charles 中「另一次请求的满数据」错频对照。
- **竞态**：分类页 `onShow`、列表 `watch` 与活动列表请求之间极端时序（次要）。

## 3. 目标

- **区分「加载中」与「加载完成且列表为空」**：仅在后者展示「暂无活动」「暂无分类」（及现有错误占位）。
- **不**将「请求进行中的空数组」展示为业务空态。
- 保持现有 toast 与 CMS 过滤逻辑不变；本规格 **不** 放宽 `mergeActivityCardItems` / `buildCategorySidebarItemsFromCmsSlot` 的业务条件。

## 4. 方案

### 4.1 加载态门禁（主交付）

| 页面区域 | 行为 |
|----------|------|
| 首页 · 活动卡片区 | 绑定与 `loadHomeData`（及下拉刷新）一致的 `loading`；`loading === true` 时展示 **骨架或统一「加载中」**，**不**展示「暂无活动」；`loading === false` 且 `cards.length === 0` 时再展示「暂无活动」。 |
| 分类页 · 左侧分类槽位 | 绑定与 `loadCategoryCms` 一致的 `loading`；加载中 **不**展示「暂无分类」；加载结束且列表仍为空时再展示「暂无分类」（`categoryLoadError` 优先级高于空态，保持现有顺序）。 |
| 分类页 · 右侧活动列表 | 已有 `activityListLoading` / `activitiesLoadError`；本规格仅要求与左侧 **语义一致**：不在「左侧分类尚未就绪」时把右侧空列表误呈现为最终态（若当前实现已满足则最小改动）。 |

### 4.2 缓存与可观测性（非本规格必做）

- **缓存策略收紧**（不缓存空 slot、缩短 TTL、`onShow` 可选跳过缓存等）：若门禁上线后仍报告「长时间暂无」，再单独立项与后端一起评估。
- **诊断日志**：延续 `logCmsHomeRenderDiagnostics` 思路，开发/测试包可对「输入 items > 0 且 merge 输出 0」等打结构化日志（脱敏），与 [`2026-04-09-app-home-cms-client-render-gap-design.md`](./2026-04-09-app-home-cms-client-render-gap-design.md) 的排查方向一致。

## 5. 数据流（约定）

1. 进入加载：`loading = true`（或等价拆分首页/分类两段状态，但须覆盖刷新路径）。
2. 请求完成（成功或失败）：`loading = false`。
3. 渲染：先根据 `loading` 决定占位；`loading === false` 后再根据列表长度与错误 ref 决定列表 / 「暂无*」/ 错误文案。

下拉刷新期间应沿用同一套规则，避免 **先清空再长时间显示「暂无」**。

## 6. 验收标准

- 限速网络或模拟慢请求下，首页卡片区与分类侧栏在请求未完成时 **不出现**「暂无活动」「暂无分类」作为最终反馈（可出现加载占位）。
- 请求完成且业务过滤后列表仍为空时，仍显示「暂无*」，行为与产品对「真空」的定义一致。
- 现有错误 toast 与 `categoryLoadError` / `activitiesLoadError` 行为保持可用；加载中 **不** 误报为加载失败。

## 7. 非目标

- 不修改 `mergeActivityCardItems`、`buildCategorySidebarItemsFromCmsSlot` 的过滤条件（除非另起契约修订 spec）。
- 不将本规格作为「接口一定有水合字段」的替代；数据契约问题仍见 `2026-04-09-app-home-cms-client-render-gap-design.md`。

## 8. 关联文档

- [`2026-04-09-app-home-cms-client-render-gap-design.md`](./2026-04-09-app-home-cms-client-render-gap-design.md)
- [`2026-04-09-trendycollectionapp-per-slot-cms-fetch-design.md`](./2026-04-09-trendycollectionapp-per-slot-cms-fetch-design.md)
