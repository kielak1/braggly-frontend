import os
import re
import json
from pathlib import Path
from openai import OpenAI

SRC_DIR = "src"
LOCALES_DIR = "public/locales"
TRANSLATION_PATTERN = r"translations\.([a-zA-Z0-9_]+)(?:\s*\|\|\s*[\"'](.+?)[\"'])?"

# Ustawienie klienta OpenAI
client = OpenAI(api_key=os.getenv("OPEN_AI_KEY"))


def extract_translation_keys_from_src():
    """Zbiera klucze tłumaczeń oraz wartości domyślne z plików źródłowych"""
    keys_with_defaults = {}
    print(f"🔍 Przeszukiwanie katalogu: {SRC_DIR}")
    for root, _, files in os.walk(SRC_DIR):
        for file in files:
            if file.endswith((".tsx", ".ts", ".js")):
                file_path = os.path.join(root, file)
                with open(file_path, "r", encoding="utf-8") as f:
                    content = f.read()
                    matches = re.findall(TRANSLATION_PATTERN, content)
                    for key, default in matches:
                        if key not in keys_with_defaults:
                            keys_with_defaults[key] = default or None
    return keys_with_defaults


def load_locale_files():
    """Ładuje pliki tłumaczeń JSON z katalogu locales"""
    locales = {}
    paths = {}
    print(f"📁 Ładowanie plików tłumaczeń z: {LOCALES_DIR}")
    for lang in os.listdir(LOCALES_DIR):
        lang_path = os.path.join(LOCALES_DIR, lang, "common.json")
        if os.path.isfile(lang_path):
            with open(lang_path, "r", encoding="utf-8") as f:
                try:
                    locales[lang] = json.load(f)
                    paths[lang] = lang_path
                    print(f"✅ Załadowano {lang}: {len(locales[lang])} kluczy")
                except json.JSONDecodeError as e:
                    print(f"❌ Błąd JSON w pliku {lang_path}: {e}")
    return locales, paths


def find_missing_translations(used_keys, locale_dict):
    """Zwraca brakujące pary (klucz, język)"""
    missing = []
    for key in used_keys:
        for lang, translations in locale_dict.items():
            if key not in translations:
                missing.append((key, lang))
    return missing


def generate_translation(prompt, target_lang_code):
    """Używa OpenAI do przetłumaczenia tekstu"""
    try:
        system_prompt = f"Tłumacz tekst na język {target_lang_code} w neutralnym tonie:"
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        print(f"❌ Błąd tłumaczenia OpenAI: {e}")
        return None


def fill_missing_translations_auto(missing, locales, paths, defaults):
    """Automatycznie uzupełnia brakujące tłumaczenia na podstawie języka polskiego lub wartości domyślnej"""
    updated_languages = set()

    for key, lang in missing:
        if lang == "pl":
            continue  # Nie tłumaczymy na polski

        base_text = locales.get("pl", {}).get(key) or defaults.get(key)
        if not base_text:
            print(f"⚠️ Brak tekstu źródłowego dla klucza: {key}, pomijam...")
            continue

        translated = generate_translation(base_text, lang)
        if translated:
            locales[lang][key] = translated
            updated_languages.add(lang)
            print(f"✅ Dodano tłumaczenie '{key}' [{lang}]: {translated}")
        else:
            print(f"⚠️ Nie udało się przetłumaczyć '{key}' na [{lang}]")

    # Zapis do plików
    for lang in updated_languages:
        with open(paths[lang], "w", encoding="utf-8") as f:
            json.dump(locales[lang], f, indent=2, ensure_ascii=False)
        print(f"💾 Plik zapisany: {paths[lang]}")


def main():
    used_keys = extract_translation_keys_from_src()
    locales, paths = load_locale_files()
    missing = find_missing_translations(used_keys, locales)

    if not missing:
        print("🎉 Wszystkie tłumaczenia są obecne.")
    else:
        print(f"\n🚫 Znaleziono {len(missing)} brakujących tłumaczeń.")
        fill_missing_translations_auto(missing, locales, paths, used_keys)


if __name__ == "__main__":
    main()
