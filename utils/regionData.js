/**
 * 省市区数据：与 modood/Administrative-divisions-of-China `dist` 下 JSON 结构一致，
 * 末级 6 位区划码与后端 `RegionValidationService` / `areas.json` 校验源对齐。
 * 原始 JSON 在 `utils/data/provinces.json` 等；执行 `node scripts/bundle-region.mjs` 生成 `regionBundle.js`。
 */
import { areasData, citiesData, provincesData } from './data/regionBundle.js'

let regionTreeCache = null
let areaByCode = null
let areaByNameKey = null

function buildRegionTree() {
  if (regionTreeCache) return regionTreeCache
  regionTreeCache = provincesData.map(p => {
    const cities = citiesData
      .filter(c => c.provinceCode === p.code)
      .map(city => {
        const districts = areasData
          .filter(a => a.cityCode === city.code)
          .map(a => ({ code: a.code, name: a.name }))
        return { code: city.code, name: city.name, districts }
      })
    return { code: p.code, name: p.name, cities }
  })
  return regionTreeCache
}

function getAreaByCode() {
  if (areaByCode) return areaByCode
  areaByCode = new Map(areasData.map(a => [a.code, a]))
  return areaByCode
}

/**
 * 名称兜底匹配用：微信省市区与数据源简称可能略不同，用规范化后的 key 做索引。
 */
function getAreaByNameKey() {
  if (areaByNameKey) return areaByNameKey
  const m = new Map()
  for (const a of areasData) {
    const p = provincesData.find(x => x.code === a.provinceCode)
    const c = citiesData.find(x => x.code === a.cityCode)
    if (!p || !c) continue
    const k = [p.name, c.name, a.name].map(normalizeRegionLabel).join('|')
    if (!m.has(k)) m.set(k, a)
  }
  areaByNameKey = m
  return areaByNameKey
}

function normalizeRegionLabel(s) {
  return String(s || '')
    .trim()
    .replace(/\s+/g, '')
}

function regionNameLooseEqual(a, b) {
  const x = normalizeRegionLabel(a)
  const y = normalizeRegionLabel(b)
  if (!x || !y) return false
  if (x === y) return true
  const strip = t =>
    t.replace(
      /(省|市|自治区|壮族自治区|回族自治区|维吾尔自治区|特别行政区|地区|盟|自治州|林区)$/g,
      ''
    )
  const sx = strip(x)
  const sy = strip(y)
  if (sx && sy && (sx === sy || x.includes(y) || y.includes(x))) return true
  return false
}

export function getProvinceOptions() {
  return buildRegionTree()
}

export function getCityOptions(provinceCode) {
  const p = buildRegionTree().find(item => item.code === provinceCode)
  return p?.cities || []
}

export function getDistrictOptions(provinceCode, cityCode) {
  const city = getCityOptions(provinceCode).find(item => item.code === cityCode)
  return city?.districts || []
}

export function resolveRegionNames(provinceCode, cityCode, districtCode) {
  const p = provincesData.find(x => x.code === provinceCode)
  const c = citiesData.find(x => x.code === cityCode)
  const a = getAreaByCode().get(districtCode)
  return {
    provinceName: p?.name || '',
    cityName: c?.name || '',
    districtName: a?.name || ''
  }
}

export function resolveRegionCodesByDistrict(districtCode) {
  if (!districtCode) {
    return { provinceCode: '', cityCode: '', districtCode: '' }
  }
  const a = getAreaByCode().get(districtCode)
  if (!a) {
    return { provinceCode: '', cityCode: '', districtCode: districtCode }
  }
  return {
    provinceCode: a.provinceCode,
    cityCode: a.cityCode,
    districtCode: a.code
  }
}

export function resolveRegionCodesByNames(provinceName, cityName, districtName) {
  for (const province of buildRegionTree()) {
    if (!regionNameLooseEqual(province.name, provinceName)) continue
    for (const city of province.cities || []) {
      if (!regionNameLooseEqual(city.name, cityName)) continue
      for (const dist of city.districts || []) {
        if (regionNameLooseEqual(dist.name, districtName)) {
          return {
            provinceCode: province.code,
            cityCode: city.code,
            districtCode: dist.code
          }
        }
      }
    }
  }
  const p = normalizeRegionLabel(provinceName)
  const c = normalizeRegionLabel(cityName)
  const d = normalizeRegionLabel(districtName)
  if (p && c && d) {
    const hit = getAreaByNameKey().get(`${p}|${c}|${d}`)
    if (hit) {
      return {
        provinceCode: hit.provinceCode,
        cityCode: hit.cityCode,
        districtCode: hit.code
      }
    }
  }
  return { provinceCode: '', cityCode: '', districtCode: '' }
}
