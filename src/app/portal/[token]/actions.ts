"use server";

import Stripe from "stripe";
import { getSystemDb } from "@/lib/tenant";
import { redirect } from "next/navigation";

// Instanciado bajo demanda: crearlo a nivel de módulo rompe el build de
// Next.js si STRIPE_SECRET_KEY aún no está configurada (mismo patrón que
// api/webhooks/stripe/route.ts).
let stripe: Stripe | undefined;
function getStripeClient() {
  if (!stripe) stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  return stripe;
}

// Sin valor de retorno: se usa directo como `action` de un <form> sin JS
// en el cliente, así que la única forma de comunicar un error es
// redirigir de vuelta a la misma página con ?error=... en vez de
// devolver un objeto (form actions nativas solo aceptan void/Promise<void>).
export async function createCheckoutSession(token: string): Promise<void> {
  const db = getSystemDb();
  const invoice = await db.invoice.findUnique({
    where: { publicToken: token },
    include: { client: true },
  });

  if (!invoice || invoice.status === "PAGADA") {
    redirect(`/portal/${token}?error=1`);
  }

  const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://powerful-crm.vercel.app";

  const session = await getStripeClient().checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: invoice.currency.toLowerCase(),
          product_data: { name: `Factura ${invoice.number}` },
          unit_amount: Math.round(Number(invoice.total) * 100),
        },
        quantity: 1,
      },
    ],
    customer_email: invoice.client.email ?? undefined,
    metadata: { invoiceId: invoice.id },
    success_url: `${siteUrl}/portal/${token}?pago=exitoso`,
    cancel_url: `${siteUrl}/portal/${token}?pago=cancelado`,
  });

  if (!session.url) redirect(`/portal/${token}?error=1`);
  redirect(session.url);
}
