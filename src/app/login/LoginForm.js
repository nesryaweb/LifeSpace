"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Incorrect email or password.");
        return;
      }

      router.replace("/");
      router.refresh();
    } catch {
      setError("Unable to log in. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#faf8f5] px-5 py-12">
      <div className="w-full max-w-md rounded-2xl border border-[#e8e0dc] bg-white p-8 shadow-sm">
        <div className="mb-8 text-center">
          <p className="mb-3 text-sm font-medium tracking-[0.2em] text-[#a17c91]">
            L I F E S P A C E
          </p>

          <h1 className="text-3xl font-semibold text-[#51444d]">
            Welcome back
          </h1>

          <p className="mt-2 text-sm text-[#897e83]">
            Your space is waiting for you.
          </p>
        </div>

        {searchParams.get("registered") === "1" && (
          <p className="mb-5 rounded-lg bg-green-50 p-3 text-sm text-green-700">
            Your account has been created. You can log in now.
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-[#665963]">
              Email address
            </label>

            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-xl border border-[#e8e0dc] bg-[#fdfcfb] px-4 py-3 text-sm outline-none focus:border-[#b58da6]"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-[#665963]">
              Password
            </label>

            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
              className="w-full rounded-xl border border-[#e8e0dc] bg-[#fdfcfb] px-4 py-3 text-sm outline-none focus:border-[#b58da6]"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-[#92748a] px-4 py-3 font-medium text-white transition hover:bg-[#806278] disabled:opacity-60"
          >
            {loading ? "Logging in..." : "Log in"}
          </button>
        </form>

        <p className="mt-7 text-center text-sm text-[#897e83]">
          Don't have an account?{" "}
          <Link
            href="/register"
            className="font-semibold text-[#92748a] hover:underline"
          >
            Create one
          </Link>
        </p>
      </div>
    </main>
  );
}
