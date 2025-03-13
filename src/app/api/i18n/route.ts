import { NextResponse } from "next/server";
import path from "path";
import { promises as fs } from "fs";

export async function GET(req: Request) {
  try {
    // Pobierz język z query params, domyślnie "en"
    const { searchParams } = new URL(req.url);
    const locale = searchParams.get("locale") || "en";

    // Upewnij się, że odczytujesz pliki z `public/locales/`
    const filePath = path.join(process.cwd(), "public", "locales", locale, "common.json");

    console.log(`🔍 Próba odczytu pliku: ${filePath}`);

    // Sprawdzenie, czy plik istnieje
    try {
      await fs.access(filePath);
    } catch (error) {
      console.error(`❌ Plik tłumaczeń nie istnieje: ${filePath}`);
      return NextResponse.json({ error: `Nie znaleziono pliku dla języka: ${locale}` }, { status: 404 });
    }

    // Wczytaj plik tłumaczeń
    const fileContents = await fs.readFile(filePath, "utf8");
    const translations = JSON.parse(fileContents);

    // Zwróć tłumaczenia jako JSON
    return NextResponse.json(translations);
  } catch (error) {
    console.error("❌ Błąd ładowania tłumaczeń:", error);
    return NextResponse.json({ error: "Nie udało się załadować tłumaczeń" }, { status: 500 });
  }
}
