# 产品表现层重设计蓝图

日期：2026-10-06  
依据：`ai/CURRENT_FRONTEND_MAP.md`、`ai/FRONTEND_UI_AUDIT.md`、参考图 `ai/ChatGPT Image Oct 6, 2026, 09_56_44 PM.png`  
状态：只设计，不实现。没有改源码、主题或依赖。

参考图只取气质：冷灰画布、白内容面、深色标题、灰色说明、细分割线、低饱和紫只用在折线和少量强调、图标轨、高密度。不照搬它的日期选择器、收入数字、下载按钮，也不照搬它的导航图标。那些数据 New API 没有。

标记含义：

- **REUSE**：能力已经存在，继续用，不重写。
- **REDESIGN**：只改用户看见的结构和样式。
- **FRONTEND GAP**：要补的前端表现能力，不动 Go。
- **BACKEND GAP**：要改 Go、接口或数据库。本蓝图目标是 0。

## 1. Design Goals

登录后的第一眼应是一个独立的开发者 SaaS：冷灰底上放一块白工作区，标题在工作区里，工具在右上角，导航是一条安静的边栏。

业务名词保持行业通用：API Keys、Models、Playground、Usage、Wallet。不为了显得不同去改这些名字。

信息效率不低于现在。表格仍是表格。筛选、分页、列显隐、批量操作、移动卡片都留着。

暗色模式继续用现有的 light / dark / system。

## 2. Non-Goals

- 不改 Go、接口、数据库、认证、权限、计费、渠道、Token、支付请求。
- 不重做侧边栏收起、Cookie、Ctrl/Cmd+B、移动端 Sheet、命令菜单、i18n、DataTable。
- 不把管理端 CRUD 混进公开模型目录。
- 不发明「对比上期百分比」「收入」「新订单」这类后端没有的指标。
- 不在这一阶段重做 Usage、Profile、Security、Admin 的内部布局。它们以后沿用同一套页面头、画布和表格皮。
- 不把紫色铺满背景，不加渐变光、玻璃叠层和复杂底纹。

## 3. Visual Language

| 角色 | 用法 |
| --- | --- |
| Canvas | 冷灰，只做页面底。登录后外壳的背景 |
| Surface | 白。工作区、表格、抽屉、弹窗 |
| Text | 近黑。标题和数字 |
| Secondary | 中灰。说明、表头、时间 |
| Border | 很浅的冷灰细线。分割指标、表格行、输入框 |
| Accent | 低饱和紫。主按钮、当前导航、焦点环、图表线、文字链接 |
| Success | 沿用现有成功色。只表示成功、启用、正向状态 |
| Warning / Danger | 沿用现有警告色和危险色 |

紫色不进入大面积背景，不进入每张卡片的顶边，不拿来做渐变。一张屏幕上，实心紫按钮同时只出现一个。

圆角：工作区、输入框、按钮用中小圆角，大约 8 到 12px。不再用现在默认的 `1rem`，也不用概览卡上的 `rounded-2xl`。

阴影：工作区可以有一层几乎看不见的阴影，用来和冷灰底分开。表格内部、指标行内部不再各自加阴影。

密度：页边距保持现在 `SectionPageLayout` 的紧凑节奏量级（手机约 12px，桌面约 16px）。标题区允许多一行说明，但不加大块空白。

字体继续用现有 Public Sans。数字和密钥用现有等宽字体。不引入新字体。

## 4. Product Identity

产品名和 Logo 仍来自 `GET /api/status` 的 `system_name` 和 `logo`。未配置时，才落到前端兜底。兜底文案和标记在实现阶段再替换，本蓝图不新起一个产品名。

身份靠位置和结构建立，不靠改名：

- 标记在侧边栏顶部，不在横跨全屏的顶栏里。
- 展开时标记右侧才出现产品名。收起时只留标记。
- 页面标题用产品自己的句子，例如 “API Keys”，下面一行灰色说明。
- 顶栏不再放 Home、Console、Model Square 这组营销导航。那组留在公开站。

