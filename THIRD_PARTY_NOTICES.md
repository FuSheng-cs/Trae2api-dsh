# Third-party source

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
extensions are in `python/relay_entry.py` and `python/model_catalog.py`; the upstream protocol code otherwise
remains unchanged. Upstream updates are reviewed and pinned, never fetched
automatically on plugin startup.
