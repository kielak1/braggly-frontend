"use client";

import { useState } from "react";
import { useTranslations } from "@/context/TranslationsContext";
import CodImportStatusList from "@/user/components/CodImportStatusList";
import CodPollingResults from "@/user/components/CodPollingResults";
import { useCodSearch } from "@/context/CodContext";

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL;

const getAuthHeaders = () => {
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
  const { setFormula, setCurrentQuery, formula, setCodId } = useCodSearch();

  const handleStart = async () => {
    setError("");
    setProgress(null);
    setAiResponse(null);
    setFormula(null);
    setCurrentQuery(null);
    setLoading(true);

    const isCodId = /^\d+$/.test(input.trim());

    try {
      const headers = getAuthHeaders();

      if (isCodId) {
        setLoading(false);
        setCodId(input);
        setFormula(null);
        return;
      }

      const ai = await fetch(`${API_BASE}/openai/cod`, {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(input),
      }).then((r) => r.json());

      setAiResponse(ai);
      if (ai.elementCount < 3) {
        setError(
          translations?.["cod_main_too_few_elements"] ||
            "Dla związków zawierających mniej niż 3 pierwiastki należy podać numer COD ID."
        );
        setLoading(false);
        return;
      }

      setFormula(ai.formulaCOD);
      setCodId(null);
      setCurrentQuery(ai.queryCOD);
    } catch (err) {
      console.error(err);
      setError(
        translations?.["cod_main_missing_token"] || "Brak tokena w localStorage"
      );
    } finally {
      setLoading(false);
    }
  };

  if (!translations) {
    return <div>Loading translations...</div>;
  }

  return (
    <div className="p-4 max-w-4xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold">
        {translations["cod_dashboard"] || "COD Dashboard"}
      </h1>

      <CodImportStatusList />

      <div className="flex gap-2">
        <input
          type="text"
          className="flex-1 border px-3 py-2 rounded w-full"
          placeholder={
            translations?.["cod_main_search_placeholder"] ||
            "Wpisz nazwę związku lub numer COD ID..."
          }
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button
          onClick={handleStart}
          disabled={!input || loading}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {translations?.["cod_main_search_button"] || "Szukaj"}
        </button>
      </div>

      {error && <div className="text-red-500 text-sm">{error}</div>}

      {aiResponse && (
        <div className="text-sm text-gray-700 border p-3 rounded bg-gray-50">
          <div>
            <strong>
              {translations?.["cod_element_count"] || "Number of elements"}:
            </strong>{" "}
            {aiResponse.elementCount}
          </div>
          <div>
            <strong>
              {translations?.["cod_query_format"] ||
                "Query format for COD database"}
              :
            </strong>{" "}
            {aiResponse.queryCOD}
          </div>
          <div>
            <strong>
              {translations?.["cod_formula"] || "Recognized formula"}:
            </strong>{" "}
            {aiResponse.formulaCOD}
          </div>
          <div>
            <strong>
              {translations?.["cod_compound_name"] || "Recognized name"}:
            </strong>{" "}
            {aiResponse.compoundName}
          </div>
        </div>
      )}

      {!aiResponse && formula && (
        <div className="text-sm text-gray-700 border p-3 rounded bg-gray-50">
          <div>
            <strong>
              {translations?.["cod_formula"] || "Recognized formula"}:
            </strong>{" "}
            {formula}
          </div>
        </div>
      )}

      {progress !== null && (
        <div className="text-sm text-gray-600">
          {translations?.["cod_main_import_progress"]?.replace(
            "{progress}",
            progress.toString()
          ) || `Postęp importu z bazy COD: ${progress}%`}
        </div>
      )}

      <CodPollingResults />
    </div>
  );
};

export default CODDashboard;
