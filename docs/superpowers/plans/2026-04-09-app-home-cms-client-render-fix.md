# 首页 CMS 客户端渲染缺口修复 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在单槽已成功返回数据的前提下，消除「有条目却不渲染」的常见客户端原因：`payload` 为 JSON 字符串、开发态缺少诊断信息；并在不改生产 UX 的前提下满足 [`2026-04-09-app-home-cms-client-render-gap-design.md`](../specs/2026-04-09-app-home-cms-client-render-gap-design.md) §4 B/C 与 §5。

**Architecture:** 抽出可单测的 **`cmsPayloadShape.js`**（`isRenderablePayload` + `coercePayloadForRender` + `normalizeCmsItemPayload`），首页 `normalizePayloadForRender` 与 **`mergeActivityCards.js`** 共用 coerce；新增 **`cmsHomeRenderDiagnostics.js`** 在 **仅 development** 下对比 `slots` 与 `iconList`/`cards` 长度并输出结构化 `console.warn`。活动槽目标解析从 `mergeActivityCards` **导出** 供诊断复用，避免复制 `resolveTargetSlot`。

**Tech Stack:** uni-app / Vue 3、`node:test`（`TrendyCollectionApp/tests/*.test.mjs`）

---

## File map

| File | Role |
|------|------|
| `TrendyCollectionApp/utils/cmsPayloadShape.js` | **Create** — 纯函数：可渲染判断、字符串 JSON 一次解析、统一规范化入口 |
| `TrendyCollectionApp/tests/cmsPayloadShape.test.mjs` | **Create** — 覆盖字符串/对象/非法 JSON |
| `TrendyCollectionApp/utils/mergeActivityCards.js` | **Modify** — 导出 `resolveActivityCardTargetSlot`；循环内对 `payload` 做 coerce |
| `TrendyCollectionApp/utils/cmsHomeRenderDiagnostics.js` | **Create** — `diagnoseIconGridSlot`、`diagnoseActivityCardSkips`、`logCmsHomeRenderDiagnostics` |
| `TrendyCollectionApp/tests/cmsHomeRenderDiagnostics.test.mjs` | **Create** — 纯诊断函数与跳过计数 |
| `TrendyCollectionApp/pages/index/index.vue` | **Modify** — 使用 `normalizeCmsItemPayload`；`loadHomeData` 末尾 development 诊断日志 |

---

### Task 1: `cmsPayloadShape.js` 与单元测试

**Files:**
- Create: `TrendyCollectionApp/utils/cmsPayloadShape.js`
- Create: `TrendyCollectionApp/tests/cmsPayloadShape.test.mjs`

- [ ] **Step 1: 新建 `cmsPayloadShape.js`**

```javascript
/**
 * CMS 条目 payload 是否可直接用于渲染（对象或数组）。
 */
export function isRenderablePayload(payload) {
  return (
    payload != null &&
    (Array.isArray(payload) ||
      Object.prototype.toString.call(payload) === '[object Object]')
  )
}

/**
 * 将 payload 规范为可渲染形态：已是对象/数组则原样返回；
 * 为非空字符串时尝试 JSON.parse 一次，解析结果为对象/数组则返回解析值，否则返回原值。
 */
export function coercePayloadForRender(raw) {
  if (raw == null) return raw
  if (isRenderablePayload(raw)) return raw
  if (typeof raw === 'string') {
    const t = raw.trim()
    if (!t) return raw
    try {
      const p = JSON.parse(t)
      return isRenderablePayload(p) ? p : raw
    } catch {
      return raw
    }
  }
  return raw
}

/**
 * @param {{ payload?: unknown } | null | undefined} item
 * @param {Record<string, unknown>} ctx 传给 reportInvalid
 * @param {(ctx: Record<string, unknown>, raw: unknown) => void} [reportInvalid]
 */
export function normalizeCmsItemPayload(item, ctx = {}, reportInvalid) {
  const raw = item?.payload
  const payload = coercePayloadForRender(raw)
  if (isRenderablePayload(payload)) return payload
  if (typeof reportInvalid === 'function') reportInvalid(ctx, raw)
  return null
}
```

- [ ] **Step 2: 编写 `cmsPayloadShape.test.mjs`**

