"use client";

import { useState } from "react";
import { getCookie } from "@/utils/cookies";
import { useFetchTranslations } from "@/utils/fetchTranslations";
import "@/styles/globals.css";

const UploadUXD = () => {
  const [translations, setTranslations] = useState<Record<
    string,
    string
  > | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useFetchTranslations(setTranslations, getCookie);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setSelectedFile(event.target.files[0]);
    }
  };

  if (!translations) {
    return <div>Ładowanie...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-gray-100 rounded-lg shadow-md mt-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-4">
        {translations.upload_uxd_files || "Upload UXD Files"}
      </h1>
      <label
        htmlFor="fileInput"
        className="mt-4 p-2 border rounded-lg w-full text-gray-700 cursor-pointer"
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
      {selectedFile && (
        <p className="mt-2 text-gray-600">
          {translations.selected_file || "Selected File"}: {selectedFile.name}
        </p>
      )}
    </div>
  );
};

export default UploadUXD;
