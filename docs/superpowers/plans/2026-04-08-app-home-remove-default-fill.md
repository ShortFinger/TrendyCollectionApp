# APP 首页移除默认填充 Implementation Plan

> **For agentic workers:** Steps below can be tracked with checkboxes during implementation.

**Goal:** 首页在无 CMS 数据或失败时不展示演示文案，各区块保留容器并显示约定空状态文案。

**Architecture:** 在 `pages/index/index.vue` 内以空 `ref` 初值、`resetHomeSections()`、`computed` 的 `bannerHasContent`、模板 `v-if`/`v-else` 分支与少量 SCSS 完成；CMS 请求与 slot 解析流程不变。

**Tech stack:** uni-app / Vue 3 (`script setup`)

**Spec:** `docs/superpowers/specs/2026-04-08-app-home-remove-default-fill-design.md`

---

### Task 1: 数据重置与 Banner 归一化

**Files:**
- Modify: `pages/index/index.vue`

- [x] 将 `searchPlaceholder` / `bannerData` / `iconList` / `cards` 初值改为空（搜索占位为 `搜索`）。
- [x] 新增 `emptyBanner()` 与 `resetHomeSections()`；`loadHomeData` 在 `fetchHomePage` 之前调用 reset。
- [x] `processBanner` 改为基于 `emptyBanner()` 与 payload 的完整赋值，避免字段残留。
- [x] `processActivityCards` 去掉「暂无可展示活动」toast。

### Task 2: 模板与样式

**Files:**
- Modify: `pages/index/index.vue`

- [x] `computed`：`bannerHasContent`（非空 `title` 或有效 `jumpType`+`jumpUrl`）。
- [x] Banner：有内容沿用原布局与点击；无内容渲染灰色占位条「暂未配置 Banner」且不绑跳转。
- [x] 宫格：有 `iconList` 时 `v-for`；否则白卡片内「暂无入口」。
- [x] 活动区：有 `cards` 时列表；否则「暂无活动」占位（与 spec 一致，不再 toast 空列表）。

### Task 3: 验证

- [x] 手动：冷启首页无闪演示数据；CMS 全量/缺 slot/活动空/接口失败等行为符合 spec。

---

## 参考测试场景

1. 清除缓存后打开首页 → 仅搜索默认「搜索」+ 各区块空态。  
2. CMS 正常返回 → 各区块按数据展示。  
3. 仅有活动 slot 无 id → 「暂无活动」，无 toast。  
4. `/v1/pages/home/page` 失败 → toast + 空态。
