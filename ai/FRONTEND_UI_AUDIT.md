# 前端 UI / UX / 组件架构审计

扫描日期：2026-10-06  
扫描根目录：`D:\doing\new-api\web\src`  
事实来源：布局组件、`styles/theme.css`、`styles/theme-presets.css`、`components/ui`、`components/data-table`，以及各功能页的入口文件。  
导入次数来自对 `web/src` 下 1187 个非测试 TypeScript 文件的静态统计。

本文件只记录当前界面事实。没有修改业务源码。路由和接口清单见 `ai/CURRENT_FRONTEND_MAP.md`，这里不重复，除非它直接影响界面判断。

未逐行打开的实现标为 **NOT VERIFIED**。

## 0. 先看结论

当前控制台已经是一套完整的 shadcn / Base UI 设计系统，不是未完成的后台模板。

已经具备、不需要重做的能力包括：侧边栏展开和收成图标、移动端抽屉、深色模式、跟随系统主题、10 套强调色、字体、圆角、密度、内容宽度、命令菜单、DataTable 的排序、筛选、分页、列显隐、桌面表格和移动卡片切换。

登录后没有单独的「用户布局」和「管理员布局」。所有人共用 `AuthenticatedLayout`。差别来自侧边栏条目按角色过滤，以及进入 `/system-settings` 后侧边栏换成设置视图。

视觉上，控制台已经接近「白底、细边框、少阴影、高密度」的开发者产品。默认强调色是蓝色，不是低饱和紫。默认圆角是 `1rem`，偏大。营销首页有渐变和滚动后的毛玻璃顶栏，和参考方向距离更大。

## 1. App Shell

### 1.1 真实结构

登录后只有一套壳：`web/src/components/layout/components/authenticated-layout.tsx`。

```text
┌──────────────────────────────────────────────────────────┐
│ Header  高度 3rem（--app-header-height）                    │
│ [SidebarTrigger] [Logo 名称] [版本]     [顶栏导航 lg+]      │
│                              [搜索][通知][语言][主题][头像] │
├──────────────┬───────────────────────────────────────────┤
│ Sidebar      │ SidebarInset  即 Main Content              │
│ 展开 13rem    │ 高度 = 100svh - 3rem                       │
│ 收起 2.75rem  │ 默认撑满，不居中                            │
│ 或设置子导航  │ ┌─────────────────────────────────────┐   │
│              │ │ SectionPageLayout                    │   │
│ 无底部用户卡  │ │ 标题行  px-3 / sm:px-4               │   │
│              │ │ 内容区  可滚动或固定高度表格           │   │
│              │ │ 可选页脚槽                            │   │
│              │ └─────────────────────────────────────┘   │
└──────────────┴───────────────────────────────────────────┘
```

公开页是另一套壳：`public-layout.tsx` + `public-header.tsx`。没有侧边栏。首页把 `showMainContainer` 关掉，自己排 Hero、区块和 Footer。

认证页是第三套：`features/auth/auth-layout.tsx`。全屏，左上角 Logo 和系统名，表单在 `sm:w-[480px]` 的居中列里。登录和注册都用它。

系统设置不是第三套登录后布局。`features/system-settings/index.tsx` 只渲染 `<Outlet />`。URL 命中后，`AppSidebar` 通过 `useSidebarView()` 把侧边栏内容换成设置分组，并显示返回。这是 drill-in，不是新壳。

登录后页面没有站点 Footer。`Footer` 用在公开首页。控制台里的 `page-footer.tsx` 是表格页底部操作槽，不是品牌页脚。

### 1.2 Sidebar

实现：`components/ui/sidebar.tsx`、`app-sidebar.tsx`、`nav-group.tsx`、`context/layout-provider.tsx`。

| 项 | 源码事实 |
| --- | --- |
| 展开宽度 | `13rem`（208px），常量 `SIDEBAR_WIDTH` |
| 收起宽度 | `2.75rem`（44px），`SIDEBAR_WIDTH_ICON` |
| 移动端抽屉宽 | `17rem`，`SIDEBAR_WIDTH_MOBILE` |
| 是否支持收起 | 支持。默认模式是 `icon`，不是完全藏起 |
| 另一种收起 | `offcanvas`：收到屏幕外。`none`：不允许收 |
| 谁切换 | Header 里的 `SidebarTrigger`。快捷键 Ctrl/Cmd + `b` |
| 展开状态保存 | Cookie `sidebar_state`，7 天。`AuthenticatedLayout` 用它做 `defaultOpen` |
| 收起模式保存 | Cookie `layout_collapsible`，7 天。默认 `icon` |
| 变体保存 | Cookie `layout_variant`，7 天。默认 `inset`，另有 `sidebar`、`floating` |
| 图标 | `lucide-react`。导航项在 `use-sidebar-data.ts` 里各带一个图标组件 |
| 分组 | Chat、General、Personal、Admin。组标题 11px、大写、`text-muted-foreground/70` |
| active | `checkIsActive()`，看当前 URL、`activeUrls` 和一级路径 |
| hover | `SidebarMenuButton` 使用 sidebar accent token。具体 hover class 在 `sidebar.tsx` 的 button variant 里 |
| tooltip | 收起时 `SidebarMenuButton` 的 `tooltip={item.title}` |
| 收起后的子菜单 | `nav-group.tsx`：非移动端且 `state === 'collapsed'` 时，子项变成 Dropdown |
| 用户信息 | 侧边栏底部没有用户卡。用户在 Header 的 `ProfileDropdown` |
| Logo | 登录后 Logo 在 Header 的 `SystemBrand variant="inline"`，高 7、图标 5。侧边栏默认不放 Logo。设置 drill-in 用 `SidebarViewHeader` |
| 角色差异 | 同一组件。`useSidebarView` 按 `role >= 10` 显示 Admin 组，`role === 100` 显示系统信息、任务插件、系统设置 |
| 移动端 | 宽度小于 768px 时 `useIsMobile()` 为真。侧边栏改成 `Sheet`，点链接后 `setOpenMobile(false)` |
| 配置隐藏 | 支持。`SidebarModulesAdmin` 和用户 `sidebar_modules`，见 `use-sidebar-config.ts`。这是菜单显隐，不是组件能力缺失 |
| 拖拽改宽度 | **NOT VERIFIED** 为不支持。源码宽度是常量，没有拖拽手柄 |

