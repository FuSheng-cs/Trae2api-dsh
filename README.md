# dsh-trae-relay

[English](README.en.md) · [下载](https://github.com/FuSheng-cs/dsh-trae-relay/releases) · [反馈](https://github.com/FuSheng-cs/dsh-trae-relay/issues)

给 **DeepSeek Harness（dsh）** 添加 TRAE CN 反代、账号管理页和模型菜单。
这是社区插件，独立于 DeepSeek 和 TRAE 官方。反代引擎来自
[autumnsentiment/Trae2api-cn](https://github.com/autumnsentiment/Trae2api-cn)，完整署名见 [第三方说明](THIRD_PARTY_NOTICES.md)。

![dsh 中的 TRAE V4.1 Flash 和思考强度菜单](assets/model-selection.png)

![模型发现、思考档位和显示控制（隔离测试示例，实际列表由账号返回）](assets/model-catalog.png)

## 功能

- dsh 原生侧栏管理页：准备环境、启动/停止、导入当前桌面账号、切换优先账号、启用/禁用模型调用。
- 一键打开上游完整控制台，管理多账号、用量和代理设置。
- 首次准备后随 dsh 启动；完整退出、Host 结束或禁用插件时停止整个服务进程树。关闭桌面窗口到托盘时继续运行。
- 独立 Python 虚拟环境，自动分配并保存回环端口；可指定 Python 路径和端口。
- 主动接入独立的 `trae-relay` 模型路由，预设 **DeepSeek V4.1 Flash** 和 **Low / High / Xhigh** 思考强度（对应 `light / high / extra_high`）。初始强度 High。
- 登录后发现当前账号的其他模型，从 Remote / SOLO 模型目录读取真实配置、名称、上下文与思考档位；不把兼容别名当成独立可用模型。
- 模型搜索、逐个显示/隐藏、显示全部/隐藏全部，偏好保存在插件目录，刷新模型或重启后仍保留。
- 保留已有模型默认值、其他供应商配置、TRAE 客户端文件和既有反代服务。首次启动不会自动读取或导入任何账号。
- 不需要 Docker；安装包带可执行的前后端文件和固定版本上游源代码，没有安装时构建脚本。

## 运行要求

- 本机 dsh **0.2.0-rc.2**，Node.js **22+**。未来 dsh 版本以 CI/兼容验证为准。
- 本机 Web/CLI 的插件安装命令需要可用的 `pnpm`（10+）；Desktop 使用其自带的插件管理运行环境。
- Python **3.10+**，包含 `venv` / `pip`。准备环境需要连接 Python 包镜像。
- 已登录、具有目标模型使用权限的 **Trae CN / TRAE SOLO CN** 账号。
- Windows 10/11；Linux/macOS 提供同一安装流程与生命周期实现，实际支持范围以 CI 为准。
- 此版面向本机 Desktop / Web；不支持在远程浏览器打开 Host 回环地址的完整控制台。中国版协议，不承诺国际版兼容。

模型名称与额度由 TRAE 决定；账号没有 V4.1 Flash 权限时会返回上游错误，插件不会把请求悄悄改成其他模型。
请遵守服务方条款，只使用自己有权使用的账号。插件不提供额度、不绕过订阅，也不承诺封号保护。

## 安装

### Desktop

打开 dsh **设置 → 插件**，通过插件市场的安装入口或管理器的添加包入口安装以下预构建包：

```text
https://github.com/FuSheng-cs/dsh-trae-relay/releases/latest/download/dsh-trae-relay.tgz
```

如果所用市场尚未收录本仓库，请在原生插件管理器添加上述包；不同市场可能拒绝未收录来源。
无需执行 `postinstall` / `prepare`。安装后启用插件，侧栏出现 **TRAE 反代**。

### 本机 Web / CLI

```sh
dsh plugin --profile web add https://github.com/FuSheng-cs/dsh-trae-relay/releases/latest/download/dsh-trae-relay.tgz
dsh web
```

### 首次使用

1. 在 **TRAE 反代** 页面点 **准备环境**。找不到 Python 时填写可执行文件完整路径；端口留空自动选择。首次下载可能需要几分钟。
2. 点 **启动服务**。
3. 选择实际登录的 **TRAE SOLO CN** 或 **Trae CN**，点 **导入当前桌面账号**。非标准安装可填写 `User` 数据目录（其下有 `globalStorage/storage.json`）。导入仅在点击时发生，源文件保持只读。
4. 点 **接入 dsh 模型菜单**，在对话模型选择器选择 **TRAE CN → DeepSeek V4.1 Flash (TRAE)**，再选择思考强度。
5. 需要更多账号、授权、用量或设置时点 **打开完整控制台**。请允许浏览器弹窗。入口 30 秒内有效且只使用一次，过期可重新打开。

网页授权助手从已授权的控制台下载，自动指向本实例，仅携带 15 分钟有效的一次账号提交授权；过期后重新下载。Windows 的 `start_auth.bat` 需与下载的 `web_login.py` 放在同一目录。使用助手会在本机启动上游的 OAuth 回调监听器；桌面导入不需要助手。

导入新账号会将其选为当前账号；禁用旧账号可阻止其参与模型请求。已有账号额度轮询等高级策略由完整控制台的设置决定。

### 更多模型和显示设置

导入、切换账号或接入模型时会自动读取一次模型目录；成功登录不会因为目录读取失败而撤销，读取失败时会提示并保留旧列表。

登录后在 **模型与思考强度** 点 **发现 / 刷新可用模型**。插件读取当前账号返回的真实模型配置，并逐个显示可选思考档位：`light → Low`、`high → High`、`extra_high → Xhigh`。例如上游只给 Low/High 的模型不会出现 Xhigh；没有公布思考档位的模型使用上游默认行为。目录读取不发送推理请求，不做逐模型扣费测试；实际调用仍受账号权限、额度和上游可用性限制。

勾选 **显示到 dsh** 可接入或隐藏单个模型；也可搜索、显示全部或隐藏全部。已接入时立即通过 dsh 官方 Settings API 同步。隐藏会从 dsh 提供的模型目录中移除模型，仍使用它的会话需要先切换模型。隐藏全部会暂时移除本插件的供应商目录，重新显示任一模型可恢复。其他供应商和已保存默认值保持原样。

显示偏好与最新成功读取的目录会持久保存，刷新失败不清空旧列表；上游暂时未返回的模型，其隐藏偏好仍保留。切换账号后请重新刷新目录。V4.1 Flash 在该账号目录存在时优先排列；混合非思考模型或档位不兼容时不强加统一 High 默认值，各模型使用其上游默认，用户可以在对话菜单选择实际支持的档位。

## 数据与权限

默认目录：`$DSH_HOME/plugins/dsh-trae-relay`；未设置 DSH_HOME 时在用户主目录 `.dsh/plugins/dsh-trae-relay`。
用 `DSH_TRAE_RELAY_HOME` 为不同 dsh 实例指定不同目录。不要让两个 Host 共享一个插件运行目录。

- `config.json`：端口、插件 API key、是否接入模型。
- `venv/`：独立 Python 环境。
- `engine/data/accounts.json`、`engine/.env`：代理自己的账号副本与设置。
- `relay.log`：本地错误日志。日志和账号文件不属于发布包，请勿上传。

Windows 初始化移除数据目录继承权限，仅授予当前用户与 SYSTEM；POSIX 私有目录/配置使用 0700/0600。
代理仅监听 `127.0.0.1`，模型请求需要 API key。控制台使用一次性入口交换 HttpOnly 会话，拒绝跨站写请求与非回环 Host；API key 不放在控制台地址中。

**接入模型**创建插件自己的 `DSH_TRAE_RELAY_API_KEY` credential 引用，并通过 dsh 官方 Settings API 只写入 `llm-pi-ai.providers.trae-relay`。使用配置 revision 防止覆盖并发编辑，保留其他供应商和全局默认模型。断开仅删除这个归属本插件的供应商字段，保留账号与 credential 便于再次接入。启动/退出不会重写模型配置；禁用或卸载前请先断开，避免留下指向已停止服务的供应商。

## 卸载与恢复

先停止服务/断开模型，再在插件管理器卸载。本插件不自动删除账号文件，避免卸载造成数据丢失。
要彻底清理，完整退出 dsh 后手动删除上述插件数据目录，并在 dsh credential 管理中移除 `DSH_TRAE_RELAY_API_KEY`。
重新安装可沿用插件数据；插件更新会刷新自己的 Python runner 文件，保留虚拟环境、账号和显示偏好。上游依赖/环境版本变化需要点 **重新准备环境**，准备前先停止服务并断开模型。准备时保留账号和设置。

端口冲突会明确报错，不接管其他正在运行的反代；停止本插件后指定空闲端口并重新准备即可。
Python 下载失败可调整你自己的 pip 镜像或网络后重试。插件不更改系统代理、系统 Python 或全局 Git 设置。

## 开发与验证

```sh
npm test
npm run check
npm pack
```

集成测试需先在**测试专用目录**初始化 RelayRuntime，再设置 `DSH_RELAY_TEST_HOME` 指向它。
它使用合成账号 fixture，不会读取真实 TRAE 登录信息，也不调用付费模型。
覆盖实际 Python 进程启动/停止、Host 强制退出后的回收、授权/跨站防护、一次性票据、只读账号导入与禁用，以及带模拟上游目录的真实 dsh 模型发现、思考元数据、显示/隐藏、隐藏全部后的恢复和其他供应商配置保留。测试专用上游模拟只修改经过目录检查的 `work/` 中的引擎副本，不进入发布包。
`tests/engine` 是上游署名测试，覆盖 SSE、工具协议和 reasoning 映射；设置 `PYTHONPATH=vendor/trae2api-cn` 后用 Python unittest 运行。

GitHub Actions 在 Windows / Ubuntu / macOS 上验证插件测试、relay 集成和打包审计。GitHub Release 发布预构建 `.tgz` 与 SHA-256 校验文件。
测试不验证每个 TRAE 账号的在线额度或上游持续可用性。

## 许可

插件为 MIT；内置引擎保留上游 MIT 许可和版权声明。见 [LICENSE](LICENSE) 与 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。
