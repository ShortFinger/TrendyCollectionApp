# 活动卡默认跳转与类型落地页 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 按 spec `docs/superpowers/specs/2026-04-13-activity-landing-pages-by-type-design.md` 实现活动卡默认按 `activityType` 跳转（ICHIBAN/UNLIMITED→赏柜、CARD→抽卡机页、其它→other 落地页）、CMS 自定义 `jumpUrl` 优先；落地页与抽卡机页用 `display-batch` 拉详情并做 canonical `redirectTo` 纠正；补全 `pages.json` 与节点测试。

**Architecture:** 在 `activityCardCommon.js` 中集中实现 **`defaultActivityLandingUrl(activityId, activityType)`** 与 **`buildActivityJump`** 复用，避免父页面分叉。新增 **`fetchActivityDisplayBatch`**（`request` + `API_BASE.order`）与 **`ensureCanonicalActivityRoute`**（比较当前页与 canonical URL，不一致则 `redirectTo`）。`pages/activity/other/index` 与 `pages/card/index` 共用同一套「读 query → 请求 → 纠正 → 渲染/不可用态 → 主 CTA」逻辑，可抽 **`composables/useActivityDisplayPage.js`** 或单文件 **`utils/activityDisplayPage.js`** 减少重复。将 **`openInternalUrl`** 从首页/分类抽到 **`utils/openInternalUrl.js`**，供落地页「去赏柜」与全站一致。

**Tech Stack:** uni-app (Vue 3)、现有 `utils/request.js`（`API_BASE.order`）、Node `node:test`（`tests/*.mjs`）。

---

## File map

| 文件 | 职责 |
|------|------|
| `utils/activityCardCommon.js` | `defaultActivityLandingUrl`、`buildActivityJump` 默认表 |
| `utils/activityDisplayApi.js`（新建） | `POST /activities/display-batch`，解析 `data` 数组 |
| `utils/activityRouteCanonical.js`（新建） | `ensureCanonicalActivityRoute` + path 归一化 |
| `utils/openInternalUrl.js`（新建） | `TAB_PATHS`、`openInternalUrl`（从首页/分类迁出） |
| `composables/useActivityDisplayPage.js`（新建，可选） | onLoad 拉数、纠正、状态机 |
| `pages/activity/other/index.vue`（新建） | 其它类型落地 + 去赏柜 CTA |
| `pages/card/index.vue`（新建） | 抽卡机壳 + display-batch |
| `pages/index/index.vue`、`pages/category/index.vue` | 改为 import `openInternalUrl` |
| `pages.json` | 注册 `pages/card/index`、`pages/activity/other/index` |
| `tests/activityCardCommon.test.mjs` | 覆盖默认跳转表与 CMS 覆盖 |

---

### Task 1: 默认跳转 URL 与 `buildActivityJump`

**Files:**
- Modify: `TrendyCollectionApp/utils/activityCardCommon.js`
- Test: `TrendyCollectionApp/tests/activityCardCommon.test.mjs`

- [ ] **Step 1: 写失败单测（新导出与默认表）**

在 `activityCardCommon.test.mjs` 增加对 **`buildActivityJump`** 与 **`defaultActivityLandingUrl`**（若本步一并导出）的断言：

