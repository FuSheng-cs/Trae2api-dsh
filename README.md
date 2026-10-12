# TRAE Relay for DSH

[![Release](https://img.shields.io/github/v/release/FuSheng-cs/dsh-trae-relay?label=release)](https://github.com/FuSheng-cs/dsh-trae-relay/releases/latest)
[![CI](https://github.com/FuSheng-cs/dsh-trae-relay/actions/workflows/ci.yml/badge.svg)](https://github.com/FuSheng-cs/dsh-trae-relay/actions/workflows/ci.yml)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

在 **DeepSeek Harness** 中使用 TRAE CN 模型，集中管理账号、签到、轮询与用量。

[English](README.en.md) · [下载](https://github.com/FuSheng-cs/dsh-trae-relay/releases/latest) · [使用指南](docs/usage.zh-CN.md) · [问题反馈](https://github.com/FuSheng-cs/dsh-trae-relay/issues)

## 功能

| 功能 | 说明 |
| --- | --- |
| **自动签到** | 按北京时间每日签到，跳过当天已签到账号；支持立即执行和查看结果。 |
| **多账号管理** | 导入桌面账号或网页授权登录，切换当前账号，分别启用或禁用模型调用。 |
| **账号轮询** | 在有效账号之间顺序轮询，或按缓存的剩余积分排序调度。 |
| **模型与思考强度** | 发现账号的 Remote / SOLO 模型，接入 dsh 原生模型菜单，提供实际支持的 Low / High / Xhigh 档位。 |
| **模型显示管理** | 在控制台搜索、显示或隐藏模型，支持批量操作，刷新与重启后保留偏好。 |
| **用量统计** | 查看账号积分、Token、缓存、请求与消费记录，以及每日用量。 |
| **内嵌控制台** | 保留完整 TRAE 控制台，也可在浏览器新窗口打开；代理随 dsh 启动，完整退出时停止。 |

自动签到和轮询默认关闭，可在控制台按需开启。关闭窗口到托盘时服务继续运行。

## 界面预览

![TRAE 控制台：账号、签到与用量管理](assets/embedded-console.png)

<details>
<summary>查看模型管理与思考强度菜单</summary>

![模型发现与显示设置](assets/model-catalog.png)

![dsh 原生模型与思考强度菜单](assets/model-selection.png)

</details>

截图使用隔离测试数据；实际模型列表由账号返回。

## 快速开始

### 环境要求

| 环境 | 要求 |
| --- | --- |
| dsh | 已验证 **0.2.0-rc.2**，本机 Desktop / Web |
| Node.js | **22+** |
| Python | **3.10+**，包含 `venv` 和 `pip` |
| 账号 | TRAE CN / TRAE SOLO CN，具有目标模型使用权限 |
| 操作系统 | Windows 10/11；Linux、macOS 通过 CI 验证 |

本机 Web / CLI 安装需要 `pnpm` 10+；Desktop 使用自带的插件管理环境。首次准备需要联网下载 Python 依赖，无需 Docker。

### 安装

**Desktop**：在 dsh 插件管理器中添加以下预构建包，启用后打开侧栏 **TRAE 控制台**。

```text
https://github.com/FuSheng-cs/dsh-trae-relay/releases/latest/download/dsh-trae-relay.tgz
```

**本机 Web / CLI**：

```sh
dsh plugin --profile web add https://github.com/FuSheng-cs/dsh-trae-relay/releases/latest/download/dsh-trae-relay.tgz
dsh web
```

Release 同时提供 `SHA256SUMS.txt` 校验文件。[各插件市场收录状态](MARKETPLACES.md)单独记录，未收录的市场可能限制安装来源。

### 首次配置

1. 打开 **TRAE 控制台 → 服务设置**，点击 **准备环境**，完成后点击 **启动服务**。
2. 选择 **TRAE SOLO CN** 或 **Trae CN**，点击 **导入当前桌面账号**；也可返回控制台进行网页授权登录。
3. 在控制台的 **DSH 模型管理** 中点击 **接入 dsh 模型菜单**。
4. 在对话输入框选择模型和思考强度；显示或隐藏模型仍在控制台中设置。

首次启动不会自动导入账号。导入由你主动触发，TRAE 客户端登录文件保持只读。

## 使用入口

| 要做什么 | 去哪里 |
| --- | --- |
| 添加账号、切换账号、设置自动签到 | **账号与签到** |
| 开启顺序轮询或积分优先模式 | **轮询与设置 → 多账号轮询** |
| 刷新模型目录、显示或隐藏模型 | **DSH 模型管理** |
| 查看积分、Token 与消费记录 | **概览 / 消费记录** |
| 准备环境、启动或停止代理 | 顶部 **服务设置** |

详细操作、账号策略、模型行为和故障排查见 [使用指南](docs/usage.zh-CN.md)。

## 常见问题

**关闭 dsh 窗口会停止代理吗？** 关闭到托盘时继续运行；完整退出 dsh、Host 结束或禁用插件时停止代理和签到任务。

**为什么模型列表或思考档位不同？** 插件读取当前账号返回的目录。未提供的档位不会显示，没有公布思考档位的模型使用上游默认行为。切换账号后可以刷新目录。

**隐藏模型会影响已有会话吗？** 隐藏会从 dsh 模型目录移除该模型，请先切换仍在使用它的会话。重新显示后可恢复，其他供应商和已保存默认值保留。

**支持国际版或远程浏览器吗？** 当前支持中国版协议和本机 Desktop / Web；完整控制台使用 Host 回环地址，远程浏览器场景尚未支持。

## 开发与贡献

欢迎通过 [Issues](https://github.com/FuSheng-cs/dsh-trae-relay/issues) 报告问题，或提交改进。

```sh
npm test
npm run check
npm pack
```

[贡献指南](CONTRIBUTING.md)包含目录结构、隔离测试方法和打包流程。CI 在 Windows、Ubuntu、macOS 上验证插件、真实 dsh 安装、模型同步与服务生命周期。

## 致谢与许可

反代引擎与原有管理界面来自 [autumnsentiment/Trae2api-cn](https://github.com/autumnsentiment/Trae2api-cn)，固定为 v1.0.4。项目采用 [MIT 许可](LICENSE)，保留上游版权与许可证；来源及上游用途提示见 [第三方说明](THIRD_PARTY_NOTICES.md)。

独立社区项目。账号、接口和自动化的适用范围见 [使用边界与免责声明](DISCLAIMER.md)。
