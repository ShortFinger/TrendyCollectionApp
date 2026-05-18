# ActivityFeedCard：activity-type 中文标签视觉 — 设计说明

**日期:** 2026-05-18  
**状态:** 待评审  
**范围:** `ActivityFeedCard` 标题行左侧 `activityTypeCn` 胶囊标签

## 背景与目标

活动列表需 **强识别** 玩法类型：同类型颜色稳定、核心玩法（一番赏、无限赏）更抢眼。产品确认：

1. **分层保留：** Hero（2 种）与 Standard（5 种）两套视觉层级均保留。  
2. **Hero 风格全部保留：** **霓虹**（高饱和底 + 外发光 + 白字）与 **七彩流光**（彩虹渐变流动）均要——实现为 **霓虹底 + 七彩描边流光**（预览 C）；一番赏 / 无限赏 内里主色仍区分（红橙 / 紫粉）。  
3. **尺寸加大：** 相对现网 20rpx 上调一档至 **24rpx**（见 §4）。  
4. **禁止** 再使用 FNV hash 随机渐变（与「强识别」冲突）。

数据不变：仍展示 API `activityTypeCn`；配色仅认 `activityType`（及 CN 官方别名回退）。

## 范围

| 包含 | 不包含 |
|------|--------|
| `components/ActivityFeedCard.vue` 标签 DOM/样式 | CMS、合并卡片、父页面栅格 |
| `utils/activityTypeCnLabelStyle.js` 主题表与解析 | 活动详情页 `badge`（可后续对齐） |
| `tests/activityTypeCnLabelStyle.test.mjs` | 服务端字段变更 |

## 活动类型与层级

与 `ActivityType` 枚举及 `getDisplayCn()` 一致：

| `activityType` | 中文 | 层级 |
|----------------|------|------|
| `ICHIBAN` | 一番赏 | **hero** |
| `UNLIMITED` | 无限赏 | **hero** |
| `LUCKY_BAG` | 福袋 | standard |
| `COMBO_DRAW` | 连击赏 | standard |
| `EUROPEAN` | 欧皇 | standard |
| `ENERGY_POOL` | 能量池 | standard |
| `CARD` | 抽卡机 | standard |

## 视觉规范

### Standard（5 种）

- **背景：** 135° 固定双色淡渐变（HSL，饱和度约 40–50%，明度 88–94%），各类型色相互异（与 brainstorm 预览一致）。  
- **描边 / 发光 / 动画：** 无。  
- **字色：** `#333333`。

**各类型渐变锚点（实现可微调 ±5% 饱和度，不得混用他类型色相）：**

| 类型 | 渐变示意（135deg） |
|------|-------------------|
| `LUCKY_BAG` | `hsl(28 50% 94%)` → `hsl(35 45% 90%)` |
| `COMBO_DRAW` | `hsl(268 42% 94%)` → `hsl(278 38% 90%)` |
| `EUROPEAN` | `hsl(42 55% 93%)` → `hsl(48 50% 88%)` |
| `ENERGY_POOL` | `hsl(185 45% 93%)` → `hsl(195 40% 89%)` |
| `CARD` | `hsl(215 50% 94%)` → `hsl(225 45% 90%)` |

### Hero（2 种）— 霓虹 + 七彩描边（组合）

**内里（霓虹 A）：**

| 类型 | 底色渐变 | 字色 | 外发光（`box-shadow`） |
|------|----------|------|-------------------------|
| `ICHIBAN` | `#ff2d55` → `#ff6b35` | `#ffffff` | 红/橙霓虹，`0 0 10rpx` 级 + 弱扩散 |
| `UNLIMITED` | `#a855f7` → `#ec4899` | `#ffffff` | 紫/粉霓虹 |

- `font-weight: 700`（小程序用 600 若真机过粗可降为 600，但优先 700）。  
- 可选 `text-shadow` 极弱白晕，增强可读性。

**外圈（七彩流光 B）：**

- 标签外层增加 **1 包裹容器**（见 §6），`padding` 或 `border` 区域展示 **彩虹渐变描边**，`background-size: 220% 100%`，`animation` 水平流动（周期约 **2.5–3s**，`linear`，`infinite`）。  
- 彩虹色带：`#ff6b6b → #ffd93d → #6bcb77 → #4d96ff → #9b59b6 → #ff6b9d →` 闭环。  
- Hero **仅此描边** 做位移动画；Standard **无** 动画。

**与旧版 pastel shimmer 关系：** 由「七彩描边流光」替代原 `card-activity-type-cn--shimmer` 的 pastel 底动画；不再对 Hero 底图做 12s 浅彩 shimmer。

### 尺寸（加大档 L）