```javascript
import test from 'node:test'
import assert from 'node:assert/strict'
import {
  buildActivityJump,
  defaultActivityLandingUrl
} from '../utils/activityCardCommon.js'

test('defaultActivityLandingUrl: ICHIBAN and UNLIMITED -> ichibanKuji', () => {
  const id = 'a1'
  assert.match(defaultActivityLandingUrl(id, 'ICHIBAN'), /ichibanKuji.*activityId/)
  assert.match(defaultActivityLandingUrl(id, 'UNLIMITED'), /ichibanKuji.*activityId/)
})

test('defaultActivityLandingUrl: CARD -> card index', () => {
  assert.match(
    defaultActivityLandingUrl('x', 'CARD'),
    /^\/pages\/card\/index\?activityId=/
  )
})

test('defaultActivityLandingUrl: other enums -> other landing', () => {
  assert.match(
    defaultActivityLandingUrl('y', 'LUCKY_BAG'),
    /^\/pages\/activity\/other\/index\?activityId=/
  )
})

test('defaultActivityLandingUrl: unknown type -> other landing', () => {
  assert.match(
    defaultActivityLandingUrl('z', 'WEIRD'),
    /^\/pages\/activity\/other\/index\?activityId=/
  )
})

test('buildActivityJump: custom payload jumpUrl wins', () => {
  const r = buildActivityJump('id', 'CARD', 'page', '/pages/custom/foo')
  assert.equal(r.jumpUrl, '/pages/custom/foo')
})

test('buildActivityJump: no payload uses defaultActivityLandingUrl', () => {
  const r = buildActivityJump('aid', 'CARD', '', '')
  assert.equal(r.jumpUrl, defaultActivityLandingUrl('aid', 'CARD'))
})
```

- [ ] **Step 2: 运行测试（应失败）**

```bash
cd TrendyCollectionApp && node --test tests/activityCardCommon.test.mjs
```

Expected: `FAIL` — `defaultActivityLandingUrl` 未导出或未定义。

- [ ] **Step 3: 最小实现**

在 `activityCardCommon.js` 中：

1. 新增并导出 **`defaultActivityLandingUrl(activityId, activityType)`**：  
   - `pickString(activityType)` 得到 `typeStr`。  
   - 若 `typeStr === 'CARD'` → `` `/pages/card/index?activityId=${encodeURIComponent(activityId)}` ``。  
   - 若 `typeStr === 'ICHIBAN' || typeStr === 'UNLIMITED'` → `` `/pages/ichibanKuji/index?activityId=${encodeURIComponent(activityId)}` ``。  
   - **否则**（含空、未知枚举名）→ `` `/pages/activity/other/index?activityId=${encodeURIComponent(activityId)}` ``。

2. 重写 **`buildActivityJump`**：在 **`pickString(payloadJumpUrl)` 非空** 时保持现有返回 `{ jumpType: jt, jumpUrl: ju }`；否则 `return { jumpType: 'page', jumpUrl: defaultActivityLandingUrl(activityId, pickString(activityType)) }`（删除原先「全部落 ichiban」的 fallback）。

- [ ] **Step 4: 运行测试（应通过）**

```bash
cd TrendyCollectionApp && node --test tests/activityCardCommon.test.mjs
```

Expected: **PASS**

- [ ] **Step 5: Commit**

```bash
git add TrendyCollectionApp/utils/activityCardCommon.js TrendyCollectionApp/tests/activityCardCommon.test.mjs
git commit -m "feat(activity): default landing URLs by activity type"
```

---

### Task 2: `display-batch` API 封装

**Files:**
- Create: `TrendyCollectionApp/utils/activityDisplayApi.js`

- [ ] **Step 1: 新增 `fetchActivityDisplayBatch(ids)`**

```javascript
import { request, API_BASE } from './request.js'

/**
 * @param {string[]} ids 非空、长度建议 ≤ 50
 * @returns {Promise<object[]>} ActivityDisplayVO 列表（与后端 Result.data 一致）
 */
export async function fetchActivityDisplayBatch(ids) {
  if (!Array.isArray(ids) || ids.length === 0) return []
  const data = await request({
    base: API_BASE.order,
    url: '/activities/display-batch',
    method: 'POST',
    data: { ids }
  })
  return Array.isArray(data) ? data : []
}
```

- [ ] **Step 2: 新增 `fetchActivityDisplayById(activityId)`**

```javascript
export async function fetchActivityDisplayById(activityId) {
  const id = String(activityId ?? '').trim()
  if (!id) return null
  const list = await fetchActivityDisplayBatch([id])
  return list.find((x) => x && String(x.id ?? '').trim() === id) ?? null
}
```

- [ ] **Step 3: Commit**

```bash
git add TrendyCollectionApp/utils/activityDisplayApi.js
git commit -m "feat(api): fetch activity display-batch from Order client-api"
```

