"use client";

import { useEffect, useState } from "react";
import { getCookie } from "@/utils/cookies";
import { useFetchTranslations } from "@/utils/fetchTranslations";
import { Pencil, Trash2, FlaskConical } from "lucide-react";
import XrdAnalysisModal from "../components/XrdAnalysisModal";

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Brak tokena w localStorage");
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
};

const XrdFileList = () => {
  const [translations, setTranslations] = useState<Record<string, string> | null>(null);
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editingFileId, setEditingFileId] = useState<number | null>(null);
  const [editedFile, setEditedFile] = useState<Partial<any> | null>(null);

  const [selectedFileIdForAnalysis, setSelectedFileIdForAnalysis] = useState<number | null>(null);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);

  useFetchTranslations(setTranslations, getCookie);

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

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!localStorage.getItem("token")) return;
    fetchFiles();
  }, []);

  if (!translations) return <p className="text-center">Ładowanie...</p>;
  if (loading) return <p className="text-center">⏳ Pobieranie plików...</p>;
  if (error) return <p className="text-center text-red-500">{error}</p>;

  return (
    <div className="max-w-5xl mx-auto p-6 mt-6 bg-white rounded-xl shadow-md">
      <h1 className="text-2xl font-bold mb-4">{translations.uploaded_files || "Uploaded Files"}</h1>
      <table className="w-full table-auto border-collapse">
        <thead>
          <tr className="bg-gray-200 text-left">
            <th className="p-2">{translations.list_user_filename || "Nazwa"}</th>
            <th className="p-2">{translations.list_original_filename || "Oryginalny plik"}</th>
            <th className="p-2">{translations.list_public_visible || "Publiczny?"}</th>
            <th className="p-2">{translations.list_uploaded_at || "Data przesłania"}</th>
            <th className="p-2">{translations.list_actions || "Akcje"}</th>
          </tr>
        </thead>
        <tbody>
          {files.map((file) => (
            <tr key={file.id} className="border-t border-gray-300">
              <td className="p-2">{file.userFilename}</td>
              <td className="p-2">{file.originalFilename}</td>
              <td className="p-2">{file.publicVisible ? "✅" : "❌"}</td>
              <td className="p-2">{file.uploadedAt?.split("T")[0]}</td>
              <td className="p-2 flex space-x-2">
                <button
                  className="text-blue-600 hover:text-blue-800"
                  onClick={() => {
                    setEditingFileId(file.id);
                    setEditedFile({
                      userFilename: file.userFilename,
                      publicVisible: file.publicVisible,
                    });
                  }}
                >
                  <Pencil className="w-5 h-5" />
                </button>
                <button
                  className="text-red-600 hover:text-red-800"
                  onClick={async () => {
                    if (!confirm("Czy na pewno chcesz usunąć plik?")) return;
                    try {
                      const res = await fetch(`${backendUrl}/api/xrd/files/${file.id}`, {
                        method: "DELETE",
                        headers: getAuthHeaders(),
                      });
                      if (!res.ok) throw new Error("Błąd usuwania");
                      await fetchFiles();
                    } catch (err) {
                      console.error("❌ Błąd podczas usuwania pliku:", err);
                    }
                  }}
                >
                  <Trash2 className="w-5 h-5" />
                </button>
                <button
                  className="text-green-600 hover:text-green-800"
                  onClick={() => {
                    setSelectedFileIdForAnalysis(file.id);
                    setShowAnalysisModal(true);
                  }}
                >
                  <FlaskConical className="w-5 h-5" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {editingFileId && editedFile && (
        <div className="mt-6 p-4 border border-gray-300 rounded bg-gray-50">
          <h2 className="text-xl font-semibold mb-2">✏️ Edytuj plik</h2>
          <div className="mb-3">
            <label className="block font-medium mb-1">Nazwa użytkownika</label>
            <input
              type="text"
              value={editedFile.userFilename || ""}
              onChange={(e) =>
                setEditedFile({ ...editedFile, userFilename: e.target.value })
              }
              className="w-full px-3 py-2 border rounded"
            />
          </div>
          <div className="mb-4">
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                checked={editedFile.publicVisible || false}
                onChange={(e) =>
                  setEditedFile({ ...editedFile, publicVisible: e.target.checked })
                }
                className="mr-2"
              />
              Udostępnij publicznie
            </label>
          </div>
          <div className="space-x-2">
            <button
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              onClick={async () => {
                try {
                  const res = await fetch(`${backendUrl}/api/xrd/files/${editingFileId}`, {
                    method: "PUT",
                    headers: getAuthHeaders(),
                    body: JSON.stringify(editedFile),
                  });
                  if (!res.ok) throw new Error("Błąd zapisu");
                  setEditingFileId(null);
                  setEditedFile(null);
                  await fetchFiles();
                } catch (err) {
                  console.error("Błąd edycji pliku:", err);
                }
              }}
            >
              Zapisz
            </button>
            <button
              className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
              onClick={() => {
                setEditingFileId(null);
                setEditedFile(null);
              }}
            >
              Anuluj
            </button>
          </div>
        </div>
      )}

      {selectedFileIdForAnalysis !== null && (
        <XrdAnalysisModal
          fileId={selectedFileIdForAnalysis}
          open={showAnalysisModal}
          onClose={() => {
            setShowAnalysisModal(false);
            setSelectedFileIdForAnalysis(null);
          }}
        />
      )}
    </div>
  );
};

export default XrdFileList;
