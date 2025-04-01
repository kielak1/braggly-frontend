"use client";

import { useTranslations } from "@/context/TranslationsContext"; // ✅ kontekst tłumaczeń

export default function PrivacyPolicyPage() {
  const { translations } = useTranslations(); // ✅ globalne tłumaczenia

  if (!translations) {
    return <div>Ładowanie...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">{translations.title}</h1>
      <div className="space-y-4 text-justify">
        <p>{translations.admin}</p>
        <p>{translations.scope}</p>
        <p>{translations.purpose}</p>
        <p>{translations.legal}</p>
        <p>{translations.sharing}</p>
        <p>{translations.rights}</p>
        <p>{translations.security}</p>
        <p>{translations.cookies}</p>
        <p>{translations.contact}</p>
      </div>
    </div>
  );
}
