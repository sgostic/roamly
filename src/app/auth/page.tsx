import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { getCurrentUser } from "@/lib/auth";
import { AuthForm, AuthHero } from "./AuthForm";

export const metadata: Metadata = { title: "Sign in — Roamly" };

type PageProps = { searchParams: Promise<{ tab?: string }> };

export default async function AuthPage({ searchParams }: PageProps) {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  const { tab } = await searchParams;
  const initialTab: "signin" | "signup" = tab === "signin" ? "signin" : "signup";

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 grid place-items-center px-4 py-12">
        <div className="w-full max-w-md">
          <AuthHero />
          <AuthForm initialTab={initialTab} />
        </div>
      </main>
    </div>
  );
}
