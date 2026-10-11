import { RelayRuntime, PROVIDER, MODEL } from "./lib/runtime.js";

export const name = "trae-relay";
export const inject = [
  "connection",
  "webServer",
  "llm",
  "credentials",
  "settings",
];
export function providerConfig(runtime) {
  return {
    providers: {
      [PROVIDER]: {
        displayName: "TRAE CN",
        apiKeyEnv: "DSH_TRAE_RELAY_API_KEY",
        api: "openai-completions",
        baseURL: runtime.baseURL + "/v1",
        reasoning: "high",
        compat: {
          supportsDeveloperRole: false,
          supportsStore: false,
          maxTokensField: "max_tokens",
        },
        models: [
          {
            id: MODEL,
            name: "DeepSeek V4.1 Flash (TRAE)",
            contextWindow: 200000,
            maxTokens: 8192,
            reasoningEfforts: {
              low: "light",
              high: "high",
              xhigh: "extra_high",
            },
          },
        ],
      },
    },
  };
}
export async function apply(ctx) {
  const runtime = new RelayRuntime();
  // Disposal exists before any async setup/start, including HMR and failed loads.
  ctx.effect(() => () => runtime.dispose());
  const form = () => {
    const forms = ctx.settings.describe({ redactSecrets: true });
    const matches = forms.filter(
      (row) => row.value && Object.hasOwn(row.value, "providers"),
    );
    const selected =
      matches.find((row) => row.ns === runtime.config?.namespace) ||
      matches.find((row) => row.ns === "llm-pi-ai") ||
      (matches.length === 1 ? matches[0] : undefined);
    if (!selected)
      throw new Error(
        "找不到唯一的 pi-ai 模型配置入口。请启用标准 dsh llm-pi-ai 插件。",
      );
    return selected;
  };
  const owned = (route) => route?.apiKeyEnv === "DSH_TRAE_RELAY_API_KEY";
  const connect = async () => {
    const target = form();
    const existing = target.value.providers?.[PROVIDER];
    if (existing && !owned(existing))
      throw new Error("trae-relay 供应商名称已被其他配置占用。");
    const { credentialRef } = await import("@deepseek-ai/dsh-credentials");
    const ref = credentialRef("DSH_TRAE_RELAY_API_KEY");
    const current = await ctx.credentials.resolve(ref);
    if (current && current.value !== runtime.config.apiKey)
      throw new Error(
        "DSH_TRAE_RELAY_API_KEY 已被其他配置占用，请先处理冲突。",
      );
    if (!current) await ctx.credentials.set(ref, runtime.config.apiKey);
    await ctx.settings.mutate(
      target.ns,
      [
        {
          op: "set",
          path: ["providers", PROVIDER],
          value: providerConfig(runtime).providers[PROVIDER],
        },
      ],
      target.revision,
    );
    if (!ctx.llm.listProviders().some((item) => item.id === PROVIDER))
      throw new Error(
        "模型配置已保存，但路由未激活。请检查 dsh 模型设置后重试。",
      );
    const models = await ctx.llm.listModels(PROVIDER);
    if (!models.some((model) => model.id === MODEL))
      throw new Error("V4.1 Flash 路由没有激活。");
    runtime.config.namespace = target.ns;
    await runtime.setConnected(true);
    return runtime.status();
  };
  const disconnect = async () => {
    if (!runtime.config) throw new Error("请先准备环境。");
    const target = form();
    const existing = target.value.providers?.[PROVIDER];
    if (existing && !owned(existing))
      throw new Error("trae-relay 配置已被其他供应商替换，拒绝删除。");
    if (existing)
      await ctx.settings.mutate(
        target.ns,
        [{ op: "unset", path: ["providers", PROVIDER] }],
        target.revision,
      );
    await runtime.setConnected(false);
    return runtime.status();
  };
  const actions = {
    status: () => ({
      ...runtime.status(),
      providerAvailable: ctx.llm
        .listProviders()
        .some((item) => item.id === PROVIDER),
    }),
    prepare: (payload) =>
      runtime.setup({
        python: payload?.python || undefined,
        port: payload?.port ? Number(payload.port) : undefined,
      }),
    start: () => runtime.start(),
    stop: () => runtime.stop(),
    connect: () =>
      runtime.exclusive(async () => {
        if (runtime.state !== "running") throw new Error("请先启动服务。");
        return connect();
      }),
    disconnect: () => runtime.exclusive(disconnect),
    console: () => runtime.consoleURL(),
    accounts: () => runtime.request("/api/accounts"),
    import: (payload) =>
      runtime.exclusive(() => runtime.request("/dsh/import", payload)),
    switch: (payload) =>
      runtime.exclusive(() =>
        runtime.request("/api/accounts/switch", { account_id: payload?.id }),
      ),
    enable: (payload) =>
      runtime.exclusive(() =>
        runtime.request("/api/accounts/model-enabled", {
          account_id: payload?.id,
          enabled: payload?.enabled,
        }),
      ),
  };
  // Exact Fetch contributions share DSH's existing authentication fence.
  // Avoid separate RPC channels: their 0.2.0 Host registration has stricter
  // service-scope requirements and is unnecessary for unary controls.
  for (const [endpoint, action] of Object.entries(actions))
    ctx.effect(() =>
      ctx.connection.fetch.register({
        path: "/api/trae-relay." + endpoint,
        methods: ["POST"],
        requestBody: "buffered",
        fetch: async (request) => {
          const text = await request.text();
          if (text.length > 16384)
            return Response.json(
              { error: "Request too large" },
              { status: 413 },
            );
          let message;
          try {
            message = JSON.parse(text);
          } catch {
            return Response.json({ error: "Invalid JSON" }, { status: 400 });
          }
          if (
            message.type !== "client-request" ||
            typeof message.rpcId !== "string" ||
            message.method !== "trae-relay." + endpoint
          )
            return Response.json(
              { error: "Invalid envelope" },
              { status: 400 },
            );
          let result;
          try {
            result = { ok: true, value: await action(message.payload) };
          } catch (error) {
            result = {
              ok: false,
              error: {
                code: "trae-relay/operation-failed",
                message: error.message,
                details: {},
              },
            };
          }
          return Response.json(
            { type: "server-response", rpcId: message.rpcId, result },
            { headers: { "Cache-Control": "no-store" } },
          );
        },
      }),
    );
  await runtime.load();
  if (runtime.state === "stopped") {
    try {
      await runtime.start();
    } catch (error) {
      runtime.error = error.message;
      ctx.logger?.warn("TRAE relay: " + error.message);
    }
  }
}
