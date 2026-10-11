import { test } from "node:test";
import assert from "node:assert/strict";
import { providerConfig } from "../index.js";

test("TRAE route exposes supported effort dialect and tool-compatible request fields", () => {
  const config = providerConfig({ baseURL: "http://127.0.0.1:12345" });
  const route = config.providers["trae-relay"];
  assert.equal(route.baseURL, "http://127.0.0.1:12345/v1");
  assert.equal(route.api, "openai-completions");
  assert.equal(route.compat.supportsDeveloperRole, false);
  assert.equal(route.compat.maxTokensField, "max_tokens");
  assert.equal(route.models[0].id, "deepseek-v4.1-flash");
  assert.deepEqual(route.models[0].reasoningEfforts, {
    low: "light",
    high: "high",
    xhigh: "extra_high",
  });
  assert.equal(route.models[0].maxTokens, 8192);
});
