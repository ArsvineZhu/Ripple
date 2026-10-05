[English](release.md)

# 打包与运行验收

在匹配的平台运行 `pnpm check`、`pnpm test` 和 `pnpm make`。每次分支推送，以及目标分支为 `main` 或 `master` 的 PR，都会运行 CI 检查。推送与 `package.json` 版本一致的 `v<版本号>` 标签后，GitHub Actions 会构建 macOS x64/arm64、Windows x64 和 Linux x64 安装包，并创建包含 DEB/RPM/ZIP、MSI 和 DMG 的 GitHub Release。安装包和 Actions 产物使用 `RippleNext-<platform>` 标识。发布工作流失败后，也可以在对应版本标签上手动运行，以重新验证并发布。

当前 beta 版说明见[简体中文](releases/4.0.0-beta.1.zh-CN.md)和[English](releases/4.0.0-beta.1.en.md)。产品/软件包标识为 `ripple-next` / `Ripple Next`，macOS bundle ID 为 `com.arsvinezhu.ripple-next`。Ripple Next 将状态和已加密的 API key 密文保存在平台专属用户数据目录中的 `ripple-next.sqlite`。编号 schema migration 位于 `src/main/database/migrations/`，运行时 SQL 存放于 `.sql` 资源。旧 Ripple 数据目录不会读取或迁移。启用 Linux 开机启动时，Ripple Next 写入 `ripple-next.desktop` 并移除旧的 `ripple.desktop` 启动入口。

Linux 应用通过 XDG 桌面入口发现并由 `gio launch` 启动；自定义命令的 argv 参数逐项传递，不使用 shell。X11 helper 静态打包。Linux 启动在 renderer ready 且通过查询确认 ShapeInput 区域后才显示窗口。Linux 自动启动入口保留 `--ozone-platform=x11`。RPM 暂存保留 root 所有的 SUID sandbox helper。

## 运行验收

检查托盘显示/隐藏/退出、启动、Island 透明显示、区域外点击、悬停/点击模式、反复展开/收起、方向键/滚轮/Ctrl 数字导航、全部 Tab、主题、显示器/位置、Tab 排序/隐藏/默认选择和重启后的状态。检查 Linux 已安装应用搜索/启动、自定义命令参数和工作目录、网址、工作流、剪贴板、AI Base URL/模型/API key/取消请求、概览/天气/电量、媒体控制和错误提示。硬件/媒体提醒需要对应设备或来源。

鼠标离开行为需验证 0–2000 毫秒延迟、重新进入/菜单/焦点/拖动时取消收起，以及 Island 在指针下移动或缩小时的重入门控。检查 X11 输入形状和显示器边缘处的点击穿透。

macOS/Windows 原生媒体、设备和自动启动行为需要对应系统实测。原生运行结果应与安装包构建分开记录。日志不得包含 API key 或剪贴板内容。推送匹配版本标签或在该标签上手动运行工作流，都会启动完整的检查、打包和发布；带有 `-beta.1` 等预发布后缀的版本会标记为 GitHub 预发布版本。若对应英文和简体中文说明文件都存在，工作流会将两者写入 Release；否则使用 GitHub 自动生成的说明。