`SidebarRail` 挂在侧边栏边缘，用来切换收起。

### 1.3 Header

文件：`header.tsx`、`app-header.tsx`。

高度固定 `--app-header-height: 3rem`（48px）。背景 `bg-transparent`，`sticky top-0 z-40`。内边距 `px-2 sm:px-3`。

从左到右：

1. `SidebarTrigger`，8×8
2. `SystemBrand`：Logo、`status.system_name`，否则字面量 `New API`
3. `SystemUpdateAction`，版本号
4. 右侧：`TopNav`（`hidden lg:block`）、`Search`、`NotificationPopover`、`LanguageSwitcher`、`ConfigDrawer`、`ProfileDropdown`

没有独立的页面标题。页面标题在内容区的 `SectionPageLayout.Title`，是 `h2`。

`ConfigDrawer` 的触发按钮带 `max-md:hidden`。小于 `md` 时，主题面板入口不在 Header 上。

搜索框在 `sm` 以下只留图标。快捷键提示是 `⌘K`，来自 `components/search.tsx`。命令面板是 `components/command-menu.tsx`。

Header 里没有 GitHub 链接。文档在顶栏导航里，由 `use-top-nav-links.ts` 决定，不是 Header 写死的按钮。

这些都是公共组件，不是每个页面自己画的。

### 1.4 Main Content

`main.tsx` 的 `Main` 默认 `fluid = true`。流体时不设最大宽度，占满 `SidebarInset`。`fluid={false}` 时在 `@7xl/content` 容器下居中并 `max-w-7xl`。多数列表页没有关流体。

另外有用户偏好：`data-theme-content-layout="centered"`。视口至少 1280px 时，`SidebarInset` 的直接子节点 `max-width: 1280px` 并水平居中。默认是 `full`。存在 `theme-presets.css` 第 718 行。

`SectionPageLayout` 的统一节奏：

- 标题区：`px-3 pt-3 pb-2.5`，`sm` 起 `px-4 pt-5 pb-3`
- 标题：`text-base font-bold sm:text-lg`，过长截断
- 内容区：`px-3 pt-1 pb-3`，`sm` 起 `px-4`
- `fixedContent` 时内容区 `overflow-hidden`，给表格自己滚

钱包和资料页在内容里再套 `max-w-7xl mx-auto`。Playground 输入区是 `max-w-4xl`。所以并不是每页同一宽度，但外壳 padding 对使用 `SectionPageLayout` 的页面是一致的。

使用 `SectionPageLayout` 的功能目录：channels、dashboard、keys、models、redemption-codes、security、subscriptions、system-info、system-settings、task-plugins、usage-logs、users、wallet。Profile 自己用 `Main`，没有这个标题条。

### 1.5 公开顶栏和移动导航

`public-header.tsx`：未滚动时高 `h-16`，滚动后收成 `h-12` 的圆角条，`max-w-[52rem]`，带 `backdrop-blur-2xl` 和很轻的阴影。

移动端有自己的开关状态 `mobileOpen`。具体抽屉动画常量在 `layout/constants.ts`：底部 95% 宽、`md:hidden`。公开顶栏的汉堡按钮实现 **NOT VERIFIED** 到每一行，但文件里存在 `setMobileOpen` 和 `handleNavLinkClick(..., closeMobile)`。

登录后的移动导航就是侧边栏 Sheet，没有第二套底部 Tab。

## 2. Design System

颜色集中在 `web/src/styles/theme.css` 的 CSS 变量。Tailwind v4 用 `@theme inline` 把它们映射成 `bg-background`、`text-foreground`、`bg-primary` 等。组件不散落写死品牌色，除了首页 Hero 的径向渐变和公开顶栏的阴影。

预设在 `theme-presets.css`，用 `body[data-theme-preset]` 覆盖同一组变量。

### 2.1 默认 Light

| Token | 值 | 观感 |
| --- | --- | --- |
| background | `oklch(1 0 0)` | 纯白 |
| card / popover | 同纯白 | 靠边框分层，不靠灰底 |
| foreground | `oklch(0.145 0 0)` | 近黑正文 |
| muted-foreground | `oklch(0.49 0 0)` | 中灰辅助字 |
| muted | `oklch(0.97 0 0)` | 很浅的灰填充 |
| border / input | `oklch(0.93 0 0)` | 细、浅 |
| primary | `oklch(0.692 0.141 243.716)` | 中高明度蓝 |
| primary-foreground | 白 | |
| accent | primary 的 12% 混进背景 | 蓝的淡底，不是独立紫 |
| destructive | `oklch(0.577 0.245 27.325)` | 红 |
| success | `oklch(0.596 0.145 163.225)` | 绿 |
| warning | `oklch(0.681 0.162 75.834)` | 琥珀 |
| info | `oklch(0.588 0.158 241.966)` | 蓝 |
| sidebar | 前景 0.5% 混进背景 | 几乎和页面同色 |
| ring | 蓝色 `oklch(0.708 0.16 249)` | |

