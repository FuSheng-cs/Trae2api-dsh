import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
const roots = [
  "index.js",
  "client.js",
  "lib",
  "python",
  "vendor",
  "cordis.patch.yml",
  "README.md",
  "README.en.md",
  "LICENSE",
  "THIRD_PARTY_NOTICES.md",
];
async function walk(path) {
  let files;
  try {
    files = await readdir(path, { withFileTypes: true });
  } catch (error) {
    if (error.code === "ENOTDIR") return [path];
    throw error;
  }
  // package.json allows only *.py engine files; interpreter caches are excluded.
  return (
    await Promise.all(
      files
        .filter((x) => x.name !== "__pycache__")
        .map((x) => walk(join(path, x.name))),
    )
  ).flat();
}
const files = (await Promise.all(roots.map(walk))).flat();
const forbidden =
  /(?:C:[\\/]Users[\\/]23892|D:[\\/]IT[\\/]AI|sk-[a-zA-Z0-9]{20,}|gh[pousr]_[a-zA-Z0-9]{20,}|eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,})/;
for (const path of files) {
  if (
    /(?:^|[\\/])(?:\.env|accounts\.json|config\.json|__pycache__|\.venv)(?:[\\/]|$)|\.log$|\.pyc$/.test(
      path,
    )
  )
    throw new Error("Private/runtime file in package: " + path);
  if (forbidden.test(await readFile(path, "utf8")))
    throw new Error("Credential or personal path in package: " + path);
  if (path.endsWith(".js")) {
    const result = spawnSync(process.execPath, ["--check", path], {
      encoding: "utf8",
    });
    if (result.status !== 0) throw new Error(result.stderr);
  }
}
const pkg = JSON.parse(await readFile("package.json", "utf8"));
for (const key of ["install", "postinstall", "preinstall", "prepare"])
  if (pkg.scripts?.[key]) throw new Error("Install lifecycle script: " + key);
console.log(
  `Package audit passed: ${files.length} source/documentation files; no runtime data or personal paths.`,
);
