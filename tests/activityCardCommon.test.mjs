import test from 'node:test'
import assert from 'node:assert/strict'
import {
  pickActivityType,
  buildActivityJump,
  defaultActivityLandingUrl
} from '../utils/activityCardCommon.js'

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
