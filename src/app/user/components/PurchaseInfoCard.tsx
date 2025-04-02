"use client";

import { useEffect, useState } from "react";
import {
  fetchPurchaseHistory,
  PurchaseHistory,
  fetchBoolParameterByName,
  isParameterEnabled,
} from "@/utils/api";
import { useTranslations } from "@/context/TranslationsContext";

const PurchaseInfoCard = ({ userId }: { userId: number }) => {
  const { translations } = useTranslations();
  const [history, setHistory] = useState<PurchaseHistory[] | null>(null);

  useEffect(() => {
    const loadData = async () => {
      const purchases = await fetchPurchaseHistory(userId);
      setHistory(purchases);
    };
    loadData();
  }, [userId]);

  if (!translations) return null;

  return (
    <div className="bg-white border rounded-lg p-4 shadow-sm">
      <h2 className="font-semibold text-lg mb-2">
        {translations.welcome} 📦{" "}
        {translations.purchase_info || "Purchase History / Info"}
      </h2>

      {history && history.length > 0 ? (
        <ul className="space-y-2">
          {history
            .slice()
            .sort(
              (a, b) =>
                new Date(b.purchaseDate).getTime() -
                new Date(a.purchaseDate).getTime()
            )
            .map((item) => (
              <li
                key={item.id}
                className="text-gray-700 flex justify-between items-center"
              >
                <span>
                  {translations.bought || "Kupiono"}{" "}
                  <span className="font-semibold">{item.creditsPurchased}</span>{" "}
                  {translations.credits || "kredytów"} {translations.zaco}{" "}
                  <span className="font-semibold">
                    {(item.amountPaid / 100).toFixed(2)} zł
                  </span>{" "}
                  - {new Date(item.purchaseDate).toLocaleString()}
                </span>
                <span className="text-sm text-gray-500">{item.paymentId}</span>
              </li>
            ))}
        </ul>
      ) : (
        <p className="text-gray-500">
          {translations.no_purchases || "Brak historii zakupów"}
        </p>
      )}
    </div>
  );
};

export default PurchaseInfoCard;
