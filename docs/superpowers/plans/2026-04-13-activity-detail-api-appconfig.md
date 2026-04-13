# AppConfig 活动详情 API（ActivityDetailVO）实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现 `GET` 聚合接口（AppConfig）与 Order 侧「按活动 ID 查询奖品等级列表」，使小程序 **`/pages/card/index`**、**`/pages/ichibanKuji/index`** 使用 **`ActivityDetailVO`**（无 CMS、无 `status`），并与设计说明 [`../specs/2026-04-13-activity-detail-api-activitydetailvo-design.md`](../specs/2026-04-13-activity-detail-api-activitydetailvo-design.md) 一致。**活动详情全链路不要求用户登录**：Order **`reward-levels`** 必须与 **`display-batch`** 一样对匿名请求放行（见 spec「Order Client 匿名放行」）。

**Architecture:** Order 暴露 **`GET /client-api/activities/{activityId}/reward-levels`**（仅 `title`/`icon`/`sortOrder`，排序见 spec），且在 **`TrendyCollectionOrderClient`** 的 **`JwtInterceptor`** 白名单中增加 **`/activities/*/reward-levels`**，否则 AppConfig 服务端调用无用户 Bearer 会得到 **401**，聚合失败。AppConfig **`GET /app-api/v1/activities/{activityId}/detail`**：串行调用 **`OrderActivityDisplayClient.displayBatch`**（单 id）与 **`OrderRewardLevelsClient`**，组装 **`ActivityDetailVO`**。小程序 **`API_BASE.app`** + **`/v1/activities/{id}/detail`**（与 [`categoryActivitiesApi.js`](../../utils/categoryActivitiesApi.js) 路径风格一致）。

**Tech Stack:** Java 21, Spring Boot 3, MyBatis-Plus, uni-app / Vue 3；模块：`TrendyCollectionOrderClient`, `TrendyCollectionAppConfig`, `TrendyCollectionApp`。

---

## 文件映射（新建 / 修改）

| 区域 | 路径 | 职责 |
|------|------|------|
| Order | `TrendyCollectionOrderClient/.../config/WebMvcConfig.java` | **`JwtInterceptor`** 的 `excludePathPatterns` 增加 **`/activities/*/reward-levels`**（dispatch path，与现有 `/activities/display-batch` 同级） |
| Order | `TrendyCollectionOrderClient/src/test/java/.../RewardLevelsAnonymousIntegrationTest.java`（新建） | 全上下文 **MockMvc**：无 `Authorization` 访问 **`reward-levels`** 返回 **200**、`code=0`（先于实现编写则应先失败） |
| Order | `TrendyCollectionOrderClient/.../dto/response/RewardLevelItemVO.java` | 公开 DTO：`title`, `icon`, `sortOrder` |
| Order | `TrendyCollectionOrderClient/.../service/RewardLevelQueryService.java`（或并入 `ActivityDisplayService`） | 按 `activityId` 查 `RewardLevelMapper`，`sort_order asc, id asc`，`@TableLogic` 已处理删除 |
| Order | 修改 `TrendyCollectionOrderClient/.../controller/ActivityDisplayController.java`（推荐）或新建同前缀 Controller | `GET /activities/{activityId}/reward-levels`；全局 **`server.servlet.context-path: /client-api`**（见 `application.yml`），故对外 **`/client-api/activities/{activityId}/reward-levels`** |
| Order | `.../controller/ActivityDisplayControllerTest.java` 或新建 `RewardLevelControllerTest.java` | MockMvc 集成测试 |
| AppConfig | `.../dto/response/RewardLevelItemVO.java` | 与 Order JSON 字段名一致（或复用命名便于 Jackson） |
| AppConfig | `.../dto/response/ActivityDetailVO.java` | `id`, `title`, `activityType`, `activityTypeCn`, `List<RewardLevelItemVO> rewardLevels` |
| AppConfig | `.../client/OrderRewardLevelsClient.java` | `GET {base}/client-api/activities/{id}/reward-levels`，解析 `Result` |
| AppConfig | `.../service/ActivityDetailService.java` | 组装 VO；display-batch 无 id 或 Order 失败则抛/返回错误 |
| AppConfig | `.../controller/app/ActivityDetailController.java` | `GET /app-api/v1/activities/{activityId}/detail` + query `channel`, `appVersion` |
| AppConfig | `.../controller/app/ActivityDetailControllerTest.java` | `MockRestServiceServer` 或 MockBean 双客户端 |
| App | `TrendyCollectionApp/utils/activityDetailApi.js` | `fetchActivityDetail(activityId, { channel, appVersion })` |
| App | `TrendyCollectionApp/pages/card/index.vue` | 改用详情 API；**去掉** 依赖 `status` 的 `available`；封面无 VO 字段时用占位或首等级 `icon`（见 Task 5） |
| App | `TrendyCollectionApp/pages/ichibanKuji/index.vue` | `onLoad` 读 `activityId`，拉详情，`ensureCanonicalActivityRoute`，用 `rewardLevels` 驱动「奖池预览」区最小绑定（可保留部分静态样式） |