图表有五色：蓝、青、紫、品红、绿。`--overview-accent-1/2/3` 也是蓝和青，不是单紫色。

### 2.2 默认 Dark

注释写明 “OpenAI-like dark mode”。背景 `oklch(0.235 0 0)`，卡片 `0.285`，正文 `0.965`。primary 变成更深的蓝 `oklch(0.54 0.142 248.5)`。边框改成 `oklch(1 0 0 / 10%)`。success / warning / destructive 都有暗色对应值。

### 2.3 主题能力

`context/theme-provider.tsx`：

- `light`、`dark`、`system`
- 默认 `system`
- 存在 localStorage 键 `newapi:theme:v1:mode`
- 跟随 `prefers-color-scheme`

`ConfigDrawer` 还能改：

- 预设：default、anthropic、simple-large、underground、rose-garden、lake-view、sunset-glow、forest-whisper、ocean-breeze、lavender-dream
- 字体：default、sans、serif
- 圆角：default、none、sm、md、lg、xl
- 密度：default、sm、lg、xl
- 侧边栏：icon / offcanvas / none，以及 inset / sidebar / floating
- 内容布局：full / centered
- 文字方向

这些偏好键都在 `lib/theme-storage.ts`，前缀 `newapi:theme:v1:`。重置会同时恢复方向、主题、布局和自定义。

没有从系统设置里改「全站 CSS 主色」的前端入口。运营者改的是站点名、Logo、页脚 HTML。强调色是每个浏览器自己的主题偏好。

### 2.4 圆角、阴影、间距、字

默认 `--radius: 1rem`。派生：

- `--radius-md` = 0.8 倍
- `--radius-lg` = 1 倍
- `--radius-xl` = 1.4 倍
- 直到 `--radius-4xl` = 2.6 倍

用户若选 `sm`，预设文件把 `--radius` 设为 `0.375rem`；`md` 是 `0.5rem`；`lg` 是 `0.75rem`；`xl` 回到 `1rem`。

`theme.css` 里没有 shadow token。阴影是组件上的 Tailwind：卡片常用 `shadow-xs`，公开顶栏滚动后有一条很轻的投影。不是大阴影体系。

间距没有单独的 4/8/12 设计表。默认沿用 Tailwind 的 `--spacing`。密度档会改它：`sm` 为 `0.225rem`，`lg` 为 `0.28rem`，`xl` 为 `0.3rem`。页面自己的节奏主要是 `gap-4`、`px-3`、`sm:px-4`。

字体：

- 无衬线：Public Sans Variable，`--font-sans`
- 衬线：Lora Variable，另有 CJK 回退，`--font-serif`
- 默认预设解析为 sans（`PRESET_DEFAULT_FONT`）
- anthropic 预设默认 serif
- 等宽：代码和密钥用 `font-mono`，不跟正文切换

默认字号走 Tailwind。页面标题是 `text-base sm:text-lg font-bold`。概览引导标题到 `text-xl sm:text-2xl`。登录标题 `text-2xl font-semibold`。行高常见 `leading-relaxed` 或默认。密度档会覆盖 `--text-xs` 到 `--text-3xl`。

### 2.5 图标

导航、按钮、空状态以 `lucide-react` 为主。1187 个文件里有 295 个文件引用它。

`@lobehub/icons` 只在 home 和 lib 出现，用于首页应用图标，不是全站图标系统。

`assets/brand-icons` 和 `assets/custom/icon-*` 是主题面板和品牌用的少量自定义 SVG。

尺寸没有单独文档。常见是 `size-4`、`size-3.5`、Header 按钮 `size-8`、Logo `size-5` 或 `size-7`。

## 3. 公共组件

统计口径：文件中出现 `from '@/components/ui/...'` 的次数。一个文件可引用多次。测试文件未计入。

### 3.1 GLOBAL HIGH IMPACT COMPONENT

改这些文件，大量页面会一起变。

| 组件 | 位置 | 引用文件数 | 影响 |
| --- | --- | --- | --- |
| Theme tokens | `styles/theme.css`、`theme-presets.css` | 全站 class | 颜色、圆角、暗色、密度 |
| Button | `components/ui/button.tsx` | 283 | 几乎每个功能 |
| Input | `components/ui/input.tsx` | 120 | 所有表单 |
| Form | `components/ui/form.tsx` | 70 | 创建和编辑 |
| Tooltip | `components/ui/tooltip.tsx` | 57 | 表格和图表 |
| Alert | `components/ui/alert.tsx` | 54 | 错误和说明 |
| Badge | `components/ui/badge.tsx` | 53 | 状态 |
| DataTable 子系统 | `components/data-table/` | 53 个文件直接导入桶 | Keys、渠道、模型、用户、日志、兑换码、订阅、部分设置 |
| Skeleton | `components/ui/skeleton.tsx` | 51 | 加载 |
| Switch | `components/ui/switch.tsx` | 52 | 开关设置 |
| Label | `components/ui/label.tsx` | 65 | 表单 |
| Select | `components/ui/select.tsx` | 41 | 筛选和下拉 |
| DropdownMenu | `components/ui/dropdown-menu.tsx` | 33 | 行操作 |
| Tabs | `components/ui/tabs.tsx` | 32 | 仪表盘、日志、模型、价格 |
| Sheet | `components/ui/sheet.tsx` | 21 | 侧栏抽屉和主题面板 |
| SectionPageLayout | `layout/components/section-page-layout.tsx` | 17 个功能目录 | 控制台页头和边距 |
| AuthenticatedLayout + Header + Sidebar | `layout/components/` | 所有登录路由 | 整站壳 |
| Sonner | `components/ui/sonner.tsx` | 根路由挂载；toast 调用出现在 145 个文件 | 全局反馈 |
| Sidebar 原语 | `components/ui/sidebar.tsx` | 壳和导航 | 收起、移动端、tooltip |

