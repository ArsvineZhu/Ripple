[English](development.md) · 英文为规范来源。

# 开发指南

使用 `.node-version` 中的精确 Node LTS 补丁版本、npm 11+ 和 `npm ci`。本地工具与 CI 共用 Node 版本。Electron 自带 Node 运行时，其固定版本应处于上游受支持的稳定范围。升级 Node、Electron 和兼容工具链时运行下述检查。`package-lock.json` 固定依赖解析；`allowScripts` 批准打包和 Windows 图标提取所需的两个依赖构建脚本。

Linux 安装包需要 `dpkg`、`fakeroot`、`rpm` 和构建工具；可选系统功能使用 `playerctl`、`bluetoothctl`、`fuser`、`pactl`。Windows MSI 需要 WiX Toolset，macOS 打包需要 Xcode Command Line Tools。在对应操作系统运行原生 maker。

```sh
npm ci
npm start
npm run check
npm test
npm run make
```

## 工具职责

工具配置集中在 [.config](../.config/README.zh-CN.md)，由 package scripts 显式选择。

| 命令                      | 契约                                                                                 |
| ------------------------- | ------------------------------------------------------------------------------------ |
| `typecheck`               | 严格检查 main/preload/renderer/工具 TS 项目，Vite 仅转译                             |
| `lint`                    | Oxlint 检查 TS/React/Hooks 正确性和导入边界，warning 使 CI 失败                      |
| `format` / `format:check` | Prettier 写入/检查 2 空格、LF、单引号、分号、100 列格式                              |
| `deadcode`                | Knip 检查入口、导出和依赖；Forge 构造器显式引用动态 makers/plugins                   |
| `duplicates`              | JSCPD 扫描生产 TS/TSX，至少 100 tokens、10 行，重复率上限 3%，排除资源、声明和生成物 |
| `check`                   | 聚合上述只读静态检查                                                                 |
| `test`                    | Vitest 验证旧数据、导航、模式、Windows 命令、IPC 验证和 Linux 输入区域               |

Oxlint 的 `react/set-state-in-effect` 关闭，因为系统遥测和偏好变化有意通过 effect 驱动提醒/视图状态；Hooks 规则及依赖检查保持启用。Renderer 不导入 Node、Electron 或 main/preload，shared 不依赖运行时服务。类型检查以 TS 编译器为准，避免第二套类型检查引擎。

Knip 仅忽略明确的操作系统可执行文件，不忽略依赖包。JSCPD 例外应局部标注并由不同语义解释；不为满足重复率而合并无关平台行为。

## 运行架构

主进程服务分派至平台适配器并拥有 OS 副作用；preload 每项操作提供一个带类型方法；共享契约传递可序列化值。Renderer 拥有界面、交互及既有 localStorage 键，SettingsProvider 统一设置，功能 hooks 管理轮询和功能状态，Island controller 负责组合。

Linux 使用覆盖显示器的透明 XWayland 窗口，仅让 X11 ShapeInput 跟随动画中的 Island；修改 ShapeBounding 可能出现黑边。X11 客户端静态导入并打入包中，窗口在输入区域确认后才显示。边界说明见 [主进程](../src/main/README.zh-CN.md) 和 [renderer](../src/renderer/README.zh-CN.md)。

Forge 在启动和打包前清理 `.vite`，防止过期 bundle 进入安装包。`.vite`、`out`、报告和 `node_modules` 是生成物，不纳入 Git；文本使用 LF，字体和图标标为二进制。中英文文档同步维护，见 [目录](INDEX.zh-CN.md)。
