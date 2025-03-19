// src/app/user/uploads/page.tsx
"use client";

import { useState } from "react";
import { getCookie } from "@/utils/cookies";
import { useFetchTranslations } from "@/utils/fetchTranslations";
import { uploadXrdFile } from "@/utils/api";
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
import "@/styles/globals.css";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface Peak {
  angle: number;
  intensity: number;
  dspacing: number;
}

const UploadUXD = () => {
  const [translations, setTranslations] = useState<Record<
    string,
    string
  > | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [chartData, setChartData] = useState<any>(null);
  const [peaks, setPeaks] = useState<Peak[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useFetchTranslations(setTranslations, getCookie);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setSelectedFile(event.target.files[0]);
      setChartData(null);
      setPeaks([]);
      setError(null);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await uploadXrdFile(selectedFile);
      console.log("Backend response:", result);
      console.log("Peaks structure:", result.peaks);

      if (!result.angles || !result.intensities || !result.peaks) {
        throw new Error("Invalid response format from backend");
      }

      setChartData({
        labels: result.angles,
        datasets: [
          {
            label: translations?.intensity || "Intensity",
            data: result.intensities,
            borderColor: "blue",
            fill: false,
            tension: 0.1,
          },
        ],
      });

      const validatedPeaks = result.peaks.filter(
        (peak: any) =>
          typeof peak.angle === "number" &&
          typeof peak.intensity === "number" &&
          typeof peak.dspacing === "number"
      );
      setPeaks(validatedPeaks);
      if (validatedPeaks.length !== result.peaks.length) {
        setError("Some peaks were invalid and filtered out");
      }
    } catch (err: any) {
      if (err.message.includes("403")) {
        setError(translations?.auth_error || "Access denied. Please log in.");
      } else {
        setError(
          translations?.analysis_error ||
            `Failed to analyze the file: ${err.message || "Unknown error"}`
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!translations) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center">
        <p className="text-gray-700">
          {/* {translations?.loading || "Ładowanie..."} */}
          Ładowanie..
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gray-100 rounded-lg shadow-md mt-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-4">
        {translations.upload_uxd_files || "Upload XRD Files"}
      </h1>
      <div className="flex items-center space-x-4 mb-4">
        <label
          htmlFor="fileInput"
          className="p-2 border rounded-lg text-gray-700 cursor-pointer hover:bg-gray-200 transition-colors"
        >
          {translations.select_file_button || "Wybierz plik"}
        </label>
        <input
          type="file"
          accept=".uxd"
          onChange={handleFileChange}
          id="fileInput"
          className="hidden"
        />
        <button
          onClick={handleAnalyze}
          className="bg-blue-500 text-white px-4 py-2 rounded disabled:bg-gray-400 hover:bg-blue-600 transition-colors"
          disabled={!selectedFile || isLoading}
        >
          {isLoading
            ? translations?.analyzing || "Analizowanie..."
            : translations?.analyze_button || "Analyze"}
        </button>
      </div>
      {selectedFile && (
        <p className="mt-2 text-gray-600">
          {translations.selected_file || "Selected File"}: {selectedFile.name}
        </p>
      )}
      {error && <p className="mt-2 text-red-600">{error}</p>}

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
            {translations.detected_peaks || "Detected Peaks"}
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
    </div>
  );
};

export default UploadUXD;
