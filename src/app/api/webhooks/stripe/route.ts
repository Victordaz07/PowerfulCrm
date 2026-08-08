import Stripe from "stripe";
import { rawPrisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// Instanciado bajo demanda: crearlo a nivel de módulo rompe el build de
// Next.js si STRIPE_SECRET_KEY aún no está configurada (el SDK de Stripe
// lanza en el constructor cuando falta la key).
let stripe: Stripe | undefined;
function getStripe() {
  if (!stripe) stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  return stripe;
}

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature")!;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    return NextResponse.json({ error: "Firma inválida" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const invoiceId = session.metadata?.invoiceId;
      if (invoiceId) {
        // Idempotencia: Stripe puede reenviar el mismo evento varias veces
        // (reintentos de webhook) — si esta factura ya quedó marcada como
        // pagada no la volvemos a procesar.
        await rawPrisma.invoice.updateMany({
          where: { id: invoiceId, status: { not: "PAGADA" } },
          data: {
            status: "PAGADA",
            paidAt: new Date(),
            stripePaymentIntentId: session.payment_intent as string,
          },
        });
      }
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