相对现网统一上调（标题仍为 `23rpx`，标签 **24rpx** 为上限）：

| 属性 | 现网 | 新值 |
|------|------|------|
| `font-size` | `20rpx` | **`24rpx`** |
| `padding` | `2rpx 8rpx` | **`4rpx 12rpx`** |
| `border-radius` | `8rpx` | **`10rpx`** |
| `max-width` | `140rpx` | **`168rpx`** |
| `line-height` | `1.35` | `1.35`（保持） |

标题行 `.card-title-row`：若标签增高导致垂直不齐，将 `align-items` 设为 `center`（现 `flex-start`），并保证 `.card-title-viewport` 高度仍容纳单行/跑马灯（`36rpx` 可不变，真机验收）。

### Fallback（未知类型）

- `activityType` 为空且 CN 无法映射到 7 类官方中文 → **neutral**：`backgroundColor: #f5f5f5`，`color: #333`，无描边、无动画。  
- 未知枚举字符串（非 7 类）→ neutral，**禁止** hash 上色。

### 无障碍与性能

- `@media (prefers-reduced-motion: reduce)`：关闭七彩描边 `animation`（保留静态彩虹相位或退回单色描边，以真机可读为准）。  
- 列表内仅 **文字/标签** 动画，控制同屏 Hero 卡数量由列表自然限制；若真机掉帧，可将动画仅作用于 `transform`/`opacity` 或降帧，**不得** 静默去掉 Hero 霓虹/七彩定义（产品要求风格保留）。

## 架构

### 主题表（`activityTypeCnLabelStyle.js`）

```text
THEME_BY_TYPE: Record<ActivityTypeEnum, Theme>
  tier: 'hero' | 'standard' | 'neutral'
  labelStyle: { color, backgroundImage?, backgroundColor?, boxShadow?, textShadow? }
  wrapperClass?: 'card-activity-type-cn-wrap--hero'  // 七彩描边容器
  useRainbowBorder: boolean  // hero true
CN_ALIAS: 官方 7 中文 → activityType
pickActivityTypeCnLabelSeed(item)  // 不变：activityType 优先
resolveActivityTypeCnLabelStyle(seed) → { tier, labelStyle, useRainbowBorder, wrapperClass }
```

- **删除** `fnv1a32` 用于配色的逻辑；`fnv1a32` 可移除或仅留测迁移用。  
- 单元测试覆盖 7 类型 tier、Hero `useRainbowBorder`、neutral、CN 回退。

### 组件（`ActivityFeedCard.vue`）

**现结构：**

```html
<text class="card-activity-type-cn" :class="..." :style="...">
```

**改为（Hero / 需彩虹描边时）：**

```html
<view v-if="activityTypeCnTrimmed" class="card-activity-type-cn-wrap" :class="wrapClass">
  <text class="card-activity-type-cn" :style="labelStyle">{{ activityTypeCnTrimmed }}</text>
</view>
```

- Standard：可无 wrap，或统一 wrap 不加动画类（实现选更简单者；推荐 **仅 Hero 包 wrap**）。  
- 七彩描边 CSS 放在 scoped 样式：`.card-activity-type-cn-wrap--hero::before` 等（真机若 `::before` 异常，改用内层绝对定位 `view` 作彩虹底，spec 允许等价实现）。  
- `text` 节点保留单行省略与 `max-width`。

## 数据流

```text
item.activityType ──► UPPER ──► THEME_BY_TYPE
        │ miss
item.activityTypeCn ──► CN_ALIAS ──► THEME_BY_TYPE
        │ fail
      neutral
```

文案展示始终 `activityTypeCn`；运营改文案 **不改变** 配色。

## 验收标准

1. 7 类在列表中颜色稳定、可区分；ICHIBAN / UNLIMITED 明显强于 Standard。  
2. Hero：白字 + 霓虹底 + 彩虹描边持续流动（减少动态效果下静止）。  
3. Standard：淡双色渐变，无描边无光晕无动画。  
4. 标签 visibly 大于现网（24rpx），标题仍为视觉主文案（23rpx 粗体）。  
5. 未知类型灰底；无 hash 随机色。  
6. 标题过长跑马灯、卡片点击行为不变。  
7. 单测 + 首页/分类页真机各扫一眼。

## 测试建议

- `activityTypeCnLabelStyle.test.mjs`：7 类型、Hero border 标志、neutral、CN 回退、移除 hash 断言。  
- 真机：深色封面图 + Hero 标签对比度；减少动态效果；长 `activityTypeCn` 省略号。

## 参考预览

Brainstorm 静态页（本地，非交付物）：`.superpowers/brainstorm/.../activity-type-neon-rainbow-v1.html`、`activity-type-label-size-v1.html`。
