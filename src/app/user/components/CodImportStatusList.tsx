"use client";

import { useEffect, useState } from "react";
import { useCodSearch } from "@/context/CodContext";

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL;
const POLL_INTERVAL_MS = 500;

interface ActiveImport {
  formula: string;
  requestedAt: string;
  eta: string;
}

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

        const currentSet = new Set(
          (formula ?? "").split(/\s+/).filter(Boolean)
        );

        const found = data.some((imp) => {
          const importSet = new Set(imp.formula.split(/\s+/).filter(Boolean));
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

  const currentSet = new Set((formula ?? "").split(/\s+/).filter(Boolean));

  return (
    <div className="bg-yellow-50 border border-yellow-300 p-4 rounded text-sm mt-4">
      <strong className="block mb-2 text-yellow-900">
        Trwające importy z COD:
      </strong>

      <ul className="space-y-1">
        {[...activeImports]
          .sort((a, b) => {
            const setA = new Set(a.formula.split(/\s+/).filter(Boolean));
            const setB = new Set(b.formula.split(/\s+/).filter(Boolean));
            const currentSet = new Set(
              (formula ?? "").split(/\s+/).filter(Boolean)
            );

            const isCurrentA = [...setA].every((el) => currentSet.has(el));
            const isCurrentB = [...setB].every((el) => currentSet.has(el));

            if (isCurrentA && !isCurrentB) return -1;
            if (!isCurrentA && isCurrentB) return 1;

            // Porównanie ETA jako czasu (jeśli da się sparsować)
            const etaToSeconds = (eta: string) => {
              const [h, m, s] = eta.split(":").map(Number);
              return h * 3600 + m * 60 + s;
            };

            return etaToSeconds(a.eta) - etaToSeconds(b.eta);
          })
          .map((imp, i) => {
            const importSet = new Set(imp.formula.split(/\s+/).filter(Boolean));
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