`components/ui/dialog.tsx` 只有 3 个文件直接导入。业务对话框多数走 `components/dialog.tsx` 和 `components/confirm-dialog.tsx`。改基础 Dialog 仍会波及这些包装。包装器的调用面 **NOT VERIFIED** 到精确文件数。

`components/ui/table.tsx` 只有 11 次直接导入。列表页不直接用它，而用 DataTable。改裸 Table 不会自动改完所有列表。

`components/ui/card.tsx` 25 次。概览和钱包有不少卡片是手写 `bg-card rounded-2xl border shadow-xs`，不经过 `Card`。改 `card.tsx` 盖不全这些手写卡。

### 3.2 已有、应保留的交互件

| 能力 | 位置 | 说明 |
| --- | --- | --- |
| DataTable 分页 | `data-table/core/pagination.tsx` | |
| 列排序头 | `core/column-header.tsx` | |
| 列显隐 | `toolbar/view-options.tsx` | |
| 工具栏筛选 | `toolbar/toolbar.tsx`、`faceted-filter.tsx` | |
| 移动筛选面板 | `toolbar/mobile-filter-panel.tsx` | |
| 批量操作 | `toolbar/bulk-actions.tsx` | |
| 桌面表格 / 移动卡片 | `layout/mobile-card-list.tsx`、`view-mode-toggle.tsx` | 模式可记在 localStorage |
| 空表 | `core/table-empty.tsx` | |
| 表骨架 | `core/table-skeleton.tsx` | |
| 行操作菜单 | `core/row-action-menu.tsx` | |
| Empty | `ui/empty.tsx` | 18 个文件 |
| Spinner | `ui/spinner.tsx` | |
| Calendar | `ui/calendar.tsx` | 仅 2 个文件直接引用。没有全站统一 DatePicker 产品组件 |
| Drawer | `ui/drawer.tsx` | 直接引用少。创建密钥用的是 Sheet 形态的 mutate drawer |
| Resizable | `ui/resizable.tsx` | 原语存在。哪些业务页使用 **NOT VERIFIED** |
| Chart 包装 | `ui/chart.tsx` | 基于 Recharts。仪表盘图表在 `features/dashboard` 里再包一层 |
| Code | `components/ai-elements/code-block.tsx` | Shiki，明暗两套 token，见 `styles/index.css` |
| Copy | 各功能自己的复制按钮 | 没有单一全局 CopyButton 被全站引用。**NOT VERIFIED** 是否有一个被多数页面共用的复制组件 |
| Toast | sonner | |
| Command | `ui/command.tsx` + `command-menu.tsx` | |
| Kbd | `ui/kbd.tsx` | |

虚拟列表：在 `web` 内搜索 `useVirtualizer`、`react-window`、`react-virtuoso`，没有匹配。长表用分页，不虚拟化。

### 3.3 重复

- 列表：DataTable 是主路径。`ui/table.tsx` 仍被系统信息和少量设置使用。
- 对话框：`ui/dialog`、`components/dialog`、`confirm-dialog`、`alert-dialog` 并存。职责不同，不是两套视觉。
- 卡片：`ui/card`、`ui/titled-card`，以及概览和钱包里的手写 card class。
- 图标：Lucide 为主，首页另用 lobehub。

## 4. 逐页 UI

下列「值得保留」只指当前实现已经合理的部分，不是禁止以后改文案或品牌。

### 4.1 公开首页

文件：`features/home/index.tsx`。`PublicLayout` 的主容器被关掉。内容来自 `useHomePageContent()`：有自定义内容时走 iframe、HTML 或 Markdown；否则是 Hero、Stats、Features、HowItWorks、CTA、Footer。

页头是公开顶栏，不是 `SectionPageLayout`。主按钮在 Hero 里：已登录去控制台，未登录去注册，另有价格和文档。加载和空内容的细节 **NOT VERIFIED**。移动端靠公开顶栏和区块的响应式 class。

值得保留：自定义首页可以整页替换，主题和语言会 postMessage 给 iframe。营销区块和产品控制台是分开的。

传统后台感弱。营销渐变、滚动毛玻璃更像落地页。若只要控制台变样，不必先动这套区块结构。

### 4.2 模型广场 `/pricing`

`features/pricing/index.tsx`，包在 `PublicLayout` 里。

组件：`SearchBar`、`PricingSidebar`、`PricingToolbar`、`PricingTable`、`ModelCardGrid`、`ModelDetailsDrawer`、`LoadingSkeleton`、`EmptyState`。

