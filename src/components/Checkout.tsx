"use client";

import { useState, useEffect, useCallback } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  useStripe,
  useElements,
  PaymentElement,
} from "@stripe/react-stripe-js";
import { useTranslations } from "@/context/TranslationsContext"; // ✅
import { fetchCreditPackages, CreditPackage } from "@/utils/api";
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/solid";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY!);

const CheckoutForm = ({ updateUserData }: { updateUserData: () => void }) => {
  const { translations } = useTranslations(); // ✅

  const [creditPackages, setCreditPackages] = useState<CreditPackage[] | null>(
    null
  );
  const [refresh, setRefresh] = useState(false);

  const loadCreditPackages = useCallback(async () => {
    const packages = await fetchCreditPackages();
    setCreditPackages(packages);
  }, []);

  useEffect(() => {
    loadCreditPackages();
  }, [loadCreditPackages, refresh]);

  const [message, setMessage] = useState("");
  const [selectedPackage, setSelectedPackage] = useState<CreditPackage | null>(
    null
  );
  const [clientSecret, setClientSecret] = useState<string | null>(null);

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

  const createPaymentIntent = async (pkg: CreditPackage) => {
    const response = await fetch("/api/payments/create-payment-intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: pkg.priceInCents,
        username,
        user_id,
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
                updateUserData();
              }}
              resetForm={resetForm}
            />
          </Elements>
        </>
      )}

      {message && (
        <div
          className={`mt-4 p-4 rounded-lg flex items-center justify-center space-x-2 shadow-lg max-w-md mx-auto ${
            !message.includes("Błąd")
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {!message.toLowerCase().includes("błąd") ? (
            <CheckCircleIcon className="h-6 w-6 text-green-600" />
          ) : (
            <ExclamationCircleIcon className="h-6 w-6 text-red-600" />
          )}
          <p className="font-medium">{message}</p>
        </div>
      )}
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
  resetForm,
}: {
  clientSecret: string;
  selectedPackage: CreditPackage;
  translations: Record<string, string>;
  message: string;
  setMessage: (message: string) => void;
  onSuccess: () => void;
  resetForm: () => void;
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
      setMessage(`${translations.payment_success} ${paymentIntent.id}`);

      const storedUserData = localStorage.getItem("userData");
      if (storedUserData) {
        const parsedData = JSON.parse(storedUserData);
        const currentCredits = parsedData.balance || 0;
        parsedData.balance = currentCredits + selectedPackage.credits;
        localStorage.setItem("userData", JSON.stringify(parsedData));
      }

      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4">
      <PaymentElement />
      <div className="mt-4 flex space-x-4">
        <button
          type="submit"
          disabled={!stripe}
          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
        >
          {translations.confirm_payment}
        </button>
        <button
          type="button"
          onClick={resetForm}
          className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
        >
          {translations.back || "Cofnij"}
        </button>
      </div>
    </form>
  );
};

export default CheckoutForm;
