[English](README.md) · 英文为规范来源。

# Preload bridge

Preload 拥有隔离的 contextBridge API。index.ts 将明确的方法映射到 IPC 通道并暴露平台身份；共享契约定义 renderer API 类型，原始 IPC 对象保留在 preload 内。

`getSystemLocale` 读取系统语言，`setUILocale` 将支持的已解析语言同步到 main。语言偏好和词条加载由桥接层之外的模块负责。

参见 [开发指南](../../docs/development.zh-CN.md) 和 [仓库地图](../../INDEX.zh-CN.md)。
