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
    try {
      const storedLang =
        document.cookie
          .split("; ")
          .find((row) => row.startsWith("locale="))
          ?.split("=")[1] || (typeof localStorage !== "undefined" ? localStorage.getItem("locale") : null);

      setLocale(storedLang || "en");
    } catch (error) {
      console.error("Błąd odczytu języka:", error);
      setLocale("en");
    }
  }, []);

  const changeLanguage = (lang: string) => {
    try {
      const isSecure = window.location.protocol === "https:";
      document.cookie = `locale=${lang}; path=/; max-age=31536000; ${isSecure ? "Secure; SameSite=Lax" : "SameSite=Lax"}`;

      if (typeof localStorage !== "undefined") {
        localStorage.setItem("locale", lang);
      }

      setLocale(lang);

      setTimeout(() => {
        window.location.href = window.location.href;
      }, 50);
    } catch (error) {
      console.error("Błąd zapisu języka:", error);
    }
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
