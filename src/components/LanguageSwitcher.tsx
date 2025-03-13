"use client";

import { useEffect, useState } from "react";

const LANGUAGES = [
  { code: "en", label: "🇬🇧" },
  { code: "pl", label: "🇵🇱" },
  { code: "es", label: "🇪🇸" },
];

export default function LanguageSwitcher() {
  const [locale, setLocale] = useState("en");

  useEffect(() => {
    // Pobierz język zapisany w ciasteczkach
    const storedLang = document.cookie
      .split("; ")
      .find((row) => row.startsWith("locale="))
      ?.split("=")[1];

    if (storedLang) {
      setLocale(storedLang);
    }
  }, []);

  const changeLanguage = (lang: string) => {
    document.cookie = `locale=${lang}; path=/; max-age=31536000`; // 1 rok
    setLocale(lang);
    window.location.reload(); // Odświeżamy stronę, żeby załadować nowe tłumaczenia
  };

  return (
    <div className="relative">
      <select
        value={locale}
        onChange={(e) => changeLanguage(e.target.value)}
        className="p-2 border rounded-lg bg-white shadow-md text-gray-700"
      >
        {LANGUAGES.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.label}
          </option>
        ))}
      </select>
    </div>
  );
}
