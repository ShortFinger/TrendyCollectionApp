# TrendyCollectionApp 按槽拉取 CMS Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在小程序端用共享 loader 并行请求 `GET /v1/pages/{pageKey}/slots/{slotType}`，按槽做短期内存缓存，首页改为不再调用整页 `GET …/page`；行为符合 [`2026-04-09-trendycollectionapp-per-slot-cms-fetch-design.md`](../specs/2026-04-09-trendycollectionapp-per-slot-cms-fetch-design.md)。

**Architecture:** 新增 `utils/cmsSlotKeys.js`（仅纯函数与常量，**无 uni**）供 Node 测试；`utils/cmsSlotLoader.js` 依赖 `request` / `store/user`，实现 `fetchPublishedSlotsForPage`（`Promise.all` 并行逐槽、`errors` / `pageNotFound` / `meta`）。`pages/index/index.vue` 删除整页 `fetchHomePage` 与 `pageCache`，声明 `SLOT_TYPES` 顺序数组，在 `loadHomeData` 中调用 loader 后沿用现有 `processSlots`。

**Tech Stack:** uni-app（`uni.request` 封装为 `utils/request.js` 的 `request`）、Vue 3 `<script setup>`、Node.js 内置 `node:test`（仅测纯函数）。

**前置:** `TrendyCollectionAppConfig` 已实现并部署单槽 API（见 [`TrendyCollectionService` 计划](../../../TrendyCollectionService/docs/superpowers/plans/2026-04-09-appconfig-slot-level-api.md)）；否则客户端联调会失败。

---

## File map

| File | Role |
|------|------|
| `TrendyCollectionApp/utils/cmsSlotKeys.js` | **Create** — `CMS_SLOT_CACHE_TTL_MS`、`buildCmsSlotCacheKey`、`pickTraceMetaFromSlotResponses`（无 `request`/uni） |
| `TrendyCollectionApp/utils/cmsSlotLoader.js` | **Create** — `getCmsSlotUserSegment`、`fetchPublishedSlotsForPage`、内存缓存 |
| `TrendyCollectionApp/tests/cmsSlotLoader-cache.test.mjs` | **Create** — 仅 import `cmsSlotKeys.js`（避免加载 uni） |
| `TrendyCollectionApp/pages/index/index.vue` | **Modify** — 去掉整页请求与整页缓存；接入 loader + toast 策略 |

---

### Task 1: `cmsSlotKeys.js` 纯函数与单元测试

**Files:**
- Create: `TrendyCollectionApp/utils/cmsSlotKeys.js`
- Create: `TrendyCollectionApp/tests/cmsSlotLoader-cache.test.mjs`

**约定:** `ErrorCode.PAGE_NOT_FOUND` 对应 **HTTP 业务体** `code === 40401`（与 `com.trendy.appconfig.common.ErrorCode` 一致）；若联调时字段不同，以实际 `reject` 的 `res.data` 为准改一处常量 `PAGE_NOT_FOUND_CODE = 40401`。

- [ ] **Step 1: 新建 `cmsSlotKeys.js`**

在 `TrendyCollectionApp/utils/cmsSlotKeys.js` 写入：

```javascript
/** AppConfig 单槽缓存 TTL（与曾用整页缓存同量级） */
export const CMS_SLOT_CACHE_TTL_MS = 3 * 60 * 1000

/** 与 TrendyCollectionAppConfig ErrorCode.PAGE_NOT_FOUND 对齐 */
export const PAGE_NOT_FOUND_CODE = 40401

/**
 * @param {{ pageKey: string, slotType: string, channel: string, appVersion: string, userSegment: string }} p
 */
export function buildCmsSlotCacheKey(p) {
  return [p.pageKey, p.slotType, p.channel, p.appVersion, p.userSegment].join('\u0001')
}

/**
 * @param {string[]} slotTypesOrdered 页面声明顺序
 * @param {Record<string, any>} dataBySlotType slotType -> 单槽 API 成功时的 data 对象
 */
export function pickTraceMetaFromSlotResponses(slotTypesOrdered, dataBySlotType) {
  for (const slotType of slotTypesOrdered) {
    const data = dataBySlotType[slotType]
    if (!data || typeof data !== 'object') continue
    const requestId = (data.requestId ?? data.reqId ?? data.requestID ?? '').toString().trim()
    const traceId = (data.traceId ?? data.traceID ?? '').toString().trim()
    if (requestId || traceId) return { requestId, traceId }
  }
  return { requestId: '', traceId: '' }
}
```

- [ ] **Step 2: 编写失败测试（断言行为）**

创建 `TrendyCollectionApp/tests/cmsSlotLoader-cache.test.mjs`：

