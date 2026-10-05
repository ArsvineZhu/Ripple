[English](README.md)

# Ripple Next

跨平台 Dynamic Island 桌面助手，在 [ArsvineZhu/Ripple-Next](https://github.com/ArsvineZhu/Ripple-Next) 中独立开发，基于 TopMyster 以 MIT 许可证发布的 Ripple 项目。

Ripple Next 提供浏览器搜索、工作流、快捷应用、时间/天气/电量概览、媒体控制、OpenAI 兼容接口的 AI 对话、剪贴板历史、任务和设置。Linux 快捷应用可启动已安装的桌面入口、网址或带独立启动参数的自定义命令。

界面支持简体中文、英语、繁体中文和日语，默认跟随系统语言；在设置中选择语言后立即生效并持久保存。

推送匹配版本标签后，GitHub Actions 会构建并创建 Release；流程见[发布指南](docs/release.zh-CN.md)。

## 开发

使用 [.node-version](.node-version) 记录的 Node 版本和 pnpm 12 或更新版本。当前工具链要求 Node 22.13+。

```sh
git clone https://github.com/ArsvineZhu/Ripple-Next.git
cd Ripple-Next
pnpm install --frozen-lockfile
pnpm start
```

环境、检查和打包说明见[开发指南](docs/development.zh-CN.md)，交互说明见[使用指南](instructions.zh-CN.md)，架构导航见[仓库地图](INDEX.zh-CN.md)。

## 许可

[MIT](LICENSE)，保留原项目归属。
