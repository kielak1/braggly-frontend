export type CodState = "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";
export type CodProblem = "failed" | "busy" | "auth" | "request" | "cif";
export interface CodCifData {
  codId: string;
  formula: string;
  name: string;
  year: string;
  author: string;
  spaceGroup: string;
  a: string;
  b: string;
  c: string;
  volume: string;
  atoms?: {
    element: string;
    x: string;
    y: string;
    z: string;
    label?: string;
  }[];
}
export interface CodSnapshot {
  status: CodState | null;
  progress: number;
  problem: CodProblem | null;
  canRetry: boolean;
  retryAt: number;
  idsComplete: boolean;
  fetchingCif: boolean;
  results: CodCifData[];
  rejectedIds: string[];
  cifProblem: CodProblem | null;
  canRetryCif: boolean;
  cifRetryAt: number;
}

export function retryAfterTime(value: string | null, now = Date.now()): number {
  if (!value) return 0;
  const seconds = /^\d+$/.test(value.trim()) ? Number(value) : NaN;
  const date = Number.isFinite(seconds)
    ? now + seconds * 1000
    : Date.parse(value);
  return Number.isFinite(date) ? Math.max(now, date) : 0;
}

// One request at a time. Cleanup cancels both the scheduled tick and the request.
export function startSerialPolling(
  request: (signal: AbortSignal) => Promise<boolean>,
  interval = 2500,
) {
  let stopped = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const controller = new AbortController();
  const tick = async () => {
    if (stopped) return;
    try {
      if (await request(controller.signal)) {
        if (!stopped) timer = setTimeout(tick, interval);
      }
    } catch {
      // An unsuccessful request stops this poller; callers present their own error.
    }
  };
  void tick();
  return () => {
    stopped = true;
    clearTimeout(timer);
    controller.abort();
  };
}

export const emptyCodSnapshot = (): CodSnapshot => ({
  status: null,
  progress: 0,
  problem: null,
  canRetry: false,
  retryAt: 0,
  idsComplete: false,
  fetchingCif: false,
  results: [],
  rejectedIds: [],
  cifProblem: null,
  canRetryCif: false,
  cifRetryAt: 0,
});

interface Options {
  apiBase: string;
  query: string | null;
  formula: string | null;
  codId: string | null;
  retry?: boolean;
  token: () => string | null;
  onChange: (state: CodSnapshot) => void;
}

