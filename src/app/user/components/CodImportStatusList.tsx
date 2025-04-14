"use client";

import { useEffect, useState } from "react";
import { useCodSearch } from "@/context/CodContext";

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL;
const POLL_INTERVAL_MS = 2500;

interface ActiveImport {
  formula: string;
  requestedAt: string;
  eta: string;
}

// Pomocnicza funkcja: usuwa cyfry z każdego elementu i tworzy zbiór pierwiastków
const extractElementSet = (input: string | null): Set<string> =>
  new Set(
    (input ?? "")
      .split(/\s+/)
      .map((el) => el.replace(/\d/g, "")) // "C2" → "C"
      .filter(Boolean)
  );

const CodImportStatusList = () => {
  const { formula, setIsBeingImported } = useCodSearch();
  const [activeImports, setActiveImports] = useState<ActiveImport[]>([]);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    const fetchImports = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/cod/active-imports`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        if (!res.ok) throw new Error("Nie udało się pobrać aktywnych importów");

        const data: ActiveImport[] = await res.json();
        setActiveImports(data);

        const currentSet = extractElementSet(formula);

        const found = data.some((imp) => {
          const importSet = extractElementSet(imp.formula);
          return [...importSet].every((el) => currentSet.has(el));
        });

        setIsBeingImported(found);
      } catch (err) {
        console.error("Błąd podczas pobierania importów:", err);
        setActiveImports([]);
        setIsBeingImported(false);
      }
    };

    fetchImports();
    interval = setInterval(fetchImports, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [formula, setIsBeingImported]);

  if (!activeImports.length) return null;

  const currentSet = extractElementSet(formula);

  return (
    <div className="bg-yellow-50 border border-yellow-300 p-4 rounded text-sm mt-4">
      <strong className="block mb-2 text-yellow-900">
        Trwające importy z COD:
      </strong>

      <ul className="space-y-1">
        {[...activeImports]
          .sort((a, b) => {
            const setA = extractElementSet(a.formula);
            const setB = extractElementSet(b.formula);

            const isCurrentA = [...setA].every((el) => currentSet.has(el));
            const isCurrentB = [...setB].every((el) => currentSet.has(el));

            if (isCurrentA && !isCurrentB) return -1;
            if (!isCurrentA && isCurrentB) return 1;

            const etaToSeconds = (eta: string) => {
              const [h, m, s] = eta.split(":").map(Number);
              return h * 3600 + m * 60 + s;
            };

            return etaToSeconds(a.eta) - etaToSeconds(b.eta);
          })
          .map((imp, i) => {
            const importSet = extractElementSet(imp.formula);
            const isCurrent = [...importSet].every((el) => currentSet.has(el));

            return (
              <li
                key={i}
                className={`flex justify-between items-center ${
                  isCurrent ? "text-red-700 font-semibold" : "text-gray-800"
                }`}
              >
                <span>
                  {imp.formula}
                  {isCurrent && " (dotyczy bieżącego wyszukiwania)"}
                </span>
                <span className="text-gray-600 text-xs font-normal">
                  {imp.eta === "00:00:00"
                    ? "szacowanie..."
                    : `pozostało ${imp.eta}`}
                </span>
              </li>
            );
          })}
      </ul>
    </div>
  );
};

export default CodImportStatusList;
