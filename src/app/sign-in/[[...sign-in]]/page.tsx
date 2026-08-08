import { SignIn } from "@clerk/nextjs";
import Image from "next/image";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-ink-950 px-4">
      <Image
        src="/logo/freelancehub-full-logo.png"
        alt="FreelanceHub"
        width={220}
        height={58}
        priority
      />
      <SignIn />
    </div>
  );
}
