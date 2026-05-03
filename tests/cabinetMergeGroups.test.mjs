import test from 'node:test'
import assert from 'node:assert/strict'
import {
  buildCabinetDisplayRows,
  groupAllSelected,
  groupHasSelection
} from '../utils/cabinetMergeGroups.js'

function asset(overrides) {
  return {
    assetId: 'a1',
    skuId: 's1',
    skuName: 'SKU',
    orderId: 'o1',
    assetStatus: 'IN_CABINET',
    createTime: '2026-05-01 10:00:00',
    recyclePrice: 10,
    ...overrides
  }
}

test('buildCabinetDisplayRows merges same orderId + skuId when all IN_CABINET', () => {
  const rows = buildCabinetDisplayRows(
    [
      asset({ assetId: 'a1', createTime: '2026-05-01 10:00:00' }),
      asset({ assetId: 'a2', createTime: '2026-05-01 11:00:00' })
    ],
    'IN_CABINET'
  )
  assert.equal(rows.length, 1)
  assert.equal(rows[0].type, 'group')
  assert.equal(rows[0].members.length, 2)
  assert.equal(rows[0].representative.assetId, 'a1')
})

test('missing orderId => single rows', () => {
  const rows = buildCabinetDisplayRows(
    [
      asset({ assetId: 'x1', orderId: '' }),
      asset({ assetId: 'x2', orderId: '' })
    ],
    'IN_CABINET'
  )
  assert.equal(rows.length, 2)
  assert.ok(rows.every((r) => r.type === 'single'))
})

test('mixed assetStatus in same key => no merge', () => {
  const rows = buildCabinetDisplayRows(
    [
      asset({ assetId: 'b1', assetStatus: 'IN_CABINET' }),
      asset({ assetId: 'b2', assetStatus: 'SHIP_APPLYING' })
    ],
    'IN_CABINET'
  )
  assert.equal(rows.length, 2)
})

test('single item with full key stays single', () => {
  const rows = buildCabinetDisplayRows([asset({ assetId: 'only' })], 'IN_CABINET')
  assert.equal(rows.length, 1)
  assert.equal(rows[0].type, 'single')
})

test('groupHasSelection / groupAllSelected', () => {
  const members = [asset({ assetId: 'm1' }), asset({ assetId: 'm2' })]
  assert.equal(groupHasSelection(members, { m1: true }), true)
  assert.equal(groupAllSelected(members, { m1: true }), false)
  assert.equal(groupAllSelected(members, { m1: true, m2: true }), true)
})
