[English](release.md) · 英文为规范来源。

# 发布与运行验收

在目标平台运行 `npm run check`、`npm test` 和 `npm run make`。CI 矩阵包含 Windows x64 MSI、macOS x64/arm64 DMG、Linux x64 DEB/RPM/ZIP。安装包名为 `Ripple-<OS>-v<version>`，macOS 带架构标识；产物位于 `out/make`。

应用身份继续为 `ripple` / `Ripple`，既有 userData 目录与 localStorage 键兼容 3.3.0。3.4.0 是 TS 与治理迁移版本。运行检查应保护真实用户数据，自动交互使用独立临时 profile；开发验证用的 sandbox 参数不进入发布启动器或 desktop 文件。

Linux desktop 和自动启动使用 `--ozone-platform=x11`。DEB/RPM 暂存过程保留 root 所有的 SUID sandbox 权限。RPM 模板显式使用暂存路径和临时 RPM 数据库，兼容 RPM 4/6 且不修改本机数据库。

## 验收

检查托盘显示/隐藏/退出、启动、Island 透明显示、区域外点击、悬停/点击模式、反复展开/收起、箭头/滚轮/Ctrl 数字导航、可用 Tab、主题、显示器/位置、Tab 排序/隐藏/默认选择和重启后设置。检查任务、工作流、快捷应用、剪贴板复制、AI 配置、概览/天气/电量和媒体控制；媒体及硬件提醒需要相应媒体源或设备。

macOS/Windows 原生媒体、设备和自动启动行为需要对应系统实测。打包与适配器契约通过表示构建兼容，不等于原生运行验证；记录时与 Linux 检查分开。AI 请求需要用户自己的 key，日志不包含 key 或剪贴板内容。

升级后若旧进程仍运行，界面可能仍为旧代码；先退出旧实例再启动新程序。见 [目录](INDEX.zh-CN.md)。
