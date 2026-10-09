[English](README.md)

# Shared 契约

`backgroundImage.ts` 规范背景设置，将本地路径编码为专用图片 URL，避免 CSS 反斜杠转义；它不执行文件访问。

Shared 定义可序列化的 IPC 与领域契约、用于持久化状态和快捷应用目标的 Zod schema，以及纯输入区域计算。Main、preload 和 renderer 共用这些定义，运行时服务放在各自所属层。

`contracts.ts` 定义请求、响应、通知和 AI 流事件；`appState.ts` 定义新状态结构及初始值；`i18n/` 管理语言类型、系统语言解析和随应用打包的词条。Renderer 初始化 i18next，main 使用词条生成托盘文案。

参见[开发指南](../../docs/development.zh-CN.md)和[仓库地图](../../INDEX.zh-CN.md)。

`diagnostics.ts` 定义安全错误字段，以及 IPC、平台能力和生命周期事件。原生剪贴板读写是明确的 IPC 契约，诊断不记录文本内容。

`ScrollGestureStartSchema` 校验原生触控板边界的时间戳载荷；main 产生事件，preload 校验并转发，renderer 据此区分新手势与旧惯性。
