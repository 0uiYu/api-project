# 当前前端地图

扫描日期：2026-10-06  
扫描根目录：`D:\doing\new-api\web`  
路由事实来源：`web/src/routeTree.gen.ts` 与 `web/src/routes/**`  
API 事实来源：`web/src` 中非测试代码的 `api.get/post/put/patch/delete` 与 `/api/` 字面量  

本文件是只读分析产物。本次没有修改源码、配置、数据库或依赖。

## 1. 结论

当前前端仍是 New API 控制台，不是一套已换牌的独立产品。默认名称是 `New API`，运行时名称、Logo、页脚 HTML 来自 `GET /api/status`。

路由由 TanStack Router 文件路由生成。登录后的页面都挂在无路径布局 `/_authenticated` 下。角色只有四档：访客 `0`、用户 `1`、管理员 `10`、超级管理员 `100`（`web/src/lib/roles.ts`）。

侧边栏隐藏和顶栏隐藏大多只影响菜单。除 Playground 外，直接输入 URL 仍能打开页面。管理员接口是否拒绝，由后端决定；前端角色守卫只挡一部分页面。

删除 React 页面不会删除 Go 路由。会影响后端行为的，是那些写入渠道、令牌、用户、计费、系统选项和任务插件的页面。

## 2. 技术栈与入口

| 项 | 源码位置 | 事实 |
| --- | --- | --- |
| 包名 | `web/package.json` | `newapi-web` |
| UI | `web/AGENTS.md` | React 19、TypeScript、TanStack Router / Query / Table、Zustand、i18next、Tailwind、Base UI |
| 构建 | `web/rsbuild.config.ts` | 入口 `src/main.tsx`，HTML 模板 `index.html`，favicon `public/favicon.ico` |
| HTTP | `web/src/lib/http-client.ts` | axios `baseURL: ''`，`withCredentials: true` |
| 开发代理 | `web/rsbuild.config.ts` | `/api`、`/v1`、`/mj`、`/pg` 代理到 `VITE_REACT_APP_SERVER_URL`，默认 `http://localhost:3000` |
| 启动 | `web/src/main.tsx` | 创建 router，挂 `routeTree`，并用缓存的 `/api/status` 改 `document.title` 和 favicon |

根路由 `web/src/routes/__root.tsx` 在每次导航前做两件事：

1. `resolveLegacyRoute()` 把旧 `/console/*`、`/login`、`/forbidden` 重定向到新路径（`web/src/lib/legacy-route.ts`）。
2. 调用 `GET /api/setup`（`web/src/features/setup/api.ts` 的 `getSetupStatus`）。若实例未初始化，重定向到 `/setup`。

## 3. 路由总表

路径组 `(auth)`、`(errors)`、`_authenticated` 不出现在 URL 里。下表 URL 以 `routeTree.gen.ts` 为准。

### 3.1 PUBLIC

| URL | 路由文件 | 页面组件 | 守卫 | 风险 |
| --- | --- | --- | --- | --- |
| `/` | `web/src/routes/index.tsx` | `web/src/features/home/index.tsx` `Home` | 无 | LOW |
| `/about/` | `web/src/routes/about/index.tsx` | `web/src/features/about` `About` | 无 | LOW |
| `/pricing/` | `web/src/routes/pricing/index.tsx` | `web/src/features/pricing` `Pricing` | `HeaderNavModules.pricing`；可要求登录 | LOW |
| `/pricing/$modelId/` | `web/src/routes/pricing/$modelId/index.tsx` | 同上，模型详情 | 同上 | LOW |
| `/rankings/` | `web/src/routes/rankings/index.tsx` | `web/src/features/rankings` `Rankings` | `HeaderNavModules.rankings`；可要求登录 | LOW |
| `/privacy-policy` | `web/src/routes/privacy-policy.tsx` | `web/src/features/legal` `PrivacyPolicy` | 无 | LOW |
| `/user-agreement` | `web/src/routes/user-agreement.tsx` | `web/src/features/legal` `UserAgreement` | 无 | LOW |
| `/setup/` | `web/src/routes/setup/index.tsx` | `web/src/features/setup` `SetupWizard` | 已初始化则回 `/` | HIGH |
| `/oauth/$provider` | `web/src/routes/oauth/$provider.tsx` | 同文件 `OAuthCallback` | 无 | HIGH |
| `/sign-in` | `web/src/routes/(auth)/sign-in.tsx` | `web/src/features/auth/sign-in` | 已登录则去 redirect 或 `/dashboard` | HIGH |
| `/sign-up` | `web/src/routes/(auth)/sign-up.tsx` | `web/src/features/auth/sign-up` | 已登录则去 `/dashboard` | HIGH |
| `/register` | `web/src/routes/(auth)/register.tsx` | 无页面 | 永久重定向到 `/sign-up` | LOW |
| `/forgot-password` | `web/src/routes/(auth)/forgot-password.tsx` | `web/src/features/auth/forgot-password` | 无 | MEDIUM |
| `/reset` | `web/src/routes/(auth)/reset.tsx` | `web/src/features/auth/reset-password-confirm` | 无 | MEDIUM |
| `/user/reset` | `web/src/routes/(auth)/user/reset.tsx` | 同上 | 无 | MEDIUM |
| `/otp` | `web/src/routes/(auth)/otp.tsx` | `web/src/features/auth/otp` | 无 | MEDIUM |
| `/oauth` | `web/src/routes/(auth)/oauth.tsx` | 同文件 `OAuthComponent`，处理微信等回跳 | 无 | HIGH |
| `/401` | `web/src/routes/(errors)/401.tsx` | `web/src/features/errors/unauthorized-error` | 无 | LOW |
| `/403` | `web/src/routes/(errors)/403.tsx` | `web/src/features/errors/forbidden` | 无 | LOW |
| `/404` | `web/src/routes/(errors)/404.tsx` | `web/src/features/errors/not-found-error` | 无 | LOW |
| `/500` | `web/src/routes/(errors)/500.tsx` | `web/src/features/errors/general-error` | 无 | LOW |
| `/503` | `web/src/routes/(errors)/503.tsx` | `web/src/features/errors/maintenance-error` | 无 | LOW |

