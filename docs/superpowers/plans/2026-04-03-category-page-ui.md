# Category Page UI (组件拆分) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Align `TrendyCollectionApp` 分类页 UI with the approved mock by splitting presentational pieces into `components/category/*`, registering the route with custom navigation chrome, and keeping TabBar label 「赏柜」while matching visual style.

**Architecture:** Four leaf components (`CategorySearchBar`, `CategorySidebar`, `CategoryHotSearch`, `CategoryProductGrid`) receive mock data via props and emit selection updates from the sidebar. The page owns mock arrays and layout (status bar + search + flex main + fixed `TabBar`). No backend calls in this plan.

**Tech Stack:** uni-app, Vue 3 `<script setup>`, SCSS, `rpx`, `scroll-view`.

**Spec:** `docs/superpowers/specs/2026-04-03-category-page-ui-design.md`

---

## File map

| Path | Action |
|------|--------|
| `components/category/CategorySearchBar.vue` | Create |
| `components/category/CategorySidebar.vue` | Create |
| `components/category/CategoryHotSearch.vue` | Create |
| `components/category/CategoryProductGrid.vue` | Create |
| `pages/category/index.vue` | Replace with composition + layout |
| `pages.json` | Add `pages/category/index` + `navigationStyle: custom` |
| `components/TabBar.vue` | Tweak icons (统一风格) + confirm 赏柜 / colors |

---

### Task 1: `CategorySearchBar.vue`

**Files:**
- Create: `components/category/CategorySearchBar.vue`

- [ ] **Step 1: Add component file (full content below)**

```vue
<template>
  <view class="csb-root" @click="emit('click')">
    <view class="csb-bar">
      <text class="csb-icon" aria-hidden="true">🔍</text>
      <text class="csb-placeholder">{{ placeholder }}</text>
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
.csb-root {
  width: 100%;
}

.csb-bar {
  height: 64rpx;
  border-radius: 32rpx;
  background-color: #f2f2f2;
  padding: 0 24rpx;
  display: flex;
  flex-direction: row;
  align-items: center;
  box-sizing: border-box;
}

.csb-icon {
  font-size: 28rpx;
  margin-right: 12rpx;
  opacity: 0.55;
}

.csb-placeholder {
  flex: 1;
  font-size: 26rpx;
  color: #999999;
}
</style>
```

- [ ] **Step 2: Verify**

Open any临时页面 import 该组件：应看到灰底胶囊、左侧放大镜、占位文案。

- [ ] **Step 3: Commit**

```bash
git add components/category/CategorySearchBar.vue
git commit -m "feat(category): add CategorySearchBar component"
```

---

### Task 2: `CategorySidebar.vue`

**Files:**
- Create: `components/category/CategorySidebar.vue`

- [ ] **Step 1: Add component file**

```vue
<template>
  <scroll-view class="cs-side" scroll-y :show-scrollbar="false">
    <view
      v-for="item in items"
      :key="item.key"
      class="cs-item"
      :class="{ 'cs-item-active': item.key === activeKey }"
      @click="onSelect(item.key)"
    >
      <text class="cs-text">{{ item.label }}</text>
    </view>
  </scroll-view>
</template>

<script setup>
const props = defineProps({
  items: {
    type: Array,
    required: true
  },
  activeKey: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['update:activeKey'])

function onSelect(key) {
  if (key !== props.activeKey) {
    emit('update:activeKey', key)
  }
}
</script>

<style lang="scss" scoped>
.cs-side {
  width: 100%;
  height: 100%;
  background-color: #f7f8fa;
  box-sizing: border-box;
}

.cs-item {
  min-height: 96rpx;
  padding: 0 16rpx 0 20rpx;
  display: flex;
  align-items: center;
  box-sizing: border-box;
  border-left: 6rpx solid transparent;
}

.cs-item-active {
  background-color: #ffffff;
  border-left-color: #02b282;
}

.cs-text {
  font-size: 24rpx;
  color: #555555;
  line-height: 1.35;
}

.cs-item-active .cs-text {
  color: #02b282;
  font-weight: 600;
}
</style>
```

