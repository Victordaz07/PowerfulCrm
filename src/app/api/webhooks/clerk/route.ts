import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { rawPrisma } from "@/lib/prisma";
import { NextResponse, type NextRequest } from "next/server";

// Provisiona (o actualiza) la fila en `tenants` cuando Clerk crea o
// actualiza una Organization. Esta es ahora la vía "correcta" de
// aprovisionamiento — el upsert perezoso dentro de `getTenantDb()`
// se deja como red de seguridad (por si un webhook se pierde o llega
// tarde), no se elimina, porque es barato y evita romper escrituras
// si este endpoint falla o Clerk reintenta con retraso.
//
// Configuración pendiente en el Dashboard de Clerk (Webhooks):
//   URL:     https://powerful-crm.vercel.app/api/webhooks/clerk
//   Eventos: organization.created, organization.updated
//   Secret:  copiar el "Signing Secret" (whsec_...) a la env var
//            CLERK_WEBHOOK_SIGNING_SECRET en Vercel (Production).
export async function POST(req: NextRequest) {
  let event;
  try {
    event = await verifyWebhook(req);
  } catch (err) {
    return NextResponse.json({ error: "Firma inválida" }, { status: 400 });
  }

  if (event.type === "organization.created" || event.type === "organization.updated") {
    const org = event.data;
    await rawPrisma.tenant.upsert({
      where: { id: org.id },
      update: { name: org.name, slug: org.slug ?? org.id },
      create: { id: org.id, name: org.name, slug: org.slug ?? org.id },
    });
  }

  return NextResponse.json({ received: true });
}