顶栏在 `docs_link` 为空时指向 `/docs`（`web/src/hooks/use-top-nav-links.ts`）。`routeTree.gen.ts` 没有 `/docs` 路由，这个地址会落到 404。

### 3.2 USER

这些路由先经过 `web/src/routes/_authenticated/route.tsx`：`resolveAuthentication()` 后，没有 `auth.user` 或 `auth.accessToken` 就去 `/sign-in`。布局是 `web/src/components/layout/components/authenticated-layout.tsx`。

| URL | 路由文件 | 页面组件 | 额外守卫 | 风险 |
| --- | --- | --- | --- | --- |
| `/dashboard/` | `web/src/routes/_authenticated/dashboard/index.tsx` | 无 | 重定向到 `/dashboard/overview` | LOW |
| `/dashboard/$section` | `web/src/routes/_authenticated/dashboard/$section.tsx` | `web/src/features/dashboard` `Dashboard` | section 必须是 `overview`、`models`、`flow`、`users` | MEDIUM |
| `/keys/` | `web/src/routes/_authenticated/keys/index.tsx` | `web/src/features/keys` `ApiKeys` | 仅登录 | HIGH |
| `/usage-logs/` | `web/src/routes/_authenticated/usage-logs/index.tsx` | 无 | 重定向到 `/usage-logs/common` | LOW |
| `/usage-logs/$section` | `web/src/routes/_authenticated/usage-logs/$section.tsx` | `web/src/features/usage-logs` `UsageLogs` | section：`common`、`drawing`、`task` | MEDIUM |
| `/usage-logs/audit` | `web/src/routes/_authenticated/usage-logs/audit.tsx` | `web/src/features/usage-logs/audit` `AuditLogs` | 仅登录；全站范围另要权限 | MEDIUM |
| `/wallet/` | `web/src/routes/_authenticated/wallet/index.tsx` | `web/src/features/wallet` `Wallet` | 仅登录 | HIGH |
| `/profile/` | `web/src/routes/_authenticated/profile/index.tsx` | `web/src/features/profile` `Profile` | 仅登录 | MEDIUM |
| `/security/` | `web/src/routes/_authenticated/security/index.tsx` | `web/src/features/security` `Security` | 仅登录 | HIGH |
| `/playground/` | `web/src/routes/_authenticated/playground/index.tsx` | `web/src/features/playground` `Playground` | `isSidebarModuleEnabled('chat','playground')` 为假则回 `/dashboard` | MEDIUM |
| `/chat/$chatId` | `web/src/routes/_authenticated/chat/$chatId.tsx` | 同文件 `ChatRouteComponent` | `chatId` 不是整数则回 `/dashboard` | MEDIUM |
| `/chat2link` | `web/src/routes/_authenticated/chat2link.tsx` | 同文件 `Chat2LinkPage` | 仅登录 | MEDIUM |
| `/errors/$error` | `web/src/routes/_authenticated/errors/$error.tsx` | 按参数选错误组件 | 仅登录 | LOW |

`/dashboard/users` 的标签只对 `role >= 10` 显示（`web/src/features/dashboard/index.tsx`），但路由不检查角色。普通用户打开该 URL 时，页面仍会挂载 `LazyUserCharts` 并请求 `GET /api/data/users`。

### 3.3 ADMIN

角色判断是 `auth.user.role < ROLE.ADMIN` 则 `redirect({ to: '/403' })`。`ROLE.ADMIN` 是 `10`。

| URL | 路由文件 | 页面组件 | 风险 |
| --- | --- | --- | --- |
| `/channels/` | `web/src/routes/_authenticated/channels/index.tsx` | `web/src/features/channels` `Channels` | HIGH |
| `/models/` | `web/src/routes/_authenticated/models/index.tsx` | 无，重定向到 `/models/metadata` | HIGH |
| `/models/$section` | `web/src/routes/_authenticated/models/$section.tsx` | `web/src/features/models` `Models` | HIGH |
| `/users/` | `web/src/routes/_authenticated/users/index.tsx` | `web/src/features/users` `Users` | HIGH |
| `/redemption-codes/` | `web/src/routes/_authenticated/redemption-codes/index.tsx` | `web/src/features/redemption-codes` `Redemptions` | HIGH |
| `/subscriptions/` | `web/src/routes/_authenticated/subscriptions/index.tsx` | `web/src/features/subscriptions` `Subscriptions` | HIGH |

模型子页 id：`metadata`、`vendors`、`deployments`（`web/src/features/models/section-registry.tsx`）。

### 3.4 SUPER ADMIN

判断是 `role !== 100`，不是 `>= 100`。

