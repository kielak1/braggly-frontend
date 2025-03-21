"use client";
import { useState, useEffect, useCallback } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  useStripe,
  useElements,
  CardElement,
} from "@stripe/react-stripe-js";
import { useFetchTranslations } from "@/utils/fetchTranslations";
import {
  fetchCreditPackages,
  CreditPackage,
} from "@/utils/api";
import { getCookie } from "@/utils/cookies";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY!);

const CheckoutForm = () => {
  const [translations, setTranslations] = useState<Record<
    string,
    string
  > | null>(null);
  useFetchTranslations(setTranslations, getCookie);
  const [creditPackages, setCreditPackages] = useState<CreditPackage[] | null>(
    null
  );
  const loadCreditPackages = useCallback(async () => {
    const packages = await fetchCreditPackages();
    setCreditPackages(packages);
  }, []);
  const [refresh, setRefresh] = useState(false);
  useEffect(() => {
    loadCreditPackages();
  }, [loadCreditPackages, refresh]); // Dodano loadCreditPackages do zależności

  const stripe = useStripe();
  const elements = useElements();
  const [message, setMessage] = useState("");

  // 🔹 Pobieramy dane użytkownika z `localStorage`
  const storedUserData = localStorage.getItem("userData");
  let username = "unknown_user"; // Domyślna wartość, jeśli `userData` nie istnieje

  if (storedUserData) {
    try {
      const parsedData = JSON.parse(storedUserData);
      username = parsedData.username || "unknown_user"; // Pobranie `username`
    } catch (error) {
      console.error("Błąd parsowania `userData` z localStorage:", error);
    }
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    // Pobranie username z localStorage
    const userData = localStorage.getItem("userData");
    const parsedUserData = userData ? JSON.parse(userData) : {};
    const username = parsedUserData.username || "unknown_user"; // Fallback, gdyby było puste
    const user_id = parsedUserData.id || "unknown_idr"; // Fallback, gdyby było puste

    const response = await fetch("/api/payments/create-payment-intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: 1000,
        username: username, // <-- Dodajemy username
        user_id: user_id,
      }),
    });

    const { clientSecret } = await response.json();

    const { paymentIntent, error } = await stripe!.confirmCardPayment(
      clientSecret,
      {
        payment_method: {
          card: elements!.getElement(CardElement)!,
        },
      }
    );

    if (error) {
      setMessage(`Error: ${error.message}`);
    } else {
      setMessage(`Success! Payment ID: ${paymentIntent?.id}`);
    }
  };

  if (!translations || !creditPackages) {
    return <div>Ładowanie...</div>;
  }
  return (
    <form onSubmit={handleSubmit}>
      <CardElement />

      <p>{message}</p>

      <ul className="space-y-4">
        {creditPackages.length > 0 ? (
          creditPackages.map((pkg) => (
            <li
              key={pkg.id}
              className="flex justify-between items-center py-2 px-4 bg-white rounded shadow text-sm"
            >
              <span>
                {translations.credits}: {pkg.credits}, {translations.price}:{" "}
                {pkg.priceInCents / 100} zł
              </span>

              <button
                type="submit"
                disabled={!stripe}
                className="mt-4 px-4 py-3 bg-blue-500 text-white rounded-lg text-lg font-semibold hover:bg-blue-600 transition"
              >
                {translations.top_up_account}
              </button>
            </li>
          ))
        ) : (
          <li className="text-gray-500">{translations.no_packages}</li>
        )}
      </ul>
    </form>
  );
};

export default function PaymentPage() {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm />
    </Elements>
  );
}
