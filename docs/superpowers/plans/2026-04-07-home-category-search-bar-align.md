# 首页与分类页搜索条对齐 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 抽离通用 `SearchBar` 与 `PageSearchHeader`，使首页与分类页搜索胶囊样式一致，且顶栏相对状态栏位置一致；首页改为 `custom` 导航并在搜索条右侧保留铃铛。

**Architecture:** `SearchBar` 承载原 `CategorySearchBar` 的全部 UI；`PageSearchHeader` 内置状态栏占位与 `8rpx 32rpx 16rpx` 内边距及可选分割线。分类页用该外壳 + `CategorySearchBar`（薄封装指向 `SearchBar`）；首页用同一外壳，slot 内 `flex` 排列 `SearchBar` 与铃铛。主内容区用列向 `flex` + `scroll-view` 的 `flex:1; min-height:0` 去掉对系统导航 `44px` 的硬编码。

**Tech Stack:** uni-app，Vue 3 `<script setup>`，SCSS；仓库根目录为 `TrendyCollectionApp`（若父仓库为 submodule，提交在本仓库内完成）。

**规格来源：** `docs/superpowers/specs/2026-04-07-home-category-search-bar-align-design.md`

---

## 文件结构（将创建 / 修改）

| 文件 | 职责 |
|------|------|
| `components/SearchBar.vue` | **新建**：通用搜索胶囊（64rpx 高、`#f2f2f2`、放大镜 + 占位）。 |
| `components/PageSearchHeader.vue` | **新建**：状态栏占位 + 内层 padding + 默认 slot + 可选分割线。 |
| `components/category/CategorySearchBar.vue` | **修改**：改为引用 `SearchBar` 并透传 `placeholder`、`click`。 |
| `pages/category/index.vue` | **修改**：移除手写 `cat-status-bar` / `cat-header*` / `cat-header-divider` 与 `statusBarPx`，改用 `PageSearchHeader` + 原 `CategorySearchBar`。 |
| `pages/index/index.vue` | **修改**：`custom` 顶栏布局；`PageSearchHeader` + 搜索行；列 flex + `scroll-view` 高度策略；删除 `.top-bar` / `.search-box` / `.search-placeholder` 样式。 |
| `pages.json` | **修改**：`pages/index/index` 增加 `navigationStyle: "custom"`（与分类页对齐）。 |

---

### Task 1: 新增 `SearchBar.vue`

**Files:**
- Create: `components/SearchBar.vue`

- [ ] **Step 1: 新建组件文件**

将现 `CategorySearchBar.vue` 的实现迁移为通用组件（样式类名可改为 `sb-` 前缀以避免与页面全局冲突；保持 scoped）。

```vue
<template>
  <view class="sb-root" @click="emit('click')">
    <view class="sb-bar">
      <text class="sb-icon">🔍</text>
      <text class="sb-placeholder">{{ placeholder }}</text>
    </view>
  </view>
</template>

<script setup>
defineProps({
  placeholder: {
    type: String,
    default: '搜索生鲜商品…'
  }
})

const emit = defineEmits(['click'])
</script>

<style lang="scss" scoped>
.sb-root {
  width: 100%;
}

.sb-bar {
  height: 64rpx;
  border-radius: 32rpx;
  background-color: #f2f2f2;
  padding: 0 24rpx;
  display: flex;
  flex-direction: row;
  align-items: center;
  box-sizing: border-box;
}

.sb-icon {
  font-size: 28rpx;
  margin-right: 12rpx;
  opacity: 0.55;
}

.sb-placeholder {
  flex: 1;
  font-size: 26rpx;
  color: #999999;
}
</style>
```

- [ ] **Step 2: 提交**

```bash
git add components/SearchBar.vue
git commit -m "feat(app): add shared SearchBar component"
```

---

### Task 2: 新增 `PageSearchHeader.vue`

**Files:**
- Create: `components/PageSearchHeader.vue`

- [ ] **Step 1: 新建顶栏外壳**

