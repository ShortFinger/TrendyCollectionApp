import test from 'node:test'
import assert from 'node:assert/strict'
import { collectInCabinetAssetIds } from '../utils/cabinetSelection.js'

test('collectInCabinetAssetIds stringifies and filters status', () => {
  const list = [
    { assetId: 1, assetStatus: 'IN_CABINET' },
    { assetId: 2, assetStatus: 'SHIPPED' },
    { assetId: 'x', assetStatus: 'IN_CABINET' }
  ]
  assert.deepEqual(collectInCabinetAssetIds(list), ['1', 'x'])
})

test('collectInCabinetAssetIds empty and non-array', () => {
  assert.deepEqual(collectInCabinetAssetIds([]), [])
  assert.deepEqual(collectInCabinetAssetIds(null), [])
})
