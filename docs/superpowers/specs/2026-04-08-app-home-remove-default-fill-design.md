# APP 首页移除默认填充（空状态）设计

**日期**: 2026-04-08  
**范围**: 仅 `TrendyCollectionApp` 首页 `pages/index/index.vue`（CMS 接口 `GET …/v1/pages/home/page` 与既有 slot 处理逻辑不变）

## 背景与目标

首页当前将 `ref` 初始化为硬编码演示数据，并在 [根目录 CMS 对接说明](../../../../docs/superpowers/specs/2026-04-05-home-page-cms-integration-design.md) 中约定为「未配置或请求失败时的兜底」。产品要求改为：**不再展示任何演示商品/活动/营销文案**；在无数据或失败时 **保留各区块容器级骨架**，以 **统一空状态文案** 提示。

**已确认选择**

- **空状态策略（B）**：保留区块框架，用空状态文案填充，不出现假数据。
- **实现形态（方案 1）**：在首页单文件内用空初值、`v-if`/`v-else` 与样式完成，不单独拆组件（除非后续重复增多再抽离）。
- **Banner 无数据**：使用 **浅灰背景 + 居中提示文案** 的占位条，**不再**使用绿色营销 Banner 作为空态，避免「像有活动」的误导。
- **活动列表无数据**：**移除**「暂无可展示活动」`toast`，仅在区块内展示「暂无活动」。**请求活动接口失败** 时保留错误 `toast`（「活动卡片加载失败」），`cards` 置空并显示同一空状态（与「列表为空」一致即可）。

## 非目标

- 不改后端 CMS 契约、不改数据库种子数据（若需清空线上默认页数据，另起任务）。
- 不新增独立空状态组件（方案 1）；不调整 TabBar、头部铃铛等全局壳层。

## 数据与生命周期

### 初值

| 状态           | 初值说明 |
|----------------|----------|
| `searchPlaceholder` | 通用占位 `搜索`（无 CMS 或未返回 `placeholder` 时保持）。 |
| `bannerData`   | 全空：`title` / `subTitle` / `rightText` / `buttonText` / `jumpUrl` 等为 `''`，`jumpType` 为 `'none'`，`bgColor` 可 `''` 或由模板在「有内容」时使用 payload。 |
| `iconList`     | `[]` |
| `cards`        | `[]` |

### 每次加载前重置

在 `loadHomeData` 的 `try` 内、**在** `await fetchHomePage()` **之前** 调用一次 **`resetHomeSections()`**（或等价内联），将上述 ref 恢复为与「初值」一致。保证：

- 使用内存缓存命中时也会先清空再 `processSlots`，避免缺 slot 时残留上一屏。
- 接口失败时：若重置在 fetch 之前执行，首屏即为空态；`catch` 中现有「首页数据加载失败」toast 保留，`ref` 保持空态。

### 处理器与合并行为

- `processSearchBar`：仅当 payload 含有效 `placeholder` 时覆盖；否则保持 `搜索`。
- `processBanner`：在重置后应对 **整对象赋值** 或与「空模板」合并，避免 `mergeActivityCards` 式累加导致字段残留；规范：**以本次 payload 解析结果覆盖 `bannerData` 中可由 CMS 提供的字段**（无 item 则不处理，保持 reset 后空态）。
- `processIconGrid` / `processActivityCards`：逻辑保持「仅在有有效列表时赋值」；无数据时保持 `[]`。

### Banner 是否有内容（展示营销 Banner）

用于模板分支，避免空标题仍显示绿底按钮区：

- `bannerHasContent` 为真，当且仅当：
  - `title` 经 `trim()` 非空，**或**
  - `jumpType` 有效且不是 `'none'`，且 `jumpUrl` 非空。

否则渲染 **空状态条**（不可点跳转，或点击无操作）。

**可选细化**：若仅有 `subTitle` 无 `title`，可归入无内容侧（与「无营销主文案」一致）；运营需配置标题或跳转。

## 模板与样式

- **搜索栏**：始终展示；占位为 `searchPlaceholder`。
- **Banner 区**：
  - 有内容：现有绿/配色 Banner 布局，`@click` 仍走 `handleBannerClick`。
  - 无内容：单行或两行内的灰色圆角容器（与页面 `#f7f8fa` / 白卡片协调），文案：**「暂未配置 Banner」**，无营销按钮区。
- **图标宫格**：保留外层白卡片与 `margin`；`iconList.length > 0` 时现有宫格；否则卡片内居中 **「暂无入口」**。
- **活动卡片区**：`cards.length > 0` 时现有列表；否则在列表区域展示 **「暂无活动」**（可与宫格同类排版：最小高度、灰色字），**不** `toast`。
- **首屏加载**：初值为空，不闪现演示数据；无需额外骨架图（非目标）。

## 错误与边界

| 场景 | 预期 |
|------|------|
| 首页 page 请求失败 | `toast`「首页数据加载失败」，各区块空态。 |
| `slots` 为空或未返回 | 全程空态 + 搜索默认占位。 |
| 有 `activity_card_grid` 但无活动 id | `cards = []`，空态，无「暂无可展示活动」toast。 |
| 活动 batch 接口失败 | 错误 toast，`cards = []`，空态（与无活动一致）。 |

## 与既有文档的关系

根目录 [2026-04-05-home-page-cms-integration-design.md](../../../../docs/superpowers/specs/2026-04-05-home-page-cms-integration-design.md) 中「失败时展示硬编码默认值」的约定 **由本文档替代**：失败后展示 **空状态**，不再使用演示 `ref` 初值。

## 测试建议

- CMS 全量配置 / 仅部分 slot / 无 `banner_row` / 无活动 id / 首页 API 失败 / 活动 API 失败 / 连续进入首页无脏数据。

## 后续

实现阶段使用 **writing-plans** 产出修改清单与自测步骤；本 spec 经用户确认后再进入开发。
