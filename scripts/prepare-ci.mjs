import { RelayRuntime } from "../lib/runtime.js";
const directory = process.env.DSH_RELAY_TEST_HOME;
if (!directory)
  throw new Error("Set DSH_RELAY_TEST_HOME to a disposable test directory.");
const runtime = new RelayRuntime({ directory });
await runtime.load();
await runtime.setup({ python: process.env.TEST_PYTHON });
console.log("Isolated test environment prepared.");
