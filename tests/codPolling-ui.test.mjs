import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import Module from "node:module";
import path from "node:path";
import fs from "node:fs";

// Mount the actual components with React; replace only translations and the 3D viewer.
const require = createRequire(import.meta.url);
const ts = require("typescript");
const root = path.resolve(import.meta.dirname, "..");
const originalResolve = Module._resolveFilename;
Module._resolveFilename = function (id, ...args) {
  if (id.startsWith("@/lib/")) id = path.join(root, "src/app/lib", id.slice(6));
  else if (id.startsWith("@/context/"))
    id = path.join(root, "src/context", id.slice(10));
  return originalResolve.call(this, id, ...args);
};
for (const extension of [".ts", ".tsx"]) {
  Module._extensions[extension] = (module, filename) => {
    const source = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        jsx: ts.JsxEmit.ReactJSX,
        target: ts.ScriptTarget.ES2020,
        esModuleInterop: true,
      },
    }).outputText;
    module._compile(source, filename);
  };
}
const React = require("react");
const { create, act } = require("react-test-renderer");
const accordion = require.resolve(
  "../src/app/user/components/CodAccordion.tsx",
);
require.cache[accordion] = {
  id: accordion,
  filename: accordion,
  loaded: true,
  exports: { __esModule: true, default: () => null },
};
const translations = require.resolve("../src/context/TranslationsContext.tsx");
require.cache[translations] = {
  id: translations,
  filename: translations,
  loaded: true,
  exports: { useTranslations: () => ({ translations: null }) },
};
const CodPollingResults =
  require("../src/app/user/components/CodPollingResults.tsx").default;
const CodImportStatusList =
  require("../src/app/user/components/CodImportStatusList.tsx").default;
const { CodProvider, useCodSearch } = require("../src/context/CodContext.tsx");
const flush = async () => {
  for (let i = 0; i < 30; i++) await Promise.resolve();
};
const response = (data, status = 200, headers = {}) =>
  new Response(JSON.stringify(data), { status, headers });
const text = (node) =>
  typeof node === "string" ? node : (node?.children ?? []).map(text).join(" ");

async function mount(t, handler, component = CodPollingResults) {
  t.mock.timers.enable({ apis: ["setTimeout", "Date"], now: 100000 });
  const originalStorage = Object.getOwnPropertyDescriptor(
    globalThis,
    "localStorage",
  );
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: { getItem: () => "synthetic-token" },
  });
  t.after(() => {
    if (originalStorage)
      Object.defineProperty(globalThis, "localStorage", originalStorage);
    else delete globalThis.localStorage;
  });
  const calls = [];
  t.mock.method(globalThis, "fetch", async (url, init) => {
    calls.push({ url, init });
    return handler(url, init);
  });
  let controls;
  let renderer;
  function Controls() {
    controls = useCodSearch();
    return null;
  }
  await act(async () => {
    renderer = create(
      React.createElement(
        CodProvider,
        null,
        React.createElement(Controls),
        React.createElement(component),
      ),
    );
    await flush();
  });
  await act(async () => {
    controls.setCurrentQuery("H O C");
    controls.setFormula("H2 O");
    await flush();
  });
  t.after(async () => {
    await act(async () => {
      renderer.unmount();
      await flush();
    });
  });
  return { renderer, calls, controls };
}

test("FAILED + retry=true stops loading and offers a manual retry button", async (t) => {
  let retried = false;
  const s = await mount(t, (url) => {
    if (url.includes("retry=true")) retried = true;
    return response(
      url.includes("/search")
        ? { status: retried ? "COMPLETED" : "FAILED", retry: true }
        : [],
    );
  });
  assert.match(text(s.renderer.toJSON()), /Import nie powiódł/);
  assert.doesNotMatch(text(s.renderer.toJSON()), /Trwa wyszukiwanie/);
  const button = s.renderer.root.findByType("button");
  await act(async () => {
    button.props.onClick();
    button.props.onClick();
    await flush();
  });
  assert.equal(s.calls.filter((c) => c.url.includes("retry=true")).length, 1);
  assert.doesNotMatch(
    text(s.renderer.toJSON()),
    /Import nie powiódł|Trwa wyszukiwanie/,
  );
});