如果只把紫色换回现在的蓝，下面第 6 到第 15 节的结构仍然不同。见第 25 节的自检。

## 5. App Shell

**REDESIGN** 视觉结构。**REUSE** `AuthenticatedLayout`、`SidebarProvider`、`SidebarInset`、收起状态、Cookie、移动 Sheet。

现在的壳是：一条 3rem 顶栏横跨全宽，Logo 在顶栏，侧边栏在顶栏下面。新的壳把顶栏收进内容列，侧边栏自己通高。

桌面，侧边栏展开：

```text
┌──────────────┬────────────────────────────────────────────┐
│ [mark] Name  │                     Search   Docs  ⌕ Aa ◐ │
│              ├────────────────────────────────────────────┤
│ Overview     │  Page title                                │
│ Models       │  One line of secondary text        [Action]│
│ API Keys     │────────────────────────────────────────────│
│ Playground   │                                            │
│ Usage        │  White surface on cool gray                │
│ Wallet       │                                            │
│              │                                            │
│ Manage       │                                            │
│              │                                            │
└──────────────┴────────────────────────────────────────────┘
```

桌面，侧边栏收起（现有 icon 模式，默认仍可收起）：

```text
┌────┬──────────────────────────────────────────────────────┐
│ ▣  │                              Search   Docs  Aa  ◐  │
│    ├──────────────────────────────────────────────────────┤
│ ○  │  Page title                                          │
│ ○  │  Secondary text                             [Action] │
│ ○  │──────────────────────────────────────────────────────│
│ ○  │  White surface                                       │
│ ○  │                                                      │
│ ○  │                                                      │
└────┴──────────────────────────────────────────────────────┘
```

收起宽度继续用现有 `2.75rem`。展开继续用 `13rem`。移动端继续用现有 17rem 的 Sheet，小于 768px 时触发。Ctrl/Cmd+B 和 `sidebar_state` Cookie 不变。

主内容：

- 外壳背景是冷灰 Canvas。
- `SidebarInset` 里的页面是白 Surface，顶部和左侧用细线与灰底分开。
- 表格页使用 Inset 的全部宽度，不居中收窄。管理数据需要宽度。
- 概览、钱包、试用的阅读区在白 Surface 内最大约 1120px，居中。这是页面内边距，不新做布局引擎。现有 `data-theme-content-layout=centered` 仍保留给喜欢全局居中的用户，默认仍是 full，避免表格被意外收窄。
- 页边距沿用 `SectionPageLayout` 的 `px-3` / `sm:px-4`。

没有第二套 Admin Layout。管理员只是多一组导航。进入系统设置时，继续用现有 drill-in 替换侧边栏内容。

## 6. Sidebar

**REUSE** 导航数据、角色过滤、模块隐藏、tooltip、收起后子菜单变 Dropdown、`SidebarRail`、设置 drill-in。  
**REDESIGN** 分组方式和视觉。

展开时：

- 顶部是标记和产品名，高约 48px，底部分一根细线。
- 分组标题用灰色短词，不用现在的 11px 大写宽字距。
- 当前项：浅紫底，左侧 2px 紫条，文字近黑。不是整块实心蓝。
- 悬停：比当前项更淡的灰底。
- 图标继续用现有 Lucide，尺寸 16px。
- 底部不放用户卡。用户仍在右上角。参考图底部的齿轮，对应现有「系统设置」入口，只对超级管理员出现。

这一阶段侧边栏里用户能直接进入的项：

| 项 | 去向 | 标记 |
| --- | --- | --- |
| Overview | `/dashboard/overview` | REUSE |
| Models | 模型目录，见第 10 节 | REDESIGN 外壳 |
| API Keys | `/keys` | REUSE |
| Playground | `/playground` | REUSE |
| Usage | `/usage-logs/common` | REUSE，页面皮下一阶段再改 |
| Wallet | `/wallet` | REUSE |

管理员继续看到现有的渠道、模型管理、用户、兑换码、订阅。系统设置继续只给超级管理员。这些项的内部页面不在本阶段重画，只沿用新的导航皮。

