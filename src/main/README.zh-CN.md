[English](README.md)

# 主进程

Main 管理应用生命周期、托盘、透明窗口、IPC 校验和系统能力。`index.ts` 设置 Ripple Next 专用用户数据目录，并在创建 renderer 窗口前载入类型化状态和安全凭据服务。

服务负责原子状态存储、加密 API key、应用内通知、AI 请求、应用发现与启动、开机启动；平台适配器封装 Linux、macOS 和 Windows 差异。`ipc.ts` 校验发送方和 payload，共享类型见[shared 说明](../shared/README.zh-CN.md)。

随应用打包的系统提示词位于 `prompts/default-assistant.md`。每次 AI 请求前，由 `prompts/injections.ts` 解析 `{{product}}`、`{{developer}}`、`{{version}}`、`{{license}}`、`{{repository}}`、`{{issues}}`、`{{timezone}}` 和 `{{current_time}}`。静态信息来自 `package.json`，`{{version}}` 使用 Electron 的 `app.getVersion()`。时间信息遵循应用设置的时区；选择“跟随系统”时使用操作系统时区，`{{current_time}}` 格式为 `YYYY-MM-DD HH:mm:ss`。未知变量保持原文，用户输入不会经过模板替换。

Linux 窗口需等 renderer 就绪并确认首个 X11 `ShapeInput` 区域后显示。X11 客户端保持静态打包；输入区域继续使用 `ShapeInput`。

参见[开发指南](../../docs/development.zh-CN.md)和[仓库地图](../../INDEX.zh-CN.md)。
