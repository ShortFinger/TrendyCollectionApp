# App 空态加载门禁 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在首页与分类页区分「CMS/列表加载中」与「加载完成且为空」，避免误显「暂无活动」「暂无分类」；不改变 `mergeActivityCardItems` / `buildCategorySidebarItemsFromCmsSlot` 的业务过滤规则。

**Architecture:** 在 `pages/index/index.vue` 与 `pages/category/index.vue` 各增加与拉取生命周期绑定的 `loading` 状态；模板在 `loading === true` 时展示加载占位（复用分类页右侧已有「加载中…」样式或同类轻量占位），仅在 `loading === false` 且列表为空时展示「暂无*」。下拉刷新走同一套状态。

**Tech Stack:** Vue 3 (`<script setup>`), uni-app, 现有 SCSS 区块样式。

**Spec:** [`../specs/2026-04-11-app-empty-state-loading-gate-design.md`](../specs/2026-04-11-app-empty-state-loading-gate-design.md)

---

## File map

| 文件 | 职责 |
|------|------|
| `pages/index/index.vue` | 新增 `homeCmsLoading`（或同名），绑定 `loadHomeData` / `handleHomeRefresherRefresh`；卡片区模板三分支：加载中 / 有列表 / 真空。 |
| `pages/category/index.vue` | 新增 `categoryCmsLoading`，绑定 `loadCategoryCms`；左侧四分支：错误 / 加载中 / 空 / 列表；右侧在 `categoryCmsLoading` 或（可选）`activityListLoading` 且分类未就绪时显示加载，避免误显「暂无活动」。 |

---

### Task 1: 首页 · 活动卡片区加载门禁

**Files:**
- Modify: `pages/index/index.vue`（`<template>` 卡片区约 52–69 行；`loadHomeData` / `resetHomeSections` 附近）

- [x] **Step 1: 增加状态并在加载周期内维护**

在 `ref` 区域增加 `homeCmsLoading`，初值 `true`（避免首屏在 `onMounted` 前短暂闪空，若首屏由 `loadHomeData` 统一驱动，也可初值 `false` 并在 `loadHomeData` 第一行设为 `true`——二选一，须与「首帧不闪现暂无」一致）。

在 `loadHomeData` 内：
- 进入时设 `homeCmsLoading = true`（若已在函数开头 `resetHomeSections`，顺序为：先设 loading，再 reset，或 reset 后立即设 loading，避免中间帧 `cards` 空且无 loading）。
- 在 `try` 结束、`catch` 结束均进入 `finally` 设 `homeCmsLoading = false`。

- [x] **Step 2: 调整卡片区模板**

将当前「`v-if="cards.length"` / `v-else` 暂无」改为：

1. `v-if="homeCmsLoading"` → 展示与分类页 `cat-activity-hint` 一致的「加载中…」结构（可复制 class 或抽成共用 class，优先最小改动：复制一段 `view` + `text` + 复用 `.section-empty` 或 `.cat-activity-hint` 样式）。
2. `v-else-if="cards.length"` → 现有列表。
3. `v-else` → 「暂无活动」。

- [x] **Step 3: 手动验证**

开发者工具：Network 限速 **Slow 3G**，打开首页：在请求未完成前 **不得**出现「暂无活动」；完成后若业务上无卡片则仍可「暂无活动」。

- [x] **Step 4: Commit**（与 Task 2–3 合并为一次提交 `fix(app): gate empty states until CMS loads (home + category)`）

```bash
git add pages/index/index.vue
git commit -m "fix(home): gate activity empty state until CMS load completes"
```

---

### Task 2: 分类页 · 左侧分类槽位加载门禁

**Files:**
- Modify: `pages/category/index.vue`（左侧 `cat-col-left` 约 13–26 行；`loadCategoryCms`）

- [x] **Step 1: 增加 `categoryCmsLoading`**

- 初值建议 `true`（`onShow` 会立即拉 CMS，避免首帧「暂无分类」），或在 `loadCategoryCms` 开头置 `true`、`finally` 置 `false`。

- [x] **Step 2: 左侧模板顺序**

`v-if="categoryLoadError"` → 不变。  
`v-else-if="categoryCmsLoading"` → 新建占位（与右侧「加载中…」风格一致）。  
`v-else-if="!categoryList.length"` → 「暂无分类」。  
`v-else` → `CategorySidebar`。

- [x] **Step 3: 手动验证**

限速下切换到底部「分类」tab：加载完成前左侧 **不得**出现「暂无分类」。

- [x] **Step 4: Commit**（与 Task 2–3 合并为一次提交 `fix(app): gate empty states until CMS loads (home + category)`）

```bash
git add pages/category/index.vue
git commit -m "fix(category): gate category sidebar empty state until CMS load completes"
```

---

### Task 3: 分类页 · 右侧活动区与左侧就绪顺序

**Files:**
- Modify: `pages/category/index.vue`（`cat-sort-row` + 下方 `cat-activity-hint` / `card-list` 区域）

- [x] **Step 1: 明确条件**

当 `categoryCmsLoading === true` 时，用户尚未得到可靠分类列表；此时 `activeCategory` 可能为空，`loadActivityFirstPage` 会清空 `activityCards`。右侧不应展示「暂无活动」作为终态。

实现方式（二选一，选更简单者）：

- **A（推荐）**：在 `categoryCmsLoading` 为 `true` 时，右侧主内容区（可与现有 `activityListLoading` 分支合并）统一显示「加载中…」，并 **隐藏** 或 **禁用** 排序行（避免误操作）。`categoryCmsLoading` 为 `false` 后再走现有 `activityListLoading` / 错误 / 列表 / 暂无活动 逻辑。

- **B**：保留排序行，仅在卡片区域用 `v-if="categoryCmsLoading"` 显示加载占位。

- [x] **Step 2: 手动验证**

限速：进入分类 tab，在分类 CMS 未完成前，右侧 **不得**出现「暂无活动」；CMS 完成后按原逻辑加载活动。

- [x] **Step 3: Commit**（同上，与首页、左侧合并为单次提交）

---

### Task 4: 回归与收尾

- [x] 首页下拉刷新：`loadHomeData` 开头置 `homeCmsLoading`，`finally` 清除；`handleHomeRefresherRefresh` `await loadHomeData`，刷新路径已覆盖。

- [x] 分类页下拉刷新：`handleCategoryRefresherRefresh` 顺序为 `loadCategoryCms` → `loadActivityFirstPage`；`categoryCmsLoading` 在 `loadCategoryCms` 的 `finally` 中清除，避免右侧在 CMS 未完成时出现「暂无活动」终态。

- [x] 自动化测试：在仓库根目录执行 `npm test`（见根目录 `package.json` 的 `scripts.test`），`node --test tests/*.mjs` — 2026-04-11 运行 **10 tests pass**。

- [x] 收尾：实现已合并提交；本计划文档与 `package.json` 随收尾更新。

---

## 验收核对（摘自 spec）

- 慢网下加载完成前不将「暂无*」作为业务空态。
- 加载完成且过滤后仍无数据时，「暂无*」仍可出现。
- 错误 toast 与 `categoryLoadError` / `activitiesLoadError` 行为保持合理。

---

## 关联后续（非本计划范围）

- 开发环境若出现 `[cms-home] activity slot has items but cards is empty`，见 `utils/cmsHomeRenderDiagnostics.js` 中 `diagnoseActivityCardSkips` 统计；多为 `activityDisplay` / `ON_SHELF` 与后台水合一致性问题，见 [`2026-04-09-app-home-cms-client-render-gap-design.md`](../specs/2026-04-09-app-home-cms-client-render-gap-design.md)。
