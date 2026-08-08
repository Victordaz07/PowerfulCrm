/** @type {import('next').NextConfig} */

// Headers de seguridad aplicados a todas las rutas. CSP se deja fuera por
// ahora a propósito: Clerk, Stripe.js y algunos scripts inline necesitan
// nonces/ajuste fino para no romper la app — se agrega en una pasada
// dedicada en vez de arriesgar un CSP genérico que bloquee el login o el
// checkout. El resto de los headers no tiene ese riesgo y es seguro subirlo ya.
const securityHeaders = [
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "X-Frame-Options",
    value: "SAMEORIGIN",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
];

const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

module.exports = nextConfig;
