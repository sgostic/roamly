import { Link } from "@tanstack/react-router";
import { CalendarDays, MapPin, Users, Wallet } from "lucide-react";
import type { TravelRequest } from "@/lib/marketplace";
import { format } from "date-fns";

export function RequestCard({ r }: { r: TravelRequest }) {
  return (
    <Link
      to="/requests/$id"
      params={{ id: r.id }}
      className="group block rounded-2xl border bg-card p-5 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />
            {r.flexible_destination ? "Flexible destination" : r.destination ?? "—"}
          </div>
          <h3 className="font-display text-xl font-semibold mt-1 group-hover:text-primary transition-colors">
            {r.flexible_destination ? "Open to suggestions" : r.destination}
          </h3>
        </div>
        <span className={`text-xs rounded-full px-2 py-1 ${r.status === "open" ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}>
          {r.status}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-3 text-sm text-muted-foreground">
        <div className="flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5" />{format(new Date(r.date_start), "MMM d")}–{format(new Date(r.date_end), "MMM d")}</div>
        <div className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" />{r.travelers_count}</div>
        <div className="flex items-center gap-1.5"><Wallet className="h-3.5 w-3.5" />{r.currency} {r.budget_min}-{r.budget_max}</div>
      </div>
      {r.preferences.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {r.preferences.slice(0, 4).map((p) => (
            <span key={p} className="text-xs rounded-full bg-secondary px-2 py-0.5">{p}</span>
          ))}
        </div>
      )}
    </Link>
  );
}
