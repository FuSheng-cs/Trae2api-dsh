import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import {
  RelayRuntime,
  stateDirectory,
  normalizedEnvironment,
  atomicJson,
} from "../lib/runtime.js";

test("runtime follows DSH_HOME or an explicit private home", () => {
  const base = resolve(tmpdir(), "isolated"),
    own = resolve(tmpdir(), "own");
  assert.equal(
    stateDirectory({ DSH_HOME: base }, "/home/user"),
    join(base, "plugins", "dsh-trae-relay"),
  );
  assert.equal(stateDirectory({ DSH_TRAE_RELAY_HOME: own }, "/home/user"), own);
});
test("ambient TRAE credentials are isolated and IPv6 NO_PROXY is valid", () => {
  const original = {
    TRAE_TOKEN: "test-only",
    RELAY_API_KEYS: "test-only",
    UPSTREAM_MODE: "ide",
    NO_PROXY: "[::1],example.test",
    PATH: "a",
  };
  const result = normalizedEnvironment(original);
  assert.equal(result.TRAE_TOKEN, undefined);
  assert.equal(result.RELAY_API_KEYS, undefined);
  assert.equal(result.UPSTREAM_MODE, undefined);
  assert.equal(result.PATH, "a");
  assert.ok(result.NO_PROXY.includes("::1"));
  assert.ok(!result.NO_PROXY.includes("[::1]"));
  assert.equal(original.TRAE_TOKEN, "test-only");
});
test("unprepared plugin performs no account discovery or runtime installation", async () => {
  const directory = await mkdtemp(join(tmpdir(), "dsh-relay-test-"));
  const runtime = new RelayRuntime({ directory });
  assert.equal((await runtime.load()).state, "unprepared");
  await assert.rejects(runtime.start(), /准备/);
  await assert.rejects(runtime.setup({ port: 1 }), /端口/);
  assert.equal(runtime.child, null);
  await runtime.dispose();
  await assert.rejects(runtime.start(), /disposed/);
});
test("configuration writes are atomic JSON and concurrent operations serialize", async () => {
  const directory = await mkdtemp(join(tmpdir(), "dsh-relay-config-"));
  await atomicJson(join(directory, "config.json"), { port: 12456 });
  assert.deepEqual(
    JSON.parse(await readFile(join(directory, "config.json"), "utf8")),
    { port: 12456 },
  );
  const runtime = new RelayRuntime({ directory });
  const order = [];
  await Promise.all([
    runtime.exclusive(async () => {
      order.push("a");
      await new Promise((r) => setTimeout(r, 20));
      order.push("b");
    }),
    runtime.exclusive(async () => {
      order.push("c");
    }),
  ]);
  assert.deepEqual(order, ["a", "b", "c"]);
  await runtime.dispose();
});
