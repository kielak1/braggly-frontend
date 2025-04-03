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

const PublicFilesCard = ({
  userId,
  userName,
  balance,
  role,
  freeAccess,
}: Props) => {
  const { translations } = useTranslations();
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedFileIdForAnalysis, setSelectedFileIdForAnalysis] = useState<
    number | null
  >(null);
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
        setError(
          translations?.file_fetch_error ||
            "❌ Nie udało się pobrać plików publicznych"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchPublicFiles();
  }, [translations]);

  if (!translations) return <p className="text-center">Loading...</p>;
  if (loading)
    return (
      <p className="text-center">
        ⏳ {translations.loading_files || "Pobieranie plików..."}
      </p>
    );
  if (error) return <p className="text-center text-red-500">{error}</p>;

  return (
    <div className="bg-white border rounded-lg p-4 shadow-sm min-h-[180px]">
      <h2 className="font-semibold text-lg mb-2">
        🌐 {translations.public_files || "Public XRD files"}
      </h2>
      <div className="space-y-2 max-h-[350px] overflow-y-auto">
        {files.map((file) => (
          <div
            key={file.id}
            className="flex justify-between items-center p-2 bg-gray-50 rounded hover:bg-gray-100 transition"
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData("text/plain", String(file.id));
            }}
          >
            <div className="flex-1">
              <div className="font-medium">{file.userFilename}</div>
              <div className="text-xs text-gray-500">
                {file.originalFilename}
              </div>
              <div className="text-xs text-gray-400">
                {file.uploadedAt?.split("T")[0]}
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                className="text-green-600 hover:text-green-800"
                onClick={() => {
                  setSelectedFileIdForAnalysis(file.id);
                  setShowAnalysisModal(true);
                }}
                title={translations.analyze || "Analyze"}
              >
                <FlaskConical className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
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
