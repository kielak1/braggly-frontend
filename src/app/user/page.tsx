"use client";

import { useState, useEffect } from "react"; // Dodano useEffect do pobierania z localStorage
import { getCookie } from "@/utils/cookies";
import { useFetchTranslations } from "@/utils/fetchTranslations";
import "@/styles/globals.css";

const Dashboard = () => {
  const [translations, setTranslations] = useState<Record<string, string> | null>(null);
  const [userData, setUserData] = useState<Record<string, string> | null>(null); // Stan na dane z localStorage

  // Pobieranie tłumaczeń
  useFetchTranslations(setTranslations, getCookie);

  // Pobieranie danych z localStorage przy montowaniu komponentu
  useEffect(() => {
    const storedData = localStorage.getItem("userData");
    if (storedData) {
      try {
        const parsedData = JSON.parse(storedData);
        // Upewnij się, że dane są zgodne z Record<string, string>
        if (typeof parsedData === "object" && parsedData !== null) {
          const formattedData = Object.fromEntries(
            Object.entries(parsedData).map(([key, value]) => [key, String(value)])
          );
          setUserData(formattedData);
        }
      } catch (error) {
        console.error("Błąd parsowania danych z localStorage:", error);
        setUserData({}); // Fallback w przypadku błędu
      }
    }
  }, []); // Pusty array zależności, bo efekt wykonuje się tylko raz

  // Jeśli tłumaczenia lub dane z localStorage nie są załadowane, pokaż stan ładowania
  if (!translations || !userData) {
    return <div>Ładowanie...</div>;
  }

  return (
<div className="max-w-2xl mx-auto p-6 bg-gray-100 rounded-lg shadow-md mt-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-4">
        {translations.greeting}{" "}
        <span className="text-blue-600">{userData.username || "Brak nazwy"}</span>,{" "}
        {translations.welcome}
      </h1>
      <p className="text-lg text-gray-700">
        {translations.you_have}{" "}
        <span className="font-semibold text-green-600">{userData.balance || "0"}</span>{" "}
        {translations.tokens_on_your_account}.
      </p>
    </div>
  );
};

export default Dashboard;