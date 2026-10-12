import { createServer } from "node:http";
import { randomBytes, timingSafeEqual } from "node:crypto";

/** Private relay-to-Host carrier; the browser never receives this secret. */
export async function createConsoleBridge(actions) {
  const key = randomBytes(32).toString("hex");
  const allowed = new Set([
    "models",
    "status",
    "refreshModels",
    "modelVisibility",
    "connect",
    "disconnect",
  ]);
  const server = createServer(async (req, res) => {
    const send = (code, value) => {
      res.writeHead(code, {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      });
      res.end(JSON.stringify(value));
    };
    const header = Buffer.from(req.headers.authorization || "");
    const expected = Buffer.from("Bearer " + key);
    if (
      header.length !== expected.length ||
      !timingSafeEqual(header, expected) ||
      req.headers.origin
    ) {
      req.resume();
      return send(403, { error: "Forbidden" });
    }
    const action = (req.url || "").slice(1);
    if (req.method !== "POST" || !allowed.has(action)) {
      req.resume();
      return send(404, { error: "Unknown action" });
    }
    try {
      let text = "";
      for await (const chunk of req) {
        text += chunk;
        if (text.length > 262144) {
          req.resume();
          return send(413, { error: "Request too large" });
        }
      }
      const payload = JSON.parse(text || "{}");
      send(200, { ok: true, value: await actions[action](payload) });
    } catch (error) {
      send(400, { ok: false, error: error.message });
    }
  });
  server.requestTimeout = 60000;
  await new Promise((done, fail) => {
    server.once("error", fail);
    server.listen(0, "127.0.0.1", done);
  });
  const url = "http://127.0.0.1:" + server.address().port;
  return {
    url,
    key,
    dispose: async () => {
      server.closeAllConnections();
      await new Promise((resolve) => server.close(resolve));
    },
  };
}
