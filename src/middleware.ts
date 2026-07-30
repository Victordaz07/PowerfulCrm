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
    await auth.protect();
  }
});

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)", "/(api|trpc)(.*)"],
};
