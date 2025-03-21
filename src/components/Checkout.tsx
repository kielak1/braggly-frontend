"use client";
import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  useStripe,
  useElements,
  CardElement,
} from "@stripe/react-stripe-js";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY!);

const CheckoutForm = () => {
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

  return (
    <form onSubmit={handleSubmit}>
      <CardElement />
      <button type="submit" disabled={!stripe}>
        Zapłać
      </button>
      <p>{message}</p>
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
