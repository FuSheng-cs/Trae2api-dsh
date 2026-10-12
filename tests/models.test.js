import { test } from "node:test";
import assert from "node:assert/strict";
import {
  catalog,
  normalizeModels,
  withVisibility,
  visibleModelConfig,
} from "../lib/models.js";
import { providerConfig } from "../index.js";
const models = [
  {
    id: "a",
    name: "Reasoner",
    reasoningSupport: true,
    reasoningLevels: ["light", "high"],
    defaultReasoning: "high",
  },
  {
    id: "b",
    name: "Plain",
    reasoningSupport: false,
    reasoningLevels: [],
    input: ["text", "image"],
  },
];

test("only advertised supported strengths appear and mixed routes have no invalid shared default", () => {
  const route = providerConfig({
    baseURL: "http://127.0.0.1:12345",
    config: { models },
  }).providers["trae-relay"];
  assert.deepEqual(route.models.find((m) => m.id === "a").reasoningEfforts, {
    low: "light",
    high: "high",
  });
  assert.equal(route.models.find((m) => m.id === "b").reasoningEfforts, false);
  assert.equal(Object.hasOwn(route, "reasoning"), false);
  assert.deepEqual(route.models.find((m) => m.id === "b").input, [
    "text",
    "image",
  ]);
});
test("visibility is reversible, preserves unavailable preferences and filters only chosen models", () => {
  const config = {
    models,
    hiddenModels: ["no-longer-listed"],
    apiKey: "fixture-private",
  };
  const hidden = withVisibility(config, [{ id: "a", visible: false }]);
  assert.deepEqual(
    visibleModelConfig(hidden).map((m) => m.id),
    ["b"],
  );
  assert.ok(hidden.hiddenModels.includes("no-longer-listed"));
  assert.deepEqual(config.hiddenModels, ["no-longer-listed"]);
  const restored = withVisibility(hidden, [{ id: "a", visible: true }]);
  assert.equal(visibleModelConfig(restored).length, 2);
  assert.ok(!JSON.stringify(catalog(restored)).includes("fixture-private"));
});
test("empty catalog, duplicates, invalid capabilities and unsafe visibility edits are handled", () => {
  assert.deepEqual(normalizeModels([]), []);
  assert.equal(normalizeModels([...models, ...models]).length, 2);
  assert.deepEqual(
    normalizeModels([
      { id: "x", reasoningLevels: ["ultra"], contextWindow: -3 },
    ])[0].reasoningLevels,
    [],
  );
  assert.throws(
    () => withVisibility({ models }, [{ id: "unknown", visible: false }]),
    /未知/,
  );
  assert.throws(
    () => withVisibility({ models }, [{ id: "a", visible: "false" }]),
    /无效/,
  );
});
test("all models can be hidden and legacy profiles retain the flash preset", () => {
  assert.equal(catalog().models[0].id, "deepseek-v4.1-flash");
  const hidden = withVisibility(
    { models },
    models.map((m) => ({ id: m.id, visible: false })),
  );
  assert.deepEqual(visibleModelConfig(hidden), []);
});
