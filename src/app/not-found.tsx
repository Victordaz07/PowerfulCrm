import Link from "next/link";
import Image from "next/image";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-ink-950 px-4 text-center">
      <Image
        src="/illustrations/error-404.png"
        alt=""
        width={200}
        height={200}
        priority
      />
      <div>
        <h1 className="text-xl font-semibold text-ink-50">No encontramos esta página</h1>
        <p className="mt-1 text-sm text-ink-400">
          El enlace puede estar roto o la página ya no existe.
        </p>
      </div>
      <Link href="/dashboard" className={buttonVariants({ variant: "primary", size: "md" })}>
        Volver al inicio
      </Link>
    </div>
  );
}
