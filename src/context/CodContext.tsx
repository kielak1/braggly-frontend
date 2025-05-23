"use client";

import { createContext, useContext, useState } from "react";

interface CodContextType {
  currentQuery: string | null;
  formula: string | null;
  codId: string | null; // ⬅️ nowa zmienna
  isBeingImported: boolean;
  setCurrentQuery: (q: string | null) => void;
  setFormula: (f: string | null) => void;
  setCodId: (id: string | null) => void; // ⬅️ nowy setter
  setIsBeingImported: (b: boolean) => void;
}

const CodContext = createContext<CodContextType | undefined>(undefined);

export const CodProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentQuery, setCurrentQuery] = useState<string | null>(null);
  const [formula, setFormula] = useState<string | null>(null);
  const [isBeingImported, setIsBeingImported] = useState(false);
  const [codId, setCodId] = useState<string | null>(null);

  return (
    <CodContext.Provider
      value={{
        currentQuery,
        setCurrentQuery,
        formula,
        setFormula,
        codId,
        setCodId,
        isBeingImported,
        setIsBeingImported,
      }}
    >
      {children}
    </CodContext.Provider>
  );
};

export const useCodSearch = () => {
  const context = useContext(CodContext);
  if (!context)
    throw new Error("useCodSearch must be used within CodSearchProvider");
  return context;
};