视图有两种：`VIEW_MODES.CARD` 和 `TABLE`。筛选包括搜索、供应商、分组、计费类型、端点类型、标签、排序、token 单位，默认单位是 `M`。数据来自 `usePricingData()`，字段含模型、供应商、分组倍率、可用分组、端点。模型图标的具体组件 **NOT VERIFIED**。

主操作是打开模型详情抽屉。这是公开浏览页，不是管理 CRUD。

值得保留：同一份数据能在卡片和表格之间切换，筛选维度已经够用。详情用抽屉而不是跳页，适合对比价格。

### 4.3 登录和注册

`sign-in/index.tsx`、`sign-up/index.tsx` 都用 `AuthLayout`。标题居中到 `sm` 后改左对齐。注册开关看 `status.register_enabled` 和自用模式。表单是 `UserAuthForm`。协议是 `TermsFooter`。

加载：Logo 和站名用 `Skeleton`。没有单独的营销侧栏。移动端是上下堆叠的单列，`pt-16` 避开左上角 Logo。

值得保留：认证页不套控制台侧边栏，品牌只来自系统配置。这是合理的分界。

### 4.4 概览 `/dashboard/overview`

`OverviewDashboard` 使用 `SectionPageLayout`。标题是 Overview。

内容：

- 上手引导：创建密钥、充值、发一次请求。完成状态看是否已有 key、余额或用量、`request_count`。展开状态本地保存。
- 右侧推荐动作：密钥、用量、价格；管理员多一个渠道。
- 其后的统计卡在 `SummaryCards`，用 `StatCard`。数据包括余额、用量、请求，并请求 `getUserQuotaDates` 做 12 段 sparkline。卡片配置来自 `useSummaryCardsConfig()`。引导折叠后的下半屏 **NOT VERIFIED** 到每一张卡的最终顺序，但文件在引导块之后继续渲染。

主操作：创建 API Key。次操作：隐藏引导、跳到钱包、试用、日志、价格。

管理员和普通用户共用这一页。管理员只多推荐动作里的渠道。用户分析不在这一页，在 `/dashboard/users`。

这一页已经是产品首页，不是旧式四格后台。卡片、边框、`shadow-xs`、步骤列表都在。值得保留信息架构：先告诉用户下一步，再给数字。

### 4.5 仪表盘其他段

`features/dashboard/index.tsx`。`overview` 单独渲染。`models`、`flow`、`users` 用 `SectionPageLayout` 加 Tabs。

`models`：统计卡、管理员才有的性能概览、消耗分布图、模型图表。筛选和时间粒度可保存。  
`flow`：流量图，可隐藏敏感数字。  
`users`：用户图。标签只对 `role >= 10` 显示。路由本身是否拦截普通用户，见功能地图，不在这里重复。

图表是懒加载，带 Suspense fallback。空数据和每个图的交互细节 **NOT VERIFIED**。

### 4.6 管理员模型 `/models/$section`

`features/models/index.tsx`。三个 Tab：metadata、vendors、deployments。都是 `SectionPageLayout fixedContent`。

metadata 是 `ModelsTable` 加主要按钮。vendors 是 `VendorsTable`，主按钮「添加供应商」。deployments 是部署表和创建按钮。

这是管理 CRUD，不是公开价格页。表格、抽屉和对话框来自本功能和 DataTable。供应商图标列 **NOT VERIFIED**。

### 4.7 API Keys

见第 6 节。

### 4.8 Playground

`features/playground/index.tsx`。不使用 `SectionPageLayout`。整页是纵向 flex：上面消息区滚动，下面输入区 `max-w-4xl` 居中。

输入区能改模型、分组和参数。生成中可停止。消息可重新生成、编辑、删除。空对话的欢迎态 **NOT VERIFIED**。

这是聊天工作台，不是表格后台。布局已经按对话产品来做。值得保留「消息在上、输入在下、宽度收束」的结构。

### 4.9 用量日志

`features/usage-logs/index.tsx`。`SectionPageLayout`。普通日志、绘图、任务是分段。管理员可在 All / Only Mine 之间切换。表格是 `UsageLogsTable`。

另有用户信息对话框和渠道亲和缓存对话框。移动端走 DataTable 的卡片模式，是否每列都标了 compact meta **NOT VERIFIED**。

### 4.10 钱包

见第 8 节。

### 4.11 资料

`features/profile/index.tsx` 不用标准页头。`Main` 里 `max-w-7xl`，`px-3 py-3 sm:px-4 sm:py-6`。

一块是 `ProfileHeader`。旁边大屏是两列：左侧设置和语言，右侧在 `xl` 时出现。签到卡只在 `status.checkin_enabled` 时出现。侧边栏自选模块卡在 `permissions.sidebar_settings !== false` 时出现。

加载态在子卡内部，本文件没有统一骨架。值得保留：账户偏好和运营开关分开，而且开关来自状态接口。

### 4.12 安全

`features/security/index.tsx`。`SectionPageLayout` 加 `TitledCard`。卡片包括访问令牌、两步验证、Passkey、登录会话、账号绑定、隐私、账号操作。

加载是三块 `Skeleton`。没有资料时用 `Empty`。这是卡片设置页，不是表格。结构已经清楚，不需要为了「不像后台」把安全项改成向导。

### 4.13 渠道、用户、兑换码、订阅