---

### Task 0: Order — `JwtInterceptor` 放行 `GET /activities/{id}/reward-levels`（匿名，AppConfig 可聚合）

**执行顺序:** `GET .../reward-levels` 必须已注册（本计划 **Task 1**）。若仓库里 Task 1 已落地，可直接做 Task 0；若从零执行，**先做 Task 1 再做 Task 0**（或将 Task 0 的 `WebMvcConfig` 修改与 Task 1 同一次提交，并仍保留本集成测试）。

**Files:**
- Modify: `TrendyCollectionService/TrendyCollectionOrderClient/src/main/java/com/trendy/client/config/WebMvcConfig.java`
- Create: `TrendyCollectionService/TrendyCollectionOrderClient/src/test/java/com/trendy/client/security/RewardLevelsAnonymousIntegrationTest.java`

- [ ] **Step 1: 编写会先失败的集成测试（TDD）**

新建 `RewardLevelsAnonymousIntegrationTest`，使用完整 Spring 上下文 + MockMvc，**不携带** `Authorization`：

```java
package com.trendy.client.security;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class RewardLevelsAnonymousIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void rewardLevels_withoutAuthorization_returns200AndCode0() throws Exception {
        mockMvc.perform(get("/client-api/activities/anon-itest-id/reward-levels")
                        .contextPath("/client-api"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(0))
                .andExpect(jsonPath("$.data").isArray());
    }
}
```

说明：在 **`excludePathPatterns` 未包含 `reward-levels` 的当前代码上**，本测试应得到 **401** 或 **非 0 业务体**，与 `andExpect(status().isOk())` 冲突 → **测试失败**，符合红阶段。

- [ ] **Step 2: 运行测试确认失败**

Run:

```bash
cd TrendyCollectionService/TrendyCollectionOrderClient && mvn -q test -Dtest=RewardLevelsAnonymousIntegrationTest
```

Expected: **FAIL**（例如 `status expected:<200> but was:<401>`）。

- [ ] **Step 3: 修改 `WebMvcConfig` 放行路径**

在 `excludePathPatterns(...)` 列表中**追加**一行（保留原有项）：

```java
"/activities/*/reward-levels",
```

完整示例（仅展示 `excludePathPatterns` 块，省略无关 import）：

```java
.excludePathPatterns(
        "/swagger-ui/**",
        "/v3/api-docs/**",
        "/doc.html/**",
        "/webjars/**",
        "/activities/display-batch",
        "/activities/by-category",
        "/categories/display-batch",
        "/activities/*/reward-levels"
);
```

- [ ] **Step 4: 再次运行同一测试，确认通过**

Run:

```bash
cd TrendyCollectionService/TrendyCollectionOrderClient && mvn -q test -Dtest=RewardLevelsAnonymousIntegrationTest
```

Expected: **PASS**。

- [ ] **Step 5: 全量模块测试**

Run:

```bash
cd TrendyCollectionService/TrendyCollectionOrderClient && mvn -q test
```

Expected: **全通过**。

- [ ] **Step 6: Commit**

```bash
git add TrendyCollectionService/TrendyCollectionOrderClient/src/main/java/com/trendy/client/config/WebMvcConfig.java \
  TrendyCollectionService/TrendyCollectionOrderClient/src/test/java/com/trendy/client/security/RewardLevelsAnonymousIntegrationTest.java
git commit -m "fix(order-client): allow anonymous GET activities/*/reward-levels for AppConfig detail"
```

---

### Task 1: Order — `RewardLevelItemVO` + 查询服务 + `GET /client-api/activities/{activityId}/reward-levels`

**Files:**
- Create: `TrendyCollectionService/TrendyCollectionOrderClient/src/main/java/com/trendy/client/dto/response/RewardLevelItemVO.java`
- Create: `TrendyCollectionService/TrendyCollectionOrderClient/src/main/java/com/trendy/client/service/RewardLevelQueryService.java`
- Modify: `TrendyCollectionService/TrendyCollectionOrderClient/src/main/java/com/trendy/client/controller/ActivityDisplayController.java`
- Modify: `TrendyCollectionService/TrendyCollectionOrderClient/src/test/java/com/trendy/client/controller/ActivityDisplayControllerTest.java`（或新建专用测试类）

