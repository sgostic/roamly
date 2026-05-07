
-- set_updated_at search_path
create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end; $$;

-- Revoke public execute on security definer functions
revoke execute on function public.has_role(uuid, public.app_role) from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- Re-grant has_role to authenticated (needed in RLS policies, but we use it via SECURITY DEFINER inside policy expressions so no grant needed). Policies invoke as the function owner regardless.
grant execute on function public.has_role(uuid, public.app_role) to authenticated;

-- Restrict public listing of offer-photos: drop broad public select, rely on direct public URL access
drop policy if exists "Public read offer photos" on storage.objects;
-- Public URLs work without policy because bucket is public; listing requires policy. Skip listing policy.
