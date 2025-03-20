import { NextResponse } from "next/server";
import { stripe } from "../stripe";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Brak podpisu Stripe" }, { status: 400 });
  }

  let event;

  try {
    const body = await req.text();
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret!);
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  if (event.type === "payment_intent.succeeded") {
    console.log("💰 Płatność zakończona sukcesem:", event.data.object.id);
    // Tutaj możesz zaktualizować bazę danych
  }

  return NextResponse.json({ received: true });
}