聊天预设、绘图日志、部署、任务插件不从产品里删掉。它们仍按现有开关和角色出现。本阶段不给它们设计新版式。

收起时只显示图标。名称用现有 tooltip。标记仍在顶部。

移动端打开 Sheet 时用展开态的同一份导航，点一项后继续用现有 `setOpenMobile(false)`。

## 7. Header

**REUSE** `AppHeader` 已有的 `showTopNav`、`Search`、`LanguageSwitcher`、`ConfigDrawer`、`ProfileDropdown`、`NotificationPopover`、`SidebarTrigger`。  
**REDESIGN** 组合。

登录后的顶栏只做工具条，高度仍是现有 3rem：

1. 最左是现有的 `SidebarTrigger`。
2. 中间留空。页面标题不放进顶栏。
3. 右侧依次是：搜索、文档、通知、语言、主题、头像。

文档：仅当 `docs_link` 是外链时显示文字按钮 “Docs”。没有配置就不占位。不再默认指向 `/docs` 或 `docs.newapi.pro`。这是顶栏组合的收紧，链接数据仍来自状态接口。

搜索继续打开现有命令菜单，保留 ⌘K。

主题继续打开现有 `ConfigDrawer`。小于 `md` 时，现有触发按钮是 `max-md:hidden`。蓝图要求小屏从头像菜单进入同一套主题控件，不新写一套主题逻辑。这是入口补位，标记为 **FRONTEND GAP** 里的第 1 条。

头像菜单继续去 Profile、Security、Wallet、退出。管理员的系统设置入口也留在这里，作为侧边栏之外的第二条路。

公开站顶栏不在这 8 个区域里重做。公开首页以后单独沿用同一套颜色，本文件不给它画线框。

## 8. Page Header

**REUSE** `SectionPageLayout` 的 Title、Actions、Content、底槽。  
**FRONTEND GAP**：Title 下面需要一行可选说明。当前标题组件只有一个 `h2`。

统一成：

```text
Title                              Primary action
One sentence in secondary text     Secondary action
```

标题是 `text-xl`、semibold、近黑。说明是一行，超长就截断。主按钮每页最多一个，用紫色实心。其余用描边或文字按钮。

密钥、钱包、概览、模型目录都用这个头。Playground 和登录页不用，它们不是列表页。

## 9. Overview

**REUSE** 这些已经存在的数据，不新增指标：

- 余额、已用额度、请求数，来自当前用户
- 12 段 sparkline，来自现有 `getUserQuotaDates`
- 是否已有密钥、是否已有余额或用量、是否已有请求，用来判断三步引导
- 推荐动作：密钥、用量、价格；管理员多一个渠道
- 公告、API 信息、FAQ、Uptime，仍由现有显示开关决定
- 引导展开状态的本地保存

不显示「较上期上升 12%」。接口没有这个字段。sparkline 本身保留。

**REDESIGN** 层级。

新用户第一屏：

```text
Overview
Create a key, add credits, then send one request.     [Create API Key]

[ ] Create API Key          short description
[ ] Add credits             short description
[x] Send a request          short description

Balance              Used                 Requests
12.40 USD            1.10 USD             128
~~~~~~~~~~~~~~~~     ~~~~~~~~~~~~~~~~     ~~~~~~~~~~~~~~~~
secondary label      secondary label      secondary label
```

三步是一行清单，不是现在那块大圆角英雄卡，也不做左右两张大卡。完成的步骤用成功色勾，不铺绿底。

老用户，三步都完成且用户曾收起引导：第一屏不再展开清单，只留标题行右侧的 “Setup guide”。这沿用现有的收起状态。第一屏直接是指标条。

指标条是一块白面，用竖线分成三列。数字大，标签灰。sparkline 用紫色细线，无填充光晕。三列不是三张浮卡。

第二层，仍在第一屏下面，按开关出现，顺序固定：

```text
Recommended
API Keys          Usage            Models           Channels (admin)

Announcements
API info
FAQ
Uptime
```

