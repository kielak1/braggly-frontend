"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "@/context/TranslationsContext"; // ✅ użycie kontekstu
import "@/styles/globals.css";

const Dashboard = () => {
  const { translations } = useTranslations(); // ✅ tłumaczenia globalnie
  const [userData, setUserData] = useState<Record<string, string> | null>(null);

  // Pobieranie danych z localStorage przy montowaniu komponentu
  useEffect(() => {
    const storedData = localStorage.getItem("userData");
    if (storedData) {
      try {
        const parsedData = JSON.parse(storedData);
        if (typeof parsedData === "object" && parsedData !== null) {
          const formattedData = Object.fromEntries(
            Object.entries(parsedData).map(([key, value]) => [
              key,
              String(value),
            ])
          );
          setUserData(formattedData);
        }
      } catch (error) {
        console.error("Błąd parsowania danych z localStorage:", error);
        setUserData({});
      }
    }
  }, []);

  if (!translations || !userData) {
    return <div>Ładowanie...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto p-6 bg-gray-100 rounded-lg shadow-md mt-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-4">
        {translations.greeting}{" "}
        <span className="text-blue-600">
          {userData.username || "Brak nazwy"}
        </span>
        , {translations.welcome}
      </h1>
      <p className="text-lg text-gray-700">{translations.you_are_admin}!</p>
    </div>
  );
};

export default Dashboard;
