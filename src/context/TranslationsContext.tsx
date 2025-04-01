// src/context/TranslationsContext.tsx

"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useFetchTranslations } from "@/utils/fetchTranslations";
import { getCookie } from "@/utils/cookies";

// Typ kontekstu
interface TranslationsContextType {
  translations: Record<string, string> | null;
}

// Utwórz kontekst
const TranslationsContext = createContext<TranslationsContextType>({
  translations: null,
});

// Provider
export const TranslationsProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [translations, setTranslations] = useState<Record<
    string,
    string
  > | null>(null);

  useFetchTranslations(setTranslations, getCookie);

  return (
    <TranslationsContext.Provider value={{ translations }}>
      {children}
    </TranslationsContext.Provider>
  );
};

// Hook pomocniczy
export const useTranslations = () => useContext(TranslationsContext);
