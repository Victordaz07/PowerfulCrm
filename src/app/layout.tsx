import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { cookies } from "next/headers";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://powerful-crm.vercel.app";
const title = "FreelanceHub — CRM, proyectos y facturación";
const description =
  "Gestor de negocio todo en uno para freelancers y creadores independientes.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: title,
    template: "%s · FreelanceHub",
  },
  description,
  icons: {
    icon: [
      { url: "/icons/favicon.ico", sizes: "any" },
      { url: "/icons/app-icon-1024.png", type: "image/png", sizes: "1024x1024" },
    ],
    apple: [{ url: "/icons/app-icon-1024.png", sizes: "1024x1024" }],
  },
  openGraph: {
    title,
    description,
    url: siteUrl,
    siteName: "FreelanceHub",
    images: [{ url: "/social/og-image.png", width: 1200, height: 630, alt: title }],
    locale: "es_ES",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/social/og-image.png"],
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Tema desde la cookie `theme` (la escribe <ThemeToggle> en cliente).
  // Se aplica como clase en <html> en el server, así no hay flash de
  // tema incorrecto (FOUC) y no necesitamos un script inline — que el
  // CSP estricto (proxy.ts) bloquearía de todos modos. Oscuro es default.
  const theme = (await cookies()).get("theme")?.value === "light" ? "light" : "dark";

  return (
    // `dynamic` es obligatorio con contentSecurityPolicy.strict en el
    // middleware (proxy.ts) — el nonce se genera por request, así que
    // esto fuerza render dinámico de este layout (ya lo era en la
    // práctica: todo lo que cuelga de (dashboard) usa auth()/cookies).
    <ClerkProvider dynamic>
      <html lang="es" className={theme} suppressHydrationWarning>
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
