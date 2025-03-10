"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState(""); // Nowy stan na błędy
  const [translations, setTranslations] = useState({ login: "Zaloguj", logout: "Wyloguj", error: "Nieprawidłowy login lub hasło" });

  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        const token = localStorage.getItem("token");
        setIsLoggedIn(!!token);
      }
    } catch (error) {
      console.error("Błąd dostępu do localStorage:", error);
    }
  }, []);

  useEffect(() => {
    const locale = document.cookie
      .split("; ")
      .find((row) => row.startsWith("locale="))
      ?.split("=")[1] || "en"; // Domyślnie angielski

    async function fetchTranslations() {
      try {
        const response = await fetch(`/api/i18n?locale=${locale}`);
        if (!response.ok) throw new Error("Błąd pobierania tłumaczeń");
        const data = await response.json();
        setTranslations(data);
      } catch (error) {
        console.error("Błąd pobierania tłumaczeń:", error);
      }
    }

    fetchTranslations();
  }, []);

  const handleLogin = async () => {
    setErrorMessage(""); // Resetujemy błąd przed próbą logowania

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "";
      const originUrl = process.env.ORIGIN_URL || "";

      if (!backendUrl) {
        throw new Error("Brak zmiennej środowiskowej NEXT_PUBLIC_BACKEND_URL");
      }

      const response = await fetch(`${backendUrl}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Origin: originUrl,
        },
        body: JSON.stringify({ username, password }),
        mode: "cors",
      });

      if (!response.ok) {
        if (response.status === 401) {
          setErrorMessage(translations.loginerror); // Ustawienie błędu dla niepoprawnych danych
        } else {
          setErrorMessage(`Błąd serwera: ${response.status}`);
        }
        return;
      }

      const data = await response.json();
      if (!data.token) {
        throw new Error("Brak tokena w odpowiedzi serwera");
      }

      localStorage.setItem("token", data.token);
      setIsLoggedIn(true);
      setErrorMessage(""); // Wyczyść błąd po poprawnym logowaniu
    } catch (error) {
      console.error("Błąd logowania:", error);
      setErrorMessage("Wystąpił błąd podczas logowania.");
    }
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem("token");
      setIsLoggedIn(false);
      router.push("/");
    } catch (error) {
      console.error("Błąd podczas wylogowywania:", error);
    }
  };

  return (
    <nav className="bg-gray-800 text-white p-4 flex justify-between">
      <h1 className="text-3xl font-bold text-blue-600">Braggly</h1>
      <div>
        {isLoggedIn ? (
          <button
            onClick={handleLogout}
            className="bg-red-500 px-4 py-2 rounded"
          >
            {translations.logout}
          </button>
        ) : (
          <div className="flex flex-col items-center space-y-2">
            {errorMessage && (
              <p className="text-red-500 text-sm">{errorMessage}</p>
            )}
            <div className="flex items-center space-x-2">
              <input
                type="text"
                placeholder="Login"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="p-2 text-black rounded"
              />
              <input
                type="password"
                placeholder="Hasło"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="p-2 text-black rounded"
              />
              <button
                onClick={handleLogin}
                className="bg-blue-500 px-4 py-2 rounded"
              >
                {translations.login}
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
