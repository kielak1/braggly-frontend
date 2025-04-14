"use client";

import { useEffect, useState, useRef } from "react";
import { useCodSearch } from "@/context/CodContext";

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL;

// Interwał dla /api/cod/id (2 sekundy dla dev, można zmienić na 500 ms w produkcji)
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
}) => (
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
          <strong>Wzór:</strong> {data.formula}
        </div>
        <div>
          <strong>Grupa przestrzenna:</strong> {data.spaceGroup}
        </div>
        <div>
          <strong>Autor:</strong> {data.author}
        </div>
        <div>
          <strong>Rok:</strong> {data.year}
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
          <strong>Objętość:</strong> {data.volume}
        </div>
      </div>
    )}
  </div>
);

const CodPollingResults = () => {
  const { formula, currentQuery } = useCodSearch();

  const [codIds, setCodIds] = useState<Set<string>>(new Set());
  const [results, setResults] = useState<Map<string, CodCifData>>(new Map());
  const [expanded, setExpanded] = useState<string | null>(null);
  const [isFetchingCif, setIsFetchingCif] = useState(false);
  const [queryCompleted, setQueryCompleted] = useState(false);
  const [progress, setProgress] = useState<number>(0);
  const [rejectedIds, setRejectedIds] = useState<Set<string>>(new Set());
  const [isIdPollingComplete, setIsIdPollingComplete] = useState(false); // Nowy stan
  const lastProcessed = useRef<Set<string>>(new Set());
  const fetchingCifs = useRef<Set<string>>(new Set());
  const shouldStopPollingIds = useRef<boolean>(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Reset
  useEffect(() => {
    setCodIds(new Set());
    setResults(new Map());
    setExpanded(null);
    setQueryCompleted(false);
    setProgress(0);
    setRejectedIds(new Set());
    setIsIdPollingComplete(false); // Resetujemy nowy stan
    lastProcessed.current = new Set();
    fetchingCifs.current = new Set();
    shouldStopPollingIds.current = false;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, [currentQuery]);

  // Poll /api/cod/search
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
        console.log("Status zapytania:", data);
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

  // Poll /api/cod/id
  useEffect(() => {
    if (!formula) return;
    let stopped = false;

    const pollIds = async () => {
      if (shouldStopPollingIds.current) {
        console.log("Zatrzymano odpytywanie /api/cod/id");
        await new Promise((resolve) => setTimeout(resolve, 4000));
        setIsIdPollingComplete(true); // Ustawiamy stan po zakończeniu poolingu
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

  // Fetch CIFs
  useEffect(() => {
    // Wyzwalamy efekt, gdy codIds się zmienia lub gdy pooling /api/cod/id się zakończy
    if (codIds.size === 0 || (isFetchingCif )) return;
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
      if (!isFetchingCif) {
        setIsFetchingCif(false);
      }
      return;
    }

    if (!isFetchingCif) {
      setIsFetchingCif(true);
    }

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
          console.log(
            `Attempting to download CIF file with key: cif/${id}.cif`
          );
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
          console.log(`Pobrano /api/cod/cif/${id}:`, full);

          setResults((prev) => {
            const updated = new Map(prev);
            updated.set(id, full);
            return updated;
          });

          await new Promise((res) => setTimeout(res, 2000)); // Opóźnienie między żądaniami
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
        console.log(
          `Pozostały ID do przetworzenia: ${remainingIdsToFetch}, kontynuujemy fetchowanie`
        );
      }
    })();
  }, [codIds, isIdPollingComplete]); // Dodajemy isIdPollingComplete jako zależność

  if (queryCompleted && results.size === 0 && formula && !isFetchingCif) {
    return (
      <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded text-red-800">
        ❗Nie znaleziono żadnych struktur w bazie COD dla podanej formuły.
      </div>
    );
  }

  return (
    <div className="space-y-2 mt-4">
      {!queryCompleted && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded text-blue-800 text-sm">
          ⏳ Trwa wyszukiwanie struktur...{" "}
          {progress > 0 && `Postęp: ${progress}%`}
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
          Pobieranie szczegółów struktur...
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
