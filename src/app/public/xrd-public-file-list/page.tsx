"use client";

import { useEffect, useState } from "react";
import { FlaskConical } from "lucide-react";
import XrdAnalysisModal from "@/public/components/XrdAnalysisModal";
import { useTranslations } from "@/context/TranslationsContext"; // ✅ nowy hook

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

const XrdPublicFileList = () => {
  const { translations } = useTranslations(); // ✅ użycie kontekstu
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedFileIdForAnalysis, setSelectedFileIdForAnalysis] = useState<
    number | null
  >(null);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);

  const fetchPublicFiles = async () => {
    try {
      const res = await fetch(`${backendUrl}/api/xrd/public-files`, {
        method: "GET",
      });
      if (!res.ok) throw new Error("Błąd pobierania publicznych plików");
      const data = await res.json();
      setFiles(data);
    } catch (err) {
      console.error(err);
      setError("❌ Nie udało się pobrać publicznych plików");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchPublicFiles = async () => {
      try {
        const res = await fetch(`${backendUrl}/api/xrd/public-files`, {
          method: "GET",
        });
        if (!res.ok) throw new Error("Błąd pobierania publicznych plików");
        const data = await res.json();
        setFiles(data);
      } catch (err) {
        console.error(err);
        setError("❌ Nie udało się pobrać publicznych plików");
      } finally {
        setLoading(false);
      }
    };

    fetchPublicFiles();
  }, []);

  if (!translations) return <p className="text-center">Ładowanie...</p>;
  if (loading)
    return (
      <p className="text-center">
        ⏳ {translations.loading_files || "Pobieranie plików..."}
      </p>
    );
  if (error) return <p className="text-center text-red-500">{error}</p>;

  return (
    <div className="max-w-5xl mx-auto p-6 mt-6 bg-white rounded-xl shadow-md">
      <h1 className="text-2xl font-bold mb-4">
        {translations.public_files || "Public Files"}
      </h1>
      <table className="w-full table-auto border-collapse">
        <thead>
          <tr className="bg-gray-200 text-left">
            <th className="p-2">
              {translations.list_user_filename || "Nazwa"}
            </th>
            <th className="p-2">
              {translations.list_original_filename || "Oryginalny plik"}
            </th>
            <th className="p-2">
              {translations.list_uploaded_at || "Data przesłania"}
            </th>
            <th className="p-2">{translations.list_actions || "Akcje"}</th>
          </tr>
        </thead>
        <tbody>
          {files.map((file) => (
            <tr key={file.id} className="border-t border-gray-300">
              <td className="p-2">{file.userFilename}</td>
              <td className="p-2">{file.originalFilename}</td>
              <td className="p-2">{file.uploadedAt?.split("T")[0]}</td>
              <td className="p-2">
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

export default XrdPublicFileList;
