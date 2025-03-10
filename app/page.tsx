import { cookies } from "next/headers";
import { getTranslations } from "@/lib/i18n";

export default async function Home() {
  const cookieStore = await cookies();
  const locale = cookieStore.get("locale")?.value || "es"; // Domyślnie angielski
  const translations = await getTranslations(locale);
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
  return (
    <div>
      <h1>Backend URL: {backendUrl}  </h1>;
      <h1 className="text-3xl font-bold text-blue-600">Braggly!!! 🚀</h1>
      <h1>{translations.greeting || "Loading..."}</h1>
      <p>{translations.welcome}</p>
    </div>
  );s
}
