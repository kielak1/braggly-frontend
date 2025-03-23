"use client";
import { useState, useEffect, useCallback } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  useStripe,
  useElements,
  PaymentElement,
} from "@stripe/react-stripe-js";
import { useFetchTranslations } from "@/utils/fetchTranslations";
import { fetchCreditPackages, CreditPackage } from "@/utils/api";
import { getCookie } from "@/utils/cookies";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY!);

const CheckoutForm = ({ updateUserData }: { updateUserData: () => void }) => {
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
  }, [loadCreditPackages, refresh]);

  const [message, setMessage] = useState("");
  const [selectedPackage, setSelectedPackage] = useState<CreditPackage | null>(
    null
  );
  const [clientSecret, setClientSecret] = useState<string | null>(null);

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

  // Funkcja do tworzenia PaymentIntent dla wybranego pakietu
  const createPaymentIntent = async (pkg: CreditPackage) => {
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

    const { clientSecret, error } = await response.json();
    if (error) {
      setMessage(`Błąd: ${error}`);
      return null;
    }
    setClientSecret(clientSecret);
    setSelectedPackage(pkg);
  };

  // Funkcja resetująca formularz
  const resetForm = () => {
    setClientSecret(null);
    setSelectedPackage(null);
  };

  if (!translations || !creditPackages) {
    return <div>Ładowanie...</div>;
  }

  return (
    <div>
      {!(clientSecret && selectedPackage) && (
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
                  type="button"
                  onClick={() => createPaymentIntent(pkg)}
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
      )}

      {clientSecret && selectedPackage && (
        <>
          <div className="mt-6 p-4 rounded-xl border border-blue-200 bg-blue-50 shadow-inner">
            <h2 className="text-blue-800 font-semibold text-sm mb-2">
              {translations.selected_package}:
            </h2>
            <div className="flex justify-between items-center text-sm text-blue-900">
              <span>
                {translations.credits}:{" "}
                <span className="font-bold">{selectedPackage.credits}</span>
              </span>
              <span>
                {translations.price}:{" "}
                <span className="font-bold">
                  {selectedPackage.priceInCents / 100} zł
                </span>
              </span>
            </div>
          </div>

          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <CheckoutFormInner
              clientSecret={clientSecret}
              selectedPackage={selectedPackage}
              translations={translations}
              message={message}
              setMessage={setMessage}
              onSuccess={() => {
                resetForm();
                updateUserData(); // Wywołujemy aktualizację userData po sukcesie
              }}
            />
          </Elements>
        </>
      )}

      {message && <p className="mt-4">{message}</p>}
    </div>
  );
};

const CheckoutFormInner = ({
  clientSecret,
  selectedPackage,
  translations,
  message,
  setMessage,
  onSuccess,
}: {
  clientSecret: string;
  selectedPackage: CreditPackage;
  translations: Record<string, string>;
  message: string;
  setMessage: (message: string) => void;
  onSuccess: () => void;
}) => {
  const stripe = useStripe();
  const elements = useElements();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements || !clientSecret) {
      setMessage("Stripe lub clientSecret nie jest jeszcze załadowany.");
      return;
    }

    const { error: submitError } = await elements.submit();
    if (submitError) {
      setMessage(`Błąd: ${submitError.message}`);
      return;
    }

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      clientSecret,
      confirmParams: {
        return_url: `${window.location.origin}/payment-success`,
      },
      redirect: "if_required",
    });

    if (error) {
      setMessage(`Błąd: ${error.message}`);
      onSuccess();
    } else if (paymentIntent && paymentIntent.status === "succeeded") {
      setMessage(`Sukces! ID płatności: ${paymentIntent.id}`);

      // Ręczna aktualizacja salda w localStorage
      const storedUserData = localStorage.getItem("userData");
      if (storedUserData) {
        const parsedData = JSON.parse(storedUserData);
        const currentCredits = parsedData.balance || 0;
        parsedData.balance = currentCredits + selectedPackage.credits;
        localStorage.setItem("userData", JSON.stringify(parsedData));
      }

      onSuccess(); // Wywołujemy reset i aktualizację userData
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4">
      <PaymentElement />
      <button
        type="submit"
        disabled={!stripe}
        className="mt-4 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
      >
        {translations.confirm_payment}
      </button>
    </form>
  );
};

export default CheckoutForm;
