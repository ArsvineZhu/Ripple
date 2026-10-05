[English](README.md) · 英文为规范来源。

# 工具配置

Forge/Vite/Vitest、分环境 TypeScript 项目、Oxlint、Knip、Prettier、JSCPD 配置集中在这里，由 package scripts 显式选择。`templates` 保存 Linux desktop/RPM 模板，`entitlements.plist` 定义 macOS 签名权限。

根目录 `tsconfig.json` 是编辑器项目入口，编译选项和分环境项目放在本目录。Git/编辑器自动发现文件、`.node-version`、manifest 和 lockfile 保留在根目录。pnpm 要求项目设置位于根目录 `pnpm-workspace.yaml`；Electron Forge 要求使用 hoisted 链接模式，当前仅批准固定版本的 `esbuild` 和 Windows 图标提取器运行安装脚本。`.github/workflows` 保持 GitHub 规定的位置。

pnpm 任务和分析工具使用的项目路径相对于仓库根目录；TS 的 `include`/`extends`、schema 与 ignore 文件路径相对于配置文件。Forge 从 `projectRoot` 解析资源，避免配置目录迁移改变构建路径。

参见 [开发指南](../docs/development.zh-CN.md) 和 [仓库地图](../INDEX.zh-CN.md)。
