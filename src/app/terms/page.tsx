"use client";

import { useEffect, useState } from "react";
import { getCookie } from "@/utils/cookies";
import { useFetchTranslations } from "@/utils/fetchTranslations";

export default function TermsPage() {
  const [translations, setTranslations] = useState<Record<
    string,
    string
  > | null>(null);

  useFetchTranslations(setTranslations, getCookie);

  if (!translations) {
    return <div>Ładowanie...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">{translations.terms_title}</h1>
      <div className="space-y-4 text-justify">
        <p>{translations.general}</p>
        <p>{translations.storage}</p>
        <p>{translations.liability}</p>
        <p>{translations.payments}</p>
        <p>{translations.changes}</p>
        <p>{translations.terms_contact}</p>
      </div>
    </div>
  );
}
