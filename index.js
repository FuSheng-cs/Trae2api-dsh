import { RelayRuntime, PROVIDER, MODEL } from "./lib/runtime.js";
import { visibleModelConfig, withVisibility } from "./lib/models.js";
import { createConsoleBridge } from "./lib/console-bridge.js";

export const name = "trae-relay";
export const inject = [
  "connection",
  "webServer",
  "llm",
  "credentials",
  "settings",
];
export function providerConfig(runtime, config = runtime.config || {}) {
  const models = visibleModelConfig(config);
  return {
    providers: {
      [PROVIDER]: {
        displayName: "TRAE CN",
        apiKeyEnv: "DSH_TRAE_RELAY_API_KEY",
        api: "openai-completions",
        baseURL: runtime.baseURL + "/v1",
        ...(models.length &&
        models.every((model) => model.reasoningEfforts?.high)
          ? { reasoning: "high" }
          : {}),
        compat: {
          supportsDeveloperRole: false,
          supportsStore: false,
          maxTokensField: "max_tokens",
        },
        models,
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
  const syncModels = async (config) => {
    const target = form();
    const existing = target.value.providers?.[PROVIDER];
    if (existing && !owned(existing))
      throw new Error("trae-relay 已被其他供应商占用，拒绝覆盖。");
    const route = providerConfig(runtime, config).providers[PROVIDER];
    let operations;
    if (!route.models.length)
      operations = existing
        ? [{ op: "unset", path: ["providers", PROVIDER] }]
        : [];
    else if (!existing)
      operations = [{ op: "set", path: ["providers", PROVIDER], value: route }];
    else {
      operations = [
        {
          op: "set",
          path: ["providers", PROVIDER, "models"],
          value: route.models,
        },
      ];
      if (
        existing.reasoning &&
        !route.models.every(
          (model) =>
            model.reasoningEfforts &&
            Object.hasOwn(model.reasoningEfforts, existing.reasoning),
        )
      )
        operations.push({
          op: "unset",
          path: ["providers", PROVIDER, "reasoning"],
        });
    }
    if (operations.length)
      await ctx.settings.mutate(target.ns, operations, target.revision);
  };
  const applyCatalog = async (config) => {
    if (runtime.config.connected) await syncModels(config);
    try {
      return await runtime.saveConfiguration(config);
    } catch (error) {
      if (runtime.config.connected) await syncModels(runtime.config);
      throw error;
    }
  };
  const refreshCatalog = async () => {
    try {
      const result = await applyCatalog(await runtime.discoverModels());
      runtime.catalogError = "";
      return result;
    } catch (error) {
      runtime.catalogError = error.message;
      throw error;
    }
  };
  const accountChanged = async (path, payload) => {
    const result = await runtime.request(path, payload);
    try {
      await refreshCatalog();
    } catch (error) {
      result.modelWarning = error.message;
    }
    return result;
  };
  const connect = async () => {
    const accountState = await runtime.request("/api/accounts");
    if (accountState.accounts?.some((account) => account.has_token))
      await refreshCatalog();
    const expectedModels = visibleModelConfig(runtime.config);
    if (!expectedModels.length) throw new Error("请先显示至少一个模型。");
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
    if (
      expectedModels.some(
        (expected) => !models.some((model) => model.id === expected.id),
      )
    )
      throw new Error("部分模型路由没有激活，请检查模型配置后重试。");
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
      catalogError: runtime.catalogError || "",
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
    models: () => runtime.modelCatalog(),
    refreshModels: () => runtime.exclusive(refreshCatalog),
    modelVisibility: (payload) =>
      runtime.exclusive(async () => {
        if (!runtime.config) throw new Error("请先准备环境。");
        return applyCatalog(withVisibility(runtime.config, payload?.changes));
      }),
    accounts: () => runtime.request("/api/accounts"),
    import: (payload) =>
      runtime.exclusive(() => accountChanged("/dsh/import", payload)),
    switch: (payload) =>
      runtime.exclusive(() =>
        accountChanged("/api/accounts/switch", { account_id: payload?.id }),
      ),
    enable: (payload) =>
      runtime.exclusive(() =>
        runtime.request("/api/accounts/model-enabled", {
          account_id: payload?.id,
          enabled: payload?.enabled,
        }),
      ),
  };
  const bridge = await createConsoleBridge(actions);
  runtime.consoleBridge = bridge;
  ctx.effect(() => () => bridge.dispose());
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
          if (text.length > (endpoint === "modelVisibility" ? 262144 : 16384))
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
