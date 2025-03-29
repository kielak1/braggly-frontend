"use client";

import { useState, useEffect, useCallback } from "react";
import { getCookie } from "@/utils/cookies";
import { useFetchTranslations } from "@/utils/fetchTranslations";
import {
  fetchBoolParameters,
  deleteBoolParameter,
  updateBoolParameter,
  BoolParameter,
} from "@/utils/api";
import "@/styles/globals.css";

const ParametersDashboard = () => {
  const [translations, setTranslations] = useState<Record<
    string,
    string
  > | null>(null);
  const [parameters, setParameters] = useState<BoolParameter[] | null>(null);
  const [refresh, setRefresh] = useState(false);

  useFetchTranslations(setTranslations, getCookie);

  const loadBoolParameters = useCallback(async () => {
    const list = await fetchBoolParameters();
    setParameters(list);
  }, []);

  useEffect(() => {
    loadBoolParameters();
  }, [loadBoolParameters, refresh]);

  const handleToggle = async (param: BoolParameter) => {
    const success = await updateBoolParameter(param.name, !param.value);
    if (success) {
      setRefresh((prev) => !prev);
    }
  };

  const handleDelete = async (name: string) => {
    if (confirm(`Czy na pewno chcesz usunąć parametr "${name}"?`)) {
      const success = await deleteBoolParameter(name);
      if (success) {
        setRefresh((prev) => !prev);
      }
    }
  };

  if (!translations || !parameters) return <div>Ładowanie...</div>;

  return (
    <div className="max-w-3xl mx-auto p-6 bg-gray-100 rounded-lg shadow-md mt-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-4">
        {translations.parameters_header || "Parametry systemowe"}
      </h1>

      <ul className="space-y-4">
        {parameters.length > 0 ? (
          parameters.map((param) => (
            <li
              key={param.id}
              className="flex justify-between items-center p-4 bg-white rounded shadow"
            >
              <span className="font-medium">{param.name}</span>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={param.value}
                    onChange={() => handleToggle(param)}
                  />
                  {param.value ? "true" : "false"}
                </label>
                <button
                  onClick={() => handleDelete(param.name)}
                  className="bg-red-500 text-white px-3 py-1 rounded"
                >
                  {translations.delete || "Usuń"}
                </button>
              </div>
            </li>
          ))
        ) : (
          <li className="text-gray-500">
            {translations.no_parameters || "Brak parametrów."}
          </li>
        )}
      </ul>
    </div>
  );
};

export default ParametersDashboard;
