import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  getProvinceOptions,
  resolveRegionCodesByDistrict,
  resolveRegionCodesByNames
} from '../utils/regionData.js'

describe('regionData (modood bundle)', () => {
  it('exposes all provinces', () => {
    assert.equal(getProvinceOptions().length, 31)
  })

  it('resolveRegionCodesByDistrict maps 6-digit code', () => {
    assert.deepEqual(resolveRegionCodesByDistrict('110101'), {
      provinceCode: '11',
      cityCode: '1101',
      districtCode: '110101'
    })
  })

  it('resolveRegionCodesByNames matches 北京市/市辖区/东城区', () => {
    assert.deepEqual(
      resolveRegionCodesByNames('北京市', '市辖区', '东城区'),
      {
        provinceCode: '11',
        cityCode: '1101',
        districtCode: '110101'
      }
    )
  })
})
