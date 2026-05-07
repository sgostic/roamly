// In-memory mock that mimics enough of @supabase/supabase-js to satisfy this app
// when SUPABASE_SERVICE_ROLE_KEY is not configured. State is attached to globalThis
// so it survives Next.js dev HMR module reloads. Resets on server restart.

import type { OfferRow, ProfileRow, TravelRequestRow } from "@/lib/marketplace";
import { SEED_OFFERS, SEED_PROFILES, SEED_TRAVEL_REQUESTS } from "./mock-data";

type TableName = "profiles" | "travel_requests" | "offers";
type RowFor<T extends TableName> = T extends "profiles"
  ? ProfileRow
  : T extends "travel_requests"
    ? TravelRequestRow
    : OfferRow;

type MockDB = {
  profiles: ProfileRow[];
  travel_requests: TravelRequestRow[];
  offers: OfferRow[];
};

const GLOBAL_KEY = "__roamlyMockDB__";

function getDB(): MockDB {
  const g = globalThis as unknown as Record<string, unknown>;
  if (!g[GLOBAL_KEY]) {
    g[GLOBAL_KEY] = {
      profiles: SEED_PROFILES.map((r) => ({ ...r })),
      travel_requests: SEED_TRAVEL_REQUESTS.map((r) => ({ ...r })),
      offers: SEED_OFFERS.map((r) => ({ ...r })),
    } satisfies MockDB;
  }
  return g[GLOBAL_KEY] as MockDB;
}

type Filter<T> = (row: T) => boolean;
type OkResult<T> = { data: T; error: null };
type ErrResult = { data: null; error: { message: string; code?: string } };
type Result<T> = OkResult<T> | ErrResult;

class SelectQuery<T extends Record<string, unknown>> implements PromiseLike<OkResult<T[]>> {
  private filters: Filter<T>[] = [];
  private _order: { col: keyof T; asc: boolean } | null = null;
  private _limit: number | null = null;

  constructor(private rows: T[]) {}

  select(_cols?: string): this {
    return this;
  }

  eq(col: keyof T & string, val: unknown): this {
    this.filters.push((r) => r[col] === val);
    return this;
  }

  neq(col: keyof T & string, val: unknown): this {
    this.filters.push((r) => r[col] !== val);
    return this;
  }

  gt(col: keyof T & string, val: unknown): this {
    this.filters.push((r) => {
      const v = r[col];
      return v != null && (v as never) > (val as never);
    });
    return this;
  }

  in(col: keyof T & string, vals: readonly unknown[]): this {
    const set = new Set(vals);
    this.filters.push((r) => set.has(r[col]));
    return this;
  }

  order(col: keyof T & string, opts: { ascending?: boolean } = {}): this {
    this._order = { col, asc: opts.ascending !== false };
    return this;
  }

  limit(n: number): this {
    this._limit = n;
    return this;
  }

  private compute(): T[] {
    let result = this.rows.filter((r) => this.filters.every((f) => f(r)));
    if (this._order) {
      const { col, asc } = this._order;
      result = [...result].sort((a, b) => {
        const av = a[col] as unknown as number | string | null;
        const bv = b[col] as unknown as number | string | null;
        if (av === bv) return 0;
        if (av == null) return asc ? -1 : 1;
        if (bv == null) return asc ? 1 : -1;
        return asc ? (av < bv ? -1 : 1) : av > bv ? -1 : 1;
      });
    }
    if (this._limit !== null) result = result.slice(0, this._limit);
    return result.map((r) => ({ ...r }));
  }

  async maybeSingle(): Promise<Result<T>> {
    const rows = this.compute();
    return { data: rows[0] ?? null, error: null } as Result<T>;
  }

  async single(): Promise<Result<T>> {
    const rows = this.compute();
    if (rows.length === 0) {
      return { data: null, error: { message: "No rows found", code: "PGRST116" } };
    }
    return { data: rows[0], error: null };
  }

  then<TResult1 = OkResult<T[]>, TResult2 = never>(
    onfulfilled?: ((value: OkResult<T[]>) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    return Promise.resolve({ data: this.compute(), error: null as null }).then(
      onfulfilled,
      onrejected,
    );
  }
}

class InsertQuery<T extends Record<string, unknown>> implements PromiseLike<OkResult<T[]>> {
  constructor(
    private store: T[],
    private inserted: T[],
  ) {
    store.push(...inserted);
  }

  select(_cols?: string): this {
    return this;
  }

  async maybeSingle(): Promise<Result<T>> {
    return { data: this.inserted[0] ?? null, error: null } as Result<T>;
  }

  async single(): Promise<Result<T>> {
    if (this.inserted.length === 0) {
      return { data: null, error: { message: "Insert produced no rows" } };
    }
    return { data: this.inserted[0], error: null };
  }

