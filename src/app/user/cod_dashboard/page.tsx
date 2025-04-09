"use client";

import { useState } from "react";
import { useTranslations } from "@/context/TranslationsContext";
import CodImportStatusList from "@/user/components/CodImportStatusList";
import CodPollingResults from "@/user/components/CodPollingResults";
import { useCodSearch } from "@/context/CodContext";

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL;

const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Brak tokena w localStorage");
  return {
    Authorization: `Bearer ${token}`,
  };
};

interface AiResponse {
  elementCount: number;
  queryCOD: string;
  formulaCOD: string;
  compoundName: string;
}

const CODDashboard = () => {
  const { translations } = useTranslations();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [aiResponse, setAiResponse] = useState<AiResponse | null>(null);
  const { setFormula, setCurrentQuery } = useCodSearch();

  const handleStart = async () => {
    setError("");
    setProgress(null);
    setAiResponse(null);
    setLoading(true);

    const isCodId = /^\d+$/.test(input.trim());

    try {
      if (isCodId) {
        setError(
          "Bezpośredni COD ID nie jest aktualnie obsługiwany w tym trybie."
        );
        setLoading(false);
        return;
      } else {
        const ai = await fetch(`${API_BASE}/openai/cod`, {
          method: "POST",
          headers: {
            ...getAuthHeaders(),
            "Content-Type": "application/json",
          },
          body: JSON.stringify(input),
        }).then((r) => r.json());

        setAiResponse(ai);
        setFormula(ai.formulaCOD);
        setCurrentQuery(ai.queryCOD);

        if (ai.elementCount < 3) {
          setError(
            "Dla związków z mniej niż 3 pierwiastkami musisz podać COD ID."
          );
          setLoading(false);
          return;
        }
      }
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

      <CodImportStatusList />

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

      {error && <div className="text-red-500 text-sm">{error}</div>}

      {aiResponse && (
        <div className="text-sm text-gray-700 border p-3 rounded bg-gray-50">
          <div>
            <strong>Liczba pierwiastków:</strong> {aiResponse.elementCount}
          </div>
          <div>
            <strong>Format zapytania do bazy COD:</strong> {aiResponse.queryCOD}
          </div>
          <div>
            <strong>Rozpoznana formuła:</strong> {aiResponse.formulaCOD}
          </div>
          <div>
            <strong>Rozpoznana nazwa:</strong> {aiResponse.compoundName}
          </div>
        </div>
      )}

      {progress !== null && (
        <div className="text-sm text-gray-600">
          Postęp importu danych z bazy COD: {progress}%
        </div>
      )}

      <CodPollingResults />
    </div>
  );
};

export default CODDashboard;
