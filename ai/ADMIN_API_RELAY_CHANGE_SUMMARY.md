# API 中转站管理端改造代码总结

## 改造范围

本次改造覆盖管理端权限、渠道状态、模型广场、模型价格、API Key、调用日志、运营统计、邀请统计、兑换码订单、用户账户活动和中英文切换，并同步修改前后端接口与数据模型。

## 前端改动

- 管理员默认只显示管理端菜单，普通用户继续显示用户端菜单。
- 新增或调整运营概览、调用分析、调用日志、审计日志、渠道管理、渠道状态、模型价格、API Key 管理、用户管理、兑换码、订阅和收入成本分析入口。
- 模型广场支持供货商筛选、全部供货商、模型筛选、倍率筛选和图标展示。
- 模型记录展示用户价格、官网参考价格、输入价格、输出价格、缓存读取价格和缓存创建价格。
- API Key 管理支持搜索、启用、禁用和状态刷新，Key 只显示脱敏值，并展示过期时间、额度、最近使用时间、用户组和跨组重试状态。
- 用户列表新增账户活动弹窗，可查看 API Key、调用记录、充值、兑换码、订阅和邀请关系的数量及额度汇总。
- 语言统一使用 `en` / `zhCN`；`zh`、`zh-CN`、`zh-TW` 等浏览器语言会归一为中文；日期、时间和日期范围控件会随语言切换同步变化。

## 后端接口和业务改动

### 管理员 API Key

- `GET /api/admin/tokens/`：分页查询脱敏 API Key。
- `PATCH /api/admin/tokens/:id/status`：启用或禁用 API Key，清理用户 Token 缓存并写入审计日志。

### 运营统计

- `GET /api/admin/analytics/usage-summary?hours=24`
- 统计请求数、成功/失败请求、输入/输出/缓存 Token、用户扣费、活跃用户、渠道数、每分钟请求、每分钟 Token、平均耗时和参考成本/利润。

### 邀请统计

- `GET /api/admin/affiliate/stats`
- 统计被邀请用户、活跃邀请人、待转额度、历史奖励和邀请排行。
- 当前原有奖励机制以注册成功为触发点，没有虚构充值返佣或消费返佣。

### 用户账户活动

- `GET /api/user/:id/summary`
- 从用户、Token、调用日志、充值、兑换码、订阅和邀请关系表实时统计，只读且不返回明文 Key。

### 兑换码订单

- `POST /api/redemption/order/webhook`
- 接收 `order_id`、`email`、`product_name`、`quota`、`paid`。
- 使用 `RedemptionWebhookSecret` 对原始 JSON 执行 HMAC-SHA256 验签，签名放在 `X-Redemption-Signature`。
- 供应商订单号唯一，重复回调不会重复生成兑换码。
- 支付成功后创建一次性兑换码，通过 SMTP 发送到订单邮箱；邮件失败可通过重复回调重试。

## 日志、计费和数据库变化

日志增加或使用：输入 Token、输出 Token、缓存读取 Token、缓存写入 Token、参考成本、用户扣费、参考利润、成本可用标记，以及模型/补全/缓存/创建缓存/用户组倍率快照。

普通文本、音频和实时调用结算链路会记录这些字段。旧日志缺少的数据不会伪造回填。

新增或自动迁移：

- 日志 Token、成本和价格快照字段；
- `RedemptionOrder` 兑换码订单模型；
- 模型官方参考价格字段。

模型价格计算得到的是官方参考成本，不是真实供应商账单成本。

## 主要文件

后端新增或修改：`controller/admin_token.go`、`controller/admin_usage.go`、`controller/admin_affiliate.go`、`controller/admin_user_summary.go`、`controller/redemption_order.go`、`model/admin_token.go`、`model/admin_usage.go`、`model/admin_affiliate.go`、`model/admin_user_summary.go`、`model/redemption_order.go`、`model/log.go`、`model/pricing.go`、`service/quota.go`、`service/text_quota.go`、`router/api-router.go`。

前端新增或修改：`web/src/features/admin-tokens/`、管理员运营概览、收入成本分析、兑换码订单、用户账户活动弹窗、侧边栏权限、语言切换和 i18n 文件。

## 验证结果

已通过：

- `bun run i18n:sync`
- `bun run typecheck`
- `bun run build`
- 受影响文件格式检查
- `git diff --check`
- `gofmt`（受影响 Go 文件）
- `go build ./controller ./model ./service`

## 已知限制

- Go 测试依赖 `github.com/alicebob/miniredis/v2@v2.38.0` 无法从 `proxy.golang.org` 下载，因此测试套件未完成。
- `go build ./...` 受共享 Go 模块缓存写入权限影响；受影响生产包已单独编译通过。
- 当前成本是官方参考成本，不是供应商真实账单；真实利润需要供应商账单 API、导入或人工成本数据源。
- 已实现通用 HMAC 兑换码回调协议，但没有针对某个具体第三方店铺的专用字段适配器。

完整实施报告：`ai/ADMIN_API_RELAY_IMPLEMENTATION_REPORT.md`
