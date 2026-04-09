# TrendyCollectionApp：按 slotType 独立请求 CMS（替代整页 page）设计

**日期**: 2026-04-09  
**范围**: `TrendyCollectionApp` 内所有从 **AppConfig 已发布页** 拉取 slot 的 **C 端动态页**；与服务端单槽只读 API 对齐（见关联规格）。

## 1. 背景与目标

- **现状**: 首页通过 `GET …/v1/pages/{pageKey}/page` **一次拉整页**，本地对 `data.slots` 做 `processSlots`；并存在短期 **整页** 内存缓存。
- **目标**: **不再按整页请求 slot**；对每个需要的 **`slotType` 独立请求**（可与后端多路并行），减小单次响应体积、加快首屏可用区块出现时间。
- **服务端契约**: 与  
  [`TrendyCollectionService` 单槽 API 设计](../../../../TrendyCollectionService/docs/superpowers/specs/2026-04-09-appconfig-slot-level-api-design.md)  
  一致：`GET /app-api/v1/pages/{pageKey}/slots/{slotType}`，`channel` / `appVersion` 必填，`Authorization` 可选且非法 token **不** 导致 401。

## 2. 已确认决策摘要

| 主题 | 决策 |
|------|------|
| 覆盖范围 | **B**：所有会从 CMS 拉数据的动态页统一为按槽请求（当前仓库仅首页实现，新页复用同一套加载器）。 |
| 槽列表来源 | **A**：**各页面/路由自维护** `slotType` 有序列表；CMS 新增槽类型需 **改客户端常量并发版**（或改该页列表）才会请求与展示。 |
| 部分失败 | **A**：**尽力展示**——成功槽正常渲染，失败槽当无数据；可对「部分失败」做 **一次** 轻量 toast。 |
| 客户端缓存 | **A**：**按槽**独立内存缓存 + TTL（与现首页量级一致，如约 3 分钟）；键须含 **登录态 / user 维度**（见 §5）。 |
| 客户端结构 | **方案 1**：共享 **`cmsSlotLoader`**（或同名工具模块）集中并行请求、解析、`Result` 处理与缓存；页面只组合 `pageKey`、`SLOT_TYPES` 与既有 **processor** 映射。 |

## 3. 非目标

- 单次请求批量多槽（query 列表）：不在本规格；若需要另起规格。
- 由服务端下发「本页槽类型清单」从而免发版：未选；与 §2「槽列表来源 A」一致。
- 替换非 AppConfig 的其它业务接口。

## 4. HTTP 与响应使用约定

- **路径模板**: `/v1/pages/{pageKey}/slots/{slotType}`（与现有 `request` 的 `base: API_BASE.app` 拼出完整 URL）。  
- **`slotType`**: 路径段须 **百分号编码**；与 `PublishedSlotsByTypeAssembler` / 管理端 `slotType` 字符串一致。  
- **Query**: `channel`、`appVersion` 与整页接口语义一致（与现首页传参对齐即可）。  
- **成功体**: 使用统一 `Result` 包装；`data` 至少含 **`slot`**（结构与整页 `slots[slotType]` 下单条一致：`id`、`sortOrder`、`items`），以及 **`publishedRevision`**、**`pageKey`**、**`slotType`** 等（名称以实现与服务端对齐为准）。  
- **合并后无该 `slotType`**: HTTP 200，`slot.items` 为空数组，`slot.id` / `slot.sortOrder` 为 `null`（与单槽 API 规格一致）；客户端按空槽处理。  
- **页面不存在**: 业务码与整页一致（如 `PAGE_NOT_FOUND`）；多槽并行时可能多请求同错，客户端应 **聚合** 为 **一次** 用户可见说明（见 §7）。

## 5. 架构：`cmsSlotLoader`

### 5.1 职责

