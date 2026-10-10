# 项目大框架

日期：2026-10-09  
依据：`D:\doing\new-api` 当前源码，入口是 `main.go`、`router/`、`web/src/`。  
绝对路径：`D:\doing\new-api\ai\PROJECT_FRAMEWORK.md`

## 整个框架是什么

这是一个 Go 进程，加上一套 React 页面。对外默认只有一个 HTTP 端口：3000。

这一个端口同时做三件事，三件事读同一份数据库：

1. 提供网页。
2. 提供网页使用的管理接口，地址以 `/api` 开头。
3. 提供程序调用的模型接口，地址主要是 `/v1`、`/v1beta`、`/mj`、`/pg`，另外还有视频和异步任务接口。

数据库里保存用户、API Key、上游渠道、价格、额度和日志。SQLite、MySQL、PostgreSQL 都可以作为主库。日志库可以单独配置，也支持 ClickHouse。Redis 用于缓存和多进程同步。

网页源码在 `web/`。执行 `bun run build` 后生成 `web/dist`，由 `main.go` 嵌进 Go 程序。开发时页面单独跑在 5173，接口仍转发到 3000。所以 5173 显示的是当前前端源码，3000 显示的是最近一次构建嵌进去的页面。

代码从外到内是这条链路：

```text
浏览器或 SDK
  -> router          按地址分到网页、管理接口或模型接口
  -> middleware      校验登录、API Key、限流，并选择渠道
  -> controller      管理接口和转发入口
  -> relay           模型调用的实际执行
  -> service         可复用的业务规则
  -> model           数据库读写
```

`setting` 放已经加载到内存的配置。`relaykit` 只做文本协议转换。`plugins/tasks` 是异步任务的 JavaScript 插件。这三块被上面的链路调用，不单独对外开端口。

## 从前到后怎么运行

`main.go` 启动时先连接数据库和缓存，加载渠道、价格、系统配置和权限，再启动订阅重置、任务轮询、凭证刷新这些后台任务，最后注册路由。

一次模型调用的顺序是：

1. 用户在网页创建 API Key。Key、用户、分组和额度写入令牌表。
2. 调用方请求 `/v1/chat/completions`，并带上这把 Key。
3. `middleware` 确认 Key 有效，再按模型和分组选择一个可用渠道。
4. `relay` 使用该渠道的适配器请求上游。调用方格式和上游格式不同时，先由 `relaykit` 转换。
5. 上游结果写回调用方。结束后 `service` 按用量扣额度，`model` 写消费日志。
6. 网页上的概览和日志读取这些记录。

视频、音乐这类任务不能在一次响应里返回结果。任务插件先向上游提交任务并记下任务号，后台再轮询；完成后按插件声明的用量结算。

## 后端模块

### router

登记 URL。`/api` 进入管理接口，`/v1` 等进入模型转发，其余页面地址返回前端文件。它决定请求进哪一条路，不在这里写扣费和选渠道的细节。

### middleware

业务函数之前的检查：会话登录、管理员身份、API Key、限流、跨域、语言、请求体大小、审计，以及把模型请求分到渠道。`/v1` 使用 API Key。Playground 的 `/pg/chat/completions` 使用当前登录用户。

### controller

每个 HTTP 接口的处理函数。登录、用户、Key、渠道、模型、兑换码、充值、订阅、日志、系统设置和支付回调都从这里进入。模型调用的统一入口是 `Relay`。这里接收参数并调用下一层。

### service

多处接口共用的规则：渠道选择、额度预扣和结算、文本与图片计费、任务轮询、会话、双因素、Passkey、订阅重置、支付和通知。`service/authz` 用 Casbin 保存角色和权限，并按周期同步到各个进程。

### model

数据库表和查询。对象包括用户、会话、API Key、渠道、模型价格、消费日志、充值、兑换码、订阅、异步任务、任务插件、系统配置和审计。启动时做迁移，同一套代码要能在三种主数据库上运行。

### setting

运行中直接读取的配置：倍率、支付、签到、限流、敏感词、各家模型参数、渠道亲和、控制台内容和计费表达式。管理员在网页保存后，值进数据库；这里提供程序运行时读到的结果。

### relay

执行模型转发。它区分聊天、补全、嵌入、图像、音频、重排、实时连接和异步任务，调用对应上游适配器，收回响应，再交给计费。`relay/channel/` 下一家上游一个目录。`relay/helper` 负责价格、请求校验和流式读取。

### relaykit

独立 Go 模块。它在 OpenAI Chat、OpenAI Responses、Claude Messages、Gemini 之间转换请求、整包响应和流式响应。它不访问数据库，不发送 HTTP，不扣费。

### dto、types、constant

接口、任务和渠道使用的数据结构与常量。各层用同一套字段名传递一次请求的内容。

