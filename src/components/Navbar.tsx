"use client";

import { getCookie } from "@/utils/cookies";
import { useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { signIn, signOut, useSession } from "next-auth/react";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { fetchWhoAmI, WhoAmIResponse } from "@/utils/api";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();

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

  const [userData, setUserData] = useState<WhoAmIResponse | null>(null);

  const saveToken = (token: string) => {
    localStorage.setItem("token", token);
    document.cookie = `token=${token}; path=/; SameSite=Lax; Secure`;
  };

  const clearToken = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userData");
    document.cookie = `token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;`;
  };

  const handleFullLogout = useCallback(async () => {
    clearToken();
    setUserData(null);
    setIsLoggedIn(false);
    await signOut({ redirect: false });
    router.push("/");
  }, [router]);

  const verifyAndSetUser = useCallback(async () => {
    const data = await fetchWhoAmI();
    if (data) {
      setUserData(data);
      localStorage.setItem("userData", JSON.stringify(data));
      setIsLoggedIn(true);

      if (data.role === "ADMIN" && !pathname.startsWith("/admin")) {
        router.push("/admin");
      } else if (data.role === "USER" && !pathname.startsWith("/user")) {
        router.push("/user");
      }
    } else {
      handleFullLogout();
    }
  }, [pathname, router, handleFullLogout]);

  useEffect(() => {
    const checkLocalToken = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        await verifyAndSetUser();
      }
    };
    checkLocalToken();
    window.addEventListener("storage", checkLocalToken);
    return () => window.removeEventListener("storage", checkLocalToken);
  }, [verifyAndSetUser]);

  useEffect(() => {
    if (session?.backendToken) {
      saveToken(session.backendToken);
      verifyAndSetUser();
    }
  }, [session, verifyAndSetUser]);

  useEffect(() => {
    const locale = getCookie("locale") || "en";
    async function fetchTranslations() {
      try {
        const response = await fetch(`/api/i18n?locale=${locale}`);
        if (response.ok) {
          const data = await response.json();
          setTranslations(data);
        }
      } catch (error) {
        console.error("Błąd pobierania tłumaczeń:", error);
      }
    }
    fetchTranslations();
  }, []);

  const handleLogin = async () => {
    setErrorMessage("");
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "";
      const originUrl = process.env.ORIGIN_URL || "";
      if (!backendUrl) throw new Error("Brak backend URL");

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
      if (!data.token) throw new Error("Brak tokena");

      saveToken(data.token);
      setUsername("");
      setPassword("");
      await verifyAndSetUser();
    } catch (error) {
      console.error("Błąd logowania:", error);
      setErrorMessage("Wystąpił błąd podczas logowania.");
    }
  };

  const handleLogout = () => {
    clearToken();
    setUserData(null);
    setIsLoggedIn(false);
    router.push("/");
  };

  return (
    <nav className="bg-gray-800 text-white p-4 flex justify-between items-center">
      <LanguageSwitcher />
      <h1 className="text-3xl font-bold text-blue-600">Braggly</h1>
      <div className="flex items-center space-x-4">
        {isLoggedIn ? (
          <div className="flex items-center space-x-4">
            <span className="text-sm">
              {translations.loggedAs}: {userData?.username}
            </span>
            <button
              onClick={session ? handleFullLogout : handleLogout}
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