渠道：`Channels` + `SectionPageLayout` + `ChannelsTable` + 主按钮 + 对话框。超级管理员额外看渠道运维信息。  
用户、兑换码、订阅同样是「标题 + 主按钮 + DataTable + 行操作 + 抽屉或对话框」。各页列定义 **NOT VERIFIED** 到字段级，除密钥页外。

这些页的传统后台感来自密度和表格，不来自过时组件。DataTable 已经有筛选、分页和移动卡片。为了看起来不同而去掉表格，会损失管理效率。

### 4.14 系统设置

外壳仍是登录后壳。侧边栏换成设置分组。各 section 是表单，不是另一套视觉语言。分组很多，这是复杂度的来源。表单控件仍是 Input、Switch、Select、Field。

## 5. Dashboard 数据

普通用户概览使用当前用户对象上的 `quota`、`used_quota`、`request_count`。密钥列表调用密钥接口，`getApiKeys({ p: 1, size: 10 })`。可用模型调用 `getUserModels()`。趋势调用 `getUserQuotaDates`。这些都是已有后端读接口，重新排卡片不需要改 Go。

模型分析段使用仪表盘数据接口和图表偏好。性能概览只对管理员渲染。用户段只对管理员显示标签。具体路径 `/api/data`、`/api/data/self` 等已在功能地图列出，这里不重复。

已有 UI 块：

- 指标：`StatCard` 和 summary sparkline
- 图：消耗分布、模型分析、流量、用户
- 表：概览本身不是主表格
- 引导步骤和推荐动作
- 公告、API 信息、FAQ、Uptime 面板，由 `useDashboardContentVisibility()` 决定是否出现

没有单独的「排行榜」块在概览里。排行榜是公开页 `/rankings`。

管理员和普通用户的概览骨架相同。差异是推荐动作、性能卡，以及能否进入 models/flow/users 里的管理视图。

## 6. API Keys 页面

页面：`features/keys/index.tsx`。标题加 `ApiKeysPrimaryButtons`，内容是 `ApiKeysTable`，`fixedContent`。

表格列，来自 `api-keys-columns.tsx`：

- 选择
- Name
- Status
- API Key
- Quota，带当前货币单位
- Group
- Models
- IP Restriction
- Time
- Expires
- Actions

创建和编辑在 `api-keys-mutate-drawer.tsx`，不是独立路由，也不是居中大表单页。分区：

1. Basic Information：名称、分组、自动分组顺序、跨组重试、过期时间（永不、1 小时、1 天、1 月）、创建时的数量
2. Quota Settings：额度或无限额度
3. Advanced Settings：模型限制、IP 白名单（支持 CIDR）

删除有单条和批量对话框。复制发生在密钥单元格，具体按钮 **NOT VERIFIED** 到组件名，但列里有 API Key 字段。

状态在表格列，不在抽屉标题上。

可以直接复用：DataTable、Sheet 抽屉布局、Form、Input、Combobox、Switch、Alert Dialog。重新设计列顺序、页头文案、空状态插画，不会改变 `/api/token` 的请求体。改字段名或少提交现有字段，会影响业务。

## 7. 模型与价格，三套界面

公开价格页：卡片或表格，面向浏览和比较。有供应商筛选和价格单位。没有创建按钮。

用户侧和模型相关的控制台页是 `/dashboard/models`，那是调用分析图，不是模型目录。用户能调用哪些模型，出现在概览的 `getUserModels()` 和 Playground 的模型选择里。没有一个「用户的模型库管理页」。

管理员模型页：metadata 表、供应商表、部署表。这是写操作。和公开价格页共用模型数据的程度 **NOT VERIFIED**。不要把三套合成一个组件再改，它们的任务不同。

价格字段的展示格式在 `features/pricing` 和 `lib/format`、`lib/currency`。图标若来自供应商或 lobehub，只在对应组件里。公开页的图标实现 **NOT VERIFIED**。

## 8. 钱包和账单

全部在 `/wallet` 一个页面里，不是多个一级路由。`features/wallet/index.tsx`：

- `WalletStatsCard`：余额等用户数字
- `RechargeFormCard`：充值金额、预设档位、支付方式、兑换码输入
- `SubscriptionPlansCard`：仅当套餐可用时出现，大屏时跟充值并排
- `AffiliateRewardsCard`：邀请奖励和划转
- `BillingHistoryDialog`：充值历史是对话框，不是独立页
- `PaymentConfirmDialog`、`CreemConfirmDialog`、`TransferDialog`

支付方式按接口开关出现：`enable_creem_topup`、`enable_waffo_topup`、`enable_waffo_pancake_topup`，以及 `topupInfo` 里的在线支付和 Stripe 字段。未启用的不会被画成主按钮。具体每种按钮的渲染条件在 `RechargeFormCard` 内，**NOT VERIFIED** 到每个分支。

签到不在钱包。它在资料页，而且要 `checkin_enabled`。

消费明细不在钱包主列。用量在 `/usage-logs`。钱包历史是充值记录。

订阅管理后台是另一个管理员页 `/subscriptions`。用户购买在钱包的套餐卡。

## 9. 响应式

断点事实：

- `useIsMobile`：宽度小于 768
- Tailwind：`sm` 640、`md` 768、`lg` 1024、`xl` 1280，页面 class 大量使用
- 内容居中偏好另有 `min-width: 1280px`

桌面：侧边栏加全宽内容。顶栏导航显示。表格是表格。

