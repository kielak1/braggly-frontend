import { cookies } from "next/headers";
import { getTranslations } from "@/lib/i18n";
import Image from "next/image";
import Link from "next/link";

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

      {/* Sekcja z polityką prywatności i warunkami użytkowania (statyczna) */}
      <div className="relative bg-black/60 text-white px-6 py-10 max-w-4xl mx-auto mt-10 mb-10 rounded-lg backdrop-blur-md">
        <h2 className="text-3xl font-bold mb-6 text-center">
          {translations.legal_info || "Legal Information"}
        </h2>

        {/* Polityka prywatności */}
        <div className="mb-8">
          <h3 className="text-2xl font-semibold mb-4">
            {translations.title || "Privacy Policy"}
          </h3>
          <div className="text-gray-300 space-y-3">
            <p>{translations.admin || "The data controller is the owner of the application. Contact details are provided below."}</p>
            <p>{translations.scope || "The application collects and stores only the data necessary for login: username and password (encrypted)."}</p>
            <p>{translations.purpose || "Personal data is used solely to enable the user to log into the application."}</p>
            <p>{translations.legal || "The legal basis for data processing is the legitimate interest of the controller – ensuring functionality and security."}</p>
            <p>{translations.sharing || "Data is not shared with third parties, except as required by law."}</p>
            <p>{translations.rights || "Users have the right to access, correct, delete, and restrict the processing of their data."}</p>
            <p>{translations.security || "Passwords are stored in encrypted form using secure mechanisms."}</p>
            <p>{translations.cookies || "The application does not use tracking mechanisms."}</p>
            <p>{translations.contact || "For data-related matters, contact us at: tadeusz@kielak.com"}</p>
          </div>
        </div>

        {/* Warunki użytkowania */}
        <div>
          <h3 className="text-2xl font-semibold mb-4">
            {translations.terms_title || "Terms of Service"}
          </h3>
          <div className="text-gray-300 space-y-3">
            <p>{translations.general || "By using Braggly, you agree to the following terms and conditions."}</p>
            <p>{translations.storage || "Users are responsible for the content they upload, including ensuring it does not violate any laws or third-party rights."}</p>
            <p>{translations.liability || "Braggly reserves the right to remove any content that violates these terms."}</p>
            <p>{translations.payments || "The application is provided 'as is' without warranties of any kind."}</p>
            <p>{translations.changes || "Braggly is not liable for any damages resulting from the use of the application."}</p>
            <p>{translations.terms_contact || "For any questions, contact us at: tadeusz@kielak.com"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}