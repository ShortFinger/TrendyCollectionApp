# TrendyCollectionApp — Agent / 协作者说明

## 项目是什么

潮玩集合 **用户端（小程序 / App）**，基于 **uni-app**、**Vue 3**（`createSSRApp`）。与仓库内 `TrendyCollectionFront`（管理端 Web）、`TrendyCollectionService`（后端微服务）配套使用。

## 技术栈

- uni-app、Vue 3 Composition / SFC
- 条件编译：`main.js` 中 `#ifdef VUE3` 分支
- 可选用 HBuilderX（目录中存在 `.hbuilderx`）

## 目录地图（从哪改起）

| 路径 | 说明 |
|------|------|
| `pages/` | 页面；路由入口见 `pages.json` |
| `components/` | 可复用组件 |
| `store/` | 状态 |
| `utils/` | 工具与网络层；**多服务 base URL** 在 `utils/request.js` |
| `static/` | 静态资源 |
| `tests/` | Node 测试（`*.mjs`） |
| `manifest.json` / `pages.json` | 应用与页面配置 |

## 本地联调（后端）

开发环境下，前端请求基址集中在 `utils/request.js` 的 `API_BASE`（user / order / app 多服务）。需与本机已启动的 `TrendyCollectionService` 各模块端口、context-path 一致；修改环境时**只改配置与文档，勿把密钥写进仓库**。

## 常用命令

```bash
# 单元测试（Node 内置 test runner）
npm test
```

完整运行与打包通常通过 **HBuilderX** 或 uni-app 官方 CLI（若团队已接入）；以团队实际流程为准。

## 约定与注意

- 新增页面：在 `pages.json` 注册后再开发页面文件。
- 网络层统一走 `utils/request.js`，避免在页面里散落硬编码域名。
- `unpackage/` 一般为构建产物，不要手工维护核心业务逻辑。

## 延伸阅读

- `docs/`（若存在页面或接口说明）
- 仓库根目录与 `TrendyCollectionService/AGENTS.md` 了解后端模块与端口分工。
