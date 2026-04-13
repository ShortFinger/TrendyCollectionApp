# 抽卡机页线框结构 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 按 spec `docs/superpowers/specs/2026-04-13-gacha-card-page-structure-design.md`，将 `pages/card/index` 成功态改为 **主区横向：左封面 + 右双入口**，底部 **一行四钮（1/5/10/20 抽）**；系统导航栏不变；数据与 `activityId` / `display-batch` / canonical 路由逻辑不变；侧链与抽数均为占位 toast。

**Architecture:** 单文件 `pages/card/index.vue` 内用 flex 完成分区（不拆子组件、不加 `scroll-view`）。活动标题通过 **`uni.setNavigationBarTitle`** 在 VO 可用且 `ON_SHELF` 时同步。移除与线框无关的成功态信息块（原 `body` 内 badge / 标题 / 价格），标题改由导航栏展示。

**Tech Stack:** uni-app (Vue 3 `<script setup>`)、既有 `fetchActivityDisplayById`、`ensureCanonicalActivityRoute`。

---

## File map

| 文件 | 职责 |
|------|------|
| `pages/card/index.vue` | 模板结构、占位交互、`setNavigationBarTitle`、与底栏安全区配套的 `padding-bottom` |

**不修改:** `pages.json`（已为默认导航栏）、`utils/*`（除非实现中发现 bug）。

---

### Task 1: `pages/card/index.vue` 线框结构

**Files:**
- Modify: `TrendyCollectionApp/pages/card/index.vue`

- [ ] **Step 1: 更新 `<script setup>`：抽数常量、标题同步、统一占位函数**

在 `import` 中增加 `watch`（`vue`）。删除不再使用的 `formatMoneyPrice`、`pickActivityTypeCn` 及对应 `computed`（`typeCn`、`priceText`、`title`——模板不再展示标题行，标题仅经 `setNavigationBarTitle` 设置）。新增：

```javascript
import { ref, computed, watch } from 'vue'

const drawCounts = [1, 5, 10, 20]

watch(
  () => vo.value,
  (v) => {
    if (!v || String(v.status ?? '').trim() !== 'ON_SHELF') return
    const t = String(v.title ?? '').trim()
    if (t) uni.setNavigationBarTitle({ title: t })
  },
  { immediate: true }
)

function onPlaceholder() {
  uni.showToast({ title: '玩法接入中', icon: 'none' })
}
```

删除原 `onPrimaryCta`，所有侧链与底栏抽数均 `@tap="onPlaceholder"`。

- [ ] **Step 2: 替换成功态模板**

将 `v-else class="content"` 分支替换为：外层 `content` → 内层 `main` 横向一行；左 `cover`（保留现有 `backgroundImage` 与 `coverUrl`）；右 `side` 内两个 `side-item`，文案 **「中赏概率」「购买说明」**。删除原 `body`、`badge`、`title`、`price`、`bottom-safe` 块。

在 `v-if="available"` 的 `bar` 内，用 `v-for="n in drawCounts"` 渲染四个按钮，文案 `{{ n }}抽`。

完整模板参考：

```vue
<template>
  <view class="page">
    <view v-if="loading" class="state">
      <text class="state-text">加载中…</text>
    </view>
    <view v-else-if="loadError" class="state">
      <text class="state-text">{{ loadError }}</text>
    </view>
    <view v-else-if="!available" class="state">
      <text class="state-title">活动不可用</text>
      <text class="state-sub">活动已下架或不存在</text>
    </view>
    <view v-else class="content">
      <view class="main">
        <view
          class="cover"
          :style="{ backgroundImage: coverUrl ? `url(${coverUrl})` : '' }"
        />
        <view class="side">
          <view class="side-item" @tap="onPlaceholder">
            <text class="side-text">中赏概率</text>
          </view>
          <view class="side-item" @tap="onPlaceholder">
            <text class="side-text">购买说明</text>
          </view>
        </view>
      </view>
    </view>

    <view v-if="available" class="bar">
      <view
        v-for="n in drawCounts"
        :key="n"
        class="bar-btn"
        @tap="onPlaceholder"
      >
        <text class="bar-btn-text">{{ n }}抽</text>
      </view>
    </view>
  </view>
</template>
```

