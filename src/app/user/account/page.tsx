"use client";

import { useState, useEffect } from "react";
import "@/styles/globals.css";
import Checkout from "@/components/Checkout";
import { fetchBoolParameterByName, isParameterEnabled } from "@/utils/api";
import { useTranslations } from "@/context/TranslationsContext"; // ✅

const AccountPage = () => {
  const { translations } = useTranslations(); // ✅ tłumaczenia globalne
  const [userData, setUserData] = useState<Record<string, string> | null>(null);
  const [freeAccess, setFreeAccess] = useState<boolean>(true);

  // Sprawdzenie flagi dostępu
  useEffect(() => {
    const checkFreeAccess = async () => {
      const param = await fetchBoolParameterByName("free_access");
      setFreeAccess(isParameterEnabled(param));
    };
    checkFreeAccess();
  }, []);

  // Pobieranie danych użytkownika z localStorage przy montowaniu komponentu
  const updateUserData = () => {
    try {
      const storedData = localStorage.getItem("userData");
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        if (typeof parsedData === "object" && parsedData !== null) {
          setUserData(
            Object.fromEntries(
              Object.entries(parsedData).map(([key, value]) => [
                key,
                String(value),
              ])
            )
          );
        }
      } else {
        setUserData({ username: "Brak nazwy", balance: "0" });
      }
    } catch (error) {
      console.error("Błąd parsowania danych z localStorage:", error);
      setUserData({ username: "Brak nazwy", balance: "0" });
    }
  };

  useEffect(() => {
    updateUserData();
  }, []);

  // Obsługa ładowania
  if (!translations || !userData) {
    return (
      <div className="text-center text-gray-600 text-lg mt-6">Ładowanie...</div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6 bg-gray-100 rounded-lg shadow-md mt-6">
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

      {freeAccess ? (
        <p className="italic text-gray-600">
          {translations.donations ||
            "Dostęp tymczasowo jest darmowy. Możesz jednak wesprzeć projekt dobrowolną wpłatą 💖"}
        </p>
      ) : (
        <p className="italic text-gray-600">
          {translations.what_are_tokens_for ||
            "Tokeny służą do zakupu analiz i usług XRD."}
        </p>
      )}

      {/* Osadzenie formularza płatności */}
      <div className="mt-6">
        <Checkout updateUserData={updateUserData} />
      </div>
    </div>
  );
};

export default AccountPage;
