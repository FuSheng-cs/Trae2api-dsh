window.__ModuleLoader__.load({
  id: "trae2api-dsh",
  factory(require) {
    const React = require("react"),
      h = React.createElement,
      panel = "trae-relay-console";
    const css = `
      .tr-console{height:100%;min-height:0;display:flex;flex-direction:column;color:var(--dsw-alias-label-primary);background:var(--dsw-alias-bg-layer-1)}
      .tr-header{display:flex;gap:10px;align-items:center;flex-wrap:wrap;padding:14px 18px;border-bottom:1px solid var(--dsw-alias-border-l2);flex-shrink:0}
      .tr-heading{flex:1;min-width:180px}.tr-heading h1{margin:0;font-size:16px;line-height:24px;font-weight:600}
      .tr-muted{font-size:12px;line-height:1.7;color:var(--dsw-alias-label-secondary)}
      .tr-button{font:inherit;font-size:12px;line-height:18px;text-decoration:none;color:inherit;background:var(--dsw-alias-bg-layer-2);border:1px solid var(--dsw-alias-border-l2);border-radius:7px;padding:6px 10px;cursor:pointer;white-space:nowrap}
      .tr-button:hover{background:var(--dsw-alias-bg-layer-3,var(--dsw-alias-bg-layer-2))}.tr-button:disabled{opacity:.5;cursor:default}
      .tr-button:focus-visible,.tr-input:focus-visible{outline:2px solid var(--dsw-alias-label-primary);outline-offset:2px}
      .tr-frame{display:block;flex:1;width:100%;min-height:0;border:0}.tr-settings{flex:1;overflow:auto;padding:24px}.tr-wrap{max-width:760px;margin:auto}
      .tr-card{border:1px solid var(--dsw-alias-border-l2);border-radius:10px;padding:18px;margin:16px 0;background:var(--dsw-alias-bg-layer-2)}.tr-card h2{font-size:16px;margin:0 0 12px}
      .tr-row{display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin:12px 0}.tr-field{display:flex;flex-direction:column;gap:7px;flex:1;min-width:180px;font-size:13px}
      .tr-input{font:inherit;font-size:13px;padding:8px;border:1px solid var(--dsw-alias-border-l2);border-radius:7px;background:var(--dsw-alias-bg-layer-1);color:inherit;width:100%;box-sizing:border-box}
      .tr-error{font-size:13px;padding:12px;border:1px solid #ba5151;color:#d97878;border-radius:8px;margin:12px 0;white-space:pre-wrap}.tr-notice{font-size:13px;line-height:1.7;margin:12px 0}.tr-code{font-size:12px;overflow-wrap:anywhere}
      @media(max-width:640px){.tr-heading{flex-basis:100%}.tr-settings{padding:14px}.tr-field{flex-basis:100%}}
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
    function ConsolePanel({ ctx }) {
      const [state, setState] = React.useState(null),
        [frameURL, setFrameURL] = React.useState(""),
        [externalURL, setExternalURL] = React.useState("");
      const [settings, setSettings] = React.useState(false),
        [busy, setBusy] = React.useState(false),
        [error, setError] = React.useState(""),
        [notice, setNotice] = React.useState("");
      const [python, setPython] = React.useState(""),
        [port, setPort] = React.useState(""),
        [edition, setEdition] = React.useState("solo"),
        [directory, setDirectory] = React.useState("");
      const alive = React.useRef(true),
        frameRef = React.useRef(""),
        sequence = React.useRef(0);
      const call = async (method, payload = {}, signal) => {
        const result = await ctx.connection.rpc.call(
          "/api",
          "trae-relay." + method,
          payload,
          signal,
        );
        if (!result.ok) throw Error(result.error.message);
        return result.value;
      };
      const refresh = async (signal) => {
        const seq = ++sequence.current,
          status = await call("status", {}, signal);
        if (!alive.current || seq !== sequence.current) return;
        setState(status);
        if (status.state === "running") {
          const [external, frame] = await Promise.all([
            call("console", {}, signal),
            frameRef.current
              ? Promise.resolve(null)
              : call("console", {}, signal),
          ]);
          if (!alive.current || seq !== sequence.current) return;
          setExternalURL(external);
          if (frame) {
            frameRef.current = frame;
            setFrameURL(frame);
          }
        } else {
          frameRef.current = "";
          setFrameURL("");
          setExternalURL("");
        }
      };
      React.useEffect(() => {
        alive.current = true;
        const controller = new AbortController();
        let timer;
        const tick = async () => {
          try {
            await refresh(controller.signal);
          } catch (e) {
            if (alive.current && !controller.signal.aborted)
              setError(e.message);
          } finally {
            if (alive.current) timer = setTimeout(tick, 10000);
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
        if (busy) return;
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
      const refreshConsole = async () => {
        setError("");
        try {
          const url = await call("console");
          if (alive.current) {
            frameRef.current = url;
            setFrameURL(url);
          }
        } catch (e) {
          if (alive.current) setError(e.message);
        }
      };
      const openedExternal = () =>
        setTimeout(() => {
          if (!alive.current) return;
          setExternalURL("");
          void call("console")
            .then((url) => {
              if (alive.current) setExternalURL(url);
            })
            .catch((e) => {
              if (alive.current) setError(e.message);
            });
        }, 0);
      const button = (label, onClick, disabled = false) =>
        h(
          "button",
          {
            type: "button",
            className: "tr-button",
            disabled: busy || disabled,
            onClick,
          },
          label,
        );
      const running = state?.state === "running",
        showSettings = settings || !running;
      const labels = {
        unprepared: "未初始化",
        preparing: "准备中",
        starting: "启动中",
        running: "运行中",
        stopped: "已停止",
        error: "启动失败",
      };
      return h(
        "section",
        { className: "tr-console", "aria-label": "TRAE 控制台" },
        h(
          "header",
          { className: "tr-header" },
          h(
            "div",
            { className: "tr-heading" },
            h("h1", null, "TRAE 控制台"),
            h(
              "div",
              { className: "tr-muted" },
              showSettings
                ? "服务设置 · " + (labels[state?.state] || "正在连接…")
                : "TRAE 额度接入、账号与用量管理",
            ),
          ),
          button("刷新控制台", refreshConsole, !running),
          running && externalURL
            ? h(
                "a",
                {
                  className: "tr-button",
                  href: externalURL,
                  target: "_blank",
                  rel: "noopener noreferrer",
                  onClick: openedExternal,
                },
                "新窗口打开",
              )
            : button("新窗口打开", () => {}, true),
          running
            ? button(showSettings ? "返回控制台" : "服务设置", () =>
                setSettings(!showSettings),
              )
            : null,
        ),
        !showSettings && error
          ? h("div", { className: "tr-error", role: "alert" }, error)
          : null,
        running && frameURL
          ? h("iframe", {
              className: "tr-frame",
              style: showSettings ? { display: "none" } : undefined,
              src: frameURL,
              title: "TRAE 代理管理控制台",
              sandbox:
                "allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-downloads",
              referrerPolicy: "no-referrer",
            })
          : null,
        showSettings
          ? h(
              "div",
              { className: "tr-settings" },
              h(
                "div",
                { className: "tr-wrap" },
                h(
                  "p",
                  { className: "tr-muted" },
                  "首次准备后服务随 dsh 启动，完整退出或禁用插件时停止；关闭窗口到托盘继续运行。返回控制台后保留原有概览、账号、用量、设置与模型测试功能。",
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
                  h("h2", null, "准备运行环境"),
                  h(
                    "p",
                    { className: "tr-muted" },
                    "需要 Python 3.10+（含 venv/pip）。只准备独立环境，不自动导入账号。",
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
                      }),
                    ),
                    h(
                      "label",
                      { className: "tr-field" },
                      "端口（留空自动分配）",
                      h("input", {
                        className: "tr-input",
                        type: "number",
                        min: 1024,
                        max: 65535,
                        value: port,
                        onChange: (e) => setPort(e.target.value),
                      }),
                    ),
                  ),
                  button(
                    state?.prepared ? "重新准备环境" : "准备环境",
                    () =>
                      act(
                        "prepare",
                        { python, port },
                        "环境就绪，请启动服务。",
                      ),
                    running || state?.connected,
                  ),
                ),
                h(
                  "div",
                  { className: "tr-card" },
                  h("h2", null, "服务启停"),
                  h(
                    "div",
                    { className: "tr-row" },
                    button(
                      "启动服务",
                      () => act("start"),
                      !state?.prepared || running,
                    ),
                    button("停止服务", () => act("stop"), !running),
                  ),
                  state?.directory
                    ? h(
                        "p",
                        { className: "tr-muted" },
                        "数据目录：",
                        h("code", { className: "tr-code" }, state.directory),
                      )
                    : null,
                ),
                h(
                  "div",
                  { className: "tr-card" },
                  h("h2", null, "导入当前桌面账号"),
                  h(
                    "p",
                    { className: "tr-muted" },
                    "只读所选客户端的登录信息。其他账号操作仍在原有控制台中管理。",
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
                      }),
                    ),
                  ),
                  button(
                    "导入当前桌面账号",
                    () =>
                      act(
                        "import",
                        { edition, directory },
                        "账号已导入。返回控制台 → DSH 模型管理接入模型。",
                      ),
                    !running,
                  ),
                ),
                h(
                  "p",
                  { className: "tr-muted" },
                  "显示/隐藏模型在原有控制台的“DSH 模型管理”中设置，模型和思考强度仍在对话输入框的原生菜单选择。",
                ),
              ),
            )
          : null,
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
          h(ConsolePanel, { ctx }),
        ),
      );
      ctx.slots.inject("sidebar.panellist", () =>
        ctx.slots.register(
          {
            name: "sidebar.panellist",
            id: panel,
            order: 20,
            label: () => "TRAE 控制台",
          },
          Icon,
        ),
      );
    }
    return { apply, inject: ["slots", "layout", "connection"] };
  },
});
