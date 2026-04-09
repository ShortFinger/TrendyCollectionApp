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