- [ ] **Step 2: Verify**

传入 3 个 mock `items` 与 `activeKey`：激活项左绿条 + 绿字；点击非激活项应触发 `update:activeKey`。

- [ ] **Step 3: Commit**

```bash
git add components/category/CategorySidebar.vue
git commit -m "feat(category): add CategorySidebar component"
```

---

### Task 3: `CategoryHotSearch.vue`

**Files:**
- Create: `components/category/CategoryHotSearch.vue`

- [ ] **Step 1: Add component file**

```vue
<template>
  <view class="chs-root">
    <view class="chs-title-row">
      <text class="chs-title">热门搜索</text>
    </view>
    <view class="chs-tags">
      <view
        v-for="(tag, i) in tags"
        :key="i"
        class="chs-tag"
        @click="emit('tagClick', tag)"
      >
        <text class="chs-tag-text">{{ tag }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
defineProps({
  tags: {
    type: Array,
    required: true
  }
})

const emit = defineEmits(['tagClick'])
</script>

<style lang="scss" scoped>
.chs-root {
  margin-bottom: 32rpx;
}

.chs-title-row {
  margin-bottom: 16rpx;
}

.chs-title {
  font-size: 28rpx;
  color: #111111;
  font-weight: 600;
}

.chs-tags {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 16rpx;
}

.chs-tag {
  padding: 10rpx 22rpx;
  border-radius: 32rpx;
  background-color: #f5f5f5;
}

.chs-tag-text {
  font-size: 22rpx;
  color: #666666;
}
</style>
```

- [ ] **Step 2: Verify**

三个标签应换行排列（窄屏下），背景浅灰圆角。

- [ ] **Step 3: Commit**

```bash
git add components/category/CategoryHotSearch.vue
git commit -m "feat(category): add CategoryHotSearch component"
```

---

### Task 4: `CategoryProductGrid.vue`

**Files:**
- Create: `components/category/CategoryProductGrid.vue`

- [ ] **Step 1: Add component file**

```vue
<template>
  <view class="cpg-root">
    <view class="cpg-title-row">
      <text class="cpg-title">热销单品</text>
    </view>
    <view class="cpg-grid">
      <view
        v-for="p in products"
        :key="p.id"
        class="cpg-card"
        @click="emit('itemClick', p)"
      >
        <view class="cpg-img-wrap">
          <image
            v-if="p.imageUrl"
            class="cpg-img"
            :src="p.imageUrl"
            mode="aspectFill"
          />
        </view>
        <view class="cpg-info">
          <text class="cpg-name">{{ p.title }}</text>
          <text class="cpg-price">¥{{ p.price }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
defineProps({
  products: {
    type: Array,
    required: true
  }
})

const emit = defineEmits(['itemClick'])
</script>

<style lang="scss" scoped>
.cpg-root {
  margin-top: 8rpx;
}

.cpg-title-row {
  margin-bottom: 16rpx;
}

.cpg-title {
  font-size: 28rpx;
  color: #111111;
  font-weight: 600;
}

.cpg-grid {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: space-between;
}

.cpg-card {
  width: 48%;
  margin-bottom: 24rpx;
  border-radius: 16rpx;
  background-color: #f7f8fa;
  overflow: hidden;
}

.cpg-img-wrap {
  width: 100%;
  height: 180rpx;
  background-color: #e8eaee;
  border-radius: 12rpx 12rpx 0 0;
}

.cpg-img {
  width: 100%;
  height: 100%;
  display: block;
}

.cpg-info {
  padding: 16rpx 16rpx 20rpx;
}

.cpg-name {
  font-size: 24rpx;
  color: #333333;
  line-height: 1.4;
  /* 多行省略（小程序/H5 兼容：两行） */
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}

.cpg-price {
  margin-top: 12rpx;
  font-size: 28rpx;
  color: #ff4d4f;
  font-weight: 700;
}
</style>
```

- [ ] **Step 2: Verify**

两列卡片；无 `imageUrl` 时为浅灰图区；标题 + 红色粗价。

