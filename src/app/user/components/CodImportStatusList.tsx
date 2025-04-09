"use client";

import { useEffect, useState } from "react";
import { useCodSearch } from "@/context/CodContext";

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL;
const POLL_INTERVAL_MS = 2000;

interface ActiveImport {
  formula: string;
  startedAt: string;
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
    <div className="bg-yellow-50 border border-yellow-300 p-3 rounded text-sm">
      <strong>Trwające importy z COD:</strong>
      <ul className="mt-1 list-disc list-inside">
        {activeImports.map((imp, i) => {
          const importSet = new Set(imp.formula.split(/\s+/).filter(Boolean));
          const isCurrent = [...importSet].every((el) => currentSet.has(el));

          return (
            <li
              key={i}
              className={isCurrent ? "text-red-700 font-semibold" : ""}
            >
              {imp.formula} {isCurrent && "(dotyczy bieżącego wyszukiwania)"}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default CodImportStatusList;
