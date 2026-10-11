import { test } from "node:test";
import assert from "node:assert/strict";
import { resolve, join } from "node:path";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { spawn } from "node:child_process";
import http from "node:http";
import { RelayRuntime } from "../lib/runtime.js";

const directory = process.env.DSH_RELAY_TEST_HOME;
test(
  "real isolated relay: access controls, synthetic import, account switches and shutdown",
  { skip: !directory, timeout: 45000 },
  async () => {
    const runtime = new RelayRuntime({ directory: resolve(directory) });
    await runtime.load();
    try {
      await runtime.start();
      assert.equal(runtime.state, "running");
      assert.equal(
        (await fetch(runtime.baseURL + "/api/accounts")).status,
        401,
      );
      const hostileHost = await new Promise((done, fail) => {
        const req = http.get(
          runtime.baseURL + "/api/accounts",
          { headers: { host: "attacker.test" } },
          (res) => {
            res.resume();
            done(res.statusCode);
          },
        );
        req.on("error", fail);
      });
      assert.equal(hostileHost, 403);
      const cross = await fetch(runtime.baseURL + "/dsh/session", {
        method: "POST",
        headers: {
          Origin: "https://attacker.test",
          "Content-Type": "application/json",
        },
        body: "{}",
      });
      assert.equal(cross.status, 403);
      const url = await runtime.consoleURL();
      assert.ok(!url.includes(runtime.config.apiKey));
      assert.equal((await fetch(url.split("#")[0])).status, 200);
      const token = url.split("#")[1];
      const session = await fetch(runtime.baseURL + "/dsh/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticket: token }),
      });
      assert.equal(session.status, 200);
      const cookie = session.headers.get("set-cookie").split(";")[0];
      assert.equal(
        (
          await fetch(runtime.baseURL + "/web/login", {
            headers: { Cookie: cookie },
          })
        ).status,
        200,
      );
      const helper = await (
        await fetch(runtime.baseURL + "/web/login/download", {
          headers: { Cookie: cookie },
        })
      ).text();
      assert.ok(helper.includes(runtime.baseURL));
      assert.ok(!helper.includes(runtime.config.apiKey));
      const grant = helper.match(
        /req.add_header\("X-DSH-Login-Ticket", "([A-Za-z0-9_-]+)"\)/,
      )?.[1];
      assert.ok(grant);
      const helperSubmit = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-DSH-Login-Ticket": grant,
        },
        body: JSON.stringify({
          token: "synthetic-helper-token",
          userId: "helper-fixture",
          expiredAt: "2099-01-01T00:00:00Z",
        }),
      };
      assert.equal(
        (await fetch(runtime.baseURL + "/api/web-auth", helperSubmit)).status,
        200,
      );
      assert.equal(
        (await fetch(runtime.baseURL + "/api/web-auth", helperSubmit)).status,
        401,
      );
      await runtime.request("/api/accounts/remove", {
        account_id: "helper-fixture",
      });
      assert.equal(
        (
          await fetch(runtime.baseURL + "/dsh/session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ticket: token }),
          })
        ).status,
        401,
      );
      assert.equal(
        (
          await fetch(runtime.baseURL + "/v1/chat/completions", {
            method: "POST",
            headers: { Cookie: cookie, "Content-Type": "application/json" },
            body: "{}",
          })
        ).status,
        401,
      );
      const desktop = join(resolve(directory), "fixture", "User");
      await mkdir(join(desktop, "globalStorage"), { recursive: true });
      const storage = join(desktop, "globalStorage", "storage.json");
      const synthetic = JSON.stringify({
        "iCubeAuthInfo://icube.cloudide": JSON.stringify({
          token: "synthetic-test-token",
          userId: "fixture-user",
          expiredAt: "2099-01-01T00:00:00Z",
          webId: "fixture-web",
        }),
      });
      await writeFile(storage, synthetic);
      await runtime.request("/dsh/import", {
        edition: "solo",
        directory: desktop,
        label: "Synthetic fixture",
      });
      assert.equal(await readFile(storage, "utf8"), synthetic);
      let accounts = (await runtime.request("/api/accounts")).accounts;
      assert.ok(accounts.some((a) => a.id === "fixture-user"));
      assert.ok(!JSON.stringify(accounts).includes("synthetic-test-token"));
      await runtime.request("/api/accounts/model-enabled", {
        account_id: "fixture-user",
        enabled: false,
      });
      accounts = (await runtime.request("/api/accounts")).accounts;
      assert.equal(
        accounts.find((a) => a.id === "fixture-user").model_enabled,
        false,
      );
      assert.equal((await runtime.request("/api/auto-checkin")).enabled, false);
      await runtime.request("/api/accounts/remove", {
        account_id: "fixture-user",
      });
    } finally {
      await runtime.dispose();
    }
    await assert.rejects(
      fetch(runtime.baseURL + "/healthz", {
        signal: AbortSignal.timeout(1000),
      }),
    );
  },
);

test(
  "abrupt owner exit removes relay and venv descendants",
  { skip: !directory, timeout: 45000 },
  async () => {
    const script = `import {RelayRuntime} from ${JSON.stringify(new URL("../lib/runtime.js", import.meta.url).href)};const r=new RelayRuntime({directory:process.argv[1]});await r.load();await r.start();console.log(r.baseURL);setInterval(()=>{},1000);`;
    const owner = spawn(
      process.execPath,
      ["--input-type=module", "-e", script, resolve(directory)],
      { stdio: ["ignore", "pipe", "pipe"], windowsHide: true },
    );
    let errors = "";
    owner.stderr.on("data", (d) => (errors += d));
    let url;
    try {
      url = await new Promise((done, fail) => {
        const timer = setTimeout(
          () => fail(new Error("Owner launch timed out: " + errors)),
          30000,
        );
        owner.once("exit", () => {
          clearTimeout(timer);
          fail(new Error(errors || "Owner failed"));
        });
        owner.stdout.once("data", (d) => {
          clearTimeout(timer);
          done(d.toString().trim());
        });
      });
      assert.equal((await fetch(url + "/healthz")).status, 200);
      owner.kill("SIGKILL");
      let stopped = false;
      for (let i = 0; i < 40; i++) {
        try {
          await fetch(url + "/healthz", { signal: AbortSignal.timeout(300) });
        } catch {
          stopped = true;
          break;
        }
        await new Promise((r) => setTimeout(r, 250));
      }
      assert.equal(stopped, true, "relay survived owner exit");
    } finally {
      owner.kill("SIGKILL");
    }
  },
);