| URL | 路由文件 | 页面组件 | 风险 |
| --- | --- | --- | --- |
| `/system-info/` | `web/src/routes/_authenticated/system-info/index.tsx` | `web/src/features/system-info` `SystemInfo` | MEDIUM |
| `/task-plugins/` | `web/src/routes/_authenticated/task-plugins/index.tsx` | `web/src/features/task-plugins` `TaskPlugins` | HIGH |
| `/system-settings` | `web/src/routes/_authenticated/system-settings/route.tsx` | `web/src/features/system-settings/index.tsx`，只渲染 `<Outlet />` | HIGH |
| `/system-settings/` | `web/src/routes/_authenticated/system-settings/index.tsx` | 无 | 重定向到 `/system-settings/site` |

系统设置子树都继承父级超级管理员守卫。每个目录的 `index.tsx` 再重定向到默认 section。

| 前缀 | 默认 section | 页面组件 | section id |
| --- | --- | --- | --- |
| `/system-settings/site` | `system-info` | `features/system-settings/site` `SiteSettings` | `system-info`、`notice`、`header-navigation`、`sidebar-modules` |
| `/system-settings/auth` | `basic-auth` | `features/system-settings/auth` `AuthSettings` | `basic-auth`、`oauth`、`passkey`、`bot-protection`、`custom-oauth` |
| `/system-settings/billing` | `quota` | `features/system-settings/billing` `BillingSettings` | `quota`、`currency`、`model-pricing`、`group-pricing`、`payment`、`checkin` |
| `/system-settings/models` | `global` | `features/system-settings/models` `ModelSettings` | `global`、`gemini`、`claude`、`grok`、`model-deployment` |
| `/system-settings/request-policies` | `routing` | `features/system-settings/request-policies` `RequestPolicies` | `filtering`、`routing`、`health` |
| `/system-settings/security` | `rate-limit` | `features/system-settings/security` `SecuritySettings` | `rate-limit`、`ssrf`、`token-limits` |
| `/system-settings/content` | `dashboard` | `features/system-settings/content` `ContentSettings` | `dashboard`、`announcements`、`api-info`、`faq`、`uptime-kuma`、`chat`、`drawing` |
| `/system-settings/operations` | `behavior` | `features/system-settings/operations` `OperationsSettings` | `behavior`、`alerts`、`email`、`worker`、`logs`、`performance`、`update-checker` |

section 定义在对应的 `section-registry.tsx`。非法 section 会重定向到该组默认值。

### 3.5 旧路径

`web/src/lib/legacy-route.ts`：

| 旧路径 | 新路径 |
| --- | --- |
| `/login` | `/sign-in` |
| `/forbidden` | `/403` |
| `/console` | `/dashboard` |
| `/console/topup` | `/wallet` |
| `/console/token` | `/keys` |
| `/console/log` | `/usage-logs` |
| `/console/midjourney` | `/usage-logs/drawing` |
| `/console/task` | `/usage-logs/task` |
| `/console/channel` | `/channels` |
| `/console/user` | `/users` |
| `/console/redemption` | `/redemption-codes` |
| `/console/personal` | `/profile` |
| `/console/playground` | `/playground` |
| `/console/subscription` | `/subscriptions` |
| `/console/models` | `/models` |
| `/console/deployment` | `/models/deployments` |
| `/console/chat/:id` | `/chat/:id` |
| `/console/setting?tab=` | 见文件内 `legacySettingsTabs` |
| 其他 `/console/*` | `/dashboard` |

## 4. Sidebar、Header、Navigation

### 4.1 登录后顶栏

`web/src/components/layout/components/app-header.tsx` 组合：

- `SystemBrand`：Logo + `status.system_name`，点击回 `/`
- `TopNav`：链接来自 `useTopNavLinks()`
- `Search`：命令菜单，条目来自当前侧边栏
- `LanguageSwitcher`
- `NotificationPopover`：`useNotifications()`
- `SystemUpdateAction`
- `ConfigDrawer`
- `ProfileDropdown`

### 4.2 公开顶栏

`web/src/components/layout/components/public-header.tsx` 与 `public-navigation.tsx` 使用同一套 `useTopNavLinks()`。

`web/src/hooks/use-top-nav-links.ts` 读取 `status.HeaderNavModules`：

| 键 | 默认 | 链接 |
| --- | --- | --- |
| `home` | 显示 | `/` |
| `console` | 显示 | `/dashboard` |
| `pricing` | `{ enabled: true, requireAuth: false }` | `/pricing`，文案键 `Model Square` |
| `rankings` | 同上 | `/rankings` |
| `docs` | 显示 | `status.docs_link`，否则 `/docs` |
| `about` | 显示 | `/about` |

解析函数在 `web/src/lib/nav-modules.ts`。`pricing` 和 `rankings` 的路由 `beforeLoad` 会再查一次；模块关闭则回 `/`，`requireAuth` 且未登录则去 `/sign-in`。

### 4.3 侧边栏

数据：`web/src/hooks/use-sidebar-data.ts`。  
过滤：`web/src/hooks/use-sidebar-view.ts` 先按角色，再交给 `web/src/hooks/use-sidebar-config.ts`。

