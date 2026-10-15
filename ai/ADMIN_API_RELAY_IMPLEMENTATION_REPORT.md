# 管理端 API 中转站改造实施报告

## 当前完成内容

### 1. 项目审计

已完成管理端、用户端、路由、权限、渠道、模型、计费、日志、兑换码、订阅和邀请相关代码的架构级审计。

审计结论见：

```text
ai/ADMIN_API_RELAY_AUDIT.md
```

### 2. 管理员导航隔离

已修改管理员侧边栏：

- 管理员默认只显示管理端菜单；
- 普通用户默认只显示用户端菜单；
- 管理员不再看到模型广场、API Key 用户入口、个人资料、个人充值、个人邀请、用户 Playground 等用户菜单；
- 超级管理员继续根据 `requiredRole` 查看系统信息、任务插件和系统设置。

### 3. 管理端菜单补充

已加入或调整：

- 运营概览：`/dashboard/overview`；
- 模型调用分析：`/dashboard/models`；
- 调用记录：`/usage-logs/common`；
- 审计日志：`/usage-logs/audit`；
- 渠道管理：`/channels`；
- 渠道状态：`/channel-status`；
- 模型与价格：`/models/metadata`；
- 用户管理：`/users`；
- 兑换码管理：`/redemption-codes`；
- 订阅管理：`/subscriptions`；
- 系统设置：`/system-settings/site`。

没有把不存在的订单、成本利润或独立管理员 API Key 页面伪造添加到菜单中。

### 4. 管理员 API Key 管理

已新增真实的管理员 API Key 查询和状态管理能力：

- `GET /api/admin/tokens/`：管理员分页查询 API Key；
- 支持按名称或用户名称关键词查询；
- 返回的 Key 使用脱敏值；
- `PATCH /api/admin/tokens/:id/status`：管理员启用或禁用 API Key；
- 状态修改只更新状态字段，不会修改 Key、额度或分组配置；
- 前端新增 `/admin-tokens` 页面并接入上述接口。
- 启用或禁用后会清理该用户的 Token 缓存，避免 Redis 中的旧状态继续放行请求；
- 管理员状态变更会写入管理审计日志。

### 5. 管理员运营概览

已修正管理员运营概览误用用户首页的问题：

- 管理员访问 `/dashboard/overview` 时不再显示用户个人余额首页；
- 改为读取最近 24 小时全站调用聚合；
- 展示请求数、用户侧扣费额度、Token 数、性能成功率和异常渠道数；
- 运营概览还从消费/错误日志计算成功请求、失败请求、每分钟请求、每分钟 Token 和平均耗时；失败请求只统计 `LogTypeError`，不会把用户扣费当成成功率；
- 普通用户仍然使用原用户首页组件。

### 6. 管理员调用日志入口

- 管理员侧边栏使用“Call Logs”名称，不再使用用户侧“Usage Records”名称；
- 管理员查看全量调用范围时，页面标题显示为“Call Logs”；
- 现有后端日志接口已经支持管理员全量查询、模型、用户、Token、渠道、分组和 Request ID 等筛选。

### 7. 邀请统计

已增加管理员邀请统计接口：

- `GET /api/admin/affiliate/stats`；
- 统计使用邀请码注册的用户数量；
- 统计有邀请记录的邀请人数量；
- 统计邀请人当前待转额度；
- 统计历史累计邀请奖励；
- 返回邀请人数最多的前 10 名用户。

管理员运营概览已展示邀请用户数量。

当前项目的奖励触发点仍是注册成功，不是充值返佣或消费返佣；后者没有被伪造为已实现。
- 前端支持在列表中启用或禁用 API Key，并在成功后重新读取列表。

### 8. 兑换码管理安全性补齐

- 单个删除、批量删除、删除无效码、编辑和启用/禁用兑换码均写入管理审计日志；
- 删除接口现在会校验路径参数，避免无效 ID 被当作 0 处理；
- 状态接口只接受启用和禁用状态，不能通过管理接口伪造已使用状态；
- 兑换码实际核销仍使用后端事务、行锁/状态 CAS 和额度入账，不允许前端直接完成充值。

### 9. 调用日志 Token 结构化字段

- `logs` 增加独立的输入、输出、缓存读取、缓存写入 Token 字段；
- 普通文本结算链路会把上游 usage 写入这些字段；
- 前端调用日志优先读取结构化缓存字段，兼容历史 `other` JSON 字段；
- 原有 `prompt_tokens`、`completion_tokens` 保留，避免历史数据和旧接口失效。

管理员运营概览新增真实日志聚合接口：

- `GET /api/admin/analytics/usage-summary?hours=24`；
- 直接聚合消费日志中的请求数、输入/输出/缓存 Token、扣费额度；
- 运营概览优先使用该接口，旧看板数据只作为兼容回退。

### 10. 外部店铺兑换码订单

已实现供应商无关的订单回调链路：

- `POST /api/redemption/order/webhook`；
- 使用系统选项 `RedemptionWebhookSecret` 对原始请求体执行 HMAC-SHA256 验签；
- 请求字段：`order_id`、`email`、`product_name`、`quota`、`paid=true`；
- `provider_order_id` 唯一约束保证回调重试不会重复生成兑换码；
- 支付成功后创建一次性兑换码并通过 SMTP 发到订单邮箱；
- 邮件失败记录失败状态和错误信息，重复回调会重试发货；
- 管理端兑换码页面增加订单列表，可查看订单、邮箱、额度、发货状态和创建时间。
- 系统设置的 SMTP 页面增加兑换码回调密钥输入；后端不会在普通设置读取接口中返回该密钥。

