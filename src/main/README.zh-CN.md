[English](README.md) · 英文为规范来源。

# Main process

主进程拥有生命周期、托盘、透明显示窗口、IPC 注册和系统副作用。服务分派至平台适配器，Linux 输入区域位于 platform/linux/inputShape.ts；从 index.ts 和 ipc.ts 阅读，renderer API 定义在 shared/contracts.ts。

语言 IPC 返回 Electron 的系统语言，并在重建托盘文案前校验 renderer 传入的已解析语言。语言偏好由 renderer 管理；缺失的媒体元数据保持为空，由视图显示本地化的替代文案。

参见 [开发指南](../../docs/development.zh-CN.md) 和 [仓库地图](../../INDEX.zh-CN.md)。
