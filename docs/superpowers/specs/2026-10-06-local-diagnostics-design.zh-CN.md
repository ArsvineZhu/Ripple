# 本地诊断系统

**状态：** 评审稿
**日期：** 2026-10-06
**读者：** Ripple Next 维护者

[English](2026-10-06-local-diagnostics-design.md)

## 目标

发生 Island 消失时，能从本机记录判断是窗口被隐藏或关闭、renderer 退出、X11 输入区域初始化失败，还是 AI 请求结束后答案没有显示。renderer 或原生进程退出后，诊断信息仍可读取。

当前 Electron 主进程可能在 Island 窗口消失后继续运行，但应用没有统一的文件日志，也没有记录 renderer 和 Electron 子进程退出原因。诊断能力要覆盖这些生命周期，同时保持现有 Island 交互和错误呈现方式。

## 设计决策

- 使用 `electron-log` 写入文件，并采用它支持的 renderer 到 main 日志通道。
- 使用 Electron `crashReporter` 在本机保存原生 minidump，明确设置 `uploadToServer: false`。
- 在创建 renderer 或其他子进程之前初始化日志和崩溃转储。
- 所有诊断数据存放在 `<userData>/diagnostics/`，与 SQLite 数据库及 API 密钥记录分开。
- 设置页增加“打开诊断目录”操作。运行错误继续由所属功能区原有的行内提示显示，诊断系统不增加悬浮提示或弹窗。
- 本次不自动重载 renderer、重建窗口或重启应用。

实现参考：[Electron `crashReporter`](https://www.electronjs.org/docs/latest/api/crash-reporter)、[Electron `webContents`](https://www.electronjs.org/docs/latest/api/web-contents/) 和 [electron-log 初始化说明](https://github.com/megahertz/electron-log/blob/master/docs/initialize.md)。

## 模块职责与启动顺序

`src/main/services/diagnostics.ts` 负责诊断目录、日志配置、保留策略、安全错误序列化、Electron Crash Reporter 初始化及主进程事件记录。`src/main/index.ts` 设置 Ripple Next 的 `userData` 路径后、`app.whenReady()` 创建窗口前初始化诊断服务，并在启动 Crash Reporter 前将 `crashDumps` 路径设为 `<userData>/diagnostics/crashes`。

main、preload、renderer 使用 `electron-log` 支持的集成方式。renderer bridge 保持 sandbox 兼容，不暴露原始 `ipcRenderer` 或通用 IPC。现有 `electronAPI` 只新增 `openDiagnosticsFolder()`；main 打开目录，失败时沿用设置页现有的行内错误提示。

窗口创建时安装生命周期监听，记录应用启动、renderer 完成 bootstrap、窗口 `ready-to-show`、`show`、`hide`、`focus`、`blur`、`unresponsive`、`responsive`、`closed`、加载失败、renderer 退出和 Electron 子进程退出。renderer 退出记录 Electron 提供的退出原因和退出码。Linux 记录 X11 输入区域的初始化、就绪状态及应用区域尺寸；不记录鼠标坐标，也不逐动画帧记录。

renderer 记录 `window.error`、`unhandledrejection`，以及 React 根节点的 `onCaughtError`、`onUncaughtError` 和 `onRecoverableError`。main 的未捕获异常使用不会抑制运行时致命行为的观察方式记录。未处理的 Promise 拒绝也要记录，同时保留运行时配置的致命策略。

## 记录字段与隐私

日志采用带时间戳的结构化事件，只允许明确列出的标量字段；记录进程名、事件名、级别，以及适用时的应用/Electron/Chromium/Node/OS/架构版本、窗口 ID、`webContents` ID、进程类型、renderer 退出原因和退出码。

Island 状态变化只记录当前 Tab ID、交互模式、展开/提问状态、已渲染回答字符数、视口尺寸和输入区域尺寸。只记录状态变化及生命周期节点；不轮询、不逐帧记录动画。

AI 请求记录 request ID、开始/结束/取消/错误结果、耗时、首个增量耗时、增量数量和最终字符数。日志不记录提示词、流式回答、API 密钥、授权头、供应商响应正文、配置的服务 URL、用户设置、任务、剪切板内容或搜索输入。一般错误记录错误类型与调用栈帧，不写入调用栈首行的自由文本消息。功能错误详情继续由现有行内 UI 呈现。

崩溃 minidump 是进程内存快照，可能含有文本日志之外的内存片段。转储只保存在本机，不自动上传或附加。设置页操作只打开目录；是否分享由用户决定。

## 路径与保留策略

- 文本日志：`<userData>/diagnostics/ripple-next.log`，保留一个轮替备份；每个文件上限 5 MiB。
- 原生崩溃报告：`<userData>/diagnostics/crashes/`，由 Electron Crashpad 写入。
- 每次启动时清理超过 30 天的崩溃文件，最多保留最近 10 份。不得解析 Crashpad 文件名或报告内容；Electron 将其目录布局定义为内部实现细节。
- Linux 诊断目录仅允许当前用户访问。目录与旧 Ripple 数据路径隔离；初始化诊断系统不读取、迁移或删除应用数据。

## 失败处理

文本日志初始化失败时写入 stderr，但不阻止应用启动。Crash Reporter 初始化失败时记录错误，也不阻止应用启动。打开诊断目录失败时使用设置页现有的行内提示。renderer 退出时记录事件，main 和托盘仍按现有生命周期运行。

本次不增加全局通知 UI。AI、搜索、设置及其他功能的错误继续由对应 Tab 显示；当 renderer 视图消失时，本地诊断记录提供事后追踪。

## 验收条件

1. main 和 renderer 日志汇入同一个本地诊断目录，并按设定大小轮替。
2. main、renderer、GPU/utility 和原生崩溃可产生结构化生命周期记录或 Electron 支持的本地 minidump。
3. renderer 退出记录退出原因、退出码、窗口标识及最新 Island/AI 状态摘要，不包含请求正文。
4. 可通过 request ID 和耗时关联 AI 请求开始、首个增量、完成、取消及失败。
5. 测试覆盖安全错误序列化、文件保留策略和设置页 typed IPC；Linux X11 日志不包含鼠标坐标或高频几何事件。
6. 设置页可打开诊断目录；原有行内错误和正常启动流程保持可用。
7. `pnpm check`、`pnpm test` 和 Linux 打包通过。Windows/macOS 安装包 CI 覆盖初始化；实机崩溃验证状态另行记录。

## 不在范围内

远端遥测、自动提交报告、崩溃后自动恢复窗口、新通知弹窗、日志导出/上传界面、使用分析，以及 AI 请求行为调整。
