import os
import re
import json
from pathlib import Path

SRC_DIR = "src"
LOCALES_DIR = "public/locales"
TRANSLATION_PATTERN = r"translations\.([a-zA-Z0-9_]+)"

# 1. Zbieramy wszystkie klucze używane w kodzie
def extract_translation_keys_from_src():
    keys = set()
    for root, _, files in os.walk(SRC_DIR):
        for file in files:
            if file.endswith((".tsx", ".ts", ".js")):
                with open(os.path.join(root, file), "r", encoding="utf-8") as f:
                    content = f.read()
                    matches = re.findall(TRANSLATION_PATTERN, content)
                    keys.update(matches)
    return sorted(keys)

# 2. Ładujemy pliki JSON z tłumaczeniami
def load_locale_files():
    locales = {}
    for lang in os.listdir(LOCALES_DIR):
        lang_path = os.path.join(LOCALES_DIR, lang, "common.json")
        if os.path.isfile(lang_path):
            with open(lang_path, "r", encoding="utf-8") as f:
                try:
                    locales[lang] = json.load(f)
                except json.JSONDecodeError as e:
                    print(f"Błąd w pliku {lang_path}: {e}")
    return locales

# 3. Sprawdzamy brakujące klucze
def find_missing_translations(used_keys, locale_dict):
    missing = []
    for key in used_keys:
        for lang, translations in locale_dict.items():
            if key not in translations:
                missing.append((key, lang))
    return missing

# 4. Uruchamiamy wszystko
def main():
    used_keys = extract_translation_keys_from_src()
    locales = load_locale_files()
    missing = find_missing_translations(used_keys, locales)

    if not missing:
        print("✅ Wszystkie tłumaczenia są obecne we wszystkich językach.")
    else:
        print("🚫 Brakujące tłumaczenia:")
        for key, lang in missing:
            print(f" - Klucz: '{key}' brakuje w języku: '{lang}'")

if __name__ == "__main__":
    main()
