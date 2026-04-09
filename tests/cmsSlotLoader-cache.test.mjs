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
