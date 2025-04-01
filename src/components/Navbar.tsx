"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { signIn, signOut, useSession } from "next-auth/react";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { fetchWhoAmI, WhoAmIResponse } from "@/utils/api";
import { jwtDecode } from "jwt-decode";
import { useTranslations } from "@/context/TranslationsContext";

type JwtPayload = {
  exp: number;
};

export default function Navbar() {
  const { translations } = useTranslations(); // ✅ Hook zawsze na górze
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [userData, setUserData] = useState<WhoAmIResponse | null>(null);

  const saveToken = (token: string) => {
    localStorage.setItem("token", token);
    document.cookie = `token=${token}; path=/; SameSite=Lax; Secure`;
  };

  const saveUserData = (data: WhoAmIResponse) => {
    localStorage.setItem("userData", JSON.stringify(data));
    setUserData(data);
  };

  const clearAuthData = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userData");
    document.cookie = `token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;`;
  };

  const handleFullLogout = useCallback(async () => {
    clearAuthData();
    setIsLoggedIn(false);
    setUserData(null);
    await signOut({ redirect: false });
    router.push("/");
  }, [router]);

  const verifyAndSetUser = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      console.warn("verifyAndSetUser: brak tokena");
      return handleFullLogout();
    }

    const data = await fetchWhoAmI();
    if (data) {
      saveUserData(data);
      setIsLoggedIn(true);

      if (
        data.role === "ADMIN" &&
        !pathname.startsWith("/admin") &&
        !pathname.startsWith("/terms") &&
        !pathname.startsWith("/privacy-policy")
      ) {
        router.push("/admin");
      } else if (
        data.role === "USER" &&
        !pathname.startsWith("/user") &&
        !pathname.startsWith("/terms") &&
        !pathname.startsWith("/privacy-policy")
      ) {
        router.push("/user");
      }
    } else {
      handleFullLogout();
    }
  }, [pathname, router, handleFullLogout]);

  useEffect(() => {
    if (!session?.idToken) return;

    const interval = setInterval(async () => {
      const jwt = localStorage.getItem("token");
      if (!jwt) return;

      try {
        const decoded = jwtDecode<JwtPayload>(jwt);
        const now = Math.floor(Date.now() / 1000);
        const timeLeft = decoded.exp - now;

        if (timeLeft < 120) {
          const res = await fetch(
            `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/google`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ token: session.idToken }),
            }
          );

          const data = await res.json();
          if (data.token) {
            localStorage.setItem("token", data.token);
            document.cookie = `token=${data.token}; path=/; SameSite=Lax; Secure`;
          } else {
            console.warn("❌ Brak tokena w odpowiedzi backendu");
          }
        }
      } catch (err) {
        console.error("❌ Błąd podczas odświeżania tokena:", err);
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [session?.idToken]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setIsLoggedIn(true);
      verifyAndSetUser();
    }
    window.addEventListener("storage", verifyAndSetUser);
    return () => window.removeEventListener("storage", verifyAndSetUser);
  }, [verifyAndSetUser]);

  useEffect(() => {
    const googleIdToken = session?.idToken;
    if (!googleIdToken) return;

    const loginWithGoogleBackend = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/google`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ token: googleIdToken }),
          }
        );

        if (!res.ok) throw new Error("Błąd logowania przez backend");

        const data = await res.json();
        const jwt = data.token;
        if (!jwt) throw new Error("Brak tokena w odpowiedzi");

        saveToken(jwt);
        setIsLoggedIn(true);
        verifyAndSetUser();
      } catch (error) {
        console.error("Google login -> backend error:", error);
        handleFullLogout();
      }
    };

    loginWithGoogleBackend();
  }, [session?.idToken]);

  const handleLogin = async () => {
    setErrorMessage("");
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL!;
      const originUrl = process.env.ORIGIN_URL || "";

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
          setErrorMessage(translations?.error || "Błąd logowania");
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
      setIsLoggedIn(true);
      verifyAndSetUser();
    } catch (error) {
      console.error("Błąd logowania:", error);
      setErrorMessage("Wystąpił błąd podczas logowania.");
    }
  };

  const handleLogout = () => {
    clearAuthData();
    setIsLoggedIn(false);
    setUserData(null);
    router.push("/");
  };

  return (
    <nav className="bg-gray-800 text-white p-4 flex justify-between items-center">
      <LanguageSwitcher />
      <h1 className="text-3xl font-bold text-blue-600">Braggly</h1>
      <div className="flex items-center space-x-4">
        {translations && isLoggedIn ? (
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
        ) : translations ? (
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
        ) : null}
      </div>
    </nav>
  );
}
