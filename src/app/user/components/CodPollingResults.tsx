"use client";

import { useEffect, useState } from "react";
import { useCodSearch } from "@/context/CodContext";

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL;

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

const CodPollingResults = () => {
  const { formula, currentQuery, isBeingImported } = useCodSearch();
  const [codIds, setCodIds] = useState<string[]>([]);
  const [results, setResults] = useState<CodCifData[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [isFetchingCif, setIsFetchingCif] = useState(false);

  useEffect(() => {
    if (!currentQuery) return;

    setCodIds([]);
    setResults([]);
    setExpanded(null);

    let interval: NodeJS.Timeout;
    let stopped = false;

    const poll = async () => {
      try {
        const resp = await fetch(`${API_BASE}/api/cod/search`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "text/plain",
          },
          body: currentQuery,
        });

        const data = await resp.json();

        if (data.alreadyQueried && data.completed) {
          const ids: string[] = await fetch(
            `${API_BASE}/api/cod/id?formula=${encodeURIComponent(formula ?? "")}`,
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
            }
          ).then((r) => r.json());

          const newIds = ids.filter((id) => !codIds.includes(id));
          setCodIds((prev) => [...prev, ...newIds]);

          if (newIds.length > 0) {
            setIsFetchingCif(true);
          }

          for (const id of newIds) {
            const cif = await fetch(`${API_BASE}/api/cod/cif/${id}`, {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
            }).then((r) => r.json());

            setResults((prev) => [...prev, { ...cif, codId: id }]);
          }

          setIsFetchingCif(false);
        }
      } catch (err) {
        console.error("Błąd podczas pollingowania:", err);
      }

      if (!stopped && isBeingImported) {
        interval = setTimeout(poll, 1000);
      }
    };

    poll();

    return () => {
      stopped = true;
      clearTimeout(interval);
    };
  }, [isBeingImported, currentQuery, formula]);

  if (results.length === 0 && formula && !isFetchingCif) {
    return (
      <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded text-red-800">
        ❗Nie znaleziono żadnych struktur w bazie COD dla podanej formuły.
      </div>
    );
  }

  if (!results.length) return null;

  return (
    <div className="space-y-2 mt-4">
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

      {[...results]
        .sort((a, b) => Number(a.codId) - Number(b.codId))
        .map((res) => (
          <div key={res.codId} className="border rounded overflow-hidden">
            <button
              onClick={() =>
                setExpanded((prev) => (prev === res.codId ? null : res.codId))
              }
              className="w-full text-left px-4 py-2 bg-gray-100 font-semibold"
            >
              COD ID: {res.codId} {res.name ? `– ${res.name}` : ""}
            </button>

            {expanded === res.codId && (
              <div className="grid grid-cols-2 gap-4 p-4 text-sm bg-white">
                <div>
                  <strong>Wzór:</strong> {res.formula}
                </div>
                <div>
                  <strong>Grupa przestrzenna:</strong> {res.spaceGroup}
                </div>
                <div>
                  <strong>Autor:</strong> {res.author}
                </div>
                <div>
                  <strong>Rok:</strong> {res.year}
                </div>
                <div>
                  <strong>a:</strong> {res.a}
                </div>
                <div>
                  <strong>b:</strong> {res.b}
                </div>
                <div>
                  <strong>c:</strong> {res.c}
                </div>
                <div>
                  <strong>Objętość:</strong> {res.volume}
                </div>
              </div>
            )}
          </div>
        ))}
    </div>
  );
};

export default CodPollingResults;
