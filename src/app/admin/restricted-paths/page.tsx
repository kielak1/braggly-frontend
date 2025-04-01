"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "@/context/TranslationsContext"; // ✅
import {
  fetchRestrictedPaths,
  addRestrictedPath,
  deleteRestrictedPath,
} from "@/utils/api";
import type { RestrictedPath } from "@/utils/api";
import "@/styles/globals.css";

const RestrictedPaths = () => {
  const { translations } = useTranslations(); // ✅
  const [paths, setPaths] = useState<RestrictedPath[] | null>(null);
  const [newPath, setNewPath] = useState<string>("");
  const [refresh, setRefresh] = useState(false);

  const loadPaths = useCallback(async () => {
    const list = await fetchRestrictedPaths();
    setPaths(list);
  }, []);

  useEffect(() => {
    loadPaths();
  }, [loadPaths, refresh]);

  const handleAddPath = async () => {
    if (!newPath.startsWith("/")) {
      alert("Ścieżka musi zaczynać się od '/'");
      return;
    }

    const added = await addRestrictedPath(newPath);
    if (added) {
      setNewPath("");
      setRefresh((prev) => !prev);
    }
  };

  const handleDeletePath = async (path: string) => {
    const msg =
      translations?.confirm_delete_path?.replace("{path}", path) ||
      `Czy na pewno chcesz usunąć ścieżkę "${path}"?`;
    if (confirm(msg)) {
      const deleted = await deleteRestrictedPath(path);
      if (deleted) {
        setRefresh((prev) => !prev);
      }
    }
  };

  if (!translations || !paths) return <div>Ładowanie...</div>;

  return (
    <div className="max-w-3xl mx-auto p-6 bg-gray-100 rounded-lg shadow-md mt-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-4">
        {translations.restricted_paths_header || "Płatne ścieżki w systemie"}
      </h1>

      <div className="mb-6">
        <input
          type="text"
          value={newPath}
          onChange={(e) => setNewPath(e.target.value)}
          placeholder="/user/premium"
          className="border border-gray-300 p-2 rounded w-2/3 mr-2"
        />
        <button
          onClick={handleAddPath}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          {translations.add || "Dodaj"}
        </button>
      </div>

      <ul className="space-y-4">
        {paths.length > 0 ? (
          paths.map((p) => (
            <li
              key={p.id}
              className="flex justify-between items-center p-4 bg-white rounded shadow"
            >
              <span className="font-medium">{p.path}</span>
              <button
                onClick={() => handleDeletePath(p.path)}
                className="bg-red-500 text-white px-3 py-1 rounded"
              >
                {translations.delete || "Usuń"}
              </button>
            </li>
          ))
        ) : (
          <li className="text-gray-500">
            {translations.no_paths || "Brak ścieżek."}
          </li>
        )}
      </ul>
    </div>
  );
};

export default RestrictedPaths;