```javascript
import test from 'node:test'
import assert from 'node:assert/strict'
import {
  isRenderablePayload,
  coercePayloadForRender,
  normalizeCmsItemPayload
} from '../utils/cmsPayloadShape.js'

test('isRenderablePayload: 对象与数组为 true', () => {
  assert.equal(isRenderablePayload({ a: 1 }), true)
  assert.equal(isRenderablePayload([1]), true)
})

test('isRenderablePayload: 字符串与数字为 false', () => {
  assert.equal(isRenderablePayload('{"a":1}'), false)
  assert.equal(isRenderablePayload(1), false)
})

test('coercePayloadForRender: JSON 字符串解析为对象', () => {
  const o = coercePayloadForRender('{"placeholder":"x"}')
  assert.deepEqual(o, { placeholder: 'x' })
})

test('coercePayloadForRender: 非法 JSON 保持原字符串', () => {
  const s = '{'
  assert.strictEqual(coercePayloadForRender(s), s)
})

test('normalizeCmsItemPayload: 解析后返回对象', () => {
  const r = normalizeCmsItemPayload({ payload: '{"a":1}' })
  assert.deepEqual(r, { a: 1 })
})

test('normalizeCmsItemPayload: 不可渲染时调用 reportInvalid', () => {
  let called = 0
  const r = normalizeCmsItemPayload({ payload: 'noop' }, { k: 1 }, () => {
    called++
  })
  assert.strictEqual(r, null)
  assert.equal(called, 1)
})
```

- [ ] **Step 3: 运行测试**

Run:

```bash
cd /Users/lssss/project/TrendyCollection/TrendyCollectionApp && node --test tests/cmsPayloadShape.test.mjs
```

Expected: 全部 `pass`。

- [ ] **Step 4: Commit**

```bash
cd /Users/lssss/project/TrendyCollection/TrendyCollectionApp
git add utils/cmsPayloadShape.js tests/cmsPayloadShape.test.mjs
git commit -m "feat(app): cmsPayloadShape helpers and node tests"
```

---

### Task 2: 导出活动槽解析并在合并中使用 coerce

**Files:**
- Modify: `TrendyCollectionApp/utils/mergeActivityCards.js`

- [ ] **Step 1: 将 `resolveTargetSlot` 重命名为导出函数**

把原 `function resolveTargetSlot(slots)` 改为：

```javascript
export function resolveActivityCardTargetSlot(slots) {
  if (slots == null || typeof slots !== 'object' || Array.isArray(slots)) {
    return null
  }
  const direct = slots[SLOT_TYPE]
  if (direct?.items?.length) return direct
  for (const slot of Object.values(slots)) {
    if ((slot?.items || []).some((i) => i.contentType === CONTENT_TYPE)) {
      return slot
    }
  }
  return null
}
```

在 `mergeActivityCardItems` 内将 `resolveTargetSlot(slots)` 替换为 `resolveActivityCardTargetSlot(slots)`。

- [ ] **Step 2: 文件顶部增加 import**

```javascript
import { coercePayloadForRender, isRenderablePayload } from './cmsPayloadShape.js'
```

- [ ] **Step 3: 替换循环内 payload 处理**

将：

```javascript
    if (it.contentType !== CONTENT_TYPE || !it.payload) continue
    const payload = it.payload
    if (Array.isArray(payload) || Object.prototype.toString.call(payload) !== '[object Object]') {
      continue
    }
```

替换为：

```javascript
    if (it.contentType !== CONTENT_TYPE) continue
    const rawPayload = it.payload
    if (rawPayload == null) continue
    const payload = coercePayloadForRender(rawPayload)
    if (!isRenderablePayload(payload) || Array.isArray(payload)) continue
    if (Object.prototype.toString.call(payload) !== '[object Object]') continue
```

- [ ] **Step 4: Commit**

```bash
cd /Users/lssss/project/TrendyCollection/TrendyCollectionApp
git add utils/mergeActivityCards.js
git commit -m "fix(app): coerce activity card payload JSON strings in merge"
```

---

### Task 3: 首页接入 `normalizeCmsItemPayload`

**Files:**
- Modify: `TrendyCollectionApp/pages/index/index.vue`

- [ ] **Step 1: 增加 import**

```javascript
import {
  isRenderablePayload,
  normalizeCmsItemPayload
} from '@/utils/cmsPayloadShape.js'
```

- [ ] **Step 2: 删除本地 `isRenderablePayload` 定义，保留 `reportPayloadError`**

将 `normalizePayloadForRender` 改为：

```javascript
const normalizePayloadForRender = (item, ctx = {}) => {
  return normalizeCmsItemPayload(item, ctx, (c, p) => reportPayloadError(c, p))
}
```

- [ ] **Step 3: 重写 `devAssertNormalizePayload`（覆盖 spec C：JSON 字符串）**

```javascript
const devAssertNormalizePayload = () => {
  const okObj = normalizePayloadForRender({ payload: { a: 1 } })
  const okArr = normalizePayloadForRender({ payload: [{ a: 1 }] })
  const okFromJsonString = normalizePayloadForRender({ payload: '{"a":1}' })
  if (
    !okObj ||
    !okArr ||
    typeof okFromJsonString !== 'object' ||
    okFromJsonString.a !== 1
  ) {
    throw new Error('normalizePayloadForRender contract failed')
  }
  if (isRenderablePayload('{"a":1}') !== false) {
    throw new Error('normalizePayloadForRender contract failed')
  }
}
```

