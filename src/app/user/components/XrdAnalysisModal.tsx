"use client";

import { useEffect, useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { getCookie } from "@/utils/cookies";
import { useFetchTranslations } from "@/utils/fetchTranslations";

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Brak tokena w localStorage");
  return {
    Authorization: `Bearer ${token}`,
  };
};

type Props = {
  fileId: number;
  open: boolean;
  onClose: () => void;
};

const XrdAnalysisModal = ({ fileId, open, onClose }: Props) => {
  const [translations, setTranslations] = useState<Record<
    string,
    string
  > | null>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useFetchTranslations(setTranslations, getCookie);

  useEffect(() => {
    if (!open || !fileId) return;

    const fetchAnalysis = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${backendUrl}/api/xrd/analyze/${fileId}`, {
          method: "GET",
          headers: getAuthHeaders(),
        });
        if (!res.ok) throw new Error("Błąd pobierania analizy");
        const data = await res.json();
        setAnalysis(data);
      } catch (err) {
        setError("❌ Nie udało się pobrać danych analizy");
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysis();
  }, [open, fileId]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <div className="p-6 bg-white rounded-xl max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold mb-4">
          {translations?.analysis || "Analiza danych XRD"}
        </h2>

        {loading && <p>⏳ Ładowanie danych analizy...</p>}
        {error && <p className="text-red-500">{error}</p>}

        {analysis && (
          <div className="space-y-2">
            <div>
              <strong>Pozycje kątowe 2θ:</strong>{" "}
              {analysis.twoTheta?.join(", ")}
            </div>
            <div>
              <strong>Intensywności:</strong> {analysis.intensities?.join(", ")}
            </div>
            <div>
              <strong>Liczba pików:</strong> {analysis.peaks?.length}
            </div>
            {/* Możesz dodać więcej pól zależnie od struktury XrdData */}
          </div>
        )}

        <div className="mt-6 text-right">
          <button
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            onClick={onClose}
          >
            {translations?.close || "Zamknij"}
          </button>
        </div>
      </div>
    </Dialog>
  );
};

export default XrdAnalysisModal;
