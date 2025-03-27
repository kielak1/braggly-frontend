import { cookies } from "next/headers";
import { getTranslations } from "@/lib/i18n";
import Image from "next/image";
import Link from "next/link";
import ClientSection from "@/src/app/ClientSection"; // Nowy komponent po stronie klienta

// Komponent serwerowy
export default async function Home() {
  const cookieStore = await cookies();
  const locale = cookieStore.get("locale")?.value || "en";
  const translations = await getTranslations(locale);

  return (
    <div className="relative min-h-[calc(100vh-64px)] flex flex-col">
      {/* Obrazek jako tło */}
      <Image
        src="/braggly_xrd_graphic.png"
        alt="XRD Spectroscopy Graph"
        fill
        style={{ objectFit: "cover" }}
        priority
        className="z-[-1]"
      />

      {/* Sekcja powitalna */}
      <div className="relative flex flex-col items-center justify-center bg-black/60 text-white text-center px-6 py-10 rounded-lg backdrop-blur-md max-w-3xl mx-auto mt-10">
        <h1 className="text-5xl font-extrabold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
          Braggly !!!
        </h1>
        <p className="text-2xl mt-4">{translations.greeting || "Hello"}</p>
        <p className="text-lg mt-2">
          {translations.welcome || "Welcome to the Braggly system"}
        </p>
      </div>

      {/* Sekcja opisująca cel aplikacji */}
      <div className="relative flex flex-col items-center justify-center text-white text-center px-6 py-10 max-w-4xl mx-auto mt-10">
        <h2 className="text-3xl font-bold mb-4">
          {translations.app_purpose_title || "Discover the Power of XRD Analysis"}
        </h2>
        <p className="text-lg text-gray-200">
          {translations.app_purpose_description ||
            "Braggly is a cutting-edge platform for X-ray Diffraction (XRD) analysis. Upload your XRD files, analyze them with advanced tools, and explore a library of publicly shared XRD data from the community."}
        </p>
        <Link href="/public/xrd-public-file-list">
          <button className="mt-6 px-6 py-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-semibold rounded-lg hover:from-yellow-500 hover:to-orange-600 transition-all">
            {translations.explore_public_files || "Explore Public XRD Files"}
          </button>
        </Link>
      </div>

      {/* Sekcja z polityką prywatności i warunkami użytkowania (komponent po stronie klienta) */}
      <ClientSection translations={translations} />
    </div>
  );
}