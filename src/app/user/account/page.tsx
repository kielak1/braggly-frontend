"use client";

import { useState, useEffect } from "react";
import { getCookie } from "@/utils/cookies";
import { useFetchTranslations } from "@/utils/fetchTranslations";
import "@/styles/globals.css";
import Checkout from "@/components/Checkout";

const AccountPage = () => {
  const [translations, setTranslations] = useState<Record<string, string> | null>(null);
  const [userData, setUserData] = useState<Record<string, string> | null>(null);

  // Pobieranie tłumaczeń
  useFetchTranslations(setTranslations, getCookie);

  // Pobieranie danych użytkownika z localStorage przy montowaniu komponentu
  useEffect(() => {
    try {
      const storedData = localStorage.getItem("userData");
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        if (typeof parsedData === "object" && parsedData !== null) {
          setUserData(Object.fromEntries(Object.entries(parsedData).map(([key, value]) => [key, String(value)])));
        }
      } else {
        setUserData({ username: "Brak nazwy", balance: "0" }); // Domyślne wartości
      }
    } catch (error) {
      console.error("Błąd parsowania danych z localStorage:", error);
      setUserData({ username: "Brak nazwy", balance: "0" }); // Fallback w przypadku błędu
    }
  }, []);

  // Jeśli tłumaczenia lub dane z localStorage nie są załadowane, pokaż stan ładowania
  if (!translations || !userData) {
    return <div className="text-center text-gray-600 text-lg mt-6">Ładowanie...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-gray-100 rounded-lg shadow-md mt-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-4">
        {translations.account_balance || "Saldo konta"}{" "}
        <span className="text-blue-600">
          ({userData.username || "Brak nazwy"})
        </span>
      </h1>
      <p className="text-lg text-gray-700">
        {translations.you_have || "Masz"}{" "}
        <span className="font-semibold text-green-600">
          {userData.balance || "0"}
        </span>{" "}
        {translations.tokens_on_your_account || "tokenów na swoim koncie"}.
      </p>
      
      <button className="mt-4 px-6 py-3 bg-blue-500 text-white rounded-lg text-lg font-semibold hover:bg-blue-600 transition">
        {translations.top_up_account || "Doładuj konto"}
      </button>

      {/* Osadzenie formularza płatności */}
      <div className="mt-6">
        <Checkout />
      </div>
    </div>
  );
};

export default AccountPage;
