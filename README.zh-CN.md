[English](README.md) · 英文为规范来源。

# Ripple

跨平台 Dynamic Island 桌面助手，基于 TopMyster 的 MIT 开源项目，在 [ArsvineZhu/Ripple](https://github.com/ArsvineZhu/Ripple) 中持续开发。

Ripple 提供浏览器搜索、工作流与快捷应用、时间/天气/电量概览、媒体信息、Groq/OpenRouter AI 对话、剪贴板历史、任务和设置。悬停进入 Quick 模式，点击进入 Large 模式；保留 Still、隐身、待机、Tab 排序、键盘导航、主题、定位、显示器选择和平台提醒。

安装包见 [Fork Releases](https://github.com/ArsvineZhu/Ripple/releases)。Windows 使用 MSI，macOS 使用 DMG，Linux 使用 DEB/RPM；也可从成功的 Actions 构建下载产物。

## 开发

使用 [.node-version](.node-version) 记录的 Node LTS 和 npm 11 或更新版本。

```sh
git clone https://github.com/ArsvineZhu/Ripple.git
cd Ripple
npm ci
npm start
```

环境、检查与打包说明见 [开发指南](docs/development.zh-CN.md)，交互说明见 [使用指南](instructions.zh-CN.md)，结构见 [仓库地图](INDEX.zh-CN.md)，发布验证见 [发布指南](docs/release.zh-CN.md)。

## 许可

[MIT](LICENSE)，保留原作者与许可证归属。
