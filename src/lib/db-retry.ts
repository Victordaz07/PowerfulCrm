/**
 * Reintenta una operacion de Prisma que puede fallar por cold-start
 * del compute de Neon (autosuspend en plan free). A diferencia del
 * retry de Inngest a nivel de funcion (que espera minutos/horas entre
 * intentos), este reintenta en segundos - pensado especificamente
 * para "Can't reach database server" al despertar el endpoint.
 */
export async function withDbRetry<T>(
    fn: () => Promise<T>,
    options: { attempts?: number; delaysMs?: number[] } = {}
  ): Promise<T> {
    const attempts = options.attempts ?? 3;
    const delaysMs = options.delaysMs ?? [500, 1500, 3000];
    let lastError: unknown;
    for (let i = 0; i < attempts; i++) {
          try {
                  return await fn();
          } catch (err) {
                  lastError = err;
                  const msg = err instanceof Error ? err.message : String(err);
                  if (!msg.includes("Can't reach database server")) throw err;
                  if (i < attempts - 1) await new Promise((r) => setTimeout(r, delaysMs[i] ?? 3000));
          }
    }
    throw lastError;
}
