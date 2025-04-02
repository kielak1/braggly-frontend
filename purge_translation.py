import os
import re
import json

SRC_DIR = "src"
LOCALES_DIR = "public/locales"
TRANSLATION_PATTERN = r"translations(?:\?)?\.([a-zA-Z0-9_]+)"


def extract_translation_keys_from_src():
    keys = set()
    print(f"📂 Przeszukiwanie katalogu: {SRC_DIR}")
    for root, _, files in os.walk(SRC_DIR):
        for file in files:
            if file.endswith((".tsx", ".ts", ".js")):
                file_path = os.path.join(root, file)
                with open(file_path, "r", encoding="utf-8") as f:
                    content = f.read()
                    matches = re.findall(TRANSLATION_PATTERN, content)
                    keys.update(matches)
    print(f"✅ Używane klucze: {sorted(keys)}")
    return keys


def load_locale_files():
    locales = {}
    paths = {}
    print(f"🌍 Wczytywanie plików z tłumaczeniami z: {LOCALES_DIR}")
    for lang in os.listdir(LOCALES_DIR):
        lang_path = os.path.join(LOCALES_DIR, lang, "common.json")
        if os.path.isfile(lang_path):
            with open(lang_path, "r", encoding="utf-8") as f:
                try:
                    locales[lang] = json.load(f)
                    paths[lang] = lang_path
                except json.JSONDecodeError as e:
                    print(f"❌ Błąd w pliku {lang_path}: {e}")
    return locales, paths


def remove_unused_keys(used_keys, locales, paths):
    for lang, translations in locales.items():
        to_delete = [key for key in translations if key not in used_keys]

        if to_delete:
            print(f"\n🧹 {lang.upper()}: Usuwanie {len(to_delete)} nieużywanych kluczy:")
            for key in to_delete:
                print(f"  🗑️ {key}")
                del translations[key]

            with open(paths[lang], "w", encoding="utf-8") as f:
                json.dump(translations, f, indent=2, ensure_ascii=False)
            print(f"💾 Zapisano zaktualizowany plik: {paths[lang]}")
        else:
            print(f"✅ {lang.upper()}: Brak nieużywanych kluczy.")


def main():
    used_keys = extract_translation_keys_from_src()
    locales, paths = load_locale_files()
    remove_unused_keys(used_keys, locales, paths)


if __name__ == "__main__":
    main()
