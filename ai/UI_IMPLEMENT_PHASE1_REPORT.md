# UI Implement Phase 1 Report

日期：2026-10-07  
范围：VISUAL FOUNDATION + APP SHELL  
状态：Phase 1 已停止。未进入 Phase 2，未提交 commit。

## Scope

只建立后续页面会继承的视觉基础：

- 默认 Light / Dark token
- 已登录 App Shell（沿用现有 `AuthenticatedLayout` 和 `SidebarProvider`）
- Sidebar、Header、Content Canvas 的 presentation
- `SectionPageLayout` 的可选 description
- Card、Dialog、Alert Dialog、Table 的少量全局 presentation

没有改业务页面 JSX。Prototype 里的 Project X 没有写进源码。运行时品牌仍是 `system_name` 和 `logo`。

## Branch

`feature/ui-redesign-phase-1`

从 `main` 创建。开始前 tracked working tree 是干净的，只有未跟踪的 `ai/`（地图、审计、蓝图、Prototype）。没有 stash、reset 或 discard。

## Before State

- 分支：`main`
- `git diff`：空
- `git status`：只有 `?? ai/`
- 默认主色是蓝色，默认 `--radius` 是 `1rem`
- 已登录 Header 横跨整页，品牌在 Header 里，Sidebar 从 Header 下方开始

## Changed Files

14 个已跟踪文件，`git diff --stat` 为 133 insertions、102 deletions。

| 文件 | 为什么改 | 是否必要 | 行为 |
| --- | --- | --- | --- |
| `web/src/styles/theme.css` | 默认 Light / Dark token 和默认圆角 | 是。默认主题要对齐已审核 Prototype | 只影响未选择命名 preset 时的默认色和圆角。Light / Dark / System 机制未重写 |
| `web/src/styles/theme-presets.css` | Header 移入 `SidebarInset` 后，centered 布局不再夹住 Header | 是 | 命名 preset 的颜色和圆角块未改。只改 centered 选择器 |
| `web/src/components/layout/components/authenticated-layout.tsx` | Sidebar 通高，Header 放进右侧内容列 | 是 | 仍是同一套 Layout。登录后关闭品牌和营销顶栏 |
| `web/src/components/layout/components/app-header.tsx` | 增加 `showBrand`，默认 `true` | 是 | 只有已登录壳传入 `false`。公开 Header 仍可显示品牌 |
| `web/src/components/layout/components/header.tsx` | 工具条：白底、底边、固定高度 | 是 | 高度仍是 3rem |
| `web/src/components/layout/components/app-sidebar.tsx` | 非 drill-in 时在顶部放运行时品牌 | 是 | drill-in 仍用原来的 `SidebarViewHeader` |
| `web/src/components/layout/components/system-brand.tsx` | Sidebar 品牌改为标记加名称；图标模式隐藏名称 | 是 | 名称仍来自 `status.system_name`，缺省仍是 `New API`。去掉未使用的 `defaultVersion`。版本展示留给 Header 里的 `SystemUpdateAction` |
| `web/src/components/layout/components/nav-group.tsx` | 分组标签改为小号、灰色、正常字距 | 是 | 菜单项、权限和动态菜单未改 |
| `web/src/components/ui/sidebar.tsx` | 通高固定定位、内容面细边框和极轻阴影、选中项 2px 指示条 | 是 | Collapse、Cookie、Ctrl/Cmd+B、Tooltip、Mobile Sheet、宽度常量未改 |
| `web/src/components/layout/components/section-page-layout.tsx` | 可选 `Description`；标题改为 semibold | 是 | 不传 description 时不渲染说明。没有给现有页面补 description |
| `web/src/components/ui/card.tsx` | ring 改为 border token | 是，全局描边统一 | 结构和 API 未改 |
| `web/src/components/ui/dialog.tsx` | 同上 | 同上 | 同上 |
| `web/src/components/ui/alert-dialog.tsx` | 同上 | 同上 | 同上 |
| `web/src/components/ui/table.tsx` | 表头用次级文字色；选中行用 accent | 是，表格视觉统一 | 查询、排序、筛选、分页未改 |

未改 Button、Input、Badge、Tabs、Skeleton、Sheet。它们继承 token。Tabs 没有从 pill 改成 line，避免改变各业务页的溢出和指示器。

## Added Files

本阶段新增 3 个文件：

- `web/src/components/layout/__tests__/section-page-layout.test.tsx`
- `web/src/components/ui/__tests__/sidebar-active.test.tsx`
- `ai/UI_IMPLEMENT_PHASE1_REPORT.md`

开始前就已经未跟踪的 `ai/` 文档和 `ai/ui-prototype/` 不算本阶段新增。没有新建 `NewButton`、`NewInput`、`NewTable`、`NewCard` 或第二套 Layout。

## Visual Changes

默认 Light：

