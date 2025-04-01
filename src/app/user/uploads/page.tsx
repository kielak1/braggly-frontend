"use client";

import { useState } from "react";
import { useTranslations } from "@/context/TranslationsContext";
import "@/styles/globals.css";

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Brak tokena w localStorage");
  return {
    Authorization: `Bearer ${token}`,
  };
};

const UploadUXD = () => {
  const { translations } = useTranslations(); // ✅
  const [file, setFile] = useState<File | null>(null);
  const [filename, setFilename] = useState("");
  const [publicVisible, setPublicVisible] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    if (!file || !filename) {
      setMessage(
        translations?.upload_missing_info || "Proszę podać nazwę i wybrać plik."
      );
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("name", filename);
    formData.append("publicVisible", publicVisible.toString());

    try {
      setLoading(true);
      setMessage(null);

      const res = await fetch(`${backendUrl}/api/xrd/upload`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: formData,
      });

      const result = await res.json();
      if (res.ok) {
        setMessage(
          translations?.upload_success || "✅ Plik został pomyślnie przesłany."
        );
        setFile(null);
        setFilename("");
        setPublicVisible(true);
      } else {
        setMessage(
          result?.message ||
            translations?.upload_failed ||
            "❌ Błąd podczas przesyłania pliku."
        );
      }
    } catch (err) {
      console.error(err);
      setMessage(
        translations?.upload_network_error ||
          "❌ Wystąpił błąd sieci lub brak połączenia z backendem."
      );
    } finally {
      setLoading(false);
    }
  };

  if (!translations) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center">
        <p className="text-gray-700">Ładowanie...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gray-100 rounded-lg shadow-md mt-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-4">
        {translations.upload_uxd_files || "Upload XRD Files"}
      </h1>

      <div className="mb-4">
        <label className="block text-gray-700 font-semibold mb-2">
          {translations.file_label || "Nazwa pliku użytkownika"}
        </label>
        <input
          type="text"
          value={filename}
          onChange={(e) => setFilename(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md"
        />
      </div>

      <div className="mb-4">
        <label className="block text-gray-700 font-semibold mb-2">
          {translations.select_file || "Wybierz plik UXD"}
        </label>
        <input
          type="file"
          accept=".raw,.uxd,.txt"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="w-full"
        />
      </div>

      <div className="mb-4 flex items-center">
        <input
          type="checkbox"
          checked={publicVisible}
          onChange={() => setPublicVisible(!publicVisible)}
          className="mr-2"
        />
        <label className="text-gray-700">
          {translations.make_public || "Udostępnij publicznie"}
        </label>
      </div>

      <button
        onClick={handleUpload}
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        {loading
          ? translations?.uploading || "Wysyłanie..."
          : translations?.upload_button || "Wyślij"}
      </button>

      {message && (
        <p className="mt-4 text-center text-sm text-gray-800 font-medium">
          {message}
        </p>
      )}
    </div>
  );
};

export default UploadUXD;
