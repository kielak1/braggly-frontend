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

export interface PurchaseHistory {
  id: number;
  userId: number;
  creditsPurchased: number;
  amountPaid: number;
  purchaseDate: string;
  paymentId: string;
}

export interface UsageHistory {
  id: number;
  userId: number;
  usageType: string;
  usageDate: string;
  creditsUsed: number;
}

const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Brak tokena w localStorage");
  return {
    Authorization: `Bearer ${token}`,
  };
};

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
if (!backendUrl) throw new Error("Brak zmiennej NEXT_PUBLIC_BACKEND_URL");

export const quickAnalysisXrdFile = async (file: File): Promise<any> => {
  const formData = new FormData();
  formData.append("file", file);

  let authHeaders: Record<string, string>;
  try {
    authHeaders = getAuthHeaders();
  } catch (error) {
    console.error("Błąd autoryzacji:", error);
    throw error;
  }
  console.info("authHeader: ", authHeaders);
  const response = await fetch("/api/xrd/analyze", {
    method: "POST",
    headers: authHeaders, // Tylko Authorization, Content-Type ustawi się automatycznie
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Failed to upload and analyze XRD file: ${response.status} - ${errorText}`
    );
  }

  return response.json();
};

export const fetchUsers = async (): Promise<User[] | null> => {
  try {
    const response = await fetch(`${backendUrl}/api/admin/list-user`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Błąd serwera: ${response.status} - ${errorText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Błąd podczas pobierania listy użytkowników:", error);
    return null;
  }
};

export const createUser = async (
  username: string,
  password: string
): Promise<boolean> => {
  try {
    const response = await fetch(`${backendUrl}/api/admin/create-user`, {
      method: "POST",
      headers: {
        ...getAuthHeaders(), // Nagłówek Authorization
        "Content-Type": "application/json", // Jawne ustawienie Content-Type
      },
      body: JSON.stringify({ username, password }),
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Błąd serwera: ${response.status} - ${errorText}`);
    }
    return true;
  } catch (error) {
    console.error("Błąd podczas tworzenia użytkownika:", error);
    throw error; // Rzucamy błąd, aby Dashboard mógł go obsłużyć
  }
};

export const deleteUser = async (username: string): Promise<boolean> => {
  try {
    const response = await fetch(
      `${backendUrl}/api/admin/delete-user?username=${username}`,
      {
        method: "DELETE",
        headers: getAuthHeaders(),
      }
    );
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Błąd serwera: ${response.status} - ${errorText}`);
    }
    return true;
  } catch (error) {
    console.error("Błąd podczas usuwania użytkownika:", error);
    return false;
  }
};

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
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Błąd serwera: ${response.status} - ${errorText}`);
    }
    return true;
  } catch (error) {
    console.error("Błąd podczas zmiany roli użytkownika:", error);
    return false;
  }
};

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
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Błąd serwera: ${response.status} - ${errorText}`);
    }
    return true;
  } catch (error) {
    console.error("Błąd podczas ustawiania nowego hasła:", error);
    return false;
  }
};

export const fetchWhoAmI = async (): Promise<WhoAmIResponse | null> => {
  try {
    const response = await fetch(`${backendUrl}/api/whoami`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Błąd serwera: ${response.status} - ${errorText}`);
    }
    const data: WhoAmIResponse = await response.json();
    localStorage.setItem("userData", JSON.stringify(data));
    return data;
  } catch (error) {
    console.error("Błąd podczas pobierania danych whoami:", error);
    return null;
  }
};

export const addCreditPackage = async (
  credits: number,
  priceInCents: number
): Promise<CreditPackage | { success: boolean } | null> => {
  try {
    const response = await fetch(`${backendUrl}/credits/packages`, {
      method: "POST",
      headers: {
        ...getAuthHeaders(), // Nagłówek Authorization
        "Content-Type": "application/json", // Jawne ustawienie Content-Type
      },

      // headers: getAuthHeaders(),

      body: JSON.stringify({ credits, priceInCents }),
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Błąd serwera: ${response.status} - ${errorText}`);
    }
    const text = await response.text();
    return text.trim() ? JSON.parse(text) : { success: true };
  } catch (error) {
    console.error("Błąd podczas dodawania pakietu kredytowego:", error);
    return null;
  }
};

export const deleteCreditPackage = async (
  packageId: number
): Promise<boolean> => {
  try {
    const response = await fetch(
      `${backendUrl}/credits/packages/${packageId}`,
      {
        method: "DELETE",
        headers: getAuthHeaders(),
      }
    );
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Błąd serwera: ${response.status} - ${errorText}`);
    }
    return true;
  } catch (error) {
    console.error("Błąd podczas usuwania pakietu kredytowego:", error);
    return false;
  }
};

export const fetchCreditPackages = async (): Promise<
  CreditPackage[] | null
> => {
  try {
    const response = await fetch(`${backendUrl}/credits/packages`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Błąd serwera: ${response.status} - ${errorText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Błąd podczas pobierania listy pakietów kredytowych:", error);
    return null;
  }
};

export const assignCreditsToUser = async (
  userId: number,
  packageId: number
): Promise<boolean> => {
  try {
    const headers = getAuthHeaders();
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
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Błąd serwera: ${response.status} - ${errorText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Błąd podczas pobierania historii zakupów:", error);
    return null;
  }
};

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
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Błąd serwera: ${response.status} - ${errorText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Błąd podczas pobierania historii użycia kredytów:", error);
    return null;
  }
};
