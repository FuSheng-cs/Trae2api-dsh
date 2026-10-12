# Contributing

Trae2api-dsh keeps the `trae-relay` RPC/provider identity, legacy data-directory name and credential/environment identifiers stable for upgrades. The public package and Client loader identity use `trae2api-dsh`; update the bundle name and client module ID together when changing package identity.

Thanks for helping improve Trae2api-dsh. Please open an issue for a reproducible bug or a focused pull request for a change. Include the DSH/plugin versions, operating system and relevant error text, with credentials and personal information removed.

## Project structure

| Path | Purpose |
| --- | --- |
| `index.js` / `client.js` | DSH Host integration and sidebar console |
| `lib/` | Private runtime, model registration and console bridge |
| `python/` | Relay entry, model catalog, console extension and lifecycle supervision |
| `vendor/trae2api-cn/` | Pinned, attributed upstream relay engine |
| `tests/` | Node integration tests and Python protocol/model/console tests |
| `scripts/` | Runtime preparation, privacy audit and isolated DSH smoke checks |
| `docs/` | Chinese and English user guides |

## Local checks

Node.js 22+ and Python 3.10+ are required. Quick checks and packaging:

```sh
npm test
npm run check
npm pack
```

Without `DSH_RELAY_TEST_HOME`, Node tests skip the two real-runtime integration cases. Prepare a disposable runtime to include them. PowerShell example:

```powershell
$env:DSH_RELAY_TEST_HOME = Join-Path (Get-Location) 'work/ci-runtime'
$env:PYTHONPATH = Join-Path (Get-Location) 'vendor/trae2api-cn'
$env:PYTHONDONTWRITEBYTECODE = '1'
node scripts/prepare-ci.mjs
npm test
& "$env:DSH_RELAY_TEST_HOME/venv/Scripts/python.exe" -m unittest discover -s tests/engine
npm run check
npm pack
```

On Linux/macOS, set the same environment variables and use `venv/bin/python` for the Python tests. `TEST_PYTHON` optionally selects the interpreter used by the preparation script. Keep all test runtime directories separate from your normal DSH and TRAE data.

The tests use synthetic accounts and simulated model metadata. Test-only upstream overrides are restricted to checked `work/` directories and excluded from release archives. They do not read personal desktop accounts or make paid inference requests. The test modules' attribution is recorded in [tests/engine/README.md](tests/engine/README.md).

## DSH installation smoke check

With the disposable runtime prepared:

```sh
npm install --prefix work/test-host @deepseek-ai/dsh@0.2.0-rc.2 --ignore-scripts
node scripts/host-smoke.mjs
```

This installs the packed plugin into an isolated DSH profile and checks console access, model capabilities and visibility, preservation of an unrelated provider, and shutdown. Install `pnpm` 10+ first. The full Windows/Ubuntu/macOS workflow is defined in [ci.yml](.github/workflows/ci.yml).

## Pull requests and releases

- Keep a change focused and describe its user-visible effect and validation.
- Update both READMEs or user guides when behavior changes.
- Retain upstream copyright/license notices; review and pin engine updates rather than fetching them on startup.
- Keep account files, logs, runtime state and real-account screenshots out of commits and packages.
- Do not add install-time build scripts or modify system Python, proxy settings or unrelated providers.
- Release archives include the prebuilt plugin, documentation, licenses and usage notices, with a SHA-256 checksum. Publish only after CI passes on the release commit.

Project license: [MIT](LICENSE). See [third-party notices](THIRD_PARTY_NOTICES.md) and the [usage boundaries](DISCLAIMER.en.md).