```javascript
import test from 'node:test'
import assert from 'node:assert/strict'
import {
  buildCmsSlotCacheKey,
  pickTraceMetaFromSlotResponses
} from '../utils/cmsSlotKeys.js'

test('buildCmsSlotCacheKey: userSegment 不同则键不同', () => {
  const base = { pageKey: 'home', slotType: 'banner_row', channel: 'mp-weixin', appVersion: '1.0.0' }
  assert.notEqual(
    buildCmsSlotCacheKey({ ...base, userSegment: 'anon' }),
    buildCmsSlotCacheKey({ ...base, userSegment: 'u:42' })
  )
})

test('pickTraceMeta: 按 slotTypes 顺序取第一个含 trace 的 data', () => {
  const order = ['a', 'b']
  const dataBy = {
    a: {},
    b: { requestId: 'r1', traceId: 't1' }
  }
  assert.deepEqual(pickTraceMetaFromSlotResponses(order, dataBy), { requestId: 'r1', traceId: 't1' })
})
```

- [ ] **Step 3: 运行测试**

```bash
cd /Users/lssss/project/TrendyCollection/TrendyCollectionApp && node --test tests/cmsSlotLoader-cache.test.mjs
```

Expected: 全部 `pass`。

- [ ] **Step 4: Commit**

```bash
cd /Users/lssss/project/TrendyCollection/TrendyCollectionApp
git add utils/cmsSlotKeys.js tests/cmsSlotLoader-cache.test.mjs
git commit -m "feat(app): add cmsSlotKeys helpers and node tests"
```

---

### Task 2: 新建 `cmsSlotLoader.js`（缓存 + 并行 + 错误归类）

**Files:**
- Create: `TrendyCollectionApp/utils/cmsSlotLoader.js`

- [ ] **Step 1: 完整实现 `fetchPublishedSlotsForPage`**

创建 `cmsSlotLoader.js`：

```javascript
import { request, API_BASE } from './request.js'
import { getUser } from '../store/user.js'
import {
  CMS_SLOT_CACHE_TTL_MS,
  PAGE_NOT_FOUND_CODE,
  buildCmsSlotCacheKey,
  pickTraceMetaFromSlotResponses
} from './cmsSlotKeys.js'

const memorySlotCache = new Map()

export function getCmsSlotUserSegment() {
  const u = getUser()
  if (!u) return 'anon'
  const id = u.id ?? u.userId
  if (id != null && id !== '') return `u:${String(id)}`
  return 'u:unknown'
}

function getCachedSlot(cacheKey) {
  const row = memorySlotCache.get(cacheKey)
  if (!row) return null
  if (Date.now() - row.storedAt > CMS_SLOT_CACHE_TTL_MS) {
    memorySlotCache.delete(cacheKey)
    return null
  }
  return row.slot
}

function setCachedSlot(cacheKey, slot) {
  memorySlotCache.set(cacheKey, { slot, storedAt: Date.now() })
}

function slotUrl(pageKey, slotType) {
  const pk = encodeURIComponent(pageKey)
  const st = encodeURIComponent(slotType)
  return `/v1/pages/${pk}/slots/${st}`
}

/**
 * @param {{ pageKey: string, slotTypes: string[], channel: string, appVersion: string }} params
 * @returns {Promise<{ slots: Record<string, any>, errors: Array<{ slotType: string, error: any }>, pageNotFound: boolean, meta: { requestId: string, traceId: string } }>}
 */
export async function fetchPublishedSlotsForPage(params) {
  const { pageKey, slotTypes, channel, appVersion } = params
  const userSegment = getCmsSlotUserSegment()
  const dataBySlotType = {}
  const errors = []
  let pageNotFound = false

  await Promise.all(
    slotTypes.map(async (slotType) => {
      const cacheKey = buildCmsSlotCacheKey({
        pageKey,
        slotType,
        channel,
        appVersion,
        userSegment
      })
      const hit = getCachedSlot(cacheKey)
      if (hit) {
        dataBySlotType[slotType] = { slot: hit }
        return
      }
      try {
        const data = await request({
          url: slotUrl(pageKey, slotType),
          base: API_BASE.app,
          method: 'GET',
          data: { channel, appVersion }
        })
        const slot = data?.slot != null ? data.slot : { id: null, sortOrder: null, items: [] }
        setCachedSlot(cacheKey, slot)
        dataBySlotType[slotType] = data
      } catch (error) {
        const code = error && typeof error === 'object' ? error.code : undefined
        if (code === PAGE_NOT_FOUND_CODE) pageNotFound = true
        errors.push({ slotType, error })
        console.warn('[cmsSlotLoader] slot fetch failed', { pageKey, slotType, code })
      }
    })
  )

  const slots = {}
  for (const slotType of slotTypes) {
    const row = dataBySlotType[slotType]
    if (row && row.slot) slots[slotType] = row.slot
  }

  const meta = pickTraceMetaFromSlotResponses(slotTypes, dataBySlotType)

  return { slots, errors, pageNotFound, meta }
}

export { PAGE_NOT_FOUND_CODE } from './cmsSlotKeys.js'
```

说明：使用 `Promise.all` 并行；单槽错误在内部捕获并记入 `errors`，不阻断其它槽（与「尽力展示」一致）。

