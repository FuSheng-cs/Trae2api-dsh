# User guide

[Project home](../README.en.md) · [中文](usage.zh-CN.md)

## First-time setup

1. Prepare the private Python environment. Optionally supply a Python executable and an unused port.
2. Start the service.
3. Explicitly import your logged-in SOLO CN or CN desktop account. Only that click reads desktop storage; the source file is never modified.
4. Return to the embedded console. Its original overview, accounts/check-in, usage, relay settings and model tests remain available. Connect models in the new **DSH 模型管理** tab.
5. Select any visible TRAE model in the native composer picker and choose its advertised reasoning strength. Show/hide controls stay inside the console. Its header provides refresh, open in new window, and a separate service-settings view. Switching settings keeps the iframe alive.

### Enable check-in and rotation

1. In **账号与签到**, add accounts and configure each account's model-request switch. Disabling requests retains the account for separate check-in management.
2. In **自动签到**, enable the schedule, choose a Beijing-time daily time and save. **立即执行** runs it manually; the panel shows previous/next runs and results.
3. In **轮询与设置 → 多账号轮询**, enable rotation, choose **顺序轮询** (round-robin) or **积分优先** (cached-credit ordering), and save. Refresh account credits first when you want the latter to reflect newer balances.

## Discover and show/hide models

Desktop import, account switching and model connection automatically read the
catalog once. Catalog failure does not undo a successful sign-in; it reports a
warning and retains the previous list.

After signing in, click **发现 / 刷新可用模型** inside the original console's **DSH 模型管理** tab. The active account's Remote/SOLO configs supply genuine model IDs, display names, context limits, image support and reasoning options. Only advertised supported strengths are offered: light → Low, high → High, extra_high → Xhigh. Models without advertised controls use the upstream default. Discovery makes catalog requests, not billable inference probes; model access still depends on account entitlement, quota and upstream availability.

Search by name/ID and use **显示到 dsh** to show/hide models individually, or use the bulk controls. Connected routes synchronize immediately through DSH's Settings API. Hiding removes a model from DSH's configured catalog; sessions still using it must switch models. Hiding all removes this plugin's provider temporarily, and showing any model restores it. Other providers and saved defaults are preserved.

Successful discoveries and visibility preferences persist across restarts and refreshes. Failed discovery preserves the previous list; preferences for temporarily absent models are retained. Refresh after changing accounts. Flash sorts first when available; mixed/non-reasoning catalogs do not inherit an invalid shared High default. Prepared runner files update on plugin reload without replacing account data or reinstalling dependencies.

Download the web authorization helper from an authorized console. It targets
this instance and carries only one credential-submission grant valid for 15
minutes. Download it again after expiry. On Windows keep `start_auth.bat` beside
the downloaded `web_login.py`. Desktop import does not need the OAuth helper.

The plugin does not change existing model defaults or other provider configuration.
TRAE decides actual model access, quota and availability; no automatic substitute
model is used. International-edition protocol support and remote-browser access to
the Host's loopback console are outside this release's scope.

## Lifecycle and private storage

After preparation the relay starts with dsh. Plugin disable, Host exit and complete
dsh exit stop its whole process tree. Closing the desktop window to its tray keeps
the Host and relay alive. Windows uses a kill-on-close Job Object; POSIX uses an
owned process group and monitors the Host.

State lives in `$DSH_HOME/plugins/dsh-trae-relay`, or `~/.dsh/plugins/dsh-trae-relay`.
Override with `DSH_TRAE_RELAY_HOME`; use distinct directories for multiple Hosts.
The private venv, relay account copies, configuration and logs stay outside the
installed package. Secrets must never be committed or attached to issues.

Only loopback is served. Model requests require the private API key. Console
sessions use an HttpOnly cookie and same-origin write checks. Windows initialization
restricts the directory ACL; POSIX uses private directory/config modes. Connecting
adds the plugin's own `DSH_TRAE_RELAY_API_KEY` credential and writes only its
`llm-pi-ai.providers.trae-relay` field through DSH's revision-checked Settings
API. Other providers and model defaults are preserved. Disconnecting removes
only that owned provider and keeps credentials/data. Startup/exit does not
rewrite model settings; disconnect before disabling or uninstalling.

Console model controls use a private authenticated relay-to-Host bridge. Its
secret stays in child-process memory, never in browser source, console URLs or
account/configuration files. The authorized console session can manage only
the plugin's model actions; cross-origin writes are refused. The same controls
work from the embedded console and its separate browser window.

Uninstall does not erase account data. Exit dsh before manually deleting the
plugin state and removing its credential reference. An occupied port is refused;
the plugin never adopts or terminates unrelated services. Setup preserves account
data when repeated. No global Python, proxy or Git configuration is changed.

## Upgrading from the previous package

The project and repository are now named **Trae2api-dsh**, and the package name is `trae2api-dsh`, distributed through GitHub Releases. If you installed the previous `dsh-trae-relay` package:

1. Disconnect its model route, stop the relay and remove the old plugin while retaining its data directory.
2. Fully exit dsh, install the new `trae2api-dsh.tgz` archive, then enable the plugin.
3. Reuse the existing accounts, environment and visibility preferences, and reconnect the model picker.

Do not enable both packages together. The `.dsh/plugins/dsh-trae-relay` data path, `DSH_TRAE_RELAY_HOME`, `DSH_TRAE_RELAY_API_KEY` and `trae-relay` provider identifier remain compatible; do not rename them manually. The old GitHub repository address redirects to the new one, and new releases also provide the old archive filename for download compatibility.

## Related information

[Usage boundaries and disclaimer](../DISCLAIMER.en.md) · [Third-party notices](../THIRD_PARTY_NOTICES.md)
