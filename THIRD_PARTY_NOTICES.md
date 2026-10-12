# Third-party source

The Trae2api-dsh icon at `assets/icon.png` was generated for this project using the built-in image-generation tool on 2026-10-13. It is an independent project mark, not an official TRAE or DeepSeek logo.

`vendor/trae2api-cn` is a clean, attributed snapshot of
[autumnsentiment/Trae2api-cn](https://github.com/autumnsentiment/Trae2api-cn),
version **v1.0.4**, commit `85978c3d465b693ef0ae2d42be21ca0679bb1f6a`.
Copyright (c) 2026 autumnsentiment. Its original MIT license is preserved at
`vendor/trae2api-cn/LICENSE`.

The relay engine, protocol conversion, encrypted TRAE storage reader, and
original management UI are upstream work. This project provides the DSH
plugin, private runtime installer, lifecycle supervisor, authenticated console
entry, explicit account import, model registration, and tests. It is an
independent community integration, not an official TRAE or DeepSeek product.

Local modifications to the snapshot: remove token-prefix logging and pin the
tested direct Python dependencies, including HTTPX SOCKS support. Runtime
extensions are in `python/relay_entry.py`, `python/model_catalog.py` and the additive `python/console_models.py` console tab; the upstream protocol code otherwise
remains unchanged. Upstream updates are reviewed and pinned, never fetched
automatically on plugin startup.

## Upstream usage notice

The same pinned [upstream README](https://github.com/autumnsentiment/Trae2api-cn/blob/85978c3d465b693ef0ae2d42be21ca0679bb1f6a/README.md)
also displays these notices, preserved here verbatim:

> 仅供学习使用。请勿用于商业用途。

> 本项目仅用于学习和研究目的。使用本项目产生的任何后果由使用者自行承担。

These are attributed upstream notices, separate from its unmodified MIT license.
This project does not resolve their interpretation on the upstream rights holder's
behalf or expand permission to use TRAE's services. The upstream liability wording
is not a claim that every responsibility can legally be waived. See
[our usage boundaries](DISCLAIMER.en.md) / [使用边界与免责声明](DISCLAIMER.md),
including applicable-law limits and account/service authorization requirements.
