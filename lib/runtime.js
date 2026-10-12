import { spawn } from "node:child_process";
import {
  mkdir,
  readFile,
  writeFile,
  rename,
  copyFile,
  cp,
  access,
  chmod,
  open,
} from "node:fs/promises";
import { resolve, join, parse } from "node:path";
import { homedir } from "node:os";
import { fileURLToPath } from "node:url";
import { randomBytes } from "node:crypto";
import { createServer } from "node:net";
import { catalog, normalizeModels } from "./models.js";

export const PACKAGE_ROOT = resolve(
  fileURLToPath(new URL("..", import.meta.url)),
);
export const MODEL = "deepseek-v4.1-flash";
export const PROVIDER = "trae-relay";
const delay = (ms) => new Promise((r) => setTimeout(r, ms));
export function stateDirectory(env = process.env, home = homedir()) {
  return resolve(
    env.DSH_TRAE_RELAY_HOME ||
      join(env.DSH_HOME || join(home, ".dsh"), "plugins", "dsh-trae-relay"),
  );
}
export function normalizedEnvironment(source = process.env) {
  const env = { ...source, PYTHONUTF8: "1", PYTHONUNBUFFERED: "1" };
  // No ambient TRAE credentials/configuration cross the isolation boundary.
  for (const key of Object.keys(env))
    if (/^(TRAE_|RELAY_|UPSTREAM_|WEB_LOGIN_)/.test(key)) delete env[key];
  for (const key of ["NO_PROXY", "no_proxy"])
    env[key] = [
      ...new Set([
        ...(env[key] || "")
          .split(",")
          .map((x) => x.trim().replace(/^\[([0-9a-f:]+)\]$/i, "$1")),
        "127.0.0.1",
        "localhost",
        "::1",
      ]),
    ]
      .filter(Boolean)
      .join(",");
  return env;
}
export async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}
export async function atomicJson(path, value) {
  await mkdir(resolve(path, ".."), { recursive: true, mode: 0o700 });
  const temp = path + "." + randomBytes(6).toString("hex") + ".tmp";
  await writeFile(temp, JSON.stringify(value, null, 2) + "\n", { mode: 0o600 });
  await rename(temp, path);
  await chmod(path, 0o600);
}
async function run(command, args, options = {}) {
  return await new Promise((done, fail) => {
    const child = spawn(command, args, {
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"],
      ...options,
    });
    let output = "";
    for (const stream of [child.stdout, child.stderr])
      stream?.on("data", (data) => {
        output = (output + data.toString()).slice(-6000);
      });
    child.once("error", fail);
    child.once("exit", (code) =>
      code === 0
        ? done(output)
        : fail(new Error(`Command failed (${code}): ${output}`)),
    );
  });
}
export async function findPython(explicit, env = process.env) {
  const choices = explicit
    ? [[explicit, []]]
    : [
        ["python3", []],
        ["python", []],
        ...(process.platform === "win32" ? [["py", ["-3"]]] : []),
      ];
  for (const [executable, prefix] of choices) {
    try {
      const output = await run(
        executable,
        [
          ...prefix,
          "-c",
          "import sys; assert sys.version_info >= (3,10); print(sys.executable)",
        ],
        { env },
      );
      return output.trim().split(/\r?\n/).at(-1);
    } catch {}
  }
  throw new Error(
    "需要 Python 3.10+（含 venv/pip）。安装 Python，或填写 Python 可执行文件完整路径。",
  );
}
async function availablePort(preferred) {
  return await new Promise((done, fail) => {
    const server = createServer();
    server.once("error", fail);
    server.listen(preferred || 0, "127.0.0.1", () => {
      const port = server.address().port;
      server.close(() => done(port));
    });
  });
}