- 入参（概念）：`pageKey`、`slotTypes`（**有序**数组）、`channel`、`appVersion`；内部使用项目既有 `request`（自动带 token 行为保持不变）。
- 对每个 `(pageKey, slotType)`：**查客户端内存缓存**，未命中再发 GET；所有槽 **`Promise.allSettled` 并行**。
- 出参（建议）：
  - **`slots`**: `Record<string, SlotBody>`，仅含 **成功** 且解析通过的槽；键为 `slotType`，值形状与整页 `slots` 的值一致，便于直接 **`processSlots(slots)`** 或传入 **`mergeActivityCardItems(slots)`**（活动卡片仅需包含目标槽的 object 即可）。
  - **`errors`**: `{ slotType, … }[]`，便于页面决定是否 toast。
  - **`meta`**: 至少包含用于 `payloadReportTraceCtx` 的 **`requestId` / `traceId`**（规则见 §6）。

### 5.2 客户端缓存键与 TTL

- **粒度**: 每条缓存对应 **一个** `(pageKey, slotType)`。
- **键维度**（须同时满足）:
  - `pageKey`、`slotType`、`channel`、`appVersion`；
  - **用户维度**: 至少区分 **匿名 / 已登录**；若存在同端换账号，须纳入 **`userId`（或稳定用户标识）**，避免命中他人内容。
- **TTL**: 常量配置（建议与现首页整页缓存同量级）；不强制第一期用 `publishedRevision` 做主动失效；若响应 `publishedRevision` 与条目内不一致可选择丢弃该条并重拉（**可选优化**，非第一期必做）。

### 5.3 与页面处理逻辑的衔接

- 页面在 `load` 时：`reset` 各区块 → 调用 loader → 将 `slots` 交给现有 **`processSlots`**（顺序与现实现一致：`slotTypes` 声明顺序与 `sortOrder` 共同决定遍历语义；**不改变**「`activity_card_grid` 需传入全 `slots` object」的约定，loader 输出的 object 仅含已成功槽，对该处理器仍合法）。
- **停用**: 已从 CMS 迁移完成的页面 **不再调用** `GET …/pages/{pageKey}/page` 拉 slot，避免重复流量。

## 6. 可观测性与 trace

- **`requestId` / `traceId`**: 取自 **第一个成功** 的单槽响应，顺序为页面声明的 **`slotTypes` 数组顺序** 依次查找；用于现有 `[appconfig] invalid CMS payload` 的上下文。若全部失败，保持空字符串。
- **失败槽**: 可 `console.warn`（含 `pageKey`、`slotType`）；不强制在此处做埋点。

## 7. 错误与 UX

- **单槽失败**: 该槽对应 UI **空/占位**；其它槽不受影响。
- **Toast**:
  - 存在成功且存在失败：**最多一次** 轻提示（如「部分内容加载失败」）。
  - **全部失败**: 可与现首页类似的全局失败提示（文案由页面定，规格要求区分「全失败」与「部分失败」）。
- **`PAGE_NOT_FOUND`（或等价）**: **聚合**：同一加载周期内只向用户呈现 **一次** 页面级说明，避免多槽重复 toast。

## 8. 动态页接入约定

- 每页维护 **`PAGE_KEY`** 与本页 **`SLOT_TYPES: string[]`**（有序）。
- 首页首期：`SLOT_TYPES` 覆盖当前处理器：`search_bar`、`banner_row`、`icon_grid`、`activity_card_grid`（与 `pages/index/index.vue` 现逻辑一致）。
- 新动态页：复制「声明列表 + loader + processors」模式即可。

## 9. 测试要点

- **与服务端一致性**: 同 `pageKey`、`channel`、`appVersion`、登录态下，各槽数据与单槽 API / 对账环境一致。
- **并行与部分失败**: 模拟单槽超时或 5xx，验证其它槽仍渲染及 toast 策略。
- **缓存**: TTL 内少请求；切换登录或 `userId` 后不命中错误体。
- **URL 编码**: 含需编码字符的 `slotType` 仍可请求（若 Catalog 未来出现）。

## 10. 关联文档

- 服务端单槽 API：**[`2026-04-09-appconfig-slot-level-api-design.md`](../../../../TrendyCollectionService/docs/superpowers/specs/2026-04-09-appconfig-slot-level-api-design.md)**

**状态**: 规格已整理；**待你审阅文件后**再进入 `writing-plans` 编写实现计划。
