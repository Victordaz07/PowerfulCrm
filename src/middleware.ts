import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Rutas públicas: landing, auth de Clerk y endpoints que se autentican
// por su propia firma (webhooks de Stripe, handler de Inngest).
const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks/(.*)",
  "/api/inngest",
  "/portal/(.*)", // portal de cliente: acceso por token, sin cuenta de Clerk
]);

export default clerkMiddleware(
  async (auth, req) => {
    if (!isPublicRoute(req)) {
      // Sin unauthenticatedUrl, auth.protect() responde 404 en vez de
      // redirigir — es el comportamiento por defecto de Clerk cuando no
      // hay signInUrl configurado a nivel de instancia.
      await auth.protect({ unauthenticatedUrl: new URL("/sign-in", req.url).toString() });
    }
  },
  {
    // CSP auto-generado por Clerk: incluye su FAPI, dominios de
    // protección anti-abuso y (por defecto) los de Stripe. El checkout
    // real es un redirect a checkout.stripe.com (ver
    // api/webhooks/stripe/route.ts), no Stripe.js embebido, así que el
    // modo "standard" alcanza sin necesitar directivas extra.
    contentSecurityPolicy: {},
  }
);

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)", "/(api|trpc)(.*)"],
};