// Owns the lifetime of one search. No automatic retries after a terminal error.
export function startCodSession(options: Options) {
  let disposed = false;
  let halted = false;
  let state = emptyCodSnapshot();
  let statusTimer: ReturnType<typeof setTimeout> | undefined;
  let idTimer: ReturnType<typeof setTimeout> | undefined;
  let statusStarted = false;
  let idsStarted = false;
  let idInFlight = false;
  let cifInFlight = false;
  let cifPaused = false;
  const controllers = new Set<AbortController>();
  const ids = new Set<string>();
  const processed = new Set<string>();
  const results = new Map<string, CodCifData>();
  const rejected = new Map<string, { retry: boolean; at: number }>();

  const emit = (patch: Partial<CodSnapshot>) => {
    if (disposed) return;
    state = { ...state, ...patch };
    options.onChange(state);
  };
  const abortRequests = () => {
    clearTimeout(statusTimer);
    clearTimeout(idTimer);
    controllers.forEach((controller) => controller.abort());
  };
  const fail = (problem: CodProblem, canRetry: boolean, retryAt = 0) => {
    halted = true;
    abortRequests();
    emit({
      status: "FAILED",
      problem,
      canRetry,
      retryAt,
      fetchingCif: false,
      idsComplete: true,
    });
  };
  const request = async (path: string, init: RequestInit = {}) => {
    const controller = new AbortController();
    controllers.add(controller);
    try {
      const response = await fetch(`${options.apiBase}/api/cod/${path}`, {
        ...init,
        headers: {
          Authorization: `Bearer ${options.token() ?? ""}`,
          ...init.headers,
        },
        signal: controller.signal,
      });
      // Keep the controller until the response body has also been consumed.
      const data: unknown = response.ok ? await response.json() : null;
      return { response, data };
    } finally {
      controllers.delete(controller);
    }
  };
  const httpFailure = (response: Response) => {
    if (response.status === 429)
      fail("busy", true, retryAfterTime(response.headers.get("Retry-After")));
    else if (response.status === 401 || response.status === 403)
      fail("auth", false);
    else fail("request", response.status >= 500);
  };

  const fetchCifs = async () => {
    if (disposed || halted || cifInFlight || cifPaused) return;
    const pending = [...ids].filter((id) => !processed.has(id));
    if (!pending.length) return;
    cifInFlight = true;
    emit({ fetchingCif: true });
    try {
      // IDs may arrive while polling is active. Each ID is fetched once per attempt.
      for (const id of ids) {
        if (disposed || halted || cifPaused) break;
        if (processed.has(id)) continue;
        processed.add(id);
        try {
          const { response, data } = await request(
            `cif/${encodeURIComponent(id)}`,
          );
          if (disposed || halted) return;
          if (!response.ok) {
            const busy = response.status === 429;
            const auth = response.status === 401 || response.status === 403;
            const retry = busy || response.status >= 500;
            const at = busy
              ? retryAfterTime(response.headers.get("Retry-After"))
              : 0;
            rejected.set(id, { retry, at });
            cifPaused = busy || auth;
            emit({
              rejectedIds: [...rejected.keys()],
              cifProblem: busy ? "busy" : auth ? "auth" : "cif",
              canRetryCif:
                !auth && [...rejected.values()].some((item) => item.retry),
              cifRetryAt: at,
            });
            if (auth) {
              fail("auth", false);
              return;
            }
            continue;
          }
          if (!data || typeof data !== "object" || Array.isArray(data))
            throw new Error("Invalid CIF response");
          results.set(id, { ...data, codId: id } as CodCifData);
          rejected.delete(id);
          emit({
            results: [...results.values()],
            rejectedIds: [...rejected.keys()],
          });
        } catch {
          if (disposed || halted) return;
          rejected.set(id, { retry: true, at: 0 });
          emit({
            rejectedIds: [...rejected.keys()],
            cifProblem: "cif",
            canRetryCif: true,
          });
        }
      }
    } finally {
      cifInFlight = false;
      if (!halted) emit({ fetchingCif: false });
    }
  };

  const pollIds = async () => {
    if (
      disposed ||
      halted ||
      idInFlight ||
      !options.formula ||
      state.idsComplete
    )
      return;
    idsStarted = true;
    idInFlight = true;
    const finalRead = state.status === "COMPLETED";
    try {
      const { response, data } = await request(
        `id?formula=${encodeURIComponent(options.formula)}`,
      );
      if (disposed || halted) return;
      if (!response.ok) {
        httpFailure(response);
        return;
      }
      if (!Array.isArray(data) || !data.every((id) => typeof id === "string"))
        throw new Error("Invalid IDs");
      data.forEach((id) => ids.add(id));
      void fetchCifs();
      if ((state.status === "COMPLETED" && finalRead) || !options.query)
        emit({ idsComplete: true });
      else
        idTimer = setTimeout(pollIds, state.status === "COMPLETED" ? 0 : 500);
    } catch {
      if (!disposed && !halted) fail("request", true);
    } finally {
      idInFlight = false;
    }
  };

  const pollStatus = async () => {
    if (disposed || halted || !options.query) return;
    const retry = options.retry && !statusStarted;
    statusStarted = true;
    try {
      const { response, data } = await request(
        `search${retry ? "?retry=true" : ""}`,
        {
          method: "POST",
          headers: { "Content-Type": "text/plain" },
          body: options.query,
        },
      );
      if (disposed || halted) return;
      if (!response.ok) {
        httpFailure(response);
        return;
      }
      if (!data || typeof data !== "object") throw new Error("Invalid status");
      const status = data as {
        status?: CodState;
        completed?: boolean;
        progress?: number;
        retry?: boolean;
      };
      if (status.status === "FAILED") {
        // The current backend exposes retry as a request parameter, not a response field.
        fail("failed", status.retry !== false);
        return;
      }
      if (
        status.status &&
        !["PENDING", "RUNNING", "COMPLETED"].includes(status.status)
      )
        throw new Error("Invalid status");
      if (!status.status && typeof status.completed !== "boolean")
        throw new Error("Invalid status");
      const completed =
        status.status === "COMPLETED" ||
        (!status.status && status.completed === true);
      emit({
        status: completed ? "COMPLETED" : (status.status ?? "RUNNING"),
        progress: status.progress ?? 0,
      });
      if (!options.formula) emit({ idsComplete: true });
      else if (completed) {
        clearTimeout(idTimer);
        // Finish any ongoing read, then read once after completion; never overlap.
        void pollIds();
      } else if (!idsStarted) void pollIds();
      if (!completed) statusTimer = setTimeout(pollStatus, 500);
    } catch {
      if (!disposed && !halted) fail("request", true);
    }
  };

  emit({
    status: options.query ? "PENDING" : null,
    idsComplete: !options.formula,
  });
  if (options.codId) {
    ids.add(options.codId);
    void fetchCifs();
  }
  if (options.query) void pollStatus();
  else if (options.formula) void pollIds();

  return {
    stop() {
      disposed = true;
      abortRequests();
    },
    retryCifs() {
      if (
        disposed ||
        halted ||
        cifInFlight ||
        !state.canRetryCif ||
        Date.now() < state.cifRetryAt
      )
        return;
      for (const [id, error] of rejected) {
        if (error.retry && Date.now() >= error.at) {
          rejected.delete(id);
          processed.delete(id);
        }
      }
      cifPaused = false;
      emit({
        rejectedIds: [...rejected.keys()],
        cifProblem: rejected.size ? "cif" : null,
        canRetryCif: false,
        cifRetryAt: 0,
      });
      void fetchCifs();
    },
  };
}
