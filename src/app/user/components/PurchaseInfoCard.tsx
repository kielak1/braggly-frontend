"use client";

import { useEffect, useState } from "react";
import {
  fetchPurchaseHistory,
  PurchaseHistory,
  fetchBoolParameterByName,
  isParameterEnabled,
} from "@/utils/api";
import { useTranslations } from "@/context/TranslationsContext";

interface PurchaseInfoCardProps {
  userId: number;
  userName: string;
  balance: number;
  role: string;
  freeAccess: boolean;
}
const PurchaseInfoCard = ({
  userId,
  userName,
  balance,
  role,
  freeAccess,
}: PurchaseInfoCardProps) => {
  const { translations } = useTranslations();
  const [history, setHistory] = useState<PurchaseHistory[] | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!userId || isNaN(userId)) return;
      const purchases = await fetchPurchaseHistory(userId);
      setHistory(purchases);
    };
    loadData();
  }, [userId]);

  if (!translations) return null;
  const hasAccessToPaidFeatures = freeAccess || balance > 0;
  const balanceColor = hasAccessToPaidFeatures
    ? "text-green-600"
    : "text-red-600";

  return (
    <div className="bg-white border rounded-lg p-4 shadow-sm">
      <h2 className="font-semibold text-lg mb-2">
        <span className="text-gray-800">{userName}</span>{" "}
        <span className="text-gray-600">
          {translations.you_own || "possess"}
        </span>{" "}
        <span className={`font-bold ${balanceColor}`}>
          {balance}
          <span role="img" aria-label="gold coin" className="ml-1">
            💰
          </span>
        </span>{" "}
        <span className="text-sm text-gray-500">
          ({balance} {translations.days || "days"})
        </span>
      </h2>

      <div className="flex justify-center mb-6">
        <a
          href="/user/account"
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded shadow transition duration-200"
        >
          {translations.buy_tokens || "Kup tokeny"}
        </a>
      </div>
      <h2 className="text-lg font-semibold text-gray-800 mb-3">
        {translations.purchase_info || "Purchase History"}
      </h2>

      {history && history.length > 0 ? (
        <div className="w-full border border-gray-200 rounded-md overflow-hidden max-h-[300px] overflow-y-auto">
          <div className="grid grid-cols-3 bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700">
            <div>{translations.purchase_date || "Data zakupu"}</div>
            <div>{translations.tokens || "Liczba tokenów"}</div>
            <div>{translations.payment_id || "Identyfikator płatności"}</div>
          </div>

          {history
            .slice()
            .sort(
              (a, b) =>
                new Date(b.purchaseDate).getTime() -
                new Date(a.purchaseDate).getTime()
            )
            .map((item) => (
              <div
                key={item.id}
                className="grid grid-cols-3 px-4 py-2 text-sm text-gray-800 border-t border-gray-100 hover:bg-gray-50 transition"
              >
                <div>{new Date(item.purchaseDate).toLocaleString()}</div>
                <div className="font-semibold">{item.creditsPurchased}</div>
                <div className="text-gray-500">{item.paymentId}</div>
              </div>
            ))}
        </div>
      ) : (
        <p className="text-gray-500">
          {translations.no_purchases || "Brak historii zakupów"}
        </p>
      )}
    </div>
  );
};

export default PurchaseInfoCard;
