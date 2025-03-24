"use client";

import { useState, useEffect } from "react";
import { getCookie } from "@/utils/cookies";
import { useFetchTranslations } from "@/utils/fetchTranslations";
import {
  fetchPurchaseHistory,
  fetchUsageHistory,
  PurchaseHistory,
  UsageHistory,
} from "@/utils/api"; // Importujemy potrzebne funkcje i typy
import "@/styles/globals.css";

const Dashboard = () => {
  const [translations, setTranslations] = useState<Record<string, string> | null>(null);
  const [userData, setUserData] = useState<Record<string, string> | null>(null);
  const [purchaseHistory, setPurchaseHistory] = useState<PurchaseHistory[] | null>(null);
  const [usageHistory, setUsageHistory] = useState<UsageHistory[] | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Stan ładowania

  // Pobieranie tłumaczeń
  useFetchTranslations(setTranslations, getCookie);

  // Pobieranie danych z localStorage i historii przy montowaniu komponentu
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);

      // Pobieranie danych z localStorage
      const storedData = localStorage.getItem("userData");
      if (storedData) {
        try {
          const parsedData = JSON.parse(storedData);
          if (typeof parsedData === "object" && parsedData !== null) {
            const formattedData = Object.fromEntries(
              Object.entries(parsedData).map(([key, value]) => [key, String(value)])
            );
            setUserData(formattedData);

            // Pobieranie historii tylko jeśli mamy userId
            const userId = Number(formattedData.id);
            if (userId) {
              const purchaseData = await fetchPurchaseHistory(userId);
              setPurchaseHistory(purchaseData);
              const usageData = await fetchUsageHistory(userId);
              setUsageHistory(usageData);
            }
          }
        } catch (error) {
          console.error("Błąd parsowania danych z localStorage:", error);
          setUserData({});
        }
      }

      setIsLoading(false);
    };

    fetchData();
  }, []);

  // Jeśli dane nie są załadowane, pokaż stan ładowania
  if (!translations || !userData || isLoading) {
    return <div>Ładowanie...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-gray-100 rounded-lg shadow-md mt-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-4">
        {translations.greeting}{" "}
        <span className="text-blue-600">{userData.username || "Brak nazwy"}</span>,{" "}
        {translations.welcome}
      </h1>
      <p className="text-lg text-gray-700 mb-6">
        {translations.you_have}{" "}
        <span className="font-semibold text-green-600">{userData.balance || "0"}</span>{" "}
        {translations.tokens_on_your_account}.
      </p>

      <p className="italic text-gray-600">
        {translations.what_are_tokens_for}
      </p>

      {/* Lista historii zakupów */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-800 mb-2">
          {translations.purchase_history || "Historia zakupów"}
        </h2>
        <div
          className="bg-white p-4 rounded shadow"
          style={{ maxHeight: "200px", overflowY: "auto" }} // Stała wysokość z suwakiem
        >
          {purchaseHistory && purchaseHistory.length > 0 ? (
            <ul className="space-y-2">
              {purchaseHistory
              .slice()
              .sort((a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime())
              .map((item) => (
                <li key={item.id} className="text-gray-700">
                {translations.bought || "Kupiono"} {item.creditsPurchased}{" "}
                {translations.credits || "kredytów"} {translations.zaco}{" "}
                {(item.amountPaid / 100).toFixed(2)} zł -{" "}
                {new Date(item.purchaseDate).toLocaleString()} {" "}
                {item.paymentId}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">
              {translations.no_purchases || "Brak historii zakupów"}
            </p>
          )}
        </div>
      </div>

      {/* Lista historii użycia */}
      <div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">
          {translations.usage_history || "Historia użycia"}
        </h2>
        <div
          className="bg-white p-4 rounded shadow"
          style={{ maxHeight: "200px", overflowY: "auto" }} // Stała wysokość z suwakiem
        >
          {usageHistory && usageHistory.length > 0 ? (
            <ul className="space-y-2">
              {usageHistory
              .slice()
              .sort((a, b) => new Date(b.usageDate).getTime() - new Date(a.usageDate).getTime())
              .map((item) => (
                <li key={item.id} className="text-gray-700">
                {translations.used || "Użyto"} {item.creditsUsed}{" "}
                {translations.credits || "tokenów"} (
                {item.usageType}) - {new Date(item.usageDate).toLocaleString()}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">
              {translations.no_usage || "Brak historii użycia"}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;