- [ ] **Step 3: 调整 `<style scoped>`：纵向页 + 主区横行 + 底栏四等分**

保留 `.state` 等既有状态样式。成功态要点：

- `.page`：`min-height: 100vh`；`display: flex`；`flex-direction: column`；`box-sizing: border-box`；`padding-bottom` 为 **底栏高度 + safe-area**（例如沿用原 `calc(120rpx + env(safe-area-inset-bottom))`，若四钮变高可改为 `140rpx`，以不遮挡主区为准）。
- `.content`：`flex: 1`；`display: flex`；`flex-direction: column`；`min-height: 0`。
- `.main`：`flex: 1`；`display: flex`；`flex-direction: row`；`align-items: stretch`；`min-height: 0`。
- `.cover`：`flex: 1`；`min-width: 0`；保留 `background-color` / `background-size` / `background-position`；可保留 `aspect-ratio: 1` 或改为 `min-height` 由你根据真机微调（结构阶段以不崩布局为准）。
- `.side`：`display: flex`；`flex-direction: column`；`justify-content: center`；`gap` 与 `padding` 给极小占位即可。
- `.side-text`：字号可读即可。
- `.bar`：保持 `position: fixed; left: 0; right: 0; bottom: 0`；`display: flex`；`flex-direction: row`；`align-items: stretch`；每个 `.bar-btn`：`flex: 1`；`text-align: center`；`padding` 略大于原单按钮以便四钮可点。

删除仅被旧 `.body` / 单钮底栏使用的无用选择器（如 `.badge`、`.title`、`.price`、原 `.bar-btn.primary` 若不再使用）。

- [ ] **Step 4: 自检**

在工程根目录 `TrendyCollectionApp`：

```bash
npm test
```

预期：与本次改动无关的既有用例通过；若项目无针对 `card` 页的测试，**不新增**测试文件（与 spec「不强制自动化」一致）。

- [ ] **Step 5: 手工验收**

`npm run dev`，使用带有效 `activityId` 的 `CARD` 活动进入 `/pages/card/index`：

- 系统栏有返回与标题（加载成功后若 VO 有 `title` 应与活动名一致）。
- 成功态可见 **左封面、右「中赏概率」「购买说明」、底栏四钮**。
- 加载中 / 失败 / 不可用不出现线框主区与底栏（`v-if="available"` 仍约束底栏；成功态主区仅在 `v-else` 可用分支）。

- [ ] **Step 6: Commit**

```bash
cd TrendyCollectionApp
git add pages/card/index.vue
git commit -m "feat(card): wireframe layout — cover, side links, four draw buttons"
```

---

## Self-review（对照 spec）

| Spec 要求 | 对应位置 |
|-----------|----------|
| 系统默认导航，非 custom | 不改 `pages.json`；Task 1 不引入自定义顶栏 |
| 成功态主区左封面、右双链 | Step 2 `.main` / `.cover` / `.side` |
| 底栏 1/5/10/20 抽 | `drawCounts` + Step 2 `v-for` |
| `setNavigationBarTitle` 与 VO.title | Step 1 `watch` |
| 占位交互 | Step 1 `onPlaceholder` |
| 加载/错误/不可用不变 | Step 2 保留三个 `state` 分支 |
| 不拆子组件、不 scroll-view | Task 1 仅改单文件 |

无 TBD；自动化测试非强制，手工步骤已列。

---

## Execution handoff

**Plan complete and saved to `docs/superpowers/plans/2026-04-13-gacha-card-page-structure.md`. Two execution options:**

**1. Subagent-Driven (recommended)** — Dispatch a fresh subagent per task, review between tasks, fast iteration. **REQUIRED SUB-SKILL:** `superpowers:subagent-driven-development`.

**2. Inline Execution** — Execute tasks in this session using `superpowers:executing-plans`, batch execution with checkpoints.

**Which approach?**
