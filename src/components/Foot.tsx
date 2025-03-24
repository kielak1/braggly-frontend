import Link from "next/link";

export default function Foot() {
  return (
    <footer className="w-full bg-gray-100 text-center py-4 text-sm text-gray-600 border-t mt-8">
      <div className="mb-1">
        © {new Date().getFullYear()} Twoja Aplikacja. Wszelkie prawa zastrzeżone.
      </div>
      <div className="space-x-4">
        <Link href="/" className="text-blue-600 hover:underline">
          Strona główna
        </Link>
        <Link href="/privacy-policy" className="text-blue-600 hover:underline">
          Polityka prywatności
        </Link>
      </div>
    </footer>
  );
}
