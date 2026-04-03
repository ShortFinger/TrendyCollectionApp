# 分类页 UI 对齐（TrendyCollectionApp）— 设计说明

**日期：** 2026-04-03  
**状态：** 已定稿，待实现计划  
**范围：** `TrendyCollectionApp` 移动端分类页视觉与结构；**不接后端**，数据使用页面内 mock。

---

## 1. 目标与成功标准

- **目标：** 分类页界面与已提供稿图在布局、层级、配色、圆角与滚动行为上对齐；代码采用**组件拆分**（方案 2），便于后续替换数据源。
- **成功标准：**
  - 顶部胶囊搜索条（浅灰底、圆角、放大镜 + 占位「搜索生鲜商品…」）。
  - 左侧约 **25%** 宽度浅灰背景分类栏；激活项为**绿色文字 + 左缘绿色竖条**；左侧与右侧内容区**各自** `scroll-y`。
  - 右侧白底区域含「热门搜索」标签换行、「热销单品」**两列**网格；商品**图在上、标题在下、底部红色价格** `¥` + 数字。
  - 底部自定义 `TabBar`：**激活「分类」** 为品牌绿；第三项文案保持 **「赏柜」**（与稿图「购物车」不一致为产品刻意保留），仅样式与稿图一致（白底、顶部分割线、非激活灰/激活绿）。
  - 分类路由在 `pages.json` 中**已注册**，导航栏配置避免与自定义顶栏重复占位。

---

## 2. 非目标（YAGNI）

- 不实现搜索跳转、商品详情、加购、接口请求、分页、埋点。
- 不将 `TabBar` 改为 `pages.json` 原生 `tabBar`。
- 不按稿图把「赏柜」改名为「购物车」。

---

## 3. 架构与组件边界

页面 `pages/category/index.vue` 仅负责：整体布局高度（减去搜索区与 TabBar）、持有 mock 数据、当前选中分类 `activeKey`。

| 组件路径 | 职责 | Props | 事件（可选） |
|----------|------|-------|----------------|
| `components/category/CategorySearchBar.vue` | 顶栏搜索胶囊 | `placeholder?`（默认 `搜索生鲜商品…`） | 预留 `@click`，本轮可不实现跳转 |
| `components/category/CategorySidebar.vue` | 左侧一级分类列表 | `items: { key: string, label: string }[]`，`activeKey: string` | `update:activeKey`（或等价 `v-model:activeKey`） |
| `components/category/CategoryHotSearch.vue` | 「热门搜索」标题 + 标签 | `tags: string[]` | 可选 `tagClick(tag: string)` |
| `components/category/CategoryProductGrid.vue` | 「热销单品」标题 + 两列卡片 | `products: { id: string \| number, title: string, price: string, imageUrl?: string }[]` | 可选 `itemClick(product)` |

**数据形状：** `price` 在 mock 中为已格式化的展示字符串（如 `199.0`），组件内统一渲染为 `¥{{ price }}`，避免重复业务格式化逻辑。

**商品展示：** 移除与稿图不符的「Product 1」类占位主标题行；**仅展示一条主标题**（沿用现 mock 中的商品描述文案，字段映射为 `title`）。无 `imageUrl` 时使用与稿图一致的**浅灰圆角占位块**（可不显示文字，或保留极淡提示，以实现为准，以稿图为准）。

---

## 4. 视觉规范（与稿图对齐）

| 用途 | 色值 |
|------|------|
| 搜索条背景 | `#F2F2F2` |
| 左侧栏背景 | `#F7F8FA` |
| 右侧内容区背景 | `#FFFFFF` |
| 品牌绿（激活分类、激活 Tab） | `#02B282`（若与稿图偏差可微调但需全页统一） |
| 价格 | `#FF4D4F`，字重加粗 |
| 标签背景 | 浅灰（如 `#F5F5F5` / `#F5F7FB` 择一，与搜索条区分即可） |
| 次要文字 | `#666666` / `#999999` 分层使用 |

**圆角：** 搜索条为**胶囊**（高的一半或固定大 `rpx`）；标签与商品图区域 **8～12px 等效 rpx**；右侧内容区顶部可与现实现一致保留轻微圆角与左侧栏衔接。

**分隔：** 搜索区域与下方主内容之间保留**浅灰横线**或等价间距分割（与稿图一致即可）。

---

## 5. 页面与路由

- 在 `pages.json` 的 `pages` 数组中**增加** `pages/category/index`，并设置 `style`：
  - **推荐：** `navigationStyle: "custom"` 或 `navigationBarTitleText` 为空且隐藏导航栏的具体配置以 uni-app 文档为准，使**仅** `CategorySearchBar` 作为顶栏内容；须处理**状态栏安全区**（`status-bar` 或 `padding-top: var(--status-bar-height)` 等项目惯例）。
  - **备选：** 保留默认导航栏时，标题为「分类」或空，但需评估与稿图「整页顶搜索」的一致性；若与稿图冲突，以实现阶段优先 **custom + 安全区**。
- 主内容区高度：使用 `calc(100vh - 搜索区 - TabBar 高度 - safe-area)` 或与现 `category/index.vue` 等价逻辑，避免双滚动条异常。

---

## 6. TabBar（`components/TabBar.vue`）

- 第三项标签文案：**「赏柜」**（不变）。
- 样式：白底、顶部分割线、非激活灰 / 激活绿，与稿图一致；图标可继续 emoji 或替换为更接近稿图的图标方案，**实现计划阶段**选定一种并保持四 Tab 统一风格。
- 导航行为保持现有 `uni.navigateTo` 逻辑；若实现中发现与 tab 页栈冲突，在实现计划中记录改为 `switchTab` / `reLaunch` 的前提（例如未来接入原生 tabBar），**本 spec 不强制**。

---

## 7. 测试与验收

- **手动：** H5 或目标小程序/真机预览中打开分类页，对照稿图检查上述成功标准。
- **自动化：** 本轮不要求 E2E；组件若有纯函数映射可单测，非必须。

---

## 8. 自检记录（spec review）

- **占位符：** 无 TBD；导航栏二选一在 §5 已写明推荐与备选。
- **一致性：** Tab 文案与稿图差异在 §1、§6 明确为刻意保留「赏柜」。
- **范围：** 单页 UI + TabBar 样式 + `pages.json` 注册，无接口。
- **歧义：** 「主标题」统一为 `title` 字段，对应原 mock 商品描述；价格字符串由页面 mock 提供。

---

## 9. 后续流程

本 spec 经产品/作者确认后，使用 **writing-plans** 产出实现计划（文件路径与任务拆分），再进入编码。