| 分组 id | 可见角色 | 条目 | URL |
| --- | --- | --- | --- |
| `chat` | 所有登录用户 | Playground | `/playground` |
| `chat` | 所有登录用户 | Chat（预设列表，不是固定 URL） | 由 `status.Chats` 生成 |
| `general` | 所有登录用户 | Overview | `/dashboard/overview` |
| `general` | 所有登录用户 | Dashboard | `/dashboard/models` |
| `general` | 所有登录用户 | API Keys | `/keys` |
| `general` | 所有登录用户 | Usage Logs | `/usage-logs/common` |
| `general` | 所有登录用户 | Audit Logs | `/usage-logs/audit` |
| `general` | 所有登录用户 | Task Logs | `/usage-logs/task`，同时激活 `/usage-logs/drawing` |
| `personal` | 所有登录用户 | Wallet | `/wallet` |
| `personal` | 所有登录用户 | Profile | `/profile` |
| `personal` | 所有登录用户 | Security & Access | `/security` |
| `admin` | `role >= 10` | Channels | `/channels` |
| `admin` | `role >= 10` | Models | `/models/metadata` |
| `admin` | `role >= 10` | Users | `/users` |
| `admin` | `role >= 10` | Redemption Codes | `/redemption-codes` |
| `admin` | `role >= 10` | Subscriptions | `/subscriptions` |
| `admin` | `role === 100` | System Info | `/system-info` |
| `admin` | `role === 100` | Task Plugins | `/task-plugins` |
| `admin` | `role === 100` | System Settings | `/system-settings/site` |

进入 `/system-settings/*` 后，根侧边栏换成 `web/src/components/layout/config/system-settings.config.ts` 的 `SYSTEM_SETTINGS_VIEW`。返回目标是 `/dashboard/overview`。这是目前唯一注册的嵌套侧边栏（`web/src/components/layout/lib/sidebar-view-registry.ts`）。

### 4.4 头像菜单

`web/src/components/profile-dropdown.tsx`：

- Profile → `/profile`
- Security，受侧边栏模块 `/security` 控制
- Wallet，受 `/wallet` 控制
- System Settings，仅超级管理员，去 `/system-settings/site/system-info`
- Sign out

## 5. 页面与 API

调用位置写的是定义该请求的文件。页面通过 feature 的 hook 使用这些函数。

### 5.1 全局，所有页面

| 方法与路径 | 调用位置 | 用途 |
| --- | --- | --- |
| `GET /api/status` | `web/src/lib/api.ts` `getStatus` | 名称、Logo、导航开关、公告 |
| `GET /api/notice` | `web/src/lib/api.ts` `getNotice` | 顶栏通知 |
| `GET /api/setup` | `web/src/features/setup/api.ts` | 根守卫 |
| `GET /api/user/self` | `web/src/lib/api.ts` `getSelf` | 当前用户 |
| `PUT /api/user/self` | `web/src/components/language-switcher.tsx` | 保存界面语言 |
| 刷新会话 | `web/src/lib/auth-session.ts` 中的 `/api/user/auth/refresh` | 登录态 |

### 5.2 PUBLIC 页面

| 页面 | API | 调用位置 |
| --- | --- | --- |
| 首页 | `GET /api/home_page_content` | `web/src/features/home/api.ts` |
| 关于 | `GET /api/about` | `web/src/features/about/api.ts` |
| 模型广场 | `GET /api/pricing` | `web/src/features/pricing/api.ts` |
| 排行榜 | `GET /api/rankings` | `web/src/features/rankings/api.ts` |
| 用户协议 | `GET /api/user-agreement` | `web/src/features/legal/api.ts` |
| 隐私政策 | `GET /api/privacy-policy` | `web/src/features/legal/api.ts` |
| 初始化 | `GET/POST /api/setup` | `web/src/features/setup/api.ts` |

首页在 `web/src/features/home/index.tsx`：有自定义内容时渲染 iframe、HTML 或 Markdown；否则渲染 `Hero`、`Stats`、`Features`、`HowItWorks`、`CTA` 和 `Footer`。

### 5.3 认证

`web/src/features/auth/api.ts`：

- `POST /api/user/login`
- `POST /api/user/login/2fa`
- `POST /api/user/auth/logout`
- `GET /api/reset_password`
- `POST /api/user/register`
- `GET /api/verification`
- `POST /api/oauth/state`
- `GET /api/oauth/wechat`
- `GET /api/oauth/telegram/login`
- `POST /api/oauth/email/bind`

相关文件：

- `web/src/features/auth/lib/password-encryption.ts`：`/api/user/login/encryption-key`
- `web/src/features/auth/passkey/api.ts`：`/api/user/passkey` 及 register/login/verify
- `web/src/features/auth/secure-verification/api.ts`：`/api/verify`、`/api/verify/methods`、登录二次验证
- `web/src/features/auth/reset-password-confirm/index.tsx`：`POST /api/user/reset`
- `web/src/routes/oauth/$provider.tsx`：`GET /api/oauth/${provider}`

### 5.4 USER 页面

**仪表盘** `web/src/features/dashboard/api.ts`

- 普通用户：`GET /api/data/self`、`GET /api/data/flow/self`
- 管理员：`GET /api/data`、`GET /api/data/flow`、`GET /api/data/users`
- `GET /api/uptime/status`
- 性能卡片另用 `web/src/features/performance-metrics/api.ts`：`GET /api/perf-metrics`、`GET /api/perf-metrics/summary`

子页：`overview`、`models`（模型调用分析）、`flow`、`users`（仅管理员标签）。

**API Keys** `web/src/features/keys/api.ts`

