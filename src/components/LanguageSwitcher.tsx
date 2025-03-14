"use client";

import { useEffect, useState } from "react";

const LANGUAGES = [
  { code: "en", label: "🇬🇧" },
  { code: "pl", label: "🇵🇱" },
  { code: "es", label: "🇪🇸" },
];

export default function LanguageSwitcher() {
  // const [locale, setLocale] = useState<string | null>(null);
  const [locale, setLocale] = useState("en");

  useEffect(() => {
    // Pobierz język zapisany w ciasteczkach lub localStorage
    const storedLang =
      document.cookie
        .split("; ")
        .find((row) => row.startsWith("locale="))
        ?.split("=")[1] || localStorage.getItem("locale");

    setLocale(storedLang || "en");
  }, []);

  const changeLanguage = (lang: string) => {
    try {
      const isSecure = window.location.protocol === "https:";
      document.cookie = `locale=${lang}; path=/; max-age=31536000; ${
        isSecure ? "Secure; SameSite=None" : "SameSite=Lax"
      }`;

      localStorage.setItem("locale", lang);
      setLocale(lang);
      window.location.reload();
    } catch (error) {
      console.error("Błąd zapisu języka:", error);
    }
  };

  if (!locale) {
    return null; // Nie renderuj nic, dopóki nie ma języka
  }

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
