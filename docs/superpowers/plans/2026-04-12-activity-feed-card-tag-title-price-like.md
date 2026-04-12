# ActivityFeedCard：tag/标题同行与价格/点赞同行 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 `ActivityFeedCard.vue` 中实现 spec 约定：tag 与标题同一 Flex 行（tag 左、标题右两行省略）；价格与点赞同一行（价左、赞右）；描述区仅保留描述，移除原页脚中的 tag/赞。

**Architecture:** 单文件内调整模板顺序与 SCSS：标题区由单层标题改为 `.card-title-row` 包裹可选 `text.card-tag` 与 `.card-title-text-wrap`（`flex:1; min-width:0` + 原有两行 clamp）；价格区在现有 `.card-price-row` 内加入点赞 `text.card-like`，用 flex + `margin-left: auto` 保证无价格时赞仍靠右；删除 `.card-footer` / `.card-meta` 及相关仅服务旧布局的样式规则。`formatLikes` 与 `cardTap` 不变。

**Tech stack:** Vue 3 (`script setup`)、uni-app 小程序组件（`view` / `text`）、scoped SCSS。

**Authoritative spec:** `docs/superpowers/specs/2026-04-12-activity-feed-card-tag-title-price-like-design.md`

---

## File map

| File | Action |
|------|--------|
| `components/ActivityFeedCard.vue` | 修改：模板重排、样式重命名/合并、删除无用 footer/meta 规则 |
| 其它页面 / CMS / utils | 不修改（spec 范围外） |

本组件暂无针对模板的自动化单测；验收以开发者工具/真机目视与 spec 验收标准为准。

---

### Task 1: 更新模板 — 标题行、价格行、精简内容区

**Files:**
- Modify: `components/ActivityFeedCard.vue`（`<template>` 内 `</view>` 闭合前的结构）

- [ ] **Step 1: 用下列片段替换** 原「`card-title` 单独一块 + `card-price-row` 仅价格 + `card-content` 内含 footer」的对应部分（保留封面 `card-cover` 与 `script` 不动）。

将 `</view>`（封面结束）之后到 `card-content` 开始之前，改为：

```vue
    <view class="card-title-row">
      <text v-if="item.tag" class="card-tag">{{ item.tag }}</text>
      <view class="card-title-text-wrap">
        {{ item.title }}
      </view>
    </view>

    <view class="card-price-row">
      <text v-if="item.priceText" class="card-price">{{ item.priceText }}</text>
      <text class="card-like">{{ formatLikes(item.likes) }}</text>
    </view>

    <view class="card-content" :class="{ 'card-content--no-desc': !descVisible }">
      <view v-if="descVisible" class="card-desc">{{ item.desc }}</view>
    </view>
```

- [ ] **Step 2: 删除** 原 `card-content` 内部的整块：

```vue
      <view class="card-footer">
        <view class="card-meta">
          <text class="card-tag">{{ item.tag }}</text>
          <text class="card-like">{{ formatLikes(item.likes) }}</text>
        </view>
      </view>
```

确保 `card` 根 `view` 内仅剩：封面 → `card-title-row` → `card-price-row` → `card-content`（仅可选 `card-desc`）。

---

### Task 2: 更新样式 — 标题行、价格行、清理旧选择器

**Files:**
- Modify: `components/ActivityFeedCard.vue`（`<style lang="scss" scoped>`）

- [ ] **Step 1: 删除** 下列选择器整块（若仍存在）：`.card-footer`、`.card-meta`、`.card-content--no-desc .card-footer`。**保留** `.card-author` 仅当项目其它处仍引用；当前文件内已无 `card-author` 节点，可 **一并删除** `.card-author` 规则以减少死代码。

- [ ] **Step 2: 将原 `.card-title` 规则替换为** 标题行 + 文本容器两套规则（以下为可直接粘贴的完整样式块，用于替换从 `.card-title {` 到其闭合 `}` 的整段）：

