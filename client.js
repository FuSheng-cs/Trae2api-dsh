window.__ModuleLoader__.load({
  id: "dsh-trae-relay",
  factory(require) {
    const React = require("react"),
      h = React.createElement;
    const panel = "trae-relay-console";
    const css = `
  .tr-root{height:100%;overflow:auto;color:var(--dsw-alias-label-primary);background:var(--dsw-alias-bg-layer-1);padding:24px;box-sizing:border-box}
  .tr-wrap{max-width:960px;margin:auto}.tr-top{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:24px}
  .tr-top h1{font-size:22px;line-height:30px;margin:0;flex:1}.tr-muted{color:var(--dsw-alias-label-secondary);font-size:13px;line-height:1.7}
  .tr-card{border:1px solid var(--dsw-alias-border-l2);border-radius:12px;padding:20px;margin:16px 0;background:var(--dsw-alias-bg-layer-2)}
  .tr-card h2{font-size:16px;margin:0 0 12px}.tr-row{display:flex;gap:10px;align-items:center;flex-wrap:wrap}.tr-row+.tr-row{margin-top:12px}
  .tr-button{font:inherit;font-size:13px;padding:8px 12px;border-radius:7px;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-1);color:inherit;cursor:pointer}
  .tr-button:disabled{opacity:.45;cursor:default}.tr-button:focus-visible,.tr-input:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}
  .tr-primary{background:var(--dsw-alias-label-primary,#476ad6);color:var(--dsw-alias-bg-layer-1,#fff);border-color:transparent}
  .tr-input{font:inherit;font-size:13px;box-sizing:border-box;border:1px solid var(--dsw-alias-border-l2);border-radius:6px;background:var(--dsw-alias-bg-layer-1);color:inherit;padding:8px;width:100%}
  .tr-field{display:flex;flex-direction:column;gap:6px;font-size:13px;flex:1;min-width:180px}.tr-error{padding:12px;border:1px solid #ba5151;border-radius:8px;color:#d97878;white-space:pre-wrap;margin:12px 0}
  .tr-pill{font-size:12px;border:1px solid var(--dsw-alias-border-l2);border-radius:20px;padding:5px 10px}.tr-table{width:100%;border-collapse:collapse;font-size:13px}
  .tr-table th,.tr-table td{text-align:left;padding:12px 8px;border-bottom:1px solid var(--dsw-alias-border-l2)}.tr-table th{font-weight:500;color:var(--dsw-alias-label-secondary)}
  .tr-code{font-family:monospace;font-size:12px;overflow-wrap:anywhere}.tr-notice{padding:10px 0;font-size:13px}.tr-scroll{overflow-x:auto}
  @media(max-width:600px){.tr-root{padding:14px}.tr-card{padding:14px}.tr-top h1{flex-basis:100%}.tr-field{flex-basis:100%}}
  `;
    function Icon({ size = 18 }) {
      return h(
        "svg",
        {
          width: size,
          height: size,
          viewBox: "0 0 24 24",
          fill: "none",
          stroke: "currentColor",
          strokeWidth: 1.7,
          "aria-hidden": true,
        },
        h("rect", { x: 3, y: 3, width: 18, height: 18, rx: 3 }),
        h("path", { d: "M3 8h18 M7 12l3 3-3 3 M13 18h4" }),
      );
    }
    function Panel({ ctx }) {
      const [state, setState] = React.useState(null),
        [accounts, setAccounts] = React.useState([]);
      const [busy, setBusy] = React.useState(false),
        [error, setError] = React.useState(""),
        [notice, setNotice] = React.useState("");
      const [python, setPython] = React.useState(""),
        [port, setPort] = React.useState(""),
        [edition, setEdition] = React.useState("solo"),
        [directory, setDirectory] = React.useState("");
      const [consoleURL, setConsoleURL] = React.useState("");
      const [modelCatalog, setModelCatalog] = React.useState(null);
      const [modelQuery, setModelQuery] = React.useState("");
      const alive = React.useRef(true);
      const refreshSequence = React.useRef(0);
      const call = async (method, payload, signal) => {
        const r = await ctx.connection.rpc.call(
          "/api",
          "trae-relay." + method,
          payload || {},
          signal,
        );
        if (!r.ok) throw new Error(r.error.message);
        return r.value;
      };
      const refresh = async (signal) => {
        const sequence = ++refreshSequence.current;
        const [status, models] = await Promise.all([
          call("status", {}, signal),
          call("models", {}, signal),
        ]);
        if (!alive.current || sequence !== refreshSequence.current) return;
        setState(status);
        setModelCatalog(models);
        if (status.state === "running") {
          const [data, url] = await Promise.all([
            call("accounts", {}, signal),
            call("console", {}, signal),
          ]);
          if (alive.current && sequence === refreshSequence.current) {
            setAccounts(data.accounts || []);
            setConsoleURL(url);
          }
        } else setConsoleURL("");
      };
      React.useEffect(() => {
        alive.current = true;
        const controller = new AbortController();
        let timer;
        const tick = async () => {
          try {
            await refresh(controller.signal);
          } catch (e) {
            if (!controller.signal.aborted && alive.current)
              setError(e.message);
          } finally {
            if (alive.current) timer = setTimeout(tick, 4000);
          }
        };
        void tick();
        return () => {
          alive.current = false;
          controller.abort();
          clearTimeout(timer);
        };
      }, []);
      const act = async (method, payload, message) => {
        setBusy(true);
        setError("");
        setNotice("");
        try {
          const result = await call(method, payload);
          await refresh();
          if (alive.current)
            setNotice(
              (message || "操作完成。") +
                (result?.modelWarning
                  ? " 模型目录读取失败，旧列表已保留：" + result.modelWarning
                  : ""),
            );
        } catch (e) {
          if (alive.current) setError(e.message);
        } finally {
          if (alive.current) setBusy(false);
        }
      };
      const openedConsole = () => {
        // Desktop redirects real HTTP links to the system browser and denies
        // JavaScript popup handles. Keep the click a normal anchor navigation.
        // Renew only after the browser has consumed the default click action.
        setTimeout(() => {
          if (!alive.current) return;
          setConsoleURL("");
          void refresh().catch((e) => {
            if (alive.current) setError(e.message);
          });
        }, 0);
      };
      const button = (label, onClick, disabled = false, primary = false) =>
        h(
          "button",
          {
            type: "button",
            className: "tr-button" + (primary ? " tr-primary" : ""),
            disabled: busy || disabled,
            onClick,
          },
          label,
        );
      const running = state?.state === "running",
        prepared = state?.prepared;
      const modelRows = (modelCatalog?.models || []).filter((model) =>
        (model.name + " " + model.id)
          .toLowerCase()
          .includes(modelQuery.toLowerCase()),
      );
      const strength = { light: "Low", high: "High", extra_high: "Xhigh" };
      const visibility = (changes) =>
        act(
          "modelVisibility",
          { changes },
          "模型显示设置已保存，并同步到 dsh。",
        );
      const states = {
        unprepared: "未初始化",
        preparing: "正在准备环境",
        starting: "正在启动",
        running: "运行中",
        stopped: "已停止",
        error: "启动失败",
      };
      return h(
        "section",
        { className: "tr-root", "aria-label": "TRAE 反代管理" },
        h(
          "div",
          { className: "tr-wrap" },
          h(
            "header",
            { className: "tr-top" },
            h(Icon, { size: 26 }),
            h("h1", null, "TRAE 反代"),
            h(
              "span",
              { className: "tr-pill", role: "status" },
              busy ? "正在处理…" : states[state?.state] || "正在连接…",
            ),
          ),
          h(
            "p",
            { className: "tr-muted" },
            "在本机运行 TRAE CN 代理。环境准备完成后随 dsh 启动，完整退出 dsh 或禁用插件时停止；关闭到托盘继续运行。",
          ),
          error || state?.error
            ? h(
                "div",
                { className: "tr-error", role: "alert" },
                error || state.error,
              )
            : null,
          notice
            ? h("div", { className: "tr-notice", role: "status" }, notice)
            : null,
          h(
            "div",
            { className: "tr-card" },
            h("h2", null, "1 · 准备运行环境"),
            h(
              "p",
              { className: "tr-muted" },
              "需要 Python 3.10+ 和联网下载 Python 依赖。仅创建插件自己的虚拟环境；不读取账号、不修改 TRAE 客户端。首次准备可能需要几分钟。",
            ),
            h(
              "div",
              { className: "tr-row" },
              h(
                "label",
                { className: "tr-field" },
                "Python 路径（留空自动查找）",
                h("input", {
                  className: "tr-input",
                  value: python,
                  onChange: (e) => setPython(e.target.value),
                  placeholder: "python / python3 / py",
                }),
              ),
              h(
                "label",
                { className: "tr-field" },
                "端口（留空自动分配并保存）",
                h("input", {
                  className: "tr-input",
                  type: "number",
                  min: 1024,
                  max: 65535,
                  value: port,
                  onChange: (e) => setPort(e.target.value),
                  placeholder: "自动",
                }),
              ),
            ),
            h(
              "div",
              { className: "tr-row" },
              button(
                prepared ? "重新准备环境" : "准备环境",
                () =>
                  act("prepare", { python, port }, "环境就绪，点击启动服务。"),
                running || state?.connected,
                true,
              ),
            ),
          ),
          h(
            "div",
            { className: "tr-card" },
            h("h2", null, "2 · 服务与模型"),
            h(
              "div",
              { className: "tr-row" },
              button(
                "启动服务",
                () => act("start"),
                !prepared || running,
                true,
              ),
              button("停止服务", () => act("stop"), !running),
              running && !busy && consoleURL
                ? h(
                    "a",
                    {
                      className: "tr-button",
                      href: consoleURL,
                      target: "_blank",
                      rel: "noopener noreferrer",
                      onClick: openedConsole,
                    },
                    "打开完整控制台",
                  )
                : button("打开完整控制台", () => {}, true),
            ),
            h(
              "p",
              { className: "tr-muted" },
              "预置 DeepSeek V4.1 Flash；登录后可发现其他可用模型。思考档位按各模型的上游能力配置，在对话模型菜单中选择。",
            ),
            h(
              "div",
              { className: "tr-row" },
              button(
                state?.connected ? "模型已接入" : "接入 dsh 模型菜单",
                () =>
                  act(
                    "connect",
                    {},
                    "模型已接入：请在对话模型菜单选择 TRAE CN 下的模型。",
                  ),
                !running || state?.connected,
                true,
              ),
              button(
                "断开模型接入",
                () => act("disconnect"),
                !state?.connected,
              ),
            ),
            state?.directory
              ? h(
                  "p",
                  { className: "tr-muted" },
                  "数据目录：",
                  h("code", { className: "tr-code" }, state.directory),
                  state.port ? " · 127.0.0.1:" + state.port : "",
                )
              : null,
          ),
          h(
            "div",
            {
              className: "tr-card",
              id: "tr-model-catalog",
              role: "region",
              "aria-label": "模型与思考强度",
            },
            h("h2", null, "3 · 模型与思考强度"),
            state?.catalogError
              ? h(
                  "div",
                  { className: "tr-error", role: "alert" },
                  state.catalogError,
                )
              : null,
            h(
              "p",
              { className: "tr-muted" },
              modelCatalog?.source === "account"
                ? "读取当前账号实际模型配置，不包含兼容别名。刷新失败时保留已有列表。"
                : "目前使用预置模型；登录后点击发现/刷新模型，加载账号提供的模型和思考档位。",
            ),
            h(
              "div",
              { className: "tr-row" },
              button(
                "发现 / 刷新可用模型",
                () =>
                  act(
                    "refreshModels",
                    {},
                    "可用模型与思考档位已更新，显示偏好已保留。",
                  ),
                !running,
                true,
              ),
              button(
                "显示全部",
                () =>
                  visibility(
                    (modelCatalog?.models || []).map((model) => ({
                      id: model.id,
                      visible: true,
                    })),
                  ),
                !prepared,
              ),
              button(
                "隐藏全部",
                () =>
                  visibility(
                    (modelCatalog?.models || []).map((model) => ({
                      id: model.id,
                      visible: false,
                    })),
                  ),
                !prepared,
              ),
            ),
            h(
              "p",
              { className: "tr-muted" },
              `${modelCatalog?.models.length || 0} 个模型 · ${(modelCatalog?.models || []).filter((model) => model.visible).length} 个显示到 dsh`,
              modelCatalog?.updatedAt
                ? " · 更新于 " +
                    new Date(modelCatalog.updatedAt).toLocaleString()
                : "",
            ),
            h(
              "label",
              { className: "tr-field" },
              "搜索模型",
              h("input", {
                className: "tr-input",
                value: modelQuery,
                onChange: (event) => setModelQuery(event.target.value),
                placeholder: "模型名称或 ID",
              }),
            ),
            h(
              "div",
              { className: "tr-scroll" },
              h(
                "table",
                { className: "tr-table" },
                h(
                  "thead",
                  null,
                  h(
                    "tr",
                    null,
                    ...["模型", "思考档位", "上下文 / 输出", "显示到 dsh"].map(
                      (label) => h("th", { key: label, scope: "col" }, label),
                    ),
                  ),
                ),
                h(
                  "tbody",
                  null,
                  ...modelRows.map((model) =>
                    h(
                      "tr",
                      { key: model.id },
                      h(
                        "td",
                        null,
                        h("div", null, model.name),
                        h("code", { className: "tr-code" }, model.id),
                      ),
                      h(
                        "td",
                        null,
                        model.reasoningLevels.length
                          ? model.reasoningLevels
                              .map((level) => strength[level])
                              .join(" / ")
                          : model.reasoningSupport === false
                            ? "无思考档位"
                            : "由上游控制",
                        model.defaultReasoning
                          ? h(
                              "div",
                              { className: "tr-muted" },
                              "上游默认 " + strength[model.defaultReasoning],
                            )
                          : null,
                      ),
                      h(
                        "td",
                        null,
                        model.contextWindow.toLocaleString() +
                          " / " +
                          model.maxTokens.toLocaleString(),
                      ),
                      h(
                        "td",
                        null,
                        h(
                          "label",
                          null,
                          h("input", {
                            type: "checkbox",
                            checked: model.visible,
                            disabled: busy || !prepared,
                            "aria-label": "在 dsh 显示 " + model.name,
                            onChange: (event) =>
                              visibility([
                                { id: model.id, visible: event.target.checked },
                              ]),
                          }),
                          model.visible ? " 显示" : " 隐藏",
                        ),
                      ),
                    ),
                  ),
                  modelRows.length
                    ? null
                    : h(
                        "tr",
                        null,
                        h("td", { colSpan: 4 }, "没有匹配的模型。"),
                      ),
                ),
              ),
            ),
            h(
              "p",
              { className: "tr-muted" },
              "隐藏会从 dsh 提供的模型目录中移除该模型；使用它的已有会话需切换模型。重新显示可恢复接入。",
            ),
          ),
          h(
            "div",
            { className: "tr-card" },
            h("h2", null, "4 · 登录与账号"),
            h(
              "p",
              { className: "tr-muted" },
              "选择已登录的 TRAE CN 版本并主动导入。只读桌面登录信息，副本保存在插件数据目录。网页版授权、多账号用量与更多设置可在完整控制台管理。",
            ),
            h(
              "div",
              { className: "tr-row" },
              h(
                "label",
                { className: "tr-field" },
                "客户端版本",
                h(
                  "select",
                  {
                    className: "tr-input",
                    value: edition,
                    onChange: (e) => setEdition(e.target.value),
                  },
                  h("option", { value: "solo" }, "TRAE SOLO CN"),
                  h("option", { value: "cn" }, "Trae CN"),
                ),
              ),
              h(
                "label",
                { className: "tr-field" },
                "User 数据目录（可选）",
                h("input", {
                  className: "tr-input",
                  value: directory,
                  onChange: (e) => setDirectory(e.target.value),
                  placeholder: "自动按系统查找",
                }),
              ),
            ),
            h(
              "div",
              { className: "tr-row" },
              button(
                "导入当前桌面账号",
                () =>
                  act(
                    "import",
                    { edition, directory },
                    "账号已导入并选为当前账号。",
                  ),
                !running,
                true,
              ),
              button("刷新账号", () => act("accounts"), !running),
            ),
            h(
              "div",
              { className: "tr-scroll" },
              h(
                "table",
                { className: "tr-table" },
                h(
                  "thead",
                  null,
                  h(
                    "tr",
                    null,
                    ...["账号", "状态", "模型调用", "操作"].map((x) =>
                      h("th", { key: x, scope: "col" }, x),
                    ),
                  ),
                ),
                h(
                  "tbody",
                  null,
                  accounts.length
                    ? accounts.map((a) =>
                        h(
                          "tr",
                          { key: a.id },
                          h("td", null, a.label || "…" + a.id.slice(-4)),
                          h(
                            "td",
                            null,
                            a.is_active
                              ? "当前"
                              : a.is_valid
                                ? "可用"
                                : "需重新登录",
                          ),
                          h("td", null, a.model_enabled ? "启用" : "禁用"),
                          h(
                            "td",
                            null,
                            h(
                              "div",
                              { className: "tr-row" },
                              button(
                                "优先使用",
                                () => act("switch", { id: a.id }),
                                !running || a.is_active || !a.model_enabled,
                              ),
                              button(
                                a.model_enabled ? "禁用" : "启用",
                                () =>
                                  act("enable", {
                                    id: a.id,
                                    enabled: !a.model_enabled,
                                  }),
                                !running,
                              ),
                            ),
                          ),
                        ),
                      )
                    : h("tr", null, h("td", { colSpan: 4 }, "尚未导入账号。")),
                ),
              ),
            ),
          ),
        ),
      );
    }
    function apply(ctx) {
      ctx.effect(() => {
        const style = document.createElement("style");
        style.textContent = css;
        document.head.appendChild(style);
        return () => style.remove();
      });
      ctx.slots.inject("main", () =>
        ctx.slots.register({ name: "main", key: panel }, () =>
          h(Panel, { ctx }),
        ),
      );
      ctx.slots.inject("sidebar.panellist", () =>
        ctx.slots.register(
          {
            name: "sidebar.panellist",
            id: panel,
            order: 20,
            label: () => "TRAE 反代",
          },
          Icon,
        ),
      );
    }
    return { apply, inject: ["slots", "layout", "connection"] };
  },
});