（无效 JSON 字符串行为由 `tests/cmsPayloadShape.test.mjs` 覆盖，避免在 dev 断言里触发 `reportPayloadError` 副作用。）

- [ ] **Step 4: Commit**

```bash
cd /Users/lssss/project/TrendyCollection/TrendyCollectionApp
git add pages/index/index.vue
git commit -m "refactor(app): home CMS normalize uses cmsPayloadShape"
```

---

### Task 4: `cmsHomeRenderDiagnostics.js` 与测试

**Files:**
- Create: `TrendyCollectionApp/utils/cmsHomeRenderDiagnostics.js`
- Create: `TrendyCollectionApp/tests/cmsHomeRenderDiagnostics.test.mjs`

- [ ] **Step 1: 新建 `cmsHomeRenderDiagnostics.js`**

```javascript
import {
  CONTENT_TYPE_ICON_ENTRY,
  CONTENT_TYPE_ACTIVITY_CARD_REF,
  filterItemsWithContentType
} from './cmsSlotContentTypes.js'
import {
  coercePayloadForRender,
  isRenderablePayload
} from './cmsPayloadShape.js'
import { resolveActivityCardTargetSlot } from './mergeActivityCards.js'

/**
 * @param {{ items?: Array<unknown> } | null | undefined} slot
 */
export function diagnoseIconGridSlot(slot) {
  const items = slot?.items ?? []
  const iconEntries = filterItemsWithContentType(
    items,
    CONTENT_TYPE_ICON_ENTRY
  )
  let renderablePayloadCount = 0
  for (const item of iconEntries) {
    const p = coercePayloadForRender(item?.payload)
    if (isRenderablePayload(p)) renderablePayloadCount++
  }
  return {
    itemCount: items.length,
    iconEntryCount: iconEntries.length,
    renderablePayloadCount
  }
}

/**
 * @param {{ items?: Array<{ contentType?: string, payload?: unknown, activityDisplay?: { status?: string } }> } | null | undefined} targetSlot
 */
export function diagnoseActivityCardSkips(targetSlot) {
  const items = targetSlot?.items ?? []
  const stats = {
    itemCount: items.length,
    wrongContentType: 0,
    nullPayload: 0,
    badPayloadShape: 0,
    missingActivityId: 0,
    notOnShelfOrNoDisplay: 0,
    wouldRender: 0
  }
  const sorted = [...items].sort(
    (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
  )
  for (const it of sorted) {
    if (it.contentType !== CONTENT_TYPE_ACTIVITY_CARD_REF) {
      stats.wrongContentType++
      continue
    }
    const raw = it.payload
    if (raw == null) {
      stats.nullPayload++
      continue
    }
    const payload = coercePayloadForRender(raw)
    if (
      !isRenderablePayload(payload) ||
      Array.isArray(payload) ||
      Object.prototype.toString.call(payload) !== '[object Object]'
    ) {
      stats.badPayloadShape++
      continue
    }
    const activityId = String(payload.activityId ?? '').trim()
    if (!activityId) {
      stats.missingActivityId++
      continue
    }
    const act = it.activityDisplay
    const status = act != null ? String(act.status ?? '').trim() : ''
    if (!act || status !== 'ON_SHELF') {
      stats.notOnShelfOrNoDisplay++
      continue
    }
    stats.wouldRender++
  }
  return stats
}

/**
 * @param {Record<string, unknown>} slots 与 loadHomeData 传入 processSlots 的同一对象
 * @param {number} iconListLen `iconList.value.length`
 * @param {number} cardsLen `cards.value.length`
 */
export function logCmsHomeRenderDiagnostics(slots, iconListLen, cardsLen) {
  if (process.env.NODE_ENV !== 'development') return
  const ig = slots?.icon_grid
  if (ig && ig.items && ig.items.length > 0 && iconListLen === 0) {
    console.warn(
      '[cms-home] icon_grid has items but iconList is empty',
      diagnoseIconGridSlot(ig)
    )
  }
  const target = resolveActivityCardTargetSlot(slots)
  if (
    target &&
    target.items &&
    target.items.length > 0 &&
    cardsLen === 0
  ) {
    console.warn(
      '[cms-home] activity slot has items but cards is empty',
      diagnoseActivityCardSkips(target)
    )
  }
}
```

- [ ] **Step 2: 新建 `cmsHomeRenderDiagnostics.test.mjs`**