笔记本：同一结构。顶栏在 `lg` 以下隐藏文字导航，搜索变窄。

平板：小于 768 时侧边栏改 Sheet。`md` 以下主题抽屉按钮隐藏。

手机：

- 侧边栏是从边缘打开的 Sheet，宽 17rem
- DataTable 可切到 `MobileCardList`
- 筛选有 `DataTableMobileFilterPanel`
- 对话框用 `styles/index.css` 的 `dvh` 和 safe-area，避免底部按钮被浏览器工具栏挡住
- 公开顶栏有移动开关
- 密钥页 metadata 段允许 `stackActionsOnMobile`
- 钱包在小于 `xl` 时变成单列
- 资料页在小于 `xl` 时取消右侧栏

明确的缺口：`ConfigDrawer` 在 `max-md:hidden`。手机 Header 上没有主题按钮。深色模式不是没有，而是小屏入口被藏了。是否在别处补了入口，**NOT VERIFIED**。

表格在没写 mobile card 字段的列上会怎样，**NOT VERIFIED**。组件支持卡片模式，不代表每一列都适配过。

## 10. 已经存在的高级能力

这些都不要重新开发。

- 侧边栏收成图标、收到屏外、或禁止收起
- 侧边栏开关状态 Cookie，模式和变体另有 Cookie
- Ctrl/Cmd+B
- 移动端侧边栏 Sheet
- 收起时 tooltip，以及子菜单改成下拉
- 设置页 drill-in 侧边栏
- 侧边栏模块可按后台配置和用户偏好隐藏
- Light、Dark、System
- 10 个颜色预设，含一版薰衣草
- 字体 sans、serif
- 圆角五档、密度四档
- 内容 full 或 centered
- 侧边栏 inset、sidebar、floating
- 文字方向
- 偏好存在 localStorage，键名 `newapi:theme:v1:*`
- 语言切换，并写回用户资料
- 命令菜单和搜索框，界面提示 ⌘K
- 通知弹层
- 复制密钥、代码高亮（Shiki 双主题）
- Skeleton、Empty、Spinner、Sonner
- 表格排序、筛选、分页、列显隐、批量操作、视图模式记忆
- 图表筛选和时间粒度可保存
- 概览引导展开状态可保存
- 敏感数字可临时隐藏
- 减少动效：`useReducedMotion`
- 跳到主内容：`SkipToMain`

没有找到虚拟列表。列宽拖拽如果存在，只在 DataTable 的 sizing 文件里，业务是否开启 **NOT VERIFIED**。

## 11. Branding

| 来源 | 内容 |
| --- | --- |
| `GET /api/status` | `system_name`、`logo`、页脚 HTML、文档链接、关于、首页自定义内容、公告、协议开关 |
| 系统设置站点页 | 写入上述选项的表单。默认表单值里系统名仍是 `New API` |
| `lib/constants.ts` | `DEFAULT_SYSTEM_NAME = 'New API'`，`DEFAULT_LOGO = '/logo.png'` |
| `index.html` | `<title>New API` 和描述 |
| `main.tsx` | 启动后用缓存的 `system_name` 改 `document.title`，用 logo 改 favicon |
| `assets/logo.tsx` | SVG，`id="newapi-logo"`，`<title>New API</title>` |
| `public/logo.png`、`public/favicon.ico` | 静态文件 |
| Footer | 无自定义 HTML 时用系统名；演示站模式链到 `docs.newapi.pro` 等 |
| i18n | 键是英文句子。界面句子要改各语言文件的值 |
| localStorage | 只存主题偏好，不存产品名 |
| Cookie | 侧边栏和布局，不存品牌 |

运营者已经能改名称、Logo、页脚、首页、关于和文档链接，不用改 React。改不了的是：HTML 初始标题、常量兜底、SVG 组件、演示站外链、i18n 里出现的 “New API” 句子、主题存储键前缀 `newapi:`。那些要改前端源码。

## 12. 客观评分

| 项 | 分 | 原因 |
| --- | --- | --- |
| Consistency | 8 | Token、Button、DataTable、SectionPageLayout 覆盖了控制台。扣分是手写卡片和首页渐变没有完全走同一套 |
| Information hierarchy | 7 | 概览有引导和指标。设置项很多，层级靠 drill-in，仍然密 |
| Developer experience | 8 | 功能按目录拆，壳和表格可复用，主题可预览。新页面有明确落点 |
| Visual quality | 7 | 白底、细边框、暗色完整，已经是设计过的界面。默认蓝和 16px 圆角决定了现在的脸 |
| Usability | 7 | 搜索、命令菜单、空状态、确认框、移动卡片都在。小屏没有主题按钮 |
| Responsive | 7 | 768 抽屉、表格卡片、对话框 safe-area 都是实做。不是每个管理页都在手机上核对过 |
| Maintainability | 8 | 改 token 和 DataTable 能波及全局，而且边界清楚 |
| Brand identity | 4 | 运行时能换名和 Logo，源码兜底、文档站和存储键仍是 New API |
| Admin feeling | 6 | 渠道、用户、日志就是高密度管理表，这是任务需要。概览和试用已经不是旧后台 |
| Modern SaaS feeling | 7 | 概览、价格广场、登录、Playground、主题系统都在现代产品范围内。默认蓝和营销渐变还不是「低饱和紫、无发光」 |

## 13. 三个列表

### A. KEEP