- 文字接近 `#16181D`
- 次级文字接近 `#6A7181`
- 主色低饱和紫，接近 `#5B4DB5`
- 选中浅紫接近 `#F4F1FA`
- Canvas 冷灰接近 `#F3F4F6`，放在 `--sidebar`
- Surface 仍是白色 `--background`
- 边框接近 `#E6E8EE`
- 默认圆角 `0.625rem`（10px）

默认 Dark 改为冷炭色，紫色只抬到动作、选中、焦点和图表。暗色主按钮上的文字是深色。

Shell：

- Sidebar 独立通高
- 品牌在 Sidebar 顶部，使用现有 logo 和 `system_name`
- Header 只在右侧内容列，是安静工具条
- 内容列是冷灰 canvas 上的白 surface，细边框，阴影为 `0 1px 2px rgba(22,24,29,0.04)`
- 选中导航：浅紫底、2px 紫条、近黑字
- Hover：中性浅灰
- 分组标签：`text-xs`、灰色、`tracking-normal`、非全大写

对比度抽查（计算值，不是浏览器实测）：白字在 `#5B4DB5` 上 6.62；`#16181D` 在 `#F4F1FA` 上 15.91；`#6A7181` 在白底上 4.89。边框 `#E6E8EE` 在白底上 1.23，只作发丝线。

## Behavior Changes

表现层有这些可见差异，业务请求和权限没有变：

- 登录后 Header 不再显示品牌，也不再显示营销顶栏。只活在顶栏里的文档入口因此在登录后不可见。`TopNav` 组件还在，公开 Header 的默认 `showTopNav` 仍是 `true`。
- Sidebar 品牌不再显示版本号。管理员版本检查仍由 Header 里的 `SystemUpdateAction` 承担。
- `SectionPageLayout` 增加可选 description。现有页面没有传入，版式除标题字重外保持原结构。
- 用户若已选择命名 Theme Preset，preset 仍覆盖默认色。`data-theme-radius` 仍在 preset 之后生效。
- 全局 token 会让公开营销页的主按钮变成同一套紫色。营销页 JSX 没有改，首页大渐变也还在。这是 token 继承，不是首页重构。

未改：认证、权限、路由守卫、计费、Token、渠道、支付、`features/**/api.ts`、DataTable 查询行为、Sidebar 角色过滤和模块隐藏。

## Reused Existing Capabilities

- `AuthenticatedLayout`、`LayoutProvider`、`SidebarProvider`
- `layout_variant` / `layout_collapsible` / `sidebar_state` Cookie
- 默认 variant `inset`，默认 collapsible `icon`
- Ctrl/Cmd+B、Mobile Sheet、Tooltip、子菜单
- System Settings drill-in 的 `SidebarViewHeader`
- `SystemBrand` 读取 `useStatus` / `useSystemConfig`
- Search、Notification、Language、Theme、Profile 仍挂在原 Header
- Light / Dark / System、10 个 Theme Preset、字体、圆角、密度、内容布局、方向
- 现有 Lucide 图标和 i18n 文案

## Tests

工作目录：`D:\doing\new-api\web`。

| 命令 | Exit | 结果 |
| --- | --- | --- |
| `bun run typecheck`（`tsgo -b`） | 0 | `TYPECHECK_EXIT:0` |
| `bun run lint`（`oxlint -c .oxlintrc.json .`） | 1 | 1299 files，65 warnings，165 errors，311.6s。错误在 system-settings、json-parser、`lib/utils.ts`、copy-button、subscriptions、redemptions、footer、ai-elements、rankings、auth validation、`scripts/sync-i18n.mjs` 等本阶段未改文件。本阶段改过的 TSX 不在错误列表里 |
| `bun x oxlint -c .oxlintrc.json` 针对本阶段 TSX | 0 | 第一批 8 files，0 warning / 0 error。第二批 card、dialog、table、alert-dialog 与测试，日志记为 1 file，0 warning / 0 error |
| `bun x oxfmt -c .oxfmtrc.json --write` 针对格式检查失败的两个文件 | 0 | `section-page-layout.test.tsx` 和 `theme-presets.css`。`FORMAT_WRITE_EXIT:0`。centered 选择器格式化后仍有效 |
| `bun run test src/components/layout/__tests__/section-page-layout.test.tsx src/components/ui/__tests__/sidebar-active.test.tsx` | 0 | 2 files，3 tests passed，35.09s |
| `bun run test` | 0 | 175 files passed，2164 tests passed，261.51s，`TEST_EXIT:0` |

更早一次把全量 lint 和这两个新测试并行跑时，Vitest 在执行断言前报 worker startup timeout，0 tests。那是资源争用，不计入产品失败。上面的 exit 0 是 lint 结束后单独重跑的结果。

新测试只断言：不传 description 时没有说明段落；传入 `Description` 后标题下有该段落；active 菜单按钮带 `data-active`、浅紫底和 2px primary 条。它们不覆盖 Cookie、快捷键或移动端 Sheet。

