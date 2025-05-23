import { promises as fs } from "fs";
import path from "path";

export async function getTranslations(locale: string) {
  const filePath = path.join(
    process.cwd(),
    "public",
    "locales",
    locale,
    "common.json"
  );
  try {
    const fileContents = await fs.readFile(filePath, "utf-8");
    return JSON.parse(fileContents);
  } catch (error) {
    console.error("❌ Błąd ładowania tłumaczeń:", error);
    return {};
  }
}