与分类页现结构等价：`statusBar` 块高度 `uni.getSystemInfoSync().statusBarHeight || 0`（单位 px）；内层 `padding: 8rpx 32rpx 16rpx`；`showDivider` 为 `true` 时显示与 `cat-header-divider` 相同的 1rpx 线（`margin: 0 32rpx`，色 `#e8e8e8`）。默认 slot 放页面顶栏内容。背景 `#f7f8fa`。

```vue
<template>
  <view class="psh-root">
    <view class="psh-status-bar" :style="{ height: statusBarPx + 'px' }" />
    <view class="psh-header">
      <view class="psh-inner">
        <slot />
      </view>
      <view v-if="showDivider" class="psh-divider" />
    </view>
  </view>
</template>

<script setup>
defineProps({
  showDivider: {
    type: Boolean,
    default: true
  }
})

const statusBarPx = uni.getSystemInfoSync().statusBarHeight || 0
</script>

<style lang="scss" scoped>
.psh-root {
  flex-shrink: 0;
}

.psh-status-bar {
  width: 100%;
  flex-shrink: 0;
}

.psh-header {
  flex-shrink: 0;
  background-color: #f7f8fa;
}

.psh-inner {
  padding: 8rpx 32rpx 16rpx;
  box-sizing: border-box;
}

.psh-divider {
  height: 1rpx;
  background-color: #e8e8e8;
  margin: 0 32rpx;
}
</style>
```

- [ ] **Step 2: 提交**

```bash
git add components/PageSearchHeader.vue
git commit -m "feat(app): add PageSearchHeader for status bar and search chrome"
```

---

### Task 3: `CategorySearchBar` 薄封装

**Files:**
- Modify: `components/category/CategorySearchBar.vue`

- [ ] **Step 1: 替换为转发组件**

完整文件内容：

```vue
<template>
  <SearchBar :placeholder="placeholder" @click="emit('click')" />
</template>

<script setup>
import SearchBar from '@/components/SearchBar.vue'

defineProps({
  placeholder: {
    type: String,
    default: '搜索生鲜商品…'
  }
})

const emit = defineEmits(['click'])
</script>
```

（不再包含 scoped 样式，避免重复。）

- [ ] **Step 2: 提交**

```bash
git add components/category/CategorySearchBar.vue
git commit -m "refactor(category): delegate CategorySearchBar to shared SearchBar"
```

---

### Task 4: 分类页接入 `PageSearchHeader`

**Files:**
- Modify: `pages/category/index.vue`

- [ ] **Step 1: 更新 template**

将

```vue
    <view class="cat-status-bar" :style="{ height: statusBarPx + 'px' }" />

    <view class="cat-header">
      <view class="cat-header-inner">
        <CategorySearchBar />
      </view>
      <view class="cat-header-divider" />
    </view>
```

替换为：

```vue
    <PageSearchHeader>
      <CategorySearchBar />
    </PageSearchHeader>
```

- [ ] **Step 2: 更新 script**

在 import 区增加：

```js
import PageSearchHeader from '@/components/PageSearchHeader.vue'
```

删除 `const statusBarPx = uni.getSystemInfoSync().statusBarHeight || 0`（整行）。

- [ ] **Step 3: 更新 style**

删除 `.cat-status-bar`、`.cat-header`、`.cat-header-inner`、`.cat-header-divider` 四个规则块（顶栏样式由 `PageSearchHeader` 负责）。

- [ ] **Step 4: 验证**

在微信小程序模拟器或实际包中打开分类页：顶栏位置、分割线、左侧栏与右侧滚动与改动前一致。

- [ ] **Step 5: 提交**

```bash
git add pages/category/index.vue
git commit -m "refactor(category): use PageSearchHeader for top chrome"
```

---

### Task 5: `pages.json` 首页 custom 导航

**Files:**
- Modify: `pages.json`

- [ ] **Step 1: 修改首页 style**

将首页项改为（保留原有 title 字段无妨）：

```json
    {
      "path": "pages/index/index",
      "style": {
        "navigationStyle": "custom",
        "navigationBarTitleText": "首页"
      }
    },
```

