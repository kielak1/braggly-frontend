// src/app/utils/api.ts
import { getCookie, getServerCookie } from "@/utils/cookies";
import { RequestCookies } from "next/dist/compiled/@edge-runtime/cookies"; // lub napisz własny typ

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

export type BoolParameter = {
  id: number;
  name: string;
  value: boolean;
};
// types/api.ts lub w tym samym pliku
export type RestrictedPath = {
  id: number;
  path: string;
};

const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Brak tokena w localStorage");
  return {
    Authorization: `Bearer ${token}`,
  };
};

const getAuthServerHeaders = (
  cookies: RequestCookies
): Record<string, string> => {
  const token = getServerCookie(cookies, "token"); // cookies, nie request
  if (!token) throw new Error("Brak tokena w cookies");
  return {
    Authorization: `Bearer ${token}`,
  };
};

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

export const fetchRestrictedPaths = async (
  cookies?: RequestCookies
): Promise<RestrictedPath[] | null> => {
  try {
    const headers = cookies ? getAuthServerHeaders(cookies) : getAuthHeaders();
    const response = await fetch(`${backendUrl}/parameters/restricted-paths`, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Błąd serwera: ${response.status} - ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Błąd podczas pobierania restricted paths:", error);
    return null;
  }
};

export const addRestrictedPath = async (
  path: string,
  cookies?: RequestCookies
): Promise<RestrictedPath | null> => {
  try {
    const headers = cookies ? getAuthServerHeaders(cookies) : getAuthHeaders();
    const url = `${backendUrl}/parameters/restricted-paths?path=${encodeURIComponent(path)}`;
    const response = await fetch(url, {
      method: "POST",
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Błąd dodawania ścieżki: ${response.status} - ${errorText}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error("Błąd podczas dodawania restricted path:", error);
    return null;
  }
};

export const deleteRestrictedPath = async (
  path: string,
  cookies?: RequestCookies
): Promise<boolean> => {
  try {
    const headers = cookies ? getAuthServerHeaders(cookies) : getAuthHeaders();
    const url = `${backendUrl}/parameters/restricted-paths?path=${encodeURIComponent(path)}`;
    const response = await fetch(url, {
      method: "DELETE",
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Błąd usuwania ścieżki: ${response.status} - ${errorText}`
      );
    }

    return true;
  } catch (error) {
    console.error("Błąd podczas usuwania restricted path:", error);
    return false;
  }
};

/**
 * Sprawdza, czy podana ścieżka zaczyna się od którejkolwiek ze ścieżek płatnych.
 *
 * @param currentPath - aktualna ścieżka użytkownika (np. "/user/uploads/file.pdf")
 * @param restrictedList - lista płatnych ścieżek z backendu
 * @returns true jeśli ścieżka wymaga dodatniego salda
 */
export function isRestrictedPath(
  currentPath: string,
  restrictedList: { path: string }[]
): boolean {
  return restrictedList.some(({ path }) => currentPath.startsWith(path));
}


/**
 * Sprawdza, czy parametr logiczny jest włączony (value === true).
 * Zwraca false jeśli parametr jest null lub ma value === false.
 */
export function isParameterEnabled(
  param: BoolParameter | boolean | null | undefined
): boolean {
  if (typeof param === "boolean") return param;
  return param?.value === true;
}

if (!backendUrl) throw new Error("Brak zmiennej NEXT_PUBLIC_BACKEND_URL");

export const fetchBoolParameters = async (): Promise<BoolParameter[]> => {
  const res = await fetch(`${backendUrl}/parameters/list`, {
    method: "GET",
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error("Błąd pobierania parametrów");
  return res.json();
};

export const deleteBoolParameter = async (name: string): Promise<boolean> => {
  const res = await fetch(
    `${backendUrl}/parameters/delete?name=${encodeURIComponent(name)}`,
    {
      method: "DELETE",
      headers: getAuthHeaders(),
    }
  );
  return res.ok;
};

export const updateBoolParameter = async (
  name: string,
  value: boolean
): Promise<boolean> => {
  const res = await fetch(
    `${backendUrl}/parameters/update?name=${encodeURIComponent(name)}&value=${value}`,
    {
      method: "PUT",
      headers: getAuthHeaders(),
    }
  );
  return res.ok;
};

export const fetchBoolParameterByName = async (
  name: string,
  cookies?: RequestCookies
): Promise<BoolParameter | null> => {
  try {
    const headers = cookies ? getAuthServerHeaders(cookies) : getAuthHeaders();
    const response = await fetch(
      `${backendUrl}/parameters/get?name=${encodeURIComponent(name)}`,
      {
        method: "GET",
        headers,
      }
    );
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Błąd serwera: ${response.status} - ${errorText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Błąd podczas pobierania parametru:", error);
    return null;
  }
};

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
