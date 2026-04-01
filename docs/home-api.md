首页接口设计（Java/Spring 版本）
================================

## 1. 接口总体说明

- **接口域名**：按后端环境自行配置，例如 `https://api.trendy-collection.com`
- **统一前缀**：`/app`
- **数据格式**：`application/json`
- **认证方式**：后续可扩展（例如携带 `Authorization` 头部），当前文档先按**无需登录**设计

所有接口返回统一响应结构：

```json
{
  "code": 0,
  "message": "OK",
  "data": { }
}
```

- **code**：业务状态码，0 表示成功，非 0 表示失败
- **message**：人类可读的错误/提示信息
- **data**：具体业务数据

---

## 2. 首页基础接口（仅头部）

### 2.1 接口定义

- **请求方法**：`GET`
- **请求路径**：`/app`
- **请求参数**：无（如后续需要可携带 `lat` / `lng`、`cityCode` 等）

### 2.2 响应数据结构

```json
{
  "code": 0,
  "message": "OK",
  "data": {
    "header": {
      "search": {
        "placeholder": "新鲜草莓 1.9元/斤",
        "keywords": ["草莓", "牛排", "蓝莓"]
      }
    }
  }
}
```

### 2.3 字段说明

- **header.search**
  - `placeholder`：搜索输入框占位文案
  - `keywords`：可选，推荐搜索关键词列表
- **couponEntrance**
  - `show`：是否展示首页入口
  - `title`：标题文案，例如「优惠券中心」
  - `subTitle`：副标题描述
  - `icon`：入口图标，可用 emoji 或后续改为图片
  - `jumpUrl`：跳转到优惠券中心页面的路径

---

## 3. 子模块接口设计（独立接口）

`banner`、`category`、`contentCards` 统一拆分为独立接口，首页按模块分别请求。

### 3.1 头部信息（定位 + 搜索）

- **请求方法**：`GET`
- **请求路径**：`/app/header`
- **请求参数**：可根据后续定位需求自行扩展
- **响应体**：同聚合接口中 `data.header` 字段结构

### 3.2 Banner 模块

- **请求方法**：`GET`
- **请求路径**：`/app/banner`
- **响应体**：

```json
{
  "code": 0,
  "message": "OK",
  "data": [
    {
      "title": "新春生鲜礼遇",
      "subTitle": "全场满99减20元",
      "rightText": "Fresh fruits bank",
      "buttonText": "立即抢购",
      "jumpType": "page",
      "jumpUrl": "/pages/activity/spring",
      "bgColor": "#00c36f"
    }
  ]
}
```

### 3.3 Category 模块（快捷入口）

- **请求方法**：`GET`
- **请求路径**：`/app/category`
- **响应体**：

```json
{
  "code": 0,
  "message": "OK",
  "data": {
    "title": "快捷入口",
    "items": [
      {
        "id": 1,
        "label": "时令水果",
        "icon": "🍎",
        "bgColor": "#e6f7ff",
        "link": "/pages/category/fruit"
      },
      {
        "id": 2,
        "label": "新鲜蔬菜",
        "icon": "🥦",
        "bgColor": "#e8f9f0",
        "link": "/pages/category/vegetable"
      }
    ]
  }
}
```

### 3.4 限时秒杀模块

- **请求方法**：`GET`
- **请求路径**：`/app/flash-sale`
- **请求参数**：可选 `scene`、`cityCode` 等，用于后期做按城市/场景的秒杀
- **响应体**：同聚合接口中 `data.flashSale` 字段结构

### 3.5 精选内容卡片模块

- **请求方法**：`GET`
- **请求路径**：`/app/content-cards`
- **请求参数**：
  - `page`：页码，默认 1
  - `pageSize`：每页数量，默认 10
- **响应体**：

```json
{
  "code": 0,
  "message": "OK",
  "data": {
    "title": "精选内容",
    "items": [
      {
        "id": 1,
        "title": "Food post",
        "desc": "20分钟搞定！超级好吃的蒜香大虾做法",
        "author": "雨莎小李",
        "tag": "图文",
        "likes": 1200,
        "coverUrl": "https://cdn.example.com/images/shrimp.png",
        "jumpType": "page",
        "jumpUrl": "/pages/ichibanKuji/index"
      }
    ],
    "page": 1,
    "pageSize": 10,
    "total": 100
  }
}
```

### 3.6 模块字段说明

- **banner**
  - `title`：大标题，对应首页顶部绿色 Banner 的主文案
  - `subTitle`：副标题，对应「全场满99减20元」
  - `rightText`：右侧英文文案，例如「Fresh fruits bank」
  - `buttonText`：按钮文案，例如「立即抢购」
  - `jumpType`：跳转类型，`page` 表示小程序/应用内部页面，`h5` 表示外部 H5，`none` 表示无跳转
  - `jumpUrl`：跳转路径或 H5 链接
  - `bgColor`：Banner 背景色（可选，前端也可写死）
- **category**
  - `title`：可选，快捷入口区域标题
  - `items`：入口列表
    - `id`：入口唯一 ID
    - `label`：文案，例如「时令水果」
    - `icon`：当前用 emoji 展示，后续可以扩展为图片地址
    - `bgColor`：图标圆背景色
    - `link`：点击后跳转路径
- **contentCards**
  - `title`：模块标题，如「精选内容」
  - `items`：内容卡片列表，对应首页卡片区域
    - `id`：内容 ID
    - `title`：卡片标题
    - `desc`：卡片描述/摘要
    - `author`：作者昵称
    - `tag`：标签文本，如「图文」「健康餐」
    - `likes`：点赞数量（数值）
    - `coverUrl`：封面图地址
    - `jumpType`：跳转类型，含义同 Banner
    - `jumpUrl`：点击卡片后跳转路径

---

## 4. Spring Boot 后端约定（简要）

### 4.1 统一响应封装

后端推荐使用如下统一响应模型（示例）：

```java
public class ApiResponse<T> {
    private int code;
    private String message;
    private T data;

    public static <T> ApiResponse<T> ok(T data) {
        ApiResponse<T> r = new ApiResponse<>();
        r.code = 0;
        r.message = "OK";
        r.data = data;
        return r;
    }

    public static <T> ApiResponse<T> error(int code, String message) {
        ApiResponse<T> r = new ApiResponse<>();
        r.code = code;
        r.message = message;
        return r;
    }

    // getter/setter 省略
}
```

### 4.2 首页聚合接口示例骨架

```java
@RestController
@RequestMapping("/app")
public class HomeController {

    @GetMapping
    public ApiResponse<HomeResponse> getHome() {
        HomeResponse resp = new HomeResponse();
        // TODO: 从数据库 / 配置中心 / 运营后台组装各模块数据
        return ApiResponse.ok(resp);
    }
}
```

`HomeResponse` 中字段建议与本接口文档中的结构保持一一对应，便于前后端同步维护。

---

## 5. 前端对接建议（uni-app）

- 首页首次进入时：
  - 调用 `GET /app` 获取基础头部数据。
  - 分别调用 `GET /app/banner`、`GET /app/category`、`GET /app/content-cards` 获取 3 个独立模块数据。
  - 将模块数据分别写入对应响应式字段，替换当前 `index.vue` 中写死的 `iconList`、`cards` 等常量。
- 需要高频刷新的模块（如秒杀）：
  - 可以额外使用 `GET /app/flash-sale` 做局部刷新。

