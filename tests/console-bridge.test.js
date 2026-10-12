import { test } from "node:test";
import assert from "node:assert/strict";
import { createConsoleBridge } from "../lib/console-bridge.js";

test("console carrier admits only authenticated allowed controls and closes cleanly", async () => {
  const bridge = await createConsoleBridge({
    models: () => ({ models: [] }),
    modelVisibility: (payload) => payload,
  });
  const request = (path, headers = {}, body = "{}") =>
    fetch(bridge.url + path, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body,
    });
  try {
    assert.equal((await request("/models")).status, 403);
    assert.equal(
      (
        await request("/models", {
          Authorization: "Bearer " + bridge.key,
          Origin: "http://attacker.test",
        })
      ).status,
      403,
    );
    assert.equal(
      (await request("/prepare", { Authorization: "Bearer " + bridge.key }))
        .status,
      404,
    );
    const models = await request("/models", {
      Authorization: "Bearer " + bridge.key,
    });
    assert.deepEqual(await models.json(), { ok: true, value: { models: [] } });
    assert.equal(
      (await request("/models", { Authorization: "Bearer " + bridge.key }, "{"))
        .status,
      400,
    );
    const changes = { changes: [{ id: "fixture", visible: false }] };
    assert.deepEqual(
      (
        await (
          await request(
            "/modelVisibility",
            { Authorization: "Bearer " + bridge.key },
            JSON.stringify(changes),
          )
        ).json()
      ).value,
      changes,
    );
  } finally {
    await bridge.dispose();
  }
  await assert.rejects(fetch(bridge.url + "/models"));
});
