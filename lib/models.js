export const DEFAULT_MODEL = "deepseek-v4.1-flash";
const LEVELS = { light: "low", high: "high", extra_high: "xhigh" };

export const PRESET_MODELS = [
  {
    id: DEFAULT_MODEL,
    name: "DeepSeek V4.1 Flash",
    contextWindow: 200000,
    maxTokens: 8192,
    input: ["text"],
    reasoningLevels: ["light", "high", "extra_high"],
    defaultReasoning: "high",
    reasoningSupport: true,
  },
];

export function normalizeModels(value) {
  if (!Array.isArray(value) || value.length > 500)
    throw new Error("模型列表格式无效。");
  const models = new Map();
  for (const raw of value) {
    if (
      !raw ||
      typeof raw.id !== "string" ||
      !raw.id.trim() ||
      raw.id.length > 256 ||
      /[\x00-\x1f]/.test(raw.id)
    )
      throw new Error("模型 ID 无效。");
    const levels = Object.keys(LEVELS).filter((level) =>
      raw.reasoningLevels?.includes(level),
    );
    const capacity = (number, fallback) =>
      Number.isSafeInteger(number) && number > 0 && number <= 10000000
        ? number
        : fallback;
    const model = {
      id: raw.id,
      configName:
        typeof raw.configName === "string" &&
        raw.configName.toLowerCase() === raw.id
          ? raw.configName
          : raw.id,
      name: typeof raw.name === "string" ? raw.name.slice(0, 256) : raw.id,
      contextWindow: capacity(raw.contextWindow, 200000),
      maxTokens: Math.min(capacity(raw.maxTokens, 8192), 32768),
      input: raw.input?.includes("image") ? ["text", "image"] : ["text"],
      reasoningLevels: levels,
      defaultReasoning: levels.includes(raw.defaultReasoning)
        ? raw.defaultReasoning
        : null,
      reasoningSupport:
        raw.reasoningSupport === true
          ? true
          : raw.reasoningSupport === false
            ? false
            : null,
    };
    model.maxTokens = Math.min(model.maxTokens, model.contextWindow);
    if (!models.has(model.id)) models.set(model.id, model);
  }
  return [...models.values()].sort((a, b) =>
    a.id === DEFAULT_MODEL
      ? -1
      : b.id === DEFAULT_MODEL
        ? 1
        : a.name.localeCompare(b.name),
  );
}

export function catalog(config = {}) {
  const models = normalizeModels(config.models ?? PRESET_MODELS);
  const hidden = new Set(config.hiddenModels || []);
  return {
    source: config.catalogSource || "preset",
    updatedAt: config.catalogUpdatedAt || null,
    models: models.map((model) => ({
      ...model,
      visible: !hidden.has(model.id),
    })),
  };
}

export function visibleModelConfig(config = {}) {
  return catalog(config)
    .models.filter((model) => model.visible)
    .map((model) => ({
      id: model.id,
      name: model.name + " (TRAE)",
      contextWindow: model.contextWindow,
      maxTokens: model.maxTokens,
      input: model.input,
      reasoningEfforts: model.reasoningLevels.length
        ? Object.fromEntries(
            model.reasoningLevels.map((level) => [LEVELS[level], level]),
          )
        : false,
    }));
}

export function withVisibility(config, changes) {
  if (!Array.isArray(changes) || changes.length > 500)
    throw new Error("模型显示设置格式无效。");
  const available = new Set(catalog(config).models.map((model) => model.id));
  const hidden = new Set(config.hiddenModels || []);
  for (const change of changes) {
    if (
      !change ||
      !available.has(change.id) ||
      typeof change.visible !== "boolean"
    )
      throw new Error("未知模型或无效显示设置。");
    if (change.visible) hidden.delete(change.id);
    else hidden.add(change.id);
  }
  return { ...config, hiddenModels: [...hidden].sort() };
}
