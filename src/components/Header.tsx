import Link from "next/link";
import { Plane } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth";
import { SignOutButton } from "./SignOutButton";

export async function Header() {
  const user = await getCurrentUser();
  const isProvider = user?.role === "provider";

  return (
    <header className="border-b bg-background/80 backdrop-blur sticky top-0 z-40">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-display text-xl font-semibold">
          <Plane className="h-5 w-5 text-primary" />
          Roamly
        </Link>

        {user && (
          <nav className="hidden md:flex items-center gap-6 text-sm">
            {isProvider && (
              <Link
                href="/requests"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Browse requests
              </Link>
            )}
            <Link
              href="/dashboard"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Dashboard
            </Link>
          </nav>
        )}

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <span
                className={`hidden sm:inline-block rounded-full px-3 py-1 text-xs font-medium capitalize ${
                  isProvider ? "bg-accent/10 text-accent" : "bg-primary/10 text-primary"
                }`}
              >
                {user.role}
              </span>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/profile">Profile</Link>
              </Button>
              <SignOutButton />
            </>
          ) : (
            <Button variant="ghost" size="sm" asChild>
              <Link href="/auth?tab=signin">Sign in</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
