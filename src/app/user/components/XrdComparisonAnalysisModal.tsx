"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useTranslations } from "@/context/TranslationsContext";
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
import { X } from "lucide-react"; // Importujemy ikonę X z lucide-react

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
  return { Authorization: `Bearer ${token}` };
};

interface Peak {
  angle: number;
  intensity: number;
  dspacing: number;
}

interface FilePeaks {
  fileName: string;
  peaks: Peak[];
}

type Props = {
  files: any[]; // Pliki wybrane do analizy
  open: boolean;
  onClose: () => void;
};

const XrdComparisonAnalysisModal = ({ files, open, onClose }: Props) => {
  const { translations } = useTranslations(); // ✅
  const [chartData, setChartData] = useState<any>(null);
  const [peaks, setPeaks] = useState<FilePeaks[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || files.length === 0) return;

    const fetchComparisonData = async () => {
      setLoading(true);
      setError(null);

      try {
        const resData = await Promise.all(
          files.map(async (file) => {
            const res = await fetch(
              `${backendUrl}/api/xrd/analyze/${file.id}`,
              {
                method: "GET",
                headers: getAuthHeaders(),
              }
            );
            if (!res.ok) throw new Error("Błąd pobierania analizy");

            const data = await res.json();
            return data; // Zwróć dane analizy dla każdego pliku
          })
        );

        const angles = resData[0]?.twoTheta || resData[0]?.angles;
        const intensities = resData.map((data) => data.intensities);
        const peaksData = resData.map((data) => data.peaks);

        setChartData({
          labels: angles,
          datasets: files.map((file, index) => ({
            label: file.userFilename,
            data: intensities[index],
            borderColor: `hsl(${(index / files.length) * 360}, 100%, 50%)`,
            borderWidth: 2,
            fill: false,
            tension: 0.1,
            pointRadius: 0,
          })),
        });

        const allPeaks = peaksData.map((peaks, index) => ({
          fileName: files[index].userFilename,
          peaks,
        }));
        setPeaks(allPeaks);
      } catch (err) {
        setError("❌ Nie udało się pobrać danych analizy porównawczej");
      } finally {
        setLoading(false);
      }
    };

    fetchComparisonData();
  }, [open, files]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] w-[1500px] !max-w-[1500px] max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-800">
            {translations?.analysis || "Analiza danych XRD"}
          </DialogTitle>

          {/* Przycisk zamknięcia w prawym górnym rogu */}
          <button
            className="absolute top-4 right-4 text-gray-600 hover:text-gray-900"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </DialogHeader>

        {loading && (
          <p className="text-gray-600">
            {translations?.loading_analysis || "⏳ Ładowanie danych analizy..."}
          </p>
        )}
        {error && <p className="text-red-500">{error}</p>}

        {chartData && (
          <div className="mt-6 bg-white p-4 rounded-lg shadow-md">
            <div className="h-[450px]">
              <Line
                data={chartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
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
                        maxTicksLimit: 20,
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
            {peaks.map((filePeaks, fileIndex) => (
              <div key={fileIndex} className="mb-6">
                <h3 className="text-lg font-semibold">{filePeaks.fileName}</h3>
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
                      {filePeaks.peaks.map((peak: Peak, peakIndex: number) => (
                        <tr
                          key={peakIndex}
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
            ))}
          </div>
        )}

        <DialogFooter className="mt-6">
          {/* Można dodać dodatkowe przyciski, jeśli konieczne */}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default XrdComparisonAnalysisModal;