- [ ] **Step 3: Commit**

```bash
git add components/category/CategoryProductGrid.vue
git commit -m "feat(category): add CategoryProductGrid component"
```

---

### Task 5: Register page + custom navigation in `pages.json`

**Files:**
- Modify: `pages.json`

- [ ] **Step 1: Insert page entry** (merge into existing `pages` array; order can be after `pages/index/index`)

```json
{
  "path": "pages/category/index",
  "style": {
    "navigationStyle": "custom",
    "navigationBarTitleText": "分类"
  }
}
```

说明：`navigationBarTitleText` 在 custom 下通常不显示，保留便于调试工具/某些端展示；顶栏完全由页面内 `CategorySearchBar` + 状态条承担。

- [ ] **Step 2: Verify**

运行项目后 `uni.navigateTo({ url: '/pages/category/index' })` 或从 TabBar 进入：**不应**再出现系统默认标题栏占位（若某端仍显示，查该平台 custom 支持说明）。

- [ ] **Step 3: Commit**

```bash
git add pages.json
git commit -m "feat(category): register category page with custom navigation"
```

---

### Task 6: Compose `pages/category/index.vue`

**Files:**
- Modify: `pages/category/index.vue` (replace entire file)

- [ ] **Step 1: Replace page with the following full file**

```vue
<template>
  <view class="cat-page">
    <view class="cat-status-bar" :style="{ height: statusBarPx + 'px' }" />

    <view class="cat-header">
      <view class="cat-header-inner">
        <CategorySearchBar />
      </view>
      <view class="cat-header-divider" />
    </view>

    <view class="cat-main">
      <view class="cat-col-left">
        <CategorySidebar
          :items="categoryList"
          :active-key="activeCategory"
          @update:active-key="activeCategory = $event"
        />
      </view>

      <scroll-view class="cat-col-right" scroll-y :show-scrollbar="false">
        <CategoryHotSearch :tags="hotTags" />
        <CategoryProductGrid :products="hotProducts" />
        <view class="cat-bottom-safe" />
      </scroll-view>
    </view>

    <TabBar active="category" />
  </view>
</template>

<script setup>
import { ref } from 'vue'
import CategorySearchBar from '@/components/category/CategorySearchBar.vue'
import CategorySidebar from '@/components/category/CategorySidebar.vue'
import CategoryHotSearch from '@/components/category/CategoryHotSearch.vue'
import CategoryProductGrid from '@/components/category/CategoryProductGrid.vue'
import TabBar from '@/components/TabBar.vue'

const statusBarPx = uni.getSystemInfoSync().statusBarHeight || 0

const categoryList = [
  { key: 'today', label: '今日推荐' },
  { key: 'fruit', label: '时令水果' },
  { key: 'vegetable', label: '新鲜蔬菜' },
  { key: 'seafood', label: '海鲜水产' },
  { key: 'meat', label: '肉禽蛋类' },
  { key: 'milk', label: '乳品烘焙' },
  { key: 'drink', label: '酒水饮料' },
  { key: 'more', label: '更多分类' }
]

const hotTags = ['波士顿龙虾', '红颜草莓', '有机西红柿']

const hotProducts = [
  { id: 1, title: '泰国金枕头榴莲A级 2-3kg', price: '199.0' },
  { id: 2, title: '澳洲冷鲜西冷牛排 200g', price: '58.0' }
]

const activeCategory = ref('today')
</script>

<style lang="scss">
.cat-page {
  min-height: 100vh;
  background-color: #f7f8fa;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  padding-bottom: calc(100rpx + env(safe-area-inset-bottom));
}

.cat-status-bar {
  width: 100%;
  flex-shrink: 0;
}

.cat-header {
  flex-shrink: 0;
  background-color: #f7f8fa;
}

.cat-header-inner {
  padding: 8rpx 32rpx 16rpx;
  box-sizing: border-box;
}

.cat-header-divider {
  height: 1rpx;
  background-color: #e8e8e8;
  margin: 0 32rpx;
}

.cat-main {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: row;
  padding-left: 24rpx;
  box-sizing: border-box;
}

.cat-col-left {
  width: 25%;
  min-width: 0;
  height: 100%;
}

.cat-col-right {
  flex: 1;
  min-width: 0;
  height: 100%;
  background-color: #ffffff;
  border-top-left-radius: 24rpx;
  padding: 16rpx 24rpx 24rpx;
  box-sizing: border-box;
}

.cat-bottom-safe {
  height: 140rpx;
}
</style>
```

