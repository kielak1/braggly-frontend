import { test } from "node:test";
import assert from "node:assert/strict";
import {
  startCodSession,
  startSerialPolling,
  retryAfterTime,
} from "../src/app/lib/codPolling.ts";

const flush = async () => {
  for (let i = 0; i < 30; i++) await Promise.resolve();
};
const response = (data, status = 200, headers = {}) =>
  new Response(JSON.stringify(data), { status, headers });
const deferred = () => {
  let resolve;
  const promise = new Promise((r) => {
    resolve = r;
  });
  return { promise, resolve };
};

function setup(t, handler, overrides = {}) {
  t.mock.timers.enable({ apis: ["setTimeout", "Date"], now: 100000 });
  const calls = [];
  t.mock.method(globalThis, "fetch", async (url, init) => {
    calls.push({ url, init });
    return handler(url, init);
  });
  const states = [];
  const session = startCodSession({
    apiBase: "https://synthetic.example",
    query: "H O C",
    formula: "H2 O",
    codId: null,
    token: () => "synthetic-token",
    onChange: (state) => states.push(state),
    ...overrides,
  });
  t.after(() => session.stop());
  return { calls, states, session, latest: () => states.at(-1) };
}

test("COMPLETED stops status and ID polling after a final ID read", async (t) => {
  const s = setup(t, (url) =>
    response(
      url.includes("/search") ? { status: "COMPLETED", progress: 100 } : [],
    ),
  );
  await flush();
  assert.equal(s.latest().status, "COMPLETED");
  assert.equal(s.latest().idsComplete, true);
  assert.equal(s.calls.filter((c) => c.url.includes("/id?")).length, 1);
  t.mock.timers.tick(60000);
  await flush();
  assert.equal(s.calls.length, 2);
});

test("legacy completed response also stops polling", async (t) => {
  const s = setup(t, (url) =>
    response(
      url.includes("/search") ? { completed: true, alreadyQueried: true } : [],
    ),
  );
  await flush();
  t.mock.timers.tick(60000);
  await flush();
  assert.equal(s.latest().status, "COMPLETED");
  assert.equal(s.calls.length, 2);
});

test("FAILED stops polling and aborts an in-flight ID request", async (t) => {
  let count = 0;
  const ids = deferred();
  const s = setup(t, (url) =>
    url.includes("/search")
      ? response({ status: ++count === 1 ? "RUNNING" : "FAILED" })
      : ids.promise,
  );
  await flush();
  t.mock.timers.tick(500);
  await flush();
  assert.equal(s.latest().status, "FAILED");
  assert.equal(s.latest().fetchingCif, false);
  assert.equal(
    s.calls.find((c) => c.url.includes("/id?")).init.signal.aborted,
    true,
  );
  ids.resolve(response(["1"]));
  await flush();
  const calls = s.calls.length;
  t.mock.timers.tick(60000);
  await flush();
  assert.equal(s.calls.length, calls);
  assert.equal(s.latest().results.length, 0);
});

test("FAILED + retry=true offers manual retry; an explicit retry=false disables it", async (t) => {
  let retry = true;
  const s = setup(t, () => response({ status: "FAILED", retry }));
  await flush();
  assert.equal(s.latest().canRetry, true);
  s.session.stop();
  retry = false;
  const states = [];
  const other = startCodSession({
    apiBase: "",
    query: "C O H",
    formula: null,
    codId: null,
    token: () => null,
    onChange: (s) => states.push(s),
  });
  await flush();
  assert.equal(states.at(-1).canRetry, false);
  other.stop();
});

test("FAILED without retry field follows the existing backend retry query parameter contract", async (t) => {
  const s = setup(t, () => response({ status: "FAILED" }));
  await flush();
  assert.equal(s.latest().canRetry, true);
});

test("429 presents busy state and never loops automatically, even after Retry-After", async (t) => {
  const s = setup(t, () =>
    response({ status: "FAILED", message: "internal details" }, 429, {
      "Retry-After": "15",
    }),
  );
  await flush();
  assert.equal(s.latest().problem, "busy");
  assert.equal(s.latest().canRetry, true);
  assert.equal(s.latest().retryAt, 115000);
  t.mock.timers.tick(120000);
  await flush();
  assert.equal(s.calls.length, 1);
});

test("429 without Retry-After schedules no automatic request", async (t) => {
  const s = setup(t, () => response({}, 429));
  await flush();
  assert.equal(s.latest().retryAt, 0);
  t.mock.timers.tick(60000);
  await flush();
  assert.equal(s.calls.length, 1);
});