- [ ] **Step 1: 新增 DTO**

`RewardLevelItemVO`：`private String title; private String icon; private Integer sortOrder;`（Lombok `@Data`），与 spec JSON `sortOrder` 一致。

- [ ] **Step 2: 实现 `RewardLevelQueryService`**

注入 `com.trendy.activity.mapper.RewardLevelMapper`（已在 `@MapperScan`）。方法：

```java
public List<RewardLevelItemVO> listByActivityId(String activityId) {
    if (activityId == null || activityId.isBlank()) {
        return List.of();
    }
    List<RewardLevel> rows = rewardLevelMapper.selectList(
        new LambdaQueryWrapper<RewardLevel>()
            .eq(RewardLevel::getActivityId, activityId.trim())
            .orderByAsc(RewardLevel::getSortOrder)
            .orderByAsc(RewardLevel::getId));
    return rows.stream().map(this::toVo).toList();
}
private RewardLevelItemVO toVo(RewardLevel e) {
    RewardLevelItemVO v = new RewardLevelItemVO();
    v.setTitle(e.getTitle());
    v.setIcon(e.getIcon());
    v.setSortOrder(e.getSortOrder());
    return v;
}
```

- [ ] **Step 3: 在 `ActivityDisplayController` 增加 GET**

类上已有 `@RequestMapping("/activities")`；`application.yml` 已设 **`server.servlet.context-path: /client-api`**。新增方法：

```java
@GetMapping("/{activityId}/reward-levels")
public Result<List<RewardLevelItemVO>> rewardLevels(@PathVariable String activityId) {
    return Result.ok(rewardLevelQueryService.listByActivityId(activityId));
}
```

注入 `RewardLevelQueryService`（或内联服务调用）。对外完整路径：**`/client-api/activities/{activityId}/reward-levels`**。

- [ ] **Step 4: 编写 MockMvc 测试**

与 `ActivityDisplayControllerTest` 相同：`.contextPath("/client-api")`，路径 **`/client-api/activities/{id}/reward-levels`**。无数据时期望 `data: []`。

- [ ] **Step 5: 运行测试**

Run: `cd TrendyCollectionService/TrendyCollectionOrderClient && mvn -q test`

Expected: 新增测试 + 全量通过（**若已实现 Task 0**，`RewardLevelsAnonymousIntegrationTest` 应仍通过；**若 Task 1 先于 Task 0 落地**，须补跑 Task 0 或先合并白名单再测）。

- [ ] **Step 6: Commit**

```bash
git add TrendyCollectionService/TrendyCollectionOrderClient/src/main/java/com/trendy/client/dto/response/RewardLevelItemVO.java \
  TrendyCollectionService/TrendyCollectionOrderClient/src/main/java/com/trendy/client/service/RewardLevelQueryService.java \
  TrendyCollectionService/TrendyCollectionOrderClient/src/main/java/com/trendy/client/controller/ActivityDisplayController.java \
  TrendyCollectionService/TrendyCollectionOrderClient/src/test/java/com/trendy/client/controller/ActivityDisplayControllerTest.java
git commit -m "feat(order-client): add GET activities by id reward-levels for AppConfig aggregation"
```

---

### Task 2: AppConfig — DTO、`OrderRewardLevelsClient`、`ActivityDetailService`、`ActivityDetailController`

**Files:**
- Create: `TrendyCollectionService/TrendyCollectionAppConfig/src/main/java/com/trendy/appconfig/dto/response/RewardLevelItemVO.java`
- Create: `TrendyCollectionService/TrendyCollectionAppConfig/src/main/java/com/trendy/appconfig/dto/response/ActivityDetailVO.java`
- Create: `TrendyCollectionService/TrendyCollectionAppConfig/src/main/java/com/trendy/appconfig/client/OrderRewardLevelsClient.java`
- Create: `TrendyCollectionService/TrendyCollectionAppConfig/src/main/java/com/trendy/appconfig/service/ActivityDetailService.java`
- Create: `TrendyCollectionService/TrendyCollectionAppConfig/src/main/java/com/trendy/appconfig/controller/app/ActivityDetailController.java`
- Create: `TrendyCollectionService/TrendyCollectionAppConfig/src/test/java/com/trendy/appconfig/controller/app/ActivityDetailControllerTest.java`

