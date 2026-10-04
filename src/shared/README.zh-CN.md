[English](README.md) · 英文为规范来源。

# Shared contracts

共享层拥有可序列化的 IPC/领域类型和纯输入区域几何计算，由 main、preload 和 renderer 共用，不依赖运行时服务；契约测试位于 tests/contracts.test.ts。

`i18n` 拥有支持的语言类型、系统语言解析和四种语言的纯词条资源。英文定义键结构，翻译必须保留键名和插值变量。i18next 运行时初始化归属 renderer，main 只使用纯词条更新托盘文案。

参见 [开发指南](../../docs/development.zh-CN.md) 和 [仓库地图](../../INDEX.zh-CN.md)。
