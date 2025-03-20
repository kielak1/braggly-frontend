import { NextResponse } from "next/server";
import { stripe } from "../stripe";

export async function POST(req: Request) {
  try {
    const { amount } = await req.json(); // Kwota w centach, np. 1000 = 10 USD

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "pln",
      payment_method_types: ["card"],
    });

    return NextResponse.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error("Stripe Error:", error);
    return NextResponse.json({ error: "Błąd podczas tworzenia płatności" }, { status: 500 });
  }
}

