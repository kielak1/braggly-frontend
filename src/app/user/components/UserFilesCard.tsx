"use client";

import { useEffect, useState, useCallback } from "react";
import { Pencil, Trash2, FlaskConical } from "lucide-react";
import { useTranslations } from "@/context/TranslationsContext";
import XrdAnalysisModal from "@/user/components/XrdAnalysisModal";

interface Props {
  userId: number;
  userName: string;
  balance: number;
  role: string;
  freeAccess: boolean;
}

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Brak tokena w localStorage");
  return {
    Authorization: `Bearer ${token}`,
  };
};

const UserFilesCard = ({ userId }: Props) => {
  const { translations } = useTranslations();
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [selectedFileIdForAnalysis, setSelectedFileIdForAnalysis] = useState<
    number | null
  >(null);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);

  const fetchFiles = useCallback(async () => {
    try {
      const res = await fetch(`${backendUrl}/api/xrd/files`, {
        method: "GET",
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json",
        },
      });
      if (!res.ok) throw new Error("Błąd pobierania plików");
      const data = await res.json();
      setFiles(data);
    } catch (err) {
      console.error(err);
      setError(translations?.file_fetch_error || "Nie udało się pobrać plików");
    } finally {
      setLoading(false);
    }
  }, [translations]);

  // Pierwszy useEffect
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!localStorage.getItem("token")) return;
    fetchFiles();
  }, [fetchFiles]);

  // Drugi useEffect (przeniesiony na górę)
  useEffect(() => {
    if (!uploadMessage) return;
    const timeout = setTimeout(() => {
      setUploadMessage(null);
    }, 5000);
    return () => clearTimeout(timeout);
  }, [uploadMessage]);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => setDragOver(false);

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    setUploadMessage(null);

    const filesDropped = e.dataTransfer.files;
    const uploadedFiles: string[] = [];

    for (let i = 0; i < filesDropped.length; i++) {
      const file = filesDropped[i];
      const filename = file.name.replace(/\.[^/.]+$/, "");
      const formData = new FormData();
      formData.append("file", file);
      formData.append("name", filename);
      formData.append("publicVisible", "false");

      try {
        const res = await fetch(`${backendUrl}/api/xrd/upload`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          },
          body: formData,
        });

        if (res.ok) {
          uploadedFiles.push(file.name);
        } else {
          console.error(`❌ Błąd przesyłania: ${file.name}`);
        }
      } catch (err) {
        console.error(`❌ Błąd sieci dla pliku: ${file.name}`, err);
      }
    }

    if (uploadedFiles.length > 0) {
      setUploadMessage(
        `✅ Przesłano ${uploadedFiles.length} plików: ${uploadedFiles.join(", ")}`
      );
    } else {
      setUploadMessage("❌ Nie udało się przesłać żadnych plików.");
    }

    await fetchFiles();
  };

  // Wczesne zwroty po wszystkich hookach
  if (!translations) return <p className="text-center">Loading...</p>;
  if (loading)
    return (
      <p className="text-center">
        ⏳ {translations.loading_files || "Loading files..."}
      </p>
    );
  if (error) return <p className="text-center text-red-500">{error}</p>;

  return (
    <div
      className={`bg-white border rounded-lg p-4 shadow-sm min-h-[180px] ${dragOver ? "border-blue-400 bg-blue-50" : ""}`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      <h2 className="font-semibold text-lg mb-2">
        📂 {translations.uploaded_files || "My XRD files"}
        <span className="ml-2 text-sm text-gray-500 font-normal">
          (
          <a href="/user/uploads" className="underline hover:text-blue-600">
            {translations.add_files || "add files"}
          </a>{" "}
          {translations.or_drag_here || "or drag them here"})
        </span>
      </h2>

      {uploadMessage && (
        <div className="mb-4 p-3 rounded-md bg-green-100 border border-green-300 text-green-800 text-sm shadow-sm transition-all duration-500">
          {uploadMessage}
        </div>
      )}

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
                className="text-blue-600 hover:text-blue-800"
                title={translations.edit_file || "Edit"}
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                className="text-red-600 hover:text-red-800"
                title={translations.cancel || "Delete"}
              >
                <Trash2 className="w-4 h-4" />
              </button>
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

export default UserFilesCard;