Go 测试：NOT RUN。本阶段没有改 Go。

## Build

| 命令 | Exit | 结果 |
| --- | --- | --- |
| `bun run build`（`rsbuild build`，Rsbuild v2.1.6） | 0 | `ready built in 1m 23.8s`。Total 66257.0 kB。`BUILD_EXIT:0` |

## Regression

浏览器没有登录会话，以下按实查填写。代码仍在，不等于浏览器里点过。

| 项 | 结果 |
| --- | --- |
| App 可以启动 | 已有 `rsbuild dev` 在 `127.0.0.1:5173`，进程命令指向本仓库 `web`。`GET /` 返回 200。Headless Edge 打开后渲染了公开首页。`127.0.0.1:3000` 上已有 `main.exe`，`GET /api/status` 返回 200。没有新开服务器，也没有重启用户正在跑的 dev server |
| Login route | NOT VERIFIED。直接请求 `http://127.0.0.1:5173/sign-in` 返回 404。公开首页上能看见“登录”，没有做客户端跳转后的登录页截图 |
| 登录后 Layout | NOT VERIFIED。没有可用会话，没有伪造登录 |
| Sidebar 展开 / 收起 | NOT VERIFIED。`collapsible`、icon mode class 仍在 |
| Ctrl/Cmd+B | NOT VERIFIED。`SIDEBAR_KEYBOARD_SHORTCUT = 'b'` 和 meta/ctrl 判断仍在 `sidebar.tsx` |
| Mobile Sidebar | NOT VERIFIED。`Sheet` / `openMobile` 仍在 |
| Role-based navigation | 未改导航数据、角色过滤和模块隐藏。浏览器 NOT VERIFIED |
| Search / Command Menu | 组件仍挂在 Header。浏览器 NOT VERIFIED |
| Theme Light | 默认 token 已改。公开首页主按钮呈紫色。完整控制台 NOT VERIFIED |
| Theme Dark | `.dark` token 已改。浏览器 NOT VERIFIED |
| Theme System | 机制未改。浏览器 NOT VERIFIED |
| Language | 组件仍在。浏览器 NOT VERIFIED |
| Notification | 组件仍在。浏览器 NOT VERIFIED |
| Profile Dropdown | 组件仍在。浏览器 NOT VERIFIED |
| System Settings drill-in | `view` 时仍渲染 `SidebarViewHeader`，不渲染品牌。浏览器 NOT VERIFIED |
| 普通业务页面仍可进入 | NOT VERIFIED。没有登录会话 |

## Visual Verification

目标三张图：Overview、API Keys、Admin Channels。

结果：NOT VERIFIED。

Headless Edge（1440×900，独立临时 profile）打开 `http://127.0.0.1:5173/`，exit 0，截到的是未登录公开首页，不是控制台。首页主按钮和“登录”使用了新的紫色 token，营销渐变仍是原页面。没有账号，没有绕过认证，所以没有截 Overview（`/dashboard`）、API Keys（`/keys`）、Admin Channels（`/channels`）。

`:3000` 上的 Go 进程是更早编译的 `main.exe`，不能当作本次前端改动的视觉样本。

## Known Issues

- 全量 `bun run lint` exit 1 是既有问题，不是本阶段引入的。没有顺手修那些文件。
- 登录后若文档入口只存在于营销顶栏，用户会暂时看不见它。这是本阶段按规格关掉登录后营销导航的结果。
- Sidebar 品牌不再显示版本字符串。
- 公开营销页会继承新的默认主色。页面结构未改。
- 暗色、折叠、移动端 Sheet、三条控制台页面没有浏览器验收。
- dev server 对 `/sign-in` 深链返回 404。`rsbuild.config.ts` 未改，按现有服务器行为记录。
- 选中指示条依赖 Tailwind 生成 `data-active:before:*`。类名在源码里，生产 build exit 0，没有再单独反查产物 CSS。

## Diff Review

逐文件看过 `git diff`。改动停在 token、共享 presentation、现有 layout class。没有业务 feature JSX，没有 Go，没有 `api.ts`，没有路由守卫，没有权限判断，没有 DataTable query。没有发现需要撤销的超出 Phase 1 的修改。

`showBrand` 默认 `true`，避免公开 Header 行为被默认改掉。centered 选择器改成 `> :not(header)`，避免把移入 inset 的 Header 限制到内容最大宽度。

## Out-of-scope Items

本阶段没有做，也不在这次 diff 里：

- Overview、Models / Pricing、API Keys、Playground、Usage、Wallet、Profile、Security
- Login、Register
- Channels、Admin Models、Users、System Settings 的页面 JSX
- Phase 2
- 品牌正式名称和 fallback branding 大改
- Go backend、数据库、API contract
- 新的主题 Provider
- 删除或重排动态菜单

等待人工视觉验收。