test("Retry-After supports seconds and HTTP dates; invalid headers have no invented delay", () => {
  assert.equal(retryAfterTime("10", 1000), 11000);
  assert.equal(
    retryAfterTime("Wed, 21 Oct 2015 07:28:00 GMT", 0),
    Date.parse("2015-10-21T07:28:00Z"),
  );
  assert.equal(retryAfterTime("nonsense", 1000), 0);
});

test("manual retry sends retry=true once, then uses ordinary polling", async (t) => {
  const s = setup(
    t,
    (url) => response(url.includes("/search") ? { status: "RUNNING" } : []),
    { retry: true },
  );
  await flush();
  t.mock.timers.tick(500);
  await flush();
  const searches = s.calls.filter((c) => c.url.includes("/search"));
  assert.equal(searches[0].url.endsWith("?retry=true"), true);
  assert.equal(searches[1].url.endsWith("/search"), true);
});

test("slow status and ID requests never overlap or fetch the same CIF twice", async (t) => {
  const status = deferred();
  const id = deferred();
  const cif = deferred();
  let searches = 0;
  const s = setup(t, (url) =>
    url.includes("/search")
      ? ++searches === 1
        ? status.promise
        : response({ status: "RUNNING" })
      : url.includes("/id?")
        ? id.promise.then(() => response(["1", "1"]))
        : cif.promise,
  );
  t.mock.timers.tick(20000);
  await flush();
  assert.equal(s.calls.length, 1);
  status.resolve(response({ status: "RUNNING" }));
  await flush();
  t.mock.timers.tick(10000);
  await flush();
  assert.equal(s.calls.filter((c) => c.url.includes("/id?")).length, 1);
  id.resolve(response(["1", "1"]));
  await flush();
  t.mock.timers.tick(500);
  await flush();
  assert.equal(s.calls.filter((c) => c.url.includes("/cif/")).length, 1);
  cif.resolve(response({ atoms: [] }));
  await flush();
  t.mock.timers.tick(500);
  await flush();
  assert.equal(s.calls.filter((c) => c.url.includes("/cif/")).length, 1);
});

test("completion during an ID request schedules one final non-overlapping ID read", async (t) => {
  let searches = 0;
  let idCalls = 0;
  const pending = deferred();
  const s = setup(t, (url) => {
    if (url.includes("/search"))
      return response({ status: ++searches === 1 ? "RUNNING" : "COMPLETED" });
    if (url.includes("/id?"))
      return ++idCalls === 1 ? pending.promise : response(["2"]);
    return response({ atoms: [] });
  });
  await flush();
  t.mock.timers.tick(500);
  await flush();
  assert.equal(idCalls, 1);
  assert.equal(s.latest().idsComplete, false);
  pending.resolve(response(["1"]));
  await flush();
  t.mock.timers.tick(1);
  await flush();
  assert.equal(idCalls, 2);
  assert.equal(s.latest().idsComplete, true);
  assert.deepEqual(
    s.latest().results.map((r) => r.codId),
    ["1", "2"],
  );
  t.mock.timers.tick(60000);
  await flush();
  assert.equal(idCalls, 2);
});

test("cleanup clears scheduled timers and suppresses late state updates", async (t) => {
  const s = setup(t, (url) =>
    response(url.includes("/search") ? { status: "RUNNING" } : []),
  );
  await flush();
  s.session.stop();
  const count = s.calls.length;
  const updates = s.states.length;
  t.mock.timers.tick(60000);
  await flush();
  assert.equal(s.calls.length, count);
  assert.equal(s.states.length, updates);
});

test("cleanup aborts CIF and prevents downloading subsequent IDs", async (t) => {
  const pending = deferred();
  const s = setup(t, () => pending.promise, {
    query: null,
    formula: null,
    codId: "1",
  });
  s.session.stop();
  assert.equal(s.calls[0].init.signal.aborted, true);
  const updates = s.states.length;
  pending.resolve(response({ atoms: [] }));
  await flush();
  assert.equal(s.states.length, updates);
});