test("FAILED + retry=false exposes no retry button or loading indicator", async (t) => {
  const s = await mount(t, () => response({ status: "FAILED", retry: false }));
  assert.equal(s.renderer.root.findAllByType("button").length, 0);
  assert.doesNotMatch(text(s.renderer.toJSON()), /Trwa wyszukiwanie/);
});

test("HTTP 429 shows a controlled message, honors Retry-After and never automatically retries", async (t) => {
  const s = await mount(t, () =>
    response({ message: "PRIVATE STACK TRACE" }, 429, { "Retry-After": "10" }),
  );
  assert.match(text(s.renderer.toJSON()), /Serwer jest zajęty/);
  assert.doesNotMatch(
    text(s.renderer.toJSON()),
    /PRIVATE STACK TRACE|Trwa wyszukiwanie/,
  );
  assert.equal(s.renderer.root.findByType("button").props.disabled, true);
  const before = s.calls.length;
  await act(async () => {
    t.mock.timers.tick(10000);
    await flush();
  });
  assert.equal(s.renderer.root.findByType("button").props.disabled, false);
  assert.equal(s.calls.length, before);
  await act(async () => {
    s.renderer.root.findByType("button").props.onClick();
    await flush();
  });
  assert.equal(s.calls.filter((c) => c.url.includes("retry=true")).length, 1);
});

test("COMPLETED ends loading and repeated renders do not duplicate ID/CIF reads", async (t) => {
  const s = await mount(t, (url) =>
    response(
      url.includes("/search")
        ? { status: "COMPLETED" }
        : url.includes("/id?")
          ? ["1", "1"]
          : { atoms: [] },
    ),
  );
  assert.doesNotMatch(
    text(s.renderer.toJSON()),
    /Trwa wyszukiwanie|Pobieranie szczegółów/,
  );
  await act(async () => {
    t.mock.timers.tick(30000);
    await flush();
  });
  assert.equal(s.calls.filter((c) => c.url.includes("/id?")).length, 1);
  assert.equal(s.calls.filter((c) => c.url.includes("/cif/")).length, 1);
});

test("unmount clears polling and cooldown timers and aborts pending requests", async (t) => {
  let resolve;
  const pending = new Promise((r) => {
    resolve = r;
  });
  const s = await mount(t, (url) =>
    url.includes("/id?") ? pending : response({ status: "RUNNING" }),
  );
  const before = s.calls.length;
  await act(async () => {
    s.renderer.unmount();
    await flush();
  });
  assert.equal(
    s.calls.find((c) => c.url.includes("/id?")).init.signal.aborted,
    true,
  );
  await act(async () => {
    resolve(response(["1"]));
    t.mock.timers.tick(30000);
    await flush();
  });
  assert.equal(s.calls.length, before);
});

test("unmount while Retry-After is pending performs no further request or update", async (t) => {
  const s = await mount(t, () => response({}, 429, { "Retry-After": "20" }));
  const before = s.calls.length;
  await act(async () => {
    s.renderer.unmount();
    await flush();
  });
  await act(async () => {
    t.mock.timers.tick(60000);
    await flush();
  });
  assert.equal(s.calls.length, before);
});

test("changing the query aborts the previous request and ignores its late response", async (t) => {
  let resolve;
  const pending = new Promise((r) => {
    resolve = r;
  });
  const s = await mount(t, (_url, init) =>
    init.body === "H O C"
      ? pending
      : response({ status: "FAILED", retry: true }),
  );
  const old = s.calls[0];
  await act(async () => {
    s.controls.setCurrentQuery("Na C O");
    await flush();
  });
  assert.equal(old.init.signal.aborted, true);
  await act(async () => {
    resolve(response({ status: "RUNNING" }));
    await flush();
  });
  assert.match(text(s.renderer.toJSON()), /Import nie powiódł/);
  assert.doesNotMatch(text(s.renderer.toJSON()), /Trwa wyszukiwanie/);
});

test("active-import list aborts stale requests on formula changes and on unmount", async (t) => {
  const s = await mount(t, () => response([]), CodImportStatusList);
  const before = s.calls.length;
  await act(async () => {
    s.renderer.unmount();
    await flush();
  });
  await act(async () => {
    t.mock.timers.tick(60000);
    await flush();
  });
  assert.equal(s.calls.length, before);
  assert.equal(
    s.calls.every((c) => c.init.signal.aborted),
    true,
  );
});