- [ ] **Step 2: 手测（需后端已上线单槽 API）**

在开发者工具中临时于某页 `onMounted` 调用：

```javascript
import { fetchPublishedSlotsForPage } from '@/utils/cmsSlotLoader.js'

const r = await fetchPublishedSlotsForPage({
  pageKey: 'home',
  slotTypes: ['banner_row'],
  channel: 'mp-weixin',
  appVersion: '1.0.0'
})
console.log(r)
```

Expected: `r.slots.banner_row` 有 `items` 数组；与 `GET .../home/page` 中对应槽一致（对账）。

- [ ] **Step 3: Commit**

```bash
cd /Users/lssss/project/TrendyCollection/TrendyCollectionApp
git add utils/cmsSlotLoader.js
git commit -m "feat(app): fetchPublishedSlotsForPage with per-slot cache"
```

---

### Task 3: 首页 `index.vue` 接入 loader

**Files:**
- Modify: `TrendyCollectionApp/pages/index/index.vue`

- [ ] **Step 1: 删除整页缓存与 `fetchHomePage`**

移除模块级 `pageCache`、`CACHE_TTL` 常量、以及 `fetchHomePage` 函数全体。

- [ ] **Step 2: 增加槽列表常量与 import**

在 `<script setup>` 顶部附近：

```javascript
import { fetchPublishedSlotsForPage } from '@/utils/cmsSlotLoader.js'
```

声明：

```javascript
const CMS_SLOT_TYPES = ['search_bar', 'banner_row', 'icon_grid', 'activity_card_grid']
```

顺序与规格「trace 取首个成功」一致；若产品要调顺序，保持与视觉从上到下一致即可。

- [ ] **Step 3: 重写 `loadHomeData`**

逻辑要点：

1. `resetHomeSections()`、清空 `payloadErrorDedupKeys`、`payloadReportTraceCtx` 先置空（与现逻辑一致）。
2. `const { slots, errors, pageNotFound, meta } = await fetchPublishedSlotsForPage({ pageKey: CMS_PAGE_KEY, slotTypes: CMS_SLOT_TYPES, channel: 'mp-weixin', appVersion: '1.0.0' })`（`channel` / `appVersion` 与删除前的 `fetchHomePage` query 一致）。
3. `payloadReportTraceCtx.value = meta`。
4. 若 `pageNotFound`：单次 `uni.showToast`（如「页面不存在」），**不**再为每槽 toast；`return`（sections 已 reset，保持空态）。
5. 否则 `await processSlots(slots)`。
6. Toast：若 `!pageNotFound && errors.length > 0 && Object.keys(slots).length > 0`，一次「部分内容加载失败」；若 `!pageNotFound && errors.length === CMS_SLOT_TYPES.length`（全部槽请求均失败），用现文案「首页数据加载失败」或等价。

注意：`errors` 与「空槽成功」区分——某槽返回 200 且 `items: []` 不算 `errors`。

- [ ] **Step 4: 真机/模拟器走查**

- 首屏四块是否与单槽/旧整页一致。  
- 关掉某一槽后端或模拟超时：其它块仍出；部分失败 toast 仅一次。  
- 已登录 / 退出登录各拉一次：缓存不串（看网络面板重复进入是否命中少请求）。

- [ ] **Step 5: Commit**

```bash
cd /Users/lssss/project/TrendyCollection/TrendyCollectionApp
git add pages/index/index.vue
git commit -m "refactor(app): home CMS loads per-slot API instead of full page"
```

---

## Self-review（对照规格）

**1. Spec coverage**

| 规格章节 | 对应任务 |
|----------|----------|
| 单槽 HTTP、query、路径编码 | Task 2 `slotUrl` + `request` |
| 并行、尽力展示、toast | Task 2 + Task 3 |
| 按槽缓存与用户维度 | Task 1 `buildCmsSlotCacheKey` + Task 2 `getCmsSlotUserSegment` |
| trace 顺序 | Task 1 `pickTraceMetaFromSlotResponses` + `CMS_SLOT_TYPES` 顺序 |
| PAGE_NOT_FOUND 聚合 | `pageNotFound` + Task 3 单次 toast |
| 停用整页接口 | Task 3 删除 `fetchHomePage` |
| 新页复用 loader | File map 与 `fetchPublishedSlotsForPage` 公共导出 |

**2. Placeholder scan** — 无 TBD；`40401` 已写明可对联调修正。

**3. 一致性** — `fetchPublishedSlotsForPage` 返回的 `slots` 形状与旧 `page.slots` 一致，供 `processSlots` 使用。

---

**Plan complete and saved to `TrendyCollectionApp/docs/superpowers/plans/2026-04-09-trendycollectionapp-per-slot-cms-fetch.md`. Two execution options:**

**1. Subagent-Driven (recommended)** — 每任务派生子代理，任务间评审，迭代快  

**2. Inline Execution** — 本会话用 executing-plans 按检查点批量执行  

**Which approach?**