- [ ] **Step 1: `ActivityDetailVO` / `RewardLevelItemVO`**

字段与 spec 一致；`ActivityDetailVO` 含 `List<RewardLevelItemVO> rewardLevels`。

- [ ] **Step 2: `OrderRewardLevelsClient`**

仿 `OrderActivityDisplayClient`：`RestClient` 的 **`uri`** 写完整 **`/client-api/activities/{id}/reward-levels`**（与现有 `POST /client-api/activities/display-batch` 同风格；`baseUrl` 为 `appconfig.order-client-base-url`），解析 `code==0` 的 `data` 数组。

- [ ] **Step 3: `ActivityDetailService`**

输入：`activityId`。步骤：

1. `orderActivityDisplayClient.displayBatch(List.of(activityId))`；若返回空或第一条为 null → 抛 `BusinessException` 与现有错误码（与「活动不存在」语义一致，参考 `ErrorCode`）。
2. `orderRewardLevelsClient.fetch(activityId)` → `rewardLevels`（失败时可 `[]` 或整体失败：**按 spec「无等级为空数组」**，若 Order 等级接口报错建议记录日志并返回 `[]`，与产品确认；**默认实现：HTTP 成功则列表，解析失败抛 500**）。

映射：`ActivityDetailVO` 从第一条 `ActivityDisplaySnapshot` 取 `id, title, activityType, activityTypeCn`；**不要**映射 `status`、封面等已删除字段。

- [ ] **Step 4: `ActivityDetailController`**

```java
@GetMapping("/app-api/v1/activities/{activityId}/detail")
public Result<ActivityDetailVO> detail(
    @PathVariable String activityId,
    @RequestParam String channel,
    @RequestParam String appVersion) {
    return Result.ok(activityDetailService.getDetail(activityId.trim()));
}
```

`channel`/`appVersion` 与 `CategoryActivitiesController` 一样参与签名（即使本期不用，也便于规则扩展）。

- [ ] **Step 5: 测试**

`@WebMvcTest` + `@MockBean` `ActivityDetailService` 或 `MockRestServiceServer` 模拟 Order。断言 JSON 含 `rewardLevels` 数组。

- [ ] **Step 6: 运行模块测试**

Run: `cd TrendyCollectionService/TrendyCollectionAppConfig && mvn -q test`

- [ ] **Step 7: Commit**

```bash
git add TrendyCollectionService/TrendyCollectionAppConfig/src/main/java/com/trendy/appconfig/dto/response/ActivityDetailVO.java \
  TrendyCollectionService/TrendyCollectionAppConfig/src/main/java/com/trendy/appconfig/dto/response/RewardLevelItemVO.java \
  TrendyCollectionService/TrendyCollectionAppConfig/src/main/java/com/trendy/appconfig/client/OrderRewardLevelsClient.java \
  TrendyCollectionService/TrendyCollectionAppConfig/src/main/java/com/trendy/appconfig/service/ActivityDetailService.java \
  TrendyCollectionService/TrendyCollectionAppConfig/src/main/java/com/trendy/appconfig/controller/app/ActivityDetailController.java \
  TrendyCollectionService/TrendyCollectionAppConfig/src/test/java/com/trendy/appconfig/controller/app/ActivityDetailControllerTest.java
git commit -m "feat(appconfig): add GET v1 activities detail ActivityDetailVO"
```

---

### Task 3: 小程序 — `activityDetailApi.js` + `card/index.vue`

**Files:**
- Create: `TrendyCollectionApp/utils/activityDetailApi.js`
- Modify: `TrendyCollectionApp/pages/card/index.vue`

- [ ] **Step 1: 封装请求**

```javascript
import { request, API_BASE } from './request.js'

/**
 * @param {string} activityId
 * @param {{ channel: string, appVersion: string }} ctx
 * @returns {Promise<object|null>} ActivityDetailVO
 */
export async function fetchActivityDetail(activityId, ctx) {
  const id = String(activityId ?? '').trim()
  if (!id) return null
  const path = `/v1/activities/${encodeURIComponent(id)}/detail`
  const data = await request({
    base: API_BASE.app,
    url: path,
    method: 'GET',
    data: { channel: ctx.channel, appVersion: ctx.appVersion }
  })
  return data && typeof data === 'object' ? data : null
}
```

`channel` / `appVersion` 与首页或 [`categoryActivitiesApi.js`](../../utils/categoryActivitiesApi.js) 同源（从现有 `manifest` / 常量 / `onLoad` 上下文复制项目既有写法）。

