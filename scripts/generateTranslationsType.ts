// scripts/generateTranslationsType.ts
import * as fs from "fs";
import * as path from "path";
import JsonToTS from "json-to-ts";
import { fileURLToPath } from "url";

// Oblicz __dirname w ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const translationsPath = path.resolve(__dirname, "../public/locales/en/common.json");
const outputPath = path.resolve(__dirname, "../src/types/translations.ts");

const translations = JSON.parse(fs.readFileSync(translationsPath, "utf-8"));

const interfaces = JsonToTS(translations, { rootName: "Translations" });

const content = interfaces.join("\n\n");

fs.writeFileSync(outputPath, content, "utf-8");

console.log("Translations type generated successfully!");