import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { getCurrentUser } from "@/lib/auth";
import { AuthForm, AuthHero } from "./AuthForm";

export const metadata: Metadata = { title: "Sign in — Roamly" };

export default async function AuthPage() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 grid place-items-center px-4 py-12">
        <div className="w-full max-w-md">
          <AuthHero />
          <AuthForm />
        </div>
      </main>
    </div>
  );
}
