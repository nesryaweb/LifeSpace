
import { Suspense } from "react";
import LoginForm from "./LoginForm";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        < className="flex min-h-screen items-center justify-center bg-[#faf8f5] px-5">
          <p className="text-sm text-[#897e83]">Loading login...</p>
        </main>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
