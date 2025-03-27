import os
import re
import json
from pathlib import Path

SRC_DIR = "src"
LOCALES_DIR = "public/locales"
TRANSLATION_PATTERN = r"translations(?:\?)?\.([a-zA-Z0-9_]+)"

# 1. Zbieramy wszystkie klucze używane w kodzie
def extract_translation_keys_from_src():
    keys = set()
    print(f"Przeszukiwanie katalogu: {SRC_DIR}")
    for root, _, files in os.walk(SRC_DIR):
        for file in files:
            if file.endswith((".tsx", ".ts", ".js")):
                file_path = os.path.join(root, file)
                with open(file_path, "r", encoding="utf-8") as f:
                    content = f.read()
                    matches = re.findall(TRANSLATION_PATTERN, content)
                    if matches:
                        print(f"Znaleziono klucze w pliku {file_path}: {matches}")
                    keys.update(matches)
    return sorted(keys)

# 2. Ładujemy pliki JSON z tłumaczeniami
def load_locale_files():
    locales = {}
    paths = {}
    print(f"Przeszukiwanie katalogu: {LOCALES_DIR}")
    for lang in os.listdir(LOCALES_DIR):
        lang_path = os.path.join(LOCALES_DIR, lang, "common.json")
        print(f"Sprawdzam plik: {lang_path}")
        if os.path.isfile(lang_path):
            with open(lang_path, "r", encoding="utf-8") as f:
                try:
                    locales[lang] = json.load(f)
                    paths[lang] = lang_path
                    print(f"Załadowano tłumaczenia dla języka {lang}: {list(locales[lang].keys())}")
                except json.JSONDecodeError as e:
                    print(f"Błąd w pliku {lang_path}: {e}")
        else:
            print(f"Plik {lang_path} nie istnieje")
    return locales, paths

# 3. Sprawdzamy brakujące klucze
def find_missing_translations(used_keys, locale_dict):
    print(f"Znalezione klucze w kodzie: {used_keys}")
    missing = []
    for key in used_keys:
        for lang, translations in locale_dict.items():
            if key not in translations:
                missing.append((key, lang))
                print(f"Brak klucza '{key}' w języku '{lang}'")
    return missing

# 4. Interaktywnie uzupełniamy brakujące tłumaczenia
def fill_missing_translations(missing, locales, paths):
    updated_languages = set()

    for key, lang in missing:
        print(f"\n🔍 Brakuje tłumaczenia dla klucza: '{key}' w języku: '{lang}'")
        value = input("🔤 Podaj tłumaczenie (lub naciśnij Enter, by pominąć): ").strip()
        if value:
            locales[lang][key] = value
            updated_languages.add(lang)
            print(f"✅ Dodano: {key}: \"{value}\" → {paths[lang]}")

    # 5. Zapisujemy zaktualizowane pliki
    for lang in updated_languages:
        with open(paths[lang], "w", encoding="utf-8") as f:
            json.dump(locales[lang], f, indent=2, ensure_ascii=False)
        print(f"💾 Plik zapisany: {paths[lang]}")

def main():
    used_keys = extract_translation_keys_from_src()
    locales, paths = load_locale_files()
    missing = find_missing_translations(used_keys, locales)

    if not missing:
        print("✅ Wszystkie tłumaczenia są obecne we wszystkich językach.")
    else:
        print(f"\n🚫 Znaleziono {len(missing)} brakujących tłumaczeń.")
        fill_missing_translations(missing, locales, paths)

if __name__ == "__main__":
    main()
    