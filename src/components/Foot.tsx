"use client";

import Link from "next/link";
import { useTranslations } from "@/context/TranslationsContext"; // ✅ nowy hook

export default function Foot() {
  const { translations } = useTranslations(); // ✅ pobranie tłumaczeń z kontekstu

  return (
    <footer className="w-full bg-gray-100 text-center py-4 text-sm text-gray-600 border-t mt-8">
      <div className="mb-1">
        © {new Date().getFullYear()} {translations?.app_name || "Braggly"}.{" "}
        {translations?.rights_reserved || "Wszelkie prawa zastrzeżone."}
      </div>
      <div className="space-x-4">
        <Link href="/" className="text-blue-600 hover:underline">
          {translations?.homepage || "Strona główna"}
        </Link>
        <Link href="/privacy-policy" className="text-blue-600 hover:underline">
          {translations?.privacy_link || "Polityka prywatności"}
        </Link>
        <Link href="/terms" className="text-blue-600 hover:underline">
          {translations?.terms_title || "Regulamin"}
        </Link>
      </div>
    </footer>
  );
}
