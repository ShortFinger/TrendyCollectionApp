# 首页 CMS 已返回数据但端上不渲染（客户端缺口）设计说明

**日期**: 2026-04-09  
**范围**: `TrendyCollectionApp` 首页 `pages/index/index.vue` 及依赖的 `utils/cmsSlotContentTypes.js`、`utils/mergeActivityCards.js`、`utils/cmsSlotLoader.js`；**假设** 单槽 HTTP 已成功、`slot.items` 非空且与整页装配语义一致（由联调方确认）。

## 1. 背景与现象

- 运营在 AppConfig **已发布** 且与小程序 **同一环境**。
- 首页 **未出现**「部分内容加载失败」「首页数据加载失败」等 toast（与 `loadHomeData` 仅在 `errors.length > 0` 时 toast 的行为一致）。
- 仍出现 **「暂无入口」「暂无活动」**，或部分区块为空。

## 2. 推断（与实现对齐）

在无错误 toast 的前提下，请求路径被客户端视为 **全部成功**；空态来自 **处理器未向 `iconList` / `cards` 写入任何项**，而非网络失败。

可能原因均在 **C 端业务过滤/规范化**：

1. **`contentType` 与目录不一致**  
   宫格仅保留 `icon_entry`（见 `utils/cmsSlotContentTypes.js` 中 `CONTENT_TYPE_ICON_ENTRY`）。活动合并仅处理 `activity_card_ref`。若已发布条目使用其它 `contentType` 字符串，会被 **静默跳过**（无 toast）。

2. **`payload` 形态不满足渲染条件**  
   `normalizePayloadForRender` 要求 `payload` 为 **对象或数组**；JSON **字符串** 会被判为非法并仅 `console.warn`。活动合并中 `payload` 必须为 **普通对象**，否则该条 `continue`。

3. **活动卡片：`activityDisplay` 与上架状态**  
   `mergeActivityCardItems` 要求每条引用含 **`activityDisplay`**，且 **`status === 'ON_SHELF'`**，否则该条不进入列表。若单槽响应条目中缺少水合字段或状态与整页不一致，会出现 **「接口有条目、列表为空」**。

4. **`activityId` 缺失**  
   `payload.activityId` 为空则跳过该条。

5. **`slotType` / `processSlots` 顺序**  
   `activity_card_grid` 处理器需要传入 **完整的 `slots` 对象**（当前实现已满足）；若未来合并逻辑依赖多槽同时存在，需保持与设计一致。

## 3. 排查顺序（建议）

1. 在小程序开发者工具中对 `icon_grid`、`activity_card_grid` 单槽响应抓包，核对每条 `items[].contentType`、`items[].payload` 类型、活动条目的 `activityDisplay` 与 `status`。
2. 与 **同一参数** 下整页 `GET .../page` 中对应槽的 JSON **做 diff**（若整页能渲染而单槽不能，则聚焦装配/水合差异；若两端 JSON 一致仍不渲染，则聚焦客户端过滤条件）。
3. 查看控制台是否已有 `[appconfig] invalid CMS payload` 警告（对应 `normalizePayloadForRender` 拒绝的 `payload`）。

## 4. 方案方向（仅客户端侧）

| 方向 | 说明 | 权衡 |
|------|------|------|
| **A. 对齐契约** | 核对 `sys_setting` / 管理端目录与 `cmsSlotContentTypes.js` 常量；保证已发布 `contentType` 与客户端一致。 | 治本；需运营/配置规范。 |
| **B. 增强可观测性（开发/体验包）** | 在 `processIconGrid` / `mergeActivityCardItems` 出口对「输入 items 数 > 0 且输出 0」打结构化日志（脱敏），便于一次抓包定位。 | 不改变线上 UX；需开关或 `NODE_ENV`。 |
| **C. 兼容性解析（按需）** | 若后端存在历史 `payload` 为 JSON 字符串，可在规范化层 **安全 parse 一次**（失败则保持现状）。 | 缩小「有数据不渲染」面；需防注入与性能，单独评审。 |

**推荐**: 先执行 **§3 排查**，用 diff 区分「数据形态问题」与「纯过滤条件问题」；再选 **A** 修正配置或 **B** 缩短下次排障时间。

## 5. 验收标准

- 在给定环境、固定 `channel` / `appVersion` / `pageKey=home` 下，单槽响应中 **意图展示的** `icon_entry` 与 `activity_card_ref` 条目，经现有处理器后 **`iconList` / `cards` 非空**（或与产品定义的「故意隐藏」规则一致）。
- 若条目因 `contentType` / `payload` / `activityDisplay` 被丢弃，团队在联调文档中能 **指向明确代码条件**（本 spec §2），而非笼统「装配失败」。

## 6. 非目标

- 不改变「单槽请求成功但某槽业务上无可用条目时显示空态占位」的总体策略（除非另起 UX 规格区分「未配置」与「配置无效」）。
- 不在本规格中要求恢复整页拉取作为主路径（与 `2026-04-09-trendycollectionapp-per-slot-cms-fetch-design.md` 一致）。

## 7. 关联文档

- [`2026-04-09-trendycollectionapp-per-slot-cms-fetch-design.md`](./2026-04-09-trendycollectionapp-per-slot-cms-fetch-design.md)
- [`2026-04-09-remove-client-display-batch-design.md`](../../../../TrendyCollectionService/docs/superpowers/specs/2026-04-09-remove-client-display-batch-design.md)（活动展示与水合）
- [`2026-04-08-app-cms-client-slot-contenttype-alignment-design.md`](../../../../TrendyCollectionService/docs/superpowers/specs/2026-04-08-app-cms-client-slot-contenttype-alignment-design.md)
