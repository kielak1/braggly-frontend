"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      setIsLoggedIn(!!token);
    }
  }, []);

  const handleLogin = async () => {
    try {
      const response = await fetch(
        "http://backend.reactspr.kielak.com:9191/api/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Origin: "http://localhost:4000",
          },
          body: JSON.stringify({ username: "admin", password: "admin" }),
          mode: "cors",
        }
      );

      console.log("Response:", response);

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      localStorage.setItem("token", data.token);
      setIsLoggedIn(true);
    } catch (error) {
      console.error("Błąd logowania:", error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
    router.push("/");
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