```javascript
import test from 'node:test'
import assert from 'node:assert/strict'
import {
  diagnoseIconGridSlot,
  diagnoseActivityCardSkips
} from '../utils/cmsHomeRenderDiagnostics.js'

test('diagnoseIconGridSlot: JSON 字符串条目计入 renderable', () => {
  const slot = {
    items: [
      {
        contentType: 'icon_entry',
        sortOrder: 0,
        payload: '{"label":"a","icon":"📦","link":"/x"}'
      }
    ]
  }
  const d = diagnoseIconGridSlot(slot)
  assert.equal(d.iconEntryCount, 1)
  assert.equal(d.renderablePayloadCount, 1)
})

test('diagnoseActivityCardSkips: 统计 notOnShelfOrNoDisplay', () => {
  const target = {
    items: [
      {
        contentType: 'activity_card_ref',
        sortOrder: 0,
        payload: { activityId: '1' },
        activityDisplay: { status: 'DRAFT' }
      }
    ]
  }
  const s = diagnoseActivityCardSkips(target)
  assert.equal(s.notOnShelfOrNoDisplay, 1)
  assert.equal(s.wouldRender, 0)
})
```

- [ ] **Step 3: 运行测试**

```bash
cd /Users/lssss/project/TrendyCollection/TrendyCollectionApp && node --test tests/cmsPayloadShape.test.mjs tests/cmsHomeRenderDiagnostics.test.mjs
```

Expected: 全部 `pass`。

- [ ] **Step 4: Commit**

```bash
cd /Users/lssss/project/TrendyCollection/TrendyCollectionApp
git add utils/cmsHomeRenderDiagnostics.js tests/cmsHomeRenderDiagnostics.test.mjs
git commit -m "feat(app): CMS home render diagnostics for development"
```

---

### Task 5: `loadHomeData` 调用诊断日志

**Files:**
- Modify: `TrendyCollectionApp/pages/index/index.vue`

- [ ] **Step 1: import 诊断函数**

```javascript
import { logCmsHomeRenderDiagnostics } from '@/utils/cmsHomeRenderDiagnostics.js'
```

- [ ] **Step 2: 在 `await processSlots(slots)` 之后插入**

```javascript
        await processSlots(slots)
        logCmsHomeRenderDiagnostics(
          slots,
          iconList.value.length,
          cards.value.length
        )
```

（保持与现有 toast 分支顺序一致：先 `processSlots`，再记录诊断，再执行 `errors` 相关 toast。）

- [ ] **Step 3: Commit**

```bash
cd /Users/lssss/project/TrendyCollection/TrendyCollectionApp
git add pages/index/index.vue
git commit -m "chore(app): dev-only CMS home render diagnostics log"
```

---

### Task 6: 全量 Node 测试与手工验收

- [ ] **Step 1: 运行 App 侧相关 tests**

```bash
cd /Users/lssss/project/TrendyCollection/TrendyCollectionApp && node --test tests/cmsPayloadShape.test.mjs tests/cmsHomeRenderDiagnostics.test.mjs tests/cmsSlotLoader-cache.test.mjs
```

Expected: 全部 `pass`（若仓库中另有 `tests/*.test.mjs`，可一并运行 `node --test tests/`）。

- [ ] **Step 2: 手工验收（对照 design spec §3 / §5）**

1. 开发者工具打开小程序 **development** 构建，加载首页；
2. 若仍为空态，确认控制台出现 `[cms-home]` 警告及 `diagnose*` 对象（用于定位 `icon_entry` / `activity_card_ref` / `ON_SHELF` 等）；
3. 若 `payload` 为 JSON 字符串，确认宫格与活动卡片在 coerce 后能渲染。

- [ ] **Step 3: Commit（仅在有未提交变更时）**

若 Step 1～2 仅有验证、无文件变更，可跳过；若有文档或微调，单独 commit。

---

## Plan self-review

**1. Spec coverage**

| Spec 段落 | 对应 Task |
|-----------|-----------|
| §2 payload 字符串 | Task 1–3、Task 2 merge |
| §4 B 开发态可观测 | Task 4–5 |
| §4 C 兼容 JSON 字符串 | Task 1–3、Task 2 |
| §5 验收 | Task 6 |

§4 A（运营/目录对齐）仍为流程项：Plan 不提供代码，由联调在 Step 2 对照 `contentType`。

**2. Placeholder scan**

无 TBD；各 Step 含完整片段与命令。

**3. Type / naming**

- `resolveActivityCardTargetSlot` 在 `mergeActivityCards.js` 导出，与 `logCmsHomeRenderDiagnostics` 引用一致。
- `diagnoseActivityCardSkips` 与 `mergeActivityCardItems` 循环条件保持一致（含 `coercePayloadForRender`）。

---

**Plan complete and saved to `TrendyCollectionApp/docs/superpowers/plans/2026-04-09-app-home-cms-client-render-fix.md`. Two execution options:**

**1. Subagent-Driven (recommended)** — 每个 Task 派生子代理，Task 间人工快速过一眼。

**2. Inline Execution** — 在本会话用 executing-plans 按检查点批量做完。

**Which approach?**