  then<TResult1 = OkResult<T[]>, TResult2 = never>(
    onfulfilled?: ((value: OkResult<T[]>) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    return Promise.resolve({
      data: this.inserted.map((r) => ({ ...r })),
      error: null as null,
    }).then(onfulfilled, onrejected);
  }
}

class UpdateQuery<T extends Record<string, unknown>> implements PromiseLike<OkResult<T[]>> {
  private filters: Filter<T>[] = [];

  constructor(
    private store: T[],
    private patch: Partial<T>,
  ) {}

  eq(col: keyof T & string, val: unknown): this {
    this.filters.push((r) => r[col] === val);
    return this;
  }

  in(col: keyof T & string, vals: readonly unknown[]): this {
    const set = new Set(vals);
    this.filters.push((r) => set.has(r[col]));
    return this;
  }

  private apply(): T[] {
    const matched: T[] = [];
    const now = new Date().toISOString();
    for (const row of this.store) {
      if (!this.filters.every((f) => f(row))) continue;
      Object.assign(row, this.patch);
      if ("updated_at" in row) (row as Record<string, unknown>).updated_at = now;
      matched.push(row);
    }
    return matched;
  }

  then<TResult1 = OkResult<T[]>, TResult2 = never>(
    onfulfilled?: ((value: OkResult<T[]>) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    return Promise.resolve({
      data: this.apply().map((r) => ({ ...r })),
      error: null as null,
    }).then(onfulfilled, onrejected);
  }
}

function withDefaults<T extends TableName>(table: T, row: Partial<RowFor<T>>): RowFor<T> {
  const now = new Date().toISOString();
  const base: Record<string, unknown> = {
    id: crypto.randomUUID(),
    created_at: now,
    updated_at: now,
  };
  if (table === "profiles") {
    base.role = "traveler";
    base.avatar_url = null;
    base.bio = null;
    base.company_name = null;
    base.email = null;
    base.display_name = null;
  } else if (table === "travel_requests") {
    base.currency = "USD";
    base.flexible_destination = false;
    base.preferences = [];
    base.status = "open";
    base.travelers_count = 1;
    const expires = new Date();
    expires.setDate(expires.getDate() + 14);
    base.expires_at = expires.toISOString();
    base.notes = null;
    base.destination = null;
  } else {
    base.currency = "USD";
    base.included_services = [];
    base.photos = [];
    base.status = "pending";
    base.accommodation = null;
    base.description = null;
    const expires = new Date();
    expires.setDate(expires.getDate() + 7);
    base.expires_at = expires.toISOString();
  }
  return { ...base, ...(row as Record<string, unknown>) } as RowFor<T>;
}

function acceptOfferRpc(p_offer_id: string): Result<null> {
  const db = getDB();
  const offer = db.offers.find((o) => o.id === p_offer_id);
  if (!offer) return { data: null, error: { message: "Offer not found", code: "P0002" } };

  const now = new Date().toISOString();
  offer.status = "accepted";
  offer.updated_at = now;
  for (const o of db.offers) {
    if (o.request_id === offer.request_id && o.id !== offer.id && o.status === "pending") {
      o.status = "rejected";
      o.updated_at = now;
    }
  }
  const req = db.travel_requests.find((r) => r.id === offer.request_id);
  if (req) {
    req.status = "closed";
    req.updated_at = now;
  }
  return { data: null, error: null };
}

const storage = {
  from(bucket: string) {
    return {
      async upload(
        path: string,
        _file: File | Blob,
        _opts?: { contentType?: string; upsert?: boolean },
      ) {
        return {
          data: { path, fullPath: `${bucket}/${path}`, id: crypto.randomUUID() },
          error: null as null,
        };
      },
      getPublicUrl(path: string) {
        const label = encodeURIComponent(path.split("/").pop() ?? "photo");
        return {
          data: {
            publicUrl: `https://placehold.co/800x600/E5C8B3/FFFFFF/png?text=${label}`,
          },
        };
      },
    };
  },
};

export const mockSupabaseAdmin = {
  from<T extends TableName>(tableName: T) {
    const rows = getDB()[tableName] as RowFor<T>[];
    return {
      select(cols?: string) {
        return new SelectQuery<RowFor<T>>(rows).select(cols);
      },
      insert(input: Partial<RowFor<T>> | Partial<RowFor<T>>[]) {
        const arr = Array.isArray(input) ? input : [input];
        const inserted = arr.map((r) => withDefaults(tableName, r));
        return new InsertQuery<RowFor<T>>(rows, inserted);
      },
      update(patch: Partial<RowFor<T>>) {
        return new UpdateQuery<RowFor<T>>(rows, patch);
      },
    };
  },
  async rpc(name: string, args: Record<string, unknown>) {
    if (name === "accept_offer") {
      return acceptOfferRpc(args.p_offer_id as string);
    }
    return { data: null, error: { message: `Mock: unknown RPC '${name}'` } };
  },
  storage,
};
