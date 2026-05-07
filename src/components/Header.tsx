"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plane, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Header() {
  const router = useRouter();
  return (
    <header className="border-b bg-background/80 backdrop-blur sticky top-0 z-40">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-display text-xl font-semibold">
          <Plane className="h-5 w-5 text-primary" />
          Roamly
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm">
          <Link
            href="/requests"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Browse requests
          </Link>
          <Link
            href="/dashboard"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Dashboard
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          <span className="hidden sm:inline-block rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
            Provider
          </span>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/profile">Profile</Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/")}
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
