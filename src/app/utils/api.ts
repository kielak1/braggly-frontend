// src/app/utils/api.ts

export interface WhoAmIResponse {
  role: string;
  username: string;
  lastUpdated: string;
  balance: number;
  id: number;
}

export interface User {
  id: number;
  username: string;
  role: string;
  balance: number;
}

export interface CreditPackage {
  id: number;
  credits: number;
  priceInCents: number;
}

// Zaktualizowany interfejs dla historii zakupów
export interface PurchaseHistory {
  id: number;
  userId: number;
  creditsPurchased: number;
  amountPaid: number;
  purchaseDate: string;
}

// Zaktualizowany interfejs dla historii użycia
export interface UsageHistory {
  id: number;
  userId: number;
  usageType: string;
  usageDate: string;
  creditsUsed: number;
}

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Brak tokena w localStorage");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
if (!backendUrl) throw new Error("Brak zmiennej NEXT_PUBLIC_BACKEND_URL");

// Pobranie listy użytkowników
export const fetchUsers = async (): Promise<User[] | null> => {
  try {
    const response = await fetch(`${backendUrl}/api/admin/list-user`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error(`Błąd serwera: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Błąd podczas pobierania listy użytkowników:", error);
    return null;
  }
};

// Tworzenie użytkownika
export const createUser = async (
  username: string,
  password: string
): Promise<boolean> => {
  try {
    const response = await fetch(`${backendUrl}/api/admin/create-user`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ username, password }),
    });
    if (!response.ok) throw new Error(`Błąd serwera: ${response.status}`);
    return true;
  } catch (error) {
    console.error("Błąd podczas tworzenia użytkownika:", error);
    return false;
  }
};

// Usuwanie użytkownika
export const deleteUser = async (username: string): Promise<boolean> => {
  try {
    const response = await fetch(
      `${backendUrl}/api/admin/delete-user?username=${username}`,
      {
        method: "DELETE",
        headers: getAuthHeaders(),
      }
    );
    if (!response.ok) throw new Error(`Błąd serwera: ${response.status}`);
    return true;
  } catch (error) {
    console.error("Błąd podczas usuwania użytkownika:", error);
    return false;
  }
};

// Ustawianie roli użytkownika
export const setUserRole = async (
  userId: number,
  role: "ADMIN" | "USER"
): Promise<boolean> => {
  try {
    const response = await fetch(
      `${backendUrl}/api/admin/set-role?userId=${userId}&role=${role}`,
      {
        method: "PUT",
        headers: getAuthHeaders(),
      }
    );
    if (!response.ok) throw new Error(`Błąd serwera: ${response.status}`);
    return true;
  } catch (error) {
    console.error("Błąd podczas zmiany roli użytkownika:", error);
    return false;
  }
};

// Ustawianie nowego hasła użytkownika
export const setUserPassword = async (
  userId: number,
  newPassword: string
): Promise<boolean> => {
  try {
    const response = await fetch(
      `${backendUrl}/api/admin/set-password?userId=${userId}&newPassword=${newPassword}`,
      {
        method: "PUT",
        headers: getAuthHeaders(),
      }
    );
    if (!response.ok) throw new Error(`Błąd serwera: ${response.status}`);
    return true;
  } catch (error) {
    console.error("Błąd podczas ustawiania nowego hasła:", error);
    return false;
  }
};

// Pobieranie informacji o zalogowanym użytkowniku
export const fetchWhoAmI = async (): Promise<WhoAmIResponse | null> => {
  try {
    const response = await fetch(`${backendUrl}/api/whoami`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error(`Błąd serwera: ${response.status}`);
    const data: WhoAmIResponse = await response.json();
    localStorage.setItem("userData", JSON.stringify(data));
    return data;
  } catch (error) {
    console.error("Błąd podczas pobierania danych whoami:", error);
    return null;
  }
};

// Dodawanie pakietu kredytowego
export const addCreditPackage = async (
  credits: number,
  priceInCents: number
): Promise<CreditPackage | { success: boolean } | null> => {
  try {
    const response = await fetch(`${backendUrl}/credits/packages`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ credits, priceInCents }),
    });
    if (!response.ok) {
      console.error(`Błąd serwera: ${response.status}`);
      return null;
    }
    const text = await response.text();
    if (!text.trim()) {
      return { success: true };
    }
    return JSON.parse(text);
  } catch (error) {
    console.error("Błąd podczas dodawania pakietu kredytowego:", error);
    return null;
  }
};

// Usuwanie pakietu kredytowego
export const deleteCreditPackage = async (
  packageId: number
): Promise<boolean> => {
  try {
    const response = await fetch(`${backendUrl}/credits/packages/${packageId}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error(`Błąd serwera: ${response.status}`);
    return true;
  } catch (error) {
    console.error("Błąd podczas usuwania pakietu kredytowego:", error);
    return false;
  }
};

// Pobieranie listy pakietów kredytowych
export const fetchCreditPackages = async (): Promise<CreditPackage[] | null> => {
  try {
    const response = await fetch(`${backendUrl}/credits/packages`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error(`Błąd serwera: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Błąd podczas pobierania listy pakietów kredytowych:", error);
    return null;
  }
};

// Przypisywanie kredytów użytkownikowi
export const assignCreditsToUser = async (
  userId: number,
  packageId: number
): Promise<boolean> => {
  try {
    const headers = getAuthHeaders();
    console.log("Nagłówki wysyłane do serwera:", headers);
    console.log("URL zapytania:", `${backendUrl}/credits/assign`);
    console.log("Dane wysyłane:", { userId, packageId });

    const response = await fetch(`${backendUrl}/credits/assign`, {
      method: "POST",
      headers: {
        ...headers,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        userId: userId.toString(),
        packageId: packageId.toString(),
      }).toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Błąd serwera: ${response.status} - ${errorText}`);
    }
    return true;
  } catch (error) {
    console.error("Błąd podczas przypisywania kredytów użytkownikowi:", error);
    return false;
  }
};

// Pobieranie historii zakupów użytkownika
export const fetchPurchaseHistory = async (
  userId: number
): Promise<PurchaseHistory[] | null> => {
  try {
    const response = await fetch(
      `${backendUrl}/credits/purchase-history?userId=${userId}`,
      {
        method: "GET",
        headers: getAuthHeaders(),
      }
    );
    if (!response.ok) throw new Error(`Błąd serwera: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Błąd podczas pobierania historii zakupów:", error);
    return null;
  }
};

// Pobieranie historii użycia kredytów użytkownika
export const fetchUsageHistory = async (
  userId: number
): Promise<UsageHistory[] | null> => {
  try {
    const response = await fetch(
      `${backendUrl}/credits/usage-history?userId=${userId}`,
      {
        method: "GET",
        headers: getAuthHeaders(),
      }
    );
    if (!response.ok) throw new Error(`Błąd serwera: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Błąd podczas pobierania historii użycia kredytów:", error);
    return null;
  }
};