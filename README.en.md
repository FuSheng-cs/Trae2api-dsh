# dsh-trae-relay

[中文](README.md)

A community DeepSeek Harness plugin providing a managed local TRAE CN relay,
the original full embedded management console, and model controls inside it.
The relay engine is [autumnsentiment/Trae2api-cn](https://github.com/autumnsentiment/Trae2api-cn),
pinned to v1.0.4; see [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md). This is not an official DeepSeek/TRAE product.

![TRAE model and effort menu in an isolated DSH profile](assets/model-selection.png)

![The original full embedded console, using an isolated test account](assets/embedded-console.png)

![Model catalog and visibility controls using isolated test fixtures; actual models come from your account](assets/model-catalog.png)

## Install and use

Requires local dsh 0.2.0-rc.2, Node 22+, Python 3.10+ with venv/pip, and an
authorized TRAE CN or SOLO CN account with access to the selected model.
Local Web/CLI plugin installation also requires `pnpm` 10+ on PATH; Desktop
uses its bundled plugin-management runtime.

```sh
dsh plugin --profile web add https://github.com/FuSheng-cs/dsh-trae-relay/releases/latest/download/dsh-trae-relay.tgz
dsh web
```

Desktop users add the same archive through the native plugin manager, or use
the marketplace once the entry is accepted. Enable the plugin and open **TRAE 控制台** in the sidebar.

1. Prepare the private Python environment. Optionally supply a Python executable and an unused port.
2. Start the service.
3. Explicitly import your logged-in SOLO CN or CN desktop account. Only that click reads desktop storage; the source file is never modified.
4. Return to the embedded console. Its original overview, accounts/check-in, usage, relay settings and model tests remain available. Connect models in the new **DSH 模型管理** tab.
5. Select any visible TRAE model in the native composer picker and choose its advertised reasoning strength. Show/hide controls stay inside the console. Its header provides refresh, open in new window, and a separate service-settings view. Switching settings keeps the iframe alive.

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

## Development and validation

```sh
npm test
npm run check
npm pack
```

Initialize `RelayRuntime` in a disposable directory and set `DSH_RELAY_TEST_HOME`
to run real-process integration tests. They use synthetic credentials, never
personal TRAE storage or billable upstream inference. They verify private access,
single-use console entry, read-only import, model-enable state, clean shutdown and
abrupt Host-exit cleanup. With `PYTHONPATH=vendor/trae2api-cn`, run
`python -m unittest discover -s tests/engine` for the attributed upstream SSE,
tool-protocol and effort-mapping tests.

Real DSH smoke tests also discover a simulated upstream catalog, synchronize capabilities and visibility, recover after hiding all models, and preserve an unrelated provider. Test-only upstream overrides are confined to verified disposable `work/` engine copies and excluded from published archives.

CI targets Windows, Ubuntu and macOS. Live account entitlement and perpetual
upstream availability are not asserted by offline tests. Releases include the
prebuilt archive and SHA-256 checksum; installation requires no build scripts.

MIT, with the upstream engine's original MIT copyright retained.
