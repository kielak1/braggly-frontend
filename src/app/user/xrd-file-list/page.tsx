"use client";

import { useEffect, useState } from "react";
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

const XrdFileList = () => {
  const [translations, setTranslations] = useState<Record<
    string,
    string
  > | null>(null);
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useFetchTranslations(setTranslations, getCookie);

  useEffect(() => {
    if (typeof window === "undefined") return; // SSR fallback
    if (!localStorage.getItem("token")) return; // brak tokena – nie fetchuj

    const fetchFiles = async () => {
      try {
        const res = await fetch(`${backendUrl}/api/xrd/files`, {
          method: "GET",
          headers: getAuthHeaders(),
        });
        if (!res.ok) throw new Error("Błąd pobierania plików");
        const data = await res.json();
        setFiles(data);
      } catch (err) {
        console.error(err);
        setError("❌ Nie udało się pobrać plików");
      } finally {
        setLoading(false);
      }
    };

    fetchFiles();
  }, []);

  const handleDelete = async (id: number) => {
    const confirmed = window.confirm("Czy na pewno chcesz usunąć ten plik?");
    if (!confirmed) return;

    try {
      const res = await fetch(`${backendUrl}/api/xrd/files/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      if (!res.ok) throw new Error("Błąd podczas usuwania pliku");

      // aktualizuj stan lokalnie
      setFiles((prev) => prev.filter((file) => file.id !== id));
    } catch (err) {
      console.error(err);
      alert("❌ Nie udało się usunąć pliku.");
    }
  };

  if (!translations) return <p className="text-center">Ładowanie...</p>;

  if (loading) return <p className="text-center">⏳ Pobieranie plików...</p>;
  if (error) return <p className="text-center text-red-500">{error}</p>;

  return (
    <div className="max-w-5xl mx-auto p-6 mt-6 bg-white rounded-xl shadow-md">
      <h1 className="text-2xl font-bold mb-4">
        {translations.uploaded_files || "Uploaded Files"}
      </h1>
      <table className="w-full table-auto border-collapse">
        <thead>
          <tr className="bg-gray-200 text-left">
            <th className="p-2">Nazwa</th>
            <th className="p-2">Oryginalny plik</th>
            <th className="p-2">Publiczny?</th>
            <th className="p-2">Data przesłania</th>
            <th className="p-2">Akcje</th>
          </tr>
        </thead>
        <tbody>
          {files.map((file) => (
            <tr key={file.id} className="border-t border-gray-300">
              <td className="p-2">{file.userFilename}</td>
              <td className="p-2">{file.originalFilename}</td>
              <td className="p-2">{file.publicVisible ? "✅" : "❌"}</td>
              <td className="p-2">{file.uploadedAt?.split("T")[0]}</td>
              <td className="p-2 space-x-2">
                <button className="text-blue-600 hover:underline">
                  Edytuj
                </button>

                <button
                  onClick={() => handleDelete(file.id)}
                  className="text-red-600 hover:underline"
                >
                  Usuń
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default XrdFileList;