推荐动作是文字行，不是图标墙。公告和其余面板继续用现有组件和现有开关，只去掉重阴影和大圆角。没有内容的面板不占位。

管理员和普通用户仍是同一页。管理员只多渠道这一个推荐项。性能图、流量、用户分析仍留在现有的 models / flow / users 分段，不搬进概览第一屏。

## 10. Models / Pricing

这是公开模型目录，不是 `/models` 管理表。

**REUSE** 搜索、供应商、分组、计费类型、端点类型、标签、排序、token 单位、卡片/表格切换、详情抽屉、分页尺寸、空状态和加载骨架。字段只显示价格接口已经返回的模型名、供应商、分组、价格、端点。上下文长度和能力标签如果对象里没有，就不画，也不为此加接口。

**REDESIGN** 外壳。  
**FRONTEND GAP**：`features/pricing/index.tsx` 现在固定包在 `PublicLayout` 里。登录后的「Models」要画在应用工作区里，需要把目录主体和公开顶栏拆开。未登录访问 `/pricing` 仍走公开顶栏。

登录后：

```text
Models                                         [ Table | Cards ]
Compare price, provider, and endpoint.

[Search................] [Provider] [Group] [Billing] [Endpoint] [Tag] [Sort]

Model            Provider        Price           Endpoint
gpt-4.1          OpenAI          $… / 1M         chat
claude-…         Anthropic       $… / 1M         chat
```

表格是默认。卡片切换保留。点一行打开现有详情抽屉，抽屉只改成白底、细边框、小圆角。

价格是主数字，用近黑。供应商是灰色文字，不先做一排大图标。图标如果现有单元格已经有，就留在名字旁边，尺寸 16px。

未登录的公开页用同一张表和同一套筛选，外面仍是公开顶栏。这样目录不会变成两套业务。

管理端的模型、供应商、部署表不出现在这个页面。

## 11. API Keys

**REUSE** 列和抽屉字段：Name、Status、API Key、Quota、Group、Models、IP Restriction、Time、Expires、Actions。创建时的数量、无限额度、自动分组、跨组重试、过期预设，全部留在现有抽屉里。DataTable 的排序、筛选、分页、列显隐、批量删除、移动卡片留着。

**REDESIGN** 页头、工具条、单元格和抽屉的视觉层级。

```text
API Keys                                      [Create API Key]
Keys used by your apps. Quota and limits stay on the key.

[Search] [Status] [Group]                      Columns    Batch

Name          Status     Key                 Quota      Group    Expires
Production    Enabled    sk-••••••••  Copy    20.00      default  Never
Staging       Disabled   sk-••••••••  Copy    Unlimited  vip      2026-12-01
```

状态用小徽章：启用为成功色文字，停用为灰色。不用大色块。

密钥列保持等宽、截断、复制。如果现有单元格已经能复制，只改样式。不新造一套密钥系统。

创建和编辑仍是现有右侧抽屉，分成现在的三段，视觉改成：

```text
Create API Key                          Close

Basic
Name
Group
Expiration

Quota
Amount            ( ) Unlimited

Advanced
Model limits
IP whitelist

                              Cancel   Save
```

三段用标题和细线分开，不各自做成悬浮卡。主按钮只有 Save。现有校验、批量创建数量和错误提示不动。

空状态：一张白面，一行字 “No keys yet”，一个创建按钮。不画插画。

## 12. Playground

**REUSE** 模型、分组、参数、消息流、停止、重新生成、编辑、删除，以及「消息在上、输入在下」。

**REDESIGN** 只改皮。

```text
┌──────────────────────────────────────────────┐
│  Model  [...........]   Group [....]   Params│
│                                              │
│                                              │
│            messages, max reading width       │
│                                              │
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │  Message                         Send  │  │
│  └────────────────────────────────────────┘  │
└──────────────────────────────────────────────┘
```

页面背景仍是白工作区，不再套列表页的大标题。模型、分组、参数收进顶部一条细工具条，用现有选择器。消息区保持可滚动。输入区继续限制在约 `max-w-4xl`，和现在一样。

