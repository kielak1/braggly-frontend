import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire, Module } from "node:module";
import fs from "node:fs";
import path from "node:path";

// Execute the real API helper, replacing only its unused server-cookie import.
const require = createRequire(import.meta.url);
const ts = require("typescript");
const filename = path.resolve(import.meta.dirname, "../src/app/utils/api.ts");
const api = new Module(filename);
api.filename = filename;
api.paths = require.resolve.paths("typescript");
api.require = (id) =>
  id === "@/utils/cookies"
    ? { getServerCookie: (cookies, name) => cookies.get(name)?.value }
    : require(id);
process.env.NEXT_PUBLIC_BACKEND_URL = "https://backend.example.invalid";
api._compile(
  ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  }).outputText,
  filename,
);
const { quickAnalysisXrdFile } = api.exports;

function setup(t, token = "synthetic-xrd-credential-only") {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: { getItem: (name) => (name === "token" ? token : null) },
  });
  t.after(() => {
    if (descriptor) Object.defineProperty(globalThis, "localStorage", descriptor);
    else delete globalThis.localStorage;
  });
  const logs = [];
  for (const method of ["log", "debug", "info", "warn", "error"])
    t.mock.method(console, method, (...args) => logs.push({ method, args }));
  return { logs, token, file: new File(["synthetic XRD data"], "smoke.xrd") };
}

test("XRD analysis sends Authorization and the file without logging credentials", async (t) => {
  const { logs, token, file } = setup(t);
  const result = { id: "synthetic-analysis", peaks: [12.5, 24] };
  const calls = [];
  t.mock.method(globalThis, "fetch", async (url, init) => {
    calls.push({ url, init });
    return new Response(JSON.stringify(result));
  });

  assert.deepEqual(await quickAnalysisXrdFile(file), result);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, "/api/xrd/analyze");
  assert.equal(calls[0].init.method, "POST");
  assert.deepEqual(calls[0].init.headers, { Authorization: `Bearer ${token}` });
  assert.equal(calls[0].init.body.get("file"), file);
  assert.deepEqual(logs, []);
});

test("XRD HTTP failures preserve the error contract without logging credentials", async (t) => {
  const { logs } = setup(t);
  t.mock.method(globalThis, "fetch", async () =>
    new Response("Synthetic rejected file", { status: 422 }),
  );
  await assert.rejects(
    quickAnalysisXrdFile(new File(["synthetic"], "rejected.xrd")),
    /Failed to upload and analyze XRD file: 422 - Synthetic rejected file/,
  );
  assert.deepEqual(logs, []);
});

test("XRD without credentials still refuses to send a request", async (t) => {
  const { logs, file } = setup(t, null);
  const fetch = t.mock.method(globalThis, "fetch", async () => {
    throw new Error("Request must not be sent");
  });
  await assert.rejects(quickAnalysisXrdFile(file), /Brak tokena w localStorage/);
  assert.equal(fetch.mock.callCount(), 0);
  assert.equal(logs.length, 1);
  assert.equal(logs[0].method, "error");
  assert.equal(logs[0].args[0], "Błąd autoryzacji:");
  assert.equal(logs[0].args[1].message, "Brak tokena w localStorage");
});
