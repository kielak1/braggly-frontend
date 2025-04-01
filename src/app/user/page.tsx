"use client";

import { useState, useEffect } from "react";
import { getCookie } from "@/utils/cookies";
import { useFetchTranslations } from "@/utils/fetchTranslations";
import {
  fetchPurchaseHistory,
  fetchUsageHistory,
  PurchaseHistory,
  UsageHistory,
  fetchBoolParameterByName,
  isParameterEnabled,
} from "@/utils/api";
import "@/styles/globals.css";

const Dashboard = () => {
  const [translations, setTranslations] = useState<Record<
    string,
    string
  > | null>(null);
  const [userData, setUserData] = useState<Record<string, string> | null>(null);
  const [purchaseHistory, setPurchaseHistory] = useState<
    PurchaseHistory[] | null
  >(null);
  const [usageHistory, setUsageHistory] = useState<UsageHistory[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [freeAccess, setFreeAccess] = useState<boolean>(true);

  // Pobieranie tłumaczeń
  useFetchTranslations(setTranslations, getCookie);

  // Sprawdzenie flagi darmowego dostępu
  useEffect(() => {
    const checkFreeAccess = async () => {
      const param = await fetchBoolParameterByName("free_access");
      setFreeAccess(isParameterEnabled(param));
    };
    checkFreeAccess();
  }, []);

  // Pobieranie danych z localStorage i historii
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const storedData = localStorage.getItem("user");
      if (storedData) {
        try {
          const formattedData = JSON.parse(storedData);
          setUserData(formattedData);

          // Pobieranie historii tylko jeśli mamy userId
          const userId = Number(formattedData.id);
          if (userId) {
            const purchaseData = await fetchPurchaseHistory(userId);
            setPurchaseHistory(purchaseData);
            const usageData = await fetchUsageHistory(userId);
            setUsageHistory(usageData);
          }
        } catch (error) {
          console.error("Błąd parsowania danych z localStorage:", error);
        }
      }
      setIsLoading(false);
    };

    fetchData();
  }, []);
  if (!translations) {
    return <div>Ładowanie tłumaczeń</div>;
  }
  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold">User Dashboard</h1>

      {/* Górna część: dwa komponenty po lewej + info box po prawej */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="col-span-2 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white border rounded-lg p-4 shadow-sm min-h-[180px]">
              <h2 className="font-semibold text-lg mb-2">📂 My XRD files</h2>
              <p className="text-sm text-gray-500">
                Placeholder for user file list
              </p>
            </div>
            <div className="bg-white border rounded-lg p-4 shadow-sm min-h-[180px]">
              <h2 className="font-semibold text-lg mb-2">
                🌐 Public XRD files
              </h2>
              <p className="text-sm text-gray-500">
                Placeholder for public file list
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white border rounded-lg p-4 shadow-sm min-h-[100%]">
          <h2 className="font-semibold text-lg mb-2">
            {translations.welcome}
            📦 Purchase History / Info
          </h2>
          <p className="text-sm text-gray-500">
            Placeholder for stats or token history
          </p>
        </div>
      </div>

      <div className="bg-white border rounded-lg p-4 shadow-sm min-h-[200px]">
        <h2 className="font-semibold text-lg mb-2">
          📊 Files selected for analysis
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border p-4 min-h-[100px] rounded bg-gray-50">
            filelist
          </div>
          <div className="border p-4 min-h-[100px] rounded bg-gray-50">
            button area – analysis options
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
