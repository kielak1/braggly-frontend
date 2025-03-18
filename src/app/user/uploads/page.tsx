"use client";

import { useState, useEffect } from "react";
import { getCookie } from "@/utils/cookies";
import "@/styles/globals.css";

const UploadUXD = () => {
  const [translations, setTranslations] = useState<Record<string, string> | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Pobieranie tłumaczeń w useEffect
  useEffect(() => {
    const fetchTranslations = async () => {
      const locale = getCookie("locale") || "en";
      try {
        const response = await fetch(`/api/translations?locale=${locale}`);
        const data = await response.json();
        setTranslations(data);
      } catch (error) {
        console.error("Błąd pobierania tłumaczeń:", error);
        setTranslations({}); // Fallback na pusty obiekt
      }
    };
    fetchTranslations();
  }, []); // Pusty array, aby wykonać tylko raz

  // Obsługa wyboru pliku
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setSelectedFile(event.target.files[0]);
    }
  };

  // Jeśli tłumaczenia nie są załadowane, pokaż stan ładowania
  if (!translations) {
    return <div>Ładowanie...</div>;
  }

  // Debugowanie
  console.log("Translations:", translations);

  return (
    <div className="max-w-2xl mx-auto p-6 bg-gray-100 rounded-lg shadow-md mt-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-4">
        {translations.upload_uxd_files || "Upload UXD Files"}
      </h1>
      <input
        type="file"
        accept=".uxd"
        onChange={handleFileChange}
        className="mt-4 p-2 border rounded-lg w-full text-gray-700"
      />
      {selectedFile && (
        <p className="mt-4 text-lg text-gray-700">
          {translations.selected_file || "Selected File"}:{" "}
          <span className="font-semibold text-blue-600">
            {selectedFile.name}
          </span>
        </p>
      )}
    </div>
  );
};

export default UploadUXD;