- `GET/POST/PUT /api/token/`
- `GET /api/token/search`、`GET /api/token/${id}`、`GET /api/token/auto-groups`
- `DELETE /api/token/${id}/`
- `POST /api/token/batch`、`POST /api/token/${id}/key`、`POST /api/token/batch/keys`
- `PUT /api/token/?status_only=true`

聊天预设取密钥时复用这里的列表和 `fetchTokenKey`（`web/src/features/chat/hooks/use-active-chat-key.ts`）。

**用量日志** `web/src/features/usage-logs/api.ts`

- 普通用户：`GET /api/log/self`、`GET /api/log/self/stat`
- 管理员查看全部：`GET /api/log`、`GET /api/log/stat`
- 绘图：`/api/mj` 与 `/api/mj/self`
- 任务：`/api/task` 与 `/api/task/self`
- `GET /api/task/${id}/artifacts`
- `GET /api/user/${userId}`

**审计** `web/src/features/usage-logs/audit/api.ts`

- 自己：`GET /api/audit/self`
- 全部：`GET /api/audit`，页面要求 `role >= 10` 且 `audit:read`（`web/src/features/usage-logs/audit/index.tsx`）

**钱包** `web/src/features/wallet/api.ts`

- `GET /api/user/topup/info`
- `POST /api/user/topup`（兑换码）
- `GET /api/user/topup/self`，管理员历史用 `GET /api/user/topup`
- `POST /api/user/topup/complete`
- 易支付 `POST /api/user/amount`、`POST /api/user/pay`
- Stripe `POST /api/user/stripe/amount`、`POST /api/user/stripe/pay`
- Creem `POST /api/user/creem/pay`
- Waffo `POST /api/user/waffo/amount`、`POST /api/user/waffo/pay`
- Waffo Pancake `POST /api/user/waffo-pancake/amount`、`POST /api/user/waffo-pancake/pay`
- 邀请 `GET /api/user/aff`、`POST /api/user/aff_transfer`
- 用户侧订阅购买在 `web/src/features/subscriptions/api.ts`：`GET /api/subscription/self`、`GET /api/subscription/plans`，以及 stripe/creem/waffo-pancake/epay/balance 的 pay

**个人资料** `web/src/features/profile/api.ts`

- `GET/PUT/DELETE /api/user/self`
- `PUT /api/user/setting`
- 邮箱、微信、Telegram 绑定
- `GET /api/user/sessions`、`DELETE /api/user/sessions/${sid}`、`POST /api/user/sessions/revoke-others`
- `GET /api/user/oauth/bindings`、`DELETE /api/user/oauth/bindings/${providerId}`
- `GET/POST /api/user/checkin`

签到卡片只在 `status.checkin_enabled === true` 时渲染。侧边栏自选模块卡片在 `permissions.sidebar_settings !== false` 时渲染（`web/src/features/profile/index.tsx`）。

**安全** `web/src/features/security/api.ts` 与 `web/src/lib/api.ts`

- 访问令牌 `/api/user/access_tokens`
- 2FA：`/api/user/2fa/status|setup|enable|disable|backup_codes`
- Passkey 见认证 API
- 账号绑定会再请求 `GET /api/oauth/${provider}`（`web/src/features/security/components/account-bindings.tsx`）

**Playground** `web/src/features/playground/api.ts`

- `POST /pg/chat/completions`
- `GET /api/user/models`
- `GET /api/user/self/groups`

**聊天**

预设来自 `status.Chats`，解析在 `web/src/features/chat/hooks/use-chat-presets.ts`。`/chat/$chatId` 把预设 URL 放进 iframe。需要密钥时调用 Keys API。`/chat2link` 打开第一个 `type === 'web'` 的预设。

### 5.5 ADMIN 页面

**渠道** `web/src/features/channels/api.ts`

`/api/channel` 的列表、搜索、创建、更新、删除、批量、状态、测试、余额、模型、复制、修复、多密钥、标签、Ollama、Codex usage。  
另有 `GET /api/task_plugin_options`、`GET /api/channel/default_base_urls`、`GET /api/prefill_group`。  
上游批量检测在 `web/src/features/channels/hooks/use-channel-upstream-updates.ts`。

按钮是否可写，由 `hasPermission` 看 `channel` 的 `operate`、`write`、`sensitive_write`、`bind`（`web/src/lib/admin-permissions.ts`）。超级管理员始终通过。

**模型** `web/src/features/models/api.ts`

- `/api/models/`、search、sync_upstream、missing、delete
- `/api/vendors/`
- `/api/prefill_group`
- `/api/deployments/` 及容器、日志、硬件、地区、估价、延期

供应商批量操作在 `web/src/features/models/vendor-api.ts`。

**用户** `web/src/features/users/api.ts`

- `/api/user/`、search、`/api/user/${id}`、`POST /api/user/manage`
- `DELETE /api/user/${id}/reset_passkey`、`DELETE /api/user/${id}/2fa`
- `GET /api/group/`
- `GET /api/authz/catalog`
- 解绑 OAuth

**兑换码** `web/src/features/redemption-codes/api.ts`：`/api/redemption/` 的增删改查、搜索、批量、清理无效码。

**订阅管理** `web/src/features/subscriptions/api.ts`：`/api/subscription/admin/plans` 与用户订阅的创建、作废、删除、重置。

### 5.6 SUPER ADMIN 页面

**系统信息** `web/src/features/system-info/api.ts`

- `GET /api/system-info/instances`
- `DELETE /api/system-info/stale-instances`
- `DELETE /api/system-info/instances/${nodeName}`
- `DELETE /api/system-task/history`