用户消息和模型消息靠背景深浅区分：一个是冷灰，一个是白加细边框。不用彩色气泡，不用发光。

停止、重新生成、编辑、删除仍是消息上的现有动作，改成文字或 16px 图标，悬停才加深。生成中的状态用现有加载，不加重动画。

空对话时，输入区垂直居中，上面一行灰色字：“Send a request with your key.” 不放营销插图。

## 13. Wallet

**REUSE** 单页结构：余额卡数据、充值金额、预设档、支付方式、兑换码、套餐、邀请奖励、充值历史对话框、划转对话框。未开启的支付方式和套餐继续不渲染。消费明细仍在 Usage，不搬进来。签到仍在 Profile，不搬进来。

**REDESIGN** 层级。

```text
Wallet
Balance, top-up, and redemption.

Balance                         Used
48.20 USD                       3.10 USD

Add credits                     Plans
[ 10 ] [ 20 ] [ 50 ] [ 100 ]    only if plans exist
Amount [........]
Pay with  the methods returned
[ Redeem code ]  Redeem

Referral
link, copy, transfer

Billing history                 opens the existing dialog
```

第一屏只有余额和充值。余额用和概览相同的指标条，避免两套数字样式。

支付方式只渲染接口返回且已启用的那些，横排小按钮，选中项用紫边，不用大 Logo 墙。

兑换码是充值区底部的一行输入，不是单独一块大卡。

套餐仅在现有逻辑判断可用时，出现在充值右侧；窄屏改到下方。这是现在 `xl` 网格的延续。

邀请奖励放在第二层，默认展开，因为它是现有功能，但不压过充值。

充值历史是标题行右侧的文字按钮，打开现有对话框。

## 14. Login

**REUSE** `UserAuthForm`、跳转参数、注册开关、自用模式、OAuth、`TermsFooter`、系统名和 Logo。认证页继续不套控制台侧边栏。

**REDESIGN** 品牌区。

```text
┌─────────────────────────┬──────────────────────────┐
│                         │                          │
│  [mark]                 │  [mark] Product          │
│  Product name           │                          │
│                         │  Sign in                 │
│  One key for the        │  No account? Sign up     │
│  models you run.        │                          │
│                         │  Email                   │
│                         │  Password                │
│                         │  [ Sign in ]             │
│                         │  OAuth                   │
│                         │  Terms                   │
└─────────────────────────┴──────────────────────────┘
```

左栏只有冷灰底、标记、产品名和一句灰色说明。没有网格，没有光斑，没有模型图标墙。右栏是白底表单，宽度继续约 480px。

小于 `md` 时左栏隐藏，顶上只留标记和产品名，表单占满。这和现在的单列回退一致，只是去掉空的英雄区。

暗色时左栏用现有暗色背景，右栏用现有卡片色，文字对比跟着 token 走。

## 15. Register

和登录同一套骨架。标题改为 Sign up。底部链回 Sign in。字段、验证码、OAuth、协议全部用现有注册表单。

注册被 `register_enabled` 或自用模式关掉时，继续不显示入口。不设计一个「即将开放」落地页。

忘记密码、重置、两步验证沿用同一壳，本阶段不单独发明版式。

## 16. Core Components

只改表现，不改行为。

| 组件 | 处理 |
| --- | --- |
| Button | 实心紫仅用于主操作。次操作是白底细边框。危险操作继续用现有 destructive |
| Input | 白底、细边框、小圆角。焦点环用淡紫，不用粗蓝光 |
| Tabs | 文字加底线或浅底，不用大胶囊。用于用量、模型管理等已有 Tabs |
| Badge | 小、浅底、深字。状态色只用 success / warning / danger 的浅底 |
| Dialog / Drawer | 白面、细边框、标题近黑、底栏右对齐按钮。现有 `dialog` 包装和确认框留着 |
| Table | 表头灰色、行间细线、无行阴影。选中行用极淡的紫底 |
| Empty | 一行标题、一行说明、一个主按钮。不用插画 |
| Skeleton | 继续用现有骨架，颜色改成冷灰，不改加载逻辑 |
| Chart | 紫色细线。网格线用 border token。不填发光面积 |

