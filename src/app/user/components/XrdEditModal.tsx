"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "@/context/TranslationsContext";

interface Props {
  file: {
    id: number;
    userFilename: string;
    publicVisible: boolean;
  };
  open: boolean;
  onClose: () => void;
  onSave: () => void;
}

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem("token");
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
};

const XrdEditModal = ({ file, open, onClose, onSave }: Props) => {
  const { translations } = useTranslations();
  const [name, setName] = useState(file.userFilename);
  const [isPublic, setIsPublic] = useState(file.publicVisible);

  useEffect(() => {
    setName(file.userFilename);
    setIsPublic(file.publicVisible);
  }, [file]);

  const handleSubmit = async () => {
    try {
      const res = await fetch(`${backendUrl}/api/xrd/files/${file.id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          userFilename: name,
          publicVisible: isPublic,
        }),
      });
      if (!res.ok) throw new Error("Błąd zapisu");
      onSave();
      onClose();
    } catch (err) {
      console.error("❌ Błąd podczas edycji pliku:", err);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 z-50 flex items-center justify-center">
      <div className="bg-white rounded-md shadow-lg p-6 w-[400px]">
        <h2 className="text-lg font-semibold mb-4">
          ✏️ {translations?.edit_file || "Edit file"}
        </h2>
        <div className="mb-3">
          <label className="block font-medium mb-1">
            {translations?.filename || "Filename"}
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border px-3 py-2 rounded"
          />
        </div>
        <div className="mb-4">
          <label className="inline-flex items-center">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="mr-2"
            />
            {translations?.make_public || "Make public"}
          </label>
        </div>
        <div className="flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
          >
            {translations?.cancel || "Cancel"}
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            {translations?.save || "Save"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default XrdEditModal;