**任务插件** `web/src/features/task-plugins/api.ts`

- `GET/POST /api/plugin/task`
- 激活、状态、版本、dryrun、marketplace sources
- 图标路径 `/api/plugin/task/${key}/icon`
- 同时读写 `GET/PUT /api/option/`

**系统设置** `web/src/features/system-settings/api.ts`

- `GET/PUT /api/option/`
- `PUT /api/option/passkey/domains`
- `POST /api/option/payment_compliance`
- `POST /api/option/rest_model_ratio`
- `GET /api/ratio_sync/channels`、`POST /api/ratio_sync/fetch`
- 日志清理任务 `/api/system-task/*`

分组专用接口：

| 区域 | 文件 | 路径 |
| --- | --- | --- |
| 模型价格编辑器 | `web/src/features/model-pricing/api.ts` | `/api/option/model_pricing` 及 convert、preview |
| 请求策略 | `web/src/features/system-settings/request-policies/api.ts` | `GET/PATCH /api/option/request_policy` |
| 自定义 OAuth | `web/src/features/system-settings/auth/custom-oauth/api.ts` | `/api/custom-oauth-provider/` |
| 渠道亲和缓存 | `web/src/features/system-settings/general/channel-affinity/api.ts` | `/api/option/channel_affinity_cache`、`/api/log/channel_affinity_usage_cache` |
| Waffo Pancake | `web/src/features/system-settings/integrations/waffo-pancake-api.ts` | `/api/option/waffo-pancake/catalog|pair|save` |
| 性能 | `web/src/features/system-settings/maintenance/performance-section.tsx` | `/api/performance/stats`、`disk_cache`、`reset_stats`、`gc` |
| 日志文件 | `web/src/features/system-settings/maintenance/log-settings-section.tsx` | `GET/DELETE /api/performance/logs` |

更新检查不走本站 API。`web/src/features/system-update/api.ts` 请求：

`https://api.github.com/repos/0uiYu/api-project/releases?per_page=100`

按钮只对 `role >= 10` 显示（`web/src/features/system-update/system-update-action.tsx`）。

## 6. 主要组件

| 组件 | 路径 | 谁在用 |
| --- | --- | --- |
| `AuthenticatedLayout` | `web/src/components/layout/components/authenticated-layout.tsx` | 所有登录页 |
| `AppSidebar` / `NavGroup` | `web/src/components/layout/components/` | 侧边栏 |
| `PublicLayout` / `Footer` | 同目录 | 首页、关于、协议、模型广场、排行榜 |
| `SectionPageLayout` | `section-page-layout.tsx` | 控制台列表页 |
| `DataTable` | `web/src/components/data-table/` | Keys、渠道、用户、日志、兑换码等 |
| `ProfileDropdown` | `web/src/components/profile-dropdown.tsx` | 顶栏 |
| `CommandMenu` | `web/src/components/command-menu.tsx` | 搜索，跳转侧边栏 URL |
| `LanguageSwitcher` | `web/src/components/language-switcher.tsx` | 顶栏，并 `PUT /api/user/self` |
| `SystemBrand` | `web/src/components/layout/components/system-brand.tsx` | 顶栏与侧边栏品牌 |
| `ui/*` | `web/src/components/ui/` | 基础控件，约 67 个文件 |

业务实现都在 `web/src/features/<feature>/`。通用请求不要在页面里新写 axios 实例。

## 7. 页面依赖

```text
/api/status
  ├─ 品牌、favicon、顶栏、侧边栏开关
  ├─ 首页是否替换成自定义内容
  ├─ 聊天预设 /chat/$chatId、/chat2link
  ├─ 公告、签到开关、协议链接开关
  └─ Playground 路由是否放行

/sign-in
  └─ /_authenticated/*
       ├─ /dashboard/* ── /api/data*
       ├─ /keys ── /api/token
       │    └─ /chat/$chatId 复用 token key
       ├─ /usage-logs/* ── /api/log /api/mj /api/task
       ├─ /wallet ── 充值、兑换码、订阅购买
       ├─ /profile ── /api/user/self、checkin
       ├─ /security ── 2FA、Passkey、access token、会话
       └─ role>=10
            ├─ /channels ── /api/channel
            ├─ /models/* ── /api/models /api/vendors /api/deployments
            ├─ /users ── /api/user /api/authz/catalog
            ├─ /redemption-codes
            ├─ /subscriptions
            └─ role===100
                 ├─ /system-info
                 ├─ /task-plugins
                 └─ /system-settings/* ── /api/option 及专用 option 接口
                      └─ 写入的值反过来改变上面所有页面的开关和计费
```

公开页不依赖登录，但 `/pricing`、`/rankings` 可以被状态接口要求登录。`/setup` 成功后回到 `/`。

## 8. 权限控制

三层同时存在，不要混成一层。

1. **路由角色**  
   登录：`/_authenticated/route.tsx`。  
   管理员：渠道、模型、用户、兑换码、订阅，`role >= 10`。  
   超级管理员：系统信息、任务插件、整个系统设置，`role === 100`。

2. **细粒度权限**  
   `web/src/lib/admin-permissions.ts` 的 `hasPermission`。超级管理员恒为真。管理员看 `user.permissions.admin_permissions[resource][action]`。  
   前端写死的资源名只有 `audit`、`channel`、`task_plugin`。完整目录来自 `GET /api/authz/catalog`，用户编辑表单使用它。  
   渠道的写、敏感写、密钥查看、插件绑定都在渠道组件里再判断。审计全站视图要求 `audit:read`。

