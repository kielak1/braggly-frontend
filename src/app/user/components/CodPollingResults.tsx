// CodPollingResults.tsx

"use client";

import { useEffect, useState, useRef } from "react";
import { useCodSearch } from "@/context/CodContext";
import { useTranslations } from "@/context/TranslationsContext";
import CodAccordion from "./CodAccordion";

interface CodCifData {
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
export type { CodCifData };
interface CodQueryStatusResponse {
  alreadyQueried: boolean;
  queryRunning: boolean;
  completed: boolean;
  lastCompleted: string;
  progress: number;
}

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL;
const POLL_IDS_INTERVAL = 500;

const CodPollingResults = () => {
  const { formula, currentQuery, codId } = useCodSearch();
  const { translations } = useTranslations();

  const [codIds, setCodIds] = useState<Set<string>>(new Set());
  const [results, setResults] = useState<Map<string, CodCifData>>(new Map());
  const [expanded, setExpanded] = useState<string | null>(null);
  const [isFetchingCif, setIsFetchingCif] = useState(false);
  const [queryCompleted, setQueryCompleted] = useState(false);
  const [progress, setProgress] = useState<number>(0);
  const [rejectedIds, setRejectedIds] = useState<Set<string>>(new Set());
  const [isIdPollingComplete, setIsIdPollingComplete] = useState(false);
  const lastProcessed = useRef<Set<string>>(new Set());
  const fetchingCifs = useRef<Set<string>>(new Set());
  const shouldStopPollingIds = useRef<boolean>(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setCodIds(new Set());
    setResults(new Map());
    setExpanded(null);
    setQueryCompleted(false);
    setProgress(0);
    setRejectedIds(new Set());
    setIsIdPollingComplete(false);
    lastProcessed.current = new Set();
    fetchingCifs.current = new Set();
    shouldStopPollingIds.current = false;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, [currentQuery]);

  useEffect(() => {
    if (codId && !codIds.has(codId)) {
      console.log("Dodano bezpośredni COD ID:", codId);
      setCodIds((prev) => new Set([...Array.from(prev), codId]));
    }
  }, [codId, codIds]);

  useEffect(() => {
    if (!currentQuery) return;
    let stopped = false;
    const pollStatus = async () => {
      try {
        const resp = await fetch(`${API_BASE}/api/cod/search`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "text/plain",
          },
          body: currentQuery,
        });
        const data: CodQueryStatusResponse = await resp.json();
        setProgress(data.progress ?? 0);
        if (data.completed && data.alreadyQueried) {
          setQueryCompleted(true);
          return;
        }
        if (!stopped) setTimeout(pollStatus, 500);
      } catch (err) {
        console.error("Błąd w /api/cod/search:", err);
      }
    };
    pollStatus();
    return () => {
      stopped = true;
    };
  }, [currentQuery]);

  useEffect(() => {
    if (!formula) return;
    let stopped = false;

    const pollIds = async () => {
      if (shouldStopPollingIds.current) {
        console.log("Zatrzymano odpytywanie /api/cod/id");
        await new Promise((resolve) => setTimeout(resolve, 4000));
        setIsIdPollingComplete(true);
        return;
      }

      try {
        const ids: string[] = await fetch(
          `${API_BASE}/api/cod/id?formula=${encodeURIComponent(formula)}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        ).then((r) => r.json());

        console.log("Odebrano ID z /api/cod/id:", ids);
        setCodIds((prev) => new Set([...prev, ...ids]));

        if (queryCompleted) {
          shouldStopPollingIds.current = true;
          console.log(
            "Wykonano ostatnie zapytanie /api/cod/id przed zatrzymaniem"
          );
          return;
        }

        if (!stopped && !shouldStopPollingIds.current) {
          timeoutRef.current = setTimeout(pollIds, POLL_IDS_INTERVAL);
        }
      } catch (err) {
        console.error("Błąd w /api/cod/id:", err);
        if (!stopped && !shouldStopPollingIds.current) {
          timeoutRef.current = setTimeout(pollIds, POLL_IDS_INTERVAL);
        }
      }
    };

    pollIds();
    return () => {
      stopped = true;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [formula, queryCompleted]);

  useEffect(() => {
    if (codIds.size === 0 || isFetchingCif) return;
    console.log(
      "Rozpoczynam hook-a dla pobierania CIFs. Aktualne ID:",
      Array.from(codIds)
    );

    const idsToFetch = Array.from(codIds).filter(
      (id) =>
        !results.has(id) &&
        !rejectedIds.has(id) &&
        !lastProcessed.current.has(id) &&
        !fetchingCifs.current.has(id)
    );

    if (idsToFetch.length === 0) {
      if (!isFetchingCif) setIsFetchingCif(false);
      return;
    }

    if (!isFetchingCif) setIsFetchingCif(true);

    (async () => {
      for (const id of idsToFetch) {
        if (
          results.has(id) ||
          rejectedIds.has(id) ||
          fetchingCifs.current.has(id)
        ) {
          console.log(
            `Pomijam ${id}, już przetworzony lub w trakcie pobierania`
          );
          continue;
        }

        fetchingCifs.current.add(id);
        lastProcessed.current.add(id);

        try {
          const resp = await fetch(`${API_BASE}/api/cod/cif/${id}`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          });

          if (!resp.ok) {
            if (resp.status === 403) {
              console.warn(`Błąd HTTP 403 przy /api/cod/cif/${id}`);
              setRejectedIds((prev) => new Set([...prev, id]));
              continue;
            }
            throw new Error(`Błąd HTTP ${resp.status}`);
          }

          const cif = await resp.json();
          const full = { ...cif, codId: id };

          if (Array.isArray(cif.atoms)) {
            console.log(`[DEBUG] Atomy dla ${id}:`, cif.atoms);
          }

          setResults((prev) => {
            const updated = new Map(prev);
            updated.set(id, full);
            return updated;
          });

          await new Promise((res) => setTimeout(res, 500));
        } catch (err) {
          console.error(`Błąd w /api/cod/cif/${id}:`, err);
        } finally {
          fetchingCifs.current.delete(id);
        }
      }

      const remainingIdsToFetch = Array.from(codIds).filter(
        (id) =>
          !results.has(id) &&
          !rejectedIds.has(id) &&
          !lastProcessed.current.has(id) &&
          !fetchingCifs.current.has(id)
      );

      if (remainingIdsToFetch.length === 0) {
        setIsFetchingCif(false);
      } else {
        console.log(`Pozostały ID do przetworzenia: ${remainingIdsToFetch}`);
      }
    })();
  }, [codIds, isIdPollingComplete]);

  if (queryCompleted && results.size === 0 && formula && !isFetchingCif) {
    return (
      <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded text-red-800">
        ❗{" "}
        {translations?.["cod_polling_no_results"] ||
          "Nie znaleziono żadnych struktur w bazie COD dla podanej formuły."}
      </div>
    );
  }

  return (
    <div className="space-y-2 mt-4">
      {!queryCompleted && formula && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded text-blue-800 text-sm">
          ⏳ Trwa wyszukiwanie struktur...{" "}
          {progress > 0 && `Postęp: ${progress}%`}
        </div>
      )}

      {!isFetchingCif && rejectedIds.size > 0 && (
        <div className="p-3 bg-red-50 border border-red-200 rounded text-red-800 text-sm">
          <div className="flex items-center gap-2 font-semibold mb-1">
            <svg
              className="h-4 w-4 text-red-600"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" stroke="currentColor" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {translations?.["cod_polling_failed_title"] ||
              "Nie udało się pobrać danych dla następujących COD ID:"}
          </div>
          <ul className="list-disc list-inside ml-1">
            {Array.from(rejectedIds).map((id) => (
              <li key={id}>
                <code className="bg-red-100 px-1 rounded">{id}</code>
              </li>
            ))}
          </ul>
          <div className="mt-2">
            {translations?.["cod_polling_failed_hint"] ||
              "Upewnij się, że podane identyfikatory są poprawne i publicznie dostępne w bazie COD."}
          </div>
        </div>
      )}

      {isFetchingCif && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-yellow-800 text-sm flex items-center gap-2">
          <svg
            className="animate-spin h-4 w-4 text-yellow-600"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
            />
          </svg>
          {translations?.["cod_polling_loading_details"] ||
            "Pobieranie szczegółów struktur..."}
        </div>
      )}

      {[...results.values()]
        .sort((a, b) => Number(a.codId) - Number(b.codId))
        .map((res) => (
          <CodAccordion
            key={res.codId}
            data={res}
            expanded={expanded}
            onToggle={(id) => setExpanded((prev) => (prev === id ? null : id))}
          />
        ))}
    </div>
  );
};

export default CodPollingResults;