DataTable 的功能组件一个都不换。

## 17. Responsive

**REUSE** 现有断点：小于 768 侧边栏变 Sheet；DataTable 可切卡片；筛选有移动面板；对话框用现有 `dvh` 和 safe-area。

补充的只有表现：

- 指标条在窄屏改为上下三行，竖线改成横线。
- 钱包的套餐栏在小于 `xl` 时落到充值下面，这是现有网格。
- 登录左栏在小于 `md` 时隐藏。
- 页头的主按钮允许换行到标题下方，沿用 `SectionPageLayout` 已有的换行。

不新做底部 Tab。

## 18. Dark Mode

**REUSE** `light` / `dark` / `system`、`newapi:theme:v1:mode`、预设、字体、圆角、密度、内容宽度。实现时只改默认 token，不删这些控件。

暗色对应关系：

- Canvas：现有暗色背景，略偏冷即可
- Surface：现有卡片色
- 正文：现有近白
- 分割线：现有 10% 白边
- 紫强调：比浅色模式更亮一点，保证细线上可见
- 成功、警告、危险继续用现有暗色 token

不单独做一套暗色插画。

## 19. REUSE List

1. Go 后端、数据库、现有 API 和请求函数
2. 认证、权限、角色门槛
3. 渠道、Token、计费、支付的业务规则
4. `AuthenticatedLayout`、`SidebarProvider`、`SidebarInset`
5. 侧边栏 icon / offcanvas / none，以及 13rem、2.75rem、17rem
6. `sidebar_state`、`layout_collapsible`、`layout_variant` Cookie
7. Ctrl/Cmd+B、`SidebarTrigger`、`SidebarRail`
8. 小于 768px 的移动 Sheet，以及点选后关闭
9. 收起时的 tooltip 和子菜单 Dropdown
10. 按角色过滤导航，按 `SidebarModulesAdmin` 和用户配置隐藏
11. 系统设置 drill-in
12. 命令菜单和 ⌘K 搜索
13. 语言切换
14. 主题模式、10 套预设、字体、圆角、密度、内容布局、文字方向
15. 通知弹层
16. 头像菜单里的资料、安全、钱包、退出
17. DataTable 排序、筛选、分页、列显隐、批量操作、移动卡片、视图记忆
18. i18n 七种语言和现有文案键
19. `SectionPageLayout` 的标题、操作、内容、底槽
20. 概览的余额、用量、请求数、sparkline、三步判断、推荐动作
21. 公告、API 信息、FAQ、Uptime 的现有开关
22. 价格页的筛选、排序、单位、卡片/表格、详情抽屉
23. 密钥表格列和创建抽屉的全部字段
24. Playground 的消息、参数、停止、重生成、编辑、删除
25. 钱包的充值、兑换、套餐、邀请、历史对话框，以及支付开关
26. 登录注册表单、OAuth、协议、注册开关
27. `system_name` 和 `logo` 的运行时品牌
28. 暗色模式和 `prefers-color-scheme`
29. 跳到主内容、减少动效、对话框 safe-area
30. 公开站和认证页不使用控制台侧边栏

## 20. REDESIGN List

1. 冷灰画布加白工作区，替代白底叠白底
2. 默认强调色改为低饱和紫，默认圆角改为约 8–12px
3. 标记和产品名移到侧边栏顶部
4. 登录后顶栏去掉营销导航，只留工具
5. 页面标题改到工作区，并带一行说明
6. 侧边栏分组取消大写宽字距，当前项改为浅底加 2px 条
7. 概览三步从大英雄卡改成清单
8. 三个核心数字改成一条被竖线分开的指标条
9. 推荐动作改成文字行
10. 模型目录的页头、筛选条和表格皮
11. 密钥页的页头、状态徽章、密钥列和抽屉分段
12. Playground 顶部工具条和消息底色
13. 钱包的信息顺序：先余额和充值，再邀请和历史
14. 登录和注册的左栏品牌、右栏表单
15. 按钮、输入框、徽章、弹窗、空状态、图表线的视觉
16. 去掉首页式渐变、大圆角和玻璃顶栏在这些核心页上的用法

