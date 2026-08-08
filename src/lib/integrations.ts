import { clerkClient } from "@clerk/nextjs/server";

/**
 * Providers soportados por las integraciones OAuth (Fase A: cimiento
 * para sync calendario / envio de correo / import de contactos en las
 * fases B, C y D). Mapea el enum de Prisma (IntegrationProvider) a la
 * estrategia OAuth que usa Clerk internamente.
 */
export type IntegrationProviderName = "GOOGLE" | "MICROSOFT";

const CLERK_OAUTH_PROVIDER: Record<IntegrationProviderName, "oauth_google" | "oauth_microsoft"> = {
    GOOGLE: "oauth_google",
    MICROSOFT: "oauth_microsoft",
};

/**
 * Devuelve el access token OAuth vigente que Clerk tiene guardado para
 * el usuario y el provider dado. Este es el punto UNICO que las fases
 * B/C/D deben usar para llamar a las APIs de Google/Microsoft — Clerk
 * ya maneja el refresh internamente, nunca hay que guardar ni refrescar
 * tokens a mano en nuestra base.
 *
 * Nunca lanza si el usuario no conecto esa cuenta: devuelve null para
 * que el llamador pueda mostrar un estado "conecta tu cuenta" en vez de
 * tronar la request.
 */
export async function getProviderToken(
    userId: string,
    provider: IntegrationProviderName
  ): Promise<string | null> {
    try {
          const client = await clerkClient();
          const strategy = CLERK_OAUTH_PROVIDER[provider];
          const response = await client.users.getUserOauthAccessToken(userId, strategy);
          const token = response.data[0]?.token;
          return token ?? null;
    } catch {
          // Sin cuenta externa conectada para ese provider, u otro error de
      // Clerk al resolver el token — se trata igual como "no conectado".
      return null;
    }
}
