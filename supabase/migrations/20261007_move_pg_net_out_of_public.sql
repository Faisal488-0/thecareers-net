-- 2026-10-07
-- Supabase Advisor lint 0014: keep extension ownership out of public.
-- pg_net is non-relocatable after install, so reinstall it in the extensions schema.
-- Refuse to proceed while queued requests exist.

do $$
begin
  if exists (select 1 from pg_extension where extname='pg_net') then
    if exists (select 1 from net.http_request_queue limit 1) then
      raise exception 'pg_net queue is not empty; refusing to reinstall extension';
    end if;
    drop extension pg_net;
  end if;
  create extension if not exists pg_net schema extensions;
end
$$;
