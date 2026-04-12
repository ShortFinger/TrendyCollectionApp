# ActivityFeedCard 1:1 缩略图 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将活动卡片封面 `.card-image` 从固定高度改为与列宽等比的 **1:1 正方形**，采用 CSS `aspect-ratio`，满足 spec `2026-04-12-activity-feed-card-square-thumb-design.md`。

**Architecture:** 仅在 `ActivityFeedCard.vue` 的 scoped 样式中调整 `.card-image`：保留 `width: 100%`、背景 `cover` 与占位色；删除固定 `height: 280rpx`，新增 `aspect-ratio: 1 / 1` 与 `height: auto`（避免旧规则残留）。模板与脚本不变；父页面列表不修改。

**Tech Stack:** uni-app (Vue 3)、SCSS、微信小程序 WXSS 编译链。

---

## 文件与职责

| 文件 | 动作 | 说明 |
|------|------|------|
| `components/ActivityFeedCard.vue` | 修改 | 封面缩略图区域样式 |
| `tests/*.mjs` | 不修改 | 现有 Node 单测与样式无关；作回归命令 |

---

### Task 1: 更新 `.card-image` 为 1:1

**Files:**
- Modify: `components/ActivityFeedCard.vue`（`<style lang="scss" scoped>` 内 `.card-image` 规则，约第 90–97 行；工作目录为 `TrendyCollectionApp` 仓库根目录）

- [ ] **Step 1: 替换 `.card-image` 样式块**

将下列规则 **完整替换** 现有的 `.card-image { ... }` 块（保留其前后其它选择器不变）：

```scss
.card-image {
  width: 100%;
  height: auto;
  aspect-ratio: 1 / 1;
  background-color: #f5f5f5;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}
```

验收点：已移除 `height: 280rpx`；新增 `aspect-ratio: 1 / 1` 与 `height: auto`。

- [ ] **Step 2: 运行现有 Node 测试（回归）**

在仓库根目录 `TrendyCollectionApp` 下执行：

```bash
node --test tests/*.mjs
```

（在 Windows PowerShell 下已验证；若 shell 不展开 glob，可改为逐个列出 `tests/cmsPayloadShape.test.mjs` 等三个文件。）

**预期:** 全部通过（与本次样式改动无逻辑耦合；若有失败须先排除环境/既有问题再提交）。

- [ ] **Step 3: 人工验收（spec 必达）**

1. 微信开发者工具或 HBuilder 运行小程序，打开含双列 `ActivityFeedCard` 的页面（如首页 `pages/index/index`、分类页若复用同组件则一并扫一眼）。
2. 确认缩略图区域为 **正方形**，调节模拟器宽度时高度随列宽成比例变化。
3. 无 `squareThumb` 时灰底区域仍为方形。
4. 角标仍贴在封面四角、可读。

- [ ] **Step 4: 提交**

在 `TrendyCollectionApp` 子仓库内：

```bash
git add components/ActivityFeedCard.vue
git commit -m "fix(ui): ActivityFeedCard thumb uses 1:1 aspect ratio"
```

---

## Spec 对照（作者自检）

| Spec 要求 | 对应任务 |
|-----------|----------|
| `aspect-ratio` 1:1、去掉固定高度 | Task 1 Step 1 |
| 保留 cover / 角标随封面 | 样式未改 `.card-corner-marks` 与背景属性集 |
| 不改 CMS / 列表父级 | 仅改单组件样式 |
| 验收：方形、有/无图、角标 | Task 1 Step 3 |

无占位符；无未覆盖需求。

---

**Plan complete and saved to `docs/superpowers/plans/2026-04-12-activity-feed-card-square-thumb.md`. Two execution options:**

**1. Subagent-Driven (recommended)** — Dispatch a fresh subagent per task, review between tasks, fast iteration.

**2. Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints.

**Which approach?**
