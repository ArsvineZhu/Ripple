# 本地诊断系统实施计划

[English implementation plan](2026-10-06-local-diagnostics.md) · [设计规格](../specs/2026-10-06-local-diagnostics-design.zh-CN.md)

**目标：** 建立本机结构化日志与崩溃转储，帮助定位 Island、renderer、X11 和 AI 生命周期问题；错误仍由所属功能区原有的行内界面显示。

**架构：** 使用 `electron-log` 写入日志并转发 renderer 记录；使用 Electron `crashReporter` 保存本机 minidump。主进程诊断服务负责初始化、日志与转储保留、安全错误摘要、窗口生命周期记录、renderer 状态摘要和打开诊断目录。

**技术栈：** Electron 44、electron-log、TypeScript、Vitest、pnpm。

## 全程约束

- 诊断数据写入 `<userData>/diagnostics/`，不读取、迁移或删除旧 Ripple 数据。
- 设置 Ripple Next 用户目录后、创建窗口或子进程前初始化日志和 Crash Reporter。
- Crash Reporter 使用 `uploadToServer: false`；崩溃转储只保存在本机。
- `ripple-next.log` 与一个轮替备份各自上限为 5 MiB；崩溃文件保留 30 天且最多保留 10 个最新条目。
- 日志只写白名单生命周期信息；不记录提示词、回答、密钥、授权头、服务 URL、设置、任务、剪贴板或搜索输入。错误摘要不含自由文本消息。
- 保留功能区现有行内错误 UI，不添加弹窗、自动恢复、renderer 重载或遥测。
- 保持当前分支中用户已暂存的改动；不暂存、不重置、不提交、不发布、不安装本次改动。
- 按项目指定的 Node/pnpm 版本工作；集成后执行 `pnpm check`、`pnpm test` 和 `pnpm package`。

## 文件边界

- `src/shared/diagnostics.ts` 定义严格的 renderer 状态摘要及跨进程诊断类型。
- `src/main/services/diagnostics.ts` 管理 electron-log、Crash Reporter、错误序列化、崩溃文件保留、结构化记录、renderer 状态缓存和目录打开。
- `src/main/index.ts`、`src/main/window.ts`、`src/main/platform/linux/inputShape.ts` 记录启动、窗口、进程及 X11 输入区域生命周期。
- `src/shared/contracts.ts`、`src/preload/index.ts`、`src/main/ipc.ts` 提供唯一新增的设置页 typed IPC，并保留发送方校验；renderer 状态摘要经 electron-log 支持的通道发送。
- `src/renderer/lib/diagnostics.ts`、`src/renderer/index.tsx`、`src/renderer/Island.tsx`、`src/renderer/hooks/useAssistant.ts` 记录 renderer 错误、Island 状态及 AI 耗时/数量信息。
- 设置页与四种语言资源提供“打开诊断目录”操作和设置区行内错误。
- 新增诊断、窗口、renderer、AI 与 IPC 针对性测试；更新中英文开发文档及文档目录。

## 实施任务

### 1. 日志、错误摘要和转储保留

- 将 `electron-log` 加入生产依赖并更新 pnpm lockfile。
- 定义 `RendererDiagnosticContext`：Tab ID、Island mode、展开/提问状态、回答字符数、视口尺寸和输入区域尺寸；用 `IslandMode` 和有限非负数值约束。
- 实现 `serializeDiagnosticError(error)`，只返回错误类型及去掉首行的调用栈；不返回 `Error.message` 或字符串拒绝原因。
- 实现 `pruneCrashReports(directory, now)`，按文件系统修改时间清理超过 30 天的条目，再保留最新 10 项；不解释 Crashpad 文件名或内容。
- 实现 `initializeDiagnostics(userDataPath)` 和 `DiagnosticsService`：结构化日志、错误记录、renderer context 缓存、打开诊断目录。
- 配置日志路径 `<userData>/diagnostics/ripple-next.log`，大小 5 MiB，保留一个 `.old.log`；Linux 目录设为仅当前用户可访问。Crash Reporter 写入 `crashes/` 并关闭上传。日志和 Crash Reporter 初始化失败写入 stderr，不阻止启动。
- 在 `tests/diagnostics.test.ts` 验证消息不会进入日志、调用栈仍保留、30 天/10 项保留规则以及初始化失败的启动行为。

