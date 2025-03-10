"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

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

  const handleLogin = async () => {
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
        body: JSON.stringify({ username: "admin", password: "admin" }),
        mode: "cors",
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      if (!data.token) {
        throw new Error("Brak tokena w odpowiedzi serwera");
      }

      localStorage.setItem("token", data.token);
      setIsLoggedIn(true);
    } catch (error) {
      console.error("Błąd logowania:", error);
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
      <h1 className="text-3xl font-bold text-blue-600">React-Spring App</h1>
      <div>
        {isLoggedIn ? (
          <button
            onClick={handleLogout}
            className="bg-red-500 px-4 py-2 rounded"
          >
            Wyloguj
          </button>
        ) : (
          <button
            onClick={handleLogin}
            className="bg-blue-500 px-4 py-2 rounded"
          >
            Zaloguj
          </button>
        )}
      </div>
    </nav>
  );
}
