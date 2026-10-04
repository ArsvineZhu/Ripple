[English](README.md) · 英文为规范来源。

# Renderer

Renderer 拥有 Island 显示与交互。Island.tsx 组合功能视图和 QuickView，useIslandController 组合功能 hooks；SettingsProvider 拥有共享设置，storage 保留既有键名及集合形状；CSS 和资源保持产品外观。

国际化在渲染前初始化。共享层随应用打包的词条定义翻译键；SettingsProvider 拥有 `language` 偏好，并将解析后的语言同步到托盘。日期和数值使用所选语言格式。

`styles/base.css` 拥有透明文档、字体和共享动画，`styles/tokens.css` 拥有主题及字体变量；Island、共享控件和各功能视图分别拥有 CSS Modules。静态样式放入所属模块，Motion 参数和运行时颜色／几何值由原有职责模块管理。OverlayProvider 将 Select 菜单挂载在 Island 边界内，useIslandInteraction 统一管理移动、焦点、hover 和菜单打开时的交互。

参见 [开发指南](../../docs/development.zh-CN.md) 和 [仓库地图](../../INDEX.zh-CN.md)。
