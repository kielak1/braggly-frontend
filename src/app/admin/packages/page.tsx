"use client";

import { useState, useEffect, useCallback } from "react";
import { getCookie } from "@/utils/cookies";
import { useFetchTranslations } from "@/utils/fetchTranslations";
import {
  fetchCreditPackages,
  deleteCreditPackage,
  addCreditPackage,
  CreditPackage,
} from "@/utils/api";
import "@/styles/globals.css";

const Dashboard = () => {
  const [translations, setTranslations] = useState<Record<
    string,
    string
  > | null>(null);
  const [userData, setUserData] = useState<Record<string, string> | null>(null);
  const [creditPackages, setCreditPackages] = useState<CreditPackage[] | null>(
    null
  );
  const [newCredits, setNewCredits] = useState(0);
  const [newPrice, setNewPrice] = useState(0);
  const [refresh, setRefresh] = useState(false);

  useFetchTranslations(setTranslations, getCookie);

  const loadCreditPackages = useCallback(async () => {
    const packages = await fetchCreditPackages();
    setCreditPackages(packages);
  }, []);

  useEffect(() => {
    loadCreditPackages();
  }, [loadCreditPackages, refresh]); // Dodano loadCreditPackages do zależności

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
    if (await deleteCreditPackage(id)) {
      setRefresh((prev) => !prev);
    }
  };

  const handleAddPackage = async () => {
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
    <div className="max-w-2xl mx-auto p-6 bg-gray-100 rounded-lg shadow-md mt-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-4">
        {translations.packages_header}
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
                {pkg.priceInCents / 100} zł
              </span>
              <button
                onClick={() => handleDelete(pkg.id)}
                className="bg-red-500 text-white px-3 py-1 rounded"
              >
                {translations.delete}
              </button>
            </li>
          ))
        ) : (
          <li className="text-gray-500">{translations.no_packages}</li>
        )}
      </ul>
      <div className="mt-6 p-4 bg-white rounded shadow">
        <h2 className="text-xl font-bold mb-2">{translations.add_package}</h2>
        <input
          type="number"
          value={newCredits}
          onChange={(e) => setNewCredits(Number(e.target.value))}
          placeholder={translations.credits}
          className="border p-2 mr-2"
        />
        <input
          type="number"
          value={newPrice}
          onChange={(e) => setNewPrice(Number(e.target.value))}
          placeholder={translations.price}
          className="border p-2 mr-2"
        />
        <button
          onClick={handleAddPackage}
          className="bg-green-500 text-white px-3 py-1 rounded"
        >
          {translations.add}
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
