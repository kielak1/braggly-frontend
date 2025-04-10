import os
import re
import json
from pathlib import Path
from openai import OpenAI
from prompt_toolkit import prompt

SRC_DIR = "src"
LOCALES_DIR = "public/locales"
TRANSLATION_PATTERN = r"translations(?:\?)?\.([a-zA-Z0-9_]+)(?:\s*\|\|\s*[\"'](.+?)[\"']\s*)?"

client = OpenAI(api_key=os.getenv("OPEN_AI_KEY"))


def extract_translation_keys_from_src():
    keys_with_defaults = {}
    print(f"🔍 Przeszukiwanie katalogu: {SRC_DIR}")
    for root, _, files in os.walk(SRC_DIR):
        for file in files:
            if file.endswith((".tsx", ".ts", ".js")):
                file_path = os.path.join(root, file)
                print(f"📄 Skanowanie pliku: {file_path}")
                with open(file_path, "r", encoding="utf-8") as f:
                    content = f.read()
                    matches = re.findall(TRANSLATION_PATTERN, content)
                    if matches:
                        print(f"🔑 Znalezione klucze w pliku {file_path}: {[m[0] for m in matches]}")
                    for key, default in matches:
                        if key not in keys_with_defaults:
                            keys_with_defaults[key] = default or None
    print(f"📋 Wszystkie znalezione klucze: {list(keys_with_defaults.keys())}")
    return keys_with_defaults


def load_locale_files():
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
                    print(f"✅ Załadowano {lang}: {len(locales[lang])} kluczy - {list(locales[lang].keys())}")
                except json.JSONDecodeError as e:
                    print(f"❌ Błąd JSON w pliku {lang_path}: {e}")
    return locales, paths


def find_missing_translations(used_keys, locale_dict):
    missing = []
    base_keys = set(used_keys.keys())  # Używamy tylko kluczy z kodu jako bazy
    print(f"🔍 Pełny zestaw kluczy do sprawdzenia: {list(base_keys)}")
    
    for key in base_keys:
        for lang, translations in locale_dict.items():
            if key not in translations:
                missing.append((key, lang))
                print(f"❌ Brakuje: {key} w języku {lang}")
    return missing


def generate_translation(prompt_text, target_lang_code):
    try:
        system_prompt = (
            f"Tłumacz tekst na język {target_lang_code} w neutralnym tonie. "
            "Zachowaj wielkość liter zgodnie z tekstem źródłowym (np. wielka litera na początku zdania, "
            "w środku zdania lub w nazwach własnych pozostaje taka sama)."
        )
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt_text}
            ],
            temperature=0.3,
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        print(f"❌ Błąd tłumaczenia OpenAI: {e}")
        return None


def fill_missing_translations_auto(missing, locales, paths, defaults):
    updated_languages = set()

    # Najpierw uzupełniamy PL
    for key, lang in missing:
        if lang == "pl":
            default_text = defaults.get(key)
            if not default_text:
                default_text = key  # Używamy nazwy klucza jako domyślnej wartości
                print(f"⚠️ Brak wartości domyślnej dla klucza '{key}', używam nazwy klucza: '{default_text}'")
            suggestion = generate_translation(default_text, "pl") or default_text
            print(f"\n🔤 Brakujące tłumaczenie [PL] dla klucza: '{key}'")
            print(f"📦 Domyślny tekst: {default_text}")
            print(f"🤖 Propozycja AI: {suggestion}")
            user_input = prompt(
                "✍️ Wpisz tłumaczenie (Enter = akceptuj propozycję, pusta wartość = pomiń): ",
                default=suggestion
            ).strip()
            if user_input:
                locales[lang][key] = user_input
                updated_languages.add(lang)
                print(f"✅ Zapisano tłumaczenie [pl]: {key} = \"{user_input}\"")
            else:
                print(f"⏭️ Pominięto '{key}'")

    # Następnie tłumaczymy na inne języki na podstawie PL
    for key, lang in missing:
        if lang != "pl":
            base_text = locales.get("pl", {}).get(key)
            if not base_text:
                print(f"⚠️ Brak tłumaczenia PL dla '{key}', pomijam tłumaczenie na [{lang}]...")
                continue
            translated = generate_translation(base_text, lang)
            if translated:
                locales[lang][key] = translated
                updated_languages.add(lang)
                print(f"✅ Przetłumaczono '{key}' na [{lang}]: {translated}")
            else:
                print(f"⚠️ Nie udało się przetłumaczyć '{key}' na [{lang}]")

    # Zapisujemy zaktualizowane pliki
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