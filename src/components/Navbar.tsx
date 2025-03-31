"use client";

import { getCookie } from "@/utils/cookies";
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { signIn, signOut, useSession } from "next-auth/react";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { fetchWhoAmI, WhoAmIResponse } from "@/utils/api";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
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
  const [userData, setUserData] = useState<WhoAmIResponse | null>(null);

  // Weryfikacja ważności tokena
  const verifyToken = async (): Promise<boolean> => {
    const data = await fetchWhoAmI();
    return !!data; // Zwraca true, jeśli dane są zwrócone, false w przeciwnym razie
  };

  // Sprawdzanie tokena przy ładowaniu strony
  useEffect(() => {
    const checkToken = async () => {
      try {
        if (typeof window !== "undefined") {
          const token = localStorage.getItem("token");
          if (token) {
            const isValid = await verifyToken();
            if (isValid) {
              setIsLoggedIn(true);
              setLocalStorageToken(token);
              const storedUserData = localStorage.getItem("userData");
              if (storedUserData) {
                setUserData(JSON.parse(storedUserData));
              }
            } else {
              handleFullLogout(); // Token nieważny - pełne wylogowanie
            }
          } else {
            setIsLoggedIn(false);
            setLocalStorageToken(null);
            setUserData(null);
          }
        }
      } catch (error) {
        console.error("Błąd podczas weryfikacji tokena:", error);
        handleFullLogout();
      }
    };

    checkToken();
    window.addEventListener("storage", checkToken);
    return () => window.removeEventListener("storage", checkToken);
  }, []);

  // Pobieranie tłumaczeń
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

  // Obsługa sesji NextAuth
  useEffect(() => {
    if (session?.backendToken) {
      setLocalStorageToken(session.backendToken);
      localStorage.setItem("token", session.backendToken);
      document.cookie = `token=${session.backendToken}; path=/; SameSite=Lax; Secure`;
      setIsLoggedIn(true);
      fetchWhoAmI().then((data) => {
        if (data) {
          setUserData(data); // fetchWhoAmI już zapisuje dane w localStorage
        } else {
          handleFullLogout(); // Token z sesji jest nieważny
        }
      });
    } else if (session && !localStorageToken) {
      handleFullLogout(); // Sesja Google istnieje, ale brak tokena
    }
  }, [session]);

  //Przekierowanie na podstawie roli użytkownika
  useEffect(() => {
    if (localStorageToken) {
      fetchWhoAmI().then((data) => {
        if (data) {
          setUserData(data);
          if (data.role === "ADMIN") {
            if (!pathname.startsWith("/admin")) {
              router.push("/admin");
            }
          } else {
            if (!pathname.startsWith("/user")) {
              router.push("/user");
            }
          }
        } else {
          handleFullLogout(); // Token nieważny
        }
      });
    }
  }, [localStorageToken, router, pathname]);

  // Logowanie tradycyjne
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
      document.cookie = `token=${token}; path=/; SameSite=Lax; Secure`;
      setLocalStorageToken(token);
      setIsLoggedIn(true);
      setErrorMessage("");

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

  // Wylogowanie tradycyjne
  const handleLogout = () => {
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("userData");
      setLocalStorageToken(null);
      setUserData(null);
      setIsLoggedIn(false);
      document.cookie =
        "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
      router.push("/");
    } catch (error) {
      console.error("Błąd podczas wylogowywania:", error);
    }
  };

  // Pełne wylogowanie (NextAuth + localStorage)
  const handleFullLogout = async () => {
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("userData");
      setLocalStorageToken(null);
      setUserData(null);
      setIsLoggedIn(false);
      await signOut({ redirect: false });
      document.cookie =
        "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
      router.push("/");
    } catch (error) {
      console.error("Błąd podczas pełnego wylogowywania:", error);
    }
  };

  // Wylogowanie z Google
  const handleGoogleLogout = async () => {
    await handleFullLogout();
  };

  return (
    <nav className="bg-gray-800 text-white p-4 flex justify-between items-center">
      <LanguageSwitcher />
      <h1 className="text-3xl font-bold text-blue-600">Braggly</h1>
      <div className="flex items-center space-x-4">
        {session || isLoggedIn ? (
          <div className="flex items-center space-x-4">
            <button
              onClick={session ? handleGoogleLogout : handleLogout}
              className="bg-red-500 px-4 py-2 rounded"
            >
              {session ? translations.googleLogout : translations.logout}
            </button>
          </div>
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
              className="p-1 w-32 text-black rounded"
            />
            <input
              type="password"
              placeholder="Hasło"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="p-1 w-32 text-black rounded"
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