- [ ] **Step 2: 替换 `card/index.vue` 数据层**

- 将 `fetchActivityDisplayById` 换为 `fetchActivityDetail`。
- **`available`：** 改为「有 `vo` 且 `ensureCanonicalActivityRoute` 未中断即为可展示」，**不得**再读 `status`。
- **`coverUrl`：** VO 无 `squareThumb`/`longThumb`；**MVP**：`''` 占位背景，或取 `vo.rewardLevels?.[0]?.icon` 作弱替代（在模板注释中说明）。

- [ ] **Step 3: 手动验证**

本地起 Order、AppConfig、小程序 `npm run dev`，打开 `/pages/card/index?activityId=有效id`，网络面板请求 `app-api/v1/activities/.../detail`，页面无白屏。

- [ ] **Step 4: Commit**

```bash
git add TrendyCollectionApp/utils/activityDetailApi.js TrendyCollectionApp/pages/card/index.vue
git commit -m "feat(app): load ActivityDetailVO from AppConfig on card page"
```

---

### Task 4: 小程序 — `ichibanKuji/index.vue` 接入 `activityId` 与详情 API

**Files:**
- Modify: `TrendyCollectionApp/pages/ichibanKuji/index.vue`

- [ ] **Step 1: 引入 `onLoad`、`ref`、`fetchActivityDetail`、`ensureCanonicalActivityRoute`**

- 读 `query.activityId`；缺参时 toast + `navigateBack`（与 card 一致）。
- 拉取详情后：`ensureCanonicalActivityRoute(id, vo.activityType)`（**ICHIBAN/UNLIMITED** 留在赏柜；**CARD** 应 `redirectTo` 抽卡页，与 [`activityRouteCanonical.js`](../../utils/activityRouteCanonical.js) 一致）。

- [ ] **Step 2: 绑定最小 UI**

- `poolInfo.title` ← `vo.title`（或占位）。
- `rewardGroups`：由 `vo.rewardLevels` 映射为现有网格所需字段（`level` 可用 `index` 或 `title` 首字符；**YAGNI**：仅标题 + 占位色块即可）。

- [ ] **Step 3: Commit**

```bash
git add TrendyCollectionApp/pages/ichibanKuji/index.vue
git commit -m "feat(app): load ActivityDetailVO on ichibanKuji page"
```

---

### Task 5: 文档与 spec 对齐（可选小补）

**Files:**
- Modify: `TrendyCollectionApp/docs/superpowers/specs/2026-04-13-activity-detail-api-activitydetailvo-design.md`（若路径或鉴权与实现不一致）

- [ ] 若 Order 最终路径与文中「`/client-api/activities/{id}/reward-levels`」不一致，**改 spec 一行**并提交。
- [ ] 鉴权：**匿名 `reward-levels`** 已在 spec「修订」与「Order Client 匿名放行」中描述；实现须与之一致，**无需重复抄 doc**，除非白名单模式从 `/activities/*/reward-levels` 改为其它写法（则同步改 spec）。

---

## Spec 自检（计划覆盖）

| Spec 要求 | 对应 Task |
|-----------|-----------|
| 活动详情不要求登录；`reward-levels` 匿名可读；聚合不得因未登录 401 | **Task 0**（Order 白名单）+ Task 2–4 端上验证 |
| `GET .../detail`，query `channel`/`appVersion` | Task 2 |
| VO：`id`,`title`,`activityType`,`activityTypeCn`,`rewardLevels[]` | Task 2 |
| `rewardLevels` 元素 `title`,`icon`,`sortOrder` | Task 1–2 |
| 无 CMS | 无 Task（代码不引用 CMS） |
| 无 `status` | Task 2 映射不写；Task 3–4 不判断上架 |
| Order 提供等级列表、AppConfig 不直连库 | Task 1 + Task 2 client |
| 错误：Result 非 0 | Task 2–3 `request` 沿用全局错误处理 |

**Placeholder scan:** 本计划无 TBD；Task 1 中「URL 前缀」要求实现时打开现有 Controller 对齐，不保留模糊句。

---

**Plan complete and saved to `TrendyCollectionApp/docs/superpowers/plans/2026-04-13-activity-detail-api-appconfig.md`. Two execution options:**

**1. Subagent-Driven (recommended)** — 每任务派生子代理，任务间评审，迭代快  

**2. Inline Execution** — 本会话用 executing-plans 按任务执行，批量与检查点结合  

**Which approach?**
