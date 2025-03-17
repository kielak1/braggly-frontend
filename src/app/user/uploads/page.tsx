"use client"; // dla obsługi eventów
import { useState } from "react";
import "@/styles/globals.css";
const UploadUXD = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setSelectedFile(event.target.files[0]);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold">Przesyłanie plików UXD</h1>
      <input
        type="file"
        accept=".uxd"
        onChange={handleFileChange}
        className="mt-4 p-2 border rounded"
      />
      {selectedFile && (
        <p className="mt-2">Wybrany plik: {selectedFile.name}</p>
      )}
    </div>
  );
};

export default UploadUXD;
