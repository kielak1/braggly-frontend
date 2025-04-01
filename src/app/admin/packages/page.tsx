"use client";

import { useState, useEffect, useCallback } from "react";
import {
  fetchCreditPackages,
  deleteCreditPackage,
  addCreditPackage,
  CreditPackage,
} from "@/utils/api";
import "@/styles/globals.css";
import { useTranslations } from "@/context/TranslationsContext"; // ✅

const Dashboard = () => {
  const { translations } = useTranslations(); // ✅
  const [userData, setUserData] = useState<Record<string, string> | null>(null);
  const [creditPackages, setCreditPackages] = useState<CreditPackage[] | null>(
    null
  );
  const [newCredits, setNewCredits] = useState(0);
  const [newPrice, setNewPrice] = useState(0);
  const [refresh, setRefresh] = useState(false);

  const loadCreditPackages = useCallback(async () => {
    const packages = await fetchCreditPackages();
    setCreditPackages(packages);
  }, []);

  useEffect(() => {
    loadCreditPackages();
  }, [loadCreditPackages, refresh]);

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

  const handleDelete = async (id: number) => {
    const msg =
      translations?.confirm_delete_package?.replace("{id}", id.toString()) ||
      `Czy na pewno chcesz usunąć pakiet o ID ${id}?`;
    if (confirm(msg)) {
      if (await deleteCreditPackage(id)) {
        setRefresh((prev) => !prev);
      }
    }
  };

  const handleAddPackage = async () => {
    if (newCredits <= 0 || newPrice <= 0) {
      alert(
        translations?.invalid_package_values ||
          "Wartości kredytów i ceny muszą być większe od zera."
      );
      return;
    }

    const newPackage = await addCreditPackage(newCredits, newPrice);
    if (newPackage) {
      setRefresh((prev) => !prev);
      setNewCredits(0);
      setNewPrice(0);
    }
  };

  if (!translations || !userData || !creditPackages) {
    return <div>Ładowanie...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto p-6 bg-gray-100 rounded-lg shadow-md mt-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-4">
        {translations.packages_header || "Pakiety kredytów"}
      </h1>
      <ul className="space-y-4">
        {creditPackages.length > 0 ? (
          creditPackages.map((pkg) => (
            <li
              key={pkg.id}
              className="flex justify-between items-center p-4 bg-white rounded shadow"
            >
              <span>
                {translations.credits}: {pkg.credits}, {translations.price}:{" "}
                {(pkg.priceInCents / 100).toFixed(2)} zł
              </span>
              <button
                onClick={() => handleDelete(pkg.id)}
                className="bg-red-500 text-white px-3 py-1 rounded"
              >
                {translations.delete || "Usuń"}
              </button>
            </li>
          ))
        ) : (
          <li className="text-gray-500">
            {translations.no_packages || "Brak pakietów."}
          </li>
        )}
      </ul>

      <div className="mt-6 p-4 bg-white rounded shadow">
        <h2 className="text-xl font-bold mb-2">
          {translations.add_package || "Dodaj pakiet"}
        </h2>
        <input
          type="number"
          value={newCredits}
          onChange={(e) => setNewCredits(Number(e.target.value))}
          placeholder={translations.credits || "Kredyty"}
          className="border p-2 mr-2"
        />
        <input
          type="number"
          value={newPrice}
          onChange={(e) => setNewPrice(Number(e.target.value))}
          placeholder={translations.price || "Cena"}
          className="border p-2 mr-2"
        />
        <button
          onClick={handleAddPackage}
          className="bg-green-500 text-white px-3 py-1 rounded"
        >
          {translations.add || "Dodaj"}
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