3. **菜单配置，不是鉴权**  
   - `status.SidebarModulesAdmin`：管理员关掉某项，所有人侧边栏都没有。  
   - `user.sidebar_modules`：只能再隐藏，不能把管理员关掉的项打开。  
   - `permissions.sidebar_settings === false` 时忽略用户层，避免旧值把根账号锁在外面。  
   映射表在 `web/src/hooks/use-sidebar-config.ts` 的 `URL_TO_CONFIG_MAP`。  
   `/system-info`、`/task-plugins` 不在这张表里，侧边栏配置关不掉它们，只能靠角色。  
   配置缺失时函数默认显示。  
   **只有 Playground 的路由读取了这个开关。** 其他页面关掉菜单后，URL 仍可打开。

用量日志还有视图范围：`role < 10` 只能看自己；管理员可看 admin 范围；超级管理员可看 root 范围（`web/src/features/usage-logs/components/usage-logs-provider.tsx`）。

## 9. 品牌

| 项 | 位置 | 当前值 |
| --- | --- | --- |
| HTML title | `web/index.html` | `New API` |
| meta description | 同上 | `Unified AI API gateway and admin dashboard.` |
| 运行时 title | `web/src/main.tsx` | `status.system_name`，否则保持 HTML |
| 默认名 | `web/src/lib/constants.ts` | `DEFAULT_SYSTEM_NAME = 'New API'` |
| 默认 Logo | 同上 | `/logo.png` |
| Logo 文件 | `web/public/logo.png` | 静态文件 |
| favicon 构建 | `web/rsbuild.config.ts` | `web/public/favicon.ico` |
| 运行时 favicon | `use-system-config.ts` 调用 `applyFaviconToDom(logo)` | 用状态里的 Logo 覆盖 |
| SVG 标识 | `web/src/assets/logo.tsx` | `id="newapi-logo"`，`<title>New API</title>` |
| 侧边栏/顶栏名 | `system-brand.tsx` | `status.system_name`，否则 `New API` |
| 页脚名 | `web/src/components/layout/components/footer.tsx` | 系统名，否则 `New API` |
| 页脚 HTML | 同上 | `status` 映射出的 `footerHtml` 优先，用 `dangerouslySetInnerHTML` |
| 演示站外链 | 同上，仅 `demoSiteEnabled` | `https://docs.newapi.pro/...`，以及 one-api、midjourney-proxy、new-api-key-tool 的 GitHub |
| 协议链接 | 同上 | `user_agreement_enabled`、`privacy_policy_enabled` |
| 主题存储键 | `web/src/context/__tests__/theme-preferences.test.tsx` 所覆盖的键 | `newapi:theme:v1:*` |
| 聊天链接默认名 | `web/src/features/chat/lib/chat-links.ts` | 查询参数 `name=New API` |
| 包名 | `web/package.json` | `newapi-web` |
| 更新仓库 | `web/src/features/system-update/api.ts` | `0uiYu/api-project` |

公开目录里还有支付图：`pay-apple.png`、`pay-card.png`、`pay-google.png`、`waffo-logo-dark.svg`、`waffo-logo-light.svg`。

站点名称、Logo、页脚、关于、首页内容、文档链接、协议正文的编辑入口是 `/system-settings/site/system-info`（`web/src/features/system-settings/site/section-registry.tsx`）。

本次扫描没有发现第二套产品名替换了 `New API`。文案和组件默认值仍写着 New API。fork 上能直接看到的品牌差异是更新检查指向 `0uiYu/api-project`。

## 10. 国际化

配置：`web/src/i18n/config.ts`。  
语言列表：`web/src/i18n/languages.ts`。

| 代码 | 界面名 | 文件 | 叶子键数量 |
| --- | --- | --- | --- |
| `en` | English | `web/src/i18n/locales/en.json` | 6854 |
| `zhCN` | 简体中文 | `web/src/i18n/locales/zh.json` | 6854 |
| `zhTW` | 繁體中文 | `web/src/i18n/locales/zh-TW.json` | 6854 |
| `fr` | Français | `web/src/i18n/locales/fr.json` | 6854 |
| `ja` | 日本語 | `web/src/i18n/locales/ja.json` | 6854 |
| `ru` | Русский | `web/src/i18n/locales/ru.json` | 6854 |
| `vi` | Tiếng Việt | `web/src/i18n/locales/vi.json` | 6854 |

键是英文句子，不是 `dashboard.title` 这种短键。`fallbackLng` 是 `en`。检测顺序是 localStorage，然后浏览器。`zh-CN` 会映射成 `zhCN`。

用户切换语言时，`LanguageSwitcher` 把语言写回 `PUT /api/user/self`。

## 11. 哪些是 New API 核心

这些页面和接口对应网关本体：没有它们，转发、鉴权、计费或账号就不能从控制台操作。

