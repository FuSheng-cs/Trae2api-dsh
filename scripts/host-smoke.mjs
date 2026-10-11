import { spawn } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve, join } from "node:path";
import assert from "node:assert/strict";
import { RelayRuntime } from "../lib/runtime.js";

const cli = resolve("work/test-host/node_modules/@deepseek-ai/dsh/lib/bin.js");
const home = resolve("work/host-smoke-home");
const runtimeHome = process.env.DSH_RELAY_TEST_HOME;
if (!runtimeHome)
  throw new Error("Set DSH_RELAY_TEST_HOME to a prepared disposable runtime.");
const env = {
  ...process.env,
  DSH_HOME: home,
  DSH_TRAE_RELAY_HOME: resolve(runtimeHome),
  PYTHONDONTWRITEBYTECODE: "1",
};
async function command(args) {
  return await new Promise((done, fail) => {
    const c = spawn(process.execPath, [cli, ...args], {
      env,
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let log = "";
    c.stdout.on("data", (d) => (log += d));
    c.stderr.on("data", (d) => (log += d));
    c.on("error", fail);
    c.on("exit", (code) =>
      code === 0
        ? done()
        : fail(
            new Error(log.replace(/token=[A-Za-z0-9_-]+/g, "token=REDACTED")),
          ),
    );
  });
}
await command([
  "plugin",
  "--profile",
  "web",
  "add",
  resolve("dsh-trae-relay-1.0.0.tgz"),
]);
const patch = join(home, "profiles", "web", "cordis.patch.yml");
const fixture =
  "- id: llm-pi-ai\n  config:\n    providers:\n      preservation-fixture:\n        api: openai-completions\n        baseURL: https://unused.example.invalid/v1\n        apiKeyEnv: UNUSED_FIXTURE_KEY\n        models:\n          - id: fixture-model\n";
await writeFile(patch, fixture);
const child = spawn(
  process.execPath,
  [cli, "web", "--host", "127.0.0.1", "--port", "0", "--no-open"],
  { env, windowsHide: true, stdio: ["ignore", "pipe", "pipe"] },
);
let logs = "";
child.stdout.on("data", (d) => (logs += d));
child.stderr.on("data", (d) => (logs += d));
let base, cookie;
async function call(method, payload = {}) {
  const result = await fetch(base + "/api/trae-relay." + method, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookie,
      Origin: base,
    },
    body: JSON.stringify({
      type: "client-request",
      rpcId: "smoke-" + method,
      method: "trae-relay." + method,
      payload,
    }),
  });
  assert.equal(result.status, 200);
  const value = await result.json();
  assert.equal(value.result.ok, true, value.result.error?.message);
  return value.result.value;
}
try {
  let launch;
  for (let i = 0; i < 200; i++) {
    launch = logs.match(
      /http:\/\/127\.0\.0\.1:\d+\/\?token=[A-Za-z0-9_-]+/,
    )?.[0];
    if (launch) break;
    if (child.exitCode !== null) throw new Error("DSH exited before launch");
    await new Promise((r) => setTimeout(r, 200));
  }
  assert.ok(launch, "DSH did not become ready");
  base = new URL(launch).origin;
  const login = await fetch(launch, { redirect: "manual" });
  cookie = login.headers.get("set-cookie")?.split(";")[0];
  assert.ok(cookie, "DSH did not issue its browser cookie");
  const status = await call("status");
  assert.equal(status.state, "running");
  assert.ok(
    !logs.includes("entry did not activate"),
    "Plugin failed to activate",
  );
  const before = await readFile(patch, "utf8");
  assert.ok(before.includes("preservation-fixture"));
  await call("connect");
  assert.equal((await call("status")).providerAvailable, true);
  const connected = await readFile(patch, "utf8");
  assert.ok(connected.includes("preservation-fixture"));
  assert.ok(connected.includes("trae-relay:"));
  assert.ok(connected.includes("xhigh: extra_high"));
  assert.ok(connected.includes("low: light"));
  await call("disconnect");
  assert.equal((await call("status")).providerAvailable, false);
  const disconnected = await readFile(patch, "utf8");
  assert.ok(disconnected.includes("preservation-fixture"));
  assert.ok(!disconnected.includes("trae-relay:"));
  await call("stop");
  assert.equal((await call("status")).state, "stopped");
  await call("start");
  assert.equal((await call("status")).state, "running");
  console.log(
    "Real DSH install, authenticated controls, model registration, effort metadata and unrelated-provider preservation passed.",
  );
} finally {
  child.kill("SIGTERM");
  await new Promise((r) => setTimeout(r, 1500));
  const runtime = new RelayRuntime({ directory: resolve(runtimeHome) });
  await runtime.load();
  try {
    await fetch(runtime.baseURL + "/healthz", {
      signal: AbortSignal.timeout(500),
    });
    throw new Error("Relay survived DSH exit");
  } catch (error) {
    if (error.message === "Relay survived DSH exit") throw error;
  }
}
