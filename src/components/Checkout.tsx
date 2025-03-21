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
import { fetchCreditPackages, CreditPackage } from "@/utils/api";
import { getCookie } from "@/utils/cookies";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY!);

const CheckoutForm = () => {
  const [translations, setTranslations] = useState<Record<string, string> | null>(null);
  useFetchTranslations(setTranslations, getCookie);
  const [creditPackages, setCreditPackages] = useState<CreditPackage[] | null>(null);
  const loadCreditPackages = useCallback(async () => {
    const packages = await fetchCreditPackages();
    setCreditPackages(packages);
  }, []);
  const [refresh, setRefresh] = useState(false);
  useEffect(() => {
    loadCreditPackages();
  }, [loadCreditPackages, refresh]);

  const stripe = useStripe();
  const elements = useElements();
  const [message, setMessage] = useState("");

  // Pobieramy dane użytkownika z localStorage
  const storedUserData = localStorage.getItem("userData");
  let username = "unknown_user";
  let user_id = "unknown_id";
  if (storedUserData) {
    try {
      const parsedData = JSON.parse(storedUserData);
      username = parsedData.username || "unknown_user";
      user_id = parsedData.id || "unknown_id";
    } catch (error) {
      console.error("Błąd parsowania `userData` z localStorage:", error);
    }
  }

  // Funkcja handleSubmit z parametrem pakietu
  const handleSubmit = async (event: React.FormEvent, pkg: CreditPackage) => {
    event.preventDefault();

    // Sprawdzamy, czy stripe i elements są dostępne
    if (!stripe || !elements) {
      setMessage("Stripe nie jest jeszcze załadowany.");
      return;
    }

    const response = await fetch("/api/payments/create-payment-intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: pkg.priceInCents,
        username: username,
        user_id: user_id,
        package_id: pkg.id,
      }),
    });

    const { clientSecret } = await response.json();

    const { paymentIntent, error } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: elements.getElement(CardElement)!,
      },
    });

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
    <form>
      <CardElement />
      <p>{message}</p>

      <ul className="space-y-4">
        {creditPackages.length > 0 ? (
          creditPackages.map((pkg) => (
            <li
              key={pkg.id}
              className="flex justify-between items-center py-1 px-4 bg-white rounded shadow text-sm"
            >
              <span>
                {translations.credits}: {pkg.credits}, {translations.price}:{" "}
                {pkg.priceInCents / 100} zł
              </span>

              <button
                type="submit"
                disabled={!stripe}
                onClick={(e) => handleSubmit(e, pkg)}
                className="px-4 py-1 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition"
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