| 能力 | 页面 | 后端耦合 |
| --- | --- | --- |
| 初始化、登录、注册、OAuth、2FA、Passkey | `/setup`、`/sign-in`、`/sign-up`、`/oauth/$provider`、`/security` | 会话和账号 |
| API Key | `/keys` | 调用方凭证 |
| 渠道 | `/channels` | 上游路由 |
| 模型、供应商、分组、价格 | `/models/*`、系统设置 Models / Billing | 转发和扣费 |
| 用量与任务日志 | `/usage-logs/*` | 消费记录 |
| 用户与额度 | `/users`、仪表盘 | 谁能调用、余额 |
| 兑换与充值 | `/redemption-codes`、`/wallet` | 额度入账 |
| Playground | `/playground` | `POST /pg/chat/completions` |
| 系统选项 | `/system-settings/*` | `PUT /api/option/`，运行时读取 |
| 公开状态 | 所有页面 | `GET /api/status` |

同一棵树里还有扩展能力，仍然调用真实后端，但不是“打开控制台就能聊天”的最小闭环：订阅、任务插件、io.net 部署、审计、Waffo / Creem / Stripe、排行榜、性能指标、请求策略、自定义 OAuth、多实例系统信息。

## 12. 哪些可以只在前端隐藏

已经有开关，适合只藏界面：

| 目标 | 现成开关 | 限制 |
| --- | --- | --- |
| 首页、控制台、关于、文档顶栏 | `HeaderNavModules` | 路由还在；文档空链接会 404 |
| 模型广场、排行榜 | `pricing` / `rankings` 的 `enabled` | 路由守卫会挡，这是少数会挡 URL 的开关 |
| Playground | `SidebarModulesAdmin.chat.playground` | 路由会挡 |
| 聊天预设菜单 | `SidebarModulesAdmin.chat.chat` | 不挡 `/chat/:id` |
| 仪表盘、Keys、日志、审计、绘图/任务日志 | `console.*` | 只藏菜单 |
| 钱包、资料、安全 | `personal.*` | 只藏菜单和头像入口 |
| 渠道、模型、兑换码、用户、订阅、系统设置入口 | `admin.*` | 只藏菜单；角色守卫仍在 |
| 签到卡片 | `checkin_enabled` | 接口还在 |
| 协议链接 | `user_agreement_enabled`、`privacy_policy_enabled` | 页面 URL 还在 |
| 首页营销区块 | 站点设置里的首页内容 | 有内容就替换默认 Hero |
| 演示站三列外链 | `DemoSiteEnabled` | 只影响页脚 |
| 公告 | `announcements_enabled` | 只影响顶栏 |

不要靠侧边栏开关当安全边界。Keys、钱包、渠道、用户、系统设置的 URL 不会因为菜单消失而消失。`/system-info` 和 `/task-plugins` 甚至不在侧边栏配置表里。

只改文案、Logo、favicon、页脚、i18n，不改变接口，风险是 LOW。

## 13. 哪些删了会影响后端

删除前端文件不会删除 Go handler。下面说的“影响”是：控制台失去写入入口后，网关仍按数据库里的旧配置运行，操作员不能再改；如果连后端路由一起删，转发和账号会坏。

| 功能 | 风险 | 原因 |
| --- | --- | --- |
| `/system-settings/*` 的保存 | HIGH | `PUT /api/option/` 和专用 option 接口决定登录、支付、倍率、限流、SSR 防护、首页和导航 |
| `/channels` | HIGH | 渠道是上游路由表 |
| `/models` 与计费 section | HIGH | 模型、分组、价格被中继读取 |
| `/keys` | HIGH | 令牌是调用凭证；聊天页也依赖它 |
| `/users` | HIGH | 创建、封禁、改额度、改角色 |
| `/wallet`、`/redemption-codes` | HIGH | 入账和兑换 |
| `/subscriptions` | HIGH | 套餐和用户订阅 |
| `/task-plugins` | HIGH | 插件启停和渠道绑定 |
| `/setup`、登录、OAuth | HIGH | 实例初始化和会话 |
| `/security` | HIGH | 密码、2FA、Passkey、访问令牌 |
| 请求策略 | HIGH | `PATCH /api/option/request_policy` |
| Playground | MEDIUM | 藏页面不会停 `/pg/chat/completions`；删后端路由才会停中继调试入口 |
| 仪表盘、日志、排行榜、关于、模型广场 | LOW 到 MEDIUM | 主要是读接口。删页面不改变转发，只是不能查看 |
| 首页营销、页脚、语言、主题 | LOW | 展示层 |

## 14. 修改风险汇总

| 级别 | 含义 | 例子 |
| --- | --- | --- |
| LOW | 只改展示，接口和路由保持 | 文案、Logo、favicon、默认首页区块、关于、页脚外链 |
| MEDIUM | 藏菜单但 URL 或读接口仍在；或几个页面共用组件 | 侧边栏隐藏 Keys/钱包/日志；仪表盘 users；聊天 iframe |
| HIGH | 写入网关配置、凭证、额度或会话 | 系统设置、渠道、模型价格、用户、令牌、钱包、兑换码、订阅、任务插件、登录 |

建议的隐藏顺序：先用已有的 `HeaderNavModules` 和 `SidebarModulesAdmin`，再改需要挡 URL 的路由守卫。不要在没加路由守卫时认为菜单消失等于功能删除。

## 15. 审核边界

- 扫描范围是 `web/src` 与 `web/index.html`、`web/rsbuild.config.ts`、`web/public`、`web/package.json`。
- 没有打开浏览器，没有请求运行中的后端。
- 没有逐个核对 Go handler 的权限中间件。前端会发的请求已列出；后端是否放行，以 `router/` 与 `middleware/auth.go` 的后续审计为准。
- 测试文件里的 `/api/` 字符串没有计入功能地图。
