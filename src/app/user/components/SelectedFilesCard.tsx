"use client";

import { useState } from "react";
import { useTranslations } from "@/context/TranslationsContext";
import { FlaskConical, X } from "lucide-react";
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

interface FileMeta {
  id: number;
  userFilename: string;
  originalFilename: string;
  uploadedAt: string;
}

interface Props {
  userId: number;
  userName: string;
  balance: number;
  role: string;
  freeAccess: boolean;
}

const SelectedFilesCard = ({
  userId,
  userName,
  balance,
  role,
  freeAccess,
}: Props) => {
  const { translations } = useTranslations();
  const [selectedFileIds, setSelectedFileIds] = useState<number[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<FileMeta[]>([]);
  const [selectedFileIdForAnalysis, setSelectedFileIdForAnalysis] = useState<
    number | null
  >(null);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const fileId = Number(e.dataTransfer.getData("text/plain"));
    if (!isNaN(fileId) && !selectedFileIds.includes(fileId)) {
      try {
        const res = await fetch(`${backendUrl}/api/xrd/files/${fileId}`, {
          method: "GET",
          headers: getAuthHeaders(),
        });
        if (!res.ok) throw new Error("Błąd pobierania szczegółów pliku");
        const data = await res.json();
        setSelectedFiles((prev) => [...prev, data]);
        setSelectedFileIds((prev) => [...prev, fileId]);
      } catch (error) {
        console.error("Błąd przy pobieraniu pliku:", error);
      }
    }
  };

  const handleRemoveFile = (fileId: number) => {
    setSelectedFiles((prev) => prev.filter((file) => file.id !== fileId));
    setSelectedFileIds((prev) => prev.filter((id) => id !== fileId));
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  return (
    <div
      className="bg-white border rounded-lg p-4 shadow-sm min-h-[200px]"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <h2 className="font-semibold text-lg mb-2">
        📊 {translations?.selected_files || "Files selected for analysis"}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border p-4 min-h-[100px] rounded bg-gray-50">
          {selectedFiles.length === 0 ? (
            <p className="text-sm text-gray-500 italic">
              {translations?.drag_here || "Drag files here to analyze"}
            </p>
          ) : (
            <ul className="text-sm space-y-1">
              {selectedFiles.map((file) => (
                <li key={file.id} className="flex items-center justify-between">
                  <div>
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
                      title={translations?.analyze || "Analyze"}
                    >
                      <FlaskConical className="w-4 h-4" />
                    </button>
                    <button
                      className="text-gray-500 hover:text-red-600"
                      onClick={() => handleRemoveFile(file.id)}
                      title={
                        translations?.remove_from_selected ||
                        "Remove from selection"
                      }
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="border p-4 min-h-[100px] rounded bg-gray-50">
          <p className="text-sm text-gray-500">
            {translations?.analysis_options ||
              "Analysis options coming soon..."}
          </p>
        </div>
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

export default SelectedFilesCard;
