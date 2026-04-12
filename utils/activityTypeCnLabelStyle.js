/**
 * Deterministic "炫彩" label styles for activity type CN chip (spec 2026-04-12).
 */

const FNV_OFFSET = 2166136261
const FNV_PRIME = 16777619

/**
 * @param {string} str
 * @returns {number} unsigned 32-bit
 */
export function fnv1a32(str) {
  let h = FNV_OFFSET
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, FNV_PRIME) >>> 0
  }
  return h >>> 0
}

function pickString(v) {
  if (v == null) return ''
  return String(v).trim()
}

/**
 * @param {{ activityType?: string, activityTypeCn?: string }} item
 * @returns {string} seed for gradient; may be empty
 */
export function pickActivityTypeCnLabelSeed(item) {
  if (item == null || typeof item !== 'object') return ''
  const t = pickString(item.activityType)
  if (t) return t
  return pickString(item.activityTypeCn)
}

/**
 * @param {string} seed
 * @returns {{ mode: 'neutral'|'gradient', inlineStyle: Record<string, string>, useShimmerClass: boolean }}
 */
export function resolveActivityTypeCnLabelStyleFromSeed(seed) {
  const s = pickString(seed)
  if (!s) {
    return {
      mode: 'neutral',
      inlineStyle: {
        backgroundColor: '#f5f5f5',
        color: '#333333'
      },
      useShimmerClass: false
    }
  }
  const h = fnv1a32(s)
  const hue0 = h % 360
  const hue1 = (hue0 + 32 + ((h >>> 8) % 48)) % 360
  const bg = `linear-gradient(135deg, hsl(${hue0} 55% 92%), hsl(${hue1} 50% 88%))`
  return {
    mode: 'gradient',
    inlineStyle: {
      backgroundImage: bg,
      color: '#333333'
    },
    useShimmerClass: true
  }
}
