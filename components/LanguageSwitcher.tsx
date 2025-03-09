"use client";

import { useEffect, useState } from "react";

export default function LanguageSwitcher() {
  const [locale, setLocale] = useState("en");

  useEffect(() => {
    const storedLang = document.cookie
      .split("; ")
      .find((row) => row.startsWith("locale="))
      ?.split("=")[1];
    if (storedLang) setLocale(storedLang);
  }, []);

  const changeLanguage = (lang: string) => {
    document.cookie = `locale=${lang}; path=/; max-age=31536000`; // 1 rok
    setLocale(lang);
    window.location.reload(); // Odświeżamy stronę, aby zastosować nowy język
  };

  return (
    <div>
      <button onClick={() => changeLanguage("en")}>🇬🇧 English</button>
      <button onClick={() => changeLanguage("pl")}>🇵🇱 Polski</button>
      <button onClick={() => changeLanguage("es")}>🇪🇸 Español</button>
    </div>
  );
}
