import test from 'node:test'
import assert from 'node:assert/strict'
import {
  fnv1a32,
  pickActivityTypeCnLabelSeed,
  resolveActivityTypeCnLabelStyleFromSeed
} from '../utils/activityTypeCnLabelStyle.js'

test('fnv1a32 is deterministic', () => {
  assert.equal(fnv1a32('LUCKY_BAG'), fnv1a32('LUCKY_BAG'))
  assert.notEqual(fnv1a32('LUCKY_BAG'), fnv1a32('CARD'))
})

test('pickActivityTypeCnLabelSeed prefers activityType', () => {
  assert.equal(
    pickActivityTypeCnLabelSeed({ activityType: 'CARD', activityTypeCn: '抽卡机' }),
    'CARD'
  )
})

test('pickActivityTypeCnLabelSeed falls back to activityTypeCn', () => {
  assert.equal(
    pickActivityTypeCnLabelSeed({ activityType: '', activityTypeCn: ' 抽卡机 ' }),
    '抽卡机'
  )
})

test('resolveActivityTypeCnLabelStyleFromSeed neutral when seed empty', () => {
  const r = resolveActivityTypeCnLabelStyleFromSeed('')
  assert.equal(r.mode, 'neutral')
  assert.equal(r.useShimmerClass, false)
  assert.match(String(r.inlineStyle.backgroundColor || ''), /#f5f5f5/i)
})

test('resolveActivityTypeCnLabelStyleFromSeed gradient for seed', () => {
  const r = resolveActivityTypeCnLabelStyleFromSeed('LUCKY_BAG')
  assert.equal(r.mode, 'gradient')
  assert.equal(r.useShimmerClass, true)
  assert.match(String(r.inlineStyle.backgroundImage || ''), /linear-gradient/i)
  assert.match(String(r.inlineStyle.backgroundImage || ''), /hsl/)
})
