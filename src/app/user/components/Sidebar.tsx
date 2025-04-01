"use client";

import Link from "next/link";
import { useTranslations } from "@/context/TranslationsContext"; // ✅

const Sidebar = () => {
  const { translations } = useTranslations(); // ✅

  if (!translations) {
    return (
      <aside className="w-64 bg-gray-900 text-white h-screen p-4">
        Ładowanie...
      </aside>
    );
  }

  return (
    <aside className="w-64 bg-gray-900 text-white h-screen p-4">
      <h2 className="text-lg font-bold mb-4">{translations.panel}</h2>
      <ul className="space-y-2">
        <li>
          <Link href="/user" className="block p-2 rounded hover:bg-gray-700">
            {translations.dashboard}
          </Link>
        </li>
        <li>
          <Link
            href="/user/account"
            className="block p-2 rounded hover:bg-gray-700"
          >
            {translations.account}
          </Link>
        </li>
        <li>
          <Link
            href="/user/simple-uxd"
            className="block p-2 rounded hover:bg-gray-700"
          >
            {translations.simple_uxd}
          </Link>
        </li>
        <li>
          <Link
            href="/user/uploads"
            className="block p-2 rounded hover:bg-gray-700"
          >
            {translations.uploads}
          </Link>
        </li>
        <li>
          <Link
            href="/user/xrd-file-list"
            className="block p-2 rounded hover:bg-gray-700"
          >
            {translations.xrd_file_list}
          </Link>
        </li>
        <li>
          <Link
            href="/user/xrd-public-file-list"
            className="block p-2 rounded hover:bg-gray-700"
          >
            {translations.xrd_public_file_list}
          </Link>
        </li>
      </ul>
    </aside>
  );
};

export default Sidebar;
