import test from 'node:test'
import assert from 'node:assert/strict'
import { pickActivityType } from '../utils/activityCardCommon.js'

test('pickActivityType prefers activity_type snake', () => {
  assert.equal(
    pickActivityType({ activity_type: 'ICHIBAN', activityType: 'CARD' }),
    'ICHIBAN'
  )
})

test('pickActivityType falls back to activityType', () => {
  assert.equal(pickActivityType({ activityType: ' UNLIMITED ' }), 'UNLIMITED')
})

test('pickActivityType empty when missing', () => {
  assert.equal(pickActivityType({}), '')
  assert.equal(pickActivityType(null), '')
})
