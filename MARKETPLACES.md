# DSH 市场提交记录

记录更新：2026-10-17（北京时间）。项目现名 **Trae2api-dsh**；最新发布见 [GitHub Release](https://github.com/FuSheng-cs/Trae2api-dsh/releases/latest)。以下包含已提交申请及历史验证快照。

2026-10-17 审核反馈处理：主库条目的中英文描述已补充 Python 3.10+ 与首次联网安装依赖要求（[提交](https://github.com/FuSheng-cs/awesome-dsh-plugin/commit/4c6da49f997257d818e60546b36e9d6ba2f6e144)）。创意工坊条目已补回自动签到与轮询默认关闭，并说明 Python 环境前置（[提交](https://github.com/FuSheng-cs/dsh-community-plugins/commit/48482ac16ac3f583d089286d540e8f06f92ee437)）；简介继续聚焦功能和配置，详细使用说明保留在项目文档，等待维护者确认。DSH Market 已于 2026-10-14 确认 [数据修正 #242](https://github.com/2BingLing/dsh-market/issues/242#issuecomment-6160318118) 应用完成。

**v1.3.1** 已发布：插件介绍统一突出“将 TRAE 账号的模型额度接入 dsh 使用”，市场简介、作者自述与 README 主介绍只描述功能。现有主库、创意工坊、补充注册表及提交材料已更新；DSH Market 的 [修正申请 #242](https://github.com/2BingLing/dsh-market/issues/242) 现同时包含新的功能简介、作者自述与安装命令，线上展示等待市场处理与同步。

2026-10-13 跟进：DSH Market 已确认收录并在网页显示插件详情；DSH Marketplace 的公开目录 API 也已索引规范仓库。主收录库的 `Submission gate` 和 `check` 均通过，仍等待合并。DSH Market 详情页的安装命令和准备要求存在误识别，已提交 [数据修正 #242](https://github.com/2BingLing/dsh-market/issues/242)。

**v1.3.0** 已发布：仓库、安装包及中英文 README 统一新名称，包含原创生成图标；主库和六个既有待审材料已更新。创意工坊已上架的条目保留同一 ID，通过 [名称与仓库链接更新 PR #34](https://github.com/zhu1090093659/dsh-community-plugins/pull/34) 请求同步新名称，不新增重复插件。

v1.2.2 重构了中英文 README，新增详细使用指南与贡献指南，免责声明入口移至首页文末并保留独立文件。运行功能不变；六个待审申请已更新版本说明，补充注册表的安装 tag 也更新为 v1.2.2。已合并的创意工坊条目继续指向同一维护仓库，无需重复登记。

本记录覆盖主社区收录库、创意工坊和已核实的独立 DSH 目录。不同市场有各自的审查、同步及推荐规则；**提交成功不等于已收录、上架或获得安全/平台授权背书**。以下为提交后的状态快照，后续以链接中的维护者结果为准。

| 渠道 | 本次处理 | 提交结果 |
| --- | --- | --- |
| awesome-dsh-plugin / dsh-market / dshmarket.com | 单文件正式 PR 已按审核反馈补齐 Python 运行时和首次下载依赖说明。 | [PR #7164](https://github.com/awesome-dsh-plugin/awesome-dsh-plugin/pull/7164)，**说明已修正，待检查与维护者合并**。 |
| 创意工坊 / dsh-market.com | 原条目已上架，保留原 ID；改名申请补充默认关闭行为与安装前置，简介仍聚焦功能和配置。 | **已上架，更新待审**：[创意工坊](https://dsh-market.com/) → 插件 → 搜索 `TRAE`；[更新 PR #34](https://github.com/zhu1090093659/dsh-community-plugins/pull/34)，[原合并 PR #31](https://github.com/zhu1090093659/dsh-community-plugins/pull/31)。 |
| DSH Market / dsh.market | 已上架；功能介绍、作者自述和安装命令的修正已获管道确认，修正 issue 完成关闭。 | **已上架，数据修正完成**：[插件详情](https://dsh.market/?plugin=FuSheng-cs%2FTrae2api-dsh)，[修正确认](https://github.com/2BingLing/dsh-market/issues/242#issuecomment-6160318118)。 |
| dshplugin.io | 按网站指定的 `plugin-submission` issue 入口提交，现有申请已更新至 Trae2api-dsh v1.3.1 的功能介绍。 | [Issue #34](https://github.com/tjsdyy/dshplugin/issues/34)，待审。 |
| DSH Hub / dshhub.org | 按仓库提交表单提供仓库、用途和安装方式。 | [Issue #49](https://github.com/coderPerseus/dsh-hub/issues/49)，待审。 |
| DSH Marketplace / dshmarketplace.dev | 提交表单显示已在目录中，公开 API 返回规范仓库和 `github:FuSheng-cs/Trae2api-dsh` 安装命令；`installable: true`、`installCheck: null`。无需重复投递。 | **已进入目录**：[目录 API](https://dshmarketplace.dev/api/v1/plugins?q=FuSheng-cs%2FTrae2api-dsh&limit=5)，[原申请 #17](https://github.com/DshMarketPlace/awesome-dsh-plugin/issues/17) 已说明确认结果并关闭；不声称完成安装检查或精选审核。 |
| ydhrdh/dsh-marketplace（补充社区注册表） | 现有 manifest 和生成索引已更新至 Trae2api-dsh v1.3.1，固定 GitHub tag；保留原索引 ID，`verified: false` 等待验证。 | [PR #15](https://github.com/ydhrdh/dsh-marketplace/pull/15)，待审。 |
| dsh-ai.org | 目录记录的数据源包含 awesome-dsh-plugin；通过上述主收录库申请覆盖其同步源。单独查询尚未找到本插件。 | 等待主库收录与目录同步，没有声称已上架或单独获精选。 |
| dshmarket.ai | 已核实其公开提交链接返回 HTTP 404，未找到可用投递入口。网站描述其目录来源于 npm；本机未登录 npm，未发布 npm 包。 | **未完成投递**，等待可用入口或可用 npm 发布身份，不伪造安装包名或成功状态。 |

仓库已公开并带 `dsh-plugin` / `deepseek-harness` topics，根目录声明 `dsh.bundle`、`dsh.client` 和 `cordis.patch.yml`。共用 awesome-dsh-plugin 数据源的市场前端由同一个主库申请覆盖，避免重复登记同一插件。

主库的一天年龄门槛已在北京时间 **2026-10-12 23:57:51** 满足，最新门槛检查于北京时间 **2026-10-13 08:01:18** 通过；构建检查也成功。当前等待维护者合并，请查看现有 PR，不重复开新申请。

## 版本与验证

- [v1.3.1 三系统 CI](https://github.com/FuSheng-cs/Trae2api-dsh/actions/runs/38371534661) 全部通过，release commit 为 `d1adde6f888a5ca40cb7a41b8b6eb461d3851ee4`。
- [v1.3.1 安装包](https://github.com/FuSheng-cs/Trae2api-dsh/releases/download/v1.3.1/trae2api-dsh.tgz) 和旧文件名兼容副本已下载验证，SHA-256：`95341856a72a1280984f9c1a4d026fe2b9f5647908ad41736b27c4f8e09939db`；[校验文件](https://github.com/FuSheng-cs/Trae2api-dsh/releases/download/v1.3.1/SHA256SUMS.txt)。

- [v1.3.0 三系统 CI](https://github.com/FuSheng-cs/Trae2api-dsh/actions/runs/38324078157) 全部通过，release commit 为 `744b4c11c23c9c7e8f055483cf5544a01b06ab63`；12 项 Node、131 项 Python 测试及真实隔离 dsh 安装、模型、控制台和退出回收验证通过。
- [新版安装包](https://github.com/FuSheng-cs/Trae2api-dsh/releases/download/v1.3.0/trae2api-dsh.tgz) 和旧文件名兼容副本下载校验一致，SHA-256：`f97e9b178d539d7988e9a4fa2f7291edd1d45213b99a118dc07c85cae97628ea`；[校验文件](https://github.com/FuSheng-cs/Trae2api-dsh/releases/download/v1.3.0/SHA256SUMS.txt)。

- [三系统 CI](https://github.com/FuSheng-cs/Trae2api-dsh/actions/runs/38321963539) 全部通过；release commit 为 `0a7fd6f1a27150d611f6ebda60dc3263a7c72fa2`。
- [v1.2.2 历史安装包](https://github.com/FuSheng-cs/Trae2api-dsh/releases/download/v1.2.2/dsh-trae-relay.tgz) 下载后校验通过，SHA-256：`bbbbe409d85d07706d6cad8313d9d0cd8a01a22e58e4479a91229a8b94d015a7`；[校验文件](https://github.com/FuSheng-cs/Trae2api-dsh/releases/download/v1.2.2/SHA256SUMS.txt)。
- 安装包保留 [中文说明](DISCLAIMER.md)、[English notice](DISCLAIMER.en.md)、[第三方说明](THIRD_PARTY_NOTICES.md) 和原始 MIT 许可证。
- 创意工坊索引校验通过，9 个索引测试通过；补充注册表 `npm run verify` 通过，8/8 条目有效并完成静态构建。
- 运行时与 v1.2.0 一致：原有完整内嵌控制台、原生模型/思考档位菜单和控制台模型显示功能全部保留。

## 市场规则来源

[主库贡献说明](https://github.com/awesome-dsh-plugin/awesome-dsh-plugin/blob/main/contributing.md)、[创意工坊贡献说明](https://github.com/zhu1090093659/dsh-community-plugins/blob/main/CONTRIBUTING.md)、[DSH Market 贡献说明](https://github.com/2BingLing/dsh-market/blob/master/CONTRIBUTING.md)、[DSH Marketplace 提交入口](https://dshmarketplace.dev/submit)、[DSH Hub 提交表单](https://github.com/coderPerseus/dsh-hub/blob/main/.github/ISSUE_TEMPLATE/submit-plugin.yml)、[补充注册表贡献说明](https://github.com/ydhrdh/dsh-marketplace/blob/main/CONTRIBUTING.md)。
