"use client";

import { useEffect, useState, useRef } from "react";
import { useCodSearch } from "@/context/CodContext";
import { useTranslations } from "@/context/TranslationsContext";
import { emptyCodSnapshot, startCodSession } from "@/lib/codPolling";
import type { CodCifData, CodProblem } from "@/lib/codPolling";
import CodAccordion from "./CodAccordion";

export type { CodCifData };
const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? "";

const fallbackMessages: Record<CodProblem, string> = {
  failed: "Import nie powiódł się.",
  busy: "Serwer jest zajęty i osiągnął limit równoległych operacji. Spróbuj ponownie później.",
  auth: "Nie można uzyskać dostępu do danych. Zaloguj się ponownie lub sprawdź uprawnienia.",
  request: "Nie udało się pobrać danych. Spróbuj ponownie później.",
  cif: "Nie udało się pobrać części struktur.",
};

function Results({
  query,
  formula,
  codId,
}: {
  query: string | null;
  formula: string | null;
  codId: string | null;
}) {
  const { translations } = useTranslations();
  const [state, setState] = useState(emptyCodSnapshot);
  const [attempt, setAttempt] = useState(0);
  const [now, setNow] = useState(Date.now);
  const [expanded, setExpanded] = useState<string | null>(null);
  const session = useRef<ReturnType<typeof startCodSession> | null>(null);
  const retryRequested = useRef(false);

  useEffect(() => {
    retryRequested.current = false;
    setState(emptyCodSnapshot());
    const current = startCodSession({
      apiBase: API_BASE,
      query,
      formula,
      codId,
      retry: attempt > 0,
      token: () => localStorage.getItem("token"),
      onChange: setState,
    });
    session.current = current;
    return () => {
      current.stop();
      session.current = null;
    };
  }, [query, formula, codId, attempt]);

  const retryAt = Math.max(state.retryAt, state.cifRetryAt);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const refresh = () => {
      setNow(Date.now());
      if (retryAt > Date.now()) {
        // Only enable the button; never send an automatic retry request.
        timer = setTimeout(refresh, Math.min(retryAt - Date.now(), 2147483647));
      }
    };
    refresh();
    return () => clearTimeout(timer);
  }, [retryAt]);

  const message = (problem: CodProblem) =>
    translations?.[`cod_request_${problem}`] || fallbackMessages[problem];
  const retryLabel = translations?.["cod_retry_button"] || "Spróbuj ponownie";
  const retryWait =
    translations?.["cod_retry_wait"] ||
    "Serwer zaleca odczekanie przed ponowieniem.";
  const waiting = Boolean(
    query && (state.status === "PENDING" || state.status === "RUNNING"),
  );
  const noResults =
    state.status === "COMPLETED" &&
    state.idsComplete &&
    !state.fetchingCif &&
    !state.results.length &&
    !state.rejectedIds.length;

  return (
    <div className="space-y-2 mt-4">
      {state.problem && (
        <div
          role="alert"
          className="p-3 bg-yellow-50 border border-yellow-200 rounded text-yellow-900 text-sm"
        >
          <p>{message(state.problem)}</p>
          {state.canRetry && query && (
            <button
              type="button"
              className="mt-2 underline disabled:opacity-50"
              disabled={now < state.retryAt}
              onClick={() => {
                if (retryRequested.current || Date.now() < state.retryAt)
                  return;
                retryRequested.current = true;
                setAttempt((previous) => previous + 1);
              }}
            >
              {retryLabel}
            </button>
          )}
          {state.canRetry && now < state.retryAt && <p>{retryWait}</p>}
        </div>
      )}
      {waiting && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded text-blue-800 text-sm">
          {translations?.["cod_polling_searching"] ||
            "Trwa wyszukiwanie struktur..."}{" "}
          {state.progress > 0 &&
            (
              translations?.["cod_polling_progress"] || "Postęp: {progress}%"
            ).replace("{progress}", String(state.progress))}
        </div>
      )}
      {noResults && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded text-red-800">
          {translations?.["cod_polling_no_results"] ||
            "Nie znaleziono żadnych struktur w bazie COD dla podanej formuły."}
        </div>
      )}
      {state.cifProblem && !state.problem && (
        <div
          role="alert"
          className="p-3 bg-yellow-50 border border-yellow-200 rounded text-yellow-900 text-sm"
        >
          <p>{message(state.cifProblem)}</p>
          <ul>
            {state.rejectedIds.map((id) => (
              <li key={id}>
                <code>{id}</code>
              </li>
            ))}
          </ul>
          {state.canRetryCif && !state.problem && (
            <button
              type="button"
              className="mt-2 underline disabled:opacity-50"
              disabled={now < state.cifRetryAt || state.fetchingCif}
              onClick={() => session.current?.retryCifs()}
            >
              {retryLabel}
            </button>
          )}
          {state.canRetryCif && now < state.cifRetryAt && <p>{retryWait}</p>}
        </div>
      )}
      {state.fetchingCif && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-yellow-800 text-sm">
          {translations?.["cod_polling_loading_details"] ||
            "Pobieranie szczegółów struktur..."}
        </div>
      )}
      {[...state.results]
        .sort((a, b) => Number(a.codId) - Number(b.codId))
        .map((result) => (
          <CodAccordion
            key={result.codId}
            data={result}
            expanded={expanded}
            onToggle={(id) =>
              setExpanded((previous) => (previous === id ? null : id))
            }
          />
        ))}
    </div>
  );
}

export default function CodPollingResults() {
  const { formula, currentQuery, codId } = useCodSearch();
  return (
    <Results
      key={JSON.stringify([currentQuery, formula, codId])}
      query={currentQuery}
      formula={formula}
      codId={codId}
    />
  );
}
