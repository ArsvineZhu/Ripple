[English](README.md)

# Shared 契约

Shared 定义可序列化的 IPC 与领域契约、用于持久化状态和快捷应用目标的 Zod schema，以及纯输入区域计算。Main、preload 和 renderer 共用这些定义，运行时服务放在各自所属层。

`contracts.ts` 定义请求、响应、通知和 AI 流事件；`appState.ts` 定义新状态结构及初始值；`i18n/` 管理语言类型、系统语言解析和随应用打包的词条。Renderer 初始化 i18next，main 使用词条生成托盘文案。

参见[开发指南](../../docs/development.zh-CN.md)和[仓库地图](../../INDEX.zh-CN.md)。