## 21. FRONTEND GAP

1. 小屏主题入口。现有主题按钮带 `max-md:hidden`。把头像菜单接到现有 `ConfigDrawer` 或同一组主题控件，不新写主题状态。
2. `SectionPageLayout` 增加可选的一行说明。没有这行时，版式和现在一样。
3. 指标条组件。只负责把已有的三个数字和已有 sparkline 排成一行，不请求新接口。
4. 模型目录主体与 `PublicLayout` 分离。未登录仍用公开顶栏；登录后同一主体画进应用工作区。筛选和抽屉逻辑不动。

除此以外，不需要新的前端能力。

## 22. BACKEND GAP

无。

不新增字段，不改返回结构，不改权限，不改支付、渠道和 Token 的接口。

明确不做：

- 较上期百分比
- 参考图里的 Revenue、Subscriptions、Orders
- 模型上下文长度，除非价格对象里已经有这个字段
- 把消费明细并进钱包接口

## 23. Upstream Compatibility

可以跟官方同步的部分不要重写业务文件：

- `features/*/api.ts`
- 表单字段名和提交体
- 路由路径和 `beforeLoad` 里的角色判断
- DataTable 的查询参数
- i18n 的键。显示句子可以改值，键保持英文原句

表现层集中在：

- `styles/theme.css` 的默认 token
- `AuthenticatedLayout`、`AppHeader`、`AppSidebar`、`SectionPageLayout` 的结构和 class
- 八个区域自己的 JSX 编排

这样上游改接口时，冲突落在少数壳文件，而不是每一个请求函数。

系统设置、渠道、用户这些本阶段没重画的页面，会自动吃到新的 token、顶栏和侧边栏。它们的表格和表单先保持现在的结构。这是预期结果，不是漏做。

## 24. Implementation Boundaries

实现时允许：

- 改默认颜色、圆角、边框、背景
- 移动现有组件的位置
- 给 `SectionPageLayout` 加可选说明槽
- 把价格页的内容从公开布局里拆出来复用
- 改这 8 个区域的 JSX 和 class

实现时不允许：

- 改 `web/src/features/**/api.ts` 的路径和参数
- 删除 DataTable 能力来换一种「更不像后台」的列表
- 改路由权限
- 为了视觉新增后端字段
- 重做主题状态、侧边栏状态和命令菜单

Usage、Profile、Security、Admin 的内部版式不在第一批。它们只继承壳、页头规则和 token。

## 25. ASCII Wireframes

上面第 5、9、10、11、12、13、14 节是正式线框。这里把差异收成一张对照，避免实现时做回旧壳。

现在：

```text
[ Logo  Name | Home Console Models Docs ][ Search Lang Theme User ]
[ Sidebar groups        ][ small h2                         actions ]
[                       ][ white page on white              ]
```

新版：

```text
[ Mark Name ][                         Search Docs Lang Theme User ]
[ Overview  ][ Title                                            ]
[ Models    ][ secondary text                          [Action] ]
[ API Keys  ][ white sheet on cool gray                     ]
[ Playground]
[ Usage     ]
[ Wallet    ]
```

只把紫色换回蓝色时，第二张仍然成立：Logo 在侧栏，标题在工作区，顶栏没有营销链接，指标是一条分割线而不是英雄卡，登录有安静的左栏。所以它不是换主题。

## 26. 审核时可以改的决定

这些不影响后端，确认前也可以调整：

- 侧边栏默认是展开还是收起。能力两边都有。蓝图不改现有默认，现有默认是可收成图标。
- 登录后的 Models 是进入应用内目录，还是继续跳到公开 `/pricing`。蓝图选择前者，所以有 FRONTEND GAP 第 4 条。如果要少改代码，可以改成侧边栏直接链到现有公开页。
- 产品兜底名称和标记。本文件故意不命名。
