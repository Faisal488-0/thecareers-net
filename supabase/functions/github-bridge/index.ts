import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { createRemoteJWKSet, jwtVerify } from "npm:jose@6";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });
const JWKS = createRemoteJWKSet(new URL("https://token.actions.githubusercontent.com/.well-known/jwks"));
const AUDIENCE = "thecareers-supabase";
const REPO = "Faisal488-0/thecareers-net";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

async function authenticate(req: Request) {
  const auth = req.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token) throw new Error("Missing GitHub OIDC token");
  const { payload } = await jwtVerify(token, JWKS, { issuer: "https://token.actions.githubusercontent.com", audience: AUDIENCE });
  if (payload.repository !== REPO) throw new Error("Repository not allowed");
  if (payload.ref !== "refs/heads/main") throw new Error("Only main branch is allowed");
  return payload;
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return json({ error: "POST only" }, 405);
  try {
    const claims = await authenticate(req);
    const body = await req.json();
    const action = body?.action;

    if (action === "list_sources") {
      // Fair rotation: scan sources that have never/least-recently been scanned first.
      // A bounded batch lets every scheduled run finish and prevents low-priority starvation.
      const { data, error } = await supabase.from("sources")
        .select("*")
        .eq("enabled", true)
        .order("last_scan_at", { ascending: true, nullsFirst: true })
        .order("priority", { ascending: false })
        .limit(40);
      if (error) throw error;
      return json({ ok: true, data });
    }

    if (action === "sync_sources") {
      const sources = Array.isArray(body.sources) ? body.sources : [];
      let added = 0, updated = 0; const failures: string[] = [];
      for (const source of sources) {
        try {
          const { data: existing, error: qerr } = await supabase.from("sources").select("id").eq("url", source.url).limit(1);
          if (qerr) throw qerr;
          if (existing?.length) {
            const { error } = await supabase.from("sources").update(source).eq("id", existing[0].id);
            if (error) throw error; updated++;
          } else {
            const { error } = await supabase.from("sources").insert(source);
            if (error) throw error; added++;
          }
        } catch (e) { failures.push(`${source?.name || source?.url}: ${String(e)}`); }
      }
      await supabase.from("search_events").insert({ level: failures.length ? "warning" : "ok", message: `Source expansion sync: ${added} new, ${updated} refreshed, ${failures.length} failed`, meta: { source_names: sources.map((s: any) => s.name), failures, via: "github_oidc", actor: claims.actor } });
      return json({ ok: failures.length === 0, added, updated, failures });
    }

    if (action === "begin_run") {
      const staleBefore = new Date(Date.now() - 20 * 60_000).toISOString();
      await supabase.from("search_runs").update({ status: "failed", completed_at: new Date().toISOString(), meta: { stale_recovered: true, via: "github_oidc" } }).eq("status", "running").lt("started_at", staleBefore);
      const { data, error } = await supabase.from("search_runs").insert({ trigger: "github_actions", status: "running", started_at: new Date().toISOString(), meta: { via: "github_oidc" } }).select("id").single();
      if (error) throw error;
      return json({ ok: true, data });
    }

    if (action === "event") {
      const { error } = await supabase.from("search_events").insert({ run_id: body.run_id || null, message: String(body.message || ""), level: body.level || "info", meta: body.meta || {} });
      if (error) throw error;
      return json({ ok: true });
    }

    if (action === "upsert_jobs") {
      const incoming = Array.isArray(body.rows) ? body.rows : [];
      if (!incoming.length) return json({ ok: true, count: 0, skipped_invalid: 0 });
      const fingerprints = [...new Set(incoming.map((r:any)=>r?.fingerprint).filter(Boolean))];
      const existingMap = new Map<string, any>();
      for (let i=0; i<fingerprints.length; i+=200) {
        const chunk = fingerprints.slice(i,i+200);
        const { data, error } = await supabase.from("jobs").select("fingerprint,verified,status,found_at").in("fingerprint", chunk);
        if (error) throw error;
        for (const row of data || []) existingMap.set(row.fingerprint, row);
      }
      let skippedInvalid = 0;
      const rows = incoming.flatMap((row:any) => {
        const old = existingMap.get(row.fingerprint);
        if (old?.status === "invalid") { skippedInvalid++; return []; }
        return [{ ...row, verified: Boolean(row.verified || old?.verified), found_at: old?.found_at || row.found_at || new Date().toISOString() }];
      });
      if (!rows.length) return json({ ok: true, count: 0, skipped_invalid: skippedInvalid });
      const { error } = await supabase.from("jobs").upsert(rows, { onConflict: "fingerprint", ignoreDuplicates: false });
      if (error) throw error;
      return json({ ok: true, count: rows.length, skipped_invalid: skippedInvalid });
    }

    if (action === "list_jobs_for_audit") {
      const limit = Math.max(1, Math.min(Number(body.limit || 600), 600));
      const { data, error } = await supabase.from("jobs")
        .select("id,title,company,location,url,verified,status,published_at,found_at,updated_at")
        .eq("status", "active")
        .eq("verified", true)
        .order("updated_at", { ascending: true, nullsFirst: true })
        .limit(limit);
      if (error) throw error;
      return json({ ok: true, data });
    }

    if (action === "audit_job") {
      const id = String(body.job_id || "");
      const state = String(body.state || "unknown");
      const reason = String(body.reason || "").slice(0, 180);
      if (!id) return json({ error: "Missing job_id" }, 400);
      const now = new Date().toISOString();
      const fields = state === "dead"
        ? { status: "invalid", verified: false, updated_at: now }
        : { updated_at: now };
      const { error } = await supabase.from("jobs").update(fields).eq("id", id);
      if (error) throw error;
      if (state === "dead") {
        await supabase.from("search_events").insert({ level: "warning", message: "Removed expired/unreachable job from public feed", meta: { job_id: id, reason, via: "hourly_quality_audit" } });
      }
      return json({ ok: true });
    }

    if (action === "mark_source") {
      const { error } = await supabase.from("sources").update({ last_scan_at: new Date().toISOString(), ...(body.fields || {}) }).eq("id", body.source_id);
      if (error) throw error;
      return json({ ok: true });
    }

    if (action === "finish_run") {
      const { error } = await supabase.from("search_runs").update({ status: body.status || "completed", completed_at: new Date().toISOString(), jobs_found: Number(body.jobs_found || 0), errors: Number(body.errors || 0) }).eq("id", body.run_id);
      if (error) throw error;
      return json({ ok: true });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (e) {
    return json({ error: String(e instanceof Error ? e.message : e) }, 401);
  }
});
