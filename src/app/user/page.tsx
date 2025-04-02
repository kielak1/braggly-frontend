"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "@/context/TranslationsContext";
import {
  fetchPurchaseHistory,
  fetchUsageHistory,
  PurchaseHistory,
  UsageHistory,
  fetchBoolParameterByName,
  isParameterEnabled,
} from "@/utils/api";
import "@/styles/globals.css";
import PurchaseInfoCard from "@/user/components/PurchaseInfoCard";

const Dashboard = () => {
  const { translations } = useTranslations();

  const [userData, setUserData] = useState<Record<string, string> | null>(null);
  const [purchaseHistory, setPurchaseHistory] = useState<
    PurchaseHistory[] | null
  >(null);
  const [usageHistory, setUsageHistory] = useState<UsageHistory[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [freeAccess, setFreeAccess] = useState<boolean>(true);

  useEffect(() => {
    const checkFreeAccess = async () => {
      const param = await fetchBoolParameterByName("free_access");
      setFreeAccess(isParameterEnabled(param));
    };
    checkFreeAccess();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);

      const storedData = localStorage.getItem("userData"); // ✅ poprawnie
      if (storedData) {
        try {
          const parsed = JSON.parse(storedData);
          setUserData(parsed);

          const userId = Number(parsed.id); // ✅ sprawdzenie typu
          if (!isNaN(userId)) {
            const purchaseData = await fetchPurchaseHistory(userId);
            setPurchaseHistory(purchaseData);

            const usageData = await fetchUsageHistory(userId);
            setUsageHistory(usageData);
          } else {
            console.warn("userId is NaN");
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
    return <div>Ładowanie tłumaczeń...</div>;
  }

  const userId = Number(userData?.id); // ✅ teraz userId będzie poprawny

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold">User Dashboard</h1>

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
          <PurchaseInfoCard userId={userId} />
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
