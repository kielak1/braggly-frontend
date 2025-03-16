"use client";
import { getCookie } from "@/utils/cookies";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signIn, signOut, useSession } from "next-auth/react";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { fetchWhoAmI, WhoAmIResponse } from "@/utils/api"; // Import funkcji i interfejsu

export default function Navbar() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [translations, setTranslations] = useState({
    login: "Zaloguj",
    logout: "Wyloguj",
    googleLogin: "Zaloguj przez Google",
    googleLogout: "Wyloguj Google",
    error: "Nieprawidłowy login lub hasło",
    loggedAs: "Zalogowany jako",
  });
  const [localStorageToken, setLocalStorageToken] = useState<string | null>(
    null
  );
  const [userData, setUserData] = useState<WhoAmIResponse | null>(null); // Nowy stan dla danych użytkownika

  useEffect(() => {
    const checkToken = () => {
      try {
        if (typeof window !== "undefined") {
          const token = localStorage.getItem("token");
          setIsLoggedIn(!!token);
          setLocalStorageToken(token);

          // Pobierz dane użytkownika z localStorage, jeśli istnieją
          const storedUserData = localStorage.getItem("userData");
          if (storedUserData) {
            setUserData(JSON.parse(storedUserData));
          }
        }
      } catch (error) {
        console.error("Błąd dostępu do localStorage:", error);
      }
    };

    checkToken();
    window.addEventListener("storage", checkToken);

    return () => window.removeEventListener("storage", checkToken);
  }, []);

  useEffect(() => {
    const locale = getCookie("locale") || "en";

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

  useEffect(() => {
    console.log("Sesja:", session);
    if (session?.backendToken) {
      setLocalStorageToken(session.backendToken);
      localStorage.setItem("token", session.backendToken);
      setIsLoggedIn(true);

      // Wywołaj fetchWhoAmI po zalogowaniu przez Google
      fetchWhoAmI().then((data) => {
        if (data) {
          setUserData(data);
        }
      });
    }
  }, [session]);

  useEffect(() => {
    // Wywołaj fetchWhoAmI po zmianie localStorageToken (np. po logowaniu ręcznym)
    if (localStorageToken) {
      fetchWhoAmI().then((data) => {
        if (data) {
          setUserData(data);
          if (data.role === "ADMIN") {
            router.push("/admin");
          } else {
            router.push("/user");
          }
        }
      });
    } else {
      router.push("/");
    }
  }, [localStorageToken]);

  const handleLogin = async () => {
    setErrorMessage("");

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
          setErrorMessage(translations.error);
        } else {
          setErrorMessage(`Błąd serwera: ${response.status}`);
        }
        return;
      }

      const data = await response.json();
      if (!data.token) {
        throw new Error("Brak tokena w odpowiedzi serwera");
      }

      const token = data.token;
      localStorage.setItem("token", token);
      setLocalStorageToken(token);
      setIsLoggedIn(true);
      setErrorMessage("");

      // Wywołaj fetchWhoAmI po zalogowaniu ręcznym
      fetchWhoAmI().then((userData) => {
        if (userData) {
          setUserData(userData);
        }
      });
    } catch (error) {
      console.error("Błąd logowania:", error);
      setErrorMessage("Wystąpił błąd podczas logowania.");
    }
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("userData"); // Czyścimy dane użytkownika
      setLocalStorageToken(null);
      setUserData(null); // Czyścimy stan userData
      setIsLoggedIn(false);
      router.push("/");
    } catch (error) {
      console.error("Błąd podczas wylogowywania:", error);
    }
  };

  const handleGoogleLogout = async () => {
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("userData"); // Czyścimy dane użytkownika
      setLocalStorageToken(null);
      setUserData(null); // Czyścimy stan userData
      setIsLoggedIn(false);
      await signOut();
      router.push("/");
    } catch (error) {
      console.error("Błąd podczas wylogowywania z Google:", error);
    }
  };

  return (
    <nav className="bg-gray-800 text-white p-4 flex justify-between items-center">
      <LanguageSwitcher />
      <h1 className="text-3xl font-bold text-blue-600">Braggly</h1>

      <div className="flex items-center space-x-4">
        {isLoggedIn && (
          <div>
            {/* JWT Token: {localStorageToken || "Brak tokenu"} */}
            {userData && (
              <div className="text-green-400">
                {translations.loggedAs} {userData.username} ({userData.role})
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center space-x-4">
        {session ? (
          <div className="flex items-center space-x-4">
            <button
              onClick={handleGoogleLogout}
              className="bg-red-500 px-4 py-2 rounded"
            >
              {translations.googleLogout}
            </button>
          </div>
        ) : isLoggedIn ? (
          <button
            onClick={handleLogout}
            className="bg-red-500 px-4 py-2 rounded"
          >
            {translations.logout}
          </button>
        ) : (
          <div className="flex items-center space-x-2">
            {errorMessage && (
              <p className="text-red-500 text-sm">{errorMessage}</p>
            )}
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
            <button
              onClick={() => signIn("google")}
              className="bg-green-500 px-4 py-2 rounded"
            >
              {translations.googleLogin}
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
