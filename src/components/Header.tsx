import { Link, useNavigate } from "@tanstack/react-router";
import { Plane, LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export function Header() {
  const { user, signOut, isProvider } = useAuth();
  const navigate = useNavigate();
  return (
    <header className="border-b bg-background/80 backdrop-blur sticky top-0 z-40">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 font-display text-xl font-semibold">
          <Plane className="h-5 w-5 text-primary" />
          Roamly
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm">
          <Link to="/requests" className="text-muted-foreground hover:text-foreground transition-colors">Browse requests</Link>
          {user && <Link to="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">Dashboard</Link>}
        </nav>
        <div className="flex items-center gap-2">
          {user ? (
            <>
              {isProvider && <span className="hidden sm:inline-block rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent">Provider</span>}
              <Link to="/profile"><Button variant="ghost" size="sm">Profile</Button></Link>
              <Button variant="ghost" size="icon" onClick={async () => { await signOut(); navigate({ to: "/" }); }} aria-label="Sign out">
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <Link to="/auth"><Button size="sm">Sign in</Button></Link>
          )}
        </div>
      </div>
    </header>
  );
}
