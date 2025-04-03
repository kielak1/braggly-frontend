"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "@/context/TranslationsContext";
import { fetchBoolParameterByName, isParameterEnabled } from "@/utils/api";
import "@/styles/globals.css";

import PurchaseInfoCard from "@/user/components/PurchaseInfoCard";
import UserFilesCard from "@/user/components/UserFilesCard";
import PublicFilesCard from "@/user/components/PublicFilesCard";
import SelectedFilesCard from "@/user/components/SelectedFilesCard";

const Dashboard = () => {
  const { translations } = useTranslations();

  const [userData, setUserData] = useState<Record<string, string> | null>(null);
  const [freeAccess, setFreeAccess] = useState<boolean>(true);

  useEffect(() => {
    const checkFreeAccess = async () => {
      const param = await fetchBoolParameterByName("free_access");
      setFreeAccess(isParameterEnabled(param));
    };
    checkFreeAccess();
  }, []);

  useEffect(() => {
    const fetchData = () => {
      const storedData = localStorage.getItem("userData");
      if (storedData) {
        try {
          const parsed = JSON.parse(storedData);
          setUserData(parsed);
        } catch (error) {
          console.error("Błąd parsowania danych z localStorage:", error);
        }
      }
    };

    fetchData();
  }, []);

  if (!translations) {
    return <div>Ładowanie tłumaczeń...</div>;
  }

  const userId = Number(userData?.id);
  const userName = userData?.username;
  const balance = Number(userData?.balance);
  const role = userData?.role;

  const sharedProps = {
    userId,
    userName: userName || "",
    balance,
    role: role || "",
    freeAccess,
  };

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold">User Dashboard</h1>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="col-span-2 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <UserFilesCard {...sharedProps} />
            <PublicFilesCard {...sharedProps} />
          </div>
        </div>
        <PurchaseInfoCard {...sharedProps} />
      </div>
      <SelectedFilesCard {...sharedProps} />
    </div>
  );
};

export default Dashboard;
