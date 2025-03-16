// src/utils/api.ts
export interface WhoAmIResponse {
  role: string;
  username: string;
  lastUpdated: string;
  balance: number;
  id: number;
}

export const fetchWhoAmI = async (): Promise<WhoAmIResponse | null> => {
  try {
    // Pobierz token z localStorage
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("Brak tokena w localStorage");
    }

    // Pobierz URL backendu z zmiennej środowiskowej
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
    if (!backendUrl) {
      throw new Error("Brak zmiennej NEXT_PUBLIC_BACKEND_URL");
    }

    // Wykonaj zapytanie do endpointu /api/whoami
    const response = await fetch(`${backendUrl}/api/whoami`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    // Sprawdź, czy odpowiedź jest poprawna
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error(
          "Nieautoryzowany dostęp - token może być nieprawidłowy lub wygasły"
        );
      }
      throw new Error(`Błąd serwera: ${response.status}`);
    }

    // Parsuj odpowiedź jako JSON
    const data: WhoAmIResponse = await response.json();

    // Zapisz dane do localStorage
    localStorage.setItem("userData", JSON.stringify(data));

    return data;
  } catch (error) {
    console.error("Błąd podczas pobierania danych whoami:", error);
    return null;
  }
};
