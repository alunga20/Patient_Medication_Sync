import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("APP_ORIGIN") ?? "http://localhost:5173",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Vary": "Origin"
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!supabaseUrl || !anonKey) return json({ error: "server_not_configured" }, 500);

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return json({ error: "authentication_required" }, 401);

  // Use the caller's JWT so RLS applies. Never accept a patient_id from the body
  // as proof of identity.
  const supabase = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false }
  });

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return json({ error: "invalid_session" }, 401);

  // Demo-only stub: no pharmacy endpoint is contacted and no clinical data is
  // imported. Replace with an adapter only after receiving official API docs,
  // a sandbox, an approved data-sharing basis, and a reviewed identity-matching
  // workflow. Add rate limiting and request-id/idempotency handling before use.
  const { data: job, error: insertError } = await supabase
    .from("sync_jobs")
    .insert({
      patient_id: user.id,
      provider: "mock",
      status: "succeeded",
      request_id: crypto.randomUUID(),
      records_received: 0,
      started_at: new Date().toISOString(),
      finished_at: new Date().toISOString()
    })
    .select("id, provider, status, records_received, finished_at")
    .single();

  if (insertError) {
    // If RLS blocks insertion, add a server-owned narrowly scoped RPC or
    // service-role implementation with explicit authorization checks.
    return json({ error: "sync_job_creation_failed" }, 500);
  }

  return json({
    mode: "mock",
    message: "Demo sync completed. No external pharmacy was contacted.",
    job
  });
});