### 2. 主进程、窗口和 Linux 生命周期

- 在 `userData` 设置之后、窗口及子进程创建之前初始化诊断服务。
- 记录启动版本与平台信息、Node `uncaughtExceptionMonitor`、Electron child-process 退出信息；异常观察不接管或抑制进程原有致命行为。
- 窗口创建时记录 `ready-to-show`、显示/隐藏、焦点变化、响应状态、加载失败、renderer 退出原因和退出码，并附上最近一份有效 Island 状态摘要。
- Linux X11 记录输入区域初始化、就绪、错误及变更后的尺寸；不记录鼠标坐标，也不重复记录未变化的几何区域。
- 用 `tests/window-diagnostics.test.ts` 检查生命周期事件、退出原因、窗口标识和最新 context；与诊断基础测试一并运行。

### 3. Renderer 状态、异常与 AI 请求记录

- Renderer 通过 electron-log 支持的日志传输发出保留的状态事件，主进程先严格校验再更新缓存；未知 Tab、非有限尺寸或额外字段不得覆盖有效状态。诊断不新增 context IPC 方法。
- 在 `src/renderer/lib/diagnostics.ts` 封装 `electron-log/renderer`、安全错误记录和小型状态快照。
- 捕获 `window.error`、`unhandledrejection` 及 React root 的 `onCaughtError`、`onUncaughtError`、`onRecoverableError`。
- 在 Island 状态/尺寸变化时记录当前 Tab、mode、展开和提问状态、视口及输入区域尺寸；在 AI 请求开始、首段增量、完成、取消、失败时记录 request ID、耗时、增量数量和最终字符数，不记录问题或回答文本。
- 清点 renderer 中应用自身的设备、剪贴板、媒体、概览等 `console.warn/error` 调用，改为写入安全结构化日志；原有错误 UI 保持不变。
- `tests/diagnostics.test.ts` 验证状态事件校验；新增 renderer 和 AI 测试验证错误类型、request ID 与计数可关联，日志中没有输入和输出文本。

### 4. 设置页诊断目录操作

- 增加 `open-diagnostics-folder` typed IPC，由诊断服务打开本地目录。
- 在 `NoticeCode` 中新增 `diagnosticsFolderOpenFailed`，路由到 `settings` 区域；补齐 en、zh-CN、zh-TW、ja 四种资源。
- 设置页添加打开目录的按钮；打开失败使用原有设置页 `InlineNotices` 显示，不增加全局提示。
- `tests/ipc.test.ts` 检查成功和失败路径；`tests/i18n.test.ts` 检查四种语言键及插值一致。

### 5. 文档和集成验证

- 在中英文开发指南分别说明日志/转储路径、打开方式、保留策略和 minidump 的本地隐私边界；保留已有暂存内容。
- 在双语文档目录加入本实施计划链接。
- 运行 `pnpm check` 和 `pnpm test`，再运行 `pnpm package`。
- 本机打开打包版，确认日志落在 Ripple Next 用户目录、设置按钮可打开目录、AI 日志只有请求生命周期元数据，并确认 Island 窗口关闭后仍留下生命周期记录。
- 使用已有手动触发的 Windows/macOS 打包流程检查构建；不新增逐提交 CI，也不在本任务启动发布。未能实机运行的平台如实标记为未验证。

## 重点验证条件

- 非 `Error` 拒绝和带敏感消息的错误都不得将消息写入日志。
- 崩溃目录不可读或删除失败时应用仍可启动。
- IPC 只接受合法 Island context 和当前主窗口。
- AI 完成后的 renderer 退出能通过 request ID、耗时和字符数回溯，不暴露提示词或回答。
- logger/Crash Reporter 初始化失败不改变启动流程或 Node 致命错误行为。