### common

数据库连接、Redis、JSON 编解码、额度运算、限流、会话 Cookie、邮件、密码和 SSRF 检查。主模块的 JSON 编解码通过这里进行。

### oauth

把 GitHub、Discord、OIDC、Telegram、LinuxDo 和自定义 OAuth 的身份绑定到本系统用户。

### pkg

| 目录 | 作用 |
| --- | --- |
| `pkg/billingexpr` | 用表达式描述一组模型如何计价 |
| `pkg/jsplugin` | 执行 JavaScript 任务插件 |
| `pkg/ionet` | io.net 部署相关调用 |
| `pkg/cachex` | 缓存 |
| `pkg/perf_metrics` | 性能指标 |
| `pkg/wsmanager` | WebSocket 连接管理 |

### plugins/tasks

随程序发布的任务插件：阿里、豆包、Google、海螺、即梦、可灵、Sora、Suno、Vertex、Vidu。插件说明如何提交、如何查询进度、按哪种用量计费。扣费、轮询和写库由 Go 宿主完成。

### i18n、logger

后端文案有英文和中文。日志记录启动、运行错误和请求错误。

### electron

可选桌面壳，用来包住这个服务。渠道、计费和页面业务仍在原来的 Go 与 React 代码里。

## 前端模块

`web/src/routes/` 决定地址对应哪个页面。`web/src/features/` 放该页面的接口、表单和业务组件。多个页面共用的部分在 `web/src/components/`。登录态、系统配置、主题和通知在 `stores/` 与 `context/`。网页访问 `/api` 使用 `lib/http-client.ts`。

登录后只有一套侧边栏。管理员菜单更多，是因为 `use-sidebar-data.ts` 按角色过滤菜单。

### 未登录页面

| 目录 | 内容 |
| --- | --- |
| `features/home` | 站点首页 |
| `features/auth` | 登录、注册、找回密码、Passkey、二次验证 |
| `features/setup` | 首次安装时创建管理员 |
| `features/pricing`、`features/model-pricing` | 对外模型价格 |
| `features/rankings` | 用量排行 |
| `features/about`、`features/legal` | 关于、用户协议、隐私政策 |

### 登录后的个人页面

| 目录 | 内容 | 数据来自 |
| --- | --- | --- |
| `features/dashboard` | 额度、请求量和模型用量 | 消费汇总 |
| `features/keys` | API Key | 令牌表 |
| `features/usage-logs` | 消费日志、审计日志、任务日志 | 日志和任务 |
| `features/playground`、`features/chat` | 在页面里调用模型 | `/pg` 或普通模型接口 |
| `features/wallet` | 余额、充值、订阅购买 | 充值和订阅 |
| `features/profile` | 个人资料和偏好 | 用户资料 |
| `features/security` | 密码、双因素、Passkey、个人访问令牌 | 账号安全 |

### 管理员页面

| 目录 | 内容 |
| --- | --- |
| `features/channels` | 上游渠道的地址、密钥、模型、分组和测试 |
| `features/models` | 模型元数据、厂商、价格和同步 |
| `features/users` | 用户、额度、分组和状态 |
| `features/redemption-codes` | 兑换码 |
| `features/subscriptions` | 订阅套餐 |
| `features/task-plugins` | 任务插件的查看、绑定和调试 |
| `features/system-info` | 当前进程和多节点状态 |
| `features/performance-metrics` | 性能指标 |
| `features/system-settings` | 站点与品牌、认证、计费与支付、模型参数、请求策略、安全限流、控制台内容、运维 |

系统设置修改的是 `setting/` 和数据库中的配置。保存后的生效时间，由对应配置的加载函数和 `main.go` 里的周期同步决定。

### 共用部分

| 目录 | 作用 |
| --- | --- |
| `components/layout` | 侧边栏、顶栏、页面标题 |
| `components/ui` | 按钮、输入框、弹窗、表格等基础控件 |
| `components/data-table` | 管理页共用的查询、筛选、排序和分页 |
| `components/ai-elements` | Playground 中模型回复、推理过程和工具调用的展示 |
| `i18n` | 界面语言：en、zh、zh-TW、fr、ja、ru、vi。翻译键是英文原句 |

## 之后查代码的顺序

查页面：先看 `web/src/routes` 的地址，再看 `features/<名称>/api.ts`，然后按其中的 `/api` 路径找到 `router`、`controller`、`service`、`model`。

查模型调用：从 `router/relay-router.go` 进入 `controller.Relay`，再看 `relay/channel/<上游>`。扣费看 `service` 里的额度与计费，记录看 `model` 里的日志。

查某项系统设置何时生效：先看它写入哪张配置表，再看 `setting/` 的加载函数和 `main.go` 的同步任务。
