import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Rutas públicas: landing, auth de Clerk y endpoints que se autentican
// por su propia firma (webhooks de Stripe, handler de Inngest).
const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks/(.*)",
  "/api/inngest",
]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    // Sin unauthenticatedUrl, auth.protect() responde 404 en vez de
    // redirigir — es el comportamiento por defecto de Clerk cuando no
    // hay signInUrl configurado a nivel de instancia.
    await auth.protect({ unauthenticatedUrl: new URL("/sign-in", req.url).toString() });
  }
});

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)", "/(api|trpc)(.*)"],
};
