/** CI/UI-test fake upstream: changes only a verified disposable engine copy. */
import { readFile, appendFile, realpath } from "node:fs/promises";
import { resolve, join, sep } from "node:path";
export async function installFixtureCatalog(directory) {
  const work = await realpath(resolve("work"));
  const target = await realpath(
    join(resolve(directory), "engine", "src", "trae_client.py"),
  );
  if (!target.startsWith(work + sep))
    throw new Error(
      "Refusing to modify an engine outside the disposable work directory",
    );
  const marker = "# DSH_TEST_ONLY_UPSTREAM_FIXTURE";
  if ((await readFile(target, "utf8")).includes(marker)) return;
  const fixture = await readFile("tests/fixtures/model-configs.json", "utf8");
  await appendFile(
    target,
    `\n${marker}\n_dsh_test_configs = json.loads(${JSON.stringify(fixture)})\nasync def _fetch_web_model_configs(*args, **kwargs):\n    return _dsh_test_configs\nasync def _fetch_solo_model_configs(*args, **kwargs):\n    return {}\n`,
    "utf8",
  );
}
