"use client";

import Link from "next/link";
import { useState } from "react";
import { getCookie } from "@/utils/cookies";
import { useFetchTranslations } from "@/utils/fetchTranslations";

const AdminSidebar = () => {
  const [translations, setTranslations] = useState<Record<
    string,
    string
  > | null>(null);

  useFetchTranslations(setTranslations, getCookie);

  // Jeśli tłumaczenia nie są jeszcze załadowane, pokaż stan ładowania
  if (!translations) {
    return (
      <aside className="w-64 bg-gray-900 text-white h-screen p-4">
        Ładowanie...
      </aside>
    );
  }

  return (
    <aside className="w-64 bg-gray-900 text-white h-screen p-4">
      <h2 className="text-lg font-bold mb-4">{translations.admin_panel}</h2>
      <ul className="space-y-2">
        <li>
          <Link href="/admin" className="block p-2 rounded hover:bg-gray-700">
            {translations.main_panel_window}
          </Link>
        </li>
        <li>
          <Link
            href="/admin/users"
            className="block p-2 rounded hover:bg-gray-700"
          >
            {translations.users}
          </Link>
        </li>
        <li>
          <Link
            href="/admin/packages"
            className="block p-2 rounded hover:bg-gray-700"
          >
            {translations.token_packages}
          </Link>
        </li>
      </ul>
    </aside>
  );
};

export default AdminSidebar;
