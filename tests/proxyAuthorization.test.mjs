import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const { NextRequest } = require("next/server");
const source = fs.readFileSync(new URL("../src/proxy.ts", import.meta.url), "utf8");

async function request(path, { role, token = role, balance = 10, free = true, valid = true } = {}) {
  const sandboxModule = { exports: {} };
  const api = {
    fetchBoolParameterByName: async () => free,
    isParameterEnabled: Boolean,
    fetchRestrictedPaths: async () => ["/user/uploads"],
    isRestrictedPath: (pathname, paths) => paths.includes(pathname),
  };
  const code = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const context = vm.createContext({
    module: sandboxModule, exports: sandboxModule.exports, URL,
    require: (name) => name === "@/utils/api" ? api : require(name),
    process: { env: { NEXT_PUBLIC_BACKEND_URL: "http://synthetic.invalid" } },
    console: { log() {} },
    fetch: async () => ({ ok: valid, json: async () => ({ role, balance }) }),
  });
  vm.runInContext(code, context);
  const response = await sandboxModule.exports.proxy(new NextRequest(`http://localhost${path}`, {
    headers: token ? { cookie: `token=synthetic-${token}` } : {},
  }));
  return { status: response.status, location: response.headers.get("location"), response };
}

test("proxy denies anonymous USER and ADMIN pages", async () => {
  for (const path of ["/user/cod_dashboard", "/admin"]) {
    const r = await request(path);
    assert.equal(r.status, 307);
    assert.equal(new URL(r.location).pathname, "/");
  }
});

test("proxy keeps the home page public", async () => {
  assert.equal((await request("/")).status, 200);
});

test("proxy permits USER dashboard and forwards role cookies", async () => {
  const r = await request("/user/cod_dashboard", { role: "USER" });
  assert.equal(r.status, 200);
  assert.equal(r.response.cookies.get("Role").value, "USER");
});

test("proxy denies USER access to ADMIN pages", async () => {
  const r = await request("/admin/users", { role: "USER" });
  assert.equal(r.status, 307);
  assert.equal(new URL(r.location).pathname, "/user");
});

test("proxy permits ADMIN pages", async () => {
  assert.equal((await request("/admin/users", { role: "ADMIN" })).status, 200);
});

test("proxy rejects invalid backend authentication", async () => {
  const r = await request("/user", { token: "invalid", valid: false });
  assert.equal(r.status, 307);
  assert.equal(new URL(r.location).pathname, "/");
});

test("proxy preserves the paid-path restriction for a USER without credits", async () => {
  const r = await request("/user/uploads", { role: "USER", balance: 0, free: false });
  assert.equal(r.status, 307);
  assert.equal(new URL(r.location).pathname, "/user/account");
});

test("proxy permits the same paid path when free access is enabled", async () => {
  assert.equal((await request("/user/uploads", { role: "USER", balance: 0 })).status, 200);
});
