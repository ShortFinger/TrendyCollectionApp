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
