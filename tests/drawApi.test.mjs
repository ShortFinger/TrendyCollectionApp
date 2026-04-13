import { describe, it, mock, beforeEach } from 'node:test'
import assert from 'node:assert/strict'

let captured = null
const fakeRequest = (opts) => {
  captured = opts
  return Promise.resolve({ activityId: 'a1', results: [], totalDrawn: 0, stoppedEarly: false, stopReason: null })
}

beforeEach(() => { captured = null })

describe('drawApi', () => {
  it('submitDraw sends POST to /api/draw with correct params', async () => {
    function submitDraw(activityId, drawCount) {
      return fakeRequest({
        base: 'http://localhost:8084/client-api',
        url: '/api/draw',
        method: 'POST',
        data: { activityId, drawCount }
      })
    }

    await submitDraw('act_123', 5)

    assert.equal(captured.method, 'POST')
    assert.equal(captured.url, '/api/draw')
    assert.equal(captured.data.activityId, 'act_123')
    assert.equal(captured.data.drawCount, 5)
    assert.equal(captured.base, 'http://localhost:8084/client-api')
  })
})
