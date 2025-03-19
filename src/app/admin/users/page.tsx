"use client";

import { useState, useEffect, Dispatch, SetStateAction } from "react";
import { getCookie } from "@/utils/cookies";
import { useFetchTranslations } from "@/utils/fetchTranslations";
import {
  fetchWhoAmI,
  fetchUsers,
  createUser,
  deleteUser,
  setUserRole,
  setUserPassword,
  fetchCreditPackages,
  assignCreditsToUser,
  CreditPackage,
  User,
} from "@/utils/api";
import "@/styles/globals.css";

type TranslationsSetter = Dispatch<
  SetStateAction<Record<string, string> | null>
>;
type UserRole = "USER" | "ADMIN";

const Dashboard = () => {
  const [translations, setTranslations] = useState<Record<
    string,
    string
  > | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [creditPackages, setCreditPackages] = useState<CreditPackage[]>([]);
  const [newUser, setNewUser] = useState({ username: "", password: "" });
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole>("USER");
  const [newPassword, setNewPassword] = useState("");
  const [selectedPackageId, setSelectedPackageId] = useState<number | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useFetchTranslations(setTranslations as TranslationsSetter, getCookie);

  useEffect(() => {
    const pobierzDane = async () => {
      setIsLoading(true);
      try {
        const daneUzytkownikow = await fetchUsers();
        if (daneUzytkownikow) setUsers(daneUzytkownikow);
        const pakietyKredytow = await fetchCreditPackages();
        if (pakietyKredytow) setCreditPackages(pakietyKredytow);
      } catch (err) {
        setError("Błąd podczas pobierania danych");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    pobierzDane();
  }, []);
  const handleCreateUser = async () => {
    if (!newUser.username || !newUser.password) {
      setError("Proszę wypełnić nazwę użytkownika i hasło.");
      return;
    }
    setIsLoading(true);
    try {
      const success = await createUser(newUser.username, newUser.password);
      if (!success) {
        throw new Error("Nie udało się utworzyć użytkownika.");
      }
      const zaktualizowaniUzytkownicy = await fetchUsers();
      if (zaktualizowaniUzytkownicy) setUsers(zaktualizowaniUzytkownicy);
      setNewUser({ username: "", password: "" });
    } catch (err: any) {
      if (err.message.includes("403")) {
        setError(
          "Brak uprawnień do tworzenia użytkownika. Skontaktuj się z administratorem."
        );
      } else if (err.message.includes("415")) {
        setError(
          "Błąd serwera: Nieprawidłowy format danych. Skontaktuj się z administratorem."
        );
      } else {
        setError("Błąd podczas tworzenia użytkownika: " + err.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async (username: string) => {
    // Dodajemy potwierdzenie usunięcia
    const confirmMessage = translations?.confirm_delete_user
      ? translations.confirm_delete_user.replace("{username}", username)
      : `Czy na pewno chcesz usunąć użytkownika ${username}?`;
    const confirmed = window.confirm(confirmMessage);

    if (!confirmed) return; // Jeśli użytkownik kliknie "Anuluj", przerywamy

    setIsLoading(true);
    try {
      await deleteUser(username);
      const zaktualizowaniUzytkownicy = await fetchUsers();
      if (zaktualizowaniUzytkownicy) setUsers(zaktualizowaniUzytkownicy);
    } catch (err) {
      setError("Błąd podczas usuwania użytkownika");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetRole = async () => {
    if (!selectedUserId) return;
    setIsLoading(true);
    try {
      await setUserRole(selectedUserId, selectedRole);
      const zaktualizowaniUzytkownicy = await fetchUsers();
      if (zaktualizowaniUzytkownicy) setUsers(zaktualizowaniUzytkownicy);
    } catch (err) {
      setError("Błąd podczas ustawiania roli");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetPassword = async () => {
    if (!selectedUserId || !newPassword) return;
    setIsLoading(true);
    try {
      await setUserPassword(selectedUserId, newPassword);
      setNewPassword("");
    } catch (err) {
      setError("Błąd podczas zmiany hasła");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssignCredits = async () => {
    if (!selectedUserId || !selectedPackageId) return;
    setIsLoading(true);
    try {
      const success = await assignCreditsToUser(
        selectedUserId,
        selectedPackageId
      );
      if (success) {
        const zaktualizowaniUzytkownicy = await fetchUsers();
        if (zaktualizowaniUzytkownicy) setUsers(zaktualizowaniUzytkownicy);
        setError(null);
      } else {
        setError("Nie udało się przypisać kredytów");
      }
    } catch (err) {
      setError("Błąd podczas przypisywania kredytów");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!translations) return <div>Ładowanie tłumaczeń...</div>;
  if (isLoading) return <div>Ładowanie danych...</div>;

  return (
    <div className="max-w-3xl mx-auto p-6 bg-gray-100 rounded-lg shadow-md mt-6">
      {error && (
        <div className="bg-red-100 text-red-700 p-2 mb-4 rounded">
          {error}
          <button onClick={() => setError(null)} className="ml-2">
            X
          </button>
        </div>
      )}

      <h1 className="text-3xl font-bold text-gray-800 mb-4">
        {translations.user_list || "Lista użytkowników"}
      </h1>
      <ul className="space-y-4">
        {users.map((user) => (
          <li
            key={user.id}
            className="flex justify-between items-center p-4 bg-white rounded shadow"
          >
            <span>
              {user.username} ({user.role}) - {translations.balance || "Saldo"}:{" "}
              {user.balance}
            </span>
            <button
              onClick={() => handleDeleteUser(user.username)}
              className="bg-red-500 text-white px-3 py-1 rounded"
            >
              {translations.delete || "Usuń"}
            </button>
          </li>
        ))}
      </ul>

      <div className="mt-6 p-4 bg-white rounded shadow">
        <h2 className="text-xl font-bold mb-2">
          {translations.add_user || "Dodaj użytkownika"}
        </h2>
        <input
          type="text"
          placeholder={translations.username || "Nazwa użytkownika"}
          value={newUser.username}
          onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
          className="border p-2 mr-2"
        />
        <input
          type="password"
          placeholder={translations.password || "Hasło"}
          value={newUser.password}
          onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
          className="border p-2 mr-2"
        />
        <button
          onClick={handleCreateUser}
          className="bg-green-500 text-white px-3 py-1 rounded"
        >
          {translations.add || "Dodaj"}
        </button>
      </div>

      <div className="mt-6 p-4 bg-white rounded shadow">
        <h2 className="text-xl font-bold mb-2">
          {translations.set_role || "Ustaw rolę"}
        </h2>
        <select
          onChange={(e) => setSelectedUserId(Number(e.target.value))}
          className="border p-2 mr-2"
        >
          <option value="">
            {translations.select_user || "Wybierz użytkownika"}
          </option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.username}
            </option>
          ))}
        </select>
        <select
          onChange={(e) => setSelectedRole(e.target.value as UserRole)}
          value={selectedRole}
          className="border p-2 mr-2"
        >
          <option value="USER">USER</option>
          <option value="ADMIN">ADMIN</option>
        </select>
        <button
          onClick={handleSetRole}
          className="bg-blue-500 text-white px-3 py-1 rounded"
        >
          {translations.update_role || "Aktualizuj rolę"}
        </button>
      </div>

      <div className="mt-6 p-4 bg-white rounded shadow">
        <h2 className="text-xl font-bold mb-2">
          {translations.set_password || "Ustaw hasło"}
        </h2>
        <select
          onChange={(e) => setSelectedUserId(Number(e.target.value))}
          className="border p-2 mr-2"
        >
          <option value="">
            {translations.select_user || "Wybierz użytkownika"}
          </option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.username}
            </option>
          ))}
        </select>
        <input
          type="password"
          placeholder={translations.new_password || "Nowe hasło"}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="border p-2 mr-2"
        />
        <button
          onClick={handleSetPassword}
          className="bg-purple-500 text-white px-3 py-1 rounded"
        >
          {translations.update_password || "Aktualizuj hasło"}
        </button>
      </div>

      <div className="mt-6 p-4 bg-white rounded shadow">
        <h2 className="text-xl font-bold mb-2">
          {translations.assign_credits || "Przypisz kredyty"}
        </h2>
        <select
          onChange={(e) => setSelectedUserId(Number(e.target.value))}
          className="border p-2 mr-2"
        >
          <option value="">
            {translations.select_user || "Wybierz użytkownika"}
          </option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.username}
            </option>
          ))}
        </select>
        <select
          onChange={(e) => setSelectedPackageId(Number(e.target.value))}
          className="border p-2 mr-2"
        >
          <option value="">
            {translations.select_package || "Wybierz pakiet"}
          </option>
          {creditPackages.map((pkg) => (
            <option key={pkg.id} value={pkg.id}>
              {pkg.credits} kredytów
            </option>
          ))}
        </select>
        <button
          onClick={handleAssignCredits}
          className="bg-orange-500 text-white px-3 py-1 rounded"
        >
          {translations.assign || "Przypisz"}
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