- [ ] **Step 2: 提交**

```bash
git add pages.json
git commit -m "feat(app): use custom navigation bar on home page"
```

---

### Task 6: 首页布局与搜索行

**Files:**
- Modify: `pages/index/index.vue`

- [ ] **Step 1: 替换 template 顶部结构**

将「顶部搜索行」整段：

```vue
      <view class="top-bar">
        <view class="search-box">
          <text class="search-placeholder">{{ searchPlaceholder }}</text>
        </view>

        <view class="bell-icon">🔔</view>
      </view>

      <scroll-view class="scroll" scroll-y>
```

替换为：

```vue
      <PageSearchHeader>
        <view class="home-top-row">
          <view class="home-search-wrap">
            <SearchBar :placeholder="searchPlaceholder" />
          </view>
          <view class="home-bell">🔔</view>
        </view>
      </PageSearchHeader>

      <scroll-view class="scroll" scroll-y>
```

- [ ] **Step 2: 更新 script import**

在现有 import 下增加：

```js
import PageSearchHeader from '@/components/PageSearchHeader.vue'
import SearchBar from '@/components/SearchBar.vue'
```

- [ ] **Step 3: 更新 style**

对 `.home-page` 调整为与分类页一致的列 flex，并与固定 TabBar 预留底部空间（`TabBar.vue` 为 `height: 100rpx` + `padding-bottom: env(safe-area-inset-bottom)`，与分类页统一）：

```scss
    .home-page {
      background-color: #f7f8fa;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      box-sizing: border-box;
      padding-bottom: calc(100rpx + env(safe-area-inset-bottom));
    }

    .home-top-row {
      display: flex;
      flex-direction: row;
      align-items: center;
    }

    .home-search-wrap {
      flex: 1;
      min-width: 0;
    }

    .home-bell {
      width: 52rpx;
      margin-left: 16rpx;
      text-align: right;
      flex-shrink: 0;
    }

    .scroll {
      flex: 1;
      min-height: 0;
      margin-top: 24rpx;
      padding: 0 24rpx 24rpx;
      box-sizing: border-box;
    }
```

删除整段 `.top-bar`、`.search-box`、`.search-placeholder`、原 `.bell-icon` 规则。

删除 `.scroll` 中原有的 `height: calc(100vh - 44px - 120rpx);`。

- [ ] **Step 4: 验证**

1. 首页：顶栏无系统「首页」原生条；搜索条与分类页视觉一致；铃铛在搜索条右侧；向下滚动 Banner/宫格/卡片不被 TabBar 遮挡。  
2. 分类页：再快速回归一次。  
3. 若需命令行构建，使用你本地 uni-app 工程惯例（HBuilderX 或 CLI）；无 CLI 时以 IDE 运行小程序为准。

- [ ] **Step 5: 提交**

```bash
git add pages/index/index.vue
git commit -m "feat(home): align search header with category using shared components"
```

---

## Plan self-review（对照规格）

| 规格要求 | 对应任务 |
|----------|----------|
| 通用 `SearchBar` 等效原 `CategorySearchBar` | Task 1 |
| `PageSearchHeader` 状态栏、padding、分割线 | Task 2 |
| `CategorySearchBar` 薄封装 | Task 3 |
| 分类页用外壳 + 全宽搜索 | Task 4 |
| 首页 `custom` + 搜索 + 铃铛 + flex 滚动 | Task 5、6 |
| 首页 placeholder 仍来自 CMS | Task 6（`:placeholder="searchPlaceholder"`） |

未发现 TBD/空实现步骤。

---

**Plan complete and saved to `TrendyCollectionApp/docs/superpowers/plans/2026-04-07-home-category-search-bar-align.md`. Two execution options:**

1. **Subagent-Driven (recommended)** — 每个 Task 单独开 subagent，任务间 review，迭代快  
2. **Inline Execution** — 本会话内按 `executing-plans` 批量执行并设检查点  

你希望用哪一种？
