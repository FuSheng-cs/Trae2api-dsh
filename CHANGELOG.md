# Changelog

## 1.0.1

- Open the full console with a normal authenticated HTTP link. This supports Desktop's system-browser redirect policy, which deliberately denies JavaScript popup handles.
- Refresh one-use console entries while the panel is visible and after a click. Existing prepared Python environments remain compatible.

## 1.0.0

- DSH native sidebar management page and authenticated full-console launcher.
- Isolated Python runtime with explicit preparation and desktop account import.
- Owned relay lifecycle, whole-tree shutdown and port-conflict refusal.
- TRAE V4.1 Flash route with Low/High/Xhigh effort selection through DSH's official revision-checked Settings API.
- Single-use console/login-helper authorization; no API key in console links.
- Real-process and DSH installation tests, attributed upstream protocol tests, package privacy audit and three-OS CI.
