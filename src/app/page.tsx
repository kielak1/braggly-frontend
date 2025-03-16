import { cookies } from "next/headers";
import { getTranslations } from "@/lib/i18n";
import Image from "next/image";

export default async function Home() {
  const cookieStore = await cookies();
  const locale = cookieStore.get("locale")?.value || "en";
  const translations = await getTranslations(locale);

  return (
    <div >
      {/* Obrazek jako tło */}
      <Image
        src="/braggly_xrd_graphic.png"
        alt="XRD Spectroscopy Graph"
        width={1920}
        height={1080}
      //  objectFit="cover"
        priority
     //   className="absolute top-0 left-0 w-full h-full z-[-1]"
      />

      {/* Tekst na tle
      <div className="relative flex flex-col items-center justify-center bg-black/60 text-white text-center px-6 py-10 rounded-lg backdrop-blur-md max-w-2xl">
        <h1 className="text-5xl font-extrabold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
          Braggly!!!
        </h1>
        <p className="text-2xl mt-4">{translations.greeting || "Loading..."}</p>
        <p className="text-lg mt-2">{translations.welcome}</p>
      </div> */}
    </div>
  );
}
