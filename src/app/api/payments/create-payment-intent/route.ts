import { NextResponse } from "next/server";
import { stripe } from "../stripe";

export async function POST(req: Request) {
  try {
    const { amount, username, user_id } = await req.json(); // Pobranie amount i username z ciała żądania

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "pln",
      payment_method_types: ["card"],
      metadata: { username, user_id }, // Dodanie username do metadanych
    });

    return NextResponse.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error("Stripe Error:", error);
    return NextResponse.json({ error: "Błąd podczas tworzenia płatności" }, { status: 500 });
  }
}