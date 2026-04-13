# AppConfig 活动详情接口与 `ActivityDetailVO` — 设计说明

**日期:** 2026-04-13  
**状态:** 已定稿（待实现计划）

## 背景与目标

在 App 进入 **`/pages/card/index`**、**`/pages/ichibanKuji/index`**（带 `activityId`）时，通过 **TrendyCollectionAppConfig** 提供 **单一活动详情** 能力，响应体为 **`ActivityDetailVO`**：仅聚合 **Order** 活动主数据与 **`reward_level`** 列表。**不进行 CMS 叠加**（不读 `app_content_item` / `activity_card_ref`）。

**方案:** AppConfig **GET** 聚合（不在小程序内直连拼装多源）。

---

## HTTP 接口（草案）

- **方法 / 路径:** `GET /app-api/v1/activities/{activityId}/detail`
- **Query:** `channel`、`appVersion`（与分类活动等对齐，便于规则扩展）。
- **鉴权:** 与现有 `app-api` 公开接口策略一致（若有 Authorization 则透传解析，无则匿名）。

---

## `ActivityDetailVO` 全量属性

### 根级

| 属性 | 类型 | 来源 | 说明 |
|------|------|------|------|
| `id` | `String` | Order 活动 | 活动 ID |
| `title` | `String` | Order | 与 `display-batch` 单条 `title` 同源 |
| `activityType` | `String` | Order | 与 `ActivityType` 枚举名一致，如 `ICHIBAN`、`CARD` |
| `activityTypeCn` | `String` | Order | 中文类型展示 |
| `rewardLevels` | `array` | Order（见下） | **等级列表，多条** |

**刻意不包含:** `squareThumb`、`longThumb`、`images`、`moneyPrice`、四角标、`tags`、**`status`**。

### `rewardLevels[]` 元素（建议独立类型名：`RewardLevelItemVO`）

对应表 **`reward_level`**（`activity_id` 关联活动），仅暴露下列字段：

| 属性 | 类型 | 对应列 |
|------|------|--------|
| `title` | `String` | `title` |
| `icon` | `String` | `icon`（可空） |
| `sortOrder` | `Integer` | `sort_order` |

**排序:** `ORDER BY sort_order ASC, id ASC`；仅包含 **`is_delete = 0`** 的行。

**不包含:** `id`、`tier_weight`、`open_box_animation` 等（本接口不暴露；若后续需要另立字段表）。

---

## 上架态（已定稿：选项 A）

- **`ActivityDetailVO` 不包含 `status`，也不包含派生布尔（如 `onShelf`）。**
- **小程序不得以本 VO 判断 `ON_SHELF`。** 若产品仍需不可用态，应在 **实现计划** 中单独约定（例如：依赖接口错误码、或其它专用字段/接口），**不在本 VO 内表达**。

---

## 数据聚合与依赖

1. **活动主数据（`id`、`title`、`activityType`、`activityTypeCn`）**  
   与现有 **`POST /client-api/activities/display-batch`**（单 id）同源语义；AppConfig 内部可继续通过已有 **`OrderActivityDisplayClient.displayBatch`** 取数并 **只映射上述字段**。

2. **等级列表**  
   由 Order 提供 **`GET /client-api/activities/{activityId}/reward-levels`**（实现于 `ActivityDisplayController`），返回 **`title` / `icon` / `sortOrder`**；AppConfig 通过 **`OrderRewardLevelsClient`** 调用；**禁止** AppConfig 直连 Order 库表。

3. **CMS**  
   **不进行叠加**：详情接口 **不** 查询 CMS、**不** 合并 `activity_card_ref` payload。列表卡上的自定义 `jumpUrl` 等仍仅在 **首页/分类等 CMS 装配链路** 中生效，与本详情 VO **无关**。

---

## 错误与空结果

- 活动不存在或 Order 返回业务失败：统一 **`Result` 错误码**，由端上展示通用失败或空态（**不**依赖 `status` 字段）。
- 无等级数据：`rewardLevels` 为 **空数组 `[]`**。

---

## 与既有文档的关系

- 默认跳转、类型纠正等仍见 [`2026-04-13-activity-landing-pages-by-type-design.md`](./2026-04-13-activity-landing-pages-by-type-design.md)。  
- 本说明 **取代** 先前关于「详情 VO 含 `ActivityDisplayVO` 全字段」的草稿表述；**`card` / `ichibanKuji` 应以本 VO 为准**拉详情（实现落地时替换原 `display-batch` 直拉若适用）。

---

## 风险与后续

- **Order 需暴露等级列表**：若延期，可临时阻塞本接口上线或降级为 `rewardLevels: []`（需产品接受）。
- **无 `status`**：营销/合规若仍要拦截下架活动，必须在实现阶段增加 **非本 VO** 的判定途径。

---

**下一步:** 按项目流程编写实现计划（`writing-plans`），覆盖 AppConfig Controller、聚合服务、Order 客户端扩展、小程序 `activityDisplayApi` / 页面改造与验收用例。
