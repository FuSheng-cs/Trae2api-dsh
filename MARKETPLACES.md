# DSH 市场提交记录

记录更新：2026-10-13（北京时间）。提交版本：[v1.2.1](https://github.com/FuSheng-cs/dsh-trae-relay/releases/tag/v1.2.1)。

本记录覆盖主社区收录库、创意工坊和已核实的独立 DSH 目录。不同市场有各自的审查、同步及推荐规则；**提交成功不等于已收录、上架或获得安全/平台授权背书**。以下为提交后的状态快照，后续以链接中的维护者结果为准。

| 渠道 | 本次处理 | 提交结果 |
| --- | --- | --- |
| awesome-dsh-plugin / dsh-market / dshmarket.com | 一天年龄门槛已满足，现有正式 PR 的年龄自查已更新；不做重复投稿或空提交。安装包仍指向 v1.2.1。 | [PR #7164](https://github.com/awesome-dsh-plugin/awesome-dsh-plugin/pull/7164)，构建检查成功，年龄检查仍为达标前的旧结果，等待自动复检和审核。 |
| 创意工坊 / dsh-market.com | 社区索引 PR 于北京时间 2026-10-12 17:15:19 合并；已核实 main 索引、线上 manifest 和网页搜索结果均包含插件。 | **已上架**：[创意工坊](https://dsh-market.com/) → 插件 → 搜索 `TRAE`；[合并 PR #31](https://github.com/zhu1090093659/dsh-community-plugins/pull/31)，[线上清单](https://dsh-market.com/manifest/plugins.json)。 |
| DSH Market / dsh.market | 按提交模板提供仓库、类型、作者简介、版本、安装方式与免责声明。 | [Issue #234](https://github.com/2BingLing/dsh-market/issues/234)，已收到自动确认，等待每日管道处理。 |
| dshplugin.io | 按网站指定的 `plugin-submission` issue 入口提交 v1.2.1。 | [Issue #34](https://github.com/tjsdyy/dshplugin/issues/34)，待审。 |
| DSH Hub / dshhub.org | 按仓库提交表单提供仓库、用途和安装方式。 | [Issue #49](https://github.com/coderPerseus/dsh-hub/issues/49)，待审。 |
| DSH Marketplace / dshmarketplace.dev | 复查网页仍提示 GitHub 限流，查询 API 尚无本插件；保留已提交的公开申请和 topics 自动发现入口。此申请不声称获精选推荐。 | [Issue #17](https://github.com/DshMarketPlace/awesome-dsh-plugin/issues/17)，待维护者处理。 |
| ydhrdh/dsh-marketplace（补充社区注册表） | 提交 v1.2.1 manifest 和生成的索引，固定 GitHub tag；`verified: false` 等待维护者验证。 | [PR #15](https://github.com/ydhrdh/dsh-marketplace/pull/15)，待审。 |
| dsh-ai.org | 目录记录的数据源包含 awesome-dsh-plugin；通过上述主收录库申请覆盖其同步源。单独查询尚未找到本插件。 | 等待主库收录与目录同步，没有声称已上架或单独获精选。 |
| dshmarket.ai | 已核实其公开提交链接返回 HTTP 404，未找到可用投递入口。网站描述其目录来源于 npm；本机未登录 npm，未发布 npm 包。 | **未完成投递**，等待可用入口或可用 npm 发布身份，不伪造安装包名或成功状态。 |

仓库已公开并带 `dsh-plugin` / `deepseek-harness` topics，根目录声明 `dsh.bundle`、`dsh.client` 和 `cordis.patch.yml`。共用 awesome-dsh-plugin 数据源的市场前端由同一个主库申请覆盖，避免重复登记同一插件。

主库的一天年龄门槛已在北京时间 **2026-10-12 23:57:51** 满足。自动复检工作流计划每六小时运行一次（UTC `19 */6 * * *`，实际启动可能延迟，并有每批数量限制）；现有的旧失败结果不能视为新的拒绝。满足时间条件仍需市场复检和维护者决定；请查看现有 PR，不重复开新申请。

## 版本与验证

- [三系统 CI](https://github.com/FuSheng-cs/dsh-trae-relay/actions/runs/38215715862) 全部通过；release commit 为 `8ba4cc87bcdc2ff3c69e7714cfa9bc9c59176f1f`。
- [公开安装包](https://github.com/FuSheng-cs/dsh-trae-relay/releases/download/v1.2.1/dsh-trae-relay.tgz) 下载后校验通过，SHA-256：`492e8e4a2224e423b5229bb3b260f60778ece000875fb19d0c22ba3a76d62eb3`；[校验文件](https://github.com/FuSheng-cs/dsh-trae-relay/releases/download/v1.2.1/SHA256SUMS.txt)。
- 安装包包含 [中文使用边界与免责声明](DISCLAIMER.md)、[English disclaimer](DISCLAIMER.en.md)、[上游署名及用途提示](THIRD_PARTY_NOTICES.md)，保留原始 MIT 许可证；声明不保证免除法律责任或赋予第三方服务权限。
- 创意工坊索引校验通过，9 个索引测试通过；补充注册表 `npm run verify` 通过，8/8 条目有效并完成静态构建。
- 运行时与 v1.2.0 一致：原有完整内嵌控制台、原生模型/思考档位菜单和控制台模型显示功能全部保留。

## 市场规则来源

[主库贡献说明](https://github.com/awesome-dsh-plugin/awesome-dsh-plugin/blob/main/contributing.md)、[创意工坊贡献说明](https://github.com/zhu1090093659/dsh-community-plugins/blob/main/CONTRIBUTING.md)、[DSH Market 贡献说明](https://github.com/2BingLing/dsh-market/blob/master/CONTRIBUTING.md)、[DSH Marketplace 提交入口](https://dshmarketplace.dev/submit)、[DSH Hub 提交表单](https://github.com/coderPerseus/dsh-hub/blob/main/.github/ISSUE_TEMPLATE/submit-plugin.yml)、[补充注册表贡献说明](https://github.com/ydhrdh/dsh-marketplace/blob/main/CONTRIBUTING.md)。