- `AuthenticatedLayout` 这一套壳，以及设置 drill-in
- 侧边栏收起、Cookie、快捷键、移动 Sheet、tooltip
- 主题系统：模式、预设、字体、圆角、密度、内容宽度
- `SectionPageLayout` 的标题、操作、内容、底槽
- DataTable 全套，含移动卡片和筛选
- 概览的引导步骤、指标卡和推荐动作
- Playground 的对话布局
- 公开价格的表格/卡片切换、筛选和详情抽屉
- 钱包单页里的余额、充值、兑换、套餐、邀请、历史对话框
- 安全页的分卡片
- 登录页独立于控制台壳
- 状态接口驱动的名称、Logo、首页、页脚、导航开关

### B. REDESIGN

这些改了能被看出来，而且不需要先拆架构。

- 默认 token：主色从蓝到低饱和紫，圆角从 `1rem` 收到小或中等
- 品牌兜底：标题、常量、SVG、演示站外链、i18n 里的产品句
- 公开首页 Hero 的渐变和滚动毛玻璃，如果产品不要落地页发光
- 手机上主题入口被 `max-md:hidden` 藏住
- 系统设置的分组名称和信息密度。结构可留，第一屏可以更收
- 手写 `rounded-2xl border shadow-xs` 卡片和 `ui/card` 的视觉如果要统一，只改 class，不改数据

### C. DO NOT REBUILD

- Sidebar 展开收起和移动导航
- Dark mode 和 System theme
- 预设、圆角、密度、内容布局
- 命令菜单和 ⌘K
- DataTable 的排序、筛选、分页、列显隐、批量、卡片视图
- 图表、骨架、空状态、Toast
- i18n 七种语言
- 侧边栏按配置隐藏
- 钱包按支付开关显示方式
- 认证页布局

## 14. 改造影响地图

```text
styles/theme.css
styles/theme-presets.css
        │
        ├─ Button、Input、Badge、Tabs、Sidebar、表格色
        ├─ 手写的 bg-card / border / text-muted-foreground
        └─ 约八成登录后页面，加上公开页和登录页

AuthenticatedLayout
        ├─ AppHeader
        ├─ AppSidebar / ui/sidebar
        └─ SidebarInset
                └─ 每一个登录后页面

SectionPageLayout
        └─ 密钥、渠道、模型、用户、日志、钱包、订阅、兑换码、多数设置页
           Profile 和 Playground 不走它

components/data-table
        └─ keys、channels、models、users、usage-logs、
           redemption-codes、subscriptions、部分 system-settings、
           task-plugins、system-info、pricing 的表格模式

components/ui/form.tsx + sheet + dialog 包装
        └─ 创建和编辑。改间距安全，改提交字段危险

features/dashboard/components/overview
        └─ 只影响概览。改布局不影响其他列表

features/pricing
        └─ 只影响公开模型广场

features/home
        └─ 只影响默认营销首页。自定义 HTML 首页不受组件样式完全控制
```

若只想让整个产品变一个视觉，优先顺序是：

1. `theme.css` 的默认 light 和 dark token，尤其 primary、border、radius
2. `theme-presets.css` 里 default 预设是否还要覆盖这些值。当前 default 预设主要靠 `:root`，具名预设会覆盖
3. `SectionPageLayout` 和 Header 高度，只在需要改密度时动
4. 品牌常量、`index.html`、Logo SVG、Footer 兜底

不要先改的：

- `api.ts`、表单提交 payload、路由守卫
- DataTable 的筛选参数和分页协议
- 侧边栏权限过滤
- 支付和兑换的请求函数

改 `Button` 的尺寸或圆角是全局视觉。改 `Button` 的 `onClick` 约定或 `render` 属性会破坏大量调用，那是行为，不是皮肤。

## 15. 和参考视觉的距离

参考：浅色优先、白和冷灰、深色字、低饱和紫只做强调、细边框、少阴影、小到中圆角、高密度、留白合理、不要发光和大面积紫渐变、保留暗色。

已经一致：

- 默认浅色可以是纯白，正文近黑，辅助字是灰
- 边框浅而细
- 控制台阴影只有 `shadow-xs` 一级
- 列表和页边距密度高
- 暗色模式、系统主题都已实现
- 强调色通过 token 集中，改一处能进按钮、焦点环和侧边栏

接近：

- 背景是白，卡片也是白，分层靠边框。冷灰只出现在 `muted`
- 概览有留白，但不是巨大的营销留白
- 图表仍是多色，不只一个紫

明显不同：

- 默认 primary 是蓝，色相约 244，不是低饱和紫。薰衣草预设存在，但不是默认
- 默认圆角 `1rem`，比「小到中」大。用户可以选更小，默认不是
- 首页 Hero 使用多段径向渐变。公开顶栏滚动后有毛玻璃和投影
- 图表和概览强调色不是单一紫色

因此控制台大约六成已经在这个方向上。差的主要是默认蓝、偏大圆角，以及营销首页的渐变。不需要推倒壳、表格和主题系统。

## 16. 扫描边界

读过入口或实现的页面：公开首页、价格广场、登录、注册、概览、仪表盘模型/流量/用户段、管理员模型、密钥、试用、用量、钱包、资料、安全、渠道、系统设置外壳。用户管理、兑换码、订阅只确认了它们使用同一套 `SectionPageLayout` + DataTable 模式，没有逐列阅读。

没有打开浏览器。没有改业务源码。