### 11. 收入与成本分析入口

- 管理员侧边栏新增“Revenue & Cost Analysis”；
- 页面展示真实的用户扣费、请求数和 Token；
- 结算日志会在模型官方参考价格完整时保存参考成本、用户扣费和参考利润；
- 消费日志同时保存结算时的模型倍率、输入/输出/缓存倍率和用户组倍率，后续调价不会改变历史快照；
- 页面明确标记这些是“参考成本/参考利润”，缺少参考价格时显示不可用；
- 这仍不是供应商账单成本，真实账单接入仍需外部成本数据。

该接口是明确的通用协议，不声称自动兼容某个未提供协议的第三方店铺。店铺适配只需要按上述字段组装 JSON，并使用配置密钥签名原始请求体。

### 12. 语言切换一致性

- 语言切换统一使用 `en` / `zhCN` 规范码，并继续写入本地语言检测器和登录用户设置；
- 浏览器返回的 `zh`、`zh-CN`、`zh-TW` 等值不会导致页面半中文半英文，而是统一归一到简体中文界面；
- 日期选择器、日期时间选择器和运营概览自定义日期范围会监听当前解析语言并同步切换日历语言；
- 登录后读取的历史语言设置会先归一化，避免旧版本保存的语言值导致切换失败。

### 13. 用户管理聚合视图

- 新增管理员接口 `GET /api/user/:id/summary`；
- 从 Token、消费日志、充值、兑换码、订阅和邀请关系的真实数据表实时统计；
- 用户列表操作菜单新增“查看账户活动”，管理员可以直接查看上述模块的数量、充值额度和邀请关系；
- 该接口只读，不返回 API Key 明文，也不改变任何余额或订阅状态。

## 当前真实未完成内容

以下内容需要继续开发，当前不能宣称已完成：

- 供应商真实账单成本和真实利润统计；
- 历史旧日志缺少新增 Token 字段，不能回填未知数据；
- 具体第三方店铺的字段适配；通用签名回调已实现；
- 邀请奖励的充值返佣、消费返佣和防刷机制；
- 旧日志没有新增的价格倍率快照，之后新日志会保存结算时快照；
- 参考成本链路已实现，真实供应商成本链路仍缺外部账单数据。

这些能力需要后端数据模型、接口和结算链路配合，不能只修改菜单或前端页面完成。

## 修改文件

- `web/src/hooks/use-sidebar-view.ts`
- `web/src/hooks/use-sidebar-data.ts`
- `web/src/hooks/use-sidebar-config.ts`
- `model/admin_token.go`
- `controller/admin_token.go`
- `web/src/features/admin-tokens/api.ts`
- `web/src/features/admin-tokens/types.ts`
- `web/src/features/admin-tokens/index.tsx`
- `web/src/routes/_authenticated/admin-tokens/index.tsx`
- `model/admin_affiliate.go`
- `controller/admin_affiliate.go`
- `model/admin_usage.go`
- `controller/admin_usage.go`
- `model/redemption_order.go`
- `controller/redemption_order.go`
- `model/pricing.go`
- `model/log.go`
- `service/quota.go`
- `service/text_quota.go`
- `web/src/features/dashboard/components/revenue/revenue-analysis.tsx`
- `web/src/features/redemption-codes/components/redemption-orders.tsx`
- `web/src/features/dashboard/components/overview/admin-overview-dashboard.tsx`
- `web/src/i18n/locales/en.json`
- `web/src/i18n/locales/zh.json`
- `ai/ADMIN_API_RELAY_AUDIT.md`

工作区中此前已有的用户端模型广场、官方参考价格和渠道状态相关修改均保留。

## 验证结果

已执行：

```text
bun run i18n:sync       通过
bun run typecheck       通过
git diff --check        通过
bunx oxlint -c .oxlintrc.json <受影响前端文件> 通过
bun run build           通过
```

兑换码相关前端文件在最后一次检查中：

```text
tsgo -b                         通过
oxlint 受影响文件               通过
git diff --check                通过
```

后端测试尝试执行，但当前环境无法下载缺失的 Go 模块：

```text
github.com/alicebob/miniredis/v2@v2.38.0: proxy.golang.org connection failed
```

因此不能宣称后端测试和 SQLite/MySQL/PostgreSQL 三数据库验证已经完成；代码已执行 gofmt 和 git diff --check。

本轮新增日志字段和聚合接口后再次执行：

```text
前端 typecheck / oxlint / build       通过
后端 controller/model/service 编译    被缺失依赖的网络下载阻断
```

之后在允许访问共享 Go 模块缓存的情况下再次尝试，文件权限问题已绕过，但 `proxy.golang.org` 仍无法连接，具体阻断依赖为 `github.com/alicebob/miniredis/v2@v2.38.0`；后端编译结果仍不能标记为通过。

随后使用已经存在的依赖执行生产包编译：

```text
go build ./controller ./model ./service    通过
```

这次编译暴露并修复了兑换码订单状态参数和实时/音频计费日志字段的生产代码错误。`go build ./...` 在写入 Go 模块统计缓存时再次遇到权限问题，未将其作为全项目构建通过依据。

