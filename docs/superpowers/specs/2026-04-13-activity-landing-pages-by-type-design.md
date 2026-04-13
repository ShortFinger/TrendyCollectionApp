# 活动卡默认跳转与类型落地页 — 设计说明

**日期:** 2026-04-13  
**状态:** 已定稿（待实现计划）

## 背景与目标

首页 / 分类等处的 `ActivityFeedCard` 点击后，需按 **`ActivityDisplayVO.activityType`**（与 Order 侧 `ActivityType` 枚举名一致）进入 **合理默认页面**。运营在 CMS 为单卡配置了 **自定义 `jumpUrl`** 时，**仍优先**走配置，**不**经过本说明中的「默认路径」。

数据详情 **MVP** 仍采用 **`POST /client-api/activities/display-batch`**（`ids` 仅含一个 `activityId`），展示字段与 **`ActivityDisplayVO`** 一致，与列表水合口径对齐。

## 范围

- **包含:** `TrendyCollectionApp` 内 `buildActivityJump` 默认路径；`pages.json` 注册；需落地数据页的 **`/pages/activity/other/index`**、**`/pages/card/index`**；类型与路由不一致时的 **纠正跳转**；父页面既有 `handleJump` 行为（含 tab 带参）。
- **本阶段不包含:** **`UNLIMITED` 独立落地页**（不设 `/pages/activity/unlimited/index`；`UNLIMITED` 默认与 **`ICHIBAN` 相同**，直进赏柜；日后若需无限赏专属落地页另立 spec / 扩展表）。
- **不包含:** 赏柜（`ichibanKuji`）与抽卡机（`card`）**壳内**玩法与接口的完整实现（可另立 spec）；H5 / webview 跳转接入。

## 活动类型枚举（后端）

`ActivityType` 枚举名与 VO 中 `activityType` 一致，示例：

| 枚举名 | 中文（`activityTypeCn` 常见来源） |
|--------|-----------------------------------|
| `ICHIBAN` | 一番赏 |
| `UNLIMITED` | 无限赏 |
| `CARD` | 抽卡机 |
| `LUCKY_BAG` / `COMBO_DRAW` / `EUROPEAN` / `ENERGY_POOL` | 福袋 / 连击赏 / 欧皇 / 能量池 |

未在下方单独列出的类型，**默认**归入 **「其它」落地页**。

## 默认跳转表（无 CMS `payload.jumpUrl` 时）

`mergeActivityCards`、`activityDisplaySnapshotToCardItem` 等通过 **`buildActivityJump(activityId, activityType, payloadJumpType, payloadJumpUrl)`** 生成 `jumpType` / `jumpUrl`。当 **`pickString(payloadJumpUrl)` 为空** 时，默认 **`jumpUrl`** 按下表（`activityId` 必须 `encodeURIComponent`）：

| `activityType` | 默认 `jumpUrl` | 说明 |
|----------------|----------------|------|
| **`ICHIBAN`** | `/pages/ichibanKuji/index?activityId={id}` | **tab 赏柜**；与现有 `openInternalUrl` 对 tab + query 行为一致 |
| **`UNLIMITED`** | `/pages/ichibanKuji/index?activityId={id}` | 与 **`ICHIBAN` 相同**（本阶段**不**做无限赏专属落地页） |
| **`CARD`** | `/pages/card/index?activityId={id}` | **非 tab** 栈页（需在 `pages.json` 注册）；抽卡机业务壳 |
| **其它**（含 `LUCKY_BAG`、`COMBO_DRAW`、`EUROPEAN`、`ENERGY_POOL` 及未知字符串兜底） | `/pages/activity/other/index?activityId={id}` | **独立落地页**，主 CTA 去赏柜 |

当 **`payloadJumpUrl` 非空** 时：**不**应用上表，返回 `{ jumpType: jt, jumpUrl: ju }`（与现逻辑一致），满足 **CMS 自定义优先**。

`jumpType` 在站内路径场景下仍为 **`page`**（与现网一致）；`h5` 等仍走既有 `handleJump` 分支。

