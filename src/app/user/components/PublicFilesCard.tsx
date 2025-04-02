"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "@/context/TranslationsContext";
import { FlaskConical } from "lucide-react";
import XrdAnalysisModal from "@/user/components/XrdAnalysisModal";

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Brak tokena w localStorage");
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
};

interface Props {
  userId: number;
  userName: string;
  balance: number;
  role: string;
  freeAccess: boolean;
}

const PublicFilesCard = ({ userId, userName, balance, role, freeAccess }: Props) => {
  const { translations } = useTranslations();
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedFileIdForAnalysis, setSelectedFileIdForAnalysis] = useState<number | null>(null);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!localStorage.getItem("token")) return;

    const fetchPublicFiles = async () => {
      try {
        const res = await fetch(`${backendUrl}/api/xrd/public-files`, {
          method: "GET",
          headers: getAuthHeaders(),
        });
        if (!res.ok) throw new Error("Błąd pobierania publicznych plików");
        const data = await res.json();
        setFiles(data);
      } catch (err) {
        console.error(err);
        setError(translations?.file_fetch_error || "❌ Nie udało się pobrać plików publicznych");
      } finally {
        setLoading(false);
      }
    };

    fetchPublicFiles();
  }, [translations]);

  if (!translations) return <p className="text-center">Loading...</p>;
  if (loading) return <p className="text-center">⏳ {translations.loading_files || "Pobieranie plików..."}</p>;
  if (error) return <p className="text-center text-red-500">{error}</p>;

  return (
    <div className="bg-white border rounded-lg p-4 shadow-sm min-h-[180px]">
      <h2 className="font-semibold text-lg mb-2">🌐 {translations.public_files || "Public XRD files"}</h2>
      <div className="overflow-x-auto">
        <table className="w-full table-auto border-collapse text-sm">
          <thead>
            <tr className="bg-gray-200 text-left">
              <th className="p-2">{translations.list_user_filename || "Nazwa"}</th>
              <th className="p-2">{translations.list_original_filename || "Oryginalny plik"}</th>
              <th className="p-2">{translations.list_uploaded_at || "Data przesłania"}</th>
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
      </div>

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

export default PublicFilesCard;
