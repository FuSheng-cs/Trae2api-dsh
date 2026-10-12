# TRAE Relay for DSH

[![Release](https://img.shields.io/github/v/release/FuSheng-cs/dsh-trae-relay?label=release)](https://github.com/FuSheng-cs/dsh-trae-relay/releases/latest)
[![CI](https://github.com/FuSheng-cs/dsh-trae-relay/actions/workflows/ci.yml/badge.svg)](https://github.com/FuSheng-cs/dsh-trae-relay/actions/workflows/ci.yml)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

Use TRAE CN models in **DeepSeek Harness**, with accounts, daily check-in, rotation and usage in one console.

[中文](README.md) · [Download](https://github.com/FuSheng-cs/dsh-trae-relay/releases/latest) · [User guide](docs/usage.en.md) · [Report an issue](https://github.com/FuSheng-cs/dsh-trae-relay/issues)

## Features

| Feature | Description |
| --- | --- |
| **Automatic check-in** | Run daily on a Beijing-time schedule, skip accounts already checked in, run immediately and inspect results. |
| **Multiple accounts** | Import a desktop account or authorize through the web, switch the active account and enable or disable requests per account. |
| **Account rotation** | Rotate among eligible accounts, in round-robin order or an order based on cached remaining credits. |
| **Models and reasoning** | Discover account-provided Remote / SOLO models and their supported Low / High / Xhigh strengths in the native dsh picker. |
| **Model visibility** | Search, show or hide models in the console, use bulk controls and retain preferences across refreshes and restarts. |
| **Usage statistics** | Inspect credits, tokens, cache, requests, consumption records and daily totals. |
| **Embedded console** | Keep the complete TRAE console or open it in a separate window. The relay starts with dsh and stops on full exit. |

Check-in and rotation are disabled by default. Enable them in the console when needed. Closing the Desktop window to its tray keeps the service running.

## Preview

![TRAE console: accounts, daily check-in and usage](assets/embedded-console.png)

<details>
<summary>View model management and reasoning selection</summary>

![Model discovery and visibility controls](assets/model-catalog.png)

![Native dsh model and reasoning picker](assets/model-selection.png)

</details>

Screenshots use isolated test data. Your account supplies the actual model catalog.

## Quick start

### Requirements

| Environment | Requirement |
| --- | --- |
| dsh | Tested **0.2.0-rc.2**, local Desktop / Web |
| Node.js | **22+** |
| Python | **3.10+**, with `venv` and `pip` |
| Account | TRAE CN / TRAE SOLO CN, with access to the selected model |
| Operating system | Windows 10/11; Linux and macOS covered by CI |

Local Web / CLI installation requires `pnpm` 10+. Desktop uses its bundled plugin manager. Initial setup downloads Python dependencies; Docker is not required.

### Install

**Desktop**: add this prebuilt archive in the dsh plugin manager, enable the plugin and open **TRAE 控制台** in the sidebar.

```text
https://github.com/FuSheng-cs/dsh-trae-relay/releases/latest/download/dsh-trae-relay.tgz
```

**Local Web / CLI**:

```sh
dsh plugin --profile web add https://github.com/FuSheng-cs/dsh-trae-relay/releases/latest/download/dsh-trae-relay.tgz
dsh web
```

Releases include `SHA256SUMS.txt`. [Marketplace status](MARKETPLACES.md) is tracked separately; some markets restrict sources that have not been listed.

### First-time setup

1. Open **TRAE 控制台 → 服务设置**, prepare the environment, then start the service.
2. Select **TRAE SOLO CN** or **Trae CN** and import your logged-in desktop account, or return to the console for web authorization.
3. In **DSH 模型管理**, connect the models to dsh's model picker.
4. Select a model and its reasoning strength in the composer. Manage show/hide preferences in the console.

First startup does not import accounts. Desktop import is explicitly initiated by you and leaves TRAE client login files unchanged.

## Console navigation

| Task | Location |
| --- | --- |
| Add or switch accounts, schedule check-in | **账号与签到** |
| Enable round-robin or credit-priority rotation | **轮询与设置 → 多账号轮询** |
| Refresh, show or hide models | **DSH 模型管理** |
| Inspect credits, tokens and consumption | **概览 / 消费记录** |
| Prepare, start or stop the relay | **服务设置** in the header |

See the [user guide](docs/usage.en.md) for detailed setup, account policies, model behavior and troubleshooting.

## FAQ

**Does closing dsh stop the relay?** Closing Desktop to its tray keeps it running. Full exit, Host termination or plugin disable stops the relay and check-in scheduler.

**Why do models and reasoning options differ?** The active account supplies the catalog. Unadvertised strengths are omitted; models without advertised controls use the upstream default. Refresh the catalog after switching accounts.

**Does hiding a model affect existing sessions?** Hiding removes it from dsh's configured catalog. Switch sessions still using it first. Showing it restores the choice while preserving other providers and saved defaults.

**Are international accounts or remote browsers supported?** This release targets the China-edition protocol and local Desktop / Web. The full console uses the Host's loopback address; remote-browser access is not supported.

## Development and contribution

Report problems through [Issues](https://github.com/FuSheng-cs/dsh-trae-relay/issues) or submit a pull request.

```sh
npm test
npm run check
npm pack
```

The [contribution guide](CONTRIBUTING.md) covers project structure, isolated testing and packaging. CI runs on Windows, Ubuntu and macOS and checks plugin behavior, real dsh installation, model synchronization and service lifecycle.

## Credits and license

The relay engine and original console come from [autumnsentiment/Trae2api-cn](https://github.com/autumnsentiment/Trae2api-cn), pinned to v1.0.4. This project uses the [MIT license](LICENSE) and retains the upstream copyright and license. Provenance and upstream usage notices are recorded in [third-party notices](THIRD_PARTY_NOTICES.md).

Independent community project. Account, interface and automation boundaries are documented in the [usage notice and disclaimer](DISCLAIMER.en.md).
