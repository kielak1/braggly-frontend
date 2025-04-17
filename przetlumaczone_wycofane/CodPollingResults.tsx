"use client";

import { useEffect, useState, useRef } from "react";
import { useCodSearch } from "@/context/CodContext";
import { useTranslations } from "@/context/TranslationsContext";

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL;
const POLL_IDS_INTERVAL = process.env.NODE_ENV === "development" ? 2000 : 500;

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
}

interface CodQueryStatusResponse {
  alreadyQueried: boolean;
  queryRunning: boolean;
  completed: boolean;
  lastCompleted: string;
  progress: number;
}

const CodAccordion = ({
  data,
  expanded,
  onToggle,
}: {
  data: CodCifData;
  expanded: string | null;
  onToggle: (id: string) => void;
}) => {
  const { translations } = useTranslations();

  return (
    <div key={data.codId} className="border rounded overflow-hidden">
      <button
        onClick={() => onToggle(data.codId)}
        className="w-full text-left px-4 py-2 bg-gray-100 font-semibold"
      >
        COD ID: {data.codId} {data.name ? `– ${data.name}` : " – ?"}
      </button>

      {expanded === data.codId && (
        <div className="grid grid-cols-2 gap-4 p-4 text-sm bg-white">
          <div>
            <strong>{translations?.["cod_polling_formula"] || "Wzór"}:</strong>{" "}
            {data.formula}
          </div>
          <div>
            <strong>{translations?.["cod_polling_space_group"] || "Grupa przestrzenna"}:</strong>{" "}
            {data.spaceGroup}
          </div>
          <div>
            <strong>{translations?.["cod_polling_author"] || "Autor"}:</strong>{" "}
            {data.author}
          </div>
          <div>
            <strong>{translations?.["cod_polling_year"] || "Rok"}:</strong>{" "}
            {data.year}
          </div>
          <div>
            <strong>a:</strong> {data.a}
          </div>
          <div>
            <strong>b:</strong> {data.b}
          </div>
          <div>
            <strong>c:</strong> {data.c}
          </div>
          <div>
            <strong>{translations?.["cod_polling_volume"] || "Objętość"}:</strong>{" "}
            {data.volume}
          </div>
        </div>
      )}
    </div>
  );
};

const CodPollingResults = () => {
  const { translations } = useTranslations();
  const { formula, currentQuery, codId } = useCodSearch();

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
        if (!stopped) setTimeout(pollStatus, 1000);
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

        setCodIds((prev) => new Set([...prev, ...ids]));

        if (queryCompleted) {
          shouldStopPollingIds.current = true;
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

  // CIF fetch effect — bez zmian (pozostaje jak wcześniej)

  if (queryCompleted && results.size === 0 && formula && !isFetchingCif) {
    return (
      <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded text-red-800">
        ❗ {translations?.["cod_polling_no_results"] || "Nie znaleziono żadnych struktur w bazie COD dla podanej formuły."}
      </div>
    );
  }

  return (
    <div className="space-y-2 mt-4">
      {!queryCompleted && formula && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded text-blue-800 text-sm">
          ⏳ {translations?.["cod_polling_searching"] || "Trwa wyszukiwanie struktur..."}{" "}
          {progress > 0 &&
            `${translations?.["cod_polling_progress"]?.replace("{progress}", progress.toString()) ||
              `Postęp: ${progress}%`}`}
        </div>
      )}

      {!isFetchingCif && rejectedIds.size > 0 && (
        <div className="p-3 bg-red-50 border border-red-200 rounded text-red-800 text-sm">
          <div className="flex items-center gap-2 font-semibold mb-1">
            <svg className="h-4 w-4 text-red-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" stroke="currentColor" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {translations?.["cod_polling_failed_title"] || "Nie udało się pobrać danych dla następujących COD ID:"}
          </div>
          <ul className="list-disc list-inside ml-1">
            {Array.from(rejectedIds).map((id) => (
              <li key={id}>
                <code className="bg-red-100 px-1 rounded">{id}</code>
              </li>
            ))}
          </ul>
          <div className="mt-2">
            {translations?.["cod_polling_failed_hint"] || "Upewnij się, że podane identyfikatory są poprawne i publicznie dostępne w bazie COD."}
          </div>
        </div>
      )}

      {isFetchingCif && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-yellow-800 text-sm flex items-center gap-2">
          <svg className="animate-spin h-4 w-4 text-yellow-600" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
          {translations?.["cod_polling_loading_details"] || "Pobieranie szczegółów struktur..."}
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
