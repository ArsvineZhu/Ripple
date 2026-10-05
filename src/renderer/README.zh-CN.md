[English](README.md)

# Renderer

Renderer 拥有 Island 显示与交互。Island.tsx 组合功能视图和 QuickView，useIslandController 组合功能 hooks；AppStateProvider 通过主进程服务载入并更新持久化状态，SettingsProvider 提供设置上下文。Ripple Next 使用新状态格式，不读取原 Ripple 的本地存储。

国际化在渲染前初始化。共享层随应用打包的词条定义翻译键；SettingsProvider 拥有 `language` 偏好，并将解析后的语言同步到托盘。日期和数值使用所选语言格式。

`styles/base.css` 拥有透明文档、字体和共享动画，`styles/tokens.css` 拥有主题及字体变量；Island、共享控件和各功能视图分别拥有 CSS Modules。静态样式放入所属模块，Motion 参数和运行时颜色／几何值由原有职责模块管理。OverlayProvider 将 Select 菜单挂载在 Island 边界内，useIslandInteraction 统一管理移动、焦点、hover 和菜单打开时的交互。

搜索地址模板及时区偏好属于 AppState。时钟和日期使用 `Intl` 格式化；搜索校验和打开失败显示在 BrowserSearchTab 内。`InlineNotices` 将主进程错误路由到所属功能区，不再用 Island 浮层遮挡内容，并沿用原有淡入、模糊 Motion 过渡。设置滑块样式集中在 `SettingsTab.module.css`。

参见 [开发指南](../../docs/development.zh-CN.md) 和 [仓库地图](../../INDEX.zh-CN.md)。

下拉控件采用非模态单选菜单：打开时设置页面仍可滚动，在 Island 内关闭菜单不会切换展开状态。剪贴板历史仅记录可见文本，跳过纯图片与空内容。
