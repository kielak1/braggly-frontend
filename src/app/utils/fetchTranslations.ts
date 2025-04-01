import { useEffect } from "react";

export const useFetchTranslations = (
  setTranslations: (data: Record<string, string>) => void,
  getCookie: (name: string) => string | null
) => {
  useEffect(() => {
    const fetchTranslations = async () => {
      const locale = getCookie("locale") || "en";
      try {
        const response = await fetch(`/api/i18n?locale=${locale}`);
        if (!response.ok) throw new Error("Błąd pobierania tłumaczeń");
        const data = await response.json();
        setTranslations(data);
      } catch (error) {
        console.error("Błąd pobierania tłumaczeń:", error);
      }
    };

    fetchTranslations();
  }, [getCookie, setTranslations]);
};
