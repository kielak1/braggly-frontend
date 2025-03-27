"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { getCookie } from "@/utils/cookies";
import { useFetchTranslations } from "@/utils/fetchTranslations";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

// Rejestracja komponentów Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Brak tokena w localStorage");
  return {
    Authorization: `Bearer ${token}`,
  };
};

interface Peak {
  angle: number;
  intensity: number;
  dspacing: number;
}

type Props = {
  fileId: number;
  open: boolean;
  onClose: () => void;
};

const XrdAnalysisModal = ({ fileId, open, onClose }: Props) => {
  const [translations, setTranslations] = useState<Record<string, string> | null>(null);
  const [chartData, setChartData] = useState<any>(null);
  const [peaks, setPeaks] = useState<Peak[]>([]);
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

        // Dostosowanie nazw pól, jeśli backend używa "twoTheta" zamiast "angles"
        const angles = data.twoTheta || data.angles;
        const intensities = data.intensities;
        const peaksData = data.peaks;

        if (!angles || !intensities || !peaksData) {
          throw new Error("Invalid response format from backend");
        }

        // Ustawienie danych dla wykresu
        setChartData({
          labels: angles,
          datasets: [
            {
              label: translations?.intensity || "Intensity",
              data: intensities,
              borderColor: "blue",
              fill: false,
              tension: 0.1,
            },
          ],
        });

        // Walidacja i ustawienie pików
        const validatedPeaks = peaksData.filter(
          (peak: any) =>
            typeof peak.angle === "number" &&
            typeof peak.intensity === "number" &&
            typeof peak.dspacing === "number"
        );
        setPeaks(validatedPeaks);
        if (validatedPeaks.length !== peaksData.length) {
          setError("Some peaks were invalid and filtered out");
        }
      } catch (err) {
        setError("❌ Nie udało się pobrać danych analizy");
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysis();
  }, [open, fileId, translations]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{translations?.analysis || "Analiza danych XRD"}</DialogTitle>
        </DialogHeader>

        {loading && <p>⏳ Ładowanie danych analizy...</p>}
        {error && <p className="text-red-500">{error}</p>}

        {chartData && (
          <div className="mt-6">
            <Line
              data={chartData}
              options={{
                responsive: true,
                plugins: {
                  title: {
                    display: true,
                    text: translations?.xrd_pattern || "XRD Pattern",
                    font: { size: 18 },
                  },
                  legend: { position: "top" },
                  tooltip: { mode: "index", intersect: false },
                },
                scales: {
                  x: {
                    title: { display: true, text: "2θ (degrees)" },
                    grid: { display: false },
                  },
                  y: {
                    title: {
                      display: true,
                      text: translations?.intensity || "Intensity (counts)",
                    },
                    beginAtZero: true,
                  },
                },
              }}
            />
          </div>
        )}

        {peaks.length > 0 && (
          <div className="mt-6">
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              {translations?.detected_peaks || "Detected Peaks"}
            </h2>
            <div className="max-h-64 overflow-y-auto border rounded">
              <table className="w-full border-collapse">
                <thead className="bg-gray-200 sticky top-0">
                  <tr>
                    <th className="border p-2 text-left">2θ (degrees)</th>
                    <th className="border p-2 text-left">
                      {translations?.intensity || "Intensity (counts)"}
                    </th>
                    <th className="border p-2 text-left">d-spacing (Å)</th>
                  </tr>
                </thead>
                <tbody>
                  {peaks.map((peak, index) => (
                    <tr
                      key={index}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="border p-2">{peak.angle.toFixed(2)}</td>
                      <td className="border p-2">{peak.intensity}</td>
                      <td className="border p-2">{peak.dspacing.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <DialogFooter>
          <button
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            onClick={onClose}
          >
            {translations?.close || "Zamknij"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default XrdAnalysisModal;