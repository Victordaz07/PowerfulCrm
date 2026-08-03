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
    // CSP estricto: Clerk genera un nonce por request y lo propaga solo
    // a <ClerkProvider> (requiere el prop `dynamic`, ver layout.tsx). No
    // hay scripts inline propios en la app (grep verificado: sin
    // next/script ni <script> a mano) y el checkout es un redirect a
    // checkout.stripe.com (no Stripe.js embebido), así que el modo
    // estricto no debería romper nada — pero es el cambio de más riesgo
    // de esta pasada porque toca el flujo de login. Si algo se rompe en
    // preview, revertir a `contentSecurityPolicy: {}` (modo standard).
    contentSecurityPolicy: {
      strict: true,
    },
  }
);

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)", "/(api|trpc)(.*)"],
};
