# Changelog

## 1.3.1

- Lead plugin descriptions and both READMEs with using TRAE account model quota in dsh.
- Keep marketplace summaries and author introductions focused on quota integration, account management, check-in, rotation, usage and model controls.
- Retain the complete usage notices in their standalone files and README footer links; remove those statements from plugin summary copy.
- Runtime behavior, account storage and model routing are unchanged.

## 1.3.0

- Rename the public project and GitHub repository to Trae2api-dsh and the package to `trae2api-dsh`; align the bundle and Client loader names.
- Add an original generated project icon to the package and both README headers.
- Complete the bilingual READMEs with feature navigation, quick start, everyday use, updates, FAQ and links to dedicated documents, following GitHub's create-readme skill.
- Retain legacy data paths, environment/credential names and provider/RPC identity; document upgrading from the previous package without enabling both versions at once.
- Provide the new archive filename and an identical legacy filename for existing marketplace download links. Account/model/lifecycle behavior remains unchanged.

## 1.2.2

- Reorganize both READMEs around project overview, core features, preview, quick start and common questions.
- Move detailed account/model/storage operations into bilingual user guides and add a contribution guide.
- Keep the independent usage notices and upstream attribution, with disclaimer links in the README footer instead of the opening callout.
- Include the linked guides and marketplace record in the prebuilt package. Runtime behavior is unchanged.

## 1.2.1

- Include Chinese and English usage boundaries and disclaimers in the prebuilt package, with prominent README links.
- Preserve and attribute upstream learning/non-commercial-use notices separately from the unchanged MIT licenses; distinguish source licensing from third-party service authorization.
- Document account authorization, automation defaults, credential/data handling, provider restrictions and applicable-law limits without promising legal immunity or account safety.
- Keep the complete embedded console, native model/effort picker, visibility controls and all existing runtime behavior from 1.2.0.

## 1.2.0

- Restore the original full embedded TRAE console as the default sidebar view, including overview, accounts/check-in, usage, relay settings and model tests.
- Add model discovery, strengths and show/hide controls inside that console's new DSH model-management tab. All visible models remain in the native composer model picker.
- Keep environment preparation and service controls in a separate settings view; switching views keeps the original console iframe alive.
- A private authenticated relay-to-Host bridge synchronizes console changes through DSH's Settings API, including when the console opens in a separate browser window.
- Test original console preservation, bridge authentication, console-to-picker updates and cross-origin write rejection.

## 1.1.0

- Discover the active account's real Remote/SOLO model configs, display names, context limits, image capability and supported reasoning levels.
- Configure each model's supported Low/High/Xhigh options; do not apply a shared High default to non-reasoning or incompatible models.
- Native model search and per-model/bulk show/hide controls, with persisted preferences and automatic synchronization through DSH's Settings API.
- Preserve hidden preferences across discovery refreshes; recover from hiding every model without changing other providers or model defaults.
- Update prepared runner files on plugin reload without reinstalling Python dependencies or replacing account data.

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