```scss
.card-title-row {
  flex-shrink: 0;
  box-sizing: border-box;
  display: flex;
  align-items: flex-start;
  gap: 10rpx;
  padding: 16rpx 20rpx 0;
}

.card-title-text-wrap {
  flex: 1;
  min-width: 0;
  min-height: 88rpx;
  max-height: 88rpx;
  font-size: 26rpx;
  font-weight: 600;
  color: #333;
  line-height: 1.35;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  word-break: break-word;
}
```

- [ ] **Step 3: 更新 `.card-tag`**：从仅出现在 footer 的上下文解脱，保证在标题行内生效。在 **`.card-tag` 规则内增加** `flex-shrink: 0;`（保留原有 `padding`、`border-radius`、`background`、`max-width: 140rpx`、单行省略等）。**删除** 旧 `.card-like { margin-left: 8rpx; }` 中与「与 tag 并排」相关的语义；点赞已迁至价格行（见 Step 4）。

- [ ] **Step 4: 将 `.card-price-row` 替换为：**

```scss
.card-price-row {
  flex-shrink: 0;
  box-sizing: border-box;
  min-height: 48rpx;
  max-height: 48rpx;
  padding: 4rpx 20rpx 0;
  display: flex;
  align-items: center;
}
```

- [ ] **Step 5: 在 `.card-price` 规则之后新增 `.card-like` 价格行语境样式（若已有 `.card-like` 则合并为下列内容）：**

```scss
.card-like {
  margin-left: auto;
  font-size: 20rpx;
  color: #999;
  line-height: 1.2;
}
```

说明：`margin-left: auto` 使点赞始终在行尾；左侧有价格时仍为「价左赞右」。

- [ ] **Step 6: 确认 `.card-content--no-desc`** 仍为仅调整 `padding-top`（例如 `8rpx`），且 **不再** 依赖已删除的 `.card-footer`。

---

### Task 3: 自检与提交

**Files:**
- Modify: `components/ActivityFeedCard.vue`（仅当 Step 1–2 有遗漏时补全）

- [ ] **Step 1: 在 IDE 或 `grep` 中确认** `ActivityFeedCard.vue` 内无残留字符串 `card-footer`、`card-meta`（模板与样式）。

- [ ] **Step 2: 手动验收（开发者工具或真机）**  
对照 spec「验收标准」各条：长标题 + tag、无 tag、仅有赞、价+赞、有/无描述、`cardTap` 仍触发。若 **flex 内两行省略** 在真机异常，按 spec「风险」回退：给 `.card-title-text-wrap` 外包一层 `view` 并设 `flex:1;min-width:0;width:0` 等（仅在实际失败时做）。

- [ ] **Step 3: 提交（在 `TrendyCollectionApp` 仓库根目录执行）**

```bash
git add components/ActivityFeedCard.vue
git commit -m "feat(ActivityFeedCard): tag and title row, price and likes row"
```

预期：`git status` 显示工作区干净（除你有意未提交的文件）。

---

## Plan self-review（对照 spec）

| Spec 要求 | 对应任务 |
|-----------|----------|
| 封面不变 | 未改封面模板 |
| 标题行 Flex，tag 可选，标题两行省略 | Task 1–2，`.card-title-row` + `.card-title-text-wrap` |
| 价格行价左赞右，无价格时赞靠右 | Task 1–2，`margin-left: auto` on `.card-like` |
| 描述区仅描述；无描述 padding | Task 1，`card-content` 仅 `card-desc`；Task 2 `.card-content--no-desc` |
| 移除 footer 中 tag/赞 | Task 1 删除 footer |
| `item` / `formatLikes` / `cardTap` 不变 | Task 1 未改 script |

无 TBD；占位符已避免。

---

## Execution handoff

Plan complete and saved to `docs/superpowers/plans/2026-04-12-activity-feed-card-tag-title-price-like.md`.

**Two execution options:**

**1. Subagent-Driven (recommended)** — Dispatch a fresh subagent per task, review between tasks, fast iteration.

**2. Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints.

Which approach do you want?
