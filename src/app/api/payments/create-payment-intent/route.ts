import { NextResponse } from "next/server";
import { stripe } from "../stripe";

export async function POST(req: Request) {
  try {
    const { amount, username, user_id, package_id } = await req.json();

    // Lista metod płatności, które chcesz obsługiwać
    const paymentMethods = [
      "card", // Karty kredytowe
      "p24", // Przelewy24
   //   "bancontact", // Bancontact
   //   "klarna", // Buy Now, Pay Later
      "blik", // BLIK
    //  "eps", // EPS
   //  "giropay", // giropay
    //  "twint", // TWINT
      "paypal", // PayPal
  //    "revolut_pay", // Revolut Pay
      // Apple Pay, Google Pay i Link są automatycznie obsługiwane przez PaymentElement, jeśli użytkownik ma kompatybilne urządzenie
    ];

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "pln",
      payment_method_types: paymentMethods, // Używamy dynamicznej listy metod
      metadata: { username, user_id, package_id },
    });

    return NextResponse.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error("Stripe Error:", error);
    return NextResponse.json(
      { error: "Błąd podczas tworzenia płatności" },
      { status: 500 }
    );
  }
}
