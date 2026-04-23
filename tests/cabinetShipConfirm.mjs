import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { findDefaultAddress } from '../utils/cabinetShipConfirm.js'

describe('cabinetShipConfirm', () => {
  it('returns null for non-array', () => {
    assert.equal(findDefaultAddress(null), null)
    assert.equal(findDefaultAddress(undefined), null)
  })

  it('returns first entry with isDefault true', () => {
    const list = [
      { id: '1', isDefault: false },
      { id: '2', isDefault: true, receiverName: 'A' },
      { id: '3', isDefault: true, receiverName: 'B' }
    ]
    assert.equal(findDefaultAddress(list)?.id, '2')
  })

  it('returns null when no default', () => {
    assert.equal(findDefaultAddress([{ id: '1', isDefault: false }]), null)
  })
})