test("CIF 429 can be retried manually after Retry-After, without refetching successes", async (t) => {
  let rejected = true;
  const s = setup(t, (url) => {
    if (url.includes("/search")) return response({ status: "COMPLETED" });
    if (url.includes("/id?")) return response(["1", "2", "3"]);
    if (url.endsWith("/2") && rejected)
      return response({}, 429, { "Retry-After": "10" });
    return response({ atoms: [] });
  });
  await flush();
  assert.equal(s.latest().cifProblem, "busy");
  assert.equal(s.latest().fetchingCif, false);
  s.session.retryCifs();
  await flush();
  assert.equal(s.calls.filter((c) => c.url.endsWith("/2")).length, 1);
  t.mock.timers.tick(10000);
  await flush();
  assert.equal(s.calls.filter((c) => c.url.endsWith("/2")).length, 1);
  rejected = false;
  s.session.retryCifs();
  s.session.retryCifs();
  await flush();
  assert.equal(s.calls.filter((c) => c.url.endsWith("/1")).length, 1);
  assert.equal(s.calls.filter((c) => c.url.endsWith("/2")).length, 2);
  assert.equal(s.calls.filter((c) => c.url.endsWith("/3")).length, 1);
  assert.equal(s.latest().results.length, 3);
});

test("401, 403, invalid status and network errors stop rather than polling forever", async (t) => {
  const s = setup(t, () => response({}, 401));
  await flush();
  assert.equal(s.latest().problem, "auth");
  assert.equal(s.latest().canRetry, false);
  t.mock.timers.tick(60000);
  await flush();
  assert.equal(s.calls.length, 1);
});

test("active-import list polling is serial and its cleanup cancels timers and requests", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const pending = deferred();
  let calls = 0;
  let signal;
  const stop = startSerialPolling(async (s) => {
    signal = s;
    calls++;
    await pending.promise;
    return true;
  });
  t.mock.timers.tick(20000);
  await flush();
  assert.equal(calls, 1);
  pending.resolve();
  await flush();
  stop();
  assert.equal(signal.aborted, true);
  t.mock.timers.tick(60000);
  await flush();
  assert.equal(calls, 1);
});

for (const [label, status, body] of [
  ["403", 403, {}],
  ["invalid status", 200, { status: "UNKNOWN" }],
  ["network error", null, null],
]) {
  test(`${label} terminates the search without an automatic retry loop`, async (t) => {
    const s = setup(t, () => {
      if (status === null) throw new Error("synthetic network error");
      return response(body, status);
    });
    await flush();
    assert.equal(s.latest().status, "FAILED");
    t.mock.timers.tick(60000);
    await flush();
    assert.equal(s.calls.length, 1);
  });
}

test("ID HTTP errors stop both ID and status polling", async (t) => {
  const s = setup(t, (url) =>
    response(
      url.includes("/search") ? { status: "RUNNING" } : {},
      url.includes("/search") ? 200 : 403,
    ),
  );
  await flush();
  assert.equal(s.latest().problem, "auth");
  t.mock.timers.tick(60000);
  await flush();
  assert.equal(s.calls.length, 2);
});

test("CIF auth errors stop polling and leave no loading indicator", async (t) => {
  const s = setup(t, (url) => {
    if (url.includes("/search")) return response({ status: "RUNNING" });
    if (url.includes("/id?")) return response(["1", "2"]);
    return response({}, 403);
  });
  await flush();
  assert.equal(s.latest().problem, "auth");
  assert.equal(s.latest().fetchingCif, false);
  t.mock.timers.tick(60000);
  await flush();
  assert.equal(s.calls.length, 3);
});

test("cleanup aborts a request whose response body is still pending", async (t) => {
  const pending = deferred();
  const s = setup(t, () => ({ ok: true, json: () => pending.promise }));
  await flush();
  s.session.stop();
  assert.equal(s.calls[0].init.signal.aborted, true);
  const updates = s.states.length;
  pending.resolve({ status: "RUNNING" });
  await flush();
  assert.equal(s.states.length, updates);
});

test("manual CIF retry preserves warnings for permanently rejected IDs", async (t) => {
  let busy = true;
  const s = setup(t, (url) => {
    if (url.includes("/search")) return response({ status: "COMPLETED" });
    if (url.includes("/id?")) return response(["1", "2"]);
    if (url.endsWith("/1")) return response({}, 413);
    return busy ? response({}, 429) : response({ atoms: [] });
  });
  await flush();
  busy = false;
  s.session.retryCifs();
  await flush();
  assert.deepEqual(s.latest().rejectedIds, ["1"]);
  assert.equal(s.latest().cifProblem, "cif");
  assert.equal(s.calls.filter((c) => c.url.endsWith("/1")).length, 1);
});
