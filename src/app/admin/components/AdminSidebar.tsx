"use client";

import Link from "next/link";
import { useTranslations } from "@/context/TranslationsContext"; // ✅ nowy import

const AdminSidebar = () => {
  const { translations } = useTranslations(); // ✅ użycie kontekstu

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
          <Link
            href="/admin/parameters"
            className="block p-2 rounded hover:bg-gray-700"
          >
            {translations.param_sidebar || "parametry"}
          </Link>
          <Link
            href="/admin/restricted-paths"
            className="block p-2 rounded hover:bg-gray-700"
          >
            {translations.resticted_paths || "Płatne usługi"}
          </Link>
        </li>
      </ul>
    </aside>
  );
};

export default AdminSidebar;