---

### Task 3: Canonical 路由纠正

**Files:**
- Create: `TrendyCollectionApp/utils/activityRouteCanonical.js`
- Modify: `TrendyCollectionApp/utils/activityCardCommon.js`（仅 import 路径工具若需要）

- [ ] **Step 1: 实现 `pathOnly` / 与 canonical 比较**

在 `activityRouteCanonical.js` 中：

1. 从 `activityCardCommon.js` **import** `defaultActivityLandingUrl`。
2. 实现 **`normalizeUniRoute(route)`**：将 `getCurrentPages()` 最后一页的 `route`（如 `pages/card/index`）转为 **`/pages/card/index`**（前导 `/`）。
3. 实现 **`ensureCanonicalActivityRoute(activityId, activityType)`**：  
   - `canonicalUrl = defaultActivityLandingUrl(activityId, activityType)`（含 query）。  
   - `canonicalPath = pathOnly(canonicalUrl)`（`?` 前）。  
   - 当前页 `const pages = getCurrentPages()`；若空 return `true`。  
   - `currentPath = normalizeUniRoute(pages[pages.length - 1].route)`。  
   - 若 **`currentPath !== canonicalPath`**：`uni.redirectTo({ url: canonicalUrl })`，return **`false`**。  
   - 否则 return **`true`**。

`pathOnly` 可本地复制 5 行（与首页一致），避免循环依赖。

- [ ] **Step 2: Commit**

```bash
git add TrendyCollectionApp/utils/activityRouteCanonical.js
git commit -m "feat(nav): redirect to canonical activity route when mismatched"
```

---

### Task 4: 抽出 `openInternalUrl`

**Files:**
- Create: `TrendyCollectionApp/utils/openInternalUrl.js`
- Modify: `TrendyCollectionApp/pages/index/index.vue`
- Modify: `TrendyCollectionApp/pages/category/index.vue`

- [ ] **Step 1: 新建 `openInternalUrl.js`**

从 **`pages/index/index.vue`** 剪切 **`TAB_PATHS`、`pathOnly`、`withLeadingSlash`、`openInternalUrl`** 至：

`TrendyCollectionApp/utils/openInternalUrl.js`，并 **export** `TAB_PATHS`、`openInternalUrl`（若 `pathOnly` 仅内部使用可不导出）。

- [ ] **Step 2: 首页与分类页改为 import**

```javascript
import { openInternalUrl } from '@/utils/openInternalUrl.js'
```

删除页内重复定义。

- [ ] **Step 3: 开发者工具跑一次编译**

在 HBuilderX / CLI 下确保无未定义引用。

- [ ] **Step 4: Commit**

```bash
git add TrendyCollectionApp/utils/openInternalUrl.js TrendyCollectionApp/pages/index/index.vue TrendyCollectionApp/pages/category/index.vue
git commit -m "refactor(nav): extract openInternalUrl to utils"
```

---

### Task 5: 注册页面 `pages.json`

**Files:**
- Modify: `TrendyCollectionApp/pages.json`

- [ ] **Step 1: 在 `pages` 数组中 `ichibanKuji` 之后（或合适位置）加入：**

```json
{
  "path": "pages/card/index",
  "style": {
    "navigationBarTitleText": "抽卡机"
  }
},
{
  "path": "pages/activity/other/index",
  "style": {
    "navigationBarTitleText": "活动详情"
  }
}
```

（标题可按产品微调。）

- [ ] **Step 2: Commit**

```bash
git add TrendyCollectionApp/pages.json
git commit -m "chore(pages): register card and activity other landing"
```

---

### Task 6: 落地页 `pages/activity/other/index.vue`

**Files:**
- Create: `TrendyCollectionApp/pages/activity/other/index.vue`

- [ ] **Step 1: 页面逻辑（与 spec 对齐）**