## 需拉取 `display-batch` 的页面

- **`/pages/activity/other/index`**：进入后必须带 `activityId` 请求 **`display-batch`**，以 VO 渲染；**`status !== 'ON_SHELF'`** 或缺条时展示 **统一不可用态**，主 CTA 去赏柜 **禁用或隐藏**。
- **`/pages/card/index`**：**MVP** 至少接收 `activityId`；建议同样调用 **`display-batch`** 展示标题/封面等与 VO 一致的信息（与产品对齐后可再收紧）。若仅占位壳，须在实现计划中写明过渡策略。
- **`/pages/ichibanKuji/index`**：是否在本次接入 `activityId` 数据不在本 spec 强制范围（可能已有或后续接）。

## 类型与路由不一致（纠正跳转）

以接口返回的 **`activityType` 为准**。将 `activityType` 映射为 **本节「默认跳转表」中的 canonical `jumpUrl`（仅 path + query 模板，替换同一 `activityId`）**。若当前所在页面（含 path）与该 URL **不一致**，则使用 **`redirectTo`** 到正确地址，避免深链或分享错页长期停留在错误容器。

示例：用户打开 **`/pages/activity/other/index?activityId=x`**，但 VO 为 **`ICHIBAN` 或 `UNLIMITED`** → `redirectTo` 赏柜带参 URL；打开 **`/pages/card/index`** 但 VO 为 **`CARD` 以外** → `redirectTo` 对应 canonical 路径。

## 落地页内主 CTA（去赏柜）

**`其它`** 落地页（`other`）底部主按钮：打开 **`/pages/ichibanKuji/index?activityId={id}`**，使用项目内 **`openInternalUrl`（或等价封装）**，与 tab 带 query 约定一致。

**`CARD`** 页主 CTA 若需进入玩法流，目标以产品为准（默认可与赏柜区分，本 spec 不锁死路径，实现计划落地）。

## 与先前讨论的对应关系

- **方案一**：默认跳转仅在 **`buildActivityJump`**（及类型映射辅助函数）中集中维护，父页面 **`handleCardClick`** 保持 **`handleJump(item.jumpType, item.jumpUrl)`**。
- **CMS B**：自定义 **`jumpUrl`** 时 **不进** 上述默认落地/赏柜/抽卡路径。
- **数据 MVP**：单 id **`display-batch`**，与 **`ActivityDisplayVO`** 同源。
- **无限赏（本阶段）**：**不**建独立落地页；`UNLIMITED` 默认与 **`ICHIBAN`** 一样 **直进赏柜**。

## 验收要点（摘要）

1. 无自定义 `jumpUrl` 时，点击卡片的默认落地符合 **默认跳转表**。
2. 有自定义 `jumpUrl` 时，行为与改造前 **`handleJump`** 一致，**不**强制经过默认表路径。
3. **`other` 落地页**：`ON_SHELF` 才展示完整内容与可用「去赏柜」；否则统一不可用态。
4. 深链类型与 VO 不一致时发生 **`redirectTo`** 纠正。
5. `pages.json` 含 **`pages/card/index`**、**`pages/activity/other/index`**（路径以最终实现为准，但与上表一致）；**不含** `pages/activity/unlimited/index`（本阶段）。

## 风险与后续

- **`UNLIMITED`**：若产品需要 **无限赏专属落地页**，新增 **`/pages/activity/unlimited/index`** 并改 **默认跳转表** 中 **`UNLIMITED`** 行（与 **`ICHIBAN` 直进赏柜** 区分）。
- **`CARD`** 与 **其它** 枚举类型若后续需要 **独立壳**（非 `other` 共用页），可再拆路由并扩展 **默认跳转表**。
- 赏柜、抽卡机 **壳内** 若需与 `display-batch` 不同接口，另立 spec，不在此扩展字段。

---

**实现计划:** [`docs/superpowers/plans/2026-04-13-activity-landing-pages-by-type.md`](../plans/2026-04-13-activity-landing-pages-by-type.md)
