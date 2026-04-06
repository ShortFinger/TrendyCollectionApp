# 首页与分类页搜索条对齐（TrendyCollectionApp）— 设计说明

**日期：** 2026-04-07  
**状态：** 已定稿，待实现计划与用户审阅规格  
**范围：** `TrendyCollectionApp` 中 `pages/index/index` 与 `pages/category/index` 的顶栏搜索条：**视觉规范与相对屏幕的竖直位置**与现有 `CategorySearchBar` 一致；抽通用组件与通用顶栏外壳。

---

## 1. 目标与成功标准

- **目标：** 首页搜索条与分类页搜索条使用**同一搜索组件**（样式为当前 `CategorySearchBar` 的规范）；两者顶栏均基于**同一套「状态栏占位 + 内边距」外壳**，使搜索条在状态栏下方的**水平内边距、竖直基准与条高度/圆角/背景色**一致。首页在搜索条右侧保留**铃铛**入口；分类页保持**全宽搜索条**。
- **成功标准：**
  - 首页 `pages.json` 中该页使用 **`navigationStyle: "custom"`**，与分类页一致地取消系统原生导航栏对顶栏占位的影响。
  - 新建通用 `SearchBar`（实现等效于现 `components/category/CategorySearchBar.vue` 的模板与样式）；`placeholder`（默认 `搜索生鲜商品…`）、`@click` 行为与现有一致或可扩展。
  - 新建通用 `PageSearchHeader`（名称以实现为准）：顶部 `statusBar` 占位高度来自 `uni.getSystemInfoSync().statusBarHeight`，缺失时回退 `0`；内层与分类页现 `cat-header-inner` 一致 **`padding: 8rpx 32rpx 16rpx`**；支持 prop 控制是否与分类页一致展示**底部分割线**（首页与分类页均保留分割线以维持现状视觉层级）。
  - 首页主内容区（`scroll-view`）高度在去除自定义顶栏与底部 `TabBar` 占位后正确，不出现大面积裁切或双滚动条；去掉对「系统导航 44px」的隐式假设并实现阶段用 **flex 布局优先**或明确公式校验。
  - 首页 CMS 驱动的 `searchPlaceholder` 仍通过 `:placeholder` 传入 `SearchBar`。

---

## 2. 非目标（YAGNI）

- 不实现搜索页跳转、搜索结果、防抖接口等搜索业务（除非现页已有逻辑，仅搬迁不扩展）。
- 不修改后端或 CMS 协议。
- 不统一改其它 Tab 页（「我的」等）的导航样式，除非后续单独需求。
- 不将 `TabBar` 改为 `pages.json` 原生 `tabBar`。

---

## 3. 架构与组件边界

### 3.1 新组件

| 路径（建议） | 职责 |
|--------------|------|
| `components/SearchBar.vue` | 通用搜索胶囊：结构与样式对齐现 `CategorySearchBar`（高度 **64rpx**、圆角 **32rpx**、背景 **`#f2f2f2`**、左放大镜 + 占位行）。 |
| `components/PageSearchHeader.vue` | 状态栏占位 + 内边距容器 + 可选分割线；**默认 slot** 放置各页顶栏内容（分类：单个 `SearchBar`；首页：`flex` 行内 `SearchBar` + 铃铛）。 |

### 3.2 现有组件迁移策略

- **`CategorySearchBar.vue`：** 改为薄封装：仅引用 `SearchBar` 并透传 `placeholder` / `click`，避免全仓库批量替换 import；若团队偏好删除文件，可在实现计划中改为「全局改为 `@/components/SearchBar`」并删除旧文件（本规格以**薄封装**为默认以降低改动面）。

### 3.3 页面职责

- **`pages/category/index.vue`：** 用 `PageSearchHeader` + slot 内全宽 `SearchBar` 替换手写 `cat-status-bar` / `cat-header` / `cat-header-inner` / `cat-header-divider` 中与顶栏相关的结构；`cat-main` 及以下不变。
- **`pages/index/index.vue`：** `pages.json` 启用 custom 顶栏；用 `PageSearchHeader`，slot 内一行：`SearchBar`（`flex: 1`）+ 现有铃铛；移除现 `.top-bar` / `.search-box` 中与顶栏重复的实现；**重算** `.scroll` 高度或改为外层 `flex: 1` + `min-height: 0` 的 `scroll-view`。

### 3.4 配置

- **`pages.json`**：`pages/index/index` 的 `style` 增加 **`navigationStyle": "custom"`**（与分类页一致）；`navigationBarTitleText` 可保留但不在界面上显示原生栏；若需微信端返回按钮行为，以实现阶段按 uni-app 文档处理（本规格不要求新增返回栈场景）。

---

## 4. 数据流

- 首页：`searchPlaceholder` ref 仍由 `processSearchBar` 更新，绑定 `SearchBar` 的 `placeholder`。
- 分类页：`SearchBar` 使用默认 placeholder 或页面传入（保持现分类页行为即可）。

---

## 5. 错误处理与兼容

- `statusBarHeight` 与分类页当前写法一致；异常或缺失时与现分类页行为一致（回退 `0`）。
- 在 **微信小程序** 与开发者工具中各验证一次顶栏与安全区（实现与测试阶段执行）。

---

## 6. 测试与验收

- 并排对比分类页与首页：搜索条左缘与右缘（首页为「搜索条右缘至铃铛」前）的**水平对齐**与分类页全宽条的左右 `32rpx` 内边距体系一致；搜索条**竖直位置**相对状态栏一致。
- 首页滚动列表、Banner、宫格、卡片区滚动与 TabBar 不重叠。
- 回归：分类页左侧栏与右侧内容滚动不受影响。

---

## 7. 规格自检（2026-04-07）

- **占位符：** 无 TBD/TODO。
- **一致性：** 分割线两页均保留，与「维持现状层级」一致；首页 custom 导航为对齐前提，已写明。
- **范围：** 单特性，限于 TrendyCollectionApp 顶栏与搜索组件抽取。
- **歧义：** 「通用」= `SearchBar` + `PageSearchHeader`；首页铃铛为 slot 内与 `SearchBar` 并列，不塞进 `SearchBar` 内部。
