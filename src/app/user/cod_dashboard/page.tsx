"use client";

import { useState } from "react";
import { useTranslations } from "@/context/TranslationsContext";

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL;

const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Brak tokena w localStorage");
  return {
    Authorization: `Bearer ${token}`,
  };
};

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

const CODDashboard = () => {
  const { translations } = useTranslations();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [codIds, setCodIds] = useState<string[]>([]);
  const [results, setResults] = useState<CodCifData[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);

  const fetchCifData = async (ids: string[]) => {
    const all: CodCifData[] = [];
    for (const id of ids) {
      const res = await fetch(`${API_BASE}/api/cod/cif/${id}`, {
        headers: getAuthHeaders(),
      });
      const json = await res.json();
      all.push({ ...json, codId: id });
    }
    setResults(all);
  };

  const handleStart = async () => {
    setError("");
    setResults([]);
    setProgress(null);
    setCodIds([]);
    setLoading(true);

    const isCodId = /^\d+$/.test(input.trim());
    let ids: string[] = [];

    try {
      if (isCodId) {
        ids = [input.trim()];
      } else {
        const ai = await fetch(`${API_BASE}/openai/cod`, {
          method: "POST",
          headers: {
            ...getAuthHeaders(),
            "Content-Type": "application/json",
          },
          body: JSON.stringify(input),
        }).then((r) => r.json());

        if (ai.elementCount < 3) {
          setError("Zbyt prosty związek – nie podlega analizie.");
          setLoading(false);
          return;
        }

        let done = false;
        while (!done) {
          const resp = await fetch(`${API_BASE}/api/cod/search`, {
            method: "POST",
            headers: {
              ...getAuthHeaders(),
              "Content-Type": "text/plain",
            },
            body: ai.queryCOD,
          }).then((r) => r.json());

          setProgress(resp.progress ?? null);

          if (resp.queryRunning) {
            await new Promise((r) => setTimeout(r, 2000));
          } else if (resp.alreadyQueried && resp.completed) {
            done = true;
            ids = await fetch(
              `${API_BASE}/api/cod/id?formula=${encodeURIComponent(ai.formulaCOD)}`,
              { headers: getAuthHeaders() }
            ).then((r) => r.json());
          } else {
            setError("Brak wyników.");
            setLoading(false);
            return;
          }
        }
      }

      setCodIds(ids);
      await fetchCifData(ids);
    } catch (err) {
      console.error(err);
      setError("Błąd podczas przetwarzania.");
    } finally {
      setLoading(false);
    }
  };

  if (!translations) return <div>Ładowanie tłumaczeń...</div>;

  return (
    <div className="p-4 max-w-4xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold">COD Dashboard</h1>

      <div className="flex gap-2">
        <input
          type="text"
          className="flex-1 border px-3 py-2 rounded w-full"
          placeholder="Podaj nazwę substancji lub COD ID..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button
          onClick={handleStart}
          disabled={!input || loading}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          Szukaj
        </button>
      </div>

      {progress !== null && (
        <div className="text-sm text-gray-600">Postęp analizy: {progress}%</div>
      )}

      {error && <div className="text-red-500 text-sm">{error}</div>}

      {results.length > 0 && (
        <div className="space-y-2">
          {results.map((res) => (
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
      )}
    </div>
  );
};

export default CODDashboard;
