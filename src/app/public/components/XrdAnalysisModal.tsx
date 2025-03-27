"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
              borderColor: "#1E90FF", // Jasnoniebieski kolor linii
              borderWidth: 2,
              fill: false,
              tension: 0.1,
              pointRadius: 0, // Usunięcie punktów na linii dla lepszej czytelności
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
        setError(translations?.analysis_fetch_error || "❌ Nie udało się pobrać danych analizy");
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysis();
  }, [open, fileId, translations]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] w-[1500px] !max-w-[1500px] max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-800">
            {translations?.analysis || "Analiza danych XRD"}
          </DialogTitle>
        </DialogHeader>

        {loading && (
          <p className="text-gray-600">
            {translations?.analyzing || "⏳ Ładowanie danych analizy..."}
          </p>
        )}
        {error && <p className="text-red-500">{error}</p>}

        {chartData && (
          <div className="mt-6 bg-white p-4 rounded-lg shadow-md">
            <div className="h-[300px]">
              <Line
                data={chartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false, // Pozwala na ręczne ustawienie wysokości
                  plugins: {
                    title: {
                      display: true,
                      text: translations?.xrd_pattern || "XRD Pattern",
                      font: { size: 20, weight: "bold" },
                      color: "#333",
                      padding: 20,
                    },
                    legend: {
                      position: "top",
                      labels: {
                        font: { size: 14 },
                        color: "#333",
                      },
                    },
                    tooltip: {
                      mode: "index",
                      intersect: false,
                      backgroundColor: "rgba(0, 0, 0, 0.8)",
                      titleFont: { size: 14 },
                      bodyFont: { size: 12 },
                    },
                  },
                  scales: {
                    x: {
                      title: {
                        display: true,
                        text: "2θ (degrees)",
                        font: { size: 16, weight: "bold" },
                        color: "#333",
                      },
                      ticks: {
                        font: { size: 12 },
                        color: "#666",
                        maxTicksLimit: 20, // Ograniczenie liczby etykiet dla lepszej czytelności
                      },
                      grid: { display: false },
                    },
                    y: {
                      title: {
                        display: true,
                        text: translations?.intensity || "Intensity (counts)",
                        font: { size: 16, weight: "bold" },
                        color: "#333",
                      },
                      ticks: {
                        font: { size: 12 },
                        color: "#666",
                      },
                      beginAtZero: true,
                      grid: {
                        color: "rgba(0, 0, 0, 0.1)",
                      },
                    },
                  },
                }}
              />
            </div>
          </div>
        )}

        {peaks.length > 0 && (
          <div className="mt-6 bg-white p-4 rounded-lg shadow-md">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              {translations?.detected_peaks || "Detected Peaks"}
            </h2>
            <div className="max-h-60 overflow-y-auto border rounded-lg">
              <table className="w-full border-collapse">
                <thead className="bg-gray-100 sticky top-0">
                  <tr>
                    <th className="border-b p-3 text-left text-gray-700 font-semibold text-sm">
                      2θ (degrees)
                    </th>
                    <th className="border-b p-3 text-left text-gray-700 font-semibold text-sm">
                      {translations?.intensity || "Intensity (counts)"}
                    </th>
                    <th className="border-b p-3 text-left text-gray-700 font-semibold text-sm">
                      d-spacing (Å)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {peaks.map((peak, index) => (
                    <tr
                      key={index}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="border-b p-3 text-gray-600 text-sm">
                        {peak.angle.toFixed(2)}
                      </td>
                      <td className="border-b p-3 text-gray-600 text-sm">
                        {peak.intensity}
                      </td>
                      <td className="border-b p-3 text-gray-600 text-sm">
                        {peak.dspacing.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <DialogFooter className="mt-6">
          <button
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            onClick={onClose}
          >
            {translations?.zamknij_okno || "Zamknij"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default XrdAnalysisModal;