1. **`onLoad(query)`**：读 **`activityId`**；若无则 toast + `uni.navigateBack`。
2. **`fetchActivityDisplayById`**；loading 状态。
3. 若有 VO：先 **`ensureCanonicalActivityRoute(activityId, vo.activityType)`**；若返回 **`false`**（已 `redirectTo`）则 **不再**继续渲染本页。
4. 若 **`vo.status !== 'ON_SHELF'`** 或 **无 VO**：展示 **不可用态**（文案统一），**不**展示主 CTA 或禁用。
5. 若可用：展示封面（`squareThumb` / `longThumb`）、标题、`activityTypeCn`、价格（`formatMoneyPrice`）、简短描述（若 VO 有字段则展示，否则省略）。
6. 底部主按钮「去赏柜」：`openInternalUrl(\`/pages/ichibanKuji/index?activityId=${encodeURIComponent(activityId)}\`)`。

样式：白底、与小程序现有卡片/列表风格协调即可（不必与 ichiban 静态页像素级一致）。

- [ ] **Step 2: Commit**

```bash
git add TrendyCollectionApp/pages/activity/other/index.vue
git commit -m "feat(pages): activity other-type landing with display-batch"
```

---

### Task 7: 抽卡机壳 `pages/card/index.vue`

**Files:**
- Create: `TrendyCollectionApp/pages/card/index.vue`

- [ ] **Step 1: 与 Task 6 相同管线**

1. `onLoad` → `activityId`  
2. `fetchActivityDisplayById`  
3. **`ensureCanonicalActivityRoute`**（CARD 应落在 `/pages/card/index`；若 VO 为 ICHIBAN 会纠正到赏柜）  
4. 不可用态同 spec  
5. 可用态：展示与 **Task 6** 类似的头部信息；主 CTA 可先 **占位**（如「开始抽卡」）toast「玩法接入中」或 **暂不绑定路由**（spec 未锁死）；**禁止**误跳到赏柜除非产品要求。

- [ ] **Step 2: Commit**

```bash
git add TrendyCollectionApp/pages/card/index.vue
git commit -m "feat(pages): card activity shell with display-batch"
```

---

### Task 8: 回归与文档

- [ ] **Step 1: 手测清单（对照 spec 验收）**

1. 首页/分类：**无** CMS 自定义 URL 的 **CARD** 卡 → `navigateTo` `/pages/card/index?...`  
2. **LUCKY_BAG**（或其它非 ICHI/CARD）→ `/pages/activity/other/index`  
3. **ICHIBAN / UNLIMITED** → `reLaunch` 赏柜带参（tab）  
4. CMS **自定义 jumpUrl** → 仍直达配置页，**不**进 other/card  
5. 深链：`other` 页 + ICHIBAN id → `redirectTo` 赏柜  

- [ ] **Step 2: 在 spec 文件脚注「实现计划」链接（可选）**

在 `2026-04-13-activity-landing-pages-by-type-design.md` 末尾增加一行指向本 plan（若团队惯例）。

---

## Self-review（计划自检）

| Spec 条款 | 对应 Task |
|-----------|-----------|
| 默认跳转表（ICHIBAN/UNLIMITED/CARD/其它） | Task 1 |
| CMS `payload.jumpUrl` 优先 | Task 1 `buildActivityJump` |
| `display-batch` + `ON_SHELF` / 不可用态 | Task 2, 6, 7 |
| canonical `redirectTo` | Task 3, 6, 7 |
| other 落地「去赏柜」`openInternalUrl` | Task 4, 6 |
| `pages.json` 注册 card + other | Task 5 |
| 不含 unlimited 独立页 | Task 1 默认表 + Task 5 无 unlimited 路径 |

**占位符扫描：** 本计划无 TBD；主 CTA 文案在 Task 7 已给出占位策略。

---

**Plan complete and saved to `TrendyCollectionApp/docs/superpowers/plans/2026-04-13-activity-landing-pages-by-type.md`. Two execution options:**

**1. Subagent-Driven (recommended)** — 每 Task 派生子代理，任务间人工/简短复核  

**2. Inline Execution** — 本会话用 executing-plans 按 Task 连续执行并设检查点  

**Which approach?**