export class RelayRuntime {
  constructor({
    directory = stateDirectory(),
    ownerPid = process.pid,
    packageRoot = PACKAGE_ROOT,
  } = {}) {
    this.directory = resolve(directory);
    this.ownerPid = ownerPid;
    this.packageRoot = packageRoot;
    if (
      [
        parse(this.directory).root,
        resolve(homedir()),
        resolve(process.env.DSH_HOME || join(homedir(), ".dsh")),
      ].includes(this.directory)
    )
      throw new Error(
        "插件数据目录必须是独立子目录，不能使用磁盘根目录、用户主目录或 DSH_HOME 本身。",
      );
    this.state = "unprepared";
    this.error = "";
    this.child = null;
    this.closed = false;
    this.lock = Promise.resolve();
  }
  get configFile() {
    return join(this.directory, "config.json");
  }
  get runtimeRoot() {
    return join(this.directory, "engine");
  }
  get python() {
    return join(
      this.directory,
      "venv",
      process.platform === "win32" ? "Scripts/python.exe" : "bin/python",
    );
  }
  get baseURL() {
    return `http://127.0.0.1:${this.config.port}`;
  }
  async load() {
    try {
      this.config = JSON.parse(await readFile(this.configFile, "utf8"));
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
    if (
      this.config &&
      (await exists(this.python)) &&
      (await exists(join(this.directory, "ready.json")))
    ) {
      const ready = JSON.parse(
        await readFile(join(this.directory, "ready.json"), "utf8"),
      );
      if (ready.packageVersion === "1.0.0") this.state = "stopped";
    }
    if (this.state === "stopped") {
      // Plugin updates refresh only its runner files; accounts and venv stay.
      await cp(
        join(this.packageRoot, "python"),
        join(this.directory, "runner"),
        { recursive: true },
      );
    }
    return this.status();
  }
  status() {
    return {
      state: this.state,
      error: this.error,
      prepared:
        !["unprepared", "preparing"].includes(this.state) && !!this.config,
      directory: this.directory,
      port: this.config?.port,
      provider: PROVIDER,
      model: MODEL,
      connected: !!this.config?.connected,
    };
  }
  exclusive(operation) {
    const result = this.lock.then(() => {
      if (this.closed) throw new Error("Plugin has been disposed");
      return operation();
    });
    this.lock = result.catch(() => {});
    return result;
  }
  setup(options = {}) {
    return this.exclusive(async () => {
      if (this.state === "running") throw new Error("先停止服务再准备环境。");
      if (this.config?.connected)
        throw new Error("先断开模型接入再重新准备环境。");
      if (
        options.port !== undefined &&
        (!Number.isInteger(options.port) ||
          options.port < 1024 ||
          options.port > 65535)
      )
        throw new Error("端口必须在 1024–65535 之间。");
      this.state = "preparing";
      this.error = "";
      try {
        await mkdir(this.directory, { recursive: true, mode: 0o700 });
        // Restrict inherited ACL before writing any secrets on Windows.
        if (process.platform === "win32") {
          const identity = (await run("whoami.exe", [])).trim();
          await run("icacls.exe", [
            this.directory,
            "/inheritance:r",
            "/grant:r",
            `${identity}:(OI)(CI)F`,
            "SYSTEM:(OI)(CI)F",
          ]);
        }
        const python = await findPython(options.python);
        if (!(await exists(this.python)))
          await run(python, ["-m", "venv", join(this.directory, "venv")], {
            env: normalizedEnvironment(),
          });
        await cp(
          join(this.packageRoot, "vendor", "trae2api-cn"),
          this.runtimeRoot,
          { recursive: true },
        );
        await cp(
          join(this.packageRoot, "python"),
          join(this.directory, "runner"),
          { recursive: true },
        );
        await run(
          this.python,
          [
            "-m",
            "pip",
            "install",
            "--disable-pip-version-check",
            "-r",
            join(this.runtimeRoot, "requirements.txt"),
          ],
          { env: normalizedEnvironment() },
        );
        this.config = {
          ...this.config,
          version: 1,
          port: await availablePort(options.port || this.config?.port),
          apiKey: this.config?.apiKey || randomBytes(32).toString("hex"),
        };
        await atomicJson(this.configFile, this.config);
        await atomicJson(join(this.directory, "ready.json"), {
          packageVersion: "1.0.0",
        });
        this.state = "stopped";
        return this.status();
      } catch (error) {
        this.state = "unprepared";
        this.error = error.message;
        throw error;
      }
    });
  }
  start() {
    return this.exclusive(() => this.startUnlocked());
  }
  async startUnlocked() {
    if (this.state === "running") return this.status();
    if (
      !this.config ||
      !(await exists(this.python)) ||
      !(await exists(join(this.directory, "ready.json")))
    )
      throw new Error("请先准备运行环境。");
    await availablePort(this.config.port); // Refuse to adopt another service.
    this.state = "starting";
    this.error = "";
    const env = {
      ...normalizedEnvironment(),
      HOST: "127.0.0.1",
      PORT: String(this.config.port),
      RELAY_API_KEYS: this.config.apiKey,
      TRAE_AUTH_SOURCE: "web-login",
      UPSTREAM_MODE: "remote",
      DSH_RELAY_ENGINE: this.runtimeRoot,
      DSH_RELAY_OWNER: String(this.ownerPid),
      LOG_LEVEL: "WARNING",
      ...(this.consoleBridge
        ? {
            DSH_RELAY_CONTROL_URL: this.consoleBridge.url,
            DSH_RELAY_CONTROL_KEY: this.consoleBridge.key,
          }
        : {}),
    };
    const log = await open(join(this.directory, "relay.log"), "a", 0o600);
    try {
      this.child = spawn(
        this.python,
        [
          join(this.directory, "runner", "supervisor.py"),
          "--owner",
          String(this.ownerPid),
          "--root",
          this.runtimeRoot,
          "--entry",
          join(this.directory, "runner", "relay_entry.py"),
          "--port",
          String(this.config.port),
        ],
        {
          cwd: this.runtimeRoot,
          env,
          windowsHide: true,
          stdio: ["ignore", log.fd, log.fd],
        },
      );
    } finally {
      await log.close();
    }
    const child = this.child;
    child.once("error", (error) => {
      this.error = error.message;
      this.state = "error";
    });
    child.once("exit", () => {
      if (this.child === child) {
        this.child = null;
        if (this.state !== "stopped") this.state = "stopped";
      }
    });
    try {
      for (let i = 0; i < 100; i++) {
        if (this.closed) throw new Error("Plugin has been disposed");
        if (child.exitCode !== null || this.error)
          throw new Error(
            this.error || "服务启动失败，请检查插件目录下 relay.log。",
          );
        try {
          const r = await fetch(this.baseURL + "/healthz", {
            signal: AbortSignal.timeout(500),
          });
          if (r.ok) {
            this.state = "running";
            return this.status();
          }
        } catch {}
        await delay(300);
      }
      throw new Error("服务启动超时，请检查 relay.log。");
    } catch (error) {
      await this.stopUnlocked();
      this.state = "error";
      this.error = error.message;
      throw error;
    }
  }
  stop() {
    return this.exclusive(() => this.stopUnlocked());
  }
  async stopUnlocked() {
    const child = this.child;
    if (child && child.exitCode === null) {
      const ended = new Promise((r) => child.once("exit", r));
      if (process.platform === "win32")
        await run("taskkill.exe", [
          "/PID",
          String(child.pid),
          "/T",
          "/F",
        ]).catch(() => {});
      else child.kill("SIGTERM");
      await Promise.race([ended, delay(9000)]);
      if (child.exitCode === null) child.kill("SIGKILL");
    }
    this.child = null;
    this.state = this.config ? "stopped" : "unprepared";
    return this.status();
  }
  async request(path, body) {
    if (this.state !== "running") throw new Error("请先启动服务。");
    const r = await fetch(this.baseURL + path, {
      method: body === undefined ? "GET" : "POST",
      headers: {
        Authorization: `Bearer ${this.config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(path === "/dsh/models" ? 45000 : 30000),
    });
    const result = await r.json();
    if (!r.ok)
      throw new Error(
        path.startsWith("/dsh/") && typeof result.error === "string"
          ? result.error
          : `代理请求失败 HTTP ${r.status}`,
      );
    if (result.success === false || result.error)
      throw new Error(
        typeof result.error === "string" ? result.error : "代理操作失败",
      );
    return result;
  }
  async consoleURL() {
    const { ticket } = await this.request("/dsh/ticket", {});
    return this.baseURL + "/dsh/console#" + ticket;
  }
  async setConnected(value) {
    this.config.connected = value;
    await atomicJson(this.configFile, this.config);
  }
  modelCatalog() {
    return catalog(this.config);
  }
  async discoverModels() {
    const result = await this.request("/dsh/models");
    const models = normalizeModels(result.models);
    if (!models.length) throw new Error("没有发现可用模型，原有列表已保留。");
    return {
      ...this.config,
      models,
      catalogSource: "account",
      catalogUpdatedAt: new Date().toISOString(),
    };
  }
  async saveConfiguration(config) {
    await atomicJson(this.configFile, config);
    this.config = config;
    return this.modelCatalog();
  }
  async dispose() {
    this.closed = true;
    await this.lock;
    await this.stopUnlocked();
  }
}
