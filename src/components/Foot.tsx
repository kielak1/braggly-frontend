"use client";

import Link from "next/link";
import { useState } from "react";
import { getCookie } from "@/utils/cookies";
import { useFetchTranslations } from "@/utils/fetchTranslations";

export default function Foot() {
  const [translations, setTranslations] = useState<Record<string, string> | null>(null);
  useFetchTranslations(setTranslations, getCookie );

  if (!translations) return null;

  return (
    <footer className="w-full bg-gray-100 text-center py-4 text-sm text-gray-600 border-t mt-8">
      <div className="mb-1">
        © {new Date().getFullYear()} {translations.app_name || "Twoja Aplikacja"}. {translations.rights_reserved || "Wszelkie prawa zastrzeżone."}
      </div>
      <div className="space-x-4">
        <Link href="/" className="text-blue-600 hover:underline">
          {translations.homepage || "Strona główna"}
        </Link>
        <Link href="/privacy-policy" className="text-blue-600 hover:underline">
          {translations.privacy_link || "Polityka prywatności"}
        </Link>
      </div>
    </footer>
  );
}