说明：侧栏使用 `CategorySidebar` 内部 `scroll-view`；右侧使用页面级 `scroll-view`。若更倾向 `v-model:activeKey`，可将 Step 1 中侧栏改为 `:active-key="activeCategory"` + `@update:active-key="activeCategory = $event"` 的简写 `v-model:activeKey="activeCategory"`（需与子组件 `defineEmits(['update:activeKey'])` 一致）。上面显式写法避免部分构建链对 `v-model` 修饰符解析差异。

- [ ] **Step 2: Manual verify (H5 或目标端)**

1. 顶栏：状态栏占位 + 搜索胶囊 `#F2F2F2` + 分隔线。  
2. 左栏宽约 25%，激活项绿条+绿字。  
3. 右侧白底、热门标签、`热销单品` 两列、价格 `#FF4D4F`。  
4. 底部 Tab「分类」为绿色；第三项仍为「赏柜」。

- [ ] **Step 3: Commit**

```bash
git add pages/category/index.vue
git commit -m "feat(category): compose category page with split components"
```

---

### Task 7: `TabBar.vue` 图标与样式统一

**Files:**
- Modify: `components/TabBar.vue`

- [ ] **Step 1: Update `tabList` 图标（保持四 Tab 同一套视觉语言）**

推荐（仍为零依赖字符，不新增 npm 包）：

```js
const tabList = [
  { key: 'home', label: '首页', icon: '🏠' },
  { key: 'category', label: '分类', icon: '▦' },
  { key: 'cart', label: '赏柜', icon: '🛒' },
  { key: 'mine', label: '我的', icon: '👤' }
]
```

`▦`（U+25A6）比 📂 更接近稿图「网格」语义；若某端字体缺字形，可改回 `📂` 但四 Tab 仍保持 emoji。

- [ ] **Step 2: 确认样式**

非激活 `#999999`，激活 `#02b282`；顶栏 `1px solid #f0f0f0`；高度与 `safe-area` 保持现状。

- [ ] **Step 3: Commit**

```bash
git add components/TabBar.vue
git commit -m "style(tabbar): align icons with category mock (keep 赏柜 label)"
```

---

### Task 8: Stack navigation note (optional follow-up, 非本迭代必须)

- [ ] **Record only:** 若从首页多次 `navigateTo` 分类页导致栈过深，后续可评估 `reLaunch` / 原生 `tabBar`；**本 spec 不强制**，本计划不修改路由行为除非手动测试发现问题。

---

## Spec coverage (self-review)

| Spec 段落 | Plan 任务 |
|-----------|-----------|
| 搜索胶囊 + 放大镜 + 占位 | Task 1, Task 6 |
| 左栏 ~25%、绿条、独立滚动 | Task 2, Task 6 |
| 热门搜索 + 热销两列 + 价格 | Task 3, Task 4, Task 6 |
| 商品仅 title + 图占位 | Task 4 mock 形状, Task 6 数据 |
| `pages.json` 注册 + custom 导航 | Task 5 |
| TabBar 赏柜 + 样式 | Task 7 |
| 不接接口 | 无 API 任务 |

**Placeholder scan:** 无 TBD；Task 6 已内联完整 `pages/category/index.vue`。

**Type consistency:** `products[].id` supports string | number in spec; keys use `key` string across sidebar items and `activeKey`.

---

## Execution handoff

**Plan complete and saved to `docs/superpowers/plans/2026-04-03-category-page-ui.md`. Two execution options:**

**1. Subagent-Driven (recommended)** — Dispatch a fresh subagent per task, review between tasks, fast iteration.

**2. Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints.

**Which approach do you want?**
